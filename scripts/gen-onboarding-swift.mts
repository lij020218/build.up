/**
 * gen-onboarding-swift.mts
 * 웹 SSOT(onboarding-profile.ts + industry-revenue-benchmark.ts + starter-data 운영방식)를
 * iOS Swift 레지스트리로 자동 생성 — 온보딩 업종 분기·벤치마크 전사 오류 0.
 *
 * 실행: cd apps/web && npx tsx ../../scripts/gen-onboarding-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/OnboardingRegistry.swift
 */
import { writeFileSync } from "node:fs";

const profileMod = await import(new URL("../packages/shared/src/onboarding-profile.ts", import.meta.url).href);
const benchMod = await import(new URL("../packages/shared/src/industry-revenue-benchmark.ts", import.meta.url).href);
const starterMod = await import(new URL("../packages/shared/src/starter-data.ts", import.meta.url).href);
const i18nMod = await import(new URL("../packages/shared/src/i18n.ts", import.meta.url).href);

const PROFILES = profileMod.ONBOARDING_CATEGORY_PROFILES as Record<string, {
  placeNoun: { ko: string }; ownerTitle: { ko: string }; secondBandLabel: { ko: string };
  revenueLabel: { ko: string }; teamLabel: { ko: string };
  asks: { franchise: boolean; businessHours: boolean; address: string };
  revenueSyncCta: string;
}>;
const BANDS = benchMod.REVENUE_BANDS as Array<{ id: string; minManwon: number; maxManwon: number | null; label: { ko: string } }>;
const BENCH = benchMod.CATEGORY_REVENUE_BENCHMARK as Record<string, { kstatIndustry: string; annualRevenueMillionKrw: number; monthlyRevenueManwon: number } | null>;
const SOURCE = benchMod.REVENUE_BENCHMARK_SOURCE as { name: string; publisher: string };

const s = (x: string) => `"${x.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const profileLines = Object.entries(PROFILES).map(([cat, p]) =>
  `        ${s(cat)}: .init(placeNoun: ${s(p.placeNoun.ko)}, ownerTitle: ${s(p.ownerTitle.ko)}, secondBandLabel: ${s(p.secondBandLabel.ko)}, revenueLabel: ${s(p.revenueLabel.ko)}, teamLabel: ${s(p.teamLabel.ko)}, asksFranchise: ${p.asks.franchise}, asksBusinessHours: ${p.asks.businessHours}, addressAsk: ${s(p.asks.address)}, revenueSyncCta: ${s(p.revenueSyncCta)}),`,
).join("\n");

const bandLines = BANDS.map((b) =>
  `        .init(id: ${s(b.id)}, minManwon: ${b.minManwon}, maxManwon: ${b.maxManwon === null ? "nil" : b.maxManwon}, labelKo: ${s(b.label.ko)}),`,
).join("\n");

const benchLines = Object.entries(BENCH).map(([cat, b]) =>
  b
    ? `        ${s(cat)}: .init(kstatIndustry: ${s(b.kstatIndustry)}, annualRevenueMillionKrw: ${b.annualRevenueMillionKrw}, monthlyRevenueManwon: ${b.monthlyRevenueManwon}),`
    : `        ${s(cat)}: nil,`,
).join("\n");

const categories = Object.keys(PROFILES);
const bmLines = categories.map((cat) => {
  const options = (starterMod.getStarterBusinessModelOptions(cat) as Array<{ id: string; title: string }>).map(
    (raw) => {
      const ko = i18nMod.localizeRecommendationItem(raw, "ko") as { title: string };
      return `            .init(id: ${s(raw.id)}, titleKo: ${s(ko.title)}),`;
    },
  );
  return `        ${s(cat)}: [\n${options.join("\n")}\n        ],`;
}).join("\n");

const out = `//
//  OnboardingRegistry.swift — 기존 사업자 온보딩 업종 분기·벤치마크 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/onboarding-profile.ts · industry-revenue-benchmark.ts · starter-data.ts
//     재생성: cd apps/web && npx tsx ../../scripts/gen-onboarding-swift.mts
//
//  원칙 (2026-07-28 사장님 지시): "SaaS 에 프랜차이즈·쿠팡이츠 질문 금지 — 업종에 맞는 채널·용어".
//  벤치마크는 ${SOURCE.publisher} ${SOURCE.name} 원문 수치 — 평균 3단 비교(위/겹침/아래)만 허용.
//

