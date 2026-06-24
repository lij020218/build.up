"use client";

/**
 * RegistrationSetupStage — 사업자 등록 + 인허가 신고.
 *
 * 2026-06-25 SSOT 전환:
 *   콘텐츠를 @foundone/shared 의 REGISTRATION_SETUP_CONTENT(단계 내용 SSOT)로 이전.
 *   웹은 StageContentRenderer, iOS는 BUStageContentRenderer 가 같은 데이터를 렌더 →
 *   web↔iOS 무드리프트(제목·내용 차이)가 구조적으로 불가능.
 *
 *   콘텐츠 수정은 packages/shared/src/stages/content/registration-setup.ts 한 곳에서만.
 *   인허가/함정/체크리스트/업종코드 등 업종별 데이터도 동일 SSOT(byCategory).
 */

import { REGISTRATION_SETUP_CONTENT } from "@foundone/shared";
import { StageContentRenderer } from "../shared/StageContentRenderer";

export function RegistrationSetupStage() {
  return <StageContentRenderer content={REGISTRATION_SETUP_CONTENT} />;
}
