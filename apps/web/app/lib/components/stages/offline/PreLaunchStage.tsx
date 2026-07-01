"use client";

import { useState, useEffect } from "react";
import { Users, ClipboardList, MessageSquare, Sparkles, ExternalLink, ChevronRight, Check } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { useRoadmapStore } from "../../../stores";
import { AIFeedbackFormGenerator } from "./AIFeedbackFormGenerator";
import { StageWrapup } from "../shared/StageWrapup";
import {
  getVisibleFeedbackIds,
  getVisibleFinalIds,
  getVisibleImprovementIds,
} from "./pre-launch-checks-meta";
import {
  getSoftOpenContent,
  getSoftOpenDayChecks,
} from "@foundone/shared";
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
  // (참고: 종전 `void setSoftOpenChecks` 는 잘못된 표기. setSoftOpenChecks 는 toggleCheck 에서 실제 사용 중)
  const ko = language === "ko";

  // ── 업종 맞춤 소프트오픈 콘텐츠 SSOT (운영모델 아키타입 + 세부업종 당일운영) ──
  //   2026-06-27: 음식 중심 하드코딩 → 업종 맞춤. 무인=시범운영/소모품, 서비스=체험예약 등.
  const L = (o: { ko: string; en: string }) => (ko ? o.ko : o.en);
  const soft = getSoftOpenContent(selectedIndustryId, industryCategoryId);
  const subDayChecks = getSoftOpenDayChecks(selectedIndustryId);
  // 모든 운영모델 공통 당일 점검(직원·분위기 등 대면 전용 제외 — 무인에도 적용 가능).
  const universalDayTail = ko
    ? [
        { id: "day-observation", label: "운영 중 관찰·기록", detail: "이용·동선·반응을 실시간 메모. 병목·불편 지점 기록." },
        { id: "day-settlement", label: "마감 정산·재고 확인", detail: "매출·결제 내역 정산 + 소모품·재고 잔량 확인." },
        { id: "day-sns", label: "오픈 SNS 1건 게시", detail: "현장 사진·후기 1건 — 네이버 플레이스·인스타 노출 시작." },
      ]
    : [
        { id: "day-observation", label: "Observe & note during ops", detail: "Log usage, flow, reactions live. Note bottlenecks." },
        { id: "day-settlement", label: "Closing settle & stock check", detail: "Reconcile sales/payments + check supplies/stock." },
        { id: "day-sns", label: "Post 1 opening SNS", detail: "1 on-site photo/review — start Naver Place/IG exposure." },
      ];

  const [pageIdx, setPageIdx] = useState(0);

  // 룰 검증을 위한 visible IDs — 렌더되는 체크 ID 와 동일하게(drift 방지: 보이는 것만 게이트).
  const setPreLaunchVisibleIds = useRoadmapStore((s) => s.setPreLaunchVisibleIds);
  useEffect(() => {
    setPreLaunchVisibleIds({
      dayIds: [...subDayChecks.map((c) => c.id), ...universalDayTail.map((c) => c.id)],
      feedbackIds: getVisibleFeedbackIds(industryCategoryId),
      finalIds: getVisibleFinalIds(),
      improvementIds: getVisibleImprovementIds(),
    });
    // subDayChecks/universalDayTail 는 selectedIndustryId·language 파생이라 deps 로 대표.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryCategoryId, selectedIndustryId, startupType, language, setPreLaunchVisibleIds]);

  const pageLabels = ko
    ? ["개요", L(soft.page1Label), "2. 당일 운영", "3. 피드백", "4. 본 오픈 준비", "마무리"]
    : ["Overview", L(soft.page1Label), "2. Day-of", "3. Feedback", "4. Grand Open", "Wrap-up"];

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

  // ── 체험/초대 대상 (page 1) — 운영모델 맞춤(무인은 '첫 이용자 관찰' 등) ──
  const guestTypes = soft.trialTypes.map((t) => ({ label: L(t.label), desc: L(t.desc) }));

  // ── 가격 결정 옵션 (page 1) ───────────────────────────────────
  const pricingOptions = [
    { id: "free",     label: ko ? "무료 제공" : "Free",     desc: ko ? "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보." : "Best impression. Cover cost; maximize feedback." },
    { id: "discount", label: ko ? "30–50% 할인" : "30-50% off", desc: ko ? "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대." : "Validates payment & POS; comfortable invite size." },
    { id: "full",     label: ko ? "정가 운영" : "Full price", desc: ko ? "할인·이벤트를 아껴뒀다 본오픈에 사용. 실수익 구조 그대로 테스트." : "Save discounts for grand open; test real revenue model." },
  ];

  // ── 당일 운영 체크리스트 (page 2) — 세부업종 맞춤(SSOT) + 공통 tail ──
  const dayChecks = [
    ...subDayChecks.map((c) => ({ id: c.id, label: L(c.label), detail: L(c.detail) })),
    ...universalDayTail,
  ];
  const dayDoneCount = dayChecks.filter((c) => softOpenChecks[c.id]).length;

  // ── 본 오픈 준비 체크리스트 (page 4) — 운영모델 맞춤(SSOT). ID 5종 유지(저장 호환). ──
  const FINAL_PREP_IDS = ["final-menu-fix", "final-staff-train", "final-marketing", "final-vendor", "final-soft-recap"];
  const finalChecks = FINAL_PREP_IDS.map((id, i) => {
    const fp = soft.finalPrep[i];
    return fp
      ? { id, label: L(fp.label), detail: L(fp.detail) }
      : { id, label: ko ? "본 오픈 준비" : "Grand-open prep", detail: "" };
  });
  const finalDoneCount = finalChecks.filter((c) => softOpenChecks[c.id]).length;

  // 토글 헬퍼
  const toggleCheck = (id: string) => {
    setSoftOpenChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ⚠️ 2026-05-19 (사장님 신고: 체크리스트 클릭 안 됨):
  //   종전엔 CheckList 가 PreLaunchStage 함수 *안에* inline 컴포넌트로 정의됨 →
  //   매 render 마다 새 함수 reference → React 가 unmount+remount → 클릭 시 button DOM
  //   재생성으로 click 처리 누락·시각 피드백 사라짐. 외부 PreLaunchCheckList 로 추출.

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "소프트 오픈 — 본 오픈 첫 달 매출을 결정하는 리허설"
            : "Soft open decides month-1 grand-open revenue",
          detail: L(soft.softOpenMeaning),
        }}
        pillars={[
          { icon: <Users size={12} strokeWidth={1.5} />, label: ko ? "초대·유치" : "Invite", meta: L(soft.page1Label).replace(/^\d+\.\s*/, "") },
          { icon: <ClipboardList size={12} strokeWidth={1.5} />, label: ko ? "운영" : "Ops", meta: ko ? "당일 점검 + 관찰" : "Day-of check + watch" },
          { icon: <MessageSquare size={12} strokeWidth={1.5} />, label: ko ? "피드백" : "Feedback", meta: soft.feedbackAxes.map((a) => L(a.label)).join(ko ? "·" : "/") },
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
            ? "소프트 오픈이 본 오픈의 첫 달 매출 곡선을 결정합니다"
            : "Soft open shapes month-1 grand-open revenue"}
          why={ko
            ? `본 오픈 직전 마지막 검증. ${L(soft.softOpenMeaning)} 직전 1~2개만 보강해도 첫 달 평판·재방문률이 크게 좌우됩니다.`
            : `Final pre-launch validation. ${L(soft.softOpenMeaning)} Fixing 1-2 issues before grand open shifts month-1 reputation and repeats.`}
          stat={{
            value: ko ? "평판 +0.3" : "+0.3 rating",
            label: ko ? "소프트 오픈 진행 매장 평균 평판 차이" : "avg rating delta with soft-open",
          }}
          workOutline={[
            { stepLabel: L(soft.page1Label), title: L(soft.softOpenMeaning), time: ko ? "사전" : "Pre" },
            { stepLabel: ko ? "2. 당일 운영" : "2. Day-of", title: ko ? "세부업종 맞춤 당일 점검 + 운영 관찰" : "Industry day-of checks + observe", time: ko ? "당일" : "Day" },
            { stepLabel: ko ? "3. 피드백" : "3. Feedback", title: (ko ? "수집: " : "Collect: ") + soft.feedbackAxes.map((a) => L(a.label)).join(ko ? "·" : "/"), time: ko ? "30분" : "30m" },
            { stepLabel: ko ? "4. 본 오픈 준비" : "4. Grand open", title: soft.finalPrep.map((f) => L(f.label)).slice(0, 3).join(ko ? "·" : "/") + (ko ? " 등 보강" : " etc."), time: ko ? "당일" : "Same day" },
            { stepLabel: ko ? "체크리스트" : "Checklist", title: ko ? "자주 빠뜨리는 항목 + 진행 상태 요약" : "Common-miss + progress summary" },
          ]}
          outcome={ko
            ? "운영 1회전이 검증된 상태로 본 오픈 진입. 메뉴·동선·POS·SNS 가 통합 작동하는 것을 확인 + 첫 별점 5개 이상을 사전 확보. 다음 단계(본 오픈) 부터 신규 고객 매출 곡선이 안정적."
            : "Enter grand-open with one validated cycle. Menu/flow/POS/SNS verified together + 5+ first reviews secured. Smoother revenue curve in grand-open."}
          nextStage={ko ? "본 오픈 (pre-launch-final)" : "Grand open"}
        />
      )}

      {/* ── 페이지 1: 손님 초대 + 가격 결정 ─────────────────────────── */}
      <div data-soft-open-page="1" />
      {pageIdx === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={L(soft.page1Label)}
            time={ko ? "사전 7~14일" : "7-14d ahead"}
            headline={L(soft.softOpenMeaning)}
            why={ko
              ? "본 오픈 전 마지막 검증 — 실제 운영을 1회전 돌려 문제를 미리 잡습니다. 아래 대상을 골고루 초대·유치해야 균형 잡힌 피드백을 얻습니다."
              : "Final validation before grand open — run one real cycle to catch issues early. Invite/attract a balanced mix below for honest feedback."}
            how={soft.page1Steps.map((s) => ({ title: L(s.title), detail: L(s.detail) }))}
            watchouts={ko ? [
              { label: "가까운 지인만 부르면 진짜 검증이 안 됨", text: "무조건 좋다고 합니다 — 잠재 고객·외부인을 반드시 섞어 솔직한 피드백을 확보하세요." },
              { label: "결제·핵심 설비 미점검 = 첫인상 즉사", text: "오픈 전 결제 1건 실테스트 + 핵심 설비·소모품 사전 점검 + 백업 수단 준비." },
            ] : [
              { label: "Inviting only close contacts = no real validation", text: "They'll just say it's great. Mix in potential customers/outsiders for honest feedback." },
              { label: "Unchecked payment/core equipment = first-impression death", text: "1 real payment test + pre-check core equipment/supplies + backup method." },
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
      <div data-soft-open-page="2" />
      {pageIdx === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "2. 당일 운영" : "2. Day-of operations"}
            time={ko ? "90분" : "90m"}
            headline={ko ? "세부업종 맞춤 당일 점검 + 운영 관찰 — 본 오픈 보강 포인트 발견" : "Industry day-of checks + observe — find pre-launch fixes"}
            why={ko
              ? "소프트 오픈은 「운영 점검」이 핵심. 설비·결제·시스템이 따로 작동하던 것을 처음으로 합쳐 돌리는 자리. 아래 세부업종 핵심 점검 항목을 빠짐없이 확인하세요."
              : "Soft open is operations validation. First time equipment/payment/systems run together. Cover every industry-specific check below."}
            how={[
              { title: ko ? "오픈 전 — 핵심 설비·결제·청결 최종 점검" : "Before open — core equipment/payment/cleanliness", detail: ko ? "결제 테스트, 핵심 설비 시운전, 매장·시설 청결을 입장/이용 직전 한 번 더." : "Test payments, dry-run core equipment, final cleanliness before use." },
              { title: ko ? "운영 중 — 이용 흐름·반응 관찰 + 사진·메모" : "During — watch flow/reactions + notes", detail: ko ? "동선·대기·불편 지점을 실시간 기록. 병목과 오류를 즉시 메모." : "Log flow, waits, friction live. Note bottlenecks and errors immediately." },
              { title: ko ? "마감 — 정산·재고 확인 + 1페이지 회고" : "Close — settle/stock + 1-page recap", detail: ko ? "매출·결제 정산, 소모품·재고 확인, 잘된 점 3·개선점 3 정리." : "Reconcile sales/payments, check supplies/stock, 3 wins + 3 fixes." },
            ]}
            watchouts={ko ? [
              { label: "결제 단 1건 오류 = 평판 즉락", text: "오픈 전 결제 1건 실테스트 후 즉시 취소로 흐름 검증. 백업 결제 수단(계좌이체 QR) 준비." },
              { label: "핵심 설비 미점검 = 첫날 운영 정지", text: "업종 핵심 설비(기기·키오스크·예약·시스템)를 반드시 사전 시운전." },
            ] : [
              { label: "1 payment error = instant reputation drop", text: "Run 1 real payment test then cancel. Backup transfer QR ready." },
              { label: "Unchecked core equipment = day-1 shutdown", text: "Dry-run your industry's core equipment (machines/kiosk/booking/systems)." },
            ]}
            favorable={myFavorable}
          />

          {/* 8축 체크리스트 */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "당일 운영 체크 (세부업종 맞춤)" : "Day-of checks (industry-specific)"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: 999 }}>
                {dayDoneCount} / {dayChecks.length}
              </span>
            </div>
            <PreLaunchCheckList items={dayChecks} softOpenChecks={softOpenChecks} toggleCheck={toggleCheck} />
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
            headline={(ko ? "" : "") + soft.feedbackAxes.map((a) => L(a.label)).join(ko ? "·" : " · ") + (ko ? " — 피드백을 구조화해 받기" : " — structured feedback")}
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
                  label: ko ? "네이버 폼" : "Naver Form",
                  desc: ko ? "한국어 UI 친숙 · 모바일 응답 최적화 · 무료 · 템플릿 다수" : "Korean-friendly · mobile-first · free · many templates",
                  href: "https://form.naver.com/templates",
                },
                {
                  brand: "K", color: "#FFCD00",
                  label: ko ? "카카오 비즈니스 폼" : "Kakao Business Form",
                  desc: ko ? "톡채널 친구에게 직접 발송 · 응답률 ↑ · 비즈채널 연결 무료" : "Send via Kakao channel · higher response · free",
                  href: "https://business.kakao.com/info/talkbizform/",
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
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
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
      <div data-soft-open-page="4" />
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
            <PreLaunchCheckList items={finalChecks} softOpenChecks={softOpenChecks} toggleCheck={toggleCheck} />
          </div>
        </div>
      )}

      {/* ── 페이지 5: 마무리 — StageWrapup 통합 (2026-05-18) ──────────── */}
      {pageIdx === 5 && (
        <StageWrapup
          ko={ko}
          nextStageLabelKo="본 오픈"
          nextStageLabelEn="grand open"
          doneItemsKo={[
            { label: soft.page1Label.ko, detail: soft.trialTypes.map((t) => t.label.ko).join("·") + " 균형 유치" },
            { label: "2. 당일 운영 점검 (세부업종 맞춤)", detail: (subDayChecks.length ? subDayChecks.map((c) => c.label.ko).join("·") : "핵심 설비·결제·청결") + "·관찰·정산" },
            { label: "3. 피드백 수집", detail: soft.feedbackAxes.map((a) => a.label.ko).join("·") + " — AI 폼 + 종이 카드" },
            { label: "4. 본 오픈 준비", detail: soft.finalPrep.map((f) => f.label.ko).join("·") },
          ]}
          doneItemsEn={[
            { label: soft.page1Label.en, detail: soft.trialTypes.map((t) => t.label.en).join("/") },
            { label: "2. Day-of checks (industry)", detail: (subDayChecks.length ? subDayChecks.map((c) => c.label.en).join("/") : "Core equipment/payment/cleanliness") + " + observe/settle" },
            { label: "3. Feedback collection", detail: soft.feedbackAxes.map((a) => a.label.en).join("/") + " — AI form + paper" },
            { label: "4. Grand-open prep", detail: soft.finalPrep.map((f) => f.label.en).join("/") },
          ]}
          verifyItemsKo={[
            "결제 1건 실테스트 + 즉시 취소 — 결제 오류 1건 = 평판 즉락",
            "당일 발견 이슈 모두 정리·보완 (응대·동선·설비·시스템)",
            `본 오픈 준비 확정 — ${soft.finalPrep.map((f) => f.label.ko).slice(0, 2).join("·")} 등`,
            "네이버 플레이스·인스타 노출 시드 — 본 오픈 D-3 까지",
            "피드백 응답 10건 이상 + 공통 의견 1~2개만 본 오픈 직전 반영",
            "소프트 오픈 1페이지 요약 정리 — 본 오픈 운영 자료",
          ]}
          verifyItemsEn={[
            "1 real payment test + cancel — 1 error = instant reputation drop",
            "Resolve all day-of issues (service/flow/equipment/systems)",
            `Confirm grand-open prep — ${soft.finalPrep.map((f) => f.label.en).slice(0, 2).join(", ")} etc.`,
            "Seed Naver Place / IG exposure by D-3",
            "10+ feedback responses + apply only 1-2 common themes",
            "Compile soft-open 1-page recap — grand-open ops doc",
          ]}
          nextSummaryKo="운영 1회전 검증 완료 → 본 오픈 (pre-launch-final) 진입"
          nextSummaryEn="1 cycle validated → enter grand-open (pre-launch-final)"
        />
      )}

      {/* ⚠️ softOpenSkips 는 보존 — 룰 검증 호환 */}
      <span style={{ display: "none" }} aria-hidden>
        {Object.keys(softOpenSkips).length}
      </span>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  PreLaunchCheckList — 체크리스트 항목 외부 컴포넌트 (2026-05-19 추출)
