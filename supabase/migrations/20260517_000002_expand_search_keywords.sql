-- search_keywords 광범위 보강: 서울 25개 구 핵심 상권에 인근 지하철역·동·랜드마크 매핑
-- 목표: 사용자가 서울 어느 지역명을 입력해도 관련 상권 최소 1-3개 매칭되도록.

-- ════════════════════════════════════════════════════════
-- PART 1. 기존 entry 키워드 확장
-- ════════════════════════════════════════════════════════

-- 강남구
update public.market_location_signals
set search_keywords = array[
  '성수', '성수동', '성수1가', '성수2가', '뚝섬', '뚝섬역', '서울숲', '서울숲역',
  '연무장길', '성수역', '응봉', '응봉동', '송정동', '성동구', '용답', '한양대'
], updated_at = now()
where region_key = 'seongsu-general';

update public.market_location_signals
set search_keywords = array[
  '왕십리', '왕십리역', '왕십리도선동', '행당', '행당동', '마장', '마장동',
  '무학', '도선', '성동구청', '엔터식스', '비트플렉스', '한양대', '한양대역', '성동구'
], updated_at = now()
where region_key = 'wangsimni-general';

update public.market_location_signals
set search_keywords = array[
  '압구정', '압구정동', '압구정로데오', '압구정로데오역', '압구정역', '도산공원',
  '도산대로', '청담사거리', '신사역', '로데오거리', '갤러리아', '강남구'
], updated_at = now()
where region_key = 'apgujeong-rodeo-general';

update public.market_location_signals
set search_keywords = array[
  '삼성', '삼성역', '삼성동', '코엑스', 'COEX', '봉은사', '봉은사역', '청담사거리',
  '무역센터', '영동대로', '학여울', '학여울역', '한국전력', '현대백화점무역센터점',
  '글로벌비즈니스센터', '강남구'
], updated_at = now()
where region_key = 'samsung-coex-general';

update public.market_location_signals
set search_keywords = array[
  '가로수길', '신사', '신사역', '신사동', '논현', '논현동', '논현역', '강남구',
  '세로수길', '도산공원', '현대고등학교'
], updated_at = now()
where region_key = 'garosu-gil-general';

update public.market_location_signals
set search_keywords = array[
  '대치', '대치동', '대치역', '학원가', '도곡', '도곡동', '도곡역', '학여울', '학여울역',
  '한티', '한티역', '은마', '은마아파트', '도성초', '대청', '강남구'
], updated_at = now()
where region_key = 'daechi-general';

-- 광진구
update public.market_location_signals
set search_keywords = array[
  '건대', '건대입구', '건대입구역', '건국대', '스타시티', '광진구', '자양',
  '자양동', '구의', '구의동', '화양동', '능동', '어린이대공원', '세종대'
], updated_at = now()
where region_key = 'kondae-general';

-- 중구
update public.market_location_signals
set search_keywords = array[
  '명동', '명동역', '중구', '남대문', '남대문시장', '을지로입구', '을지로입구역',
  '회현', '회현역', '서울시청', '시청역', '소공동', '롯데백화점본점', '롯데호텔', '신세계백화점본점'
], updated_at = now()
where region_key = 'myeongdong-general';

update public.market_location_signals
set search_keywords = array[
  '을지로', '힙지로', '을지로3가', '을지로4가', '을지로입구', '중구', '청계천', '청계4가',
  '종로3가', '종로구', '인쇄골목', '공구상가', '노가리골목'
], updated_at = now()
where region_key = 'euljiro-general';

-- 종로구
update public.market_location_signals
set search_keywords = array[
  '인사동', '북촌', '북촌한옥마을', '안국', '안국역', '경복궁', '경복궁역', '종로구',
  '삼청동', '삼청', '가회동', '계동', '재동', '소격동', '운현궁'
], updated_at = now()
where region_key = 'insadong-bukchon-general';

update public.market_location_signals
set search_keywords = array[
  '대학로', '혜화', '혜화역', '종로구', '마로니에공원', '동숭동', '명륜동',
  '성균관대', '서울대병원', '동성고', '연건', '이화사거리'
], updated_at = now()
where region_key = 'daehakro-general';

update public.market_location_signals
set search_keywords = array[
  '광화문', '광화문역', '종각', '종각역', '시청', '시청역', '종로', '종로1가', '종로2가',
  '청계광장', '교보문고', 'D타워', '광화문광장', '경복궁', '종로구', '경운', '서린'
], updated_at = now()
where region_key = 'gwanghwamun-general';

-- 마포구
update public.market_location_signals
set search_keywords = array[
  '망원', '망원동', '망원역', '망리단길', '마포구', '합정', '합정역', '월드컵공원',
  '성산', '성산동', '연남', '서교'
], updated_at = now()
where region_key = 'mangwon-general';

-- 서대문구
update public.market_location_signals
set search_keywords = array[
  '신촌', '신촌역', '신촌로터리', '서대문구', '연세대', '연세로', '창천', '창천동',
  '대현동', '명물거리', '신촌현대백화점', '경의중앙선신촌'
], updated_at = now()
where region_key = 'sinchon-general';

-- 영등포구
update public.market_location_signals
set search_keywords = array[
  '영등포', '영등포역', '영등포시장', '영등포구', '타임스퀘어', '신세계백화점영등포',
  '롯데백화점영등포', '영등포구청', '경방', '문래'
], updated_at = now()
where region_key = 'yeongdeungpo-general';

