//
//  LocalDataWipe.swift — 로그아웃·계정삭제 시 로컬 UserDefaults 의 모든 *사용자 데이터* 제거.
//
//  왜: signOut/deleteAccount 이 supabase 세션만 정리하고 로컬 캐시를 안 지우면,
//      같은 기기에서 다른 사장님이 로그인했을 때 이전 계정의 로드맵 진행·신용점수(ncbScore)·
//      폐업 고려 여부·상호 등이 그대로 노출된다(cross-account PII 누출).
//
//  웹 SSOT 대응: apps/web/app/lib/hooks/usePersistence.ts
//               clearLocalUserData() + resetLocalState()
//

import Foundation

public enum LocalDataWipe {
    /// 사용자 데이터로 분류되는 UserDefaults 키 prefix 전체.
    ///   - 로드맵/스테이지 @AppStorage 집합은 RoadmapStore.clearAllAppStorage 와 동일하게 유지.
    ///   - "owner." 은 birthYear·ncbScore·consideringClosure·isDisabledOwner (민감 프로필).
    ///   - "foundone." 은 로드맵 decisions/cluster 등 — 로그아웃 시 함께 비운다(재온보딩 허용).
    public static let userDataPrefixes: [String] = [
        "biz.", "bom.", "cd.", "cert.", "construction.", "contract.", "cs.",
        "eda.", "fct.", "fin.", "fr.", "ge.", "gl.", "gtm.", "hiring.", "hp.",
        "insTax.", "lab.", "loan.", "loc.", "mfg.", "mpw.", "mvp.", "om.",
        "ops.", "or2.", "permit.", "pf.", "pi.", "pkg.", "plf.", "prelaunch.",
        "ps.", "regsub.", "roadmap.", "sf.", "src.", "stage.", "sto.",
        "taxGuide.", "vc.", "foundone.",
        "owner.",
        // 전환 funnel 수동 입력(ConversionFunnelFocusCard @AppStorage) + 프로필 알림 토글 (2026-08-19 추가)
        "funnel.commerce.", "funnel.saas.", "profile.notif.",
    ]

    /// 모든 사용자 데이터 키 제거. AuthCoordinator.signOut/deleteAccount 에서 호출.
    public static func wipeAllLocalUserData(_ defaults: UserDefaults = .standard) {
        for key in defaults.dictionaryRepresentation().keys {
            if userDataPrefixes.contains(where: { key.hasPrefix($0) }) {
                defaults.removeObject(forKey: key)
            }
        }
    }
}
