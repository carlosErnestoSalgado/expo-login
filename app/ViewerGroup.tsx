import { Text } from "@/components/Themed";
import { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { useColorScheme, Platform, View as RNView, Image } from "react-native";
import { useAuthStore } from "@/storage/useAuthStorage";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MiembroGrupo, User } from "@/storage/types";
import { useLocalSearchParams } from 'expo-router';

// Components
import Card from "@/components/card";
import StatRow from "@/components/statrow";
import SectionTitle from "@/components/sectiontitle";

// Modals
import ModalCreateEditGroup from "@/components/ModalCreateEditGroup";

import ModalGastoComun from "@/components/ModalGastoComun";

import GastoComunRow from "@/components/GastoComenRow";
import { calcularBalancesGrupo, calcularTransferencias } from "@/functions/balances";

// Helper — fuera del componente
function getMesActivoId(): string {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${mm}`;
}


export default function ViewerGroup(){
    const { idGroup } = useLocalSearchParams<{ idGroup: string }>();


    const user  = useAuthStore((s) => s.user)

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getMembers = useAuthStore((s) => s.getUsersFromGroup)
    

    const [visibleModalGasto, setVisibleModalGasto] = useState(false);
     

    // salir del grupo
    const exitOfGroup = useAuthStore((s) => s.exitOfGroup)


    // Al inicio del componente, junto a los otros selectores
    const gastosComunes = useAuthStore((s) => {
    
        return s.groups
            .find(g => g.id === idGroup)
            ?.gastosDelGrupo ?? [];
        });

    // Miembros del grupo
    const miembros  = useAuthStore((s) => {
        return s.groups
        .find(g => g.id == idGroup)
        ?.miembros ?? [] 
    })
    /*
    const balances =
    calcularBalancesGrupo(
        miembros,
        gastosComunes
    );

    const transferencias =
    calcularTransferencias(
        balances
    );

    console.log("Balances:", balances);
    console.log("Transferencias:", transferencias);*/
        
    const deleteGastoComun = useAuthStore((s) => s.deleteGastoComun);
    
    
    // Router para ir atras al elimianr el grupo
    const router = useRouter();

    // Para eliminar grupo
    const deleteGroup = useAuthStore((s) => s.deleteGroupById)

    // Driver Modal
    const [modalEditGroup, setModalEditGroup] = useState(false);
    
    // Group by Id
    //const getGroupById = useAuthStore((s) => s.getGroupById);   
    //const group = getGroupById(idGroup);

    //  selector directo, sin llamar a getGroupById
    const group = useAuthStore((s) => s.groups.find((g) => g.id === idGroup) ?? null);

    

    const esAdmin = group?.adminId === user?.id;

    const iniciales = group?.nombre
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
    
    
    return(
     <ScrollView
          style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F5F7FA' , height: "auto"}}
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
            <RNView style={styles.divider} />
            <RNView>
            <Text>Miembros del grupo:</Text>
            {(miembros ?? [] ).map((u) => (
                <Text key={u.userId}>{u.nombre}</Text>
            ))}
            </RNView>
            </Card>
            {/* ── Gastos comunes del mes ──────────────────────────────────── */}
            <SectionTitle text="Gastos comunes del mes" />

            <ScrollView style={{ height: 200 }}        // ← altura fija obligatoria
    nestedScrollEnabled={true}     // ← Android
    scrollEnabled={true}>

            {gastosComunes.length === 0 ? (
            <Card>
                <RNView style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <FontAwesome name="inbox" size={36} color={isDark ? '#3A3A3C' : '#DDD'} />
                <Text lightColor="#AAA" darkColor="#555" style={{ fontSize: 14, fontWeight: '600' }}>
                    Sin gastos este mes
                </Text>
                </RNView>
            </Card>
            ) : (
            gastosComunes.map((gasto) => (
                <GastoComunRow
                key={gasto.id}
                gasto={gasto}
                isDark={isDark}
                onEliminar={() => deleteGastoComun(idGroup, getMesActivoId(), gasto.id)}
                />
            ))
            )}
            </ScrollView>

             {/* ── Acciones  ──────────────────────────────────────────── */}
            <SectionTitle text="Acciones sobre el grupo" />

            {/* ── Añadir gasto ─────────────────────────────────────────────────────── */}
                <Pressable
                    style={({ pressed }) => [styles.debugBtn, pressed && { opacity: 0.5 }]}
                    onPress={() => setVisibleModalGasto(true)}
                >
                    <FontAwesome name="plus" size={12} color="#8E8E93" />
                    <Text style={styles.debugText} lightColor="#8E8E93" darkColor="#555">
                    Añadir Gasto
                    </Text>
                </Pressable>
           
            {/* ── Editar  ──────────────────────────────────────────── */}
            <Pressable
            onPress={() => {
                console.log("Edit Group");
                setModalEditGroup(true)
            }}
            style={({ pressed }) => [styles.ctaBtnEdit, pressed && styles.ctaPressed]}
            >
                <FontAwesome name="pencil" size={16} color="#FFF" />
                <Text style={styles.ctaBtnText}>Editar Grupo</Text>
            </Pressable>
            
            {/* ── Debug ─────────────────────────────────────────────────────── */}
                <Pressable
                    style={({ pressed }) => [styles.debugBtn, pressed && { opacity: 0.5 }]}
                    onPress={() => router.push('/DebugPage')}
                >
                    <FontAwesome name="bug" size={12} color="#8E8E93" />
                    <Text style={styles.debugText} lightColor="#8E8E93" darkColor="#555">
                    Ir a paágina de Debug
                    </Text>
                </Pressable>
           
           
            {/* ── Acción de Administrador: Eliminar Grupo  o Salir── */}
            {esAdmin ? (
            <Pressable
                style={({ pressed }) => [
                styles.deleteBtn, 
                pressed && styles.deleteBtnPressed,
                ]}
                onPress={() => {
                Alert.alert(
                    "Eliminar grupo",
                    "¿Estás seguro que deseas eliminar este grupo? Esta acción no se puede deshacer.",
                    [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: () => {
                        deleteGroup(idGroup);
                        router.back();
                        },
                    },
                    ]
                );
                }}
            >
                <RNView style={styles.deleteIconWrapper}>
                <FontAwesome name="trash" size={14} color="#FF3B30" />
                </RNView>
                <Text style={styles.deleteText}>Eliminar grupo</Text>
            </Pressable>
            ): (
                <Pressable
                style={({ pressed }) => [
                styles.deleteBtn, 
                pressed && styles.deleteBtnPressed,
                ]}
                 onPress={() => {
                Alert.alert(
                    "Salir del grupo",
                    "¿Estás seguro que deseas salir de este grupo? Esta acción no se puede deshacer.",
                    [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Salir del grupo",
                        style: "destructive",
                        onPress: () => {
                        exitOfGroup(idGroup);
                        router.back();
                        },
                    },
                    ]
                );
                }}
                >

                    <RNView style={styles.deleteIconWrapper}>
                    <FontAwesome name="trash" size={14} color="#FF3B30" />
                    </RNView>
                    <Text style={styles.deleteText}>Salir del grupo</Text>
                </Pressable>
            )}



             {/* ── Modal para editar grupo  ──────────────────────────────────────────── */}           
             {
                group ?
                <ModalCreateEditGroup modalCrear={modalEditGroup} setModalCrear={(modalEditGroup) => setModalEditGroup(modalEditGroup)} idGroup={idGroup} group={group}/>
                : null
             }
             {/* ── Modal gasto personal ──────────────────────────────────────── */}
                <ModalGastoComun
                visible={visibleModalGasto}
                idGrupo={idGroup}
                onClose={() => setVisibleModalGasto(false)}
                />
                
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



  logoutBtn:      { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  logoutText:     { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  containerGroups: {flexDirection: "column", gap: 4, justifyContent: "space-between"},
  
  debugBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  debugText:      { fontSize: 12 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    backgroundColor: '#FF3B3010', // Un fondo rojo muy sutil
    borderWidth: 1,
    borderColor: '#FF3B3020',
    alignSelf: 'center', // O flex-start según tu diseño
  },
  deleteBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }], // Efecto de hundimiento más natural que el 1.20
    backgroundColor: '#FF3B3020',
  },
  deleteIconWrapper: {
    marginRight: 8,
  },
  deleteText: {
    color: '#FF3B30', // Texto en rojo para indicar peligro
    fontSize: 14,
    fontWeight: '600',
  },
});