import { describe, it, expect } from "vitest";
import {
  currentRequestWindow,
  isPeriodEditable,
  periodDates,
  deadlineDayLabel,
  DEFAULT_SHIFT_REQUEST_DEADLINE_DAY,
  normalizeShiftSlots,
  effectiveShiftSlots,
  hasOwnerSlots,
  MAX_SHIFT_SLOTS,
  periodLabel,
  parsePeriod,
  groupByDate,
  pendingSubmitters,
  submissionSummary,
  availabilityTimeLabel,
  type ShiftAvailability,
} from "../../../packages/shared/src/team/shift-availability";

/**
 * 희망 근무 신청 창(window) 가드 (2026-07-30).
 *
 *  이 로직이 틀리면 직원이 **엉뚱한 달에 신청**하거나 마감 후에도 고칠 수 있게 된다.
 *  사장님 예시("5월 마지막 주면 6월분")를 그대로 테스트로 박아둔다.
 */

describe("사장이 정하는 근무 시간대 (2026-07-30)", () => {
  it("정상 항목은 통과", () => {
    expect(normalizeShiftSlots([
      { label: "오픈", start: "07:00", end: "12:00" },
      { label: "마감", start: "17:00", end: "23:00" },
    ])).toEqual([
      { label: "오픈", start: "07:00", end: "12:00" },
      { label: "마감", start: "17:00", end: "23:00" },
    ]);
  });

  it("🔴 깨진 항목은 버린다 — 잘못된 시간대가 버튼으로 뜨면 그 시간이 근무표에 들어간다", () => {
    expect(normalizeShiftSlots([
      { label: "", start: "07:00", end: "12:00" },          // 이름 없음
      { label: "오픈", start: "25:00", end: "12:00" },        // 시각 범위 초과
      { label: "미들", start: "1200", end: "18:00" },         // 형식 오류
      { label: "저녁", start: "18:00", end: "18:00" },        // 시작=종료
      { label: "마감", start: "17:00", end: "23:00" },        // 유효
    ])).toEqual([{ label: "마감", start: "17:00", end: "23:00" }]);
  });

  it("자정을 넘기는 시간대도 유효 (야간 업장)", () => {
    expect(normalizeShiftSlots([{ label: "야간", start: "22:00", end: "02:00" }]))
      .toEqual([{ label: "야간", start: "22:00", end: "02:00" }]);
  });

  it("초가 붙은 DB 값도 받는다 (time 컬럼은 09:00:00)", () => {
    expect(normalizeShiftSlots([{ label: "오전", start: "09:00:00", end: "13:00:00" }]))
      .toEqual([{ label: "오전", start: "09:00", end: "13:00" }]);
  });

  it("최대 6개까지만", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ label: `${i}`, start: "09:00", end: "10:00" }));
    expect(normalizeShiftSlots(many)).toHaveLength(MAX_SHIFT_SLOTS);
    expect(MAX_SHIFT_SLOTS).toBe(6);
  });

  it("배열이 아니거나 쓰레기면 빈 목록 (화면이 깨지지 않게)", () => {
    expect(normalizeShiftSlots(null)).toEqual([]);
    expect(normalizeShiftSlots("nope")).toEqual([]);
    expect(normalizeShiftSlots([null, 3, "x"])).toEqual([]);
  });

  it("미설정이면 일반 예시로 폴백 — 빈 버튼 목록을 보여주지 않는다", () => {
    expect(hasOwnerSlots([])).toBe(false);
    expect(effectiveShiftSlots([])).toHaveLength(3);
    const own = [{ label: "오픈", start: "07:00", end: "12:00" }];
    expect(hasOwnerSlots(own)).toBe(true);
    expect(effectiveShiftSlots(own)).toEqual(own);   // 사장이 정하면 폴백은 안 섞인다
  });
});

