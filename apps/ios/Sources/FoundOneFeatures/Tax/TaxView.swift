//
//  TaxView.swift — 세금 화면 (웹 TaxSurface 미러, 2026-07-22)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/TaxSurface.tsx
//  3섹션: ① 세금 계산(과세유형·부가세·종소세 — TaxEstimate) ② 세액공제·감면(TaxDataRegistry)
//         ③ 신고 일정(TaxDataRegistry.events).
//  ⚠️ 전부 예상치·자격안내까지만 — 최종 세액·자격은 홈택스·세무사 (각 섹션 병기).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
import FoundOneCore

public struct TaxView: View {
    let store: DashboardStore

    public init(store: DashboardStore) {
        self.store = store
    }

    @State private var profile: FundingProfileSnapshot?
    @State private var loaded = false

    // 연매출 = 월평균(최근7평균×26) × 12 — 웹 estimateAnnualRevenueWon 과 동일 산정.
    private var annualRevenueWon: Int { (profile?.monthlyAvgRevenue ?? 0) * 12 }
    private var categoryId: String? { profile?.industryCategoryId }
    private var specialtyId: String? { profile?.subIndustryId }
    private var hasEmployees: Bool { (profile?.employeesCount ?? 0) > 0 }

    /// 창업감면 5년 게이트 — 개업일 초과 시 비노출 (냉정리뷰 결함 수정, 웹과 동일).
    private var startupWindowActive: Bool {
        guard let iso = profile?.businessLaunchedDate else { return true }
        let f = ISO8601DateFormatter(); f.formatOptions = [.withFullDate]
        guard let launch = f.date(from: iso) ?? {
            let f2 = DateFormatter(); f2.dateFormat = "yyyy-MM-dd"; return f2.date(from: iso)
        }() else { return true }
        guard let deadline = Calendar.current.date(byAdding: .year, value: 5, to: launch) else { return true }
        return Date() <= deadline
    }

    private let hometax = "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3"

