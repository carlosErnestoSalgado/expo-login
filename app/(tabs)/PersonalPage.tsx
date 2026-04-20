import React, { useState, useMemo } from 'react';
import {
  StyleSheet, ScrollView, Image, Pressable,
  View as RNView, Alert,
} from 'react-native';
import { useAuthStore } from '@/storage/useAuthStorage';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/Themed';
import ModalGastoPersonal from '@/components/ModalPersonal';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '@/components/card';
import SectionTitle from '@/components/sectiontitle';
import StatRow from '@/components/statrow';

const fmt = (n: number) =>
  Math.round(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  // ── Selectores atómicos — cada uno retorna un valor primitivo o referencia estable ──
  const user = useAuthStore((s) => s.user);
  const allGroups = useAuthStore((s) => s.groups);
  const gastosPersonales = useAuthStore((s) => s.user?.gastosPersonales ?? []);
  const saldarTodasDeudas = useAuthStore((s) => s.saldarTodasDeudas);

  const userId = user?.id ?? '';
  const salario = user?.salario ?? 0;

// ── Cálculos derivados con useMemo ──────────────────────────────────────────
const { groups, totalYoDebEnGrupos, totalMeDebenEnGrupos, totalPagadoPorMi, gastosPorGrupo, totalReembolsado } = useMemo(() => {
  const misGrupos = allGroups.filter(g => g.members.includes(userId));

  let totalYoDebo = 0;
  let totalMeDeben = 0;
  let totalPagadoPorMi = 0;
  let totalReembolsado = 0;

  const desglose: { grupoId: string; grupoNombre: string; monto: number; meDeben: number }[] = [];

  misGrupos.forEach((group) => {
    let yoDebo = 0;
    let meDeben = 0;

    (group.gastosDelGrupo ?? []).forEach((gasto) => {
      const montoGasto = parseMonto(gasto.monto);

      if (gasto.quienPago === userId) {
        totalPagadoPorMi += montoGasto;

        // ✅ += para acumular, y excluir al pagador (userId) del reembolso
        totalReembolsado += (gasto.deuda ?? []).reduce((acc, d) => {
          if (d.user_id !== userId && !d.deudaMiembro) {
            // Ya me pagó este miembro — sumo lo que me reembolsó
            return acc + Number(d.debe) * montoGasto;
          }
          return acc;
        }, 0);
      }

      (gasto.deuda ?? []).forEach((deuda) => {
        const montoReal = Number(deuda.debe) * montoGasto;

        if (deuda.user_id === userId && deuda.deudaMiembro) {
          yoDebo += montoReal;
        }

        if (gasto.quienPago === userId && deuda.user_id !== userId && deuda.deudaMiembro) {
          meDeben += montoReal;
        }
      });
    });

    totalYoDebo += yoDebo;
    totalMeDeben += meDeben;

    if (yoDebo > 0 || meDeben > 0) {
      desglose.push({ grupoId: group.id, grupoNombre: group.nombre, monto: yoDebo, meDeben });
    }
  });

  return {
    groups: misGrupos,
    totalYoDebEnGrupos: totalYoDebo,
    totalMeDebenEnGrupos: totalMeDeben,
    totalPagadoPorMi,
    gastosPorGrupo: desglose,
    totalReembolsado,
  };
}, [allGroups, userId]);
  const totalGastadoPersonal = useMemo(
    () => gastosPersonales.reduce((s, g) => s + parseMonto(g.monto), 0),
    [gastosPersonales]
  );


// ── Saldo correcto ────────────────────────────────────────────────────────────
// Salario
// - gastos personales (lo mío)
// - lo que pagué por el grupo completo (salió de mi bolsillo)
// - lo que aún debo a otros en el grupo
// + lo que me van a devolver (aún pendiente)
const saldo = salario
  - totalGastadoPersonal
  - totalPagadoPorMi    // pagué esto del grupo completo
  - totalYoDebEnGrupos  // aún debo esto
  - totalReembolsado; // esto me van a devolver


 
  const saldoColor = saldo >= 0 ? '#34C759' : '#FF3B30';

  const iniciales = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const colors = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#2C2C2E' : '#F0F0F0',
    primary: isDark ? '#FFFFFF' : '#1A1A1A',
    label: isDark ? '#8E8E93' : '#8E8E93',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar ────────────────────────────────────────────────────────── */}
      <RNView style={styles.header}>
        {user?.foto ? (
          <Image source={{ uri: user.foto }} style={styles.avatar} />
        ) : (
          <RNView style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </RNView>
        )}
        <Text style={styles.userName} lightColor="#1A1A1A" darkColor="#FFF">
          {user?.name ?? 'Usuario'}
        </Text>
        <Text style={styles.userEmail} lightColor="#888" darkColor="#666">
          {user?.email ?? ''}
        </Text>
      </RNView>

      {/* ── Resumen financiero ────────────────────────────────────────────── */}
      <SectionTitle text="Resumen del mes" />
      <Card>
  <StatRow label="Salario mensual" value={fmt(salario)} />
  <RNView style={styles.divider} />
  <StatRow label="Gastos personales" value={fmt(totalGastadoPersonal)} valueColor="#FF9500" />
  {totalPagadoPorMi > 0 && (
    <>
      <RNView style={styles.divider} />
      <StatRow label="Pagado por el grupo" value={fmt(totalPagadoPorMi)} valueColor="#FF9500" />
    </>
  )}
  {totalReembolsado > 0 && (
    <>
      <RNView style={styles.divider} />
      <StatRow label="Reembolsado" value={fmt(totalReembolsado)} valueColor="#30D158" />
    </>
  )}
  <RNView style={styles.divider} />
  <StatRow
    label="Saldo actual"
    value={fmt(salario - totalGastadoPersonal - totalPagadoPorMi + totalReembolsado)}
    valueColor="#007AFF"
  />
  {totalYoDebEnGrupos > 0 && (
    <>
      <RNView style={styles.divider} />
      <StatRow label="⚠ Comprometido (debes)" value={fmt(totalYoDebEnGrupos)} valueColor="#FF453A" />
      <RNView style={styles.divider} />
      <StatRow
        label="Disponible real"
        value={fmt(salario - totalGastadoPersonal - totalPagadoPorMi + totalReembolsado - totalYoDebEnGrupos)}
        valueColor={
          salario - totalGastadoPersonal - totalPagadoPorMi + totalReembolsado - totalYoDebEnGrupos >= 0
            ? '#34C759' : '#FF3B30'
        }
      />
    </>
  )}
