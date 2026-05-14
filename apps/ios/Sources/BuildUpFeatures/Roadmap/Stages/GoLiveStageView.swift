//
//  GoLiveStageView.swift — Go-Live 배포 (iOS 네이티브)
//
//  stageId: "go-live"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct GoLiveStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("gl.webLive")      private var webLive      = false
    @AppStorage("gl.appStore")     private var appStore     = false
    @AppStorage("gl.productHunt")  private var productHunt  = false
    @AppStorage("gl.community")    private var community    = false
    @AppStorage("gl.pressRelease") private var pressRelease = false
    @AppStorage("gl.done")         private var done         = false

    private let pages = ["웹·앱 배포", "런치 채널"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("탭", selection: $page) {
                        ForEach(pages.indices, id: \.self) { i in
                            Text(pages[i]).tag(i)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(BUSpacing.md)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: deployPage
                                default: launchChannelPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("Go-Live")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - pg 0 웹·앱 배포

    private var deployPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("Go-Live")
                    Text("Go-Live = 실제 사용자가\n접근할 수 있는 상태")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("스테이징이 아닌 프로덕션 배포 + 도메인·SSL·결제 실서비스")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("배포 전 최종 체크리스트")
                    let items = [
                        "SSL 인증서 (HTTPS) 활성화",
                        "커스텀 도메인 연결 (무료 서비스 URL이 아닌)",
                        "결제 실거래 테스트 (1원 결제 후 환불)",
                        "개인정보처리방침·이용약관 페이지 게시 (법적 의무)",
                        "모바일 반응형 확인 (크롬 DevTools)",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("배포 완료 체크")
                    Toggle(isOn: $webLive) {
                        Text("웹 서비스 프로덕션 배포 완료")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $appStore) {
                        Text("앱스토어 심사 제출 완료 (해당 없으면 건너뜀)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                            .font(.system(size: 13))
                        Text("앱스토어 심사 소요 시간")
                            .font(BUFont.bodySmall.weight(.bold))
                            .foregroundStyle(BUColor.ink)
                    }
                    let storeItems = [
                        "iOS App Store: 평균 24-48시간 (거절 시 1-2주 추가)",
                        "Google Play: 평균 72시간",
                        "심사 요건: 개인정보처리방침 필수 / 테스트 계정 제공",
                    ]
                    ForEach(storeItems, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 런치 채널

    private var launchChannelPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("런치 채널 선택")
                    Toggle(isOn: $productHunt) {
                        Text("Product Hunt 런치 (영어권 SaaS의 경우)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $community) {
                        Text("국내 커뮤니티 런치 (스타트업 카카오 오픈채팅·링크드인)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $pressRelease) {
                        Text("보도자료 배포 (플래텀·벤처스퀘어·스타트업 미디어)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("Product Hunt 런치 팁")
                    let tips = [
                        "화요일~목요일 자정(PST) 런치가 최적",
                        "Maker로 등록 후 커뮤니티와 미리 소통",
                        "첫 날 200+ 투표 = 'Product of the Day' 기준",
                    ]
                    ForEach(tips, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("Go-Live 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("GoLive") { GoLiveStageView() }
#endif
