//
//  VendorSetupStageView.swift — 공급처·장비·POS 선택 + 초기 발주 계획 (iOS 네이티브)
//
//  웹 SSOT:
//   apps/web/app/lib/components/stages/offline/VendorSetupStage.tsx
//   apps/web/app/lib/components/stages/offline/InitialOrderPlanCard.tsx
//   apps/web/app/lib/components/stages/offline/vendor-setup-data.ts
//  stageId: "vendor-setup"
//
//  섹션 구조 (linear scroll):
//    Hero banner
//    § 1 — 식재료 공급처 (delivery-meals 특화 + food base)
//    § 2 — 주방 장비 (delivery-meals 특화 + food base)
//    § 3 — POS / 예약 (food base)
//    리디렉션 안내 카드
//    § 4 — 초기 발주 계획 (선택된 공급처별 원자재 입력 → 재고 연동)
//    Wrapup 체크리스트
//
//  데이터:
//    @AppStorage "stage.vendor.suppliersJson"  — [String] (선택된 공급처 이름)
//    @AppStorage "stage.vendor.equipmentJson"  — [String] (선택된 장비 이름)
//    @AppStorage "stage.vendor.posJson"        — [String] (선택된 POS 이름)
//    @AppStorage "stage.vendor.materialsJson"  — [InitialMaterialItem] JSON
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

// MARK: - Data models

struct InitialMaterialItem: Identifiable, Codable {
    let id: String
    var name: String
    var supplier: String
    var quantity: Double
    var unit: String
    var unitCost: Int
    var category: String

    var totalCost: Int { Int(quantity) * unitCost }
}

// MARK: - Cluster 분기 (웹 SSOT: vendor-setup-data.ts CATEGORY_VENDOR_BASE)

private struct VendorEntry: Identifiable {
    let id = UUID()
    let name: String
    let desc: String
    let tag: String?
}

/// 카테고리 클러스터 — 공급처·장비·POS 데이터를 분기.
private enum VendorCluster {
    case food, cafe, beauty, fitness, education, pet, livingService, space, retail

    static func from(industryId: String) -> VendorCluster {
        let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? ""
        switch cid {
        case "food":           return .food
        case "cafe-dessert":   return .cafe
        case "beauty":         return .beauty
        case "fitness":        return .fitness
        case "education":      return .education
        case "pet":            return .pet
        case "living-service": return .livingService
        case "space":          return .space
        case "retail":         return .retail
        default:               return .food
        }
    }

    /// 섹션 헤더 (공급처 섹션 1번)
    var supplierSectionTitle: String {
        switch self {
        case .food:          return "식재료 공급처"
        case .cafe:          return "원두·디저트 공급처"
        case .beauty:        return "뷰티 재료·제품 공급처"
        case .fitness:       return "운동기구·소모품 공급처"
        case .education:     return "교재·학습 자료 공급처"
        case .pet:           return "사료·미용 재료 공급처"
        case .livingService: return "세탁·청소 약품·자재 공급처"
        case .space:         return "린넨·소모품·청소 공급처"
        case .retail:        return "상품 매입처·도매상"
        }
    }
    var supplierSectionSubtitle: String {
        switch self {
        case .food, .cafe: return "복수 선택 가능 — 단가 비교 후 발주 분산 권장"
        case .retail:      return "복수 매입처 비교 — 마진 40%+ 가능한 단가 협상"
        default:           return "복수 공급처 비교 — 단가·납기·재고 안정성 모두 확인"
        }
    }

    var equipmentSectionTitle: String {
        switch self {
        case .food, .cafe: return "주방·매장 장비"
        case .beauty:      return "시술 장비·기기"
        case .fitness:     return "운동 장비·머신"
        case .education:   return "수업 장비·교구"
        case .pet:         return "미용·호텔 장비"
        case .livingService: return "세탁·청소 장비"
        case .space:       return "공간 운영 장비"
        case .retail:      return "진열·집기·장비"
        }
    }
    var equipmentSectionSubtitle: String {
        switch self {
        case .food, .cafe: return "신품 vs 중고 혼합 전략 — 황학동·번개장터 활용"
        default:           return "신품 vs 중고 비교 — 핵심 장비만 신품, 보조는 중고로 절감"
        }
    }