update public.market_location_signals
set search_keywords = array[
  '신도림', '신도림역', '디큐브시티', '디큐브', '테크노마트', '영등포구', '구로구',
  '신도림테크노마트', '도림천'
], updated_at = now()
where region_key = 'sindorim-general';

-- 서초구
update public.market_location_signals
set search_keywords = array[
  '반포', '반포동', '서래마을', '서래', '고속터미널', '고속터미널역', '서초구', '반포역',
  '신반포', '센트럴시티', '잠원', '잠원동', '잠원역', '래미안퍼스티지', '아크로리버파크'
], updated_at = now()
where region_key = 'banpo-seorae-general';

update public.market_location_signals
set search_keywords = array[
  '교대', '교대역', '서초', '서초역', '방배', '방배동', '방배역', '방배카페거리', '서초구',
  '법조타운', '대법원', '서울중앙지법', '서울고법', '내방', '내방역', '이수'
], updated_at = now()
where region_key = 'gyodae-general';

-- 송파구
update public.market_location_signals
set search_keywords = array[
  '잠실', '잠실역', '잠실새내', '롯데월드', '롯데월드타워', '석촌호수', '석촌',
  '신천', '송파구', '잠실종합운동장', '롯데백화점잠실', '롯데월드몰', '시그니엘'
], updated_at = now()
where region_key = 'jamsil-general';

update public.market_location_signals
set search_keywords = array[
  '문정', '문정역', '문정동', '가락시장', '가락시장역', '가락몰', '가락', '가락동',
  '송파구', '문정법조타운', '서울동부지법', '문정엠스테이트'
], updated_at = now()
where region_key = 'munjeong-general';

-- 강동구
update public.market_location_signals
set search_keywords = array[
  '천호', '천호역', '천호동', '강동구', '강동', '현대백화점천호점', '풍납',
  '풍납동', '암사', '암사동', '천호공원', '강동역'
], updated_at = now()
where region_key = 'cheonho-general';

-- 동대문구
update public.market_location_signals
set search_keywords = array[
  '회기', '회기역', '회기동', '경희대', '한국외대', '외대', '외대앞', '외대앞역',
  '동대문구', '청량리', '이문동', '휘경동'
], updated_at = now()
where region_key = 'hoegi-general';

-- 중랑구
update public.market_location_signals
set search_keywords = array[
  '상봉', '상봉역', '상봉동', '망우', '망우역', '망우동', '면목', '면목동',
  '중랑구', '중화동', '신내', '중랑역', '묵동'
], updated_at = now()
where region_key = 'sangbong-general';

-- 강북구
update public.market_location_signals
set search_keywords = array[
  '수유', '수유역', '수유리', '강북구', '미아', '미아사거리', '쌍문', '4.19',
  '솔밭공원', '우이', '우이신설선', '인수', '번동'
], updated_at = now()
where region_key = 'suyu-station-general';

-- 도봉구
update public.market_location_signals
set search_keywords = array[
  '창동', '창동역', '도봉구', '도봉', '도봉동', '쌍문', '쌍문역', '방학', '방학동',
  '노원', '서울아레나', '복합문화공간'
], updated_at = now()
where region_key = 'changdong-general';

-- 노원구
update public.market_location_signals
set search_keywords = array[
  '노원', '노원역', '노원구', '상계', '상계동', '상계역', '롯데백화점노원', '하계',
  '월계', '중계', '월계동'
], updated_at = now()
where region_key = 'nowon-station-general';

update public.market_location_signals
set search_keywords = array[
  '중계', '중계동', '중계학원가', '은행사거리', '노원구', '하계', '하계역', '중계역',
  '중계본동', '학여울중계'
], updated_at = now()
where region_key = 'junggye-dong-general';

update public.market_location_signals
set search_keywords = array[
  '하계', '하계역', '하계동', '노원구', '중계', '월계', '공릉'
], updated_at = now()
where region_key = 'hagye-station-general';

update public.market_location_signals
set search_keywords = array[
  '공릉', '공릉동', '공릉역', '노원구', '서울과기대', '서울과학기술대', '경춘선',
  '화랑로', '하계'
], updated_at = now()
where region_key = 'gongreung-general';

-- 은평구
update public.market_location_signals
set search_keywords = array[
  '연신내', '연신내역', '은평구', '불광', '불광동', '불광역', '구파발', '구파발역',
  '갈현', '갈현동', '대조', '응암', '응암역', '진관'
], updated_at = now()
where region_key = 'yeonsinnae-general';

-- 관악구
update public.market_location_signals
set search_keywords = array[
  '서울대입구', '서울대입구역', '샤로수길', '관악구', '봉천', '봉천동', '낙성대',
  '낙성대역', '관악', '서울대'
], updated_at = now()
where region_key = 'snu-station-general';

update public.market_location_signals
set search_keywords = array[
  '봉천', '봉천동', '관악구', '서울대입구', '낙성대', '청룡동', '청림동'
], updated_at = now()
where region_key = 'bongcheon-general';

update public.market_location_signals
set search_keywords = array[
  '신림', '신림역', '신림동', '관악구', '서원동', '서림동', '난곡', '난향',
  '신림선', '서울대학생'
], updated_at = now()
where region_key = 'sillim-station-general';

-- 동작구
update public.market_location_signals
set search_keywords = array[
  '노량진', '노량진역', '노량진동', '동작구', '대방', '대방동', '한강대교',
  '용양봉저정', '학원가', '공시생'
], updated_at = now()
where region_key = 'noryangjin-general';

