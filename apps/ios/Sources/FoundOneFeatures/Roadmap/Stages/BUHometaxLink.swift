//
//  BUHometaxLink.swift — "홈택스 바로가기" 탭 버튼 (iOS, 웹 패리티).
//
//  ⚠️ URL: 검증된 PC 메인 *직접* URL 을 쓴다. www.hometax.go.kr 루트는 JS user-agent
//     리다이렉터라 모바일↔PC 가 어긋나 버벅임·미연결을 냈다(사장님 신고 2026-06-24).
//     사업자등록·세금계산서 등은 PC 홈택스 작업이므로 PC 메인으로 고정.
//     웹 SSOT: apps/web/app/lib/constants.ts 의 동일 URL.
//

import SwiftUI
import FoundOneDesignSystem

struct BUHometaxLink: View {
    static let url = URL(string: "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3")!

    var label: String = "홈택스 바로가기"

    var body: some View {
        Link(destination: Self.url) {
            HStack(spacing: 6) {
                Image(systemName: "arrow.up.right.square")
                    .font(.system(size: 12, weight: .bold))
                Text(label)
                    .font(BUFont.bodySmall.weight(.bold))
                Spacer(minLength: 0)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity)
            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
