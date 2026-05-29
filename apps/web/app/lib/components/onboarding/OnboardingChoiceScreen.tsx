"use client";

/**
 * OnboardingChoiceScreen — 신규 사용자 시작 경로 선택.
 *
 * 3가지 선택지 (모두 동일한 미드나이트 톤 — 서비스 전체 톤 일관):
 *   · 직접 로드맵 (Compass icon, 단계별 안내, 약 30분)
 *   · AI 자동 로드맵 (Sparkles, 추천 배지, 약 5분 + AI)
 *   · 이미 운영 중 (Storefront icon, 즉시 시작)
 *
 * Apple Settings · Linear 톤. 미드나이트 단색 — 카드별 색 분리 X (이전엔 보라/초록 분리).
 * 차이는 **아이콘 + 추천 배지** 만으로 표현.
 */

import { motion } from "framer-motion";
import { Compass, Sparkles, Store, ArrowRight, Clock, Zap } from "lucide-react";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#0f0f4a";
const MIDNIGHT_8 = "rgba(25,25,112,0.08)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.10)";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const HINT = "rgba(15,23,42,0.4)";

type Props = {
  ko: boolean;
  onChooseManual: () => void;
  onChooseAI: () => void;
  onChooseExisting: () => void;
};

type Choice = {
  key: string;
  Icon: typeof Compass;
  title: string;
  desc: string;
  cta: string;
  effortLabel: string;
  effortIcon: typeof Clock;
  recommended?: boolean;
  onClick: () => void;
};

export function OnboardingChoiceScreen({ ko, onChooseManual, onChooseAI, onChooseExisting }: Props) {
  const choices: Choice[] = [
    {
      key: "manual",
      Icon: Compass,
      title: ko ? "직접 로드맵" : "Manual roadmap",
      desc: ko
        ? "업종 선택부터 개업까지, 19단계를 직접 차근차근 진행합니다."
        : "Walk through 19 stages from industry to opening — at your pace.",
      cta: ko ? "단계별로 시작" : "Start step by step",
      effortLabel: ko ? "약 30분" : "~30 min",
      effortIcon: Clock,
      onClick: onChooseManual,
    },
    {
      key: "ai",
      Icon: Sparkles,
      title: ko ? "AI 맞춤 로드맵" : "AI auto roadmap",
      desc: ko
        ? "아이디어 한 줄만 입력하면 AI가 예산·상권·공급업체·일정까지 전부 설계합니다."
        : "Describe your idea — AI plans budget, location, vendors, and timeline.",
      cta: ko ? "AI에게 맡기기" : "Let AI plan it",
      effortLabel: ko ? "5분 + AI" : "5 min + AI",
      effortIcon: Zap,
      recommended: true,
      onClick: onChooseAI,
    },
    {
      key: "existing",
      Icon: Store,
      title: ko ? "이미 운영 중" : "Already running",
      desc: ko
        ? "기존 가게 정보 (상호·매출·비용) 만 입력하면 운영 대시보드 즉시 사용."
        : "Enter store basics (name, revenue, costs) and jump straight to operations.",
      cta: ko ? "가게 등록 후 바로" : "Register and dashboard",
      effortLabel: ko ? "약 3분" : "~3 min",
      effortIcon: Clock,
      onClick: onChooseExisting,
    },
  ];

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: "32px 24px",
      position: "relative" as const,
      overflow: "hidden" as const,
    }}>
      {/* Ambient depth — 배경 미드나이트 hue */}
      <div aria-hidden style={{
        position: "absolute" as const, top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "min(90%, 1200px)", height: "60vh",
        background: "radial-gradient(ellipse at center, rgba(91,107,255,0.08) 0%, rgba(91,107,255,0) 60%)",
        pointerEvents: "none" as const,
      }} />
      <div aria-hidden style={{
        position: "absolute" as const, bottom: "-30%", right: "-10%",
        width: "60vh", height: "60vh",
        background: "radial-gradient(circle, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0) 60%)",
        pointerEvents: "none" as const,
      }} />

      <div style={{ width: "100%", maxWidth: 1080, position: "relative" as const, zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center" as const, marginBottom: 48 }}
        >
          <div style={{
            display: "inline-flex",
            alignItems: "center" as const,
            gap: 6,
            padding: "5px 12px",
            borderRadius: 999,
            background: "rgba(25,25,112,0.06)",
            color: MIDNIGHT,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            marginBottom: 18,
          }}>
            <Sparkles size={12} strokeWidth={1.5} />
            Found.One
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 5.5vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: MIDNIGHT_DEEP,
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}>
            {ko ? "어디서부터 시작할까요?" : "Where do you start?"}
          </h1>
          <p style={{
            fontSize: 16,
            color: MUTED,
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 540,
            marginInline: "auto",
            fontWeight: 500,
          }}>
            {ko
              ? "한 번 선택하면 이후 화면이 자동으로 정리됩니다. 언제든 설정에서 바꿀 수 있어요."
              : "Pick once — we'll set up the right experience. You can switch anytime."}
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {choices.map((c) => (
            <ChoiceCard key={c.key} choice={c} ko={ko} />
          ))}
        </motion.div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            textAlign: "center" as const,
            marginTop: 40,
            fontSize: 12.5,
            color: HINT,
            fontWeight: 500,
            lineHeight: 1.55,
          }}
        >
          {ko
            ? "어떤 선택이든 언제든 다른 모드로 전환할 수 있습니다 · 데이터는 모두 자동 저장"
            : "Switch modes anytime · Everything auto-saves"}
        </motion.div>
      </div>
    </main>
  );
}

