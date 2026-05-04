"use client";

import { useState, useEffect } from "react";
import { Users, ClipboardList, MessageSquare, Sparkles, ExternalLink, ChevronRight, Check } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { useRoadmapStore } from "../../../stores";
import { AIFeedbackFormGenerator } from "./AIFeedbackFormGenerator";
import {
  getVisibleDayIds,
  getVisibleFeedbackIds,
  getVisibleFinalIds,
  getVisibleImprovementIds,
} from "./pre-launch-checks-meta";
import {
  KeyActionHero,
  StageTabNav,
  StageOverview,
  WorkStep,
} from "../shared/StageActionHero";

const MIDNIGHT = "#191970";

/**
 * PreLaunchStage — ContractReviewStage / HiringSetupStage 와 동일한 흐름 패턴.
 *
 * 6 페이지: 개요 → 1.손님초대 → 2.당일운영 → 3.피드백 → 4.본오픈준비 → 체크리스트
 *
 * 사용자 피드백 (2026-05-04): 모든 단계 같은 패턴으로 통일.
 *   기존 PreLaunchStage 의 912줄 inline 데이터 → 압축 + 페이지로 분리.
 *   AIFeedbackFormGenerator·체크 ID 시스템은 그대로 유지 (룰 100% 적용 호환).
 */
