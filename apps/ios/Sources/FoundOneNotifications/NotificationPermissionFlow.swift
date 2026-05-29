//
//  NotificationPermissionFlow.swift — 가치 제안 + 권한 요청 UX
//
//  Apple HIG: 권한 요청 다이얼로그를 그냥 띄우면 거부율 ↑. 가치 먼저 제안 → 동의 후 호출.
//  본 컴포넌트는 SwiftUI sheet 로 띄우는 onboarding 단계 (Phase C 의 Today 진입 전).
//

import SwiftUI

@MainActor
@Observable
public final class NotificationPermissionFlow {

    public enum Status: Sendable {
        case unknown
        case requesting
        case granted
        case denied
    }

    public private(set) var status: Status = .unknown

    public init() {}

    public func refresh() async {
        let granted = await NotificationScheduler.shared.authorizationStatus()
        status = granted ? .granted : .denied
    }

    public func requestAndSchedule() async {
        status = .requesting
        let granted = await NotificationScheduler.shared.requestAuthorization()
        if granted {
            // 권한 받자마자 모닝 브리핑 1회 스케줄.
            await NotificationScheduler.shared.scheduleMorningBrief()
            status = .granted
        } else {
            status = .denied
        }
    }
}
