"use client";

/**
 * InsuranceTaxSetupStage — 보험·세무 세팅 (Stage 12)
 *
 * 2026-04 전면 리빌드:
 *   • 미드나이트 블루(#191970) Apple-style UI 통일 (VendorSetup·Registration 패턴)
 *   • WHY / HOW / PATH 흐름 — 왜 필요, 어떻게 하는가, 직원 수별 유리한 길
 *   • 4페이지 페이지네이션 (RegistrationSetup 과 동일 구조)
 *   • 2026 최신 요율 검증:
 *       - 국민연금 9.5% (각 4.75%) — 2025년 9% → 2026년 인상
 *       - 건강보험 7.19% (각 3.595%) — 2025 7.09% → 2026 인상
 *       - 장기요양 0.9448% (건강보험료 기준) — 2025 0.9182% → 2026 인상
 *       - 고용보험 1.8% (각 0.9%) + 사업주 추가 0.25~0.85%
 *       - 산재 0.7%~30% (업종별, 사업주 100%)
 *       - 두루누리: 월보수 270만 미만 + 10인 미만 → 80% 국가 지원, 최대 36개월
 *
 *  검증 출처:
 *   • 4대사회보험 정보연계센터 (4insure.or.kr) — 공식
 *   • 국민연금공단·건강보험공단 2026 인상 안내
 *   • brunch.co.kr/@shopl/486 — 2026 변경 정리
 *   • hrsideteam.com 2026 4대보험요율
 */

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Calculator,
  Lightbulb,
  Receipt,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Wallet,
  Users,
  Building2,
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
import { StageWrapup } from "../shared/StageWrapup";

/* ───────────────────────────────────────────────────────────────────
 * 산재보험 요율 — 카테고리별 (2026 기준)
 * ───────────────────────────────────────────────────────────────── */

const ACCIDENT_RATE_BY_CATEGORY: Record<string, { rate: string; label: string }> = {
  food: { rate: "0.8%", label: "도소매·음식·숙박업" },
  "cafe-dessert": { rate: "0.8%", label: "도소매·음식·숙박업" },
  retail: { rate: "0.8%", label: "도소매·음식·숙박업" },
  beauty: { rate: "0.6%", label: "전문·보건·교육·여가 서비스업" },
  fitness: { rate: "0.6%", label: "전문·보건·교육·여가 서비스업" },
  education: { rate: "0.6%", label: "전문·보건·교육·여가 서비스업" },
  pet: { rate: "0.8%", label: "도소매·음식·숙박업" },
  space: { rate: "0.8%", label: "도소매·음식·숙박업" },
  "living-service": { rate: "0.7%", label: "기타 서비스업" },
  "online-digital": { rate: "0.7%", label: "전자상거래업" },
};

