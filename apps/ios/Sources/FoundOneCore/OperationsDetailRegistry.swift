//
//  OperationsDetailRegistry.swift — 카드결제(VAN)·매장음악·브랜드 디자인 상세 (웹 SSOT 자동 생성 미러)
//
//  ⚠️ 웹 SSOT: apps/web/.../offline/OperationsSetupStage.tsx → vanProviders/musicLicenseOptions/designPlatforms.
//             스크립트 파싱·생성 (수동 편집 금지).
//

import Foundation

public enum OperationsDetailRegistry {
    public struct Item: Sendable, Hashable {
        public let name: String; public let tagline: String; public let url: String; public let pros: [String]; public let cons: [String]
        public init(name: String, tagline: String, url: String, pros: [String], cons: [String]){self.name=name;self.tagline=tagline;self.url=url;self.pros=pros;self.cons=cons}
    }
    public static let van: [Item] = [
        .init(name: "NICE정보통신", tagline: "국내 1위 VAN · 업종 무관 안정적", url: "https://www.nicevan.co.kr", pros: ["국내 시장 점유율 1위 — 모든 카드사·간편결제 자동 연계", "전국 A/S망, 사고·장애 대응 빠름", "사업자등록증·통장사본·신분증만 있으면 신청"], cons: ["단말기 임대료·관리비(월정액)는 카드 수수료와 별개 — 업체별 사전 비교 필수", "단말기 임대·구매 옵션별 비용 차이 큼"]),
        .init(name: "KIS정보통신", tagline: "Semplus 통합 매출·정산·VAT 신고 지원", url: "https://www.kisvan.co.kr", pros: ["Semplus 인터넷 서비스 — 매출·카드사·입금·미수금·VAT 신고 통합", "POS 시장 1위 KIS와 같은 회사 — 단말기 연동 매끄러움", "전국 가맹점 영업·관리망 강력"], cons: ["UI가 다소 구식, 익히는 데 시간 소요", "월정액 옵션은 별도 약정"]),
        .init(name: "스마트로(SMARTRO)", tagline: "14개 지사·328개 대리점 · 전국 방문 A/S", url: "https://www.smartro.co.kr", pros: ["전국 14개 지사 + 328개 대리점 — 지방 매장도 빠른 대응", "고객 중심 영업·고품질 사후 관리 강점", "온라인·오프라인 결제 모두 지원"], cons: ["네임밸류는 NICE·KIS보다 낮음", "지역별 대리점 품질 편차 있을 수 있음"]),
        .init(name: "KICC(한국정보통신)", tagline: "키오스크·POS 연동 강점 · 오케이포스 등 호환", url: "https://www.kicc.co.kr", pros: ["오케이포스·신규 키오스크 솔루션과 연동 매끄러움", "결제 속도 빠르고 단말기 안정성 ↑", "외식·소매·서비스업 모두 커버"], cons: ["지방 일부 지역 A/S망 NICE·스마트로 대비 약함", "초기 단말기 비용 옵션별 차이"]),
        .init(name: "KSNET", tagline: "외국인 카드·글로벌 결제 강점", url: "https://www.ksnet.co.kr", pros: ["Visa·Master·UnionPay·JCB·AMEX 글로벌 결제 강력", "외국인 관광객 매장(명동·홍대·강남)에 유리", "온라인 PG와 통합 운영 가능"], cons: ["국내 일반 매장에는 NICE/KIS가 더 일반적", "정산 주기·수수료 사전 확인 필수"]),
    ]
    public static let music: [Item] = [
        .init(name: "직접 신고 (KOMCA + KOSCAP + RIAK)", tagline: "월 4천원~ · 가장 저렴 · 3개 단체 개별 신고", url: "https://www.komca.or.kr", pros: ["50㎡ 커피전문점 기준 월 약 4,000원 — 가장 저렴", "한국음악저작권협회(KOMCA) + 함께하는음악저작인협회(KOSCAP) + 한국음반산업협회(RIAK, 음반제작자) 3곳 신고", "오랜 운영 매장의 정통 방식"], cons: ["3개 단체 각각 신고·납부 — 절차 복잡", "음원 직접 보유·재생 필요 (CD/MP3 등)", "유튜브·스포티파이 등 개인용 스트리밍은 사용 불가"]),
        .init(name: "샵캐스트(ShopCast)", tagline: "월 9천원~ · 자동 정산 · 광고 음악 X", url: "https://www.shopcast.kr", pros: ["저작권료 자동 정산 — 별도 KOMCA 신고 불필요", "수만 곡 큐레이션, 업종·시간대별 플레이리스트 추천", "광고 끼어들지 않는 매장 전용 음악 서비스"], cons: ["월정액 9천원~ (직접 신고보다 다소 비쌈)", "자체 큐레이션 의존 — 곡 선택 자유도 ↓"]),
        .init(name: "멜론 비즈(Melon Biz)", tagline: "멜론 음원 + 매장 라이센스 통합", url: "https://www.melonbiz.com", pros: ["멜론 최신 차트 음원 합법적 매장 사용", "다양한 매장 카테고리 플레이리스트", "월정액 약 9천원~ · 자동 저작권 처리"], cons: ["월정액 의무 — 작은 매장에는 부담", "매장 외 가정용·개인용 사용은 별도"]),
        .init(name: "프리뮤직 (AI/저작권 무료 음원)", tagline: "AI 음악만 사용 — 공연권료 면제", url: "https://freemusic.co.kr", pros: ["KOMCA에 등록되지 않은 AI 음악은 공연권료 징수 대상 X (2025 기준)", "월정액 무료~소액", "법적 분쟁 리스크 0"], cons: ["인기곡·차트곡 사용 불가 — 매장 분위기 영향", "AI 음악 품질·다양성 일반 음원 대비 제한적"]),
    ]
    public static let design: [Item] = [
        .init(name: "크몽(Kmong)", tagline: "31,307개 디자인 서비스 · 5천원~80만원 · 일괄 의뢰", url: "https://kmong.com", pros: ["로고·메뉴판·간판·명함 한 디자이너에게 일괄 의뢰 가능", "가격대 다양 — 5,000원부터 시작, 평균 5~30만원", "리뷰·포트폴리오 공개로 검증된 전문가 선택 가능"], cons: ["저가 디자이너 시안 품질 편차 큼 — 포트폴리오 필수 확인", "협업·미팅보다 비대면 진행이 일반적"]),
        .init(name: "라우드소싱", tagline: "콘테스트 형식 · 의뢰 1번에 2~30개 시안", url: "https://www.loud.kr", pros: ["1번 의뢰로 2~30명 디자이너의 시안 동시 수령", "마음에 드는 시안 선택 후 디자이너와 작업 마감", "유사 사례·후기 풍부 (만족도 98.7%)"], cons: ["1건당 평균 50~200만원 — 크몽 대비 비쌈", "콘테스트 진행 기간 7~14일 소요"]),
        .init(name: "숨고", tagline: "로컬 디자이너 매칭 · 평균 15만원 · 미팅 가능", url: "https://soomgo.com", pros: ["거주 지역 디자이너와 직접 만남·미팅 가능", "평균 거래가 15만원 (5만~30만원 범위)", "간판 시공·인테리어 디자이너와 동시 매칭 유리"], cons: ["견적 다수 비교는 필요 — 첫 견적이 합리적이라는 보장 X", "실력 편차 — 포트폴리오 사전 확인 필수"]),
        .init(name: "미리캔버스", tagline: "셀프 디자인 · 한국어 템플릿 · 무료~월 6천원", url: "https://www.miricanvas.com", pros: ["로고·메뉴판·간판 시안 셀프 제작 (수십만 한국어 템플릿)", "무료 플랜 + 프로 월 6,000원~", "수정·재사용 무한 — 시즌 변경 시 빠르게 대응"], cons: ["디자인 시간 투입 多 (1~2주)", "독창성 ↓ — 다른 매장과 비슷할 수 있음"]),
        .init(name: "Canva", tagline: "셀프 디자인 · Magic Design AI · 무료~월 1.5만원", url: "https://www.canva.com/", pros: ["Magic Design AI 로 로고·메뉴판·SNS 시안 1클릭 생성", "무료 플랜 충분 + 프로 월 1.5만원~", "글로벌 최대 템플릿 풀 · 한국어 UI 지원"], cons: ["한국 전용 템플릿은 미리캔버스보다 적음", "디자인 시간 투입 필요"]),
    ]
}
