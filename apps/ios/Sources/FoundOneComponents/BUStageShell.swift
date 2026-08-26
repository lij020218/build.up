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
#if canImport(UIKit)
import UIKit
#endif
import FoundOneDesignSystem
import FoundOneCore

// 현재 로드맵 클러스터의 stageId 순서. 주입되면 BUStageShell 이 단계 번호를 경로 위치로 계산.
public struct RoadmapStageOrderKey: EnvironmentKey {
    public static let defaultValue: [String] = []
}
public extension EnvironmentValues {
    var roadmapStageOrder: [String] {
        get { self[RoadmapStageOrderKey.self] }
        set { self[RoadmapStageOrderKey.self] = newValue }
    }
}

public struct BUStageShell<Content: View>: View {

    /// 시뮬 시각 검증 전용 초기 스크롤 앵커 — BU_DEMO_ALLOW=1 + BU_DEMO_SCROLL=bottom|center 일 때만.
    /// 평상시 nil = 기본 동작 (defaultScrollAnchor(nil)).
    fileprivate static var demoScrollAnchor: UnitPoint? {
        guard ProcessInfo.processInfo.environment["BU_DEMO_ALLOW"] == "1" else { return nil }
        switch ProcessInfo.processInfo.environment["BU_DEMO_SCROLL"] {
        case "bottom": return .bottom
        case "center": return .center
        default: return nil
        }
    }

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
    /// 페이지형 단계 — 마지막 페이지 전 continue bar 가 "다음 페이지"로 넘김(웹 통일). nil 이면 기존 "다음 단계로".
    public let onNextPage: (() -> Void)?
    public let onEditSave: (() -> Void)?
    /// 페이지별 KEY ACTION 오버라이드 (웹 패리티 — operations/loan/tax/pre-launch-final 처럼
    /// 페이지마다 KEY ACTION 이 다른 단계). nil 이면 BUStageKeyActionRegistry 단일값 사용.
    public let keyActionOverride: BUStageKeyAction?
    public let content: Content

    @Environment(\.dismiss) private var dismiss
    // 현재 클러스터 경로(stageId 순서) — 주입되면 단계 번호를 경로 위치 기준으로 계산.
    @Environment(\.roadmapStageOrder) private var stageOrder

    /// 키보드 표시 여부 — 키보드가 뜨면 하단 Continue 바를 숨긴다.
    /// ⚠️ .safeAreaInset(.bottom) 바는 키보드가 뜨면 키보드 위로 따라 올라가 콘텐츠와 겹쳐 깨져 보인다.
    ///   .ignoresSafeArea(.keyboard) 로 고정하면 TextField 키보드 회피가 깨지므로(상호 배타),
    ///   권장 해법대로 키보드 표시 중에는 바를 숨기고 키보드 위 "완료" 버튼으로 닫게 한다.
    @State private var keyboardVisible = false

