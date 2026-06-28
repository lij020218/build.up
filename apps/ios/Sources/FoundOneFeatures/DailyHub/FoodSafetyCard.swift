//
//  FoodSafetyCard.swift — 식약처 위생점검 대비 (외식·카페 홈, 원가율과 나란히).
//
//  웹 SSOT: packages/shared/src/dashboard/food-safety-checklist.ts (23개 항목) +
//           apps/web/.../FoodSafetyComplianceCard.tsx
//  패리티 감사 HIGH 누락 해소(2026-06-04). 데이터 = 정적 오픈데이터(식약처) + 사장님 체크(가짜 아님).
//  영속: UserDefaults (항목별 마지막 점검 시각). 빈도 만료 지나면 "재점검" 표시.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - 데이터 (웹 food-safety-checklist.ts 1:1 포팅)

enum FoodSafetyFreq: String { case daily, weekly, monthly, annual, biannual
    var expiryDays: Double {
        switch self { case .daily: return 1; case .weekly: return 7; case .monthly: return 30
        case .annual: return 365; case .biannual: return 180 }
    }
    var labelKo: String {
        switch self { case .daily: return "매일"; case .weekly: return "주간"; case .monthly: return "월간"
        case .annual: return "매년"; case .biannual: return "반기" }
    }
}

struct FoodSafetyItem: Identifiable {
    let id: String
    let group: String        // 표시 그룹
    let freq: FoodSafetyFreq
    let weight: Int
    let labelKo: String
    let penaltyKo: String?
}

enum FoodSafetyRegistry {
    static let items: [FoodSafetyItem] = [
        // A. 필수 서류
        .init(id: "biz-license-posted", group: "필수 서류", freq: .annual, weight: 4, labelKo: "영업신고증 게시", penaltyKo: "1차 시정 → 2차 영업정지 7일"),
        .init(id: "hygiene-edu-cert", group: "필수 서류", freq: .annual, weight: 6, labelKo: "위생교육 수료증 (대표·종업원 매년)", penaltyKo: "과태료 20–50만원"),
        .init(id: "health-cert", group: "필수 서류", freq: .annual, weight: 6, labelKo: "건강진단결과서(보건증) — 전 종사자 매년", penaltyKo: "1차 30만 → 영업정지"),
        .init(id: "haccp-cert", group: "필수 서류", freq: .biannual, weight: 2, labelKo: "HACCP 인증 (해당 시)", penaltyKo: nil),
        // B. 매일
        .init(id: "fridge-temp", group: "매일 점검", freq: .daily, weight: 8, labelKo: "냉장 5°C 이하 / 냉동 -18°C 이하", penaltyKo: "1차 시정 → 2차 영업정지 7일"),
        .init(id: "expiry-check", group: "매일 점검", freq: .daily, weight: 8, labelKo: "유통기한 만료 식자재 폐기", penaltyKo: "영업정지 15일 + 과태료"),
        .init(id: "handwash", group: "매일 점검", freq: .daily, weight: 4, labelKo: "종업원 손씻기 / 위생복·앞치마", penaltyKo: nil),
        .init(id: "knife-board-separate", group: "매일 점검", freq: .daily, weight: 5, labelKo: "도마·칼 식재료별 분리 (생/채소/익힌)", penaltyKo: nil),
        .init(id: "kitchen-clean", group: "매일 점검", freq: .daily, weight: 4, labelKo: "조리대·바닥·싱크대 청소", penaltyKo: nil),
        .init(id: "trash-managed", group: "매일 점검", freq: .daily, weight: 3, labelKo: "음식물·일반쓰레기 분리 + 뚜껑", penaltyKo: nil),
        .init(id: "drinking-water", group: "매일 점검", freq: .daily, weight: 3, labelKo: "음용수 관리 (정수기 필터·끓임)", penaltyKo: nil),
        // C. 주간
        .init(id: "hood-grease", group: "주간 점검", freq: .weekly, weight: 5, labelKo: "후드·환기시설 기름때 청소", penaltyKo: nil),
        .init(id: "dishwasher-temp", group: "주간 점검", freq: .weekly, weight: 4, labelKo: "식기 살균 (75°C+ 또는 락스 200ppm)", penaltyKo: nil),
        .init(id: "pest-check", group: "주간 점검", freq: .weekly, weight: 4, labelKo: "방충·방서(바퀴·쥐) 흔적 확인", penaltyKo: "영업정지 7일+"),
        // D. 월간
        .init(id: "freezer-defrost", group: "월간 점검", freq: .monthly, weight: 3, labelKo: "냉장·냉동고 성에 제거 + 청소", penaltyKo: nil),
        .init(id: "supplier-cert", group: "월간 점검", freq: .monthly, weight: 4, labelKo: "식자재 공급처 위생 증명 확인", penaltyKo: nil),
        .init(id: "fire-extinguisher", group: "월간 점검", freq: .monthly, weight: 2, labelKo: "소화기 압력·유효기간", penaltyKo: nil),
        // E. 시설
        .init(id: "restroom-clean", group: "시설", freq: .daily, weight: 5, labelKo: "화장실 청결 + 비누·휴지", penaltyKo: nil),
        .init(id: "lighting-ventilation", group: "시설", freq: .weekly, weight: 3, labelKo: "조명·환기 (조리장 220 lux+)", penaltyKo: nil),
        .init(id: "no-pest-entry", group: "시설", freq: .weekly, weight: 3, labelKo: "출입구 방충망 / 문틈 차단", penaltyKo: nil),
        .init(id: "allergen-display", group: "시설", freq: .monthly, weight: 4, labelKo: "알레르기 유발식품 표시 (22종)", penaltyKo: "과태료 50만원"),
        .init(id: "no-smoking", group: "시설", freq: .monthly, weight: 2, labelKo: "금연 표지 + 흡연구역 분리", penaltyKo: "과태료 170만원"),
    ]
    static let groupOrder = ["필수 서류", "매일 점검", "주간 점검", "월간 점검", "시설"]
}

