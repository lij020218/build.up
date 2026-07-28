import Foundation
import Supabase

/// 화면 방문 계측 — `record_surface_visit` RPC 일 카운터.
/// 웹 미러: apps/web/app/lib/surface-visit.ts (동일 RPC·동일 슬러그·동일 KST 일 데둡).
///
///  · 로그인 세션이 있을 때만 (미로그인·데모 렌더는 기록 안 함)
///  · 같은 화면은 KST 하루 1회만 전송 (UserDefaults 데둡 — 지표 = 방문일 기준)
///  · 서버 RPC 가 화이트리스트·본인(auth.uid()) 검증을 다시 하므로 클라이언트는 best-effort
///  · 계측 실패는 조용히 무시 — 앱 동작에 절대 영향 없음
public enum SurfaceVisitRecorder {
    private static let dedupePrefix = "fo_sv"

    public static func record(_ surface: String) {
        Task {
            guard let session = await BUSupabase.shared.currentSession else { return }
            let uid = session.user.id.uuidString
            let today = kstDateString()
            let key = "\(dedupePrefix):\(uid):\(surface):\(today)"
            let defaults = UserDefaults.standard
            guard defaults.string(forKey: key) == nil else { return }
            evictStaleKeys(today: today, defaults: defaults)
            defaults.set("1", forKey: key)

            struct Params: Encodable { let p_surface: String }
            _ = try? await BUSupabase.shared.client
                .rpc("record_surface_visit", params: Params(p_surface: surface))
                .execute()
        }
    }

    private static func kstDateString(now: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let c = calendar.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// 오늘이 아닌 데둡 키 정리 (하루 최대 탭 수만큼이라 비용 미미)
    private static func evictStaleKeys(today: String, defaults: UserDefaults) {
        for key in defaults.dictionaryRepresentation().keys
        where key.hasPrefix(dedupePrefix) && !key.hasSuffix(today) {
            defaults.removeObject(forKey: key)
        }
    }
}
