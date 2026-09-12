/**
 * owner-address.ts — 사장님을 부르는 말 SSOT (2026-09-12).
 *
 * 사장님 지시: "김사장이라 하지 말고 님자를 꼭 붙여."
 *
 * 종전 문제: 인사말이 가입 시 입력한 이름을 **그대로** 출력했다.
 *  · 이름이 "김사장"이면 화면에 "저녁이에요, 김사장" — 존칭 없이 부르는 말이 됐다.
 *  · 웹 히어로는 사람 이름 대신 **상호**를 불렀다("성심당 본점, 오늘 정리할 때입니다").
 *
 * 규칙 (이 파일 한 곳):
 *  1. 이름이 없거나 이메일이면 → 업종별 호칭(사장님 / 대표님).
 *  2. 이미 "님"으로 끝나면 → 그대로 (중복 금지: "김사장님님" 방지).
 *  3. 그 밖에는 → 이름 + "님" ("김사장" → "김사장님", "김영희" → "김영희님").
 *
 * 영어는 존칭 접미사가 없으므로 이름을 그대로 쓰고, 없을 때만 호칭으로 대체한다.
 *
 * iOS 미러: apps/ios/Sources/FoundOneCore/OwnerAddress.swift
 *  (동기화 가드: apps/web/__tests__/owner-address-ios-sync.test.ts)
 */

/** 업종별 기본 호칭 — onboarding-profile 의 ownerTitle 과 같은 값을 넘겨 쓴다. */
export const DEFAULT_OWNER_TITLE_KO = "사장님";
export const DEFAULT_OWNER_TITLE_EN = "Founder";

/** 존칭 접미사. 이름 뒤에 붙이고, 이미 붙어 있으면 다시 붙이지 않는다. */
export const HONORIFIC_KO = "님";

/**
 * 화면에서 사장님을 부를 때 쓰는 문자열.
 *
 * @param rawName 가입·온보딩에서 받은 이름 (이메일이 들어오는 경우가 있어 걸러낸다)
 * @param fallbackTitle 이름이 없을 때 쓸 호칭 — 업종별 ownerTitle (기본 "사장님")
 */
export function ownerAddressKo(
  rawName: string | null | undefined,
  fallbackTitle: string = DEFAULT_OWNER_TITLE_KO,
): string {
  const name = (rawName ?? "").trim();
  // 이메일을 호칭으로 쓰면 "저녁이에요, a@b.com" 이 된다.
  if (!name || name.includes("@")) return fallbackTitle;
  if (name.endsWith(HONORIFIC_KO)) return name;
  return name + HONORIFIC_KO;
}

/** 영어 — 존칭 접미사가 없다. 이름이 없을 때만 호칭으로 대체. */
export function ownerAddressEn(
  rawName: string | null | undefined,
  fallbackTitle: string = DEFAULT_OWNER_TITLE_EN,
): string {
  const name = (rawName ?? "").trim();
  if (!name || name.includes("@")) return fallbackTitle;
  return name;
}

export function ownerAddress(
  rawName: string | null | undefined,
  opts: { ko: boolean; fallbackTitleKo?: string; fallbackTitleEn?: string } = { ko: true },
): string {
  return opts.ko
    ? ownerAddressKo(rawName, opts.fallbackTitleKo)
    : ownerAddressEn(rawName, opts.fallbackTitleEn);
}
