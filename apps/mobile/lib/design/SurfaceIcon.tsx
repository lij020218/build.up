import { Ionicons } from "@expo/vector-icons";
import type { DashboardSurface } from "../navigation/surfaces";

export function SurfaceIcon(props: { surface: DashboardSurface; color: string; size?: number }) {
  const size = props.size ?? 20;
  const iconNameBySurface: Record<DashboardSurface, keyof typeof Ionicons.glyphMap> = {
    home: "home-outline",
    current: "document-text-outline",
    roadmap: "list-outline",
    guides: "book-outline",
    profile: "person-circle-outline",
    analytics: "stats-chart-outline",
    franchise: "storefront-outline",
    marketing: "megaphone-outline"
  };

  return <Ionicons name={iconNameBySurface[props.surface]} size={size} color={props.color} />;
}
