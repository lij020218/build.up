import { Suspense } from "react";
import StarterStageDemo from "../starter-stage-demo";
import { DashboardSkeleton } from "../lib/components/ui/Skeleton";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StarterStageDemo surface="analytics" />
    </Suspense>
  );
}
