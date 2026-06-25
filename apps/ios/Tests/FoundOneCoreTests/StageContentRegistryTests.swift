//
//  StageContentRegistryTests.swift — 단계 내용 SSOT(JSON codegen) 디코드 회귀.
//
//  목적: stage-content.json 이 BUStageContent 로 손실 없이 디코드되는지 검증.
//    한 섹션이라도 키 불일치로 throw 하면 loadJSON 이 nil 을 반환해 *모든* SSOT 단계가
//    폴백 화면으로 떨어진다 → 새 섹션 kind 추가(permit-check stageOverview/workStep/axisChecklist)
//    의 키 정합을 빌드와 별개로 못박는다.
//

import Testing
import Foundation
@testable import FoundOneCore

@Suite("StageContentRegistry — SSOT 디코드")
struct StageContentRegistryTests {

    @Test("등록된 SSOT 단계가 모두 디코드된다")
    func decodesKnownStages() {
        for stageId in ["registration-setup", "tax-guide", "permit-check", "contract-review"] {
            #expect(StageContentRegistry.content(for: stageId) != nil, "\(stageId) 디코드 실패 — JSON 키 불일치 의심")
        }
    }

    @Test("contract-review 신규 섹션(gateChecklist/noteList)이 unsupported 로 떨어지지 않는다")
    func contractReviewNewSections() throws {
        let content = try #require(StageContentRegistry.content(for: "contract-review"))
        #expect(content.pages.count == 6)
        var sawGate = false, sawNote = false
        for s in content.pages.flatMap({ $0.sections }) {
            switch s {
            case let .gateChecklist(_, _, items, _): sawGate = items.count == 9
            case .noteList: sawNote = true
            case .unsupported(let k): Issue.record("unsupported 섹션: \(k)")
            default: break
            }
        }
        #expect(sawGate && sawNote)
        #expect(content.byCategory["food"]?.favorable != nil)
    }

    @Test("permit-check 신규 섹션이 unsupported 로 떨어지지 않는다")
    func permitCheckNewSections() throws {
        let content = try #require(StageContentRegistry.content(for: "permit-check"))
        #expect(content.pages.count == 6)
        #expect(content.keyAction?.pillars?.count == 3)

        let kinds = content.pages.flatMap { $0.sections }
        var sawOverview = false, sawWorkStep = false, sawAxis = false
        for s in kinds {
            switch s {
            case .stageOverview:  sawOverview = true
            case .workStep:       sawWorkStep = true
            case .axisChecklist:  sawAxis = true
            case .unsupported(let k): Issue.record("unsupported 섹션: \(k)")
            default: break
            }
        }
        #expect(sawOverview && sawWorkStep && sawAxis)

        // 업종별 workSteps + favorable 합집합 검증(음식점 기준).
        let food = try #require(content.byCategory["food"])
        #expect(food.workSteps?["building"]?.tasks.isEmpty == false)
        #expect(food.favorable != nil)
    }
}
