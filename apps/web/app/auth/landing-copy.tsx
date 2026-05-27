"use client";

import type { Language } from "@build-up/shared";

/* ─── Feature grid icon ─── */
export function FeatureIcon({ color, d }: { color: string; d: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 10
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  );
}

/* ─── Summary features data ─── */
export function getSummaryFeatures(lang: Language) {
  const ko = lang === "ko";
  return [
    { color: "#007aff", d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", title: ko ? "맞춤 로드맵" : "Custom Roadmap", desc: ko ? "업종별 최적 경로" : "Industry-specific path" },
    { color: "#34c759", d: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", title: ko ? "체크리스트" : "Checklists", desc: ko ? "단계별 실행 항목" : "Stage-by-stage actions" },
    { color: "#ff9f0a", d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", title: ko ? "인허가 가이드" : "Permit Guides", desc: ko ? "출처 명시, 최신 검증" : "Source-backed, verified" },
    { color: "#5856d6", d: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", title: ko ? "세무 가이드" : "Tax Guides", desc: ko ? "간이/일반 신고 안내" : "Filing type assistance" },
    { color: "#30b0c7", d: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3", title: ko ? "대출 가이드" : "Loan Guides", desc: ko ? "정책자금 신청 방법" : "Policy loan applications" },
    { color: "#ff375f", d: "M18 20V10M12 20V4M6 20v-6", title: ko ? "재무 시뮬레이션" : "Finance Sim", desc: ko ? "BEP, 런웨이, 위험 분석" : "BEP, runway, risk analysis" },
    { color: "#ff6482", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", title: ko ? "계약서 분석" : "Contract Scan", desc: ko ? "위험 조항 자동 감지" : "Auto risk clause detection" },
    { color: "#64d2ff", d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z", title: ko ? "상권 분석" : "Market Analysis", desc: ko ? "입지 점수 비교" : "Location scoring" },
    { color: "#ac8e68", d: "M16 16v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2m8 0V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2M20 8h-6a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-8a2 2 0 00-2-2z", title: ko ? "공급업체 연결" : "Vendor Connect", desc: ko ? "단계별 추천 업체" : "Stage-based suppliers" },
    { color: "#ff9f0a", d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", title: ko ? "재고 관리" : "Inventory", desc: ko ? "공급업체 기반 입력" : "Supplier-linked input" },
    { color: "#007aff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", title: ko ? "직원 관리" : "Team Management", desc: ko ? "인건비 자동 반영" : "Auto labor cost sync" },
    { color: "#34c759", d: "M22 12h-4l-3 9L9 3l-3 9H2", title: ko ? "운영 대시보드" : "Ops Dashboard", desc: ko ? "매출, 원가율, KPI" : "Sales, cost, KPIs" },
    { color: "#af52de", d: "M12 2a4 4 0 014 4c0 2-2 3-2 3H10s-2-1-2-3a4 4 0 014-4zM10 9h4v4a2 2 0 01-4 0V9zM8.5 14l-4 6M15.5 14l4 6M12 13v9", title: ko ? "AI 해석" : "AI Interpretation", desc: ko ? "숫자를 행동으로 번역" : "Numbers to actions" },
    { color: "#ff375f", d: "M18 8A6 6 0 006 8c0 7-3 9-6 11 3-2 6-4 6-11zM13.73 21a2 2 0 01-3.46 0", title: ko ? "스마트 알림" : "Smart Alerts", desc: ko ? "놓치기 쉬운 항목 경고" : "Never miss a step" },
    { color: "#5856d6", d: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z", title: ko ? "한/영 지원" : "KO/EN Support", desc: ko ? "완전 이중 언어" : "Fully bilingual" },
    { color: "#64d2ff", d: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z", title: ko ? "클라우드 동기화" : "Cloud Sync", desc: ko ? "어디서든 이어하기" : "Resume anywhere" }
  ];
}

/* ─── copy ─── */
export function txt(lang: Language) {
  if (lang === "ko") {
    return {
      heroEyebrow: "창업의 모든 단계를 함께",
      heroTitle: "시작부터 운영까지,\n한 흐름으로.",
      heroSub:
        "build.up은 창업 로드맵을 단계별로 안내하고, 검증된 가이드와 분석 도구로 판단을 도와줍니다. 지금 시작하세요.",
      heroCta: "무료로 시작하기",
      heroLearn: "더 알아보기",
      ctaTitle: "지금 시작할 준비가\n되셨나요?",
      ctaSub:
        "계정을 만들고, 몇 가지 질문에 답하면 맞춤형 로드맵이 바로 생성됩니다."
    };
  }
  return {
    heroEyebrow: "Every stage of your business, guided",
    heroTitle: "From idea to\noperations, in one flow.",
    heroSub:
      "build.up walks you through a step-by-step startup roadmap with verified guides and analysis tools. Start free today.",
    heroCta: "Get started free",
    heroLearn: "Learn more",
    ctaTitle: "Ready to begin?",
    ctaSub:
      "Create an account, answer a few questions, and your personalized roadmap is ready."
  };
}

/* ─── features ─── */
export function getFeatures(lang: Language) {
  if (lang === "ko") {
    return [
      {
        label: "스마트 온보딩",
        title: "몇 가지 질문만으로\n맞춤 로드맵 생성.",
        body: "업종, 자본금, 지역, 목표 오픈일 — 4단계 질문에 답하면 당신만을 위한 창업 로드맵이 자동으로 만들어집니다."
      },
      {
        label: "로드맵",
        title: "지금 해야 할 단계만\n정확하게.",
        body: "모든 할 일을 한꺼번에 보여주지 않습니다. 현재 단계에 집중하고, 완료하면 다음 단계가 자연스럽게 열립니다."
      },
      {
        label: "검증된 가이드",
        title: "출처와 최신성이\n보장된 정보.",
        body: "인허가, 세무, 대출 등 실무 가이드는 출처와 검증 시점을 함께 표시합니다. 오래된 정보에는 경고가 붙습니다."
      },
      {
        label: "분석 도구",
        title: "계약서와 재무를\n읽을 수 있는 언어로.",
        body: "계약서 위험 조항을 자동으로 감지하고, 재무 시뮬레이션 결과를 행동 가능한 해석으로 번역합니다."
      },
      {
        label: "상권 분석",
        title: "데이터 기반으로\n최적의 입지를 찾다.",
        body: "유동인구, 경쟁 밀도, 임대료 수준을 종합 분석해 입지별 점수와 등급을 한눈에 비교할 수 있습니다."
      },
      {
        label: "멘토링",
        title: "단계마다 구체적인\n행동 가이드.",
        body: "각 단계에서 무엇을 해야 하는지, 어떤 위험이 있는지, 누구에게 문의해야 하는지까지 안내합니다."
      },
      {
        label: "운영 대시보드",
        title: "오픈 후에도\n계속 함께.",
        body: "일 매출 기록, 원가율 추적, KPI 건강 지표까지 — 개업 이후의 가게 운영도 한 화면에서 관리합니다."
      }
    ];
  }
  return [
    {
      label: "Smart Onboarding",
      title: "A personalized roadmap\nfrom just a few answers.",
      body: "Industry, capital, location, target date — answer four steps and your custom startup roadmap is ready instantly."
    },
    {
      label: "Roadmap",
      title: "Only the step that\nmatters right now.",
      body: "No overwhelming dashboard. Focus on the current stage, and the next one opens naturally when you're done."
    },
    {
      label: "Verified Guides",
      title: "Information backed by\nsources and freshness.",
      body: "Permits, tax, and loan guides show their sources and verification dates. Outdated content is flagged automatically."
    },
    {
      label: "Analysis Tools",
      title: "Contracts and finance,\nin plain language.",
      body: "Auto-detect risky clauses in contracts and translate financial simulations into actionable interpretation."
    },
    {
      label: "Market Intelligence",
      title: "Find your best location\nwith data, not guesswork.",
      body: "Foot traffic, competition density, and rent levels combined into a score and grade for each potential location."
    },
    {
      label: "Mentoring",
      title: "Specific action guidance\nat every stage.",
      body: "Each stage tells you what to do, what to watch out for, and who to contact when you need help."
    },
    {
      label: "Operations Dashboard",
      title: "We stay with you\nafter opening day.",
      body: "Daily sales logging, cost ratio tracking, and KPI health indicators — manage your running business in one view."
    }
  ];
}
