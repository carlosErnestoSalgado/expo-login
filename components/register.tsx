import React, { useState } from 'react';
import {
  StyleSheet, TextInput, Keyboard, Pressable,
  Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { authService } from '@/storage/authservices';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { useAuthStore } from '@/storage/useAuthStorage';
import { TouchableWithoutFeedback } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Field {
  key: string;
  label: string;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  optional?: boolean;
}

// ─── Configuración de campos ─────────────────────────────────────────────────

const FIELDS: Field[] = [
  {
    key: 'name',
    label: 'Nombre completo',
    placeholder: 'Ej: Carlos Pérez',
  },
  {
    key: 'email',
    label: 'Correo electrónico',
    placeholder: 'ejemplo@correo.com',
    keyboardType: 'email-address',
  },
  {
    key: 'password',
    label: 'Contraseña',
    placeholder: 'Mínimo 6 caracteres',
    secure: true,
  },
  {
    key: 'confirmPassword',
    label: 'Repetir contraseña',
    placeholder: 'Debe coincidir con la anterior',
    secure: true,
  },
  {
    key: 'salario',
    label: 'Salario mensual ($)',
    placeholder: 'Ej: 750000',
    keyboardType: 'numeric',
  },
  {
    key: 'metaAhorro',
    label: 'Meta de ahorro individual ($ / mes)',
    placeholder: 'Ej: 50000',
    keyboardType: 'numeric',
    optional: true,
  },
  {
    key: 'foto',
    label: 'URL de foto de perfil',
    placeholder: 'https://... (opcional)',
    optional: true,
  },
];

// ─── Validaciones ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Record<string, string>): string | null {
  if (!values.name.trim())
    return 'El nombre es obligatorio.';

  if (!EMAIL_REGEX.test(values.email.trim()))
    return 'Introduce un correo electrónico válido.';

  if (values.password.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres.';

  if (values.password !== values.confirmPassword)
    return 'Las contraseñas no coinciden.';

  const salario = Number(values.salario);
  if (!values.salario || isNaN(salario) || salario <= 0)
    return 'Ingresa un salario mensual válido.';

  if (values.metaAhorro && isNaN(Number(values.metaAhorro)))
    return 'La meta de ahorro debe ser un número.';

  return null; // sin errores
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Register({
  setIsRegistered,
}: {
  setIsRegistered: (value: boolean) => void;
}) {
  const setIsLogged = useAuthStore((state) => state.setIsLogged);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Un solo objeto de valores en vez de N useState
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, '']))
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

// Agrega setUser al store
const setUser  = useAuthStore((state) => state.setUser);

const handleRegister = async () => {
  const error = validate(values);
  if (error) {
    showMessage({ message: 'Campos inválidos', description: error, type: 'warning', backgroundColor: '#f39c12' });
    return;
  }

  setLoading(true);
  const result = await authService.register(
    values.name.trim(),
    values.email.trim(),
    values.password,
    {
      salario:              Number(values.salario),
      metaAhorroIndividual: values.metaAhorro ? Number(values.metaAhorro) : 0,
      foto:                 values.foto.trim() || undefined,
    }
  );
  setLoading(false);

  if (result.success && result.user) {
    // ✅ Metemos el usuario completo en Zustand
    setUser(result.user);
    setIsLogged(true);
  } else {
    showMessage({ message: 'Error al registrarse', description: result.message ?? '', type: 'danger', backgroundColor: '#ff4444' });
  }
};

  // ─── Colores dinámicos ──────────────────────────────────────────────────────
  const inputBg    = isDark ? '#2C2C2E' : '#FFFFFF';
  const inputColor = isDark ? '#FFF'    : '#000';
  const labelColor = isDark ? '#AAA'    : '#555';
  const phColor    = isDark ? '#666'    : '#AAA';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container} lightColor="#F5F7FA" darkColor="#121212">

            <Text style={styles.title} lightColor="#1A1A1A" darkColor="#FFFFFF">
              Crear cuenta
            </Text>
            <Text style={styles.subtitle} lightColor="#555" darkColor="#AAA">
              Completa tus datos para empezar a gestionar tus finanzas.
            </Text>

            {FIELDS.map((field) => (
              <View
                key={field.key}
                style={styles.fieldWrapper}
                lightColor="transparent"
                darkColor="transparent"
              >
                {/* Label + badge opcional */}
                <View style={styles.labelRow} lightColor="transparent" darkColor="transparent">
                  <Text style={[styles.label, { color: labelColor }]}>
                    {field.label}
                  </Text>
                  {field.optional && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>opcional</Text>
                    </View>
                  )}
                </View>

                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: inputColor }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={phColor}
                  secureTextEntry={field.secure}
                  keyboardType={field.keyboardType ?? 'default'}
                  autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  autoCorrect={false}
                  value={values[field.key]}
                  onChangeText={(v) => handleChange(field.key, v)}
                />
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [
                styles.botonAzul,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.textoBoton} lightColor="#FFF" darkColor="#FFF">
                {loading ? 'Registrando…' : 'Crear cuenta'}
              </Text>
            </Pressable>

            <View style={styles.footer} lightColor="transparent" darkColor="transparent">
              <Text style={styles.text_link} onPress={() => setIsRegistered(false)}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.text_link_accent}>Inicia sesión</Text>
              </Text>
            </View>

          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <FlashMessage position="top" statusBarHeight={40} />
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  fieldWrapper: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E1E8EE',
    paddingHorizontal: 16,
    borderRadius: 14,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  botonAzul: {
    backgroundColor: '#007AFF',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  buttonDisabled: {
    backgroundColor: '#99C2FF',
    elevation: 0,
  },
  textoBoton: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  text_link: {
    fontSize: 15,
    fontWeight: '500',
  },
  text_link_accent: {
    color: '#007AFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});