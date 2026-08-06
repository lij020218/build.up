//
//  InfluencerCollabTabView.swift — 마케팅 "협찬" 탭 (웹 InfluencerCollabTab 1:1 미러, 2026-08-04)
//
//  구성 (전부 결정론 — LLM 0%):
//   ① 월 예산 입력(만원, marketing_monthly_budget 동기화) → 협업 형태 권고 (웹 budgetAdvice 미러)
//   ② 큐레이션 인플루언서 — 팔로워·참여율(출처 확인분만 "—" 정직)·티어·프로필 링크·DM 복사
//   ③ 직접 발굴 플레이 — 검색 링크·DM 템플릿 (플레이스홀더 {가게명}·{지역}·{region} 클라 치환)
//   ④ 시세표 (접힘, 출처 병기)
//  ⚠️ 웹과 예외 없이 1:1 — 문구·기준 변경 시 양쪽 동시.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct InfluencerCollabTabView: View {
    let collab: InfluencerCollabResponse?
    let storeName: String
    let region: String
    let budgetWon: Int
    let onBudgetChange: (Int) -> Void

    @State private var budgetText: String = ""
    @State private var feeOpen = false
    @State private var copiedKey: String?
    @Environment(\.openURL) private var openURL

    private let tierKo: [String: String] = ["nano": "나노", "micro": "마이크로", "mid": "미드", "macro": "매크로"]

    var body: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            budgetCard
            if let c = collab {
                if !c.curated.isEmpty { curatedCard(c) }
                playsCard(c)
                feeCard(c)
                Text("DM 발송·조건 협의는 사장님이 직접 하세요 (앱이 대신 보내지 않아요). 협찬 결과·광고 효과는 보장되지 않으며, 유료 광고 표기(#광고·#협찬)는 표시광고법상 필수입니다.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
            } else {
                Text("협찬 데이터를 불러오는 중이거나 연결에 실패했어요. 새로고침해 주세요.")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
        .onAppear { budgetText = budgetWon > 0 ? String(budgetWon / 10_000) : "" }
    }

    // 예산(원) → 협업 형태 권고 — 웹 budgetAdvice 문구 1:1 (시세표 값만 조합, 새 숫자 발명 금지)
    private var advice: String {
        if budgetWon <= 0 { return "예산을 입력하면 맞는 협업 형태를 알려드려요. 0원이어도 나노 협찬형(제공 중심)은 가능해요." }
        let man = budgetWon / 10_000
        if man < 10 { return "나노 협찬형(제품·서비스 제공 중심) 권장 — 원고료 없이 성사되는 경우가 많아요." }
        if man < 50 { return "나노 원고료형(피드 10~30만)까지 가능 — 마이크로는 협찬+협의로 접근하세요." }
        if man < 150 { return "마이크로 피드 1건(50~150만) 범위 — 나노 여러 명 분산도 효과적이에요." }
        return "마이크로 릴스(75~200만)·미드 협의 범위 — 한 번에 쓰기보다 월 분산 집행을 권해요."
    }

    private func fill(_ template: String) -> String {
        template
            .replacingOccurrences(of: "{가게명}", with: storeName.isEmpty ? "저희 가게" : storeName)
            .replacingOccurrences(of: "{지역}", with: region.isEmpty ? "동네" : region)
            .replacingOccurrences(of: "{region}", with: region)
    }

    private func tierFor(_ followers: Int) -> String {
        if followers < 10_000 { return "nano" }
        if followers < 50_000 { return "micro" }
        if followers < 100_000 { return "mid" }
        return "macro"
    }

    /// 등급별 월 예산 하한(원) — 웹 TIER_BUDGET_FLOOR_WON 손미러 (시세표 값에서만 조합).
    private let tierBudgetFloorWon: [String: Int] = ["nano": 0, "micro": 50_000, "mid": 1_000_000, "macro": 5_000_000]

    private func withinBudget(_ followers: Int) -> Bool {
        (tierBudgetFloorWon[tierFor(followers)] ?? 0) <= budgetWon
    }

    /// 예산 맞춤 정렬 — 웹 sortInfluencersForBudget 손미러 (제외가 아니라 정렬).
    private func sortedForBudget(_ list: [InfluencerCollabResponse.CuratedInfluencer]) -> [InfluencerCollabResponse.CuratedInfluencer] {
        list.sorted { a, b in
            let aw = withinBudget(a.followers), bw = withinBudget(b.followers)
            if aw != bw { return aw }
            return a.followers > b.followers
        }
    }

    private func fmtFollowers(_ n: Int) -> String {
        n >= 10_000 ? String(format: n % 10_000 == 0 ? "%.0f만" : "%.1f만", Double(n) / 10_000) : "\(n)"
    }

    private func copyButton(key: String, text: String) -> some View {
        Button {
            UIPasteboard.general.string = text
            copiedKey = key
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { if copiedKey == key { copiedKey = nil } }
        } label: {
            Text(copiedKey == key ? "✓ 복사됨" : "DM 초안 복사")
                .font(.system(size: 11.5, weight: .bold))
                .foregroundStyle(copiedKey == key ? BUColor.success : BUColor.accent)
                .padding(.horizontal, 11).padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(copiedKey == key ? BUColor.success.opacity(0.5) : BUColor.accent.opacity(0.35), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    // ① 예산
    private var budgetCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("협찬 예산").buSectionEyebrowStyle()
            HStack(spacing: 8) {
                Text("월 인플루언서 예산")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                TextField("만원", text: $budgetText)
                    .keyboardType(.numberPad)
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 80)
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
                    .onChange(of: budgetText) { _, v in
                        let n = Int(v.filter(\.isNumber)) ?? 0
                        onBudgetChange(n * 10_000)
                    }
                Text("만원")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Text(advice)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.accent08, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    // ② 큐레이션
    private func curatedCard(_ c: InfluencerCollabResponse) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("검수 목록").buSectionEyebrowStyle()
            Text("내 업종 인플루언서 · \(c.curated.count)명")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.ink)
            Text("팔로워·참여율은 \(c.checkedAt) 조회 기준이에요. 참여율은 공개 통계에서 확인된 계정만 표시합니다.")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            ForEach(sortedForBudget(c.curated), id: \.handle) { i in
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 6) {
                        if let url = URL(string: i.profileUrl) {
                            Link("\(i.name) @\(i.handle) ↗", destination: url)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                        }
                    }
                    HStack(spacing: 6) {
                        let isYoutube = i.platform == "youtube"
                        Text(isYoutube ? "유튜브" : "인스타")
                            .font(.system(size: 10.5, weight: .bold))
                            .foregroundStyle(isYoutube ? BUColor.danger : BUColor.accent)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background((isYoutube ? BUColor.danger08 : BUColor.accent08), in: Capsule())
                        Text(isYoutube ? "\(fmtFollowers(i.followers)) 구독" : "\(tierKo[tierFor(i.followers)] ?? "") · \(fmtFollowers(i.followers))")
                            .font(.system(size: 10.5, weight: .bold))
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(BUColor.ink.opacity(0.05), in: Capsule())
                        if budgetWon > 0 && !withinBudget(i.followers) {
                            Text("예산 초과 — 협의 필요")
                                .font(.system(size: 10.5, weight: .bold))
                                .foregroundStyle(BUColor.inkMuted)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.ink.opacity(0.04), in: Capsule())
                        }
                        if let er = i.engagementRatePct {
                            Text("참여율 \(er, specifier: "%.2f")%")
                                .font(.system(size: 10.5, weight: .bold))
                                .foregroundStyle(BUColor.success)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.success08, in: Capsule())
                        } else {
                            Text("참여율 —")
                                .font(.system(size: 10.5, weight: .bold))
                                .foregroundStyle(BUColor.inkMuted)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.ink.opacity(0.04), in: Capsule())
                        }
                        Spacer(minLength: 0)
                        copyButton(key: i.handle, text: dmForCurated(c))
                    }
                    Text(i.regionKo)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private func dmForCurated(_ c: InfluencerCollabResponse) -> String {
        if let t = c.plays.first?.dmTemplateKo { return fill(t) }
        return fill("안녕하세요, {지역}에서 {가게명}를 운영하는 사장입니다. 콘텐츠 잘 보고 있습니다. 협찬(제공) 방식으로 협업을 제안드리고 싶은데, 조건은 편하게 협의 부탁드려요.")
    }

    // ③ 발굴 플레이
    private func playsCard(_ c: InfluencerCollabResponse) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("직접 발굴").buSectionEyebrowStyle()
            Text("내 업종 협업 플레이")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.ink)
            if let nf = c.notFit {
                Text("이 업종엔 인스타 협찬이 잘 안 맞아요. \(nf.reasonKo) \(nf.insteadKo)")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)
                    .padding(12)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            } else if c.plays.isEmpty {
                Text("이 업종의 검증된 협업 플레이가 아직 없어요 — 위 검수 목록과 시세표를 참고하세요.")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            } else {
                ForEach(c.plays, id: \.id) { p in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(p.titleKo)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        Text(p.targetKo)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(BUColor.ink)
                            .lineSpacing(2)
                        Text(p.practiceKo)
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                        HStack(spacing: 6) {
                            if let q = p.instagramQueries.first {
                                let query = fill(q)
                                if let url = URL(string: "https://www.google.com/search?q=" + ("site:instagram.com \(query)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")) {
                                    Link("🔍 \(query)", destination: url)
                                        .font(.system(size: 10.5, weight: .bold))
                                        .foregroundStyle(BUColor.accent)
                                        .padding(.horizontal, 8).padding(.vertical, 3)
                                        .background(BUColor.accent08, in: Capsule())
                                }
                            }
                            Spacer(minLength: 0)
                            copyButton(key: p.id, text: fill(p.dmTemplateKo))
                        }
                        .padding(.top, 4)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    // ④ 시세표 (접힘)
    private func feeCard(_ c: InfluencerCollabResponse) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.15)) { feeOpen.toggle() }
            } label: {
                HStack {
                    Text("등급별 시세표")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                        .rotationEffect(.degrees(feeOpen ? 90 : 0))
                }
            }
            .buttonStyle(.plain)
            if feeOpen {
                ForEach(c.feeRanges, id: \.tier) { r in
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(tierKo[r.tier] ?? r.tier) · \(r.followersKo)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        Text("협찬형 \(r.barterKo) · 피드 \(r.feedFeeKo) · 릴스 \(r.reelsFeeKo)")
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                    }
                    .padding(.vertical, 4)
                }
                Text(c.feeSources)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }
}
