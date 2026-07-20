//
//  OnlineMarketingStageView.swift — SEO·광고·리뷰 전략 (iOS 네이티브)
//
//  stageId: "online-marketing"
//
//  3-page (segmented): SEO 최적화 / 광고 전략 / 리뷰 관리
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

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
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    /// 디지털 콘텐츠(무배송) — 쿠팡·배송 전제 마케팅이 성립하지 않음 (웹 isDigital 미러, 2026-07-10).
    private var isDigital: Bool { isDigitalFulfillment(industryId) }

    private let pages = ["SEO 최적화", "광고 전략", "리뷰 관리"]

    private struct AdOption {
        let id: String; let name: String; let desc: String
    }

    /// 광고 채널 옵션 — 웹 "첫 광고 캠페인 세팅" 3종 1:1 + iOS 게이트용 "광고 없이 시작"(의사결정 요구).
    private var adOptions: [AdOption] {
        if isDigital {
            return [
                AdOption(id: "platform", name: "입점 플랫폼 광고 (크몽·클래스101 등)", desc: "일 5,000~15,000원 · 플랫폼 내 검색·기획전 상단 노출. 입점 판매 시 우선 채널"),
                AdOption(id: "meta",  name: "인스타그램·메타 성과형 광고", desc: "일 10,000~20,000원 · 관심사 타깃 도달. 미리보기·후기 콘텐츠와 결합 시 전환 최고"),
                AdOption(id: "naver", name: "네이버 검색광고 (파워링크)", desc: "일 5,000~10,000원 · 정보 탐색형 키워드(\"엑셀 템플릿\", \"전자책 만들기\")에서 유입. ROAS 확인 후 증액"),
                AdOption(id: "none",  name: "광고 없이 시작",   desc: "SEO·SNS 무료 채널로만. 성장 느리지만 비용 없음."),
            ]
        }
        return [
            AdOption(id: "naver", name: "네이버 쇼핑 검색광고", desc: "일 5,000~10,000원 · 구매 의도가 가장 높은 채널. CPC 300~800원. ROAS 확인 후 증액"),
            AdOption(id: "meta", name: "인스타그램 광고", desc: "일 10,000~20,000원 · 비주얼 제품에 효과적. 25-34세 여성 타깃. 릴스 광고 CTR 최고"),
            AdOption(id: "coupang", name: "쿠팡 CPC 광고", desc: "일 5,000~15,000원 · 쿠팡 내 검색 결과 상단 노출. 쿠팡 판매 시 필수"),
            AdOption(id: "none",  name: "광고 없이 시작",   desc: "SEO·SNS 무료 채널로만. 성장 느리지만 비용 없음."),
        ]
    }

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
            helperText: isDigital
                ? "입점 플랫폼(크몽·클래스101) 검색 최적화로 무료 노출, 첫 광고는 ROAS 200% 목표로 작게 시작, 초기 후기는 베타 리더·후기 이벤트·커뮤니티 3종 병행."
                : "네이버 쇼핑 상품명·태그 최적화로 무료 노출, 첫 광고 캠페인은 ROAS 200% 목표로 작게 시작, 초기 리뷰는 지인·체험단·낮은 가격 신규 할인 3종 병행.",
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
                .init(label: "1. 채널 우선순위", detail: isDigital
                    ? "플랫폼 광고·인스타·네이버 검색·커뮤니티 4축 중 업종 적합 2~3개 선택"
                    : "네이버 검색·인스타·카카오·블로그 4축 중 업종 적합 2~3개 선택"),
                .init(label: "2. 광고 예산 배분", detail: "유료 광고 vs 콘텐츠 마케팅 비중 결정 + ROAS 목표 설정"),
                .init(label: "3. 콘텐츠 일정", detail: "주간 SNS 포스팅 + 리뷰 유도 + 인플루언서 협업 일정 셋업"),
                .init(label: "4. 측정 지표 설정", detail: "방문자·전환율·CTR·CAC·LTV 5개 지표 대시보드 셋업"),
                ],
                verifyItems: [
                "광고 표현 — 「최저가」 「최고」 「유일」 등 비교 광고 객관 근거 필수, 위반 시 표시광고법 과징금",
                "인플루언서 협업 — 「유료 광고」 표시 의무 (#광고 #협찬), 미표시 시 공정위 과징금 + 인플루언서도 책임",
                "네이버 검색광고 — 키워드 입찰 단가 인상 추세, ROAS 200% 미만이면 즉시 중단·재구성",
                isDigital
                    ? "플랫폼 광고 — 크몽·클래스101 광고는 노출 위치별 효율 차이 큼, 검색·기획전 광고 분리 측정"
                    : "쿠팡 광고 — 노출 위치별 효율 차이 큼, 카테고리 검색·상세 페이지 광고 분리 측정",
                "리뷰 — 자작·가족·지인 리뷰 적발 시 플랫폼 영구정지 + 표시광고법 위반 (10만원 이하 과태료/건)",
                "개인정보 — 마케팅 활용 동의 별도 수집 의무, 위반 시 개인정보보호법 과징금 (매출 3% 이내)",
                ],
                nextStageLabel: "월 운영비 검토",
                nextSummary: "채널·예산·콘텐츠·측정 4축 셋업 완료 → 월 운영비 검토 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
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
                    BUEyebrow(isDigital ? "입점 플랫폼 검색 최적화" : "네이버 쇼핑 SEO 최적화")
                    Text("온라인 매출의 60%+가 검색에서 시작됩니다. 첫 1개월이 노출 순위를 결정합니다.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                    if isDigital {
                        pairRow(title: "상품명 = 핵심 키워드 + 결과물", detail: "\"실무 엑셀 템플릿 30종 — 보고서 자동화\" — 검색어를 앞에, 구매자가 얻는 결과를 뒤에")
                        pairRow(title: "카테고리·태그 정확히 매칭", detail: "크몽·클래스101 카테고리와 상품이 불일치하면 노출 자체가 안 됩니다")
                        pairRow(title: "상세페이지 = 미리보기 + 목차", detail: "샘플 페이지·목차·결과물 스크린샷이 전환의 핵심. 검색용 텍스트 설명도 본문에 포함")
                        pairRow(title: "후기 관리", detail: "첫 10개 후기가 플랫폼 랭킹·전환을 좌우 — 구매자 후기 요청 메시지 템플릿 준비")
                        pairRow(title: "최신성 — 업데이트·신규 등록 주기", detail: "플랫폼은 업데이트되는 상품을 우대합니다. 버전 업데이트·신규 상품 등록을 주기화")
                    } else {
                        pairRow(title: "상품명 = 핵심 키워드 + 속성", detail: "\"여성 린넨 원피스 여름 A라인 프리사이즈\" — 검색어를 순서대로 넣으세요. 브랜드명은 앞에")
                        pairRow(title: "카테고리 정확히 매칭", detail: "네이버 쇼핑 카테고리와 상품이 불일치하면 노출 자체가 안 됩니다")
                        pairRow(title: "상세페이지 텍스트 최적화", detail: "이미지만 넣지 마세요. 검색 크롤러는 텍스트를 읽습니다. 핵심 키워드를 본문에 포함")
                        pairRow(title: "태그 10개 모두 채우기", detail: "스마트스토어 태그는 최대 10개만 등록됨(초과 입력해도 10개까지) — 검색 노출에 직접 영향, 관련 키워드로 10개 꽉 채우기")
                        pairRow(title: "최신성 점수 — 신상품 등록 주기", detail: "네이버는 신상품을 우대합니다. 주 2-3회 신규 상품 등록이 이상적")
                    }
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
                        Text("초기 2주는 데이터 수집 기간. 일 5,000~10,000원부터 시작하세요. 첫 광고 캠페인은 ROAS 200% 목표로 작게 시작.")
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
                    BUEyebrow("초기 리뷰 확보 전략")
                    Text("리뷰 0개 상품은 클릭률이 80% 낮습니다. 첫 10개 리뷰가 결정적입니다.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
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
                    BUEyebrow(isDigital ? "후기 빠르게 확보하는 방법" : "리뷰 빠르게 확보하는 방법")
                    if isDigital {
                        methodRow(method: "베타 리더 모집 (소규모)", tip: "무료", detail: "타깃 커뮤니티에서 3~5명에게 무료 제공 → 후기·개선 피드백 확보. 비용: 없음(디지털 복제 원가 0)")
                        methodRow(method: "후기 이벤트", tip: "무료", detail: "구매 고객 후기 작성 시 업데이트 우선 제공·보너스 자료 증정. 전환율 대비 가장 효율적")
                        methodRow(method: "지인·커뮤니티 초기 구매", tip: "실비", detail: "솔직하게 부탁하세요. 자작·조작 후기는 플랫폼 제재 대상. 실제 구매 필수")
                    } else {
                        methodRow(method: "체험단 모집 (소규모)", tip: "무료", detail: "쇼핑·블로그 체험단 3~5명 병행. 스마트스토어 실구매 포토·동영상 리뷰가 쇼핑 상위노출·전환에 더 직접적 (블로그 리뷰도 동시 확보). 비용: 제품 원가 + 배송비")
                        methodRow(method: "포토리뷰 이벤트", tip: "₩500/건", detail: "구매 고객에게 포토리뷰 작성 시 500~1,000원 적립금. 전환율 대비 가장 효율적")
                        methodRow(method: "지인·친구 초기 구매", tip: "실비", detail: "솔직하게 부탁하세요. 조작 리뷰는 네이버 패널티 대상. 실제 구매+배송 필수")
                    }
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

    /// 제목 + 설명 2줄 행 — 웹 SEO 카드 { title, detail } 아이템 1:1.
    private func pairRow(title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(BUFont.bodySmall.weight(.semibold))
                .foregroundStyle(BUColor.ink)
            Text(detail)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    /// 리뷰 확보 방법 행 — 웹 { method, detail, tip } 1:1 (tip = 비용 배지).
    private func methodRow(method: String, tip: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(method)
                    .font(BUFont.bodySmall.weight(.semibold))
                    .foregroundStyle(BUColor.ink)
                Text(detail)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
            }
            Spacer(minLength: 0)
            Text(tip)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .fixedSize()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

#if DEBUG
#Preview("OnlineMarketing") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["online-marketing"] }
    return OnlineMarketingStageView().environment(store)
}
#endif
