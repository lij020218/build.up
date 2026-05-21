//
//  PreLaunchStageView.swift — 소프트 오픈 & 사전 런치 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/PreLaunchStage.tsx
//  stageId: "pre-launch"
//
//  food 카테고리 권장:
//    가족·동네 주민 우선 초대 + 30~50% 할인으로 결제 흐름 검증
//
//  4-page (세그먼트):
//    pg 0 — 손님 초대 & 가격 정책
//    pg 1 — 당일 운영 체크
//    pg 2 — 피드백 수집
//    pg 3 — 본 오픈 준비
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct PreLaunchStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "pre-launch"

    // 가격 정책 선택
    @AppStorage("prelaunch.pricing")          private var pricingChoice    = "" // "free" / "discount" / "full"

    // 당일 체크
    @AppStorage("prelaunch.clean")            private var dayCleaning      = false
    @AppStorage("prelaunch.staff")            private var dayStaff         = false
    @AppStorage("prelaunch.pos")              private var dayPOS           = false
    @AppStorage("prelaunch.menu")             private var dayMenu          = false
    @AppStorage("prelaunch.emergency")        private var dayEmergency     = false
    @AppStorage("prelaunch.photo")            private var dayPhoto         = false

    // 피드백
    @AppStorage("prelaunch.feedback.note")    private var feedbackNote     = ""
    @AppStorage("prelaunch.feedback.done")    private var feedbackDone     = false

    // 본 오픈
    @AppStorage("prelaunch.grandopen.date")   private var grandOpenDate    = ""
    @AppStorage("prelaunch.grandopen.done")   private var grandOpenDone    = false

    private let pages = ["손님 초대", "당일 운영", "피드백", "본 오픈"]

    private var dayCheckCount: Int {
        [dayCleaning, dayStaff, dayPOS, dayMenu, dayEmergency, dayPhoto].filter { $0 }.count
    }

    /// BUInteractiveChecklist 용 Set<String> binding — 기존 @AppStorage 6개와 양방향 sync.
    private var dayChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if dayCleaning { s.insert("clean") }
                if dayStaff    { s.insert("staff") }
                if dayPOS      { s.insert("pos") }
                if dayMenu     { s.insert("menu") }
                if dayEmergency { s.insert("emergency") }
                if dayPhoto    { s.insert("photo") }
                return s
            },
            set: { new in
                dayCleaning  = new.contains("clean")
                dayStaff     = new.contains("staff")
                dayPOS       = new.contains("pos")
                dayMenu      = new.contains("menu")
                dayEmergency = new.contains("emergency")
                dayPhoto     = new.contains("photo")
            }
        )
    }

    /// 웹 gateTasks (required:true) 미러 — 모든 게이트 만족 시에만 다음 단계로.
    private var canCompleteStage: Bool {
        !pricingChoice.isEmpty
            && dayCheckCount == 6
            && feedbackDone
            && grandOpenDone
    }

    public init() {}

    private var advanceHint: String {
        if pricingChoice.isEmpty { return "가격 정책을 선택하세요" }
        if dayCheckCount < 6 { return "당일 체크 \(dayCheckCount)/6 — 모두 체크해야 진행" }
        if !feedbackDone { return "피드백 수집·정리 완료 토글을 켜세요" }
        if !grandOpenDone { return "본 오픈 준비 완료 토글을 켜세요" }
        return "소프트 오픈 완료 — 본 오픈으로!"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "소프트 오픈",
            stageEyebrow: "단계 19 · 소프트 오픈",
            helperText: "본 오픈 전 마지막 리허설. 가족·동네 주민 우선 초대 + 30~50% 할인으로 결제 흐름 검증.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["pricing": pricingChoice])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["pricing": pricingChoice]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 손님 초대 + 가격 결정", detail: "10~30명 4유형(가족·이웃·인플루언서·동료) 균형 + 무료/할인/정가 결정"),
                .init(label: "2. 당일 운영 8축 점검", detail: "청결·브리핑·POS·분위기·관찰·결제·피드백카드·디브리핑"),
                .init(label: "3. 피드백 4축 수집", detail: "맛·서비스·가격·분위기 — AI 폼 + 종이 카드 + 폼 빌더(구글/네이버/카카오)"),
                .init(label: "4. 본 오픈 준비 5종 보강", detail: "메뉴 1~2개 조정·직원 재교육·마케팅 콘텐츠·1.5배 발주·1페이지 요약"),
                ],
                verifyItems: [
                "결제 단말 1건 실 카드 테스트 + 즉시 취소 — 결제 오류 1건 = 별점 -0.4",
                "직원 응대 멘트·포지션·비상 대응 통일 (당일 발견 이슈 모두 코칭)",
                "본 오픈 식자재·소모품 1.5배 발주 입고 시간 확정",
                "인스타 3 + 릴스 1 + 네이버 영수증 5건 시드 — 본 오픈 D-3 까지",
                "피드백 응답 10명 이상 + 공통 의견 1~2개만 본 오픈 직전 반영",
                "소프트 오픈 1페이지 요약 직원 공유 — 본 오픈 운영 자료",
                ],
                nextStageLabel: "다음 단계(본 오픈) 전 반드시 확인",
                nextSummary: "운영 1회전 검증 완료 → 본 오픈 (pre-launch-final) 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                // 가로 스크롤 탭바
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: invitePage
                    case 1: dayPage
                    case 2: feedbackPage
                    default: grandOpenPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 손님 초대

    private var invitePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("단계 19 · 소프트 오픈")
                    Text("소프트 오픈 —\n본 오픈 전 마지막 리허설")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("외식업 권장: 가족·동네 주민 우선 초대 + 30~50% 할인으로 결제 흐름 검증. 음식 맛은 가족이 가장 솔직하고, 동네 주민은 잠재 단골입니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("초대 손님 4종")
                    let guests: [(String, String)] = [
                        ("가족 / 친한 지인", "솔직한 피드백의 최고 소스 — 창피함 없이 날카롭게 말해줄 사람 우선"),
                        ("동네 주민 / 이웃", "잠재 단골 고객 — 오픈 후에도 가장 자주 올 수 있는 사람들"),
                        ("인스타 팔로워 / 마이크로 인플루언서", "SNS 바이럴 효과 — 팔로워 1,000~10,000명 수준 권장"),
                        ("업계 지인 / 블로거", "전문적 관점의 날카로운 피드백 — 개업 전 마지막 검증"),
                    ]
                    ForEach(guests, id: \.0) { name, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight.opacity(0.08)).frame(width: 28, height: 28)
                                Image(systemName: "person.fill").font(.system(size: 11)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("가격 정책 선택")
                    let options: [(String, String, String)] = [
                        ("free",     "무료 제공",    "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보."),
                        ("discount", "30~50% 할인", "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대. (음식점 권장)"),
                        ("full",     "정가 운영",    "할인·이벤트를 아껴뒀다 본오픈에 사용. 실수익 구조 그대로 테스트."),
                    ]
                    ForEach(options, id: \.0) { id, label, desc in
                        Button {
                            pricingChoice = pricingChoice == id ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                ZStack {
                                    Circle()
                                        .strokeBorder(pricingChoice == id ? BUColor.midnight : BUColor.inkSubtle, lineWidth: 2)
                                        .frame(width: 20, height: 20)
                                    if pricingChoice == id {
                                        Circle().fill(BUColor.midnight).frame(width: 10, height: 10)
                                    }
                                }
                                .padding(.top, 2)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                }
                                Spacer()
                            }
                            .padding(.vertical, 4).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - pg 1 당일 운영 체크

    private var dayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUInteractiveChecklist(
                title: "당일 운영 체크리스트",
                items: [
                    .init(id: "clean",     label: "매장·시설 청결 & 위생 최종 점검", detail: "바닥·테이블·화장실·쓰레기통 모두 점검·소독"),
                    .init(id: "staff",     label: "직원 역할 배분 & 브리핑",         detail: "포지션·응대 멘트·비상 대응 방법 공유"),
                    .init(id: "pos",       label: "POS·주문 시스템 최종 확인",       detail: "배달앱 연동 + 메뉴 가격 확인 + 테스트 주문"),
                    .init(id: "menu",      label: "메뉴 준비 & 재고 점검",          detail: "식재료 입고량·유통기한·조리 준비 상태 확인"),
                    .init(id: "emergency", label: "비상 연락망 & 돌발 상황 대응",    detail: "주방 사고·결제 오류·재료 부족 시 대응 방법"),
                    .init(id: "photo",     label: "대표 메뉴 사진 촬영",            detail: "소프트오픈 음식 사진 SNS 업로드용 준비"),
                ],
                checked: dayChecksBinding
            )

            if dayCheckCount == 6 {
                BUCard(.card) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success).font(.system(size: 22))
                        Text("모든 항목 완료! 소프트 오픈 준비 완료입니다.")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                    }
                }
            }

            warningCard(title: "소프트 오픈 당일 주의", items: [
                "직원 포지션 명확히 — 홀/주방 역할 혼선이 첫인상 실패 원인 1위",
                "첫 손님 대기 시간 20분 초과 = 재방문율 급락",
                "메뉴 수 최소화 권장 — 전 메뉴 완성도보다 핵심 3~5개 집중",
            ], color: .orange)
        }
    }

    // MARK: - pg 2 피드백

    private var feedbackPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("피드백 수집 채널")
                    let channels: [(String, String)] = [
                        ("구두 직접 질문", "\"솔직하게 말해주세요\" — 테이블에서 직접 묻기. 가장 날카로운 피드백 확보."),
                        ("QR 코드 설문지", "Google Forms·네이버 폼 무료 제공. QR코드 영수증에 삽입. 익명성으로 솔직한 답변."),
                        ("인스타 스토리 투표", "\"맛 어땠나요? 좋음 / 보통\" 스티커 투표. 팔로워 피드백 + SNS 콘텐츠 동시 확보."),
                        ("카카오 채널 채팅", "방문 후 카카오 채널로 후기 요청. 단골 전환 유도 동시에 가능."),
                    ]
                    ForEach(channels, id: \.0) { name, desc in
                        HStack(alignment: .top, spacing: 8) {
                            Text("→").font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소프트 오픈 피드백 메모")
                    TextField("음식 맛·서비스·가격·분위기에 대한 손님 피드백 정리", text: $feedbackNote, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .padding(.horizontal, 10).padding(.vertical, 8)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .lineLimit(4...10)
                    Toggle(isOn: $feedbackDone) {
                        Text("피드백 수집 & 개선사항 정리 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("반드시 물어봐야 할 3가지")
                    let questions = [
                        "다음에 또 오시겠어요? (재방문 의사)",
                        "주변에 추천하시겠어요? (입소문 가능성)",
                        "아쉬운 점이 있다면? (개선 포인트)",
                    ]
                    ForEach(questions, id: \.self) { q in
                        HStack(alignment: .top, spacing: 6) {
                            Text("Q.").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            Text(q).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 3 본 오픈 준비

    private var grandOpenPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("본 오픈 준비 체크리스트")
                    let checks: [(String, String)] = [
                        ("소프트오픈 피드백 반영 완료", "레시피·서비스·동선·가격 조정"),
                        ("네이버 플레이스 리뷰 대응 완료", "소프트오픈 리뷰 답글 100%"),
                        ("본 오픈 SNS 예고 게시물 준비", "D-3 인스타·카카오 채널 예고"),
                        ("본 오픈 할인·이벤트 준비", "첫 방문 할인·스탬프카드·리뷰 이벤트"),
                        ("재료 발주 & 재고 보충 완료", "본 오픈 초반 2~3배 수요 예측 발주"),
                        ("배달앱 광고 세팅 완료", "배민 오픈리스트·쿠팡이츠 광고 예산 설정"),
                    ]
                    ForEach(checks, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle").font(.system(size: 16)).foregroundStyle(BUColor.inkSubtle)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("본 오픈 예정일")
                    TextField("예) 2026년 6월 1일 (월)", text: $grandOpenDate)
                        .font(BUFont.body)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    Toggle(isOn: $grandOpenDone) {
                        Text("본 오픈 준비 완료 — 그랜드 오픈 Go!")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                    }.tint(BUColor.midnight)
                }
            }

            if grandOpenDone {
                BUCard(.hero) {
                    VStack(alignment: .center, spacing: BUSpacing.sm) {
                        Image(systemName: "party.popper.fill").font(.system(size: 36)).foregroundStyle(BUColor.midnight)
                        Text("축하합니다!")
                            .font(.system(size: 24, weight: .bold)).foregroundStyle(BUColor.midnightDeep)
                        Text("소프트 오픈부터 본 오픈 준비까지 모두 완료했습니다. 이제 사장님의 가게를 세상에 공개할 시간입니다.")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).multilineTextAlignment(.center).lineSpacing(3)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    // MARK: - Helpers

    private func dayCheckRow(_ label: String, detail: String, isOn: Binding<Bool>) -> some View {
        Button { isOn.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isOn.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18)).foregroundStyle(isOn.wrappedValue ? BUColor.success : BUColor.inkSubtle).padding(.top, 1)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(isOn.wrappedValue ? BUColor.ink : BUColor.inkMuted)
                    Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(1.5)
                }
                Spacer()
            }
            .padding(.vertical, 8).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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
#Preview("PreLaunch") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["pre-launch"] }
    return PreLaunchStageView().environment(store)
}
#endif
