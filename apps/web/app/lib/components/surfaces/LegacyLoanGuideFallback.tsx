"use client";

import type { CSSProperties } from "react";
import type { Language } from "@foundone/shared";
import { styles } from "../../styles";
import {
  calculateLegacyLoanGateSummary,
  getLegacyLoanReviewLabel,
  getLegacyLoanReviewTitle,
} from "./guide-verification-footer-state";
import { GuideVerificationFooter } from "./GuideVerificationFooter";

const LEGACY_LOAN_FUNDS = [
  { name: "성장기반자금", target: "소공인 (제조업 10인 미만)", rate: "3.56%", limit: "최대 7천만 원", tag: "" },
  { name: "일반경영안정자금", target: "업력 무관 소상공인 전체", rate: "3.56%", limit: "최대 7천만 원", tag: "" },
  { name: "혁신성장촉진자금", target: "수출·매출 성장 기업", rate: "3.36%", limit: "최대 1억 원", tag: "우대" },
  { name: "청년고용연계자금", target: "만 39세 이하 청년 창업자", rate: "2.96%", limit: "최대 7천만 원", tag: "청년" },
  { name: "청년전용창업자금 (중진공)", target: "만 39세 이하 · 업력 3년 미만", rate: "2.5% 고정", limit: "최대 1억 원 (제조 2억)", tag: "청년" },
  { name: "재도전특별자금", target: "재창업자 (폐업 이력 있음)", rate: "3.36~4.56%", limit: "최대 7천만 원", tag: "" },
  { name: "긴급경영안정자금", target: "재해·경영위기 피해 사업자", rate: "2.0~2.96%", limit: "최대 7천만 원", tag: "긴급" },
];

const LEGACY_ELIGIBILITY_CHECKS = [
  { id: "elig-biz", label: "사업자등록증 발급 완료", detail: "개인사업자 또는 법인 모두 가능. 업력 무관 지원 가능 (자금별 상이)" },
  { id: "elig-noTax", label: "국세·지방세 체납 없음", detail: "체납 이력이 있으면 즉시 탈락. 홈택스에서 납세증명서 미리 확인" },
  { id: "elig-credit", label: "신용점수 확인 (NCB 기준)", detail: "일반 자금은 특별 제한 없음. 신용취약자금은 839점 이하 대상" },
  { id: "elig-noOverlap", label: "동일 정책자금 중복 수령 없음", detail: "소진공·중진공 동일 계열 자금은 중복 지원 불가. 기존 대출 상환 상태 확인" },
  { id: "elig-industry", label: "업종 제한 확인", detail: "유흥업·도박 등 일부 업종 제외. 소진공 홈페이지에서 자금별 제외 업종 확인" },
  { id: "elig-region", label: "사업장 소재지 확인", detail: "비수도권 소재 시 우대금리 0.2~0.5%p 추가 적용 가능" },
];

const LEGACY_DOC_CHECKS = [
  { id: "doc-biz", label: "사업자등록증 사본", detail: "국세청 홈택스 또는 정부24에서 발급" },
  { id: "doc-vat", label: "부가세 과세표준증명원", detail: "홈택스 → 민원증명 → 부가가치세 과세표준증명. 창업 초기는 생략 가능" },
  { id: "doc-revenue", label: "매출 증빙 (카드매출·세금계산서)", detail: "카드 결제 내역 또는 세금계산서 합계표. 최근 6개월~1년치" },
  { id: "doc-id", label: "신분증 사본", detail: "대표자 주민등록증 또는 운전면허증" },
  { id: "doc-bank", label: "사업용 통장 사본", detail: "사업 관련 입출금 내역이 있는 통장. 개인통장 혼용 시 불이익 가능" },
  { id: "doc-plan", label: "사업계획서", detail: "소진공 신청 시 필수. 창업 목적·예상 매출·자금 사용 계획 포함. A4 3~5장 권장" },
  { id: "doc-tax", label: "납세증명서 (국세·지방세)", detail: "정부24 또는 홈택스에서 발급. 체납 없음을 증명" },
];

