"use client";

import { useMemo } from "react";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";

type Props = {
  ko: boolean;
  industryCategoryId: string;
};

/**
 * Daily Improvement — Bezos "Day 1" 철학.
 *
 * 매일 바뀌는 작은 개선 제안 1가지.
 * "오늘 한 가지만 개선해도 1년이면 365개" 컨셉.
 *
 * 구현:
 * - 업종별 정적 배열 (AI 호출 없이 비용 0)
 * - 날짜 기반 인덱스 → 매일 다른 제안
 * - 12개 기본 (업종 공통) + 업종별 추가
 *
 * 위치: 대시보드 뒤쪽 (핵심 지표 이후), 작게.
 */
export function DailyImprovementCard({ ko, industryCategoryId }: Props) {
  const suggestion = useMemo(() => pickDaily(industryCategoryId, new Date()), [industryCategoryId]);

  return (
    <section
      style={{
        borderRadius: "18px",
        padding: "16px 20px",
        background: "linear-gradient(180deg, rgba(254,243,199,0.3) 0%, rgba(255,255,255,0.95) 100%)",
        border: "1px solid rgba(25,25,112,0.12)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
      className="bento-card"
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          background: "rgba(25,25,112,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Sparkles size={17} strokeWidth={1.5} color="#191970" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 650,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "#191970",
            marginBottom: "3px",
          }}
        >
          {ko ? "오늘의 작은 개선" : "Today's small improvement"}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 680,
            color: "#0f172a",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
            marginBottom: "4px",
          }}
        >
          {ko ? suggestion.titleKo : suggestion.titleEn}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "rgba(15,23,42,0.55)",
            lineHeight: 1.55,
          }}
        >
          {ko ? suggestion.detailKo : suggestion.detailEn}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "10.5px",
            color: "rgba(15,23,42,0.4)",
            fontStyle: "italic" as const,
          }}
        >
          {ko
            ? "Bezos: \"Day 1 문화 — 매일 첫날처럼 작은 개선.\""
            : "Bezos: \"Day 1 culture — small improvements, every day.\""}
        </div>
      </div>
    </section>
  );
}

// ─── 업종별 개선 제안 풀 ───

type Suggestion = {
  titleKo: string;
  titleEn: string;
  detailKo: string;
  detailEn: string;
};

// 공통 (모든 업종)
const COMMON: Suggestion[] = [
  {
    titleKo: "네이버 플레이스 리뷰 1건 답변",
    titleEn: "Reply to 1 Naver Place review",
    detailKo: "최근 리뷰 중 답변 없는 것 하나. 3줄이면 충분해요. 검색 노출도 올라갑니다.",
    detailEn: "Pick one recent review without a reply. Three lines is enough — also boosts search visibility.",
  },
  {
    titleKo: "단골 고객 1명에게 감사 메시지",
    titleEn: "Send a thank-you to one regular",
    detailKo: "평소 자주 오는 고객 한 분. 카톡으로 '요즘 어떠세요' 한 마디가 재방문을 만듭니다.",
    detailEn: "One frequent customer. A brief 'how have you been?' on KakaoTalk drives return visits.",
  },
  {
    titleKo: "경쟁사 가격·메뉴 1곳 확인",
    titleEn: "Check one competitor's pricing",
    detailKo: "가장 가까운 경쟁 매장 하나의 최근 변화를 확인. 가격, 신메뉴, 프로모션 3분이면 파악돼요.",
    detailEn: "Check the nearest competitor's recent changes — prices, new items, promos. 3 minutes.",
  },
  {
    titleKo: "재고·비품 1개 소진 점검",
    titleEn: "Check one stock item you're running low on",
    detailKo: "'어제 부족했던 게 뭐였지?' 하나만 떠올려보세요. 재발 방지가 가장 큰 개선이에요.",
    detailEn: "Think of one thing you ran short on yesterday. Preventing repeats is the biggest win.",
  },
  {
    titleKo: "지출 1건 재협상 가능성 검토",
    titleEn: "Review one recurring expense",
    detailKo: "임대료·공급처·구독 중 하나. 3% 재협상만 성공해도 연간 수십만원 절감됩니다.",
    detailEn: "Rent, supplier, or subscription — one. Even 3% renegotiated saves hundreds of thousands/year.",
  },
  {
    titleKo: "직원 1명과 1분 안부",
    titleEn: "1-minute check-in with one staff",
    detailKo: "업무 얘기 말고 개인적인 안부. 이직 방지의 가장 확실한 방법은 유대감이에요.",
    detailEn: "Not work talk — personal. Bonds are the best retention tool.",
  },
  {
    titleKo: "인스타 피드 1장 관리",
    titleEn: "Curate 1 Instagram post",
    detailKo: "오래된 포스트 정리 or 오늘 사진 1장 추가. 피드 첫 9장이 매장 첫인상입니다.",
    detailEn: "Clean old posts or add today's photo. First 9 posts = first impression.",
  },
  {
    titleKo: "세무 영수증 1건 정리",
    titleEn: "File one tax receipt",
    detailKo: "미루면 월말이 지옥. 오늘 하나라도 캐시노트·엑셀에 기록해두세요.",
    detailEn: "Delay = month-end hell. Log one into CashNote/Excel today.",
  },
  {
    titleKo: "가장 수익 낮은 메뉴·상품 1개 재검토",
    titleEn: "Review your lowest-margin item",
    detailKo: "원가율 가장 높은 것 하나. 가격 올리거나, 레시피 개선하거나, 빼거나 — 결정은 오늘.",
    detailEn: "Highest cost ratio one — raise price, improve recipe, or remove. Decide today.",
  },
  {
    titleKo: "오늘 감정 1줄 기록",
    titleEn: "Log your mood in 1 line",
    detailKo: "사장님 멘탈이 가게 분위기. 오늘 기분을 메모장에 한 줄 남겨보세요. 번아웃 조기 감지.",
    detailEn: "Your mood sets the tone. One line in notes — early burnout detection.",
  },
  {
    titleKo: "주변 500m 내 신규 매장 확인",
    titleEn: "Scout new businesses within 500m",
    detailKo: "새로 생긴 가게·폐점 가게 — 상권 온도 파악의 핵심 신호.",
    detailEn: "New openings or closures — key signal of neighborhood temperature.",
  },
  {
    titleKo: "POS·계산 프로세스 1개 개선",
    titleEn: "Improve one POS/checkout step",
    detailKo: "자주 쓰는 버튼 위치·자주 묻는 옵션 단축키. 1초 단축이 1년이면 수백 시간.",
    detailEn: "Button placement or shortcut for a common option. 1 second × year = hundreds of hours.",
  },
];

