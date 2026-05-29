//
//  BUInteractiveChecklist.swift — 사장님이 직접 ✓ 토글하는 체크리스트 카드.
//
//  웹 SSOT: PreLaunchStage.tsx (PreLaunchCheckList), OperationsSetupStage.tsx,
//          PlatformSetupStage.tsx, LaunchGtmStage.tsx, TaxGuideStage.tsx 의 toggleCheck 패턴.
//
//  사용:
//    @State private var checks: Set<String> = []
//
//    BUInteractiveChecklist(
//        items: [
//            .init(id: "clean", label: "매장·시설 청결", detail: "바닥·테이블·화장실 모두 점검·소독"),
//            ...
//        ],
//        checked: $checks
//    )
//
//  특징:
//   • 탭하면 ✓ 토글 + 배경 색 변경 + label 회색·strikethrough
//   • 진행도 헤더 (X / Y) 자동 표시 (optional title 함께)
//   • 모바일 56pt 터치 타겟
//   • Apple HIG — checkmark 22pt rounded square
//

import SwiftUI
import FoundOneDesignSystem

public struct BUChecklistItem: Identifiable, Sendable, Hashable {
    public let id: String
    public let label: String
    public let detail: String

    public init(id: String, label: String, detail: String) {
        self.id = id
        self.label = label
        self.detail = detail
    }
}

public struct BUInteractiveChecklist: View {

    public let title: String?
    public let items: [BUChecklistItem]
    @Binding public var checked: Set<String>

    public init(title: String? = nil, items: [BUChecklistItem], checked: Binding<Set<String>>) {
        self.title = title
        self.items = items
        self._checked = checked
    }

    private var doneCount: Int {
        items.filter { checked.contains($0.id) }.count
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let title {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .tracking(-0.05)
                        .foregroundStyle(BUColor.ink)
                    Spacer(minLength: 4)
                    progressChip
                }
            }
            checklist
        }
    }

    private var progressChip: some View {
        let allDone = doneCount == items.count && items.count > 0
        return HStack(spacing: 3) {
            Image(systemName: allDone ? "checkmark.circle.fill" : "circle.dashed")
                .font(.system(size: 11, weight: .heavy))
            Text("\(doneCount) / \(items.count)")
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

    private var checklist: some View {
        VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                if idx > 0 {
                    Rectangle()
                        .fill(BUColor.midnight.opacity(0.10))
                        .frame(height: 0.5)
                }
                row(item: item)
            }
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
        )
    }

    private func row(item: BUChecklistItem) -> some View {
        let isChecked = checked.contains(item.id)
        return Button {
            withAnimation(.easeInOut(duration: 0.18)) {
                if isChecked { checked.remove(item.id) } else { checked.insert(item.id) }
            }
        } label: {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(isChecked ? BUColor.midnight : Color.white)
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(isChecked ? Color.clear : BUColor.midnight.opacity(0.25), lineWidth: 1.5)
                    if isChecked {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: 26, height: 26)
                .padding(.top, 2)

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.label)
                        .font(.system(size: 15, weight: .heavy))
                        .tracking(-0.015)
                        .foregroundStyle(isChecked ? BUColor.ink.opacity(0.5) : BUColor.ink)
                        .strikethrough(isChecked, color: BUColor.ink.opacity(0.5))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                    Text(item.detail)
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: 56)
            .background(
                isChecked ? BUColor.midnight.opacity(0.03) : Color.clear
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Codable helpers for @AppStorage persistence
//
// 사용 예:
//   @AppStorage("stage.foo.checks") private var checksRaw: String = "[]"
//   private var checks: Binding<Set<String>> {
//       Binding(
//           get: { Set(BUChecklistPersist.decode(checksRaw)) },
//           set: { checksRaw = BUChecklistPersist.encode(Array($0)) }
//       )
//   }
//

public enum BUChecklistPersist {
    public static func decode(_ raw: String) -> [String] {
        guard let data = raw.data(using: .utf8),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [String]
        else { return [] }
        return arr
    }

    public static func encode(_ arr: [String]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: arr),
              let s = String(data: data, encoding: .utf8)
        else { return "[]" }
        return s
    }
}

#if DEBUG
#Preview("BUInteractiveChecklist") {
    struct Demo: View {
        @State var checks: Set<String> = ["day-pos"]
        var body: some View {
            ScrollView {
                BUInteractiveChecklist(
                    title: "당일 운영 체크",
                    items: [
                        .init(id: "day-cleanliness", label: "매장·시설 청결 & 위생 최종 점검", detail: "바닥·테이블·화장실·쓰레기통 모두 점검·소독"),
                        .init(id: "day-staff-briefing", label: "직원 역할 배분 & 브리핑", detail: "포지션·응대 멘트·비상 대응 방법 공유"),
                        .init(id: "day-pos", label: "POS & 결제 단말기 정상 작동", detail: "카드·현금·간편결제 테스트 결제 후 즉시 취소"),
                    ],
                    checked: $checks
                )
                .padding()
            }
            .background(BUColor.surface)
        }
    }
    return Demo()
}
#endif
