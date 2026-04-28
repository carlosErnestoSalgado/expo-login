import ModalWrapper from "./ModalWrapper"
import { useState, useEffect } from "react"
import { Text, View } from "./Themed"
import { Switch, TextInput, View as RNView, Pressable, StyleSheet, Platform} from "react-native"
import { useColorScheme } from "react-native"
import { Goal, Group } from "@/storage/types"
import { useAuthStore } from "@/storage/useAuthStorage"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authService } from "@/storage/authservices"
 
/* 
export interface Goal {
  id: string;
  objetivo: string;    // Ej: "Viaje a la playa"
  montoMeta: number;   // Ej: 1000000
  montoActual: number; // Lo ahorrado hasta ahora
}


*/

 interface ModalCrearEditGoalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  goalToEdit?: Goal; // Si se proporciona, el modal se usará para editar
}

export default function ModalCrearEditGoal ({  visible, onClose, onSave, goalToEdit}: ModalCrearEditGoalProps){

    const updateGoal = useAuthStore((s) => s.updateGoal)

    // Capmpos de los inputs
    const [objetivo, setObjetivo] = useState("");
    const [montoMeta, setMontoMeta] = useState(0);
    const isDark = useColorScheme() === 'dark';
  
    useEffect(() => {
        if (goalToEdit) {
            setObjetivo(goalToEdit.objetivo);
            setMontoMeta(goalToEdit.montoMeta);
        } else {
            setObjetivo("");
            setMontoMeta(0);
        }
    }, [goalToEdit, visible]);

    const handleCrear = async() => {
          if (goalToEdit){
          const goalEdited = {
            ...goalToEdit,
            id: goalToEdit.id,
            objetivo: objetivo.trim(),
            montoMeta: montoMeta
          };
          updateGoal(goalEdited);
          onClose();
        }else{
          const newGoal: Goal = {
              id: goalToEdit ? goalToEdit.id : Date.now().toString(),
              objetivo: objetivo.trim(),
              montoMeta: montoMeta,
              montoActual: goalToEdit ? goalToEdit.montoActual : 0,
          };
          
          
          onSave(newGoal);
          onClose();

        }
      
    };


    const inputStyle = [
      styles.input,
      { backgroundColor: isDark ? '#2C2C2E' : '#F5F7FA', color: isDark ? '#FFF' : '#000' },
    ];

    return(
        <>
            <ModalWrapper visible={visible} onClose={onClose}>
             <Text style={styles.modalTitle} lightColor="#1A1A1A" darkColor="#FFF">
               {goalToEdit ? "Editar Grupo" : "Crear Grupo"}
             </Text>
     
             <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
               Objetivo *
             </Text>
             <TextInput
               style={inputStyle}
               placeholder="Ej: Viaje a la playa"
               placeholderTextColor={isDark ? '#555' : '#AAA'}
               value={objetivo}
               onChangeText={setObjetivo}
             />
             
             
             <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
               Monto Meta *
             </Text>
             <TextInput
               style={inputStyle}
               placeholder="Ej: 1000"
               placeholderTextColor={isDark ? '#555' : '#AAA'}
               inputMode="numeric"
               value={String(montoMeta)}
               onChangeText={(text) => setMontoMeta(Number(text))}
             />
     
             <RNView style={styles.modalBtns}>
               <Pressable
                 style={[styles.modalBtn, styles.modalBtnCancel]}
                 onPress={() => {
                     onClose();

                  // Limpieza de los campos
                  setObjetivo("");
                  setMontoMeta(0);
                  if(goalToEdit){
                    setObjetivo(goalToEdit.objetivo);
                    setMontoMeta(goalToEdit.montoMeta);
                  }
                }}
               >
                 <Text style={{ color: '#888', fontWeight: '600' }}>Cancelar</Text>
               </Pressable>
               
               <Pressable
                 style={[styles.modalBtn, styles.modalBtnConfirm, !objetivo.trim() && { opacity: 0.4 }]}
                 onPress={handleCrear}
                 disabled={!objetivo.trim() || montoMeta <= 0}
               >
                 <Text style={{ color: '#FFF', fontWeight: '700' }}>Crear</Text>
               </Pressable>
             </RNView>
           </ModalWrapper>
        </>
            )
}
const styles = StyleSheet.create({
  labelBold: {
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  // Acciones rápidas
  accionesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  accionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    ...Platform.select({
      ios: { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  accionBtnSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  accionPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  accionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },

 
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },

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
  
});