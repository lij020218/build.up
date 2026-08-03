//
//  LocationCandidatesStageView.swift — 상권 후보 비교 (iOS 네이티브)
//
//  stageId: "location-candidates"
//
//  웹 SSOT 미러 (apps/web/.../selection/LocationCandidatesStage.tsx) — 6 페이지:
//    pg 0 — 개요 (StageOverview: 왜 + 작업 목차 + 기대 결과)
//    pg 1 — 1. 지역·AI (WorkStep)
//    pg 2 — 2. 답사 후보 (WorkStep)
//    pg 3 — 3. 점수 비교 (WorkStep + 사장님 상황 유리한 길)
//    pg 4 — 4. 매물 체크 (WorkStep)
//    pg 5 — 후보 비교·결정 (실제 지역 입력·AI 추천·지도·최종 선택 패널)
//  상단 KEY ACTION 히어로는 BUStageKeyActionRegistry["location-candidates"] 자동 노출(웹 KeyActionHero 미러).
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
    @AppStorage("stage.budget.startupWon") private var startupWon = 0   // 예산별 유리한 전략 분기(웹 budgetTier)
    @State private var page = 0
    private let stageId = "location-candidates"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    // ── 업종군 분기 (2026-07-02 업종 정합 감사, 웹 LocationCandidatesStage 미러) ──
    //   매물 체크(면적·필수설비)·마무리가 외식 전용(테이블 수·환기 덕트·메뉴)이던 문제 → offlineKind 로 분기.
    private var offlineKind: String {
        switch cluster.category {
        case .food, .cafeDessert: return "food"
        case .retail:             return "retail"
        case .beauty:             return "beauty"
        case .fitness:            return "fitness"
        case .pet:                return "pet"
        case .education, .space:  return "space"
        default:                  return "service"
        }
    }
    /// 면적 — 업종별 최소 기준 (매물 체크)
    private var areaDetail: String {
        switch offlineKind {
        case "food":    return "15평 이하 = 배달·테이크아웃 전용. 15~25평 = 테이블 6~10개. 25~40평 = 홀 직원 1~2명 필요. 40평+ = 인건비 비중 급증."
        case "retail":  return "매장 면적 = 진열 SKU 수 직결. 10평 이하 = 소품·편의 위주. 10~25평 = 카테고리 2~3개. 입고·창고·하역 동선 별도 확보."
        case "beauty":  return "미용 1석당 약 3~4평(대기·샴푸 포함). 10평 = 2~3석, 20평 = 5~6석. 네일·속눈썹은 좌석 밀도 높게 가능."
        case "fitness": return "종목별 상이 — PT 스튜디오 15평~, 필라테스 기구 1대당 3~4평, 헬스장 30평+ 권장. 층고 2.7m+ 확인."
        case "pet":     return "미용·호텔·병원 등 동선 분리 필요. 소음·냄새 민감 — 환기·방음 확보. 대형견 취급 시 여유 공간."
        case "space":   return "좌석/룸 단위 수익 — 스터디카페 20평 ≈ 30~40석, 파티룸·연습실은 룸 수 기준으로 면적 산정."
        default:         return "업종별 상이 — 대면형은 상담·작업 공간, 출장형은 창고·주차 위주. 최소 기준을 업종 인허가로 먼저 확인."
        }
    }
    /// 매물 필수 설비 (덕트 대체 — 업종별)
    private var infraCheck: (title: String, detail: String) {
        switch offlineKind {
        case "food":    return ("환기·덕트 설치 가능 여부", "음식점·카페는 외부 환기 덕트 필수. 건물 구조상 설치 불가하면 영업 허가 자체가 불가. 임대인에게 반드시 사전 확인.")
        case "retail":  return ("하역·재고 동선 + 간판 전기", "택배·입고 동선과 창고 공간, 간판·조명 전기 용량 확인. 냉장·냉동 취급 시 전용 회로 필요.")
        case "beauty":  return ("급배수·전기 용량·환기", "샴푸대·기기 급배수 + 드라이어·펌기 동시 사용 전기 용량 확인. 약품 냄새 환기도 점검. 임대인에게 사전 확인.")
        case "fitness": return ("층고·바닥 하중·방음", "기구·점프 하중과 층고(2.7m+), 아래층 방음(고무매트·이중바닥) 사전 확인. 샤워실 급배수도 점검.")
        case "pet":     return ("급배수·방음·환기", "미용·목욕 급배수, 짖음 방음, 냄새 환기 필수. 위생·소독 설비 공간도 확보. 임대인에게 사전 확인.")
        case "space":   return ("방음·전기 용량·보안", "연습실·파티룸은 방음, 스터디카페·무인은 전기 용량(콘센트 밀도)·CCTV·출입통제 사전 확인.")
        default:         return ("업종별 필수 설비 확인", "업종 인허가 기준의 필수 설비(급배수·전기·환기 등)를 사전 확인. 임대인에게 설치 가능 여부 확인.")
        }
    }

    // 최종 결정 — 게이트는 상권 선택(웹 패리티). 주소·확정 토글은 선택 입력 (매물 계약은 다음 단계 몫)
    @AppStorage("loc.selectedMarketTitle") private var selectedMarketTitle = ""
    @AppStorage("loc.finalAddress")       private var finalAddress   = ""
    @AppStorage("loc.finalNote")          private var finalNote      = ""
    @AppStorage("loc.finalDone")          private var finalDone      = false

    // 웹 pageLabels 미러
    private let pages = ["개요", "1. 지역·AI", "2. 답사 후보", "3. 점수 비교", "4. 매물 체크", "후보 비교·결정", "마무리"]

    // AI 라이브 상권 추천 (웹 패리티 — POST /api/data/market-recommend)
    //   @AppStorage 로 영속 — 뷰 이탈 후에도 유지되고, advance 시 stage_decisions.inputs.preferredRegion
    //   (웹 SSOT 키)로 함께 저장돼 웹 region 폼 복원·business_profiles.preferred_regions 투영에 쓰인다.
    @AppStorage("loc.region") private var aiRegion = ""
    @State private var aiItems: [MarketScoredItem] = []
    /// 브랜드 시도 분포 (공정위 신형 가족 단일 출처) — 후보 목록 위 1회만 표시
    @State private var aiFranchiseRegional: String?
    @State private var aiLoading = false
    @State private var aiError: String?
    @State private var aiCenter: CLLocationCoordinate2D?
    @State private var aiPins: [MarketMapPin] = []
    @State private var aiDistrictMatches: [MarketDistrict] = []   // 내장 상권 DB 매칭 (즉시·오프라인 — 메인)
    @State private var didSearch = false                          // 한 번이라도 검색했는지 (AI 옵트인 노출 게이팅)
    @State private var selectedMarketId: String?                  // 사용자가 탭으로 고른 상권 (카드↔지도 핀 동기·확장)
    @State private var snapshotAxes: MarketSnapshotAxes?          // 지역 실측 스냅샷 (LLM 무관 자동 — 웹 MarketSnapshotPanel 미러)
    @State private var snapshotLoading = false

    /// Found.One 상권 추천 (내장 상권 데이터 — **메인**·오프라인 즉시). 웹 buildRecommendedMarkets 대응.
    private func runFoundOneRecommend() {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        guard !region.isEmpty else { return }
        didSearch = true
        aiDistrictMatches = MarketDistrictRegistry.match(region)
        aiItems = []; aiError = nil; aiPins = []; aiCenter = nil; aiFranchiseRegional = nil
        Task { await geocodeDistrictPins(aiDistrictMatches) }
    }

    /// AI 실시간 상권 추천 (**별도 옵트인** — Kakao+Claude). 웹 requestAiMarketRecommend 대응.
    private func runAiRecommend() {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        guard !region.isEmpty, !aiLoading else { return }
        let categoryId = StarterIndustryData.option(by: industryId)?.categoryId ?? "food"
        let sub = industryId.isEmpty ? nil : industryId
        // 프랜차이즈 선택자 — FranchiseApplicationStageView 와 동일 키 (같은 브랜드 반경 실측 활성화)
        let brandId = UserDefaults.standard.string(forKey: "stage.franchise.selectedBrandId") ?? ""
        aiLoading = true; aiError = nil
        Task {
            do {
                let result = try await MarketRecommendService.shared().recommend(
                    MarketRecommendInput(region: region, categoryId: categoryId, subIndustryId: sub, capital: startupWon > 0 ? startupWon : nil, franchiseBrandId: brandId.isEmpty ? nil : brandId)
                )
                await MainActor.run {
                    aiItems = result.items
                    aiFranchiseRegional = result.franchiseRegional
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

    /// 내장 상권 DB 매칭 상권을 Apple 지도 좌표로 변환 → 점수 핀. (MKLocalSearch — 키/서버 불필요)
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
        aiPins.append(contentsOf: pins)
        if aiCenter == nil { aiCenter = pins.first?.coord }
    }

    // 게이트 = 상권 1곳 선택 (웹 canCompleteLocationStep 패리티). 매물 주소는 계약 단계 몫 — 선택 입력.
    //  근거: 정부 창업절차 정석 상권분석→입지선정→점포계약 (중기부 창업절차도)
    private var canCompleteStage: Bool {
        // 하위호환: 게이트 완화 전(주소+토글 방식) 완료자도 수정 저장 가능해야 한다
        !selectedMarketTitle.trimmingCharacters(in: .whitespaces).isEmpty
            || (finalDone && !finalAddress.trimmingCharacters(in: .whitespaces).isEmpty)
    }

    private var advanceHint: String {
        if selectedMarketTitle.trimmingCharacters(in: .whitespaces).isEmpty { return "「후보 비교·결정」 탭에서 상권을 선택하세요" }
        return "상권 확정 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "상권 후보 비교",
            stageEyebrow: "단계 7 · 상권 후보 비교",
            helperText: "\(cluster.categoryNounKo) 입지 분석: \(cluster.locationAnalysisFocus). 권장 키워드 — \(cluster.locationKeywords.joined(separator: "·")).",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                // address(구체 매물 주소) + preferredRegion(선호 상권 — 웹 SSOT 키, projector→preferred_regions)
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["market": selectedMarketTitle, "address": finalAddress, "preferredRegion": aiRegion])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["market": selectedMarketTitle, "address": finalAddress, "preferredRegion": aiRegion]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 118개 상권 데이터 검토", detail: "유동인구·평균임대료·동종업종 밀도 비교 — 점수화된 상권 추천"),
                .init(label: "2. 상위 후보 3곳 선정", detail: "AI 점수 + 본인 자본 + 업종 적합도로 1차 압축"),
                .init(label: "3. 직접 상권 평가", detail: "아는 상권 이름을 입력해도 동일 점수 모델로 평가"),
                .init(label: "4. 최종 1곳 확정", detail: "현장 답사·임대료 견적·매물 확인 후 1곳 결정"),
                ],
                verifyItems: [
                "임대 매물 상태 직접 확인 — 누수·결로·소방·주차·하수도·전기용량 5개 항목 사진 기록",
                "상권 유동인구 — 평일·주말·야간 3시간대 직접 카운트 검증 (행정 데이터는 평균값에 불과)",
                offlineKind == "food"
                    ? "동종업종 반경 200m 안 5개 이상이면 → 차별화 메뉴·시간·가격 1개 이상 확보 필수"
                    : "동종업종 반경 200m 안 5개 이상이면 → 차별화 상품·서비스·가격 1개 이상 확보 필수",
                "임대인 신원·등기부등본 직접 열람 — 선순위 채권(근저당 채권최고액·가압류) 규모를 건물 시세·경락 예상가와 견줘 보증금 회수 가능성 확인 (근저당 있어도 건물가 여유면 보호, 선순위 과다·후순위 가압류·체납 국세면 위험). 인도+사업자등록+확정일자로 대항력·우선변제권 확보 필수",
                "용도지역(주거·상업·일반·전용) 확인 — 대부분 업종은 일반·근린상업 가능, 주거지역은 업종·면적 제한",
                "건물주의 임대 정책 — 상가임대차법 10년 법정 계약갱신요구권 보장 여부 + 퇴거 시 원상복구 범위 분쟁 사전 점검",
                ],
                nextStageLabel: "계약서 검토",
                nextSummary: "입지 1곳 확정 → 임대 계약서 검토 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
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
                    case 1: regionAiPage
                    case 2: visitPage
                    case 3: scorePage
                    case 4: propertyCheckPage
                    case 5: decisionPage
                    default: EmptyView()  // 마무리 페이지 — BUStageShell 이 wrapup 표시
                    }
                }
            }
        }
    }

    // MARK: - pg 0 개요 (웹 StageOverview 미러)

    private var overviewPage: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                BUEyebrow("이 단계 개요")
                Text("상권 = 매출 천장. 후회 없는 1곳을 정하기 위한 25분")
                    .font(.system(size: 18, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Text("상권은 1~2년 묶이는 의사결정입니다. 잘못 고르면 마케팅·메뉴·인테리어를 다 잘해도 매출이 임대료를 못 따라잡습니다. 공공 실측 데이터 점수 + 직접 답사 검증으로 후회 없는 결정.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                // stat — 47% 초기 폐점이 상권 후회
                HStack(spacing: 12) {
                    Text("47%").font(.system(size: 30, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    Text("초기 폐점 사장님이\n「상권 선택」을 후회")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                // 작업 목차 (웹 workOutline 미러)
                VStack(alignment: .leading, spacing: 8) {
                    Text("이 단계에서 진행 — 총 5단계")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.7))
                    outlineRow("1. 지역·AI", "구체적 지역 입력 → AI 라이브 추천", "5분")
                    outlineRow("2. 답사 후보", "후보 2~3곳 직접 답사 (현장 검증)", "10분")
                    outlineRow("3. 점수 비교", "실측 지표 (경쟁·유동·임대·인구) 점수 + 직관 검증", "10분")
                    outlineRow("4. 매물 체크", "현장 5가지 필수 확인 — 계약 전 최종 관문", "15분")
                    outlineRow("결정", "최종 1곳 선택 → 계약 검토 단계로", nil)
                }

                // outcome
                HStack(alignment: .top, spacing: 9) {
                    Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.success).padding(.top, 1)
                    Text("최종 상권 1곳이 Found.One 에 저장됩니다. 그 상권의 임대료·유동·경쟁·타겟 정보를 다음 단계 (계약 전 검토) 가 자동으로 받아서 맞춤 체크리스트를 생성.")
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

    private func outlineRow(_ step: String, _ title: String, _ time: String?) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text(step).font(.system(size: 10.5, weight: .bold)).tracking(0.4).textCase(.uppercase)
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                Text(title).font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
            if let time {
                Text(time).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.white, in: Capsule())
                    .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 1))
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    // MARK: - WorkStep 공통 카드 (웹 WorkStep 미러)

    private func workStepCard(stepLabel: String, time: String, headline: String,
                              why: String, how: [(String, String)],
                              watchouts: [(String, String)] = []) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Text(stepLabel)
                        .font(.system(size: 11, weight: .bold)).tracking(0.5)
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 9).padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.06), in: Capsule())
                    Text("· \(time)").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                }
                Text(headline)
                    .font(.system(size: 17, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                Text(why)
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)

                // 할 일 — 번호 + 제목 + 설명
                VStack(alignment: .leading, spacing: 0) {
                    Text("할 일").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.75))
                        .padding(.bottom, 8)
                    ForEach(Array(how.enumerated()), id: \.offset) { idx, h in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(idx + 1)")
                                .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                .frame(width: 28, height: 28)
                                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(h.0).font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(h.1).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 8)
                        if idx < how.count - 1 { Divider().opacity(0.5) }
                    }
                }

                if !watchouts.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("주의", systemImage: "exclamationmark.triangle.fill")
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.danger)
                        ForEach(Array(watchouts.enumerated()), id: \.offset) { _, w in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(w.0).font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.danger)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(w.1).font(.system(size: 12)).foregroundStyle(BUColor.danger.opacity(0.85)).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1))
                }
            }
        }
    }

    // MARK: - pg 1 지역·AI (웹 WorkStep 미러)

    private var regionAiPage: some View {
        workStepCard(
            stepLabel: "1. 지역·AI 추천", time: "5분",
            headline: "구체적 지역 입력 → AI 가 라이브 데이터로 후보 추천",
            why: "「강남구」 같이 넓은 입력은 추천 정확도 ↓. 시/도 + 동 (「대전 둔산동」) 처럼 좁힐수록 실측 매칭·경쟁 밀도가 정확해집니다.",
            how: [
                ("희망 지역 입력 (구체적으로)", "지하철역·핫스폿 + 도보 시간 또는 「~동·구 메인」. 카카오 Local 라이브 + 공공데이터 조회."),
                ("AI 라이브 추천 받기", "후보 3~5곳을 실측 기반으로 점수화 — 경쟁 밀도·유동 신호(카페 밀도 기준)·접근성은 카카오 실측, 임대료·공실률은 한국부동산원 조사상권(전국 372곳) 매칭 시 실측값으로. 조사상권 밖이면 임대료는 표시하지 않습니다."),
                ("무료 공공 도구로 교차 검증", "소상공인365(bigdata.sbiz.or.kr) 업종별 상권 리포트 · 카카오맵 반경 500m 동업종 검색 · 네이버 위성·로드뷰로 가시성 · 행정안전부 생활인구(data.mois.go.kr) 시간대별 유동인구. AI 추천을 직접 도구로 재확인하면 신뢰도 ↑."),
            ]
        )
    }

    // MARK: - pg 2 답사 후보 (웹 WorkStep 미러)

    private var visitPage: some View {
        workStepCard(
            stepLabel: "2. 답사 후보 추가", time: "10분",
            headline: "추천만 ≠ 결정. 후보 상권을 직접 답사해 현장 검증해야 함",
            why: "AI 는 정량 데이터 (임대료·유동) 만 봄. 사장님이 직접 본 「분위기·동선·소음」 같은 정성 요소는 직접 답사 매물에서만 확인 가능.",
            how: [
                ("아는 상권 직접 분석", "후보 비교 페이지 검색창에 상권 이름을 넣으면 같은 기준(실측 점수)으로 분석됩니다."),
                ("최소 3곳 이상 비교 필수", "1곳만 보면 「이게 좋아 보인다」 가 끝. 3곳 이상 동일 기준으로 보면 차이가 명확."),
            ],
            watchouts: [
                ("권리금 매물 — 매출 추정 없이 지불 = 묻힘", "매도자가 부르는 권리금은 매출 6~12개월치. 양수 후 본인 매출이 70%+ 유지돼야 회수 가능. 매출 떨어지는 이유 (사장 변경·메뉴 변경) 사전 검증."),
            ]
        )
    }

    // MARK: - pg 3 점수 비교 (웹 WorkStep + 사장님 상황 유리한 길)

    private var scorePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "3. 점수 비교", time: "10분",
                headline: "경쟁·유동·임대·인구 — 실측 지표로 동일 채점",
                why: "주관적 「느낌」 만으로 결정하면 후회 1순위. 공공 실측 지표로 채점한 후 본인 직관과 교차 검증해야 후회 없음.",
                how: [
                    ("실측 점수 확인", "경쟁(소진공 공식, 500m) · 유동(카페 밀도) · 임대·공실(부동산원) · 인구(주민등록). 기준 60점에 실측 가감 — 카드 「점수 근거」에서 축별 확인."),
                    ("점수 1위 + 본인 직관 교차 검증", "1위가 직관과 맞으면 결정. 다르면 그 이유를 메모 — 보통 직관이 놓친 요소가 보임."),
                ],
                watchouts: [
                    ("「임대료 싸 보임」 함정", "월세 100만원 싸도 매출 잠재력이 200만원 적으면 손해. 평당 임대료 / 평당 매출 잠재력 비율로 판단."),
                ]
            )
            favorableCard
        }
    }

    // MARK: - pg 4 매물 체크 (웹 WorkStep 미러)

    private var propertyCheckPage: some View {
        workStepCard(
            stepLabel: "4. 매물 체크", time: "15분",
            headline: "임대 매물 현장 — 5가지 필수 확인 후 계약 진행",
            why: "계약서에 서명하면 취소 불가. 현장에서 직접 눈으로 확인하지 않으면 권리금·인테리어 손실로 이어집니다.",
            how: [
                ("간판 가시성 — 3방향 이상 노출", "대로변·코너 매물은 3방향 노출 가능. 골목 매물은 메인 진입로에서 보이는지 로드뷰로 먼저 예비 확인 후 현장 확인."),
                ("주차 — 인근 공영주차장 도보 3분", "주차 불가 매물은 방문 고객이 줄어듦. 방문 의존이 낮은 모델(배달·예약·출장·온라인 병행)이면 영향이 작습니다."),
                ("대중교통 — 도보 5분 이내", "지하철·버스 정류장 5분 내. 6분+ 면 신규 유입 30% 감소(공공 데이터 기준). 방문 의존이 낮은 모델(배달·출장·온라인)이면 영향이 작습니다."),
                ("실내 면적 — 업종별 최소 기준", areaDetail),
                (infraCheck.title, infraCheck.detail),
            ],
            watchouts: [
                ("건축물대장 용도 확인", offlineKind == "food"
                    ? "근린생활시설이어야 음식점·카페 영업 가능. 용도가 다르면 건축법상 용도변경 유형(허가·신고·대장 기재변경, 동일 시설군 내 변경은 대개 기재변경·생략)에 따라 절차·비용·기간이 달라짐 — 사전 확인."
                    : "업종에 맞는 용도여야 영업 가능(대부분 근린생활시설). 용도가 다르면 건축법상 용도변경 유형(허가·신고·대장 기재변경)에 따라 절차·비용·기간이 달라짐 — 계약 전 확인."),
                ("전 업주 폐업 이유 반드시 확인", "낮은 임대료가 함정인 경우 있음. 전 임차인이 왜 폐업했는지 임대인 또는 인근 상인에게 직접 물어보세요."),
                ("관리비·원상복구 범위 사전 명문화", "월 관리비가 계약 후 30~50만원 추가되면 수지 계산이 무너짐. 임차 종료 시 원상회복 범위는 모호한 '원상복구 면제'가 아니라 '원상회복 의무 제외(시설물 인수·현 상태 인도)'처럼 구체 문구로 계약서에 명시(분쟁 예방)."),
            ]
        )
    }

    // MARK: - pg 5 후보 비교·결정 (실제 입력·추천·지도·최종 선택)

    private var decisionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            aiRecommendCard

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 선택 매물 주소 (선택 — 매물 확정 시)")
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
                        Text("매물까지 확정했어요 (선택)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    if !selectedMarketTitle.isEmpty {
                        Text("선택한 상권: \(selectedMarketTitle)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight)
                    }
                }
            }
        }
    }

    // MARK: - 사장님 상황(업종×예산)에 유리한 입지 전략 — 웹 compareFavorable 1:1 이식

    private var favorableCard: some View {
        let cat = StarterIndustryData.option(by: industryId)?.categoryId ?? "food"
        let tier: String = startupWon >= 200_000_000 ? "high" : (startupWon >= 80_000_000 ? "mid" : "low")
        let tip = favorableTip(categoryId: cat, tier: tier)
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: 10) {
                BUEyebrow("사장님 상황에 유리한 길")
                Text(tip.context)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(BUColor.midnight08, in: Capsule())
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 15)).foregroundStyle(scoreColor(86)).padding(.top, 1)
                    Text(tip.recommendation)
                        .font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
                Text(tip.rationale)
                    .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// 웹 compareFavorable[categoryId] (budgetTier high/mid/low) 1:1 포팅.
    private func favorableTip(categoryId: String, tier: String) -> (context: String, recommendation: String, rationale: String) {
        switch categoryId {
        case "food":
            return (
                tier == "low" ? "예산 8천만원 이하 + 음식점" : tier == "mid" ? "예산 8천~2억 + 음식점" : "예산 2억+ + 음식점",
                tier == "low" ? "메인 1블록 안쪽 이면 골목 — 임대료 30~40% 절감 + 단골 모델"
                    : tier == "mid" ? "준메인 + 점심·저녁 직장인 수요 가시권"
                    : "메인 상권 + 코너·1층 가시성 — 회전율 모델",
                tier == "low" ? "유동 1/3 손실 vs 임대료 1/2 절감 = 단골 60%+ 흑자 가능. 인스타·네이버 플레이스로 메인 효과 일부 회복."
                    : tier == "mid" ? "메인은 임대료 회수 4~5년. 준메인은 회전 + 단골 모두 노려 수지 균형 좋음."
                    : "메인은 회전율 = 매출. 임대료 부담 크지만 매출 천장 높아 객단가 8천~1.2만 모델 BEP 빠름."
            )
        case "cafe-dessert":
            return ("카페 / 디저트",
                tier == "low" ? "주거지 인접 + 산책 동선 — 단골 모델" : "메인 + 인스타 가능한 외관 — SNS 바이럴",
                tier == "low" ? "동네 카페는 단골 70%+ 가 매출 결정. 일관 동선 + 친절이 더 효율." : "메인 + 사진 잘 나오는 외관 = 인스타 자동 마케팅, 광고비 0.")
        case "retail":
            return ("리테일 / 셀렉트샵", "메인 1블록 안쪽 골목 셀렉트샵 — 인스타로 발견되는 모델",
                "메인 1층 임대료 부담 ↑. 골목 + 컨셉 외관 + SNS 마케팅으로 「발견하는 가게」 포지셔닝.")
        case "beauty":
            return ("미용·뷰티", "지하철 도보 5분 + 1~2층 (3층+ 회피)",
                "예약 모델은 접근성이 매출 직결. 3층+ 신규 유입 50% 감소.")
        case "fitness":
            return ("필라테스·요가·PT", "주거 밀집 + 도보 10분 + 지하·1층 (2층+ 회피)",
                "회원제는 집 근처가 재계약률 2배. 기구 운반 위해 1층 또는 엘리베이터 필수.")
        case "education":
            return ("학원 / 교육", "초·중등 학원은 학교 도보 10분 + 1층 + 주차 가능",
                "픽업 시 주차 못하면 다른 학원으로. 학교 가까울수록 신규 등록 ↑.")
        case "pet":
            return ("펫", "주거 단독 입지 + 1층 + 분리 동선 (다른 매장 X)",
                "짖음·털 알레르기 민원이 시간 제한 1순위. 상가 단독 또는 펫 클러스터 선호.")
        case "online-digital":
            return ("온라인·디지털", "물리 매장 X — 작업·창고만 필요. 주거 겸용 사무실로 시작",
                "고객 방문 0. 임대료 절감이 마진 직결. 매출 안정화 후 별도 사무실·창고로 분리.")
        default:
            return favorableTip(categoryId: "food", tier: tier)
        }
    }

    // MARK: - AI 상권 추천 카드 (웹 후보 비교·결정 패널 패리티)

    private var aiRecommendCard: some View {
        let region = aiRegion.trimmingCharacters(in: .whitespaces)
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("Found.One 상권 추천")
                Text("희망 지역을 입력하면 내장 상권 데이터(서울 118곳 기준)에서 점수화해 추천하고, 아래에 공공 실측 요약이 자동 표시됩니다. 서울 외 지역은 AI 실시간 분석을 이용하세요.")
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

                // ── 지역 실측 스냅샷 — 입력 700ms 디바운스 자동 (LLM 무관, 웹 패리티) ──
                if snapshotLoading || snapshotAxes?.displayLines.isEmpty == false {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(snapshotLoading ? "입력 지역 실측 · 조회 중…" : "입력 지역 실측")
                            .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        ForEach(snapshotAxes?.displayLines ?? [], id: \.self) { line in
                            Text(line)
                                .font(.system(size: 11.5)).foregroundStyle(BUColor.ink)
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }

                if !aiDistrictMatches.isEmpty {
                    Text("추천 상권 \(aiDistrictMatches.count)곳")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                    ForEach(aiDistrictMatches) { d in districtMatchRow(d) }
                } else if didSearch {
                    Text("‘\(region)’ 은(는) 내장 상권 데이터에 없어요. 아래 ‘AI 실시간 추천’을 이용해 보세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                }

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
                    if let regional = aiFranchiseRegional {
                        Text("🏢 \(regional)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                            .padding(.horizontal, 12).padding(.vertical, 8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
                    }
                    ForEach(aiItems) { item in recommendItemRow(item) }
                }
            }
        }
        .sensoryFeedback(.selection, trigger: selectedMarketId)
        .task(id: region) {
            // 700ms 디바운스 — 타이핑 중 취소 (웹 MarketSnapshotPanel 미러)
            guard region.count >= 2 else { snapshotAxes = nil; return }
            snapshotLoading = true
            defer { snapshotLoading = false }
            try? await Task.sleep(nanoseconds: 700_000_000)
            guard !Task.isCancelled else { return }
            let categoryId = StarterIndustryData.option(by: industryId)?.categoryId ?? "food"
            let brandId = UserDefaults.standard.string(forKey: "stage.franchise.selectedBrandId") ?? ""
            let axes = await MarketSnapshotService.shared().fetch(
                region: region,
                categoryId: categoryId,
                subIndustryId: industryId.isEmpty ? nil : industryId,
                franchiseBrandId: brandId.isEmpty ? nil : brandId
            )
            if !Task.isCancelled { snapshotAxes = axes }
        }
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
                // 실측 칩 — 서버 meta (LLM 미경유). 없는 값은 미표시 (웹 패리티, 2026-08-03)
                ForEach(measuredMetaLines(item), id: \.self) { line in
                    MeasuredMetaChip(line: line)
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
                    Label("입지 후보로 선택됨 — 아래 ‘최종 선택’에 자동 반영", systemImage: "mappin.circle.fill")
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

    /// 점수→색상 — 신호등 컬러 금지(2026-06-16). 미드나잇 네이비 농담 스케일: 점수 높을수록 진하게.
    ///   ≥85 midnightDeep / ≥70 midnight / <70 inkMuted. 색만으로 구분 말고 숫자 라벨 동반(기존).
    private func scoreColor(_ score: Int) -> Color {
        if score >= 85 { return BUColor.midnightDeep }
        if score >= 70 { return BUColor.midnight }
        return BUColor.inkMuted
    }

    /// 상권 카드/핀 탭 → 선택 토글. 상권명은 게이트·저장용 selectedMarketTitle 에만
    ///  (finalAddress 프리필 금지 — 상권명은 매물 주소가 아니다. 2026-08-03 정직화)
    private func selectMarket(id: String, title: String) {
        withAnimation(.easeOut(duration: 0.2)) {
            selectedMarketId = (selectedMarketId == id) ? nil : id
        }
        selectedMarketTitle = selectedMarketId == id ? title : ""
    }

    private func selectMarketByPin(_ pin: MarketMapPin) {
        selectMarket(id: bareId(pin.id), title: pin.title)
    }
    private func bareId(_ pinId: String) -> String {
        (pinId.hasPrefix("db-") || pinId.hasPrefix("ai-")) ? String(pinId.dropFirst(3)) : pinId
    }

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
                if isSel {
                    Divider().opacity(0.4)
                    Label("입지 후보로 선택됨 — 아래 ‘최종 선택’에 자동 반영", systemImage: "mappin.circle.fill")
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

    /// 웹 score 라벨이 iOS 정적 데이터엔 없어 meta 기반 한 줄 요약.
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
}


// MARK: - 실측 meta 칩 (웹 LocationCandidatesStage 카드 패리티, 2026-08-03)

/// 서버 결정론 meta → 표시 라인. 순서 = 웹과 동일 (공식경쟁 → 추이 → 배후인구 → 임대료).
private func measuredMetaLines(_ item: MarketScoredItem) -> [String] {
    var lines: [String] = []
    if let v = item.meta?.officialCompetition { lines.append("🏪 " + v) }
    if let v = item.meta?.franchisePresence { lines.append("🏢 " + v) }
    if let v = item.meta?.areaTrend { lines.append("📈 " + v) }
    if let v = item.meta?.backPopulation { lines.append("🏠 " + v) }
    if let v = item.meta?.measuredRent { lines.append("📐 " + v) }
    if let v = item.meta?.scoreBreakdown { lines.append("📊 점수 근거: " + v) }
    return lines
}

private struct MeasuredMetaChip: View {
    let line: String
    var body: some View {
        Text(line)
            .font(.system(size: 11.5, weight: .semibold))
            .foregroundStyle(BUColor.midnight)
            .lineSpacing(2)
            .padding(.horizontal, 10).padding(.vertical, 7)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1))
    }
}

#if DEBUG
#Preview("LocationCandidates") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["location-candidates"] }
    return LocationCandidatesStageView().environment(store)
}
#endif
