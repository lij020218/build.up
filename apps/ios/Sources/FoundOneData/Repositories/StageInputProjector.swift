//
//  StageInputProjector.swift — 로드맵 stage 입력 → 정식 user_store_data/business_profiles 컬럼 중앙 투영.
//
//  ⚠️ 재발 방지 레이어. 배경:
//   iOS 는 stage 입력을 두 경로로 저장한다 —
//     (1) RoadmapStore.advanceToNext/saveStageEdit → stage_decisions.inputs JSONB (항상)
//     (2) stage view 가 수동으로 StoreProfileRepository.persist*/OnboardingProfileSync.persist* 호출 →
//         정식 컬럼 (웹이 읽는 SSOT)
//   (2)를 빠뜨리면 값이 stage_decisions 에만 남고 웹·앱 sync 가 깨졌다 (예: StartupTypeStageView 의 startupType).
//   이 projector 가 advanceToNext/saveStageEdit 한 곳에서 (2)를 자동 수행해 수동 누락을 구조적으로 제거한다.
//
//  ⚠️ 호출 위치: RoadmapStore.advanceToNext / saveStageEdit (= 사용자 commit) **에서만**.
//     completeStage/setInput/syncFromRemote 에는 넣지 말 것 — 원격 hydration 중 서버값을 서버로 되쏘는 echo 방지.
//
//  ─ 투영 키 ↔ 정식 컬럼 계약 (신규 투영 필드 추가 시 여기 한 곳만 수정) ─
//   storeName              → user_store_data.store_name              (직접, 빈값/"내 가게" 가드는 헬퍼 내장)
//   openHour + closeHour   → user_store_data.business_open/close_time (Int→"HH:00", 둘 다 있을 때만)
//   startupType            → business_profiles.startup_type          (제공 컬럼만 upsert, 나머지 보존)
//   vatType | taxTypeChoice→ user_store_data.tax_settings.vatType     (JSONB read-merge-write, hasEmployees 보존)
//   cpaDecision            → user_store_data.cpa_decision             (직접, "cpa"|"self" 가드는 헬퍼 내장)
//   revenueModel           → user_store_data.uses_subscriptions       (subscription|freemium|hybrid → true, 웹 usesSubscriptions 미러)
//   preferredRegion        → business_profiles.preferred_regions      ([region] 단일배열, 웹 buildProfilePatchFromState 미러 — iOS 펀딩 지역매칭·웹 region 폼 복원에 사용)
//   capital                → business_profiles.capital                (Int 원 단위, 웹 buildProfilePatchFromState 미러 — 2026-06-10 P0-B)
//
//  로드맵 전용(투영 X, stage_decisions 에만 남음): certType, model, total*, menuCount,
//   suppliers, address(구체 매물 주소 — region 과 별개), northStar, franchiseBrandId(정식 컬럼 부재) 등.
//

import Foundation
import Supabase
import OSLog

private let projLogger = Logger(subsystem: "com.foundone.ios", category: "StageInputProjector")

@MainActor
public enum StageInputProjector {

    /// 투영 대상 키 (project + audit 가 공유 — 드리프트 방지용 단일 목록).
    public static let projectedKeys: Set<String> = [
        "storeName", "openHour", "closeHour", "startupType", "vatType", "taxTypeChoice", "cpaDecision", "revenueModel",
        "preferredRegion", "capital",
    ]

    /// 구독형 수익 모델 (웹 setSelectedRevenueModelId 의 usesSubscriptions 판정과 동일).
    private static let subscriptionRevenueModels: Set<String> = ["subscription", "freemium", "hybrid"]