// MARK: - 영속 (UserDefaults — 항목별 마지막 점검 epoch)

@MainActor
final class FoodSafetyChecks: ObservableObject {
    private let key = "buildup:food-safety-checks:v1"
    @Published private(set) var lastChecked: [String: TimeInterval]

    init() {
        lastChecked = (UserDefaults.standard.dictionary(forKey: key) as? [String: TimeInterval]) ?? [:]
    }
    /// 빈도 만료 내에 점검됐으면 valid(통과).
    func isValid(_ item: FoodSafetyItem, now: Date) -> Bool {
        guard let ts = lastChecked[item.id] else { return false }
        let days = (now.timeIntervalSince1970 - ts) / 86_400
        return days <= item.freq.expiryDays
    }
    func toggle(_ item: FoodSafetyItem, now: Date) {
        if let ts = lastChecked[item.id], Calendar.current.isDate(Date(timeIntervalSince1970: ts), inSameDayAs: now) {
            lastChecked[item.id] = nil          // 오늘 체크한 것 다시 누르면 해제
        } else {
            lastChecked[item.id] = now.timeIntervalSince1970
        }
        UserDefaults.standard.set(lastChecked, forKey: key)
    }
}

// MARK: - 카드

public struct FoodSafetyCard: View {
    @StateObject private var checks = FoodSafetyChecks()
    @State private var expanded = false
    private let now = Date()

    public init() {}

    private var score: Int {
        let valid = FoodSafetyRegistry.items.filter { checks.isValid($0, now: now) }
        return valid.reduce(0) { $0 + $1.weight }   // weight 합 = 100
    }
    private var grade: (label: String, hg: HealthGrade) {
        switch score {
        case 90...: return ("매우 우수", .healthy)
        case 85..<90: return ("우수", .healthy)
        case 80..<85: return ("좋음", .caution)
        default: return ("점검 필요", score >= 60 ? .warning : .critical)
        }
    }
    /// 오늘 점검 필요 — daily 빈도인데 valid 아님.
    private var overdueToday: [FoodSafetyItem] {
        FoodSafetyRegistry.items.filter { $0.freq == .daily && !checks.isValid($0, now: now) }
    }

