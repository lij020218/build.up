//
//  UnifiedRevenueService.swift — 자동수집 채널 매출을 구간별로 합산 (웹 useUnifiedRevenue 미러).
//
//  웹과 동일 설계(의회 검증): 채널마다 측정하는 "돈의 구간"이 달라 단순합산=이중계상·단순택1=누락.
//   - 카드구간: basis.card "codef"면 여신협회 통합 1개, "individual"이면 PortOne(온라인)+TossPlace(매장) 합산
//   - 현금구간: countCashReceipt면 팝빌 합산
//   - 정산(통장)은 매출합 제외, 직접소스 0일 때만 CSV>통장 fallback
//  basis 는 cashflow_settings.revenueBasis (웹·iOS 공용). nil이면 연결채널 기준 스마트 기본.
//
//  서버 집계 결과(일별 {date,sales,customers})만 소비 — 웹 /api/integrations/*/daily 호출.
//

import Foundation
import Supabase
import FoundOneCore

@MainActor
public final class UnifiedRevenueService {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    public struct Sources: Sendable {
        public var portone = false
        public var tossplace = false
        public var codef = false
        public var codefBank = false
        public var popbill = false
        public var csv = false
        public var count: Int { [portone, tossplace, codef, codefBank, popbill, csv].filter { $0 }.count }
        public var anyConnected: Bool { count > 0 }
    }

    public struct Result: Sendable {
        public let entries: [DailyEntry]   // 구간별 합산된 일별 매출
        public let breakdown: [RevenueBreakdownEntry]  // 채널별 기간 합계 (집계 기준으로 합산된 출처만)
        public let sources: Sources
        public let cardOverlap: Bool       // 카드매출이 여러 채널에 겹쳐 사용자 선택이 의미있는 상태
        public let basis: RevenueBasis     // 적용된 기준(스마트 기본 포함)
    }

    private enum RevSource: String {
        case portone, tossplace, codef, popbill, csv
        case codefBank = "codef-bank"
    }
    private struct SrcDaily { let date: String; let sales: Double; let customers: Int; let source: RevSource }

    // MARK: - Public

    public func fetch(basis storedBasis: RevenueBasis?, fromDays: Int = 30) async -> Result {
        let fallbackBasis = storedBasis ?? RevenueBasis(card: "individual", countCashReceipt: false)
        guard let token = try? await supabase.auth.session.accessToken else {
            return Result(entries: [], breakdown: [], sources: Sources(), cardOverlap: false, basis: fallbackBasis)
        }

        // ── status (병렬) ──
        async let pS = statusBool("/api/integrations/portone/status", token, .connectedActive)
        async let tS = statusBool("/api/integrations/tossplace/status", token, .connectedActive)
        async let cS = statusBool("/api/integrations/codef/status", token, .connectedActive)
        async let bS = statusBool("/api/integrations/codef/bank/status", token, .accounts)
        async let popS = statusBool("/api/integrations/popbill/status", token, .connection)
        async let csvS = statusBool("/api/integrations/csv/list?fromDays=\(fromDays)", token, .uploads)

        var sources = Sources()
        sources.portone = await pS
        sources.tossplace = await tS
        sources.codef = await cS
        sources.codefBank = await bS
        sources.popbill = await popS
        sources.csv = await csvS

        let basis = Self.effectiveBasis(storedBasis, sources)

        // ── daily (연결된 것만) ──
        var all: [SrcDaily] = []
        if sources.portone { all += await daily("/api/integrations/portone/daily?fromDays=\(fromDays)", token, .portone) }
        if sources.tossplace { all += await daily("/api/integrations/tossplace/daily?fromDays=\(fromDays)", token, .tossplace) }
        if sources.codef { all += await daily("/api/integrations/codef/daily?fromDays=\(fromDays)", token, .codef) }
        if sources.popbill { all += await daily("/api/integrations/popbill/daily?fromDays=\(fromDays)", token, .popbill) }
        if sources.codefBank { all += await daily("/api/integrations/codef/bank/daily?fromDays=\(fromDays)", token, .codefBank) }
        if sources.csv { all += await csvDaily("/api/integrations/csv/list?fromDays=\(fromDays)", token) }

        let merged = Self.segmentMerge(all, basis: basis)
        let breakdown = Self.computeBreakdown(all, basis: basis)
        return Result(entries: merged, breakdown: breakdown, sources: sources, cardOverlap: Self.hasOverlap(sources), basis: basis)
    }

    /// 채널별 매출 내역 — 집계 기준으로 실제 합산되는 출처만 기간 합계 (웹 computeBreakdown 미러).
    private static func computeBreakdown(_ entries: [SrcDaily], basis: RevenueBasis) -> [RevenueBreakdownEntry] {
        var sums: [RevSource: Double] = [:]
        for e in entries { sums[e.source, default: 0] += e.sales }
        var out: [RevenueBreakdownEntry] = []
        func pushIf(_ src: RevSource) {
            let v = sums[src] ?? 0
            if v > 0 { out.append(RevenueBreakdownEntry(source: src.rawValue, sales: v)) }
        }
        if basis.card == "codef" {
            pushIf(.codef)
        } else {
            pushIf(.portone)
            pushIf(.tossplace)
        }
        if basis.countCashReceipt { pushIf(.popbill) }
        return out
    }

