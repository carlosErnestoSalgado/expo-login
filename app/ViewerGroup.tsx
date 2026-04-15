import { Text } from "@/components/Themed";
import { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { useColorScheme, Platform, View as RNView, Image } from "react-native";
import { useAuthStore } from "@/storage/useAuthStorage";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { User } from "@/storage/types";
import { useLocalSearchParams } from 'expo-router';

// Components
import Card from "@/components/card";
import StatRow from "@/components/statrow";
import SectionTitle from "@/components/sectiontitle";

// Modals
import ModalCreateEditGroup from "@/components/ModalCreateEditGroup";
import { authService } from "@/storage/authservices";
import AsyncStorage from "@react-native-async-storage/async-storage";




export default function ViewerGroup(){
    const { idGroup } = useLocalSearchParams<{ idGroup: string }>();


    const user  = useAuthStore((s) => s.user)

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getMembers = useAuthStore((s) => s.getUsersFromGroup)
    const [members, setMembers] = useState<User[]>([])


    useEffect(() => {
    const fetchMembers = async () => {
        const result = await getMembers(idGroup);
        setMembers(result);

    };
    fetchMembers();
    }, [idGroup]);


    const handleDebug =  async () => {
        const result = await AsyncStorage.getItem("@registered_users")
        const user_registered =  JSON.parse(result ?? "[]")
        console.log("Usarios registrados")       
        console.log(user_registered)
        const something = user_registered.filter((u: any) => u.groupIds.includes(idGroup));
        console.log(something)
    }

    
    // Router para ir atras al elimianr el grupo
    const router = useRouter();

    // Para eliminar grupo
    const deleteGroup = useAuthStore((s) => s.deleteGroupById)

    // Driver Modal
    const [modalEditGroup, setModalEditGroup] = useState(false);
    
    // Group by Id
    const getGroupById = useAuthStore((s) => s.getGroupById);   
    const group = getGroupById(idGroup);

    
    const esAdmin = group?.adminId === user?.id;

    const iniciales = group?.nombre
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
    
    
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
            <RNView style={styles.divider} />
            <RNView>
            <Text>Miembros del grupo:</Text>
            {members.map((u) => (
                <Text key={u.id}>{u.name}</Text>
            ))}
            </RNView>
            </Card>

             {/* ── Acciones  ──────────────────────────────────────────── */}
            <SectionTitle text="Acciones sobre el grupo" />

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
            {/* ── Acción de Administrador: Eliminar Grupo ── */}
            {esAdmin && (
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
            )}
                        
             {
                group ?
                <ModalCreateEditGroup modalCrear={modalEditGroup} setModalCrear={(modalEditGroup) => setModalEditGroup(modalEditGroup)} idGroup={idGroup} group={group}/>
                : null
            }
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