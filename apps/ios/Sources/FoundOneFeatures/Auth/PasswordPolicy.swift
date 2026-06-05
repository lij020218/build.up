//
//  PasswordPolicy.swift — 비밀번호 정책 (웹 SSOT 미러)
//
//  웹 SSOT: packages/shared/src/supabase/auth.ts `validatePassword`
//    8자 이상 + 영문 1개 + 숫자 1개 + 흔한 비밀번호 제외.
//  ⚠️ 웹과 규칙이 달라지면 안 됨 — 양쪽 동시 수정.
//

import Foundation

enum PasswordPolicy {

    /// 웹 COMMON_PASSWORDS 와 동일 (소문자 비교).
    private static let common: Set<String> = [
        "password", "password1", "password123", "12345678", "123456789", "1234567890",
        "qwerty123", "qwertyui", "11111111", "00000000", "abcd1234", "asdf1234",
        "iloveyou", "admin123", "welcome1", "letmein1", "1q2w3e4r", "zxcvbnm1",
    ]

    /// 정책 통과 여부 (UI 게이팅용).
    static func isStrong(_ password: String) -> Bool {
        validate(password) == nil
    }

    /// 통과 시 nil, 실패 시 사용자 메시지 (웹 validatePassword 반환값과 동일 의미).
    static func validate(_ password: String) -> String? {
        if password.count < 8 { return "비밀번호는 8자 이상이어야 합니다." }
        if password.range(of: #"[A-Za-z]"#, options: .regularExpression) == nil {
            return "비밀번호에 영문자를 1개 이상 포함해야 합니다."
        }
        if password.range(of: #"[0-9]"#, options: .regularExpression) == nil {
            return "비밀번호에 숫자를 1개 이상 포함해야 합니다."
        }
        if common.contains(password.lowercased()) {
            return "너무 흔한 비밀번호입니다. 추측하기 어려운 비밀번호를 사용해 주세요."
        }
        return nil
    }
}
