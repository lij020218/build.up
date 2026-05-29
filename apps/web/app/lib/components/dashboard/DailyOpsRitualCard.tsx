"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck, MessageSquare, Sparkles, Package, Camera,
  ChevronDown, ChevronUp, RotateCcw, type LucideIcon,
} from "lucide-react";
import {
  UNIVERSAL_RITUALS,
  SUB_INDUSTRY_RITUALS,
  CATEGORY_RITUALS,
  evaluateConditionalRituals,
  type DailyRitualItem,
  type RitualIconKey,
  type RitualConditionContext,
} from "@foundone/shared";
import { getKstDate } from "../../utils/business-day";

const MIDNIGHT = "#191970";

const ICON_BY_KEY: Record<RitualIconKey, LucideIcon> = {
  "clipboard-check": ClipboardCheck,
  "message-square": MessageSquare,
  "sparkles": Sparkles,
  "package": Package,
  "camera": Camera,
};

type ResolvedRitual = {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  /** 조건부 항목일 경우 trigger 배지 라벨 (예: "30일차", "매출 위험") */
  triggerLabel?: string;
};

type Props = {
  ko: boolean;
  industryCategoryId: string;
  selectedIndustryId?: string;
  startupType?: "franchise" | "independent" | "undecided";
  /**
   * 시기·신호 조건부 리츄얼을 추가로 노출하기 위한 컨텍스트.
   * 미제공 시 조건부 항목은 표시되지 않음.
   */
  condition?: RitualConditionContext;
};

function resolve(item: DailyRitualItem, ko: boolean, triggerLabel?: string): ResolvedRitual {
  return {
    id: item.id,
    icon: ICON_BY_KEY[item.iconKey],
    label: ko ? item.labelKo : item.labelEn,
    detail: ko ? item.detailKo : item.detailEn,
    triggerLabel,
  };
}

/**
 * Daily Ops Ritual — 매일 아침 운영 리츄얼.
 *
 *  • 데이터: `packages/shared/src/dashboard/daily-ops-rituals.ts`
 *  • 65 sub-industry × 1~3 항목 — 식약처·공중위생관리법·학원안전법·해외 모범 사례 검증
 *  • State: localStorage `daily-ops-{YYYY-MM-DD}-{itemId}`, 자정 자동 리셋
 */
