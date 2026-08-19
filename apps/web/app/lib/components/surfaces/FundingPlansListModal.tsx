"use client";

/**
 * FundingPlansList — 내 사업계획서 목록 → 터치 → 상세 열람 (2026-08-14)
 *
 * 2026-08-19: GuidesView 「내 계획서」 세그먼트에 인라인 렌더(FundingPlansList).
 *   팝업 래퍼(FundingPlansListModal)는 유지 — 다른 진입점용. iOS FundingPlansListSheet/FundingPlansList 미러.
 * 목록(최신순) → 항목 터치 → 섹션 뷰 + 복사 + 삭제.
 * 데이터: GET /api/funding/plans (서버 저장 원장 business_plan_drafts — 웹·iOS 공용).
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, ChevronLeft, Copy, Check, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "rgba(15,23,42,0.55)";

export type SavedPlan = {
  id: string;
  programId: string | null;
  programName: string | null;
  purpose: string;
  summary: string | null;
  sections: { title: string; content: string }[];
  missingInfo: string[];
  model: string | null;
  createdAt: string;
};

const NOTICE = "생성 결과는 초안입니다. 반드시 공고에 첨부된 공식 양식(HWP)에 옮겨 제출하세요.";

async function authHeader(): Promise<Record<string, string> | null> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : null;
}

/** 인라인 목록·상세 (세그먼트 본문용). 마운트 시 로드. */
export function FundingPlansList({
  ko,
  onClose,
}: {
  ko: boolean;
  /** 팝업 래퍼에서만 전달 — 우상단 닫기 버튼 노출 */
  onClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [selected, setSelected] = useState<SavedPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await authHeader();
      if (!h) {
        setError(ko ? "로그인이 필요해요." : "Sign in required.");
        return;
      }
      const res = await fetch("/api/funding/plans?limit=50", { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(json.error ?? (ko ? "목록을 불러오지 못했어요." : "Failed to load.")));
        return;
      }
      setPlans((json.drafts ?? []) as SavedPlan[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [ko]);

  useEffect(() => {
    setSelected(null);
    setCopied(false);
    void load();
  }, [load]);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (selected ? setSelected(null) : onClose());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selected]);

  const copyAll = useCallback(async () => {
    if (!selected) return;
    const text = [
      `[${selected.programName ?? (ko ? "사업계획서" : "Business plan")}] 초안 — FOUND.ONE`,
      selected.summary ? `\n${selected.summary}` : "",
      ...selected.sections.map((s) => `\n\n${s.title}\n${s.content}`),
    ].join("");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard 거부 — 무시 */ }
  }, [selected, ko]);

  const remove = useCallback(async () => {
    if (!selected) return;
    if (!window.confirm(ko ? "이 사업계획서를 삭제할까요? 되돌릴 수 없어요." : "Delete this plan?")) return;
    setDeleting(true);
    try {
      const h = await authHeader();
      if (!h) return;
      const res = await fetch(`/api/funding/plans?id=${encodeURIComponent(selected.id)}`, { method: "DELETE", headers: h });
      if (res.ok) {
        setPlans((p) => p.filter((x) => x.id !== selected.id));
        setSelected(null);
      }
    } finally {
      setDeleting(false);
    }
  }, [selected, ko]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {selected ? (
            <button type="button" onClick={() => setSelected(null)} aria-label="목록으로" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: MIDNIGHT, display: "flex" }}>
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={17} color={MIDNIGHT} strokeWidth={1.8} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected ? (selected.programName ?? (ko ? "사업계획서" : "Business plan")) : ko ? "내 사업계획서" : "My business plans"}
            </div>
            <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 }}>
              {selected ? `${fmtDate(selected.createdAt)} 생성` : ko ? `${plans.length}건 · 최신순` : `${plans.length} saved`}
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: TEXT_MUTED }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* 목록 */}
        {!selected && (
          <div>
            {loading && (
              <div style={{ padding: "36px 0", textAlign: "center" }}>
                <Loader2 size={22} color={MIDNIGHT} style={{ animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {!loading && error && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(220,38,38,0.06)", borderRadius: 10, padding: 12, fontSize: 13, color: TEXT_PRIMARY }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}
            {!loading && !error && plans.length === 0 && (
              <div style={{ padding: "36px 12px", textAlign: "center", fontSize: 13.5, color: TEXT_MUTED, lineHeight: 1.7 }}>
                {ko ? "아직 저장된 사업계획서가 없어요.\n공고 카드의 '맞춤 계획서'로 첫 초안을 만들어보세요." : "No saved plans yet."}
              </div>
            )}
            {!loading && !error && plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                style={{ width: "100%", textAlign: "left", background: "white", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <FileText size={16} color={MIDNIGHT} strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.programName ?? (ko ? "일반 사업계획서" : "Business plan")}
                  </div>
                  {p.summary && (
                    <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.7)", marginTop: 3, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.summary}
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 5 }}>
                    {fmtDate(p.createdAt)} · {p.sections.length}{ko ? "개 섹션" : " sections"}
                    {p.missingInfo?.length ? ` · ${ko ? `채울 항목 ${p.missingInfo.length}` : `${p.missingInfo.length} to fill`}` : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 상세 */}
        {selected && (
          <div>
            <div style={{ fontSize: 12, color: "#92400e", background: "rgba(245,158,11,0.09)", borderRadius: 10, padding: "9px 12px", lineHeight: 1.55, marginBottom: 12 }}>
              {NOTICE}
            </div>
            {selected.summary && (
              <div style={{ fontSize: 13.5, fontWeight: 700, color: MIDNIGHT, lineHeight: 1.6, marginBottom: 14 }}>{selected.summary}</div>
            )}
            {selected.missingInfo?.length > 0 && (
              <div style={{ background: "rgba(25,25,112,0.05)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: MIDNIGHT, marginBottom: 8 }}>
                  {ko ? `✍️ 이 ${selected.missingInfo.length}가지만 채우면 완성돼요` : "Fill these to complete"}
                </div>
                {selected.missingInfo.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: 4 }}>
                    <span style={{ color: MIDNIGHT, flexShrink: 0 }}>☐</span><span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.sections.map((s) => (
              <div key={s.title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "rgba(15,23,42,0.78)", lineHeight: 1.72, whiteSpace: "pre-wrap" }}>{s.content}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 6, position: "sticky", bottom: 0, background: "white", paddingTop: 10 }}>
              <button type="button" onClick={() => void copyAll()} style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: MIDNIGHT, color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.8} />}
                {copied ? (ko ? "복사됨" : "Copied") : ko ? "전체 복사" : "Copy all"}
              </button>
              <button type="button" onClick={() => void remove()} disabled={deleting} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(220,38,38,0.25)", background: "white", color: "#b91c1c", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: deleting ? 0.6 : 1 }}>
                <Trash2 size={13} strokeWidth={1.8} />
                {ko ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
  );
}

/** 팝업 래퍼 — 배경 클릭·ESC 닫힘, body scroll lock (FundingPlanModal 과 동일 패턴). */
export function FundingPlansListModal({
  open,
  ko,
  onClose,
}: {
  open: boolean;
  ko: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ width: "min(720px, 100%)", maxHeight: "86vh", overflow: "auto", background: "white", borderRadius: 20, padding: "22px 22px 18px", boxShadow: "0 24px 64px rgba(15,23,42,0.28)" }}
      >
        <FundingPlansList ko={ko} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
