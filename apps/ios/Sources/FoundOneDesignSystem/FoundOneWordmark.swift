//  FoundOneWordmark.swift — "FOUND.ONE" 워드마크(공식 로고 서체).
//  웹 FoundOneWordmark.tsx 와 동일 SSOT: 사장님 제공 SVG(래스터 자동추적) 기반이되,
//  추적이 깨뜨린 "F"(중간 가로바 누락)를 정식 F 글리프로 보정(2026-07-14).
//  · 경로는 M/L/Z(직선)만 → Canvas 로 파싱해 벡터·해상도 독립 렌더.
//  · 글자 fill = color(기본 ink), even-odd 채움(O·D·A 구멍 보존). "." 은 마크색 액센트.
//  · 웹과 픽셀 동일한 좌표계(viewBox 172 50 582 54).
import SwiftUI

public struct FoundOneWordmark: View {
    private let height: CGFloat
    private let color: Color
    private let dotColor: Color

    public init(height: CGFloat = 20,
                color: Color = BUColor.ink,
                dotColor: Color = BUColor.midnightInk) {
        self.height = height
        self.color = color
        self.dotColor = dotColor
    }

    // viewBox (웹과 동일): x 172, y 50, w 582, h 54.
    private static let vbX: CGFloat = 172
    private static let vbY: CGFloat = 50
    private static let vbW: CGFloat = 582
    private static let vbH: CGFloat = 54
    private static var aspect: CGFloat { vbW / vbH }

    public var body: some View {
        Canvas { context, size in
            let sx = size.width / Self.vbW
            let sy = size.height / Self.vbH
            let letters = Self.buildPath(Self.letterF + " " + Self.lettersRest, sx: sx, sy: sy)
            let dot = Self.buildPath(Self.dotPath, sx: sx, sy: sy)
            context.fill(letters, with: .color(color), style: FillStyle(eoFill: true))
            context.fill(dot, with: .color(dotColor), style: FillStyle(eoFill: true))
        }
        .frame(width: height * Self.aspect, height: height)
        .accessibilityLabel("Found.One")
    }

