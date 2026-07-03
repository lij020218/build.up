//
//  DeepTechStageNoticeView.swift — 딥테크·하드웨어 스타트업용 단계 안내 (2026-07-02 업종 정합 감사)
//
//  웹 apps/web/.../startup/DeepTechStageNotice.tsx 의 iOS 미러 (내용 1:1, 한국어).
//
//  배경: MvpBuild/LaunchGtm/GoLive 세 단계는 전 스타트업 서브타입이 공유하지만
//        본문이 SW(Vercel·App Store·Product Hunt·Hacker News)에 하드코딩돼
//        하드웨어·딥테크 창업자에게 부적합했다. 딥테크는 이미 전용 단계
//        (hardware-prototype·lab-setup·mpw 등)를 갖는다 → SW 본문 게이팅 + 트랙 안내.
//
//  cluster 매핑 SSOT: packages/shared/src/roadmap/clusters.ts (CLUSTER_BY_SUB_INDUSTRY)
//    hardware-iot → tech-hardware(.hardware) / robotics-physical-ai·biotech-medtech → tech-deeptech-lab(.lab)
//    semiconductor·climate-energy → tech-extreme-deeptech(.extreme) / 그 외(software) → nil
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents

public enum DeepTechTrack: Sendable {
    case hardware, lab, extreme

    /// 서브업종 id → 딥테크 트랙. SW·비스타트업이면 nil.
    public static func kind(forIndustryId id: String) -> DeepTechTrack? {
        switch id {
        case "hardware-iot":                          return .hardware
        case "robotics-physical-ai", "biotech-medtech": return .lab
        case "semiconductor", "climate-energy":       return .extreme
        default:                                       return nil
        }
    }

    var label: String {
        switch self {
        case .hardware: return "하드웨어·IoT 트랙"
        case .lab:      return "딥테크·랩 트랙"
        case .extreme:  return "극딥테크 트랙"
        }
    }
}

public enum DeepTechStageKey: Sendable {
    case mvp, launch, golive
}

private struct StageCopy {
    let heroTitle: String
    let heroSubtitle: String
    let flowTitle: String
    let flow: (DeepTechTrack) -> [String]
}

public struct DeepTechStageNoticeView: View {
    let stage: DeepTechStageKey
    let kind: DeepTechTrack

    public init(stage: DeepTechStageKey, kind: DeepTechTrack) {
        self.stage = stage
        self.kind = kind
    }

