export type CurrentStageDefaultSectionKind =
  | "launch_cta"
  | "launched_analytics"
  | "starter_summary";

export function getCurrentStageDefaultSectionKind({
  businessLaunched,
  completedStageIds,
}: {
  businessLaunched: boolean;
  completedStageIds: string[];
}): CurrentStageDefaultSectionKind {
  if (!businessLaunched && completedStageIds.includes("pre-launch-final")) {
    return "launch_cta";
  }

  if (businessLaunched) {
    return "launched_analytics";
  }

  return "starter_summary";
}
