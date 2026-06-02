//
//  LocationCandidatesStageView.swift — 입지 후보 분석 (iOS 네이티브)
//
//  stageId: "location-candidates"
//
//  3-page (세그먼트):
//    pg 0 — 상권 분석 (배후 인구·경쟁·유동인구)
//    pg 1 — 매물 체크리스트 (접근성·주차·시설)
//    pg 2 — 최종 선택 & 메모
//

import SwiftUI
import MapKit
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

/// AI 추천 상권을 Apple 지도에 표시할 핀.
private struct MarketMapPin: Identifiable {
    let id: String
    let coord: CLLocationCoordinate2D
    let title: String
    let score: Int
}

public struct LocationCandidatesStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "location-candidates"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    // 상권 체크
    @AppStorage("loc.market.population")  private var marketPop      = false
    @AppStorage("loc.market.foot")        private var marketFoot     = false
    @AppStorage("loc.market.compete")     private var marketCompete  = false
    @AppStorage("loc.market.growth")      private var marketGrowth   = false

    // 매물 체크
    @AppStorage("loc.prop.access")        private var propAccess     = false
    @AppStorage("loc.prop.parking")       private var propParking    = false
    @AppStorage("loc.prop.visibility")    private var propVisibility = false
    @AppStorage("loc.prop.area")          private var propArea       = false
    @AppStorage("loc.prop.hood")          private var propHood       = false

    // 최종
    @AppStorage("loc.finalAddress")       private var finalAddress   = ""
    @AppStorage("loc.finalNote")          private var finalNote      = ""
    @AppStorage("loc.finalDone")          private var finalDone      = false

    private var marketOk: Bool { marketPop && marketFoot && marketCompete && marketGrowth }
    private var propOk: Bool   { propAccess && propParking && propVisibility && propArea && propHood }

    private let pages = ["상권 분석", "매물 체크", "최종 선택"]

    // AI 라이브 상권 추천 (웹 패리티 — POST /api/data/market-recommend)
    @State private var aiRegion = ""
    @State private var aiItems: [MarketScoredItem] = []
    @State private var aiLoading = false
    @State private var aiError: String?
    @State private var aiCenter: CLLocationCoordinate2D?
    @State private var aiPins: [MarketMapPin] = []
    @State private var aiDistrictMatches: [MarketDistrict] = []   // 내장 상권 DB 매칭 (즉시·오프라인 — 메인)
    @State private var didSearch = false                          // 한 번이라도 검색했는지 (AI 옵트인 노출 게이팅)
    @State private var selectedMarketId: String?                  // 사용자가 탭으로 고른 상권 (카드↔지도 핀 동기·확장)

    /// Found.One 상권 추천 (내장 상권 데이터 — **메인**·오프라인 즉시). 웹 buildRecommendedMarkets 대응.
    ///   AI 를 부르지 않는다. 지역 입력 → 내장 DB 매칭 + Apple 지도 핀.
    private func runFoundOneRecommend() {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        guard !region.isEmpty else { return }
        didSearch = true
        aiDistrictMatches = MarketDistrictRegistry.match(region)
        // 새 검색 — 이전 AI 결과/에러/핀 초기화 후 내장 매칭으로 다시 핀 표시.
        aiItems = []; aiError = nil; aiPins = []; aiCenter = nil
        Task { await geocodeDistrictPins(aiDistrictMatches) }
    }

    /// AI 실시간 상권 추천 (**별도 옵트인** — Kakao+Claude). 내장 데이터에 없는 지역(비-서울 등) 보강.
    ///   웹 requestAiMarketRecommend(/api/data/market-recommend) 대응. 사용자가 명시적으로 누를 때만 호출.
    private func runAiRecommend() {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        guard !region.isEmpty, !aiLoading else { return }
        let categoryId = StarterIndustryData.option(by: industryId)?.categoryId ?? "food"
        let sub = industryId.isEmpty ? nil : industryId
        aiLoading = true; aiError = nil
        Task {
            do {
                let result = try await MarketRecommendService.shared().recommend(
                    MarketRecommendInput(region: region, categoryId: categoryId, subIndustryId: sub)
                )
                await MainActor.run {
                    aiItems = result.items
                    aiLoading = false
                    if let lat = result.centerLat, let lng = result.centerLng {
                        aiCenter = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                    }
                }
                await geocodePins(items: result.items, center: aiCenter)
            } catch {
                await MainActor.run { aiError = error.localizedDescription; aiLoading = false }
            }
        }
    }

    /// 추천 상권 이름을 Apple 지도 좌표로 변환(MKLocalSearch) — 실패 항목은 핀 생략(best-effort).
    @MainActor
    private func geocodePins(items: [MarketScoredItem], center: CLLocationCoordinate2D?) async {
        guard let center else { return }
        var pins: [MarketMapPin] = []
        for item in items.prefix(5) {
            let req = MKLocalSearch.Request()
            req.naturalLanguageQuery = item.title
            req.region = MKCoordinateRegion(center: center, latitudinalMeters: 8000, longitudinalMeters: 8000)
            if let resp = try? await MKLocalSearch(request: req).start(),
               let coord = resp.mapItems.first?.placemark.coordinate {
                pins.append(MarketMapPin(id: "ai-" + item.id, coord: coord, title: item.title, score: item.score))
            }
        }
        aiPins.append(contentsOf: pins)
        if aiCenter == nil { aiCenter = pins.first?.coord }
    }

    /// 113-상권 DB 매칭 상권을 Apple 지도 좌표로 변환 → 점수 핀. (MKLocalSearch — 키/서버 불필요)
    @MainActor
    private func geocodeDistrictPins(_ districts: [MarketDistrict]) async {
        let seoul = CLLocationCoordinate2D(latitude: 37.5665, longitude: 126.9780)
        var pins: [MarketMapPin] = []
        for d in districts.prefix(8) {
            let query = (d.matchKeywords.first ?? d.title.ko)
            let req = MKLocalSearch.Request()
            req.naturalLanguageQuery = query + " 서울"
            req.region = MKCoordinateRegion(center: seoul, latitudinalMeters: 45000, longitudinalMeters: 45000)
            if let resp = try? await MKLocalSearch(request: req).start(),
               let coord = resp.mapItems.first?.placemark.coordinate {
                pins.append(MarketMapPin(id: "db-" + d.id, coord: coord, title: d.title.ko, score: d.score))
            }
        }
        guard !pins.isEmpty else { return }
        // 동일 검색 세션의 핀만 유지 (이전 검색 잔여 제거 없이 누적 — append)
        aiPins.append(contentsOf: pins)
        if aiCenter == nil { aiCenter = pins.first?.coord }
    }

    private var canCompleteStage: Bool {
        finalDone && !finalAddress.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var advanceHint: String {
        if finalAddress.trimmingCharacters(in: .whitespaces).isEmpty { return "최종 선택 매물 주소를 입력하세요" }
        if !finalDone { return "입지 최종 확정 토글을 켜세요" }
        if !marketOk { return "상권 분석 4항목 점검 권장" }
        if !propOk { return "매물 체크 5항목 점검 권장" }
        return "입지 확정 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "상권 후보 비교",
            stageEyebrow: "단계 7 · 입지 후보 분석",
            helperText: "\(cluster.categoryNounKo) 입지 분석: \(cluster.locationAnalysisFocus). 권장 키워드 — \(cluster.locationKeywords.joined(separator: "·")).",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["address": finalAddress])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["address": finalAddress]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 113개 상권 데이터 검토", detail: "유동인구·평균임대료·동종업종 밀도 비교 — 점수화된 상권 추천"),
                .init(label: "2. 상위 후보 3곳 선정", detail: "AI 점수 + 본인 자본 + 업종 적합도로 1차 압축"),
                .init(label: "3. 직접 상권 평가", detail: "지도에서 직접 입력한 위치도 분석 — 동일 점수 모델 적용"),
                .init(label: "4. 최종 1곳 확정", detail: "현장 답사·임대료 견적·매물 확인 후 1곳 결정"),
                ],
                verifyItems: [
                "임대 매물 상태 직접 확인 — 누수·결로·소방·주차·하수도·전기용량 5개 항목 사진 기록",
                "상권 유동인구 — 평일·주말·야간 3시간대 직접 카운트 검증 (행정 데이터는 평균값에 불과)",
                "동종업종 반경 200m 안 5개 이상이면 → 차별화 메뉴·시간·가격 1개 이상 확보 필수",
                "임대인 신원·등기부등본 직접 열람 — 가압류·근저당 있으면 보증금 보호 못 받을 위험",
                "용도지역(주거·상업·일반·전용) 확인 — 음식점은 일반·근린상업 가능, 주거지역은 면적 제한",
                "건물주의 「다음 임차인」 정책 — 5년 이내 강제 갱신·인테리어 잔존가치 분쟁 사전 점검",
                ],
                nextStageLabel: "계약서 검토",
                nextSummary: "입지 1곳 확정 → 임대 계약서 검토 단계로 진입"
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
                    case 0: marketPage
                    case 1: propertyPage
                    default: finalPage
                    }
                }
            }
        }
    }

    // MARK: - 왜 상권 분석이 중요한가 (웹 StageOverview 패리티)

    private var whyMarketCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 12) {
                BUEyebrow("이 단계 개요")
                Text("상권 = 매출 천장. 후회 없는 1곳을 정하기 위한 25분")
                    .font(.system(size: 18, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Text("상권은 1~2년 묶이는 의사결정입니다. 잘못 고르면 마케팅·메뉴·인테리어를 다 잘해도 매출이 임대료를 못 따라잡습니다. 라이브 상권 데이터 + 직접 답사 + 4지표 점수화로 후회 없이 결정하세요.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                // stat — 47% 폐업이 상권 후회
                HStack(spacing: 12) {
                    Text("47%").font(.system(size: 30, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    Text("초기 폐점 사장님이\n「상권 선택」을 후회")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                // outcome
                HStack(alignment: .top, spacing: 9) {
                    Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.success).padding(.top, 1)
                    Text("최종 상권 1곳을 확정하면, 그 상권의 임대료·유동·경쟁·타겟 정보를 다음 「계약 전 검토」 단계가 자동으로 받아 맞춤 체크리스트를 만들어 줍니다.")
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

    // MARK: - AI 상권 추천 카드 (웹 패리티)

    private var aiRecommendCard: some View {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                // ── 메인: Found.One 상권 추천 (내장 데이터) ──
                BUEyebrow("Found.One 상권 추천")
                Text("희망 지역을 입력하면 서울 상권 데이터에서 유동인구·임대료·경쟁을 점수화해 근처 상권까지 추천합니다.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)

                HStack(spacing: 8) {
                    TextField("예: 강남역, 연남동, 홍대", text: $aiRegion)
                        .font(BUFont.body)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .submitLabel(.search)
                        .onSubmit { runFoundOneRecommend() }
                    Button(action: runFoundOneRecommend) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                            .frame(width: 46, height: 42)
                            .background(
                                region.isEmpty ? BUColor.midnight.opacity(0.3) : BUColor.midnight,
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                            )
                    }
                    .disabled(region.isEmpty)
                }

                // 내장 데이터 결과 (메인)
                if !aiDistrictMatches.isEmpty {
                    Text("추천 상권 \(aiDistrictMatches.count)곳")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                    ForEach(aiDistrictMatches) { d in districtMatchRow(d) }
                } else if didSearch {
                    Text("‘\(region)’ 은(는) 내장 상권 데이터에 없어요. 아래 ‘AI 실시간 추천’을 이용해 보세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                }

                // 지도 (내장 매칭 또는 AI 핀) — 핀 탭 시 카드와 동기 선택(앱 장점: 인터랙티브 Apple 지도)
                if let center = aiCenter {
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: center, latitudinalMeters: 5000, longitudinalMeters: 5000
                    ))) {
                        ForEach(aiPins) { pin in
                            Annotation(pin.title, coordinate: pin.coord, anchor: .bottom) {
                                mapPin(pin)
                            }
                            .annotationTitles(.hidden)
                        }
                    }
                    .mapStyle(.standard)
                    .frame(height: 240)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
                    )
                    if aiPins.count > 1 {
                        Text("지도 핀을 탭하면 그 상권이 선택됩니다.")
                            .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                    }
                }

                // ── 별도 옵트인: AI 실시간 상권 추천 (검색 후 노출) ──
                if didSearch {
                    Divider().padding(.vertical, 2)
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("AI 실시간 상권 추천")
                                .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.midnight)
                            Text("내장 데이터에 없는 지역(비-서울 등)은 Kakao + AI 로 실시간 분석합니다.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        Spacer(minLength: 8)
                        Button(action: runAiRecommend) {
                            Group {
                                if aiLoading { ProgressView().tint(.white) }
                                else { Text("AI 추천").font(.system(size: 13, weight: .bold)).foregroundStyle(.white) }
                            }
                            .frame(minWidth: 64, minHeight: 38)
                            .background(
                                region.isEmpty || aiLoading ? BUColor.midnight.opacity(0.3) : BUColor.midnight,
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                            )
                        }
                        .disabled(region.isEmpty || aiLoading)
                    }
                    if aiLoading {
                        Text("AI가 주변 상권을 분석 중입니다… (10~30초)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    }
                    if let aiError {
                        Text("⚠ \(aiError)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.danger).lineSpacing(2)
                    }
                    ForEach(aiItems) { item in recommendItemRow(item) }
                }
            }
        }
        .sensoryFeedback(.selection, trigger: selectedMarketId)   // 앱 장점 — 선택 시 햅틱
    }

    private func recommendItemRow(_ item: MarketScoredItem) -> some View {
        let isSel = selectedMarketId == item.id
        let sc = scoreColor(item.score)
        return Button {
            selectMarket(id: item.id, title: item.title)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top, spacing: 12) {
                    Text(item.title)
                        .font(.system(size: 16, weight: .semibold)).foregroundStyle(BUColor.ink).tracking(-0.3)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(item.score)")
                        .font(.system(size: 16, weight: .bold)).foregroundStyle(sc).monospacedDigit()
                        .frame(width: 42, height: 42)
                        .background(sc.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                if !item.summary.isEmpty {
                    Text(item.summary).font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
                ForEach(item.reasons.prefix(2), id: \.self) { r in
                    Label(r, systemImage: "checkmark.circle.fill")
                        .font(.system(size: 12)).foregroundStyle(scoreColor(86)).labelStyle(.titleAndIcon)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                ForEach(item.warnings.prefix(isSel ? 2 : 1), id: \.self) { w in
                    Label(w, systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 12)).foregroundStyle(scoreColor(0)).labelStyle(.titleAndIcon)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                if isSel {
                    Divider().opacity(0.4)
                    Label("입지 후보로 선택됨 — ‘최종 선택’에 자동 반영", systemImage: "mappin.circle.fill")
                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSel ? BUColor.midnight.opacity(0.05) : Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(isSel ? BUColor.midnight : BUColor.borderSubtle, lineWidth: isSel ? 2 : 1))
            .shadow(color: isSel ? BUColor.midnight.opacity(0.14) : Color.black.opacity(0.03), radius: isSel ? 8 : 2, x: 0, y: isSel ? 3 : 1)
        }
        .buttonStyle(.plain)
    }

    /// 점수→색상 — 웹 LocationCandidatesStage 와 동일 임계/색(≥85 green / ≥70 blue / <70 amber).
    private func scoreColor(_ score: Int) -> Color {
        if score >= 85 { return Color(red: 0x34/255, green: 0xC7/255, blue: 0x59/255) }   // #34c759
        if score >= 70 { return Color(red: 0x00/255, green: 0x7A/255, blue: 0xFF/255) }   // #007aff
        return Color(red: 0xFF/255, green: 0x9F/255, blue: 0x0A/255)                       // #ff9f0a
    }

    /// 상권 카드/핀 탭 → 선택 토글. 선택 시 햅틱 + (비어있으면) 최종 입지 주소 자동 프리필(추천→결정 연결).
    private func selectMarket(id: String, title: String) {
        withAnimation(.easeOut(duration: 0.2)) {
            selectedMarketId = (selectedMarketId == id) ? nil : id
        }
        if selectedMarketId == id, finalAddress.trimmingCharacters(in: .whitespaces).isEmpty {
            finalAddress = title
        }
    }

    /// 지도 핀(id = "db-"/"ai-" 접두) → 카드 선택과 동기.
    private func selectMarketByPin(_ pin: MarketMapPin) {
        selectMarket(id: bareId(pin.id), title: pin.title)
    }
    private func bareId(_ pinId: String) -> String {
        (pinId.hasPrefix("db-") || pinId.hasPrefix("ai-")) ? String(pinId.dropFirst(3)) : pinId
    }

    /// 지도 핀 뷰 — 웹 핀 디자인(점수 배지 + 제목 pill) 미러. 선택 시 미드나잇 강조 + 확대(앱 장점).
    private func mapPin(_ pin: MarketMapPin) -> some View {
        let isSel = selectedMarketId == bareId(pin.id)
        let sc = scoreColor(pin.score)
        return Button { selectMarketByPin(pin) } label: {
            HStack(spacing: 5) {
                Text("\(pin.score)")
                    .font(.system(size: 11, weight: .bold)).monospacedDigit()
                    .foregroundStyle(isSel ? .white : sc)
                    .frame(width: 22, height: 22)
                    .background((isSel ? Color.white.opacity(0.22) : sc.opacity(0.18)), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                Text(pin.title)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(isSel ? .white : BUColor.ink).lineLimit(1)
            }
            .padding(.leading, 6).padding(.trailing, 10).padding(.vertical, 6)
            .background(isSel ? BUColor.midnight : Color.white, in: Capsule())
            .overlay(Capsule().strokeBorder(isSel ? BUColor.midnight : Color.black.opacity(0.1), lineWidth: 1.5))
            .shadow(color: Color.black.opacity(0.18), radius: isSel ? 6 : 3, y: 2)
            .scaleEffect(isSel ? 1.08 : 1.0)
        }
        .buttonStyle(.plain)
    }

    /// Found.One 상권 카드 — 웹 디자인(42×42 점수배지·메타칩·선택 하이라이트) 미러 + 앱 장점(탭 선택·확장·햅틱).
    private func districtMatchRow(_ d: MarketDistrict) -> some View {
        let isSel = selectedMarketId == d.id
        let sc = scoreColor(d.score)
        return Button {
            selectMarket(id: d.id, title: d.title.ko)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(d.title.ko)
                            .font(.system(size: 16, weight: .semibold)).foregroundStyle(BUColor.ink).tracking(-0.3)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(d.guName).font(.system(size: 12)).foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                    Text("\(d.score)")
                        .font(.system(size: 16, weight: .bold)).foregroundStyle(sc).monospacedDigit()
                        .frame(width: 42, height: 42)
                        .background(sc.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                Text(d.summary.ko)
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: 6) {
                    metaChip("임대료 " + rentLabel(d.meta.rentBand))
                    metaChip("경쟁 " + levelLabel(d.meta.competitionLevel))
                    metaChip("유동 " + trafficLabel(d.meta.footTraffic))
                    if d.meta.growthTrend == "rising" { metaChip("성장 ↑", tint: scoreColor(86)) }
                }
                // 앱 장점 — 선택 시 인라인 확장(웹은 별도 패널). 메타 기반 상세 + 결정 연결 안내.
                if isSel {
                    Divider().opacity(0.4)
                    Label("입지 후보로 선택됨 — ‘최종 선택’에 자동 반영", systemImage: "mappin.circle.fill")
                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    Text(detailNarrative(d))
                        .font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSel ? BUColor.midnight.opacity(0.05) : Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(isSel ? BUColor.midnight : BUColor.borderSubtle, lineWidth: isSel ? 2 : 1))
            .shadow(color: isSel ? BUColor.midnight.opacity(0.14) : Color.black.opacity(0.03), radius: isSel ? 8 : 2, x: 0, y: isSel ? 3 : 1)
        }
        .buttonStyle(.plain)
    }

    /// 웹 score 라벨이 iOS 정적 데이터엔 없어 meta 기반 한 줄 요약 — 임대료·경쟁·유동·고객적합·상권유형.
    private func detailNarrative(_ d: MarketDistrict) -> String {
        [
            "임대료 " + rentLabel(d.meta.rentBand),
            "경쟁 " + levelLabel(d.meta.competitionLevel),
            "유동 " + trafficLabel(d.meta.footTraffic),
            "적합도 " + fitLabel(d.meta.customerFit),
            styleLabel(d.meta.marketStyle) + " 상권",
        ].joined(separator: " · ")
    }

    private func metaChip(_ text: String, tint: Color? = nil) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(tint ?? BUColor.inkSecondary)
            .padding(.horizontal, 10).padding(.vertical, 4)
            .background((tint ?? BUColor.midnight).opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.borderSubtle, lineWidth: 1))
    }
    private func fitLabel(_ f: String) -> String {
        switch f { case "strong": return "강함"; case "steady": return "안정적"; case "mixed": return "혼합"; case "throughput": return "통행형"; default: return f }
    }
    private func styleLabel(_ s: String) -> String {
        switch s { case "destination": return "목적지형"; case "office": return "오피스"; case "residential": return "주거"; case "balanced": return "균형"; default: return s }
    }
    private func rentLabel(_ b: String) -> String {
        switch b { case "low": return "낮음"; case "mid": return "중간"; case "mid-high": return "중상"; case "high": return "높음"; default: return b }
    }
    private func levelLabel(_ l: String) -> String {
        switch l { case "low": return "낮음"; case "mid": return "중간"; case "high": return "높음"; default: return l }
    }
    private func trafficLabel(_ t: String) -> String {
        switch t { case "mid": return "중간"; case "high": return "많음"; case "very-high": return "매우많음"; default: return t }
    }

    // MARK: - pg 0 상권 분석

    private var marketPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            whyMarketCard
            aiRecommendCard

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("4대 무료 상권 분석 도구")
                    let tools: [(String, String)] = [
                        ("소상공인마당 (sg.sbiz.or.kr)", "업종별 상권 분석 리포트 무료 — 예상 매출·경쟁 업체 수 자동 계산"),
                        ("네이버 지도 위성·로드뷰", "매장 앞 유동인구·주차공간·간판 가시성 현장 확인 전 예비 체크"),
                        ("카카오맵 주변 업체 검색", "반경 500m 내 동업종 수·리뷰 수·영업 상태 파악"),
                        ("행정안전부 생활인구 데이터", "시간대별·연령대별 실제 유동인구 데이터 (data.mois.go.kr 무료)"),
                    ]
                    ForEach(tools, id: \.0) { name, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight).frame(width: 32, height: 32)
                                Text(String(name.prefix(1))).font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("상권 분석 체크리스트")
                    locationCheckRow("배후 주거·직장 인구 충분 (반경 500m 내 500세대 이상)", isChecked: $marketPop)
                    locationCheckRow("점심·저녁 시간대 유동인구 직접 현장 확인 완료", isChecked: $marketFoot)
                    locationCheckRow("반경 200m 내 동업종 3개 미만 또는 수요 충분히 큼", isChecked: $marketCompete)
                    locationCheckRow("주변 신규 개발·재개발 이슈 확인 (상권 성장 or 공실 위험)", isChecked: $marketGrowth)
                }
            }

            warningCard(title: "상권 함정", items: [
                "유명 상권 = 높은 임대료 + 치열한 경쟁 → 초기 생존율 낮음",
                "골목 상권은 고정 단골 형성 시 수익성이 더 안정적",
                "권리금 있는 매물 = 전 업주 영업력 포함 가격 — 업종 변경 시 권리금 손실",
            ], color: .orange)
        }
    }

    // MARK: - pg 1 매물 체크

    private var propertyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("매물 현장 체크리스트")
                    locationCheckRow("대로변 or 코너 위치 — 간판 3방향 이상 가시성 확보", isChecked: $propVisibility)
                    locationCheckRow("주차 공간 or 인근 공영주차장 도보 3분 이내", isChecked: $propParking)
                    locationCheckRow("대중교통 (버스·지하철) 도보 5분 이내 접근", isChecked: $propAccess)
                    locationCheckRow("실내 면적 주방 + 홀 배치 가능 (최소 20~30평 권장)", isChecked: $propArea)
                    locationCheckRow("외부 환기 덕트·후드 설치 가능 여부 임대인 확인", isChecked: $propHood)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("면적별 매장 구성 가이드")
                    let sizes: [(String, String)] = [
                        ("10~15평", "1인 운영 배달전문 또는 테이크아웃. 좌석 최소화."),
                        ("15~25평", "테이블 6~10개. 아르바이트 1명 + 사장님 운영 적정."),
                        ("25~40평", "테이블 12~20개. 홀 직원 1~2명 필요. 주방 분리 가능."),
                        ("40평 이상", "대형 홀. 주방장 + 홀 2명+ 이상. 인건비 비중 급증."),
                    ]
                    ForEach(sizes, id: \.0) { size, desc in
                        HStack(alignment: .top, spacing: 8) {
                            Text(size).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 60, alignment: .leading)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            warningCard(title: "매물 레드플래그", items: [
                "건축물대장 용도가 근린생활시설 외 → 영업신고 불가",
                "전 업주 폐업 이유 확인 필수 — 낮은 임대료가 함정인 경우 있음",
                "관리비·원상복구 비용 임대 계약 전 확인 — 나중에 수백만원 추가 발생",
            ], color: .red)
        }
    }

    // MARK: - pg 2 최종 선택

    private var finalPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("분석 요약")
                    wrapRow(label: "상권 분석 4항목", done: marketOk)
                    wrapRow(label: "매물 현장 체크 5항목", done: propOk)
                    if marketOk && propOk {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success)
                            Text("모든 체크 통과 — 임대 계약 검토 단계로 진행하세요.")
                                .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                        }.padding(.top, 4)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 선택 매물 주소")
                    TextField("예) 서울 마포구 연남동 OO길 00번지 1층", text: $finalAddress, axis: .vertical)
                        .font(BUFont.body)
                        .padding(.horizontal, 10).padding(.vertical, 8)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .lineLimit(2...4)

                    BUEyebrow("협상 메모")
                    TextField("권리금·월세 협상 내용, 임대인 특약 요청 사항 등", text: $finalNote, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .padding(.horizontal, 10).padding(.vertical, 8)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .lineLimit(3...6)

                    Toggle(isOn: $finalDone) {
                        Text("입지 최종 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("임대 계약 전 협상 팁")
                    tipRow("월세 10~20% 인하 요구", detail: "3개월치 선납 제안 시 임대인이 수용 확률 높음")
                    tipRow("인테리어 기간 (1~2개월) 무상 임대 협상", detail: "공사 중 임대료 면제 특약 — 수백만원 절감")
                    tipRow("원상복구 범위 사전 명문화", detail: "계약서에 '원상복구 면제 항목' 구체적으로 기재")
                }
            }
        }
    }

    // MARK: - Helpers

    private func locationCheckRow(_ label: String, isChecked: Binding<Bool>) -> some View {
        Button { isChecked.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isChecked.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18)).foregroundStyle(isChecked.wrappedValue ? BUColor.success : BUColor.inkSubtle).padding(.top, 1)
                Text(label).font(BUFont.bodySmall).foregroundStyle(isChecked.wrappedValue ? BUColor.ink : BUColor.inkMuted).multilineTextAlignment(.leading)
                Spacer()
            }
            .padding(.vertical, 8).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func wrapRow(label: String, done: Bool) -> some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16)).foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label).font(BUFont.bodySmall).foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
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
#Preview("LocationCandidates") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["location-candidates"] }
    return LocationCandidatesStageView().environment(store)
}
#endif
