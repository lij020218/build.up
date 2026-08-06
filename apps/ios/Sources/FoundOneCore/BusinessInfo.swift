//
//  BusinessInfo.swift — 사업자·문의처 정보 (웹 apps/web/app/lib/businessInfo.ts 손미러)
//
//  ⚠️ SSOT 는 웹 BUSINESS_INFO. 값을 바꾸면 양쪽 동시에 —
//     가드: apps/web/__tests__/business-info-ios-sync.test.ts
//
//  문의처가 웹(lki720412@gmail.com)과 iOS(support@foundone.dev)로 갈려 있었고,
//  support@ 는 수신함이 없어 문의가 유실됐다 (2026-08-06 출시 점검에서 통일).
//  App Store 심사원도 이 주소로 연락할 수 있으므로 실제 수신되는 주소만 쓴다.
//

import Foundation

public enum BusinessInfo {
    public static let serviceName = "Found.One"
    public static let representative = "이영준"
    /// 실제 수신되는 문의 주소 — 웹 푸터·지원 페이지·개인정보 책임자와 동일.
    public static let contactEmail = "lki720412@gmail.com"
}
