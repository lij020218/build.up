"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function BizRegistrationPanel() {
  const d = useDashboardCtx();
  const { language, storeName, setStoreName, cpaDecision, setCpaDecision, industryCategoryId } = d;
  const isStartup = industryCategoryId === "startup-tech";

  const bizInfoStyle = { display: "flex", flexDirection: "column" as const, gap: "6px" };
  const bizCardStyle = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
  const bizSectionTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
  const bizTag = (color: string) => ({ display: "inline-block", fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${color}18`, color });
  const infoRow = { display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 as const, color: "rgba(0,0,0,0.7)" };
  const dot = <span style={{ flexShrink: 0, marginTop: "6px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />;

  const bizCodes: Record<string, { code: string; name: string; note: string }[]> = {
    food: [
      { code: "522111", name: "한식 음식점업", note: "찌개·구이·한정식 등 일반 한식" },
      { code: "522121", name: "외국식 음식점업", note: "이탈리안·일식·중식 등" },
      { code: "522141", name: "기타 간이음식점업", note: "분식·포장마차·푸드트럭" },
    ],
    "cafe-dessert": [
      { code: "522220", name: "커피 음료점업", note: "카페·테이크아웃 커피 전문점" },
      { code: "522290", name: "기타 비알코올음료점업", note: "버블티·착즙주스·스무디" },
      { code: "522210", name: "제과점업", note: "베이커리·디저트 카페" },
    ],
    beauty: [
      { code: "961101", name: "미용업", note: "헤어 커트·펌·염색" },
      { code: "961201", name: "피부미용업", note: "피부관리·반영구·속눈썹" },
      { code: "961301", name: "기타 미용업", note: "네일·화장·종합 뷰티" },
    ],
    "online-digital": [
      { code: "479901", name: "전자상거래 소매업", note: "스마트스토어·쿠팡 판매" },
      { code: "749901", name: "기타 전문 서비스업", note: "디지털 콘텐츠·컨설팅" },
    ],
    retail: [
      { code: "523110", name: "종합소매업", note: "편의점·슈퍼마켓·잡화점" },
      { code: "524110", name: "섬유·의복 소매업", note: "의류·패션 소매" },
      { code: "524900", name: "기타 상품 전문 소매업", note: "생활잡화·건강식품 등" },
    ],
    fitness: [
      { code: "912110", name: "체육시설 운영업", note: "헬스장·필라테스·요가" },
      { code: "912120", name: "골프장 운영업", note: "스크린골프·연습장" },
    ],
    education: [
      { code: "856101", name: "일반 교과학원", note: "학원·과외 교습소" },
      { code: "856901", name: "기타 기술 및 직업훈련 학원", note: "코딩·어학·직업 교육" },
    ],
    pet: [
      { code: "462420", name: "애완동물 및 관련용품 소매업", note: "펫샵·용품 판매" },
      { code: "961909", name: "기타 개인 서비스업", note: "펫 미용·호텔·돌봄" },
    ],
    "living-service": [
      { code: "961020", name: "세탁업", note: "세탁·빨래방" },
      { code: "952100", name: "전기·전자제품 수리업", note: "기기 수리" },
    ],
    space: [
      { code: "551001", name: "숙박업", note: "게스트하우스·민박" },
      { code: "681099", name: "기타 부동산 임대업", note: "공유오피스·스터디카페" },
    ],
    "startup-tech": [
      { code: "620201", name: "컴퓨터 프로그래밍 서비스업", note: "소프트웨어 개발·SaaS" },
      { code: "620209", name: "기타 정보기술 서비스업", note: "AI·핀테크·플랫폼" },
    ],
  };
  const codes = bizCodes[industryCategoryId] ?? bizCodes["food"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

      {/* ── 스타트업: 법인 등기 확인 안내 ── */}
      {isStartup && (
        <div style={{ borderRadius: "16px", border: "1px solid rgba(37,99,235,0.08)", background: "rgba(37,99,235,0.02)", padding: "16px 18px" }}>
          <div style={{ fontSize: "14px", fontWeight: 680, color: "#2563eb", marginBottom: "6px" }}>{language === "ko" ? "이 단계에서 확인할 것" : "What to check here"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6 }}>
            {language === "ko"
              ? "사업자등록, 과세유형, 통장 개설은 6단계에서 이미 완료했습니다. 이 단계에서는 세무사 선임 여부만 최종 결정하면 됩니다."
              : "Business registration, tax type, and bank account were completed in Stage 6. Here you only need to finalize your tax accountant decision."}
          </div>
        </div>
      )}

      {/* ── 상호명 입력 (오프라인 전용) ── */}
      {!isStartup && <div style={bizInfoStyle}>
        <div style={bizSectionTitle}>{language === "ko" ? "상호명 (가게 이름)" : "Store name"}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>
          {language === "ko"
            ? "사업자등록증에 기재할 상호명을 입력하세요. 나중에 수정할 수 있습니다."
            : "Enter the name as it will appear on your business registration. You can change it later."}
        </div>
        <input
          type="text"
          value={storeName}
          onChange={(e) => {
            setStoreName(e.target.value);
            localStorage.setItem("storeName", e.target.value);
          }}
          placeholder={language === "ko" ? "예: 홍길동 떡볶이, 카페 온도" : "e.g. Happy Café, Sunrise Bakery"}
          style={{ border: storeName ? "1.5px solid #34c759" : "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none", background: "rgba(255,255,255,0.8)", width: "100%", boxSizing: "border-box" as const }}
        />
        {storeName && (
          <div style={{ fontSize: "12px", color: "#34c759", fontWeight: 600, marginTop: "4px" }}>
            {language === "ko" ? `저장됨: "${storeName}"` : `Saved: "${storeName}"`}
          </div>
        )}
      </div>}

      {/* ── 사업자등록 방법 (스타트업은 6단계에서 완료) ── */}
      {!isStartup && <div style={bizInfoStyle}>
        <div style={bizSectionTitle}>{language === "ko" ? "사업자등록 방법 선택" : "How to register"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            {
              title: language === "ko" ? "홈택스 온라인" : "Hometax (online)",
              badge: language === "ko" ? "추천" : "Recommended",
              color: "#34c759",
              points: language === "ko"
                ? ["24시간 신청 가능", "처리 기간 2~3일", "공동인증서(구 공인인증서) 필요", "국세청 홈택스 → 신청/제출 → 사업자등록신청"]
                : ["24/7 submission", "2–3 day processing", "Requires joint certificate", "Hometax → Application → Business Registration"]
            },
            {
              title: language === "ko" ? "세무서 직접 방문" : "Tax office visit",
              badge: language === "ko" ? "즉시 처리" : "Same-day",
              color: "#007aff",
              points: language === "ko"
                ? ["처리 당일 완료", "복잡한 인허가 업종 추천", "준비물: 신분증 + 임대차계약서", "평일 09:00~18:00, 주민등록등본 선택"]
                : ["Same-day completion", "Best for complex permits", "Bring: ID + lease contract", "Weekdays 09:00–18:00"]
            }
          ].map((m) => (
            <div key={m.title} style={{ ...bizCardStyle, position: "relative" as const }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{m.title}</span>
                <span style={bizTag(m.color)}>{m.badge}</span>
              </div>
              {m.points.map((p) => (
                <div key={p} style={{ ...infoRow, marginBottom: "3px" }}>{dot}<span>{p}</span></div>
              ))}
            </div>
          ))}
        </div>
      </div>}

      {/* ── 업종코드 & 과세유형 (스타트업은 6단계에서 완료) ── */}
      {!isStartup && <div style={bizInfoStyle}>
        <div style={bizSectionTitle}>{language === "ko" ? "업종코드 & 과세유형" : "Business code & tax type"}</div>
        <div style={bizCardStyle}>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
            {language === "ko" ? "업종에 맞는 코드를 선택하세요. 잘 모르면 세무서 직원에게 물어보면 됩니다." : "Choose the code that best fits your business."}
          </div>
          {codes.map((c) => (
            <div key={c.code} style={{ display: "flex", gap: "8px", padding: "7px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#007aff", flexShrink: 0, paddingTop: "1px" }}>{c.code}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{c.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
          {[
            {
              type: language === "ko" ? "간이과세자" : "Simplified VAT",
              cond: language === "ko" ? "연 매출 1억 400만원 미만 예상" : "Est. annual revenue < ₩104M",
              pros: language === "ko" ? "세금계산서 발행 의무 없음 · 부가세 부담 낮음" : "No invoice issuance · lower VAT burden",
              color: "#34c759"
            },
            {
              type: language === "ko" ? "일반과세자" : "General VAT",
              cond: language === "ko" ? "연 매출 1억 400만원 이상 or 매입세액 환급 필요 시" : "Revenue ≥ ₩104M or need input VAT refund",
              pros: language === "ko" ? "매입세금계산서 전액 환급 가능 · 기업 거래 유리" : "Full input VAT refund · better for B2B",
              color: "#007aff"
            }
          ].map((v) => (
            <div key={v.type} style={bizCardStyle}>
              <div style={{ ...bizTag(v.color), marginBottom: "6px" }}>{v.type}</div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{v.cond}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{v.pros}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* ── 사업용 통장 (스타트업은 6단계에서 법인통장 안내 완료) ── */}
      {!isStartup && (
      <div style={bizInfoStyle}>
        <div style={bizSectionTitle}>{language === "ko" ? "사업용 통장 개설" : "Business bank account"}</div>
        <div style={{ ...bizCardStyle, display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="8" cy="8" r="6.5" stroke="#ff9f0a" strokeWidth="1.4"/><path d="M8 5.5V8.5M8 10v.5" stroke="#ff9f0a" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
            {language === "ko"
              ? "개인 통장과 사업 통장은 반드시 분리하세요. 세무조사 시 사업 비용 입증이 안 되면 전부 과세 대상이 됩니다."
              : "Keep personal and business accounts strictly separate. Mixed accounts make it impossible to prove deductible expenses during tax audits."}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(language === "ko" ? [
            { bank: "기업은행 IBK", desc: "소상공인 특화 상품 다수 · 정책자금 연계 유리 · 전국 지점", badge: "정책자금 연계" },
            { bank: "카카오뱅크 사업자", desc: "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", badge: "비대면 추천" },
            { bank: "우리은행 위비기업", desc: "지역 네트워크 강점 · 세무사·노무사 무료 상담 서비스 포함", badge: "상담 서비스" },
          ] : [
            { bank: "IBK Industrial Bank", desc: "Best for policy fund connections · many SME products", badge: "Policy funds" },
            { bank: "KakaoBank Business", desc: "Instant non-face-to-face opening · zero fees · easy app management", badge: "Digital" },
            { bank: "Woori Bank", desc: "Free tax/labor consultation included · regional network", badge: "Consulting" },
          ]).map((b) => (
            <div key={b.bank} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{b.bank}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{b.desc}</div>
              </div>
              <span style={bizTag("#007aff")}>{b.badge}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)", padding: "4px 2px" }}>
          {language === "ko" ? "준비물: 사업자등록증 원본, 대표자 신분증, 도장(선택)" : "Bring: business registration certificate, ID, seal (optional)"}
        </div>
      </div>
      )}

      {/* ── 세무대리인 결정 — 실제 선택 (스타트업은 6단계에서 세무사 안내했지만, 최종 선택은 여기서) ── */}
      <div style={bizInfoStyle}>
        <div style={bizSectionTitle}>{language === "ko" ? "세무 처리 방식 선택" : "How will you handle taxes?"}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>
          {language === "ko"
            ? "어떤 선택이든 유효합니다. 아래에서 본인 상황에 맞는 방식을 선택하면 완료 처리됩니다."
            : "Both are valid. Choose one based on your situation to mark this step done."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            {
              id: "self" as const,
              title: language === "ko" ? "직접 신고로 진행" : "Self-file",
              desc: language === "ko" ? "홈택스로 부가세·종합소득세 직접 신고. 직원 없고 매출이 단순할 때 적합합니다." : "File VAT and income tax yourself via Hometax. Works well if you have no staff and simple revenue.",
              when: language === "ko" ? "적합한 경우: 직원 없음 · 연 매출 3,000만원 미만 · 업종 단순" : "Good if: no employees · revenue < ₩30M · simple business",
              color: "#34c759"
            },
            {
              id: "cpa" as const,
              title: language === "ko" ? "세무사(세무대리인) 선임 예정" : "Hire a tax accountant",
              desc: language === "ko" ? "기장료 월 5~15만원. 원천세·4대보험·부가세·소득세 전부 위임합니다." : "Monthly ₩50K–150K. Delegate payroll tax, VAT, and income tax filing.",
              when: language === "ko" ? "권장 경우: 직원 1명 이상 · 매출 5,000만원+ 예상 · 정책자금 신청 예정" : "Recommended if: any employees · revenue > ₩50M · applying for policy funds",
              color: "#007aff"
            }
          ].map((opt) => {
            const selected = cpaDecision === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const next = selected ? null : opt.id;
                  setCpaDecision(next);
                  if (next) localStorage.setItem("cpaDecision", next);
                  else localStorage.removeItem("cpaDecision");
                }}
                style={{
                  textAlign: "left" as const,
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: selected ? `1.5px solid ${opt.color}` : "1.5px solid rgba(0,0,0,0.08)",
                  background: selected ? `${opt.color}08` : "rgba(0,0,0,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: selected ? `4.5px solid ${opt.color}` : "1.5px solid rgba(0,0,0,0.2)",
                    flexShrink: 0, transition: "all 0.15s"
                  }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: selected ? opt.color : "inherit" }}>{opt.title}</span>
                </div>
                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.5, paddingLeft: "24px" }}>{opt.desc}</div>
                <div style={{ fontSize: "12px", color: selected ? opt.color : "var(--muted)", lineHeight: 1.4, paddingLeft: "24px", marginTop: "4px", fontWeight: selected ? 500 : 400 }}>{opt.when}</div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
