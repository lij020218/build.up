//
//  StoreSetupStageView.swift — 스토어 셋업 (iOS 네이티브)
//
//  stageId: "store-setup"
//
//  2-page (segmented): 스토어 설정 / 배송·결제
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct StoreSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "store-setup"

    @AppStorage("sto.storeFront")     private var storeFront     = false
    @AppStorage("sto.productListed")  private var productListed  = false
    @AppStorage("sto.shippingPolicy") private var shippingPolicy = false
    @AppStorage("sto.pgLive")         private var pgLive         = false
    @AppStorage("sto.done")           private var done           = false

    private let pages = ["스토어 설정", "배송·결제"]

    public init() {}

    /// 게이트: 스토어 기본 + 상품 등록 + 배송정책 + 결제 4가지 모두 완료.
    private var canCompleteStage: Bool {
        storeFront && productListed && shippingPolicy && pgLive
    }

    private var advanceHint: String {
        let completed = [storeFront, productListed, shippingPolicy, pgLive].filter { $0 }.count
        if completed == 4 { return "스토어 셋업 완료 — 다음 단계로" }
        return "셋업 체크리스트 \(completed)/4 완료"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "스토어 및 배송 세팅",
            stageEyebrow: "단계 12 · 스토어 셋업",
            helperText: "스토어 첫 인상이 구매 전환율을 결정합니다. 스마트스토어 기준 평균 전환율 2-5% — 사진·설명·리뷰가 핵심.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 상품 페이지 작성", detail: "메인 이미지 + 상세 페이지 + 옵션·재고·가격 설정 — 검색 키워드 최적화"),
                .init(label: "2. 배송·반품 정책", detail: "기본 배송비 + 무료배송 조건 + 반품·교환 정책 명시"),
                .init(label: "3. CS·상담 채널", detail: "카톡 채널·이메일·전화 1개 이상 + 운영 시간·응답 기준 명시"),
                .init(label: "4. 통합 관리 솔루션", detail: "샵링커·올라·셀러허브 등 멀티 채널 통합 도입 검토"),
                ],
                verifyItems: [
                "상품 등록 — 상세페이지 효능·효과 표현 시 「의약품·의료기기 광고」 위반 위험, 표시광고법 사전 점검",
                "배송비 — 「조건부 무료배송」 표시 시 조건 명문화 필수, 「실비 청구」도 표시광고법 대상",
                "재고 동기화 — 멀티 플랫폼 운영 시 통합 솔루션 없으면 품절 분쟁 + 패널티 누적 위험",
                "CS 응답 — 7일 이내 청약철회 의무 + 환불 3영업일 이내 의무, 위반 시 분쟁조정 신청 가능",
                "리뷰 정책 — 자작·바이럴 리뷰 적발 시 표시광고법 + 플랫폼 영구정지, 진성 리뷰 유도 시스템",
                "택배사 계약 — CJ대한통운·롯데·한진 직계약 vs 대행 비교, 월 100건 이상 시 직계약 유리",
                ],
                nextStageLabel: "온라인 마케팅",
                nextSummary: "상품·배송·CS·통합관리 셋업 완료 → 온라인 마케팅 단계로 진입"
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
                    case 0: storeConfigPage
                    default: shippingPaymentPage
                    }
                }
            }
        }
    }

    // MARK: - Page 0: 스토어 설정

    private var storeConfigPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(spacing: 0) {
                    BUEyebrow("스마트스토어 셋업 순서")
                        .padding(.bottom, BUSpacing.sm)
                    stepRow(num: 1, title: "스마트스토어 판매자 가입 (sell.smartstore.naver.com)", isLast: false)
                    stepRow(num: 2, title: "스토어명·대표 카테고리·로고 설정", isLast: false)
                    stepRow(num: 3, title: "사업자 정보 연동", isLast: false)
                    stepRow(num: 4, title: "상품 등록 (최소 10개 이상 권장)", isLast: false)
                    stepRow(num: 5, title: "스토어 오픈 (검수 1-3일)", isLast: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("스토어 SEO 최적화")
                    infoRow(text: "상품명: 검색 키워드 앞에 배치 (예: '남성 슬림핏 청바지 스트레치')")
                    infoRow(text: "태그: 10개 풀 활용")
                    infoRow(text: "카테고리: 정확한 3단계 카테고리 선택")
                }
            }

            // 쿠팡·11번가 퀵레프 (웹 멀티 플랫폼 가이드 1:1 — 매출 안정 후 확장)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("매출 안정 후 — 쿠팡·11번가 확장 퀵레프")
                    labeledRow(label: "쿠팡", text: "WING 판매자센터 가입→사업자 인증. 로켓그로스(월 55,000원 + 수수료 4~10.8%) 입고 시 바코드 부착→물류센터 발송. 정산 구매확정 후 7~14영업일.")
                    labeledRow(label: "11번가", text: "셀러오피스 가입 — 신규 셀러 수수료 6% 혜택(12개월) + SKT 멤버십(T멤버십 적립) 연동.")
                    infoRow(text: "멀티 채널 동시 운영 시 샵링커·올라 등 통합관리 툴로 재고·주문 동기화(월 3~5만원).")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $storeFront) {
                        Text("스토어 기본 설정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $productListed) {
                        Text("상품 등록 완료 (최소 10개)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - Page 1: 배송·결제

    private var shippingPaymentPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("배송 정책 설정")
                    infoRow(text: "배송비 기준: 3만원 이상 무료 or 3000원 고정")
                    infoRow(text: "택배사 계약: CJ대한통운·롯데택배 (소규모: 선불택배 가능)")
                    infoRow(text: "발송 처리 기한: 영업일 기준 2일 이내 (지연 시 구매 취소)")
                    infoRow(text: "반품/교환 정책: 7일 이내 무조건 수락 (전자상거래법)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("결제 게이트웨이")
                    labeledRow(label: "스마트스토어", text: "네이버페이 기본 포함")
                    labeledRow(label: "자체몰",       text: "토스페이먼츠·KG이니시스·NICE페이 중 선택")
                    infoRow(text: "결제 실거래 테스트 필수 (1원 결제 후 환불)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $shippingPolicy) {
                        Text("배송 정책 설정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $pgLive) {
                        Text("결제 실거래 테스트 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("스토어 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, isLast: Bool) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast {
                Divider().padding(.leading, 52)
            }
        }
    }

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
}

#if DEBUG
#Preview("StoreSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["store-setup"] }
    return StoreSetupStageView().environment(store)
}
#endif
