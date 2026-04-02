export type BusinessCategory =
  | "food"
  | "cafe-dessert"
  | "retail"
  | "beauty"
  | "fitness"
  | "education"
  | "pet"
  | "living-service"
  | "space"
  | "online-digital";

export type BusinessContext = {
  categoryId: BusinessCategory | null;
  /** Delivery platforms (배달의민족, 쿠팡이츠, 요기요) are relevant */
  isDeliveryRelevant: boolean;
  /** Online store / e-commerce — show platform fees + courier services */
  isOnlineStore: boolean;
  /** Appointment / reservation-based service (beauty, fitness, pet, living-service) */
  isServiceBusiness: boolean;
  /** Recurring membership / subscription revenue (fitness, education, space) */
  isRecurringRevenue: boolean;
  /** Physical inventory management is needed (food, cafe, retail, pet) */
  hasPhysicalInventory: boolean;
};

export function resolveBusinessContext(categoryId: string | null | undefined): BusinessContext {
  const id = (categoryId ?? null) as BusinessCategory | null;

  return {
    categoryId: id,
    isDeliveryRelevant: id === "food" || id === "cafe-dessert",
    isOnlineStore: id === "online-digital",
    isServiceBusiness: id === "beauty" || id === "fitness" || id === "pet" || id === "living-service",
    isRecurringRevenue: id === "fitness" || id === "education" || id === "space",
    hasPhysicalInventory: id === "food" || id === "cafe-dessert" || id === "retail" || id === "pet",
  };
}
