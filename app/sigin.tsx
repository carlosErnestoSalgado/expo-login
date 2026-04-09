import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { authService } from '@/authservices';
import { Redirect } from 'expo-router';
import { useRouter } from 'expo-router';

const router = useRouter();
export default function App() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState<{ email: any; token: string; name: string } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Comprobar si ya había una sesión al cargar la app
  useEffect(() => {
    const checkUser = async () => {
      const savedUser = await authService.getUser();
      if (savedUser) setUser(savedUser);
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user || null);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      console.log('Password and confirm password do not match');
      return;
    }
    console.log('Registering user:', { name, email, password });


    const result = await authService.register(name, email, password);
    if (result.success) {
      setUser(result.user || null);
    } else {
      Alert.alert('Error', result.message);
    }
    setConfirmPassword(''); // Limpiar el campo de confirmación después del registro
    setName(''); // Limpiar el campo de nombre después del registro
    setEmail(''); // Limpiar el campo de email después del registro
    setPassword(''); // Limpiar el campo de contraseña después del registro

  };

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  if (!isRegistered) {
/* Formulario de Login */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Local (Expo)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Email (test@test.com)" 
        onChangeText={setEmail}
        value={email}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password (123456)" 
        secureTextEntry 
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Entrar" onPress={handleLogin} />
      <View style={styles.container_center}>
        <Text style={styles.text_link}><span onClick={() => setIsRegistered(true)}>Registrate</span></Text>
      </View>
    </View>
  ); 
}

/* Formulario de Registro */
return(
    <View style={styles.container}>
        <Text style={styles.title}>Registro Local (Expo)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre"
            onChangeText={setName}
            value={name}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email"
            onChangeText={setEmail}
            value={email}
        />
        <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
        />
        <TextInput
            style={styles.input}
            placeholder="Repit your password"
            secureTextEntry
            onChangeText={setConfirmPassword}
            value={confirmPassword}
        />
        <Button title="Registrar" onPress={handleRegister} />
        <View style={styles.container_center}>
            <Text style={styles.text_link}><span onClick={() => setIsRegistered(false)}>¿Ya tienes cuenta? Inicia sesión</span></Text>
        </View>
    </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  container_center: {justifyContent: 'center', alignItems: 'center', marginTop: 20},
  text_link: { color: 'blue', cursor: 'pointer' },
});