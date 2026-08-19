//
//  MyStoreView.swift — "내 가게" iOS 루트 화면
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/MyStoreView.tsx
//
//  회계·정적 데이터 관점 — 운영 대시보드와 분리.
//  AI 호출 0 — 모두 사장 입력 + 정적 schema + 산수.
//
//  구성 (모바일 최적화):
//    1) Hero At-a-Glance (가게명·미션·주소·전화 + 6지표 + D-Day pill)
//    2) Financial Snapshot (누적·잔고·런웨이 + 잔고 인라인 수정)
//    3) D-Day 위젯 (만료 임박 — 실 데이터 from StoreInfoStore.expiry items)
//    4) 공통 5섹션 (Identity / Legal / Money / People / Insurance) — SectionCard 로 진입
//    5) Footer 안내문
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

    public var body: some View {
        // ⚠️ 2026-05-25: ZStack + BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
        //   중복 Aurora 두 인스턴스가 독립 애니메이션 → 배경 분리감 발생.
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HeroAtAGlance(store: storeInfo, photoUploader: photoUploader)
                    .padding(.horizontal, 16)

                FinancialSnapshotCard(store: store)
                    .padding(.horizontal, 16)

                CostManagementCard(store: store)
                    .padding(.horizontal, 16)

                ddayCard
                    .padding(.horizontal, 16)

                BusinessDocumentsCard(storeInfo: storeInfo, uploader: documentUploader)
                    .padding(.horizontal, 16)

                ForEach(allSections, id: \.id) { spec in
                    SectionCard(spec: spec, store: storeInfo)
                        .padding(.horizontal, 16)
                }

                footer
                    .padding(.horizontal, 16)

                Color.clear.frame(height: 80)
            }
            .padding(.top, 12)
        }
        .scrollIndicators(.hidden)
        .navigationTitle("내 가게")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .task {
            await storeInfo.load()
        }
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
