"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  ShieldCheck, CheckCircle2, Building2, ChevronRight, ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { StoreNameInput } from "../shared/StoreNameInput";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러

/**
 * 사업자등록 최종 확인 단계 (biz-registration / 17번).
 *
 * 위치: 소프트오픈(15) → 대출 가이드(16) → **이 단계(17)** → 재무 검토(18) → 그랜드오픈 직전(19)
 *
 * 역할: 이전 단계들에서 이미 결정·완료된 사항을 한눈에 확인 +
 *       아직 안 했을 가능성 높은 "사업용 통장 개설" 만 가이드.
 *
 * 중복 제거 (이전 단계에서 이미 다룬 내용):
 *   ❌ 사업자등록 방법 (홈택스/세무서) — RegistrationSetupStage(10번) 동일
 *   ❌ 업종코드 — RegistrationSetupStage(10번) 동일
 *   ❌ 과세유형 (간이/일반) — RegistrationSetupStage(10번) + TaxGuideStage(11번) `tc-vat-type`
 *   ❌ 세무 처리 방식 (cpaDecision) — TaxGuideStage(11번) Page 3 와 같은 변수
 *
 * 고유 가치 (이 단계에만 있음):
 *   ✅ 상호명 (storeName) 최종 확정
 *   ✅ 사업용 통장 개설 (IBK·카카오뱅크·우리은행 등)
 *   ✅ 이전 결정 요약 (사업자등록 완료 / 과세유형 / 세무사 — read-only)
 */
