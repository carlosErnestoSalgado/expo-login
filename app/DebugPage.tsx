import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/storage/useAuthStorage";

export default function DebugPage() {
  const logout = useAuthStore((s) => s.logout);

  // --- Handlers ---
  const handleReset = async () => {
    await AsyncStorage.clear();
    logout();
    console.log('✅ Storage totalmente limpiado');
  };

  const handleDebug = async () => {
    const auth = await AsyncStorage.getItem('auth-storage');
    console.log('🏪 Auth store:', JSON.parse(auth ?? '{}'));
  };

  const handleShowRegisteredUsers = async () => {
    const users = await AsyncStorage.getItem('@registered_users');
    console.log('👥 Usuarios registrados:', JSON.parse(users ?? '[]'));
  };

  const handleShowSesionedUsers = async () => {
    const sessionInit = await AsyncStorage.getItem('@user_session');
    console.log('🔐 Sesión iniciada actual:', JSON.parse(sessionInit ?? '{}'));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Console</Text>
        <Text style={styles.subtitle}>Inspecciona y gestiona el estado local de la aplicación</Text>
      </View>

      {/* Sección de Inspección */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ESTADO DEL STORAGE</Text>
        
        <DebugCard 
          label="App Auth Store"
          description="Zustand Persist State"
          icon="database"
          color="#5856D6"
          onPress={handleDebug}
        />

        <DebugCard 
          label="Usuarios Registrados"
          description="Key: @registered_users"
          icon="users"
          color="#007AFF"
          onPress={handleShowRegisteredUsers}
        />

        <DebugCard 
          label="Sesión Actual"
          description="Key: @user_session"
          icon="shield"
          color="#34C759"
          onPress={handleShowSesionedUsers}
        />
      </View>

      {/* Sección de Peligro */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>ZONA PELIGROSA</Text>
        <Pressable
          style={({ pressed }) => [
            styles.resetCard,
            pressed && styles.pressedEffect
          ]}
          onPress={handleReset}
        >
          <View style={styles.resetIconContainer}>
            <FontAwesome name="refresh" size={20} color="#FF3B30" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resetText}>Reset Global Storage</Text>
            <Text style={styles.resetSubtext}>Borra registros, sesiones y desloguea al usuario.</Text>
          </View>
          <FontAwesome name="angle-right" size={20} color="#FF3B30" />
        </Pressable>
      </View>

      <Text style={styles.footerText}>Version 1.0.0 (Debug Build)</Text>
    </ScrollView>
  );
}

/**
 * Componente interno para las tarjetas de debug
 */
function DebugCard({ label, description, icon, color, onPress }: any) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressedEffect
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardSub}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color="#C7C7CC" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 5,
    lineHeight: 22,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 5,
    opacity: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: Platform.select({ ios: '#FFFFFF', android: '#F9F9F9' }), // Considera usar Theme colors aquí
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  resetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF3B3020',
    backgroundColor: '#FF3B3005',
  },
  resetIconContainer: {
    marginRight: 15,
  },
  resetText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  resetSubtext: {
    color: '#FF3B30',
    fontSize: 12,
    opacity: 0.7,
  },
  pressedEffect: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.3,
    marginTop: 20,
  }
});