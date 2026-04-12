import { use, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { View, Text } from '../components/Themed';
import { useAuthStore } from '@/storage/useAuthStorage';
import { GastoPersonal } from '@/storage/types';
import ModalGastoPersonal from '@/components/ModalPersonal';

export default function ViewerGastos() {
  // Leer directo del store — ya está sincronizado con AsyncStorage via persist
  const gastosPersonales = useAuthStore((s) => s.user?.gastosPersonales ?? []);
  const deleteGasto      = useAuthStore((s) => s.deleteGastoPersonal)
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGastoId, setSelectedGastoId] = useState<string | null>(null);

   const handleEliminar = (id: string) => {
    // ✅ Llama directo a la acción del store, sin hooks dentro de funciones
    console.log("Eliminado gasto")
    deleteGasto(id);
  };
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.titulo}>Mis Gastos</Text>

        {gastosPersonales.length === 0 ? (
          <Text style={styles.empty}>No hay gastos registrados.</Text>
        ) : (
          gastosPersonales.map((gasto: GastoPersonal) => (
            <View key={gasto.id} style={styles.card}>
              <Text style={styles.desc}>{gasto.descripcion}</Text>
              <Text style={styles.categoria}>{gasto.categoria}</Text>
              <Text style={styles.monto}>${gasto.monto.toLocaleString('es-CL')}</Text>
              <View style={styles.container_button} lightColor='transparent' darkColor='transparent'>
                      <Pressable onPress={() => {
                        setSelectedGastoId(gasto.id);
                        setModalVisible(true);
                      }} style={styles.button_edit}>
                        <Text lightColor='#fff'>Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => handleEliminar(gasto.id)} style={styles.button_delete}>
                        <Text lightColor='#fff'>Eliminar</Text>
                      </Pressable>
              </View>
            </View>
          ))
        )}
        
        <ModalGastoPersonal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setSelectedGastoId(null); }}
          idGasto={selectedGastoId}
        />
        
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 20 },
  titulo:     { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  empty:      { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 40 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F7FA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desc:       { fontSize: 15, fontWeight: '600', flex: 1 },
  categoria:  { fontSize: 13, color: '#888' },
  monto:      { fontSize: 15, fontWeight: '700', color: '#007AFF' },
  container_button: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button_delete: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ff0000e1',
  },
  button_edit: { 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ff9900',
  },
});