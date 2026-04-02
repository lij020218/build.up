// ─── 보안 기반 체크리스트 (스타트업 필수 51항목) ────────────────────────

export type SecurityCategory =
  | "access_control"
  | "data_protection"
  | "infrastructure"
  | "code_security"
  | "compliance"
  | "incident_response"
  | "vendor_management"
  | "employee_security";

export type SecurityPriority = "critical" | "high" | "medium" | "low";

export type SecurityCheckItem = {
  id: string;
  category: SecurityCategory;
  priority: SecurityPriority;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  howTo: { ko: string; en: string };
  estimatedMinutes: number;
  toolSuggestion?: string;
  forB2B: boolean;
  forSaaS: boolean;
  requiredForSOC2: boolean;
  requiredForISMS: boolean;
};

export const SECURITY_CATEGORIES: Array<{ id: SecurityCategory; label: { ko: string; en: string }; color: string; icon: string }> = [
  { id: "access_control", label: { ko: "접근 제어", en: "Access Control" }, color: "#dc2626", icon: "🔐" },
  { id: "data_protection", label: { ko: "데이터 보호", en: "Data Protection" }, color: "#d97706", icon: "🛡️" },
  { id: "infrastructure", label: { ko: "인프라 보안", en: "Infrastructure" }, color: "#2563eb", icon: "☁️" },
  { id: "code_security", label: { ko: "코드 보안", en: "Code Security" }, color: "#7c3aed", icon: "💻" },
  { id: "compliance", label: { ko: "규정 준수", en: "Compliance" }, color: "#059669", icon: "📋" },
  { id: "incident_response", label: { ko: "사고 대응", en: "Incident Response" }, color: "#ea580c", icon: "🚨" },
  { id: "vendor_management", label: { ko: "외부 서비스 관리", en: "Vendor Management" }, color: "#0891b2", icon: "🤝" },
  { id: "employee_security", label: { ko: "인력 보안", en: "Employee Security" }, color: "#6366f1", icon: "👤" },
];

