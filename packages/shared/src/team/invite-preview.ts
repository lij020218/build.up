/**
 * 초대 대상 확인 결과 해석 SSOT — 웹·iOS 가 같은 문구·같은 버튼 상태를 쓴다.
 *
 * 서버: public.preview_invite_target(p_email) (마이그레이션 20260914000001)
 *
 *  왜 SSOT 인가: "초대 가능한가"는 버튼을 누를 수 있는지를 정하는 판정이다.
 *  한쪽 앱만 already_member 를 놓치면 같은 사람에게 초대가 두 번 간다.
 *
 *  ⚠️ 서버는 **가린 이름**만 준다(김*현). 실명은 직원이 수락한 뒤에 보인다.
 *     여기서 원문 이름을 복원하거나 추측하지 않는다.
 */

export type InvitePreviewResult =
  | { ok: true; exists: boolean; masked_name?: string; masked_email: string; already_member: boolean; pending_invite: boolean }
  | { ok: false; reason: InvitePreviewFailure };

export type InvitePreviewFailure =
  | "not-authenticated"
  | "invalid-email"
  | "self"
  | "not-owner"
  | "rate-limited";

export type InvitePreviewTone = "found" | "new" | "blocked" | "error";

export type InvitePreviewView = {
  tone: InvitePreviewTone;
  title: string;
  detail: string;
  /** 초대 버튼을 누를 수 있는가 */
  canInvite: boolean;
};

/** 결과 → 화면 문구. 플랫폼은 이 값을 그리기만 한다. */
export function invitePreviewView(result: InvitePreviewResult, ko: boolean): InvitePreviewView {
  if (!result.ok) {
    switch (result.reason) {
      case "invalid-email":
        return {
          tone: "error", canInvite: false,
          title: ko ? "이메일 형식이 아닙니다" : "Not an email address",
          detail: ko ? "직원이 가입할 때 쓴 이메일을 입력해 주세요." : "Enter the email your staff signed up with.",
        };
      case "self":
        return {
          tone: "error", canInvite: false,
          title: ko ? "본인 계정입니다" : "That's your own account",
          detail: ko ? "직원의 이메일을 입력해 주세요." : "Enter your staff member's email.",
        };
      case "not-owner":
        return {
          tone: "error", canInvite: false,
          title: ko ? "가게 정보가 먼저 필요합니다" : "Set up your store first",
          detail: ko ? "가게를 등록하면 직원을 초대할 수 있습니다." : "Register your store to invite staff.",
        };
      case "rate-limited":
        return {
          tone: "error", canInvite: false,
          title: ko ? "조회 한도를 넘었습니다" : "Too many lookups",
          detail: ko
            ? "한 시간에 20번까지 확인할 수 있습니다. 잠시 후 다시 시도해 주세요."
            : "Up to 20 lookups per hour. Please try again later.",
        };
      default:
        return {
          tone: "error", canInvite: false,
          title: ko ? "로그인이 필요합니다" : "Sign-in required",
          detail: ko ? "다시 로그인한 뒤 시도해 주세요." : "Please sign in and retry.",
        };
    }
  }

  if (result.already_member) {
    return {
      tone: "blocked", canInvite: false,
      title: ko ? "이미 우리 가게 직원입니다" : "Already on your team",
      detail: ko ? "직원 목록에서 근무표와 급여를 관리할 수 있습니다." : "Manage their schedule and pay from the team list.",
    };
  }

  if (result.pending_invite) {
    return {
      tone: "blocked", canInvite: false,
      title: ko ? "이미 보낸 초대가 있습니다" : "Invite already sent",
      detail: ko
        ? "직원이 아직 수락하지 않았습니다. 앱 알림으로 확인해 달라고 전해 주세요."
        : "They haven't accepted yet. Ask them to check their app notifications.",
    };
  }

  if (result.exists) {
    const name = result.masked_name?.trim();
    return {
      tone: "found", canInvite: true,
      title: ko
        ? (name ? `${name} 님 계정을 찾았습니다` : "계정을 찾았습니다")
        : (name ? `Found ${name}` : "Account found"),
      detail: ko
        ? "이름은 일부만 보여 드립니다. 추가를 누르면 직원에게 확인 요청이 가고, 직원이 수락해야 등록됩니다."
        : "Names are partly hidden. Tapping add sends a request — they must accept to join.",
    };
  }

  return {
    tone: "new", canInvite: true,
    title: ko ? "아직 가입하지 않은 이메일입니다" : "No account yet",
    detail: ko
      ? "초대를 보내 두면, 이 이메일로 가입할 때 「받은 초대」에 표시됩니다."
      : "Send it anyway — it appears once they sign up with this email.",
  };
}

/** 서버 응답(jsonb)을 타입으로 좁힌다. 모양이 다르면 null — 추측하지 않는다. */
export function parseInvitePreview(raw: unknown): InvitePreviewResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.ok === false && typeof r.reason === "string") {
    return { ok: false, reason: r.reason as InvitePreviewFailure };
  }
  if (r.ok === true && typeof r.masked_email === "string") {
    return {
      ok: true,
      exists: r.exists === true,
      masked_name: typeof r.masked_name === "string" ? r.masked_name : undefined,
      masked_email: r.masked_email,
      already_member: r.already_member === true,
      pending_invite: r.pending_invite === true,
    };
  }
  return null;
}