    /// stage 입력을 정식 컬럼으로 투영. 기존 persist 헬퍼에 위임(새 영속 로직 없음).
    /// 모든 헬퍼는 idempotent upsert + 빈값/형식 가드 내장 → 중복 호출·빈 입력 무해.
    public static func project(_ inputs: [String: String]) {
        // 1. storeName → store_name
        if let v = inputs["storeName"] {
            StoreProfileRepository.persistStoreNameForCurrentUser(v)
        }
        // 2. openHour + closeHour → business_open/close_time (둘 다 정수일 때만)
        if let o = inputs["openHour"], let c = inputs["closeHour"],
           let oh = Int(o), let ch = Int(c) {
            StoreProfileRepository.persistBusinessHoursForCurrentUser(openHour: oh, closeHour: ch)
        }
        // 3. startupType → business_profiles.startup_type (나머지 컬럼 보존: nil 은 encodeIfPresent 로 생략됨)
        if let v = inputs["startupType"], !v.trimmingCharacters(in: .whitespaces).isEmpty {
            OnboardingProfileSync.persistIndustry(categoryId: nil, subIndustryId: nil, startupType: v)
        }
        // 4. vatType (또는 별칭 taxTypeChoice) → tax_settings.vatType
        if let v = inputs["vatType"] ?? inputs["taxTypeChoice"] {
            StoreProfileRepository.persistVatTypeForCurrentUser(v)
        }
        // 5. cpaDecision → cpa_decision
        if let v = inputs["cpaDecision"] {
            StoreProfileRepository.persistCpaDecisionForCurrentUser(v)
        }
        // 6. revenueModel → uses_subscriptions (구독형이면 true → 운영 대시보드 구독관리 카드 게이팅)
        if let v = inputs["revenueModel"], !v.trimmingCharacters(in: .whitespaces).isEmpty {
            StoreProfileRepository.persistUsesSubscriptionsForCurrentUser(subscriptionRevenueModels.contains(v))
        }
        // 7. preferredRegion → business_profiles.preferred_regions (빈값 가드는 헬퍼 내장)
        if let v = inputs["preferredRegion"] {
            OnboardingProfileSync.persistPreferredRegion(v)
        }
        // 8. capital → business_profiles.capital (웹 buildProfilePatchFromState 미러, 0/음수·비정수 가드)
        if let v = inputs["capital"], let won = Int(v), won > 0 {
            OnboardingProfileSync.persistIndustry(categoryId: nil, subIndustryId: nil, capitalKrw: won)
        }
    }

    #if DEBUG
    /// 투영 커버리지 감사 — 완료된 decision 들에서 투영 키에 값이 있는데 정식 컬럼이 비어있으면 경고.
    /// best-effort: 네트워크 오류는 조용히 무시(startup 비차단). RoadmapStore.auditProjectionCoverage 에서 호출.
    public static func audit(mergedInputs: [String: String]) async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let client = BUSupabase.shared.client

        struct StoreRow: Decodable {
            let store_name: String?
            let business_open_time: String?
            let business_close_time: String?
            let cpa_decision: String?
            let tax_settings: StoreProfileRepository.TaxSettingsDTO?
        }
        struct ProfileRow: Decodable { let startup_type: String? }

        let storeRows: [StoreRow] = (try? await client
            .from("user_store_data")
            .select("store_name, business_open_time, business_close_time, cpa_decision, tax_settings")
            .eq("user_id", value: uid).limit(1).execute().value) ?? []
        let store = storeRows.first
        let profileRows: [ProfileRow] = (try? await client
            .from("business_profiles")
            .select("startup_type")
            .eq("user_id", value: uid).limit(1).execute().value) ?? []
        let profile = profileRows.first

        func warn(_ key: String, _ column: String) {
            projLogger.warning("⚠️ 투영 누락 의심 — stage 입력 '\(key, privacy: .public)' 값이 있으나 \(column, privacy: .public) 컬럼이 비어있음. project() 규칙/호출 경로 확인.")
        }
        func has(_ s: String?) -> Bool { (s?.trimmingCharacters(in: .whitespaces).isEmpty == false) }

        if let v = mergedInputs["storeName"], has(v), v != "내 가게", !has(store?.store_name) {
            warn("storeName", "store_name")
        }
        if (mergedInputs["openHour"] != nil || mergedInputs["closeHour"] != nil),
           !has(store?.business_open_time) {
            warn("openHour/closeHour", "business_open_time")
        }
        if let v = mergedInputs["startupType"], has(v), !has(profile?.startup_type) {
            warn("startupType", "business_profiles.startup_type")
        }
        if let v = mergedInputs["cpaDecision"], has(v), !has(store?.cpa_decision) {
            warn("cpaDecision", "cpa_decision")
        }
        // vatType: tax_settings 는 미설정 시 행 자체가 없을 수 있어 "비어있음" 판정이 모호 → 경고 생략(false-positive 방지).
    }
    #endif
}
