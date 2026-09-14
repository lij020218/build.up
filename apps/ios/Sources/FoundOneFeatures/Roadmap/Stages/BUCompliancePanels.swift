//
//  BUCompliancePanels.swift — 앱·플랫폼 규제·계약 도구(iOS). SSOT interactive ref → SwiftUI.
//
//    authChannelPicker : 요건 → 채널 순위·월 비용·콘솔 클릭 경로 (IdentityChannelPicker, compliance-data.json)
//    pgPrecheck        : URL → /api/compliance/pg-precheck (PgPrecheckService) → 항목별 통과/미달·반려 문구
//    docRequestDecoder : 메일 본문 → 용어별 '어디서·어떤 형식' + 체크리스트 (DocRequestDecoder)
//  웹 미러: apps/web/.../shared/CompliancePanels.tsx
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - 공통 카드 헤더

private struct ToolHeader: View {
    let title: String
    let note: String?
    let symbol: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 30, height: 30)
                    Image(systemName: symbol).font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.midnight)
                }
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let note {
                Text(note).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

// MARK: - 본인인증 채널 선택기

struct BUAuthChannelPicker: View {
    let config: BUStageContent.InteractiveConfig?
    @State private var req = BUIdentityRequirements()

    private var data: BUComplianceData? { ComplianceDataRegistry.data }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ToolHeader(title: config?.title ?? "본인인증 채널 선택기", note: config?.note, symbol: "checkmark.shield")

                Toggle("성별이 서비스 로직에 필요", isOn: $req.needsGender)
                Toggle("내외국인 구분 필요", isOn: $req.needsForeigner)
                Toggle("출시 전에 실제 인증 흐름 테스트 필요", isOn: $req.needsPreLaunchTest)
                Toggle("결제(카드 등)도 같이 받음", isOn: $req.acceptsPayments)
                Stepper("월 예상 인증 건수: \(req.monthlyCases)건", value: $req.monthlyCases, in: 0...20_000, step: 100)

                if let data {
                    let rec = IdentityChannelPicker.recommend(req, data: data)
                    ForEach(rec.verdicts) { v in verdictCard(v, data: data) }
                    ForEach(rec.globalWarnings, id: \.self) { w in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 12)).foregroundStyle(BUColor.danger).padding(.top, 2)
                            Text(w).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.danger).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(12)
                        .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    if !rec.consoleSteps.isEmpty {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("포트원 콘솔에서 — 본인인증만 신청하는 클릭 경로").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.inkSecondary)
                            ForEach(Array(rec.consoleSteps.enumerated()), id: \.offset) { i, s in
                                HStack(alignment: .top, spacing: 6) {
                                    Text("\(i + 1).").font(BUFont.bodyCaption.weight(.bold)).foregroundStyle(BUColor.midnight)
                                    Text(s.replacingOccurrences(of: "**", with: "")).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                } else {
                    Text("채널 데이터를 불러오지 못했습니다(compliance-data.json).").font(BUFont.bodyCaption).foregroundStyle(BUColor.danger)
                }
            }
            .tint(BUColor.midnight)
        }
    }

    private func verdictCard(_ v: BUChannelVerdict, data: BUComplianceData) -> some View {
        let ch = data.identityChannels.first { $0.id == v.channelId }
        let badge: (String, Color, Color) = {
            switch v.status {
            case .recommended: return ("추천", .white, BUColor.midnight)
            case .possible: return ("가능", BUColor.midnight, BUColor.midnight.opacity(0.08))
            case .excluded: return ("제외", BUColor.danger, BUColor.danger.opacity(0.08))
            }
        }()
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(badge.0).font(.system(size: 11, weight: .heavy)).foregroundStyle(badge.1)
                    .padding(.horizontal, 8).padding(.vertical, 2).background(badge.2, in: Capsule())
                Text(v.name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
            }
            Text(v.monthlyCostLabel).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.midnight)
                .fixedSize(horizontal: false, vertical: true)
            if let ch {
                Text("\(ch.method) · 계약 소요: \(ch.contractLeadTime)").font(.system(size: 11.5)).foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if !v.reasons.isEmpty {
                Text(v.reasons.joined(separator: " · ")).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            ForEach(v.warnings, id: \.self) { w in
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: "exclamationmark.triangle").font(.system(size: 11)).foregroundStyle(BUColor.warn).padding(.top, 2)
                    Text(w).font(BUFont.bodyCaption).foregroundStyle(BUColor.warn).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            if v.status == .recommended, let ch, !ch.documents.isEmpty {
                Text("계약 서류(개인사업자): \(ch.documents.joined(separator: " · "))").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(v.status == .excluded ? BUColor.ink.opacity(0.02) : Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(v.status == .recommended ? BUColor.midnight : BUColor.ink.opacity(0.08), lineWidth: 1))
        .opacity(v.status == .excluded ? 0.75 : 1)
    }
}

// MARK: - PG 심사 프리체크

struct BUPgPrecheckCard: View {
    let config: BUStageContent.InteractiveConfig?
    @State private var url = ""
    @State private var loading = false
    @State private var error: String?
    @State private var result: PgPrecheckResult?

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ToolHeader(title: config?.title ?? "PG 심사 프리체크", note: config?.note, symbol: "magnifyingglass")
                HStack(spacing: 8) {
                    TextField("https://your-service.app", text: $url)
                        .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                        .font(BUFont.bodySmall)
                        .padding(.horizontal, 12).padding(.vertical, 9)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(BUColor.midnight.opacity(0.18), lineWidth: 1))
                    Button {
                        Task { await run() }
                    } label: {
                        Text(loading ? "검사 중…" : "검사").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(loading || url.trimmingCharacters(in: .whitespaces).isEmpty)
                    .opacity(loading || url.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
                }
                if let error {
                    Text(error).font(BUFont.bodyCaption).foregroundStyle(BUColor.danger).fixedSize(horizontal: false, vertical: true)
                }
                if let result {
                    HStack(spacing: 8) {
                        Text(result.rejectRiskCount == 0 ? "반려 위험 0 — 제출 가능" : "반려 위험 \(result.rejectRiskCount)건")
                            .font(.system(size: 12, weight: .heavy)).foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(result.rejectRiskCount == 0 ? BUColor.success : BUColor.danger, in: Capsule())
                        if result.warnCount > 0 {
                            Text("주의 \(result.warnCount)건").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.warn)
                        }
                    }
                    if result.spaSuspect {
                        Text("본문 텍스트가 거의 없음 — 클라이언트 렌더(SPA) 사이트면 미검출일 수 있습니다.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.warn).fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(result.items) { item in itemRow(item) }
                    Text(result.appOnlyNote).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(10)
                        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
        }
    }

    private func itemRow(_ item: PgPrecheckItem) -> some View {
        let style: (String, Color, String) = {
            switch item.status {
            case "pass": return ("checkmark", BUColor.success, "통과")
            case "fail": return ("xmark", BUColor.danger, "미달")
            case "warn": return ("exclamationmark.triangle", BUColor.warn, "주의")
            default: return ("chevron.right", BUColor.inkSubtle, "참고")
            }
        }()
        let bad = item.status == "fail" || item.status == "warn"
        return VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 8) {
                Image(systemName: style.0).font(.system(size: 12, weight: .bold)).foregroundStyle(style.1)
                Text(item.label).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                Spacer()
                Text(style.2).font(.system(size: 11, weight: .heavy)).foregroundStyle(style.1)
            }
            if item.status == "pass", let ev = item.evidence {
                Text("근거: \(ev)").font(.system(size: 11.5)).foregroundStyle(BUColor.inkMuted).padding(.leading, 20)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if bad {
                Text("심사 결과로 돌아오는 문구: \(item.rejectAs)").font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(style.1).padding(.leading, 20)
                    .fixedSize(horizontal: false, vertical: true)
                Text("고치기: \(item.fix)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).padding(.leading, 20)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(bad ? style.1.opacity(0.05) : Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(bad ? style.1.opacity(0.25) : BUColor.ink.opacity(0.06), lineWidth: 1))
    }

    @MainActor
    private func run() async {
        let target = url.trimmingCharacters(in: .whitespaces)
        guard !target.isEmpty else { return }
        loading = true
        error = nil
        defer { loading = false }
        do {
            result = try await PgPrecheckService.shared().check(url: target)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - 서류 요청 해석기

struct BUDocRequestDecoder: View {
    let config: BUStageContent.InteractiveConfig?
    @State private var text = ""

    private var decoded: BUDocRequestDecoded? {
        guard let data = ComplianceDataRegistry.data else { return nil }
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : DocRequestDecoder.decode(t, data: data)
    }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ToolHeader(title: config?.title ?? "서류 요청 메일 해석기", note: config?.note, symbol: "doc.text.magnifyingglass")
                TextEditor(text: $text)
                    .font(BUFont.bodySmall)
                    .frame(minHeight: 96)
                    .padding(6)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(BUColor.midnight.opacity(0.18), lineWidth: 1))
                    .overlay(alignment: .topLeading) {
                        if text.isEmpty {
                            Text("예) 계약서 원본 2부, 사업자등록증 사본, 인감증명서(전자계약 시 생략), 대표자 신분증 사본(마스킹 없이)…")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSubtle)
                                .padding(.horizontal, 12).padding(.vertical, 14)
                                .allowsHitTesting(false)
                        }
                    }
                if let decoded {
                    if decoded.matches.isEmpty {
                        Text("사전에 있는 서류 용어를 찾지 못했습니다 — 용어 사전을 확인하세요.").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    }
                    ForEach(decoded.matches) { m in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(m.term.term)  (메일 표기: \(m.hits.joined(separator: ", ")))")
                                .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(m.term.meaning).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("어디서 · \(m.term.whereLabel)").font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.midnight)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("형식 · \(m.term.format)").font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(BUColor.ink.opacity(0.08), lineWidth: 1))
                    }
                    if let hint = decoded.eContractHint {
                        Text(hint).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.warn).fixedSize(horizontal: false, vertical: true)
                    }
                    if !decoded.checklist.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("자동 생성 준비 체크리스트").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.inkSecondary)
                            ForEach(decoded.checklist, id: \.self) { line in
                                HStack(alignment: .top, spacing: 6) {
                                    Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 6)
                                    Text(line).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
