import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 모바일 반응형 백스톱 회귀 가드 (2026-08-05).
 *
 * 배경 — 이 가드가 없어서 생긴 사고:
 *   globals.css 의 모바일 그리드 백스톱은 2026-07-14 도입 이후 **한 번도 동작하지 않았다.**
 *   선택자는 `[style*="columns: repeat(2,"]` (콜론 뒤 공백) 인데, React/Next 가 SSR 로
 *   직렬화하는 실제 style 속성은 `grid-template-columns:1fr 1fr` (공백 없음) 이라
 *   attribute substring 매칭이 전부 빗나갔다. 브라우저 실측(2026-08-05, 360px):
 *     · 공백 표기 선택자 매칭 0건 / 무공백 표기 2건
 *     · `1fr 1.35fr` 그리드 computed = 135px + 183px (2열 그대로)
 *   결과: 폰에서 모든 다열 그리드가 데스크톱 폭을 유지 → 좁은 칸에서 어절이 3~4줄로 깨짐.
 *   같은 버그가 min-width 백스톱에도 있었다.
 *
 * 이 테스트가 막는 것:
 *   1) 백스톱 선택자를 한쪽 표기로만 적는 것 (= 죽은 규칙). 이게 실제 사고 원인.
 *   2) 소스에 새 다열 인라인 그리드를 추가하면서 백스톱 목록에 넣지 않는 것.
 *
 * 새 템플릿을 추가할 땐 globals.css 백스톱에 **두 표기 모두** 넣거나,
 * 아래 INTENTIONAL_FIXED_COLUMNS 에 *사유와 함께* 선언할 것.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, "..");
const GLOBALS_CSS = join(WEB_ROOT, "app", "globals.css");

/** 폰에서도 열 수를 유지해야 하는 그리드 — 각 항목의 사유가 곧 명세. */
const INTENTIONAL_FIXED_COLUMNS: Record<string, string> = {
  "repeat(7,1fr)": "요일 캘린더. 7열이 곧 '한 주'라는 의미라 접으면 달력이 아니게 된다.",
  "repeat(7, 1fr)": "요일 캘린더(공백 표기). 위와 동일.",
  "repeat(7, minmax(0, 1fr))": "요일 캘린더(blowout 방지형). 위와 동일.",
  "repeat(6, 10px)": "도트 인디케이터. 10px 고정폭 6개라 폰에서도 넘치지 않는다.",
  "repeat(${weeks.length}, 1fr)": "13주 현금흐름 표. 가로 스크롤 컨테이너 안에 있어 접으면 시계열이 깨진다.",
  "minmax(0, 1fr)": "이미 1열.",
  "1fr": "이미 1열.",
  "repeat(2, minmax(0, 1fr))": "백스톱 `columns:repeat(2,` 가 커버.",
  "repeat(3, minmax(0, 1fr))": "백스톱 `columns:repeat(3,` 가 커버.",
  "repeat(4, minmax(0, 1fr))": "백스톱 `columns:repeat(4,` 가 커버.",
  "repeat(4, minmax(0,1fr))": "백스톱 `columns:repeat(4,` 가 커버.",
  "auto 1fr auto": "행 레이아웃(아이콘|본문|값). 열이 아니라 한 줄 안의 역할 분담이라 접으면 오히려 깨진다.",
  "auto 1fr auto auto auto": "행 레이아웃. 위와 동일.",
  "1fr auto": "행 레이아웃(본문|값).",
  "1fr auto auto": "행 레이아웃.",
  "1fr auto auto auto": "행 레이아웃.",
  "16px 1fr": "행 레이아웃(불릿|본문).",
  "16px 1fr auto auto": "행 레이아웃.",
  "26px 1fr auto": "행 레이아웃(번호|본문|값).",
  "70px 1fr auto": "행 레이아웃.",
  "80px 1fr auto auto": "행 레이아웃.",
  "60px 1fr auto auto": "행 레이아웃.",
  "60px 48px 1fr 28px": "행 레이아웃(원가 구조 표 한 줄).",
  "minmax(80px, 90px) 1fr": "행 레이아웃(라벨|값).",
  "minmax(0, 1fr) auto": "행 레이아웃(본문|금액).",
  "repeat(${startupTypeOptions.length}, 1fr)": "옵션 수가 2~4 → 런타임 값이 repeat(2,/repeat(3,/repeat(4, 로 백스톱에 걸린다.",
  "repeat(${rowCards.length}, minmax(0, 1fr))": "isWide 가 false 면 1열로 계산되는 JS 게이트가 이미 있다.",
  "repeat(${cells.length}, minmax(0, 1fr))": "런타임 값이 repeat(N, 형태라 2~4열이면 백스톱에 걸린다.",
  "repeat(${Math.min(pillars.length, 3)}, minmax(0, 1fr))": "최대 3 → repeat(3, 로 백스톱에 걸린다.",
  "repeat(${Math.min(options.length, 3)}, 1fr)": "최대 3 → repeat(3, 로 백스톱에 걸린다.",
  "repeat(${Math.min(p.metrics.length, 6)}, minmax(0, 1fr))": "최대 6 → repeat(5,/repeat(6, 로 백스톱에 걸린다.",
};

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

