//
//  BUStageKeyActionHero.swift — KEY ACTION 미드나이트 그라디언트 히어로 (iOS, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/startup/StartupStageShell.tsx
//           → StartupKeyActionHero
//
//  카피 데이터: BUStageKeyActionRegistry (FoundOneCore)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUStageKeyActionHero: View {

    public let title: String
    public let detail: String
    public let eyebrow: String

    public init(title: String, detail: String, eyebrow: String = "이 단계에서 꼭 할 일") {
        self.title = title
        self.detail = detail
        self.eyebrow = eyebrow
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow)
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.85)
                .textCase(.uppercase)
                .foregroundStyle(.white.opacity(0.85))

            Text(title)
                .font(.system(size: 19, weight: .heavy))
                .tracking(-0.3)
                .foregroundStyle(.white)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(detail)
                .font(.system(size: 13, weight: .regular))
                .foregroundStyle(.white.opacity(0.90))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 2)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.098, green: 0.098, blue: 0.439),   // #191970
                    Color(red: 0.173, green: 0.173, blue: 0.549),   // #2c2c8c
                    Color(red: 0.290, green: 0.290, blue: 0.722),   // #4a4ab8
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
        )
        .shadow(color: Color(red: 0.098, green: 0.098, blue: 0.439).opacity(0.22), radius: 12, x: 0, y: 6)
    }
}

#if DEBUG
#Preview("BUStageKeyActionHero") {
    VStack(spacing: 12) {
        if let action = BUStageKeyActionRegistry.action(for: "target-customer-definition") {
            BUStageKeyActionHero(title: action.title, detail: action.detail)
        }
        if let action = BUStageKeyActionRegistry.action(for: "launch-gtm") {
            BUStageKeyActionHero(title: action.title, detail: action.detail)
        }
    }
    .padding()
    .background(BUColor.surface)
}
#endif
