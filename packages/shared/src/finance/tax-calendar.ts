// ─── 세금 캘린더 ─────────────────────────────────────────────────────────────
// 한국 자영업자/소상공인의 주요 세금·신고 일정을 관리합니다.
//
// UX 원칙:
// - 사용자에게는 "가장 가까운 할 일 1개"만 크게 보여줍니다.
// - 나머지는 접힌 목록으로, 필요할 때만 펼칩니다.
// - 각 항목은 제목 + 한 줄 설명 + 마감까지 남은 일수로 충분합니다.

// ─── 타입 ────────────────────────────────────────────────────────────────────

export type TaxEventCategory = "vat" | "income_tax" | "withholding" | "local_tax" | "insurance" | "bookkeeping";

export type TaxEvent = {
  id: string;
  category: TaxEventCategory;
  title: string;
  description: string;           // 한 줄 설명
  month: number;                 // 해당 월 (1~12)
  day: number;                   // 마감일
  recurring: "monthly" | "quarterly" | "semi_annual" | "annual";
  /** 간이과세자에게도 해당되는지 */
  appliesToSimplified: boolean;
  /** 직원이 있는 사업장만 해당되는지 */
  requiresEmployees: boolean;
  /** 준비해야 할 서류 (짧게) */
  prepItems?: string[];
};

/** 사용자에게 보여줄 개인화된 일정 항목 */
export type PersonalizedTaxItem = {
  event: TaxEvent;
  dueDate: Date;
  daysUntil: number;
  urgency: "overdue" | "urgent" | "soon" | "upcoming" | "distant";
  /** 요약 한 줄 (예: "부가세 확정신고 — 13일 남음") */
  summary: string;
};

export type TaxCalendarSurface = {
  /** 가장 가까운 할 일 1개 (메인 카드에 표시) */
  next: PersonalizedTaxItem | null;
  /** 30일 이내 일정 (접힌 목록) */
  upcoming: PersonalizedTaxItem[];
  /** 이후 일정 (더보기) */
  later: PersonalizedTaxItem[];
};

// ─── 세금 일정 정의 ─────────────────────────────────────────────────────────
// 한국 국세청 기준 주요 세금 신고·납부 일정

