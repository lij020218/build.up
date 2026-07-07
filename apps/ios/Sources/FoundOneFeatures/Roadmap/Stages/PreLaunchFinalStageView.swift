//
//  PreLaunchFinalStageView.swift — 오픈 최종 점검 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/PreLaunchFinalStage.tsx
//  stageId: "pre-launch-final"
//
//  4-page (가로 스크롤 탭바):
//    pg 0 — 왜 중요한가
//    pg 1 — 오픈 전 점검 (최종 체크리스트)
//    pg 2 — 오픈 당일 운영 스크립트
//    pg 3 — 홍보 타임라인 (D-7 ~ D+7)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - Cluster 분기 (웹 SSOT: PreLaunchFinalStage.tsx isStartup/isOnline/offline)

private enum PreLaunchCluster {
    case offline   // 외식·카페·미용·피트니스·교육·펫·생활서비스·공간·소매
    case online    // 온라인 커머스
    case startup   // 스타트업·테크

    static func from(industryId: String) -> PreLaunchCluster {
        let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? ""
        switch cid {
        case "startup-tech":   return .startup
        case "online-digital": return .online
        default:               return .offline
        }
    }

    var noun: String {
        switch self {
        case .offline: return "오픈"
        case .online:  return "오픈"
        case .startup: return "출시"
        }
    }

    var helperText: String {
        switch self {
        case .offline: return "음식점·카페·소매 폐업 1위 사유는 '준비 부족'. 오픈 직전 72시간 체크리스트를 통과한 가게는 첫 달 생존율이 확연히 높습니다."
        case .online:  return "온라인 첫 1주는 자기 주문 → 포장 → 송장 → 발송 1사이클 완주가 핵심. 알림받기 100명 + 박스·완충재·라벨 5묶음 백업 권장."
        case .startup: return "출시 = 끝이 아니라 시작. D-Day 화·수 12:01 PT + 베타 사용자 10명 명단 + 프로덕션 배포 + 결제 1사이클 + D-28~D+14 13개 알림 봉인."
        }
    }

    var advanceLabel: String {
        switch self {
        case .offline: return "그랜드 오픈 시작!"
        case .online:  return "스토어 오픈!"
        case .startup: return "런칭!"
        }
    }

    var stageEyebrow: String {
        switch self {
        case .offline: return "단계 · 오픈 최종 점검"
        case .online:  return "단계 · 스토어 최종 점검"
        case .startup: return "단계 · 런칭 최종 점검"
        }
    }

    var preCheckSectionTitle: String {
        switch self {
        case .offline: return "오픈 전 필수 8개 항목"
        case .online:  return "오픈 전 필수 8개 항목"
        case .startup: return "런칭 전 필수 8개 항목"
        }
    }
}

