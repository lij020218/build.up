//
//  IndustrySelectionStageView.swift — 업종 선택 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/IndustrySelectionStage.tsx
//  데이터 SSOT (iOS): FoundOneCore/StarterIndustryData.swift  ←  11 카테고리 × 평균 6 업종 (총 65)
//  stageId: "industry-selection"
//
//  레이아웃 (BUStageShell 사용):
//   ① helper line — "내 사업에 맞는 로드맵을 선택하세요"
//   ② category tab bar — 11개 카테고리 (수평 스크롤)
//   ③ option grid 2-col — 컬러 아이콘 정사각 + 센터 타이틀
//   ④ 선택 카드 = 컬러 그라데이션 + 컬러 보더 + 글로우 shadow
//   ⑤ 하단 Continue 바 — BUStageShell 이 처리
//
//  cluster 매핑:
//   - 사용자는 *업종* 을 선택; RoadmapStore 에는 *cluster* 만 저장.
//   - cluster 도출은 StarterIndustryData.cluster(for:) 에 위임 (도메인 데이터 SSOT 일치).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData
import FoundOneCore
import LucideIcons
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Color helper

private extension Color {
    /// "#rrggbb" → SwiftUI Color (small parser, no `Color(hex:)` ext in FoundOneDesignSystem yet)
    init(industryHex hex: String) {
        var s = hex
        if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        let r = Double((v >> 16) & 0xFF) / 255.0
        let g = Double((v >> 8) & 0xFF) / 255.0
        let b = Double(v & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - IndustrySelectionStageView

public struct IndustrySelectionStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("roadmap.selectedIndustryId")  private var selectedIndustryId: String  = ""
    @AppStorage("roadmap.selectedSpecialtyId") private var selectedSpecialtyId: String = ""
    @AppStorage("roadmap.cluster")             private var selectedCluster: String    = "offline-food"
    @State private var activeCategory: String = "food"
    private let stageId = "industry-selection"

    // ── Step-2 specialty ───────────────────────────────────────────────
    //   웹 SSOT: IndustrySelectionStage.tsx getSpecialtyOptions/requiresSpecialty 패턴.
    //   사용자 피드백 (2026-05-04): "한식/캐주얼 골라도 국밥집인지 한정식인지 알아야 한다."

    private var specialtyOptions: [SpecialtyOption] { SpecialtyRegistry.options(for: selectedIndustryId) }
    private var requiresSpecialty: Bool { !specialtyOptions.isEmpty }

    // 2026-07-03 정합: 카테고리군(cluster)별 확인 항목 — 오프라인/온라인/스타트업 로직·인허가가 달라 분기. (웹 SELECTION_VERIFY_ITEMS_KO 미러)
    private var selectionCluster: String {
        switch StarterIndustryData.option(by: selectedIndustryId)?.categoryId {
        case "startup-tech": return "tech"
        case "online-digital": return "online"
        default: return "offline"
        }
    }
    /// online 안에서도 디지털 콘텐츠(무배송) 서브타입인지 — 위탁·사입·배송·품목별 인허가 비성립. (웹 isDigitalFulfillment 미러)
    private var isDigitalContent: Bool {
        selectionCluster == "online" && isDigitalFulfillment(selectedIndustryId)
    }
    /// 프랜차이즈 안내는 오프라인에서만 유효 (온라인·스타트업은 다음 단계에서 프랜차이즈 옵션 비노출).
    private var franchiseRelevant: Bool { selectionCluster == "offline" }
    private var selectionVerifyItems: [String] {
        if isDigitalContent {
            return [
                "초기 자본이 제작·마케팅비에 맞는지 — 재고·사입·물류 없이 콘텐츠 제작(외주·툴 구독) + 플랫폼 수수료 + 마케팅 예산 중심으로 계획 (인테리어·권리금 없음)",
                "카테고리 경쟁 강도 확인 — 크몽·클래스101 등 동일 주제 상품 수 대비 검색 수요(키워드)가 있는 틈새인지 점검",
                "온라인 판매 필수 신고 확인 — 반복 판매는 통신판매업 신고 필수. 디지털 콘텐츠는 품목별 인허가는 없으나, 저작권(폰트·이미지·음원 2차 사용권) 확보 + 유료 강의·교육은 학원·평생교육시설 등록 대상 여부 확인",
                "마진 구조 검증 — 판매가에서 플랫폼·PG 수수료·마케팅비를 빼고 남는지 (자체 제작은 복제 원가 0이라 고마진, 외부 소스 재가공은 라이선스비 반영)",
                "아이템 트렌드 지속성 검토 — 단기 유행 주제는 제작·광고비 회수 전 검색 수요가 꺾일 리스크",
                "동일 주제 상위 판매자 대비 차별점 1줄 정리 — 깊이·최신성·실무 적용성 중 하나는 이겨야 노출·전환",
            ]
        }
        switch selectionCluster {
        case "online":
            return [
                "초기 자본이 소싱·광고비에 맞는지 — 무자본 위탁~소자본 사입, 인테리어·권리금 없이 상품 매입비 + 마케팅(광고) 예산 중심으로 계획",
                "카테고리 경쟁 강도 확인 — 네이버쇼핑 상품 수 대비 검색량(키워드 경쟁률)이 낮은 틈새인지 키워드 분석으로 점검",
                "온라인 판매 필수 신고 확인 — 반복 판매는 통신판매업 신고 필수 + 취급 품목별 추가 인허가(식품=식품소분·판매업 등, 건강기능식품=건강기능식품 일반판매업 영업신고, 화장품=화장품책임판매업)",
                "마진 구조 검증 — 판매가에서 매입·플랫폼 수수료·광고비·배송비를 빼고 남는지 (위탁판매는 마진 수수료 방식이라 특히 얇음)",
                "아이템 트렌드 지속성 검토 — 단기 유행 상품은 재고·광고비 회수 전 검색량이 꺾일 리스크",
                "동일 카테고리 상위 스토어 대비 차별점 1줄 정리 — 상세페이지·가격·배송 중 하나는 이겨야 노출·전환",
            ]
        case "tech":
            return [
                "선택 분야가 자금 여력에 맞는지 — 매출 0을 가정하고 개발·인건·인프라 비용으로 최소 1년 이상 버틸 시드(런웨이) 계획",
                "시장 크기·경쟁 검증 — 목표 시장 규모와 경쟁 스타트업·대체재를 조사, '고객이 실제로 돈을 내는 문제'인지 확인",
                "규제 트랙 여부 확인 — 대부분 사업자등록만이나, 핀테크=전자금융업, 헬스·의료기기=식약처 인증 등 별도 인허가가 필요한 분야인지",
                "MVP로 검증할 핵심 가설 1개 정의 — 풀개발 전에 수요·전환을 실측 (가설 검증 없는 선개발 지양)",
                "기술·시장 트렌드 지속성 검토 — 단기 붐에 의존하면 자금 소진 전 피벗할 여력이 필요",
                "경쟁 대비 방어 가능한 차별점(모트) 1줄 — 기술·데이터·네트워크 효과 중 지킬 수 있는 축",
            ]
        default:
            return [
                "선택 업종이 본인 자본·시간·체력 한계에 맞는지 — 평균 창업비 vs 보유 자본 비교 (창업자금 70% 이하 권장)",
                "업종 시장 포화도 확인 — 동네 반경 500m 동일 업종 5개 이상이면 차별화 포인트 필수",
                "업종별 인허가 유형(신고·등록·허가) 확인 — 음식점·미용업은 영업신고, 유흥주점은 허가, 식품제조·가공은 등록 (대부분 외식·미용은 신고 대상)",
                "필수 자격증·교육 미리 확인 — 식품접객업 위생교육, 미용업 면허, 헬스 트레이너 자격 등",
                "업종 트렌드 1~2년 지속성 검토 — 단기 유행이면 손익분기 도달 전 침체 리스크",
                "유사 업종 대비 차별점 1줄로 정리 — 차별점 없으면 가격 경쟁에 휘말림",
            ]
        }
    }

    private var currentInputs: [String: String] {
        var m = ["industryId": selectedIndustryId, "cluster": selectedCluster]
        if !selectedSpecialtyId.isEmpty { m["specialtyId"] = selectedSpecialtyId }
        // ── 웹 계약 키 미러 (2026-06-10 P0-C) ──
        //   웹 handleIndustryContinue 는 inputs.categoryId + inputs.subIndustryId 를 기록하고,
        //   분기 엔진(starter-data.ts nextStageConditions)·path-filter(usePersistence.ts)·
        //   business_profiles 투영(persistence.ts)이 이 키들을 읽는다.
        //   industryId/cluster 만 기록하면 iOS 온보딩 유저가 웹에서 경로 분기에 실패 → 병행 기록.
        if let opt = StarterIndustryData.option(by: selectedIndustryId) {
            m["categoryId"] = opt.categoryId
            m["subIndustryId"] = selectedIndustryId
        }
        return m
    }

    /// 웹 stage_decisions.selected_primary_option_id 미러 — 웹은 sub-industry id 를 그대로 넣는다
    /// (useSelectionHandlers.handleIndustryContinue: selectedPrimaryOptionId = selectedIndustryId).
    /// startup-tech 하위 분기 (hardware-iot/robotics 등) 가 이 컬럼을 직접 읽으므로 필수.
    private var currentPrimaryOptionId: String? {
        selectedIndustryId.isEmpty ? nil : selectedIndustryId
    }

    // ── Onboarding 통합 옵션 (2026-05-20) ──
    /// 처음 열 때 보여줄 카테고리 — Onboarding 에서 카테고리 미리 선택한 경우 주입.
    /// "다음" 액션 후 동작 (dismiss vs wizard push) 은 BUStageShell 의 \.wizardOnAdvance 환경값이 결정.
    private let initialCategoryId: String?

    public init(initialCategoryId: String? = nil) {
        self.initialCategoryId = initialCategoryId
    }

    private var categories: [StarterIndustryCategory] { StarterIndustryData.categories }

    private var visibleOptions: [StarterIndustryOption] {
        StarterIndustryData.options(for: activeCategory)
    }

    private var canContinue: Bool {
        guard !selectedIndustryId.isEmpty else { return false }
        if requiresSpecialty && selectedSpecialtyId.isEmpty { return false }
        return true
    }

    private var advanceHint: String {
        guard !selectedIndustryId.isEmpty,
              let opt = StarterIndustryData.option(by: selectedIndustryId) else {
            return "업종을 하나 선택하세요"
        }
        if requiresSpecialty && selectedSpecialtyId.isEmpty {
            return "\(opt.titleKo) — 세부 분류를 선택하세요"
        }
        if let spec = specialtyOptions.first(where: { $0.id == selectedSpecialtyId }) {
            return "\(opt.titleKo) · \(spec.label)"
        }
        return "선택: \(opt.titleKo)"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "업종 선택",
            stageEyebrow: "단계 1 · 업종 선택",
            helperText: "내 사업에 맞는 로드맵을 선택하세요. 업종에 따라 인허가·예산·일정이 달라집니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: currentInputs,
                    selectedPrimaryOptionId: currentPrimaryOptionId
                )
                // dismiss / wizard push 는 BUStageShell 이 \.wizardOnAdvance 환경값 보고 자동 처리.
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(
                    currentStageId: stageId,
                    inputs: currentInputs,
                    selectedPrimaryOptionId: currentPrimaryOptionId
                )
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 카테고리 탐색", detail: "외식·카페·소매·뷰티·피트니스·교육·펫·라이프·공간·온라인·스타트업 11개 대분류 검토"),
                .init(label: "2. 세부 업종 선택", detail: "관심 카테고리 안에서 한 가지 세부 업종 확정 (예: 케어 살롱, 베이커리 스튜디오)"),
                .init(label: "3. 후속 단계 준비", detail: franchiseRelevant
                    ? "업종 확정 후 창업 형태(독립창업·프랜차이즈)를 정하는 단계로 진입 준비"
                    : "업종 확정 후 창업 형태를 정하는 단계로 진입 준비"),
                ],
                verifyItems: selectionVerifyItems,
                nextStageLabel: "창업 형태 선택",
                nextSummary: franchiseRelevant
                    ? "업종 확정 → 창업 형태(독립창업·프랜차이즈) 선택 단계로 진입"
                    : "업종 확정 → 창업 형태 선택 단계로 진입"
            )
        ) {
            VStack(alignment: .leading, spacing: 14) {
                categoryTabBar
                optionGrid

                // Step-2 specialty selector — 선택된 industry 에 specialty 옵션이 있을 때만 노출.
                if requiresSpecialty {
                    specialtySection
                }
            }
        }
        .onChange(of: selectedIndustryId) { _, _ in
            // industry 가 바뀌면 specialty 도 리셋 (새 industry 의 specialty 셋과 호환되지 않음).
            selectedSpecialtyId = ""
        }
        .onAppear {
            // 우선순위: 호출자 주입 (Onboarding) > 기존 선택 복원 > food 기본값
            if let injected = initialCategoryId,
               StarterIndustryData.category(by: injected) != nil {
                activeCategory = injected
            } else if let opt = StarterIndustryData.option(by: selectedIndustryId) {
                activeCategory = opt.categoryId
            } else {
                activeCategory = "food"
            }
        }
    }

    // MARK: - Category tab bar (11 capsules, horizontal scroll)

    private var categoryTabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(categories) { category in
                    let isActive = activeCategory == category.id
                    Button {
                        withAnimation(.snappy(duration: 0.22)) { activeCategory = category.id }
                    } label: {
                        Text(category.titleKo)
                            .font(.system(size: 13, weight: isActive ? .heavy : .semibold))
                            .foregroundStyle(isActive ? Color.white : BUColor.ink)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Group {
                                    if isActive {
                                        Capsule().fill(BUColor.midnight)
                                    } else {
                                        Capsule().fill(Color.white.opacity(0.72))
                                            .overlay(Capsule().strokeBorder(Color.black.opacity(0.06), lineWidth: 1))
                                    }
                                }
                            )
                            .fixedSize(horizontal: true, vertical: false)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    // MARK: - Option grid (2-col)

    private var optionGrid: some View {
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
            spacing: 12
        ) {
            ForEach(visibleOptions) { option in
                optionCard(option)
            }
        }
    }

    private func optionCard(_ option: StarterIndustryOption) -> some View {
        let isSelected = selectedIndustryId == option.id
        let color = Color(industryHex: option.colorHex)
        return Button {
            withAnimation(.snappy(duration: 0.18)) {
                selectedIndustryId = option.id
                selectedCluster = StarterIndustryData.cluster(for: option)
            }
        } label: {
            VStack(alignment: .center, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(color.opacity(isSelected ? 0.18 : 0.08))
                    LucideIconView(
                        lucideId: option.iconLucide,
                        fallbackSF: option.iconSF,
                        color: color.opacity(isSelected ? 1.0 : 0.8),
                        size: 26
                    )
                }
                .frame(width: 52, height: 52)

                Text(option.titleKo)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(isSelected ? color : BUColor.ink)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, minHeight: 140)
            .padding(.horizontal, 10)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: isSelected
                                ? [color.opacity(0.08), color.opacity(0.04)]
                                : [color.opacity(0.03), Color.white.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        isSelected ? color.opacity(0.4) : color.opacity(0.1),
                        lineWidth: 1.5
                    )
            )
            .shadow(
                color: isSelected ? color.opacity(0.08) : .clear,
                radius: 4, x: 0, y: 4
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(color.opacity(isSelected ? 0.10 : 0), lineWidth: 3)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Step 2: Specialty selector
    //   웹 SSOT: IndustrySelectionStage.tsx 269-355 (requiresSpecialty 블록).

    private var specialtySection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Text("STEP 2")
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.6)
                        .textCase(.uppercase)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    Text("정확히 무엇을 하시나요?")
                        .font(.system(size: 15, weight: .heavy))
                        .tracking(-0.2)
                        .foregroundStyle(BUColor.ink)
                }
                Text("세부 분류에 따라 인허가·공급처·매출 모델·고객 페르소나가 더 정밀하게 추천됩니다.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(spacing: 8) {
                    ForEach(specialtyOptions) { spec in
                        specialtyRow(spec)
                    }
                }
            }
        }
    }

    private func specialtyRow(_ spec: SpecialtyOption) -> some View {
        let isSelected = selectedSpecialtyId == spec.id
        return Button {
            withAnimation(.snappy(duration: 0.18)) { selectedSpecialtyId = spec.id }
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.20))
                    .frame(width: 22)
                VStack(alignment: .leading, spacing: 3) {
                    Text(spec.label)
                        .font(.system(size: 13.5, weight: .heavy))
                        .tracking(-0.15)
                        .foregroundStyle(isSelected ? BUColor.midnight : BUColor.ink)
                    Text(spec.desc)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                isSelected ? BUColor.midnight.opacity(0.06) : Color.white,
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.10),
                        lineWidth: isSelected ? 1.5 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("IndustrySelection") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["industry-selection"] }
    return IndustrySelectionStageView().environment(store)
}
#endif

// MARK: - LucideIconView — 웹 lucide-react 와 1:1 동일한 아이콘 렌더
//
//  LucideIcons 패키지에서 SVG → UIImage. 색은 SwiftUI 의 `.foregroundStyle` 로 처리되도록
//  `.template` 렌더 모드 + `.renderingMode(.template)` 조합 사용.
//  로드 실패 시 fallbackSF (SF Symbol) 로 자동 대체.

private struct LucideIconView: View {
    let lucideId: String
    let fallbackSF: String
    let color: Color
    let size: CGFloat

    var body: some View {
        #if canImport(UIKit)
        if let uiImage = UIImage(lucideId: lucideId) {
            Image(uiImage: uiImage.withRenderingMode(.alwaysTemplate))
                .resizable()
                .renderingMode(.template)
                .scaledToFit()
                .foregroundStyle(color)
                .frame(width: size, height: size)
        } else {
            Image(systemName: fallbackSF)
                .font(.system(size: size, weight: .regular))
                .foregroundStyle(color)
        }
        #else
        Image(systemName: fallbackSF)
            .font(.system(size: size, weight: .regular))
            .foregroundStyle(color)
        #endif
    }
}
