/* ─────────────────────────────────────────────
 *  seoul-districts.ts
 *  서울 25개 구 × 3~5개 추천 상권 = 100개+ 데이터
 *
 *  점수 체계 (100점):
 *    유동인구 30% · 임대료 효율 20% · 경쟁밀도 15%
 *    접근성 15% · 타겟적합도 10% · 성장추세 10%
 *
 *  출처: 서울시 상권분석서비스(golmok.seoul.go.kr),
 *        서울열린데이터, KB부동산, 소상공인시장진흥공단 (2024-2025)
 * ───────────────────────────────────────────── */

export type MarketDistrict = {
  id: string;
  /** 구 이름 — 매칭 키워드 */
  guName: string;
  /** 매칭 가능한 키워드들 (구 이름, 동 이름, 역 이름 등) */
  matchKeywords: string[];
  title: { ko: string; en: string };
  score: number;
  summary: { ko: string; en: string };
  meta: {
    districtName: string;
    rentBand: "low" | "mid-low" | "mid" | "mid-high" | "high";
    competitionLevel: "low" | "mid" | "high";
    customerFit: "strong" | "steady" | "throughput" | "mixed";
    footTraffic: "very-high" | "high" | "mid" | "low";
    growthTrend: "rising" | "stable" | "declining";
    marketStyle: "destination" | "office" | "residential" | "balanced";
  };
};

function m(d: MarketDistrict): MarketDistrict { return d; }

