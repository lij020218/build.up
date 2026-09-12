/**
 * compliance/ — 앱·플랫폼 규제·계약 도구 SSOT (2026-09-11, 구함 사례 조사 기반).
 *  - identity-channels: 본인인증 채널 데이터 + 선택기(recommendIdentityChannel)
 *  - pg-precheck: PG 입점심사 사전 검사 규칙 + 순수 검사기(runPgPrecheck)
 *  - doc-request: 서류 요청 메일 해석기(decodeDocumentRequest)
 * iOS 는 scripts/gen-compliance-json.mts → compliance-data.json 으로 같은 데이터를 읽는다.
 */
export * from "./identity-channels";
export * from "./pg-precheck";
export * from "./doc-request";
