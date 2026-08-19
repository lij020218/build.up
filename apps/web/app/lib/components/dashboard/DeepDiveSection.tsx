"use client";

/**
 * DeepDiveSection — 접이식 섹션 래퍼.
 *
 * 운영 대시보드의 "드릴다운 존"을 범주별로 그룹화.
 * 기본 접힘 상태, localStorage로 섹션별 상태 기억.
 *
 * 디자인:
 *  - 카드 톤 (다른 운영 카드와 일관) — border + 미묘한 그라데이션
 *  - 우측에 도구 개수 + Chevron 으로 "여기 펼칠 수 있는 N개 도구가 있다" 신호 명확
 *  - hover 시 배경 진해짐 + 우측 chevron 약간 슬라이드
 *  - 펼친 상태에서는 헤더 bg 더 진해져 "활성" 표시
 */

import { useState, useEffect, Children, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type DeepDiveSectionProps = {
  id: string;                     // 상태 persist 용 key
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  /** 한국어 모드 — 라벨 분기. 미지정 시 한국어 (Found.One 기본). */
  ko?: boolean;
};

const LS_KEY = "foundone-deepdive-open";

function loadOpenState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOpenState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota */ }
}

/**
 * 아직 마운트되지 않은 DeepDive 를 "펼침" 으로 예약 (2026-08-19 세그먼트 IA).
 *  홈이 오늘/운영/더보기 세그먼트로 나뉘어 대상 섹션이 다른 탭에 있으면 이벤트 리스너가 없다.
 *  orchestrator 가 탭을 바꾸면서 이 함수로 저장 상태만 true 로 두면 마운트 시 loadOpenState 로 펼쳐진다.
 */
export function markDeepDiveOpen(id: string) {
  const saved = loadOpenState();
  saveOpenState({ ...saved, [id]: true });
}

export function DeepDiveSection({ id, title, subtitle, defaultOpen = false, children, ko = true }: DeepDiveSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hover, setHover] = useState(false);

  // children 개수 — "N개 도구" 라벨에 사용
  const toolCount = Children.count(children);

  useEffect(() => {
    const saved = loadOpenState();
    if (id in saved) setOpen(saved[id]);
  }, [id]);

  // 외부 컴포넌트에서 이 섹션을 강제로 펼치도록 트리거 — window CustomEvent 통해 listen
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id === id) {
        setOpen(true);
        const saved = loadOpenState();
        saveOpenState({ ...saved, [id]: true });
      }
    };
    window.addEventListener("buildup:open-deepdive", handler);
    return () => window.removeEventListener("buildup:open-deepdive", handler);
  }, [id]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      const saved = loadOpenState();
      saveOpenState({ ...saved, [id]: next });
      return next;
    });
  };

  // 헤더 background — open / hover 상태에 따라 변화
  const headerBg = open
    ? "linear-gradient(135deg, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0.025) 100%)"
    : hover
    ? "linear-gradient(135deg, rgba(25,25,112,0.045) 0%, rgba(25,25,112,0.018) 100%)"
    : "linear-gradient(135deg, rgba(25,25,112,0.03) 0%, rgba(255,255,255,0.5) 100%)";

  const headerBorder = open
    ? "1px solid rgba(25,25,112,0.18)"
    : hover
    ? "1px solid rgba(25,25,112,0.14)"
    : "1px solid rgba(25,25,112,0.08)";

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: open ? "12px" : "0",
        transition: "gap 0.2s ease",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%",
          padding: "16px 18px",
          background: headerBg,
          border: headerBorder,
          borderRadius: "16px",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
          boxShadow: hover && !open ? "0 4px 14px rgba(25,25,112,0.08)" : "none",
        }}
      >
        {/* 좌측: 제목 + 부제 + 카운트 dot */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13.5px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "rgba(15,23,42,0.85)",
          }}>
            <span>{title}</span>
            {/* 카운트 칩 — "여기 N개 도구가 있다" */}
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: "20px", height: "18px",
              padding: "0 6px",
              borderRadius: "999px",
              background: open ? "rgba(25,25,112,0.85)" : "rgba(25,25,112,0.12)",
              color: open ? "#fff" : "rgba(25,25,112,0.85)",
              fontSize: "10.5px", fontWeight: 700,
              letterSpacing: "0.01em",
              transition: "background 0.18s ease, color 0.18s ease",
            }}>
              {toolCount}
            </span>
          </div>
          {subtitle && (
            <div style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--muted)",
              letterSpacing: "-0.005em",
              lineHeight: 1.45,
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* 우측: "펼치기" 또는 "접기" 액션 라벨 + Chevron */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 11px",
          borderRadius: "999px",
          background: open ? "rgba(25,25,112,0.92)" : "#fff",
          border: open ? "1px solid rgba(25,25,112,0.92)" : "1px solid rgba(25,25,112,0.18)",
          color: open ? "#fff" : "rgba(25,25,112,0.85)",
          fontSize: "11.5px",
          fontWeight: 650,
          letterSpacing: "-0.005em",
          flexShrink: 0,
          transition: "all 0.18s ease",
          transform: hover && !open ? "translateX(2px)" : "translateX(0)",
        }}>
          <span>{open ? (ko ? "접기" : "Close") : (ko ? `${toolCount}개 도구 펼치기` : `Show ${toolCount} tools`)}</span>
          <ChevronDown
            size={13}
            strokeWidth={2.25}
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </div>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {children}
        </div>
      )}
    </section>
  );
}
