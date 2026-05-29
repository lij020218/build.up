//
//  BUStageShell.swift — 로드맵 stage 시트 공통 셸 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/StageActionHero.tsx +
//           apps/web/app/lib/components/surfaces/CurrentStageView.tsx
//
//  책임:
//   • NavigationStack + 시트 detents/drag indicator
//   • 상단 helper line (회색 안내 텍스트)
//   • content slot
//   • 하단 Continue 바 — 그라데이션 진행 라인 + stage 라벨 + "다음 단계로" 버튼
//   • 우상단 "닫기" 버튼
//
//  사용 예:
//      BUStageShell(
//          stageId: "industry-selection",
//          title: "업종 선택",
//          stageEyebrow: "단계 1 · 업종 선택",
//          helperText: "내 사업에 맞는 로드맵을 선택하세요.",
//          canAdvance: !selected.isEmpty,
//          advanceHint: !selected.isEmpty ? "선택 완료 — 다음 단계로 진행" : "업종을 선택하세요",
//          isCompleted: store.isStageCompleted(stageId),
//          onAdvance: { store.advanceToNext(currentStageId: stageId); dismiss() },
//          onUncomplete: { store.uncompleteStage(stageId) }
//      ) {
//          // 본문 — option grid 등
//      }
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUStageShell<Content: View>: View {

    public let stageId: String
    public let title: String
    public let stageEyebrow: String
    public let helperText: String?
    public let canAdvance: Bool
    public let advanceLabel: String
    public let advanceHint: String
    public let isCompleted: Bool
    public let onAdvance: () -> Void
    public let onUncomplete: (() -> Void)?
    public let wrapup: BUStageWrapupData?
    public let industryCategoryId: String?
    public let currentPage: Int?
    public let totalPages: Int?
    public let onEditSave: (() -> Void)?
    public let content: Content

    @Environment(\.dismiss) private var dismiss

    public init(
        stageId: String,
        title: String,
        stageEyebrow: String,
        helperText: String? = nil,
        canAdvance: Bool,
        advanceLabel: String = "다음 단계로",
        advanceHint: String,
        isCompleted: Bool = false,
        onAdvance: @escaping () -> Void,
        onUncomplete: (() -> Void)? = nil,
        onEditSave: (() -> Void)? = nil,
        wrapup: BUStageWrapupData? = nil,
        industryCategoryId: String? = nil,
        currentPage: Int? = nil,
        totalPages: Int? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.stageId = stageId
        self.title = title
        self.stageEyebrow = stageEyebrow
        self.helperText = helperText
        self.canAdvance = canAdvance
        self.advanceLabel = advanceLabel
        self.advanceHint = advanceHint
        self.isCompleted = isCompleted
        self.onAdvance = onAdvance
        self.onUncomplete = onUncomplete
        self.wrapup = wrapup
        self.industryCategoryId = industryCategoryId
        self.currentPage = currentPage
        self.totalPages = totalPages
        self.onEditSave = onEditSave
        self.content = content()
    }

    /// wrap-up 표시 여부:
    ///   • currentPage/totalPages 가 모두 주어진 경우 → 마지막 페이지에서만 표시 (paginated stage)
    ///   • 그 외 (둘 중 하나라도 nil) → 항상 표시 (non-paginated stage)
    private var shouldShowWrapup: Bool {
        guard wrapup != nil else { return false }
        if let cur = currentPage, let total = totalPages, total > 0 {
            return cur == total - 1
        }
        return true
    }

    public var body: some View {
        // 2026-05-19 사장님 결정: stage 는 sheet 가 아니라 navigation push.
        //   • 부모 RoadmapView 가 NavigationStack 을 제공.
        //   • BUStageShell 은 자체 NavigationStack 을 만들지 않고, .navigationTitle 등 만 부착.
        //   • 시스템 back 버튼(왼쪽 chevron) 이 자동 노출 — "닫기" 는 보조적으로 우측 유지.
        ZStack {
            BUBackgroundSurface()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // KEY ACTION 미드나이트 히어로 — registry 에 있으면 단계 최상단 자동 노출 (웹 SSOT 미러)
                    if let keyAction = BUStageKeyActionRegistry.action(for: stageId) {
                        BUStageKeyActionHero(title: keyAction.title, detail: keyAction.detail)
                            .padding(.horizontal, BUSpacing.md)
                            .padding(.top, 4)
                    }

                    if let helperText {
                        Text(helperText)
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(3)
                            .padding(.horizontal, BUSpacing.md)
                            .padding(.top, 4)
                    }

                    content
                        .padding(.horizontal, BUSpacing.md)

                    // 마무리 — 단계 wrap-up (페이지네이션 stage 는 마지막 페이지에서만, 그 외엔 항상)
                    if shouldShowWrapup, let wrapup {
                        BUStageWrapup(data: wrapup)
                            .padding(.horizontal, BUSpacing.md)
                    }

                    // 액션 체크리스트 — 시간 추정 + 완료 진행도 (registry 에 있으면 자동 노출, 항상 최하단)
                    if !BUStageTaskRegistry.tasks(for: stageId, industryCategoryId: industryCategoryId).isEmpty {
                        BUStageTaskListPersisted(stageId: stageId, industryCategoryId: industryCategoryId)
                            .padding(.horizontal, BUSpacing.md)
                    }

                    Spacer(minLength: 100)  // Continue 바 자리 확보
                }
                .padding(.top, BUSpacing.md)
            }
            #if os(iOS)
            // 모바일 최적화 — 스크롤 시 키보드 자동 dismiss (iPhone SE 등 작은 화면에서 키보드가
            // continue bar 가리는 문제 방지).
            .scrollDismissesKeyboard(.interactively)
            #endif
        }
        .navigationTitle(title)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .safeAreaInset(edge: .bottom, spacing: 0) {
            BUStageContinueBar(
                stageEyebrow: stageEyebrow,
                advanceLabel: advanceLabel,
                advanceHint: advanceHint,
                canAdvance: canAdvance,
                isCompleted: isCompleted,
                onAdvance: onAdvance,
                onUncomplete: onUncomplete,
                onEditSave: onEditSave
            )
        }
    }
}

