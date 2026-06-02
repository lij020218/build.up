"use client";

/**
 * CodefConnectCard — 캐시노트 모델 우회 (CODEF API).
 * 사장님이 사업자번호 + 대표자생년월일 + 카드사 입금계좌 입력 →
 * 10개 카드사 매출 자동 동기화.
 *
 * ⚠ 서버에 CODEF_CLIENT_ID/SECRET 환경변수 설정 필요.
 *    개발자가 developer.codef.io 가입 후 채워야 함.
 */
import { useCallback, useEffect, useState } from "react";
import { Layers, Lock } from "lucide-react";
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
  outline: "none", background: "#f8fafc",
};

const CARD_OPTIONS = [
  { code: "0301", name: "KB국민카드" },
  { code: "0302", name: "신한카드" },
  { code: "0303", name: "삼성카드" },
  { code: "0304", name: "현대카드" },
  { code: "0305", name: "롯데카드" },
  { code: "0306", name: "하나카드" },
  { code: "0307", name: "BC카드" },
  { code: "0308", name: "NH농협카드" },
  { code: "0309", name: "우리카드" },
  { code: "0310", name: "씨티카드" },
];

type Status = {
  ok: boolean;
  connected?: boolean;
  businessNumberMask?: string;
  businessName?: string;
  status?: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  salesCount30d?: number;
};

/**
 * ⚠ COMING SOON 가드 — CODEF 운영 비용 부담 (월 최소 5만~10만원 + 건당 과금) 고려해
 *   현재는 "추후 공개 예정" placeholder. 사용자 100명+ & 가치 입증 후 활성화.
 *   활성화 시: 이 export 본체를 `return <CodefConnectCardLive ko={ko} />;` 로 교체.
 */
export function CodefConnectCard({ ko }: { ko: boolean }) {
  return (
    <article style={card}>
      <div style={sectionLabel}>{ko ? "10개 카드사 매출 자동 (CODEF)" : "10 Card Companies Auto (CODEF)"}</div>
      <div style={{ position: "relative" }}>
        {/* ── 블러 처리된 placeholder 콘텐츠 ── */}
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
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
              flexShrink: 0,
            }}>
              <Layers size={18} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                {ko ? "캐시노트 방식 — 사업자번호 + 생년월일 + 계좌 1개" : "Like CashNote — 1-min setup"}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "3px" }}>
                {ko
                  ? "여신금융협회 통합조회로 KB·신한·삼성·현대·롯데·하나·BC·NH·우리·시티 10개 카드사 매출이 한 번에 들어옵니다."
                  : "Auto-sync from 10 Korean card companies via Korean Credit Finance Assoc."}
              </div>
            </div>
          </div>
          <button type="button" style={primaryBtn} disabled>
            {ko ? "10개 카드사 연결 →" : "Connect 10 cards →"}
          </button>
        </div>

        {/* ── 추후 공개 예정 오버레이 (frosted glass + Lock 배지) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            cursor: "not-allowed",
          }}
        >
          {/* Coming Soon 배지 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #1d3557 0%, #2c4f80 100%)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "-0.005em",
              boxShadow: "0 4px 14px rgba(29,53,87,0.28)",
            }}
          >
            <Lock size={13} strokeWidth={2.25} />
            <span>{ko ? "추후 공개 예정" : "Coming Soon"}</span>
          </div>

          {/* 부가 설명 */}
          <div
            style={{
              fontSize: "11.5px",
              color: "rgba(15,23,42,0.6)",
              textAlign: "center",
              maxWidth: 320,
              padding: "0 24px",
              lineHeight: 1.5,
            }}
          >
            {ko
              ? "여신금융협회 통합조회 연동을 준비하고 있습니다 — 곧 만나보실 수 있어요."
              : "Korean Credit Finance Assoc. integration is in preparation — available soon."}
          </div>
        </div>
      </div>
    </article>
  );
}

