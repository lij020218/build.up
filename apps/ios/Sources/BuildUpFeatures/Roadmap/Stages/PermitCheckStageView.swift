//
//  PermitCheckStageView.swift — 인허가 사전 점검 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/PermitCheckPanels.tsx
//  stageId: "permit-check"
//
//  3축 구조 (외식/food 기준):
//    건물 — 건축물대장 용도·정화조·위반 표시
//    사람 — 식품위생교육 6시간·보건증
//    시설 — 소방완비·환기·후드·전기·가스
//  + 임대인 협상 팁 + 체크리스트
//
//  데이터: @AppStorage 체크 항목별 Bool
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct PermitCheckStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "permit-check"

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
        if !buildingPassed { return "건물 적합성 항목을 점검하세요 (\(checkedCount)/9)" }
        if !personPassed { return "사람 항목 (교육·보건증) 점검 (\(checkedCount)/9)" }
        if !facilityPassed { return "시설 항목 점검 (\(checkedCount)/9)" }
        return "9개 항목 모두 체크하세요 (\(checkedCount)/9)"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인허가 사전 확인",
            stageEyebrow: "단계 6 · 인허가 사전 점검",
            helperText: "임대 계약 후 「영업 불가」 발견 시 보증금 1,000~5,000만원이 즉시 묶입니다. 지금은 발급이 아닌 「가능 여부 확인」 단계입니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) }
        ) {
            VStack(alignment: .leading, spacing: 16) {
                // 건물 축
                axisSection(
                    icon: "building.2.fill",
                    title: "1. 건물 적합성",
                    subtitle: "건축물대장 — 용도·정화조·위반 표시 확인 (10분)",
                    passed: buildingPassed
                ) {
                    permitCheckRow("건축물대장 용도 = 근린생활시설 (1·2종) 확인", tip: "정부24 무료 발급. 음식점은 근린생활시설만 가능.", isChecked: $buildingUsage)
                    permitCheckRow("정화조 BOD 용량 충분 (30평 기준 7~10인용 이상)", tip: "부족 시 증축 1,000만원+. 계약 전 반드시 확인.", isChecked: $buildingSeptic)
                    permitCheckRow("건축물대장에 '위반건축물' 표시 없음", tip: "위반 표시 = 영업신고 영구 불가. 무조건 매물 변경.", isChecked: $buildingNoVio)
                }

                // 사람 축
                axisSection(
                    icon: "person.fill.checkmark",
                    title: "2. 사람 (면허·교육·보건증)",
                    subtitle: "식품접객업 필수 자격 준비 (사전 신청 필요)",
                    passed: personPassed
                ) {
                    permitCheckRow("식품위생교육 6시간 수강 완료 (한국외식업중앙회)", tip: "영업신고 전 의무. 2.6만원. 온라인 수강 가능.", isChecked: $personHygiene)
                    permitCheckRow("보건증(건강진단결과서) 발급 완료 — 본인 + 종업원", tip: "보건소 1.2만원. 1년 유효. 갱신 시 영업 중단 주의.", isChecked: $personHealth)
                }

                // 시설 축
                axisSection(
                    icon: "shield.checkered",
                    title: "3. 시설 (소방·환기·전기·가스)",
                    subtitle: "임대 전 시설 보강 가능 여부 확인 (10분)",
                    passed: facilityPassed
                ) {
                    permitCheckRow("소방완비증명서 (2층 이상 또는 100㎡↑) 발급 가능", tip: "100~300만원 + 2~3주. 다중이용업소 필수.", isChecked: $facilityFire)
                    permitCheckRow("환기·후드 외부 덕트 설치 가능 확인", tip: "배달전문도 조리 시 대형 후드 필요. 외부 배기 불가 매물은 불가.", isChecked: $facilityVent)
                    permitCheckRow("전기 용량 충분 (배달 전용도 최소 20A 확인)", tip: "가스레인지·냉장고·포장기 동시 가동 전력 계산 필수.", isChecked: $facilityElec)
                    permitCheckRow("가스 시설 한국가스안전공사 검사 가능 확인", tip: "임대인이 '검사 통과'라 해도 직접 증명서 확인 필수.", isChecked: $facilityGas)
                }

                // 임대인 협상 카드
                negotiationCard
            }
        }
    }

    // MARK: - Axis section

    @ViewBuilder
    private func axisSection<Content: View>(
        icon: String,
        title: String,
        subtitle: String,
        passed: Bool,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(passed ? BUColor.success : BUColor.midnight)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.midnightDeep)
                    Text(subtitle)
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
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

    // MARK: - Negotiation card

    private var negotiationCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: 6) {
                    Image(systemName: "lightbulb.fill").foregroundStyle(Color.orange)
                    Text("임대인 협상 포인트 (음식점)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                tipRow("정화조 BOD 부족 매물은 협상 X — 무조건 패스", detail: "증축은 1,000~3,000만원+. 다른 매물이 낫습니다.")
                tipRow("환기 덕트 가능 여부 임대 전 확답 받기", detail: "외부 배기 불가 시 배달전문도 조리 불가.")
                tipRow("보강 가능 항목은 「임대인 1/2 부담 + 원상복구 면제」 특약", detail: "사인 전 특약 명시. 평균 500만원 절약 가능.")
            }
        }
    }

    private func tipRow(_ text: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("→").font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
            VStack(alignment: .leading, spacing: 2) {
                Text(text).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
            }
        }
    }

}

#if DEBUG
#Preview("PermitCheck") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["permit-check"] }
    return PermitCheckStageView().environment(store)
}
#endif