update public.market_location_signals
set search_keywords = array[
  '사당', '사당역', '사당동', '이수', '이수역', '동작구', '관악구', '서초구',
  '방배', '남현', '낙성대'
], updated_at = now()
where region_key = 'sadang-general';

-- 양천구
update public.market_location_signals
set search_keywords = array[
  '목동', '오목교', '오목교역', '양천구', '신정', '신정동', '신월', '목동역',
  '현대백화점목동', 'SBS', '이대목동병원', '목동운동장'
], updated_at = now()
where region_key = 'mokdong-general';

-- 강서구
update public.market_location_signals
set search_keywords = array[
  '발산', '발산역', '강서구', '내발산', '외발산', '마곡', '우장산', '우장산역',
  '화곡', '김포공항'
], updated_at = now()
where region_key = 'balsan-station-general';

update public.market_location_signals
set search_keywords = array[
  '화곡', '화곡역', '화곡동', '강서구', '까치산', '우장산', '신월', '강서구청'
], updated_at = now()
where region_key = 'hwagok-general';

update public.market_location_signals
set search_keywords = array[
  '가양', '가양역', '가양동', '강서구', '양천향교', '증미', '등촌', '염창',
  '한강', '허준박물관'
], updated_at = now()
where region_key = 'gayang-general';

-- 구로구
update public.market_location_signals
set search_keywords = array[
  '구로디지털단지', '구로디지털', '구로', '구로구', '대림', '대림역', '구로공단',
  '에이스건설', '디지털산업단지'
], updated_at = now()
where region_key = 'guro-digital-general';

-- 성북구
update public.market_location_signals
set search_keywords = array[
  '길음', '길음역', '길음동', '성북구', '미아', '미아삼거리', '정릉', '정릉동',
  '돈암', '돈암동', '길음뉴타운', '래미안길음'
], updated_at = now()
where region_key = 'gireum-general';

update public.market_location_signals
set search_keywords = array[
  '한성대', '한성대입구', '한성대입구역', '성북구', '돈암', '돈암동', '동소문동',
  '성북동', '동선동', '삼선동', '혜화'
], updated_at = now()
where region_key = 'snu-station-general';

-- 동대문구 보강
update public.market_location_signals
set search_keywords = array[
  '동국대', '동국대학교', '장충', '장충동', '필동', '중구', '동대입구', '동대입구역',
  '충무로', '남산', '신당'
], updated_at = now()
where region_key = 'dongguk-univ-general';

-- 용산구
update public.market_location_signals
set search_keywords = array[
  '서울역', '서울역광장', '용산', '용산구', '중구', '남대문로5가', '회현',
  'KTX서울역', '롯데마트서울역점', '서울로7017'
], updated_at = now()
where region_key = 'seoulstation-general';

update public.market_location_signals
set search_keywords = array[
  '용리단길', '용산', '용산구', '신용산', '신용산역', '용산역', '한강로',
  '아모레퍼시픽', 'LG U+'
], updated_at = now()
where region_key = 'yongridangil-general';

update public.market_location_signals
set search_keywords = array[
  '이촌', '이촌동', '이촌역', '용산구', '동부이촌동', '서빙고', '서빙고역',
  '한강맨션', '래미안첼리투스', '한강뷰'
], updated_at = now()
where region_key = 'ichon-general';

-- 영등포구청
update public.market_location_signals
set search_keywords = array[
  '영등포구청', '영등포구청역', '영등포', '영등포구', '문래', '도림', '신길'
], updated_at = now()
where region_key = 'gasan-food';

-- ════════════════════════════════════════════════════════
-- PART 2. PART 1 (20260517_000001) 의 신규 entry 검색어 풍부화
-- ════════════════════════════════════════════════════════

update public.market_location_signals
set search_keywords = array[
  '세로수길', '도산공원', '도산대로', '압구정', '압구정동', '신사동', '강남구',
  '청담사거리', '논현'
], updated_at = now()
where region_key = 'serosu-gil-general';

update public.market_location_signals
set search_keywords = array[
  '청담', '청담동', '청담역', '청담사거리', '갤러리아', '강남구', '명품거리',
  '압구정', '학동', '학동역', '봉은사로'
], updated_at = now()
where region_key = 'cheongdam-general';

update public.market_location_signals
set search_keywords = array[
  '신사', '신사역', '가로수길', '강남구', '논현', '잠원'
], updated_at = now()
where region_key = 'sinsa-station-general';

update public.market_location_signals
set search_keywords = array[
  '양재', '양재역', '양재시민의숲', '양재시민의숲역', '서초구', '매봉', '매봉역',
  'AT센터', '현대차그룹', '서초', '청계산'
], updated_at = now()
where region_key = 'yangjae-general';

update public.market_location_signals
set search_keywords = array[
  '잠원', '잠원동', '잠원역', '신반포', '서초구', '고속터미널', '반포', '신사'
], updated_at = now()
where region_key = 'jamwon-banpo-general';

update public.market_location_signals
set search_keywords = array[
  '헬리오시티', '가락', '가락동', '가락몰', '송파', '송파구', '송파헬리오',
  '문정', '잠실', '가락시장'
], updated_at = now()
where region_key = 'helio-city-general';

update public.market_location_signals
set search_keywords = array[
  '방이', '방이동', '방이먹자골목', '송파구', '올림픽공원', '몽촌토성', '몽촌토성역',
  '방이역'
], updated_at = now()
where region_key = 'bangi-general';

update public.market_location_signals
set search_keywords = array[
  '잠실새내', '잠실새내역', '잠실종합운동장', '종합운동장', '종합운동장역',
  '송파구', '잠실', '신천', '신천역', '한강공원잠실'
], updated_at = now()
where region_key = 'jamsil-saenae-general';

