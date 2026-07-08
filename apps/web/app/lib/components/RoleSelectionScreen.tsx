"use client";

import { useState } from "react";

type Role = "owner" | "staff";

type Props = {
  language: "ko" | "en";
  onSelect: (role: Role, inviteCode?: string) => void;
};

export default function RoleSelectionScreen({ language, onSelect }: Props) {
  const ko = language === "ko";
  const [selected, setSelected] = useState<Role | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);

  const roles: Array<{
    id: Role;
    icon: React.ReactNode;
    title: string;
    description: string;
    detail: string;
  }> = [
    {
      id: "owner",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <path d="M4 14h24" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M12 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: ko ? "경영자 / 사장님" : "Owner / Manager",
      description: ko
        ? "가게를 운영하거나 창업을 준비하고 있어요"
        : "I run a business or I'm preparing to start one",
      detail: ko
        ? "매출, 비용, 재고, 직원 관리와 AI 경영 분석 등 모든 기능을 사용할 수 있습니다."
        : "Full access to sales, costs, inventory, staff, and AI business analysis.",
    },
    {
      id: "staff",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      ),
      title: ko ? "직원" : "Staff",
      description: ko
        ? "사장님이 초대한 가게에서 일하고 있어요"
        : "I work at a store that invited me",
      detail: ko
        ? "매출 입력, 재고 확인 등 운영에 필요한 기능만 사용할 수 있습니다."
        : "Access to daily sales entry, inventory checks, and operational features.",
    },
  ];

  return (
    <main style={container}>
      <div style={card}>
        {/* header */}
        <div style={header}>
          <div style={eyebrow}>Found.One</div>
          <h1 style={title}>
            {ko ? "어떤 역할로 시작할까요?" : "How will you use Found.One?"}
          </h1>
          <p style={subtitle}>
            {ko
              ? "역할에 따라 보이는 화면이 달라집니다. 나중에 변경할 수 있어요."
              : "Your role determines what you see. You can change it later."}
          </p>
        </div>

        {/* role cards */}
        <div style={roleGrid}>
          {roles.map((role) => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelected(role.id);
                  if (role.id === "staff") {
                    setShowInviteInput(true);
                  } else {
                    setShowInviteInput(false);
                  }
                }}
                style={{
                  ...roleCard,
                  borderColor: isSelected ? "#0f172a" : "rgba(15,23,42,0.08)",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.01) 100%)"
                    : "#fff",
                }}
              >
                <div style={{ ...iconWrap, color: isSelected ? "#0f172a" : "rgba(15,23,42,0.35)" }}>
                  {role.icon}
                </div>
                <div style={roleTitle}>{role.title}</div>
                <div style={roleDesc}>{role.description}</div>
                <div style={roleDetail}>{role.detail}</div>

                {/* selection indicator */}
                <div style={{
                  ...indicator,
                  borderColor: isSelected ? "#0f172a" : "rgba(15,23,42,0.15)",
                  background: isSelected ? "#0f172a" : "transparent",
                }}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* invite code input for staff */}
        {showInviteInput && selected === "staff" && (
          <div style={inviteSection}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
              {ko ? "초대 코드 (선택)" : "Invite code (optional)"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px", lineHeight: 1.5 }}>
              {ko
                ? "사장님에게 받은 초대 코드가 있으면 입력하세요. 없어도 시작할 수 있고, 나중에 초대 링크로 가게에 연결할 수 있어요."
                : "Enter an invite code if you have one. You can also start without it and connect to a store later via an invite link."}
            </div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={ko ? "초대 코드 (예: ABCD1234)" : "Invite code (e.g. ABCD1234)"}
              style={inviteInput}
              maxLength={12}
            />
          </div>
        )}

        {/* continue button */}
        <button
          type="button"
          onClick={() => {
            if (!selected) return;
            onSelect(selected, selected === "staff" ? inviteCode : undefined);
          }}
          disabled={!selected}
          style={{
            ...continueBtn,
            opacity: !selected ? 0.35 : 1,
            cursor: !selected ? "default" : "pointer",
          }}
        >
          {ko ? "시작하기" : "Continue"}
        </button>

        <div style={footnote}>
          {ko
            ? "역할은 설정에서 언제든 변경할 수 있습니다"
            : "You can change your role anytime in settings"}
        </div>
      </div>
    </main>
  );
}

/* ─── Styles ─── */

const container: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#f5f5f7",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  padding: "40px 36px",
  borderRadius: "28px",
  background: "#fff",
  boxShadow: "0 8px 40px rgba(15,23,42,0.06)",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "12px",
};

const title: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 750,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  margin: "0 0 8px",
};

const subtitle: React.CSSProperties = {
  fontSize: "15px",
  color: "var(--muted)",
  lineHeight: 1.5,
  margin: 0,
};

const roleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "20px",
};

const roleCard: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "24px 16px 20px",
  borderRadius: "20px",
  border: "2px solid",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const iconWrap: React.CSSProperties = {
  marginBottom: "12px",
  transition: "color 0.2s ease",
};

const roleTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: "6px",
};

const roleDesc: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.5,
  marginBottom: "8px",
};

const roleDetail: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
  lineHeight: 1.5,
};

const indicator: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  border: "2px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const inviteSection: React.CSSProperties = {
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(15,23,42,0.02)",
  border: "1px solid rgba(15,23,42,0.06)",
  marginBottom: "20px",
};

const inviteInput: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1.5px solid rgba(15,23,42,0.1)",
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textAlign: "center",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const continueBtn: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 650,
  transition: "opacity 0.15s ease",
};

const footnote: React.CSSProperties = {
  textAlign: "center",
  fontSize: "12px",
  color: "var(--muted)",
  marginTop: "16px",
};
