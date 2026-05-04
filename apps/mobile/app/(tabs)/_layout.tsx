import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useLanguage } from "../../lib/language-provider";
import { SurfaceIcon, colors, radii, shadows } from "../../lib/design";
import type { DashboardSurface } from "../../lib/navigation/surfaces";

export default function TabsLayout() {
  const { language } = useLanguage();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#8E98A4",
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 10,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.72)",
          borderRadius: radii.xl,
          backgroundColor: "rgba(255,255,255,0.9)",
          ...shadows.floatingNav
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.1
        },
        tabBarIcon: ({ focused }) => (
          <SurfaceIcon
            surface={route.name as DashboardSurface}
            color={focused ? colors.primary : "#8E98A4"}
          />
        )
      })}
    >
      <Tabs.Screen
        name="home"
        options={{ title: language === "ko" ? "홈" : "Home" }}
      />
      <Tabs.Screen
        name="current"
        options={{ title: language === "ko" ? "현재 단계" : "Current" }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{ title: language === "ko" ? "로드맵" : "Roadmap" }}
      />
      <Tabs.Screen
        name="guides"
        options={{ title: language === "ko" ? "가이드" : "Guides" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: language === "ko" ? "내 정보" : "Profile" }}
      />
    </Tabs>
  );
}