    /// 공급처 데이터 (cluster 기본 5-6개)
    var suppliers: [VendorEntry] {
        switch self {
        case .food: return [
            .init(name: "가락시장",        desc: "채소·과일 도매",              tag: nil),
            .init(name: "마장축산물시장",  desc: "육류 직거래 도매",            tag: nil),
            .init(name: "노량진수산시장",  desc: "수산물 직거래",                tag: nil),
            .init(name: "CJ프레시웨이",   desc: "냉동·가공식품 대형 공급사",    tag: "추천"),
            .init(name: "트레이더스",     desc: "창고형 대용량 식재료",         tag: nil),
            .init(name: "푸드팡",         desc: "도시락·식재료 통합 공급",      tag: "배달 특화"),
        ]
        case .cafe: return [
            .init(name: "테라로사",       desc: "스페셜티 원두 로스터 (강릉)",   tag: "프리미엄"),
            .init(name: "프릳츠",         desc: "원두 로스터 직거래",            tag: nil),
            .init(name: "원두를 굽다",    desc: "중소 카페 원두 공급",           tag: nil),
            .init(name: "투썸 디저트 도매", desc: "냉동 디저트·케이크",          tag: nil),
            .init(name: "보보브레드",     desc: "베이커리 도매 (빵·페이스트리)", tag: nil),
            .init(name: "CJ프레시웨이",   desc: "유제품·시럽·부자재",            tag: "추천"),
        ]
        case .beauty: return [
            .init(name: "로레알 프로페셔널", desc: "헤어 시술 제품 공식 공급",     tag: "프리미엄"),
            .init(name: "웰라 코리아",     desc: "샴푸·트리트먼트 도매",         tag: nil),
            .init(name: "OPI 코리아",     desc: "네일 폴리시·젤 공식",          tag: nil),
            .init(name: "마린크림",       desc: "에스테틱 마사지 크림·앰플",     tag: nil),
            .init(name: "글로우메디",     desc: "피부 시술 부자재 도매",         tag: nil),
            .init(name: "뷰티몰닷컴",     desc: "온라인 뷰티 도매 (수수료 낮음)", tag: "추천"),
        ]
        case .fitness: return [
            .init(name: "MFC 머슬프리덤",  desc: "헬스 머신·웨이트 공식 공급",   tag: nil),
            .init(name: "테크노짐",       desc: "프리미엄 카디오·웨이트 (수입)", tag: "프리미엄"),
            .init(name: "리복 코리아",    desc: "필라테스·요가 기구",            tag: nil),
            .init(name: "헬스마트",       desc: "보충제·운동복 도매",           tag: nil),
            .init(name: "스포츠나라",     desc: "운동복·타올·소모품",           tag: nil),
            .init(name: "번개장터",       desc: "중고 헬스 장비",                tag: "중고"),
        ]
        case .education: return [
            .init(name: "교원에듀",       desc: "교과서·문제집 공식 공급",      tag: nil),
            .init(name: "비상교육",       desc: "초·중·고 학습 자료",           tag: "추천"),
            .init(name: "에듀나우",       desc: "교구·실험 도구 도매",          tag: nil),
            .init(name: "아이스크림에듀", desc: "디지털 학습 콘텐츠",            tag: nil),
            .init(name: "교보문고 도매",   desc: "단행본·참고서 대량 매입",      tag: nil),
        ]
        case .pet: return [
            .init(name: "도그하우스 코리아", desc: "사료·간식 도매 (10kg+)",     tag: "추천"),
            .init(name: "펫프렌즈 도매",   desc: "사료·용품 종합 도매",          tag: nil),
            .init(name: "다인펫",         desc: "수입 사료 직거래 (Royal Canin)", tag: nil),
            .init(name: "쇼파인",         desc: "미용 도구·샴푸 공식 수입",      tag: nil),
            .init(name: "펫스타일",       desc: "미용·트리밍 소모품",            tag: nil),
        ]
        case .livingService: return [
            .init(name: "한솔케미컬",     desc: "세탁·청소 약품 공식",          tag: nil),
            .init(name: "유한크로락스",   desc: "표백제·살균제 산업용",          tag: "추천"),
            .init(name: "GS세탁세제",     desc: "코인세탁용 세제 대용량",        tag: nil),
            .init(name: "크린토피아 자재", desc: "프랜차이즈 표준 자재",          tag: nil),
            .init(name: "오피스디포",     desc: "사무·소모품 도매",              tag: nil),
        ]
        case .space: return [
            .init(name: "라이프린넨",     desc: "린넨·수건·침구 도매",          tag: "추천"),
            .init(name: "ABC마트 욕실용품", desc: "어메니티·욕실 소모품",         tag: nil),
            .init(name: "코스트코 비즈",  desc: "휴지·티슈·식수 대용량",         tag: nil),
            .init(name: "오피스디포",     desc: "프린터 토너·문구 소모품",       tag: nil),
            .init(name: "이마트 e클럽",   desc: "공유공간 청소·운영 자재",       tag: nil),
        ]
        case .retail: return [
            .init(name: "동대문 도매",    desc: "패션·잡화 1차 도매",           tag: "추천"),
            .init(name: "남대문 도매",    desc: "악세서리·잡화 1차 도매",       tag: nil),
            .init(name: "광장시장",       desc: "전통 잡화·소품 도매",          tag: nil),
            .init(name: "1688.com 직구",  desc: "중국 알리바바 직구 (B2B)",     tag: "수입"),
            .init(name: "도매꾹",         desc: "온라인 도매 종합 플랫폼",       tag: nil),
            .init(name: "코디브이엠",     desc: "온라인 소상공인 도매",          tag: nil),
        ]
        }
    }

