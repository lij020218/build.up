"use client";

/**
 * CustomerSummaryCard — 고객/회원 관리 요약 (비스타트업).
 *
 * 사용처: Tier 3 운영 관리 DeepDive 안.
 * 분기: businessCtx.showCustomerCard 가 true 일 때만 (소매·뷰티·피트니스 등).
 */

import type { DashboardHook } from "../../useDashboard";
import { getKstDate, shiftIsoDate } from "../../utils/business-day";

// ─── 고객/회원 관리 요약 (비스타트업) ────────────────────────────────────────

export function CustomerSummaryCard({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const mode = d.businessCtx.customerMode;
  const label = d.businessCtx.customerLabel;
  const members = (d.members ?? []) as Array<{ id: string; name: string; plan: string; fee: number; startDate: string; endDate: string }>;

  // 업종별 표시 정보
  const title = ko ? label.ko : label.en;

  // ⚠️ 2026-05-27 fix (버그 #3): endDate 는 "YYYY-MM-DD" 문자열.
  //   기존: `new Date(endDate) >= new Date()` → endDate 가 UTC 자정으로 파싱돼
  //   KST 09:00 부터 24:00 까지 9~15시간 동안 만료일=오늘인 회원이 active 에서 빠지고
  //   expiring 에서도 (diff > 0 조건) 빠져 stats 에서 완전히 사라지던 버그.
  //   해결: ISO 문자열끼리 직접 비교 (iOS BUMember.isActive 와 동일 패턴).
  const todayKst = getKstDate(new Date());
  const expiryThreshold = shiftIsoDate(todayKst, 7); // 7일 이내 만료 임박
  const activeMembers = members.filter((m) => !m.endDate || m.endDate >= todayKst);
  const expiringMembers = members.filter(
    (m) => m.endDate && m.endDate >= todayKst && m.endDate < expiryThreshold
  );

  const totalRevenue = activeMembers.reduce((s, m) => s + (m.fee ?? 0), 0);

  // 업종별 stat 구성
  const stats: Array<{ value: string | number; label: string; alert?: boolean }> = (() => {
    switch (mode) {
      case "membership":
        return [
          { value: activeMembers.length, label: ko ? "활성 회원" : "Active" },
          { value: expiringMembers.length, label: ko ? "만료 임박" : "Expiring", alert: expiringMembers.length > 0 },
          { value: totalRevenue > 0 ? fmt(totalRevenue) : "—", label: ko ? "월 매출" : "MRR" },
        ];
      case "appointment":
        return [
          { value: members.length, label: ko ? "고객 수" : "Clients" },
          { value: activeMembers.length, label: ko ? "단골" : "Regulars" },
          { value: "—", label: ko ? "이번 주 예약" : "Bookings" },
        ];
      case "repeat":
        return [
          { value: members.length, label: ko ? "등록 고객" : "Registered" },
          { value: activeMembers.length, label: ko ? "활성" : "Active" },
          { value: "—", label: ko ? "재방문율" : "Return %" },
        ];
      case "ecommerce":
        return [
          { value: members.length, label: ko ? "구매자" : "Buyers" },
          { value: "—", label: ko ? "재구매" : "Repeat" },
          { value: "—", label: ko ? "평균 객단가" : "AOV" },
        ];
      default:
        return [
          { value: members.length, label: ko ? "고객 수" : "Customers" },
          { value: activeMembers.length, label: ko ? "활성" : "Active" },
          { value: "—", label: ko ? "월 매출" : "Revenue" },
        ];
    }
  })();

  const emptyMsg: Record<string, { ko: string; en: string }> = {
    membership:  { ko: "회원을 등록하면 만료·갱신 현황을 추적할 수 있어요", en: "Add members to track expiry & renewal" },
    appointment: { ko: "고객을 등록하면 예약·시술 이력을 관리할 수 있어요", en: "Add clients to track visits & services" },
    repeat:      { ko: "단골을 등록하면 재방문 패턴을 볼 수 있어요", en: "Add regulars to see return patterns" },
    ecommerce:   { ko: "구매자를 등록하면 재구매율을 추적할 수 있어요", en: "Add buyers to track repeat purchases" },
    pipeline:    { ko: "리드를 등록하면 파이프라인을 추적할 수 있어요", en: "Add leads to track your pipeline" },
  };

  const emptyText = emptyMsg[mode] ?? emptyMsg.repeat;

  return (
    <article style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.10)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</span>
          <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(25,25,112,0.06)", color: "var(--primary)" }}>
            {members.length}{mode === "membership" ? (ko ? "명" : "") : (ko ? "명" : "")}
          </span>
        </div>
        <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
          {ko ? "관리하기 →" : "Manage →"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ padding: "10px", borderRadius: "10px", background: s.alert ? "rgba(255,59,48,0.04)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: s.alert ? "#b64c4c" : "#0f172a" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {members.length === 0 && (
        <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{
          width: "100%", padding: "12px", borderRadius: "10px",
          border: "1px dashed rgba(0,0,0,0.1)", background: "transparent",
          cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500,
        }}>
          {ko ? emptyText.ko : emptyText.en}
        </button>
      )}
    </article>
  );
}

