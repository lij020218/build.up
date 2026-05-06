import { Suspense } from "react";
import StarterStageDemo from "../starter-stage-demo";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f5f5f7" }} />}>
      <StarterStageDemo surface="reports" />
    </Suspense>
  );
}
