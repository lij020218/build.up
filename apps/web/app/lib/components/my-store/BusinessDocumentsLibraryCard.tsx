"use client";

/**
 * BusinessDocumentsLibraryCard — 사장님 사업 서류 중앙 라이브러리.
 *
 *  ── 통합 전략 ───────────────────────────────────────────
 *  3-layer 통합 모델 (2026-05-12 P1 #13):
 *    Layer 1 — Data SSOT: store-info-store.businessDocuments
 *    Layer 2 — 중앙 라이브러리: 이 컴포넌트 (내 가게 페이지)
 *    Layer 3 — 단계별 inline trigger: BusinessDocumentUpload (registration-setup 등)
 *
 *  3개 grouping (사업·세무 / 영업 인허가 / 인증·IP) 으로 사장님이 자주 찾는 순서대로 표시.
 *
 *  Layer 2 + 3 가 같은 데이터 SSOT 를 공유하므로, 어디서 업로드해도 양쪽에 즉시 반영.
 *  ─────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { FileText, Calendar, AlertTriangle } from "lucide-react";
import { useStoreInfoStore, type BusinessDocumentKind } from "../../stores/store-info-store";
import { BusinessDocumentUpload } from "./BusinessDocumentUpload";

const MIDNIGHT = "#191970";

type DocumentEntry = {
  kind: BusinessDocumentKind;
  labelKo: string;
  labelEn: string;
  hintKo: string;
  hintEn: string;
  /** 일반적으로 여러 개 가능한 종류 (예: 상표 여러 건) */
  multiple?: boolean;
  /** 일반적으로 만료가 있는 서류 (예: 위생교육 1년·보건증 1년) */
  hasExpiry?: boolean;
};

type DocumentGroup = {
  id: string;
  titleKo: string;
  titleEn: string;
  documents: DocumentEntry[];
};

/**
 * 카테고리별 표준 서류 — 한국 SMB 가 발급 받는 핵심 서류 14종 정도.
 * 사장님 업종 무관 모두 표시 — 본인 업종에 해당하는 것만 채우면 됨.
 */
const DOCUMENT_GROUPS: DocumentGroup[] = [
  {
    id: "biz-tax",
    titleKo: "사업·세무",
    titleEn: "Business & Tax",
    documents: [
      { kind: "biz-registration", labelKo: "사업자등록증", labelEn: "Business Registration Certificate", hintKo: "홈택스에서 발급 (5분·무료)", hintEn: "HomeTax (free, 5min)" },
      { kind: "venture-cert", labelKo: "벤처기업 확인서", labelEn: "Venture Certification", hintKo: "벤처인증 후 발급 — 법인세 50% 감면 자격 증빙", hintEn: "Post-venture-cert — for 50% corp tax cut" },
    ],
  },
  {
    id: "operating-permits",
    titleKo: "영업 인허가",
    titleEn: "Operating Permits",
    documents: [
      { kind: "biz-report-food", labelKo: "영업신고증 (음식점)", labelEn: "Food Service Permit", hintKo: "구청 위생과 발급 — 인테리어 완성 후 신청", hintEn: "Sanitation dept, post-construction" },
      { kind: "biz-report-pet", labelKo: "동물미용업 등록증", labelEn: "Pet Grooming Registration", hintKo: "시·군·구청 축산과 발급", hintEn: "Livestock dept" },
      { kind: "biz-report-beauty", labelKo: "미용업 영업신고증", labelEn: "Beauty Salon Permit", hintKo: "구청 위생과 발급 (공중위생관리법)", hintEn: "Sanitation dept (Hygiene Mgmt Act)" },
      { kind: "telecom-sales", labelKo: "통신판매업 신고증", labelEn: "Telecom Sales Filing", hintKo: "온라인 판매자 필수 — 정부24 신고", hintEn: "Mandatory for online sellers" },
      { kind: "fire-safety", labelKo: "소방완비증명서", labelEn: "Fire Safety Certificate", hintKo: "지하 66㎡↑ / 2층 100㎡↑ 매장 필수", hintEn: "Required for basement 66㎡+ / floor 2+ 100㎡+" },
    ],
  },
  {
    id: "hygiene-staff",
    titleKo: "직원·위생",
    titleEn: "Staff & Hygiene",
    documents: [
      { kind: "hygiene-cert", labelKo: "위생교육 수료증", labelEn: "Hygiene Education Certificate", hintKo: "한국외식업중앙회 6시간 (신규 영업자)", hintEn: "KFIA 6h (new operators)", hasExpiry: true },
      { kind: "health-cert", labelKo: "보건증 (건강진단결과서)", labelEn: "Health Certificate", hintKo: "보건소 발급 (장티푸스·결핵·파라티푸스 검사)", hintEn: "Health center (TB/typhoid)", hasExpiry: true, multiple: true },
    ],
  },
  {
    id: "ip-brand",
    titleKo: "인증·IP",
    titleEn: "Cert & IP",
    documents: [
      { kind: "trademark", labelKo: "상표등록증", labelEn: "Trademark Certificate", hintKo: "특허로 출원 → 6-12개월 후 등록", hintEn: "patent.go.kr → 6-12mo to register", multiple: true },
      { kind: "patent", labelKo: "특허증", labelEn: "Patent Certificate", hintKo: "특허로 출원 → 1-2년 후 등록", hintEn: "Patent registration", multiple: true },
    ],
  },
];

