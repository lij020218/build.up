//
//  OwnerProfileSyncRepository.swift — 사장님 프로필 PII 봉투암호화 서버 동기화.
//
//  웹 SSOT: /api/account/owner-profile (GET=복원·POST=저장)
//
//  로컬(UserDefaults "owner.*") ↔ 서버(user_store_data.owner_profile_enc, 봉투암호화) 동기화.
//  - load(): 서버 복호화값 → UserDefaults hydrate (기기 전환·재설치 대응).
//  - save(): 현재 UserDefaults → 서버 암호화 저장.
//
//  ⚠️ 서버 KEK 미설정 시 load=204(조용히 skip), save=503(무시). 로컬값은 항상 유지됨.
//

import Foundation
import Supabase

public actor OwnerProfileSyncRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
    }

    // MARK: - Public API

    /// 서버에서 복호화된 프로필 → UserDefaults 에 hydrate.
    /// 서버에 값이 없거나 KEK 미설정이면 조용히 skip (로컬값 유지).
    public func load() async {
        guard let token = try? await supabase.auth.session.accessToken else { return }
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/account/owner-profile"))
        req.httpMethod = "GET"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.timeoutInterval = 10

        guard let (data, res) = try? await URLSession.shared.data(for: req),
              let http = res as? HTTPURLResponse, http.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let profile = json["profile"] as? [String: Any]
        else { return }

        let defaults = UserDefaults.standard
        if let y = profile["birthYear"] as? Int, y >= 1900 {
            defaults.set(y, forKey: "owner.birthYear")
        }
        if let n = profile["ncbScore"] as? Int, n > 0 {
            defaults.set(n, forKey: "owner.ncbScore")
        }
        if let c = profile["consideringClosure"] as? Bool {
            defaults.set(c, forKey: "owner.consideringClosure")
        }
        if let d = profile["isDisabledOwner"] as? Bool {
            defaults.set(d, forKey: "owner.isDisabledOwner")
        }
    }

    /// 현재 UserDefaults → 서버 봉투암호화 저장. fire-and-forget 용도 (에러 무시).
    public func save() async {
        guard let token = try? await supabase.auth.session.accessToken else { return }

        let defaults = UserDefaults.standard
        var body: [String: Any] = [:]
        let birthYear = defaults.integer(forKey: "owner.birthYear")
        if birthYear >= 1900 { body["birthYear"] = birthYear }
        let ncb = defaults.integer(forKey: "owner.ncbScore")
        if ncb > 0 { body["ncbScore"] = ncb }
        body["consideringClosure"] = defaults.bool(forKey: "owner.consideringClosure")
        body["isDisabledOwner"] = defaults.bool(forKey: "owner.isDisabledOwner")

        guard !body.isEmpty,
              let bodyData = try? JSONSerialization.data(withJSONObject: body)
        else { return }

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/account/owner-profile"))
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = bodyData
        req.timeoutInterval = 10

        _ = try? await URLSession.shared.data(for: req)
    }
}
