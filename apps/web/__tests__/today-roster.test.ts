/**
 * 오늘의 근무 명단 SSOT 테스트 — 홈 "오늘 출근" 카드의 판정.
 *
 * 여기서 지키는 것: 근무·급여가 걸린 판정이라 "기록이 근무표를 이긴다"는 원칙과
 * 연차 우선순위, 그리고 이른 시간이 왼쪽에 오는 정렬.
 */

import { describe, it, expect } from "vitest";
import {
  buildTodayRoster,
  visibleForHome,
  clockedInCount,
  expectedCount,
  type BuildTodayRosterArgs,
} from "@foundone/shared";

const DATE = "2026-09-14"; // 월요일
const WEEKDAY = 1;

function member(id: string, name: string, opts: {
  weekday?: number;
  start?: string;
  end?: string;
  off?: boolean;
} = {}) {
  const { weekday = WEEKDAY, start = "09:00:00", end = "18:00:00", off = false } = opts;
  return {
    memberUserId: id,
    name,
    rules: off ? [] : [{ weekday, start_time: start, end_time: end }],
    exceptions: [],
  };
}

function build(over: Partial<BuildTodayRosterArgs> = {}) {
  return buildTodayRoster({
    dateStr: DATE,
    weekday: WEEKDAY,
    members: [],
    attendance: [],
    leaves: [],
    ...over,
  });
}

describe("buildTodayRoster — 상태 판정", () => {
  it("근무 배정만 있고 기록이 없으면 scheduled", () => {
    const [e] = build({ members: [member("u1", "김가나")] });
    expect(e.status).toBe("scheduled");
    expect(e.startTime).toBe("09:00:00");
    expect(e.clockInAt).toBeNull();
  });

  it("출근 기록이 있고 퇴근 전이면 working", () => {
    const [e] = build({
      members: [member("u1", "김가나")],
      attendance: [{ memberUserId: "u1", clockInAt: "2026-09-14T00:02:00Z", clockOutAt: null }],
    });
    expect(e.status).toBe("working");
    expect(e.clockInAt).toBe("2026-09-14T00:02:00Z");
  });

  it("퇴근까지 찍었으면 done", () => {
    const [e] = build({
      members: [member("u1", "김가나")],
      attendance: [{
        memberUserId: "u1",
        clockInAt: "2026-09-14T00:02:00Z",
        clockOutAt: "2026-09-14T09:05:00Z",
      }],
    });
    expect(e.status).toBe("done");
  });

  it("근무 배정이 없어도 실제로 찍었으면 나온다 — 기록이 근무표를 이긴다(대타)", () => {
    const [e] = build({
      members: [member("u1", "김가나", { off: true })],
      attendance: [{ memberUserId: "u1", clockInAt: "2026-09-14T02:00:00Z", clockOutAt: null }],
    });
    expect(e.status).toBe("working");
    // 배정이 없으므로 시간은 비어 있다 — 없는 근무표를 지어내지 않는다.
    expect(e.startTime).toBeNull();
    expect(e.startMinutes).toBeNull();
  });

  it("배정도 기록도 없으면 off", () => {
    const [e] = build({ members: [member("u1", "김가나", { off: true })] });
    expect(e.status).toBe("off");
  });

  it("승인된 연차는 근무표보다 우선", () => {
    const [e] = build({
      members: [member("u1", "김가나")],
      leaves: [{ memberUserId: "u1", startDate: DATE, endDate: DATE, status: "approved" }],
    });
    expect(e.status).toBe("leave");
  });

  it("승인 대기 연차는 아직 근무 예정 — 확정처럼 보여주지 않는다", () => {
    const [e] = build({
      members: [member("u1", "김가나")],
      leaves: [{ memberUserId: "u1", startDate: DATE, endDate: DATE, status: "pending" }],
    });
    expect(e.status).toBe("scheduled");
  });

  it("연차 기간이 오늘을 덮으면(여러 날) 적용된다", () => {
    const [e] = build({
      members: [member("u1", "김가나")],
      leaves: [{ memberUserId: "u1", startDate: "2026-09-12", endDate: "2026-09-16", status: "approved" }],
    });
    expect(e.status).toBe("leave");
  });

  it("다른 요일 규칙은 오늘 근무가 아니다", () => {
    const [e] = build({ members: [member("u1", "김가나", { weekday: 3 })] });
    expect(e.status).toBe("off");
  });

  it("그 날짜 휴무 예외행은 반복 규칙을 덮는다", () => {
    const [e] = build({
      members: [{
        memberUserId: "u1",
        name: "김가나",
        rules: [{ weekday: WEEKDAY, start_time: "09:00:00", end_time: "18:00:00" }],
        exceptions: [{ work_date: DATE, is_off: true }],
      }],
    });
    expect(e.status).toBe("off");
  });

  it("그 날짜 시간 예외행이 반복 규칙보다 우선", () => {
    const [e] = build({
      members: [{
        memberUserId: "u1",
        name: "김가나",
        rules: [{ weekday: WEEKDAY, start_time: "09:00:00", end_time: "18:00:00" }],
        exceptions: [{ work_date: DATE, start_time: "13:00:00", end_time: "22:00:00" }],
      }],
    });
    expect(e.startTime).toBe("13:00:00");
    expect(e.startMinutes).toBe(13 * 60);
  });

  it("비활성 규칙은 근무로 새지 않는다", () => {
    const [e] = build({
      members: [{
        memberUserId: "u1",
        name: "김가나",
        rules: [{ weekday: WEEKDAY, start_time: "09:00:00", end_time: "18:00:00", active: false }],
        exceptions: [],
      }],
    });
    expect(e.status).toBe("off");
  });
});

