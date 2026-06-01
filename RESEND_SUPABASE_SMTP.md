# Resend → Supabase 커스텀 SMTP 설정 (Found.One 인증 메일)

Found.One 은 Supabase Auth 를 쓰므로, 비밀번호 재설정·가입 확인 메일은 **Supabase 가 발송**합니다.
기본 Supabase SMTP 는 발송량 제한·도착률이 낮으므로, **fieri 에서 쓰던 Resend 계정을 그대로 재사용**해
Supabase 의 커스텀 SMTP 로 연결합니다. (코드 변경 없음 — 대시보드 설정만)

> fieri 참고: `/Users/lij020218/Projects/fieri/src/lib/email.ts` — Resend SDK, FROM `Fi.eri <noreply@fi-eri.com>`.
> Found.One 은 트랜잭션 메일을 직접 보내지 않고 Supabase 가 보내므로 Resend **SDK 가 아니라 SMTP 모드**를 씁니다.

---

## 1단계 — Resend: 발신 도메인 인증

Resend 대시보드(기존 fieri 계정) → **Domains → Add Domain**:
- **권장**: `foundone.dev` 추가 → 안내되는 DNS 레코드(SPF TXT, DKIM CNAME 3개, 선택 DMARC)를 도메인 등록업체(Vercel DNS 등)에 추가 → Verify.
  - 인증 후 발신: `Found.One <noreply@foundone.dev>`
- **임시(즉시 사용)**: 이미 인증된 `fi-eri.com` 으로 발신(`noreply@fi-eri.com`). 도착은 되나 브랜드가 fi-eri 라 권장 안 함 — foundone.dev 인증 전 테스트용.

## 2단계 — Resend: API 키

Resend → **API Keys**. 기존 키 재사용 또는 새 키 발급(권장: Found.One 전용, 권한 "Sending access").
이 키가 곧 SMTP **비밀번호**입니다.

## 3단계 — Supabase: 커스텀 SMTP 등록

Supabase 대시보드 → 프로젝트 → **Authentication → Emails → SMTP Settings** → *Enable Custom SMTP*:

| 항목 | 값 |
|------|-----|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) — 안 되면 `587` (STARTTLS) |
| Username | `resend` |
| Password | `<RESEND_API_KEY>` (2단계 키) |
| Sender email | `noreply@foundone.dev` (1단계 인증 도메인) |
| Sender name | `Found.One` |
| Minimum interval | 기본값 |

저장 → "Send test email" 로 도착 확인.

## 4단계 — Supabase: Redirect URL 허용

**Authentication → URL Configuration → Redirect URLs** 에 아래 포함 확인:
- `https://foundone.dev/auth/callback`  (비번 재설정·가입확인 콜백 — 코드가 `?type=recovery` 로 호출)
- (개발 테스트 시) `http://localhost:3000/auth/callback`

> iOS 비번 재설정도 메일 링크가 `foundone.dev/auth/callback?type=recovery` 로 떨어져 웹에서 새 비번 설정.

## 5단계 — Supabase: 이메일 템플릿 (Found.One 브랜딩)

**Authentication → Emails → Templates** 에서 각 템플릿 HTML 을 교체.
Supabase 템플릿 변수: `{{ .ConfirmationURL }}`, `{{ .Token }}` 등 사용.

### Reset Password (비밀번호 재설정)
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#1E2A55;font-size:26px;margin:0;font-weight:800;letter-spacing:-0.5px;">Found.One</h1>
    <p style="color:#6B7280;margin-top:4px;font-size:13px;">사장님의 창업·운영 파트너</p>
  </div>
  <p style="color:#1F2937;font-size:16px;">비밀번호 재설정을 요청하셨습니다.</p>
  <p style="color:#4B5563;font-size:15px;">아래 버튼을 눌러 새 비밀번호를 설정해 주세요.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="{{ .ConfirmationURL }}" style="background:linear-gradient(135deg,#1E2A55,#2C4F80);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">새 비밀번호 설정</a>
  </div>
  <p style="color:#9CA3AF;font-size:13px;">이 링크는 1시간 동안 유효합니다.</p>
  <p style="color:#9CA3AF;font-size:13px;">본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
</div>
```

### Confirm signup (가입 확인)
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#1E2A55;font-size:26px;margin:0;font-weight:800;letter-spacing:-0.5px;">Found.One</h1>
    <p style="color:#6B7280;margin-top:4px;font-size:13px;">사장님의 창업·운영 파트너</p>
  </div>
  <p style="color:#1F2937;font-size:16px;">가입을 환영합니다!</p>
  <p style="color:#4B5563;font-size:15px;">아래 버튼을 눌러 이메일을 인증하고 시작하세요.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="{{ .ConfirmationURL }}" style="background:linear-gradient(135deg,#1E2A55,#2C4F80);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">이메일 인증</a>
  </div>
  <p style="color:#9CA3AF;font-size:13px;">본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
</div>
```

---

## 체크리스트
- [ ] Resend 에 `foundone.dev` 도메인 인증 (DNS SPF/DKIM)
- [ ] Resend API 키 확보
- [ ] Supabase 커스텀 SMTP = Resend (host/port/user/pass/sender)
- [ ] Redirect URLs 에 `https://foundone.dev/auth/callback` 포함
- [ ] 이메일 템플릿 Found.One 브랜딩 교체 (Reset / Confirm)
- [ ] 테스트: 비밀번호 찾기 → 메일 도착 → 링크 → 새 비번 설정 → 로그인

> 코드 측은 이미 완료(`sendPasswordReset` + `/auth/callback?type=recovery` 새 비번 화면). 위 대시보드 설정만 하면 즉시 동작.
