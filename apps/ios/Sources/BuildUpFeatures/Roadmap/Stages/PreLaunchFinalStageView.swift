//
//  PreLaunchFinalStageView.swift — 오픈 최종 점검 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/PreLaunchFinalStage.tsx
//  stageId: "pre-launch-final"
//
//  4-page (가로 스크롤 탭바):
//    pg 0 — 왜 중요한가
//    pg 1 — 오픈 전 점검 (최종 체크리스트)
//    pg 2 — 오픈 당일 운영 스크립트
//    pg 3 — 홍보 타임라인 (D-7 ~ D+7)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct PreLaunchFinalStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    // 오픈 전 점검
    @AppStorage("plf.permit")      private var permitOK      = false
    @AppStorage("plf.equipment")   private var equipmentOK   = false
    @AppStorage("plf.stock")       private var stockOK       = false
    @AppStorage("plf.staff")       private var staffOK       = false
    @AppStorage("plf.pos")         private var posOK         = false
    @AppStorage("plf.hygiene")     private var hygieneOK     = false
    @AppStorage("plf.emergency")   private var emergencyOK   = false
    @AppStorage("plf.insurance")   private var insuranceOK   = false

    // 당일 운영
    @AppStorage("plf.dayOpen")     private var dayOpenOK     = false
    @AppStorage("plf.dayBriefing") private var dayBriefingOK = false
    @AppStorage("plf.dayPhoto")    private var dayPhotoOK    = false
    @AppStorage("plf.dayFeedback") private var dayFeedbackOK = false

    // 완료 플래그
    @AppStorage("plf.done")        private var launchDone    = false

    private let pages = ["왜 중요한가", "오픈 전 점검", "당일 운영", "홍보 타임라인"]

    private var preChecks: [(String, Binding<Bool>)] {[
        ("인허가·영업신고 원본 보관 및 게시", $permitOK),
        ("주방 설비·기기 시운전 완료", $equipmentOK),
        ("1주일치 식자재·소모품 선입고", $stockOK),
        ("직원 최종 역할 배정·교육 완료", $staffOK),
        ("POS·키오스크·카드 단말기 테스트", $posOK),
        ("위생 점검 (냉장 온도·식기 소독)", $hygieneOK),
        ("비상 연락망·응급 절차 공유", $emergencyOK),
        ("영업배상·화재보험 가입 확인", $insuranceOK),
    ]}

    private var dayChecks: [(String, Binding<Bool>)] {[
        ("오픈 1시간 전 조리·홀 세팅 완료", $dayOpenOK),
        ("직원 조회 — 역할·동선·메뉴 최종 확인", $dayBriefingOK),
        ("오픈 순간 사진·영상 기록 (SNS용)", $dayPhotoOK),
        ("첫날 영업 후 팀 피드백 15분 미팅", $dayFeedbackOK),
    ]}

    private var preCheckCount: Int { preChecks.filter { $0.1.wrappedValue }.count }
    private var dayCheckCount: Int  { dayChecks.filter  { $0.1.wrappedValue }.count }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    // 가로 스크롤 탭바 (4개 탭)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(pages.indices, id: \.self) { i in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) { page = i }
                                } label: {
                                    Text(pages[i])
                                        .font(BUFont.bodySmall.weight(page == i ? .semibold : .regular))
                                        .foregroundStyle(page == i ? BUColor.midnight : BUColor.inkMuted)
                                        .padding(.horizontal, BUSpacing.md)
                                        .padding(.vertical, BUSpacing.sm)
                                        .background(
                                            page == i ? BUColor.midnight.opacity(0.08) : Color.clear,
                                            in: Capsule()
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.sm)
                    }
                    .padding(.vertical, BUSpacing.xs)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: whyPage
                                case 1: preCheckPage
                                case 2: dayPage
                                default: prPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("오픈 최종 점검")
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

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 최종 점검 · 왜 중요한가")
                    Text("첫날은 두 번 없다 —\n오픈 전 72시간이 운명을 바꾼다")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("음식점 폐업의 주요 원인 1순위는 '준비 부족'. 오픈 직전 72시간 체크리스트를 통과한 가게는 첫 달 생존율이 확연히 높습니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 직전 72시간 — 무엇을 해야 하나")
                    let items: [(String, String, String)] = [
                        ("D-3", "최종 식자재 발주 + 설비 시운전", "cart"),
                        ("D-2", "직원 최종 교육 + POS 실전 테스트", "person.2"),
                        ("D-1", "홀·주방 대청소 + SNS 예고 게시물", "sparkles"),
                        ("D-Day", "오픈 1시간 전 세팅 + 조회 + 사진 기록", "flag.fill"),
                    ]
                    ForEach(items, id: \.0) { day, task, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                                Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            warningCard(title: "이것만큼은 절대 미루지 말 것", items: [
                "인허가·영업신고필증 — 게시 의무 위반 시 즉시 영업정지",
                "POS 실전 결제 테스트 — 오픈 당일 결제 불가 시 고객 이탈",
                "식자재 냉장 온도 기록 — 위생점검 시 1순위 확인 항목",
            ], color: .orange)
        }
    }

    // MARK: - pg 1 오픈 전 점검

    private var preCheckPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("오픈 전 점검 체크리스트")
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("\(preCheckCount)").font(.system(size: 32, weight: .bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                        Text("/ \(preChecks.count) 항목 완료").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.inkMuted)
                    }
                    ProgressView(value: Double(preCheckCount), total: Double(preChecks.count))
                        .tint(BUColor.midnight).padding(.top, 4)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 전 필수 8개 항목")
                    ForEach(preChecks, id: \.0) { label, binding in
                        Toggle(isOn: binding) {
                            Text(label)
                                .font(BUFont.bodySmall)
                                .foregroundStyle(binding.wrappedValue ? BUColor.inkMuted : BUColor.ink)
                                .strikethrough(binding.wrappedValue, color: BUColor.inkMuted)
                        }.tint(BUColor.midnight)
                        if preChecks.last?.0 != label { Divider() }
                    }
                }
            }

            if preCheckCount == preChecks.count {
                BUCard(.hero) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: "checkmark.seal.fill").font(.system(size: 24)).foregroundStyle(BUColor.success)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("오픈 전 점검 완료!").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                            Text("이제 자신 있게 오픈 당일을 맞이하세요.").font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 당일 운영

    private var dayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 당일 운영 체크리스트")
                    ForEach(dayChecks, id: \.0) { label, binding in
                        Toggle(isOn: binding) {
                            Text(label).font(BUFont.bodySmall)
                                .foregroundStyle(binding.wrappedValue ? BUColor.inkMuted : BUColor.ink)
                                .strikethrough(binding.wrappedValue, color: BUColor.inkMuted)
                        }.tint(BUColor.midnight)
                        if dayChecks.last?.0 != label { Divider() }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 당일 운영 스크립트")
                    let scripts: [(String, String, String)] = [
                        ("-1h", "세팅 완료", "홀 테이블·주방 기기·냉장고·POS 최종 점검. 직원 출근 확인."),
                        ("-30m", "직원 조회", "오늘 메뉴·역할·동선·비상 연락망 5분 브리핑."),
                        ("오픈", "문열기", "간판 켜기·오픈 사진 SNS 게시·환영 멘트 준비."),
                        ("+2h", "중간 점검", "재료 소진 상황·홀 혼잡도·POS 현황 체크."),
                        ("마감", "정산·피드백", "하루 매출 확인·직원 피드백 미팅 15분·내일 발주 결정."),
                    ]
                    ForEach(scripts, id: \.0) { time, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(time).font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                                .frame(width: 38, alignment: .trailing).padding(.top, 1)
                            Rectangle().fill(BUColor.midnight.opacity(0.2)).frame(width: 1).padding(.top, 4)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $launchDone) {
                    Text("오픈 최종 점검 완료 — 그랜드 오픈!").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 3 홍보 타임라인

    private var prPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("홍보 타임라인")
                    Text("오픈 전후 2주 — 비용 0원 홍보 로드맵")
                        .font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                    Text("SNS 팔로워가 없어도 됩니다. 네이버 플레이스 등록 + 지인 초대만으로 첫 주 리뷰 10개를 확보하는 것이 목표.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 전 홍보 (D-7 ~ D-1)")
                    let prePR: [(String, String)] = [
                        ("D-7", "네이버 플레이스 등록 + 사진 10장 이상 업로드"),
                        ("D-5", "카카오톡 채널 개설 + 지인 300명에게 오픈 소식 공유"),
                        ("D-3", "인스타그램 '오픈 D-3' 카운트다운 스토리 게시"),
                        ("D-1", "\"내일 오픈\" 스토리 + 첫 방문 혜택 예고 (ex: 음료 서비스)"),
                    ]
                    ForEach(prePR, id: \.0) { day, task in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 32, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("오픈 후 홍보 (D+1 ~ D+7)")
                    let postPR: [(String, String)] = [
                        ("D+1", "첫날 매출·손님 반응 인스타 스토리 공유 (생생한 현장감)"),
                        ("D+3", "첫 리뷰어 감사 DM + 네이버 플레이스 사장 댓글 시작"),
                        ("D+5", "\"이번 주 베스트 메뉴\" 콘텐츠 게시 (사진 퀄리티 집중)"),
                        ("D+7", "첫 주 결산 — 리뷰 수·방문자·인기 메뉴 정리 후 다음 주 계획"),
                    ]
                    ForEach(postPR, id: \.0) { day, task in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(day).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.success).frame(width: 32, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("비용 0원 홍보 우선순위")
                    let tips: [(String, String)] = [
                        ("네이버 플레이스 사진 최적화", "리뷰 평점·사진 개수가 로컬 검색 순위 결정"),
                        ("지인 리뷰 요청 (첫 10개)", "첫 달 리뷰 10개 = 알고리즘 초기 부스트"),
                        ("인스타 스토리 일 1회", "팔로워 없어도 해시태그로 지역 노출"),
                    ]
                    ForEach(tips, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "star.fill").foregroundStyle(.yellow).font(.system(size: 10)).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func warningCard(title: String, items: [String], color: Color) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("PreLaunchFinal") { PreLaunchFinalStageView() }
#endif
