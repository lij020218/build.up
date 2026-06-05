/**
 * gen-franchise-benchmark-swift.mts
 * 웹 SSOT(franchise-benchmarks.ts)의 브랜드별 벤치마크를 iOS Swift 레지스트리로 자동 생성.
 * 목적: 40개 레코드 전사 오류 0 (웹→Swift codegen 원칙).
 *
 * 실행: npx tsx scripts/gen-franchise-benchmark-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/FranchiseBenchmarkRegistry.swift
 *
 * 주의: costStructure·regionalVariance 는 iOS 카드에서 미렌더라 생성 제외(필요 시 확장).
 */
import { writeFileSync } from "node:fs";
// 정적 named import 가 tsx ESM 로더와 충돌하여 동적 import 사용 (런타임 정상).
const mod = await import(
  new URL("../packages/shared/src/knowledge/franchise-benchmarks.ts", import.meta.url).href
);
const getAllFranchiseBenchmarks = mod.getAllFranchiseBenchmarks as () => Array<{
  brandId: string;
  avgMonthlyRevenue: number;
  topStoreMonthlyRevenue: number;
  topStoreMultiplier: number;
  operationalInsights: string[];
  yearReported?: number;
  isEstimate?: boolean;
}>;
const FRANCHISE_BENCHMARK_PROVENANCE = mod.FRANCHISE_BENCHMARK_PROVENANCE as {
  source: string;
  disclosureYear: number;
  modeledNoteKo: string;
  estimateNoteKo: string;
};

const swiftStr = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const swiftArr = (arr: string[], indent: string) =>
  arr.length === 0
    ? "[]"
    : "[\n" + arr.map((s) => `${indent}    ${swiftStr(s)},`).join("\n") + `\n${indent}]`;

const benches = getAllFranchiseBenchmarks();

const records = benches
  .map((b) => {
    const yr = b.yearReported != null ? `${b.yearReported}` : "nil";
    const est = b.isEstimate ? "true" : "false";
    return `        .init(
            brandId: ${swiftStr(b.brandId)},
            avgMonthlyRevenue: ${b.avgMonthlyRevenue},
            topStoreMonthlyRevenue: ${b.topStoreMonthlyRevenue},
            topStoreMultiplier: ${b.topStoreMultiplier},
            operationalInsights: ${swiftArr(b.operationalInsights, "            ")},
            yearReported: ${yr},
            isEstimate: ${est}
        ),`;
  })
  .join("\n");

const P = FRANCHISE_BENCHMARK_PROVENANCE;

const out = `//
//  FranchiseBenchmarkRegistry.swift — 브랜드별 매출 벤치마크 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//  생성기: scripts/gen-franchise-benchmark-swift.mts
//  웹 SSOT: packages/shared/src/knowledge/franchise-benchmarks.ts (FRANCHISE_BENCHMARKS)
//  변경은 웹 SSOT 수정 후 \`npx tsx scripts/gen-franchise-benchmark-swift.mts\` 재실행.
//
//  ⚠️ 정직성: topStoreMonthlyRevenue 는 평균×배수 모델 추정치(실측 아님).
//     isEstimate=true 는 공개 정보공개서 매출이 없어 업계 자료로 추정한 브랜드.
//  (costStructure·regionalVariance 는 iOS 미렌더라 생성 제외)
//

import Foundation

public struct FranchiseBenchmark: Sendable, Equatable {
    public let brandId: String
    public let avgMonthlyRevenue: Int       // 만원 — 정보공개서 가맹점 평균매출 기반
    public let topStoreMonthlyRevenue: Int  // 만원 — ⚠️ 평균×배수 모델 추정치 (실측 아님)
    public let topStoreMultiplier: Double
    public let operationalInsights: [String]
    public let yearReported: Int?
    public let isEstimate: Bool
}

/// 벤치마크 출처/시점 메타 — 웹 FRANCHISE_BENCHMARK_PROVENANCE 1:1.
public enum FranchiseBenchmarkProvenance {
    public static let source = ${swiftStr(P.source)}
    public static let disclosureYear = ${P.disclosureYear}
    public static let modeledNoteKo = ${swiftStr(P.modeledNoteKo)}
    public static let estimateNoteKo = ${swiftStr(P.estimateNoteKo)}
}

public enum FranchiseBenchmarkRegistry {

    /// 웹 FRANCHISE_BENCHMARKS 1:1 (${benches.length} 브랜드).
    static let all: [FranchiseBenchmark] = [
${records}
    ]

    private static let map: [String: FranchiseBenchmark] = {
        var m: [String: FranchiseBenchmark] = [:]
        for b in all { m[b.brandId] = b }
        return m
    }()

    /// 웹 getFranchiseBenchmark(brandId) 1:1.
    public static func benchmark(brandId: String) -> FranchiseBenchmark? {
        map[brandId]
    }
}
`;

const outPath = new URL(
  "../apps/ios/Sources/FoundOneCore/FranchiseBenchmarkRegistry.swift",
  import.meta.url
);
writeFileSync(outPath, out, "utf8");
console.log(`✓ generated ${benches.length} franchise benchmarks → FranchiseBenchmarkRegistry.swift`);
