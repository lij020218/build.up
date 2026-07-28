//
//  StoreSetupMissionsCard.swift — "가게 세팅" 미션 카드 (2026-07-28, 웹 StoreSetupMissionsCard 미러)
//
//  대상: **기존 가게 등록으로 들어온 사장님만.** 로드맵·AI 로드맵 진행자에게는
//  렌더 자체가 안 됨 (사장님 지시 — 판정은 웹 setup-missions.ts 와 동일 2단):
//   1) 마커 — industrySpecifics["__setupMeta"].path == "existing"
//   2) 휴리스틱 — 동일 completedAt 타임스탬프 15개 이상(기존 등록의 일괄 완료 흔적)
//
//  정직성: 완료 판정은 실데이터(entries·costs·inventory)만. 오퍼링 hidden 업종
//  (스타트업 계열)은 메뉴 미션 자체가 목록에 없음. 전 항목 완료 시 자동 소멸.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

struct BUStoreSetupMissionsCard: View {
    @ObservedObject var storeInfo: StoreInfoStore
    let decisions: [String: StageDecision]
    let entriesCount: Int
    let costsTotal: Double
    let categoryId: String?
    let subIndustryId: String?

    private static let identicalCompletionThreshold = 15 // 웹 IDENTICAL_COMPLETION_THRESHOLD 미러

    private static let offeringMissionLabel: [String: String] = [
        "menu-bom": "메뉴 등록",
        "stocked-goods": "상품 등록",
        "service-menu": "시술·서비스 메뉴 등록",
        "membership": "이용권·상품 등록",
        "space-booking": "이용권·공간 상품 등록",
    ]

    private struct Mission: Identifiable {
        let id: String
        let label: String
        let reward: String
        let done: Bool
    }

    // ── 마커·판정 ──

    private var metaObject: [String: AnyCodable]? {
        if case .object(let o) = storeInfo.state.industrySpecifics["__setupMeta"]?.raw.value { return o }
        return nil
    }

    private var isExistingRegistration: Bool {
        if case .string("existing") = metaObject?["path"]?.value { return true }
        var counts: [String: Int] = [:]
        for d in decisions.values {
            if let t = d.completedAt { counts[t, default: 0] += 1 }
        }
        return counts.values.contains { $0 >= Self.identicalCompletionThreshold }
    }

    private var isDismissed: Bool {
        if case .bool(true) = metaObject?["dismissed"]?.value { return true }
        return false
    }

    private var missions: [Mission] {
        var list: [Mission] = [
            Mission(id: "profile", label: "업종·가게 정보", reward: "", done: true),
            Mission(id: "channels", label: "운영 채널", reward: "", done: true),
            Mission(id: "revenue", label: "매출 연동 또는 첫 매출 입력", reward: "진단이 실측으로", done: entriesCount > 0),
            Mission(id: "costs", label: "월 고정비 입력", reward: "손익분기 열림", done: costsTotal > 0),
        ]
        // 오퍼링 hidden 업종(스타트업 계열)은 이 미션 자체가 없음 — 업종 분기 원칙
        let kind = BUOfferingKinds.resolve(subIndustryId: subIndustryId, categoryId: categoryId)
        if let label = Self.offeringMissionLabel[kind] {
            list.append(Mission(
                id: "offerings", label: label, reward: "원가율·재고 도구 열림",
                done: !storeInfo.state.inventory.isEmpty
            ))
        }
        return list
    }

    private func dismiss() {
        storeInfo.commit { s in
            var obj = metaObject ?? [:]
            obj["dismissed"] = AnyCodable(.bool(true))
            s.industrySpecifics["__setupMeta"] = AnyCodableValue(AnyCodable(.object(obj)))
        }
    }

    var body: some View {
        let items = missions
        let doneCount = items.filter(\.done).count
        // ⚠️ 노출 게이트 — 기존 가게 등록자만 + 미완료 항목 존재 + 미해제
        if isExistingRegistration && !isDismissed && doneCount < items.count {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text("가게 세팅")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                    Text("\(doneCount) / \(items.count) 완료")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                    Spacer()
                    Button(action: dismiss) {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .padding(4)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("세팅 카드 닫기")
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(BUColor.midnight.opacity(0.10)).frame(height: 4)
                        Capsule().fill(BUColor.midnight)
                            .frame(width: geo.size.width * CGFloat(doneCount) / CGFloat(items.count), height: 4)
                    }
                }
                .frame(height: 4)

                VStack(spacing: 0) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { i, m in
                        HStack(spacing: 10) {
                            ZStack {
                                Circle()
                                    .fill(m.done ? BUColor.midnight : Color.clear)
                                    .frame(width: 18, height: 18)
                                Circle()
                                    .strokeBorder(m.done ? Color.clear : BUColor.midnight.opacity(0.35), lineWidth: 1.5)
                                    .frame(width: 18, height: 18)
                                if m.done {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 9, weight: .heavy))
                                        .foregroundStyle(.white)
                                }
                            }
                            Text(m.label)
                                .font(.system(size: 13.5, weight: .semibold))
                                .foregroundStyle(m.done ? BUColor.inkMuted : BUColor.midnightInk)
                                .strikethrough(m.done)
                            Spacer(minLength: 8)
                            if !m.done && !m.reward.isEmpty {
                                Text(m.reward)
                                    .font(.system(size: 10.5, weight: .heavy))
                                    .foregroundStyle(BUColor.midnight)
                                    .padding(.horizontal, 9)
                                    .padding(.vertical, 3)
                                    .background(BUColor.midnight.opacity(0.07), in: Capsule())
                            }
                        }
                        .padding(.vertical, 8)
                        if i < items.count - 1 {
                            Divider().opacity(0.35)
                        }
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(0.92))
                    .shadow(color: BUColor.midnightDeep.opacity(0.07), radius: 12, x: 0, y: 5)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1)
            )
        }
    }
}
