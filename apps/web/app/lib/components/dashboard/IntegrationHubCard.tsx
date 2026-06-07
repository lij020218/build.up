"use client";

/**
 * IntegrationHubCard — 자동 데이터 수집 허브 (데이터 입력 마찰 0 목표).
 *
 *  ── 왜 만들었나 (2026-05-12) ──────────────────────────────────────────
 *  OfflineFounderBrief 의 가장 큰 약점 = 사장님이 수기 입력 안 하면 신호 X.
 *  → 캐시노트는 카드사 자동연동 — 압도적 우위.
 *  → 우리도 *사장님 본인 OAuth* 로 매출·예약·고객 자동 수집해야 함.
 *
 *  v1 (현재): SSOT(`integrations-catalog.ts`) 기반 채널 목록 표시 + placeholder
 *           "연결" 버튼. 사장님이 *어떤 채널이 가능한지* 인지하고, 알림 신청.
 *  v2: 실제 OAuth (네이버 커머스/예약·GA4·Stripe — 무료 채널 먼저)
 *  v3: 카드사·POS·식자재 (스크래핑/CSV 업로드)
 *  v4: paid-gated (오픈뱅킹·CODEF) — 사용자 100명+ 검증 후
 *
 *  ── UX 원칙 ──────────────────────────────────────────────────────
 *  · 사장님이 "이거 1번 연동하면 1년치 수기 입력 안 함" 인식
 *  · 업종별로 다른 채널 표시 (소매=네이버커머스, 뷰티=네이버예약)
 *  · status: available / coming-soon / paid-gated 시각 구분
 *  · v1 은 모두 placeholder — 사장님이 "알림 신청" 으로 의향 표시
 *  ────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { Plug, CheckCircle2, Clock, Lock, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { getChannelsForIndustry, type IntegrationChannel } from "../../integrations-catalog";

const MIDNIGHT = "#191970";

type Props = { ko: boolean };

export function IntegrationHubCard({ ko }: Props) {
  const d = useDashboardCtx();
  const industryCategoryId = d.industryCategoryId ?? "";
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const channels = useMemo(() => {
    const all = getChannelsForIndustry(industryCategoryId);
    // 상단: available (즉시 1-click) 최대 3개
    const available = all.filter((c) => c.status === "available").slice(0, 3);
    // 중단: coming-soon 우선순위 높은 것 최대 4개
    const comingSoon = all.filter((c) => c.status === "coming-soon").slice(0, 4);
    // 하단: paid-gated 안내 1-2개
    const paidGated = all.filter((c) => c.status === "paid-gated").slice(0, 2);
    return { available, comingSoon, paidGated, total: all.length };
  }, [industryCategoryId]);

  // GA4 OAuth 시작 — 기존 saas_metrics_connections 인프라 활용 (이미 production-ready).
  // 다른 채널 (네이버 커머스·Stripe·Slack) 은 v2 PR 에서 동일 패턴으로 추가 예정.
  const handleConnect = async (channelId: string) => {
    setConnectingId(channelId);
    setConnectError(null);
    try {
      if (channelId === "ga4") {
        const res = await fetch("/api/integrations/saas-metrics/ga4/start", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error ?? "GA4 OAuth 시작 실패");
        }
        // Google consent 페이지로 이동
        window.location.href = data.url as string;
        return; // 사장님 redirect 됨
      }
      // 다른 채널은 아직 미구현 — v2 PR
      setConnectError("다른 채널은 v2 PR 에서 구현 예정. 알림 신청은 가능합니다.");
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : "연결 실패");
    } finally {
      setConnectingId(null);
    }
  };

  const handleNotify = (id: string) => {
    setNotifiedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // v2: 백엔드에 "이 사장님이 이 채널 출시 시 알림 받고 싶음" 신호 기록 →
    //     출시 우선순위 결정 입력값. 지금은 로컬 상태만 (UX 데모용).
  };

  return (
    <article style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      padding: "22px 24px",
      display: "flex", flexDirection: "column" as const, gap: 16,
    }}>
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
            color: "white",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
          }}>
            <Plug size={14} strokeWidth={2.2} />
          </span>
          <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {ko ? "자동 데이터 연동 허브" : "Data Auto-Sync Hub"}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
          {ko ? "수기 입력 그만 — 자동 연결로 매일 1분 절약" : "Stop manual entry — auto-sync saves 1 min/day"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", marginTop: 4 }}>
          {ko
            ? `현재 업종 (${d.industryCategoryId || "미설정"}) 에 가능한 ${channels.total}개 채널`
            : `${channels.total} channels for your industry`}
        </div>
      </header>

      {/* 즉시 연동 가능 — green badge */}
      {channels.available.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1d3557", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "지금 바로 연결 가능" : "Available now"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {channels.available.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                ko={ko}
                status="available"
                onConnect={c.id === "ga4" ? () => handleConnect(c.id) : undefined}
                connecting={connectingId === c.id}
              />
            ))}
          </div>
          {connectError && (
            <div style={{
              marginTop: 8, padding: "8px 12px", borderRadius: 8,
              background: "rgba(182,76,76,0.06)", border: "1px solid rgba(182,76,76,0.20)",
              color: "#b64c4c", fontSize: 12, lineHeight: 1.5,
            }}>
              {connectError}
            </div>
          )}
        </section>
      )}

      {/* 곧 출시 — amber badge with "알림 신청" */}
      {channels.comingSoon.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "다음 분기 출시 예정" : "Coming next quarter"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {channels.comingSoon.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                ko={ko}
                status="coming-soon"
                notified={notifiedIds.has(c.id)}
                onNotify={() => handleNotify(c.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 유료 게이트 — locked badge */}
      {channels.paidGated.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "프리미엄 (사용자 100명+ 이후 활성화)" : "Premium (after 100+ users)"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {channels.paidGated.map((c) => (
              <ChannelRow key={c.id} channel={c} ko={ko} status="paid-gated" />
            ))}
          </div>
        </section>
      )}

      {/* footer — 데이터 정책 안내 */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 8,
        padding: "10px 12px", borderRadius: 10,
        background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
        fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
      }}>
        <Sparkles size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.6, marginTop: 2 }} />
        <span style={{ flex: 1 }}>
          {ko
            ? "모든 채널은 사장님 본인 OAuth 동의 후 연결. 비밀번호 저장 X · 데이터 read-only · 언제든 해제 가능. 무료 채널 우선 활성화 (KFTC 오픈뱅킹·CODEF 홈택스는 사용자 100명+ 검증 후 유료 모드)."
            : "All via your own OAuth. No password storage · read-only · revocable anytime. Free channels first; paid (KFTC·CODEF) gated to 100+ users."}
        </span>
      </div>
    </article>
  );
}

