//
//  HeroResolver.swift — Hero 분기 라우터 (resolveHero 미러)
//
//  웹 SSOT 거울 — apps/web/app/lib/components/dashboard/heroInsight.tsx 의 resolveHero.
//
//  우선순위 (높음 → 낮음):
//   0. stale-sales  — 매출 미기록 3일+
//   1. crisis       — Cashflow 위기 (현금 N일 후 부족)
//   1.5 anomaly     — 룰 기반 이상 (이익률 -3%p+ 하락 등)
//   1.6 industry-rule — 11 업종 임계값 룰
//   2. reorder-urgent — 재고 ≤ 2일
//   3. ai-action    — AI 코칭 1순위 (LLM)
//   4. agent        — 쿠폰/콘텐츠/리뷰 제안
//   5. industry-insight — 업종 평균 인사이트 (LLM)
//   6. drucker      — 기본 fallback (오늘의 질문)
//

import Foundation

// MARK: - Hero source / tone / CTA

public enum HeroSource: String, Sendable, Codable {
    case staleSales = "stale-sales"
    case crisis
    case anomaly
    case industryRule = "industry-rule"
    case reorderUrgent = "reorder-urgent"
    case aiAction = "ai-action"
    case agent
    case industry
    case drucker
}

public enum HeroTone: String, Sendable, Codable {
    case crisis
    case warning
    case neutral
}

/// CTA 클릭 시 안내 대상 — 웹 HeroCtaTarget 거울
public enum HeroCtaTarget: String, Sendable, Codable {
    case sales        // 매출 입력
    case users        // 고객 변화
    case cashflow     // 현금 흐름
    case costs        // 비용 관리
    case inventory    // 재고
    case team         // 팀
    case primeCost    // 프라임코스트
    case marketing    // 마케팅
    case operations   // 운영 리추얼
}

// MARK: - Hero (resolveHero 반환 타입)

public struct Hero: Sendable, Hashable, Identifiable {
    public let id = UUID()
    public let source: HeroSource
    public let tone: HeroTone

    public let tagKo: String
    public let tagEn: String
    public let analysisKo: String
    public let analysisEn: String
    public let actionKo: String
    public let actionEn: String
    public let ctaKo: String
    public let ctaEn: String
    public let ctaTarget: HeroCtaTarget

    public let agentProposalId: String?
    public let referencedCase: ReferencedCase?
    public let sourceLabel: String?
    public let priority: Priority?

    public struct ReferencedCase: Sendable, Hashable, Codable {
        public let id: String
        public let name: String
        public init(id: String, name: String) {
            self.id = id
            self.name = name
        }
    }

    public enum Priority: String, Sendable, Codable {
        case high, medium, low
    }

    public init(
        source: HeroSource,
        tone: HeroTone,
        tagKo: String, tagEn: String,
        analysisKo: String, analysisEn: String,
        actionKo: String, actionEn: String,
        ctaKo: String, ctaEn: String,
        ctaTarget: HeroCtaTarget,
        agentProposalId: String? = nil,
        referencedCase: ReferencedCase? = nil,
        sourceLabel: String? = nil,
        priority: Priority? = nil
    ) {
        self.source = source
        self.tone = tone
        self.tagKo = tagKo; self.tagEn = tagEn
        self.analysisKo = analysisKo; self.analysisEn = analysisEn
        self.actionKo = actionKo; self.actionEn = actionEn
        self.ctaKo = ctaKo; self.ctaEn = ctaEn
        self.ctaTarget = ctaTarget
        self.agentProposalId = agentProposalId
        self.referencedCase = referencedCase
        self.sourceLabel = sourceLabel
        self.priority = priority
    }
}

// MARK: - HeroResolver inputs

public struct HeroResolverInput: Sendable {
    public let ko: Bool
    public let businessLaunched: Bool
    public let totalEntries: Int
    public let daysSinceLastSalesEntry: Int?
    public let monthlyBurn: Double                  // 월 비용 합
    public let cashflowCrisis: CashflowCrisis?
    public let topAnomaly: Anomaly?
    /// 우선순위 정렬된 AI 행동 추천 — 웹 SSOT: aiActions.todayActions
    /// Hero 카드엔 첫 번째만, "오늘의 집중" popup 엔 전체 3개 (high → low priority).
    public let aiTopActions: [AiAction]
    public let categoryId: String?

