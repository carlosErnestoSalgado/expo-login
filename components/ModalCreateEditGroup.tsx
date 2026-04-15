import ModalWrapper from "./ModalWrapper"
import { useState, useEffect } from "react"
import { Text, View } from "./Themed"
import { Switch, TextInput, View as RNView, Pressable, StyleSheet, Platform} from "react-native"
import { useColorScheme } from "react-native"
import { Group } from "@/storage/types"
import { useAuthStore } from "@/storage/useAuthStorage"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authService } from "@/storage/authservices"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface ModaleInterface {
  modalCrear: boolean,
  setModalCrear: (value: boolean) => void,
  idGroup?: string,
  group?: Group
}

export default function ModalCreateEditGroup ({modalCrear, setModalCrear, idGroup, group}:ModaleInterface){
    //Authstate
    const user     = useAuthStore((s) => s.user);
    const joinGroup  = useAuthStore((s) => s.joinGroup);
    const addIdGroupToUser = useAuthStore((s) => s.setIdGroupInUser)
    //const u = useAuthStore((s) => s.setIdGroupInUser)



    // Grupo de ahorros
    const [moneySaveGroup, setMoneySaveGroup] = useState(false);
    const [gastosComunes, setGastosComunes]  = useState<Number>(0);

    // Guardar dinero
    const [alcancia, SetAlcancia]    = useState(false)
    const [meta, setMeta]            = useState<Number>(0)

    // Form — Crear grupo
    const [nombreGrupo, setNombreGrupo] = useState('');
    const [descGrupo,   setDescGrupo]   = useState('');
    
    const isDark   = useColorScheme() === 'dark';


    
    const inputStyle = [
      styles.input,
      { backgroundColor: isDark ? '#2C2C2E' : '#F5F7FA', color: isDark ? '#FFF' : '#000' },
    ];

    // ✅ Correcto
    useEffect(() => {
      if (group) {
        setNombreGrupo(group.nombre);
        setDescGrupo(group.descripcion);
        setMoneySaveGroup(group.esAhorro);
        setGastosComunes(group.gastosComunes);
        SetAlcancia(group.esAhorro);
        setMeta(group.metaGuardar);
      }
    }, [group]);

     // ── Crear grupo ────────────────────────────────────────────────────────────
     const handleCrear = () => {
        if (!nombreGrupo.trim()) return;
    
        const nuevoGrupo: Group = {
          id:           Math.random().toString(36).substring(2),
          nombre:       nombreGrupo.trim(),
          descripcion:  descGrupo.trim(),
          foto:         '',
          codigoUnirse: generarCodigo(),
          adminId:      user?.id ?? '',
          members:      [user?.id ?? ''],
          miembros:     user
          ? [{ userId: user.id, nombre: user.name, salario: 0, metaAhorroIndividual: 0 }]
          : [],
          ahorroComun:    null,
          esGastos:     moneySaveGroup,
          gastosComunes: moneySaveGroup ? gastosComunes : 0,
          historialMeses: [],
          esAhorro:     alcancia,
          metaGuardar:  meta
        };
    
        joinGroup(nuevoGrupo);
        addIdGroupToUser(nuevoGrupo.id)
        // Actualizo el ususario en state al registrado
        if (user){
          authService.updateUserRegistered(user);
        }

        //setIdGroupInUser(nuevoGrupo.id)
        setNombreGrupo('');
        setDescGrupo('');
        setModalCrear(false);
        
      };
    
    return(
     <>
           <ModalWrapper visible={modalCrear} onClose={() => setModalCrear(false)}>
             <Text style={styles.modalTitle} lightColor="#1A1A1A" darkColor="#FFF">
               {idGroup ? "Crear grupo" : "Editar Grupo"}
             </Text>
     
             <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
               Nombre del grupo *
             </Text>
             <TextInput
               style={inputStyle}
               placeholder="Ej: Hogar Pérez"
               placeholderTextColor={isDark ? '#555' : '#AAA'}
               value={nombreGrupo}
               onChangeText={setNombreGrupo}
             />
             <View style={{flexDirection: "row", alignItems: "center",justifyContent: "space-between", gap: 6}} darkColor="transparent">
               <Text style={styles.labelBold} lightColor='#555' darkColor='#aaa'>
                 Grupod de Ahorros
               </Text>
               <Switch 
               value={moneySaveGroup}
               onValueChange={(moneySaveGroup) => setMoneySaveGroup(moneySaveGroup)}
               trackColor={{ false: '#767577', true: '#34C759' }}
               thumbColor="white" 
               />
             
             </View>
             {
               moneySaveGroup ?
               <>
               <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
               Destinado a gastos comunes *
               </Text>
               <TextInput
               style={inputStyle}
               placeholder="0"
               placeholderTextColor={isDark ? '#555' : '#AAA'}
               keyboardType="numeric"
               value={String(gastosComunes ?? 0)}
               onChangeText={(text) => setGastosComunes(Number(text))}
               />
               </>
               : null
             }
            
              <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6}} darkColor="transparent">
                <Text style={styles.labelBold} lightColor='#555' darkColor='#aaa'>
                  Decididos a ahorrar
                </Text>
                <Switch
                  value={alcancia}
                  onValueChange={(alcancia) =>{ 
                    console.log("alcancia cambia a:", alcancia);  // ← agrega esto
                    SetAlcancia(alcancia)}}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="white"
                />
              </View>

              {/* ← Fuera del View del switch */}
              {alcancia && (
                <>
                  <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
                    Meta alcanzable *
                  </Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#555' : '#AAA'}
                    keyboardType="numeric"
                    value={String(meta ?? 0)}
                    onChangeText={(val) => setMeta(Number(val))}
                  />
                </>
              )}
             
             
             <Text style={styles.modalLabel} lightColor="#555" darkColor="#AAA">
               Descripción (opcional)
             </Text>
             <TextInput
               style={inputStyle}
               placeholder="Ej: Gastos del departamento"
               placeholderTextColor={isDark ? '#555' : '#AAA'}
               value={descGrupo}
               onChangeText={setDescGrupo}
             />
     
             <RNView style={styles.modalBtns}>
               <Pressable
                 style={[styles.modalBtn, styles.modalBtnCancel]}
                 onPress={() => {
                  setModalCrear(false);

                  // Limpieza de los campos
                  setDescGrupo("");
                  setNombreGrupo("");
                  setMoneySaveGroup(false);
                  setGastosComunes(0);
                  setMeta(0);
                  SetAlcancia(false);
                  if(group){
                    setNombreGrupo(group.nombre);
                    setDescGrupo(group.descripcion);
                    setMoneySaveGroup(group.esAhorro);
                    setGastosComunes(group.gastosComunes);
                    SetAlcancia(group.esAhorro);
                    setMeta(group.metaGuardar);
                  }
                }}
               >
                 <Text style={{ color: '#888', fontWeight: '600' }}>Cancelar</Text>
               </Pressable>
               <Pressable
                 style={[styles.modalBtn, styles.modalBtnConfirm, !nombreGrupo.trim() && { opacity: 0.4 }]}
                 onPress={handleCrear}
                 disabled={!nombreGrupo.trim()}
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