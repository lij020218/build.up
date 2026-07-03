//
//  DigitalFulfillmentNoticeView.swift — 디지털 상품·창작자 서비스용 소싱/스토어 안내 (2026-07-02 업종 정합 감사)
//
//  웹 apps/web/.../online/DigitalFulfillmentNotice.tsx 의 iOS 미러 (내용 1:1, 한국어).
//
//  배경: online-digital 로드맵은 카테고리로 라우팅돼 digital-products·creator-service 등
//        무배송 서브타입도 sourcing-setup(중국소싱·KC)·store-setup(택배·포장) 단계를 받았다.
//        물리 상품 전제라 부적합 → 디지털 서브타입이면 안내로 대체.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents

/// 물리 배송이 없는 디지털·창작자 온라인 서브타입 (starter-data.ts online-digital 하위 SSOT).
public func isDigitalFulfillment(_ industryId: String) -> Bool {
    switch industryId {
    case "digital-products", "creator-service", "newsletter-membership", "ai-application":
        return true
    default:
        return false
    }
}

public enum DigitalFulfillmentStage: Sendable { case sourcing, store }

public struct DigitalFulfillmentNoticeView: View {
    let stage: DigitalFulfillmentStage

    public init(stage: DigitalFulfillmentStage) {
        self.stage = stage
    }

    private var title: String {
        stage == .sourcing ? "디지털 상품은 '재고 소싱'이 없습니다" : "디지털 상품은 '택배·포장'이 없습니다"
    }
    private var subtitle: String {
        stage == .sourcing
            ? "중국 직구·도매 매입·KC 인증·통관은 물리 상품 이야기입니다. 디지털 상품·창작자 서비스는 '무엇을 만들고 어떻게 자동 전달하느냐'가 소싱을 대신합니다."
            : "택배사 계약·포장재·로켓그로스 입고는 물리 상품 이야기입니다. 디지털 판매의 '스토어 세팅'은 자동 전달·결제·구독·약관입니다."
    }
    private var items: [(String, String)] {
        stage == .sourcing
            ? [
                ("원본·라이선스 준비", "판매할 파일·템플릿·강의·에셋의 원본과 사용 라이선스(폰트·이미지·음원 등 2차 저작권) 확보"),
                ("제작 파이프라인", "기획 → 제작 → 검수 → 업데이트 주기 정의. 창작자 서비스는 콘텐츠·컨설팅 포맷과 산출물 표준화"),
                ("자동 전달 구조", "다운로드 링크·이메일 자동발송·회원 영역 등 결제 즉시 전달되는 구조. 재고 개념 대신 '무한 복제 + 버전 관리'"),
                ("품질·업데이트 정책", "무료 업데이트 범위·문의 대응·환불(디지털 청약철회 예외) 기준을 사전에 명문화"),
            ]
            : [
                ("판매 채널 세팅", "자체몰(파일 자동전달)·크몽·클래스101·스티비·서브스택 등 디지털 상품에 맞는 채널 선택"),
                ("결제·구독 연동", "PG(일회성) + 정기결제(구독) 연동. 뉴스레터·멤버십은 구독 해지·환불 흐름까지 점검"),
                ("라이선스·이용약관", "상업/개인 사용 범위, 재판매 금지 등 라이선스 고지 + 디지털콘텐츠 환불 예외 약관 게시"),
                ("전달 자동화 테스트", "결제 → 자동 다운로드/접근 권한 부여까지 본인 계정으로 1건 테스트. 실패 시 첫 구매 이탈"),
            ]
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow("디지털 상품 트랙")
                    Text(title)
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(subtitle)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                        HStack(alignment: .top, spacing: 8) {
                            Circle().fill(BUColor.midnight).frame(width: 6, height: 6).padding(.top, 6)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.0).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(item.1).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }
        }
    }
}
