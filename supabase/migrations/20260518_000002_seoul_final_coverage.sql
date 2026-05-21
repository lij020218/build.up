-- ════════════════════════════════════════════════════════════════════════
--  서울 25개 구 최종 보강 (2026-05-18)
--
--  점수 SSOT (docs/MARKET_LOCATION_SCORE_GUIDE.md) §3 anchor 와 정합되도록
--  매칭. search_keywords 의 *첫 항목* = 카카오 정확 매칭 키워드 (역명·동명).
--
--  분포: 강남·서초 보강 + 영등포·관악·동작·중구·종로 + 누락된 hot 검색 케이스
-- ════════════════════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- ── 강남구 추가 (테헤란로·강남대로 라인 완성) ──
  (
    'sinsa-station-line3-general', '신사역 3호선 라인', '강남구', null,
    array['신사역', '신사동', '신사', '강남구', '논현', '논현역', '가로수길', '세로수길', '신구초사거리'],
    'destination', 'high', 'mid-high', 'high', 'strong', 'strong', 76,
    '3호선·신분당선 환승 신사역 일대로 가로수길·세로수길 진입부 역할. 일 환승객 11.5만 + 외국인 관광객 유입이 강점입니다.',
    '{"reasons":["3호선·신분당선 환승","가로수길·세로수길 진입부 역할","외국인 관광객 일 11.5만 유입"],"warnings":["가로수길 본진 침체 영향 일부","임대료 강남 수준"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gangnam-gu-office-belt-general', '강남구청·도산공원 오피스 벨트', '강남구', null,
    array['강남구청역', '강남구청', '도산공원', '학동역', '학동', '논현동', '강남구', '신사동', '청담사거리'],
    'office', 'high', 'mid', 'mid-high', 'high', 'strong', 76,
    '강남구청역 + 학동역 + 도산공원 라인 오피스·다이닝 벨트. 신규 IT 사무실·MZ 다이닝 입점이 활발합니다.',
    '{"reasons":["7호선 강남구청역·학동역 접근성","도산공원 인근 MZ 미식 거점","신규 IT 사무실 진입 가속"],"warnings":["청담 본진 (82) 과의 수요 분산","주차 인프라 제한적"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'gangnam-tehran-line-general', '테헤란로 빌딩숲', '강남구', null,
    array['테헤란로', '강남역', '역삼역', '선릉역', '삼성역', '강남구', '강남대로', 'GFC'],
    'office', 'high', 'high', 'high', 'strong', 'strong', 85,
    '강남역~삼성역 5.6km 테헤란로 라인 IT·금융 사옥 집결지. 일 직장인 28만+ 점심 수요. 강남역 (92) + 역삼 (86) + 선릉 (84) + 삼성·코엑스 (88) 가 형성하는 한국 최대 오피스 벨트.',
    '{"reasons":["IT·금융 사옥 집결지","2호선 강남~삼성 라인 핵심","직장인 28만+ 안정 수요"],"warnings":["주말 수요 급감","임대료 한국 최고 수준","경쟁 매우 치열"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 서초구 보강 ──
  (
    'gangnam-st-yangjae-belt-general', '강남역 남부 ~ 양재', '서초구', null,
    array['강남역', '양재역', '시민의숲역', '서초구', '강남대로', '뱅뱅사거리', '서초'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 84,
    '강남대로 남쪽 라인으로 강남역 본진의 임대료 부담을 회피한 다이닝·뷰티가 모입니다. 신분당선 양재 라인 접근성 강점.',
    '{"reasons":["강남대로 남쪽 라인 신흥 다이닝","신분당선 양재 라인 접근성","뱅뱅사거리 야간 외식 거점"],"warnings":["강남역 본진과 수요 분산","임대료 가파른 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'naebang-bangbae-general', '내방·방배 카페거리', '서초구', null,
    array['내방역', '방배역', '방배동', '방배카페거리', '서초구', '이수역', '동작구'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '7호선 내방역 + 4호선 방배역 + 방배카페거리 연결 라인. 30-40대 조용한 카페·다이닝 선호층 거주 배후가 강점.',
    '{"reasons":["7·4호선 환승 접근성","방배 거주 30-40대 안정 수요","조용한 분위기 선호 카페·다이닝"],"warnings":["외부 유입 제한적","유행 트렌드는 보수적"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 중구 보강 ──
  (
    'hoehyeon-namdaemun-general', '회현·남대문시장', '중구', null,
    array['회현역', '회현', '남대문시장', '남대문', '중구', '명동역', '신세계백화점본점'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 80,
    '4호선 회현역 + 남대문시장 + 신세계백화점본점 라인. 외국인 관광객 회복으로 도매·소매 동반 활성화. 명동 (88) 인접 시너지.',
    '{"reasons":["외국인 관광객 본격 회복","남대문시장 도매·소매 양축","신세계백화점본점 앵커","명동 (88) 인접 시너지"],"warnings":["임대료 높음","주말 도매 수요 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'jongno-3ga-myeongdong-link', '명동 ~ 종로3가 연결', '중구', null,
    array['종로3가역', '종로3가', '청계천', '청계3가', '청계4가', '을지로3가', '중구', '종로구'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 76,
    '명동 (88) ~ 을지로 (82) ~ 종로3가 (80) 를 잇는 청계천 라인. 외국인 관광객 + 30-40대 미식 동선이 결합됩니다.',
    '{"reasons":["청계천 산책로 + 외국인 관광 동선","30-40대 미식 거점","2·3·5호선 종로3가 환승"],"warnings":["골목 다양성 vs 인지도 약함","임대료 빠른 상승"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 종로구 보강 ──
  (
    'samcheong-dong-general', '삼청동·국립현대미술관', '종로구', null,
    array['삼청동', '국립현대미술관', '경복궁', '안국역', '북촌', '종로구', '소격동'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 75,
    '경복궁 동쪽 라인 + 국립현대미술관 + 삼청동길. 외국인 관광객 + 30-40대 문화 소비층이 결합된 niche 거점.',
    '{"reasons":["국립현대미술관 앵커","30-40대 문화 소비층 목적 방문","외국인 관광객 안정 유입"],"warnings":["유동인구 규모 자체 제한","임대료 상승 추세"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'seochon-tongin-general', '서촌·통인시장', '종로구', null,
    array['서촌', '통인시장', '경복궁역', '경복궁', '청운효자동', '종로구', '효자동'],
    'destination', 'mid-high', 'mid-high', 'mid-high', 'strong', 'strong', 76,
    '경복궁역 서쪽 서촌 일대 + 통인시장. 인사동·북촌 (82) 대비 임대료 합리적이고 카페·다이닝 진입 활발합니다.',
    '{"reasons":["경복궁 인접 외국인 관광 동선","통인시장 도시락 명물","30-40대 미식 거점"],"warnings":["골목 보행 동선 단절","주차 매우 어려움"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 영등포구 보강 ──
  (
    'mullae-yeongdeungpo-belt-general', '문래·영등포 결합 벨트', '영등포구', null,
    array['문래역', '문래동', '영등포구청역', '문래창작촌', '영등포구', '도림', '경방'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 74,
    '2호선 문래역 + 5호선 영등포구청역 사이 인디 문화 + 신축 단지 배후. 신안산선 2026말+ 호재까지 누적.',
    '{"reasons":["인디 문화 거점 + 신안산선 호재","2·5호선 환승 접근성","신축 단지 입주 가속"],"warnings":["일반 대중 수요 제한적","상권 정체성 양극화"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'daerim-general', '대림역·차이나타운', '영등포구', null,
    array['대림역', '대림동', '영등포구', '구로구', '대림차이나타운', '대림중앙시장'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 70,
    '2·7호선 대림역 환승 + 중국 동포 밀집 차이나타운. 야간·심야 외식 수요 매우 강하고 외국인 관광 유튜브 콘텐츠로 재조명 중.',
    '{"reasons":["서울 최대 차이나타운","2·7호선 환승 접근성","외국인 유튜브 콘텐츠 재조명","심야 외식 안정 수요"],"warnings":["특정 업종(중식·전통주점)에 편중","임대료 상승 가속"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 동작구 보강 ──
  (
    'sangdo-sungsil-line-general', '상도·숭실대 학원가', '동작구', null,
    array['상도역', '상도동', '숭실대입구역', '숭실대', '동작구', '장승배기역', '신대방삼거리'],
    'residential', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 66,
    '7호선 상도역 + 숭실대입구역 라인 + 장승배기역 신축 단지. 학생 + 30-40대 신축 단지 거주민 결합 수요.',
    '{"reasons":["숭실대 배후 학생 수요","신축 단지 입주 가속","7호선 접근성"],"warnings":["방학 변동","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 관악구 보강 ──
  (
    'nakseongdae-bongcheon-belt-general', '낙성대·봉천', '관악구', null,
    array['낙성대역', '낙성대', '봉천역', '봉천', '관악구', '서울대입구역', '청룡동', '서원동'],
    'destination', 'mid', 'mid-high', 'high', 'strong', 'strong', 73,
    '서울대입구 (77) 인접 + 낙성대·봉천 라인 신흥 미식 + 임대료 합리적. 2030 신규 진입 활발.',
    '{"reasons":["서울대입구 인접 시너지","2030 신규 미식 진입","임대료 합리적"],"warnings":["관악산 입구 한정","주거 배후 다양성 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 마포구 보강 ──
  (
    'yeonnam-gyeongui-general', '연남·경의선숲길', '마포구', null,
    array['연남동', '연남역', '경의선숲길', '동교동', '서교동', '홍대입구역', '마포구', '서강대'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 86,
    '홍대 (90) 임대료 회피 수요가 흡수한 신흥 핫스폿. 경의선숲길 따라 카페·다이닝·소품샵 집결. 외국인 관광객 비중 상승.',
    '{"reasons":["홍대 수요 흡수 신흥 핫스폿","경의선숲길 산책 동선","외국인 관광객 안정 유입","2030 SNS 바이럴"],"warnings":["임대료 가파른 상승","공간 확보 매우 어려움"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),
  (
    'daeheung-aehyun-general', '대흥·아현', '마포구', null,
    array['대흥역', '대흥동', '아현역', '아현동', '마포구', '공덕', '서대문구'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '6호선 대흥역 + 2호선 아현역 라인 + 신축 단지 (마포래미안 등) 배후. 공덕 (78) 인접 시너지.',
    '{"reasons":["신축 단지 입주 + 30-40대 거주","2·6호선 접근성","공덕 인접 직장인 시너지"],"warnings":["외부 유입 제한","상권 정체성 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 광진구 보강 ──
  (
    'eorini-daegongwon-general', '어린이대공원·세종대', '광진구', null,
    array['어린이대공원역', '어린이대공원', '세종대', '능동', '화양동', '광진구', '건대'],
    'destination', 'mid-high', 'mid-high', 'mid-high', 'strong', 'strong', 72,
    '어린이대공원 + 세종대 + 건대입구 (82) 연결 라인. 가족 단위 주말 + 대학생 평일 수요 결합.',
    '{"reasons":["어린이대공원 주말 가족 수요","세종대 배후 대학생 수요","건대 (82) 인접 시너지"],"warnings":["건대 본진과 분산","평일 외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 서대문구 보강 ──
  (
    'sinchon-yonsei-back-general', '신촌 연세대 후문', '서대문구', null,
    array['연세대', '신촌역', '명물거리', '창천동', '서대문구', '봉원사', '연희동'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'mid-high', 60,
    '연세대 후문 + 신촌 명물거리 + 연희동 카페 일대. 신촌 본진 (58) 침체와 별개로 연세대 학생·교직원 수요 안정. 연희동 카페 거리 30-40대 유입 증가.',
    '{"reasons":["연세대 안정 학생 수요","연희동 카페 30-40대 거점","임대료 본진 대비 합리적"],"warnings":["방학 수요 변동","신촌 침체 영향"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 송파구 보강 ──
  (
    'songpa-naru-jamsil-general', '송파나루·잠실 한강 벨트', '송파구', null,
    array['송파나루역', '한강공원잠실', '잠실', '신천역', '신천', '송파구', '잠실종합운동장'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 76,
    '잠실 (87) 인접 + 한강공원 + 잠실종합운동장 연결 라인. 야구·콘서트 + 한강 데이트 수요 결합.',
    '{"reasons":["잠실 본진 (87) 시너지","한강공원 주말 수요","야구·콘서트 시즌 폭발 수요"],"warnings":["시즌별 수요 편차 큼","주차 매우 부족"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 강동구 보강 ──
  (
    'godeok-sangil-general', '고덕·상일 신축 벨트', '강동구', null,
    array['고덕역', '고덕동', '상일역', '상일동', '강동구', '강일', '고덕그라시움'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 72,
    '고덕그라시움·고덕아르테온 등 12000+세대 신축 단지 입주 본격화. 9호선 4단계 호재 누적.',
    '{"reasons":["12000+세대 신축 단지 입주","9호선 4단계 2026+ 호재","30-40대 거주 안정 수요"],"warnings":["상권 형성 초기","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 도봉구 보강 ──
  (
    'banghak-uijongbu-line-general', '방학·도봉산 라인', '도봉구', null,
    array['방학역', '방학동', '도봉역', '도봉동', '도봉구', '쌍문', '창동'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 56,
    '1호선 방학역·도봉역 라인 주거 밀착 + 도봉산 등산객 주말 수요. 서울 동북부 끝자락.',
    '{"reasons":["임대료 매우 낮음","도봉산 주말 등산객","주거 배후 안정"],"warnings":["외부 유입 거의 없음","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 노원구 보강 ──
  (
    'nowon-rotary-general', '노원 로터리·중계 학원가 진입부', '노원구', null,
    array['노원역', '노원', '롯데백화점노원', '상계', '중계', '노원구', '상계백병원'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 78,
    '4·7호선 노원역 + 롯데백화점노원점 + 중계 학원가 (75) 연결 라인. 동북선 2027.11 + GTX-C 2028+ 호재 누적.',
    '{"reasons":["롯데백화점노원 앵커","동북선·GTX-C 호재","중계 학원가 시너지","4·7호선 환승"],"warnings":["임대료 빠르게 상승","상권 분산 (창동·미아 등)"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 강북구 보강 ──
  (
    'mia-station-general', '미아역·우이천 라인', '강북구', null,
    array['미아역', '미아동', '강북구', '미아사거리', '솔밭공원', '번동'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '4호선 미아역 + 미아사거리 (72) 사이 라인. 동북선 2027.11 호재 + 신축 단지 입주.',
    '{"reasons":["동북선 2027.11 호재","신축 단지 입주 가속","4호선 접근성"],"warnings":["미아사거리 본진과 분산","상권 정체성 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 은평구 보강 ──
  (
    'eunpyeong-gupabal-general', '구파발·은평뉴타운', '은평구', null,
    array['구파발역', '구파발', '진관동', '은평뉴타운', '은평구', '북한산'],
    'residential', 'mid', 'mid', 'mid-high', 'mid-high', 'strong', 70,
    '3호선 구파발역 + 은평뉴타운 + 진관동 신축 단지. 북한산 자연 환경 + GTX-A 2027 운정 인접 호재.',
    '{"reasons":["은평뉴타운 거대 단지 배후","북한산 주말 등산객 + 30-40대 거주","GTX-A 2027 운정 인접 호재"],"warnings":["서울 핵심부 접근성 보통","단지 내 상가 경쟁"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 양천구 보강 ──
  (
    'mokdong-line5-belt-general', '목동·신정·신월 5호선 벨트', '양천구', null,
    array['목동역', '오목교역', '신정역', '신정네거리역', '신월', '양천구', '오목교'],
    'residential', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 76,
    '5호선 목동·오목교·신정·신정네거리 4개 역 벨트 + 목동 학원가. 현대백화점목동점 (75) 앵커 + 학원가 시너지.',
    '{"reasons":["현대백화점목동점 앵커","목동 학원가 안정 수요","5호선 4개 역 연결","30-40대 거주 배후"],"warnings":["임대료 양천 수준 높음","유행 트렌드 보수적"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 강서구 보강 ──
  (
    'magok-newtown-general', '마곡·서울식물원', '강서구', null,
    array['마곡역', '마곡', '마곡나루역', '서울식물원', '강서구', '마곡지구', 'LG사이언스파크'],
    'office', 'mid-high', 'mid', 'high', 'strong', 'strong', 76,
    'LG사이언스파크 + 서울식물원 + 마곡지구 신축 단지. 9호선·공항철도 환승 + 직장인 + 거주민 + 주말 가족 수요 결합.',
    '{"reasons":["LG사이언스파크 직장인 수요","서울식물원 주말 가족 수요","9호선·공항철도 환승","신축 단지 거주 배후"],"warnings":["오피스 의존도 높음","주말 직장인 수요 급감"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 구로구 보강 ──
  (
    'guro-station-general', '구로역·신구로 라인', '구로구', null,
    array['구로역', '구로', '신구로', '구로구', '구로디지털단지', '대림역', '신도림'],
    'office', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 70,
    '1호선 구로역 + 구로디지털단지 (76) 진입부. IT 직장인 점심 수요 + 신구로 신축 단지 거주민 수요 결합.',
    '{"reasons":["구로디지털단지 직장인 점심 수요","신구로 신축 단지 배후","1호선 접근성"],"warnings":["저녁·주말 수요 약함","오피스 의존도 높음"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 금천구 보강 ──
  (
    'geumcheon-doksan-line1-general', '독산·금천구청 라인', '금천구', null,
    array['독산역', '독산동', '금천구청역', '금천구', '시흥', '시흥대로'],
    'residential', 'low', 'mid', 'mid-high', 'strong', 'strong', 62,
    '1호선 독산역 + 금천구청역 + 시흥대로 라인. 가산 (76) 직장인 거주 + 시흥대로 차량 동선.',
    '{"reasons":["가산 직장인 거주 수요","시흥대로 차량 동선","임대료 매우 낮음","신안산선 2026말+ 호재"],"warnings":["외부 유입 제한","상권 정체성 약함"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 동대문구 보강 ──
  (
    'dapsimni-jangan-belt-general', '답십리·장안동', '동대문구', null,
    array['답십리역', '답십리', '장안동', '장한평역', '동대문구', '신답', '용두'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 62,
    '5호선 답십리·장한평 라인 + 장안동. 신축 단지 입주 + 청량리 (75) 인접 시너지.',
    '{"reasons":["신축 단지 입주 본격화","청량리 인접 시너지","5호선 접근성"],"warnings":["상권 형성 초기","외부 유입 제한"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 중랑구 보강 ──
  (
    'mukdong-junghwa-general', '묵동·중화 7호선 라인', '중랑구', null,
    array['묵동', '묵동역', '중화역', '중화동', '중랑구', '먹골역', '먹골', '봉화산'],
    'residential', 'low', 'mid', 'mid', 'strong', 'mid-high', 58,
    '7호선 묵동·중화·먹골·봉화산 4개 역 벨트. 주거 밀착 + 임대료 매우 낮음. 상봉터미널 더샵 (65) 인접 시너지.',
    '{"reasons":["7호선 4개 역 벨트","임대료 매우 낮음","상봉터미널 더샵 인접 시너지"],"warnings":["외부 유입 거의 없음","상권 정체"]}'::jsonb,
    'fresh', '2026-05-18', '2026-11-18', null
  ),

  -- ── 성북구 보강 ──
  (
    'jeongneung-arirang-general', '정릉·아리랑고개', '성북구', null,
    array['정릉', '정릉동', '아리랑고개', '국민대', '성북구', '성신여대'],
    'residential', 'mid', 'mid', 'mid', 'mid-high', 'strong', 60,
    '국민대 + 아리랑고개 + 정릉 일대. 국민대 학생 + 30-40대 거주 + 임대료 매우 합리적.',
    '{"reasons":["국민대 학생 수요","임대료 매우 합리적","30-40대 거주 배후"],"warnings":["방학 수요 변동","외부 유입 제한"]}'::jsonb,
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
