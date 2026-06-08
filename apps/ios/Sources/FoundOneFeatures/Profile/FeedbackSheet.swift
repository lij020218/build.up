//
//  FeedbackSheet.swift — 인앱 피드백 (내 정보 → 의견 보내기). 웹 FeedbackCard 미러.
//   POST /api/feedback. 카테고리 + 자유 텍스트.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct FeedbackSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var category = "idea"
    @State private var area = "other"   // 설정에서 진입하므로 기본 '기타', 사용자가 선택
    @State private var message = ""
    @State private var sending = false
    @State private var sent = false
    @State private var failed = false

    private let cats: [(key: String, label: String)] = [
        ("bug", "버그·오류"), ("idea", "기능 제안"), ("ux", "사용성"), ("other", "기타"),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("불편한 점·제안 무엇이든 — 빠르게 반영하겠습니다")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkMuted)

                    // 영역 — 어디에 관한 의견인가 (웹과 동일 분류)
                    HStack(spacing: 8) {
                        Text("어디에 관한 의견인가요?")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        Spacer(minLength: 0)
                        Menu {
                            ForEach(FeedbackAreas.all) { a in
                                Button(a.label) { area = a.key }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Text(FeedbackAreas.label(area))
                                    .font(.system(size: 12.5, weight: .semibold))
                                Image(systemName: "chevron.up.chevron.down").font(.system(size: 10))
                            }
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 11).padding(.vertical, 6)
                            .background(Capsule().fill(BUColor.midnight.opacity(0.06)))
                            .overlay(Capsule().stroke(BUColor.midnight.opacity(0.5), lineWidth: 1))
                        }
                    }

                    // 카테고리 칩
                    FlexChips(cats: cats, selected: $category)

                    // 본문
                    ZStack(alignment: .topLeading) {
                        if message.isEmpty {
                            Text("예: 매출 입력 후 그래프가 바로 안 바뀌어요")
                                .font(.system(size: 14))
                                .foregroundStyle(BUColor.inkMuted.opacity(0.6))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                        }
                        TextEditor(text: $message)
                            .font(.system(size: 14))
                            .frame(minHeight: 120)
                            .padding(6)
                            .scrollContentBackground(.hidden)
                    }
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.7)))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.10), lineWidth: 1))

                    if failed {
                        Text("전송 실패 — 잠시 후 다시 시도해 주세요")
                            .font(.system(size: 12)).foregroundStyle(BUColor.danger)
                    }

                    Button { send() } label: {
                        Text(sending ? "보내는 중…" : "보내기")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(RoundedRectangle(cornerRadius: 12)
                                .fill(message.trimmingCharacters(in: .whitespaces).isEmpty ? Color.black.opacity(0.12) : BUColor.midnightInk))
                    }
                    .buttonStyle(.plain)
                    .disabled(message.trimmingCharacters(in: .whitespaces).isEmpty || sending)
                    .padding(.top, 4)
                }
                .padding(BUSpacing.lg)
            }
            .background(BUColor.appBackground.ignoresSafeArea())
            .navigationTitle("의견 보내기")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .alert("보냈어요 · 감사합니다", isPresented: $sent) {
                Button("확인") { dismiss() }
            }
        }
    }

    private func send() {
        let msg = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !msg.isEmpty, !sending else { return }
        sending = true
        failed = false
        Task { @MainActor in
            let repo = FeedbackRepository(supabase: BUSupabase.shared.client)
            let ok = await repo.send(category: category, area: area, message: String(msg.prefix(2000)), screen: "profile")
            sending = false
            if ok { sent = true } else { failed = true }
        }
    }
}

/// 카테고리 칩 행 (간단 wrap).
private struct FlexChips: View {
    let cats: [(key: String, label: String)]
    @Binding var selected: String

    var body: some View {
        HStack(spacing: 6) {
            ForEach(cats, id: \.key) { c in
                let on = selected == c.key
                Button { selected = c.key } label: {
                    Text(c.label)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(on ? BUColor.midnight : BUColor.inkMuted)
                        .padding(.horizontal, 11)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(on ? BUColor.midnight.opacity(0.06) : Color.white.opacity(0.6)))
                        .overlay(Capsule().stroke(on ? BUColor.midnight.opacity(0.7) : Color.black.opacity(0.12), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
