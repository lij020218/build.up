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
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct ConstructionSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    // 프랜차이즈면 마무리 시공 태스크가 '외부 견적'이 아니라 본사 표준/지정 확인으로 스위칭 (2026-07-02).
    @AppStorage("stage.startupType.selected") private var startupType = ""
    private var isFranchise: Bool { startupType == "franchise" }
    @State private var page = 0
    private let stageId = "construction-setup"
    @AppStorage("construction.concept")  private var selectedConcept = ""
    @AppStorage("construction.done")     private var constructionDone = false

    // 웹 SSOT 누락 3개 (2026-05-24 추가)
    @AppStorage("construction.contractorSelected") private var contractorSelected = false
    @AppStorage("construction.designApproved")     private var designApproved     = false
    @AppStorage("construction.fireHealthApplied")  private var fireHealthApplied  = false

    private let pages = ["마감재·설비", "컨셉 선택"]

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    /// 자재 — 웹 SSOT 자동 생성 미러. 세부업종(sub-industry) 우선 → 카테고리 폴백 (웹 우선순위 ②→③).
    private var materials: [(String, String, String)] {
        let items = ConstructionSubIndustryInteriorRegistry.materials(forSpecialty: industryId)
            ?? ConstructionInteriorRegistry.materials(forCategoryId: cluster.category.rawValue)
        return items.map { ($0.name, $0.desc, $0.icon) }
    }

    private struct ConceptItem: Identifiable {
        let id: String
        let name: String
        let desc: String
        let tags: [String]
        let icon: String
    }

    /// 컨셉 — 웹 SSOT 자동 생성 미러. 세부업종 우선 → 카테고리 폴백.
    private var concepts: [ConceptItem] {
        let items = ConstructionSubIndustryInteriorRegistry.concepts(forSpecialty: industryId)
            ?? ConstructionInteriorRegistry.concepts(forCategoryId: cluster.category.rawValue)
        return items.enumerated().map { idx, c in
            ConceptItem(id: "\(cluster.category.rawValue)-\(idx)", name: c.name, desc: c.desc, tags: c.tags, icon: c.icon)
        }
    }

    /// 2026 트렌드·추천 가구·특화 업체 — 웹 SSOT 자동 생성 미러. 세부업종 매칭 시에만 노출.
    private var interior2026: ConstructionSubIndustryInterior2026Registry.Entry? {
        ConstructionSubIndustryInterior2026Registry.entry(forSpecialty: industryId)
    }

    private var canCompleteStage: Bool {
        !selectedConcept.isEmpty && contractorSelected && designApproved
            && constructionDone && fireHealthApplied
    }

    private var advanceHint: String {
        if selectedConcept.isEmpty { return "공간 디자인 컨셉을 선택하세요" }
        if !contractorSelected { return "시공업체 선정 및 견적 비교 완료를 체크하세요" }
        if !designApproved { return "최종 설계·시공 계획 승인을 체크하세요" }
        if !constructionDone { return "인테리어 공사 완료를 체크하세요" }
        if !fireHealthApplied { return "소방필증·보건증 신청 완료를 체크하세요 (14일 대기)" }
        return "컨셉·업체 확정·공사 완료 — 다음 단계로"
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
                isFranchise
                    ? .init(label: "2. 본사 표준·지정 시공 확인", detail: "본사 표준 사양·지정 시공업체 확인 + 비용 분담·일정은 본사 가맹담당자와 협의 (외부 견적 가능 여부는 본사 자율도에 따라)")
                    : .init(label: "2. 시공업체 견적 요청", detail: "지역·키워드 매칭 시공업체 2~3곳에 동시 견적 요청"),
                .init(label: "3. 자재·등급 명시", detail: "견적서에 자재 브랜드·등급·규격·면적 4항목 모두 명시 확인"),
                .init(label: "4. 일정·계약 확정", detail: "착공·중간점검·완공 3단계 일정 + 하자보증 1년 명문화"),
                ],
                verifyItems: [
                "소방·전기·가스 사전 확인 — 다중이용업(음식점 100㎡↑·학원 등)은 소방시설완비증명서 필수. 그 외 업종은 소화기·비상구 + 전기안전점검·가스(사용 시). 내 업종 대상 여부는 관할 소방서 확인",
                "방염 처리 의무 — 다중이용업(휴게/일반음식점·노래방 등)·특정소방대상물에 해당하면 벽지·천장재·커튼 방염필증 필수. 일반 미용실 등 다중이용업 미해당 업종은 대상 아님 (관할 소방서 확인)",
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
                    BUEyebrow("\(cluster.categoryNounKo) 필수 마감재 · 설비 \(materials.count)종")
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
                "방염 처리 의무 — 다중이용업(음식·노래방 등)·특정소방대상물에 해당하면 벽지·천장재 방염필증 필수. 일반 미용실 등 미해당 업종은 대상 아님",
                "전기 용량 증설은 한전 신청 필요 — 2~4주 소요, 착공 전 신청",
                "추가 공사 단가 사전 합의 — 공사 중 '추가' 요청은 분쟁 1순위 원인",
            ], color: BUColor.warn)
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
                    BUEyebrow("\(cluster.categoryNounKo) 인테리어 업체 검색 키워드")
                    Text("\"\(ConstructionSubIndustryInteriorRegistry.contractorKeyword(forSpecialty: industryId) ?? "\(cluster.categoryNounKo) 인테리어 전문")\" + 지역명으로 검색 후 포트폴리오 사진 확인. 해당 업종 시공 경험 있는 업체 필수 — 핵심 설비(환기·배관·전기) 설계 경험이 관건.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            if let e = interior2026 {
                interior2026Section(e)
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("공사 진행 체크리스트")
                    Toggle(isOn: $contractorSelected) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("시공업체 선정 및 최소 2곳 견적 비교 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("자재 브랜드·규격·면적 4항목 명시된 견적서 확인 후 계약").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $designApproved) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("최종 설계 및 시공 계획 승인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("도면·자재 사양·공사 일정 3단계(착공·중간·완공) 최종 확인").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $constructionDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("인테리어 공사 완료 및 최종 확인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("현장 점검·하자 확인·잔금 30% 정산").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $fireHealthApplied) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("소방필증·보건증 신청 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text("14일 대기").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.danger)
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.danger.opacity(0.1), in: Capsule())
                            }
                            Text("공사 중 병행 신청 필수 — 소방완비증명서(다중이용시설)·보건증 없이는 영업신고 불가").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
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

    // MARK: - 2026 트렌드 · 추천 가구 · 특화 업체

    @ViewBuilder
    private func interior2026Section(_ e: ConstructionSubIndustryInterior2026Registry.Entry) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("2026 트렌드 · 추천 가구 · 특화 업체")
                Text("💡 광고가 아닌 참고용입니다. 브랜드·업체·가격은 시점에 따라 변하니 발주·계약 전 직접 검증하세요. 프랜차이즈는 본사 표준 사양이 우선입니다.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.warn).lineSpacing(2)

                if let c = e.colorTrend {
                    interior2026Row(icon: "paintpalette.fill", title: c.nameKo, desc: c.descKo, source: c.sourceKo, badge: "2026 컬러")
                }
                ForEach(e.trends, id: \.titleKo) { t in
                    interior2026Row(icon: "sparkles", title: t.titleKo, desc: t.descKo, source: t.sourceKo, badge: nil)
                }
            }
        }

        if !e.furniture.isEmpty {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("추천 가구 · 용품")
                    ForEach(e.furniture, id: \.itemKo) { f in
                        interior2026Row(icon: "shippingbox.fill", title: f.itemKo, desc: f.descKo, source: nil, badge: nil)
                    }
                }
            }
        }

        if !e.brands.isEmpty {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("추천 가구 · 집기 브랜드")
                    ForEach(e.brands, id: \.nameKo) { b in
                        interior2026Row(icon: "bag.fill", title: b.nameKo, desc: b.noteKo, source: b.sourceKo, badge: nil)
                    }
                }
            }
        }

        if !e.firms.isEmpty {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("업종 특화 인테리어 업체 · 플랫폼")
                    ForEach(e.firms, id: \.nameKo) { f in
                        interior2026Row(icon: "building.2.fill", title: f.nameKo, desc: f.noteKo, source: f.sourceKo, badge: f.typeKo)
                    }
                }
            }
        }

        Text(e.caveatKo)
            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
            .padding(.horizontal, 2)
    }

    @ViewBuilder
    private func interior2026Row(icon: String, title: String, desc: String, source: String?, badge: String?) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 32, height: 32)
                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    if let badge {
                        Text(badge).font(.system(size: 10, weight: .medium)).foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(BUColor.midnight.opacity(0.1), in: Capsule())
                    }
                }
                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                if let source {
                    Text("출처 · \(source)").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                }
            }
            Spacer()
        }
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
