import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SHIFT_PRESETS, DEFAULT_SHIFT_REQUEST_DEADLINE_DAY,
  submissionSummary, availabilityTimeLabel, currentRequestWindow, periodLabel,
  DEADLINE_DAY_CHOICES, deadlineDayLabel, MAX_SHIFT_SLOTS, effectiveShiftSlots,
} from "@foundone/shared";

/**
 * 희망 근무 웹↔iOS 드리프트 가드 (2026-07-30).
 *
 *  SSOT = packages/shared/src/team/shift-availability.ts.
 *  iOS 는 Swift 수동 미러(FoundOneCore/ShiftAvailability.swift) — 신청 창 규칙이나
 *  프리셋이 한쪽만 바뀌면 사장과 직원이 **다른 달을 신청**하게 된다. 여기서 막는다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_CORE = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "ShiftAvailability.swift");
const IOS_CARD = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "ShiftAvailabilityCard.swift");
const swift = readFileSync(IOS_CORE, "utf8");
const card = readFileSync(IOS_CARD, "utf8");

describe("프리셋·기본값 동기화", () => {
  it("기본 마감일(31=말일)이 같다", () => {
    expect(DEFAULT_SHIFT_REQUEST_DEADLINE_DAY).toBe(31);
    expect(swift).toContain(`BU_DEFAULT_SHIFT_REQUEST_DEADLINE_DAY = ${DEFAULT_SHIFT_REQUEST_DEADLINE_DAY}`);
  });

  it("마감일 선택 목록·'말일' 라벨이 같다", () => {
    expect(DEADLINE_DAY_CHOICES).toHaveLength(31);
    expect(deadlineDayLabel(31)).toBe("말일");
    expect(swift).toContain("BU_DEADLINE_DAY_CHOICES: [Int] = Array(1...31)");
    expect(swift).toContain('day >= 31 ? "말일"');
  });

  it("DB 기본값도 31 이어야 한다 (컬럼 DEFAULT 가 25면 첫 조회부터 화면과 어긋난다)", () => {
    const sql = readFileSync(
      join(HERE, "..", "..", "..", "supabase", "migrations", "20260730_000001_shift_availability.sql"), "utf8",
    );
    expect(sql).toContain("shift_request_deadline_day int NOT NULL DEFAULT 31");
    expect(sql).toContain("COALESCE(v_deadline, 31)");
  });

  it("시간대 상한·검증·폴백이 iOS 에도 같다 (사장이 정하는 시간대, 2026-07-30)", () => {
    expect(MAX_SHIFT_SLOTS).toBe(6);
    expect(swift).toContain(`BU_MAX_SHIFT_SLOTS = ${MAX_SHIFT_SLOTS}`);
    expect(swift).toContain("func buNormalizeShiftSlots");
    expect(swift).toContain("func buEffectiveShiftSlots");
    // 사장 미설정 시 폴백 (빈 버튼 목록 금지)
    expect(effectiveShiftSlots([])).toHaveLength(3);
    expect(swift).toContain("saved.isEmpty");
    // 시간대는 payroll_settings.shift_slots 에 저장되고 RPC 가 내려준다
    const sql = readFileSync(
      join(HERE, "..", "..", "..", "supabase", "migrations", "20260730_000001_shift_availability.sql"), "utf8",
    );
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS shift_slots jsonb");
    expect(sql).toContain("'slots', COALESCE(v_slots");
  });

  it("폴백 프리셋이 이름·시간까지 같다 (순서 포함)", () => {
    const re = /BUShiftPreset\(key:\s*"([^"]+)",\s*ko:\s*"([^"]+)",\s*start:\s*"([^"]+)",\s*end:\s*"([^"]+)"\)/g;
    const found = [...swift.matchAll(re)].map((m) => ({ key: m[1], ko: m[2], start: m[3], end: m[4] }));
    expect(found.length, "iOS 에서 프리셋을 못 찾음 — regex 또는 파일 확인").toBeGreaterThan(0);
    expect(found).toEqual(SHIFT_PRESETS.map((p) => ({ key: p.key, ko: p.ko, start: p.start, end: p.end })));
  });
});

describe("신청 창 규칙 동기화", () => {
  it("마감 보정·다음 달 이동 로직이 iOS 에도 있다", () => {
    // 마감일이 그 달에 없으면 말일로 보정
    expect(swift).toContain("min(max(1, deadlineDay), lastDay(year:");
    // 마감 지나면 한 달 밀린다
    expect(swift).toContain("passed = d > effectiveDeadline");
    // 대상 달 = 마감 기준 달 + 1
    expect(swift).toContain("var targetM = anchorM + 1");
  });

  it("urgent 임계값(3일)이 같다", () => {
    expect(currentRequestWindow(new Date(2026, 4, 22), 25).urgent).toBe(true);
    expect(swift).toContain("urgent: daysLeft <= 3");
  });
});

describe("문구 동기화 — 정직성 문구는 한쪽만 빠지면 안 됨", () => {
  it("제출 요약 문구가 글자 그대로 같다", () => {
    expect(swift).toContain(submissionSummary([]));
    expect(swift).toContain('"\\(total)명 중 \\(done)명 제출 · \\(total - done)명 대기"');
    expect(swift).toContain('"직원 \\(total)명 모두 제출했어요."');
  });

  it("'시간 무관' 표기가 같다", () => {
    expect(availabilityTimeLabel({ start_time: null, end_time: null })).toBe("시간 무관");
    expect(swift).toContain('return "시간 무관"');
  });

  it("기간 라벨이 'N월' 형식으로 같다", () => {
    expect(periodLabel("2026-06")).toBe("6월");
    expect(swift).toContain('"\\(p.month)월"');
  });

  it("🔴 '희망 ≠ 확정' 안내가 양쪽 화면에 있다 (직원이 출근일을 오해하면 사고)", () => {
    expect(card).toContain("실제 근무는 사장님이 확정해요");
    expect(card).toContain("「근무표에 넣기」를 누른 것만 확정됩니다");
    const web = readFileSync(
      join(HERE, "..", "app", "lib", "components", "team", "ShiftAvailabilityCalendar.tsx"), "utf8",
    );
    expect(web).toContain("실제 근무는 사장님이 확정해요");
    expect(web).toContain("「근무표에 넣기」를 누른 것만 확정됩니다");
  });

  it("🔴 화면 문구에 인원 판정 어휘를 쓰지 않는다 (필요 인원을 앱이 모른다)", () => {
    // 주석은 이 금지 규칙을 *설명*하느라 그 단어를 담고 있다 → 주석 제거 후 문자열 리터럴만 검사
    const userFacingStrings = (src: string) =>
      src.replace(/\/\/.*$/gm, "").match(/"(?:[^"\\]|\\.)*"/g) ?? [];
    for (const [label, text] of [["iOS SSOT", swift], ["iOS 카드", card]] as const) {
      const bad = userFacingStrings(text).filter((s) => /인원 (부족|충분)|사람이 부족/.test(s));
      expect(bad, `${label} 화면 문구에 인원 판정 어휘가 있음`).toEqual([]);
    }
  });
});

describe("역할 경계 — 직원에게 사장 정보가 내려가지 않는다", () => {
  const sql = readFileSync(
    join(HERE, "..", "..", "..", "supabase", "migrations", "20260730_000001_shift_availability.sql"), "utf8",
  );

  it("🔴 제출 현황(누가 안 냈는지)은 사장만 — 직원은 본인 행만", () => {
    // 화면에서 안 그리는 것만으론 부족하다. 응답에 실리면 개발자도구에서 읽힌다.
    expect(sql).toContain("AND (v_is_owner OR m.member_user_id = v_uid)");
  });

  it("RPC 는 소속 확인 후에만 응답한다 (남의 가게 조회 차단)", () => {
    expect(sql).toContain("IF NOT (v_is_owner OR v_is_member) THEN");
    expect(sql).toContain("'reason', 'forbidden'");
  });

  it("SECURITY DEFINER 함수는 PUBLIC 권한을 회수한다 (2026-07-15 보안 감사 규칙)", () => {
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.get_shift_availability(uuid, text) FROM PUBLIC");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.get_shift_availability(uuid, text) TO authenticated");
  });

  it("희망 쓰기는 본인 행 + 소속 가게로만 (동료 대신 신청 차단)", () => {
    expect(sql).toContain("member_user_id = auth.uid()");
    expect(sql).toMatch(/WITH CHECK \(\s*member_user_id = auth\.uid\(\)/);
  });

  it("근무표 확정은 사장만 — 직원 화면에는 확정 버튼이 없다", () => {
    const web = readFileSync(
      join(HERE, "..", "app", "lib", "components", "team", "ShiftAvailabilityCalendar.tsx"), "utf8",
    );
    // 확정 CTA·마감일·시간대 편집은 모두 owner 모드 게이트 안에 있어야 한다
    expect(web).toContain('mode === "owner" && (selectedDay?.spans.length ?? 0) > 0');
    expect(web).toContain('mode === "owner" && editingSlots');
    expect(card).toContain("mode == .owner, let day, !day.spans.isEmpty");
  });
});