const LEGACY_APPROVAL_TIPS = [
  { title: "사업계획서가 당락을 가릅니다", body: "심사관은 '이 사람이 돈을 갚을 수 있는가'를 봅니다. 매출 목표를 구체적 수치(예: 월 매출 300만 원 목표, 좌석 수 20석 × 객단가 × 회전율)로 뒷받침하세요." },
  { title: "매출 감소 사유는 반드시 설명하세요", body: "코로나·인테리어 공사 등 외부 요인이 있다면 소명 자료를 첨부하세요. 설명 없는 매출 감소는 탈락 원인 1위입니다." },
  { title: "기존 대출 총액을 미리 파악하세요", body: "금융기관 대출 + 정책자금 기존 수령액 합산이 지원 한도를 초과하면 탈락합니다. 신용정보원(credit.or.kr)에서 조회 가능합니다." },
  { title: "소진공 상담사를 적극 활용하세요", body: "신청 전 소진공 지역 센터 방문 상담(무료)을 받으면 부족한 서류나 사업계획서 보완 포인트를 미리 알 수 있습니다." },
];

const LEGACY_PREFERENTIAL_RATES = [
  { condition: "제로페이·온누리상품권 가맹점", discount: "0.2%p 인하" },
  { condition: "자영업자 고용보험 가입자", discount: "0.2%p 인하" },
  { condition: "비수도권 사업장 소재", discount: "0.2~0.5%p 인하" },
  { condition: "사회적기업·협동조합 인증", discount: "별도 우대 적용" },
  { condition: "청년 창업자 (만 39세 이하)", discount: "청년 전용 자금 별도 운용" },
];

type LegacyLoanGuideFallbackProps = {
  guideQuestion: string;
  handleKnowledgeQuestion: (domain: "loan") => void;
  knowledgeQaError: string;
  knowledgeQaStatus: string;
  knowledgeQaText: string;
  language: Language;
  loanChecks: Record<string, boolean>;
  markLoanReviewedLabel: string;
  onBack: () => void;
  onConfirm: () => void;
  savedGuideQaSnapshot: { question: string } | null;
  setGuideQuestion: (value: string) => void;
  setLoanChecks: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
};

