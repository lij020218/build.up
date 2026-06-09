"use client";

/**
 * FloatingInspiration — 위저드 카드 주변 흩뿌려진 brand 카드들 + 클릭 시 창업 스토리 모달.
 *
 * 인터랙션:
 *   · 카드 hover → drift 일시 정지
 *   · 카드 click → 창업 아이디어/스토리 모달
 *   · 모달 backdrop click / ESC → 닫기
 *
 * 로고: Simple Icons CDN (글로벌 브랜드) + glyph fallback (한국 브랜드).
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { inspirationBrands, type InspirationBrand } from "@foundone/shared";

// 데이터 SSOT: packages/shared/src/inspiration-data.ts (iOS FloatingInspirationView 와 공유).
type Brand = InspirationBrand;
const BRANDS: Brand[] = inspirationBrands;


type Placement = {
  xPct: number;
  yPct: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  rotate: number;
  opacity: number;
};

function placementFor(i: number): Placement {
  const positions: Array<[number, number]> = [
    [8,  12], [22, 22], [12, 38], [6,  58], [18, 72], [10, 88],
    [78, 8 ], [92, 24], [82, 42], [88, 60], [76, 78], [94, 90],
    [38, 6 ], [58, 14], [44, 92], [62, 86], [30, 50], [70, 50],
    [50, 30], [50, 70],
  ];
  const [xPct, yPct] = positions[i % positions.length];
  const seed = (i * 31) % 100;
  return {
    xPct, yPct,
    dx: 18 + (seed % 22),
    dy: 14 + ((seed * 3) % 18),
    duration: 16 + ((seed * 7) % 14),
    delay: -(seed % 12),
    rotate: ((seed % 7) - 3) * 0.6,
    opacity: 0.78 + ((seed % 10) / 50),
  };
}

export function FloatingInspiration() {
  const reduced = useReducedMotion();
  const [openBrand, setOpenBrand] = useState<Brand | null>(null);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute" as const,
          inset: 0,
          // 카드만 클릭 가능, wrapper 자체는 통과
          pointerEvents: "none" as const,
          overflow: "hidden" as const,
          zIndex: 0,
        }}
      >
        {BRANDS.map((b, i) => {
          const p = placementFor(i);
          const driftX = p.xPct < 50 ? p.dx : -p.dx;
          return (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, scale: 0.92, x: 0, y: 0, rotate: p.rotate }}
              animate={
                reduced
                  ? { opacity: p.opacity, scale: 1 }
                  : {
                      opacity: [0, p.opacity, p.opacity, 0],
                      scale: [0.92, 1, 1, 0.92],
                      x: [0, driftX * 0.5, driftX, driftX * 0.5, 0],
                      y: [0, -p.dy * 0.5, -p.dy, -p.dy * 0.5, 0],
                      rotate: [p.rotate, p.rotate + 0.8, p.rotate, p.rotate - 0.8, p.rotate],
                    }
              }
              transition={
                reduced
                  ? { duration: 0.6, delay: 0 }
                  : {
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.15, 0.5, 0.85, 1],
                    }
              }
              style={{
                position: "absolute" as const,
                top: `${p.yPct}%`,
                left: `${p.xPct}%`,
                transform: "translate(-50%, -50%)",
                willChange: "transform, opacity",
                pointerEvents: "auto" as const, // 카드만 클릭 가능
              }}
              whileHover={{ scale: 1.05, opacity: 1 }}
            >
              <BrandCard brand={b} onClick={() => setOpenBrand(b)} />
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {openBrand && (
          <BrandStoryModal brand={openBrand} onClose={() => setOpenBrand(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = !!brand.iconSlug && !iconFailed;
  const iconUrl = brand.iconSlug
    ? `https://cdn.simpleicons.org/${brand.iconSlug}/${brand.iconColor ?? "ffffff"}`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center" as const,
        gap: 12,
        padding: "12px 20px 12px 12px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(124,90,245,0.14)",
        boxShadow: "0 10px 28px rgba(124,90,245,0.14), 0 2px 6px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.8) inset",
        backdropFilter: "blur(14px)" as const,
        minWidth: 200,
        whiteSpace: "nowrap" as const,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 14px 36px rgba(124,90,245,0.22), 0 4px 10px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(124,90,245,0.14), 0 2px 6px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.8) inset"; }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: brand.color,
        color: brand.textColor ?? "#ffffff",
        display: "inline-flex", alignItems: "center" as const, justifyContent: "center" as const,
        fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.20) inset",
        overflow: "hidden" as const,
      }}>
        {showIcon && iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" width={26} height={26}
            style={{ width: 26, height: 26, display: "block" }}
            onError={() => setIconFailed(true)} />
        ) : (
          brand.glyph
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 2, minWidth: 0, textAlign: "left" as const }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: "#1e1a3e", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
          {brand.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(30,26,62,0.62)", letterSpacing: "-0.005em", lineHeight: 1.3 }}>
          {brand.tagline}
        </span>
      </div>
    </button>
  );
}

/* Modal section styles — Apple Settings · App Store 톤. 좌측 색 바 0, hairline divider 만. */
const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  marginBottom: 14,
};

