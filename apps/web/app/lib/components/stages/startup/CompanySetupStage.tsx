"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function CompanySetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 3;
  const pgLabels = ko ? ["법인 설립 절차", "비용 요약", "스톡옵션 팁"] : ["Incorporation", "Costs", "Stock Options"];

  return (
    <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => d.setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px" }}>
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

      {/* Page 0: 법인 설립 절차 */}
      {pg === 0 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "한국 법인 설립 6단계" : "6 Steps to Incorporate in Korea"}</span>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "자본금 100원부터 가능. 1-2주 내 완료." : "Min capital ₩100. Done in 1-2 weeks."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          {(ko ? [
            { step: "1", title: "정관 작성", detail: "사업 목적, 발행 주식 수, 자본금 결정. AI로 초안 작성 가능" },
            { step: "2", title: "발기인 총회", detail: "공동 창업자 합의. 지분율, 의사결정 구조 확정" },
            { step: "3", title: "자본금 납입", detail: "은행에 자본금 입금 후 잔액 증명서 발급 (100원도 가능)" },
            { step: "4", title: "등기 신청", detail: "등기소 방문 또는 온라인 (헬프미 등 대행 서비스 30만원~)" },
            { step: "5", title: "사업자등록", detail: "세무서 또는 홈택스. 등기 완료 후 20일 이내" },
            { step: "6", title: "법인 통장 개설", detail: "사업자등록증 + 법인 인감 지참. 토스 비즈니스 추천" },
          ] : [
            { step: "1", title: "Articles of Incorporation", detail: "Business purpose, shares, capital. AI can draft" },
            { step: "2", title: "Founders Meeting", detail: "Agree on equity, decision structure" },
            { step: "3", title: "Capital Deposit", detail: "Deposit to bank, get balance certificate (min ₩100)" },
            { step: "4", title: "Registration", detail: "Registry office or online service (~₩300K)" },
            { step: "5", title: "Tax Registration", detail: "Tax office or Hometax within 20 days" },
            { step: "6", title: "Business Account", detail: "Bring registration + company seal" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "6" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Page 1: 비용 요약 */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "rgba(255,255,255,0.98)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "14px" }}>{ko ? "법인 설립 비용" : "Incorporation Costs"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            { label: ko ? "등록면허세" : "License tax", value: "~13만원" },
            { label: ko ? "교육세" : "Education tax", value: "~2.6만원" },
            { label: ko ? "대행비 (선택)" : "Agency (optional)", value: "30~50만원" },
          ].map(c => (
            <div key={c.label} style={{ padding: "12px", borderRadius: "12px", background: "rgba(37,99,235,0.03)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.35)" }}>{c.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 720, color: "#2563eb" }}>{c.value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.06)" }}>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6 }}>
            {ko ? "총 비용: 직접 진행 시 약 16만원, 대행 이용 시 약 50~65만원. 자본금은 100원부터 가능하지만, 벤처인증을 위해 최소 100만원 이상 권장합니다." : "Total: ~₩160K DIY, ~₩500-650K with agency. Capital from ₩100, but ₩1M+ recommended for venture certification."}
          </div>
        </div>
      </div>
      )}

      {/* Page 2: 스톡옵션 팁 */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{ko ? "스톡옵션 & 캡테이블" : "Stock Options & Cap Table"}</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.7, marginBottom: "14px" }}>
          {ko ? "벤처기업 인증 후 스톡옵션을 부여하면 직원 1인당 연 5,000만원까지 비과세 혜택을 받을 수 있습니다. 캡테이블은 ZUZU 같은 도구로 관리하세요." : "After venture certification, stock options are tax-free up to ₩50M/year per employee. Use ZUZU for cap table management."}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {(ko ? [
            { title: "4년 베스팅 / 1년 클리프", desc: "업계 표준. 1년 근속 후 25%가 행사 가능해지고, 이후 매월 점진적 확보" },
            { title: "벤처인증 후 부여 필수", desc: "인증 전 부여 시 비과세 혜택 없음. 기술보증기금 경로가 가장 빠름 (15~30일)" },
            { title: "ZUZU로 캡테이블 관리", desc: "주주 구성, 투자 라운드, 희석 시뮬레이션을 한 곳에서 관리" },
          ] : [
            { title: "4-year vesting / 1-year cliff", desc: "Industry standard. 25% after 1 year, then monthly vesting" },
            { title: "Grant after venture certification", desc: "No tax benefit without certification. KIBO is fastest path (15-30 days)" },
            { title: "ZUZU for cap table", desc: "Manage shareholders, rounds, and dilution in one place" },
          ]).map(t => (
            <div key={t.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.03)", border: "1px solid rgba(5,150,105,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#059669" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
