"use client";

/**
 * SaasMetricsConnectCard — 스타트업 사장님 자기 제품 사용자 수 자동 수집.
 *
 * ─── 계층 (2026-05-27 재구성) ─────────────────────────────────
 *  [기본 노출]
 *    1) GA4 OAuth (한국 스타트업 ~95% 가 보유, 무료) — 사장님이 바로 이해
 *
 *  [고급 연결 (개발자용) — toggle 안에 숨김]
 *    2) Custom Webhook   (사장님 서버 → Found.One POST)
 *    3) Pull API         (Found.One → 사장님 read-only GET endpoint, 매일 04:00 KST)
 *
 * 표시 조건: 스타트업 업종(industryCategoryId === "startup-tech") 일 때만.
 *
 * GA4_OAUTH_CLIENT_ID 환경변수 미설정 시 503 → 친절 메시지로 처리.
 *
 * 설계 의도:
 *   Pull API · Webhook 은 "있으면 좋은" 신뢰 신호. 주력 흐름으로 밀면 비개발자 이탈 위험.
 *   "조용히 열어두기" 전략 — 개발팀 있는 B2B 고객만 발견하도록.
 *
 * 디자인: Found.One 토큰 (lavender-mist 위 순백 카드 + 미드나잇 네이비 액센트).
 */

import { useCallback, useEffect, useState } from "react";
import { Activity, Zap, Lock, ExternalLink, Copy, Check, ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid rgba(30,42,85,0.08)",
  overflow: "hidden",
  marginTop: "12px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#5A6BAE",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  padding: "16px 18px 12px",
  borderBottom: "1px solid rgba(30,42,85,0.06)",
};
const primaryBtn: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 650,
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
  color: "#fff",
  cursor: "pointer",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
};
const secondaryBtn: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  borderRadius: "9px",
  border: "1px solid rgba(30,42,85,0.12)",
  background: "#fff",
  color: "#1E2A55",
  cursor: "pointer",
};

type Connection = {
  source: "ga4" | "webhook" | "custom_pull" | "amplitude" | "mixpanel" | "posthog" | "manual";
  property_id?: string | null;
  property_label?: string | null;
  endpoint_url?: string | null;
  funnel_mode?: "saas" | "commerce" | null;
  status?: "active" | "invalid" | "revoked";
  last_sync_at?: string | null;
  last_sync_error?: string | null;
};
type Stats30d = {
  latestDate: string | null;
  latestActiveUsers: number | null;
  latestCumulativeUsers: number | null;
  avgDau: number;
  totalNewUsers: number;
};

