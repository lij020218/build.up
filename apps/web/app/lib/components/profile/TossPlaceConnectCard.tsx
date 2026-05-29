"use client";

/**
 * TossPlaceConnectCard — TOSS Place Open API 연결 카드.
 * 패턴: PortOneConnectCard 의 압축 버전.
 */
import { useCallback, useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
  marginTop: "12px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "var(--muted)",
  textTransform: "uppercase" as const, letterSpacing: "0.07em",
  padding: "16px 18px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)",
};
const primaryBtn: React.CSSProperties = {
  fontSize: "13px", fontWeight: 650, padding: "10px 18px",
  borderRadius: "10px", border: "none",
  background: "linear-gradient(135deg, #1d3557 0%, #2c4f80 100%)",
  color: "#fff", cursor: "pointer",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(29,53,87,0.18)",
};
const secondaryBtn: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600, padding: "8px 12px",
  borderRadius: "9px", border: "1px solid rgba(15,23,42,0.1)",
  background: "#fff", color: "rgba(15,23,42,0.75)", cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "10px",
  border: "1px solid rgba(15,23,42,0.12)", fontSize: "13px",
  fontFamily: "monospace", outline: "none", background: "#f8fafc",
};

type Status = {
  ok: boolean;
  connected?: boolean;
  merchantId?: string | null;
  accessKeyMask?: string | null;
  status?: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  paymentCount30d?: number;
};

export function TossPlaceConnectCard({ ko }: { ko: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) { setStatus({ ok: false }); return; }
    const res = await fetch("/api/integrations/tossplace/status", {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    setStatus((await res.json()) as Status);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sync = async (full = false) => {
    setBusy(true); setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/tossplace/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fullBackfill: full }),
      });
      const d = await res.json();
      setMsg(d.ok ? (ko ? `완료 — ${d.fetched}건 조회` : `Done — ${d.fetched}`) : `❌ ${d.error}`);
      await load();
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    if (!confirm(ko ? "정말 해제?" : "Really disconnect?")) return;
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    await fetch("/api/integrations/tossplace/disconnect", {
      method: "POST", headers: { Authorization: `Bearer ${s.session?.access_token}` },
    });
    await load();
    setBusy(false);
  };

  const isConn = status?.connected && status?.status === "active";

  return (
    <>
      <article style={card}>
        <div style={sectionLabel}>{ko ? "TOSS Place 연결" : "TOSS Place"}</div>
        {!isConn ? (
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #0064ff 0%, #4a90ff 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(0,100,255,0.25)",
                flexShrink: 0,
              }}>
                <Smartphone size={18} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  {ko ? "TOSS Place 단말기 사장님" : "TOSS Place merchants"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "3px" }}>
                  {ko
                    ? "토스 단말기 매출이 자동으로 들어옵니다. 매장 대시보드에서 Found.One 앱 사용 활성화 → Access Key 발급."
                    : "Auto-sync your TOSS Place revenue. Activate Found.One app in merchant dashboard → issue Access Key."}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowWizard(true)} style={primaryBtn}>
              {ko ? "TOSS Place 연결하기 →" : "Connect TOSS Place →"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{ko ? "연결됨" : "Connected"}</span>
                </div>
                <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", fontFamily: "monospace" }}>
                  {status?.merchantId} · {status?.accessKeyMask}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)" }}>
                {ko ? `최근 30일 결제 ${status?.paymentCount30d}건` : `Last 30d: ${status?.paymentCount30d}`}
              </div>
              {msg && (
                <div style={{ marginTop: "8px", padding: "6px 10px", borderRadius: "8px", background: msg.startsWith("❌") ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", color: msg.startsWith("❌") ? "#b91c1c" : "#15803d", fontSize: "12px", fontWeight: 600 }}>
                  {msg}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", padding: "12px 18px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
              <button type="button" onClick={() => sync(false)} disabled={busy} style={secondaryBtn}>
                {ko ? "동기화 (7d)" : "Sync 7d"}
              </button>
              <button type="button" onClick={() => sync(true)} disabled={busy} style={secondaryBtn}>
                {ko ? "백필 (1y)" : "Backfill 1y"}
              </button>
              <button type="button" onClick={disconnect} disabled={busy} style={{ ...secondaryBtn, marginLeft: "auto", color: "#b91c1c", borderColor: "rgba(220,38,38,0.2)" }}>
                {ko ? "해제" : "Disconnect"}
              </button>
            </div>
          </>
        )}
      </article>

      {showWizard && <TossWizard ko={ko} onClose={() => setShowWizard(false)} onSuccess={async () => { setShowWizard(false); await load(); }} />}
    </>
  );
}

function TossWizard({ ko, onClose, onSuccess }: { ko: boolean; onClose: () => void; onSuccess: () => void }) {
  const [accessKey, setAk] = useState("");
  const [accessSecret, setAs] = useState("");
  const [merchantId, setMi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true); setErr(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/tossplace/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: accessKey.trim(), accessSecret: accessSecret.trim(), merchantId: merchantId.trim() }),
      });
      const d = await res.json();
      if (d.ok) await onSuccess();
      else setErr(d.error);
    } catch (e) { setErr((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "500px",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
        fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
      }}>
        <div style={{ padding: "22px 24px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {ko ? "TOSS Place 연결" : "Connect TOSS Place"}
            </div>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "rgba(15,23,42,0.4)", fontSize: "20px", padding: 0 }}>×</button>
          </div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginTop: "6px", letterSpacing: "-0.02em" }}>
            {ko ? "Access Key + Secret + 매장 ID 입력" : "Paste Access Key, Secret, Merchant ID"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", marginTop: "8px", lineHeight: 1.55 }}>
            {ko
              ? <>1. <a href="https://developer.tossplace.com" target="_blank" rel="noopener" style={{ color: "#2563eb" }}>developer.tossplace.com</a> 로그인 → 앱 등록 → Access Key 발급 (Secret은 1회만 표시)<br/>2. 매장 대시보드 → 앱 사용 활성화 토글 ON</>
              : <>1. Sign in to <a href="https://developer.tossplace.com" target="_blank" rel="noopener" style={{ color: "#2563eb" }}>developer.tossplace.com</a> → register app → issue Access Key<br/>2. Merchant dashboard → enable app toggle</>}
          </div>
        </div>

        <div style={{ padding: "18px 24px", display: "grid", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>Access Key</label>
            <input type="text" value={accessKey} onChange={(e) => setAk(e.target.value)} placeholder="tp_live_..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>Access Secret</label>
            <input type="password" autoComplete="off" value={accessSecret} onChange={(e) => setAs(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>{ko ? "매장 ID" : "Merchant ID"}</label>
            <input type="text" value={merchantId} onChange={(e) => setMi(e.target.value)} placeholder="merchant-xxxx" style={inputStyle} />
          </div>
          {err && <div style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 12px", color: "#b91c1c", fontSize: "12.5px" }}>{err}</div>}
        </div>

        <div style={{ display: "flex", gap: "8px", padding: "12px 24px 20px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={submit} disabled={!accessKey || !accessSecret || !merchantId || submitting} style={{ ...primaryBtn, opacity: !accessKey || !accessSecret || !merchantId ? 0.5 : 1 }}>
            {submitting ? (ko ? "검증 중…" : "Validating…") : ko ? "연결" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
