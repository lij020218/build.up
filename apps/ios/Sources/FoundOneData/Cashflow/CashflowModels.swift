//
//  CashflowModels.swift — 현금흐름(Cash-flow Crunch Tracker) 모델.
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/stores/cashflow-store.ts (CashflowState)
//  Supabase: user_store_data.cashflow_settings (jsonb) — 내부 키는 camelCase 그대로.
//  웹과 동일 JSON 구조여야 양방향 동기화됨 (currentBalance, salesChannels, fixedExpenses …).
//

import Foundation

public struct BULocalizedText: Codable, Sendable, Hashable {
    public var ko: String
    public var en: String
    public init(ko: String, en: String) { self.ko = ko; self.en = en }
}

public struct CashflowSalesChannel: Codable, Sendable, Hashable, Identifiable {
    public var id: String
    public var label: BULocalizedText
    public var salesRatio: Double          // 0~100 (%)
    public var settlementDays: Int
    public var commissionRate: Double
    public var paymentFeeRate: Double
    public var isActive: Bool
    public var rateNote: BULocalizedText?

    public init(id: String, label: BULocalizedText, salesRatio: Double, settlementDays: Int,
                commissionRate: Double, paymentFeeRate: Double, isActive: Bool, rateNote: BULocalizedText? = nil) {
        self.id = id; self.label = label; self.salesRatio = salesRatio
        self.settlementDays = settlementDays; self.commissionRate = commissionRate
        self.paymentFeeRate = paymentFeeRate; self.isActive = isActive; self.rateNote = rateNote
    }
}

public struct CashflowFixedExpense: Codable, Sendable, Hashable, Identifiable {
    public var id: String
    public var label: String
    public var amount: Double          // 원
    public var dayOfMonth: Int          // 1~31
    public var category: String         // rent|payroll|loan|utilities|supplies|insurance|subscription|other
    public var isActive: Bool
    public var notes: String?

    public init(id: String, label: String, amount: Double, dayOfMonth: Int,
                category: String, isActive: Bool, notes: String? = nil) {
        self.id = id; self.label = label; self.amount = amount; self.dayOfMonth = dayOfMonth
        self.category = category; self.isActive = isActive; self.notes = notes
    }
}

/// 매출 집계 기준 — 웹 cashflow-store.RevenueBasis 와 동일 JSON (양방향 동기).
///   card: "individual"(PortOne+TossPlace 합산) | "codef"(여신협회 통합)
///   countCashReceipt: 팝빌 현금영수증을 현금매출로 합산할지
public struct RevenueBasis: Codable, Sendable, Hashable {
    public var card: String
    public var countCashReceipt: Bool
    public init(card: String, countCashReceipt: Bool) {
        self.card = card
        self.countCashReceipt = countCashReceipt
    }
}

/// 채널별 매출 내역 1줄 — 매출 카드 breakdown 표시용 (집계 기준으로 실제 합산된 출처만).
public struct RevenueBreakdownEntry: Sendable, Hashable, Identifiable {
    public let source: String   // "portone" | "tossplace" | "codef" | "popbill"
    public let sales: Double
    public var id: String { source }
    public init(source: String, sales: Double) {
        self.source = source
        self.sales = sales
    }
}

public struct CashflowSettings: Codable, Sendable, Hashable {
    public var currentBalance: Double
    public var currentBalanceUpdatedAt: String?
    public var salesChannels: [CashflowSalesChannel]
    public var fixedExpenses: [CashflowFixedExpense]
    public var crisisThresholdDays: Int
    public var notifyOnCrisis: Bool
    public var dailyMorningBriefing: Bool
    public var vatReserveEnabled: Bool
    public var setupCompletedAt: String?
    public var revenueBasis: RevenueBasis?

    /// 설정 완료 여부 — 웹 게이팅과 동일(setupCompletedAt 존재 시 HeroCard 노출).
    public var isConfigured: Bool { setupCompletedAt != nil }

    public init(
        currentBalance: Double = 0,
        currentBalanceUpdatedAt: String? = nil,
        salesChannels: [CashflowSalesChannel] = [],
        fixedExpenses: [CashflowFixedExpense] = [],
        crisisThresholdDays: Int = 3,
        notifyOnCrisis: Bool = true,
        dailyMorningBriefing: Bool = true,
        vatReserveEnabled: Bool = false,
        setupCompletedAt: String? = nil,
        revenueBasis: RevenueBasis? = nil
    ) {
        self.currentBalance = currentBalance
        self.currentBalanceUpdatedAt = currentBalanceUpdatedAt
        self.salesChannels = salesChannels
        self.fixedExpenses = fixedExpenses
        self.crisisThresholdDays = crisisThresholdDays
        self.notifyOnCrisis = notifyOnCrisis
        self.dailyMorningBriefing = dailyMorningBriefing
        self.vatReserveEnabled = vatReserveEnabled
        self.setupCompletedAt = setupCompletedAt
        self.revenueBasis = revenueBasis
    }

    // 빈 jsonb('{}') 나 일부 키 누락도 안전하게 디코딩 (웹과 호환).
    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        currentBalance = try c.decodeIfPresent(Double.self, forKey: .currentBalance) ?? 0
        currentBalanceUpdatedAt = try c.decodeIfPresent(String.self, forKey: .currentBalanceUpdatedAt)
        salesChannels = try c.decodeIfPresent([CashflowSalesChannel].self, forKey: .salesChannels) ?? []
        fixedExpenses = try c.decodeIfPresent([CashflowFixedExpense].self, forKey: .fixedExpenses) ?? []
        crisisThresholdDays = try c.decodeIfPresent(Int.self, forKey: .crisisThresholdDays) ?? 3
        notifyOnCrisis = try c.decodeIfPresent(Bool.self, forKey: .notifyOnCrisis) ?? true
        dailyMorningBriefing = try c.decodeIfPresent(Bool.self, forKey: .dailyMorningBriefing) ?? true
        vatReserveEnabled = try c.decodeIfPresent(Bool.self, forKey: .vatReserveEnabled) ?? false
        setupCompletedAt = try c.decodeIfPresent(String.self, forKey: .setupCompletedAt)
        revenueBasis = try c.decodeIfPresent(RevenueBasis.self, forKey: .revenueBasis)
    }
}
