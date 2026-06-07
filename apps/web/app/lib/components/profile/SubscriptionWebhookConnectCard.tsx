"use client";

/**
 * SubscriptionWebhookConnectCard — 구독제 사장님이 결제사 webhook 을 연결하는 통합 카드.
 *
 * 3개 provider (Stripe / Toss / Custom) 의 연결 상태를 한 화면에서 보고,
 * 각 provider 별 연결 sheet 를 열어 Secret 입력 → 봉투 암호화 저장 → webhook URL 안내.
 *
 * PortOne 은 별도 PortOneConnectCard (read-only 매출 동기화) 와 역할이 다르므로 분리.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plug, AlertCircle, Copy } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type ProviderKey = "stripe" | "toss" | "custom";

type ProviderStatus = {
  connected: boolean;
  maskedSecret?: string | null;
  webhookUrl?: string;
  hasWebhookSecret?: boolean;
  eventCount30d?: number;
  lastSyncAt?: string | null;
  status?: string;
};

const PROVIDERS: Array<{ key: ProviderKey; name: string; emoji: string; description: { ko: string; en: string } }> = [
  { key: "stripe", name: "Stripe", emoji: "S", description: { ko: "글로벌 SaaS 표준. 구독·인보이스·환불 자동 추적.", en: "Global SaaS standard." } },
  { key: "toss",   name: "토스페이먼츠", emoji: "T", description: { ko: "한국 결제. 결제 상태 변경 시 즉시 반영.", en: "Korean payments." } },
  { key: "custom", name: "자체 서버 (Custom)", emoji: "C", description: { ko: "자체 결제·회원 시스템에서 직접 이벤트 전송.", en: "Send events from your own backend." } },
];

export function SubscriptionWebhookConnectCard({ ko = true }: { ko?: boolean }) {
  const [status, setStatus] = useState<Record<ProviderKey, ProviderStatus>>({
    stripe: { connected: false }, toss: { connected: false }, custom: { connected: false },
  });
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<ProviderKey | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [s, t, c] = await Promise.all([
        fetch("/api/integrations/stripe/status", { headers, cache: "no-store" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/integrations/toss/status", { headers, cache: "no-store" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/integrations/custom/status", { headers, cache: "no-store" }).then(r => r.json()).catch(() => ({})),
      ]);
      setStatus({
        stripe: { connected: !!s.connected, maskedSecret: s.maskedSecret, webhookUrl: s.webhookUrl, hasWebhookSecret: s.hasWebhookSecret, eventCount30d: s.eventCount30d, lastSyncAt: s.lastSyncAt, status: s.status },
        toss:   { connected: !!t.connected, maskedSecret: t.maskedSecret, webhookUrl: t.webhookUrl, eventCount30d: t.eventCount30d, lastSyncAt: t.lastSyncAt, status: t.status },
        custom: { connected: !!c.connected, maskedSecret: c.tokenMask, webhookUrl: c.webhookUrl, eventCount30d: c.eventCount30d, lastSyncAt: c.lastSyncAt, status: c.status },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  return (
    <article style={{
      borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff", overflow: "hidden",
    }}>
      <div style={{ padding: "18px 22px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Plug size={16} strokeWidth={2} color="#7c3aed" />
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {ko ? "결제 시스템 자동 연동" : "Auto-sync payment systems"}
          </span>
        </div>
        <p style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.55)", margin: "0 0 14px", lineHeight: 1.55 }}>
          {ko
            ? "Stripe·토스페이먼츠·자체 서버에서 발생한 신규 구독·결제·취소 이벤트를 실시간으로 받습니다. 매출·MRR·이탈률이 자동 갱신됩니다."
            : "Receive subscription / payment / cancel events in real time. MRR and churn auto-update."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        {PROVIDERS.map((p) => {
          const st = status[p.key];
          return (
            <div key={p.key} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 22px", borderBottom: "1px solid rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "rgba(124,58,237,0.06)", color: "#7c3aed",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "14px", flexShrink: 0,
              }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{p.name}</div>
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", marginTop: "1px" }}>
                  {st.connected
                    ? <>
                        <span style={{ color: "#1d3557", fontWeight: 600 }}>● {ko ? "연결됨" : "Connected"}</span>
                        {st.maskedSecret && <> · <span style={{ fontFamily: "ui-monospace, monospace" }}>{st.maskedSecret}</span></>}
                        {typeof st.eventCount30d === "number" && st.eventCount30d > 0 && (
                          <> · {ko ? `30일 ${st.eventCount30d}건` : `${st.eventCount30d} events / 30d`}</>
                        )}
                      </>
                    : <>{p.description[ko ? "ko" : "en"]}</>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(p.key)}
                style={{
                  padding: "7px 14px", borderRadius: "999px", border: "1px solid rgba(124,58,237,0.2)",
                  background: st.connected ? "rgba(124,58,237,0.04)" : "#7c3aed",
                  color: st.connected ? "#7c3aed" : "#fff",
                  fontSize: "12px", fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" as const,
                  letterSpacing: "-0.005em", transition: "all 0.15s ease",
                }}
              >
                {st.connected ? (ko ? "관리" : "Manage") : (ko ? "연결" : "Connect")}
              </button>
            </div>
          );
        })}
      </div>

      {loading && (
        <div style={{ padding: "10px 22px", fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>
          {ko ? "상태 확인 중..." : "Loading..."}
        </div>
      )}

      {activeSheet && (
        <ConnectSheet
          provider={activeSheet}
          ko={ko}
          status={status[activeSheet]}
          onClose={() => setActiveSheet(null)}
          onChanged={loadStatus}
        />
      )}
    </article>
  );
}

// ─── 연결 sheet (모달) ────────────────────────────────────────────────
function ConnectSheet({
  provider, ko, status, onClose, onChanged,
}: {
  provider: ProviderKey;
  ko: boolean;
  status: ProviderStatus;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const body: Record<string, unknown> =
        provider === "stripe" ? { apiSecret, webhookSecret: webhookSecret || undefined } :
        provider === "toss"   ? { apiSecret, webhookSecret: webhookSecret || undefined } :
                                { description: description || undefined };

      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? (ko ? "연결 실패" : "Failed to connect"));
      } else {
        if (provider === "custom" && data.token) {
          setIssuedToken(data.token);
          setIssuedUrl(data.webhookUrl);
        } else {
          setIssuedUrl(data.webhookUrl);
        }
        onChanged();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm(ko ? "정말 연결을 해제할까요?" : "Disconnect?")) return;
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch(`/api/integrations/${provider}/connect`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      onChanged();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const providerName =
    provider === "stripe" ? "Stripe" :
    provider === "toss" ? (ko ? "토스페이먼츠" : "Toss Payments") :
    (ko ? "자체 서버 webhook" : "Custom webhook");

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div style={{
        width: "min(480px, 100%)", maxHeight: "85vh", overflowY: "auto",
        background: "#fff", borderRadius: "20px", padding: "24px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {ko ? `${providerName} 연결` : `Connect ${providerName}`}
          </h2>
          <button type="button" onClick={onClose} aria-label="close" style={{
            width: "32px", height: "32px", borderRadius: "999px",
            background: "rgba(15,23,42,0.06)", border: "none", cursor: "pointer", fontSize: "16px",
          }}>✕</button>
        </div>

        {/* 발급 결과 — 토큰 1회 표시 */}
        {issuedToken && (
          <div style={{ marginBottom: "16px", padding: "14px", borderRadius: "12px", background: "#fff8e1", border: "1px solid #191970" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#191970", marginBottom: "6px" }}>
              <AlertCircle size={12} style={{ display: "inline", marginRight: "4px" }} />
              {ko ? "이 토큰은 한 번만 표시됩니다 — 즉시 복사" : "Token shown once — copy now"}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <code style={{ flex: 1, padding: "8px 10px", background: "#fff", borderRadius: "6px", fontSize: "12px", fontFamily: "ui-monospace, monospace", overflow: "auto" }}>{issuedToken}</code>
              <button type="button" onClick={() => copyToClipboard(issuedToken)} style={{
                padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)",
                background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px",
              }}><Copy size={12} /> {ko ? "복사" : "Copy"}</button>
            </div>
          </div>
        )}

        {issuedUrl && (
          <div style={{ marginBottom: "16px", padding: "14px", borderRadius: "12px", background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.2)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1d3557", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={12} /> {ko ? "Webhook URL — 결제사 콘솔에 등록" : "Webhook URL — register on your provider"}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <code style={{ flex: 1, padding: "8px 10px", background: "#fff", borderRadius: "6px", fontSize: "11px", fontFamily: "ui-monospace, monospace", overflow: "auto" }}>{issuedUrl}</code>
              <button type="button" onClick={() => copyToClipboard(issuedUrl)} style={{
                padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)",
                background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px",
              }}><Copy size={12} /> {ko ? "복사" : "Copy"}</button>
            </div>
          </div>
        )}

        {/* Provider 별 입력 */}
        {!issuedToken && provider === "stripe" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
            <Field label={ko ? "Stripe Secret Key (sk_live_... / sk_test_...)" : "Secret Key"}>
              <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                placeholder="sk_live_..." style={inputStyle} />
            </Field>
            <Field label={ko ? "Webhook Signing Secret (선택, whsec_...)" : "Webhook Signing Secret (optional)"}>
              <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..." style={inputStyle} />
            </Field>
            <p style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", margin: 0, lineHeight: 1.5 }}>
              {ko ? "Dashboard → Developers → Webhooks → Endpoint 추가 후 Signing secret 을 복사해 입력하세요."
                  : "Dashboard → Developers → Webhooks. Sig verification skipped if blank (not recommended)."}
            </p>
          </div>
        )}

        {!issuedToken && provider === "toss" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
            <Field label={ko ? "토스페이먼츠 Secret Key (test_sk_... / live_sk_...)" : "Secret Key"}>
              <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                placeholder="live_sk_..." style={inputStyle} />
            </Field>
            <Field label={ko ? "Webhook Secret (선택, 권장)" : "Webhook Secret (optional, recommended)"}>
              <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={ko ? "콘솔 → Webhook 시크릿" : "Console → Webhook secret"} style={inputStyle} />
            </Field>
            <p style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", margin: 0, lineHeight: 1.5 }}>
              {ko ? "토스페이먼츠 → 개발자센터 → API 키. webhook URL 도 콘솔에 등록 필요. Webhook 시크릿을 입력하면 전용 키로 검증해 더 안전합니다(미입력 시 기본 키 사용)."
                  : "Toss Payments developer center → API keys. Entering a webhook secret enables per-merchant verification."}
            </p>
          </div>
        )}

        {!issuedToken && provider === "custom" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
            <Field label={ko ? "사용처 메모 (선택)" : "Description (optional)"}>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={ko ? "예: 프로덕션 서버" : "e.g. Production server"} style={inputStyle} />
            </Field>
            <p style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", margin: 0, lineHeight: 1.5 }}>
              {ko ? "발급된 토큰을 자체 백엔드의 webhook 헤더 (Authorization: Bearer ...) 로 사용하세요. 토큰은 한 번만 표시됩니다."
                  : "Use the issued token as Bearer auth from your own backend. Shown once."}
            </p>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.06)", color: "#b64c4c", fontSize: "12px" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          {!issuedToken && (
            <button type="button" onClick={submit} disabled={busy || (provider !== "custom" && !apiSecret)}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                background: busy || (provider !== "custom" && !apiSecret) ? "rgba(15,23,42,0.08)" : "#7c3aed",
                color: busy || (provider !== "custom" && !apiSecret) ? "rgba(15,23,42,0.3)" : "#fff",
                fontSize: "14px", fontWeight: 650,
                cursor: busy || (provider !== "custom" && !apiSecret) ? "default" : "pointer",
              }}>
              {busy ? (ko ? "처리 중…" : "Processing…") : (status.connected ? (ko ? "재연결" : "Reconnect") : (ko ? "연결" : "Connect"))}
            </button>
          )}
          {status.connected && (
            <button type="button" onClick={disconnect} disabled={busy}
              style={{
                padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(182,76,76,0.2)",
                background: "rgba(182,76,76,0.04)", color: "#b64c4c",
                fontSize: "13px", fontWeight: 650, cursor: "pointer",
              }}>
              {ko ? "연결 해제" : "Disconnect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.6)" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "10px",
  border: "1px solid rgba(0,0,0,0.1)", background: "rgba(118,118,128,0.05)",
  fontSize: "14px", outline: "none", fontFamily: "ui-monospace, monospace",
};
