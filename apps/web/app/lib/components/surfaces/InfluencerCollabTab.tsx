"use client";

/**
 * InfluencerCollabTab — 마케팅 "협찬" 탭 (2026-08-04, 사장님 지시).
 *
 *  구성 (전부 결정론 — LLM 0%):
 *   ① 월 마케팅 예산 입력 → 티어·협업 형태 권고 (influencer-plays 시세표 SSOT 그대로)
 *   ② 큐레이션 인플루언서 (influencer-directory SSOT — 사장님 검수 목록):
 *      팔로워·참여율(출처 확인분만)·지역·티어 + 프로필 링크 + DM 초안 복사
 *   ③ 직접 발굴 도구 (influencer-plays): 업종×강점별 플레이 + 검색 링크 + DM 템플릿
 *   ④ 시세표 (접힘) — 출처 병기
 *
 *  정직성: 참여율 없으면 "—" · 조회 시점(2026-08) 명기 · "광고 효과 보장" 문구 금지.
 *  큐레이션 없는 업종은 발굴 도구만 (억지 매칭 금지). DM 발송은 항상 사장님 손 (복사만).
 */
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  INFLUENCER_DIRECTORY_CHECKED_AT,
  influencersForCategory,
  influencerProfileUrl,
  INFLUENCER_PLAYS,
  INFLUENCER_FEE_RANGES,
  INFLUENCER_NOT_FIT,
  FEE_SOURCES_KO,
  playsForIndustry,
  fillDmTemplate,
  fillQuery,
  tierForFollowers,
  type CuratedInfluencer,
  type InfluencerPlay,
} from "@foundone/shared";

const TIER_KO: Record<string, string> = { nano: "나노", micro: "마이크로", mid: "미드", macro: "매크로" };

const fmtFollowers = (n: number) => (n >= 10_000 ? `${(n / 10_000).toFixed(n % 10_000 === 0 ? 0 : 1)}만` : n.toLocaleString());

/** 예산(원) → 협업 형태 권고 — 시세표 값만 조합 (새 숫자 발명 금지) */
function budgetAdvice(budgetWon: number): string {
  if (budgetWon <= 0) return "예산을 입력하면 맞는 협업 형태를 알려드려요. 0원이어도 나노 협찬형(제공 중심)은 가능해요.";
  const man = budgetWon / 10_000;
  if (man < 10) return "나노 협찬형(제품·서비스 제공 중심) 권장 — 원고료 없이 성사되는 경우가 많아요.";
  if (man < 50) return "나노 원고료형(피드 10~30만)까지 가능 — 마이크로는 협찬+협의로 접근하세요.";
  if (man < 150) return "마이크로 피드 1건(50~150만) 범위 — 나노 여러 명 분산도 효과적이에요.";
  return "마이크로 릴스(75~200만)·미드 협의 범위 — 한 번에 쓰기보다 월 분산 집행을 권해요.";
}

function CopyButton({ text, ko }: { text: string; ko: boolean }) {
  const [state, setState] = useState<null | "ok" | "fail">(null);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("ok");
        } catch {
          setState("fail");
        }
        setTimeout(() => setState(null), 1800);
      }}
      style={{
        flexShrink: 0, fontSize: 11.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
        padding: "6px 11px", borderRadius: 8,
        border: state === "ok" ? "1px solid #1d3557" : state === "fail" ? "1px solid rgba(182,76,76,0.4)" : "1px solid rgba(59,92,140,0.3)",
        background: state === "ok" ? "rgba(25,25,112,0.08)" : "#fff",
        color: state === "ok" ? "#1d3557" : state === "fail" ? "#b64c4c" : "#3b5c8c",
      }}
    >
      {state === "ok" ? (ko ? "✓ 복사됨" : "✓ Copied") : state === "fail" ? (ko ? "복사 안 됨" : "Failed") : (ko ? "DM 초안 복사" : "Copy DM")}
    </button>
  );
}