/**
 * ⚠️ 주석을 반드시 먼저 제거한다. 주석 안에 설명용으로 적어둔 `[style*="grid-template-columns"]`
 *    같은 문자열까지 선택자로 집으면, 그 광범위 패턴이 모든 템플릿에 매칭돼 이 테스트가
 *    "전부 커버됨"으로 공허하게 통과한다 (작성 중 실제로 겪음).
 */
const css = readFileSync(GLOBALS_CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** globals.css 의 `[style*="..."]` 선택자에 쓰인 문자열 전부. */
function backstopPatterns(): string[] {
  return [...css.matchAll(/\[style\*="([^"]+)"\]/g)].map((m) => m[1]);
}

describe("globals.css 모바일 백스톱 — 선택자 표기 (2026-08-05 사고 재발 방지)", () => {
  it("모든 인라인 style 선택자는 공백·무공백 두 표기를 함께 가진다", () => {
    const patterns = new Set(backstopPatterns());
    const missing: string[] = [];
    for (const p of patterns) {
      // `prop: value` 형태만 검사 — 콜론 뒤 공백 유무가 곧 SSR/CSSOM 직렬화 차이다.
      const m = p.match(/^(.*?):\s(.+)$/);
      if (!m) continue;
      const noSpace = `${m[1]}:${m[2]}`;
      if (!patterns.has(noSpace)) missing.push(`"${p}" ↔ 짝 없는 무공백 표기 "${noSpace}"`);
    }
    expect(
      missing,
      `React/Next SSR 은 인라인 스타일을 공백 없이 직렬화한다("grid-template-columns:1fr 1fr").\n` +
        `공백 표기만 적으면 그 규칙은 폰에서 절대 매칭되지 않는다(= 죽은 CSS).\n` +
        `두 표기를 모두 적을 것:\n  ${missing.join("\n  ")}`,
    ).toEqual([]);
  });

  it("무공백 표기에도 공백 표기 짝이 있다 (클라이언트 재렌더 시 CSSOM 은 공백 표기)", () => {
    const patterns = new Set(backstopPatterns());
    const missing: string[] = [];
    for (const p of patterns) {
      const m = p.match(/^(.*?):(\S.*)$/);
      if (!m) continue;
      const withSpace = `${m[1]}: ${m[2]}`;
      if (!patterns.has(withSpace)) missing.push(`"${p}" ↔ 짝 없는 공백 표기 "${withSpace}"`);
    }
    expect(missing, `클라이언트에서 style 이 갱신되면 브라우저 직렬화(공백 표기)로 바뀐다.\n  ${missing.join("\n  ")}`).toEqual([]);
  });
});

describe("인라인 다열 그리드 — 백스톱 커버리지", () => {
  const sources = collectSourceFiles(join(WEB_ROOT, "app"));

  /** 소스의 모든 gridTemplateColumns 리터럴 → { 값: [파일…] } */
  const templates = new Map<string, Set<string>>();
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/gridTemplateColumns:\s*[`"]([^`"]+)[`"]/g)) {
      const rel = file.slice(WEB_ROOT.length + 1);
      if (!templates.has(m[1])) templates.set(m[1], new Set());
      templates.get(m[1])!.add(rel);
    }
  }

  it("소스를 실제로 스캔했다 (스캐너가 조용히 0건이 되는 것 방지)", () => {
    expect(templates.size).toBeGreaterThan(30);
  });

  it("다열 템플릿은 백스톱이 덮거나 INTENTIONAL_FIXED_COLUMNS 에 사유가 선언돼 있다", () => {
    const patterns = backstopPatterns();
    const uncovered: string[] = [];

    for (const [tmpl, files] of templates) {
      if (tmpl in INTENTIONAL_FIXED_COLUMNS) continue;

      // auto-fit/auto-fill 은 스스로 반응형이다 — 최소 트랙폭이 폰 콘텐츠 폭(≈296px) 안에 들어오면
      // 열 수가 자동으로 1이 되므로 백스톱이 필요 없다. 반대로 최소폭이 그보다 크면
      // 열은 1개인데 트랙이 넘쳐 우측이 잘리므로 반드시 백스톱이 있어야 한다(≥220px 는 CSS 가 커버).
      const autoTrack = tmpl.match(/repeat\(auto-(?:fit|fill),\s*minmax\((\d+)px/);
      if (autoTrack && Number(autoTrack[1]) <= 200) continue;

      // 단일 열이면 검사 대상 아님
      const trackCount = tmpl.startsWith("repeat(") ? 2 : tmpl.split(/\s+(?![^(]*\))/).length;
      if (trackCount < 2) continue;

      // SSR 이 내보내는 실제 속성 문자열을 만들어 백스톱 선택자와 대조.
      const ssr = `grid-template-columns:${tmpl}`;
      const covered = patterns.some((p) => ssr.includes(p));
      if (!covered) uncovered.push(`${tmpl}  ←  ${[...files].slice(0, 3).join(", ")}`);
    }

    expect(
      uncovered,
      `폰(≤640px)에서 안 접히는 다열 인라인 그리드가 있다.\n` +
        `globals.css 백스톱에 두 표기로 추가하거나, 접으면 안 되는 이유를 ` +
        `INTENTIONAL_FIXED_COLUMNS 에 적을 것:\n  ${uncovered.join("\n  ")}`,
    ).toEqual([]);
  });
});