    /// 단일 액션 fallback (예전 코드 호환) — aiTopActions.first.
    public var aiTopAction: AiAction? { aiTopActions.first }

    public init(
        ko: Bool,
        businessLaunched: Bool,
        totalEntries: Int,
        daysSinceLastSalesEntry: Int?,
        monthlyBurn: Double,
        cashflowCrisis: CashflowCrisis? = nil,
        topAnomaly: Anomaly? = nil,
        aiTopActions: [AiAction] = [],
        categoryId: String? = nil
    ) {
        self.ko = ko
        self.businessLaunched = businessLaunched
        self.totalEntries = totalEntries
        self.daysSinceLastSalesEntry = daysSinceLastSalesEntry
        self.monthlyBurn = monthlyBurn
        self.cashflowCrisis = cashflowCrisis
        self.topAnomaly = topAnomaly
        self.aiTopActions = aiTopActions
        self.categoryId = categoryId
    }

    /// 이전 단일-액션 init — 호환 유지.
    public init(
        ko: Bool,
        businessLaunched: Bool,
        totalEntries: Int,
        daysSinceLastSalesEntry: Int?,
        monthlyBurn: Double,
        cashflowCrisis: CashflowCrisis? = nil,
        topAnomaly: Anomaly? = nil,
        aiTopAction: AiAction?,
        categoryId: String? = nil
    ) {
        self.init(
            ko: ko, businessLaunched: businessLaunched,
            totalEntries: totalEntries,
            daysSinceLastSalesEntry: daysSinceLastSalesEntry,
            monthlyBurn: monthlyBurn,
            cashflowCrisis: cashflowCrisis,
            topAnomaly: topAnomaly,
            aiTopActions: aiTopAction.map { [$0] } ?? [],
            categoryId: categoryId
        )
    }
}

public struct CashflowCrisis: Sendable {
    public let daysUntilCrisis: Int
    public let shortfallAmount: Double
    public init(daysUntilCrisis: Int, shortfallAmount: Double) {
        self.daysUntilCrisis = daysUntilCrisis
        self.shortfallAmount = shortfallAmount
    }
}

public struct Anomaly: Sendable {
    public let severity: HealthGrade   // critical/warning 만 hero 노출
    public let kind: Kind
    public let headline: String
    public let analysis: String
    public let action: String

    public enum Kind: String, Sendable {
        case costSpike       = "cost-spike"
        case primeCostBreach = "prime-cost-breach"
        case laborRatioHigh  = "labor-ratio-high"
        case customerDecline = "customer-decline"
        case newCustomerLow  = "new-customer-low"
        case salesDrop       = "sales-drop"
    }

    public init(severity: HealthGrade, kind: Kind, headline: String, analysis: String, action: String) {
        self.severity = severity
        self.kind = kind
        self.headline = headline
        self.analysis = analysis
        self.action = action
    }
}

public struct AiAction: Sendable {
    public let title: String
    public let reason: String
    public let priority: Hero.Priority
    public let referencedCase: Hero.ReferencedCase?

    public init(title: String, reason: String, priority: Hero.Priority, referencedCase: Hero.ReferencedCase? = nil) {
        self.title = title
        self.reason = reason
        self.priority = priority
        self.referencedCase = referencedCase
    }
}

// MARK: - HeroResolver

public enum HeroResolver {

