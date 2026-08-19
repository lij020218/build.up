"use client";

/**
 * AiCallQualityPanel — AI 호출 품질(ai_call_log 관측 원장) + 사용량 초기화 도구.
 *   · 기능별 24h/7d: 호출·성공%·폴백%·서킷스킵·p50/p95·토큰 (서버 SQL 집계 ai_call_stats)
 *   · 최근 실패 30건
 *   · 사용량 초기화 폼 (이메일·기능·월예산 환불) → POST /api/admin/ai-usage/reset
 *   정직성: 블록 실패 = "—" + 사유. 색은 네이비 단색(신호등 금지).
 */
import { useState, type CSSProperties } from "react";
import { useAdminFetch, adminPost } from "./useAdminFetch";
import { Card, EmptyState, tableStyles, MUTED, NAVY, BORDER, fmtNum, fmtDate } from "./ui";
import { AI_FEATURE_LABELS } from "./activity-labels";

type StatRow = {
  feature: string; calls: number; okCalls: number; successPct: number; fallbackCalls: number; fallbackPct: number;
  circuitSkipped: number; p50Ms: number | null; p95Ms: number | null; inputTokens: number; outputTokens: number;
};
type FailureRow = {
  at: string; feature: string | null; requestedModel: string | null; usedModel: string | null;
  fallback: boolean; circuitSkipped: boolean; ms: number | null; errorName: string | null; errorMessage: string | null;
};
type Resp = { ok: boolean; stats24h: StatRow[] | null; stats7d: StatRow[] | null; recentFailures: FailureRow[] | null; features: string[] };

type Window = "24h" | "7d";

