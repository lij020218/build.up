//
//  ConstructionSetupStageView.swift — 인테리어 설정 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/ConstructionSetupStage.tsx
//  stageId: "construction-setup"
//
//  food 카테고리 하드코딩:
//    자재 6종: 후드, 내열타일, 방화석고, 대용량전기, 에폭시, 방음재
//    컨셉 4종: 모던한옥, 캐주얼포차, 클린이자카야, 팜투테이블
//
//  2-page (세그먼트):
//    pg 0 — 마감재·설비 가이드 + 주의사항
//    pg 1 — 인테리어 컨셉 선택 + 업체 팁
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct ConstructionSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "construction-setup"
    @AppStorage("construction.concept")  private var selectedConcept = ""
    @AppStorage("construction.done")     private var constructionDone = false

    private let pages = ["마감재·설비", "컨셉 선택"]

    private let materials: [(String, String, String)] = [
        ("스테인리스 상업용 후드·배기", "법적 의무 — 풍량 계산 선행 필요. 주방 폭 최소 1,900mm 확보 후 설계.", "wind"),
        ("내열 세라믹 타일 (주방 벽·바닥)", "기름때·고열 내성. 줄눈 방오 처리 필수 — 청소 난이도 결정 요인.", "square.grid.3x3"),
        ("방화 석고보드 (주방 인접 벽)", "소방법 의무 자재 — 소방 심사 전 반드시 확인. 두께·등급 구분 있음.", "shield"),
        ("대용량 전기 배선·분전반", "상업용 주방 장비 전용 분전반 선행 공사 필수. 인테리어 착수 전 전기 설계.", "bolt"),
        ("에폭시 바닥재 (주방·홀 경계)", "방수·물매 시공 필수. 하수구 위치 먼저 결정 — 청소 동선이 여기서 결정.", "drop"),
        ("방음·흡음재 (홀)", "조리 소음·냉방기 소음 차단. 야간 영업 민원 방지 — 다중 레이어 구조 권장.", "speaker.slash"),
    ]

    private struct ConceptItem: Identifiable {
        let id: String
        let name: String
        let desc: String
        let tags: [String]
        let icon: String
    }

    private let concepts: [ConceptItem] = [
        ConceptItem(id: "modern-hanok", name: "모던 한옥 퓨전",   desc: "한지·나무·석재 믹스. 전통과 현대 조화 — 외국인 관광객 많은 상권에서 차별화 강점.",   tags: ["외국인 친화", "30-50대", "관광지 상권"],        icon: "house"),
        ConceptItem(id: "casual-pocha", name: "캐주얼 포차·분식", desc: "자연 목재·빈티지 간판·원색 포인트. 친근하고 활기찬 분위기 — 저녁·회식 수요 최강.",      tags: ["저녁·야간 강점", "회식 수요", "가성비"],         icon: "mug"),
        ConceptItem(id: "izakaya",      name: "클린 이자카야",    desc: "다크 우드+간접조명+줄 전구. 2025 MZ세대 외식 트렌드 1순위 — SNS 바이럴 용이.",          tags: ["20-30대", "SNS 바이럴", "야간 강점"],             icon: "moon.stars"),
        ConceptItem(id: "farm",         name: "팜투테이블 내추럴", desc: "식물·내추럴 소재·따뜻한 조명. 건강·유기농 이미지 — 객단가 올리기에 유리한 포지셔닝.", tags: ["건강 이미지", "여성 선호", "객단가 상승"],        icon: "leaf"),
    ]

    private var canCompleteStage: Bool { constructionDone && !selectedConcept.isEmpty }

    private var advanceHint: String {
        if selectedConcept.isEmpty { return "공간 디자인 컨셉을 선택하세요" }
        if !constructionDone { return "인테리어 컨셉·업체 확정 완료를 체크하세요" }
        return "컨셉·업체 확정 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인테리어 및 공사",
            stageEyebrow: "단계 13 · 인테리어 설정",
            helperText: "건물에 부착·고정되는 자재(타일·배선)와 설비(후드·배관)만 이 단계에서 결정합니다. POS·주방기기는 다음 단계 「공급처 확정」에서 결정합니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["concept": selectedConcept])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["concept": selectedConcept]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 인테리어 컨셉 확정", detail: "업종·프랜차이즈 데이터 기반 자재·컨셉 후보 비교 후 1안 결정"),
                .init(label: "2. 시공업체 견적 요청", detail: "지역·키워드 매칭 시공업체 2~3곳에 동시 견적 요청"),
                .init(label: "3. 자재·등급 명시", detail: "견적서에 자재 브랜드·등급·규격·면적 4항목 모두 명시 확인"),
                .init(label: "4. 일정·계약 확정", detail: "착공·중간점검·완공 3단계 일정 + 하자보증 1년 명문화"),
                ],
                verifyItems: [
                "소방·전기·가스 사전 신고 확인 — 다중이용시설은 소방시설완비증명서·전기안전점검·가스공급 3종 미준수 시 영업불가",
                "방염 처리 의무 — 휴게/일반음식점·노래방·미용실 등 다중이용시설은 벽지·천장재 방염필증 필수 (위반 시 영업정지)",
                "공사대금 — 30% 계약·40% 중간·30% 잔금 분할 + 하자보증 1년 계약서 명문화 (사진·영상 보관)",
                "공사 중 추가공사 단가 — 평당 단가 사전 합의 없이 진행 시 마감 시 분쟁 1순위 원인",
                "임대인 원상복구 의무 — 인테리어 잔존물 처리 비용·기준 사전 합의 (계약서 또는 사진 기록)",
                "전기 용량·하수 용량 — 식음료·미용·헬스 등 사용량이 큰 업종은 사전 증설 신청 필수 (한전 평균 2~4주)",
                ],
                nextStageLabel: "공급처·장비 발주",
                nextSummary: "인테리어 컨셉·견적·자재 확정 → 공급처·장비 발주 단계로 진입"
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
                    if page == 0 { materialsPage } else { conceptPage }
                }
            }
        }
    }

    // MARK: - pg 0 마감재·설비

    private var materialsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("음식점 필수 마감재 · 설비 6종")
                    ForEach(materials, id: \.0) { name, desc, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(BUColor.midnight)
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
                    BUEyebrow("견적 체크포인트")
                    let tips: [(String, String)] = [
                        ("최소 2~3곳 견적 비교", "자재 사양·브랜드·규격이 견적서에 명시됐는지 확인"),
                        ("공사 단계별 분할 납부", "계약금 30% · 중간 40% · 잔금 30% + 하자보증 1년"),
                        ("사전 소방·전기 신고 필수", "다중이용시설 소방완비증명 + 한전 전기 용량 신청 (평균 2~4주)"),
                        ("인테리어 기간 임대 면제 특약", "착공 중 임대료 면제 협상 → 수백만원 절감 가능"),
                    ]
                    ForEach(tips, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.success)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            warningCard(title: "주의 사항", items: [
                "방염 처리 의무 — 음식점 벽지·천장재 방염필증 필수 (위반 시 영업정지)",
                "전기 용량 증설은 한전 신청 필요 — 2~4주 소요, 착공 전 신청",
                "추가 공사 단가 사전 합의 — 공사 중 '추가' 요청은 분쟁 1순위 원인",
            ], color: .orange)
        }
    }

    // MARK: - pg 1 컨셉 선택

    private var conceptPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("공간 디자인 컨셉 선택")
                    Text("방향을 정해두면 업체 미팅 때 기준점이 됩니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: BUSpacing.sm) {
                ForEach(concepts) { concept in
                    conceptCard(concept)
                }
            }

            if !selectedConcept.isEmpty {
                let picked = concepts.first { $0.id == selectedConcept }
                if let picked {
                    BUCard(.hero) {
                        VStack(alignment: .leading, spacing: BUSpacing.xs) {
                            BUEyebrow("선택된 컨셉")
                            Text(picked.name).font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                            Text(picked.desc).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("음식점 인테리어 업체 검색 키워드")
                    Text("\"음식점 인테리어 전문\" + 지역명으로 검색 후 포트폴리오 사진 확인. 주방 시공 경험 있는 업체 필수 — 후드·배관 설계 경험이 관건.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $constructionDone) {
                    Text("인테리어 컨셉·업체 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    private func conceptCard(_ concept: ConceptItem) -> some View {
        let isSelected = selectedConcept == concept.id
        return Button {
            selectedConcept = isSelected ? "" : concept.id
        } label: {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isSelected ? BUColor.midnight.opacity(0.15) : BUColor.midnight.opacity(0.07))
                        .frame(width: 44, height: 44)
                    Image(systemName: concept.icon)
                        .font(.system(size: 20)).foregroundStyle(BUColor.midnight)
                }
                Text(concept.name)
                    .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    .lineLimit(2).multilineTextAlignment(.leading)
                Text(concept.desc)
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(1.5).lineLimit(4).multilineTextAlignment(.leading)
                HStack(spacing: 4) {
                    ForEach(concept.tags.prefix(2), id: \.self) { tag in
                        Text(tag)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(isSelected ? BUColor.midnight : BUColor.inkMuted)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(
                                (isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.05)),
                                in: Capsule()
                            )
                    }
                }
            }
            .padding(BUSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? BUColor.surfaceElevated : BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2)
            )
            .shadow(color: isSelected ? BUColor.midnight.opacity(0.1) : Color.black.opacity(0.04), radius: isSelected ? 8 : 3, y: 2)
            .overlay(alignment: .topTrailing) {
                if isSelected {
                    ZStack {
                        Circle().fill(BUColor.midnight).frame(width: 20, height: 20)
                        Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                    }
                    .padding(8)
                }
            }
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
#Preview("ConstructionSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["construction-setup"] }
    return ConstructionSetupStageView().environment(store)
}
#endif
