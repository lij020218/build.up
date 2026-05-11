"use client";

/**
 * FeatureNudgeCard — 사장님이 아직 안 써본 핵심 기능을 부드럽게 안내.
 *
 * 입력: useFeatureNudges 훅의 priority 정렬된 nudge 배열.
 * 표시: 상위 3개. 비어 있으면 컴포넌트 자체 렌더 X.
 * 클릭: bup:navigate-feature 이벤트 → surface 전환 + scrollTargetId/selector 카드로 이동 + halo.
 *
 * 톤 가이드: 강요 X — "이런 기능도 있어요 / AI 가 더 정확해집니다".
 */

import { ArrowRight, Sparkles } from "lucide-react";
import { useFeatureNudges, type FeatureNudge } from "../../hooks/useFeatureNudges";
import { useMorningBriefingBrain } from "../../hooks/useMorningBriefingBrain";
import type { DashboardHook } from "../../useDashboard";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

type Props = { ko: boolean; nudges: FeatureNudge[] };

function dispatchNavigate(nudge: FeatureNudge) {
  if (typeof window === "undefined") return;
  // surface 전환 + (있으면) 카드로 이동 + halo. 매출 입력류는 input focus.
  const detail: {
    surface: FeatureNudge["navigate"]["surface"];
    scrollTargetId?: string;
    selector?: string;
    focusInput?: boolean;
  } = { surface: nudge.navigate.surface };
  if (nudge.navigate.scrollTargetId) detail.scrollTargetId = nudge.navigate.scrollTargetId;
  if (nudge.navigate.selector) detail.selector = nudge.navigate.selector;
  // 매출 입력 셀렉터는 즉시 타이핑 가능하도록 input focus
  if (nudge.navigate.selector === "[data-sales-input]") detail.focusInput = true;
  window.dispatchEvent(new CustomEvent("bup:navigate-feature", { detail }));

  // 현금흐름 셋업 nudge → setup sheet 자동 오픈
  //   surface 전환 + 스크롤 애니메이션이 끝난 뒤 (~700ms) 시트 열기 → 사용자가 흐름을 따라가기 쉬움
  //
  //   ⚠️ 2026-05-11 사장님 신고: "고정비 등록 → 현금흐름 팝업 켜짐 = 잘못된 동작."
  //      종전엔 fixed-expenses-empty 도 여기서 popup 열었음. 이제 nudge 의 navigate 만
  //      따라가도록 변경 (비용 관리 카드 selector 로 이동). cashflow-setup 키만 popup 유지.
  if (nudge.key === "cashflow-setup") {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("bup:open-cashflow-setup", { detail: {} }));
    }, 700);
  }
}

/**
 * Hook 사용 컴포넌트 — OperationalDashboard 에서 직접 마운트.
 * 내부에서 brain.phase + nudges 계산 후 FeatureNudgeCard 위임.
 */
export function FeatureNudgeSection({ d }: { d: DashboardHook }) {
  const ko = d.language === "ko";
  const brain = useMorningBriefingBrain(d);
  const nudges = useFeatureNudges(d, brain.phase);
  if (nudges.length === 0) return null;
  return <FeatureNudgeCard ko={ko} nudges={nudges} />;
}

export function FeatureNudgeCard({ ko, nudges }: Props) {
  const top = nudges.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section
      style={{
        background: "white",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        borderRadius: 18,
        padding: "18px 20px 16px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        marginBottom: 18,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: MIDNIGHT_SOFT,
            color: MIDNIGHT,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={14} strokeWidth={1.6} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: MIDNIGHT,
              opacity: 0.7,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {ko ? "아직 안 써보신 기능" : "Features you haven't tried"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {ko ? "한 단계씩 켜보면 AI 코칭이 정확해져요" : "Each one sharpens your AI partner"}
          </div>
        </div>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {top.map((n) => (
          <li key={n.key}>
            <button
              type="button"
              onClick={() => dispatchNavigate(n)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(15,23,42,0.06)",
                background: "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(25,25,112,0.025)";
                e.currentTarget.style.borderColor = "rgba(25,25,112,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "rgba(15,23,42,0.06)";
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", marginBottom: 3 }}>
                  {ko ? n.titleKo : n.titleEn}
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                  {ko ? n.subKo : n.subEn}
                </div>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: MIDNIGHT,
                  color: "white",
                  fontSize: 11.5,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {ko ? n.ctaKo : n.ctaEn}
                <ArrowRight size={11} strokeWidth={2.2} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