export function DailyOpsRitualCard({ ko, industryCategoryId, selectedIndustryId, startupType, condition }: Props) {
  const today = useMemo(() => getKstDate(new Date()), []);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  const ownershipExtra: ResolvedRitual[] = startupType === "franchise" ? [
    { id: "hq-erp-sync", icon: ClipboardCheck, label: ko ? "본사 ERP 매출 동기화 확인" : "HQ ERP sales sync", detail: ko ? "동기화 실패 시 본사 점검 시야 사라짐" : "Sync fail = HQ blind" },
  ] : startupType === "independent" ? [
    { id: "self-log", icon: ClipboardCheck, label: ko ? "매출·고객 일지 직접 기록" : "Self-log sales/customers", detail: ko ? "프랜차이즈 ERP 없으니 사장님이 직접" : "No HQ ERP — owner logs" },
  ] : [];

  const subRaw: DailyRitualItem[] = (selectedIndustryId ? SUB_INDUSTRY_RITUALS[selectedIndustryId] : undefined)
    ?? CATEGORY_RITUALS[industryCategoryId]
    ?? [];

  const universalItems = UNIVERSAL_RITUALS.map((i) => resolve(i, ko));
  const subItems = subRaw.map((i) => resolve(i, ko));

  // ── 시기·신호 기반 조건부 항목 ──
  const conditionalItems: ResolvedRitual[] = condition
    ? evaluateConditionalRituals(condition).map((c) =>
        resolve(c, ko, ko ? c.triggerLabelKo : c.triggerLabelEn)
      )
    : [];

  const allItems: ResolvedRitual[] = [
    ...universalItems,
    ...subItems,
    ...conditionalItems,
    ...ownershipExtra,
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next: Record<string, boolean> = {};
    allItems.forEach((item) => {
      const key = `daily-ops-${today}-${item.id}`;
      if (window.localStorage.getItem(key) === "1") next[item.id] = true;
    });
    setChecks(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, selectedIndustryId, industryCategoryId, startupType]);

  const toggle = (id: string) => {
    const key = `daily-ops-${today}-${id}`;
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined") {
        if (next[id]) window.localStorage.setItem(key, "1");
        else window.localStorage.removeItem(key);
      }
      return next;
    });
  };

  const resetToday = () => {
    if (typeof window === "undefined") return;
    allItems.forEach((item) => window.localStorage.removeItem(`daily-ops-${today}-${item.id}`));
    setChecks({});
  };

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const total = allItems.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const allDone = checkedCount === total && total > 0;

  return (
    <section
      style={{
        borderRadius: "20px",
        background: "white",
        border: "1px solid rgba(25,25,112,0.08)",
        boxShadow: "0 2px 16px rgba(25,25,112,0.04)",
        overflow: "hidden",
      }}
      className="bento-card"
      data-ops-rituals
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", cursor: "pointer" }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: allDone ? "rgba(34,167,73,0.12)" : "rgba(25,25,112,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: allDone ? "rgb(34,167,73)" : MIDNIGHT,
        }}>
          <ClipboardCheck size={20} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: "15.5px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {ko ? "오늘의 운영 리추얼" : "Today's Ops Ritual"}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: allDone ? "rgb(34,167,73)" : MIDNIGHT, padding: "3px 9px", borderRadius: "999px", letterSpacing: "-0.01em" }}>
              {checkedCount} / {total}
            </span>
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>
            {allDone
              ? (ko ? "✓ 오늘 운영 점검 완료 — 수고하셨어요" : "✓ Today's ops ritual done — well done")
              : (ko ? "재고·청결·어제 리뷰 등 — 자정에 자동 리셋" : "Inventory · cleanliness · yesterday's reviews — resets at midnight")}
          </div>
        </div>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); resetToday(); }}
            style={{
              fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.5)",
              background: "rgba(25,25,112,0.04)", border: "none", borderRadius: "8px",
              padding: "5px 9px", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "4px",
              flexShrink: 0,
            }}
            aria-label={ko ? "오늘 점검 초기화" : "Reset today"}
          >
            <RotateCcw size={11} strokeWidth={1.5} />
            {ko ? "리셋" : "Reset"}
          </button>
        )}
        <div style={{ flexShrink: 0, color: "rgba(0,0,0,0.35)" }}>
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      <div style={{ height: "3px", background: "rgba(0,0,0,0.05)", margin: "0 20px" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: allDone ? "rgb(34,167,73)" : MIDNIGHT,
          borderRadius: "100px",
          transition: "width 0.35s ease, background 0.2s",
        }} />
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 0 14px" }}>
          {allItems.map((item, idx) => {
            const checked = !!checks[item.id];
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", marginLeft: "60px" }} />}
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "12px 20px",
                    width: "100%",
                    textAlign: "left" as const,
                    background: checked ? "rgba(25,25,112,0.03)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    flexShrink: 0, marginTop: "2px",
                    width: 22, height: 22, borderRadius: 7,
                    border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                    background: checked ? MIDNIGHT : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{
                    flexShrink: 0,
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(25,25,112,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: MIDNIGHT,
                  }}>
                    <Icon size={14} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const,
                    }}>
                      <span style={{
                        fontSize: "14px", fontWeight: 600,
                        color: checked ? "rgba(0,0,0,0.32)" : "var(--text)",
                        textDecoration: checked ? "line-through" : "none",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.45,
                        transition: "all 0.15s",
                      }}>
                        {item.label}
                      </span>
                      {item.triggerLabel && !checked && (
                        <span style={{
                          fontSize: "10px", fontWeight: 700,
                          color: MIDNIGHT,
                          background: "rgba(25,25,112,0.08)",
                          padding: "2px 7px",
                          borderRadius: "999px",
                          letterSpacing: "-0.01em",
                          flexShrink: 0,
                        }}>
                          {item.triggerLabel}
                        </span>
                      )}
                    </div>
                    {!checked && (
                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5, marginTop: "2px" }}>
                        {item.detail}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
