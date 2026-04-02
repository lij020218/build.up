// ─── 투자 용어 사전 (한국 스타트업 맥락) ──────────────────────────────────

export type TermCategory = "instrument" | "valuation" | "governance" | "exit" | "dilution";

export type InvestmentTerm = {
  id: string;
  term: { ko: string; en: string };
  shortDef: { ko: string; en: string };
  longDef: { ko: string; en: string };
  category: TermCategory;
  relatedTermIds: string[];
  example?: { ko: string; en: string };
  dangerLevel?: "safe" | "caution" | "danger";
  koreaSpecific?: boolean;
};

export const TERM_CATEGORIES: Array<{ id: TermCategory; label: { ko: string; en: string }; color: string }> = [
  { id: "instrument", label: { ko: "투자 수단", en: "Instruments" }, color: "#2563eb" },
  { id: "valuation", label: { ko: "밸류에이션", en: "Valuation" }, color: "#059669" },
  { id: "governance", label: { ko: "경영권/거버넌스", en: "Governance" }, color: "#7c3aed" },
  { id: "exit", label: { ko: "엑싯/청산", en: "Exit/Liquidation" }, color: "#dc2626" },
  { id: "dilution", label: { ko: "지분 희석", en: "Dilution" }, color: "#d97706" },
];

