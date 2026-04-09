import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // <--- ASEGÚRATE DE AGREGAR ESTO
const USER_SESSION_KEY = '@user_session'; // Usuario logueado actualmente
const REGISTERED_USERS_KEY = '@registered_users'; // Base de datos de usuarios


// Función auxiliar para evitar errores de SSR (Server Side Rendering) en Web
const isClient = () => {
  if (Platform.OS !== 'web') return true;
  return typeof window !== 'undefined';
};
export const authService = {
  
  // --- REGISTRO ---
  register: async (name, email, password) => {
    try {
      // 1. Obtener la lista actual de usuarios de la memoria persistente
      const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      // 2. Validar si el correo ya existe
      const userExists = users.find(u => u.email === email);
      if (userExists) {
        return { success: false, message: 'El correo ya está registrado' };
      }

      // 3. Crear el nuevo usuario y agregarlo al array
      const newUser = { 
        name, 
        email, 
        password, // En un entorno real, la contraseña NUNCA se guarda así, se hace en backend
        token: `fake-jwt-${Date.now()}` 
      };
      
      users.push(newUser);

      // 4. Guardar la lista actualizada en AsyncStorage
      await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      
      // 5. Opcional: Loguear al usuario automáticamente tras registrarse
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));

      return { success: true, user: newUser, message: 'Registro exitoso' };
    } catch (error) {
      return { success: false, message: 'Error en el sistema de registro' };
    }
  },

  // --- LOGIN ---
  login: async (email, password) => {
    try {
      const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      // Buscar usuario que coincida con email y password
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        return { success: true, user };
      }
      
      return { success: false, message: 'Credenciales incorrectas' };
    } catch (error) {
      return { success: false, message: 'Error al intentar iniciar sesión' };
    }
  },

  // --- PERSISTENCIA DE SESIÓN ---
  getUser: async () => {
    const jsonValue = await AsyncStorage.getItem(USER_SESSION_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  },

  getLogged: async() => {
   if (!isClient()) return false;
    try {
      const user = await AsyncStorage.getItem(USER_SESSION_KEY);
      return !!user; // Retorna true si existe, false si es null
    } catch (e) {
      return false;
    }
  },

  logout: async () => {
    if (!isClient()) return;
    await AsyncStorage.removeItem(USER_SESSION_KEY);
  },

  // --- EXTRA: Función para ver todos los usuarios (solo para pruebas) ---
  getAllUsers: async () => {
    const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
  }
};