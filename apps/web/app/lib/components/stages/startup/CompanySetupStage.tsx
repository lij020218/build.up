"use client";

import { Lightbulb, FileText, Shield, Calculator } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { ModePathCard } from "./ModePathCard";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "./StartupStageShell";
import { StoreNameInput } from "../shared/StoreNameInput";
import { StageWrapup } from "../shared/StageWrapup";

export function CompanySetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const { guideSelections, setGuideSelections } = d;
  const bizType = (guideSelections["biz-structure"] as "sole" | "corp" | undefined) ?? null;

  const totalPg = 4;
  const pgLabels = ko
    ? ["사업자등록", "특허·상표 출원", "과세 유형·세무", "보안·약관"]
    : ["Registration", "IP Filing", "Tax Setup", "Privacy & Terms"];

  const linkStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "4px",
    fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none",
    padding: "5px 12px", borderRadius: "8px", background: "rgba(25,25,112,0.04)",
    border: "1px solid rgba(25,25,112,0.08)", marginTop: "4px",
  };

  const selectBizType = (type: "sole" | "corp") => {
    setGuideSelections((prev: Record<string, string>) => ({ ...prev, "biz-structure": type }));
  };

  return (
    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* KEY ACTION 미드나이트 hero (최상단) */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "사업자등록 → IP 보호 → 세무 셋업" : "Register → Protect IP → Set up taxes"}
        subtitle={
          ko
            ? "MVP 검증 후 본격 운영 단계입니다. 개인/법인 결정 → 상표·특허 출원 → 과세 유형 → 약관·개인정보 처리방침까지 4가지를 순서대로 처리하세요."
            : "After MVP validation, set up properly: business structure → IP filing → tax type → privacy & terms — in order."
        }
        miniCards={[
          { icon: FileText, label: ko ? "사업자등록" : "Register", detail: ko ? "홈택스 즉시" : "HomeTax instant" },
          { icon: Shield, label: ko ? "특허·상표" : "IP", detail: ko ? "출원 우선권" : "Filing priority" },
          { icon: Calculator, label: ko ? "과세 유형" : "Tax", detail: ko ? "간이/일반/법인" : "Pick one" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — 사업자등록·법인·IP 보호 표준 절차" : "↓ Reference — standard procedures for incorporation and IP"}
      </StartupReferenceLabel>

      {/* 페이지 네비 */}
      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ── Page 0: ModePathCard 보충 + 사업자등록 ── */}
      {pg === 0 && (
      <ModePathCard stageId="company-setup" />
      )}

      {/* 상호/법인명 입력 — 사업자등록 직전, 모든 출처(법인등기·통장·도메인)에 일관 사용 */}
      {pg === 0 && (
      <StoreNameInput
        label={ko ? "상호명 / 법인명" : "Company / Brand name"}
        placeholder={ko ? "예: 파운드원, Acme Inc." : "e.g. Found.One, Acme Inc."}
        helperText={ko
          ? "사업자등록·법인등기·도메인·상표 출원·통장 모두 동일하게 사용됩니다. KIPRIS·USPTO에서 동일 상표 등록 여부를 먼저 확인하세요. 입력하면 자동 저장됩니다."
          : "Used identically across registration, incorporation, domain, trademark, and bank account. Search KIPRIS/USPTO first. Auto-saves as you type."}
      />
      )}
      {pg === 0 && (
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "사업자등록 — 사업 형태 선택" : "Business Registration — Choose Your Structure"}</span>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "먼저 사업 형태를 선택하세요. 선택에 따라 절차가 달라집니다." : "Choose your business structure first. The process differs based on your choice."}
          </div>
        </div>

        {/* ── 개인/법인 선택 카드 (클릭 가능) ── */}
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
            {/* 개인사업자 */}
            <button type="button" onClick={() => selectBizType("sole")} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: bizType === "sole" ? "rgba(25,25,112,0.06)" : "rgba(0,0,0,0.01)",
              border: bizType === "sole" ? "2px solid #191970" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: bizType === "sole" ? "6px solid #191970" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: bizType === "sole" ? MIDNIGHT : "#0f172a" }}>{ko ? "개인사업자" : "Sole Proprietor"}</div>
                {bizType !== "corp" && <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: "rgba(25,25,112,0.08)", color: MIDNIGHT }}>{ko ? "추천" : "Recommended"}</span>}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {ko ? "• 등록비 0원 · 홈택스에서 즉시 신청\n• 간이과세 가능 (매출 1억 400만원 미만)\n• 회계 간편 · 간편장부 인정\n• 법인 전환은 투자 유치 시 해도 충분" : "• Free registration via HomeTax\n• Simplified tax available\n• Simple bookkeeping OK\n• Convert to corp when raising investment"}
              </div>
            </button>

            {/* 법인 */}
            <button type="button" onClick={() => selectBizType("corp")} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: bizType === "corp" ? "rgba(25,25,112,0.06)" : "rgba(0,0,0,0.01)",
              border: bizType === "corp" ? "2px solid #191970" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: bizType === "corp" ? "6px solid #191970" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: bizType === "corp" ? MIDNIGHT : "#0f172a" }}>{ko ? "법인 (주식회사)" : "Corporation"}</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {ko ? "• 설립비 30~65만원 · 등기소 등록 필요\n• 복식부기 의무\n• 투자 유치 · 지분 구조 설계에 유리\n• 매출 2억 초과 시 세율 유리" : "• ₩300-650K setup, registry required\n• Double-entry bookkeeping required\n• Better for raising VC / equity splits\n• Tax-efficient above ₩200M revenue"}
              </div>
            </button>
          </div>

          {bizType && (
            <div style={{ padding: "8px 12px", borderRadius: "10px", background: bizType === "sole" ? "rgba(25,25,112,0.04)" : "rgba(25,25,112,0.04)", border: `1px solid ${bizType === "sole" ? "rgba(25,25,112,0.1)" : "rgba(25,25,112,0.1)"}`, marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 640, color: bizType === "sole" ? MIDNIGHT : MIDNIGHT }}>
                ✓ {bizType === "sole"
                  ? (ko ? "개인사업자 선택됨 — 아래 절차를 따르세요" : "Sole proprietor selected — follow the steps below")
                  : (ko ? "법인 선택됨 — 아래 법인 설립 절차를 따르세요" : "Corporation selected — follow incorporation steps below")}
              </div>
            </div>
          )}
        </div>

        {/* ── 개인사업자 절차 ── */}
        {(bizType === "sole" || bizType === null) && (
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 650, color: MIDNIGHT, marginBottom: "10px" }}>{ko ? "홈택스 사업자등록 절차" : "HomeTax Registration Steps"}</div>
          {(ko ? [
            { step: "1", title: "홈택스 접속 · 공동인증서 로그인", detail: "hometax.go.kr → 신청/제출 → 사업자등록 신청 (평일 09:00~18:00)" },
            { step: "2", title: "인적 사항 · 사업장 입력", detail: "자택 주소로 등록 가능 (SW 개발, 컨설팅 등 사무직 업종). 임차 시 계약서 첨부" },
            { step: "3", title: "업종 선택", detail: "정보통신업(J), 전문과학기술(M) 등 선택. 복수 업종 등록 가능" },
            { step: "4", title: "서류 제출 · 대기", detail: "제출 완료 후 3영업일 이내 발급. 문자로 완료 통보" },
          ] : [
            { step: "1", title: "Log in to HomeTax", detail: "hometax.go.kr → Apply → Business Registration (weekdays 9-18)" },
            { step: "2", title: "Enter personal & office info", detail: "Home address OK for SW/consulting. Attach lease if renting" },
            { step: "3", title: "Select business category", detail: "IT (J), Professional/Scientific (M), etc. Multiple categories OK" },
            { step: "4", title: "Submit & wait", detail: "Issued within 3 business days. SMS notification" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "4" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "12px", marginBottom: "10px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
              <div style={{ fontSize: "16px", fontWeight: 740, color: MIDNIGHT }}>{ko ? "무료" : "Free"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
              <div style={{ fontSize: "16px", fontWeight: 740, color: MIDNIGHT }}>1~3{ko ? "일" : "d"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 바로가기 ↗</a>
            <a href="https://www.gov.kr/portal/service/serviceInfo/PTR000050466" target="_blank" rel="noopener noreferrer" style={linkStyle}>정부24 사업자등록 ↗</a>
          </div>
        </div>
        )}

        {/* ── 법인 설립 절차 ── */}
        {bizType === "corp" && (
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 650, color: MIDNIGHT, marginBottom: "10px" }}>{ko ? "법인(주식회사) 설립 절차" : "Corporation Incorporation Steps"}</div>
          {(ko ? [
            { step: "1", title: "정관 작성", detail: "사업 목적, 발행 주식 수, 자본금 결정. AI로 초안 작성 가능. 공증 불요 (발기설립)" },
            { step: "2", title: "발기인 총회 의사록 작성", detail: "공동 창업자 지분율, 대표이사 선임, 본점 소재지 결정" },
            { step: "3", title: "자본금 납입", detail: "은행에 자본금 입금 → 잔액증명서 발급. 자본금 100원부터 가능 (벤처인증은 100만원+ 권장)" },
            { step: "4", title: "법인 등기 신청", detail: "등기소 방문 또는 온라인 대행 (헬프미·ZUZU 등 30~50만원). 등록면허세 ~13만원 + 교육세 ~2.6만원" },
            { step: "5", title: "사업자등록 (법인)", detail: "법인등기부등본 발급 후, 홈택스에서 법인 사업자등록. 등기 완료 후 20일 이내" },
            { step: "6", title: "법인 통장 개설", detail: "사업자등록증 + 법인 인감증명서 지참. 토스 비즈니스, 카카오뱅크 법인 추천" },
          ] : [
            { step: "1", title: "Draft Articles of Incorporation", detail: "Business purpose, shares, capital. AI can draft. No notarization needed" },
            { step: "2", title: "Founders Meeting Minutes", detail: "Equity split, CEO appointment, HQ address" },
            { step: "3", title: "Capital Deposit", detail: "Deposit to bank → get balance certificate. Min ₩100 (₩1M+ for venture cert)" },
            { step: "4", title: "Corporate Registration", detail: "Registry office or online service (HelpMe/ZUZU ₩300-500K). Tax ~₩156K" },
            { step: "5", title: "Business Registration (Corp)", detail: "After registration certificate, file at HomeTax within 20 days" },
            { step: "6", title: "Corporate Bank Account", detail: "Bring registration + corporate seal. Toss Business, KakaoBank Corp" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "6" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "12px", marginBottom: "10px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "등록면허세" : "License Tax"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: MIDNIGHT }}>~13{ko ? "만원" : "0K"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "대행비 (선택)" : "Agency"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: MIDNIGHT }}>30~50{ko ? "만원" : "0K"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: MIDNIGHT }}>1~2{ko ? "주" : "wk"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://www.help-me.kr" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: MIDNIGHT, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)" }}>헬프미 법인설립 ↗</a>
            <a href="https://zuzu.network" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: MIDNIGHT, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)" }}>ZUZU 법인설립 ↗</a>
            <a href="https://www.startbiz.go.kr" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: MIDNIGHT, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)" }}>온라인법인설립 ↗</a>
            <a href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: MIDNIGHT, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)" }}>홈택스 ↗</a>
          </div>

          {/* 스톡옵션 팁 */}
          <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.08)" }}>
            <div style={{ fontSize: "12px", fontWeight: 640, color: MIDNIGHT, marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Lightbulb size={12} strokeWidth={1.5} color={MIDNIGHT} />
              {ko ? "스톡옵션 · 캡테이블" : "Stock Options & Cap Table"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
              {ko
                ? "벤처기업 인증 후 스톡옵션 부여 시 직원 1인당 연 5,000만원까지 비과세. 4년 베스팅/1년 클리프가 업계 표준. ZUZU로 캡테이블 관리 권장."
                : "After venture cert, stock options tax-free up to ₩50M/yr per employee. 4-year vesting / 1-year cliff is industry standard. Use ZUZU for cap table."}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* ── Page 1: 특허·상표 출원 — 풍부한 가이드 (2026 검증 데이터) ── */}
      {pg === 1 && (
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
        {/* 헤더 + 핵심 경고 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>{ko ? "특허·상표 출원 — 공개 전 필수" : "Patent & Trademark Filing — Before Public Disclosure"}</span>
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(182,76,76,0.05)", border: "1px solid rgba(182,76,76,0.18)", marginTop: "10px" }}>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b64c4c", lineHeight: 1.6 }}>
              {ko ? "⚠️ 데모·베타·보도자료·SNS 공개 후에는 특허권을 영구히 잃을 수 있습니다 (신규성 상실). 반드시 공개 전에 출원하세요." : "⚠️ Public disclosure permanently forfeits patent rights (novelty lost). File BEFORE any disclosure."}
            </div>
          </div>
        </div>

        {/* ⏱️ 시간 충격 카드 — 사용자 핵심 인사이트 */}
        <div style={{ borderRadius: "16px", padding: "18px 20px", background: "linear-gradient(135deg, rgba(25,25,112,0.08) 0%, rgba(25,25,112,0.02) 100%)", border: `1px solid ${MIDNIGHT}30` }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            {ko ? "⏱ 먼저 알아야 할 것 — 상표는 거의 1년 걸립니다" : "⏱ Reality check — Trademark takes nearly a year"}
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", lineHeight: 1.5 }}>
            {ko ? "한국 상표 일반 심사 기간 = 평균 15개월. 특허도 일반 12~18개월." : "KR trademark normal exam = avg 15 months. Patent = 12-18 months."}
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "10px" }}>
            {ko
              ? "출원 즉시 \"등록\"되는 게 아닙니다. 출원일로부터 심사관이 검토할 때까지 대기열만 ~13개월. 빠르게 보호하려면 우선심사를 신청해야 합니다 (별도 비용)."
              : "Filing ≠ registration. Queue alone is ~13 months. Use priority examination for faster grant (additional fee)."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.45)", marginBottom: "2px" }}>{ko ? "일반 심사" : "Normal exam"}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{ko ? "약 15개월" : "~15 months"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: `${MIDNIGHT}10`, border: `1px solid ${MIDNIGHT}25` }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "2px" }}>{ko ? "우선심사 적용" : "Priority exam"}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: MIDNIGHT }}>{ko ? "약 5개월" : "~5 months"}</div>
            </div>
          </div>
        </div>

        {/* 상표 vs 특허 차이 */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: MIDNIGHT, marginBottom: "12px" }}>{ko ? "상표 vs 특허 — 무엇을 보호?" : "Trademark vs Patent — what to protect?"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ padding: "14px", borderRadius: "12px", background: `${MIDNIGHT}06`, border: `1px solid ${MIDNIGHT}20` }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px" }}>{ko ? "🔤 상표 (Trademark)" : "🔤 Trademark"}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                {ko
                  ? <>브랜드명·로고·슬로건 보호. 10년 갱신.<br /><strong style={{ color: MIDNIGHT }}>모든 사업체</strong> 출원 권장.<br />심사: 일반 15개월 / 우선 5개월</>
                  : <>Brand/logo/slogan. 10-yr renewal.<br /><strong>All businesses</strong> recommended.<br />Exam: 15mo / priority 5mo</>}
              </div>
            </div>
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{ko ? "⚙️ 특허 (Patent)" : "⚙️ Patent"}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                {ko
                  ? <>발명·기술·알고리즘 보호. 20년.<br /><strong>딥테크·하드웨어·핵심기술</strong>만.<br />심사: 일반 12~18개월 / 우선 3~6개월</>
                  : <>Invention/tech/algo. 20 years.<br /><strong>Deep tech only</strong>.<br />Exam: 12-18mo / priority 3-6mo</>}
              </div>
            </div>
          </div>
        </div>

        {/* 🔤 상표 출원 — 풍부한 가이드 */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: MIDNIGHT, marginBottom: "12px" }}>
            {ko ? "🔤 상표 출원 — 단계별 가이드" : "🔤 Trademark — step by step"}
          </div>

          {/* 절차 5단계 */}
          {(ko ? [
            { step: "1", title: "KIPRIS 선행 상표 검색 (무료, 1-2시간)", detail: "kipris.or.kr → 동일·유사 상표 사전 확인. 같은 상품류에 같거나 유사한 상표 있으면 거절. 셀프 출원의 70% 거절은 이 단계 미흡 때문." },
            { step: "2", title: "상품류 선택 (NICE 분류 1-45류)", detail: "1류당 출원료 별도. 음식점=43류 / 의류=25류 / SaaS·소프트웨어=9류+42류 / 화장품=3류. 잘못 선택 시 보호 범위 무효." },
            { step: "3", title: "특허로 온라인 출원 (출원료 1류당 56,000~62,000원)", detail: "patent.go.kr → 통합서식작성기 다운로드 → 출원서 + 상표 견본 파일 제출. 전자출원 + 고시 상품명 사용 시 56,000원, 일반 명칭 62,000원." },
            { step: "4", title: "심사관 검토 → 출원공고 (15개월 대기 ⏳)", detail: "거절 통지 시 의견서 제출 (변리사 대응 20-30만). 출원공고 후 2개월 이의신청 기간." },
            { step: "5", title: "등록료 납부 (210,120원/10년)", detail: "이의 없으면 등록 결정. 1회 납부로 10년간 보호. 갱신 시 재납부." },
          ] : [
            { step: "1", title: "KIPRIS prior search (free, 1-2hr)", detail: "Check same/similar marks. 70% of DIY rejections come from skipping this." },
            { step: "2", title: "Pick NICE class (1-45)", detail: "Restaurant=43 / Apparel=25 / SaaS=9+42 / Cosmetics=3. Wrong class = no protection." },
            { step: "3", title: "File on patent.go.kr (₩56-62K per class)", detail: "Electronic filing with standard goods name = ₩56K, custom = ₩62K." },
            { step: "4", title: "Examiner review → publication (15mo wait ⏳)", detail: "If rejected, file response (₩200-300K via attorney). 2-month opposition window." },
            { step: "5", title: "Registration fee (₩210K/10yr)", detail: "One-time payment for 10-year protection. Renewable." },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "5" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.55, marginTop: "2px" }}>{s.detail}</div>
              </div>
            </div>
          ))}

          {/* 상표 우선심사 */}
          <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: `${MIDNIGHT}06`, border: `1px solid ${MIDNIGHT}25` }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "6px" }}>
              {ko ? "⚡ 우선심사로 5개월 단축 — 추가 16만원" : "⚡ Priority exam: 5mo (extra ₩160K)"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "8px" }}>
              {ko
                ? "상품류당 16만원 추가. 다음 사유 중 하나면 신청 가능:"
                : "₩160K per class. Eligible if any apply:"}
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.7 }}>
              {(ko ? [
                "출원인이 이미 사용 중 또는 사용 준비 중 (가장 흔한 사유)",
                "타인이 무단 사용 중 (침해 발견 시)",
                "외국 출원 진행 중 또는 예정",
                "전자상거래 플랫폼 등 입점 요건",
              ] : [
                "Already in use or preparing to use (most common)",
                "Third-party infringing",
                "Foreign filing in progress",
                "E-commerce platform requirement",
              ]).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          {/* 비용 요약 */}
          <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.025)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
              {ko ? "총 비용 (1상품류 기준)" : "Total cost (1 class)"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{ko ? "직접 출원 (셀프)" : "DIY"}</div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.7 }}>
                  <li>{ko ? "출원료 56,000~62,000원" : "Filing ₩56-62K"}</li>
                  <li>{ko ? "등록료 210,120원" : "Registration ₩210K"}</li>
                  <li>{ko ? "총: 약 27만원" : "Total: ~₩270K"}</li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{ko ? "변리사 위임" : "Attorney"}</div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.7 }}>
                  <li>{ko ? "관납료 동일" : "Same gov fees"}</li>
                  <li>{ko ? "변리사 대리비 10~30만원" : "Attorney ₩100-300K"}</li>
                  <li>{ko ? "총: 약 37~57만원" : "Total: ~₩370-570K"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ⚙️ 특허 출원 */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: MIDNIGHT, marginBottom: "12px" }}>
            {ko ? "⚙️ 특허 출원 — 딥테크·핵심 기술만" : "⚙️ Patent — deep tech only"}
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.65, marginBottom: "12px" }}>
            {ko
              ? "일반 SaaS·앱은 보통 특허 출원하지 않습니다 (시간·비용 ROI 안 맞음). 핵심 알고리즘·하드웨어·바이오 등 딥테크만 권장."
              : "Most SaaS/apps skip patents (bad ROI). Deep tech only — core algos, hardware, biotech."}
          </div>

          {(ko ? [
            { step: "1", title: "선행 기술 조사 (KIPRIS·Google Patents 무료)", detail: "유사 발명 검색. 진보성·신규성 사전 확인. 특허 80% 거절은 이 단계 부실에서 발생." },
            { step: "2", title: "특허고객번호 발급 (특허로, 무료)", detail: "patent.go.kr → 공동인증서 등록" },
            { step: "3", title: "명세서 작성 + 청구항 (변리사 권장 100~250만원)", detail: "청구항 작성이 핵심 — 셀프 작성 시 거절·축소 위험. 변리사 위임이 ROI 높음." },
            { step: "4", title: "심사 청구 + 대기 (12~18개월) ⏳", detail: "스타트업 (사업자 3년 이내) 등록료 70% 감면 (~2026.2.28). 우선심사 신청 시 3~6개월." },
            { step: "5", title: "등록 결정 + 등록료 납부", detail: "1~3년차 등록료 일시 납부. 4년차부터 매년 갱신료 납부 (총 20년)." },
          ] : [
            { step: "1", title: "Prior art search (KIPRIS / Google Patents)", detail: "Check novelty + inventiveness." },
            { step: "2", title: "Get patent customer number (free)", detail: "patent.go.kr with digital cert." },
            { step: "3", title: "Spec + claims (₩1-2.5M via attorney)", detail: "Claims drafting is critical — DIY = high rejection risk." },
            { step: "4", title: "Request exam + wait (12-18mo) ⏳", detail: "Startups (≤3yr) get 70% fee reduction. Priority exam 3-6mo." },
            { step: "5", title: "Grant + pay registration", detail: "Years 1-3 lump. Annual renewals from year 4." },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "5" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.55, marginTop: "2px" }}>{s.detail}</div>
              </div>
            </div>
          ))}

          {/* 특허 우선심사 + 스타트업 감면 */}
          <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: "rgba(25,25,112,0.05)", border: "1px solid rgba(25,25,112,0.2)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1d3557", marginBottom: "6px" }}>
              {ko ? "💰 스타트업 특혜 — 등록료 70% 감면 (~2026.2.28)" : "💰 Startup perk — 70% fee reduction"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
              {ko
                ? "사업자등록 3년 이내 중소기업 → 4~9년차 등록료 70% 감면. 우선심사료도 일부 감면 가능. 신청 기한 2026년 2월 28일."
                : "SMEs ≤3yr get 70% off years 4-9 reg fees. Some priority exam discounts. Deadline Feb 28, 2026."}
            </div>
          </div>

          {/* PCT 해외 출원 */}
          <div style={{ marginTop: "10px", padding: "14px 16px", borderRadius: "12px", background: `${MIDNIGHT}06`, border: `1px solid ${MIDNIGHT}20` }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "6px" }}>
              {ko ? "🌐 해외 출원 (PCT) — 한국 출원 후 12개월 우선권" : "🌐 International (PCT) — 12-month priority window"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
              {ko
                ? "한국 출원일로부터 12개월 안에 PCT 국제출원 → 30개월 안에 각국 진입. 국제출원료 약 200만원 (2024 기준 1,300-1,500 CHF). 우선일~등록 약 3년."
                : "12mo from KR filing → PCT international (~₩2M, 1,300-1,500 CHF). 30mo to enter national phase. Total ~3 years."}
            </div>
          </div>
        </div>

        {/* 🤔 변리사 vs 직접 출원 결정 가이드 */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: MIDNIGHT, marginBottom: "10px" }}>
            {ko ? "🤔 변리사 위임 vs 직접 출원 — 어느 쪽?" : "🤔 Attorney vs DIY?"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>{ko ? "직접 출원 추천" : "Try DIY if"}</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                {(ko ? [
                  "1인 인디 / 소규모 부트스트랩",
                  "단순 워드 마크 (텍스트만, 로고 X)",
                  "선행 검색에서 충돌 없음 확인",
                  "1상품류만 출원",
                ] : [
                  "Solo indie / small bootstrap",
                  "Simple word mark only",
                  "Clean prior search",
                  "Single class only",
                ]).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div style={{ padding: "14px", borderRadius: "12px", background: `${MIDNIGHT}08`, border: `1px solid ${MIDNIGHT}25` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "6px" }}>{ko ? "변리사 위임 권장" : "Attorney recommended"}</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                {(ko ? [
                  "투자 받았거나 받을 예정 (due diligence)",
                  "로고·도형·복합 상표",
                  "선행 검색에 유사 상표 발견",
                  "다수 상품류 (3개 이상)",
                  "특허 출원 (청구항 작성 필수)",
                  "해외 출원 계획 (PCT·USPTO)",
                ] : [
                  "Funded or fundraising (DD)",
                  "Logo/figure/composite",
                  "Similar marks found",
                  "3+ classes",
                  "Patents (claims drafting)",
                  "Going abroad (PCT/USPTO)",
                ]).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* 외부 링크 */}
        <div style={{ borderRadius: "16px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            {ko ? "추천 사이트·도구" : "Recommended"}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            <a href="https://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>KIPRIS 선행 검색 ↗</a>
            <a href="https://www.patent.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>특허로 온라인 출원 ↗</a>
            <a href="https://www.kipo.go.kr/ko/kpoContentView.do?menuCd=SCD0200243" target="_blank" rel="noopener noreferrer" style={linkStyle}>상표 우선심사 안내 ↗</a>
            <a href="https://www.kipo.go.kr/ko/kpoContentView.do?menuCd=SCD0200226" target="_blank" rel="noopener noreferrer" style={linkStyle}>특허 우선심사 FAQ ↗</a>
            <a href="https://www.kipo.go.kr/ko/kpoContentView.do?menuCd=SCD0200378" target="_blank" rel="noopener noreferrer" style={linkStyle}>스타트업 70% 감면 ↗</a>
            <a href="https://www.kipo.go.kr/ko/kpoContentView.do?menuCd=SCD0200128" target="_blank" rel="noopener noreferrer" style={linkStyle}>PCT 국제출원 ↗</a>
            <a href="https://www.help-me.kr/blog/article/trademark-priority-examination/" target="_blank" rel="noopener noreferrer" style={linkStyle}>{ko ? "헬프미 우선심사 가이드 ↗" : "Help-me priority guide ↗"}</a>
            <a href="https://patents.google.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Google Patents ↗</a>
          </div>
        </div>
      </div>
      )}

      {/* ── Page 2: 과세 유형 · 세무 기초 ── */}
      {pg === 2 && (() => {
        const taxType = (guideSelections["tax-type"] as "simplified" | "general" | undefined) ?? null;
        const selectTaxType = (type: "simplified" | "general") => {
          setGuideSelections((prev: Record<string, string>) => ({ ...prev, "tax-type": type }));
        };
        const isCorp = bizType === "corp";
        return (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "과세 유형 결정 · 세무 기초" : "Tax Type & Basics"}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "14px" }}>
          {isCorp
            ? (ko ? "법인은 일반과세자로 자동 등록됩니다. 복식부기 의무입니다." : "Corporations are automatically registered as general taxpayers. Double-entry bookkeeping required.")
            : (ko ? "과세 유형을 선택하세요. 선택에 따라 세금 신고 방식과 부담이 달라집니다." : "Choose your tax type. This affects filing frequency and tax burden.")}
        </div>

        {/* 개인사업자: 간이/일반 선택 */}
        {!isCorp && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          <button type="button" onClick={() => selectTaxType("simplified")} style={{
            padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
            background: taxType === "simplified" ? "rgba(25,25,112,0.06)" : "rgba(0,0,0,0.01)",
            border: taxType === "simplified" ? "2px solid #191970" : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: taxType === "simplified" ? "6px solid #191970" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
              <div style={{ fontSize: "14px", fontWeight: 680, color: taxType === "simplified" ? MIDNIGHT : "#0f172a" }}>{ko ? "간이과세자" : "Simplified"}</div>
              <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: "rgba(25,25,112,0.08)", color: MIDNIGHT }}>{ko ? "추천" : "Rec."}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {ko ? "• 매출 1억 400만원 미만\n• 부가세 1.5~4% 수준\n• 4,800만원 미만: 부가세 면제\n• 세금 신고 연 1회\n• 간편장부 허용" : "• Revenue < ₩104M\n• VAT 1.5-4%\n• Under ₩48M: VAT exempt\n• Annual filing\n• Simple bookkeeping"}
            </div>
          </button>
          <button type="button" onClick={() => selectTaxType("general")} style={{
            padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
            background: taxType === "general" ? "rgba(25,25,112,0.06)" : "rgba(0,0,0,0.01)",
            border: taxType === "general" ? "2px solid #191970" : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: taxType === "general" ? "6px solid #191970" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
              <div style={{ fontSize: "14px", fontWeight: 680, color: taxType === "general" ? MIDNIGHT : "#0f172a" }}>{ko ? "일반과세자" : "General"}</div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {ko ? "• 매출 1억 400만원 이상\n• 부가세 10% (매입세액 공제)\n• 세금계산서 발급 의무\n• 반기 신고 (연 2회)\n• B2B 거래 시 필수" : "• Revenue ≥ ₩104M\n• VAT 10% (input deductible)\n• Must issue invoices\n• Semi-annual filing\n• Required for B2B"}
            </div>
          </button>
        </div>
        )}

        {/* 선택 확인 메시지 */}
        {!isCorp && taxType && (
        <div style={{ padding: "8px 12px", borderRadius: "10px", background: taxType === "simplified" ? "rgba(25,25,112,0.04)" : "rgba(25,25,112,0.04)", border: `1px solid ${taxType === "simplified" ? "rgba(25,25,112,0.1)" : "rgba(25,25,112,0.1)"}`, marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: taxType === "simplified" ? MIDNIGHT : MIDNIGHT }}>
            ✓ {taxType === "simplified"
              ? (ko ? "간이과세자 선택됨 — 매출 1억 400만원 미만일 때 유리합니다" : "Simplified selected — best for revenue under ₩104M")
              : (ko ? "일반과세자 선택됨 — B2B 거래나 매입세액 공제가 필요할 때 유리합니다" : "General selected — best for B2B or when you need input tax deduction")}
          </div>
        </div>
        )}

        {/* 간이과세 선택 시 상세 */}
        {!isCorp && taxType === "simplified" && (
        <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
          {(ko ? [
            { title: "부가세 납부", desc: "업종별 부가가치율(15~40%)을 곱해 계산. 실질 부담 매출의 1.5~4%. 매출 4,800만원 미만이면 면제" },
            { title: "종합소득세", desc: "매년 5월 신고. 누진세율 6~45%. 간편장부 또는 추계신고 가능" },
            { title: "세금계산서", desc: "매출 4,800만원 이상이면 발급 의무. 미만이면 영수증만 발급" },
            { title: "전환 시점", desc: "매출 1억 400만원 초과 시 자동으로 일반과세자 전환. 별도 신고 불필요" },
          ] : [
            { title: "VAT Payment", desc: "Industry rate 15-40%. Effective burden 1.5-4% of revenue. Exempt under ₩48M" },
            { title: "Income Tax", desc: "Annual filing in May. Progressive 6-45%. Simple bookkeeping OK" },
            { title: "Tax Invoices", desc: "Required above ₩48M revenue. Below: receipts only" },
            { title: "Auto-Conversion", desc: "Auto-converts to general when revenue exceeds ₩104M" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: MIDNIGHT }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        )}

        {/* 일반과세 선택 시 상세 */}
        {!isCorp && taxType === "general" && (
        <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
          {(ko ? [
            { title: "부가세 납부", desc: "매출세액(10%) - 매입세액 = 납부세액. 매입이 많으면 환급 가능" },
            { title: "종합소득세", desc: "매년 5월 신고. 누진세율 6~45%. 복식부기 의무 (매출 규모에 따라)" },
            { title: "세금계산서", desc: "모든 B2B 거래에 발급 의무. 홈택스에서 전자세금계산서 발행" },
            { title: "신고 주기", desc: "부가세 반기 신고 (1월·7월). 예정신고 포함 시 분기별" },
          ] : [
            { title: "VAT Payment", desc: "Output 10% - input tax = payable. Refund possible if input > output" },
            { title: "Income Tax", desc: "Annual in May. Progressive 6-45%. Double-entry if required" },
            { title: "Tax Invoices", desc: "Required for all B2B. E-invoice via HomeTax" },
            { title: "Filing Schedule", desc: "Semi-annual VAT (Jan/Jul). Quarterly with preliminary" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: MIDNIGHT }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        )}

        {/* 법인 세무 */}
        {isCorp && (
        <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
          {(ko ? [
            { title: "법인세", desc: "과세표준 2억 이하: 10% / 2~200억: 20% / 200~3000억: 22% / 3000억 초과: 25%" },
            { title: "부가가치세", desc: "일반과세자 자동 등록. 매출세액 10% - 매입세액 공제. 분기 신고" },
            { title: "원천징수", desc: "급여·용역비 지급 시 원천세 공제 후 납부. 매월 10일까지 신고" },
            { title: "복식부기 의무", desc: "법인은 복식부기 필수. 삼쩜삼·자비스 등 SaaS로 기장 가능 (세무 상세는 세무 가이드 단계에서)" },
          ] : [
            { title: "Corporate Tax", desc: "10% (≤₩200M) / 20% (≤₩20B) / 22% (≤₩300B) / 25% (>₩300B)" },
            { title: "VAT", desc: "Auto general taxpayer. 10% output - input deduction. Quarterly filing" },
            { title: "Withholding Tax", desc: "Deduct from salary/service payments. File by 10th monthly" },
            { title: "Tax Accountant", desc: "Double-entry required. ₩100-300K/mo. SaaS options: 3o3, Jobis" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: MIDNIGHT }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        )}

        {/* 팁 */}
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.06)" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: MIDNIGHT, marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
            <Lightbulb size={12} strokeWidth={1.5} color={MIDNIGHT} />
            {ko ? "팁" : "Tip"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
            {isCorp
              ? (ko ? "법인 설립 초기에는 자비스(Jobis)나 삼쩜삼으로 기장 비용을 줄일 수 있습니다. R&D 세액공제(최대 25%)를 활용하면 법인세를 크게 절감할 수 있어요." : "Use Jobis or 3o3 to reduce bookkeeping costs. R&D tax credits (up to 25%) significantly reduce corporate tax.")
              : taxType === "general"
                ? (ko ? "B2B 거래가 주력이라면 일반과세가 맞습니다. 매입세액 공제로 실질 세부담을 줄일 수 있어요." : "General is right for B2B-heavy businesses. Input tax deductions reduce actual burden.")
                : (ko ? "초기에는 간이과세로 시작하고, 매출이 늘면 자동 전환됩니다. 무료 회계 앱(캐시노트, 자비스)으로 매출/매입 기록을 시작하세요." : "Start with simplified, auto-converts as revenue grows. Use free apps (CashNote, Jobis) for bookkeeping.")}
          </div>
        </div>
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <a href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 ↗</a>
          <a href="https://cashnote.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>캐시노트 (무료) ↗</a>
          <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272" target="_blank" rel="noopener noreferrer" style={linkStyle}>{ko ? "부가세 안내" : "VAT Guide"} ↗</a>
        </div>
      </div>
        );
      })()}

      {/* ── Page 3: 보안 · 약관 ── */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "개인정보보호 · 이용약관 · 보안" : "Privacy, Terms & Security"}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "14px" }}>
          {ko ? "개인사업자라도 고객 데이터를 수집하면 개인정보보호법 적용 대상입니다. 서비스 출시 전에 기본기를 갖추세요." : "Even sole proprietors are subject to privacy law when collecting customer data. Set up basics before launch."}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {(ko ? [
            { title: "개인정보처리방침 작성", desc: "수집 항목, 이용 목적, 보유 기간, 파기 절차 명시. 개인정보보호 포털에서 자동 생성 가능", color: MIDNIGHT },
            { title: "이용약관 작성", desc: "서비스 이용 조건, 환불 정책, 면책 조항 포함. AI로 초안 생성 후 검토 권장", color: MIDNIGHT },
            { title: "고객 데이터 암호화", desc: "비밀번호: bcrypt 해싱 필수. 전송: HTTPS(TLS 1.3). DB: 암호화 저장. Supabase RLS 활용", color: MIDNIGHT },
            { title: "데이터 삭제 프로세스", desc: "고객 탈퇴 시 30일 이내 개인정보 파기 의무. 자동 삭제 로직 구현 권장", color: MIDNIGHT },
          ] : [
            { title: "Privacy Policy", desc: "List collected data, purpose, retention period, destruction. Auto-generate at privacy portal", color: MIDNIGHT },
            { title: "Terms of Service", desc: "Usage conditions, refund policy, liability limits. AI-draft then review", color: MIDNIGHT },
            { title: "Data Encryption", desc: "Passwords: bcrypt. Transit: HTTPS/TLS 1.3. Storage: encrypted. Use Supabase RLS", color: MIDNIGHT },
            { title: "Data Deletion", desc: "Delete personal data within 30 days of account closure. Implement auto-delete", color: MIDNIGHT },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: `${t.color}06`, border: `1px solid ${t.color}10` }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: t.color }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <a href="https://www.privacy.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>개인정보보호 포털 ↗</a>
          <a href="https://easylaw.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>찾기쉬운 생활법령 ↗</a>
        </div>
      </div>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="MVP 빌드"
        doneItemsKo={[
          { label: "1. 사업 형태 결정", detail: "개인사업자 vs 법인 — 매출·세금·투자 유치 고려 후 확정" },
          { label: "2. 사업자등록·법인 설립", detail: "홈택스 또는 등기소 — 자본금·이사·정관 작성" },
          { label: "3. 특허·상표 출원", detail: "핵심 IP·브랜드 사전 출원, 외부 노출 전 출원 완료" },
          { label: "4. 보안·약관·개인정보", detail: "이용약관·개인정보 처리방침·NDA·고용계약 사전 비치" },
        ]}
        verifyItemsKo={[
          "법인 vs 개인 — 투자 유치 시 법인 필수, 개인사업자는 투자·세제·신용 모두 한계",
          "정관 — 주식 종류·이사·감사·우선매수권 명문화, 모호하면 투자 유치 시 재작성",
          "특허·상표 — 외부 발표·전시 후 1년 grace period 한국만 적용, 해외는 출원 즉시 공개 시 특허성 상실",
          "투자자 친화 정관 — 우선주·전환사채·전환우선주 등 사전 정의, 미정의 시 투자 단계에서 재작성 비용",
          "스톡옵션 — 임직원 스톡옵션 풀 사전 확보 (보통 10~20%), vesting·exercise 조건 명문화",
          "개인정보 처리방침 — 개인정보보호법 의무 게시, 위반 시 매출 3% 이내 과징금",
        ]}
        nextSummaryKo="법인·특허·상표·약관 사전 셋업 완료 → MVP 빌드 단계로 진입"
      />

      {/* ── 2026-05-12: 규제 업종 사장님 별도 등록 안내 (fintech / healthtech / security) ── */}
      <div style={{ marginTop: 18, padding: "18px 20px", borderRadius: 16, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.12)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
          ⚠ 규제 업종 — 별도 등록·허가 필요
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 10 }}>
          {ko ? "fintech · healthtech · security 사장님은 일반 사업자등록 외 추가 라이센스 필요" : "Fintech / healthtech / security need additional licenses"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {/* Fintech */}
          <div style={{ padding: "12px 14px", background: "white", borderRadius: 12, border: "1px solid rgba(25,25,112,0.10)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#191970", marginBottom: 4 }}>
              💳 {ko ? "Fintech (전자금융업 / 마이데이터 / VASP)" : "Fintech (E-finance / MyData / VASP)"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
              <li>{ko ? "전자금융업 (전자금융거래법 §28): 자본금 5억~30억, 금융위 등록 2~4개월" : "E-finance registration: 0.5–3B KRW capital, FSC 2-4mo"}</li>
              <li>{ko ? "마이데이터 (본인신용정보관리업): 자본금 5억, 금융위 허가" : "MyData (credit info mgmt): 0.5B capital, FSC license"}</li>
              <li>{ko ? "가상자산이용자보호법 (2024.7 시행): 예치금 분리 + 해킹 보험 의무" : "VASP law (eff. Jul 2024): segregated deposits + hack insurance"}</li>
              <li><a href="https://www.fsc.go.kr" target="_blank" rel="noreferrer" style={{ color: "#191970", textDecoration: "underline" }}>{ko ? "금융위원회 신청 안내" : "FSC application guide"}</a></li>
            </ul>
          </div>
          {/* Healthtech */}
          <div style={{ padding: "12px 14px", background: "white", borderRadius: 12, border: "1px solid rgba(25,25,112,0.10)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#191970", marginBottom: 4 }}>
              🏥 {ko ? "Healthtech (MFDS SaMD / IRB)" : "Healthtech (MFDS SaMD / IRB)"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
              <li>{ko ? "SaMD 등급 (1~4): 1등급 신고 100~500만 / 2등급 인증 1~3천만 / 3·4등급 허가 5천만~5억+" : "SaMD class 1-4: filings vs full approval"}</li>
              <li>{ko ? "혁신의료기기 Fast Track: 80~140일 (199 카테고리)" : "Innovation Fast Track: 80-140 days"}</li>
              <li>{ko ? "IRB 심사: 일반 2~4주 / 디지털 치료기기 8~12주" : "IRB: 2-4wk standard / 8-12wk digital therapy"}</li>
              <li>{ko ? "PIPA 의료정보 + 비대면진료 시범사업" : "PIPA medical data + remote care pilot"}</li>
              <li><a href="https://www.mfds.go.kr" target="_blank" rel="noreferrer" style={{ color: "#191970", textDecoration: "underline" }}>{ko ? "식약처" : "MFDS"}</a></li>
            </ul>
          </div>
          {/* Security */}
          <div style={{ padding: "12px 14px", background: "white", borderRadius: 12, border: "1px solid rgba(25,25,112,0.10)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#191970", marginBottom: 4 }}>
              🔒 {ko ? "Security (ISMS-P / CSAP / CC)" : "Security (ISMS-P / CSAP / CC)"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
              <li>{ko ? "ISMS-P (KISA): 매출 100억 또는 회원 100만+ 의무. 인증 3~6개월" : "ISMS-P (KISA): mandatory if rev 10B+ or 1M users. 3-6mo"}</li>
              <li>{ko ? "CSAP (클라우드 보안 인증): 공공기관 납품 필수" : "CSAP: required for public-sector sales"}</li>
              <li>{ko ? "CC 인증 (정보보호 제품): 보안성 평가" : "CC certification for security products"}</li>
              <li>{ko ? "K-Shield / K-Shield Jr 정부 무료 교육·지원" : "K-Shield / K-Shield Jr free training"}</li>
              <li><a href="https://isms.kisa.or.kr" target="_blank" rel="noreferrer" style={{ color: "#191970", textDecoration: "underline" }}>{ko ? "KISA ISMS-P" : "KISA ISMS-P"}</a></li>
            </ul>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {ko
            ? "📌 위 라이센스는 자본금·기간 부담이 커서 시드 단계에선 부수업무 형태로 우회 가능 (예: PG 재판매, 의료기기 미인증 SaaS 등). 본 사업 전환 시 별도 PR/단계로 진행."
            : "📌 These can be deferred via reseller/non-certified SaaS at seed stage; transition during scale."}
        </div>
      </div>
    </div>
  );
}
