//
//  SubscriptionStore.swift — 구독 운영 상태 (웹과 동일 Supabase user_store_data)
//
//  웹 SSOT: profile-store.usesSubscriptions + operations-store.subscriptionPlans
//           → user_store_data.uses_subscriptions / subscription_plans 컬럼.
//
//  iOS는 같은 컬럼을 읽어 운영 대시보드 구독관리 카드를 게이팅·표시 (읽기전용 v1).
//  플랜 편집(CRUD)은 웹에서 — 앱은 연동된 데이터를 함께 본다.
//

import Foundation
import Supabase

@MainActor
public final class SubscriptionStore: ObservableObject {

    @Published public private(set) var state: SubscriptionState = .empty
    @Published public private(set) var isLoaded: Bool = false

    private let repository: StoreProfileRepository

    public init(repository: StoreProfileRepository) {
        self.repository = repository
    }

    public var usesSubscriptions: Bool { state.usesSubscriptions }
    public var plans: [BUSubscriptionPlan] { state.plans }

    /// uses_subscriptions + subscription_plans 로드. best-effort (실패 시 빈 상태 유지).
    public func load() async {
        do {
            self.state = try await repository.loadSubscriptionState()
        } catch {
            self.state = .empty
        }
        self.isLoaded = true
    }
}