export function BizRegistrationPanel() {
  const d = useDashboardCtx();
  const {
    language,
    cpaDecision,
    industryCategoryId,
    taxChecks,
    decisions,
    pathStageList,
  } = d;
  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";

  // 이전 결정 요약 (TaxGuideStage / RegistrationSetupStage 결과)
  const taxTypeChecked = !!taxChecks["tc-vat-type"];
  const hometaxChecked = !!taxChecks["tc-hometax"];
  const bizCardChecked = !!taxChecks["tc-bizcard"];
  const bizRegConfirmed = !!decisions["registration-setup"];
  // 2026-07-02: 헤더가 "이전 단계 완료"라고 단정하던 것을 실제 배지 상태와 일치시킴.
  //   미결정 항목이 하나라도 있으면 헤더에서 "먼저 확인" 안내로 전환(모순 제거).
  const priorAllDone = bizRegConfirmed && taxTypeChecked && hometaxChecked && bizCardChecked && !!cpaDecision;

  const stageRef = (stageId: string, titleKo: string, titleEn: string) => {
    const index = pathStageList.findIndex((stage) => stage.stageId === stageId);
    if (index < 0) return ko ? `${titleKo} 단계` : `${titleEn} stage`;
    return ko ? `${index + 1}번 단계 ${titleKo}` : `Stage ${index + 1} ${titleEn}`;
  };
  const registrationStageId = pathStageList.some((stage) => stage.stageId === "registration-setup")
    ? "registration-setup"
    : pathStageList.some((stage) => stage.stageId === "online-registration")
      ? "online-registration"
      : "company-setup";
  const registrationRef = stageRef(registrationStageId, "사업자등록", "Business registration");
  const taxGuideRef = stageRef("tax-guide", "세무 가이드", "Tax Guide");

  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "8px" }}>

      {/* ── KEY ACTION 히어로 카드 ── */}
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px" }}>
            {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>
            {priorAllDone
              ? (ko ? "사업용 통장 개설 + 상호명 최종 확정" : "Open business account + finalize store name")
              : (ko ? "이전 결정 마무리 + 사업용 통장·상호명 확정" : "Finish prior decisions + open account & finalize name")}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {priorAllDone
              ? (ko
                  ? "사업자등록·과세유형·세무 설정이 모두 완료됐습니다. 이 단계는 마지막 두 가지 — 사업용 통장과 상호명 — 만 처리합니다."
                  : "Registration, tax type, and tax setup are all done. Just finalize the bank account and store name.")
              : (ko
                  ? "아래 「사업 초기 세팅 현황」에 미확인 항목이 있습니다. 각 항목은 해당 단계에서 마무리하고, 이 단계에서는 사업용 통장·상호명을 확정하세요."
                  : "Some items below are still pending. Finish them in their stages first, then open the business account and finalize the store name here.")}
          </div>
        </div>
      </div>

      {/* ── 이전 결정 요약 (read-only) ── */}
      <div>
        <div style={sectionLabel}>{ko ? "사업 초기 세팅 현황 (등록·세무·금융)" : "Setup progress (registration · tax · banking)"}</div>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          {([
            {
              label: ko ? "사업자등록·영업신고" : "Business registration",
              status: bizRegConfirmed ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: bizRegConfirmed,
              hint: ko ? `${registrationRef} — 홈택스 또는 세무서` : `${registrationRef} — Hometax or tax office`,
            },
            {
              label: ko ? "과세유형 결정 (간이/일반)" : "Tax type (Simplified/Standard)",
              status: taxTypeChecked ? (ko ? "결정됨" : "Decided") : (ko ? "미결정" : "Pending"),
              done: taxTypeChecked,
              hint: ko ? `${taxGuideRef} — 1억 400만 미만 시 간이` : `${taxGuideRef} — Simplified if <104M KRW`,
            },
            {
              label: ko ? "홈택스 회원가입" : "Hometax registration",
              status: hometaxChecked ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: hometaxChecked,
              hint: ko ? `${taxGuideRef} 체크리스트` : `${taxGuideRef} checklist`,
            },
            {
              label: ko ? "사업용 카드 분리" : "Dedicated business card",
              status: bizCardChecked ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: bizCardChecked,
              hint: ko ? `${taxGuideRef} — 전용 카드 등록 시 비용 자동수집 (개인카드도 증빙 있으면 인정)` : `${taxGuideRef} — register a business card for auto-tracking (personal card still deductible with receipts)`,
            },
            {
              label: ko ? "세무 처리 방식" : "Tax handling method",
              status: cpaDecision === "cpa" ? (ko ? "세무사 선임" : "CPA hired") : cpaDecision === "self" ? (ko ? "직접 신고" : "Self-file") : (ko ? "미결정" : "Pending"),
              done: !!cpaDecision,
              hint: ko ? `${taxGuideRef} Page 4` : `${taxGuideRef} Page 4`,
            },
          ]).map((row, i, arr) => (
            <div key={row.label}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: row.done ? "rgba(29,53,87,0.12)" : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: row.done ? "rgb(29,53,87)" : "rgba(0,0,0,0.35)",
                }}>
                  {row.done
                    ? <CheckCircle2 size={17} strokeWidth={2} />
                    : <span style={{ fontSize: "12px", fontWeight: 800 }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{row.label}</div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>{row.hint}</div>
                </div>
                <span style={{
                  fontSize: "11.5px", fontWeight: 700,
                  padding: "3px 9px", borderRadius: "999px",
                  background: row.done ? "rgba(29,53,87,0.1)" : "rgba(0,0,0,0.05)",
                  color: row.done ? "rgb(29,53,87)" : "rgba(0,0,0,0.5)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap" as const,
                  flexShrink: 0,
                }}>
                  {row.status}
                </span>
              </div>
              {/* dummy for last separator */}
              {i === arr.length - 1 && null}
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. 상호명 (가게 이름) — 최종 확정 ── */}
      {!isStartup && (
        <div>
          <div style={sectionLabel}>{ko ? "상호명 (가게 이름) 최종 확정" : "Finalize store name"}</div>
          <StoreNameInput
            helperText={ko
              ? "사업자등록증·간판·메뉴판·SNS·세금계산서까지 모두 동일한 이름. 등록 후 변경하면 등록증 재발급이 필요하므로 신중히 확정하세요."
              : "Same name across registration, signage, menu, social, and invoices. Changing requires re-issuing the certificate."}
          />
          {/* 상표권 선출원주의 — 상호 확정 시점에 검토. advisory(미드나잇), 수수료는 시점 변동이라 미표기 + 공식 검색 링크 */}
          <a
            href="https://www.kipris.or.kr/khome/main.do"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", gap: "10px", alignItems: "flex-start", textDecoration: "none",
              marginTop: "10px", padding: "12px 14px", borderRadius: "12px",
              background: "rgba(25,25,112,0.05)", border: "1px solid rgba(25,25,112,0.12)", color: "inherit",
            }}
          >
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#191970", background: "rgba(25,25,112,0.10)", padding: "2px 7px", borderRadius: "5px", flexShrink: 0, marginTop: "1px", letterSpacing: "0.04em" }}>
              {ko ? "상표" : "TM"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#191970", marginBottom: "3px", letterSpacing: "-0.01em" }}>
                {ko ? "상호 확정 = 상표권도 함께 확인 (한국은 선출원주의)" : "Finalize name = check trademark too (Korea is first-to-file)"}
              </div>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
                {ko
                  ? "먼저 출원한 사람이 권리를 갖습니다. 내 상호·브랜드를 남이 먼저 등록하면 간판·메뉴판을 못 쓰고 분쟁·배상으로 번질 수 있어요. KIPRIS에서 동일·유사 상표를 검색하고, 핵심 브랜드라면 특허청에 상표 출원으로 선점하세요. ↗ KIPRIS 무료 검색"
                  : "First to file wins. If someone registers your name first, you may lose your signage/menu rights. Search KIPRIS for conflicts; file a trademark to secure your core brand. ↗ Free KIPRIS search"}
              </div>
            </div>
          </a>
        </div>
      )}

      {/* ── 2. 사업용 통장 개설 — 고유 가이드 ── */}
      <div>
        <div style={sectionLabel}>{ko ? "사업용 통장 개설" : "Business bank account"}</div>
        <div style={{
          padding: "12px 14px", marginBottom: "10px",
          borderRadius: "12px",
          background: "rgba(25,25,112,0.04)",
          border: "1px solid rgba(25,25,112,0.14)",
          display: "flex", gap: "10px", alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} strokeWidth={2} style={{ color: "#191970", flexShrink: 0, marginTop: "1px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#191970", marginBottom: "3px", letterSpacing: "-0.01em" }}>
              {ko ? "개인 통장과 사업 통장은 분리 권장" : "Separate personal and business accounts (recommended)"}
            </div>
            <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
              {ko
                ? "혼용해도 적격증빙(세금계산서·카드·현금영수증)이 있으면 사업 비용은 인정됩니다. 다만 지출 매칭이 복잡해지고, 복식부기의무자는 사업용계좌 미신고·미사용 시 가산세(거래금액의 0.2%). 등록 직후 분리 개설을 권장합니다."
                : "Mixing still allows expense recognition with proper receipts (tax invoices, cards, cash receipts). But it complicates matching, and double-entry filers face a 0.2% penalty for not registering/using a business account. Separating early is recommended."}
            </div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          {(ko ? [
            { bank: "기업은행 IBK", desc: "소상공인 특화 상품 多 · 정책자금 연계 유리 · 전국 지점", badge: "정책자금 연계", href: "https://www.ibk.co.kr" },
            { bank: "카카오뱅크 사업자", desc: "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", badge: "비대면", href: "https://www.kakaobank.com" },
            { bank: "우리은행 위비기업", desc: "지역 네트워크 강점 · 세무사·노무사 무료 상담 포함", badge: "상담 포함", href: "https://spot.wooribank.com" },
            { bank: "신한은행 SOL Biz", desc: "여러 은행·카드사 계좌·매입매출 통합관리 · 세무·쇼핑몰 제휴(SOHO)", badge: "통합관리", href: "https://www.shinhan.com" },
          ] : [
            { bank: "IBK Industrial Bank", desc: "Best for policy fund connections · many SME products", badge: "Policy", href: "https://www.ibk.co.kr" },
            { bank: "KakaoBank Business", desc: "Instant non-face-to-face opening · zero fees", badge: "Digital", href: "https://www.kakaobank.com" },
            { bank: "Woori Bank", desc: "Free tax/labor consultation · regional network", badge: "Consulting", href: "https://spot.wooribank.com" },
            { bank: "Shinhan SOL Biz", desc: "Unified multi-bank/card & sales management · tax/shop partners (SOHO)", badge: "Unified", href: "https://www.shinhan.com" },
          ]).map((b, i) => (
            <a key={b.bank} href={b.href} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "13px 16px",
              borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
              textDecoration: "none", color: "inherit",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(25,25,112,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                color: MIDNIGHT,
              }}>
                <Building2 size={17} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "2px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{b.bank}</span>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: "999px", letterSpacing: "-0.01em" }}>
                    {b.badge}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>{b.desc}</div>
              </div>
              <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0 }} />
              <ExternalLink size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
            </a>
          ))}
        </div>
        <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.4)", marginTop: "8px", padding: "0 4px" }}>
          {ko ? "준비물: 사업자등록증 원본 · 대표자 신분증 · 임대차계약서 원본(사업장 실재성 증빙 — 대포통장 방지로 사실상 필수) · 도장(선택). 목적 증빙 미비 시 한도제한계좌로만 발급될 수 있음" : "Bring: business registration cert, ID, lease contract original (proof of real business — effectively required to avoid a limited-transaction account), seal (optional)"}
        </div>
      </div>

    </div>
  );
}
