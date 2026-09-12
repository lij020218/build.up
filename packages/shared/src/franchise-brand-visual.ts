/**
 * franchise-brand-visual.ts — 프랜차이즈 목록 행의 "브랜드 아이덴티티" SSOT (2026-09-12).
 *
 * 문제: 목록이 1,633행인데 글자만 있어 어느 브랜드인지 스캔이 안 됐다. 아이콘이 필요하다.
 *
 * 아이콘 정책(3단계):
 *  1) 공식 로고 — scripts/gen-franchise-logos.mjs 가 **브랜드 공식 사이트**(우리 큐레이션 URL)에서
 *     apple-touch-icon·SVG 를 받아 96px 이상만 번들. 보유 목록이 franchise-logos.json.
 *  2) 없으면 **모노그램 타일** — 상호 첫 글자 + 업종 색. 흐린 16px 파비콘을 쓰느니 이게 낫다.
 *  3) 업종 색은 여기 한 곳에서 정의 — 웹(CSS)·iOS(Swift 미러, 동기화 테스트로 고정).
 *
 * 로고는 각사 상표다. 표시 목적은 "그 브랜드의 공정위 공개 데이터"를 가리키는 지칭(nominative use)
 * 이며, 제휴·보증을 뜻하지 않는다(화면 각주로도 고지).
 */

import franchiseLogoManifest from "./franchise-logos.json";

/** 아이콘 보유 브랜드 → 확장자("png"). 없으면 모노그램. */
export const FRANCHISE_LOGO_MANIFEST: Record<string, string> = franchiseLogoManifest as Record<string, string>;

/** 이 브랜드의 번들 로고 파일명(확장자 포함). 없으면 null. */
export function franchiseLogoFile(brandId: string): string | null {
  const ext = FRANCHISE_LOGO_MANIFEST[brandId];
  return ext ? `${brandId}.${ext}` : null;
}

/** 웹 정적 경로(public/franchise-logos). 없으면 null. */
export function franchiseLogoWebPath(brandId: string): string | null {
  const file = franchiseLogoFile(brandId);
  return file ? `/franchise-logos/${file}` : null;
}

/** iOS 번들 리소스 이름(확장자 제외). 없으면 null. */
export function franchiseLogoIosResource(brandId: string): string | null {
  return FRANCHISE_LOGO_MANIFEST[brandId] ? `flogo-${brandId}` : null;
}

/**
 * 모노그램 — 로고가 없을 때 타일에 넣을 1~2글자.
 *  · 한글/한자: 첫 글자 1개 (예: 메가커피 → 메)
 *  · 영문·숫자 시작: 3글자 이하는 통째로, 그보다 길면 앞 2글자 (예: BBQ → BBQ, Paris… → PA)
 *  · "(주)"·"㈜"·"주식회사" 로 시작하면 건너뛰고 실제 상호 첫 글자부터.
 */
export function franchiseMonogram(name: string): string {
  const cleaned = name
    // "(주)한솥" "㈜교촌" 처럼 법인 형태가 앞에 붙는 상호 → 괄호 묶음째 버리고 실제 상호부터
    .replace(/^\s*[(（][^)）]{0,6}[)）]\s*/u, "")
    .replace(/^\s*(?:㈜|주식회사|유한회사)\s*/u, "")
    .replace(/^[\s([{<'"“”‘’·\-–—]+/, "")
    .trim();
  if (!cleaned) return "?";
  const first = [...cleaned][0];
  if (/[A-Za-z0-9]/.test(first)) {
    const latin = cleaned.replace(/[^A-Za-z0-9]/g, "");
    if (!latin) return first.toUpperCase();
    // BBQ·CU·KFC 처럼 3글자 이하 상호는 잘라 쓰면 오히려 못 알아본다 → 통째로.
    return (latin.length <= 3 ? latin : latin.slice(0, 2)).toUpperCase();
  }
  return first;
}

export type BrandTint = {
  /** 타일 배경(연한 면) */
  bg: string;
  /** 모노그램 글자·업종 라벨 색(진한 면) */
  fg: string;
};

/**
 * 업종별 색 — 목록에서 업종을 "읽지 않고 알아보게" 하는 장치.
 * 채도를 낮춰 미드나잇 UI 와 싸우지 않게 했다. iOS 미러: FranchiseBrandVisual.swift
 * (동기화 가드: apps/web/__tests__/franchise-brand-visual-ios-sync.test.ts)
 */
export const FRANCHISE_CATEGORY_TINTS: Record<string, BrandTint> = {
  food: { bg: "#FFF1E8", fg: "#C2410C" },
  "cafe-dessert": { bg: "#F7F0E6", fg: "#8B5E34" },
  retail: { bg: "#EAF1FF", fg: "#2451B8" },
  beauty: { bg: "#FCEEF4", fg: "#B23A72" },
  fitness: { bg: "#E9F6EE", fg: "#1F7A45" },
  education: { bg: "#EEEEFB", fg: "#3B3BA8" },
  pet: { bg: "#E8F5F4", fg: "#1F7A78" },
  "living-service": { bg: "#EEF1F5", fg: "#445671" },
  space: { bg: "#F2EDFB", fg: "#6B3FA0" },
  "online-digital": { bg: "#E7F5FB", fg: "#1E6E96" },
  "startup-tech": { bg: "#ECEDFA", fg: "#191970" },
};

export const FRANCHISE_TINT_FALLBACK: BrandTint = { bg: "#EFEFF4", fg: "#3C3C43" };

export function franchiseTint(categoryId: string | null | undefined): BrandTint {
  return (categoryId && FRANCHISE_CATEGORY_TINTS[categoryId]) || FRANCHISE_TINT_FALLBACK;
}

/**
 * 폐점률 위험 밴드 — 색과 문구를 한 곳에서 정한다.
 * 공정위 기준으로 20%+ 는 계약 전 반드시 확인해야 할 수준.
 */
export type ClosureBand = "safe" | "watch" | "risk";

export function closureBand(ratePct: number | null | undefined): ClosureBand {
  if (ratePct == null || ratePct <= 0) return "safe";
  if (ratePct >= 20) return "risk";
  if (ratePct >= 10) return "watch";
  return "safe";
}
