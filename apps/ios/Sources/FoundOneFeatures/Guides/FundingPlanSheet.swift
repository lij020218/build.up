//
//  FundingPlanSheet.swift — 공고 맞춤 사업계획서 초안 시트 (펀딩)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/FundingPlanModal.tsx (2026-08-14)
//  서버:     /api/ai/business-plan/generate (POST, program 모드 = 주 2회 한도, KST 월요일 초기화)
//
//  확인(한도 고지) → 생성 → 섹션 뷰 + 전체 복사.
//  캐시: UserDefaults "fo.fundingPlan.<uid>.<programId>" — 재열람은 한도 미소모.
//        키에 uid 포함(계정 격리 불변식 — 다른 계정 캐시 열람 금지).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
#if canImport(UIKit)
import UIKit
#endif

struct FundingPlanSheet: View {

    let program: FundingProgram
    let profile: FundingProfileSnapshot

    @Environment(\.dismiss) private var dismiss

    private enum Phase { case confirm, loading, result, error }
    @State private var phase: Phase = .confirm
    @State private var draft: FundingRepository.BusinessPlanDraft? = nil
    @State private var fromCache: Bool = false
    @State private var errorMessage: String? = nil
    @State private var copied: Bool = false

    private static let notice = "생성 결과는 초안입니다. 반드시 공고에 첨부된 공식 양식(HWP)에 옮겨 제출하세요 — 임의 양식 제출 시 평가에서 제외될 수 있어요."

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        programHeader

                        switch phase {
                        case .confirm: confirmView
                        case .loading: loadingView
                        case .error: errorView
                        case .result: resultView
                        }

                        Color.clear.frame(height: 32)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("맞춤 사업계획서")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
        .task { loadCacheIfAny() }
    }

    // MARK: - Header

    private var programHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("대상 공고")
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                .textCase(.uppercase)
            Text(program.name)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(program.organizer)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
        }
    }

    // MARK: - Confirm

    private var confirmView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("사장님의 로드맵 데이터(업종·자본·입지)와 이 공고의 지원 대상·내용을 반영해 PSST 구조의 초안을 작성해 드려요.")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)

            Text("무료 · 주 2회 한도 — 이번 생성으로 1회를 사용해요. 생성된 초안은 저장되어 다시 볼 때는 한도를 쓰지 않아요.")
                .font(.system(size: 12.5, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text(Self.notice)
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                Task { await generate() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 12, weight: .heavy))
                    Text("초안 생성하기")
                        .font(.system(size: 14, weight: .heavy))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, minHeight: BUSpacing.minTapTarget)
                .padding(.vertical, 4)
                .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    // MARK: - Loading / Error

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("공고 특성에 맞춰 작성하고 있어요…")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            Text("최대 2분 정도 걸릴 수 있어요. 화면을 닫지 말아 주세요.")
                .font(.system(size: 10.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 50)
    }

    private var errorView: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(BUColor.danger)
                Text("생성 실패")
                    .font(.system(size: 14, weight: .heavy))
            }
            Text(errorMessage ?? "잠시 후 다시 시도해 주세요.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                phase = .confirm
            } label: {
                Text("돌아가기")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    // MARK: - Result

    @ViewBuilder
    private var resultView: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 고지 배너 — 항상 상단
            Text(Self.notice)
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(Color(red: 0.57, green: 0.25, blue: 0.05))
                .padding(11)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.warn.opacity(0.09), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

            if fromCache {
                Text("저장본 — 재열람은 한도를 쓰지 않아요")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }

            if let summary = draft?.summary, !summary.isEmpty {
                Text(summary)
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(BUColor.midnightDeep)
                    .fixedSize(horizontal: false, vertical: true)
            }

            ForEach(draft?.sections ?? [], id: \.title) { section in
                VStack(alignment: .leading, spacing: 6) {
                    Text(section.title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
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
                Button {
                    copyAll()
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 11, weight: .heavy))
                        Text(copied ? "복사됨" : "전체 복사")
                            .font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
                }
                .buttonStyle(.plain)

                Button {
                    phase = .confirm
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 11, weight: .heavy))
                        Text("다시 생성")
                            .font(.system(size: 13, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 16)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Actions

    private func generate() async {
        phase = .loading
        errorMessage = nil
        let repo = FundingRepository(supabase: BUSupabase.shared.client)
        do {
            let result = try await repo.generateProgramPlan(
                program: program,
                user: FundingRepository.PlanUserInput(profile: profile)
            )
            draft = result
            fromCache = false
            phase = .result
            saveCache(result)
        } catch {
            errorMessage = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
            phase = .error
        }
    }

    private func copyAll() {
        guard let draft else { return }
        var text = "[\(program.name)] 맞춤 사업계획서 초안 — FOUND.ONE"
        if let s = draft.summary, !s.isEmpty { text += "\n\(s)" }
        for section in draft.sections { text += "\n\n\(section.title)\n\(section.content)" }
        #if canImport(UIKit)
        UIPasteboard.general.string = text
        #endif
        copied = true
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            copied = false
        }
    }

    // MARK: - Cache (uid 스코프 — 계정 격리)

    private var cacheKey: String? {
        guard let uid = BUSupabase.shared.client.auth.currentSession?.user.id.uuidString else { return nil }
        return "fo.fundingPlan.\(uid).\(program.id)"
    }

    private func loadCacheIfAny() {
        guard phase == .confirm, let key = cacheKey,
              let data = UserDefaults.standard.data(forKey: key),
              let cached = try? JSONDecoder().decode(CachedDraft.self, from: data),
              !cached.sections.isEmpty
        else { return }
        draft = FundingRepository.BusinessPlanDraft(
            summary: cached.summary,
            sections: cached.sections.map { .init(title: $0.title, content: $0.content) }
        )
        fromCache = true
        phase = .result
    }

    private func saveCache(_ result: FundingRepository.BusinessPlanDraft) {
        guard let key = cacheKey else { return }
        let cached = CachedDraft(
            summary: result.summary,
            sections: result.sections.map { .init(title: $0.title, content: $0.content) }
        )
        if let data = try? JSONEncoder().encode(cached) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private struct CachedDraft: Codable {
        struct Section: Codable { let title: String; let content: String }
        let summary: String?
        let sections: [Section]
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
