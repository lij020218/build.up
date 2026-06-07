"use client";

/**
 * StaffDashboard — 직원 전용 대시보드.
 *
 * 진입 조건: business_profiles.user_role === 'staff' (또는 'manager').
 * 데이터 출처: 모든 정보 Supabase. 모바일·웹 디바이스 간 동일하게 보임.
 *
 * 노출 기능 (1차):
 *   - 가게 정보 (자신이 속한 owner 의 store_name)
 *   - 매출 입력 (오늘 매출)
 *   - 재고 확인
 *   - 사인아웃
 *
 * 노출 안 함:
 *   - 로드맵/창업 단계, 재무 시뮬레이션, AI 코칭, 직원 관리, 청구·구독 등 사장 전용 기능.
 *
 * TODO: 매출/재고 입력은 owner 가게의 데이터를 읽고 쓰도록 RLS + 별도 endpoint 가 추가되어야 완전 동작.
 *       지금은 1차 셸 — 직원 라우팅과 환영 화면, 사인아웃이 핵심.
 */

import { useEffect, useState } from "react";
import { LogOut, Store, Calendar, Boxes } from "lucide-react";
import { signOutUser } from "@foundone/shared";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";

type Membership = {
  ownerUserId: string;
  storeName: string;
  role: "staff" | "manager";
};

export function StaffDashboard({ language }: { language: "ko" | "en" }) {
  const ko = language === "ko";
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: memberRow } = (await supabase
          .from("store_members" as never)
          .select("owner_user_id, role")
          .eq("member_user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle()) as { data: { owner_user_id: string; role: "staff" | "manager" } | null };

        if (!memberRow) {
          setLoading(false);
          return;
        }

        const { data: storeRow } = (await supabase
          .from("user_store_data")
          .select("store_name")
          .eq("user_id", memberRow.owner_user_id)
          .maybeSingle()) as { data: { store_name: string | null } | null };

        setMembership({
          ownerUserId: memberRow.owner_user_id,
          storeName: storeRow?.store_name?.trim() || (ko ? "가게" : "Store"),
          role: memberRow.role,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [ko]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser(supabase);
      window.location.href = "/auth";
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--muted)" }}>
          {ko ? "직원 정보 불러오는 중…" : "Loading staff info…"}
        </div>
      </main>
    );
  }

  if (!membership) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={eyebrowStyle}>Found.One · {ko ? "직원" : "Staff"}</div>
          <h1 style={titleStyle}>{ko ? "아직 가게에 연결되지 않았어요" : "Not connected to a store yet"}</h1>
          <p style={subtitleStyle}>
            {ko
              ? "사장님에게 받은 초대 링크를 다시 클릭해 주세요. 링크는 7일간 유효합니다."
              : "Tap the invite link from your manager again. It's valid for 7 days."}
          </p>
          <button type="button" style={primaryBtn} onClick={handleSignOut} disabled={signingOut}>
            <LogOut size={14} strokeWidth={1.6} />
            {ko ? "로그아웃" : "Sign out"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>Found.One · {ko ? "직원 대시보드" : "Staff dashboard"}</div>
        <h1 style={titleStyle}>
          <span style={{ color: MIDNIGHT }}>{membership.storeName}</span>
          {ko ? "에서 일하고 있어요" : ""}
        </h1>
        <p style={subtitleStyle}>
          {ko
            ? "오늘 운영에 필요한 것만 보여드려요. 사장님 화면(매출 분석·로드맵·AI 코칭)은 직원 계정에서 보이지 않습니다."
            : "Only daily operations are shown here. Owner-only screens are hidden for staff accounts."}
        </p>

        <div style={chipRow}>
          <span style={chip}>
            <Store size={12} strokeWidth={1.6} /> {membership.storeName}
          </span>
          <span style={chip}>
            {ko ? "역할: " : "Role: "}
            <strong style={{ marginLeft: 4 }}>{membership.role === "manager" ? (ko ? "매니저" : "Manager") : ko ? "직원" : "Staff"}</strong>
          </span>
        </div>

        <div style={tilesGrid}>
          <button type="button" style={tileStyle} disabled>
            <Calendar size={16} strokeWidth={1.6} style={{ color: MIDNIGHT }} />
            <span style={tileTitle}>{ko ? "오늘 매출 입력" : "Today's sales"}</span>
            <span style={tileDesc}>{ko ? "근무 후 매출·결제 방식 기록" : "Log revenue/method after shift"}</span>
            <span style={tileSoon}>{ko ? "준비 중" : "Coming soon"}</span>
          </button>
          <button type="button" style={tileStyle} disabled>
            <Boxes size={16} strokeWidth={1.6} style={{ color: MIDNIGHT }} />
            <span style={tileTitle}>{ko ? "재고 확인" : "Inventory check"}</span>
            <span style={tileDesc}>{ko ? "오늘 부족한 재고 체크리스트" : "Today's low-stock list"}</span>
            <span style={tileSoon}>{ko ? "준비 중" : "Coming soon"}</span>
          </button>
        </div>

        <button type="button" style={signOutBtn} onClick={handleSignOut} disabled={signingOut}>
          <LogOut size={13} strokeWidth={1.6} />
          {signingOut ? (ko ? "로그아웃 중…" : "Signing out…") : ko ? "로그아웃" : "Sign out"}
        </button>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f5f7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "white",
  borderRadius: 24,
  padding: "40px 36px",
  boxShadow: "0 8px 40px rgba(15,23,42,0.06)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 14,
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 750,
  letterSpacing: "-0.02em",
  color: "#0f172a",
  textAlign: "center",
  margin: "0 0 10px",
  lineHeight: 1.35,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.65,
  textAlign: "center",
  margin: "8px 0 22px",
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
  marginBottom: 24,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  background: MIDNIGHT_SOFT,
  color: MIDNIGHT,
  fontSize: 12.5,
  fontWeight: 600,
};

const tilesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 22,
};

const tileStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  padding: "16px 16px 14px",
  borderRadius: 16,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: MIDNIGHT_SOFT,
  cursor: "not-allowed",
  opacity: 0.85,
  textAlign: "left",
};

const tileTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
  marginTop: 4,
};

const tileDesc: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  lineHeight: 1.5,
};

const tileSoon: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: MIDNIGHT,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginTop: 4,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 14,
  border: "none",
  background: MIDNIGHT,
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const signOutBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "white",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  margin: "0 auto",
};