export function AiCallQualityPanel() {
  const { data, loading, error, reload } = useAdminFetch<Resp>("/api/admin/ai-calls");
  const [win, setWin] = useState<Window>("24h");
  const stats = win === "24h" ? data?.stats24h ?? null : data?.stats7d ?? null;
  const failures = data?.recentFailures ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {error && <Card style={{ padding: 16, color: "#b64c4c", fontSize: 13.5 }}>{error}</Card>}

      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: "#16181d", letterSpacing: "-0.01em" }}>AI 호출 품질</span>
          <span style={{ fontSize: 12, color: MUTED }}>ai_call_log · 호출 1건 = 1행 · 30일 보존</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {(["24h", "7d"] as Window[]).map((w) => (
              <button key={w} type="button" onClick={() => setWin(w)} style={pillStyle(win === w)}>최근 {w}</button>
            ))}
          </div>
        </div>
        {stats === null && !loading ? (
          <EmptyState>집계 불가 — ai_call_stats RPC 실패. 마이그레이션(20260819_000003) 적용 여부를 확인하세요.</EmptyState>
        ) : stats && stats.length === 0 ? (
          <EmptyState>최근 {win} 기록된 AI 호출이 없습니다. (배포 후부터 쌓입니다)</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>기능</th>
                  <th style={thR}>호출</th>
                  <th style={thR}>성공률</th>
                  <th style={thR}>폴백률</th>
                  <th style={thR}>서킷 스킵</th>
                  <th style={thR}>p50</th>
                  <th style={thR}>p95</th>
                  <th style={thR}>토큰 in / out</th>
                </tr>
              </thead>
              <tbody>
                {(stats ?? []).map((s) => (
                  <tr key={s.feature}>
                    <td style={tableStyles.td}>
                      {AI_FEATURE_LABELS[s.feature] ?? s.feature}
                      <span style={{ color: MUTED, fontSize: 11.5, marginLeft: 7 }}>{s.feature}</span>
                    </td>
                    <td style={{ ...tdR, fontWeight: 700 }}>{fmtNum(s.calls)}</td>
                    <td style={tdR}>{s.successPct}%</td>
                    <td style={tdR}>{s.fallbackPct}%</td>
                    <td style={tdR}>{fmtNum(s.circuitSkipped)}</td>
                    <td style={tdR}>{fmtMs(s.p50Ms)}</td>
                    <td style={tdR}>{fmtMs(s.p95Ms)}</td>
                    <td style={tdR}>{fmtNum(s.inputTokens)} / {fmtNum(s.outputTokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: "#16181d", letterSpacing: "-0.01em" }}>최근 실패 30건</span>
          <span style={{ fontSize: 12, color: MUTED }}>ok=false · 최신순</span>
        </div>
        {failures === null && !loading ? (
          <EmptyState>조회 불가 — ai_call_log 조회 실패.</EmptyState>
        ) : failures && failures.length === 0 ? (
          <EmptyState>최근 30일 실패 기록이 없습니다.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>시각</th>
                  <th style={tableStyles.th}>기능</th>
                  <th style={tableStyles.th}>모델 (요청 → 사용)</th>
                  <th style={tableStyles.th}>오류</th>
                  <th style={thR}>ms</th>
                </tr>
              </thead>
              <tbody>
                {(failures ?? []).map((f, i) => (
                  <tr key={`${f.at}-${i}`}>
                    <td style={{ ...tableStyles.td, whiteSpace: "nowrap" }}>{fmtDate(f.at)}</td>
                    <td style={tableStyles.td}>{f.feature ? (AI_FEATURE_LABELS[f.feature] ?? f.feature) : "—"}</td>
                    <td style={{ ...tableStyles.td, fontSize: 12 }}>
                      {f.requestedModel ?? "—"}{f.usedModel && f.usedModel !== f.requestedModel ? ` → ${f.usedModel}` : ""}
                      {f.circuitSkipped && <span style={tagStyle}>circuit</span>}
                      {f.fallback && <span style={tagStyle}>fallback</span>}
                    </td>
                    <td style={{ ...tableStyles.td, fontSize: 12, maxWidth: 420 }}>
                      <span style={{ fontWeight: 700 }}>{f.errorName ?? "—"}</span>
                      {f.errorMessage && <span style={{ color: MUTED, marginLeft: 6, wordBreak: "break-all" }}>{f.errorMessage.slice(0, 160)}</span>}
                    </td>
                    <td style={tdR}>{fmtMs(f.ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AiUsageResetForm features={data?.features ?? []} onDone={reload} />
    </div>
  );
}

/** 사용량 초기화 — 이메일·기능(전체 가능)·월예산 환불 원 */
function AiUsageResetForm({ features, onDone }: { features: string[]; onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [feature, setFeature] = useState("");
  const [refund, setRefund] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!email.trim()) { setToast({ ok: false, text: "이메일을 입력하세요." }); return; }
    setBusy(true); setToast(null);
    const res = await adminPost("/api/admin/ai-usage/reset", {
      email: email.trim(), feature: feature || undefined, refundMonthlyWon: refund ? Number(refund) : undefined,
    });
    setBusy(false);
    if (!res.ok) { setToast({ ok: false, text: res.error ?? `실패 (${res.status})` }); return; }
    const j = res.json as { ledgerRowsZeroed?: number; redisKeysDeleted?: number | null; monthlyRefundedWon?: number; featuresAffected?: number; warnings?: string[] };
    const parts = [
      `원장 ${j.ledgerRowsZeroed ?? 0}행 0 처리`,
      j.redisKeysDeleted === null || j.redisKeysDeleted === undefined ? "Redis 미설정" : `Redis 키 ${j.redisKeysDeleted}개 삭제`,
      `기능 ${j.featuresAffected ?? 0}개`,
      (j.monthlyRefundedWon ?? 0) > 0 ? `월예산 ₩${fmtNum(j.monthlyRefundedWon)} 환불` : null,
      ...(j.warnings ?? []).map((w) => `⚠ ${w}`),
    ].filter(Boolean);
    setToast({ ok: true, text: `초기화 완료 — ${parts.join(" · ")}` });
    onDone?.();
  };

  return (
    <Card style={{ padding: "16px 18px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: "#16181d", letterSpacing: "-0.01em" }}>사용량 초기화</span>
        <span style={{ fontSize: 12, color: MUTED }}>오늘(KST) 일일 카운터 0 + Redis 일·주 키 삭제 · 월예산 환불은 선택</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={labelStyle}>이메일
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" style={{ ...inputStyle, minWidth: 240 }} />
        </label>
        <label style={labelStyle}>기능
          <select value={feature} onChange={(e) => setFeature(e.target.value)} style={{ ...inputStyle, minWidth: 200 }}>
            <option value="">전체 기능</option>
            {features.map((f) => <option key={f} value={f}>{AI_FEATURE_LABELS[f] ?? f} ({f})</option>)}
          </select>
        </label>
        <label style={labelStyle}>월예산 환불(원)
          <input value={refund} onChange={(e) => setRefund(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" style={{ ...inputStyle, width: 120 }} />
        </label>
        <button type="button" onClick={submit} disabled={busy} style={buttonStyle(busy)}>{busy ? "처리 중…" : "초기화"}</button>
      </div>
      {toast && (
        <div role="status" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, fontSize: 13, background: toast.ok ? "rgba(29,53,87,0.06)" : "rgba(182,76,76,0.08)", color: toast.ok ? NAVY : "#b64c4c" }}>
          {toast.text}
        </div>
      )}
    </Card>
  );
}


const fmtMs = (ms: number | null): string => (ms === null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`);
const thR: CSSProperties = { ...tableStyles.th, textAlign: "right" };
const tdR: CSSProperties = { ...tableStyles.td, textAlign: "right", whiteSpace: "nowrap" };
const tagStyle: CSSProperties = { marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: NAVY, background: "rgba(29,53,87,0.08)", borderRadius: 6, padding: "1px 6px" };
const labelStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: MUTED, fontWeight: 600 };
const inputStyle: CSSProperties = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13, color: "#16181d", background: "#fff" };
const pillStyle = (active: boolean): CSSProperties => ({
  padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
  border: `1px solid ${active ? NAVY : BORDER}`, background: active ? NAVY : "#fff", color: active ? "#fff" : MUTED,
});
const buttonStyle = (busy: boolean): CSSProperties => ({
  padding: "9px 16px", borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontSize: 13, fontWeight: 700,
  cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
});
