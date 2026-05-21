//
//  BUStageFooter.swift — 로드맵 stage 시트 하단의 진행 풋터 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/StageActionHero.tsx + StageFooter.tsx
//
//  책임:
//   • "이전 단계로" / "다음 단계로" 버튼 — RoadmapStore.advanceToNext 와 연동
//   • 완료 표시 토글 (이미 완료된 stage 라면 "되돌리기")
//   • 게이트 조건 (canAdvance) 가 false 면 다음 버튼 disabled
//
//  사용 예:
//      BUStageFooter(
//          stageId: "pre-launch",
//          canAdvance: dayCheckCount == 6,
//          onAdvance: { dismiss() }
//      )
//

import SwiftUI
import BuildUpDesignSystem

public struct BUStageFooter: View {

    public let stageId: String
    public let canAdvance: Bool
    public let advanceLabel: String
    public let onAdvance: () -> Void
    public let isCompleted: Bool
    public let onUncomplete: (() -> Void)?

    public init(
        stageId: String,
        canAdvance: Bool = true,
        advanceLabel: String = "다음 단계로",
        isCompleted: Bool = false,
        onAdvance: @escaping () -> Void,
        onUncomplete: (() -> Void)? = nil
    ) {
        self.stageId = stageId
        self.canAdvance = canAdvance
        self.advanceLabel = advanceLabel
        self.isCompleted = isCompleted
        self.onAdvance = onAdvance
        self.onUncomplete = onUncomplete
    }

    public var body: some View {
        VStack(spacing: 8) {
            Divider()
                .padding(.horizontal, -BUSpacing.md)
            HStack(spacing: 10) {
                if isCompleted, let onUncomplete {
                    Button(action: onUncomplete) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.uturn.backward")
                                .font(.system(size: 12, weight: .semibold))
                            Text("완료 취소")
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 11)
                        .background(BUColor.surfaceElevated, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                Button(action: onAdvance) {
                    HStack(spacing: 6) {
                        Text(isCompleted ? "다음으로" : advanceLabel)
                            .font(.system(size: 14, weight: .heavy))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 12, weight: .heavy))
                    }
                    .foregroundStyle(canAdvance ? Color.white : BUColor.inkMuted)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 12)
                    .background(
                        canAdvance
                            ? AnyShapeStyle(BUColor.midnight)
                            : AnyShapeStyle(BUColor.midnight.opacity(0.18))
                    )
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(!canAdvance)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 10)
        }
        .background(BUColor.surface.opacity(0.96))
        .background(.ultraThinMaterial)
    }
}

#if DEBUG
#Preview("StageFooter — 진행 가능") {
    VStack {
        Spacer()
        BUStageFooter(
            stageId: "pre-launch",
            canAdvance: true,
            isCompleted: false,
            onAdvance: { print("advance") }
        )
    }
}

#Preview("StageFooter — 게이트 막힘") {
    VStack {
        Spacer()
        BUStageFooter(
            stageId: "pre-launch",
            canAdvance: false,
            isCompleted: false,
            onAdvance: { print("advance") }
        )
    }
}

#Preview("StageFooter — 이미 완료") {
    VStack {
        Spacer()
        BUStageFooter(
            stageId: "pre-launch",
            canAdvance: true,
            isCompleted: true,
            onAdvance: { print("advance") },
            onUncomplete: { print("uncomplete") }
        )
    }
}
#endif
