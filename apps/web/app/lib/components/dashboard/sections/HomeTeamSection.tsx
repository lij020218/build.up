"use client";

/**
 * HomeTeamSection — 홈 "직원" 구획 (2026-09-12). iOS TodayView 의 같은 구획 미러.
 *
 * 왜 조건부인가 (광고 분석 검토 결론):
 *  직원관리 광고가 랜딩 조회를 많이 만들었지만, 그 기간 가입자 9명 중 직원을 등록한 사람은 0명이었다.
 *  전체 사용자도 급여 명단 등록 0명. 시장도 기업체당 종사자 1.57명 — 나홀로 사장이 다수다.
 *  → 홈 전체를 직원 관리로 바꾸지 않는다. 대신 **직원이 실제로 있는 점주에게만** 올린다.
 *  직원 0명이면 렌더하지 않는다(빈 카드 금지 — 빈 카드는 "쓸 게 없다"는 신호만 준다).
 *
 * 승인 대기가 있으면 그게 첫 줄 — 오늘 사장님이 눌러야 할 것이기 때문.
 */

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { ListSection, ListRow } from "../../ui/ListSection";
import type { DashboardHook } from "../../../useDashboard";

type StoreMember = { user_id: string };

export function HomeTeamSection({ d, ko }: { d: DashboardHook; ko: boolean }) {
  const [memberCount, setMemberCount] = useState(0);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [pendingAllowance, setPendingAllowance] = useState(0);

  // 수동 급여 명단(operations-store)과 초대 직원(store_members)은 별개 모집단 — 큰 쪽을 쓴다.
  const manualCount = Array.isArray(d.employees) ? d.employees.length : 0;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.rpc("get_store_members" as never);
      if (!alive) return;
      const members = Array.isArray(data) ? (data as StoreMember[]) : [];
      setMemberCount(members.length);
      // 승인 대기는 직원이 있을 때만 조회 — 나홀로 사장님에게 불필요한 왕복을 만들지 않는다.
      if (members.length === 0) return;
      const [leaves, allowances] = await Promise.all([
        supabase.from("leave_requests").select("id").eq("status", "pending"),
        supabase.from("allowance_requests").select("id").eq("status", "pending"),
      ]);
      if (!alive) return;
      setPendingLeave(Array.isArray(leaves.data) ? leaves.data.length : 0);
      setPendingAllowance(Array.isArray(allowances.data) ? allowances.data.length : 0);
    })();
    return () => { alive = false; };
  }, []);

  const headcount = Math.max(memberCount, manualCount);
  if (headcount === 0) return null;

  const pendingTotal = pendingLeave + pendingAllowance;
  const pendingSummary = [
    pendingLeave > 0 ? (ko ? `연차 ${pendingLeave}건` : `${pendingLeave} leave`) : null,
    pendingAllowance > 0 ? (ko ? `수당 ${pendingAllowance}건` : `${pendingAllowance} allowance`) : null,
  ].filter(Boolean).join(ko ? " · " : " · ");

  const goTeam = () => d.navigateToSurface("team");

  return (
    <ListSection title={ko ? "직원" : "Team"} actionLabel={ko ? "관리" : "Manage"} onAction={goTeam}>
      {pendingTotal > 0 && (
        <ListRow first label={ko ? "승인 대기" : "Pending approvals"} subtitle={pendingSummary} onClick={goTeam} />
      )}
      <ListRow
        first={pendingTotal === 0}
        label={ko ? "함께 일하는 사람" : "People working with you"}
        value={ko ? `${headcount}명` : `${headcount}`}
      />
    </ListSection>
  );
}
