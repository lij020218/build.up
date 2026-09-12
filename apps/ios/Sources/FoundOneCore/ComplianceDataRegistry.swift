//
//  ComplianceDataRegistry.swift — 앱·플랫폼 규제·계약 도구 데이터(JSON) 디코드 + 선택기·해석기 로직 미러.
//
//  웹 SSOT: packages/shared/src/compliance/*.ts
//  생성:    scripts/gen-compliance-json.mts → compliance-data.json (Resources 심볼릭 링크)
//
//  데이터는 JSON 으로 공유하고, 순수 로직(recommendIdentityChannel · decodeDocumentRequest)만 Swift 로 미러한다.
//  PG 프리체크 검사는 서버(/api/compliance/pg-precheck)가 수행 → iOS 는 결과만 렌더(PgPrecheckService).
//  ⚠️ 로직을 바꾸면 identity-channels.ts / doc-request.ts 와 같은 커밋에서 바꾼다(테스트: compliance-tools.test.ts).
//

import Foundation

public struct BUComplianceData: Decodable, Sendable {
    public let identityChannels: [BUIdentityChannel]
    public let portoneConsoleStepsIdentityOnly: [String]
    public let pgPrecheckRules: [BUPrecheckRule]
    public let appOnlyNote: String
    public let docTerms: [BUDocTerm]
}

public struct BUIdentityChannel: Decodable, Sendable, Hashable, Identifiable {
    public struct Plan: Decodable, Sendable, Hashable {
        public let monthlyKrw: Int
        public let cases: Int
    }
    public struct Source: Decodable, Sendable, Hashable {
        public let label: String
        public let url: String
    }
    public let id: String
    public let name: String
    public let method: String
    public let plans: [Plan]?
    public let perCaseKrw: Int?
    public let joinFeeViaPortoneKrw: Int?
    public let joinFeeDirectKrw: Int?
    public let returnsGender: Bool?
    public let returnsForeigner: Bool?
    public let testBeforeContract: Bool?
    public let testNote: String
    public let suretyBond: Bool?
    public let suretyNote: String
    public let contractLeadTime: String
    public let documents: [String]
    public let quoteContact: String?
    public let sources: [Source]
}

public struct BUPrecheckRule: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let label: String
    public let severity: String   // reject | warn | info
    public let rejectAs: String
    public let fix: String
    public let how: String
}

public struct BUDocTerm: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let term: String
    public let aliases: [String]
    public let meaning: String
    public let whereLabel: String
    public let format: String
    public let checklist: String

    private enum CodingKeys: String, CodingKey {
        case id, term, aliases, meaning, format, checklist
        case whereLabel = "where"
    }
}

public enum ComplianceDataRegistry {
    public static let data: BUComplianceData? = load()

    private static func load() -> BUComplianceData? {
        guard let url = Bundle.module.url(forResource: "compliance-data", withExtension: "json") else {
            print("⚠️ compliance-data.json 번들 누락")
            return nil
        }
        do {
            return try JSONDecoder().decode(BUComplianceData.self, from: try Data(contentsOf: url))
        } catch {
            print("⚠️ compliance-data.json 디코딩 실패: \(error)")
            return nil
        }
    }
}

// MARK: - 선택기 (identity-channels.ts recommendIdentityChannel 미러)

public struct BUIdentityRequirements: Sendable, Hashable {
    public var needsGender: Bool
    public var needsForeigner: Bool
    public var monthlyCases: Int
    public var needsPreLaunchTest: Bool
    public var acceptsPayments: Bool
    public init(needsGender: Bool = true, needsForeigner: Bool = false, monthlyCases: Int = 300, needsPreLaunchTest: Bool = false, acceptsPayments: Bool = false) {
        self.needsGender = needsGender
        self.needsForeigner = needsForeigner
        self.monthlyCases = monthlyCases
        self.needsPreLaunchTest = needsPreLaunchTest
        self.acceptsPayments = acceptsPayments
    }
}

public struct BUChannelVerdict: Sendable, Hashable, Identifiable {
    public enum Status: String, Sendable { case recommended, possible, excluded }
    public var id: String { channelId }
    public let channelId: String
    public let name: String
    public var status: Status
    public let reasons: [String]
    public let monthlyCostLabel: String
    public let monthlyCostKrw: Int?
    public let warnings: [String]
}

public struct BUIdentityRecommendation: Sendable {
    public let verdicts: [BUChannelVerdict]
    public let consoleSteps: [String]
    public let globalWarnings: [String]
}

public enum IdentityChannelPicker {

    static let cardPgTrap =
        "33만 원(카드 PG 가입비 30만 + VAT) 결제 화면이 뜨면 결제하지 마세요 — 결제 안 받는 앱은 해당 없음. 본인인증은 포트원 경유 가입비 무료(구함 콘솔 실측, 2026-09)."

    public static func pickPlan(_ plans: [BUIdentityChannel.Plan], monthlyCases: Int) -> BUIdentityChannel.Plan? {
        plans.sorted { $0.cases < $1.cases }.first { $0.cases >= max(0, monthlyCases) }
    }

