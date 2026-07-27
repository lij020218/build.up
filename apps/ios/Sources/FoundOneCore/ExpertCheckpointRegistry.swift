//
//  ExpertCheckpointRegistry.swift — 전문가 체크포인트 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/expert-checkpoints.ts
//     재생성: cd apps/web && npx tsx ../../scripts/gen-expert-checkpoints-swift.mts
//

import Foundation

public struct BUExpertChannel: Sendable, Identifiable {
    public var id: String { key }
    public let key: String
    public let nameKo: String
    public let free: Bool
    public let phone: String?
    public let url: String?
    public let nearbyQuery: String?
}

public struct BUExpertCheckpoint: Sendable {
    public let stageIds: [String]
    public let expertKo: String
    public let whensKo: [String]
    public let channels: [BUExpertChannel]
}

public enum BUExpertCheckpoints {
    public static let all: [BUExpertCheckpoint] = [
        .init(
            stageIds: ["permit-check"],
            expertKo: "행정사·관할기관",
            whensKo: ["건축물대장에 위반건축물 표시가 있거나 용도변경이 필요할 때", "소방·위생 등 인허가 요건 해당 여부가 애매할 때"],
            channels: [
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nearbyAdmin", nameKo: "내 주변 행정사", free: false, phone: nil, url: nil, nearbyQuery: "행정사"),
            ]
        ),
        .init(
            stageIds: ["contract-review"],
            expertKo: "변호사·법무사",
            whensKo: ["보증금·권리금 규모가 커서 특약을 꼼꼼히 봐야 할 때", "원상복구 범위·렌트프리 조건이 애매하게 적혀 있을 때"],
            channels: [
                .init(key: "klac132", nameKo: "대한법률구조공단", free: true, phone: "132", url: "https://www.klac.or.kr/legalstruct/telephoneConsultation.do", nearbyQuery: nil),
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nearbyLaw", nameKo: "내 주변 법률사무소", free: false, phone: nil, url: nil, nearbyQuery: "변호사"),
            ]
        ),
        .init(
            stageIds: ["construction-setup"],
            expertKo: "변호사(계약·분쟁)",
            whensKo: ["견적 편차가 크거나 선금 비중이 과도하게 요구될 때", "공사 지연·하자 발생 시 계약서상 책임이 불분명할 때"],
            channels: [
                .init(key: "klac132", nameKo: "대한법률구조공단", free: true, phone: "132", url: "https://www.klac.or.kr/legalstruct/telephoneConsultation.do", nearbyQuery: nil),
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nearbyLaw", nameKo: "내 주변 법률사무소", free: false, phone: nil, url: nil, nearbyQuery: "변호사"),
            ]
        ),
        .init(
            stageIds: ["registration-setup", "online-registration"],
            expertKo: "세무사",
            whensKo: ["간이·일반 과세 선택이 애매할 때 (매출 전망·매입 규모에 따라 유불리가 갈려요)", "공동명의·겸업 등 등록 형태가 단순하지 않을 때"],
            channels: [
                .init(key: "villageTax", nameKo: "마을세무사 무료 상담", free: true, phone: nil, url: "https://www.kacpta.or.kr/education_view/tax_laboratory/vil.asp", nearbyQuery: nil),
                .init(key: "nts126", nameKo: "국세청 국세상담센터", free: true, phone: "126", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6694&cntntsId=8104", nearbyQuery: nil),
                .init(key: "nearbyTax", nameKo: "내 주변 세무사무소", free: false, phone: nil, url: nil, nearbyQuery: "세무사"),
            ]
        ),
        .init(
            stageIds: ["company-setup"],
            expertKo: "세무사·변리사",
            whensKo: ["법인 과세유형·창업감면 해당 여부 판단이 필요할 때", "상표·특허를 직접 출원할지 위임할지 정할 때"],
            channels: [
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nts126", nameKo: "국세청 국세상담센터", free: true, phone: "126", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6694&cntntsId=8104", nearbyQuery: nil),
                .init(key: "nearbyTax", nameKo: "내 주변 세무사무소", free: false, phone: nil, url: nil, nearbyQuery: "세무사"),
            ]
        ),
        .init(
            stageIds: ["biz-registration"],
            expertKo: "세무사(기장 위탁)",
            whensKo: ["복식부기 의무 대상인지 확인이 필요할 때", "기장을 직접 할지 위탁할지 비용 대비 판단이 필요할 때"],
            channels: [
                .init(key: "villageTax", nameKo: "마을세무사 무료 상담", free: true, phone: nil, url: "https://www.kacpta.or.kr/education_view/tax_laboratory/vil.asp", nearbyQuery: nil),
                .init(key: "kacptaFind", nameKo: "한국세무사회 세무사 찾기", free: false, phone: nil, url: "https://www.kacpta.or.kr", nearbyQuery: nil),
                .init(key: "nearbyTax", nameKo: "내 주변 세무사무소", free: false, phone: nil, url: nil, nearbyQuery: "세무사"),
            ]
        ),
        .init(
            stageIds: ["tax-guide"],
            expertKo: "세무사",
            whensKo: ["첫 부가세·종합소득세 신고를 앞두고 있을 때", "세액공제·감면 적용 대상인지 판단이 필요할 때"],
            channels: [
                .init(key: "villageTax", nameKo: "마을세무사 무료 상담", free: true, phone: nil, url: "https://www.kacpta.or.kr/education_view/tax_laboratory/vil.asp", nearbyQuery: nil),
                .init(key: "nts126", nameKo: "국세청 국세상담센터", free: true, phone: "126", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6694&cntntsId=8104", nearbyQuery: nil),
                .init(key: "nearbyTax", nameKo: "내 주변 세무사무소", free: false, phone: nil, url: nil, nearbyQuery: "세무사"),
            ]
        ),
        .init(
            stageIds: ["hiring-setup"],
            expertKo: "노무사",
            whensKo: ["첫 근로계약서를 쓸 때 (수습·주휴·연장수당 조건)", "5인 미만/이상에 따라 적용 규정이 달라 헷갈릴 때"],
            channels: [
                .init(key: "moel1350", nameKo: "고용노동부 상담센터", free: true, phone: "1350", url: "https://1350.moel.go.kr/home/", nearbyQuery: nil),
                .init(key: "kcplaaFind", nameKo: "한국공인노무사회", free: false, phone: nil, url: "https://www.kcplaa.or.kr", nearbyQuery: nil),
                .init(key: "nearbyLabor", nameKo: "내 주변 노무사무소", free: false, phone: nil, url: nil, nearbyQuery: "노무사"),
            ]
        ),
        .init(
            stageIds: ["insurance-tax-setup"],
            expertKo: "노무사·세무사",
            whensKo: ["4대보험 취득신고·두루누리 신청이 처음일 때", "급여 원천세 신고 방식을 정해야 할 때"],
            channels: [
                .init(key: "moel1350", nameKo: "고용노동부 상담센터", free: true, phone: "1350", url: "https://1350.moel.go.kr/home/", nearbyQuery: nil),
                .init(key: "nts126", nameKo: "국세청 국세상담센터", free: true, phone: "126", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6694&cntntsId=8104", nearbyQuery: nil),
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
            ]
        ),
        .init(
            stageIds: ["franchise-application"],
            expertKo: "가맹거래사·변호사",
            whensKo: ["정보공개서를 받았을 때 (계약 14일 전 제공이 법정 의무 — 검토 시간을 쓰세요)", "위약금·영업지역 보호·필수구매 조항이 있을 때"],
            channels: [
                .init(key: "ftcFranchise", nameKo: "공정위 정보공개서 열람", free: true, phone: nil, url: "https://franchise.ftc.go.kr", nearbyQuery: nil),
                .init(key: "klac132", nameKo: "대한법률구조공단", free: true, phone: "132", url: "https://www.klac.or.kr/legalstruct/telephoneConsultation.do", nearbyQuery: nil),
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
            ]
        ),
        .init(
            stageIds: ["startup-foundation"],
            expertKo: "변호사(지분·계약)",
            whensKo: ["공동창업 지분·베스팅·주주간계약(SHA)을 정할 때"],
            channels: [
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nearbyLaw", nameKo: "내 주변 법률사무소", free: false, phone: nil, url: nil, nearbyQuery: "변호사"),
            ]
        ),
        .init(
            stageIds: ["fundraising-readiness"],
            expertKo: "변호사(투자계약)",
            whensKo: ["텀시트·투자계약서를 받았을 때 (서명 전 검토)"],
            channels: [
                .init(key: "bizlink", nameKo: "중기부 비즈니스지원단 무료 자문", free: true, phone: nil, url: "https://www.smes.go.kr/bizlink/", nearbyQuery: nil),
                .init(key: "nearbyLaw", nameKo: "내 주변 법률사무소", free: false, phone: nil, url: nil, nearbyQuery: "변호사"),
            ]
        ),
    ]

    /// stageId(케밥)·code(스네이크) 겸용 조회 — 없으면 nil (해당 단계 미노출).
    public static func checkpoint(for stageId: String?) -> BUExpertCheckpoint? {
        guard let stageId, !stageId.isEmpty else { return nil }
        let normalized = stageId.replacingOccurrences(of: "_", with: "-")
        return all.first { $0.stageIds.contains(normalized) }
    }

    /// 네이버 지도 검색 URL — 동네가 있으면 지역 한정 (웹 nearbySearchUrl 정합).
    public static func nearbySearchUrl(query: String, region: String?) -> URL? {
        let q = [region?.trimmingCharacters(in: .whitespaces), query]
            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
        let encoded = q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q
        return URL(string: "https://map.naver.com/p/search/\(encoded)")
    }
}
