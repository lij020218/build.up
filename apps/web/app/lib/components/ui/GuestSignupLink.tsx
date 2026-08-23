"use client";

/**
 * GuestSignupLink — 둘러보기(게스트) 모드에서 "가입 필요" 지점에 놓는 안내 행 SSOT.
 *
 * iOS 심사 5.1.1(v) 대응 게스트 모드(/browse)와 게스트가 렌더하는 surface 들이 공유.
 * 인증이 필요한 기능·개인화 데이터 자리에는 가짜 값 대신 이 행을 노출한다
 * (가짜 숫자 금지 원칙 — project_dashboard_honesty_2026_06_04).
 */

import { ArrowRight } from "lucide-react";

const MIDNIGHT = "#191970";

export function GuestSignupLink({
  label,
  compact = false,
}: {
  /** 안내 문구 (예: "내 가게 기준으로 보려면 가입하세요"). */
  label: string;
  /** true 면 카드 없이 한 줄 링크만. */
  compact?: boolean;
}) {
  const inner = (
    <a
      href="/auth"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 700,
        color: MIDNIGHT,
        textDecoration: "none",
      }}
    >
      {label}
      <ArrowRight size={13} strokeWidth={2.2} />
    </a>
  );

  if (compact) return inner;

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: "rgba(25,25,112,0.04)",
        border: "1px dashed rgba(25,25,112,0.18)",
      }}
    >
      {inner}
    </div>
  );
}