// 업종별 추가
const BY_INDUSTRY: Record<string, Suggestion[]> = {
  food: [
    {
      titleKo: "인기 메뉴 1개 원가 재계산",
      titleEn: "Recalculate top-seller's cost",
      detailKo: "재료비가 올랐는데 판매가는 그대로였나요? 마진 재점검.",
      detailEn: "Material prices up but price static? Recheck margin.",
    },
    {
      titleKo: "피크타임 주문 리듬 관찰 10분",
      titleEn: "10-min peak-hour observation",
      detailKo: "어디서 병목이 생기는지 직접 보세요. 일하면서 놓친 패턴이 보입니다.",
      detailEn: "Watch where bottlenecks happen. Patterns invisible while working.",
    },
  ],
  "cafe-dessert": [
    {
      titleKo: "원두·시럽 유통기한 점검",
      titleEn: "Check bean/syrup expiry",
      detailKo: "품질이 미묘하게 떨어지는 이유가 여기 있을 수 있어요.",
      detailEn: "Subtle quality drops often hide here.",
    },
  ],
  retail: [
    {
      titleKo: "가장 안 팔리는 상품 진열 위치 바꾸기",
      titleEn: "Reposition slowest seller",
      detailKo: "재고가 돌아야 현금이 돌아요. 위치 바꾸면 주간 매출 +5%도.",
      detailEn: "Stock must move for cash to flow. Even a position change adds 5%/week.",
    },
  ],
  beauty: [
    {
      titleKo: "예약 노쇼 대응 정책 1가지 정비",
      titleEn: "Tune one no-show policy",
      detailKo: "노쇼 손실이 월 수십만원이 될 수 있어요. 예약금·SMS 리마인드.",
      detailEn: "No-show losses add up — deposits or SMS reminders.",
    },
  ],
  "startup-tech": [
    {
      titleKo: "가장 활성 고객 1명과 10분 통화",
      titleEn: "10-min call with your most active user",
      detailKo: "데이터가 못 보여주는 인사이트. 매주 하세요.",
      detailEn: "Insights data can't show — do this weekly.",
    },
    {
      titleKo: "지난 주 가장 많이 쓰인 기능 확인",
      titleEn: "Check top-used feature last week",
      detailKo: "의도한 대로 쓰이는가? 아니라면 포지셔닝을 돌릴 때.",
      detailEn: "Used as intended? If not, repositioning time.",
    },
  ],
};

function pickDaily(industryCategoryId: string, now: Date): Suggestion {
  const pool = [...COMMON, ...(BY_INDUSTRY[industryCategoryId] ?? [])];
  if (pool.length === 0) return COMMON[0];
  // 연중 일수 기반 인덱스 (365/year → 매일 다른 항목)
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const idx = dayOfYear % pool.length;
  return pool[idx];
}
