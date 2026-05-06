"use client";

/**
 * SaasMetricsConnectCard — 스타트업 사장님 자기 제품 사용자 수 자동 수집.
 *
 * 두 채널:
 *   1) GA4 OAuth (한국 스타트업 ~95% 가 보유, 무료) — Phase 1 P0
 *   2) Custom Webhook (DIY/B2B SaaS 팀 fallback) — Phase 1 P1
 *
 * 표시 조건: 스타트업 업종(industryCategoryId === "startup-tech") 일 때만.
 *
 * GA4_OAUTH_CLIENT_ID 환경변수 미설정 시 503 → 친절 메시지로 처리.
 *
 * 디자인: build.up 토큰 (lavender-mist 위 순백 카드 + 미드나잇 네이비 액센트).
 */

import { useCallback, useEffect, useState } from "react";
import { Activity, Zap, Lock, ExternalLink, Copy, Check } from "lucide-react";
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
  source: "ga4" | "webhook" | "amplitude" | "mixpanel" | "posthog" | "manual";
  property_id?: string | null;
  property_label?: string | null;
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

  const ga4Conn = conns.find((c) => c.source === "ga4");
  const webhookConn = conns.find((c) => c.source === "webhook");
  const ga4Active = ga4Conn?.status === "active";
  const webhookActive = webhookConn?.status === "active";

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

      {/* ── Webhook 영역 ── */}
      <div style={{ padding: "16px 18px", borderTop: "1px solid rgba(30,42,85,0.06)" }}>
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
                {ko ? "Custom Webhook (직접 연동)" : "Custom Webhook"}
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
                ? "사장님 백엔드가 매일 한 번 POST 호출 → DAU·신규·이탈 자동 등록. GA4 가 없거나 자체 추적 원하실 때."
                : "POST daily metrics from your backend. For teams without GA4 or with custom tracking."}
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
