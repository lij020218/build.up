"use client";

/**
 * OwnerProfileChips — 지원사업 매칭 보강 입력(나이·폐업검토·장애·NCB 신용점수).
 *
 *  로컬(profile-store → localStorage)에 즉시 반영 + 서버(봉투암호화)로 background sync.
 *  기기 변경·재설치 시 서버값 복원. 매칭은 로컬에서 수행하므로 API 지연 영향 없음.
 *
 *  PolicyFundMatchCard(대시보드)와 GuidesView(펀딩페이지)에서 공용 — 같은 store 라
 *  한쪽에서 입력하면 양쪽 매칭에 즉시 반영(SSOT).
 */
import { useProfileStore } from "../../stores/profile-store";

/** 변경 후 서버 background sync (fire-and-forget). KEK 미설정 시 조용히 무시. */
async function syncOwnerProfileToServer(profile: {
  birthYear?: number;
  ncbScore?: number;
  consideringClosure?: boolean;
  isDisabledOwner?: boolean;
}) {
  try {
    await fetch("/api/account/owner-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch {
    // 네트워크 오류 — 로컬값은 이미 저장됨, 다음 기기에서 동기화 시 재시도
  }
}

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
          const newVal = y >= 1900 && y <= thisYear ? y : undefined;
          setOwnerBirthYear(newVal);
          void syncOwnerProfileToServer({ birthYear: newVal, ncbScore: ownerNcbScore, consideringClosure: ownerConsideringClosure, isDisabledOwner: ownerIsDisabledOwner });
        }}
        style={chipStyle(ownerBirthYear != null)}
      >
        {ownerBirthYear != null ? `${ownerBirthYear}년생 · 만 ${age}세` : ko ? "출생연도 입력" : "Enter birth year"}
      </button>
      <button
        type="button"
        onClick={() => {
          const newVal = !ownerConsideringClosure;
          setOwnerConsideringClosure(newVal);
          void syncOwnerProfileToServer({ birthYear: ownerBirthYear, ncbScore: ownerNcbScore, consideringClosure: newVal, isDisabledOwner: ownerIsDisabledOwner });
        }}
        style={chipStyle(ownerConsideringClosure)}
      >
        {ko ? "폐업 검토 중" : "Considering closure"}
      </button>
      <button
        type="button"
        onClick={() => {
          const newVal = !ownerIsDisabledOwner;
          setOwnerIsDisabledOwner(newVal);
          void syncOwnerProfileToServer({ birthYear: ownerBirthYear, ncbScore: ownerNcbScore, consideringClosure: ownerConsideringClosure, isDisabledOwner: newVal });
        }}
        style={chipStyle(ownerIsDisabledOwner)}
      >
        {ko ? "장애인 사장님" : "Disabled owner"}
      </button>
      <button
        type="button"
        onClick={() => {
          const cur = ownerNcbScore != null ? String(ownerNcbScore) : "";
          const v = window.prompt(ko ? "NCB 신용점수 (선택, 모르면 취소)" : "NCB score (optional)", cur);
          if (v === null) return;
          const n = parseInt(v, 10);
          const newVal = n > 0 && n <= 1000 ? n : undefined;
          setOwnerNcbScore(newVal);
          void syncOwnerProfileToServer({ birthYear: ownerBirthYear, ncbScore: newVal, consideringClosure: ownerConsideringClosure, isDisabledOwner: ownerIsDisabledOwner });
        }}
        style={chipStyle(ownerNcbScore != null)}
      >
        {ownerNcbScore != null ? `NCB ${ownerNcbScore}` : ko ? "NCB 신용점수 입력" : "Enter NCB"}
      </button>
    </div>
  );
}