    public var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일)
                BUPageHeader(
                    title: "세금",
                    subtitle: "과세유형·부가세 예상, 세액공제, 신고 일정을 한곳에 — 모든 값은 예상치예요. 정확한 세액은 홈택스·세무사로 확정하세요."
                )
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    // 국세청 바로가기 — 다음 행동(신고·납부)은 홈택스 (2026-07-24 사장님 지시, 웹 정합)
                    BUQuickLinksCard(
                        title: "국세청 바로가기",
                        caption: "신고·납부·전자세금계산서는 홈택스에서 — 이 화면의 값은 예상치예요.",
                        links: [BUQuickLink(label: "국세청 홈택스", url: hometax, isPrimary: true)]
                    )
                    calcSection
                    creditSection
                    scheduleSection
                    Color.clear.frame(height: 100)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
            }
        }
        .task {
            if !loaded {
                loaded = true
                if let uid = BUSupabase.shared.client.auth.currentSession?.user.id {
                    let repo = FundingProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
                    profile = try? await repo.loadSnapshot()
                }
            }
        }
    }

    // MARK: - ① 계산

    private var calcSection: some View {
        let verdict = TaxEstimate.classifyTaxType(annualRevenueWon: annualRevenueWon)
        let vat = TaxEstimate.estimateVat(annualRevenueWon: annualRevenueWon, categoryId: categoryId, simplified: verdict.simplifiedEligible)
        let inc = TaxEstimate.guideIncomeTax(annualRevenueWon: annualRevenueWon)
        return VStack(alignment: .leading, spacing: 10) {
            sectionLabel("세금 계산 (예상)")
            // 과세유형
            taxCard {
                HStack(spacing: 8) {
                    Text("과세유형").font(.system(size: 14.5, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                    if annualRevenueWon > 0 {
                        badge(verdict.simplifiedEligible ? "간이과세 가능" : "일반과세",
                              danger: !verdict.simplifiedEligible)
                    }
                }
                Text(verdict.noteKo).font(.system(size: 13)).foregroundStyle(BUColor.ink.opacity(0.75)).lineSpacing(2)
            }
            // 부가세 + 종소세
            taxCard {
                Text("예상 연 부가세").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight.opacity(0.62))
                if annualRevenueWon > 0 {
                    Text("\(TaxEstimate.manwon(vat.lowWon)) ~ \(TaxEstimate.manwon(vat.highWon))")
                        .font(.system(size: 23, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                    Text(vat.noteKo).font(.system(size: 11)).foregroundStyle(BUColor.ink.opacity(0.5)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                } else {
                    Text("매출을 기록하면 계산돼요.").font(.system(size: 13)).foregroundStyle(BUColor.inkMuted)
                }
            }
            taxCard {
                Text("종합소득세 구간").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight.opacity(0.62))
                if let pct = inc.marginalBracketPct {
                    Text("약 \(pct)% 구간").font(.system(size: 23, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                }
                Text(inc.noteKo).font(.system(size: 11)).foregroundStyle(BUColor.ink.opacity(0.5)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
            }
            Link("홈택스에서 정확히 계산하기 →", destination: URL(string: hometax)!)
                .font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight)
        }
    }

    // MARK: - ② 세액공제

    private var creditSection: some View {
        let mapping = TaxDataRegistry.mapping(specialtyId: specialtyId, categoryId: categoryId)
        // 창업감면은 대상 + 5년 이내(개업일 게이트) 둘 다 충족해야 노출.
        let startupOpen = (mapping?.startupReduction.isSurfaced ?? false) && startupWindowActive
        let specialOpen = mapping?.specialReduction.isSurfaced ?? false
        return VStack(alignment: .leading, spacing: 10) {
            sectionLabel("내가 받을 수 있는 세액공제·감면")
            // 공통 4종
            ForEach(TaxDataRegistry.common) { b in
                taxCard {
                    HStack(spacing: 8) {
                        Text(b.titleKo).font(.system(size: 14, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                        badge("대상", danger: false)
                    }
                    Text(b.summaryKo).font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.72)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                    Text("근거: \(b.basis)\(b.sunset.map { " · \($0)까지" } ?? "")")
                        .font(.system(size: 11)).foregroundStyle(BUColor.ink.opacity(0.5))
                }
            }
            // 업종특화
            if let m = mapping, startupOpen {
                reductionCard(title: "창업중소기업 세액감면", level: m.startupReduction,
                              desc: "창업 후 5년 이내 소득·법인세 감면 (지역별 25~100%, 감면 한도 5억).", note: m.note)
            }
            if let m = mapping, specialOpen {
                reductionCard(title: "중소기업 특별세액감면", level: m.specialReduction,
                              desc: "규모·지역별 5~30% 감면 (한도 1억, 2028년까지).", note: m.note)
            }
            if let m = mapping, !startupOpen && !specialOpen {
                taxCard(bg: Color(red: 0xF7/255, green: 0xF8/255, blue: 0xFE/255).opacity(0.7)) {
                    Text("업종특화 감면(창업·특별세액감면)은 사업자등록 업종코드에 따라 대상 여부가 갈려요. 위 공통 공제부터 챙기고, 감면 대상 여부는 세무사·홈택스로 확인하세요. (\(m.ksicHint))")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.7)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                }
            }
            Text("※ 자격·감면율은 조세특례제한법·국세청 기준 안내예요. 실제 적용 세액과 중복적용 여부는 홈택스·세무사로 확정하세요.")
                .font(.system(size: 11)).foregroundStyle(BUColor.ink.opacity(0.5)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
        }
    }

    private func reductionCard(title: String, level: TaxEligibilityLevel, desc: String, note: String) -> some View {
        taxCard {
            HStack(spacing: 8) {
                Text(title).font(.system(size: 14, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                badge(level == .eligible ? "대상" : "가능성 높음", danger: false)
            }
            Text(desc).font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.72)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
            Text(note).font(.system(size: 11)).foregroundStyle(BUColor.ink.opacity(0.5)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - ③ 신고 일정

    private var scheduleSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("신고 일정")
            ForEach(upcomingEvents(), id: \.event.id) { item in
                taxCard {
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item.event.title).font(.system(size: 14, weight: .heavy)).foregroundStyle(BUColor.midnightDeep)
                            Text(item.event.description).font(.system(size: 12)).foregroundStyle(BUColor.ink.opacity(0.65)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 8)
                        Text(item.dDayLabel)
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(item.daysUntil <= 14 ? BUColor.danger : BUColor.midnight)
                    }
                }
            }
        }
    }

    // 오늘 기준 다가오는 신고일 계산 (간이·직원 필터). 웹 buildTaxCalendar 간이 미러.
    private struct ScheduleItem { let event: TaxScheduleEvent; let daysUntil: Int; let dDayLabel: String }
    private func upcomingEvents() -> [ScheduleItem] {
        let cal = Calendar(identifier: .gregorian)
        let today = cal.startOfDay(for: Date())
        let year = cal.component(.year, from: today)
        let verdict = TaxEstimate.classifyTaxType(annualRevenueWon: annualRevenueWon)
        var items: [ScheduleItem] = []
        for e in TaxDataRegistry.events {
            // 간이과세자는 예정신고 등 일부 제외 (appliesToSimplified=false 인데 간이면 skip)
            if verdict.simplifiedEligible && !e.appliesToSimplified { continue }
            if e.requiresEmployees && !hasEmployees { continue }
            // 올해·내년 발생일 중 오늘 이후 가장 가까운 것
            for y in [year, year + 1] {
                if let date = cal.date(from: DateComponents(year: y, month: e.month, day: e.day)) {
                    let d0 = cal.startOfDay(for: date)
                    let days = cal.dateComponents([.day], from: today, to: d0).day ?? 0
                    if days >= 0 {
                        items.append(.init(event: e, daysUntil: days, dDayLabel: days == 0 ? "오늘" : "D-\(days)"))
                        break
                    }
                }
            }
        }
        return items.sorted { $0.daysUntil < $1.daysUntil }.prefix(4).map { $0 }
    }

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        Text(text).font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.ink.opacity(0.55))
    }

    private func badge(_ text: String, danger: Bool) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(danger ? BUColor.danger : BUColor.midnight)
            .padding(.horizontal, 9).padding(.vertical, 3)
            .background((danger ? BUColor.danger : BUColor.midnight).opacity(0.08), in: Capsule())
    }

    @ViewBuilder private func taxCard<Content: View>(bg: Color = BUColor.surfaceElevated, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 5) { content() }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(bg, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(BUColor.midnight.opacity(0.10), lineWidth: 1))
    }
}