// ─── Channel Row ──────────────────────────────────────────────────

function ChannelRow({
  channel,
  ko,
  status,
  notified,
  onNotify,
  onConnect,
  connecting,
}: {
  channel: IntegrationChannel;
  ko: boolean;
  status: "available" | "coming-soon" | "paid-gated";
  notified?: boolean;
  onNotify?: () => void;
  onConnect?: () => void;
  connecting?: boolean;
}) {
  const palette = {
    available: { bg: "rgba(25,25,112,0.05)", border: "rgba(25,25,112,0.18)", text: "#1d3557", iconBg: "rgba(25,25,112,0.10)" },
    "coming-soon": { bg: "rgba(25,25,112,0.04)", border: "rgba(25,25,112,0.15)", text: "#191970", iconBg: "rgba(25,25,112,0.10)" },
    "paid-gated": { bg: "rgba(15,23,42,0.03)", border: "rgba(15,23,42,0.08)", text: "rgba(15,23,42,0.55)", iconBg: "rgba(15,23,42,0.05)" },
  } as const;
  const c = palette[status];
  const Icon = status === "available" ? CheckCircle2 : status === "coming-soon" ? Clock : Lock;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 13px", borderRadius: 11,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: 8,
        background: c.iconBg, color: c.text,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}>
          {ko ? channel.labelKo : channel.labelEn}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.5, marginTop: 2 }}>
          {channel.dataKo}
        </div>
        {channel.costNote && status !== "available" && (
          <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4, fontStyle: "italic" as const }}>
            {channel.costNote}
          </div>
        )}
      </div>

      {status === "available" && (
        <button
          type="button"
          onClick={onConnect}
          disabled={!onConnect || connecting}
          aria-label={ko ? (onConnect ? "연결" : "v2 출시 예정") : (onConnect ? "Connect" : "Coming v2")}
          title={!onConnect && status === "available"
            ? (ko ? "다음 PR 에서 활성화 — GA4 만 우선 출시" : "Activates in next PR — GA4 first")
            : undefined}
          style={{
            flexShrink: 0,
            padding: "7px 12px",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: onConnect && !connecting ? c.iconBg : "white",
            color: c.text,
            fontSize: 12, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
            cursor: onConnect && !connecting ? "pointer" : "not-allowed",
            opacity: onConnect ? 1 : 0.6,
            transition: "all 0.15s",
          }}
        >
          {connecting ? (
            <>
              <Loader2 size={12} strokeWidth={2.2} style={{ animation: "spin 1s linear infinite" }} />
              {ko ? "연결 중..." : "Connecting..."}
            </>
          ) : (
            <>
              {ko ? "연결" : "Connect"} <ArrowRight size={12} strokeWidth={2.2} />
            </>
          )}
        </button>
      )}

      {status === "coming-soon" && (
        <button
          type="button"
          onClick={onNotify}
          disabled={notified}
          aria-label={ko ? (notified ? "알림 신청 완료" : "출시 시 알림 받기") : (notified ? "Notified" : "Notify me")}
          style={{
            flexShrink: 0,
            padding: "7px 12px",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: notified ? c.iconBg : "white",
            color: c.text,
            fontSize: 12, fontWeight: 700,
            cursor: notified ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {ko ? (notified ? "신청 완료 ✓" : "알림 신청") : (notified ? "Notified ✓" : "Notify me")}
        </button>
      )}
    </div>
  );
}