    /// 장비 데이터
    var equipment: [VendorEntry] {
        switch self {
        case .food: return [
            .init(name: "냉장·냉동고",       desc: "식재료 보관 필수",             tag: nil),
            .init(name: "가스레인지/인덕션",  desc: "주방 핵심 조리 장비",         tag: nil),
            .init(name: "식기세척기",        desc: "용기·기구 위생 세척",         tag: nil),
            .init(name: "스테인리스 작업대",  desc: "조리·포장 작업 공간",         tag: nil),
            .init(name: "주방 환풍기(후드)",  desc: "연기·냄새 환기 필수",         tag: nil),
            .init(name: "황학동 중고주방",   desc: "중고 장비 최저가",             tag: "중고"),
            .init(name: "번개장터",         desc: "개인 간 중고 장비",            tag: "중고"),
        ]
        case .cafe: return [
            .init(name: "에스프레소 머신",   desc: "라마르조코·시모넬리·페마 (2그룹)", tag: "프리미엄"),
            .init(name: "원두 그라인더",     desc: "디팅·말코닉·니체 (전동)",       tag: nil),
            .init(name: "드립 도구",        desc: "케맥스·V60·푸어오버 세트",      tag: nil),
            .init(name: "쇼케이스 냉장",    desc: "디저트·음료 진열용",            tag: nil),
            .init(name: "정수기·연수기",    desc: "커피 추출 수질 관리",           tag: nil),
            .init(name: "번개장터 중고",    desc: "에스프레소 머신 중고 (50~70%↓)", tag: "중고"),
        ]
        case .beauty: return [
            .init(name: "샴푸대·헤어체어",   desc: "헤어샵 핵심 장비",             tag: nil),
            .init(name: "스팀기·드라이",    desc: "헤어 시술 보조 장비",          tag: nil),
            .init(name: "네일 UV 램프",     desc: "젤 네일 경화 장비",            tag: nil),
            .init(name: "피부 관리 침대",   desc: "에스테틱 베이스",              tag: nil),
            .init(name: "스팀기·고주파기",  desc: "피부 시술 기기",               tag: nil),
            .init(name: "번개장터 중고",    desc: "샵 폐업 매물 (50%↓)",          tag: "중고"),
        ]
        case .fitness: return [
            .init(name: "벤치프레스·웨이트", desc: "프리웨이트 존 기본 구성",      tag: nil),
            .init(name: "런닝머신·바이크",   desc: "카디오 머신 5~10대",          tag: nil),
            .init(name: "필라테스 리포머",   desc: "필라테스 핵심 장비",          tag: nil),
            .init(name: "거울·매트",        desc: "그룹 클래스 룸",               tag: nil),
            .init(name: "보충제 자판기",    desc: "추가 매출원",                  tag: nil),
            .init(name: "번개장터 중고",    desc: "헬스장 폐업 매물 (40~60%↓)",   tag: "중고"),
        ]
        case .education: return [
            .init(name: "프로젝터·스크린",   desc: "수업 화면 표시",               tag: nil),
            .init(name: "전자칠판",         desc: "디지털 수업 도구",             tag: nil),
            .init(name: "책상·의자 세트",    desc: "학생 인원 × 1.2",              tag: nil),
            .init(name: "에어컨·환기",      desc: "다인 환경 필수",               tag: nil),
            .init(name: "CCTV·출입통제",    desc: "안전·출결 관리",               tag: nil),
        ]
        case .pet: return [
            .init(name: "미용 테이블·드라이", desc: "트리밍 핵심 장비",            tag: nil),
            .init(name: "케이지·울타리",     desc: "호텔·대기실",                  tag: nil),
            .init(name: "샴푸 욕조·온수",   desc: "위생·세척 시설",               tag: nil),
            .init(name: "CCTV (라이브)",    desc: "보호자 실시간 확인",            tag: "추천"),
            .init(name: "공기청정·환기",    desc: "냄새 관리 필수",               tag: nil),
        ]
        case .livingService: return [
            .init(name: "세탁기·건조기 (산업용)", desc: "코인세탁 핵심 장비",       tag: nil),
            .init(name: "다리미·프레스",     desc: "세탁 마무리",                  tag: nil),
            .init(name: "청소 카트·진공기",   desc: "출장·매장 청소",              tag: nil),
            .init(name: "수리·정비 공구",    desc: "수리업종 기본 공구 세트",      tag: nil),
            .init(name: "POS 카운터·결제",   desc: "현장 결제 단말",               tag: nil),
        ]
        case .space: return [
            .init(name: "조명·음향",        desc: "분위기·이벤트 운영",           tag: nil),
            .init(name: "테이블·의자",      desc: "수용 인원 × 1.2 세트",         tag: nil),
            .init(name: "스마트락·출입",    desc: "무인 운영 키 시스템",          tag: "추천"),
            .init(name: "CCTV·보안",       desc: "공간 손상 분쟁 대비",          tag: nil),
            .init(name: "Wi-Fi·프린터",    desc: "스튜디오·오피스 필수",          tag: nil),
        ]
        case .retail: return [
            .init(name: "진열대·행거",      desc: "상품 진열 핵심",               tag: nil),
            .init(name: "마네킹·디스플레이", desc: "패션·잡화 매장",              tag: nil),
            .init(name: "POS·바코드 스캐너", desc: "재고·결제 통합",              tag: nil),
            .init(name: "CCTV·도난 방지",   desc: "오프라인 리테일 필수",          tag: nil),
            .init(name: "라벨 프린터",      desc: "가격표·재고 관리",             tag: nil),
            .init(name: "번개장터 중고",    desc: "매장 폐업 매물",                tag: "중고"),
        ]
        }
    }

