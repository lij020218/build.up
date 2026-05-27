"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PRICE = Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_KRW ?? 19900);
const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY ?? "";

const FREE_FEATURES = [
  "기본 매출·손익 대시보드",
  "AI 진단 하루 3회",
  "창업 로드맵 (기본)",
  "7일 데이터 보관",
];

const PREMIUM_FEATURES = [
  "무제한 데이터 보관",
  "AI 진단 무제한",
  "13주 현금흐름 예측",
  "고급 벤치마크 분석",
  "지원사업 자동 매칭",
  "세무·보험 시뮬레이터",
  "전체 업종 특화 카드",
  "우선 고객 지원",
];

type SubStatus = { plan: "free" | "premium"; status: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean } | null;

export default function PricingPage() {
  const router = useRouter();
  const [sub, setSub] = useState<SubStatus>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => setSub(data))
      .catch(() => setSub({ plan: "free", status: "active" }));
  }, []);

  const isPremium = sub?.plan === "premium" && sub?.status === "active";

  const handleCheckout = async () => {
    if (!STORE_ID || !CHANNEL_KEY) {
      setMessage("결제 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 사용자 정보 조회 (이름, 이메일)
      const profileRes = await fetch("/api/account/profile").catch(() => null);
      const profile = profileRes?.ok ? await profileRes.json() : {};

      const PortOne = await import("@portone/browser-sdk/v2");
      const paymentId = `bup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const response = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId,
        orderName: "build.up 프리미엄 1개월",
        totalAmount: PRICE,
        currency: "KRW",
        payMethod: "CARD",
        customer: {
          customerId: profile.userId ?? undefined,
          email: profile.email ?? undefined,
          fullName: profile.name ?? undefined,
        },
      });

      if (!response || response.code !== undefined) {
        setMessage(`결제 실패: ${response?.message ?? "결제가 취소됐거나 오류가 발생했습니다."}`);
        return;
      }

      // 서버에서 결제 검증 + 구독 활성화
      const verifyRes = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: response.paymentId ?? paymentId,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        setMessage(err.error ?? "구독 활성화에 실패했습니다.");
        return;
      }

      setMessage("프리미엄 구독이 시작됐습니다! 🎉");
      setSub({ plan: "premium", status: "active" });
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error(err);
      setMessage("결제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      color: "#1d1d1f",
    }}>
      {/* 네비 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(245,245,247,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button type="button" onClick={() => router.back()} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#0066cc", fontSize: "15px", fontWeight: 500, padding: 0,
        }}>← 뒤로</button>
        <span style={{ fontSize: "15px", fontWeight: 600 }}>요금제</span>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "56px 24px 80px" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
            사장님 경영의 새로운 기준
          </h1>
          <p style={{ fontSize: "18px", color: "#6e6e73", margin: 0, letterSpacing: "-0.005em" }}>
            처음엔 무료로. 더 많은 인사이트가 필요할 때 업그레이드.
          </p>
        </div>

        {/* 플랜 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* 무료 */}
          <div style={{
            background: "#fff", borderRadius: "24px",
            padding: "36px 32px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#6e6e73", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "16px" }}>무료</div>
            <div style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "4px" }}>₩0</div>
            <div style={{ fontSize: "14px", color: "#6e6e73", marginBottom: "32px" }}>영구 무료</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {FREE_FEATURES.map((f) => <Feature key={f} text={f} />)}
            </div>
            <button
              type="button"
              disabled
              style={{
                width: "100%", padding: "14px 0", borderRadius: "14px",
                border: "1.5px solid rgba(0,0,0,0.15)", background: "transparent",
                fontSize: "15px", fontWeight: 500, color: "#6e6e73", cursor: "default",
              }}
            >
              {isPremium ? "현재 플랜" : "현재 이용 중"}
            </button>
          </div>

          {/* 프리미엄 */}
          <div style={{
            background: "#1d3557", borderRadius: "24px",
            padding: "36px 32px", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              background: "rgba(255,255,255,0.12)", borderRadius: "0 24px 0 24px",
              padding: "6px 16px", fontSize: "12px", fontWeight: 600, color: "#fff",
              letterSpacing: "0.04em",
            }}>BEST</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "16px" }}>프리미엄</div>
            <div style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", marginBottom: "4px" }}>
              ₩{PRICE.toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "32px" }}>/ 월</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {PREMIUM_FEATURES.map((f) => <Feature key={f} text={f} dark />)}
            </div>

            {isPremium ? (
              <button
                type="button"
                onClick={() => router.push("/billing")}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: "14px",
                  border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent",
                  fontSize: "15px", fontWeight: 600, color: "#fff", cursor: "pointer",
                }}
              >
                구독 관리
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: "14px",
                  border: "none",
                  background: loading ? "rgba(255,255,255,0.2)" : "#fff",
                  fontSize: "15px", fontWeight: 700,
                  color: loading ? "rgba(255,255,255,0.5)" : "#1d3557",
                  cursor: loading ? "wait" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "결제 창 열는 중..." : `월 ₩${PRICE.toLocaleString()} 시작하기`}
              </button>
            )}

            {message && (
              <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: message.includes("🎉") ? "#a3e635" : "rgba(255,200,180,0.9)" }}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* 부가 설명 */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "#6e6e73", marginTop: "32px", lineHeight: 1.6 }}>
          언제든지 취소 가능 · 취소 후에도 이용 기간 만료까지 프리미엄 유지 · 카드 정보는 PortOne(포트원)에서 안전하게 관리
        </p>
      </div>
    </div>
  );
}

function Feature({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="9" fill={dark ? "rgba(255,255,255,0.12)" : "rgba(29,53,87,0.08)"} />
        <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke={dark ? "#a3e635" : "#1d3557"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: "14px", color: dark ? "rgba(255,255,255,0.85)" : "#1d1d1f" }}>{text}</span>
    </div>
  );
}
