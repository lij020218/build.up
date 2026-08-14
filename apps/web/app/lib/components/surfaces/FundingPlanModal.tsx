"use client";

/**
 * FundingPlanModal — 공고 맞춤 사업계획서 초안 생성 팝업. (2026-08-14)
 *
 * GuidesView.ProgramCard "맞춤 계획서" 클릭 → 확인 화면(주 2회 한도 고지) → 생성 → 섹션 뷰.
 *
 *  · 한도: 주 2회 (서버 business-plan-program 리미터가 집행 — KST 월요일 초기화)
 *  · 캐시: 같은 공고 재열람은 localStorage 저장본 표시(한도 미소모). 키에 uid 포함(계정 격리 불변식).
 *  · 고지: 결과는 "초안" — 공고의 공식 양식(HWP)에 옮겨 제출해야 함(임의 양식 = 평가 제외 위험).
 *
 * 접근성: ESC + 배경 클릭 닫힘, body scroll lock (FundingScoreModal 과 동일 패턴).
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Loader2, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import type { StartupProgram } from "@foundone/shared";

const MIDNIGHT = "#191970";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";

export type PlanSection = { title: string; content: string };
export type PlanResult = { summary: string; sections: PlanSection[]; generatedAt: string };

/** 사용자 데이터(공고 제외) — GuidesView 가 store 에서 조립해 내려준다. */
export type PlanUserPayload = {
  industry: string;
  subIndustry: string;
  startupType: string;
  businessModel: string;
  capital: number;
  targetOpenDate: string;
  location?: string;
  language: "ko" | "en";
};

const cacheKey = (uid: string, programId: string) => `fo:funding-plan:${uid}:${programId}`;