// ⚠ 라이브 컴포넌트 — 추후 활성화 시 사용 (현재 dead code, 빌드에서 tree-shaken).
//   CODEF_NOT_CONFIGURED 503 시 wizard 가 친절 메시지 응답.
// eslint-disable-next-line no-unused-vars
function CodefConnectCardLive({ ko }: { ko: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/integrations/codef/status", {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    setStatus((await res.json()) as Status);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sync = async () => {
    setBusy(true); setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/codef/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fromDays: 30 }),
      });
      const d = await res.json();
      setMsg(d.ok ? (ko ? `완료 — ${d.fetched}건` : `Done — ${d.fetched}`) : `❌ ${d.error}`);
      await load();
    } finally { setBusy(false); }
  };

  const isConn = status?.connected && status?.status === "active";

  return (
    <>
      <article style={card}>
        <div style={sectionLabel}>
          {ko ? "10개 카드사 매출 자동 (CODEF)" : "All 10 Card Cos Auto-Sync"}
        </div>
        {!isConn ? (
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
                flexShrink: 0,
              }}>
                <Layers size={18} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  {ko ? "캐시노트 방식 — 사업자번호 + 생년월일 + 계좌 1개" : "Like CashNote — 1-min setup"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "3px" }}>
                  {ko
                    ? "여신금융협회 통합조회로 KB·신한·삼성·현대·롯데·하나·BC·NH·우리·시티 10개 카드사 매출이 한 번에 들어옵니다."
                    : "Auto-sync from 10 Korean card companies via Korean Credit Finance Assoc."}
                </div>
              </div>
            </div>
            <div style={{
              background: "rgba(245,158,11,0.05)", border: "0.5px solid rgba(245,158,11,0.2)",
              borderRadius: "10px", padding: "9px 12px", marginBottom: "12px",
              fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.5,
            }}>
              {ko
                ? "⚠ 베타 — CODEF 계정이 서버에 설정되어 있어야 합니다 (관리자 셋업 필요)."
                : "⚠ Beta — requires CODEF account configured on server."}
            </div>
            <button type="button" onClick={() => setShowWizard(true)} style={primaryBtn}>
              {ko ? "10개 카드사 연결 →" : "Connect 10 Card Cos →"}
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
                  {status?.businessNumberMask}
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)" }}>
                {ko ? `최근 30일 카드매출 ${status?.salesCount30d}건` : `Last 30d: ${status?.salesCount30d}`}
              </div>
              {msg && (
                <div style={{
                  marginTop: "8px", padding: "6px 10px", borderRadius: "8px",
                  background: msg.startsWith("❌") ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
                  color: msg.startsWith("❌") ? "#b91c1c" : "#15803d",
                  fontSize: "12px", fontWeight: 600,
                }}>{msg}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", padding: "12px 18px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
              <button type="button" onClick={sync} disabled={busy} style={secondaryBtn}>
                {ko ? "지금 동기화" : "Sync now"}
              </button>
            </div>
          </>
        )}
      </article>

      {showWizard && <CodefWizard ko={ko} onClose={() => setShowWizard(false)} onSuccess={async () => { setShowWizard(false); await load(); }} />}
    </>
  );
}

function CodefWizard({ ko, onClose, onSuccess }: { ko: boolean; onClose: () => void; onSuccess: () => void }) {
  const [bn, setBn] = useState("");
  const [bd, setBd] = useState("");
  const [cc, setCc] = useState("0301");
  const [ba, setBa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true); setErr(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/codef/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber: bn,
          representativeBirthday: bd,
          cardCompany: cc,
          bankAccountNumber: ba,
        }),
      });
      const d = await res.json();
      if (d.ok) await onSuccess();
      else if (d.code === "CODEF_NOT_CONFIGURED" || res.status === 503) {
        setErr(ko
          ? "이 기능은 곧 활성화됩니다. 잠시 후 다시 시도해 주세요."
          : "This feature is being activated. Please try again soon.");
      } else setErr(d.error);
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
          <div style={{ display: "flex" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {ko ? "10개 카드사 연결" : "Connect 10 Card Cos"}
            </div>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "rgba(15,23,42,0.4)", fontSize: "20px", padding: 0 }}>×</button>
          </div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginTop: "6px", letterSpacing: "-0.02em" }}>
            {ko ? "사업자 + 카드사 입금계좌 1개만" : "Business + 1 card co. deposit account"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", marginTop: "8px", lineHeight: 1.55 }}>
            {ko
              ? "여신금융협회가 사업자번호 + 대표자 생년월일 + 카드사 입금계좌가 일치하면 10개 카드사 전체 매출을 자동으로 등록해 줍니다. 캐시노트와 같은 흐름이에요."
              : "Korean Credit Finance Assoc. auto-registers all 10 card cos when business number + birthday + 1 deposit account match."}
          </div>
        </div>

        <div style={{ padding: "18px 24px", display: "grid", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>{ko ? "사업자등록번호 (10자리)" : "Business no. (10 digits)"}</label>
            <input type="text" inputMode="numeric" maxLength={12} value={bn} onChange={(e) => setBn(e.target.value)} placeholder="123-45-67890" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>{ko ? "대표자 생년월일 (YYYYMMDD)" : "Representative birthday (YYYYMMDD)"}</label>
            <input type="text" inputMode="numeric" maxLength={8} value={bd} onChange={(e) => setBd(e.target.value)} placeholder="19850315" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>{ko ? "주거래 카드사" : "Primary card co."}</label>
            <select value={cc} onChange={(e) => setCc(e.target.value)} style={inputStyle}>
              {CARD_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "4px" }}>{ko ? "카드 매출 입금계좌" : "Card co. deposit account"}</label>
            <input type="text" inputMode="numeric" value={ba} onChange={(e) => setBa(e.target.value)} placeholder="123-456-789012" style={inputStyle} />
          </div>
          {err && <div style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 12px", color: "#b91c1c", fontSize: "12.5px" }}>{err}</div>}
        </div>

        <div style={{ display: "flex", gap: "8px", padding: "12px 24px 20px", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={submit} disabled={!bn || !bd || !ba || submitting} style={{ ...primaryBtn, opacity: !bn || !bd || !ba ? 0.5 : 1 }}>
            {submitting ? (ko ? "연결 중…" : "Connecting…") : ko ? "연결" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
