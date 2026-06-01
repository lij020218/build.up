//
//  BUWorkStep.swift — 웹 로드맵 단계의 "작업 페이지" 미러 (가이드형 UX).
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/StageActionHero.tsx → WorkStep
//
//  레이아웃 (위 → 아래):
//   ① eyebrow pill: "1. 건물 적합성"  · 시간("10분")
//   ② headline (큰 제목)
//   ③ why (왜 중요한지 본문)
//   ④ "할 일" 카드 — 번호 동그라미 + 제목 + 상세 (hairline 구분)
//   ⑤ "⚠ 주의" 빨강 박스 (0개 이상)
//   ⑥ (선택) 초록 "사장님 상황" 박스 (favorable)
//
//  단계 뷰는 콘텐츠(BUWorkStep(...))만 선언하면 됨 — 골격은 이 컴포넌트가 처리.
//

import SwiftUI
import FoundOneDesignSystem

// MARK: - 데이터 모델

/// "할 일" 한 항목 — 번호 + 제목 + 상세.
public struct BUWorkStepTask: Sendable, Hashable {
    public let title: String
    public let detail: String
    public init(title: String, detail: String) {
        self.title = title
        self.detail = detail
    }
}

/// "⚠ 주의" 경고 한 항목 — 라벨 + 본문.
public struct BUWorkStepWatchout: Sendable, Hashable {
    public let label: String
    public let text: String
    public init(label: String, text: String) {
        self.label = label
        self.text = text
    }
}

/// 초록 "사장님 상황" 박스 — 업종별 협상/유리한 길 팁.
public struct BUWorkStepFavorable: Sendable, Hashable {
    public let context: String
    public let recommendation: String
    public let rationale: String?
    public init(context: String, recommendation: String, rationale: String? = nil) {
        self.context = context
        self.recommendation = recommendation
        self.rationale = rationale
    }
}

// MARK: - View

public struct BUWorkStep: View {

    public let stepLabel: String
    public let time: String?
    public let headline: String
    public let why: String?
    public let tasks: [BUWorkStepTask]
    public let watchouts: [BUWorkStepWatchout]
    public let favorable: BUWorkStepFavorable?

    public init(
        stepLabel: String,
        time: String? = nil,
        headline: String,
        why: String? = nil,
        tasks: [BUWorkStepTask] = [],
        watchouts: [BUWorkStepWatchout] = [],
        favorable: BUWorkStepFavorable? = nil
    ) {
        self.stepLabel = stepLabel
        self.time = time
        self.headline = headline
        self.why = why
        self.tasks = tasks
        self.watchouts = watchouts
        self.favorable = favorable
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 헤더 + 할 일 — 하나의 카드 안에 (배경 위 텍스트 노출 방지)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    eyebrow
                    Text(headline)
                        .font(.system(size: 17, weight: .bold))
                        .tracking(-0.3)
                        .foregroundStyle(BUColor.midnightDeep)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    if let why, !why.isEmpty {
                        Text(why)
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if !tasks.isEmpty { taskBlock }
                }
            }
            ForEach(Array(watchouts.enumerated()), id: \.offset) { _, w in
                watchoutBox(w)
            }
            if let favorable { favorableBox(favorable) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: ① eyebrow pill

    private var eyebrow: some View {
        HStack(spacing: 6) {
            Text(stepLabel)
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.2)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(BUColor.midnight.opacity(0.08), in: Capsule())
            if let time, !time.isEmpty {
                Text("· \(time)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }

    // MARK: ④ "할 일" 블록 (카드 안의 tint 블록)

    private var taskBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("할 일")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight.opacity(0.7))

            VStack(spacing: 0) {
                ForEach(Array(tasks.enumerated()), id: \.offset) { idx, task in
                    if idx > 0 {
                        Rectangle()
                            .fill(BUColor.midnight.opacity(0.08))
                            .frame(height: 0.5)
                    }
                    taskRow(number: idx + 1, task: task)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 2)
            .background(
                BUColor.midnight.opacity(0.035),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
        }
        .padding(.top, 2)
    }

    private func taskRow(number: Int, task: BUWorkStepTask) -> some View {
        HStack(alignment: .top, spacing: 11) {
            Text("\(number)")
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(.white)
                .frame(width: 24, height: 24)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 7, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(task.title)
                    .font(.system(size: 14.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(task.detail)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 10)
    }

    // MARK: ⑤ "⚠ 주의" 빨강 박스

    private func watchoutBox(_ w: BUWorkStepWatchout) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.danger)
                .padding(.top, 1)
            VStack(alignment: .leading, spacing: 3) {
                Text(w.label)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                    .fixedSize(horizontal: false, vertical: true)
                Text(w.text)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.ink.opacity(0.75))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1)
        )
    }

    // MARK: ⑥ 초록 favorable 박스

    private func favorableBox(_ f: BUWorkStepFavorable) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "arrow.up.right.circle.fill")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.success)
                .padding(.top, 1)
            VStack(alignment: .leading, spacing: 4) {
                Text("사장님 상황 — \(f.context)")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.3)
                    .foregroundStyle(BUColor.success)
                Text(f.recommendation)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let rationale = f.rationale, !rationale.isEmpty {
                    Text(rationale)
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.success.opacity(0.16), lineWidth: 1)
        )
    }
}
