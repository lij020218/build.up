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
import BuildUpCore
import BuildUpData

public struct PermitCheckStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private let stageId = "permit-check"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

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
                // 건물 축 — 카테고리별 분기
                axisSection(
                    icon: "building.2.fill",
                    title: "1. 건물 적합성",
                    subtitle: buildingAxisSubtitle,
                    passed: buildingPassed
                ) {
                    let rows = buildingRowSpecs
                    permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $buildingUsage)
                    permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $buildingSeptic)
                    permitCheckRow(rows[2].label, tip: rows[2].tip, isChecked: $buildingNoVio)
                }

                // 사람 축
                axisSection(
                    icon: "person.fill.checkmark",
                    title: "2. 사람 (면허·교육·자격)",
                    subtitle: personAxisSubtitle,
                    passed: personPassed
                ) {
                    let rows = personRowSpecs
                    permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $personHygiene)
                    permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $personHealth)
                }

                // 시설 축
                axisSection(
                    icon: "shield.checkered",
                    title: "3. 시설 (소방·환기·전기·가스)",
                    subtitle: facilityAxisSubtitle,
                    passed: facilityPassed
                ) {
                    let rows = facilityRowSpecs
                    permitCheckRow(rows[0].label, tip: rows[0].tip, isChecked: $facilityFire)
                    permitCheckRow(rows[1].label, tip: rows[1].tip, isChecked: $facilityVent)
                    permitCheckRow(rows[2].label, tip: rows[2].tip, isChecked: $facilityElec)
                    permitCheckRow(rows[3].label, tip: rows[3].tip, isChecked: $facilityGas)
                }

                // 임대인 협상 카드
                negotiationCard
            }
        }
    }

    // MARK: - Cluster 별 row spec

    private typealias RowSpec = (label: String, tip: String)

    private var buildingAxisSubtitle: String {
        switch cluster.category {
        case .food, .cafeDessert: return "건축물대장 — 용도·정화조·위반 표시 확인 (10분)"
        case .beauty, .fitness, .pet, .education, .livingService, .space:
                                  return "건축물대장 — 용도·소음·위반 표시 확인 (10분)"
        case .retail:             return "건축물대장 — 용도·매장 면적·위반 표시 확인 (10분)"
        default:                  return "건축물대장 — 용도·위반 표시 확인 (10분)"
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
        case .food, .cafeDessert: return "식품접객업 필수 자격 (사전 신청)"
        case .beauty:             return "공중위생업 필수 자격 (면허·위생교육)"
        case .fitness:            return "체육시설 안전·강사 자격"
        case .education:          return "강사 자격·인력 검증"
        case .pet:                return "동물보호법 자격·교육"
        case .livingService:      return "공중위생업 자격·교육"
        default:                  return "운영자 자격·교육 점검"
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
        case .food, .cafeDessert: return "소방·환기·전기·가스 (임대 전 보강 가능 여부)"
        case .beauty:             return "소방·환기·전기·위생설비 (임대 전 확인)"
        case .fitness:            return "소방·바닥·환기·전기 (임대 전 확인)"
        case .education:          return "소방·환기·전기·안전 (임대 전 확인)"
        case .pet:                return "소방·방음·환기·전기 (임대 전 확인)"
        case .livingService:      return "소방·배수·전기·환기 (임대 전 확인)"
        case .space:              return "소방·방음·전기·CCTV (임대 전 확인)"
        case .retail:             return "소방·조명·전기·CCTV (임대 전 확인)"
        case .onlineDigital:      return "전기·인터넷·환기·CCTV (임대 전 확인)"
        case .startupTech:        return "전기·인터넷·환기·보안 (임대 전 확인)"
        }
    }

    private var facilityRowSpecs: [RowSpec] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            ("소방완비증명서 (2층 이상 또는 100㎡↑) 발급 가능", "100~300만원 + 2~3주. 다중이용업소 필수."),
            ("환기·후드 외부 덕트 설치 가능 확인", "배달전문도 조리 시 대형 후드 필요. 외부 배기 불가 매물은 불가."),
            ("전기 용량 충분 (최소 20A 확인)", "가스레인지·냉장고·포장기 동시 가동 전력 계산 필수."),
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
