"use client";

/**
 * RegistrationSetupStage — 사업자 등록 + 인허가 신고 (Stage 10)
 *
 * 2026-04 전면 리빌드:
 *   • 미드나이트 블루(#191970) Apple-style UI 통일 (VendorSetupStage 패턴)
 *   • WHY / HOW / PATH 흐름 — 왜 필요한가, 어떻게 하는가, 사용자 상황별 유리한 방향
 *   • 카테고리별 (음식·카페·미용·헬스·학원·펫·세탁·공간·온라인) 인허가 가지치기
 *   • 2026 최신 법령:
 *       - 간이과세 기준 1억 400만원 (부가세법 시행령 109조 — 2026 인상)
 *       - 부가세 면제 4,800만원 미만
 *       - 사업개시일 20일 이내 등록 의무
 *       - 음식점업 부가가치율 15%
 *
 *  검증 출처:
 *   • 국세청 / 홈택스 / 정부24 (공식)
 *   • 찾기쉬운 생활법령정보 — 미용·음식·통신판매업
 *   • portone.io 2026 간이과세 변경 정리
 */

import { useMemo, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Sparkles,
  Receipt,
  ExternalLink,
  ArrowRight,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
} from "../startup/StartupStageShell";
import { StoreNameInput } from "../shared/StoreNameInput";
import { StageWrapup } from "../shared/StageWrapup";
import { BusinessDocumentUpload } from "../../my-store/BusinessDocumentUpload";

/* ───────────────────────────────────────────────────────────────────
 * 카테고리별 인허가 데이터 (2026 검증)
 * ───────────────────────────────────────────────────────────────── */

type PermitInfo = {
  /** 인허가 종류 (예: "영업신고", "영업허가", "등록") */
  kind: "신고" | "허가" | "등록" | "면허";
  /** 정확한 명칭 */
  name: string;
  /** 신청 장소 */
  where: string;
  /** 비용 (대략) */
  cost: string;
  /** 소요 기간 */
  duration: string;
  /** 필요 서류 */
  documents: string[];
  /** 시설 기준 / 주요 요건 */
  requirements: string[];
  /** 외부 링크 */
  externalUrl?: string;
  /** 카테고리 한 줄 설명 */
  description: string;
};

