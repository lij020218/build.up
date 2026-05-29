//
//  UserDashboardRepository.swift — 웹과 같은 Supabase 사용자 데이터 로더
//
//  웹의 `loadStoreData` / `loadBusinessProfile` / `loadRoadmapState`가 읽는
//  테이블을 iOS 홈 화면용 snapshot 으로 합칩니다.
//

import Foundation
import Supabase
import FoundOneCore

public struct UserDashboardSnapshot: Sendable, Hashable {
    public let profile: DashboardProfile
    public let entries: [DailyEntry]
    public let costs: MonthlyCosts?
}

public actor UserDashboardRepository {
    private let supabase: SupabaseClient
    private let userId: UUID
    private let fallbackUserName: String

    public init(supabase: SupabaseClient, userId: UUID, fallbackUserName: String) {
        self.supabase = supabase
        self.userId = userId
        self.fallbackUserName = fallbackUserName
    }

    public func fetchSnapshot() async throws -> UserDashboardSnapshot {
        async let storeData = fetchStoreData()
        async let businessProfile = fetchBusinessProfile()
        async let roadmap = fetchLatestRoadmap()

        let loadedStore = try await storeData
        let loadedProfile = try await businessProfile
        let loadedRoadmap = try await roadmap

        let businessLaunched = loadedStore?.business_launched ?? false
        let launchedDate = loadedStore?.business_launched_date
        let daysSinceLaunch = businessLaunched ? Self.daysSince(launchedDate) : 0
        let category = Self.category(from: loadedProfile?.industry_category_id)
        let stage = Self.stage(
            businessLaunched: businessLaunched,
            daysSinceLaunch: daysSinceLaunch,
            roadmapStageCode: loadedRoadmap?.current_stage_code
        )
        let currentCash = loadedStore?.current_balance_manual_krw ?? loadedProfile?.capital

        let profile = DashboardProfile(
            // ⚠️ 2026-05-25: server 에 store_name 없으면 빈 문자열. ProfileView 가 isEmpty 체크
            //   해서 "가게 이름을 입력해 주세요" 자리표시자 표시. 이전엔 "내 가게" 자리표시자가
            //   하드코딩되어 reset 후에도 자연스럽게 빈 상태로 보이지 않음.
            storeName: Self.nonEmpty(loadedStore?.store_name) ?? "",
            userName: fallbackUserName,
            daysSinceLaunch: daysSinceLaunch,
            businessLaunched: businessLaunched,
            category: category,
            stage: stage,
            currentCash: currentCash
        )

        return UserDashboardSnapshot(
            profile: profile,
            entries: loadedStore?.daily_entries ?? [],
            costs: loadedStore?.monthly_costs
        )
    }

    private func fetchStoreData() async throws -> UserStoreDataDTO? {
        let rows: [UserStoreDataDTO] = try await supabase
            .from("user_store_data")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        return rows.first
    }

    private func fetchBusinessProfile() async throws -> BusinessProfileDTO? {
        let rows: [BusinessProfileDTO] = try await supabase
            .from("business_profiles")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        return rows.first
    }

    private func fetchLatestRoadmap() async throws -> RoadmapDTO? {
        let rows: [RoadmapDTO] = try await supabase
            .from("roadmaps")
            .select()
            .eq("user_id", value: userId)
            .order("updated_at", ascending: false)
            .limit(1)
            .execute()
            .value

        return rows.first
    }

    private static func nonEmpty(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func daysSince(_ isoDate: String?) -> Int {
        guard let isoDate, let date = Self.dateFormatter.date(from: isoDate) else { return 0 }
        return max(0, Calendar(identifier: .gregorian).dateComponents([.day], from: date, to: Date()).day ?? 0)
    }

    private static func category(from raw: String?) -> IndustryCategory {
        switch raw {
        case "restaurant", "food", "offline-food":
            return .restaurant
        case "cafe", "dessert", "bakery":
            return .cafe
        case "beauty", "salon":
            return .beauty
        case "retail":
            return .retail
        case "ecommerce", "online-store":
            return .ecommerce
        case "fitness", "pilates":
            return .fitness
        case "education", "academy":
            return .education
        case "pet":
            return .pet
        case "living-service", "livingService", "cleaning":
            return .livingService
        case "space", "rental-space":
            return .space
        case "startup-tech", "startupTech", "saas":
            return .startupTech
        default:
            return .general
        }
    }

    private static func stage(
        businessLaunched: Bool,
        daysSinceLaunch: Int,
        roadmapStageCode: String?
    ) -> HealthScore.BusinessMaturity {
        guard businessLaunched else { return .early }
        if daysSinceLaunch >= 730 { return .mature }
        if roadmapStageCode == "scale-growth" { return .mature }
        return .growth
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        return formatter
    }()
}

private struct UserStoreDataDTO: Decodable, Sendable, Hashable {
    let store_name: String?
    let business_launched: Bool?
    let business_launched_date: String?
    let current_balance_manual_krw: Double?
    let monthly_costs: MonthlyCosts?
    let daily_entries: [DailyEntry]?
}

private struct BusinessProfileDTO: Decodable, Sendable, Hashable {
    let industry_category_id: String?
    let capital: Double?
}

private struct RoadmapDTO: Decodable, Sendable, Hashable {
    let current_stage_code: String?
    let progress_percent: Double?
    let updated_at: String?
}