export const TAX_EVENTS: TaxEvent[] = [
  // ── 부가가치세 ──
  {
    id: "vat-q1-confirm",
    category: "vat",
    title: "부가세 확정신고 (1기)",
    description: "1~6월 매출·매입에 대한 부가가치세 확정 신고 및 납부",
    month: 7, day: 25,
    recurring: "semi_annual",
    appliesToSimplified: false,
    requiresEmployees: false,
    prepItems: ["세금계산서 합계표", "매출·매입 장부", "신용카드 매출전표"],
  },
  {
    id: "vat-q2-confirm",
    category: "vat",
    title: "부가세 확정신고 (2기)",
    description: "7~12월 매출·매입에 대한 부가가치세 확정 신고 및 납부",
    month: 1, day: 25,
    recurring: "semi_annual",
    appliesToSimplified: false,
    requiresEmployees: false,
    prepItems: ["세금계산서 합계표", "매출·매입 장부", "신용카드 매출전표"],
  },
  {
    id: "vat-q1-preliminary",
    category: "vat",
    title: "부가세 예정신고 (1기)",
    description: "1~3월분 부가가치세 예정 신고 (소규모는 고지 납부)",
    month: 4, day: 25,
    recurring: "quarterly",
    appliesToSimplified: false,
    requiresEmployees: false,
  },
  {
    id: "vat-q2-preliminary",
    category: "vat",
    title: "부가세 예정신고 (2기)",
    description: "7~9월분 부가가치세 예정 신고 (소규모는 고지 납부)",
    month: 10, day: 25,
    recurring: "quarterly",
    appliesToSimplified: false,
    requiresEmployees: false,
  },
  {
    id: "vat-simplified",
    category: "vat",
    title: "간이과세자 부가세 신고",
    description: "전년도 매출에 대한 부가가치세 신고 및 납부 (연 1회)",
    month: 1, day: 25,
    recurring: "annual",
    appliesToSimplified: true,
    requiresEmployees: false,
    prepItems: ["매출 장부", "신용카드 매출전표"],
  },

  // ── 종합소득세 ──
  {
    id: "income-tax-annual",
    category: "income_tax",
    title: "종합소득세 신고",
    description: "전년도 사업소득에 대한 종합소득세 확정 신고 및 납부",
    month: 5, day: 31,
    recurring: "annual",
    appliesToSimplified: true,
    requiresEmployees: false,
    prepItems: ["손익계산서", "재무상태표 (복식부기 시)", "소득공제 증빙"],
  },
  {
    id: "income-tax-prepayment",
    category: "income_tax",
    title: "종합소득세 중간예납",
    description: "올해 소득세의 1/2을 미리 납부 (고지서 기반)",
    month: 11, day: 30,
    recurring: "annual",
    appliesToSimplified: true,
    requiresEmployees: false,
  },

  // ── 원천세 (직원 있는 경우) ──
  {
    id: "withholding-monthly",
    category: "withholding",
    title: "원천세 신고·납부",
    description: "직원 급여에서 원천징수한 소득세·지방소득세 납부",
    month: 0, day: 10, // 매월 10일 (month=0은 매월 반복 표시용)
    recurring: "monthly",
    appliesToSimplified: true,
    requiresEmployees: true,
  },
  {
    id: "withholding-semi",
    category: "withholding",
    title: "원천세 반기 납부 (선택 시)",
    description: "소규모 사업자: 반기별 원천세 일괄 납부 (1~6월분 → 7/10, 7~12월분 → 1/10)",
    month: 7, day: 10,
    recurring: "semi_annual",
    appliesToSimplified: true,
    requiresEmployees: true,
  },

  // ── 지방세 ──
  {
    id: "local-income-tax",
    category: "local_tax",
    title: "지방소득세 신고",
    description: "종합소득세와 함께 지방소득세도 별도 신고 (위택스)",
    month: 5, day: 31,
    recurring: "annual",
    appliesToSimplified: true,
    requiresEmployees: false,
  },

  // ── 4대 보험 ──
  {
    id: "insurance-monthly",
    category: "insurance",
    title: "4대 보험료 납부",
    description: "국민연금·건강보험·고용보험·산재보험 월 납부",
    month: 0, day: 10, // 매월 10일
    recurring: "monthly",
    appliesToSimplified: true,
    requiresEmployees: true,
  },

  // ── 장부 정리 ──
  {
    id: "bookkeeping-monthly",
    category: "bookkeeping",
    title: "월 마감 장부 정리",
    description: "이번 달 매출·매입·경비 장부를 정리하고 다음 달 준비",
    month: 0, day: 5, // 매월 5일까지
    recurring: "monthly",
    appliesToSimplified: true,
    requiresEmployees: false,
    prepItems: ["매출 기록", "경비 영수증", "카드 내역"],
  },
];

// ─── 개인화 캘린더 생성 ─────────────────────────────────────────────────────

export type TaxCalendarInput = {
  /** 간이과세자 여부 */
  isSimplified: boolean;
  /** 직원 유무 */
  hasEmployees: boolean;
  /** 기준 날짜 (기본: 오늘) */
  baseDate?: Date;
};

