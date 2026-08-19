//
//  OnboardingProfileSync.swift — 온보딩/위저드에서 입력한 핵심 프로필을 Supabase 에 즉시 반영.
//
//  웹은 zustand store 변경 시 자동 flush 로 business_profiles / user_store_data 에 항상 쓴다.
//  iOS 는 화면별 명시 호출이 필요해, 온보딩에서 정한 "업종·창업유형·영업개시"가 서버에 안 써져
//  웹에서 보이지 않던 divergence 가 반복됐다. 이 헬퍼로 온보딩 완료 시 한 번에 투영한다.
//
//  웹 SSOT 컬럼:
//   • business_profiles.industry_category_id / sub_industry_id / startup_type / capital
//   • user_store_data.business_launched / business_launched_date
//

import Foundation
import Supabase

@MainActor
public enum OnboardingProfileSync {

    /// 업종/세부업종/창업유형/자본금을 business_profiles 에 upsert (제공한 컬럼만 갱신, 나머지 보존).
    public static func persistIndustry(
        categoryId: String?,
        subIndustryId: String?,
        startupType: String? = nil,
        capitalKrw: Int? = nil
    ) {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        func clean(_ s: String?) -> String? {
            let t = s?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return t.isEmpty ? nil : t
        }
        let payload = BusinessProfileUpsert(
            user_id: uid,
            industry_category_id: clean(categoryId),
            sub_industry_id: clean(subIndustryId),
            startup_type: clean(startupType),
            capital: capitalKrw,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        // 모든 값이 비어있으면 호출 의미 없음.
        guard payload.industry_category_id != nil || payload.sub_industry_id != nil
            || payload.startup_type != nil || payload.capital != nil else { return }
        Task.detached {
            _ = try? await client.from("business_profiles").upsert(payload, onConflict: "user_id").execute()
            RealtimeEcho.markLocalWrite(table: "business_profiles")
        }
    }

    /// 선호 지역/상권을 business_profiles.preferred_regions 에 upsert (제공 컬럼만, 나머지 보존).
    ///   웹 SSOT(buildProfilePatchFromState)와 동일하게 단일 원소 배열 `[region]` 로 저장.
    ///   빈 값이면 호출 무시 — 기존 값을 빈 배열로 덮지 않는다(데이터 보호).
    public static func persistPreferredRegion(_ region: String?) {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let trimmed = region?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmed.isEmpty else { return }
        let client = BUSupabase.shared.client
        let payload = PreferredRegionUpsert(
            user_id: uid,
            preferred_regions: [trimmed],
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        Task.detached {
            _ = try? await client.from("business_profiles").upsert(payload, onConflict: "user_id").execute()
            RealtimeEcho.markLocalWrite(table: "business_profiles")
        }
    }

    /// 영업개시 여부/일자를 user_store_data 에 upsert.
    public static func persistBusinessLaunched(_ launched: Bool, launchedDate: Date? = nil) {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client
        let dateStr: String? = launchedDate.map { d in
            let f = DateFormatter()
            f.dateFormat = "yyyy-MM-dd"
            f.timeZone = TimeZone(identifier: "Asia/Seoul")
            return f.string(from: d)
        }
        let payload = LaunchUpsert(
            user_id: uid,
            business_launched: launched,
            business_launched_date: dateStr,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        Task.detached {
            _ = try? await client.from("user_store_data").upsert(payload, onConflict: "user_id").execute()
            RealtimeEcho.markLocalWrite(table: "user_store_data")
        }
    }

    // MARK: - Payloads

    private struct BusinessProfileUpsert: Encodable, Sendable {
        let user_id: UUID
        let industry_category_id: String?
        let sub_industry_id: String?
        let startup_type: String?
        let capital: Int?
        let updated_at: String
    }

    private struct LaunchUpsert: Encodable, Sendable {
        let user_id: UUID
        let business_launched: Bool
        let business_launched_date: String?
        let updated_at: String
    }

    private struct PreferredRegionUpsert: Encodable, Sendable {
        let user_id: UUID
        let preferred_regions: [String]
        let updated_at: String
    }
}
