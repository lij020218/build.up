//
//  RegistryWarmup.swift — 무거운 번들 JSON 레지스트리 선로딩 (성능 2026-08-19)
//
//  FranchiseBrandRegistry(~1,600 브랜드)·StartupProgramRegistry 등은 `static let` 지연 초기화라
//  첫 접근 시점(= 탭 첫 진입, 메인 스레드)에 디코딩 비용이 몰려 프레임 드롭을 유발했다.
//  앱 시작 직후 백그라운드(.utility)에서 한 번 건드려 캐시를 채운다 — 이후 접근은 즉시.
//  ⚠️ 접근만 하고 아무것도 보관하지 않는다 (SSOT 는 각 레지스트리).
//

import Foundation

public enum RegistryWarmup {

    /// 모든 무거운 레지스트리를 1회 접근해 static 캐시를 채운다. 멱등·스레드 안전(static let).
    ///   FoundOneApp `.task(priority: .utility)` 에서 호출.
    public static func warmAll() {
        _ = FranchiseBrandRegistry.all.count
        _ = StartupProgramRegistry.all.count
        _ = InspirationBrandRegistry.all.count
        _ = MarketDistrictRegistry.all.count
        _ = SpecialtyRegistry.all.count
        _ = BUInspiration.all.count
    }
}
