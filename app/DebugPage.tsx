import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Platform, ScrollView, View, Modal, SafeAreaView } from "react-native";
import { Text } from "@/components/Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/storage/useAuthStorage";

export default function DebugPage() {
  const logout = useAuthStore((s) => s.logout);
  
  // Estado para el modal y el contenido del código
  const [modalVisible, setModalVisible] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  const showCode = (title: string, data: any) => {
    setCurrentTitle(title);
    // Beautify: JSON.stringify(data, null, 2) hace el formateo con 2 espacios
    setCodeContent(JSON.stringify(data, null, 2));
    setModalVisible(true);
  };

  // --- Handlers modificados para usar el modal ---
  const handleDebug = async () => {
    const auth = await AsyncStorage.getItem('auth-storage');
    showCode("Auth Store State", JSON.parse(auth ?? '{}'));
    console.log(auth)
  };

  const handleShowRegisteredUsers = async () => {
    const users = await AsyncStorage.getItem('@registered_users');
    showCode("Usuarios Registrados", JSON.parse(users ?? '[]'));
    console.log(users)
  };

  const handlwShowGroupsState = async () => {
    const auth = await AsyncStorage.getItem('auth-storage');
    const groups = JSON.parse(auth ?? '{}').state?.groups;
    showCode("Grupos en Store", groups ?? []);
    console.log(groups);
  };

  const handleShowSesionedUsers = async () => {
    const sessionInit = await AsyncStorage.getItem('@user_session');
    showCode("Sesión Actual (@user_session)", JSON.parse(sessionInit ?? '{}'));
  };

  const handleReset = async () => {
    await AsyncStorage.clear();
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Console</Text>
        <Text style={styles.subtitle}>Inspecciona y gestiona el estado local</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ESTADO DEL STORAGE</Text>
        <DebugCard label="App Auth Store" description="Zustand Persist State" icon="database" color="#5856D6" onPress={handleDebug} />
        <DebugCard label="Usuarios Registrados" description="Key: @registered_users" icon="users" color="#007AFF" onPress={handleShowRegisteredUsers} />
        <DebugCard label="Grupos" description="State.groups" icon="group" color="#FF9500" onPress={handlwShowGroupsState} />
        <DebugCard label="Sesión Actual" description="Key: @user_session" icon="shield" color="#34C759" onPress={handleShowSesionedUsers} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>ZONA PELIGROSA</Text>
        <Pressable style={({ pressed }) => [styles.resetCard, pressed && styles.pressedEffect]} onPress={handleReset}>
          <FontAwesome name="refresh" size={20} color="#FF3B30" style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}><Text style={styles.resetText}>Reset Global Storage</Text></View>
        </Pressable>
      </View>

      {/* --- MODAL DEL VISOR DE CÓDIGO --- */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.codeModalContainer}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeHeaderTitle}>{currentTitle}</Text>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <FontAwesome name="times-circle" size={24} color="#8E8E93" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.codeScrollView} indicatorStyle="white">
            <View style={styles.codeBackground}>
              <Text style={styles.codeText}>{codeContent}</Text>
            </View>
          </ScrollView>
          
          <View style={styles.codeFooter}>
            <Text style={styles.footerText}>Formato JSON (Read-Only)</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

function DebugCard({ label, description, icon, color, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressedEffect]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}><FontAwesome name={icon} size={18} color={color} /></View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardSub}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color="#C7C7CC" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, opacity: 0.6, marginTop: 5 },
  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12, opacity: 0.5 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12,
    backgroundColor: Platform.select({ ios: '#FFFFFF', android: '#F9F9F9' }),
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 3 } }),
  },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTextContainer: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, opacity: 0.5 },
  resetCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1.5, borderColor: '#FF3B3020', backgroundColor: '#FF3B3005' },
  resetText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  pressedEffect: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  footerText: { textAlign: 'center', fontSize: 12, opacity: 0.3, marginTop: 10 },

  /* Estilos del Visor de Código */
  codeModalContainer: { flex: 1, backgroundColor: '#1C1C1E' }, // Fondo oscuro tipo VSCode
  codeHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#38383A' 
  },
  codeHeaderTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 5 },
  codeScrollView: { flex: 1, padding: 15 },
  codeBackground: { 
    backgroundColor: '#000', padding: 15, borderRadius: 12, 
    borderWidth: 1, borderColor: '#38383A', marginBottom: 40 
  },
  codeText: { 
    color: '#9EF1FF', // Color cian tipo código
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }), 
    fontSize: 13, lineHeight: 18 
  },
  codeFooter: { padding: 15, alignItems: 'center' }
});