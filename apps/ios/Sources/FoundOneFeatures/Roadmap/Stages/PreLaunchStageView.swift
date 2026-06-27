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

    // 당일 운영 체크 — 세부업종 맞춤(SoftOpenRegistry, 웹 SSOT 미러). 동적 ID Set 저장.
    @AppStorage("prelaunch.daychecks") private var dayChecksRaw = ""

    private func K(_ l: BULoc) -> String { l.ko }
    private var soft: BUSoftOpenContent { SoftOpenRegistry.content(subIndustryId: industryId, categoryId: nil) }
    /// 공통 당일 점검 tail (운영모델 무관 — 대면 전용 직원·분위기 제외).
    private var universalDayTail: [BUSoftOpenDayCheck] {
        [
            .init(id: "day-observation", label: BULoc(ko: "운영 중 관찰·기록", en: "Observe & note"), detail: BULoc(ko: "이용·동선·반응을 실시간 메모. 병목·불편 기록.", en: "Log usage/flow/reactions; note bottlenecks.")),
            .init(id: "day-settlement", label: BULoc(ko: "마감 정산·재고 확인", en: "Closing settle & stock"), detail: BULoc(ko: "매출·결제 정산 + 소모품·재고 확인.", en: "Reconcile sales + check supplies/stock.")),
            .init(id: "day-sns", label: BULoc(ko: "오픈 SNS 1건 게시", en: "Post 1 opening SNS"), detail: BULoc(ko: "현장 사진·후기 1건 — 네이버·인스타 노출 시작.", en: "1 photo/review — start Naver/IG.")),
        ]
    }
    private var dayItems: [BUSoftOpenDayCheck] { SoftOpenRegistry.dayChecks(subIndustryId: industryId) + universalDayTail }
    private var dayCheckedSet: Set<String> { Set(dayChecksRaw.split(separator: ",").map(String.init)) }

    // 피드백
    @AppStorage("prelaunch.feedback.note")  private var feedbackNote = ""
    @AppStorage("prelaunch.feedback.done")  private var feedbackDone = false

    // 본 오픈
    @AppStorage("prelaunch.grandopen.date")  private var grandOpenDate = ""
    @AppStorage("prelaunch.grandopen.done")  private var grandOpenDone = false

    private var pages: [String] { ["개요", K(soft.page1Label), "2. 당일 운영", "3. 피드백", "4. 본 오픈 준비", "마무리"] }

    private var dayCheckCount: Int {
        let ids = Set(dayItems.map { $0.id }); return dayCheckedSet.intersection(ids).count
    }

    private var dayChecksBinding: Binding<Set<String>> {
        Binding(
            get: { dayCheckedSet },
            set: { dayChecksRaw = $0.sorted().joined(separator: ",") }
        )
    }

    /// 웹 gateTasks (required:true) 미러 — 모든 게이트 만족 시에만 다음 단계로.
    private var canCompleteStage: Bool {
        !pricingChoice.isEmpty && dayCheckCount == dayItems.count && feedbackDone && grandOpenDone
    }

    public init() {}

    private var advanceHint: String {
        if pricingChoice.isEmpty { return "「\(K(soft.page1Label))」 탭에서 가격 정책을 선택하세요" }
        if dayCheckCount < dayItems.count { return "당일 체크 \(dayCheckCount)/\(dayItems.count) — 모두 체크해야 진행" }
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
                .init(label: K(soft.page1Label), detail: soft.trialTypes.map { K($0.label) }.joined(separator: "·") + " 균형 유치"),
                .init(label: "2. 당일 운영 점검 (세부업종 맞춤)", detail: (dayItems.isEmpty ? "핵심 설비·결제·청결" : dayItems.prefix(5).map { K($0.label) }.joined(separator: "·"))),
                .init(label: "3. 피드백 수집", detail: soft.feedbackAxes.map { K($0.label) }.joined(separator: "·")),
                .init(label: "4. 본 오픈 준비", detail: soft.finalPrep.map { K($0.label) }.joined(separator: "·")),
                ],
                verifyItems: [
                "결제 1건 실테스트 + 즉시 취소 — 결제 오류 1건 = 평판 즉락",
                "당일 발견 이슈 모두 정리·보완 (응대·동선·설비·시스템)",
                "본 오픈 준비 확정 — " + soft.finalPrep.prefix(2).map { K($0.label) }.joined(separator: "·") + " 등",
                "네이버 플레이스·인스타 노출 시드 — 본 오픈 D-3 까지",
                "피드백 응답 10건 이상 + 공통 의견 1~2개만 본 오픈 직전 반영",
                "소프트 오픈 1페이지 요약 정리 — 본 오픈 운영 자료",
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
                    outlineRow(K(soft.page1Label), "체험·초대 대상 유치 + 가격 결정", "사전")
                    outlineRow("2. 당일 운영", "세부업종 맞춤 당일 점검 + 운영 관찰", "당일")
                    outlineRow("3. 피드백", soft.feedbackAxes.map { K($0.label) }.joined(separator: "·") + " — 폼 또는 카드", "30분")
                    outlineRow("4. 본 오픈 준비", soft.finalPrep.prefix(3).map { K($0.label) }.joined(separator: "·") + " 등", "당일")
                    outlineRow("마무리", "자주 빠뜨리는 항목 + 진행 상태 요약", nil)
                }

                HStack(alignment: .top, spacing: 9) {
                    Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.success).padding(.top, 1)
                    Text("운영 1회전이 검증된 상태로 본 오픈 진입. 설비·결제·시스템·SNS 가 통합 작동하는 것을 확인 + 첫 후기 5개 이상을 사전 확보. 다음 단계(본 오픈) 부터 신규 고객 매출 곡선이 안정적.")
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
                stepLabel: K(soft.page1Label), time: "사전 7~14일",
                headline: K(soft.softOpenMeaning),
                why: "본 오픈 전 마지막 검증 — 실제 운영을 1회전 돌려 문제를 미리 잡습니다. 아래 대상을 골고루 초대·유치해야 균형 잡힌 피드백을 얻습니다.",
                how: soft.page1Steps.map { (K($0.title), K($0.detail)) },
                watchouts: [
                    ("가까운 지인만 부르면 진짜 검증이 안 됨", "무조건 좋다고 합니다 — 잠재 고객·외부인을 반드시 섞어 솔직한 피드백을 확보하세요."),
                    ("결제·핵심 설비 미점검 = 첫인상 즉사", "오픈 전 결제 1건 실테스트 + 핵심 설비·소모품 사전 점검 + 백업 수단 준비."),
                ]
            )
            favorableCard

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("체험·초대 대상 — 균형 있게 섞기")
                    let guests: [(String, String)] = soft.trialTypes.map { (K($0.label), K($0.desc)) }
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
                headline: "세부업종 맞춤 당일 점검 + 운영 관찰 — 본 오픈 보강 포인트 발견",
                why: "소프트 오픈은 「운영 점검」이 핵심. 설비·결제·시스템이 따로 작동하던 것을 처음으로 합쳐 돌리는 자리. 아래 세부업종 핵심 점검 항목을 빠짐없이 확인하세요.",
                how: [
                    ("오픈 전 — 핵심 설비·결제·청결 최종 점검", "결제 테스트, 핵심 설비 시운전, 매장·시설 청결을 이용 직전 한 번 더."),
                    ("운영 중 — 이용 흐름·반응 관찰 + 사진·메모", "동선·대기·불편 지점을 실시간 기록. 병목과 오류를 즉시 메모."),
                    ("마감 — 정산·재고 확인 + 1페이지 회고", "매출·결제 정산, 소모품·재고 확인, 잘된 점 3·개선점 3 정리."),
                ],
                watchouts: [
                    ("결제 단 1건 오류 = 평판 즉락", "오픈 전 결제 1건 실테스트 후 즉시 취소로 흐름 검증. 백업 결제 수단(계좌이체 QR) 준비."),
                    ("핵심 설비 미점검 = 첫날 운영 정지", "업종 핵심 설비(기기·키오스크·예약·시스템)를 반드시 사전 시운전."),
                ]
            )

            BUInteractiveChecklist(
                title: "당일 운영 체크 — 세부업종 맞춤 (\(dayCheckCount)/\(dayItems.count))",
                items: dayItems.map { .init(id: $0.id, label: K($0.label), detail: K($0.detail)) },
                checked: dayChecksBinding
            )

            if dayCheckCount == dayItems.count {
                BUCard(.card) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success).font(.system(size: 22))
                        Text("모든 점검 완료! 소프트 오픈 운영 준비 완료입니다.")
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
                headline: "세부업종 맞춤 본 오픈 준비 보강 + 1페이지 요약",
                why: "소프트 오픈 결과를 본 오픈 직전 24~48시간 안에 반영해야 효과. 아래 세부업종 맞춤 준비 항목을 빠르게 보강하세요.",
                how: soft.finalPrep.map { (K($0.label), K($0.detail)) },
                watchouts: [
                    ("피드백 모두 반영 시 본 오픈 지연", "공통 의견 1~2개만. 그 이상은 본 오픈 후 실데이터 기반으로 결정."),
                    ("마케팅 콘텐츠 사전 준비 안 하면 첫 주 노출 0", "본 오픈 D-3 까지 인스타 3 + 릴스 1 + 네이버 영수증 5건 시드 확보 — 알고리즘 첫인상 결정."),
                ]
            )

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("본 오픈 준비 — 세부업종 맞춤")
                    let checks: [(String, String)] = soft.finalPrep.map { (K($0.label), K($0.detail)) }
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
                    summaryRow("당일 운영 점검", done: dayCheckCount == dayItems.count)
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