function ChoiceCard({ choice, ko }: { choice: Choice; ko: boolean }) {
  const { Icon, effortIcon: EffortIcon, title, desc, cta, effortLabel, recommended, onClick } = choice;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileHover={{ y: -4, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.985 }}
      style={{
        position: "relative" as const,
        textAlign: "left" as const,
        padding: "28px 26px 22px",
        borderRadius: 22,
        // 추천 카드만 미세하게 강조 (단색 미드나이트, 보라 X)
        border: `1px solid ${recommended ? MIDNIGHT_BORDER : "rgba(15,23,42,0.07)"}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,248,254,0.98) 100%)",
        boxShadow: recommended
          ? "0 1px 3px rgba(25,25,112,0.06), 0 16px 40px -12px rgba(25,25,112,0.18)"
          : "0 1px 3px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.10)",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column" as const,
        gap: 14,
        minHeight: 280,
        overflow: "visible" as const,
      }}
    >
      {/* Recommended ribbon — 미드나이트 톤 */}
      {recommended && (
        <div style={{
          position: "absolute" as const,
          top: -10,
          right: 16,
          display: "inline-flex",
          alignItems: "center" as const,
          gap: 4,
          padding: "5px 11px",
          borderRadius: 999,
          background: MIDNIGHT,
          color: "white",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase" as const,
          boxShadow: "0 4px 12px rgba(25,25,112,0.28)",
        }}>
          <Sparkles size={10} strokeWidth={1.5} strokeLinecap="round" />
          {ko ? "추천" : "Recommended"}
        </div>
      )}

      {/* Icon — 미드나이트 단일 톤 (Apple SF) */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: MIDNIGHT_8,
        display: "inline-flex",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        color: MIDNIGHT,
      }}>
        <Icon size={22} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </div>

      {/* Title + desc */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 19,
          fontWeight: 700,
          color: MIDNIGHT_DEEP,
          letterSpacing: "-0.025em",
          marginBottom: 6,
          lineHeight: 1.25,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 13.5,
          color: MUTED,
          lineHeight: 1.6,
          fontWeight: 500,
          letterSpacing: "-0.005em",
        }}>
          {desc}
        </div>
      </div>

      {/* Effort badge + CTA — 모두 미드나이트 톤 */}
      <div style={{
        display: "flex",
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        gap: 12,
        paddingTop: 14,
        borderTop: "1px solid rgba(15,23,42,0.06)",
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center" as const,
          gap: 5,
          fontSize: 11.5,
          fontWeight: 600,
          color: HINT,
          letterSpacing: "-0.005em",
        }}>
          <EffortIcon size={12} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          {effortLabel}
        </span>
        <span style={{
          display: "inline-flex",
          alignItems: "center" as const,
          gap: 4,
          fontSize: 13,
          fontWeight: 700,
          color: MIDNIGHT,
          letterSpacing: "-0.005em",
        }}>
          {cta}
          <ArrowRight size={13} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </span>
      </div>
    </motion.button>
  );
}