update public.market_location_signals
set search_keywords = array[
  '둔촌', '둔촌동', '둔촌오륜', '둔촌역', '올림픽파크포레온', '올림픽공원',
  '강동구', '한양아파트', '둔촌1동', '둔촌2동'
], updated_at = now()
where region_key = 'dunchon-olympicpark-general';

update public.market_location_signals
set search_keywords = array[
  '길동', '길동사거리', '강동역', '강동구', '천호', '명일', '굽은다리', '굽은다리역'
], updated_at = now()
where region_key = 'gildong-general';

update public.market_location_signals
set search_keywords = array[
  '강일', '강일역', '미사', '하남미사', '강동구', '강일동', '고덕', '고덕동',
  '상일', '상일역'
], updated_at = now()
where region_key = 'gangil-misa-general';

update public.market_location_signals
set search_keywords = array[
  '청량리', '청량리역', '홍릉', '동대문구', '롯데캐슬', '한국과학기술연구원', 'KIST',
  '제기', '제기동', '제기동역', '경동시장', '청량리경동시장'
], updated_at = now()
where region_key = 'cheongnyangni-general';

update public.market_location_signals
set search_keywords = array[
  '답십리', '답십리역', '답십리동', '동대문구', '장한평', '청계', '용두', '용두동'
], updated_at = now()
where region_key = 'dapsimni-general';

update public.market_location_signals
set search_keywords = array[
  '장한평', '장한평역', '동대문구청', '동대문구', '용두', '용두동', '답십리'
], updated_at = now()
where region_key = 'janghanpyeong-general';

update public.market_location_signals
set search_keywords = array[
  '상봉터미널', '상봉더샵', '상봉', '망우', '중랑구', '상봉역', '망우역', 'GTX-B'
], updated_at = now()
where region_key = 'sangbong-thesharp-general';

update public.market_location_signals
set search_keywords = array[
  '면목', '면목동', '면목역', '사가정', '사가정역', '중랑구', '용마산', '용마산역',
  '중화'
], updated_at = now()
where region_key = 'myeonmok-general';

update public.market_location_signals
set search_keywords = array[
  '성신여대', '성신여대입구', '성신여대입구역', '성북구', '돈암', '돈암동',
  '미아리', '미아', '돈암제일시장'
], updated_at = now()
where region_key = 'sungshin-univ-general';

update public.market_location_signals
set search_keywords = array[
  '성북동', '성북구', '한성대입구', '간송미술관', '심우장', '북정', '북정마을',
  '길상사', '삼청동'
], updated_at = now()
where region_key = 'seongbuk-dong-general';

update public.market_location_signals
set search_keywords = array[
  '보문', '보문역', '보문동', '성북구', '안암', '안암동', '안암역', '고려대',
  '신설동', '신설동역'
], updated_at = now()
where region_key = 'bomun-general';

update public.market_location_signals
set search_keywords = array[
  '동선동', '한성대입구', '한성대입구역', '성북구', '동소문동', '롯데캐슬',
  '돈암', '삼선'
], updated_at = now()
where region_key = 'dongseon-dong-general';

update public.market_location_signals
set search_keywords = array[
  '미아사거리', '미아사거리역', '미아', '강북구', '미아동', '롯데백화점미아점',
  '하나로마트', '동북선'
], updated_at = now()
where region_key = 'mia-sageori-general';

update public.market_location_signals
set search_keywords = array[
  '수유', '수유역', '우이', '우이신설선', '우이동', '강북구', '인수', '번동',
  '4.19', '4.19사거리'
], updated_at = now()
where region_key = 'suyu-uisinseol-general';

update public.market_location_signals
set search_keywords = array[
  '4.19사거리', '솔밭공원', '솔밭공원역', '강북구', '쌍문', '수유', '우이',
  '우이신설선', '419'
], updated_at = now()
where region_key = '419-sageori-general';

update public.market_location_signals
set search_keywords = array[
  '서울아레나', '도봉구', '창동', '창동역', '아레나', '도봉산', '복합문화공간',
  '아레나역'
], updated_at = now()
where region_key = 'seoul-arena-general';

update public.market_location_signals
set search_keywords = array[
  '도봉산', '도봉산역', '도봉구', '창포원', '도봉', '도봉동', '도봉구청'
], updated_at = now()
where region_key = 'dobongsan-general';

update public.market_location_signals
set search_keywords = array[
  '쌍문', '쌍문동', '쌍문역', '도봉구', '방학', '창동', '응답하라1988'
], updated_at = now()
where region_key = 'ssangmun-general';

update public.market_location_signals
set search_keywords = array[
  '광운대', '광운대역', '광운대학교', '서울원', '월계', '월계동', '노원구',
  '석계', '석계역'
], updated_at = now()
where region_key = 'gwangwoon-seoulwon-general';

update public.market_location_signals
set search_keywords = array[
  '태릉입구', '태릉입구역', '화랑로', '노원구', '공릉', '공릉동', '서울과기대',
  '삼육대', '월계'
], updated_at = now()
where region_key = 'taeneung-hwarang-general';

update public.market_location_signals
set search_keywords = array[
  '은평뉴타운', '진관', '진관동', '은평구', '구파발', '구파발역', '북한산',
  '북한산둘레길', '기자촌'
], updated_at = now()
where region_key = 'eunpyeong-newtown-general';