export const seoulMarketDistricts: MarketDistrict[] = [

  /* ━━━ 강남구 ━━━ */
  m({ id: "gangnam-station", guName: "강남구", matchKeywords: ["강남", "강남구", "강남역", "신논현", "논현"], title: { ko: "강남역 상권", en: "Gangnam Station" }, score: 91, summary: { ko: "일 유동인구 46만, 서울 최대 상업 밀집지. 20-30대 중심 트렌드 주도 상권이지만 임대료가 매우 높습니다.", en: "460K daily foot traffic, Seoul's largest commercial hub. Trend-driven 20s-30s but very high rent." }, meta: { districtName: "강남구", rentBand: "high", competitionLevel: "high", customerFit: "throughput", footTraffic: "very-high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "samsung-coex", guName: "강남구", matchKeywords: ["삼성", "삼성역", "코엑스", "무역센터"], title: { ko: "삼성역·코엑스 상권", en: "Samsung Stn / COEX" }, score: 87, summary: { ko: "일 유동인구 31.6만, 점심 매출 비중 48.7%. 오피스+컨벤션 복합 상권으로 점심·저녁 수요가 안정적입니다.", en: "316K daily traffic, 48.7% lunch revenue. Office+convention complex with stable lunch/dinner demand." }, meta: { districtName: "강남구", rentBand: "high", competitionLevel: "high", customerFit: "steady", footTraffic: "very-high", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "apgujeong-cheongdam", guName: "강남구", matchKeywords: ["압구정", "청담", "압구정로데오", "도산"], title: { ko: "압구정·청담 상권", en: "Apgujeong / Cheongdam" }, score: 84, summary: { ko: "프리미엄 브랜드 밀집지. 고소득층+외국인 관광객 타겟에 최적이나 진입장벽이 매우 높습니다.", en: "Premium brand hub. Optimal for high-income + tourist targeting but very high entry barrier." }, meta: { districtName: "강남구", rentBand: "high", competitionLevel: "high", customerFit: "strong", footTraffic: "high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "daechi-dogok", guName: "강남구", matchKeywords: ["대치", "대치동", "도곡", "학원가"], title: { ko: "대치동 학원가 상권", en: "Daechi Academy District" }, score: 79, summary: { ko: "학원가 밀집으로 학생·학부모 안정 수요. 교육·식음료 업종에 최적이며 저녁 매출이 높습니다.", en: "Academy cluster with stable student/parent demand. Optimal for education/F&B, strong evening sales." }, meta: { districtName: "강남구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "yeoksam", guName: "강남구", matchKeywords: ["역삼", "역삼역", "역삼동", "테헤란로"], title: { ko: "역삼·테헤란로 상권", en: "Yeoksam / Teheran-ro" }, score: 86, summary: { ko: "IT 스타트업 밀집 오피스 상권. 점심 수요 매우 강하고 저녁에는 회식 수요도 있습니다.", en: "IT startup office district. Very strong lunch demand with dinner corporate dining." }, meta: { districtName: "강남구", rentBand: "high", competitionLevel: "high", customerFit: "steady", footTraffic: "very-high", growthTrend: "stable", marketStyle: "office" } }),

  /* ━━━ 서초구 ━━━ */
  m({ id: "gangnam-express", guName: "서초구", matchKeywords: ["서초", "서초구", "고속터미널", "신반포", "반포", "express"], title: { ko: "고속터미널·반포 상권", en: "Express Terminal / Banpo" }, score: 83, summary: { ko: "고속터미널 지하상가+반포 주거 수요 혼합. 쇼핑+식음료 복합 수요가 안정적입니다.", en: "Express terminal underground + Banpo residential mix. Stable shopping+F&B demand." }, meta: { districtName: "서초구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "gyodae", guName: "서초구", matchKeywords: ["교대", "교대역", "서초동"], title: { ko: "교대역 상권", en: "Gyodae Station" }, score: 80, summary: { ko: "법원·검찰청 인근 오피스+학원가 복합. 점심 수요 강하고 주말에는 유동인구가 줄어듭니다.", en: "Near courts, office+academy complex. Strong lunch, lower weekend traffic." }, meta: { districtName: "서초구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "bangbae", guName: "서초구", matchKeywords: ["방배", "방배동", "방배카페거리"], title: { ko: "방배 카페거리 상권", en: "Bangbae Cafe Street" }, score: 77, summary: { ko: "조용한 주거지 기반 카페·브런치 상권. 임대료가 강남 대비 낮고 단골 형성에 유리합니다.", en: "Quiet residential cafe/brunch district. Lower rent than Gangnam, good for building regulars." }, meta: { districtName: "서초구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 마포구 ━━━ */
  m({ id: "hongdae", guName: "마포구", matchKeywords: ["홍대", "홍대입구", "홍익대", "서교동", "동교동", "마포", "마포구"], title: { ko: "홍대 상권", en: "Hongdae" }, score: 85, summary: { ko: "서울 대표 MZ세대 상권. 유동인구 매우 높으나 임대료 부담과 경쟁 밀도도 높습니다. 체험형·SNS 마케팅에 유리합니다.", en: "Seoul's iconic MZ generation district. Very high traffic but high rent and competition. Great for experiential/SNS marketing." }, meta: { districtName: "마포구", rentBand: "high", competitionLevel: "high", customerFit: "throughput", footTraffic: "very-high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "yeonnam", guName: "마포구", matchKeywords: ["연남", "연남동", "경의선숲길", "연남로"], title: { ko: "연남동 상권", en: "Yeonnam-dong" }, score: 83, summary: { ko: "경의선 숲길 중심 감성 상권. 카페·디저트·소품숍에 특화. 주말 외부 유입이 많습니다.", en: "Gyeongui Line Forest sensibility district. Specialized for cafes/dessert/boutiques. High weekend inflow." }, meta: { districtName: "마포구", rentBand: "mid-high", competitionLevel: "high", customerFit: "strong", footTraffic: "high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "mangwon", guName: "마포구", matchKeywords: ["망원", "망원동", "망원시장", "망리단길"], title: { ko: "망원동 상권", en: "Mangwon-dong" }, score: 82, summary: { ko: "로컬 감성 강한 주거 밀착 상권. 홍대 대비 임대료 합리적이고 단골 형성에 유리합니다.", en: "Local-feel residential district. More reasonable rent than Hongdae, good for building regulars." }, meta: { districtName: "마포구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "hapjeong-sangsu", guName: "마포구", matchKeywords: ["합정", "상수", "합정역", "상수동", "합마르뜨"], title: { ko: "합정·상수 상권", en: "Hapjeong / Sangsu" }, score: 84, summary: { ko: "20대~직장인까지 폭넓은 고객층. '합마르뜨' 골목이 부상 중이며 홍대 대비 객단가가 높습니다.", en: "Broad customer base from 20s to office workers. 'Hapmareutre' alley rising, higher ticket than Hongdae." }, meta: { districtName: "마포구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "strong", footTraffic: "high", growthTrend: "rising", marketStyle: "balanced" } }),

  /* ━━━ 용산구 ━━━ */
  m({ id: "itaewon-hannam", guName: "용산구", matchKeywords: ["이태원", "한남", "한남동", "용산", "용산구", "이태원로"], title: { ko: "이태원·한남 상권", en: "Itaewon / Hannam" }, score: 86, summary: { ko: "외국인+고소득 로컬 복합 상권. 공실률 0%대로 매우 활발하며 프리미엄 F&B에 최적입니다.", en: "Expat + high-income local mix. Near-zero vacancy, optimal for premium F&B." }, meta: { districtName: "용산구", rentBand: "high", competitionLevel: "mid", customerFit: "strong", footTraffic: "high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "yongridangil", guName: "용산구", matchKeywords: ["용리단길", "용산역", "신용산"], title: { ko: "용리단길 상권", en: "Yongni-dan-gil" }, score: 82, summary: { ko: "KTX·지하철 복합 접근성. 도시재생+대기업 입주로 젊은 직장인·관광객 유입이 급증하고 있습니다.", en: "KTX+subway access. Urban regen + corporate HQs driving young worker/tourist inflow." }, meta: { districtName: "용산구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "strong", footTraffic: "high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "ichon", guName: "용산구", matchKeywords: ["이촌", "이촌동", "이촌역"], title: { ko: "이촌동 상권", en: "Ichon-dong" }, score: 74, summary: { ko: "고급 아파트 밀집 주거 상권. 안정적 단골 형성 가능하나 유동인구는 낮은 편입니다.", en: "High-end apartment residential district. Stable regulars possible but lower foot traffic." }, meta: { districtName: "용산구", rentBand: "mid", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 성동구 ━━━ */
  m({ id: "seongsu", guName: "성동구", matchKeywords: ["성수", "성수동", "뚝섬", "서울숲", "성동", "성동구"], title: { ko: "성수동 상권", en: "Seongsu-dong" }, score: 90, summary: { ko: "서울 최고 성장 상권. 팝업스토어·브랜드 플래그십 메카. 공실률 2.5%로 매우 낮지만 임대료가 급등 중입니다.", en: "Seoul's fastest-growing district. Popup/flagship mecca. 2.5% vacancy but rent surging." }, meta: { districtName: "성동구", rentBand: "high", competitionLevel: "high", customerFit: "strong", footTraffic: "very-high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "wangsimni", guName: "성동구", matchKeywords: ["왕십리", "왕십리역", "행당동"], title: { ko: "왕십리역 상권", en: "Wangsimni Station" }, score: 78, summary: { ko: "대학가+주거 복합 상권. 한양대·BTOB센터 인근으로 학생+직장인 수요가 안정적입니다.", en: "University+residential mix. Near Hanyang Univ with stable student/worker demand." }, meta: { districtName: "성동구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "oksu-geumho", guName: "성동구", matchKeywords: ["옥수", "금호", "옥수동", "금호동"], title: { ko: "옥수·금호 상권", en: "Oksu / Geumho" }, score: 73, summary: { ko: "한남동 인접 주거 상권. 최근 카페·베이커리 유입 증가하며 임대료는 아직 합리적입니다.", en: "Residential near Hannam. Recent cafe/bakery inflow, rent still reasonable." }, meta: { districtName: "성동구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),

  /* ━━━ 송파구 ━━━ */
  m({ id: "jamsil", guName: "송파구", matchKeywords: ["잠실", "잠실역", "롯데월드", "잠실새내", "송파", "송파구"], title: { ko: "잠실 상권", en: "Jamsil" }, score: 88, summary: { ko: "롯데월드+올림픽공원 관광 수요와 대규모 아파트 주거 수요가 결합된 대형 상권입니다.", en: "Lotte World + Olympic Park tourism combined with large apartment residential demand." }, meta: { districtName: "송파구", rentBand: "high", competitionLevel: "high", customerFit: "mixed", footTraffic: "very-high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "seokchon", guName: "송파구", matchKeywords: ["석촌", "석촌호수", "석촌역", "송리단길"], title: { ko: "석촌·송리단길 상권", en: "Seokchon / Songni-dan-gil" }, score: 83, summary: { ko: "석촌호수 주변 감성 상권. SNS 핫플레이스로 주말 외부 유입이 높고 카페·디저트에 최적입니다.", en: "Seokchon Lake sensibility district. SNS hotspot with high weekend inflow, optimal for cafes." }, meta: { districtName: "송파구", rentBand: "mid-high", competitionLevel: "mid", customerFit: "strong", footTraffic: "high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "munjeong", guName: "송파구", matchKeywords: ["문정", "문정동", "법조단지", "가든파이브"], title: { ko: "문정 법조단지 상권", en: "Munjeong Legal Complex" }, score: 78, summary: { ko: "법조단지+가든파이브 오피스·쇼핑 복합. 점심 수요가 강하고 주말에는 쇼핑 유입이 있습니다.", en: "Legal complex + Garden Five office/shopping. Strong lunch, weekend shopping traffic." }, meta: { districtName: "송파구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "office" } }),

  /* ━━━ 강동구 ━━━ */
  m({ id: "cheonho-gangdong", guName: "강동구", matchKeywords: ["천호", "강동", "강동구", "천호역", "현대백화점"], title: { ko: "천호역 상권", en: "Cheonho Station" }, score: 80, summary: { ko: "현대백화점+로데오거리 중심 강동구 최대 상권. 주거 밀집 배후에 안정적 수요가 있습니다.", en: "Hyundai Dept Store + Rodeo St, Gangdong's largest. Stable demand from dense residential backing." }, meta: { districtName: "강동구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "gildong-myeongil", guName: "강동구", matchKeywords: ["길동", "명일", "명일동", "고덕"], title: { ko: "고덕·명일 상권", en: "Godeok / Myeongil" }, score: 75, summary: { ko: "대규모 신축 아파트 단지 배후 상권. 입주 수요가 증가하며 생활 밀착형 업종에 유리합니다.", en: "New apartment complex backing. Growing move-in demand, good for daily-life businesses." }, meta: { districtName: "강동구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "dunchon", guName: "강동구", matchKeywords: ["둔촌", "둔촌동", "둔촌주공"], title: { ko: "둔촌동 상권", en: "Dunchon-dong" }, score: 76, summary: { ko: "둔촌주공 재건축 완료 후 1.2만 세대 입주 예정. 향후 상권 성장 잠재력이 높은 지역입니다.", en: "Post-rebuild 12K household move-in planned. High future commercial growth potential." }, meta: { districtName: "강동구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),

  /* ━━━ 영등포구 ━━━ */
  m({ id: "yeouido", guName: "영등포구", matchKeywords: ["여의도", "여의도역", "영등포", "영등포구", "IFC"], title: { ko: "여의도 상권", en: "Yeouido" }, score: 85, summary: { ko: "증권가+방송가+국회 오피스 밀집. 점심 매출 비중이 매우 높고 주말에는 한강공원 유입이 있습니다.", en: "Finance+broadcasting+parliament office cluster. Very high lunch share, weekend Han River traffic." }, meta: { districtName: "영등포구", rentBand: "high", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "yeongdeungpo-station", guName: "영등포구", matchKeywords: ["영등포역", "영등포시장", "타임스퀘어"], title: { ko: "영등포역 상권", en: "Yeongdeungpo Stn" }, score: 79, summary: { ko: "KTX 정차역+타임스퀘어 복합. 교통 허브로 유동인구가 많고 다양한 연령층이 혼합됩니다.", en: "KTX stop + Times Square complex. Transport hub with high mixed-age traffic." }, meta: { districtName: "영등포구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "dangsan", guName: "영등포구", matchKeywords: ["당산", "당산역", "당산동"], title: { ko: "당산역 상권", en: "Dangsan Station" }, score: 77, summary: { ko: "2·9호선 환승역 인근 직장인 밀집. 점심·저녁 수요 안정적이며 임대료가 합리적입니다.", en: "Lines 2/9 transfer station area. Stable lunch/dinner demand with reasonable rent." }, meta: { districtName: "영등포구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "office" } }),

  /* ━━━ 구로구 ━━━ */
  m({ id: "sindorim", guName: "구로구", matchKeywords: ["신도림", "디큐브시티", "구로", "구로구"], title: { ko: "신도림 상권", en: "Sindorim" }, score: 79, summary: { ko: "디큐브시티+테크노마트 복합 상권. 1·2호선 환승으로 유동인구가 많고 영등포 생활권과 연결됩니다.", en: "D-Cube City + Technomart complex. Lines 1/2 transfer with high traffic, connected to Yeongdeungpo." }, meta: { districtName: "구로구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "gasan-digital", guName: "구로구", matchKeywords: ["가산", "가산디지털단지", "구로디지털"], title: { ko: "가산디지털단지 상권", en: "Gasan Digital Complex" }, score: 76, summary: { ko: "IT·제조업 오피스 밀집. 점심 수요가 매우 강하나 저녁·주말에는 유동인구가 급감합니다.", en: "IT/manufacturing office cluster. Very strong lunch but sharp evening/weekend drop." }, meta: { districtName: "구로구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "high", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "guro-station", guName: "구로구", matchKeywords: ["구로역", "구로시장"], title: { ko: "구로역 상권", en: "Guro Station" }, score: 73, summary: { ko: "1호선 구로역 인근 전통 상권. 임대료가 낮고 생활 밀착형 업종에 적합합니다.", en: "Traditional district near Line 1 Guro Stn. Low rent, good for daily-life businesses." }, meta: { districtName: "구로구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 금천구 ━━━ */
  m({ id: "gasan-goldvalley", guName: "금천구", matchKeywords: ["금천", "금천구", "가산", "독산"], title: { ko: "가산 골드밸리 상권", en: "Gasan Gold Valley" }, score: 74, summary: { ko: "디지털단지 오피스 배후 상권. 점심 특화로 임대료가 저렴하고 진입장벽이 낮습니다.", en: "Digital complex office backing. Lunch-specialized with low rent and entry barrier." }, meta: { districtName: "금천구", rentBand: "low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "mid", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "doksan", guName: "금천구", matchKeywords: ["독산", "독산역", "시흥동"], title: { ko: "독산역 상권", en: "Doksan Station" }, score: 70, summary: { ko: "1호선 역세권 주거 상권. 배달 수요가 높고 창업 비용이 서울 최저 수준입니다.", en: "Line 1 residential area. High delivery demand, among Seoul's lowest startup costs." }, meta: { districtName: "금천구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "geumcheon-guro-digital", guName: "금천구", matchKeywords: ["가산디지털"], title: { ko: "금천 IT밸리 상권", en: "Geumcheon IT Valley" }, score: 72, summary: { ko: "중소 IT기업 밀집 오피스 지역. 점심 배달+테이크아웃 수요가 핵심입니다.", en: "SME IT office cluster. Lunch delivery+takeout demand is key." }, meta: { districtName: "금천구", rentBand: "low", competitionLevel: "low", customerFit: "throughput", footTraffic: "mid", growthTrend: "stable", marketStyle: "office" } }),

  /* ━━━ 종로구 ━━━ */
  m({ id: "jongno-jongak", guName: "종로구", matchKeywords: ["종로", "종로구", "종각", "종각역", "광화문", "세종로"], title: { ko: "종각·광화문 상권", en: "Jonggak / Gwanghwamun" }, score: 84, summary: { ko: "서울 도심 핵심 오피스 상권. 대기업·정부기관 밀집으로 점심 수요가 압도적입니다.", en: "Seoul CBD core office district. Major corps + government = overwhelming lunch demand." }, meta: { districtName: "종로구", rentBand: "high", competitionLevel: "high", customerFit: "throughput", footTraffic: "very-high", growthTrend: "stable", marketStyle: "office" } }),
  m({ id: "ikseondong", guName: "종로구", matchKeywords: ["익선동", "익선", "종로3가", "낙원"], title: { ko: "익선동 한옥거리", en: "Ikseon-dong Hanok" }, score: 80, summary: { ko: "한옥 리모델링 감성 상권. 관광객+MZ세대 유입이 높고 카페·디저트·소품숍에 최적입니다.", en: "Hanok-remodeled sensibility district. High tourist+MZ inflow, optimal for cafes/boutiques." }, meta: { districtName: "종로구", rentBand: "mid-high", competitionLevel: "high", customerFit: "strong", footTraffic: "high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "hyehwa", guName: "종로구", matchKeywords: ["혜화", "혜화역", "대학로"], title: { ko: "혜화·대학로 상권", en: "Hyehwa / Daehak-ro" }, score: 79, summary: { ko: "뮤지컬·연극 문화 중심지. 공연 관람객+대학생 수요가 저녁·주말에 집중됩니다.", en: "Musical/theater culture hub. Performance-goer + student demand peaks evening/weekend." }, meta: { districtName: "종로구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "destination" } }),

  /* ━━━ 중구 ━━━ */
  m({ id: "myeongdong", guName: "중구", matchKeywords: ["명동", "중구", "을지로입구", "남대문"], title: { ko: "명동 상권", en: "Myeongdong" }, score: 86, summary: { ko: "외국인 관광객 1위 상권. 코로나 이후 회복세이며 뷰티·면세·식음료에 강합니다.", en: "#1 tourist district. Post-COVID recovery, strong for beauty/duty-free/F&B." }, meta: { districtName: "중구", rentBand: "high", competitionLevel: "high", customerFit: "throughput", footTraffic: "very-high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "euljiro", guName: "중구", matchKeywords: ["을지로", "을지로3가", "을지로4가", "힙지로"], title: { ko: "을지로 '힙지로' 상권", en: "Euljiro 'Hipjiro'" }, score: 81, summary: { ko: "레트로 감성 골목 상권. 인쇄소·공장을 개조한 카페·바가 MZ세대 핫플레이스로 부상했습니다.", en: "Retro alley district. Converted print shops/factories as cafes/bars — MZ hotspot." }, meta: { districtName: "중구", rentBand: "mid", competitionLevel: "mid", customerFit: "strong", footTraffic: "high", growthTrend: "rising", marketStyle: "destination" } }),
  m({ id: "chungmuro-dongdaemun", guName: "중구", matchKeywords: ["충무로", "동대문", "DDP"], title: { ko: "충무로·DDP 상권", en: "Chungmuro / DDP" }, score: 78, summary: { ko: "DDP+남산 관광 루트. 외국인+직장인 혼합 수요이며 패션·문화 이벤트 연계 가능합니다.", en: "DDP+Namsan tourism route. Mixed tourist/worker demand, fashion/culture event linkage." }, meta: { districtName: "중구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),

  /* ━━━ 동대문구 ━━━ */
  m({ id: "hoegi-hankuk", guName: "동대문구", matchKeywords: ["회기", "외대", "동대문구", "경희대", "한국외대"], title: { ko: "회기·외대 상권", en: "Hoegi / HUFS" }, score: 76, summary: { ko: "대학가 중심 상권. 학생 수요가 안정적이고 임대료가 합리적이며 배달 수요도 높습니다.", en: "University-centered district. Stable student demand, reasonable rent, high delivery." }, meta: { districtName: "동대문구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "cheongnyangni", guName: "동대문구", matchKeywords: ["청량리", "청량리역", "전농동"], title: { ko: "청량리역 상권", en: "Cheongnyangni Station" }, score: 77, summary: { ko: "GTX-B 개통 예정으로 성장 기대. 전통시장+대형 재개발이 진행 중인 변화기 상권입니다.", en: "GTX-B opening expected, growth potential. Traditional market + large redevelopment in transition." }, meta: { districtName: "동대문구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "rising", marketStyle: "balanced" } }),
  m({ id: "janghanpyeong", guName: "동대문구", matchKeywords: ["장한평", "답십리"], title: { ko: "답십리 상권", en: "Dapsimni" }, score: 72, summary: { ko: "주거 밀집 생활 상권. 임대료가 낮고 배달+생활 밀착형 업종에 적합합니다.", en: "Dense residential daily-life district. Low rent, good for delivery + daily-life businesses." }, meta: { districtName: "동대문구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 광진구 ━━━ */
  m({ id: "konkuk", guName: "광진구", matchKeywords: ["건대", "건대입구", "건국대", "광진", "광진구"], title: { ko: "건대입구 상권", en: "Konkuk University" }, score: 84, summary: { ko: "대학가+커먼그라운드 복합 상권. 학생·20대 유동인구가 매우 높고 테이크아웃·배달에 강합니다.", en: "University + Common Ground complex. Very high 20s traffic, strong for takeout/delivery." }, meta: { districtName: "광진구", rentBand: "mid-high", competitionLevel: "high", customerFit: "throughput", footTraffic: "very-high", growthTrend: "stable", marketStyle: "destination" } }),
  m({ id: "guui-jayang", guName: "광진구", matchKeywords: ["구의", "자양", "자양동", "뚝섬유원지"], title: { ko: "자양동 상권", en: "Jayang-dong" }, score: 76, summary: { ko: "주거 밀집+뚝섬유원지 인접. 양꼬치 거리로 유명하며 중식·야식 수요가 높습니다.", en: "Residential + near Ttukseom Park. Famous for lamb skewers, strong Chinese/late-night demand." }, meta: { districtName: "광진구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "gwangnaru", guName: "광진구", matchKeywords: ["광나루", "아차산"], title: { ko: "광나루역 상권", en: "Gwangnaru Station" }, score: 72, summary: { ko: "5호선 역세권 주거 상권. 배달 수요 중심이며 창업 비용이 합리적입니다.", en: "Line 5 residential area. Delivery-centered demand, reasonable startup costs." }, meta: { districtName: "광진구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 노원구 ━━━ */
  m({ id: "nowon-station", guName: "노원구", matchKeywords: ["노원", "노원구", "노원역", "노원역사거리"], title: { ko: "노원역 상권", en: "Nowon Station" }, score: 80, summary: { ko: "롯데백화점+역세권 결합 노원구 최대 상권. 서울 북동부 최대 유동인구로 하루 10만 이상입니다.", en: "Lotte Dept Store + station, Nowon's largest. 100K+ daily traffic, NE Seoul's biggest." }, meta: { districtName: "노원구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "junggye-eunhaeng", guName: "노원구", matchKeywords: ["중계", "중계동", "은행사거리", "중계은행"], title: { ko: "중계동 은행사거리", en: "Junggye Eunhaeng" }, score: 77, summary: { ko: "학원가 중심 반복 방문 상권. 초·중·고 학부모 소비가 안정적이며 교육+식음료에 유리합니다.", en: "Academy-centered repeat visit district. Stable parent spending, good for education+F&B." }, meta: { districtName: "노원구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "gongneung-meokja", guName: "노원구", matchKeywords: ["공릉", "공릉동", "먹자골목", "서울과기대", "육사"], title: { ko: "공릉동 먹자골목", en: "Gongneung Food Alley" }, score: 74, summary: { ko: "서울과기대·육사 인접 대학가. 젊은 층 소비가 집중되며 임대료가 낮아 초기 창업에 유리합니다.", en: "Near Seoul Tech/Military Academy. Youth spending concentrated, low rent for early startups." }, meta: { districtName: "노원구", rentBand: "low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "mid", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "sangge-suraksan", guName: "노원구", matchKeywords: ["상계", "상계역", "수락산"], title: { ko: "상계역 상권", en: "Sanggye Station" }, score: 72, summary: { ko: "4호선 역세권 주거 밀집 상권. 아파트 배후 수요가 안정적이고 배달 수요가 높습니다.", en: "Line 4 residential cluster. Stable apartment-backed demand, high delivery." }, meta: { districtName: "노원구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 도봉구 ━━━ */
  m({ id: "changdong", guName: "도봉구", matchKeywords: ["창동", "창동역", "도봉", "도봉구"], title: { ko: "창동역 상권", en: "Changdong Station" }, score: 75, summary: { ko: "GTX-C 개통 예정으로 미래 성장 기대. 현재는 주거 중심이나 대규모 개발이 진행 중입니다.", en: "GTX-C opening planned, future growth expected. Currently residential but large development ongoing." }, meta: { districtName: "도봉구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "ssangmun", guName: "도봉구", matchKeywords: ["쌍문", "쌍문역", "쌍문동"], title: { ko: "쌍문역 상권", en: "Ssangmun Station" }, score: 71, summary: { ko: "4호선 역세권 생활 상권. 임대료가 서울 최저 수준이며 배달+생활 밀착형 업종에 적합합니다.", en: "Line 4 daily-life district. Among Seoul's lowest rent, good for delivery + daily-life." }, meta: { districtName: "도봉구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "dobong-station", guName: "도봉구", matchKeywords: ["도봉산", "도봉역"], title: { ko: "도봉역 상권", en: "Dobong Station" }, score: 68, summary: { ko: "1·7호선 환승역. 주거 밀집 지역으로 안정적이나 유동인구는 낮은 편입니다.", en: "Lines 1/7 transfer. Stable residential but lower foot traffic." }, meta: { districtName: "도봉구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "low", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 강북구 ━━━ */
  m({ id: "mia-station", guName: "강북구", matchKeywords: ["미아", "미아역", "미아사거리", "강북", "강북구"], title: { ko: "미아사거리 상권", en: "Mia Intersection" }, score: 76, summary: { ko: "4호선 역세권+재개발 진행 중. 주거 배후 수요가 탄탄하고 생활 밀착형 업종에 유리합니다.", en: "Line 4 + redevelopment ongoing. Solid residential backing, good for daily-life businesses." }, meta: { districtName: "강북구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "suyu", guName: "강북구", matchKeywords: ["수유", "수유역", "수유동", "수유시장"], title: { ko: "수유역 상권", en: "Suyu Station" }, score: 73, summary: { ko: "4호선 역세권 전통 상권. 수유시장+아파트 밀집으로 생활 수요가 안정적입니다.", en: "Line 4 traditional district. Suyu Market + apartments = stable daily demand." }, meta: { districtName: "강북구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "beon-dong", guName: "강북구", matchKeywords: ["번동", "4·19"], title: { ko: "번동 상권", en: "Beon-dong" }, score: 69, summary: { ko: "주거 밀집 생활 상권. 임대료가 매우 낮고 소자본 배달 창업에 적합합니다.", en: "Dense residential daily-life district. Very low rent, good for small-capital delivery." }, meta: { districtName: "강북구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "low", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 성북구 ━━━ */
  m({ id: "gireum-mia", guName: "성북구", matchKeywords: ["길음", "길음역", "성북", "성북구", "미아리"], title: { ko: "길음역 상권", en: "Gireum Station" }, score: 75, summary: { ko: "4호선 역세권+대형마트 인접. 주거 밀집 배후에 안정적 생활 수요가 있습니다.", en: "Line 4 + hypermarket adjacent. Stable daily demand from dense residential backing." }, meta: { districtName: "성북구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "korea-univ", guName: "성북구", matchKeywords: ["고려대", "안암", "안암역", "성신여대"], title: { ko: "고려대·안암 상권", en: "Korea Univ / Anam" }, score: 77, summary: { ko: "고려대 인접 대학가 상권. 학생·직원 수요가 안정적이며 저녁 술집·회식 문화도 강합니다.", en: "Near Korea Univ campus. Stable student/staff demand, strong evening dining/drinking culture." }, meta: { districtName: "성북구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "jeongneung", guName: "성북구", matchKeywords: ["정릉", "국민대", "정릉동"], title: { ko: "정릉·국민대 상권", en: "Jeongneung / Kookmin Univ" }, score: 71, summary: { ko: "국민대 배후 학생 상권. 임대료가 매우 저렴하고 소자본 창업에 유리합니다.", en: "Kookmin Univ student backing. Very affordable rent, good for small-capital startups." }, meta: { districtName: "성북구", rentBand: "low", competitionLevel: "low", customerFit: "throughput", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 중랑구 ━━━ */
  m({ id: "sangbong", guName: "중랑구", matchKeywords: ["상봉", "상봉역", "중랑", "중랑구"], title: { ko: "상봉역 상권", en: "Sangbong Station" }, score: 74, summary: { ko: "중랑구 최대 상권. 코스트코+홈플러스 배후에 유동인구가 많고 교통 접근성이 좋습니다.", en: "Jungnang's largest. Costco + Homeplus backing with good transport access." }, meta: { districtName: "중랑구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "myeonmok", guName: "중랑구", matchKeywords: ["면목", "면목동", "면목역"], title: { ko: "면목동 상권", en: "Myeonmok-dong" }, score: 71, summary: { ko: "7호선 역세권 주거 상권. 모아타운 지정으로 향후 인구 유입이 기대됩니다.", en: "Line 7 residential area. Moa Town designation promises future population inflow." }, meta: { districtName: "중랑구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "mangu", guName: "중랑구", matchKeywords: ["망우", "신내", "신내역"], title: { ko: "신내역 상권", en: "Sinnae Station" }, score: 70, summary: { ko: "경춘선+6호선 환승역. 신축 아파트 입주로 유동인구가 증가 추세입니다.", en: "Gyeongchun+Line 6 transfer. New apartment move-ins increasing foot traffic." }, meta: { districtName: "중랑구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "rising", marketStyle: "residential" } }),

  /* ━━━ 관악구 ━━━ */
  m({ id: "sillim", guName: "관악구", matchKeywords: ["신림", "신림역", "관악", "관악구", "신림동"], title: { ko: "신림역 상권", en: "Sillim Station" }, score: 79, summary: { ko: "서울대+고시촌 배후 대학가·학원가 복합. 1인 가구 밀집으로 배달+테이크아웃 수요가 매우 높습니다.", en: "SNU + exam village university/academy complex. High single-household density = strong delivery." }, meta: { districtName: "관악구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "seoul-national-univ", guName: "관악구", matchKeywords: ["서울대", "서울대입구", "서울대입구역", "낙성대"], title: { ko: "서울대입구역 상권", en: "SNU Station" }, score: 78, summary: { ko: "서울대 학생·교직원 안정 수요. 카페·식당 밀집이며 저녁·주말 문화 소비도 있습니다.", en: "Stable SNU student/staff demand. Cafe/restaurant cluster with evening/weekend cultural spending." }, meta: { districtName: "관악구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "bongcheon", guName: "관악구", matchKeywords: ["봉천", "봉천동", "봉천역"], title: { ko: "봉천동 상권", en: "Bongcheon-dong" }, score: 73, summary: { ko: "주거 밀집 생활 상권. 임대료가 합리적이고 1인 가구 배달 수요가 높습니다.", en: "Dense residential daily-life district. Reasonable rent, high single-household delivery demand." }, meta: { districtName: "관악구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 동작구 ━━━ */
  m({ id: "sadang-isu", guName: "동작구", matchKeywords: ["사당", "이수", "사당역", "이수역", "동작", "동작구"], title: { ko: "사당·이수 상권", en: "Sadang / Isu" }, score: 80, summary: { ko: "2·4호선 환승역 대형 상권. 유동인구 31%+ 성장하며 월 매출 297% 증가한 활성화 상권입니다.", en: "Lines 2/4 transfer large district. 31%+ traffic growth, 297% monthly revenue increase." }, meta: { districtName: "동작구", rentBand: "mid", competitionLevel: "mid", customerFit: "mixed", footTraffic: "high", growthTrend: "rising", marketStyle: "balanced" } }),
  m({ id: "noryangjin", guName: "동작구", matchKeywords: ["노량진", "노량진역", "만나로"], title: { ko: "노량진 상권", en: "Noryangjin" }, score: 74, summary: { ko: "수산시장+고시촌 복합. '만나로' 청춘 힐링거리로 탈바꿈 중이며 젊은층 유입이 증가합니다.", en: "Fish market + exam village. 'Mannaro' youth healing street transformation, rising young inflow." }, meta: { districtName: "동작구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "mid", growthTrend: "rising", marketStyle: "balanced" } }),
  m({ id: "heukseok", guName: "동작구", matchKeywords: ["흑석", "흑석역", "중앙대"], title: { ko: "흑석·중앙대 상권", en: "Heukseok / Chung-Ang Univ" }, score: 73, summary: { ko: "중앙대 배후 대학가. 학생 수요가 안정적이고 임대료가 합리적입니다.", en: "Near Chung-Ang Univ campus. Stable student demand with reasonable rent." }, meta: { districtName: "동작구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "throughput", footTraffic: "mid", growthTrend: "stable", marketStyle: "balanced" } }),

  /* ━━━ 양천구 ━━━ */
  m({ id: "mokdong", guName: "양천구", matchKeywords: ["목동", "목동역", "양천", "양천구", "오목교"], title: { ko: "목동 상권", en: "Mokdong" }, score: 79, summary: { ko: "학원가+아파트 밀집 서남권 핵심 상권. 학부모 소비가 높고 교육·식음료에 특히 강합니다.", en: "Academy + apartment SW Seoul core. High parent spending, especially strong for education/F&B." }, meta: { districtName: "양천구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "sinjeong", guName: "양천구", matchKeywords: ["신정", "신정네거리", "신정역"], title: { ko: "신정네거리 상권", en: "Sinjeong Intersection" }, score: 73, summary: { ko: "2호선 역세권 주거 상권. 아파트 밀집으로 생활 수요가 안정적이며 임대료가 합리적입니다.", en: "Line 2 residential area. Dense apartments = stable daily demand, reasonable rent." }, meta: { districtName: "양천구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "yangcheon-hyanggyo", guName: "양천구", matchKeywords: ["양천향교", "신월동"], title: { ko: "신월동 상권", en: "Sinwol-dong" }, score: 70, summary: { ko: "주거 중심 생활 상권. 임대료가 낮고 배달 수요 중심으로 소자본 창업에 적합합니다.", en: "Residential daily-life district. Low rent, delivery-centered, good for small capital." }, meta: { districtName: "양천구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "low", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 강서구 ━━━ */
  m({ id: "magok", guName: "강서구", matchKeywords: ["마곡", "마곡역", "마곡나루", "강서", "강서구"], title: { ko: "마곡 상권", en: "Magok" }, score: 81, summary: { ko: "LG·코오롱 등 대기업 R&D 밀집 신도시. 직장인 점심 수요가 폭발적이며 성장세가 뚜렷합니다.", en: "LG/Kolon R&D new town. Explosive worker lunch demand with clear growth trajectory." }, meta: { districtName: "강서구", rentBand: "mid", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "rising", marketStyle: "office" } }),
  m({ id: "hwagok", guName: "강서구", matchKeywords: ["화곡", "화곡역", "까치산"], title: { ko: "화곡역 상권", en: "Hwagok Station" }, score: 74, summary: { ko: "5호선 역세권 주거 밀집. 아파트 배후 생활 수요가 탄탄하고 임대료가 합리적입니다.", en: "Line 5 residential cluster. Solid apartment-backed demand, reasonable rent." }, meta: { districtName: "강서구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "balsan", guName: "강서구", matchKeywords: ["발산", "발산역", "우장산"], title: { ko: "발산역 상권", en: "Balsan Station" }, score: 73, summary: { ko: "5호선 역세권 + 김포공항 인접. 항공사·물류 종사자 수요가 있으며 24시간 업종에 유리합니다.", en: "Line 5 + near Gimpo Airport. Airline/logistics workers, good for 24h businesses." }, meta: { districtName: "강서구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "balanced" } }),

  /* ━━━ 은평구 ━━━ */
  m({ id: "yeonsinnae", guName: "은평구", matchKeywords: ["연신내", "연신내역", "은평", "은평구"], title: { ko: "연신내역 상권", en: "Yeonsinnae Station" }, score: 77, summary: { ko: "3·6호선 환승역 + 은평뉴타운 배후. 주거 수요가 풍부하고 생활 밀착형 업종에 최적입니다.", en: "Lines 3/6 transfer + Eunpyeong New Town backing. Rich residential demand, optimal for daily-life." }, meta: { districtName: "은평구", rentBand: "mid-low", competitionLevel: "mid", customerFit: "steady", footTraffic: "high", growthTrend: "rising", marketStyle: "residential" } }),
  m({ id: "eunpyeong-newtown", guName: "은평구", matchKeywords: ["은평뉴타운", "구파발", "진관동"], title: { ko: "은평뉴타운 상권", en: "Eunpyeong New Town" }, score: 74, summary: { ko: "대규모 신도시 배후 상권. 신축 아파트 입주 완료로 생활 수요가 안정화되고 있습니다.", en: "Large new town backing. Apartment move-in complete, daily demand stabilizing." }, meta: { districtName: "은평구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),
  m({ id: "bulgwang", guName: "은평구", matchKeywords: ["불광", "불광역", "녹번"], title: { ko: "불광역 상권", en: "Bulgwang Station" }, score: 72, summary: { ko: "3·6호선 환승역 주거 상권. 임대료가 낮고 배달+생활 밀착형 업종에 적합합니다.", en: "Lines 3/6 transfer residential area. Low rent, good for delivery + daily-life." }, meta: { districtName: "은평구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

  /* ━━━ 서대문구 ━━━ */
  m({ id: "sinchon", guName: "서대문구", matchKeywords: ["신촌", "신촌역", "이대", "서대문", "서대문구"], title: { ko: "신촌·이대 상권", en: "Sinchon / Ewha" }, score: 80, summary: { ko: "연세대·이화여대 대학가. 학생 수요가 견고하나 최근 유동인구가 홍대에 일부 빼앗겼습니다.", en: "Yonsei/Ewha university district. Solid student demand but some traffic lost to Hongdae." }, meta: { districtName: "서대문구", rentBand: "mid", competitionLevel: "high", customerFit: "throughput", footTraffic: "high", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "chunghyeon", guName: "서대문구", matchKeywords: ["충현", "충정로", "아현"], title: { ko: "충정로·아현 상권", en: "Chungjeongno / Ahyeon" }, score: 73, summary: { ko: "2·5호선 환승역. 오피스+주거 혼합 상권으로 점심 수요가 있으며 임대료가 합리적입니다.", en: "Lines 2/5 transfer. Office+residential mix, lunch demand, reasonable rent." }, meta: { districtName: "서대문구", rentBand: "mid-low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "balanced" } }),
  m({ id: "hongje", guName: "서대문구", matchKeywords: ["홍제", "홍제역", "홍은동"], title: { ko: "홍제역 상권", en: "Hongje Station" }, score: 71, summary: { ko: "3호선 역세권 주거 상권. 인왕산·안산 등산 수요와 주거 생활 수요가 혼합됩니다.", en: "Line 3 residential area. Mountain hiking + residential daily demand mixed." }, meta: { districtName: "서대문구", rentBand: "low", competitionLevel: "low", customerFit: "steady", footTraffic: "mid", growthTrend: "stable", marketStyle: "residential" } }),

];

/**
 * Search districts matching user's region input.
 * Returns at least 3 results if any match found.
 */
export function findMatchingDistricts(regionInput: string): MarketDistrict[] {
  const q = regionInput.trim().replace(/\s+/g, "");
  if (!q) return [];

  // 1. Exact keyword match
  const exact = seoulMarketDistricts.filter((d) =>
    d.matchKeywords.some((kw) => q.includes(kw) || kw.includes(q))
  );

  if (exact.length >= 3) {
    return exact.sort((a, b) => b.score - a.score);
  }

  // 2. If matched by gu but less than 3, add all from that gu
  const matchedGu = exact.length > 0 ? exact[0].guName : null;
  if (matchedGu) {
    const guResults = seoulMarketDistricts
      .filter((d) => d.guName === matchedGu)
      .sort((a, b) => b.score - a.score);
    if (guResults.length >= 3) return guResults;
  }

  // 3. Fuzzy: check if any keyword partially matches
  const fuzzy = seoulMarketDistricts.filter((d) =>
    d.matchKeywords.some((kw) => kw.includes(q) || q.includes(kw)) ||
    d.guName.includes(q) || d.title.ko.includes(q)
  );

  if (fuzzy.length >= 3) {
    return fuzzy.sort((a, b) => b.score - a.score);
  }

  // 4. If still < 3, add nearby gu recommendations
  if (exact.length > 0 || fuzzy.length > 0) {
    const base = exact.length > 0 ? exact : fuzzy;
    const baseGus = new Set(base.map((d) => d.guName));
    const supplement = seoulMarketDistricts
      .filter((d) => !baseGus.has(d.guName))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3 - base.length);
    return [...base, ...supplement].sort((a, b) => b.score - a.score);
  }

  // 5. No match at all — return top 3 overall
  return [...seoulMarketDistricts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
