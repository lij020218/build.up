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

    // 업종 정합(2026-07-02): 디지털 상품·창작자 서비스는 택배·포장이 없음 → 안내로 대체.
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    @AppStorage("sto.storeFront")     private var storeFront     = false
    @AppStorage("sto.productListed")  private var productListed  = false
    @AppStorage("sto.shippingPolicy") private var shippingPolicy = false
    @AppStorage("sto.pgLive")         private var pgLive         = false
    @AppStorage("sto.done")           private var done           = false

    private var currentInputs: [String: String] {
        ["storeFront": "\(storeFront)", "productListed": "\(productListed)", "shippingPolicy": "\(shippingPolicy)", "pgLive": "\(pgLive)", "done": "\(done)"]
    }

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
        if isDigitalFulfillment(industryId) {
            digitalShell
        } else {
            standardBody
        }
    }

    // 디지털 상품·창작자: 물리 스토어·배송 본문 게이팅 → 디지털 전달 안내.
    private var digitalShell: some View {
        BUStageShell(
            stageId: stageId,
            title: "스토어 및 배송 세팅",
            stageEyebrow: "단계 12 · 스토어 셋업",
            helperText: "디지털 상품은 택배·포장이 없습니다. 자동 전달·결제·구독·약관을 세팅하세요.",
            canAdvance: true,
            advanceHint: "디지털 스토어 세팅 확인 — 다음 단계로",
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId, inputs: [:]) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: [:]) }
        ) {
            DigitalFulfillmentNoticeView(stage: .store)
        }
    }

    private var standardBody: some View {
        BUStageShell(
            stageId: stageId,
            title: "스토어 및 배송 세팅",
            stageEyebrow: "단계 12 · 스토어 셋업",
            helperText: "카테고리·배너·반품 정책 + 택배사 연동 + (자체몰) PG 연동 + CS 채널(카톡·톡톡) + 포장재 풀세트 실제 워크플로 테스트. 첫 주문 와서 막히면 리뷰가 망가진다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 상품 페이지 작성", detail: "메인 이미지 + 상세 페이지 + 옵션·재고·가격 설정 — 검색 키워드 최적화"),
                .init(label: "2. 배송·반품 정책", detail: "기본 배송비 + 무료배송 조건 + 반품·교환 정책 명시"),
                .init(label: "3. CS·상담 채널", detail: "카톡 채널·이메일·전화 1개 이상 + 운영 시간·응답 기준 명시"),
                .init(label: "4. 통합 관리 솔루션", detail: "샵링커·셀러허브(매출 50만↓ 무료) 등 멀티 채널 통합 도입 검토, 규모 커지면 사방넷"),
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
            // 웹 "플랫폼별 스토어 세팅 > 네이버 스마트스토어" 6단계 1:1 (sell.smartstore.naver.com)
            BUCard(.card) {
                VStack(spacing: 0) {
                    BUEyebrow("네이버 스마트스토어 셋업 (sell.smartstore.naver.com)")
                        .padding(.bottom, BUSpacing.sm)
                    stepRow(num: 1, title: "스마트스토어 센터 → 판매자 정보 등록 (사업자등록증 + 통신판매업 신고증)", isLast: false)
                    stepRow(num: 2, title: "스토어 기본 설정: 스토어명, 로고, 대표 이미지, 소개글", isLast: false)
                    stepRow(num: 3, title: "배송 템플릿 설정: 배송비 (무료/조건부/유료), 출고지, 반품지 주소", isLast: false)
                    stepRow(num: 4, title: "교환/반품 정책 작성 (7일 이내 교환/반품, 왕복 택배비 5,000원 등)", isLast: false)
                    stepRow(num: 5, title: "정산 계좌 등록 (법인/개인 계좌 + 세금계산서 발행 설정)", isLast: false)
                    stepRow(num: 6, title: "쇼핑윈도 카테고리 신청 (의류, 식품 등 카테고리별 추가 심사 필요)", isLast: true)
                }
            }

            // 쿠팡·11번가 퀵레프 (웹 멀티 플랫폼 가이드 1:1 — 매출 안정 후 확장)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("매출 안정 후 — 쿠팡·11번가 확장 퀵레프")
                    labeledRow(label: "쿠팡", text: "WING 판매자센터 가입→사업자 인증. 로켓그로스는 판매수수료 4~10.9% + 입출고·배송·보관 요금 별도(월 55,000원 서버이용료는 일반 마켓플레이스 기준). 입고 시 바코드 부착→물류센터 발송. 정산 구매확정 후 7~14영업일.")
                    labeledRow(label: "11번가", text: "셀러오피스 가입 — 신규 셀러 수수료 6% 혜택(12개월) + SKT 멤버십(T멤버십 적립) 연동.")
                    infoRow(text: "멀티 채널 동시 운영 시 샵링커·셀러허브 등 통합관리 툴로 재고·주문 동기화(월 6만원대, 매출 50만↓ 무료 / 규모 커지면 사방넷). ※올라 등 선정산은 통합관리와 다른 자금 서비스.")
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
                        Text("상품 등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - Page 1: 배송·결제

    private var shippingPaymentPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 웹 "택배 계약 가이드" 1:1 — 초기에는 우체국택배 → 물량 늘면 계약택배로 전환
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("택배 계약 가이드")
                    Text("초기에는 우체국택배 → 물량 늘면 계약택배로 전환")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                    labeledRow(label: "우체국택배 (시작)", text: "2,700원~/건 · 도서산간 추가 없음. 소량에 최적. 우체국 직접 접수 — 추천: 일 1-5건")
                    labeledRow(label: "CJ대한통운", text: "1,850원~/건 (계약) · 점유율 1위. D+1 배송. 편의점 접수. 물량 30건+/월 시 계약 가능 — 추천: 일 5건+")
                    labeledRow(label: "한진택배", text: "3,000원~/건 (계약) · 중대형 화물 강점. 전국 A/S망 — 대형 상품")
                    labeledRow(label: "로젠택배", text: "3,000원~/건 (계약) · 계약 할인폭 큰 편. 온라인 접수 편리 — 가격 협상")
                    infoRow(text: "택배비 협상 팁: 월 30건 이상이면 계약택배 요청 가능. CJ대한통운 1588-1255로 전화하여 '온라인 셀러 계약 택배' 문의하세요. 초기 단가 2,500~3,000원 가능.")
                }
            }

            // 웹 "오픈 전 필수 확인 사항" 6항목 1:1
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 전 필수 확인 사항")
                    checkRow(item: "교환/반품 정책을 스토어에 등록했는가?", why: "미등록 시 고객 분쟁 + 플랫폼 패널티")
                    checkRow(item: "배송비 정책이 설정되었는가? (무료/조건부/유료)", why: "배송비 무료 설정 시 상품가에 포함해야 마진 유지")
                    checkRow(item: "정산 계좌가 등록되었는가?", why: "미등록 시 매출금 수령 불가")
                    checkRow(item: "사업자 정보가 정확히 입력되었는가?", why: "사업자등록증과 불일치 시 정산 보류")
                    checkRow(item: "테스트 주문을 해봤는가?", why: "실제 결제→배송→정산 전 과정 1회 테스트 필수")
                    checkRow(item: "고객 문의 응대 채널이 준비되었는가?", why: "채널톡/카카오톡 상담 연동. 24시간 내 응답이 판매자 등급에 영향")
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
                        Text("테스트 주문 완료 (실제 결제→배송→정산 1회)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
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

    /// 체크 항목 + 이유 행 — 웹 "오픈 전 필수 확인 사항" { item, why } 1:1.
    private func checkRow(item: String, why: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .strokeBorder(BUColor.midnight.opacity(0.3), lineWidth: 1.5)
                .frame(width: 16, height: 16)
                .padding(.top, 1)
            VStack(alignment: .leading, spacing: 2) {
                Text(item)
                    .font(BUFont.bodySmall.weight(.semibold))
                    .foregroundStyle(BUColor.ink)
                Text(why)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.02), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
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
