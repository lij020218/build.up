/**
 * gen-expert-checkpoints-swift.mts
 * 웹 SSOT(expert-checkpoints.ts)의 전문가 체크포인트를 iOS Swift 레지스트리로 자동 생성.
 * 목적: 웹↔iOS 단계 매핑·문구·채널 전사 오류 0 (웹→Swift codegen 원칙).
 *
 * 실행: cd apps/web && npx tsx ../../scripts/gen-expert-checkpoints-swift.mts
 * 출력: apps/ios/Sources/FoundOneCore/ExpertCheckpointRegistry.swift
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/expert-checkpoints.ts", import.meta.url).href);

type Channel = { key: string; nameKo: string; nameEn: string; free?: boolean; phone?: string; url?: string; nearbyQuery?: string };
type Checkpoint = { stageIds: string[]; expert: { ko: string; en: string }; when: { ko: string; en: string }[]; channels: Channel[] };
const CHECKPOINTS = mod.EXPERT_CHECKPOINTS as Checkpoint[];

const s = (x: string) => `"${x.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const opt = (x?: string) => (x ? s(x) : "nil");

const channel = (c: Channel) =>
  `.init(key: ${s(c.key)}, nameKo: ${s(c.nameKo)}, free: ${c.free ? "true" : "false"}, phone: ${opt(c.phone)}, url: ${opt(c.url)}, nearbyQuery: ${opt(c.nearbyQuery)})`;

const cp = (c: Checkpoint) => `        .init(
            stageIds: [${c.stageIds.map(s).join(", ")}],
            expertKo: ${s(c.expert.ko)},
            whensKo: [${c.when.map((w) => s(w.ko)).join(", ")}],
            channels: [
${c.channels.map((ch) => `                ${channel(ch)},`).join("\n")}
            ]
        ),`;

const out = `//
//  ExpertCheckpointRegistry.swift — 전문가 체크포인트 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/expert-checkpoints.ts
//     재생성: cd apps/web && npx tsx ../../scripts/gen-expert-checkpoints-swift.mts
//

import Foundation

public struct BUExpertChannel: Sendable, Identifiable {
    public var id: String { key }
    public let key: String
    public let nameKo: String
    public let free: Bool
    public let phone: String?
    public let url: String?
    public let nearbyQuery: String?
}

public struct BUExpertCheckpoint: Sendable {
    public let stageIds: [String]
    public let expertKo: String
    public let whensKo: [String]
    public let channels: [BUExpertChannel]
}

public enum BUExpertCheckpoints {
    public static let all: [BUExpertCheckpoint] = [
${CHECKPOINTS.map(cp).join("\n")}
    ]

    /// stageId(케밥)·code(스네이크) 겸용 조회 — 없으면 nil (해당 단계 미노출).
    public static func checkpoint(for stageId: String?) -> BUExpertCheckpoint? {
        guard let stageId, !stageId.isEmpty else { return nil }
        let normalized = stageId.replacingOccurrences(of: "_", with: "-")
        return all.first { $0.stageIds.contains(normalized) }
    }

    /// 네이버 지도 검색 URL — 동네가 있으면 지역 한정 (웹 nearbySearchUrl 정합).
    public static func nearbySearchUrl(query: String, region: String?) -> URL? {
        let q = [region?.trimmingCharacters(in: .whitespaces), query]
            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
        let encoded = q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q
        return URL(string: "https://map.naver.com/p/search/\\(encoded)")
    }
}
`;

const dest = new URL("../apps/ios/Sources/FoundOneCore/ExpertCheckpointRegistry.swift", import.meta.url);
writeFileSync(dest, out, "utf8");
console.log(`generated ExpertCheckpointRegistry.swift — checkpoints:${CHECKPOINTS.length}`);
