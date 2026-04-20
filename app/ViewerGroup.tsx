import { Text } from "@/components/Themed";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { useColorScheme, Platform, View as RNView, Image } from "react-native";
import { useAuthStore } from "@/storage/useAuthStorage";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MiembroGrupo } from "@/storage/types";
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModalCreateEditGroup from "@/components/ModalCreateEditGroup";
import ModalGastoComun from "@/components/ModalGastoComun";


function getMesActivoId(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${mm}`;
}

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

function fmt(n: number | undefined): string {
  return Number(n ?? 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export default function ViewerGroup() {
  const { idGroup } = useLocalSearchParams<{ idGroup: string }>();
  const user = useAuthStore((s) => s.user);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  const [visibleModalGasto, setVisibleModalGasto] = useState(false);
  const [modalEditGroup, setModalEditGroup] = useState(false);

  const exitOfGroup = useAuthStore((s) => s.exitOfGroup);
  const deleteGastoComun = useAuthStore((s) => s.deleteGastoComun);
  const deleteGroup = useAuthStore((s) => s.deleteGroupById);

  const group = useAuthStore((s) => s.groups.find((g) => g.id === idGroup) ?? null);
  const gastosComunes = group?.gastosDelGrupo ?? [];
  const miembros = group?.miembros ?? [];

  const miembrosMap: Record<string, string> = {};
  miembros.forEach((m) => { miembrosMap[m.userId] = m.nombre; });

  const esAdmin = group?.adminId === user?.id;

  const iniciales = group?.nombre
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  // ── Cálculo resumen deudas ─────────────────────────────────────────────────
  const meDebenItems: { nombre: string; monto: number }[] = [];
  const yoDebItems: { nombre: string; monto: number }[] = [];

  gastosComunes.forEach((gasto) => {
    const montoGasto = parseMonto(gasto.monto);
    (gasto.deuda ?? []).forEach((deuda) => {
      const montoReal = Number(deuda.debe) * montoGasto;
      if (deuda.user_id === user?.id && deuda.deudaMiembro) {
        const pagadorNombre = miembrosMap[gasto.quienPago ?? ''] ?? 'Alguien';
        yoDebItems.push({ nombre: pagadorNombre, monto: montoReal });
      }
      if (gasto.quienPago === user?.id && deuda.user_id !== user?.id && deuda.deudaMiembro) {
        const deudorNombre = miembrosMap[deuda.user_id] ?? (deuda as any).name ?? 'Alguien';
        meDebenItems.push({ nombre: deudorNombre, monto: montoReal });
      }
    });
  });

  const totalMeDeben = meDebenItems.reduce((a, b) => a + b.monto, 0);
  const totalYoDebo = yoDebItems.reduce((a, b) => a + b.monto, 0);
  const neto = totalMeDeben - totalYoDebo;
  const netoColor = neto >= 0 ? "#30D158" : "#FF453A";

  const colors = {
    bg: isDark ? '#121212' : '#F5F7FA',
    header: isDark ? '#1C1C1E' : '#FFFFFF',
    primary: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#8E8E93' : '#8E8E93',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#2C2C2E' : '#F0F0F0',
    label: isDark ? '#8E8E93' : '#8E8E93',
  };

  return (
    <RNView style={{
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#F5F7FA',
    paddingTop: insets.top, // 👈 SOLUCIÓN
  }}>

      {/* ── Header con volver ─────────────────────────────────────────────── */}
      <RNView style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <FontAwesome name="chevron-left" size={16} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>
          {group?.nombre ?? 'Grupo'}
        </Text>
        <RNView style={{ width: 70 }} />
      </RNView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ────────────────────────────────────────────────────────── */}
        <RNView style={styles.avatarSection}>
          {group?.foto ? (
            <Image source={{ uri: group.foto }} style={styles.avatar} />
          ) : (
            <RNView style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </RNView>
          )}
          <Text style={[styles.groupName, { color: colors.primary }]}>
            {group?.nombre ?? 'Grupo'}
          </Text>
          {group?.descripcion ? (
            <Text style={[styles.groupDesc, { color: colors.label }]}>{group.descripcion}</Text>
          ) : null}
        </RNView>

        {/* ── Miembros ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>MIEMBROS</Text>
        <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {miembros.map((m, i) => (
            <RNView key={m.userId}>
              <RNView style={styles.miembroRow}>
                <RNView style={[styles.miembroAvatar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={[styles.miembroAvatarText, { color: colors.label }]}>
                    {m.nombre.charAt(0).toUpperCase()}
                  </Text>
                </RNView>
                <RNView style={{ flex: 1 }}>
                  <Text style={[styles.miembroNombre, { color: colors.primary }]}>{m.nombre}</Text>
                  <Text style={[styles.miembroSalario, { color: colors.label }]}>{fmt(m.salario)} / mes</Text>
                </RNView>
                <RNView style={[styles.miembroPctBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={[styles.miembroPctText, { color: colors.label }]}>
                    {Math.round((m.porcentaje ?? 0) * 100)}%
                  </Text>
                </RNView>
              </RNView>
              {i < miembros.length - 1 && (
                <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </RNView>
          ))}
        </RNView>

        {/* ── Resumen de deudas ─────────────────────────────────────────────── */}
        {(meDebenItems.length > 0 || yoDebItems.length > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.label }]}>TU RESUMEN</Text>
            <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>

              {/* Te deben */}
              {meDebenItems.length > 0 && (
                <RNView style={styles.deudaSection}>
                  <RNView style={styles.deudaSectionHeader}>
                    <RNView style={[styles.deudaDot, { backgroundColor: '#30D158' }]} />
                    <Text style={[styles.deudaSectionTitle, { color: '#30D158' }]}>Te deben</Text>
                    <Text style={[styles.deudaSectionTotal, { color: '#30D158' }]}>{fmt(totalMeDeben)}</Text>
                  </RNView>
                  {meDebenItems.map((item, i) => (
                    <RNView key={i} style={styles.deudaRow}>
                      <Text style={[styles.deudaNombre, { color: colors.primary }]}>{item.nombre}</Text>
                      <Text style={[styles.deudaMonto, { color: '#30D158' }]}>+{fmt(item.monto)}</Text>
                    </RNView>
                  ))}
                </RNView>
              )}

              {/* Divisor si hay ambas secciones */}
              {meDebenItems.length > 0 && yoDebItems.length > 0 && (
                <RNView style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 0 }]} />
              )}

              {/* Debes */}
              {yoDebItems.length > 0 && (
                <RNView style={styles.deudaSection}>
                  <RNView style={styles.deudaSectionHeader}>
                    <RNView style={[styles.deudaDot, { backgroundColor: '#FF453A' }]} />
                    <Text style={[styles.deudaSectionTitle, { color: '#FF453A' }]}>Debes</Text>
                    <Text style={[styles.deudaSectionTotal, { color: '#FF453A' }]}>−{fmt(totalYoDebo)}</Text>
                  </RNView>
                  {yoDebItems.map((item, i) => (
                    <RNView key={i} style={styles.deudaRow}>
                      <Text style={[styles.deudaNombre, { color: colors.primary }]}>a {item.nombre}</Text>
                      <Text style={[styles.deudaMonto, { color: '#FF453A' }]}>−{fmt(item.monto)}</Text>
                    </RNView>
                  ))}
                </RNView>
              )}

              {/* Balance neto */}
              {meDebenItems.length > 0 && yoDebItems.length > 0 && (
                <RNView style={[styles.netoRow, { backgroundColor: isDark ? '#252528' : '#F8F9FB', borderTopColor: colors.border }]}>
                  <Text style={[styles.netoLabel, { color: colors.label }]}>Balance neto</Text>
                  <Text style={[styles.netoValue, { color: netoColor }]}>
                    {neto >= 0 ? '+' : ''}{fmt(neto)}
                  </Text>
                </RNView>
              )}
            </RNView>
          </>
        )}

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.label }]}>ACCIONES</Text>

        {/* Ver gastos */}
        <Pressable
          style={({ pressed }) => [
            styles.accionBtn,
            { backgroundColor: isDark ? '#1C2A3A' : '#EEF4FF', opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => router.push({ pathname: '/GastosScreen', params: { idGroup } })}
        >
          <RNView style={[styles.accionIconWrapper, { backgroundColor: '#3A7BFF20' }]}>
            <FontAwesome name="list" size={15} color="#3A7BFF" />
          </RNView>
          <Text style={[styles.accionText, { color: '#3A7BFF' }]}>Ver gastos del grupo</Text>
          <FontAwesome name="chevron-right" size={12} color="#3A7BFF" />
        </Pressable>

        {/* Añadir gasto */}
        <Pressable
          style={({ pressed }) => [
            styles.accionBtn,
            { backgroundColor: isDark ? '#1C2A1E' : '#F0FAF4', opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => setVisibleModalGasto(true)}
        >
          <RNView style={[styles.accionIconWrapper, { backgroundColor: '#30D15820' }]}>
            <FontAwesome name="plus" size={15} color="#30D158" />
          </RNView>
          <Text style={[styles.accionText, { color: '#30D158' }]}>Añadir gasto</Text>
          <FontAwesome name="chevron-right" size={12} color="#30D158" />
        </Pressable>

        {/* Editar grupo */}
        <Pressable
          style={({ pressed }) => [
            styles.accionBtn,
            { backgroundColor: isDark ? '#2A2000' : '#FFF8E6', opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => setModalEditGroup(true)}
        >
          <RNView style={[styles.accionIconWrapper, { backgroundColor: '#FF950020' }]}>
            <FontAwesome name="pencil" size={15} color="#FF9500" />
          </RNView>
          <Text style={[styles.accionText, { color: '#FF9500' }]}>Editar grupo</Text>
          <FontAwesome name="chevron-right" size={12} color="#FF9500" />
        </Pressable>

        {/* Eliminar / Salir */}
        <Pressable
          style={({ pressed }) => [
            styles.accionBtn,
            { backgroundColor: isDark ? '#3A1515' : '#FFF0F0', opacity: pressed ? 0.7 : 1, marginBottom: 0 }
          ]}
          onPress={() => {
            const esAccionEliminar = esAdmin;
            Alert.alert(
              esAccionEliminar ? "Eliminar grupo" : "Salir del grupo",
              esAccionEliminar
                ? "¿Estás seguro que deseas eliminar este grupo? Esta acción no se puede deshacer."
                : "¿Estás seguro que deseas salir de este grupo?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: esAccionEliminar ? "Eliminar" : "Salir",
                  style: "destructive",
                  onPress: () => {
                    esAccionEliminar ? deleteGroup(idGroup) : exitOfGroup(idGroup);
                    router.back();
                  },
                },
              ]
            );
          }}
        >
          <RNView style={[styles.accionIconWrapper, { backgroundColor: '#FF3B3020' }]}>
            <FontAwesome name={esAdmin ? "trash" : "sign-out"} size={15} color="#FF3B30" />
          </RNView>
          <Text style={[styles.accionText, { color: '#FF3B30' }]}>
            {esAdmin ? "Eliminar grupo" : "Salir del grupo"}
          </Text>
          <FontAwesome name="chevron-right" size={12} color="#FF3B30" />
        </Pressable>

        {/* ── Modales ─────────────────────────────────────────────────────── */}
        {group && (
          <ModalCreateEditGroup
            modalCrear={modalEditGroup}
            setModalCrear={setModalEditGroup}
            idGroup={idGroup}
            group={group}
          />
        )}
        <ModalGastoComun
          visible={visibleModalGasto}
          idGrupo={idGroup}
          onClose={() => setVisibleModalGasto(false)}
        />
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 },
  backText: { color: '#007AFF', fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  scroll: { padding: 16, paddingBottom: 48 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  groupName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  groupDesc: { fontSize: 14 },

  // Section title
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 20, marginLeft: 4,
  },

  // Card
  card: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', marginBottom: 4 },

  // Miembros
  miembroRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  miembroAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  miembroAvatarText: { fontSize: 15, fontWeight: '700' },
  miembroNombre: { fontSize: 15, fontWeight: '600' },
  miembroSalario: { fontSize: 12, marginTop: 1 },
  miembroPctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  miembroPctText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 0.5, marginHorizontal: 14 },

  // Deudas
  deudaSection: { padding: 14, gap: 8 },
  deudaSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  deudaDot: { width: 8, height: 8, borderRadius: 4 },
  deudaSectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, flex: 1 },
  deudaSectionTotal: { fontSize: 14, fontWeight: '800' },
  deudaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  deudaNombre: { fontSize: 13 },
  deudaMonto: { fontSize: 13, fontWeight: '700' },

  // Neto
  netoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, padding: 14,
  },
  netoLabel: { fontSize: 13, fontWeight: '600' },
  netoValue: { fontSize: 18, fontWeight: '800' },

  // Acciones
  accionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, marginBottom: 10,
  },
  accionIconWrapper: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  accionText: { flex: 1, fontSize: 15, fontWeight: '600' },
});