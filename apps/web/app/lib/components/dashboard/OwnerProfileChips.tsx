"use client";

/**
 * OwnerProfileChips — 지원사업 매칭 보강 입력(나이·폐업검토·장애·NCB 신용점수).
 *
 *  ⚠️ 민감 PII(나이·신용점수)는 로컬(profile-store → localStorage)에만 저장하고
 *     Supabase 등 서버로 전송하지 않음. 매칭은 클라이언트에서 수행되므로 로컬값으로 충분.
 *
 *  PolicyFundMatchCard(대시보드)와 GuidesView(펀딩페이지)에서 공용 — 같은 store 라
 *  한쪽에서 입력하면 양쪽 매칭에 즉시 반영(SSOT).
 */
import { useProfileStore } from "../../stores/profile-store";

/** 출생연도 → 만 나이 (매칭 criteria.age 용). 범위 밖이면 undefined. */
export function ageFromBirthYear(birthYear: number | undefined): number | undefined {
  if (birthYear == null) return undefined;
  const age = new Date().getFullYear() - birthYear;
  return age >= 0 && age < 120 ? age : undefined;
}

const SKY = "#3B5BBF";
const SKY_BG = "#EAF2FF";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const MIDNIGHT_SOFT = "#5A6BAE";

const chip: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 11px",
  borderRadius: "999px",
  border: "1px solid",
  cursor: "pointer",
  transition: "all 120ms ease",
  background: "#fff",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    ...chip,
    background: active ? SKY_BG : "#fff",
    borderColor: active ? SKY : HAIRLINE_STRONG,
    color: active ? "#1F46A8" : MIDNIGHT_SOFT,
  };
}

export function OwnerProfileChips({ ko }: { ko: boolean }) {
  const ownerBirthYear = useProfileStore((s) => s.ownerBirthYear);
  const ownerNcbScore = useProfileStore((s) => s.ownerNcbScore);
  const ownerConsideringClosure = useProfileStore((s) => s.ownerConsideringClosure);
  const ownerIsDisabledOwner = useProfileStore((s) => s.ownerIsDisabledOwner);
  const setOwnerBirthYear = useProfileStore((s) => s.setOwnerBirthYear);
  const setOwnerNcbScore = useProfileStore((s) => s.setOwnerNcbScore);
  const setOwnerConsideringClosure = useProfileStore((s) => s.setOwnerConsideringClosure);
  const setOwnerIsDisabledOwner = useProfileStore((s) => s.setOwnerIsDisabledOwner);
  const age = ageFromBirthYear(ownerBirthYear);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
      <button
        type="button"
        onClick={() => {
          const cur = ownerBirthYear != null ? String(ownerBirthYear) : "";
          const v = window.prompt(ko ? "출생연도 4자리 (예: 1990) — 청년·시니어 지원 매칭용" : "Birth year (e.g. 1990) — for youth/senior funds", cur);
          if (v === null) return;
          const y = parseInt(v, 10);
          const thisYear = new Date().getFullYear();
          setOwnerBirthYear(y >= 1900 && y <= thisYear ? y : undefined);
        }}
        style={chipStyle(ownerBirthYear != null)}
      >
        {ownerBirthYear != null ? `${ownerBirthYear}년생 · 만 ${age}세` : ko ? "출생연도 입력" : "Enter birth year"}
      </button>
      <button
        type="button"
        onClick={() => setOwnerConsideringClosure(!ownerConsideringClosure)}
        style={chipStyle(ownerConsideringClosure)}
      >
        {ko ? "폐업 검토 중" : "Considering closure"}
      </button>
      <button
        type="button"
        onClick={() => setOwnerIsDisabledOwner(!ownerIsDisabledOwner)}
        style={chipStyle(ownerIsDisabledOwner)}
      >
        {ko ? "장애인 사장님" : "Disabled owner"}
      </button>
      <button
        type="button"
        onClick={() => {
          const cur = ownerNcbScore != null ? String(ownerNcbScore) : "";
          const v = window.prompt(ko ? "NCB 신용점수 (선택, 모르면 취소) — 기기에만 저장됩니다" : "NCB score (optional, stored on device only)", cur);
          if (v === null) return;
          const n = parseInt(v, 10);
          setOwnerNcbScore(n > 0 && n <= 1000 ? n : undefined);
        }}
        style={chipStyle(ownerNcbScore != null)}
      >
        {ownerNcbScore != null ? `NCB ${ownerNcbScore}` : ko ? "NCB 신용점수 입력" : "Enter NCB"}
      </button>
    </div>
  );
}
