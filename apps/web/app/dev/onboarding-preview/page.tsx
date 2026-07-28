"use client";

/**
 * /dev/onboarding-preview — 기존 사업자 온보딩 디자인 검증 전용 (dev 빌드에서만 렌더).
 *   세션 없이 5화면+진단을 실렌더로 밟아보기 위한 페이지 — 저장·전환 없음(onComplete 는 콘솔만).
 *   prod 에서는 404. (실렌더 검증법: 업종별 분기 대조 — SaaS vs 카페)
 */
import { notFound } from "next/navigation";
import { ExistingBusinessOnboarding } from "../../lib/components/ExistingBusinessOnboarding";

export default function OnboardingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ minHeight: "100vh", background: "#f4f2fa" }}>
      <ExistingBusinessOnboarding
        language="ko"
        onComplete={(r) => console.log("[onboarding-preview] complete:", r)}
        onBack={() => console.log("[onboarding-preview] back")}
      />
    </div>
  );
}