export function InfluencerCollabTab({
  ko, categoryId, storeName, region, budgetWon, onBudgetChange,
}: {
  ko: boolean;
  categoryId: string;
  storeName: string;
  region: string;
  budgetWon: number;
  onBudgetChange: (won: number) => void;
}) {
  const [feeOpen, setFeeOpen] = useState(false);
  const [budgetText, setBudgetText] = useState(budgetWon > 0 ? String(Math.round(budgetWon / 10_000)) : "");

  const curated = useMemo(() => influencersForCategory(categoryId), [categoryId]);
  const plays = useMemo(() => playsForIndustry(categoryId), [categoryId]);
  const notFit = INFLUENCER_NOT_FIT[categoryId];
  const dmForCurated = (i: CuratedInfluencer): string => {
    const play = plays[0];
    const base = play
      ? fillDmTemplate(play.dmTemplateKo, storeName || "저희 가게", region || "동네")
      : `안녕하세요, ${region || "동네"}에서 ${storeName || "가게"}를 운영하는 사장입니다. 콘텐츠 잘 보고 있습니다. 협찬(제공) 방식으로 협업을 제안드리고 싶은데, 조건은 편하게 협의 부탁드려요.`;
    return base;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 18 }}>
      {/* ① 예산 → 협업 형태 권고 */}
      <article style={card}>
        <div style={eyebrow}>{ko ? "협찬 예산" : "BUDGET"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{ko ? "월 인플루언서 예산" : "Monthly budget"}</span>
          <input
            type="text" inputMode="numeric" value={budgetText}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setBudgetText(v);
              onBudgetChange(v ? Number(v) * 10_000 : 0);
            }}
            placeholder={ko ? "만원" : "만원"}
            style={{ width: 90, padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.1)", fontSize: 13, fontWeight: 700, outline: "none" }}
          />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{ko ? "만원" : "×10,000₩"}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text)", marginTop: 8, lineHeight: 1.6, padding: "9px 11px", borderRadius: 10, background: "rgba(59,92,140,0.05)" }}>
          {budgetAdvice(budgetWon)}
        </div>
      </article>

      {/* ② 큐레이션 목록 — 업종 매칭분만 */}
      {curated.length > 0 && (
        <article style={card}>
          <div style={eyebrow}>{ko ? "검수 목록" : "CURATED"}</div>
          <div style={{ fontSize: 15, fontWeight: 750, color: "var(--text)" }}>
            {ko ? `내 업종 인플루언서 · ${curated.length}명` : `Curated · ${curated.length}`}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, marginBottom: 12 }}>
            {ko
              ? `팔로워·참여율은 ${INFLUENCER_DIRECTORY_CHECKED_AT} 조회 기준이에요. 참여율은 공개 통계에서 확인된 계정만 표시합니다.`
              : `Followers/engagement as of ${INFLUENCER_DIRECTORY_CHECKED_AT}.`}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {curated.map((i) => (
              <div key={i.handle} style={{ padding: "11px 13px", borderRadius: 13, background: "#fff", border: "1px solid rgba(25,25,112,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                  <a href={influencerProfileUrl(i)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a", textDecoration: "none" }}>
                    {i.name} <span style={{ color: "#3b5c8c", fontWeight: 650 }}>@{i.handle} ↗</span>
                  </a>
                  <span style={chip}>{TIER_KO[tierForFollowers(i.followers)] ?? ""} · {fmtFollowers(i.followers)}</span>
                  {i.engagementRatePct != null ? (
                    <span style={{ ...chip, background: "rgba(29,53,87,0.08)", color: "#1d3557" }}>
                      {ko ? "참여율" : "ER"} {i.engagementRatePct}%
                      {i.statsSourceUrl && (
                        <a href={i.statsSourceUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, color: "#1d3557", textDecoration: "none" }}>↗</a>
                      )}
                    </span>
                  ) : (
                    <span style={{ ...chip, color: "var(--muted)" }}>{ko ? "참여율 —" : "ER —"}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ flex: 1, fontSize: 11.5, color: "var(--muted)" }}>{i.regionKo}</span>
                  <CopyButton text={dmForCurated(i)} ko={ko} />
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ③ 직접 발굴 도구 — plays (큐레이션 유무와 무관하게 제공) */}
      <article style={card}>
        <div style={eyebrow}>{ko ? "직접 발굴" : "DISCOVER"}</div>
        <div style={{ fontSize: 15, fontWeight: 750, color: "var(--text)", marginBottom: 10 }}>
          {ko ? "내 업종 협업 플레이" : "Collab plays"}
        </div>
        {notFit ? (
          <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.6, padding: "11px 13px", borderRadius: 12, background: "rgba(25,25,112,0.04)" }}>
            <b style={{ fontWeight: 750 }}>{ko ? "이 업종엔 인스타 협찬이 잘 안 맞아요. " : ""}</b>
            {notFit.reasonKo} {notFit.insteadKo}
          </div>
        ) : plays.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
            {ko ? "이 업종의 검증된 협업 플레이가 아직 없어요 — 위 검수 목록과 시세표를 참고하세요." : "No verified plays yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {plays.map((p: InfluencerPlay) => (
              <div key={p.id} style={{ padding: "12px 14px", borderRadius: 13, background: "#fff", border: "1px solid rgba(25,25,112,0.08)" }}>
                <div style={{ fontSize: 13, fontWeight: 750, color: "var(--text)" }}>{p.titleKo}</div>
                <div style={{ fontSize: 12, color: "var(--text)", marginTop: 3, lineHeight: 1.55 }}>{p.targetKo}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.55 }}>{p.practiceKo}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>
                  {p.instagramQueries.slice(0, 2).map((q, i) => {
                    const query = fillQuery(q, region || "");
                    return (
                      <a
                        key={i}
                        href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${query}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ ...chip, textDecoration: "none", color: "#3b5c8c", background: "rgba(59,92,140,0.07)" }}
                      >
                        🔍 {query}
                      </a>
                    );
                  })}
                  <span style={{ flex: 1 }} />
                  <CopyButton text={fillDmTemplate(p.dmTemplateKo, storeName || "저희 가게", region || "동네")} ko={ko} />
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* ④ 시세표 (접힘) */}
      <article style={card}>
        <button type="button" onClick={() => setFeeOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          <span style={{ fontSize: 13.5, fontWeight: 750, color: "var(--text)" }}>{ko ? "등급별 시세표" : "Fee ranges"}</span>
          <ChevronRight size={14} strokeWidth={2} color="var(--muted)" style={{ transform: feeOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {feeOpen && (
          <div style={{ marginTop: 10, overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr>
                  {[ko ? "등급" : "Tier", ko ? "팔로워" : "Followers", ko ? "협찬형" : "Barter", ko ? "피드" : "Feed", ko ? "릴스" : "Reels"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "var(--muted)", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INFLUENCER_FEE_RANGES.map((r) => (
                  <tr key={r.tier}>
                    <td style={td}>{TIER_KO[r.tier] ?? r.tier}</td>
                    <td style={td}>{r.followersKo}</td>
                    <td style={td}>{r.barterKo}</td>
                    <td style={td}>{r.feedFeeKo}</td>
                    <td style={td}>{r.reelsFeeKo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{FEE_SOURCES_KO}</div>
          </div>
        )}
      </article>

      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
        {ko
          ? "DM 발송·조건 협의는 사장님이 직접 하세요 (앱이 대신 보내지 않아요). 협찬 결과·광고 효과는 보장되지 않으며, 유료 광고 표기(#광고·#협찬)는 표시광고법상 필수입니다."
          : "You send DMs yourself — the app never sends on your behalf. Results aren't guaranteed; sponsored-content disclosure is legally required."}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  padding: "20px 22px",
};

const eyebrow: React.CSSProperties = {
  fontSize: 10, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4,
};

const chip: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(15,23,42,0.05)", color: "#0f172a",
  display: "inline-flex", alignItems: "center",
};

const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid rgba(15,23,42,0.04)", color: "#0f172a" };
