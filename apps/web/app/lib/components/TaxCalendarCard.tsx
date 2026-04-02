"use client";

import { useState } from "react";
import {
  buildTaxCalendar,
  getTaxCategoryLabel,
  getTaxCategoryColor,
  getUrgencyColor,
} from "@build-up/shared";
import type { TaxCalendarInput, PersonalizedTaxItem, TaxCalendarSurface } from "@build-up/shared";

type Props = {
  isSimplified: boolean;
  hasEmployees: boolean;
  language: "ko" | "en";
};

export default function TaxCalendarCard({ isSimplified, hasEmployees, language }: Props) {
  const [expanded, setExpanded] = useState(false);
  const ko = language === "ko";

  const calendar: TaxCalendarSurface = buildTaxCalendar({
    isSimplified,
    hasEmployees,
  });

  if (!calendar.next && calendar.upcoming.length === 0) {
    return null;
  }

  return (
    <div style={{
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.78)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.76) 100%)",
      boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
    }}>
      {/* 헤더 */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{
          fontSize: "12px",
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "var(--muted)",
          marginBottom: "12px",
        }}>
          {ko ? "세금 캘린더" : "Tax Calendar"}
        </div>
      </div>

      {/* 가장 가까운 할 일 1개 — 메인 */}
      {calendar.next && (
        <div style={{ padding: "0 22px 16px" }}>
          <NextTaxItem item={calendar.next} ko={ko} />
        </div>
      )}

      {/* 30일 이내 일정 — 접힌 목록 */}
      {calendar.upcoming.length > 0 && (
        <div style={{
          borderTop: "1px solid rgba(17,17,17,0.06)",
        }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: "14px 22px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            <span>
              {ko
                ? `다가오는 일정 ${calendar.upcoming.length}건`
                : `${calendar.upcoming.length} upcoming`}
            </span>
            <span style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              fontSize: "10px",
            }}>
              ▼
            </span>
          </button>

          {expanded && (
            <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
              {calendar.upcoming.map((item) => (
                <UpcomingTaxRow key={item.event.id + item.dueDate.toISOString()} item={item} ko={ko} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NextTaxItem({ item, ko }: { item: PersonalizedTaxItem; ko: boolean }) {
  const urgencyColor = getUrgencyColor(item.urgency);
  const catColor = getTaxCategoryColor(item.event.category);

  return (
    <div style={{
      borderRadius: "16px",
      background: "rgba(0,0,0,0.03)",
      padding: "16px",
      display: "grid",
      gap: "10px",
    }}>
      {/* 카테고리 + D-day */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontSize: "11px",
          fontWeight: 600,
          color: catColor,
          letterSpacing: "0.04em",
          padding: "4px 10px",
          borderRadius: "999px",
          background: `${catColor}14`,
        }}>
          {getTaxCategoryLabel(item.event.category, ko ? "ko" : "en")}
        </span>
        <span style={{
          fontSize: "13px",
          fontWeight: 700,
          color: urgencyColor,
        }}>
          {item.daysUntil === 0
            ? (ko ? "오늘 마감" : "Due today")
            : item.daysUntil < 0
              ? (ko ? `${Math.abs(item.daysUntil)}일 지남` : `${Math.abs(item.daysUntil)}d overdue`)
              : `D-${item.daysUntil}`}
        </span>
      </div>

      {/* 제목 */}
      <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.2px" }}>
        {item.event.title}
      </div>

      {/* 설명 */}
      <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted)" }}>
        {item.event.description}
      </div>

      {/* 준비 서류 */}
      {item.event.prepItems && item.event.prepItems.length > 0 && (
        <div style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap" as const,
          marginTop: "2px",
        }}>
          {item.event.prepItems.map((doc) => (
            <span key={doc} style={{
              fontSize: "12px",
              color: "var(--muted)",
              padding: "4px 10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(17,17,17,0.06)",
            }}>
              {doc}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingTaxRow({ item, ko }: { item: PersonalizedTaxItem; ko: boolean }) {
  const urgencyColor = getUrgencyColor(item.urgency);

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 14px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.6)",
      border: "1px solid rgba(17,17,17,0.04)",
    }}>
      <div style={{ display: "grid", gap: "2px" }}>
        <div style={{ fontSize: "14px", fontWeight: 580 }}>
          {item.event.title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>
          {item.dueDate.toLocaleDateString(ko ? "ko-KR" : "en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <span style={{
        fontSize: "12px",
        fontWeight: 600,
        color: urgencyColor,
      }}>
        D-{item.daysUntil}
      </span>
    </div>
  );
}
