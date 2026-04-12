import {
  StyleSheet, ScrollView, Pressable, TextInput,
  Platform, View as RNView, Modal, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import Card from './card';
import { useColorScheme } from 'react-native';
import { Text } from './Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Group } from '@/storage/types';
import { useAuthStore } from '@/storage/useAuthStorage';



// ─── Tarjeta de grupo ─────────────────────────────────────────────────────────

export default function GrupoCard({ grupo }: { grupo: Group }) {
  const isDark = useColorScheme() === 'dark';
  const user   = useAuthStore((s) => s.user);
  const esAdmin = grupo.adminId === user?.id;

  return (
    <Card style={{ marginBottom: 12 }}>
      <RNView style={styles.grupoHeader}>
        {/* Avatar del grupo */}
        <RNView style={styles.grupoAvatar}>
          <Text style={styles.grupoAvatarText}>
            {grupo.nombre.charAt(0).toUpperCase()}
          </Text>
        </RNView>

        <RNView style={{ flex: 1 }}>
          <RNView style={styles.grupoTitleRow}>
            <Text style={styles.grupoNombre} lightColor="#1A1A1A" darkColor="#FFF">
              {grupo.nombre}
            </Text>
            {esAdmin && (
              <RNView style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </RNView>
            )}
          </RNView>
          <Text style={styles.grupoDesc} lightColor="#888" darkColor="#666">
            {grupo.descripcion || 'Sin descripción'}
          </Text>
        </RNView>
      </RNView>

      <RNView style={styles.divider} />

      {/* Info rápida */}
      <RNView style={styles.grupoMeta}>
        <RNView style={styles.grupoMetaItem}>
          <FontAwesome name="users" size={13} color={isDark ? '#AAA' : '#888'} />
          <Text style={styles.grupoMetaText} lightColor="#888" darkColor="#AAA">
            {grupo.members.length} miembro{grupo.members.length !== 1 ? 's' : ''}
          </Text>
        </RNView>

        <RNView style={styles.grupoMetaItem}>
          <FontAwesome name="key" size={13} color={isDark ? '#AAA' : '#888'} />
          <Text style={styles.grupoMetaText} lightColor="#888" darkColor="#AAA">
            {grupo.codigoUnirse}
          </Text>
        </RNView>
      </RNView>
    </Card>
  );
}

const styles = StyleSheet.create({
     // Grupo card
  grupoHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  grupoAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
  },
  grupoAvatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  grupoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  grupoNombre: { fontSize: 16, fontWeight: '700' },
  grupoDesc: { fontSize: 13 },
  adminBadge: {
    backgroundColor: '#FFF3CD', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 20,
  },
  adminBadgeText: { color: '#856404', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  grupoMeta: { flexDirection: 'row', gap: 20 },
  grupoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grupoMetaText: { fontSize: 13 },
});