    // MARK: - Basis helpers (웹 effectiveRevenueBasis / hasCardOverlap 미러)

    public static func effectiveBasis(_ basis: RevenueBasis?, _ sources: Sources) -> RevenueBasis {
        if let basis { return basis }
        return RevenueBasis(card: sources.codef ? "codef" : "individual", countCashReceipt: false)
    }

    public static func hasOverlap(_ sources: Sources) -> Bool {
        sources.codef && (sources.portone || sources.tossplace)
    }

    // MARK: - Segment merge (웹 segmentMerge 미러)

    private static func segmentMerge(_ entries: [SrcDaily], basis: RevenueBasis) -> [DailyEntry] {
        // date -> source -> 합산된 SrcDaily
        var byDate: [String: [RevSource: SrcDaily]] = [:]
        for e in entries {
            var bucket = byDate[e.date] ?? [:]
            if let prev = bucket[e.source] {
                bucket[e.source] = SrcDaily(date: e.date, sales: prev.sales + e.sales, customers: prev.customers + e.customers, source: e.source)
            } else {
                bucket[e.source] = e
            }
            byDate[e.date] = bucket
        }

        var out: [DailyEntry] = []
        for (date, b) in byDate {
            var sales = 0.0
            var customers = 0
            var hasPrimary = false

            // 카드 구간
            if basis.card == "codef", let c = b[.codef] {
                sales += c.sales; customers += c.customers; hasPrimary = true
            } else {
                if let p = b[.portone] { sales += p.sales; customers += p.customers; hasPrimary = true }
                if let t = b[.tossplace] { sales += t.sales; customers += t.customers; hasPrimary = true }
            }
            // 현금 구간
            if basis.countCashReceipt, let pop = b[.popbill] {
                sales += pop.sales; customers += pop.customers; hasPrimary = true
            }
            // fallback: 직접소스가 "없는" 날만 CSV > 통장(정산).
            //   (직접소스 있는데 전액취소로 순매출 0인 날에 정산금 끌어오는 오표시 방지 — 웹 미러)
            if !hasPrimary {
                if let fb = b[.csv] ?? b[.codefBank] {
                    sales = fb.sales; customers = fb.customers; hasPrimary = true
                }
            }

            if hasPrimary && sales > 0 {
                out.append(DailyEntry(date: date, sales: sales, customers: customers))
            }
        }
        return out.sorted { $0.date < $1.date }
    }

    // MARK: - Networking

    private enum StatusKind { case connectedActive, accounts, connection, uploads }

    private func statusBool(_ path: String, _ token: String, _ kind: StatusKind) async -> Bool {
        guard let obj = await getJSONObject(path, token) else { return false }
        switch kind {
        case .connectedActive:
            return (obj["connected"] as? Bool == true) && (obj["status"] as? String == "active")
        case .accounts:
            return ((obj["accounts"] as? [Any])?.count ?? 0) > 0
        case .connection:
            let conn = obj["connection"] as? [String: Any]
            return (conn?["status"] as? String) == "active"
        case .uploads:
            return ((obj["uploads"] as? [Any])?.count ?? 0) > 0
        }
    }

    private struct DailyResponse: Decodable { let ok: Bool?; let entries: [DailyEntryDTO]? }
    private struct CsvListResponse: Decodable { let dailyEntries: [DailyEntryDTO]? }
    private struct DailyEntryDTO: Decodable { let date: String; let sales: Double?; let customers: Int? }

    private func daily(_ path: String, _ token: String, _ source: RevSource) async -> [SrcDaily] {
        guard let data = await getData(path, token),
              let resp = try? JSONDecoder().decode(DailyResponse.self, from: data),
              resp.ok == true, let entries = resp.entries else { return [] }
        return entries.map { SrcDaily(date: $0.date, sales: $0.sales ?? 0, customers: $0.customers ?? 0, source: source) }
    }

    private func csvDaily(_ path: String, _ token: String) async -> [SrcDaily] {
        guard let data = await getData(path, token),
              let resp = try? JSONDecoder().decode(CsvListResponse.self, from: data),
              let entries = resp.dailyEntries else { return [] }
        return entries.map { SrcDaily(date: $0.date, sales: $0.sales ?? 0, customers: $0.customers ?? 0, source: .csv) }
    }

    private func getData(_ path: String, _ token: String) async -> Data? {
        guard let url = URL(string: baseURL.absoluteString + path) else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 20
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (data, resp) = try? await urlSession.data(for: req),
              let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { return nil }
        return data
    }

    private func getJSONObject(_ path: String, _ token: String) async -> [String: Any]? {
        guard let data = await getData(path, token) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }
}
