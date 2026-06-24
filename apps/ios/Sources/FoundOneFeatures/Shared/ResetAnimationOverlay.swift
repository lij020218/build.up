//
//  ResetAnimationOverlay.swift — 풀스크린 "진행 초기화" 오버레이 (iOS 네이티브).
//
//  웹 SSOT: apps/web/app/lib/components/reset/ResetAnimationOverlay.tsx
//
//  디자인:
//    • 미드나이트 블루 (BUColor.midnight) 브랜드 컬러
//    • 3겹 회전 링 + 펄스 중앙 아이콘
//    • 진행률 바 (0 → 100%) + shimmer 효과
//    • 4단계 메시지 (준비 / 사업 정보 초기화 ×2 / 마무리) — 사장님 친화 문구
//    • 완료 시 체크마크 + 폭발 링
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct ResetAnimationOverlay: View {
    /// 0.0 ~ 1.0
    public let progress: Double

    @State private var rotation1: Double = 0
    @State private var rotation2: Double = 0
    @State private var rotation3: Double = 0
    @State private var iconScale: CGFloat = 1.0
    @State private var shimmerX: CGFloat = -0.5

    private var isDone: Bool { progress >= 0.999 }

    private var stage: Int {
        if progress < 0.25 { return 0 }
        if progress < 0.60 { return 1 }
        if progress < 0.95 { return 2 }
        return 3
    }

    private var stageMessages: [(primary: String, secondary: String)] {
        [
            ("초기화를 준비하고 있어요", "안전하게 시작할게요"),
            ("모든 사업 정보를 초기화하는 중", "이 기기에 저장된 입력 내용을 정리하고 있어요"),
            ("모든 사업 정보를 초기화하는 중", "가게·로드맵 기록을 깨끗이 비우고 있어요"),
            ("거의 다 됐어요", "처음 시작 화면으로 이동합니다"),
        ]
    }

    private var message: (primary: String, secondary: String) {
        if isDone {
            return ("완료!", "잠시 후 첫 화면으로 이동합니다")
        }
        return stageMessages[stage]
    }

    public init(progress: Double) {
        self.progress = progress
    }

    public var body: some View {
        ZStack {
            // 배경 — radial gradient (midnight 살짝)
            RadialGradient(
                gradient: Gradient(colors: [
                    BUColor.midnight.opacity(0.08),
                    Color.white,
                ]),
                center: .init(x: 0.5, y: 0.35),
                startRadius: 0,
                endRadius: 500
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // ─── 중앙 비주얼 — 3겹 링 + 펄스 아이콘 ───
                centralVisual
                    .frame(width: 140, height: 140)
                    .padding(.bottom, 32)

                // ─── 단계 텍스트 ───
                Text(message.primary)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.bottom, 8)
                    .id(message.primary) // AnimatePresence 흉내 — 텍스트 바뀌면 fade
                    .transition(.opacity.combined(with: .move(edge: .top)))

                Text(message.secondary)
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.ink.opacity(0.55))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
                    .id(message.secondary)
                    .transition(.opacity)

                // ─── 진행률 바 ───
                progressBar
                    .frame(maxWidth: 360)
                    .padding(.horizontal, 24)

                // ─── 도트 + 퍼센트 ───
                HStack {
                    HStack(spacing: 5) {
                        ForEach(0..<4, id: \.self) { i in
                            Circle()
                                .fill(dotColor(for: i))
                                .frame(width: 6, height: 6)
                                .scaleEffect(stage == i && !isDone ? 1.4 : 1.0)
                                .animation(
                                    stage == i && !isDone
                                        ? .easeInOut(duration: 0.6).repeatForever(autoreverses: true)
                                        : .easeOut(duration: 0.3),
                                    value: stage
                                )
                        }
                    }
                    Spacer()
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .monospacedDigit()
                }
                .frame(maxWidth: 360)
                .padding(.horizontal, 24)
                .padding(.top, 14)

                // ─── 하단 안심 메시지 ───
                Text("이 화면을 닫지 마세요. 자동으로 다음 화면으로 이동합니다.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.ink.opacity(0.45))
                    .padding(.top, 32)

                Spacer()
            }
            .animation(.easeOut(duration: 0.35), value: stage)
        }
        .transition(.opacity)
        .onAppear { startAnimations() }
    }

    // MARK: - Central visual

    private var centralVisual: some View {
        ZStack {
            // 외곽 링 1 — 시계방향 (느림, 굵음)
            Circle()
                .trim(from: 0, to: 0.75)
                .stroke(
                    AngularGradient(
                        gradient: Gradient(colors: [
                            BUColor.midnight,
                            BUColor.midnight.opacity(0.45),
                            BUColor.midnight.opacity(0),
                        ]),
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 2, lineCap: .round)
                )
                .opacity(isDone ? 0.25 : 0.85)
                .rotationEffect(.degrees(rotation1))

            // 중간 링 2 — 반시계방향 (보통)
            Circle()
                .trim(from: 0, to: 0.65)
                .stroke(
                    AngularGradient(
                        gradient: Gradient(colors: [
                            BUColor.midnight.opacity(0.6),
                            BUColor.midnight.opacity(0.3),
                            Color.clear,
                        ]),
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 2, lineCap: .round)
                )
                .opacity(isDone ? 0.2 : 0.7)
                .padding(14)
                .rotationEffect(.degrees(rotation2))

            // 안쪽 링 3 — 시계방향 (빠름)
            Circle()
                .trim(from: 0, to: 0.5)
                .stroke(
                    BUColor.midnight.opacity(0.5),
                    style: StrokeStyle(lineWidth: 1.5, lineCap: .round)
                )
                .opacity(isDone ? 0 : 0.6)
                .padding(30)
                .rotationEffect(.degrees(rotation3))

            // 중앙 아이콘 — 펄스
            Circle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            BUColor.midnight,
                            BUColor.midnight.opacity(0.85),
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .padding(44)
                .scaleEffect(iconScale)
                .shadow(color: BUColor.midnight.opacity(isDone ? 0.45 : 0.28),
                        radius: isDone ? 20 : 12, y: isDone ? 12 : 8)
                .overlay {
                    if isDone {
                        Image(systemName: "checkmark")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(.white)
                    } else {
                        // 브랜드 마크를 중앙에 — 바깥 3겹 링이 회전으로 진행감을 주므로 로고는 정적으로 또렷하게
                        FoundOneSpiralLogo(size: 30, color: .white)
                    }
                }

            // 완료 시 폭발 링
            if isDone {
                Circle()
                    .stroke(BUColor.midnight, lineWidth: 2)
                    .scaleEffect(1.6)
                    .opacity(0)
                    .animation(.easeOut(duration: 0.9), value: isDone)
            }
        }
    }

    // MARK: - Progress bar

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // 트랙
                Capsule()
                    .fill(BUColor.midnight.opacity(0.08))

                // 진행
                Capsule()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                BUColor.midnight,
                                Color(red: 0.29, green: 0.29, blue: 0.72), // #4a4ab8
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * CGFloat(progress))
                    .animation(.spring(response: 0.45, dampingFraction: 0.78), value: progress)
                    .shadow(color: BUColor.midnight.opacity(0.35), radius: 6)
                    .overlay {
                        // shimmer
                        if !isDone {
                            GeometryReader { innerGeo in
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            gradient: Gradient(colors: [
                                                Color.clear,
                                                Color.white.opacity(0.45),
                                                Color.clear,
                                            ]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: innerGeo.size.width * 0.4)
                                    .offset(x: shimmerX * innerGeo.size.width)
                            }
                            .mask(Capsule())
                        }
                    }
            }
        }
        .frame(height: 8)
    }

    // MARK: - Helpers

    private func dotColor(for index: Int) -> Color {
        if isDone || stage > index { return BUColor.midnight }
        if stage == index { return BUColor.midnight.opacity(0.65) }
        return BUColor.midnight.opacity(0.18)
    }

    private func startAnimations() {
        withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
            rotation1 = 360
        }
        withAnimation(.linear(duration: 5.5).repeatForever(autoreverses: false)) {
            rotation2 = -360
        }
        withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
            rotation3 = 360
        }
        withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
            iconScale = 1.08
        }
        withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: false)) {
            shimmerX = 2.0
        }
    }
}

#if DEBUG
#Preview("Progress 0.0") { ResetAnimationOverlay(progress: 0.0) }
#Preview("Progress 0.5") { ResetAnimationOverlay(progress: 0.5) }
#Preview("Progress 1.0") { ResetAnimationOverlay(progress: 1.0) }
#endif