public struct PreLaunchFinalStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "pre-launch-final"

    // 오픈 전 점검 (8 슬롯, 라벨은 cluster 별로 매핑됨)
    @AppStorage("plf.permit")      private var permitOK      = false
    @AppStorage("plf.equipment")   private var equipmentOK   = false
    @AppStorage("plf.stock")       private var stockOK       = false
    @AppStorage("plf.staff")       private var staffOK       = false
    @AppStorage("plf.pos")         private var posOK         = false
    @AppStorage("plf.hygiene")     private var hygieneOK     = false
    @AppStorage("plf.emergency")   private var emergencyOK   = false
    @AppStorage("plf.insurance")   private var insuranceOK   = false

    // 당일 운영 (4 슬롯)
    @AppStorage("plf.dayOpen")     private var dayOpenOK     = false
    @AppStorage("plf.dayBriefing") private var dayBriefingOK = false
    @AppStorage("plf.dayPhoto")    private var dayPhotoOK    = false
    @AppStorage("plf.dayFeedback") private var dayFeedbackOK = false

    // 완료 플래그
    @AppStorage("plf.done")        private var launchDone    = false

    private var currentInputs: [String: String] {
        ["permit": "\(permitOK)", "equipment": "\(equipmentOK)", "stock": "\(stockOK)", "staff": "\(staffOK)",
         "pos": "\(posOK)", "hygiene": "\(hygieneOK)", "emergency": "\(emergencyOK)", "insurance": "\(insuranceOK)",
         "dayOpen": "\(dayOpenOK)", "dayBriefing": "\(dayBriefingOK)", "dayPhoto": "\(dayPhotoOK)", "dayFeedback": "\(dayFeedbackOK)",
         "done": "\(launchDone)"]
    }

    private var cluster: PreLaunchCluster { PreLaunchCluster.from(industryId: industryId) }

    // 2026-06-30 사장님 신고: 미용실인데 '조리대 살균·주방 설비·식자재' 등 음식 전용 점검이 뜸.
    //   오프라인을 업종군으로 분기 — food(음식·카페) / retail(소매) / service(미용·피트니스·반려·교육·생활).
    private enum OfflineKind { case food, retail, beauty, fitness, pet, space, service }
    private var offlineKind: OfflineKind {
        let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? ""
        switch cid {
        case "food", "cafe-dessert": return .food
        case "retail":               return .retail
        case "beauty":               return .beauty
        case "fitness":              return .fitness
        case "pet":                  return .pet
        // 무인·셀프 공간(스터디카페·독서실·파티룸·연습실) + 교육(학원·교습소)
        case "education", "space":   return .space
        default:                     return .service
        }
    }

    private var pages: [String] {
        switch cluster {
        case .offline: return ["왜 중요한가", "오픈 전 점검", "당일 운영", "홍보 타임라인"]
        case .online:  return ["왜 중요한가", "스토어 점검", "발송 1사이클", "런칭 홍보"]
        case .startup: return ["왜 중요한가", "런칭 전 점검", "D-Day 운영", "D-28~D+14"]
        }
    }

    // ── 페이지별 KEY ACTION (웹 PreLaunchFinalStage keyActions 1:1 미러) ──
    //   웹은 isStartup × cluster(online/offline) 분기, iOS 는 cluster 3분기.
    //   웹 page0 = "왜 중요한가" 역할 겸함 → iOS page 인덱스와 정렬.
    private var pageKeyActions: [BUStageKeyAction] {
        switch cluster {
        case .startup: return [
            .init(title: "론칭은 1일 이벤트가 아니라 6주 프로젝트 — 지금부터 베타 사용자 10명 확보",
                  detail: "Product Hunt #1 팀의 공통점: 4-6주 전 시작, 200+ first-hour supporters 사전 확보, 12:01 PT 화/수 게시. 2026 알고리즘은 업보트 수보다 댓글·체류 시간 가중."),
            .init(title: "Sentry + Slack 알람을 실제 에러로 1번 트리거 — '연결만' 끝내지 말고 '경보가 정말 울리는지' 확인",
                  detail: "프로덕션 배포 + 도메인 + SSL + 결제 실제 1건 성공 + 모든 모니터링 alarm 실제 트리거 테스트. 론칭 후 첫 30분이 가장 위험합니다."),
            .init(title: "역할 분담 = 버그 1명 / CS 1명 / 마케팅 1명 — 솔로면 우선순위만 명확히",
                  detail: "Product Hunt 12:01 PT 게시 → 메이커 코멘트 1번째 댓글로 'Ask Me Anything' → 인터뷰했던 고객 10명에게 개인 메시지. 업보트 부탁 X, '솔직한 피드백' 부탁 O."),
            .init(title: "D-7부터 매일 1개 행동 — 캘린더에 미리 등록하고 시작",
                  detail: "D-7 PH 예약 + 메일링 알림 / D-3 SNS 티저 + 데모 영상 / D-1 최종 배포 + 모니터링 / D-Day 06시 PT 게시 / D+1 핫픽스 + 감사 메시지 / D+7 첫 주 지표 리뷰."),
        ]
        case .online: return [
            .init(title: "첫 주문 처리 1번 모의 시뮬레이션 — 박스·완충재·송장 전부 준비",
                  detail: "스마트스토어 발송기한 (오늘출발 = 결제 당일 또는 +1영업일) 미준수 시 구매자 즉시 환불. 첫 리뷰 3개가 노출 순위 좌우. 실제 주문→포장→사진→발송까지 1번 끝까지 돌려보세요."),
            .init(title: "재고 시스템 실수량 vs 표시수량 일치 확인 — 품절·중복판매 방지",
                  detail: "스토어 카테고리·반품정책 최종 확인 + 카카오톡 채널/네이버 톡톡 CS 오픈 + 택배사 집하 시간 사전 확정. 2026 수수료 약 6.6%, 정산 3-4일."),
            .init(title: "주문 알림 즉시 확인 → 30분 내 발송 처리 워크플로 고정",
                  detail: "구매자 취소 요청 → 발송 미처리 시 즉시 환불 + 부정 리뷰. 알림 OFF 절대 금지. 송장번호 입력 시 오타 = 추적 불가 = 분쟁. 포장 사진 1장씩 보관."),
            .init(title: "오픈 7일 전부터 인스타 릴스 매일 1개 — 카운트다운 노출 누적",
                  detail: "D-7 첫 구매 쿠폰 + 오픈 예약 / D-3 릴스 언박싱 / D-1 최종 점검 / D-Day SNS 공유 + 첫 리뷰 요청 / D+7 데이터 분석 + 네이버 쇼핑광고 시작."),
        ]
        case .offline: return [
            .init(title: "첫 손님이 카드를 내미는 순간을 1번 리허설 — POS·단말기·Wi-Fi·영수증 한 번에",
                  detail: "2026 네이버 플레이스 알고리즘은 리뷰 수보다 클릭·전화·길찾기·체류 시간 가중. 첫 3개 리뷰가 향후 노출을 결정. 외식업 46.5%가 인력 감축한 시기 — 1인 운영이라면 동선 리허설이 더 중요."),
            .init(title: "카드 단말기·POS·Wi-Fi 백업 핫스팟까지 4중 점검 — 가장 흔한 오픈 사고 1순위",
                  detail: "단말기 결제·취소·영수증 출력 실제 테스트 + Wi-Fi 끊김 시 핫스팟 자동전환 확인 + 냉장고 온도 + 식자재 입고. 신규 매장 오픈 직후 첫 주에 가장 자주 일어나는 사고는 결제 실패와 인터넷 끊김."),
            .init(title: "직원 모의 운영 1시간 — 주문→제조→서빙→정산 한 사이클",
                  detail: "1인 운영이면 더 중요. 첫 러시(rush)에 손이 꼬이면 첫 리뷰가 1점이 됩니다. 비상 시나리오: 단말기 다운→현금, Wi-Fi 끊김→핫스팟, 식자재 소진→긴급 발주 연락처 미리 확보."),
            .init(title: "네이버 플레이스 등록 + 오픈 7일 전부터 인스타 1일 1콘텐츠 — '실제 방문 가능성' 시그널 누적",
                  detail: "2026 알고리즘은 등록만으로는 안 뜸. 검색→클릭→전화→길찾기→저장→재방문 흐름이 누적되어야 노출. 첫 주는 영수증 리뷰 이벤트 (할인 쿠폰)로 진성 리뷰 3개를 가장 빨리 만드는 게 핵심."),
        ]
        }
    }

    private var pageKeyAction: BUStageKeyAction {
        // 특수업종 KEY ACTION 우선 (업종 정확) — 없으면 페이지별 기본으로 폴백.
        let cid = StarterIndustryData.option(by: industryId)?.categoryId
        if let s = SpecialtyKeyActionRegistry.resolve(stageId: "pre-launch-final", specialtyId: industryId, categoryId: cid) {
            return BUStageKeyAction(title: s.title, detail: s.detail)
        }
        let arr = pageKeyActions
        let idx = min(max(page, 0), arr.count - 1)
        return arr[idx]
    }

    private var preChecks: [(String, Binding<Bool>)] {
        switch cluster {
        case .offline:
            switch offlineKind {
            case .food: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("주방 설비·기기 시운전 완료", $equipmentOK),
                ("1주일치 식자재·소모품 선입고", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("POS·키오스크·카드 단말기 테스트", $posOK),
                ("위생 점검 (냉장 온도·식기 소독)", $hygieneOK),
                ("비상 연락망·응급 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .retail: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("진열대·집기·조명 시운전 완료", $equipmentOK),
                ("초도 상품 입고·검수 + 진열·가격표 부착", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("POS·바코드·카드 단말기 테스트", $posOK),
                ("매장 청결·도난방지 태그·CCTV 점검", $hygieneOK),
                ("비상 연락망·응급 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .beauty: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("시술 기기 시운전·세팅 완료", $equipmentOK),
                ("시술재료·소모품·린넨·1회용품 선입고", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("POS·예약 시스템·카드 단말기 테스트", $posOK),
                ("위생 점검 (기구 소독·환기·손 세정·1회용품)", $hygieneOK),
                ("비상 연락망·응급 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .fitness: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("운동기구 시운전 + 볼트·케이블·비상정지 안전 점검", $equipmentOK),
                ("수건·소독제·매트 등 소모품 선입고", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("회원권 정기결제·출입 시스템·카드 단말기 테스트", $posOK),
                ("샤워·락커·환기 점검 + 응급키트 비치", $hygieneOK),
                ("비상 연락망·부상 대응 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .pet: return [
                ("인허가·동물위탁관리업 등록 원본 보관 및 게시", $permitOK),
                ("미용대·케이지·기기 시운전·세팅 완료", $equipmentOK),
                ("소독제·타월·배변패드 등 소모품 선입고", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("POS·예약/차트 시스템·카드 단말기 테스트", $posOK),
                ("위생·안전 (케이지 소독·CCTV 30일·환기·탈출방지)", $hygieneOK),
                ("비상 연락망·동물 응급 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .space: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("무인 1사이클 (키오스크·좌석발권·출입·연장) 작동 확인", $equipmentOK),
                ("음료·프린터 용지·청소용품 등 비품 선입고", $stockOK),
                ("무인 운영 매뉴얼·원격 관리자 지정", $staffOK),
                ("키오스크·앱 결제·출입 통제 시스템 테스트", $posOK),
                ("안전 (소방·전열교환기 환기 CO₂·CCTV·비상벨)", $hygieneOK),
                ("비상 연락망·원격 대응 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            case .service: return [
                ("인허가·영업신고 원본 보관 및 게시", $permitOK),
                ("작업 장비·기기 시운전·세팅 완료", $equipmentOK),
                ("작업 자재·소모품 선입고", $stockOK),
                ("직원 최종 역할 배정·교육 완료", $staffOK),
                ("POS·접수/예약 시스템·카드 단말기 테스트", $posOK),
                ("작업 공간·장비 위생·안전 점검 + 보호장비", $hygieneOK),
                ("비상 연락망·응급 절차 공유", $emergencyOK),
                ("영업배상·화재보험 가입 확인", $insuranceOK),
            ]
            }
        case .online: return [
            ("사업자등록증·통신판매업 신고증 게시", $permitOK),
            ("스토어 카테고리·상세페이지·반품정책 최종 검수", $equipmentOK),
            ("박스·완충재·테이프·송장 라벨지 5묶음 백업 입고", $stockOK),
            ("CS 채널 (카톡 채널·톡톡) 응대 템플릿 5종 준비", $staffOK),
            ("결제 (PG·네이버페이·카카오페이) 100원 실거래 테스트", $posOK),
            ("자기 주문 → 포장 → 송장 → 발송 1사이클 완주", $hygieneOK),
            ("환불·교환 정책 페이지 게시 (PIPA 2025 준수)", $emergencyOK),
            ("배송 분쟁 대비 포장 사진 자동 저장 워크플로", $insuranceOK),
        ]
        case .startup: return [
            ("프로덕션 배포 + 도메인·SSL 작동 확인", $permitOK),
            ("Sentry/Slack 알람 — 실제 에러 트리거 검증", $equipmentOK),
            ("결제 (Stripe/Toss) 100원 실거래 + 환불 1사이클", $stockOK),
            ("베타 사용자 10명 명단 + 24시간 환영 메일", $staffOK),
            ("분석 (PostHog·Mixpanel) 5개 핵심 이벤트 발화 확인", $posOK),
            ("이용약관·개인정보처리방침 게시 + 동의 분리 + AI 기능 있으면 고지·산출물 표시(AI 기본법 2026.1.22, 계도중) + 자동결정 거부·설명 창구 + 외국 법인이면 국내대리인", $hygieneOK),
            ("D-28~D+14 13개 캘린더 알림 + Product Hunt D-7 예약", $emergencyOK),
            ("응급 대응 매뉴얼 5종 — 결제 장애·DB 다운·바이럴 트래픽", $insuranceOK),
        ]
        }
    }

    private var dayChecks: [(String, Binding<Bool>)] {
        switch cluster {
        case .offline:
            switch offlineKind {
            case .food: return [
                ("오픈 1시간 전 조리·홀 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·동선·메뉴 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            case .retail: return [
                ("오픈 1시간 전 진열·매장 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·동선·재고 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            case .beauty: return [
                ("오픈 1시간 전 시술공간·기구 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·예약·동선 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            case .fitness: return [
                ("오픈 1시간 전 기구·시설 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·안전·동선 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            case .pet: return [
                ("오픈 1시간 전 미용공간·케이지 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·예약·동물 안전 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            case .space: return [
                ("오픈 전 무인 결제·출입·좌석발권 1사이클 원격 확인", $dayOpenOK),
                ("CCTV·비상벨·원격 관리 시스템 작동 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 원격 모니터링 로그·이상 여부 15분 점검", $dayFeedbackOK),
            ]
            case .service: return [
                ("오픈 1시간 전 작업공간·장비 세팅 완료", $dayOpenOK),
                ("직원 조회 — 역할·접수·동선 최종 확인", $dayBriefingOK),
                ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
                ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
            ]
            }
        case .online: return [
            ("주문 알림 30분 룰 — 첫 주문 즉시 발송 시작", $dayOpenOK),
            ("톡톡·카톡 채널 12시간 SLA — 첫날 문의 100% 답변", $dayBriefingOK),
            ("첫 발송 패키지 언박싱 사진 SNS 게시", $dayPhotoOK),
            ("첫날 매출·전환율·이탈률 15분 회고", $dayFeedbackOK),
        ]
        case .startup: return [
            ("D-Day 화·수 12:01 PT 발사 + 모든 채널 동시 공유", $dayOpenOK),
            ("응답 SLA — 모든 댓글·메시지 24시간 내 회신", $dayBriefingOK),
            ("핵심 funnel (가입→전환) 시간대별 모니터링", $dayPhotoOK),
            ("D+1 회고 — 핵심 5개 지표 + 다음 주 액션", $dayFeedbackOK),
        ]
        }
    }

    private var preCheckCount: Int { preChecks.filter { $0.1.wrappedValue }.count }
    private var dayCheckCount: Int  { dayChecks.filter  { $0.1.wrappedValue }.count }

    public init() {}

    private var allDone: Bool {
        preCheckCount == preChecks.count && dayCheckCount == dayChecks.count
    }

    private var advanceHint: String {
        if !allDone { return "체크리스트 \(preCheckCount + dayCheckCount)/\(preChecks.count + dayChecks.count) — 모두 완료 후 그랜드 오픈" }
        return "모든 체크 완료 — 그랜드 오픈 가능!"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "개업 최종 준비",
            stageEyebrow: cluster.stageEyebrow,
            helperText: cluster.helperText,
            canAdvance: allDone,
            advanceLabel: cluster.advanceLabel,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                launchDone = true
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: {
                launchDone = false
                roadmapStore.uncompleteStage(stageId)
            },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                // 2026-07-06 정합: wrapup 이 flat 오프라인(소방완비·POS·조리/홀·배달앱)이라 online 셀러에도 노출되던 것 → cluster 분기
                doneItems: cluster == .startup ? [
                    .init(label: "1. 출시 D-7 점검", detail: "프로덕션 배포·에러 추적·상태 페이지 작동 확인 + 가입→온보딩→결제 플로우 라이브 완주"),
                    .init(label: "2. 런치 이벤트", detail: "런치 데이 — Product Hunt·커뮤니티·앱스토어 공지 + 첫 사용자 온보딩 지원"),
                    .init(label: "3. 초기 레퍼런스 확보", detail: "첫 사용자 후기·레퍼런스 3건 확보 (인터뷰·커뮤니티·케이스)"),
                    .init(label: "4. D+7 데이터 수집", detail: "가입·활성(WAU)·전환·리텐션 4개 지표 매일 모니터링"),
                ] : cluster == .online ? [
                    .init(label: "1. 스토어·상세페이지 최종 점검", detail: "상세페이지·옵션·가격·결제 라이브 확인 (실물은 재고·포장재 / 디지털은 전달·다운로드 방식)"),
                    .init(label: "2. CS·배송/전달 운영 준비", detail: "카톡/네이버 톡톡 CS 오픈 + 실물은 택배사 집하·포장재, 디지털은 자동 전달·다운로드 점검"),
                    .init(label: "3. 오픈 프로모션 확정", detail: "첫 구매 혜택·알림받기 쿠폰·인스타 리뷰 이벤트 + SNS 사전 공지"),
                    .init(label: "4. D+7 데이터 수집", detail: "재구매율·전환율·문의·주문량 4개 지표 매일 모니터링"),
                ] : [
                    .init(label: "1. 인허가·시설 최종 점검", detail: "영업신고증·소방완비증명·POS·CCTV·간판 모두 작동 확인"),
                    .init(label: "2. 직원 교육·역할 분담", detail: "주문/조리/홀/캐셔 역할별 매뉴얼·동선 리허설 완료"),
                    .init(label: "3. 그랜드 오픈 일정 확정", detail: "오픈 날짜·시간·할인 캠페인 + SNS 사전 공지 (1주 전 권장)"),
                    .init(label: "4. 비상 대응 시뮬", detail: "결제 장애·과주문·민원 시 행동 매뉴얼 숙지 (현금 비상금 50만원+)"),
                ],
                verifyItems: cluster == .startup ? [
                    "결제·빌링 — 구독·과금 테스트(가입·해지·환불) 통과 + 에러 모니터링·알림·장애 대응 절차·담당 확정",
                    "개인정보 처리방침·이용약관(+GDPR) 사전 게시 — Product Hunt·해외 트래픽 대응",
                    "표시·광고 — 「최저가」「1위」 근거, 인플루언서 「유료광고」 표시, 자작·바이럴 리뷰 금지",
                    "런웨이 — 번레이트 대비 생존 개월 확인 + 다음 마일스톤(투자·매출) 역산",
                    "초기 사용자 확보 — 런치 채널별 목표 + 첫 100 유저 유입·활성화 계획",
                    "첫 주 운영 자금 — 인프라·마케팅비 선지출 대비 현금 버퍼 확보",
                ] : cluster == .online ? [
                    "상세페이지 필수 표시정보(사업자 정보·반품/교환 조건) + 실물은 KC 인증·재고, 디지털은 전달 방식·라이선스까지 최종 점검",
                    "결제·정산 — 통신판매업 신고번호 노출 + 결제 테스트(5천·5만·10만원) 통과 + 정산 계좌 확인",
                    "표시·광고 — 「최저가」「1위」 근거 필수, 인플루언서 「유료광고」 표시, 자작·바이럴 리뷰 금지",
                    "재고·소싱(실물) / 콘텐츠·라이선스(디지털) — 첫 1주 판매·제공 가능량 + 재발주·업데이트 확보",
                    "네이버 쇼핑 상품 리뷰·인스타·블로그 — 첫 리뷰 3~5개 확보 계획 (테스트 주문 1사이클 완주 후)",
                    "첫 주 운영 자금 — 정산 전 광고비·매입/제작비 선지출 대비 현금 버퍼 확보",
                ] : [
                    "사업자등록증·영업신고증·소방완비증명서·위생교육 수료증 — 모두 매장 비치 (현장 점검 대비)",
                    "POS·카드 단말기·키오스크 24시간 무중단 결제 테스트 통과 (5천원·5만원·10만원 모두 결제 OK)",
                    "직원 4대보험 가입·근로계약서·급여 자동이체 — 모두 완료 (오픈일 분쟁 0)",
                    "재고·식자재 — 첫 1주 운영 가능량 + 1일 추가 발주 가능 공급선 확보",
                    "SNS·네이버 플레이스·배달 앱(배민/쿠팡이츠) — 모두 등록 완료 + 첫 리뷰 5개 이상 확보 계획",
                    "그랜드 오픈 첫 주 운영 자금 — 매출 0원 가정 1주 운영 가능한 현금 300만원+ 확보",
                ],
                nextStageLabel: "실전 운영 (대시보드)",
                nextSummary: "오픈·그랜드오픈·D+7 준비 완료 → 로드맵 전 과정 수료, 마이 대시보드 실전 운영(매출·재고·CS) 시작"
            ),
            currentPage: page,
            totalPages: pages.count,
            keyActionOverride: pageKeyAction
        ) {
            VStack(alignment: .leading, spacing: 16) {
                // 가로 스크롤 탭바 (4개 탭)
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: whyPage
                    case 1: preCheckPage
                    case 2: dayPage
                    default: prPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 최종 점검 · 왜 중요한가")
                    Text("첫날은 두 번 없다 —\n오픈 전 72시간이 운명을 바꾼다")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("음식점 폐업의 주요 원인 1순위는 '준비 부족'. 오픈 직전 72시간 체크리스트를 통과한 가게는 첫 달 생존율이 확연히 높습니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 직전 72시간 — 무엇을 해야 하나")
                    let items: [(String, String, String)] = [
                        ("D-3", "최종 식자재 발주 + 설비 시운전", "cart"),
                        ("D-2", "직원 최종 교육 + POS 실전 테스트", "person.2"),
                        ("D-1", "홀·주방 대청소 + SNS 예고 게시물", "sparkles"),
                        ("D-Day", "오픈 1시간 전 세팅 + 조회 + 사진 기록", "flag.fill"),
                    ]
                    ForEach(items, id: \.0) { day, task, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                                Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            warningCard(title: "이것만큼은 절대 미루지 말 것", items: [
                "인허가·영업신고필증 — 게시 의무 위반 시 즉시 영업정지",
                "POS 실전 결제 테스트 — 오픈 당일 결제 불가 시 고객 이탈",
                "식자재 냉장 온도 기록 — 위생점검 시 1순위 확인 항목",
            ], color: BUColor.warn)
        }
    }

    // MARK: - pg 1 오픈 전 점검

    private var preCheckPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("오픈 전 점검 체크리스트")
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("\(preCheckCount)").font(.system(size: 32, weight: .bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                        Text("/ \(preChecks.count) 항목 완료").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.inkMuted)
                    }
                    ProgressView(value: Double(preCheckCount), total: Double(preChecks.count))
                        .tint(BUColor.midnight).padding(.top, 4)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(cluster.preCheckSectionTitle)
                    ForEach(preChecks, id: \.0) { label, binding in
                        Toggle(isOn: binding) {
                            Text(label)
                                .font(BUFont.bodySmall)
                                .foregroundStyle(binding.wrappedValue ? BUColor.inkMuted : BUColor.ink)
                                .strikethrough(binding.wrappedValue, color: BUColor.inkMuted)
                        }.tint(BUColor.midnight)
                        if preChecks.last?.0 != label { Divider() }
                    }
                }
            }

            if preCheckCount == preChecks.count {
                BUCard(.hero) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: "checkmark.seal.fill").font(.system(size: 24)).foregroundStyle(BUColor.success)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("오픈 전 점검 완료!").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                            Text("이제 자신 있게 오픈 당일을 맞이하세요.").font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 당일 운영

    private var dayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 당일 운영 체크리스트")
                    ForEach(dayChecks, id: \.0) { label, binding in
                        Toggle(isOn: binding) {
                            Text(label).font(BUFont.bodySmall)
                                .foregroundStyle(binding.wrappedValue ? BUColor.inkMuted : BUColor.ink)
                                .strikethrough(binding.wrappedValue, color: BUColor.inkMuted)
                        }.tint(BUColor.midnight)
                        if dayChecks.last?.0 != label { Divider() }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 당일 운영 스크립트")
                    let scripts: [(String, String, String)] = [
                        ("-1h", "세팅 완료", "홀 테이블·주방 기기·냉장고·POS 최종 점검. 직원 출근 확인."),
                        ("-30m", "직원 조회", "오늘 메뉴·역할·동선·비상 연락망 5분 브리핑."),
                        ("오픈", "문열기", "간판 켜기·오픈 사진 SNS 게시·환영 멘트 준비."),
                        ("+2h", "중간 점검", "재료 소진 상황·홀 혼잡도·POS 현황 체크."),
                        ("마감", "정산·피드백", "하루 매출 확인·직원 피드백 미팅 15분·내일 발주 결정."),
                    ]
                    ForEach(scripts, id: \.0) { time, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(time).font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                                .frame(width: 38, alignment: .trailing).padding(.top, 1)
                            Rectangle().fill(BUColor.midnight.opacity(0.2)).frame(width: 1).padding(.top, 4)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $launchDone) {
                    Text("오픈 최종 점검 완료 — 그랜드 오픈!").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 3 홍보 타임라인

    private var prPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("홍보 타임라인")
                    Text("오픈 전후 2주 — 비용 0원 홍보 로드맵")
                        .font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                    Text("SNS 팔로워가 없어도 됩니다. 네이버 플레이스 등록 + 지인 초대만으로 첫 주 리뷰 10개를 확보하는 것이 목표.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 전 홍보 (D-7 ~ D-1)")
                    let prePR: [(String, String)] = [
                        ("D-7", "네이버 플레이스 등록 + 사진 10장 이상 업로드"),
                        ("D-5", "카카오톡 채널 개설 + 지인 300명에게 오픈 소식 공유"),
                        ("D-3", "인스타그램 '오픈 D-3' 카운트다운 스토리 게시"),
                        ("D-1", "\"내일 오픈\" 스토리 + 첫 방문 혜택 예고 (ex: 음료 서비스)"),
                    ]
                    ForEach(prePR, id: \.0) { day, task in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 32, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 후 홍보 (D+1 ~ D+7)")
                    let postPR: [(String, String)] = [
                        ("D+1", "첫날 매출·손님 반응 인스타 스토리 공유 (생생한 현장감)"),
                        ("D+3", "첫 리뷰어 감사 DM + 네이버 플레이스 사장 댓글 시작"),
                        ("D+5", "\"이번 주 추천 상품·서비스\" 콘텐츠 게시 (사진 퀄리티 집중)"),
                        ("D+7", "첫 주 결산 — 리뷰 수·방문자·인기 메뉴 정리 후 다음 주 계획"),
                    ]
                    ForEach(postPR, id: \.0) { day, task in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.success).frame(width: 32, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("비용 0원 홍보 우선순위")
                    let tips: [(String, String)] = [
                        ("네이버 플레이스 사진 최적화", "리뷰 평점·사진 개수가 로컬 검색 순위 결정"),
                        ("지인 리뷰 요청 (첫 10개)", "첫 달 리뷰 10개 = 알고리즘 초기 부스트"),
                        ("인스타 스토리 일 1회", "팔로워 없어도 해시태그로 지역 노출"),
                    ]
                    ForEach(tips, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "star.fill").foregroundStyle(BUColor.warn).font(.system(size: 10)).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func warningCard(title: String, items: [String], color: Color) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("PreLaunchFinal") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["pre-launch-final"] }
    return PreLaunchFinalStageView().environment(store)
}
#endif