export function LegacyLoanGuideFallback({
  guideQuestion,
  handleKnowledgeQuestion,
  knowledgeQaError,
  knowledgeQaStatus,
  knowledgeQaText,
  language,
  loanChecks,
  markLoanReviewedLabel,
  onBack,
  onConfirm,
  savedGuideQaSnapshot,
  setGuideQuestion,
  setLoanChecks,
}: LegacyLoanGuideFallbackProps) {
  const eligDone = LEGACY_ELIGIBILITY_CHECKS.filter((check) => loanChecks[check.id]).length;
  const docDone = LEGACY_DOC_CHECKS.filter((check) => loanChecks[check.id]).length;
  const cardStyle = { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginTop: "14px" };
  const cardHeaderStyle = { padding: "20px 20px 14px" };
  const cardLabelStyle = { fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" };
  const cardTitleStyle = { fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px" };
  const cardSubStyle = { fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "3px" };
  const dividerMain = { height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" };
  const dividerSub = { height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 20px" };
  const legacyLoanGate = calculateLegacyLoanGateSummary({
    eligDone,
    eligTotal: LEGACY_ELIGIBILITY_CHECKS.length,
    docDone,
    docTotal: LEGACY_DOC_CHECKS.length,
  });

  return (
    <>
      <article style={styles.step}>
        <div style={styles.stepMeta}>대출</div>
        <div style={styles.stepTitle}>사업 대출 완전 가이드</div>
        <div style={styles.stepBody}>2026년 최신 정책자금 정보를 바탕으로, 초보 창업자도 쉽고 확실하게 신청할 수 있도록 도와드립니다.</div>

        <div style={{ ...cardStyle, marginTop: "20px" }}>
          <div style={cardHeaderStyle}>
            <div style={cardLabelStyle}>Policy Funds · 2026</div>
            <div style={cardTitleStyle}>정책자금 한눈에 보기</div>
            <div style={cardSubStyle}>소진공·중진공 주요 자금 — 금리 낮은 순으로 비교하세요.</div>
          </div>
          <div style={dividerMain} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", padding: "8px 20px", gap: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em" }}>자금명 / 대상</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em", textAlign: "center" as const }}>금리</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.04em", textAlign: "right" as const }}>한도</div>
          </div>
          <div style={dividerMain} />
          {LEGACY_LOAN_FUNDS.map((fund, index) => (
            <div key={fund.name}>
              {index > 0 && <div style={dividerSub} />}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", padding: "13px 20px", gap: "8px", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 560, color: "var(--text)", letterSpacing: "-0.2px" }}>{fund.name}</span>
                    {fund.tag && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: fund.tag === "청년" ? "rgb(59,92,140)" : fund.tag === "긴급" ? "rgb(182,76,76)" : "rgb(29,53,87)",
                        background: fund.tag === "청년" ? "rgba(59,92,140,0.1)" : fund.tag === "긴급" ? "rgba(182,76,76,0.1)" : "rgba(29,53,87,0.1)",
                        borderRadius: "5px",
                        padding: "1px 5px",
                      }}>
                        {fund.tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "2px" }}>{fund.target}</div>
                </div>
                <div style={{ textAlign: "center" as const, fontSize: "14px", fontWeight: 640, color: "rgb(59,92,140)", letterSpacing: "-0.2px" }}>{fund.rate}</div>
                <div style={{ textAlign: "right" as const, fontSize: "12.5px", color: "rgba(0,0,0,0.55)", letterSpacing: "-0.1px" }}>{fund.limit}</div>
              </div>
            </div>
          ))}
          <div style={dividerMain} />
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)" }}>신청: ols.semas.or.kr (소진공) · 중진공 지역본부 상담</div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(0,0,0,0.3)" }}>2026 총 3.36조원 규모</div>
          </div>
        </div>

        <LegacyChecklistCard
          title="자격 요건 확인"
          subtitle="신청 전 아래 조건을 모두 충족하는지 확인하세요."
          count={eligDone}
          total={LEGACY_ELIGIBILITY_CHECKS.length}
          items={LEGACY_ELIGIBILITY_CHECKS}
          checks={loanChecks}
          setChecks={setLoanChecks}
          cardStyle={cardStyle}
          cardHeaderStyle={cardHeaderStyle}
          cardLabelStyle={cardLabelStyle}
          cardTitleStyle={cardTitleStyle}
          cardSubStyle={cardSubStyle}
          dividerMain={dividerMain}
          dividerSub={dividerSub}
          label="Eligibility Check"
        />

        <LegacyChecklistCard
          title="신청 준비 서류"
          subtitle="서류 누락이 탈락의 두 번째 원인입니다. 미리 준비하세요."
          count={docDone}
          total={LEGACY_DOC_CHECKS.length}
          items={LEGACY_DOC_CHECKS}
          checks={loanChecks}
          setChecks={setLoanChecks}
          cardStyle={cardStyle}
          cardHeaderStyle={cardHeaderStyle}
          cardLabelStyle={cardLabelStyle}
          cardTitleStyle={cardTitleStyle}
          cardSubStyle={cardSubStyle}
          dividerMain={dividerMain}
          dividerSub={dividerSub}
          label="Required Docs"
        />

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={cardLabelStyle}>Approval Strategy</div>
            <div style={cardTitleStyle}>승인률 높이는 전략</div>
            <div style={cardSubStyle}>심사관이 실제로 보는 것들입니다.</div>
          </div>
          <div style={dividerMain} />
          {LEGACY_APPROVAL_TIPS.map((tip, index) => (
            <div key={tip.title}>
              {index > 0 && <div style={dividerSub} />}
              <div style={{ padding: "15px 20px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: 580, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "5px", lineHeight: 1.4 }}>{tip.title}</div>
                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", lineHeight: 1.6 }}>{tip.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={cardLabelStyle}>Preferential Rate</div>
            <div style={cardTitleStyle}>우대금리 받는 방법</div>
            <div style={cardSubStyle}>해당 조건이 있으면 금리를 추가로 낮출 수 있습니다.</div>
          </div>
          <div style={dividerMain} />
          {LEGACY_PREFERENTIAL_RATES.map((item, index) => (
            <div key={item.condition}>
              {index > 0 && <div style={dividerSub} />}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", gap: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px" }}>{item.condition}</div>
                <div style={{ flexShrink: 0, fontSize: "13.5px", fontWeight: 640, color: "rgb(59,92,140)", letterSpacing: "-0.1px" }}>{item.discount}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={cardLabelStyle}>Loan Q&A</div>
            <div style={cardTitleStyle}>대출 질문하기</div>
            <div style={cardSubStyle}>자격 요건, 서류, 금리 등 궁금한 점을 물어보세요.</div>
          </div>
          <div style={dividerMain} />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {savedGuideQaSnapshot && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>최근 질문</div>
                <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.5 }}>{savedGuideQaSnapshot.question}</div>
              </div>
            )}
            <textarea
              value={guideQuestion}
              onChange={(event) => setGuideQuestion(event.target.value)}
              placeholder="예: 창업 6개월째인데 성장기반자금 신청이 가능한가요?"
              style={{ ...styles.textarea, ...styles.aiTextarea, borderRadius: "12px" }}
            />
            <button
              type="button"
              style={{
                alignSelf: "flex-end",
                fontSize: "14px",
                fontWeight: 600,
                color: guideQuestion.trim() ? "white" : "rgba(0,0,0,0.3)",
                background: guideQuestion.trim() ? "rgb(59,92,140)" : "rgba(0,0,0,0.06)",
                border: "none",
                borderRadius: "10px",
                padding: "9px 18px",
                cursor: guideQuestion.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
              onClick={() => handleKnowledgeQuestion("loan")}
              disabled={!guideQuestion.trim() || knowledgeQaStatus === "loading"}
            >
              {knowledgeQaStatus === "loading" ? "답변 중..." : "질문하기"}
            </button>
            {knowledgeQaError && <div style={styles.warningText}>{knowledgeQaError}</div>}
            {(knowledgeQaText || knowledgeQaStatus === "loading") && (
              <div style={{ borderRadius: "14px", background: "rgba(59,92,140,0.04)", border: "0.5px solid rgba(59,92,140,0.15)", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,80,200,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>AI 답변 · 2026 지식베이스 기반</div>
                <div style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                  {knowledgeQaText}
                  {knowledgeQaStatus === "loading" && <span style={{ display: "inline-block", width: "2px", height: "14px", background: "rgba(59,92,140,0.7)", marginLeft: "2px", verticalAlign: "text-bottom" }} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
      <GuideVerificationFooter
        language={language}
        hasMoreReadingPages={false}
        lockedContent={null}
        ready={legacyLoanGate.allDone}
        title={getLegacyLoanReviewTitle(language, legacyLoanGate)}
        label={getLegacyLoanReviewLabel(language, legacyLoanGate, markLoanReviewedLabel)}
        onBack={onBack}
        onConfirm={onConfirm}
      />
    </>
  );
}

type LegacyChecklistItem = {
  id: string;
  label: string;
  detail: string;
};

function LegacyChecklistCard({
  title,
  subtitle,
  count,
  total,
  items,
  checks,
  setChecks,
  cardStyle,
  cardHeaderStyle,
  cardLabelStyle,
  cardTitleStyle,
  cardSubStyle,
  dividerMain,
  dividerSub,
  label,
}: {
  title: string;
  subtitle: string;
  count: number;
  total: number;
  items: LegacyChecklistItem[];
  checks: Record<string, boolean>;
  setChecks: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  cardStyle: CSSProperties;
  cardHeaderStyle: CSSProperties;
  cardLabelStyle: CSSProperties;
  cardTitleStyle: CSSProperties;
  cardSubStyle: CSSProperties;
  dividerMain: CSSProperties;
  dividerSub: CSSProperties;
  label: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={cardLabelStyle}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={cardTitleStyle}>{title}</div>
          <div style={{ fontSize: "13px", fontWeight: 620, color: count === total ? "rgb(29,53,87)" : "rgba(0,0,0,0.35)", transition: "color 0.2s" }}>{count} / {total}</div>
        </div>
        <div style={cardSubStyle}>{subtitle}</div>
      </div>
      <div style={dividerMain} />
      {items.map((item, index) => {
        const done = !!checks[item.id];

        return (
          <div key={item.id}>
            {index > 0 && <div style={dividerSub} />}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 20px",
                cursor: "pointer",
                background: done ? "rgba(29,53,87,0.04)" : "white",
                transition: "background 0.15s",
              }}
              onClick={() => setChecks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
            >
              <div style={{ flexShrink: 0, marginTop: "1px", width: "22px", height: "22px", borderRadius: "7px", border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: done ? "rgb(29,53,87)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14.5px", fontWeight: 500, color: done ? "rgba(0,0,0,0.28)" : "var(--text)", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px", lineHeight: 1.4, transition: "all 0.15s" }}>{item.label}</div>
                {!done && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
