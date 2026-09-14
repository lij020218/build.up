"use client";

/**
 * ListSection — 애플식 그룹 리스트 (2026-09-12). iOS BUListSection 의 웹 미러.
 *
 * 왜: 화면마다 카드·행을 손으로 다시 만들다 보니 제목이 두세 번 나오고
 * (카드 안 대문자 eyebrow + 제목 + 행 라벨), 본문이 13px 라 촘촘했다.
 *
 * 규칙 (설정앱과 같다):
 *  · 제목은 카드 **밖**에 한 번. 카드 안에는 내용만.
 *  · 행은 라벨(왼쪽) + 값(오른쪽), 최소 높이 44px, 사이는 들여쓴 헤어라인.
 *  · 각주는 카드 밖 — 안에 넣으면 행처럼 읽힌다.
 *
 * ⚠️ 데스크톱 밀도는 유지한다 — iOS 의 17px 본문을 그대로 옮기지 않고 15px 를 쓴다
 *    (계획서 4단계: "웹은 같은 토큰으로 따라가되 데스크톱은 밀도를 유지").
 */

import type React from "react";

/** 행 좌우 여백 — 구분선 들여쓰기와 같아야 선이 라벨에 맞는다. */
const ROW_PAD_X = 16;

export const listSectionStyles = {
  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "-0.01em",
    padding: "0 4px",
  } as React.CSSProperties,
  action: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--primary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 4px",
  } as React.CSSProperties,
  card: {
    background: "var(--surface)",
    borderRadius: "var(--card-radius)",
    border: "0.5px solid rgba(17,19,26,0.07)",
    boxShadow: "0 3px 10px rgba(17,19,26,0.05)",
    overflow: "hidden",
  } as React.CSSProperties,
  footer: {
    fontSize: "13px",
    color: "var(--muted)",
    padding: "0 4px",
    lineHeight: 1.5,
  } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    minHeight: "44px",
    padding: `11px ${ROW_PAD_X}px`,
  } as React.CSSProperties,
  separator: {
    height: "1px",
    background: "rgba(17,19,26,0.08)",
    marginLeft: `${ROW_PAD_X}px`,
  } as React.CSSProperties,
  /** 라벨 — 애플은 라벨을 진하게, 값을 흐리게 둔다(종전 웹은 반대였다). */
  key: { fontSize: "15px", color: "var(--text)" } as React.CSSProperties,
  value: {
    fontSize: "15px",
    color: "var(--muted)",
    textAlign: "right" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  subtitle: { fontSize: "13px", color: "var(--muted)", marginTop: "2px" } as React.CSSProperties,
};

export function ListSection({
  title,
  actionLabel,
  onAction,
  footer,
  children,
  style,
}: {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section style={{ display: "grid", gap: "8px", ...style }}>
      {title ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={listSectionStyles.title}>{title}</h2>
          {actionLabel ? (
            <button type="button" style={listSectionStyles.action} onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      <div style={listSectionStyles.card}>{children}</div>
      {footer ? <div style={listSectionStyles.footer}>{footer}</div> : null}
    </section>
  );
}

/** 행 하나. 구분선은 `first` 가 아닌 행이 스스로 위에 그린다. */
export function ListRow({
  label,
  subtitle,
  value,
  trailing,
  first,
  onClick,
  destructive,
  monospace,
}: {
  label: string;
  subtitle?: string;
  value?: string;
  trailing?: React.ReactNode;
  first?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  monospace?: boolean;
}) {
  const body = (
    <div style={listSectionStyles.row}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...listSectionStyles.key, color: destructive ? "var(--danger)" : "var(--text)" }}>
          {label}
        </div>
        {subtitle ? <div style={listSectionStyles.subtitle}>{subtitle}</div> : null}
      </div>
      {trailing ?? (
        value !== undefined ? (
          <span
            style={{
              ...listSectionStyles.value,
              fontFamily: monospace ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
            }}
          >
            {value}
          </span>
        ) : null
      )}
    </div>
  );

  return (
    <>
      {first ? null : <div style={listSectionStyles.separator} />}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </>
  );
}
