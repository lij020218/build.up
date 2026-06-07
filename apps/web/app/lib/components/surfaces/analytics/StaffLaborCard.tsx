"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import type { Employee } from "../../../stores/operations-store";

/** Format number as Korean currency */
const fmt = (n: number) =>
  n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}\ub9cc\uc6d0`
    : `${Math.round(n).toLocaleString()}\uc6d0`;

export function StaffLaborCard() {
  const d = useDashboardCtx();
  const {
    language, employees, monthlyCosts,
    empFormOpen, setEmpFormOpen, empEditId, setEmpEditId,
    empName, setEmpName, empWage, setEmpWage,
    empHours, setEmpHours, empInsured, setEmpInsured,
    handleEmpSave, handleEmpDelete, openEmpEdit,
  } = d;

  const ko = language === "ko";

  // Labor calculation
  const calcEmployee = (emp: Employee) => {
    const weeklyAllowance = emp.weeklyHours >= 15
      ? (emp.weeklyHours / 5) * emp.hourlyWage
      : 0;
    const monthlyWage = Math.round((emp.hourlyWage * emp.weeklyHours + weeklyAllowance) * 4.345);
    const insurance = emp.isInsured ? Math.round(monthlyWage * 0.1041) : 0;
    return { monthlyWage, insurance, total: monthlyWage + insurance };
  };
  const totalEmpBurden = employees.reduce((s, e) => s + calcEmployee(e).total, 0);
  const manualLabor = (monthlyCosts as { labor: number }).labor;
  const laborDiff = totalEmpBurden - manualLabor;

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      {/* \ud5e4\ub354 */}
      <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {ko ? "\uc9c1\uc6d0 \uc778\uac74\ube44" : "Staff Labor Cost"}
          </div>
          {employees.length > 0 && (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
              {ko ? `${employees.length}\uba85 \xb7 \uc6d4 \ucd1d\ubd80\ub2f4 ${fmt(totalEmpBurden)}` : `${employees.length} staff \xb7 Est. ${fmt(totalEmpBurden)}/mo`}
            </div>
          )}
        </div>
        <button type="button"
          onClick={() => { setEmpFormOpen(true); setEmpEditId(null); setEmpName(""); setEmpWage(""); setEmpHours(""); setEmpInsured(false); }}
          style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
          {ko ? "+ \uc9c1\uc6d0 \ucd94\uac00" : "+ Add staff"}
        </button>
      </div>

      {/* monthlyCosts.labor \ube44\uad50 \uc54c\ub9bc */}
      {employees.length > 0 && manualLabor > 0 && Math.abs(laborDiff) > 10000 && (
        <div style={{ margin: "0 22px 12px", padding: "10px 14px", borderRadius: "12px", background: laborDiff > 0 ? "rgba(25,25,112,0.07)" : "rgba(0,122,255,0.06)", border: `0.5px solid ${laborDiff > 0 ? "rgba(25,25,112,0.2)" : "rgba(0,122,255,0.15)"}` }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: laborDiff > 0 ? "#191970" : "#007aff", lineHeight: 1.5 }}>
            {ko
              ? laborDiff > 0
                ? `\ube44\uc6a9 \uce74\ub4dc \uc778\uac74\ube44(${fmt(manualLabor)})\uac00 \uc2e4\uc81c \uc608\uc0c1(${fmt(totalEmpBurden)})\ubcf4\ub2e4 ${fmt(laborDiff)} \ub0ae\uac8c \uc785\ub825\ub428`
                : `\ube44\uc6a9 \uce74\ub4dc \uc778\uac74\ube44(${fmt(manualLabor)})\uac00 \uc2e4\uc81c \uc608\uc0c1(${fmt(totalEmpBurden)})\ubcf4\ub2e4 ${fmt(-laborDiff)} \ub192\uac8c \uc785\ub825\ub428`
              : laborDiff > 0
                ? `Cost card labor (${fmt(manualLabor)}) is ${fmt(laborDiff)} lower than estimated`
                : `Cost card labor (${fmt(manualLabor)}) is ${fmt(-laborDiff)} higher than estimated`}
          </div>
        </div>
      )}

      {/* \uc9c1\uc6d0 \ubaa9\ub85d */}
      {employees.length === 0 ? (
        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko ? "\uc9c1\uc6d0\uc744 \ub4f1\ub85d\ud558\uba74 \uc6d4 \uc778\uac74\ube44\uc640 4\ub300\ubcf4\ud5d8 \uc0ac\uc5c5\uc8fc \ubd80\ub2f4\uc744 \uc790\ub3d9 \uacc4\uc0b0\ud569\ub2c8\ub2e4." : "Register staff to auto-calculate monthly wages and employer insurance costs."}
          </div>
        </div>
      ) : (
        <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
          {employees.map((emp, idx) => {
            const c = calcEmployee(emp);
            const hasAllowance = emp.weeklyHours >= 15;
            return (
              <div key={emp.id} style={{ padding: "14px 22px", borderBottom: idx < employees.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                {/* \uc774\ub984 \ud589 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,122,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#007aff" }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{emp.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                        {ko
                          ? `\uc2dc\uae09 ${emp.hourlyWage.toLocaleString()}\uc6d0 \xb7 \uc8fc ${emp.weeklyHours}\uc2dc\uac04${hasAllowance ? " \xb7 \uc8fc\ud734\uc218\ub2f9 \ud3ec\ud568" : ""}`
                          : `\u20a9${emp.hourlyWage.toLocaleString()}/hr \xb7 ${emp.weeklyHours}h/wk${hasAllowance ? " \xb7 incl. weekly holiday" : ""}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => openEmpEdit(emp)} style={{ fontSize: "12px", color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                      {ko ? "\uc218\uc815" : "Edit"}
                    </button>
                    <button type="button" onClick={() => handleEmpDelete(emp.id)} style={{ fontSize: "12px", color: "#b64c4c", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                      {ko ? "\uc0ad\uc81c" : "Del"}
                    </button>
                  </div>
                </div>
                {/* \ube44\uc6a9 \ubd84\ud574 \ud589 */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                  {[
                    { label: ko ? "\uc6d4 \uae09\uc5ec" : "Monthly pay", value: fmt(c.monthlyWage), color: "var(--primary)" },
                    ...(emp.isInsured ? [{ label: ko ? "4\ub300\ubcf4\ud5d8" : "Insurance", value: fmt(c.insurance), color: "var(--muted)" }] : []),
                    { label: ko ? "\ucd1d\ubd80\ub2f4" : "Total", value: fmt(c.total), color: "#007aff" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "5px 10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "2px" }}>{item.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {/* \ud569\uacc4 \ud589 */}
          <div style={{ padding: "14px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.015)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
              {ko ? "\uc6d4 \ucd1d \uc778\uac74\ube44 \ubd80\ub2f4" : "Total Monthly Burden"}
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.4px" }}>
              {fmt(totalEmpBurden)}
            </div>
          </div>
        </div>
      )}

      {/* \ucd94\uac00/\uc218\uc815 \ud3fc */}
      {empFormOpen && (
        <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            {empEditId ? (ko ? "\uc9c1\uc6d0 \uc218\uc815" : "Edit Staff") : (ko ? "\uc9c1\uc6d0 \ucd94\uac00" : "Add Staff")}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
            <input type="text" placeholder={ko ? "\uc774\ub984 (\uc608: \uae40\ubbfc\uc9c0)" : "Name"} value={empName} onChange={e => setEmpName(e.target.value)}
              aria-label={ko ? "\uc9c1\uc6d0 \uc774\ub984" : "Employee name"}
              style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "\uc2dc\uae09 (\uc6d0)" : "Hourly wage (\u20a9)"}</div>
                <input type="text" inputMode="numeric" placeholder="10,320" value={empWage} onChange={e => setEmpWage(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={ko ? "\uc2dc\uae09 (\uc6d0)" : "Hourly wage (KRW)"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "\uc8fc\uac04 \uadfc\ubb34\uc2dc\uac04" : "Hours/week"}</div>
                <input type="text" inputMode="numeric" placeholder="20" value={empHours} onChange={e => setEmpHours(e.target.value.replace(/[^0-9.]/g, ""))}
                  aria-label={ko ? "\uc8fc\uac04 \uadfc\ubb34\uc2dc\uac04" : "Weekly work hours"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={empInsured} onChange={e => setEmpInsured(e.target.checked)} style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "13px", color: "var(--primary)" }}>
                {ko ? "4\ub300\ubcf4\ud5d8 \uac00\uc785 (\uc6d4 60\uc2dc\uac04 \uc774\uc0c1 \uadfc\ubb34 \uc2dc \ud544\uc218)" : "4 major insurances (required if \u226560h/month)"}
              </span>
            </label>
            {empWage && empHours && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(0,122,255,0.06)", border: "0.5px solid rgba(0,122,255,0.15)" }}>
                {(() => {
                  const wage = parseInt(empWage, 10) || 0;
                  const hours = parseFloat(empHours) || 0;
                  const allowance = hours >= 15 ? (hours / 5) * wage : 0;
                  const monthly = Math.round((wage * hours + allowance) * 4.345);
                  const autoInsured = hours * 4.345 >= 60;
                  const ins = (empInsured || autoInsured) ? Math.round(monthly * 0.1041) : 0;
                  return (
                    <div style={{ fontSize: "12px", color: "#007aff", lineHeight: 1.7 }}>
                      <div>{ko ? `\uc6d4 \uae09\uc5ec: ${(monthly / 10000).toFixed(1)}\ub9cc\uc6d0` : `Monthly wage: ${(monthly / 10000).toFixed(1)}\ub9cc\uc6d0`}</div>
                      {ins > 0 && <div>{ko ? `4\ub300\ubcf4\ud5d8(\uc0ac\uc5c5\uc8fc): ${(ins / 10000).toFixed(1)}\ub9cc\uc6d0` : `Insurance: ${(ins / 10000).toFixed(1)}\ub9cc\uc6d0`}</div>}
                      <div style={{ fontWeight: 700 }}>{ko ? `\ucd1d\ubd80\ub2f4: ${((monthly + ins) / 10000).toFixed(1)}\ub9cc\uc6d0` : `Total: ${((monthly + ins) / 10000).toFixed(1)}\ub9cc\uc6d0`}</div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={handleEmpSave}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                {empEditId ? (ko ? "\uc218\uc815 \uc644\ub8cc" : "Save changes") : (ko ? "\ucd94\uac00" : "Add")}
              </button>
              <button type="button" onClick={() => { setEmpFormOpen(false); setEmpEditId(null); }}
                style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "\ucde8\uc18c" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