export function PreLaunchStage() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    selectedIndustryId,
    startupType,
    storeName,
    softOpenChecks,
    setSoftOpenChecks,
    softOpenPricing,
    setSoftOpenPricing,
    softOpenSkips,
  } = d;
  // setSoftOpenSkips 는 보존 룰 호환 — 사용 안 해도 import 유지하지 않으니 destructure 생략.
  void setSoftOpenChecks;
  const ko = language === "ko";

  const [pageIdx, setPageIdx] = useState(0);

  // 룰 검증을 위한 visible IDs — 기존 시스템 유지 (CurrentStageView 가 100% 룰 적용에 사용).
  const setPreLaunchVisibleIds = useRoadmapStore((s) => s.setPreLaunchVisibleIds);
  useEffect(() => {
    setPreLaunchVisibleIds({
      dayIds: getVisibleDayIds(industryCategoryId, selectedIndustryId, startupType ?? null),
      feedbackIds: getVisibleFeedbackIds(industryCategoryId),
      finalIds: getVisibleFinalIds(),
      improvementIds: getVisibleImprovementIds(),
    });
  }, [industryCategoryId, selectedIndustryId, startupType, setPreLaunchVisibleIds]);

  const pageLabels = ko
    ? ["개요", "1. 손님 초대", "2. 당일 운영", "3. 피드백", "4. 본 오픈 준비", "마무리"]
    : ["Overview", "1. Guests", "2. Day-of", "3. Feedback", "4. Grand Open", "Wrap-up"];

  // ── 카테고리별 권장 ───────────────────────────────────────────
  const myAdvice: Record<string, { context: string; recommendation: string; rationale: string }> = ko ? {
    food: {
      context: "음식점 / F&B",
      recommendation: "가족·동네 주민 우선 초대 + 30~50% 할인으로 결제 흐름 검증",
      rationale: "음식 맛은 가족이 가장 솔직. 동네 주민은 잠재 단골 — 첫 인상이 재방문 결정. 할인은 결제·POS 검증 가능.",
    },
    "cafe-dessert": {
      context: "카페 / 디저트",
      recommendation: "인스타 팔로워 + 동네 주민 혼합 + 무료 시식",
      rationale: "카페는 SNS 바이럴 결정 — 인스타 인증샷 유도. 무료로 풍성한 인상 → 자발적 게시물 확보.",
    },
    beauty: {
      context: "미용·뷰티",
      recommendation: "지인 + 마이크로 인플루언서 (1,000~10,000) 무료 시술",
      rationale: "기술 매장은 시술 결과 = 매출. 비주얼 인증이 핵심 — 인플루언서 후기가 가장 빠른 신뢰.",
    },
    fitness: {
      context: "필라테스·요가·PT",
      recommendation: "지인 + 동네 주민 무료 체험 클래스",
      rationale: "운동은 직접 체험 = 등록 결정. 무료 체험으로 첫 회원 확보 → 단골 7~14일 재방문 유도.",
    },
    education: {
      context: "학원",
      recommendation: "기존 학부모 네트워크 + 무료 시범 수업",
      rationale: "학원은 입소문이 핵심. 학부모 네트워크 시범 수업 → 첫 등록자 5~10명이 1년 매출 결정.",
    },
    pet: {
      context: "펫",
      recommendation: "동네 강아지 보호자 + 30% 할인 첫 시술",
      rationale: "펫 매장은 보호자 신뢰가 매출 직결. 동네 단골 보호자 확보 → 입소문 빠름.",
    },
    "online-digital": {
      context: "온라인·디지털",
      recommendation: "친구 10명 한정 베타 + 무료 발송 시뮬",
      rationale: "온라인은 결제·포장·발송 흐름 검증이 핵심. 친구 10명에게 실제 주문 → CS·반품·발송 사이클 검증.",
    },
    "living-service": {
      context: "세탁·청소·수리",
      recommendation: "동네 주민 + 친한 지인 50% 할인 첫 의뢰",
      rationale: "방문형 = 시간 약속·품질이 단골 결정. 첫 5건이 후기 → 후기가 신규 고객 유입 결정.",
    },
    space: {
      context: "공간 임대",
      recommendation: "친구 그룹 무료 사용 + 사진·리뷰 부탁",
      rationale: "공간은 사진·리뷰가 매출. 무료 사용 → 인스타·네이버 플레이스 사진 확보 → 노출 ↑.",
    },
  } : {
    food: { context: "F&B", recommendation: "Family + neighbors, 30-50% discount", rationale: "Family give honest taste feedback; neighbors become regulars; discount validates payment flow." },
    "cafe-dessert": { context: "Cafe/Dessert", recommendation: "IG followers + neighbors, free tasting", rationale: "Cafes win on SNS — encourage shots. Free = generous impression → user-generated content." },
    beauty: { context: "Beauty", recommendation: "Friends + micro-influencers (1k-10k), free service", rationale: "Visual proof drives revenue — influencer testimonials build trust fastest." },
    fitness: { context: "Fitness/PT", recommendation: "Friends + neighbors, free trial class", rationale: "Hands-on experience drives signups — trial → 7-14 day re-visits." },
    education: { context: "Academy", recommendation: "Parent network + free demo class", rationale: "Word of mouth is everything — first 5-10 enrollees decide year's revenue." },
    pet: { context: "Pet", recommendation: "Local dog owners + 30% off first groom", rationale: "Owner trust = revenue. Word spreads fast among local pet community." },
    "online-digital": { context: "Online", recommendation: "10 friends beta + free shipping sim", rationale: "Validate checkout/packaging/CS cycle with real orders before scale." },
    "living-service": { context: "Cleaning/Repair", recommendation: "Locals + friends, 50% off first job", rationale: "First 5 jobs = reviews = new customer acquisition." },
    space: { context: "Space rental", recommendation: "Friend groups free use, ask for photos", rationale: "Photos/reviews drive listings exposure." },
  };
  const myFavorable = myAdvice[industryCategoryId] ?? myAdvice.food;

  // ── 손님 초대 4종 (page 1) ────────────────────────────────────
  const guestTypes = ko ? [
    { label: "가족 / 친한 지인", desc: "솔직한 피드백의 최고 소스 — 창피함 없이 날카롭게 말해줄 사람 우선" },
    { label: "동네 주민 / 이웃", desc: "잠재 단골 고객 — 오픈 후에도 가장 자주 올 수 있는 사람들" },
    { label: "인스타 팔로워 / 마이크로 인플루언서", desc: "SNS 바이럴 효과 — 팔로워 1,000~10,000명 수준 권장" },
    { label: "업계 지인 / 블로거", desc: "전문적 관점의 날카로운 피드백 — 개업 전 마지막 검증" },
  ] : [
    { label: "Family / close friends", desc: "Best source of honest feedback — they'll tell you straight." },
    { label: "Local neighbors", desc: "Future regulars — first impression decides repeat visits." },
    { label: "IG followers / micro-influencers", desc: "SNS virality — 1k-10k follower range recommended." },
    { label: "Industry peers / bloggers", desc: "Expert critique — last validation before grand open." },
  ];

  // ── 가격 결정 옵션 (page 1) ───────────────────────────────────
  const pricingOptions = [
    { id: "free",     label: ko ? "무료 제공" : "Free",     desc: ko ? "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보." : "Best impression. Cover cost; maximize feedback." },
    { id: "discount", label: ko ? "30–50% 할인" : "30-50% off", desc: ko ? "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대." : "Validates payment & POS; comfortable invite size." },
    { id: "full",     label: ko ? "정가 운영" : "Full price", desc: ko ? "할인·이벤트를 아껴뒀다 본오픈에 사용. 실수익 구조 그대로 테스트." : "Save discounts for grand open; test real revenue model." },
  ];

  // ── 당일 운영 체크리스트 (page 2 — 모든 매장 공통 핵심 8개) ──
  const dayChecks = ko ? [
    { id: "day-cleanliness",    label: "매장·시설 청결 & 위생 최종 점검", detail: "바닥·테이블·화장실·쓰레기통 모두 점검·소독" },
    { id: "day-staff-briefing", label: "직원 역할 배분 & 브리핑",         detail: "포지션·응대 멘트·비상 대응 방법 공유" },
    { id: "day-pos",            label: "POS & 결제 단말기 정상 작동",     detail: "카드·현금·간편결제 테스트 결제 후 즉시 취소" },
    { id: "day-ambiance",       label: "조명·음악·온도·향기 설정",         detail: "원하는 브랜드 분위기 연출, 손님 입장 전 최종 확인" },
    { id: "day-observation",    label: "운영 중 병목 & 손님 반응 관찰",   detail: "표정·대화·남기는 것·오래 머무는 곳 실시간 기록" },
    { id: "day-payment",        label: "결제 오류·지연 여부 체크",         detail: "영수증 출력, 결제 완료 문자 발송 여부 확인" },
    { id: "day-feedback-card",  label: "피드백 카드 수거 & 정리",         detail: "무기명 가능 → 솔직한 의견 유도" },
    { id: "day-debrief",        label: "직원 회의 진행",                  detail: "잘된 점 3가지 + 개선점 3가지 모두 발언하게 하기" },
  ] : [
    { id: "day-cleanliness",    label: "Final cleanliness/hygiene", detail: "Floors, tables, restrooms, trash — disinfect" },
    { id: "day-staff-briefing", label: "Staff roles & briefing",    detail: "Positions, scripts, emergency response" },
    { id: "day-pos",            label: "POS & terminal check",      detail: "Test all payments + immediate cancel" },
    { id: "day-ambiance",       label: "Lighting / music / temp",   detail: "Brand atmosphere ready before guests" },
    { id: "day-observation",    label: "Watch bottlenecks & guests",detail: "Faces, conversations, leftovers, hot spots" },
    { id: "day-payment",        label: "Payment errors / delays",   detail: "Receipts print, confirmation SMS sent" },
    { id: "day-feedback-card",  label: "Collect feedback cards",    detail: "Anonymous OK → honest opinions" },
    { id: "day-debrief",        label: "Staff debrief",             detail: "3 good points + 3 improvements per person" },
  ];
  const dayDoneCount = dayChecks.filter((c) => softOpenChecks[c.id]).length;

  // ── 본 오픈 준비 체크리스트 (page 4) ──────────────────────────
  const finalChecks = ko ? [
    { id: "final-menu-fix",    label: "메뉴·가격·옵션 최종 확정",      detail: "피드백 반영해 1~2가지 조정. 그 이상은 본 오픈 후" },
    { id: "final-staff-train", label: "직원 재교육 (피드백 기반)",     detail: "당일 발견된 동선·응대 이슈 1:1 코칭" },
    { id: "final-marketing",   label: "본 오픈 마케팅 콘텐츠 발행",    detail: "인스타 게시물 3개 + 릴스 1개 + 네이버 플레이스 영수증 리뷰 5개" },
    { id: "final-vendor",      label: "본 오픈 식자재·장비·소모품 발주", detail: "예상 인원 1.5배로 발주 — 첫 주말 결품 방지" },
    { id: "final-soft-recap",  label: "소프트 오픈 결과 1페이지 요약 작성", detail: "잘된 점·개선점·예상 이슈 — 직원·운영 자료" },
  ] : [
    { id: "final-menu-fix",    label: "Finalize menu / prices / options", detail: "Adjust 1-2 from feedback; more after grand open" },
    { id: "final-staff-train", label: "Re-train staff (from feedback)",   detail: "1:1 coach on flow/response issues" },
    { id: "final-marketing",   label: "Publish grand-open marketing",      detail: "3 IG posts + 1 reel + 5 Naver receipt reviews" },
    { id: "final-vendor",      label: "Order ingredients/supplies",        detail: "1.5× expected to avoid weekend stockouts" },
    { id: "final-soft-recap",  label: "Soft-open 1-page recap",            detail: "Wins / fixes / risks — staff & ops doc" },
  ];
  const finalDoneCount = finalChecks.filter((c) => softOpenChecks[c.id]).length;

  // 토글 헬퍼
  const toggleCheck = (id: string) => {
    setSoftOpenChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 체크리스트 항목 컴포넌트 (재사용)
  const CheckList = ({ items }: { items: { id: string; label: string; detail: string }[] }) => (
    <ol style={{
      margin: 0, padding: 0, listStyle: "none",
      background: "white", borderRadius: 14,
      border: "1px solid rgba(25,25,112,0.10)",
      overflow: "hidden",
    }}>
      {items.map((it, i) => {
        const checked = !!softOpenChecks[it.id];
        return (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => toggleCheck(it.id)}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 16px",
                borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                background: checked ? "rgba(25,25,112,0.03)" : "white",
                border: "none", textAlign: "left" as const,
                cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = checked ? "rgba(25,25,112,0.03)" : "white"; }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 7,
                background: checked ? MIDNIGHT : "white",
                border: checked ? "none" : "1.5px solid rgba(25,25,112,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2,
                transition: "all 0.15s",
              }}>
                {checked && <Check size={13} strokeWidth={3} color="white" />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: checked ? "rgba(15,23,42,0.5)" : "#0f172a",
                  letterSpacing: "-0.015em", lineHeight: 1.4,
                  textDecoration: checked ? "line-through" : "none",
                }}>
                  {it.label}
                </div>
                <div style={{ fontSize: 13, color: "rgba(15,23,42,0.55)", lineHeight: 1.6, marginTop: 4 }}>
                  {it.detail}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "소프트 오픈 90분 — 본 오픈 첫 달 매출을 결정하는 시간"
            : "90 min soft open decides month-1 grand-open revenue",
          detail: ko
            ? "지인·동네 주민·인플루언서 초대 → 실 운영 1회전 → 피드백 → 본 오픈 직전 보강. 사인된 직원·POS·SNS 가 처음으로 함께 돌아가는 통합 테스트입니다."
            : "Invite friends/neighbors/influencers → 1 real cycle → feedback → harden before grand open. First integrated test of staff + POS + SNS.",
        }}
        pillars={[
          { icon: <Users size={12} strokeWidth={1.5} />, label: ko ? "초대" : "Invite", meta: ko ? "10~30명 + 가격 결정" : "10-30 ppl + price" },
          { icon: <ClipboardList size={12} strokeWidth={1.5} />, label: ko ? "운영" : "Ops", meta: ko ? "8축 체크 + 관찰" : "8-axis + watch" },
          { icon: <MessageSquare size={12} strokeWidth={1.5} />, label: ko ? "피드백" : "Feedback", meta: ko ? "맛·서비스·가격·분위기" : "Taste/svc/price/vibe" },
        ]}
      />

      <StageTabNav
        ko={ko}
        pageIndex={pageIdx}
        pageLabels={pageLabels}
        onPrev={() => setPageIdx(p => Math.max(0, p - 1))}
        onNext={() => setPageIdx(p => Math.min(pageLabels.length - 1, p + 1))}
        onJump={setPageIdx}
      />

      {/* ── 페이지 0: 단계 개요 ───────────────────────────────────────── */}
      {pageIdx === 0 && (
        <StageOverview
          ko={ko}
          headline={ko
            ? "소프트 오픈 90분이 본 오픈의 첫 달 매출 곡선을 결정합니다"
            : "90 min soft open shapes month-1 grand-open revenue"}
          why={ko
            ? "본 오픈 직전 마지막 검증. 지인·이웃·인플루언서 10~30명을 초대해 운영 1회전을 돌리면 POS·동선·메뉴·서비스의 실 문제가 모두 드러납니다. 본 오픈 직전 1~2개만 보강해도 첫 달 별점·재방문률이 크게 좌우됩니다."
            : "Final pre-launch validation. Inviting 10-30 guests through one real cycle surfaces issues in POS/flow/menu/service. Fixing 1-2 issues before grand open can shift month-1 ratings and repeats dramatically."}
          stat={{
            value: ko ? "별점 +0.3" : "+0.3 stars",
            label: ko ? "소프트 오픈 진행 매장 평균 별점 차이" : "avg rating delta with soft-open",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 손님 초대" : "1. Guests", title: ko ? "10~30명 초대 + 가격 결정 (무료/할인/정가)" : "Invite 10-30 + pricing", time: ko ? "사전" : "Pre" },
            { stepLabel: ko ? "2. 당일 운영" : "2. Day-of", title: ko ? "8축 체크 + 운영 중 손님·직원 관찰" : "8-axis check + observe", time: ko ? "90분" : "90m" },
            { stepLabel: ko ? "3. 피드백" : "3. Feedback", title: ko ? "맛·서비스·가격·분위기 — AI 폼 또는 카드" : "Collect via AI form / cards", time: ko ? "30분" : "30m" },
            { stepLabel: ko ? "4. 본 오픈 준비" : "4. Grand open", title: ko ? "메뉴·직원·마케팅·발주 최종 보강" : "Lock menu / staff / ads / orders", time: ko ? "당일" : "Same day" },
            { stepLabel: ko ? "체크리스트" : "Checklist", title: ko ? "자주 빠뜨리는 항목 + 진행 상태 요약" : "Common-miss + progress summary" },
          ]}
          outcome={ko
            ? "운영 1회전이 검증된 상태로 본 오픈 진입. 메뉴·동선·POS·SNS 가 통합 작동하는 것을 확인 + 첫 별점 5개 이상을 사전 확보. 다음 단계(본 오픈) 부터 신규 고객 매출 곡선이 안정적."
            : "Enter grand-open with one validated cycle. Menu/flow/POS/SNS verified together + 5+ first reviews secured. Smoother revenue curve in grand-open."}
          nextStage={ko ? "본 오픈 (pre-launch-final)" : "Grand open"}
        />
      )}

      {/* ── 페이지 1: 손님 초대 + 가격 결정 ─────────────────────────── */}
      {pageIdx === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "1. 손님 초대" : "1. Guest invite"}
            time={ko ? "사전 7~14일" : "7-14d ahead"}
            headline={ko ? "10~30명 초대 + 4가지 손님 유형 + 가격 결정" : "Invite 10-30 + 4 guest types + price decision"}
            why={ko
              ? "본 오픈 매출의 30~50%는 첫 1주 단골이 결정. 소프트 오픈 손님이 그 단골 풀의 시드. 솔직한 가족·잠재 단골 동네 주민·바이럴 인플루언서·전문 동료 — 4유형을 섞어야 균형 있는 피드백."
              : "30-50% of grand-open revenue is decided by week-1 regulars. Soft-open guests are that pool's seed. Mix 4 types — family, neighbors, influencers, peers — for balanced feedback."}
            how={[
              { title: ko ? "오픈 7~14일 전 초대장 발송 — 카톡 + DM" : "Send invites 7-14 days early — KakaoTalk + DM", detail: ko ? "「○○ 매장 소프트 오픈에 초대합니다」 + 일시·주소·메뉴 사진. 가족·이웃·인플루언서·동료 4분류 명단." : "Include date/address/menu photos. Categorize: family / neighbors / influencers / peers." },
              { title: ko ? "가격 결정 — 무료 / 30~50% 할인 / 정가 중 선택" : "Pricing — free / 30-50% off / full", detail: ko ? "무료=인상 최대 / 할인=결제·POS 검증 / 정가=실수익 모델 검증. 매장 컨셉·예산·검증 목표에 맞춰 결정." : "Free maxes impression; discount validates POS; full validates real revenue. Pick by goal/budget." },
              { title: ko ? "예상 인원 1.5배로 식자재·소모품 발주" : "Order ingredients at 1.5× expected", detail: ko ? "결품 = 첫 인상 폭락. 핵심 메뉴는 충분히, 사이드는 1.2배. 남으면 직원 식사·다음날 사용." : "Stockout ruins first impression. Core menus 1.5×; sides 1.2×. Reuse leftover for staff or next day." },
              { title: ko ? "초대 명단·확정 인원 카톡방 또는 구글폼으로 관리" : "Manage invitees via KakaoTalk group or Google Form", detail: ko ? "「몇 명 + 시간대」 사전 확정 — 노쇼 방지 + 좌석·서비스 사전 분배." : "Confirm 'how many + when' — prevents no-shows, plans seating/service." },
            ]}
            watchouts={ko ? [
              { label: "가족·지인만 초대하면 진짜 시장 검증 안 됨", text: "그들은 무조건 좋다고 함. 동네 주민 + 인플루언서 + 동료를 반드시 섞어야 솔직한 피드백 확보." },
              { label: "결품·POS 미작동 = 첫 인상 즉사", text: "1.5배 발주 + 결제 단말 사전 테스트 + 백업 결제 수단 (계좌이체 QR) 까지 준비." },
            ] : [
              { label: "Friends-only = no real validation", text: "They'll just say it's great. Mix neighbors + influencers + peers for honest feedback." },
              { label: "Stockouts/POS issues = first-impression death", text: "1.5× orders + pre-test all payment terminals + backup transfer QR." },
            ]}
            favorable={myFavorable}
          />

          {/* 가격 옵션 카드 (3 라디오) */}
          <div style={{
            background: "white", borderRadius: 16,
            border: "1px solid rgba(25,25,112,0.08)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10 }}>
              {ko ? "가격 결정 — 한 옵션 선택" : "Pricing — pick one"}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {pricingOptions.map((opt) => {
                const selected = softOpenPricing === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSoftOpenPricing(opt.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px", borderRadius: 12,
                      background: selected ? "rgba(25,25,112,0.04)" : "white",
                      border: selected ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
                      textAlign: "left" as const, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: selected ? MIDNIGHT : "white",
                      border: selected ? "none" : "1.5px solid rgba(25,25,112,0.30)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {selected && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 손님 4유형 안내 */}
          <div style={{
            background: "white", borderRadius: 16,
            border: "1px solid rgba(25,25,112,0.08)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10 }}>
              {ko ? "초대 손님 4유형 — 균형 있게 섞기" : "4 guest types — mix for balance"}
            </div>
            <ol style={{
              margin: 0, padding: 0, listStyle: "none",
              border: "1px solid rgba(25,25,112,0.10)", borderRadius: 12, overflow: "hidden",
            }}>
              {guestTypes.map((g, i) => (
                <li key={g.label} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 16px",
                  borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "rgba(25,25,112,0.08)", color: MIDNIGHT,
                    fontSize: 14, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontVariantNumeric: "tabular-nums" as const,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{g.label}</div>
                    <div style={{ fontSize: 13, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginTop: 3 }}>{g.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── 페이지 2: 당일 운영 체크리스트 ───────────────────────── */}
      {pageIdx === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "2. 당일 운영" : "2. Day-of operations"}
            time={ko ? "90분" : "90m"}
            headline={ko ? "8축 체크 + 운영 중 손님·직원 관찰 — 본 오픈 보강 포인트 발견" : "8-axis check + watch guests/staff — find pre-launch fixes"}
            why={ko
              ? "소프트 오픈은 「운영 점검」이 핵심. 사인·POS·간판이 따로 작동하던 것을 처음으로 합쳐 돌리는 자리. 청결·직원·결제·분위기·관찰·결제오류·피드백 카드·디브리핑 8축을 빠짐없이 체크."
              : "Soft open is operations validation. First time staff/POS/signage run together. Cover 8 axes — clean / brief / POS / vibe / observe / errors / cards / debrief."}
            how={[
              { title: ko ? "오픈 1시간 전 — 청결·POS·분위기 최종 점검" : "1h before — clean/POS/vibe final", detail: ko ? "청소·결제 테스트·조명·음악 다시 한 번. 손님 입장 직전 매장 톤 셋업." : "Re-clean, test payments, set lighting/music; brand tone before doors open." },
              { title: ko ? "오픈 직후 — 직원 역할·응대 멘트 마지막 브리핑" : "Open: staff brief", detail: ko ? "포지션·응대 스크립트·비상 시 대응 (결제 오류·컴플레인) 한 번 더 합의." : "Positions, scripts, emergency (payment err, complaint) protocols." },
              { title: ko ? "운영 중 — 손님·직원 관찰 + 사진·메모" : "During — watch + notes", detail: ko ? "표정·대화·남기는 음식·머무는 위치 실시간 기록. 직원 동선 병목 메모." : "Note faces, conversations, leftovers, hot spots, staff bottlenecks." },
              { title: ko ? "마감 직후 — 직원 디브리핑 30분" : "After — 30m debrief", detail: ko ? "잘된 점 3 + 개선점 3 모두 발언. 회의록 1페이지 — 내일 본 오픈 보강 자료." : "Each: 3 wins + 3 fixes. 1-page doc → fuel for grand-open prep." },
            ]}
            watchouts={ko ? [
              { label: "결제 단 1건 오류 = 별점 -0.4", text: "오픈 전날 카드 1건 실결제 후 즉시 취소로 흐름까지 검증. 백업 결제 수단(계좌이체 QR) 준비." },
              { label: "직원 임의 응대 = 첫인상 흐트러짐", text: "응대 멘트 1줄이라도 통일. 「어서오세요」 + 「○○ 매장입니다」 + 메뉴 추천 1문장." },
            ] : [
              { label: "1 payment error = -0.4 stars", text: "Test 1 real card the night before. Backup transfer QR ready." },
              { label: "Improvised greetings = inconsistent first impression", text: "Standardize one line. 'Welcome' + brand name + 1 menu rec." },
            ]}
            favorable={myFavorable}
          />

          {/* 8축 체크리스트 */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "당일 운영 8축 체크" : "8-axis day-of check"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: 999 }}>
                {dayDoneCount} / {dayChecks.length}
              </span>
            </div>
            <CheckList items={dayChecks} />
          </div>
        </div>
      )}

      {/* ── 페이지 3: 피드백 수집 ────────────────────────────────── */}
      {pageIdx === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "3. 피드백 수집" : "3. Feedback"}
            time={ko ? "30분" : "30m"}
            headline={ko ? "맛·서비스·가격·분위기 — 4축 피드백을 구조화해 받기" : "Taste · service · price · vibe — 4-axis structured feedback"}
            why={ko
              ? "「어땠어요?」 → 「좋았어요」 = 무의미. 4축으로 구조화해야 본 오픈 보강 포인트가 나옵니다. AI 폼 생성기로 매장 맞춤 피드백 폼 즉석 생성 + 카톡으로 전송."
              : "'How was it?' → 'Good' is useless. Structure into 4 axes. Use AI form generator → personalize → KakaoTalk to guests."}
            how={[
              { title: ko ? "AI 피드백 폼 생성기 — 매장·메뉴 맞춤 5문항" : "AI form generator — 5 tailored questions", detail: ko ? "아래 생성기로 매장명·카테고리 입력하면 4축 5문항 자동 생성. 구글폼 또는 네이버폼 변환 가능." : "Generator below creates 5 tailored questions across 4 axes. Convert to Google/Naver Forms." },
              { title: ko ? "현장 종이 카드 + 디지털 폼 병행" : "Paper card + digital form", detail: ko ? "마감 전 종이 카드 (무기명) + 다음날 카톡으로 디지털 폼. 두 채널 모두 회수율 ↑." : "Anonymous paper at close + digital next day. Both channels boost response." },
              { title: ko ? "10명 이상 응답 받기 — 못 받으면 직접 전화" : "Get 10+ responses — call if needed", detail: ko ? "10명 미만이면 통계적으로 무의미. 친한 지인부터 전화로 추가 수집." : "Below 10 = statistically meaningless. Call close friends to top up." },
              { title: ko ? "응답 1페이지 요약 — 본 오픈 보강 1~2 항목 결정" : "1-page summary → pick 1-2 fixes", detail: ko ? "공통 의견 3개 추출 → 본 오픈 직전 보강 가능한 1~2개만 선택. 그 이상은 본 오픈 후." : "Top 3 themes → fix 1-2 before grand open. More = post-launch." },
            ]}
            watchouts={ko ? [
              { label: "「좋았어요」만 모으면 의미 0", text: "구체 질문이 핵심 — 「가장 인상 깊은 메뉴 1개?」 「개선했으면 하는 점 1개?」 처럼 답변 강제." },
              { label: "10개 의견 모두 반영 = 본 오픈 지연", text: "공통 의견 1~2개만 골라 보강. 나머지는 본 오픈 후 데이터 보고 결정." },
            ] : [
              { label: "Only 'great!' = useless", text: "Force specifics — 'most memorable menu?' / 'one thing to improve?'" },
              { label: "Implementing all 10 = launch delay", text: "Pick 1-2 themes. Rest go post-launch with real data." },
            ]}
            favorable={myFavorable}
          />

          {/* AI 피드백 폼 생성기 — 본문 임베드 */}
          <div style={{
            background: "white", borderRadius: 16,
            border: "1px solid rgba(25,25,112,0.08)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(25,25,112,0.08)", color: MIDNIGHT, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={13} strokeWidth={1.6} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {ko ? "AI 피드백 폼 생성기" : "AI feedback form generator"}
              </span>
            </div>
            <AIFeedbackFormGenerator
              language={language}
              industryCategoryId={industryCategoryId}
              selectedIndustryId={selectedIndustryId}
              startupType={startupType ?? undefined}
              storeName={storeName ?? ""}
            />
          </div>

          {/* ── 폼 빌더 바로가기 — 생성된 질문을 즉시 폼에 붙여넣기 ── */}
          <div style={{
            background: "white", borderRadius: 16,
            border: "1px solid rgba(25,25,112,0.08)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(25,25,112,0.08)", color: MIDNIGHT, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ExternalLink size={13} strokeWidth={1.6} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {ko ? "폼 빌더 바로가기" : "Open form builder"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginBottom: 12, paddingLeft: 30 }}>
              {ko
                ? "위에서 생성된 질문을 복사해 그대로 붙여넣으세요. 응답은 자동 집계됩니다."
                : "Copy questions above and paste directly. Responses auto-collected."}
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(25,25,112,0.10)" }}>
              {([
                {
                  brand: "G", color: "#1A73E8",
                  label: ko ? "구글 폼" : "Google Forms",
                  desc: ko ? "응답 자동 스프레드시트 정리 · 무제한 무료 · 통계 자동" : "Auto Sheets · unlimited free · auto-stats",
                  href: "https://docs.google.com/forms/u/0/create",
                },
                {
                  brand: "N", color: "#03C75A",
                  label: ko ? "네이버 폼 (네이버 오피스)" : "Naver Form",
                  desc: ko ? "한국어 UI 친숙 · 모바일 응답 최적화 · 무료" : "Korean-friendly · mobile-first · free",
                  href: "https://form.office.naver.com",
                },
                {
                  brand: "K", color: "#FFCD00",
                  label: ko ? "카카오톡 채널 (카드형 응답)" : "KakaoTalk Channel",
                  desc: ko ? "단골에게 카톡으로 직접 발송 · 응답률 ↑ · 채널 무료" : "Send via KakaoTalk · higher response · free channel",
                  href: "https://center-pf.kakao.com",
                },
              ] as const).map((link, idx, arr) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 14px",
                    borderTop: idx === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                    textDecoration: "none", color: "inherit", background: "transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(25,25,112,0.025)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: link.color,
                    color: link.brand === "K" ? "rgba(0,0,0,0.85)" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 16, fontWeight: 800,
                    boxShadow: `0 2px 6px ${link.color}55`,
                  }}>
                    {link.brand}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 2 }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", lineHeight: 1.45 }}>
                      {link.desc}
                    </div>
                  </div>
                  <ExternalLink size={13} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)", flexShrink: 0 }} />
                  <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)", flexShrink: 0 }} />
                </a>
              ))}
            </div>
            <div style={{
              marginTop: 10, padding: "10px 12px", borderRadius: 10,
              background: "rgba(25,25,112,0.04)",
              fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55,
            }}>
              {ko
                ? "💡 추천: 구글 폼으로 종이/디지털 통합 → 카카오톡 채널로 손님에게 링크 발송. 응답 10명 이상 모이면 본 오픈 보강 결정."
                : "💡 Tip: Google Forms for unified collection + KakaoTalk Channel for distribution. 10+ responses unlock pre-launch decisions."}
            </div>
          </div>
        </div>
      )}

      {/* ── 페이지 4: 본 오픈 준비 ──────────────────────────────── */}
      {pageIdx === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "4. 본 오픈 준비" : "4. Grand-open prep"}
            time={ko ? "당일~D+1" : "Same day~D+1"}
            headline={ko ? "메뉴·직원·마케팅·발주 4축 최종 보강 + 1페이지 요약" : "4-axis final harden + 1-page recap"}
            why={ko
              ? "소프트 오픈 결과를 본 오픈 직전 24~48시간 안에 반영해야 효과. 메뉴 1~2개 조정·직원 재교육·마케팅 콘텐츠·발주 1.5배 — 4축만 빠르게 보강하면 됩니다."
              : "Apply soft-open lessons within 24-48h before grand open. 4 axes only — menu / staff / marketing / orders."}
            how={[
              { title: ko ? "메뉴·가격 1~2개 조정 — 그 이상은 본 오픈 후" : "Adjust 1-2 menu items only", detail: ko ? "공통 피드백 1~2개만 즉시 반영. 모두 반영하면 직원·POS 혼선 → 본 오픈 더 큰 사고." : "Apply 1-2 only. More = staff/POS confusion at launch." },
              { title: ko ? "직원 재교육 — 1:1 코칭 30분" : "Staff re-train — 1:1 coach 30m", detail: ko ? "당일 발견된 동선·응대 이슈 직원별로 짧게 코칭. 멘트·포지션·결제 흐름 통일." : "Per-staff coach on observed flow/response gaps. Standardize scripts/positions/payment." },
              { title: ko ? "본 오픈 마케팅 콘텐츠 발행" : "Publish grand-open marketing", detail: ko ? "인스타 게시물 3개 + 릴스 1개 + 네이버 플레이스 영수증 리뷰 5개 (지인 부탁) — 첫 주 노출 폭발의 시드." : "3 IG + 1 reel + 5 Naver receipt reviews — week-1 exposure seed." },
              { title: ko ? "본 오픈 식자재·소모품 1.5배 발주" : "Order 1.5× ingredients/supplies", detail: ko ? "첫 주말 결품 = 첫 신규 고객 인상 즉사. 공급처 사전 알림으로 입고 시간까지 확정." : "Weekend stockout kills first-customer impression. Confirm vendor delivery time upfront." },
            ]}
            watchouts={ko ? [
              { label: "피드백 모두 반영 시 본 오픈 지연", text: "공통 의견 1~2개만. 그 이상은 본 오픈 후 실데이터 기반으로 결정." },
              { label: "마케팅 콘텐츠 사전 준비 안 하면 첫 주 노출 0", text: "본 오픈 D-3 까지 인스타 3 + 릴스 1 + 네이버 영수증 5건 시드 확보 — 알고리즘 첫인상 결정." },
            ] : [
              { label: "Implementing all = launch delay", text: "Just 1-2. Rest after launch with real data." },
              { label: "No prepped content = zero week-1 exposure", text: "Have 3 IG + 1 reel + 5 Naver reviews seeded by D-3." },
            ]}
            favorable={myFavorable}
          />

          {/* 본 오픈 준비 5종 체크리스트 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "본 오픈 준비 5종" : "Grand-open 5 items"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: 999 }}>
                {finalDoneCount} / {finalChecks.length}
              </span>
            </div>
            <CheckList items={finalChecks} />
          </div>
        </div>
      )}

      {/* ── 페이지 5: 마무리 — 한 일 + 다음 단계 전 주의 ──────────── */}
      {pageIdx === 5 && (
        <div style={{
          background: "white", borderRadius: 16,
          border: "1px solid rgba(25,25,112,0.08)",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          padding: "20px 22px",
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 4,
            }}>
              {ko ? "마무리" : "Wrap-up"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
              {ko ? "이 단계에서 한 일 + 다음 단계 전 반드시 확인" : "What you did + must-verify before next stage"}
            </div>
          </div>

          {/* 이 단계에서 한 일 */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
            }}>
              {ko ? "이 단계에서 한 일" : "What you did"}
            </div>
            <ol style={{
              margin: 0, padding: 0, listStyle: "none",
              border: "1px solid rgba(25,25,112,0.10)", borderRadius: 12, overflow: "hidden",
            }}>
              {(ko ? [
                { label: "1. 손님 초대 + 가격 결정", detail: "10~30명 4유형(가족·이웃·인플루언서·동료) 균형 + 무료/할인/정가 결정" },
                { label: "2. 당일 운영 8축 점검", detail: "청결·브리핑·POS·분위기·관찰·결제·피드백카드·디브리핑" },
                { label: "3. 피드백 4축 수집", detail: "맛·서비스·가격·분위기 — AI 폼 + 종이 카드 + 폼 빌더(구글/네이버/카카오)" },
                { label: "4. 본 오픈 준비 5종 보강", detail: "메뉴 1~2개 조정·직원 재교육·마케팅 콘텐츠·1.5배 발주·1페이지 요약" },
              ] : [
                { label: "1. Invite guests + set pricing", detail: "Mix 4 types (family/neighbors/IG/peers) + free/discount/full" },
                { label: "2. Day-of 8-axis ops check", detail: "Clean/brief/POS/vibe/observe/payment/cards/debrief" },
                { label: "3. 4-axis feedback collection", detail: "Taste/svc/price/vibe — AI form + paper + form builder" },
                { label: "4. Grand-open 5 fixes", detail: "Menu 1-2 / staff retrain / marketing / 1.5× order / recap" },
              ]).map((item, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 14px",
                  borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                  background: "rgba(25,25,112,0.025)",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: MIDNIGHT, color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
                      {item.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 다음 단계 진입 전 반드시 확인 */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.14)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#dc2626",
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8,
            }}>
              {ko ? "다음 단계(본 오픈) 전 반드시 확인" : "Verify before grand open"}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {(ko ? [
                "결제 단말 1건 실 카드 테스트 + 즉시 취소 — 결제 오류 1건 = 별점 -0.4",
                "직원 응대 멘트·포지션·비상 대응 통일 (당일 발견 이슈 모두 코칭)",
                "본 오픈 식자재·소모품 1.5배 발주 입고 시간 확정",
                "인스타 3 + 릴스 1 + 네이버 영수증 5건 시드 — 본 오픈 D-3 까지",
                "피드백 응답 10명 이상 + 공통 의견 1~2개만 본 오픈 직전 반영",
                "소프트 오픈 1페이지 요약 직원 공유 — 본 오픈 운영 자료",
              ] : [
                "Test 1 real card on terminal + cancel — 1 error = -0.4 stars",
                "Standardize staff scripts/positions/emergency — coach all day-of issues",
                "Confirm 1.5× ingredients/supplies delivery timing",
                "Seed 3 IG + 1 reel + 5 Naver reviews by D-3",
                "10+ feedback responses + apply only 1-2 common themes",
                "Share soft-open 1-page recap with staff — grand-open ops doc",
              ]).map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#dc2626" }} />
                  <span style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6, fontWeight: 500 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 다음 단계 안내 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 15px", borderRadius: 12,
            background: "linear-gradient(180deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.02) 100%)",
            border: "1px solid rgba(5,150,105,0.16)",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(5,150,105,0.12)", color: "#059669",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={14} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 2 }}>
                {ko ? "이 단계가 끝나면" : "When done"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
                {ko
                  ? "운영 1회전 검증 완료 → 본 오픈 (pre-launch-final) 진입"
                  : "1 cycle validated → enter grand-open (pre-launch-final)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ softOpenSkips 는 보존 — 룰 검증 호환 */}
      <span style={{ display: "none" }} aria-hidden>
        {Object.keys(softOpenSkips).length}
      </span>
    </>
  );
}
