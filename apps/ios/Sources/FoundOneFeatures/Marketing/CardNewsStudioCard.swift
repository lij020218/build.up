//
//  CardNewsStudioCard.swift — 인스타 카드뉴스 자동 제작 (웹 CardNewsStudio.tsx 미러, 2026-07-21)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/CardNewsStudio.tsx + /api/ai/marketing/cardnews
//
//  템플릿 2종 (서버가 업종으로 결정):
//   · photo (카페·음식점): 1장 = 사진+가게명/타이틀 오버레이, 2장~ = 사진 주인공+하단 띠,
//     마지막 = 로고 장(업로드, 없으면 상호 워드마크). 사진은 장별 PhotosPicker → 기기 내 합성.
//   · text (그 외): 표지 후킹·본문·CTA 텍스트 카드.
//
//  내보내기: ImageRenderer 1080×1350(4:5) → 공유 시트(사진 앱 저장 포함).
//  과금: 지금 무료 · 9월부터 프로 전용 — 배지로만 고지(서버 게이팅 없음).
//  AI 기본법: 이미지 하단 "AI 제작 보조" 소표기 + UI 고지. 사진은 서버 전송 없음.
//

import SwiftUI
import PhotosUI
import FoundOneDesignSystem
import FoundOneData

// MARK: - 공유 시트 (UIActivityViewController 래퍼)

#if canImport(UIKit)
private struct ActivityShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
#endif

// MARK: - 카드 렌더 뷰 (미리보기·1080×1350 내보내기 공용)

private struct CardNewsCardView: View {
    let card: CardNewsCardModel
    let index: Int
    let total: Int
    let storeName: String
    let isPhotoVariant: Bool
    let photo: UIImage?
    let logo: UIImage?
    /// true = 1080×1350 원본 스케일 (내보내기), false = 미리보기 축소
    let exportScale: Bool

    private var s: CGFloat { exportScale ? 5.0 : 1.0 }   // 미리보기 216×270 → 내보내기 1080×1350
    private var W: CGFloat { 216 * s }
    private var H: CGFloat { 270 * s }
    private var onDark: Bool { isPhotoVariant ? card.role != "cta" : card.role == "cover" }

    var body: some View {
        ZStack {
            background
            content
            footer
        }
        .frame(width: W, height: H)
        .clipShape(RoundedRectangle(cornerRadius: exportScale ? 0 : 12))
        .overlay(
            RoundedRectangle(cornerRadius: exportScale ? 0 : 12)
                .stroke(BUColor.midnight.opacity(exportScale ? 0 : 0.10), lineWidth: 1)
        )
    }