    /// 표시용 eyebrow — 하드코딩된 "단계 N" 대신 실제 경로 위치(idx+1/total)로 치환.
    /// ⚠️ 각 stage 가 전역 고정 번호("단계 10" 등)를 박아 둬서 클러스터별 경로에서 5→11 처럼
    ///   점프하던 버그 수정. stageOrder 가 비면(주입 안 됨) 원래 문자열 유지(후방호환).
    private var resolvedEyebrow: String {
        guard let idx = stageOrder.firstIndex(of: stageId) else { return stageEyebrow }
        let n = idx + 1
        let total = stageOrder.count
        // 라벨 추출: "단계 N · 라벨" → "라벨", "단계 · 라벨" → "라벨", 그 외 → 전체.
        let label: String
        if let r = stageEyebrow.range(of: " · ") {
            label = String(stageEyebrow[r.upperBound...]).trimmingCharacters(in: .whitespaces)
        } else if stageEyebrow.hasPrefix("단계") {
            label = ""
        } else {
            label = stageEyebrow
        }
        return label.isEmpty ? "단계 \(n) / \(total)" : "단계 \(n) · \(label)"
    }

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
        onNextPage: (() -> Void)? = nil,
        totalPages: Int? = nil,
        keyActionOverride: BUStageKeyAction? = nil,
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
        self.onNextPage = onNextPage
        self.onEditSave = onEditSave
        self.keyActionOverride = keyActionOverride
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
            BUFlatBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // KEY ACTION 미드나이트 히어로 — 페이지별 오버라이드 우선, 없으면 registry 단일값 (웹 SSOT 미러)
                    if let keyAction = keyActionOverride ?? BUStageKeyActionRegistry.action(for: stageId) {
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

                    // 전문가 체크포인트 — 세무사·노무사·변호사 확인이 필요한 단계에만
                    //   (registry 미등록 단계 = 미렌더. 웹 CurrentStageView 주입과 미러, 2026-07-27)
                    if let checkpoint = BUExpertCheckpoints.checkpoint(for: stageId) {
                        BUExpertCheckpointCard(checkpoint: checkpoint)
                            .padding(.horizontal, BUSpacing.md)
                    }

                    content
                        .padding(.horizontal, BUSpacing.md)

                    // 스타트업 단계 추천 도구·공급사·기술스택 (웹 SSOT 미러, 데이터 없으면 미렌더)
                    BUStartupToolingSection(stageId: stageId)
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
            // 시뮬 시각 검증 — BU_DEMO_SCROLL=bottom|center 로 초기 스크롤 위치 지정
            //   (시뮬 스크롤 주입 불가 대응, BU_DEMO_EMAIL_SHEET 패턴. BU_DEMO_ALLOW=1 이중 가드, 2026-08-26)
            .defaultScrollAnchor(Self.demoScrollAnchor)
            #endif
        }
        .navigationTitle(title)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .safeAreaInset(edge: .bottom, spacing: 0) {
            // 키보드가 떠 있는 동안에는 바를 숨겨 키보드 위로 따라 올라가며 겹치는 깨짐을 방지.
            // (입력 중에는 키보드 위 "완료" 버튼으로 닫고, 닫으면 바가 다시 하단에 고정 노출)
            if !keyboardVisible {
                BUStageContinueBar(
                    stageEyebrow: resolvedEyebrow,
                    advanceLabel: advanceLabel,
                    advanceHint: advanceHint,
                    canAdvance: canAdvance,
                    isCompleted: isCompleted,
                    onAdvance: onAdvance,
                    onUncomplete: onUncomplete,
                    onEditSave: onEditSave,
                    currentPage: currentPage,
                    totalPages: totalPages,
                    onNextPage: onNextPage
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        #if os(iOS)
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
            withAnimation(.easeOut(duration: 0.22)) { keyboardVisible = true }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
            withAnimation(.easeOut(duration: 0.22)) { keyboardVisible = false }
        }
        #endif
        #if os(iOS)
        // 2026-05-29 P0: numberPad/decimalPad 는 리턴 키가 없어 키보드를 닫을 방법이 없음.
        //   40~60대 사장님이 "키보드 어떻게 닫지?" 에서 막히던 문제. 키보드 위 "완료" 버튼 공통 부착.
        //   resignFirstResponder 로 현재 포커스 필드 해제 — content 의 어떤 TextField 든 작동.
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("완료") {
                    UIApplication.shared.sendAction(
                        #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil
                    )
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
            }
        }
        #endif
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

    /// 페이지형 단계 — 마지막 페이지 전엔 "다음 단계로" 대신 "다음 페이지" 버튼을 노출(웹 통일).
    ///   currentPage/totalPages/onNextPage 가 모두 있고 마지막 페이지가 아니면 페이지 넘김 버튼.
    public let currentPage: Int?
    public let totalPages: Int?
    public let onNextPage: (() -> Void)?

    /// 마지막 페이지 전 = 페이지 넘김 모드. (읽기 게이트: 끝까지 본 뒤 "다음 단계로")
    private var hasNextPage: Bool {
        guard let cur = currentPage, let total = totalPages, onNextPage != nil, total > 1 else { return false }
        return cur < total - 1
    }

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
        onEditSave: (() -> Void)? = nil,
        currentPage: Int? = nil,
        totalPages: Int? = nil,
        onNextPage: (() -> Void)? = nil
    ) {
        self.stageEyebrow = stageEyebrow
        self.advanceLabel = advanceLabel
        self.advanceHint = advanceHint
        self.canAdvance = canAdvance
        self.isCompleted = isCompleted
        self.onAdvance = onAdvance
        self.onUncomplete = onUncomplete
        self.onEditSave = onEditSave
        self.currentPage = currentPage
        self.totalPages = totalPages
        self.onNextPage = onNextPage
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

                if hasNextPage {
                    // 페이지형 단계 — 마지막 페이지 전: "다음 페이지"(페이지 넘김, 항상 활성). 단계 advance 아님.
                    Button { onNextPage?() } label: {
                        HStack(spacing: 6) {
                            Text("다음 페이지")
                                .font(.system(size: 14, weight: .heavy))
                                .lineLimit(1)
                                .fixedSize(horizontal: true, vertical: false)
                            Image(systemName: "arrow.right")
                                .font(.system(size: 12, weight: .heavy))
                        }
                        .foregroundStyle(Color.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 12)
                        .background(
                            LinearGradient(
                                colors: [BUColor.midnight, BUColor.midnight.opacity(0.85)],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            in: Capsule()
                        )
                        .shadow(color: BUColor.midnight.opacity(0.18), radius: 8, x: 0, y: 3)
                    }
                    .buttonStyle(.plain)
                    .layoutPriority(1)
                } else {
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
        // 신호등 0: 저장 상태는 BUColor.success(=네이비), 오류만 벽돌(danger).
        case .idle:   return BUColor.success
        case .saving: return BUColor.success
        case .saved:  return BUColor.success
        case .error:  return BUColor.danger
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
