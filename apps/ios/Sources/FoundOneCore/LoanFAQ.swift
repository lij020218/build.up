//
//  LoanFAQ.swift — 대출·정책자금 FAQ SSOT (2026-05 검증)
//
//  웹 SSOT 미러: packages/shared/src/finance/loan-faq.ts
//  검증 출처: 중기부 mss.go.kr / 소진공 semas.or.kr / 캠코 kamco.or.kr
//             / k-startup.go.kr / 금융감독원 fine.fss.or.kr
//

import Foundation

public enum LoanFAQCategory: String, Sendable, Codable, CaseIterable {
    case policy         // 정책자금
    case guarantee      // 보증재단·신보·기보
    case youth          // 청년 자금
    case startupFund    // 창업패키지·TIPS
    case crisis         // 긴급·재기·새출발기금
    case credit         // 신용·은행
    case risk           // P2P·핀테크 주의

    public var labelKo: String {
        switch self {
        case .policy:       return "정책자금"
        case .guarantee:    return "보증재단"
        case .youth:        return "청년"
        case .startupFund:  return "창업패키지"
        case .crisis:       return "위기·재기"
        case .credit:       return "신용·은행"
        case .risk:         return "주의"
        }
    }
}

public struct LoanFAQEntry: Sendable, Identifiable, Codable, Hashable {
    public let id: String
    public let category: LoanFAQCategory
    public let question: String
    public let answer: String
    public let keywords: [String]
    public let sources: [FAQSource]
    public let lastVerified: String

    public init(id: String, category: LoanFAQCategory, question: String, answer: String,
                keywords: [String], sources: [FAQSource], lastVerified: String) {
        self.id = id
        self.category = category
        self.question = question
        self.answer = answer
        self.keywords = keywords
        self.sources = sources
        self.lastVerified = lastVerified
    }
}

public enum LoanFAQ {