    @ViewBuilder private var background: some View {
        if isPhotoVariant {
            if card.role == "cta" {
                Color(red: 0xF7 / 255, green: 0xF6 / 255, blue: 0xF1 / 255)
            } else if let photo {
                Image(uiImage: photo)
                    .resizable()
                    .scaledToFill()
                    .frame(width: W, height: H)
                    .clipped()
            } else {
                Color(red: 0xED / 255, green: 0xEF / 255, blue: 0xF8 / 255)
            }
        } else {
            switch card.role {
            case "cover":
                LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .topLeading, endPoint: .bottomTrailing)
            case "cta":
                LinearGradient(
                    colors: [Color(red: 0xEE / 255, green: 0xF0 / 255, blue: 0xFB / 255), Color(red: 0xDF / 255, green: 0xE3 / 255, blue: 0xFF / 255)],
                    startPoint: .top, endPoint: .bottom
                )
            default:
                Color(red: 0xF7 / 255, green: 0xF8 / 255, blue: 0xFE / 255)
            }
        }
    }

    @ViewBuilder private var content: some View {
        if isPhotoVariant {
            photoVariantContent
        } else {
            textVariantContent
        }
    }

    @ViewBuilder private var photoVariantContent: some View {
        if card.role == "cta" {
            // 로고 마무리 장
            VStack(spacing: 8 * s) {
                if let logo {
                    Image(uiImage: logo)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: 110 * s, maxHeight: 90 * s)
                } else {
                    Text(storeName)
                        .font(.system(size: 19 * s, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .multilineTextAlignment(.center)
                    Rectangle().fill(BUColor.midnight.opacity(0.35)).frame(width: 24 * s, height: 1.5 * s)
                }
                VStack(spacing: 2 * s) {
                    ForEach(Array(card.lines.prefix(2).enumerated()), id: \.offset) { _, line in
                        Text(line)
                            .font(.system(size: 9.5 * s))
                            .foregroundStyle(BUColor.ink.opacity(0.6))
                    }
                }
            }
            .padding(.horizontal, 12 * s)
            .frame(width: W, height: H)
        } else {
            ZStack(alignment: .bottomLeading) {
                if photo == nil {
                    // 사진 자리표시 — 촬영 가이드
                    VStack(spacing: 4 * s) {
                        Text("📷").font(.system(size: 14 * s))
                        Text(card.photoIdea ?? "사진을 넣어주세요")
                            .font(.system(size: 8.5 * s))
                            .foregroundStyle(BUColor.ink.opacity(0.55))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 14 * s)
                    }
                    .frame(width: W - 20 * s, height: H - 20 * s)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8 * s)
                            .strokeBorder(BUColor.midnight.opacity(0.3), style: StrokeStyle(lineWidth: 1.5 * s, dash: [5 * s, 4 * s]))
                    )
                    .frame(width: W, height: H)
                }
                // 하단 그라데이션 + 텍스트 오버레이
                VStack(alignment: .leading, spacing: 3 * s) {
                    Text(card.title)
                        .font(.system(size: (card.role == "cover" ? 15 : 12.5) * s, weight: .heavy))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.35), radius: 3 * s, y: 1 * s)
                    if let first = card.lines.first {
                        Text(first)
                            .font(.system(size: 9 * s))
                            .foregroundStyle(.white.opacity(0.88))
                            .shadow(color: .black.opacity(0.35), radius: 2 * s, y: 1 * s)
                    }
                }
                .padding(.horizontal, 12 * s)
                .padding(.top, 26 * s)
                .padding(.bottom, 18 * s)
                .frame(width: W, alignment: .leading)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.04, green: 0.04, blue: 0.16).opacity(0), Color(red: 0.04, green: 0.04, blue: 0.16).opacity(0.75)],
                        startPoint: .top, endPoint: .bottom
                    )
                )
            }
            .frame(width: W, height: H, alignment: .bottom)
            .overlay(alignment: .topLeading) {
                if card.role == "cover" {
                    Text(storeName)
                        .font(.system(size: 7.5 * s, weight: .bold))
                        .foregroundStyle(.white.opacity(0.9))
                        .shadow(color: .black.opacity(0.3), radius: 2 * s)
                        .padding(12 * s)
                }
            }
        }
    }

    @ViewBuilder private var textVariantContent: some View {
        switch card.role {
        case "cover":
            VStack(alignment: .leading, spacing: 8 * s) {
                highlightedTitle(size: 17, color: .white)
                VStack(alignment: .leading, spacing: 2 * s) {
                    ForEach(Array(card.lines.prefix(2).enumerated()), id: \.offset) { _, line in
                        Text(line).font(.system(size: 9.5 * s)).foregroundStyle(.white.opacity(0.75))
                    }
                }
            }
            .padding(14 * s)
            .frame(width: W, height: H, alignment: .leading)
            .overlay(alignment: .topLeading) {
                Text(storeName)
                    .font(.system(size: 8 * s, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.top, 12 * s)
                    .padding(.leading, 14 * s)
            }
        case "cta":
            VStack(alignment: .leading, spacing: 8 * s) {
                Text(card.title)
                    .font(.system(size: 15 * s, weight: .heavy))
                    .foregroundStyle(BUColor.midnightDeep)
                VStack(alignment: .leading, spacing: 2 * s) {
                    ForEach(Array(card.lines.prefix(3).enumerated()), id: \.offset) { _, line in
                        Text(line).font(.system(size: 9.5 * s)).foregroundStyle(BUColor.ink.opacity(0.7))
                    }
                }
                Text(storeName)
                    .font(.system(size: 11 * s, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.top, 4 * s)
            }
            .padding(14 * s)
            .frame(width: W, height: H, alignment: .leading)
        default:
            VStack(alignment: .leading, spacing: 6 * s) {
                Text(String(format: "%02d", index))
                    .font(.system(size: 9 * s, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Text(card.title)
                    .font(.system(size: 13.5 * s, weight: .heavy))
                    .foregroundStyle(BUColor.midnightDeep)
                Rectangle().fill(BUColor.midnight.opacity(0.2)).frame(width: 22 * s, height: 2 * s)
                VStack(alignment: .leading, spacing: 3 * s) {
                    ForEach(Array(card.lines.prefix(3).enumerated()), id: \.offset) { _, line in
                        Text(line).font(.system(size: 9.5 * s)).foregroundStyle(BUColor.ink.opacity(0.78))
                    }
                }
            }
            .padding(.horizontal, 14 * s)
            .padding(.top, 16 * s)
            .frame(width: W, height: H, alignment: .topLeading)
            .overlay(alignment: .top) {
                Rectangle().fill(BUColor.midnight).frame(height: 4 * s)
            }
        }
    }

    private func highlightedTitle(size: CGFloat, color: Color) -> some View {
        let lavender = Color(red: 0xB9 / 255, green: 0xBB / 255, blue: 0xFF / 255)
        var text = Text(card.title).foregroundColor(color)
        if let hl = card.highlight, card.title.contains(hl), let range = card.title.range(of: hl) {
            let before = String(card.title[card.title.startIndex..<range.lowerBound])
            let after = String(card.title[range.upperBound...])
            text = Text(before).foregroundColor(color) + Text(hl).foregroundColor(lavender) + Text(after).foregroundColor(color)
        }
        return text
            .font(.system(size: size * s, weight: .heavy))
            .lineSpacing(2 * s)
    }

    private var footer: some View {
        VStack {
            Spacer()
            HStack(spacing: 4 * s) {
                ForEach(0..<total, id: \.self) { i in
                    Circle()
                        .fill(onDark
                            ? (i == index ? Color.white : Color.white.opacity(0.4))
                            : (i == index ? BUColor.midnight : BUColor.midnight.opacity(0.25)))
                        .frame(width: (i == index ? 6 : 4) * s, height: (i == index ? 6 : 4) * s)
                }
            }
            .padding(.bottom, 8 * s)
        }
        .frame(width: W, height: H)
        .overlay(alignment: .bottomTrailing) {
            // AI 기본법 생성물 소표기
            Text("AI 제작 보조")
                .font(.system(size: 5 * s))
                .foregroundStyle(onDark ? Color.white.opacity(0.45) : BUColor.ink.opacity(0.35))
                .padding(.trailing, 8 * s)
                .padding(.bottom, 7 * s)
        }
    }
}

// MARK: - 메인 카드

public struct CardNewsStudioCard: View {
    let storeName: String
    let industryCategoryId: String?
    let subIndustryId: String?
    let isOperating: Bool

    public init(storeName: String, industryCategoryId: String?, subIndustryId: String?, isOperating: Bool) {
        self.storeName = storeName
        self.industryCategoryId = industryCategoryId
        self.subIndustryId = subIndustryId
        self.isOperating = isOperating
    }

    @State private var topic = ""
    @State private var cardCount = 4
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var result: CardNewsResponse?
    @State private var photos: [Int: UIImage] = [:]
    @State private var logo: UIImage?
    @State private var photoPickerItem: PhotosPickerItem?
    @State private var photoPickerTarget: Int?      // 선택 중인 장 index (-1 = 로고)
    @State private var editIdx: Int?
    @State private var copied = false
    @State private var shareItems: [UIImage] = []
    @State private var showShare = false

    private var displayStore: String { storeName.isEmpty ? "내 가게" : storeName }
    private var isPhotoVariant: Bool { result?.styleVariant == "photo" }

    private var topicChips: [String] {
        var chips: [String] = []
        if !isOperating { chips.append("곧 오픈! \(displayStore) 미리보기") }
        chips.append(contentsOf: [
            "처음 온 손님 꿀팁 3가지",
            "사장님이 매일 하는 준비 과정",
            "손님들이 자주 묻는 질문 TOP3",
        ])
        if isOperating { chips.append("이번 주 메뉴·이벤트 소개") }
        return Array(chips.prefix(4))
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            inputRow
            chipRow
            if let errorMessage {
                Text(errorMessage)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.danger)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.danger08, in: RoundedRectangle(cornerRadius: 10))
            }
            if let result, result.cards.count >= 3 {
                resultSection(result)
            }
        }
        .padding(16)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(BUColor.midnight.opacity(0.10), lineWidth: 1))
        .photosPicker(isPresented: Binding(get: { photoPickerTarget != nil }, set: { if !$0 { photoPickerTarget = nil } }),
                      selection: $photoPickerItem, matching: .images)
        .onChange(of: photoPickerItem) { _, item in
            guard let item, let target = photoPickerTarget else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                    if target == -1 { logo = img } else { photos[target] = img }
                }
                photoPickerItem = nil
                photoPickerTarget = nil
            }
        }
        #if canImport(UIKit)
        .sheet(isPresented: $showShare) {
            ActivityShareSheet(items: shareItems)
        }
        #endif
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "sparkles")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .frame(width: 30, height: 30)
                .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 9))
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text("카드뉴스 만들기")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("지금 무료 · 9월부터 프로 전용")
                        .font(.system(size: 10.5, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                }
                Text(isPhotoVariant || industryCategoryId == "food" || industryCategoryId == "cafe-dessert"
                     ? "주제만 정하면 인스타 캐러셀 3~5장을 만들어 드려요. 카페·음식점은 사진형(1장 사진+타이틀, 2장~ 사진, 마지막 로고)으로."
                     : "주제만 정하면 인스타 캐러셀용 카드뉴스 3~5장을 만들어 드려요.")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var inputRow: some View {
        HStack(spacing: 8) {
            TextField("예: \(topicChips.first ?? "이번 주 이벤트 소개")", text: $topic)
                .font(.system(size: 13.5))
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color(red: 0xF7 / 255, green: 0xF8 / 255, blue: 0xFE / 255), in: RoundedRectangle(cornerRadius: 11))
            Picker("장수", selection: $cardCount) {
                ForEach([3, 4, 5], id: \.self) { Text("\($0)장").tag($0) }
            }
            .pickerStyle(.menu)
            .tint(BUColor.midnightDeep)
            Button {
                Task { await generate() }
            } label: {
                HStack(spacing: 5) {
                    if loading { ProgressView().tint(.white).scaleEffect(0.7) } else { Image(systemName: "sparkles") }
                    Text(loading ? "만드는 중…" : (result == nil ? "만들기" : "다시"))
                }
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 11))
            }
            .disabled(loading)
        }
    }

    private var chipRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(topicChips, id: \.self) { chip in
                    Button { topic = chip } label: {
                        Text(chip)
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnightDeep)
                            .padding(.horizontal, 11)
                            .padding(.vertical, 6)
                            .background(topic == chip ? BUColor.midnight.opacity(0.06) : Color.clear, in: Capsule())
                            .overlay(Capsule().stroke(topic == chip ? BUColor.midnight : BUColor.midnight.opacity(0.14), lineWidth: 1))
                    }
                }
            }
        }
    }

    @ViewBuilder private func resultSection(_ result: CardNewsResponse) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 10) {
                    ForEach(Array(result.cards.enumerated()), id: \.offset) { i, card in
                        VStack(spacing: 6) {
                            CardNewsCardView(
                                card: card, index: i, total: result.cards.count,
                                storeName: displayStore, isPhotoVariant: isPhotoVariant,
                                photo: photos[i], logo: logo, exportScale: false
                            )
                            cardActions(card: card, index: i)
                        }
                        .frame(width: 216)
                    }
                }
            }
            if let editIdx, editIdx < result.cards.count {
                editForm(index: editIdx)
            }
            captionBlock(result)
            Text("생성형 AI가 만든 초안입니다 — 게시 전 내용을 확인·수정하세요. 이미지에 'AI 제작 보조' 표기가 포함됩니다. 사진은 서버로 전송되지 않아요.")
                .font(.system(size: 10.5))
                .foregroundStyle(BUColor.inkMuted45)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder private func cardActions(card: CardNewsCardModel, index: Int) -> some View {
        HStack(spacing: 4) {
            if isPhotoVariant && card.role != "cta" {
                smallButton(photos[index] == nil ? "사진 넣기" : "사진 교체", emphasized: photos[index] == nil) {
                    photoPickerTarget = index
                }
            }
            if isPhotoVariant && card.role == "cta" {
                smallButton(logo == nil ? "로고 넣기" : "로고 교체", emphasized: false) {
                    photoPickerTarget = -1
                }
            }
            smallButton("수정", emphasized: editIdx == index) {
                editIdx = editIdx == index ? nil : index
            }
            smallButton("저장", emphasized: false) {
                exportAndShare(indices: [index])
            }
        }
    }

    private func smallButton(_ label: String, emphasized: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(emphasized ? BUColor.midnight.opacity(0.06) : Color.clear, in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(emphasized ? BUColor.midnight : BUColor.midnight.opacity(0.14), lineWidth: 1))
        }
    }

    @ViewBuilder private func editForm(index: Int) -> some View {
        if let card = result?.cards[index] {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(index + 1)번째 장 수정")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                TextField("제목", text: Binding(
                    get: { card.title },
                    set: { v in result?.cards[index].title = String(v.prefix(40)) }
                ))
                .font(.system(size: 13, weight: .bold))
                .padding(9)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 9))
                TextField("본문 (줄바꿈으로 구분)", text: Binding(
                    get: { card.lines.joined(separator: "\n") },
                    set: { v in result?.cards[index].lines = v.split(separator: "\n", omittingEmptySubsequences: false).map { String($0.prefix(44)) }.prefix(3).map { $0 } }
                ), axis: .vertical)
                .lineLimit(2...4)
                .font(.system(size: 12.5))
                .padding(9)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 9))
                Text(isPhotoVariant ? "사진형은 글이 짧을수록 좋아요 — 제목 6~12자, 한 줄 20자 이내." : "제목 15자·본문 줄당 22자 이내가 가장 잘 읽혀요.")
                    .font(.system(size: 10.5))
                    .foregroundStyle(BUColor.inkMuted45)
            }
            .padding(12)
            .background(Color(red: 0xF7 / 255, green: 0xF8 / 255, blue: 0xFE / 255).opacity(0.9), in: RoundedRectangle(cornerRadius: 12))
        }
    }

    @ViewBuilder private func captionBlock(_ result: CardNewsResponse) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("캡션 · 해시태그")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Spacer()
                smallButton(copied ? "복사됨" : "복사", emphasized: false) {
                    #if canImport(UIKit)
                    UIPasteboard.general.string = "\(result.caption)\n\n\(result.hashtags.joined(separator: " "))"
                    #endif
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { copied = false }
                }
                Button {
                    exportAndShare(indices: Array(result.cards.indices))
                } label: {
                    Text("전체 저장")
                        .font(.system(size: 11.5, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                }
            }
            Text(result.caption)
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.ink.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)
            Text(result.hashtags.joined(separator: " "))
                .font(.system(size: 12))
                .foregroundStyle(BUColor.midnight)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(BUColor.midnight.opacity(0.10), lineWidth: 1))
    }

    // MARK: - 동작

    private func generate() async {
        loading = true
        errorMessage = nil
        editIdx = nil
        defer { loading = false }
        guard let uid = BUSupabase.shared.client.auth.currentSession?.user.id else {
            errorMessage = "로그인 후 이용할 수 있어요."
            return
        }
        var req = CardNewsRequest()
        req.topic = topic.trimmingCharacters(in: .whitespaces).isEmpty ? nil : topic
        req.cardCount = cardCount
        req.storeName = displayStore
        req.industryCategoryId = industryCategoryId
        req.subIndustryId = subIndustryId
        req.isOperating = isOperating
        do {
            let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
            let resp = try await repo.generateCardNews(req)
            if resp.cards.count < 3 {
                errorMessage = "생성에 실패했어요. 주제를 조금 바꿔 다시 시도해 주세요."
            } else {
                result = resp
                photos = [:]
            }
        } catch {
            errorMessage = "생성에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    /// ImageRenderer 로 1080×1350 렌더 → 공유 시트 (사진 앱 저장 포함)
    @MainActor private func exportAndShare(indices: [Int]) {
        guard let result else { return }
        var images: [UIImage] = []
        for i in indices where i < result.cards.count {
            let view = CardNewsCardView(
                card: result.cards[i], index: i, total: result.cards.count,
                storeName: displayStore, isPhotoVariant: isPhotoVariant,
                photo: photos[i], logo: logo, exportScale: true
            )
            let renderer = ImageRenderer(content: view)
            renderer.scale = 1
            if let ui = renderer.uiImage { images.append(ui) }
        }
        guard !images.isEmpty else { return }
        shareItems = images
        showShare = true
    }
}