// MARK: - Wizard environment

public struct WizardOnAdvanceKey: EnvironmentKey {
    nonisolated(unsafe) public static let defaultValue: (() -> Void)? = nil
}

public extension EnvironmentValues {
    /// stage 완료 후 자동으로 다음 stage 로 push 하는 wizard 모드 콜백.
    /// nil 이면 BUStageShell 이 dismiss() 호출 (기본 — 시트 닫고 RoadmapView 로 복귀).
    /// non-nil 이면 dismiss 대신 콜백 호출 (wizard — 다음 stage 자동 push).
    var wizardOnAdvance: (() -> Void)? {
        get { self[WizardOnAdvanceKey.self] }
        set { self[WizardOnAdvanceKey.self] = newValue }
    }
}

// MARK: - Continue bar

public struct BUStageContinueBar: View {

    public let stageEyebrow: String
    public let advanceLabel: String
    public let advanceHint: String
    public let canAdvance: Bool
    public let isCompleted: Bool
    public let onAdvance: () -> Void
    public let onUncomplete: (() -> Void)?
    /// 완료된 단계의 수정 저장 콜백 — 웹 SSOT handleStageEdit 미러.
    /// 제공되면 isCompleted 일 때 "✓ 수정 저장" 버튼 노출.
    public let onEditSave: (() -> Void)?

    /// "수정 저장" 버튼 시각 상태 — idle/saving/saved/error (2초 후 idle 복귀).
    private enum EditState { case idle, saving, saved, error }
    @State private var editState: EditState = .idle

    /// Wizard 모드 — 환경값 주입 시 dismiss 대신 호출.
    /// stage view 들은 onAdvance closure 에서 dismiss() 호출 안 해도 됨.
    @Environment(\.wizardOnAdvance) private var wizardOnAdvance
    @Environment(\.dismiss) private var continueBarDismiss

    public init(
        stageEyebrow: String,
        advanceLabel: String = "다음 단계로",
        advanceHint: String,
        canAdvance: Bool,
        isCompleted: Bool = false,
        onAdvance: @escaping () -> Void,
        onUncomplete: (() -> Void)? = nil,
        onEditSave: (() -> Void)? = nil
    ) {
        self.stageEyebrow = stageEyebrow
        self.advanceLabel = advanceLabel
        self.advanceHint = advanceHint
        self.canAdvance = canAdvance
        self.isCompleted = isCompleted
        self.onAdvance = onAdvance
        self.onUncomplete = onUncomplete
        self.onEditSave = onEditSave
    }

    public var body: some View {
        VStack(spacing: 0) {
            // 진행도 그라데이션 라인 (웹 StageActionHero 미러)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(BUColor.midnight.opacity(0.06))
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [BUColor.midnight, BUColor.midnight.opacity(0.6)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * (isCompleted ? 1.0 : (canAdvance ? 0.12 : 0.06)))
                        .animation(.easeOut(duration: 0.35), value: canAdvance)
                        .animation(.easeOut(duration: 0.35), value: isCompleted)
                }
            }
            .frame(height: 3)

