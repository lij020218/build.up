"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { getFullToolKit } from "@build-up/shared";
import { MIDNIGHT, MIDNIGHT_SOFT, MIDNIGHT_BORDER } from "./StartupStageShell";

export function StartupToolkitPanel() {
  const d = useDashboardCtx();
  const {
    language,
    currentStage,
    selectedIndustryId,
  } = d;

  const [toolsOpen, setToolsOpen] = useState(false);

  const stageIdMap: Record<string, string> = {
    startup_foundation: "startup-foundation", customer_discovery: "customer-discovery",
    mvp_build: "mvp-build", launch_gtm: "launch-gtm", growth_engine: "growth-engine",
    company_setup: "company-setup", fundraising_readiness: "fundraising-readiness",
    venture_certification: "venture-certification",
  };
  const mappedStageId = stageIdMap[currentStage.code as string];
  if (!mappedStageId) return null;
  const toolkit = getFullToolKit(mappedStageId, selectedIndustryId);
  if (toolkit.essential.length === 0) return null;
  const ko = language === "ko";

  const toolRenderer = (tool: typeof toolkit.essential[0]) => (
    <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "12px",
      background: tool.recommended ? MIDNIGHT_SOFT : "rgba(0,0,0,0.01)",
      border: tool.recommended ? `1px solid ${MIDNIGHT_BORDER}` : "1px solid rgba(0,0,0,0.04)",
      textDecoration: "none", color: "inherit",
    }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: tool.aiPowered ? MIDNIGHT_SOFT : "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {tool.aiPowered
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MIDNIGHT} strokeWidth="1.6"><path d="M12 2l2 4h4l-3 3 1 5-4-3-4 3 1-5-3-3h4l2-4z"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "1px" }}>
          <span style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{tool.name}</span>
          {tool.aiPowered && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: MIDNIGHT_SOFT, color: MIDNIGHT }}>AI</span>}
          {tool.koreanSupport && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: MIDNIGHT_SOFT, color: MIDNIGHT }}>KR</span>}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{ko ? tool.description.ko : tool.description.en}</div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: MIDNIGHT, marginTop: "2px" }}>{tool.pricing}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </a>
  );

  const preview = toolkit.essential.slice(0, 3);
  const rest = toolkit.essential.slice(3);
  const hasMore = rest.length > 0;

  return (
    <div style={{ marginBottom: "16px", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, overflow: "hidden", background: "white" }}>
      {/* 헤더 + 미리보기 3개 (항상 보임) */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MIDNIGHT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 650, color: MIDNIGHT, letterSpacing: "0.04em" }}>{ko ? "추천 도구 · AI" : "Tools"}</span>
          <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.25)" }}>{ko ? `월 ${toolkit.monthlyCost}` : `${toolkit.monthlyCost}/mo`}</span>
        </div>
        <div style={{ display: "grid", gap: "5px" }}>
          {preview.map(toolRenderer)}
        </div>
      </div>
      {/* 더보기 (3개 초과 시) */}
      {hasMore && (
        <div style={{ padding: "8px 14px 12px" }}>
          <button type="button" onClick={() => setToolsOpen(!toolsOpen)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
            padding: "7px", borderRadius: "8px", border: `1px solid ${MIDNIGHT_BORDER}`,
            background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: MIDNIGHT,
          }}>
            {toolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${rest.length}개 더보기` : `+${rest.length} more`)}
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: toolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
              <path d="M3 5l4 4 4-4" stroke={MIDNIGHT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {toolsOpen && (
            <div style={{ display: "grid", gap: "5px", marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
              {rest.map(toolRenderer)}
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT, display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "2px", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke={MIDNIGHT} strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke={MIDNIGHT} strokeWidth="1.4" strokeLinecap="round"/></svg>
                <span style={{ fontSize: "12px", color: MIDNIGHT, lineHeight: 1.55 }}>{ko ? toolkit.aiTip.ko : toolkit.aiTip.en}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {!hasMore && <div style={{ height: "12px" }} />}
    </div>
  );
}
