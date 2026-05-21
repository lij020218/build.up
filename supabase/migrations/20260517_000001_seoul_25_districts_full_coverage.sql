-- Seoul 25개 구 전체 상권 커버리지 + 2025-2026 검증 기반 점수 재조정
-- 거시 변수 반영: GTX-A 2027 부분개통, GTX-C 2028+, 동북선 2027.11 개통,
-- 서울아레나 2027.03 개통, 외국인 관광객 회복(명동·한남), 공실률 변화
--   - 가로수길 41%, 신촌 18%, 이대 15% (악화)
--   - 뚝섬상권 5.94%, 성수 4% 내외 (호전)

-- ════════════════════════════════════════════════════════
-- PART 1. 기존 entry 점수·summary 조정 (22건)
-- ════════════════════════════════════════════════════════

-- 가로수길: 공실률 41%로 급락, 영세 이탈 가속
update public.market_location_signals
set base_score = 52,
    rent_band = 'high',
    competition_level = 'mid',
    demand_level = 'mid',
    category_fit_level = 'mid-high',
    summary = '2026년 공실률 41%대로 서울 최악 수준입니다. 임대료 부담을 견디지 못한 영세 매장이 대거 이탈했고 외국인 의류·뷰티 플래그십 중심으로 재편 중입니다.',
    evidence = '{"reasons":["외국인 관광객 회복으로 뷰티·패션 플래그십 수요는 유지","신사역 11.5만 일 유동인구 기반은 여전","임대료 협상력이 임차인 쪽으로 이동 중"],"warnings":["공실률 41%로 서울 최악 — 상권 활력 크게 위축","임대료가 매출 대비 비현실적","세로수길·도산공원 인접 상권으로 수요 이탈"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'garosu-gil-general';

-- 신촌: 공실률 18%, 홍대 이탈 가속
update public.market_location_signals
set base_score = 58,
    competition_level = 'mid',
    demand_level = 'mid',
    summary = '연세대·이대·서강대 배후 대학가지만 공실률 18%로 정체기에 들어선 상권입니다. 홍대·합정 이탈이 가속화되며 평일 점심·저녁 외 수요가 위축됐습니다.',
    evidence = '{"reasons":["3개 대학 배후로 점심·저녁 학생 수요는 유지","2호선 역세권 접근성","임대료 협상 여지 확대"],"warnings":["공실률 18%로 침체 신호","홍대·합정으로 트렌드 수요 이탈","방학·주말 수요 변동 큼"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'sinchon-general';

-- 성동구 성수동: 임대료 정점 도달, 5.94% 공실 호전이지만 진입 비용 부담
update public.market_location_signals
set base_score = 85,
    summary = '2025-2026 임대료 상승률이 둔화되며 정점 신호를 보이는 초고밀도 상권입니다. 뚝섬상권 공실률 5.94%로 호전됐고 팝업 중심 운영은 여전히 활발합니다.',
    evidence = '{"reasons":["팝업·플래그십 1순위 브랜드 런칭 상권 지위 유지","20대 여성 비중 36% 카페·뷰티·패션 수요 집중","외국인 관광객 73% 증가로 글로벌 수요 확보"],"warnings":["임대료가 서울 기준 최고 수준에 도달 — 정점 가능성","단기 팝업 위주로 장기 수익성 검증 부족","2026 들어 상승률 둔화로 신규 진입 부담은 여전"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'seongsu-general';

-- 광진구 건대: 단가 부담 + 일부 트렌드 이탈
update public.market_location_signals
set base_score = 81,
    summary = '2·7호선 더블 역세권 일 유동인구 24만 명대 유지되지만 임대료·권리금 부담이 커졌습니다. 광역 수요는 건재하나 트렌드 일부는 성수·연남으로 이동 중입니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'kondae-general';

-- 명동: 외국인 관광객 본격 회복
update public.market_location_signals
set base_score = 88,
    summary = '2025-2026 외국인 관광객 회복이 본격화되며 공실률이 가파르게 감소 중인 서울 최대 관광 상권입니다. 일본·동남아 단체관광 회복이 주효합니다.',
    evidence = '{"reasons":["외국인 관광객 본격 회복으로 매출 견인","서울 최대 관광 인지도","쇼핑·숙박·F&B 연계 수요 풍부","화장품·K-pop 굿즈 등 한류 매출 증가"],"warnings":["내국인 비중 낮아 환율·국제 정세 의존","임대료 서울 최고 수준","관광 트렌드 변화에 매출 편차 큼"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'myeongdong-general';

-- 압구정로데오: MZ 패션 회복 가속
update public.market_location_signals
set base_score = 84,
    summary = '2025-2026 MZ 패션·디저트·파인다이닝 회복이 본격화된 강남 핵심 상권입니다. 도산공원·세로수길 연계로 외부 유입이 확대됐습니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'apgujeong-rodeo-general';

-- 회기·경희대: 학원가 약세 + 학생 소비 위축
update public.market_location_signals
set base_score = 67,
    demand_level = 'mid',
    summary = '경희대·외대 배후 대학가지만 학생 수 감소·외국 유학생 변동으로 수요가 다소 위축됐습니다. 임대료는 서울 대학가 중 여전히 최저 수준입니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'hoegi-general';

-- 신도림: 경쟁 과열 + 가산·구로 이탈
update public.market_location_signals
set base_score = 68,
    demand_level = 'mid-high',
    summary = '1·2호선 환승 거점이지만 복합몰 의존도와 경쟁이 과열돼 점수가 조정됐습니다. 가산·구로 직장인 회식 수요 분산이 큰 변수입니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'sindorim-general';

