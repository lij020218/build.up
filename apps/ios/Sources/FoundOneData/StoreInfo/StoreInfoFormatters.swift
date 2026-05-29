//
//  StoreInfoFormatters.swift — KRW · 전화 · 사업자번호 · 날짜 표시 포맷터
//
//  ⚠️ 웹 SSOT 미러 시 자료 표기 일관성:
//   • formatKRW (web) ↔ krwAdaptive (iOS) — 단위 적응형 (억/만/원)
//   • 한국식 날짜 표기 (yyyy년 M월 d일)
//   • 전화·사업자번호 자동 하이픈
//
//  설계 원칙:
//   • DateFormatter / NumberFormatter 는 static let 캐시 (매 호출 생성 비용 회피)
//   • Locale 명시 (ko_KR for display, en_US_POSIX for ISO parsing)
//   • 잘못된 입력은 원본 그대로 — 사용자가 타이핑 중일 가능성
//   • 음수·0 도 명확히 표시 (잔고 0 = "0원", 손실 = "-5만")
//

import Foundation

public enum StoreInfoFormatters {

    // MARK: - KRW

    /// 적응형 단위 표시: 1억 / 1.5억 / 3000만 / 5,678원.
    /// Hero metric, section preview, 매출 카드 등에 사용.
    public static func krwAdaptive(_ won: Double) -> String {
        let abs = Swift.abs(won)
        let sign = won < 0 ? "-" : ""

        if abs >= 100_000_000 {
            let eok = abs / 100_000_000
            if eok == eok.rounded() {
                return "\(sign)\(Int(eok))억"
            }
            return "\(sign)\(String(format: "%.1f", eok))억"
        }
        if abs >= 10_000 {
            let man = abs / 10_000
            if man == man.rounded() {
                return "\(sign)\(commaInt(Int(man)))만"
            }
            return "\(sign)\(String(format: "%.1f", man))만"
        }
        return "\(sign)\(commaInt(Int(abs)))원"
    }

    /// 정확한 원 표시: "1,234,567원". 영수증, 총액, 입력 직후 확인용.
    public static func krwExact(_ won: Double) -> String {
        commaInt(Int(won)) + "원"
    }

    /// 만원 단위 정수 표시: "1,200만" — 비교 막대, 평균 비교 등 만원 단위 입력 화면용.
    public static func krwInManwon(_ won: Double) -> String {
        let man = Int((won / 10_000).rounded())
        return commaInt(man) + "만원"
    }

    // MARK: - Phone

    /// "01012345678" → "010-1234-5678"
    /// "0212345678"  → "02-1234-5678"
    /// "025671234"   → "02-567-1234"   (서울 9자리 옛 번호)
    /// "0316547823"  → "031-654-7823"  (지역 10자리)
    /// 그 외 (입력 중 등) → 원본 반환.
    public static func phone(_ raw: String) -> String {
        let digits = raw.filter { $0.isNumber }
        guard !digits.isEmpty else { return "" }

        switch digits.count {
        case 11:
            // 010-XXXX-XXXX
            return parts(digits, 3, 4, 4)
        case 10:
            if digits.hasPrefix("02") {
                return parts(digits, 2, 4, 4)            // 02-XXXX-XXXX
            }
            return parts(digits, 3, 3, 4)                // 0XX-XXX-XXXX (지역)
        case 9:
            if digits.hasPrefix("02") {
                return parts(digits, 2, 3, 4)            // 02-XXX-XXXX (옛 서울)
            }
            return raw
        default:
            return raw
        }
    }

    /// 디지트 문자열을 a / b / c 길이로 잘라 하이픈 연결.
    /// a + b + c 가 s.count 와 일치하지 않으면 nil → 호출 측에서 fallback.
    private static func parts(_ s: String, _ a: Int, _ b: Int, _ c: Int) -> String {
        guard s.count == a + b + c else { return s }
        let i1 = s.index(s.startIndex, offsetBy: a)
        let i2 = s.index(i1, offsetBy: b)
        let i3 = s.index(i2, offsetBy: c)
        return "\(s[s.startIndex..<i1])-\(s[i1..<i2])-\(s[i2..<i3])"
    }