    public static let entries: [LoanFAQEntry] = [
        // ─── 정책자금 ───
        LoanFAQEntry(
            id: "soha-policy-fund-2026",
            category: .policy,
            question: "소상공인 정책자금 — 종류·한도·금리·신청",
            answer: """
**2026년 총 3조 3,620억원 규모**. 자금 종류: 일반·특별·긴급경영안정자금, 신용취약자금, 대환대출, 재도전특별자금, 장애인기업, 청년고용연계, 성장기반자금.

**금리** (2026년 1분기): 기준 **연 2.96%** (분기별 1/4/7/10월 10일 갱신). 자금 유형별 가산금리 0.4~1.6%p, 비수도권·인구소멸지역은 0.2%p 우대.

**한도**: 일반적으로 **최대 7,000만원**, **재도전특별자금은 최대 2억원**, 성장기반(혁신성장·소공인특화)은 더 큼.
*※ '운영자금 5억·시설자금 10억' 한도는 소상공인이 아닌 **중진공 중소기업 정책자금** 수치.*

**신청처**: 소상공인 정책자금 통합플랫폼 **ols.semas.or.kr**, 소진공 지역센터 (전국 78곳), 콜센터 1357·1533-0100.

**자격**: 광업·제조업·건설업·운수업 **10인 미만**, 그 외 업종 **5인 미만** + 업종별 매출 기준. 접수 시작 1월 5일.
""",
            keywords: ["소상공인", "정책자금", "한도", "금리", "신청", "soha", "semas"],
            sources: [
                FAQSource(label: "중기부 2026 정책자금 공고", url: "https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=310&bcIdx=1064354&parentSeq=1064354"),
                FAQSource(label: "소진공 정책자금", url: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 보증재단 ───
        LoanFAQEntry(
            id: "guarantee-foundations",
            category: .guarantee,
            question: "지역신보·신보·기보 — 차이는?",
            answer: """
세 기관 모두 '보증서 발급 → 은행 대출' 구조지만 대상·소관이 다릅니다.

| 구분 | 지역신보 | 신보(kodit) | 기보(kibo) |
|---|---|---|---|
| 소관 | 중기부 | 금융위 | 금융위 |
| 주 대상 | **담보력 부족 소상공인·소기업** | 일반 중소기업 | **기술형(벤처·이노비즈·R&D)** |
| 한도 | 보통 1억 내외 (소상공인) | 같은기업 합계 8억 기준 | 기술등급별 30~100억 |
| 보증료 | 연 0.5~2% | 0.5~3.0% | 기술등급 차등 |
| 신청 | **보증드림** untact.koreg.or.kr + 지역재단 17곳 | kodit.co.kr | kibo.or.kr |

**보증 vs 대출**: 보증재단/기금은 직접 대출 X, **'보증서' 발급** → 은행이 그 보증서를 담보로 대출 (2단계). 보증부 대출은 일반대출보다 0.5~2%p 낮음.
""",
            keywords: ["보증", "신보", "기보", "지역신보", "보증재단", "보증서", "kodit", "kibo"],
            sources: [
                FAQSource(label: "신보 보증료", url: "https://www.kodit.co.kr/kodit/cm/cntnts/cntntsView.do?mi=2806&cntntsId=11382"),
                FAQSource(label: "기보 보증료", url: "https://www.kibo.or.kr/main/work/work010301.do"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 청년 자금 ───
        LoanFAQEntry(
            id: "youth-startup-fund",
            category: .youth,
            question: "청년창업자금 — 만 39세 이하 어떤 종류?",
            answer: """
'청년창업자금' 단일 제도는 없고 **세 가지를 구분**해야 합니다.

**1. 중진공 청년전용창업자금** (대표적)
- 대상: **대표자 만 39세 이하 + 사업 개시 3년 미만**
- 한도: **최대 1억원** (제조·지역특화 2억원)
- 금리: **연 2.5% 고정**
- 기간: 시설 10년 (거치 3년), 운전 6년 (거치 3년)
- 신청: kosmes.or.kr

**2. 소진공 청년고용연계자금**: 소상공인 정책자금 내 청년 (만 39세 이하) 우대 트랙.

**3. 청년창업 세액감면 (별개)**:
- 근거: 조특법 §6
- 대상: 창업 당시 **만 15~34세** (군 복무 최대 6년 차감)
- 혜택: 소득세·법인세 **5년간 최대 100% 감면**
- **2026년 개정**: 수도권 과밀억제권역 밖 100%→75%, 비수도권 100% 유지
- 세무신고 시 세액감면신청서 필수

**※ 핵심 구분**: 39세 = 자금 (중진공) / 34세 = 세액감면 (국세청)
""",
            keywords: ["청년", "청년창업", "39세", "34세", "청년자금"],
            sources: [
                FAQSource(label: "중진공 청년전용 창업자금", url: "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI004M0.do"),
                FAQSource(label: "조특법 §6", url: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=900239530&chrClsCd=010202&lsId=001584"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 창업패키지·TIPS ───
        LoanFAQEntry(
            id: "startup-package-vs-early",
            category: .startupFund,
            question: "예비창업패키지 vs 초기창업패키지 — 차이?",
            answer: """
| 항목 | 예비창업패키지 (예창패) | 초기창업패키지 (초창패) |
|---|---|---|
| 대상 | 공고일 기준 **사업자등록 없는 예비창업자** | **창업 후 3년 이내** 초기 기업 |
| 지원금 | **사업화자금 평균 5천만, 최대 1억** | **최대 1억** |
| 구성 | 사업화 + 창업 프로그램 + **멘토링** + 교육 | 사업화 + 주관기관 특화 프로그램 |
| 2026 일정 | 공고 1월·접수 2월 4주차 | 1.23 ~ 2.13 16:00 |
| 운영 | 창업진흥원 KISED | 창업진흥원 + 주관기관 (대학·TP) |
| 신청 | **k-startup.go.kr** | 동일 |

**중복 수혜 제한**: 중기부·중앙정부·공공기관 창업사업화는 **동시 수행 불가** — 2개 이상 선정 시 1개만 선택. 과거 유사 사업 이력 있으면 재신청 제한.

**2026 평가**: 초창패는 '아이디어 참신성·창업의지' → **'사업성·시장성·투자 가능성'** 중심으로 이동.
""",
            keywords: ["예비창업", "초기창업", "창업패키지", "예창패", "초창패", "k-startup", "1억"],
            sources: [
                FAQSource(label: "창업진흥원 예비창업", url: "https://www.kised.or.kr/menu.es?mid=a10205010000"),
                FAQSource(label: "중기부 2026 예창패", url: "https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=310&bcIdx=1056700"),
            ],
            lastVerified: "2026-05-18"
        ),
        LoanFAQEntry(
            id: "tips-program",
            category: .startupFund,
            question: "TIPS — 기술 스타트업 R&D 자금?",
            answer: """
**TIPS** (Tech Incubator Program for Startup) = 민간 운영사가 1차 선투자한 기술 스타트업에 정부가 R&D 자금을 매칭 지원.

**2026년 개편**:
- 트랙 단순화 — 초기 스타트업 모두 **일반트랙**
- 운영사 선투자: **1억 → 2억** 상향
- R&D 지원금: **최대 5억 → 8억** 확대
- 스케일업 TIPS: 최대 30억 (별도)

**추천 패키지** (정부 매칭 합계 약 10억):
- R&D 최대 **8억원**
- 사업화 1억
- 해외진출·마케팅 1억
- = 정부 10억 + 운영사 선투자 2억

**선정 절차**:
1. **운영사 (149곳)** 에 신청 — 1곳만
2. 운영사 선투자 + 추천 (1차 게이트)
3. **중기부 최종 평가·선정**
4. 협약 → R&D 수행

**일반 자영업자는 사실상 부적합** — 운영사 추천이 필수라 **딥테크·바이오·IT·SW 등 기술 기반 스타트업** 전용. 졸업기업은 Post-TIPS (스케일업 TIPS) 로 연결 가능.
""",
            keywords: ["TIPS", "팁스", "R&D", "8억", "운영사", "기술 스타트업"],
            sources: [
                FAQSource(label: "bizinfo TIPS 2026 공고", url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000117859"),
                FAQSource(label: "TIPS R&D 8억 상향 보도", url: "https://www.news1.kr/industry/sb-founded/6012319"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 위기·재기 ───
        LoanFAQEntry(
            id: "emergency-restart-newstart",
            category: .crisis,
            question: "긴급경영안정자금·재기지원·새출발기금 — 차이?",
            answer: """
세 제도는 모두 '어려운 소상공인' 대상이지만 **목적·기관이 다름**.

**(A) 긴급경영안정자금** (소진공)
- 재해·매출 급감 등 일시적 위기
- 한도: **7,000만원**
- 금리: 2026 기준 2.96% + 가산
- 자격: 재해확인서 또는 매출 감소율 기준 (공고별)

**(B) 재도전특별자금** (소진공)
- 폐업 후 재창업
- 한도: **최대 2억원** (2026 소상공인 정책자금 중 최대)

**(C) 새출발기금** (캠코, **별도 채무조정**)
- 융자 X — **기존 빚을 깎아줌**
- 대상: 2020.4~2025.6 중 사업 영위한 개인사업자·법인 소상공인 (폐업자 포함, 폐업 법인 제외)
- 차주 구분:
  - **부실차주** (90일+ 연체): 보유재산 반영 **원금 60~80% 감면**
  - **부실우려차주**: 금리 인하·상환기간 연장
  - **취약계층**: 최대 **90% 감면**
- 한도: 최대 15억 (담보 10억 + 무담보 5억)
- 거치 최대 3년, 분할상환 최장 20년
- **2026 인센티브**: 성실상환자 조기상환 시 5~10% 추가 감면
- 신청: 새출발기금.kr, 캠코 지점

**핵심**: A·B = 추가 대출 / C = 기존 대출 탕감.
""",
            keywords: ["긴급", "재기", "새출발", "새출발기금", "채무조정", "폐업", "재창업", "캠코"],
            sources: [
                FAQSource(label: "캠코 새출발기금", url: "https://www.kamco.or.kr/portal/contents.do?mId=0203030000"),
                FAQSource(label: "새출발기금 공식", url: "https://www.newstartfund.or.kr/Contents/Prod.do"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 신용·은행 ───
        LoanFAQEntry(
            id: "credit-score-loan-eligibility",
            category: .credit,
            question: "신용점수 — 대출 가능 점수는?",
            answer: """
**NICE / KCB 양대 신용평가사**. 시중은행·정책기관 모두 **두 점수 중 더 낮은 것 기준**.
- **NICE**: '상환 이력' 가장 중시
- **KCB**: '신용 거래 형태 (카드 한도 소진율·1금융권 비중)' 중시

**커트라인** (대략):
- **정책자금 (소진공·지신보)**: NICE/KCB **745점 이상** 일반, 그 미만은 저신용 전용
- **600점 미만**: 부결 또는 보증부 특별 프로그램 한정
- **시중은행 일반**: 700점 이상

**즉시 올리기 실전**:
1. **통신비·공과금 자동이체 6개월 → 신용정보원 제출 시 5~15점 즉시 가점** (NICE/KCB 모두)
2. 신용카드 한도 소진율 30% 이내 유지 (KCB 영향 큼)
3. 결제일 전 미리 납부
4. 현금서비스·리볼빙 금지 (NICE 급락)

**부결 상태**:
- 최근 1년 내 연체 3회+ / 90일+ 연체 (금융채무 불이행자)
- 개인회생·파산·신용회복위원회 진행 중

⚠️ **잘못된 광고**: '신용회복위원회 채무조정 신청만으로 점수 상승' 은 사실 아님. 진행 중에는 **공공정보 등록되어 대출 차단**, 성실상환 일정 기간 후 회복.
""",
            keywords: ["신용", "신용점수", "신용등급", "NICE", "KCB", "745", "600", "점수 올리기"],
            sources: [
                FAQSource(label: "NICE/KCB 745 기준", url: "https://bizpolicyhub.com/credit-score-management-guide-nice-kcb-loan-approval/"),
                FAQSource(label: "KCB·NICE 차이 — KB Think", url: "https://kbthink.com/card/credit-score-tips.html"),
            ],
            lastVerified: "2026-05-18"
        ),
        LoanFAQEntry(
            id: "loan-vs-grant-priority",
            category: .credit,
            question: "대출 vs 보조금 — 어느 것 먼저?",
            answer: """
**보조금/지원금**: 상환 의무 없음. **자격 좁고** (업종·매출·지역·고용) 사후 정산·증빙 의무. 2026 직접지원 예산 약 **1조 3,410억**.

**정책자금 대출**: 저금리 (연 2~3.5%)·장기 분할상환. 2026 예산 약 **3조 3,620억** (보조금의 2.5배). 신용점수·매출 충족 시 대다수 활용 가능.

**시중은행 사업자 대출**: 한도 크고 비대면 가능, 금리 5~8%대.

**출자 (지분 투자)**: 모태펀드·VC. 상환 없지만 **지분 양도·의사결정 공유**. 기술·성장성 검증된 스타트업 한정.

**현실적 권장 순서**:
1. **보조금 (바우처 등)** → 자격되면 가장 유리, 단 자격 좁음
2. **정책자금 대출** (소진공·지신보 보증) → 가장 현실적
3. **인터넷전문은행 비대면** (카카오·토스) → 소액 즉시
4. **시중은행 사업자대출** → 거액·장기
5. **카드사 매출담보·핀테크 선정산** → 단기 응급
6. **(절대 피할 것) 등록 대부업·불법 사채**

**보조금만 노리면 안 되는 이유**: 예산이 정책자금의 1/2.5, 실제 수령률 낮음. **정책자금 기본 확보 + 보조금 추가 노리는 전략**.
""",
            keywords: ["대출", "보조금", "지원금", "출자", "우선순위", "어느 게 먼저"],
            sources: [
                FAQSource(label: "2026 소상공인 지원정책 — KB Think", url: "https://kbthink.com/business/tips/business-support-policy.html"),
                FAQSource(label: "중기부 2026 예산", url: "https://billioninsight.com/benefits/%EC%86%8C%EC%83%81%EA%B3%B5%EC%9D%B8-%EC%A7%80%EC%9B%90%EC%A0%95%EC%B1%85/"),
            ],
            lastVerified: "2026-05-18"
        ),
        LoanFAQEntry(
            id: "internet-vs-traditional-bank",
            category: .credit,
            question: "인터넷전문은행 vs 시중은행 — 사장님 대출?",
            answer: """
**카카오뱅크 개인사업자 신용대출**: 최저 연 **3%대**, 최대 한도 **3억원**. 컨설팅·제휴카드 이용 시 최대 0.6%p 우대. 100% 비대면.
**카카오뱅크 사장님 보증서대출 / 대환 갈아타기**: 2026.3.18부터 온라인 비대면 대환 가능.
**토스뱅크 사장님 대출**: 일반 한도 1억 (비대면), **전문직은 최대 5억**. 중도상환수수료 없음.

**시중은행**:
- **IBK기업은행**: 정책자금 대리대출 강점
- **KB국민**: 비대면 한도 약 2억, 보증서 연계
- **신한·우리·하나·NH농협**: 매출연동·전문직 우대. 5~10억+ 한도 가능, 영업점 방문 필요

| 구분 | 인터넷전문 | 시중은행 |
|---|---|---|
| 신청 | 100% 비대면, 5~30분 | 영업점·서류 |
| 금리 | 3%대~ (저신용 거절) | 4~8% |
| 한도 | 1~3억 (전문직 5억) | 5~10억+ |
| 우대 | 매출연동·전문직 자동심사 | 정책자금·보증 연계 풍부 |
| 추천 | 소액·단기·간편 | 거액·장기·보증부 |

**권장 순서**: 정책자금 → 인터넷전문 (소액 즉시) → 시중은행 (거액·장기) → 카드/핀테크 (단기 응급).

⚠️ 2026.3 대환 데이터 기준 5,200건 신청 중 50건만 실행 — 신용·매출·기존부채 조건 충족 필수.
""",
            keywords: ["카카오뱅크", "토스뱅크", "사장님 대출", "인터넷은행", "시중은행", "비대면", "기업은행"],
            sources: [
                FAQSource(label: "카카오뱅크 개인사업자 신용대출", url: "https://www.kakaobank.com/products/sohoLoan"),
                FAQSource(label: "카카오뱅크 사장님 갈아타기", url: "https://www.kakaobank.com/products/sohoRefinance"),
                FAQSource(label: "토스뱅크", url: "https://www.tossbank.com/"),
            ],
            lastVerified: "2026-05-18"
        ),

        // ─── 주의 ───
        LoanFAQEntry(
            id: "card-revenue-secured-loan",
            category: .risk,
            question: "카드사 매출담보 대출·선정산 — 안전한가?",
            answer: """
카드사 매출담보 대출은 **카드사가 가맹점에 지급할 정산금을 담보로 한 단기 자금**. 최근 **선정산 서비스** (카드매출 D+1 지급) 로 핀테크 확산.

**주요 제공처 (2026.5)**:
- 카드사 직접: KB·신한·삼성·하나카드 가맹점 운전자금
- 핀테크: **올라핀테크** (누적 선정산 5조 돌파), **데일리페이** (스마트로 협약), **바다핀테크**, **페이히어**

**금리**: 카드론 일반 연 11~17%, 현금서비스 16~18%. 매출담보·선정산은 단기 (7~30일) 수수료형 → 연 환산 8~20% 수준.

**장점**:
1. 매출 실적 기반 → 신용점수 영향 적음
2. 비대면 즉시 (최단 1일)
3. 정책자금 대기 중 단기 브릿지로 활용

**단점**:
1. 정책자금 (2~3%)·은행 (5~8%) 보다 훨씬 높음
2. 매출 급감 시 정산금 줄어 상환 압박
3. 카드사·핀테크 의존도 ↑ 시 재계약·한도 변경 위험

**권장**: 정책자금 → 시중은행 → 인터넷전문 → **그 다음** 카드사 매출담보. **단기 응급용**, 장기 운영자금으로는 부적합.
""",
            keywords: ["카드사", "매출담보", "선정산", "올라핀테크", "데일리페이", "단기", "카드론"],
            sources: [
                FAQSource(label: "2026 카드론 금리 — 뱅크샐러드", url: "https://www.banksalad.com/articles/%EC%B9%B4%EB%93%9C%EB%A1%A0-%EB%B9%84%EA%B5%90-%ED%9B%84%EA%B8%B0-%ED%8F%AC%ED%95%A8"),
                FAQSource(label: "올라핀테크 5조 돌파", url: "https://www.dnews.co.kr/uhtml/view.jsp?idxno=202506250845543900230"),
            ],
            lastVerified: "2026-05-18"
        ),
        LoanFAQEntry(
            id: "p2p-lending-warning",
            category: .risk,
            question: "P2P·핀테크 대출 — 자영업자 주의점?",
            answer: """
P2P 대출은 2020년 「온라인투자연계금융업법」 시행 후 **금융위 등록 업체만 영업 가능**. 등록 외 영업은 **불법 대부업**.

**정식 등록 플랫폼**: 8퍼센트, 렌딧, 어니스트펀드, 피플펀드, 투게더펀딩 등. 전체 명단은 **온라인투자연계금융협회 mla.or.kr** 및 **P2P센터 p2pcenter.or.kr** 에서 확인.

**금리**: 신용대출 통상 **연 8~19.9%** (법정 최고 20% 이내).

**2026.4 금감원 경보 — 사기 패턴**:
1. 합법 등록업체 **사칭** 가짜 사이트·문자
2. **'신용회복 가능'·'무직 가능'·'무서류 즉시 입금' 광고 → 거의 100% 불법**
3. 청년층 노린 **'돌림대출'** (여러 업체 돌려막기)
4. 선이자·중개수수료 명목 과도 수취

**확인 방법 (반드시)**:
1. 금감원 **파인 fine.fss.or.kr** → 제도권 금융회사 조회
2. **온라인투자연계금융협회 mla.or.kr** → 정식 P2P 명단
3. **P2P센터 p2pcenter.or.kr** → 중앙기록관리
4. 등록번호·대표자·주소·전화 일치 확인

**자영업자 주의**:
- 정책자금 (2~3%)·은행 (5~8%) 가능하면 P2P 까지 갈 필요 X
- 사업자 P2P 연체 시 사업자명·대표자 신용 모두 손상
- 동일 차주 다수 대출 권유 (분산투자 한도 위반) 는 위법
""",
            keywords: ["P2P", "핀테크", "사기", "불법", "고금리", "신용회복 가능", "무직 가능"],
            sources: [
                FAQSource(label: "온라인투자연계금융협회", url: "https://mla.or.kr/"),
                FAQSource(label: "P2P센터", url: "https://www.p2pcenter.or.kr/serviceintro/p2pfinanceintro/introducep2p"),
                FAQSource(label: "금융위 P2P 유의", url: "https://www.fsc.go.kr/no010101/75829"),
            ],
            lastVerified: "2026-05-18"
        ),
        LoanFAQEntry(
            id: "policy-fund-rejection-reasons",
            category: .policy,
            question: "정책자금 부결 — 왜 떨어졌을까?",
            answer: """
**가장 흔한 부결 사유** (2026 기준):

1. **신용점수 미달** — NICE/KCB **745점 미만** (일반 자금), 600점 미만 (저신용 자금도 어려움)
2. **연체 이력** — 최근 1년 내 3회+ / 90일+ 연체 / 금융채무 불이행자 등록
3. **세금 체납** — 국세·지방세 미납 (사업자 의무 위반으로 즉시 부결)
4. **매출 부족** — 부가세 신고 매출이 자격 기준 미달 (업종별)
5. **업종 부적격** — 사행성·유흥·도소매 등 일부 정책자금 대상 제외
6. **상시근로자 초과** — 광·제·건·운 10인 / 그 외 5인 미만 기준 위반
7. **중복 수혜** — 최근 5년 내 정책자금 3회+ 수혜 또는 졸업 미해당
8. **휴·폐업** — 신청 시점 영업 안 함 (재도전특별자금은 예외)

**부결 후 대응**:
1. **부결 사유 확인** — 소진공 콜센터 1357 또는 신청 플랫폼에서 사유 코드
2. **신용 회복 6개월** — 자동이체·통신비 성실 + 한도 소진율 30% 이내
3. **세금 체납 정리**
4. **지역신보 보증부** 대출로 우회 시도
5. **새출발기금** (연체자 채무조정) 또는 신용회복위원회 상담

⚠️ '부결 통과 컨설팅' 광고는 대부분 불법 — 절대 수수료 지불 X.
""",
            keywords: ["부결", "떨어졌", "거절", "탈락", "안 되", "왜"],
            sources: [
                FAQSource(label: "정책자금 부결 사유", url: "https://thelifelovewith.com/2026-small-business-fund-rejection-reasons/"),
                FAQSource(label: "소상공인 정책자금 안내", url: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc"),
            ],
            lastVerified: "2026-05-18"
        ),
    ]

    /// 사용자 질문 텍스트로 매칭. 최대 3개 (점수 순).
    public static func match(_ userQuestion: String) -> [LoanFAQEntry] {
        let q = userQuestion.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard q.count >= 2 else { return [] }
        let scored: [(entry: LoanFAQEntry, score: Int)] = entries.map { entry in
            var score = 0
            for kw in entry.keywords {
                let lk = kw.lowercased()
                if q == lk { score += 100 }
                else if q.contains(lk) { score += 30 }
                else if lk.count >= 3 && lk.contains(q) { score += 20 }
            }
            let lq = entry.question.lowercased()
            if q.count >= 3 && lq.contains(q) { score += 15 }
            if q.count >= 4 && entry.answer.lowercased().contains(q) { score += 5 }
            return (entry, score)
        }
        return scored.filter { $0.score > 0 }
            .sorted { $0.score > $1.score }
            .prefix(3)
            .map { $0.entry }
    }
}
