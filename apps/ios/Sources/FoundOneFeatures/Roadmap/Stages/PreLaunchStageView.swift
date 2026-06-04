//
//  PreLaunchStageView.swift — 소프트 오픈 & 사전 런치 (iOS 네이티브)
//
//  웹 SSOT 미러 (apps/web/.../offline/PreLaunchStage.tsx) — 6 페이지:
//    pg 0 — 개요 (StageOverview)
//    pg 1 — 1. 손님 초대 (WorkStep + 손님 4유형 + 가격 3옵션)
//    pg 2 — 2. 당일 운영 (WorkStep + 8축 체크리스트)
//    pg 3 — 3. 피드백 (WorkStep + 채널 + 메모 + 필수 3질문)
//    pg 4 — 4. 본 오픈 준비 (WorkStep + 5종 보강 + 예정일)
//    pg 5 — 마무리 (요약 — shell wrapup)
//  상단 KEY ACTION 히어로는 BUStageKeyActionRegistry["pre-launch"] 자동 노출.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct PreLaunchStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "pre-launch"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    private var helperText: String {
        switch cluster.category {
        case .food, .cafeDessert: return "본 오픈 전 마지막 리허설. 가족·동네 주민 우선 초대 + 30~50% 할인으로 결제·조리 흐름 검증."
        case .beauty:             return "베타 고객 시술 — 지인·체험단 우선 + 무료 또는 50% 할인. 시술·예약·결제 흐름 검증."
        case .fitness:            return "프리오픈 멤버 — 1주 무료 체험 + 회원 가입 시 20~30% 할인. 시설·강사·결제 흐름 검증."
        case .education:          return "오리엔테이션 + 시범 수업. 학부모·학생 우선 초대 + 1주 무료. 강의·시설·등록 흐름 검증."
        case .pet:                return "베타 고객 — 지인 반려동물 우선 + 50% 할인. 미용·호텔·예약 흐름 검증."
        case .livingService:      return "베타 출장 — 지인·동네 우선 + 50% 할인. 출장·작업·결제 흐름 검증."
        case .space:              return "프리오픈 예약 — 지인·SNS 팔로워 우선 + 무료 또는 50% 할인. 예약·청소·결제 흐름 검증."
        case .retail:             return "프리오픈 세일 — 지인·동네 우선 + 20~40% 할인. 진열·결제·CS 흐름 검증."
        case .onlineDigital:      return "베타 판매 — 알림받기 100명 + 첫 주문 할인. 자기 주문 1사이클 (포장→송장→발송) 검증."
        case .startupTech:        return "베타 사용자 10명 — 인터뷰·waitlist 추출 + 24h 환영 메일. 핵심 funnel 검증."
        }
    }

    // 가격 정책 선택
    @AppStorage("prelaunch.pricing") private var pricingChoice = "" // "free" / "discount" / "full"

    // 당일 8축 체크 (웹 8축 미러)
    @AppStorage("prelaunch.clean")     private var dayClean     = false
    @AppStorage("prelaunch.staff")     private var dayStaff     = false
    @AppStorage("prelaunch.pos")       private var dayPOS       = false
    @AppStorage("prelaunch.ambiance")  private var dayAmbiance  = false
    @AppStorage("prelaunch.observe")   private var dayObserve   = false
    @AppStorage("prelaunch.payment")   private var dayPayment   = false
    @AppStorage("prelaunch.fbcard")    private var dayFbCard    = false
    @AppStorage("prelaunch.debrief")   private var dayDebrief   = false

    // 피드백
    @AppStorage("prelaunch.feedback.note")  private var feedbackNote = ""
    @AppStorage("prelaunch.feedback.done")  private var feedbackDone = false

    // 본 오픈
    @AppStorage("prelaunch.grandopen.date")  private var grandOpenDate = ""
    @AppStorage("prelaunch.grandopen.done")  private var grandOpenDone = false

    private let pages = ["개요", "1. 손님 초대", "2. 당일 운영", "3. 피드백", "4. 본 오픈 준비", "마무리"]

    private var dayCheckCount: Int {
        [dayClean, dayStaff, dayPOS, dayAmbiance, dayObserve, dayPayment, dayFbCard, dayDebrief].filter { $0 }.count
    }

    private var dayChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if dayClean { s.insert("clean") }; if dayStaff { s.insert("staff") }
                if dayPOS { s.insert("pos") }; if dayAmbiance { s.insert("ambiance") }
                if dayObserve { s.insert("observe") }; if dayPayment { s.insert("payment") }
                if dayFbCard { s.insert("fbcard") }; if dayDebrief { s.insert("debrief") }
                return s
            },
            set: { new in
                dayClean = new.contains("clean"); dayStaff = new.contains("staff")
                dayPOS = new.contains("pos"); dayAmbiance = new.contains("ambiance")
                dayObserve = new.contains("observe"); dayPayment = new.contains("payment")
                dayFbCard = new.contains("fbcard"); dayDebrief = new.contains("debrief")
            }
        )
    }

    /// 웹 gateTasks (required:true) 미러 — 모든 게이트 만족 시에만 다음 단계로.
    private var canCompleteStage: Bool {
        !pricingChoice.isEmpty && dayCheckCount == 8 && feedbackDone && grandOpenDone
    }

    public init() {}

    private var advanceHint: String {
        if pricingChoice.isEmpty { return "「손님 초대」 탭에서 가격 정책을 선택하세요" }
        if dayCheckCount < 8 { return "당일 체크 \(dayCheckCount)/8 — 모두 체크해야 진행" }
        if !feedbackDone { return "피드백 수집·정리 완료 토글을 켜세요" }
        if !grandOpenDone { return "본 오픈 준비 완료 토글을 켜세요" }
        return "소프트 오픈 완료 — 본 오픈으로!"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "소프트 오픈",
            stageEyebrow: "단계 19 · 소프트 오픈",
            helperText: helperText,
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
                .init(label: "3. 피드백 4축 수집", detail: "맛·서비스·가격·분위기 — 종이 카드 + 폼(구글/네이버/카카오)"),
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
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: overviewPage
                    case 1: invitePage
                    case 2: dayPage
                    case 3: feedbackPage
                    case 4: grandOpenPage
                    default: wrapupPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 개요 (웹 StageOverview 미러)

    private var overviewPage: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                BUEyebrow("이 단계 개요")
                Text("소프트 오픈 90분이 본 오픈의 첫 달 매출 곡선을 결정합니다")
                    .font(.system(size: 18, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Text("본 오픈 직전 마지막 검증. 지인·이웃·인플루언서 10~30명을 초대해 운영 1회전을 돌리면 POS·동선·메뉴·서비스의 실 문제가 모두 드러납니다. 본 오픈 직전 1~2개만 보강해도 첫 달 별점·재방문률이 크게 좌우됩니다.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 12) {
                    Text("별점 +0.3").font(.system(size: 24, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    Text("소프트 오픈 진행 매장 평균 별점 차이")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                VStack(alignment: .leading, spacing: 8) {
                    Text("이 단계에서 진행 — 총 5단계")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.7))
                    outlineRow("1. 손님 초대", "10~30명 초대 + 가격 결정 (무료/할인/정가)", "사전")
                    outlineRow("2. 당일 운영", "8축 체크 + 운영 중 손님·직원 관찰", "90분")
                    outlineRow("3. 피드백", "맛·서비스·가격·분위기 — 폼 또는 카드", "30분")
                    outlineRow("4. 본 오픈 준비", "메뉴·직원·마케팅·발주 최종 보강", "당일")
                    outlineRow("마무리", "자주 빠뜨리는 항목 + 진행 상태 요약", nil)
                }

                HStack(alignment: .top, spacing: 9) {
                    Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.success).padding(.top, 1)
                    Text("운영 1회전이 검증된 상태로 본 오픈 진입. 메뉴·동선·POS·SNS 가 통합 작동하는 것을 확인 + 첫 별점 5개 이상을 사전 확보. 다음 단계(본 오픈) 부터 신규 고객 매출 곡선이 안정적.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.78)).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.success.opacity(0.16), lineWidth: 1))
            }
        }
    }

    private func outlineRow(_ step: String, _ title: String, _ time: String?) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text(step).font(.system(size: 10.5, weight: .bold)).tracking(0.4).textCase(.uppercase)
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                Text(title).font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
            if let time {
                Text(time).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.white, in: Capsule())
                    .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 1))
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    // MARK: - WorkStep 공통 카드 (웹 WorkStep 미러)

    private func workStepCard(stepLabel: String, time: String, headline: String,
                              why: String, how: [(String, String)],
                              watchouts: [(String, String)] = []) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Text(stepLabel)
                        .font(.system(size: 11, weight: .bold)).tracking(0.5)
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 9).padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.06), in: Capsule())
                    Text("· \(time)").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                }
                Text(headline)
                    .font(.system(size: 17, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                Text(why)
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 0) {
                    Text("할 일").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.75))
                        .padding(.bottom, 8)
                    ForEach(Array(how.enumerated()), id: \.offset) { idx, h in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(idx + 1)")
                                .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                .frame(width: 28, height: 28)
                                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(h.0).font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(h.1).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 8)
                        if idx < how.count - 1 { Divider().opacity(0.5) }
                    }
                }

                if !watchouts.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("주의", systemImage: "exclamationmark.triangle.fill")
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.danger)
                        ForEach(Array(watchouts.enumerated()), id: \.offset) { _, w in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(w.0).font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.danger)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(w.1).font(.system(size: 12)).foregroundStyle(BUColor.danger.opacity(0.85)).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1))
                }
            }
        }
    }

    // MARK: - 사장님 상황 유리한 길 (웹 myAdvice 1:1)

    private var favorableCard: some View {
        let tip = favorableTip(cluster.category.rawValue)
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: 10) {
                BUEyebrow("사장님 상황에 유리한 길")
                Text(tip.context)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(BUColor.midnight08, in: Capsule())
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 15)).foregroundStyle(BUColor.success).padding(.top, 1)
                    Text(tip.recommendation)
                        .font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
                Text(tip.rationale)
                    .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func favorableTip(_ categoryId: String) -> (context: String, recommendation: String, rationale: String) {
        switch categoryId {
        case "food":
            return ("음식점 / F&B", "가족·동네 주민 우선 초대 + 30~50% 할인으로 결제 흐름 검증",
                "음식 맛은 가족이 가장 솔직. 동네 주민은 잠재 단골 — 첫 인상이 재방문 결정. 할인은 결제·POS 검증 가능.")
        case "cafe-dessert":
            return ("카페 / 디저트", "인스타 팔로워 + 동네 주민 혼합 + 무료 시식",
                "카페는 SNS 바이럴 결정 — 인스타 인증샷 유도. 무료로 풍성한 인상 → 자발적 게시물 확보.")
        case "beauty":
            return ("미용·뷰티", "지인 + 마이크로 인플루언서 (1,000~10,000) 무료 시술",
                "기술 매장은 시술 결과 = 매출. 비주얼 인증이 핵심 — 인플루언서 후기가 가장 빠른 신뢰.")
        case "fitness":
            return ("필라테스·요가·PT", "지인 + 동네 주민 무료 체험 클래스",
                "운동은 직접 체험 = 등록 결정. 무료 체험으로 첫 회원 확보 → 단골 7~14일 재방문 유도.")
        case "education":
            return ("학원", "기존 학부모 네트워크 + 무료 시범 수업",
                "학원은 입소문이 핵심. 학부모 네트워크 시범 수업 → 첫 등록자 5~10명이 1년 매출 결정.")
        case "pet":
            return ("펫", "동네 강아지 보호자 + 30% 할인 첫 시술",
                "펫 매장은 보호자 신뢰가 매출 직결. 동네 단골 보호자 확보 → 입소문 빠름.")
        case "online-digital":
            return ("온라인·디지털", "친구 10명 한정 베타 + 무료 발송 시뮬",
                "온라인은 결제·포장·발송 흐름 검증이 핵심. 친구 10명에게 실제 주문 → CS·반품·발송 사이클 검증.")
        case "living-service":
            return ("세탁·청소·수리", "동네 주민 + 친한 지인 50% 할인 첫 의뢰",
                "방문형 = 시간 약속·품질이 단골 결정. 첫 5건이 후기 → 후기가 신규 고객 유입 결정.")
        case "space":
            return ("공간 임대", "친구 그룹 무료 사용 + 사진·리뷰 부탁",
                "공간은 사진·리뷰가 매출. 무료 사용 → 인스타·네이버 플레이스 사진 확보 → 노출 ↑.")
        default:
            return favorableTip("food")
        }
    }

    // MARK: - pg 1 손님 초대

    private var invitePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "1. 손님 초대", time: "사전 7~14일",
                headline: "10~30명 초대 + 4가지 손님 유형 + 가격 결정",
                why: "본 오픈 매출의 30~50%는 첫 1주 단골이 결정. 소프트 오픈 손님이 그 단골 풀의 시드. 솔직한 가족·잠재 단골 동네 주민·바이럴 인플루언서·전문 동료 — 4유형을 섞어야 균형 있는 피드백.",
                how: [
                    ("오픈 7~14일 전 초대장 발송 — 카톡 + DM", "「○○ 매장 소프트 오픈에 초대합니다」 + 일시·주소·메뉴 사진. 가족·이웃·인플루언서·동료 4분류 명단."),
                    ("가격 결정 — 무료 / 30~50% 할인 / 정가 중 선택", "무료=인상 최대 / 할인=결제·POS 검증 / 정가=실수익 모델 검증. 매장 컨셉·예산·검증 목표에 맞춰 결정."),
                    ("예상 인원 1.5배로 식자재·소모품 발주", "결품 = 첫 인상 폭락. 핵심 메뉴는 충분히, 사이드는 1.2배. 남으면 직원 식사·다음날 사용."),
                    ("초대 명단·확정 인원 카톡방 또는 구글폼으로 관리", "「몇 명 + 시간대」 사전 확정 — 노쇼 방지 + 좌석·서비스 사전 분배."),
                ],
                watchouts: [
                    ("가족·지인만 초대하면 진짜 시장 검증 안 됨", "그들은 무조건 좋다고 함. 동네 주민 + 인플루언서 + 동료를 반드시 섞어야 솔직한 피드백 확보."),
                    ("결품·POS 미작동 = 첫 인상 즉사", "1.5배 발주 + 결제 단말 사전 테스트 + 백업 결제 수단 (계좌이체 QR) 까지 준비."),
                ]
            )
            favorableCard

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("초대 손님 4유형 — 균형 있게 섞기")
                    let guests: [(String, String)] = [
                        ("가족 / 친한 지인", "솔직한 피드백의 최고 소스 — 창피함 없이 날카롭게 말해줄 사람 우선"),
                        ("동네 주민 / 이웃", "잠재 단골 고객 — 오픈 후에도 가장 자주 올 수 있는 사람들"),
                        ("인스타 팔로워 / 마이크로 인플루언서", "SNS 바이럴 효과 — 팔로워 1,000~10,000명 수준 권장"),
                        ("업계 지인 / 블로거", "전문적 관점의 날카로운 피드백 — 개업 전 마지막 검증"),
                    ]
                    ForEach(Array(guests.enumerated()), id: \.offset) { idx, g in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text("\(idx + 1)")
                                .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                .frame(width: 28, height: 28)
                                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(g.0).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(g.1).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("가격 결정 — 한 옵션 선택")
                    let options: [(String, String, String)] = [
                        ("free",     "무료 제공",    "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보."),
                        ("discount", "30~50% 할인", "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대."),
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

    // MARK: - pg 2 당일 운영 (8축)

    private var dayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "2. 당일 운영", time: "90분",
                headline: "8축 체크 + 운영 중 손님·직원 관찰 — 본 오픈 보강 포인트 발견",
                why: "소프트 오픈은 「운영 점검」이 핵심. 사인·POS·간판이 따로 작동하던 것을 처음으로 합쳐 돌리는 자리. 청결·직원·결제·분위기·관찰·결제오류·피드백 카드·디브리핑 8축을 빠짐없이 체크.",
                how: [
                    ("오픈 1시간 전 — 청결·POS·분위기 최종 점검", "청소·결제 테스트·조명·음악 다시 한 번. 손님 입장 직전 매장 톤 셋업."),
                    ("오픈 직후 — 직원 역할·응대 멘트 마지막 브리핑", "포지션·응대 스크립트·비상 시 대응 (결제 오류·컴플레인) 한 번 더 합의."),
                    ("운영 중 — 손님·직원 관찰 + 사진·메모", "표정·대화·남기는 음식·머무는 위치 실시간 기록. 직원 동선 병목 메모."),
                    ("마감 직후 — 직원 디브리핑 30분", "잘된 점 3 + 개선점 3 모두 발언. 회의록 1페이지 — 내일 본 오픈 보강 자료."),
                ],
                watchouts: [
                    ("결제 단 1건 오류 = 별점 -0.4", "오픈 전날 카드 1건 실결제 후 즉시 취소로 흐름까지 검증. 백업 결제 수단(계좌이체 QR) 준비."),
                    ("직원 임의 응대 = 첫인상 흐트러짐", "응대 멘트 1줄이라도 통일. 「어서오세요」 + 「○○ 매장입니다」 + 메뉴 추천 1문장."),
                ]
            )

            BUInteractiveChecklist(
                title: "당일 운영 8축 체크 (\(dayCheckCount)/8)",
                items: [
                    .init(id: "clean",     label: "매장·시설 청결 & 위생 최종 점검", detail: "바닥·테이블·화장실·쓰레기통 모두 점검·소독"),
                    .init(id: "staff",     label: "직원 역할 배분 & 브리핑",         detail: "포지션·응대 멘트·비상 대응 방법 공유"),
                    .init(id: "pos",       label: "POS & 결제 단말기 정상 작동",     detail: "카드·현금·간편결제 테스트 결제 후 즉시 취소"),
                    .init(id: "ambiance",  label: "조명·음악·온도·향기 설정",         detail: "원하는 브랜드 분위기 연출, 손님 입장 전 최종 확인"),
                    .init(id: "observe",   label: "운영 중 병목 & 손님 반응 관찰",   detail: "표정·대화·남기는 것·오래 머무는 곳 실시간 기록"),
                    .init(id: "payment",   label: "결제 오류·지연 여부 체크",         detail: "영수증 출력, 결제 완료 문자 발송 여부 확인"),
                    .init(id: "fbcard",    label: "피드백 카드 수거 & 정리",         detail: "무기명 가능 → 솔직한 의견 유도"),
                    .init(id: "debrief",   label: "직원 회의 진행",                  detail: "잘된 점 3가지 + 개선점 3가지 모두 발언하게 하기"),
                ],
                checked: dayChecksBinding
            )

            if dayCheckCount == 8 {
                BUCard(.card) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success).font(.system(size: 22))
                        Text("8축 모두 완료! 소프트 오픈 운영 준비 완료입니다.")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                    }
                }
            }
        }
    }

    // MARK: - pg 3 피드백

    private var feedbackPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "3. 피드백 수집", time: "30분",
                headline: "맛·서비스·가격·분위기 — 4축 피드백을 구조화해 받기",
                why: "「어땠어요?」 → 「좋았어요」 = 무의미. 4축으로 구조화해야 본 오픈 보강 포인트가 나옵니다. 매장 맞춤 5문항을 폼으로 만들어 카톡으로 전송.",
                how: [
                    ("4축 5문항 구조화 — 맛·서비스·가격·분위기", "각 축마다 구체 질문 1개씩 + 「가장 인상 깊은 것 1개」. 구글폼·네이버폼으로 5분 제작."),
                    ("현장 종이 카드 + 디지털 폼 병행", "마감 전 종이 카드 (무기명) + 다음날 카톡으로 디지털 폼. 두 채널 모두 회수율 ↑."),
                    ("10명 이상 응답 받기 — 못 받으면 직접 전화", "10명 미만이면 통계적으로 무의미. 친한 지인부터 전화로 추가 수집."),
                    ("응답 1페이지 요약 — 본 오픈 보강 1~2 항목 결정", "공통 의견 3개 추출 → 본 오픈 직전 보강 가능한 1~2개만 선택. 그 이상은 본 오픈 후."),
                ],
                watchouts: [
                    ("「좋았어요」만 모으면 의미 0", "구체 질문이 핵심 — 「가장 인상 깊은 메뉴 1개?」 「개선했으면 하는 점 1개?」 처럼 답변 강제."),
                    ("10개 의견 모두 반영 = 본 오픈 지연", "공통 의견 1~2개만 골라 보강. 나머지는 본 오픈 후 데이터 보고 결정."),
                ]
            )

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("피드백 수집 채널 + 폼 빌더")
                    let channels: [(String, String)] = [
                        ("구글 폼", "응답 자동 스프레드시트 정리 · 무제한 무료 · 통계 자동 (docs.google.com/forms)"),
                        ("네이버 폼", "한국어 UI 친숙 · 모바일 응답 최적화 · 무료 템플릿 다수 (form.naver.com)"),
                        ("카카오 비즈니스 폼", "톡채널 친구에게 직접 발송 · 응답률 ↑ · 비즈채널 연결 무료"),
                        ("현장 종이 카드 (무기명)", "마감 전 테이블 비치 → 솔직한 즉석 의견 확보"),
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
        }
    }

    // MARK: - pg 4 본 오픈 준비

    private var grandOpenPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "4. 본 오픈 준비", time: "당일~D+1",
                headline: "메뉴·직원·마케팅·발주 4축 최종 보강 + 1페이지 요약",
                why: "소프트 오픈 결과를 본 오픈 직전 24~48시간 안에 반영해야 효과. 메뉴 1~2개 조정·직원 재교육·마케팅 콘텐츠·발주 1.5배 — 4축만 빠르게 보강하면 됩니다.",
                how: [
                    ("메뉴·가격 1~2개 조정 — 그 이상은 본 오픈 후", "공통 피드백 1~2개만 즉시 반영. 모두 반영하면 직원·POS 혼선 → 본 오픈 더 큰 사고."),
                    ("직원 재교육 — 1:1 코칭 30분", "당일 발견된 동선·응대 이슈 직원별로 짧게 코칭. 멘트·포지션·결제 흐름 통일."),
                    ("본 오픈 마케팅 콘텐츠 발행", "인스타 게시물 3개 + 릴스 1개 + 네이버 플레이스 영수증 리뷰 5개 (지인 부탁) — 첫 주 노출 폭발의 시드."),
                    ("본 오픈 식자재·소모품 1.5배 발주", "첫 주말 결품 = 첫 신규 고객 인상 즉사. 공급처 사전 알림으로 입고 시간까지 확정."),
                ],
                watchouts: [
                    ("피드백 모두 반영 시 본 오픈 지연", "공통 의견 1~2개만. 그 이상은 본 오픈 후 실데이터 기반으로 결정."),
                    ("마케팅 콘텐츠 사전 준비 안 하면 첫 주 노출 0", "본 오픈 D-3 까지 인스타 3 + 릴스 1 + 네이버 영수증 5건 시드 확보 — 알고리즘 첫인상 결정."),
                ]
            )

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("본 오픈 준비 5종")
                    let checks: [(String, String)] = [
                        ("메뉴·가격·옵션 최종 확정", "피드백 반영해 1~2가지 조정. 그 이상은 본 오픈 후"),
                        ("직원 재교육 (피드백 기반)", "당일 발견된 동선·응대 이슈 1:1 코칭"),
                        ("본 오픈 마케팅 콘텐츠 발행", "인스타 게시물 3개 + 릴스 1개 + 네이버 플레이스 영수증 리뷰 5개"),
                        ("본 오픈 식자재·장비·소모품 발주", "예상 인원 1.5배로 발주 — 첫 주말 결품 방지"),
                        ("소프트 오픈 결과 1페이지 요약 작성", "잘된 점·개선점·예상 이슈 — 직원·운영 자료"),
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
        }
    }

    // MARK: - pg 5 마무리

    private var wrapupPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("진행 상황 요약")
                    summaryRow("가격 정책 결정", done: !pricingChoice.isEmpty)
                    summaryRow("당일 운영 8축 점검", done: dayCheckCount == 8)
                    summaryRow("피드백 수집·정리", done: feedbackDone)
                    summaryRow("본 오픈 준비 완료", done: grandOpenDone)
                    if canCompleteStage {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success)
                            Text("운영 1회전 검증 완료 — 본 오픈 단계로 진행하세요.")
                                .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                        }.padding(.top, 4)
                    }
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

    private func summaryRow(_ label: String, done: Bool) -> some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16)).foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label).font(BUFont.bodySmall).foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
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
