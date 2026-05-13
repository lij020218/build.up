//
//  Models.swift — build.up 핵심 데이터 모델
//
//  웹 (packages/shared 및 useDashboard.ts) 의 DailyEntry / MonthlyCosts 와 같은 shape.
//  pure Swift / Sendable / Foundation 만 의존 — UI / Supabase 의존성 없음.
//

import Foundation

// MARK: - DailyEntry (매출 1일 기록)

public struct DailyEntry: Sendable, Hashable, Identifiable, Codable {
    /// "yyyy-MM-dd" — Supabase 와 동일 format
    public let date: String
    public let sales: Double
    public let customers: Int

    public var id: String { date }

    public init(date: String, sales: Double, customers: Int) {
        self.date = date
        self.sales = sales
        self.customers = customers
    }
}

// MARK: - MonthlyCosts (월 비용 구조)

public struct MonthlyCosts: Sendable, Hashable, Codable {
    public var ingredients: Double
    public var labor: Double
    public var rent: Double
    public var utilities: Double
    public var sga: Double
    public var marketing: Double
    public var other: Double
    public var interest: Double

    public init(
        ingredients: Double = 0,
        labor: Double = 0,
        rent: Double = 0,
        utilities: Double = 0,
        sga: Double = 0,
        marketing: Double = 0,
        other: Double = 0,
        interest: Double = 0
    ) {
        self.ingredients = ingredients
        self.labor = labor
        self.rent = rent
        self.utilities = utilities
        self.sga = sga
        self.marketing = marketing
        self.other = other
        self.interest = interest
    }

    public var total: Double {
        ingredients + labor + rent + utilities + sga + marketing + other + interest
    }
}

// MARK: - IndustryCategory (업종)

public enum IndustryCategory: String, Sendable, CaseIterable, Codable {
    case restaurant      // 외식
    case cafe            // 카페·디저트·베이커리
    case beauty          // 미용·살롱
    case retail          // 소매
    case ecommerce       // 온라인 쇼핑몰
    case fitness         // 피트니스·필라테스
    case education       // 학원·교육
    case pet             // 펫·동물병원
    case livingService   // 청소·세탁·생활서비스
    case space           // 공간 렌탈·코워킹·스튜디오
    case startupTech     // 스타트업·SaaS
    case general         // 분류 미정 (보수적 기본)

    /// 한국어 라벨
    public var labelKo: String {
        switch self {
        case .restaurant:    return "외식"
        case .cafe:          return "카페·디저트"
        case .beauty:        return "미용"
        case .retail:        return "소매"
        case .ecommerce:     return "이커머스"
        case .fitness:       return "피트니스"
        case .education:     return "학원"
        case .pet:           return "펫"
        case .livingService: return "생활 서비스"
        case .space:         return "공간 렌탈"
        case .startupTech:   return "스타트업"
        case .general:       return "일반"
        }
    }

    /// 외식·카페·미용 등 오프라인 vs 스타트업·이커머스 등 디지털
    public var isDigital: Bool {
        switch self {
        case .startupTech, .ecommerce: return true
        default: return false
        }
    }
}

// MARK: - DomainKey (4영역 건강 도메인)

public enum DomainKey: String, Sendable, CaseIterable, Codable {
    case cash        // 현금 흐름
    case profit      // 수익성
    case efficiency  // 비용 효율
    case growth      // 성장

    public var labelKo: String {
        switch self {
        case .cash:       return "현금 흐름"
        case .profit:     return "수익성"
        case .efficiency: return "비용 효율"
        case .growth:     return "성장"
        }
    }
}

// MARK: - RiskSignal (위험 신호 1건)

/// CEOMorningHero Row 1.5 에서 렌더되는 신호 1건.
/// useMorningBriefingBrain.riskSignals 타입과 1:1 매핑.
public struct RiskSignal: Sendable, Hashable, Identifiable {
    public let id = UUID()
    public let grade: HealthGrade
    public let title: String
    public let message: String

    public init(grade: HealthGrade, title: String, message: String) {
        self.grade = grade
        self.title = title
        self.message = message
    }
}

// MARK: - HealthGrade (BuildUpDesignSystem 과 동일 정의 — 중복 회피)

/// ⚠️ BuildUpDesignSystem.HealthGrade 와 같은 값. Core 모듈은 DesignSystem 의존성 없음 →
///   두 곳에 정의해야 하나, 같은 cutoff 알고리즘을 보장.
public enum HealthGrade: String, Sendable, CaseIterable, Codable {
    case healthy
    case caution
    case warning
    case critical
    case unknown

    /// 0~100 점수 → 등급 (웹 gradeFromScore 거울)
    public static func from(score: Double) -> HealthGrade {
        guard score.isFinite else { return .unknown }
        if score >= 75 { return .healthy }
        if score >= 55 { return .caution }
        if score >= 35 { return .warning }
        return .critical
    }
}
