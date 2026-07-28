import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { USER_TABLES, OWNER_TABLES, RECIPIENT_TABLES } from "../app/api/_lib/account-wipe";

/**
 * 초기화/삭제 커버리지 회귀 가드 (2026-07-15).
 *
 * 배경: wipeUserData 의 테이블 목록은 손으로 관리한다. 새 사용자 테이블을 만들고 목록에
 *   추가하는 걸 잊으면 "초기화했는데 옛 데이터가 부활" 사고가 난다 — 이미 3번 발생:
 *     · 2026-06-07 매출·세금·지표 부활
 *     · 2026-06-10 마케팅 사례 엔진 테이블 부활
 *     · 2026-07-15 program_applications·coaching_feedback·notifications 잔존(이 가드로 발견)
 *
 * 이 테스트는 마이그레이션에서 "사용자 식별 컬럼을 가진 테이블"을 전부 뽑아, 각각이
 *   (a) wipe 목록에 있거나 (b) 아래 INTENTIONALLY_RETAINED 에 *이유와 함께* 선언되어 있는지
 *   검사한다. 새 테이블을 만들면 둘 중 하나를 반드시 고르게 되어, 침묵의 누락이 불가능해진다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "..", "..", "supabase", "migrations");

/**
 * 초기화(reset) 때 일부러 남기는 테이블 — 각 항목은 "왜 남기는가"가 곧 명세다.
 * 새로 추가할 땐 반드시 사유를 적을 것. 사유 없이 추가하면 리뷰에서 막는다.
 */
const INTENTIONALLY_RETAINED: Record<string, string> = {
  // ── 초기화 메커니즘 자체 ──
  account_reset_markers: "tombstone. 이걸 지우면 타 기기 부활 차단이 무너진다(초기화에 안 지워지는 게 존재 이유).",

  // ── 직원 근로기록: 근로기준법 보존 의무 → 보존하되 화면 비노출 (사장님 결정 2026-07-15, (c)안) ──
  //   store_members 가 비면 팀 화면이 빈 상태로 렌더돼 자연히 안 보인다(TeamSurface members.length===0 게이트).
  attendance_records: "근로기준법 근태 기록 보존. 초기화해도 DB 보존, 화면 비노출.",
  leave_requests: "근로기준법 연차 기록 보존. 초기화해도 DB 보존, 화면 비노출.",
  allowance_requests: "근로기준법 수당 기록 보존. 초기화해도 DB 보존, 화면 비노출.",
  staff_schedules: "근로 시간 기록 보존. 초기화해도 DB 보존, 화면 비노출.",
  staff_schedule_rules: "근로 시간 규칙 보존. 초기화해도 DB 보존, 화면 비노출.",
  payroll_confirmations: "임금 지급 확인 기록. 근로기준법 임금 관련 기록이라 초기화로 지우지 않음.",
  payroll_inquiries: "직원의 급여 미지급 문의(분쟁 증거). 사장 초기화로 지우면 증거 인멸이 된다.",

  // ── 계정 정체성·기기·과금: 초기화는 '가게 데이터'만 지우고 계정은 유지 ──
  user_profiles: "계정 본인 정보(이름·출생연도). 초기화는 로그인 유지가 전제.",
  user_push_tokens: "기기 푸시 토큰. 초기화해도 같은 기기로 계속 알림 받아야 함.",
  user_feedback: "운영자에게 보낸 피드백. 사용자 초기화로 지우면 운영 이력이 사라짐.",
  foundone_subscriptions: "구독 유지가 reset 정책(계정 삭제 시엔 SUBSCRIPTION_TABLES 로 삭제).",
  foundone_payments: "결제 이력(세무·분쟁 대비). 계정 삭제 시엔 SUBSCRIPTION_TABLES 로 삭제.",

  // ── 남용 방지 / 자동 정리 ──
  ai_daily_usage: "AI 일일 쿼터 카운터. 초기화로 리셋되면 무한 우회가 된다.",
  ai_monthly_spend: "월간 AI 비용 예산(₩6,000) 카운터. 초기화로 리셋되면 예산 우회가 된다.",
  surface_daily_visits: "화면 방문 운영 통계(가게 데이터 아님 — 초기화 대상 아님). 계정 삭제는 FK CASCADE.",
  ga4_oauth_nonces: "만료 nonce. cleanup_ga4_oauth_nonces 가 자동 정리.",

  // ── 부모 CASCADE 로 정리됨 ──
  stage_tasks: "roadmaps FK ON DELETE CASCADE 로 정리(roadmaps 는 목록에 있음).",
  stage_decisions: "roadmaps FK ON DELETE CASCADE 로 정리.",

  // ── 죽은 테이블 (웹·iOS 참조 0곳) ──
  //   ⚠️ 되살릴 거면 목록 추가 + auth.users FK 에 ON DELETE CASCADE 부터. 현재 NO ACTION 이라
  //      쓰기 시작하면 계정 삭제가 FK 위반으로 실패한다.
  collected_sales: "죽은 테이블(참조 0). 되살리면 목록 추가 + FK CASCADE 필요.",
  sales_collection_config: "죽은 테이블(참조 0). 되살리면 목록 추가 + FK CASCADE 필요.",
  sales_sync_log: "죽은 테이블(참조 0). 되살리면 목록 추가 + FK CASCADE 필요.",

  // ── 서비스 공용(개인 데이터 아님) ──
  app_config: "서비스 설정. 사용자 데이터 아님.",
  marketing_meme_packs: "전역 주간 밈 팩(user 컬럼 없음, 모든 사용자 공용). 개인 데이터 아님 — 스캐너가 인접 마이그레이션 주석의 'user_id' 문자열을 오탐해 선언 필요.",
};

