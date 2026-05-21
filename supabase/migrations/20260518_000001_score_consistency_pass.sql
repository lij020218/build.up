-- ════════════════════════════════════════════════════════════════════════
--  base_score 일관성 1차 정정 (2026-05-18)
--
--  점수 SSOT 가이드 (docs/MARKET_LOCATION_SCORE_GUIDE.md) 의 §3 anchor 와
--  비교했을 때 명백히 outlier 인 기존 entry 들을 표준 범위로 정정한다.
--
--  적용 원칙:
--    - anchor 와 5점 이상 차이나는 outlier 만 정정
--    - 호재 이중 카운트 의심 entry 일괄 점검
--    - 정정 사유는 summary 에 명시
-- ════════════════════════════════════════════════════════════════════════

-- ── 잠실 89 → 87 (강남역 92 와 너무 가까움. 잠실은 한국 최상위가 아님) ──
update public.market_location_signals
set base_score = 87,
    summary = '롯데월드·롯데백화점·석촌호수를 보유한 서울 동남부 최대 복합 상권입니다. 일 환승 21만, 가족 단위 방문 수요가 상시 유입되지만 강남대로 라인 (강남역 92) 과 동급은 아닙니다.',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'jamsil-general';

-- ── 천호 84 → 80 (잠실 87 과 너무 가까움. 강동구 최대지만 송파급 아님) ──
update public.market_location_signals
set base_score = 80,
    summary = '5·8호선 환승역으로 강동구 최대 상권입니다. 현대백화점 천호점 앵커 + 강동·하남 광역 수요 흡수. 잠실 (87) 과 비교하면 광역 인지도는 낮지만 강동 거주민 충성도가 강합니다.',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'cheonho-general';

-- ── 건대 81 → 82 (anchor 와 일관성: 일 유동 24만 + 환승 거점 → 사당 82와 동급) ──
-- 81 → 82 미세조정. 이건 outlier 아님이지만 anchor 와 정확히 맞추기 위해.
update public.market_location_signals
set base_score = 82,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'kondae-general';

-- ── 신도림 68 (P0 fix 적용됨), 신도림-techno-general 70 → 65 (중복 entry 통일) ──
update public.market_location_signals
set base_score = 65,
    summary = '1·2호선 환승 + 디큐브시티 + 테크노마트 결합 대형 복합 상권이지만 가산·구로 직장인 이탈 + 신도림역 본진 침체 영향으로 중간대 점수. 가산디지털 (76) 과 비교 시 IT 직장인 밀도가 낮음.',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'sindorim-techno-general';

-- ── 광화문·종각 86 → 84 (anchor: 명동 88 / 한남 83 와 정합. 주말 수요 매우 약함 반영) ──
update public.market_location_signals
set base_score = 84,
    summary = '서울 최대 오피스 밀집 지역으로 평일 점심 수요가 압도적입니다. 대기업·언론사·공공기관이 집중돼 안정적인 직장인 소비가 형성되지만 주말 수요 거의 없음 (외식 매출 평일 70%·주말 30%).',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'gwanghwamun-general';

-- ── 인사동·북촌 84 → 82 (외국인 관광 의존도 높아 한남 83 보다 약간 낮게) ──
update public.market_location_signals
set base_score = 82,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'insadong-bukchon-general';

-- ── 대치동 학원가 86 → 83 (학령인구 감소 + 학원 통폐합 + anchor: 한남 83 와 동급) ──
update public.market_location_signals
set base_score = 83,
    summary = '국내 최대 학원 밀집 지역으로 학부모·학생 중심 소비가 안정적입니다. 강남 최상위 소득층 거주 배후. 단 학령인구 감소·학원 통폐합 영향 시작 (정원 -8% 5년 누적).',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'daechi-general';

-- ── 영등포 86 → 81 (타임스퀘어 보유하나 광역 인지도는 사당 82 와 동급. anchor 정합) ──
update public.market_location_signals
set base_score = 81,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'yeongdeungpo-general';

