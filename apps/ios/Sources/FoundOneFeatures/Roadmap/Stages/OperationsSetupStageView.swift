//
//  OperationsSetupStageView.swift — 운영 시스템 세팅 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/OperationsSetupStage.tsx
//  stageId: "operations-setup"
//
//  2026년 4월 검증 데이터:
//    배달앱: 배민·쿠팡이츠 차등 7.8/6.8/2.0%, 요기요 4.7~9.7%
//    POS: 토스플레이스 단말기+프로그램 무료 (월정액 0원~)
//    SNS: 네이버 플레이스 등록 후 노출 최대 7일 소요
//
//  3-page (세그먼트):
//    pg 0 — 배달 플랫폼 선택
//    pg 1 — POS 선택
//    pg 2 — SNS·마케팅 채널
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct OperationsSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "operations-setup"

    @AppStorage("ops.delivery.baemin")    private var deliveryBaemin   = false
    @AppStorage("ops.delivery.coupang")   private var deliveryCoupang  = false
    @AppStorage("ops.delivery.yogiyo")    private var deliveryYogiyo   = false
    @AppStorage("ops.delivery.naver")     private var deliveryNaver    = false

    @AppStorage("ops.pos.selected")       private var posSelected      = ""
    @AppStorage("ops.pos.menuDone")       private var posMenuDone      = false
    @AppStorage("ops.pos.payDone")        private var posPayDone       = false
    @AppStorage("ops.pos.receiptDone")    private var posReceiptDone   = false
    @AppStorage("ops.pos.settleDone")     private var posSettleDone    = false

    @AppStorage("ops.sns.naver")          private var snsNaver         = false
    @AppStorage("ops.sns.instagram")      private var snsInstagram     = false
    @AppStorage("ops.sns.kakao")          private var snsKakao         = false

    // 웹 SSOT 누락 3개 (2026-05-24 추가)
    @AppStorage("ops.brand.identityDone") private var brandIdentityDone  = false
    @AppStorage("ops.brand.cardMerchant") private var cardMerchantDone   = false
    @AppStorage("ops.brand.musicLicense") private var musicLicenseDone   = false
    // 2026-05-25 사장님 audit — 한국 음식점 의무 사항 누락 보완:
    //   • 현금영수증 의무발급 가맹점 가입 (부가가치세법 32조의2) — 10만원↑ 거래 시 의무
    //   • 옥외 간판 신고 (옥외광고물법 5조) — 벽면·돌출·입식 간판 구청 신고
    @AppStorage("ops.brand.cashReceiptDone")  private var cashReceiptDone   = false
    @AppStorage("ops.brand.signageReportDone") private var signageReportDone = false

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    /// 채널 페이지 라벨 — 클러스터별 (배달/예약/마켓플레이스).
    private var channelPageLabel: String {
        switch cluster.category {
        case .food, .cafeDessert:                       return "배달 플랫폼"
        case .beauty, .fitness, .pet, .education:       return "예약 플랫폼"
        case .retail, .onlineDigital:                   return "마켓플레이스"
        case .space, .livingService:                    return "예약·접수"
        default:                                        return "유입 채널"
        }
    }

    private var pages: [String] {
        cluster.category.isOffline
            ? [channelPageLabel, "POS 선택", "SNS 세팅"]
            : [channelPageLabel, "SNS 세팅"]
    }

    // MARK: - Cluster-aware channels (페이지 0)

    private struct ChannelOption {
        let id: String       // baemin/coupang/yogiyo/naver/etc.
        let name: String
        let tagline: String
        let desc: String
        let color: String    // hex
    }

    private var clusterChannels: [ChannelOption] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            .init(id: "baemin",  name: "배달의민족", tagline: "차등 수수료 7.8/6.8/2.0% · 국내 점유율 약 60%",   desc: "배민 사장님앱 울트라콜·오픈리스트 광고로 노출 확대 가능. 배달·가게배달 정산 체계 별도 확인.", color: "#00C73C"),
            .init(id: "coupang", name: "쿠팡이츠",    tagline: "차등 7.8/6.8/2.0% · 단건 배달 전문 · 와우 회원 노출", desc: "단건 배달로 배달 품질 최고. 쿠팡 브랜드 신뢰도 연계 신규 고객 유입.", color: "#E52222"),
            .init(id: "yogiyo",  name: "요기요",       tagline: "차등 4.7~9.7% · GS리테일 운영 · 요기패스 구독 연동", desc: "요기패스 구독 고객 우선 노출. 점유율 10~15% 하락세.", color: "#FF5A00"),
            .init(id: "naver",   name: "네이버 주문", tagline: "중개 수수료 0% (결제 수수료만) · 스마트플레이스 연동", desc: "네이버 지도 주문 버튼 자동 노출. 포장·테이블 주문 최적. 자체 배달망 없음.", color: "#03C75A"),
        ]
        case .beauty, .fitness, .pet, .education: return [
            .init(id: "baemin", name: "네이버 예약",   tagline: "월 사용료 0원 · 네이버 검색 1순위 노출 자동",        desc: "예약·결제·문자 알림·노쇼 위약금까지 통합. 미용·필라테스·반려동물·교육 모두 표준.", color: "#03C75A"),
            .init(id: "coupang", name: "캐치테이블",   tagline: "예약 수수료 1,000원/건 · 디저트·고급 식음료 강세 + 뷰티 확장", desc: "당일 예약·노쇼 보호금·예약 풀 알림. 캐치테이블 회원 풀 활용.", color: "#FF6B00"),
            .init(id: "yogiyo", name: "와이즈비 / 마이샵", tagline: "월 정액 (3만~) · 회원·예약·자동 결제 통합",      desc: "단골 관리·자동 결제·회원권 매출 추적. 미용·필라테스 운영 SaaS.", color: "#5B6BFF"),
            .init(id: "naver",  name: "카카오톡 채널", tagline: "무료 · 단골 단체 메시지 + 예약 신청 폼",            desc: "재방문 캠페인·재구매 알림용. 단골 LTV 핵심 채널.", color: "#FEE500"),
        ]
        case .retail, .onlineDigital: return [
            .init(id: "baemin",  name: "네이버 스마트스토어", tagline: "수수료 약 5.6% · 국내 1위 쇼핑 검색 노출",     desc: "스마트스토어 + 네이버페이 + 톡톡 통합. 신규 셀러 1순위.", color: "#03C75A"),
            .init(id: "coupang", name: "쿠팡 (Wing/마켓플레이스)", tagline: "수수료 카테고리별 8-15% · 로켓배송 입점 별도", desc: "와우 회원 1300만+ 노출. 단, 입점 심사·정산 주기 확인.", color: "#E52222"),
            .init(id: "yogiyo",  name: "11번가·G마켓·옥션",  tagline: "전통 오픈마켓 · 카테고리별 수수료 다름",        desc: "이베이코리아 통합 — 11번가·G마켓·옥션 한 번에 입점.", color: "#FF5A00"),
            .init(id: "naver",   name: "자체몰 (카페24·고도몰·아임웹)", tagline: "월 사용료 0~7만 + PG 수수료 3% · 브랜드 직판", desc: "마진 최대화 + CRM 자유. 트래픽은 직접 확보해야.", color: "#5B6BFF"),
        ]
        case .space, .livingService: return [
            .init(id: "baemin",  name: "네이버 예약 (생활)", tagline: "월 사용료 0원 · 청소·세탁·수리 서비스 검색 노출", desc: "출장 시간대·지역 선택·자동 알림. 생활 서비스 표준.", color: "#03C75A"),
            .init(id: "coupang", name: "스페이스클라우드 / 펀잇",   tagline: "공간 임대 플랫폼 · 시간제 예약 + 결제 통합",    desc: "스튜디오·파티룸·코워킹 시간제. 플랫폼 노출 확보.", color: "#FF6B00"),
            .init(id: "yogiyo",  name: "당근마켓 비즈",       tagline: "지역 기반 무료 광고 · 매장 위치 자동 노출",      desc: "동네 단골 확보 · 수수료 X. 지역 비즈 표준.", color: "#FF7E36"),
            .init(id: "naver",   name: "카카오톡 채널",        tagline: "무료 · 예약 신청 폼 + 단골 메시지",             desc: "재방문·연장 알림. 1:1 상담 채널.", color: "#FEE500"),
        ]
        case .startupTech: return [
            .init(id: "baemin", name: "Product Hunt", tagline: "전 세계 SaaS 런칭 채널 · 무료",           desc: "런칭 1회 룰 · 1-2주 사전 준비 필수 · D-Day 마케팅 집중.", color: "#DA552F"),
            .init(id: "coupang", name: "Hacker News (Show HN)", tagline: "개발자 풀 · 무료 · 24h 모니터링 필수",      desc: "기술 데모 위주 · 댓글 응답이 핵심 · 1주 후 fading.", color: "#FF6600"),
            .init(id: "yogiyo",  name: "디스콰이엇 / 빌드 인 퍼블릭",   tagline: "한국 빌더 커뮤니티 · 무료 · 베타 모집 효과", desc: "Marc Lou·Pieter Levels 패턴 — 매주 빌드 로그 1개.", color: "#191970"),
            .init(id: "naver",   name: "Twitter / X",   tagline: "Build in Public · DM 콜드 영업 핵심 채널",          desc: "Marc Lou 매출 70%+ 트위터 기여 — 매주 콘텐츠 1개+.", color: "#1DA1F2"),
        ]
        }
    }

    private func bindingFor(_ id: String) -> Binding<Bool> {
        switch id {
        case "baemin":  return $deliveryBaemin
        case "coupang": return $deliveryCoupang
        case "yogiyo":  return $deliveryYogiyo
        case "naver":   return $deliveryNaver
        default:        return .constant(false)
        }
    }

    private var clusterHelperText: String {
        switch cluster.category {
        case .food, .cafeDessert:
            return "네이버 플레이스 등록 후 검색 노출까지 최대 7일 — 오픈 1~2주 전 등록 필수. 배달앱 가입 후 메뉴 등록까지 2~3일 소요."
        case .beauty, .fitness, .pet, .education:
            return "네이버 예약·캐치테이블 등 예약 채널은 등록 즉시 검색 노출. POS 는 예약 통합 SaaS (와이즈비 등) 권장."
        case .retail, .onlineDigital:
            return "스마트스토어·쿠팡 마켓플레이스는 입점 심사 2-4주 — 첫 매출 전 신청 완료 필수. 자체몰은 PG 가입 1-2주 추가."
        case .space, .livingService:
            return "네이버 예약·당근 비즈 등 지역 기반 채널 등록 즉시 노출. 출장 시간대·지역 사전 설정."
        case .startupTech:
            return "Product Hunt·Hacker News 런칭은 1-2주 사전 준비 + D-Day 24h 모니터링 필수. 분석·결제·에러 스택 사전 설치."
        }
    }

    private var posTestsDone: Int {
        [posMenuDone, posPayDone, posReceiptDone, posSettleDone].filter { $0 }.count
    }

    private var posChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if posMenuDone    { s.insert("menu") }
                if posPayDone     { s.insert("pay") }
                if posReceiptDone { s.insert("receipt") }
                if posSettleDone  { s.insert("settle") }
                return s
            },
            set: { new in
                posMenuDone    = new.contains("menu")
                posPayDone     = new.contains("pay")
                posReceiptDone = new.contains("receipt")
                posSettleDone  = new.contains("settle")
            }
        )
    }

    private var canCompleteStage: Bool {
        if cluster.category.isOffline {
            return !posSelected.isEmpty && posTestsDone == 4 && snsNaver
                && brandIdentityDone && cardMerchantDone && musicLicenseDone
                && cashReceiptDone && signageReportDone
        } else {
            // 온라인·스타트업: 최소 1개 유입 채널 선택으로 완료
            return deliveryBaemin || deliveryCoupang || deliveryYogiyo || deliveryNaver
        }
    }

    private var advanceHint: String {
        if cluster.category.isOffline {
            if posSelected.isEmpty { return "POS 시스템을 선택하세요" }
            if posTestsDone < 4 { return "POS 설치 후 테스트 4단계 완료 (\(posTestsDone)/4)" }
            if !snsNaver { return "네이버 플레이스 등록은 필수입니다" }
            if !brandIdentityDone { return "간판·메뉴판·브랜드 자산 준비를 완료하세요" }
            if !cardMerchantDone { return "카드 가맹점 등록 완료를 체크하세요 (VAN 1주)" }
            if !musicLicenseDone { return "매장음악 저작권 등록을 확인하세요 (50㎡+)" }
            if !cashReceiptDone { return "현금영수증 의무발급 가맹점 가입을 확인하세요" }
            if !signageReportDone { return "옥외 간판 신고 (구청)를 완료하세요" }
        } else {
            let hasChannel = deliveryBaemin || deliveryCoupang || deliveryYogiyo || deliveryNaver
            if !hasChannel { return "최소 1개 유입 채널을 선택하세요" }
        }
        return "운영 시스템 셋업 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "운영 및 마케팅 준비",
            stageEyebrow: "단계 18 · 운영 시스템 세팅",
            helperText: clusterHelperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["pos": posSelected])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["pos": posSelected]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. POS·결제·주문 시스템 연동", detail: "토스플레이스/배민·쿠팡이츠 연동 + 키오스크·테이블 오더 셋업"),
                .init(label: "2. 표준 운영 매뉴얼", detail: "오픈·중간·마감 체크리스트 + 위생·재고·민원 대응 SOP"),
                .init(label: "3. 마케팅·브랜드 채널", detail: "네이버 플레이스·카카오 채널·인스타 3축 + 리뷰 응대 룰"),
                .init(label: "4. 손익 모니터링 셋업", detail: "일별 매출·재료비·인건비 자동 기록 + 손익분기 추적"),
                ],
                verifyItems: [
                "POS — 카드 수수료(평균 1.5~2.5%) + 정산일(평균 3영업일) 사전 인지, 현금 흐름 시뮬",
                "배달 플랫폼 — 수수료(배민 6.8%·쿠팡이츠 9.8% + 결제 수수료) 매출 분리 회계 셋업",
                "위생교육 매년 갱신 — 식품접객업 영업자·종업원 모두 대상, 미이수 시 행정처분 + 영업정지",
                "민원 대응 — 식약처·소비자원 신고 24시간 내 대응 룰 + 사진·영상 증빙 자동 보관 시스템",
                "원산지 표시 — 농수산물 원산지 표시법 위반 시 1억원 이하 과징금, 전 메뉴 표시 의무",
                "리뷰·SNS — 광고성 리뷰(가족·지인) 식별 시 처분 가능, 진성 리뷰 유도 시스템 우선",
                ],
                nextStageLabel: "프리오픈·본 오픈 준비",
                nextSummary: "POS·SOP·마케팅·손익 4축 셋업 완료 → 프리오픈·본 오픈 준비 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: deliveryPage
                    case 1 where cluster.category.isOffline: posPage
                    case 1: snsPage
                    default: snsPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 배달 플랫폼

    private var deliveryPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("\(channelPageLabel) (2026 수수료 기준)")
                    let platforms = clusterChannels
                    ForEach(platforms, id: \.id) { p in
                        deliveryRow(name: p.name, tagline: p.tagline, desc: p.desc, color: p.color, isOn: bindingFor(p.id))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("등록 체크포인트")
                    let tips = [
                        "메뉴 사진 고화질 필수 — 사진 없는 메뉴 주문율 40% 이하",
                        "가격은 매장 가격 + 배달비 구조 명확히 설정 (포장 가격 구분)",
                        "영업 시간·최소 주문 금액·배달 가능 지역 정확히 입력",
                    ]
                    ForEach(tips, id: \.self) { tip in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(tip).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 POS

    private var posPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("POS 시스템 선택 (\(cluster.categoryNounKo))")
                    let systems: [(String, String, String)] = [
                        ("토스플레이스",  "단말기·프로그램 무료 · D+1 정산 · 신규 점주 1순위", "toss"),
                        ("KIS정보통신",   "국내 POS 1위 · 전국 방문 A/S · 배달앱 자동 연동", "kis"),
                        ("오더플레이스",  "F&B 특화 태블릿 · 배민·쿠팡·요기요 통합 수신", "order"),
                        ("스마트로",      "카드 단말기 중심 · 소규모 최적 · 월정액 없음", "smartro"),
                        ("아임포스",      "태블릿+앱 · 매출 통계·재고 기본 · 다양한 요금제", "ipos"),
                    ]
                    ForEach(systems, id: \.0) { name, desc, id in
                        Button {
                            posSelected = posSelected == id ? "" : id
                        } label: {
                            HStack(spacing: BUSpacing.sm) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .fill(posSelected == id ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                        .frame(width: 32, height: 32)
                                    Image(systemName: "creditcard").font(.system(size: 12)).foregroundStyle(BUColor.midnight)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                                }
                                Spacer()
                                if posSelected == id {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success).font(.system(size: 18))
                                }
                            }
                            .padding(.vertical, 6).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUInteractiveChecklist(
                title: "POS 설치 후 필수 테스트 4단계",
                items: [
                    .init(id: "menu",    label: "메뉴·가격 전체 등록 확인",            detail: "옵션·추가금액·품절 여부까지 점검"),
                    .init(id: "pay",     label: "카드 실결제 1건 테스트 (즉시 취소)",  detail: "취소 안 하면 오픈 전 매출로 잡힘"),
                    .init(id: "receipt", label: "영수증 출력 — 사업자명·번호·부가세 확인", detail: "세금계산서 발행 시 이 정보가 기준"),
                    .init(id: "settle",  label: "일 마감·정산 시뮬레이션",            detail: "정산 금액 = 실 매출 합계인지 비교"),
                ],
                checked: posChecksBinding
            )
        }
    }

    // MARK: - pg 2 SNS

    private var snsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필수 SNS 채널 세팅")
                    Toggle(isOn: $snsNaver) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("네이버 플레이스").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                Text("필수 1순위").font(.system(size: 10, weight: .bold)).foregroundStyle(Color(hex: "03C75A"))
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(Color(hex: "03C75A").opacity(0.1), in: Capsule())
                            }
                            Text("맛집 검색의 80%가 네이버 — 미등록 시 검색 자체 불가. 등록 후 노출까지 최대 7일 → 오픈 1~2주 전 등록 필수.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(Color(hex: "03C75A"))

                    Divider()

                    Toggle(isOn: $snsInstagram) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("인스타그램 비즈니스").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Text("F&B SNS 마케팅 1위 채널. 릴스·스토리 콘텐츠로 바이럴. 팔로워 = 단골 재방문율 직결.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $snsKakao) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("카카오 채널").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Text("단골 고객에게 카카오톡 메시지 직접 발송. 카카오맵 장소 노출 + 채널 개설 무료.")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 첫 주 SNS 액션 플랜")
                    let actions: [(String, String)] = [
                        ("오픈 D-7", "네이버 플레이스 등록 + 대표 메뉴 사진 5장 이상 업로드"),
                        ("오픈 D-3", "인스타 계정 개설 + 인테리어·메뉴 스토리 예고 게시"),
                        ("오픈 Day", "첫 손님 인스타 인증샷 유도 + 네이버 리뷰 요청"),
                        ("오픈 D+7", "리뷰 답글 100% + 자주 묻는 Q&A 네이버 플레이스 등록"),
                    ]
                    ForEach(actions, id: \.0) { day, action in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 56, alignment: .leading)
                            Text(action).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            warningCard(title: "SNS 주의사항", items: [
                "네이버 플레이스 등록 → 노출까지 최대 7일 → 오픈 2주 전 등록",
                "인스타 팔로워 0에서 시작 — 광고 없이 성과까지 2~3개월 예상",
                "리뷰 무시 = 별점 하락 → 방문율 즉각 영향 (응답률 100% 목표)",
            ], color: .orange)

            if cluster.category.isOffline {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        BUEyebrow("오프라인 브랜드 필수 항목")
                        Toggle(isOn: $brandIdentityDone) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("간판·메뉴판·브랜드 자산 준비").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text("간판 디자인·메뉴판 인쇄·가격표·실내 브랜드 요소 완료").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                        }.tint(BUColor.midnight)
                        Divider()
                        Toggle(isOn: $cardMerchantDone) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("카드 가맹점 등록 완료 (VAN 약 1주)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text("NICE·KIS·스마트로 등 VAN사 신청 → 승인 후 결제 단말 활성화").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                        }.tint(BUColor.midnight)
                        Divider()
                        Toggle(isOn: $musicLicenseDone) {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text("매장음악 저작권 등록").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text("50㎡+ 의무").font(.system(size: 10, weight: .bold)).foregroundStyle(Color.orange)
                                        .padding(.horizontal, 6).padding(.vertical, 2).background(Color.orange.opacity(0.1), in: Capsule())
                                }
                                Text("한국음악저작권협회(KOMCA) 또는 매장음악 서비스 가입 — 영업장 50㎡ 이상 법적 의무").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                        }.tint(BUColor.midnight)
                        Divider()
                        // 2026-05-25: 현금영수증 의무발급 가맹점 (부가가치세법 32조의2)
                        Toggle(isOn: $cashReceiptDone) {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text("현금영수증 의무발급 가맹점 가입").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text("법적 의무").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.danger)
                                        .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.danger.opacity(0.1), in: Capsule())
                                }
                                Text("음식점·소매업 등 의무발급 업종 — 10만원 이상 거래 시 현금영수증 의무 발급. 홈택스 신청 또는 사업자등록 시 동시 신청. 미가입 시 미발급 거래액의 20% 가산세.").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }.tint(BUColor.midnight)
                        Divider()
                        // 2026-05-25: 옥외 간판 신고 (옥외광고물법 5조)
                        Toggle(isOn: $signageReportDone) {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text("옥외 간판 신고 (구청 광고물 신고)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text("법적 의무").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.danger)
                                        .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.danger.opacity(0.1), in: Capsule())
                                }
                                Text("벽면·돌출·입식 간판 모두 신고 대상 (옥외광고물법 5조). 관할 구청 디자인정책과 / 옥외광고물 담당. 미신고 시 자진철거 명령 + 과태료 (크기·위치별 최대 500만원).").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }.tint(BUColor.midnight)
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func deliveryRow(name: String, tagline: String, desc: String, color: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(tagline).font(.system(size: 10)).foregroundStyle(BUColor.inkMuted).lineLimit(1)
                }
                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(1.5)
            }
        }
        .tint(Color(hex: color))
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

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

#if DEBUG
#Preview("OperationsSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["operations-setup"] }
    return OperationsSetupStageView().environment(store)
}
#endif