describe("기본 마감 = 말일 (사장님 지적 2026-07-30: 25일은 너무 빡빡)", () => {
  it("기본값은 31 = 말일 의도", () => {
    expect(DEFAULT_SHIFT_REQUEST_DEADLINE_DAY).toBe(31);
    expect(deadlineDayLabel(31)).toBe("말일");
    expect(deadlineDayLabel(25)).toBe("25일");
  });

  it("🔴 5/31 까지 6월분 신청 가능 (사장님이 말한 바로 그 경계)", () => {
    const w = currentRequestWindow(new Date(2026, 4, 31));   // 2026-05-31, 기본 마감
    expect(w.period).toBe("2026-06");
    expect(w.closesOn).toBe("2026-05-31");
    expect(w.daysLeft).toBe(0);
    expect(isPeriodEditable("2026-06", new Date(2026, 4, 31))).toBe(true);
  });

  it("5/20 이면 6월분 신청 중 — 11일 남음 (25일 마감이면 5일이었다)", () => {
    const w = currentRequestWindow(new Date(2026, 4, 20));
    expect(w.period).toBe("2026-06");
    expect(w.daysLeft).toBe(11);
    expect(w.urgent).toBe(false);
  });

  it("6/1 이 되면 6월분은 닫히고 7월분이 열린다 (마감 6/30)", () => {
    const w = currentRequestWindow(new Date(2026, 5, 1));
    expect(w.period).toBe("2026-07");
    expect(w.closesOn).toBe("2026-06-30");
    expect(isPeriodEditable("2026-06", new Date(2026, 5, 1))).toBe(false);
  });

  it("31일이 없는 달은 말일로 보정 — 2월은 2/28 까지", () => {
    const w = currentRequestWindow(new Date(2027, 1, 28));   // 2027-02-28
    expect(w.closesOn).toBe("2027-02-28");
    expect(w.period).toBe("2027-03");
    expect(w.daysLeft).toBe(0);
  });

  it("윤년 2월은 2/29 까지", () => {
    const w = currentRequestWindow(new Date(2028, 1, 29));
    expect(w.closesOn).toBe("2028-02-29");
    expect(w.period).toBe("2028-03");
  });

  it("12/31 이면 1월분 마지막 날, 1/1 이면 2월분 시작", () => {
    expect(currentRequestWindow(new Date(2026, 11, 31)).period).toBe("2027-01");
    expect(currentRequestWindow(new Date(2027, 0, 1)).period).toBe("2027-02");
  });
});

describe("currentRequestWindow — 대상 달·마감 (사장이 앞당긴 경우)", () => {
  it("사장님 예시: 5월 말주(5/26 이후 아님, 5/20) → 6월분 신청", () => {
    const w = currentRequestWindow(new Date(2026, 4, 20), 25); // 2026-05-20
    expect(w.period).toBe("2026-06");
    expect(w.closesOn).toBe("2026-05-25");
    expect(w.daysLeft).toBe(5);
  });

  it("마감일 당일은 아직 열려 있다 (그날까지 받는다)", () => {
    const w = currentRequestWindow(new Date(2026, 4, 25), 25);
    expect(w.period).toBe("2026-06");
    expect(w.daysLeft).toBe(0);
    expect(w.urgent).toBe(true);
  });

  it("🔴 마감 다음 날은 6월분이 닫히고 7월분이 열린다", () => {
    const w = currentRequestWindow(new Date(2026, 4, 26), 25);
    expect(w.period).toBe("2026-07");
    expect(w.closesOn).toBe("2026-06-25");
  });

  it("연말 경계 — 12/28(마감25 지남)이면 다음해 2월분", () => {
    const w = currentRequestWindow(new Date(2026, 11, 28), 25);
    expect(w.period).toBe("2027-02");
    expect(w.closesOn).toBe("2027-01-25");
  });

  it("연말 경계 — 12/10이면 1월분", () => {
    const w = currentRequestWindow(new Date(2026, 11, 10), 25);
    expect(w.period).toBe("2027-01");
    expect(w.closesOn).toBe("2026-12-25");
  });

  it("마감일 31일 + 2월 → 그 달 말일로 보정 (없는 날짜 만들지 않음)", () => {
    const w = currentRequestWindow(new Date(2027, 1, 10), 31); // 2027-02-10, 2월은 28일
    expect(w.closesOn).toBe("2027-02-28");
    expect(w.period).toBe("2027-03");
  });

  it("마감일 1일 — 2일부터는 다음 사이클", () => {
    expect(currentRequestWindow(new Date(2026, 4, 1), 1).period).toBe("2026-06");
    expect(currentRequestWindow(new Date(2026, 4, 2), 1).period).toBe("2026-07");
  });

  it("urgent 는 3일 이내에만", () => {
    expect(currentRequestWindow(new Date(2026, 4, 22), 25).urgent).toBe(true);
    expect(currentRequestWindow(new Date(2026, 4, 21), 25).urgent).toBe(false);
  });
});

describe("isPeriodEditable — 마감 후 수정 차단", () => {
  it("열린 기간만 수정 가능", () => {
    expect(isPeriodEditable("2026-06", new Date(2026, 4, 20), 25)).toBe(true);
    expect(isPeriodEditable("2026-06", new Date(2026, 4, 26), 25)).toBe(false);
    // 이미 지난 달·먼 미래도 불가
    expect(isPeriodEditable("2026-05", new Date(2026, 4, 20), 25)).toBe(false);
    expect(isPeriodEditable("2026-08", new Date(2026, 4, 20), 25)).toBe(false);
  });
});

