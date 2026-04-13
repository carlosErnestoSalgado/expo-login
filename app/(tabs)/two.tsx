import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, TextInput,
  Platform, View as RNView, Switch
} from 'react-native';
import { useAuthStore } from '@/storage/useAuthStorage';
import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Group } from '@/storage/types';
import { useRoute } from '@react-navigation/native';

// ─── Componentes ────────────────────────────────────────────────────────────────
import SectionTitle from '@/components/sectiontitle';
import Card from '@/components/card';
import GrupoCard from '@/components/GroupCard';
import ModalWrapper from '@/components/ModalWrapper';
import { useRouter } from 'expo-router';
// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TabTwoScreen() {
  const isDark   = useColorScheme() === 'dark';
  const user     = useAuthStore((s) => s.user);
  const groups   = useAuthStore((s) => s.groups);
  const joinGroup  = useAuthStore((s) => s.joinGroup);
  const addIdGroupToUser = useAuthStore((s) => s.setIdGroupInUser)

  // Modales
  const [modalCrear,  setModalCrear]  = useState(false);
  const [modalUnirse, setModalUnirse] = useState(false);

  // Form — Crear grupo
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descGrupo,   setDescGrupo]   = useState('');

  // Form — Unirse
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');

  // Grupo de ahorros
  const [moneySaveGroup, setMoneySaveGroup] = useState(false);
  const [gastosComunes, setGastosComunes]  = useState(0);

  // Router para ir a otra pagina
  const router = useRouter()

  // ── Crear grupo ────────────────────────────────────────────────────────────
  const handleCrear = () => {
    if (!nombreGrupo.trim()) return;

    const nuevoGrupo: Group = {
      id:           Math.random().toString(36).substring(2),
      nombre:       nombreGrupo.trim(),
      descripcion:  descGrupo.trim(),
      foto:         '',
      codigoUnirse: generarCodigo(),
      adminId:      user?.id ?? '',
      members:      [user?.id ?? ''],
      miembros:     user
        ? [{ userId: user.id, nombre: user.name, salario: 0, metaAhorroIndividual: 0 }]
        : [],
      ahorroComun:    null,
      historialMeses: [],
    };

    joinGroup(nuevoGrupo);
    addIdGroupToUser(nuevoGrupo.id)
    setNombreGrupo('');
    setDescGrupo('');
    setModalCrear(false);
    
  };

  // ── Unirse a grupo ─────────────────────────────────────────────────────────
  const handleUnirse = () => {
    const codigoLimpio = codigo.trim().toUpperCase();
    const grupoEncontrado = groups.find(
      (g) => g.codigoUnirse === codigoLimpio
    );

    if (!grupoEncontrado) {
      setErrorCodigo('Código inválido. Verifica e intenta de nuevo.');
      return;
    }
    if (grupoEncontrado.members.includes(user?.id ?? '')) {
      setErrorCodigo('Ya eres miembro de este grupo.');
      return;
    }

    joinGroup({
      ...grupoEncontrado,
      members: [...grupoEncontrado.members, user?.id ?? ''],
    });
    setCodigo('');
    setErrorCodigo('');
    setModalUnirse(false);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: isDark ? '#2C2C2E' : '#F5F7FA', color: isDark ? '#FFF' : '#000' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F5F7FA' }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Acciones rápidas ─────────────────────────────────────────── */}
        <RNView style={styles.accionesRow}>
          <Pressable
            style={({ pressed }) => [styles.accionBtn, pressed && styles.accionPressed]}
            onPress={() => setModalCrear(true)}
          >
            <FontAwesome name="plus-circle" size={20} color="#FFF" />
            <Text style={styles.accionText}>Crear grupo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.accionBtn,
              styles.accionBtnSecundario,
              pressed && styles.accionPressed,
              { borderColor: isDark ? '#3A3A3C' : '#E1E8EE' },
            ]}
            onPress={() => setModalUnirse(true)}
          >
            <FontAwesome name="sign-in" size={20} color="#007AFF" />
            <Text style={[styles.accionText, { color: '#007AFF' }]}>Unirse</Text>
          </Pressable>
        </RNView>

        {/* ── Lista de grupos ──────────────────────────────────────────── */}
        <SectionTitle text={`Mis grupos (${groups.length})`} />

        {groups.length === 0 ? (
          <Card>
            <RNView style={styles.emptyState}>
              <FontAwesome
                name="users"
                size={40}
                color={isDark ? '#3A3A3C' : '#DDD'}
              />
              <Text style={styles.emptyTitle} lightColor="#AAA" darkColor="#555">
                Aún no tienes grupos
              </Text>
              <Text style={styles.emptySubtitle} lightColor="#BBB" darkColor="#444">
                Crea uno nuevo o únete con un código.
              </Text>
            </RNView>
          </Card>
        ) : (
          groups.map((g) =>    <GrupoCard key={g.id} grupo={g} />)
        )}
      </ScrollView>

      {/* ── Modal: Crear grupo ───────────────────────────────────────────── */}
      <ModalWrapper visible={modalCrear} onClose={() => setModalCrear(false)}>
        <Text style={styles.modalTitle} lightColor="#1A1A1A" darkColor="#FFF">
          Crear grupo
        </Text>

        <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
          Nombre del grupo *
        </Text>
        <TextInput
          style={inputStyle}
          placeholder="Ej: Hogar Pérez"
          placeholderTextColor={isDark ? '#555' : '#AAA'}
          value={nombreGrupo}
          onChangeText={setNombreGrupo}
        />
        <View style={{flexDirection: "row", alignItems: "center",justifyContent: "space-between", gap: 6}}>
          <Text style={styles.labelBold} lightColor='#555' darkColor='#aaa'>
            Grupod de Ahorros
          </Text>
          <Switch 
          value={moneySaveGroup}
          onValueChange={() => setMoneySaveGroup(!moneySaveGroup)}
          trackColor={{ false: '#767577', true: '#34C759' }}
          thumbColor="white" 
          />
        
        </View>
        {
          moneySaveGroup ?
          <>
          <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
          Destinado a gastos comunes *
          </Text>
          <TextInput
          style={inputStyle}
          placeholder="80000"
          placeholderTextColor={isDark ? '#555' : '#AAA'}
          value={gastosComunes.toString()}
          onChangeText={(text) => setGastosComunes(Number(text))}
          />
          </>
          : null
        }
        <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
          Descripción (opcional)
        </Text>
        <TextInput
          style={inputStyle}
          placeholder="Ej: Gastos del departamento"
          placeholderTextColor={isDark ? '#555' : '#AAA'}
          value={descGrupo}
          onChangeText={setDescGrupo}
        />

        <RNView style={styles.modalBtns}>
          <Pressable
            style={[styles.modalBtn, styles.modalBtnCancel]}
            onPress={() => setModalCrear(false)}
          >
            <Text style={{ color: '#888', fontWeight: '600' }}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.modalBtn, styles.modalBtnConfirm, !nombreGrupo.trim() && { opacity: 0.4 }]}
            onPress={handleCrear}
            disabled={!nombreGrupo.trim()}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Crear</Text>
          </Pressable>
        </RNView>
      </ModalWrapper>

      {/* ── Modal: Unirse a grupo ────────────────────────────────────────── */}
      <ModalWrapper visible={modalUnirse} onClose={() => setModalUnirse(false)}>
        <Text style={styles.modalTitle} lightColor="#1A1A1A" darkColor="#FFF">
          Unirse a un grupo
        </Text>

        <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
          Código de invitación
        </Text>
        <TextInput
          style={[inputStyle, { textTransform: 'uppercase', letterSpacing: 4 }]}
          placeholder="Ej: A7B8C9"
          placeholderTextColor={isDark ? '#555' : '#AAA'}
          value={codigo}
          onChangeText={(v) => { setCodigo(v); setErrorCodigo(''); }}
          autoCapitalize="characters"
          maxLength={6}
        />

        {errorCodigo ? (
          <Text style={styles.errorText}>{errorCodigo}</Text>
        ) : null}

        <RNView style={styles.modalBtns}>
          <Pressable
            style={[styles.modalBtn, styles.modalBtnCancel]}
            onPress={() => { setModalUnirse(false); setCodigo(''); setErrorCodigo(''); }}
          >
            <Text style={{ color: '#888', fontWeight: '600' }}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.modalBtn, styles.modalBtnConfirm, !codigo.trim() && { opacity: 0.4 }]}
            onPress={handleUnirse}
            disabled={!codigo.trim()}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Unirse</Text>
          </Pressable>
        </RNView>
      </ModalWrapper>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  labelBold: {
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  // Acciones rápidas
  accionesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  accionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    ...Platform.select({
      ios: { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  accionBtnSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  accionPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  accionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },

 
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  modalLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    height: 52, borderRadius: 12, paddingHorizontal: 16,
    fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E1E8EE',
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F0F0F0' },
  modalBtnConfirm: { backgroundColor: '#007AFF' },
  errorText: { color: '#FF3B30', fontSize: 13, marginBottom: 8, marginTop: -8 },
});