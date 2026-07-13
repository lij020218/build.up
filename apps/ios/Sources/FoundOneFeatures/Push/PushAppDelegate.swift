//
//  PushAppDelegate.swift — APNs 원격 푸시 등록 (Phase A, 2026-07-12)
//
//  FoundOneApp 이 @UIApplicationDelegateAdaptor 로 연결.
//  - 앱 시작 시: 알림 권한이 이미 허용돼 있으면 registerForRemoteNotifications
//    (권한 첫 요청 직후 등록은 NotificationPermissionFlow 쪽에서도 호출)
//  - 토큰 수신: hex 변환 → user_push_tokens upsert (PushTokenRepository)
//
//  ⚠️ Xcode 에서 Push Notifications capability + Apple 개발자 콘솔 APNs .p8 키가
//    있어야 실제 토큰이 발급된다. capability 없으면 didFail 로 조용히 끝남(무해)
//    — 코드 선배선, 활성화는 사장님 액션 (LAUNCH_IOS_HANDOFF 참조).
//

#if canImport(UIKit)
import UIKit
import UserNotifications
import FoundOneData

public final class PushAppDelegate: NSObject, UIApplicationDelegate {

    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        Task { @MainActor in
            let settings = await UNUserNotificationCenter.current().notificationSettings()
            if settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional {
                application.registerForRemoteNotifications()
            }
        }
        return true
    }

    public func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        Task { await PushTokenRepository.register(deviceTokenHex: hex) }
    }

    public func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // capability/네트워크 부재 — 로컬 알림은 계속 동작, 원격 푸시만 비활성 (best-effort)
    }
}
#endif
