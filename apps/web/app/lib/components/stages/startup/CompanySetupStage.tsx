"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function CompanySetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
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
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "사업자등록 — 홈택스 온라인 신청" : "Business Registration — HomeTax Online"}</span>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "대부분의 스타트업은 개인사업자로 시작합니다. 비용 0원, 3영업일이면 완료." : "Most startups begin as sole proprietor. Zero cost, done in 3 business days."}
          </div>
        </div>

        {/* 개인 vs 법인 비교 */}
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 650, color: "#2563eb", marginBottom: "8px" }}>{ko ? "어떤 형태가 맞을까?" : "Which form is right?"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.08)" }}>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "#2563eb", marginBottom: "6px" }}>{ko ? "개인사업자 (추천)" : "Sole Proprietor ✓"}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
                {ko ? "• 등록비 0원 · 홈택스에서 즉시 신청\n• 간이과세 가능 (매출 1억 400만원 미만)\n• 회계 간편 · 간편장부 인정\n• 법인 전환은 투자 유치 시 진행해도 충분" : "• Free registration, instant on HomeTax\n• Simplified tax available\n• Simple bookkeeping\n• Convert to corp when raising investment"}
              </div>
            </div>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(0,0,0,0.01)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "rgba(15,23,42,0.5)", marginBottom: "6px" }}>{ko ? "법인 (나중에)" : "Corporation (Later)"}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", lineHeight: 1.6 }}>
                {ko ? "• 설립비 30~65만원 · 등기 필요\n• 복식부기 의무 · 세무사 필요\n• 투자 유치 · 지분 구조 설계 시\n• 매출 2억 초과 시 세율 유리" : "• ₩300-650K setup, registration required\n• Double-entry bookkeeping required\n• When raising VC or structuring equity\n• Tax-efficient above ₩200M revenue"}
              </div>
            </div>
          </div>
        </div>

        {/* 등록 절차 */}
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
          <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 바로가기 ↗</a>
            <a href="https://www.gov.kr/portal/service/serviceInfo/PTR000050466" target="_blank" rel="noopener noreferrer" style={linkStyle}>정부24 사업자등록 ↗</a>
          </div>
        </div>
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
          {/* 특허 출원 */}
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

          {/* 상표 출원 */}
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
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "과세 유형 결정 · 세무 기초" : "Tax Type & Basics"}</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginBottom: "14px" }}>
          {ko ? "개인사업자는 간이과세자와 일반과세자 중 선택합니다. 초기 매출이 적으면 간이과세가 유리합니다." : "Sole proprietors choose between simplified and general taxation. Simplified is better for low initial revenue."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.08)" }}>
            <div style={{ fontSize: "14px", fontWeight: 680, color: "#059669", marginBottom: "4px" }}>{ko ? "간이과세자" : "Simplified"}</div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
              {ko ? "• 매출 1억 400만원 미만\n• 부가세 1.5~4% 수준\n• 매출 4,800만원 미만: 부가세 면제\n• 세금 신고 연 1회\n• 간편장부 허용" : "• Revenue < ₩104M\n• VAT 1.5-4%\n• Under ₩48M: VAT exempt\n• Annual filing only\n• Simple bookkeeping OK"}
            </div>
          </div>
          <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(0,0,0,0.01)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "14px", fontWeight: 680, color: "rgba(15,23,42,0.6)", marginBottom: "4px" }}>{ko ? "일반과세자" : "General"}</div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)", lineHeight: 1.6 }}>
              {ko ? "• 매출 1억 400만원 이상\n• 부가세 10% (매입세액 공제)\n• 세금계산서 발급 의무\n• 반기 신고 (연 2회)\n• B2B 거래 시 필수" : "• Revenue ≥ ₩104M\n• VAT 10% (input tax deductible)\n• Must issue tax invoices\n• Semi-annual filing\n• Required for B2B"}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: "#059669", marginBottom: "4px" }}>{ko ? "💡 초기 스타트업 팁" : "💡 Early Startup Tip"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>
            {ko
              ? "초기에는 간이과세로 시작하고, 매출이 늘면 자동 전환됩니다. 무료 회계 앱(캐시노트, 자비스)으로 매출/매입 기록을 시작하세요. 법인 전환은 순이익 2억 초과 시 검토."
              : "Start with simplified, auto-converts as revenue grows. Use free accounting apps (CashNote, Jobis) to track income/expenses. Consider incorporation when net profit exceeds ₩200M."}
          </div>
        </div>
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>홈택스 ↗</a>
          <a href="https://cashnote.kr" target="_blank" rel="noopener noreferrer" style={linkStyle}>캐시노트 (무료) ↗</a>
        </div>
      </div>
      )}

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
