//
//  StoreInfoValidators.swift — 입력 검증 + 자동 보정 helper
//
//  ⚠️ 웹 SSOT 와 검증 규칙 일치:
//   • 사업자등록번호: 한국 표준 체크섬 알고리즘
//     (가중치 [1,3,7,1,3,7,1,3,5] + d[8]×5/10 보정)
//   • 전화: 9~11자리 디지트, 첫 자리 0
//   • URL: scheme 자동 보정 (사용자 친화)
//
//  ValidationResult 3-state:
//   • .valid    — 통과
//   • .pending  — 입력 중 (UI 에러 표시 X)
//   • .invalid  — 차단 + 명확한 메시지
//

import Foundation

// MARK: - ValidationResult

public enum ValidationResult: Sendable, Equatable {
    case valid
    case pending
    case invalid(message: String)

    public var isValid: Bool { self == .valid }
    public var errorMessage: String? {
        if case .invalid(let m) = self { return m }
        return nil
    }
}

// MARK: - Validators

public enum StoreInfoValidators {

    // MARK: 종합 — FieldSpec 기반

    /// FieldSpec 의 type/key/optional 을 종합해 검증.
    /// 빈 값: optional ? .valid : .invalid("필수 항목")
    /// 입력 중인 부분 입력 (예: 사업자번호 5자리): .pending — UI 가 에러 표시 안 함
    public static func validate(_ value: FieldValue, field: FieldSpec) -> ValidationResult {
        // 빈 값 처리
        if value.isEmpty {
            return field.optional ? .valid : .invalid(message: "필수 항목입니다")
        }

        // 타입 + 키 별 검증
        switch field.type {
        case .phone:
            return validatePhone(value.textValue)

        case .url:
            return validateUrl(value.textValue)

        case .email:
            return validateEmail(value.textValue)

        case .date:
            return validateISODate(value.dateValue ?? value.textValue)

        case .number, .won, .percent:
            return validateNumber(value, field: field)

        case .text, .textarea:
            // 키 기반 추가 검증 (사업자등록번호 등 특수 텍스트)
            return validateTextByKey(value.textValue, key: field.key)

        case .time:
            return validateTime(value.textValue)

        case .select, .multiselect:
            // 빈 처리 후 도착한 select 는 값이 있으므로 valid.
            // (옵션 목록 외 값은 schema 변경 시점 데이터라 차단 X — graceful display)
            return .valid
        }
    }

    // MARK: 개별 검증

    /// 사업자등록번호 — 10자리 + 한국 표준 체크섬.
    /// 10자리 미만 입력 → .pending (사용자가 타이핑 중).
    /// 10자리인데 체크섬 fail → .invalid.
    public static func isValidBusinessNumber(_ raw: String) -> Bool {
        let digits = raw.filter { $0.isNumber }.compactMap { Int(String($0)) }
        guard digits.count == 10 else { return false }
        let weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
        var sum = 0
        for i in 0..<9 { sum += digits[i] * weights[i] }
        sum += (digits[8] * 5) / 10
        let check = (10 - (sum % 10)) % 10
        return check == digits[9]
    }

    public static func isValidPhone(_ raw: String) -> Bool {
        let digits = raw.filter { $0.isNumber }
        guard digits.count >= 9 && digits.count <= 11 else { return false }
        return digits.hasPrefix("0")
    }

    public static func isValidUrl(_ raw: String) -> Bool {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        // 자동 보정 후 URL 로 파싱 가능한지
        let normalized = ensureUrlScheme(trimmed)
        guard let url = URL(string: normalized),
              let host = url.host,
              host.contains(".") else { return false }
        return true
    }

    public static func isValidEmail(_ raw: String) -> Bool {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        // 약식 RFC: local@domain.tld
        let pattern = #"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"#
        return trimmed.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
    }

    public static func isValidISODate(_ raw: String) -> Bool {
        guard !raw.isEmpty else { return false }
        return isoDateFormatter.date(from: raw) != nil
    }

