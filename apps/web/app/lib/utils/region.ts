/**
 * 도로명 주소 → "구·군 + 동" 동네 라벨 파생 (2026-07-25 추출).
 *
 * 원본: CardNewsStudio 인라인 로직 — 마케팅 사례 엔진(v2 deliverables)도 지역이
 * 필요해져 공유 유틸로 추출. LLM 이 지역을 모르면 "○○동" 빈칸을 쓰는 사고의 근본 해결.
 * 예: "경기 성남시 분당구 정자일로 95" → "분당구 정자일로" 급 근사 라벨.
 */
export function deriveRegionFromAddress(addressRoad: string | null | undefined): string | undefined {
  const tokens = (addressRoad ?? "").trim().split(/\s+/);
  if (tokens.length < 2) return undefined;
  const gu = tokens.find((t) => /(구|군|시)$/.test(t) && t !== tokens[0]) ?? tokens[1];
  const dong = tokens.find((t) => /(동|로|가)$/.test(t));
  return [gu, dong].filter(Boolean).join(" ") || undefined;
}
