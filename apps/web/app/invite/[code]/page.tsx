"use client";

/**
 * /invite/[code] — 사장님이 보낸 초대 링크의 도착 페이지.
 *
 * 시나리오:
 *   1) 사장이 HiringSetupStage 또는 운영 대시보드에서 `https://<host>/invite/ABCD1234` 발송
 *   2) 직원이 링크 클릭 → 이 페이지 도달
 *   3) "${owner_name}님의 ${store_name} 직원이 되신 걸 환영합니다" + 맞아요/아니에요
 *   4) 맞아요 → 로그인 안 된 경우 /auth 로 returnTo 포함 이동, 로그인된 경우 store_members upsert + user_role=staff
 *   5) 아니에요 → 안내 문구 + 닫기
 *
 * 백엔드: 마이그레이션 20260329_000029 (store_invites, store_members, business_profiles.user_role) 가 이미 존재.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const MIDNIGHT = "#191970";

type InviteRow = {
  id: string;
  owner_user_id: string;
  invite_code: string;
  role: "staff" | "manager";
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
};

type LookupState =
  | { status: "loading" }
  | { status: "invalid"; reason: "not-found" | "expired" | "used" | "self" | "error" }
  | { status: "valid"; invite: InviteRow; ownerName: string; storeName: string };

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const codeRaw = params?.code;
  const code = typeof codeRaw === "string" ? codeRaw.toUpperCase() : "";

  const [state, setState] = useState<LookupState>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!code) {
      setState({ status: "invalid", reason: "not-found" });
      return;
    }

    (async () => {
      try {
        const { data: invite, error: invErr } = (await supabase
          .from("store_invites" as never)
          .select("*")
          .eq("invite_code", code)
          .maybeSingle()) as { data: InviteRow | null; error: unknown };

        if (invErr || !invite) {
          setState({ status: "invalid", reason: "not-found" });
          return;
        }

        if (invite.used_by) {
          setState({ status: "invalid", reason: "used" });
          return;
        }

        if (new Date(invite.expires_at).getTime() < Date.now()) {
          setState({ status: "invalid", reason: "expired" });
          return;
        }

        // 본인이 자기에게 보낸 초대를 받지 못하게 방어
        const { data: { user: me } } = await supabase.auth.getUser();
        if (me && me.id === invite.owner_user_id) {
          setState({ status: "invalid", reason: "self" });
          return;
        }

        // 가게/사장님 정보 조회
        const { data: storeRow } = (await supabase
          .from("user_store_data")
          .select("store_name")
          .eq("user_id", invite.owner_user_id)
          .maybeSingle()) as { data: { store_name: string | null } | null };

        const { data: profileRow } = (await supabase
          .from("business_profiles")
          .select("user_id")
          .eq("user_id", invite.owner_user_id)
          .maybeSingle()) as { data: { user_id: string } | null };

        // 사장님 이름은 auth.users 메타데이터 / email 기반.
        //   클라이언트에선 다른 사용자 이메일에 직접 access 불가 → user_store_data 의 mission 같은 사인 사용 X.
        //   그냥 store_name 만 노출하고, ownerName 은 "사장님" 으로 통일.
        const ownerName = profileRow ? "사장님" : "사장님";
        const storeName = storeRow?.store_name?.trim() || "가게";

        setState({ status: "valid", invite, ownerName, storeName });
      } catch {
        setState({ status: "invalid", reason: "error" });
      }
    })();
  }, [code]);

  const acceptInvite = async () => {
    if (state.status !== "valid") return;
    setAccepting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 미로그인 → 로그인/가입 후 돌아오도록 redirect
      if (!user) {
        const returnTo = encodeURIComponent(`/invite/${code}`);
        router.push(`/auth?returnTo=${returnTo}&suggestRole=staff`);
        return;
      }

      // 본인 초대 방어
      if (user.id === state.invite.owner_user_id) {
        setState({ status: "invalid", reason: "self" });
        return;
      }

      // store_members upsert + invite 사용 표시
      await supabase.from("store_members" as never).upsert(
        {
          owner_user_id: state.invite.owner_user_id,
          member_user_id: user.id,
          role: state.invite.role || "staff",
        } as never,
        { onConflict: "owner_user_id,member_user_id" } as never,
      );
      await supabase
        .from("store_invites" as never)
        .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
        .eq("id", state.invite.id);
      await supabase
        .from("business_profiles")
        .update({ user_role: state.invite.role || "staff" } as never)
        .eq("user_id", user.id);

      setAccepted(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      console.error("[invite] accept failed:", err);
      setState({ status: "invalid", reason: "error" });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        {state.status === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            초대 정보를 확인하는 중…
          </div>
        )}

        {state.status === "invalid" && (
          <>
            <div style={eyebrowStyle}>Found.One</div>
            <h1 style={titleStyle}>
              {state.reason === "not-found" && "유효하지 않은 초대 링크입니다"}
              {state.reason === "expired" && "만료된 초대 링크입니다"}
              {state.reason === "used" && "이미 사용된 초대 링크입니다"}
              {state.reason === "self" && "본인이 보낸 초대는 받을 수 없습니다"}
              {state.reason === "error" && "초대 정보를 불러오지 못했습니다"}
            </h1>
            <p style={subtitleStyle}>
              {state.reason === "expired"
                ? "초대 링크는 발송 후 7일간 유효합니다. 사장님께 새 링크를 요청해 주세요."
                : "사장님께 정확한 링크를 다시 받아주세요."}
            </p>
            <button type="button" style={primaryBtnStyle} onClick={() => router.push("/")}>
              메인으로
            </button>
          </>
        )}

        {state.status === "valid" && !accepted && (
          <>
            <div style={eyebrowStyle}>Found.One · 직원 초대</div>
            <h1 style={titleStyle}>
              <span style={{ color: MIDNIGHT }}>{state.ownerName}</span>의<br />
              <span style={{ color: MIDNIGHT }}>{state.storeName}</span> 직원이<br />
              되신 걸 환영합니다
            </h1>
            <p style={subtitleStyle}>
              초대받은 가게가 맞으신가요? 잘못 도착했다면 「아니에요」를 눌러주세요. 한번 수락하면 직원 대시보드로 이동합니다.
            </p>

            <div style={infoRow}>
              <div style={infoChip}>가게: <strong>{state.storeName}</strong></div>
              <div style={infoChip}>역할: <strong>{state.invite.role === "manager" ? "매니저" : "직원"}</strong></div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                style={{ ...secondaryBtnStyle, flex: 1 }}
                disabled={accepting}
                onClick={() => router.push("/")}
              >
                아니에요 · 잘못 왔어요
              </button>
              <button
                type="button"
                style={{ ...primaryBtnStyle, flex: 1 }}
                disabled={accepting}
                onClick={acceptInvite}
              >
                {accepting ? "연결 중…" : "맞아요 · 직원으로 시작"}
              </button>
            </div>

            <div style={footnoteStyle}>
              아직 Found.One 계정이 없다면 「맞아요」를 누른 뒤 직원으로 회원가입하실 수 있습니다.
            </div>
          </>
        )}

        {state.status === "valid" && accepted && (
          <>
            <div style={eyebrowStyle}>Found.One</div>
            <h1 style={titleStyle}>
              {state.storeName} 가족이 되신 걸<br />축하합니다 🎉
            </h1>
            <p style={subtitleStyle}>잠시 후 직원 대시보드로 이동합니다…</p>
          </>
        )}
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
  maxWidth: 480,
  background: "white",
  borderRadius: 24,
  padding: "44px 36px",
  boxShadow: "0 8px 40px rgba(15,23,42,0.06)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 16,
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 750,
  letterSpacing: "-0.02em",
  color: "#0f172a",
  textAlign: "center",
  margin: "0 0 12px",
  lineHeight: 1.35,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.65,
  textAlign: "center",
  margin: "8px 0 20px",
};

const infoRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
  marginTop: 20,
};

const infoChip: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(25,25,112,0.06)",
  color: MIDNIGHT,
  fontSize: 12.5,
  fontWeight: 600,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  border: "none",
  background: MIDNIGHT,
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "white",
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const footnoteStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  textAlign: "center",
  marginTop: 18,
  lineHeight: 1.5,
};
