"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Sub = {
  plan: "free" | "premium";
  status: "active" | "canceled" | "past_due";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  billingMethodLabel?: string;
};

export default function BillingPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setSub({ plan: "free", status: "active" }); setLoading(false); return; }
      fetch("/api/billing/status", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setSub(data))
        .catch(() => setSub({ plan: "free", status: "active" }))
        .finally(() => setLoading(false));
    })();
  }, []);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setMessage("로그인이 필요합니다."); setCanceling(false); return; }
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error ?? "취소 처리에 실패했습니다."); return; }
      setMessage(data.message ?? "구독이 취소 예정으로 설정됐습니다.");
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
      setShowCancelConfirm(false);
    } finally {
      setCanceling(false);
    }
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f5f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      color: "#1d1d1f",
    }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(245,245,247,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 24px", display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#0066cc", fontSize: "15px", fontWeight: 500, padding: 0 }}>← 뒤로</button>
        <span style={{ fontSize: "15px", fontWeight: 600 }}>구독 관리</span>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6e6e73" }}>불러오는 중...</div>
        ) : !sub || sub.plan === "free" ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#6e6e73", marginBottom: "24px" }}>현재 무료 플랜을 이용 중입니다.</p>
            <button type="button" onClick={() => router.push("/pricing")} style={{
              padding: "14px 32px", borderRadius: "980px", border: "none",
              background: "#1d3557", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer",
            }}>
              프리미엄으로 업그레이드
            </button>
          </div>
        ) : (
          <>
            {/* 현재 플랜 카드 */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 24px", marginBottom: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 700 }}>프리미엄 플랜</div>
                  <StatusBadge status={sub.status} cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#1d3557" }}>
                  ₩{(19900).toLocaleString()}<span style={{ fontSize: "13px", fontWeight: 400, color: "#6e6e73" }}>/월</span>
                </div>
              </div>
              <Row label="현재 구독 기간" value={`${fmt(sub.currentPeriodStart)} ~ ${fmt(sub.currentPeriodEnd)}`} />
              {sub.billingMethodLabel && <Row label="결제 수단" value={sub.billingMethodLabel} />}
              {sub.cancelAtPeriodEnd ? (
                <Row label="자동 갱신" value={`${fmt(sub.currentPeriodEnd)} 이후 종료`} warning />
              ) : sub.status === "active" ? (
                <Row label="다음 결제 예정" value={`${fmt(sub.currentPeriodEnd)} · ₩${(19900).toLocaleString()}`} />
              ) : null}
            </div>

            {message && (
              <div style={{
                padding: "14px 18px", borderRadius: "14px",
                background: message.includes("실패") ? "rgba(255,59,48,0.08)" : "rgba(52,199,89,0.08)",
                border: `1px solid ${message.includes("실패") ? "rgba(255,59,48,0.15)" : "rgba(52,199,89,0.15)"}`,
                fontSize: "14px", color: message.includes("실패") ? "#c0392b" : "#1a6b3c",
                marginBottom: "16px",
              }}>{message}</div>
            )}

            {/* 액션 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button type="button" onClick={() => router.push("/pricing")} style={{
                padding: "14px 0", borderRadius: "14px", border: "1.5px solid rgba(29,53,87,0.2)",
                background: "transparent", fontSize: "15px", fontWeight: 500, color: "#1d3557", cursor: "pointer",
              }}>
                요금제 안내 보기
              </button>
              {!sub.cancelAtPeriodEnd && sub.status === "active" && (
                <button type="button" onClick={() => setShowCancelConfirm(true)} style={{
                  padding: "14px 0", borderRadius: "14px", border: "none",
                  background: "transparent", fontSize: "14px", color: "#6e6e73", cursor: "pointer",
                }}>
                  구독 취소
                </button>
              )}
            </div>

            {/* 취소 확인 모달 */}
            {showCancelConfirm && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 100,
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
              }} onClick={(e) => { if (e.target === e.currentTarget) setShowCancelConfirm(false); }}>
                <div style={{ background: "#fff", borderRadius: "24px", padding: "36px 28px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px" }}>구독을 취소할까요?</h3>
                  <p style={{ fontSize: "14px", color: "#6e6e73", lineHeight: 1.6, margin: "0 0 24px" }}>
                    취소해도 <strong>{fmt(sub.currentPeriodEnd)}</strong>까지는 프리미엄을 계속 이용할 수 있습니다.
                  </p>
                  <button type="button" onClick={handleCancel} disabled={canceling} style={{
                    width: "100%", padding: "13px 0", borderRadius: "12px",
                    border: "none", background: "#ff3b30", color: "#fff",
                    fontSize: "15px", fontWeight: 600, cursor: canceling ? "wait" : "pointer",
                    marginBottom: "10px",
                  }}>
                    {canceling ? "처리 중..." : "구독 취소"}
                  </button>
                  <button type="button" onClick={() => setShowCancelConfirm(false)} style={{
                    background: "none", border: "none", color: "#6e6e73", fontSize: "14px", cursor: "pointer",
                  }}>돌아가기</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd?: boolean }) {
  const label = cancelAtPeriodEnd ? "취소 예정" : status === "active" ? "이용 중" : status === "past_due" ? "결제 필요" : "취소됨";
  const color = cancelAtPeriodEnd ? "#f59e0b" : status === "active" ? "#34c759" : "#ff3b30";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "12px", color }}>{label}</span>
    </div>
  );
}

function Row({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize: "13px", color: "#6e6e73" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 500, color: warning ? "#f59e0b" : "#1d1d1f" }}>{value}</span>
    </div>
  );
}