function readCache(uid: string | null, programId: string): PlanResult | null {
  if (!uid) return null; // 계정 격리 — uid 없으면 캐시 접근 금지
  try {
    const raw = localStorage.getItem(cacheKey(uid, programId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanResult;
    return Array.isArray(parsed.sections) && parsed.sections.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(uid: string | null, programId: string, result: PlanResult) {
  if (!uid) return;
  try {
    localStorage.setItem(cacheKey(uid, programId), JSON.stringify(result));
  } catch {
    /* 저장 실패는 무해 — 다음 열람 시 재생성 확인 화면 */
  }
}

export function FundingPlanModal({
  program,
  ko,
  userPayload,
  onClose,
}: {
  program: StartupProgram | null;
  ko: boolean;
  userPayload: PlanUserPayload;
  onClose: () => void;
}) {
  const open = !!program;
  const lang: "ko" | "en" = ko ? "ko" : "en";

  const [uid, setUid] = useState<string | null>(null);
  const [view, setView] = useState<"confirm" | "loading" | "result" | "error">("confirm");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 열릴 때: uid 확보 → 캐시 있으면 바로 결과 뷰(한도 미소모)
  useEffect(() => {
    if (!open || !program) return;
    let alive = true;
    setView("confirm");
    setResult(null);
    setError(null);
    setFromCache(false);
    setCopied(false);
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const userId = data.session?.user?.id ?? null;
      setUid(userId);
      const cached = readCache(userId, program.id);
      if (cached) {
        setResult(cached);
        setFromCache(true);
        setView("result");
      }
    });
    return () => {
      alive = false;
    };
  }, [open, program]);

  // ESC + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const generate = useCallback(async () => {
    if (!program) return;
    setView("loading");
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError(ko ? "로그인 세션이 만료됐어요. 새로고침 후 다시 시도해주세요." : "Session expired. Refresh and retry.");
        setView("error");
        return;
      }
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...userPayload,
          purpose: "govt-support",
          program: {
            id: program.id,
            name: program.name[lang],
            organizer: program.organizer[lang],
            category: program.category,
            target: program.target[lang],
            benefit: program.benefit[lang],
            region: program.regions?.join(", ") || undefined,
            targetAge: program.maxAge ? `만 ${program.maxAge}세 이하` : undefined,
            businessPeriod: program.businessYearRange
              ? `업력 ${program.businessYearRange[0]}~${program.businessYearRange[1]}년`
              : undefined,
            applicationEnd: program.applicationDeadline,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(json.error ?? (ko ? "생성에 실패했어요. 잠시 후 다시 시도해주세요." : "Generation failed.")));
        setView("error");
        return;
      }
      const next: PlanResult = {
        summary: String(json.summary ?? ""),
        sections: (json.sections ?? []) as PlanSection[],
        generatedAt: new Date().toISOString(),
      };
      setResult(next);
      setFromCache(false);
      writeCache(uid, program.id, next);
      setView("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setView("error");
    }
  }, [program, userPayload, lang, ko, uid]);

  const copyAll = useCallback(async () => {
    if (!result || !program) return;
    const text = [
      `[${program.name[lang]}] 맞춤 사업계획서 초안 — FOUND.ONE`,
      result.summary ? `\n${result.summary}` : "",
      ...result.sections.map((s) => `\n\n${s.title}\n${s.content}`),
    ].join("");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 권한 거부 — 무시 */
    }
  }, [result, program, lang]);

  if (!open || !program) return null;
  if (typeof document === "undefined") return null;

  const notice = ko
    ? "생성 결과는 초안입니다. 반드시 공고에 첨부된 공식 양식(HWP)에 옮겨 제출하세요 — 임의 양식 제출 시 평가에서 제외될 수 있어요."
    : "This is a draft. Transfer it into the program's official form before submitting.";

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "min(720px, 100%)",
          maxHeight: "86vh",
          overflow: "auto",
          background: "white",
          borderRadius: 20,
          padding: "22px 22px 18px",
          boxShadow: "0 24px 64px rgba(15,23,42,0.28)",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={17} color={MIDNIGHT} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35 }}>
              {ko ? "공고 맞춤 사업계획서" : "Tailored business plan"}
            </div>
            <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {program.name[lang]}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: TEXT_MUTED }}>
            <X size={18} />
          </button>
        </div>

        {/* 확인 화면 — 한도 고지 + 생성 */}
        {view === "confirm" && (
          <div>
            <div style={{ fontSize: 13.5, color: TEXT_PRIMARY, lineHeight: 1.65, margin: "12px 0" }}>
              {ko
                ? "사장님의 로드맵 데이터(업종·자본·입지)와 이 공고의 지원 대상·내용을 반영해 PSST 구조의 초안을 작성해 드려요."
                : "We draft a PSST-structured plan from your roadmap data, tailored to this program."}
            </div>
            <div style={{ fontSize: 12.5, color: MIDNIGHT, fontWeight: 600, background: "rgba(25,25,112,0.06)", borderRadius: 10, padding: "10px 12px", lineHeight: 1.6 }}>
              {ko ? "무료 · 주 2회 한도 — 이번 생성으로 1회를 사용해요. 생성된 초안은 저장되어 다시 볼 때는 한도를 쓰지 않아요." : "Free · 2 per week. Saved drafts can be reopened without using the quota."}
            </div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6, marginTop: 10 }}>{notice}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)", background: "white", color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
              >
                {ko ? "취소" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => void generate()}
                style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: MIDNIGHT, color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <FileText size={14} strokeWidth={1.8} />
                {ko ? "초안 생성하기" : "Generate draft"}
              </button>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {view === "loading" && (
          <div style={{ padding: "36px 0", textAlign: "center" }}>
            <Loader2 size={26} color={MIDNIGHT} style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 13.5, color: TEXT_PRIMARY, fontWeight: 600, marginTop: 12 }}>
              {ko ? "공고 특성에 맞춰 작성하고 있어요…" : "Drafting for this program…"}
            </div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
              {ko ? "최대 2분 정도 걸릴 수 있어요. 창을 닫지 말아 주세요." : "This can take up to 2 minutes."}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* 에러 */}
        {view === "error" && (
          <div style={{ padding: "20px 0 4px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(220,38,38,0.06)", borderRadius: 10, padding: "12px 12px" }}>
              <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{error}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)", background: "white", color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
            >
              {ko ? "닫기" : "Close"}
            </button>
          </div>
        )}

        {/* 결과 */}
        {view === "result" && result && (
          <div>
            {/* 고지 배너 — 항상 상단 고정 */}
            <div style={{ fontSize: 12, color: "#92400e", background: "rgba(245,158,11,0.09)", borderRadius: 10, padding: "9px 12px", lineHeight: 1.55, margin: "10px 0 12px" }}>
              {notice}
            </div>
            {fromCache && (
              <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 10 }}>
                {ko
                  ? `저장본 · ${new Date(result.generatedAt).toLocaleDateString("ko-KR")} 생성 (재열람은 한도를 쓰지 않아요)`
                  : `Saved draft · ${new Date(result.generatedAt).toLocaleDateString()}`}
              </div>
            )}
            {result.summary && (
              <div style={{ fontSize: 13.5, fontWeight: 700, color: MIDNIGHT, lineHeight: 1.6, marginBottom: 14 }}>
                {result.summary}
              </div>
            )}
            {result.sections.map((s) => (
              <div key={s.title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "rgba(15,23,42,0.78)", lineHeight: 1.72, whiteSpace: "pre-wrap" }}>{s.content}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 6, position: "sticky", bottom: 0, background: "white", paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => void copyAll()}
                style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: MIDNIGHT, color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.8} />}
                {copied ? (ko ? "복사됨" : "Copied") : ko ? "전체 복사" : "Copy all"}
              </button>
              <button
                type="button"
                onClick={() => setView("confirm")}
                title={ko ? "주 2회 한도에서 1회를 사용해요" : "Uses 1 of 2 weekly credits"}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)", background: "white", color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <RefreshCw size={13} strokeWidth={1.8} />
                {ko ? "다시 생성" : "Regenerate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
