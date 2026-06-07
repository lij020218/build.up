//
//  LabSetupStageView.swift — 연구실·시제품 작업장 셋업 (iOS 네이티브)
//
//  웹 SSOT 미러 (apps/web/.../startup/LabSetupStage.tsx) — Cluster C · Deep Tech Lab 1/4.
//    robotics-physical-ai: 안전 펜스·EMC 차폐·비상정지·모션캡처
//    biotech-medtech (default): GLP·BSL-1/2 시설·SOP·생물 폐기물
//  KEY ACTION 은 클러스터별 keyActionOverride 로 노출.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct LabSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "lab-setup"
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    @AppStorage("lab.facilityDone")  private var facilityDone  = false
    @AppStorage("lab.safetyDone")    private var safetyDone    = false
    @AppStorage("lab.equipmentDone") private var equipmentDone = false
    @AppStorage("lab.done")          private var done          = false

    private var currentInputs: [String: String] {
        ["facilityDone": "\(facilityDone)", "safetyDone": "\(safetyDone)", "equipmentDone": "\(equipmentDone)", "done": "\(done)"]
    }

    private let pages = ["시설·안전", "핵심 장비·검증"]

    // 웹 defaultContent = biotech. robotics 클러스터만 robotics 변형.
    private var isRobotics: Bool { industryId == "robotics-physical-ai" }

    public init() {}

    private var canCompleteStage: Bool { facilityDone || safetyDone || equipmentDone }

    private var advanceHint: String {
        if done { return "연구시설·안전·장비 셋업 완료 — 다음 단계로" }
        if facilityDone && equipmentDone { return "시설·장비 확보 — 다음 단계로" }
        if facilityDone { return "시설 확보 — 장비 셋업 진행" }
        if equipmentDone { return "장비 확보 — 시설 셋업 진행" }
        return "시설·안전 요건 또는 장비를 정리하세요"
    }

    // ── KEY ACTION (웹 클러스터별 keyAction 미러) ──
    private var keyAction: BUStageKeyAction {
        isRobotics
            ? .init(title: "안전 펜스·EMC 차폐·비상정지 시스템 — 사고 한 번에 운영 전체가 정지합니다",
                    detail: "로봇 작업 영역 펜스로 분리, EMC 차폐 (전자파 간섭 방지), 비상정지 버튼 다중화, 전원 격리 절차. 사고 발생 시 산업안전보건법에 따라 영업정지·피해보상·인증 박탈 가능.")
            : .init(title: "GLP 또는 BSL-1/2 시설 — 인허가 데이터의 신뢰성은 시설에서 시작",
                    detail: "MFDS GLP (우수 실험실 운영기준) 또는 BSL-1/2 (Biosafety Level) 시설. 시설이 표준 미달이면 IND 제출 시 데이터 자체가 무효 처리. 처음부터 GLP 인증 시설 또는 GLP 인증 시설 위탁 (CRO).")
    }

    private var helperText: String {
        isRobotics
            ? "로보틱스 랩 — 안전 펜스 + EMC 차폐 + 모션캡처 + 충돌 시뮬레이션 환경. 산업안전 등급 시설 필수."
            : "바이오·의료기기 랩 — MFDS GLP 또는 BSL-1/2 인증 시설. 시설 표준 미달 = IND 데이터 무효."
    }

    /// (label, value, source) — 웹 facts 미러.
    private var facts: [(String, String, String)] {
        isRobotics ? [
            ("필요 시설", "최소 30평 — 로봇 작업 영역 + 컨트롤룸 + 부품 보관 + 작업대. 천장고 3m+ (수직 모션 고려), 콘크리트 슬래브 (진동 흡수)", ""),
            ("안전 시스템 (필수)", "안전 펜스 + 안전 라이트 커튼 + 비상정지 다중화 + Power Lockout/Tagout (LOTO) 절차", "산업안전보건공단"),
            ("핵심 장비", "모션캡처 (Vicon·OptiTrack 1억~3억) + 로드셀·6축 F/T 센서 + 오실로스코프 + 진동 측정기", ""),
        ] : [
            ("BSL 등급", "BSL-1: 일반 미생물 / BSL-2: 인체 감염 가능 (대부분 임상 1상 후보) / BSL-3: 결핵·SARS / BSL-4: 에볼라급. 연구 대상에 따라 시설 차등", "OECD GLP"),
            ("GLP 핵심 요건", "교정된 장비 + SOP (표준작업절차서) + 시험기록부 + QA 검증 + 시설관리·보안", "MFDS GLP 가이드"),
            ("생물학적 폐기물 처리", "고온멸균 → 전용 폐기물 업체 위탁. 미준수 시 환경부 처분 + 영업정지", ""),
        ]
    }

    private var traps: [(String, String)] {
        isRobotics ? [
            ("안전 매뉴얼 없이 시작 — 첫 사고가 회사 끝", "산업안전보건법 위반 시 영업정지 + 형사처벌. 시작 전 안전 컨설팅 + LOTO 절차 + 매주 안전 점검 필수."),
            ("EMC 차폐 부재 → 인근 장비 간섭으로 측정값 오염", "데이터 신뢰 못 함 → 모든 실험 재시도. Faraday cage 또는 차폐룸 설치."),
        ] : [
            ("비-GLP 시설에서 데이터 생성 → IND 거절", "MFDS 는 GLP 시설 데이터만 인정. 자가 시설로 시작했다가 IND 단계에서 모두 재시험해야 함. 처음부터 GLP 시설 또는 인증 CRO 위탁이 정답."),
            ("SOP 없이 실험 — 재현성 0", "SOP 없는 데이터는 인허가 검토에서 무효. 첫 실험 시작 전 SOP 작성·QA 서명·교육 이수."),
        ]
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "연구실·시제품 작업장 셋업",
            stageEyebrow: "단계 10 · 연구실·작업장 셋업",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: isRobotics ? [
                    .init(label: "1. 시설·작업 영역 분리", detail: "로봇 펜스·컨트롤룸·부품 보관·작업대 — 안전 동선 확보"),
                    .init(label: "2. 안전 시스템 셋업", detail: "안전 펜스·라이트 커튼·비상정지·LOTO 절차 매뉴얼화"),
                    .init(label: "3. 핵심 장비 도입", detail: "모션캡처·F/T 센서·오실로스코프·진동 측정기 등 검증"),
                    .init(label: "4. EMC 차폐", detail: "Faraday cage·차폐룸 설치, 측정 데이터 신뢰성 확보"),
                ] : [
                    .init(label: "1. GLP 또는 BSL-1/2 시설 확보", detail: "자가 시설 또는 인증 CRO 위탁으로 데이터 무결성 확보"),
                    .init(label: "2. SOP·QA 시스템", detail: "표준작업절차서 + QA 검증 + 시험기록부 시스템 구축"),
                    .init(label: "3. 장비 교정·인증", detail: "모든 측정 장비 교정증명서 + 정기 검증 일정 셋업"),
                    .init(label: "4. 폐기물·안전 절차", detail: "고온멸균 + 전용 폐기물 업체 위탁 + 사고 대응 매뉴얼"),
                ],
                verifyItems: isRobotics ? [
                    "산업안전보건법 — 사고 시 영업정지 + 형사처벌, LOTO 절차 미준수 시 1년 이하 징역",
                    "보험 — 시설배상·근로자재해보상·생산물배상 3종 별도, 사고 시 자기부담 한계 점검",
                    "PL(제조물책임) — 시제품 단계라도 외부 노출 시 PL 보험 가입 권장",
                    "전기 용량·소방 — 고전력 장비는 한전 사전 증설 + 소방 별도 신고 필수",
                    "환경부 — 화학·생물 폐기물 처리 위탁 계약, 자가 폐기 시 환경법 위반 + 형사처벌",
                    "데이터 무결성 — 모든 측정 SOP·교정증명서 보관, 미보관 시 인허가 데이터 무효",
                ] : [
                    "MFDS GLP — 비-GLP 시설 데이터는 IND 거절, 처음부터 GLP 시설 또는 인증 CRO 위탁 필수",
                    "BSL 등급 — 연구 대상에 맞지 않으면 보건복지부 영업정지 + 형사처벌",
                    "환경부 — 생물학적 폐기물 자가 처리 시 환경법 위반, 위탁 계약서 보관 필수",
                    "동물실험 — IACUC(동물실험윤리위원회) 승인 의무, 미승인 시 데이터 무효 + 처분",
                    "임상 데이터 — IRB(임상시험심사위원회) 승인 사전 확보, 무승인 시험은 IND 거절",
                    "특허 — 시험 전 특허 출원 또는 발명신고서 작성, 외부 발표 후 특허성 상실 위험",
                ],
                nextStageLabel: "프로토타입 반복",
                nextSummary: isRobotics
                    ? "시설·안전·EMC·장비 셋업 완료 → 프로토타입 반복 단계로 진입"
                    : "GLP 시설·SOP·교정·폐기물 절차 완료 → 프로토타입 반복 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count,
            keyActionOverride: keyAction
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
                    case 0: facilityPage
                    default: equipmentPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 시설·안전

    private var facilityPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(isRobotics ? "로보틱스 랩 — 시설·안전·장비" : "GLP/BSL 랩 — 시설·요건")
                    ForEach(facts.prefix(2), id: \.0) { label, value, source in
                        factRow(label: label, value: value, source: source)
                    }
                }
            }

            warningCard(title: "흔한 함정 — 이건 피하세요", items: traps.map { "\($0.0) — \($0.1)" }, color: BUColor.danger)

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $facilityDone) {
                        Text(isRobotics ? "작업 영역 분리 + 시설 확보 (펜스·컨트롤룸·작업대)" : "GLP 또는 BSL-1/2 시설 확보 (자가 또는 CRO 위탁)")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $safetyDone) {
                        Text(isRobotics ? "안전 시스템 셋업 (펜스·라이트커튼·비상정지·LOTO)" : "SOP·QA 시스템 + 생물 폐기물 절차 수립")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 핵심 장비·검증

    private var equipmentPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(isRobotics ? "핵심 장비·EMC" : "GLP 요건·폐기물")
                    ForEach(facts.suffix(facts.count - 2), id: \.0) { label, value, source in
                        factRow(label: label, value: value, source: source)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("장비 확보 전략")
                    let items = [
                        "구매 vs 임대 vs 인증 CRO·공동 장비 활용 비교 (초기 자본 최소화)",
                        "대학·KIST·KAIST·창업진흥원 공동 장비 활용",
                        "정부 장비 바우처: 중소기업 최대 80% 지원",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(BUColor.inkMuted).padding(.top, 5)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $equipmentDone) {
                        Text(isRobotics ? "핵심 장비 도입 + EMC 차폐 완료" : "장비 교정·인증 + 측정 SOP 완료")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $done) {
                        Text("연구실·작업장 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - Helpers

    private func factRow(label: String, value: String, source: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 6) {
                Text(label).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                if !source.isEmpty {
                    Text(source).font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 6).padding(.vertical, 1)
                        .background(BUColor.midnight.opacity(0.06), in: Capsule())
                }
            }
            Text(value).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 2)
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
                            .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("LabSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["lab-setup"] }
    return LabSetupStageView().environment(store)
}
#endif
