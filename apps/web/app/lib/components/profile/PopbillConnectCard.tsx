"use client";

/**
 * PopbillConnectCard — 홈택스 자동 수집 (Popbill 경유).
 *
 * 사장님 흐름:
 *   1) 사업자번호 입력 → /api/integrations/popbill/connect (회원사 가입 여부 확인)
 *   2) 회원이 아니면 popbill.com 가입 + 홈택스 인증서 등록 안내 (외부 링크)
 *   3) 등록 완료 후 "지금 동기화" → 세금계산서(매출/매입) + 현금영수증 자동 수집
 *
 * 자동 수집 데이터:
 *   - 전자세금계산서 매출/매입 (B2B)
 *   - 사장님이 발행한 현금영수증 (현금 매출 일부)
 *
 * 디자인: build.up 토큰 (lavender-mist 위 순백 카드 + 미드나잇 네이비 액센트).
 */

import { useCallback, useEffect, useState } from "react";
import { Receipt, ExternalLink, Lock } from "lucide-react";
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
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(30,42,85,0.12)",
  fontSize: "13px",
  outline: "none",
  background: "#F4F5FB",
};

type ConnStatus = {
  status?: "not_connected" | "pending" | "active" | "invalid" | "revoked";
  business_number_mask?: string;
  business_name?: string;
  hometax_cert_registered?: boolean;
  last_sync_at?: string | null;
  last_sync_error?: string | null;
};
type Stats30d = {
  taxinvoiceSell?: { count: number; amount: number };
  taxinvoiceBuy?: { count: number; amount: number };
  cashbill?: { count: number; amount: number };
};

/**
 * ⚠ COMING SOON 가드 — 팝빌은 사용량 과금 (월 0~3만원, 사장님 가게 규모에 따라).
 *   현재는 "추후 공개 예정" placeholder. 사용자 100명+ & 가치 입증 후 활성화.
 *   활성화 시: 이 export 본체를 `return <_PopbillConnectCardLive ko={ko} />;` 로 교체.
 */
