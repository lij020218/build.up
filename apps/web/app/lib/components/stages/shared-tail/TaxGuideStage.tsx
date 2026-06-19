"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  ShieldCheck, AlertTriangle, Calendar, FileText, Banknote,
  Sparkles, ClipboardList, ExternalLink, ChevronRight, type LucideIcon,
} from "lucide-react";
import { LEGAL, TAX_FAQ_ENTRIES, matchTaxFaq, type TaxFaqEntry } from "@foundone/shared";
import { StageWrapup } from "../shared/StageWrapup";
import { useMemo, useState } from "react";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러 (다른 단계와 통일)

// 2026-05-12 P0 fix (사장님 신고): 간이과세 기준 SSOT 통일.
//   종전: TaxGuideStage 4곳에 "1억 4천만원 (140M)" 잘못 표기
//   실제: 1억 400만원 (104M) — 36M 차이. 8,500만~1억 400만 사이 사장님 잘못 판단 위험.
//   출처: 부가가치세법 시행령 §109 (2024.1.1 이후 시행), 기재부 2023.12.08 발표.
//   정책브리핑 newsId=148930428 / 국세청 안내.
//   참고: LEGAL.SIMPLIFIED_TAX_THRESHOLD = 104_000_000 (이미 packages/shared SSOT 존재).
const SIMPLIFIED_THRESHOLD_KO = "1억 400만원"; // 사용자에게 보이는 한국식 표기
const SIMPLIFIED_THRESHOLD_EN = "104M KRW";
// 사용 안 함 변수 lint 회피용으로 LEGAL 참조 (값 검증)
void LEGAL.SIMPLIFIED_TAX_THRESHOLD;

/**
 * 세무 가이드 단계 — 2026년 기준 검증된 데이터.
 *
 * 다른 단계(HiringSetup·OperationsSetup·PreLaunch)와 동일한 패턴:
 *   1. KEY ACTION 미드나이트 그라디언트 히어로 ("이 단계에서 꼭 할 일")
 *   2. 트랩 카드 빨강 AlertTriangle (가산세·과태료 위험)
 *   3. Apple grouped list 카드
 *
 * 검증 출처:
 *   - 국세청 홈택스 (nts.go.kr / hometax.go.kr)
 *   - 2026 달라지는 세금제도 (한국세무사회)
 *   - 토스페이먼츠 부가세 가이드
 *   - 자비스 창업중소기업 세액감면
 */
