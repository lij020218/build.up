"use client";

/**
 * 당근으로 알바 구하기 — 가이드 팝업 (2026-07-25, 사장님 피드백).
 *
 * 콘텐츠 SSOT: @foundone/shared team/hiring-channels.ts DAANGN_HIRING_GUIDE
 * (3단계 절차 + 팁 2개, 전 항목 공식 출처 기반 — 위조·단정 없음).
 * 셸: StaffDetailModal 패턴(오버레이 blur + 흰 카드 22radius) 재사용.
 * iOS 미러: Team/DaangnHiringGuideSheet.swift — 드리프트는 sync 테스트가 차단.
 * 아이콘: lucide (iOS 는 SF Symbols) — 채널 아이콘 매핑 관례(marketing-store)와 동일하게 웹에서만 매핑.
 */

import { PenLine, Users, MessageCircle, Megaphone, Scale, X, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DAANGN_HIRING_GUIDE, type HiringGuideIcon, type HiringGuideItem } from "@foundone/shared";

const MIDNIGHT = "#191970";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

// 아이콘 키 → lucide (React 컴포넌트라 SSOT 에 못 둠 — 웹에서만 매핑, iOS 는 SF Symbol)
const GUIDE_ICONS: Record<HiringGuideIcon, LucideIcon> = {
  write: PenLine,
  applicants: Users,
  chat: MessageCircle,
  ads: Megaphone,
  law: Scale,
};

function GuideRow({ item, index, ko }: { item: HiringGuideItem; index?: number; ko: boolean }) {
  const Icon = GUIDE_ICONS[item.icon];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: 11,
        background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <Icon size={16} strokeWidth={1.9} color={MIDNIGHT} />
        {typeof index === "number" && (
          <span style={{
            position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: 8,
            background: MIDNIGHT, color: "white", fontSize: 9.5, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{index + 1}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 720, color: INK, letterSpacing: "-0.01em" }}>
          {ko ? item.title.ko : item.title.en}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, marginTop: 2 }}>
          {ko ? item.desc.ko : item.desc.en}
        </div>
      </div>
    </div>
  );
}

export function DaangnHiringGuideModal({ ko, onClose }: { ko: boolean; onClose: () => void }) {
  const g = DAANGN_HIRING_GUIDE;
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 420, maxHeight: "86vh", overflowY: "auto",
        background: "white", borderRadius: 22, padding: "24px 22px",
        boxShadow: "0 24px 80px rgba(25,25,112,0.25)", border: "1px solid rgba(25,25,112,0.08)",
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
              {ko ? "구인 가이드" : "Hiring guide"}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: INK, letterSpacing: "-0.015em" }}>
              {ko ? g.title.ko : g.title.en}
            </div>
            <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, margin: "5px 0 0" }}>
              {ko ? g.subtitle.ko : g.subtitle.en}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"} style={{ border: "none", background: MIDNIGHT_SOFT, borderRadius: 10, padding: 7, cursor: "pointer" }}>
            <X size={14} strokeWidth={2.2} color={MIDNIGHT} />
          </button>
        </div>

        {/* 3단계 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "18px 0" }}>
          {g.steps.map((s, i) => <GuideRow key={s.icon} item={s} index={i} ko={ko} />)}
        </div>

        {/* 팁 — 배경 톤으로 구분 (신호등 컬러 없음) */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.07)",
          borderRadius: 14, padding: "14px 14px",
        }}>
          {g.tips.map((t) => <GuideRow key={t.icon} item={t} ko={ko} />)}
        </div>

        {/* CTA */}
        <a
          href={g.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "12px 16px", borderRadius: 13, background: MIDNIGHT, color: "white",
            fontSize: 13.5, fontWeight: 750, textDecoration: "none",
            boxShadow: "0 2px 8px rgba(25,25,112,0.22)",
          }}
        >
          {ko ? "당근알바 열기" : "Open Daangn Jobs"}
          <ExternalLink size={13} strokeWidth={2.2} style={{ opacity: 0.8 }} />
        </a>

        {/* 출처 — 정직성: 이 가이드의 근거 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: MUTED }}>
            {ko ? "출처" : "Sources"}
          </span>
          {g.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, color: MIDNIGHT, textDecoration: "none",
              background: MIDNIGHT_SOFT, padding: "2px 8px", borderRadius: 6,
            }}>
              {ko ? s.name.ko : s.name.en}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
