import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Image, Pressable,
  Platform, View as RNView,
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

const fmt = (n: number) => Math.round(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function parseMonto(n: number | string | undefined): number {
  return Number(String(n ?? 0).replace(/\./g, ''));
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 100 ? '#34C759' : percent >= 50 ? '#007AFF' : '#FF9500';
  return (
    <RNView style={styles.progressTrack}>
      <RNView style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
    </RNView>
  );
}

const CATEGORIA_EMOJI: Record<string, string> = {
  Alquiler: '🏠', Supermercado: '🛒', Servicios: '⚡', Ocio: '🎉',
  Gimnasio: '💪', Transporte: '🚗', Salud: '🏥', Mascota: '🐾',
  Electrodomésticos: '🔌', Ropa: '👕', Familia: '👨‍👩‍👧', 'Comida personal': '🍔',
  Suscripciones: '📱', 'Cuidado personal': '💆', Educacion: '📚',
  Entretenimiento: '🎬', 'Ahorro individual': '💰', Otros: '💰',
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  // ✅ También válido si getGroupByUser existe en el store
  const getGroup = useAuthStore((s) => s.getGroupByUser);
  const groups = getGroup() ?? [];

  const [modalVisible, setModalVisible] = useState(false);

  const salario = user?.salario ?? 0;
  const gastosPersonales = user?.gastosPersonales ?? [];

  // ── Gastos personales ──────────────────────────────────────────────────────
  const totalGastadoPersonal = gastosPersonales.reduce((s, g) => s + parseMonto(g.monto), 0);

  // ── Gastos en grupos (lo que YO debo) ─────────────────────────────────────
  const gastosPorGrupo: { grupoNombre: string; monto: number; meDeben: number }[] = [];
  let totalYoDebEnGrupos = 0;
  let totalMeDebenEnGrupos = 0;

  groups.forEach((group) => {
    let yoDebo = 0;
    let meDeben = 0;
    const miembrosMap: Record<string, string> = {};
    group.miembros.forEach((m) => { miembrosMap[m.userId] = m.nombre; });

    (group.gastosDelGrupo ?? []).forEach((gasto) => {
      const montoGasto = parseMonto(gasto.monto);
      (gasto.deuda ?? []).forEach((deuda) => {
        const montoReal = Number(deuda.debe) * montoGasto;
        if (deuda.user_id === user?.id && deuda.deudaMiembro) {
          yoDebo += montoReal;
        }
        if (gasto.quienPago === user?.id && deuda.user_id !== user?.id && deuda.deudaMiembro) {
          meDeben += montoReal;
        }
      });
    });

    totalYoDebEnGrupos += yoDebo;
    totalMeDebenEnGrupos += meDeben;
    if (yoDebo > 0 || meDeben > 0) {
      gastosPorGrupo.push({ grupoNombre: group.nombre, monto: yoDebo, meDeben });
    }
  });

  const totalGastadoReal = totalGastadoPersonal + totalYoDebEnGrupos;
  const saldo = salario - totalGastadoReal + totalMeDebenEnGrupos;
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
        <RNView style={styles.divider} />
        <StatRow label="Saldo estimado" value={fmt(saldo)} valueColor={saldoColor} />
      </Card>

  {/* ── Desglose por grupo ────────────────────────────────────────────── */}
{gastosPorGrupo.length > 0 && (
  <>
    <SectionTitle text="Desglose por grupo" />
    <RNView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {gastosPorGrupo.map((g, i) => {
        const neto = g.meDeben - g.monto;
        const netoColor = neto >= 0 ? '#30D158' : '#FF453A';
        const netoLabel = neto >= 0 ? `Te deben ${fmt(neto)}` : `Debes ${fmt(Math.abs(neto))}`;

        return (
          <RNView key={i}>
            <RNView style={styles.grupoRow}>
              <RNView style={[styles.grupoIconWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                <Text style={{ fontSize: 16 }}>🏠</Text>
              </RNView>
              <RNView style={{ flex: 1 }}>
                <Text style={[styles.grupoNombre, { color: colors.primary }]}>{g.grupoNombre}</Text>
                <RNView style={styles.grupoDetalles}>
                  <Text style={[styles.netoText, { color: netoColor }]}>Balance Neto: </Text>
                  <Text style={[styles.netoText, { color: netoColor }]}>
                  {neto >= 0 ? '+' : ''}{fmt(neto)}
                </Text>
                </RNView>
              </RNView>              
            </RNView>

            {i < gastosPorGrupo.length - 1 && (
              <RNView style={[styles.divider, { marginHorizontal: 14 }]} />
            )}
          </RNView>
        );
      })}
    </RNView>
  </>
)}

      

      {/* ── Grupos ────────────────────────────────────────────────────────── */}
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
                    <Text style={{ fontSize: 16 }}>
                      {g.nombre.charAt(0).toUpperCase()}
                    </Text>
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
        style={({ pressed }) => [styles.ctaBtn, styles.ctaBtnOutline, pressed && styles.ctaPressed]}
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

  // Grupos
  grupoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  grupoIconWrapper: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  grupoNombre: { fontSize: 15, fontWeight: '600' },
  grupoDesc: { fontSize: 12, marginTop: 1 },
  grupoDetalles: { flexDirection: 'row', gap: 10, marginTop: 2 },
  grupoDebes: { fontSize: 12, fontWeight: '600', color: '#FF453A' },
  grupoTeDeben: { fontSize: 12, fontWeight: '600', color: '#30D158' },

  // Gastos personales
  gastoPersonalRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  gastoIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gastoDesc: { fontSize: 14, fontWeight: '600' },
  gastoCat: { fontSize: 12, marginTop: 1 },
  gastoMonto: { fontSize: 14, fontWeight: '700' },

  // Empty
  emptyState: {
    borderRadius: 14, borderWidth: 0.5, padding: 32,
    alignItems: 'center', gap: 8, marginBottom: 12,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  progressTrack: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: 10, borderRadius: 8 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#007AFF', height: 54, borderRadius: 16,
    marginTop: 8, marginBottom: 12, elevation: 4,
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ctaBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#007AFF', elevation: 0, shadowOpacity: 0 },
  ctaPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  netoBadge: {
  alignItems: 'center',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 10,
  minWidth: 70,
},
netoText: { fontSize: 13, fontWeight: '800' },
netoLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
});