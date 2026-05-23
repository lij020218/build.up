//
//  OnlineMarketingStageView.swift — SEO·광고·리뷰 전략 (iOS 네이티브)
//
//  stageId: "online-marketing"
//
//  3-page (segmented): SEO 최적화 / 광고 전략 / 리뷰 관리
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct OnlineMarketingStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "online-marketing"

    @AppStorage("om.seoKeywords")   private var seoKeywords   = ""
    @AppStorage("om.adBudgetText")  private var adBudgetText  = ""
    @AppStorage("om.adChannel")     private var adChannel     = ""
    @AppStorage("om.reviewTarget")  private var reviewTarget  = ""
    @AppStorage("om.done")          private var done          = false

    private let pages = ["SEO 최적화", "광고 전략", "리뷰 관리"]

    private struct AdOption {
        let id: String; let name: String; let desc: String
    }

    private let adOptions: [AdOption] = [
        AdOption(id: "naver", name: "네이버 쇼핑 광고", desc: "CPC 클릭당 30-300원. 구매 의도 높은 트래픽. 초기 추천."),
        AdOption(id: "kakao", name: "카카오 모먼트",    desc: "디스플레이 광고. 브랜드 인지도. CPC 100-500원."),
        AdOption(id: "meta",  name: "Meta (인스타·페이스북)", desc: "비주얼 상품에 효과적. 리타겟팅 강력. CPM 방식."),
        AdOption(id: "none",  name: "광고 없이 시작",   desc: "SEO·SNS 무료 채널로만. 성장 느리지만 비용 없음."),
    ]

    public init() {}

    /// 게이트: 광고 채널 선택 (광고 없이 시작 'none' 포함 — 의사결정만 요구).
    private var canCompleteStage: Bool { !adChannel.isEmpty }

    private var advanceHint: String {
        if adChannel.isEmpty { return "광고 채널을 선택하세요" }
        return "마케팅 채널 결정됨 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "마케팅 및 론칭",
            stageEyebrow: "단계 13 · 온라인 마케팅",
            helperText: "온라인 커머스 매출의 60%는 검색에서 옵니다. 네이버 쇼핑 SEO = 상품명·카테고리·리뷰수·판매량의 함수.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["adChannel": adChannel])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["adChannel": adChannel]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 채널 우선순위", detail: "네이버 검색·인스타·카카오·블로그 4축 중 업종 적합 2~3개 선택"),
                .init(label: "2. 광고 예산 배분", detail: "유료 광고 vs 콘텐츠 마케팅 비중 결정 + ROAS 목표 설정"),
                .init(label: "3. 콘텐츠 일정", detail: "주간 SNS 포스팅 + 리뷰 유도 + 인플루언서 협업 일정 셋업"),
                .init(label: "4. 측정 지표 설정", detail: "방문자·전환율·CTR·CAC·LTV 5개 지표 대시보드 셋업"),
                ],
                verifyItems: [
                "광고 표현 — 「최저가」 「최고」 「유일」 등 비교 광고 객관 근거 필수, 위반 시 표시광고법 과징금",
                "인플루언서 협업 — 「유료 광고」 표시 의무 (#광고 #협찬), 미표시 시 공정위 과징금 + 인플루언서도 책임",
                "네이버 검색광고 — 키워드 입찰 단가 인상 추세, ROAS 200% 미만이면 즉시 중단·재구성",
                "쿠팡 광고 — 노출 위치별 효율 차이 큼, 카테고리 검색·상세 페이지 광고 분리 측정",
                "리뷰 — 자작·가족·지인 리뷰 적발 시 플랫폼 영구정지 + 표시광고법 위반 (10만원 이하 과태료/건)",
                "개인정보 — 마케팅 활용 동의 별도 수집 의무, 위반 시 개인정보보호법 과징금 (매출 3% 이내)",
                ],
                nextStageLabel: "첫 달 점검",
                nextSummary: "채널·예산·콘텐츠·측정 4축 셋업 완료 → 첫 달 점검 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
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
                    case 0: seoPage
                    case 1: adPage
                    default: reviewPage
                    }
                }
            }
        }
    }

    // MARK: - Page 0: SEO 최적화

    private var seoPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("네이버 쇼핑 SEO 핵심")
                    infoRow(text: "키워드 배치: 상품명 앞 30글자에 핵심 키워드 포함")
                    infoRow(text: "카테고리 정확도: 잘못된 카테고리 = 검색 제외")
                    infoRow(text: "판매량·리뷰수: 초기에 낮으면 하위 노출 — 유료 광고로 초기 트래픽 확보")
                    infoRow(text: "배송 점수: 빠른 처리로 '빠른 배송' 배지 확보")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("키워드 메모")
                    TextField("타깃 키워드를 쉼표로 구분하여 입력 (예: 남성청바지, 슬림핏청바지)", text: $seoKeywords, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.ink)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .lineLimit(3...6)
                }
            }
        }
    }

    // MARK: - Page 1: 광고 전략

    private var adPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("광고 예산 계획")
                    HStack(spacing: BUSpacing.sm) {
                        TextField("월 광고 예산", text: $adBudgetText)
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.ink)
                            .keyboardType(.numberPad)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Text("만원")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "lightbulb.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.midnight)
                        Text("권장 초기 예산: 월 30-50만원. ROAS(광고비 대비 매출) 목표: 200% 이상 — 미만이면 즉시 중단·재구성.")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("광고 채널 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(adOptions, id: \.id) { opt in
                            adButton(opt)
                        }
                    }
                }
            }
        }
    }

    private func adButton(_ opt: AdOption) -> some View {
        let isSelected = adChannel == opt.id
        return Button { adChannel = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "megaphone")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(opt.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Text(opt.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
            }
            .padding(BUSpacing.sm)
            .background(isSelected ? BUColor.midnight.opacity(0.05) : Color.clear, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous).strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Page 2: 리뷰 관리

    private var reviewPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰가 온라인 커머스의 생존을 결정")
                    infoRow(text: "스마트스토어 알고리즘: 리뷰 10개 이상이 첫 번째 노출 임계값")
                    infoRow(text: "구매 전환율: 리뷰 10개 → 20개 구간에서 전환율 2배 상승")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰 목표 설정")
                    HStack(spacing: BUSpacing.sm) {
                        Text("첫 달 목표 리뷰 수")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                        Spacer()
                        TextField("예) 20", text: $reviewTarget)
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.ink)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰 빠르게 확보하는 방법")
                    infoRow(text: "구매 후 리뷰 요청 문자 자동 발송 (스마트스토어 기본 제공)")
                    infoRow(text: "구매자에게 소정의 리뷰 포인트 제공 (스마트스토어 내 설정)")
                    infoRow(text: "지인 구매 → 리뷰 요청 (첫 10개를 채우는 가장 빠른 방법)")
                    infoRow(text: "네이버 리뷰: 4.5점 이하면 즉시 원인 파악·CS 대응")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("SEO·광고·리뷰 전략 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func infoRow(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }
}

#if DEBUG
#Preview("OnlineMarketing") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["online-marketing"] }
    return OnlineMarketingStageView().environment(store)
}
#endif
