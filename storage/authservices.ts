import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const USER_SESSION_KEY = '@user_session';
const REGISTERED_USERS_KEY = '@registered_users';

const isClient = () => {
  if (Platform.OS !== 'web') return true;
  return typeof window !== 'undefined';
};

export const authService = {

  async register(
    name: string,
    email: string,
    password: string,
    extras?: {
      salario?: number;
      metaAhorroIndividual?: number;
      foto?: string;
    }
  ) {
    try {
      const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      const userExists = users.find((u: any) => u.email === email);
      if (userExists) {
        return { success: false, message: 'El correo ya está registrado' };
      }

      // ✅ Ahora sí incluimos todos los campos extras
      const newUser = {
        id:                   `user-${Date.now()}`, // ← necesario para el store
        name,
        email,
        password,
        token:                `fake-jwt-${Date.now()}`,
        foto: extras?.foto ?? undefined, // ← undefined en vez de null
        salario:              extras?.salario ?? 0,
        metaAhorroIndividual: extras?.metaAhorroIndividual ?? 0,
        goals:                [],
        groupIds:             [],
        gastosPersonales:     [],
      };

      users.push(newUser);
      await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));

      return { success: true, user: newUser, message: 'Registro exitoso' };
    } catch (error) {
      return { success: false, message: 'Error en el sistema de registro' };
    }
  },

  login: async (email: string, password: string) => {
    try {
      const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      const user = users.find((u:any) => u.email === email && u.password === password);

      if (user) {
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        return { success: true, user };
      }

      return { success: false, message: 'Credenciales incorrectas' };
    } catch (error) {
      return { success: false, message: 'Error al intentar iniciar sesión' };
    }
  },

  getUser: async () => {
    const jsonValue = await AsyncStorage.getItem(USER_SESSION_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  },

  getLogged: async () => {
    if (!isClient()) return false;
    try {
      const user = await AsyncStorage.getItem(USER_SESSION_KEY);
      return !!user;
    } catch (e) {
      return false;
    }
  },

  logout: async () => {
    if (!isClient()) return;
    await AsyncStorage.removeItem(USER_SESSION_KEY);
  },

  getAllUsers: async () => {
    const storedUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
  },
};