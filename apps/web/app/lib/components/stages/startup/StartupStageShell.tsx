"use client";

/**
 * StartupStageShell — 8개 소프트웨어/AI 트랙 startup 단계 UI 통일 primitives.
 *
 * VendorSetupStage 와 동일한 미드나이트 블루(#191970) Apple-style 패턴을
 * 모든 startup 단계에 적용한다.
 *
 * 제공:
 *   • StartupKeyActionHero — KEY ACTION 미드나이트 그라디언트 히어로 (제목 + 부제 + 3 미니 칩)
 *   • StartupSection       — 아이콘 헤더 + Apple grouped list 컨테이너
 *   • StartupListItem      — priority dot + name/desc/badge/chip
 *   • StartupPageNav       — 미드나이트 블루 페이지 네비 (이전/탭/다음)
 *
 * 모든 startup 단계는 이 shell 을 통해 시각적 일관성을 확보.
 */

import { type ReactNode } from "react";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { usePublishPageNav } from "../../../stores/page-nav-store";

export const MIDNIGHT = "#191970";
export const MIDNIGHT_SOFT = "rgba(25,25,112,0.08)";
export const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

export type StartupItemPriority = "primary" | "recommended" | "optional";

const PRIORITY_BADGE: Record<StartupItemPriority, { label: string; bg: string; fg: string; border: string }> = {
  primary: { label: "필수", bg: "rgba(25,25,112,0.10)", fg: MIDNIGHT, border: "rgba(25,25,112,0.25)" },
  recommended: { label: "권장", bg: "rgba(5,97,252,0.08)", fg: "#0561fc", border: "rgba(5,97,252,0.18)" },
  optional: { label: "선택", bg: "rgba(0,0,0,0.04)", fg: "rgba(15,23,42,0.60)", border: "rgba(0,0,0,0.08)" },
};

/* ───────────────────────────────────────────────────────────────────
 * KEY ACTION HERO — 미드나이트 그라디언트
 * ───────────────────────────────────────────────────────────────── */
export type KeyActionMiniCard = {
  icon: LucideIcon;
  label: string;
  detail: string;
};

export function StartupKeyActionHero({
  eyebrow,
  title,
  subtitle,
  miniCards,
}: {
  eyebrow?: string;
  title: string;
  subtitle: ReactNode;
  miniCards?: KeyActionMiniCard[];
}) {
  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "22px 22px 20px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #191970 0%, #2c2c8c 50%, #4a4ab8 100%)",
        color: "white",
        boxShadow: "0 8px 24px rgba(25,25,112,0.22)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {eyebrow && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>
            {eyebrow}
          </span>
        </div>
      )}

      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          lineHeight: 1.35,
          marginBottom: "8px",
          letterSpacing: "-0.015em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {title}
      </div>

      <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.9, position: "relative", zIndex: 1 }}>
        {subtitle}
      </div>

      {miniCards && miniCards.length > 0 && (
        <div
          style={{
            display: "grid",
            // ⚠️ 2026-05-19 모바일: 종전 `repeat(N, 1fr)` 은 4 mini cards 일 때 360px 화면에서
            //   칸당 ~80px 로 한 글자씩 wrap. auto-fit minmax 으로 모바일은 2 col, 데스크탑은 N col.
            gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
            gap: "8px",
            marginTop: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {miniCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                  <Icon size={11} strokeWidth={2.2} />
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}>{card.label}</span>
                </div>
                <div style={{ fontSize: "11px", lineHeight: 1.4, opacity: 0.92 }}>{card.detail}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * SECTION — 아이콘 헤더 + grouped list 컨테이너
 * ───────────────────────────────────────────────────────────────── */
export function StartupSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: MIDNIGHT_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "1px" }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * LIST ITEM — priority dot + name/desc/badge/chip
 * ───────────────────────────────────────────────────────────────── */
export type StartupListItemProps = {
  name: string;
  desc?: ReactNode;
  priority?: StartupItemPriority;
  chip?: string;
  url?: string;
  isLast?: boolean;
};

export function StartupListItem({ name, desc, priority = "recommended", chip, url, isLast }: StartupListItemProps) {
  const badge = PRIORITY_BADGE[priority];
  const hasUrl = !!url;

  const inner = (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        alignItems: "flex-start",
        background: "white",
        cursor: hasUrl ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (hasUrl) (e.currentTarget as HTMLElement).style.background = "rgba(25,25,112,0.025)";
      }}
      onMouseLeave={(e) => {
        if (hasUrl) (e.currentTarget as HTMLElement).style.background = "white";
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "100px",
          background: badge.fg,
          marginTop: "7px",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: desc ? "4px" : 0 }}>
          <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{name}</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "10.5px",
              fontWeight: 700,
              background: badge.bg,
              color: badge.fg,
              border: `1px solid ${badge.border}`,
              letterSpacing: "0.02em",
            }}
          >
            {badge.label}
          </span>
          {hasUrl && <ExternalLink size={13} strokeWidth={2.2} color="rgba(25,25,112,0.55)" />}
        </div>
        {desc && (
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>{desc}</div>
        )}
        {chip && (
          <div
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.04)",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "rgba(15,23,42,0.65)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {chip}
          </div>
        )}
      </div>
    </div>
  );

  const wrapped = hasUrl ? (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      {inner}
    </a>
  ) : (
    inner
  );

  return (
    <>
      {wrapped}
      {!isLast && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "36px" }} />}
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * PAGE NAV — 미드나이트 블루
 * ───────────────────────────────────────────────────────────────── */
