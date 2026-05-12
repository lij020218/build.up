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
  } = d;
  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";

  // 이전 결정 요약 (TaxGuideStage / RegistrationSetupStage 결과)
  const taxTypeChecked = !!taxChecks["tc-vat-type"];
  const hometaxChecked = !!taxChecks["tc-hometax"];
  const bizCardChecked = !!taxChecks["tc-bizcard"];
  const bizRegConfirmed = !!decisions["registration-setup"];

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
            {ko ? "사업용 통장 개설 + 상호명 최종 확정" : "Open business account + finalize store name"}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {ko
              ? "사업자등록·과세유형·세무사 결정은 이전 단계에서 완료. 이 단계는 마지막 두 가지 — 사업용 통장과 상호명 — 만 처리합니다."
              : "Registration, tax type, and CPA decision are done. Just finalize the bank account and store name."}
          </div>
        </div>
      </div>

      {/* ── 이전 결정 요약 (read-only) ── */}
      <div>
        <div style={sectionLabel}>{ko ? "이전 단계에서 결정된 사항" : "Decisions from prior stages"}</div>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          {([
            {
              label: ko ? "사업자등록·영업신고" : "Business registration",
              status: bizRegConfirmed ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: bizRegConfirmed,
              hint: ko ? "10번 단계 — 홈택스 또는 세무서" : "Stage 10 — Hometax or tax office",
            },
            {
              label: ko ? "과세유형 결정 (간이/일반)" : "Tax type (Simplified/Standard)",
              status: taxTypeChecked ? (ko ? "결정됨" : "Decided") : (ko ? "미결정" : "Pending"),
              done: taxTypeChecked,
              hint: ko ? "11번 단계 세무 가이드 — 1억 400만 미만 시 간이" : "Stage 11 Tax Guide — Simplified if <104M KRW",
            },
            {
              label: ko ? "홈택스 회원가입" : "Hometax registration",
              status: hometaxChecked ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: hometaxChecked,
              hint: ko ? "11번 단계 세무 가이드 체크리스트" : "Stage 11 Tax Guide checklist",
            },
            {
              label: ko ? "사업용 카드 분리" : "Dedicated business card",
              status: bizCardChecked ? (ko ? "완료" : "Done") : (ko ? "미확인" : "Pending"),
              done: bizCardChecked,
              hint: ko ? "11번 단계 세무 가이드 — 개인카드 혼용 = 비용 불인정" : "Stage 11 — mixed personal = rejected expenses",
            },
            {
              label: ko ? "세무 처리 방식" : "Tax handling method",
              status: cpaDecision === "cpa" ? (ko ? "세무사 선임" : "CPA hired") : cpaDecision === "self" ? (ko ? "직접 신고" : "Self-file") : (ko ? "미결정" : "Pending"),
              done: !!cpaDecision,
              hint: ko ? "11번 단계 세무 가이드 Page 4" : "Stage 11 Tax Guide Page 4",
            },
          ]).map((row, i, arr) => (
            <div key={row.label}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: row.done ? "rgba(34,167,73,0.12)" : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: row.done ? "rgb(34,167,73)" : "rgba(0,0,0,0.35)",
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
                  background: row.done ? "rgba(34,167,73,0.1)" : "rgba(0,0,0,0.05)",
                  color: row.done ? "rgb(34,167,73)" : "rgba(0,0,0,0.5)",
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
        </div>
      )}

      {/* ── 2. 사업용 통장 개설 — 고유 가이드 ── */}
      <div>
        <div style={sectionLabel}>{ko ? "사업용 통장 개설" : "Business bank account"}</div>
        <div style={{
          padding: "12px 14px", marginBottom: "10px",
          borderRadius: "12px",
          background: "rgba(220,60,30,0.06)",
          border: "1px solid rgba(200,60,30,0.16)",
          display: "flex", gap: "10px", alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} strokeWidth={2} style={{ color: "#b83020", flexShrink: 0, marginTop: "1px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#b83020", marginBottom: "3px", letterSpacing: "-0.01em" }}>
              {ko ? "개인 통장과 사업 통장은 반드시 분리" : "Personal and business accounts MUST be separated"}
            </div>
            <div style={{ fontSize: "12.5px", color: "rgba(184,48,32,0.85)", lineHeight: 1.55 }}>
              {ko
                ? "혼용 시 세무조사에서 사업 비용 입증 불가 → 전부 과세 대상. 사업자등록증 발급 직후 즉시 개설하세요."
                : "Mixed accounts can't prove business expenses during audit — all gets taxed. Open right after receiving registration cert."}
            </div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          {(ko ? [
            { bank: "기업은행 IBK", desc: "소상공인 특화 상품 多 · 정책자금 연계 유리 · 전국 지점", badge: "정책자금 연계", href: "https://www.ibk.co.kr" },
            { bank: "카카오뱅크 사업자", desc: "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", badge: "비대면", href: "https://www.kakaobank.com" },
            { bank: "우리은행 위비기업", desc: "지역 네트워크 강점 · 세무사·노무사 무료 상담 포함", badge: "상담 포함", href: "https://spot.wooribank.com" },
            { bank: "신한은행 SOL Biz", desc: "디지털 전환 강점 · 신한카드 결제 단말 연계", badge: "디지털", href: "https://www.shinhan.com" },
          ] : [
            { bank: "IBK Industrial Bank", desc: "Best for policy fund connections · many SME products", badge: "Policy", href: "https://www.ibk.co.kr" },
            { bank: "KakaoBank Business", desc: "Instant non-face-to-face opening · zero fees", badge: "Digital", href: "https://www.kakaobank.com" },
            { bank: "Woori Bank", desc: "Free tax/labor consultation · regional network", badge: "Consulting", href: "https://spot.wooribank.com" },
            { bank: "Shinhan SOL Biz", desc: "Strong digital · Shinhan card terminal integration", badge: "Digital", href: "https://www.shinhan.com" },
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
          {ko ? "준비물: 사업자등록증 원본 · 대표자 신분증 · 도장(선택)" : "Bring: business registration cert, ID, seal (optional)"}
        </div>
      </div>

    </div>
  );
}
