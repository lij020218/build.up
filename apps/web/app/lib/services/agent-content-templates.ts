/**
 * Agent 콘텐츠 로컬 템플릿.
 *
 * 목적:
 * - Reorder/Review Agent: API 호출 없이 즉시 완성
 * - Coupon/Content Agent: AI 실패 시 fallback
 * - 비용 절감 (하루 호출량의 50%를 로컬로 처리)
 */

import type {
  CouponContent,
  ReorderContent,
  ContentContent,
  ReviewContent,
  AgentProposal,
} from "../stores/agents-store";

// ─── Coupon (AI 실패 시 fallback) ───

export function couponFallback(prefilled: Partial<CouponContent>): CouponContent {
  const discountValue = prefilled.discountValue ?? 20;
  const code = prefilled.couponCode ?? `SAVE${discountValue}`;
  const validDays = prefilled.validDays ?? 7;

  return {
    couponCode: code,
    discountType: prefilled.discountType ?? "percent",
    discountValue,
    suggestedUsageLimit: prefilled.suggestedUsageLimit ?? 100,
    validDays,
    copyKo: `🎉 고객님께만 드리는 ${discountValue}% 할인 쿠폰!\n\n• 쿠폰 코드: ${code}\n• 유효기간: ${validDays}일 이내\n• 매장 방문 또는 주문 시 사용 가능\n\n많은 이용 부탁드려요 💚`,
    copyEn: `🎉 Exclusive ${discountValue}% off for you!\n\n• Coupon: ${code}\n• Valid for ${validDays} days\n• Use on visit or order\n\nThank you for your support 💚`,
  };
}

// ─── Reorder (로컬 템플릿) ───

export function reorderTemplate(prefilled: Partial<ReorderContent>): ReorderContent {
  const itemName = prefilled.itemName ?? "";
  const recommendedQty = prefilled.recommendedQuantity ?? 0;
  const daysUntilStockout = prefilled.daysUntilStockout ?? 0;
  const unit = inferUnitFromItemName(itemName);

  const messageKo = `안녕하세요, [상호명]입니다.

${itemName} ${recommendedQty}${unit} 주문 부탁드립니다.
현재 재고가 약 ${daysUntilStockout}일분 남아있어서 급한 주문이에요.

배송 가능 날짜 회신 부탁드립니다.
감사합니다.`;

  const messageEn = `Hello, this is [Business Name].

Could you send ${recommendedQty} ${unit} of ${itemName}?
We have only ${daysUntilStockout} days of stock left.

Please confirm delivery date. Thank you.`;

  return {
    itemId: prefilled.itemId ?? "",
    itemName,
    currentQuantity: prefilled.currentQuantity ?? 0,
    recommendedQuantity: recommendedQty,
    daysUntilStockout,
    supplierName: prefilled.supplierName ?? "",
    supplierUrl: prefilled.supplierUrl,
    messageKo,
    messageEn,
  };
}

function inferUnitFromItemName(name: string): string {
  // 간단한 한글 단위 추측 (정확도 완벽할 필요 없음, 사용자가 수정 가능)
  const lower = name.toLowerCase();
  if (/계란|egg/i.test(lower)) return "판";
  if (/우유|milk/i.test(lower)) return "L";
  if (/원두|bean|coffee/i.test(lower)) return "kg";
  if (/빵|bread/i.test(lower)) return "개";
  if (/포장지|봉투|bag/i.test(lower)) return "장";
  if (/cup|컵/i.test(lower)) return "개";
  return "개";
}

// ─── Content (AI 실패 시 fallback) ───

