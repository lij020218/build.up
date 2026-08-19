//
//  MyStoreView.swift — "내 가게" iOS 루트 화면
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/MyStoreView.tsx
//
//  회계·정적 데이터 관점 — 운영 대시보드와 분리.
//  AI 호출 0 — 모두 사장 입력 + 정적 schema + 산수.
//
//  구성 (2026-08-19 IA — 세그먼트 3탭, 웹 MyStoreView 동일):
//    「현황」  1) Hero At-a-Glance  2) Financial 3숫자 스트립  3) 월 비용(읽기+수정)  4) D-Day(항목 있을 때만)
//    「가게 정보」 공통 5섹션 + 거점 + 업종 섹션 — 접힌 행, 탭하면 펼침 (SectionCard collapsible)
//    「서류」  사업 서류 라이브러리
//    Footer 안내문은 공통
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct MyStoreView: View {

    @Bindable private var store: DashboardStore
    @ObservedObject private var storeInfo: StoreInfoStore

    /// 2026-08-19: 사진·서류 업로더 주입 (nil = 데모/미로그인 → 업로드 UI 비활성)
    private let photoUploader: StorePhotoUploader?
    private let documentUploader: BusinessDocumentUploader?

    public init(store: DashboardStore, storeInfo: StoreInfoStore,
                photoUploader: StorePhotoUploader? = nil,
                documentUploader: BusinessDocumentUploader? = nil) {
        self.store = store
        self.storeInfo = storeInfo
        self.photoUploader = photoUploader
        self.documentUploader = documentUploader
    }

    /// 내 가게 세그먼트 (2026-08-19 IA — 웹 MyStoreView 동일 3탭: 현황 · 가게 정보 · 서류)
    enum Segment: String, CaseIterable, Hashable {
        case status, info, docs
        var labelKo: String {
            switch self {
            case .status: return "현황"
            case .info:   return "가게 정보"
            case .docs:   return "서류"
            }
        }
    }
    @State private var segment: Segment = .status

    public var body: some View {
        // ⚠️ 2026-05-25: ZStack + BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
        //   중복 Aurora 두 인스턴스가 독립 애니메이션 → 배경 분리감 발생.
        ScrollView {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일) — 히어로 카드 위에 "내 가게" + 상태 한 줄 + 세그먼트
                BUPageHeader(
                    title: "내 가게",
                    subtitle: myStoreSubtitle,
                    accessory: {
                        BUSegmentedControl(
                            items: Segment.allCases.map {
                                BUSegmentItem(id: $0, label: $0.labelKo, showsDot: $0 == .status && hasUrgentDday)
                            },
                            selection: $segment
                        )
                    }
                )
                VStack(alignment: .leading, spacing: 16) {
                    switch segment {
                    case .status: statusSegment
                    case .info:   infoSegment
                    case .docs:   docsSegment
                    }

                    footer
                        .padding(.horizontal, 16)

                    Color.clear.frame(height: 80)
                }
            }
        }
        .scrollIndicators(.hidden)
        .task {
            await storeInfo.load()
        }
    }

    // MARK: - Segments

    /// 「현황」 = 한눈에 보기 → 재무 3숫자 스트립 → 월 비용(읽기 전용 + 수정) → D-Day(항목 있을 때만)
    @ViewBuilder
    private var statusSegment: some View {
        HeroAtAGlance(store: storeInfo, photoUploader: photoUploader)
            .padding(.horizontal, 16)

        FinancialSnapshotCard(store: store)
            .padding(.horizontal, 16)

        CostManagementCard(store: store)
            .padding(.horizontal, 16)

        if !ddayItems.isEmpty {
            ddayCard
                .padding(.horizontal, 16)
        }
    }

    /// 「가게 정보」 = 공통 5섹션 + 거점 + 업종 섹션 — 접힌 행(제목 + 입력 n/m), 탭하면 펼침
    @ViewBuilder
    private var infoSegment: some View {
        ForEach(allSections, id: \.id) { spec in
            SectionCard(spec: spec, store: storeInfo, collapsible: true)
                .padding(.horizontal, 16)
        }
    }

    /// 「서류」 = 사업 서류 라이브러리
    @ViewBuilder
    private var docsSegment: some View {
        BusinessDocumentsCard(storeInfo: storeInfo, uploader: documentUploader)
            .padding(.horizontal, 16)
    }

    private var hasUrgentDday: Bool {
        ddayItems.contains { $0.urgency == .overdue || $0.urgency == .urgent }
    }

    /// 헤더 부제 — 운영 상태 + 상호 (가짜 숫자 없음, 상태 문구만).
    private var myStoreSubtitle: String {
        let status = store.businessLaunched ? "운영 중" : "오픈 준비 중"
        return store.storeName.isEmpty ? status : "\(status) · \(store.storeName)"
    }

    // MARK: - Section composition (common + footprint + category)

    /// DashboardStore.category 를 schema 의 categoryId 문자열로 매핑.
    private var schemaCategoryId: String {
        switch store.category {
        case .restaurant:    return "food"
        case .cafe:          return "cafe-dessert"
        case .beauty:        return "beauty"
        case .retail:        return "retail"
        case .ecommerce:     return "online-digital"
        case .fitness:       return "fitness"
        case .education:     return "education"
        case .pet:           return "pet"
        case .livingService: return "living-service"
        case .space:         return "space"
        case .startupTech:   return "startup-tech"
        case .general:       return "food"
        }
    }

    /// categoryId → footprint mode 매핑.
    private var footprintMode: FootprintMode {
        switch schemaCategoryId {
        case "online-digital":    return .digital
        case "startup-tech":      return .digital   // 스타트업도 디지털 거점 + 별도 startup 섹션
        // mobile (출장형) 은 sub-industry modifier 단계에서 결정 — Phase C
        default:                  return .tenancy
        }
    }

    private var allSections: [SectionSpec] {
        var result = StoreInfoSchema.common
        if let foot = StoreInfoSchema.footprint(for: footprintMode) {
            result.append(foot)
        }
        result.append(contentsOf: StoreInfoSchema.categorySections(for: schemaCategoryId))
        return result
    }

    // MARK: - D-Day card (실 데이터)
    //
    // DDayCalculator.collect() 결과에서 30일 이내 + overdue 만 표시 (최대 5개).
    // 없으면 기존 placeholder 유지 — 이 카드 자체는 단순한 요약. 자세한 list는
    // HeroAtAGlance 의 D-Day pill → DDayListSheet 가 담당.

    private var ddayItems: [DDayItem] {
        DDayCalculator.collect(from: storeInfo.state)
            .filter { $0.daysRemaining <= 30 }
            .prefix(5)
            .map { $0 }
    }

    private var ddayCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            BUEyebrow("만료 예정 · D-DAY")

            if ddayItems.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "bell")
                        .font(.system(size: 14))
                        .foregroundStyle(BUColor.midnight.opacity(0.7))
                    Text("곧 만료될 항목이 없습니다")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .padding(.vertical, 4)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(ddayItems.enumerated()), id: \.element.id) { idx, item in
                        ddayRow(item)
                        if idx < ddayItems.count - 1 {
                            Rectangle()
                                .fill(BUColor.cardBorder.opacity(0.6))
                                .frame(height: 0.5)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private func ddayRow(_ item: DDayItem) -> some View {
        HStack(spacing: 10) {
            // D-day capsule
            Text(item.dDayLabel)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white)
                .monospacedDigit()
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    ddayTint(item.urgency),
                    in: Capsule()
                )

            Text(item.itemTitle)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)

            // section kind chip
            Text(item.sectionLabel)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(
                    BUColor.midnight.opacity(0.06),
                    in: Capsule()
                )

            Spacer(minLength: 0)

            Text(StoreInfoFormatters.dateDotted(item.expiresAt))
                .font(.system(size: 10.5))
                .foregroundStyle(BUColor.inkMuted)
                .monospacedDigit()
        }
        .padding(.vertical, 8)
    }

    private func ddayTint(_ urgency: StoreInfoFormatters.ExpiryUrgency) -> Color {
        switch urgency {
        case .overdue: return BUColor.danger.opacity(0.85)
        case .urgent:  return BUColor.warn
        case .soon:    return BUColor.midnight.opacity(0.7)
        case .later:   return BUColor.inkMuted
        case .none:    return BUColor.inkMuted
        }
    }

    // MARK: - Footer

    private var footer: some View {
        Text("이 페이지의 모든 정보는 사장님이 직접 입력하신 정적 데이터로 구성됩니다. 매일 보는 운영 KPI는 운영 대시보드에서 확인하세요.")
            .font(.system(size: 11.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .lineSpacing(3)
            .padding(.horizontal, 4)
            .padding(.top, 4)
    }
}
