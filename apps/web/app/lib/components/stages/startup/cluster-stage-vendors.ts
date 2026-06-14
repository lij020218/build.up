/**
 * 하드웨어·딥테크 클러스터 단계별 추천 공급사·도구 (2026 조사).
 *
 * ClusterStageTemplate 가 stageId + selectedIndustryId 로 조회해 "추천 공급사·도구" 섹션 렌더.
 * 4개 병렬 리서치 agent(WebSearch)가 카테고리별로 조사 — 모두 실존·2026 현행 확인, 출처 보유.
 * 확인 못 한 항목(일부 국내 EMS·CRO 등)은 제외하고 정부 매칭 플랫폼으로 라우팅.
 *
 *   • hardware-iot      → 단계별 flat 배열
 *   • robotics/biotech  → tech-deeptech-lab (lab-setup·prototype-iteration·field-or-clinical-test·regulatory-submission)
 *   • semiconductor/climate → tech-extreme-deeptech (eda-tooling-setup·mpw-or-pilot-tape-out·packaging-and-test·partner-foundation-or-pilot-line)
 *
 * 면책: 광고가 아닌 참고용. 발주·계약·인증 전 직접 검증 권장. 가격은 시점에 따라 변동.
 */

export type ClusterVendor = {
  name: string;
  category: string;
  descKo: string;
  href?: string;
  pricing?: string;
  tier: "essential" | "recommended" | "optional";
  tags?: string[];
};

