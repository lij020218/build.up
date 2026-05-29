//
//  GoLiveStageView.swift — Go-Live 배포 (iOS 네이티브)
//
//  stageId: "go-live"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct GoLiveStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "go-live"

    @State private var page = 0

    @AppStorage("gl.webLive")      private var webLive      = false
    @AppStorage("gl.appStore")     private var appStore     = false
    @AppStorage("gl.productHunt")  private var productHunt  = false
    @AppStorage("gl.community")    private var community    = false
    @AppStorage("gl.pressRelease") private var pressRelease = false
    @AppStorage("gl.done")         private var done         = false

    private let pages = ["웹·앱 배포", "런치 채널"]

    public init() {}

    /// 게이트: 런치 날짜 결정 — 배포 완료(웹 or 앱) + 런치 채널 1개 이상.
    private var canCompleteStage: Bool {
        (webLive || appStore) && (productHunt || community || pressRelease)
    }

    private var advanceHint: String {
        if !(webLive || appStore) { return "웹 또는 앱 배포 완료를 체크하세요" }
        if !(productHunt || community || pressRelease) { return "런치 채널 1개 이상 선택" }
        return "런치 날짜 결정 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "🚀 실제 출시 (Go Live)",
            stageEyebrow: "단계 11 · Go-Live",
            helperText: "Go-Live = 실제 사용자가 접근할 수 있는 상태. 스테이징이 아닌 프로덕션 배포 + 도메인·SSL·결제 실서비스.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 도메인·SSL·SEO", detail: "도메인 + SSL 인증서 + sitemap.xml + robots.txt 셋업"),
                .init(label: "2. 앱 스토어 등록", detail: "App Store Connect + Google Play Console 14일 테스터 12명 정책"),
                .init(label: "3. PH·HN 출시", detail: "PH 화·수 12am PT + HN Show HN 게시"),
                .init(label: "4. 모니터링·롤백", detail: "Sentry 에러 + Statuspage + 즉시 롤백 절차 셋업"),
                ],
                verifyItems: [
                "보안 — 출시 트래픽 폭증 시 DDoS·Rate limit 사전 대비, 다운 시 PR 손상",
                "Apple/Google — 정책 위반(개인정보·결제·콘텐츠) 시 거절, 재심사 1~2주 추가",
                "TestFlight 정책 — 외부 테스트는 Beta App Review 필수, 미준수 시 거절",
                "Google Play — 14일 12명 클로즈드 테스트 의무, 미충족 시 출시 불가",
                "GDPR·개인정보 — 글로벌 출시 시 EU·미국 사용자 데이터 처리 약관 사전 게시",
                "롤백 — 출시 후 결함 발견 시 즉시 롤백 절차, 미준비 시 신뢰 회복 불가",
                ],
                nextStageLabel: "성장 엔진",
                nextSummary: "실제 출시 + 도메인·앱·PH·모니터링 셋업 완료 → 성장 엔진 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: deployPage
                    default: launchChannelPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 웹·앱 배포

    private var deployPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
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
                        "iOS App Store: 평균 24시간~30일 (2026.3 이후 7-30일 지연 빈발, 거절 시 1-2주 추가)",
                        "Google Play: 평균 72시간 (개인 계정은 14일 폐쇄 테스트 + 12명 의무)",
                        "iOS 26 SDK + Xcode 26 필수 (2026.4.28부터 의무, 이전 빌드 거절)",
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
                        "화요일~목요일 자정(PT, 12:01 AM) 런치가 최적",
                        "Maker로 등록 후 커뮤니티와 미리 소통 (D-7 publish 예약)",
                        "Product of the Day 진입 = 400-600+ 투표 (2026 기준)",
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
        }
    }
}

#if DEBUG
#Preview("GoLive") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["go-live"] }
    return GoLiveStageView().environment(store)
}
#endif
