import { Text } from "./Themed";
import { StyleSheet } from "react-native";

export default function SectionTitle({ text }: { text: string }) {
  return (
    <Text style={styles.sectionTitle} lightColor="#888" darkColor="#666">
      {text.toUpperCase()}
    </Text>
  );
}
const styles = StyleSheet.create({
      // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
});