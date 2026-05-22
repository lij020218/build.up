//
//  RegulatorySubmissionStageView.swift — 규제 허가 신청 (iOS 네이티브)
//
//  stageId: "regulatory-submission"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

public struct RegulatorySubmissionStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "regulatory-submission"

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private var helperText: String {
        switch industryId {
        case "robotics-physical-ai": return "KC + 산업안전 + ISO 13482 (서비스 로봇 안전). 일반 경로 6-12개월."
        case "biotech-medtech": return "MFDS Fast-Track 199개 카테고리 (113개 AI 디지털 의료기기 포함). 80-140일 vs 일반 295일."
        default: return "규제 허가 = 딥테크의 마지막 관문. 경로 선택이 3–5년을 결정. 식약처 의료기기 패스트트랙 80–140일 vs 일반 490일."
        }
    }

    @AppStorage("regsub.pathway")          private var pathway          = ""
    @AppStorage("regsub.mfdsConsult")      private var mfdsConsult      = false
    @AppStorage("regsub.packageSubmitted") private var packageSubmitted = false
    @AppStorage("regsub.done")             private var done             = false

    private let pages = ["규제 경로", "신청 현황"]

    public init() {}

    /// 게이트: 허가 경로 선택 또는 사전상담 진행.
    private var canCompleteStage: Bool {
        !pathway.isEmpty || mfdsConsult
    }

    private var advanceHint: String {
        if done { return "규제 허가 신청 완료 — 다음 단계로" }
        if packageSubmitted { return "규제 패키지 제출 — 다음 단계로" }
        if mfdsConsult { return "사전상담 완료 — 패키지 제출 준비" }
        if pathway == "fasttrack" { return "패스트트랙 선택 — 사전상담 신청" }
        if pathway == "standard" { return "일반 심사 선택 — 사전상담 신청" }
        return "허가 경로(패스트트랙/일반)를 선택하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인허가 제출 및 승인",
            stageEyebrow: "단계 13 · 규제 허가 신청",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
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
                    case 0: pathwayPage
                    default: submissionPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 규제 경로

    private var pathwayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("규제 기관 별 관할")
                    let agencies: [(String, String)] = [
                        ("의료기기", "식품의약품안전처 (MFDS) — 등급별 심사 기간 상이"),
                        ("로봇", "산업통상자원부·국가기술표준원 — 안전인증 (S마크)"),
                        ("드론·UAM", "국토교통부·국방부 (군용) — 형식증명"),
                        ("방사선 기기", "원자력안전위원회"),
                    ]
                    ForEach(agencies, id: \.0) { cat, desc in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(cat).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("의료기기 등급별 심사")
                    let grades: [(String, String, String)] = [
                        ("1등급", "자가인증", "심사 없음."),
                        ("2등급", "기술문서 심사", "60–90일."),
                        ("3등급", "임상시험 + 심사", "180–490일."),
                        ("4등급", "최고위험 (PMA 수준)", "1–3년."),
                    ]
                    ForEach(grades, id: \.0) { grade, type, period in
                        HStack(spacing: BUSpacing.sm) {
                            Text(grade).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 48, alignment: .leading)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(type).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                                Text(period).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("허가 경로 선택")
                    let options: [(String, String, String)] = [
                        ("fasttrack", "패스트트랙 (혁신의료기기)", "혁신 기술로 지정 → 80–140일. 사전상담 3–6개월 소요."),
                        ("standard", "일반 심사", "표준 경로. 2–3등급 기준 90–490일."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = pathway == id
                        Button {
                            pathway = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title).font(BUFont.bodySmall.weight(.bold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill").font(.system(size: 16)).foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - pg 1 신청 현황

    private var submissionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MFDS 사전상담 (신청 전 필수)")
                    let items = [
                        "허가 신청 전 식약처 의료기기심사부 사전 상담 (무료)",
                        "상담을 통해 등급·경로·필요 서류 사전 확인",
                        "의료기기 전문 RA(Regulatory Affairs) 컨설턴트 활용 권장",
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
                    BUEyebrow("규제 패키지 필수 서류")
                    let docs = [
                        "기술문서 (설계도·시험성적서)",
                        "임상 데이터 (해당 등급)",
                        "제조 및 품질관리 기준서 (GMP/ISO 13485)",
                        "라벨링·사용설명서",
                    ]
                    ForEach(docs, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "doc.text").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 현황 체크")
                    Toggle(isOn: $mfdsConsult) {
                        Text("식약처 사전상담 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $packageSubmitted) {
                        Text("규제 패키지 제출 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("규제 허가 신청 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("RegulatorySubmission") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["regulatory-submission"] }
    return RegulatorySubmissionStageView().environment(store)
}
#endif
