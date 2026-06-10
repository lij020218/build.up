import { Suspense } from "react";
import StarterStageDemo from "../starter-stage-demo";
import { DashboardSkeleton } from "../lib/components/ui/Skeleton";

export default function RoadmapPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StarterStageDemo surface="roadmap" />
    </Suspense>
  );
}
