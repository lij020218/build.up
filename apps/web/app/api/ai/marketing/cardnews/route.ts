import { NextResponse } from "next/server";
import OpenAI from "openai";
import { resolveTrendGroup, TREND_GROUP_LABELS } from "@foundone/shared";
import { getOpenAIApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

/**
 * 인스타 카드뉴스 자동 제작 ("마케팅 작업하기" 신기능, 2026-07-21 사장님 지시).
 *
 *  가게 컨텍스트 + 주제 → 3~5장 카드뉴스 텍스트(표지·본문·CTA) + 캡션 + 해시태그.
 *  이미지 렌더는 클라이언트(CardNewsStudio canvas, 1080×1350 4:5)가 담당 — 서버는 텍스트만.
 *
 *  제작 원칙 (2026-07 웹 조사 반영 — 링커리어·tooldi·Tyle 체크리스트·캐러셀 전략 가이드):
 *   · 표지 = 후킹: 타이틀 15자 이내 + "왜 봐야 하는지" 부제. 표지가 약하면 스크롤로 지나감.
 *   · 한 장 = 한 메시지. 본문 각 장 제목 짧게 + 본문 2~3줄(줄당 ~22자). 여백이 가독성.
 *   · 2번째 슬라이드도 독립 후킹 역할 (표지 못 본 사람도 잡아야 끝까지 넘김).
 *   · 마지막 장 = CTA (저장·팔로우·방문 유도). 정보형(팁·Do/Don't·튜토리얼)이 저장률↑.
 *
 *  과금: 지금은 전면 무료(2026 6~8월 정책). 9월부터 프로 전용 예정 — UI 배지로만 고지,
 *        서버 게이팅 없음 (유료게이팅 금지 규칙 준수).
 *  인증: Supabase Bearer. 캐시 없음(주제별 온디맨드 생성) — 레이트리밋으로 비용 보호.
 */

export const runtime = "nodejs";
export const maxDuration = 40;

type RequestBody = {
  topic?: string;
  cardCount?: number;          // 3~5
  storeName?: string;
  industryCategoryId?: string;
  subIndustryId?: string;
  subIndustryLabel?: string;
  language?: "ko" | "en";
  // ── 가게 실데이터 (2026-07-21 사장님 지시: "사용자의 가게를 바탕으로") ──
  /** 대표 메뉴·상품 (메뉴 수익성 입력에서) — 카드가 실제 메뉴명·가격을 언급하게 */
  menuItems?: Array<{ name: string; priceWon?: number }>;
  /** 동네/지역 (가게 주소에서) — 해시태그·문구 지역화 */
  region?: string;
  /** 운영 중 여부 — 오픈 전이면 오픈 예고 톤 */
  isOperating?: boolean;
  /** 평균 객단가(원) — 가격대 감각 */
  avgTicketWon?: number;
};

export type CardNewsCard = {
  role: "cover" | "body" | "cta";
  /** 표지·본문 공통 큰 제목 — 15자 이내 권장 */
  title: string;
  /** 표지=부제 1~2줄 / 본문=핵심 2~3줄 / CTA=행동 유도 1~2줄. 줄당 ~22자 */
  lines: string[];
  /** 제목에서 강조(브랜드 보조색)할 단어 — title 의 부분 문자열일 때만 사용 */
  highlight?: string;
  /** 이 장과 함께 쓸 사진 촬영 가이드 (유명 카페 인스타 공식 — 사진이 주인공, 글은 설명).
   *  이미지에는 렌더하지 않고 UI 에서 촬영 지시로만 노출. */
  photoIdea?: string;
};

export type CardNewsResult = {
  topic: string;
  cards: CardNewsCard[];
  caption: string;
  hashtags: string[];
  /** 렌더 템플릿 — photo: 카페·음식점 특화(1장 사진+타이틀 / 2장~ 사진 / 마지막 로고),
   *  text: 일반 텍스트형. (2026-07-21 사장님 관찰: 잘되는 카페·음식점 캐러셀 공식) */
  styleVariant: "photo" | "text";
};

function str(v: unknown, max = 300): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** LLM 산출물 정제 — 장수 3~5 보정, 첫 장 cover·마지막 장 cta 강제, 줄수·길이 클램프 */
function sanitize(raw: unknown, topic: string, styleVariant: "photo" | "text"): CardNewsResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const cardsRaw = Array.isArray(r.cards) ? r.cards : [];
  const cards: CardNewsCard[] = [];
  for (const c of cardsRaw) {
    if (!c || typeof c !== "object") continue;
    const co = c as Record<string, unknown>;
    const title = str(co.title, 40);
    const lines = Array.isArray(co.lines)
      ? co.lines.map((l) => str(l, 44)).filter((l): l is string => !!l).slice(0, 3)
      : [];
    if (!title) continue;
    const role = co.role === "cover" || co.role === "cta" ? co.role : "body";
    const highlight = str(co.highlight, 20);
    cards.push({
      role,
      title,
      lines,
      // highlight 는 title 안에 실제로 있을 때만 (canvas 강조 렌더 안전)
      highlight: highlight && title.includes(highlight) ? highlight : undefined,
      photoIdea: str(co.photoIdea, 90),
    });
  }
  if (cards.length < 3) return null;
  const clamped = cards.slice(0, 5);
  clamped[0].role = "cover";
  clamped[clamped.length - 1].role = "cta";
  for (let i = 1; i < clamped.length - 1; i++) clamped[i].role = "body";

  const hashtags = Array.isArray(r.hashtags)
    ? r.hashtags
        .map((h) => str(h, 30))
        .filter((h): h is string => !!h)
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .slice(0, 10)
    : [];
  return {
    topic,
    cards: clamped,
    caption: str(r.caption, 600) ?? "",
    hashtags,
    styleVariant,
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const userId = auth.userId;

  const apiKey = getOpenAIApiKey();
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ko = body.language !== "en";

  // ── 레이트리밋 (LLM 비용 보호 — cases 와 동일 규율) ──
  const burst = await checkSimpleRateLimit({ key: `ai-marketing-cardnews:${userId}`, limit: 10, windowMs: 60 * 60 * 1000 });
  if (!burst.ok) return NextResponse.json({ error: burst.error }, { status: burst.status });
  const daily = await checkDailyRateLimit({
    userId,
    feature: "marketing-cardnews",
    limit: 20,
    message: ko ? "오늘 카드뉴스 제작 사용량을 초과했습니다. 내일 다시 시도해 주세요." : "Daily limit reached. Try again tomorrow.",
  });
  if (!daily.ok) return NextResponse.json({ error: daily.error }, { status: daily.status });

  const cardCount = Math.min(5, Math.max(3, Math.round(body.cardCount ?? 4)));
  const storeName = body.storeName?.trim() || (ko ? "내 가게" : "your business");
  // 카페 계열 여부 — 유명 카페 인스타 운영 공식(사진 주인공 + 글은 메뉴·이벤트 설명) 플레이북 적용
  //   (2026-07-21 사장님 관찰: 잘되는 카페는 가게 풍경·신메뉴·손님 컷 사진에 글로 메뉴/이달 이벤트 설명)
  const isCafeLike =
    body.industryCategoryId === "cafe-dessert" ||
    ["takeout-coffee", "specialty-coffee", "bakery-studio", "dessert-cafe", "icecream-bingsu", "self-serve-cafe", "pet-cafe"]
      .includes(body.subIndustryId ?? "");
  // 사진형 템플릿 — 카페·음식점 계열 특화 (1장 사진+타이틀 / 2장~ 사진+한 줄 / 마지막 로고)
  const styleVariant: "photo" | "text" = isCafeLike || body.industryCategoryId === "food" ? "photo" : "text";
  const subGroup = resolveTrendGroup(body.subIndustryId ?? null);
  const groupLabel = subGroup ? (ko ? TREND_GROUP_LABELS[subGroup].ko : TREND_GROUP_LABELS[subGroup].en) : null;
  const label = body.subIndustryLabel?.trim() || groupLabel || (body.industryCategoryId ?? (ko ? "소상공인" : "small business"));
  const topic = body.topic?.trim().slice(0, 120) || (ko ? `${label} 사장님이 알려주는 꿀팁` : `Tips from a ${label} owner`);

  const system = ko
    ? `당신은 한국 소상공인 인스타그램 카드뉴스 전문 카피라이터입니다.
저장하고 싶은 정보형 카드뉴스(캐러셀)를 만듭니다. 팔로워가 아니라 '동네 잠재 고객'이 대상입니다.

🚨 제작 원칙 (반드시 지킬 것):
1. 표지(1장): 타이틀 15자 이내, 스크롤을 멈추게 하는 후킹. 부제 1~2줄로 "왜 봐야 하는지".
   숫자·질문·반전이 강함 (예: "국밥집 사장만 아는 3가지", "이거 모르면 손해").
2. 한 장 = 한 메시지. 본문 각 장: 제목 15자 이내 + 본문 2~3줄, 줄당 22자 이내. 글이 많으면 안 읽힘.
3. 2번째 장도 독립 후킹 — 표지 없이 봐도 궁금하게.
4. 마지막 장(CTA): 저장·팔로우·방문을 자연스럽게 유도 + 가게명 언급.
5. 어투: 사장님이 직접 말하는 친근한 존댓말. 과장·허위 금지, 이모지는 장당 최대 1개.
6. highlight 는 title 안에 실제로 포함된 단어만.
7. 🚨 이 가게의 실데이터만 사용: 메뉴명·가격·동네는 [가게] 블록에 제공된 것만 언급.
   제공되지 않은 메뉴명·가격·리뷰·수상 이력을 지어내지 말 것. 메뉴 데이터가 없으면
   메뉴명 없이 업종 일반 꿀팁으로. 오픈 준비 중이면 "곧 오픈" 예고 톤으로.
캡션: 2~3문장(첫 문장이 후킹) + 저장 유도 한 줄. 해시태그: 지역/업종/주제 조합 7~9개(한국어, 지역이 있으면 동네 해시태그 2개 포함).
각 카드의 photoIdea: 이 장과 함께 올릴 사진을 사장님이 폰으로 바로 찍을 수 있게 한 문장으로 지시 (예: "창가 자리에서 매장 전경, 오후 자연광").${styleVariant === "photo" ? `

📐 사진형 캐러셀 구조 (카페·음식점 잘되는 계정 공식 — 이 구조로만 생성):
- 1장(cover): 사진 위에 얹을 짧은 타이틀(가게명 또는 주제, 12자 이내) + 부제 1줄. photoIdea 필수(대표 컷).
- 2장~(body): **사진이 주인공** — title 은 6자 이내 짧은 라벨(메뉴명·키워드), lines 는 사진 아래 띠에 들어갈 한 줄(20자 이내) 딱 1개. photoIdea 필수·구체적으로(각 장 다른 컷).
- 마지막 장(cta): 로고 마무리 장 — title 은 가게명 그대로, lines 는 마무리 인사·방문 유도 1줄.` : ""}${isCafeLike ? `

📷 카페 인스타 운영 공식 (잘되는 카페들의 실제 패턴 — 반드시 반영):
- 사진이 주인공, 글은 설명. 카드뉴스도 사진과 번갈아 올리는 전제로 만든다.
- photoIdea 는 이 3종 위주로 구체적으로: ① 가게 풍경(외관·창가·인테리어 무드) ② 신메뉴/시그니처 클로즈업(김·크림 등 디테일) ③ 손님이 앉아 즐기는 모습(얼굴 비식별, 뒷모습·손).
- 캡션은 메뉴 설명·이번 달 이벤트 안내 톤 — 감성 한 줄 + 메뉴/이벤트 정보 + 위치·영업시간 자리.
- CTA 장은 "이번 달 이벤트·신메뉴는 프로필 링크/방문으로" 흐름.` : ""}`
    : `You are a Korean SMB Instagram carousel copywriter. Make save-worthy informational card news.
Cover: hook title ≤15 chars + why-watch subtitle. One message per card, body 2-3 lines (≤22 chars/line).
Slide 2 must hook independently. Last card = CTA (save/follow/visit + store name). No hype or false claims.`;

  // ── 가게 실데이터 블록 — 있는 것만 넣는다 (없는 항목은 프롬프트에서 생략 → 위조 여지 차단) ──
  const menu: Array<{ name: string; priceWon?: number }> = Array.isArray(body.menuItems)
    ? body.menuItems
        .map((m) => ({ name: str(m?.name, 40), priceWon: typeof m?.priceWon === "number" && m.priceWon > 0 ? Math.round(m.priceWon) : undefined }))
        .filter((m) => !!m.name)
        .map((m) => ({ name: m.name as string, priceWon: m.priceWon }))
        .slice(0, 6)
    : [];
  const region = str(body.region, 40);
  const avgTicket = typeof body.avgTicketWon === "number" && body.avgTicketWon > 0 ? Math.round(body.avgTicketWon) : null;
  const storeFacts = [
    `- 상호: ${storeName}`,
    `- 업종: ${label}`,
    region ? `- 동네: ${region}` : null,
    `- 상태: ${body.isOperating === false ? "오픈 준비 중" : "운영 중"}`,
    menu.length > 0
      ? `- 대표 메뉴: ${menu.map((m) => m.priceWon ? `${m.name}(${m.priceWon.toLocaleString()}원)` : m.name).join(", ")}`
      : null,
    avgTicket ? `- 평균 객단가: 약 ${avgTicket.toLocaleString()}원` : null,
  ].filter(Boolean).join("\n");

  const user = ko
    ? `[가게]
${storeFacts}
[주제] ${topic}
[장수] 정확히 ${cardCount}장 (표지 1 + 본문 ${cardCount - 2} + CTA 1)
카드 내용은 위 [가게] 실데이터를 적극 활용해 "이 가게 이야기"로 만드세요 (없는 정보는 지어내지 말 것).

반드시 아래 JSON 으로만 응답 (코드블록·설명 없이):
{
  "cards": [
    { "role": "cover", "title": "15자 이내 후킹 타이틀", "lines": ["부제 1줄", "부제 2줄(선택)"], "highlight": "강조단어", "photoIdea": "함께 올릴 사진 촬영 지시 1문장" },
    { "role": "body", "title": "소제목", "lines": ["본문 1줄", "본문 2줄", "본문 3줄(선택)"], "photoIdea": "..." },
    { "role": "cta", "title": "행동 유도 제목", "lines": ["저장·방문 유도 1~2줄"], "photoIdea": "..." }
  ],
  "caption": "인스타 캡션 2~3문장 + 저장 유도",
  "hashtags": ["#해시태그", "..."]
}`
    : `[STORE] ${storeName} / ${label}\n[TOPIC] ${topic}\n[CARDS] exactly ${cardCount}\nRespond ONLY with JSON: {"cards":[{"role":"cover|body|cta","title":"...","lines":["..."],"highlight":"..."}],"caption":"...","hashtags":["#..."]}`;

  try {
    const client = new OpenAI({ apiKey, timeout: 35_000 });
    const r = await client.chat.completions.create({
      // 2026-07-27 gpt-5.6-luna 전환 — 인터랙티브(사장님이 기다림)라 최속 티어 + effort none (실측 ~2s).
      //  5.6 계열은 temperature 미지원(400) — 제거(기본 1.0 거동이 창의 작업에 무방).
      model: "gpt-5.6-luna",
      reasoning_effort: "none",
      max_completion_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    console.info("[ai-cost] cardnews", JSON.stringify({ model: "gpt-5.6-luna", in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens }));
    const content = r.choices[0]?.message?.content ?? "{}";
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // 1차 폴백: 코드블록/설명 섞임 → 첫 { ~ 마지막 } 추출 (LLM robust 파싱 규율)
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { parsed = null; }
      }
    }
    const result = sanitize(parsed, topic, styleVariant);
    if (!result) {
      // graceful empty — UI 는 재시도 안내 (500 throw 금지 규율)
      return NextResponse.json({ topic, cards: [], caption: "", hashtags: [], styleVariant } satisfies CardNewsResult, { status: 200 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[cardnews] generation failed", e);
    return NextResponse.json({ topic, cards: [], caption: "", hashtags: [], styleVariant } satisfies CardNewsResult, { status: 200 });
  }
}
