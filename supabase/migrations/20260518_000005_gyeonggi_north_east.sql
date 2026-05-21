-- ════════════════════════════════════════════════════════════════════════
--  경기 북부·동부 (2026-05-18)
--  남양주·의정부·구리·가평·포천·동두천·양주·파주·김포·이천·오산·안성·여주
-- ════════════════════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- ── 남양주시 (인구 73만) ──
  (
    'namyangju-dasan-general', '다산신도시·진건', '남양주시', null,
    array['다산역', '다산신도시', '진건', '남양주시', '도농역', '도농'],
    'residential', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 76,
    '8호선 다산역 (2024 개통) + 다산신도시 + 진건지구 입주. GTX-B 별내·다산 정차 예정 2030+ 호재.',
    '{"reasons":["8호선 다산역 2024 개통","GTX-B 다산 2030+ 호재","다산신도시 신축 단지 입주","30-40대 고소득층 거주"],"warnings":["임대료 가파른 상승","상권 안정화 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'namyangju-byeollae-general', '별내·별내신도시', '남양주시', null,
    array['별내역', '별내', '별내신도시', '남양주시', '8호선', '별내선'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '8호선 별내역 + 별내신도시 + GTX-B 별내 정차 예정. 30-40대 신축 거주 + 서울 동북부 광역 접근성.',
    '{"reasons":["8호선 별내역","GTX-B 별내 정차 예정","별내신도시 신축 단지","30-40대 거주"],"warnings":["서울 핵심부 접근성은 보통","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'namyangju-wangsuk-general', '왕숙신도시', '남양주시', null,
    array['왕숙신도시', '남양주왕숙', '왕숙지구', '남양주시', '진접', '오남'],
    'residential', 'mid', 'low', 'mid', 'mid-high', 'mid-high', 64,
    '왕숙 3기 신도시 (66000세대) + GTX-B + 4호선 진접선. 2027~2030 입주 본격화 신흥 상권.',
    '{"reasons":["3기 신도시 66000세대 호재","GTX-B + 4호선 진접선","대규모 신축 단지 입주 예정"],"warnings":["입주 본격화 전","상권 형성 초기"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'jinjeop-station-general', '진접·진접지구', '남양주시', null,
    array['진접역', '진접', '진접지구', '남양주시', '오남', '오남역'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 60,
    '4호선 진접선 2022 개통 + 진접지구 신축. 30-40대 거주 + 서울 노원 (78) 광역 접근성.',
    '{"reasons":["4호선 진접선 2022 개통","진접지구 신축 단지","임대료 합리적"],"warnings":["상권 정체성 약함","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 의정부시 (인구 47만) ──
  (
    'uijongbu-station-general', '의정부역·로데오거리', '의정부시', null,
    array['의정부역', '의정부로데오', '로데오거리', '의정부시', '의정부중앙로', '신세계백화점의정부점'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 75,
    '1호선·의정부경전철 의정부역 + 신세계백화점 의정부점 + 로데오거리. GTX-C 2028+ 의정부 정차 호재.',
    '{"reasons":["신세계백화점 의정부점 앵커","GTX-C 의정부 2028+ 호재","1호선·경전철 환승","의정부 광역 거점"],"warnings":["임대료 상승","경전철 환승 동선 불편"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'uijongbu-minrak-general', '민락·민락신도시', '의정부시', null,
    array['민락신도시', '민락지구', '의정부시', '의정부민락', '신곡동'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'strong', 65,
    '민락신도시 신축 단지 + 의정부경전철 + GTX-C 의정부 인접. 30-40대 거주 + 임대료 합리적.',
    '{"reasons":["민락신도시 신축 단지","GTX-C 의정부 인접 호재","임대료 합리적"],"warnings":["서울 접근성 보통","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 구리시 (인구 19만) ──
  (
    'guri-station-general', '구리역·구리중앙시장', '구리시', null,
    array['구리역', '구리', '구리중앙시장', '구리시', '롯데백화점구리점', '돌다리'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 73,
    '경의중앙 구리역 + 롯데백화점 구리점 + 8호선 별내선 (2024 개통). 구리 핵심 + 서울 동북부 광역 유입.',
    '{"reasons":["롯데백화점 구리점 앵커","경의중앙·8호선 환승","구리 본시가지 핵심"],"warnings":["서울 노원 (78) 와 광역 분산","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'guri-galmae-general', '갈매·다산 경계', '구리시', null,
    array['갈매역', '갈매', '갈매지구', '구리시', '다산신도시', '별내'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '경춘선 갈매역 + 갈매지구 신축 단지. 다산신도시 (76) + 별내 (72) 광역 시너지.',
    '{"reasons":["갈매지구 신축 단지","경춘선 갈매역","다산·별내 인접 시너지"],"warnings":["상권 형성 초기","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 파주시 (인구 50만, 운정·금촌·헤이리) ──
  (
    'paju-unjeong-general', '운정·운정신도시', '파주시', null,
    array['운정역', '운정', '운정신도시', '파주시', '교하', '야당역'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 78,
    'GTX-A 운정역 2024.3 개통 + 운정신도시. 서울 강북 광역 접근성 폭발 + 30-40대 신축 거주 가속.',
    '{"reasons":["GTX-A 운정역 2024.3 개통","운정신도시 신축 단지","서울 강북 광역 접근성","30-40대 고소득층 거주"],"warnings":["임대료 가파른 상승","상권 안정화 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'paju-geumchon-general', '금촌·파주중앙', '파주시', null,
    array['금촌역', '금촌', '파주시청', '파주시', '문산'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 64,
    '경의중앙 금촌역 + 파주시청 + 금촌중앙. 파주 본시가지 핵심 + 임대료 매우 합리적.',
    '{"reasons":["파주 본시가지 핵심","경의중앙 금촌역","임대료 매우 합리적"],"warnings":["운정 (78) 와 분산","서울 접근성 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'paju-heyri-general', '헤이리·출판도시', '파주시', null,
    array['헤이리예술마을', '헤이리', '파주출판도시', '파주시', '문화예술'],
    'destination', 'mid', 'low', 'mid', 'mid', 'mid-high', 62,
    '헤이리 예술마을 + 파주 출판도시. 주말 가족 + 30-40대 문화 소비층 목적 방문.',
    '{"reasons":["헤이리·출판도시 문화 콘텐츠","주말 가족 단위 광역 유입","임대료 합리적"],"warnings":["평일 수요 매우 약함","대중교통 접근성 매우 불편"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 김포시 (인구 48만) ──
  (
    'gimpo-hangang-general', '김포한강신도시·구래', '김포시', null,
    array['구래역', '구래', '김포한강신도시', '김포시', '마산역', '운양역'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 74,
    '김포골드라인 구래·마산·운양 + 김포한강신도시. GTX-D 예정 + 30-40대 신축 거주.',
    '{"reasons":["김포한강신도시 신축 단지","김포골드라인 환승","GTX-D 예정 호재"],"warnings":["김포골드라인 혼잡 극심","서울 접근성 GTX 의존"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gimpo-pungmu-general', '풍무·사우', '김포시', null,
    array['풍무역', '풍무', '사우역', '사우', '김포시', '김포시청'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 66,
    '김포골드라인 풍무·사우 + 김포시청. 30-40대 거주 + 임대료 합리적.',
    '{"reasons":["김포골드라인 접근성","김포시청 직장인","30-40대 거주 안정"],"warnings":["서울 접근성 보통","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 양주시 (인구 26만) ──
  (
    'yangju-okjeong-general', '옥정·양주신도시', '양주시', null,
    array['옥정신도시', '양주옥정', '옥정지구', '양주시', '덕정역', '덕정'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 66,
    '양주 옥정신도시 신축 단지 + 1호선 덕정역 + GTX-C 덕정 2028+ 호재.',
    '{"reasons":["옥정신도시 신축 단지","GTX-C 덕정 2028+ 호재","임대료 합리적"],"warnings":["서울 접근성 GTX 의존","상권 형성 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 동두천시 (인구 9만) ──
  (
    'dongducheon-station-general', '동두천 보산·종합운동장', '동두천시', null,
    array['동두천역', '동두천', '보산역', '보산', '종합운동장역', '동두천시'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 56,
    '1호선 동두천·보산·종합운동장. 동두천 본시가지 + 미군기지 관광 콘텐츠 일부.',
    '{"reasons":["1호선 접근성","임대료 매우 낮음","미군기지 관광 콘텐츠 일부"],"warnings":["인구 9만 한계","외부 유입 매우 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 포천시 (인구 14만) ──
  (
    'pocheon-songwoo-general', '소흘·송우', '포천시', null,
    array['소흘읍', '송우리', '포천시', '포천중앙', '의정부'],
    'residential', 'low', 'mid', 'mid', 'mid', 'mid-high', 56,
    '포천 본시가지 + 소흘읍. 의정부 (75) 광역 접근성 + 임대료 매우 낮음.',
    '{"reasons":["임대료 매우 낮음","포천 본시가지","의정부 광역 접근성"],"warnings":["인구 14만 한계","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 가평군 (인구 6만) ──
  (
    'gapyeong-station-general', '가평·자라섬', '가평군', null,
    array['가평역', '가평', '자라섬', '가평군', '청평', '청평역'],
    'destination', 'low', 'low', 'mid', 'mid-high', 'mid-high', 58,
    '경춘선 가평·청평역 + 자라섬 + 가평 5일장. 주말 가족 + 캠핑 관광 광역 유입.',
    '{"reasons":["자라섬 캠핑 관광","경춘선 접근성","가평 5일장","주말 가족 광역 유입"],"warnings":["평일 수요 매우 약함","계절성 매우 큼"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 이천시 (인구 22만) ──
  (
    'icheon-station-general', '이천역·이천중앙', '이천시', null,
    array['이천역', '이천', '이천시', '이천중앙', '이천쌀밥', '이천터미널'],
    'destination', 'mid', 'mid', 'mid-high', 'strong', 'strong', 64,
    '경강선 이천역 + 이천 본시가지 + 이천쌀밥 명물. SK하이닉스 직장인 + 30-40대 거주.',
    '{"reasons":["SK하이닉스 이천공장 직장인","이천쌀밥 광역 관광 수요","경강선 이천역","임대도 합리적"],"warnings":["서울 접근성 보통","외부 유입 일부 한정"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 오산시 (인구 24만) ──
  (
    'osan-station-general', '오산역·세교지구', '오산시', null,
    array['오산역', '오산', '세교지구', '오산시', '오산대'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 63,
    '경부선 오산역 + 세교지구 신축 단지. 30-40대 거주 + 화성·평택 광역 시너지.',
    '{"reasons":["세교지구 신축 단지","경부선 오산역","오산대 학생 수요"],"warnings":["서울 접근성 보통","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 안성시 (인구 19만) ──
  (
    'anseong-station-general', '안성·공도', '안성시', null,
    array['안성', '안성시', '공도읍', '안성중앙', '안성터미널'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 56,
    '안성 본시가지 + 공도읍. 임대료 매우 합리적 + 평택 (68) 인접 시너지.',
    '{"reasons":["임대료 매우 합리적","안성 본시가지","공도읍 신축 단지 일부"],"warnings":["서울 접근성 매우 약함","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 여주시 (인구 11만) ──
  (
    'yeoju-station-general', '여주·여주역', '여주시', null,
    array['여주역', '여주', '여주시', '여주프리미엄아울렛', '신륵사'],
    'destination', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '경강선 여주역 + 여주프리미엄아울렛 + 신륵사. 주말 가족 + 광역 관광 유입.',
    '{"reasons":["여주프리미엄아울렛 광역 관광","경강선 여주역","신륵사 관광 자원"],"warnings":["인구 11만 한계","평일 수요 매우 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 광주시 (인구 41만, 경기 광주) ──
  (
    'gwangju-station-general', '경기광주·역동', '광주시', null,
    array['경기광주역', '경기광주', '광주시', '역동', '오포', '곤지암'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 66,
    '경강선 경기광주역 + 광주 본시가지. 30-40대 거주 + 분당·판교 광역 통근 인구.',
    '{"reasons":["경강선 경기광주역","분당·판교 통근 인구","광주 본시가지 핵심"],"warnings":["전라 광주와 검색 혼동","외부 유입 제한"]}'::jsonb,
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
