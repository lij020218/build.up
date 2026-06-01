// 운영 채널(배달/예약/마켓플레이스/런칭) 공유 SSOT 접근자.
// 웹 OperationsSetupStage + iOS OperationsChannelRegistry 가 동일 데이터를 소비한다.
// ops_selections 키는 섹션 네임스페이스 고정으로 항상 `delivery-<channel.id>`.

import catalog from "./operations-channels.json";

export interface OpsChannel {
  id: string;
  name: string;
  color: string;
  url: string;
  tagline: string;
  pros: string[];
  cons: string[];
}

type CatalogShape = {
  categoryToGroup: Record<string, string>;
  groupLabels: Record<string, string>;
  channelsByGroup: Record<string, OpsChannel[]>;
};

const CATALOG = catalog as unknown as CatalogShape;

/** 업종 카테고리 id → 채널 그룹 키. 미지정/미식별 시 음식 배달로 폴백. */
export function opsGroupForCategory(categoryId: string | null | undefined): string {
  if (!categoryId) return "food-delivery";
  return CATALOG.categoryToGroup[categoryId] ?? "food-delivery";
}

/** 업종 카테고리 id → 해당 그룹의 채널 목록 (4개). */
export function getOpsChannels(categoryId: string | null | undefined): OpsChannel[] {
  return CATALOG.channelsByGroup[opsGroupForCategory(categoryId)] ?? [];
}

/** 업종 카테고리 id → 섹션 라벨 ("배달 플랫폼"/"예약 플랫폼"/...). */
export function getOpsChannelLabel(categoryId: string | null | undefined): string {
  return CATALOG.groupLabels[opsGroupForCategory(categoryId)] ?? "유입 채널";
}

export const OPS_CHANNELS_CATALOG = CATALOG;
