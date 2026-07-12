//
//  StartupTypeStageView.swift — 창업 형태 선택 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/StartupTypeSelectionStage.tsx
//  stageId: "startup-type"
//
//  레이아웃 (BUStageShell 사용):
//   ① helper line
//   ② 그리드 — 독립창업 / 프랜차이즈 (스타트업은 독립창업만)
//   ③ 선택 시 카테고리별 가이드 카드 (펼침)
//   ④ 하단 Continue 바
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

private struct StartupTypeOption: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let titleKo: String
    let subtitleKo: String
}

/// 5축 종합 점수 (수익성+안정성+접근성+브랜드+지원) / 5. 웹 computeOverallScore 패턴 미러.
private func overallScore(_ s: FranchiseBrandScores) -> Int {
    (s.profitability + s.stability + s.accessibility + s.brandPower + s.support) / 5
}

public struct StartupTypeStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.startupType.selected") private var selected = ""
    @AppStorage("stage.franchise.selectedBrandId") private var franchiseBrandId = ""
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @AppStorage("roadmap.selectedSpecialtyId") private var selectedSpecialtyId = ""
    @State private var page = 0
    @State private var franchiseSearch = ""
    @State private var franchiseVisible = 30
    private let franchisePageSize = 30
    private let stageId = "startup-type"

    /// 프랜차이즈 선택 시 2-page (창업 형태 → 브랜드 선택), 그 외엔 1-page.
    private var pageLabels: [String] {
        selected == "franchise" ? ["창업 형태", "프랜차이즈 브랜드"] : ["창업 형태"]
    }

    /// onAdvance·onEditSave 공유 입력값.
    private var currentInputs: [String: String] {
        var inputs = ["startupType": selected]
        if selected == "franchise", !franchiseBrandId.isEmpty {
            inputs["franchiseBrandId"] = franchiseBrandId
        }
        return inputs
    }

    private var categoryId: String { StarterIndustryData.option(by: industryId)?.categoryId ?? "" }
    private var isStartupTech: Bool { categoryId == "startup-tech" }
    // 2026-07-03 정합: 확인 항목·다음 안내를 카테고리군(cluster)별 분기. (웹 STARTUP_TYPE_* 미러)
    private var startupTypeCluster: String {
        if isStartupTech { return "tech" }
        if categoryId == "online-digital" { return "online" }
        return "offline"
    }
    /// online 안에서도 디지털 콘텐츠(무배송) 서브타입 — 위탁·사입·MOQ·총판 비성립. (웹 isDigitalFulfillment 미러)
    private var isDigitalContent: Bool {
        startupTypeCluster == "online" && isDigitalFulfillment(industryId)
    }
    /// 프랜차이즈가 개념적으로 성립하지 않는 카테고리에서만 옵션 비노출 (웹 SSOT franchiseAvailable 미러).
    ///   startup-tech(독립전용) + online-digital(등록 프랜차이즈 없음·성격상 무관).
    ///   ⚠️ 오프라인 세부업종 브랜드 DB 공백(요가·펫호텔 등)은 데이터 문제 → 숨기지 않음(빈 피커 종전 유지).
    private var franchiseAvailable: Bool { categoryId != "startup-tech" && categoryId != "online-digital" }
    private var startupTypeVerifyItems: [String] {
        if isDigitalContent {
            return [
                "독립창업 — 콘텐츠 제작·툴 구독·마케팅 비용을 본인 부담으로 인식, 초기 시드머니 + 광고비 버퍼 별도 확보 (재고·인테리어·권리금 없음)",
                "독립창업 — 검증된 레퍼런스(경쟁 콘텐츠 분석·제작 역량·판매 데이터) 1개 이상 확보 후 진입",
                "자체 제작 vs 외부 라이선스 — 직접 제작(고마진) 또는 외부 소스 재가공(라이선스 비용 발생) 중 선택",
                "플랫폼 의존 리스크 — 크몽·클래스101·스티비 등 수수료·노출 정책 변경에 매출이 흔들림, 자사몰(자동 전달) 병행 검토",
                "통신판매업 신고 선행 + 저작권·라이선스(폰트·이미지·음원 2차 사용권) 확보, 유료 강의·교육은 학원·평생교육시설 등록 대상 여부 확인",
                "디지털 환불 정책 명문화 — 콘텐츠 청약철회 예외 요건·이용약관을 판매 전에 고지 (분쟁·차지백 예방)",
            ]
        }
        switch startupTypeCluster {
        case "online":
            return [
                "독립창업 — 상품 매입비·마케팅 툴·솔루션 비용을 본인 부담으로 인식, 초기 시드머니 + 광고비 버퍼 별도 확보 (인테리어·권리금 없음)",
                "독립창업 — 검증된 레퍼런스(경쟁 스토어 분석·아이템 소싱처 확보·판매 데이터 분석) 1개 이상 확보 후 진입",
                "위탁 vs 사입 결정 — 위탁=무재고·저마진, 사입=재고 부담·고마진. 초기 현금흐름에 맞게 선택",
                "플랫폼 의존 리스크 — 스마트스토어·쿠팡 등 수수료·노출 정책 변경에 매출이 흔들림, 자사몰·다채널 병행 검토",
                "통신판매업 신고 + 취급 품목별 인허가(식품·건강기능식품·화장품 등) 선행 확인",
                "(프랜차이즈·총판 계약 시) 공급 단가·독점권·최소주문량(MOQ)을 계약서로 확인 — 구두 합의 지양",
            ]
        case "tech":
            return [
                "독립창업 — 개발·인건·인프라 비용을 본인 부담으로 인식, 매출 0 가정 최소 1년 이상 버틸 시드(런웨이) 별도 확보",
                "독립창업 — 검증된 레퍼런스(경쟁 스타트업·대체재 분석·유저 인터뷰·데이터) 1개 이상 확보 후 진입",
                "공동창업 시 역할·지분·베스팅(vesting)을 초기에 서면 합의 — 창업자 분쟁의 최다 원인",
                "시장 검증 — MVP로 '돈 내는 문제'인지 실측한 뒤 본개발 진행",
                "규제 산업 여부 — 핀테크=전자금융업, 헬스·의료기기=식약처 인증 등 사전 확인",
                "투자·정부지원 필요 시 — 예비창업패키지·TIPS 등 요건과 마일스톤을 역산해 준비",
            ]
        default:
            return [
                "프랜차이즈 — 공정위 정보공개서(franchise.ftc.go.kr)에서 가맹사업자 신고 여부·매출액·폐점률 직접 확인",
                "프랜차이즈 — 가맹금 vs 인테리어비 vs 로열티 3개 항목별 별도 견적 (계약서 1식 표기 시 위반)",
                "독립창업 — 상품·인테리어·시스템 모두 본인 부담 인식, 6개월~1년 안정화 기간 자본 별도 확보",
                "프랜차이즈 — 가맹점 폐점률 20% 이상 브랜드 회피, 점주 평균 운영기간 5년 미만이면 위험",
                "프랜차이즈 — 점포환경개선(인테리어·간판)은 본사가 정당한 사유 없이 강요 불가 + 강요 시 비용 20~40% 법정 분담(가맹사업법 §12의2·시행령 §13의2) · 원부자재 공급단가 변경 조건도 계약서로 사전 확인",
                "독립창업 — 검증된 레퍼런스(타 매장 분석·상품/서비스 시연·POS 시뮬) 1개 이상 확보 후 진입",
            ]
        }
    }
    private var startupTypeNextSummary: String {
        if isDigitalContent { return "창업 형태 확정 → 판매 방식(플랫폼 입점·자사몰·구독형 등) 선택 진입" }
        switch startupTypeCluster {
        case "online": return "창업 형태 확정 → 운영 모델(위탁판매·국내몰 사입·해외 구매대행·자체 제조 등) 선택 진입"
        case "tech": return "창업 형태 확정 → 사업·수익 모델(제품·수익 구조·시장 진입) 설계 진입"
        default: return "창업 형태 확정 → 운영 모델(매장형·배달·하이브리드·무인 등) 선택 진입"
        }
    }

    /// 사용자 업종(category 또는 sub-industry) 에 맞는 프랜차이즈 후보.
    /// 1순위: 세부업종 매칭, 2순위: 대분류 매칭 (웹 SSOT — getFranchiseBrandsForSubIndustry → forCategory 폴백).
    /// 정렬: 5축 종합 점수 내림차순 (웹의 computeOverallScore 패턴 미러).
    private var franchiseCandidates: [FranchiseBrand] {
        // ⚠️ 2026-06-27: 세부업종이 있으면 *그 세부업종 매칭만* — categoryId 전체 폴백 금지
        //   (무관 업종 오염 방지, 웹 SSOT 미러). 세부업종이 없을 때만 카테고리 폴백.
        let base: [FranchiseBrand] = industryId.isEmpty
            ? FranchiseBrandRegistry.brands(forCategory: categoryId)
            : FranchiseBrandRegistry.brands(
                forSubIndustry: industryId,
                specialtyId: selectedSpecialtyId.isEmpty ? nil : selectedSpecialtyId,
                limit: 0 // 2026-07-02: 세부업종 매칭 전체 로드 → 검색 + 더보기로 전량 노출
            )
        return base.sorted { overallScore($0.scores) > overallScore($1.scores) }
    }

    // 검색 필터 + 더보기 (2026-07-02, 웹 StartupTypeSelectionStage 미러)
    private var franchiseFiltered: [FranchiseBrand] {
        let q = franchiseSearch.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return franchiseCandidates }
        return franchiseCandidates.filter {
            $0.name.ko.lowercased().contains(q) || $0.name.en.lowercased().contains(q) || $0.id.lowercased().contains(q)
        }
    }
    private var franchiseShown: [FranchiseBrand] { Array(franchiseFiltered.prefix(franchiseVisible)) }

    /// 옵션 — startup-tech 는 프랜차이즈 옵션 자체 숨김 (웹 SSOT 패턴).
    /// 독립창업 아이콘은 startup-tech 일 때 ⚡(bolt) 로 전환.
    private var options: [StartupTypeOption] {
        let independentIcon = isStartupTech ? "bolt.fill" : "star.fill"
        let independentSubtitle = isStartupTech
            ? "직접 제품과 회사를 만드는 기술 스타트업입니다"
            : "본인이 직접 브랜드·메뉴를 구성"
        let independent = StartupTypeOption(
            id: "independent", icon: independentIcon,
            color: Color(red: 0.149, green: 0.388, blue: 0.922),
            titleKo: "독립창업", subtitleKo: independentSubtitle
        )
        let franchise = StartupTypeOption(
            id: "franchise", icon: "building.2.fill",
            color: Color(red: 0.486, green: 0.227, blue: 0.929),
            titleKo: "프랜차이즈", subtitleKo: "검증된 브랜드로 빠르게 시작"
        )
        return franchiseAvailable ? [independent, franchise] : [independent]
    }

    public init() {}

    /// 프랜차이즈는 브랜드까지 선택해야 진행. 후보가 없는 업종은 브랜드 없이 진행 허용.
    private var canContinue: Bool {
        guard !selected.isEmpty else { return false }
        if selected == "franchise" && !franchiseCandidates.isEmpty {
            return !franchiseBrandId.isEmpty
        }
        return true
    }

    private var advanceHint: String {
        guard !selected.isEmpty else { return "창업 형태를 선택하세요" }
        switch selected {
        case "independent": return "독립창업 선택 — 다음 단계로 진행"
        case "franchise":
            if franchiseCandidates.isEmpty {
                return "이 업종에 등록된 프랜차이즈 없음 — 그대로 진행"
            }
            if franchiseBrandId.isEmpty { return "프랜차이즈 브랜드를 선택하세요" }
            let name = FranchiseBrandRegistry.brand(by: franchiseBrandId)?.name.ko ?? "선택한 브랜드"
            return "\(name)(으)로 계속"
        default:            return "미정 — 일단 진행 (나중에 변경 가능)"
        }
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "창업 형태 선택",
            stageEyebrow: "단계 2 · 창업 형태",
            helperText: (!franchiseAvailable && !isStartupTech)
                ? "이 업종은 등록된 프랜차이즈 브랜드가 없어 독립 창업으로 진행합니다."
                : "선택에 따라 이후 단계 (인테리어·메뉴·계약서 검토 등) 가 달라집니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: franchiseAvailable ? [
                .init(label: "1. 창업 형태 검토", detail: "독립창업·프랜차이즈 2옵션 비교"),
                .init(label: "2. 형태별 장단점 인식", detail: "독립=자유도/리스크, 프랜차이즈=즉시런칭/로열티"),
                .init(label: "3. 본인 성향 매칭", detail: "운영 자유도·자본 여력·시장 검증 욕구로 자가 진단"),
                .init(label: "4. 형태 확정", detail: "프랜차이즈 선택 시 브랜드 후보 비교 후 1개 확정"),
                ] : [
                .init(label: "1. 창업 형태 확인", detail: isStartupTech
                    ? "기술 스타트업은 독립창업으로 진행"
                    : "이 업종은 등록된 프랜차이즈가 없어 독립창업으로 진행"),
                .init(label: "2. 독립창업 장단점 인식", detail: "자유도가 높은 대신 상품·시스템·마케팅을 직접 구축"),
                .init(label: "3. 본인 성향 매칭", detail: "운영 자유도·자본 여력·시장 검증 욕구로 자가 진단"),
                .init(label: "4. 형태 확정", detail: "독립창업으로 확정 후 다음 단계 진입"),
                ],
                verifyItems: startupTypeVerifyItems,
                nextStageLabel: "운영 모델",
                nextSummary: startupTypeNextSummary
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: pageLabels.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                if pageLabels.count > 1 {
                    BUWizardPageNav(
                        page: page,
                        totalPages: pageLabels.count,
                        labels: pageLabels,
                        onChange: { newPage in
                            withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
                        }
                    )
                }

                Group {
                    switch page {
                    case 0: typeSelectionPage
                    default: franchiseBrandPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
                .onChange(of: selected) { _, newValue in
                    // 프랜차이즈 해제하면 페이지 0 으로 복귀 (page 1 사라짐)
                    if newValue != "franchise" && page > 0 { page = 0 }
                }
                .onAppear {
                    // stale 방어: online-digital/tech 로 바뀌었는데 franchise 가 남아있으면 리셋
                    //   (예산 단계가 franchise-application 으로 오라우팅되는 것 차단, 웹 useEffect 미러).
                    if !franchiseAvailable && selected == "franchise" {
                        selected = ""
                        franchiseBrandId = ""
                    }
                    // 이미 프랜차이즈 선택된 상태로 재진입한 경우 (편집 모드) — 브랜드 페이지로 자동 이동.
                    if selected == "franchise" && !franchiseCandidates.isEmpty && page == 0 {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            withAnimation(.easeInOut(duration: 0.22)) { page = 1 }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Page 0 — 창업 형태 선택

    @ViewBuilder
    private var typeSelectionPage: some View {
        VStack(alignment: .leading, spacing: 16) {
            LazyVGrid(
                columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                spacing: 12
            ) {
                ForEach(options) { opt in
                    TypeCard(option: opt, isSelected: selected == opt.id) {
                        withAnimation(.snappy(duration: 0.18)) { selected = opt.id }
                        // 프랜차이즈 선택 시 브랜드 후보가 있으면 자동으로 페이지 1 진입
                        // (웹 SSOT 의 "브랜드 선택하기 →" 자동 전환 패턴 미러).
                        if opt.id == "franchise" && !franchiseCandidates.isEmpty {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                                withAnimation(.easeInOut(duration: 0.22)) { page = 1 }
                            }
                        }
                    }
                }
            }

            if !selected.isEmpty {
                selectionGuide
            }
        }
    }

    // MARK: - Page 1 — 프랜차이즈 브랜드 선택

    @ViewBuilder
    private var franchiseBrandPage: some View {
        franchiseBrandPicker
    }

    // MARK: - Franchise brand picker

    @ViewBuilder
    private var franchiseBrandPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Text("프랜차이즈 브랜드 선택")
                    .font(.system(size: 15, weight: .heavy))
                    .tracking(-0.2)
                    .foregroundStyle(BUColor.ink)
            }
            Text("공정거래위원회 정보공개서 기반. 총 비용은 VAT·점포 구입비 별도.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)

            if franchiseCandidates.isEmpty {
                BUCard(.card) {
                    HStack(spacing: 10) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 16))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("이 업종에는 아직 등록된 프랜차이즈가 없습니다. 그대로 다음 단계로 진행해도 됩니다.")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                        Spacer()
                    }
                }
            } else {
                VStack(spacing: 10) {
                    // 검색창 + 개수 (2026-07-02, 웹 미러)
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass").font(.system(size: 14)).foregroundStyle(BUColor.inkMuted)
                        TextField("브랜드 검색 (예: 맘스터치, BBQ, 메가커피)", text: $franchiseSearch)
                            .font(.system(size: 14))
                            .autocorrectionDisabled()
                            .onChange(of: franchiseSearch) { _, _ in franchiseVisible = franchisePageSize }
                        Spacer()
                        Text(franchiseSearch.trimmingCharacters(in: .whitespaces).isEmpty ? "전체 \(franchiseCandidates.count)개" : "\(franchiseFiltered.count) / \(franchiseCandidates.count)")
                            .font(.system(size: 12)).foregroundStyle(BUColor.inkMuted).fixedSize()
                    }
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                    if franchiseFiltered.isEmpty {
                        Text("\"\(franchiseSearch.trimmingCharacters(in: .whitespaces))\" 검색 결과가 없습니다.")
                            .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary)
                            .frame(maxWidth: .infinity, alignment: .center).padding(.vertical, 16)
                    } else {
                        ForEach(franchiseShown, id: \.id) { info in
                            FranchiseBrandRow(
                                info: info,
                                isSelected: franchiseBrandId == info.id,
                                action: { franchiseBrandId = (franchiseBrandId == info.id) ? "" : info.id }
                            )
                        }
                        if franchiseFiltered.count > franchiseVisible {
                            Button {
                                franchiseVisible += franchisePageSize
                            } label: {
                                Text("더보기 (남은 \(franchiseFiltered.count - franchiseVisible)개)")
                                    .font(.system(size: 13.5, weight: .semibold))
                                    .foregroundStyle(BUColor.ink)
                                    .frame(maxWidth: .infinity).padding(.vertical, 13)
                                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var selectionGuide: some View {
        switch selected {
        case "independent":
            guideCard(
                color: Color(red: 0.149, green: 0.388, blue: 0.922),
                icon: "lightbulb.fill",
                title: "독립창업 핵심 포인트",
                items: [
                    "브랜드·상품·인테리어 모두 본인 부담 — 6~12개월 안정화 자본 별도 확보",
                    "검증 레퍼런스 1개 이상 확보 후 진입 권장 (타 매장 분석·상품/서비스 시연)",
                    "자유도 최대 — 상품·가격·운영 시간 본인이 결정",
                ]
            )
        case "franchise":
            guideCard(
                color: Color(red: 0.486, green: 0.227, blue: 0.929),
                icon: "exclamationmark.triangle.fill",
                title: "프랜차이즈 — 반드시 확인",
                items: [
                    "공정위 정보공개서(franchise.ftc.go.kr) — 가맹사업자 신고 여부·폐점률 직접 확인",
                    "가맹비·인테리어비·로열티 항목별 별도 견적 (계약서 1식 표기 시 주의)",
                    "폐점률 20% 이상 브랜드 · 점주 평균 운영기간 5년 미만이면 위험 신호",
                ]
            )
        case "undecided":
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "clock")
                    .foregroundStyle(BUColor.inkMuted)
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.top, 1)
                Text("이후 단계에서 언제든지 변경 가능합니다. 일단 로드맵을 진행하면서 결정해도 됩니다.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
            )
        default:
            EmptyView()
        }
    }

    private func guideCard(color: Color, icon: String, title: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 7) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .font(.system(size: 13, weight: .bold))
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(color)
                        .frame(width: 4, height: 4)
                        .padding(.top, 7)
                    Text(item)
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [color.opacity(0.05), color.opacity(0.02)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(color.opacity(0.18), lineWidth: 1)
        )
    }
}

