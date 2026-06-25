//
//  HiringSetupStageView.swift — 직원 채용 및 근로계약 (iOS 네이티브)
//
//  2026-06-26 SSOT 전환:
//    콘텐츠를 @foundone/shared 의 hiring-setup SSOT(JSON codegen)로 이전.
//    iOS는 BUStageContentRenderer, 웹은 StageContentRenderer 가 같은 데이터를 렌더 →
//    web↔iOS 무드리프트(제목·내용 차이)가 구조적으로 불가능.
//
//    콘텐츠 수정은 packages/shared/src/stages/content/hiring-setup.ts 한 곳에서만 하고
//    `npx tsx scripts/gen-stage-content-json.mts` 로 stage-content.json 재생성.
//
//  웹 SSOT: apps/web/.../surfaces/CurrentStageView.tsx (HIRING_SETUP_CONTENT)
//  stageId: "hiring-setup"
//
//  계산기(hiringCalculator)·1인운영(soloOperator)·완료 토글은 interactive ref —
//  BUStageContentRenderer 가 렌더+게이팅(계약서 완료 OR 1인 운영). 채용계획(hiringPlan)은 증분B.
//

import SwiftUI
import FoundOneComponents
import FoundOneCore

public struct HiringSetupStageView: View {
    private let stageId = "hiring-setup"

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

#Preview("HiringSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["hiring-setup"] }
    return HiringSetupStageView().environment(store)
}
#endif
