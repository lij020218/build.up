import { Suspense } from "react";
import StarterStageDemo from "./starter-stage-demo";
import { DashboardSkeleton } from "./lib/components/ui/Skeleton";

export default function Page() {
  // ⚠️ 2026-05-11 (사용자 신고: Vercel 배포 사이트 랜딩 페이지가 *배경만 보임*):
  //  종전 fallback 은 빈 div — JS 청크 로딩이 느리거나 실패하면 사장님은 *회색 배경만* 봄.
  //  DashboardSkeleton 으로 교체 — 로드 중에도 카드 윤곽 표시 ("앱이 살아있다" 시각 신호).
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StarterStageDemo surface="home" />
    </Suspense>
  );
}
