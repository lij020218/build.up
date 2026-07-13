/**
 * gen-job-duties-swift.mts
 * 웹 SSOT(team/job-duties.ts)의 고용형태·업종별 직무를 iOS Swift 레지스트리로 자동 생성.
 * 목적: 웹↔iOS 직무 목록 전사 오류 0 (웹→Swift codegen 원칙, [[feedback_web_to_swift_codegen]]).
 *
 * 실행: npx tsx scripts/gen-job-duties-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/JobDutyRegistry.swift
 */
import { writeFileSync } from "node:fs";

const mod = await import(
  new URL("../packages/shared/src/team/job-duties.ts", import.meta.url).href
);
type Duty = { key: string; ko: string; en: string };
const EMPLOYMENT_TYPES = mod.EMPLOYMENT_TYPES as Duty[];
const COMMON_DUTIES = mod.COMMON_DUTIES as Duty[];
const DUTIES_BY_CATEGORY = mod.DUTIES_BY_CATEGORY as Record<string, Duty[]>;

const s = (x: string) => `"${x.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const duty = (d: Duty) => `.init(key: ${s(d.key)}, ko: ${s(d.ko)}, en: ${s(d.en)})`;
const dutyList = (arr: Duty[], indent: string) =>
  arr.length === 0 ? "[]" : "[\n" + arr.map((d) => `${indent}${duty(d)},`).join("\n") + `\n${indent.slice(0, -4)}]`;

const employment = EMPLOYMENT_TYPES.map((e) => `        ${duty(e)},`).join("\n");
const common = COMMON_DUTIES.map((d) => `        ${duty(d)},`).join("\n");
const byCat = Object.entries(DUTIES_BY_CATEGORY)
  .map(([cat, arr]) => `        ${s(cat)}: ${dutyList(arr, "            ")},`)
  .join("\n");

const out = `//
//  JobDutyRegistry.swift — 직원 고용형태·업무 직무 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/team/job-duties.ts
//     재생성: npx tsx scripts/gen-job-duties-swift.mts
//

import Foundation

public struct BUJobDuty: Identifiable, Sendable, Equatable, Hashable {
    public let key: String
    public let ko: String
    public let en: String
    public var id: String { key }
    public init(key: String, ko: String, en: String) { self.key = key; self.ko = ko; self.en = en }
}

public struct BUEmploymentType: Identifiable, Sendable, Equatable {
    public let key: String
    public let ko: String
    public let en: String
    public var id: String { key }
    public init(key: String, ko: String, en: String) { self.key = key; self.ko = ko; self.en = en }
}

public enum JobDutyRegistry {

    public static let employmentTypes: [BUEmploymentType] = [
${employment}
    ]

    public static let commonDuties: [BUJobDuty] = [
${common}
    ]

    public static let dutiesByCategory: [String: [BUJobDuty]] = [
${byCat}
    ]

    /// 업종에 맞는 직무 목록 — category-specific 먼저, 공통 직무를 key 중복 없이 병합.
    public static func duties(for categoryId: String?) -> [BUJobDuty] {
        let specific = (categoryId.flatMap { dutiesByCategory[$0] }) ?? []
        let seen = Set(specific.map(\\.key))
        return specific + commonDuties.filter { !seen.contains($0.key) }
    }

    private static let allDuties: [String: BUJobDuty] = {
        var map: [String: BUJobDuty] = [:]
        for d in commonDuties + dutiesByCategory.values.flatMap({ $0 }) where map[d.key] == nil {
            map[d.key] = d
        }
        return map
    }()

    public static func dutyLabel(_ key: String, ko: Bool) -> String {
        guard let d = allDuties[key] else { return key }
        return ko ? d.ko : d.en
    }

    public static func employmentLabel(_ key: String?, ko: Bool) -> String? {
        guard let key, let t = employmentTypes.first(where: { $0.key == key }) else { return nil }
        return ko ? t.ko : t.en
    }
}
`;

const dest = new URL("../apps/ios/Sources/FoundOneCore/JobDutyRegistry.swift", import.meta.url);
writeFileSync(dest, out, "utf8");
console.log(`✅ JobDutyRegistry.swift 생성 — 고용형태 ${EMPLOYMENT_TYPES.length}종, 공통 직무 ${COMMON_DUTIES.length}, 업종 ${Object.keys(DUTIES_BY_CATEGORY).length}개`);