//
//  종전엔 PreLaunchStage 함수 *안에* inline 으로 const CheckList = () => ... 정의.
//  매 render 마다 새 함수 reference → React reconciler 가 *다른 컴포넌트 type* 으로 인식 →
//  unmount + remount → 클릭 시 button DOM 재생성으로 click 누락·시각 피드백 사라짐
//  ("체크리스트가 클릭 안 되고 동작 안 함" 신고). 외부로 추출해 stable reference 보장.
// ─────────────────────────────────────────────────────────────────────────

function PreLaunchCheckList({
  items,
  softOpenChecks,
  toggleCheck,
}: {
  items: { id: string; label: string; detail: string }[];
  softOpenChecks: Record<string, boolean>;
  toggleCheck: (id: string) => void;
}) {
  return (
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
              // ⚠️ 2026-05-19 모바일: hover effect 가 모바일 탭 후 stuck 됨 → matchMedia 로
              //   pointer:fine (마우스) 일 때만 hover 핸들러 적용. 모바일 (pointer:coarse) 무효.
              onMouseEnter={(e) => {
                if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)";
              }}
              onMouseLeave={(e) => {
                if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                (e.currentTarget as HTMLButtonElement).style.background = checked ? "rgba(25,25,112,0.03)" : "white";
              }}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 16px",
                borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                background: checked ? "rgba(25,25,112,0.03)" : "white",
                border: "none", textAlign: "left" as const,
                cursor: "pointer", transition: "background 0.12s",
                fontFamily: "inherit",
                minHeight: 56, // 모바일 터치 타겟 충분히
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 8,  // 22→26 모바일 터치 타겟
                background: checked ? MIDNIGHT : "white",
                border: checked ? "none" : "1.5px solid rgba(25,25,112,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2,
                transition: "all 0.15s",
              }}>
                {checked && <Check size={15} strokeWidth={3} color="white" />}
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
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                  {it.detail}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
