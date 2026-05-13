//
//  MonthlyCostsRepository.swift — 월 비용 구조 CRUD
//
//  ⚠️ 웹 SSOT: user_store_data 테이블의 `monthly_costs` JSON 컬럼.
//   웹 packages/shared/src/supabase/store-data.ts 와 호환.
//

import Foundation
import Supabase
import BuildUpCore

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

        let rows: [StoreDataReadDTO] = try await supabase
            .from("user_store_data")
            .select("monthly_costs")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        return rows.first?.monthly_costs?.toDomain() ?? MonthlyCosts()
    }

    public func upsert(_ costs: MonthlyCosts) async throws {
        let userId = try await getUserId()
        try await supabase
            .from("user_store_data")
            .upsert(
                StoreDataWriteDTO(
                    user_id: userId,
                    monthly_costs: MonthlyCostsJSON(from: costs),
                    updated_at: ISO8601DateFormatter().string(from: Date())
                ),
                onConflict: "user_id"
            )
            .execute()
    }
}

// MARK: - DTOs

private struct StoreDataReadDTO: Decodable {
    let monthly_costs: MonthlyCostsJSON?
}

private struct StoreDataWriteDTO: Encodable {
    let user_id: UUID
    let monthly_costs: MonthlyCostsJSON
    let updated_at: String
}

private struct MonthlyCostsJSON: Codable {
    let ingredients: Double?
    let labor: Double?
    let rent: Double?
    let utilities: Double?
    let sga: Double?
    let marketing: Double?
    let other: Double?
    let interest: Double?

    init(from costs: MonthlyCosts) {
        self.ingredients = costs.ingredients
        self.labor = costs.labor
        self.rent = costs.rent
        self.utilities = costs.utilities
        self.sga = costs.sga
        self.marketing = costs.marketing
        self.other = costs.other
        self.interest = costs.interest
    }

    func toDomain() -> MonthlyCosts {
        MonthlyCosts(
            ingredients: ingredients ?? 0,
            labor: labor ?? 0,
            rent: rent ?? 0,
            utilities: utilities ?? 0,
            sga: sga ?? 0,
            marketing: marketing ?? 0,
            other: other ?? 0,
            interest: interest ?? 0
        )
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
