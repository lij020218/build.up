//
//  AppComplianceRegistryTests.swift — 앱·플랫폼 규제·계약(2026-09-11) SSOT 디코드 + 로직 미러 회귀.
//
//  · stage-content.json 의 app-compliance 가 새 kind(glossary·dependencyChain·compareTable·copyTemplate·prepChecklist)
//    를 unsupported 없이 디코드하는가
//  · compliance-data.json 이 디코드되고, 선택기·해석기 Swift 미러가 웹 테스트(compliance-tools.test.ts)와 같은 답을 내는가
//

import Testing
import Foundation
@testable import FoundOneCore

@Suite("app-compliance — SSOT 디코드 · 로직 미러")
struct AppComplianceRegistryTests {

    @Test("app-compliance 4페이지가 디코드되고 새 kind 가 unsupported 로 떨어지지 않는다")
    func decodesAppCompliance() throws {
        let content = try #require(StageContentRegistry.content(for: "app-compliance"))
        #expect(content.pages.map(\.id) == ["map", "auth-pg", "pg-review", "legal-dates"])
        var kinds = Set<String>()
        var refs = Set<String>()
        for s in content.pages.flatMap({ $0.sections }) {
            switch s {
            case .glossary: kinds.insert("glossary")
            case .dependencyChain(_, _, let nodes): kinds.insert("dependencyChain"); #expect(nodes.count == 6)
            case .compareTable(_, _, let cols, let rows, _): kinds.insert("compareTable"); #expect(rows.allSatisfy { $0.cells.count == cols.count - 1 })
            case .copyTemplate: kinds.insert("copyTemplate")
            case .prepChecklist: kinds.insert("prepChecklist")
            case .interactive(let ref, _, let config):
                refs.insert(ref)
                if ref == "dateOffset" { #expect(config?.offsetDays != nil && config?.direction != nil) }
            case .unsupported(let k): Issue.record("unsupported 섹션: \(k)")
            default: break
            }
        }
        #expect(kinds.isSuperset(of: ["glossary", "dependencyChain", "compareTable", "copyTemplate", "prepChecklist"]))
        #expect(refs.isSuperset(of: ["dateOffset", "authChannelPicker", "pgPrecheck", "docRequestDecoder"]))
    }

    @Test("registration-setup 사업자등록 페이지에 서류 용어 사전(glossary)이 들어간다")
    func registrationGlossary() throws {
        let content = try #require(StageContentRegistry.content(for: "registration-setup"))
        let page = try #require(content.pages.first { $0.id == "biz-registration" })
        #expect(page.sections.contains { if case .glossary = $0 { return true } else { return false } })
    }

    @Test("compliance-data.json 디코드 — 채널 3 · 규칙 15 · 용어 15")
    func decodesComplianceData() throws {
        let data = try #require(ComplianceDataRegistry.data)
        #expect(data.identityChannels.count == 3)
        #expect(data.pgPrecheckRules.count == 15)
        #expect(data.docTerms.count == 15)
        let danal = try #require(data.identityChannels.first { $0.id == "danal" })
        #expect(danal.plans?.first?.monthlyKrw == 50_000)
        #expect(danal.joinFeeDirectKrw == 100_000)
    }

    @Test("선택기 미러 — 구함 요건: 통합인증 제외·다날 추천·33만원 경고 (웹 테스트와 동일)")
    func pickerMirrorsWeb() throws {
        let data = try #require(ComplianceDataRegistry.data)
        let r = IdentityChannelPicker.recommend(.init(needsGender: true, needsForeigner: false, monthlyCases: 300, needsPreLaunchTest: false, acceptsPayments: false), data: data)
        let byId = Dictionary(uniqueKeysWithValues: r.verdicts.map { ($0.channelId, $0) })
        #expect(byId["inicis-unified"]?.status == .excluded)
        #expect(byId["danal"]?.status == .recommended)
        #expect(byId["danal"]?.monthlyCostKrw == 50_000)
        #expect(byId["kcp"]?.status == .possible)
        #expect(r.globalWarnings.joined().contains("33만 원"))
        #expect(r.consoleSteps.joined().contains("채널 속성"))

        let t = IdentityChannelPicker.recommend(.init(needsGender: true, needsForeigner: true, monthlyCases: 500, needsPreLaunchTest: true, acceptsPayments: true), data: data)
        #expect(t.verdicts.first?.channelId == "kcp")
        #expect(t.globalWarnings.isEmpty && t.consoleSteps.isEmpty)

        let cheap = IdentityChannelPicker.recommend(.init(needsGender: false, needsForeigner: false, monthlyCases: 200, needsPreLaunchTest: false, acceptsPayments: true), data: data)
        #expect(cheap.verdicts.first?.channelId == "inicis-unified")
        #expect(cheap.verdicts.first?.monthlyCostKrw == 8_000)
    }

    @Test("해석기 미러 — 다날 메일에서 인감증명서·실제소유자·마스킹·전자계약을 찾고 '사본'은 맨 뒤")
    func decoderMirrorsWeb() throws {
        let data = try #require(ComplianceDataRegistry.data)
        let mail = "계약서 원본 2부(통합계약서, 특약서), 사업자등록증 사본, 인감증명서(전자계약 시 생략), 대표자 신분증 사본(마스킹 없이), 고객정보 및 실제소유자 확인서를 보내주세요."
        let d = DocRequestDecoder.decode(mail, data: data)
        let ids = d.matches.map(\.term.id)
        for id in ["original", "biz-cert", "seal-cert", "id-copy", "masking", "owner-form", "e-contract", "special-terms", "copy"] {
            #expect(ids.contains(id), "누락: \(id)")
        }
        #expect(!ids.contains("biz-cert-proof"))
        #expect(ids.last == "copy")
        #expect(d.checklist.count >= 8)
        #expect(d.eContractHint?.contains("인감증명서") == true)
    }
}
