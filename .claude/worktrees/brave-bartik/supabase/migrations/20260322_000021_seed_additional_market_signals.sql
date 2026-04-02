-- Seed additional commercial area data
-- Covers: 용산구 용리단길, 경기도 안양 범계역/평촌, 경기도 용인 죽전·수지, 서울 이촌·서울역
-- Research basis:
--   용리단길: 2023 상반기 20대 매출 증가율 62.6% (서울 1위), 30대 45.8% (2위), 임대료 3~4배 상승
--   안양 범계역: 일 유동인구 20만, 임대료 전국 10위 (1㎡당 71,200원)
--   용인 수지: 신분당선 5개역, 수지구 인구 37.5만

insert into public.market_location_signals (
  region_key,
  region_name,
  district_name,
  category_id,
  search_keywords,
  market_style,
  rent_band,
  competition_level,
  demand_level,
  access_level,
  category_fit_level,
  base_score,
  summary,
  evidence,
  freshness_status,
  last_checked_at,
  next_review_at,
  notes
)
values

  -- ─── 용산구 ───
  (
    'yongridangil-general',
    '용리단길 상권',
    '용산구',
    null,
    array['용산', '용리단길', '삼각지', '삼각지역', '신용산역', '용산역', '용산구'],
    'destination',
    'mid-high',
    'high',
    'high',
    'strong',
    'strong',
    88,
    '신용산·용산·삼각지역 3중 역세권 기반의 서울 신흥 핫 상권입니다. 2023년 상반기 20대 매출 증가율이 서울 전체 상권 1위(62.6%)를 기록했으며, 임대료는 3년 새 3~4배 상승했습니다.',
    '{"reasons":["3중 역세권(신용산·용산·삼각지)으로 접근성 서울 최상급","2023년 상반기 20대 매출 증가율 62.6%로 서울 1위, 30대 45.8%로 2위","KTX·지하철·광역버스 모든 교통 수단 접근 가능","용산공원·국제업무지구 개발로 장기 상권 가치 상승 호재","200여 매장 중 170개 이상이 F&B 업종으로 외식·카페 집중 상권"],"warnings":["임대료가 3년 새 3~4배 급등, 권리금 상승 추세","신흥 상권 특성상 수요 변동 가능성 존재","개발 계획 지연 시 주변 공사 영향"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),
  (
    'ichon-general',
    '이촌동 상권',
    '용산구',
    null,
    array['이촌', '이촌역', '이촌동', '용산구', '한강진역', '용산가족공원'],
    'residential',
    'high',
    'low',
    'mid-high',
    'strong',
    'mid-high',
    79,
    '이촌동 고급 주거지 배후의 생활 상권입니다. 외국인 거주자 비율이 높고 고소득층 가족 수요가 안정적입니다. 한강 접근성이 뛰어나 주말 나들이 수요도 유입됩니다.',
    '{"reasons":["이촌동 고급 아파트 단지 배후 고소득 소비층","외국인 거주자 비율 높아 글로벌 취향 수요","한강공원 인접으로 주말 가족 방문객 유입","경쟁도가 낮아 단골 기반 안정 영업 가능"],"warnings":["배후 인구 규모가 크지 않아 매출 상한 있음","임대료 대비 유동인구가 제한적"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),

  -- ─── 경기도 안양 ───
  (
    'beomgye-general',
    '안양 범계역 상권',
    '안양시 동안구',
    null,
    array['안양', '범계', '범계역', '평촌', '평촌신도시', '안양시'],
    'destination',
    'mid-high',
    'high',
    'high',
    'strong',
    'strong',
    85,
    '수도권 10대 상권에 선정된 안양 최대 상업 집결지입니다. 일 유동인구 20만 명으로 평촌신도시의 독점 상권을 형성하고 있으며, 임대료는 전국 10위 수준(1㎡당 71,200원)입니다.',
    '{"reasons":["일 유동인구 20만 명으로 수도권 10대 상권 선정","평촌신도시 30만 인구를 독점하는 핵심 상권","낮밤·요일 관계없이 안정적인 유동인구","4호선 범계역 역세권으로 광역 수요까지 흡수"],"warnings":["임대료가 전국 10위 수준으로 서울 일부 상권 이상","경쟁도가 높아 차별화 전략 필수","권리금 규모가 큰 편"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),
  (
    'pyeongchon-central-general',
    '평촌 중앙 상권',
    '안양시 동안구',
    null,
    array['안양', '평촌', '평촌역', '호계동', '비산동', '안양시'],
    'residential',
    'mid',
    'mid-high',
    'high',
    'strong',
    'strong',
    80,
    '평촌신도시 배후 주거 수요를 기반으로 한 안정적인 생활 상권입니다. 범계역 메인 상권보다 임대료가 낮고 단골 고객 형성이 수월합니다.',
    '{"reasons":["평촌신도시 30만 주거 배후 안정 수요","범계역 대비 임대료 낮아 초기 투자 유리","평일·주말 고르게 생활 소비 유입"],"warnings":["범계역 메인 상권과 수요 분산","외부 목적 방문 수요는 제한적"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),

  -- ─── 경기도 용인 ───
  (
    'jugwon-general',
    '용인 죽전역 상권',
    '용인시 수지구',
    null,
    array['용인', '죽전', '죽전역', '수지구', '분당선', '죽전동'],
    'residential',
    'mid',
    'mid-high',
    'high',
    'strong',
    'strong',
    82,
    '수인분당선 죽전역을 중심으로 수지구 핵심 상권을 형성합니다. 수지구 인구 37.5만을 배후로 두며, 강남·분당 접근성이 뛰어납니다.',
    '{"reasons":["수인분당선 직결로 강남·분당 30분 접근","수지구 37.5만 인구 배후 안정 수요","죽전동·광교신도시 연계 광역 소비"],"warnings":["서울 상권 대비 유동인구 규모 작음","대형 프랜차이즈 위주 경쟁 심화"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),
  (
    'sujiguicheong-general',
    '수지구청역 상권',
    '용인시 수지구',
    null,
    array['용인', '수지', '수지구청역', '풍덕천동', '신분당선', '수지구'],
    'residential',
    'mid',
    'mid',
    'mid-high',
    'strong',
    'mid-high',
    77,
    '신분당선 수지구청역 일대 학원가와 생활 상권이 공존하는 지역입니다. 교육열 높은 30-40대 학부모 수요와 배후 주거 수요가 안정적입니다.',
    '{"reasons":["신분당선으로 강남 직결 교통","교육열 높은 30-40대 학부모 소비력 탄탄","학원가 연계 이동 동선 상 카페·외식 수요"],"warnings":["유동인구 규모가 역세권 대형 상권 대비 작음","학원 영업 시간 외 수요 감소"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  ),

  -- ─── 서울역 주변 ───
  (
    'seoulstation-general',
    '서울역 상권',
    '중구',
    null,
    array['서울역', '서울역 주변', '중림동', '만리동', '서계동', '청파동'],
    'office',
    'mid-high',
    'mid-high',
    'high',
    'strong',
    'mid-high',
    83,
    'KTX·공항철도·1·4호선이 교차하는 서울 최대 교통 허브 상권입니다. 출장·여행객 통행량이 상시 높으며, 서계동·청파동 등 인근 골목에 감성 카페·식당이 빠르게 늘고 있습니다.',
    '{"reasons":["KTX·공항철도·지하철 교차로 일 유동인구 최상급","지방 출장객·외국인 관광객 상시 유입","서계동·만리동 신흥 감성 골목 상권 성장 중"],"warnings":["역 직결 상권과 골목 상권 간 격차 큼","기업 오피스 밀집지 특성상 주말 수요 급감","역 인근 임대료는 프리미엄 수준"]}'::jsonb,
    'fresh',
    '2026-03-01',
    '2026-09-01',
    null
  )

on conflict (region_key) do update
  set
    region_name = excluded.region_name,
    district_name = excluded.district_name,
    summary = excluded.summary,
    evidence = excluded.evidence,
    base_score = excluded.base_score,
    updated_at = now();
