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
  subIndustryToGroup: Record<string, string>;
  groupLabels: Record<string, string>;
  channelsByGroup: Record<string, OpsChannel[]>;
};

const CATALOG = catalog as unknown as CatalogShape;

/**
 * 채널 그룹 키 결정. 세부업종(subIndustryId, 예: convenience-small) 우선,
 * 없으면 큰 분류(categoryId) → 둘 다 미식별 시 음식 배달로 폴백.
 * 편의점처럼 큰 분류(retail) 채널이 부적절한 세부업종은 subIndustryToGroup 으로 분기.
 */
export function opsGroupForCategory(
  categoryId: string | null | undefined,
  subIndustryId?: string | null,
): string {
  if (subIndustryId && CATALOG.subIndustryToGroup?.[subIndustryId]) {
    return CATALOG.subIndustryToGroup[subIndustryId];
  }
  if (!categoryId) return "food-delivery";
  return CATALOG.categoryToGroup[categoryId] ?? "food-delivery";
}

/** 업종 → 해당 그룹의 채널 목록 (4개). 세부업종 우선. */
export function getOpsChannels(
  categoryId: string | null | undefined,
  subIndustryId?: string | null,
): OpsChannel[] {
  return CATALOG.channelsByGroup[opsGroupForCategory(categoryId, subIndustryId)] ?? [];
}

/** 업종 → 섹션 라벨 ("배달 플랫폼"/"마켓플레이스"/"배달·부가 채널"/...). 세부업종 우선. */
export function getOpsChannelLabel(
  categoryId: string | null | undefined,
  subIndustryId?: string | null,
): string {
  return CATALOG.groupLabels[opsGroupForCategory(categoryId, subIndustryId)] ?? "유입 채널";
}

export const OPS_CHANNELS_CATALOG = CATALOG;