const PERMIT_BY_CATEGORY: Record<string, PermitInfo> = {
  food: {
    kind: "신고",
    name: "일반음식점 영업신고 (식품위생법)",
    where: "관할 구청 위생과 또는 정부24",
    cost: "약 5.7만원 (위생교육 2.6만 + 보건증 보건소 3천원 + 신고수수료 2.8만). 민간병원 보건증 시 1.5~3만원 추가",
    duration: "7~14일 (현장점검 포함)",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "위생교육 수료증 (한국외식업중앙회)",
      "건강진단결과서 (보건증)",
      "건축물대장 — 근린생활시설 확인",
      "평면도 (주방·홀 분리 표시)",
    ],
    requirements: [
      "주방과 객석은 벽·칸막이로 명확히 구분",
      "조리장 바닥·벽은 내수성 자재",
      "건축물 용도 = 근린생활시설 (1·2종)",
      "환기·조명·급수·하수 시설 갖춤",
      "공동 화장실 운영 시 위생 기준 별도",
    ],
    externalUrl: "https://www.gov.kr",
    description: "식품을 조리·판매하는 매장은 영업신고 필수. ⚠ 미신고 영업은 식품위생법 §97(6) 형사처벌 — **3년 이하 징역 또는 3천만원 이하 벌금** + 영업장 폐쇄 명령. (단순 과태료 아님)",
  },
  "cafe-dessert": {
    kind: "신고",
    name: "휴게음식점 영업신고 (식품위생법)",
    where: "관할 구청 위생과 또는 정부24",
    cost: "약 5.7만원 (위생교육 2.6만 + 보건증 보건소 3천원 + 수수료 2.8만). 민간병원 보건증 시 1.5~3만원 추가",
    duration: "7~14일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "위생교육 수료증 (한국휴게음식업중앙회)",
      "건강진단결과서 (보건증)",
      "건축물대장",
      "평면도",
    ],
    requirements: [
      "휴게음식점은 주류 판매 불가",
      "주방·객석 분리 (음식점 동일)",
      "근린생활시설 용도 확인",
      "베이커리·디저트 자체 제조 시 별도 식품제조가공업 신고 검토",
    ],
    externalUrl: "https://www.gov.kr",
    description: "커피·차·음료·다과 판매. 주류 안 팔면 휴게음식점, 팔면 일반음식점으로 신고",
  },
  beauty: {
    kind: "신고",
    name: "미용업 영업신고 (공중위생관리법)",
    where: "관할 시·군·구청 위생과",
    cost: "약 4만원 (위생교육 약 3만 + 신고수수료 1만)",
    duration: "3~7일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "미용사 면허증 (대표자 또는 종사자)",
      "위생교육 수료증",
      "시설 평면도",
    ],
    requirements: [
      "미용사 면허 보유자가 1인 이상 상주 (면허 없이 영업 불가)",
      "피부미용업은 별도 시설기준 (관리실·소독실 분리)",
      "소독장비·1회용품 비치",
      "조명·환기·급배수 시설",
    ],
    externalUrl: "https://www.gov.kr",
    description: "헤어·네일·피부·왁싱·속눈썹·메이크업 모두 미용업 신고. 면허 없이 영업 시 형사처벌",
  },
  fitness: {
    kind: "신고",
    name: "체육시설업 신고 (체육시설의 설치·이용에 관한 법률)",
    where: "관할 시·군·구청 체육진흥과",
    cost: "약 5만원 (수수료 + 시설점검)",
    duration: "10~30일 (현장점검 포함)",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "체육지도자 자격증 (필요 종목별)",
      "시설 평면도",
      "안전관리계획서",
    ],
    requirements: [
      "필라테스·요가 = 신고 대상 / 단순 PT 스튜디오는 자유업 가능",
      "샤워실·탈의실 별도 (헬스장 30평 이상)",
      "AED(자동심장충격기) 비치 의무 (체육시설업 일부)",
      "스포츠 보험 가입",
    ],
    externalUrl: "https://www.gov.kr",
    description: "헬스·필라테스·요가·골프스튜디오 등 일정 규모 이상은 체육시설업 신고. 무신고 시 영업정지 + 과태료",
  },
  education: {
    kind: "등록",
    name: "학원 설립·운영 등록 (학원법)",
    where: "관할 교육지원청",
    cost: "약 5~15만원 (등록면허세 포함)",
    duration: "20~30일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "강사 자격 증명",
      "교습계획서·교습비 산출표",
      "시설 평면도",
      "건축물 용도 (교육연구시설 또는 근린생활시설 일부)",
    ],
    requirements: [
      "교습면적 1인당 최소 1.65㎡ (보통 30평 = 50명 한도)",
      "환기·채광·소방시설 검사",
      "건축물 용도 — 학원 가능 용도 확인 필수",
      "교습비 등록 신고 (교육청 게시 의무)",
    ],
    externalUrl: "https://www.gov.kr",
    description: "학원·교습소·공부방 모두 교육청 등록 필수. 단, 1:1 과외는 신고만 (소득세법)",
  },
  pet: {
    kind: "허가",
    name: "동물미용업 등록 (동물보호법)",
    where: "관할 시·군·구청 축산과",
    cost: "약 3~5만원",
    duration: "7~14일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "동물 미용사 자격증 (권장)",
      "시설 평면도",
      "동물 사체 처리 계획",
    ],
    requirements: [
      // 2026-05-12 P1: 동물보호법 시행규칙 별표 11 (2025-08-07 농림축산식품부령 제745호 개정) 반영.
      // 미용작업실 분리 + UV살균기 + 고정장치 + 냉온수·건조기 의무 명시.
      "★ 미용작업실 + 동물대기실 + 고객응대실 분리/구획 (시행규칙 별표 11, 2025-08-07 개정)",
      "★ 미용작업실에 소독기 + 자외선(UV)살균기 등 미용기구 소독장비 의무",
      "★ 작업대 동물 고정장치 + 냉온수 설비 + 건조기 (동물 안전·위생 최저기준)",
      "영업장 독립 건물이거나 다른 용도 시설과 벽/층으로 분리",
      "동물 학대·방치 금지 (동물보호법 §10, 위반 시 3년 이하 징역)",
      "펫 호텔 운영 시 동물위탁관리업 별도 등록 (허가영업 별표 10)",
      "⚠ 2026-06-03 시행 동물보호법 — 동물생산업자 12개월 이상 강아지·고양이 등록 신규 의무",
    ],
    externalUrl: "https://www.gov.kr",
    description: "펫 미용·호텔·훈련소 모두 동물보호법상 영업등록 의무. 무등록 영업 시 형사처벌. 2025-08-07 시행규칙 개정으로 시설기준 강화 — 별표 11 직접 확인 권장",
  },
  retail: {
    kind: "신고",
    name: "사업자등록만으로 충분 (일반 소매업)",
    where: "세무서 / 홈택스",
    cost: "무료",
    duration: "1~3일",
    documents: ["사업자등록증"],
    requirements: [
      "건강기능식품 판매 — 별도 영업신고 필요 (식약처)",
      "주류 판매 — 주류판매업 면허 별도",
      "담배 판매 — 담배소매인 지정 별도",
      "의약품·의료기기 — 별도 인허가",
    ],
    externalUrl: "https://www.hometax.go.kr",
    description: "일반 소매(잡화·의류·생활용품)는 사업자등록만으로 영업 가능. 단, 특수 품목은 별도 인허가",
  },
  "living-service": {
    kind: "신고",
    name: "공중위생영업 (세탁업·청소업)",
    where: "관할 시·군·구청 위생과",
    cost: "약 3~5만원",
    duration: "7~14일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "위생교육 수료증",
      "시설 평면도",
    ],
    requirements: [
      "세탁업 — 세제 보관·작업 공간 분리",
      "청소업 — 별도 신고 불필요 (자유업)",
      "수리업 — 별도 신고 불필요 (자유업)",
      "무인 셀프 세탁 — 위생업 신고 + CCTV·소화기 의무",
    ],
    externalUrl: "https://www.gov.kr",
    description: "세탁업은 위생업 신고. 청소·수리·인쇄는 사업자등록만으로 영업 가능 (자유업)",
  },
  space: {
    kind: "허가",
    name: "용도별 인허가 분기 (게스트하우스·스튜디오·공유오피스)",
    where: "관할 시·군·구청 (용도별 다름)",
    cost: "5~30만원 (용도별 차이)",
    duration: "14~60일",
    documents: [
      "사업자등록증",
      "임대차계약서",
      "건축물대장 (용도 확인 핵심)",
      "용도별 추가 서류",
    ],
    requirements: [
      "게스트하우스 — 농어촌민박 또는 외국인관광 도시민박업 (관할 행정기관)",
      "파티룸·스튜디오 — 사업자등록만 (자유업)",
      "공유오피스 — 사업자등록만 (자유업)",
      "스터디카페 — 일부 지역은 학원법 적용 검토",
      "건축물 용도가 핵심 — '근린생활시설' 또는 '숙박시설' 확인",
    ],
    externalUrl: "https://www.gov.kr",
    description: "공간 임대업은 용도별로 인허가가 크게 다름. 게스트하우스는 숙박업 신고 / 스튜디오·오피스는 자유업",
  },
  "online-digital": {
    kind: "신고",
    name: "통신판매업 신고 (전자상거래법)",
    where: "관할 시·군·구청 또는 정부24",
    cost: "약 4.5만원 (등록면허세)",
    duration: "3~7일",
    documents: [
      "사업자등록증",
      "구매안전서비스 이용확인증 (PG사 또는 에스크로)",
      "사이트 URL / 도메인",
    ],
    requirements: [
      "온라인 판매 매장 = 통신판매업 신고 필수 (전자상거래법 12조)",
      "구매안전서비스(에스크로) 가입 증빙 필요",
      "단, 직전년 거래 50건 미만 + 거래액 5천만 미만 = 신고 면제",
      "사업자등록 번호 + 통신판매업 신고번호 사이트에 게시 의무",
    ],
    externalUrl: "https://www.gov.kr",
    description: "스마트스토어·쿠팡·자체몰 모두 통신판매업 신고. 미신고 시 1차 50만원 과태료",
  },
};

