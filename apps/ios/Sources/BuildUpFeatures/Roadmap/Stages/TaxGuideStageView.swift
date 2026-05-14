//
//  TaxGuideStageView.swift — 세무 가이드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/TaxGuideStage.tsx
//  stageId: "tax-guide"
//
//  2026 검증 데이터:
//    - 간이과세 기준: 1억 400만원 (부가가치세법 시행령 §109)
//    - 일반과세: 부가세 1·7월 25일 / 간이과세: 1월 25일
//    - 종합소득세: 5월 1~31일 (2026년은 6월 1일까지)
//    - 미신고 가산세: 20% + 납부지연 일 0.022%
//    - 가공 세금계산서 가산세: 4% (2026년 3%→4% 상향)
//
//  4-page (세그먼트):
//    pg 0 — 신고 캘린더 & 가산세 위험
//    pg 1 — 홈택스·카드 세팅
//    pg 2 — 절세 포인트
//    pg 3 — 세무사 판단
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// 2026 간이과세 기준 — 부가가치세법 시행령 §109
private let SIMPLIFIED_THRESHOLD = "1억 400만원"

public struct TaxGuideStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("taxGuide.hometax")       private var hometaxDone      = false
    @AppStorage("taxGuide.bizCard")       private var bizCardDone      = false
    @AppStorage("taxGuide.cashReceipt")   private var cashReceiptDone  = false
    @AppStorage("taxGuide.cpaDecision")   private var cpaDecision      = "" // "cpa" or "self"
    @AppStorage("taxGuide.vatCalendar")   private var vatCalendar      = false

    private let pages = ["신고 캘린더", "홈택스 세팅", "절세 포인트", "세무사 판단"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
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
                                case 0: calendarPage
                                case 1: setupPage
                                case 2: savingsPage
                                default: cpaPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("세무 가이드")
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

    // MARK: - pg 0 신고 캘린더

    private var calendarPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무 가이드 · 신고 캘린더")
                    Text("부가세·종소세 신고 캘린더 —\n1건 누락 = 가산세 20%")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("미신고 시 무신고 가산세 20% + 납부지연 일 0.022%. 캘린더에 미리 등록 + 모바일 알림 필수.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("연간 세금 신고 캘린더")
                    let calendar: [(String, String, String)] = [
                        ("1월 25일", "부가세 신고·납부", "간이과세: 연 1회. 일반과세: 7월분 예정신고 + 확정신고"),
                        ("7월 25일", "부가세 예정신고", "일반과세만 해당. 상반기 매출·매입 신고"),
                        ("5월 1~31일", "종합소득세 신고", "전년도 사업소득 신고. 2026년은 6월 1일까지"),
                        ("매월 10일", "원천세 신고·납부", "직원 급여 지급 월 다음달 10일까지"),
                        ("매월 10일", "4대보험료 자동이체", "자동이체 설정 권장 — 연체 시 가산금 발생"),
                    ]
                    ForEach(calendar, id: \.0) { date, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(date)
                                .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                                .fixedSize()
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            warningCard(title: "2026년 가산세 주의", items: [
                "신고 기한 1일 늦으면 무신고 가산세 20% + 매일 0.022% 추가",
                "2026년부터 가공 세금계산서 가산세 3% → 4% 상향",
                "세금계산서 받을 때 진위 확인 필수 — 허위 발급 4% 부과",
            ], color: .red)

            BUCard(.card) {
                Toggle(isOn: $vatCalendar) {
                    Text("세금 신고 캘린더 등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 1 홈택스 세팅

    private var setupPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("홈택스 필수 세팅")
                    Text("홈택스 가입 + 사업용 카드 분리 —\n첫 영업일부터 적용")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("개인카드 혼용은 비용처리 거부 사유. 공인인증서 등록 즉시 세금계산서 발행·종소세 신고 가능.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("홈택스 세팅 체크리스트")
                    Toggle(isOn: $hometaxDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("홈택스 회원가입 + 사업장 등록").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("공인인증서 or 금융인증서 → 세금계산서 발행 활성화").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $bizCardDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("사업용 카드 1개 분리 (이체·체크 카드 추가 가능)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("모든 사업 경비 사업용 카드만 사용 — 혼용 = 비용 불인정").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $cashReceiptDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("현금영수증 가맹점 등록").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("연 매출 2,400만원+ 의무. 미등록 시 가산세 5%").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("과세유형 가이드")
                    let types: [(String, String, String)] = [
                        ("간이과세", "연 매출 \(SIMPLIFIED_THRESHOLD) 미만", "부가세 면제 or 대폭 경감. 세금계산서 발행 불가. 1월 신고 1회."),
                        ("일반과세", "연 매출 \(SIMPLIFIED_THRESHOLD) 이상", "부가세 10% (매입세액 공제). 세금계산서 발행 가능. 1·7월 신고 2회."),
                    ]
                    ForEach(types, id: \.0) { type, criteria, desc in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Text(type).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                Text(criteria).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            }
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
    }

    // MARK: - pg 2 절세 포인트

    private var savingsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("절세 포인트")
                    Text("매입세금계산서 받기 —\nVAT 환급의 시작점")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("거래처에 사업자등록증 전달 → 세금계산서 발급 요청. 카드영수증·간이영수증 5년 보관 (앱 백업 권장).")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소상공인 핵심 절세 5가지")
                    let tips: [(String, String, String)] = [
                        ("매입세금계산서 수취", "공급업체에 사업자등록증 전달 → 세금계산서 요청. 부가세 매입세액 공제 = VAT 절감의 핵심.", "doc.text.fill"),
                        ("사업용 카드 경비 처리", "모든 사업 경비를 사업용 카드로 — 연말 소득 차감. 회식·소모품·교통비 포함.", "creditcard.fill"),
                        ("인건비·4대보험 비용 처리", "직원 급여 + 사업주 부담 4대보험 전액 비용 처리 가능.", "person.2.fill"),
                        ("인테리어·설비 감가상각", "5~10년 감가상각으로 매년 비용 분산 처리. 초기 투자 세금 효과 장기화.", "building.2.fill"),
                        ("창업 초기 세액감면", "2026 창업 중소기업 세액감면 50% (비수도권 일부 업종). 세무사 통해 적용 여부 확인.", "sparkles"),
                    ]
                    ForEach(tips, id: \.0) { title, detail, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            warningCard(title: "놓치기 쉬운 함정", items: [
                "현금 거래 + 영수증 미수취 = 비용 불인정 → 세금 늘어남",
                "간이과세자는 세금계산서 발행 불가 — B2B 거래 시 일반과세 전환 검토",
                "영수증 분실 → 5년 내 세무조사 때 추가 세금 부과",
            ], color: .orange)
        }
    }

    // MARK: - pg 3 세무사 판단

    private var cpaPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무사 판단")
                    Text("직원 채용·매출 \(SIMPLIFIED_THRESHOLD)+ 시\n세무사 선임 결정")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("월 10~30만원 세무사 수임료 < 가산세·놓친 공제. 직원 있거나 매출 1억 넘으면 세무사가 압도적으로 유리합니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무 처리 방식 선택")
                    HStack(spacing: BUSpacing.sm) {
                        cpaOptionCard(id: "cpa", title: "세무사 선임",
                                      pros: ["신고 대행 + 절세 컨설팅", "가산세 예방 효과", "직원 있거나 매출 1억+ 필수"],
                                      cost: "월 10~30만원")
                        cpaOptionCard(id: "self", title: "직접 신고",
                                      pros: ["홈택스 + 삼쩜삼 SaaS", "1인 매장·간이과세자만 권장", "무료~소액"],
                                      cost: "무료~월 수만원")
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무사 선임 기준 (소상공인)")
                    let criteria: [(String, String, Bool)] = [
                        ("직원 1명 이상 고용",               "원천세·4대보험·연말정산 복잡도 급증", true),
                        ("연 매출 \(SIMPLIFIED_THRESHOLD) 이상", "일반과세 전환·부가세 신고 복잡화",  true),
                        ("세금계산서 거래 많은 B2B",          "매입세액 공제 최적화 필요",            true),
                        ("1인 매장·연 매출 5천만 미만",       "삼쩜삼·캐시노트 SaaS 직접 신고 OK",    false),
                    ]
                    ForEach(criteria, id: \.0) { label, detail, recommend in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Image(systemName: recommend ? "checkmark.circle.fill" : "minus.circle")
                                .font(.system(size: 16))
                                .foregroundStyle(recommend ? BUColor.success : BUColor.inkMuted)
                                .padding(.top, 1)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    private func cpaOptionCard(id: String, title: String, pros: [String], cost: String) -> some View {
        let isSelected = cpaDecision == id
        return Button {
            cpaDecision = isSelected ? "" : id
        } label: {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Spacer()
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success)
                    }
                }
                ForEach(pros, id: \.self) { pro in
                    HStack(alignment: .top, spacing: 4) {
                        Text("·").foregroundStyle(BUColor.midnight)
                        Text(pro).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(1.5)
                    }
                }
                Text(cost)
                    .font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                    .padding(.top, 2)
            }
            .padding(BUSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2))
        }
        .buttonStyle(.plain)
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
#Preview("TaxGuide") { TaxGuideStageView() }
#endif
