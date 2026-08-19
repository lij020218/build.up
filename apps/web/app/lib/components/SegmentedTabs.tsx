"use client";

/**
 * SegmentedTabs — 화면 상단 세그먼트 (웹 공용, iOS BUSegmentedControl 미러)
 *
 *  2026-08-19 사장님 지시: 한 화면에 요소가 꽉 차는 현상 배제 → 화면별 세그먼트로 progressive disclosure.
 *  스타일 = MarketingSurface 의 기존 필 세그먼트(선택=미드나잇 네이비)를 그대로 추출.
 *  선택 상태는 호출 측 useState. 탭당 핵심 블록만 두고 나머지는 접거나 시트로.
 */

import type { ReactNode } from "react";

export type SegmentedTabItem<K extends string> = {
  key: K;
  label: string;
  /** 우측 배지(대기 건수 등). 0/undefined 면 미표시 */
  badge?: number;
  /** 경고 점 */
  dot?: boolean;
};

export function SegmentedTabs<K extends string>({
  items, value, onChange, ariaLabel, right,
}: {
  items: SegmentedTabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  ariaLabel?: string;
  /** 세그먼트 우측 보조 요소(예: + 초대 버튼) */
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div role="tablist" aria-label={ariaLabel} style={{
        display: "flex", gap: 4, padding: 4, borderRadius: 14,
        background: "rgba(15,23,42,0.045)", width: "fit-content", maxWidth: "100%", overflowX: "auto",
      }}>
        {items.map((t) => {
          const active = t.key === value;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.key)}
              style={{
                padding: "8px 16px", borderRadius: 11, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
                cursor: "pointer", border: "none", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
                background: active ? "#191970" : "transparent",
                color: active ? "#fff" : "var(--muted)",
                boxShadow: active ? "0 2px 8px rgba(25,25,112,0.25)" : "none",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {t.label}
              {t.badge ? (
                <span style={{
                  minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, fontSize: 11, fontWeight: 800,
                  display: "inline-grid", placeItems: "center",
                  background: active ? "rgba(255,255,255,0.22)" : "#b64c4c", color: "#fff",
                }}>{t.badge}</span>
              ) : null}
              {t.dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: "#b64c4c", display: "inline-block" }} /> : null}
            </button>
          );
        })}
      </div>
      {right}
    </div>
  );
}
