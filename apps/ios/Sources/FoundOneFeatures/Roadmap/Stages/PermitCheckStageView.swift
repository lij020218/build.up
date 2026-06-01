//
//  PermitCheckStageView.swift — 인허가 사전 점검 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/PermitCheckPanels.tsx
//  stageId: "permit-check"
//
//  6-page 세그먼트 (웹 패턴 미러):
//    pg 0 — 개요 (왜 / 무엇을 / 끝나면)
//    pg 1 — 1. 건물 적합성 (할 일 + 주의)
//    pg 2 — 2. 사람 적합성 (할 일 + 주의)
//    pg 3 — 3. 시설 적합성 (할 일 + 주의)
//    pg 4 — 4. 임대인 협상 (할 일 + 사장님 상황)
//    pg 5 — 체크리스트 (내 매물 직접 점검 — 진행 게이트)
//
//  KEY ACTION 히어로는 BUStageKeyActionRegistry("permit-check") 에서 셸이 자동 노출.
//  업종(cluster.category) 별로 할 일·협상 팁이 분기됨.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct PermitCheckStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "permit-check"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }
    private var isFoodLike: Bool { cluster.category == .food || cluster.category == .cafeDessert }

    // 건물 체크
    @AppStorage("permit.building.usage")    private var buildingUsage    = false
    @AppStorage("permit.building.septic")   private var buildingSeptic   = false
    @AppStorage("permit.building.violation")private var buildingNoVio    = false

    // 사람 체크
    @AppStorage("permit.person.hygiene")    private var personHygiene    = false
    @AppStorage("permit.person.health")     private var personHealth     = false

    // 시설 체크
    @AppStorage("permit.facility.fire")     private var facilityFire     = false
    @AppStorage("permit.facility.vent")     private var facilityVent     = false
    @AppStorage("permit.facility.electric") private var facilityElec     = false
    @AppStorage("permit.facility.gas")      private var facilityGas      = false

    private var buildingPassed: Bool { buildingUsage && buildingSeptic && buildingNoVio }
    private var personPassed: Bool   { personHygiene && personHealth }
    private var facilityPassed: Bool { facilityFire && facilityVent && facilityElec && facilityGas }
    private var allPassed: Bool      { buildingPassed && personPassed && facilityPassed }

    private var checkedCount: Int {
        [buildingUsage, buildingSeptic, buildingNoVio,
         personHygiene, personHealth,
         facilityFire, facilityVent, facilityElec, facilityGas]
            .filter { $0 }.count
    }

    private var canCompleteStage: Bool { allPassed }

    private var advanceHint: String {
        if allPassed { return "3축 모두 통과 — 다음 단계로" }
        if page < 5 { return "마지막 「체크리스트」 탭에서 내 매물을 점검하세요 (\(checkedCount)/9)" }
        if !buildingPassed { return "건물 적합성 항목을 점검하세요 (\(checkedCount)/9)" }
        if !personPassed { return "사람 항목 (교육·보건증) 점검 (\(checkedCount)/9)" }
        if !facilityPassed { return "시설 항목 점검 (\(checkedCount)/9)" }
        return "9개 항목 모두 체크하세요 (\(checkedCount)/9)"
    }

    private let pages = ["개요", "1. 건물", "2. 사람", "3. 시설", "4. 협상", "체크리스트"]

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인허가 사전 확인",
            stageEyebrow: "단계 6 · 인허가 사전 점검",
            helperText: "계약 전에 내 업종에 필요한 인허가·위생 교육·안전 요건을 확인 — 발급은 나중, 지금은 '무엇이 필요한지'만.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 건물 적합성", detail: "건축물대장 용도·정화조·위반 표시 — 영업 가능 건물인지 확정"),
                    .init(label: "2. 사람 적합성", detail: "본인 면허·위생교육·보건증 일정 확정"),
                    .init(label: "3. 시설 적합성", detail: "소방완비·환기·전기·가스 보강 가능 여부 확인"),
                    .init(label: "4. 임대인 협상", detail: "빠진 항목 = 임대료 인하·보강 비용 분담 협상 카드로 정리"),
                ],
                verifyItems: [
                    "건축물대장은 임대인 말이 아니라 정부24(gov.kr)에서 직접 발급해 확인 — 「위반건축물」 표시 1개면 영업신고 영구 불가",
                    isFoodLike ? "정화조 BOD 용량 — 30평 식당 기준 7~10인용 이상. 5인용은 부족 → 증축 1,000만원+ 또는 매물 변경" : "용도지역·소음·배수 기준 — 업종별 영업 가능 여부를 계약 전에 확정",
                    "면허·위생교육·보건증은 영업 시작 전 의무 — 사전 일정 확보로 오픈 지연 0",
                    "소방완비증명서(2층 이상 또는 100㎡↑) 발급 가능 여부 — 임대 전 관할 소방서 확인",
                    isFoodLike ? "환기·후드 외부 덕트 설치 가능 여부 — 불가 매물은 배달전문도 조리 불가" : "환기·전기 용량 보강 가능 여부 — 임대 전 확인",
                    "부족 항목은 사인 전 특약(임대인 비용 분담·원상복구 면제)으로 명시 — 못 받으면 매물 변경",
                ],
                nextStageLabel: "상권 후보 비교",
                nextSummary: "내 업종이 이 건물에서 영업 가능한지 확정 → 상권·매물 후보 비교 단계로"
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
                    case 1: buildingPage
                    case 2: personPage
                    case 3: facilityPage
                    case 4: negotiationPage
                    default: checklistPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 개요

    private var overviewPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 헤더 + stat — 한 카드 안에
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    BUEyebrow("이 단계 개요")
                    Text("임대 계약 전 30분 — 영업 가능 여부를 확정해 보증금을 지킵니다")
                        .font(.system(size: 18, weight: .heavy))
                        .tracking(-0.3)
                        .foregroundStyle(BUColor.midnightDeep)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("건축물 용도, 정화조, 환기, 소방, 면허 — 이 중 하나라도 안 맞으면 영업신고 자체가 거절됩니다. 임대 계약 후 발견하면 보증금 1,000~5,000만원이 즉시 묶입니다.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)

                    // stat 박스 (카드 안 tint 블록)
                    HStack(spacing: 12) {
                        Text("70%")
                            .font(.system(size: 30, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                        Text("임대 계약 전 인허가 사전 점검을\n안 하는 사장님 비율")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                        Spacer(minLength: 0)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }

            // 작업 목차 — 카드 안에
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("이 단계에서 진행 — 총 4단계")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.6)
                        .textCase(.uppercase)
                        .foregroundStyle(BUColor.midnight.opacity(0.7))
                    outlineRow(1, "건물 적합성", "건축물대장 → 용도·정화조·위반 표시 확인", "10분")
                    outlineRow(2, "사람 적합성", "본인 면허·위생교육·보건증 일정 확정", "10분")
                    outlineRow(3, "시설 적합성", "소방완비·환기·전기·가스 검사 가능 여부", "10분")
                    outlineRow(4, "임대인 협상", "빠진 항목 = 임대인 협상 카드로 정리", nil)
                }
            }

            // 결과 박스
            HStack(alignment: .top, spacing: 9) {
                Image(systemName: "arrow.up.right.circle.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.success)
                    .padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text("이 단계가 끝나면")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.3)
                        .foregroundStyle(BUColor.success)
                    Text("내 업종이 이 건물에서 영업 가능한지 확정됩니다. 부족한 항목은 임대인 협상 카드로 사용해 임대료 인하 또는 보강 비용 부담을 받아냅니다.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.ink.opacity(0.78))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.success.opacity(0.16), lineWidth: 1)
            )
        }
    }

    private func outlineRow(_ num: Int, _ title: String, _ detail: String, _ time: String?) -> some View {
        HStack(alignment: .top, spacing: 11) {
            Text("\(num)")
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .frame(width: 22, height: 22)
                .background(BUColor.midnight.opacity(0.10), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    if let time {
                        Text(time)
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 1)
                            .background(BUColor.midnight.opacity(0.06), in: Capsule())
                    }
                }
                Text(detail)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - pg 1 건물

    private var buildingPage: some View {
        BUWorkStep(
            stepLabel: "1. 건물 적합성",
            time: "10분",
            headline: "건축물대장으로 「용도 + 정화조 + 위반 표시」 확인",
            why: "\(buildingAxisSubtitle) 임대인의 말 「용도 OK」는 절대 신뢰 X — 정부24 건축물대장으로만 검증합니다.",
            tasks: buildingRowSpecs.map { BUWorkStepTask(title: $0.label, detail: $0.tip) },
            watchouts: buildingWatchouts
        )
    }

    private var buildingWatchouts: [BUWorkStepWatchout] {
        var out: [BUWorkStepWatchout] = [
            .init(label: "위반건축물 표시 = 영업신고 영구 불가",
                  text: "건축물대장에 「위반건축물」 표기 시 무조건 매물 변경. 임대료 30% 싸도 입주 절대 불가.")
        ]
        if isFoodLike {
            out.append(.init(label: "정화조 용량 부족 = 증축 1,000만원+ 또는 매물 변경",
                             text: "건물주 동의 + 시·군청 신고 + 1~2개월 공사. 안 되면 다른 매물."))
        }
        return out
    }

    // MARK: - pg 2 사람

    private var personPage: some View {
        BUWorkStep(
            stepLabel: "2. 사람 적합성",
            time: "10분",
            headline: "면허·보건증·위생교육 — 영업 시작 전 의무",
            why: "\(personAxisSubtitle) 영업 시작 후 발견하면 즉시 영업 정지 + 과태료. 사전에 일정 잡아두면 영업 시작 지연 0.",
            tasks: personRowSpecs.map { BUWorkStepTask(title: $0.label, detail: $0.tip) },
            watchouts: [
                .init(label: "면허자 채용에만 의존 = 퇴사 시 즉시 무자격 영업",
                      text: "본인이 면허 없을 때 채용 면허자가 퇴사하면 그날부터 무자격 영업. 본인 면허 취득 또는 2명+ 채용으로 분산.")
            ]
        )
    }

    // MARK: - pg 3 시설

    private var facilityPage: some View {
        BUWorkStep(
            stepLabel: "3. 시설 적합성",
            time: "10분",
            headline: "소방완비증명서 + 환기·후드 + 가스·전기 안전 확인",
            why: "\(facilityAxisSubtitle) 시설 미달 시 영업신고 거절 또는 영업 중 단속·과태료. 임대 전에 보강 가능 여부 확인.",
            tasks: facilityRowSpecs.map { BUWorkStepTask(title: $0.label, detail: $0.tip) },
            watchouts: facilityWatchouts
        )
    }

    private var facilityWatchouts: [BUWorkStepWatchout] {
        if isFoodLike {
            return [
                .init(label: "외부 환기 덕트 불가 매물 = 음식점 운영 불가능",
                      text: "공동주택·창문 없음·옥상 미사용 매물에서는 후드 설치 불가. 임대 전 외부 배기 가능 여부 확답 필수."),
                .init(label: "가스시설 검사 미통과 = 영업신고 거절",
                      text: "한국가스안전공사 검사 필수. 임대인이 「검사 통과 매물」이라 해도 직접 증명서 확인."),
            ]
        }
        return [
            .init(label: "소방완비증명서 없이 영업 = 단속·과태료",
                  text: "2층 이상 또는 100㎡↑ 또는 다중이용시설은 소방완비 의무. 임대 전 관할 소방서에 발급 가능 여부 확인.")
        ]
    }

    // MARK: - pg 4 협상

    private var negotiationPage: some View {
        BUWorkStep(
            stepLabel: "4. 임대인 협상",
            headline: "빠진 항목 = 임대인 협상 카드 — 사인 전 특약으로 명시",
            why: "부족 항목(정화조·환기·전기·배수 등)은 임대료 인하 또는 보강 비용 임대인 부담으로 협상. 사인 전 특약 명시 못 받으면 매물 변경.",
            tasks: [
                .init(title: "후보 매물 3곳에 같은 질문",
                      detail: "「내 업종 영업 가능?」 + 「부족 시설 보강 가능?」 + 「검사 증명서 보유?」 — 답변 거부 임대인은 패스."),
                .init(title: "보강 가능 항목 = 비용 분담 특약",
                      detail: "「임대인이 1/2 부담 + 임차 종료 시 원상복구 면제」 사인 전 특약. 평균 500만원 절약."),
                .init(title: "다음 단계 (상권 후보 비교) 로 진행",
                      detail: "건물·사람·시설 3축 모두 통과한 매물만 다음 단계로. 협상 거부 매물은 후보에서 제외."),
            ],
            favorable: negotiationFavorable
        )
    }

    private var negotiationFavorable: BUWorkStepFavorable {
        switch cluster.category {
        case .food, .cafeDessert:
            return .init(context: "음식점 / 카페",
                         recommendation: "정화조 BOD 부족 매물은 협상 X — 무조건 패스",
                         rationale: "정화조 증축은 건물주 동의 + 1,000~3,000만원 + 1~2개월 공사. 환기 덕트 외부 배기 불가도 패스.")
        case .beauty:
            return .init(context: "미용 / 뷰티",
                         recommendation: "배수·온수 용량 부족은 보강 비용 임대인 분담 특약",
                         rationale: "샴푸대 추가 시공 200~500만원. 펌·염색 환기 미달 매물은 시술 자체가 불가하니 패스.")
        case .fitness:
            return .init(context: "피트니스 / 필라테스",
                         recommendation: "층고 2.5m 이하·바닥 하중 부족은 패스",
                         rationale: "PT·필라 3m+, 요가 2.7m+ 권장. 바닥 보강은 2,000만원+ — 협상보다 매물 변경이 빠름.")
        default:
            return .init(context: cluster.categoryNounKo,
                         recommendation: "부족 시설은 「임대인 1/2 부담 + 원상복구 면제」 특약으로",
                         rationale: "사인 전 특약 명시. 보강 불가하거나 임대인이 거부하면 다른 매물이 낫습니다.")
        }
    }

    // MARK: - pg 5 체크리스트 (진행 게이트)

    private var checklistPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 6) {
                    BUEyebrow("내 매물 점검 체크리스트")
                    Text("\(checkedCount)/9 확인 완료")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(allPassed ? BUColor.success : BUColor.midnightDeep)
                    Text("위 가이드대로 직접 확인한 항목을 체크하세요. 3축 모두 통과해야 다음 단계로 진행됩니다.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            axisSection(icon: "building.2.fill", title: "1. 건물 적합성", passed: buildingPassed) {
                let rows = buildingRowSpecs
                permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $buildingUsage)
                permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $buildingSeptic)
                permitCheckRow(rows[2].label, tip: rows[2].tip, isChecked: $buildingNoVio)
            }
            axisSection(icon: "person.fill.checkmark", title: "2. 사람 적합성", passed: personPassed) {
                let rows = personRowSpecs
                permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $personHygiene)
                permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $personHealth)
            }
            axisSection(icon: "shield.checkered", title: "3. 시설 적합성", passed: facilityPassed) {
                let rows = facilityRowSpecs
                permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $facilityFire)
                permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $facilityVent)
                permitCheckRow(rows[2].label, tip: rows[2].tip, isChecked: $facilityElec)
                permitCheckRow(rows[3].label, tip: rows[3].tip, isChecked: $facilityGas)
            }
        }
    }

    // MARK: - Cluster 별 row spec

    private typealias RowSpec = (label: String, tip: String)

    private var buildingAxisSubtitle: String {
        switch cluster.category {
        case .food, .cafeDessert: return "건축물대장 — 용도·정화조·위반 표시를 확인합니다."
        case .beauty, .fitness, .pet, .education, .livingService, .space:
                                  return "건축물대장 — 용도·소음·위반 표시를 확인합니다."
        case .retail:             return "건축물대장 — 용도·매장 면적·위반 표시를 확인합니다."
        default:                  return "건축물대장 — 용도·위반 표시를 확인합니다."
        }
    }

    private var buildingRowSpecs: [RowSpec] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            ("건축물대장 용도 = 근린생활시설 (1·2종) 확인", "정부24 무료 발급. 음식점은 근린생활시설만 가능."),
            ("정화조 BOD 용량 충분 (30평 기준 7~10인용 이상)", "부족 시 증축 1,000만원+. 계약 전 반드시 확인."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 영업신고 영구 불가. 무조건 매물 변경."),
        ]
        case .beauty: return [
            ("건축물대장 용도 = 근린생활시설 (1·2종) 확인", "공중위생업 가능 용도. 정부24 무료 발급."),
            ("배수·온수 시설 충분 (샴푸대 1대당 30L/분)", "보일러 용량 확인. 부족 시 추가 시공 200~500만원."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 영업신고 영구 불가. 무조건 매물 변경."),
        ]
        case .fitness: return [
            ("건축물대장 용도 = 운동시설 가능 (1·2종 근린)", "체력단련장은 근린생활시설 가능. 정부24 확인."),
            ("바닥 하중 충족 (헬스 기준 400kg/㎡ 이상)", "부족 시 보강 공사 2,000만+. 임대 전 필수 확인."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가. 매물 변경."),
        ]
        case .education: return [
            ("건축물대장 용도 = 교육연구시설 또는 근린생활", "학원 = 교육연구시설. 교습소 = 근린 가능."),
            ("비상구·소화기 동선 확보 가능", "다중이용시설 + 학생 안전 의무."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가."),
        ]
        case .pet: return [
            ("건축물대장 용도 = 근린생활시설 + 동물업 가능", "지자체 조례 확인. 일부 주거지역 제한."),
            ("배수 시설 충분 (동물 미용·세척 폐수)", "폐수 처리 별도 계약 의무."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 등록 불가."),
        ]
        case .livingService: return [
            ("건축물대장 용도 = 근린생활시설 (세탁·청소 가능)", "공중위생업 분류 확인. 일부 주거 제한."),
            ("폐수 처리 시설 충분 (세탁업 의무)", "환경 기준 미달 시 영업 불가."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 신고 불가."),
        ]
        case .space: return [
            ("건축물대장 용도 = 근린생활 또는 업무시설", "공유공간 = 임대업. 다중이용시설 분류."),
            ("방음·환기 기준 충족 (소음 민원 대비)", "스튜디오·파티룸 1순위 민원."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 임대 사고 위험."),
        ]
        case .retail: return [
            ("건축물대장 용도 = 근린생활시설 (소매)", "매장 면적 50㎡ 이상 일부 추가 요건."),
            ("매장 출입·진열 동선 확보", "지하·2층 매장은 소방 별도 요건."),
            ("건축물대장에 '위반건축물' 표시 없음", "위반 표시 = 영업 불가."),
        ]
        case .onlineDigital: return [
            ("건축물대장 용도 = 창고·작업장 가능", "온라인 전용은 매장 X. 창고 임대 가능 용도 확인."),
            ("택배 출입·하역 동선 확보", "일일 택배 수거 가능한 1층·진입로."),
            ("건축물대장에 '위반건축물' 표시 없음", "임대 사고 방지."),
        ]
        case .startupTech: return [
            ("건축물대장 용도 = 업무시설 가능", "오피스·코워킹 입주 가능 용도."),
            ("전기·인터넷·환기 안정 (서버·다중 단말)", "용량 부족 시 별도 증설."),
            ("건축물대장에 '위반건축물' 표시 없음", "임대 사고 방지."),
        ]
        }
    }

    private var personAxisSubtitle: String {
        switch cluster.category {
        case .food, .cafeDessert: return "식품접객업 필수 자격(위생교육·보건증)을 사전 신청합니다."
        case .beauty:             return "공중위생업 필수 자격(면허·위생교육)을 확인합니다."
        case .fitness:            return "체육시설 안전·강사 자격을 확인합니다."
        case .education:          return "강사 자격·인력을 검증합니다."
        case .pet:                return "동물보호법 자격·교육을 확인합니다."
        case .livingService:      return "공중위생업 자격·교육을 확인합니다."
        default:                  return "운영자 자격·교육을 점검합니다."
        }
    }

    private var personRowSpecs: [RowSpec] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            ("식품위생교육 6시간 수강 완료 (한국외식업중앙회)", "영업신고 전 의무. 2.6만원. 온라인 수강 가능."),
            ("보건증(건강진단결과서) 발급 완료 — 본인 + 종업원", "보건소 3,000원 (지자체별 무료~3천원) · 민간병원 1.5~3만원. 1년 유효. 갱신 시 영업 중단 주의."),
        ]
        case .beauty: return [
            ("미용사·이용사·네일·피부 면허증 확인", "국가자격. 무자격 단속 시 영업정지 + 과태료."),
            ("위생교육 3시간 수강 완료 (미용사회)", "영업신고 전 의무. 사장·직원 모두."),
        ]
        case .fitness: return [
            ("강사·트레이너 자격증 (생활체육·필라테스)", "민간·국가자격 모두 가능. 응급처치 교육 권장."),
            ("체육시설 책임보험 가입", "회원 사고 대비. 분쟁 시 필수."),
        ]
        case .education: return [
            ("정교사·강사 자격 (학원·교습소 분류별)", "교육청 등록 강사만 합법. 무자격 = 행정처분."),
            ("응급처치·안전교육 수강", "학생 안전 의무."),
        ]
        case .pet: return [
            ("동물보건사·미용사 자격 확인 (국가/민간)", "농식품부 / 민간 미용사 자격 — 무자격 단속."),
            ("동물 폐기물 처리 계약 체결", "별도 계약 의무. 위반 시 환경법 처벌."),
        ]
        case .livingService: return [
            ("공중위생교육 3시간 수강 완료", "공중위생업 의무. 사장·직원 모두."),
            ("위생관리책임자 지정 (50평+)", "대형 매장 필수."),
        ]
        case .space: return [
            ("운영자 안전교육 수강 (다중이용시설)", "사고 예방·민원 대응 매뉴얼 숙지."),
            ("응급처치 교육 권장", "긴급 상황 대비."),
        ]
        default: return [
            ("사업주 기본 교육 수강 (소상공인진흥공단)", "온라인 무료. 권장."),
            ("응급처치 교육 권장", "기본 안전."),
        ]
        }
    }

    private var facilityAxisSubtitle: String {
        switch cluster.category {
        case .food, .cafeDessert: return "소방·환기·전기·가스 — 임대 전 보강 가능 여부를 확인합니다."
        case .beauty:             return "소방·환기·전기·위생설비를 임대 전 확인합니다."
        case .fitness:            return "소방·바닥·환기·전기를 임대 전 확인합니다."
        case .education:          return "소방·환기·전기·안전을 임대 전 확인합니다."
        case .pet:                return "소방·방음·환기·전기를 임대 전 확인합니다."
        case .livingService:      return "소방·배수·전기·환기를 임대 전 확인합니다."
        case .space:              return "소방·방음·전기·CCTV를 임대 전 확인합니다."
        case .retail:             return "소방·조명·전기·CCTV를 임대 전 확인합니다."
        case .onlineDigital:      return "전기·인터넷·환기·CCTV를 임대 전 확인합니다."
        case .startupTech:        return "전기·인터넷·환기·보안을 임대 전 확인합니다."
        }
    }

    private var facilityRowSpecs: [RowSpec] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            ("소방완비증명서 (2층 이상 또는 100㎡↑) 발급 가능", "100~300만원 + 2~3주. 다중이용업소 필수."),
            ("환기·후드 외부 덕트 설치 가능 확인", "배달전문도 조리 시 대형 후드 필요. 외부 배기 불가 매물은 불가."),
            ("전기 용량 충분 (카페 30A↑ 권장)", "에스프레소·오븐·제빙 동시 가동 시 30A 필수. 가스레인지·냉장고 포함 계산."),
            ("가스 시설 한국가스안전공사 검사 가능 확인", "임대인이 '검사 통과'라 해도 직접 증명서 확인 필수."),
        ]
        case .beauty: return [
            ("소방완비증명서 (다중이용시설 의무)", "100㎡↑ 또는 지하/2층 필수."),
            ("환기·약품 배출 (펌·염색제) 가능", "환기량 충분치 않으면 시술 불가."),
            ("전기 용량 (드라이·고주파 동시 가동)", "분전반 20A+ 권장."),
            ("위생설비·온수·세면대 충분", "샴푸대 1대 + 손세정 1대 최소."),
        ]
        case .fitness: return [
            ("소방완비증명서 (다중이용시설)", "지하·2층 의무."),
            ("바닥 충격흡수 (우레탄/고무 매트)", "아래층 민원 1순위. 시공 필수."),
            ("환기 (시간당 6회+) 가능", "땀·CO2 배출 의무."),
            ("전기 용량 (카디오 머신·음향)", "분전반 30A+ 권장."),
        ]
        case .education: return [
            ("소방완비증명서·비상구·소화기", "학생 안전 의무."),
            ("환기 (CO2 1000ppm 이하)", "다인 학습 환경."),
            ("전기 (프로젝터·노트북 다수)", "분전반 20A+."),
            ("CCTV·출입통제 설치 가능", "학부모 신뢰·안전 의무."),
        ]
        case .pet: return [
            ("소방완비증명서", "100㎡↑ 의무."),
            ("방음 (짖음 차단 다중 레이어)", "이웃 민원 1순위."),
            ("환기 (냄새 배출 강력)", "환기 부족 = 영업 신뢰 손실."),
            ("전기 (미용 장비·드라이 동시)", "분전반 20A+."),
        ]
        case .livingService: return [
            ("소방완비증명서 (필요 시)", "코인세탁·매장 운영 시."),
            ("배수 시설 (산업용 세탁기 폐수)", "환경 기준 충족."),
            ("전기 (세탁·건조기 단상/3상)", "30~50A 권장."),
            ("환기·소음 (이웃 민원 대비)", "기계 소음 차단."),
        ]
        case .space: return [
            ("소방완비증명서·비상구", "다중이용시설 의무."),
            ("방음 (스튜디오·파티룸 의무)", "이웃 민원 1순위."),
            ("전기 (조명·음향·기자재 동시)", "분전반 20A+."),
            ("CCTV·스마트락 (무인 운영 시)", "사고·분쟁 대비."),
        ]
        case .retail: return [
            ("소방완비증명서 (100㎡↑)", "다중이용시설."),
            ("조명 (상품 강조·매장 동선)", "분전반 15A+."),
            ("전기 (POS·CCTV·조명)", "분전반 15A+."),
            ("CCTV·도난방지", "오프라인 리테일 필수."),
        ]
        case .onlineDigital: return [
            ("전기 (창고·작업장 안정 전원)", "프린터·라벨기 + 작업등."),
            ("인터넷 (백본 안정)", "주문 동기화 끊김 사고."),
            ("환기 (작업 환경)", "포장 작업 장기 체류."),
            ("CCTV (재고 도난·분쟁 대비)", "택배 사진 자동 저장 워크플로."),
        ]
        case .startupTech: return [
            ("전기 (다중 단말·서버)", "분전반 30A+ 권장."),
            ("인터넷 (안정·백업 회선)", "장애 시 즉시 백업."),
            ("환기 (다중 인원 작업)", "CO2 1000ppm 이하."),
            ("보안 출입 (카드·생체)", "IP 보호·고객 데이터 보안."),
        ]
        }
    }

    // MARK: - Axis section (체크리스트 페이지)

    @ViewBuilder
    private func axisSection<Content: View>(
        icon: String,
        title: String,
        passed: Bool,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(passed ? BUColor.success : BUColor.midnight)
                Text(title)
                    .font(BUFont.cardTitleSmall)
                    .foregroundStyle(BUColor.midnightDeep)
                Spacer()
                if passed {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(BUColor.success)
                        .font(.system(size: 18))
                }
            }

            BUCard(.card) {
                VStack(spacing: 0) {
                    content()
                }
            }
        }
    }

    private func permitCheckRow(_ label: String, tip: String, isChecked: Binding<Bool>) -> some View {
        Button { isChecked.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isChecked.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18))
                    .foregroundStyle(isChecked.wrappedValue ? BUColor.success : BUColor.inkSubtle)
                    .padding(.top, 1)
                VStack(alignment: .leading, spacing: 3) {
                    Text(label)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(isChecked.wrappedValue ? BUColor.ink : BUColor.inkMuted)
                        .multilineTextAlignment(.leading)
                    Text(tip)
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .multilineTextAlignment(.leading)
                }
                Spacer()
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("PermitCheck") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["permit-check"] }
    return PermitCheckStageView().environment(store)
}
#endif
