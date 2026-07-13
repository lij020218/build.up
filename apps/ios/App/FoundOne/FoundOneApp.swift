//
//  FoundOneApp.swift — App 진입점.
//

import SwiftUI
import FoundOneFeatures

// 카카오 SDK 는 Package 의존성 추가 후 자동 활성화.
#if canImport(KakaoSDKCommon)
import KakaoSDKCommon
import KakaoSDKAuth
#endif

@main
struct FoundOneApp: App {

    // APNs 원격 푸시 등록 (2026-07-12) — 토큰 수신 → user_push_tokens upsert.
    @UIApplicationDelegateAdaptor(PushAppDelegate.self) private var pushDelegate

    init() {
        #if canImport(KakaoSDKCommon)
        if let key = Bundle.main.infoDictionary?["KAKAO_NATIVE_APP_KEY"] as? String,
           !key.isEmpty,
           !key.contains("REPLACE_WITH") {
            KakaoSDK.initSDK(appKey: key)
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            AppRoot()
                #if canImport(KakaoSDKAuth)
                .onOpenURL { url in
                    if AuthApi.isKakaoTalkLoginUrl(url) {
                        _ = AuthController.handleOpenUrl(url: url)
                    }
                }
                #endif
        }
    }
}
