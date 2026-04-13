"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

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
    fontSize: "12px", fontWeight: 600, color: "#2563eb", textDecoration: "none",
    padding: "5px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.04)",
    border: "1px solid rgba(37,99,235,0.08)", marginTop: "4px",
  };

  const selectBizType = (type: "sole" | "corp") => {
    setGuideSelections((prev: Record<string, string>) => ({ ...prev, "biz-structure": type }));
  };

  return (
    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => d.setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => d.setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#2563eb" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => d.setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.08)",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ── Page 0: 사업자등록 ── */}
      {pg === 0 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "사업자등록 — 사업 형태 선택" : "Business Registration — Choose Your Structure"}</span>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "먼저 사업 형태를 선택하세요. 선택에 따라 절차가 달라집니다." : "Choose your business structure first. The process differs based on your choice."}
          </div>
        </div>

        {/* ── 개인/법인 선택 카드 (클릭 가능) ── */}
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
            {/* 개인사업자 */}
            <button type="button" onClick={() => selectBizType("sole")} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: bizType === "sole" ? "rgba(37,99,235,0.06)" : "rgba(0,0,0,0.01)",
              border: bizType === "sole" ? "2px solid #2563eb" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: bizType === "sole" ? "6px solid #2563eb" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: bizType === "sole" ? "#2563eb" : "#0f172a" }}>{ko ? "개인사업자" : "Sole Proprietor"}</div>
                {bizType !== "corp" && <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: "rgba(5,150,105,0.08)", color: "#059669" }}>{ko ? "추천" : "Recommended"}</span>}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {ko ? "• 등록비 0원 · 홈택스에서 즉시 신청\n• 간이과세 가능 (매출 1억 400만원 미만)\n• 회계 간편 · 간편장부 인정\n• 법인 전환은 투자 유치 시 해도 충분" : "• Free registration via HomeTax\n• Simplified tax available\n• Simple bookkeeping OK\n• Convert to corp when raising investment"}
              </div>
            </button>

            {/* 법인 */}
            <button type="button" onClick={() => selectBizType("corp")} style={{
              padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
              background: bizType === "corp" ? "rgba(124,58,237,0.06)" : "rgba(0,0,0,0.01)",
              border: bizType === "corp" ? "2px solid #7c3aed" : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: bizType === "corp" ? "6px solid #7c3aed" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
                <div style={{ fontSize: "14px", fontWeight: 680, color: bizType === "corp" ? "#7c3aed" : "#0f172a" }}>{ko ? "법인 (주식회사)" : "Corporation"}</div>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {ko ? "• 설립비 30~65만원 · 등기소 등록 필요\n• 복식부기 의무 · 세무사 필수\n• 투자 유치 · 지분 구조 설계에 유리\n• 매출 2억 초과 시 세율 유리" : "• ₩300-650K setup, registry required\n• Double-entry bookkeeping required\n• Better for raising VC / equity splits\n• Tax-efficient above ₩200M revenue"}
              </div>
            </button>
          </div>

          {bizType && (
            <div style={{ padding: "8px 12px", borderRadius: "10px", background: bizType === "sole" ? "rgba(37,99,235,0.04)" : "rgba(124,58,237,0.04)", border: `1px solid ${bizType === "sole" ? "rgba(37,99,235,0.1)" : "rgba(124,58,237,0.1)"}`, marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 640, color: bizType === "sole" ? "#2563eb" : "#7c3aed" }}>
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
          <div style={{ fontSize: "13px", fontWeight: 650, color: "#2563eb", marginBottom: "10px" }}>{ko ? "홈택스 사업자등록 절차" : "HomeTax Registration Steps"}</div>
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
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "12px", marginBottom: "10px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
              <div style={{ fontSize: "16px", fontWeight: 740, color: "#059669" }}>{ko ? "무료" : "Free"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
              <div style={{ fontSize: "16px", fontWeight: 740, color: "#2563eb" }}>1~3{ko ? "일" : "d"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 바로가기 ↗</a>
            <a href="https://www.gov.kr/portal/service/serviceInfo/PTR000050466" target="_blank" rel="noopener noreferrer" style={linkStyle}>정부24 사업자등록 ↗</a>
          </div>
        </div>
        )}

        {/* ── 법인 설립 절차 ── */}
        {bizType === "corp" && (
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 650, color: "#7c3aed", marginBottom: "10px" }}>{ko ? "법인(주식회사) 설립 절차" : "Corporation Incorporation Steps"}</div>
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
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "12px", marginBottom: "10px" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "등록면허세" : "License Tax"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: "#7c3aed" }}>~13{ko ? "만원" : "0K"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "대행비 (선택)" : "Agency"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: "#7c3aed" }}>30~50{ko ? "만원" : "0K"}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.04)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
              <div style={{ fontSize: "14px", fontWeight: 740, color: "#7c3aed" }}>1~2{ko ? "주" : "wk"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://www.help-me.kr" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: "#7c3aed", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>헬프미 법인설립 ↗</a>
            <a href="https://zuzu.network" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: "#7c3aed", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>ZUZU 법인설립 ↗</a>
            <a href="https://www.startbiz.go.kr" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: "#7c3aed", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>온라인법인설립 ↗</a>
            <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, color: "#7c3aed", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>홈택스 ↗</a>
          </div>

          {/* 스톡옵션 팁 */}
          <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.08)" }}>
            <div style={{ fontSize: "12px", fontWeight: 640, color: "#059669", marginBottom: "4px" }}>{ko ? "💡 스톡옵션 · 캡테이블" : "💡 Stock Options & Cap Table"}</div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
              {ko
                ? "벤처기업 인증 후 스톡옵션 부여 시 직원 1인당 연 5,000만원까지 비과세. 4년 베스팅/1년 클리프가 업계 표준. ZUZU로 캡테이블 관리 권장."
                : "After venture cert, stock options tax-free up to ₩50M/yr per employee. 4-year vesting / 1-year cliff is industry standard. Use ZUZU for cap table."}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* ── Page 1: 특허·상표 출원 ── */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>{ko ? "특허·상표 출원 — 공개 전 필수" : "Patent & Trademark Filing — Before Public Disclosure"}</span>
          <div style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)", marginTop: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 650, color: "#dc2626" }}>
              {ko ? "⚠ 데모, 베타, 보도자료 등 공개 후에는 특허권을 영구히 잃을 수 있습니다. 반드시 공개 전에 출원하세요." : "⚠ Public disclosure (demo, beta, press) can permanently forfeit patent rights. File BEFORE any disclosure."}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ fontSize: "14px", fontWeight: 650, color: "#d97706", marginBottom: "8px" }}>{ko ? "특허 출원 절차" : "Patent Filing Steps"}</div>
          {(ko ? [
            { step: "1", title: "KIPRIS에서 선행 기술 조사", detail: "kipris.or.kr에서 유사 특허 검색. 무료. 기존 기술과 차별점 확인" },
            { step: "2", title: "특허고객번호 발급", detail: "특허로(patent.go.kr)에서 무료 발급. 공인인증서 등록" },
            { step: "3", title: "명세서 작성 · 온라인 출원", detail: "특허로에서 NKeditor로 명세서 작성 후 제출. 변리사 대행 시 100~200만원" },
            { step: "4", title: "심사 청구 · 대기", detail: "일반 12~18개월 / 조기심사(스타트업 3년 이내) 3~6개월. 수수료 70% 감면" },
          ] : [
            { step: "1", title: "Prior art search on KIPRIS", detail: "kipris.or.kr — free search for similar patents" },
            { step: "2", title: "Get patent customer number", detail: "Free at patent.go.kr, register digital certificate" },
            { step: "3", title: "Draft specification & file online", detail: "NKeditor on patent.go.kr, or patent attorney ₩1-2M" },
            { step: "4", title: "Request examination", detail: "12-18mo normal / 3-6mo fast track (startups <3yr get 70% fee reduction)" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "4" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}

          <div style={{ fontSize: "14px", fontWeight: 650, color: "#d97706", margin: "16px 0 8px" }}>{ko ? "상표 출원" : "Trademark Filing"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.7, marginBottom: "8px" }}>
            {ko
              ? "브랜드명과 로고를 보호합니다. 특허로에서 온라인 출원. 심사 약 10~14개월 (빠른심사 약 4개월). 상표는 수수료 감면 대상이 아니므로 관납료 전액 부담 (1류 기준 약 7만원)."
              : "Protects your brand name and logo. File online at patent.go.kr. Review ~10-14 months (fast track ~4 months). No fee reduction for trademarks (gov fee ~₩70K per class)."}
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://www.kipris.or.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>KIPRIS 선행기술 조사 ↗</a>
            <a href="https://www.patent.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>특허로 온라인 출원 ↗</a>
            <a href="https://www.kipo.go.kr/ko/kpoContentView.do?menuCd=SCD0200378" target="_blank" rel="noopener noreferrer" style={linkStyle}>수수료 감면 안내 ↗</a>
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
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "과세 유형 결정 · 세무 기초" : "Tax Type & Basics"}</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginBottom: "14px" }}>
          {isCorp
            ? (ko ? "법인은 일반과세자로 자동 등록됩니다. 복식부기 의무이며 세무사 선임이 권장됩니다." : "Corporations are automatically registered as general taxpayers.")
            : (ko ? "과세 유형을 선택하세요. 선택에 따라 세금 신고 방식과 부담이 달라집니다." : "Choose your tax type. This affects filing frequency and tax burden.")}
        </div>

        {/* 개인사업자: 간이/일반 선택 */}
        {!isCorp && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          <button type="button" onClick={() => selectTaxType("simplified")} style={{
            padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
            background: taxType === "simplified" ? "rgba(5,150,105,0.06)" : "rgba(0,0,0,0.01)",
            border: taxType === "simplified" ? "2px solid #059669" : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: taxType === "simplified" ? "6px solid #059669" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
              <div style={{ fontSize: "14px", fontWeight: 680, color: taxType === "simplified" ? "#059669" : "#0f172a" }}>{ko ? "간이과세자" : "Simplified"}</div>
              <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: "rgba(5,150,105,0.08)", color: "#059669" }}>{ko ? "추천" : "Rec."}</span>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {ko ? "• 매출 1억 400만원 미만\n• 부가세 1.5~4% 수준\n• 4,800만원 미만: 부가세 면제\n• 세금 신고 연 1회\n• 간편장부 허용" : "• Revenue < ₩104M\n• VAT 1.5-4%\n• Under ₩48M: VAT exempt\n• Annual filing\n• Simple bookkeeping"}
            </div>
          </button>
          <button type="button" onClick={() => selectTaxType("general")} style={{
            padding: "16px", borderRadius: "14px", cursor: "pointer", textAlign: "left" as const,
            background: taxType === "general" ? "rgba(37,99,235,0.06)" : "rgba(0,0,0,0.01)",
            border: taxType === "general" ? "2px solid #2563eb" : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: taxType === "general" ? "6px solid #2563eb" : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s ease" }} />
              <div style={{ fontSize: "14px", fontWeight: 680, color: taxType === "general" ? "#2563eb" : "#0f172a" }}>{ko ? "일반과세자" : "General"}</div>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {ko ? "• 매출 1억 400만원 이상\n• 부가세 10% (매입세액 공제)\n• 세금계산서 발급 의무\n• 반기 신고 (연 2회)\n• B2B 거래 시 필수" : "• Revenue ≥ ₩104M\n• VAT 10% (input deductible)\n• Must issue invoices\n• Semi-annual filing\n• Required for B2B"}
            </div>
          </button>
        </div>
        )}

        {/* 선택 확인 메시지 */}
        {!isCorp && taxType && (
        <div style={{ padding: "8px 12px", borderRadius: "10px", background: taxType === "simplified" ? "rgba(5,150,105,0.04)" : "rgba(37,99,235,0.04)", border: `1px solid ${taxType === "simplified" ? "rgba(5,150,105,0.1)" : "rgba(37,99,235,0.1)"}`, marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: taxType === "simplified" ? "#059669" : "#2563eb" }}>
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
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#059669" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
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
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#2563eb" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
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
            { title: "세무사 선임", desc: "복식부기 의무. 월 기장료 10~30만원. 삼쩜삼·자비스 등 SaaS 활용도 가능" },
          ] : [
            { title: "Corporate Tax", desc: "10% (≤₩200M) / 20% (≤₩20B) / 22% (≤₩300B) / 25% (>₩300B)" },
            { title: "VAT", desc: "Auto general taxpayer. 10% output - input deduction. Quarterly filing" },
            { title: "Withholding Tax", desc: "Deduct from salary/service payments. File by 10th monthly" },
            { title: "Tax Accountant", desc: "Double-entry required. ₩100-300K/mo. SaaS options: 3o3, Jobis" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#7c3aed" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        )}

        {/* 팁 */}
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: "#059669", marginBottom: "4px" }}>{ko ? "💡 팁" : "💡 Tip"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
            {isCorp
              ? (ko ? "법인 설립 초기에는 자비스(Jobis)나 삼쩜삼으로 기장 비용을 줄일 수 있습니다. R&D 세액공제(최대 25%)를 활용하면 법인세를 크게 절감할 수 있어요." : "Use Jobis or 3o3 to reduce bookkeeping costs. R&D tax credits (up to 25%) significantly reduce corporate tax.")
              : taxType === "general"
                ? (ko ? "B2B 거래가 주력이라면 일반과세가 맞습니다. 매입세액 공제로 실질 세부담을 줄일 수 있어요. 세무사 상담을 권장합니다." : "General is right for B2B-heavy businesses. Input tax deductions reduce actual burden. Consider a tax consultant.")
                : (ko ? "초기에는 간이과세로 시작하고, 매출이 늘면 자동 전환됩니다. 무료 회계 앱(캐시노트, 자비스)으로 매출/매입 기록을 시작하세요." : "Start with simplified, auto-converts as revenue grows. Use free apps (CashNote, Jobis) for bookkeeping.")}
          </div>
        </div>
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 ↗</a>
          <a href="https://cashnote.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>캐시노트 (무료) ↗</a>
          <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272" target="_blank" rel="noopener noreferrer" style={linkStyle}>{ko ? "부가세 안내" : "VAT Guide"} ↗</a>
        </div>
      </div>
        );
      })()}

      {/* ── Page 3: 보안 · 약관 ── */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "개인정보보호 · 이용약관 · 보안" : "Privacy, Terms & Security"}</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginBottom: "14px" }}>
          {ko ? "개인사업자라도 고객 데이터를 수집하면 개인정보보호법 적용 대상입니다. 서비스 출시 전에 기본기를 갖추세요." : "Even sole proprietors are subject to privacy law when collecting customer data. Set up basics before launch."}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {(ko ? [
            { title: "개인정보처리방침 작성", desc: "수집 항목, 이용 목적, 보유 기간, 파기 절차 명시. 개인정보보호 포털에서 자동 생성 가능", color: "#7c3aed" },
            { title: "이용약관 작성", desc: "서비스 이용 조건, 환불 정책, 면책 조항 포함. AI로 초안 생성 후 검토 권장", color: "#7c3aed" },
            { title: "고객 데이터 암호화", desc: "비밀번호: bcrypt 해싱 필수. 전송: HTTPS(TLS 1.3). DB: 암호화 저장. Supabase RLS 활용", color: "#7c3aed" },
            { title: "데이터 삭제 프로세스", desc: "고객 탈퇴 시 30일 이내 개인정보 파기 의무. 자동 삭제 로직 구현 권장", color: "#7c3aed" },
          ] : [
            { title: "Privacy Policy", desc: "List collected data, purpose, retention period, destruction. Auto-generate at privacy portal", color: "#7c3aed" },
            { title: "Terms of Service", desc: "Usage conditions, refund policy, liability limits. AI-draft then review", color: "#7c3aed" },
            { title: "Data Encryption", desc: "Passwords: bcrypt. Transit: HTTPS/TLS 1.3. Storage: encrypted. Use Supabase RLS", color: "#7c3aed" },
            { title: "Data Deletion", desc: "Delete personal data within 30 days of account closure. Implement auto-delete", color: "#7c3aed" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: `${t.color}06`, border: `1px solid ${t.color}10` }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: t.color }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <a href="https://www.privacy.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>개인정보보호 포털 ↗</a>
          <a href="https://easylaw.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>찾기쉬운 생활법령 ↗</a>
        </div>
      </div>
      )}
    </div>
  );
}
