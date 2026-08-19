//
//  LocalDataWipeTests.swift — 로그아웃·계정삭제 시 사용자 데이터 prefix 전수 제거 가드
//

import Foundation
import Testing
@testable import FoundOneData

@Suite("LocalDataWipe")
struct LocalDataWipeTests {

    private func makeDefaults() -> UserDefaults {
        let name = "LocalDataWipeTests.\(UUID().uuidString)"
        let d = UserDefaults(suiteName: name)!
        d.removePersistentDomain(forName: name)
        return d
    }

    @Test("사용자 데이터 prefix 키는 지우고, 기기 선호(비-사용자) 키는 남긴다")
    func wipesUserPrefixesOnly() {
        let d = makeDefaults()
        let userKeys = [
            "roadmap.cluster", "stage.startupType.selected", "owner.ncbScore",
            "funnel.commerce.visitors", "funnel.saas.paid", "profile.notif.staleSales",
            "foundone.decisions",
        ]
        let keepKeys = ["__foundone_last_uid", "notif.optin.dismissedAt", "account.reset.seen"]
        for k in userKeys + keepKeys { d.set("x", forKey: k) }

        LocalDataWipe.wipeAllLocalUserData(d)

        for k in userKeys { #expect(d.object(forKey: k) == nil, "\(k) 는 지워져야 한다") }
        for k in keepKeys { #expect(d.object(forKey: k) != nil, "\(k) 는 남아야 한다") }
    }

    @Test("ConversionFunnelFocusCard·ProfileView 의 @AppStorage prefix 가 목록에 포함된다")
    func containsFunnelAndNotifPrefixes() {
        let p = LocalDataWipe.userDataPrefixes
        #expect(p.contains("funnel.commerce."))
        #expect(p.contains("funnel.saas."))
        #expect(p.contains("profile.notif."))
    }
}
