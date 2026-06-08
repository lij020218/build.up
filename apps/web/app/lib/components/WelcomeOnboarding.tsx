"use client";

import { useState } from "react";
import { FoundOneSpiralLogo } from "./ui/FoundOneSpiralLogo";

/**
 * Apple "Welcome to [App]" 스타일 온보딩.
 * 3 피처 하이라이트 + "시작하기" 버튼.
 * 첫 방문 시 1회만 표시. localStorage에 dismissed 상태 저장.
 */

type Props = {
  language: "ko" | "en";
  onComplete: () => void;
};

export function WelcomeOnboarding({ language, onComplete }: Props) {
  const ko = language === "ko";
  const [step, setStep] = useState(0); // 0=welcome, 1=features

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      color: "#2563eb",
      title: ko ? "단계별 창업 로드맵" : "Step-by-step Roadmap",
      desc: ko ? "업종 선택부터 오픈까지, AI가 맞춤 로드맵을 설계합니다." : "From choosing your industry to opening day, AI designs your custom roadmap.",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d3557" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      color: "#1d3557",
      title: ko ? "실시간 경영 분석" : "Real-time Business Analytics",
      desc: ko ? "매출, 비용, 손익분기를 한눈에. 위험 신호를 AI가 먼저 감지합니다." : "Revenue, costs, break-even at a glance. AI detects warning signs first.",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      color: "#7c3aed",
      title: ko ? "정부 지원사업 매칭" : "Government Program Matching",
      desc: ko ? "지금 신청 가능한 지원금·대출·멘토링을 자동으로 찾아드립니다." : "Automatically finds grants, loans, and mentoring you qualify for right now.",
    },
  ];

  if (step === 0) {
    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "transparent",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
          animation: "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}>
          {/* App icon */}
          <div style={{
            width: "80px", height: "80px", borderRadius: "22px",
            background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            boxShadow: "0 8px 24px rgba(29,53,87,0.2)",
          }}>
            <FoundOneSpiralLogo size={46} color="#fff" />
          </div>

          {/* Title — Apple "Welcome to" pattern */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: 450, color: "var(--muted)", lineHeight: 1.4 }}>
              {ko ? "환영합니다" : "Welcome to"}
            </div>
            <h1 style={{
              margin: "4px 0 0",
              fontSize: "36px",
              fontWeight: 760,
              letterSpacing: "-0.04em",
              color: "#0f172a",
              lineHeight: 1.1,
            }}>
              Found.One
            </h1>
          </div>

          <p style={{
            fontSize: "16px",
            lineHeight: 1.6,
            color: "var(--muted)",
            margin: "0 0 40px",
            maxWidth: "360px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {ko
              ? "당신의 사업을 처음부터 끝까지 함께합니다."
              : "Your business partner from start to finish."}
          </p>

          {/* Feature list — 3 items, staggered animation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left", marginBottom: "40px" }}>
            {features.map((f, i) => (
              <div
                key={f.title}
                style={{
                  display: "flex", gap: "16px", alignItems: "flex-start",
                  padding: "16px 18px", borderRadius: "18px",
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  animation: `fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both`,
                  animationDelay: `${200 + i * 120}ms`,
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: `${f.color}0a`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 640, color: "#0f172a", marginBottom: "2px", letterSpacing: "-0.01em" }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--muted)" }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA — full width, Apple style */}
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem("__foundone_welcomed", "true"); } catch {}
              onComplete();
            }}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(180deg, #1d3557 0%, #15293f 100%)",
              color: "#fff",
              fontSize: "17px",
              fontWeight: 640,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(29,53,87,0.2)",
              transition: "all 0.2s ease",
              letterSpacing: "-0.01em",
              animation: "fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
              animationDelay: "560ms",
            }}
          >
            {ko ? "시작하기" : "Get Started"}
          </button>
        </div>
      </main>
    );
  }

  return null;
}