</Card>

      {/* ── Desglose por grupo ────────────────────────────────────────────── */}
      {gastosPorGrupo.length > 0 && (
        <>
          <SectionTitle text="Desglose por grupo" />
          <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {gastosPorGrupo.map((g, i) => {
              const neto = g.meDeben - g.monto;
              const netoColor = neto >= 0 ? '#30D158' : '#FF453A';

              return (
                <RNView key={g.grupoId}>
                  <RNView style={styles.grupoRow}>
                    <RNView style={[styles.grupoIconWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                      <Text style={{ fontSize: 16 }}>🏠</Text>
                    </RNView>
                    <RNView style={{ flex: 1 }}>
                      <Text style={[styles.grupoNombre, { color: colors.primary }]}>{g.grupoNombre}</Text>
                      <RNView style={styles.grupoDetalles}>
                        {g.monto > 0 && (
                          <Text style={styles.grupoDebes}>Debes {fmt(g.monto)}</Text>
                        )}
                        {g.meDeben > 0 && (
                          <Text style={styles.grupoTeDeben}>Te deben {fmt(g.meDeben)}</Text>
                        )}
                      </RNView>
                    </RNView>
                    <RNView style={[styles.netoBadge, {
                      backgroundColor: neto >= 0
                        ? (isDark ? '#0A3A1F' : '#E8F8EF')
                        : (isDark ? '#3A1515' : '#FFF0F0'),
                    }]}>
                      <Text style={[styles.netoValue, { color: netoColor }]}>
                        {neto >= 0 ? '+' : ''}{fmt(neto)}
                      </Text>
                      <Text style={[styles.netoLabel, { color: netoColor }]}>neto</Text>
                    </RNView>
                  </RNView>

                  {g.monto > 0 && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.saldarGrupoBtn,
                        {
                          backgroundColor: isDark ? '#0A3A1F' : '#E8F8EF',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      onPress={() =>
                        Alert.alert(
                          "Saldar deudas",
                          `¿Confirmas que pagaste ${fmt(g.monto)} en ${g.grupoNombre}?`,
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Sí, saldé todo",
                              onPress: () => saldarTodasDeudas(g.grupoId, userId),
                            },
                          ]
                        )
                      }
                    >
                      <FontAwesome name="check-circle" size={13} color="#30D158" />
                      <Text style={styles.saldarGrupoBtnText}>
                        Saldar {fmt(g.monto)} en {g.grupoNombre}
                      </Text>
                    </Pressable>
                  )}

                  {i < gastosPorGrupo.length - 1 && (
                    <RNView style={[styles.divider, { marginHorizontal: 14 }]} />
                  )}
                </RNView>
              );
            })}
          </RNView>
        </>
      )}

      {/* ── Mis grupos ────────────────────────────────────────────────────── */}
      {groups.length > 0 && (
        <>
          <SectionTitle text="Mis grupos" />
          <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {groups.map((g, i) => (
              <RNView key={g.id}>
                <Pressable
                  style={styles.grupoRow}
                  onPress={() => router.push({ pathname: '/ViewerGroup', params: { idGroup: g.id } })}
                >
                  <RNView style={[styles.grupoIconWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                    <Text style={{ fontSize: 16 }}>{g.nombre.charAt(0).toUpperCase()}</Text>
                  </RNView>
                  <RNView style={{ flex: 1 }}>
                    <Text style={[styles.grupoNombre, { color: colors.primary }]}>{g.nombre}</Text>
                    <Text style={[styles.grupoDesc, { color: colors.label }]}>{g.descripcion}</Text>
                  </RNView>
                  <FontAwesome name="chevron-right" size={12} color={colors.label} />
                </Pressable>
                {i < groups.length - 1 && (
                  <RNView style={[styles.divider, { marginHorizontal: 14 }]} />
                )}
              </RNView>
            ))}
          </RNView>
        </>
      )}

      {/* ── Acciones ──────────────────────────────────────────────────────── */}
      <SectionTitle text="Acciones" />

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome name="plus" size={16} color="#FFF" />
        <Text style={styles.ctaBtnText}>Agregar gasto personal</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, styles.ctaBtnOutline, pressed && styles.ctaPressed]}
        onPress={() => router.push('/ViewerGastos')}
      >
        <FontAwesome name="list" size={16} color="#007AFF" />
        <Text style={[styles.ctaBtnText, { color: '#007AFF' }]}>Ver mis gastos</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, styles.ctaBtnOutline, { borderColor: '#ff0000' }, pressed && styles.ctaPressed]}
        onPress={() => router.push('/DebugPage')}
      >
        <FontAwesome name="bug" size={16} color="#ff0000" />
        <Text style={[styles.ctaBtnText, { color: '#ff0000' }]}>Debug</Text>
      </Pressable>
      
      <ModalGastoPersonal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 10 },

  card: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', marginBottom: 12 },
  divider: { height: 0.5, backgroundColor: '#F0F0F0' },

  grupoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  grupoIconWrapper: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  grupoNombre: { fontSize: 15, fontWeight: '600' },
  grupoDesc: { fontSize: 12, marginTop: 1 },
  grupoDetalles: { flexDirection: 'row', gap: 10, marginTop: 2 },
  grupoDebes: { fontSize: 12, fontWeight: '600', color: '#FF453A' },
  grupoTeDeben: { fontSize: 12, fontWeight: '600', color: '#30D158' },

  netoBadge: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 70 },
  netoValue: { fontSize: 13, fontWeight: '800' },
  netoLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  saldarGrupoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 14, marginBottom: 12,
    paddingVertical: 10, borderRadius: 10,
  },
  saldarGrupoBtnText: { fontSize: 13, fontWeight: '700', color: '#30D158' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#007AFF', height: 54, borderRadius: 16,
    marginTop: 8, marginBottom: 12, elevation: 4,
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ctaBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#007AFF', elevation: 0, shadowOpacity: 0 },
  ctaPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});