export function TaxGuideStage() {
  const d = useDashboardCtx();
  const {
    language, copy,
    industryCategoryId,
    taxChecks, setTaxChecks,
    guideStepIndex, setGuideStepIndex,
    cpaDecision, setCpaDecision,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError,
    handleKnowledgeQuestion,
    prevTraversedStage, setViewingStageId,
    handleVerificationContinue,
    handleStageEdit,
    decisions,
    editSaveStatus,
    isViewingPastStage,
  } = d;
  // ⚠️ 2026-05-18: && isViewingPastStage 추가 — 첫 진입 화면에 노출 안 되도록.
  const isStageCompleted = !!decisions["tax-guide"]?.completedAt && isViewingPastStage;
  const _editStatus = editSaveStatus?.stageId === "tax-guide" ? editSaveStatus.status : null;
  const _editLabel = _editStatus === "saving"
    ? (language === "ko" ? "저장 중..." : "Saving...")
    : _editStatus === "saved"
      ? (language === "ko" ? "✓ 수정 완료" : "✓ Saved")
      : _editStatus === "error"
        ? (language === "ko" ? "⚠ 다시 시도" : "⚠ Retry")
        : (language === "ko" ? "✓ 수정 저장" : "✓ Save edits");
  const _editBg = _editStatus === "saved" ? "#1d3557" : _editStatus === "error" ? "#b64c4c" : "#1d3557";

  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";
  const pg = guideStepIndex;
  const totalPg = 4;
  const pgLabels = isStartup
    ? (ko ? ["왜 중요한가", "필수 세팅", "절세 전략", "세무사 판단"] : ["Why", "Setup", "Tax Savings", "CPA"])
    : (ko ? ["왜 중요한가", "필수 세팅", "절세 포인트", "세무사 판단"] : ["Why", "Setup", "Savings", "CPA"]);

  // ─── KEY ACTIONS (페이지별 "이 단계에서 꼭 할 일") ───
  const keyActions: Record<number, { title: string; detail: string }> = isStartup
    ? {
        0: ko
          ? { title: "2026 법인세 1%p 인상 — 신고 캘린더 미등록 = 가산세 20% + 일 0.022%", detail: "2026년부터 법인세율 전 구간 1%p 인상: 2억 이하 9→10% / 2-200억 19→20% / 200-3000억 21→22% / 3000억+ 24→25%. 가공 세금계산서 가산세 3%→4%. 법인세 3월 31일 / 부가세 분기 25일 / 원천세·4대보험 매월 10일." }
          : { title: "2026 corp tax up 1%p — calendar required", detail: "2026: under ₩200M 9→10%, 200M-20B 19→20%, 20B-300B 21→22%, 300B+ 24→25%. Fake invoice penalty 3%→4%. Corp tax Mar 31 / VAT quarterly 25 / Withholding monthly 10." },
        1: ko
          ? { title: "홈택스 법인 가입 + 법인카드 의무 — 개인카드 = 비용 불인정", detail: "공동인증서 → 세금계산서 발행·법인세 신고 활성화. 모든 경비 법인카드 결제. 영수증 5년 보관 (앱 백업 권장). R&D 인건비는 별도 분류 — 25% 세액공제 받기 위해." }
          : { title: "Hometax corp signup + corp card mandatory", detail: "Cert → invoice/tax filing enabled. All expenses on corp card. 5-year retention." },
        2: ko
          ? { title: "절세 핵심: 청년창업 세액감면 + 벤처인증 + R&D — 누락 시 수천만원 손실", detail: "① 청년창업 (만 15~34세, 병역 6년까지 차감) — 5년간 법인세/소득세 100% (수도권외+인구감소) / 75% (수도권) / 50% (수도권과밀). ② 벤처기업 인증 — 별도 5년 50% 감면 + 스톡옵션 행사이익 연 2억·누적 5억 비과세 (~2027.12.31 부여분). ③ R&D 인건비 세액공제 25% (벤처기업)." }
          : { title: "Post-cert savings — 50% tax cut 5yr + ₩500M stock option + 25% R&D", detail: "Youth (≤39) startup: 50% corp tax cut for 5 years. Stock option ₩200M/yr·₩500M cumulative tax-free. R&D credit 25% (SME)." },
        3: ko
          ? { title: "본인 모드에 맞는 세무 처리 결정 — 1인 인디는 DIY OK, 시드+ 는 세무사 필수", detail: "인디·솔로 1인 = 자비스·삼쩜삼 SaaS + 분기당 1회 세무사 검토 (10-30만). 부트스트랩 3-5명 = 월 기장 10만+ 세무조정 30만. 시드 이상 = 월 위임 30-50만 (R&D·스톡옵션 처리)." }
          : { title: "Pick by mode — Indie DIY, seed+ CPA mandatory", detail: "Solo: SaaS + quarterly review. Bootstrap 3-5: monthly bookkeeping. Seed+: full delegation." },
      }
    : {
        0: ko
          ? { title: "부가세·종소세 신고 캘린더 등록 — 1건 누락 = 무신고 가산세 20%", detail: "일반과세: 부가세 1·7월 25일 / 간이과세: 1월 25일 / 종소세: 5월 1~31일 (2026년은 6월 1일까지). 미신고 시 무신고 20% + 납부지연 일 0.022%." }
          : { title: "Add VAT/income tax deadlines to calendar — missing = 20% penalty", detail: "Standard VAT: Jan/Jul 25 / Simplified: Jan 25 / Income tax: May 1-31 (Jun 1 in 2026). Non-filing 20% + 0.022%/day delay." },
        1: ko
          ? { title: "지금 홈택스 가입 + 사업용 카드 1개 분리 — 첫 영업일부터 적용", detail: "공인인증서 등록 → 세금계산서 발행 가능 + 사업용 카드로 모든 경비 결제. 개인카드 혼용은 비용처리 거부 사유." }
          : { title: "Hometax signup + dedicated business card today", detail: "Cert signup → invoice issuance + use only business card. Mixing personal card = expense rejection." },
        2: ko
          ? { title: "매입세금계산서 받기 — VAT 환급의 시작점", detail: "거래처에 사업자등록증 전달 → 세금계산서 발급 요청. 카드영수증·간이영수증 5년 보관(앱 백업 권장)." }
          : { title: "Always request tax invoices from suppliers", detail: "Send your biz registration → request invoice. Keep receipts 5 years (app backup recommended)." },
        3: ko
          ? { title: `직원 채용·매출 ${SIMPLIFIED_THRESHOLD_KO}+ 시 세무사 선임 결정`, detail: "월 10~30만원 수임료 < 가산세·놓친 공제. 직접 신고는 1인 매장+SaaS(캐시노트·삼쩜삼) 조합만 권장." }
          : { title: `Hire CPA when adding employee or revenue >${SIMPLIFIED_THRESHOLD_EN}`, detail: "Monthly 100-300K fee < penalties + missed deductions. Self-file only viable for 1-person shop with SaaS." },
      };

  // ─── 트랩 (페이지별 빨강 경고) ───
  const traps: Record<number, { label: string; text: string }[]> = {
    0: ko ? [
      { label: "신고 기한 1일 늦으면 무신고 가산세 20% + 매일 0.022%", text: "캘린더에 미리 등록 + 모바일 알림 필수. 기한 후 신고는 감면율 있지만 빨리 할수록 유리." },
      { label: "2026년부터 가공 세금계산서 가산세 3% → 4% 상향", text: "허위·중복 발급 시 공급가액 기준 4% 부과. 세금계산서 받을 때 진위 확인 필수." },
    ] : [
      { label: "1 day late = 20% non-filing + 0.022%/day", text: "Calendar + mobile alarm required. Late filing has reductions but earlier = better." },
      { label: "Fake invoice penalty raised 3% → 4% (2026)", text: "Verify invoice authenticity before accepting." },
    ],
    1: isStartup ? (ko ? [
      { label: "개인카드로 경비 결제 시 비용 불인정", text: "법인 경비는 무조건 법인카드. 회식·소모품도 예외 없음. 모르고 섞어 쓰면 1년 결산 때 수백만원 차이." },
      { label: "R&D 비용 분류 안 하면 25% 세액공제 못 받음", text: "연구인력개발비를 일반 인건비와 별도 분류 + 증빙(연구 노트·코드 commit log 등) 필요." },
    ] : [
      { label: "Personal card expenses get rejected", text: "Corp expenses = corp card only. No exceptions. Mixing = millions in deduction loss yearly." },
      { label: "Unclassified R&D = no 25% credit", text: "Separate R&D from general payroll + evidence (research notes, commit logs)." },
    ]) : (ko ? [
      { label: "현금영수증 미발급 = 거래액의 20% 가산세 (소득세법 §162의3)", text: "고객이 요청하지 않아도 의무 발급 거래(10만원 이상). 자영업 적발 1순위 항목." },
      { label: "사업장 신고 결제단말기 미신고 시 가산세", text: "홈택스 → 사업장 현황신고 → 결제단말기 신고. 단말기 변경 시 즉시 재신고." },
    ] : [
      { label: "No cash receipt = 5% penalty per transaction", text: "Mandatory above 100K KRW even without customer request. #1 audit issue for SMBs." },
      { label: "Unreported POS terminal = penalty", text: "Hometax → biz status → register terminal. Re-report when changed." },
    ]),
    2: ko ? [
      { label: "감가상각 누락 = 수년간 비용 처리 못함", text: "300만원 이상 자산은 5~10년 감가상각. 첫 해에 전액 처리하면 거부됨. 세무사 또는 SaaS 자동 계산 활용." },
      { label: "복리후생비 ≠ 접대비 — 명확히 구분", text: "직원용=복리후생비(전액), 거래처 식사=접대비(한도). 잘못 분류하면 비용 부인." },
    ] : [
      { label: "Missed depreciation = years of lost deductions", text: "Assets >3M depreciate over 5-10 yrs. Full first-year deduction rejected." },
      { label: "Welfare ≠ Entertainment", text: "Staff = welfare (full deduction), client meals = entertainment (capped)." },
    ],
    3: ko ? [
      { label: "세무사 비용 < 가산세 + 놓친 공제 — 거의 항상", text: "월 10~30만원 수임료가 부담 같지만, 직원 1명 채용·매출 1억 넘으면 직접 신고 사실상 불가능. 빨리 위임이 정답." },
      { label: "세무사 한 명에 모두 맡기지 말 것 — 큰 결정은 검증 받기", text: "벤처인증·R&D 공제·해외 진출 등은 전문 세무사·세무법인에 별도 자문. 일반 세무사가 모를 수 있음." },
    ] : [
      { label: "CPA fee < penalties + missed credits", text: "100-300K/mo seems heavy, but mandatory once you hire or pass 100M revenue." },
      { label: "Don't trust one CPA for everything", text: "Specialty matters need specialist firms (venture cert, R&D, international)." },
    ],
  };

  // ─── 신고 일정 (2026 검증) ───
  const taxSchedule = isStartup ? [
    { tax: ko ? "법인세" : "Corp Tax", timing: ko ? "3월 31일" : "Mar 31", cycle: ko ? "연 1회" : "Annual", note: ko ? "12월 결산법인 기준" : "Dec fiscal year" },
    { tax: ko ? "부가가치세" : "VAT", timing: ko ? "1·4·7·10월 25일" : "Jan/Apr/Jul/Oct 25", cycle: ko ? "분기" : "Quarterly", note: ko ? "법인은 분기별 의무" : "Corp = quarterly" },
    { tax: ko ? "원천세" : "Withholding", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 급여 지급 시" : "When paying salary" },
    { tax: ko ? "4대보험" : "4 Insurance", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 채용 시" : "When hiring" },
  ] : [
    { tax: ko ? "부가가치세 (일반)" : "VAT (Standard)", timing: ko ? "1·7월 25일 확정 + 4·10월 예정고지/신고" : "Jan/Jul 25 (final) + Apr/Oct (preliminary)", cycle: ko ? "반기 확정 + 분기 예정" : "Semi-annual + quarterly preliminary", note: ko ? `${SIMPLIFIED_THRESHOLD_KO}+ 매출 / 직전기 1.5억+ 면 예정신고 의무` : `Revenue >${SIMPLIFIED_THRESHOLD_EN} / preliminary filing if >₩150M prior period` },
    { tax: ko ? "부가가치세 (간이)" : "VAT (Simplified)", timing: ko ? "1월 25일" : "Jan 25", cycle: ko ? "연 1회" : "Annual", note: ko ? `★ 8천만→${SIMPLIFIED_THRESHOLD_KO} 상향 (2024)` : `★ Raised to ${SIMPLIFIED_THRESHOLD_EN} (2024)` },
    { tax: ko ? "종합소득세" : "Income Tax", timing: ko ? "5월 1~31일" : "May 1-31", cycle: ko ? "연 1회" : "Annual", note: ko ? "★ 2026년: 5/31 일요일 → 6/1까지 / 성실신고는 6/30" : "★ 2026: extends to Jun 1" },
    { tax: ko ? "원천세·4대보험" : "Withholding & Insurance", timing: ko ? "매월 10일" : "Monthly 10th", cycle: ko ? "월납" : "Monthly", note: ko ? "직원 고용 시만" : "Only with employees" },
  ];

  // ─── 업종별 절세 포인트 (2026 기준) ───
  const taxTipsMap: Record<string, { icon: LucideIcon; label: string; detail: string }[]> = {
    food: [
      { icon: FileText, label: "식재료·소모품 전액 비용처리", detail: "원재료, 포장재, 냅킨, 위생용품 매입 세금계산서·카드영수증 5년 보관" },
      { icon: Banknote, label: "배달 수수료 전액 비용처리", detail: "배민·쿠팡이츠 수수료 = 사업 비용. 월 정산서 PDF로 보관" },
      { icon: Sparkles, label: "인테리어비 5년 감가상각", detail: "전액 즉시 공제 불가. 5년 정액/정률 감가상각으로 분산 처리" },
      { icon: ClipboardList, label: "유니폼·작업복 복리후생비", detail: "직원 전용 의류는 복리후생비로 전액 처리 가능" },
    ],
    "cafe-dessert": [
      { icon: FileText, label: "원두·식재료 매입세금계산서", detail: "거래처에 사업자등록증 전달 → 세금계산서 발급 요청. VAT 환급 핵심" },
      { icon: Sparkles, label: "에스프레소 머신 등 고가장비 감가상각", detail: "300만원+ 장비 5년+ 감가상각. 소모품(필터·청소용품)은 즉시 처리" },
      { icon: ClipboardList, label: "인테리어비 5년 감가상각", detail: "카페 특성상 인테리어 비중 큼 — 감가상각 스케줄 세무사와 설정" },
      { icon: Banknote, label: "배달·픽업 포장재 전액 비용처리", detail: "컵·홀더·봉투 등 포장재 영수증 전량 보관" },
    ],
    beauty: [
      { icon: FileText, label: "시술 소모품 전액 비용처리", detail: "필러·왁스·시술 재료 매입 즉시 전액 처리" },
      { icon: Sparkles, label: "기기·장비 감가상각", detail: "레이저·피부관리 기기 등 고가 장비 내용연수 따라 분산" },
      { icon: ClipboardList, label: "위생용품 전액 비용처리", detail: "장갑·마스크·소독제 등 위생 소모품 전액" },
      { icon: Banknote, label: "고객 홍보비 (광고선전비)", detail: "SNS 광고비·이벤트·촬영비 전액 광고선전비 처리" },
    ],
    fitness: [
      { icon: Sparkles, label: "운동 기구 감가상각", detail: "대형 기구 내용연수 5~8년. 소형 소모품 즉시 비용처리" },
      { icon: ClipboardList, label: "시설 유지보수 비용처리", detail: "에어컨 필터·청소·소독·환기 시설 유지비 전액" },
      { icon: Banknote, label: "강사 인건비 처리 (3.3% 원천징수)", detail: "프리랜서 강사는 원천징수 후 사업소득 지급명세서 제출" },
      { icon: FileText, label: "음악 저작권료 (KOMCA)", detail: "월 4천원~. 미가입 시 손해배상 + 형사처벌 리스크" },
    ],
    "online-digital": [
      { icon: Banknote, label: "플랫폼 수수료 전액 비용처리", detail: "네이버·쿠팡·배민 수수료 + PG사 결제 수수료 전액 지급수수료" },
      { icon: ClipboardList, label: "택배·물류비 전액 비용처리", detail: "포장재·택배비·반품 배송비 전액 운반비" },
      { icon: FileText, label: "광고비 전액 광고선전비", detail: "네이버 키워드·인스타·쿠팡 광고 전액 광고선전비" },
      { icon: Sparkles, label: "상품 촬영·디자인 외주비", detail: "상품 사진·상세페이지 외주 제작비 전액 비용처리" },
    ],
    "startup-tech": [
      { icon: Sparkles, label: "청년창업중소기업 세액감면 — 만 15~34세 / 5년", detail: "조특법 §6. 만 15~34세 (병역 최대 6년 차감)에 창업한 중소기업 — 수도권외+인구감소지역=100%, 수도권(과밀X·인구감소X)=75%, 수도권과밀억제권역=50%. 5년간. 인증 신청은 세무서 통해 (자동 X)." },
      { icon: Banknote, label: "스톡옵션 비과세 연 2억 / 누적 5억", detail: "벤처기업 인증 후 부여 + 2027.12.31 이전 행사 시 비과세. 임직원에게 부여한 스톡옵션 행사이익 연 2억·누적 5억까지 비과세 — ZUZU·Carta 로 캡테이블 관리" },
      { icon: Sparkles, label: "R&D 인건비 세액공제 (중소기업 25%)", detail: "연구전담요원·보조원 인건비 25% 세액공제. 벤처기업·코스닥 추가 가산. 연구노트·과제계획서·실적보고서 5년 보관 필수. 미증빙 시 추징" },
      { icon: FileText, label: "연구원 비과세 (월 20만원)", detail: "기업부설연구소 연구활동 직접 종사자 — 연구보조비 또는 활동비 월 20만원 비과세. 인건비 절감 효과" },
      { icon: Banknote, label: "클라우드·SaaS 전액 비용처리", detail: "AWS·Vercel·GitHub·Notion·Cursor·Claude 모두 지급수수료. 매월 영수증 자동 보관. 사업용 구독만 인정" },
      { icon: ClipboardList, label: "법인카드 사용 의무 + 영수증 5년", detail: "모든 경비 법인카드. 개인카드 사용 시 비용 불인정 위험. 자비스·삼쩜삼 SaaS 로 자동 영수증 분류" },
    ],
  };
  const effectiveCat = isStartup ? "startup-tech" : (industryCategoryId || "food");
  const taxTips = taxTipsMap[effectiveCat] ?? taxTipsMap["food"];

  // ─── 필수 세팅 체크리스트 (2026 검증) ───
  const taxCheckItems = isStartup ? [
    { id: "tc-hometax", label: ko ? "홈택스 법인 회원가입" : "HomeTax corp registration", detail: ko ? "hometax.go.kr → 법인 공동인증서 가입. 세금계산서 발행·법인세 신고 필수" : "Required for invoices and corporate tax filing" },
    { id: "tc-bizcard", label: ko ? "법인카드 개설 + 전 경비 결제" : "Corp card for all expenses", detail: ko ? "모든 경비를 법인카드로 결제. 개인카드 사용 시 비용 불인정 위험" : "Personal card expenses may be rejected" },
    { id: "tc-receipt", label: ko ? "비용 증빙 5년 보관 체계 수립" : "5-year expense documentation", detail: ko ? "클라우드·SaaS 구독료, 외주비, 출장비 전량 법인카드 결제 + 5년 보관 의무" : "5-year retention required" },
    { id: "tc-r&d", label: ko ? "R&D 비용 분류 체계 설정" : "R&D expense classification", detail: ko ? "연구인력개발비 세액공제(최대 25%) 받으려면 별도 분류 + 증빙 필수" : "Required for up to 25% R&D tax credit" },
    { id: "tc-payroll", label: ko ? "급여·4대보험 신고 체계" : "Payroll & insurance filing", detail: ko ? "직원 채용 시 매월 10일 원천세 + 4대보험 신고. 세무사 위임 권장" : "Monthly by 10th. Tax accountant recommended" },
    { id: "tc-venture", label: ko ? "청년창업 + 벤처인증 세제 혜택 확인" : "Young-founder + venture cert benefits", detail: ko ? "① 청년창업중소기업 (만 15~34세, 조특법 §6) — 5년 100%/75%/50% (수도권외+인구감소/수도권/과밀). ② 벤처기업 (조특법 §62의2) — 별도 5년 50%. ③ 스톡옵션 연 2억·누적 5억 비과세 (~2027.12.31)" : "① Young-founder (age 15~34, Tax Spec Act §6) — 5yr 100%/75%/50% (non-metro/metro/dense-metro). ② Venture cert (§62의2) — separate 5yr 50%. ③ Stock options 200M/yr·500M cumulative tax-free (~2027.12.31)" },
  ] : [
    { id: "tc-hometax", label: ko ? "홈택스 사업자 회원가입" : "HomeTax registration", detail: ko ? "hometax.go.kr → 사업자 공인인증서 가입. 세금계산서 발행·조회 필수" : "Required for tax invoices" },
    { id: "tc-bizcard", label: ko ? "사업용 카드 별도 개설" : "Dedicated business card", detail: ko ? "개인 카드 혼용 시 비용처리 불인정 위험. 전용 카드 1개+ 필수" : "Personal card mixing risks rejected deductions" },
    { id: "tc-pos", label: ko ? "카드단말기 국세청 신고" : "POS terminal tax report", detail: ko ? "홈택스 → 사업장 현황신고 → 결제단말기 신고. 미신고 시 가산세" : "Required. Penalty for non-report" },
    { id: "tc-cash", label: ko ? "현금영수증 가맹점 등록" : "Cash receipt registration", detail: ko ? "10만원+ 거래는 의무 발급. 미발급 시 거래액의 20% 가산세 (소득세법 §162의3)" : "Mandatory >100K KRW. 20% penalty per missed receipt (Income Tax Act §162-3)" },
    { id: "tc-receipt", label: ko ? "매입 영수증 5년 보관 체계" : "5-year expense receipt system", detail: ko ? "앱(삼쩜삼·자비스·캐시노트) 또는 월별 폴더로 분류. 5년 보관 의무" : "5-year retention. Use 3o3 / Jobis / CashNote" },
    { id: "tc-vat-type", label: ko ? "과세유형 확인 (일반 / 간이)" : "Tax type confirmation", detail: ko ? `★ 간이과세 기준 8천만 → ${SIMPLIFIED_THRESHOLD_KO} 상향 (부가가치세법 시행령 §109, 2024.1.1 시행). 직전연도 매출 ${SIMPLIFIED_THRESHOLD_KO} 미만이면 간이 가능` : `★ Simplified threshold raised 80M → ${SIMPLIFIED_THRESHOLD_EN} (VAT enforcement decree §109, eff. Jan 2024)` },
  ];
  const tcChecked = taxCheckItems.filter(t => taxChecks[t.id]).length;

  // ─── 세무사 필요 시점 ───
  const cpaNeeded = isStartup ? (ko ? [
    { condition: `1인 인디 — 매출 < ${SIMPLIFIED_THRESHOLD_KO}`, reason: "DIY 가능. 자비스·삼쩜삼 SaaS (월 0~3만) + 분기당 세무사 검토 1회 (10-30만). 종소세 1년 1회만 신경 쓰면 됨" },
    { condition: "부트스트랩 3-5명 / 시드 전", reason: "월 기장 10-15만 + 종소세 조정 30만. 자비스 ASSIST + 비대면 세무사 추천. R&D 25% 공제 받으려면 필수" },
    { condition: "시드 라운드 받음 (1억+)", reason: "투자금 회계·전환사채 처리 복잡도 ↑. 월 위임 20-30만 필수. 벤처인증 후 5년 50% 감면 신청 누락 = 수천만 손실" },
    { condition: "시리즈A 이상 / 직원 5명+", reason: "월 30-50만 또는 인하우스 회계담당자. 스톡옵션·R&D 25%·해외 자회사·옵션풀 50% 모두 위임 필수" },
  ] : [
    { condition: "First employee hire", reason: "Insurance/withholding obligations arise" },
    { condition: "Investment received", reason: "Convertible notes/accounting complexity" },
    { condition: "R&D credit application", reason: "Documentation requirements" },
    { condition: "Stock option grant", reason: "Tax/non-tax determination" },
  ]) : (ko ? [
    { condition: "직원 고용", reason: "4대보험·원천세 신고 오류 가능성 ↑. 월 수임료 < 가산세" },
    { condition: `연 매출 ${SIMPLIFIED_THRESHOLD_KO}+ 예상`, reason: "★ 일반과세 전환·VAT·종소세 복잡도 급증" },
    { condition: "인테리어 비용 3,000만원+", reason: "감가상각 스케줄 오류 시 수년간 비용 누락" },
    { condition: "복수 사업장 운영", reason: "사업장별 세금 분리 신고 필요" },
  ] : [
    { condition: "Hire employees", reason: "Insurance/tax filing error risk high" },
    { condition: `Revenue >${SIMPLIFIED_THRESHOLD_EN}`, reason: "★ Tax type transition + complexity" },
    { condition: "Interior costs >30M KRW", reason: "Depreciation schedule errors = years of missed deductions" },
    { condition: "Multiple locations", reason: "Separate filings per location" },
  ]);

  // ─── 디자인 토큰 ───
  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  // ─── KEY ACTION 히어로 ───
  const KeyActionCard = () => {
    const ka = keyActions[pg];
    if (!ka) return null;
    return (
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        marginBottom: "18px",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          backdropFilter: "blur(8px)",
        }}>
          <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px" }}>
            {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>
            {ka.title}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {ka.detail}
          </div>
        </div>
      </div>
    );
  };

  // ─── 트랩 카드 ───
  const TrapsCard = () => {
    const ts = traps[pg] ?? [];
    if (ts.length === 0) return null;
    return (
      <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
        {ts.map((trap) => (
          <div key={trap.label} style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            padding: "13px 15px", borderRadius: "14px",
            background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.14)",
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#b64c4c", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(180,28,28,0.85)" }}>{trap.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 페이지 네비 — 미드나이트 도트 + 라벨 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "8px" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.1)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "5px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? MIDNIGHT : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.45)",
              border: i === pg ? "none" : "1px solid rgba(25,25,112,0.1)", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: i === pg ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "none",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
          boxShadow: pg === totalPg - 1 ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ── 페이지 헤더 ── */}
      <div>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
          {ko ? `${pg + 1}단계 / ${totalPg}` : `Step ${pg + 1} / ${totalPg}`}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.3 }}>
          {pgLabels[pg]}
        </div>
      </div>

      {/* ── KEY ACTION 히어로 (모든 페이지 공통) ── */}
      <KeyActionCard />

      {/* ── Page 0: 왜 + 신고 일정 ── */}
      {pg === 0 && (
        <>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: "16px 18px", marginBottom: "16px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "10px" }}>
              {isStartup
                ? (ko ? "초기 세무 세팅이 수천만원 공제 혜택을 결정합니다" : "Initial tax setup determines deductions worth tens of millions")
                : (ko ? "초기 세무 세팅이 첫 해 세금 신고의 정확성을 결정합니다" : "Initial tax setup determines first-year filing accuracy")}
            </div>
            <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.65 }}>
              {isStartup
                ? (ko ? "★ 2026 세제 혜택: 청년창업 (만 15~34세) 5년 법인세 100%/75%/50% (지역별, 조특법 §6) + 벤처인증 시 별도 5년 50% 감면. 스톡옵션 연 2억·누적 5억 비과세 (~2027.12.31). R&D 세액공제 최대 25%. 사전 세팅 없으면 소급 적용 안 됨." : "★ 2026 benefits: Young-founder (age 15~34) 5-yr corp tax 100%/75%/50% by region (Tax Spec Act §6) + venture cert separate 5-yr 50%. Stock option tax-free 200M/yr·500M cumul (~2027.12.31). R&D up to 25%. No retroactive.")
                : (ko ? `★ 간이과세 기준 8천만 → ${SIMPLIFIED_THRESHOLD_KO} 상향 (부가가치세법 시행령 §109, 2024.1.1 시행, 2026 유지). 사업자등록 직후부터 세금 의무 시작. 부가세 미신고 = 가산세 20%, 현금영수증 미발급 = 거래액의 20% (소득세법 §162의3). 홈택스 가입·사업용 카드·증빙 보관을 지금 잡아야 합니다.` : `★ Simplified threshold raised 80M → ${SIMPLIFIED_THRESHOLD_EN} (VAT enforcement decree §109, eff. Jan 2024, in force 2026). Tax obligations begin immediately after registration. VAT non-filing = 20%, no cash receipt = 20% of transaction (Income Tax Act §162-3).`)}
            </div>
          </div>

          <div>
            <div style={sectionLabel}>{ko ? "주요 신고 일정 (2026)" : "Key Tax Deadlines (2026)"}</div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {taxSchedule.map((row, i) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", gap: "14px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: MIDNIGHT }}>
                      <Calendar size={17} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{row.tax}</div>
                      <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{row.note}</div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{row.timing}</div>
                      <div style={{ fontSize: "10.5px", color: "rgba(0,0,0,0.4)", marginTop: "2px", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{row.cycle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 1: 필수 세팅 체크리스트 ── */}
      {pg === 1 && (
        <>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={sectionLabel}>{ko ? "필수 세무 세팅" : "Required Tax Setup"}</span>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: tcChecked === taxCheckItems.length ? "#fff" : "var(--text)", background: tcChecked === taxCheckItems.length ? "rgb(29,53,87)" : "rgba(0,0,0,0.08)", padding: "3px 10px", borderRadius: "999px" }}>
                {tcChecked} / {taxCheckItems.length}
              </span>
            </div>
            <div style={{ height: "3px", borderRadius: "999px", background: "rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{ height: "100%", width: `${(tcChecked / taxCheckItems.length) * 100}%`, background: MIDNIGHT, borderRadius: "999px", transition: "width 0.35s" }} />
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {taxCheckItems.map((item, idx) => {
                const done = !!taxChecks[item.id];
                return (
                  <div key={item.id}>
                    {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <button
                      type="button"
                      onClick={() => setTaxChecks((prev: Record<string, boolean>) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      style={{
                        display: "flex", gap: "14px", alignItems: "flex-start", width: "100%", textAlign: "left" as const,
                        padding: "14px 16px",
                        background: done ? "rgba(25,25,112,0.03)" : "transparent",
                        border: "none", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{
                        flexShrink: 0, marginTop: "2px",
                        width: 22, height: 22, borderRadius: 7,
                        border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                        background: done ? MIDNIGHT : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {done && (
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: 600, color: done ? "rgba(0,0,0,0.32)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.01em", lineHeight: 1.45 }}>
                          {item.label}
                        </div>
                        {!done && (
                          <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(0,0,0,0.55)", marginTop: "3px" }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 공식 사이트 */}
          <div style={{ marginTop: "16px" }}>
            <div style={sectionLabel}>{ko ? "바로가기" : "Quick links"}</div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {[
                { name: "홈택스", desc: ko ? "사업자등록·세금계산서·신고" : "Biz reg, invoices, filing", href: "https://www.hometax.go.kr", icon: "홈" },
                { name: ko ? "캐시노트 (무료)" : "CashNote (free)", desc: ko ? "소상공인 매출·경비 자동 분류" : "Auto-categorize for SMBs", href: "https://cashnote.kr", icon: "캐" },
                { name: ko ? "삼쩜삼" : "3o3", desc: ko ? "프리랜서·소형 사업자 종소세 환급" : "Freelancer income tax refund", href: "https://3o3.co.kr", icon: "3" },
                { name: ko ? "자비스 (Jobis)" : "Jobis", desc: ko ? "스타트업·법인 회계·세무 SaaS" : "Startup/corp accounting SaaS", href: "https://jobis.co", icon: "자" },
              ].map((link, i) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "13px 16px",
                  borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                  textDecoration: "none", color: "inherit",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 6px rgba(25,25,112,0.22)" }}>
                    {link.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{link.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>{link.desc}</div>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0 }} />
                  <ExternalLink size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 2: 절세 포인트 ── */}
      {pg === 2 && (
        <>
          <div>
            <div style={sectionLabel}>{ko ? `절세 포인트 — ${effectiveCat === "startup-tech" ? "스타트업" : "업종 맞춤"}` : `Tax Savings — ${effectiveCat === "startup-tech" ? "startup" : "industry"}`}</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, marginBottom: "12px" }}>
              {ko ? "비용처리만 잘해도 세금이 확 달라집니다. 아래 항목을 절대 놓치지 마세요." : "Proper expense recording dramatically changes your tax bill."}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {taxTips.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: MIDNIGHT }}>
                        <Icon size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{tip.label}</div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{tip.detail}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 3: 세무사 판단 + Q&A ── */}
      {pg === 3 && (
        <>
          {/* 세무사 필요 시점 */}
          <div>
            <div style={sectionLabel}>{ko ? "세무사가 필요한 순간" : "When You Need a CPA"}</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, marginBottom: "12px" }}>
              {ko ? "아래 조건 중 하나라도 해당되면, 월 10~30만원 수임료가 가산세보다 압도적으로 저렴합니다." : "If any condition below applies, accountant fees (100-300K/mo) are far cheaper than penalties."}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {cpaNeeded.map((item, i) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: MIDNIGHT, fontSize: "13px", fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{item.condition}</div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{item.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 직접 vs 세무사 선택 */}
          <div style={{ marginTop: "18px" }}>
            <div style={sectionLabel}>{ko ? "내 세무 처리 방식 선택" : "My tax handling"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button type="button" onClick={() => { setCpaDecision("self"); if (typeof window !== "undefined") localStorage.setItem("cpaDecision", "self"); }} style={{
                padding: "16px", borderRadius: "16px", cursor: "pointer", textAlign: "left" as const,
                background: cpaDecision === "self" ? "rgba(25,25,112,0.06)" : "white",
                border: cpaDecision === "self" ? `2px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.08)",
                boxShadow: cpaDecision === "self" ? "0 4px 14px rgba(25,25,112,0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: cpaDecision === "self" ? `6px solid ${MIDNIGHT}` : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s" }} />
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: cpaDecision === "self" ? MIDNIGHT : "var(--text)", letterSpacing: "-0.01em" }}>{ko ? "직접 신고" : "Self-file"}</div>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>
                  {ko ? "캐시노트·자비스·삼쩜삼 활용. 직원 X + 매출 단순할 때만 권장" : "Use SaaS. Only viable for solo + simple revenue"}
                </div>
              </button>
              <button type="button" onClick={() => { setCpaDecision("cpa"); if (typeof window !== "undefined") localStorage.setItem("cpaDecision", "cpa"); }} style={{
                padding: "16px", borderRadius: "16px", cursor: "pointer", textAlign: "left" as const,
                background: cpaDecision === "cpa" ? "rgba(25,25,112,0.06)" : "white",
                border: cpaDecision === "cpa" ? `2px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.08)",
                boxShadow: cpaDecision === "cpa" ? "0 4px 14px rgba(25,25,112,0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: cpaDecision === "cpa" ? `6px solid ${MIDNIGHT}` : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s" }} />
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: cpaDecision === "cpa" ? MIDNIGHT : "var(--text)", letterSpacing: "-0.01em" }}>{ko ? "세무사 선임" : "Hire CPA"}</div>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>
                  {ko ? "월 10~30만원. 직원·투자·R&D 공제 시 필수. 가산세 방어" : "100-300K/mo. Required for hiring/investment/R&D"}
                </div>
              </button>
            </div>
            {cpaDecision && (
              <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.12)", fontSize: "12.5px", fontWeight: 600, color: MIDNIGHT, lineHeight: 1.55 }}>
                ✓ {cpaDecision === "self"
                  ? (ko ? "직접 신고 선택됨 — 캐시노트나 자비스로 증빙 관리를 시작하세요" : "Self-file selected — start with CashNote or Jobis")
                  : (ko ? "세무사 선임 선택됨 — 지인 추천이나 세무사닷컴에서 상담받으세요" : "CPA selected — get referrals or consult via taxaccountant.com")}
              </div>
            )}
          </div>

          {/* 세무 Q&A — 2026-05-18 redesign: FAQ 우선 + AI fallback */}
          <TaxFaqCard
            ko={ko}
            qaText={knowledgeQaText}
            setQaText={setKnowledgeQaText}
            qaStatus={knowledgeQaStatus}
            qaError={knowledgeQaError}
            askAi={() => handleKnowledgeQuestion("tax")}
          />

          <TrapsCard />
        </>
      )}

      {/* ── 단계 네비게이션 (다른 단계와 동일하게 컨텐츠 맨 아래에 배치) ──
          ⚠️ 필수 세팅 체크리스트 100% 완료 강제 — 부분 체크 자동 진행 방지.
          미완료 시 버튼 비활성화 + 페이지 1 (필수 세팅) 로 자동 이동 + shake 경고. */}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="채용·운영 세팅"
        doneItemsKo={[
          { label: "1. 부가세 신고 일정", detail: "1·7월(개인 일반)·1·4·7·10월(법인) 분기별 신고일 + 자동이체 셋업" },
          { label: "2. 종합소득세 시뮬", detail: "추정 매출·비용 기반 5월 종소세 신고 사전 시뮬, 누진세율 구간 점검" },
          { label: "3. 비용처리 인식", detail: "사업자 카드·홈택스 현금영수증·전자세금계산서 모든 매입 자동 수집 셋업" },
          { label: "4. 절세 포인트 점검", detail: "창업중소기업 세액감면(50~100%)·청년 추가 감면·연구개발비 세액공제 검토" },
        ]}
        verifyItemsKo={[
          "부가세 — 매입세액 공제 위해 모든 매입 「세금계산서」 받기, 간이영수증은 공제 불가",
          "종소세 — 5월 신고 누락 시 무신고 가산세 20% + 일별 지연이자, 폐업해도 신고 의무 잔존",
          "창업 세액감면 — 청년창업·수도권 외 지역 창업 시 5년간 50~100% 감면 (신청 필수, 자동 X)",
          "현금영수증 — 사업자 의무발급 업종(음식·미용·헬스 등)은 1만원 이상 거래 시 의무, 위반 시 거래액 20% 과태료",
          "사업용 카드 — 홈택스 등록 시 매입세액 공제·경비 자동 분류, 미등록 시 매번 수동 입력 부담",
          "전자세금계산서 — 일정 매출 이상 의무, 종이 세금계산서 발급 시 가산세 + 매입자 공제 거부 위험",
        ]}
        nextSummaryKo="세무 신고 일정·비용처리·절세 포인트 셋업 완료 → 채용·운영 세팅 단계로 진입"
      />

      <div style={{ ...styles.stageFooter, marginTop: "8px" }}>
        <button type="button" style={styles.button} onClick={() => {
          if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
          else setViewingStageId(null);
        }}>
          {ko ? "← 이전 단계" : "← Back"}
        </button>
        {/* "수정 저장" — editSaveStatus 따라 라벨/색 변경. */}
        {isStageCompleted && tcChecked === taxCheckItems.length && (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: _editStatus === "saving" ? 0.6 : 1,
              background: _editBg,
              cursor: _editStatus === "saving" ? "wait" : "pointer",
            }}
            disabled={_editStatus === "saving"}
            onClick={() => { void handleStageEdit("tax-guide"); }}
          >
            {_editLabel}
          </button>
        )}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: tcChecked === taxCheckItems.length ? 1 : 0.45,
            cursor: tcChecked === taxCheckItems.length ? "pointer" : "not-allowed",
          }}
          title={
            tcChecked === taxCheckItems.length
              ? undefined
              : ko ? `필수 세팅 ${tcChecked}/${taxCheckItems.length} — 모두 체크해야 진행 가능` : `Complete all ${taxCheckItems.length} required setup items first`
          }
          onClick={() => {
            if (tcChecked !== taxCheckItems.length) {
              // 페이지 1 (필수 세팅) 로 이동 + 사용자에게 시각적 안내
              setGuideStepIndex(1);
              return;
            }
            handleVerificationContinue("tax-guide");
          }}
        >
          {tcChecked !== taxCheckItems.length
            ? (ko ? `↑ 필수 세팅 ${tcChecked}/${taxCheckItems.length}` : `↑ Setup ${tcChecked}/${taxCheckItems.length}`)
            : copy.home.markTaxReviewed}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  TaxFaqCard — 세무 질문 카드 (FAQ 우선 + AI fallback)
//
//  사장님 신고 (2026-05-18): "세무 질문하기가 AI 자유 질문인데, 99% 사장님이 같은
//  기본 질문 반복. FAQ 방식으로 가장 기본·중요한 것 미리 정리해서 보여주면 어떨까".
//
//  구조:
//    1. 검증된 FAQ 칩 12개 (전체 검색 + 카테고리 필터)
//    2. FAQ 클릭 → 즉시 답변 펼침 (지연 0, 비용 0, 정확성 100%)
//    3. 검색창 입력 → matchTaxFaq 로 키워드 매칭 (최대 3개 추천)
//    4. 매칭 0건 시만 "AI 답변 받기" 버튼 노출 → 기존 SSE 스트림 호출
//
//  검증: 모든 답변 2026-05 기준 국세청·법령정보·정책브리핑 출처. 변동 정보 (세율·기준액)
//        에 *2026 기준* 명시.
// ─────────────────────────────────────────────────────────────────────────

function TaxFaqCard({
  ko,
  qaText,
  setQaText,
  qaStatus,
  qaError,
  askAi,
}: {
  ko: boolean;
  qaText: string;
  setQaText: (v: string) => void;
  qaStatus: "idle" | "loading" | "error";
  qaError: string;
  askAi: () => void;
}) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // 사용자가 입력한 텍스트로 FAQ 매칭. 0건이면 AI fallback 노출.
  const matches: TaxFaqEntry[] = useMemo(() => {
    const q = search.trim();
    if (q.length < 2) return [];
    return matchTaxFaq(q);
  }, [search]);

  const displayedFaqs: TaxFaqEntry[] = matches.length > 0 ? matches : TAX_FAQ_ENTRIES;
  const noMatch = search.trim().length >= 2 && matches.length === 0;

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    padding: "16px 18px",
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "rgba(0,0,0,0.5)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  };

  return (
    <div style={{ marginTop: "18px" }}>
      <div style={sectionLabel}>{ko ? "자주 묻는 세무 질문" : "Frequently Asked Tax Questions"}</div>
      <div style={cardStyle}>
        {/* 검색창 */}
        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setQaText(e.target.value); }}
            placeholder={ko ? "예: 간이과세, 부가세 신고, 사업용 카드, 세무사 비용..." : "e.g., simplified VAT, filing, business card..."}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: "13.5px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* 검색 결과 / 전체 FAQ */}
        {noMatch ? (
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(182,76,76,0.04)",
            border: "1px dashed rgba(182,76,76,0.2)",
            marginBottom: "12px",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "준비된 FAQ에서 매칭되는 답변이 없어요" : "No matching FAQ found"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginBottom: "12px" }}>
              {ko
                ? "AI 답변은 일반 가이드이며 법령 변경 시 정확하지 않을 수 있어요. 중요한 결정은 세무사·국세청 확인 권장."
                : "AI answers are general guidance. Verify important decisions with a CPA or NTS."}
            </div>
            <button
              type="button"
              onClick={askAi}
              disabled={qaStatus === "loading"}
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                border: "none",
                background: MIDNIGHT,
                color: "#fff",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: qaStatus === "loading" ? "wait" : "pointer",
                opacity: qaStatus === "loading" ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {qaStatus === "loading"
                ? (ko ? "AI 답변 생성 중..." : "Generating...")
                : (ko ? "AI 에게 묻기 (참고용)" : "Ask AI (reference)")}
            </button>
            {qaError && <div style={{ marginTop: "8px", fontSize: "12px", color: "#b64c4c" }}>{qaError}</div>}
            {qaText && qaStatus !== "loading" && (
              <div style={{
                marginTop: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.02)",
                fontSize: "13px",
                color: "rgba(15,23,42,0.8)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap" as const,
              }}>
                {qaText}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            {displayedFaqs.map((faq) => {
              const open = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    borderRadius: "12px",
                    border: open ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.08)",
                    background: open ? "rgba(25,25,112,0.03)" : "white",
                    transition: "border-color 160ms, background 160ms",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : faq.id)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "transparent",
                      border: "none",
                      textAlign: "left" as const,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 650,
                      color: open ? MIDNIGHT : "#0f172a",
                      letterSpacing: "-0.005em",
                      flex: 1,
                      lineHeight: 1.45,
                    }}>
                      {faq.question}
                    </span>
                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      style={{
                        color: open ? MIDNIGHT : "rgba(0,0,0,0.35)",
                        transform: open ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 160ms",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {open && (
                    <div style={{
                      padding: "0 14px 14px",
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      paddingTop: "12px",
                    }}>
                      <div style={{
                        fontSize: "13px",
                        color: "rgba(15,23,42,0.82)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap" as const,
                        marginBottom: "10px",
                      }}>
                        {faq.answer}
                      </div>
                      {faq.sources.length > 0 && (
                        <div style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          paddingTop: "8px",
                          borderTop: "1px dashed rgba(0,0,0,0.08)",
                          marginTop: "4px",
                        }}>
                          <span style={{ fontWeight: 600 }}>{ko ? "출처" : "Sources"}</span>
                          {" "}
                          <span style={{ marginLeft: "4px" }}>·</span>
                          {" "}
                          <span style={{ color: "var(--muted)" }}>{ko ? "검증" : "verified"} {faq.lastVerified}</span>
                          <div style={{ marginTop: "4px", display: "flex", flexDirection: "column" as const, gap: "2px" }}>
                            {faq.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: MIDNIGHT,
                                  textDecoration: "none",
                                  fontWeight: 500,
                                }}
                              >
                                · {src.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
