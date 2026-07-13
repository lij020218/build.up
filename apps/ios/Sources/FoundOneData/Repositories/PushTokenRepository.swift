//
//  PushTokenRepository.swift — APNs device token 등록 (Phase A, 2026-07-12)
//
//  didRegisterForRemoteNotificationsWithDeviceToken 에서 받은 토큰을
//  user_push_tokens 에 upsert. 발송은 서버(pg_net 트리거 → /api/push/dispatch)가 담당.
//  백엔드: 마이그레이션 20260712_000002 (RLS: 본인 행만).
//

import Foundation
import Supabase

public enum PushTokenRepository {

    /// APNs device token(hex) 등록 — 로그인 상태에서만 유효 (미로그인 시 조용히 무시).
    public static func register(deviceTokenHex: String) async {
        struct TokenUpsert: Encodable {
            let user_id: UUID
            let platform: String
            let token: String
        }
        guard let session = try? await BUSupabase.shared.client.auth.session else { return }
        let dto = TokenUpsert(user_id: session.user.id, platform: "ios", token: deviceTokenHex)
        do {
            try await BUSupabase.shared.client
                .from("user_push_tokens")
                .upsert(dto, onConflict: "user_id,platform,token")
                .execute()
        } catch {
            // 마이그레이션 미적용 환경 등 — best-effort (다음 실행에서 재시도됨)
        }
    }
}
