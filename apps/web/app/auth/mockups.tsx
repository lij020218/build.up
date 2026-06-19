"use client";

import React from "react";
import type { Language } from "@foundone/shared";

export type MockupProps = {
  card: React.CSSProperties;
  muted: string;
  subtle: string;
  accent: string;
  isLight: boolean;
  lang: Language;
};

/* ─── Mockup router ─── */
export function MockupByIndex({ index, isLight, lang }: { index: number; isLight: boolean; lang: Language }) {
  const card = {
    borderRadius: 16,
    background: isLight ? "#fff" : "rgba(255,255,255,0.06)",
    border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
    overflow: "hidden" as const
  };
  const muted = isLight ? "#86868b" : "rgba(255,255,255,0.4)";
  const subtle = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const accent = "#3b5c8c";

  const p = { card, muted, subtle, accent, isLight, lang };
  if (index === 0) return <MockupOnboarding {...p} />;
  if (index === 1) return <MockupRoadmap {...p} />;
  if (index === 2) return <MockupGuides {...p} />;
  if (index === 3) return <MockupAnalysis {...p} />;
  if (index === 4) return <MockupMarket {...p} />;
  if (index === 5) return <MockupMentoring {...p} />;
  return <MockupOperations {...p} />;
}

/* ── Mockup 1: Roadmap stage flow ── */
export function MockupRoadmap({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const stages = ko
    ? [
        { n: "1", title: "업종 선택", status: "done" },
        { n: "2", title: "사업자 등록", status: "done" },
        { n: "3", title: "인허가 확인", status: "current" },
        { n: "4", title: "입지 분석", status: "locked" },
        { n: "5", title: "공급업체 선정", status: "locked" }
      ]
    : [
        { n: "1", title: "Choose Industry", status: "done" },
        { n: "2", title: "Register Business", status: "done" },
        { n: "3", title: "Verify Permits", status: "current" },
        { n: "4", title: "Location Analysis", status: "locked" },
        { n: "5", title: "Select Suppliers", status: "locked" }
      ];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* phone frame */}
      <div style={{ ...card, padding: 0, borderRadius: 24, position: "relative" }}>
        {/* top bar */}
        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: muted }}>{ko ? "내 로드맵" : "My Roadmap"}</span>
          <span style={{ fontSize: 12, color: accent, fontWeight: 500 }}>40%</span>
        </div>
        {/* progress bar */}
        <div style={{ margin: "0 20px 16px", height: 4, borderRadius: 2, background: subtle }}>
          <div style={{ width: "40%", height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #1d3557, #30d158)" }} />
        </div>
        {/* stage list */}
        <div style={{ padding: "0 20px 20px", display: "grid", gap: 8 }}>
          {stages.map((s) => {
            const done = s.status === "done";
            const current = s.status === "current";
            const locked = s.status === "locked";
            return (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: current
                    ? (isLight ? "rgba(59,92,140,0.06)" : "rgba(59,92,140,0.12)")
                    : subtle,
                  border: current ? `1px solid ${isLight ? "rgba(59,92,140,0.2)" : "rgba(59,92,140,0.3)"}` : "1px solid transparent",
                  opacity: locked ? 0.4 : 1
                }}
              >
                {/* circle */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    background: done ? "#1d3557" : current ? accent : (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"),
                    color: done || current ? "#fff" : muted
                  }}
                >
                  {done ? "✓" : s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: current ? 600 : 500, color: locked ? muted : undefined }}>
                    {s.title}
                  </div>
                </div>
                {current && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: accent, whiteSpace: "nowrap" }}>
                    {ko ? "진행 중" : "In progress"}
                  </div>
                )}
                {done && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#1d3557" }}>
                    {ko ? "완료" : "Done"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 2: Guide cards with freshness ── */
export function MockupGuides({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const guides = ko
    ? [
        { domain: "인허가", color: "#191970", title: "음식점 영업 신고 절차", source: "식품의약품안전처", date: "2026-02-15", fresh: true },
        { domain: "세무", color: "#5B8CFF", title: "간이과세자 부가세 신고 가이드", source: "국세청 홈택스", date: "2026-01-20", fresh: true },
        { domain: "대출", color: "#1d3557", title: "소상공인 정책자금 신청 방법", source: "소상공인시장진흥공단", date: "2025-08-10", fresh: false }
      ]
    : [
        { domain: "Permits", color: "#191970", title: "Restaurant Business License Process", source: "MFDS", date: "2026-02-15", fresh: true },
        { domain: "Tax", color: "#5B8CFF", title: "Simplified Tax Filing Guide", source: "NTS HomeTax", date: "2026-01-20", fresh: true },
        { domain: "Loans", color: "#1d3557", title: "SME Policy Loan Application", source: "SEMAS", date: "2025-08-10", fresh: false }
      ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 12 }}>
      {guides.map((g) => (
        <div key={g.title} style={{ ...card, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* color bar */}
          <div style={{ width: 4, height: 48, borderRadius: 2, background: g.color, flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: g.color }}>{g.domain}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: 6,
                  background: g.fresh ? (isLight ? "rgba(29,53,87,0.1)" : "rgba(29,53,87,0.15)") : (isLight ? "rgba(182,76,76,0.08)" : "rgba(182,76,76,0.15)"),
                  color: g.fresh ? "#1d3557" : "#b64c4c"
                }}
              >
                {g.fresh ? (ko ? "최신" : "Fresh") : (ko ? "재검토 필요" : "Review needed")}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{g.title}</div>
            <div style={{ fontSize: 12, color: muted }}>
              {ko ? "출처" : "Source"}: {g.source} · {g.date}
            </div>
          </div>
          <span style={{ fontSize: 13, color: accent, fontWeight: 500, flexShrink: 0, marginTop: 14 }}>{ko ? "읽기 →" : "Read →"}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mockup 3: Finance simulation + contract ── */
export function MockupAnalysis({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* finance card */}
      <div style={{ ...card, padding: 20, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{ko ? "재무 시뮬레이션" : "Financial Simulation"}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 8,
              background: isLight ? "rgba(25,25,112,0.1)" : "rgba(25,25,112,0.15)",
              color: "#191970"
            }}
          >
            {ko ? "중간 위험" : "Medium Risk"}
          </span>
        </div>
        {/* metric grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: ko ? "생존 가능" : "Runway", value: "8.2" + (ko ? "개월" : "mo") },
            { label: ko ? "손익분기" : "Break-even", value: ko ? "5개월차" : "Month 5" },
            { label: ko ? "BEP 매출" : "BEP Revenue", value: "1,850" + (ko ? "만" : "K") }
          ].map((m) => (
            <div key={m.label} style={{ padding: "12px 10px", borderRadius: 10, background: subtle, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 2 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: muted }}>{m.label}</div>
            </div>
          ))}
        </div>
        {/* mini chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, padding: "0 4px" }}>
          {[30, 45, 38, 52, 64, 58, 72, 80, 76, 88, 95, 100].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 3,
                background: i < 5
                  ? (isLight ? "rgba(182,76,76,0.25)" : "rgba(182,76,76,0.35)")
                  : (isLight ? "rgba(29,53,87,0.3)" : "rgba(29,53,87,0.4)")
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: muted }}>
          <span>{ko ? "개업" : "Start"}</span>
          <span>{ko ? "12개월" : "12 months"}</span>
        </div>
      </div>

      {/* AI interpretation card */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: "0.04em", marginBottom: 8 }}>AI {ko ? "해석" : "Interpretation"}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
          {ko ? "초기 자금 여유가 낮아\n신중한 지출이 필요합니다" : "Low initial buffer\nrequires careful spending"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(ko
            ? ["월세 비중 줄일 수 있는 입지 검토", "6개월 내 BEP 도달 목표 설정"]
            : ["Review locations with lower rent ratio", "Target break-even within 6 months"]
          ).map((t) => (
            <div key={t} style={{ fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#1d3557", flexShrink: 0 }}>→</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* contract card */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#b64c4c", letterSpacing: "0.04em", marginBottom: 8 }}>{ko ? "계약서 분석" : "Contract Scan"}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
          {ko ? "2개 위험 조항 감지" : "2 risk clauses detected"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(ko
            ? ["권리금 회수 조항 누락", "중도 해지 시 위약금 과다"]
            : ["Missing goodwill recovery clause", "Excessive early termination penalty"]
          ).map((t) => (
            <div key={t} style={{ fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#b64c4c", flexShrink: 0 }}>!</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 4: Stage mentoring guide ── */
export function MockupMentoring({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24 }}>
        {/* header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #5B8CFF, #1D3557)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14 }}>3</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: muted, fontWeight: 500 }}>{ko ? "3단계" : "Stage 3"}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{ko ? "인허가 확인" : "Verify Permits"}</div>
            </div>
          </div>
        </div>

        {/* action items */}
        <div style={{ padding: "0 20px 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 10 }}>
            {ko ? "실행 항목" : "Action Items"}
          </div>
          {(ko
            ? [
                { icon: "📋", text: "영업 신고서 작성 및 제출", done: true },
                { icon: "🏥", text: "보건증 발급 (보건소 방문)", done: true },
                { icon: "🔥", text: "소방 시설 점검 신청", done: false },
                { icon: "📐", text: "시설 기준 자가 체크리스트", done: false }
              ]
            : [
                { icon: "📋", text: "File business registration form", done: true },
                { icon: "🏥", text: "Get health certificate", done: true },
                { icon: "🔥", text: "Request fire safety inspection", done: false },
                { icon: "📐", text: "Facility standards checklist", done: false }
              ]
          ).map((item) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: `1px solid ${isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"}`
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: item.done ? "#1d3557" : subtle,
                  border: item.done ? "none" : `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                  fontSize: 11,
                  color: item.done ? "#fff" : "transparent",
                  flexShrink: 0
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, opacity: item.done ? 0.5 : 1, textDecoration: item.done ? "line-through" : "none" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* warning card */}
        <div style={{ margin: "4px 20px 16px", padding: "12px 14px", borderRadius: 12, background: isLight ? "rgba(182,76,76,0.05)" : "rgba(182,76,76,0.1)", border: `1px solid ${isLight ? "rgba(182,76,76,0.1)" : "rgba(182,76,76,0.15)"}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#b64c4c", marginBottom: 4 }}>{ko ? "주의" : "Warning"}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: muted }}>
            {ko ? "영업 신고 전 소방 점검이 완료되어야 합니다. 순서를 확인하세요." : "Fire inspection must be completed before filing. Check the order."}
          </div>
        </div>

        {/* expert referral */}
        <div style={{ margin: "0 20px 20px", padding: "12px 14px", borderRadius: 12, background: subtle }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: accent, marginBottom: 4 }}>{ko ? "전문가 연결" : "Expert Referral"}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: muted }}>
            {ko ? "관할 구청 위생과에 사전 상담을 신청하면 누락 서류를 미리 확인할 수 있습니다." : "Pre-consult with your district hygiene office to check for missing documents."}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero: mini dashboard preview ── */
export function HeroDashboardPreview({ lang }: { lang: Language }) {
  const ko = lang === "ko";
  return (
    <div
      style={{
        position: "relative",
        marginTop: 56,
        width: "100%",
        maxWidth: 900,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(4px)",
        padding: 20,
        overflow: "hidden"
      }}
    >
      {/* glow */}
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(circle, rgba(91,140,255,0.2), transparent 70%)", pointerEvents: "none" }} />

      {/* top nav mockup */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(ko ? ["홈", "현재 단계", "로드맵", "펀딩", "분석"] : ["Home", "Current", "Roadmap", "Funding", "Analytics"]).map((tab, i) => (
          <div key={tab} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: i === 0 ? "rgba(59,92,140,0.15)" : "rgba(255,255,255,0.05)", color: i === 0 ? "#5B8CFF" : "rgba(255,255,255,0.4)" }}>
            {tab}
          </div>
        ))}
      </div>

      {/* two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
        {/* left: main card */}
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 18 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "로드맵 중심 창업 OS" : "Roadmap-first startup OS"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {ko ? "카페 창업 로드맵" : "Cafe Startup Roadmap"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>
            {ko ? "5단계 중 3단계 진행 중" : "Stage 3 of 5 in progress"}
          </div>
          {/* progress */}
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}>
            <div style={{ width: "60%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #5B8CFF, #1d3557)" }} />
          </div>
          {/* now / next */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(59,92,140,0.08)", border: "1px solid rgba(59,92,140,0.15)" }}>
              <div style={{ fontSize: 10, color: "#5B8CFF", fontWeight: 600, marginBottom: 4 }}>NOW</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ko ? "인허가 확인" : "Verify Permits"}</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 4 }}>NEXT</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{ko ? "입지 분석" : "Location Analysis"}</div>
            </div>
          </div>
        </div>

        {/* right: stats stack */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>{ko ? "진행 현황" : "Progress"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { v: "60%", l: ko ? "진행률" : "Progress" },
                { v: "3/5", l: ko ? "완료" : "Done" },
                { v: ko ? "카페" : "Cafe", l: ko ? "업종" : "Industry" },
                { v: "5,000" + (ko ? "만" : "K"), l: ko ? "자본금" : "Capital" }
              ].map((m) => (
                <div key={m.l} style={{ textAlign: "center", padding: "8px 4px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>{ko ? "최근 알림" : "Recent Alert"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#191970", flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{ko ? "보건증 유효기간 확인 필요" : "Health certificate expiry check needed"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 5: Smart Onboarding flow ── */
export function MockupOnboarding({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24 }}>
        {/* step indicator */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 8 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
                background: n < 3 ? "#1d3557" : n === 3 ? accent : subtle,
                color: n <= 3 ? "#fff" : muted,
                border: n > 3 ? `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}` : "none"
              }}>
                {n < 3 ? "✓" : n}
              </div>
              {n < 4 && <div style={{ width: 24, height: 2, borderRadius: 1, background: n < 3 ? "#1d3557" : subtle }} />}
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: muted }}>{ko ? "3 / 4" : "3 of 4"}</span>
        </div>

        {/* question area */}
        <div style={{ padding: "24px 24px 8px" }}>
          <div style={{ fontSize: 11, color: accent, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8 }}>
            {ko ? "맞춤 설정" : "PERSONALIZATION"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {ko ? "예상 자본금은 얼마인가요?" : "What's your estimated capital?"}
          </div>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 20 }}>
            {ko ? "선택에 따라 재무 시뮬레이션과 단계별 권장 사항이 달라집니다." : "This affects your financial simulation and stage-specific recommendations."}
          </div>
        </div>

        {/* option buttons */}
        <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(ko
            ? [{ v: "3,000만 이하", sub: "소규모 시작" }, { v: "3,000~5,000만", sub: "일반적 규모" }, { v: "5,000만~1억", sub: "중간 투자" }, { v: "1억 이상", sub: "대규모 투자" }]
            : [{ v: "Under 30M", sub: "Small start" }, { v: "30M~50M", sub: "Standard" }, { v: "50M~100M", sub: "Medium" }, { v: "Over 100M", sub: "Large" }]
          ).map((opt, i) => (
            <div key={opt.v} style={{
              padding: "14px 14px",
              borderRadius: 12,
              background: i === 1 ? (isLight ? "rgba(59,92,140,0.06)" : "rgba(59,92,140,0.12)") : subtle,
              border: i === 1 ? `1.5px solid ${accent}` : `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.v}</div>
              <div style={{ fontSize: 11, color: muted }}>{opt.sub}</div>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: muted }}>{ko ? "이전" : "Back"}</span>
          <div style={{ padding: "10px 24px", borderRadius: 10, background: accent, color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {ko ? "다음" : "Next"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 6: Market & Location Intelligence ── */
export function MockupMarket({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const areas = ko
    ? [
        { name: "강남역 12번 출구", score: 92, pop: "유동인구 多", rent: "높음", grade: "A+" },
        { name: "합정역 3번 출구", score: 78, pop: "중간", rent: "중간", grade: "B+" },
        { name: "성수동 카페거리", score: 85, pop: "유동인구 多", rent: "중상", grade: "A" }
      ]
    : [
        { name: "Gangnam Stn. Exit 12", score: 92, pop: "High traffic", rent: "High", grade: "A+" },
        { name: "Hapjeong Stn. Exit 3", score: 78, pop: "Medium", rent: "Medium", grade: "B+" },
        { name: "Seongsu Cafe Street", score: 85, pop: "High traffic", rent: "Mid-high", grade: "A" }
      ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24, overflow: "hidden" }}>
        {/* map placeholder */}
        <div style={{
          height: 160, position: "relative",
          background: isLight
            ? "linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 50%, #c3d8f7 100%)"
            : "linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #142a52 100%)"
        }}>
          {/* pins */}
          {[{ left: "28%", top: "35%" }, { left: "55%", top: "55%" }, { left: "72%", top: "30%" }].map((pos, i) => (
            <div key={i} style={{ position: "absolute", ...pos, transform: "translate(-50%, -100%)" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: i === 0 ? "#1d3557" : accent, border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 12, left: 16, fontSize: 11, fontWeight: 600, color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)", background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
            {ko ? "상권 분석 지도" : "Market Analysis Map"}
          </div>
        </div>

        {/* location list */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 12 }}>
            {ko ? "추천 입지" : "Recommended Locations"}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {areas.map((a, i) => (
              <div key={a.name} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center",
                padding: "12px 14px", borderRadius: 12,
                background: i === 0 ? (isLight ? "rgba(29,53,87,0.05)" : "rgba(29,53,87,0.08)") : subtle,
                border: i === 0 ? `1px solid ${isLight ? "rgba(29,53,87,0.15)" : "rgba(29,53,87,0.2)"}` : `1px solid ${isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"}`
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)", color: a.score >= 90 ? "#1d3557" : a.score >= 80 ? accent : muted }}>
                  {a.score}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: muted }}>{a.pop} · {ko ? "월세" : "Rent"}: {a.rent}</div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  background: a.grade.startsWith("A") ? (isLight ? "rgba(29,53,87,0.1)" : "rgba(29,53,87,0.15)") : (isLight ? "rgba(59,92,140,0.08)" : "rgba(59,92,140,0.12)"),
                  color: a.grade.startsWith("A") ? "#1d3557" : accent
                }}>
                  {a.grade}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 7: Operations Dashboard (post-launch) ── */
export function MockupOperations({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ ...card, padding: 20, borderRadius: 24 }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#1d3557" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1d3557" }}>{ko ? "운영 중" : "Open & Running"}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "모링가 카페 성수" : "Moringa Cafe Seongsu"}</div>
          </div>
          <div style={{ fontSize: 11, color: muted }}>{ko ? "2026년 3월" : "March 2026"}</div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { v: "2,340" + (ko ? "만" : "K"), l: ko ? "이번 달 매출" : "Monthly Sales", c: "#1d3557" },
            { v: "78" + (ko ? "만" : "K"), l: ko ? "일평균 매출" : "Daily Average", c: accent },
            { v: "1.2" + (ko ? "만" : "K"), l: ko ? "객단가" : "Avg. Ticket", c: "#191970" }
          ].map((m) => (
            <div key={m.l} style={{ padding: "14px 10px", borderRadius: 12, background: subtle, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>

        {/* health bars */}
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          {[
            { label: ko ? "프라임 코스트" : "Prime Cost", value: 62, target: 65, color: "#1d3557" },
            { label: ko ? "식재료 비율" : "Food Cost Ratio", value: 34, target: 35, color: "#191970" },
            { label: ko ? "인건비 비율" : "Labor Cost", value: 28, target: 30, color: "#5B8CFF" }
          ].map((bar) => (
            <div key={bar.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{bar.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: bar.value <= bar.target ? "#1d3557" : "#b64c4c" }}>{bar.value}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: subtle, position: "relative" }}>
                <div style={{ width: `${bar.value}%`, height: "100%", borderRadius: 3, background: bar.color }} />
                <div style={{ position: "absolute", left: `${bar.target}%`, top: -2, width: 2, height: 10, borderRadius: 1, background: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* daily sales mini chart */}
        <div style={{ borderRadius: 14, background: subtle, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{ko ? "최근 7일 매출" : "Last 7 Days"}</span>
            <span style={{ fontSize: 11, color: "#1d3557", fontWeight: 600 }}>+12.4%</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
            {[65, 72, 58, 80, 75, 88, 92].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", height: `${h}%`, borderRadius: 4,
                  background: i === 6 ? accent : (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)")
                }} />
                <span style={{ fontSize: 9, color: muted }}>
                  {(ko ? ["월", "화", "수", "목", "금", "토", "일"] : ["M", "T", "W", "T", "F", "S", "S"])[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* bottom action */}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: accent, color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            {ko ? "오늘 매출 기록하기" : "Log today's sales"}
          </div>
          <div style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: subtle, border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`, fontSize: 13, fontWeight: 500, textAlign: "center", color: muted }}>
            {ko ? "상세 대시보드" : "Full dashboard"}
          </div>
        </div>
      </div>
    </div>
  );
}
