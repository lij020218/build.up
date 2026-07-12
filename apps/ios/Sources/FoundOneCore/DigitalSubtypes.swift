//
//  DigitalSubtypes.swift — 물리 배송이 없는 디지털·창작자 온라인 서브타입 SSOT
//
//  웹 SSOT: packages/shared/src/digital-subtypes.ts (수동 미러 — 항목 변경 시 양쪽 동시 수정)
//
//  소비처:
//   - Features 게이팅: DigitalFulfillmentNoticeView.isDigitalFulfillment (위임)
//   - 태스크 라벨 오버라이드: StageTaskRegistry "{taskId}__digital" 계층
//
//  이 서브타입들은 재고·택배·포장·KC인증이 성립하지 않음(결제 즉시 다운로드/접근권한 전달).
//

import Foundation

public let DIGITAL_ONLINE_SUBTYPES: Set<String> = [
    "digital-products",
    "creator-service",
    "newsletter-membership",
    "ai-application",
]

public func isDigitalOnlineSubtype(_ subIndustryId: String?) -> Bool {
    guard let id = subIndustryId, !id.isEmpty else { return false }
    return DIGITAL_ONLINE_SUBTYPES.contains(id)
}
