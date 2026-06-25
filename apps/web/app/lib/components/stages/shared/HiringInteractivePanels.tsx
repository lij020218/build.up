"use client";

/**
 * HiringInteractivePanels — hiring-setup 단계의 인터랙티브 위젯(웹).
 *
 * StageContentRenderer 가 ref 로 매핑(플랫폼별 유일 비공유점):
 *  - HiringCalculatorPanel → ref="hiringCalculator" : 시급·시간 → 사업주 4대보험 포함 실부담 시뮬
 *  - HiringTogglePanel      → ref="soloOperator"/"hiring*Done" : 라벨 토글(웹은 표시용 — 게이팅은 generic taskMap footer)
 *
 * 원본: offline/HiringSetupStage.tsx(계산기 래퍼·토글). 시각·동작 보존.
 */

import { useState } from "react";
import { Calculator } from "lucide-react";
import { HiringCostCalculator } from "../../knowledge/HiringCostCalculator";
import { MIDNIGHT, MIDNIGHT_BORDER } from "../startup/StartupStageShell";

export function HiringCalculatorPanel({ ko, catId }: { ko: boolean; catId: string }) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.08)", boxShadow: "0 1px 3px rgba(15,23,42,0.04)", padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(25,25,112,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: MIDNIGHT }}>
          <Calculator size={13} strokeWidth={1.6} />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
          {ko ? "실제 사업주 부담 — 시뮬레이션" : "Real employer cost — simulator"}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginBottom: 14 }}>
        {ko
          ? "시급·근무시간을 입력하면 시급 외에 4대보험·퇴직금까지 포함한 「실제 월 부담」 이 자동 계산됩니다. 계약서 사인 전 정확한 인건비 인지가 첫 달 자금 계획의 핵심입니다."
          : "Enter wage/hours to see total monthly cost incl. 4-insurance and severance. Know real labor cost before signing — critical for month-1 cash plan."}
      </div>
      <HiringCostCalculator ko={ko} industryCategoryId={catId} />
    </div>
  );
}

/** 라벨 토글(웹 표시용 — local state). subtitle 있으면 2줄. */
export function HiringTogglePanel({ label, subtitle }: { label: string; subtitle?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div style={{ background: "white", borderRadius: 14, border: `1px solid ${MIDNIGHT_BORDER}`, padding: "14px 16px" }}>
      <button type="button" onClick={() => setOn((v) => !v)} style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
        <div style={{ flexShrink: 0, width: 40, height: 24, borderRadius: 999, background: on ? MIDNIGHT : "rgba(0,0,0,0.15)", position: "relative", transition: "background 0.2s" }}>
          <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{label}</div>
          {subtitle && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", marginTop: "2px", lineHeight: 1.45 }}>{subtitle}</div>}
        </div>
      </button>
    </div>
  );
}
