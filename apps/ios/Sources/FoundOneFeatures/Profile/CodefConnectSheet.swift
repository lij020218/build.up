//
//  CodefConnectSheet.swift — 10개 카드사 매출 자동 동기화 마법사 (CODEF API)
//
//  웹 SSOT: apps/web/app/lib/components/profile/CodefConnectCard.tsx
//
//  Step 1: 설명 안내 (여신금융협회 통합조회 방식)
//  Step 2: 사업자번호 + 대표자 생년월일 + 주거래 카드사 + 입금계좌 입력
//  Step 3: 서버 검증 중
//
//  서버 비활성화 시: CODEF_NOT_CONFIGURED(503) → "곧 활성화됩니다" 메시지
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct CodefConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    enum Step: Int { case guide = 1, input = 2, validating = 3 }

    @State private var step: Step = .guide
    @State private var businessNumber: String = ""
    @State private var birthday: String = ""
    @State private var selectedCardCode: String = CodefCardCompany.all[0].code
    @State private var bankAccount: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false
    @State private var notConfigured: Bool = false

    @FocusState private var focusedField: Field?
    enum Field: Hashable { case bn, bd, account }

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
                        stepHeader
                        if notConfigured {
                            notConfiguredView
                        } else {
                            switch step {
                            case .guide:      guideView
                            case .input:      inputForm
                            case .validating: validatingView
                            }
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("10개 카드사 매출 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    if step == .input && !notConfigured {
                        Button("← 이전") { step = .guide }.foregroundStyle(BUColor.midnight)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .safeAreaInset(edge: .bottom) {
                if !notConfigured && step != .validating {
                    primaryActionBar.background(.thinMaterial)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Step Header

    private var stepHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("10개 카드사 연결 · \(notConfigured ? "—" : "\(step.rawValue)/3")")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text(notConfigured ? "곧 활성화됩니다" : stepTitle)
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var stepTitle: String {
        switch step {
        case .guide:      return "사업자번호 + 계좌 1개만 있으면 됩니다"
        case .input:      return "정보 입력"
        case .validating: return "검증 중…"
        }
    }

    // MARK: - Step 1: Guide

    private var guideView: some View {
        VStack(spacing: BUSpacing.md) {
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("캐시노트와 같은 흐름")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("여신금융협회 통합조회가 사업자번호 + 대표자 생년월일 + 카드사 입금계좌를 대조해 KB·신한·삼성·현대·롯데·하나·BC·NH농협·우리·씨티 10개 카드사 매출을 한 번에 등록합니다.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    infoRow(icon: "building.2", text: "사업자등록번호 10자리")
                    infoRow(icon: "person.text.rectangle", text: "대표자 생년월일 (YYYYMMDD)")
                    infoRow(icon: "creditcard", text: "주거래 카드사 1개 선택")
                    infoRow(icon: "banknote", text: "해당 카드사 매출 입금계좌")
                }
            }

            // 베타 안내
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.warn)
                Text("베타 기능 — 서버 설정이 완료되지 않은 경우 \"곧 활성화됩니다\" 안내가 표시될 수 있습니다.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
            }
            .padding(10)
            .background(BUColor.warn.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func infoRow(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .frame(width: 20)
            Text(text)
                .font(.system(size: 13))
                .foregroundStyle(BUColor.ink)
        }
    }

    // MARK: - Step 2: Input

    private var inputForm: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                // 사업자번호
                fieldLabel("사업자등록번호 (10자리)", required: true)
                TextField("123-45-67890", text: $businessNumber)
                    .keyboardType(.numberPad)
                    .focused($focusedField, equals: .bn)
                    .textFieldStyle(.roundedBorder)

                // 생년월일
                fieldLabel("대표자 생년월일 (YYYYMMDD)", required: true)
                TextField("19850315", text: $birthday)
                    .keyboardType(.numberPad)
                    .focused($focusedField, equals: .bd)
                    .textFieldStyle(.roundedBorder)

                // 카드사 선택
                fieldLabel("주거래 카드사", required: true)
                Picker("카드사", selection: $selectedCardCode) {
                    ForEach(CodefCardCompany.all, id: \.code) { company in
                        Text(company.name).tag(company.code)
                    }
                }
                .pickerStyle(.menu)
                .tint(BUColor.midnight)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(BUColor.cardBorder, lineWidth: 1))

                // 입금계좌
                fieldLabel("카드 매출 입금계좌", required: true)
                TextField("123-456-789012", text: $bankAccount)
                    .keyboardType(.numberPad)
                    .focused($focusedField, equals: .account)
                    .textFieldStyle(.roundedBorder)
                Text("선택한 카드사에서 매출 정산 입금되는 계좌번호")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)

                if let error = errorMessage { errorBanner(error) }
            }
        }
    }

    private func fieldLabel(_ text: String, required: Bool) -> some View {
        HStack(spacing: 3) {
            Text(text)
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
            if required {
                Text("*").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.danger)
            }
        }
    }

    // MARK: - Step 3: Validating

    private var validatingView: some View {
        VStack(spacing: 14) {
            ProgressView().scaleEffect(1.4)
            Text("여신금융협회에 검증 호출 중…")
                .font(.system(size: 13.5, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
    }

    // MARK: - Not Configured

    private var notConfiguredView: some View {
        BUCard(.outer) {
            VStack(spacing: 12) {
                Image(systemName: "clock.badge.questionmark")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text("이 기능은 곧 활성화됩니다")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("여신금융협회 통합조회 연동을 준비하고 있습니다.\n잠시 후 다시 시도해 주세요.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Primary action bar

    private var primaryActionBar: some View {
        HStack {
            Spacer()
            Button { handlePrimaryAction() } label: {
                Text(primaryButtonTitle)
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(minWidth: 140, minHeight: 44)
                    .padding(.horizontal, 18)
                    .background(
                        LinearGradient(colors: [BUColor.midnight, BUColor.midnight.opacity(0.82)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )
                    .opacity(primaryButtonEnabled ? 1.0 : 0.5)
            }
            .disabled(!primaryButtonEnabled)
            .buttonStyle(.plain)
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 10)
        }
    }

    private var primaryButtonTitle: String {
        switch step {
        case .guide:      return "다음 →"
        case .input:      return isSubmitting ? "검증 중…" : "연결"
        case .validating: return "검증 중…"
        }
    }

    private var primaryButtonEnabled: Bool {
        let allFilled = !businessNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !birthday.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !bankAccount.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        switch step {
        case .guide:      return true
        case .input:      return allFilled && !isSubmitting
        case .validating: return false
        }
    }

    // MARK: - Actions

    private func handlePrimaryAction() {
        switch step {
        case .guide:
            step = .input
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { focusedField = .bn }
        case .input:
            submitConnection()
        case .validating:
            break
        }
    }

    private func submitConnection() {
        let bn = businessNumber.trimmingCharacters(in: .whitespacesAndNewlines)
        let bd = birthday.trimmingCharacters(in: .whitespacesAndNewlines)
        let ba = bankAccount.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !bn.isEmpty, !bd.isEmpty, !ba.isEmpty else { return }

        errorMessage = nil
        isSubmitting = true
        step = .validating

        Task {
            defer { isSubmitting = false }
            let repo = CodefRepository(supabase: BUSupabase.shared.client)
            do {
                let response = try await repo.connect(
                    businessNumber: bn,
                    representativeBirthday: bd,
                    cardCompany: selectedCardCode,
                    bankAccountNumber: ba
                )
                await MainActor.run {
                    if response.ok {
                        onConnected?()
                        dismiss()
                    } else if response.code == "CODEF_NOT_CONFIGURED" {
                        notConfigured = true
                    } else {
                        errorMessage = response.error ?? "연결 실패 — 입력 값을 확인해 주세요."
                        step = .input
                    }
                }
            } catch CodefRepositoryError.notConfigured {
                await MainActor.run { notConfigured = true }
            } catch let repoError as CodefRepositoryError {
                await MainActor.run {
                    errorMessage = repoError.errorDescription ?? "오류가 발생했습니다."
                    step = .input
                }
            } catch {
                await MainActor.run {
                    errorMessage = "네트워크 오류: \(error.localizedDescription)"
                    step = .input
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
#Preview { CodefConnectSheet() }
#endif