    /// 우선순위에 따라 Hero 1개 결정 (resolveHero 거울).
    public static func resolve(_ input: HeroResolverInput) -> Hero {

        // ko 는 메시지 생성 시 분기에 사용 (현재는 모두 같은 ko/en 동시 작성)
        _ = input.ko

        // ── 0. stale-sales — 매출 미기록 3일+ ──
        if input.businessLaunched,
           input.totalEntries > 0,
           let days = input.daysSinceLastSalesEntry,
           days >= 3
        {
            let accumLossWon = input.monthlyBurn > 0
                ? Int(round((input.monthlyBurn / 30) * Double(days)))
                : 0
            let accumLossManwon = accumLossWon / 10_000
            let hasBurn = input.monthlyBurn > 0

            return Hero(
                source: .staleSales,
                tone: .warning,
                tagKo: "AI 진단 — 데이터는 부족하지만 가능한 추정",
                tagEn: "AI Diagnosis — best estimate from available data",
                analysisKo: hasBurn
                    ? "최근 \(days)일간 새 매출 기록이 없네요. 월 비용 \(formatWon(input.monthlyBurn, ko: true))이 계속 나가고 있어 누적 손실은 약 \(accumLossManwon.formatted())만원으로 추정합니다. 오늘 매출 한 번만 입력하시면 진단 정확도가 70%+ 로 올라갑니다."
                    : "최근 \(days)일간 새 매출 기록이 없네요. 비용 데이터가 없어 손실 추정도 어렵습니다. 오늘 매출 + 월 비용 입력하시면 정확한 손익 진단이 가능합니다.",
                analysisEn: hasBurn
                    ? "\(days) days without new sales entries. Monthly burn of \(formatWon(input.monthlyBurn, ko: false)) continues — estimated accumulated loss ~\(formatWon(Double(accumLossWon), ko: false)). Just one sales entry will boost diagnostic accuracy to 70%+."
                    : "\(days) days without new sales entries. No cost data either — can't estimate loss. Add today's sales + monthly costs for accurate P&L diagnosis.",
                actionKo: "5초면 됩니다. 매출 한 건만 기록해 주세요.",
                actionEn: "Takes 5 seconds. Just log today's sales.",
                ctaKo: "매출 기록하러 가기",
                ctaEn: "Log sales",
                ctaTarget: .sales
            )
        }

        // ── 1. Cashflow 위기 ──
        if let crisis = input.cashflowCrisis {
            return Hero(
                source: .crisis,
                tone: .crisis,
                tagKo: "사장님, 솔직히 말씀드릴게요",
                tagEn: "Let's be honest",
                analysisKo: "\(crisis.daysUntilCrisis)일 후 통장 잔고가 \(formatWon(-crisis.shortfallAmount, ko: true)) 부족할 수 있어요. 지금이 가장 중요한 순간입니다.",
                analysisEn: "In \(crisis.daysUntilCrisis) days your balance may fall short by \(formatWon(-crisis.shortfallAmount, ko: false)). This is the moment that matters.",
                actionKo: "현금흐름 레이더에 광고비 감액·공급처 연기·긴급자금 등 7가지 해결책 준비해뒀어요.",
                actionEn: "Cash-flow Radar has 7 one-tap solutions ready.",
                ctaKo: "해결책 같이 보기",
                ctaEn: "Solve together",
                ctaTarget: .cashflow
            )
        }

        // ── 1.5 룰 기반 이상 ──
        if let anomaly = input.topAnomaly,
           anomaly.severity == .critical || anomaly.severity == .warning
        {
            let tone: HeroTone = anomaly.severity == .critical ? .crisis : .warning
            let baseTag = anomaly.severity == .critical ? "이상 신호" : "주의 신호"
            let target: HeroCtaTarget
            switch anomaly.kind {
            case .costSpike, .primeCostBreach, .laborRatioHigh:
                target = .costs
            case .customerDecline, .newCustomerLow:
                target = .users
            case .salesDrop:
                target = .sales
            }
            return Hero(
                source: .anomaly,
                tone: tone,
                tagKo: baseTag,
                tagEn: anomaly.severity == .critical ? "Critical Signal" : "Watch Signal",
                analysisKo: "\(anomaly.headline). \(anomaly.analysis)",
                analysisEn: "\(anomaly.headline). \(anomaly.analysis)",
                actionKo: anomaly.action,
                actionEn: anomaly.action,
                ctaKo: "상세 보기",
                ctaEn: "See details",
                ctaTarget: target
            )
        }

        // ── 3. AI 액션 ──
        if let action = input.aiTopAction {
            return Hero(
                source: .aiAction,
                tone: action.priority == .high ? .warning : .neutral,
                tagKo: "오늘의 집중",
                tagEn: "Today's focus",
                analysisKo: action.reason,
                analysisEn: action.reason,
                actionKo: action.title,
                actionEn: action.title,
                ctaKo: "확인하기",
                ctaEn: "Take action",
                ctaTarget: inferActionTarget(title: action.title, reason: action.reason),
                referencedCase: action.referencedCase
            )
        }

        // ── 6. Drucker fallback ──
        return Hero(
            source: .drucker,
            tone: .neutral,
            tagKo: "오늘의 질문",
            tagEn: "Today's question",
            analysisKo: "매일 5초, 매출 한 건을 기록하면 Found.One이 매일 달라지는 경영 인사이트를 드립니다.",
            analysisEn: "Log one sale daily — Found.One will deliver fresh business insights each day.",
            actionKo: "오늘 가장 중요한 한 가지는 무엇인가요?",
            actionEn: "What's the one important thing today?",
            ctaKo: "매출 기록하기",
            ctaEn: "Log sales",
            ctaTarget: .sales
        )
    }

