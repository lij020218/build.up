//
//  BUTabBarMetrics.swift — 하단 플로팅 탭 바의 치수와 콘텐츠 여백을 한 곳에서 정한다 (2026-09-12).
//
//  왜 필요한가: 예전에는 화면마다 스크롤 끝에 `Color.clear.frame(height: 110)` 을 직접 넣어
//  탭 바를 피했다. 16개 화면이 각자 숫자를 들고 있으니
//   · 값이 110 / 100 으로 갈라졌고,
//   · 스크롤 인디케이터는 여전히 바 아래까지 내려갔으며,
//   · 새 화면을 만들 때 빠뜨리면 마지막 행이 잘렸다.
//
//  해결: 셸이 `.safeAreaInset(edge: .bottom)` 으로 여백을 한 번만 잡는다.
//  그러면 그 안의 ScrollView 는 자동으로 콘텐츠 인셋을 받아
//  "스크롤 중엔 바 뒤로 지나가고, 멈추면 마지막 행이 바 위에 선다" 는
//  애플 자사앱과 같은 동작이 된다.
//

import SwiftUI

public enum BUTabBarMetrics {

    /// 캡슐 자체 높이 — 아이콘 17 + 간격 3 + 라벨 10 + 안쪽 패딩(8×2) + 바깥 패딩(6×2).
    public static let barHeight: CGFloat = 62

    /// 캡슐과 화면 하단(세이프 에어리어) 사이 간격.
    public static let bottomPadding: CGFloat = 6

    /// 캡슐과 콘텐츠 마지막 행 사이에 남길 숨 쉴 틈.
    public static let contentGap: CGFloat = 8

    /// 콘텐츠가 확보해야 할 총 하단 여백.
    public static let contentClearance: CGFloat = barHeight + bottomPadding + contentGap
}

public extension View {

    /// 하단 플로팅 탭 바만큼 콘텐츠 하단 여백을 확보한다.
    ///
    /// - Parameter active: 탭 바가 실제로 보일 때만 여백을 잡는다(숨김 상태에서 빈 공간이 남지 않게).
    ///
    /// 키보드 주의: `.safeAreaInset` 바는 키보드를 따라 올라간다.
    /// 여기서 넣는 건 보이지 않는 스페이서라 올라와도 시각적으로 깨질 게 없지만,
    /// 입력 중 여백이 두 번 잡히지 않도록 키보드 세이프 에어리어는 무시한다.
    func buBottomTabClearance(_ active: Bool = true) -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            if active {
                Color.clear
                    .frame(height: BUTabBarMetrics.contentClearance)
                    .ignoresSafeArea(.keyboard, edges: .bottom)
            }
        }
    }
}
