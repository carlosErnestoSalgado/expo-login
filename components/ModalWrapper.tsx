import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, TextInput,
  Platform, View as RNView, Modal, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useColorScheme } from "react-native";


// ─── Modal genérico ───────────────────────────────────────────────────────────

export default function ModalWrapper({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <RNView style={styles.modalOverlay}>
            <RNView style={[
              styles.modalBox,
              { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
            ]}>
              {children}
            </RNView>
          </RNView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
})