//
//  CashflowRepository.swift — user_store_data.cashflow_settings (jsonb) 읽기/쓰기.
//
//  웹 SSOT: apps/web/app/lib/hooks/usePersistence.ts (flushStoreData → r.cashflowSettings).
//  웹과 동일 camelCase JSON 구조로 저장 → 웹·앱 양방향 동기화.
//

import Foundation
import Supabase
import FoundOneCore

public actor CashflowRepository {
    private let supabase: SupabaseClient
    private let userId: UUID

    public init(supabase: SupabaseClient, userId: UUID) {
        self.supabase = supabase
        self.userId = userId
    }

    /// cashflow_settings 로드 — 없거나 '{}' 면 업종 기본 믹스로 채운 미설정 상태 반환.
    public func load(defaultCategoryKey: String?) async throws -> CashflowSettings {
        struct Row: Decodable { let cashflow_settings: CashflowSettings? }
        let rows: [Row] = try await supabase
            .from("user_store_data")
            .select("cashflow_settings")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        var settings = rows.first?.cashflow_settings ?? CashflowSettings()
        // 채널이 비어있으면(미설정) 업종 기본 믹스로 초기값 — 웹 defaultChannelsForIndustry 와 동일.
        if settings.salesChannels.isEmpty {
            settings.salesChannels = Self.defaultChannels(forCategoryKey: defaultCategoryKey)
        }
        return settings
    }

    /// 전체 저장(upsert). setupCompletedAt 가 있으면 "설정 완료" 로 간주.
    public func save(_ settings: CashflowSettings) async throws {
        let payload = Upsert(
            user_id: userId,
            cashflow_settings: settings,
            updated_at: ISO8601DateFormatter().string(from: Date())
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    /// 업종 기본 채널 믹스 — 공유 SSOT(CashflowPresetsRegistry) 에서 빌드.
    public static func defaultChannels(forCategoryKey key: String?) -> [CashflowSalesChannel] {
        CashflowPresetsRegistry.defaultMix(forCategoryKey: key ?? "").map { d in
            CashflowSalesChannel(
                id: d.preset.id,
                label: BULocalizedText(ko: d.preset.labelKo, en: d.preset.labelEn),
                salesRatio: Double(d.salesRatio),
                settlementDays: d.preset.settlementDays,
                commissionRate: d.preset.commissionRate,
                paymentFeeRate: d.preset.paymentFeeRate,
                isActive: true,
                rateNote: (d.preset.rateNoteKo != nil && d.preset.rateNoteEn != nil)
                    ? BULocalizedText(ko: d.preset.rateNoteKo!, en: d.preset.rateNoteEn!) : nil
            )
        }
    }

    /// ② 운영예비 → 현금 잔고 시드 (2026-08-12, budget-setup 커밋 투영 전용).
    ///   **비어 있을 때만** 시드 — 사장님이 현금흐름 설정에서 직접 넣은 잔고를 절대 덮지 않는다.
    ///   웹 handleBudgetContinue 의 시드와 동일 규칙 (양쪽 동시 수정).
    @MainActor
    public static func seedInitialCashIfEmpty(won: Double) {
        guard won > 0, let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = CashflowRepository(supabase: BUSupabase.shared.client, userId: uid)
        Task {
            guard var settings = try? await repo.load(defaultCategoryKey: nil) else { return }
            guard settings.currentBalance <= 0 else { return }   // 이미 값 있음 — 손대지 않는다
            settings.currentBalance = won
            settings.currentBalanceUpdatedAt = ISO8601DateFormatter().string(from: Date())
            try? await repo.save(settings)
        }
    }

    private struct Upsert: Encodable, Sendable {
        let user_id: UUID
        let cashflow_settings: CashflowSettings
        let updated_at: String
    }
}
