//
//  BUStageWrapup.swift — Stage view 하단의 "마무리" 체크리스트 카드 (웹 StageWrapup 미러).
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/StageWrapup.tsx
//
//  레이아웃:
//   ① 헤더: 마무리 — 이 단계에서 한 일 + 다음 단계 전 반드시 확인
//   ② "이 단계에서 한 일" — ✓ 박스 + 4개 도면 (label + detail)
//   ③ "다음 단계(XXX) 전 반드시 확인" — 빨강 박스 + 5~6 항목 bullet
//   ④ "이 단계가 끝나면 → ..." — 초록 박스 + summary
//

import SwiftUI
import BuildUpDesignSystem

public struct BUStageWrapupItem: Sendable, Hashable {
    public let label: String
    public let detail: String

    public init(label: String, detail: String) {
        self.label = label
        self.detail = detail
    }
}

public struct BUStageWrapupData: Sendable, Hashable {
    /// 완료한 일 — 4개 항목 권장. ✓ 박스 + label + detail.
    public let doneItems: [BUStageWrapupItem]
    /// 다음 단계 전 반드시 확인 — 5~6개 점검 문구.
    public let verifyItems: [String]
    /// 빨강 박스 라벨 — "다음 단계(XXX) 전 반드시 확인" 의 XXX.
    public let nextStageLabel: String
    /// 초록 박스 본문 — "이 단계가 끝나면 → ..." 의 ... 부분.
    public let nextSummary: String

    public init(
        doneItems: [BUStageWrapupItem],
        verifyItems: [String],
        nextStageLabel: String,
        nextSummary: String
    ) {
        self.doneItems = doneItems
        self.verifyItems = verifyItems
        self.nextStageLabel = nextStageLabel
        self.nextSummary = nextSummary
    }
}

public struct BUStageWrapup: View {

    public let data: BUStageWrapupData

    public init(data: BUStageWrapupData) {
        self.data = data
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            header
            doneList
            verifyBox
            nextBox
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 1)
        .padding(.top, 8)
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("마무리")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("이 단계에서 한 일 + 다음 단계 전 반드시 확인")
                .font(.system(size: 17, weight: .heavy))
                .tracking(-0.3)
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var doneList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("이 단계에서 한 일")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight.opacity(0.7))

            VStack(spacing: 0) {
                ForEach(Array(data.doneItems.enumerated()), id: \.offset) { idx, item in
                    if idx > 0 {
                        Rectangle()
                            .fill(BUColor.midnight.opacity(0.10))
                            .frame(height: 0.5)
                    }
                    doneRow(item)
                }
            }
            .background(
                BUColor.midnight.opacity(0.025),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
            )
        }
    }

    private func doneRow(_ item: BUStageWrapupItem) -> some View {
        HStack(alignment: .top, spacing: 12) {
            // ✓ 박스
            ZStack {
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(BUColor.midnight)
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(.white)
            }
            .frame(width: 22, height: 22)
            .padding(.top, 1)

            VStack(alignment: .leading, spacing: 3) {
                Text(item.label)
                    .font(.system(size: 13.5, weight: .heavy))
                    .tracking(-0.05)
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(item.detail)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var verifyBox: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("다음 단계(\(data.nextStageLabel)) 전 반드시 확인")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(Color(red: 0.863, green: 0.149, blue: 0.149))
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(data.verifyItems.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .firstTextBaseline, spacing: 9) {
                        Circle()
                            .fill(Color(red: 0.863, green: 0.149, blue: 0.149))
                            .frame(width: 5, height: 5)
                            .alignmentGuide(.firstTextBaseline) { d in d[VerticalAlignment.center] + 2 }
                        Text(item)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color(red: 0.498, green: 0.114, blue: 0.114))
                            .lineSpacing(4)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            Color(red: 0.863, green: 0.149, blue: 0.149).opacity(0.04),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color(red: 0.863, green: 0.149, blue: 0.149).opacity(0.14), lineWidth: 1)
        )
    }

    private var nextBox: some View {
        HStack(alignment: .center, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color(red: 0.020, green: 0.588, blue: 0.412).opacity(0.12))
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(Color(red: 0.020, green: 0.588, blue: 0.412))
            }
            .frame(width: 26, height: 26)

            VStack(alignment: .leading, spacing: 2) {
                Text("이 단계가 끝나면")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(Color(red: 0.020, green: 0.588, blue: 0.412))
                Text(data.nextSummary)
                    .font(.system(size: 13.5, weight: .heavy))
                    .tracking(-0.05)
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.020, green: 0.588, blue: 0.412).opacity(0.05),
                    Color(red: 0.020, green: 0.588, blue: 0.412).opacity(0.02),
                ],
                startPoint: .top, endPoint: .bottom
            ),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color(red: 0.020, green: 0.588, blue: 0.412).opacity(0.16), lineWidth: 1)
        )
    }
}

#if DEBUG
#Preview("BUStageWrapup") {
    BUStageWrapup(data: BUStageWrapupData(
        doneItems: [
            .init(label: "1. 주 연령대·산업 명시", detail: "한 명에게 팔린다는 의지로 좁혔는지 확인"),
            .init(label: "2. 라이프스타일·일상 동선", detail: "언제·어디서·왜 쓰는지 구체화"),
            .init(label: "3. 객단가·예산 한도", detail: "안 살 가격대까지 명확"),
            .init(label: "4. 반례 검증", detail: "이 페르소나가 절대 안 할 행동 4개"),
        ],
        verifyItems: [
            "'20-50대 여성' 같은 모호한 정의 X — 한 명의 구체 페르소나로 좁혔는가",
            "이 페르소나가 절대 안 갈 위치·안 살 가격대 명시했는가",
            "경쟁점 중 같은 페르소나 타깃 가게 1곳 이상 있는가 (없으면 시장 위험)",
            "후속 결정 (입지·메뉴·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가",
            "주변 지인 의견이 아닌 실제 잠재 고객 5명+ 대화로 검증했는가",
        ],
        nextStageLabel: "예산·시점 설정",
        nextSummary: "타깃 페르소나 확정 → 예산·시점 설정 단계로 진입"
    ))
    .padding()
    .background(BUColor.surface)
}
#endif