/* ───────────────────────────────────────────────────────────────────
 * 공통 sub-component primitives (RegistrationSetup 패턴 차용)
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

export function InsuranceTaxSetupStage() {
  const d = useDashboardCtx();
  const { industryCategoryId, language } = d;

  const [page, setPage] = useState(0);
  const totalPages = 4;
  const pageLabels = ["왜 필요한가", "1. 4대보험", "2. 원천세", "3. 급여 + 유리한 길"];

  const accidentInfo = useMemo(() => {
    return ACCIDENT_RATE_BY_CATEGORY[industryCategoryId ?? ""] ?? { rate: "0.7%", label: "일반 서비스업" };
  }, [industryCategoryId]);

  return (
    <div className="bento-fade-in" style={{ marginBottom: "16px" }}>
      {/* ═══════════════════════════════════════════════════════════
          KEY ACTION HERO
          ═════════════════════════════════════════════════════════ */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title="첫 직원 채용 시 4가지 의무 — 근로계약서 즉시 + 4대보험 14일 + 원천세 매월"
        subtitle={
          <>
            직원 1명만 채용해도 4가지 의무 자동 발생: <strong style={{ fontWeight: 700 }}>① 근로계약서 (미체결 500만 과태료)</strong> +
            <strong style={{ fontWeight: 700 }}> ② 4대보험 14일 이내</strong> +
            <strong style={{ fontWeight: 700 }}> ③ 원천세 매월 10일</strong> +
            <strong style={{ fontWeight: 700 }}> ④ 급여 시스템</strong>. 5인 미만 예외 X.
            <strong style={{ fontWeight: 700 }}> 두루누리 80% 지원 (270만 미만·10인 미만, 36개월)</strong> 신고 시점에만 신청 가능.
          </>
        }
        miniCards={[
          { icon: FileText, label: "근로계약서", detail: "당일 즉시" },
          { icon: ShieldCheck, label: "4대보험", detail: "14일 이내" },
          { icon: Receipt, label: "원천세 + 급여", detail: "매월 10일" },
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
        <Section icon={Lightbulb} title="왜 이 단계가 중요한가" subtitle="직원 1명 채용 = 자동 발생 의무 5가지 (2026 변화 포함)">
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  accent: "#dc2626",
                  title: "근로계약서 미체결 = 500만원 과태료 (1차)",
                  body:
                    "채용 당일 또는 출근 전 반드시 작성·교부. 임금·근로시간·휴일·휴가 등 핵심 조건 명시 의무. 표준근로계약서는 고용노동부에서 무료 다운로드 — 근로기준법 17조 위반 시 1차 500만원, 2차 1,000만원.",
                },
                {
                  accent: MIDNIGHT,
                  title: "4대보험 14일 이내 신고 — 5인 미만 예외 X",
                  body:
                    "근로자 1명만 채용해도 4대사회보험 (국민연금·건강보험·고용·산재) 가입 의무. 건강보험 14일 / 국민연금·고용·산재 다음달 15일까지. 미신고 시 가산세 + 소급납부. 국세청은 카드 매출 분석(PCI) 으로 무신고 추적.",
                },
                {
                  accent: "#0561fc",
                  title: "사업주 부담 = 급여의 약 10% 추가",
                  body:
                    "근로자 월급 250만원이면 사업주가 추가 부담하는 4대보험료만 약 25만원. 인건비를 계산할 때 '급여 + 사업주 부담분' 으로 봐야 정확한 손익. 2026 요율: 국민연금 4.75%·건강 3.595%·고용 0.9%+α·산재 0.7-0.8% (업종별).",
                },
                {
                  accent: "#059669",
                  title: "두루누리 80% 국가 지원 — 신고 시점에만 신청 가능",
                  body:
                    "월 보수 270만원 미만 신규 가입자 + 10인 미만 사업장 = 고용·국민연금 보험료 80%를 정부가 최대 36개월 지원. 4대보험 취득신고 시 '두루누리 지원' 체크박스 — 한 번 놓치면 재신청 불가. 청년·신규 사업주에게 결정적인 자금 여유.",
                },
                {
                  accent: "#7c3aed",
                  title: "2026 신규: 건강보험 연말정산 자동화",
                  body:
                    "2026년부터 사업주가 국세청에 근로소득 간이지급명세서 제출하면 건강보험 연말정산 자동 연계. 기존 국세청 + 건강보험공단 각각 신고 → 1회 신고로 통합. 페이퍼워크 절감.",
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
                      <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{item.body}</div>
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
          PAGE 1 — HOW Step 1: 4대보험 가입 + 요율 + 두루누리
          ═════════════════════════════════════════════════════════ */}
      {page === 1 && (
        <>
          {/* 요율표 */}
          <Section
            icon={ShieldCheck}
            title="2026년 4대보험 요율 (사업주 vs 근로자)"
            subtitle="국민연금·건강보험·고용·산재 — 모두 2026년 인상 반영"
          >
            <div style={{ padding: "0" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr 1fr",
                  background: MIDNIGHT_SOFT,
                  padding: "10px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "rgba(25,25,112,0.55)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                <span>보험 종류</span>
                <span style={{ textAlign: "right" as const }}>사업주 부담</span>
                <span style={{ textAlign: "right" as const }}>근로자 부담</span>
              </div>
              {[
                { name: "국민연금", emp: "4.75%", ee: "4.75%", note: "2026년 9.5%로 인상 (기존 9%)" },
                { name: "건강보험", emp: "3.595%", ee: "3.595%", note: "2026년 7.19%로 인상 (기존 7.09%)" },
                { name: "장기요양보험", emp: "별도", ee: "별도", note: "임금의 0.9448% (= 건보료 × 13.14%, 2026 인상)" },
                { name: "고용보험", emp: "0.9% + α", ee: "0.9%", note: "α = 고용안정·직업능력개발 (사업주 0.25~0.85% 추가)" },
                { name: "산재보험", emp: accidentInfo.rate, ee: "0%", note: `${accidentInfo.label} — 사업주 100% 부담` },
              ].map((row, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr",
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                    fontSize: "13px",
                    background: i === arr.length - 1 ? "rgba(220,38,38,0.02)" : "white",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{row.name}</div>
                    <div style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>{row.note}</div>
                  </div>
                  <div style={{ textAlign: "right" as const, fontWeight: 700, color: MIDNIGHT, fontVariantNumeric: "tabular-nums" }}>
                    {row.emp}
                  </div>
                  <div style={{ textAlign: "right" as const, color: "rgba(15,23,42,0.5)", fontVariantNumeric: "tabular-nums" }}>
                    {row.ee}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 신고 절차 */}
          <Section icon={FileText} title="신고 절차" subtitle="채용일 14일 이내 — 4대사회보험 정보연계센터 일괄 신고">
            <StepRow
              number={1}
              title="4대사회보험 정보연계센터 회원가입"
              detail="4insure.or.kr 접속 → 사업자등록번호 + 공동인증서·간편인증으로 가입"
            />
            <StepRow
              number={2}
              title="사업장 성립신고 (최초 1회)"
              detail="사업 개시일 · 업종 · 소재지 · 근로자 수 입력. 성립신고가 안 끝나면 근로자 신고 불가"
            />
            <StepRow
              number={3}
              title="근로자 자격취득 신고 (직원당)"
              detail="입사일 · 보수월액 · 주민번호 · 부양가족 정보 입력. 4가지 보험 동시 신고됨"
            />
            <StepRow
              number={4}
              title="두루누리 지원 체크 (해당 시 자동 적용)"
              detail="월 보수 270만 미만 + 10인 미만 사업장이면 신고 화면에서 '두루누리 지원' 체크. 고용보험·국민연금 80% 국가 지원 (36개월)"
              isLast
            />

            {/* meta */}
            <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <MetaPair label="기한" value="14일" sublabel="채용 후" />
              <MetaPair label="비용" value="무료" sublabel="신고 자체" />
              <MetaPair label="장소" value="4insure.or.kr" />
            </div>

            {/* 외부 링크 */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, padding: "0 16px 14px" }}>
              {[
                { label: "4대사회보험 정보연계센터", url: "https://www.4insure.or.kr" },
                { label: "두루누리 지원 확인", url: "https://insurancesupport.or.kr" },
                { label: "산재보험 업종별 요율", url: "https://www.kcomwel.or.kr" },
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

          {/* 트랩 */}
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
                사장님이 자주 빠지는 함정
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
                <li>현금 급여 지급 후 미신고 — 카드 매출(PCI) 분석으로 추적, 가산세 50%+</li>
                <li>친·인척 직원도 4대보험 신고 의무 (배우자·자녀 포함)</li>
                <li>알바 시급 신고 누락 — 일용직도 산재보험 의무 가입</li>
                <li>퇴사자 자격상실 신고 지연 — 사업주가 보험료 계속 부담</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — HOW Step 2: 원천세
          ═════════════════════════════════════════════════════════ */}
      {page === 2 && (
        <>
          <Section icon={Receipt} title="원천세 — 매월 급여 지급 시 세금 공제" subtitle="간이세액표로 자동 계산 → 다음 달 10일까지 홈택스 신고">
            <StepRow
              number={1}
              title="홈택스에서 간이세액표 조회"
              detail="급여액 + 부양가족 수 입력 → 원천징수 세액 자동 산출. 부양가족 1명당 약 10만원 공제 효과"
            />
            <StepRow
              number={2}
              title="매월 급여일에 원천징수"
              detail="급여에서 [근로소득세 + 지방소득세 (소득세의 10%)] 공제 후 지급. 월급여 250만원 + 부양 1명 = 약 4.5만원 원천징수"
            />
            <StepRow
              number={3}
              title="다음 달 10일까지 홈택스 신고·납부"
              detail="홈택스 → 신고/납부 → 원천세. 신고 누락 시 가산세 (지연일수 × 0.022%/일 + 무신고 20%)"
            />
            <StepRow
              number={4}
              title="반기납부 신청 검토 (상시근로자 20인 이하)"
              detail="1월·7월 직전 6개월치 일괄 신고. 매월 신고의 부담 절반. 단 자금 흐름 관리 필요"
              isLast
            />

            <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <MetaPair label="신고기한" value="익월 10일" sublabel="매월" />
              <MetaPair label="대안" value="반기납부" sublabel="20인 이하" />
              <MetaPair label="장소" value="홈택스" />
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, padding: "0 16px 14px" }}>
              {[
                { label: "홈택스 간이세액표", url: "https://www.hometax.go.kr" },
                { label: "원천세 신고 매뉴얼", url: "https://www.nts.go.kr" },
                { label: "반기납부 신청", url: "https://www.hometax.go.kr" },
              ].map((link) => (
                <a
                  key={link.label}
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

          {/* 매월 vs 반기 비교 */}
          <Section icon={Calculator} title="매월 신고 vs 반기납부 — 어떤 게 유리?" subtitle="자금 흐름 + 페이퍼워크 부담 vs 큰 일괄 납부">
            <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "6px" }}>매월 신고</div>
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>
                  ✓ 매월 소액 납부 (자금 부담 적음)<br />
                  ✓ 직원 입·퇴사 즉시 반영<br />
                  ✗ 매월 페이퍼워크 (1-2시간/월)<br />
                  <strong>권장: 직원 5명+ 또는 변동 잦은 매장</strong>
                </div>
              </div>
              <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.18)" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#059669", marginBottom: "6px" }}>반기납부 (20인 이하)</div>
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>
                  ✓ 1월·7월 연 2회만 신고<br />
                  ✓ 페이퍼워크 부담 1/6<br />
                  ✗ 큰 금액 일괄 납부 (자금 계획 필요)<br />
                  <strong>권장: 직원 1-3명, 안정적 운영</strong>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — HOW Step 3 + PATH: 급여 방식 + 직원수별 유리한 길
          ═════════════════════════════════════════════════════════ */}
      {page === 3 && (
        <>
          {/* 급여 지급 방식 3가지 */}
          <Section icon={Wallet} title="급여 시스템 — 3가지 옵션 비교" subtitle="매장 규모·예산·실수 리스크에 따라 선택">
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  Icon: FileText,
                  title: "수기 관리 (엑셀)",
                  desc:
                    "예스폼 급여대장 양식 활용. 4대보험·원천세 직접 계산. 실수 시 본인 책임. 무료지만 5명 넘어가면 위험.",
                  cost: "무료",
                  fit: "직원 1~2명",
                  warn: false,
                },
                {
                  Icon: Building2,
                  title: "세무사 위임",
                  desc:
                    "월 수임료 10~30만원. 급여·4대보험·원천세·연말정산 전부 대행. 가장 안전. 세무 리스크 0. 부가세·종소세도 같이 가능.",
                  cost: "월 10~30만",
                  fit: "전 규모",
                  warn: false,
                },
                {
                  Icon: Calculator,
                  title: "급여 SaaS (flex, 알밤, 자비스)",
                  desc:
                    "자동 급여 계산 + 명세서 발송 + 4대보험 연동 + 출퇴근 기록. 직원 수 기반 과금. 3명+부터 손익 맞음. 단 세무사 대체는 아님.",
                  cost: "월 0~5만",
                  fit: "직원 3명+",
                  warn: false,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "white",
                    border: `1px solid ${MIDNIGHT_BORDER}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: MIDNIGHT_SOFT,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <item.Icon size={15} strokeWidth={2.2} color={MIDNIGHT} />
                    </div>
                    <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: "12.5px", lineHeight: 1.55, color: "rgba(15,23,42,0.7)", marginBottom: "8px" }}>
                    {item.desc}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        background: MIDNIGHT_SOFT,
                        color: MIDNIGHT,
                        fontWeight: 700,
                      }}
                    >
                      {item.cost}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        background: "rgba(15,23,42,0.05)",
                        color: "rgba(15,23,42,0.6)",
                        fontWeight: 600,
                      }}
                    >
                      적합: {item.fit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* PATH — 사용자 상황별 유리한 길 */}
          <Section icon={Users} title="당신 상황에 유리한 길" subtitle="직원 수·매출·업종별 권장 시나리오">
            <div style={{ padding: "14px 16px" }}>
              <PathCard
                condition="1인 사업자 (직원 0)"
                recommendation="4대보험 신고 불필요 — 본인은 지역가입자"
                reason="대표자 본인은 직장가입자 대상이 아님. 지역의보 + 지역연금으로 자동 가입. 단, 본인 명의 사업장에 본인을 임원으로 등재한 경우는 별개."
              />
              <PathCard
                condition="직원 1~2명 + 월급 270만 미만"
                recommendation="두루누리 80% 지원 + 수기 엑셀로 시작"
                reason="신규 가입자라면 두루누리로 보험료 80% 지원받음. 사업주 부담만 약 5%로 떨어짐. 페이퍼워크는 엑셀 + 매월 신고로 충분. 단, 실수 위험 큼 — 첫 신고는 세무서 방문 권장."
              />
              <PathCard
                condition="직원 3~5명"
                recommendation="급여 SaaS (flex / 알밤) + 두루누리 + 반기납부"
                reason="SaaS 월 5만 < 수기 실수 위험 + 시간 비용. 반기납부로 페이퍼워크 1/6. 두루누리 가능자는 반드시 신청. 세무사 위임은 5명부터 검토."
              />
              <PathCard
                condition="직원 6명 이상"
                recommendation="세무사 위임 적극 검토"
                reason="월 10-30만 = 본인 시간 5시간 가치 이상. 부가세·종소세까지 통합 처리되며 세무조사 리스크 0. 매장 운영에 집중하는 것이 ROI 높음."
              />
              <PathCard
                condition="알바·시급 직원만 운영"
                recommendation="일용근로자 신고 — 월 60시간 + 1개월 미만 기준"
                reason="일용직은 산재만 의무 가입. 월 60시간 이상 + 1개월 이상 근무 시 4대보험 모두 가입 의무. 시급 알바 늘릴 때 사회보험 부담 미리 계산해야 함."
              />
            </div>
          </Section>

          {/* 체크리스트 + 다음 단계 */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "14px",
              background: "rgba(25,25,112,0.04)",
              border: `1px dashed ${MIDNIGHT_BORDER}`,
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Sparkles size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.02em" }}>
                채용 직후 체크리스트
              </div>
            </div>
            <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", lineHeight: 1.75, color: "rgba(15,23,42,0.78)" }}>
              <li>채용 즉시: 근로계약서 작성 (필수, 미체결 시 500만 과태료)</li>
              <li>14일 이내: 4대사회보험 정보연계센터 → 사업장 성립 + 근로자 취득 신고</li>
              <li>두루누리 자동 적용 체크 (해당자만 — 신청 안 하면 자동 적용 안 됨)</li>
              <li>첫 급여일 전: 홈택스 간이세액표로 원천세 계산법 숙지</li>
              <li>첫 급여 지급일 다음 달 10일까지: 홈택스 원천세 신고·납부</li>
              <li>반기납부 신청 검토 (20인 이하 + 안정적 운영 시)</li>
              <li>직원 3명+ 시: 급여 SaaS 도입 또는 세무사 면담</li>
            </ol>
          </div>

          <div
            style={{
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
                다음 단계: 채용 비용 계산기 + 채용·운영 세팅
              </div>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
                보험·세무 시스템이 완성되면, 다음은 실제 채용 + 매장 운영 세팅. 채용 비용 계산기로
                급여 + 4대보험 + 퇴직금까지 합한 실비를 미리 시뮬레이션 해보세요.
              </div>
            </div>
          </div>
        </>
      )}

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="채용·운영 세팅"
        doneItemsKo={[
          { label: "1. 4대보험 의무 이해", detail: "1인 고용부터 4대보험 의무 — 국민·건강·고용·산재 4축 이해" },
          { label: "2. 원천세 신고 일정", detail: "매월 10일 홈택스 원천세 신고·납부 + 자동이체 셋업" },
          { label: "3. 산재 요율 확인", detail: "업종별 0.7~5.6% 사업주 100% 부담 별도 계산" },
          { label: "4. 급여·유리한 길 점검", detail: "주휴수당·퇴직금 등 누락 시 차액·가산금 발생 인식" },
        ]}
        verifyItemsKo={[
          "1인 사장님 — 본인 국민연금·건강보험 「지역가입자」로 자동 전환, 사업자 신고 시 분리 가입",
          "직원 채용 14일 이내 4insure.or.kr 통합 신고 — 누락 시 과태료 + 소급 보험료 부담",
          "원천세 — 매월 10일 자동이체 셋업, 누락 시 가산세 10% + 일별 이자 (홈택스 자동납부 권장)",
          "산재보험 — 사업주 100% 부담 별도 계산, 업종별 요율 적용 (외식 0.8%, 미용 0.7% 수준)",
          "퇴직금 — 1년 근속 + 주 15시간 이상 의무, 매월 12분의 1 적립 권장 (분쟁 1순위)",
          "5인 이상 사업장 — 연차 의무 + 연장수당 1.5배 + 야간수당 1.5배 모두 추가 비용 (월 30~50만원/인)",
        ]}
        nextSummaryKo="4대보험·원천세·급여 시스템 셋업 완료 → 채용·운영 세팅 단계로 진입"
      />
    </div>
  );
}