            HStack(spacing: 8) {
                // 좌측 텍스트 — 공간 부족 시 이쪽이 truncate 되도록 layoutPriority(0).
                //   완료된 단계는 액션 버튼 3개가 붙어 좁아지므로 hint 는 숨김.
                VStack(alignment: .leading, spacing: 2) {
                    Text(stageEyebrow)
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.8)
                        .textCase(.uppercase)
                        .foregroundStyle(BUColor.midnight)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    if !isCompleted {
                        Text(advanceHint)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                            .truncationMode(.tail)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(0)

                if isCompleted, let onUncomplete {
                    Button(action: onUncomplete) {
                        Image(systemName: "arrow.uturn.backward")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .frame(width: 36, height: 36)
                            .background(BUColor.surfaceElevated, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("완료 취소")
                    .layoutPriority(1)
                }

                // ── 수정 저장 (웹 SSOT handleStageEdit 미러) ──
                //   완료된 단계만 노출. saving/saved/error 상태 시각화.
                if isCompleted, let onEditSave {
                    Button(action: { triggerEditSave(action: onEditSave) }) {
                        HStack(spacing: 4) {
                            Image(systemName: editIconName)
                                .font(.system(size: 11, weight: .heavy))
                            Text(editLabel)
                                .font(.system(size: 13, weight: .heavy))
                                .lineLimit(1)
                                .fixedSize(horizontal: true, vertical: false)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(editColor, in: Capsule())
                        .shadow(color: editColor.opacity(0.20), radius: 6, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                    .disabled(editState == .saving)
                    .animation(.easeInOut(duration: 0.18), value: editState)
                    .layoutPriority(1)
                }

                Button {
                    // 1. 사용자 정의 (예: roadmapStore.advanceToNext + 입력 저장)
                    onAdvance()
                    // 2. wizard 모드면 다음 stage 자동 push, 아니면 시트 닫고 RoadmapView 복귀
                    if let wiz = wizardOnAdvance { wiz() } else { continueBarDismiss() }
                } label: {
                    HStack(spacing: 6) {
                        Text(isCompleted ? "다음" : advanceLabel)
                            .font(.system(size: 14, weight: .heavy))
                            .lineLimit(1)
                            .fixedSize(horizontal: true, vertical: false)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 12, weight: .heavy))
                    }
                    .foregroundStyle(canAdvance ? Color.white : BUColor.inkMuted)
                    .padding(.horizontal, isCompleted ? 14 : 18)
                    .padding(.vertical, 12)
                    .background(
                        canAdvance
                            ? AnyShapeStyle(LinearGradient(
                                colors: [BUColor.midnight, BUColor.midnight.opacity(0.85)],
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            : AnyShapeStyle(BUColor.midnight.opacity(0.16))
                    )
                    .clipShape(Capsule())
                    .shadow(
                        color: canAdvance ? BUColor.midnight.opacity(0.18) : .clear,
                        radius: 8, x: 0, y: 3
                    )
                }
                .buttonStyle(.plain)
                .disabled(!canAdvance)
                .layoutPriority(1)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
        }
    }

    // MARK: - 수정 저장 helpers

    private var editLabel: String {
        switch editState {
        case .idle:   return "수정 저장"
        case .saving: return "저장 중..."
        case .saved:  return "수정 완료"
        case .error:  return "다시 시도"
        }
    }
    private var editIconName: String {
        switch editState {
        case .idle, .saved: return "checkmark"
        case .saving:       return "arrow.triangle.2.circlepath"
        case .error:        return "exclamationmark.triangle.fill"
        }
    }
    private var editColor: Color {
        switch editState {
        case .idle:   return Color(red: 0.204, green: 0.780, blue: 0.349)   // #34c759
        case .saving: return Color(red: 0.204, green: 0.780, blue: 0.349)
        case .saved:  return Color(red: 0.086, green: 0.639, blue: 0.290)   // #16a34a
        case .error:  return Color(red: 0.863, green: 0.149, blue: 0.149)   // #dc2626
        }
    }

    private func triggerEditSave(action: @escaping () -> Void) {
        guard editState != .saving else { return }
        editState = .saving
        // 비동기 흐름을 흉내내며 즉시 실행 (Supabase 푸시는 백그라운드 Task 내부 처리)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            action()
            editState = .saved
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                if editState == .saved { editState = .idle }
            }
        }
    }
}

// MARK: - Section eyebrow + helpers (web's "Step 2 — …" badge 미러)

public struct BUStageSectionHeader: View {
    public let eyebrow: String
    public let hint: String?

    public init(eyebrow: String, hint: String? = nil) {
        self.eyebrow = eyebrow
        self.hint = hint
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(eyebrow)
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.66)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 9)
                .padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: Capsule())
            if let hint {
                Text(hint)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
    }
}

#if DEBUG
#Preview("BUStageShell — 게이트 막힘") {
    BUStageShell(
        stageId: "industry-selection",
        title: "업종 선택",
        stageEyebrow: "단계 1 · 업종 선택",
        helperText: "내 사업에 맞는 로드맵을 선택하세요.",
        canAdvance: false,
        advanceHint: "업종을 선택하세요",
        onAdvance: {}
    ) {
        Text("Content slot").padding()
    }
}

#Preview("BUStageShell — 진행 가능") {
    BUStageShell(
        stageId: "industry-selection",
        title: "업종 선택",
        stageEyebrow: "단계 1 · 업종 선택",
        helperText: "선택했습니다.",
        canAdvance: true,
        advanceHint: "선택 완료 — 다음 단계로 진행",
        onAdvance: {}
    ) {
        Text("Content slot").padding()
    }
}
#endif
