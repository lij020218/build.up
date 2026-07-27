"use client";

/**
 * 전문가 체크포인트 카드 (2026-07-27) — 로드맵 단계 공통 주입.
 *
 * SSOT: @foundone/shared expert-checkpoints.ts. iOS 미러: BUExpertCheckpointCard(codegen 레지스트리).
 * 원칙: 겁주기 없는 시점 안내 — "이런 경우엔 확인을 권장" + 무료 공공 채널 우선,
 *       내 주변 찾기(네이버 지도 — 평점·리뷰는 지도가 표시)는 후순위.
 * 배치: CurrentStageView 헤더 직후 — body 종류(selection/contract/guide/task) 무관 공통.
 */

import { useMemo } from "react";
import { Phone, ExternalLink, MapPin } from "lucide-react";
import { expertCheckpointForStage, nearbySearchUrl, type ExpertChannel } from "@foundone/shared";
import { useStoreInfoStore } from "../stores/store-info-store";
import { deriveRegionFromAddress } from "../utils/region";

const MIDNIGHT = "#191970";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

function ChannelPill({ ch, region, ko }: { ch: ExpertChannel; region?: string; ko: boolean }) {
  const label = ko ? ch.nameKo : ch.nameEn;
  const pillStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 12px", borderRadius: 11,
    border: "1px solid rgba(25,25,112,0.16)", background: "rgba(25,25,112,0.03)",
    color: INK, fontSize: 12.5, fontWeight: 650, textDecoration: "none", whiteSpace: "nowrap",
  };
  const freeBadge = ch.free && (
    <span style={{ fontSize: 9.5, fontWeight: 750, padding: "1px 6px", borderRadius: 8, background: "rgba(25,25,112,0.08)", color: MIDNIGHT }}>
      {ko ? "무료" : "Free"}
    </span>
  );

  // 전화 1급 — 번호는 정부 URL보다 부패에 강하다
  if (ch.phone) {
    return (
      <a href={`tel:${ch.phone}`} style={pillStyle}>
        <Phone size={11} strokeWidth={2.2} color={MIDNIGHT} />
        {label} {ch.phone}
        {freeBadge}
      </a>
    );
  }
  if (ch.nearbyQuery) {
    return (
      <a href={nearbySearchUrl(ch.nearbyQuery, region)} target="_blank" rel="noopener noreferrer" style={pillStyle}>
        <MapPin size={11} strokeWidth={2.2} color={MIDNIGHT} />
        {label}
        <ExternalLink size={10} strokeWidth={2.2} style={{ opacity: 0.6 }} />
      </a>
    );
  }
  return (
    <a href={ch.url} target="_blank" rel="noopener noreferrer" style={pillStyle}>
      {label}
      {freeBadge}
      <ExternalLink size={10} strokeWidth={2.2} style={{ opacity: 0.6 }} />
    </a>
  );
}

export function ExpertCheckpointCard({ stageCode, ko }: { stageCode: string | null | undefined; ko: boolean }) {
  const checkpoint = expertCheckpointForStage(stageCode);
  const addressRoad = useStoreInfoStore((s) => s.addressRoad);
  const region = useMemo(() => deriveRegionFromAddress(addressRoad), [addressRoad]);

  if (!checkpoint) return null;

  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 9,
    }}>
      <div style={{ fontSize: 11, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {ko ? `전문가 체크포인트 · ${checkpoint.expert.ko}` : `Expert checkpoint · ${checkpoint.expert.en}`}
      </div>
      <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
        {ko ? "이런 경우엔 전문가 확인을 권장해요: " : "Consider consulting when: "}
        {checkpoint.when.map((w, i) => (
          <span key={i}>
            {i > 0 && " · "}
            {ko ? w.ko : w.en}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {checkpoint.channels.map((ch) => (
          <ChannelPill key={ch.key} ch={ch} region={region} ko={ko} />
        ))}
      </div>
    </div>
  );
}