-- 노량진: 학원가 축소 + 공시생 감소
update public.market_location_signals
set base_score = 62,
    summary = '공시생 감소·학원가 축소로 핵심 고객층이 줄어든 상권입니다. 임대료 부담 대비 회복 속도가 느립니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'noryangjin-general';

-- 사당: 서남부 환승 거점으로 호전
update public.market_location_signals
set base_score = 82,
    summary = '2·4호선 환승 + 광역버스 거점으로 일 환승객 22만 명대를 유지하는 서남부 핵심 상권입니다. 직장인 회식·심야 수요가 강합니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'sadang-general';

-- 연신내: GTX-A 2027 부분개통 호재
update public.market_location_signals
set base_score = 80,
    summary = 'GTX-A 2027 부분개통 호재로 2026 들어 임대료·신규 입점 문의가 늘고 있는 상권입니다. 3·6호선 환승 + 갈현·구파발 배후 수요 안정적입니다.',
    evidence = '{"reasons":["GTX-A 2027 부분개통으로 광역 접근성 확보","3·6호선 환승 거점","불광·갈현·구파발 주거 배후 수요","서울 서북부 최대 야간 상권"],"warnings":["임대료 상승 추세 가속화","GTX 개통 직전·직후 입점 경쟁 격화 예상"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'yeonsinnae-general';

-- 길음뉴타운: 동북선 2027.11 개통 호재
update public.market_location_signals
set base_score = 76,
    summary = '동북선 2027.11 개통 호재가 본격 반영 중인 신축 아파트 밀집 상권입니다. 길음역·미아사거리 사이 도시재생으로 신규 점포 입점이 활발합니다.',
    evidence = '{"reasons":["동북선 2027.11 개통 호재로 가치 상승 예상","길음뉴타운 신축 아파트 단지 배후 소비력","4호선 길음역 접근성"],"warnings":["체인·프랜차이즈 위주 입점으로 차별화 필요","임대료 상승 가속화 중"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'gireum-general';

-- 창동: 서울아레나 2027.03 개통 호재
update public.market_location_signals
set base_score = 78,
    summary = '서울아레나 2027.03 개통 호재가 본격 반영된 동북부 거점 상권입니다. 1·4호선 환승 + 광역철도 GTX-C 2028+ 호재까지 누적됐습니다.',
    evidence = '{"reasons":["서울아레나 2027.03 개통으로 연간 200만+ 방문 예상","GTX-C 2028+ 호재 누적","1·4호선 환승 거점","도봉구·노원구 배후 광역 수요"],"warnings":["개발 단계로 임대 시장 변동성 큼","개통 직전 입점 경쟁 격화 예상"]}'::jsonb,
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'changdong-general';

-- 상봉: 망우·중랑 핵심 + GTX-B 호재
update public.market_location_signals
set base_score = 70,
    summary = '경의중앙·7호선·KTX·GTX-B 예정으로 중랑구 최대 교통 결절점입니다. 상봉터미널 더샵 재개발로 2026 들어 신규 입점이 늘고 있습니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'sangbong-general';

-- 미아사거리: 동북선 2027.11 호재
update public.market_location_signals
set base_score = 72,
    summary = '동북선 2027.11 개통으로 가치 상승이 예상되는 강북 핵심 상권입니다. 4호선 미아사거리역 일대 재개발이 활발합니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'suyu-station-general';

-- 한성대: 성신여대·돈암 인접
update public.market_location_signals
set base_score = 65,
    summary = '4호선 한성대입구역 일대로 성신여대·돈암 배후 대학가입니다. 임대료 대비 합리적 진입 비용으로 신규 외식·카페 진입이 늘고 있습니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'snu-station-general';

-- 중계 학원가: 정원 감소 + 학원 통폐합
update public.market_location_signals
set base_score = 75,
    summary = '학령인구 감소로 학원 통폐합이 진행 중이지만 여전히 서울 동북부 최대 학원가입니다. 학부모 대기 수요 기반은 견고합니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'junggye-dong-general';

-- 구의·강변: 정체기
update public.market_location_signals
set base_score = 59,
    summary = '동서울터미널·강변역 일대로 1·2회 환승 거점이지만 건대·잠실 등 인접 광역 상권으로 수요가 분산됐습니다.',
    last_checked_at = '2026-05-17',
    next_review_at = '2026-11-17',
    updated_at = now()
where region_key = 'jugwon-general';

-- ════════════════════════════════════════════════════════
-- PART 2. 봉은사역·청담사거리 등 검색어 매칭 보강
-- ════════════════════════════════════════════════════════

update public.market_location_signals
set search_keywords = array['삼성', '삼성역', '코엑스', '봉은사역', '봉은사', '청담사거리', '강남구', 'COEX'],
    updated_at = now()
where region_key = 'samsung-coex-general';

