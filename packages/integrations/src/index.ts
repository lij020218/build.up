/**
 * @build-up/integrations
 *
 * 외부 금융·세무 API 연동 어댑터 레이어.
 *
 * 정책: 마이데이터 사업자 인가 不要 + 금융업 인가 不要 +
 *      "사장님 위임 자동화" 만 사용 (=API 중계 사업자 호출).
 *
 * 어댑터 목록:
 *   - CODEF (사업자 통장 거래내역, 카드 매출 매통조)
 *   - 팝빌 (홈택스 세금계산서, 현금영수증)
 *   - 향후 추가: 토스플레이스, 포트원, 배달앱 정산 등
 *
 * 주의:
 *   - 이 패키지는 "타입과 정규화 함수" 만 export.
 *   - 실제 fetch 호출은 apps/web/app/api/_lib/*-client.ts 에서 (Node 런타임 전용).
 *   - 클라이언트 사이드(브라우저) 에서 import 가능하도록 fetch/crypto 의존 X.
 */

export * from "./types";
export * from "./normalize";
export * from "./adapter";