    /// POS / 결제 — 카페·외식은 토스플레이스·캐치테이블, 뷰티·피트니스는 캐치테이블 X
    var pos: [VendorEntry] {
        let common: [VendorEntry] = [
            .init(name: "토스플레이스",  desc: "수수료 0% · 정산 빠름",    tag: "추천"),
            .init(name: "오케이포스",   desc: "소상공인 특화 종합 POS",   tag: nil),
            .init(name: "페이히어",    desc: "모바일 결제 + 배달 연동",    tag: nil),
        ]
        switch self {
        case .food, .cafe: return common + [
            .init(name: "캐치테이블",  desc: "예약·대기 관리 특화",          tag: nil),
            .init(name: "테이블링",    desc: "예약 + POS 통합",              tag: nil),
        ]
        case .beauty, .fitness, .pet, .education: return common + [
            .init(name: "예약신청",    desc: "예약·회원·결제 통합 (서비스업 특화)", tag: "추천"),
            .init(name: "와이즈비",   desc: "회원·자동 결제·문자",            tag: nil),
        ]
        case .livingService, .space, .retail: return common + [
            .init(name: "스마트로",   desc: "VAN 종합 (다채널 결제)",         tag: nil),
        ]
        }
    }

    /// 자재 카테고리 (초기 발주 폼)
    var materialCategoriesList: [String] {
        switch self {
        case .food, .cafe:    return ["식재료", "포장재", "소모품", "기타"]
        case .beauty:         return ["시술 재료", "샴푸·트리트먼트", "소모품", "기타"]
        case .fitness:        return ["보충제", "운동복", "소모품", "기타"]
        case .education:      return ["교재", "교구", "소모품", "기타"]
        case .pet:            return ["사료·간식", "미용 재료", "소모품", "기타"]
        case .livingService:  return ["세제·약품", "장비 부품", "소모품", "기타"]
        case .space:          return ["린넨·어메니티", "청소 자재", "소모품", "기타"]
        case .retail:         return ["매입 상품", "포장재", "소모품", "기타"]
        }
    }

