//
//  MonthlyCostsRepository.swift — 월 비용 구조 CRUD
//
//  Supabase 의 `monthly_costs` 테이블. 사용자당 1행 (singleton per user).
//
//  ⚠️ Supabase schema:
//   table monthly_costs (
//     user_id uuid primary key references auth.users(id),
//     ingredients numeric default 0,
//     labor numeric default 0,
//     rent numeric default 0,
//     utilities numeric default 0,
//     sga numeric default 0,
//     marketing numeric default 0,
//     other numeric default 0,
//     interest numeric default 0,
//     updated_at timestamptz default now()
//   );
//

import Foundation
import Supabase
import BuildUpCore

struct MonthlyCostsDTO: Codable, Sendable {
    let user_id: UUID
    let ingredients: Double
    let labor: Double
    let rent: Double
    let utilities: Double
    let sga: Double
    let marketing: Double
    let other: Double
    let interest: Double

    init(from costs: MonthlyCosts, userId: UUID) {
        self.user_id = userId
        self.ingredients = costs.ingredients
        self.labor = costs.labor
        self.rent = costs.rent
        self.utilities = costs.utilities
        self.sga = costs.sga
        self.marketing = costs.marketing
        self.other = costs.other
        self.interest = costs.interest
    }

    var domain: MonthlyCosts {
        MonthlyCosts(
            ingredients: ingredients,
            labor: labor,
            rent: rent,
            utilities: utilities,
            sga: sga,
            marketing: marketing,
            other: other,
            interest: interest
        )
    }
}

public protocol MonthlyCostsRepositoryProtocol: Sendable {
    func fetch() async throws -> MonthlyCosts
    func upsert(_ costs: MonthlyCosts) async throws
}

// MARK: - Supabase 실제 구현

public actor MonthlyCostsRepository: MonthlyCostsRepositoryProtocol {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    public func fetch() async throws -> MonthlyCosts {
        let userId = try await getUserId()

        let rows: [MonthlyCostsDTO] = try await supabase
            .from("monthly_costs")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        return rows.first?.domain ?? MonthlyCosts()
    }

    public func upsert(_ costs: MonthlyCosts) async throws {
        let userId = try await getUserId()
        let dto = MonthlyCostsDTO(from: costs, userId: userId)

        try await supabase
            .from("monthly_costs")
            .upsert(dto)
            .execute()
    }
}

// MARK: - Mock

public actor MockMonthlyCostsRepository: MonthlyCostsRepositoryProtocol {

    private var current: MonthlyCosts

    public init(initial: MonthlyCosts = MonthlyCosts()) {
        self.current = initial
    }

    public func fetch() async throws -> MonthlyCosts { current }

    public func upsert(_ costs: MonthlyCosts) async throws { current = costs }
}
