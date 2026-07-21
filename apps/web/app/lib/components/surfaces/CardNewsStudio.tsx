"use client";

/**
 * 카드뉴스 스튜디오 — 인스타 카드뉴스(3~5장) 자동 제작 (2026-07-21 사장님 지시 신설).
 *
 *  흐름: 주제 입력(또는 추천 칩) + 장수 선택 → /api/ai/marketing/cardnews →
 *        4:5 미리보기 + 장별 텍스트 수정 → PNG 저장(1080×1350 canvas) + 캡션·해시태그 복사.
 *
 *  제작 원칙(2026-07 웹 조사)은 서버 프롬프트가 강제: 표지 후킹 15자·한 장 한 메시지·
 *  2번 슬라이드 독립 후킹·마지막 CTA·정보형(저장 유도).
 *
 *  과금: 지금 무료, 9월부터 프로 전용 — 배지로만 고지(서버 게이팅 없음, 무료 정책 준수).
 *  AI 기본법: 내보내는 이미지 하단에 "AI 제작 보조" 소표기 + UI 고지 문구.
 */

import { useMemo, useRef, useState } from "react";
import { Sparkles, Download, RefreshCw, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import type { CardNewsCard, CardNewsResult } from "../../../api/ai/marketing/cardnews/route";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#10104a";
const LAVENDER = "#B9BBFF";

type Props = {
  ko: boolean;
  storeName: string;
  industryCategoryId: string | null;
  subIndustryId: string | null;
  subIndustryLabel?: string | null;
};

// ── 1080×1350 (4:5) canvas 렌더 ──────────────────────────────────────────

/** 한국어(공백 드묾) 안전 줄바꿈 — 글자 단위 측정 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = ch === " " ? "" : ch;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

/** 제목 렌더 — highlight 단어만 라벤더 강조 */
function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  highlight: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  baseColor: string,
  hlColor: string,
): number {
  const lines = wrapText(ctx, title, maxWidth);
  let cy = y;
  for (const line of lines) {
    if (highlight && line.includes(highlight)) {
      const idx = line.indexOf(highlight);
      const before = line.slice(0, idx);
      const after = line.slice(idx + highlight.length);
      let cx = x;
      ctx.fillStyle = baseColor;
      ctx.fillText(before, cx, cy);
      cx += ctx.measureText(before).width;
      ctx.fillStyle = hlColor;
      ctx.fillText(highlight, cx, cy);
      cx += ctx.measureText(highlight).width;
      ctx.fillStyle = baseColor;
      ctx.fillText(after, cx, cy);
    } else {
      ctx.fillStyle = baseColor;
      ctx.fillText(line, x, cy);
    }
    cy += lineHeight;
  }
  return cy;
}

function renderCardToCanvas(card: CardNewsCard, index: number, total: number, storeName: string): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const PAD = 96;

  if (card.role === "cover") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, MIDNIGHT);
    g.addColorStop(1, MIDNIGHT_DEEP);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 상단 상호 pill
    ctx.font = "600 34px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(storeName, PAD, 150);
    // 타이틀 (여백 크게 — 표지는 타이틀이 전부)
    ctx.font = "800 96px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    const afterTitle = drawTitle(ctx, card.title, card.highlight, PAD, 500, W - PAD * 2, 122, "#ffffff", LAVENDER);
    // 부제
    ctx.font = "500 44px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    let cy = afterTitle + 48;
    for (const line of card.lines.slice(0, 2)) {
      ctx.fillText(line, PAD, cy);
      cy += 62;
    }
    // 하단 스와이프 힌트
    ctx.font = "600 34px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("→ 옆으로 넘겨보세요", PAD, H - 140);
  } else if (card.role === "cta") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#EEF0FB");
    g.addColorStop(1, "#DFE3FF");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.font = "800 84px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    const afterTitle = drawTitle(ctx, card.title, card.highlight, PAD, 480, W - PAD * 2, 108, MIDNIGHT_DEEP, MIDNIGHT);
    ctx.font = "500 46px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = "rgba(15,23,42,0.72)";
    let cy = afterTitle + 44;
    for (const line of card.lines.slice(0, 3)) {
      ctx.fillText(line, PAD, cy);
      cy += 66;
    }
    // 가게명 강조
    ctx.font = "800 56px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = MIDNIGHT;
    ctx.fillText(storeName, PAD, H - 220);
  } else {
    // body — 화이트 + 상단 액센트 바
    ctx.fillStyle = "#F7F8FE";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = MIDNIGHT;
    ctx.fillRect(0, 0, W, 18);
    // eyebrow (N번째 팁)
    ctx.font = "700 34px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = MIDNIGHT;
    ctx.fillText(`${String(index).padStart(2, "0")}`, PAD, 190);
    ctx.font = "800 76px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    const afterTitle = drawTitle(ctx, card.title, card.highlight, PAD, 320, W - PAD * 2, 98, MIDNIGHT_DEEP, MIDNIGHT);
    // 구분선
    ctx.fillStyle = "rgba(25,25,112,0.14)";
    ctx.fillRect(PAD, afterTitle - 20, 120, 6);
    // 본문 (여백 넉넉히 — 조사 원칙)
    ctx.font = "500 48px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    let cy = afterTitle + 72;
    for (const line of card.lines.slice(0, 3)) {
      for (const wrapped of wrapText(ctx, line, W - PAD * 2)) {
        ctx.fillText(wrapped, PAD, cy);
        cy += 74;
      }
      cy += 14;
    }
  }

  // 페이지 도트 + AI 소표기 (전 장 공통 — AI 기본법 생성물 표시)
  const dotY = H - 74;
  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 - ((total - 1) * 22) / 2 + i * 22, dotY, i === index ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = card.role === "cover"
      ? (i === index ? "#ffffff" : "rgba(255,255,255,0.35)")
      : (i === index ? MIDNIGHT : "rgba(25,25,112,0.25)");
    ctx.fill();
  }
  ctx.font = "500 24px 'Apple SD Gothic Neo', 'Pretendard', sans-serif";
  ctx.fillStyle = card.role === "cover" ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.35)";
  ctx.textAlign = "right";
  ctx.fillText("AI 제작 보조", W - 40, H - 34);
  ctx.textAlign = "left";
  return canvas;
}