export const SECURITY_CHECKLIST: SecurityCheckItem[] = [
  // ── 접근 제어 (8항목) ──
  { id: "mfa-all-accounts", category: "access_control", priority: "critical", title: { ko: "모든 서비스 계정에 MFA(2단계 인증) 적용", en: "Enable MFA on all service accounts" }, description: { ko: "GitHub, AWS, Vercel, Supabase 등 모든 외부 서비스에 2FA 설정", en: "2FA on GitHub, AWS, Vercel, Supabase, etc." }, howTo: { ko: "각 서비스 보안 설정 → 2단계 인증 활성화. 인증 앱(Google Authenticator, 1Password) 사용 권장", en: "Service settings → Enable 2FA. Use authenticator app" }, estimatedMinutes: 30, toolSuggestion: "1Password / Google Authenticator", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "ssh-key-auth", category: "access_control", priority: "high", title: { ko: "SSH 키 기반 인증 (비밀번호 비활성화)", en: "SSH key-based auth (disable password)" }, description: { ko: "서버 접근 시 비밀번호 대신 SSH 키 사용", en: "Use SSH keys instead of passwords for servers" }, howTo: { ko: "ssh-keygen → 공개키 서버 등록 → sshd_config에서 PasswordAuthentication no", en: "ssh-keygen → register public key → disable PasswordAuthentication" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "secrets-env-vars", category: "access_control", priority: "critical", title: { ko: "비밀키/API키를 환경변수로 관리 (코드에 하드코딩 금지)", en: "Store secrets in env vars (never hardcode)" }, description: { ko: ".env 파일 사용, .gitignore에 추가. Vercel/Supabase 환경변수 설정", en: "Use .env files, add to .gitignore" }, howTo: { ko: "1. .env.local 생성 2. .gitignore에 .env* 추가 3. Vercel Dashboard → Settings → Environment Variables", en: "1. Create .env.local 2. Add .env* to .gitignore 3. Set in Vercel dashboard" }, estimatedMinutes: 10, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "least-privilege", category: "access_control", priority: "high", title: { ko: "최소 권한 원칙 적용 (IAM)", en: "Apply least-privilege IAM" }, description: { ko: "각 서비스/사용자에게 필요한 최소 권한만 부여", en: "Grant only minimum required permissions" }, howTo: { ko: "AWS IAM 정책 검토, Supabase RLS 규칙 설정, GitHub 팀 권한 분리", en: "Review IAM policies, set Supabase RLS, separate GitHub team permissions" }, estimatedMinutes: 45, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "password-hashing", category: "access_control", priority: "critical", title: { ko: "비밀번호 해싱 (bcrypt/argon2)", en: "Hash passwords (bcrypt/argon2)" }, description: { ko: "평문 비밀번호 저장 절대 금지. bcrypt 또는 argon2 사용", en: "Never store plain text. Use bcrypt or argon2" }, howTo: { ko: "Supabase Auth 사용 시 자동 적용. 자체 구현 시 bcrypt with salt rounds ≥ 12", en: "Auto with Supabase Auth. Self-impl: bcrypt salt ≥ 12" }, estimatedMinutes: 5, toolSuggestion: "Supabase Auth (자동 적용)", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "session-management", category: "access_control", priority: "high", title: { ko: "세션 만료 + 갱신 토큰 설정", en: "Session expiry + refresh token setup" }, description: { ko: "접근 토큰 1시간, 갱신 토큰 7일 등 적절한 만료 시간 설정", en: "Access token 1h, refresh 7d, etc." }, howTo: { ko: "Supabase: 프로젝트 설정 → Auth → JWT 만료 시간 설정", en: "Supabase: Project Settings → Auth → JWT Expiry" }, estimatedMinutes: 10, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: false },
  { id: "api-rate-limiting", category: "access_control", priority: "high", title: { ko: "API Rate Limiting 적용", en: "Apply API rate limiting" }, description: { ko: "API 엔드포인트별 요청 횟수 제한으로 DDoS/남용 방지", en: "Per-endpoint request limits to prevent abuse" }, howTo: { ko: "Vercel Edge Middleware 또는 upstash/ratelimit 라이브러리 사용", en: "Vercel Edge Middleware or upstash/ratelimit" }, estimatedMinutes: 30, toolSuggestion: "Upstash Rate Limit", forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: true },
  { id: "cors-config", category: "access_control", priority: "medium", title: { ko: "CORS 정책 설정", en: "Configure CORS policy" }, description: { ko: "허용된 도메인만 API 접근 가능하도록 CORS 헤더 설정", en: "Set CORS headers for allowed domains only" }, howTo: { ko: "Next.js middleware.ts 또는 API route에서 Access-Control-Allow-Origin 설정", en: "Set in Next.js middleware or API routes" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },

  // ── 데이터 보호 (7항목) ──
  { id: "https-everywhere", category: "data_protection", priority: "critical", title: { ko: "모든 통신 HTTPS 적용", en: "HTTPS on all communications" }, description: { ko: "HTTP → HTTPS 강제 리다이렉트. TLS 1.2 이상", en: "Force HTTP → HTTPS. TLS 1.2+" }, howTo: { ko: "Vercel: 자동 적용. 커스텀 도메인도 자동 SSL 인증서 발급", en: "Vercel: auto-applied. Custom domains get auto SSL" }, estimatedMinutes: 5, toolSuggestion: "Vercel (자동)", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "db-encryption-at-rest", category: "data_protection", priority: "high", title: { ko: "데이터베이스 저장 시 암호화 (at-rest)", en: "Database encryption at rest" }, description: { ko: "디스크에 저장된 데이터 자동 암호화", en: "Auto-encrypt data stored on disk" }, howTo: { ko: "Supabase: 기본 활성화. AWS RDS: 인스턴스 생성 시 암호화 옵션 선택", en: "Supabase: enabled by default. AWS RDS: enable at creation" }, estimatedMinutes: 5, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "backup-strategy", category: "data_protection", priority: "high", title: { ko: "자동 백업 + 복구 테스트", en: "Auto backup + recovery testing" }, description: { ko: "일일 자동 백업 + 분기 1회 복구 테스트", en: "Daily auto backup + quarterly recovery test" }, howTo: { ko: "Supabase: Pro 플랜 일일 백업. 추가로 pg_dump 주간 백업 스크립트 설정", en: "Supabase Pro: daily backup. Add weekly pg_dump script" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "input-validation", category: "data_protection", priority: "critical", title: { ko: "모든 사용자 입력 검증 (SQL Injection/XSS 방어)", en: "Validate all user input (SQLi/XSS)" }, description: { ko: "SQL Injection, XSS, CSRF 공격 방어를 위한 입력 검증", en: "Input validation for SQLi, XSS, CSRF defense" }, howTo: { ko: "Supabase RPC: 파라미터화된 쿼리 자동 적용. 프론트엔드: DOMPurify로 HTML 새니타이즈", en: "Supabase RPC: auto parameterized. Frontend: DOMPurify" }, estimatedMinutes: 20, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "pii-encryption", category: "data_protection", priority: "high", title: { ko: "개인정보 필드 암호화", en: "Encrypt PII fields" }, description: { ko: "주민번호, 전화번호 등 민감 정보 컬럼 레벨 암호화", en: "Column-level encryption for sensitive PII" }, howTo: { ko: "Supabase Vault 또는 pgcrypto 확장 사용", en: "Use Supabase Vault or pgcrypto extension" }, estimatedMinutes: 45, toolSuggestion: "Supabase Vault", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "logging-access", category: "data_protection", priority: "medium", title: { ko: "데이터 접근 로깅", en: "Data access logging" }, description: { ko: "누가 언제 어떤 데이터에 접근했는지 기록", en: "Log who accessed what data when" }, howTo: { ko: "Supabase: pg_audit 확장 활성화. API: 미들웨어에서 요청 로깅", en: "Supabase: pg_audit. API: middleware logging" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "data-retention", category: "data_protection", priority: "medium", title: { ko: "데이터 보존/삭제 정책 수립", en: "Data retention/deletion policy" }, description: { ko: "개인정보 보존 기간, 삭제 절차, 탈퇴 시 처리 방안", en: "Retention periods, deletion procedures, account deletion" }, howTo: { ko: "개인정보처리방침에 보존 기간 명시. 자동 삭제 배치 작업 설정", en: "Specify in privacy policy. Set auto-deletion batch jobs" }, estimatedMinutes: 60, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },

  // ── 코드 보안 (7항목) ──
  { id: "dependency-audit", category: "code_security", priority: "high", title: { ko: "의존성 취약점 자동 스캔", en: "Auto dependency vulnerability scanning" }, description: { ko: "npm audit / Dependabot으로 알려진 취약점 자동 감지", en: "Auto-detect known vulnerabilities with npm audit / Dependabot" }, howTo: { ko: "GitHub: Settings → Code security → Dependabot alerts 활성화", en: "GitHub: Settings → Code security → Enable Dependabot" }, estimatedMinutes: 10, toolSuggestion: "GitHub Dependabot", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "branch-protection", category: "code_security", priority: "high", title: { ko: "main 브랜치 보호 규칙", en: "Main branch protection rules" }, description: { ko: "직접 push 금지, PR 필수, 리뷰 승인 후 머지", en: "No direct push, require PR, review before merge" }, howTo: { ko: "GitHub: Settings → Branches → Branch protection rules → main → Require PR reviews", en: "GitHub: Branches → Protection rules → Require reviews" }, estimatedMinutes: 10, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: false },
  { id: "code-review", category: "code_security", priority: "medium", title: { ko: "코드 리뷰 정책 수립", en: "Code review policy" }, description: { ko: "모든 PR에 최소 1명 리뷰어. 보안 관련 변경은 2명", en: "Min 1 reviewer per PR. Security changes: 2 reviewers" }, howTo: { ko: "GitHub PR 템플릿 + CODEOWNERS 파일 설정", en: "GitHub PR template + CODEOWNERS file" }, estimatedMinutes: 20, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: false },
  { id: "no-secrets-in-code", category: "code_security", priority: "critical", title: { ko: "코드에 비밀키 커밋 방지", en: "Prevent secrets in code commits" }, description: { ko: "pre-commit hook으로 API 키, 비밀번호 등 자동 감지", en: "Pre-commit hook to detect API keys, passwords" }, howTo: { ko: "gitleaks 또는 trufflehog 설치 → pre-commit hook 설정", en: "Install gitleaks or trufflehog → set as pre-commit hook" }, estimatedMinutes: 15, toolSuggestion: "gitleaks", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "csp-headers", category: "code_security", priority: "medium", title: { ko: "Content Security Policy (CSP) 헤더", en: "Content Security Policy headers" }, description: { ko: "XSS 공격 방어를 위한 CSP 헤더 설정", en: "CSP headers for XSS defense" }, howTo: { ko: "next.config.ts → headers() → Content-Security-Policy 설정", en: "next.config.ts → headers() → Set CSP" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: true },
  { id: "error-handling", category: "code_security", priority: "high", title: { ko: "에러 메시지에 내부 정보 노출 방지", en: "No internal info in error messages" }, description: { ko: "사용자에게 보이는 에러에서 스택 트레이스, DB 정보 제거", en: "Remove stack traces, DB info from user-facing errors" }, howTo: { ko: "프로덕션 환경에서 에러 핸들러 확인. Sentry에만 상세 정보 전송", en: "Check error handler in production. Send details only to Sentry" }, estimatedMinutes: 15, toolSuggestion: "Sentry", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "ai-prompt-safety", category: "code_security", priority: "high", title: { ko: "AI 프롬프트 인젝션 방어", en: "AI prompt injection defense" }, description: { ko: "사용자 입력이 AI 프롬프트에 들어갈 때 인젝션 방어", en: "Defend against user input manipulating AI prompts" }, howTo: { ko: "시스템 프롬프트와 사용자 입력 분리. 입력 길이 제한. 출력 검증", en: "Separate system/user prompts. Limit input length. Validate output" }, estimatedMinutes: 20, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },

  // ── 규정 준수 (6항목) ──
  { id: "privacy-policy", category: "compliance", priority: "critical", title: { ko: "개인정보처리방침 작성 및 게시", en: "Write and publish privacy policy" }, description: { ko: "2025 개정 개인정보보호법 반영 필수. 수집 목적, 보유 기간, 제3자 제공 명시", en: "Must reflect 2025 PIPA amendments" }, howTo: { ko: "개인정보보호위원회 가이드라인 참고. AI로 초안 작성 후 법률 검토", en: "Follow PIPC guidelines. AI draft + legal review" }, estimatedMinutes: 120, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "terms-of-service", category: "compliance", priority: "critical", title: { ko: "이용약관 작성 및 게시", en: "Write and publish terms of service" }, description: { ko: "서비스 이용 조건, 환불 정책, 면책 조항 명시", en: "Service conditions, refund policy, disclaimers" }, howTo: { ko: "전자상거래법 + 약관규제법 준수. AI 초안 후 법률 검토 권장", en: "Comply with e-commerce act. AI draft + legal review" }, estimatedMinutes: 120, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },
  { id: "cookie-consent", category: "compliance", priority: "medium", title: { ko: "쿠키 동의 배너", en: "Cookie consent banner" }, description: { ko: "비필수 쿠키 사용 시 사전 동의 필요 (GDPR/PIPA)", en: "Prior consent for non-essential cookies" }, howTo: { ko: "CookieConsent 라이브러리 사용 또는 자체 구현. 분석 쿠키는 옵트인", en: "Use CookieConsent library or custom. Analytics cookies need opt-in" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: true },
  { id: "ai-disclosure", category: "compliance", priority: "high", title: { ko: "AI 자동 의사결정 고지 (2025 개정법)", en: "AI automated decision disclosure (2025 law)" }, description: { ko: "AI가 사용자에게 영향을 미치는 결정을 할 때 설명 의무", en: "Obligation to explain AI decisions affecting users" }, howTo: { ko: "서비스 내 AI 사용 고지 + 이의제기 절차 마련", en: "Disclose AI use + provide objection procedure" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: true },
  { id: "data-processing-agreement", category: "compliance", priority: "high", title: { ko: "개인정보 처리 위탁 계약", en: "Data Processing Agreement" }, description: { ko: "외부 서비스(Supabase, AWS 등)에 데이터 처리 위탁 시 계약 필요", en: "Required when delegating data processing to external services" }, howTo: { ko: "Supabase, AWS 등 서비스별 DPA 확인 및 체결. 처리방침에 수탁자 명시", en: "Check and sign DPA with each service. List in privacy policy" }, estimatedMinutes: 60, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "breach-notification", category: "compliance", priority: "high", title: { ko: "개인정보 유출 통지 절차", en: "Data breach notification procedure" }, description: { ko: "유출 시 72시간 내 개인정보보호위원회 + 정보주체 통지 의무", en: "Must notify PIPC + data subjects within 72 hours" }, howTo: { ko: "사고 대응 매뉴얼에 통지 절차 포함. 담당자 지정.", en: "Include in incident response manual. Designate responsible person." }, estimatedMinutes: 45, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },

  // ── 인프라 보안 (6항목) ──
  { id: "waf-ddos", category: "infrastructure", priority: "high", title: { ko: "WAF + DDoS 방어", en: "WAF + DDoS protection" }, description: { ko: "웹 애플리케이션 방화벽 + 분산 서비스 거부 공격 방어", en: "Web application firewall + DDoS defense" }, howTo: { ko: "Vercel: 기본 DDoS 보호 포함. 추가: Cloudflare 프록시 설정", en: "Vercel: basic DDoS included. Add: Cloudflare proxy" }, estimatedMinutes: 30, toolSuggestion: "Cloudflare / Vercel", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "container-scanning", category: "infrastructure", priority: "medium", title: { ko: "컨테이너 이미지 취약점 스캔", en: "Container image vulnerability scan" }, description: { ko: "Docker 이미지 빌드 시 취약점 자동 스캔", en: "Auto-scan Docker images for vulnerabilities" }, howTo: { ko: "GitHub Actions에 trivy 또는 snyk container 추가", en: "Add trivy or snyk container to GitHub Actions" }, estimatedMinutes: 20, toolSuggestion: "Trivy / Snyk", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: false },
  { id: "dns-security", category: "infrastructure", priority: "medium", title: { ko: "DNS 보안 (DNSSEC, CAA)", en: "DNS security (DNSSEC, CAA)" }, description: { ko: "DNS 스푸핑 방지 + 인증서 발급 권한 제한", en: "Prevent DNS spoofing + limit certificate issuance" }, howTo: { ko: "도메인 등록업체에서 DNSSEC 활성화. CAA 레코드 추가", en: "Enable DNSSEC at registrar. Add CAA records" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },
  { id: "monitoring-alerts", category: "infrastructure", priority: "high", title: { ko: "인프라 모니터링 + 알림 설정", en: "Infrastructure monitoring + alerts" }, description: { ko: "CPU, 메모리, 에러율 이상 시 자동 알림", en: "Auto alerts on CPU, memory, error rate anomalies" }, howTo: { ko: "Sentry: 에러 알림. Vercel: Analytics. 추가: Axiom 또는 Datadog", en: "Sentry: errors. Vercel: analytics. Add: Axiom or Datadog" }, estimatedMinutes: 30, toolSuggestion: "Sentry + Vercel Analytics", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "log-management", category: "infrastructure", priority: "medium", title: { ko: "중앙 로그 관리", en: "Centralized log management" }, description: { ko: "모든 서비스 로그를 한 곳에서 검색/분석", en: "Search/analyze all service logs in one place" }, howTo: { ko: "Axiom, Datadog, 또는 CloudWatch Logs 설정", en: "Set up Axiom, Datadog, or CloudWatch Logs" }, estimatedMinutes: 45, toolSuggestion: "Axiom (스타트업 무료)", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "network-segmentation", category: "infrastructure", priority: "low", title: { ko: "네트워크 분리 (DB 직접 접근 차단)", en: "Network segmentation (block direct DB access)" }, description: { ko: "데이터베이스에 공개 인터넷 직접 접근 차단", en: "Block public internet direct access to database" }, howTo: { ko: "Supabase: 프로젝트 설정 → Network → IP 제한. AWS: VPC + 보안 그룹", en: "Supabase: Network → IP restriction. AWS: VPC + security groups" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },

  // ── 사고 대응 (5항목) ──
  { id: "incident-runbook", category: "incident_response", priority: "high", title: { ko: "사고 대응 매뉴얼 작성", en: "Incident response runbook" }, description: { ko: "보안 사고 발생 시 단계별 대응 절차 문서화", en: "Document step-by-step response procedures" }, howTo: { ko: "1. 감지 2. 격리 3. 분석 4. 복구 5. 보고 6. 개선 단계별 작성", en: "Detect → Contain → Analyze → Recover → Report → Improve" }, estimatedMinutes: 60, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "escalation-contacts", category: "incident_response", priority: "high", title: { ko: "비상 연락망 설정", en: "Escalation contact list" }, description: { ko: "보안 사고 시 연락할 담당자, 순서, 연락처", en: "Who to contact, in what order, during incidents" }, howTo: { ko: "Notion/문서에 팀원별 역할, 연락처, 대체 담당자 명시", en: "Document roles, contacts, backups per team member" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "postmortem-template", category: "incident_response", priority: "medium", title: { ko: "사후 분석(Post-mortem) 템플릿", en: "Post-mortem template" }, description: { ko: "사고 후 원인 분석, 재발 방지 대책 문서화", en: "Root cause analysis, prevention measures" }, howTo: { ko: "Notion 템플릿: 타임라인, 영향 범위, 원인, 대책, 후속 조치", en: "Notion template: timeline, impact, root cause, action items" }, estimatedMinutes: 20, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: false },
  { id: "status-page", category: "incident_response", priority: "medium", title: { ko: "서비스 상태 페이지", en: "Status page" }, description: { ko: "장애 발생 시 고객에게 실시간 상태 안내", en: "Real-time status updates for customers during outages" }, howTo: { ko: "Instatus, Statuspage, 또는 자체 구현", en: "Instatus, Statuspage, or custom" }, estimatedMinutes: 30, toolSuggestion: "Instatus (무료)", forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },
  { id: "regular-security-review", category: "incident_response", priority: "medium", title: { ko: "정기 보안 점검 (분기 1회)", en: "Quarterly security review" }, description: { ko: "분기마다 접근 권한, 의존성, 설정 점검", en: "Review access, dependencies, configs quarterly" }, howTo: { ko: "분기 시작 시 체크리스트 기반 점검. 결과 문서화", en: "Checklist-based review at quarter start. Document results" }, estimatedMinutes: 120, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },

  // ── 외부 서비스 관리 (4항목) ──
  { id: "vendor-security", category: "vendor_management", priority: "medium", title: { ko: "외부 서비스 보안 평가", en: "Vendor security assessment" }, description: { ko: "사용하는 외부 서비스의 보안 인증(SOC 2 등) 확인", en: "Verify security certifications of external services" }, howTo: { ko: "Supabase: SOC 2 Type II. Vercel: SOC 2 Type II. AWS: 다수 인증. 각 서비스 보안 페이지 확인", en: "Check each service's security page for certifications" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "subprocessor-list", category: "vendor_management", priority: "medium", title: { ko: "하위 처리자(서브프로세서) 목록 관리", en: "Subprocessor list management" }, description: { ko: "데이터가 어떤 외부 서비스를 거치는지 목록 관리", en: "Track which external services process your data" }, howTo: { ko: "Supabase, Vercel, Anthropic 등 사용 서비스 목록화. 개인정보처리방침에 수탁자로 명시", en: "List all services. Include as processors in privacy policy" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "service-dependency-map", category: "vendor_management", priority: "low", title: { ko: "서비스 의존성 맵", en: "Service dependency map" }, description: { ko: "시스템이 의존하는 모든 외부 서비스 시각화", en: "Visualize all external service dependencies" }, howTo: { ko: "Notion/Miro에 서비스 간 연결 다이어그램 작성", en: "Draw service connection diagram in Notion/Miro" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },
  { id: "sla-monitoring", category: "vendor_management", priority: "low", title: { ko: "외부 서비스 SLA 모니터링", en: "External service SLA monitoring" }, description: { ko: "주요 서비스의 가동률 추적. 장애 시 대안 파악", en: "Track uptime of critical services. Know alternatives" }, howTo: { ko: "각 서비스 상태 페이지 RSS 구독. 장애 발생 시 알림 설정", en: "Subscribe to status page RSS. Set alerts for outages" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: false, requiredForISMS: false },

  // ── 인력 보안 (4항목) ──
  { id: "security-onboarding", category: "employee_security", priority: "high", title: { ko: "신규 입사자 보안 교육", en: "New hire security training" }, description: { ko: "첫 주 내 보안 정책, 비밀번호 관리, 피싱 주의 교육", en: "First week: security policy, password management, phishing" }, howTo: { ko: "보안 온보딩 체크리스트 작성. MFA 설정 + 비밀번호 관리자 지급", en: "Security onboarding checklist. Setup MFA + password manager" }, estimatedMinutes: 30, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "device-encryption", category: "employee_security", priority: "high", title: { ko: "업무 기기 디스크 암호화", en: "Work device disk encryption" }, description: { ko: "MacOS FileVault, Windows BitLocker 활성화", en: "Enable FileVault (Mac) / BitLocker (Windows)" }, howTo: { ko: "Mac: 시스템 설정 → 개인 정보 보호 및 보안 → FileVault 켜기", en: "Mac: System Settings → Privacy & Security → Turn On FileVault" }, estimatedMinutes: 10, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "password-manager", category: "employee_security", priority: "high", title: { ko: "팀 비밀번호 관리자 사용", en: "Team password manager" }, description: { ko: "1Password, Bitwarden 등으로 팀 전체 비밀번호 관리", en: "Manage all team passwords with 1Password, Bitwarden" }, howTo: { ko: "1Password Teams ($4/사용자/월) 또는 Bitwarden ($4/사용자/월) 가입", en: "Sign up for 1Password Teams or Bitwarden ($4/user/month)" }, estimatedMinutes: 15, toolSuggestion: "1Password / Bitwarden", forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
  { id: "offboarding-procedure", category: "employee_security", priority: "high", title: { ko: "퇴사자 접근 권한 즉시 회수", en: "Immediate access revocation for departures" }, description: { ko: "퇴사 당일 모든 서비스 접근 권한 비활성화", en: "Disable all service access on departure day" }, howTo: { ko: "퇴사 체크리스트: GitHub, AWS, Supabase, Slack, 이메일, 1Password 접근 해제", en: "Offboarding checklist: revoke GitHub, AWS, Supabase, Slack, email, 1Password" }, estimatedMinutes: 15, forB2B: true, forSaaS: true, requiredForSOC2: true, requiredForISMS: true },
];

// ── 유틸리티 ──

export function getSecurityItemsByCategory(category: SecurityCategory): SecurityCheckItem[] {
  return SECURITY_CHECKLIST.filter(item => item.category === category);
}

export function getSecurityItemsByPriority(priority: SecurityPriority): SecurityCheckItem[] {
  return SECURITY_CHECKLIST.filter(item => item.priority === priority);
}

export function calculateSecurityScore(completionMap: Record<string, boolean>): {
  score: number;
  total: number;
  completed: number;
  criticalCompleted: number;
  criticalTotal: number;
  readiness: "not_started" | "basic" | "intermediate" | "production_ready";
} {
  const total = SECURITY_CHECKLIST.length;
  const completed = SECURITY_CHECKLIST.filter(item => completionMap[item.id]).length;
  const criticalItems = SECURITY_CHECKLIST.filter(item => item.priority === "critical");
  const criticalCompleted = criticalItems.filter(item => completionMap[item.id]).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const readiness = criticalCompleted < criticalItems.length
    ? "not_started"
    : score >= 80
      ? "production_ready"
      : score >= 50
        ? "intermediate"
        : "basic";

  return { score, total, completed, criticalCompleted, criticalTotal: criticalItems.length, readiness };
}
