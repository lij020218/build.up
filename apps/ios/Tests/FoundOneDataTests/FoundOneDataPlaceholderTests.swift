//
//  FoundOneDataPlaceholderTests.swift
//
//  Package.swift 가 path: "Tests/FoundOneDataTests" 를 선언하는데 폴더가 비어(untracked
//  빈 디렉토리) 지워지면 "invalid custom path" 로 **앱 빌드 자체가 깨진다** (2026-08-07 실측).
//  git 은 빈 폴더를 추적하지 않으므로 최소 파일 하나를 둔다. 실테스트가 생기면 대체할 것.
//

import Testing
@testable import FoundOneData

@Suite("FoundOneData placeholder")
struct FoundOneDataPlaceholderTests {
    @Test("타깃이 컴파일된다")
    func compiles() {
        #expect(Bool(true))
    }
}