    public var body: some View {
        let palette = HealthColors.palette(for: grade.hg)
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                // 헤더 + 점수
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(palette.dot.opacity(0.15)).frame(width: 36, height: 36)
                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 15, weight: .semibold)).foregroundStyle(palette.dot)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("위생점검 대비").buSectionEyebrowStyle()
                        Text("식약처 위생등급 23항목").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("\(score)점").font(.system(size: 20, weight: .heavy)).monospacedDigit().foregroundStyle(palette.text)
                        Text(grade.label).font(.system(size: 10, weight: .bold)).foregroundStyle(palette.text.opacity(0.8))
                    }
                }

                // 오늘 점검 필요 (daily 미점검) — 즉시 체크
                if !overdueToday.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("오늘 점검 필요 \(overdueToday.count)개")
                            .font(.system(size: 11.5, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        ForEach(overdueToday.prefix(expanded ? 99 : 3)) { item in
                            checkRow(item)
                        }
                        if !expanded && overdueToday.count > 3 {
                            Text("외 \(overdueToday.count - 3)개 — 펼쳐보기")
                                .font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                        }
                    }
                }

                // 펼쳐보기 — 전체 23항목 (그룹별). 위 "오늘 점검 필요"에 이미 뜬 항목은 제외(중복 방지).
                if expanded {
                    let shownIds = Set(overdueToday.map { $0.id })
                    ForEach(FoodSafetyRegistry.groupOrder, id: \.self) { group in
                        let groupItems = FoodSafetyRegistry.items.filter { $0.group == group && !shownIds.contains($0.id) }
                        if !groupItems.isEmpty {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(group).font(.system(size: 10, weight: .heavy)).textCase(.uppercase).tracking(0.5).foregroundStyle(BUColor.inkMuted)
                                ForEach(groupItems) { checkRow($0) }
                            }
                        }
                    }
                }

                Button { withAnimation(.snappy(duration: 0.2)) { expanded.toggle() } } label: {
                    HStack(spacing: 5) {
                        Text(expanded ? "접기" : "전체 23항목 점검")
                            .font(.system(size: 12, weight: .bold))
                        Image(systemName: expanded ? "chevron.up" : "chevron.down").font(.system(size: 10, weight: .bold))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)

                // 2026-06-29 fix: 직전엔 "(공식)" 캡션만 있고 실제 링크가 없었다(+웹은 엉뚱한 페이지로 감).
                // 법제처 '찾기쉬운 생활법령정보' 음식점 위생등급제 안내로 연결(웹과 동일 URL·검증됨).
                Link(destination: URL(string: "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=840&ccfNo=2&cciNo=1&cnpClsNo=4")!) {
                    HStack(spacing: 3) {
                        Image(systemName: "arrow.up.right.square").font(.system(size: 9.5, weight: .semibold))
                        Text("음식점 위생등급제 안내 (생활법령정보)").font(.system(size: 9.5, weight: .medium))
                    }
                    .foregroundStyle(BUColor.midnight)
                }
            }
        }
    }

    private func checkRow(_ item: FoodSafetyItem) -> some View {
        let valid = checks.isValid(item, now: now)
        return Button { checks.toggle(item, now: now) } label: {
            HStack(alignment: .top, spacing: 9) {
                Image(systemName: valid ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(valid ? BUColor.success : BUColor.inkSubtle)
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.labelKo)
                        .font(.system(size: 12.5, weight: valid ? .regular : .semibold))
                        .foregroundStyle(valid ? BUColor.inkMuted : BUColor.ink)
                        .strikethrough(valid, color: BUColor.inkSubtle)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    if let p = item.penaltyKo, !valid {
                        Text("⚠ \(p)").font(.system(size: 9.5, weight: .semibold)).foregroundStyle(BUColor.warn)
                    }
                }
                Spacer(minLength: 0)
                Text(item.freq.labelKo).font(.system(size: 9, weight: .bold))
                    .foregroundStyle(BUColor.inkSubtle)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(BUColor.midnight.opacity(0.05), in: Capsule())
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(.plain)
    }
}
