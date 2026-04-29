-- Cash-flow Crunch Tracker 설정 컬럼 추가
-- 배경: cashflow-store 의 핵심 설정 (통장 잔고·판매채널 비율·알림 옵션 등) 이
--      현재 zustand persist (localStorage) 에만 저장되어, 기기 변경/캐시 삭제 시 손실됨.
--      사장님이 2분 들여 설정한 값이므로 반드시 Supabase 영구 저장.
--
-- 데이터 모델 (cashflow_settings JSONB):
-- {
--   "currentBalance": 3000000,                   // 통장 잔고 (원)
--   "currentBalanceUpdatedAt": "2026-04-24T...",  // 마지막 업데이트
--   "salesChannels": [                            // 판매 채널 비율 + 정산주기
--     { "id": "card", "salesRatio": 70, "isActive": true, ... },
--     { "id": "baemin", "salesRatio": 30, "isActive": true, ... }
--   ],
--   "fixedExpenses": [                            // 월 고정비 (cashflow-store 자체 형식)
--     { "id": "...", "label": "월세", "amount": 1500000, "dayOfMonth": 25, ... }
--   ],
--   "crisisThresholdDays": 3,                    // 위기 감지 기간 (1~14일)
--   "notifyOnCrisis": true,
--   "dailyMorningBriefing": true,
--   "vatReserveEnabled": true,                    // 부가세 10% 적립 활성화
--   "setupCompletedAt": "2026-04-24T..."          // 최초 설정 완료 시각
-- }

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS cashflow_settings jsonb DEFAULT '{}'::jsonb;
