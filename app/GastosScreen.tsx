import { Text } from "@/components/Themed";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
  useColorScheme,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/storage/useAuthStorage";
import { DeudaMiembro, GastoComun, User } from "@/storage/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getMesActivoId(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
}

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

function fmt(n: number | undefined): string {
  return Number(n ?? 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

interface GastoRowProps {
  gasto: GastoComun;
  isDark: boolean;
  miembrosMap: Record<string, string>;
  onEliminar: () => void;
  onEditar: () => void;
  userId: string;        // 👈 nuevo
  idGroup: string;       // 👈 nuevo
  onSaldar: (gastoId: string, userId: string) => void;  // 👈 nuevo
}
function GastoRowExpandible({ gasto, isDark, miembrosMap, onEliminar, onEditar, userId, idGroup, onSaldar }: GastoRowProps) {
  const [expandido, setExpandido] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandido((v) => !v);
  };

  const colors = {
    card: isDark ? "#1C1C1E" : "#FFFFFF",
    border: isDark ? "#2C2C2E" : "#F0F0F0",
    label: isDark ? "#8E8E93" : "#8E8E93",
    primary: isDark ? "#FFFFFF" : "#1A1A1A",
    secondary: isDark ? "#EBEBF5CC" : "#3C3C4399",
    expandBg: isDark ? "#252528" : "#F8F9FB",
    deudaBg: isDark ? "#1C1C1E" : "#FFFFFF",
    deudaBorder: isDark ? "#3A3A3C" : "#EFEFEF",
    pagadorBg: isDark ? "#0A3A1F" : "#E8F8EF",
    pagadorText: isDark ? "#30D158" : "#1A7F3C",
    deleteBg: isDark ? "#3A1515" : "#FFF0F0",
    editBg: isDark ? "#1A2A3A" : "#EEF4FF",
    chevron: isDark ? "#636366" : "#C7C7CC",
  };

  const deudas = gasto.deuda ?? [];
  const pagadorNombre = gasto.quienPago ? (miembrosMap[gasto.quienPago] ?? "Desconocido") : "Compartido";
  const montoGasto = parseMonto(gasto.monto);

  return (
    <RNView style={[styles.gastoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={toggleExpand} style={styles.gastoMainRow}>
        <RNView style={[styles.categoriaIcon, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
          <Text style={styles.categoriaEmoji}>{CATEGORIA_EMOJI[gasto.categoria ?? "Otros"] ?? "💰"}</Text>
        </RNView>

        <RNView style={styles.gastoInfoCenter}>
          <Text style={[styles.gastoDescripcion, { color: colors.primary }]} numberOfLines={1}>
            {gasto.descripcion}
          </Text>
          <RNView style={styles.gastoMeta}>
            <Text style={[styles.gastoCategoria, { color: colors.label }]}>
              {gasto.categoria ?? "Otros"}
            </Text>
            {gasto.fecha && (
              <>
                <Text style={[styles.gastoDot, { color: colors.label }]}> · </Text>
                <Text style={[styles.gastoCategoria, { color: colors.label }]}>
                  {new Date(gasto.fecha).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                </Text>
              </>
            )}
          </RNView>
        </RNView>

        <RNView style={styles.gastoRight}>
          <Text style={[styles.gastoMonto, { color: colors.primary }]}>{fmt(montoGasto)}</Text>
          <FontAwesome
            name={expandido ? "chevron-up" : "chevron-down"}
            size={12}
            color={colors.chevron}
            style={styles.chevron}
          />
        </RNView>
      </Pressable>

      {expandido && (
        <RNView style={[styles.expandedPanel, { backgroundColor: colors.expandBg, borderTopColor: colors.border }]}>
          <RNView style={styles.pagadorRow}>
            <Text style={[styles.expandLabel, { color: colors.label }]}>Pagó</Text>
            <RNView style={[styles.pagadorBadge, { backgroundColor: colors.pagadorBg }]}>
              <FontAwesome name="user-circle" size={12} color={colors.pagadorText} />
              <Text style={[styles.pagadorBadgeText, { color: colors.pagadorText }]}>{pagadorNombre}</Text>
            </RNView>
          </RNView>

          {deudas.map((deuda) => {
  const nombre = miembrosMap[deuda.user_id] ?? deuda.user_id;
  const esPagador = deuda.user_id === gasto.quienPago;
  const montoReal = Number(deuda.debe) * montoGasto;
  const esMiDeuda = deuda.user_id === userId && deuda.deudaMiembro;

  return (
    <RNView
      key={deuda.user_id}
      style={[
        styles.deudaRow,
        { backgroundColor: colors.deudaBg, borderColor: colors.deudaBorder },
      ]}
    >
      <RNView style={styles.deudaLeft}>
        <RNView style={[styles.deudaAvatar, { 
          backgroundColor: deuda.deudaMiembro === false
            ? (isDark ? '#0A3A1F' : '#E8F8EF')
            : esPagador 
              ? colors.pagadorBg 
              : (isDark ? "#2C2C2E" : "#F2F2F7") 
        }]}>
          <Text style={[styles.deudaAvatarText, { 
            color: deuda.deudaMiembro === false
              ? (isDark ? '#30D158' : '#1A7F3C')
              : esPagador ? colors.pagadorText : colors.label 
          }]}>
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </RNView>
        <RNView>
          <Text style={[styles.deudaNombre, { color: colors.primary }]}>{nombre}</Text>
          {esPagador && (
            <Text style={[styles.deudaPagadorTag, { color: colors.pagadorText }]}>pagó</Text>
          )}
          {/* ── Badge saldado ── */}
          {deuda.deudaMiembro === false && !esPagador && (
            <Text style={styles.saldadoTag}>✓ saldado</Text>
          )}
        </RNView>
      </RNView>

      <RNView style={styles.deudaRight}>
        {deuda.deudaMiembro ? (
          <Text style={[styles.deudaMonto, { color: "#FF453A" }]}>−{fmt(montoReal)}</Text>
        ) : (
          <Text style={[styles.deudaMonto, { color: esPagador ? colors.pagadorText : "#30D158" }]}>
            {esPagador ? '+' : '✓'}{fmt(montoReal)}
          </Text>
        )}
        {deuda.deudaMiembro && !esPagador && (
          <Text style={[styles.deudaOwesLabel, { color: colors.label }]}>
            a {pagadorNombre}
          </Text>
        )}

        {/* ── Botón saldar — solo para el usuario logueado y si debe ── */}
        {esMiDeuda && (
          <Pressable
            style={({ pressed }) => [
              styles.saldarBtn,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() =>
              Alert.alert(
                "Saldar deuda",
                `¿Confirmas que pagaste ${fmt(montoReal)} a ${pagadorNombre}?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Sí, saldé",
                    onPress: () => onSaldar(gasto.id, userId),
                  },
                ]
              )
            }
          >
            <Text style={styles.saldarBtnText}>Saldar</Text>
          </Pressable>
        )}
      </RNView>
    </RNView>
  );
})}
          <RNView style={styles.accionesRow}>
            <Pressable
              style={({ pressed }) => [
                styles.accionBtn,
                { backgroundColor: colors.editBg, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={onEditar}
            >
              <FontAwesome name="pencil" size={12} color="#3A7BFF" />
              <Text style={styles.accionBtnTextEdit}>Editar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.accionBtn,
                { backgroundColor: colors.deleteBg, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() =>
                Alert.alert(
                  "Eliminar gasto",
                  `¿Deseas eliminar "${gasto.descripcion}"?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: onEliminar },
                  ]
                )
              }
            >
              <FontAwesome name="trash" size={12} color="#FF453A" />
              <Text style={styles.accionBtnTextDelete}>Eliminar</Text>
            </Pressable>
          </RNView>
        </RNView>
      )}
    </RNView>
  );
}

export default function GastosScreen() {
  const { idGroup } = useLocalSearchParams<{ idGroup: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAuthStore((s) => s.user);

  const saldarDeuda = useAuthStore((s) => s.saldarDeuda);
  const saldarTodasDeudas = useAuthStore((s) => s.saldarTodasDeudas);

  const group = useAuthStore((s) => s.groups.find((g) => g.id === idGroup) ?? null);
  const deleteGastoComun = useAuthStore((s) => s.deleteGastoComun);

  const gastosComunes = group?.gastosDelGrupo ?? [];
  const miembros = group?.miembros ?? [];

  const miembrosMap: Record<string, string> = {};
  miembros.forEach((m) => { miembrosMap[m.userId] = m.nombre; });

  const totalGastado = gastosComunes.reduce((acc, g) => acc + parseMonto(g.monto), 0);

  const colors = {
    bg: isDark ? "#121212" : "#F5F7FA",
    header: isDark ? "#1C1C1E" : "#FFFFFF",
    primary: isDark ? "#FFFFFF" : "#1A1A1A",
    secondary: isDark ? "#8E8E93" : "#8E8E93",
    border: isDark ? "#2C2C2E" : "#EFEFEF",
    summaryBg: isDark ? "#1C2A1E" : "#F0FAF4",
    summaryText: isDark ? "#30D158" : "#1A7F3C",
    emptyIcon: isDark ? "#2C2C2E" : "#E5E5EA",
  };

  // ── Cálculo footer ──────────────────────────────────────────────────────────
  const meDebenItems: { nombre: string; monto: number }[] = [];
  const yoDebItems: { nombre: string; monto: number }[] = [];

  gastosComunes.forEach((gasto) => {
    const montoGasto = gasto.monto;
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

  return (
    <RNView style={[styles.container, { backgroundColor: colors.bg }]}>
      <RNView style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <FontAwesome name="chevron-left" size={16} color="#007AFF" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>
          {group?.nombre ?? "Gastos"}
        </Text>
        <RNView style={{ width: 70 }} />
      </RNView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Resumen ── */}
        <RNView style={[styles.summaryCard, { backgroundColor: colors.summaryBg }]}>
          <RNView style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.summaryText }]}>Total gastos</Text>
            <Text style={[styles.summaryValue, { color: colors.summaryText }]}>{fmt(totalGastado)}</Text>
          </RNView>
          <RNView style={[styles.summaryDivider, { backgroundColor: isDark ? "#1A4A2A" : "#C8EDDA" }]} />
          <RNView style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.summaryText }]}>Gastos registrados</Text>
            <Text style={[styles.summaryValue, { color: colors.summaryText }]}>{gastosComunes.length}</Text>
          </RNView>
        </RNView>

        {/* ── Cabecera tabla ── */}
        {gastosComunes.length > 0 && (
          <RNView style={styles.tableHeader}>
            <Text style={[styles.tableHeaderLabel, { color: colors.secondary }]}>Descripción</Text>
            <Text style={[styles.tableHeaderLabelRight, { color: colors.secondary }]}>Monto</Text>
          </RNView>
        )}

        {/* ── Lista gastos ── */}
        {gastosComunes.length === 0 ? (
          <RNView style={styles.emptyState}>
            <RNView style={[styles.emptyIcon, { backgroundColor: colors.emptyIcon }]}>
              <FontAwesome name="inbox" size={28} color={isDark ? "#636366" : "#AEAEB2"} />
            </RNView>
            <Text style={[styles.emptyTitle, { color: colors.primary }]}>Sin gastos este mes</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
              Los gastos que registres aparecerán aquí
            </Text>
          </RNView>
        ) : (
          <RNView style={styles.gastosList}>
            {gastosComunes.map((gasto) => (
            <GastoRowExpandible
              key={gasto.id}
              gasto={gasto}
              isDark={isDark}
              miembrosMap={miembrosMap}
              userId={user?.id ?? ''}          // 👈
              idGroup={idGroup}                // 👈
              onSaldar={(gastoId, uid) =>      // 👈
                Alert.alert(
                  "Saldar deuda",
                  `¿Confirmas el pago?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, saldé", onPress: () => saldarDeuda(idGroup, gastoId, uid) },
                  ]
                )
              }
              onEliminar={() => deleteGastoComun(idGroup, gasto.id)}
              onEditar={() => Alert.alert("Editar", `Editar "${gasto.descripcion}"`)}
            />
          ))}
          </RNView>
        )}

        {/* ── Footer resumen deudas ── */}
        {(meDebenItems.length > 0 || yoDebItems.length > 0) && (
          <RNView style={[styles.footerCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF", borderColor: isDark ? "#2C2C2E" : "#EFEFEF" }]}>
            <Text style={[styles.footerTitle, { color: colors.primary }]}>Tu resumen</Text>

            {/* Te deben */}
            {meDebenItems.length > 0 && (
              <RNView style={styles.footerSection}>
                <RNView style={styles.footerSectionHeader}>
                  <RNView style={[styles.footerDot, { backgroundColor: "#30D158" }]} />
                  <Text style={[styles.footerSectionTitle, { color: "#30D158" }]}>Te deben</Text>
                  <Text style={[styles.footerSectionTotal, { color: "#30D158" }]}>{fmt(totalMeDeben)}</Text>
                </RNView>
                {meDebenItems.map((item, i) => (
                  <RNView key={i} style={styles.footerRow}>
                    <Text style={[styles.footerRowNombre, { color: isDark ? "#EBEBF5" : "#3C3C43" }]}>{item.nombre}</Text>
                    <Text style={[styles.footerRowMonto, { color: "#30D158" }]}>+{fmt(item.monto)}</Text>
                  </RNView>
                ))}
              </RNView>
            )}

            {/* Debes */}
           {yoDebItems.length > 0 && (
  <RNView style={[
    styles.footerSection,
    meDebenItems.length > 0 && { borderTopWidth: 0.5, borderTopColor: isDark ? "#2C2C2E" : "#F0F0F0", paddingTop: 12 }
  ]}>
    <RNView style={styles.footerSectionHeader}>
      <RNView style={[styles.footerDot, { backgroundColor: "#FF453A" }]} />
      <Text style={[styles.footerSectionTitle, { color: "#FF453A" }]}>Debes</Text>
      <Text style={[styles.footerSectionTotal, { color: "#FF453A" }]}>−{fmt(totalYoDebo)}</Text>
    </RNView>

    {yoDebItems.map((item, i) => (
      <RNView key={i} style={styles.footerRow}>
        <Text style={[styles.footerRowNombre, { color: isDark ? "#EBEBF5" : "#3C3C43" }]}>a {item.nombre}</Text>
        <Text style={[styles.footerRowMonto, { color: "#FF453A" }]}>−{fmt(item.monto)}</Text>
      </RNView>
    ))}

    {/* ── Botón saldar todo ── */}
    <Pressable
      style={({ pressed }) => [
        styles.saldarTodoBtn,
        { 
          backgroundColor: isDark ? '#0A3A1F' : '#E8F8EF',
          opacity: pressed ? 0.7 : 1 
        }
      ]}
      onPress={() =>
        Alert.alert(
          "Saldar todas las deudas",
          `¿Confirmas que pagaste ${fmt(totalYoDebo)} en total?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Sí, saldé todo",
              onPress: () => saldarTodasDeudas(idGroup, user!.id),
            },
          ]
        )
      }
    >
      <FontAwesome name="check-circle" size={14} color="#30D158" />
      <Text style={styles.saldarTodoBtnText}>Saldar todas mis deudas · {fmt(totalYoDebo)}</Text>
    </Pressable>
  </RNView>
)}

            {/* Balance neto — solo si hay ambos */}
            {meDebenItems.length > 0 && yoDebItems.length > 0 && (
              <RNView style={[styles.footerBalance, { borderTopColor: isDark ? "#2C2C2E" : "#F0F0F0", backgroundColor: isDark ? "#252528" : "#F8F9FB" }]}>
                <Text style={[styles.footerBalanceLabel, { color: isDark ? "#8E8E93" : "#8E8E93" }]}>Balance neto</Text>
                <Text style={[styles.footerBalanceValue, { color: netoColor }]}>
                  {neto >= 0 ? '+' : ''}{fmt(neto)}
                </Text>
              </RNView>
            )}
          </RNView>
        )}
      </ScrollView>
    </RNView>
  );
}

const CATEGORIA_EMOJI: Record<string, string> = {
  Alquiler: "🏠",
  Supermercado: "🛒",
  Servicios: "⚡",
  Ocio: "🎉",
  Gimnasio: "💪",
  Transporte: "🚗",
  Salud: "🏥",
  Mascota: "🐾",
  Electrodomésticos: "🔌",
  Otros: "💰",
};

const styles = StyleSheet.create({
  container: { flex: 1},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, width: 70 },
  backText: { color: "#007AFF", fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  scroll: { padding: 16, paddingBottom: 48 },
  summaryCard: {
    flexDirection: "row", borderRadius: 16, padding: 16, marginBottom: 20, alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4, letterSpacing: 0.3 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryDivider: { width: 0.5, height: 36, marginHorizontal: 8 },
  tableHeader: {
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 8,
  },
  tableHeaderLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  tableHeaderLabelRight: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  gastosList: { gap: 10 },
  gastoCard: { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },
  gastoMainRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  categoriaIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  categoriaEmoji: { fontSize: 20 },
  gastoInfoCenter: { flex: 1, gap: 3 },
  gastoDescripcion: { fontSize: 15, fontWeight: "600" },
  gastoMeta: { flexDirection: "row", alignItems: "center" },
  gastoCategoria: { fontSize: 12 },
  gastoDot: { fontSize: 12 },
  gastoRight: { alignItems: "flex-end", gap: 4 },
  gastoMonto: { fontSize: 15, fontWeight: "700" },
  chevron: { marginTop: 2 },
  expandedPanel: { padding: 14, borderTopWidth: 0.5, gap: 14 },
  expandLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
  pagadorRow: { gap: 6 },
  pagadorBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  pagadorBadgeText: { fontSize: 13, fontWeight: "600" },
  deudasSection: { gap: 6 },
  deudaRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 10, borderRadius: 10, borderWidth: 0.5,
  },
  deudaLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  deudaAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  deudaAvatarText: { fontSize: 14, fontWeight: "700" },
  deudaNombre: { fontSize: 14, fontWeight: "600" },
  deudaPagadorTag: { fontSize: 11, fontWeight: "600" },
  deudaRight: { alignItems: "flex-end" },
  deudaMonto: { fontSize: 14, fontWeight: "700" },
  deudaOwesLabel: { fontSize: 11, marginTop: 1 },
  accionesRow: { flexDirection: "row", gap: 10 },
  accionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  accionBtnTextEdit: { color: "#3A7BFF", fontSize: 13, fontWeight: "600" },
  accionBtnTextDelete: { color: "#FF453A", fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  footerCard: { borderRadius: 16, borderWidth: 0.5, overflow: "hidden", marginTop: 20 },
  footerTitle: { fontSize: 15, fontWeight: "700", padding: 14, paddingBottom: 10 },
  footerSection: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  footerSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  footerDot: { width: 8, height: 8, borderRadius: 4 },
  footerSectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", flex: 1 },
  footerSectionTotal: { fontSize: 14, fontWeight: "800" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  footerRowNombre: { fontSize: 13 },
  footerRowMonto: { fontSize: 13, fontWeight: "700" },
  footerBalance: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 0.5, padding: 14,
  },
  footerBalanceLabel: { fontSize: 13, fontWeight: "600" },
  footerBalanceValue: { fontSize: 18, fontWeight: "800" },
  saldadoTag: {
  fontSize: 10,
  fontWeight: '700',
  color: '#30D158',
  letterSpacing: 0.3,
},
saldarBtn: {
  marginTop: 6,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
  backgroundColor: '#30D15820',
},
saldarBtnText: {
  fontSize: 11,
  fontWeight: '700',
  color: '#30D158',
},
saldarTodoBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 8,
  paddingVertical: 12,
  borderRadius: 12,
},
saldarTodoBtnText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#30D158',
},
});