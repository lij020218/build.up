"use client";

import { useState } from "react";
import { Rocket, Code2, Sparkles } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { ModePathCard } from "./ModePathCard";
import { BuildMethodDialog, BuildMethodTrigger } from "./BuildMethodDialog";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "./StartupStageShell";
import { StageWrapup } from "../shared/StageWrapup";

export function MvpBuildStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const [mvpPage, setMvpPage] = useState(0);
  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);
  const [methodDialogTaskId, setMethodDialogTaskId] = useState<string | null>(null);

  type MvpTool = { name: string; desc: string; url: string; free: boolean; tag?: string };
  const toolCard = (tool: MvpTool, color: string) => (
    <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: `${color}04`, border: `1px solid ${color}10`, textDecoration: "none", color: "inherit" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{tool.name}</span>
          {tool.free && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: MIDNIGHT_BORDER, color: MIDNIGHT }}>{ko ? "무료" : "Free"}</span>}
          {tool.tag && <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: `${color}10`, color }}>{tool.tag}</span>}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginTop: "2px" }}>{tool.desc}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </a>
  );
  const toolSection = (toolsNode: React.ReactNode, count: number, toolsArr?: MvpTool[], color?: string) => {
    const c = color ?? MIDNIGHT;
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
    { title: "MVP 구축 로드맵", color: MIDNIGHT, content: (
      <div>
        {/* 2026-05-12: 실리콘밸리 2026 vertical AI 유니콘 쇼케이스 — 동기부여 앵커.
            사장님이 본인 vertical의 *목표 모델* 식별 → 좁은 workflow + 결과 기반 과금 = 강한 lock-in. */}
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`, color: "#fff", marginBottom: "14px", boxShadow: "0 6px 18px rgba(25,25,112,0.28)" }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "6px" }}>
            🌉 실리콘밸리 2026.5 — vertical AI agent 유니콘
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.45, marginBottom: "8px" }}>
            좁은 workflow 1개 + 결과 기반 과금 = $15B 회사
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" }}>
            {[
              { name: "Sierra", val: "$15.8B", arr: "ARR $150M", role: "고객지원 AI 에이전트" },
              { name: "Decagon", val: "$4.5B", arr: "Series D $250M", role: "고객지원 AI" },
              { name: "Cresta", val: "$1.6B+", arr: "ARR $100M", role: "콜센터 AI 에이전트" },
            ].map(c => (
              <div key={c.name} style={{ padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.85, marginBottom: "1px" }}>{c.name}</div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}>{c.val}</div>
                <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{c.arr}</div>
                <div style={{ fontSize: "10px", opacity: 0.7, lineHeight: 1.4, marginTop: "3px" }}>{c.role}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11.5px", lineHeight: 1.55, opacity: 0.85 }}>
            <strong>패턴</strong>: 좁은 vertical 1개 (고객지원·법무·헬스케어·세일즈) → workflow 전체 ownership → 고객은 결과에 과금 → 강한 lock-in. YC W26 batch 의 88% 가 AI-first, 28% 가 "AI-native 서비스" (인간 supervisor만 있음).
          </div>
        </div>

        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>가장 좁은 핵심 워크플로 하나를 해결하는 제품을 출시하세요.</div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Reid Hoffman: "첫 버전이 창피하지 않다면 너무 늦게 출시한 것이다." Stripe는 7줄의 코드로 시작했습니다. LinkedIn은 런칭 직전 팀이 "Contact Finder를 먼저 만들자"고 했지만 Hoffman은 거절했고 — 7년이 지나도 그 기능은 필요 없었습니다.</div>

        {/* "Claude Code for X" 패턴 — YC W26 batch 의 가장 명확한 trope */}
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.12)", marginBottom: "14px" }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
            💡 "Claude Code for X" 패턴 — YC W26 batch trope
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "8px" }}>
            <strong>YC W26 batch 3개사가 자기를 "Claude Code for X" 라고 자칭</strong>. 가장 명확한 설명이라서. 패턴 추상화:
            <strong> 특정 vertical 의 모든 workflow를 AI agent 가 직접 수행하고, 사용자는 supervise·승인만</strong>.
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {[
              { tag: "Healthcare", ex: "Patientdesk.ai — 치과 백오피스 AI / Beacon Health — 1차 진료 AI 직원 / Overdrive — 의료 청구 자동화" },
              { tag: "Legal", ex: "Wayco — 의료법 AI 운영자 / Legalos — 이민 로펌 / Vector Legal — 스타트업 전용 풀서비스 AI 로펌" },
              { tag: "Vertical agent", ex: "Fed10 — 정책 컨설턴트 대체 / ClaimGlide — 자동 prior-auth / Beacon — primary care employee" },
            ].map(p => (
              <div key={p.tag} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 0", borderTop: "1px solid rgba(25,25,112,0.06)" }}>
                <span style={{ flexShrink: 0, fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "5px", background: MIDNIGHT, color: "#fff", marginTop: "1px", whiteSpace: "nowrap" as const }}>
                  {p.tag}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>{p.ex}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "8px", lineHeight: 1.5, fontStyle: "italic" as const }}>
            → 사장님이 본인 업종에서 "AI Agent for [업종 핵심 직무]" 1개를 정의하면 됩니다. 너무 넓으면 vertical 이 아니라 horizontal — 좁힐수록 lock-in 강함.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "14px" }}>
          {[{ num: "2~6주", label: "목표 기간" }, { num: "1개", label: "핵심 워크플로" }, { num: "10명", label: "첫 사용자" }, { num: "~16만원", label: "월 도구비" }].map(s => (
            <div key={s.label} style={{ padding: "10px", borderRadius: "10px", background: MIDNIGHT_SOFT, textAlign: "center" as const }}>
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
    { title: "제품명 & 미션 정하기", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="name-mission" label="📖 4가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>앞서 정의한 문제를 제품의 이름과 미션으로 바꾸세요.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>문제 정의 단계에서 작성한 한 문장이 랜딩 페이지의 헤드라인이 되고, 투자자에게 하는 첫 마디가 되며, 팀원을 설득하는 무기가 됩니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["문제 정의를 기반으로 제품 미션 한 문장 확정", "제품명 후보 5~10개 + .com 도메인 확인", "30초 엘리베이터 피치 작성 (말로 연습해보세요)", "슬로건 1개 확정"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"나는 [타깃]을 위한 [핵심 기능] 제품을 만들려고 해. 1) 미션을 한 문장으로, 2) 슬로건 5개, 3) 제품명 후보 10개 (.com 도메인 가용성 고려), 4) 엘리베이터 피치 30초 버전을 만들어줘."</div>
        </div>
        {toolSection(null, 3, [{ name: "Namelix", desc: "AI 브랜드명 생성 + 도메인 확인. 선호도 학습", url: "https://namelix.com", free: true }, { name: "Looka", desc: "이름 + 로고 + 브랜드킷 한 번에. 한국어 지원", url: "https://looka.com", free: false, tag: "$20~" }, { name: "Claude / ChatGPT", desc: "미션, 슬로건, 엘리베이터 피치. 한국어 네이티브", url: "https://claude.ai", free: true, tag: "AI" }], MIDNIGHT)}
      </div>
    )},
    // PAGE 2 — 워크플로 & 화면 설계
    { title: "핵심 워크플로 & 화면 설계", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="core-workflow" label="📖 4가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>기능 10개를 넣지 마세요. 핵심 워크플로 하나만 완벽하게.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>사용자가 가입한 후 "아, 이거 좋다"라고 느끼는 순간까지의 최소 동선을 설계하세요. 이 한 화면에서 가치를 느끼지 못하면 나머지는 의미가 없습니다. Paul Graham: "적은 사람이 절실하게 원하는 것을 선택하라."</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["사용자의 핵심 동작(Core Action) 1개 정의", "가입 → Core Action까지 화면 수를 최소화 (3~5 화면 이내)", "각 화면의 와이어프레임을 AI로 생성", "불필요한 화면이 있는지 검토 — 없애도 되면 없애세요"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", marginBottom: "6px" }}>AI 활용법</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]. 가입 → 핵심 가치 체험까지의 최소 화면 플로우를 설계해줘. 각 화면에 필요한 UI 요소와 사용자 액션을 정의하고, 불필요한 화면을 줄이는 방법을 제안해줘."</div>
        </div>
        {toolSection(null, 3, [{ name: "Google Stitch", desc: "텍스트 → UI 디자인 자동 생성. 월 350회 무료", url: "https://stitch.withgoogle.com", free: true, tag: "추천" }, { name: "v0 by Vercel", desc: "프롬프트 → 프로덕션 React+Tailwind 코드 출력", url: "https://v0.app", free: true, tag: "$5/mo" }, { name: "Figma + AI", desc: "화면 설계 업계 표준. Make 기능으로 AI 생성", url: "https://figma.com", free: true }], MIDNIGHT)}
      </div>
    )},
    // PAGE 3 — 코드 아키텍처 & DB
    { title: "코드 아키텍처 & DB 설계", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="architecture-db" label="📖 5가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>코드를 한 줄 쓰기 전에 전체 구조를 먼저 잡으세요.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>DB 테이블, API, 페이지 구조, 인증 플로우. 이 설계를 건너뛰면 3주 후 "처음부터 다시 만들어야 하는" 상황이 옵니다. AI에게 요구사항을 주면 Mermaid 다이어그램으로 전체 아키텍처를 그려줍니다.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["필요한 DB 테이블과 관계 정의 (AI로 ERD 생성)", "API 엔드포인트 목록 작성", "페이지 구조(라우팅) 설계", "인증 플로우 결정 (이메일/소셜/매직링크)"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.08)", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", marginBottom: "6px" }}>AI 프롬프트</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"[제품 설명]을 만들려고 해. Next.js + Supabase + Vercel 스택으로. 1) 필요한 DB 테이블과 관계, 2) API 라우트 목록, 3) 페이지 구조, 4) 인증 플로우를 설계해줘. Mermaid 다이어그램으로."</div>
        </div>
        {toolSection(null, 3, [{ name: "Eraser.io", desc: "AI 시스템 아키텍처 + ERD 다이어그램 자동 생성", url: "https://eraser.io", free: true }, { name: "Supabase Studio", desc: "비주얼 테이블 에디터 + 스키마 관리", url: "https://supabase.com", free: true }, { name: "dbdiagram.io", desc: "간단한 DSL로 DB 다이어그램 생성", url: "https://dbdiagram.io", free: true }], MIDNIGHT)}
      </div>
    )},
    // PAGE 4 — 백엔드 & 인프라
    { title: "백엔드 & 배포 인프라", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="backend-deploy" label="📖 5가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>2026년에 서버를 직접 관리하는 건 시간 낭비입니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>BaaS를 쓰면 인증, DB, 스토리지, 실시간 기능을 코드 몇 줄로 얻습니다. YC 스타트업의 50%+가 React, 25.6%가 Vercel을 사용합니다. 검증된 조합을 선택하세요.</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["BaaS 선택 (Supabase 추천 — PostgreSQL + Auth + Storage)", "배포 플랫폼 선택 (Vercel 추천 — Next.js 제로 설정)", "프로젝트 초기 세팅 (npx create-next-app + Supabase 연결)", "환경변수 설정 + 배포 테스트"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 3, [{ name: "Supabase", desc: "PostgreSQL + 인증 + 스토리지 + 실시간 + pgvector. 무료 50K MAU + 500MB DB. 서울 리전 (ap-northeast-2)", url: "https://supabase.com", free: true, tag: "DB 추천" }, { name: "Vercel", desc: "Next.js 배포 제로 설정. Edge Function 지원. 무료 시작 (Hobby plan)", url: "https://vercel.com", free: true, tag: "배포 추천" }, { name: "Railway", desc: "사용량 기반 과금. 유휴 시 0원. 인디 해커 선호. Hobby $5/mo", url: "https://railway.app", free: false, tag: "$5/mo" }], MIDNIGHT)}

        {/* 2026-05-12: Day-1 Quick Start — 정확한 shell 명령 + 보일러플레이트. 사장님이 *바로* 시작 */}
        <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "14px", background: "#0f172a", color: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            ⚡ DAY-1 QUICK START — 마찰 없이 5분 안에
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
            아래 3 명령어로 Vercel-Native Stack (실리콘밸리 2026 표준) 즉시 시작.
          </div>
          <pre style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            lineHeight: 1.6,
            margin: 0,
            color: "rgba(255,255,255,0.92)",
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            overflowX: "auto" as const,
            whiteSpace: "pre" as const,
          }}>
{`# 1. shadcn/ui starter (Next.js 15 + Tailwind + shadcn + Supabase + Stripe)
git clone https://github.com/KolbySisk/next-supabase-stripe-starter
cd next-supabase-stripe-starter && pnpm install

# 2. Supabase 프로젝트 생성 (서울 리전 권장)
#    https://supabase.com/dashboard → New project (region: ap-northeast-2)
#    .env.local 에 NEXT_PUBLIC_SUPABASE_URL + ANON_KEY + SERVICE_ROLE 입력

# 3. shadcn/ui 컴포넌트 추가 (필요한 것만)
pnpm dlx shadcn@latest add button input card dialog

# 4. Vercel 배포 (GitHub repo 연결 → 자동 배포 1-click)
pnpm dlx vercel
`}
          </pre>
          <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", marginTop: "10px", lineHeight: 1.55 }}>
            ↑ 5분 안에 production URL (https://your-app.vercel.app) 가 살아납니다. 도메인 연결은 Vercel → Settings → Domains 에서 1-click.
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginTop: "10px" }}>
            <a href="https://github.com/KolbySisk/next-supabase-stripe-starter" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.10)", color: "#fff", fontSize: "11.5px", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.16)" }}>
              ⭐ shadcn boilerplate
            </a>
            <a href="https://vercel.com/templates/next.js/supabase" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.10)", color: "#fff", fontSize: "11.5px", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.16)" }}>
              ⭐ Vercel 공식 템플릿
            </a>
            <a href="https://github.com/michaeltroya/supa-next-starter" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.10)", color: "#fff", fontSize: "11.5px", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.16)" }}>
              ⭐ Supa-Next-Starter
            </a>
            <a href="https://makerkit.dev/next-supabase" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.10)", color: "#fff", fontSize: "11.5px", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.16)" }}>
              ⭐ MakerKit (유료, 풀스택)
            </a>
          </div>
        </div>

        {/* ── 2026-05-12: AI Agent / RAG 레이어 (ai-application 업종 핵심) ── */}
        <div style={{ marginTop: "20px", padding: "16px 18px", borderRadius: "16px", background: `${MIDNIGHT}06`, border: `1.5px solid ${MIDNIGHT}30` }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            🤖 AI Agent / RAG 레이어 (ai-application 업종)
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "6px" }}>
            AI 에이전트를 만든다면 Day-1 스택은 이미 정해져 있습니다.
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.65, marginBottom: "14px" }}>
            <strong>TS 스택:</strong> Mastra (1.0 출시, 주 30만 다운로드) + Vercel AI SDK (UI) + Inngest (워크플로) + Supabase pgvector + Langfuse.<br />
            <strong>Python 스택:</strong> Claude Agent SDK (Anthropic 공식) 또는 OpenAI Agents SDK + Pydantic AI v1.93 (스키마) + LangGraph (복잡 워크플로) + 같은 인프라.<br />
            ★ <strong>국내 시드 권장</strong>: TS / Mastra + Supabase pgvector + Langfuse + Inngest — 풀스택 무료 또는 $20/mo 시작 가능.
          </div>

          {/* AI 프레임워크 */}
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.8, marginBottom: "6px", marginTop: "10px" }}>
            ① 에이전트 프레임워크 (모델 + 도구 호출 + 상태 관리)
          </div>
          {toolSection(null, 5, [
            { name: "Mastra (TS)", desc: "TS-native, Vercel AI SDK 정렬. 주 30만 다운로드. $13M 시드 ('25.10). Next.js 풀스택 1순위.", url: "https://mastra.ai", free: true, tag: "TS 1순위" },
            { name: "Claude Agent SDK (Python)", desc: "Anthropic 공식. 가장 깊은 OS 접근 (파일·셸·MCP). Opus 4.7 1M context 지원.", url: "https://docs.anthropic.com/en/api/agent-sdk", free: false, tag: "Python 1순위" },
            { name: "OpenAI Agents SDK", desc: "OpenAI 공식. 깔끔한 handoff 모델 + 빌트인 트레이싱. Assistants API 후속.", url: "https://platform.openai.com/docs/guides/agents", free: false, tag: "OAI 표준" },
            { name: "LangGraph", desc: "복잡 멀티 에이전트 + 체크포인트 + approval gate. Klarna·Uber·LinkedIn 프로덕션.", url: "https://langchain-ai.github.io/langgraph/", free: true, tag: "복잡 워크플로" },
            { name: "Pydantic AI / BAML", desc: "구조화 출력 (JSON 스키마) 필수일 때. BAML은 함수형 프롬프트.", url: "https://ai.pydantic.dev/", free: true, tag: "Schema" },
          ], MIDNIGHT)}

          {/* Vector DB */}
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.8, marginBottom: "6px", marginTop: "14px" }}>
            ② Vector DB (RAG / 임베딩 저장) — 10M 벡터 기준 가격
          </div>
          {toolSection(null, 4, [
            { name: "Supabase pgvector", desc: "$45/mo (10M). 50M까지 가장 저렴. Korean 시드 1순위. 데이터 한 곳 (DB·인증·스토리지·벡터) 운영.", url: "https://supabase.com/vector", free: true, tag: "추천" },
            { name: "Qdrant", desc: "$65/mo (10M). OSS, self-host 가능. 필터 쿼리 강함. 정확도 우수.", url: "https://qdrant.tech", free: true, tag: "OSS" },
            { name: "Pinecone Serverless", desc: "$70/mo (10M). 단 100M+ 시 $700/mo+ — 비용 폭증 주의.", url: "https://pinecone.io", free: false, tag: "주의" },
            { name: "Turbopuffer", desc: "S3 기반 cheap+fast. 1억+ 벡터 시 비용 최저. Cohere·Notion 사용.", url: "https://turbopuffer.com", free: false, tag: "대규모" },
          ], MIDNIGHT)}

          {/* LLM 관측 + 평가 */}
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.8, marginBottom: "6px", marginTop: "14px" }}>
            ③ LLM Observability + Eval (반드시 day-1 부터 — 비용 추적·디버깅)
          </div>
          {toolSection(null, 4, [
            { name: "Langfuse", desc: "OSS, self-host. Clickhouse 인수 ('26.1). 비용 절감 압도적. Tracing + eval + prompt 버전 관리.", url: "https://langfuse.com", free: true, tag: "1순위" },
            { name: "Braintrust", desc: "Eval-first, CI/CD 회귀 차단. 폐쇄 소스. 평가 정밀도 1위.", url: "https://braintrust.dev", free: false, tag: "Eval" },
            { name: "Helicone", desc: "프록시 1줄로 추가. OpenAI 전용 시 가장 간단. 무료 100K 요청/월.", url: "https://helicone.ai", free: true, tag: "Proxy" },
            { name: "LangSmith", desc: "LangChain/LangGraph 사용 시만 권장. LangChain 종속.", url: "https://smith.langchain.com", free: true, tag: "LC 전용" },
          ], MIDNIGHT)}

          {/* AI Gateway + Inference */}
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.8, marginBottom: "6px", marginTop: "14px" }}>
            ④ AI Gateway + Inference Host (모델 라우팅·최적화)
          </div>
          {toolSection(null, 4, [
            { name: "OpenRouter", desc: "300+ 모델 단일 API. 가격 비교·fallback. 모델 자유 비교 시 1순위.", url: "https://openrouter.ai", free: true, tag: "라우팅" },
            { name: "Together.ai", desc: "오픈소스 모델 (Llama·DeepSeek·Qwen) 가장 저렴한 추론.", url: "https://together.ai", free: false, tag: "OSS 추론" },
            { name: "Groq", desc: "추론 속도 1위 (LPU). 챗봇·실시간에 필수.", url: "https://groq.com", free: true, tag: "속도" },
            { name: "Modal", desc: "Python 함수 → GPU 배포. 커스텀 모델·fine-tuning 자체 호스팅.", url: "https://modal.com", free: true, tag: "GPU" },
          ], MIDNIGHT)}

          {/* 워크플로 / 백그라운드 잡 */}
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, opacity: 0.8, marginBottom: "6px", marginTop: "14px" }}>
            ⑤ Durable Workflows (장기 실행 에이전트 — Vercel 5분 timeout 우회)
          </div>
          {toolSection(null, 3, [
            { name: "Inngest", desc: "이벤트 기반 + 재시도·fan-out 자동. AI 워크플로 표준. 무료 50K steps/월.", url: "https://inngest.com", free: true, tag: "1순위" },
            { name: "Trigger.dev", desc: "OSS, self-host 가능. cron + 이벤트 둘 다 강함. $10 시작.", url: "https://trigger.dev", free: true, tag: "OSS" },
            { name: "Mastra Workflows", desc: "Mastra 내장 (durable). 같은 framework 안에서 처리 가능.", url: "https://mastra.ai/docs/workflows", free: true, tag: "통합" },
          ], MIDNIGHT)}

          <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.04em", marginBottom: "4px" }}>⚠ 흔한 함정</div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.6 }}>
              <li><strong>Pinecone Standard</strong> 100M 벡터에서 $700-3K/mo로 폭증 — 시작은 pgvector.</li>
              <li><strong>LangChain bloat</strong> — LangGraph 사용 안 하면 LangChain 자체 의존성 제거.</li>
              <li><strong>Vercel function timeout (5분)</strong> 긴 LLM 호출 깨짐 → Inngest/Trigger 로 오프로드.</li>
              <li><strong>Langfuse self-host</strong> 는 K8s + Clickhouse + Redis 필요 — 시드는 cloud free tier로 시작.</li>
            </ul>
          </div>
        </div>
      </div>
    )},
    // PAGE 5 — AI 코딩 (2026-04 최신 검증 데이터)
    { title: "AI와 함께 코딩하기", color: MIDNIGHT, content: (
      <div>
        {/* 방법 자세히 보기 트리거 */}
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="mvp-coding" label="📖 5가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>1인이 5인 팀의 생산성을 냅니다 — 2026 AI 도구는 두 갈래로 분리됐습니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
            <strong>① 앱 빌더 (Lovable·v0·Bolt)</strong> — 비개발자도 자연어로 풀스택 앱 생성, 호스팅까지.<br />
            <strong>② AI 코딩 어시스턴트 (Cursor·Claude Code·Codex·Antigravity)</strong> — 개발자 IDE/터미널 안에서 작동, 복잡한 멀티파일 편집·테스트.<br />
            <strong>표준 패턴:</strong> 빌더로 1-2일 안에 프로토타입 → 사용자 반응 확인 → 어시스턴트로 2-4주 안에 프로덕션 재작성.
          </div>
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "20px" }}>
          {["Lovable/Bolt로 작동하는 프로토타입 1-2일 안에", "5-10명에게 보여주고 반응 확인", "반응 좋으면 Cursor + Claude Code로 프로덕션 시작", "shadcn/ui 컴포넌트 + Supabase DB 연결", "매일 배포 (Vercel·Railway 자동) + 매일 피드백"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* 카테고리 1: 앱 빌더 (No-Code AI) */}
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px", marginTop: "8px" }}>
          ① 앱 빌더 — 채팅으로 풀스택 앱 (비개발자 가능)
        </div>
        {toolSection(null, 4, [
          { name: "Lovable", desc: "2026 가장 성숙한 AI 앱 빌더. 깨끗한 React 코드 + 고품질 UI. Supabase·Stripe 1-클릭 통합", url: "https://lovable.dev", free: true, tag: "비개발자 #1" },
          { name: "v0 by Vercel", desc: "프롬프트 → React+Tailwind 프로덕션 코드. Next.js·Vercel 스택과 완벽 통합", url: "https://v0.app", free: true, tag: "프론트엔드" },
          { name: "Bolt.new (StackBlitz)", desc: "브라우저에서 즉시 코딩, 설치 X. Anthropic Claude 기반. 무료 1M 토큰/월", url: "https://bolt.new", free: true },
          { name: "Replit Agent", desc: "AI 에이전트가 풀스택 앱 자동 생성·배포. 학습용·MVP 검증", url: "https://replit.com", free: true, tag: "한국어" },
        ], MIDNIGHT)}

        {/* 카테고리 2: AI 코딩 어시스턴트 (개발자 IDE) */}
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px", marginTop: "16px" }}>
          ② AI 코딩 어시스턴트 — 개발자 IDE/터미널 (복잡한 멀티파일·리팩토링)
        </div>
        {toolSection(null, 6, [
          { name: "Cursor", desc: "월간 활성 사용자 800K+. VS Code 포크, 시각적 편집 + 채팅, 인라인 편집 최강", url: "https://cursor.com", free: false, tag: "Pro $20/mo" },
          { name: "Claude Code (Anthropic)", desc: "터미널 우선 에이전트. 복잡한 멀티파일 리팩토링·테스트 자동화 1위. Opus 4.7 권장 (1M context).", url: "https://claude.com/claude-code", free: false, tag: "Pro $20/mo" },
          { name: "Codex (OpenAI)", desc: "OpenAI의 에이전트. 백그라운드에서 멀티파일 편집·셸 명령·테스트 자동 실행. Claude Code 대안", url: "https://openai.com/codex", free: false, tag: "$20/mo+" },
          { name: "Antigravity (Google)", desc: "프리뷰 무료. Claude Opus 4.7 / Gemini 3 / GPT-OSS 모델 자유 선택", url: "https://antigravity.google", free: true, tag: "프리뷰 무료" },
          { name: "Windsurf (Codeium)", desc: "AI-네이티브 IDE. Anthropic Claude 기반. Cursor 대안", url: "https://codeium.com/windsurf", free: false, tag: "$15/mo" },
          { name: "GitHub Copilot", desc: "인라인 자동완성 표준. 2,000만+ 유저. 무료 플랜 (월 50회 채팅)", url: "https://github.com/features/copilot", free: true, tag: "$10/mo" },
        ], MIDNIGHT)}

        {/* 비교 가이드 */}
        <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: `${MIDNIGHT}06`, border: `1px solid ${MIDNIGHT}25` }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "8px" }}>🎯 어떤 도구를 쓸까? (2026.4 표준)</div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
            <li><strong>비개발자·디자이너</strong> → Lovable (가장 깔끔), v0 (Next.js), Bolt (브라우저)</li>
            <li><strong>개발자·시각적 작업</strong> → Cursor (인라인 편집), Windsurf</li>
            <li><strong>개발자·복잡한 자동화</strong> → Claude Code (터미널), Codex (백그라운드)</li>
            <li><strong>비용 최소화·실험</strong> → Antigravity 프리뷰 무료, Bolt 무료 1M/월</li>
            <li><strong>실전 패턴 (Marc Lou·Pieter Levels)</strong> → Cursor + Claude Code 조합으로 26% 빠른 개발</li>
          </ul>
        </div>
      </div>
    )},
    // PAGE 6 — 디자인 & 브랜딩 (2026-04 검증: GPT Image 2 출시·Sora 종료·DALL-E 곧 종료)
    { title: "디자인 & 브랜딩", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="design-image" label="📖 4가지 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>MVP라도 디자인이 후지면 사용자는 떠납니다 — 2026 AI 도구로 1인이 디자이너 팀급 결과물 가능.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
            <strong>2026.4 핵심 변화</strong>: GPT Image 2 (4월 21일 출시, 4K, 한국어 99% 텍스트 정확도) / DALL-E 2·3는 5월 12일 종료 / Sora는 3월 종료 → 비디오는 PixVerse·Runway·Kling 으로 이동 / Midjourney v7 + Imagen 3 가 이미지 빅3.<br />
            shadcn/ui로 Apple 수준 컴포넌트, GPT Image 2로 OG 이미지·로고·일러스트 1시간 안에 완성.
          </div>
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "20px" }}>
          {["shadcn/ui 컴포넌트로 전체 UI 통일", "GPT Image 2 또는 Looka 로 로고 + 파비콘 (한국어 텍스트 99% 정확)", "브랜드 컬러 2~3색 확정 (primary + accent)", "OG 이미지 (소셜 공유용) 제작 — GPT Image 2 4K", "(선택) ElevenLabs 음성 + Suno 음악 으로 데모 영상"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* 카테고리 1: UI 컴포넌트 라이브러리 */}
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
          ① UI 컴포넌트 — Apple 수준의 무료 라이브러리
        </div>
        {toolSection(null, 4, [
          { name: "shadcn/ui", desc: "2026 절대 표준. Tailwind + Radix UI. 코드 소유 (의존성 X). YC·Vercel 스타트업 80%+ 사용", url: "https://ui.shadcn.com", free: true, tag: "필수" },
          { name: "Aceternity UI", desc: "애니메이션 랜딩 컴포넌트 끝판왕. SaaS 페이지·hero 섹션에 최적", url: "https://ui.aceternity.com", free: true },
          { name: "Magic UI", desc: "shadcn 호환 마이크로 애니메이션 50+개. 무료, 코드 복사 모델", url: "https://magicui.design", free: true },
          { name: "Origin UI", desc: "shadcn 위에 빌드된 프리미엄 패턴. 폼·테이블·차트 풍부", url: "https://originui.com", free: true },
        ], MIDNIGHT)}

        {/* 카테고리 2: AI 이미지 생성 — 2026.4 빅3 */}
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px", marginTop: "16px" }}>
          ② AI 이미지 — 2026.4 빅3 (DALL-E 곧 종료)
        </div>
        {toolSection(null, 5, [
          { name: "GPT Image 2 (OpenAI)", desc: "2026.4.21 출시. GPT-4o 네이티브. 4K, 3초 생성. 한국어 텍스트 99% 정확. DALL-E 2·3 5/12 종료 → 후속 표준", url: "https://platform.openai.com/docs/guides/image-generation", free: false, tag: "출시 직후 1위" },
          { name: "Midjourney v7", desc: "디자이너 픽 — 의도적 라이팅·구성·텍스처 \"손맛\" 압도적. 웹 인터페이스 출시 후 접근성 향상", url: "https://midjourney.com", free: false, tag: "$10/mo+" },
          { name: "Google Imagen 3", desc: "Gemini 통합. 빠른 생성 + 다국어 강함. Gemini Advanced 구독에 포함", url: "https://gemini.google.com", free: false, tag: "Gemini" },
          { name: "Looka", desc: "AI 로고 + 풀 브랜드킷 한 번에. 한국어 지원. 비개발자 친화", url: "https://looka.com", free: false, tag: "로고 $20~" },
          { name: "Canva AI", desc: "마케팅 에셋 만능 (배너·OG·소셜). 한국어 UI. 무료 티어 충분, Magic Design AI 강력", url: "https://canva.com", free: true, tag: "한국어" },
        ], MIDNIGHT)}

        {/* 카테고리 3: 비디오·음성·음악 (스타트업 데모·마케팅) */}
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px", marginTop: "16px" }}>
          ③ 비디오·음성·음악 — Sora 종료 후 시장 (시장 $788M → $3.44B)
        </div>
        {toolSection(null, 5, [
          { name: "PixVerse V6", desc: "Sora 후속 1순위. 캐릭터 일관성 + 멀티샷 비디오. 데모·튜토리얼에 최적", url: "https://pixverse.ai", free: true, tag: "비디오 #1" },
          { name: "Runway Gen-4", desc: "시네마틱 카메라 컨트롤. 광고·론칭 영상에 최적. 영화급 퀄리티", url: "https://runwayml.com", free: false, tag: "프로 $15/mo" },
          { name: "Kling v3.0 (Kuaishou)", desc: "액션·동작 시퀀스 강함. 중국 출시 글로벌 확산", url: "https://klingai.com", free: true, tag: "액션" },
          { name: "ElevenLabs", desc: "AI 음성 표준. $11B valuation. 다국어 더빙·내레이션. 무료 10K자/월", url: "https://elevenlabs.io", free: true, tag: "음성 #1" },
          { name: "Suno", desc: "AI 음악 생성. $300M ARR. 데모 영상 BGM·론칭 음악 5분 안에. 무료 일 10곡", url: "https://suno.com", free: true, tag: "음악" },
        ], MIDNIGHT)}

        {/* 핵심 변화 요약 박스 */}
        <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.2)" }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b64c4c", marginBottom: "6px" }}>⚠️ 2026.4 시장 변화 — 알아둘 것</div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
            <li><strong>OpenAI Sora 종료</strong> (2026.3) → 비디오는 PixVerse·Runway·Kling 으로 이동</li>
            <li><strong>DALL-E 2·3 종료</strong> (2026.5.12) → GPT Image 2 가 OpenAI 유일 이미지 모델</li>
            <li><strong>GPT Image 2 한국어 텍스트 99% 정확도</strong> — 한국 스타트업에게 게임체인저 (DALL-E 시대 한글 깨짐 문제 해소)</li>
            <li><strong>ElevenLabs $11B / Suno $300M ARR</strong> — 음성·음악 AI 시장 폭발</li>
          </ul>
        </div>
      </div>
    )},
    // PAGE 7 — 랜딩 & 론칭
    { title: "랜딩 페이지 & 론칭", color: MIDNIGHT, content: (
      <div>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <BuildMethodTrigger taskId="landing-page" label="📖 5가지 제작 방법 자세히 보기" onOpen={setMethodDialogTaskId} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: MIDNIGHT_SOFT, border: "1px solid rgba(25,25,112,0.1)", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>랜딩 페이지는 24시간 작동하는 영업사원입니다.</div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>헤드라인(무엇), 서브헤딩(왜), 스크린샷(어떻게), CTA(시작) — 이 4가지만 있으면 됩니다. 그리고 Stripe처럼 "노트북 줘봐"라며 직접 설치해주세요.</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: MIDNIGHT_SOFT, borderLeft: "3px solid rgba(25,25,112,0.15)", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6, fontStyle: "italic" }}>"스타트업이 이륙하는 건 저절로 되는 게 아니라 창업자가 밀어붙여서다. Airbnb는 뉴욕에 매주 날아가 집주인을 직접 만났고, 그 30일의 노력이 성공과 실패를 갈랐다." — Paul Graham</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 단계에서 할 일</div>
        <div style={{ display: "grid", gap: "4px", marginBottom: "16px" }}>
          {["랜딩 페이지 제작 (헤드라인 + 스크린샷 + CTA)", "Product Hunt 론칭 준비 (론칭 데이 전략)", "첫 10명 사용자를 직접 찾아가서 모으기", "SEO 기본 설정 (메타 태그, OG 이미지, sitemap)"].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "7px" }} />
              <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        {toolSection(null, 4, [{ name: "Framer", desc: "디자이너급 랜딩 페이지. AI 레이아웃 자동 생성", url: "https://framer.com", free: false, tag: "$10/mo" }, { name: "Product Hunt", desc: "글로벌 론칭 플랫폼 #1. 론칭 데이 전략 준비 필수", url: "https://producthunt.com", free: true }, { name: "Hacker News (Show HN)", desc: "기술 커뮤니티 피드백. 폭발적 트래픽 가능", url: "https://news.ycombinator.com", free: true }, { name: "CodeRabbit", desc: "AI 코드 리뷰. GitHub PR 자동 리뷰. 무료", url: "https://coderabbit.ai", free: true, tag: "QA" }], MIDNIGHT)}
      </div>
    )},
  ] : [
    // English pages — same structure, shorter
    { title: "MVP Build Roadmap", color: MIDNIGHT, content: (<div><div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "10px" }}>Ship a product that solves one core workflow in 2-6 weeks.</div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7 }}>Reid Hoffman: "If you're not embarrassed by the first version, you've launched too late." Navigate through 7 steps using the arrows below.</div></div>) },
    { title: "Name & Mission", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Explain what your product does in one sentence. This becomes your landing page headline, your first pitch to investors, and your team's north star.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Namelix", desc: "AI brand names + domain check", url: "https://namelix.com", free: true }, MIDNIGHT)}{toolCard({ name: "Claude / ChatGPT", desc: "Mission, slogan, elevator pitch", url: "https://claude.ai", free: true, tag: "AI" }, MIDNIGHT)}</div></div>) },
    { title: "Core Workflow & Wireframe", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the minimum path from signup to "aha moment." One workflow, perfect. Paul Graham: "Build something a small number of people want a large amount."</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Google Stitch", desc: "Text → UI design. 350 free/mo", url: "https://stitch.withgoogle.com", free: true, tag: "Best" }, MIDNIGHT)}{toolCard({ name: "v0 by Vercel", desc: "Prompt → production React+Tailwind", url: "https://v0.app", free: true }, MIDNIGHT)}</div></div>) },
    { title: "Architecture & DB Design", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Design the full structure before writing code. DB tables, API routes, page structure, auth flow. Skip this and you'll rebuild from scratch later.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Eraser.io", desc: "AI architecture + ERD diagrams", url: "https://eraser.io", free: true }, MIDNIGHT)}{toolCard({ name: "Supabase Studio", desc: "Visual table editor + schema", url: "https://supabase.com", free: true }, MIDNIGHT)}</div></div>) },
    { title: "Backend & Deployment", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Don't manage servers. Use BaaS for auth, DB, storage in a few lines. 50%+ of YC startups use React, 25.6% deploy on Vercel.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Supabase", desc: "PostgreSQL + Auth + Storage. Free 50K MAU", url: "https://supabase.com", free: true, tag: "DB" }, MIDNIGHT)}{toolCard({ name: "Vercel", desc: "Zero-config Next.js deploy", url: "https://vercel.com", free: true, tag: "Deploy" }, MIDNIGHT)}</div></div>) },
    { title: "Code with AI", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>One person with AI tools = 5-person team. Strategy: Lovable for prototype (hours) → Cursor + Claude Code for production (2-4 weeks).</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Cursor", desc: "Fastest AI coding. VS Code fork", url: "https://cursor.com", free: false, tag: "Speed $20/mo" }, MIDNIGHT)}{toolCard({ name: "Claude Code", desc: "Best quality. 5.5x fewer tokens", url: "https://claude.ai/code", free: false, tag: "Quality" }, MIDNIGHT)}{toolCard({ name: "Lovable", desc: "Chat-to-app. One-click deploy", url: "https://lovable.dev", free: true, tag: "Prototype" }, MIDNIGHT)}</div></div>) },
    { title: "Design & Branding", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>Even an MVP needs good design. Users judge by feel first. shadcn/ui gives Apple-level components for free.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "shadcn/ui", desc: "2026 standard. Tailwind + Radix", url: "https://ui.shadcn.com", free: true, tag: "Must" }, MIDNIGHT)}{toolCard({ name: "Looka", desc: "AI logo + brand kit", url: "https://looka.com", free: false, tag: "$20~" }, MIDNIGHT)}</div></div>) },
    { title: "Landing & Launch", color: MIDNIGHT, content: (<div><div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "14px" }}>"Startups take off because founders make them take off." — Paul Graham. Landing page = 24/7 salesperson. Headline + Screenshot + CTA.</div><div style={{ display: "grid", gap: "6px" }}>{toolCard({ name: "Framer", desc: "Designer-quality landing page", url: "https://framer.com", free: false, tag: "$10/mo" }, MIDNIGHT)}{toolCard({ name: "Product Hunt", desc: "Global launch platform #1", url: "https://producthunt.com", free: true }, MIDNIGHT)}</div></div>) },
  ];

  const page = pages[mvpPage] ?? pages[0];
  const total = pages.length;
  const pageDotLabels = pages.map((_, i) => (i === 0 ? (ko ? "개요" : "Overview") : `${i}`));

  return (
    <div style={{ marginBottom: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* KEY ACTION 미드나이트 hero (최상단) */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "2~6주 안에 가장 좁은 워크플로 하나로 출시하세요" : "Ship one narrowest workflow in 2-6 weeks"}
        subtitle={
          ko
            ? "Reid Hoffman: \"첫 버전이 창피하지 않다면 너무 늦게 출시한 것이다.\" 기능 추가가 아니라 삭제가 어렵습니다. 7단계로 끝내세요."
            : "Reid Hoffman: \"If you're not embarrassed, you launched too late.\" Removing features is harder than adding. 7 steps to launch."
        }
        miniCards={[
          { icon: Rocket, label: ko ? "2~6주" : "2-6 wks", detail: ko ? "목표 기간" : "Timebox" },
          { icon: Code2, label: ko ? "1개" : "One", detail: ko ? "핵심 워크플로" : "Core workflow" },
          { icon: Sparkles, label: ko ? "AI 코딩" : "AI Code", detail: ko ? "1인=5인 팀" : "1=5 team" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — MVP 빌드 도구·아키텍처·테스트 표준" : "↓ Reference — MVP build tools, architecture, testing"}
      </StartupReferenceLabel>

      {/* 페이지네이션 — 미드나이트 */}
      <StartupPageNav
        page={mvpPage}
        totalPages={total}
        labels={pageDotLabels}
        onChange={(p) => { setMvpPage(p); setMvpToolsOpen(false); }}
        ko={ko}
      />

      {/* PAGE 0 — ModePathCard 보충 */}
      {mvpPage === 0 && <ModePathCard stageId="mvp-build" />}

      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
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

      {/* 빌드 방법 가이드 모달 (MVP 코딩 / 랜딩 페이지 / 디자인·이미지) */}
      <BuildMethodDialog taskId={methodDialogTaskId} onClose={() => setMethodDialogTaskId(null)} />

      <StageWrapup
        ko={ko}
        nextStageLabelKo="런칭 GTM"
        doneItemsKo={[
          { label: "1. MVP 범위 정의", detail: "「북극성 가설 1개 검증」에 필요한 최소 기능만 — Wide vs Deep 트레이드오프" },
          { label: "2. 빌드 방법 결정", detail: "노코드(Bubble·Webflow)·로코드(Retool)·풀스택 비교 후 선택" },
          { label: "3. 1차 MVP 출시", detail: "내부 알파 → 클로즈드 베타 → 오픈 베타 3단계 + 분석 셋업" },
          { label: "4. 첫 사용자 10명", detail: "리드 고객 10명 onboard + 1:1 사용자 인터뷰 + 핵심 지표 측정" },
        ]}
        verifyItemsKo={[
          "PMF 시그널 — 「제거하면 절망적」 답변 40%+ 가 PMF 신호 (Sean Ellis Test), 미달 시 GTM 전 재정의",
          "보안 — 출시 전 OWASP Top 10 점검 + SQL injection·XSS·CSRF 사전 방어",
          "개인정보 — 수집·이용·제공·파기 4항목 명문화, 위반 시 매출 3% 이내 과징금",
          "이용약관·환불 — 7일 이내 청약철회·환불 조항 명시, 디지털콘텐츠 예외 조건 명문화",
          "지재권 — 핵심 알고리즘·UI·로고 특허·상표·저작권 사전 출원, 외부 노출 후 출원 X",
          "데이터 백업 — DB·파일 다중 백업·복구 시뮬, 출시 후 데이터 손실 시 신뢰 회복 불가",
        ]}
        nextSummaryKo="MVP 출시·첫 사용자·PMF 신호 → 런칭 GTM 단계로 진입"
      />
    </div>
  );
}