function userScopedTablesFromMigrations(): Map<string, Set<string>> {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  const sql = files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8")).join("\n");

  // rename 된 테이블은 옛 이름을 제외 (예: buildup_* → foundone_*).
  const renamed = new Set<string>();
  for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s+rename\s+to/gi)) {
    renamed.add(m[1].toLowerCase());
  }

  const out = new Map<string, Set<string>>();
  const blocks = sql.split(/create\s+table\s+(?:if\s+not\s+exists\s+)?/i);
  for (const b of blocks.slice(1)) {
    const m = b.match(/^(?:public\.)?"?([a-z0-9_]+)"?\s*\(([\s\S]{0,4000})/i);
    if (!m) continue;
    const name = m[1].toLowerCase();
    if (renamed.has(name)) continue;
    const body = m[2];
    const cols = new Set<string>();
    for (const c of ["user_id", "owner_user_id", "recipient_user_id"]) {
      if (new RegExp(`\\b${c}\\b`, "i").test(body)) cols.add(c);
    }
    if (cols.size > 0) out.set(name, cols);
  }
  return out;
}

describe("account-wipe 커버리지", () => {
  const tables = userScopedTablesFromMigrations();
  // 기준은 "초기화(reset) 때 지워지는가". SUBSCRIPTION_TABLES 는 reset 에선 보존이고
  //   계정 삭제에서만 extraUserTables 로 추가되므로 여기 넣지 않는다(보존 선언 쪽에 있음).
  const covered = new Set<string>([...USER_TABLES, ...OWNER_TABLES, ...RECIPIENT_TABLES]);

  it("스캔이 실제로 사용자 테이블을 찾았다(가드 sanity)", () => {
    expect(tables.size).toBeGreaterThan(20);
    expect(tables.has("roadmaps")).toBe(true);
  });

  it("모든 사용자 데이터 테이블이 wipe 목록에 있거나 '의도적 보존'으로 선언되어 있다", () => {
    const undeclared = [...tables.keys()]
      .filter((t) => !covered.has(t) && !(t in INTENTIONALLY_RETAINED))
      .sort();
    expect(
      undeclared,
      `다음 테이블이 초기화 목록에도, 의도적 보존 선언에도 없습니다 → 초기화 후 데이터가 부활합니다.\n` +
        `  ${undeclared.join(", ")}\n` +
        `해결: 사용자 데이터면 account-wipe.ts 의 USER_TABLES/OWNER_TABLES/RECIPIENT_TABLES 에 추가하고,\n` +
        `      일부러 남길 거면 이 파일의 INTENTIONALLY_RETAINED 에 *사유와 함께* 선언하세요.`,
    ).toEqual([]);
  });

  it("보존 선언과 wipe 목록이 서로 모순되지 않는다", () => {
    const both = Object.keys(INTENTIONALLY_RETAINED).filter((t) => covered.has(t)).sort();
    expect(both, `보존 선언과 wipe 목록에 동시에 있음(둘 중 하나가 틀림): ${both.join(", ")}`).toEqual([]);
  });

  it("보존 선언에는 반드시 사유가 있다", () => {
    const noReason = Object.entries(INTENTIONALLY_RETAINED)
      .filter(([, why]) => !why || why.trim().length < 10)
      .map(([t]) => t);
    expect(noReason, `사유 없는 보존 선언: ${noReason.join(", ")}`).toEqual([]);
  });
});