    /// 진행 게이트 안내문
    var advanceMissingHint: String {
        switch self {
        case .food, .cafe: return "식재료 공급처를 최소 1곳 선택하세요"
        case .retail:      return "매입처를 최소 1곳 선택하세요"
        default:           return "공급처를 최소 1곳 선택하세요"
        }
    }
}

// MARK: - JSON helpers

private func parseStrings(_ json: String) -> [String] {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONDecoder().decode([String].self, from: data) else { return [] }
    return arr
}

private func encodeStrings(_ arr: [String]) -> String {
    guard let data = try? JSONEncoder().encode(arr),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
}

private func parseMaterials(_ json: String) -> [InitialMaterialItem] {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONDecoder().decode([InitialMaterialItem].self, from: data) else { return [] }
    return arr
}

private func encodeMaterials(_ arr: [InitialMaterialItem]) -> String {
    guard let data = try? JSONEncoder().encode(arr),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
}

// MARK: - VendorSetupStageView

public struct VendorSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private let stageId = "vendor-setup"

    @AppStorage("stage.vendor.suppliersJson")  private var suppliersJson  = "[]"
    @AppStorage("stage.vendor.equipmentJson")  private var equipmentJson  = "[]"
    @AppStorage("stage.vendor.posJson")        private var posJson        = "[]"
    @AppStorage("stage.vendor.materialsJson")  private var materialsJson  = "[]"

    private var cluster: VendorCluster { VendorCluster.from(industryId: industryId) }

    private var selectedSuppliers: [String] { parseStrings(suppliersJson) }
    private var selectedEquipment: [String]  { parseStrings(equipmentJson) }
    private var selectedPos: [String]        { parseStrings(posJson) }
    private var materials: [InitialMaterialItem] { parseMaterials(materialsJson) }

    // Initial order form state
    @State private var fMatName     = ""
    @State private var fSupplier    = ""
    @State private var fQtyText     = ""
    @State private var fUnit        = "kg"
    @State private var fCostText    = ""
    @State private var fCategory    = "식재료"

    private var canAddMaterial: Bool {
        !fMatName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !fSupplier.trimmingCharacters(in: .whitespaces).isEmpty &&
        (Double(fQtyText) ?? 0) > 0 &&
        (Int(fCostText) ?? 0) > 0
    }

    private var totalOrderCost: Int { materials.reduce(0) { $0 + $1.totalCost } }

    private var wrapupDone: Bool {
        !selectedSuppliers.isEmpty && !selectedEquipment.isEmpty && !selectedPos.isEmpty && !materials.isEmpty
    }

    private var canCompleteStage: Bool {
        !selectedSuppliers.isEmpty && !selectedEquipment.isEmpty && !selectedPos.isEmpty
    }

    private var advanceHint: String {
        if selectedSuppliers.isEmpty { return cluster.advanceMissingHint }
        if selectedEquipment.isEmpty { return "장비를 최소 1개 선택하세요" }
        if selectedPos.isEmpty { return "POS / 결제 시스템을 최소 1개 선택하세요" }
        return "공급처 \(selectedSuppliers.count)곳 선택됨 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "공급처 및 장비 확정",
            stageEyebrow: "단계 · 공급처 설정",
            helperText: "공급처·장비·POS를 확정해야 초기 발주와 재고 등록이 시작됩니다. 공급처 계약이 원가를 결정합니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["suppliers": "\(selectedSuppliers.count)"])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["suppliers": "\(selectedSuppliers.count)"]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 공급처 결정", detail: "식자재·장비·POS 등 카테고리별 1순위 업체 선정 + 견적서 보관"),
                .init(label: "2. 장비 발주 계획", detail: "신품·중고 비교 — 황학동온라인·번개장터 활용 50~70%대 가성비 확보"),
                .init(label: "3. POS·결제 셋업", detail: "토스플레이스·KIS·페이히어 비교 + 무료 단말 신청"),
                .init(label: "4. 첫 주 발주 일정", detail: "오픈 D-7 기준 식자재 소량 테스트 + 장비 시운전 일정 확정"),
                .init(label: "5. 월 원가 계획", detail: "공급처 견적 합산 → 월 식자재·매입 원가 추정. 「재무 검토」의 인건비 칸과 동일하게 사장이 직접 입력하는 값."),
                ],
                verifyItems: [
                "사업자등록 전 — 거래 가능 여부 확인 (공급처 다수가 사업자번호 없으면 거래 불가, 견적도 비공식)",
                "POS·결제 — 가맹 수수료(평균 1.5~2.5%) + 단말기 임대료 + 부가세 신고 자동화 여부 확인",
                "식자재 — 위생 인증(HACCP) + 검역증 수령 가능한 업체 선택, 무허가 도매상은 식약처 단속 대상",
                "장비 — 1년 이상 무상 A/S + 설치비·운반비 별도 견적 (계약 시 포함시키기)",
                "중고 장비 — 시운전 영상·구매 영수증·연식 5년 이내 3가지 모두 확보, 분쟁 시 증빙",
                "재고 회전율 — 식자재는 3일 이내 회전 가능한 양만 첫 주 발주, 폐기율 5% 초과 시 재검토",
                ],
                nextStageLabel: "사업자등록·인허가",
                nextSummary: "공급처·장비·POS 확정 → 사업자등록·인허가 단계로 진입"
            )
        ) {
            LazyVStack(alignment: .leading, spacing: BUSpacing.lg) {
                vendorSection(
                    title: cluster.supplierSectionTitle,
                    subtitle: cluster.supplierSectionSubtitle,
                    icon: "cart.fill",
                    entries: cluster.suppliers,
                    selectedJson: $suppliersJson
                )

                vendorSection(
                    title: cluster.equipmentSectionTitle,
                    subtitle: cluster.equipmentSectionSubtitle,
                    icon: "wrench.adjustable.fill",
                    entries: cluster.equipment,
                    selectedJson: $equipmentJson
                )

                vendorSection(
                    title: "POS / 결제 시스템",
                    subtitle: "토스플레이스는 수수료 0% — 채널·예약 연동 확인",
                    icon: "creditcard.fill",
                    entries: cluster.pos,
                    selectedJson: $posJson
                )

                redirectionCard

                initialOrderSection
            }
        }
    }

    // MARK: - Vendor section builder

    private func vendorSection(
        title: String,
        subtitle: String,
        icon: String,
        entries: [VendorEntry],
        selectedJson: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            HStack(spacing: BUSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                Text(title)
                    .font(BUFont.cardTitleSmall)
                    .foregroundStyle(BUColor.midnightDeep)
            }

            Text(subtitle)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)

            VStack(spacing: 0) {
                ForEach(entries) { entry in
                    VendorRow(
                        entry: entry,
                        selectedJson: selectedJson
                    )
                    if entry.id != entries.last?.id {
                        Divider()
                            .padding(.leading, 52)
                    }
                }
            }
            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
        }
    }

    // MARK: - Redirection card

    private var redirectionCard: some View {
        BUCard(.card) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                VStack(alignment: .leading, spacing: 3) {
                    Text("계약서·허가증 검토는 별도 단계")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                    Text("8단계 '계약서 검토'에서 공급처 계약서를 점검합니다.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                }
            }
        }
    }

    // MARK: - Initial order section

    private var initialOrderSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {

            // Header
            VStack(alignment: .leading, spacing: 4) {
                BUEyebrow("초기 발주 계획")
                Text("선택한 공급처에서 구매할 원자재를 등록하면\n재고에 자동 반영됩니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
            }

            if selectedSuppliers.isEmpty {
                BUCard(.card) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundStyle(BUColor.inkMuted)
                        Text("위에서 식재료 공급처를 먼저 선택해 주세요.")
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            } else {
                // Add form
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("원자재 추가")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)

                        TextField("원자재명 (예: 쌀, 닭가슴살)", text: $fMatName)
                            .buTextFieldStyle()

                        // Supplier chip selection
                        VStack(alignment: .leading, spacing: 6) {
                            Text("공급처")
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(selectedSuppliers, id: \.self) { s in
                                        SupplierChip(label: s, isSelected: fSupplier == s) {
                                            fSupplier = s
                                        }
                                    }
                                }
                            }
                        }

                        HStack(spacing: BUSpacing.sm) {
                            TextField("수량", text: $fQtyText)
                                .buTextFieldStyle()
                                .keyboardType(.decimalPad)
                                .frame(maxWidth: 80)

                            TextField("단위", text: $fUnit)
                                .buTextFieldStyle()
                                .frame(maxWidth: 60)

                            TextField("단가(원)", text: $fCostText)
                                .buTextFieldStyle()
                                .keyboardType(.numberPad)
                        }

                        // Category chips
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(cluster.materialCategoriesList, id: \.self) { cat in
                                    MatCategoryChip(label: cat, isSelected: fCategory == cat) {
                                        fCategory = cat
                                    }
                                }
                            }
                        }

                        Button(action: addMaterial) {
                            Label("추가", systemImage: "plus")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(canAddMaterial ? .white : BUColor.inkMuted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(
                                    canAddMaterial ? BUColor.midnight : BUColor.midnight.opacity(0.12),
                                    in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                                )
                        }
                        .disabled(!canAddMaterial)
                    }
                }

                // Material list
                if !materials.isEmpty {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        HStack {
                            Text("등록 원자재 \(materials.count)개")
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                            Spacer()
                            Text("총 예상 비용 \(totalOrderCost.formatted())원")
                                .font(BUFont.bodyCaption.weight(.semibold))
                                .foregroundStyle(BUColor.midnight)
                        }

                        ForEach(materials) { item in
                            MaterialItemRow(item: item) {
                                deleteMaterial(id: item.id)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Actions

    private func addMaterial() {
        guard canAddMaterial else { return }
        let qty = Double(fQtyText) ?? 0
        let cost = Int(fCostText) ?? 0
        let item = InitialMaterialItem(
            id: UUID().uuidString,
            name: fMatName.trimmingCharacters(in: .whitespaces),
            supplier: fSupplier,
            quantity: qty,
            unit: fUnit.trimmingCharacters(in: .whitespaces).isEmpty ? "개" : fUnit,
            unitCost: cost,
            category: fCategory
        )
        var current = materials
        current.append(item)
        materialsJson = encodeMaterials(current)
        fMatName = ""; fSupplier = ""; fQtyText = ""; fCostText = ""; fUnit = "kg"; fCategory = "식재료"
    }

    private func deleteMaterial(id: String) {
        var current = materials
        current.removeAll { $0.id == id }
        materialsJson = encodeMaterials(current)
    }
}

// MARK: - VendorRow

private struct VendorRow: View {
    let entry: VendorEntry
    @Binding var selectedJson: String

    private var selected: [String] { parseStrings(selectedJson) }
    private var isSelected: Bool { selected.contains(entry.name) }

    var body: some View {
        Button {
            toggle()
        } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 32, height: 32)
                    Image(systemName: isSelected ? "checkmark" : "plus")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(entry.name)
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                        if let tag = entry.tag {
                            Text(tag)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.1), in: Capsule())
                        }
                    }
                    Text(entry.desc)
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func toggle() {
        var arr = selected
        if isSelected {
            arr.removeAll { $0 == entry.name }
        } else {
            arr.append(entry.name)
        }
        selectedJson = encodeStrings(arr)
    }
}