// ─────────────────────────────────────────────────────────────
// hardware-iot (tech-hardware) — 단계별 flat
// ─────────────────────────────────────────────────────────────
const HARDWARE_IOT_STAGE_VENDORS: Record<string, ClusterVendor[]> = {
  "hardware-prototype": [
    { name: "KiCad", category: "PCB 설계 EDA", descKo: "완전 무료·오픈소스 PCB 설계 툴. 비용 0원으로 양산급 설계까지 가능해 초기 스타트업의 첫 선택지.", href: "https://www.kicad.org", pricing: "무료 (오픈소스)", tier: "essential", tags: ["EDA", "무료", "오픈소스"] },
    { name: "EasyEDA", category: "PCB 설계 EDA", descKo: "브라우저 기반 무료 EDA. JLCPCB·LCSC와 원클릭 연동돼 설계→발주가 가장 빠른 워크플로.", href: "https://easyeda.com", pricing: "무료", tier: "recommended", tags: ["EDA", "클라우드", "JLCPCB연동"] },
    { name: "Altium Designer / Develop", category: "PCB 설계 EDA", descKo: "업계 표준 상용 EDA. 투자 유치 후 복잡한 고밀도 보드·팀 협업이 필요할 때. Develop은 입문용 저가 라인.", href: "https://www.altium.com", pricing: "유료 (Develop ~$995/년, Designer ~$7,000/년)", tier: "optional", tags: ["EDA", "상용", "고급"] },
    { name: "Cadence OrCAD X", category: "PCB 설계 EDA", descKo: "스키매틱·시뮬레이션·레이아웃·공급망 통합 상용 플랫폼. 고속·아날로그 정밀 설계가 핵심일 때.", href: "https://www.cadence.com/en_US/home/tools/pcb-design-and-analysis/orcad.html", pricing: "유료 (견적)", tier: "optional", tags: ["EDA", "상용", "고속설계"] },
    { name: "JLCPCB", category: "PCB 시제품·PCBA", descKo: "5장 $2부터 시작하는 초저가 중국 PCB·조립. EVT 단계 빠른 반복에 최적, 신규가입 쿠폰 제공.", href: "https://jlcpcb.com", pricing: "유료 (PCB 5장 $2~)", tier: "essential", tags: ["PCB제작", "PCBA", "저가"] },
    { name: "PCBWay", category: "PCB 시제품·PCBA", descKo: "PCB+조립+CNC·3D프린팅까지 원스톱. JLCPCB 대비 소량·복잡 보드와 영문 지원에서 강점.", href: "https://www.pcbway.com", pricing: "유료 (견적)", tier: "recommended", tags: ["PCB제작", "PCBA", "원스톱"] },
    { name: "Seeed Fusion", category: "PCB·PCBA·소량양산", descKo: "선전 기반 PCB·턴키 조립. OPL 1만+ 부품으로 PCBA 7일 납기, 시제품→소량양산 연결에 유리.", href: "https://www.seeedstudio.com/fusion.html", pricing: "유료 (견적)", tier: "recommended", tags: ["PCBA", "턴키", "소량양산"] },
    { name: "제조전문형 메이커스페이스 (창업진흥원/중기부)", category: "3D프린팅·하우징 (국내 지원)", descKo: "정부지원 시제품 제작터. 3D프린터·레이저커터 무료/저가 사용 + 2026년부터 초도양산·인증까지 지원.", href: "https://www.kised.or.kr", pricing: "무료~저가 (정부지원)", tier: "essential", tags: ["3D프린팅", "정부지원", "국내"] },
    { name: "캐파 (CAPA)", category: "3D프린팅·CNC 견적 매칭 (국내)", descKo: "국내 제조 견적 매칭 플랫폼. 3D프린팅·CNC·사출·판금 업체에 한 번에 견적 요청, 하우징 시제품 소싱에 유용.", href: "https://capa.ai", pricing: "무료 (견적은 업체별)", tier: "recommended", tags: ["3D프린팅", "CNC", "국내", "매칭"] },
    { name: "Protolabs", category: "3D프린팅·CNC·사출 (글로벌)", descKo: "디지털 즉시견적 정밀 가공. 양산급 소재·정밀 하우징을 빠르게 받아야 하는 DVT 단계용.", href: "https://www.protolabs.com", pricing: "유료 (즉시견적, 고가)", tier: "optional", tags: ["3D프린팅", "CNC", "글로벌"] },
    { name: "누비콤 (계측기 렌탈)", category: "측정장비 렌탈 (국내)", descKo: "오실로스코프·스펙트럼분석기 등 단기 임대. 고가 장비 구매 없이 EVT/DVT 측정만 짧게 빌릴 때.", href: "https://www.nubicom.co.kr", pricing: "유료 (일/월 렌탈)", tier: "optional", tags: ["계측장비", "렌탈", "국내"] },
  ],
  "bom-supply-chain": [
    { name: "LCSC", category: "글로벌 부품 (저가)", descKo: "중국 대형 부품 유통사. JLCPCB와 연동돼 PCBA 부품 단가가 가장 저렴, 시제품·소량 BOM 비용 절감.", href: "https://www.lcsc.com", pricing: "유료 (최저가권)", tier: "essential", tags: ["부품", "저가", "JLCPCB연동"] },
    { name: "DigiKey", category: "글로벌 부품 (정품)", descKo: "100만+ 정품 부품 즉시출고. 데이터시트·재고 신뢰도 최고, 인증·양산 BOM의 표준 소싱처.", href: "https://www.digikey.com", pricing: "유료 (정가, 한국 배송)", tier: "essential", tags: ["부품", "정품", "글로벌"] },
    { name: "Mouser", category: "글로벌 부품 (정품)", descKo: "1,200+ 브랜드 공인 유통사. 신제품·반도체 라인업이 강해 DigiKey와 교차소싱으로 단종 리스크 분산.", href: "https://www.mouser.com", pricing: "유료 (정가, 한국 배송)", tier: "recommended", tags: ["부품", "정품", "반도체"] },
    { name: "Arrow Electronics", category: "글로벌 부품 (대량/계약)", descKo: "대형 공인 유통사. 양산 물량·장기 공급계약과 부품 단가 협상이 필요한 PVT 이후 단계에 적합.", href: "https://www.arrow.com", pricing: "유료 (대량/계약)", tier: "optional", tags: ["부품", "양산", "글로벌"] },
    { name: "디바이스마트", category: "국내 부품상", descKo: "국내 최대 부품·개발보드 몰. 빠른 국내배송으로 EVT 단계 즉시 조달, 아두이노·센서·모듈 풍부.", href: "https://www.devicemart.co.kr", pricing: "유료 (국내 당일/익일)", tier: "essential", tags: ["부품", "국내", "개발보드"] },
    { name: "엘레파츠", category: "국내 부품상", descKo: "반도체·계측기·공구까지 폭넓은 국내 몰. 디바이스마트에 없는 품목 보완 소싱처로 자주 병행 사용.", href: "https://www.eleparts.co.kr", pricing: "유료 (국내배송)", tier: "recommended", tags: ["부품", "국내"] },
    { name: "아이씨뱅큐 (IC뱅큐)", category: "국내 부품상", descKo: "오픈소스 HW·반도체 특화 국내 몰. 라즈베리파이·MCU·LCD 등 희귀 품목 확보에 강함.", href: "https://www.icbanq.com", pricing: "유료 (국내배송)", tier: "recommended", tags: ["부품", "국내", "오픈소스HW"] },
    { name: "Octopart", category: "부품 검색·단종/대체 (글로벌)", descKo: "200+ 유통사 실시간 재고·단가 통합검색. 단종 위험 플래그·대체부품 추천으로 BOM 리스크 관리.", href: "https://octopart.com", pricing: "무료", tier: "essential", tags: ["검색", "단종관리", "무료"] },
    { name: "FindChips", category: "부품 검색·가격 비교 (글로벌)", descKo: "DigiKey·Mouser·Arrow 등 유통사 가격·재고·수명상태 비교. 최저가/대체부품 동시 확인.", href: "https://www.findchips.com", pricing: "무료", tier: "recommended", tags: ["검색", "가격비교", "무료"] },
    { name: "OpenBOM", category: "BOM 관리툴", descKo: "클라우드 BOM·구매·재고 관리. Altium·Octopart 연동, EDA에 종속되지 않는 협업 BOM이 필요할 때.", href: "https://www.openbom.com", pricing: "프리미엄 (무료 티어 + 유료)", tier: "recommended", tags: ["BOM", "클라우드"] },
    { name: "Altium 365", category: "BOM 관리툴", descKo: "Altium 사용자용 클라우드 BOM 포털. Octopart·SiliconExpert로 수명·컴플라이언스까지 통합 관리.", href: "https://www.altium.com/altium-365", pricing: "유료 (Altium 구독 포함)", tier: "optional", tags: ["BOM", "Altium연동"] },
  ],
  "certification-kc-ce": [
    { name: "국립전파연구원 (RRA)", category: "한국 전파인증 주관기관", descKo: "전자파·무선 KC(적합성평가) 등록·인증을 관장하는 정부기관. 무선기기 출시 전 반드시 거치는 관문.", href: "https://www.rra.go.kr", pricing: "유료 (수수료)", tier: "essential", tags: ["KC", "전파인증", "정부"] },
    { name: "KTL (한국산업기술시험원)", category: "KC 안전·EMC 시험인증", descKo: "공인 시험·인증기관. KC 안전·전자파 시험과 공장심사를 한 곳에서 처리, 종합 시험 수요에 적합.", href: "https://www.ktl.re.kr", pricing: "유료 (시험비)", tier: "essential", tags: ["KC", "EMC", "시험기관"] },
    { name: "KTC (한국기계전기전자시험연구원)", category: "무선·RF 시험인증", descKo: "KOLAS 공인 무선통신 종합시험센터. BLE·WiFi·LTE 등 RF 기기 KC 인증의 핵심 시험소.", href: "https://www.ktc.re.kr", pricing: "유료 (시험비)", tier: "recommended", tags: ["KC", "RF", "무선"] },
    { name: "KTR (한국화학융합시험연구원)", category: "KC·KS 시험인증", descKo: "공인 시험·인증기관. 안전·EMC·KS 인증 및 공장심사 대행, KTL 대비 처리속도/품목별 강점 비교 선택.", href: "https://www.ktr.or.kr", pricing: "유료 (시험비)", tier: "recommended", tags: ["KC", "KS", "시험기관"] },
    { name: "UL Solutions", category: "글로벌 인증 (UL/북미)", descKo: "북미 안전 표준 인증의 대명사. 미국·캐나다 진출 제품의 UL 마크 취득에 사실상 필수.", href: "https://www.ul.com", pricing: "유료 (견적)", tier: "recommended", tags: ["UL", "북미"] },
    { name: "TÜV Rheinland", category: "글로벌 인증 (CE/유럽)", descKo: "유럽 CE·국제 인증 노티파이드 바디. EU 수출용 CE·안전 인증을 한국 지사에서 진행 가능.", href: "https://www.tuv.com", pricing: "유료 (견적)", tier: "recommended", tags: ["CE", "유럽"] },
    { name: "SGS", category: "글로벌 인증·시험 (다국가)", descKo: "세계 최대 시험·인증사. CE·FCC·다국가 인증을 한 창구에서 묶어 처리, 여러 시장 동시 진출 시 효율적.", href: "https://www.sgs.com", pricing: "유료 (견적)", tier: "optional", tags: ["CE", "FCC", "다국가"] },
    { name: "Element Korea (인증 대행)", category: "인증 컨설팅·대행", descKo: "KC·CE·FCC 등 인증 조회·절차·비용을 안내하는 시험·인증 대행. 첫 인증이라 절차가 막막할 때 컨설팅.", href: "https://elementkorea.kr", pricing: "유료 (대행 수수료)", tier: "optional", tags: ["인증대행", "컨설팅"] },
  ],
  "manufacturing-partner": [
    { name: "Seeed Studio (Fusion)", category: "해외 EMS (선전, 소량양산)", descKo: "선전 민첩제조 자원 기반 턴키 양산. 시제품에서 이어 소량~중량 양산으로 자연스럽게 스케일업.", href: "https://www.seeedstudio.com/fusion.html", pricing: "유료 (견적)", tier: "essential", tags: ["EMS", "선전", "소량양산"] },
    { name: "PCBWay (양산)", category: "해외 EMS (PCBA 양산)", descKo: "PCB·PCBA·조립·기구까지 원스톱 양산. 시제품 데이터 그대로 양산 이관이 가능해 전환 마찰이 적음.", href: "https://www.pcbway.com", pricing: "유료 (견적)", tier: "recommended", tags: ["EMS", "PCBA", "원스톱"] },
    { name: "MacroFab", category: "해외 EMS (북미, 클라우드 제조)", descKo: "온라인 견적·미국 제조 네트워크 EMS. 미국 공급망/관세 이슈가 있거나 북미 양산이 필요할 때.", href: "https://www.macrofab.com", pricing: "유료 (온라인 즉시견적)", tier: "optional", tags: ["EMS", "북미"] },
    { name: "캐파 (CAPA)", category: "국내 양산·금형 매칭", descKo: "국내 제조사 매칭 플랫폼. 사출·금형·판금·CNC·전자회로 업체에 견적 요청, 국내 양산 파트너 발굴 창구.", href: "https://capa.ai", pricing: "무료 (견적은 업체별)", tier: "essential", tags: ["금형", "국내", "매칭"] },
    { name: "제조전문형 메이커스페이스 (중기부)", category: "국내 초도양산 지원", descKo: "2026년 신설. 양산 설계·공정·원가·양산성 평가를 전문기업과 함께 수행, 초도양산까지 정부지원.", href: "https://www.kised.or.kr", pricing: "무료~저가 (정부지원)", tier: "recommended", tags: ["초도양산", "정부지원", "국내"] },
    { name: "JLCPCB (양산 PCBA)", category: "해외 PCBA 양산", descKo: "저가 대량 PCBA. 보드 중심 제품의 양산 단가를 가장 낮추는 옵션, 기구는 별도 파트너와 병행.", href: "https://jlcpcb.com", pricing: "유료 (대량 저가)", tier: "recommended", tags: ["PCBA", "양산", "저가"] },
  ],
};

