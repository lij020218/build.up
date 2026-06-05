//
//  OwnerProfileChips.swift — 지원사업 매칭 보강 입력 (나이·폐업검토·장애·NCB 신용점수).
//
//  웹 SSOT: apps/web/.../dashboard/OwnerProfileChips.tsx (동일 정책).
//  ⚠️ 민감 PII(나이·신용점수)는 UserDefaults 로컬 전용 — Supabase 등 서버 미전송.
//     키("owner.birthYear"/"owner.ncbScore"/"owner.consideringClosure"/"owner.isDisabledOwner")는
//     FundingProfileRepository.makeCriteria 가 동일하게 읽어 매칭에 반영.
//

import SwiftUI
import FoundOneDesignSystem

struct OwnerProfileChips: View {
    /// 값 변경 시 부모가 재매칭(loadPrograms) 하도록 콜백.
    var onChange: () -> Void
    /// 출생연도 미입력 시 청년·시니어 매칭 가치 넛지 노출 (펀딩페이지만 true).
    var showNudge: Bool = false

    // ⚠️ 나이가 아니라 출생연도 저장 — 매칭 시 (현재연도 - birthYear)로 나이 계산.
    @AppStorage("owner.birthYear") private var birthYear: Int = 0
    @AppStorage("owner.ncbScore") private var ncb: Int = 0
    @AppStorage("owner.consideringClosure") private var consideringClosure: Bool = false
    @AppStorage("owner.isDisabledOwner") private var isDisabledOwner: Bool = false

    @State private var showBirthYear = false
    @State private var showNcb = false
    @State private var birthYearText = ""
    @State private var ncbText = ""

    private var computedAge: Int? {
        let y = Calendar.current.component(.year, from: Date())
        guard birthYear >= 1900, birthYear <= y else { return nil }
        let a = y - birthYear
        return (a >= 0 && a < 120) ? a : nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("내 정보 추가 (선택) — 더 정확한 추천 · 기기에만 저장")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
            if showNudge && birthYear == 0 {
                Text("💡 출생연도를 알려주시면 청년(만 39세 이하)·시니어(40세+) 전용 지원을 더 정확히 찾아드려요")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 10).padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    chip(label: birthYear > 0 ? "\(birthYear)년생 · 만 \(computedAge ?? 0)세" : "출생연도 입력", active: birthYear > 0) {
                        birthYearText = birthYear > 0 ? "\(birthYear)" : ""
                        showBirthYear = true
                    }
                    chip(label: "폐업 검토 중", active: consideringClosure) {
                        consideringClosure.toggle()
                        onChange()
                    }
                    chip(label: "장애인 사장님", active: isDisabledOwner) {
                        isDisabledOwner.toggle()
                        onChange()
                    }
                    chip(label: ncb > 0 ? "NCB \(ncb)" : "NCB 신용점수", active: ncb > 0) {
                        ncbText = ncb > 0 ? "\(ncb)" : ""
                        showNcb = true
                    }
                }
                .padding(.horizontal, 2)
                .padding(.vertical, 2)
            }
        }
        .alert("출생연도", isPresented: $showBirthYear) {
            TextField("예: 1990", text: $birthYearText)
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
            Button("저장") {
                let y = Int(birthYearText) ?? 0
                let cur = Calendar.current.component(.year, from: Date())
                birthYear = (y >= 1900 && y <= cur) ? y : 0
                onChange()
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("청년·시니어 지원 매칭용 · 기기에만 저장됩니다")
        }
        .alert("NCB 신용점수", isPresented: $showNcb) {
            TextField("1–1000", text: $ncbText)
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
            Button("저장") {
                if let n = Int(ncbText), n > 0, n <= 1000 { ncb = n } else { ncb = 0 }
                onChange()
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("신용취약 정책자금 매칭용 · 기기에만 저장됩니다")
        }
    }

    /// GuidesView FilterChip 스타일 미러 (private 라 직접 못 써서 동일 룩 인라인).
    private func chip(label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(active ? .white : BUColor.ink)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .frame(minHeight: BUSpacing.minTapTarget)
                .background(
                    Capsule(style: .continuous)
                        .fill(active ? BUColor.midnight : Color.white.opacity(0.72))
                )
                .overlay(
                    Capsule(style: .continuous)
                        .strokeBorder(active ? Color.clear : BUColor.cardBorder, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