const bodyParagraph: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.7,
  color: "#0f172a",
  fontWeight: 500,
  letterSpacing: "-0.005em",
};

function BrandStoryModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = !!brand.iconSlug && !iconFailed;
  const iconUrl = brand.iconSlug
    ? `https://cdn.simpleicons.org/${brand.iconSlug}/${brand.iconColor ?? "ffffff"}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed" as const,
        inset: 0,
        background: "rgba(20, 14, 50, 0.45)",
        backdropFilter: "blur(8px)" as const,
        display: "flex",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        zIndex: 100,
        padding: 24,
        cursor: "pointer",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "86vh",
          overflowY: "auto" as const,
          background: "white",
          borderRadius: 28,
          padding: "44px 44px 40px",
          boxShadow: "0 32px 80px rgba(20,14,50,0.28), 0 8px 24px rgba(20,14,50,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
          border: "1px solid rgba(0,0,0,0.04)",
          cursor: "default",
          position: "relative" as const,
        }}
      >
        {/* 닫기 — 우상단, 매우 미니멀 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute" as const,
            top: 16, right: 16,
            width: 28, height: 28,
            borderRadius: 999,
            border: "none",
            background: "rgba(0,0,0,0.04)",
            color: "rgba(0,0,0,0.45)",
            display: "inline-flex", alignItems: "center" as const, justifyContent: "center" as const,
            cursor: "pointer",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "rgba(0,0,0,0.7)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "rgba(0,0,0,0.45)"; }}
        >
          <X size={14} strokeWidth={1.5} />
        </button>

        {/* Header — 큰 로고 + 이름 (Apple App Store 톤) */}
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" as const, gap: 16, marginBottom: 28, textAlign: "center" as const }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: brand.color,
            color: brand.textColor ?? "#ffffff",
            display: "inline-flex", alignItems: "center" as const, justifyContent: "center" as const,
            fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
            flexShrink: 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.20) inset",
            overflow: "hidden" as const,
          }}>
            {showIcon && iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="" width={44} height={44}
                style={{ width: 44, height: 44, display: "block" }}
                onError={() => setIconFailed(true)} />
            ) : (
              brand.glyph
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.15 }}>
              {brand.name}
            </h2>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: "var(--muted)", letterSpacing: "-0.005em" }}>
              {brand.tagline} · {brand.founded}
            </div>
          </div>
        </div>

        {/* hairline divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 26 }} />

        {/* 시작 인사이트 — origin (no left bar, just pure typography) */}
        <section style={{ marginBottom: 28 }}>
          <div style={sectionLabel}>시작</div>
          <p style={bodyParagraph}>
            {brand.origin}
          </p>
        </section>

        {/* hairline divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 26 }} />

        {/* 핵심 차별점 — keys (numbered list, Apple style) */}
        <section style={{ marginBottom: 28 }}>
          <div style={sectionLabel}>차별점</div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" as const, display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {brand.keys.map((k, i) => (
              <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" as const }}>
                <span style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--muted)",
                  fontVariantNumeric: "tabular-nums" as const,
                  letterSpacing: "-0.01em",
                  width: 16,
                  paddingTop: 1,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  color: "#0f172a",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}>
                  {k}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* hairline divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 26 }} />

        {/* 사장님 교훈 — pull quote, no box, just typography */}
        <section>
          <div style={sectionLabel}>한 줄 교훈</div>
          <blockquote style={{
            margin: 0,
            fontSize: 18,
            lineHeight: 1.5,
            color: "#0f172a",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            position: "relative" as const,
            paddingLeft: 0,
          }}>
            <span style={{
              fontSize: 36,
              lineHeight: 1,
              color: "var(--muted)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              verticalAlign: "top",
              marginRight: 4,
              fontWeight: 400,
            }}>“</span>
            {brand.lesson}
            <span style={{
              fontSize: 36,
              lineHeight: 1,
              color: "var(--muted)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              verticalAlign: "bottom",
              marginLeft: 2,
              fontWeight: 400,
            }}>”</span>
          </blockquote>
        </section>
      </motion.div>
    </motion.div>
  );
}