update public.market_location_signals
set search_keywords = array[
  '응암', '응암역', '응암동', '갈현', '갈현동', '은평구', '역촌', '역촌역',
  '연신내', '대조'
], updated_at = now()
where region_key = 'eungam-galhyeon-general';

update public.market_location_signals
set search_keywords = array[
  '이대', '이화여대', '이대역', '서대문구', '신촌', '대현', '대현동'
], updated_at = now()
where region_key = 'ewha-general';

update public.market_location_signals
set search_keywords = array[
  '충정로', '충정로역', '서대문', '서대문역', '서대문구', '아현', '아현동',
  'KT', '동아일보'
], updated_at = now()
where region_key = 'chungjeong-ro-general';

update public.market_location_signals
set search_keywords = array[
  '홍제', '홍제동', '홍제역', '홍은', '홍은동', '서대문구', '무악재', '무악재역',
  '인왕산', '백련산'
], updated_at = now()
where region_key = 'hongje-general';

update public.market_location_signals
set search_keywords = array[
  '공덕', '공덕역', '공덕동', '마포구', '효창공원', '효창공원앞역', '효창동',
  '아현', '대흥', '대흥역', '경의중앙', '공항철도'
], updated_at = now()
where region_key = 'gongdeok-general';

update public.market_location_signals
set search_keywords = array[
  '상암', '상암DMC', '상암동', 'DMC', '디지털미디어시티', '디지털미디어시티역',
  '월드컵공원', '월드컵경기장', '마포구', 'MBC', 'JTBC', 'SBS', '한국방송회관'
], updated_at = now()
where region_key = 'sangam-dmc-general';

update public.market_location_signals
set search_keywords = array[
  '오목교', '오목교역', '목동', '양천구', '현대백화점목동', 'SBS', '이대목동병원',
  '목동운동장', '목동아파트'
], updated_at = now()
where region_key = 'omokgyo-general';

update public.market_location_signals
set search_keywords = array[
  '신정', '신정네거리', '신정네거리역', '신월', '신월동', '양천구', '까치산',
  '신정동'
], updated_at = now()
where region_key = 'sinjeong-sinwol-general';

update public.market_location_signals
set search_keywords = array[
  '김포공항', '김포공항역', '강서구', '발산', '공항', '공항시장', '공항시장역',
  '롯데몰김포공항', '국내선청사', '공항철도', '김포골드라인'
], updated_at = now()
where region_key = 'gimpo-airport-general';

update public.market_location_signals
set search_keywords = array[
  '까치산', '까치산역', '화곡', '화곡역', '강서구', '양천구', '신정', '신월',
  '발산', '우장산'
], updated_at = now()
where region_key = 'kkachisan-general';

update public.market_location_signals
set search_keywords = array[
  '신도림', '신도림역', '테크노마트', '디큐브', '디큐브시티', '구로구', '영등포구',
  '신도림테크노마트'
], updated_at = now()
where region_key = 'sindorim-techno-general';

update public.market_location_signals
set search_keywords = array[
  '오류', '오류동', '오류동역', '개봉', '개봉역', '개봉동', '구로구', '온수',
  '온수역', '천왕', '천왕역'
], updated_at = now()
where region_key = 'oryu-gaebong-general';

update public.market_location_signals
set search_keywords = array[
  '가산', '가산디지털단지', '가산디지털단지역', '금천구', '디지털단지', '마리오아울렛',
  'W몰', '독산'
], updated_at = now()
where region_key = 'gasan-digital-general';

update public.market_location_signals
set search_keywords = array[
  '독산', '독산역', '독산동', '시흥', '시흥동', '시흥대로', '금천구', '시흥사거리',
  '금천구청'
], updated_at = now()
where region_key = 'doksan-siheung-general';

update public.market_location_signals
set search_keywords = array[
  '문래', '문래동', '문래역', '문래창작촌', '영등포구', '도림', '경방',
  '타임스퀘어'
], updated_at = now()
where region_key = 'mullae-general';

update public.market_location_signals
set search_keywords = array[
  '여의도', '여의도역', 'IFC', 'IFC몰', '더현대서울', '더현대', '영등포구',
  '여의나루', '여의나루역', '국회의사당', '국회의사당역', '63빌딩',
  '한강공원여의도', '샛강', '샛강역'
], updated_at = now()
where region_key = 'yeouido-general';

update public.market_location_signals
set search_keywords = array[
  '신길', '신길역', '신길동', '영등포시장', '영등포시장역', '영등포구', '도림',
  '대방', '신풍', '신풍역'
], updated_at = now()
where region_key = 'singil-yeongdeungpo-general';

update public.market_location_signals
set search_keywords = array[
  '사당', '사당역', '이수', '이수역', '동작구', '관악구', '서초구', '남현',
  '방배', '사당동'
], updated_at = now()
where region_key = 'sadang-isu-general';

update public.market_location_signals
set search_keywords = array[
  '상도', '상도동', '상도역', '숭실대', '숭실대입구', '숭실대입구역', '동작구',
  '장승배기', '장승배기역'
], updated_at = now()
where region_key = 'sangdo-general';

update public.market_location_signals
set search_keywords = array[
  '흑석', '흑석동', '흑석역', '중앙대', '중앙대학교', '동작구', '효사정',
  '흑석뉴타운', '한강뷰', '노들'
], updated_at = now()
where region_key = 'heukseok-general';

update public.market_location_signals
set search_keywords = array[
  '샤로수길', '서울대입구', '서울대입구역', '관악구', '봉천', '봉천동', '관악',
  '낙성대'
], updated_at = now()
where region_key = 'sharosu-gil-general';

