"use client";

import {
  ShieldCheck, AlertTriangle, FileText, Sparkles, ChevronRight,
  ExternalLink, Banknote, Loader2, Copy, type LucideIcon,
} from "lucide-react";
import {
  getMatchedPrograms,
  getProgramCategoryColor,
  getProgramCategoryLabel,
  formatBudgetPresetLabel,
  type ProgramCategory,
} from "@build-up/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { fetchLiveSupportPrograms } from "../../../services/live-data";
import { supabase } from "../../../../../lib/supabase";
import { styles } from "../../../styles";
import { StageWrapup } from "../shared/StageWrapup";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러

/**
 * 대출 가이드 단계 (loan_guide) — 2026 검증 데이터.
 *
 * 사용자 노출 타이틀: "대출 가이드" (i18n.ts loan_guide.title)
 * 단계 의의: 자금 조달과 정책자금 검토 포인트 — 무리한 차입 피하고 현실적 자금 구조 설계.
 *
 * 다른 단계(Tax/Hiring/PreLaunch)와 동일한 패턴:
 *   1. KEY ACTION 미드나이트 그라디언트 히어로 ("이 단계에서 꼭 할 일")
 *   2. 트랩 카드 빨강 AlertTriangle
 *   3. Apple grouped list 카드
 *
 * 흐름 단순화: 5페이지 → 3페이지
 *   Page 0: 내 상황 진단 + 예산별 차등 추천 매트릭스
 *   Page 1: 추천 자금 경로 (DB + K-Startup 실시간)
 *   Page 2: AI 사업계획서 + 성공 팁
 *
 * 검증 출처 (2026):
 *   - 소상공인정책자금 누리집 (ols.semas.or.kr)
 *   - 중소벤처기업부 2026 정책자금 융자계획 공고
 *   - K-Startup, KIBO, KODIT 공식 자료
 */
