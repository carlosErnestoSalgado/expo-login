import { Text } from "@/components/Themed";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useColorScheme, Platform, View as RNView, Image } from "react-native";
import { useAuthStore } from "@/storage/useAuthStorage";
import { FontAwesome } from "@expo/vector-icons";

// Components
import Card from "@/components/card";
import StatRow from "@/components/statrow";
import SectionTitle from "@/components/sectiontitle";

interface typesViewerGroup {
    idGroup:string
}


export default function ViewerGroup({idGroup}:typesViewerGroup){
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    // Group by Id
    const getGroupById = useAuthStore((s) => s.getGroupById);   
    const group = getGroupById(idGroup);
    console.log("-----------------------------------------------------------------")
    console.log(group)
    console.log("-----------------------------------------------------------------")
    console.log("Id del GRupo", idGroup)

    const iniciales = group?.nombre
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
    
    console.log(idGroup)
    return(
     <ScrollView
          style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F5F7FA' }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
        {/* ── Header / Avatar ───────────────────────────────────────────── */}
            <RNView style={styles.header}>
                {group?.foto ? (
                <Image source={{ uri: group.foto }} style={styles.avatar} />
                ) : (
                <RNView style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{iniciales}</Text>
                </RNView>
                )}
                <Text style={styles.userName} lightColor="#1A1A1A" darkColor="#FFF">
                {group?.nombre ?? 'Grupo'}
                </Text>
            </RNView>
            {/* ── Finanzas del mes ──────────────────────────────────────────── */}
            <SectionTitle text="Finanzas actuales de este grupo" />
            <Card>
            <StatRow label="Salario mensual"   value={"Esto es una prueba"} />
            <RNView style={styles.divider} />
            <StatRow label="Total gastado"     value={"fmt(totalGastado)"} valueColor="#FF9500" />
            <RNView style={styles.divider} />
            <StatRow label="Saldo restante"    value={"fmt(saldo)"}        valueColor={"#007AFF"} />
            </Card>

             {/* ── Acciones  ──────────────────────────────────────────── */}
            <SectionTitle text="Acciones sobre el grupo" />

            <Pressable
            onPress={() => console.log("Edit Group")}
            style={({ pressed }) => [styles.ctaBtnEdit, pressed && styles.ctaPressed]}
            >
                <FontAwesome name="pencil" size={16} color="#FFF" />
                <Text style={styles.ctaBtnText}>Editar Grupo</Text>
            </Pressable>
            <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { transform: [{ scale: 1.20 }], opacity: 0.85  }]}
            onPress={() => console.log("Delete group")}
            >
            <FontAwesome name="trash" size={12} color="red" />
            <Text style={styles.deleteText} lightColor="#8E8E93" darkColor="#555">
                Eliminar grupo
            </Text>
            </Pressable>
    </ScrollView>)
}

const styles = StyleSheet.create({
  scroll:         { padding: 20, paddingBottom: 48 },

  header:         { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  avatar:         { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:     { color: '#FFF', fontSize: 32, fontWeight: '800' },
  userName:       { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userEmail:      { fontSize: 14, marginBottom: 10 },
  groupBadge:     { backgroundColor: '#E8F4FF', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  groupBadgeText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },

  card: {
    borderRadius: 18, padding: 18, marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  sectionTitle:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  statRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  statLabel:      { fontSize: 15 },
  statValue:      { fontSize: 15, fontWeight: '700' },
  divider:        { height: 1, backgroundColor: '#F0F0F0' },

  metaHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  metaPct:        { fontSize: 28, fontWeight: '800' },
  metaValues:     { fontSize: 13 },
  progressTrack:  { height: 10, backgroundColor: '#F0F0F0', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  progressFill:   { height: 10, borderRadius: 8 },
  metaHint:       { fontSize: 13 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#007AFF', height: 54, borderRadius: 16,
    marginTop: 8, marginBottom: 12, elevation: 4,
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ctaBtnEdit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#ffb300', height: 54, borderRadius: 16,
    marginTop: 8, marginBottom: 12, elevation: 4,
    shadowColor: '#ff9900', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ctaBtnOutline:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#007AFF', elevation: 0, shadowOpacity: 0 },
  ctaPressed:     { transform: [{ scale: 0.97 }], opacity: 0.85 },
  ctaBtnText:     { color: '#FFF', fontSize: 16, fontWeight: '800' },

  deleteBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  deleteText:      { fontSize: 12 , color: "red"},


  logoutBtn:      { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  logoutText:     { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  containerGroups: {flexDirection: "column", gap: 4, justifyContent: "space-between"}
});