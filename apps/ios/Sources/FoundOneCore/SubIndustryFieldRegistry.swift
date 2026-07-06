//
//  SubIndustryFieldRegistry.swift — 세부업종 입력 필드 재라벨 (웹 SSOT 자동 생성 미러)
//
//  ⚠️ 웹 SSOT: apps/web/.../shared-tail/FinancialReviewStage.tsx → SUB_INDUSTRY_FIELDS.
//             스타트업·온라인 업종은 '식자재 원가' 대신 'AI API 사용량' 등으로 입력칸 재정의.
//             스크립트 파싱·생성 (수동 편집 금지).
//

import Foundation

public enum SubIndustryFieldRegistry {
    public struct FieldLabel: Sendable, Hashable { public let label: String; public let hint: String
        public init(label: String, hint: String){self.label=label;self.hint=hint} }

    /// 세부업종 ID → (fieldKey → 재라벨). 없으면 nil → 호출부 기본 라벨 사용.
    public static func fields(forSpecialty id: String) -> [String: FieldLabel]? { map[id] }

    private static let map: [String: [String: FieldLabel]] = [
        "ai-application": [
            "ingredients": .init(label: "AI API 사용량", hint: "Claude·OpenAI·Gemini 토큰 사용량"),
            "rent": .init(label: "사무실·코워킹", hint: "FastFive·Sparkplus·재택은 0"),
            "utilities": .init(label: "SaaS·인프라 구독", hint: "Vercel·Supabase·Cursor·Linear·GitHub"),
            "sga": .init(label: "결제·플랫폼 수수료", hint: "Toss·Stripe 2.9% + 앱스토어 15~30%"),
            "marketing": .init(label: "광고·마케팅", hint: "PH·Twitter·검색·콘텐츠 광고"),
            "other": .init(label: "법무·회계·IP", hint: "변호사·세무사·특허 출원·인증"),
        ],
        "developer-tools": [
            "ingredients": .init(label: "인프라·CI/CD", hint: "GitHub Actions·CDN·빌드 사용량"),
            "rent": .init(label: "사무실·코워킹", hint: "FastFive·재택은 0"),
            "utilities": .init(label: "SaaS·도구 구독", hint: "JetBrains·Linear·Notion·Sentry"),
            "sga": .init(label: "결제·배포 수수료", hint: "Stripe 2.9% + 마켓플레이스 수수료"),
            "marketing": .init(label: "GTM·콘텐츠", hint: "오픈소스 GTM·DevRel·블로그"),
            "other": .init(label: "법무·회계·IP", hint: "변호사·세무사·오픈소스 라이선스"),
        ],
        "b2b-saas": [
            "ingredients": .init(label: "인프라·SOC2", hint: "AWS·Vanta·SOC2 모니터링"),
            "rent": .init(label: "사무실·코워킹", hint: "엔터프라이즈 신뢰 위해 사무실 권장"),
            "utilities": .init(label: "SaaS·도구 구독", hint: "Linear·Notion·Slack·Figma·Sentry"),
            "sga": .init(label: "영업·CRM 수수료", hint: "HubSpot·Salesforce·Stripe 2.9%"),
            "marketing": .init(label: "B2B 마케팅", hint: "검색·LinkedIn·웹세미나·전시회"),
            "other": .init(label: "보안인증·법무", hint: "ISO27001·SOC2 인증·변호사·세무"),
        ],
        "fintech-startup": [
            "ingredients": .init(label: "금융 API·KYC", hint: "Plaid·KYC/AML 솔루션·신원확인"),
            "rent": .init(label: "사무실·코워킹", hint: "금융위 등록 시 실물 사무실 필수"),
            "utilities": .init(label: "SaaS·인프라 구독", hint: "AWS·Datadog·관측·인증 도구"),
            "sga": .init(label: "컴플라이언스·법무", hint: "금융위 신고비·변호사·자문 retainer"),
            "marketing": .init(label: "마케팅·신뢰 콘텐츠", hint: "검색·신뢰 콘텐츠·언론 PR"),
            "other": .init(label: "보안인증·감사", hint: "ISMS-P·정보보호인증·외부 감사"),
        ],
        "healthtech-startup": [
            "ingredients": .init(label: "임상·연구 비용", hint: "CRO·임상시험·연구 외주"),
            "rent": .init(label: "연구실·사무실", hint: "GMP 시설 또는 코워킹"),
            "utilities": .init(label: "SaaS·연구 장비", hint: "AWS·연구 데이터·실험 장비 유지"),
            "sga": .init(label: "식약처 인증·법무", hint: "의료기기 GMP·식약처 신고·법무"),
            "marketing": .init(label: "학회·임상 PR", hint: "학회 발표·임상 결과 발표·PR"),
            "other": .init(label: "특허·라이선스", hint: "특허 출원·라이선스 in/out·자문"),
        ],
        "security-startup": [
            "ingredients": .init(label: "인프라·테스트랩", hint: "AWS·테스트 환경·취약점 스캐너"),
            "rent": .init(label: "사무실·코워킹", hint: "보안 등급 사무실 권장"),
            "utilities": .init(label: "SaaS·도구 구독", hint: "Linear·Notion·Datadog·Sentry"),
            "sga": .init(label: "CC인증·컴플라이언스", hint: "CC인증·ISMS·KISA 신고"),
            "marketing": .init(label: "B2B 마케팅·전시", hint: "보안 컨퍼런스·LinkedIn·검색"),
            "other": .init(label: "법무·인증·기타", hint: "변호사·세무사·정부 인증"),
        ],
        "hardware-iot": [
            "ingredients": .init(label: "BOM·부품 매입", hint: "PCB·센서·금형·시제품 부품"),
            "rent": .init(label: "사무실·랩 공간", hint: "조립 공간·시험 공간 필요"),
            "utilities": .init(label: "SaaS·CAD 도구", hint: "AutoCAD·SolidWorks·Altium"),
            "sga": .init(label: "EMS·시제품 외주", hint: "EMS 위탁·시제품 제작 외주"),
            "marketing": .init(label: "마케팅·전시", hint: "CES·MWC·전시회·B2B 영업"),
            "other": .init(label: "인증·법무·기타", hint: "KC·CE·FCC·전파인증·특허"),
        ],
        "robotics-physical-ai": [
            "ingredients": .init(label: "부품·센서·액추에이터", hint: "라이다·모터·로봇 팔·컴퓨터"),
            "rent": .init(label: "랩·시험 공간", hint: "로봇 시험 공간·천정 높이 필요"),
            "utilities": .init(label: "SaaS·연구 장비", hint: "ROS·SolidWorks·MoCap·실험 장비"),
            "sga": .init(label: "GPU·시뮬레이션", hint: "Isaac·Unity·GPU 클러스터 사용량"),
            "marketing": .init(label: "데모·전시", hint: "AI Expo·로보월드·데모 영상"),
            "other": .init(label: "안전 인증·법무", hint: "기능 안전·KC·특허·변호사"),
        ],
        "semiconductor": [
            "ingredients": .init(label: "MPW·테이프아웃", hint: "팹 MPW 1회당 수억 — 정부 매칭 권장"),
            "rent": .init(label: "사무실·검증 공간", hint: "검증 보드·계측기 공간 필요"),
            "utilities": .init(label: "SaaS·시뮬 장비", hint: "EDA 시뮬·검증 도구·서버"),
            "sga": .init(label: "EDA 라이센스", hint: "Cadence·Synopsys·Mentor 연간 라이센스"),
            "marketing": .init(label: "고객사 영업", hint: "Tier1 OEM 영업·전시·논문"),
            "other": .init(label: "특허·법무·인증", hint: "특허 출원 연간 수십~수억 필수"),
        ],
        "biotech-medtech": [
            "ingredients": .init(label: "임상·전임상 비용", hint: "CRO·동물시험·전임상 외주"),
            "rent": .init(label: "GMP 연구실·사무실", hint: "BSL·GMP 등급 시설 임대료"),
            "utilities": .init(label: "연구 장비·시약", hint: "분석기·세포·시약·소모품 매월"),
            "sga": .init(label: "IP·라이선스", hint: "특허 출원·in/out 라이선스·기술이전"),
            "marketing": .init(label: "학회·임상 PR", hint: "학회 발표·논문·임상 결과 PR"),
            "other": .init(label: "식약처·인증·기타", hint: "식약처 신고·KGCP·외부 감사"),
        ],
        "climate-energy": [
            "ingredients": .init(label: "측정 장비·시제품", hint: "탄소 측정·배터리·실증 장비"),
            "rent": .init(label: "사무실·랩", hint: "실증 공간·창고 임대"),
            "utilities": .init(label: "SaaS·인프라", hint: "AWS·데이터 분석·SaaS 도구"),
            "sga": .init(label: "인증·실증사업", hint: "환경 인증·실증사업 매칭 자금"),
            "marketing": .init(label: "B2B 영업·정부 PR", hint: "산업통상부·환경부 사업 PR"),
            "other": .init(label: "법무·R&D 매칭", hint: "정부 R&D 매칭 자기부담·법무"),
        ],
        "smart-store": [
            "ingredients": .init(label: "매입 원가", hint: "상품 사입·도매 매입가"),
            "rent": .init(label: "창고·풀필먼트", hint: "재택 운영 시 0 — 풀필먼트는 입출고비"),
            "utilities": .init(label: "포장·배송 자재", hint: "박스·완충재·송장·택배비"),
            "sga": .init(label: "결제·플랫폼 수수료", hint: "네이버 결제 3.63%+판매수수료 2.73%·쿠팡 4~10.9%"),
            "marketing": .init(label: "광고 (CPC·CPM)", hint: "네이버 검색광고·쿠팡 광고"),
            "other": .init(label: "반품·CS·기타", hint: "반품 회수·CS 인건·소모품"),
        ],
        "digital-products": [
            "ingredients": .init(label: "콘텐츠 제작비", hint: "외주 디자인·편집·전문가 검수"),
            "rent": .init(label: "사무실·코워킹", hint: "재택·카페 운영 시 0"),
            "utilities": .init(label: "호스팅·SaaS", hint: "Webflow·Notion·Gumroad·Stripe"),
            "sga": .init(label: "플랫폼 수수료", hint: "크몽 15~20%·인프런·노션 마켓 5%"),
            "marketing": .init(label: "광고·인플루언서", hint: "Meta·검색·인플루언서 협업"),
            "other": .init(label: "결제 수수료·기타", hint: "Toss·Stripe 2.9% + 세무"),
        ],
        "creator-service": [
            "ingredients": .init(label: "장비 감가·소품", hint: "카메라·조명·마이크·소품 감가"),
            "rent": .init(label: "스튜디오·공간", hint: "스튜디오 임대 또는 자택"),
            "utilities": .init(label: "호스팅·SaaS", hint: "Adobe·Final Cut·Notion·OBS"),
            "sga": .init(label: "편집 외주·플랫폼", hint: "편집자 외주 + YouTube/Patreon 수수료"),
            "marketing": .init(label: "광고·콜라보", hint: "썸네일 광고·크리에이터 콜라보"),
            "other": .init(label: "저작권·기타", hint: "음원·폰트·이미지 라이선스"),
        ],
        "consignment-commerce": [
            "ingredients": .init(label: "위탁 매입가", hint: "위탁 사입가·드롭쉽 단가"),
            "rent": .init(label: "창고·물류", hint: "재택은 0 — 자체 창고 시 입력"),
            "utilities": .init(label: "포장·배송 자재", hint: "택배·국제배송·송장"),
            "sga": .init(label: "결제·반품·CS", hint: "반품 회수비·CS·결제 수수료"),
            "marketing": .init(label: "광고·플랫폼 수수료", hint: "검색광고·플랫폼 입점 수수료"),
            "other": .init(label: "환율·관세·기타", hint: "환차손·관세·통관·보관료"),
        ],
        "newsletter-membership": [
            "ingredients": .init(label: "콘텐츠 제작비", hint: "리서치·기고·인터뷰·제작 외주"),
            "rent": .init(label: "사무실·코워킹", hint: "재택·카페 운영 시 0"),
            "utilities": .init(label: "SaaS·호스팅", hint: "Notion·Webflow·Beehiiv 정기"),
            "sga": .init(label: "플랫폼·결제 수수료", hint: "Stibee·Patreon 10% + Stripe 2.9%"),
            "marketing": .init(label: "구독자 획득 광고", hint: "Meta·X·검색·뉴스레터 추천"),
            "other": .init(label: "법무·기타", hint: "저작권·세무·기타"),
        ],
        "global-buying": [
            "ingredients": .init(label: "해외 매입가", hint: "해외 도매가 + 환율 변동"),
            "rent": .init(label: "창고·물류", hint: "재택·소형 창고"),
            "utilities": .init(label: "포장·통신", hint: "박스·송장·인터넷·전화"),
            "sga": .init(label: "해외 배송·관세", hint: "특송·관세·통관·환전 수수료"),
            "marketing": .init(label: "광고·플랫폼 수수료", hint: "검색광고·플랫폼 등록 수수료"),
            "other": .init(label: "보험·기타", hint: "운송 보험·통관 사고·기타"),
        ],
        "guesthouse": [
            "ingredients": .init(label: "어메니티·소모품", hint: "수건·세제·생수·티슈·일회용품"),
            "utilities": .init(label: "전기·가스·수도·인터넷", hint: "객실 전기·온수 가스·물·Wi-Fi"),
            "sga": .init(label: "OTA·청소 외주", hint: "부킹닷컴 15%·에어비앤비 14% + 청소 외주"),
            "marketing": .init(label: "광고·SNS", hint: "OTA 노출 광고·인스타·블로그"),
            "other": .init(label: "보험·교체·기타", hint: "화재 보험·침구·가전 교체"),
        ],
    ]
}