type Props = {
  ko: boolean;
};

export function BusinessDocumentsLibraryCard({ ko }: Props) {
  const documents = useStoreInfoStore((s) => s.businessDocuments);

  // 통계 — 사장님이 한눈에 본인 진행 상태 파악
  const stats = useMemo(() => {
    const totalKinds = DOCUMENT_GROUPS.reduce((s, g) => s + g.documents.length, 0);
    const filledKinds = new Set(documents.map((d) => d.kind));
    const filledCount = DOCUMENT_GROUPS.reduce(
      (s, g) => s + g.documents.filter((d) => filledKinds.has(d.kind)).length,
      0,
    );
    // 만료 임박 (30일 이내) — hasExpiry 서류 추적
    const now = Date.now();
    const expiringSoon = documents.filter((d) => {
      if (!d.expiresAt) return false;
      const ms = new Date(d.expiresAt).getTime() - now;
      return ms > 0 && ms < 30 * 24 * 3600 * 1000;
    }).length;
    const expired = documents.filter((d) => {
      if (!d.expiresAt) return false;
      return new Date(d.expiresAt).getTime() < now;
    }).length;
    return { totalKinds, filledCount, total: documents.length, expiringSoon, expired };
  }, [documents]);

  return (
    <section style={{
      background: "white",
      borderRadius: 18,
      border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
      padding: "22px 24px",
      display: "flex", flexDirection: "column" as const, gap: 18,
    }}>
      {/* 헤더 + 통계 */}
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(25,25,112,0.08)", color: MIDNIGHT,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={16} strokeWidth={1.8} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 2 }}>
              {ko ? "사업 서류 라이브러리" : "Business Documents"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {ko ? "내 가게 서류 한 곳에 보관" : "All your business documents"}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginLeft: 42 }}>
          {ko
            ? "사업자등록증·영업신고증·위생교육 수료증·상표등록증 등 사장님이 발급 받은 모든 서류를 한 곳에서 보관·재발급 대응. PDF/JPG/PNG 업로드 (최대 10MB)."
            : "Store all your issued documents (biz registration, operating permits, hygiene certs, trademarks) in one place. PDF/JPG/PNG up to 10MB."}
        </div>

        {/* 통계 칩 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 14 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(25,25,112,0.06)", color: MIDNIGHT,
            fontSize: 12, fontWeight: 700,
          }}>
            {ko ? `${stats.filledCount}/${stats.totalKinds} 항목 채움` : `${stats.filledCount}/${stats.totalKinds} filled`}
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(5,150,105,0.08)", color: "#059669",
            fontSize: 12, fontWeight: 700,
          }}>
            {ko ? `${stats.total}건 보관` : `${stats.total} stored`}
          </span>
          {stats.expiringSoon > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 999,
              background: "rgba(217,119,6,0.08)", color: "#d97706",
              fontSize: 12, fontWeight: 700,
            }}>
              <Calendar size={11} strokeWidth={2} />
              {ko ? `${stats.expiringSoon}건 30일 내 만료` : `${stats.expiringSoon} expiring soon`}
            </span>
          )}
          {stats.expired > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 999,
              background: "rgba(220,38,38,0.08)", color: "#dc2626",
              fontSize: 12, fontWeight: 700,
            }}>
              <AlertTriangle size={11} strokeWidth={2} />
              {ko ? `${stats.expired}건 만료` : `${stats.expired} expired`}
            </span>
          )}
        </div>
      </header>

      {/* 그룹별 서류 */}
      {DOCUMENT_GROUPS.map((group) => (
        <div key={group.id}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: MIDNIGHT, opacity: 0.8,
            letterSpacing: "0.05em", textTransform: "uppercase" as const,
            marginBottom: 10,
          }}>
            {ko ? group.titleKo : group.titleEn}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {group.documents.map((entry) => (
              <BusinessDocumentUpload
                key={entry.kind}
                ko={ko}
                kind={entry.kind}
                label={ko ? entry.labelKo : entry.labelEn}
                hint={ko ? entry.hintKo : entry.hintEn}
                multiple={entry.multiple}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 안내 */}
      <div style={{
        padding: "12px 14px", borderRadius: 12,
        background: "linear-gradient(180deg, rgba(25,25,112,0.04) 0%, rgba(255,255,255,0.96) 100%)",
        border: "1px solid rgba(25,25,112,0.10)",
        fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6,
      }}>
        {ko
          ? "📌 단계 진행 중에도 해당 단계의 「이 서류 업로드」 카드에서 바로 업로드 가능 — 이 라이브러리와 자동 동기화됩니다."
          : "📌 You can also upload from each stage's inline trigger — auto-syncs with this library."}
      </div>
    </section>
  );
}
