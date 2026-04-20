import { useState } from 'react';
import { ScrollView, StyleSheet, Pressable, View as RNView, useColorScheme, Platform } from 'react-native';
import { Text } from '../components/Themed';
import { useAuthStore } from '@/storage/useAuthStorage';
import { GastoPersonal } from '@/storage/types';
import ModalGastoPersonal from '@/components/ModalPersonal';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const CATEGORIA_EMOJI: Record<string, string> = {
  Ropa: '👕', Familia: '👨‍👩‍👧', 'Comida personal': '🍔',
  Suscripciones: '📱', 'Cuidado personal': '💆', Educacion: '📚',
  Entretenimiento: '🎬', 'Ahorro individual': '💰', Otros: '💰',
};

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

function fmt(n: number): string {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function ViewerGastos() {
  const gastosPersonales = useAuthStore((s) => s.user?.gastosPersonales ?? []);
  const deleteGasto = useAuthStore((s) => s.deleteGastoPersonal);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGastoId, setSelectedGastoId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const totalGastado = gastosPersonales.reduce((s, g) => s + parseMonto(g.monto), 0);

  const colors = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#2C2C2E' : '#F0F0F0',
    primary: isDark ? '#FFFFFF' : '#1A1A1A',
    label: isDark ? '#8E8E93' : '#8E8E93',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
    expandBg: isDark ? '#252528' : '#F8F9FB',
    header: isDark ? "#1C1C1E" : "#FFFFFF",
  };

  // Agrupar por categoría para el resumen
  const porCategoria: Record<string, number> = {};
  gastosPersonales.forEach((g) => {
    const cat = g.categoria ?? 'Otros';
    porCategoria[cat] = (porCategoria[cat] ?? 0) + parseMonto(g.monto);
  });

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
                  Gastos Personales
                </Text>
                <RNView style={{ width: 70 }} />
              </RNView>
      <ScrollView
        contentContainerStyle={[styles.scroll]}
        showsVerticalScrollIndicator={false}
      >
         
        {/* ── Título ── */}
        <Text style={[styles.titulo, { color: colors.primary }]}>Mis Gastos</Text>

        {/* ── Resumen total ── */}
        {gastosPersonales.length > 0 && (
          <RNView style={[styles.summaryCard, { backgroundColor: isDark ? '#1C2A3A' : '#EEF4FF' }]}>
            <RNView style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: '#3A7BFF' }]}>Total gastado</Text>
              <Text style={[styles.summaryValue, { color: '#3A7BFF' }]}>{fmt(totalGastado)}</Text>
            </RNView>
            <RNView style={[styles.summaryDivider, { backgroundColor: isDark ? '#1A3A5A' : '#C8D8FF' }]} />
            <RNView style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: '#3A7BFF' }]}>Registros</Text>
              <Text style={[styles.summaryValue, { color: '#3A7BFF' }]}>{gastosPersonales.length}</Text>
            </RNView>
          </RNView>
        )}

        {/* ── Lista de gastos ── */}
        {gastosPersonales.length === 0 ? (
          <RNView style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <RNView style={[styles.emptyIconWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <FontAwesome name="money" size={28} color={isDark ? '#636366' : '#AEAEB2'} />
            </RNView>
            <Text style={[styles.emptyTitle, { color: colors.primary }]}>Sin gastos aún</Text>
            <Text style={[styles.emptySubtitle, { color: colors.label }]}>
              Agrega gastos desde la pantalla Personal
            </Text>
          </RNView>
        ) : (
          <RNView style={styles.lista}>
            {[...gastosPersonales].reverse().map((gasto: GastoPersonal) => {
              const isExpanded = expandedId === gasto.id;
              return (
                <RNView
                  key={gasto.id}
                  style={[styles.gastoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  {/* ── Fila principal ── */}
                  <Pressable
                    style={styles.gastoMainRow}
                    onPress={() => setExpandedId(isExpanded ? null : gasto.id)}
                  >
                    <RNView style={[styles.gastoIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                      <Text style={styles.gastoEmoji}>
                        {CATEGORIA_EMOJI[gasto.categoria] ?? '💰'}
                      </Text>
                    </RNView>

                    <RNView style={styles.gastoInfo}>
                      <Text style={[styles.gastoDesc, { color: colors.primary }]} numberOfLines={1}>
                        {gasto.descripcion}
                      </Text>
                      <Text style={[styles.gastoCat, { color: colors.label }]}>
                        {gasto.categoria}
                      </Text>
                    </RNView>

                    <RNView style={styles.gastoRight}>
                      <Text style={[styles.gastoMonto, { color: '#FF453A' }]}>
                        −{fmt(parseMonto(gasto.monto))}
                      </Text>
                      <FontAwesome
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={11}
                        color={colors.label}
                        style={{ marginTop: 4 }}
                      />
                    </RNView>
                  </Pressable>

                  {/* ── Panel expandido con acciones ── */}
                  {isExpanded && (
                    <RNView style={[styles.expandedPanel, { backgroundColor: colors.expandBg, borderTopColor: colors.border }]}>
                      <Pressable
                        style={[styles.accionBtn, { backgroundColor: isDark ? '#1A2A3A' : '#EEF4FF' }]}
                        onPress={() => {
                          setSelectedGastoId(gasto.id);
                          setModalVisible(true);
                          setExpandedId(null);
                        }}
                      >
                        <FontAwesome name="pencil" size={13} color="#3A7BFF" />
                        <Text style={styles.accionBtnTextEdit}>Editar</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.accionBtn, { backgroundColor: isDark ? '#3A1515' : '#FFF0F0' }]}
                        onPress={() => {
                          deleteGasto(gasto.id);
                          setExpandedId(null);
                        }}
                      >
                        <FontAwesome name="trash" size={13} color="#FF453A" />
                        <Text style={styles.accionBtnTextDelete}>Eliminar</Text>
                      </Pressable>
                    </RNView>
                  )}
                </RNView>
              );
            })}
          </RNView>
        )}

        {/* ── Resumen por categoría ── */}
        {Object.keys(porCategoria).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.label }]}>POR CATEGORÍA</Text>
            <RNView style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {Object.entries(porCategoria)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total], i, arr) => (
                  <RNView key={cat}>
                    <RNView style={styles.catRow}>
                      <Text style={styles.catEmoji}>{CATEGORIA_EMOJI[cat] ?? '💰'}</Text>
                      <Text style={[styles.catNombre, { color: colors.primary }]}>{cat}</Text>
                      <Text style={[styles.catMonto, { color: '#FF453A' }]}>−{fmt(total)}</Text>
                    </RNView>
                    {i < arr.length - 1 && (
                      <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                  </RNView>
                ))}
            </RNView>
          </>
        )}

      </ScrollView>

      <ModalGastoPersonal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelectedGastoId(null); }}
        idGasto={selectedGastoId}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },

  titulo: { fontSize: 28, fontWeight: '800', marginBottom: 20 },

  // Resumen
  summaryCard: {
    flexDirection: 'row', borderRadius: 16, padding: 16,
    marginBottom: 20, alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryDivider: { width: 0.5, height: 36, marginHorizontal: 8 },

  // Section title
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 20, marginLeft: 4,
  },

  // Lista
  lista: { gap: 10 },

  // Tarjeta gasto
  gastoCard: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  gastoMainRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  gastoIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  gastoEmoji: { fontSize: 20 },
  gastoInfo: { flex: 1, gap: 3 },
  gastoDesc: { fontSize: 15, fontWeight: '600' },
  gastoCat: { fontSize: 12 },
  gastoRight: { alignItems: 'flex-end', gap: 4 },
  gastoMonto: { fontSize: 15, fontWeight: '700' },

  // Panel expandido
  expandedPanel: {
    flexDirection: 'row', gap: 10,
    padding: 12, borderTopWidth: 0.5,
  },
  accionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  accionBtnTextEdit: { color: '#3A7BFF', fontSize: 13, fontWeight: '600' },
  accionBtnTextDelete: { color: '#FF453A', fontSize: 13, fontWeight: '600' },

  // Por categoría
  catCard: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  catEmoji: { fontSize: 18 },
  catNombre: { flex: 1, fontSize: 14, fontWeight: '500' },
  catMonto: { fontSize: 14, fontWeight: '700' },

  divider: { height: 0.5, marginHorizontal: 14 },

  // Empty
  emptyState: {
    borderRadius: 14, borderWidth: 0.5, padding: 40,
    alignItems: 'center', gap: 12, marginTop: 8,
  },
  emptyIconWrapper: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
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
  
});