export function StartupPageNav({
  page,
  totalPages,
  labels,
  onChange,
  ko = true,
}: {
  page: number;
  totalPages: number;
  labels: string[];
  onChange: (p: number) => void;
  ko?: boolean;
}) {
  // 현재 페이지 네비 상태를 공유 store 에 publish → 부모 푸터(CurrentStageView)가 페이지 인식형
  //   "다음 페이지 / 다음 단계로" 버튼을 렌더. 언마운트(비페이지형 스테이지로 전환) 시 clear.
  //   (발행 로직은 usePublishPageNav 로 공용화 — StageTabNav·자체 페이저 스테이지와 동일 경로)
  usePublishPageNav(page, totalPages, onChange);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          background: page === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: page === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px",
          fontWeight: 600,
          cursor: page === 0 ? "default" : "pointer",
          minHeight: "44px", // Apple HIG 터치 타겟
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        {ko ? "← 이전" : "← Prev"}
      </button>
      {/* ⚠️ 2026-05-19 모바일: 라벨 칩 가로 스크롤 (wrap 시 3줄 차지) + scroll-snap. */}
      <div
        className="startup-page-nav-chips"
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "nowrap" as const,
          overflowX: "auto",
          justifyContent: "center",
          maxWidth: "100%",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch" as const,
        }}
      >
        {labels.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              fontSize: "11.5px",
              fontWeight: i === page ? 700 : 500,
              background: i === page ? MIDNIGHT : "transparent",
              color: i === page ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              minHeight: "32px",
              flexShrink: 0,
              scrollSnapAlign: "start",
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          border: page === totalPages - 1 ? `1px solid ${MIDNIGHT_BORDER}` : "none",
          background: page === totalPages - 1 ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: page === totalPages - 1 ? "default" : "pointer",
          boxShadow: page === totalPages - 1 ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
          minHeight: "44px",
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        {ko ? "다음 →" : "Next →"}
      </button>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * REFERENCE LABEL — "↓ 심화 참고" 같은 분리 라벨
 * ───────────────────────────────────────────────────────────────── */
export function StartupReferenceLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "4px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "rgba(25,25,112,0.04)",
        border: `1px dashed ${MIDNIGHT_BORDER}`,
        fontSize: "11.5px",
        fontWeight: 600,
        color: "rgba(25,25,112,0.65)",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * BULLET CARD — 단일 카드 (제목 + 텍스트 + 옵션 컬러 점)
 * ───────────────────────────────────────────────────────────────── */
export function StartupBulletCard({
  title,
  body,
  accent = MIDNIGHT,
  variant = "default",
}: {
  title: string;
  body: ReactNode;
  accent?: string;
  variant?: "default" | "warning" | "tip";
}) {
  const bg =
    variant === "warning"
      ? "linear-gradient(180deg, rgba(220,38,38,0.04) 0%, rgba(255,255,255,0.98) 100%)"
      : variant === "tip"
        ? "linear-gradient(180deg, rgba(5,150,105,0.04) 0%, rgba(255,255,255,0.98) 100%)"
        : "white";
  const border =
    variant === "warning"
      ? "rgba(220,38,38,0.15)"
      : variant === "tip"
        ? "rgba(5,150,105,0.15)"
        : MIDNIGHT_BORDER;

  return (
    <div
      style={{
        borderRadius: "14px",
        border: `1px solid ${border}`,
        background: bg,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "100px", background: accent }} />
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.72)", lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}
