"use client";

/**
 * /browse — 로그인 없이 둘러보기 (게스트 모드).
 *
 * iOS 심사 5.1.1(v) 대응("비계정 기능은 가입 없이 접근 가능해야 함")의 웹 미러
 * (웹·모바일 동기화 원칙 — 내용·배치·진입점 동일).
 *
 * 구성: 상단 배너(가입 CTA) + 탭 3개
 *  ① 프랜차이즈 비교 — FranchiseView (번들 데이터, 인증 불필요)
 *  ② 세금 안내 — TaxSurface guest 모드 (개인화 자리는 가입 안내 행)
 *  ③ 로드맵 미리보기 — 단계 콘텐츠 SSOT(STAGE_CONTENT_REGISTRY) 읽기 전용 렌더
 * 대시보드·AI·직원 기능 없음, 가짜 매출 숫자 없음.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { STAGE_CONTENT_REGISTRY, type StageContent } from "@foundone/shared";
import { useLanguage } from "../language-provider";
import { DashboardProvider } from "../lib/contexts/DashboardContext";
import { FranchiseView } from "../lib/components/surfaces/FranchiseView";
import { TaxSurface } from "../lib/components/surfaces/TaxSurface";
import { GuestStageContentRenderer } from "../lib/components/stages/shared/StageContentRenderer";
import { FoundOneLogo } from "../lib/components/ui/FoundOneLogo";
import { makeGuestDashboardCtx } from "./guest-dashboard-ctx";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";

type GuestTab = "franchise" | "tax" | "roadmap";

/** 로드맵 미리보기 단계 순서 — 오프라인 경로 진행 순 (SSOT 레지스트리 5단계). */
const PREVIEW_STAGE_ORDER = [
  "registration-setup",
  "contract-review",
  "permit-check",
  "hiring-setup",
  "tax-guide",
] as const;

export default function BrowseClient() {
  const router = useRouter();
  const { language } = useLanguage();
  const ko = language === "ko";
  const [tab, setTab] = useState<GuestTab>("franchise");
  const guestCtx = useMemo(() => makeGuestDashboardCtx(language), [language]);

  const tabs: Array<{ id: GuestTab; label: string }> = [
    { id: "franchise", label: ko ? "프랜차이즈 비교" : "Franchises" },
    { id: "tax", label: ko ? "세금 안내" : "Tax Guide" },
    { id: "roadmap", label: ko ? "로드맵 미리보기" : "Roadmap Preview" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #f7f8fe)" }}>
      {/* ━━━ 둘러보기 배너 ━━━ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(247,248,254,0.92)",
          backdropFilter: "saturate(180%) blur(16px)",
          borderBottom: `1px solid ${MIDNIGHT_BORDER}`,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <FoundOneLogo height={18} />
          <span style={{ fontSize: 12.5, color: TEXT_MUTED, flex: 1, minWidth: 180, lineHeight: 1.45 }}>
            {ko
              ? "둘러보기 모드 — 가입하면 내 가게 관리를 시작할 수 있어요"
              : "Browse mode — sign up to start managing your own store"}
          </span>
          <button
            type="button"
            onClick={() => router.push("/auth")}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: `linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)`,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(30,42,85,0.28)",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            {ko ? "가입하기" : "Sign up"}
          </button>
        </div>

        {/* 탭 스위처 */}
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "0 16px 10px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: `1px solid ${active ? MIDNIGHT : "rgba(15,23,42,0.10)"}`,
                  background: active ? MIDNIGHT : "white",
                  color: active ? "white" : TEXT_PRIMARY,
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  fontFamily: "inherit",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ━━━ 콘텐츠 ━━━ */}
      <div style={{ padding: "0 16px" }}>
        <DashboardProvider value={guestCtx}>
          {tab === "franchise" && <FranchiseView />}
          {tab === "tax" && <TaxSurface guest />}
          {tab === "roadmap" && <GuestRoadmapPreview ko={ko} />}
        </DashboardProvider>
      </div>
    </div>
  );
}

/* ───────────────────── 로드맵 단계 미리보기 (읽기 전용) ───────────────────── */

function GuestRoadmapPreview({ ko }: { ko: boolean }) {
  const [openStageId, setOpenStageId] = useState<string | null>(PREVIEW_STAGE_ORDER[0]);

  const stages: StageContent[] = PREVIEW_STAGE_ORDER
    .map((id) => STAGE_CONTENT_REGISTRY[id])
    .filter((c): c is StageContent => !!c);

  return (
    <main
      style={{
        maxWidth: 960,
        width: "100%",
        margin: "0 auto",
        padding: "24px 0 80px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.65, letterSpacing: "0.12em" }}>
          ROADMAP
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 750, letterSpacing: "-0.025em", color: TEXT_PRIMARY, margin: 0 }}>
          {ko ? "창업 로드맵 미리보기" : "Startup Roadmap Preview"}
        </h1>
        <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.55, margin: 0, maxWidth: 640 }}>
          {ko
            ? "사업자등록부터 세금 세팅까지, 로드맵 핵심 단계의 실제 내용을 읽기 전용으로 볼 수 있어요. 업종 분기 내용은 음식점 기준 예시이며, 가입하면 내 업종·진행 상황에 맞춰 전체 로드맵이 열려요."
            : "Read-only preview of key roadmap stages. Industry-specific content shows the food-service example — sign up to unlock the full roadmap tailored to your business."}
        </p>
      </header>

      {stages.map((content, idx) => {
        const open = openStageId === content.stageId;
        return (
          <section key={content.stageId}>
            <button
              type="button"
              onClick={() => setOpenStageId(open ? null : content.stageId)}
              className="bento-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: `1px solid ${open ? MIDNIGHT_BORDER : "rgba(25,25,112,0.08)"}`,
                background: "white",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: "rgba(25,25,112,0.06)",
                  color: MIDNIGHT,
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 750, color: TEXT_PRIMARY, letterSpacing: "-0.015em" }}>
                  {content.shell.title}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: TEXT_MUTED, marginTop: 2 }}>
                  {content.shell.stageEyebrow}
                </span>
              </span>
              {open ? (
                <ChevronUp size={16} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
              ) : (
                <ChevronDown size={16} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
              )}
            </button>
            {open && (
              <div style={{ marginTop: 12 }}>
                <GuestStageContentRenderer content={content} ko={ko} />
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
