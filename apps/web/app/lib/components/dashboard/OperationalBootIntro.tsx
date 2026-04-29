"use client";

/**
 * OperationalBootIntro — 운영 대시보드 진입 시 미니멀 부팅 인트로 (총 2.0s)
 *
 * 톤: 미드나이트 블루 단색 + 비즈니스/미래 모노스페이스 톤 + Vertical Split 전환
 *
 * 시퀀스 (총 2.0s):
 *  0.00~0.30s : fade in (배경 + 텍스트 등장)
 *  0.30~1.30s : 텍스트 풀 노출 + 마지막 점(.) 펄스
 *  1.30~1.55s : 텍스트 fade-out (살짝 위로 이동)
 *  1.45s      : 중앙 청록 글로우 라인 깜빡 (split 신호)
 *  1.50~2.00s : Vertical Split — 상/하 두 패널이 위/아래로 슬라이드, 그 사이로 대시보드 reveal
 *
 * 폰트: 시스템 모노스페이스 + uppercase + 트래킹 — 자비스 HUD 라벨 톤
 *
 * 표시 정책:
 *  - 운영 대시보드 마운트(진입) 마다 발화
 *  - ESC / 화면 클릭으로 즉시 dismiss
 *  - prefers-reduced-motion ON → 즉시 스킵
 */

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const TOTAL_DURATION_MS = 2000;
const TEXT_FADE_OUT_AT_MS = 1300;
const SPLIT_LINE_AT_MS = 1450;
const SPLIT_AT_MS = 1500;
const MIDNIGHT_BLUE = "#0e1a3a";

type Props = {
  /** 호출자(보통 OperationalDashboard) 가 mount 직후 트리거 */
  trigger: boolean;
  /** 인트로 종료(자연 종료 + 스킵 모두) 후 콜백 */
  onComplete?: () => void;
};

export default function OperationalBootIntro({ trigger, onComplete }: Props) {
  const reducedMotion = useReducedMotion();
  const [portalReady, setPortalReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [textFading, setTextFading] = useState(false);
  const [splitLineOn, setSplitLineOn] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!trigger) return;
    if (reducedMotion) {
      onCompleteRef.current?.();
      return;
    }
    setVisible(true);
  }, [trigger, reducedMotion]);

  // 시퀀스 타이머
  useEffect(() => {
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setTextFading(true), TEXT_FADE_OUT_AT_MS));
    timers.push(setTimeout(() => setSplitLineOn(true), SPLIT_LINE_AT_MS));
    timers.push(setTimeout(() => setSplitting(true), SPLIT_AT_MS));
    timers.push(setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, TOTAL_DURATION_MS));
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // ESC / 클릭으로 스킵
  const skip = () => {
    setVisible(false);
    onCompleteRef.current?.();
  };
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  // <html>/<body> 자체 배경을 미드나이트 블루 단색으로 swap (split 진행 중에도 뒷배경이 미드나이트로 보이도록)
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("bup-boot-intro-active");
    body.classList.add("bup-boot-intro-active");
    return () => {
      html.classList.remove("bup-boot-intro-active");
      body.classList.remove("bup-boot-intro-active");
    };
  }, [visible]);

  if (!portalReady) return null;

  const overlay = (
    <>
      <style>{`
        html.bup-boot-intro-active,
        body.bup-boot-intro-active {
          background: ${MIDNIGHT_BLUE} !important;
          transition: background 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
      <AnimatePresence>
        {visible ? (
          <div
            key="boot-intro-root"
            onClick={skip}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            {/* ─── 상단 패널 (50% 높이) — split 시 위로 슬라이드 ─── */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: splitting ? "-100%" : 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "50%",
                background: MIDNIGHT_BLUE,
                pointerEvents: "none",
              }}
            />

            {/* ─── 하단 패널 (50% 높이) — split 시 아래로 슬라이드 ─── */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: splitting ? "100%" : 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "50%",
                background: MIDNIGHT_BLUE,
                pointerEvents: "none",
              }}
            />

            {/* ─── 정중앙: Your future is loading. (모노 + uppercase + tracking) ─── */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{
                opacity: textFading ? 0 : 1,
                y: textFading ? -8 : 0,
              }}
              transition={{ duration: 0.35, ease: EASE, delay: textFading ? 0 : 0.1 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily:
                  '"IBM Plex Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                fontSize: "clamp(14px, 1.8vw, 22px)",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#e8eaf0",
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              <span>
                Your future is loading
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ display: "inline-block", marginLeft: "0.18em", color: "#2dd4bf" }}
                >
                  .
                </motion.span>
              </span>
            </motion.div>

            {/* ─── 중앙 청록 글로우 라인 (split 시작 신호) ─── */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{
                opacity: splitLineOn ? (splitting ? 0 : 1) : 0,
                scaleX: splitLineOn ? 1 : 0.3,
              }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 2,
                transform: "translateY(-50%)",
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.2) 20%, rgba(45, 212, 191, 1) 50%, rgba(45, 212, 191, 0.2) 80%, transparent 100%)",
                boxShadow:
                  "0 0 24px rgba(45, 212, 191, 0.7), 0 0 48px rgba(45, 212, 191, 0.4)",
              }}
            />

            {/* ─── 건너뛰기 버튼 (절제) ─── */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                skip();
              }}
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                padding: "5px 11px",
                fontSize: 10,
                fontFamily:
                  '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace',
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(232, 234, 240, 0.5)",
                background: "transparent",
                border: "1px solid rgba(232, 234, 240, 0.18)",
                borderRadius: 4,
                cursor: "pointer",
                opacity: splitting ? 0 : 1,
                transition: "opacity 0.3s ease",
                pointerEvents: splitting ? "none" : "auto",
              }}
            >
              SKIP · ESC
            </button>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );

  // ⚠ stacking context 회피 — `.dash-surface-enter` (will-change: transform) /
  // `.dash-stagger-item` (will-change: transform/opacity/filter) 가 부모 chain 에
  // 있으면 position: fixed 가 viewport 가 아니라 그 div 기준이 됨 → portal 로 body 에 직접 마운트.
  return createPortal(overlay, document.body);
}
