/**
 * 운영자 화면 공용 라벨 (2026-08-01).
 *  UsagePanel 과 ActivityPanel 이 같은 슬러그를 다르게 부르면 운영자가 다른 기능으로 읽는다.
 *  ⚠️ SURFACE_LABELS 키는 record_surface_visit RPC 의 화이트리스트와 동기 —
 *     화면(탭)을 추가하면 마이그레이션·타입·여기 세 곳을 함께 고칠 것.
 */

export const SURFACE_LABELS: Record<string, string> = {
  home: "홈",
  current: "현재 단계",
  roadmap: "로드맵",
  guides: "가이드",
  franchise: "프랜차이즈",
  profile: "내 정보",
  analytics: "내 가게",
  marketing: "마케팅",
  reports: "보고서",
  finance: "재무",
  team: "직원",
  tax: "세금",
  offerings: "메뉴·재고 (오퍼링)",
};

export const AI_FEATURE_LABELS: Record<string, string> = {
  "quick-query": "AI 채팅",
  "marketing-cases": "마케팅 사례·미션",
  "marketing-cardnews": "카드뉴스 스튜디오",
  "marketing-coach": "마케팅 코치",
  "marketing-trends": "마케팅 트렌드",
  "insights-industry-daily": "업종 데일리 코칭",
  "contract-analyze": "계약서 분석",
  "health-diagnose": "사업 건강 진단",
  "finance-interpret": "재무 해석",
  "report-insight": "리포트 인사이트",
  "market-narrative": "시장 분석 내러티브",
  "business-plan-generate": "사업계획서 생성",
  "roadmap-generate": "로드맵 생성",
  "funding-score": "펀딩 점수",
  "programs-match": "지원사업 매칭",
  "stage-brief": "단계 브리핑",
  "dashboard-actions": "대시보드 코칭",
};

export const surfaceLabel = (slug: string): string => SURFACE_LABELS[slug] ?? slug;
export const aiFeatureLabel = (slug: string): string => AI_FEATURE_LABELS[slug] ?? slug;

/** "2026-08-03" → "8월 3일 (월)". 잘못된 값은 원문 그대로 (없는 날짜를 만들지 않는다) */
export function formatKoreanDay(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return ymd;
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${Number(m[2])}월 ${Number(m[3])}일 (${week})`;
}

/** 오늘(KST) 기준 상대 표기 — "오늘 / 어제 / N일 전". 미래·비정상은 null */
export function relativeDayLabel(ymd: string, now: Date = new Date()): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const diff = Math.round((today - target) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}