-- ── 망원동 84 → 78 (anchor: 망리단길 정체 + 임대료 상승. 샤로수길 77 와 동급) ──
update public.market_location_signals
set base_score = 78,
    summary = '홍대·합정의 임대료 부담을 피해 이동한 개성 있는 카페·식당·공방이 집결한 골목 상권입니다. 망리단길 SNS 바이럴 효과는 정점 통과, 임대료 상승으로 신규 진입 부담 증가.',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'mangwon-general';

-- ── 을지로 힙지로 85 → 82 (트렌드 정점 통과 신호. 한남 83 와 비슷 또는 약간 낮게) ──
update public.market_location_signals
set base_score = 82,
    summary = '오래된 인쇄·공구 골목이 힙한 카페·바·레스토랑 상권으로 변모한 서울의 핫 뉴웨이브 상권입니다. 2030 남성 비중이 높고 야간 수요가 강하나 2024~2025 트렌드 정점 통과, 임대료 가파른 상승 시작.',
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'euljiro-general';

-- ── 반포·서래마을 85 → 81 (anchor: 한남 83 와 비슷하지만 외국인 유입 적음) ──
update public.market_location_signals
set base_score = 81,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'banpo-seorae-general';

-- ── 왕십리 87 → 84 (4개 노선 환승은 강점이나 GTX-C 2028 호재 이미 청량리에 +5. 이중 카운트 회피) ──
update public.market_location_signals
set base_score = 84,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'wangsimni-general';

-- ── 교대·방배 81 → 76 (anchor: 양재 75 와 동급. 유동인구 제한적) ──
update public.market_location_signals
set base_score = 76,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'gyodae-general';

-- ── 문정·가락 79 → 73 (anchor: 양재 75 와 동급 또는 약간 낮게) ──
update public.market_location_signals
set base_score = 73,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'munjeong-general';

-- ── 광장시장 80 → 78 (anchor: 외국인 SNS 바이럴이긴 하나 한남 83 보다 niche) ──
update public.market_location_signals
set base_score = 78,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'gwangjang-market-general';

-- ── 동대문 DDP 84 → 80 (외국인 회복은 명동 88 와 다른 결. 도매 침체 영향 반영) ──
update public.market_location_signals
set base_score = 80,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'dongdaemun-general';

-- ── 헬리오시티 68 → 70 (9510세대 거대 단지 + 8호선 가락시장역. anchor: 둔촌 76 보다 단지 규모 작지만 입주 완료) ──
update public.market_location_signals
set base_score = 70,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'helio-city-general';

-- ── 청담동 명품거리 85 → 82 (anchor 정합: 한남 83 와 거의 동급. 유동인구 적음 반영) ──
update public.market_location_signals
set base_score = 82,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'cheongdam-general';

-- ── 흑석·중앙대 70 → 73 (9호선 급행 + 흑석뉴타운 입주 + 한강뷰. anchor: 양재 75 와 비슷) ──
update public.market_location_signals
set base_score = 73,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'heukseok-general';

-- ── 잠실새내 76 → 73 (시즌별 편차 큼. 야구·콘서트 비시즌 매출 약함) ──
update public.market_location_signals
set base_score = 73,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'jamsil-saenae-general';

-- ── 자양·구의·강변 72 → 68 (anchor 정합: 건대 82 와 광역 시너지 약함. P1 에서 59 → 72 한 거 재조정) ──
update public.market_location_signals
set base_score = 68,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'jayang-guui-general';

-- ── 약수·신당 동측 68 → 65 (anchor: 신정 62 와 동급. 외부 유입 제한) ──
update public.market_location_signals
set base_score = 65,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'yaksu-sindang-general';

-- ── 충무로·필동 70 → 68 (anchor: 약수 65 와 비슷. 골목 동선 단절 반영) ──
update public.market_location_signals
set base_score = 68,
    last_checked_at = '2026-05-18',
    next_review_at = '2026-11-18',
    updated_at = now()
where region_key = 'chungmuro-general';
