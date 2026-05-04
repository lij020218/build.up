import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "./tokens";

export function AuroraBackground(props: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, "#fbfaf7", colors.background]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(247,246,243,0.95)",
          "rgba(247,246,243,0.78)",
          "rgba(29,53,87,0.16)",
          "rgba(69,123,157,0.16)",
          "rgba(168,218,220,0.24)",
          "rgba(224,240,255,0.30)",
          "rgba(247,246,243,0.86)"
        ]}
        locations={[0, 0.18, 0.34, 0.48, 0.62, 0.76, 1]}
        start={{ x: 0.05, y: 0.08 }}
        end={{ x: 1, y: 0.92 }}
        style={[styles.auroraSheet, styles.auroraSheetPrimary]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0)",
          "rgba(69,123,157,0.13)",
          "rgba(168,218,220,0.20)",
          "rgba(255,255,255,0)"
        ]}
        locations={[0, 0.38, 0.64, 1]}
        start={{ x: 0.02, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.auroraSheet, styles.auroraSheetSecondary]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.56)", "rgba(247,246,243,0.72)", "rgba(247,246,243,0.30)"]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden"
  },
  auroraSheet: {
    position: "absolute",
    width: "135%",
    height: "62%",
    borderRadius: 260
  },
  auroraSheetPrimary: {
    position: "absolute",
    top: -56,
    left: -86,
    opacity: 0.96,
    transform: [{ rotate: "18deg" }, { scaleX: 1.08 }]
  },
  auroraSheetSecondary: {
    position: "absolute",
    top: 250,
    right: -150,
    opacity: 0.72,
    transform: [{ rotate: "-24deg" }, { scaleX: 1.15 }]
  }
});
