//
//  BUDateOffsetCard.swift — SSOT interactive ref "dateOffset" (app-compliance).
//
//  기준일 입력 → ±offsetDays 결과일 + D-day + (선택) 고지 문구 복사.
//  위치정보법 소상공인 특례 신고(개시 후 1개월=30일) · 개인정보처리방침 개정 7일 전 고지.
//  로컬 계산만 — 서버 저장 없음. 웹 미러: StageContentRenderer.tsx DateOffsetWidget.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
#if canImport(UIKit)
import UIKit
#endif

struct BUDateOffsetCard: View {
    let config: BUStageContent.InteractiveConfig?

    @State private var baseDate = Date()
    @State private var touched = false
    @State private var copied = false

    private var signedOffset: Int {
        let days = config?.offsetDays ?? 0
        return config?.direction == "before" ? -days : days
    }
    private var resultDate: Date? {
        guard touched else { return nil }
        return Calendar.current.date(byAdding: .day, value: signedOffset, to: Calendar.current.startOfDay(for: baseDate))
    }
    private var notice: String? {
        guard let resultDate, let template = config?.noticeTemplate else { return nil }
        return template
            .replacingOccurrences(of: "{{input}}", with: Self.format(baseDate))
            .replacingOccurrences(of: "{{result}}", with: Self.format(resultDate))
    }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 30, height: 30)
                        Image(systemName: "calendar").font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                    Text(config?.title ?? "").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
                DatePicker(
                    config?.inputLabel ?? "기준일",
                    selection: Binding(get: { baseDate }, set: { baseDate = $0; touched = true }),
                    displayedComponents: .date
                )
                .font(BUFont.bodySmall.weight(.semibold))
                .tint(BUColor.midnight)

                VStack(alignment: .leading, spacing: 4) {
                    Text(config?.resultLabel ?? "결과일").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight)
                    if let resultDate {
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Text(Self.format(resultDate)).font(.system(size: 20, weight: .heavy)).foregroundStyle(BUColor.ink)
                            Text(Self.dDay(resultDate))
                                .font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.midnight, in: Capsule())
                        }
                    } else {
                        Text("날짜를 고르면 마감일을 계산합니다").font(BUFont.bodySmall).foregroundStyle(BUColor.inkSubtle)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(BUColor.midnight.opacity(resultDate == nil ? 0.03 : 0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                if let note = config?.note {
                    Text(note).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let notice {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("고지 문구").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.inkSecondary)
                            Spacer()
                            Button {
                                #if canImport(UIKit)
                                UIPasteboard.general.string = notice
                                #endif
                                copied = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { copied = false }
                            } label: {
                                Label(copied ? "복사됨" : "복사", systemImage: copied ? "checkmark" : "doc.on.doc")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(copied ? BUColor.success : BUColor.midnight)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .background((copied ? BUColor.success : BUColor.midnight).opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                        Text(notice).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(12)
                    .background(BUColor.ink.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }
        }
    }

    private static let weekdaysKo = ["일", "월", "화", "수", "목", "금", "토"]

    static func format(_ d: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.dateFormat = "yyyy-MM-dd"
        let wd = Calendar.current.component(.weekday, from: d) - 1
        return "\(f.string(from: d)) (\(weekdaysKo[max(0, min(6, wd))]))"
    }

    static func dDay(_ target: Date) -> String {
        let cal = Calendar.current
        let days = cal.dateComponents([.day], from: cal.startOfDay(for: Date()), to: cal.startOfDay(for: target)).day ?? 0
        if days == 0 { return "오늘" }
        if days > 0 { return "D-\(days)" }
        return "\(-days)일 지남"
    }
}

/// SSOT kind "copyTemplate" — 상품 명세 템플릿 등, "label: value" 평문 복사.
struct BUCopyTemplateCard: View {
    let eyebrow: String
    let subtitle: String?
    let title: String
    let lines: [BUStageContent.TemplateLine]
    let footnote: String?

    @State private var copied = false

    private var text: String { lines.map { "\($0.label): \($0.value)" }.joined(separator: "\n") }

    var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow(eyebrow)
                if let subtitle {
                    Text(subtitle).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                HStack {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                    Spacer()
                    Button {
                        #if canImport(UIKit)
                        UIPasteboard.general.string = text
                        #endif
                        copied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { copied = false }
                    } label: {
                        Label(copied ? "복사됨" : "복사", systemImage: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(copied ? BUColor.success : BUColor.midnight)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background((copied ? BUColor.success : BUColor.midnight).opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(lines, id: \.label) { line in
                        HStack(alignment: .top, spacing: 8) {
                            Text(line.label).font(.system(size: 12.5, weight: .bold)).foregroundStyle(BUColor.inkSecondary)
                                .frame(width: 72, alignment: .leading)
                            Text(line.value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 0)
                        }
                    }
                }
                .padding(12)
                .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                if let footnote {
                    Text(footnote).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}