private struct TypeCard: View {
    let option: StartupTypeOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .center, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(option.color.opacity(isSelected ? 0.18 : 0.08))
                    Image(systemName: option.icon)
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(option.color.opacity(isSelected ? 1.0 : 0.8))
                }
                .frame(width: 52, height: 52)

                Text(option.titleKo)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(isSelected ? option.color : BUColor.ink)
                    .multilineTextAlignment(.center)
                Text(option.subtitleKo)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, minHeight: 160)
            .padding(.horizontal, 10)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: isSelected
                                ? [option.color.opacity(0.08), option.color.opacity(0.04)]
                                : [option.color.opacity(0.03), Color.white.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        isSelected ? option.color.opacity(0.4) : option.color.opacity(0.1),
                        lineWidth: 1.5
                    )
            )
            .shadow(color: isSelected ? option.color.opacity(0.08) : .clear, radius: 4, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - FranchiseBrandRow

private struct FranchiseBrandRow: View {
    let info: FranchiseBrand
    let isSelected: Bool
    let action: () -> Void

    private func formatManwon(_ manwon: Int) -> String {
        if manwon >= 10_000 {
            let eok = Double(manwon) / 10_000.0
            return eok == Double(Int(eok)) ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(manwon.formatted())만원"
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(info.name.ko)
                        .font(.system(size: 15.5, weight: .heavy))
                        .tracking(-0.2)
                        .foregroundStyle(BUColor.ink)
                    if isSelected {
                        Text("선택됨")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(0.4)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(BUColor.midnight.opacity(0.10), in: Capsule())
                    }
                    Spacer()
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.25))
                }

                Text(info.tagline.ko)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 12) {
                    metric(label: "창업 비용", value: formatManwon(info.startupCostWon))
                    metric(label: "연 매출", value: formatManwon(info.avgAnnualRevenueWon))
                    metric(label: "폐점률", value: String(format: "%.1f%%", info.closureRate))
                    metric(label: "매장수", value: "\(info.storeCount.formatted())")
                }

                // 5축 점수 바 — 웹 SSOT FranchiseBrand.scores (profitability/stability/accessibility/brandPower/support).
                scoreBars(info.scores, overallScore: overallScore(info.scores))

                if isSelected {
                    Divider().padding(.vertical, 2)
                    if let breakdown = info.costBreakdown, !breakdown.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("비용 항목")
                                .font(.system(size: 10.5, weight: .heavy))
                                .tracking(0.4)
                                .textCase(.uppercase)
                                .foregroundStyle(BUColor.inkMuted)
                            ForEach(breakdown, id: \.label.ko) { item in
                                HStack {
                                    Text(item.label.ko)
                                        .font(.system(size: 12.5, weight: .medium))
                                        .foregroundStyle(BUColor.inkSecondary)
                                    Spacer()
                                    Text("\(item.amountWon.formatted())만원")
                                        .font(.system(size: 12.5, weight: .semibold))
                                        .foregroundStyle(BUColor.ink)
                                        .monospacedDigit()
                                }
                            }
                            if let src = info.costSource {
                                Text("출처: \(src) · VAT 별도 · 점포 구입비 별도")
                                    .font(.system(size: 10.5))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .padding(.top, 2)
                            }
                        }
                    }

                    if info.monthlyRoyalty > 0 {
                        let royaltyText = info.monthlyRoyalty.truncatingRemainder(dividingBy: 1) == 0
                            ? "\(Int(info.monthlyRoyalty))"
                            : String(format: "%.1f", info.monthlyRoyalty)
                        Text("월 로열티 \(royaltyText)만원 / 가맹비 \(info.franchiseFee.formatted())만원")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    } else {
                        Text("로열티 없음 · 가맹비 \(info.franchiseFee.formatted())만원")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }

                    // 정직성: 데이터 기준연도 (웹 StartupTypeSelectionStage 1:1)
                    if let yr = info.dataYear, !yr.isEmpty {
                        Text("데이터 기준 \(yr)년")
                            .font(.system(size: 10.5, weight: .medium))
                            .foregroundStyle(BUColor.inkSubtle)
                    }

                    // 웹 SSOT: 선택된 브랜드의 본사 가맹 안내 페이지 link CTA.
                    if let urlString = info.franchiseUrl, let url = URL(string: urlString) {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Text("\(info.name.ko) 가맹 문의")
                                    .font(.system(size: 12, weight: .heavy))
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 10, weight: .heavy))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(BUColor.midnight, in: Capsule())
                        }
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                (isSelected ? BUColor.midnight.opacity(0.05) : Color.white),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.5) : BUColor.midnight.opacity(0.10), lineWidth: isSelected ? 1.5 : 1)
            )
            .shadow(color: isSelected ? BUColor.midnight.opacity(0.10) : .clear, radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private func metric(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - 5축 점수 바 (웹 FranchiseBrand.scores 미러)

    private func scoreColor(_ v: Int) -> Color {
        if v >= 80 { return BUColor.success } // green
        if v >= 60 { return Color(red: 0.149, green: 0.388, blue: 0.922) } // blue
        if v >= 40 { return BUColor.warn } // amber
        return BUColor.danger                // red
    }

    @ViewBuilder
    private func scoreBars(_ scores: FranchiseBrandScores, overallScore: Int) -> some View {
        HStack(alignment: .top, spacing: 8) {
            // 종합 점수 원형 게이지
            ZStack {
                Circle()
                    .stroke(scoreColor(overallScore).opacity(0.12), lineWidth: 4)
                Circle()
                    .trim(from: 0, to: CGFloat(overallScore) / 100.0)
                    .stroke(scoreColor(overallScore), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(overallScore)")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(scoreColor(overallScore))
                        .monospacedDigit()
                    Text("종합")
                        .font(.system(size: 8, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            .frame(width: 44, height: 44)

            // 5축 바
            HStack(spacing: 6) {
                scoreBar(label: "수익성", value: scores.profitability)
                scoreBar(label: "안정성", value: scores.stability)
                scoreBar(label: "접근성", value: scores.accessibility)
                scoreBar(label: "브랜드", value: scores.brandPower)
                scoreBar(label: "지원",  value: scores.support)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func scoreBar(label: String, value: Int) -> some View {
        VStack(spacing: 3) {
            // 막대
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(scoreColor(value).opacity(0.10))
                    .frame(width: 14, height: 28)
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(scoreColor(value))
                    .frame(width: 14, height: CGFloat(value) * 28.0 / 100.0)
            }
            Text("\(value)")
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(scoreColor(value))
                .monospacedDigit()
            Text(label)
                .font(.system(size: 8, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
    }
}

#if DEBUG
#Preview("StartupType") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["startup-type"] }
    return StartupTypeStageView().environment(store)
}
#endif
