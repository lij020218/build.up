"use client";

/**
 * Financial Snapshot — 회계 관점.
 *  · 운영 대시보드 = 오늘·14일 (액션 중심)
 *  · 여기 = 누적·분기·연간 (회계 중심)
 *
 * 산수만 (LLM 0):
 *  · 누적 매출/비용/손익 (since launch)
 *  · 분기별 매출 막대 (이번 분기 + 이전 3분기)
 *  · 잔고 vs 자본 게이지
 *  · 런웨이 (잔고 / 월 burn)
 *  · 잔고 수동 입력 (사장이 통장 보고 갱신)
 */

import { useState, useMemo } from "react";
import { Wallet, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { card, sectionHeader, sectionTitle, sectionSubtitle, fieldLabel, textareaInput, PALETTE, subtleButton } from "./styles";

type DailyEntry = { date: string; sales: number; customers: number };

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  monthlyCosts: Record<string, number> | null | undefined;
  totalCapitalKrw: number;
  currentBalanceManualKrw: number | null;
  currentBalanceUpdatedAt: string | null;
  launchDate: string | null;
  onUpdateBalance: (krw: number) => void;
};

function fmtWon(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}${abs.toLocaleString()}`;
}

function quarterKey(date: Date): string {
  const y = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${y}Q${q}`;
}