// MARK: - Small sub-views

private struct SupplierChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08),
                    in: Capsule()
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MatCategoryChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08),
                    in: Capsule()
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MaterialItemRow: View {
    let item: InitialMaterialItem
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(BUFont.bodySmall.weight(.semibold))
                    .foregroundStyle(BUColor.ink)
                HStack(spacing: 4) {
                    Text(item.supplier)
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.midnight)
                    Text("·")
                        .foregroundStyle(BUColor.inkSubtle)
                    Text("\(item.quantity.formatted()) \(item.unit) × \(item.unitCost.formatted())원")
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(item.totalCost.formatted())원")
                    .font(BUFont.bodyCaption.weight(.semibold))
                    .foregroundStyle(BUColor.midnightDeep)
                Text(item.category)
                    .font(BUFont.eyebrow)
                    .foregroundStyle(BUColor.inkMuted)
            }
            Button(action: onDelete) {
                Image(systemName: "minus.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .buttonStyle(.plain)
        }
        .padding(BUSpacing.sm)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
    }
}

private struct CheckRow: View {
    let label: String
    let done: Bool

    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label)
                .font(BUFont.bodySmall)
                .foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }
}

// MARK: - TextField style

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.body)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Preview

#if DEBUG
#Preview("VendorSetup — 공급처 설정") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["vendor-setup"] }
    return VendorSetupStageView().environment(store)
}

#Preview("VendorSetup — Dark") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["vendor-setup"] }
    return VendorSetupStageView().environment(store).preferredColorScheme(.dark)
}
#endif