    // MARK: - Business number

    /// 사업자등록번호: "1234567890" → "123-45-67890". 10자리 아니면 원본.
    public static func businessNumber(_ raw: String) -> String {
        let d = raw.filter { $0.isNumber }
        guard d.count == 10 else { return raw }
        let i1 = d.index(d.startIndex, offsetBy: 3)
        let i2 = d.index(i1, offsetBy: 2)
        return "\(d[d.startIndex..<i1])-\(d[i1..<i2])-\(d[i2...])"
    }

    // MARK: - Date

    /// "2026-05-15" → "2026년 5월 15일". 잘못된 입력은 원본.
    public static func dateKorean(_ iso: String) -> String {
        guard let d = isoFormatter.date(from: iso) else { return iso }
        return koreanLongFormatter.string(from: d)
    }

    /// "2026-05-15" → "5월 15일". 공간이 좁은 곳.
    public static func dateShort(_ iso: String) -> String {
        guard let d = isoFormatter.date(from: iso) else { return iso }
        return koreanShortFormatter.string(from: d)
    }

    /// "2026-05-15" → "2026. 5. 15.". 표·리스트 정렬용.
    public static func dateDotted(_ iso: String) -> String {
        guard let d = isoFormatter.date(from: iso) else { return iso }
        return dottedFormatter.string(from: d)
    }

    /// "오늘" / "내일" / "어제" / "3일 후" / "2주 전" / "5개월 후" / "1년 전".
    /// D-Day pill, 만료 임박 알림 등.
    public static func relativeDate(_ iso: String, from reference: Date = Date()) -> String {
        guard let target = isoFormatter.date(from: iso) else { return iso }
        let cal = Calendar(identifier: .gregorian)
        let refDay = cal.startOfDay(for: reference)
        let targDay = cal.startOfDay(for: target)
        let days = cal.dateComponents([.day], from: refDay, to: targDay).day ?? 0

        switch days {
        case 0:            return "오늘"
        case 1:            return "내일"
        case -1:           return "어제"
        case 2...6:        return "\(days)일 후"
        case -6...(-2):    return "\(-days)일 전"
        case 7...29:       return "\(days / 7)주 후"
        case -29...(-7):   return "\(-days / 7)주 전"
        case 30...364:     return "\(days / 30)개월 후"
        case -364...(-30): return "\(-days / 30)개월 전"
        case 365...:       return "\(days / 365)년 후"
        case ...(-365):    return "\(-days / 365)년 전"
        default:           return iso
        }
    }

    /// expiresAt 기준 임박도 카테고리. UI 배지 색·dot 결정에 사용.
    /// .overdue (이미 만료) / .urgent (7일 이내) / .soon (30일 이내) / .later (그 외) / .none (날짜 없음)
    public enum ExpiryUrgency: Sendable {
        case overdue, urgent, soon, later, none
    }

    public static func expiryUrgency(_ iso: String?, from reference: Date = Date()) -> ExpiryUrgency {
        guard let iso, let target = isoFormatter.date(from: iso) else { return .none }
        let cal = Calendar(identifier: .gregorian)
        let days = cal.dateComponents([.day],
                                      from: cal.startOfDay(for: reference),
                                      to: cal.startOfDay(for: target)).day ?? 0
        if days < 0 { return .overdue }
        if days <= 7 { return .urgent }
        if days <= 30 { return .soon }
        return .later
    }

    // MARK: - Helpers

    private static func commaInt(_ n: Int) -> String {
        commaFormatter.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    private static let commaFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f
    }()

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()

    private static let koreanLongFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy년 M월 d일"
        f.locale = Locale(identifier: "ko_KR")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()

    private static let koreanShortFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "M월 d일"
        f.locale = Locale(identifier: "ko_KR")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()

    private static let dottedFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy. M. d."
        f.locale = Locale(identifier: "ko_KR")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
}
