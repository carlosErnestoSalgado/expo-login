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
import { showMessage } from 'react-native-flash-message';

interface Props {
  visible: boolean;
  onClose: () => void;
}
function formatMonto(n: number): string {
  return n.toLocaleString('es-CL');
}

export default function ModalEditPersonalData({ visible, onClose }: Props) {
  const user   = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const isDark = useColorScheme() === 'dark';

  const [salario, setSalario] = useState('');   // ✅ string, not number
  const [ahorro,   setahorro]   = useState('');
  const [name, setName] = useState('');
  
  // Rellenar campos cuando abre en modo edición
  useEffect(() => {
    if (visible) {
      setSalario(user.salario);
      setSalario(formatMonto(Number(user.salario)))
      setahorro(formatMonto(Number(user.metaAhorroIndividual)));
      setName(user.name);
    }

  }, [visible]);

  const handleahorro = (raw: string, tipo: string) => {
    const digits    = raw.replace(/\D/g, '');
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (tipo === 'salario') {
      setSalario(formatted);
    } else {
      setahorro(formatted);
    }
  };

  const handleClose = () => {
    setSalario('');   // ✅ reset salario too
    setahorro('');
    onClose();
  };

  const handleGuardar = async () => {
    const salarioNum = Number(salario.replace(/\./g, ''));
    const ahorroNum   = Number(ahorro.replace(/\./g, ''));

    if (!salario || isNaN(salarioNum) || salarioNum <= 0) {
      showMessage({ message: 'Campo inválido', description: 'Ingresa un ingreso mensual válido.', type: 'warning', backgroundColor: '#f39c12' });
      return;
    }
    if (!ahorro || isNaN(ahorroNum) || ahorroNum <= 0) {
      showMessage({ message: 'Campo inválido', description: 'Ingresa un ahorro válido.', type: 'warning', backgroundColor: '#f39c12' });
      return;
    }

    updateUser({
        name:                   name,
        salario:                salarioNum,
        metaAhorroIndividual:   ahorroNum,
     });
    // TODO: persist salarioNum, ahorroNum, fecha
    showMessage({ message: '¡Datos guardados!', type: 'success', backgroundColor: '#34C759' });
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
                  Editar Información Personal
                </Text>
                <Pressable onPress={handleClose} hitSlop={12}>
                  <FontAwesome name="times" size={20} color={isDark ? '#AAA' : '#888'} />
                </Pressable>
              </RNView>

              <ScrollView showsVerticalScrollIndicator={false}>


                <Text style={styles.label} lightColor="#555" darkColor="#AAA">Nombre </Text>
                <RNView style={styles.ahorroRow}>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: txtColor, flex: 1 }]}
                    placeholder="Ingrese su nombre: "
                    placeholderTextColor={phColor}
                    value={name}
                    onChangeText={(value) => setName(value)}  // ✅ Fixed arrow
                  />
                </RNView>


                <Text style={styles.label} lightColor="#555" darkColor="#AAA">Ingreso Mensual *</Text>
                <TextInput
                  style={[styles.ahorroInput, { backgroundColor: inputBg, color: txtColor, flex: 1 }]}
                  placeholder="Ej: 500.000"
                  placeholderTextColor={phColor}
                  keyboardType="numeric"
                  value={salario}
                  onChangeText={(value) => handleahorro(value, 'salario')}
                />

                <Text style={styles.label} lightColor="#555" darkColor="#AAA">Ahorro mensual ($) *</Text>
                <RNView style={styles.ahorroRow}>
                  <RNView style={[styles.ahorroPrefix, { backgroundColor: inputBg }]}>
                    <Text style={{ color: isDark ? '#AAA' : '#888', fontWeight: '700' }}>$</Text>
                  </RNView>
                  <TextInput
                    style={[styles.ahorroInput, { backgroundColor: inputBg, color: txtColor, flex: 1 }]}
                    placeholder="0"
                    placeholderTextColor={phColor}
                    keyboardType="numeric"
                    value={ahorro}
                    onChangeText={(value) => handleahorro(value, 'ahorro')}  // ✅ Fixed arrow
                  />
                </RNView>
                

                
                <Pressable
                  style={({ pressed }) => [styles.btnGuardar, pressed && styles.btnPressed]}
                  onPress={handleGuardar}
                >
                  <FontAwesome name="check" size={16} color="#FFF" />
                  <Text style={styles.btnText}>Guardar cambios</Text>
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
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
  },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 20 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo:     { fontSize: 20, fontWeight: '800' },
  label:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input:      { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  ahorroRow:   { flexDirection: 'row', borderRadius: 12, overflow: 'hidden' },
  ahorroPrefix:{ width: 44, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  ahorroInput: { height: 52, paddingHorizontal: 12, fontSize: 18, fontWeight: '700', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  btnGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#007AFF', height: 56, borderRadius: 16, marginTop: 24,
    ...Platform.select({
      ios:     { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  btnPressed: { backgroundColor: '#005BBF', transform: [{ scale: 0.97 }] },
  btnText:    { color: '#FFF', fontSize: 17, fontWeight: '800' },
});