export function SaasMetricsConnectCard({
  ko,
  industryCategoryId,
}: {
  ko: boolean;
  industryCategoryId?: string | null;
}) {
  // 스타트업 업종에만 노출
  if (industryCategoryId !== "startup-tech") return null;

  const [conns, setConns] = useState<Connection[]>([]);
  const [stats, setStats] = useState<Stats30d | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [webhookCreds, setWebhookCreds] = useState<{ token: string; url: string; curl: string } | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  // ── 고급 연결 (개발자용) ──
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Pull API 폼
  const [pullEndpoint, setPullEndpoint] = useState("");
  const [pullToken, setPullToken] = useState("");
  const [pullMode, setPullMode] = useState<"saas" | "commerce">("saas");
  const [pullSample, setPullSample] = useState<unknown | null>(null);
  const [pullTestResult, setPullTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) return;
    try {
      const res = await fetch("/api/integrations/saas-metrics/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const d = await res.json();
      if (d.ok) {
        setConns(d.connections ?? []);
        setStats(d.stats30d ?? null);
      }
    } catch {
      /* keep prior state */
    }
  }, []);

  useEffect(() => {
    void load();
    // OAuth 콜백에서 ?ga4=ok 로 돌아오면 알림
    const url = new URL(window.location.href);
    const ga4 = url.searchParams.get("ga4");
    if (ga4 === "ok") {
      setMsg(ko ? "GA4 연결 완료 — 동기화를 한 번 실행해 주세요." : "GA4 connected — run sync once.");
      url.searchParams.delete("ga4");
      window.history.replaceState({}, "", url.toString());
    } else if (ga4 === "error") {
      setMsg(`❌ ${ko ? "GA4 연결 실패" : "GA4 connect failed"}: ${url.searchParams.get("reason") ?? ""}`);
      url.searchParams.delete("ga4");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, [load, ko]);

  const startGa4 = async () => {
    setBusy("ga4-start");
    setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/ga4/start", {
        headers: { Authorization: `Bearer ${s.session?.access_token}` },
      });
      const d = await res.json();
      if (d.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      if (d.code === "GA4_NOT_CONFIGURED" || res.status === 503) {
        setMsg(ko ? "이 기능은 곧 활성화됩니다. 잠시 후 다시 시도해 주세요." : "Coming soon.");
      } else {
        setMsg(`❌ ${d.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy("sync");
    setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDays: 30 }),
      });
      const d = await res.json();
      setMsg(d.ok ? (ko ? `완료 — ${d.fetched}일 수집` : `Done — ${d.fetched} days`) : `❌ ${d.error}`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const createWebhook = async () => {
    setBusy("webhook");
    setMsg(null);
    setTokenCopied(false);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/webhook/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}` },
      });
      const d = await res.json();
      if (d.ok) {
        setWebhookCreds({ token: d.webhookToken, url: d.ingestUrl, curl: d.sampleCurl });
        await load();
      } else setMsg(`❌ ${d.error}`);
    } finally {
      setBusy(null);
    }
  };

  const copyToken = async () => {
    if (!webhookCreds) return;
    await navigator.clipboard.writeText(webhookCreds.token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 1500);
  };

  // ── Pull API 핸들러 ─────────────────────────────────────────────────────
  const fetchPullSample = async () => {
    setBusy("pull-sample");
    setMsg(null);
    try {
      const res = await fetch("/api/integrations/saas-metrics/pull/sample", { cache: "no-store" });
      const d = await res.json();
      if (d.ok) {
        setPullSample(d);
      } else {
        setMsg(`❌ ${d.error ?? "샘플 로드 실패"}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const testPull = async () => {
    if (!pullEndpoint.trim() || !pullToken.trim()) {
      setMsg(ko ? "❌ Endpoint URL 과 Secret Token 을 모두 입력하세요." : "❌ Fill both endpoint and token.");
      return;
    }
    setBusy("pull-test");
    setMsg(null);
    setPullTestResult(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/pull/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint_url: pullEndpoint.trim(), secret_token: pullToken.trim() }),
      });
      const d = await res.json();
      if (d.ok) {
        setPullTestResult({
          ok: true,
          text: ko
            ? `✓ 정상 응답 (HTTP ${d.http_status}). step_1..4 = ${d.parsed.step_1}, ${d.parsed.step_2}, ${d.parsed.step_3}, ${d.parsed.step_4}`
            : `✓ OK (HTTP ${d.http_status}). step_1..4 = ${d.parsed.step_1}, ${d.parsed.step_2}, ${d.parsed.step_3}, ${d.parsed.step_4}`,
        });
      } else {
        setPullTestResult({
          ok: false,
          text: `${d.error}${d.http_status ? ` (HTTP ${d.http_status})` : ""}`,
        });
      }
    } finally {
      setBusy(null);
    }
  };

  const connectPull = async () => {
    if (!pullEndpoint.trim() || !pullToken.trim()) {
      setMsg(ko ? "❌ Endpoint URL 과 Secret Token 을 모두 입력하세요." : "❌ Fill both endpoint and token.");
      return;
    }
    setBusy("pull-connect");
    setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/pull/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint_url: pullEndpoint.trim(),
          secret_token: pullToken.trim(),
          funnel_mode: pullMode,
          label: pullMode === "saas" ? "내 SaaS funnel" : "내 Commerce funnel",
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setMsg(ko ? `✓ 연결됨 — 매일 04:00 KST 자동 수집` : "✓ Connected — daily 04:00 KST sync");
        setPullToken("");
        setPullTestResult(null);
        await load();
      } else {
        setMsg(`❌ ${d.error}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const disconnectPull = async () => {
    setBusy("pull-disconnect");
    setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/saas-metrics/pull/connect", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${s.session?.access_token}` },
      });
      const d = await res.json();
      setMsg(d.ok ? (ko ? "연결 해제됨" : "Disconnected") : `❌ ${d.error}`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const ga4Conn = conns.find((c) => c.source === "ga4");
  const webhookConn = conns.find((c) => c.source === "webhook");
  const pullConn = conns.find((c) => c.source === "custom_pull");
  const ga4Active = ga4Conn?.status === "active";
  const webhookActive = webhookConn?.status === "active";
  const pullActive = pullConn?.status === "active";

  // 고급 연결이 이미 active 면 토글 자동 펼침 (한 번만)
  useEffect(() => {
    if ((webhookActive || pullActive) && !advancedOpen) {
      setAdvancedOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookActive, pullActive]);

  return (
    <article style={card}>
      <div style={sectionLabel}>
        {ko ? "사용자 수 자동 수집 (스타트업)" : "User Metrics Auto-Collect (Startup)"}
      </div>

      {/* ── 통계 헤더 (둘 중 하나라도 active 일 때) ── */}
      {(ga4Active || webhookActive) && stats && stats.latestDate && (
        <div
          style={{
            margin: "16px 18px 0",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#F4F5FB",
            border: "1px solid rgba(30,42,85,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: "#5A6BAE",
              marginBottom: "6px",
            }}
          >
            {ko ? "최근 30일" : "Last 30 days"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <Stat label={ko ? "어제 활성" : "Yest. DAU"} value={stats.latestActiveUsers ?? 0} />
            <Stat label={ko ? "평균 DAU" : "Avg DAU"} value={Math.round(stats.avgDau)} />
            <Stat label={ko ? "신규 합계" : "New users"} value={stats.totalNewUsers} prefix="+" />
          </div>
        </div>
      )}

      {/* ── GA4 영역 ── */}
      <div style={{ padding: "16px 18px", borderTop: (ga4Active || webhookActive) ? "1px solid rgba(30,42,85,0.06)" : "none", marginTop: (ga4Active || webhookActive) ? "14px" : 0 }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #1E2A55 0%, #3B5BBF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(30,42,85,0.22)",
              flexShrink: 0,
            }}
          >
            <Activity size={18} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D" }}>
                {ko ? "Google Analytics 4 (GA4)" : "Google Analytics 4"}
              </span>
              {ga4Active && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "#EAF2FF",
                    color: "#1F46A8",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3B5BBF" }} />
                  {ko ? "연결됨" : "Connected"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "#5A6BAE", lineHeight: 1.55, marginTop: "3px" }}>
              {ga4Active && ga4Conn?.property_label
                ? ga4Conn.property_label
                : ko
                  ? "OAuth 1회 동의로 DAU·신규 사용자·누적 사용자를 매일 자동 수집합니다."
                  : "1-click OAuth — auto-syncs DAU, new users, total users daily."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {!ga4Active ? (
            <button type="button" onClick={startGa4} disabled={busy === "ga4-start"} style={primaryBtn}>
              {busy === "ga4-start" ? (ko ? "이동 중…" : "Redirecting…") : ko ? "GA4 연결하기 →" : "Connect GA4 →"}
            </button>
          ) : (
            <button type="button" onClick={sync} disabled={busy === "sync"} style={secondaryBtn}>
              {busy === "sync" ? (ko ? "동기화 중…" : "Syncing…") : ko ? "지금 동기화" : "Sync now"}
            </button>
          )}
        </div>
      </div>

      {/* ── 고급 연결 (개발자용) ───────────────────────────────────────────
       *   기본은 접힘. Webhook + Pull API 가 이미 active 면 자동 펼침.
       *   "조용히 열어두는" UX — 비개발자에게 노출되지 않도록.
       */}
      <div style={{ borderTop: "1px solid rgba(30,42,85,0.06)" }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#5A6BAE",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Code2 size={14} strokeWidth={2} />
            {ko ? "고급 연결 (개발자용)" : "Advanced (for developers)"}
            {(webhookActive || pullActive) && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "#EAF2FF",
                  color: "#1F46A8",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {(webhookActive ? 1 : 0) + (pullActive ? 1 : 0)} {ko ? "활성" : "active"}
              </span>
            )}
          </span>
          {advancedOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
        </button>

        {advancedOpen && (
          <>
            {/* 짧은 안내 (1줄) */}
            <div style={{ padding: "0 18px 12px", fontSize: "11.5px", color: "#6B7393", lineHeight: 1.5 }}>
              {ko
                ? "개발팀이 있다면 자동 동기화를 직접 연결할 수 있습니다. 대부분의 사장님은 위의 GA4 만으로 충분합니다."
                : "If you have a dev team, hook up automated sync directly. Most owners only need GA4 above."}
            </div>

            {/* ── Webhook 영역 (자체 서버 → Found.One POST) ── */}
            <div style={{ padding: "0 18px 16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #5A6BAE 0%, #8090C4 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(90,107,174,0.22)",
                    flexShrink: 0,
                  }}
                >
                  <Zap size={18} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D" }}>
                      {ko ? "Custom Webhook" : "Custom Webhook"}
                    </span>
                    {webhookActive && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "#EAF2FF",
                          color: "#1F46A8",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3B5BBF" }} />
                        {ko ? "활성" : "Active"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5A6BAE", lineHeight: 1.55, marginTop: "3px" }}>
                    {ko
                      ? "사장님 백엔드 → Found.One 으로 매일 POST. 자체 추적 데이터를 그대로 전송."
                      : "Your backend POSTs daily metrics to Found.One."}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={createWebhook} disabled={busy === "webhook"} style={webhookActive ? secondaryBtn : primaryBtn}>
                  {busy === "webhook"
                    ? (ko ? "발급 중…" : "Generating…")
                    : webhookActive
                      ? (ko ? "토큰 재발급" : "Regenerate token")
                      : (ko ? "Webhook 토큰 발급" : "Generate webhook token")}
                </button>
              </div>

              {/* 새로 발급된 토큰 + curl 예시 */}
              {webhookCreds && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#FFF6E5",
                    border: "1px solid rgba(214,145,33,0.25)",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A5B11", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={11} strokeWidth={2.25} />
                    {ko ? "토큰은 한 번만 표시됩니다 — 안전한 곳에 저장하세요" : "Token shown once — save it securely"}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                    <code
                      style={{
                        flex: 1,
                        fontSize: "11px",
                        fontFamily: "monospace",
                        background: "#fff",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(30,42,85,0.08)",
                        overflow: "auto",
                        whiteSpace: "nowrap",
                        color: "#141C3D",
                      }}
                    >
                      {webhookCreds.token}
                    </code>
                    <button
                      type="button"
                      onClick={copyToken}
                      style={{ ...secondaryBtn, padding: "6px 10px" }}
                      title={ko ? "복사" : "Copy"}
                    >
                      {tokenCopied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
                    </button>
                  </div>
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: "11.5px", fontWeight: 600, color: "#1E2A55" }}>
                      {ko ? "사용 예시 (curl)" : "Example (curl)"}
                    </summary>
                    <pre
                      style={{
                        marginTop: "6px",
                        padding: "10px 12px",
                        background: "#141C3D",
                        color: "#EAF2FF",
                        borderRadius: "8px",
                        fontSize: "10.5px",
                        lineHeight: 1.55,
                        overflow: "auto",
                        whiteSpace: "pre",
                      }}
                    >
                      {webhookCreds.curl}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* ── Pull API 영역 (Found.One → 사장님 read-only GET) ── */}
            <div style={{ padding: "0 18px 16px", borderTop: "1px dashed rgba(30,42,85,0.08)", paddingTop: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #2C4F80 0%, #5A6BAE 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(44,79,128,0.22)",
                    flexShrink: 0,
                  }}
                >
                  <Code2 size={18} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D" }}>
                      {ko ? "Pull API" : "Pull API"}
                    </span>
                    {pullActive && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "#EAF2FF",
                          color: "#1F46A8",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3B5BBF" }} />
                        {ko ? "활성" : "Active"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5A6BAE", lineHeight: 1.55, marginTop: "3px" }}>
                    {ko
                      ? "Found.One 이 매일 04:00 KST 에 사장님 read-only endpoint 를 호출. 사내 보안팀 설득이 쉬울 때."
                      : "Found.One calls your read-only endpoint daily at 04:00 KST. Easier to get security team approval."}
                  </div>
                </div>
              </div>

              {/* 이미 연결됨 — 상태 표시 + 해제 */}
              {pullActive && pullConn ? (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#F4F5FB",
                    border: "1px solid rgba(30,42,85,0.06)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#5A6BAE", marginBottom: "4px" }}>
                    {ko ? "Endpoint" : "Endpoint"}
                  </div>
                  <code
                    style={{
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "#141C3D",
                      wordBreak: "break-all",
                    }}
                  >
                    {pullConn.endpoint_url ?? "—"}
                  </code>
                  {pullConn.funnel_mode && (
                    <div style={{ fontSize: "11px", color: "#5A6BAE", marginTop: "4px" }}>
                      {ko ? "모드" : "Mode"}: {pullConn.funnel_mode}
                    </div>
                  )}
                  {pullConn.last_sync_at && (
                    <div style={{ fontSize: "11px", color: "#5A6BAE", marginTop: "4px" }}>
                      {ko ? "최근 동기화" : "Last sync"}: {pullConn.last_sync_at}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={disconnectPull}
                    disabled={busy === "pull-disconnect"}
                    style={{ ...secondaryBtn, marginTop: "8px", color: "#9F1A2D", borderColor: "rgba(159,26,45,0.25)" }}
                  >
                    {busy === "pull-disconnect" ? (ko ? "해제 중…" : "Disconnecting…") : ko ? "연결 해제" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <>
                  {/* 등록 폼 */}
                  <input
                    type="url"
                    value={pullEndpoint}
                    onChange={(e) => setPullEndpoint(e.target.value)}
                    placeholder="https://api.example.com/buildup/funnel"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(30,42,85,0.12)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      marginBottom: "8px",
                      background: "#fff",
                    }}
                  />
                  <input
                    type="password"
                    value={pullToken}
                    onChange={(e) => setPullToken(e.target.value)}
                    placeholder={ko ? "Secret Token (최소 8자, Bearer 헤더로 전송됨)" : "Secret token (min 8 chars, sent as Bearer)"}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(30,42,85,0.12)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      marginBottom: "8px",
                      background: "#fff",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setPullMode("saas")}
                      style={{
                        ...secondaryBtn,
                        flex: 1,
                        background: pullMode === "saas" ? "#1E2A55" : "#fff",
                        color: pullMode === "saas" ? "#fff" : "#1E2A55",
                      }}
                    >
                      {ko ? "SaaS funnel" : "SaaS funnel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPullMode("commerce")}
                      style={{
                        ...secondaryBtn,
                        flex: 1,
                        background: pullMode === "commerce" ? "#1E2A55" : "#fff",
                        color: pullMode === "commerce" ? "#fff" : "#1E2A55",
                      }}
                    >
                      {ko ? "Commerce funnel" : "Commerce funnel"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={fetchPullSample}
                      disabled={busy === "pull-sample"}
                      style={secondaryBtn}
                    >
                      {busy === "pull-sample" ? (ko ? "로딩…" : "Loading…") : ko ? "샘플 응답 보기" : "View sample"}
                    </button>
                    <button
                      type="button"
                      onClick={testPull}
                      disabled={busy === "pull-test" || !pullEndpoint.trim() || !pullToken.trim()}
                      style={secondaryBtn}
                    >
                      {busy === "pull-test" ? (ko ? "테스트 중…" : "Testing…") : ko ? "테스트" : "Test"}
                    </button>
                    <button
                      type="button"
                      onClick={connectPull}
                      disabled={busy === "pull-connect" || !pullEndpoint.trim() || !pullToken.trim()}
                      style={primaryBtn}
                    >
                      {busy === "pull-connect" ? (ko ? "등록 중…" : "Saving…") : ko ? "등록" : "Connect"}
                    </button>
                  </div>

                  {/* 테스트 결과 */}
                  {pullTestResult && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: pullTestResult.ok ? "#EAF2FF" : "#FCEEF1",
                        color: pullTestResult.ok ? "#1F46A8" : "#9F1A2D",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        lineHeight: 1.55,
                      }}
                    >
                      {pullTestResult.text}
                    </div>
                  )}

                  {/* 샘플 응답 JSON */}
                  {pullSample !== null && (() => {
                    const s = pullSample as {
                      spec?: { schema?: Record<string, string>; auth?: string };
                      examples?: { saas?: unknown; commerce?: unknown };
                      curl_example?: string;
                    };
                    const example = pullMode === "saas" ? s.examples?.saas : s.examples?.commerce;
                    return (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px 12px",
                          background: "#141C3D",
                          color: "#EAF2FF",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          lineHeight: 1.55,
                          overflow: "auto",
                        }}
                      >
                        <div style={{ color: "#8090C4", marginBottom: "6px" }}>
                          {ko ? "// 사장님 endpoint 가 반환해야 할 JSON" : "// Expected JSON from your endpoint"}
                        </div>
                        <pre style={{ margin: 0, whiteSpace: "pre" }}>
                          {JSON.stringify(example, null, 2)}
                        </pre>
                        {s.curl_example && (
                          <>
                            <div style={{ color: "#8090C4", margin: "8px 0 4px" }}>
                              {ko ? "// Found.One 이 매일 호출할 명령" : "// Found.One will call this daily"}
                            </div>
                            <pre style={{ margin: 0, whiteSpace: "pre" }}>{s.curl_example}</pre>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 메시지 */}
      {msg && (
        <div
          style={{
            margin: "0 18px 16px",
            padding: "8px 12px",
            borderRadius: "10px",
            background: msg.startsWith("❌") ? "#FCEEF1" : "#EAF2FF",
            color: msg.startsWith("❌") ? "#9F1A2D" : "#1F46A8",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      {/* 안내: 다른 도구 ETA */}
      <div
        style={{
          padding: "12px 18px 16px",
          borderTop: "1px solid rgba(30,42,85,0.06)",
          fontSize: "11px",
          color: "#6B7393",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          lineHeight: 1.5,
        }}
      >
        <ExternalLink size={11} strokeWidth={2} style={{ color: "#5A6BAE" }} />
        {ko
          ? "Amplitude · Mixpanel · PostHog 추가 연동은 곧 공개됩니다."
          : "Amplitude · Mixpanel · PostHog connectors coming soon."}
      </div>
    </article>
  );
}

function Stat({ label, value, prefix }: { label: string; value: number; prefix?: string }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "#5A6BAE", marginBottom: "2px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#141C3D",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix ?? ""}{(value ?? 0).toLocaleString()}
      </div>
    </div>
  );
}
