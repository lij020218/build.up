//
//  ResetCoordinator.swift — "진행 초기화" 풀스크린 오버레이 상태 + 진행률.
//
//  웹 SSOT: apps/web/app/lib/components/reset/ResetAnimationOverlay.tsx
//           apps/web/app/lib/hooks/useSelectionHandlers.ts (resetDemo)
//
//  사용:
//    1. AppRoot 가 @State 로 보유 + .environment 로 주입
//    2. ProfileView 가 @Environment(ResetCoordinator.self) 로 받아 트리거
//    3. AppRoot.body 가 isResetting 일 때 ResetAnimationOverlay 표시
//    4. 오버레이가 표시되는 동안 store.resetAll() + clearAllAppStorage() 가 호출되어
//       AppRoot 가 자동으로 MainTabs → OnboardingFlow 로 전환됨 (오버레이가 가려줌)
//

import Foundation
import Observation

@MainActor
@Observable
public final class ResetCoordinator {
    public var isResetting: Bool = false
    /// 0.0 ~ 1.0
    public var progress: Double = 0

    public init() {}

    public func start() {
        progress = 0
        isResetting = true
    }

    public func setProgress(_ value: Double) {
        progress = max(0, min(1, value))
    }

    public func finish() {
        progress = 1
        // 완료 표시를 잠시 유지 후 오버레이 사라짐 — 호출자가 sleep 후 stop() 호출
    }

    public func stop() {
        isResetting = false
        progress = 0
    }
}
