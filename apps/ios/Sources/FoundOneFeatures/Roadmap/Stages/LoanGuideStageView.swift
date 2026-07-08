//
//  LoanGuideStageView.swift — 대출 가이드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/LoanGuideStage.tsx
//  stageId: "loan-guide"
//
//  2026 검증 데이터:
//    - 소진공(SEMAS) 정책자금 기준금리: 2.96% (2026 기준)
//    - 소상공인정책자금 신청: ols.semas.or.kr
//    - 연초(1~2월) 신청 권장 (통합공고 직후 신규 예산 가장 많을 때)
//    - 비수도권 0.2%p 우대
//
//  3-page (세그먼트):
//    pg 0 — 예산별 자금 경로 매트릭스
//    pg 1 — 정책자금 기관 & 신청 방법
//    pg 2 — 대출 주의사항 & 체크리스트
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct LoanGuideStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    @State private var budgetText = "5000"
    private let stageId = "loan-guide"

    @AppStorage("loan.pathSelected")     private var pathSelected     = ""
    @AppStorage("loan.reviewDone")       private var reviewDone       = false
    @AppStorage("roadmap.selectedIndustryId") private var industryId  = ""

    private var isStartup: Bool { IndustryCluster.from(industryId: industryId).isStartupTech }
    private var isOnline: Bool { IndustryCluster.from(industryId: industryId).isOnline } // 2026-07-05: 무점포 — 운영자본잠식 대신 정산주기

    // ── 페이지별 KEY ACTION (웹 LoanGuideStage keyActions 미러). 깔끔히 매칭되는
    //   페이지만 웹 카피, 주의사항·FAQ 는 nil → 레지스트리 단일값 폴백. ──
    private var pageKeyAction: BUStageKeyAction? {
        switch (isStartup, page) {
        case (true, 0):
            return .init(title: "지분 양보 전 비지분 자금부터 — TIPS 8억·예비창업 1억·청년창업 1억",
                         detail: "초기 밸류에이션 낮을 때 지분을 내어주면 수십억 손실. 무상 R&D 과제로 마일스톤 달성 후 시리즈 A를 노리세요.")
        case (true, 1):
            return .init(title: "K-Startup 통합공고 + TIPS 운영사 매칭으로 신청 시작",
                         detail: "K-Startup(k-startup.go.kr) → 모집공고 확인. TIPS는 149개 운영사 중 우리 분야 매칭이 핵심 — 운영사 선투자 → 정부 매칭 구조.")
        case (false, 0):
            return .init(title: "내 예산·업종·신용 상황을 입력하면 자금 경로가 자동 매칭됨",
                         detail: "5천만원 이하면 소진공 정책자금(2.96%) → 5천~2억 보증서 결합 → 2억+ 중진공 직접대출. 비수도권은 0.2%p 우대.")
        case (false, 1):
            return .init(title: "연초(1~2월) 신청 — 통합공고 직후 신규 예산이 가장 많을 때. 상반기 중 인기자금 소진 가능",
                         detail: "소상공인정책자금 누리집(ols.semas.or.kr) 방문 → 자격 확인 → 온라인 신청 → 현장 실사 1~2주 → 자금 집행.")
        default:
            return nil   // 주의사항·FAQ → 레지스트리 단일 KEY ACTION 폴백
        }
    }

    private var budgetWan: Int { Int(budgetText) ?? 5000 }
    private var budgetBucket: String {
        if budgetWan <= 5000  { return "small" }
        if budgetWan <= 20000 { return "medium" }
        return "large"
    }

    private let pages = ["자금 경로", "정책자금 기관", "주의사항", "FAQ"]

    public init() {}

    /// 게이트: 자금 경로 선택 + 주의사항 검토 완료.
    private var canCompleteStage: Bool {
        !pathSelected.isEmpty && reviewDone
    }

    private var advanceHint: String {
        if pathSelected.isEmpty { return "자금 경로를 선택하세요" }
        if !reviewDone { return "주의사항 검토 토글을 켜세요" }
        return "자금 가이드 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "대출 가이드",
            stageEyebrow: "단계 12 · 대출 가이드",
            helperText: "소상공인 정책자금 신규 예산은 1월 통합공고 직후(연초) 가장 많습니다. 인기자금은 상반기 중 소진 가능 — 빠른 신청이 유리.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["path": pathSelected])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["path": pathSelected]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 자금 수요·구조 진단", detail: "초기 시설자금 vs 운영자금 분리 + 대출 vs 정부지원금 우선순위 결정"),
                .init(label: "2. 정책자금 후보군 매칭", detail: "소상공인시장진흥공단·지역신보·신보·기보 매칭 — 업종·기간·자본 자동 필터 (소상공인은 지역신보 1순위)"),
                .init(label: "3. 신용·재무 점검", detail: "개인신용 점수·기존 부채·연체 기록 사전 정리, 사업자 신용평가 사전 시뮬"),
                .init(label: "4. 신청 일정·서류 준비", detail: "사업계획서·매출 시뮬·자금 사용 계획 3종 + 추천 기관 면담 일정 확보"),
                ],
                verifyItems: [
                "정책자금 — 1순위는 「보증부 대출」 (지역신보·신보·기보 보증서 80~90% 보증)",
                isOnline
                    ? "자금 회전 — 채널별 정산 주기 차이(네이버 ~3일 · 쿠팡 최대 ~60일) 감안, 정산 느린 채널 비중 크면 사입 대금·광고비 선지출과 유입 시차로 자금 압박(「돈맥경화」)"
                    : "이자 부담 — 매출 0원 가정 6개월 운영자본 대비 월 이자 한계점 시뮬, 「운영자본 잠식」 1순위 부도 원인",
                "보증 한도 — 지역신보·신보·기보 통합 한도 인지 (개인/업종별 한도 상이), 다중 신청 시 보증 거절 위험",
                "사업계획서 — 「자금 사용 계획」 + 「상환 계획」 명확해야 심사 통과율 상승, 두루뭉술하면 거절",
                "정부지원금 — 「선정 후 입금」까지 평균 4~12주, 일정 역산 필수 (오픈 직전 신청 X)",
                "사기 주의 — 「대출 100% 보장」 「선수수료」 요구하는 브로커는 모두 사기, 직접 신청 원칙",
                ],
                nextStageLabel: isStartup ? "사업자등록·금융 세팅" : isOnline ? "상품 소싱 및 상세 페이지" : "메뉴·서비스 라인업 확정",
                nextSummary: "자금 구조·대출 후보 확정 → \(isStartup ? "사업자등록·금융 세팅" : isOnline ? "상품 소싱" : "메뉴·서비스 라인업 확정") 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: pages.count,
            keyActionOverride: pageKeyAction
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: fundingPage
                    case 1: institutionPage
                    case 2: warningsPage
                    default: BULoanFAQCard()
                    }
                }
            }
        }
    }

    // MARK: - pg 0 자금 경로

    private var fundingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("대출 가이드 · 자금 경로")
                    if isStartup {
                        Text("지분 양보 전 —\n비지분 자금부터 (무상·보증)")
                            .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                        Text("초기 밸류에이션 낮을 때 지분을 내어주면 수십억 손실. 무상 R&D·바우처·보증 자금으로 마일스톤 달성 후 시리즈 A를 노리세요.")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    } else {
                        Text("내 예산에 맞는 자금 경로 —\n연초(1~2월) 신청이 연중 최적")
                            .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                        Text("소상공인정책자금 신규 예산은 1월 통합공고 직후(연초) 가장 많습니다. 인기자금은 상반기 중 소진 가능 — 빠른 신청이 유리합니다.")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    }
                }
            }

            if isStartup {
                startupFundingCard
            } else {
                smbFundingCards
            }
        }
    }

    /// 스타트업 자금 추천 — 웹 recommendations(isStartup) 1:1 미러.
    private var startupFundingCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("기술 스타트업 자금 — 비지분 우선")
                let progs: [(String, String, String, String, String, Bool)] = [
                    ("예비창업패키지 / 청년창업사관학교", "1억 이하 시드 전", "무상 (갚지 않음) · 최대 1억",
                     "사업자등록 전·만 39세 이하·창업 3년 이내. 1~2월 모집. 사업비 70% 지원 + 공간·교육·코칭", "k-startup.go.kr", true),
                    ("TIPS (민간투자주도형)", "5억~8억 시드~프리A", "무상 + 매칭투자 · 최대 8억 (R&D 5억 + 사업화 3억)",
                     "기술 기반 스타트업 핵심 트랙. 149개 운영사 중 매칭 → 운영사 선투자 → 정부 매칭. 벤처인증 가산점", "jointips.or.kr", false),
                    ("AI·데이터·클라우드 바우처", "도입 비용 부담 시", "70~90% 정부 부담 · AI 3억 / 데이터 5천 / 클라우드 크레딧",
                     "사업계획서 간소 — 견적서 + 도입 계획만. 신청 진입 장벽 가장 낮음", "nipa.kr", false),
                    ("기보 + 시중은행 (지분 X)", "운영자금 1~5억", "보증료 0.5~1.5% · 최대 5억 무담보",
                     "기술보증기금 기술평가 → 보증서 → 시중은행 저금리 대출. 벤처인증 시 보증료 우대", "kibo.or.kr", false),
                ]
                ForEach(progs, id: \.0) { name, bucket, rate, why, url, primary in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(bucket).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(primary ? BUColor.midnight : BUColor.inkMuted)
                            if primary {
                                Text("추천 1순위").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.midnight, in: Capsule())
                            }
                        }
                        Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                        Text(rate).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                        Text(why).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        Text(url).font(.system(size: 10)).foregroundStyle(BUColor.midnight)
                    }
                    .padding(BUSpacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(primary ? BUColor.midnight.opacity(0.06) : Color.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    /// 소상공인(SMB) 예산별 자금 경로 — 기존 매트릭스.
    private var smbFundingCards: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("총 창업 자금 (만원)")
                    HStack(spacing: BUSpacing.md) {
                        TextField("예) 5000", text: $budgetText)
                            .font(BUFont.body).keyboardType(.numberPad)
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        Text("만원")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("예산별 추천 자금 경로")
                    let paths: [(String, String, String, String, Bool)] = [
                        ("5천만원 이하", "소진공 직접 대출", "금리 2.96% (비수도권 -0.2%p). ols.semas.or.kr 온라인 신청. 현장 실사 1~2주 후 집행.", "small", budgetBucket == "small"),
                        ("5천만~2억원", "보증서 결합 대출", "소상공인 1순위는 지역신용보증재단(지역신보) 보증서 → 시중은행 대출(정책금리). 신보·기보는 기술·중소기업 대상.", "medium", budgetBucket == "medium"),
                        ("2억원 이상", "중진공 직접 대출", "중소벤처기업진흥공단 직접 대출 or IBK기업은행 소상공인 특화. 사업계획서 필수.", "large", budgetBucket == "large"),
                    ]
                    ForEach(paths, id: \.0) { range, name, detail, id, isMatch in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Text(range).font(BUFont.eyebrow.weight(.bold))
                                    .foregroundStyle(isMatch ? BUColor.midnight : BUColor.inkMuted)
                                if isMatch {
                                    Text("내 상황").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(BUColor.midnight, in: Capsule())
                                }
                            }
                            Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(BUSpacing.sm)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(isMatch ? BUColor.midnight.opacity(0.06) : Color.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }
        }
    }

    // MARK: - pg 1 정책자금 기관

    private var institutionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(isStartup ? "기술 스타트업 자금 기관" : "소상공인 정책자금 기관")
                    let orgs: [(String, String, String, String)] = isStartup ? [
                        ("K-Startup 통합공고", "k-startup.go.kr", "예비창업·청년창업사관학교 등 정부 창업지원 통합 모집·신청 창구.", "building.2"),
                        ("TIPS 운영사", "jointips.or.kr", "149개 운영사가 직접 투자 → 정부 R&D 5억 + 사업화 3억 매칭. 우리 분야 운영사 매칭이 핵심.", "person.2.fill"),
                        ("정보통신산업진흥원 (NIPA)", "nipa.kr", "AI·데이터·클라우드 바우처 — 70~90% 정부 부담. 견적서+도입계획만으로 신청.", "cpu"),
                        ("기술보증기금 (KIBO)", "kibo.or.kr", "기술평가 → 보증서 → 시중은행 저금리. 지분 없이 운영자금. 벤처인증 시 보증료 우대.", "shield.checkered"),
                    ] : [
                        ("소상공인진흥공단 (SEMAS)", "ols.semas.or.kr", "소상공인 직접 대출 2.96%. 창업 3년 이내 우대. 온라인 신청 → 현장 실사 → 집행.", "building.2"),
                        ("신용보증기금 (KODIT)", "kodit.co.kr", "신용 부족한 소상공인 보증서 발급 → 은행 대출 연계. 보증료 약 1%.", "shield.checkered"),
                        ("소상공인시장진흥공단", "semas.or.kr", "컨설팅·교육 병행. 경영 개선 자금 별도 운영.", "person.badge.shield.checkmark"),
                        ("IBK기업은행", "ibk.co.kr", "소상공인 특화 상품 多. 정책자금 연계 최강. 금리 협의 여지 있음.", "creditcard"),
                    ]
                    ForEach(orgs, id: \.0) { name, url, desc, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(url).font(.system(size: 10)).foregroundStyle(BUColor.midnight)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(isStartup ? "신청 절차 (K-Startup 기준)" : "신청 절차 (소진공 기준)")
                    let steps: [(String, String)] = isStartup ? [
                        ("K-Startup 회원가입·공고 확인 (k-startup.go.kr)", "통합공고에서 모집 중인 사업 확인 → 자격 매칭"),
                        ("사업계획서(PSST) 작성·제출", "문제·솔루션·확장성·팀 — PSST 양식. 마감 엄수"),
                        ("선정 → 협약 → 사업비 집행", "서면·발표 평가 → 선정 시 협약 → 단계별 사업비 지급"),
                    ] : [
                        ("온라인 신청 (ols.semas.or.kr)", "자격 확인 → 필요 서류 업로드 → 신청 완료"),
                        ("현장 실사 (1~2주)", "소진공 직원 방문 — 사업장·서류 확인"),
                        ("자금 집행 (심사 통과 후)", "사업자 통장으로 직접 입금"),
                    ]
                    ForEach(steps.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                                Text("\(i+1)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(steps[i].0).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(steps[i].1).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                    Text(isStartup ? "준비 서류: 사업계획서(PSST)·대표자 신분증·팀 구성·(해당 시) 사업자등록증·통장 사본" : "준비 서류: 사업자등록증·임대차계약서·사업계획서·대표자 신분증·통장 사본")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).padding(.top, 4)
                }
            }
        }
    }

    // MARK: - pg 2 주의사항

    private var warningsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            warningCard(title: "대출 레드플래그 — 하지 말아야 할 것", items: [
                "보증금·월세 대출로 충당 → 매출 발생 전 이자 부담 = 폐업 가속",
                "카드론·대부업 고금리 → 10% 이상 금리는 사업 수익으로 감당 불가",
                "과다 차입 → 원리금 > 월 수익의 30% = 존폐 위기",
                "개인 명의 대출로 사업자금 = 세금·보증 불이익 + 개인 신용 훼손",
            ], color: BUColor.danger)

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("현명한 대출 원칙")
                    let principles: [(String, String)] = [
                        ("운영자금이 아닌 투자자금", "설비·인테리어 등 자산 형성 용도로만. 월세·인건비는 매출로 감당해야."),
                        ("원리금 ≤ 월 예상 매출의 15%", "음식점 평균 순이익률 10~15% — 대출 이자가 이를 초과하면 구조적 손실."),
                        ("정책자금 우선, 시중은행 나중", "소진공 2.96% vs 시중은행 5~8% — 금리 차이가 수년간 수백만원 차이."),
                    ]
                    ForEach(principles, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "lightbulb.fill").foregroundStyle(BUColor.warn).font(.system(size: 11)).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $reviewDone) {
                    Text("대출 가이드 검토 및 자금 계획 확정").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    @ViewBuilder
    private func warningCard(title: String, items: [String], color: Color) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("LoanGuide") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["loan-guide"] }
    return LoanGuideStageView().environment(store)
}
#endif