describe("buildTodayRoster — 정렬", () => {
  it("이른 시간이 먼저 (시간대 순으로 왼쪽부터)", () => {
    const out = build({
      members: [
        member("u1", "저녁", { start: "17:00:00", end: "23:00:00" }),
        member("u2", "아침", { start: "07:00:00", end: "12:00:00" }),
        member("u3", "점심", { start: "11:00:00", end: "17:00:00" }),
      ],
    });
    expect(out.map((e) => e.name)).toEqual(["아침", "점심", "저녁"]);
  });

  it("시간 없는 사람은 뒤로, 그 안에서는 이름순", () => {
    const out = build({
      members: [
        member("u1", "나휴무", { off: true }),
        member("u2", "가휴무", { off: true }),
        member("u3", "근무자", { start: "09:00:00", end: "18:00:00" }),
      ],
    });
    expect(out.map((e) => e.name)).toEqual(["근무자", "가휴무", "나휴무"]);
  });
});

describe("홈 표시 규칙", () => {
  const roster = () => build({
    members: [
      member("u1", "출근함"),
      member("u2", "연차자"),
      member("u3", "휴무자", { off: true }),
      member("u4", "예정자", { start: "14:00:00", end: "20:00:00" }),
    ],
    attendance: [{ memberUserId: "u1", clockInAt: "2026-09-14T00:02:00Z", clockOutAt: null }],
    leaves: [{ memberUserId: "u2", startDate: DATE, endDate: DATE, status: "approved" }],
  });

  it("휴무자는 홈에서 뺀다 — 오늘과 무관", () => {
    expect(visibleForHome(roster()).map((e) => e.name)).not.toContain("휴무자");
  });

  it("연차자는 남긴다 — '오늘 왜 안 보이지'의 답이 화면에 있어야 한다", () => {
    expect(visibleForHome(roster()).map((e) => e.name)).toContain("연차자");
  });

  it("출근 인원과 예정 인원 — 연차는 분모에서 빠진다", () => {
    const r = roster();
    expect(clockedInCount(r)).toBe(1);
    expect(expectedCount(r)).toBe(2); // 출근함 + 예정자 (연차자·휴무자 제외)
  });

  it("아무도 없으면 빈 배열 — 빈 카드를 만들지 않는다", () => {
    expect(visibleForHome(build())).toEqual([]);
  });
});
