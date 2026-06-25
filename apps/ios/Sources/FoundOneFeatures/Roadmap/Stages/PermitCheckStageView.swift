//
//  PermitCheckStageView.swift — 인허가 사전 확인 (iOS 네이티브)
//
//  2026-06-26 SSOT 전환:
//    콘텐츠를 @foundone/shared 의 permit-check SSOT(JSON codegen)로 이전.
//    iOS는 BUStageContentRenderer, 웹은 StageContentRenderer 가 같은 데이터를 렌더 →
//    web↔iOS 무드리프트(제목·내용 차이)가 구조적으로 불가능.
//
//    콘텐츠 수정은 packages/shared/src/stages/content/permit-check.ts 한 곳에서만 하고
//    `npx tsx scripts/gen-stage-content-json.mts` 로 stage-content.json 재생성.
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/CurrentStageView.tsx (PERMIT_CHECK_CONTENT)
//  stageId: "permit-check"
//
//  3축(건물·사람·시설) 9항목 axisChecklist 가 진행 게이트 — BUStageContentRenderer 가 일반화 처리.
//

import SwiftUI
import FoundOneComponents
import FoundOneCore

public struct PermitCheckStageView: View {
    private let stageId = "permit-check"

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

#Preview("PermitCheck") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["permit-check"] }
    return PermitCheckStageView().environment(store)
}
#endif