export const INVESTMENT_TERMS: InvestmentTerm[] = [
  // ── 투자 수단 ──
  { id: "rcps", term: { ko: "RCPS (상환전환우선주)", en: "RCPS (Redeemable Convertible Preferred Stock)" }, shortDef: { ko: "한국 VC 투자의 표준 수단. 보통주 전환 + 상환 청구 가능", en: "Korean VC standard. Convertible to common + redeemable" }, longDef: { ko: "상환전환우선주(RCPS)는 한국 벤처 투자의 90%+ 에서 사용되는 투자 수단입니다. 투자자가 보통주로 전환할 수 있고, 전환하지 않으면 투자금 + 이자를 상환 요구할 수 있습니다. 미국의 Preferred Stock과 유사하지만 상환 옵션이 추가된 한국 특유의 구조입니다.", en: "RCPS is the dominant instrument in Korean VC (90%+). Convertible to common stock, or redeemable for principal + interest." }, category: "instrument", relatedTermIds: ["safe", "cb", "common"], example: { ko: "시리즈A 30억원 투자 시 RCPS 발행. 전환가 10,000원/주, 상환 연이자 5%", en: "Series A ₩3B via RCPS. Conversion price ₩10K/share, 5% annual redemption interest" }, dangerLevel: "caution", koreaSpecific: true },
  { id: "safe", term: { ko: "SAFE (조건부 지분 인수 계약)", en: "SAFE (Simple Agreement for Future Equity)" }, shortDef: { ko: "미국 YC 표준. 한국에서는 초기 투자에 제한적 사용", en: "YC standard. Limited use in Korea for early stage" }, longDef: { ko: "SAFE는 밸류에이션 캡과 디스카운트를 설정하고, 다음 투자 라운드에서 자동으로 주식으로 전환됩니다. 한국에서는 법적 구속력 이슈가 있어 RCPS가 더 선호되지만, 엔젤/시드 단계에서 간혹 사용됩니다.", en: "SAFE sets a valuation cap and discount, converting automatically at the next round. Less common in Korea due to legal enforceability concerns." }, category: "instrument", relatedTermIds: ["rcps", "valuation-cap", "discount"], dangerLevel: "safe" },
  { id: "cb", term: { ko: "CB (전환사채)", en: "CB (Convertible Bond)" }, shortDef: { ko: "채권으로 시작, 주식으로 전환 가능. 브릿지 라운드에 자주 사용", en: "Starts as debt, convertible to equity. Common for bridge rounds" }, longDef: { ko: "전환사채는 만기까지 이자를 받는 채권이지만, 투자자가 원하면 주식으로 전환할 수 있습니다. 한국에서는 다운라운드 시 보호 수단이나 브릿지 투자에 자주 사용됩니다.", en: "A bond with interest until maturity, but convertible to shares at investor's option. Used in Korea for down-round protection or bridge financing." }, category: "instrument", relatedTermIds: ["rcps", "safe"], dangerLevel: "caution" },
  { id: "common", term: { ko: "보통주", en: "Common Stock" }, shortDef: { ko: "창업자가 보유하는 기본 주식. 의결권 있음", en: "Founder shares. Voting rights included" }, longDef: { ko: "보통주는 회사의 기본 주식입니다. 창업자와 직원(스톡옵션 행사)이 보유합니다. 우선주(RCPS) 대비 청산 시 후순위이지만, 의결권이 동일합니다.", en: "Basic shares held by founders and employees (via exercised options). Junior to preferred in liquidation, but equal voting rights." }, category: "instrument", relatedTermIds: ["rcps", "esop"], dangerLevel: "safe" },

  // ── 밸류에이션 ──
  { id: "pre-money", term: { ko: "프리머니 밸류에이션", en: "Pre-money Valuation" }, shortDef: { ko: "투자 전 회사 가치. 투자금 포함 전", en: "Company value before investment" }, longDef: { ko: "투자금이 들어오기 전 회사의 가치입니다. 예: 프리머니 100억 + 투자 20억 = 포스트머니 120억. 투자자 지분 = 20/120 = 16.7%", en: "Company value before investment. E.g., Pre ₩10B + Investment ₩2B = Post ₩12B. Investor gets 2/12 = 16.7%" }, category: "valuation", relatedTermIds: ["post-money", "valuation-cap"], example: { ko: "프리머니 100억원에 20억원 투자 → 투자자 지분 16.7%", en: "₩10B pre-money + ₩2B investment → investor gets 16.7%" }, dangerLevel: "safe" },
  { id: "post-money", term: { ko: "포스트머니 밸류에이션", en: "Post-money Valuation" }, shortDef: { ko: "투자 후 회사 가치 = 프리머니 + 투자금", en: "Company value after investment = Pre-money + Investment" }, longDef: { ko: "투자금을 포함한 회사의 총 가치입니다. 포스트머니 = 프리머니 + 신규 투자금. 투자자 지분 = 투자금 / 포스트머니.", en: "Total company value including new investment. Post = Pre + New Investment." }, category: "valuation", relatedTermIds: ["pre-money"], dangerLevel: "safe" },
  { id: "valuation-cap", term: { ko: "밸류에이션 캡", en: "Valuation Cap" }, shortDef: { ko: "SAFE/CB에서 전환 시 최대 밸류에이션 상한", en: "Maximum valuation for SAFE/CB conversion" }, longDef: { ko: "SAFE나 CB가 주식으로 전환될 때, 회사 가치가 아무리 높아져도 이 상한선 이하에서 전환됩니다. 초기 투자자를 보호하는 장치.", en: "When converting SAFE/CB to equity, conversion happens at this cap maximum regardless of actual valuation." }, category: "valuation", relatedTermIds: ["safe", "cb", "discount"], dangerLevel: "safe" },
  { id: "discount", term: { ko: "디스카운트", en: "Discount" }, shortDef: { ko: "다음 라운드 가격 대비 할인율 (보통 15-25%)", en: "Discount to next round price (usually 15-25%)" }, longDef: { ko: "SAFE/CB 투자자가 다음 라운드 투자자보다 저렴하게 주식을 받는 비율. 20% 디스카운트면 다음 라운드 주가의 80%에 전환.", en: "Rate at which SAFE/CB investors get cheaper shares than next round. 20% discount = convert at 80% of next round price." }, category: "valuation", relatedTermIds: ["safe", "valuation-cap"], dangerLevel: "safe" },

  // ── 거버넌스 ──
  { id: "board-seat", term: { ko: "이사회 의석", en: "Board Seat" }, shortDef: { ko: "투자자가 이사회에 참여할 수 있는 권리", en: "Investor's right to join the board" }, longDef: { ko: "시리즈A 이후 대부분의 투자자가 이사회 의석을 요구합니다. 이사회 구성은 보통 창업자 2 + 투자자 1 + 사외이사 1 형태.", en: "Most investors require a board seat from Series A. Typical: 2 founders + 1 investor + 1 independent." }, category: "governance", relatedTermIds: ["protective-provisions"], dangerLevel: "caution" },
  { id: "protective-provisions", term: { ko: "방어적 조항 (보호조항)", en: "Protective Provisions" }, shortDef: { ko: "투자자 동의 없이 못 하는 행위 목록 (합병, 청산, 추가 발행 등)", en: "List of actions requiring investor consent" }, longDef: { ko: "투자 계약에 포함되는 조항으로, 신주 발행, 합병, 청산, 정관 변경 등 주요 의사결정 시 투자자 동의를 요구합니다. 한국에서는 주주간계약(SHA)에 포함.", en: "Contract clauses requiring investor consent for major decisions. Included in Korean SHA (Shareholders' Agreement)." }, category: "governance", relatedTermIds: ["board-seat", "drag-along"], dangerLevel: "caution" },
  { id: "drag-along", term: { ko: "동반매도 청구권 (Drag-along)", en: "Drag-along Rights" }, shortDef: { ko: "다수 주주가 매각 시 소수 주주도 함께 매각하게 하는 권리", en: "Majority can force minority to sell together" }, longDef: { ko: "회사 매각 시 다수 주주(보통 주요 투자자)가 동의하면 다른 주주들도 동일 조건으로 매각에 참여해야 합니다. 엑싯을 원활하게 만들지만 소수 주주에게 불리할 수 있습니다.", en: "When majority agrees to sell, minority must join on same terms. Facilitates exit but can disadvantage minority." }, category: "governance", relatedTermIds: ["tag-along", "protective-provisions"], dangerLevel: "danger" },
  { id: "tag-along", term: { ko: "동반매도 참여권 (Tag-along)", en: "Tag-along Rights" }, shortDef: { ko: "다수 주주가 매각 시 소수 주주도 참여할 수 있는 권리", en: "Minority can join majority's sale" }, longDef: { ko: "창업자나 다수 주주가 지분을 매각할 때, 소수 투자자도 동일 조건으로 함께 매각에 참여할 수 있는 권리. 소수 주주 보호 장치.", en: "When majority sells shares, minority can join on the same terms. Protects minority shareholders." }, category: "governance", relatedTermIds: ["drag-along"], dangerLevel: "safe" },

  // ── 엑싯/청산 ──
  { id: "liquidation-preference", term: { ko: "청산 우선권", en: "Liquidation Preference" }, shortDef: { ko: "회사 매각/청산 시 투자자가 먼저 투자금을 회수하는 권리", en: "Investor gets investment back first in liquidation/sale" }, longDef: { ko: "1x 비참가형: 투자금만큼 먼저 회수, 나머지를 보통주와 분배. 1x 참가형: 투자금 먼저 회수 + 나머지도 지분율만큼 추가 분배 (이중 취득). 한국에서는 1x 비참가형이 표준.", en: "1x Non-participating: get investment back first, rest split with common. 1x Participating: double-dip. Korean standard is 1x non-participating." }, category: "exit", relatedTermIds: ["rcps"], example: { ko: "30억 투자 + 1x 비참가형 → 회사 100억 매각 시: 투자자 30억 우선 회수 → 나머지 70억을 지분율로 분배", en: "₩3B investment + 1x non-participating → ₩10B exit: investor gets ₩3B first → remaining ₩7B split by equity" }, dangerLevel: "caution", koreaSpecific: true },
  { id: "anti-dilution-full", term: { ko: "풀래칫 희석방지 (Full Ratchet)", en: "Full Ratchet Anti-dilution" }, shortDef: { ko: "다운라운드 시 투자자 전환가를 새 라운드 가격으로 낮춤 — 매우 불리", en: "Down round → conversion price drops to new price — very unfavorable" }, longDef: { ko: "다운라운드가 발생하면 기존 투자자의 전환가가 새로운 낮은 가격으로 완전히 조정됩니다. 창업자 지분이 크게 희석됩니다. 한국에서는 Full Ratchet이 표준이라 주의 필요!", en: "If a down round occurs, existing investor's conversion price drops to the new lower price. Massively dilutes founders. Korea standard — beware!" }, category: "dilution", relatedTermIds: ["anti-dilution-wa", "rcps"], dangerLevel: "danger", koreaSpecific: true },
  { id: "anti-dilution-wa", term: { ko: "가중평균 희석방지 (Weighted Average)", en: "Weighted Average Anti-dilution" }, shortDef: { ko: "다운라운드 시 기존/신규 비율 고려하여 조정 — 더 공정", en: "Down round adjustment considering existing/new ratio — fairer" }, longDef: { ko: "다운라운드 시 기존 라운드와 새 라운드의 가중 평균으로 전환가를 조정합니다. Full Ratchet보다 창업자에게 유리합니다. 미국에서는 Weighted Average가 표준. 한국에서 이 조건을 협상하세요.", en: "Adjusts conversion price using weighted average of old and new rounds. More founder-friendly than Full Ratchet. US standard — negotiate for this in Korea." }, category: "dilution", relatedTermIds: ["anti-dilution-full"], dangerLevel: "caution" },

  // ── 지분 희석 ──
  { id: "esop", term: { ko: "ESOP / 스톡옵션", en: "ESOP / Stock Options" }, shortDef: { ko: "직원에게 미래 주식 매수 권리 부여. 한국: 연 5,000만원 비과세", en: "Right to buy shares at set price. Korea: ₩50M/yr tax-free" }, longDef: { ko: "스톡옵션 풀은 보통 전체 주식의 10-15%. 벤처기업 인증 후 부여하면 행사 시 연 5,000만원까지 비과세 혜택. 행사 가격은 부여 시점의 시가 이상으로 설정.", en: "Option pool usually 10-15% of total shares. Korean venture-certified companies: ₩50M/year tax-free on exercise." }, category: "dilution", relatedTermIds: ["common", "cap-table"], example: { ko: "직원 A에게 1% 스톡옵션 부여. 행사가 5,000원. 2년 후 주가 50,000원이면 (50,000-5,000)×주식수 = 차익", en: "Grant employee A 1% options at ₩5K strike. If stock = ₩50K in 2 years, gain = (50K-5K) × shares" }, dangerLevel: "safe", koreaSpecific: true },
  { id: "cap-table", term: { ko: "캡테이블 (주주명부)", en: "Cap Table" }, shortDef: { ko: "누가 몇 주를 얼마에 갖고 있는지 전체 현황표", en: "Complete table of who owns how many shares at what price" }, longDef: { ko: "회사의 전체 지분 구조를 보여주는 표. 보통주, 우선주, 스톡옵션 풀, 전환사채 등 모든 주식 관련 정보. 투자 라운드마다 업데이트 필수. ZUZU 같은 도구로 관리.", en: "Shows complete equity structure. Common, preferred, option pool, convertibles. Must update every round. Manage with ZUZU or Carta." }, category: "dilution", relatedTermIds: ["esop", "fully-diluted"], dangerLevel: "safe" },
  { id: "fully-diluted", term: { ko: "완전 희석 기준", en: "Fully Diluted Basis" }, shortDef: { ko: "스톡옵션 + 전환권 모두 행사했다고 가정한 총 주식 수", en: "Total shares assuming all options + conversions exercised" }, longDef: { ko: "투자자가 지분율을 계산할 때 사용하는 기준. 현재 발행 주식 + 미행사 스톡옵션 + 미전환 CB/RCPS 모두 포함. 실제 지분율보다 항상 낮게 나옵니다.", en: "Used by investors to calculate ownership. Includes all issued shares + unexercised options + unconverted debt." }, category: "dilution", relatedTermIds: ["cap-table", "esop"], dangerLevel: "safe" },
];

// ── 유틸리티 ──

export function getTermById(id: string): InvestmentTerm | undefined {
  return INVESTMENT_TERMS.find(t => t.id === id);
}

export function getTermsByCategory(category: TermCategory): InvestmentTerm[] {
  return INVESTMENT_TERMS.filter(t => t.category === category);
}

export function getKoreaSpecificTerms(): InvestmentTerm[] {
  return INVESTMENT_TERMS.filter(t => t.koreaSpecific);
}

export function getDangerousTerms(): InvestmentTerm[] {
  return INVESTMENT_TERMS.filter(t => t.dangerLevel === "danger" || t.dangerLevel === "caution");
}

export function searchTerms(query: string, language: "ko" | "en"): InvestmentTerm[] {
  const q = query.toLowerCase();
  return INVESTMENT_TERMS.filter(t => {
    const term = language === "ko" ? t.term.ko : t.term.en;
    const shortDef = language === "ko" ? t.shortDef.ko : t.shortDef.en;
    return term.toLowerCase().includes(q) || shortDef.toLowerCase().includes(q);
  });
}
