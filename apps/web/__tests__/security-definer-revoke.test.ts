import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * 보안 회귀 가드 (2026-07-15) — SECURITY DEFINER 함수의 PUBLIC EXECUTE 취소 강제.
 *
 * 배경: Postgres 는 새 함수를 기본적으로 PUBLIC 에 EXECUTE 부여하고, Supabase/PostgREST 는
 *   public 스키마의 (트리거가 아닌) 함수를 anon/authenticated 에 /rest/v1/rpc/<fn> 로 노출한다.
 *   따라서 SECURITY DEFINER(소유자 권한 실행) 함수에 `REVOKE ... FROM PUBLIC` 이 빠지면
 *   익명 클라이언트가 직접 호출할 수 있다(전수 감사에서 push_dispatch 등 3건 발견·수정).
 *
 * 이 테스트는 마이그레이션 전체를 스캔해 "호출 가능한(=트리거 아님) SECURITY DEFINER 함수"
 * 각각이 어딘가에서 `REVOKE ... ON FUNCTION <fn>(...) ... FROM ... PUBLIC` 되었는지 검증한다.
 * 새 DEFINER RPC 를 추가하며 REVOKE 를 잊으면 CI 에서 잡힌다.
 */
const MIGRATIONS_DIR = join(HERE, "..", "..", "..", "supabase", "migrations");

function loadAllMigrationsSql(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8")).join("\n").toLowerCase();
}

describe("SECURITY DEFINER 함수는 PUBLIC EXECUTE 가 취소되어야 한다", () => {
  const sql = loadAllMigrationsSql();

  // 호출 가능한(트리거가 아닌) SECURITY DEFINER 함수 이름 수집.
  const definerFns = new Set<string>();
  const chunks = sql.split(/create\s+(?:or\s+replace\s+)?function/);
  for (const chunk of chunks.slice(1)) {
    if (!/\bsecurity\s+definer\b/.test(chunk)) continue;
    if (/\breturns\s+trigger\b/.test(chunk)) continue; // 트리거 함수는 PostgREST 미노출 → REVOKE 불요
    const m = chunk.match(/^\s*(?:public\.)?([a-z0-9_]+)\s*\(/);
    if (m) definerFns.add(m[1]);
  }

  // `REVOKE ... ON FUNCTION <fn>(...) ... FROM ... PUBLIC` 로 취소된 함수 이름 수집.
  const revoked = new Set<string>();
  const revokeRe =
    /revoke\s+[^;]*?on\s+function\s+(?:public\.)?([a-z0-9_]+)\s*\([^;]*?from\s+[^;]*?\bpublic\b/gi;
  let mm: RegExpExecArray | null;
  while ((mm = revokeRe.exec(sql)) !== null) revoked.add(mm[1]);

  it("스캔이 실제로 DEFINER 함수를 찾았다(가드 자체의 sanity)", () => {
    expect(definerFns.size).toBeGreaterThan(0);
    // 감사에서 수정한 대표 함수가 스캔에 잡히는지 확인.
    expect(definerFns.has("push_dispatch")).toBe(true);
  });

  it("모든 호출가능 DEFINER 함수가 REVOKE ... FROM PUBLIC 되어 있다", () => {
    const missing = [...definerFns].filter((fn) => !revoked.has(fn)).sort();
    expect(
      missing,
      `다음 SECURITY DEFINER 함수에 REVOKE ... FROM PUBLIC 이 없음(anon/authenticated 직접 호출 가능): ${missing.join(", ")}`,
    ).toEqual([]);
  });
});
