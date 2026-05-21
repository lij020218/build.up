-- ════════════════════════════════════════════════════════════════════════
--  카카오맵 매칭 검증 후 fix (2026-05-18)
--
--  scripts/verify-kakao-matching.mjs 실행 결과 14건 불일치 발견 → 수정.
--  주된 원인:
--    (a) search_keywords[0] 이 모호한 일반어 ("삼성", "동대문", "약수") → 정확한
--        역명·동명으로 교체
--    (b) district_name 과 실제 좌표 불일치 (경계 지역) → 정정
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. samsung-coex: "삼성" → "삼성역" 으로 변경 ──
update public.market_location_signals
set search_keywords = array['삼성역', '삼성', '삼성동', '코엑스', 'COEX', '봉은사역', '봉은사', '청담사거리', '무역센터', '영동대로', '학여울', '학여울역', '한국전력', '현대백화점무역센터점', '글로벌비즈니스센터', '강남구'],
    updated_at = now()
where region_key = 'samsung-coex-general';

-- ── 2. daehakro: "대학로" → "혜화역" (구미 대학로와 검색 충돌) ──
update public.market_location_signals
set search_keywords = array['혜화역', '대학로', '혜화', '종로구', '마로니에공원', '동숭동', '명륜동', '성균관대', '서울대병원', '동성고', '연건', '이화사거리'],
    updated_at = now()
where region_key = 'daehakro-general';

-- ── 3. sindorim: district 정정 (영등포구 → 구로구·영등포구 경계 — 좌표 우선) ──
update public.market_location_signals
set district_name = '구로구·영등포구 경계',
    search_keywords = array['신도림역', '신도림', '디큐브시티', '디큐브', '테크노마트', '영등포구', '구로구', '신도림테크노마트', '도림천'],
    updated_at = now()
where region_key = 'sindorim-general';

-- ── 4. dongdaemun: district 정정 ("동대문" → 동대문역사문화공원역 — 중구는 맞음) ──
update public.market_location_signals
set search_keywords = array['동대문역사문화공원역', 'DDP', '동대문디자인플라자', '동대문역사문화공원', '동대문역', '동대문', '두타', '밀리오레', '굿모닝시티', '중구', '동대문구', '훈련원공원'],
    updated_at = now()
where region_key = 'dongdaemun-general';

-- ── 5. haknon: "학동" → "학동역" (전남 학동과 검색 충돌) ──
update public.market_location_signals
set search_keywords = array['학동역', '학동', '논현', '논현역', '논현동', '강남구', '신논현', '학동사거리', '가구거리', '도산대로'],
    updated_at = now()
where region_key = 'haknon-general';

-- ── 6. yaksu-sindang: "약수" → "약수역" (양양 약수길과 검색 충돌) ──
update public.market_location_signals
set search_keywords = array['약수역', '약수', '약수동', '신당', '신당역', '동대입구', '동대입구역', '중구', '신당동', '동호로'],
    updated_at = now()
where region_key = 'yaksu-sindang-general';

-- ── 7. gangnam-st-yangjae-belt: 강남역 좌표가 강남구라 district 정정 (강남구·서초구 경계) ──
update public.market_location_signals
set district_name = '강남구·서초구 경계',
    search_keywords = array['뱅뱅사거리', '강남역', '양재역', '시민의숲역', '서초구', '강남구', '강남대로', '서초', '신논현역'],
    updated_at = now()
where region_key = 'gangnam-st-yangjae-belt-general';

-- ── 8. jongno-3ga-myeongdong-link: 종로3가역은 종로구. district 정정 ──
update public.market_location_signals
set district_name = '종로구·중구 경계',
    search_keywords = array['종로3가역', '종로3가', '청계천', '청계3가', '청계4가', '을지로3가', '중구', '종로구', '광장시장'],
    updated_at = now()
where region_key = 'jongno-3ga-myeongdong-link';

-- ── 9. daerim: 대림역은 구로구. district 정정 ──
update public.market_location_signals
set district_name = '영등포구·구로구 경계',
    search_keywords = array['대림역', '대림동', '영등포구', '구로구', '대림차이나타운', '대림중앙시장'],
    updated_at = now()
where region_key = 'daerim-general';

-- ── 10. dapsimni-jangan-belt: "답십리역" → "장한평역" (답십리 인근 매장이 성동구 매칭됨) ──
update public.market_location_signals
set search_keywords = array['장한평역', '답십리역', '답십리', '장안동', '장한평', '동대문구', '신답', '용두'],
    updated_at = now()
where region_key = 'dapsimni-jangan-belt-general';

-- ── 11. wirye-shinheung: 위례신도시는 송파·하남·성남 3개 경계. district 정정 ──
update public.market_location_signals
set district_name = '성남시 수정구·하남시·송파구 경계',
    search_keywords = array['신흥역', '위례신도시', '위례', '신흥', '성남시 수정구', '수정구', '복정역', '복정'],
    updated_at = now()
where region_key = 'wirye-shinheung-general';

-- ── 12. yongin-suji-mojeon: 미금역은 분당구. district 정정 (분당~수지 연결 라인) ──
update public.market_location_signals
set district_name = '용인시 수지구·성남시 분당구 경계',
    search_keywords = array['죽전역', '미금역', '오리역', '오리', '미금', '수지구', '용인시', '분당구', '분당선'],
    updated_at = now()
where region_key = 'yongin-suji-mojeon-belt-general';

-- ── 13. dongtan1-bansong: "반송역" → "동탄역" (반송역은 오산시 매칭) ──
update public.market_location_signals
set search_keywords = array['동탄역', '동탄', '동탄1신도시', '반송동', '능동', '능동역', '화성시', '메타폴리스'],
    updated_at = now()
where region_key = 'dongtan1-bansong-general';

-- ── 14. incheon-bupyeong: "인천" → "부평역" (너무 광범위) ──
-- 이 entry 는 기존 migration 정의가 다양한 곳에 있을 수 있음. region_key 매칭만 적용.
update public.market_location_signals
set search_keywords = array['부평역', '부평', '부평구청', '인천 부평구', '부평시장', '인천부평'],
    updated_at = now()
where region_key = 'incheon-bupyeong-general';
