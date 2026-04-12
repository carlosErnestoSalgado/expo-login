import React, { useState, useEffect, use } from 'react';
import { StyleSheet, TextInput, Button, Alert, TouchableWithoutFeedback, Keyboard, Platform, Pressable } from 'react-native';
import { authService } from '@/storage/authservices';
import { useAuthStore } from '@/storage/useAuthStorage';
import FlashMessage, { showMessage } from "react-native-flash-message";
import Register from '@/components/register';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';




export default function App() {
  
  
  
  // ... dentro de App()
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState<{ email: any; token: string; name: string } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  
  //Zuzstand store para manejar el estado de autenticación
  const setUserZustand     = useAuthStore((state) => state.setUser);
  const setIsLogged = useAuthStore((state) => state.setIsLogged);

// Reemplaza el useEffect actual y agrega este nuevo
  useEffect(() => {
  const checkUser = async () => {
    const savedUser = await authService.getUser();
    if (savedUser) setUser(savedUser);
  };
  checkUser();
}, []);

const handleLogin = async () => {
  // Validar ANTES de llamar al servicio
  if (!email.trim() || !password.trim()) {
    showMessage({
      message: 'Campos vacíos',
      description: 'Por favor, ingresa tus credenciales',
      type: 'warning',
    });
    return;
  }

  const result = await authService.login(email, password);

  if (result.success && result.user) {
    console.log('Login exitoso:', result.user);
    setUser(result.user); 
    setIsLogged(true); // Actualiza el estado de autenticación en el store
    //  mete el usuario completo en Zustand
    // No necesitas setIsLogged — setUser ya lo hace internamente
  } else {
    showMessage({
      message: 'Error de acceso',
      description: result.message ?? 'Credenciales incorrectas',
      type: 'danger',
      backgroundColor: '#ff4444',
      color: '#fff',
    });
  }
};

  

  if (!isRegistered) {
/* Formulario de Login */
  return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {/* Usamos lightColor y darkColor para el fondo principal */}
        <View style={styles.container} lightColor="#F5F7FA" darkColor="#121212">
          
          <Text style={styles.title} lightColor="#1A1A1A" darkColor="#FFFFFF">
            Login Local (Expo)
          </Text>

          <TextInput 
            style={[
              styles.input, 
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }
            ]}
            placeholderTextColor={isDark ? '#AAA' : '#888'} 
            placeholder="Email (test@test.com)" 
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput 
            style={[
              styles.input, 
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }
            ]}
            placeholderTextColor={isDark ? '#AAA' : '#888'} 
            placeholder="Password (123456)" 
            secureTextEntry 
            onChangeText={setPassword}
            value={password}
          />

          <Pressable 
            style={({ pressed }) => [
              styles.botonAzul, 
              pressed && styles.buttonPressed
            ]} 
            onPress={handleLogin}
          >
            {/* El texto del botón suele ser siempre blanco, 
                pero puedes usar lightColor si quieres que cambie */}
            <Text style={styles.textoBoton}>Entrar</Text>
          </Pressable>

          <View style={styles.container_center} lightColor="transparent" darkColor="transparent">
            <Text 
              style={styles.text_link} 
              onPress={() => setIsRegistered(true)}
              lightColor="#007AFF"
              darkColor="#4DABFF"
            >
              Regístrate
            </Text>
          </View>

          <FlashMessage position="top" statusBarHeight={40} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Register setIsRegistered={setIsRegistered} />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: { 
    // En Dark Mode, un fondo gris muy oscuro queda mejor que blanco puro
    backgroundColor: '#FFFFFF', 
    height: 58,
    borderWidth: 1,
    borderColor: '#E1E8EE',
    paddingHorizontal: 18,
    marginBottom: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#000', // El texto que escribes
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  botonAzul: {
    backgroundColor: '#007AFF', 
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#005BBF',
    transform: [{ scale: 0.97 }],
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container_center: {
    marginTop: 30,
    alignItems: 'center',
  },
  text_link: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});