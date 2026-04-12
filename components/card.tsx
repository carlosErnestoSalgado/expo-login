import { Platform, useColorScheme } from "react-native";
import { View } from "./Themed";
import { StyleSheet } from "react-native";



export default function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }, style]}
      lightColor="#FFFFFF"
      darkColor="#1E1E1E"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
 // Card
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
});