update public.market_location_signals
set search_keywords = array[
  '한남', '한남동', '이태원', '이태원역', '경리단길', '용산구', '한남더힐',
  '나인원한남', '독서당로', '꼼데가르송길', '제일기획', '리움미술관',
  '해방촌', '녹사평', '녹사평역'
], updated_at = now()
where region_key = 'hannam-itaewon-general';

update public.market_location_signals
set search_keywords = array[
  '서순라길', '익선동', '운현궁', '종로3가', '종로3가역', '종로구', '종묘',
  '낙원동'
], updated_at = now()
where region_key = 'seosunla-gil-general';

update public.market_location_signals
set search_keywords = array[
  '광장시장', '종로5가', '종로5가역', '종로구', '동대문', '먹자골목', '빈대떡',
  '마약김밥', '청계천'
], updated_at = now()
where region_key = 'gwangjang-market-general';

update public.market_location_signals
set search_keywords = array[
  '동대문', 'DDP', '동대문디자인플라자', '동대문역사문화공원', '동대문역사문화공원역',
  '동대문역', '두타', '밀리오레', '굿모닝시티', '중구', '동대문구', '훈련원공원'
], updated_at = now()
where region_key = 'dongdaemun-general';

update public.market_location_signals
set search_keywords = array[
  '신당', '신당동', '신당역', '약수', '약수역', '떡볶이타운', '중구', '동대문구',
  '청구', '청구역', '동대문역사문화공원'
], updated_at = now()
where region_key = 'sindang-general';

-- ════════════════════════════════════════════════════════
-- PART 3. 누락된 핵심 상권 신규 추가
-- ════════════════════════════════════════════════════════

