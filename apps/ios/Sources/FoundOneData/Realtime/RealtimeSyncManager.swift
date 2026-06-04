//
//  RealtimeSyncManager.swift — 웹·다른 기기 변경을 실시간 수신 (동기화 2단계)
//
//  Supabase Realtime postgres_changes 로 user_store_data / business_profiles 의 본인(user_id)
//  행 변경을 구독한다. 변경 수신 시 직접 payload 를 적용하지 않고 **안전한 재조회(onChange)** 를
//  트리거한다 — flush-우선/key-merge 경로를 재사용해 진행 중 로컬 편집 클로버를 피한다.
//
//  ⚠️ 운영 전제: 이 테이블들이 supabase_realtime publication 에 포함돼야 발화한다
//     (마이그레이션 20260603_000001_realtime_sync_publication.sql + Supabase 대시보드 Realtime 토글).
//     RLS 가 켜져 있어 본인 user_id 행 변경만 수신(안전).
//
//  참고: 대부분의 로드맵 저장도 user_store_data(체크리스트·선택 JSONB)를 건드리므로,
//        이 두 테이블 구독만으로 로드맵 변경까지 폭넓게 커버된다. 순수 stage_decisions 단독
//        변경 엣지는 포그라운드/포커스 재조회(1단계)가 보완한다.
//

import Foundation
import Supabase

public extension Notification.Name {
    /// 원격(웹·다른 기기) 데이터 변경 수신 — AppRoot 가 받아서 안전한 재조회 트리거.
    static let buildupRemoteDataChanged = Notification.Name("buildup.remoteDataChanged")
}

@MainActor
public final class RealtimeSyncManager {
    private let client: SupabaseClient
    private let userId: String

    private var channel: RealtimeChannelV2?
    private var subscriptions: [RealtimeSubscription] = []

    /// 버스트 코얼레싱 — 짧은 시간 다발 이벤트를 한 번의 재조회로 합침.
    private var lastFire = Date.distantPast
    private let minInterval: TimeInterval = 2.0
    private var pending = false

    public init(client: SupabaseClient, userId: String) {
        self.client = client
        self.userId = userId
    }

    /// 변경 신호 — @Sendable 클로저로 @MainActor 스토어를 캡처하지 않도록 NotificationCenter 로 디커플.
    private func emit() {
        NotificationCenter.default.post(name: .buildupRemoteDataChanged, object: nil)
    }

    /// 구독 시작 — onPostgresChange 는 subscribe() 이전에 등록해야 한다(SDK 요구).
    public func start() async {
        guard channel == nil else { return }
        let ch = client.channel("buildup-sync-\(userId)")
        let filter = "user_id=eq.\(userId)"

        // roadmaps 포함 — 로드맵 진행도(stage_decisions)도 즉시 양방향 동기화.
        //   stage_decisions 는 user_id 컬럼이 없어 user_id 필터 구독 불가 → 대신 roadmaps.updated_at 을
        //   양쪽(웹 saveRoadmapState / iOS RoadmapDecisionsRepository.upsert)에서 bump 하여
        //   roadmaps(user_id 필터) 구독 하나로 로드맵 변경을 안전하게 수신.
        for table in ["user_store_data", "business_profiles", "roadmaps"] {
            let sub = ch.onPostgresChange(
                AnyAction.self,
                schema: "public",
                table: table,
                filter: filter
            ) { [weak self] _ in
                guard let self else { return }
                Task { @MainActor in self.scheduleFire() }
            }
            subscriptions.append(sub)
        }

        self.channel = ch
        // subscribe() (deprecated) 는 내부적으로 `try? await subscribeWithError()` 와 동일.
        // 동작 보존 + deprecation 경고 제거를 위해 직접 호출.
        try? await ch.subscribeWithError()
    }

    public func stop() async {
        guard let ch = channel else { return }
        for sub in subscriptions { sub.cancel() }
        subscriptions.removeAll()
        await client.removeChannel(ch)
        channel = nil
    }

    /// 스로틀 — 직전 발화로부터 minInterval 이내면 한 번만 지연 발화로 합침.
    private func scheduleFire() {
        let now = Date()
        let elapsed = now.timeIntervalSince(lastFire)
        if elapsed >= minInterval {
            lastFire = now
            emit()
        } else if !pending {
            pending = true
            let delay = minInterval - elapsed
            Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                guard let self else { return }
                self.pending = false
                self.lastFire = Date()
                self.emit()
            }
        }
    }
}
