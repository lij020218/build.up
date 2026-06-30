/**
 * stages/ — 로드맵 단계 "내용" SSOT.
 *
 * 단계 콘텐츠를 한 곳에 데이터로 정의 → 웹·iOS 공통 렌더(무드리프트 방지).
 * 스키마: schema.ts / 단계별 데이터: content/*.ts
 */
export * from "./schema";
export { REGISTRATION_SETUP_CONTENT } from "./content/registration-setup";
export { TAX_GUIDE_CONTENT } from "./content/tax-guide";
export { PERMIT_CHECK_CONTENT } from "./content/permit-check";
export { CONTRACT_REVIEW_CONTENT } from "./content/contract-review";
export { HIRING_SETUP_CONTENT } from "./content/hiring-setup";
// 소프트 오픈(가오픈) 업종 맞춤 콘텐츠 — 자체 스키마(아키타입), StageContent 레지스트리 미사용.
export * from "./content/pre-launch";
// 특수업종(specialty)별 KEY ACTION SSOT + resolve 헬퍼.
export * from "./stage-key-actions";

import type { StageContent } from "./schema";
import { REGISTRATION_SETUP_CONTENT } from "./content/registration-setup";
import { TAX_GUIDE_CONTENT } from "./content/tax-guide";
import { PERMIT_CHECK_CONTENT } from "./content/permit-check";
import { CONTRACT_REVIEW_CONTENT } from "./content/contract-review";
import { HIRING_SETUP_CONTENT } from "./content/hiring-setup";

/** stageId → StageContent 레지스트리(렌더러가 조회). 단계 전환 때마다 등록. */
export const STAGE_CONTENT_REGISTRY: Record<string, StageContent> = {
  [REGISTRATION_SETUP_CONTENT.stageId]: REGISTRATION_SETUP_CONTENT,
  [TAX_GUIDE_CONTENT.stageId]: TAX_GUIDE_CONTENT,
  [PERMIT_CHECK_CONTENT.stageId]: PERMIT_CHECK_CONTENT,
  [CONTRACT_REVIEW_CONTENT.stageId]: CONTRACT_REVIEW_CONTENT,
  [HIRING_SETUP_CONTENT.stageId]: HIRING_SETUP_CONTENT,
};

/** stageId 로 단계 콘텐츠 조회(없으면 undefined). */
export function getStageContent(stageId: string): StageContent | undefined {
  return STAGE_CONTENT_REGISTRY[stageId];
}
