//
//  SourcingSetupStageView.swift — 소싱·상품 준비 (iOS 네이티브)
//
//  stageId: "sourcing-setup"
//
//  2-page (segmented): 소싱 전략 / 상품 준비
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct SourcingSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "sourcing-setup"

    // 업종 정합(2026-07-02): 디지털 상품·창작자 서비스는 재고 소싱(중국직구·KC)이 없음 → 안내로 대체.
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    @AppStorage("src.sourcingType")    private var sourcingType    = ""
    @AppStorage("src.supplierLocked")  private var supplierLocked  = false
    @AppStorage("src.photosDone")      private var photosDone      = false
    @AppStorage("src.pricingDone")     private var pricingDone     = false
    @AppStorage("src.done")            private var done            = false

    private let pages = ["소싱 전략", "상품 준비"]

    private struct SourcingOption {
        let id: String; let name: String; let desc: String
    }

    private let sourcingOptions: [SourcingOption] = [
        SourcingOption(id: "domestic", name: "국내 도매 소싱",         desc: "1688.com·동대문·가락시장·오카도. 리드타임 짧음. 단가 높음."),
        SourcingOption(id: "import",   name: "중국 직수입",             desc: "알리바바·1688. 단가 낮음. 리드타임 4-8주. MOQ 주의."),
        SourcingOption(id: "own",      name: "자체 제작 (OEM/ODM)",     desc: "브랜드 독점성. 초기 비용 높음. 재고 리스크."),
    ]

    public init() {}

    /// 게이트: 소싱 유형 1개 이상 선택.
    private var canCompleteStage: Bool { !sourcingType.isEmpty }

    private var advanceHint: String {
        if sourcingType.isEmpty { return "소싱 유형을 선택하세요" }
        return "소싱 전략 결정됨 — 다음 단계로"
    }

    public var body: some View {
        if isDigitalFulfillment(industryId) {
            digitalShell
        } else {
            standardBody
        }
    }

    // 디지털 상품·창작자: 물리 소싱 본문 게이팅 → 디지털 전달 안내.
    private var digitalShell: some View {
        BUStageShell(
            stageId: stageId,
            title: "상품 소싱 및 상세 페이지",
            stageEyebrow: "단계 11 · 소싱·상품 준비",
            helperText: "디지털 상품은 재고 소싱이 없습니다. 원본·라이선스·자동 전달 구조를 준비하세요.",
            canAdvance: true,
            advanceHint: "디지털 전달 구조 확인 — 다음 단계로",
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId, inputs: [:]) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: [:]) }
        ) {
            DigitalFulfillmentNoticeView(stage: .sourcing)
        }
    }

    private var standardBody: some View {
        BUStageShell(
            stageId: stageId,
            title: "상품 소싱 및 상세 페이지",
            stageEyebrow: "단계 11 · 소싱·상품 준비",
            helperText: "소싱 = 온라인 커머스의 원가 구조 — 마진을 결정하는 가장 중요한 결정. 목표 원가율: 소비자가의 30-40% 이하.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["sourcingType": sourcingType])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["sourcingType": sourcingType]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 소싱 방식 결정", detail: "국내도매·중국직구·자체제작·OEM·드롭배송 등 5축 비교 후 결정"),
                .init(label: "2. 1차 공급처 검증", detail: "샘플 주문 + 품질·납기·CS 응답 3축 직접 테스트 후 채택"),
                .init(label: "3. 마진 계산", detail: "원가 + 부가세 + 배송비 + 플랫폼 수수료 + 광고비 → 마진 30% 이상 확보"),
                .init(label: "4. 재고·물류 모델", detail: "직접 배송 vs 풀필먼트(쿠팡 로켓그로스·품고·셀러허브) 비교"),
                ],
                verifyItems: [
                "중국 직구 — 150달러 초과 시 관·부가세 발생(미국발은 200달러) + 초과 시 전체 금액 과세, KC 인증 의무 카테고리(전자제품·유아용품 등) 사전 확인",
                "위탁판매·드롭배송 — 공급처 결품 시 본인 책임, CS 분쟁 시 자체 환불 의무 발생",
                "OEM 제작 — MOQ(최소주문량) 보통 500~3000개, 자본·재고 회전 부담 인식",
                "원산지 표시 — 「Made in China」 누락 시 표시광고법 위반, 모든 상품 의무 표시",
                "지식재산 — 캐릭터·로고·디자인 무단 도용 시 상표·디자인권 침해, 시작 전 검색 필수",
                "수입 통관 — 식품·화장품·의료기기는 별도 수입신고 + KC·KFDA·식약처 승인 필수",
                ],
                nextStageLabel: "스토어 셋업",
                nextSummary: "소싱·공급처 검증 완료 → 스토어 셋업(상품 등록·배송·CS) 단계로 진입"
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
                    case 0: sourcingPage
                    default: productPage
                    }
                }
            }
        }
    }

    // MARK: - Page 0: 소싱 전략

    private var sourcingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소싱 유형 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(sourcingOptions, id: \.id) { opt in
                            sourcingButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("공급사 평가 기준")
                    infoRow(text: "견적 3곳 이상 비교")
                    infoRow(text: "샘플 주문 후 품질 확인")
                    infoRow(text: "MOQ(최소 주문 수량)·리드타임·결제 조건 협상")
                    infoRow(text: "공급사 다변화 (단일 소싱 리스크 방지)")
                }
            }
        }
    }

    private func sourcingButton(_ opt: SourcingOption) -> some View {
        let isSelected = sourcingType == opt.id
        return Button { sourcingType = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "shippingbox")
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

    // MARK: - Page 1: 상품 준비

    private var productPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("상품 사진·설명 제작")
                    labeledRow(label: "메인 사진",   text: "흰 배경·고해상도 (1000×1000px 이상). 스마트스토어 SEO의 핵심.")
                    labeledRow(label: "상세 페이지", text: "모바일 최적화. 상품 특징·사용법·실사 착용 컷 필수.")
                    infoRow(text: "전문 스튜디오 vs 자체 촬영: 초기엔 스마트폰+흰 배경지로 충분")
                }
            }

            // 상세페이지 6단 구조 (웹 "상세페이지 구성 순서" 1:1 — web==app)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("상세페이지 6단 구조 — 전환율 높이는 검증된 순서")
                    let steps: [(String, String, String)] = [
                        ("1", "히어로 이미지", "배경 제거한 깔끔한 메인 컷. 3초 안에 매력 전달."),
                        ("2", "고객 불안 해소", "교환/반품 정책, 인증 마크, 리뷰 수 강조."),
                        ("3", "상세 스펙 표", "소재·사이즈·중량 — 표로 정리. 비교가 쉬워야 구매."),
                        ("4", "라이프스타일 컷", "실사용 장면. ‘내가 쓰면 이렇게 되겠구나’ 상상 유도."),
                        ("5", "리뷰/후기 섹션", "구매자 97.2%가 리뷰 확인 — 포토 리뷰가 전환율 3배."),
                        ("6", "배송/CS 안내", "배송 소요일, 교환/반품 절차, 고객센터 연락처."),
                    ]
                    ForEach(steps, id: \.0) { num, title, detail in
                        HStack(alignment: .top, spacing: 10) {
                            Text(num).font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                                .frame(width: 22, height: 22)
                                .background(BUColor.midnight, in: Circle())
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    infoRow(text: "AI 상세페이지 도구: 망고보드 AI(mangoboard.net)·미리캔버스(miricanvas.com)·Canva AI — 상품 사진만 넣으면 자동 생성.")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("가격 책정 공식")
                    formulaRow(formula: "원가 × 3 = 최소 소비자가 (원가율 33%)")
                    infoRow(text: "경쟁사 가격 ±10% 내 포지셔닝")
                    infoRow(text: "무료 배송 기준가 설정 (4만원 이상 무료배송이 전환율↑)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $supplierLocked) {
                        Text("공급사 계약 완료 (최소 2곳)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $photosDone) {
                        Text("상품 사진·상세 페이지 제작 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $pricingDone) {
                        Text("가격 책정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("소싱·상품 준비 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
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

    private func labeledRow(label: String, text: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .fixedSize()
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }

    private func formulaRow(formula: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "equal.circle.fill")
                .font(.system(size: 14))
                .foregroundStyle(BUColor.midnight)
            Text(formula).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
        }
    }
}

#if DEBUG
#Preview("SourcingSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["sourcing-setup"] }
    return SourcingSetupStageView().environment(store)
}
#endif