export function PopbillConnectCard({ ko }: { ko: boolean }) {
  return (
    <article style={card}>
      <div style={sectionLabel}>
        {ko ? "홈택스 자동 수집 (팝빌)" : "Hometax Auto-Sync (Popbill)"}
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            padding: "16px 18px",
            filter: "blur(5px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.7,
          }}
          aria-hidden
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
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
              <Receipt size={18} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D" }}>
                {ko ? "세금계산서·현금영수증 자동 수집" : "Auto-collect tax invoices & cash receipts"}
              </div>
              <div style={{ fontSize: "12px", color: "#5A6BAE", lineHeight: 1.55, marginTop: "3px" }}>
                {ko
                  ? "사업자번호 등록 + 홈택스 인증서 1회 위임으로, 발행한 세금계산서·현금영수증 매출이 매일 자동으로 들어옵니다."
                  : "Register business number + delegate Hometax certificate once. Tax invoices & cash receipts auto-sync daily."}
              </div>
            </div>
          </div>
          <button type="button" style={primaryBtn} disabled>
            {ko ? "사업자번호 등록 →" : "Register business number →"}
          </button>
        </div>

        {/* 추후 공개 예정 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            cursor: "not-allowed",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "-0.005em",
              boxShadow: "0 4px 14px rgba(30,42,85,0.28)",
            }}
          >
            <Lock size={13} strokeWidth={2.25} />
            <span>{ko ? "추후 공개 예정" : "Coming Soon"}</span>
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "#5A6BAE",
              textAlign: "center",
              maxWidth: 320,
              padding: "0 24px",
              lineHeight: 1.5,
            }}
          >
            {ko
              ? "홈택스 세금계산서·현금영수증 자동 수집을 준비하고 있습니다 — 곧 만나보실 수 있어요."
              : "Hometax tax invoice & cash receipt auto-collection in preparation — coming soon."}
          </div>
        </div>
      </div>
    </article>
  );
}

// ⚠ 라이브 컴포넌트 — 추후 활성화 시 사용 (현재 dead code, 빌드에서 tree-shaken).
//   POPBILL_NOT_CONFIGURED 503 시 wizard 가 친절 메시지 응답.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _PopbillConnectCardLive({ ko }: { ko: boolean }) {
  const [conn, setConn] = useState<ConnStatus | null>(null);
  const [stats, setStats] = useState<Stats30d | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) return;
    try {
      const res = await fetch("/api/integrations/popbill/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const d = await res.json();
      if (d.ok) {
        setConn(d.connection ?? { status: "not_connected" });
        setStats(d.stats30d ?? null);
      }
    } catch {
      /* network — keep prior state */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/popbill/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDays: 30 }),
      });
      const d = await res.json();
      if (d.ok) {
        const total = (d.summary ?? []).reduce(
          (sum: number, s: { collected?: number }) => sum + (s.collected ?? 0),
          0,
        );
        setMsg(ko ? `완료 — ${total}건 수집` : `Done — ${total} items`);
      } else {
        setMsg(`❌ ${d.error}`);
      }
      await load();
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const isActive = conn?.status === "active" && conn?.hometax_cert_registered;
  const isPending = conn?.status === "pending" || (conn?.status === "active" && !conn?.hometax_cert_registered);
  const monthlySalesTotal = (stats?.taxinvoiceSell?.amount ?? 0) + (stats?.cashbill?.amount ?? 0);

  return (
    <>
      <article style={card}>
        <div style={sectionLabel}>
          {ko ? "홈택스 자동 수집 (팝빌)" : "Hometax Auto-Sync (Popbill)"}
        </div>

        {/* ── 미연결: 안내 + 연결 버튼 ── */}
        {!conn || conn.status === "not_connected" || !conn.business_number_mask ? (
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
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
                <Receipt size={18} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D" }}>
                  {ko
                    ? "세금계산서·현금영수증 자동 수집"
                    : "Auto-collect tax invoices & cash receipts"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#5A6BAE",
                    lineHeight: 1.55,
                    marginTop: "3px",
                  }}
                >
                  {ko
                    ? "사업자번호 등록 + 홈택스 인증서 1회 위임으로, 발행한 세금계산서·현금영수증 매출이 매일 자동으로 들어옵니다."
                    : "Register your business number + delegate Hometax certificate once. Sales from issued tax invoices & cash receipts will auto-sync daily."}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowWizard(true)} style={primaryBtn}>
              {ko ? "사업자번호 등록 →" : "Register business number →"}
            </button>
          </div>
        ) : (
          <>
            {/* ── 연결됨: 상태 + 통계 + 액션 ── */}
            <div style={{ padding: "14px 18px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: isActive ? "#3B5BBF" : "#D69121",
                      boxShadow: `0 0 6px ${isActive ? "rgba(59,91,191,0.5)" : "rgba(214,145,33,0.5)"}`,
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#141C3D" }}>
                    {isActive
                      ? ko
                        ? "연결됨"
                        : "Connected"
                      : ko
                        ? "인증서 위임 대기"
                        : "Awaiting certificate"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6B7393",
                    fontFamily: "monospace",
                  }}
                >
                  {conn.business_number_mask}
                </span>
              </div>

              {isPending && (
                <div
                  style={{
                    background: "#FFF6E5",
                    border: "1px solid rgba(214,145,33,0.25)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "10px",
                    fontSize: "11.5px",
                    color: "#8A5B11",
                    lineHeight: 1.55,
                  }}
                >
                  {ko
                    ? "팝빌(www.popbill.com)에 로그인 후 「홈택스 수집 → 인증서 등록」 메뉴에서 사장님 사업자 인증서를 위임해 주세요. 등록 후 자동 수집이 시작됩니다."
                    : "Log in to popbill.com and register your Hometax certificate under 「홈택스 수집」. Auto-sync begins after registration."}
                  <a
                    href="https://www.popbill.com/Content/Link/HomeTax"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginLeft: "6px",
                      color: "#1E2A55",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {ko ? "안내 보기" : "Guide"}
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                </div>
              )}

              {/* 30일 통계 */}
              {stats && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <Stat
                    label={ko ? "세금계산서 매출" : "Tax inv. (sell)"}
                    count={stats.taxinvoiceSell?.count ?? 0}
                    amount={stats.taxinvoiceSell?.amount ?? 0}
                    ko={ko}
                  />
                  <Stat
                    label={ko ? "세금계산서 매입" : "Tax inv. (buy)"}
                    count={stats.taxinvoiceBuy?.count ?? 0}
                    amount={stats.taxinvoiceBuy?.amount ?? 0}
                    ko={ko}
                  />
                  <Stat
                    label={ko ? "현금영수증" : "Cash receipt"}
                    count={stats.cashbill?.count ?? 0}
                    amount={stats.cashbill?.amount ?? 0}
                    ko={ko}
                  />
                </div>
              )}

              {isActive && stats && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "11.5px",
                    color: "#5A6BAE",
                    lineHeight: 1.5,
                  }}
                >
                  {ko ? "지난 30일 자동 매출 합계" : "Last 30d auto-collected sales"}:{" "}
                  <span style={{ color: "#141C3D", fontWeight: 700 }}>
                    {formatWon(monthlySalesTotal)}
                  </span>
                </div>
              )}

              {msg && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: msg.startsWith("❌") ? "#FCEEF1" : "#EAF2FF",
                    color: msg.startsWith("❌") ? "#9F1A2D" : "#1F46A8",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {msg}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px 18px",
                borderTop: "1px solid rgba(30,42,85,0.05)",
              }}
            >
              <button
                type="button"
                onClick={sync}
                disabled={busy || !isActive}
                style={{ ...secondaryBtn, opacity: busy || !isActive ? 0.5 : 1 }}
              >
                {busy ? (ko ? "동기화 중…" : "Syncing…") : ko ? "지금 동기화" : "Sync now"}
              </button>
              {!isActive && (
                <a
                  href="https://www.popbill.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...secondaryBtn,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {ko ? "팝빌 열기" : "Open Popbill"}
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
              )}
            </div>
          </>
        )}
      </article>

      {showWizard && (
        <PopbillWizard
          ko={ko}
          onClose={() => setShowWizard(false)}
          onSuccess={async () => {
            setShowWizard(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function Stat({
  label,
  count,
  amount,
  ko,
}: {
  label: string;
  count: number;
  amount: number;
  ko: boolean;
}) {
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "10px",
        background: "#F4F5FB",
      }}
    >
      <div style={{ fontSize: "10.5px", fontWeight: 650, color: "#5A6BAE", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#141C3D", letterSpacing: "-0.02em" }}>
        {count}
        {ko ? "건" : ""}
      </div>
      <div style={{ fontSize: "10.5px", color: "#6B7393", marginTop: "1px" }}>
        {formatWon(amount)}
      </div>
    </div>
  );
}

function formatWon(won: number): string {
  if (!won) return "—";
  if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억`;
  if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만원`;
  return `${won.toLocaleString()}원`;
}

function PopbillWizard({
  ko,
  onClose,
  onSuccess,
}: {
  ko: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [bn, setBn] = useState("");
  const [bname, setBname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; isMember: boolean; nextStep: string } | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/popbill/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessNumber: bn, businessName: bname || undefined }),
      });
      const d = await res.json();
      if (d.ok) {
        setResult({ status: d.status, isMember: d.isMember, nextStep: d.nextStep });
      } else if (d.code === "POPBILL_NOT_CONFIGURED" || res.status === 503) {
        // 운영자가 아직 팝빌 키를 발급하지 않은 상태. 사용자 친화적 메시지.
        setErr(
          ko
            ? "이 기능은 곧 활성화됩니다. 잠시 후 다시 시도해 주세요."
            : "This feature is being activated. Please try again soon.",
        );
      } else {
        setErr(d.error ?? (ko ? "연결 실패" : "Connection failed"));
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(20,28,61,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 30px 80px rgba(20,28,61,0.25)",
          fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            padding: "22px 24px 14px",
            borderBottom: "1px solid rgba(30,42,85,0.06)",
          }}
        >
          <div style={{ display: "flex" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#5A6BAE",
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
              }}
            >
              {ko ? "홈택스 자동 수집" : "Hometax Auto-Sync"}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: "auto",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#6B7393",
                fontSize: "20px",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#141C3D",
              marginTop: "6px",
              letterSpacing: "-0.02em",
            }}
          >
            {ko ? "사업자번호만 등록하면 됩니다" : "Just register your business number"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#5A6BAE",
              marginTop: "8px",
              lineHeight: 1.55,
            }}
          >
            {ko
              ? "build.up 가 팝빌(LinkHub)을 통해 홈택스에서 발행한 세금계산서·현금영수증을 자동으로 수집합니다. 인증서 위임은 등록 후 안내드려요."
              : "build.up auto-collects tax invoices and cash receipts from Hometax via Popbill (LinkHub)."}
          </div>
        </div>

        {!result ? (
          <>
            <div style={{ padding: "18px 24px", display: "grid", gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1E2A55",
                    marginBottom: "4px",
                  }}
                >
                  {ko ? "사업자등록번호 (10자리)" : "Business no. (10 digits)"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={bn}
                  onChange={(e) => setBn(e.target.value)}
                  placeholder="123-45-67890"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1E2A55",
                    marginBottom: "4px",
                  }}
                >
                  {ko ? "상호 (선택)" : "Business name (optional)"}
                </label>
                <input
                  type="text"
                  value={bname}
                  onChange={(e) => setBname(e.target.value)}
                  placeholder={ko ? "예) 사랑의 도시락" : "e.g., My Store"}
                  style={inputStyle}
                />
              </div>
              {err && (
                <div
                  style={{
                    background: "#FCEEF1",
                    border: "1px solid rgba(180,35,52,0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    color: "#9F1A2D",
                    fontSize: "12.5px",
                  }}
                >
                  {err}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px 24px 20px",
                borderTop: "1px solid rgba(30,42,85,0.06)",
              }}
            >
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={submit}
                disabled={!bn || submitting}
                style={{ ...primaryBtn, opacity: !bn ? 0.5 : 1 }}
              >
                {submitting ? (ko ? "확인 중…" : "Checking…") : ko ? "등록" : "Register"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "18px 24px", display: "grid", gap: "12px" }}>
              <div
                style={{
                  background: result.isMember ? "#EAF2FF" : "#FFF6E5",
                  border: `1px solid ${result.isMember ? "rgba(59,91,191,0.25)" : "rgba(214,145,33,0.25)"}`,
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: result.isMember ? "#1F46A8" : "#8A5B11",
                    marginBottom: "4px",
                  }}
                >
                  {result.isMember
                    ? ko
                      ? "✓ 팝빌 회원사 확인됨"
                      : "✓ Popbill membership found"
                    : ko
                      ? "⚠ 팝빌 가입 필요"
                      : "⚠ Popbill signup required"}
                </div>
                <div style={{ fontSize: "12px", color: "#5A6BAE", lineHeight: 1.55 }}>
                  {result.nextStep}
                </div>
              </div>
              {!result.isMember && (
                <a
                  href="https://www.popbill.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...primaryBtn,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    justifyContent: "center",
                  }}
                >
                  {ko ? "팝빌에서 가입 / 인증서 등록" : "Sign up & register cert at Popbill"}
                  <ExternalLink size={13} strokeWidth={2} />
                </a>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px 24px 20px",
                borderTop: "1px solid rgba(30,42,85,0.06)",
              }}
            >
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={onSuccess}
                style={primaryBtn}
              >
                {ko ? "완료" : "Done"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