/* ───────────────────────────────────────────────────────────────────
 * Sub-component primitives (this file local — VendorSetup pattern 차용)
 * ───────────────────────────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: MIDNIGHT_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "1px" }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StepRow({
  number,
  title,
  detail,
  isLast,
}: {
  number: number;
  title: string;
  detail: string;
  isLast?: boolean;
}) {
  return (
    <>
      <div style={{ display: "flex", gap: "12px", padding: "14px 16px", alignItems: "flex-start", background: "white" }}>
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: MIDNIGHT,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            flexShrink: 0,
            marginTop: "1px",
          }}
        >
          {number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "3px" }}>
            {title}
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{detail}</div>
        </div>
      </div>
      {!isLast && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "50px" }} />}
    </>
  );
}

function MetaPair({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "12px 14px",
        borderRadius: "10px",
        background: MIDNIGHT_SOFT,
        textAlign: "center" as const,
      }}
    >
      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
        {label}
      </div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: MIDNIGHT, marginTop: "3px" }}>{value}</div>
      {sublabel && (
        <div style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.55)", marginTop: "1px" }}>{sublabel}</div>
      )}
    </div>
  );
}

function PathCard({
  condition,
  recommendation,
  reason,
}: {
  condition: string;
  recommendation: string;
  reason: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "12px",
        background: "white",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            background: MIDNIGHT_SOFT,
            fontSize: "11px",
            fontWeight: 700,
            color: MIDNIGHT,
            flexShrink: 0,
            marginTop: "1px",
            whiteSpace: "nowrap" as const,
          }}
        >
          {condition}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", lineHeight: 1.4 }}>
            → {recommendation}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{reason}</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * Main component
 * ───────────────────────────────────────────────────────────────── */