    /// M/L/Z(절대좌표) 전용 파서 → viewBox 원점 보정 후 스케일.
    private static func buildPath(_ d: String, sx: CGFloat, sy: CGFloat) -> Path {
        var path = Path()
        let tokens = d.split(whereSeparator: { $0 == " " || $0 == "\n" })
        var i = 0
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: (x - vbX) * sx, y: (y - vbY) * sy)
        }
        while i < tokens.count {
            let cmd = tokens[i]
            switch cmd {
            case "M":
                if i + 2 < tokens.count,
                   let x = Double(tokens[i + 1]), let y = Double(tokens[i + 2]) {
                    path.move(to: pt(CGFloat(x), CGFloat(y)))
                }
                i += 3
            case "L":
                if i + 2 < tokens.count,
                   let x = Double(tokens[i + 1]), let y = Double(tokens[i + 2]) {
                    path.addLine(to: pt(CGFloat(x), CGFloat(y)))
                }
                i += 3
            case "Z", "z":
                path.closeSubpath()
                i += 1
            default:
                i += 1
            }
        }
        return path
    }

    // F (보정): 상단바 + 중간바 + 좌측 스템.
    private static let letterF =
        "M 177 54 L 227 54 L 227 60 L 183 60 L 183 72 L 217 72 L 217 78 L 183 78 L 183 98 L 177 98 Z"
    // O U N D O N E (원본 추적 그대로 — F 만 위에서 교체). 웹 LETTERS_REST 와 동일.
    private static let lettersRest =
        "M 700 73 L 700 98 L 750 98 L 750 93 L 749 92 L 707 92 L 706 91 L 706 80 L 708 78 L 744 78 L 744 73 L 743 72 L 701 72 Z M 250 64 L 252 62 L 253 62 L 254 61 L 255 61 L 256 60 L 284 60 L 285 61 L 287 61 L 291 65 L 291 67 L 292 68 L 292 85 L 291 86 L 291 87 L 290 88 L 290 89 L 289 90 L 288 90 L 286 92 L 255 92 L 254 91 L 253 91 L 249 87 L 249 84 L 248 83 L 248 69 L 249 68 L 249 66 L 250 65 Z M 700 55 L 700 60 L 750 60 L 750 55 L 749 54 L 701 54 Z M 629 55 L 629 98 L 635 98 L 635 62 L 636 61 L 662 87 L 663 87 L 674 98 L 683 98 L 683 54 L 678 54 L 677 55 L 677 90 L 676 91 L 656 71 L 655 71 L 638 54 L 630 54 Z M 559 61 L 559 62 L 558 63 L 558 64 L 557 65 L 557 87 L 558 88 L 558 90 L 559 91 L 559 92 L 563 96 L 564 96 L 565 97 L 566 97 L 567 98 L 602 98 L 603 97 L 605 97 L 607 95 L 608 95 L 608 94 L 611 91 L 611 89 L 612 88 L 612 85 L 613 84 L 613 82 L 612 81 L 612 79 L 613 78 L 613 69 L 612 68 L 612 64 L 611 63 L 611 62 L 609 60 L 609 59 L 607 57 L 606 57 L 605 56 L 604 56 L 603 55 L 601 55 L 600 54 L 569 54 L 568 55 L 566 55 L 565 56 L 564 56 Z M 459 55 L 459 60 L 497 60 L 498 61 L 500 61 L 501 62 L 502 62 L 504 64 L 504 65 L 505 66 L 505 68 L 506 69 L 506 84 L 505 85 L 505 87 L 501 91 L 500 91 L 499 92 L 466 92 L 465 91 L 465 80 L 459 80 L 459 98 L 501 98 L 502 97 L 504 97 L 506 95 L 507 95 L 509 93 L 509 92 L 510 91 L 510 90 L 511 89 L 511 86 L 512 85 L 512 67 L 511 66 L 511 63 L 509 61 L 509 60 L 506 57 L 505 57 L 504 56 L 503 56 L 502 55 L 500 55 L 499 54 L 460 54 Z M 387 55 L 387 98 L 393 98 L 393 62 L 394 61 L 406 73 L 407 73 L 432 98 L 441 98 L 442 97 L 441 96 L 441 95 L 442 94 L 442 55 L 441 54 L 436 54 L 435 55 L 435 90 L 434 91 L 403 60 L 402 60 L 399 57 L 399 56 L 398 55 L 397 55 L 396 54 L 388 54 Z M 315 55 L 315 86 L 316 87 L 316 89 L 317 90 L 317 91 L 319 93 L 319 94 L 320 94 L 322 96 L 323 96 L 324 97 L 325 97 L 326 98 L 357 98 L 358 97 L 360 97 L 363 94 L 364 94 L 364 93 L 366 91 L 366 90 L 367 89 L 367 87 L 368 86 L 368 54 L 362 54 L 362 84 L 361 85 L 361 87 L 357 91 L 356 91 L 355 92 L 328 92 L 327 91 L 326 91 L 322 87 L 322 85 L 321 84 L 321 55 L 320 54 L 316 54 Z M 244 61 L 244 62 L 243 63 L 243 66 L 242 67 L 242 86 L 243 87 L 243 89 L 244 90 L 244 91 L 245 92 L 245 93 L 247 95 L 248 95 L 250 97 L 252 97 L 253 98 L 288 98 L 289 97 L 290 97 L 291 96 L 292 96 L 296 92 L 296 91 L 297 90 L 297 88 L 298 87 L 298 66 L 297 65 L 297 63 L 296 62 L 296 61 L 291 56 L 290 56 L 289 55 L 286 55 L 285 54 L 255 54 L 254 55 L 251 55 L 250 56 L 249 56 Z"
    private static let dotPath =
        "M 532 88 L 529 91 L 529 97 L 531 99 L 537 99 L 539 97 L 539 96 L 540 95 L 540 92 L 539 91 L 539 90 L 538 89 L 537 89 L 536 88 Z"
}
