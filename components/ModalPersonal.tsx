import React, { useState, useEffect } from 'react';
import {
  StyleSheet, TextInput, Pressable, Platform,
  Modal, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, ScrollView, View as RNView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/storage/useAuthStorage';
import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';
import { GastoPersonal, CategoriaPersonal } from '@/storage/types';
import { showMessage } from 'react-native-flash-message';

const CATEGORIAS: { label: string; value: CategoriaPersonal; icon: string }[] = [
  { label: 'Ropa',             value: 'Ropa',              icon: 'shopping-bag' },
  { label: 'Familia',          value: 'Familia',           icon: 'heart'        },
  { label: 'Comida',           value: 'Comida personal',   icon: 'cutlery'      },
  { label: 'Suscripciones',    value: 'Suscripciones',     icon: 'refresh'      },
  { label: 'Cuidado personal', value: 'Cuidado personal',  icon: 'star'         },
  { label: 'Educación',        value: 'Educacion',         icon: 'book'         },
  { label: 'Entretenimiento',  value: 'Entretenimiento',   icon: 'film'         },
  { label: 'Ahorro',           value: 'Ahorro individual', icon: 'bank'         },
  { label: 'Otros',            value: 'Otros',             icon: 'ellipsis-h'   },
];

function getMesActivoId(): string {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${mm}`;
}

function validate(desc: string, monto: string, categoria: CategoriaPersonal | null): string | null {
  if (!categoria)   return 'Selecciona una categoría.';
  if (!desc.trim()) return 'La descripción es obligatoria.';
  const n = Number(monto.replace(/\./g, ''));
  if (!monto || isNaN(n) || n <= 0) return 'Ingresa un monto válido.';
  return null;
}

interface Props {
  visible: boolean;
  idGasto?: string | null;
  onClose: () => void;
}

export default function ModalGastoPersonal({ visible, idGasto, onClose }: Props) {
  const isDark      = useColorScheme() === 'dark';
  const addGasto    = useAuthStore((s) => s.addGastoPersonal);
  const updateGasto = useAuthStore((s) => s.updateGastoPersonal); // ✅ nombre correcto
  const gastos      = useAuthStore((s) => s.user?.gastosPersonales ?? []);
  const mesActivoId = useAuthStore((s) => s.mesActivoId) ?? getMesActivoId();

  const [descripcion, setDescripcion] = useState('');
  const [monto,       setMonto]       = useState('');
  const [categoria,   setCategoria]   = useState<CategoriaPersonal | null>(null);
  const [fecha,       setFecha]       = useState(new Date().toISOString().split('T')[0]);

 // ✅ Agrega gastos a las dependencias y limpia cuando cierra
useEffect(() => {
  if (idGasto && visible) {
    const gastoExistente = gastos.find(g => g.id === idGasto);
    if (gastoExistente) {
      setDescripcion(gastoExistente.descripcion);
      setMonto(gastoExistente.monto.toLocaleString('es-CL'));
      setCategoria(gastoExistente.categoria);
      setFecha(gastoExistente.fecha ?? new Date().toISOString().split('T')[0]);
    }
  } else {
    // Limpia los campos cuando es modo nuevo
    setDescripcion('');
    setMonto('');
    setCategoria(null);
    setFecha(new Date().toISOString().split('T')[0]);
  }
}, [idGasto, visible, gastos]); // ← agrega gastos aquí

  const handleMonto = (raw: string) => {
    const digits    = raw.replace(/\D/g, '');
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setMonto(formatted);
  };

  const handleClose = () => {
    setDescripcion('');
    setMonto('');
    setCategoria(null);
    setFecha(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const handleGuardar = () => {
    const error = validate(descripcion, monto, categoria);
    if (error) {
      showMessage({ message: 'Campo inválido', description: error, type: 'warning', backgroundColor: '#f39c12' });
      return;
    }

    if (idGasto) {
      // ✅ Modo edición — sintaxis correcta
      updateGasto(idGasto, {
        descripcion: descripcion.trim(),
        categoria:   categoria!,
        monto:       Number(monto.replace(/\./g, '')),
      });
      showMessage({ message: '¡Gasto actualizado!', type: 'success', backgroundColor: '#34C759' });
    } else {
      console.log("Gastooo")
      // ✅ Modo nuevo
      const nuevoGasto: GastoPersonal = {
        id:          `gp-${Date.now()}`,
        descripcion: descripcion.trim(),
        categoria:   categoria!,
        monto:       Number(monto.replace(/\./g, '')),
        fecha,
        mesId:       mesActivoId,
      };
      addGasto(mesActivoId, nuevoGasto);
      showMessage({ message: '¡Gasto agregado!', type: 'success', backgroundColor: '#34C759' });
    }

    handleClose();
  };

  const bg       = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg  = isDark ? '#2C2C2E' : '#F5F7FA';
  const txtColor = isDark ? '#FFF'    : '#000';
  const phColor  = isDark ? '#555'    : '#AAA';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <RNView style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <RNView style={[styles.sheet, { backgroundColor: bg }]}>

              <RNView style={styles.handle} />

              <RNView style={styles.header}>
                <Text style={styles.titulo} lightColor="#1A1A1A" darkColor="#FFF">
                  {idGasto ? 'Editar gasto' : 'Nuevo gasto personal'}
                </Text>
                <Pressable onPress={handleClose} hitSlop={12}>
                  <FontAwesome name="times" size={20} color={isDark ? '#AAA' : '#888'} />
                </Pressable>
              </RNView>

              <ScrollView showsVerticalScrollIndicator={false}>

                <Text style={styles.label} lightColor="#555" darkColor="#AAA">CATEGORÍA *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriasRow}>
                  {CATEGORIAS.map((cat) => {
                    const activa = categoria === cat.value;
                    return (
                      <Pressable
                        key={cat.value}
                        onPress={() => setCategoria(cat.value)}
                        style={[
                          styles.categoriaPill,
                          { backgroundColor: activa ? '#007AFF' : isDark ? '#2C2C2E' : '#F0F4FF',
                            borderColor: activa ? '#007AFF' : 'transparent' },
                        ]}
                      >
                        <FontAwesome name={cat.icon as any} size={13} color={activa ? '#FFF' : isDark ? '#AAA' : '#555'} />
                        <Text style={[styles.categoriaLabel, { color: activa ? '#FFF' : isDark ? '#AAA' : '#555' }]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.label} lightColor="#555" darkColor="#AAA">DESCRIPCIÓN *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: txtColor }]}
                  placeholder="Ej: Café con amigos"
                  placeholderTextColor={phColor}
                  value={descripcion}
                  onChangeText={setDescripcion}
                />

                <Text style={styles.label} lightColor="#555" darkColor="#AAA">MONTO ($) *</Text>
                <RNView style={styles.montoRow}>
                  <RNView style={[styles.montoPrefix, { backgroundColor: inputBg }]}>
                    <Text style={{ color: isDark ? '#AAA' : '#888', fontWeight: '700' }}>$</Text>
                  </RNView>
                  <TextInput
                    style={[styles.montoInput, { backgroundColor: inputBg, color: txtColor, flex: 1 }]}
                    placeholder="0"
                    placeholderTextColor={phColor}
                    keyboardType="numeric"
                    value={monto}
                    onChangeText={handleMonto}
                  />
                </RNView>

                <Text style={styles.label} lightColor="#555" darkColor="#AAA">FECHA</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: txtColor }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={phColor}
                  value={fecha}
                  onChangeText={setFecha}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />

                {categoria && monto ? (
                  <RNView style={[styles.resumen, { backgroundColor: isDark ? '#2C2C2E' : '#F0F7FF' }]}>
                    <FontAwesome name="check-circle" size={14} color="#007AFF" />
                    <Text style={styles.resumenText} lightColor="#007AFF" darkColor="#4DABFF">
                      {CATEGORIAS.find(c => c.value === categoria)?.label} · ${monto}{descripcion ? ` · ${descripcion}` : ''}
                    </Text>
                  </RNView>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.btnGuardar, pressed && styles.btnPressed]}
                  onPress={handleGuardar}
                >
                  <FontAwesome name={idGasto ? 'check' : 'plus'} size={16} color="#FFF" />
                  <Text style={styles.btnText}>{idGasto ? 'Actualizar gasto' : 'Guardar gasto'}</Text>
                </Pressable>

                <RNView style={{ height: 20 }} />
              </ScrollView>
            </RNView>
          </RNView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
  },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 20 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo:        { fontSize: 20, fontWeight: '800' },
  label:         { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  categoriasRow: { gap: 8, paddingBottom: 4 },
  categoriaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  categoriaLabel:{ fontSize: 13, fontWeight: '600' },
  input:         { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  montoRow:      { flexDirection: 'row', borderRadius: 12, overflow: 'hidden' },
  montoPrefix:   { width: 44, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  montoInput:    { height: 52, paddingHorizontal: 12, fontSize: 18, fontWeight: '700', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  resumen:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 12, borderRadius: 10 },
  resumenText:   { fontSize: 13, fontWeight: '600', flex: 1 },
  btnGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#007AFF', height: 56, borderRadius: 16, marginTop: 24,
    ...Platform.select({
      ios:     { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  btnPressed:    { backgroundColor: '#005BBF', transform: [{ scale: 0.97 }] },
  btnText:       { color: '#FFF', fontSize: 17, fontWeight: '800' },
});