import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, StatusBar } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function QRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      Alert.alert("QR Scanned", data, [
        { text: "Scan again", onPress: () => setScanned(false) },
        { text: "Close", onPress: () => router.back(), style: "cancel" },
      ]);
    },
    [scanned, router]
  );

  if (!permission) {
    return (
      <View style={s.root}>
        <Text style={s.text}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.root}>
        <LinearGradient
          colors={["#0b0622", "#1a0b3a", "#09061a"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={s.text}>Camera permission is required to scan QR.</Text>
        <Pressable style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Allow Camera</Text>
        </Pressable>
        <Pressable style={[s.btn, { opacity: 0.8 }]} onPress={() => router.back()}>
          <Text style={s.btnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      {/* Overlay */}
      <View pointerEvents="none" style={s.overlay}>
        <View style={s.frame} />
        <Text style={s.overlayText}>{scanned ? "Scanned ✓" : "Align QR inside the frame"}</Text>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <Pressable style={s.controlBtn} onPress={() => setScanned(false)}>
          <Text style={s.controlText}>Scan again</Text>
        </Pressable>
        <Pressable style={s.controlBtn} onPress={() => router.back()}>
          <Text style={s.controlText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", marginBottom: 14 },
  btn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "rgba(155, 90, 230, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(210,170,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "800" },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(194,126,255,0.95)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  overlayText: {
    marginTop: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },
  controls: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 36,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  controlBtn: {
    flex: 1,
    height: 50,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(210,170,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { color: "white", fontWeight: "800" },
});