export function FinancialSnapshotSection(p: Props) {
  const ko = p.ko;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(p.currentBalanceManualKrw != null ? String(p.currentBalanceManualKrw) : "");

  const cumulativeSales = useMemo(
    () => p.dailyEntries.reduce((s, e) => s + (e.sales ?? 0), 0),
    [p.dailyEntries],
  );
  const monthlyBurn = useMemo(() => {
    if (!p.monthlyCosts) return 0;
    return Object.values(p.monthlyCosts).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  }, [p.monthlyCosts]);
  const daysOperating = useMemo(() => {
    if (!p.launchDate) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(p.launchDate).getTime()) / 86400000));
  }, [p.launchDate]);
  const cumulativeBurn = (monthlyBurn / 30) * daysOperating;
  const cumulativeProfit = cumulativeSales - cumulativeBurn;
  const balance = p.currentBalanceManualKrw ?? 0;
  const runwayMonths = monthlyBurn > 0 ? balance / monthlyBurn : null;

  // 분기별 매출 (최근 4분기)
  const quarterly = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of p.dailyEntries) {
      const d = new Date(`${e.date}T00:00:00`);
      if (isNaN(d.getTime())) continue;
      const k = quarterKey(d);
      map.set(k, (map.get(k) ?? 0) + e.sales);
    }
    // 현재로부터 최근 4분기
    const now = new Date();
    const result: Array<{ key: string; sales: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
      const k = quarterKey(ref);
      result.push({ key: k, sales: map.get(k) ?? 0 });
    }
    return result;
  }, [p.dailyEntries]);

  const maxQ = Math.max(...quarterly.map((q) => q.sales), 1);

  const balanceVsCapitalPct = p.totalCapitalKrw > 0 ? Math.min(100, (balance / p.totalCapitalKrw) * 100) : 0;

  return (
    <section id="financial" style={card}>
      <header style={sectionHeader}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: PALETTE.MIDNIGHT_8,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <Wallet size={17} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: PALETTE.MIDNIGHT }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={sectionTitle}>{ko ? "재무 현황" : "Financial Snapshot"}</div>
          <div style={sectionSubtitle}>
            {ko ? "누적·분기·연간 회계 관점 — 운영 대시보드와 별개" : "Cumulative·quarterly·annual — separate from ops dashboard"}
          </div>
        </div>
      </header>

      {/* Financial 카드 본문 — settings card 가 padding:0 이라 wrapper 로 감쌈 */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" as const, gap: 18 }}>

      {/* 4-up KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile label={ko ? "누적 매출" : "Cumulative sales"} value={`₩${fmtWon(cumulativeSales)}`} sub={ko ? `${daysOperating}일간` : `${daysOperating} days`} />
        <KpiTile label={ko ? "누적 손익" : "Cumulative P&L"} value={`${cumulativeProfit >= 0 ? "+" : ""}₩${fmtWon(cumulativeProfit)}`} tone={cumulativeProfit >= 0 ? "good" : "bad"} sub={ko ? `월 burn ₩${fmtWon(monthlyBurn)}` : `Monthly burn ₩${fmtWon(monthlyBurn)}`} />
        <KpiTile label={ko ? "현재 잔고" : "Current balance"} value={`₩${fmtWon(balance)}`} sub={p.currentBalanceUpdatedAt ? `${ko ? "업데이트:" : "Updated:"} ${p.currentBalanceUpdatedAt.slice(0, 10)}` : ko ? "수동 입력 필요" : "Manual input"} />
        <KpiTile label={ko ? "런웨이" : "Runway"} value={runwayMonths != null ? `${runwayMonths.toFixed(1)}${ko ? "개월" : " mo"}` : "—"} tone={runwayMonths != null && runwayMonths < 6 ? "bad" : runwayMonths != null && runwayMonths < 12 ? "warn" : "good"} sub={ko ? "잔고 ÷ 월 burn" : "Balance ÷ burn"} />
      </div>

      {/* 분기별 매출 막대 */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.7, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 10 }}>
          {ko ? "분기별 매출 (최근 4분기)" : "Quarterly sales (last 4Q)"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {quarterly.map((q) => (
            <div key={q.key} style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.MIDNIGHT_DEEP, fontVariantNumeric: "tabular-nums" as const }}>
                ₩{fmtWon(q.sales)}
              </div>
              <div style={{ height: 8, borderRadius: 4, background: PALETTE.MIDNIGHT_8, overflow: "hidden" as const, position: "relative" as const }}>
                <div style={{
                  width: `${(q.sales / maxQ) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${PALETTE.MIDNIGHT}, #5b6bff)`,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: PALETTE.HINT, fontVariantNumeric: "tabular-nums" as const }}>
                {q.key}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 잔고 / 자본 게이지 */}
      {p.totalCapitalKrw > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.7, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
              {ko ? "잔고 ÷ 자본" : "Balance ÷ Capital"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PALETTE.MIDNIGHT_DEEP, fontVariantNumeric: "tabular-nums" as const }}>
              ₩{fmtWon(balance)} / ₩{fmtWon(p.totalCapitalKrw)} ({balanceVsCapitalPct.toFixed(0)}%)
            </div>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: PALETTE.MIDNIGHT_8, overflow: "hidden" as const, position: "relative" as const }}>
            <div style={{
              width: `${balanceVsCapitalPct}%`,
              height: "100%",
              background: balanceVsCapitalPct < 25 ? `linear-gradient(90deg, ${PALETTE.DANGER}, #ff7a6e)` : balanceVsCapitalPct < 50 ? `linear-gradient(90deg, ${PALETTE.WARN}, #ffb84d)` : `linear-gradient(90deg, ${PALETTE.MIDNIGHT}, ${PALETTE.SUCCESS})`,
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      )}

      {/* 잔고 수동 갱신 */}
      <div style={{ borderTop: `1px solid ${PALETTE.MIDNIGHT_BORDER}`, paddingTop: 14 }}>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} style={subtleButton}>
            <RefreshCw size={11} strokeWidth={1.5} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {ko ? "통장 잔고 업데이트" : "Update bank balance"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" as const }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={fieldLabel}>{ko ? "현재 통장 잔고 (원)" : "Current balance (KRW)"}</div>
              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                style={textareaInput(!!draft)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const v = Number(draft);
                if (!isFinite(v) || v < 0) return;
                p.onUpdateBalance(v);
                setEditing(false);
              }}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: PALETTE.MIDNIGHT,
                color: "white",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {ko ? "저장" : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setDraft(p.currentBalanceManualKrw != null ? String(p.currentBalanceManualKrw) : ""); }} style={subtleButton}>
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        )}
      </div>
      </div>{/* /Financial 본문 wrapper */}
    </section>
  );
}

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "bad" ? PALETTE.DANGER : tone === "warn" ? PALETTE.WARN : tone === "good" ? PALETTE.SUCCESS : PALETTE.MIDNIGHT_DEEP;
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 14,
      background: "white",
      border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
      display: "flex",
      flexDirection: "column" as const,
      gap: 4,
    }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.65, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" as const, lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 11, color: PALETTE.HINT, fontWeight: 500 }}>{sub}</span>}
    </div>
  );
}
