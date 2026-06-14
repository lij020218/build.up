/**
 * gen-interior-2026-swift.mts
 * 웹 SSOT(sub-industry-interior-2026.ts)의 세부업종별 2026 인테리어 보강 데이터를
 * iOS Swift 레지스트리로 자동 생성. 목적: 54개 레코드 전사 오류 0 (웹→Swift codegen 원칙).
 *
 * 실행: npx tsx scripts/gen-interior-2026-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/ConstructionSubIndustryInterior2026Registry.swift
 *
 * 주의: _digital-home-office-note 는 매장 인테리어가 없는 온라인 업종 공통 노트라 생성 제외
 *       (해당 업종은 construction-setup 단계를 거치지 않음).
 */
import { writeFileSync } from "node:fs";

const mod = await import(
  new URL("../apps/web/app/lib/components/stages/offline/sub-industry-interior-2026.ts", import.meta.url).href
);

type Trend = { titleKo: string; descKo: string; sourceKo: string };
type Furniture = { itemKo: string; descKo: string };
type Brand = { nameKo: string; noteKo: string; sourceKo?: string };
type Firm = { nameKo: string; typeKo: string; noteKo: string; sourceKo?: string };
type Entry = {
  noteKo?: string;
  colorTrend2026?: { nameKo: string; descKo: string; sourceKo: string };
  trends2026: Trend[];
  furniture: Furniture[];
  furnitureBrands: Brand[];
  specialistFirms?: Firm[];
  caveatKo: string;
};

const DATA = mod.SUB_INDUSTRY_INTERIOR_2026 as Record<string, Entry>;

const s = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
const opt = (v: string | undefined) => (v == null ? "nil" : s(v));

function colorTrend(e: Entry): string {
  if (!e.colorTrend2026) return "nil";
  const c = e.colorTrend2026;
  return `.init(nameKo: ${s(c.nameKo)}, descKo: ${s(c.descKo)}, sourceKo: ${s(c.sourceKo)})`;
}
function trends(e: Entry): string {
  if (!e.trends2026?.length) return "[]";
  return "[\n" + e.trends2026.map((t) =>
    `                .init(titleKo: ${s(t.titleKo)}, descKo: ${s(t.descKo)}, sourceKo: ${s(t.sourceKo)}),`
  ).join("\n") + "\n            ]";
}
function furniture(e: Entry): string {
  if (!e.furniture?.length) return "[]";
  return "[\n" + e.furniture.map((f) =>
    `                .init(itemKo: ${s(f.itemKo)}, descKo: ${s(f.descKo)}),`
  ).join("\n") + "\n            ]";
}
function brands(e: Entry): string {
  if (!e.furnitureBrands?.length) return "[]";
  return "[\n" + e.furnitureBrands.map((b) =>
    `                .init(nameKo: ${s(b.nameKo)}, noteKo: ${s(b.noteKo)}, sourceKo: ${opt(b.sourceKo)}),`
  ).join("\n") + "\n            ]";
}
function firms(e: Entry): string {
  if (!e.specialistFirms?.length) return "[]";
  return "[\n" + e.specialistFirms.map((f) =>
    `                .init(nameKo: ${s(f.nameKo)}, typeKo: ${s(f.typeKo)}, noteKo: ${s(f.noteKo)}, sourceKo: ${opt(f.sourceKo)}),`
  ).join("\n") + "\n            ]";
}

const keys = Object.keys(DATA).filter((k) => !k.startsWith("_")).sort();

const records = keys.map((k) => {
  const e = DATA[k];
  return `        ${s(k)}: .init(
            colorTrend: ${colorTrend(e)},
            trends: ${trends(e)},
            furniture: ${furniture(e)},
            brands: ${brands(e)},
            firms: ${firms(e)},
            caveatKo: ${s(e.caveatKo)}
        ),`;
}).join("\n");

const out = `//
//  ConstructionSubIndustryInterior2026Registry.swift — 세부업종 2026 인테리어 보강 (웹 SSOT 자동 생성 미러)
//
//  ⚠️ 웹 SSOT: apps/web/.../offline/sub-industry-interior-2026.ts → SUB_INDUSTRY_INTERIOR_2026.
//             scripts/gen-interior-2026-swift.mts 로 파싱·생성 (수동 편집 금지).
//             모든 트렌드/브랜드/업체는 출처(sourceKo) 명시·실재 확인. "참고용·검증 권장"(caveatKo).
//
//  생성 레코드: ${keys.length}개 세부업종 (온라인 업종 _digital-home-office-note 제외).
//

import Foundation

public enum ConstructionSubIndustryInterior2026Registry {
    public struct ColorTrend: Sendable, Hashable {
        public let nameKo: String; public let descKo: String; public let sourceKo: String
        public init(nameKo: String, descKo: String, sourceKo: String) { self.nameKo = nameKo; self.descKo = descKo; self.sourceKo = sourceKo }
    }
    public struct Trend: Sendable, Hashable {
        public let titleKo: String; public let descKo: String; public let sourceKo: String
        public init(titleKo: String, descKo: String, sourceKo: String) { self.titleKo = titleKo; self.descKo = descKo; self.sourceKo = sourceKo }
    }
    public struct Furniture: Sendable, Hashable {
        public let itemKo: String; public let descKo: String
        public init(itemKo: String, descKo: String) { self.itemKo = itemKo; self.descKo = descKo }
    }
    public struct Brand: Sendable, Hashable {
        public let nameKo: String; public let noteKo: String; public let sourceKo: String?
        public init(nameKo: String, noteKo: String, sourceKo: String?) { self.nameKo = nameKo; self.noteKo = noteKo; self.sourceKo = sourceKo }
    }
    public struct Firm: Sendable, Hashable {
        public let nameKo: String; public let typeKo: String; public let noteKo: String; public let sourceKo: String?
        public init(nameKo: String, typeKo: String, noteKo: String, sourceKo: String?) { self.nameKo = nameKo; self.typeKo = typeKo; self.noteKo = noteKo; self.sourceKo = sourceKo }
    }
    public struct Entry: Sendable, Hashable {
        public let colorTrend: ColorTrend?
        public let trends: [Trend]
        public let furniture: [Furniture]
        public let brands: [Brand]
        public let firms: [Firm]
        public let caveatKo: String
        public init(colorTrend: ColorTrend?, trends: [Trend], furniture: [Furniture], brands: [Brand], firms: [Firm], caveatKo: String) {
            self.colorTrend = colorTrend; self.trends = trends; self.furniture = furniture; self.brands = brands; self.firms = firms; self.caveatKo = caveatKo
        }
    }

    public static func entry(forSpecialty id: String) -> Entry? { entries[id] }

    private static let entries: [String: Entry] = [
${records}
    ]
}
`;

const dest = new URL("../apps/ios/Sources/FoundOneCore/ConstructionSubIndustryInterior2026Registry.swift", import.meta.url);
writeFileSync(dest, out, "utf8");
console.log(`generated ${keys.length} entries → ConstructionSubIndustryInterior2026Registry.swift (${out.length} bytes)`);