import Foundation

public struct BUOnboardingProfile: Sendable {
    public let placeNoun: String
    public let ownerTitle: String
    public let secondBandLabel: String
    public let revenueLabel: String
    public let teamLabel: String
    public let asksFranchise: Bool
    public let asksBusinessHours: Bool
    public let addressAsk: String     // "required" | "optional" | "skip"
    public let revenueSyncCta: String // "pos" | "ecommerce-csv" | "saas-metrics"
}

public struct BURevenueBand: Sendable, Identifiable {
    public var id: String { bandId }
    public let bandId: String
    public let minManwon: Int
    public let maxManwon: Int?
    public let labelKo: String
    init(id: String, minManwon: Int, maxManwon: Int?, labelKo: String) {
        self.bandId = id; self.minManwon = minManwon; self.maxManwon = maxManwon; self.labelKo = labelKo
    }
}

public struct BURevenueBenchmark: Sendable {
    public let kstatIndustry: String
    public let annualRevenueMillionKrw: Int
    public let monthlyRevenueManwon: Int
}

public struct BUBusinessModelOption: Sendable, Identifiable {
    public var id: String { optionId }
    public let optionId: String
    public let titleKo: String
    init(id: String, titleKo: String) { self.optionId = id; self.titleKo = titleKo }
}

public enum BUOnboardingRegistry {
    public static let benchmarkSourceKo = ${s(`${SOURCE.publisher} ${SOURCE.name}`)}

    static let profiles: [String: BUOnboardingProfile] = [
${profileLines}
    ]

    private static let defaultProfile = BUOnboardingProfile(
        placeNoun: "가게", ownerTitle: "사장님", secondBandLabel: "가족과",
        revenueLabel: "월매출", teamLabel: "함께 일하는 사람",
        asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"
    )

    public static func profile(for categoryId: String?) -> BUOnboardingProfile {
        guard let categoryId, let p = profiles[categoryId] else { return defaultProfile }
        return p
    }

    public static let revenueBands: [BURevenueBand] = [
${bandLines}
    ]

    static let benchmarks: [String: BURevenueBenchmark?] = [
${benchLines}
    ]

    public static func benchmark(for categoryId: String?) -> BURevenueBenchmark? {
        guard let categoryId else { return nil }
        return benchmarks[categoryId] ?? nil
    }

    /// 구간 vs 업종 평균 — 3단 판정만 (평균값이라 분위 주장 금지). nil = 벤치마크 없음(카드 미표시)
    public static func comparePosition(categoryId: String?, bandId: String?) -> (position: String, benchmark: BURevenueBenchmark)? {
        guard let benchmark = benchmark(for: categoryId),
              let band = revenueBands.first(where: { $0.bandId == bandId }) else { return nil }
        let avg = benchmark.monthlyRevenueManwon
        if band.minManwon > avg { return ("above", benchmark) }
        if let max = band.maxManwon, max < avg { return ("below", benchmark) }
        return ("overlaps", benchmark)
    }

    static let businessModels: [String: [BUBusinessModelOption]] = [
${bmLines}
    ]

    public static func businessModelOptions(for categoryId: String?) -> [BUBusinessModelOption] {
        businessModels[categoryId ?? "food"] ?? businessModels["food"] ?? []
    }
}
`;

const target = new URL("../apps/ios/Sources/FoundOneCore/OnboardingRegistry.swift", import.meta.url);
writeFileSync(target, out);
console.log(`generated: ${target.pathname} (${categories.length} profiles, ${BANDS.length} bands)`);
