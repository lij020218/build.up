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

    // 선택된 채널 id 집합 (comma-separated). 웹·앱 공유 SSOT 시맨틱 id (delivery-<id>).
    //  ⚠️ 2026-06-02: 기존 위치 기반 4 bool(ops.delivery.baemin 등) → 시맨틱 id 집합으로 전환.
    //    웹 OperationsSetupStage 와 동일 id 를 써 ops_selections 가 양방향 동기화된다.
    @AppStorage("ops.channels.selected") private var selectedChannelsRaw = ""

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

    /// 채널 페이지 라벨 — 공유 SSOT (웹과 동일).
    private var channelPageLabel: String {
        OperationsChannelRegistry.label(forCategoryKey: cluster.category.rawValue, subIndustryId: cluster.subIndustryId)
    }

    // ── 업종군 분기 (2026-07-02 업종 정합 감사, 웹 OperationsSetupStage 미러) ──
    //   page 0(첫 판매 채널)·마무리·법정문구가 음식 전용(배민·위생·원산지)이던 문제 → 업종군으로 분기.
    private var isFoodKind: Bool {
        cluster.category == .food || cluster.category == .cafeDessert
    }
    /// page 0(첫 판매 채널) 의미론 그룹 — 음식=배달 / 소매=마켓플레이스 / 그 외 오프라인=예약·플레이스.
    private enum ChannelKind { case delivery, marketplace, reservation }
    private var channelKind: ChannelKind {
        switch cluster.category {
        case .food, .cafeDessert: return .delivery
        case .retail:             return .marketplace
        default:                  return .reservation
        }
    }

    // ── 마무리(StageWrapup) 항목 — 음식 전용(위생교육·원산지·배달수수료)은 isFoodKind 게이팅 (웹 미러) ──
    private var wrapupDoneItems: [BUStageWrapupItem] {
        if isFoodKind {
            return [
                .init(label: "1. POS·결제·주문 시스템 연동", detail: "토스플레이스/배민·쿠팡이츠 연동 + 키오스크·테이블 오더 셋업"),
                .init(label: "2. 표준 운영 매뉴얼", detail: "오픈·중간·마감 체크리스트 + 위생·재고·민원 대응 SOP"),
                .init(label: "3. 마케팅·브랜드 채널", detail: "네이버 플레이스·카카오 채널·인스타 3축 + 리뷰 응대 룰"),
                .init(label: "4. 손익 모니터링 셋업", detail: "일별 매출·재료비·인건비 자동 기록 + 손익분기 추적"),
            ]
        }
        return [
            .init(label: "1. POS·결제·주문 시스템 연동", detail: "토스플레이스 등 POS + \(channelPageLabel) 채널 연동 + 키오스크·예약 셋업"),
            .init(label: "2. 표준 운영 매뉴얼", detail: "오픈·중간·마감 체크리스트 + 위생·안전·재고·민원 대응 SOP"),
            .init(label: "3. 마케팅·브랜드 채널", detail: "네이버 플레이스·카카오 채널·인스타 3축 + 리뷰 응대 룰"),
            .init(label: "4. 손익 모니터링 셋업", detail: "일별 매출·원가·인건비 자동 기록 + 손익분기 추적"),
        ]
    }
    private var wrapupVerifyItems: [String] {
        if isFoodKind {
            return [
                "POS — 카드 수수료(평균 1.5~2.5%) + 정산일(평균 3영업일) 사전 인지, 현금 흐름 시뮬",
                "배달 플랫폼 — 수수료(배민 6.8%·쿠팡이츠 9.8% + 결제 수수료) 매출 분리 회계 셋업",
                "위생교육 매년 갱신 — 식품접객업 영업자·종업원 모두 대상, 미이수 시 행정처분 + 영업정지",
                "민원 대응 — 식약처·소비자원 신고 24시간 내 대응 룰 + 사진·영상 증빙 자동 보관 시스템",
                "원산지 표시 — 거짓 표시 시 7년 이하 징역·1억원 이하 벌금 / 미표시 시 1,000만원 이하 과태료. 전 메뉴 표시 의무",
                "리뷰·SNS — 광고성 리뷰(가족·지인) 식별 시 처분 가능, 진성 리뷰 유도 시스템 우선",
            ]
        }
        var items: [String] = [
            "POS — 카드 수수료(평균 1.5~2.5%) + 정산일(평균 3영업일) 사전 인지, 현금 흐름 시뮬",
            "\(channelPageLabel) 채널 — 판매·예약 수수료 + 결제 수수료 매출 분리 회계 셋업",
        ]
        if cluster.category == .beauty {
            items.append("위생교육 매년 갱신 — 공중위생영업자(미용·목욕 등) 대상, 미이수 시 과태료")
            items.append("위생·소독 관리 — 기구 소독·위생기준 준수(공중위생관리법), 점검 대비 기록 보관")
        } else {
            items.append("안전·위생 관리 — 업종별 안전기준·시설기준 준수 + 점검 대비 기록 보관")
        }
        items.append("민원 대응 — 소비자원·관할 기관 신고 24시간 내 대응 룰 + 사진·영상 증빙 자동 보관 시스템")
        items.append("리뷰·SNS — 광고성 리뷰(가족·지인) 식별 시 처분 가능, 진성 리뷰 유도 시스템 우선")
        return items
    }

    private var pages: [String] {
        cluster.category.isOffline
            ? [channelPageLabel, "POS 선택", "SNS 세팅"]
            : [channelPageLabel, "SNS 세팅"]
    }

    // ── 페이지별 KEY ACTION (웹 OperationsSetupStage keyActions 미러).
    //   웹은 6개 KEY ACTION(F&B 오프라인 중심) — iOS 오프라인 3페이지에 의미 대응분만 매핑:
    //   채널→배달앱입점(웹0) / POS선택→VAN카드(웹3) / SNS세팅→네이버플레이스(웹2).
    //   온라인 클러스터는 웹 콘텐츠(배달앱)와 안 맞아 nil → 레지스트리 단일값 폴백. ──
    private var pageKeyAction: BUStageKeyAction? {
        guard cluster.category.isOffline else { return nil }
        switch page {
        case 0:
            switch channelKind {
            case .delivery:
                return .init(title: "오픈 1주 전, 배민·쿠팡이츠 입점 신청 동시 접수",
                             detail: "심사에 2~5 영업일 소요 — 늦으면 첫날 배달 채널이 막힙니다. 통신판매업 신고증·영업신고증 미리 PDF로 준비하세요.")
            case .marketplace:
                return .init(title: "오픈 전, 스마트스토어·오픈마켓 + 지역 채널(당근·플레이스) 동시 등록",
                             detail: "네이버 스마트스토어는 심사 1~3일, 오픈마켓(쿠팡·11번가)은 입점 후 상품 등록. 매장 판매만 할 거라도 네이버 플레이스·당근 비즈프로필은 필수 — 검색·동네 노출의 출발점.")
            case .reservation:
                return .init(title: "오픈 전, 네이버 예약·플레이스 등록 — 예약 채널부터 확보",
                             detail: "미용·헬스·반려·공간업은 '검색→예약'이 첫 유입. 네이버 플레이스 등록 후 예약 연동까지 최대 7일. 예약앱(네이버예약·똑닥 등) 병행 시 노쇼·대기 관리가 쉬워집니다.")
            }
        case 1:
            return .init(title: "사업자등록 직후 VAN사 1곳에 가맹점 등록 신청 — 카드 결제까지 약 1주",
                         detail: "VAN사 1곳에 신청하면 모든 카드사·간편결제(카카오·네이버·애플페이) 자동 연계. 토스플레이스 등 통합 솔루션 사용 시 별도 VAN 신청 불필요.")
        case 2:
            return .init(title: "지금 바로 네이버 플레이스 등록 — 검색 노출까지 최대 7일",
                         detail: "한국인 매장 검색의 80%가 네이버. 등록 늦으면 첫 주 신규 손님이 0명일 수 있습니다.")
        default:
            return nil
        }
    }

    // MARK: - Cluster-aware channels (페이지 0) — 공유 SSOT (OperationsChannelRegistry)

    private var clusterChannels: [BUOpsChannel] {
        OperationsChannelRegistry.channels(forCategoryKey: cluster.category.rawValue, subIndustryId: cluster.subIndustryId)
    }

    private var selectedChannelIds: Set<String> {
        Set(selectedChannelsRaw.split(separator: ",").map(String.init))
    }

    private func isChannelSelected(_ id: String) -> Bool {
        selectedChannelsRaw.split(separator: ",").contains(Substring(id))
    }

    private func bindingFor(_ id: String) -> Binding<Bool> {
        Binding(
            get: { selectedChannelsRaw.split(separator: ",").map(String.init).contains(id) },
            set: { on in
                var set = Set(selectedChannelsRaw.split(separator: ",").map(String.init))
                if on { set.insert(id) } else { set.remove(id) }
                selectedChannelsRaw = set.sorted().joined(separator: ",")
            }
        )
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
            return !selectedChannelIds.isEmpty
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
            if selectedChannelIds.isEmpty { return "최소 1개 유입 채널을 선택하세요" }
        }
        return "운영 시스템 셋업 완료 — 다음 단계로"
    }

    /// 웹·앱 SSOT 동기화용 ops_selections (웹 OperationsSetupStage 와 동일 시맨틱 키).
    ///  - POS·SNS: 웹 카탈로그가 고정이라 모든 오프라인 업종 공통 매핑.
    ///  - 배달 채널: 웹은 음식점 중심 고정 카탈로그 → 음식/카페만 id 일치. 그 외 업종은
    ///    웹에 대응 id가 없어 넣지 않음(웹 데이터 오염 방지).
    private var opsSelectionsForSync: [String: Bool] {
        var m: [String: Bool] = [:]
        // SNS (snsPage — 전 업종 공통, 웹 고정 id)
        m["sns-naver-place"] = snsNaver
        m["sns-instagram"]   = snsInstagram
        m["sns-kakao-channel"] = snsKakao
        // POS (오프라인 공통, 웹 pos-system 고정 id). iOS 로컬 "order" → 웹 "payhere"
        //   (2026-06-26: 오더플레이스 폐업, 동일 니치 페이히어로 교체. iOS 로컬 id는 영속화 안정 위해 유지).
        if cluster.category.isOffline {
            let posMap = ["toss": "toss", "kis": "kis", "order": "payhere", "smartro": "smartro", "ipos": "ipos"]
            for (iosId, webId) in posMap {
                m["pos-system-\(webId)"] = (posSelected == iosId)
            }
        }
        // 채널(배달/예약/마켓플레이스/런칭) — 공유 SSOT 시맨틱 id 로 전 업종 동기화.
        for ch in clusterChannels {
            m["delivery-\(ch.id)"] = isChannelSelected(ch.id)
        }
        return m
    }

    /// 웹 ops_pos_checks 와 동일 키.
    private var posChecksForSync: [String: Bool] {
        [
            "menu-check":       posMenuDone,
            "payment-check":    posPayDone,
            "receipt-check":    posReceiptDone,
            "settlement-check": posSettleDone,
        ]
    }

    private func syncOperations() {
        StoreProfileRepository.persistOperationsForCurrentUser(
            opsSelections: opsSelectionsForSync,
            posChecks: posChecksForSync
        )
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
                // 웹·앱 SSOT: 운영 선택(POS·SNS·배달)을 user_store_data 에도 저장.
                syncOperations()
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["pos": posSelected])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                syncOperations()
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["pos": posSelected])
            },
            wrapup: BUStageWrapupData(
                doneItems: wrapupDoneItems,
                verifyItems: wrapupVerifyItems,
                nextStageLabel: "프리오픈·본 오픈 준비",
                nextSummary: "POS·SOP·마케팅·손익 4축 셋업 완료 → 프리오픈·본 오픈 준비 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count,
            keyActionOverride: pageKeyAction
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

    // MARK: - 왜 지금 — 정량 임팩트 (웹 WhyItem metric 1:1, 음식·카페 한정)

    @ViewBuilder private var opsWhyImpactCard: some View {
        if cluster.category == .food || cluster.category == .cafeDessert {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 11) {
                    BUEyebrow("왜 지금 — 정량 임팩트")
                    opsImpactRow("배달 등록 지연 1주", "첫 달 매출의 30~50%가 배달앱. 지연 1주 = 평균 매출 300~800만원 손실 + 광고 없이 신규 노출 ≈ 0 (초기 광고 매출 5~15% 권장).")
                    opsImpactRow("POS 첫날 결제 오류", "메뉴 미등록·카드 미연동 시 손님 앞 결제 실패 — 첫날 오류 매장 평균 별점 -0.4점, 신뢰 회복 수개월.")
                    opsImpactRow("네이버 플레이스 미등록", "한국 음식점 검색 80%가 네이버 — 미등록 첫 주 신규 방문 -60%. 노출까지 최대 7일 + 1주차 상호작용 50건 = 상위 노출 진입선.")
                    opsImpactRow("VAN 미신청", "VAN 없이 카드 결제 0건 — 신청→활성화 약 7일. 사업자등록 후 D+0 신청이 골든타임.")
                    opsImpactRow("매장 음악 저작권 (지정업종 50㎡↑)", "카페·주점·헬스장 등 지정 업종 50㎡↑만 의무(일반 식당·미용실·편의점 면제). 대상 매장 미가입 = 손해배상 + 형사처벌. 직접 신고 월 4천원~.")
                }
            }
        }
    }

    private func opsImpactRow(_ title: String, _ body: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "bolt.fill").font(.system(size: 12)).foregroundStyle(BUColor.midnight).padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                Text(body).font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var deliveryPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            opsWhyImpactCard

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("\(channelPageLabel) (2026 수수료 기준)")
                    let platforms = clusterChannels
                    ForEach(platforms, id: \.id) { p in
                        deliveryRow(name: p.name, tagline: p.tagline, desc: p.pros.first ?? "", color: p.color, isOn: bindingFor(p.id))
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
                        ("페이히어",      "F&B 클라우드 태블릿 POS · 배민·쿠팡·요기요 통합 + KDS", "order"),
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

            // 카드 가맹점 — VAN사 비교 (웹 vanProviders 미러). 1곳만 신청, 약 1주.
            opsDetailCard(title: "카드 가맹점 — VAN사 5곳 비교 (1곳만 신청·약 1주)", items: OperationsDetailRegistry.van)
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
            ], color: BUColor.warn)

            if cluster.category.isOffline {
                // 매장 음악 저작권 (웹 musicLicenseOptions 미러) — 50㎡↑ 의무.
                opsDetailCard(title: "매장 음악 저작권 — 4개 옵션 (지정업종 50㎡↑ 의무)", items: OperationsDetailRegistry.music)
                // 브랜드 디자인 (웹 designPlatforms 미러) — 간판·메뉴판·로고.
                opsDetailCard(title: "브랜드 디자인 — 5개 플랫폼 (간판·메뉴판·로고)", items: OperationsDetailRegistry.design)
            }

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
                                    Text("지정업종 50㎡+").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.warn)
                                        .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.warn.opacity(0.1), in: Capsule())
                                }
                                Text("한국음악저작권협회(KOMCA) 또는 매장음악 서비스 가입 — 카페·주점·헬스장 등 지정 업종 50㎡ 이상만 의무(일반 식당·미용실 면제)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
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
                                Text("소비자 대상 업종(음식·소매·미용·숙박·학원 등) 의무발급 — 10만원 이상 거래 시 현금영수증 의무 발급. 홈택스 신청 또는 사업자등록 시 동시 신청. 미가입 시 미발급 거래액의 20% 가산세.").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
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

    /// 웹 SSOT (OperationsDetailRegistry) 상세 비교 카드 — VAN·음악·디자인 공통.
    private func opsDetailCard(title: String, items: [OperationsDetailRegistry.Item]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(title)
                ForEach(items, id: \.name) { it in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(it.name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Spacer(minLength: 0)
                            if !it.url.isEmpty {
                                Text(it.url.replacingOccurrences(of: "https://", with: "").replacingOccurrences(of: "www.", with: ""))
                                    .font(.system(size: 9)).foregroundStyle(BUColor.midnight).lineLimit(1)
                            }
                        }
                        if !it.tagline.isEmpty {
                            Text(it.tagline).font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        ForEach(it.pros.prefix(2), id: \.self) { p in
                            HStack(alignment: .top, spacing: 4) {
                                Text("✓").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.success)
                                Text(p).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        ForEach(it.cons.prefix(1), id: \.self) { c in
                            HStack(alignment: .top, spacing: 4) {
                                Text("—").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.warn)
                                Text(c).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        Divider().opacity(0.3)
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
