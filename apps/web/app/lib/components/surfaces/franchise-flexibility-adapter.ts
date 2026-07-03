import {
  FRANCHISE_INTERIOR_DATA,
  type FranchiseInteriorData,
} from "../stages/offline/franchise-interior-data";

export type FranchiseFlexibility = FranchiseInteriorData["flexibility"];

type FranchiseFlexibilityInput = {
  franchiseInteriorData?: Record<string, Pick<FranchiseInteriorData, "flexibility"> | undefined>;
  selectedFranchiseBrandId: string | null | undefined;
  stageCode: string;
  startupType: string | null | undefined;
};

export function getSelectedFranchiseFlexibility({
  franchiseInteriorData = FRANCHISE_INTERIOR_DATA,
  selectedFranchiseBrandId,
  stageCode,
  startupType,
}: FranchiseFlexibilityInput): FranchiseFlexibility | undefined {
  if (stageCode !== "construction_setup" || startupType !== "franchise" || !selectedFranchiseBrandId) {
    return undefined;
  }

  return franchiseInteriorData[selectedFranchiseBrandId]?.flexibility;
}
