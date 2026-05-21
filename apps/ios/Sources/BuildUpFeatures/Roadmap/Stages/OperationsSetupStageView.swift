//
//  OperationsSetupStageView.swift — 운영 시스템 세팅 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/OperationsSetupStage.tsx
//  stageId: "operations-setup"
//
//  2026년 4월 검증 데이터:
//    배달앱: 배민·쿠팡이츠 차등 7.8/6.8/2.0%, 요기요 4.7~9.7%
//    POS: 토스플레이스 단말기+프로그램 무료 (월정액 0원~)
//    SNS: 네이버 플레이스 등록 후 노출 최대 7일 소요
//
//  3-page (세그먼트):
//    pg 0 — 배달 플랫폼 선택
//    pg 1 — POS 선택
//    pg 2 — SNS·마케팅 채널
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct OperationsSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "operations-setup"

    @AppStorage("ops.delivery.baemin")    private var deliveryBaemin   = false
    @AppStorage("ops.delivery.coupang")   private var deliveryCoupang  = false
    @AppStorage("ops.delivery.yogiyo")    private var deliveryYogiyo   = false
    @AppStorage("ops.delivery.naver")     private var deliveryNaver    = false

    @AppStorage("ops.pos.selected")       private var posSelected      = ""
    @AppStorage("ops.pos.menuDone")       private var posMenuDone      = false
    @AppStorage("ops.pos.payDone")        private var posPayDone       = false
    @AppStorage("ops.pos.receiptDone")    private var posReceiptDone   = false
    @AppStorage("ops.pos.settleDone")     private var posSettleDone    = false

    @AppStorage("ops.sns.naver")          private var snsNaver         = false
    @AppStorage("ops.sns.instagram")      private var snsInstagram     = false
    @AppStorage("ops.sns.kakao")          private var snsKakao         = false

    private let pages = ["배달 플랫폼", "POS 선택", "SNS 세팅"]

    private var posTestsDone: Int {
        [posMenuDone, posPayDone, posReceiptDone, posSettleDone].filter { $0 }.count
    }

    private var posChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if posMenuDone    { s.insert("menu") }
                if posPayDone     { s.insert("pay") }
                if posReceiptDone { s.insert("receipt") }
                if posSettleDone  { s.insert("settle") }
                return s
            },
            set: { new in
                posMenuDone    = new.contains("menu")
                posPayDone     = new.contains("pay")
                posReceiptDone = new.contains("receipt")
                posSettleDone  = new.contains("settle")
            }
        )
    }

    private var canCompleteStage: Bool {
        !posSelected.isEmpty && snsNaver && posTestsDone == 4
    }

    private var advanceHint: String {
        if posSelected.isEmpty { return "POS 시스템을 선택하세요" }
        if posTestsDone < 4 { return "POS 설치 후 테스트 4단계 완료 (\(posTestsDone)/4)" }
        if !snsNaver { return "네이버 플레이스 등록은 필수입니다" }
        return "운영 시스템 셋업 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "운영 및 마케팅 준비",
            stageEyebrow: "단계 18 · 운영 시스템 세팅",
            helperText: "네이버 플레이스 등록 후 검색 노출까지 최대 7일 — 오픈 1~2주 전 등록 필수. 배달앱 가입 후 메뉴 등록까지 2~3일 소요됩니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["pos": posSelected])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["pos": posSelected]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. POS·결제·주문 시스템 연동", detail: "토스플레이스/배민·쿠팡이츠 연동 + 키오스크·테이블 오더 셋업"),
                .init(label: "2. 표준 운영 매뉴얼", detail: "오픈·중간·마감 체크리스트 + 위생·재고·민원 대응 SOP"),
                .init(label: "3. 마케팅·브랜드 채널", detail: "네이버 플레이스·카카오 채널·인스타 3축 + 리뷰 응대 룰"),
                .init(label: "4. 손익 모니터링 셋업", detail: "일별 매출·재료비·인건비 자동 기록 + 손익분기 추적"),
                ],
                verifyItems: [
                "POS — 카드 수수료(평균 1.5~2.5%) + 정산일(평균 3영업일) 사전 인지, 현금 흐름 시뮬",
                "배달 플랫폼 — 수수료(배민 6.8%·쿠팡이츠 9.8% + 결제 수수료) 매출 분리 회계 셋업",
                "위생교육 매년 갱신 — 식품접객업 영업자·종업원 모두 대상, 미이수 시 행정처분 + 영업정지",
                "민원 대응 — 식약처·소비자원 신고 24시간 내 대응 룰 + 사진·영상 증빙 자동 보관 시스템",
                "원산지 표시 — 농수산물 원산지 표시법 위반 시 1억원 이하 과징금, 전 메뉴 표시 의무",
                "리뷰·SNS — 광고성 리뷰(가족·지인) 식별 시 처분 가능, 진성 리뷰 유도 시스템 우선",
                ],
                nextStageLabel: "프리오픈·본 오픈 준비",
                nextSummary: "POS·SOP·마케팅·손익 4축 셋업 완료 → 프리오픈·본 오픈 준비 단계로 진입"
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
                    case 0: deliveryPage
                    case 1: posPage
                    default: snsPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 배달 플랫폼

    private var deliveryPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("배달 플랫폼 (2026 수수료 기준)")
                    let platforms: [(String, Binding<Bool>, String, String, String)] = [
                        ("배달의민족", $deliveryBaemin,  "차등 수수료 7.8/6.8/2.0% · 국내 점유율 약 60%", "배민 사장님앱 울트라콜·오픈리스트 광고로 노출 확대 가능. 배달·가게배달 정산 체계 별도 확인.", "#00C73C"),
                        ("쿠팡이츠",   $deliveryCoupang, "차등 7.8/6.8/2.0% · 단건 배달 전문 · 와우 회원 노출", "단건 배달로 배달 품질 최고. 쿠팡 브랜드 신뢰도 연계 신규 고객 유입.", "#E52222"),
                        ("요기요",     $deliveryYogiyo,  "차등 4.7~9.7% · GS리테일 운영 · 요기패스 구독 연동", "요기패스 구독 고객 우선 노출. 점유율 10~15% 하락세.", "#FF5A00"),
                        ("네이버 주문", $deliveryNaver,  "중개 수수료 0% (결제 수수료만) · 스마트플레이스 연동", "네이버 지도 주문 버튼 자동 노출. 포장·테이블 주문 최적. 자체 배달망 없음.", "#03C75A"),
                    ]
                    ForEach(platforms, id: \.0) { name, binding, tagline, desc, color in
                        deliveryRow(name: name, tagline: tagline, desc: desc, color: color, isOn: binding)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("등록 체크포인트")
                    let tips = [
                        "메뉴 사진 고화질 필수 — 사진 없는 메뉴 주문율 40% 이하",
                        "가격은 매장 가격 + 배달비 구조 명확히 설정 (포장 가격 구분)",
                        "영업 시간·최소 주문 금액·배달 가능 지역 정확히 입력",
                    ]
                    ForEach(tips, id: \.self) { tip in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(tip).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 POS

    private var posPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("POS 시스템 선택 (음식점)")
                    let systems: [(String, String, String)] = [
                        ("토스플레이스",  "단말기·프로그램 무료 · D+1 정산 · 신규 점주 1순위", "toss"),
                        ("KIS정보통신",   "국내 POS 1위 · 전국 방문 A/S · 배달앱 자동 연동", "kis"),
                        ("오더플레이스",  "F&B 특화 태블릿 · 배민·쿠팡·요기요 통합 수신", "order"),
                        ("스마트로",      "카드 단말기 중심 · 소규모 최적 · 월정액 없음", "smartro"),
                        ("아임포스",      "태블릿+앱 · 매출 통계·재고 기본 · 다양한 요금제", "ipos"),
                    ]
                    ForEach(systems, id: \.0) { name, desc, id in
                        Button {
                            posSelected = posSelected == id ? "" : id
                        } label: {
                            HStack(spacing: BUSpacing.sm) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .fill(posSelected == id ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                        .frame(width: 32, height: 32)
                                    Image(systemName: "creditcard").font(.system(size: 12)).foregroundStyle(BUColor.midnight)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                                }
                                Spacer()
                                if posSelected == id {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success).font(.system(size: 18))
                                }
                            }
                            .padding(.vertical, 6).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUInteractiveChecklist(
                title: "POS 설치 후 필수 테스트 4단계",
                items: [
                    .init(id: "menu",    label: "메뉴·가격 전체 등록 확인",            detail: "옵션·추가금액·품절 여부까지 점검"),
                    .init(id: "pay",     label: "카드 실결제 1건 테스트 (즉시 취소)",  detail: "취소 안 하면 오픈 전 매출로 잡힘"),
                    .init(id: "receipt", label: "영수증 출력 — 사업자명·번호·부가세 확인", detail: "세금계산서 발행 시 이 정보가 기준"),
                    .init(id: "settle",  label: "일 마감·정산 시뮬레이션",            detail: "정산 금액 = 실 매출 합계인지 비교"),
                ],
                checked: posChecksBinding
            )
        }
    }

    // MARK: - pg 2 SNS

    private var snsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필수 SNS 채널 세팅")
                    Toggle(isOn: $snsNaver) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("네이버 플레이스").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                Text("필수 1순위").font(.system(size: 10, weight: .bold)).foregroundStyle(Color(hex: "03C75A"))
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(Color(hex: "03C75A").opacity(0.1), in: Capsule())
                            }
                            Text("맛집 검색의 80%가 네이버 — 미등록 시 검색 자체 불가. 등록 후 노출까지 최대 7일 → 오픈 1~2주 전 등록 필수.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(Color(hex: "03C75A"))

                    Divider()

                    Toggle(isOn: $snsInstagram) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("인스타그램 비즈니스").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Text("F&B SNS 마케팅 1위 채널. 릴스·스토리 콘텐츠로 바이럴. 팔로워 = 단골 재방문율 직결.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $snsKakao) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("카카오 채널").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Text("단골 고객에게 카카오톡 메시지 직접 발송. 카카오맵 장소 노출 + 채널 개설 무료.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 첫 주 SNS 액션 플랜")
                    let actions: [(String, String)] = [
                        ("오픈 D-7", "네이버 플레이스 등록 + 대표 메뉴 사진 5장 이상 업로드"),
                        ("오픈 D-3", "인스타 계정 개설 + 인테리어·메뉴 스토리 예고 게시"),
                        ("오픈 Day", "첫 손님 인스타 인증샷 유도 + 네이버 리뷰 요청"),
                        ("오픈 D+7", "리뷰 답글 100% + 자주 묻는 Q&A 네이버 플레이스 등록"),
                    ]
                    ForEach(actions, id: \.0) { day, action in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 56, alignment: .leading)
                            Text(action).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            warningCard(title: "SNS 주의사항", items: [
                "네이버 플레이스 등록 → 노출까지 최대 7일 → 오픈 2주 전 등록",
                "인스타 팔로워 0에서 시작 — 광고 없이 성과까지 2~3개월 예상",
                "리뷰 무시 = 별점 하락 → 방문율 즉각 영향 (응답률 100% 목표)",
            ], color: .orange)
        }
    }

    // MARK: - Helpers

    private func deliveryRow(name: String, tagline: String, desc: String, color: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(tagline).font(.system(size: 10)).foregroundStyle(BUColor.inkMuted).lineLimit(1)
                }
                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(1.5)
            }
        }
        .tint(Color(hex: color))
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

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

#if DEBUG
#Preview("OperationsSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["operations-setup"] }
    return OperationsSetupStageView().environment(store)
}
#endif