// ── 미리보기 (DOM, 4:5 축소판 — canvas 와 같은 톤) ────────────────────────

function PreviewCard({ card, index, total, storeName }: { card: CardNewsCard; index: number; total: number; storeName: string }) {
  const base: React.CSSProperties = {
    width: 216,
    height: 270,
    borderRadius: 12,
    padding: "16px 14px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid rgba(25,25,112,0.10)",
    position: "relative",
  };
  const dots = (
    <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width: i === index ? 6 : 4, height: i === index ? 6 : 4, borderRadius: 99,
          background: card.role === "cover" ? (i === index ? "#fff" : "rgba(255,255,255,0.35)") : (i === index ? MIDNIGHT : "rgba(25,25,112,0.25)"),
        }} />
      ))}
    </div>
  );
  if (card.role === "cover") {
    return (
      <div style={{ ...base, background: `linear-gradient(135deg, ${MIDNIGHT} 0%, ${MIDNIGHT_DEEP} 100%)`, justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 12, left: 14, fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{storeName}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {card.highlight && card.title.includes(card.highlight)
            ? (<>
                {card.title.split(card.highlight)[0]}
                <span style={{ color: LAVENDER }}>{card.highlight}</span>
                {card.title.split(card.highlight).slice(1).join(card.highlight)}
              </>)
            : card.title}
        </div>
        <div style={{ marginTop: 8, fontSize: 9.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
          {card.lines.slice(0, 2).map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {dots}
      </div>
    );
  }
  if (card.role === "cta") {
    return (
      <div style={{ ...base, background: "linear-gradient(180deg, #EEF0FB 0%, #DFE3FF 100%)", justifyContent: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: MIDNIGHT_DEEP, lineHeight: 1.3, wordBreak: "keep-all" }}>{card.title}</div>
        <div style={{ marginTop: 8, fontSize: 9.5, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
          {card.lines.slice(0, 3).map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, color: MIDNIGHT }}>{storeName}</div>
        {dots}
      </div>
    );
  }
  return (
    <div style={{ ...base, background: "#F7F8FE" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: MIDNIGHT }} />
      <div style={{ fontSize: 9, fontWeight: 700, color: MIDNIGHT, marginTop: 6 }}>{String(index).padStart(2, "0")}</div>
      <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 800, color: MIDNIGHT_DEEP, lineHeight: 1.3, wordBreak: "keep-all" }}>{card.title}</div>
      <div style={{ width: 22, height: 2, background: "rgba(25,25,112,0.2)", margin: "7px 0" }} />
      <div style={{ fontSize: 9.5, color: "rgba(15,23,42,0.78)", lineHeight: 1.6 }}>
        {card.lines.slice(0, 3).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {dots}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────

export function CardNewsStudio({ ko, storeName, industryCategoryId, subIndustryId, subIndustryLabel }: Props) {
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CardNewsResult | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayStore = storeName?.trim() || (ko ? "내 가게" : "My store");
  const indLabel = subIndustryLabel?.trim() || (ko ? "우리 업종" : "my industry");

  // 추천 주제 칩 — 조사 반영: 정보형(팁·FAQ·과정)이 저장률↑
  const topicChips = useMemo(() => [
    `${indLabel} 처음 온 손님 꿀팁 3가지`,
    "사장님이 매일 하는 준비 과정",
    "손님들이 자주 묻는 질문 TOP3",
    "이번 주 메뉴·이벤트 소개",
  ], [indLabel]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setEditIdx(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError(ko ? "로그인 후 이용할 수 있어요." : "Sign in to use this.");
        return;
      }
      const res = await fetch("/api/ai/marketing/cardnews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          cardCount,
          storeName: displayStore,
          industryCategoryId,
          subIndustryId,
          subIndustryLabel,
          language: ko ? "ko" : "en",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error || (ko ? "생성에 실패했어요. 잠시 후 다시 시도해 주세요." : "Generation failed. Try again."));
        return;
      }
      const data = (await res.json()) as CardNewsResult;
      if (!data.cards || data.cards.length < 3) {
        setError(ko ? "생성에 실패했어요. 주제를 조금 바꿔 다시 시도해 주세요." : "Generation failed — try a different topic.");
        return;
      }
      setResult(data);
    } catch {
      setError(ko ? "네트워크 오류가 발생했어요." : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const updateCard = (idx: number, patch: Partial<CardNewsCard>) => {
    setResult((prev) => prev ? { ...prev, cards: prev.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)) } : prev);
  };

  const downloadOne = (idx: number) => {
    if (!result) return;
    const canvas = renderCardToCanvas(result.cards[idx], idx, result.cards.length, displayStore);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cardnews-${idx + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  const downloadAll = () => {
    if (!result) return;
    result.cards.forEach((_, i) => setTimeout(() => downloadOne(i), i * 350));
  };

  const copyCaption = async () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* 복사 실패 — 사용자가 직접 선택 */ }
  };

  return (
    <section className="bento-card" style={{
      background: "white", borderRadius: 18, border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "20px 22px",
    }}>
      {/* 헤더 + 과금 배지 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 9, background: "rgba(25,25,112,0.08)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Sparkles size={15} strokeWidth={1.8} color={MIDNIGHT} />
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 750, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {ko ? "카드뉴스 만들기" : "Card News Studio"}
            </span>
            <span style={{
              padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
              background: "rgba(25,25,112,0.07)", color: MIDNIGHT,
            }}>
              {ko ? "지금 무료 · 9월부터 프로 전용" : "Free now · Pro-only from Sept"}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
            {ko
              ? "주제만 정하면 인스타 캐러셀용 카드뉴스 3~5장을 만들어 드려요. 표지 후킹·한 장 한 메시지·마지막 저장 유도까지 제작 원칙 반영."
              : "Pick a topic — we draft a 3–5 card Instagram carousel with a hooking cover and a save-worthy CTA."}
          </div>
        </div>
      </div>

      {/* 입력줄: 주제 + 장수 + 생성 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={ko ? `예: ${topicChips[0]}` : "e.g. 3 tips for first-time customers"}
          style={{
            flex: "1 1 260px", minWidth: 0, padding: "11px 14px", borderRadius: 11,
            border: "1px solid rgba(25,25,112,0.14)", fontSize: 13.5, outline: "none",
            background: "rgba(247,248,254,0.6)",
          }}
        />
        <select
          value={cardCount}
          onChange={(e) => setCardCount(Number(e.target.value))}
          style={{
            padding: "11px 12px", borderRadius: 11, border: "1px solid rgba(25,25,112,0.14)",
            fontSize: 13, fontWeight: 600, color: MIDNIGHT_DEEP, background: "white", cursor: "pointer",
          }}
        >
          {[3, 4, 5].map((n) => <option key={n} value={n}>{ko ? `${n}장` : `${n} cards`}</option>)}
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "11px 18px", borderRadius: 11, border: "none",
            background: MIDNIGHT, color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
            boxShadow: "0 2px 8px rgba(25,25,112,0.22)",
          }}
        >
          {loading
            ? (<><RefreshCw size={13} strokeWidth={2.2} style={{ animation: "spin 1s linear infinite" }} />{ko ? "만드는 중…" : "Creating…"}</>)
            : (<><Sparkles size={13} strokeWidth={2.2} />{result ? (ko ? "다시 만들기" : "Regenerate") : (ko ? "만들기" : "Create")}</>)}
        </button>
      </div>

      {/* 추천 주제 칩 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {topicChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setTopic(chip)}
            style={{
              padding: "6px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
              border: topic === chip ? `1px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.14)",
              background: topic === chip ? "rgba(25,25,112,0.06)" : "white",
              color: MIDNIGHT_DEEP, cursor: "pointer",
            }}
          >{chip}</button>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 10,
          background: "rgba(182,76,76,0.06)", color: "#b64c4c", fontSize: 12.5, lineHeight: 1.5,
        }}>{error}</div>
      )}

      {/* 결과 */}
      {result && result.cards.length >= 3 && (
        <div style={{ marginTop: 16 }}>
          {/* 미리보기 스트립 */}
          <div ref={scrollRef} style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
            {result.cards.map((card, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <PreviewCard card={card} index={i} total={result.cards.length} storeName={displayStore} />
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  <button type="button" onClick={() => setEditIdx(editIdx === i ? null : i)} style={{
                    padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: "1px solid rgba(25,25,112,0.14)", background: editIdx === i ? "rgba(25,25,112,0.06)" : "white",
                    color: MIDNIGHT_DEEP, cursor: "pointer",
                  }}>{ko ? "수정" : "Edit"}</button>
                  <button type="button" onClick={() => downloadOne(i)} style={{
                    padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: "1px solid rgba(25,25,112,0.14)", background: "white", color: MIDNIGHT_DEEP,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                  }}><Download size={11} strokeWidth={2} />PNG</button>
                </div>
              </div>
            ))}
          </div>

          {/* 장별 수정 폼 */}
          {editIdx !== null && result.cards[editIdx] && (
            <div style={{
              marginTop: 10, padding: "12px 14px", borderRadius: 12,
              background: "rgba(247,248,254,0.8)", border: "1px solid rgba(25,25,112,0.10)",
              display: "grid", gap: 8,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: MIDNIGHT }}>
                {ko ? `${editIdx + 1}번째 장 수정` : `Edit card ${editIdx + 1}`}
              </div>
              <input
                value={result.cards[editIdx].title}
                onChange={(e) => updateCard(editIdx, { title: e.target.value.slice(0, 40) })}
                style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(25,25,112,0.14)", fontSize: 13, fontWeight: 700, outline: "none" }}
              />
              <textarea
                value={result.cards[editIdx].lines.join("\n")}
                onChange={(e) => updateCard(editIdx, { lines: e.target.value.split("\n").map((l) => l.slice(0, 44)).slice(0, 3) })}
                rows={3}
                style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(25,25,112,0.14)", fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
              />
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>
                {ko ? "제목 15자·본문 줄당 22자 이내가 가장 잘 읽혀요 (한 장 = 한 메시지)." : "Title ≤15 chars, ≤22 chars/line reads best."}
              </div>
            </div>
          )}

          {/* 캡션 + 해시태그 + 전체 저장 */}
          <div style={{
            marginTop: 12, padding: "12px 14px", borderRadius: 12,
            border: "1px solid rgba(25,25,112,0.10)", background: "white",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: MIDNIGHT }}>{ko ? "캡션 · 해시태그" : "Caption & hashtags"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={copyCaption} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9,
                  border: "1px solid rgba(25,25,112,0.14)", background: "white", color: MIDNIGHT_DEEP,
                  fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                }}>
                  {copied ? <Check size={12} strokeWidth={2.4} /> : <Copy size={12} strokeWidth={2} />}
                  {copied ? (ko ? "복사됨" : "Copied") : (ko ? "복사" : "Copy")}
                </button>
                <button type="button" onClick={downloadAll} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9,
                  border: "none", background: MIDNIGHT, color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                }}>
                  <Download size={12} strokeWidth={2.2} />{ko ? "전체 PNG 저장" : "Save all PNGs"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(15,23,42,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {result.caption}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: MIDNIGHT, lineHeight: 1.6 }}>
              {result.hashtags.join(" ")}
            </div>
          </div>

          {/* AI 기본법 고지 */}
          <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(15,23,42,0.45)" }}>
            {ko
              ? "생성형 AI가 만든 초안입니다 — 게시 전 내용을 확인·수정하세요. 이미지에 'AI 제작 보조' 표기가 포함됩니다."
              : "Drafted by generative AI — review before posting. Images include an 'AI-assisted' label."}
          </div>
        </div>
      )}
    </section>
  );
}