    private static func krw(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "ko_KR")
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    private static func cost(_ ch: BUIdentityChannel, monthlyCases: Int) -> (label: String, krw: Int?) {
        if let plans = ch.plans {
            guard let plan = pickPlan(plans, monthlyCases: monthlyCases) else {
                return ("월 \(krw(monthlyCases))건은 공개 요금제(최대 7,200건) 초과 — 견적 문의", nil)
            }
            return ("월정액 \(krw(plan.monthlyKrw))원 (\(krw(plan.cases))건 요금제)", plan.monthlyKrw)
        }
        if let per = ch.perCaseKrw {
            let total = per * max(0, monthlyCases)
            return ("건당 \(per)원 × \(krw(monthlyCases))건 = 약 \(krw(total))원", total)
        }
        if let q = ch.quoteContact { return ("견적 문의 — \(q)", nil) }
        return ("견적 문의", nil)
    }

    public static func recommend(_ req: BUIdentityRequirements, data: BUComplianceData) -> BUIdentityRecommendation {
        var verdicts: [BUChannelVerdict] = data.identityChannels.map { ch in
            var reasons: [String] = []
            var warnings: [String] = []
            var excluded = false

            if req.needsGender, ch.returnsGender == false { excluded = true; reasons.append("성별을 응답하지 않음 — 성별이 필요한 서비스엔 부적합") }
            if req.needsGender, ch.returnsGender == true { reasons.append("성별 반환") }
            if req.needsGender, ch.returnsGender == nil { warnings.append("성별 반환 여부 미확인 — 계약 전 확인") }

            if req.needsForeigner, ch.returnsForeigner == false { excluded = true; reasons.append("내외국인을 응답하지 않음") }
            if req.needsForeigner, ch.returnsForeigner == true { reasons.append("내외국인 반환") }
            if req.needsForeigner, ch.returnsForeigner == nil { warnings.append("내외국인 반환 여부 미확인 — 계약 전 확인") }

            if req.needsPreLaunchTest {
                if ch.testBeforeContract == true { reasons.append("계약 전 테스트 가능 — 출시 전 검증 OK") }
                if ch.testBeforeContract == false { warnings.append("계약 전 테스트 불가 — \(ch.testNote)") }
                if ch.testBeforeContract == nil { warnings.append("테스트 환경 미확인 — 계약 전 확인") }
            }

            let c = cost(ch, monthlyCases: req.monthlyCases)
            if ch.suretyBond == true { warnings.append("보증보험 필요 — \(ch.suretyNote)") }

            return BUChannelVerdict(channelId: ch.id, name: ch.name, status: excluded ? .excluded : .possible,
                                    reasons: reasons, monthlyCostLabel: c.label, monthlyCostKrw: c.krw, warnings: warnings)
        }

        func rank(_ v: BUChannelVerdict) -> Double {
            guard let ch = data.identityChannels.first(where: { $0.id == v.channelId }) else { return 0 }
            var score = 0.0
            if req.needsPreLaunchTest, ch.testBeforeContract == true { score += 100 }
            if req.needsPreLaunchTest, ch.testBeforeContract == false { score -= 50 }
            if let k = v.monthlyCostKrw { score += 20; score -= Double(k) / 100_000 }
            return score
        }
        if let topId = verdicts.filter({ $0.status != .excluded }).max(by: { rank($0) < rank($1) })?.channelId,
           let idx = verdicts.firstIndex(where: { $0.channelId == topId }) {
            verdicts[idx].status = .recommended
        }
        let order: [BUChannelVerdict.Status: Int] = [.recommended: 0, .possible: 1, .excluded: 2]
        verdicts.sort { (order[$0.status] ?? 9) < (order[$1.status] ?? 9) }

        return BUIdentityRecommendation(
            verdicts: verdicts,
            consoleSteps: req.acceptsPayments ? [] : data.portoneConsoleStepsIdentityOnly,
            globalWarnings: req.acceptsPayments ? [] : [cardPgTrap]
        )
    }
}

// MARK: - 서류 요청 해석기 (doc-request.ts decodeDocumentRequest 미러)

public struct BUDocMatch: Sendable, Hashable, Identifiable {
    public var id: String { term.id }
    public let term: BUDocTerm
    public let hits: [String]
}

public struct BUDocRequestDecoded: Sendable {
    public let matches: [BUDocMatch]
    public let checklist: [String]
    public let eContractHint: String?
}

public enum DocRequestDecoder {
    public static func decode(_ text: String, data: BUComplianceData) -> BUDocRequestDecoded {
        let norm = text.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ").lowercased()
        var matches: [BUDocMatch] = []
        for term in data.docTerms {
            let hits = term.aliases.filter { alias in
                let a = alias.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ").lowercased()
                return norm.contains(a)
            }
            if !hits.isEmpty { matches.append(BUDocMatch(term: term, hits: hits)) }
        }
        // '사본' 단독 항목은 맨 뒤(TS 와 동일).
        let copyMatches = matches.filter { $0.term.id == "copy" }
        matches = matches.filter { $0.term.id != "copy" } + copyMatches
        var seen = Set<String>()
        let checklist = matches.map(\.term.checklist).filter { seen.insert($0).inserted }
        let eContract = matches.contains { $0.term.id == "e-contract" }
        return BUDocRequestDecoded(
            matches: matches,
            checklist: checklist,
            eContractHint: eContract ? "전자계약이 언급됐습니다 — 인감증명서·원본 우편은 생략될 수 있으니 담당자에게 확정 목록을 요청하세요." : nil
        )
    }
}