export function LoanGuideStage() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    startupType,
    selectedIndustryId,
    selectedFranchiseBrandId,
    selectedBusinessModelId,
    selectedBudget,
    decisions,
    guideSelections, setGuideSelections,
    guideStepIndex, setGuideStepIndex,
    savedFinanceSnapshot,
    progFilter, setProgFilter,
    liveProgramsData, setLiveProgramsData,
    liveProgramsLoading, setLiveProgramsLoading,
    bpLoading, setBpLoading,
    bpSections, setBpSections,
    bpSummary, setBpSummary,
    bpError, setBpError,
    bpExpandedIdx, setBpExpandedIdx,
    loanChecks, setLoanChecks,
  } = d;

  // 2026-05-12 P0 fix (사장님 신고): loan-guide "다음 단계로" 버튼이 게이트 없이 즉시
  // advance + reviewed:true 저장하던 버그 해결. 사장님이 *내용을 읽었다* 는 명시적
  // confirmation 없이는 진행 불가하도록 변경.
  //   - 키 이름: "loan-final-review" (다른 elig-*/doc-* 와 충돌 방지)
  //   - CurrentStageView 의 "다음 단계로" 버튼이 이 값을 읽어 disabled 게이트.
  //   - TaxGuideStage 의 `tcChecked === taxCheckItems.length` 동일 패턴.
  const LOAN_REVIEW_KEY = "loan-final-review";
  const loanReviewed = !!loanChecks[LOAN_REVIEW_KEY];

  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";

  // ─── 예산 buckets (값은 KRW 원 단위) ───
  // 5천만원 (5,000만원) = 50,000,000원
  // 2억 (20,000만원) = 200,000,000원
  const budget = selectedBudget ?? 0;
  const budgetBucket: "small" | "medium" | "large" =
    budget <= 50_000_000 ? "small"
    : budget <= 200_000_000 ? "medium"
    : "large";

  // ─── KEY ACTIONS (페이지별) ───
  const keyActions: Record<number, { title: string; detail: string }> = isStartup
    ? {
        0: ko
          ? { title: "지분 양보 전 비지분 자금부터 — TIPS 8억·예비창업 1억·청년창업 1억", detail: "초기 밸류에이션 낮을 때 지분을 내어주면 수십억 손실. 무상 R&D 과제로 마일스톤 달성 후 시리즈 A를 노리세요." }
          : { title: "Non-dilutive first — TIPS 800M / Pre-Startup 100M / Youth 100M", detail: "Giving up equity at low valuation = billions lost. Hit milestones with grants first." },
        1: ko
          ? { title: "K-Startup 통합공고 + TIPS 운영사 매칭으로 신청 시작", detail: "K-Startup(k-startup.go.kr) → 모집공고 확인. TIPS는 149개 운영사 중 우리 분야 매칭이 핵심 — 운영사 선투자 → 정부 매칭 구조." }
          : { title: "Start with K-Startup integrated calls + TIPS operator matching", detail: "K-Startup posts open calls. For TIPS find a matching operator first — they invest, gov matches." },
        2: ko
          ? { title: "AI 사업계획서로 신청서 초안 30초 완성", detail: "지금까지 입력한 업종·상권·재무 시뮬레이션 데이터 기반으로 PSST·청년창업사관학교 양식에 맞는 초안 자동 생성." }
          : { title: "AI-draft your application in 30 seconds", detail: "Auto-generates PSST/Youth Startup format from your roadmap data." },
      }
    : {
        0: ko
          ? { title: "내 예산·업종·신용 상황을 입력하면 자금 경로가 자동 매칭됨", detail: "5천만원 이하면 소진공 정책자금(2.96%) → 5천~2억 보증서 결합 → 2억+ 중진공 직접대출. 비수도권은 0.2%p 우대." }
          : { title: "Enter budget/industry/credit → auto-matched funding path", detail: "≤50M = SEMAS direct (2.96%), 50M-200M = guarantee+bank, 200M+ = KOSMES direct. -0.2%p for non-metro." },
        1: ko
          ? { title: "3~4월 신청 — 1년 예산이 가장 많을 때. 하반기 소진 가능", detail: "소상공인정책자금 누리집(ols.semas.or.kr) 방문 → 자격 확인 → 온라인 신청 → 현장 실사 1~2주 → 자금 집행." }
          : { title: "Apply Mar-Apr — fullest budget. May deplete by H2", detail: "ols.semas.or.kr → eligibility check → online apply → 1-2wk site visit → disbursement." },
        2: ko
          ? { title: "AI 사업계획서로 신청서 초안 30초 완성 + 프린트 가능 PDF", detail: "지금까지 입력한 업종·상권·재무 시뮬레이션 데이터 기반으로 정책자금 신청에 적합한 초안 자동 생성." }
          : { title: "AI-draft your application in 30 seconds + printable PDF", detail: "Auto-generates plan suitable for policy fund applications." },
      };

  // ─── 트랩 (페이지별 빨강 경고) ───
  const traps: Record<number, { label: string; text: string }[]> = isStartup ? {
    0: ko ? [
      { label: "지분 먼저 내어주면 수십억 손실 — 비지분 자금부터", text: "초기 밸류 5억일 때 30% 지분 = 1.5억. 시리즈 A 밸류 50억 되면 그 30%가 15억. 무상 R&D로 마일스톤 달성하고 밸류 올리세요." },
      { label: "벤처인증·기보 보증 없이 시중은행 대출은 거의 불가", text: "스타트업은 매출·담보 부족 → 시중은행 거절 표준. 기보(kibo.or.kr) 기술평가 + 벤처인증으로 우회." },
    ] : [
      { label: "Equity first costs billions later", text: "30% at 500M valuation = 150M. Same 30% at 5B = 1.5B. Use grants to hit milestones first." },
      { label: "Banks reject startups without venture cert + KIBO guarantee", text: "Get KIBO tech assessment + venture cert to access loans." },
    ],
    1: ko ? [
      { label: "TIPS는 운영사 선투자가 필수 — 운영사 매칭 실패하면 끝", text: "149개 운영사 중 우리 분야와 맞는 곳 3-5곳에 동시 컨택 권장. 콜드 메일보다 네트워크 추천이 결정적." },
      { label: "여러 프로그램 동시 지원이 정답 — 단일 의존 X", text: "TIPS + 청년창업사관학교 + AI 바우처 + 지자체 = 동시 수혜 가능. 한 곳 떨어져도 백업." },
    ] : [
      { label: "TIPS requires operator pre-investment first", text: "Contact 3-5 matching operators simultaneously. Network referrals beat cold emails." },
      { label: "Apply to multiple programs in parallel", text: "TIPS + Youth + AI Voucher + Local = stackable backup." },
    ],
    2: ko ? [
      { label: "사업계획서 '자금 사용 계획' 절대 '운전자금' 한 줄로 끝내지 마세요", text: "심사위원이 가장 중요시하는 섹션. 항목별 구체 금액(인건비 4억·R&D 2억·마케팅 1억) 명시 필수." },
      { label: "발표(피칭) 준비 없이 신청은 무용지물 — 30% 점수가 발표", text: "PSST 서류 통과 후 5분 발표. AI 사업계획서로 초안 만들고, 발표 자료는 직접 다듬어야 합격." },
    ] : [
      { label: "'Working capital' alone in fund usage = auto reject", text: "Specify items: payroll 400M, R&D 200M, marketing 100M." },
      { label: "30% of score is pitching", text: "AI drafts the doc, but you must polish the pitch deck." },
    ],
  } : {
    0: ko ? [
      { label: "기존 고금리 대출이 있으면 대환대출(4.5%)부터 검토", text: "시중은행 6~10% 대출을 정책자금 4.5%로 전환 = 연 수백만원 절감. 신청 자격: 소상공인 + 6개월 이상 정상 상환 이력." },
      { label: "신용 6등급 이하면 햇살론 우선 — 정책자금 거절 가능성", text: "2026 햇살론 일반·특례로 개편. 저신용자 무담보 가능. 신용점수 먼저 확인 후 경로 선택." },
    ] : [
      { label: "Refinance high-rate loans first via 4.5% policy fund", text: "Convert 6-10% bank loans → 4.5%. Save millions yearly. Need 6+ mo good repayment record." },
      { label: "Credit grade 6+ should try Haetsal Loan first", text: "2026 reformed Haetsal — unsecured for low-credit. Check score first." },
    ],
    1: ko ? [
      { label: "신청서 '운전자금' 한 줄로 작성하면 거절 — 항목별 명시", text: "임차료 1천만 / 인건비 2천만 / 재고 1천만 / 마케팅 5백만 등 구체 금액. 정책자금 거절 1순위 사유." },
      { label: "재무제표 없으면 추정 손익 + 매출 시뮬레이션 첨부", text: "신규 창업자도 추정 매출·비용·BEP 분석으로 신청 가능. 재무 시뮬레이션 단계 결과 그대로 활용." },
    ] : [
      { label: "Vague 'working capital' = rejection", text: "Itemize: rent 10M, payroll 20M, stock 10M, marketing 5M. #1 rejection cause." },
      { label: "No financial statements? Use estimates + simulation", text: "New founders can submit projections + BEP from finance sim stage." },
    ],
    2: ko ? [
      { label: "AI 생성 후 그대로 제출하지 말 것 — 본인 검토 필수", text: "AI 초안은 70% 완성도. 매장 특성·지역 상권·실제 인건비 등 본인 데이터로 다듬어야 합격률 ↑." },
      { label: "여러 프로그램 동시 신청 — 한 곳 거절돼도 백업", text: "정책자금 + 보증서 대출 + 무상 바우처는 중복 수혜 가능. 단일 의존 X." },
    ] : [
      { label: "Don't submit AI draft as-is", text: "AI = 70% draft. Polish with your store specifics for higher acceptance." },
      { label: "Apply to multiple in parallel", text: "Policy fund + guarantee loan + free voucher are stackable." },
    ],
  };

  // ─── 예산별 추천 매트릭스 (사장님용 / 스타트업용) — 각 bucket 첫 번째가 추천 1순위 ───
  type Recommendation = {
    icon: LucideIcon;
    title: string;
    bucket: string;
    rate: string;
    limit: string;
    why: string;
    href: string;
    primary?: boolean; // 추천 1순위 표시 (별표 대신 미드나이트 배지 사용)
  };

  const recommendations: Recommendation[] = isStartup ? (ko ? [
    { icon: Sparkles, title: "예비창업패키지 / 청년창업사관학교", bucket: "1억 이하 시드 전", rate: "무상 (갚지 않음)", limit: "최대 1억", why: "사업자등록 전·만 39세 이하·창업 3년 이내. 1월~2월 모집. 사업비 70% 지원 + 공간·교육·코칭", href: "https://www.k-startup.go.kr", primary: true },
    { icon: Banknote, title: "TIPS (민간투자주도형)", bucket: "5억~8억 시드~프리A", rate: "무상 + 매칭투자", limit: "최대 8억 (R&D 5억 + 사업화 3억)", why: "기술 기반 스타트업 핵심 트랙. 149개 운영사 중 매칭 → 운영사 선투자 → 정부 매칭. 벤처인증 가산점", href: "https://www.jointips.or.kr" },
    { icon: FileText, title: "AI·데이터·클라우드 바우처", bucket: "도입 비용 부담 시", rate: "70~90% 정부 부담", limit: "AI 3억 / 데이터 5천 / 클라우드 크레딧", why: "사업계획서 간소 — 견적서 + 도입 계획만. 신청 진입 장벽 가장 낮음", href: "https://www.nipa.kr" },
    { icon: ShieldCheck, title: "기보 + 시중은행 (지분 X)", bucket: "운영자금 1~5억", rate: "보증료 0.5~1.5%", limit: "최대 5억 무담보", why: "기술보증기금 기술평가 → 보증서 → 시중은행 저금리 대출. 벤처인증 시 보증료 우대", href: "https://www.kibo.or.kr" },
  ] : [
    { icon: Sparkles, title: "Pre-Startup / Youth Startup Academy", bucket: "≤100M seed", rate: "Grant (no repayment)", limit: "Up to 100M", why: "Pre-registration, under 39, <3yr old. Jan-Feb. 70% project cost + space + coaching", href: "https://www.k-startup.go.kr", primary: true },
    { icon: Banknote, title: "TIPS Program", bucket: "500M-800M seed-preA", rate: "Grant + matched investment", limit: "Up to 800M (R&D 500M + GTM 300M)", why: "Core tech-startup track. 149 operators match → invest → gov matches", href: "https://www.jointips.or.kr" },
    { icon: FileText, title: "AI / Data / Cloud Vouchers", bucket: "Adoption cost relief", rate: "70-90% gov-covered", limit: "AI 300M / Data 50M / Cloud credits", why: "Simplest application — quote + adoption plan only", href: "https://www.nipa.kr" },
    { icon: ShieldCheck, title: "KIBO + Bank (no equity)", bucket: "OpEx 100-500M", rate: "Guarantee fee 0.5-1.5%", limit: "Up to 500M unsecured", why: "KIBO tech assessment → guarantee → bank low-rate", href: "https://www.kibo.or.kr" },
  ]) : (
    // 사장님 — 예산별 차등 추천 (각 bucket 첫 번째가 추천 1순위)
    budgetBucket === "small" ? (ko ? [
      { icon: Banknote, title: "소상공인 정책자금 (소진공)", bucket: "5천만원 이하 추천 1순위", rate: "연 2.96%~ (비수도권 -0.2%p)", limit: "최대 7천만원", why: "신규 창업자 + 무담보 가능 + 1~2년 거치. 시중 대비 2~3%p 저렴. 3~4월 신청이 예산 가장 많음", href: "https://ols.semas.or.kr", primary: true },
      { icon: Sparkles, title: "소상공인 스마트화 / 디지털 바우처", bucket: "장비·POS·키오스크 도입 시", rate: "무상 (갚지 않음)", limit: "POS·키오스크 비용 70% 지원", why: "선정률 10~30%. 견적서 + 도입 계획만 필요. 신청 진입 장벽 낮음", href: "https://www.semas.or.kr" },
      { icon: ShieldCheck, title: "지자체 정책자금 + 신보 보증", bucket: "지역별 추가 지원", rate: "1~2%대", limit: "지자체별 최대 5천만원", why: "서울신보·경기신보 등 지자체 보증재단. 본 정책자금과 중복 수혜 가능", href: "https://www.kodit.co.kr" },
    ] : [
      { icon: Banknote, title: "SEMAS Policy Fund", bucket: "Top pick ≤50M", rate: "From 2.96% (-0.2%p non-metro)", limit: "Up to 70M", why: "New owners + unsecured + 1-2yr grace. 2-3%p below market. Mar-Apr fullest budget", href: "https://ols.semas.or.kr", primary: true },
      { icon: Sparkles, title: "Smart SME / Digital Voucher", bucket: "POS/kiosk adoption", rate: "Grant", limit: "70% of POS/kiosk cost", why: "10-30% selection. Quote + plan only", href: "https://www.semas.or.kr" },
      { icon: ShieldCheck, title: "Local Gov + KODIT Guarantee", bucket: "Regional add-on", rate: "1-2%", limit: "Up to 50M (varies)", why: "Seoul/Gyeonggi guarantee foundations. Stackable with main policy fund", href: "https://www.kodit.co.kr" },
    ])
    : budgetBucket === "medium" ? (ko ? [
      { icon: ShieldCheck, title: "신보·기보 보증 + 시중은행", bucket: "5천만~2억 추천 1순위", rate: "보증료 0.5~1.5% + 은행 4~5%", limit: "최대 2억 무담보", why: "보증서 발급 후 국민·신한·하나 등 시중은행 저금리 대출. 기보가 한도·금리 우위(기술기업)", href: "https://www.kodit.co.kr", primary: true },
      { icon: Banknote, title: "소상공인 일반경영안정자금", bucket: "운영자금 부족 시", rate: "연 2.96%~", limit: "최대 7천만원", why: "정책자금 + 보증서 결합으로 1억+ 가능. 거치 1년·상환 4년", href: "https://ols.semas.or.kr" },
      { icon: FileText, title: "대환대출 (기존 고금리 부채 시)", bucket: "기존 6~10% 대출 보유", rate: "고정 4.5%", limit: "기존 부채 한도", why: "시중은행 6~10% → 정책자금 4.5%. 연 수백만원 이자 절감", href: "https://ols.semas.or.kr" },
    ] : [
      { icon: ShieldCheck, title: "KODIT/KIBO Guarantee + Bank", bucket: "Top pick 50M-200M", rate: "Fee 0.5-1.5% + 4-5% bank", limit: "Up to 200M unsecured", why: "Get letter → KB/Shinhan/Hana low-rate. KIBO better for tech", href: "https://www.kodit.co.kr", primary: true },
      { icon: Banknote, title: "SEMAS General Stabilization Fund", bucket: "OpEx shortfall", rate: "From 2.96%", limit: "Up to 70M", why: "Combine with guarantee = 100M+. 1yr grace + 4yr term", href: "https://ols.semas.or.kr" },
      { icon: FileText, title: "Refinance Loan (high-rate debt)", bucket: "Existing 6-10% debt", rate: "Fixed 4.5%", limit: "Existing debt amount", why: "Save millions yearly converting bank → policy", href: "https://ols.semas.or.kr" },
    ])
    : (ko ? [
      { icon: Banknote, title: "중진공 직접대출", bucket: "2억+ 추천 1순위", rate: "연 2.0~4.5%", limit: "최대 1억 (운영자금) / 시설 5억", why: "성장기반자금·혁신성장촉진자금. 상환능력 + 사업계획서 정밀 평가", href: "https://www.kosmes.or.kr", primary: true },
      { icon: ShieldCheck, title: "기보 + 시중은행 (대규모)", bucket: "시설·확장자금", rate: "보증료 + 은행 3~5%", limit: "최대 5억 무담보", why: "기보 보증으로 시중은행 5억까지. 인테리어·장비·확장 시 활용", href: "https://www.kibo.or.kr" },
      { icon: FileText, title: "정책자금 + 보증 + 바우처 패키지", bucket: "복합 수혜 전략", rate: "혼합", limit: "10억+", why: "여러 자금을 결합 — 정책자금 7천 + 보증 2억 + 시설 3억 + 무상 바우처. 세무사·금융자문 동반 권장", href: "https://www.kosmes.or.kr" },
    ] : [
      { icon: Banknote, title: "KOSMES Direct Loan", bucket: "Top pick 200M+", rate: "2.0-4.5%", limit: "Up to 100M OpEx / 500M facility", why: "Growth fund / Innovation fund. Strict plan + repayment evaluation", href: "https://www.kosmes.or.kr", primary: true },
      { icon: ShieldCheck, title: "KIBO + Bank (large)", bucket: "Facility/expansion", rate: "Fee + 3-5% bank", limit: "Up to 500M unsecured", why: "KIBO guarantee → bank up to 500M for interior/equipment", href: "https://www.kibo.or.kr" },
      { icon: FileText, title: "Stack: Policy + Guarantee + Voucher", bucket: "Multi-source strategy", rate: "Mixed", limit: "1B+", why: "Combine: 70M policy + 200M guarantee + 300M facility + voucher. Use CPA/financial advisor", href: "https://www.kosmes.or.kr" },
    ])
  );

  /* ── Startup Support Programs ── */
  const matched = getMatchedPrograms(startupType);
  const filtered = progFilter === "all" ? matched : matched.filter(p => p.category === progFilter);
  const categories: Array<{ id: ProgramCategory | "all"; label: string }> = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "government", label: ko ? "정부" : "Gov" },
    { id: "private", label: ko ? "민간·재단" : "Private" },
    { id: "local", label: ko ? "지자체" : "Local" },
  ];

  /* ── K-Startup live programs ── */
  const loadLivePrograms = async () => {
    if (liveProgramsData.length > 0 || liveProgramsLoading) return;
    setLiveProgramsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const keyword = industryCategoryId === "startup-tech" ? "창업" : "소상공인";
      const res = await fetchLiveSupportPrograms({ keyword, numOfRows: 15 }, token);
      setLiveProgramsData(res.data.map(p => ({
        id: p.id,
        programName: p.programName,
        organizerName: p.organizerName,
        supportCategory: p.supportCategory,
        isOpen: p.isOpen,
        url: p.url,
      })));
    } catch { /* silent */ }
    setLiveProgramsLoading(false);
  };

  // 자동 로드 트리거
  if (liveProgramsData.length === 0 && !liveProgramsLoading) {
    void loadLivePrograms();
  }

  /* ── Business Plan Generator ── */
  const generatePlan = async () => {
    setBpLoading(true);
    setBpError(null);
    try {
      const loc = decisions["location-candidates"];
      const sfInputs = (decisions["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const geInputs = (decisions["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const body = {
        industry: industryCategoryId,
        subIndustry: selectedIndustryId ?? "",
        startupType: startupType ?? "independent",
        franchiseBrand: selectedFranchiseBrandId ? (await import("@build-up/shared")).getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko : undefined,
        businessModel: selectedBusinessModelId ?? "",
        capital: selectedBudget ?? 0,
        targetOpenDate: decisions["budget-setup"]?.inputs?.targetOpenDate ?? "",
        location: loc?.selectedPrimaryOptionId ?? "",
        locationScore: loc?.inputs?.score as number | undefined,
        bepRevenue: savedFinanceSnapshot?.breakEvenRevenue,
        runway: savedFinanceSnapshot?.survivabilityMonths,
        riskLevel: savedFinanceSnapshot?.riskLevel,
        language,
        problemStatement: sfInputs?.problemStatement as string | undefined,
        teamStructure: sfInputs?.teamStructure as string | undefined,
        northStarType: geInputs?.northStarType as string | undefined,
        northStarMetricName: geInputs?.northStarMetricName as string | undefined,
        targetCustomer: guideSelections["interview-target"] || undefined,
        interviewInsights: guideSelections["analysis-result"] ? "고객 인터뷰 분석 완료" : undefined,
      };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Login required");
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBpSections(data.sections);
      setBpSummary(data.summary);
    } catch (err) {
      setBpError(err instanceof Error ? err.message : "Failed");
    }
    setBpLoading(false);
  };

  const pg = guideStepIndex;
  const totalPg = 3;
  const pgLabels = ko
    ? ["내 상황 진단", "추천 자금 경로", "AI 사업계획서"]
    : ["My Situation", "Funding Paths", "AI Plan"];

  // ─── 디자인 토큰 ───
  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

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

  const TrapsCard = () => {
    const ts = traps[pg] ?? [];
    if (ts.length === 0) return null;
    return (
      <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
        {ts.map((trap) => (
          <div key={trap.label} style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            padding: "13px 15px", borderRadius: "14px",
            background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.14)",
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#dc2626", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(180,28,28,0.85)" }}>{trap.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const budgetLabel = budget === 0
    ? (ko ? "예산 미입력" : "Budget not set")
    : formatBudgetPresetLabel(budget, language);

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

      {/* ── KEY ACTION 히어로 ── */}
      <KeyActionCard />

      {/* ── Page 0: 내 상황 진단 + 예산별 추천 매트릭스 ── */}
      {pg === 0 && (
        <>
          {/* 내 상황 요약 카드 */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: "16px 18px" }}>
            <div style={sectionLabel}>{ko ? "현재 진단된 상황" : "Diagnosed situation"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
              {[
                { label: ko ? "업종" : "Industry", value: isStartup ? (ko ? "기술 스타트업" : "Tech startup") : (industryCategoryId || (ko ? "미입력" : "—")) },
                { label: ko ? "운영 형태" : "Type", value: startupType === "franchise" ? (ko ? "프랜차이즈" : "Franchise") : startupType === "independent" ? (ko ? "개인 운영" : "Independent") : (ko ? "미정" : "Undecided") },
                { label: ko ? "예산" : "Budget", value: budgetLabel },
                { label: ko ? "런웨이" : "Runway", value: savedFinanceSnapshot?.survivabilityMonths ? `${savedFinanceSnapshot.survivabilityMonths}${ko ? "개월" : "mo"}` : (ko ? "미입력" : "—") },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: "10.5px", fontWeight: 600, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "3px" }}>{item.label}</div>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 예산별 추천 매트릭스 */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap" as const, gap: "6px" }}>
              <span style={sectionLabel}>{ko ? "내 예산·상황 맞춤 추천" : "Recommended for your situation"}</span>
              {budget > 0 && (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "3px 10px", borderRadius: "999px", letterSpacing: "-0.01em" }}>
                  {budgetBucket === "small" ? (ko ? "5천 이하" : "≤50M") : budgetBucket === "medium" ? (ko ? "5천~2억" : "50-200M") : (ko ? "2억+" : "200M+")}
                </span>
              )}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <a key={rec.title} href={rec.href} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "16px",
                    borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                    textDecoration: "none", color: "inherit",
                    transition: "background 0.15s",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: MIDNIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: "0 2px 6px rgba(25,25,112,0.22)" }}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: "6px", marginBottom: "4px" }}>
                        {rec.primary && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "2px 8px", borderRadius: "999px", letterSpacing: "-0.01em", boxShadow: "0 1px 3px rgba(25,25,112,0.25)" }}>
                            {ko ? "추천 1순위" : "Top pick"}
                          </span>
                        )}
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{rec.title}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, columnGap: "12px", rowGap: "2px", marginBottom: "6px", fontSize: "12.5px" }}>
                        <span style={{ color: "rgba(0,0,0,0.45)" }}>
                          {ko ? "금리" : "Rate"} <span style={{ color: MIDNIGHT, fontWeight: 700 }}>{rec.rate}</span>
                        </span>
                        <span style={{ color: "rgba(0,0,0,0.45)" }}>
                          {ko ? "한도" : "Limit"} <span style={{ color: "var(--text)", fontWeight: 600 }}>{rec.limit}</span>
                        </span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{rec.why}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginTop: "4px" }}>
                      <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)" }} />
                      <ExternalLink size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.2)" }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 1: 추천 자금 경로 (단계별 절차) ── */}
      {pg === 1 && (
        <>
          {/* 매칭된 프로그램 (DB 기반) */}
          <div>
            <div style={sectionLabel}>{ko ? "내 업종 맞춤 프로그램" : "Programs matched to you"}</div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" as const }}>
              {categories.map(cat => {
                const active = progFilter === cat.id;
                return (
                  <button key={cat.id} type="button" onClick={() => setProgFilter(cat.id)}
                    style={{
                      padding: "5px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: active ? 700 : 500,
                      border: active ? "none" : "1px solid rgba(25,25,112,0.1)",
                      background: active ? MIDNIGHT : "transparent",
                      color: active ? "#fff" : "rgba(15,23,42,0.5)",
                      cursor: "pointer", letterSpacing: "-0.01em",
                      boxShadow: active ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                    }}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", maxHeight: 360, overflowY: "auto" }}>
              {filtered.map((prog, i) => {
                const catColor = getProgramCategoryColor(prog.category);
                return (
                  <a key={prog.id} href={prog.url} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "flex-start", gap: "12px", padding: "13px 16px",
                    borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                    textDecoration: "none", color: "inherit",
                  }}>
                    <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${catColor}15`, color: catColor, fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" as const }}>
                      {getProgramCategoryLabel(prog.category, language)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "2px" }}>{prog.name[language]}</div>
                      <div style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(0,0,0,0.5)" }}>{prog.target[language]}</div>
                      {prog.amount && <div style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginTop: "3px" }}>{prog.amount}</div>}
                    </div>
                    <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0, marginTop: "3px" }} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* 실시간 K-Startup */}
          <div style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={sectionLabel}>{ko ? "실시간 정부 지원사업 (K-Startup API)" : "Live Programs (K-Startup API)"}</span>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: MIDNIGHT, animation: liveProgramsLoading ? "pulse 1.5s infinite" : "none", marginBottom: "10px" }} />
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", maxHeight: 320, overflowY: "auto" }}>
              {liveProgramsLoading && liveProgramsData.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px", justifyContent: "center", fontSize: "13px", color: "rgba(0,0,0,0.5)" }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  {ko ? "실시간 공모 불러오는 중..." : "Loading live programs..."}
                </div>
              ) : liveProgramsData.length === 0 ? (
                <div style={{ padding: "20px", fontSize: "13px", color: "rgba(0,0,0,0.5)", textAlign: "center" as const }}>
                  {ko ? "현재 매칭된 공모가 없습니다." : "No matching programs."}
                </div>
              ) : (
                liveProgramsData.map((prog, i) => (
                  <a key={prog.id} href={prog.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "flex-start", gap: "12px", padding: "13px 16px",
                    borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                    textDecoration: "none", color: "inherit",
                  }}>
                    <div style={{
                      padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" as const,
                      background: prog.isOpen ? "rgba(25,25,112,0.1)" : "rgba(0,0,0,0.05)",
                      color: prog.isOpen ? MIDNIGHT : "rgba(0,0,0,0.45)",
                    }}>
                      {prog.isOpen ? (ko ? "공모중" : "Open") : (ko ? "마감" : "Closed")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "2px" }}>{prog.programName}</div>
                      <div style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(0,0,0,0.5)" }}>{prog.organizerName} · {prog.supportCategory}</div>
                    </div>
                    <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0, marginTop: "3px" }} />
                  </a>
                ))
              )}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 2: AI 사업계획서 ── */}
      {pg === 2 && (
        <>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${MIDNIGHT}, rgba(25,25,112,0.7))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: "0 2px 6px rgba(25,25,112,0.22)" }}>
                <FileText size={18} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {ko ? "사업계획서 자동 생성" : "Auto Business Plan"}
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>
                  {ko ? "Claude Sonnet 4.6 기반 · 입력한 로드맵 데이터를 활용" : "Claude Sonnet 4.6 · Uses your roadmap data"}
                </div>
              </div>
            </div>

            {!bpSections && !bpLoading && (
              <>
                <div style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(0,0,0,0.6)", marginBottom: "14px" }}>
                  {ko
                    ? "지금까지 입력한 업종, 상권, 재무 시뮬레이션 데이터를 기반으로 정책자금·TIPS·청년창업사관학교 신청에 적합한 사업계획서를 자동 생성합니다."
                    : "Auto-generates a business plan suitable for policy fund / TIPS / Youth Startup applications using your roadmap data."}
                </div>
                <button
                  type="button"
                  onClick={generatePlan}
                  style={{
                    width: "100%", padding: "13px 16px",
                    borderRadius: "12px",
                    background: MIDNIGHT, color: "#fff",
                    fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em",
                    border: "none", cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  <Sparkles size={15} strokeWidth={2.4} />
                  {ko ? "사업계획서 생성하기" : "Generate Business Plan"}
                </button>
              </>
            )}

            {bpLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "30px", fontSize: "14px", color: "rgba(0,0,0,0.55)" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {ko ? "AI가 사업계획서를 작성 중입니다... (30초~1분)" : "AI is writing your plan... (30s-1min)"}
              </div>
            )}

            {bpError && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.14)", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <AlertTriangle size={14} strokeWidth={2} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <div style={{ fontSize: "13px", color: "#dc2626", fontWeight: 700, marginBottom: "4px" }}>
                      {ko ? "생성 실패" : "Generation Failed"}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(180,28,28,0.85)" }}>{bpError}</div>
                  </div>
                </div>
                <button type="button" onClick={generatePlan} style={{ marginTop: "10px", padding: "7px 14px", borderRadius: "999px", border: "none", background: MIDNIGHT, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  {ko ? "다시 시도" : "Retry"}
                </button>
              </div>
            )}

            {bpSections && (
              <div style={{ marginTop: "10px" }}>
                {bpSummary && (
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: MIDNIGHT, marginBottom: "12px", lineHeight: 1.55, padding: "10px 12px", background: "rgba(25,25,112,0.04)", borderRadius: "10px" }}>
                    {bpSummary}
                  </div>
                )}
                <div style={{ display: "grid", gap: "6px" }}>
                  {bpSections.map((sec: { title: string; content: string }, idx: number) => {
                    const expanded = bpExpandedIdx === idx;
                    return (
                      <div key={idx} style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.07)", background: "white", overflow: "hidden" }}>
                        <button
                          type="button"
                          onClick={() => setBpExpandedIdx(expanded ? null : idx)}
                          style={{
                            width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            cursor: "pointer", textAlign: "left" as const,
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{sec.title}</span>
                          <ChevronRight size={15} strokeWidth={2} style={{ color: "rgba(0,0,0,0.35)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                        </button>
                        {expanded && (
                          <div style={{ padding: "0 16px 14px", fontSize: "13px", lineHeight: 1.7, color: "rgba(0,0,0,0.65)", whiteSpace: "pre-line" as const }}>
                            {sec.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const full = bpSections.map((s: { title: string; content: string }) => `${s.title}\n\n${s.content}`).join("\n\n---\n\n");
                    navigator.clipboard.writeText(full).catch(() => {});
                  }}
                  style={{
                    marginTop: "14px", width: "100%", padding: "11px",
                    borderRadius: "10px", border: `1px solid ${MIDNIGHT}`,
                    background: "rgba(25,25,112,0.04)", color: MIDNIGHT,
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <Copy size={13} strokeWidth={2.2} />
                  {ko ? "전체 텍스트 복사하기" : "Copy Full Text"}
                </button>
              </div>
            )}
          </div>

          {/* 자금 조달 성공 팁 */}
          <div style={{ marginTop: "18px" }}>
            <div style={sectionLabel}>{ko ? "자금 조달 성공률을 높이는 핵심 팁" : "Tips to Increase Funding Success"}</div>
            <div style={{ background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.1)", borderRadius: "12px", padding: "12px 14px" }}>
              {(ko ? [
                "사업계획서 '자금 사용 계획'은 항목별 구체 금액을 적으세요 — '운전자금' 한 줄은 거절 1순위",
                "재무 시뮬레이션을 먼저 돌리세요 — 손익분기 매출과 런웨이가 사업계획서의 근거",
                "정책자금은 3~4월에 신청하세요 — 예산이 가장 많고, 하반기는 소진 가능",
                "여러 프로그램에 동시 지원하세요 — 정책자금 + 바우처 + 지자체 중복 수혜 가능",
              ] : [
                "Itemize 'fund usage plan' — vague 'working capital' is the #1 rejection reason",
                "Run finance simulation first — BEP and runway are your evidence",
                "Apply Mar-Apr — fullest budget, may deplete in H2",
                "Apply to multiple programs in parallel — stackable benefits",
              ]).map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12.5px", color: MIDNIGHT, opacity: 0.85, lineHeight: 1.6, padding: "4px 0" }}>
                  <span style={{ flexShrink: 0, fontWeight: 800 }}>{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── 2026-05-12 P0: 검토 완료 명시적 confirmation. 다음 단계로 advance 게이트. ── */}
      <button
        type="button"
        onClick={() => setLoanChecks((prev) => ({ ...prev, [LOAN_REVIEW_KEY]: !prev[LOAN_REVIEW_KEY] }))}
        style={{
          marginTop: 16,
          width: "100%",
          textAlign: "left" as const,
          padding: "14px 16px",
          borderRadius: 12,
          background: loanReviewed
            ? "linear-gradient(180deg, rgba(5,150,105,0.06) 0%, rgba(5,150,105,0.02) 100%)"
            : "rgba(25,25,112,0.04)",
          border: loanReviewed ? "1px solid rgba(5,150,105,0.28)" : "1px solid rgba(25,25,112,0.14)",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          transition: "all 0.18s ease",
        }}
      >
        <span style={{
          flexShrink: 0,
          width: 22, height: 22, borderRadius: 6,
          background: loanReviewed ? "#059669" : "white",
          border: loanReviewed ? "1px solid #059669" : "1.5px solid rgba(25,25,112,0.25)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 13, fontWeight: 800,
          marginTop: 1,
        }}>
          {loanReviewed ? "✓" : ""}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: loanReviewed ? "#059669" : MIDNIGHT, letterSpacing: "-0.005em" }}>
            {ko ? "정책자금·대출 내용을 모두 검토했습니다" : "I have reviewed all the funding & loan content above"}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
            {ko
              ? "이 체크박스를 눌러야 다음 단계로 진행할 수 있습니다. 위 내용을 충분히 읽고 본인 상황에 맞는 자금원을 식별했는지 확인하세요."
              : "Tick this checkbox to advance. Confirm you've read all content and identified funding sources fitting your case."}
          </div>
        </div>
      </button>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="사업자등록·인허가"
        doneItemsKo={[
          { label: "1. 자금 수요·구조 진단", detail: "초기 시설자금 vs 운영자금 분리 + 대출 vs 정부지원금 우선순위 결정" },
          { label: "2. 정책자금 후보군 매칭", detail: "소상공인시장진흥공단·신보·기보·중기부 매칭 — 업종·기간·자본 자동 필터" },
          { label: "3. 신용·재무 점검", detail: "개인신용 점수·기존 부채·연체 기록 사전 정리, 사업자 신용평가 사전 시뮬" },
          { label: "4. 신청 일정·서류 준비", detail: "사업계획서·매출 시뮬·자금 사용 계획 3종 + 추천 기관 면담 일정 확보" },
        ]}
        verifyItemsKo={[
          "정책자금 — 1순위는 「보증부 대출」 (소상공인시장진흥공단·신보·기보 보증서 80~90% 보증)",
          "이자 부담 — 매출 0원 가정 6개월 운영자본 대비 월 이자 한계점 시뮬, 「운영자본 잠식」 1순위 부도 원인",
          "보증 한도 — 신보·기보 통합 한도 (1인 8억 등) 인지, 다중 신청 시 보증 거절 위험",
          "사업계획서 — 「자금 사용 계획」 + 「상환 계획」 명확해야 심사 통과율 상승, 두루뭉술하면 거절",
          "정부지원금 — 「선정 후 입금」까지 평균 4~12주, 일정 역산 필수 (오픈 직전 신청 X)",
          "사기 주의 — 「대출 100% 보장」 「선수수료」 요구하는 브로커는 모두 사기, 직접 신청 원칙",
        ]}
        nextSummaryKo="자금 구조·대출 후보 확정 → 사업자등록·인허가 단계로 진입"
      />

      {/* ── 단계 푸터는 부모(CurrentStageView)에서 자동 렌더링됨 ── */}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
