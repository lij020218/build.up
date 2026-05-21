"use client";

import { useState } from "react";
import { Building2, User, ShieldCheck } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";
import { getPermitsForCategory, getTotalPermitCost } from "@build-up/shared";
import {
  KeyActionHero,
  StageTabNav,
  StageOverview,
  WorkStep,
} from "../shared/StageActionHero";

export function PermitCheckPanels() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    livePermitInsights,
    setLivePermitInsights,
  } = d;

  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  // ⚠️ 페이지네이션 — 한 화면 = 한 흐름. 사용자 피드백으로 스크롤 분량 줄임.
  const [pageIdx, setPageIdx] = useState(0);

  const ko = language === "ko";
  // ★ 페이지 0 = 개요. 그 후 작업 흐름.
  const pageLabels = ko
    ? ["개요", "1. 건물", "2. 사람", "3. 시설", "4. 협상", "체크리스트"]
    : ["Overview", "1. Building", "2. Person", "3. Facility", "4. Negotiate", "Checklist"];

  // ── Panel 1: Live competition/survival data ──

  const loadPermitInsights = async () => {
    if (livePermitInsights && !livePermitInsights.loading) return;
    setLivePermitInsights({ loading: true });
    try {
      const session = await supabase.auth.getSession();
      const tk = session.data.session?.access_token;
      const res = await fetch(`/api/data/permits?pageSize=500`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null);
      if (res?.data?.length) {
        const permits = res.data as Array<{ status: string; permitDate?: string; closureDate?: string }>;
        const operating = permits.filter(p => p.status === "operating").length;
        const closed = permits.filter(p => p.status === "closed").length;
        const total = operating + closed;
        const survivalRate = total > 0 ? Math.round((operating / total) * 100) : 0;
        setLivePermitInsights({ loading: false, data: { total, operating, closed, survivalRate } });
      } else {
        setLivePermitInsights({ loading: false });
      }
    } catch { setLivePermitInsights({ loading: false }); }
  };

  if (!livePermitInsights) void loadPermitInsights();

  // ── Panel 2: Permit checklist ──

  const permitSet = getPermitsForCategory(industryCategoryId);
  const totalCost = getTotalPermitCost(industryCategoryId);
  const priorityLabel = (p: string) => p === "required" ? (ko ? "필수" : "Required") : p === "conditional" ? (ko ? "조건부" : "Conditional") : (ko ? "권장" : "Recommended");
  const priorityColor = (p: string) => p === "required" ? "#dc2626" : p === "conditional" ? "#d97706" : "#6b7280";

  // ── Intro 콘텐츠 (단계 의미·작업·실패 사례) ──
  //  사용자 피드백: 단계 설명이 부족해 "대체 뭘 하라는 건지" 모르겠다는 의견 → 제일 위에
  //  의미·작업 흐름·실패 사례 카드 3종을 명시적으로 노출.
  const categoryHints: Record<string, { building: string; person: string; facility: string; pitfall: string }> = {
    food: {
      building: "건축물대장 용도(근린생활시설), 정화조 용량, 환기·배기·분리 가스 라인",
      person: "식품위생교육 6시간 수료증, 보건증(건강진단결과서)",
      facility: "소방완비증명서(2층 이상 또는 100㎡↑), 가스시설 검사",
      pitfall: "정화조 용량이 부족해 영업신고가 거부 → 증축 1,000만원+ 또는 계약 해지",
    },
    cafe: {
      building: "건축물대장 용도(근린생활시설), 정화조 용량, 환기·배수",
      person: "휴게음식점 위생교육 6시간 수료증 (신규 영업자, 식품위생법 시행규칙) + 보건증",
      facility: "소방완비증명서(2층 이상 또는 100㎡↑)",
      pitfall: "휴게음식점 영업신고 누락 후 오픈 → 단속 시 영업정지 + 과태료",
    },
    beauty: {
      building: "건축물대장 용도, 환기·세면설비",
      person: "미용사 / 이용사 / 피부미용사 면허, 보건증",
      facility: "공중위생영업소 신고, 소독 설비 기준",
      pitfall: "미용사 면허 없이 영업 → 무자격 행위로 폐업 + 형사 처벌 위험",
    },
    retail: {
      building: "건축물대장 용도(근린생활시설/판매시설)",
      person: "(일반 소매는 면허 불요, 식품 판매 시 식품판매업 신고)",
      facility: "(일반 소매 무자격, 주류 판매 시 주류판매업 면허)",
      pitfall: "건강기능식품·주류 등 특수 품목을 신고 없이 판매 → 시정명령 + 영업정지",
    },
    fitness: {
      building: "건축물대장 용도, 천장 높이(필라테스/요가), 방음",
      person: "체육지도자 자격(생활스포츠지도사 등 — 운영자 본인 또는 강사 1명)",
      facility: "체육시설업 신고 + 배상책임보험 가입(필수)",
      pitfall: "체육시설업 미신고 운영 → 단속 시 즉시 폐쇄 + 보증금 손실",
    },
    education: {
      building: "건축물대장 용도(교육연구시설/근린생활), 면적별 정원 기준",
      person: "강사 자격증 + 성범죄 경력 조회서, 학원 설립자 결격사유",
      facility: "교육청 학원 등록 + 배상책임보험, 소방·CCTV·정수기 등 시설 기준",
      pitfall: "학원 등록 전 수강생 모집 → 무등록 학원 처벌 + 환불 분쟁",
    },
    pet: {
      building: "건축물대장 용도(근린생활), 소음·분뇨 처리",
      person: "동물보호법상 등록 영업자 — 반려동물취급자 자격(미용업 등)",
      facility: "동물관련영업 등록(시·군·구), 시설 면적·격리실 기준",
      pitfall: "동물관련영업 등록 누락 → 과태료 100~500만원 + 폐쇄명령",
    },
    living: {
      building: "건축물대장 용도, 폐수·소음 기준",
      person: "(업종별 상이 — 세탁업 신고, 청소업 등록 등)",
      facility: "관할 구청 신고/등록 — 정화조·폐수 처리 시설",
      pitfall: "특수 업종(세탁/청소) 신고 누락 → 영업정지 + 과태료",
    },
    space: {
      building: "건축물대장 용도(숙박시설은 별도), 객실/화장실 비율",
      person: "(공유숙박은 호스트 거주 요건 / 농어촌민박 신고 등)",
      facility: "숙박업 신고 + 소방·전기 안전 점검",
      pitfall: "주거용 건물에서 무허가 숙박 운영 → 형사 처벌 + 즉시 폐쇄",
    },
  };
  const hint = categoryHints[industryCategoryId] ?? categoryHints.food;

  // Apple-style 토큰 — 같은 surface 를 4 카드에 통일하되, 은은한 navy 워시 위에
  //  포인트 컬러로 미드나이트 블루(#191970) 를 아이콘·step·버튼에만 강하게 박는 전략.
  //  ACCENT (navy) = surface/border 톤, MIDNIGHT = 액션·포인트.
  const ACCENT = "#1d3557";
  const ACCENT_RGB = "29,53,87";
  const MIDNIGHT = "#191970";          // CSS MidnightBlue — 포인트 컬러
  const MIDNIGHT_RGB = "25,25,112";
  const surfaceCard = {
    marginBottom: "12px",
    padding: "28px 28px",
    borderRadius: "20px",
    // 흰 위에 navy 2% 정도 — 페이지 배경에서 카드가 살짝 시원해 보일 정도만.
    background: `linear-gradient(180deg, rgba(${ACCENT_RGB},0.018) 0%, rgba(255,255,255,0.96) 60%)`,
    border: `1px solid rgba(${ACCENT_RGB},0.10)`,
    boxShadow: `0 1px 2px rgba(${ACCENT_RGB},0.04)`,
  } as const;
  const eyebrow = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: MIDNIGHT,
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  } as const;
  const hairline = `1px solid rgba(${ACCENT_RGB},0.10)`;

  // ─── 카테고리별 「임대인 협상 페이지」 사장님 상황 맞춤 권장 (페이지 3 inline) ───
  const negotiateFavorable: Record<string, { context: string; recommendation: string; rationale: string }> = {
    food: { context: "음식점 / F&B", recommendation: "정화조 BOD 부족 매물은 협상 X — 무조건 패스",
      rationale: "정화조 증축은 건물주 동의 + 1,000~3,000만원 + 1~2개월 공사. 부족하면 다른 매물로." },
    "cafe-dessert": { context: "카페 / 디저트", recommendation: "「전기 30A↑ + 급배수 가능」 임대 전 확답 받기",
      rationale: "머신·제빙기 동시 가동 시 20A 차단기 빈번. 임대인 확답 없으면 매물 변경." },
    beauty: { context: "1인 미용실 / 본인 면허 없을 때", recommendation: "면허자 의존 X — 본인 면허 취득 또는 2명+ 채용",
      rationale: "채용 면허자 퇴사 시 즉시 무자격 영업이라 문 닫음. 리스크 분산 필수." },
    retail: { context: "리테일 / 일반 소매", recommendation: "건축물 「판매시설」·「근린생활시설」 만 확인하면 끝",
      rationale: "건강식·주류·의약품·전자담배 외엔 인허가 거의 없음. 사업자등록만으로 시작." },
    fitness: { context: "필라테스·요가·PT", recommendation: "층고 2.5m 이하는 패스 — PT/필라 3m+, 요가 2.7m+",
      rationale: "층고 부족은 보강 불가. 월세 싸도 회원 만족도·재계약률 직격." },
    education: { context: "학원", recommendation: "건축물 용도 「교육연구시설」·「근린생활시설(학원)」 + 100㎡↑ 소방완비",
      rationale: "용도 미일치 시 학원 등록 거부. 어린이 학원은 안전 기준 엄격." },
    pet: { context: "펫 미용·호텔·훈련", recommendation: "주거 인접 매물 X — 상가 단독 입지 우선",
      rationale: "짖음·털 알레르기 민원으로 시간 제한·계약 해지 사례 다수." },
    "living-service": { context: "세탁·청소·수리", recommendation: "특수 업종 신고/등록 의무 사전 확인",
      rationale: "세탁업·인쇄업은 시·구청 별도 신고 절차. 일반 청소는 면제." },
    space: { context: "공간 임대 (스튜디오·파티룸·연습실)", recommendation: "「숙박 가능 여부 + 소음 허용」 명문화",
      rationale: "소음 분쟁 1순위. 영업시간·데시벨 제한 특약 안 적으면 후일 분쟁." },
  };
  const myNegotiateTip = negotiateFavorable[industryCategoryId] ?? negotiateFavorable.food;

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko ? "내 업종이 이 건물에서 가능한지 — 계약 전 30분 안에 확인" : "Confirm category fits the building — in 30 min before signing",
          detail: ko
            ? "임대 계약 후 「영업 불가」 발견 시 보증금 1,000~5,000만원 즉시 묶임. 지금은 발급이 아닌 “무엇이 필요한지” 만 파악하는 사전 매핑 단계입니다."
            : "Post-lease discovery of incompatibility locks ₩10-50M deposit. This is a pre-mapping step — not application yet.",
        }}
        pillars={[
          { icon: <Building2 size={12} strokeWidth={1.5} />, label: ko ? "건물" : "Building", meta: ko ? "용도 · 정화조" : "Class · Septic" },
          { icon: <User size={12} strokeWidth={1.5} />, label: ko ? "사람" : "Person", meta: ko ? "면허 · 보건증" : "License · Health" },
          { icon: <ShieldCheck size={12} strokeWidth={1.5} />, label: ko ? "시설" : "Facility", meta: ko ? "소방 · 환기" : "Fire · Vent" },
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

      {/* ── 페이지 0: 단계 개요 ── */}
      {pageIdx === 0 && (
        <StageOverview
          ko={ko}
          headline={ko
            ? "임대 계약 전 30분 — 영업 가능 여부를 확정해 보증금을 지킵니다"
            : "30 min before lease — confirm operability and protect your deposit"}
          why={ko
            ? "건축물 용도, 정화조, 환기, 소방, 면허 — 이 중 하나라도 안 맞으면 영업신고 자체가 거절됩니다. 임대 계약 후 발견하면 보증금 1,000~5,000만원이 즉시 묶임. 지금은 발급이 아닌 “무엇이 필요한지” 만 파악하는 사전 매핑 단계."
            : "Use code, septic, vent, fire, license — any one mismatch denies registration. Post-lease discovery locks ₩10-50M. This is mapping, not application yet."}
          stat={{
            value: ko ? "70%" : "70%",
            label: ko ? "사전 점검 미실시 사장님 비율" : "skip pre-check rate",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 건물" : "1. Building", title: ko ? "건축물대장 → 용도·정화조·위반 표시 확인" : "Use class · septic · violation flag", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "2. 사람" : "2. Person", title: ko ? "본인 면허·위생교육·보건증 일정 확정" : "License · hygiene · health cert", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "3. 시설" : "3. Facility", title: ko ? "소방완비·환기·전기·가스 검사 가능 여부" : "Fire · vent · electrical · gas", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "4. 협상" : "4. Negotiate", title: ko ? "빠진 항목 = 임대인 협상 카드 정리" : "Gaps = negotiation cards" },
            { stepLabel: ko ? "체크리스트" : "Checklist", title: ko ? "라이브 영업 데이터 + 인허가 카드 확인" : "Live operating data + permit cards" },
          ]}
          outcome={ko
            ? "내 업종이 이 건물에서 영업 가능한지 확정. 부족한 항목은 임대인 협상 카드로 사용해 임대료 인하 또는 보강 비용 부담을 받아냅니다. 다음 단계 (상권 후보 비교) 는 영업 가능한 매물만 비교."
            : "Confirms whether your category fits the building. Gaps become negotiation leverage for rent reduction or landlord-paid upgrades. Next stage compares only viable properties."}
          nextStage={ko ? "상권 후보 비교 (location-candidates)" : "Location candidates"}
        />
      )}

      {/* ── 페이지 1: 건물 적합성 (정부24 건축물대장 + 정화조 + 위반 표시) ── */}
      {pageIdx === 1 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "1. 건물 적합성" : "1. Building"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "건축물대장으로 「용도 + 정화조 + 위반 표시」 3가지 확인" : "Verify use class + septic + violation status via building register"}
          why={ko
            ? `${hint.building}. 임대인의 말 「용도 OK」 는 절대 신뢰 X — 정부24 건축물대장으로만 검증.`
            : `${hint.building}. Don't trust landlord's verbal 'OK' — verify only via gov24 register.`}
          how={[
            { title: ko ? "정부24 (gov.kr) → 건축물대장 등본 발급" : "gov.kr → building register", detail: ko ? "무료, 5분. 「용도」 + 「위반건축물」 표시 + 「정화조 BOD 용량」 확인." : "Free, 5m. Check use class, violation flag, septic BOD." },
            { title: ko ? "근린생활시설 1·2종 여부 확인" : "Class 1/2 neighborhood-living check", detail: ko ? "음식점·카페·미용실은 「근린생활시설」 필수. 「업무시설」·「창고」·「주거시설」은 운영 불가." : "F&B/cafe/salon need Class 1/2. Office/storage/residential = not allowed." },
            { title: ko ? "정화조 용량 = 일 평균 폐수량 ÷ BOD 기준" : "Septic = avg daily wastewater / BOD", detail: ko ? "30평 식당 = 보통 7~10인용 정화조 필요. 5인용은 부족. 증축은 건물주 동의 + 1,000만원+." : "100sqm restaurant needs 7-10 person septic. 5-person = insufficient. Upgrade ₩10M+." },
          ]}
          watchouts={ko ? [
            { label: "위반건축물 표시 = 영업신고 영구 불가", text: "건축물대장에 「위반건축물」 표기 시 무조건 매물 변경. 임대료 30% 싸도 입주 절대 불가." },
            { label: "정화조 용량 부족 = 증축 1,000만원+ 또는 매물 변경", text: "건물주 동의 + 시·군청 신고 + 1~2개월 공사. 안 되면 다른 매물." },
          ] : [
            { label: "Violation flag = permanent denial", text: "Walk away. No amount of cheaper rent justifies this." },
            { label: "Insufficient septic = ₩10M+ upgrade", text: "Landlord consent + city + 1-2 months. If unavailable, different property." },
          ]}
        />
      )}

      {/* ── 페이지 1: 사람 적합성 (면허·보건증·위생교육) ── */}
      {pageIdx === 2 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "2. 사람 적합성" : "2. Person"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "면허·보건증·위생교육 — 영업 시작 전 의무" : "License · health cert · hygiene training before launch"}
          why={ko
            ? `${hint.person}. 영업 시작 후 발견하면 즉시 영업 정지 + 과태료. 사전에 일정 잡아두면 영업 시작 지연 0.`
            : `${hint.person}. Discovery after launch = immediate suspension. Schedule ahead = zero launch delay.`}
          how={[
            { title: ko ? "본인 면허 보유 여부 확인" : "Verify owner's license status", detail: ko ? "미용·이용 = 미용사 면허 / 식품접객업 = 위생교육 6시간 + 보건증 / 학원 = 강사 자격." : "Salon = beautician license / F&B = 6h hygiene + health cert / academy = instructor cert." },
            { title: ko ? "위생교육 6시간 사전 신청 (식품접객업)" : "Pre-register 6h hygiene course", detail: ko ? "한국외식업중앙회 또는 식품위생교육원. 영업 시작 전 의무. 미이수 시 영업신고 거절." : "KFIA or hygiene institute. Mandatory pre-launch. No cert = registration denied." },
            { title: ko ? "보건증 (건강진단결과서) — 본인 + 종업원 전원" : "Health cert — owner + all staff", detail: ko ? "보건소 or 지정 의료기관 1만원. 1년 유효. 갱신 D-day 이후 영업 불가." : "Public health center / designated clinic ~₩10K. Valid 1 year. Renew before expiry." },
          ]}
          watchouts={ko ? [
            { label: "면허자 채용에만 의존 = 퇴사 시 즉시 무자격 영업", text: "본인이 면허 없을 때 채용 면허자가 퇴사하면 그날부터 무자격 영업. 본인 면허 취득 또는 2명+ 채용으로 분산." },
          ] : [
            { label: "Relying on hired licensee = immediate shutdown on quit", text: "If you don't hold the license and your hire quits, you operate illegally that day. Get your own license or hire 2+." },
          ]}
        />
      )}

      {/* ── 페이지 2: 시설 적합성 (소방·환기·안전) ── */}
      {pageIdx === 3 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "3. 시설 적합성" : "3. Facility"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "소방완비증명서 + 환기·후드 + 가스·전기 안전 확인" : "Fire cert + ventilation + gas/electrical safety"}
          why={ko
            ? `${hint.facility}. 시설 미달 시 영업신고 거절 또는 영업 중 단속·과태료. 임대 전에 보강 가능 여부 확인.`
            : `${hint.facility}. Insufficient facility = denied registration or mid-operation suspension. Verify upgradeability before lease.`}
          how={[
            { title: ko ? "소방완비증명서 — 2층 이상 OR 100㎡↑" : "Fire cert — 2F+ or 100sqm+", detail: ko ? "관할 소방서 신청. 100~300만원 + 2~3주. 다중이용업소는 의무." : "Local fire dept. ₩1-3M + 2-3 weeks. Mandatory for multi-use." },
            { title: ko ? "환기·후드 (음식점) — 외부 덕트 가능 여부" : "Vent hood (F&B) — exterior duct viability", detail: ko ? "치킨·중식·고깃집은 대형 후드 + 외부 배기 필수. 외부 덕트 불가 매물은 운영 불가." : "Chicken/Chinese/BBQ requires hood + exterior duct. No exterior = unworkable." },
            { title: ko ? "전기 용량 (카페 30A↑) + 가스 시설 검사" : "Electrical 30A+ (cafe) + gas inspection", detail: ko ? "에스프레소+오븐+제빙 동시 가동 시 30A 필수. 가스 시설은 한국가스안전공사 검사 필수." : "Cafe with simultaneous machines needs 30A. Gas requires KGS inspection." },
          ]}
          watchouts={ko ? [
            { label: "외부 환기 덕트 불가 매물 = 음식점 운영 불가능", text: "공동주택·창문 없음·옥상 미사용 매물에서는 후드 설치 불가. 임대 전 환기 동선 직접 확인." },
            { label: "가스시설 검사 미통과 = 영업신고 거절", text: "한국가스안전공사 검사 필수. 임대인이 「검사 통과 매물」이라 해도 직접 증명서 확인." },
          ] : [
            { label: "No exterior vent = F&B impossible", text: "Apartments / no-window / no-roof access prevent hood install. Verify ventilation route before lease." },
            { label: "Failed gas inspection = denied registration", text: "KGS inspection mandatory. Get certificate copy from landlord, don't trust verbal claim." },
          ]}
        />
      )}

      {/* ── 페이지 3: 임대인 협상 카드 + 사장님 상황 권장 ── */}
      {pageIdx === 4 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "4. 임대인 협상" : "4. Landlord negotiation"}
          time={ko ? "다음" : "Next"}
          headline={ko ? "빠진 항목 = 임대인 협상 카드 — 사인 전 특약으로 명시" : "Gaps = negotiation cards — write into special clauses BEFORE signing"}
          why={ko
            ? "정화조·환기·전기 부족 = 임대료 5% 인하 또는 보강 비용 임대인 부담. 사인 전 특약 명시 못 받으면 매물 변경."
            : "Septic/vent/electrical gaps = 5% rent reduction or landlord-paid upgrades. No clause = walk away."}
          how={[
            { title: ko ? "후보 매물 3곳에 같은 질문" : "Same questions to 3 candidates", detail: ko ? `「${hint.building} 가능?」 + 「${hint.facility} 보강 가능?」 + 「검사 증명서 보유?」 — 답변 거부 임대인은 패스.` : `Confirm ${hint.building} + ${hint.facility} upgrade + inspection cert. Non-responsive = pass.` },
            { title: ko ? "보강 가능 항목 = 비용 분담 특약" : "Upgradeable = cost-share clause", detail: ko ? "「임대인이 1/2 부담 + 임차 종료 시 원상복구 면제」 사인 전 특약. 평균 500만원 절약." : "'Landlord 50% + restoration exempt' clause. Average ₩5M saved." },
            { title: ko ? "다음 단계 (상권 후보 비교) 로 진행" : "Proceed to market comparison", detail: ko ? "건물·사람·시설 3축 모두 통과한 매물만 다음 단계로. 협상 거부 매물은 후보에서 제외." : "Only candidates passing all 3 axes proceed. Decline non-negotiating landlords." },
          ]}
          favorable={{ context: myNegotiateTip.context, recommendation: myNegotiateTip.recommendation, rationale: myNegotiateTip.rationale }}
        />
      )}

      {/* ── 페이지 4 (체크리스트) 만 — 라이브 인사이트 + 인허가 체크리스트 ──
          사용자 피드백: 3축 점검·작업 흐름·Pitfall 카드는 페이지 0~2 의 새 흐름 블록과 중복이라 제거. */}
      {pageIdx === 5 && (
        <>
      {/* ── Panel 1: 영업 현황 데이터 ── */}
      {(() => {
        if (!livePermitInsights || livePermitInsights.loading) {
          return (
            <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(234,88,12,0.08)", background: "linear-gradient(180deg, rgba(255,237,213,0.1) 0%, rgba(255,255,255,0.9) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c", animation: "bentoPulse 1.5s infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "사업자 현황 데이터 조회 중..." : "Loading permit data..."}</span>
              </div>
            </div>
          );
        }

        if (!livePermitInsights.data) return null;
        const ins = livePermitInsights.data;
        const rateColor = ins.survivalRate >= 70 ? "#059669" : ins.survivalRate >= 50 ? "#d97706" : "#dc2626";

        return (
          <div style={{ marginBottom: "16px", borderRadius: "20px", border: `1px solid ${rateColor}15`, background: `linear-gradient(180deg, ${rateColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
            <div style={{ padding: "18px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: rateColor }} />
                <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "영업 현황 데이터" : "Business Permit Status"}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "지방행정인허가 데이터 기반" : "Based on LOCALDATA Permit API"}</div>
            </div>
            {/* 2026-05-19 모바일: 4 column → auto-fit minmax 으로 모바일은 2 col, 데스크탑은 4 col */}
            <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "전체 등록" : "Total"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{ins.total.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.06)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "영업 중" : "Active"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#059669" }}>{ins.operating.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(220,38,38,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "폐업" : "Closed"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#dc2626" }}>{ins.closed.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "생존율" : "Survival"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: rateColor }}>{ins.survivalRate}%</div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "2px", width: `${ins.survivalRate}%`, background: rateColor, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Panel 2: 인허가 업종별 체크리스트 카드 ── */}
      {permitSet && (
        <div style={{ marginBottom: "16px" }} className="bento-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? `${permitSet.label.ko} 인허가 체크리스트` : `${permitSet.label.en} Permit Checklist`}</span>
            </div>
            {totalCost > 0 && (
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                {ko ? `예상 비용: 약 ${Math.round(totalCost / 10000).toLocaleString()}만원` : `Est. cost: ~₩${totalCost.toLocaleString()}`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {permitSet.permits.map((permit: { id: string; name: { ko: string; en: string }; priority: string; agency: { ko: string; en: string }; costWon: number; costNote?: { ko: string; en: string }; duration: { ko: string; en: string }; applyUrl?: string; documents: Array<{ ko: string; en: string }>; steps: Array<{ ko: string; en: string }>; warnings?: Array<{ ko: string; en: string }> }, idx: number) => {
              const isExpanded = expandedPermitId === permit.id;
              return (
                <div key={permit.id} style={{ borderRadius: "16px", border: `1px solid ${isExpanded ? priorityColor(permit.priority) + "30" : "rgba(0,0,0,0.06)"}`, background: isExpanded ? `${priorityColor(permit.priority)}04` : "#fff", overflow: "hidden", transition: "all 0.2s ease" }}>
                  <button type="button" onClick={() => setExpandedPermitId(isExpanded ? null : permit.id)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${priorityColor(permit.priority)}15`, color: priorityColor(permit.priority), textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>{priorityLabel(permit.priority)}</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>{ko ? permit.name.ko : permit.name.en}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? permit.duration.ko : permit.duration.en}</span>
                      <span style={{ fontSize: "12px", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px", marginBottom: "14px" }}>
                        <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "신청 기관" : "Agency"}</div>
                          <div style={{ fontSize: "13px", fontWeight: 550 }}>{ko ? permit.agency.ko : permit.agency.en}</div>
                        </div>
                        <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "비용" : "Cost"}</div>
                          <div style={{ fontSize: "13px", fontWeight: 550 }}>{permit.costWon === 0 ? (ko ? "무료" : "Free") : `${permit.costWon.toLocaleString()}원`}</div>
                          {permit.costNote && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? permit.costNote.ko : permit.costNote.en}</div>}
                        </div>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "절차" : "Steps"}</div>
                        {permit.steps.map((step: { ko: string; en: string }, si: number) => (
                          <div key={si} style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "13px", lineHeight: 1.5 }}>
                            <span style={{ color: priorityColor(permit.priority), fontWeight: 700, minWidth: "16px" }}>{si + 1}.</span>
                            <span>{ko ? step.ko : step.en}</span>
                          </div>
                        ))}
                      </div>
                      {permit.documents.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "필요 서류" : "Documents"}</div>
                          {permit.documents.map((doc: { ko: string; en: string }, di: number) => (
                            <div key={di} style={{ fontSize: "13px", lineHeight: 1.6, paddingLeft: "12px" }}>• {ko ? doc.ko : doc.en}</div>
                          ))}
                        </div>
                      )}
                      {permit.warnings && permit.warnings.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                          {permit.warnings.map((w: { ko: string; en: string }, wi: number) => (
                            <div key={wi} style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>⚠ {ko ? w.ko : w.en}</div>
                          ))}
                        </div>
                      )}
                      {permit.applyUrl && (
                        <a href={permit.applyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                          {ko ? "온라인 신청 바로가기 →" : "Apply Online →"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </>
  );
}
