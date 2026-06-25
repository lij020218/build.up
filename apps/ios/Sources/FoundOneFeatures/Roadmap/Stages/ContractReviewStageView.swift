//
//  ContractReviewStageView.swift — 임대 계약 검토 (iOS 네이티브)
//
//  2026-06-26 SSOT 전환:
//    콘텐츠를 @foundone/shared 의 contract-review SSOT(JSON codegen)로 이전.
//    iOS는 BUStageContentRenderer, 웹은 StageContentRenderer 가 같은 데이터를 렌더 →
//    web↔iOS 무드리프트(제목·내용 차이)가 구조적으로 불가능.
//
//    콘텐츠 수정은 packages/shared/src/stages/content/contract-review.ts 한 곳에서만 하고
//    `npx tsx scripts/gen-stage-content-json.mts` 로 stage-content.json 재생성.
//
//  웹 SSOT: apps/web/.../surfaces/CurrentStageView.tsx (CONTRACT_REVIEW_CONTENT)
//  stageId: "contract-review"
//
//  마무리 페이지: 9대 핵심 조항 gateChecklist + 서명 토글(contractSign) 게이팅 —
//  BUStageContentRenderer 가 일반화 처리.
//

import SwiftUI
import FoundOneComponents
import FoundOneCore

public struct ContractReviewStageView: View {
    private let stageId = "contract-review"

    public init() {}

    public var body: some View {
        if let content = StageContentRegistry.content(for: stageId) {
            BUStageContentRenderer(content: content)
        } else {
            ContentUnavailableView(
                "콘텐츠를 불러오지 못했어요",
                systemImage: "exclamationmark.triangle",
                description: Text("stage-content.json 번들을 확인하세요.")
            )
        }
    }
}

#if DEBUG
import FoundOneData

#Preview("ContractReview") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["contract-review"] }
    return ContractReviewStageView().environment(store)
}
#endif
