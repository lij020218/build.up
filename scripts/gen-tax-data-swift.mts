/**
 * gen-tax-data-swift.mts
 * 웹 SSOT(tax-credits.ts·tax-calendar.ts)를 iOS Swift 레지스트리로 자동 생성.
 * 목적: 세액공제 70종 매핑 + 공통 4종 + 세금 일정을 전사 오류 0 으로 미러 (웹→Swift codegen 원칙).
 *   ⚠️ 세금 데이터는 손유지 불가(70종) → codegen 필수. tax-estimate 계산 로직은 별도 수기 포팅.
 *
 * 실행: npx tsx scripts/gen-tax-data-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/TaxDataRegistry.swift
 */
import { writeFileSync } from "node:fs";

const credits = await import(new URL("../packages/shared/src/finance/tax-credits.ts", import.meta.url).href);
const calendar = await import(new URL("../packages/shared/src/finance/tax-calendar.ts", import.meta.url).href);

type CommonBenefit = { id: string; titleKo: string; summaryKo: string; basis: string; sunset: string | null; link?: string };
type SpecialtyMapping = { specialtyId: string; categoryId: string; ksicHint: string; startupReduction: string; specialReduction: string; note: string };
type TaxEvent = { id: string; category: string; title: string; description: string; month: number; day: number; appliesToSimplified?: boolean; requiresEmployees?: boolean };

const COMMON = credits.COMMON_TAX_BENEFITS as CommonBenefit[];
const SPECIALTY = credits.SPECIALTY_TAX_MAPPINGS as SpecialtyMapping[];
const EVENTS = calendar.TAX_EVENTS as TaxEvent[];

const q = (s: string | null | undefined) => (s == null ? "nil" : `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
const qReq = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const commonRecords = COMMON.map((b) => `        .init(
            id: ${qReq(b.id)},
            titleKo: ${qReq(b.titleKo)},
            summaryKo: ${qReq(b.summaryKo)},
            basis: ${qReq(b.basis)},
            sunset: ${q(b.sunset)},
            link: ${q(b.link)}
        ),`).join("\n");

const specialtyRecords = SPECIALTY.map((m) => `        .init(
            specialtyId: ${qReq(m.specialtyId)},
            categoryId: ${qReq(m.categoryId)},
            ksicHint: ${qReq(m.ksicHint)},
            startupReduction: .${m.startupReduction},
            specialReduction: .${m.specialReduction},
            note: ${qReq(m.note)}
        ),`).join("\n");

const eventRecords = EVENTS.map((e) => `        .init(
            id: ${qReq(e.id)},
            category: ${qReq(e.category)},
            title: ${qReq(e.title)},
            description: ${qReq(e.description)},
            month: ${e.month},
            day: ${e.day},
            appliesToSimplified: ${e.appliesToSimplified ? "true" : "false"},
            requiresEmployees: ${e.requiresEmployees ? "true" : "false"}
        ),`).join("\n");

const swift = `// ⚠️ 자동 생성 파일 — 직접 수정 금지. \`npx tsx scripts/gen-tax-data-swift.mts\` 로 재생성.
//    웹 SSOT: packages/shared/src/finance/tax-credits.ts · tax-calendar.ts
//    세액공제 자격·감면율·일정은 참고용(세무 자문 아님) — 최종은 홈택스·세무사.

import Foundation

public enum TaxEligibilityLevel: String, Sendable {
    case eligible   // 조문 명시 확정
    case likely     // 대표코드상 해당 추정
    case check      // 업종분류 애매 — 세무사 확인
    case excluded   // 대상 아님

    /// 카드 노출 여부 (eligible/likely 만 "받을 가능성" 으로 노출, check/excluded 는 확인안내).
    public var isSurfaced: Bool { self == .eligible || self == .likely }
}

public struct CommonTaxBenefit: Sendable, Identifiable {
    public let id: String
    public let titleKo: String
    public let summaryKo: String
    public let basis: String
    public let sunset: String?
    public let link: String?
}

public struct SpecialtyTaxMapping: Sendable {
    public let specialtyId: String
    public let categoryId: String
    public let ksicHint: String
    public let startupReduction: TaxEligibilityLevel
    public let specialReduction: TaxEligibilityLevel
    public let note: String
}

public struct TaxScheduleEvent: Sendable, Identifiable {
    public let id: String
    public let category: String
    public let title: String
    public let description: String
    public let month: Int
    public let day: Int
    public let appliesToSimplified: Bool
    public let requiresEmployees: Bool
}

public enum TaxDataRegistry {
    /// 전 업종 공통 세액공제·소득공제 (개인사업자).
    public static let common: [CommonTaxBenefit] = [
${commonRecords}
    ]

    /// 세부업종 70종 × 조특법 §6/§7 자격 매핑.
    public static let specialty: [SpecialtyTaxMapping] = [
${specialtyRecords}
    ]

    /// 세금 신고 일정 (부가세·종소세·원천세 등).
    public static let events: [TaxScheduleEvent] = [
${eventRecords}
    ]

    /// specialtyId 우선, 없으면 categoryId 대표값 폴백.
    public static func mapping(specialtyId: String?, categoryId: String?) -> SpecialtyTaxMapping? {
        if let sid = specialtyId, let exact = specialty.first(where: { $0.specialtyId == sid }) {
            return exact
        }
        if let cid = categoryId {
            return specialty.first(where: { $0.categoryId == cid })
        }
        return nil
    }
}
`;

const dest = new URL("../apps/ios/Sources/FoundOneCore/TaxDataRegistry.swift", import.meta.url);
writeFileSync(dest, swift, "utf8");
console.log(`generated TaxDataRegistry.swift — common ${COMMON.length}, specialty ${SPECIALTY.length}, events ${EVENTS.length}`);
