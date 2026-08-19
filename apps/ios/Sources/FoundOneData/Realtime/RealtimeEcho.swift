//
//  RealtimeEcho.swift — 자기 쓰기 에코 억제 (2026-08-19)
//
//  RealtimeSyncManager 는 본인 user_id 행 변경을 구독하므로 *이 기기의 upsert* 도 그대로 이벤트로
//  되돌아온다 → refreshAllFromRemote(flush → 재조회 → …) 가 매 저장마다 한 바퀴 더 돈다.
//  각 Repository 는 자기 upsert 직후 `RealtimeEcho.markLocalWrite(table:)` 를 한 줄 호출하고,
//  RealtimeSyncManager 는 같은 테이블 이벤트가 그 시각으로부터 `window`(3s) 안에 도착하면 무시한다.
//
//  ⚠️ 억제는 best-effort — 다른 기기의 변경이 우연히 같은 3초 창에 겹치면 이번 이벤트는 건너뛰지만,
//     포그라운드 복귀 재조회(1단계)와 다음 이벤트가 보완한다. 데이터 손실 경로는 아니다(재조회만 생략).
//

import Foundation

public enum RealtimeEcho {
    /// 자기 쓰기 이후 이 시간 안의 같은 테이블 이벤트는 자기 에코로 간주.
    public static let window: TimeInterval = 3.0

    private static let lock = NSLock()
    nonisolated(unsafe) private static var lastLocalWriteAt: [String: Date] = [:]

    /// Repository 가 자기 upsert/update 직후 호출. Sendable — 어느 actor 에서든 호출 가능.
    public static func markLocalWrite(table: String) {
        lock.lock(); defer { lock.unlock() }
        lastLocalWriteAt[table] = Date()
    }

    /// 이 테이블 이벤트가 방금 전 자기 쓰기의 에코인가.
    public static func isSelfEcho(table: String, now: Date = Date()) -> Bool {
        lock.lock(); defer { lock.unlock() }
        guard let at = lastLocalWriteAt[table] else { return false }
        return now.timeIntervalSince(at) < window
    }

    /// 테스트·계정 전환용 초기화.
    public static func resetForTesting() {
        lock.lock(); defer { lock.unlock() }
        lastLocalWriteAt.removeAll()
    }
}