    // MARK: - inferActionTarget (웹 inferActionCtaTarget 거울)

    /// AI top action 문자열 → ctaTarget 추론. 구체적 → 일반적 순서.
    public static func inferActionTarget(title: String, reason: String) -> HeroCtaTarget {
        let text = "\(title) \(reason)".lowercased()

        // 1. inventory
        if matches(text, patterns: ["메뉴", "레시피", "재료", "식재료", "식자재", "원자재", "재고", "품절", "재주문", "발주", "공급처", "단가", "sku", "inventory", "stockout", "reorder"]) {
            return .inventory
        }
        // 2. team
        if matches(text, patterns: ["직원", "노무", "4대보험", "퇴직금", "시급", "최저임금", "근로계약", "payroll", "staffing", "hire", "employee"]) {
            return .team
        }
        // 3. primeCost
        if matches(text, patterns: ["프라임코스트", "prime cost", "primecost"]) {
            return .primeCost
        }
        // 4. cashflow
        if matches(text, patterns: ["현금", "런웨이", "runway", "잔고", "수금", "지급", "긴급자금", "대출", "상환", "cash flow", "burn"]) {
            return .cashflow
        }
        // 5. marketing
        if matches(text, patterns: ["광고", "마케팅", "캠페인", "인스타", "페이스북", "네이버", "유튜브", "틱톡", "숏폼", "sns", "콘텐츠", "campaign", "ads"]) {
            return .marketing
        }
        // 6. users
        if matches(text, patterns: ["고객", "단골", "재방문", "리텐션", "retention", "이탈", "구매자", "회원", "customer", "dau", "wau", "mau"]) {
            return .users
        }
        // 7. operations
        if matches(text, patterns: ["측정", "시간", "속도", "회전", "병목", "동선", "조리", "폐기", "준비", "응대", "throughput", "ops"]) {
            return .operations
        }
        // 8. costs
        if matches(text, patterns: ["임대료", "공과금", "관리비", "판관비", "이익률", "마진", "cogs", "fixed cost", "overhead", "비용 구조"]) {
            return .costs
        }
        // 9. fallback
        return .sales
    }

    private static func matches(_ text: String, patterns: [String]) -> Bool {
        for p in patterns where text.contains(p) { return true }
        return false
    }

    // MARK: - Helper formatters

    private static func formatWon(_ value: Double, ko: Bool) -> String {
        let v = Int(round(value))
        let abs = Swift.abs(v)
        let sign = v < 0 ? "−" : ""
        if ko {
            if abs >= 100_000_000 {
                return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억"
            }
            if abs >= 10_000 {
                return "\(sign)\(abs / 10_000)만"
            }
            return "\(sign)\(abs.formatted())원"
        }
        if abs >= 1_000_000 {
            return "\(sign)$\(String(format: "%.1fM", Double(abs) / 1_000_000))"
        }
        if abs >= 1_000 {
            return "\(sign)$\(abs / 1_000)K"
        }
        return "\(sign)$\(abs.formatted())"
    }
}
