//
//  BuildUpApp.swift — App 진입점.
//

import SwiftUI
import BuildUpFeatures

// 카카오 SDK 는 Package 의존성 추가 후 자동 활성화.
#if canImport(KakaoSDKCommon)
import KakaoSDKCommon
import KakaoSDKAuth
#endif

@main
struct BuildUpApp: App {

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
