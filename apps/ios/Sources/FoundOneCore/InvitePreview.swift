//
//  InvitePreview.swift — 초대 대상 확인 결과 해석 SSOT (iOS)
//
//  웹 미러: packages/shared/src/team/invite-preview.ts
//   (동기화 가드: apps/web/__tests__/invite-preview-ios-sync.test.ts)
//  서버: public.preview_invite_target(p_email) — 마이그레이션 20260914000001
//
//  왜 SSOT 인가: "초대 가능한가"는 버튼을 누를 수 있는지를 정하는 판정이다.
//  한쪽 앱만 alreadyMember 를 놓치면 같은 사람에게 초대가 두 번 간다.
//
//  ⚠️ 서버는 **가린 이름**만 준다(김*현). 실명은 직원이 수락한 뒤에 보인다.
//     여기서 원문 이름을 복원하거나 추측하지 않는다.
//

import Foundation

public enum BUInvitePreviewFailure: String, Sendable, Equatable {
    case notAuthenticated = "not-authenticated"
    case invalidEmail     = "invalid-email"
    case selfAccount      = "self"
    case notOwner         = "not-owner"
    case rateLimited      = "rate-limited"
}

public enum BUInvitePreviewResult: Sendable, Equatable {
    case found(maskedName: String?, maskedEmail: String, alreadyMember: Bool, pendingInvite: Bool)
    case notRegistered(maskedEmail: String, pendingInvite: Bool)
    case failure(BUInvitePreviewFailure)
}

public enum BUInvitePreviewTone: String, Sendable, Equatable {
    case found, new, blocked, error
}

public struct BUInvitePreviewView: Sendable, Equatable {
    public let tone: BUInvitePreviewTone
    public let title: String
    public let detail: String
    /// 초대 버튼을 누를 수 있는가
    public let canInvite: Bool
}

public enum BUInvitePreview {

    /// 결과 → 화면 문구. 화면은 이 값을 그리기만 한다.
    public static func view(_ result: BUInvitePreviewResult) -> BUInvitePreviewView {
        switch result {
        case .failure(let reason):
            switch reason {
            case .invalidEmail:
                return .init(tone: .error, title: "이메일 형식이 아닙니다",
                             detail: "직원이 가입할 때 쓴 이메일을 입력해 주세요.", canInvite: false)
            case .selfAccount:
                return .init(tone: .error, title: "본인 계정입니다",
                             detail: "직원의 이메일을 입력해 주세요.", canInvite: false)
            case .notOwner:
                return .init(tone: .error, title: "가게 정보가 먼저 필요합니다",
                             detail: "가게를 등록하면 직원을 초대할 수 있습니다.", canInvite: false)
            case .rateLimited:
                return .init(tone: .error, title: "조회 한도를 넘었습니다",
                             detail: "한 시간에 20번까지 확인할 수 있습니다. 잠시 후 다시 시도해 주세요.", canInvite: false)
            case .notAuthenticated:
                return .init(tone: .error, title: "로그인이 필요합니다",
                             detail: "다시 로그인한 뒤 시도해 주세요.", canInvite: false)
            }

        case .found(let maskedName, _, let alreadyMember, let pendingInvite):
            if alreadyMember {
                return .init(tone: .blocked, title: "이미 우리 가게 직원입니다",
                             detail: "직원 목록에서 근무표와 급여를 관리할 수 있습니다.", canInvite: false)
            }
            if pendingInvite {
                return .init(tone: .blocked, title: "이미 보낸 초대가 있습니다",
                             detail: "직원이 아직 수락하지 않았습니다. 앱 알림으로 확인해 달라고 전해 주세요.", canInvite: false)
            }
            let name = maskedName?.trimmingCharacters(in: .whitespaces)
            let title = (name?.isEmpty == false) ? "\(name!) 님 계정을 찾았습니다" : "계정을 찾았습니다"
            return .init(tone: .found, title: title,
                         detail: "이름은 일부만 보여 드립니다. 추가를 누르면 직원에게 확인 요청이 가고, 직원이 수락해야 등록됩니다.",
                         canInvite: true)

        case .notRegistered(_, let pendingInvite):
            if pendingInvite {
                return .init(tone: .blocked, title: "이미 보낸 초대가 있습니다",
                             detail: "직원이 아직 수락하지 않았습니다. 앱 알림으로 확인해 달라고 전해 주세요.", canInvite: false)
            }
            return .init(tone: .new, title: "아직 가입하지 않은 이메일입니다",
                         detail: "초대를 보내 두면, 이 이메일로 가입할 때 「받은 초대」에 표시됩니다.", canInvite: true)
        }
    }

    /// 서버 응답(jsonb) → 결과. 모양이 다르면 nil — 추측하지 않는다.
    public static func parse(_ raw: [String: Any]) -> BUInvitePreviewResult? {
        if raw["ok"] as? Bool == false {
            guard let reason = raw["reason"] as? String,
                  let f = BUInvitePreviewFailure(rawValue: reason) else { return nil }
            return .failure(f)
        }
        guard raw["ok"] as? Bool == true, let email = raw["masked_email"] as? String else { return nil }
        let pending = raw["pending_invite"] as? Bool ?? false
        if raw["exists"] as? Bool == true {
            return .found(
                maskedName: raw["masked_name"] as? String,
                maskedEmail: email,
                alreadyMember: raw["already_member"] as? Bool ?? false,
                pendingInvite: pending
            )
        }
        return .notRegistered(maskedEmail: email, pendingInvite: pending)
    }
}
