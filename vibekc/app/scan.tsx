import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.sub}>
          We need access to your camera to scan QR codes.
        </Text>

        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(result) => {
          if (scanned) return;
          setScanned(true);
          setScannedValue(result.data);
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.h1}>Scan QR Code</Text>
        <Text style={styles.h2}>Align the code inside the frame</Text>

        <View style={styles.frame} />

        {scannedValue ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Scanned Value</Text>
            <Text style={styles.resultValue} numberOfLines={4}>
              {scannedValue}
            </Text>

            <View style={styles.row}>
              <Pressable
                style={[styles.smallBtn, styles.primary]}
                onPress={() => {
                  setScanned(false);
                  setScannedValue(null);
                }}
              >
                <Text style={styles.smallBtnText}>Scan Again</Text>
              </Pressable>

              <Pressable
                style={[styles.smallBtn, styles.secondary]}
                onPress={() => router.back()}
              >
                <Text style={styles.smallBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.bottomBtn} onPress={() => router.back()}>
            <Text style={styles.bottomBtnText}>Close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },

  overlay: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  h1: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  h2: {
    marginTop: 6,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },

  frame: {
    marginTop: 26,
    alignSelf: "center",
    width: 260,
    height: 260,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  resultCard: {
    marginTop: 24,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  resultLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "800",
  },
  resultValue: {
    marginTop: 6,
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },

  row: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  smallBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primary: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  smallBtnText: {
    color: "white",
    fontWeight: "900",
  },

  bottomBtn: {
    marginTop: "auto",
    marginBottom: 26,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  bottomBtnText: {
    color: "white",
    fontWeight: "900",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "black",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  sub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },

  btn: {
    marginTop: 14,
    width: "100%",
    maxWidth: 360,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  btnText: {
    color: "white",
    fontWeight: "900",
  },
});
