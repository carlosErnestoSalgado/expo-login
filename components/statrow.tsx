import {View as RNView, StyleSheet} from "react-native";
import { Text, View } from "./Themed";
    
const styles = StyleSheet.create({
  statRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  statLabel:      { fontSize: 15 },
  statValue:      { fontSize: 15, fontWeight: '700' },
});


export default function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <RNView style={styles.statRow}>
      <Text style={styles.statLabel} lightColor="#555" darkColor="#AAA">{label}</Text>
      <Text
        style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}
        lightColor="#1A1A1A"
        darkColor="#FFF"
      >
        {value}
      </Text>
    </RNView>
  );
}