/** 사용자 조건에 맞는 세금 일정을 필터링하고 날짜순으로 정렬합니다 */
export function buildTaxCalendar(input: TaxCalendarInput): TaxCalendarSurface {
  const today = input.baseDate ?? new Date();
  const year = today.getFullYear();

  // 1. 사용자에게 해당되는 이벤트만 필터
  const relevant = TAX_EVENTS.filter((ev) => {
    if (ev.requiresEmployees && !input.hasEmployees) return false;
    // 간이과세자는 일반 부가세 제외, 간이 부가세만 포함
    if (input.isSimplified && ev.category === "vat" && !ev.appliesToSimplified) return false;
    if (!input.isSimplified && ev.id === "vat-simplified") return false;
    return true;
  });

  // 2. 향후 12개월의 구체적 날짜를 생성
  const items: PersonalizedTaxItem[] = [];

  for (const ev of relevant) {
    const dates = getNextOccurrences(ev, today, year);
    for (const dueDate of dates) {
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 지나간 지 30일 이상은 무시
      if (daysUntil < -30) continue;
      // 12개월 이후는 무시
      if (daysUntil > 365) continue;

      const urgency = getUrgency(daysUntil);
      const summary = buildSummary(ev.title, daysUntil);

      items.push({ event: ev, dueDate, daysUntil, urgency, summary });
    }
  }

  // 3. 날짜순 정렬
  items.sort((a, b) => a.daysUntil - b.daysUntil);

  // 4. Surface 분할: next(1개) / upcoming(30일) / later
  const futureItems = items.filter((i) => i.daysUntil >= 0);
  const next = futureItems[0] ?? null;
  const upcoming = futureItems.filter((i) => i.daysUntil > 0 && i.daysUntil <= 30);
  const later = futureItems.filter((i) => i.daysUntil > 30);

  return { next, upcoming, later };
}

// ─── 카테고리 라벨/색상 ─────────────────────────────────────────────────────

export function getTaxCategoryLabel(cat: TaxEventCategory, lang: "ko" | "en" = "ko"): string {
  const labels: Record<TaxEventCategory, { ko: string; en: string }> = {
    vat: { ko: "부가가치세", en: "VAT" },
    income_tax: { ko: "종합소득세", en: "Income Tax" },
    withholding: { ko: "원천세", en: "Withholding Tax" },
    local_tax: { ko: "지방소득세", en: "Local Tax" },
    insurance: { ko: "4대 보험", en: "Insurance" },
    bookkeeping: { ko: "장부 정리", en: "Bookkeeping" },
  };
  return labels[cat][lang];
}

export function getTaxCategoryColor(cat: TaxEventCategory): string {
  const colors: Record<TaxEventCategory, string> = {
    vat: "#007aff",
    income_tax: "#ff9500",
    withholding: "#5856d6",
    local_tax: "#34c759",
    insurance: "#ff2d55",
    bookkeeping: "#8e8e93",
  };
  return colors[cat];
}

export function getUrgencyColor(urgency: PersonalizedTaxItem["urgency"]): string {
  switch (urgency) {
    case "overdue": return "#ff3b30";
    case "urgent": return "#ff9500";
    case "soon": return "#ffcc00";
    case "upcoming": return "#34c759";
    case "distant": return "#8e8e93";
  }
}

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────

function getNextOccurrences(ev: TaxEvent, today: Date, year: number): Date[] {
  const dates: Date[] = [];

  if (ev.month === 0) {
    // 매월 반복
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, ev.day);
      dates.push(d);
      // 내년 것도 일부 포함
      if (m < today.getMonth()) {
        dates.push(new Date(year + 1, m, ev.day));
      }
    }
  } else {
    // 특정 월
    dates.push(new Date(year, ev.month - 1, ev.day));
    dates.push(new Date(year + 1, ev.month - 1, ev.day));
  }

  return dates;
}

function getUrgency(daysUntil: number): PersonalizedTaxItem["urgency"] {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "urgent";
  if (daysUntil <= 14) return "soon";
  if (daysUntil <= 30) return "upcoming";
  return "distant";
}

function buildSummary(title: string, daysUntil: number): string {
  if (daysUntil < 0) return `${title} — ${Math.abs(daysUntil)}일 지남`;
  if (daysUntil === 0) return `${title} — 오늘 마감`;
  if (daysUntil === 1) return `${title} — 내일 마감`;
  return `${title} — ${daysUntil}일 남음`;
}
