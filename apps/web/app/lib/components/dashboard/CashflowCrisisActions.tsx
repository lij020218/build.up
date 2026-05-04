"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Megaphone, Ticket, MessageCircle, Landmark, Users, CreditCard, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CrisisDetection } from "../../services/cashflow-projection";

type Props = {
  ko: boolean;
  crisis: CrisisDetection;
  currentBalance: number;
};

type CrisisAction = {
  id: string;
  Icon: LucideIcon;
  iconColor: string;
  label: { ko: string; en: string };
  description: { ko: string; en: string };
  impact: { ko: string; en: string };
  timeframe: { ko: string; en: string };
  href?: string;             // 외부 딥링크
  handler?: () => void;      // 내부 액션
  severity: "quick" | "moderate" | "last-resort";
};

/**
 * 위기 감지 시 원버튼 액션 패널.
 * 한국 자영업자의 흑자부도 상황에서 72시간 내 실행 가능한 구체적 옵션들.
 *
 * 주의: 외부 딥링크는 실제 앱/사이트로 열림. 내부 상태 변경 없음.
 * Phase 2에서 우리 앱에서 직접 실행 가능하게 확장 예정.
 */
export function CashflowCrisisActions({ ko, crisis, currentBalance }: Props) {
  const [expanded, setExpanded] = useState(false);

  const crisisDay = crisis.crisisDay;
  const daysUntil = crisis.daysUntilCrisis ?? 0;
  const shortfall = crisis.shortfallAmount;

  // 결손 금액을 커버할 수 있는 액션들 (우선순위 순)
  const actions: CrisisAction[] = [
    {
      id: "reduce-delivery-ad",
      Icon: Megaphone,
      iconColor: "#b45309",
      label: {
        ko: "배달앱 광고비 감액",
        en: "Reduce delivery app ad spend",
      },
      description: {
        ko: "이번 주만 광고비를 5만원 줄이세요. 매출 영향 미미, 현금 즉시 확보.",
        en: "Cut this week's ad spend by ₩50k. Minimal sales impact, immediate cash savings.",
      },
      impact: {
        ko: "즉시 ₩50,000 절감",
        en: "Save ₩50,000 immediately",
      },
      timeframe: { ko: "지금 바로", en: "Now" },
      href: "https://ceo.baemin.com",
      severity: "quick",
    },
    {
      id: "issue-coupon",
      Icon: Ticket,
      iconColor: "#191970",
      label: {
        ko: "긴급 할인 쿠폰 발급",
        en: "Issue emergency discount coupon",
      },
      description: {
        ko: "주말 20% 할인 쿠폰으로 매출 부스트. 현금 회수 3~5일 빠르게.",
        en: "20% weekend coupon to boost sales. Accelerate cash cycle by 3-5 days.",
      },
      impact: {
        ko: "예상 매출 +20~50만원",
        en: "Estimated sales +₩200-500k",
      },
      timeframe: { ko: "48시간 내 시작", en: "Within 48h" },
      handler: () => {
        // FirstCustomersCard의 쿠폰 탭으로 스크롤 (간접 UX)
        const element = document.querySelector("[data-first-customers-card]");
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      severity: "quick",
    },
    {
      id: "supplier-delay",
      Icon: MessageCircle,
      iconColor: "#059669",
      label: {
        ko: "공급처 결제 연기 요청",
        en: "Request supplier payment delay",
      },
      description: {
        ko: "자주 거래하는 공급처에 결제일 5일 연기 요청. 카톡으로 정중히.",
        en: "Ask trusted supplier to delay payment by 5 days via polite KakaoTalk.",
      },
      impact: {
        ko: "≈₩100,000~500,000 유예",
        en: "≈₩100k-500k deferred",
      },
      timeframe: { ko: "24시간 내", en: "Within 24h" },
      handler: () => {
        // 카톡 메시지 초안을 클립보드에 복사
        const message = ko
          ? `안녕하세요, [상호명]입니다.\n\n이번 달 결제 일정을 약 5일 조정해주실 수 있을까요?\n다음 주 [날짜]에 결제 가능합니다.\n\n항상 감사드립니다.`
          : `Hello, this is [Business Name].\n\nCould we delay this month's payment by ~5 days?\nWe can pay next week on [date].\n\nThank you for your understanding.`;
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(message).then(() => {
            alert(ko ? "메시지 초안을 복사했어요. 카톡에서 붙여넣으세요." : "Message draft copied. Paste in KakaoTalk.");
          });
        }
      },
      severity: "quick",
    },
    {
      id: "emergency-loan",
      Icon: Landmark,
      iconColor: "#6366f1",
      label: {
        ko: "소상공인 긴급대출 조회",
        en: "Check emergency small business loan",
      },
      description: {
        ko: "소상공인진흥공단 긴급경영안정자금. 최대 7천만원, 저금리. 심사 3~7일.",
        en: "Korea Small Business Development Center emergency fund. Up to ₩70M, low rate.",
      },
      impact: {
        ko: "최대 ₩70,000,000",
        en: "Up to ₩70,000,000",
      },
      timeframe: { ko: "7일 내 승인", en: "Approval in 7d" },
      href: "https://www.semas.or.kr/web/SUP/FIN/sup03_04_01.kmdc",
      severity: "moderate",
    },
    {
      id: "staff-hours",
      Icon: Users,
      iconColor: "#0891b2",
      label: {
        ko: "직원 근무시간 조정 논의",
        en: "Discuss staff hours adjustment",
      },
      description: {
        ko: "직원과 이번 주만 근무시간 10~20% 조정 협의. 일방 통보 금지, 반드시 사전 동의.",
        en: "Discuss 10-20% hour reduction with staff this week. Mutual agreement required.",
      },
      impact: {
        ko: "≈₩80,000~200,000 절감",
        en: "≈₩80k-200k savings",
      },
      timeframe: { ko: "대화 먼저", en: "Conversation first" },
      handler: () => {
        const message = ko
          ? `[직원분께] 안녕하세요.\n\n이번 주만 가게 사정으로 근무시간을 조금 조정하고 싶어서요. 통화나 만나서 상의드릴 수 있을까요?\n\n늘 고생이 많으십니다.`
          : `[Staff] Hello.\n\nDue to cash flow this week, I'd like to discuss slightly reducing hours. Could we talk by phone or in person?\n\nThank you for your hard work.`;
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(message).then(() => {
            alert(ko ? "대화 초안을 복사했어요." : "Conversation draft copied.");
          });
        }
      },
      severity: "moderate",
    },
    {
      id: "credit-line",
      Icon: CreditCard,
      iconColor: "#b91c1c",
      label: {
        ko: "카드 한도 · 마이너스 통장 조회",
        en: "Check credit limit / overdraft",
      },
      description: {
        ko: "단기 유동성 확보. 금리 부담 크므로 최후의 수단. 반드시 상환 계획 먼저.",
        en: "Short-term liquidity. High interest — last resort only. Repayment plan required.",
      },
      impact: {
        ko: "즉시 가용 한도 확인",
        en: "Instant credit availability",
      },
      timeframe: { ko: "즉시 가능", en: "Immediate" },
      severity: "last-resort",
    },
    {
      id: "postpone-orders",
      Icon: Package,
      iconColor: "#b45309",
      label: {
        ko: "재고 발주 연기",
        en: "Postpone inventory orders",
      },
      description: {
        ko: "이번 주 예정된 재고 주문 중 덜 급한 것부터 다음 주로 미루기.",
        en: "Delay non-urgent inventory orders to next week.",
      },
      impact: {
        ko: "발주 규모에 따라 다름",
        en: "Varies by order size",
      },
      timeframe: { ko: "지금 바로", en: "Now" },
      severity: "quick",
    },
  ];

  const quickActions = actions.filter((a) => a.severity === "quick");
  const otherActions = actions.filter((a) => a.severity !== "quick");
  const visibleActions = expanded ? actions : quickActions;

  const handleAction = (action: CrisisAction) => {
    if (action.handler) action.handler();
    if (action.href && typeof window !== "undefined") {
      window.open(action.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "14px",
        background: "rgba(220,38,38,0.04)",
        border: "1px solid rgba(220,38,38,0.12)",
      }}
    >
      {/* 크라이시스 요약 */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#b91c1c", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
          {ko ? "빠른 대응이 필요해요" : "Quick response needed"}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", lineHeight: 1.5 }}>
          {ko ? (
            <>
              {daysUntil}일 후 ({crisisDay?.slice(5)}) 통장이{" "}
              <span style={{ color: "#b91c1c", fontWeight: 720 }}>
                {formatWon(-shortfall)}
              </span>
              로 떨어질 수 있어요.
            </>
          ) : (
            <>
              In {daysUntil} days ({crisisDay?.slice(5)}) balance may drop to{" "}
              <span style={{ color: "#b91c1c", fontWeight: 720 }}>
                {formatWon(-shortfall)}
              </span>
              .
            </>
          )}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "2px" }}>
          {ko
            ? `아래 조합으로 ${formatWon(shortfall)}+ 확보 가능합니다. 필요한 만큼 탭하세요.`
            : `Below options can cover ${formatWon(shortfall)}+. Tap as needed.`}
        </div>
      </div>

      {/* 액션 리스트 */}
      <div style={{ display: "grid", gap: "6px" }}>
        {visibleActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action)}
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#fff",
              border: `1px solid ${action.severity === "last-resort" ? "rgba(220,38,38,0.15)" : "rgba(25,25,112,0.05)"}`,
              cursor: "pointer",
              textAlign: "left" as const,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(25,25,112,0.03)";
              e.currentTarget.style.borderColor = "rgba(25,25,112,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = action.severity === "last-resort" ? "rgba(220,38,38,0.15)" : "rgba(25,25,112,0.05)";
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${action.iconColor}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <action.Icon size={18} strokeWidth={1.5} color={action.iconColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a" }}>
                  {action.label[ko ? "ko" : "en"]}
                </span>
                {action.href && <ExternalLink size={11} strokeWidth={1.8} color="rgba(15,23,42,0.4)" />}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.6)", lineHeight: 1.45, marginBottom: "4px" }}>
                {action.description[ko ? "ko" : "en"]}
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "10px", fontWeight: 650 }}>
                <span style={{ color: action.severity === "last-resort" ? "#b91c1c" : "#059669" }}>
                  {action.impact[ko ? "ko" : "en"]}
                </span>
                <span style={{ color: "rgba(15,23,42,0.4)" }}>·</span>
                <span style={{ color: "rgba(15,23,42,0.5)" }}>
                  {action.timeframe[ko ? "ko" : "en"]}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 더보기 토글 */}
      {otherActions.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: "8px",
            padding: "8px",
            width: "100%",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 650,
            color: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          {expanded
            ? (ko ? "간단히 보기" : "Show less")
            : (ko ? `더 많은 방법 (+${otherActions.length})` : `More options (+${otherActions.length})`)}
          {expanded ? <ChevronUp size={12} strokeWidth={1.5} /> : <ChevronDown size={12} strokeWidth={1.5} />}
        </button>
      )}
    </div>
  );
}

function formatWon(n: number): string {
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? "−" : "";
  if (abs >= 10000) return `${sign}${Math.round(n / 10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}
