"use client";

/**
 * Apple ContentUnavailableView 스타일 빈 상태 컴포넌트.
 * 40% 위치 (살짝 위쪽), 아이콘 + 제목 + 설명 + 선택적 CTA.
 * 절대 사용자를 탓하지 않음. "여기에 표시됩니다" 패턴 사용.
 */

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px 40px",
      textAlign: "center",
      minHeight: "240px",
    }}>
      {/* Icon — 48px, muted */}
      <div style={{ marginBottom: "16px", color: "rgba(15,23,42,0.25)" }}>
        {icon}
      </div>

      {/* Title — 18px semibold */}
      <h3 style={{
        margin: "0 0 6px",
        fontSize: "18px",
        fontWeight: 660,
        letterSpacing: "-0.02em",
        color: "#0f172a",
        lineHeight: 1.3,
      }}>
        {title}
      </h3>

      {/* Description — 14px, muted, max width */}
      <p style={{
        margin: "0 0 20px",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "rgba(15,23,42,0.45)",
        maxWidth: "300px",
      }}>
        {description}
      </p>

      {/* CTA — only when there's a clear next action */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            background: "var(--primary, #1d3557)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 620,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(29,53,87,0.15)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
