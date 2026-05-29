//
//  BUStageTaskList.swift — 단계별 시간추정 액션 체크리스트 (웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/CurrentStageView.tsx
//           (stageTasks.map → taskCheckItem + estimatedMinutes 배지)
//
//  데이터:  packages/shared/src/starter-data.ts  → starterTaskMap
//           packages/shared/src/i18n.ts          → taskTitleCopy (ko)
//
//  UI:
//   • "X / Y 완료" 진행도 칩
//   • 각 task = 체크박스 + 한 줄 제목 + "5분" 시간배지 (체크 시 회색·strikethrough)
//   • 56pt 터치 타겟, Apple HIG 준수
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUStageTaskList: View {

    public let stageId: String
    public let industryCategoryId: String?
    @Binding public var completed: Set<String>

    public init(stageId: String, industryCategoryId: String? = nil, completed: Binding<Set<String>>) {
        self.stageId = stageId
        self.industryCategoryId = industryCategoryId
        self._completed = completed
    }

    private var tasks: [BUStageTask] {
        BUStageTaskRegistry.tasks(for: stageId, industryCategoryId: industryCategoryId)
    }

    private var doneCount: Int {
        tasks.filter { completed.contains($0.id) }.count
    }

    public var body: some View {
        if tasks.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                header
                taskRows
            }
        }
    }

    private var header: some View {
        let allDone = doneCount == tasks.count
        return HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text("이 단계 액션 체크리스트")
                .font(.system(size: 13.5, weight: .heavy))
                .tracking(-0.05)
                .foregroundStyle(BUColor.ink)
            Spacer(minLength: 4)
            HStack(spacing: 3) {
                Image(systemName: allDone ? "checkmark.circle.fill" : "circle.dashed")
                    .font(.system(size: 11, weight: .heavy))
                Text("\(doneCount) / \(tasks.count) 완료")
                    .font(.system(size: 11, weight: .heavy))
                    .monospacedDigit()
            }
            .foregroundStyle(allDone ? Color(red: 0.020, green: 0.588, blue: 0.412) : BUColor.midnight)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
                (allDone ? Color(red: 0.020, green: 0.588, blue: 0.412) : BUColor.midnight).opacity(0.08),
                in: Capsule()
            )
        }
    }

    private var taskRows: some View {
        VStack(spacing: 0) {
            ForEach(Array(tasks.enumerated()), id: \.element.id) { idx, task in
                if idx > 0 {
                    Rectangle()
                        .fill(BUColor.midnight.opacity(0.10))
                        .frame(height: 0.5)
                }
                row(task: task)
            }
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
        )
    }

    private func row(task: BUStageTask) -> some View {
        let isDone = completed.contains(task.id)
        return Button {
            withAnimation(.easeInOut(duration: 0.18)) {
                if isDone { completed.remove(task.id) } else { completed.insert(task.id) }
            }
        } label: {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(isDone ? BUColor.midnight : Color.white)
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(isDone ? Color.clear : BUColor.midnight.opacity(0.25), lineWidth: 1.5)
                    if isDone {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: 26, height: 26)
                .padding(.top, 2)

                Text(task.title)
                    .font(.system(size: 14.5, weight: .semibold))
                    .tracking(-0.015)
                    .foregroundStyle(isDone ? BUColor.ink.opacity(0.5) : BUColor.ink)
                    .strikethrough(isDone, color: BUColor.ink.opacity(0.5))
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if !isDone, let minutes = task.estimatedMinutes {
                    Text("\(minutes)분")
                        .font(.system(size: 11, weight: .heavy))
                        .monospacedDigit()
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.08), in: Capsule())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: 56)
            .background(isDone ? BUColor.midnight.opacity(0.03) : Color.clear)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Persisting wrapper (자동 @AppStorage 저장)
//
//   BUStageShell 이 자동으로 사용 — stage 본문 하단에 task list 가 자동 출력.
//   key = "stageTasks.<stageId>" — 단계별로 별도 저장, 다른 stage 와 충돌 없음.
//
public struct BUStageTaskListPersisted: View {

    public let stageId: String
    public let industryCategoryId: String?

    @AppStorage private var raw: String

    public init(stageId: String, industryCategoryId: String? = nil) {
        self.stageId = stageId
        self.industryCategoryId = industryCategoryId
        self._raw = AppStorage(wrappedValue: "[]", "stageTasks.\(stageId)")
    }

    private var doneBinding: Binding<Set<String>> {
        Binding(
            get: { Set(BUStageTaskPersist.decode(raw)) },
            set: { raw = BUStageTaskPersist.encode(Array($0)) }
        )
    }

    public var body: some View {
        BUStageTaskList(stageId: stageId, industryCategoryId: industryCategoryId, completed: doneBinding)
    }
}

#if DEBUG
#Preview("BUStageTaskList — target-customer-definition") {
    struct Demo: View {
        @State var done: Set<String> = ["tc-age-narrowed"]
        var body: some View {
            ScrollView {
                BUStageTaskList(stageId: "target-customer-definition", completed: $done)
                    .padding()
            }
            .background(BUColor.surface)
        }
    }
    return Demo()
}
#endif
