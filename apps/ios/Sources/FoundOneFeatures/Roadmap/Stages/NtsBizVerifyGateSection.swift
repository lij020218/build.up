//
//  NtsBizVerifyGateSection.swift — registration-setup 국세청 확인 게이트 (2026-08-03 사장님 스펙)
//
//  사업자등록을 마치면 번호 입력 → 국세청 상태조회 확인 → 다음 단계.
//  바쁘면 「나중에 확인」 — 대시보드 가게 세팅 미션으로 후속.
//
//  저장 (웹 BizVerifyGateBlock 미러):
//   · 번호           → StoreInfoStore.bizRegistrationNumber (정식 SSOT, user_store_data)
//   · 확인/스킵 사실  → __setupMeta.bizVerifiedAt / bizVerifySkipped (industrySpecifics jsonb)
//   · 게이트 플래그   → UserDefaults "stage.regsetup.bizGatePassed"
//     (BUStageContentRenderer.canComplete 가 UserDefaults 기반이라 로컬 미러.
//      onAppear 에서 __setupMeta → 플래그 동기화로 2기기 시나리오 커버)
//
//  정직성: 확인은 시점 라벨(YYYY-MM-DD)과 함께 저장 — 영구 배지가 아니라 "그날 확인된 사실".
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

struct NtsBizVerifyGateSection: View {
    @EnvironmentObject private var storeInfo: StoreInfoStore

    static let gateFlagKey = "stage.regsetup.bizGatePassed"

    private enum VerifyState: Equatable {
        case idle, loading
        case confirmed(taxType: String, isActive: Bool?)
        case notfound, error
    }
    @State private var state: VerifyState = .idle
    @State private var localNumber = ""

    private var digits: String { localNumber.filter(\.isNumber) }
    private var checksumOk: Bool { StoreInfoValidators.isValidBusinessNumber(digits) }

    private var metaObject: [String: AnyCodable] {
        if case .object(let o) = storeInfo.state.industrySpecifics["__setupMeta"]?.raw.value { return o }
        return [:]
    }
    private var verifiedAt: String? {
        if case .string(let s) = metaObject["bizVerifiedAt"]?.value { return s }
        return nil
    }
    private var skipped: Bool {
        if case .bool(true) = metaObject["bizVerifySkipped"]?.value { return true }
        return false
    }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.shield")
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    Text("사업자등록번호 국세청 확인")
                        .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text("확인 또는 건너뛰기 후 다음 단계")
                        .font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                }
                Text("발급받은 번호를 입력하면 국세청 상태조회로 등록·과세유형을 확인해요.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)

                HStack(spacing: 8) {
                    TextField("사업자등록번호 10자리", text: $localNumber)
                        .font(BUFont.body)
                        .keyboardType(.numberPad)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .onChange(of: localNumber) { if state != .idle { state = .idle } }
                    Button(action: check) {
                        Group {
                            if state == .loading { ProgressView().tint(.white) }
                            else { Text("확인").font(.system(size: 13, weight: .bold)).foregroundStyle(.white) }
                        }
                        .frame(minWidth: 56, minHeight: 40)
                        .background(
                            checksumOk && state != .loading ? BUColor.midnight : BUColor.midnight.opacity(0.3),
                            in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                        )
                    }
                    .disabled(!checksumOk || state == .loading)
                }
                if digits.count == 10 && !checksumOk {
                    Text("번호 형식이 맞지 않아요 — 오타를 확인해주세요 (체크섬 불일치).")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.danger)
                }

                if case .confirmed(let taxType, let isActive) = state {
                    Text("✓ \(taxType)\(isActive.map { $0 ? " · 계속사업자" : " · 휴·폐업 상태" } ?? "") — 국세청 확인 (방금 조회)")
                        .font(BUFont.bodyCaption.weight(.bold)).foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                } else if state == .notfound {
                    Text("국세청에서 찾을 수 없는 번호예요. 방금 등록하셨다면 전산 반영 전일 수 있어요 — 하루 이틀 뒤 다시 확인해보세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                } else if state == .error {
                    Text("조회에 실패했어요 (국세청 서버 점검 중일 수 있어요). 미등록이라는 뜻이 아니니 잠시 후 다시 시도해주세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.danger).lineSpacing(2)
                }

                if let at = verifiedAt {
                    Text("국세청 확인 완료 (\(at)) — 다음 단계로 진행할 수 있어요.")
                        .font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight)
                } else if skipped {
                    Text("건너뛰기 선택됨 — 홈 「가게 세팅 미션」에서 나중에 확인할 수 있어요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                } else {
                    Button {
                        writeMeta { obj in obj["bizVerifySkipped"] = AnyCodable(.bool(true)) }
                        UserDefaults.standard.set(true, forKey: Self.gateFlagKey)
                    } label: {
                        Text("나중에 확인할게요 (건너뛰고 다음 단계)")
                            .font(BUFont.bodyCaption.weight(.semibold))
                            .foregroundStyle(BUColor.inkMuted).underline()
                    }
                }
            }
        }
        .onAppear {
            if localNumber.isEmpty { localNumber = storeInfo.state.bizRegistrationNumber }
            // 2기기 커버 — 다른 기기(웹)에서 확인/스킵했으면 로컬 게이트 플래그 동기화
            if verifiedAt != nil || skipped {
                UserDefaults.standard.set(true, forKey: Self.gateFlagKey)
            }
        }
    }

    private func writeMeta(_ mutate: (inout [String: AnyCodable]) -> Void) {
        storeInfo.commit { s in
            var obj = metaObject
            mutate(&obj)
            s.industrySpecifics["__setupMeta"] = AnyCodableValue(AnyCodable(.object(obj)))
        }
    }

    private func check() {
        guard checksumOk, state != .loading else { return }
        state = .loading
        let number = digits
        Task {
            do {
                let result = try await NtsBizRepository(
                    supabase: BUSupabase.shared.client,
                    baseURL: BUSupabase.shared.env.webAppURL
                ).checkStatus(businessNumber: number)
                await MainActor.run {
                    if result.operatingStatus == "unregistered" {
                        state = .notfound
                        return
                    }
                    state = .confirmed(
                        taxType: result.taxType.replacingOccurrences(of: "부가가치세 ", with: ""),
                        isActive: result.operatingStatus == "active" ? true
                            : (result.operatingStatus == "suspended" || result.operatingStatus == "closed") ? false
                            : nil
                    )
                    // 확인된 사실 저장 — 번호(정식 필드) + 확인 시점(__setupMeta) + 게이트 플래그
                    let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
                    writeMeta { obj in
                        obj["bizVerifiedAt"] = AnyCodable(.string(String(today)))
                        obj["bizVerifySkipped"] = AnyCodable(.bool(false))
                    }
                    storeInfo.commit { s in s.bizRegistrationNumber = number }
                    UserDefaults.standard.set(true, forKey: Self.gateFlagKey)
                }
            } catch {
                await MainActor.run { state = .error }   // 오류 ≠ 미등록 (재시도 상태)
            }
        }
    }
}
