-- ════════════════════════════════════════════════════════════════════════
--  경기 서부·서남부 (2026-05-18)
--  부천·안양·화성·평택·안산·시흥·광명·하남·과천·의왕·군포
-- ════════════════════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- ── 부천시 (인구 78만) ──
  (
    'bucheon-station-general', '부천역·로데오거리', '부천시', null,
    array['부천역', '부천로데오', '로데오거리', '부천시', '심곡동', '원미구', 'AK광장'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 76,
    '경인선 부천역 + 로데오거리 + AK광장. 인천·부천 광역 유입 + 7호선 부천종합운동장 연결. 일 환승객 12만+.',
    '{"reasons":["경인선 부천역 환승 거점","AK광장·로데오거리 앵커","인천·부천 광역 유입"],"warnings":["임대료 가파른 상승","상권 분산 (중동·송내 등)"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'jungdong-station-general', '중동역·중동신도시', '부천시', null,
    array['중동역', '중동', '중동신도시', '부천시', '현대백화점중동점', '뉴코아아울렛'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 75,
    '경인선 중동역 + 현대백화점 중동점 + 뉴코아아울렛 + 중동신도시. 가족 단위 주말 + 학원가 결합.',
    '{"reasons":["현대백화점 중동점 앵커","중동신도시 거주 배후","학원가 시너지","경인선 중동역"],"warnings":["임대료 상승","주차 부족"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'songnae-station-general', '송내역·송내중앙공원', '부천시', null,
    array['송내역', '송내', '송내중앙공원', '부천시', '상동', '상동역'],
    'residential', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 68,
    '경인선 송내역 + 송내중앙공원 + 상동신도시 인접. 30-40대 거주 + 인천 부평 (62) 광역 시너지.',
    '{"reasons":["송내중앙공원 주말 가족 수요","상동신도시 거주 배후","경인선 송내역"],"warnings":["상권 분산","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'sangdong-station-general', '상동·소사', '부천시', null,
    array['상동역', '상동', '소사역', '소사', '부천시', '서울외곽순환'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 65,
    '경인선 상동역 + 7호선 소사역 환승. 신축 단지 거주 + 가족 단위 주말 수요.',
    '{"reasons":["7호선 상동·소사 환승","신축 단지 입주","30-40대 거주 안정"],"warnings":["상권 정체성 약함","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 안양시 (인구 55만) ──
  (
    'pyeongchon-rotary-general', '평촌·범계 로데오', '안양시 동안구', null,
    array['평촌역', '범계역', '평촌중앙공원', '동안구', '안양시', '평촌학원가', '평촌'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 78,
    '4호선 평촌역·범계역 + 평촌중앙공원 + 평촌 학원가. 안양 핵심 + 30-40대 거주 + 학원가 매우 강함.',
    '{"reasons":["평촌 학원가 광역 유입","평촌중앙공원 가족 수요","4호선 환승","30-40대 고소득층 거주"],"warnings":["임대료 가파른 상승","방학 수요 변동"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'anyang-1bgan-general', '안양1번가', '안양시 만안구', null,
    array['안양역', '안양1번가', '만안구', '안양시', '안양로데오', '명학역'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 70,
    '경부선 안양역 + 안양1번가. 안양 본시가지 핵심 + 학생·30-40대 야간 외식 거점.',
    '{"reasons":["경부선 안양역","안양1번가 야간 외식 거점","30-40대 거주 배후"],"warnings":["평촌 (78) 과 광역 분산","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'pyeongchon-hagwon-general', '평촌 학원가', '안양시 동안구', null,
    array['평촌학원가', '범계역', '평촌역', '동안구', '안양시', '귀인동'],
    'residential', 'high', 'high', 'high', 'strong', 'strong', 76,
    '평촌 학원가 핵심 (귀인동) — 경기 남부 최대 학원가. 학부모·학생 + 30-40대 거주 매우 안정.',
    '{"reasons":["경기 남부 최대 학원가","학부모·학생 안정 수요","고소득층 거주 배후"],"warnings":["방학 수요 변동","임대료 매우 높음"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 화성시 (인구 95만, 동탄 핵심) ──
  (
    'dongtan2-meta-general', '동탄2신도시 메타폴리스', '화성시', null,
    array['동탄역', '동탄', '메타폴리스', '동탄신도시', '화성시', '동탄2신도시'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 80,
    '동탄2신도시 핵심 + 메타폴리스 + 동탄역 GTX-A 2024.3 개통. 30-40대 신축 거주 + GTX 호재 가속.',
    '{"reasons":["GTX-A 동탄역 2024.3 개통","메타폴리스·동탄2신도시 신축 단지","30-40대 고소득층 거주","SRT 동탄역 시너지"],"warnings":["임대료 가파른 상승","상권 안정화 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'dongtan1-bansong-general', '동탄1·반송', '화성시', null,
    array['반송역', '반송동', '동탄1신도시', '화성시', '능동', '능동역'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 74,
    '동탄1신도시 + 반송 카페거리 + 능동. 동탄2 (80) 인접 시너지 + 30-40대 거주.',
    '{"reasons":["동탄1신도시 거주 배후","반송 카페거리","동탄2 인접 시너지"],"warnings":["동탄2 본진과 분산","상권 안정화 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'hwaseong-bonggdam-general', '봉담·향남', '화성시', null,
    array['봉담', '향남', '화성시', '봉담읍', '향남읍', '향남신도시'],
    'residential', 'low', 'mid', 'mid', 'mid', 'mid-high', 58,
    '봉담·향남 신도시 입주 본격화. 30-40대 거주 + 임대료 매우 합리적.',
    '{"reasons":["향남·봉담 신도시 입주","임대료 매우 합리적","30-40대 거주 배후"],"warnings":["서울 접근성 매우 약함","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 평택시 (인구 60만) ──
  (
    'pyeongtaek-jije-general', '평택지제·SRT', '평택시', null,
    array['평택지제역', '지제역', '평택', '평택시', 'SRT평택', '고덕신도시'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 75,
    'SRT 평택지제역 + GTX-A 2024.3 개통 + 고덕신도시 입주. 평택 핵심 + 30-40대 거주.',
    '{"reasons":["GTX-A 평택지제 2024.3 개통","SRT 평택지제역","고덕신도시 신축 단지 입주"],"warnings":["서울 접근성은 GTX 의존","상권 안정화 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'pyeongtaek-station-general', '평택역·평택로데오', '평택시', null,
    array['평택역', '평택로데오', '평택', '평택시', 'AK플라자평택'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 68,
    '경부선 평택역 + AK플라자 평택점 + 평택로데오. 평택 본시가지 핵심.',
    '{"reasons":["AK플라자 평택점 앵커","평택 본시가지 핵심","경부선 평택역"],"warnings":["고덕신도시·지제 (75) 와 분산","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 안산시 (인구 65만) ──
  (
    'ansan-station-general', '안산역·중앙역 로데오', '안산시 단원구', null,
    array['안산역', '중앙역', '중앙로데오', '단원구', '안산시', '한대앞역'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 72,
    '4호선 안산역·중앙역 + 중앙로데오 + 한양대 안산 캠퍼스. 안산 본시가지 핵심 + 외국인 거주민 다양성.',
    '{"reasons":["4호선 안산역 환승","중앙로데오 야간 외식 거점","한양대 안산 캠퍼스","외국인 거주 다양성"],"warnings":["상권 분산 (고잔·초지 등)","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gojan-station-general', '고잔·초지 신도시', '안산시 단원구', null,
    array['고잔역', '고잔동', '초지역', '초지', '단원구', '안산시', '안산문화광장'],
    'residential', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 70,
    '4호선 고잔·초지역 + 안산문화광장 + 고잔신도시. 30-40대 거주 + 가족 단위 주말 수요.',
    '{"reasons":["고잔신도시 거주 배후","안산문화광장 주말 가족 수요","4호선 환승"],"warnings":["안산역 본진 (72) 과 분산","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 시흥시 (인구 56만) ──
  (
    'siheung-jeongwang-general', '정왕·시흥시청', '시흥시', null,
    array['정왕역', '정왕', '시흥시청역', '시흥시청', '시흥시', '월곶역'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 65,
    '4호선 정왕역 + 시흥시청 + 정왕 산단. 30-40대 거주 + 외국인 거주민 다양성 + 시흥시청 공무원.',
    '{"reasons":["4호선 정왕역","시흥시청 직장인","정왕 산단 직장인","외국인 거주 다양성"],"warnings":["서울 접근성 보통","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'siheung-baegot-general', '배곧신도시', '시흥시', null,
    array['배곧신도시', '시흥배곧', '배곧', '시흥시', '오이도', '오이도역'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'strong', 68,
    '배곧신도시 신축 단지 + 4호선 오이도역. 30-40대 거주 + 신안산선 2026말+ 호재.',
    '{"reasons":["배곧신도시 신축 단지","신안산선 2026말+ 호재","30-40대 거주 안정"],"warnings":["상권 형성 진행 중","서울 접근성 보통"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 광명시 (인구 28만) ──
  (
    'gwangmyeong-station-general', '광명역 KTX', '광명시', null,
    array['광명역', '광명', 'KTX광명', '광명시', '코스트코광명', '이케아광명'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 76,
    'KTX 광명역 + 이케아 광명 + 코스트코 광명 + 광명뉴타운. 광역 쇼핑 + 신안산선 2026말+ 호재.',
    '{"reasons":["이케아·코스트코 광명 광역 앵커","KTX 광명역","신안산선 2026말+ 호재","광명뉴타운 신축 단지"],"warnings":["상권 분산","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gwangmyeong-cheolsan-general', '철산·광명사거리', '광명시', null,
    array['철산역', '철산', '광명사거리역', '광명사거리', '광명시'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 70,
    '7호선 철산역 + 광명사거리 + 광명전통시장. 광명 본시가지 핵심 + 학원가.',
    '{"reasons":["7호선 철산·광명사거리","광명 본시가지 핵심","학원가 + 학생 수요"],"warnings":["광명역 KTX (76) 와 분산","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 하남시 (인구 33만, 위례·미사) ──
  (
    'hanam-misa-general', '하남미사·스타필드하남', '하남시', null,
    array['미사역', '하남미사', '미사강변', '스타필드하남', '하남시', '미사신도시'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 78,
    '5호선 미사역 + 스타필드 하남 + 미사신도시 + 미사강변. 30-40대 거주 + 광역 쇼핑 + 한강 산책.',
    '{"reasons":["스타필드 하남 광역 앵커","미사신도시 신축 단지","5호선 미사역","미사강변 한강 산책 동선"],"warnings":["임대료 가파른 상승","서울 강동 (강일·고덕) 과 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'hanam-gyosan-general', '교산신도시', '하남시', null,
    array['교산신도시', '하남교산', '교산지구', '하남시', '하남BRT'],
    'residential', 'mid', 'low', 'mid', 'mid', 'mid-high', 62,
    '교산 3기 신도시 (32000세대) + 하남선 (예정). 2027~2030 입주 본격화 신흥 상권.',
    '{"reasons":["3기 신도시 32000세대 호재","하남선 예정","30-40대 거주 예정"],"warnings":["입주 본격화 전","상권 형성 초기"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 과천시 (인구 8만) ──
  (
    'gwacheon-jucheong-general', '과천 정부청사·과천중앙', '과천시', null,
    array['과천역', '정부과천청사', '정부청사역', '과천중앙', '과천시', '대공원역', '서울대공원'],
    'office', 'high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '4호선 과천역·정부과천청사역 + 정부청사 공무원 + 서울대공원. 강남 (92) 인접 + 임대료 매우 높음.',
    '{"reasons":["정부청사 공무원 안정 수요","강남 인접 고소득층 거주","서울대공원 주말 가족 수요"],"warnings":["과천 인구 적음","임대료 매우 높음"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gwacheon-jisigi-general', '과천지식정보타운', '과천시', null,
    array['과천지식정보타운', '지식정보타운역', '과천시', '인덕원역', '인덕원'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '과천지식정보타운 + 인덕원역 GTX-C 정차 예정 2028+ 호재. IT·바이오 기업 입주 본격화.',
    '{"reasons":["GTX-C 인덕원역 2028+ 호재","IT·바이오 기업 입주","과천지식정보타운 신축 단지"],"warnings":["상권 형성 진행 중","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 의왕시 (인구 16만) ──
  (
    'uiwang-station-general', '의왕역·내손', '의왕시', null,
    array['의왕역', '의왕', '내손동', '의왕시', '인덕원', '백운호수'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 64,
    '경부선 의왕역 + 내손 신축 단지 + 백운호수. GTX-C 인덕원 인접 호재 + 30-40대 거주.',
    '{"reasons":["GTX-C 인덕원 인접 호재","내손 신축 단지 입주","백운호수 주말 가족 수요"],"warnings":["상권 정체성 약함","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 군포시 (인구 26만) ──
  (
    'gunpo-sanbon-general', '산본·산본중심상가', '군포시', null,
    array['산본역', '산본', '산본중심상가', '군포시', '군포역', '군포'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 66,
    '4호선 산본역 + 산본중심상가 + 산본신도시. 군포 핵심 + 30-40대 거주 + 학원가.',
    '{"reasons":["산본신도시 거주 배후","산본중심상가 광역 유입","4호선 산본역"],"warnings":["서울 접근성 보통","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
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
