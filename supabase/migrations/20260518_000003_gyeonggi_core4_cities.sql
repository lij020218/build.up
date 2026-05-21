-- ════════════════════════════════════════════════════════════════════════
--  경기권 핵심 4시 상권 1차 (2026-05-18)
--  수원·성남·고양·용인 — 인구 100만+ 광역시급 도시
--
--  점수 SSOT (docs/MARKET_LOCATION_SCORE_GUIDE.md) §3 anchor 와 정합:
--    - 경기 핵심 상권 최상위: 분당 정자 / 일산 라페스타 / 광교 / 동탄2 = 75~80
--    - 일반 핵심: 광역시급 중심 (수원역 / 분당역 / 일산 호수공원) = 70~78
--    - 학원가·주거: 60~70
--
--  GTX 호재 반영:
--    - GTX-A 2024.3 전구간 개통 완료 (동탄·수서·평택지제)
--    - GTX-C 2028+ 의왕·금정·수원·평택
--    - 신분당선 광교~호매실 연장 2025+
-- ════════════════════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- ────────────────────────────────────────────────────────────────────
  -- 수원시 (인구 122만)
  -- ────────────────────────────────────────────────────────────────────
  (
    'suwon-station-rotary-general', '수원역 로데오', '수원시 팔달구', null,
    array['수원역', '수원역로데오', '수원로데오', '팔달구', '수원시', 'AK플라자', '수원'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 78,
    '경부선·분당선·수인선·수원역 환승 + AK플라자 + 노보텔. 경기 남부 최대 환승 거점이며 2025 화서·매탄 신축 단지 시너지.',
    '{"reasons":["3개 노선 환승 거점","AK플라자·노보텔 앵커","경기 남부 광역 유입","화서·매탄 신축 단지 배후"],"warnings":["서울 강남 접근성은 보통","주차 매우 부족"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gwanggyo-jungang-general', '광교중앙·앨리웨이', '수원시 영통구', null,
    array['광교중앙역', '광교', '광교앨리웨이', '광교호수공원', '영통구', '수원시', '광교신도시'],
    'destination', 'high', 'mid-high', 'high', 'strong', 'strong', 80,
    '광교신도시 핵심 + 앨리웨이 광교 + 광교호수공원. 신분당선 광교중앙역 + 30-40대 신축 거주 + 가족 주말 수요.',
    '{"reasons":["광교신도시 신축 단지 거주 배후","앨리웨이·호수공원 주말 가족 수요","신분당선 광교중앙역 접근성","30-40대 고소득층 거주"],"warnings":["임대료 가파른 상승","주말 외 평일 수요 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'yeongtong-station-general', '영통역·영통중심상가', '수원시 영통구', null,
    array['영통역', '영통', '영통중심상가', '영통구', '수원시', '망포역', '망포'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 74,
    '분당선 영통·망포역 + 영통중심상가. 삼성전자 수원사업장 직장인 + 영통신도시 거주민 + 학원가 결합.',
    '{"reasons":["삼성전자 수원사업장 직장인 수요","영통신도시 거주 배후","분당선 접근성","학원가 시너지"],"warnings":["삼성 의존도 높음","상권 분산 (광교·매탄 등)"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'suwon-haenggung-general', '수원행궁·통닭거리', '수원시 팔달구', null,
    array['행궁동', '수원행궁', '통닭거리', '팔달구', '수원시', '화성행궁', '수원화성'],
    'destination', 'mid', 'mid-high', 'high', 'strong', 'strong', 72,
    '수원화성·행궁 + 통닭거리. 외국인 관광객 + 30-40대 미식 + 야간 수요. 2024~2025 SNS 바이럴 가속.',
    '{"reasons":["수원화성 외국인 관광 자원","통닭거리 SNS 바이럴","30-40대 야간 외식 거점"],"warnings":["골목 보행 동선 단절","주차 매우 어려움"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'yeongtong-mangpo-general', '망포·신영통', '수원시 영통구', null,
    array['망포역', '망포', '신영통', '영통구', '수원시', '망포지구'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '망포지구 신축 단지 + 분당선 망포역. 30-40대 거주 + 삼성전자 직장인 일부 거주.',
    '{"reasons":["망포지구 신축 단지 입주","분당선 접근성","30-40대 거주 안정"],"warnings":["상권 형성 초기","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'hwaseo-station-general', '화서역·스타필드', '수원시 장안구', null,
    array['화서역', '화서', '스타필드수원', '장안구', '수원시', '신분당선'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 75,
    '신분당선 화서역 + 스타필드 수원 2024 개장 + 화서신도시 신축 단지. 2025년 신규 핫 라이징.',
    '{"reasons":["스타필드 수원 2024 개장 앵커","신분당선 화서역 호재","화서신도시 신축 입주"],"warnings":["임대료 가파른 상승","상권 안정화에 1-2년 필요"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ────────────────────────────────────────────────────────────────────
  -- 성남시 (인구 92만, 분당·판교·중원·수정)
  -- ────────────────────────────────────────────────────────────────────
  (
    'pangyo-techno-general', '판교 테크노밸리', '성남시 분당구', null,
    array['판교역', '판교', '판교테크노밸리', '카카오', '네이버', '성남시', '분당구'],
    'office', 'high', 'high', 'high', 'strong', 'strong', 86,
    '카카오·네이버·NC·엔씨소프트 등 IT 본사 집결 한국 최대 IT 클러스터. 일 직장인 8만+ + 신분당 + 경강선. 점심·저녁 수요 매우 강함.',
    '{"reasons":["IT 본사 집결 한국 최대 클러스터","직장인 8만+ 안정 점심·저녁 수요","신분당·경강선 환승","현대백화점판교점 앵커"],"warnings":["주말 직장인 수요 급감","임대료 강남 수준"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'jeongja-station-general', '정자역·정자카페거리', '성남시 분당구', null,
    array['정자역', '정자동', '정자카페거리', '분당구', '성남시', '미금역', '미금'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 80,
    '분당선·신분당 정자역 환승 + 정자카페거리. 분당 거주 30-40대 고소득층 + 판교 직장인 + 외국인 관광객 일부 유입.',
    '{"reasons":["분당선·신분당 환승","분당 고소득층 배후","카페거리 30-40대 미식 거점","판교 (86) 인접 시너지"],"warnings":["임대료 매우 높음","주차 매우 부족"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'seohyeon-station-general', '서현역·AK플라자', '성남시 분당구', null,
    array['서현역', '서현동', 'AK플라자분당', 'AK플라자', '분당구', '성남시', '분당'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 78,
    '분당선 서현역 + AK플라자 분당점 + 분당중앙공원. 분당 핵심 중심상권, 가족 단위 안정 수요.',
    '{"reasons":["AK플라자 분당점 앵커","분당 중심 광역 수요","분당선 접근성","가족 단위 주말 수요"],"warnings":["임대료 분당 최고 수준","유행 트렌드 보수적"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'sunae-station-general', '수내역·내정', '성남시 분당구', null,
    array['수내역', '수내동', '내정', '분당구', '성남시', '분당', '학원가'],
    'residential', 'high', 'mid-high', 'mid-high', 'strong', 'strong', 75,
    '분당선 수내역 + 분당 학원가 중심. 분당 거주민 + 학부모·학생 수요 매우 안정.',
    '{"reasons":["분당 학원가 중심지","학부모·학생 안정 수요","분당 고소득층 배후"],"warnings":["방학 수요 변동","임대료 분당 수준"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'sungnam-jungwon-moran-general', '모란·중원구청', '성남시 중원구', null,
    array['모란역', '모란', '중원구청', '성남시 중원구', '단대오거리역', '단대오거리'],
    'destination', 'mid', 'mid-high', 'high', 'strong', 'strong', 70,
    '분당선 모란역 + 단대오거리 + 모란시장. 성남 본시가지 핵심 + 모란시장 5일장 명물.',
    '{"reasons":["모란시장 5일장 광역 유입","분당선·8호선 접근성","성남 본시가지 핵심"],"warnings":["분당 (78) 과 수요 분산","임대료 상승 추세"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'wirye-shinheung-general', '위례·신흥', '성남시 수정구', null,
    array['위례신도시', '위례', '신흥역', '신흥', '성남시 수정구', '수정구', '복정역'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '위례신도시 신축 단지 + 위례트램 (2026 개통 예정) + 8호선 접근성. 30-40대 신축 거주 배후.',
    '{"reasons":["위례신도시 신축 단지 거주","위례트램 2026 개통 호재","8호선 복정역 접근성"],"warnings":["서울 강남 접근성 보통","상권 형성 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ────────────────────────────────────────────────────────────────────
  -- 고양시 (인구 107만, 일산동·서·덕양)
  -- ────────────────────────────────────────────────────────────────────
  (
    'lapesta-western-dome-general', '라페스타·웨스턴돔', '고양시 일산동구', null,
    array['라페스타', '웨스턴돔', '정발산역', '일산동구', '고양시', '일산', '백석'],
    'destination', 'mid-high', 'high', 'high', 'strong', 'strong', 78,
    '일산 라페스타·웨스턴돔 결합 일산 동구 핵심 상권. 3호선 정발산역 + 일산호수공원 인접. 일산 거주민 + 광역 유입.',
    '{"reasons":["라페스타·웨스턴돔 앵커 결합","일산 동구 핵심 광역 상권","3호선 정발산역 접근성","일산호수공원 주말 가족 수요"],"warnings":["GTX-A 운정 (반대편 일산서구) 시너지 약함","임대료 일산 수준"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'ilsan-juyeop-general', '주엽역·일산호수공원', '고양시 일산서구', null,
    array['주엽역', '주엽동', '일산호수공원', '일산서구', '고양시', '대화역', '대화', '일산'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 75,
    '3호선 주엽역 + 일산호수공원 인접. 일산서구 핵심 + 가족 단위 주말 + 30-40대 산책 수요.',
    '{"reasons":["일산호수공원 주말 가족 수요","3호선 주엽역 접근성","일산서구 거주 배후 안정"],"warnings":["임대료 상승 가속","주차 부족"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'goyang-baekseok-general', '백석·고양시청', '고양시 일산동구', null,
    array['백석역', '백석', '고양시청', '일산동구', '고양시', '대곡역', '대곡'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '3호선 백석역 + 고양시청 + GTX-A 대곡역 (2024 개통). 고양시청 공무원 + 대곡역 호재.',
    '{"reasons":["GTX-A 대곡역 2024 개통 호재","고양시청 직장인 수요","3호선 접근성"],"warnings":["주말 수요 약함","상권 분산"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'goyang-haengsin-general', '행신역·삼송지구', '고양시 덕양구', null,
    array['행신역', '행신동', '덕양구', '고양시', '삼송역', '삼송지구', '원흥역', '원흥'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '경의중앙 행신역 + 삼송지구 신축 단지 + 3호선 삼송역. 30-40대 신축 거주 안정 + GTX-A 대곡 인접.',
    '{"reasons":["삼송지구 신축 단지 입주","경의중앙·3호선 접근성","GTX-A 대곡 인접 호재"],"warnings":["서울 접근성 보통","상권 형성 진행 중"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'goyang-changneung-general', '창릉신도시', '고양시 덕양구', null,
    array['창릉신도시', '창릉지구', '덕양구', '고양시', '화전역', '화전'],
    'residential', 'mid', 'low', 'mid', 'mid', 'mid-high', 64,
    '창릉 3기 신도시 (38000세대) + 고양선 (예정). 2027~2030 입주 본격화 예정 신흥 상권.',
    '{"reasons":["3기 신도시 38000세대 호재","고양선 예정","30-40대 거주 예정"],"warnings":["입주 본격화 전 단계","상권 형성 초기"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'goyang-wondang-general', '원당·고양어울림누리', '고양시 덕양구', null,
    array['원당역', '원당', '고양어울림누리', '덕양구', '고양시', '대장지구'],
    'residential', 'mid', 'mid', 'mid', 'strong', 'mid-high', 62,
    '3호선 원당역 + 고양어울림누리 + 대장 3기 신도시 인접. 가족 단위 주말 + 30-40대 거주.',
    '{"reasons":["대장 3기 신도시 인접 호재","어울림누리 주말 수요","3호선 접근성","임대료 합리적"],"warnings":["외부 유입 제한","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ────────────────────────────────────────────────────────────────────
  -- 용인시 (인구 109만, 처인·기흥·수지)
  -- ────────────────────────────────────────────────────────────────────
  (
    'suji-station-general', '수지구청·풍덕천', '용인시 수지구', null,
    array['수지구청역', '수지구청', '풍덕천', '수지구', '용인시', '동천역', '동천', '죽전'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 74,
    '신분당선 수지구청·동천역 + 풍덕천 카페거리. 수지 거주 30-40대 + 분당 (78) 인접 시너지.',
    '{"reasons":["신분당선 수지구청·동천역","풍덕천 카페거리 30-40대 거점","수지 거주 안정 배후","분당 인접 시너지"],"warnings":["임대료 상승","유행 트렌드 보수적"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'jukjeon-station-general', '죽전역·신세계백화점경기점', '용인시 수지구', null,
    array['죽전역', '죽전', '신세계백화점경기점', '신세계백화점', '수지구', '용인시', '오리역'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 75,
    '분당선 죽전역 + 신세계백화점 경기점 (현대백화점 죽전점) + 단국대. 광역 쇼핑 + 학생 + 가족 수요.',
    '{"reasons":["신세계백화점 경기점 앵커","단국대 학생 수요","분당선 죽전역 접근성","수지 거주 배후"],"warnings":["주차 부족","임대료 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'giheung-station-general', '기흥역·신갈오거리', '용인시 기흥구', null,
    array['기흥역', '기흥', '신갈오거리', '기흥구', '용인시', '강남대역', '강남대'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '분당선·용인경전철 기흥역 + 신갈오거리 + 강남대. GTX-A 용인역 2024 개통 호재 시너지.',
    '{"reasons":["GTX-A 용인역 2024 개통 호재","분당선·용인경전철 환승","강남대 학생 수요","신축 단지 입주"],"warnings":["상권 분산 (수지·동백 등)","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'dongbaek-station-general', '동백·동백호수공원', '용인시 기흥구', null,
    array['동백역', '동백동', '동백호수공원', '기흥구', '용인시', '초당역', '어정역'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'strong', 68,
    '용인경전철 동백·초당·어정역 + 동백호수공원. 동백 신축 단지 거주 + 가족 단위 주말 수요.',
    '{"reasons":["동백 신축 단지 거주 안정","동백호수공원 주말 가족 수요","용인경전철 접근성"],"warnings":["서울 접근성 보통","상권 자체 규모 작음"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'cheoin-cheorcheon-general', '처인구청·중앙시장', '용인시 처인구', null,
    array['용인중앙시장', '처인구', '용인시청', '용인시', '용인터미널', '명지대'],
    'destination', 'low', 'mid', 'mid', 'mid', 'mid-high', 58,
    '용인 본시가지 + 용인중앙시장 + 명지대. 용인 처인구 핵심 + 5일장 광역 유입.',
    '{"reasons":["용인 처인구 핵심","용인중앙시장 5일장 유입","명지대 학생 수요","임대료 매우 합리적"],"warnings":["수지·기흥 (74, 72) 과 광역 분산","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'yongin-suji-mojeon-belt-general', '미금·오리·죽전 분당선 라인', '용인시 수지구', null,
    array['미금역', '오리역', '오리', '미금', '수지구', '용인시', '분당구'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 73,
    '분당선 미금·오리·죽전 3개 역 연결 라인. 분당 (78) ~ 수지 (74) 연결 신흥 거점 + 신규 입주 30-40대.',
    '{"reasons":["분당~수지 연결 라인","분당선 3개 역 접근성","신규 입주 30-40대 거주 배후"],"warnings":["분당·수지 본진과 분산","상권 정체성 약함"]}'::jsonb,
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
