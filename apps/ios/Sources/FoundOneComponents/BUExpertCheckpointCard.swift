//
//  BUExpertCheckpointCard.swift — 전문가 체크포인트 카드 (2026-07-27)
//
//  웹 SSOT: apps/web/app/lib/components/ExpertCheckpointCard.tsx 미러.
//  데이터: ExpertCheckpointRegistry(자동 생성 — expert-checkpoints.ts).
//  원칙: 겁주기 없는 시점 안내 — 무료 공공 채널(전화 1급) 우선, 내 주변 찾기 후순위.
//  배치: BUStageShell content 직전 — 해당 단계에만 노출 (registry 미등록 = 미렌더).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public struct BUExpertCheckpointCard: View {
    let checkpoint: BUExpertCheckpoint

    public init(checkpoint: BUExpertCheckpoint) {
        self.checkpoint = checkpoint
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("전문가 체크포인트 · \(checkpoint.expertKo)")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(BUColor.midnight)
                .textCase(.uppercase)

            Text("이런 경우엔 전문가 확인을 권장해요: \(checkpoint.whensKo.joined(separator: " · "))")
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            BUWrapLayout(spacing: 7) {
                ForEach(checkpoint.channels) { ch in
                    channelPill(ch)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1))
    }

    @ViewBuilder
    private func channelPill(_ ch: BUExpertChannel) -> some View {
        // 전화 1급(번호는 URL보다 부패에 강함) → 내 주변(지도 검색 — 평점은 지도가 표시) → 링크
        if let phone = ch.phone, let telURL = URL(string: "tel:\(phone)") {
            Link(destination: telURL) { pillLabel(icon: "phone.fill", text: "\(ch.nameKo) \(phone)", free: ch.free) }
        } else if let query = ch.nearbyQuery,
                  // iOS 는 지역 미접두(지도 앱이 현위치 기준 검색) — 웹은 가게 주소 동네 접두
                  let mapURL = BUExpertCheckpoints.nearbySearchUrl(query: query, region: nil) {
            Link(destination: mapURL) { pillLabel(icon: "mappin.and.ellipse", text: ch.nameKo, free: false) }
        } else if let urlStr = ch.url, let url = URL(string: urlStr) {
            Link(destination: url) { pillLabel(icon: nil, text: ch.nameKo, free: ch.free) }
        }
    }

    private func pillLabel(icon: String?, text: String, free: Bool) -> some View {
        HStack(spacing: 6) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            Text(text)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
            if free {
                Text("무료")
                    .font(.system(size: 9.5, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .lineLimit(1)
                    .padding(.horizontal, 6).padding(.vertical, 1.5)
                    .background(BUColor.midnight.opacity(0.08), in: Capsule())
            }
            Image(systemName: "arrow.up.right")
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .fixedSize()
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 11, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1))
    }
}
