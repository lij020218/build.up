//
//  BUFAQCard.swift — 세무·대출 FAQ 검색/표시 카드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/TaxGuideStage.tsx +
//           LoanGuideStage.tsx 의 TaxFaqCard / LoanFaqCard 컴포넌트.
//
//  책임:
//   • 사용자가 입력한 질문 텍스트로 FAQ 매칭 (TaxFAQ.match / LoanFAQ.match)
//   • 매칭된 질문은 펼치기/접기 토글
//   • 카테고리 칩, 출처 링크, 검증 일자 표시
//   • 매칭 없으면 카테고리별 추천 질문 표시
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - Common bullet

private struct FAQEntryCard<Tail: View>: View {
    let category: String
    let question: String
    let answer: String
    let sources: [FAQSource]
    let lastVerified: String
    @State private var expanded = false
    let tail: Tail

    init(category: String, question: String, answer: String, sources: [FAQSource], lastVerified: String, @ViewBuilder tail: () -> Tail = { EmptyView() }) {
        self.category = category
        self.question = question
        self.answer = answer
        self.sources = sources
        self.lastVerified = lastVerified
        self.tail = tail()
    }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                Button {
                    withAnimation(.snappy(duration: 0.22)) { expanded.toggle() }
                } label: {
                    HStack(spacing: BUSpacing.sm) {
                        BUTagBadge(category, style: .soft)
                        Text(question)
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                        Image(systemName: expanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if expanded {
                    Text(answer)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .textSelection(.enabled)
                    tail
                    if !sources.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            BUEyebrow("출처")
                            ForEach(sources, id: \.url) { src in
                                if let url = URL(string: src.url) {
                                    Link(destination: url) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "link")
                                                .font(.system(size: 10, weight: .semibold))
                                            Text(src.label)
                                                .font(BUFont.bodyCaption.weight(.medium))
                                        }
                                        .foregroundStyle(BUColor.midnight)
                                    }
                                }
                            }
                        }
                    }
                    Text("검증 \(lastVerified)")
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
    }
}

// MARK: - Tax FAQ

public struct BUTaxFAQCard: View {
    @State private var query: String = ""
    @State private var matched: [TaxFAQEntry] = []
    @State private var showAll: Bool = false

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무 자주 묻는 질문")
                    Text("미리 검증된 12개 답변 — 매칭 안 되면 키워드만 바꿔보세요.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        TextField("간이과세 / 부가세 / 가산세 / 세무사 ...", text: $query)
                            .font(BUFont.bodySmall)
                            .submitLabel(.search)
                            .onSubmit { search() }
                            .onChange(of: query) { _, _ in search() }
                    }
                    .padding(.horizontal, 10).padding(.vertical, 9)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }

            if !query.isEmpty && matched.isEmpty {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.circle")
                                .font(.system(size: 13))
                                .foregroundStyle(BUColor.danger)
                            Text("매칭된 FAQ 가 없어요").font(BUFont.bodySmall.weight(.semibold))
                        }
                        Text("'간이과세', '부가세 신고', '청년 감면', '가산세' 같은 키워드로 다시 시도해 보세요.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }

            ForEach(displayedEntries) { entry in
                FAQEntryCard(
                    category: entry.category.labelKo,
                    question: entry.question,
                    answer: entry.answer,
                    sources: entry.sources,
                    lastVerified: entry.lastVerified
                )
            }

            if matched.isEmpty && !showAll {
                Button {
                    withAnimation { showAll = true }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "list.bullet")
                            .font(.system(size: 12, weight: .semibold))
                        Text("전체 FAQ 12개 모두 보기")
                            .font(BUFont.bodySmall.weight(.semibold))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.06), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var displayedEntries: [TaxFAQEntry] {
        if !matched.isEmpty { return matched }
        if showAll { return TaxFAQ.entries }
        // 기본: 가장 자주 묻는 4개 (등록·부가세·종소세·신고의무)
        return Array(TaxFAQ.entries.prefix(4))
    }

    private func search() {
        matched = TaxFAQ.match(query)
    }
}

// MARK: - Loan FAQ

public struct BULoanFAQCard: View {
    @State private var query: String = ""
    @State private var matched: [LoanFAQEntry] = []
    @State private var showAll: Bool = false

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("자금·대출 자주 묻는 질문")
                    Text("미리 검증된 12개 답변 — 매칭 안 되면 키워드만 바꿔보세요.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        TextField("정책자금 / TIPS / 새출발기금 / 신용점수 ...", text: $query)
                            .font(BUFont.bodySmall)
                            .submitLabel(.search)
                            .onSubmit { search() }
                            .onChange(of: query) { _, _ in search() }
                    }
                    .padding(.horizontal, 10).padding(.vertical, 9)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }

            if !query.isEmpty && matched.isEmpty {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.circle")
                                .font(.system(size: 13))
                                .foregroundStyle(BUColor.danger)
                            Text("매칭된 FAQ 가 없어요").font(BUFont.bodySmall.weight(.semibold))
                        }
                        Text("'정책자금', '청년창업', 'TIPS', '신용점수', '새출발기금' 같은 키워드로 다시 시도해 보세요.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }

            ForEach(displayedEntries) { entry in
                FAQEntryCard(
                    category: entry.category.labelKo,
                    question: entry.question,
                    answer: entry.answer,
                    sources: entry.sources,
                    lastVerified: entry.lastVerified
                )
            }

            if matched.isEmpty && !showAll {
                Button {
                    withAnimation { showAll = true }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "list.bullet")
                            .font(.system(size: 12, weight: .semibold))
                        Text("전체 FAQ 12개 모두 보기")
                            .font(BUFont.bodySmall.weight(.semibold))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.06), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var displayedEntries: [LoanFAQEntry] {
        if !matched.isEmpty { return matched }
        if showAll { return LoanFAQ.entries }
        return Array(LoanFAQ.entries.prefix(4))
    }

    private func search() {
        matched = LoanFAQ.match(query)
    }
}

#if DEBUG
#Preview("TaxFAQCard") {
    ScrollView {
        BUTaxFAQCard()
            .padding()
    }
    .background(BUBackgroundSurface())
}

#Preview("LoanFAQCard") {
    ScrollView {
        BULoanFAQCard()
            .padding()
    }
    .background(BUBackgroundSurface())
}
#endif
