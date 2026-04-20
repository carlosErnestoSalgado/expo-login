import React, { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, View as RNView,
  Pressable, useColorScheme,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/storage/useAuthStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMesActivoId(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${mm}`;
}

function getNombreMes(mesId: string): string {
  const [year, month] = mesId.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  });
}

const CATEGORIA_EMOJI: Record<string, string> = {
  Alquiler: '🏠', Supermercado: '🛒', Servicios: '⚡', Ocio: '🎉',
  Gimnasio: '💪', Transporte: '🚗', Salud: '🏥', Mascota: '🐾',
  Electrodomésticos: '🔌', Ropa: '👕', Familia: '👨‍👩‍👧',
  'Comida personal': '🍔', Suscripciones: '📱', 'Cuidado personal': '💆',
  Educacion: '📚', Entretenimiento: '🎬', 'Ahorro individual': '💰', Otros: '💰',
};

// ── Componentes internos ──────────────────────────────────────────────────────
function SectionTitle({ text, color }: { text: string; color: string }) {
  return (
    <Text style={[styles.sectionTitle, { color }]}>{text.toUpperCase()}</Text>
  );
}

function StatCard({
  label, value, valueColor, isDark,
}: {
  label: string; value: string; valueColor: string; isDark: boolean;
}) {
  return (
    <RNView style={[styles.statCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}>
      <Text style={[styles.statLabel, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </RNView>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function BalanceMensual() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const allGroups = useAuthStore((s) => s.groups);

  //const mesId = getMesActivoId();
  //const nombreMes = getNombreMes(mesId);
  const userId = user?.id ?? '';
  const salario = user?.salario ?? 0;

  const [mesOffset, setMesOffset] = useState(0); // 0 = mes actual, -1 = mes anterior, etc.

const mesId = useMemo(() => {
const now = new Date();
now.setMonth(now.getMonth() + mesOffset);
const mm = String(now.getMonth() + 1).padStart(2, '0');
return `${now.getFullYear()}-${mm}`;
    }, [mesOffset]);

    const nombreMes = getNombreMes(mesId);

  // ── Gastos personales del mes ─────────────────────────────────────────────
  const gastosPersonalesMes = useMemo(() =>
    (user?.gastosPersonales ?? []).filter(g => g.mesId === mesId),
    [user?.gastosPersonales, mesId]
  );

  const totalPersonal = useMemo(() =>
    gastosPersonalesMes.reduce((s, g) => s + parseMonto(g.monto), 0),
    [gastosPersonalesMes]
  );

  // Agrupado por categoría
  const personalPorCategoria = useMemo(() => {
    const acc: Record<string, number> = {};
    gastosPersonalesMes.forEach(g => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + parseMonto(g.monto);
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [gastosPersonalesMes]);

  // ── Gastos grupales del mes ───────────────────────────────────────────────
  const { resumenGrupos, totalPagadoPorMi, totalYoDebo, totalMeDeben, totalReembolsado } = useMemo(() => {
    const misGrupos = allGroups.filter(g => g.members.includes(userId));

    let pagadoPorMi = 0;
    let yoDebo = 0;
    let meDeben = 0;
    let reembolsado = 0;

    const resumen: {
      grupoId: string;
      grupoNombre: string;
      gastos: {
        id: string;
        descripcion: string;
        categoria: string;
        monto: number;
        quienPago: string;
        quienPagoNombre: string;
        miDeuda: number;
        esPagador: boolean;
        saldado: boolean;
      }[];
      totalGastos: number;
      miAporte: number;
      meDeben: number;
      yoDebo: number;
    }[] = [];

    misGrupos.forEach(group => {
      // Solo gastos de este mes
      const gastosMes = (group.gastosDelGrupo ?? []).filter(g => g.fecha === mesId);
      if (gastosMes.length === 0) return;

      const miembrosMap: Record<string, string> = {};
      group.miembros.forEach(m => { miembrosMap[m.userId] = m.nombre; });

      let grupoYoDebo = 0;
      let grupoMeDeben = 0;
      let grupoMiAporte = 0;

      const gastosDetalle = gastosMes.map(gasto => {
        const montoGasto = parseMonto(gasto.monto);
        const esPagador = gasto.quienPago === userId;

        if (esPagador) {
          pagadoPorMi += montoGasto;
          grupoMiAporte += montoGasto;
        }

        let miDeuda = 0;
        let saldado = false;

        (gasto.deuda ?? []).forEach(deuda => {
          const montoReal = Number(deuda.debe) * montoGasto;

          if (deuda.user_id === userId) {
            miDeuda = montoReal;
            saldado = !deuda.deudaMiembro;
            if (deuda.deudaMiembro) {
              yoDebo += montoReal;
              grupoYoDebo += montoReal;
            }
          }

          if (esPagador && deuda.user_id !== userId) {
            if (deuda.deudaMiembro) {
              meDeben += montoReal;
              grupoMeDeben += montoReal;
            } else {
              reembolsado += montoReal;
            }
          }
        });

        return {
          id: gasto.id,
          descripcion: gasto.descripcion,
          categoria: gasto.categoria ?? 'Otros',
          monto: montoGasto,
          quienPago: gasto.quienPago ?? '',
          quienPagoNombre: miembrosMap[gasto.quienPago ?? ''] ?? 'Desconocido',
          miDeuda,
          esPagador,
          saldado,
        };
      });

      resumen.push({
        grupoId: group.id,
        grupoNombre: group.nombre,
        gastos: gastosDetalle,
        totalGastos: gastosMes.reduce((s, g) => s + parseMonto(g.monto), 0),
        miAporte: grupoMiAporte,
        meDeben: grupoMeDeben,
        yoDebo: grupoYoDebo,
      });
    });

    return {
      resumenGrupos: resumen,
      totalPagadoPorMi: pagadoPorMi,
      totalYoDebo: yoDebo,
      totalMeDeben: meDeben,
      totalReembolsado: reembolsado,
    };
  }, [allGroups, userId, mesId]);

  // ── Saldo final ───────────────────────────────────────────────────────────
  const saldoActual = salario - totalPersonal - totalPagadoPorMi + totalReembolsado;
  const saldoDisponible = saldoActual - totalYoDebo;
  const saldoColor = saldoDisponible >= 0 ? '#34C759' : '#FF3B30';

  const colors = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#2C2C2E' : '#F0F0F0',
    primary: isDark ? '#FFFFFF' : '#1A1A1A',
    label: isDark ? '#8E8E93' : '#8E8E93',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
  };

  // ── Estado para expandir grupos ───────────────────────────────────────────
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({});
  const toggleGrupo = (id: string) =>
    setExpandedGrupos(prev => ({ ...prev, [id]: !prev[id] }));
  // ── Estado para el mes seleccionado ──────────────────────────────────────────

  return (
    <RNView style={[styles.container, { backgroundColor: colors.bg }]}>
     {/* Header */}
<RNView style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top }]}>
  <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
    <FontAwesome name="chevron-left" size={16} color="#007AFF" />
    <Text style={styles.backText}>Volver</Text>
  </Pressable>

  <RNView style={styles.headerCenter}>
    <Text style={[styles.headerTitle, { color: colors.primary }]}>Balance mensual</Text>
    
    {/* Selector de mes */}
    <RNView style={styles.mesSelector}>
      <Pressable
        onPress={() => setMesOffset(prev => prev - 1)}
        hitSlop={12}
        style={styles.mesSelectorBtn}
      >
        <FontAwesome name="chevron-left" size={12} color="#007AFF" />
      </Pressable>

      <Text style={[styles.mesNombre, { color: colors.primary }]}>{nombreMes}</Text>

      {/* Solo mostrar flecha derecha si no es el mes actual */}
      <Pressable
        onPress={() => setMesOffset(prev => prev + 1)}
        hitSlop={12}
        style={[styles.mesSelectorBtn, { opacity: mesOffset >= 0 ? 0.3 : 1 }]}
        disabled={mesOffset >= 0}
      >
        <FontAwesome name="chevron-right" size={12} color="#007AFF" />
      </Pressable>
    </RNView>
  </RNView>

  <RNView style={{ width: 70 }} />
</RNView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Resumen general ── */}
        <SectionTitle text="Resumen general" color={colors.label} />
        <RNView style={styles.statsGrid}>
          <StatCard label="Salario" value={fmt(salario)} valueColor="#007AFF" isDark={isDark} />
          <StatCard label="Gastos personales" value={fmt(totalPersonal)} valueColor="#FF9500" isDark={isDark} />
          {totalPagadoPorMi > 0 && (
            <StatCard label="Pagado en grupos" value={fmt(totalPagadoPorMi)} valueColor="#FF9500" isDark={isDark} />
          )}
          {totalReembolsado > 0 && (
            <StatCard label="Reembolsado" value={fmt(totalReembolsado)} valueColor="#30D158" isDark={isDark} />
          )}
          {totalYoDebo > 0 && (
            <StatCard label="Aún debes" value={fmt(totalYoDebo)} valueColor="#FF453A" isDark={isDark} />
          )}
          {totalMeDeben > 0 && (
            <StatCard label="Te deben aún" value={fmt(totalMeDeben)} valueColor="#30D158" isDark={isDark} />
          )}
        </RNView>

        {/* Saldo final */}
        <RNView style={[styles.saldoCard, {
          backgroundColor: saldoDisponible >= 0
            ? (isDark ? '#0A3A1F' : '#E8F8EF')
            : (isDark ? '#3A1515' : '#FFF0F0')
        }]}>
          <RNView>
            <Text style={[styles.saldoLabel, { color: saldoColor }]}>Saldo disponible</Text>
            <Text style={[styles.saldoSub, { color: saldoColor }]}>
              {totalYoDebo > 0 ? `Incluye ${fmt(totalYoDebo)} que aún debes` : 'Todas las deudas al día'}
            </Text>
          </RNView>
          <Text style={[styles.saldoValue, { color: saldoColor }]}>{fmt(saldoDisponible)}</Text>
        </RNView>

        {/* ── Gastos personales del mes ── */}
        {gastosPersonalesMes.length > 0 && (
          <>
            <SectionTitle text="Gastos personales" color={colors.label} />
            <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Por categoría */}
              {personalPorCategoria.map(([cat, total], i) => (
                <RNView key={cat}>
                  <RNView style={styles.catRow}>
                    <Text style={styles.catEmoji}>{CATEGORIA_EMOJI[cat] ?? '💰'}</Text>
                    <Text style={[styles.catNombre, { color: colors.primary }]}>{cat}</Text>
                    <Text style={[styles.catMonto, { color: '#FF453A' }]}>−{fmt(total)}</Text>
                  </RNView>
                  {i < personalPorCategoria.length - 1 && (
                    <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </RNView>
              ))}
              {/* Total */}
              <RNView style={[styles.totalRow, { borderTopColor: colors.border, backgroundColor: isDark ? '#252528' : '#F8F9FB' }]}>
                <Text style={[styles.totalLabel, { color: colors.label }]}>Total personal</Text>
                <Text style={[styles.totalValue, { color: '#FF453A' }]}>−{fmt(totalPersonal)}</Text>
              </RNView>
            </RNView>
          </>
        )}

        {gastosPersonalesMes.length === 0 && (
          <>
            <SectionTitle text="Gastos personales" color={colors.label} />
            <RNView style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={{ fontSize: 28 }}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.label }]}>Sin gastos personales este mes</Text>
            </RNView>
          </>
        )}

        {/* ── Gastos por grupo ── */}
        {resumenGrupos.length > 0 && (
          <>
            <SectionTitle text="Gastos en grupos" color={colors.label} />
            {resumenGrupos.map(grupo => (
              <RNView key={grupo.grupoId} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginBottom: 10 }]}>
                {/* Cabecera del grupo */}
                <Pressable
                  style={styles.grupoHeader}
                  onPress={() => toggleGrupo(grupo.grupoId)}
                >
                  <RNView style={[styles.grupoIconWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                    <Text style={{ fontSize: 16 }}>🏠</Text>
                  </RNView>
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.grupoNombre, { color: colors.primary }]}>{grupo.grupoNombre}</Text>
                    <RNView style={styles.grupoMeta}>
                      {grupo.yoDebo > 0 && (
                        <Text style={styles.grupoDebes}>Debes {fmt(grupo.yoDebo)}</Text>
                      )}
                      {grupo.meDeben > 0 && (
                        <Text style={styles.grupoTeDeben}>Te deben {fmt(grupo.meDeben)}</Text>
                      )}
                    </RNView>
                  </RNView>
                  <RNView style={styles.grupoRight}>
                    <Text style={[styles.grupoTotal, { color: colors.primary }]}>{fmt(grupo.totalGastos)}</Text>
                    <FontAwesome
                      name={expandedGrupos[grupo.grupoId] ? 'chevron-up' : 'chevron-down'}
                      size={11}
                      color={colors.label}
                    />
                  </RNView>
                </Pressable>

                {/* Detalle de gastos del grupo */}
                {expandedGrupos[grupo.grupoId] && (
                  <RNView style={[styles.grupoDetalle, { borderTopColor: colors.border }]}>
                    {grupo.gastos.map((gasto, i) => (
                      <RNView key={gasto.id}>
                        <RNView style={styles.gastoGrupoRow}>
                          <RNView style={[styles.gastoGrupoIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                            <Text style={{ fontSize: 16 }}>{CATEGORIA_EMOJI[gasto.categoria] ?? '💰'}</Text>
                          </RNView>
                          <RNView style={{ flex: 1 }}>
                            <Text style={[styles.gastoGrupoDesc, { color: colors.primary }]} numberOfLines={1}>
                              {gasto.descripcion}
                            </Text>
                            <Text style={[styles.gastoGrupoPagador, { color: colors.label }]}>
                              Pagó: {gasto.quienPagoNombre}
                            </Text>
                          </RNView>
                          <RNView style={styles.gastoGrupoRight}>
                            <Text style={[styles.gastoGrupoTotal, { color: colors.primary }]}>{fmt(gasto.monto)}</Text>
                            {gasto.esPagador ? (
                              <Text style={styles.gastoGrupoPagadorTag}>Tú pagaste</Text>
                            ) : gasto.saldado ? (
                              <Text style={styles.gastoGrupoSaldado}>✓ Saldado</Text>
                            ) : (
                              <Text style={styles.gastoGrupoDeuda}>−{fmt(gasto.miDeuda)}</Text>
                            )}
                          </RNView>
                        </RNView>
                        {i < grupo.gastos.length - 1 && (
                          <RNView style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 12 }]} />
                        )}
                      </RNView>
                    ))}

                    {/* Resumen del grupo */}
                    <RNView style={[styles.totalRow, { borderTopColor: colors.border, backgroundColor: isDark ? '#252528' : '#F8F9FB' }]}>
                      <Text style={[styles.totalLabel, { color: colors.label }]}>Mi parte neta</Text>
                      <Text style={[styles.totalValue, { color: grupo.yoDebo > 0 ? '#FF453A' : '#30D158' }]}>
                        {grupo.yoDebo > 0 ? `−${fmt(grupo.yoDebo)}` : grupo.meDeben > 0 ? `+${fmt(grupo.meDeben)}` : 'Al día ✓'}
                      </Text>
                    </RNView>
                  </RNView>
                )}
              </RNView>
            ))}
          </>
        )}

        {resumenGrupos.length === 0 && (
          <>
            <SectionTitle text="Gastos en grupos" color={colors.label} />
            <RNView style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={{ fontSize: 28 }}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.label }]}>Sin gastos grupales este mes</Text>
            </RNView>
          </>
        )}

      </ScrollView>
    </RNView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70, paddingBottom: 2 },
  backText: { color: '#007AFF', fontSize: 15 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 48 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 20, marginLeft: 4,
  },

  // Grid de stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 0.5,
    padding: 12, gap: 4,
  },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800' },

  // Saldo
  saldoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 16, marginBottom: 4,
  },
  saldoLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  saldoSub: { fontSize: 11 },
  saldoValue: { fontSize: 24, fontWeight: '800' },

  // Card
  card: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', marginBottom: 4 },

  // Categorías
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  catEmoji: { fontSize: 18 },
  catNombre: { flex: 1, fontSize: 14, fontWeight: '500' },
  catMonto: { fontSize: 14, fontWeight: '700' },

  divider: { height: 0.5 },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14, borderTopWidth: 0.5,
  },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 15, fontWeight: '800' },

  // Empty
  emptyCard: {
    borderRadius: 14, borderWidth: 0.5, padding: 32,
    alignItems: 'center', gap: 8, marginBottom: 4,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Grupos
  grupoHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  grupoIconWrapper: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  grupoNombre: { fontSize: 15, fontWeight: '600' },
  grupoMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  grupoDebes: { fontSize: 11, fontWeight: '600', color: '#FF453A' },
  grupoTeDeben: { fontSize: 11, fontWeight: '600', color: '#30D158' },
  grupoRight: { alignItems: 'flex-end', gap: 4 },
  grupoTotal: { fontSize: 14, fontWeight: '700' },

  grupoDetalle: { borderTopWidth: 0.5 },

  gastoGrupoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  gastoGrupoIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  gastoGrupoDesc: { fontSize: 13, fontWeight: '600' },
  gastoGrupoPagador: { fontSize: 11, marginTop: 1 },
  gastoGrupoRight: { alignItems: 'flex-end' },
  gastoGrupoTotal: { fontSize: 13, fontWeight: '600' },
  gastoGrupoPagadorTag: { fontSize: 10, fontWeight: '700', color: '#007AFF' },
  gastoGrupoSaldado: { fontSize: 10, fontWeight: '700', color: '#30D158' },
  gastoGrupoDeuda: { fontSize: 11, fontWeight: '700', color: '#FF453A' },
  mesSelector: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginTop: 4,
},
mesSelectorBtn: {
  padding: 4,
},
mesNombre: {
  fontSize: 13,
  fontWeight: '600',
  minWidth: 100,
  textAlign: 'center',
},
});