insert into public.market_location_signals (
  region_key, region_name, district_name, category_id, search_keywords,
  market_style, rent_band, competition_level, demand_level, access_level,
  category_fit_level, base_score, summary, evidence,
  freshness_status, last_checked_at, next_review_at, notes
)
values

  -- 강남대로·테헤란로 4대 역
  (
    'gangnam-station-general', '강남역 상권', '강남구', null,
    array['강남', '강남역', '강남대로', '강남구', '서초구', '신논현', '신논현역',
          '논현', '논현역', '교보타워', 'CGV강남', '강남파이낸스센터'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 92,
    '서울 최대 유동인구(일 46만 명) 핵심 상권으로 2·신분당 환승 거점입니다. 강남대로 양편으로 외식·미용·패션이 집결한 한국 대표 상권입니다.',
    '{"reasons":["일 유동인구 46만 한국 최대 상권","2·신분당 환승 거점","외식·미용·패션 압도적 집결","외국인 관광객 한국 대표 상권 인지도"],"warnings":["임대료·권리금 한국 최고 수준","경쟁 밀도 극도로 높음","유행 회전 매우 빠름"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'yeoksam-general', '역삼·강남파이낸스', '강남구', null,
    array['역삼', '역삼동', '역삼역', '강남구', '강남파이낸스센터', 'GFC',
          '르네상스호텔', '테헤란로', '강남'],
    'office', 'high', 'high', 'high', 'strong', 'strong', 86,
    '테헤란로 IT·금융 직장인 본거지로 점심·회식 수요가 안정적입니다. GFC·테헤란로 빌딩숲 직장인 일 28만+ 유동.',
    '{"reasons":["테헤란로 IT·금융 직장인 점심 수요","2호선 강남~삼성 라인 핵심","임대료 대비 안정적 회식 수요"],"warnings":["주말·휴일 수요 급감","임대료 매우 높음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'seolleung-general', '선릉·한티', '강남구', null,
    array['선릉', '선릉역', '선릉동', '한티', '한티역', '강남구', '대치', '도곡',
          '르노삼성타워', '테헤란로'],
    'office', 'high', 'high', 'high', 'strong', 'strong', 84,
    '테헤란로 IT 본진 + 대치 학원가 인접한 강남 핵심 오피스 상권입니다. 2·분당선 환승 거점입니다.',
    '{"reasons":["테헤란로 IT 직장인 안정 수요","2·분당선 환승","대치 학원가·도곡 주거 배후 연계"],"warnings":["임대료 매우 높음","주말 수요 급감"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'haknon-general', '학동·논현', '강남구', null,
    array['학동', '학동역', '논현', '논현역', '논현동', '강남구', '신논현',
          '학동사거리', '가구거리', '도산대로'],
    'destination', 'high', 'mid-high', 'high', 'strong', 'strong', 79,
    '신논현~학동사거리 라인은 강남 최대 야간 회식 상권입니다. 와인바·다이닝·룸살롱 등 야간 수요가 집결합니다.',
    '{"reasons":["강남 최대 야간 회식 상권","7호선·신분당 접근성","가구거리 디자이너 수요"],"warnings":["임대료 매우 높음","낮 시간대 수요 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 홍대 핵심 별도
  (
    'hongdae-general', '홍대입구 메인', '마포구', null,
    array['홍대', '홍대입구', '홍대입구역', '홍대거리', '홍익대', '홍익대학교',
          '서교', '서교동', '동교', '동교동', '연남', '연남동', '연남역',
          '상수', '상수역', '경의선숲길', '마포구'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 90,
    '2호선·공항철도·경의중앙선 3개 환승 거점으로 일 유동인구 24만+의 서울 서북부 최대 상권입니다. 외국인 관광객 회복이 본격화됐습니다.',
    '{"reasons":["3개 환승 거점","외국인 관광객 본격 회복","홍익대·서강대·연세대 배후","경의선숲길 연계 연남까지 확장"],"warnings":["임대료 매우 높음","핵심부 공실은 감소했지만 안쪽 골목은 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 합정 별도
  (
    'hapjeong-general', '합정역 상권', '마포구', null,
    array['합정', '합정역', '합정동', '마포구', '메세나폴리스', '딜라이트스퀘어',
          '망원', '상수', '홍대'],
    'destination', 'high', 'high', 'high', 'strong', 'strong', 85,
    '2·6호선 환승 + 메세나폴리스 + 딜라이트스퀘어가 결합된 홍대 인접 핵심 상권입니다. 홍대 임대료 회피 수요를 흡수합니다.',
    '{"reasons":["2·6호선 환승 거점","메세나폴리스·딜라이트스퀘어 앵커","홍대 임대료 회피 수요 흡수","30-40대 미식 수요"],"warnings":["임대료 빠르게 상승","골목 안쪽 공간 확보 어려움"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 종로 핵심 별도
  (
    'jongno-3ga-general', '종로3가·낙원동', '종로구', null,
    array['종로3가', '종로3가역', '낙원동', '낙원상가', '익선동', '서순라길',
          '종로구', '종묘', '돈화문', '익선', '운현궁'],
    'destination', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 80,
    '1·3·5호선 환승 거점 + 익선동 한옥거리 + 낙원상가가 결합된 종로 핵심 야간 상권입니다. 외국인 관광객 한옥 콘텐츠 수요가 강합니다.',
    '{"reasons":["3개 호선 환승 거점","익선동 한옥거리 외국인 인기","30-40대 야간 외식 수요"],"warnings":["임대료 상승 가속","골목 보행 동선 단절"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 동대문 별도 (종로구)
  (
    'dongdaemun-jongno-general', '동대문 시장 동측', '종로구', null,
    array['동대문', '동대문역', '종로6가', '종로구', '동묘앞', '동묘앞역', '동묘',
          '창신동', '창신', '광희', '동대문운동장'],
    'destination', 'mid', 'mid-high', 'mid-high', 'strong', 'strong', 70,
    '동대문역~동묘앞역 라인은 도매시장 인근 노포·구제거리 상권입니다. 외국인 관광객·30-40대 빈티지 소비 수요가 결합됩니다.',
    '{"reasons":["동대문 시장·도매 종사자 수요","동묘 구제거리 30-40대·외국인 수요","임대료가 종로 핵심 대비 합리적"],"warnings":["도매 상권 침체 영향","유동인구 다양성 제한"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 약수·신당 (중구 보강)
  (
    'yaksu-sindang-general', '약수·신당역 동측', '중구', null,
    array['약수', '약수역', '약수동', '신당', '신당역', '동대입구', '동대입구역',
          '중구', '신당동', '동호로'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'strong', 68,
    '3·6호선 약수역 + 2호선 신당역 인근 주거 + 야간 외식 결합 상권입니다. 떡볶이타운과 별개로 일상 소비가 형성됩니다.',
    '{"reasons":["3·6·2호선 접근성","주거 배후 안정 수요","임대료 합리적"],"warnings":["외부 유입 제한적","상권 규모 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 약수 동측 한옥 (중구)
  (
    'chungmuro-general', '충무로·필동', '중구', null,
    array['충무로', '충무로역', '필동', '필동로', '중구', '한국의집', '명동',
          '동국대', '남산', '예장동'],
    'destination', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '인쇄·영화 골목 충무로 + 필동 한옥거리가 결합된 종로 인접 문화 상권입니다. 30-40대 미식·외국인 관광객 수요가 강합니다.',
    '{"reasons":["충무로 영화·인쇄 거리 정체성","필동 한옥거리 외국인 수요","4·3호선 접근성"],"warnings":["대형 유동인구 부족","골목 보행 동선 제한"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 마포 보강: 망원 별도 (mangwon-general 외 망원 메인거리)
  -- 이미 mangwon-general 있으므로 patch만 위에서 함

  -- 용산: 한강진·이태원 보강
  (
    'hangangjin-general', '한강진·꼼데가르송길', '용산구', null,
    array['한강진', '한강진역', '용산구', '한남', '한남동', '꼼데가르송길',
          '독서당로', '제일기획'],
    'destination', 'high', 'mid', 'high', 'strong', 'strong', 79,
    '한강진역~꼼데가르송길 라인은 한남 메인 브랜드·갤러리·다이닝 거점입니다. 한남더힐·나인원한남 거주민 + 외국인 수요 결합.',
    '{"reasons":["한남더힐·나인원한남 고소득층 배후","외국인 관광객 회복","6호선 한강진역 접근성","제일기획·리움미술관 인접"],"warnings":["임대료 매우 높음","경쟁 브랜드 진입 활발"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),
  (
    'samgakji-sinyongsan-general', '삼각지·신용산 용리단길 보강', '용산구', null,
    array['삼각지', '삼각지역', '신용산', '신용산역', '용산', '용산구', '한강로',
          '용리단길', '아모레퍼시픽', 'LG U+', '효창'],
    'office', 'mid-high', 'mid-high', 'high', 'strong', 'strong', 78,
    '아모레퍼시픽·LG U+ 본사 + 용리단길 신흥 다이닝이 결합된 용산 핵심 상권입니다. 4·6·1호선 환승 거점.',
    '{"reasons":["대기업 본사 직장인 점심 수요","용리단길 30-40대 미식 수요","4·6·1호선 접근성"],"warnings":["임대료 가파르게 상승","주말 직장인 수요 급감"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 성동구: 옥수·금호
  (
    'oksu-geumho-general', '옥수·금호 한강뷰', '성동구', null,
    array['옥수', '옥수역', '옥수동', '금호', '금호역', '금호동', '성동구',
          '한강뷰', '응봉', '응봉동', '응봉역'],
    'residential', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 70,
    '3호선·경의중앙선 환승 거점으로 한강뷰 신축 아파트 배후 생활 상권입니다. 30-40대 고소득층 거주 수요가 강점.',
    '{"reasons":["한강뷰 신축 단지 고소득층 배후","3·경의중앙 환승","임대료가 강남 대비 합리적"],"warnings":["외부 유입 제한적","상권 규모 자체 작음"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 동작구: 노들·동작·이수 (다리 라인)
  (
    'nodeul-dongjak-general', '노들·동작', '동작구', null,
    array['노들', '노들역', '동작', '동작역', '동작구', '노량진', '흑석',
          '용양봉저정', '한강대교'],
    'residential', 'mid', 'mid', 'mid', 'strong', 'mid-high', 60,
    '9호선 노들역·4호선 동작역 일대로 한강 인접 주거 상권입니다. 흑석뉴타운 입주 효과가 일부 흘러옵니다.',
    '{"reasons":["9호선 급행 접근성","흑석뉴타운 수요 일부 흡수","한강 접근성"],"warnings":["상권 규모 자체 작음","외부 유입 제한적"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 강서구: 등촌·염창
  (
    'deungchon-yeomchang-general', '등촌·염창', '강서구', null,
    array['등촌', '등촌역', '등촌동', '염창', '염창역', '염창동', '강서구', '가양',
          '양천향교', '양천향교역'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 63,
    '9호선 등촌·염창역 일대 주거 밀착 상권입니다. 가양·마곡 인접 시너지가 있습니다.',
    '{"reasons":["9호선 급행 접근성","가양·마곡 인접 시너지","주거 배후 안정 수요"],"warnings":["외부 유입 제한적","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 양천구: 양천구청·신정 보강
  (
    'yangcheon-guchong-general', '양천구청·신정사거리', '양천구', null,
    array['양천구청', '양천구청역', '신정', '신정동', '신정역', '양천구', '오목교'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 65,
    '2호선 양천구청역 + 신정 일대 주거 생활 상권입니다. 목동 인접 시너지로 학원가 수요가 결합됩니다.',
    '{"reasons":["목동 학원가 인접 시너지","주거 배후 안정 수요","2호선 접근성"],"warnings":["외부 유입 제한적","목동 본진과 수요 분산"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 광진구: 자양·구의 별도
  (
    'jayang-guui-general', '자양·구의·강변', '광진구', null,
    array['자양', '자양동', '자양역', '구의', '구의동', '구의역', '강변', '강변역',
          '광진구', '동서울터미널', '테크노마트'],
    'destination', 'mid-high', 'mid-high', 'mid-high', 'strong', 'strong', 72,
    '2호선 구의·강변역 + 동서울터미널 + 테크노마트가 결합된 광진구 동측 핵심 상권입니다.',
    '{"reasons":["동서울터미널 광역버스 수요","테크노마트 앵커","2호선 강변역 접근성"],"warnings":["건대·잠실 수요 분산","주거 배후 약함"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 광진구: 군자·중곡
  (
    'gunja-junggok-general', '군자·중곡', '광진구', null,
    array['군자', '군자역', '군자동', '중곡', '중곡역', '중곡동', '광진구',
          '능동', '어린이대공원'],
    'residential', 'mid', 'mid', 'mid-high', 'strong', 'mid-high', 63,
    '5·7호선 군자역 + 7호선 중곡역 일대 주거 밀착 상권입니다. 어린이대공원 인접 가족 수요가 일부 있습니다.',
    '{"reasons":["5·7호선 환승","어린이대공원 주말 가족 수요","임대료 합리적"],"warnings":["외부 유입 제한적","건대 본진과 수요 분산"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 노원구: 마들·당고개
  (
    'madeul-danggogae-general', '마들·당고개·상계', '노원구', null,
    array['마들', '마들역', '당고개', '당고개역', '상계', '상계역', '상계동',
          '노원구', '의정부', '석계'],
    'residential', 'low', 'mid', 'mid', 'mid-high', 'mid-high', 58,
    '4호선 마들·당고개·상계역 일대 노원구 북측 주거 밀착 상권입니다. 임대료가 매우 낮고 1인가구·가족 수요가 결합됩니다.',
    '{"reasons":["서울 최저 수준 임대료","주거 배후 안정 수요","4호선 접근성"],"warnings":["외부 유입 거의 없음","상권 자체 정체"]}'::jsonb,
    'fresh', '2026-05-17', '2026-11-17', null
  ),

  -- 강남구: 일원·수서·개포
  (
    'suseo-ilwon-general', '수서·일원·개포', '강남구', null,
    array['수서', '수서역', '일원', '일원역', '개포', '개포동', '개포역',
          '강남구', '대모산', 'SRT'],
    'office', 'mid-high', 'mid', 'mid-high', 'strong', 'strong', 75,
    '3·분당·SRT 수서역 + 개포 신축 단지 + 일원 LG 사옥이 결합된 강남 동남부 핵심 상권입니다. GTX-A 2027 개통 호재.',
    '{"reasons":["SRT 수서역 + GTX-A 2027 호재","개포·일원 신축 단지 입주","대치 학원가 연계"],"warnings":["상권 형성 초기","유동인구 다양성 부족"]}'::jsonb,
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
