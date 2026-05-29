"use client";

/**
 * PortOneConnectCard — 사장님이 자기 포트원 V2 API Secret 을 Found.One 에 연결.
 *
 * UX 흐름:
 *   미연결 상태: "왜 연결?" + 보안 약속 + [연결하기] CTA
 *   클릭: 마법사 모달 → Step 1 (콘솔 가이드) → Step 2 (Secret 입력) → Step 3 (검증·완료)
 *   연결 상태: 마스킹된 Secret + 마지막 동기화 + [지금 동기화] / [연결 해제]
 *
 * 보안 약속:
 *   - 우리는 GET API 만 호출 (결제·환불·변경 절대 X)
 *   - Secret 은 AES-256-GCM 봉투 암호화 (KEK 별도)
 *   - 사장님이 언제든 1클릭 해제 가능
 */

import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type Status = {
  ok: boolean;
  connected?: boolean;
  storeId?: string | null;
  maskedSecret?: string | null;
  status?: "active" | "invalid" | "revoked";
  lastValidatedAt?: string | null;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  createdAt?: string | null;
  paymentCount30d?: number;
  error?: string;
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  padding: "16px 18px 12px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

export function PortOneConnectCard({ ko }: { ko: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setStatus({ ok: false, error: ko ? "로그인이 필요합니다." : "Sign-in required." });
        return;
      }
      const res = await fetch("/api/integrations/portone/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch (e) {
      setStatus({ ok: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [ko]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSync = async (full = false) => {
    setBusy(true);
    setSyncResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/integrations/portone/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fullBackfill: full }),
      });
      const data = await res.json();
      if (data.ok) {
        setSyncResult(
          ko
            ? `완료 — ${data.fetched}건 조회, ${data.upserted}건 저장`
            : `Done — ${data.fetched} fetched, ${data.upserted} stored`
        );
        await loadStatus();
      } else {
        setSyncResult(ko ? `실패: ${data.error}` : `Failed: ${data.error}`);
      }
    } catch (e) {
      setSyncResult(ko ? `오류: ${(e as Error).message}` : `Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(ko ? "정말 연결을 해제하시겠습니까?" : "Really disconnect?")) return;
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch("/api/integrations/portone/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadStatus();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <article style={card}>
        <div style={SECTION_LABEL}>{ko ? "외부 데이터 연결" : "External Data"}</div>
        <div style={{ padding: "20px 18px", color: "rgba(15,23,42,0.45)", fontSize: "12.5px" }}>
          {ko ? "불러오는 중…" : "Loading…"}
        </div>
      </article>
    );
  }

  const isConnected = status?.connected && status.status === "active";

  return (
    <>
      <article style={card}>
        <div style={SECTION_LABEL}>{ko ? "외부 데이터 연결" : "External Data"}</div>

        {!isConnected ? (
          /* ── 미연결 상태 ── */
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
              <div
                style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "linear-gradient(135deg, #1d3557 0%, #2c4f80 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(29,53,87,0.25)",
                  flexShrink: 0,
                }}
              >
                <Wallet size={18} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>
                  {ko ? "포트원으로 매출 자동 가져오기" : "Auto-sync revenue from PortOne"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                  {ko
                    ? "구독제·SaaS 사장님 — 매일 매출 입력 안 하셔도 됩니다. 한 번 연결하면 자동으로 끌어옵니다."
                    : "For SaaS / subscription sellers — connect once, never enter sales again."}
                </div>
              </div>
            </div>

            {/* 보안 약속 — 마이크로 카피 */}
            <div
              style={{
                background: "rgba(15,23,42,0.025)",
                border: "0.5px solid rgba(15,23,42,0.06)",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "12px",
                fontSize: "11.5px",
                color: "rgba(15,23,42,0.6)",
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 700, color: "rgba(15,23,42,0.75)", marginBottom: "4px" }}>
                {ko ? "🔒 보안 약속" : "🔒 Our promise"}
              </div>
              <div>
                {ko
                  ? "• 매출 조회 GET API 만 사용 — 결제·환불·변경 작업 절대 X\n• AES-256-GCM 봉투 암호화 보관\n• 회원 개인정보 가져오지 않음 (매출 통계만)\n• 1클릭 해제 가능"
                  : "• Read-only GET API — never modifies anything\n• AES-256-GCM envelope encryption\n• No customer PII — sales stats only\n• 1-click disconnect"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWizard(true)}
              style={primaryBtn}
            >
              {ko ? "포트원 연결하기 →" : "Connect PortOne →"}
            </button>
          </div>
        ) : (
          /* ── 연결됨 상태 ── */
          <>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)",
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    {ko ? "포트원 연결됨" : "PortOne connected"}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", fontFamily: "monospace" }}>
                  {status?.maskedSecret ?? ""}
                </span>
              </div>
              <div style={{ display: "grid", gap: "4px", fontSize: "11.5px", color: "rgba(15,23,42,0.55)" }}>
                <div>
                  {ko ? "최근 30일 결제: " : "Last 30 days: "}
                  <strong style={{ color: "#0f172a" }}>{status?.paymentCount30d ?? 0}건</strong>
                </div>
                {status?.lastSyncAt && (
                  <div>
                    {ko ? "마지막 동기화: " : "Last sync: "}
                    {formatRelative(status.lastSyncAt, ko)}
                  </div>
                )}
                {status?.lastSyncError && (
                  <div style={{ color: "#b91c1c", fontWeight: 600 }}>
                    ⚠ {status.lastSyncError}
                  </div>
                )}
                {syncResult && (
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: syncResult.includes("실패") || syncResult.includes("오류") || syncResult.includes("Failed")
                        ? "rgba(239,68,68,0.06)"
                        : "rgba(34,197,94,0.06)",
                      color: syncResult.includes("실패") || syncResult.includes("오류") || syncResult.includes("Failed")
                        ? "#b91c1c"
                        : "#15803d",
                      fontWeight: 600,
                    }}
                  >
                    {syncResult}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", padding: "12px 18px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
              <button type="button" onClick={() => handleSync(false)} disabled={busy} style={secondaryBtn}>
                {busy ? (ko ? "동기화 중…" : "Syncing…") : ko ? "지금 동기화 (7일)" : "Sync now (7d)"}
              </button>
              <button type="button" onClick={() => handleSync(true)} disabled={busy} style={secondaryBtn}>
                {ko ? "전체 백필 (1년)" : "Full backfill (1y)"}
              </button>
              <button type="button" onClick={handleDisconnect} disabled={busy} style={dangerBtn}>
                {ko ? "연결 해제" : "Disconnect"}
              </button>
            </div>
          </>
        )}
      </article>

      {showWizard && (
        <ConnectWizard
          ko={ko}
          onClose={() => setShowWizard(false)}
          onSuccess={async () => {
            setShowWizard(false);
            await loadStatus();
          }}
        />
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Connect Wizard 모달
// ───────────────────────────────────────────────────────────────────────

function ConnectWizard({
  ko, onClose, onSuccess,
}: { ko: boolean; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState("");
  const [storeId, setStoreId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/integrations/portone/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ apiSecret: secret.trim(), storeId: storeId.trim() || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        await onSuccess();
      } else {
        setError(data.error ?? (ko ? "연결 실패" : "Failed"));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%", maxWidth: "520px",
          maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
          fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: "22px 24px 12px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {ko ? `포트원 연결 · ${step}/3` : `Connect PortOne · ${step}/3`}
            </div>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "rgba(15,23,42,0.4)", fontSize: "20px", padding: 0 }}>
              ×
            </button>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "6px", letterSpacing: "-0.02em" }}>
            {step === 1 && (ko ? "포트원 콘솔에서 V2 Secret 발급" : "Issue V2 Secret in PortOne Console")}
            {step === 2 && (ko ? "발급된 Secret 입력" : "Paste your Secret")}
            {step === 3 && (ko ? "검증 중…" : "Validating…")}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {step === 1 && (
            <ol style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "10px", fontSize: "13.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
              <li>
                {ko
                  ? <>포트원 콘솔(<a href="https://admin.portone.io" target="_blank" rel="noopener noreferrer" style={linkStyle}>admin.portone.io</a>) 에 <strong>Owner/Admin</strong> 계정으로 로그인</>
                  : <>Sign in to <a href="https://admin.portone.io" target="_blank" rel="noopener noreferrer" style={linkStyle}>admin.portone.io</a> as <strong>Owner/Admin</strong></>
                }
              </li>
              <li>{ko ? "좌측 메뉴 → [결제연동] → [API Keys]" : "Sidebar → [Integrations] → [API Keys]"}</li>
              <li>{ko ? "[V2 API Secret 발급] 버튼 클릭" : "Click [Generate V2 API Secret]"}</li>
              <li>{ko ? "이름: \"buildup-readonly\", 만료: 90일 권장" : "Name: \"buildup-readonly\", expiry: 90 days recommended"}</li>
              <li style={{ color: "#b45309", fontWeight: 600 }}>
                {ko ? "⚠ 발급 직후 한 번만 보입니다 — 미리 메모장에 복사하세요" : "⚠ Shown only once — copy to a notepad first"}
              </li>
              <li>{ko ? "복사한 Secret 을 다음 단계에 붙여넣으세요" : "Paste the copied Secret in the next step"}</li>
            </ol>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={fieldLabel}>
                  {ko ? "V2 API Secret" : "V2 API Secret"}
                  <span style={{ color: "#b91c1c", marginLeft: "3px" }}>*</span>
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="포트원 V2 Secret"
                  style={inputStyle}
                />
                <div style={fieldHint}>
                  {ko
                    ? "V1 키는 호환되지 않습니다. \"V2 API Secret\" 만 가능."
                    : "V1 keys not supported — must be V2 API Secret."}
                </div>
              </div>
              <div>
                <label style={fieldLabel}>
                  {ko ? "Store ID (멀티스토어인 경우)" : "Store ID (multi-store only)"}
                </label>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  placeholder={ko ? "store-xxxx (옵션)" : "store-xxxx (optional)"}
                  style={inputStyle}
                />
                <div style={fieldHint}>
                  {ko ? "단일 스토어면 비워 두세요." : "Leave empty for single store."}
                </div>
              </div>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 12px", color: "#b91c1c", fontSize: "12.5px", lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)" }}>
                {ko ? "포트원에 검증 호출 중…" : "Calling PortOne to validate…"}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 — 스텝 네비 */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 24px 20px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
          {step > 1 && step < 3 && (
            <button type="button" onClick={() => setStep(step - 1)} style={{ ...secondaryBtn, flex: 0 }}>
              {ko ? "← 이전" : "← Back"}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step === 1 && (
            <button type="button" onClick={() => setStep(2)} style={primaryBtn}>
              {ko ? "다음 →" : "Next →"}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={async () => { setStep(3); await handleSubmit(); if (!error) setStep(2); }}
              disabled={!secret.trim() || submitting}
              style={{ ...primaryBtn, opacity: !secret.trim() ? 0.5 : 1 }}
            >
              {submitting ? (ko ? "검증 중…" : "Validating…") : ko ? "연결" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 유틸 ──────────────────────────────────────────────────────────────

function formatRelative(iso: string, ko: boolean): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return ko ? "방금 전" : "just now";
  if (minutes < 60) return ko ? `${minutes}분 전` : `${minutes}m ago`;
  if (hours < 24) return ko ? `${hours}시간 전` : `${hours}h ago`;
  return ko ? `${days}일 전` : `${days}d ago`;
}

// ─── 스타일 ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)",
  overflow: "hidden",
  marginTop: "12px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const primaryBtn: React.CSSProperties = {
  fontSize: "13px", fontWeight: 650,
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  // Found.One 시그니처 인디고 그라데이션
  background: "linear-gradient(135deg, #1d3557 0%, #2c4f80 100%)",
  color: "#fff",
  cursor: "pointer",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(29,53,87,0.18)",
};

const secondaryBtn: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600,
  padding: "8px 12px",
  borderRadius: "9px",
  border: "1px solid rgba(15,23,42,0.1)",
  background: "#fff",
  color: "rgba(15,23,42,0.75)",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  ...secondaryBtn,
  marginLeft: "auto",
  color: "#b91c1c",
  borderColor: "rgba(220,38,38,0.2)",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "12px", fontWeight: 700,
  color: "rgba(15,23,42,0.7)",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(15,23,42,0.12)",
  fontSize: "13px",
  fontFamily: "monospace",
  outline: "none",
  background: "#f8fafc",
};

const fieldHint: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(15,23,42,0.5)",
  marginTop: "4px",
  lineHeight: 1.4,
};

const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};
