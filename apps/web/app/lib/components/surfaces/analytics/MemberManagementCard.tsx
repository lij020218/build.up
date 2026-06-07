"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import type { Member } from "../../../stores/operations-store";
import { getKstDate } from "../../../utils/business-day";

/** Format number as Korean currency */
const fmt = (n: number) =>
  n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}\ub9cc\uc6d0`
    : `${Math.round(n).toLocaleString()}\uc6d0`;

export function MemberManagementCard() {
  const d = useDashboardCtx();
  const {
    language, members, setMembers, industryCategoryId, businessCtx,
    memFormOpen, setMemFormOpen, memName, setMemName,
    memPlan, setMemPlan, memFee, setMemFee, memEnd, setMemEnd,
  } = d;

  const ko = language === "ko";

  if (!businessCtx.isRecurringRevenue) return null;

  const saveMembers = (list: Member[]) => {
    setMembers(list);
    try { localStorage.setItem("members", JSON.stringify(list)); } catch { /* ignore */ }
  };

  const todayStr = getKstDate(new Date());
  const in7days = getKstDate(new Date(Date.now() + 7 * 86400000));

  const enriched = members.map(m => ({
    ...m,
    status: m.endDate < todayStr ? "expired" as const : m.endDate <= in7days ? "expiring" as const : "active" as const,
  }));

  const activeCount = enriched.filter(m => m.status === "active").length;
  const expiringCount = enriched.filter(m => m.status === "expiring").length;
  const monthlyRevenue = enriched.filter(m => m.status !== "expired").reduce((s, m) => s + m.fee, 0);

  const planPresets = industryCategoryId === "fitness"
    ? (ko ? ["1\uac1c\uc6d4", "3\uac1c\uc6d4", "6\uac1c\uc6d4", "12\uac1c\uc6d4", "PT 10\ud68c", "PT 20\ud68c"] : ["1 Month", "3 Months", "6 Months", "12 Months", "PT 10x", "PT 20x"])
    : industryCategoryId === "space"
      ? (ko ? ["\uc2dc\uac04\uad8c", "\uc6d4\uc815\uc561", "\uc8fc\uac04\uad8c", "\ub2e8\uae30"] : ["Hourly", "Monthly", "Weekly", "Short-term"])
      : (ko ? ["\uc6d4 \uc218\uac15", "\ubd84\uae30 \uc218\uac15", "\ub2e8\uacfc", "\ud2b9\uac15"] : ["Monthly", "Quarterly", "Single", "Special"]);

  const statusColor = (s: string) => s === "expired" ? "#b64c4c" : s === "expiring" ? "#191970" : "#1d3557";
  const statusLabel = (s: string) => s === "expired" ? (ko ? "\ub9cc\ub8cc" : "Expired") : s === "expiring" ? (ko ? "\ub9cc\ub8cc\uc784\ubc15" : "Expiring") : (ko ? "\uc815\uc0c1" : "Active");

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      {/* \ud5e4\ub354 */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
              {industryCategoryId === "fitness" ? (ko ? "\ud68c\uc6d0 \uad00\ub9ac" : "Member Management")
                : industryCategoryId === "space" ? (ko ? "\uc774\uc6a9\uc790 \uad00\ub9ac" : "User Management")
                : (ko ? "\uc218\uac15\uc0dd \uad00\ub9ac" : "Student Management")}
            </div>
            {members.length > 0 && (
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                {ko
                  ? `\ucd1d ${members.length}\uba85 \xb7 \ud65c\uc131 ${activeCount}\uba85 \xb7 \uc774\ub2ec \uc608\uc0c1 ${fmt(monthlyRevenue * 10000)}`
                  : `${members.length} total \xb7 ${activeCount} active \xb7 ${fmt(monthlyRevenue * 10000)} this month`}
              </div>
            )}
          </div>
          <button type="button"
            onClick={() => { setMemFormOpen(true); setMemName(""); setMemPlan(""); setMemFee(""); setMemEnd(""); }}
            style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
            {ko ? "+ \ub4f1\ub85d" : "+ Add"}
          </button>
        </div>
      </div>

      {/* \ub9cc\ub8cc \uc784\ubc15 \uacbd\ubcf4 */}
      {expiringCount > 0 && (
        <div style={{ padding: "10px 22px", background: "rgba(25,25,112,0.06)", borderBottom: "0.5px solid rgba(25,25,112,0.12)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#191970" }}>
            {ko ? `7\uc77c \ub0b4 \ub9cc\ub8cc ${expiringCount}\uba85 \u2014 \uac31\uc2e0 \uc548\ub0b4 \ud544\uc694` : `${expiringCount} member${expiringCount > 1 ? "s" : ""} expiring in 7 days`}
          </div>
        </div>
      )}

      {/* \uc694\uc57d 3-col */}
      {members.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
          {[
            { label: ko ? "\uc804\uccb4" : "Total", value: `${members.length}\uba85`, color: "inherit" },
            { label: ko ? "\ub9cc\ub8cc\uc784\ubc15" : "Expiring", value: `${expiringCount}\uba85`, color: expiringCount > 0 ? "#191970" : "inherit" },
            { label: ko ? "\uc774\ub2ec \uc218\uc785" : "Revenue", value: fmt(monthlyRevenue * 10000), color: "#007aff" },
          ].map((col, i) => (
            <div key={col.label} style={{ padding: "12px 12px", borderLeft: i > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{col.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* \ube48 \uc0c1\ud0dc */}
      {members.length === 0 && !memFormOpen && (
        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko
              ? "\uc218\uac15\uc0dd/\ud68c\uc6d0\uc744 \ub4f1\ub85d\ud558\uba74 \ub9cc\ub8cc\uc77c \ucd94\uc801, \uc774\ub2ec \uc218\uc785 \uacc4\uc0b0, \uac31\uc2e0 \uc548\ub0b4 \uc54c\ub9bc \uad00\ub9ac\uac00 \uac00\ub2a5\ud569\ub2c8\ub2e4."
              : "Register members to track expiry dates, calculate monthly revenue, and manage renewal reminders."}
          </div>
        </div>
      )}

      {/* \ud68c\uc6d0 \ubaa9\ub85d */}
      {enriched.length > 0 && (
        <div>
          {enriched.map((m, idx) => {
            const daysLeft = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000);
            return (
              <div key={m.id} style={{ padding: "12px 22px", borderTop: idx > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: m.status === "expired" ? 0.5 : 1 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.2px" }}>{m.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor(m.status), background: `${statusColor(m.status)}18`, padding: "2px 7px", borderRadius: "20px" }}>
                      {statusLabel(m.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                    {m.plan} \xb7 {fmt(m.fee * 10000)} \xb7 {m.endDate}
                    {m.status !== "expired" && daysLeft >= 0 && (
                      <span style={{ color: m.status === "expiring" ? "#191970" : "var(--muted)" }}>
                        {" "}{ko ? `(D-${daysLeft})` : `(${daysLeft}d left)`}
                      </span>
                    )}
                  </div>
                </div>
                <button type="button"
                  onClick={() => saveMembers(members.filter(x => x.id !== m.id))}
                  aria-label={ko ? `${m.name} \uc0ad\uc81c` : `Delete ${m.name}`}
                  style={{ fontSize: "11px", color: "#b64c4c", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                  {ko ? "\uc0ad\uc81c" : "Del"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* \ub4f1\ub85d \ud3fc */}
      {memFormOpen && (
        <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.09)", background: "rgba(0,0,0,0.018)", display: "flex", flexDirection: "column" as const, gap: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>{ko ? "\uc218\uac15\uc0dd/\ud68c\uc6d0 \ub4f1\ub85d" : "Register Member"}</div>
          <input type="text" placeholder={ko ? "\uc774\ub984" : "Name"}
            value={memName} onChange={e => setMemName(e.target.value)}
            aria-label={ko ? "\ud68c\uc6d0 \uc774\ub984" : "Member name"}
            style={{ fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            {planPresets.map(preset => (
              <button key={preset} type="button"
                onClick={() => setMemPlan(preset)}
                style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "14px", border: `1px solid ${memPlan === preset ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: memPlan === preset ? "rgba(0,122,255,0.09)" : "transparent", color: memPlan === preset ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                {preset}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" inputMode="numeric" placeholder={ko ? "\uc218\uac15\ub8cc (\ub9cc\uc6d0)" : "Fee (10K\u20a9)"}
              value={memFee} onChange={e => setMemFee(e.target.value.replace(/[^0-9]/g, ""))}
              aria-label={ko ? "\uc218\uac15\ub8cc (\ub9cc\uc6d0)" : "Membership fee (10K KRW)"}
              style={{ flex: 1, fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
            <input type="date" value={memEnd} onChange={e => setMemEnd(e.target.value)}
              aria-label={ko ? "\ub9cc\ub8cc\uc77c" : "Expiry date"}
              style={{ flex: 1, fontSize: "13px", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)", borderRadius: "9px", background: "rgba(0,0,0,0.02)", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button"
              disabled={!memName.trim() || !memEnd}
              onClick={() => {
                if (!memName.trim() || !memEnd) return;
                const newMember = { id: `m_${Date.now()}`, name: memName.trim(), plan: memPlan || (ko ? "\uae30\ud0c0" : "Other"), fee: parseInt(memFee) || 0, startDate: todayStr, endDate: memEnd };
                saveMembers([...members, newMember]);
                setMemFormOpen(false);
              }}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: memName.trim() && memEnd ? "#007aff" : "rgba(0,0,0,0.08)", color: memName.trim() && memEnd ? "#fff" : "var(--muted)", border: "none", fontSize: "14px", fontWeight: 700, cursor: memName.trim() && memEnd ? "pointer" : "default" }}>
              {ko ? "\ub4f1\ub85d" : "Register"}
            </button>
            <button type="button" onClick={() => setMemFormOpen(false)}
              style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              {ko ? "\ucde8\uc18c" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
