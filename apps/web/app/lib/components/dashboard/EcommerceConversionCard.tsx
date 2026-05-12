"use client";

/**
 * EcommerceConversionCard — 이커머스 CVR·ROAS·반품률 (Phase 2f).
 *
 *  ── 왜 (2026-05-13) ──────────────────────────────────────────────────
 *  Agent B 11 자료 (Polar·Shopify·Daymark·OSC 쿠팡·Sellerking·BigCommerce)
 *  — 이커머스 daily KPI: 전환률·ROAS·반품률. 한국 SaaS 거의 부재 → 차별점.
 *
 *  공식:
 *    CVR = conversions / clicks × 100 (Shopify 평균 1.4%, 가이드 2.5-3%)
 *    ROAS = conversionValue / spend × 100 (목표 300-500% / 쿠팡)
 *    반품률 = returns / orders × 100 (Polar 평균 20-30%)
 *
 *  ── 출처 ──────────────────────────────────────────────────────────
 *  · Polar Analytics 2026 Ecommerce Benchmarks (AOV $101, 반품 20-30%)
 *  · OSC 쿠팡 ROAS 5단계 가이드 (목표 300%+)
 *  · Shopify Conversion Rate (평균 1.4%, 우수 3%+)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { ShoppingCart, TrendingUp, AlertTriangle, BarChart3, Sparkles } from "lucide-react";
import { useEcommerceStore } from "../../stores";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

const CHANNEL_LABEL: Record<string, string> = {
  naver: "네이버", coupang: "쿠팡", meta: "메타", google: "구글", kakao: "카카오", other: "기타",
};

export function EcommerceConversionCard({ ko, industryCategoryId }: Props) {
  const adSpends = useEcommerceStore((s) => s.adSpends);
  const returns = useEcommerceStore((s) => s.returns);
  const seedDemo = useEcommerceStore((s) => s.seedDemo);

  if (industryCategoryId !== "ecommerce") return null;

  if (adSpends.length === 0 && returns.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><ShoppingCart size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "전환·ROAS·반품 · 이커머스" : "CVR · Ecommerce"}</div>
        </header>
        <div style={{ padding: "16px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginBottom: 12 }}>
            {ko ? "광고비·반품 데이터를 입력하면 CVR/ROAS/반품률 분석이 시작됩니다" : "Enter ad/returns data for CVR/ROAS analysis"}
          </div>
          <button type="button" onClick={() => seedDemo()} style={demoBtnStyle}>
            {ko ? "예시 데이터로 카드 보기" : "Load demo data"}
          </button>
        </div>
      </article>
    );
  }

  const analysis = useMemo(() => {
    const today = new Date();
    const last7Start = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const last7Ads = adSpends.filter((a) => a.date >= last7Start);
    const last7Returns = returns.filter((r) => r.date >= last7Start);

    // 전체 7일
    const totalSpend = last7Ads.reduce((s, a) => s + a.spend, 0);
    const totalClicks = last7Ads.reduce((s, a) => s + (a.clicks ?? 0), 0);
    const totalConversions = last7Ads.reduce((s, a) => s + a.conversions, 0);
    const totalConvValue = last7Ads.reduce((s, a) => s + a.conversionValue, 0);

    const avgCvr = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 1000) / 10 : 0;
    const avgRoas = totalSpend > 0 ? Math.round((totalConvValue / totalSpend) * 100) : 0;

    // 반품률 (반품금액 / 전환매출)
    const returnAmount = last7Returns.reduce((s, r) => s + r.orderAmount, 0);
    const returnRate = totalConvValue > 0
      ? Math.round((returnAmount / totalConvValue) * 100 * 10) / 10
      : 0;
    const returnCount = last7Returns.length;

    // 채널별 ROAS
    const channelStats = new Map<string, { spend: number; convValue: number; conversions: number; clicks: number }>();
    for (const a of last7Ads) {
      const s = channelStats.get(a.channel) ?? { spend: 0, convValue: 0, conversions: 0, clicks: 0 };
      s.spend += a.spend;
      s.convValue += a.conversionValue;
      s.conversions += a.conversions;
      s.clicks += a.clicks ?? 0;
      channelStats.set(a.channel, s);
    }
    const channels = Array.from(channelStats.entries()).map(([ch, s]) => ({
      channel: ch,
      label: CHANNEL_LABEL[ch] ?? ch,
      spend: s.spend,
      convValue: s.convValue,
      roas: s.spend > 0 ? Math.round((s.convValue / s.spend) * 100) : 0,
      cvr: s.clicks > 0 ? Math.round((s.conversions / s.clicks) * 1000) / 10 : 0,
    })).sort((a, b) => b.spend - a.spend);

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    const lowRoasChannels = channels.filter((c) => c.spend > 50000 && c.roas < 200);
    if (lowRoasChannels.length >= 1) {
      const ch = lowRoasChannels[0];
      topAction = {
        kind: "critical",
        headline: ko
          ? `${ch.label} ROAS ${ch.roas}% — 한국 목표 300% 미달`
          : `${ch.label} ROAS ${ch.roas}% — below 300%`,
        action: ko
          ? `이번 주: ① ${ch.label} 캠페인 일시정지 또는 ② 광고 소재·키워드 재구성 (전환 키워드 위주) ③ 리타게팅·픽셀 점검`
          : `This week: pause ${ch.label} OR rebuild creative/keywords`,
      };
    } else if (returnRate > 25) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `반품률 ${returnRate}% — Polar 평균 20-30% 상위 초과`
          : `Return rate ${returnRate}% — exceeds 25%`,
        action: ko
          ? "이번 주: ① 반품 사유 top 3 분석 ② 상세페이지 명확화 (사이즈·소재 사진 추가) ③ 쿠팡 노출점수 영향 점검"
          : "This week: ① top 3 return reasons ② detail page clarification ③ Coupang exposure score",
      };
    } else if (avgCvr < 1.0 && totalClicks > 100) {
      topAction = {
        kind: "warning",
        headline: ko
          ? `평균 CVR ${avgCvr}% — Shopify 평균 1.4% 미달`
          : `Avg CVR ${avgCvr}% — below 1.4%`,
        action: ko
          ? "이번 달: ① 랜딩 페이지 A/B 테스트 ② 리뷰 30개+ 확보 (i-boss: CVR 2-3x 효과) ③ 첫 구매 할인 도입"
          : "This month: ① landing A/B ② 30+ reviews ③ first-buy discount",
      };
    } else if (avgRoas >= 400) {
      topAction = {
        kind: "good",
        headline: ko
          ? `평균 ROAS ${avgRoas}% — 한국 이커머스 상위 quartile`
          : `Avg ROAS ${avgRoas}% — top quartile`,
        action: ko ? "이번 분기: 광고 예산 30% 확장 + 잘 되는 채널 우선 spend" : "This Q: scale ad budget +30%",
      };
    } else if (returnRate > 0 && returnCount > 0) {
      // 평균 반품률 — 사유 분석 권고
      const reasons = new Map<string, number>();
      for (const r of last7Returns) {
        reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1);
      }
      const topReason = Array.from(reasons.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topReason) {
        topAction = {
          kind: "warning",
          headline: ko
            ? `반품 사유 #1: "${topReason[0]}" ${topReason[1]}건`
            : `Top return reason: ${topReason[0]} (${topReason[1]})`,
          action: ko ? "이번 주: 해당 사유 직접 원인 (상품·배송·소재) 분석" : "This week: address top return reason",
        };
      }
    }

    return { totalSpend, totalConvValue, avgCvr, avgRoas, returnRate, returnCount, channels, topAction };
  }, [adSpends, returns, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><ShoppingCart size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>{ko ? "전환·ROAS·반품 · 이커머스" : "CVR · Ecommerce"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `7일 기준` : `7d`}
        </span>
      </header>

      {/* ① 상황 (3 stats) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <StatBox
          label={ko ? "평균 CVR" : "Avg CVR"}
          value={`${analysis.avgCvr}%`}
          tone={analysis.avgCvr >= 2.5 ? "good" : analysis.avgCvr >= 1.4 ? "notable" : "warning"}
          icon={<TrendingUp size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "평균 ROAS" : "Avg ROAS"}
          value={`${analysis.avgRoas}%`}
          tone={analysis.avgRoas >= 400 ? "good" : analysis.avgRoas >= 300 ? "notable" : analysis.avgRoas >= 200 ? "warning" : "critical"}
          icon={<BarChart3 size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "반품률" : "Return rate"}
          value={`${analysis.returnRate}%`}
          tone={analysis.returnRate > 30 ? "critical" : analysis.returnRate > 20 ? "warning" : "good"}
          icon={<AlertTriangle size={12} strokeWidth={2.2} />}
        />
      </div>

      {/* ② 대비 — 채널별 ROAS */}
      {analysis.channels.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "채널별 7일 ROAS (목표 300%+, Sellerking)" : "Channel ROAS (target 300%+)"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {analysis.channels.map((c) => {
              const roasColor = c.roas >= 400 ? "#059669" : c.roas >= 300 ? MIDNIGHT : c.roas >= 200 ? "#b45309" : "#b91c1c";
              return (
                <div key={c.channel} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{c.label}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(c.spend / 10000).toLocaleString()}만
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.7)", fontVariantNumeric: "tabular-nums" }}>
                    CVR {c.cvr}%
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: roasColor, fontVariantNumeric: "tabular-nums", minWidth: 60, textAlign: "right" as const }}>
                    {c.roas}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ③ 행동 */}
      {analysis.topAction && (
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: actionColors[analysis.topAction.kind].bg,
          border: `1px solid ${actionColors[analysis.topAction.kind].border}`,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: actionColors[analysis.topAction.kind].text, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>
            {ko ? "오늘 가장 중요한 행동" : "Today's #1 action"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
            {analysis.topAction.headline}
          </div>
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
            {analysis.topAction.action}
          </div>
        </div>
      )}

      <div style={footerStyle}>
        <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko ? "Polar·Shopify·OSC 쿠팡·Sellerking 표준 — Shopify CVR 1.4% / ROAS 300% / 반품 20-30%" : "Polar/Shopify/OSC/Sellerking standards"}
      </div>
    </article>
  );
}

// ─── shared helpers ──────────────────────────────────────────────────

function StatBox({ label, value, tone, icon }: { label: string; value: string; tone: "critical" | "warning" | "good" | "notable"; icon: React.ReactNode }) {
  const c = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
    warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT },
  }[tone];
  return (
    <div style={{ padding: "10px 12px", borderRadius: 11, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ color: c.text }}>{icon}</span>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

const actionColors = {
  critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
  good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
} as const;

const demoBtnStyle: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8,
  background: `${MIDNIGHT}15`, color: MIDNIGHT,
  border: `1px solid ${MIDNIGHT}30`,
  fontSize: 12, fontWeight: 700, cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex", flexDirection: "column" as const, gap: 14,
};

const headerRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

const iconBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75,
  letterSpacing: "0.08em", textTransform: "uppercase" as const,
};

const footerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center",
  fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
