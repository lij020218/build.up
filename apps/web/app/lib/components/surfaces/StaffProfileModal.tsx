"use client";

/**
 * StaffProfileModal — 직원용 「내 정보」 팝업 (2026-07-13)
 *
 * 배경: 직원 계정은 StaffDashboard 단일 화면이라 내 정보(계정·가게 연결·로그아웃)
 *   접근이 없었음 (사장님 지적). 사장 ProfileView 는 사장 전용 카드가 많아 재사용
 *   대신 직원에게 필요한 것만 담은 경량 팝업으로.
 *
 * 구성: ① 계정(이름·이메일) ② 소속 가게(가게명·역할) ③ 가게 연결(StoreConnectCard
 *   재사용 — 다른 가게 초대 수락·코드 입력) ④ 로그아웃
 */

import { useEffect, useState } from "react";
import { X, LogOut, UserRound, Store } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { StoreConnectCard } from "../profile/StoreConnectCard";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

export function StaffProfileModal({ storeName, role, ko, onClose, onSignOut, signingOut }: {
  storeName: string;
  role: "staff" | "manager";
  ko: boolean;
  onClose: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data?.user) return;
      setEmail(data.user.email ?? null);
      const meta = data.user.user_metadata as { name?: string } | null;
      setName(meta?.name ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 13 };
  const rowKey: React.CSSProperties = { width: 64, fontSize: 11.5, fontWeight: 700, color: MUTED, flexShrink: 0 };
  const rowVal: React.CSSProperties = { fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const sectionTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 750, color: MIDNIGHT, marginBottom: 10 };
  const section: React.CSSProperties = { padding: "14px 16px", borderRadius: 16, border: `1px solid ${MIDNIGHT_BORDER}`, marginBottom: 12 };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 420, maxHeight: "86vh", overflowY: "auto",
        background: "white", borderRadius: 22, padding: "24px 22px",
        boxShadow: "0 24px 80px rgba(25,25,112,0.25)", border: "1px solid rgba(25,25,112,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>{ko ? "내 정보" : "My account"}</span>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"} style={{ marginLeft: "auto", border: "none", background: MIDNIGHT_SOFT, borderRadius: 10, padding: 7, cursor: "pointer" }}>
            <X size={15} strokeWidth={2.2} style={{ color: MIDNIGHT, display: "block" }} />
          </button>
        </div>

        {/* ① 계정 */}
        <div style={section}>
          <div style={sectionTitle}><UserRound size={13} strokeWidth={2} />{ko ? "계정" : "Account"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {name && (
              <div style={row}><span style={rowKey}>{ko ? "이름" : "Name"}</span><span style={rowVal}>{name}</span></div>
            )}
            <div style={row}><span style={rowKey}>{ko ? "이메일" : "Email"}</span><span style={rowVal}>{email ?? "…"}</span></div>
          </div>
        </div>

        {/* ② 소속 가게 */}
        <div style={section}>
          <div style={sectionTitle}><Store size={13} strokeWidth={2} />{ko ? "소속 가게" : "Workplace"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 750, color: INK }}>{storeName}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: MIDNIGHT_SOFT, padding: "2px 8px", borderRadius: 999 }}>
              {role === "manager" ? (ko ? "매니저" : "Manager") : ko ? "직원" : "Staff"}
            </span>
          </div>
        </div>

        {/* ③ 가게 연결 — 다른 가게 초대 수락·코드 입력 (기존 카드 재사용) */}
        <div style={{ marginBottom: 12 }}>
          <StoreConnectCard ko={ko} />
        </div>

        {/* ④ 로그아웃 */}
        <button type="button" onClick={onSignOut} disabled={signingOut} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "12px 16px", borderRadius: 12, border: `1px solid ${MIDNIGHT_BORDER}`,
          background: "white", color: MUTED, fontSize: 13, fontWeight: 600,
          cursor: signingOut ? "default" : "pointer", opacity: signingOut ? 0.6 : 1,
        }}>
          <LogOut size={14} strokeWidth={1.8} />
          {signingOut ? (ko ? "로그아웃 중…" : "Signing out…") : ko ? "로그아웃" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
