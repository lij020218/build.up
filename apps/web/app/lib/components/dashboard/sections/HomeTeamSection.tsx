"use client";

/**
 * HomeTeamSection — 홈 "오늘 출근" 구획 (2026-09-12 신설 → 2026-09-14 개편).
 *  iOS TodayView 의 같은 구획 미러.
 *
 * 왜 조건부인가 (광고 분석 검토 결론):
 *  직원관리 광고가 랜딩 조회를 많이 만들었지만, 그 기간 가입자 9명 중 직원을 등록한 사람은 0명이었다.
 *  전체 사용자도 급여 명단 등록 0명. 시장도 기업체당 종사자 1.57명 — 나홀로 사장이 다수다.
 *  → 홈 전체를 직원 관리로 바꾸지 않는다. 대신 **직원이 실제로 있는 점주에게만** 올린다.
 *  직원 0명이면 렌더하지 않는다(빈 카드 금지 — 빈 카드는 "쓸 게 없다"는 신호만 준다).
 *
 * 2026-09-14: "함께 일하는 사람 N명" 한 줄 → 사람당 카드 한 장의 가로 줄.
 *  숫자는 오늘 무엇을 할지 알려주지 않는다. 아침에 필요한 건 누가 몇 시에 오는가와 왔는가다.
 *  판정은 packages/shared/src/team/today-roster.ts 가 하고(iOS 와 공용), 여기서는 그리기만 한다.
 */

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { ListSection, ListRow } from "../../ui/ListSection";
import { TodayRosterStrip } from "./TodayRosterStrip";
import {
  buildTodayRoster,
  visibleForHome,
  clockedInCount,
  expectedCount,
  toDateKey,
  type TodayRosterEntry,
  type RosterMemberInput,
} from "@foundone/shared";
import type { DashboardHook } from "../../../useDashboard";

// get_store_members RPC 는 member_user_id 로 내려준다(user_id 아님).
//  종전 코드는 인원 수만 세서 이 이름이 드러나지 않았다 — 2026-09-14 렌더 검증에서 발견.
type StoreMember = { member_user_id: string; name?: string | null; left_at?: string | null };
type Rule = { member_user_id: string; weekday: number; start_time: string; end_time: string; active: boolean; effective_until?: string | null };
type Exception = { member_user_id: string; work_date: string; start_time: string | null; end_time: string | null; is_off: boolean | null };
type Att = { member_user_id: string; clock_in_at: string; clock_out_at: string | null };
type Leave = { member_user_id: string; start_date: string; end_date: string; status: string };

export function HomeTeamSection({ d, ko }: { d: DashboardHook; ko: boolean }) {
  const [memberCount, setMemberCount] = useState(0);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [pendingAllowance, setPendingAllowance] = useState(0);
  const [roster, setRoster] = useState<TodayRosterEntry[]>([]);

  // 수동 급여 명단(operations-store)과 초대 직원(store_members)은 별개 모집단 — 큰 쪽을 쓴다.
  const manualCount = Array.isArray(d.employees) ? d.employees.length : 0;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.rpc("get_store_members" as never);
      if (!alive) return;
      const members = Array.isArray(data) ? (data as StoreMember[]) : [];
      setMemberCount(members.length);
      // 직원이 있을 때만 조회 — 나홀로 사장님에게 불필요한 왕복을 만들지 않는다.
      if (members.length === 0) return;

      const today = toDateKey(new Date());
      const [leaves, allowances, rules, exceptions, attendance] = await Promise.all([
        supabase.from("leave_requests").select("member_user_id, start_date, end_date, status"),
        supabase.from("allowance_requests").select("id").eq("status", "pending"),
        supabase.from("staff_schedule_rules").select("member_user_id, weekday, start_time, end_time, active, effective_until").eq("active", true),
        supabase.from("staff_schedules").select("member_user_id, work_date, start_time, end_time, is_off").eq("work_date", today),
        supabase.from("attendance_records").select("member_user_id, clock_in_at, clock_out_at").eq("work_date", today),
      ]);
      if (!alive) return;

      const leaveRows = (leaves.data ?? []) as Leave[];
      setPendingLeave(leaveRows.filter((l) => l.status === "pending").length);
      setPendingAllowance(Array.isArray(allowances.data) ? allowances.data.length : 0);

      const ruleRows = (rules.data ?? []) as Rule[];
      const exRows = (exceptions.data ?? []) as Exception[];

      // 퇴사자는 오늘 명단에 넣지 않는다(행은 법정 보존이라 RPC 가 계속 내려준다).
      const inputs: RosterMemberInput[] = members
        .filter((m) => !m.left_at)
        .map((m) => ({
          memberUserId: m.member_user_id,
          name: m.name?.trim() || (ko ? "직원" : "Staff"),
          rules: ruleRows.filter((r) => r.member_user_id === m.member_user_id),
          exceptions: exRows.filter((x) => x.member_user_id === m.member_user_id),
        }));

      setRoster(buildTodayRoster({
        dateStr: today,
        weekday: new Date().getDay(),
        members: inputs,
        attendance: ((attendance.data ?? []) as Att[]).map((a) => ({
          memberUserId: a.member_user_id,
          clockInAt: a.clock_in_at,
          clockOutAt: a.clock_out_at,
        })),
        leaves: leaveRows.map((l) => ({
          memberUserId: l.member_user_id,
          startDate: l.start_date,
          endDate: l.end_date,
          status: l.status,
        })),
      }));
    })();
    return () => { alive = false; };
  }, [ko]);

  const headcount = Math.max(memberCount, manualCount);
  if (headcount === 0) return null;

  const visible = visibleForHome(roster);
  const expected = expectedCount(visible);
  const pendingTotal = pendingLeave + pendingAllowance;
  const pendingSummary = [
    pendingLeave > 0 ? (ko ? `연차 ${pendingLeave}건` : `${pendingLeave} leave`) : null,
    pendingAllowance > 0 ? (ko ? `수당 ${pendingAllowance}건` : `${pendingAllowance} allowance`) : null,
  ].filter(Boolean).join(" · ");

  const goTeam = () => d.navigateToSurface("team");

  // "오늘 출근 · 3명 중 1명" — 제목이 곧 요약이라 따로 줄을 쓰지 않는다.
  const title = expected > 0
    ? (ko
        ? `오늘 출근 · ${expected}명 중 ${clockedInCount(visible)}명`
        : `Today · ${clockedInCount(visible)} of ${expected} in`)
    : (ko ? "오늘 출근" : "Today");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <button
          type="button"
          onClick={goTeam}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "15px", fontWeight: 600, color: "var(--primary)" }}
        >
          {ko ? "관리" : "Manage"}
        </button>
      </div>

      {visible.length === 0 ? (
        // 근무표가 아직 없을 수도 있다 — 0명이라 단정하지 않고 할 일을 준다.
        <ListSection>
          <ListRow
            first
            label={ko ? "오늘 근무 예정 없음" : "No one scheduled today"}
            subtitle={ko ? "근무표를 등록하면 여기에 출근 현황이 보입니다" : "Add a schedule to see today's status here"}
            onClick={goTeam}
          />
        </ListSection>
      ) : (
        <TodayRosterStrip entries={visible} ko={ko} onSelect={goTeam} />
      )}

      {pendingTotal > 0 && (
        <ListSection>
          <ListRow first label={ko ? "승인 대기" : "Pending approvals"} subtitle={pendingSummary} onClick={goTeam} />
        </ListSection>
      )}
    </div>
  );
}
