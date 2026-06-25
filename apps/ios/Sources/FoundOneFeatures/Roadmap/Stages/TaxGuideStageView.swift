//
//  TaxGuideStageView.swift — 세무 가이드 (iOS 네이티브)
//
//  2026-06-25 SSOT 전환:
//    콘텐츠를 @foundone/shared 의 tax-guide SSOT(JSON codegen)로 이전.
//    iOS는 BUStageContentRenderer, 웹은 StageContentRenderer 가 같은 데이터를 렌더 →
//    web↔iOS 무드리프트(제목·내용 차이)가 구조적으로 불가능.
//
//    콘텐츠 수정은 packages/shared/src/stages/content/tax-guide.ts 한 곳에서만 하고
//    `npx tsx scripts/gen-stage-content-json.mts` 로 stage-content.json 재생성.
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/TaxGuideStage.tsx
//  stageId: "tax-guide"
//

import SwiftUI
import FoundOneComponents
import FoundOneCore

public struct TaxGuideStageView: View {
    private let stageId = "tax-guide"

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

#Preview("TaxGuide") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["tax-guide"] }
    return TaxGuideStageView().environment(store)
}
#endif
