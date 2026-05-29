//
//  StageKeyActionRegistry.swift — 단계별 KEY ACTION 카피 (웹 SSOT 미러)
//
//  웹 SSOT:
//    apps/web/app/lib/components/stages/startup/StartupStageShell.tsx → StartupKeyActionHero
//    각 stage view 의 inline `keyAction: { title, detail }` props
//
//  사용:
//    let action = BUStageKeyActionRegistry.action(for: "target-customer-definition")
//
//  BUStageShell 이 자동으로 상단 미드나잇 그라디언트 카드로 노출.
//

import Foundation

public struct BUStageKeyAction: Sendable, Hashable {
    public let title: String
    public let detail: String

    public init(title: String, detail: String) {
        self.title = title
        self.detail = detail
    }
}

public enum BUStageKeyActionRegistry {

    public static func action(for stageId: String) -> BUStageKeyAction? {
        actions[stageId]
    }

    private static let actions: [String: BUStageKeyAction] = [
        // ── 온보딩 (1·2단계) ───────────────────────────────────────────────────
        "industry-selection": .init(
            title: "한 업종에 깊게 — 다중 선택은 분산만 키웁니다",
            detail: "한 업종을 고르면 입지·메뉴·인허가·세무까지 14단계 가이드가 자동 맞춤. 멀티 카테고리 분산보다 한 업종 집중이 첫 12개월 매출에 4배 효과."
        ),
        "startup-type": .init(
            title: "창업 형태가 모든 절차·세무·자금원을 결정합니다",
            detail: "프랜차이즈 · 자영업 · 스타트업 — 형태별로 인허가·자금·세무 경로가 완전히 다름. 한 번 선택하면 14단계 로드맵이 그 형태에 맞게 분기."
        ),
        "business-model": .init(
            title: "한 가지 운영 모델에 우선 락인 — 분산은 매출 후",
            detail: "홀·배달·하이브리드 중 하나로 락인. 한국 외식업은 75%+ 하이브리드지만 첫 3개월은 한 모델로 표준화 — 매출 안정 후 두 번째 채널 추가."
        ),

        // ── shared (오프라인·온라인 모두) ──────────────────────────────────────
        "target-customer-definition": .init(
            title: "타깃이 없는 가게는 평균값으로 회귀합니다",
            detail: "외식업 폐업 사유 1위(28%)는 '타깃 불명확 + 차별화 실패' — 한국외식산업연구원 2024. 페르소나 정의한 사장님 폐업률은 정의 안 한 사장님의 절반."
        ),
        "budget-setup": .init(
            title: "총 초기 자본의 30%는 운영 예비비로 — 1·2층 망함률을 가르는 한 줄",
            detail: "보증금·인테리어·집기·인허가 외에 6개월 운영비를 따로 떼어 놓아야 첫 매출까지 버틴다. 운영비 없이 시작한 가게의 1년 폐업률이 3배."
        ),
        "location-candidates": .init(
            title: "타깃이 실제로 다니는 동선에 가게가 있어야 합니다",
            detail: "유동인구 숫자보다 '내 타깃이 그 시간대에 다니는가' 가 핵심. 후보 3곳 이상 평일·주말·낮·밤 4회 직접 방문 — 임대 전에 끝내야 할 검증."
        ),
        "financial-review": .init(
            title: "Prime Cost 65% 룰 — 식자재 + 인건비 합이 65% 넘으면 영업이익 마이너스",
            detail: "한국 외식업 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. BEP 분석으로 일·월 손익분기점을 숫자로 못 박아야 가격·메뉴 결정의 기준선이 생긴다."
        ),
        "menu-design": .init(
            title: "시그니처 3-5개 + 사이드로 메뉴 락",
            detail: "Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. 33% 초과 메뉴는 영업이익 마이너스 — 한국외식산업연구원 2024."
        ),

        // ── 프랜차이즈 ────────────────────────────────────────────────────────
        "franchise-application": .init(
            title: "정보공개서·14일 숙려·가맹점 방문 — 이 3개가 가맹 성공의 90%",
            detail: "본사가 보여주는 매출 자료보다 정보공개서 + 실제 가맹점주 증언이 진짜 신호입니다. 가맹사업법이 14일 숙려기간을 의무화한 이유."
        ),

        // ── 오프라인 path ─────────────────────────────────────────────────────
        "permit-check": .init(
            title: "임대 전에 인허가 5종 가능 여부부터 — 계약 후 인허가 거부는 보증금 손실",
            detail: "건축물대장 용도 · 통신판매 · 위생교육 · 면허 · 소방완비. 5종 중 하나라도 그 건물에서 불가하면 계약 자체가 사고. 5분 사전 점검이 6개월 손해를 막는다."
        ),
        "contract-review": .init(
            title: "확정일자 + 권리금·갱신 조항 — 임대 계약 전에 확인할 5가지",
            detail: "건물 용도 · 설비/환기/전기 · 갱신/권리금 · 정화조 (음식·카페) · 확정일자 보증금 보호. 음식 영업은 정화조 용량이 신고 가능 여부를 결정 — 계약 후 확인은 늦다."
        ),
        "construction-setup": .init(
            title: "공사 중에 소방필증·보건증 병행 신청 — 시공 후엔 영업까지 14일 더 걸린다",
            detail: "인테리어 컨셉 → 견적 2곳 비교 → 설계 확정 → 시공 → 최종 점검. 소방·보건은 공사 시작 시점에 동시 신청해야 오픈 일정이 안 밀린다."
        ),
        "vendor-setup": .init(
            title: "공급처·장비·POS — 운영 인프라 3종을 동시에 락인",
            detail: "원자재 공급처는 최소 2곳 확보(단일 공급 사고 대비). 장비 구매 vs 렌탈 결정 시 5년 TCO 비교. POS 는 결제 + 매출관리 + 인보이스까지 통합 가능 모델 선택."
        ),
        "registration-setup": .init(
            title: "사업자등록 + 인허가 — 영업 시작 전 반드시 끝낼 두 가지",
            detail: "임대차계약 직후 가장 먼저 해야 할 단계. 사업자등록만 있으면 영업이 가능한 업종도 있지만, 음식·미용·헬스 등은 별도 인허가 없이는 단 하루도 영업 불가합니다."
        ),
        "insurance-tax-setup": .init(
            title: "첫 직원 채용 시 4가지 의무 — 근로계약서 즉시 + 4대보험 14일 + 원천세 매월",
            detail: "직원 1명만 채용해도 4가지 의무 자동 발생: ① 근로계약서 (미체결 500만 과태료) + ② 4대보험 14일 이내 + ③ 원천세 매월 10일 + ④ 급여 시스템. 5인 미만 예외 X. 두루누리 80% 지원 가능."
        ),
        "hiring-setup": .init(
            title: "필요 인원·근로계약서 — 채용 전 결정, 채용 즉시 교부",
            detail: "직원 1명만 채용해도 근로계약서 즉시 작성·교부 의무 (미체결 500만원 과태료). 알바·정규직 구분, 시급·주휴수당 계산 방식 미리 명시."
        ),
        "operations-setup": .init(
            title: "POS + 카드결제 + SNS · 네이버 플레이스 — 개업 15일 전 모두 라이브",
            detail: "POS 실거래 테스트, 카드 가맹점 등록(1주), 네이버 플레이스·인스타·카카오 채널, 매장 50㎡+ 배경음악 저작권. 출시 당일 작동 안 하면 첫 손님이 안 돌아온다."
        ),
        "pre-launch": .init(
            title: "소프트 오픈 → 피드백 수집 → 본오픈 마케팅 — 1주 안에 끝",
            detail: "초청 손님 30-50명으로 소프트 오픈 → 당일 운영 체크리스트(POS·식자재·동선) → 맛·서비스·가격·분위기 피드백 → 본오픈 직전 SNS 1주 강하게."
        ),

        // ── 온라인/디지털 path ────────────────────────────────────────────────
        "platform-setup": .init(
            title: "1개 플랫폼에 우선 집중 — 멀티는 매출 1억 이후",
            detail: "스마트스토어 · 쿠팡 · 자체몰 — 수수료·트래픽·정산 구조가 모두 다름. 첫 6개월은 한 곳에 집중해서 리뷰·랭킹을 쌓아야 두 번째 채널로 확장 시 시너지가 난다."
        ),
        "online-registration": .init(
            title: "사업자등록 + 통신판매업 + 에스크로 — 3종 모두 통신판매업 신고 전 필요",
            detail: "사업자등록 → 사업용 통장·구매안전서비스(에스크로) 가입 → 지자체 통신판매업 신고 순서. 에스크로 없이 통신판매업 신고는 불가."
        ),
        "sourcing-setup": .init(
            title: "KC 인증·상표권 — 소싱 전 확인, 소싱 후엔 늦습니다",
            detail: "전자제품·아동용품은 KC 인증 필수, 미인증 판매는 즉시 게시중지·과태료. 상표권 검색은 키프리스(KIPRIS)에서 무료, 5분이면 미리 충돌 피한다."
        ),
        "store-setup": .init(
            title: "상세페이지·배송·반품 정책 — 첫 100주문 전에 모두 라이브",
            detail: "카테고리·배너·반품 정책 + 택배사 연동 + (자체몰) PG 연동 + CS 채널(카톡·톡톡) + 포장재 풀세트 실제 워크플로 테스트. 첫 주문 와서 막히면 리뷰가 망가진다."
        ),
        "online-marketing": .init(
            title: "SEO + 첫 광고 + 초기 리뷰 — 노출·전환·신뢰 3축을 동시에",
            detail: "네이버 쇼핑 상품명·태그 최적화로 무료 노출, 첫 광고 캠페인은 ROAS 200% 목표로 작게 시작, 초기 리뷰는 지인·체험단·낮은 가격 신규 할인 3종 병행."
        ),

        // ── 스타트업 path ─────────────────────────────────────────────────────
        "startup-foundation": .init(
            title: "먼저 만들고, 법인은 나중에",
            detail: "지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다. 문제 정의 → 팀 구성 → 법인 설립 순서로 진행하세요."
        ),
        "customer-discovery": .init(
            title: "코드 한 줄 전에, 10명과 대화하세요",
            detail: "스타트업의 42%는 \"시장이 원하지 않는 제품\"을 만들어 실패합니다. 의견이 아닌 과거 행동을 물어, 진짜 고통이 있는지 검증하세요."
        ),
        "mvp-build": .init(
            title: "2~6주 안에 가장 좁은 워크플로 하나로 출시하세요",
            detail: "Reid Hoffman: \"첫 버전이 창피하지 않다면 너무 늦게 출시한 것이다.\" 기능 추가가 아니라 삭제가 어렵습니다. 7단계로 끝내세요."
        ),
        "launch-gtm": .init(
            title: "출시 = 끝이 아니라 시작. 측정·첫 사용자·채널을 깔아야 합니다",
            detail: "MVP 만들었다고 끝이 아닙니다. 출시 스택 (계측·결제·에러·피드백) + 첫 100명 직접 영업 + 마케팅 채널 1-2개 셋팅이 핵심."
        ),
        "go-live": .init(
            title: "가이드만 따라가면 실제 출시 가능",
            detail: "본인 제품에 맞는 1-3개 채널 선택 후 단계별 절차를 따라가세요. 웹 = 1-3시간, iOS = 3-7일, Android = 2-3주, PH/HN = 1-2주 준비. 외주 없이 본인이 직접 가능하도록 모든 절차 제공."
        ),
        "growth-engine": .init(
            title: "리텐션 없는 성장은 밑 빠진 독",
            detail: "초기 사용자가 \"돌아오는가?\"를 먼저 증명하세요. 북극성 지표 → 주간 리뷰 → 리텐션 코호트 순서로 성장 엔진을 만드세요."
        ),
        "company-setup": .init(
            title: "사업자등록 → IP 보호 → 세무 셋업",
            detail: "MVP 검증 후 본격 운영 단계입니다. 개인/법인 결정 → 상표·특허 출원 → 과세 유형 → 약관·개인정보 처리방침까지 4가지를 순서대로 처리하세요."
        ),
        "fundraising-readiness": .init(
            title: "투자가 정말 필요한가? 런웨이 18개월 + Default Alive 가 표준",
            detail: "2026 투자 표준: 런웨이 18+개월, Net Burn < 2x Net New ARR, Default Alive (자체 매출로 생존). 솔로 파운더 52%가 외부 투자 없이 엑싯. 투자는 가속 도구일 뿐 — 매출이 답일 수도 있습니다."
        ),
        "venture-certification": .init(
            title: "벤처인증 하나로 수천만원 절세 + 지원사업 자격",
            detail: "법인세 50% 감면(5년) + 취득세 75% 감면 + 스톡옵션 비과세(연 2억) + TIPS·창업패키지 우대. 마감을 놓치면 1년을 기다려야 합니다."
        ),

        // ── Hardware / IoT cluster ────────────────────────────────────────────
        "hardware-prototype": .init(
            title: "EVT → DVT → PVT 3단계를 빠뜨리지 말 것 — 단계 누락은 양산 후 결함 폐기로 이어집니다",
            detail: "EVT(10-50대, 4-6주)에서 회로/펌웨어 결함 → DVT(50-200대, 양산 공정 동일)에서 내구성·신뢰성 → PVT(첫 양산 5-10%, 최소 4주)에서 양산 가능성 검증. 모든 단계는 명확한 합격 기준이 있어야 함."
        ),
        "bom-supply-chain": .init(
            title: "Single-source 부품 식별 + 2차 공급사 확보 — 6-12개월 단종 위험을 미리 잡습니다",
            detail: "BOM 에 부품·공급사·리드타임·대안 부품을 모두 명시. 핵심 부품 dual-sourcing 계약 (CISA HBOM 표준 권장). Single-source 리스크가 있는 항목은 안전재고 (safety stock) 또는 재설계 옵션 미리 준비."
        ),
        "certification-kc-ce": .init(
            title: "Pre-compliance 테스트로 정식 KC 신청 전 결함 잡기 — 수개월·수천만원 절감",
            detail: "공식 인증 신청 전 자체 EMC/Safety 사전 검증으로 'fail and re-submit' 사이클 방지. 한국 시험소 + 한국 대리인 지정은 KC 필수. 무선 제품은 KC-RRA + Safety + EMC 3개 모두 받아야 합법 판매."
        ),
        "manufacturing-partner": .init(
            title: "EMS 후보 3-5개 비교 + 직접 감사 — 잘못된 파트너는 회사를 위험에 빠뜨림",
            detail: "능력·캐파·QC 시스템·ISO 9001 등 인증 비교. 직접 방문(또는 화상 라인 점검). MOQ·결제조건·불량률 임계치·IPI(In-Process Inspection) 검사 포인트를 1차 양산 계약에 명시."
        ),

        // ── Deep Tech Lab (로보틱스 / 바이오) ─────────────────────────────────
        "lab-setup": .init(
            title: "GLP 또는 BSL-1/2 시설 — 인허가 데이터의 신뢰성은 시설에서 시작",
            detail: "MFDS GLP (우수 실험실 운영기준) 또는 BSL-1/2 (Biosafety Level) 시설. 시설이 표준 미달이면 IND 제출 시 데이터 자체가 무효 처리. 처음부터 GLP 인증 시설 또는 GLP 인증 시설 위탁 (CRO)."
        ),
        "prototype-iteration": .init(
            title: "후보물질 스크리닝 + 단계별 결정 기준 — 임상 진입 전 '죽일 후보' 빨리 결정",
            detail: "후보 50-200개 → in vitro 1차 스크리닝 → in vivo 동물 효능·독성 → 임상 진입 후보 선정. 각 단계마다 명시적 cutoff 기준 (효능·안전성·약동학·제조 가능성). 디지털 의료기기는 SaMD 임상 워크플로 통합 검증."
        ),
        "field-or-clinical-test": .init(
            title: "MFDS IND 제출 (4-6주) + IRB 윤리 심사 병행 — 한국은 세계에서 가장 빠른 IND 중 하나",
            detail: "Pre-IND consultation 으로 사전 협의 (최단 7일 단축). IND 정식 제출 후 4-6주 (30 working days) 내 결정. IRB 윤리 심사 병행 시 총 6-8주에 임상 시작 가능. 피험자 보상 보험은 IND 제출 시 필수."
        ),
        "regulatory-submission": .init(
            title: "MFDS Fast-Track (80-140일) 자격 검토 — 일반 295일 vs Fast-Track 80-140일",
            detail: "Fast-Track 자격: 199개 device 카테고리 (113개 AI 디지털 의료기기 포함). 자격되면 시장 진입 시간 5-6배 단축. Pre-consultation 단계에서 Fast-Track 자격 여부 미리 확정."
        ),

        // ── Extreme Deep Tech (반도체 / 클린테크) ─────────────────────────────
        "eda-tooling-setup": .init(
            title: "Multi-year EDA 라이선스 협상 (10-25% 할인) — 칩 설계의 가장 큰 병목입니다",
            detail: "Synopsys/Cadence 라이선스는 6-12개월 commit 단위. Multi-year 계약 시 10-25% 할인. 스타트업 티어 (token-based 또는 startup-tier 옵션) 비교 후 시작. 라이선스 락인 늦으면 설계 진행 자체가 멈춤."
        ),
        "mpw-or-pilot-tape-out": .init(
            title: "MPW shuttle 우선 — Full mask 의 5-10% 비용으로 검증 후 양산 결정",
            detail: "MPW (Multi-Project Wafer) 는 shared wafer run 으로 여러 design 동시 제작. 비용 90-95% 절감 (수만~수십만달러). 검증 후 Full mask 전환 (28nm $1M+, 7nm $10M+). 단, 생산 시간은 동일 (6-9개월). 잘못된 노드 선택 = 전면 재설계."
        ),
        "packaging-and-test": .init(
            title: "OSAT 파트너 일찍 락인 — 2026년 가격 5-30% 인상, 가동률 90%",
            detail: "ASE·Amkor·JCET·Powertech 등 OSAT 비교. AI 수요로 캐파 부족 — 늦으면 양산 일정 흔들림. 테스트 플랜 (wafer-level / package-level + ATE + burn-in + yield 임계치) 미리 정의."
        ),
        "partner-foundation-or-pilot-line": .init(
            title: "파운드리 파트너십 일찍 락인 — TSMC 2/3nm 2027-2028까지 매진",
            detail: "TSMC N2/N3/N5 fully booked through 2027-2028. Samsung Foundry 가 대안 (2nm 21,000 wafers/mo 목표). 구형 노드 (28nm·12nm) 는 SkyWater·Tower·X-FAB·UMC 옵션. CoWoS advanced packaging 52-78주 leadtime."
        ),

        // ── shared tail (마감 단계들) ──────────────────────────────────────────
        "biz-registration": .init(
            title: "사업자등록 + 사업용 통장 — 매출 시작 전 2종 모두 끝",
            detail: "세무서 사업자등록 (홈택스 5분, 3영업일 처리) + 사업 전용 통장 (개인 분리는 세무 신고·소득 증빙의 최소 조건). 세무사 선임 여부는 매출 발생 후 결정해도 OK."
        ),
        "tax-guide": .init(
            title: "간이 vs 일반 + 신고 일정 — 1년치 세금 시뮬을 미리 돌려보고 결정",
            detail: "간이과세(매출 1.04억 미만)는 부가세 부담이 일반 대비 30-70% 낮지만 매입세액 공제 불가. 카드 매입 비중 높은 업종은 일반과세가 더 유리할 수 있음 — 시뮬 없이 선택 X."
        ),
        "loan-guide": .init(
            title: "정책자금 우선 — 시중은행은 마지막 수단",
            detail: "신용보증재단(소상공인) · KOSME(스타트업) · TIPS · 청년창업사관학교. 정부 보증 + 저금리 + 거치기간 결합으로 시중은행 대비 3-5%p 낮음. 시중은행은 정책자금 한도 초과 시 보완용."
        ),
        "pre-launch-final": .init(
            title: "D-Day 봉인 — 출시 14일 전, 결제·법적·운영·캘린더 4종 락인",
            detail: "D-Day 확정 + 베타 10명 명단 + 프로덕션 배포 + 결제·법적 풋터 + 런북(시간대별 매뉴얼·5종 응급 템플릿) + D-28~D+14 13개 알림 봉인. 출시 당일 즉흥 결정 = 사고."
        ),
    ]
}
