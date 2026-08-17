//
//  FundingPlansListSheet.swift — 내 사업계획서 목록 → 터치 → 상세 열람 (펀딩)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/FundingPlansListModal.tsx (2026-08-14)
//  서버:     GET/DELETE /api/funding/plans (business_plan_drafts 원장, RLS 본인 스코프)
//
//  목록(최신순) → 항목 탭 → 섹션 뷰 + 전체 복사 + 삭제.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
#if canImport(UIKit)
import UIKit
#endif

struct FundingPlansListSheet: View {

    @Environment(\.dismiss) private var dismiss

    @State private var loading: Bool = true
    @State private var error: String? = nil
    @State private var plans: [FundingRepository.SavedPlan] = []
    @State private var selected: FundingRepository.SavedPlan? = nil
    @State private var copied: Bool = false
    @State private var confirmDelete: Bool = false

    private static let notice = "생성 결과는 초안입니다. 반드시 공고에 첨부된 공식 양식(HWP)에 옮겨 제출하세요."

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        if let plan = selected {
                            detailView(plan)
                        } else {
                            listView
                        }
                        Color.clear.frame(height: 32)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle(selected == nil ? "내 사업계획서" : (selected?.programName ?? "사업계획서"))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                if selected != nil {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button {
                            withAnimation { selected = nil }
                        } label: {
                            Label("목록", systemImage: "chevron.left")
                        }
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
        .task { await load() }
        .alert("이 사업계획서를 삭제할까요?", isPresented: $confirmDelete) {
            Button("삭제", role: .destructive) { Task { await deleteSelected() } }
            Button("취소", role: .cancel) {}
        } message: {
            Text("되돌릴 수 없어요.")
        }
    }

    // MARK: - List

    @ViewBuilder
    private var listView: some View {
        if loading {
            VStack(spacing: 12) {
                ProgressView()
                Text("불러오는 중…")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 50)
        } else if let err = error {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle").foregroundStyle(BUColor.danger)
                    Text("불러오기 실패").font(.system(size: 14, weight: .heavy))
                }
                Text(err).font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                Button { Task { await load() } } label: {
                    Text("다시 시도")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18).padding(.vertical, 10)
                        .frame(minHeight: BUSpacing.minTapTarget)
                        .background(BUColor.midnight, in: Capsule())
                }
                .buttonStyle(.plain)
            }
            .padding(BUSpacing.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(cardSurface)
        } else if plans.isEmpty {
            VStack(spacing: 8) {
                Image(systemName: "doc.text")
                    .font(.system(size: 28, weight: .light))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.5))
                Text("아직 저장된 사업계획서가 없어요")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("공고 카드의 '맞춤 계획서'로 첫 초안을 만들어보세요")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 50)
        } else {
            Text("\(plans.count)건 · 최신순")
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
            ForEach(plans) { plan in
                Button {
                    withAnimation { selected = plan }
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.top, 2)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(plan.programName ?? "일반 사업계획서")
                                .font(.system(size: 13.5, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                                .lineLimit(1)
                            if let s = plan.summary, !s.isEmpty {
                                Text(s)
                                    .font(.system(size: 12.5, weight: .medium))
                                    .foregroundStyle(BUColor.ink.opacity(0.7))
                                    .lineLimit(2)
                            }
                            Text(metaLine(plan))
                                .font(.system(size: 11.5, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted.opacity(0.6))
                    }
                    .padding(BUSpacing.cardPadding)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardSurface)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func metaLine(_ plan: FundingRepository.SavedPlan) -> String {
        var parts = [formatDate(plan.createdAt), "\(plan.sections.count)개 섹션"]
        if let m = plan.missingInfo, !m.isEmpty { parts.append("채울 항목 \(m.count)") }
        return parts.joined(separator: " · ")
    }

    // MARK: - Detail

    private func detailView(_ plan: FundingRepository.SavedPlan) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            Text(Self.notice)
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(Color(red: 0.57, green: 0.25, blue: 0.05))
                .padding(11)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.warn.opacity(0.09), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text("\(formatDate(plan.createdAt)) 생성")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)

            if let s = plan.summary, !s.isEmpty {
                Text(s)
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(BUColor.midnightDeep)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let missing = plan.missingInfo, !missing.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("✍️ 이 \(missing.count)가지만 채우면 완성돼요")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                    ForEach(missing, id: \.self) { item in
                        HStack(alignment: .top, spacing: 8) {
                            Text("☐").font(.system(size: 12.5, weight: .bold)).foregroundStyle(BUColor.midnight)
                            Text(item).font(.system(size: 12.5, weight: .medium)).foregroundStyle(BUColor.ink)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            ForEach(plan.sections, id: \.title) { section in
                VStack(alignment: .leading, spacing: 6) {
                    Text(section.title).font(.system(size: 13.5, weight: .heavy)).foregroundStyle(BUColor.ink)
                    Text(section.content)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.ink.opacity(0.78))
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(BUSpacing.cardPadding)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(cardSurface)
            }

            HStack(spacing: 8) {
                Button { copyAll(plan) } label: {
                    HStack(spacing: 5) {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc").font(.system(size: 11, weight: .heavy))
                        Text(copied ? "복사됨" : "전체 복사").font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
                }
                .buttonStyle(.plain)

                Button { confirmDelete = true } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "trash").font(.system(size: 11, weight: .heavy))
                        Text("삭제").font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.danger)
                    .padding(.horizontal, 16)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.danger.opacity(0.08), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Actions

    private func load() async {
        loading = true
        error = nil
        defer { loading = false }
        let repo = FundingRepository(supabase: BUSupabase.shared.client)
        do {
            plans = try await repo.listSavedPlans(limit: 50)
        } catch {
            self.error = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }
    }

    private func deleteSelected() async {
        guard let plan = selected else { return }
        let repo = FundingRepository(supabase: BUSupabase.shared.client)
        do {
            try await repo.deleteSavedPlan(id: plan.id)
            plans.removeAll { $0.id == plan.id }
            withAnimation { selected = nil }
        } catch {
            self.error = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }
    }

    private func copyAll(_ plan: FundingRepository.SavedPlan) {
        var text = "[\(plan.programName ?? "사업계획서")] 초안 — FOUND.ONE"
        if let s = plan.summary, !s.isEmpty { text += "\n\(s)" }
        for section in plan.sections { text += "\n\n\(section.title)\n\(section.content)" }
        #if canImport(UIKit)
        UIPasteboard.general.string = text
        #endif
        copied = true
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            copied = false
        }
    }

    private func formatDate(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let d = f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
        guard let d else { return String(iso.prefix(10)) }
        let out = DateFormatter()
        out.dateFormat = "yyyy.MM.dd"
        return out.string(from: d)
    }

    private var cardSurface: some View {
        RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
            .fill(Color.white.opacity(0.85))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
    }
}