// ─────────────────────────────────────────────────────────────
// tech-deeptech-lab — robotics-physical-ai + biotech-medtech
// ─────────────────────────────────────────────────────────────
const DEEPTECH_LAB_VENDORS: Record<string, { robotics: ClusterVendor[]; biotech: ClusterVendor[] }> = {
  "lab-setup": {
    robotics: [
      { name: "ROS 2 (Open Robotics / OSRA)", category: "로봇 미들웨어", descKo: "로봇 SW의 사실상 표준 미들웨어 — 랩 시작 시 가장 먼저 채택. 2026 LTS는 Jazzy/Kilted.", href: "https://docs.ros.org", pricing: "오픈소스 무료", tier: "essential", tags: ["오픈소스", "미들웨어", "표준"] },
      { name: "NVIDIA Isaac Sim 5.0 / Isaac Lab", category: "시뮬레이션·합성데이터", descKo: "디지털트윈·합성 인식데이터·RL 학습용 GPU 가속 시뮬레이터. 비전·강화학습 정책 학습이 필요할 때.", href: "https://developer.nvidia.com/isaac/sim", pricing: "무료(개발자), GPU 필요", tier: "recommended", tags: ["시뮬레이션", "RL", "GPU"] },
      { name: "Gazebo / MuJoCo", category: "시뮬레이션", descKo: "ROS2 네이티브 SLAM·내비게이션은 Gazebo, 조작·VLA 평가·연구는 MuJoCo(완전 오픈소스). 저비용 기본기.", href: "https://gazebosim.org", pricing: "오픈소스 무료", tier: "recommended", tags: ["오픈소스", "시뮬레이션"] },
      { name: "ROBOTIS DYNAMIXEL (로보티즈)", category: "스마트 액추에이터·모터", descKo: "모터+드라이버+센서+감속기 일체형 국산 스마트 액추에이터. 로봇암·휴머노이드·그리퍼 구동부 표준, 국내 조달·AS 유리.", href: "https://www.robotis.com", pricing: "모듈당 수만~수십만원", tier: "essential", tags: ["국산", "액추에이터", "모터"] },
      { name: "maxon (정밀 DC/BLDC 모터)", category: "고정밀 모터", descKo: "고토크·고정밀이 필요한 의료·정밀 메카트로닉스 구동부. 비용 높아 정밀도 핵심 축에만 선택 적용.", href: "https://www.maxongroup.com", pricing: "고가(축당 수십만~수백만원)", tier: "optional", tags: ["정밀", "수입"] },
      { name: "NVIDIA Jetson (Orin / Thor)", category: "온보드 컴퓨트", descKo: "로봇 탑재 엣지 AI 컴퓨트 — 추론·비전은 Orin, 휴머노이드/피지컬AI 대규모 모델은 Thor. Isaac 스택 호환.", href: "https://developer.nvidia.com/embedded-computing", pricing: "Orin 수십만원대, Thor 고가", tier: "essential", tags: ["엣지AI", "컴퓨트", "GPU"] },
      { name: "협동로봇 (두산로보틱스 / 레인보우로보틱스 / UR)", category: "협동로봇(코봇) 하드웨어", descKo: "조작·매니퓰레이션 연구의 베이스 플랫폼. 국산 우선이면 두산·레인보우, 생태계·레퍼런스면 UR.", href: "https://www.doosanrobotics.com", pricing: "암당 수천만원", tier: "recommended", tags: ["코봇", "국산옵션"] },
    ],
    biotech: [
      { name: "Thermo Fisher Scientific", category: "실험장비·시약·소모품", descKo: "장비·시약·소모품 원스톱 글로벌 공급. 랩 셋업 기본 채널, 한국 법인/대리점으로 조달.", href: "https://www.thermofisher.com/kr", pricing: "품목별 견적", tier: "essential", tags: ["시약", "장비", "글로벌"] },
      { name: "Merck / Sigma-Aldrich", category: "시약·화학물질", descKo: "Sigma-Aldrich 시약·화학물질 표준 공급원. 분자생물·세포 실험 시약 조달 시.", href: "https://www.sigmaaldrich.com", pricing: "품목별", tier: "essential", tags: ["시약", "화학", "글로벌"] },
      { name: "KBSI 연구장비 공동활용 (ZEUS/NFEC)", category: "공용 연구장비 (정부)", descKo: "고가 분석장비를 자가구매 대신 예약·공동활용 — 초기 자본 절감의 핵심. ZEUS 포털에서 전국 출연연·대학 장비 검색·예약.", href: "https://use.kbsi.re.kr", pricing: "건당 사용료(저가), 국가시설", tier: "essential", tags: ["정부지원", "공용장비", "비용절감"] },
      { name: "Benchling (ELN / LIMS)", category: "랩 데이터·전자노트", descKo: "분자생물 편집기·시료추적·ELN 통합 클라우드. 데이터 무결성·규제 대비 시. 학술 무료 티어 존재.", href: "https://www.benchling.com", pricing: "학술 무료 / 상용 연 $15k~", tier: "recommended", tags: ["ELN", "데이터무결성"] },
      { name: "클린벤치·CO2 인큐베이터·BSC (Thermo/Esco/Eppendorf)", category: "세포배양 핵심 장비", descKo: "세포·미생물 배양 랩의 필수 하드웨어. BSL 등급에 맞춘 캐비닛 선정 필수, 국내 대리점 조달.", href: "https://www.escolifesciences.com", pricing: "대당 수백만~수천만원", tier: "essential", tags: ["세포배양", "장비"] },
    ],
  },
  "prototype-iteration": {
    robotics: [
      { name: "NVIDIA Isaac Lab / Lab-Arena", category: "Sim2Real·정책 학습/평가", descKo: "시뮬→실물(Sim2Real) 정책 학습·대규모 평가 프레임워크. GR00T 등 정책 학습 반복 시. CES 2026 오픈소스 공개.", href: "https://developer.nvidia.com/isaac/lab", pricing: "무료(오픈소스), GPU 필요", tier: "recommended", tags: ["Sim2Real", "RL", "평가"] },
      { name: "LeRobot (Hugging Face)", category: "로봇 데이터·모델 허브", descKo: "실물 로봇 데이터 수집·VLA 정책 학습 오픈 생태계 — Isaac Lab-Arena·GR00T 통합. 데이터셋·사전학습 모델 활용 시.", href: "https://huggingface.co/lerobot", pricing: "오픈소스 무료", tier: "recommended", tags: ["데이터수집", "VLA", "오픈소스"] },
      { name: "DYNAMIXEL SDK / ros2_control", category: "모션 SDK·제어", descKo: "액추에이터 저수준 제어·모션 구현 SDK. 하드웨어 구동부와 ROS2 제어 스택 연결 시.", href: "https://emanual.robotis.com/docs/en/software/dynamixel/dynamixel_sdk/overview/", pricing: "오픈소스 무료", tier: "essential", tags: ["SDK", "모션제어"] },
      { name: "캐파 (CAPA, 에이팀벤처스)", category: "국내 온디맨드 가공·3D프린팅", descKo: "CNC·3D프린팅·사출·판금 등 도면 업로드→국내 2,700+ 제조사 견적. 부품·시제품 빠른 국내 제작 시.", href: "https://capa.ai", pricing: "건당 견적(소량 저비용)", tier: "essential", tags: ["국산", "3D프린팅", "가공"] },
      { name: "Protolabs / Xometry", category: "글로벌 온디맨드 제조", descKo: "정밀 CNC·금속 3D프린팅·사출 고품질 시제품 — Protolabs 자체생산, Xometry 마켓플레이스. 고정밀·해외 양산 검토 시.", href: "https://www.protolabs.com", pricing: "건당 견적(중~고)", tier: "optional", tags: ["수입", "정밀가공"] },
    ],
    biotech: [
      { name: "어세이 개발 (Benchling + 자체 최적화)", category: "어세이 개발 워크플로", descKo: "타깃 검증용 in-house 어세이 설계·최적화 단계. 프로토콜·버전관리는 ELN로, 반복 최적화를 데이터로 관리.", href: "https://www.benchling.com", pricing: "ELN 비용에 포함", tier: "essential", tags: ["어세이", "프로토콜"] },
      { name: "켐온 / 바이오톡스텍 (국내 비임상 CRO)", category: "비임상(전임상) 위탁", descKo: "독성·안전성·효능 등 비임상 시험 국내 위탁. 국산 GLP CRO로 비용·소통 유리.", href: "https://www.biotoxtech.com", pricing: "시험항목별 견적", tier: "essential", tags: ["국산CRO", "비임상", "GLP"] },
      { name: "디티앤씨알오 (DT&CRO)", category: "통합 CRO(비임상+임상)", descKo: "효능·안전성·분석을 아우르는 풀서비스 국내 CRO. 비임상→임상 연속 위탁 원할 때.", href: "https://www.dtncro.com", pricing: "프로젝트별 견적", tier: "recommended", tags: ["국산CRO", "풀서비스"] },
      { name: "Charles River Laboratories", category: "글로벌 전임상 CRO", descKo: "글로벌 표준 전임상·독성·DMPK. 해외 인허가(FDA/EMA) 대비 데이터 신뢰성이 필요할 때.", href: "https://www.criver.com", pricing: "고가, 견적", tier: "optional", tags: ["글로벌CRO", "전임상"] },
      { name: "Eurofins (분석·바이오애널리시스)", category: "분석 서비스", descKo: "복합·특수 분석 및 바이오애널리시스 위탁. 자체 불가한 정량·정성 분석 외주 시.", href: "https://www.eurofins.com", pricing: "항목별 견적", tier: "recommended", tags: ["분석", "글로벌"] },
    ],
  },
  "field-or-clinical-test": {
    robotics: [
      { name: "규제 샌드박스 — 실증특례 (KIAT/ICT)", category: "실증·규제특례", descKo: "현행 규제 일부 면제하에 제한된 조건으로 시장 실증. 현행법상 출시 불가한 신규 로봇 서비스 실증 시 신청.", href: "https://www.sandbox.or.kr", pricing: "정부제도(무료 신청)", tier: "essential", tags: ["정부지원", "규제특례", "실증"] },
      { name: "로봇규제혁신지원센터 (KIRIA)", category: "필드 실증 지원", descKo: "한국로봇산업진흥원의 실증사업·규제 신속확인 연계. 필드 테스트 부지·규제검토 지원이 필요할 때.", href: "https://www.kiria.org", pricing: "정부지원사업", tier: "recommended", tags: ["정부지원", "실증", "KIRIA"] },
      { name: "기능안전 (ISO 13849 / IEC 61508 / ISO 10218-1)", category: "기능안전 설계·검증", descKo: "제어시스템 안전부품·기능안전 적합성 확보(산업용 로봇 ISO 10218-1). 필드 투입 전 위험성 평가·안전설계 단계.", href: "https://www.iso.org", pricing: "표준(설계 내재화)", tier: "essential", tags: ["기능안전", "ISO", "표준"] },
      { name: "TÜV Rheinland Korea", category: "안전 시험·사전심사", descKo: "로봇 기능안전·전기안전 사전 시험 및 글로벌 인증 컨설팅. 인증 전 갭 분석·시험이 필요할 때.", href: "https://www.tuv.com/korea", pricing: "시험·심사 견적", tier: "recommended", tags: ["시험인증", "안전"] },
    ],
    biotech: [
      { name: "식약처 IND (임상시험계획 승인)", category: "임상 진입 규제", descKo: "사람 대상 임상 개시 전 식약처 IND 승인 필수. 비임상 완료 후 1상 진입 직전 단계.", href: "https://www.mfds.go.kr", pricing: "정부 수수료", tier: "essential", tags: ["식약처", "IND", "규제"] },
      { name: "LSK Global PS (임상 CRO)", category: "임상시험수탁(CRO)", descKo: "KoNECT 혁신형 CRO 인증 국산 임상 CRO. 1~3상 운영·IND/NDA 전략 위탁 시.", href: "https://www.lskglobal.com", pricing: "프로젝트별 견적", tier: "essential", tags: ["국산CRO", "임상", "혁신형인증"] },
      { name: "GLP / GMP 시험·생산 체계", category: "품질·생산 규정 준수", descKo: "비임상은 GLP, 임상시료·시판은 GMP 준수 필수. 임상시료 생산 시 GMP CDMO 연계.", href: "https://www.mfds.go.kr", pricing: "체계 구축·심사 비용", tier: "essential", tags: ["GLP", "GMP", "품질"] },
      { name: "IRB (임상시험심사위원회)", category: "윤리·피험자 보호 심사", descKo: "각 임상시험실시기관 IRB 승인 필수. 환자 모집 전 프로토콜 윤리 심사 단계.", href: "https://www.konect.or.kr", pricing: "심사 수수료", tier: "essential", tags: ["IRB", "윤리심사"] },
      { name: "임상시료 CDMO (프레스티지바이오로직스 등)", category: "임상시료 위탁생산(CDMO)", descKo: "임상용 바이오의약품 시료 GMP 위탁생산. 자체 GMP 시설 없이 임상시료가 필요할 때.", href: "https://www.prestigebiologics.com", pricing: "배치별 견적", tier: "recommended", tags: ["CDMO", "GMP", "국산"] },
    ],
  },
  "regulatory-submission": {
    robotics: [
      { name: "KC 인증 (전기·전자 안전)", category: "국가 강제인증", descKo: "국내 판매 전기·전자 제품의 강제 KC 인증. 로봇 제품 국내 출시 전 필수 적합성 확인.", href: "https://www.rra.go.kr", pricing: "시험·인증 수수료", tier: "essential", tags: ["KC", "강제인증", "안전"] },
      { name: "실외이동로봇 운행안전인증 (지능형로봇법)", category: "로봇 법정 인증", descKo: "지능형로봇법상 실외이동로봇의 보도 통행을 위한 법정 의무 인증. 자율주행 배달·순찰 로봇 출시 시 필수.", href: "https://cert.kiria.org", pricing: "인증 수수료", tier: "essential", tags: ["지능형로봇법", "법정인증", "KIRIA"] },
      { name: "한국로봇산업진흥원 인증평가 (KIRIA)", category: "로봇 안전·신뢰성 인증", descKo: "온라인인증평가시스템으로 ISO 10218/13849 등 표준 기반 로봇 안전·SW 신뢰성 평가. 안전인증 취득 창구.", href: "https://cert.kiria.org", pricing: "평가 수수료", tier: "recommended", tags: ["KIRIA", "안전인증"] },
      { name: "TÜV Rheinland / CE-MD", category: "해외 수출 인증", descKo: "EU 등 수출용 기계지침(CE)·기능안전 인증. 해외 시장 진출 계획 시.", href: "https://www.tuv.com/korea", pricing: "인증 견적", tier: "optional", tags: ["CE", "수출"] },
    ],
    biotech: [
      { name: "식약처(MFDS) 의료기기 품목허가", category: "국내 의료기기 인허가", descKo: "국내 의료기기 시판 전 품목허가(등급별). 혁신의료기기 통합심사로 허가-진입 동시 가능 트랙 활용.", href: "https://emedi.mfds.go.kr", pricing: "정부 수수료", tier: "essential", tags: ["식약처", "의료기기", "허가"] },
      { name: "의료기기 GMP", category: "제조품질 규정", descKo: "의료기기 제조·품질관리 GMP 적합인정 필수. 허가와 병행하는 제조소 품질 체계 구축.", href: "https://www.mfds.go.kr", pricing: "심사 비용", tier: "essential", tags: ["GMP", "품질"] },
      { name: "디지털의료기기(SaMD) 허가·심사", category: "SaMD 규제", descKo: "소프트웨어 의료기기·디지털치료기기 허가심사 가이드라인 적용. 앱·AI 진단 SW 시.", href: "https://emedi.mfds.go.kr", pricing: "정부 수수료", tier: "recommended", tags: ["SaMD", "디지털치료기기", "AI"] },
      { name: "FDA 510(k) / PMA", category: "미국 인허가", descKo: "미국 진출 시 Class II는 510(k) 시판전신고, 고위험 Class III는 PMA. 미국 시장 계획 시.", href: "https://www.fda.gov/medical-devices", pricing: "FDA 수수료+컨설팅", tier: "optional", tags: ["FDA", "미국", "수출"] },
      { name: "CE 마킹 (EU MDR/IVDR)", category: "유럽 인허가", descKo: "EU 진출 시 MDR/IVDR 적합성·인증기관(NB) 심사 필요. AI 포함 SaMD는 EU AI Act 준수. 유럽 시장 계획 시.", href: "https://health.ec.europa.eu/medical-devices-sector_en", pricing: "NB 심사+컨설팅(고가)", tier: "optional", tags: ["CE", "MDR", "EU"] },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// tech-extreme-deeptech — semiconductor + climate-energy
// (반도체: full 파운드리는 자본 장벽이 커 MPW가 현실적 진입로 — descKo에 명시)
// ─────────────────────────────────────────────────────────────
const DEEPTECH_EXTREME_VENDORS: Record<string, { semiconductor: ClusterVendor[]; climate: ClusterVendor[] }> = {
  "eda-tooling-setup": {
    semiconductor: [
      { name: "OpenLane / OpenROAD (LibreLane)", category: "오픈소스 EDA (RTL→GDSII)", descKo: "무료 RTL-to-GDSII 풀플로우. FOSSi재단 LibreLane이 사실상 후속 — 시드 이전 가장 현실적인 디지털 칩 시작점.", href: "https://github.com/The-OpenROAD-Project/OpenLane", pricing: "무료 (오픈소스)", tier: "essential", tags: ["오픈소스", "디지털", "무료진입"] },
      { name: "KLayout + Magic + Netgen + ngspice", category: "오픈소스 레이아웃·검증·SPICE", descKo: "레이아웃(KLayout/Magic)·LVS(Netgen)·SPICE(ngspice) 무료 조합. 아날로그/믹스드시그널은 이 스택 + Xschem이 표준.", href: "https://www.klayout.de", pricing: "무료 (오픈소스)", tier: "essential", tags: ["오픈소스", "아날로그", "검증"] },
      { name: "오픈 PDK (SKY130 / IHP SG13G2 / GF180MCU)", category: "오픈소스 공정 설계 키트", descKo: "무료 공개 PDK. 상용 PDK는 파운드리 NDA 필요 — 학습·프로토타입은 오픈PDK로.", href: "https://github.com/google/skywater-pdk", pricing: "무료 (오픈소스)", tier: "essential", tags: ["오픈소스", "PDK"] },
      { name: "IDEC 반도체설계교육센터 (KAIST)", category: "정부/대학 EDA 라이선스 (한국)", descKo: "산업부 지원 KAIST IDEC. 학생·연구실에 상용 EDA 약 4,000카피 + 삼성 28nm 등 MPW 연계 — 한국 학계·예비창업의 핵심 진입로.", href: "https://www.idec.or.kr", pricing: "교육/연구 무료~저비용", tier: "recommended", tags: ["한국", "정부지원", "대학"] },
      { name: "Cadence / Synopsys / Siemens EDA", category: "상용 EDA (3대 벤더)", descKo: "양산·선단공정엔 필수지만 라이선스 매우 고가. AWS·Azure·Synopsys Cloud로 임대 가능.", href: "https://www.cadence.com", pricing: "고가, 임대/영구 (견적)", tier: "recommended", tags: ["상용", "선단공정", "클라우드"] },
    ],
    climate: [
      { name: "PVsyst v8", category: "태양광 시뮬레이션", descKo: "그리드 연계 태양광 설계·성능예측 업계 표준. 발전량 산정 정확도 최상위 — 태양광 사업 제안·금융조달의 기본 산출물.", href: "https://www.pvsyst.com", pricing: "유료 라이선스 (무료체험)", tier: "essential", tags: ["태양광", "발전량예측"] },
      { name: "HOMER (UL Solutions)", category: "마이크로그리드 모델링", descKo: "하이브리드/마이크로그리드 경제성·발전량 최적화 표준. 태양광+ESS+디젤 등 구성 LCOE 산정.", href: "https://www.homerenergy.com", pricing: "유료 (무료체험)", tier: "recommended", tags: ["마이크로그리드", "경제성"] },
      { name: "SimScale", category: "클라우드 CFD/FEA", descKo: "브라우저 기반 클라우드 CFD·열·구조해석. HPC 없이 풍력·냉각·유동 해석 — 초기 자본효율적.", href: "https://www.simscale.com", pricing: "프리미엄 (Community 무료)", tier: "recommended", tags: ["CFD", "클라우드", "무료티어"] },
      { name: "OpenFOAM", category: "오픈소스 CFD", descKo: "무료 오픈소스 전산유체. 풍력·연소·열유동 정밀 해석. 비용 0, 학습곡선 가파름.", href: "https://www.openfoam.com", pricing: "무료 (오픈소스)", tier: "optional", tags: ["오픈소스", "CFD"] },
      { name: "Ansys Fluent / COMSOL", category: "상용 멀티피직스/CFD", descKo: "정밀도·물리모델 업계 선도. 인증·투자용 정밀해석에 사용되나 고가 — 클라우드 버스트로 피크 대응.", href: "https://www.ansys.com", pricing: "고가 상용", tier: "optional", tags: ["상용", "정밀해석"] },
      { name: "Watershed / Persefoni / Sweep", category: "탄소회계 SW (GHG Protocol)", descKo: "Scope 1·2·3 탄소회계 플랫폼. GHG Protocol·PCAF 정합. 규모별 선택.", href: "https://watershed.com", pricing: "구독형 (규모별)", tier: "recommended", tags: ["탄소회계", "ESG", "GHG"] },
    ],
  },
  "mpw-or-pilot-tape-out": {
    semiconductor: [
      { name: "중기부 '모두의 챌린지 팹리스' MPW (2026)", category: "정부 MPW 지원 (한국)", descKo: "업력 10년 이내 팹리스 선발, 삼성·SK키파운드리·DB하이텍 MPW 우선 + 제작비 최대 2억(12인치)/1억(8인치) — 한국 팹리스 최우선 진입로.", href: "https://www.mss.go.kr", pricing: "정부지원 (최대 2억원)", tier: "essential", tags: ["한국", "정부지원", "MPW"] },
      { name: "IDEC MPW (KAIST)", category: "대학·정부 MPW 셔틀 (한국)", descKo: "연 약 160개 칩 제작 지원. 삼성 28nm FD-SOI 등 국내 공정 셔틀 — 학계·연구 단계 테이프아웃의 표준 경로.", href: "https://www.idec.or.kr", pricing: "교육/연구 보조", tier: "essential", tags: ["한국", "대학", "MPW"] },
      { name: "삼성 파운드리 MPW (SAFE)", category: "파운드리 MPW 셔틀", descKo: "삼성 SAFE 생태계 MPW. 다수 설계 1웨이퍼 공유 — 마스크 풀세트 대비 비용 대폭 절감.", href: "https://semiconductor.samsung.com/kr/foundry/manufacturing/mpw-service/", pricing: "셔틀 분담금 (공정별)", tier: "recommended", tags: ["파운드리", "MPW"] },
      { name: "Europractice (imec IC-Link)", category: "글로벌 MPW 셔틀", descKo: "TSMC 등 다공정 MPW 중개. mini@sic 초소형 설계 저가 셔틀 — 글로벌 선단공정 진입로.", href: "https://europractice-ic.com", pricing: "셔틀 분담금", tier: "recommended", tags: ["글로벌", "TSMC", "MPW"] },
      { name: "Tiny Tapeout", category: "초저가 교육용 MPW (오픈소스)", descKo: "최소 비용 실리콘 입문. IHP 등 대체 파운드리로 셔틀 지속 — 학습·검증용 초소형 타일 단위 진입.", href: "https://tinytapeout.com", pricing: "타일 단위 저가", tier: "optional", tags: ["오픈소스", "교육", "초저가"] },
    ],
    climate: [
      { name: "산업부/KIAT 탄소중립·기후테크 실증 지원", category: "정부 실증 지원 (한국)", descKo: "산업부·KIAT 탄소중립 사업화/실증 연계. 실증단지·테스트베드 + 사업화 자금 — 파일럿 규모 실증의 핵심 경로.", href: "https://www.kiat.or.kr", pricing: "정부지원 (공모)", tier: "essential", tags: ["한국", "정부지원", "실증"] },
      { name: "2026 기후테크 스타트업 육성사업", category: "정부 사업화·실증 (한국)", descKo: "사업화 자금 + 기후테크 특화 액셀러레이팅·글로벌·투자/실증 연계. 초기 실증·PoC 자금원.", href: "https://www.bizinfo.go.kr", pricing: "정부지원", tier: "recommended", tags: ["한국", "정부지원", "사업화"] },
      { name: "지자체 유망기후테크 지원 (경기·경북 등)", category: "지자체 실증·기술지원", descKo: "지자체별 시험·분석·인증·컨설팅 + 소액 지원. 중앙 사업 보완 — 지역 거점 실증 시 병행.", href: "https://www.bizinfo.go.kr", pricing: "정부지원 (지자체별)", tier: "optional", tags: ["한국", "지자체", "실증"] },
    ],
  },
  "packaging-and-test": {
    semiconductor: [
      { name: "ASE Technology", category: "글로벌 OSAT 1위", descKo: "글로벌 OSAT 매출 1위. 첨단 패키징·FOWLP 대규모 투자 — 양산 패키징의 글로벌 기준점.", href: "https://www.aseglobal.com", pricing: "물량 기반 견적", tier: "recommended", tags: ["글로벌", "OSAT", "첨단패키징"] },
      { name: "Amkor Technology", category: "글로벌 OSAT (미국)", descKo: "미국 최대 패키징·테스트. 첨단 OSAT 풀라인업 — 글로벌 고객·미국 공급망 대응에 유리.", href: "https://amkor.com", pricing: "물량 기반 견적", tier: "recommended", tags: ["글로벌", "OSAT"] },
      { name: "네패스 (Nepes)", category: "국내 OSAT (WLP·팬아웃)", descKo: "국내 대표 OSAT. 웨이퍼레벨/팬아웃 패키징 강점 — 국내 소통·납기 유리.", href: "https://www.nepes.co.kr", pricing: "물량 기반 견적", tier: "recommended", tags: ["한국", "OSAT", "WLP"] },
      { name: "SFA반도체", category: "국내 OSAT (메모리·SiP)", descKo: "국내 OSAT. 메모리·SiP 조립·테스트 — 국내 소량 양산 패키징 협력처.", href: "https://www.sfasemicon.com", pricing: "물량 기반 견적", tier: "optional", tags: ["한국", "OSAT"] },
      { name: "하나마이크론", category: "국내 OSAT", descKo: "국내 OSAT 3사 중 하나. 패키징·테스트 — 국내 공급망 다변화 옵션.", href: "https://www.hanamicron.co.kr", pricing: "물량 기반 견적", tier: "optional", tags: ["한국", "OSAT"] },
    ],
    climate: [
      { name: "한국에너지공단 신재생에너지 KS 인증", category: "설비 인증 (한국, 필수)", descKo: "신재생에너지 설비 KS 인증. 공장·제품 심사 후 KS 마크 — 국내 시장 출시·정부사업 참여의 사실상 관문.", href: "https://www.knrec.or.kr", pricing: "인증 수수료", tier: "essential", tags: ["한국", "인증", "KS"] },
      { name: "KTL 한국산업기술시험원", category: "성능·신뢰성 시험인증 (한국)", descKo: "신재생에너지 KS 지정 시험기관. 성능·신뢰성·안전 시험 수행 — 인증 전 시험 데이터 확보의 핵심.", href: "https://customer.ktl.re.kr", pricing: "시험 항목별 수수료", tier: "essential", tags: ["한국", "시험", "신뢰성"] },
      { name: "한국에너지공단 고효율에너지기자재 인증", category: "효율 인증 (한국)", descKo: "에너지효율 관리·고효율 인증. 효율 등급·마크 — 공공조달·인센티브 연계에 유리.", href: "https://eep.energy.or.kr", pricing: "인증 수수료", tier: "recommended", tags: ["한국", "효율인증"] },
      { name: "출연연 시험기관 (KIER·KITECH·KERI)", category: "지정 시험·인증 (한국)", descKo: "에너지연·생산기술연·전기연 등 KS 지정 시험기관. KTL 외 대체·전문 시험 경로.", href: "https://www.kier.re.kr", pricing: "시험 항목별 수수료", tier: "optional", tags: ["한국", "출연연", "시험"] },
    ],
  },
  "partner-foundation-or-pilot-line": {
    semiconductor: [
      { name: "삼성 파운드리 (SAFE)", category: "선단공정 파운드리", descKo: "선단(GAA)·특화공정 양산. 양산 진입 시 막대한 NRE·MOQ 필요 — 시드 단계엔 MPW 후 단계적 접근이 현실적.", href: "https://semiconductor.samsung.com/kr/foundry/", pricing: "양산 NRE+웨이퍼 (고액)", tier: "recommended", tags: ["파운드리", "선단공정", "고자본"] },
      { name: "DB하이텍", category: "8인치 특화 파운드리 (한국)", descKo: "국내 8인치 아날로그·전력·센서 특화 파운드리. 중소 팹리스 접근성 상대적 양호 — 특화공정 소량~중량 양산 파트너.", href: "https://www.dbhitek.com", pricing: "양산 NRE+웨이퍼 (견적)", tier: "recommended", tags: ["한국", "8인치", "특화"] },
      { name: "SK키파운드리", category: "8인치 파운드리 (한국)", descKo: "국내 8인치 파운드리. 중기부 MPW 8인치 트랙 운영사 — 전력·디스플레이·센서 특화 양산.", href: "https://www.keyfoundry.com", pricing: "양산 NRE+웨이퍼 (견적)", tier: "recommended", tags: ["한국", "8인치"] },
      { name: "TSMC / GlobalFoundries", category: "글로벌 파운드리", descKo: "TSMC=선단공정 글로벌 1위, GF=특화·성숙공정. 신생 팹리스 직거래는 진입장벽 높음 — Europractice 등 중개 경유가 현실적.", href: "https://www.tsmc.com", pricing: "양산 NRE+웨이퍼 (고액)", tier: "optional", tags: ["글로벌", "파운드리", "고자본"] },
      { name: "중기부/IDEC 팹리스 지원사업", category: "팹리스 양산 지원 (한국)", descKo: "딥엑스·보스반도체 등 배출. MPW→양산 연계 + 자금 — 한국 팹리스 양산 전환의 공적 지원 통로.", href: "https://www.mss.go.kr", pricing: "정부지원 (공모)", tier: "recommended", tags: ["한국", "정부지원", "팹리스"] },
    ],
    climate: [
      { name: "직접 PPA / 제3자 PPA (K-RE100)", category: "전력거래·RE100 이행 (한국)", descKo: "직접 PPA(발전사-사용자 1:1)·제3자 PPA(한전 중개). K-RE100 핵심 — 재생에너지 조달·RE100 달성 경로.", href: "https://www.knrec.or.kr/biz/introduce/new_policy/intro_kre100.do", pricing: "전력 계약 (협상)", tier: "essential", tags: ["한국", "RE100", "PPA"] },
      { name: "녹색프리미엄 / REC 구매 (K-RE100)", category: "RE100 이행 수단 (한국)", descKo: "녹색프리미엄(한전)·REC 인증서 구매. PPA보다 진입 쉬운 RE100 초기 이행 옵션.", href: "https://www.knrec.or.kr", pricing: "프리미엄/REC 단가", tier: "recommended", tags: ["한국", "RE100", "REC"] },
      { name: "V.PPA (가상 전력구매계약)", category: "금융형 전력거래 (한국)", descKo: "물리적 전력 이동 없이 차액정산으로 RE100·헤지 — 대형 조달의 신흥 수단.", href: "https://www.knrec.or.kr", pricing: "차액정산 계약", tier: "optional", tags: ["한국", "RE100", "금융형"] },
      { name: "EPC / 양산 파트너 (건설·엔지니어링)", category: "양산·시공 파트너", descKo: "PPA 얼라이언스·EPC 시공사. 발전소·설비 양산·그리드 연계 시공 — 실증 후 스케일업 파트너.", href: "https://www.knrec.or.kr", pricing: "프로젝트 계약", tier: "recommended", tags: ["한국", "EPC", "양산"] },
    ],
  },
};

// sub-industry → vertical 매핑 (deeptech-lab / extreme-deeptech)
const VERTICAL_BY_SUB: Record<string, "robotics" | "biotech" | "semiconductor" | "climate"> = {
  "robotics-physical-ai": "robotics",
  "biotech-medtech": "biotech",
  "semiconductor": "semiconductor",
  "climate-energy": "climate",
};

/**
 * stageId + selectedIndustryId 로 해당 단계의 추천 공급사·도구를 반환.
 * hardware-iot는 단계별 단일 목록, deeptech는 세부업종(vertical)별 분기.
 */
export function getClusterStageVendors(stageId: string, subIndustryId?: string): ClusterVendor[] {
  if (HARDWARE_IOT_STAGE_VENDORS[stageId]) return HARDWARE_IOT_STAGE_VENDORS[stageId];

  const vertical = subIndustryId ? VERTICAL_BY_SUB[subIndustryId] : undefined;
  if (!vertical) return [];

  const lab = DEEPTECH_LAB_VENDORS[stageId];
  if (lab && (vertical === "robotics" || vertical === "biotech")) return lab[vertical];

  const ext = DEEPTECH_EXTREME_VENDORS[stageId];
  if (ext && (vertical === "semiconductor" || vertical === "climate")) return ext[vertical];

  return [];
}
