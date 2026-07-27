//
//  DaangnHiringGuideSheet.swift — 당근으로 알바 구하기 가이드 시트 (2026-07-25 사장님 피드백)
//
//  웹 SSOT: packages/shared/src/team/hiring-channels.ts DAANGN_HIRING_GUIDE — 문구 1:1 수동 미러.
//  드리프트는 apps/web/__tests__/hiring-channels-ios-sync.test.ts 가 이 파일을 파싱해 CI 차단.
//  웹 대응: DaangnHiringGuideModal.tsx (아이콘: 웹 lucide ↔ iOS SF Symbols).
//  전 항목 공식 출처 기반 — 3단계=당근알바 공식 소개, 광고 CPC·성별연령 금지=당근 고객센터 FAQ.
//

import SwiftUI
import FoundOneDesignSystem

struct DaangnHiringGuideSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    private let daangnJobsURL = URL(string: "https://www.daangn.com/kr/jobs/")!

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    // 헤더
                    VStack(alignment: .leading, spacing: 4) {
                        Text("구인 가이드")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .textCase(.uppercase)
                            .kerning(0.8)
                        Text("당근으로 알바 구하기")
                            .font(.system(size: 22, weight: .bold))
                            .tracking(-0.4)
                            .foregroundStyle(BUColor.ink)
                        Text("걸어서 10분 거리 동네 주민과 매칭 — 공고부터 면접 약속까지 앱에서 끝나요.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    // 3단계 (SF Symbols — 웹 lucide 매핑: write→pencil.line, applicants→person.2, chat→bubble.left.and.bubble.right)
                    VStack(alignment: .leading, spacing: 14) {
                        guideRow(index: 1, symbol: "pencil.line",
                                 title: "당근 앱에서 공고 작성",
                                 desc: "알바 탭 → 공고 등록. 근무 요일·시간·시급을 입력하면 우리 동네에 노출돼요.")
                        guideRow(index: 2, symbol: "person.2",
                                 title: "지원자 확인",
                                 desc: "가까이 사는 지원자가 오는 게 강점 — 출퇴근이 짧을수록 오래 다녀요.")
                        guideRow(index: 3, symbol: "bubble.left.and.bubble.right",
                                 title: "채팅으로 면접 약속",
                                 desc: "전화번호 노출 없이 당근 채팅으로 바로 면접 시간을 잡아요.")
                    }

                    // 팁 — 배경 톤으로 구분 (신호등 컬러 없음)
                    VStack(alignment: .leading, spacing: 12) {
                        guideRow(index: nil, symbol: "megaphone",
                                 title: "광고는 선택이에요",
                                 desc: "공고는 광고 없이 올릴 수 있어요. 더 노출하려면 클릭당 과금(CPC) 광고 — 비용은 앱에서 확인하세요.")
                        // law 아이콘 = building.columns (법·기관 표준 SF 심볼 — scalemass 는 주방저울이라 부적합)
                        guideRow(index: nil, symbol: "building.columns",
                                 title: "성별·연령 조건은 쓰지 마세요",
                                 desc: "'20대 여성만' 같은 문구는 위법 소지 — 성별은 남녀고용평등법, 연령은 연령차별금지법이 금지해요. 당근은 성별·연령 타겟 광고 자체가 없어요.")
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(BUColor.midnight.opacity(0.07), lineWidth: 1)
                    )

                    // CTA
                    Button {
                        openURL(daangnJobsURL)
                    } label: {
                        HStack(spacing: 7) {
                            Text("당근알바 열기")
                                .font(.system(size: 14, weight: .heavy))
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 12, weight: .bold))
                                .opacity(0.8)
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    }
                    .buttonStyle(.plain)

                    // 출처 — 정직성: 이 가이드의 근거
                    HStack(spacing: 8) {
                        Text("출처")
                            .font(.system(size: 10.5, weight: .heavy))
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.inkMuted)
                        sourceChip("당근알바 공식 소개", url: "https://www.daangn.com/kr/jobs/about/")
                        sourceChip("당근 고객센터", url: "https://cs.kr.karrotmarket.com/wv/faqs/25455")
                        Spacer(minLength: 0)
                    }
                    Color.clear.frame(height: 8)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.top, BUSpacing.md)
            }
            .navigationTitle("")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }

    private func guideRow(index: Int?, symbol: String, title: String, desc: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.06))
                    .frame(width: 34, height: 34)
                    .overlay(
                        Image(systemName: symbol)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(BUColor.midnight)
                    )
                if let index {
                    Text("\(index)")
                        .font(.system(size: 9.5, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(width: 16, height: 16)
                        .background(BUColor.midnight, in: Circle())
                        .offset(x: 5, y: -5)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .tracking(-0.14)
                    .foregroundStyle(BUColor.ink)
                Text(desc)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func sourceChip(_ label: String, url: String) -> some View {
        Group {
            if let u = URL(string: url) {
                Button { openURL(u) } label: {
                    Text(label)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
