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

type InvalidReason = "not-found" | "expired" | "used" | "self" | "error";

type LookupState =
  | { status: "loading" }
  | { status: "invalid"; reason: InvalidReason }
  | { status: "valid"; ownerName: string; storeName: string; role: "staff" | "manager" };

// store_invites RPC 는 생성된 Database 타입에 없어(as never) 캐스팅으로 우회.
type RpcResult = { data: unknown; error: unknown };
const asInvalidReason = (r: unknown): InvalidReason =>
  r === "expired" || r === "used" || r === "self" || r === "not-found" ? r : "error";

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
        // 코드 기반 조회 — SECURITY DEFINER RPC 로 RLS 우회(받는 직원도 조회 가능).
        //   직접 store_invites SELECT 는 RLS(owner/used_by) 에 막혀 항상 not-found 였음.
        const { data, error } = (await supabase.rpc(
          "lookup_store_invite" as never,
          { p_code: code } as never,
        )) as RpcResult;

        if (error) {
          setState({ status: "invalid", reason: "error" });
          return;
        }

        const res = (data ?? {}) as {
          valid?: boolean;
          reason?: string;
          role?: string;
          store_name?: string;
        };

        if (!res.valid) {
          setState({ status: "invalid", reason: asInvalidReason(res.reason) });
          return;
        }

        // 사장님 이름은 타 사용자 이메일 접근 불가 → "사장님" 으로 통일, store_name 만 노출.
        setState({
          status: "valid",
          ownerName: "사장님",
          storeName: res.store_name?.trim() || "가게",
          role: res.role === "manager" ? "manager" : "staff",
        });
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

      // 수락 — store_members 등록 + invite used 마킹 + user_role 갱신을 서버에서 원자적으로.
      //   직접 테이블 write 는 RLS(owner 전용)에 막혀 직원이 수행 불가였음.
      const { data, error } = (await supabase.rpc(
        "accept_store_invite" as never,
        { p_code: code } as never,
      )) as RpcResult;

      if (error) {
        console.error("[invite] accept rpc failed:", error);
        setState({ status: "invalid", reason: "error" });
        return;
      }

      const res = (data ?? {}) as { ok?: boolean; reason?: string };
      if (!res.ok) {
        setState({ status: "invalid", reason: asInvalidReason(res.reason) });
        return;
      }

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
              <div style={infoChip}>역할: <strong>{state.role === "manager" ? "매니저" : "직원"}</strong></div>
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
