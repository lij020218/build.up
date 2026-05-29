//
//  PopbillConnectSheet.swift — 홈택스 세금계산서·현금영수증 자동 수집 마법사
//
//  웹 SSOT: apps/web/app/lib/components/profile/PopbillConnectCard.tsx
//
//  Step 1: 사업자번호 입력 (팝빌 회원사 여부 확인)
//  Step 2: 결과 안내 — isMember ? 인증서 위임 안내 : 팝빌 가입 안내
//
//  서버 비활성화 시: POPBILL_NOT_CONFIGURED(503) → "곧 활성화됩니다" 메시지
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct PopbillConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    enum Phase { case input, submitting, result(isMember: Bool, nextStep: String), notConfigured }

    @State private var phase: Phase = .input
    @State private var businessNumber: String = ""
    @State private var businessName: String = ""
    @State private var errorMessage: String?

    @FocusState private var bnFocused: Bool

    public var onConnected: (() -> Void)?

    public init(onConnected: (() -> Void)? = nil) {
        self.onConnected = onConnected
    }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        headerBlock
                        switch phase {
                        case .input:          inputForm
                        case .submitting:     submittingView
                        case .result(let m, let ns): resultView(isMember: m, nextStep: ns)
                        case .notConfigured:  notConfiguredView
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("홈택스 자동 수집 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .safeAreaInset(edge: .bottom) {
                switch phase {
                case .input:                primaryActionBar
                case .result(_, _):         doneBar
                case .submitting, .notConfigured: EmptyView()
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("홈택스 자동 수집 (팝빌)")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text("사업자번호만 등록하면 됩니다")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text("Found.One 이 팝빌을 통해 세금계산서·현금영수증 매출을 매일 자동으로 수집합니다. 인증서 위임은 등록 후 안내드려요.")
                .font(.system(size: 13))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Input form

    private var inputForm: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 3) {
                        Text("사업자등록번호 (10자리)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("*")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.danger)
                    }
                    TextField("123-45-67890", text: $businessNumber)
                        .keyboardType(.numberPad)
                        .focused($bnFocused)
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("상호 (선택)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                    TextField("예) 사랑의 도시락", text: $businessName)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = errorMessage {
                    errorBanner(error)
                }
            }
        }
    }

    // MARK: - Submitting

    private var submittingView: some View {
        VStack(spacing: 14) {
            ProgressView().scaleEffect(1.4)
            Text("팝빌 회원사 여부 확인 중…")
                .font(.system(size: 13.5, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
    }

    // MARK: - Result

    private func resultView(isMember: Bool, nextStep: String) -> some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: isMember ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(isMember ? BUColor.success : BUColor.warn)
                    Text(isMember ? "팝빌 회원사 확인됨" : "팝빌 가입 필요")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                }

                Text(nextStep)
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)

                if !isMember {
                    Link(destination: URL(string: "https://www.popbill.com")!) {
                        HStack(spacing: 6) {
                            Text("팝빌에서 가입 / 인증서 등록")
                                .font(.system(size: 13.5, weight: .heavy))
                                .foregroundStyle(.white)
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white)
                        }
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                } else {
                    // 팝빌 홈택스 인증서 위임 안내 링크
                    Link(destination: URL(string: "https://www.popbill.com/Content/Link/HomeTax")!) {
                        HStack(spacing: 6) {
                            Text("팝빌 인증서 위임 안내 보기")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(BUColor.midnight)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Not Configured

    private var notConfiguredView: some View {
        BUCard(.outer) {
            VStack(spacing: 12) {
                Image(systemName: "clock.badge.questionmark")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text("곧 활성화됩니다")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("홈택스 세금계산서·현금영수증 자동 수집 기능을 준비하고 있습니다.\n잠시 후 다시 시도해 주세요.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Action bars

    private var primaryActionBar: some View {
        HStack {
            Spacer()
            Button { submitBusinessNumber() } label: {
                Text(businessNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "사업자번호를 입력하세요" : "등록")
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(minWidth: 140, minHeight: 44)
                    .padding(.horizontal, 18)
                    .background(
                        LinearGradient(colors: [BUColor.midnight, BUColor.midnight.opacity(0.82)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )
                    .opacity(businessNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1.0)
            }
            .disabled(businessNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .buttonStyle(.plain)
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 10)
        }
        .background(.thinMaterial)
    }

    private var doneBar: some View {
        HStack {
            Spacer()
            Button {
                onConnected?()
                dismiss()
            } label: {
                Text("완료")
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(minWidth: 140, minHeight: 44)
                    .padding(.horizontal, 18)
                    .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 10)
        }
        .background(.thinMaterial)
    }

    // MARK: - Submit

    private func submitBusinessNumber() {
        let bn = businessNumber.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !bn.isEmpty else { return }
        errorMessage = nil
        phase = .submitting

        Task {
            let repo = PopbillRepository(supabase: BUSupabase.shared.client)
            do {
                let response = try await repo.connect(
                    businessNumber: bn,
                    businessName: businessName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : businessName
                )
                await MainActor.run {
                    if response.ok {
                        phase = .result(isMember: response.isMember ?? false, nextStep: response.nextStep ?? "")
                    } else if response.code == "POPBILL_NOT_CONFIGURED" {
                        phase = .notConfigured
                    } else {
                        errorMessage = response.error ?? "연결 실패"
                        phase = .input
                    }
                }
            } catch PopbillRepositoryError.notConfigured {
                await MainActor.run { phase = .notConfigured }
            } catch let repoError as PopbillRepositoryError {
                await MainActor.run {
                    errorMessage = repoError.errorDescription ?? "오류가 발생했습니다."
                    phase = .input
                }
            } catch {
                await MainActor.run {
                    errorMessage = "네트워크 오류: \(error.localizedDescription)"
                    phase = .input
                }
            }
        }
    }

    private func errorBanner(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BUColor.danger)
            Text(text)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(BUColor.danger)
                .lineSpacing(2)
        }
        .padding(10)
        .background(BUColor.danger.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
    }
}

#if DEBUG
#Preview { PopbillConnectSheet() }
#endif
