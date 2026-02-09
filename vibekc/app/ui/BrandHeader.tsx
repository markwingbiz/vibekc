import { View, Image, StyleSheet } from "react-native";

export default function BrandHeader() {
  return (
    <View style={styles.row}>
      <Image
        source={require("../../assets/branding/logo-wordmark.png")}
        resizeMode="contain"
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logo: {
    height: 28,
    width: 160,
    opacity: 0.9,
  },
});