    public static func isValidTime(_ raw: String) -> Bool {
        // HH:MM (24h), HH:MM–HH:MM, HH:MM-HH:MM 모두 허용
        let pattern = #"^\d{1,2}:\d{2}(\s*[–-]\s*\d{1,2}:\d{2})?$"#
        return raw.range(of: pattern, options: .regularExpression) != nil
    }

    // MARK: 자동 보정 (입력 UX)

    /// "naver.com" → "https://naver.com" / "http://x.com" 은 유지.
    public static func ensureUrlScheme(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }
        if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
            return trimmed
        }
        return "https://" + trimmed
    }

    /// 디지트만 추출 (붙여넣기 시 공백·하이픈 제거).
    public static func digitsOnly(_ raw: String) -> String {
        raw.filter { $0.isNumber }
    }

    // MARK: 내부 helper

    private static func validatePhone(_ raw: String) -> ValidationResult {
        let digits = raw.filter { $0.isNumber }
        if digits.isEmpty { return .invalid(message: "전화번호를 입력해주세요") }
        if digits.count < 9 { return .pending }            // 타이핑 중
        if digits.count > 11 { return .invalid(message: "전화번호 자릿수 확인") }
        if !digits.hasPrefix("0") {
            return .invalid(message: "0으로 시작해야 합니다 (예: 010-...)")
        }
        return .valid
    }

    private static func validateUrl(_ raw: String) -> ValidationResult {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return .invalid(message: "URL 을 입력해주세요") }
        // 도메인 형식이 아예 안 갖춰진 입력은 pending
        if !trimmed.contains(".") { return .pending }
        return isValidUrl(trimmed) ? .valid : .invalid(message: "URL 형식 확인 (예: https://...)")
    }

    private static func validateEmail(_ raw: String) -> ValidationResult {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return .invalid(message: "이메일을 입력해주세요") }
        if !trimmed.contains("@") { return .pending }
        return isValidEmail(trimmed) ? .valid : .invalid(message: "이메일 형식 확인")
    }

    private static func validateISODate(_ raw: String) -> ValidationResult {
        if raw.isEmpty { return .invalid(message: "날짜를 선택해주세요") }
        return isValidISODate(raw) ? .valid : .invalid(message: "날짜 형식 오류")
    }

    private static func validateNumber(_ value: FieldValue, field: FieldSpec) -> ValidationResult {
        guard case .number(let n) = value, let n else {
            return .invalid(message: "숫자를 입력해주세요")
        }
        // 금액 (Krw 키 suffix) — 음수 차단
        if field.key.hasSuffix("Krw") && n < 0 {
            return .invalid(message: "금액은 0 이상")
        }
        // percent — 0~100
        if field.type == .percent && (n < 0 || n > 100) {
            return .invalid(message: "0~100 사이 값")
        }
        return .valid
    }

    private static func validateTextByKey(_ raw: String, key: String) -> ValidationResult {
        switch key {
        case "bizRegistrationNumber":
            let digits = raw.filter { $0.isNumber }
            if digits.count < 10 { return .pending }
            return isValidBusinessNumber(raw)
                ? .valid
                : .invalid(message: "사업자등록번호 확인 (검증 실패)")
        case "industryCode":
            let digits = raw.filter { $0.isNumber }
            if digits.isEmpty { return .invalid(message: "업종코드 입력") }
            if digits.count < 5 { return .pending }
            return digits.count == 6 ? .valid : .invalid(message: "6자리 업종코드 확인")
        default:
            return .valid
        }
    }

    private static func validateTime(_ raw: String) -> ValidationResult {
        if raw.isEmpty { return .invalid(message: "시간 입력") }
        return isValidTime(raw) ? .valid : .invalid(message: "형식 확인 (예: 15:00 또는 15:00-17:00)")
    }

    private static let isoDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
}