-- ════════════════════════════════════════════════════════
-- PART 3. 25개 구 신규 상권 entry (INSERT … ON CONFLICT UPDATE)
-- ════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- ─── 강남구 ───
  (
    'serosu-gil-general', '세로수길·도산공원', '강남구', null,
    array['세로수길', '도산공원', '도산대로', '압구정', '강남구', '신사동'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 80,
    '가로수길에서 수요가 이탈한 MZ·외국인 관광객이 모이는 신흥 핫스폿입니다. 도산공원 인근 파인다이닝·디자이너 부티크가 집결합니다.',
    '{"reasons":["가로수길 수요 흡수로 빠른 성장","도산공원 고급 주거 배후 소비력","외국인 SNS 바이럴로 글로벌 인지도 상승"],"warnings":["임대료가 가파르게 상승 중","대형 브랜드 진입으로 영세 입점 어려움 증가"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'cheongdam-general', '청담동 명품거리', '강남구', null,
    array['청담', '청담동', '청담사거리', '갤러리아', '강남구', '명품거리'],
    'destination', 'high', 'mid', 'high', 'strong', 'strong', 85,
    '갤러리아백화점을 중심으로 한 서울 최상위 명품 상권입니다. 럭셔리 브랜드 플래그십·하이엔드 다이닝·뷰티가 집결합니다.',
    '{"reasons":["서울 최상위 명품 브랜드 집결지","갤러리아 앵커 시설","청담 거주 고소득층 배후 수요","외국인 VIP 쇼핑 수요"],"warnings":["임대료가 서울 최고 수준","일반 업종은 진입 어려움","유동인구 자체는 적음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'sinsa-station-general', '신사역 가로수길 진입부', '강남구', null,
    array['신사', '신사역', '가로수길', '강남구', '논현'],
    'destination', 'high', 'mid-high', 'mid-high', 'strong', 'mid-high', 70,
    '신사역 일대 외국인 관광객·MZ 유입 거점입니다. 가로수길 본진 침체와 별개로 역세권 부근은 수요가 유지됩니다.',
    '{"reasons":["3호선·신분당선 환승 거점","외국인 관광객 일 11.5만 유입","역세권 인지도"],"warnings":["가로수길 안쪽으로 갈수록 공실률 급증","임대료 부담 여전히 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 서초구 ───
  (
    'yangjae-general', '양재역 상권', '서초구', null,
    array['양재', '양재역', '서초구', '양재시민의숲', 'AT센터'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 75,
    '신분당선·3호선 환승역으로 서초구 동남부 거점입니다. 현대차그룹·LG전자 등 대기업 사옥 직장인 점심 수요가 강합니다.',
    '{"reasons":["대기업 사옥 직장인 점심 수요","신분당선·3호선 환승 거점","aT센터·양재시민의숲 주말 수요"],"warnings":["저녁·주말 수요 상대적으로 약함","경부고속도로 인접으로 보행 동선 단절"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'jamwon-banpo-general', '잠원·신반포 상권', '서초구', null,
    array['잠원', '잠원동', '신반포', '서초구', '고속터미널'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 73,
    '잠원·신반포 고급 아파트 배후 생활 상권입니다. 학원가·카페 중심으로 안정적 소비가 형성됩니다.',
    '{"reasons":["고급 아파트 단지 배후 소비력","학부모·학생 안정적 수요","고속터미널 인접 접근성"],"warnings":["유동인구 자체는 제한적","임대료가 서초 수준으로 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 송파구 ───
  (
    'helio-city-general', '헬리오시티 상권', '송파구', null,
    array['헬리오시티', '가락', '송파헬리오', '송파구', '가락몰'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 68,
    '9510세대 국내 최대 단일 아파트 단지 배후 상권입니다. 단지 내 상가 + 외부 가락로변으로 수요가 분산됩니다.',
    '{"reasons":["9510세대 거대 단지 고정 수요","단지 내 학원·키즈 수요 강함","가락시장·문정 법조타운 인접 시너지"],"warnings":["단지 내 상가 공급 과잉으로 경쟁 치열","주차·접근성 단지 외부는 다소 불편"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'bangi-general', '방이동 먹자골목', '송파구', null,
    array['방이', '방이동', '방이먹자골목', '송파구', '올림픽공원'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 70,
    '올림픽공원 인근 방이동 먹자골목으로 송파구 야간 상권의 대명사입니다. 30-40대 회식·데이트 수요가 견고합니다.',
    '{"reasons":["서울 동남부 대표 야간 외식 상권","올림픽공원 인접 외부 방문객","송파 고소득층 회식 수요"],"warnings":["주차 인프라 부족","점심 수요는 상대적으로 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'jamsil-saenae-general', '잠실새내·잠실종합운동장', '송파구', null,
    array['잠실새내', '잠실종합운동장', '종합운동장', '송파구', '잠실'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 76,
    '잠실 스포츠·콘서트 인근 신흥 다이닝 상권입니다. 야구·콘서트 시즌 폭발적 수요와 평일 직장인 수요가 결합됩니다.',
    '{"reasons":["야구·콘서트 시즌 폭발 수요","잠실역 본진 임대료 회피 수요","송파 거주 30-40대 외식 수요"],"warnings":["시즌별 수요 편차 매우 큼","대형 이벤트 비수기 매출 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 강동구 ───
  (
    'dunchon-olympicpark-general', '둔촌·올림픽파크포레온', '강동구', null,
    array['둔촌', '둔촌동', '올림픽파크포레온', '강동구', '올림픽공원'],
    'residential', 'mid-high', 'mid', 'high', 'strong', 'strong', 76,
    '12032세대 올림픽파크포레온 입주가 본격화된 2025-2026 최대 신흥 주거 상권입니다. 단지 내·외 상가 신규 입점이 활발합니다.',
    '{"reasons":["12032세대 거대 단지 입주 본격화","올림픽공원 인접 외부 유입","강동구·송파구 광역 소비력"],"warnings":["단지 내 상가 공급 폭증으로 초기 경쟁 치열","상권 안정화에 1-2년 필요"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'gildong-general', '길동·강동역 상권', '강동구', null,
    array['길동', '강동역', '강동구', '천호', '길동사거리'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 68,
    '5호선 강동역·길동역 일대로 천호 상권과 연계된 생활 밀착 상권입니다. 임대료 대비 안정적 주거 수요가 강점입니다.',
    '{"reasons":["천호 상권 인접 시너지","5호선 접근성","주거 배후 안정적 생활 수요"],"warnings":["천호 본진과 수요 분산","외부 유입은 제한적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'gangil-misa-general', '강일·미사 경계 상권', '강동구', null,
    array['강일', '미사', '강일역', '강동구', '하남미사'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'mid-high', 65,
    '강일지구·하남 미사 경계로 신축 아파트 입주가 진행 중인 신흥 상권입니다. 5호선 연장·9호선 4단계 호재가 있습니다.',
    '{"reasons":["신축 아파트 입주 본격화","9호선 4단계 2026+ 호재","임대료가 강동 본진 대비 합리적"],"warnings":["상권 형성 초기로 수요 분산","경계 지역 특성상 정체성 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 동대문구 ───
  (
    'cheongnyangni-general', '청량리·홍릉 상권', '동대문구', null,
    array['청량리', '청량리역', '홍릉', '동대문구', '롯데캐슬', '한국과학기술연구원'],
    'office', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 75,
    '1·경의중앙·수인분당·GTX-B(예정) 환승 거점입니다. 청량리역세권 재개발과 홍릉 R&D 단지가 결합된 복합 수요 상권입니다.',
    '{"reasons":["GTX-B 정차역 예정 호재","청량리역 재개발 본격화","홍릉 R&D·KIST 직장인 수요","롯데캐슬 단지 배후 소비력"],"warnings":["기존 노후 상권과 신축 단지 간 양극화","개발 진행 중 임대 시장 변동성 큼"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'dapsimni-general', '답십리 헤리티지 상권', '동대문구', null,
    array['답십리', '답십리역', '동대문구', '장한평'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 60,
    '5호선 답십리역 일대 신축 단지 입주로 신흥 주거 상권 형성 중입니다. 답십리 헤리티지·청계 한신더휴 등 재개발 효과가 나타납니다.',
    '{"reasons":["신축 단지 입주 본격화","5호선 접근성","임대료 합리적 수준"],"warnings":["상권 형성 초기","외부 유입 거의 없음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'janghanpyeong-general', '장한평·동대문구청', '동대문구', null,
    array['장한평', '장한평역', '동대문구청', '동대문구', '용두'],
    'office', 'mid', 'mid', 'mid', 'strong', 'mid-high', 58,
    '중고차매매단지로 유명한 5호선 장한평역 일대입니다. 자동차 산업 종사자 점심 수요와 동대문구청 공무원 수요가 결합됩니다.',
    '{"reasons":["중고차 단지 종사자 고정 점심 수요","구청 공무원 수요","임대료 합리적"],"warnings":["저녁·주말 수요 약함","유동인구 다양성 부족"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 중랑구 ───
  (
    'sangbong-thesharp-general', '상봉터미널 더샵', '중랑구', null,
    array['상봉터미널', '상봉더샵', '망우', '중랑구', '상봉'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 65,
    '상봉터미널 부지 재개발(더샵) + GTX-B 호재가 결합된 중랑구 신흥 상권입니다. 2026-2027 단계적 입주로 신규 수요가 유입됩니다.',
    '{"reasons":["GTX-B 상봉역 정차 예정","상봉터미널 더샵 재개발 본격화","경의중앙·7호선 환승"],"warnings":["입주 초기 상권 형성 시간 필요","임대료가 빠르게 상승 중"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'myeonmok-general', '면목동 상권', '중랑구', null,
    array['면목', '면목동', '면목역', '중랑구', '사가정'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 60,
    '7호선 면목역·사가정역 일대로 중랑구 핵심 주거 생활 상권입니다. 서울 기준 임대료가 매우 낮아 초기 창업 부담이 적습니다.',
    '{"reasons":["서울 최저 수준 임대료","주거 배후 안정 수요","7호선 접근성"],"warnings":["외부 유입 거의 없음","트렌디 업종 수요 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 성북구 ───
  (
    'sungshin-univ-general', '성신여대·돈암', '성북구', null,
    array['성신여대', '성신여대입구', '돈암', '성북구', '미아리'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 70,
    '4호선 성신여대입구역 일대 대학가 + 미아리 일대 생활 상권입니다. 20대 여성 비중이 높아 카페·뷰티·디저트 수요가 강합니다.',
    '{"reasons":["성신여대 배후 20대 여성 수요","4호선 접근성","임대료 합리적 수준"],"warnings":["방학 기간 수요 변동","상권 규모 자체는 제한적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'seongbuk-dong-general', '성북동 한옥거리', '성북구', null,
    array['성북동', '성북구', '한성대입구', '간송미술관', '심우장'],
    'destination', 'mid', 'low', 'mid', 'mid-high', 'strong', 65,
    '한옥과 미술관이 어우러진 조용한 문화 상권입니다. 30-40대 문화 소비층과 외국인 관광객 niche 수요가 형성됩니다.',
    '{"reasons":["한옥·미술관 문화 콘텐츠","조용한 분위기 선호 30-40대 수요","임대료가 강북 핵심 대비 합리적"],"warnings":["대중교통 접근성 제한적","유동인구 자체는 적음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'bomun-general', '보문역 상권', '성북구', null,
    array['보문', '보문역', '성북구', '안암', '신설동'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '6호선·우이신설선 환승 보문역 일대 주거 상권입니다. 안암·고려대와 인접해 일부 학생 수요가 흘러들어옵니다.',
    '{"reasons":["6호선·우이신설선 환승","고려대 배후 일부 학생 수요","임대료 매우 합리적"],"warnings":["외부 유입 제한적","상권 규모 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'dongseon-dong-general', '동선동 롯데캐슬', '성북구', null,
    array['동선동', '한성대입구', '성북구', '동소문동', '롯데캐슬'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'mid-high', 60,
    '창경궁 롯데캐슬 입주 + 한성대 인근 신흥 주거 상권입니다. 4호선 한성대입구역 접근성이 좋고 신규 입점 여지가 있습니다.',
    '{"reasons":["신축 단지 입주 본격화","한성대입구역 접근성","임대료 합리적"],"warnings":["상권 형성 초기","유동인구 외부 유입 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 강북구 ───
  (
    'mia-sageori-general', '미아사거리 상권', '강북구', null,
    array['미아사거리', '미아', '강북구', '미아사거리역', '롯데백화점미아점'],
    'destination', 'mid', 'mid', 'mid-high', 'strong', 'strong', 72,
    '4호선 미아사거리역 + 롯데백화점 미아점 + 동북선 2027.11 개통 호재가 결합된 강북구 핵심 상권입니다.',
    '{"reasons":["동북선 2027.11 개통 호재","롯데백화점 앵커","4호선 접근성","강북구 최대 상권"],"warnings":["임대료 빠르게 상승 중","상권 정체 후 회복 단계"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'suyu-uisinseol-general', '수유·우이신설선', '강북구', null,
    array['수유', '수유역', '우이', '강북구', '우이신설선'],
    'destination', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 60,
    '4호선 수유역 + 우이신설선 환승으로 강북구 북부 핵심 상권입니다. 4.19사거리 방향으로 야간 외식 상권이 형성됩니다.',
    '{"reasons":["4호선·우이신설선 환승","야간 외식 수요","임대료 합리적"],"warnings":["광역 유입 제한적","유동인구 규모 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    '419-sageori-general', '4.19사거리·솔밭공원', '강북구', null,
    array['4.19사거리', '솔밭공원', '강북구', '쌍문', '수유'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'mid-high', 56,
    '4.19기념탑·솔밭공원 인근 조용한 주거 상권입니다. 임대료가 매우 낮아 골목 카페·소형 외식 입점이 늘고 있습니다.',
    '{"reasons":["서울 최저 수준 임대료","주거 배후 안정 수요","조용한 환경 선호 수요"],"warnings":["외부 유입 거의 없음","상권 규모 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 도봉구 ───
  (
    'seoul-arena-general', '서울아레나 상권', '도봉구', null,
    array['서울아레나', '도봉구', '창동', '도봉산'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 78,
    '2027.03 개통 예정 서울아레나(K-pop 전용 1.8만석)를 중심으로 형성 중인 신흥 상권입니다. 연 200만+ 방문객이 예상됩니다.',
    '{"reasons":["서울아레나 2027.03 개통으로 연 200만+ 방문","창동역 인접 1·4호선 접근성","GTX-C 2028+ 누적 호재"],"warnings":["개통 전 단계로 임대 시장 변동성 매우 큼","아레나 비시즌 수요 검증 필요"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'dobongsan-general', '도봉산 입구·창포원', '도봉구', null,
    array['도봉산', '도봉산역', '도봉구', '창포원'],
    'destination', 'low', 'mid', 'mid', 'mid', 'mid-high', 55,
    '도봉산 등산객 + 창포원 방문객 대상 산악 상권입니다. 주말 수요가 강하고 평일은 약합니다.',
    '{"reasons":["도봉산 연 등산객 수요","주말 외부 방문객 유입","임대료 매우 저렴"],"warnings":["주중·우천 시 수요 급락","계절성 매우 큼"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'ssangmun-general', '쌍문동 상권', '도봉구', null,
    array['쌍문', '쌍문동', '쌍문역', '도봉구'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '4호선 쌍문역 일대 주거 생활 상권입니다. 응답하라 1988 촬영지로 일부 추억 마케팅 수요가 형성됩니다.',
    '{"reasons":["주거 배후 안정 수요","4호선 접근성","임대료 매우 합리적"],"warnings":["외부 유입 제한적","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 노원구 ───
  (
    'gwangwoon-seoulwon-general', '광운대 서울원', '노원구', null,
    array['광운대', '서울원', '월계', '노원구', '광운대역'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '광운대역세권 서울원 개발 본격화로 형성 중인 신흥 상권입니다. GTX-C 2028+ 호재가 누적됐습니다.',
    '{"reasons":["서울원 대규모 개발","GTX-C 정차역 예정","광운대 배후 학생 수요","경원선·1호선 접근성"],"warnings":["개발 단계로 변동성 큼","상권 안정화에 2-3년 필요"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'taeneung-hwarang-general', '태릉입구·화랑로', '노원구', null,
    array['태릉입구', '화랑로', '노원구', '공릉', '월계'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '6·7호선 태릉입구역 일대 + 화랑로 학원가입니다. 서울과학기술대·삼육대 학생 수요가 강점입니다.',
    '{"reasons":["6·7호선 환승 거점","서울과기대·삼육대 배후","임대료 합리적"],"warnings":["외부 유입 제한적","화랑로 보행 동선 단절"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 은평구 ───
  (
    'eunpyeong-newtown-general', '은평뉴타운·진관', '은평구', null,
    array['은평뉴타운', '진관동', '은평구', '구파발', '진관'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'strong', 67,
    '구파발역·은평뉴타운 일대 대규모 신도시 주거 상권입니다. 3호선 접근성과 북한산 자연환경이 결합됐습니다.',
    '{"reasons":["은평뉴타운 거대 단지 배후 수요","3호선 접근성","북한산 주말 등산객 유입"],"warnings":["서울 핵심부 접근성은 보통","단지 내 상가 공급 많아 경쟁"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'eungam-galhyeon-general', '응암·갈현', '은평구', null,
    array['응암', '갈현', '은평구', '응암역', '역촌'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 60,
    '6호선 응암역 + 갈현동 일대 주거 밀착 상권입니다. 임대료가 매우 낮아 골목 카페·소형 외식이 활발합니다.',
    '{"reasons":["임대료 매우 낮음","6호선 접근성","주거 배후 안정 수요"],"warnings":["외부 유입 거의 없음","유동인구 적음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 서대문구 ───
  (
    'ewha-general', '이화여대 상권', '서대문구', null,
    array['이대', '이화여대', '서대문구', '이대역', '신촌'],
    'destination', 'mid-high', 'mid-high', 'mid', 'strong', 'mid-high', 45,
    '공실률 15%대로 한때 패션 중심지였던 명성이 크게 약화된 상권입니다. 외국인 관광객 회복에 의존하는 구조로 재편 중입니다.',
    '{"reasons":["이화여대 배후 학생 수요 일부 유지","외국인 관광객 일부 회복","2호선 접근성"],"warnings":["공실률 15%로 침체 지속","과거 명성 대비 수요 위축 심각","임대료 회복 더딤"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'chungjeong-ro-general', '충정로·서대문', '서대문구', null,
    array['충정로', '서대문', '서대문구', '서대문역', '아현'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 67,
    '2·5호선 환승 충정로역 일대 오피스 직장인 상권입니다. KT·동아일보 등 대기업 사옥이 인접합니다.',
    '{"reasons":["2·5호선 환승 거점","대기업 사옥 직장인 점심 수요","서대문구청 공무원 수요"],"warnings":["저녁·주말 수요 약함","유동인구 다양성 부족"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'hongje-general', '홍제·홍은', '서대문구', null,
    array['홍제', '홍은', '홍제동', '서대문구', '홍제역'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '3호선 홍제역 + 홍은동 일대 생활 밀착 주거 상권입니다. 인왕산 인근 환경과 합리적 임대료가 강점입니다.',
    '{"reasons":["임대료 저렴","주거 배후 안정 수요","3호선 접근성"],"warnings":["외부 유입 거의 없음","상권 규모 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 마포구 ───
  (
    'gongdeok-general', '공덕역 상권', '마포구', null,
    array['공덕', '공덕역', '마포구', '효창공원', '효창동'],
    'office', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 78,
    '5·6·경의중앙·공항철도 4개 노선 환승 거점입니다. 직장인·경의중앙선 외부 유입·KCC 등 본사 수요가 결합됩니다.',
    '{"reasons":["4개 노선 환승 거점","KCC 등 대기업 사옥 점심 수요","공항철도 접근성"],"warnings":["역 중심 임대료 빠르게 상승","주말 수요 평일 대비 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'sangam-dmc-general', '상암DMC 상권', '마포구', null,
    array['상암', 'DMC', '디지털미디어시티', '마포구', '상암동'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 73,
    '방송·미디어 기업 본사 집결지로 직장인 점심·저녁 수요가 안정적입니다. 6호선·경의중앙선·공항철도 환승 거점입니다.',
    '{"reasons":["방송·미디어 기업 직장인 수요","공항철도 외국인 유입","월드컵공원 주말 수요"],"warnings":["주말 수요 평일 대비 큰 폭 감소","오피스 의존도 매우 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 양천구 ───
  (
    'omokgyo-general', '오목교·목동상권', '양천구', null,
    array['오목교', '목동', '양천구', '현대백화점목동', '오목교역'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 75,
    '현대백화점 목동점·SBS 사옥·이대목동병원이 결합된 양천구 최대 복합 상권입니다. 학원가·주거지 배후 소비력이 매우 강합니다.',
    '{"reasons":["현대백화점 앵커 시설","목동 고소득층 배후 소비력","SBS·이대목동병원 직장인 수요"],"warnings":["임대료가 양천 수준으로 높음","유행 트렌드는 강남·홍대 대비 보수적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'sinjeong-sinwol-general', '신정·신월', '양천구', null,
    array['신정', '신월', '양천구', '신정네거리', '까치산'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 62,
    '2호선 신정네거리역·까치산역 일대 주거 생활 상권입니다. 임대료 대비 안정 수요가 강점입니다.',
    '{"reasons":["임대료 합리적","주거 배후 안정 수요","2호선 접근성"],"warnings":["외부 유입 제한적","목동 본진과 수요 분산"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 강서구 ───
  (
    'gimpo-airport-general', '김포공항 상권', '강서구', null,
    array['김포공항', '강서구', '공항', '발산', '김포'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '5·9호선·공항철도·김포골드라인 4개 노선 환승 거점입니다. 롯데몰 김포공항점 + 국내선 공항 수요가 결합됩니다.',
    '{"reasons":["4개 노선 환승 거점","롯데몰 앵커","국내선 공항 수요"],"warnings":["수요는 환승객 단기 체류 위주","장기 거주 고정 수요는 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'kkachisan-general', '까치산·화곡', '강서구', null,
    array['까치산', '화곡', '강서구', '까치산역', '화곡역'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 65,
    '5호선·2호선 환승 까치산역 일대 + 화곡 생활 상권입니다. 강서구 핵심 주거지 배후로 안정적입니다.',
    '{"reasons":["5·2호선 환승 거점","주거 배후 안정 수요","임대료 합리적"],"warnings":["외부 유입 제한적","상권 정체 후 회복 단계"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 구로구 ───
  (
    'sindorim-techno-general', '신도림 테크노마트·디큐브', '구로구', null,
    array['신도림', '테크노마트', '디큐브시티', '구로구', '신도림역'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 70,
    '1·2호선 환승 + 디큐브시티 + 테크노마트 결합 대형 복합 상권입니다. 가산·구로 직장인 회식 + 외부 환승객 수요가 합쳐집니다.',
    '{"reasons":["디큐브시티·테크노마트 앵커","1·2호선 환승 거점","구로·가산 직장인 회식 수요"],"warnings":["복합몰 내 경쟁 치열","주거 배후 수요는 제한적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'oryu-gaebong-general', '오류·개봉 상권', '구로구', null,
    array['오류', '오류동', '개봉', '구로구', '오류동역', '개봉역'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 60,
    '1호선 오류동·개봉역 일대 주거 밀착 상권입니다. 임대료가 매우 낮아 골목 외식·카페 진입이 활발합니다.',
    '{"reasons":["임대료 매우 낮음","1호선 접근성","주거 배후 수요"],"warnings":["외부 유입 거의 없음","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 금천구 ───
  (
    'gasan-digital-general', '가산디지털단지', '금천구', null,
    array['가산', '가산디지털단지', '금천구', '가산디지털', '디지털단지'],
    'office', 'mid-high', 'high', 'high', 'strong', 'strong', 76,
    'IT·게임·콜센터 기업 집결지로 평일 점심 수요가 압도적인 오피스 상권입니다. 마리오아울렛 등 쇼핑 수요도 결합됩니다.',
    '{"reasons":["IT·게임 기업 직장인 대규모 점심 수요","마리오아울렛 등 쇼핑 인프라","1·7호선 접근성"],"warnings":["저녁·주말 수요 급감","오피스 의존도 매우 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'doksan-siheung-general', '독산·시흥', '금천구', null,
    array['독산', '시흥', '금천구', '독산역', '시흥동'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '1호선 독산역 + 시흥동 주거 생활 상권입니다. 가산 직장인 일부 거주 수요와 결합됩니다.',
    '{"reasons":["임대료 매우 낮음","가산 직장인 일부 거주 수요","1호선 접근성"],"warnings":["외부 유입 제한적","상권 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 영등포구 (보강) ───
  (
    'mullae-general', '문래창작촌', '영등포구', null,
    array['문래', '문래동', '문래창작촌', '영등포구', '문래역'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 72,
    '철공소가 예술가 작업실로 변모한 서울 인디 문화 거점입니다. 30대 문화 소비층 + SNS 바이럴 수요가 결합됩니다.',
    '{"reasons":["서울 인디 문화 거점 인지도","30대 문화 소비층 목적 방문","임대료가 강남·성수 대비 합리적"],"warnings":["일반 대중 수요는 제한적","공간 확보 경쟁이 높아짐"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'yeouido-general', '여의도 IFC·더현대', '영등포구', null,
    array['여의도', 'IFC', '더현대서울', '영등포구', '여의도역', '국회의사당'],
    'office', 'high', 'high', 'high', 'strong', 'strong', 87,
    'IFC몰·더현대서울이 결합된 서울 서부 최대 복합 상권입니다. 금융·증권·국회 직장인 + 외부 쇼핑 수요가 강하게 결합됩니다.',
    '{"reasons":["더현대서울 연 2700만 방문 앵커","금융가 직장인 점심·회식 수요","9호선·5호선 접근성"],"warnings":["임대료 매우 높음","주말 IFC·더현대 중심 의존"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'singil-yeongdeungpo-general', '신길·영등포시장', '영등포구', null,
    array['신길', '영등포시장', '영등포구', '신길역'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 64,
    '신길뉴타운 입주 본격화 + 영등포시장 전통 상권 결합 상권입니다. 1·7·5호선 환승 + 신안산선 호재가 있습니다.',
    '{"reasons":["신길뉴타운 단지 배후 신수요","신안산선 2026+ 호재","영등포시장 전통 수요"],"warnings":["전통시장 노후화","뉴타운과 시장 양극화"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 동작구 ───
  (
    'sadang-isu-general', '사당·이수', '동작구', null,
    array['사당', '이수', '동작구', '사당역', '이수역'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 82,
    '2·4호선·7호선 환승 + 광역버스 거점으로 동작구·관악구·서초구 경계 핵심 상권입니다. 야간 회식·심야 수요가 매우 강합니다.',
    '{"reasons":["2·4·7호선 환승 거점","광역버스 환승 22만+ 일 유동","야간 회식·심야 수요 강력"],"warnings":["임대료 빠르게 상승","경쟁 밀도 매우 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'sangdo-general', '상도·숭실대', '동작구', null,
    array['상도', '상도동', '숭실대', '동작구', '상도역'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'mid-high', 63,
    '7호선 상도역 + 숭실대 배후 대학가 + 주거 결합 상권입니다. 임대료가 합리적이고 학생·주거 수요가 결합됩니다.',
    '{"reasons":["숭실대 배후 학생 수요","주거 배후 안정 수요","임대료 합리적"],"warnings":["방학 기간 수요 변동","외부 유입 제한적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'heukseok-general', '흑석·중앙대', '동작구', null,
    array['흑석', '중앙대', '동작구', '흑석동', '흑석역'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '9호선 흑석역 + 중앙대 배후 대학가 + 흑석뉴타운 입주가 결합된 신흥 상권입니다. 한강뷰 프리미엄까지 더해집니다.',
    '{"reasons":["중앙대 배후 학생·교직원 수요","흑석뉴타운 입주 본격화","9호선 급행 접근성","한강뷰 프리미엄"],"warnings":["임대료 빠르게 상승","상권 형성 단계"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 관악구 ───
  (
    'sharosu-gil-general', '샤로수길·서울대입구', '관악구', null,
    array['샤로수길', '서울대입구', '관악구', '서울대입구역', '봉천'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 77,
    '서울대입구역 일대 샤로수길은 2030 미식·카페 거점입니다. 강남 접근성 + 합리적 임대료로 신규 입점이 활발하지만 경쟁도 치열합니다.',
    '{"reasons":["2030 미식·카페 SNS 바이럴","2호선 강남 접근성","서울대 배후 수요"],"warnings":["임대료 가파른 상승","경쟁 밀도 매우 높음","유행 회전 속도 빠름"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 한남·이태원 점수 조정 ───
  (
    'hannam-itaewon-general', '한남·이태원 메인', '용산구', null,
    array['한남', '한남동', '이태원', '용산구', '경리단길'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 83,
    '외국인 관광객 본격 회복 + 글로벌 브랜드 플래그십 집결 + 한남더힐 고소득층 수요가 결합된 서울 최상위 상권입니다.',
    '{"reasons":["외국인 관광객 본격 회복","글로벌 브랜드 플래그십 1순위","한남더힐 고소득층 배후","6호선 접근성"],"warnings":["임대료 매우 높음","경리단길 본진은 일부 침체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 종로구 보강 ───
  (
    'seosunla-gil-general', '서순라길·익선동 인접', '종로구', null,
    array['서순라길', '익선동', '종로구', '운현궁', '종로3가'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 73,
    '종묘 옆 한옥거리 서순라길은 익선동 수요를 흡수하며 성장 중인 핫 뉴웨이브 상권입니다. 30-40대 미식 수요가 강합니다.',
    '{"reasons":["익선동 수요 흡수 신흥 한옥 상권","외국인 관광객 한옥 콘텐츠 선호","30-40대 미식 수요"],"warnings":["임대료 빠르게 상승","공간 확보 경쟁 치열"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'gwangjang-market-general', '광장시장·종로5가', '종로구', null,
    array['광장시장', '종로5가', '종로구', '동대문', '먹자골목'],
    'destination', 'mid', 'high', 'high', 'strong', 'strong', 80,
    '외국인 관광객 SNS 바이럴로 폭발적 성장한 전통시장 야시장 상권입니다. 빈대떡·육회·마약김밥 등 시그니처 메뉴가 글로벌 인지도를 확보했습니다.',
    '{"reasons":["외국인 SNS 바이럴로 글로벌 인지도","전통시장 야시장 컨셉 명확","1·5호선 접근성"],"warnings":["입점 자리 자체 매우 제한적","권리금 매우 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- ─── 중구 보강 ───
  (
    'dongdaemun-general', '동대문·DDP', '중구', null,
    array['동대문', 'DDP', '동대문디자인플라자', '중구', '동대문역사문화공원'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 84,
    'DDP·두타·밀리오레가 결합된 서울 대표 야시장·패션 상권입니다. 외국인 관광객 + 도매 상인 수요가 24시간 형성됩니다.',
    '{"reasons":["외국인 관광객 회복 + DDP 앵커","24시간 도매·소매 수요","2·4·5호선 환승"],"warnings":["임대료 매우 높음","도매 상권 침체로 패션 일부 위축"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'sindang-general', '신당동 떡볶이타운', '중구', null,
    array['신당', '신당동', '중구', '약수', '신당역', '떡볶이타운'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 72,
    '신당동 떡볶이타운 + 약수동 골목 상권이 결합된 중구 야간 외식 상권입니다. 30-40대 추억 마케팅 + SNS 바이럴 수요가 결합됩니다.',
    '{"reasons":["떡볶이타운 명확한 정체성","30-40대 추억·SNS 바이럴","2·6호선 접근성"],"warnings":["메뉴 다양성 제한적","임대료 상승 추세"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  )

on conflict (region_key) do update
  set region_name = excluded.region_name,
      district_name = excluded.district_name,
      search_keywords = excluded.search_keywords,
      market_style = excluded.market_style,
      rent_band = excluded.rent_band,
      competition_level = excluded.competition_level,
      demand_level = excluded.demand_level,
      access_level = excluded.access_level,
      category_fit_level = excluded.category_fit_level,
      base_score = excluded.base_score,
      summary = excluded.summary,
      evidence = excluded.evidence,
      freshness_status = excluded.freshness_status,
      last_checked_at = excluded.last_checked_at,
      next_review_at = excluded.next_review_at,
      updated_at = now();
