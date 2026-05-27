//
//  ConstructionSetupStageView.swift — 인테리어 설정 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/ConstructionSetupStage.tsx
//  stageId: "construction-setup"
//
//  food 카테고리 하드코딩:
//    자재 6종: 후드, 내열타일, 방화석고, 대용량전기, 에폭시, 방음재
//    컨셉 4종: 모던한옥, 캐주얼포차, 클린이자카야, 팜투테이블
//
//  2-page (세그먼트):
//    pg 0 — 마감재·설비 가이드 + 주의사항
//    pg 1 — 인테리어 컨셉 선택 + 업체 팁
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

public struct ConstructionSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "construction-setup"
    @AppStorage("construction.concept")  private var selectedConcept = ""
    @AppStorage("construction.done")     private var constructionDone = false

    // 웹 SSOT 누락 3개 (2026-05-24 추가)
    @AppStorage("construction.contractorSelected") private var contractorSelected = false
    @AppStorage("construction.designApproved")     private var designApproved     = false
    @AppStorage("construction.fireHealthApplied")  private var fireHealthApplied  = false

    private let pages = ["마감재·설비", "컨셉 선택"]

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    /// 자재 6종 — IndustryCluster 의 cluster.interiorMaterials + 카테고리별 detail 매핑.
    /// 결과: (name, desc, icon) tuple — 기존 UI 와 동일 시그니처.
    private var materials: [(String, String, String)] {
        let names = cluster.interiorMaterials
        let icons = materialIcons
        let descs = materialDescriptions
        let count = min(names.count, icons.count, descs.count)
        return (0..<count).map { (names[$0], descs[$0], icons[$0]) }
    }

    private var materialIcons: [String] {
        switch cluster.category {
        case .food, .cafeDessert: return ["wind", "square.grid.3x3", "shield", "bolt", "drop", "speaker.slash"]
        case .beauty:             return ["lightbulb", "drop", "chair", "archivebox", "square.grid.3x3", "speaker.wave.2"]
        case .fitness:            return ["square.grid.3x3", "square.split.2x1", "drop", "speaker.wave.2", "wind", "wrench.and.screwdriver"]
        case .education:          return ["chair", "rectangle.on.rectangle", "speaker.slash", "lightbulb", "calendar", "lock.shield"]
        case .pet:                return ["drop", "rectangle.split.3x1", "lightbulb", "shower", "video", "speaker.slash"]
        case .livingService:      return ["drop", "drop.triangle", "wrench.and.screwdriver", "wind", "person.2", "rectangle.on.rectangle"]
        case .space:              return ["key", "speaker.slash", "lightbulb", "sofa", "wifi", "rectangle.on.rectangle"]
        case .retail:             return ["square.grid.3x3", "lightbulb", "creditcard", "person", "square.dashed", "window.casement"]
        case .onlineDigital:      return ["archivebox", "shippingbox", "camera", "printer", "wifi", "tray.and.arrow.up"]
        case .startupTech:        return ["display", "rectangle.3.group", "cup.and.saucer", "wifi", "lock.shield", "person.3"]
        }
    }

    private var materialDescriptions: [String] {
        switch cluster.category {
        case .food: return [
            "법적 의무 — 풍량 계산 선행 필요. 주방 폭 최소 1,900mm 확보 후 설계.",
            "기름때·고열 내성. 줄눈 방오 처리 필수 — 청소 난이도 결정 요인.",
            "소방법 의무 자재 — 소방 심사 전 반드시 확인. 두께·등급 구분 있음.",
            "상업용 주방 장비 전용 분전반 선행 공사 필수. 인테리어 착수 전 전기 설계.",
            "방수·물매 시공 필수. 하수구 위치 먼저 결정 — 청소 동선이 여기서 결정.",
            "조리 소음·냉방기 소음 차단. 야간 영업 민원 방지 — 다중 레이어 구조 권장.",
        ]
        case .cafeDessert: return [
            "에스프레소 머신 1.5kW × 2그룹 + 그라인더 + 정수 라인 — 전기·수도 선행 설계.",
            "커피 얼룩 잘 안 빠지는 바닥 X — 무광 마감재 권장.",
            "방화 석고보드 — 주방·열원 인접 의무.",
            "에스프레소 머신·로스터·디저트 쇼케이스 — 전용 분전반 (15A+).",
            "에폭시 바닥 — 액체 흘림 청소 용이.",
            "방음 — 그라인더·블렌더 소음 차단 (이웃 민원 1순위)."
        ]
        case .beauty: return [
            "조명은 시술 결과 직결 — 색온도 5000K (낮 자연광 톤) 거울 양옆 배치.",
            "샴푸대 1대당 온수 30L/분 — 보일러 용량 사전 확인.",
            "시술 의자·베드 — 평당 1.5대 한계. 회전율 결정 요인.",
            "수납·제품 디스플레이 — 추가 매출원이 되는 매대 설계.",
            "타일·우드 — 머리카락·약품 청소 동선 결정.",
            "BGM 음향 + 향(디퓨저) — 매장 인상 핵심.",
        ]
        case .fitness: return [
            "고무 매트 / 우레탄 바닥 — 충격 흡수 + 소음 차단. 아래층 민원 1순위.",
            "전면 거울 (3m+) — 회원 운동 자세 확인 필수.",
            "락커룸·샤워실 — 회원 절대 평가 항목. 청결·온수 보장.",
            "조명 (4000~5000K) + 음향 (BGM 가능) — 운동 동기 부여.",
            "환기 (시간당 6회+) — 땀·이산화탄소 배출.",
            "장비 마운트 (천장·벽 보강) — 케이블 머신·풀업바 안전 필수.",
        ]
        case .education: return [
            "책상·의자 — 학생 수 × 1.2 (대기·교사용 포함).",
            "전자칠판·프로젝터 + 스크린 — 수업 효율의 50%.",
            "방음 + 환기 — 다인 환경 필수. CO2 1000ppm 이하 유지.",
            "조명 (5000K, 300lux+) — 학습 집중도 + 시력 보호.",
            "사인·게시판 — 시간표·공지·홍보 — 학부모 정보 채널.",
            "출입통제·CCTV — 학생 안전 + 학부모 신뢰.",
        ]
        case .pet: return [
            "방수·내약품 바닥 — 소변·세제 잦은 노출. 줄눈 없는 시공 권장.",
            "케이지·울타리 — 호텔·대기실 — 동물 사이즈별 구분.",
            "조명·환기 — 사람·동물 동시 쾌적성. 환기 1순위 (냄새 민원).",
            "샴푸 욕조 + 온수 — 산업용 (50L/분 이상).",
            "라이브 CCTV — 보호자가 실시간 확인 = 신뢰·홍보.",
            "방음 — 짖음 소음 차단. 이웃 민원 1순위.",
        ]
        case .livingService: return [
            "방수 바닥 + 배수구 — 세탁·청소 약품 누수 대비.",
            "배수 시설 — 세탁기 폐수 강력 배수. 임대 전 확인.",
            "장비 설치 — 산업용 세탁·건조기 단상/3상 전기 구분.",
            "환기·조명 — 화학 약품 사용 시 의무 환기량 확보.",
            "고객 대기 공간 — 소규모 의자·테이블·정수.",
            "사인 — 가격표·이용 방법 — 무인 운영 시 자동 결제 안내.",
        ]
        case .space: return [
            "스마트락 — 무인 운영 핵심. 예약→코드 자동 발급.",
            "방음·환기 — 스튜디오·파티룸 의무. 이웃 민원 1순위.",
            "조명 (조도 조절) + 음향 — 다용도 활용 필수.",
            "가구·소품 — 인스타·SNS 인증샷 — 매출 직결.",
            "Wi-Fi·전기 콘센트 — 1인당 2개 이상 확보.",
            "사인 — 시설 이용 안내·금지 사항 표시.",
        ]
        case .retail: return [
            "진열대·행거 — 상품 동선 + 회전율 결정.",
            "조명 — 상품 강조 (3500K-4000K, 800lux+).",
            "POS 카운터 — 결제 + 포장 + 적립 통합 동선.",
            "탈의실·미러 — 패션 필수. 회전율 영향.",
            "바닥재 — 청결·소음. 카펫 X (먼지·청소 어려움).",
            "쇼윈도우 — 매장 외부 시선 끌기. 야간 조명 필수.",
        ]
        case .onlineDigital: return [
            "창고 선반·랙 — 선입선출 배치. 박스 사이즈 미리 계산.",
            "포장 작업대 — 1인당 2m+ 작업 공간.",
            "사진 라이팅 — 상품 촬영 (스마트스토어 메인 이미지 필수).",
            "프린터·라벨 — 송장·바코드 자동 출력.",
            "Wi-Fi·전기 — 다중 단말·프린터 안정 전원.",
            "선입선출 관리 — FIFO 동선 + 재고 회전.",
        ]
        case .startupTech: return [
            "책상·모니터 — 1인당 2 모니터 표준 (개발자).",
            "회의실 (방음) — 외부 미팅·Zoom 인터뷰 동시 진행.",
            "팬트리·휴게 — 야근·집중 시간 회복 공간.",
            "Wi-Fi·서버 — 안정 백본 + 백업.",
            "보안 출입 — 카드·생체 인증 (지문·얼굴).",
            "이벤트 공간 — 데모데이·해커톤 — 홍보·채용 채널.",
        ]
        }
    }

    private struct ConceptItem: Identifiable {
        let id: String
        let name: String
        let desc: String
        let tags: [String]
        let icon: String
    }

    private var concepts: [ConceptItem] {
        // cluster.interiorConcepts 4개 + 카테고리별 라벨 추가 매핑.
        let names = cluster.interiorConcepts
        let icons = conceptIcons
        let descs = conceptDescriptions
        let tags = conceptTags
        return zip(0..<names.count, names).map { idx, name in
            ConceptItem(id: "\(cluster.category.rawValue)-\(idx)", name: name, desc: descs[idx], tags: tags[idx], icon: icons[idx])
        }
    }

    private var conceptIcons: [String] {
        switch cluster.category {
        case .food:           return ["house", "mug", "moon.stars", "leaf"]
        case .cafeDessert:    return ["cup.and.saucer", "leaf", "lightbulb", "birthday.cake"]
        case .beauty:         return ["sparkles", "leaf", "heart.fill", "rosette"]
        case .fitness:        return ["bolt.fill", "moon.fill", "leaf", "flame"]
        case .education:      return ["sun.max", "wrench.and.screwdriver", "paintpalette", "graduationcap"]
        case .pet:            return ["pawprint", "cross.case", "crown", "heart"]
        case .livingService:  return ["checkmark.shield", "eye", "wrench", "star"]
        case .space:          return ["square", "books.vertical", "camera", "building.2"]
        case .retail:         return ["sparkle", "leaf", "paintpalette", "tag"]
        case .onlineDigital:  return ["shippingbox", "camera", "calendar", "eye"]
        case .startupTech:    return ["laptopcomputer", "wrench.and.screwdriver", "wifi", "stage"]
        }
    }

    private var conceptDescriptions: [String] {
        switch cluster.category {
        case .food: return [
            "한지·나무·석재 믹스. 전통과 현대 조화 — 외국인 관광객 많은 상권에서 차별화 강점.",
            "자연 목재·빈티지 간판·원색 포인트. 친근하고 활기찬 분위기 — 저녁·회식 수요 최강.",
            "다크 우드+간접조명+줄 전구. 2025 MZ세대 외식 트렌드 1순위 — SNS 바이럴 용이.",
            "식물·내추럴 소재·따뜻한 조명. 건강·유기농 이미지 — 객단가 올리기에 유리한 포지셔닝.",
        ]
        case .cafeDessert: return [
            "흰 벽·노출 콘크리트·미니멀 가구. 원두 자체에 집중 — 스페셜티 신뢰감.",
            "우드+그린 식물+자연광. 따뜻한 분위기 — 데이트·작업 카페로 인기.",
            "산업적 미감 + 골조 노출 + 빈티지 조명. 도시·젊은층 선호.",
            "파스텔·핑크·민트 컬러풀 인테리어. 디저트 비주얼 강조 — SNS 인증샷.",
        ]
        case .beauty: return [
            "럭셔리 우드 + 골드 디테일. 프리미엄 단가 + VIP 단골.",
            "내추럴 톤 + 식물. 편안한 휴식 분위기 — 케어 콘셉트.",
            "걸리시 핑크 + 거울 + 조명. SNS 바이럴 — 네일·속눈썹 강점.",
            "프리미엄 화이트 + 모던 가구. 의료급 신뢰감 — 피부 시술.",
        ]
        case .fitness: return [
            "인더스트리얼 — 노출 콘크리트·검정 철골. 하드코어 트레이닝 분위기.",
            "다크 모티베이션 — 검정 + 네온. 밤 운동 + 강한 음악.",
            "내추럴 우드 (필라테스·요가). 부드러운 분위기 — 여성·중년 선호.",
            "네온 액티브 — 컬러풀 + 큰 거울. 그룹 클래스·HIIT.",
        ]
        case .education: return [
            "밝은 학습 공간 — 화이트·우드 + 자연광. 집중·신뢰감.",
            "워크숍 스튜디오 — 작업·실습 중심. 코딩·예술·공방.",
            "어린이 컬러풀 — 파스텔·일러스트. 유아·초등 친화.",
            "프리미엄 입시 — 다크 우드 + 모던. 고등·재수·전문.",
        ]
        case .pet: return [
            "반려동물 친화 자연 — 식물·우드. 편안하고 안전한 분위기.",
            "병원형 깔끔 — 화이트 + 위생감. 신뢰감 1순위.",
            "프리미엄 호텔식 — 럭셔리 우드 + 골드. 고급 펫호텔·미용.",
            "놀이 컬러풀 — 알록달록 + 장난감. 펫카페·놀이방.",
        ]
        case .livingService: return [
            "기능 위주 클린 — 흰색 + 효율 동선. 신뢰감·효율 강조.",
            "투명·신뢰감 — 유리 + 밝은 조명. 작업 과정 보여주기.",
            "산업 효율 — 노출 콘크리트 + 장비 디스플레이. 전문성.",
            "프리미엄 컨시어지 — 우드 + 따뜻한 조명. VIP 응대.",
        ]
        case .space: return [
            "미니멀 화이트 — 흰벽 + 자연광. SNS·촬영 배경 최적.",
            "감성 빈티지 — 우드 + 식물 + 빈티지 가구. 결혼식·이벤트.",
            "스튜디오 프로 — 검은 벽 + 라이팅 + 그린스크린. 영상·제품 촬영.",
            "오피스 모던 — 화이트 + 미니멀 가구. 코워킹·미팅룸.",
        ]
        case .retail: return [
            "럭셔리 갤러리 — 화이트·골드. 명품·프리미엄 브랜드.",
            "감성 빈티지 — 우드·앤티크. 핸드메이드·로컬 브랜드.",
            "트렌디 컬러풀 — 네온·컬러. 패션·뷰티·MZ 타깃.",
            "효율 매대 — 행거·진열 + 명확한 라벨. 잡화·생활용품.",
        ]
        case .onlineDigital: return [
            "창고·작업장 — 진열 X, 효율 동선·재고 우선.",
            "사진 스튜디오 — 상품 촬영 전용 + 라이팅 셋업.",
            "임시 팝업 — 단기 임대 + 노출용. 신상품 런칭.",
            "쇼룸·체험 — 온라인 + 오프라인 동시 운영. 인증샷 + 픽업.",
        ]
        case .startupTech: return [
            "오피스·코워킹 — 책상·회의실·휴게. 표준 스타트업.",
            "라보·작업장 — 하드웨어·로봇 — 작업대 + 안전 펜스.",
            "원격 No-Office — 사무실 없음. 완전 분산팀 + 클라우드.",
            "쇼룸·이벤트 — 데모데이·해커톤 + 채용 채널.",
        ]
        }
    }

    private var conceptTags: [[String]] {
        switch cluster.category {
        case .food: return [
            ["외국인 친화", "30-50대", "관광지 상권"],
            ["저녁·야간 강점", "회식 수요", "가성비"],
            ["20-30대", "SNS 바이럴", "야간 강점"],
            ["건강 이미지", "여성 선호", "객단가 상승"],
        ]
        case .cafeDessert: return [
            ["원두 집중", "스페셜티"], ["데이트 명소", "작업 카페"], ["MZ 도시"], ["SNS 바이럴", "디저트"],
        ]
        case .beauty: return [
            ["VIP·프리미엄"], ["편안한 휴식"], ["네일·속눈썹·SNS"], ["피부·의료급 신뢰"],
        ]
        case .fitness: return [
            ["하드 트레이닝"], ["밤 운동·청년"], ["여성·필라테스"], ["그룹·HIIT"],
        ]
        case .education: return [
            ["집중·신뢰"], ["실습·공방"], ["유아·초등"], ["고등·재수"],
        ]
        case .pet: return [
            ["편안·안전"], ["위생·신뢰"], ["프리미엄 호텔"], ["펫카페·놀이"],
        ]
        case .livingService: return [
            ["효율 강조"], ["작업 투명"], ["전문성"], ["VIP 응대"],
        ]
        case .space: return [
            ["SNS·촬영"], ["결혼·이벤트"], ["영상·제품"], ["코워킹·미팅"],
        ]
        case .retail: return [
            ["명품·프리미엄"], ["핸드메이드·로컬"], ["패션·MZ"], ["잡화·생활"],
        ]
        case .onlineDigital: return [
            ["창고 효율"], ["촬영 전용"], ["단기 노출"], ["옴니 체험"],
        ]
        case .startupTech: return [
            ["표준 오피스"], ["하드웨어·로봇"], ["분산팀"], ["데모·채용"],
        ]
        }
    }

    private var canCompleteStage: Bool {
        !selectedConcept.isEmpty && contractorSelected && designApproved
            && constructionDone && fireHealthApplied
    }

    private var advanceHint: String {
        if selectedConcept.isEmpty { return "공간 디자인 컨셉을 선택하세요" }
        if !contractorSelected { return "시공업체 선정 및 견적 비교 완료를 체크하세요" }
        if !designApproved { return "최종 설계·시공 계획 승인을 체크하세요" }
        if !constructionDone { return "인테리어 공사 완료를 체크하세요" }
        if !fireHealthApplied { return "소방필증·보건증 신청 완료를 체크하세요 (14일 대기)" }
        return "컨셉·업체 확정·공사 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인테리어 및 공사",
            stageEyebrow: "단계 13 · 인테리어 설정",
            helperText: "건물에 부착·고정되는 자재(타일·배선)와 설비(후드·배관)만 이 단계에서 결정합니다. POS·주방기기는 다음 단계 「공급처 확정」에서 결정합니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["concept": selectedConcept])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["concept": selectedConcept]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 인테리어 컨셉 확정", detail: "업종·프랜차이즈 데이터 기반 자재·컨셉 후보 비교 후 1안 결정"),
                .init(label: "2. 시공업체 견적 요청", detail: "지역·키워드 매칭 시공업체 2~3곳에 동시 견적 요청"),
                .init(label: "3. 자재·등급 명시", detail: "견적서에 자재 브랜드·등급·규격·면적 4항목 모두 명시 확인"),
                .init(label: "4. 일정·계약 확정", detail: "착공·중간점검·완공 3단계 일정 + 하자보증 1년 명문화"),
                ],
                verifyItems: [
                "소방·전기·가스 사전 신고 확인 — 다중이용시설은 소방시설완비증명서·전기안전점검·가스공급 3종 미준수 시 영업불가",
                "방염 처리 의무 — 휴게/일반음식점·노래방·미용실 등 다중이용시설은 벽지·천장재 방염필증 필수 (위반 시 영업정지)",
                "공사대금 — 30% 계약·40% 중간·30% 잔금 분할 + 하자보증 1년 계약서 명문화 (사진·영상 보관)",
                "공사 중 추가공사 단가 — 평당 단가 사전 합의 없이 진행 시 마감 시 분쟁 1순위 원인",
                "임대인 원상복구 의무 — 인테리어 잔존물 처리 비용·기준 사전 합의 (계약서 또는 사진 기록)",
                "전기 용량·하수 용량 — 식음료·미용·헬스 등 사용량이 큰 업종은 사전 증설 신청 필수 (한전 평균 2~4주)",
                ],
                nextStageLabel: "공급처·장비 발주",
                nextSummary: "인테리어 컨셉·견적·자재 확정 → 공급처·장비 발주 단계로 진입"
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
                    if page == 0 { materialsPage } else { conceptPage }
                }
            }
        }
    }

    // MARK: - pg 0 마감재·설비

    private var materialsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("음식점 필수 마감재 · 설비 6종")
                    ForEach(materials, id: \.0) { name, desc, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("견적 체크포인트")
                    let tips: [(String, String)] = [
                        ("최소 2~3곳 견적 비교", "자재 사양·브랜드·규격이 견적서에 명시됐는지 확인"),
                        ("공사 단계별 분할 납부", "계약금 30% · 중간 40% · 잔금 30% + 하자보증 1년"),
                        ("사전 소방·전기 신고 필수", "다중이용시설 소방완비증명 + 한전 전기 용량 신청 (평균 2~4주)"),
                        ("인테리어 기간 임대 면제 특약", "착공 중 임대료 면제 협상 → 수백만원 절감 가능"),
                    ]
                    ForEach(tips, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.success)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            warningCard(title: "주의 사항", items: [
                "방염 처리 의무 — 음식점 벽지·천장재 방염필증 필수 (위반 시 영업정지)",
                "전기 용량 증설은 한전 신청 필요 — 2~4주 소요, 착공 전 신청",
                "추가 공사 단가 사전 합의 — 공사 중 '추가' 요청은 분쟁 1순위 원인",
            ], color: .orange)
        }
    }

    // MARK: - pg 1 컨셉 선택

    private var conceptPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("공간 디자인 컨셉 선택")
                    Text("방향을 정해두면 업체 미팅 때 기준점이 됩니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: BUSpacing.sm) {
                ForEach(concepts) { concept in
                    conceptCard(concept)
                }
            }

            if !selectedConcept.isEmpty {
                let picked = concepts.first { $0.id == selectedConcept }
                if let picked {
                    BUCard(.hero) {
                        VStack(alignment: .leading, spacing: BUSpacing.xs) {
                            BUEyebrow("선택된 컨셉")
                            Text(picked.name).font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                            Text(picked.desc).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("음식점 인테리어 업체 검색 키워드")
                    Text("\"음식점 인테리어 전문\" + 지역명으로 검색 후 포트폴리오 사진 확인. 주방 시공 경험 있는 업체 필수 — 후드·배관 설계 경험이 관건.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("공사 진행 체크리스트")
                    Toggle(isOn: $contractorSelected) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("시공업체 선정 및 최소 2곳 견적 비교 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("자재 브랜드·규격·면적 4항목 명시된 견적서 확인 후 계약").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $designApproved) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("최종 설계 및 시공 계획 승인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("도면·자재 사양·공사 일정 3단계(착공·중간·완공) 최종 확인").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $constructionDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("인테리어 공사 완료 및 최종 확인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("현장 점검·하자 확인·잔금 30% 정산").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $fireHealthApplied) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("소방필증·보건증 신청 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text("14일 대기").font(.system(size: 10, weight: .bold)).foregroundStyle(Color.red)
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(Color.red.opacity(0.1), in: Capsule())
                            }
                            Text("공사 중 병행 신청 필수 — 소방완비증명서(다중이용시설)·보건증 없이는 영업신고 불가").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    private func conceptCard(_ concept: ConceptItem) -> some View {
        let isSelected = selectedConcept == concept.id
        return Button {
            selectedConcept = isSelected ? "" : concept.id
        } label: {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isSelected ? BUColor.midnight.opacity(0.15) : BUColor.midnight.opacity(0.07))
                        .frame(width: 44, height: 44)
                    Image(systemName: concept.icon)
                        .font(.system(size: 20)).foregroundStyle(BUColor.midnight)
                }
                Text(concept.name)
                    .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    .lineLimit(2).multilineTextAlignment(.leading)
                Text(concept.desc)
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(1.5).lineLimit(4).multilineTextAlignment(.leading)
                HStack(spacing: 4) {
                    ForEach(concept.tags.prefix(2), id: \.self) { tag in
                        Text(tag)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(isSelected ? BUColor.midnight : BUColor.inkMuted)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(
                                (isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.05)),
                                in: Capsule()
                            )
                    }
                }
            }
            .padding(BUSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? BUColor.surfaceElevated : BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2)
            )
            .shadow(color: isSelected ? BUColor.midnight.opacity(0.1) : Color.black.opacity(0.04), radius: isSelected ? 8 : 3, y: 2)
            .overlay(alignment: .topTrailing) {
                if isSelected {
                    ZStack {
                        Circle().fill(BUColor.midnight).frame(width: 20, height: 20)
                        Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                    }
                    .padding(8)
                }
            }
        }
        .buttonStyle(.plain)
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
#Preview("ConstructionSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["construction-setup"] }
    return ConstructionSetupStageView().environment(store)
}
#endif
