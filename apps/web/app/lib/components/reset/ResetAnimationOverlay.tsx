"use client";

/**
 * ResetAnimationOverlay — 데모 초기화 진행 풀스크린 오버레이.
 *
 * 디자인 원칙:
 *   • 미드나이트 블루(#191970) 브랜드 통일 (vendor_setup·registration_setup 와 매칭)
 *   • framer-motion 으로 의미 있는 애니메이션:
 *       1) 오버레이: scale + opacity 진입
 *       2) 중앙 아이콘: 회전하는 컨센트릭 링 (3겹) + 안쪽 펄스
 *       3) 단계 텍스트: AnimatePresence 로 키 전환 시 부드러운 fade
 *       4) 프로그레스 바: spring transition 으로 자연스러운 width 변화 + 빛 흐름 효과
 *       5) 완료 시: 체크마크 SVG draw 애니메이션 + 링 폭발
 *   • Apple loading sequence 같은 침착하고 신뢰감 있는 톤 (튀지 않게)
 *
 * Props:
 *   • progress (0~100)
 *   • ko (한국어 여부)
 *   • status (선택, 외부에서 명시적 단계 지정)
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useMemo } from "react";
import { FoundOneSpiralLogo } from "../ui/FoundOneSpiralLogo";

const MIDNIGHT = "#191970";

export type ResetAnimationOverlayProps = {
  progress: number;
  ko?: boolean;
};

export function ResetAnimationOverlay({ progress, ko = true }: ResetAnimationOverlayProps) {
  const isDone = progress >= 100;

  // 단계 메시지 — progress 기반 자동 분기 (4단계)
  const stage = useMemo(() => {
    if (progress < 25) return 0;
    if (progress < 60) return 1;
    if (progress < 95) return 2;
    return 3;
  }, [progress]);

  const stageMessages = ko
    ? [
        { primary: "초기화를 준비하고 있어요", secondary: "안전하게 시작할게요" },
        { primary: "모든 사업 정보를 초기화하는 중", secondary: "이 기기에 저장된 입력 내용을 정리하고 있어요" },
        { primary: "모든 사업 정보를 초기화하는 중", secondary: "가게·로드맵 기록을 깨끗이 비우고 있어요" },
        { primary: "거의 다 됐어요", secondary: "처음 시작 화면으로 이동합니다" },
      ]
    : [
        { primary: "Getting ready", secondary: "Starting safely" },
        { primary: "Resetting all your business info", secondary: "Clearing entries saved on this device" },
        { primary: "Resetting all your business info", secondary: "Wiping your store & roadmap records" },
        { primary: "Almost done", secondary: "Returning to the start screen" },
      ];

  const message = isDone
    ? { primary: ko ? "완료!" : "Done!", secondary: ko ? "잠시 후 첫 화면으로 이동합니다" : "Redirecting…" }
    : stageMessages[stage];

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at 50% 35%, rgba(25,25,112,0.06) 0%, rgba(255,255,255,1) 65%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "440px",
          textAlign: "center" as const,
          position: "relative",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════
            CENTRAL VISUAL — 회전하는 3겹 링 + 안쪽 아이콘
            ═════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            width: "140px",
            height: "140px",
            margin: "0 auto 32px",
          }}
        >
          {/* 외곽 링 1 — 시계방향 회전 (느림, 굵음) */}
          <motion.div
            animate={{ rotate: isDone ? 360 : 360 }}
            transition={{
              duration: 8,
              ease: "linear",
              repeat: isDone ? 0 : Infinity,
            }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "100%",
              border: `2px solid transparent`,
              borderTopColor: MIDNIGHT,
              borderRightColor: "rgba(25,25,112,0.45)",
              opacity: isDone ? 0.25 : 0.85,
            }}
          />

          {/* 중간 링 2 — 반시계방향 회전 (보통) */}
          <motion.div
            animate={{ rotate: isDone ? -360 : -360 }}
            transition={{
              duration: 5.5,
              ease: "linear",
              repeat: isDone ? 0 : Infinity,
            }}
            style={{
              position: "absolute",
              inset: "14px",
              borderRadius: "100%",
              border: "2px solid transparent",
              borderTopColor: "rgba(25,25,112,0.6)",
              borderLeftColor: "rgba(25,25,112,0.3)",
              opacity: isDone ? 0.2 : 0.7,
            }}
          />

          {/* 안쪽 링 3 — 시계방향 회전 (빠름, 미세) */}
          <motion.div
            animate={{ rotate: isDone ? 360 : 360 }}
            transition={{
              duration: 3,
              ease: "linear",
              repeat: isDone ? 0 : Infinity,
            }}
            style={{
              position: "absolute",
              inset: "30px",
              borderRadius: "100%",
              border: "1.5px solid transparent",
              borderTopColor: "rgba(25,25,112,0.5)",
              opacity: isDone ? 0 : 0.6,
            }}
          />

          {/* 중앙 아이콘 컨테이너 — 펄스 */}
          <motion.div
            animate={
              isDone
                ? { scale: [1, 1.18, 1] }
                : { scale: [1, 1.08, 1] }
            }
            transition={
              isDone
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 1.6, ease: "easeInOut", repeat: Infinity }
            }
            style={{
              position: "absolute",
              inset: "44px",
              borderRadius: "100%",
              background: isDone
                ? `linear-gradient(135deg, ${MIDNIGHT} 0%, #2c2c8c 100%)`
                : `linear-gradient(135deg, rgba(25,25,112,0.92) 0%, rgba(44,44,140,0.85) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isDone
                ? "0 12px 40px rgba(25,25,112,0.45)"
                : "0 8px 24px rgba(25,25,112,0.28)",
            }}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 18,
                    delay: 0.05,
                  }}
                >
                  <Check size={26} strokeWidth={3} color="#fff" />
                </motion.div>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {/* 브랜드 마크를 중앙에 — 바깥 3겹 링이 회전으로 진행감을 주므로 로고는 정적으로 또렷하게 */}
                  <FoundOneSpiralLogo size={30} color="#fff" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 완료 시 폭발 링 */}
          {isDone && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "100%",
                border: `2px solid ${MIDNIGHT}`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            STAGE TEXT — AnimatePresence 로 부드러운 전환
            ═════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDone ? "done" : `stage-${stage}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 720,
                letterSpacing: "-0.03em",
                color: MIDNIGHT,
                margin: "0 0 8px",
              }}
            >
              {message.primary}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted)",
                margin: "0 0 32px",
                lineHeight: 1.55,
              }}
            >
              {message.secondary}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            PROGRESS BAR — spring transition + shimmer
            ═════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "8px",
            borderRadius: "100px",
            background: "rgba(25,25,112,0.08)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 22,
              mass: 0.8,
            }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "100px",
              background: `linear-gradient(90deg, ${MIDNIGHT} 0%, #4a4ab8 100%)`,
              boxShadow: "0 0 12px rgba(25,25,112,0.35)",
            }}
          >
            {/* 빛 흐름 효과 (shimmer) */}
            {!isDone && (
              <motion.div
                animate={{ x: ["-50%", "200%"] }}
                transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "40%",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
            )}
          </motion.div>
        </div>

        {/* 진행률 숫자 + 도트 인디케이터 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "14px",
            paddingLeft: "2px",
            paddingRight: "2px",
          }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: stage === i && !isDone ? [1, 1.4, 1] : 1,
                  background:
                    isDone || stage > i
                      ? MIDNIGHT
                      : stage === i
                        ? "rgba(25,25,112,0.65)"
                        : "rgba(25,25,112,0.18)",
                }}
                transition={
                  stage === i && !isDone
                    ? { duration: 1.2, ease: "easeInOut", repeat: Infinity }
                    : { duration: 0.3 }
                }
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "100px",
                }}
              />
            ))}
          </div>
          <motion.div
            key={Math.floor(progress / 5)}
            initial={{ opacity: 0.4, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: "12.5px",
              fontWeight: 700,
              color: MIDNIGHT,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
            }}
          >
            {Math.round(Math.max(0, Math.min(100, progress)))}%
          </motion.div>
        </div>

        {/* 하단 안심 메시지 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            marginTop: "32px",
            fontSize: "11.5px",
            color: "var(--muted)",
            letterSpacing: "0.02em",
          }}
        >
          {ko ? "이 화면을 닫지 마세요. 자동으로 다음 화면으로 이동합니다." : "Don't close this screen. You'll be redirected automatically."}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
