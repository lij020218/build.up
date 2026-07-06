"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";

export function OnlineMarketingStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "SEO + 첫 광고 + 초기 리뷰 — 노출·전환·신뢰 3축을 동시에"
            : "SEO + first ads + early reviews — exposure, conversion, trust at once",
          detail: ko
            ? "네이버 쇼핑 상품명·태그 최적화로 무료 노출, 첫 광고 캠페인은 ROAS 200% 목표로 작게 시작, 초기 리뷰는 지인·체험단·낮은 가격 신규 할인 3종 병행."
            : "Optimize Naver Shopping titles/tags for free exposure, start the first ad campaign small at a 200% ROAS target, and seed early reviews via friends, testers, and new-customer discounts.",
        }}
      />
      {/* 네이버 SEO */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(3,199,90,0.1)", background: "linear-gradient(180deg, rgba(3,199,90,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#03C75A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700 }}>N</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "네이버 쇼핑 SEO 최적화" : "Naver Shopping SEO"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{ko ? "온라인 매출의 60%+가 검색에서 시작됩니다. 첫 1개월이 노출 순위를 결정합니다." : "60%+ of online sales start from search. The first month determines your ranking."}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
          {(ko ? [
            { title: "상품명 = 핵심 키워드 + 속성", detail: "\"여성 린넨 원피스 여름 A라인 프리사이즈\" — 검색어를 순서대로 넣으세요. 브랜드명은 앞에" },
            { title: "카테고리 정확히 매칭", detail: "네이버 쇼핑 카테고리와 상품이 불일치하면 노출 자체가 안 됩니다" },
            { title: "상세페이지 텍스트 최적화", detail: "이미지만 넣지 마세요. 검색 크롤러는 텍스트를 읽습니다. 핵심 키워드를 본문에 포함" },
            { title: "태그 10개 모두 채우기", detail: "스마트스토어 태그는 최대 10개만 등록됨(초과 입력해도 10개까지) — 검색 노출에 직접 영향, 관련 키워드로 10개 꽉 채우기" },
            { title: "최신성 점수 — 신상품 등록 주기", detail: "네이버는 신상품을 우대합니다. 주 2-3회 신규 상품 등록이 이상적" },
          ] : [
            { title: "Product name = keywords + attributes", detail: "Put search terms in order. Brand name first" },
            { title: "Category matching", detail: "Mismatched category = zero exposure" },
            { title: "Detail page text optimization", detail: "Don't rely on images only. Crawlers read text" },
            { title: "Fill all 20 tags", detail: "Tags directly affect search ranking" },
            { title: "Freshness score — new product frequency", detail: "Naver favors new products. 2-3 per week ideal" },
          ]).map(s => (
            <div key={s.title} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(3,199,90,0.03)", border: "1px solid rgba(3,199,90,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 첫 광고 캠페인 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "첫 광고 캠페인 세팅" : "First Ad Campaign Setup"}</div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{ko ? "초기 2주는 데이터 수집 기간. 일 5,000~10,000원부터 시작하세요." : "First 2 weeks are data collection. Start at ₩5-10K/day."}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
          {(ko ? [
            { platform: "네이버 쇼핑 검색광고", budget: "일 5,000~10,000원", desc: "구매 의도가 가장 높은 채널. CPC 300~800원. ROAS 확인 후 증액", color: "#03C75A", url: "https://searchad.naver.com" },
            { platform: "인스타그램 광고", budget: "일 10,000~20,000원", desc: "비주얼 제품에 효과적. 25-34세 여성 타깃. 릴스 광고 CTR 최고", color: "#E4405F", url: "https://business.instagram.com" },
            { platform: "쿠팡 CPC 광고", budget: "일 5,000~15,000원", desc: "쿠팡 내 검색 결과 상단 노출. 쿠팡 판매 시 필수", color: "#1460F3", url: "https://wing.coupang.com" },
          ] : [
            { platform: "Naver Shopping Ads", budget: "₩5-10K/day", desc: "Highest purchase intent. CPC ₩300-800", color: "#03C75A", url: "https://searchad.naver.com" },
            { platform: "Instagram Ads", budget: "₩10-20K/day", desc: "Great for visual products. Reels ads best CTR", color: "#E4405F", url: "https://business.instagram.com" },
            { platform: "Coupang CPC Ads", budget: "₩5-15K/day", desc: "Top of Coupang search. Essential for Coupang sellers", color: "#1460F3", url: "https://wing.coupang.com" },
          ]).map(p => (
            <a key={p.platform} href={p.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "12px", padding: "14px", borderRadius: "14px", border: `1px solid ${p.color}15`, background: `${p.color}03`, textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}10`, color: p.color, fontSize: "10px", fontWeight: 650, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{p.budget}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{p.platform}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{p.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          ))}
        </div>
      </div>

      {/* 리뷰 전략 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "8px" }}>{ko ? "초기 리뷰 확보 전략" : "Early Review Strategy"}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "10px" }}>{ko ? "리뷰 0개 상품은 클릭률이 80% 낮습니다. 첫 10개 리뷰가 결정적입니다." : "Products with 0 reviews get 80% fewer clicks. First 10 reviews are decisive."}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { method: "체험단 모집 (소규모)", detail: "쇼핑·블로그 체험단 3~5명 병행. 스마트스토어 실구매 포토·동영상 리뷰가 쇼핑 상위노출·전환에 더 직접적 (블로그 리뷰도 동시 확보). 비용: 제품 원가 + 배송비", tip: "무료" },
            { method: "포토리뷰 이벤트", detail: "구매 고객에게 포토리뷰 작성 시 500~1,000원 적립금. 전환율 대비 가장 효율적", tip: "₩500/건" },
            { method: "지인·친구 초기 구매", detail: "솔직하게 부탁하세요. 조작 리뷰는 네이버 패널티 대상. 실제 구매+배송 필수", tip: "실비" },
          ] : [
            { method: "Micro influencer trials", detail: "3-5 bloggers. Cost: product + shipping. Blog reviews boost search", tip: "Free" },
            { method: "Photo review event", detail: "₩500-1K store credit for photo reviews. Most efficient conversion", tip: "₩500/ea" },
            { method: "Friends & family first buys", detail: "Be honest. Fake reviews get penalized. Real purchase required", tip: "Cost" },
          ]).map(r => (
            <div key={r.method} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{r.method}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{r.detail}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(25,25,112,0.08)", color: "#191970", whiteSpace: "nowrap" as const, flexShrink: 0, alignSelf: "flex-start" }}>{r.tip}</span>
            </div>
          ))}
        </div>
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="첫 달 점검"
        doneItemsKo={[
          { label: "1. 채널 우선순위", detail: "네이버 검색·인스타·카카오·블로그 4축 중 업종 적합 2~3개 선택" },
          { label: "2. 광고 예산 배분", detail: "유료 광고 vs 콘텐츠 마케팅 비중 결정 + ROAS 목표 설정" },
          { label: "3. 콘텐츠 일정", detail: "주간 SNS 포스팅 + 리뷰 유도 + 인플루언서 협업 일정 셋업" },
          { label: "4. 측정 지표 설정", detail: "방문자·전환율·CTR·CAC·LTV 5개 지표 대시보드 셋업" },
        ]}
        verifyItemsKo={[
          "광고 표현 — 「최저가」 「최고」 「유일」 등 비교 광고 객관 근거 필수, 위반 시 표시광고법 과징금",
          "인플루언서 협업 — 「유료 광고」 표시 의무 (#광고 #협찬), 미표시 시 공정위 과징금 + 인플루언서도 책임",
          "네이버 검색광고 — 키워드 입찰 단가 인상 추세, ROAS 200% 미만이면 즉시 중단·재구성",
          "쿠팡 광고 — 노출 위치별 효율 차이 큼, 카테고리 검색·상세 페이지 광고 분리 측정",
          "리뷰 — 자작·가족·지인 리뷰 적발 시 플랫폼 영구정지 + 표시광고법 위반 (10만원 이하 과태료/건)",
          "개인정보 — 마케팅 활용 동의 별도 수집 의무, 위반 시 개인정보보호법 과징금 (매출 3% 이내)",
        ]}
        nextSummaryKo="채널·예산·콘텐츠·측정 4축 셋업 완료 → 첫 달 점검 단계로 진입"
      />
    </div>
  );
}