    public var body: some View {
        let copy = Self.copy(for: stage)
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // Hero
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow(kind.label)
                    Text(copy.heroTitle)
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(copy.heroSubtitle)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // 이 단계의 딥테크 흐름
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow(copy.flowTitle)
                    ForEach(copy.flow(kind), id: \.self) { item in
                        bulletRow(item, color: BUColor.midnight)
                    }
                }
            }

            // 트랙 무관 공통
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("트랙 무관 공통 — 이건 그대로 챙기세요")
                    ForEach(Self.universal, id: \.self) { item in
                        bulletRow(item, color: BUColor.inkSecondary)
                    }
                }
            }

            // 안내 노트
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "shippingbox")
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.midnight)
                Text("세부 실행 절차는 위에 언급된 당신 트랙 전용 단계에서 이어집니다. SW 전용 출시 가이드(Vercel·앱스토어·Product Hunt)는 이 트랙에 해당하지 않아 숨겼습니다.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
            }
            .padding(12)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(BUColor.midnight.opacity(0.14), lineWidth: 1))
        }
    }

    private func bulletRow(_ text: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Circle().fill(color).frame(width: 6, height: 6).padding(.top, 6)
            Text(text)
                .font(BUFont.bodySmall)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // ── 콘텐츠 (웹 DeepTechStageNotice.tsx KO 와 1:1) ──
    private static let universal: [String] = [
        "고객 인터뷰·레퍼런스 확보 — 어떤 트랙이든 '누가 왜 사는가'가 1순위",
        "핵심 지표 트래킹 — 파일럿 전환율·수율·리텐션 등 트랙에 맞는 지표",
        "B2B 마케팅 — 전시회·논문·파트너십·업계 미디어 (개인 소비자 채널 아님)",
    ]

    private static func copy(for stage: DeepTechStageKey) -> StageCopy {
        switch stage {
        case .mvp:
            return StageCopy(
                heroTitle: "MVP = 코드 배포가 아니라 '작동하는 물리 증거'",
                heroSubtitle: "SW 처럼 Next.js·Vercel 로 끝나지 않습니다. 당신의 MVP 는 프로토타입·벤치 데이터·시제로 핵심 가설을 증명하는 것입니다. 로드맵의 전용 단계가 세부 절차를 안내합니다.",
                flowTitle: "이 단계의 딥테크 흐름",
                flow: { kind in
                    switch kind {
                    case .hardware: return [
                        "핵심 기능 검증 보드(EVT) 제작 — 회로 + 펌웨어 최소 기능으로 '되는지' 먼저 증명",
                        "3D 프린팅·목업으로 기구(폼팩터) 검증 — 양산 금형 전 반복",
                        "BOM 초안 작성 — 핵심 부품 리드타임·단가·대체품 확보",
                        "리드 유저 3~5명 실사용 테스트 → 다음: 로드맵 '하드웨어 프로토타입(EVT/DVT/PVT)' 단계",
                    ]
                    case .lab: return [
                        "랩 환경 프로토타입 — 통제된 조건에서 핵심 원리·알고리즘 검증",
                        "벤치 데이터 확보 — 재현 가능한 측정으로 가설 증명(논문·IR 근거)",
                        "바이오/의료면 사전 규제 확인 — IRB·동물실험·GLP 필요 여부 조기 점검",
                        "→ 다음: 로드맵 '랩 셋업'·'프로토타입 반복' 단계",
                    ]
                    case .extreme: return [
                        "EDA 설계·시뮬레이션 — 파운드리 PDK 기반으로 설계 검증",
                        "MPW(멀티프로젝트 웨이퍼) 셔틀 tape-out 예약 — 소량 시제 칩으로 비용 최소화",
                        "테스트 벤치 준비 — 시제 반환 후 특성 평가 계획",
                        "→ 다음: 로드맵 'EDA 툴링'·'MPW/파일럿 tape-out' 단계",
                    ]
                    }
                }
            )
        case .launch:
            return StageCopy(
                heroTitle: "출시 = Product Hunt 가 아니라 파일럿 고객·디자인윈",
                heroSubtitle: "딥테크 GTM 은 Product Hunt·Hacker News·앱스토어가 아닙니다. 파일럿 도입·레퍼런스·인증·규제 승인이 시장 진입의 핵심입니다.",
                flowTitle: "이 단계의 딥테크 GTM 흐름",
                flow: { kind in
                    switch kind {
                    case .hardware: return [
                        "파일럿 고객 3~5곳 확보 — 실사용 레퍼런스·케이스 스터디가 다음 계약의 열쇠",
                        "인증 준비(KC·CE·FCC 등) — 미인증 판매 불가. 리드타임 사전 확보",
                        "판매 채널 결정 — B2B 직판 / 크라우드펀딩(와디즈·킥스타터) / 총판",
                        "→ 다음: 로드맵 '인증(KC/CE)'·'양산 파트너(EMS)' 단계",
                    ]
                    case .lab: return [
                        "필드/임상 테스트 설계 — 실환경 성능·안전 데이터 확보",
                        "규제 승인 경로 확정 — 인허가·임상 단계별 계획(식약처·FDA 등)",
                        "초기 파일럿 도입처(병원·현장) 확보 — 레퍼런스 + 논문·학회 발표",
                        "→ 다음: 로드맵 '필드·임상 테스트'·'규제 제출' 단계",
                    ]
                    case .extreme: return [
                        "리드 커스터머 디자인윈 — 샘플 공급 후 고객 설계 채택이 최대 마일스톤",
                        "파운드리·파트너 파일럿 라인 확보 — 양산 전환 경로 확정",
                        "레퍼런스·표준 대응 — 데이터시트·평가 키트 제공",
                        "→ 다음: 로드맵 '파트너·파일럿 라인' 단계",
                    ]
                    }
                }
            )
        case .golive:
            return StageCopy(
                heroTitle: "실출시 = 웹 배포가 아니라 초도 양산·현장 배포",
                heroSubtitle: "도메인·SSL·앱스토어 제출이 아닙니다. 당신의 '출시'는 초도 양산 출하·파일럿 현장 배포·리드 커스터머 공급입니다.",
                flowTitle: "이 단계의 딥테크 출시 흐름",
                flow: { kind in
                    switch kind {
                    case .hardware: return [
                        "초도 양산(파일럿 로트) 출하 — 품질·수율 검증 후 확대",
                        "크라우드펀딩 오픈 또는 B2B 파일럿 배포 — 채널에 맞춰 실행",
                        "A/S·RMA·펌웨어 OTA 체계 준비 — 출시 직후 필수",
                    ]
                    case .lab: return [
                        "규제 승인 후 파일럿 현장 배포 — 병원·연구소·현장 도입",
                        "초기 도입 고객 온보딩·교육 — 프로토콜·SOP 제공",
                        "실사용 데이터 수집 → 승인 확대·차기 적응증 근거",
                    ]
                    case .extreme: return [
                        "파일럿 라인 가동 — 리드 커스터머 샘플 공급 시작",
                        "양산 전환 준비 — 파운드리 캐파·수율 램프 계획",
                        "품질·신뢰성 인증(자동차 AEC-Q 등) 필요 시 병행",
                    ]
                    }
                }
            )
        }
    }
}
