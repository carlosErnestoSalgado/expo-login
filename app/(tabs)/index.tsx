import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Image, Pressable,
  Platform, View as RNView,
} from 'react-native';
import { useAuthStore } from '@/storage/useAuthStorage';
import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';
import ModalGastoPersonal from '@/components/ModalPersonal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
const pct = (current: number, goal: number) =>
  goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
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

function SectionTitle({ text }: { text: string }) {
  return (
    <Text style={styles.sectionTitle} lightColor="#888" darkColor="#666">
      {text.toUpperCase()}
    </Text>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <RNView style={styles.statRow}>
      <Text style={styles.statLabel} lightColor="#555" darkColor="#AAA">{label}</Text>
      <Text
        style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}
        lightColor="#1A1A1A"
        darkColor="#FFF"
      >
        {value}
      </Text>
    </RNView>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 100 ? '#34C759' : percent >= 50 ? '#007AFF' : '#FF9500';
  return (
    <RNView style={styles.progressTrack}>
      <RNView style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
    </RNView>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ProfileScreen() {
  const isDark  = useColorScheme() === 'dark';
  const router  = useRouter();

  const user    = useAuthStore((s) => s.user);
  const groups  = useAuthStore((s) => s.groups);
  const logout  = useAuthStore((s) => s.logout);

  const [modalVisible, setModalVisible] = useState(false);

  const salario      = user?.salario ?? 0;
  const gastosPersonales = user?.gastosPersonales ?? [];
  const totalGastado = gastosPersonales.reduce((s, g) => s + g.monto, 0);
  const meta         = 0; // conectar cuando tengas el miembro del grupo
  const saldo        = salario - totalGastado;
  const progreso     = pct(saldo, meta);
  const saldoColor   = saldo >= 0 ? '#34C759' : '#FF3B30';

  const users_groups = groups.find(g => g.miembros.some(u => u.userId === user?.id));

  const iniciales = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const handleDebug = async () => {
    const session = await AsyncStorage.getItem('auth-storage');
    console.clear();
    console.log('--- USER ---',        user);
    console.log('--- GROUPS ---',      groups);
    console.log('--- USER GROUP ---',  users_groups);
    console.log('--- SESSION ---',     session);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F5F7FA' }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header / Avatar ───────────────────────────────────────────── */}
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
        {users_groups && (
          <RNView style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>🏠 {users_groups.nombre}</Text>
          </RNView>
        )}
      </RNView>

      {/* ── Finanzas del mes ──────────────────────────────────────────── */}
      <SectionTitle text="Finanzas del mes" />
      <Card>
        <StatRow label="Salario mensual"   value={fmt(salario)} />
        <RNView style={styles.divider} />
        <StatRow label="Total gastado"     value={fmt(totalGastado)} valueColor="#FF9500" />
        <RNView style={styles.divider} />
        <StatRow label="Saldo restante"    value={fmt(saldo)}        valueColor={saldoColor} />
      </Card>

      {/* ── Meta de ahorro ────────────────────────────────────────────── */}
      {meta > 0 && (
        <>
          <SectionTitle text="Meta de ahorro individual" />
          <Card>
            <RNView style={styles.metaHeader}>
              <Text style={styles.metaPct} lightColor="#1A1A1A" darkColor="#FFF">
                {progreso}%
              </Text>
              <Text style={styles.metaValues} lightColor="#888" darkColor="#666">
                {fmt(saldo)} / {fmt(meta)}
              </Text>
            </RNView>
            <ProgressBar percent={progreso} />
            <Text style={styles.metaHint} lightColor="#AAA" darkColor="#555">
              {progreso >= 100
                ? '🎉 ¡Meta alcanzada!'
                : `Te faltan ${fmt(meta - saldo)} para cumplir tu meta.`}
            </Text>
          </Card>
        </>
      )}

      {/* ── Acciones ──────────────────────────────────────────────────── */}
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

      {/* ── Debug ─────────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.debugBtn, pressed && { opacity: 0.5 }]}
        onPress={handleDebug}
      >
        <FontAwesome name="bug" size={12} color="#8E8E93" />
        <Text style={styles.debugText} lightColor="#8E8E93" darkColor="#555">
          Mostrar info en consola
        </Text>
      </Pressable>



      {/* ── Modal gasto personal ──────────────────────────────────────── */}
      <ModalGastoPersonal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  ctaBtnOutline:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#007AFF', elevation: 0, shadowOpacity: 0 },
  ctaPressed:     { transform: [{ scale: 0.97 }], opacity: 0.85 },
  ctaBtnText:     { color: '#FFF', fontSize: 16, fontWeight: '800' },

  debugBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  debugText:      { fontSize: 12 },

  logoutBtn:      { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  logoutText:     { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
});