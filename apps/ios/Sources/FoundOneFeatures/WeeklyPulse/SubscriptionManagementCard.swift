//
//  SubscriptionManagementCard.swift — 구독 관리 (운영 대시보드, 읽기전용 v1)
//
//  웹 SSOT 미러: apps/web/.../dashboard/SubscriptionPlanManager.tsx
//  데이터: 웹과 동일 Supabase user_store_data.subscription_plans (SubscriptionStore).
//  노출: 구독형 수익 모델 선택(uses_subscriptions=true) 사용자에게만 — 호출부에서 게이팅.
//
//  ⚠️ 가짜 숫자 금지: 플랜 데이터 없으면 0/예시 대신 "웹에서 플랜 추가" 빈상태.
//     플랜 편집(CRUD)·MRR(구독자 집계)은 후속 — v1은 플랜 카탈로그 읽기전용.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct SubscriptionManagementCard: View {

    @ObservedObject var store: SubscriptionStore

    public init(store: SubscriptionStore) {
        self.store = store
    }

    private var activePlans: [BUSubscriptionPlan] { store.plans.filter { $0.isActive } }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if store.plans.isEmpty {
                    emptyBody
                } else {
                    planList
                    footerNote
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                Image(systemName: "creditcard.and.123").font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("구독 관리").buSectionEyebrowStyle()
                Text(store.plans.isEmpty ? "구독 플랜" : "활성 플랜 \(activePlans.count)개")
                    .font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
            }
            Spacer(minLength: 0)
        }
    }

    private var emptyBody: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "plus.rectangle.on.folder").font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                Text("구독 플랜을 웹 대시보드에서 추가하면 여기서 플랜·가격·활성 상태가 함께 보입니다. 구독자 수·MRR 추적은 매출 기록이 쌓이면 활성화됩니다.")
                    .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
    }

    private var planList: some View {
        VStack(spacing: 8) {
            ForEach(store.plans) { plan in
                HStack(spacing: 10) {
                    Circle()
                        .fill(plan.isActive ? BUColor.success : BUColor.inkSubtle)
                        .frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(plan.name).font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                        Text(plan.isActive ? "활성" : "비활성")
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(plan.isActive ? BUColor.success : BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(formatKRW(plan.price)).font(.system(size: 14, weight: .bold)).monospacedDigit().foregroundStyle(BUColor.midnightDeep)
                        Text(plan.billingCycle == "annual" ? "/ 년" : "/ 월")
                            .font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    }
                }
                .padding(.horizontal, 12).padding(.vertical, 11)
                .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.inkSubtle.opacity(0.25), lineWidth: 1))
            }
        }
    }

    private var footerNote: some View {
        Text("플랜 편집은 웹 대시보드에서 — 앱은 연동된 데이터를 함께 봅니다.")
            .font(.system(size: 10.5, weight: .medium)).foregroundStyle(BUColor.inkSubtle).lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func formatKRW(_ value: Double) -> String {
        "\(Int(value.rounded()).formatted())원"
    }
}