export function RegistrationSetupStage() {
  const d = useDashboardCtx();
  const { industryCategoryId, language } = d;

  // 페이지네이션 — 4페이지 (왜 / 1단계 사업자등록 / 2단계 인허가 / 유리한 길)
  const [page, setPage] = useState(0);
  const totalPages = 4;
  const pageLabels = ["왜 필요한가", "1. 사업자등록", "2. 인허가", "유리한 길"];

  const permit = useMemo(() => {
    return PERMIT_BY_CATEGORY[industryCategoryId ?? ""] ?? PERMIT_BY_CATEGORY.food;
  }, [industryCategoryId]);

  // 카테고리 한국어 라벨
  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      food: "음식점",
      "cafe-dessert": "카페·디저트",
      beauty: "미용·뷰티",
      fitness: "피트니스",
      education: "학원",
      pet: "반려동물 서비스",
      retail: "소매·리테일",
      "living-service": "생활 서비스",
      space: "공간 임대",
      "online-digital": "온라인·디지털",
    };
    return map[industryCategoryId ?? ""] ?? "일반";
  }, [industryCategoryId]);

  return (
    <div className="bento-fade-in" style={{ marginBottom: "16px" }}>
      {/* ═══════════════════════════════════════════════════════════
          KEY ACTION HERO
          ═════════════════════════════════════════════════════════ */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title="사업자등록 + 인허가 — 영업 시작 전 반드시 끝낼 두 가지"
        subtitle={
          <>
            <strong style={{ fontWeight: 700 }}>임대차계약 직후 가장 먼저</strong> 해야 할 단계.
            사업자등록만 있으면 영업이 가능한 업종도 있지만, 음식·미용·헬스 등은
            <strong style={{ fontWeight: 700 }}> 별도 인허가 없이는 단 하루도 영업 불가</strong>합니다.
          </>
        }
        miniCards={[
          { icon: FileText, label: "1️⃣ 사업자등록", detail: "무료 · 1~3일 · 홈택스" },
          { icon: ShieldCheck, label: "2️⃣ 인허가", detail: `${(permit.cost.split("(")[0] ?? permit.cost).trim()} · ${(permit.duration.split("(")[0] ?? permit.duration).trim()}` },
          { icon: Building2, label: "둘 다 필수", detail: "미신고 영업 = 과태료+폐쇄" },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════
          PAGE NAV
          ═════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "16px" }}>
        <StartupPageNav page={page} totalPages={totalPages} labels={pageLabels} onChange={setPage} />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 0 — WHY: 왜 이 단계가 필요한가
          ═════════════════════════════════════════════════════════ */}
      {page === 0 && (
      <Section icon={Lightbulb} title="왜 이 단계가 중요한가" subtitle="법적 의무 + 비즈니스 운영의 전제 조건">
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                accent: MIDNIGHT,
                title: "법적 의무 — 미등록·미신고는 즉시 처벌 대상",
                body: "사업개시일로부터 20일 이내 사업자등록 의무 (부가가치세법). 식품접객업 미신고 영업은 식품위생법 §97(6) 형사처벌 — **3년 이하 징역 또는 3천만원 이하 벌금** + 영업장 폐쇄. 단순 과태료가 아닙니다.",
              },
              {
                accent: "#0561fc",
                title: "운영 인프라의 전제 조건",
                body: "사업자등록증이 없으면 사업용 통장 개설, 카드 단말기 가입(POS), 세금계산서 발행, 배달앱·플랫폼 입점이 모두 불가능합니다. 실질적으로 매출이 0원으로 묶입니다.",
              },
              {
                accent: "#dc2626",
                title: "순서가 중요 — 두 절차는 '병렬'이 아니라 '순차'",
                body: "사업자등록증 없이는 인허가 신청도 안 됩니다. ① 임대차계약 → ② 사업자등록 → ③ 인허가 → ④ 매장 오픈 순서. 위생교육·보건증은 사업자등록과 병행 가능 (시간 절약).",
              },
            ].map((item, idx, arr) => (
              <div key={idx}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "100px",
                      background: item.accent,
                      marginTop: "8px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "4px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
                      {item.body}
                    </div>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "18px", marginTop: "10px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — HOW Step 1: 사업자등록
          ═════════════════════════════════════════════════════════ */}
      {page === 1 && (
      <>
      {/* 상호명 — 사업자등록 직전 결정 (등록증·간판·통장·SNS 모두 동일 사용) */}
      <div style={{ marginBottom: "14px" }}>
        <StoreNameInput
          helperText="홈택스 사업자등록 신청 화면에 입력할 상호입니다. 등록 후 변경하려면 등록증 재발급이 필요하므로 신중히 결정하세요. KIPRIS에서 동일 상표 등록 여부 확인 권장."
        />
      </div>
      <Section
        icon={FileText}
        title="1단계 · 사업자등록 (홈택스)"
        subtitle="모든 업종 공통 — 사업개시 20일 이내 의무"
      >
        <StepRow
          number={1}
          title="홈택스 접속 → 사업자등록 신청"
          detail="공동인증서·간편인증 로그인 필요. 인증서가 없으면 관할 세무서 직접 방문 (당일 발급 가능)"
        />
        <StepRow
          number={2}
          title="업종코드 입력"
          detail="음식점 552111 (한식) · 카페 552302 · 미용 961101 · 학원 855010 · 펫미용 749930 · 통신판매 525101 — 국세청 업종코드 조회로 정확히 확인"
        />
        <StepRow
          number={3}
          title="사업장 주소 = 임대차계약서 주소"
          detail="계약서 사본 첨부 필수. 무인·자택 사무소도 가능 (단, 일부 업종은 시설 기준 불충족 시 인허가 거절)"
        />
        <StepRow
          number={4}
          title="과세유형 선택 (간이 / 일반)"
          detail="2026년 기준 직전년 매출 1억 400만원 미만 → 간이과세 가능. 신규 사업자도 예상 매출이 이 이하면 간이로 시작 추천 (부가세 부담 1.5~4% 수준)"
        />
        <StepRow
          number={5}
          title="제출 → 즉일~3영업일 발급 → 사업용 통장 개설"
          detail="등록증 발급 직후 ① 사업용 통장 ② 사업용 카드 ③ 카드 단말기(POS) 가맹 신청 동시 진행"
          isLast
        />

        {/* meta */}
        <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <MetaPair label="비용" value="무료" />
          <MetaPair label="소요" value="1~3일" />
          <MetaPair label="장소" value="홈택스" sublabel="또는 세무서" />
        </div>

        {/* 외부 링크 */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, padding: "0 16px 14px" }}>
          {[
            { label: "홈택스 사업자등록", url: "https://www.hometax.go.kr" },
            { label: "정부24 사업자등록", url: "https://www.gov.kr/portal/service/serviceInfo/PTR000050466" },
            { label: "업종코드 조회", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2444&cntntsId=7777" },
            { label: "간이과세 기준 (2026)", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272" },
          ].map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: MIDNIGHT_SOFT,
                border: `1px solid ${MIDNIGHT_BORDER}`,
                fontSize: "12px",
                fontWeight: 600,
                color: MIDNIGHT,
                textDecoration: "none",
              }}
            >
              {link.label}
              <ExternalLink size={12} strokeWidth={2.2} />
            </a>
          ))}
        </div>
      </Section>
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — HOW Step 2: 인허가 (카테고리별 분기) + 트랩
          ═════════════════════════════════════════════════════════ */}
      {page === 2 && (
      <>
      <Section
        icon={ShieldCheck}
        title={`2단계 · ${permit.name}`}
        subtitle={`${categoryLabel} 업종 — ${permit.description}`}
      >
        {/* 신청 위치 강조 박스 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: MIDNIGHT_SOFT,
            borderBottom: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              신청 장소
            </div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT, marginTop: "2px" }}>{permit.where}</div>
          </div>
          {permit.externalUrl && (
            <a
              href={permit.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                background: MIDNIGHT,
                color: "#fff",
                fontSize: "12.5px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
              }}
            >
              바로가기
              <ExternalLink size={12} strokeWidth={2.4} />
            </a>
          )}
        </div>

        {/* 필요 서류 */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            필요 서류 ({permit.documents.length}종)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {permit.documents.map((doc) => (
              <div
                key={doc}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  background: "white",
                  border: `1px solid ${MIDNIGHT_BORDER}`,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {doc}
              </div>
            ))}
          </div>
        </div>

        {/* 시설 / 요건 */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            핵심 요건
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
            {permit.requirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>

        {/* meta — ⚠️ 2026-05-18: split(" ")[0] 은 "약 6.6만원 (위생교육 ...)" 에서 "약" 만 잘라
            value 가 "약" 으로 표시되는 버그. 괄호 앞 전체를 value 로, 괄호 안은 sublabel 로 분리. */}
        <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <MetaPair
            label="비용"
            value={(permit.cost.split("(")[0] ?? permit.cost).trim()}
            sublabel={permit.cost.includes("(") ? permit.cost.split("(")[1].replace(")", "").trim() : undefined}
          />
          <MetaPair
            label="소요"
            value={(permit.duration.split("(")[0] ?? permit.duration).trim()}
            sublabel={permit.duration.includes("(") ? permit.duration.split("(")[1].replace(")", "").trim() : undefined}
          />
          <MetaPair label="유형" value={permit.kind} sublabel={permit.kind === "신고" ? "알림" : permit.kind === "허가" ? "금지 해제" : permit.kind === "등록" ? "기록 등재" : "자격 부여"} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          ⚠️ 카테고리별 함정
          ═════════════════════════════════════════════════════════ */}
      {(industryCategoryId === "food" || industryCategoryId === "cafe-dessert") && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "14px",
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.18)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={18} strokeWidth={2.2} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#dc2626", marginBottom: "4px" }}>
              자주 거절되는 사유 — 사전 확인 필수
            </div>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
              <li>주방과 객석이 벽·칸막이로 명확히 구분 안 됨</li>
              <li>건축물 용도가 '근린생활시설'이 아닌 경우 (주거시설 등)</li>
              <li>환기·하수·급수 시설 미비 — 임대 전 시설 점검 필수</li>
              <li>지하층·반지하 영업 시 별도 요건 적용</li>
            </ul>
          </div>
        </div>
      )}
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — PATH: 사용자 상황별 유리한 방향 + 체크리스트 + 다음 단계
          ═════════════════════════════════════════════════════════ */}
      {page === 3 && (
      <>
      <Section
        icon={Receipt}
        title="당신 상황에 유리한 길"
        subtitle="과세유형·면허·시기 — 첫 1년 손실 막는 결정"
      >
        <div style={{ padding: "14px 16px" }}>
          <PathCard
            condition="예상 매출 4,800만 미만"
            recommendation="간이과세 + 부가세 면제 활용"
            reason="2026년 기준 매출 4,800만 미만은 부가세 납부 의무 자체가 면제. 1년차 카페·소형 매장에게 가장 유리. 단, 세금계산서 발행은 불가하므로 B2B 거래 비중이 크면 일반 검토."
          />
          <PathCard
            condition="예상 매출 4,800만 ~ 1억 400만"
            recommendation="간이과세 (낮은 부가세율 1.5~4%)"
            reason="음식점 부가가치율 15% × 10% = 실질 부가세율 약 1.5%. 일반과세 10% 대비 부담 큰 폭 감소. 단, 매입세액 환급 비율도 낮음 (0.5%)."
          />
          <PathCard
            condition="예상 매출 1억 400만 초과"
            recommendation="일반과세 (자동) + 매입세액 환급 적극 활용"
            reason="간이과세 불가능. 인테리어·장비·식자재 매입 시 발행받은 세금계산서로 부가세 환급 받기. 분기마다 부가세 신고 (4월·7월·10월·1월)."
          />
          <PathCard
            condition="B2B 거래 비중 높음 (납품·도매·기업대상)"
            recommendation="처음부터 일반과세로 등록"
            reason="간이과세는 세금계산서 발행 불가 → 거래처가 매입세액 환급 못 받음 → 거래 거부 위험. 일반으로 시작이 안전."
          />
          {(industryCategoryId === "beauty" || industryCategoryId === "fitness" || industryCategoryId === "education" || industryCategoryId === "pet") && (
            <PathCard
              condition={`${categoryLabel} 업종 특성`}
              recommendation="자격증·면허 확인이 등록 거절 1순위 사유"
              reason={
                industryCategoryId === "beauty"
                  ? "미용사 면허는 시술자 본인이 보유해야 함. 면허 없는 직원만으로는 영업 불가. 시·도 검정 합격 후 발급 (시험 응시료 포함 약 5만원)."
                  : industryCategoryId === "fitness"
                    ? "체육지도자 자격은 종목별로 다름 (생활스포츠지도사 2급 이상). PT 트레이너 채용 시 자격 사전 확인."
                    : industryCategoryId === "education"
                      ? "강사 자격 (학력·전공·경력)은 교습 분야별로 다름. 학력증명·강사이력 미리 준비. 교습비는 등록·게시 의무."
                      : "동물미용업·위탁관리업 분리 등록 필요. 호텔 운영 시 두 가지 모두 신청해야 함."
              }
            />
          )}
          {industryCategoryId === "online-digital" && (
            <PathCard
              condition="첫해 거래 50건 미만 + 거래액 5천만 미만 예상"
              recommendation="통신판매업 신고 면제 — 사업자등록만으로 시작"
              reason="전자상거래법 12조 단서. 단, 거래량이 늘면 즉시 신고 의무. 미신고 영업 시 1차 50만원 과태료. 마진과 시간을 비교해 신고 결정."
            />
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          이번 주 체크리스트 + 다음 단계 안내
          ═════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: "8px",
          padding: "16px 18px",
          borderRadius: "14px",
          background: "rgba(25,25,112,0.04)",
          border: `1px dashed ${MIDNIGHT_BORDER}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Sparkles size={14} strokeWidth={2.2} color={MIDNIGHT} />
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.02em" }}>
            이번 주 체크리스트 — 순서대로
          </div>
        </div>
        <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", lineHeight: 1.75, color: "rgba(15,23,42,0.78)" }}>
          <li>임대차계약서 사본 + 건축물대장 (정부24 무료) 준비</li>
          <li>홈택스 → 사업자등록 (즉일~3일)</li>
          {(industryCategoryId === "food" || industryCategoryId === "cafe-dessert") && (
            <li>위생교육 온라인 수강 (외식업·휴게음식업중앙회 / 약 2.6만원 / 6시간)</li>
          )}
          {(industryCategoryId === "food" || industryCategoryId === "cafe-dessert" || industryCategoryId === "beauty" || industryCategoryId === "living-service") && (
            <li>관할 보건소 방문 → 보건증 발급 (보건소 3,000원 / 1주 내, 민간병원은 1.5~3만원)</li>
          )}
          <li>{permit.name} 접수 (정부24 또는 관할 행정기관)</li>
          <li>현장점검 대응 → 영업{permit.kind === "허가" ? "허가증" : permit.kind === "등록" ? "등록증" : "신고증"} 수령</li>
          <li>사업용 통장 + POS 가맹 + 카드 단말기 동시 신청</li>
        </ol>
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "16px 18px",
          borderRadius: "14px",
          background: "rgba(25,25,112,0.05)",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: MIDNIGHT_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ArrowRight size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px" }}>
            다음 단계: 보험·세무 세팅 (4대보험·원천세·급여)
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
            사업자등록 + 인허가 완료 후, 직원이 있다면 4대보험 가입 + 원천세 신고 절차로 이어집니다.
            보험·세무 세팅 단계에서 자세히 안내합니다.
          </div>
        </div>
      </div>
      </>
      )}

      {/* 2026-05-12 P1 #13: 인라인 서류 업로드 — 사업자등록증 발급받은 직후 자연스러운 시점.
          BusinessDocumentsLibraryCard (내 가게 페이지) 와 같은 SSOT 공유. */}
      <div style={{ marginTop: 14 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: MIDNIGHT, opacity: 0.75,
          letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
        }}>
          {language === "ko" ? "이 단계 서류 보관" : "Documents from this stage"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          <BusinessDocumentUpload
            ko={language === "ko"}
            kind="biz-registration"
            label={language === "ko" ? "사업자등록증" : "Business Registration Certificate"}
            hint={language === "ko" ? "홈택스 또는 세무서 발급 PDF/사진. 사업개시일 20일 이내 등록 필수." : "HomeTax/tax office. Required within 20 days of opening."}
          />
          {(industryCategoryId === "food" || industryCategoryId === "cafe-dessert") && (
            <BusinessDocumentUpload
              ko={language === "ko"}
              kind="hygiene-cert"
              label={language === "ko" ? "위생교육 수료증" : "Hygiene Education Cert"}
              hint={language === "ko" ? "한국외식업중앙회 6시간 (신규 영업자). 영업신고 첨부 서류." : "KFIA 6h (new operators)"}
            />
          )}
          {(industryCategoryId === "food" || industryCategoryId === "cafe-dessert" || industryCategoryId === "beauty") && (
            <BusinessDocumentUpload
              ko={language === "ko"}
              kind="health-cert"
              label={language === "ko" ? "보건증 (건강진단결과서)" : "Health Cert"}
              hint={language === "ko" ? "보건소 발급 (장티푸스·결핵 검사). 1년 만료 — 만료 시 재발급 필요." : "Health center, expires after 1yr"}
              multiple
            />
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: "rgba(15,23,42,0.55)", lineHeight: 1.55 }}>
          {language === "ko"
            ? "📌 업로드한 서류는 「내 가게 > 사업 서류 라이브러리」 에서 한꺼번에 관리할 수 있습니다."
            : "📌 Uploaded documents are also accessible from My Store > Business Documents Library."}
        </div>
      </div>

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="세무 가이드"
        doneItemsKo={[
          { label: "1. 상호·업태·종목 결정", detail: "상호 중복 검색 + 업태(소매·서비스 등) + 종목(세부 업종) 정확 매칭" },
          { label: "2. 사업자등록 신청", detail: "홈택스 온라인 또는 세무서 방문 — 임대차계약서·신분증 지참, 발급 평균 1~3일" },
          { label: "3. 영업신고·허가 신청", detail: "업종별 관할 보건소·구청·시청 — 식품접객업·미용업·체육시설업 등 카테고리별 분리" },
          { label: "4. 통장·카드단말기·홈택스 연동", detail: "사업자 통장 개설 + 카드단말기 신청 + 홈택스 공동인증서 등록" },
        ]}
        verifyItemsKo={[
          "사업자등록 — 개업일 기준 20일 이내 신청 (지연 시 가산세 + 부가세 매입세액 공제 불가)",
          "영업신고증 — 시설기준·위생교육·건강진단서 3개 모두 갖춰야 발급 (1개라도 누락 시 보완 통보)",
          "임대차계약서 — 사업자등록 시 제출용은 「확정일자」 받은 원본, 보증금 우선변제권 확보",
          "간이과세 vs 일반과세 — 연매출 1억 400만원 미만이면 간이 유리, 초기엔 일반 선택 후 매입세액 환급도 고려",
          "건강진단서·위생교육 — 식품접객업은 영업신고 전 필수 (보건소 또는 식품진흥원, 비용 1~3만원)",
          "다중이용시설 — 소방시설완비증명서·전기안전점검확인서 사전 발급 (영업신고 시 첨부)",
        ]}
        nextSummaryKo="사업자등록·영업신고증 발급 완료 → 세무 가이드(부가세·종소세·간이과세) 단계로 진입"
      />
    </div>
  );
}