describe("기간 유틸", () => {
  it("periodDates — 그 달 날짜 전부, 말일 정확", () => {
    expect(periodDates("2026-02")).toHaveLength(28);
    expect(periodDates("2028-02")).toHaveLength(29); // 윤년
    expect(periodDates("2026-06")[0]).toBe("2026-06-01");
    expect(periodDates("2026-06").at(-1)).toBe("2026-06-30");
  });

  it("잘못된 기간은 조용히 빈 값 (화면이 깨지지 않게)", () => {
    expect(parsePeriod("2026-13")).toBeNull();
    expect(parsePeriod("206-06")).toBeNull();
    expect(periodDates("nope")).toEqual([]);
    expect(periodLabel("nope")).toBe("nope");
  });

  it("periodLabel — 한국어는 'N월'", () => {
    expect(periodLabel("2026-06")).toBe("6월");
  });
});

describe("groupByDate — 타임라인 데이터", () => {
  const rows: ShiftAvailability[] = [
    { member_user_id: "a", name: "가", work_date: "2026-06-01", start_time: "12:00", end_time: "15:00", note: null, mine: true },
    { member_user_id: "b", name: "나", work_date: "2026-06-01", start_time: "15:00", end_time: "20:00", note: null },
    { member_user_id: "c", name: "다", work_date: "2026-06-01", start_time: null, end_time: null, note: null },
  ];

  it("날짜별로 묶고, 시간 있는 사람만 구간으로", () => {
    const d = groupByDate(rows).get("2026-06-01")!;
    expect(d.entries).toHaveLength(3);
    expect(d.spans).toHaveLength(2);
    expect(d.anyTimeCount).toBe(1);
    expect(d.spans[0].span).toEqual({ startMin: 720, endMin: 900 });
    expect(d.spans[0].mine).toBe(true);
  });

  it("🔴 colorIndex 는 명단(entries) 순번 — 시간 무관 참가자 때문에 색이 밀리면 안 된다", () => {
    // 실렌더에서 발견: 나(시간무관) + 박준호(13–18) 인 날, 막대 색이 '나'의 색으로 칠해졌다
    const d = groupByDate([
      { member_user_id: "me", name: "나", work_date: "2026-06-03", start_time: null, end_time: null, note: null, mine: true },
      { member_user_id: "b", name: "박준호", work_date: "2026-06-03", start_time: "13:00", end_time: "18:00", note: null },
    ]).get("2026-06-03")!;
    expect(d.spans).toHaveLength(1);
    expect(d.spans[0].name).toBe("박준호");
    // 박준호는 명단 2번째(index 1) → 막대도 1번 색
    expect(d.spans[0].colorIndex).toBe(1);
    expect(d.entries[d.spans[0].colorIndex].member_user_id).toBe(d.spans[0].member_user_id);
  });

  it("야간 근무는 자정 넘겨 계산 (22–02시가 음수가 되지 않게)", () => {
    const d = groupByDate([
      { member_user_id: "a", name: "가", work_date: "2026-06-02", start_time: "22:00", end_time: "02:00", note: null },
    ]).get("2026-06-02")!;
    expect(d.spans[0].span).toEqual({ startMin: 1320, endMin: 1560 });
  });
});

describe("표시 문구 — 없는 정보를 만들지 않는다", () => {
  it("시간 미지정은 '시간 무관'", () => {
    expect(availabilityTimeLabel({ start_time: null, end_time: null })).toBe("시간 무관");
  });

  it("시간 지정은 구간 표기", () => {
    expect(availabilityTimeLabel({ start_time: "12:00", end_time: "15:00" })).toBe("12:00–15:00");
  });

  it("🔴 제출 요약은 인원 판정('부족'·'충분')을 하지 않는다 — 필요 인원을 앱이 모른다", () => {
    const subs = [
      { member_user_id: "a", name: "가", submitted_at: "2026-05-20T00:00:00Z", day_count: 10 },
      { member_user_id: "b", name: "나", submitted_at: null, day_count: 0 },
    ];
    const s = submissionSummary(subs);
    expect(s).toBe("2명 중 1명 제출 · 1명 대기");
    expect(s).not.toMatch(/부족|충분|모자|위험/);
    expect(pendingSubmitters(subs).map((x) => x.name)).toEqual(["나"]);
  });

  it("전원 제출 / 직원 없음", () => {
    expect(submissionSummary([])).toBe("등록된 직원이 없어요.");
    expect(submissionSummary([{ member_user_id: "a", name: "가", submitted_at: "2026-05-20T00:00:00Z", day_count: 3 }]))
      .toBe("직원 1명 모두 제출했어요.");
  });
});
