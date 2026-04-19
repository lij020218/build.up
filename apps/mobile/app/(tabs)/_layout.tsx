import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../language-provider";

function TabIcon(props: { name: "home" | "current" | "roadmap" | "guides" | "profile"; focused: boolean }) {
  const tint = props.focused ? "#075E66" : "#8E98A4";

  if (props.name === "home") {
    return (
      <View style={tabIconStyles.frame}>
        <View style={[tabIconStyles.houseRoof, { borderBottomColor: tint }]} />
        <View style={[tabIconStyles.houseBody, { borderColor: tint }]} />
      </View>
    );
  }

  if (props.name === "current") {
    return (
      <View style={[tabIconStyles.frame, tabIconStyles.docFrame, { borderColor: tint }]}>
        <View style={[tabIconStyles.docLine, { backgroundColor: tint }]} />
        <View style={[tabIconStyles.docLineShort, { backgroundColor: tint }]} />
      </View>
    );
  }

  if (props.name === "roadmap") {
    return (
      <View style={tabIconStyles.frame}>
        <View style={tabIconStyles.roadmapRow}>
          <View style={[tabIconStyles.dot, { backgroundColor: tint }]} />
          <View style={[tabIconStyles.line, { backgroundColor: tint }]} />
        </View>
        <View style={tabIconStyles.roadmapRow}>
          <View style={[tabIconStyles.dot, { backgroundColor: tint }]} />
          <View style={[tabIconStyles.line, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }

  if (props.name === "guides") {
    return (
      <View style={[tabIconStyles.frame, tabIconStyles.docFrame, { borderColor: tint }]}>
        <View style={[tabIconStyles.docLine, { backgroundColor: tint }]} />
        <View style={[tabIconStyles.docLine, { backgroundColor: tint }]} />
        <View style={[tabIconStyles.docLineShort, { backgroundColor: tint }]} />
      </View>
    );
  }

  return (
    <View style={tabIconStyles.frame}>
      <View style={[tabIconStyles.profileHead, { borderColor: tint }]} />
      <View style={[tabIconStyles.profileBody, { borderColor: tint }]} />
    </View>
  );
}

export default function TabsLayout() {
  const { language } = useLanguage();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#075E66",
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
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.94)",
          shadowColor: "#101820",
          shadowOpacity: 0.09,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.1
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name as "home" | "current" | "roadmap" | "guides" | "profile"}
            focused={focused}
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

const tabIconStyles = StyleSheet.create({
  frame: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  houseRoof: {
    width: 12,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: 1
  },
  houseBody: {
    width: 11,
    height: 8,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderRadius: 2
  },
  docFrame: {
    width: 14,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    gap: 2,
    paddingTop: 4,
    paddingHorizontal: 3
  },
  docLine: {
    height: 1.5,
    borderRadius: 999,
    width: "100%"
  },
  docLineShort: {
    height: 1.5,
    borderRadius: 999,
    width: "70%"
  },
  roadmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginVertical: 1
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999
  },
  line: {
    width: 11,
    height: 1.5,
    borderRadius: 999
  },
  profileHead: {
    width: 7,
    height: 7,
    borderWidth: 1.5,
    borderRadius: 999
  },
  profileBody: {
    width: 12,
    height: 7,
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderRadius: 999,
    marginTop: 1
  }
});
