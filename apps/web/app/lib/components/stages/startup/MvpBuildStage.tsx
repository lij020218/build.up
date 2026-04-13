"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function MvpBuildStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const [mvpPage, setMvpPage] = useState(0);
  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);

  type MvpTool = { name: string; desc: string; url: string; free: boolean; tag?: string };
  const toolCard = (tool: MvpTool, color: string) => (
    <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: `${color}04`, border: `1px solid ${color}10`, textDecoration: "none", color: "inherit" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{tool.name}</span>
          {tool.free && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(5,150,105,0.08)", color: "#059669" }}>{ko ? "무료" : "Free"}</span>}
          {tool.tag && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: `${color}10`, color }}>{tool.tag}</span>}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginTop: "2px" }}>{tool.desc}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </a>
  );
  const toolSection = (toolsNode: React.ReactNode, count: number, toolsArr?: MvpTool[], color?: string) => {
    const c = color ?? "#7c3aed";
    const preview = toolsArr?.slice(0, 3) ?? [];
    const hasMore = count > 3;
    return (
      <div style={{ marginTop: "4px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {/* 항상 보이는 헤더 + 미리보기 3개 */}
        <div style={{ padding: "12px 14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{ko ? "추천 도구" : "Tools"}</span>
          </div>
          <div style={{ display: "grid", gap: "5px" }}>
            {preview.map(tool => toolCard(tool, c))}
          </div>
        </div>
        {/* 더보기 버튼 (3개 초과 시) */}
        {hasMore && (
          <div style={{ padding: "8px 14px 12px" }}>
            <button type="button" onClick={() => setMvpToolsOpen(!mvpToolsOpen)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
              padding: "7px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)",
              background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.4)",
            }}>
              {mvpToolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${count - 3}개 더보기` : `+${count - 3} more`)}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: mvpToolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {mvpToolsOpen && (
              <div style={{ display: "grid", gap: "5px", marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
                {toolsArr?.slice(3).map(tool => toolCard(tool, c))}
              </div>
            )}
          </div>
        )}
        {!hasMore && <div style={{ height: "12px" }} />}
      </div>
    );
  };

  const pages = ko ? [
    // PAGE 0 — 개요
    { title: "MVP 구축 로드맵", color: "#1d3557", content: (
      <div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>가장 좁은 핵심 워크플로 하나를 해결하는 제품을 출시하세요.</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Reid Hoffman: "첫 버전이 창피하지 않다면 너무 늦게 출시한 것이다." Stripe는 7줄의 코드로 시작했습니다. LinkedIn은 런칭 직전 팀이 "Contact Finder를 먼저 만들자"고 했지만 Hoffman은 거절했고 — 7년이 지나도 그 기능은 필요 없었습니다.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "14px" }}>
          {[{ num: "2~6주", label: "목표 기간" }, { num: "1개", label: "핵심 워크플로" }, { num: "10명", label: "첫 사용자" }, { num: "~16만원", label: "월 도구비" }].map(s => (
            <div key={s.label} style={{ padding: "10px", borderRadius: "10px", background: "rgba(29,53,87,0.03)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 780, color: "var(--primary)" }}>{s.num}</div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.35)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>7단계 순서</div>
        <div style={{ display: "grid", gap: "4px" }}>
          {["제품명 & 미션 정하기", "핵심 워크플로 & 화면 설계", "코드 아키텍처 & DB 설계", "백엔드 & 배포 인프라 선택", "AI와 함께 코딩하기", "디자인 & 브랜딩", "랜딩 페이지 & 론칭"].map((s, i) => (
            <div key={i} onClick={() => { setMvpPage(i + 1); setMvpToolsOpen(false); }} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", cursor: "pointer" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}
        </div>
        {/* 머스크 5단계 알고리즘 */}
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)", marginTop: "14px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>MVP 구축 원칙 — Elon Musk 5단계 알고리즘</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {[
              { step: "1", text: "요구사항을 의심하라", desc: "모든 기능에 '누가 요청했나?' 물어라. 이름 없는 요구사항은 삭제 대상" },
              { step: "2", text: "삭제하라", desc: "10%를 다시 안 넣었다면 덜 지운 것. 기능을 빼는 게 추가하는 것보다 어렵다" },
              { step: "3", text: "단순화하라", desc: "존재하지 말아야 할 것을 최적화하는 게 가장 흔한 실수" },
              { step: "4", text: "가속하라", desc: "2주 스프린트를 1주로. 단, 1~3단계를 먼저 통과한 것만" },
              { step: "5", text: "자동화는 마지막", desc: "혼란을 자동화하면 혼란만 빨라진다. 프로세스가 안정된 후에" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 0" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 640, color: "#0f172a" }}>{s.text}</span>
                  <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginLeft: "4px" }}>— {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )},
    // PAGE 1 — 제품명 & 미션
    { title: "제품명 & 미션 정하기", color: "#2563eb", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>앞서 정의한 문제를 제품의 이름과 미션으로 바꾸세요.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>문제 정의 단계에서 작성한 한 문장이 랜딩 페이지의 헤드라인이 되고, 투자자에게 하는 첫 마디가 되며, 팀원을 설득하는 무기가 됩니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["문제 정의를 기반으로 제품 미션 한 문장 확정", "제품명 후보 5~10개 + .com 도메인 확인", "30초 엘리베이터 피치 작성 (말로 연습해보세요)", "슬로건 1개 확정"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"나는 [타깃]을 위한 [핵심 기능] 제품을 만들려고 해. 1) 미션을 한 문장으로, 2) 슬로건 5개, 3) 제품명 후보 10개 (.com 도메인 가용성 고려), 4) 엘리베이터 피치 30초 버전을 만들어줘."</div>
        </div>
        {toolSection(null, 3, [{ name: "Namelix", desc: "AI 브랜드명 생성 + 도메인 확인. 선호도 학습", url: "https://namelix.com", free: true }, { name: "Looka", desc: "이름 + 로고 + 브랜드킷 한 번에. 한국어 지원", url: "https://looka.com", free: false, tag: "$20~" }, { name: "Claude / ChatGPT", desc: "미션, 슬로건, 엘리베이터 피치. 한국어 네이티브", url: "https://claude.ai", free: true, tag: "AI" }], "#2563eb")}
      </div>
    )},
    // PAGE 2 — 워크플로 & 화면 설계
    { title: "핵심 워크플로 & 화면 설계", color: "#7c3aed", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>기능 10개를 넣지 마세요. 핵심 워크플로 하나만 완벽하게.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>사용자가 가입한 후 "아, 이거 좋다"라고 느끼는 순간까지의 최소 동선을 설계하세요. 이 한 화면에서 가치를 느끼지 못하면 나머지는 의미가 없습니다. Paul Graham: "적은 사람이 절실하게 원하는 것을 선택하라."</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["사용자의 핵심 동작(Core Action) 1개 정의", "가입 → Core Action까지 화면 수를 최소화 (3~5 화면 이내)", "각 화면의 와이어프레임을 AI로 생성", "불필요한 화면이 있는지 검토 — 없애도 되면 없애세요"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]. 가입 → 핵심 가치 체험까지의 최소 화면 플로우를 설계해줘. 각 화면에 필요한 UI 요소와 사용자 액션을 정의하고, 불필요한 화면을 줄이는 방법을 제안해줘."</div>
        </div>
        {toolSection(null, 3, [{ name: "Google Stitch", desc: "텍스트 → UI 디자인 자동 생성. 월 350회 무료", url: "https://stitch.withgoogle.com", free: true, tag: "추천" }, { name: "v0 by Vercel", desc: "프롬프트 → 프로덕션 React+Tailwind 코드 출력", url: "https://v0.app", free: true, tag: "$5/mo" }, { name: "Figma + AI", desc: "화면 설계 업계 표준. Make 기능으로 AI 생성", url: "https://figma.com", free: true }], "#7c3aed")}
      </div>
    )},
    // PAGE 3 — 코드 아키텍처 & DB
    { title: "코드 아키텍처 & DB 설계", color: "#059669", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>코드를 한 줄 쓰기 전에 전체 구조를 먼저 잡으세요.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>DB 테이블, API, 페이지 구조, 인증 플로우. 이 설계를 건너뛰면 3주 후 "처음부터 다시 만들어야 하는" 상황이 옵니다. AI에게 요구사항을 주면 Mermaid 다이어그램으로 전체 아키텍처를 그려줍니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["필요한 DB 테이블과 관계 정의 (AI로 ERD 생성)", "API 엔드포인트 목록 작성", "페이지 구조(라우팅) 설계", "인증 플로우 결정 (이메일/소셜/매직링크)"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.04em", marginBottom: "6px" }}>AI 프롬프트</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]을 만들려고 해. Next.js + Supabase + Vercel 스택으로. 1) 필요한 DB 테이블과 관계, 2) API 라우트 목록, 3) 페이지 구조, 4) 인증 플로우를 설계해줘. Mermaid 다이어그램으로."</div>
        </div>
        {toolSection(null, 3, [{ name: "Eraser.io", desc: "AI 시스템 아키텍처 + ERD 다이어그램 자동 생성", url: "https://eraser.io", free: true }, { name: "Supabase Studio", desc: "비주얼 테이블 에디터 + 스키마 관리", url: "https://supabase.com", free: true }, { name: "dbdiagram.io", desc: "간단한 DSL로 DB 다이어그램 생성", url: "https://dbdiagram.io", free: true }], "#059669")}
      </div>
    )},
    // PAGE 4 — 백엔드 & 인프라
    { title: "백엔드 & 배포 인프라", color: "#d97706", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>2026년에 서버를 직접 관리하는 건 시간 낭비입니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>BaaS를 쓰면 인증, DB, 스토리지, 실시간 기능을 코드 몇 줄로 얻습니다. YC 스타트업의 50%+가 React, 25.6%가 Vercel을 사용합니다. 검증된 조합을 선택하세요.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["BaaS 선택 (Supabase 추천 — PostgreSQL + Auth + Storage)", "배포 플랫폼 선택 (Vercel 추천 — Next.js 제로 설정)", "프로젝트 초기 세팅 (npx create-next-app + Supabase 연결)", "환경변수 설정 + 배포 테스트"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 3, [{ name: "Supabase", desc: "PostgreSQL + 인증 + 스토리지 + 실시간. 무료 50K MAU", url: "https://supabase.com", free: true, tag: "DB 추천" }, { name: "Vercel", desc: "Next.js 배포 제로 설정. Edge Function 지원. 무료 시작", url: "https://vercel.com", free: true, tag: "배포 추천" }, { name: "Railway", desc: "사용량 기반 과금. 유휴 시 0원. 인디 해커 선호", url: "https://railway.app", free: false, tag: "$5/mo" }], "#d97706")}
      </div>
    )},
    // PAGE 5 — AI 코딩
    { title: "AI와 함께 코딩하기", color: "#dc2626", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>1인이 5인 팀의 생산성을 냅니다 — AI 도구가 게임을 바꿨습니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>Lovable로 프로토타입을 몇 시간 안에 만들고 → 사용자 반응 확인 → 반응이 좋으면 Cursor + Claude Code로 프로덕션을 2~4주에 완성. 프로토타입 코드를 프로덕션으로 옮기지 마세요 — 처음부터 깨끗하게 다시 짜는 게 더 빠릅니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["Lovable/Bolt로 작동하는 프로토타입 만들기 (1~2일)", "프로토타입을 5~10명에게 보여주고 반응 확인", "반응이 좋으면 Cursor + Claude Code로 프로덕션 시작", "shadcn/ui 컴포넌트로 UI 구축 + Supabase DB 연결", "매일 배포하고 매일 피드백 받기"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 5, [{ name: "Cursor", desc: "AI 코딩 속도 최강. VS Code 포크. 인라인 편집 + 채팅", url: "https://cursor.com", free: false, tag: "속도 $20/mo" }, { name: "Claude Code", desc: "코드 품질 최강. 토큰 5.5배 절약. 터미널 + IDE 통합", url: "https://claude.ai/code", free: false, tag: "품질 $20/mo" }, { name: "Lovable", desc: "비개발자도 OK. 채팅으로 풀스택 앱 생성. 원클릭 배포", url: "https://lovable.dev", free: true, tag: "프로토타입" }, { name: "Bolt.new", desc: "브라우저에서 즉시 코딩. 설치 불필요. 무료 1M토큰/월", url: "https://bolt.new", free: true }, { name: "GitHub Copilot", desc: "인라인 자동완성 최고. 2,000만+ 유저. 무료 플랜 있음", url: "https://github.com/features/copilot", free: true, tag: "$10/mo" }], "#dc2626")}
      </div>
    )},
    // PAGE 6 — 디자인 & 브랜딩
    { title: "디자인 & 브랜딩", color: "#0891b2", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>MVP라도 디자인이 후지면 사용자는 떠납니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>사용자는 제품의 가치를 기능이 아니라 "느낌"으로 먼저 판단합니다. shadcn/ui를 쓰면 Apple 수준의 컴포넌트를 무료로 얻고, 로고는 AI로 1시간 안에 만들 수 있습니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["shadcn/ui 컴포넌트로 전체 UI 통일", "Looka 또는 Canva로 로고 + 파비콘 제작", "브랜드 컬러 2~3색 확정 (primary + accent)", "OG 이미지 (소셜 공유용) 제작"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0891b2", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 4, [{ name: "shadcn/ui", desc: "2026 표준 컴포넌트 라이브러리. Tailwind + Radix. 코드 소유", url: "https://ui.shadcn.com", free: true, tag: "필수" }, { name: "Looka", desc: "AI 로고 + 브랜드킷 한 번에. 한국어 지원", url: "https://looka.com", free: false, tag: "$20~" }, { name: "Canva AI", desc: "마케팅 에셋 만능. 한국어 UI. 무료 티어 충분", url: "https://canva.com", free: true, tag: "한국어" }, { name: "Aceternity UI", desc: "애니메이션 랜딩 컴포넌트. SaaS 페이지에 최적", url: "https://ui.aceternity.com", free: true }], "#0891b2")}
      </div>
    )},
    // PAGE 7 — 랜딩 & 론칭
    { title: "랜딩 페이지 & 론칭", color: "#1d3557", content: (
      <div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>랜딩 페이지는 24시간 작동하는 영업사원입니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>헤드라인(무엇), 서브헤딩(왜), 스크린샷(어떻게), CTA(시작) — 이 4가지만 있으면 됩니다. 그리고 Stripe처럼 "노트북 줘봐"라며 직접 설치해주세요.</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(29,53,87,0.03)", borderLeft: "3px solid rgba(29,53,87,0.15)", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6, fontStyle: "italic" }}>"스타트업이 이륙하는 건 저절로 되는 게 아니라 창업자가 밀어붙여서다. Airbnb는 뉴욕에 매주 날아가 집주인을 직접 만났고, 그 30일의 노력이 성공과 실패를 갈랐다." — Paul Graham</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["랜딩 페이지 제작 (헤드라인 + 스크린샷 + CTA)", "Product Hunt 론칭 준비 (론칭 데이 전략)", "첫 10명 사용자를 직접 찾아가서 모으기", "SEO 기본 설정 (메타 태그, OG 이미지, sitemap)"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1d3557", flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 4, [{ name: "Framer", desc: "디자이너급 랜딩 페이지. AI 레이아웃 자동 생성", url: "https://framer.com", free: false, tag: "$10/mo" }, { name: "Product Hunt", desc: "글로벌 론칭 플랫폼 #1. 론칭 데이 전략 준비 필수", url: "https://producthunt.com", free: true }, { name: "Hacker News (Show HN)", desc: "기술 커뮤니티 피드백. 폭발적 트래픽 가능", url: "https://news.ycombinator.com", free: true }, { name: "CodeRabbit", desc: "AI 코드 리뷰. GitHub PR 자동 리뷰. 무료", url: "https://coderabbit.ai", free: true, tag: "QA" }], "#1d3557")}
      </div>
    )},
  ] : [
    // English pages — same structure, shorter
    { title: "MVP Build Roadmap", color: "#1d3557", content: (<div><div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>Ship a product that solves one core workflow in 2-6 weeks.</div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7 }}>Reid Hoffman: "If you're not embarrassed by the first version, you've launched too late." Navigate through 7 steps using the arrows below.</div></div>) },
    { title: "Name & Mission", color: "#2563eb", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Explain what your product does in one sentence. This becomes your landing page headline, your first pitch to investors, and your team's north star.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Namelix", desc: "AI brand names + domain check", url: "https://namelix.com", free: true }, "#2563eb")}{toolCard({ name: "Claude / ChatGPT", desc: "Mission, slogan, elevator pitch", url: "https://claude.ai", free: true, tag: "AI" }, "#2563eb")}</div></div>) },
    { title: "Core Workflow & Wireframe", color: "#7c3aed", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the minimum path from signup to "aha moment." One workflow, perfect. Paul Graham: "Build something a small number of people want a large amount."</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Google Stitch", desc: "Text → UI design. 350 free/mo", url: "https://stitch.withgoogle.com", free: true, tag: "Best" }, "#7c3aed")}{toolCard({ name: "v0 by Vercel", desc: "Prompt → production React+Tailwind", url: "https://v0.app", free: true }, "#7c3aed")}</div></div>) },
    { title: "Architecture & DB Design", color: "#059669", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the full structure before writing code. DB tables, API routes, page structure, auth flow. Skip this and you'll rebuild from scratch later.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Eraser.io", desc: "AI architecture + ERD diagrams", url: "https://eraser.io", free: true }, "#059669")}{toolCard({ name: "Supabase Studio", desc: "Visual table editor + schema", url: "https://supabase.com", free: true }, "#059669")}</div></div>) },
    { title: "Backend & Deployment", color: "#d97706", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Don't manage servers. Use BaaS for auth, DB, storage in a few lines. 50%+ of YC startups use React, 25.6% deploy on Vercel.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Supabase", desc: "PostgreSQL + Auth + Storage. Free 50K MAU", url: "https://supabase.com", free: true, tag: "DB" }, "#d97706")}{toolCard({ name: "Vercel", desc: "Zero-config Next.js deploy", url: "https://vercel.com", free: true, tag: "Deploy" }, "#d97706")}</div></div>) },
    { title: "Code with AI", color: "#dc2626", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>One person with AI tools = 5-person team. Strategy: Lovable for prototype (hours) → Cursor + Claude Code for production (2-4 weeks).</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Cursor", desc: "Fastest AI coding. VS Code fork", url: "https://cursor.com", free: false, tag: "Speed $20/mo" }, "#dc2626")}{toolCard({ name: "Claude Code", desc: "Best quality. 5.5x fewer tokens", url: "https://claude.ai/code", free: false, tag: "Quality" }, "#dc2626")}{toolCard({ name: "Lovable", desc: "Chat-to-app. One-click deploy", url: "https://lovable.dev", free: true, tag: "Prototype" }, "#dc2626")}</div></div>) },
    { title: "Design & Branding", color: "#0891b2", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Even an MVP needs good design. Users judge by feel first. shadcn/ui gives Apple-level components for free.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "shadcn/ui", desc: "2026 standard. Tailwind + Radix", url: "https://ui.shadcn.com", free: true, tag: "Must" }, "#0891b2")}{toolCard({ name: "Looka", desc: "AI logo + brand kit", url: "https://looka.com", free: false, tag: "$20~" }, "#0891b2")}</div></div>) },
    { title: "Landing & Launch", color: "#1d3557", content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>"Startups take off because founders make them take off." — Paul Graham. Landing page = 24/7 salesperson. Headline + Screenshot + CTA.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Framer", desc: "Designer-quality landing page", url: "https://framer.com", free: false, tag: "$10/mo" }, "#1d3557")}{toolCard({ name: "Product Hunt", desc: "Global launch platform #1", url: "https://producthunt.com", free: true }, "#1d3557")}</div></div>) },
  ];

  const page = pages[mvpPage] ?? pages[0];
  const total = pages.length;

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ borderRadius: "20px", border: `1px solid ${page.color}15`, background: `linear-gradient(180deg, ${page.color}04 0%, rgba(255,255,255,0.98) 100%)`, overflow: "hidden" }}>
        {/* 헤더 */}
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            {mvpPage > 0 && <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: page.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{mvpPage}</div>}
            <span style={{ fontSize: "11px", fontWeight: 700, color: page.color, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {mvpPage === 0 ? (ko ? "개요" : "Overview") : `Step ${mvpPage} / ${total - 1}`}
            </span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{page.title}</div>
        </div>
        {/* 콘텐츠 */}
        <div style={{ padding: "0 22px 20px" }}>{page.content}</div>
      </div>

      {/* 페이지네이션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
        <button type="button" onClick={() => { setMvpPage(Math.max(0, mvpPage - 1)); setMvpToolsOpen(false); }} disabled={mvpPage === 0}
          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: mvpPage === 0 ? "rgba(0,0,0,0.02)" : "white", color: mvpPage === 0 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: mvpPage === 0 ? "default" : "pointer" }}>
          ← {ko ? "이전" : "Prev"}
        </button>
        <div style={{ display: "flex", gap: "5px" }}>
          {pages.map((_, i) => (
            <div key={i} onClick={() => { setMvpPage(i); setMvpToolsOpen(false); }} style={{ width: i === mvpPage ? "20px" : "8px", height: "8px", borderRadius: "100px", background: i === mvpPage ? "var(--primary)" : "rgba(0,0,0,0.1)", cursor: "pointer", transition: "all 0.2s ease" }} />
          ))}
        </div>
        <button type="button" onClick={() => { setMvpPage(Math.min(total - 1, mvpPage + 1)); setMvpToolsOpen(false); }} disabled={mvpPage === total - 1}
          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: mvpPage === total - 1 ? "rgba(0,0,0,0.02)" : "white", color: mvpPage === total - 1 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: mvpPage === total - 1 ? "default" : "pointer" }}>
          {ko ? "다음" : "Next"} →
        </button>
      </div>
    </div>
  );
}