export function contentFallback(
  occasion: string,
  industryCategoryId: string
): ContentContent {
  const templates: Record<string, { ko: string; en: string; hashtags: string[] }> = {
    "sales-record": {
      ko: `어제는 정말 특별한 하루였어요 ✨\n많은 분들이 찾아주셔서 감사드려요.\n앞으로도 정성껏 준비할게요 🙏\n\n#${getIndustryHashtag(industryCategoryId, "ko")} #감사 #동네맛집 #오늘도영업합니다`,
      en: `Yesterday was truly special ✨\nThank you to everyone who came by.\nWe'll keep working hard for you 🙏\n\n#smallbusiness #thankyou`,
      hashtags: ["#감사", "#오늘도영업합니다", "#단골님들", getIndustryHashtag(industryCategoryId, "tag")],
    },
    "weekend-boost": {
      ko: `이번 주말도 많은 분들 덕분에 행복했어요 💚\n또 뵈어요 :)\n\n#주말감성 #${getIndustryHashtag(industryCategoryId, "ko")} #동네`,
      en: `Thank you for a wonderful weekend 💚\nSee you again soon :)\n\n#weekendvibes #smallbusiness`,
      hashtags: ["#주말감성", "#단골", "#감사합니다", getIndustryHashtag(industryCategoryId, "tag")],
    },
    default: {
      ko: `오늘도 문 열었어요 💫\n들러주세요!\n\n#${getIndustryHashtag(industryCategoryId, "ko")} #동네 #오늘도영업합니다`,
      en: `We're open today 💫\nCome visit!\n\n#smallbusiness #openforbusiness`,
      hashtags: ["#오늘도영업합니다", getIndustryHashtag(industryCategoryId, "tag")],
    },
  };

  const template = templates[occasion] ?? templates.default;

  return {
    occasion,
    postDraftKo: template.ko,
    postDraftEn: template.en,
    hashtags: template.hashtags,
    format: "post",
  };
}

function getIndustryHashtag(industryCategoryId: string, kind: "ko" | "tag"): string {
  const map: Record<string, { ko: string; tag: string }> = {
    food: { ko: "맛집", tag: "#맛집" },
    "cafe-dessert": { ko: "카페", tag: "#카페스타그램" },
    retail: { ko: "상점", tag: "#소상공인" },
    beauty: { ko: "뷰티", tag: "#뷰티" },
    pet: { ko: "반려동물", tag: "#반려동물" },
    fitness: { ko: "운동", tag: "#운동스타그램" },
    education: { ko: "교육", tag: "#학원" },
    "online-digital": { ko: "온라인", tag: "#온라인쇼핑" },
    "startup-tech": { ko: "스타트업", tag: "#스타트업" },
  };
  const entry = map[industryCategoryId] ?? { ko: "가게", tag: "#소상공인" };
  return kind === "ko" ? entry.ko : entry.tag;
}

// ─── Review (로컬 템플릿) ───

export function reviewTemplate(prefilled: Partial<ReviewContent>): ReviewContent {
  const messageKo = `안녕하세요 ☺️
어제 방문해주셔서 감사드려요!

혹시 잠깐 시간 되시면,
네이버 플레이스에 방문 후기 한 줄 남겨주실 수 있을까요?

짧게라도 많은 도움이 됩니다 🙏
[리뷰 링크]

감사합니다!`;

  const messageEn = `Hello ☺️
Thank you for visiting yesterday!

If you have a moment, would you mind leaving a short review on Naver Place?

Even a brief one means a lot 🙏
[Review Link]

Thank you!`;

  return {
    estimatedCardVisitors: prefilled.estimatedCardVisitors ?? 0,
    reviewPlatform: prefilled.reviewPlatform ?? "naver-place",
    placeholderUrl: prefilled.placeholderUrl ?? "https://map.naver.com/",
    messageKo,
    messageEn,
  };
}

// ─── Main entry: fill any prefilled candidate ───

export function fillLocalTemplate(
  kind: "coupon" | "reorder" | "content" | "review",
  prefilled: Record<string, unknown>,
  context: { industryCategoryId: string }
): AgentProposal["content"] {
  switch (kind) {
    case "coupon":
      return { kind: "coupon", ...couponFallback(prefilled as Partial<CouponContent>) };
    case "reorder":
      return { kind: "reorder", ...reorderTemplate(prefilled as Partial<ReorderContent>) };
    case "content": {
      const occasion = (prefilled.occasion as string) ?? "default";
      return { kind: "content", ...contentFallback(occasion, context.industryCategoryId) };
    }
    case "review":
      return { kind: "review", ...reviewTemplate(prefilled as Partial<ReviewContent>) };
  }
}
