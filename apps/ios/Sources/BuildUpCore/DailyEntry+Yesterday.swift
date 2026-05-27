//
//  DailyEntry+Yesterday.swift — "어제 매출" 정확히 어제 날짜에 해당하는 entry 만 반환.
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CEOMorningHero.tsx
//    ```
//    const yesterdayIso = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
//    const yesterday = dailyEntries.find((e) => e.date === yesterdayIso)?.sales ?? 0;
//    ```
//
//  ⚠️ 2026-05-25 fix 사장님 신고: 모바일에서 "어제 매출" 칸에 "가장 최근에 입력한 매출"
//     이 표시되는 버그. 예: 어제 미입력 + 3일 전 30만원 입력 → "어제 매출 30만원" 표시.
//
//  버그 원인: `entries.sorted { $0.date < $1.date }.last` 는 "가장 최근 entry" 를 반환할 뿐,
//     "어제 날짜의 entry" 가 아님. 어제 데이터가 없으면 그 entry 자체를 못 가져와야 한다.
//

import Foundation

/// "yyyy-MM-dd" — Asia/Seoul 기준 어제 날짜 문자열.
public enum BUDateKey {
    private static let iso: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// 오늘 날짜 (Asia/Seoul) — "yyyy-MM-dd"
    public static func today(reference: Date = Date()) -> String {
        iso.string(from: reference)
    }

    /// 어제 날짜 (Asia/Seoul) — "yyyy-MM-dd"
    public static func yesterday(reference: Date = Date()) -> String {
        iso.string(from: reference.addingTimeInterval(-86_400))
    }
}

extension Array where Element == DailyEntry {
    /// 어제 (Asia/Seoul) 의 entry 만 반환. 없으면 nil.
    ///   ⚠️ 절대 "가장 최근 entry" 로 fallback 하지 말 것 — 사장님에게 거짓 정보 노출.
    public func yesterdayEntry(reference: Date = Date()) -> DailyEntry? {
        let key = BUDateKey.yesterday(reference: reference)
        return first { $0.date == key }
    }

    /// 어제 entry 의 sales — 없으면 0.
    public func yesterdaySales(reference: Date = Date()) -> Double {
        yesterdayEntry(reference: reference)?.sales ?? 0
    }

    /// 어제 entry 의 customers — 없으면 0.
    public func yesterdayCustomers(reference: Date = Date()) -> Int {
        yesterdayEntry(reference: reference)?.customers ?? 0
    }
}
