//
//  RegistrationSetupStageView.swift — 사업자등록 + 인허가 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/RegistrationSetupStage.tsx
//  stageId: "registration-setup"
//
//  4-page (세그먼트):
//    pg 0 — 왜 중요한가
//    pg 1 — 1단계: 사업자등록 (홈택스)
//    pg 2 — 2단계: 인허가 (일반음식점 영업신고)
//    pg 3 — 유리한 길 (과세유형)
//
//  2026 법령:
//    간이과세 기준 1억 400만원 (부가세법 시행령 109조)
//    사업개시일 20일 이내 등록 의무
//    음식점 일반음식점 영업신고 비용 약 6.6만원
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct RegistrationSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0
    @AppStorage("stage.regSetup.bizRegDone")    private var bizRegDone    = false
    @AppStorage("stage.regSetup.permitDone")    private var permitDone    = false
    @AppStorage("stage.regSetup.taxTypeChoice") private var taxTypeChoice = ""

    private let pages = ["왜 중요한가", "사업자등록", "인허가", "유리한 길"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    // 세그먼트 탭
                    Picker("페이지", selection: $page) {
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
                                case 0: whyPage
                                case 1: bizRegPage
                                case 2: permitPage
                                default: taxPathPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("사업자등록·인허가")
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

    // MARK: - pg 0 왜

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("단계 9 · 사업자등록·인허가")
                    Text("영업 시작 전 반드시\n끝낼 두 가지")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("사업자등록 → 인허가 → 오픈. 순서를 지키지 않으면 매출이 0원으로 묶입니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            whyCard(accent: BUColor.midnight,
                title: "법적 의무 — 미등록은 즉시 처벌",
                body: "사업개시일로부터 20일 이내 사업자등록 의무. 일반음식점 미신고 영업은 식품위생법 §97(6) — 3년 이하 징역 또는 3천만원 이하 벌금 + 폐쇄 명령.")

            whyCard(accent: .blue,
                title: "운영 인프라의 전제 조건",
                body: "사업자등록증 없으면 사업용 통장 개설, POS 가맹, 세금계산서 발행, 배달앱 입점이 모두 불가능합니다.")

            whyCard(accent: .red,
                title: "순서가 중요 — 순차 진행 필수",
                body: "① 임대차계약 → ② 사업자등록 → ③ 인허가 신고 → ④ 오픈. 위생교육·보건증은 사업자등록과 병행 가능(시간 절약).")
        }
    }

    private func whyCard(accent: Color, title: String, body: String) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Circle().fill(accent).frame(width: 8, height: 8).padding(.top, 6)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(body).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
        }
    }

    // MARK: - pg 1 사업자등록

    private var bizRegPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("1단계 · 사업자등록 (홈택스)")
                    Text("무료 · 1~3일 소요 · 사업개시 20일 이내 의무")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            BUCard(.card) {
                VStack(spacing: 0) {
                    stepRow(num: 1, title: "홈택스 접속 → 사업자등록 신청",
                        detail: "공동인증서·간편인증 로그인. 인증서 없으면 관할 세무서 직접 방문 (당일 발급 가능).")
                    stepRow(num: 2, title: "업종코드 입력 — 음식점 552111 (한식)",
                        detail: "국세청 업종코드 조회로 정확히 확인. 배달 전문도 동일 코드 사용 가능.")
                    stepRow(num: 3, title: "사업장 주소 = 임대차계약서 주소",
                        detail: "계약서 사본 첨부 필수. 주소 불일치 시 인허가 신청 거절.")
                    stepRow(num: 4, title: "과세유형 선택 — 간이 / 일반",
                        detail: "2026년 기준 직전년 매출 1억 400만원 미만 → 간이과세 가능. 초기 창업자 간이로 시작 권장.")
                    stepRow(num: 5, title: "제출 → 즉일~3일 발급 → 사업용 통장 개설",
                        detail: "등록증 발급 직후 사업용 통장·카드·POS 가맹 동시 신청.", isLast: true)
                }
            }

            // 완료 체크
            BUCard(.card) {
                Toggle(isOn: $bizRegDone) {
                    Text("사업자등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 2 인허가

    private var permitPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("2단계 · 일반음식점 영업신고 (식품위생법)")
                    Text("관할 구청 위생과 또는 정부24 · 약 6.6만원 · 7~14일")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            // 필요 서류
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필요 서류 (6종)")
                    let docs = [
                        "사업자등록증",
                        "임대차계약서",
                        "위생교육 수료증 (한국외식업중앙회)",
                        "건강진단결과서 (보건증)",
                        "건축물대장 (근린생활시설 확인)",
                        "평면도 (주방·홀 분리 표시)",
                    ]
                    ForEach(docs, id: \.self) { doc in
                        HStack(spacing: 8) {
                            Image(systemName: "doc.fill")
                                .font(.system(size: 11)).foregroundStyle(BUColor.midnight)
                            Text(doc).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                        }
                    }
                }
            }

            // 핵심 요건
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 요건")
                    let reqs = [
                        "주방과 객석은 벽·칸막이로 명확히 구분",
                        "조리장 바닥·벽은 내수성 자재",
                        "건축물 용도 = 근린생활시설 (1·2종)",
                        "환기·조명·급수·하수 시설 갖춤",
                    ]
                    ForEach(reqs, id: \.self) { req in
                        HStack(alignment: .top, spacing: 8) {
                            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
                            Text(req).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            // 자주 거절되는 사유
            BUCard(.card) {
                HStack(alignment: .top, spacing: BUSpacing.sm) {
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(Color.red).font(.system(size: 16))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("자주 거절되는 사유").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(Color.red)
                        let pitfalls = [
                            "주방·객석 분리 안 됨",
                            "건축물 용도가 근린생활시설이 아닌 경우",
                            "환기·하수·급수 시설 미비",
                            "지하층·반지하 영업 시 별도 요건 적용",
                        ]
                        ForEach(pitfalls, id: \.self) { p in
                            HStack(alignment: .top, spacing: 6) {
                                Text("⚠").font(.system(size: 10)).padding(.top, 2)
                                Text(p).font(BUFont.bodyCaption).foregroundStyle(Color(red: 0.5, green: 0.1, blue: 0.1)).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $permitDone) {
                    Text("영업신고증 발급 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 3 유리한 길

    private var taxPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("과세유형 — 첫 1년 손실 막는 결정")
                    Text("2026 간이과세 기준: 연매출 1억 400만원 미만")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            let paths: [(String, String, String)] = [
                ("예상 매출 4,800만 미만", "간이과세 + 부가세 면제 활용", "4,800만 미만은 부가세 납부 의무 자체 면제. 1년차 소형 매장에 가장 유리."),
                ("예상 매출 4,800만 ~ 1억 400만", "간이과세 (부가세율 1.5~4%)", "음식점 부가가치율 15% × 10% = 실질 1.5%. 일반과세 10% 대비 부담 큰 폭 감소."),
                ("예상 매출 1억 400만 초과", "일반과세 (자동) + 매입세액 환급", "간이과세 불가. 인테리어·장비·식자재 매입세액 환급 적극 활용."),
                ("B2B 거래 비중 높음", "처음부터 일반과세 등록", "간이과세는 세금계산서 발행 불가 → 거래처 매입세액 공제 불가 → 거래 거부 위험."),
            ]

            ForEach(paths, id: \.0) { condition, recommendation, reason in
                pathCard(condition: condition, recommendation: recommendation, reason: reason)
            }

            // 이번 주 체크리스트
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이번 주 체크리스트 — 순서대로")
                    let checklist = [
                        "임대차계약서 + 건축물대장 (정부24 무료) 준비",
                        "홈택스 사업자등록 신청 (즉일~3일)",
                        "위생교육 온라인 수강 (외식업중앙회 / 2.6만원 / 6시간)",
                        "관할 보건소 방문 → 보건증 발급 (1.2만원 / 1주 내)",
                        "일반음식점 영업신고 접수 (구청 위생과)",
                        "현장점검 대응 → 영업신고증 수령",
                        "사업용 통장 + POS 가맹 신청",
                    ]
                    ForEach(checklist.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(i+1).")
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18, alignment: .leading)
                            Text(checklist[i])
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    private func pathCard(condition: String, recommendation: String, reason: String) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Text(condition)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("→ " + recommendation)
                        .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(reason)
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, detail: String, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast {
                Divider().padding(.leading, 52)
            }
        }
    }
}

#if DEBUG
#Preview("RegistrationSetup") { RegistrationSetupStageView() }
#endif
