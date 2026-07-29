//
//  PostcodeSearchSheet.swift — 다음(카카오) 우편번호 검색 시트 (2026-07-28)
//
//  웹 /postcode 임베드 페이지(WKWebView) + postcode 메시지 브리지.
//  웹 DaumPostcodeModal 과 동일 서비스 — 무료·키 불요. 온보딩 ② 주소 필드용.
//

import SwiftUI
import WebKit
import FoundOneData

struct PostcodeSearchSheet: UIViewRepresentable {
    let onSelect: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onSelect: onSelect) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "postcode")
        let webView = WKWebView(frame: .zero, configuration: config)
        let url = BUSupabase.shared.env.webAppURL.appendingPathComponent("postcode")
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "postcode")
    }

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let onSelect: (String) -> Void
        init(onSelect: @escaping (String) -> Void) { self.onSelect = onSelect }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "postcode", let addr = message.body as? String, !addr.isEmpty else { return }
            onSelect(addr)
        }
    }
}
