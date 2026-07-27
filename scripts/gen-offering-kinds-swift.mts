/**
 * gen-offering-kinds-swift.mts
 * 웹 SSOT(offering-kinds.ts)의 오퍼링 유형 분류를 iOS Swift 레지스트리로 자동 생성.
 * 목적: 웹↔iOS 70개 세부업종 분류·라벨 전사 오류 0 (웹→Swift codegen 원칙).
 *
 * 실행: npx tsx scripts/gen-offering-kinds-swift.mts   (tsx 는 apps/web devDep — cd apps/web 후 실행 가능)
 * 출력: apps/ios/Sources/FoundOneCore/OfferingKindsRegistry.swift
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/offering-kinds.ts", import.meta.url).href);

type Meta = {
  kind: string;
  tabLabel: { ko: string; en: string };
  unitLabel: { ko: string; en: string };
  pageSub: { ko: string; en: string };
  stockSection: string;
  showCostRatio: boolean;
  showSalesCount: boolean;
};
const SUB = mod.SUB_INDUSTRY_OFFERING as Record<string, { kind: string; flags?: Record<string, boolean> }>;
const FALLBACK = mod.CATEGORY_OFFERING_FALLBACK as Record<string, string>;
const META = mod.OFFERING_KIND_META as Record<string, Meta>;

const s = (x: string) => `"${x.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const subLines = Object.entries(SUB)
  .map(([id, v]) => `        ${s(id)}: ${s(v.kind)},`)
  .join("\n");
const fallbackLines = Object.entries(FALLBACK)
  .map(([cat, kind]) => `        ${s(cat)}: ${s(kind)},`)
  .join("\n");
const metaLines = Object.values(META)
  .map((m) =>
    `        ${s(m.kind)}: .init(kind: ${s(m.kind)}, tabLabelKo: ${s(m.tabLabel.ko)}, tabLabelEn: ${s(m.tabLabel.en)}, unitLabelKo: ${s(m.unitLabel.ko)}, unitLabelEn: ${s(m.unitLabel.en)}, pageSubKo: ${s(m.pageSub.ko)}, pageSubEn: ${s(m.pageSub.en)}, stockSection: ${s(m.stockSection)}, showCostRatio: ${m.showCostRatio}, showSalesCount: ${m.showSalesCount}),`,
  )
  .join("\n");

const out = `//
//  OfferingKindsRegistry.swift — 오퍼링(내가 파는 것) 유형 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/offering-kinds.ts
//     재생성: npx tsx scripts/gen-offering-kinds-swift.mts
//

import Foundation

public struct BUOfferingKindMeta: Sendable {
    public let kind: String
    public let tabLabelKo: String
    public let tabLabelEn: String
    public let unitLabelKo: String
    public let unitLabelEn: String
    public let pageSubKo: String
    public let pageSubEn: String
    public let stockSection: String   // "none" | "core" | "optional"
    public let showCostRatio: Bool
    public let showSalesCount: Bool
}

public enum BUOfferingKinds {
    /// 세부업종 id → 유형 (70개 전수 — 웹과 동일)
    public static let subIndustryKind: [String: String] = [
${subLines}
    ]

    /// 대분류 폴백 (세부업종 미선택 시)
    public static let categoryFallback: [String: String] = [
${fallbackLines}
    ]

    public static let meta: [String: BUOfferingKindMeta] = [
${metaLines}
    ]

    /// 세부업종(우선) → 대분류 폴백. 못 찾으면 menu-bom (웹 resolveOfferingKind 정합).
    public static func resolve(subIndustryId: String?, categoryId: String?) -> String {
        if let sub = subIndustryId, let k = subIndustryKind[sub] { return k }
        if let cat = categoryId, let k = categoryFallback[cat] { return k }
        return "menu-bom"
    }

    /// hidden 업종은 오퍼링 탭 미노출 (웹 offeringTabVisible 정합)
    public static func tabVisible(subIndustryId: String?, categoryId: String?) -> Bool {
        resolve(subIndustryId: subIndustryId, categoryId: categoryId) != "hidden"
    }

    public static func metaFor(_ kind: String) -> BUOfferingKindMeta? { meta[kind] }
}
`;

const dest = new URL("../apps/ios/Sources/FoundOneCore/OfferingKindsRegistry.swift", import.meta.url);
writeFileSync(dest, out, "utf8");
console.log(`generated OfferingKindsRegistry.swift — sub:${Object.keys(SUB).length} fallback:${Object.keys(FALLBACK).length} meta:${Object.keys(META).length}`);
