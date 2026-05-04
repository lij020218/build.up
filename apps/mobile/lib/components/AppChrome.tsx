import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SurfaceIcon, colors, radii, shadows } from "../design";
import type { DashboardSurface } from "../navigation/surfaces";

export type SurfaceTabItem = {
  id: DashboardSurface;
  label: string;
};

export function AppHeader(props: {
  language: "ko" | "en";
  showProgress: boolean;
  progressPercent: number;
}) {
  return (
    <View style={styles.appBar}>
      <View style={styles.brandLockup}>
        <LinearGradient
          colors={[colors.primary, colors.aurora2, colors.aurora3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandMark}
        >
          <Text style={styles.brandMarkText}>b</Text>
        </LinearGradient>
        <View>
          <Text style={styles.brandText}>Build.UP</Text>
          <Text style={styles.brandSubText}>
            {props.language === "ko" ? "창업 로드맵 OS" : "Startup roadmap OS"}
          </Text>
        </View>
      </View>
      {props.showProgress ? (
        <View style={styles.progressPill}>
          <Text style={styles.progressPillValue}>{props.progressPercent}%</Text>
          <Text style={styles.progressPillLabel}>{props.language === "ko" ? "진행" : "done"}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function HeroIntro(props: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>build.up</Text>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
    </View>
  );
}

export function SurfaceSwitcher(props: {
  tabs: SurfaceTabItem[];
  activeSurface: DashboardSurface;
  onSelect: (surface: DashboardSurface) => void;
}) {
  return (
    <View style={styles.section}>
      <BlurView intensity={42} tint="light" style={styles.surfaceNav}>
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.84)", "rgba(255,255,255,0.56)"]}
          style={StyleSheet.absoluteFill}
        />
        {props.tabs.map((tab) => {
          const active = props.activeSurface === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => props.onSelect(tab.id)}
              style={[styles.surfaceNavButton, active && styles.surfaceNavButtonSelected]}
            >
              <SurfaceIcon
                surface={tab.id}
                color={active ? colors.primary : colors.muted}
                size={16}
              />
              <Text style={[styles.surfaceNavButtonText, active && styles.surfaceNavButtonTextSelected]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  appBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingRight: 92
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    ...shadows.primaryButton
  },
  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101820",
    letterSpacing: -0.2
  },
  brandSubText: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#637083"
  },
  progressPill: {
    minWidth: 58,
    minHeight: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(29,53,87,0.12)",
    backgroundColor: "rgba(29,53,87,0.07)"
  },
  progressPillValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 18
  },
  progressPillLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#637083",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  hero: {
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: colors.primary
  },
  title: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "700",
    letterSpacing: -1.1,
    color: "#101820"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#637083"
  },
  surfaceNav: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    padding: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.58)",
    overflow: "hidden",
    ...shadows.glassCard
  },
  surfaceNavButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  surfaceNavButtonSelected: {
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.84)"
  },
  surfaceNavButtonText: {
    fontSize: 14,
    color: "#637083"
  },
  surfaceNavButtonTextSelected: {
    color: colors.primary,
    fontWeight: "600"
  }
});
