import { create } from 'zustand';
import {
  User, Group, Goal,
  GastoComun, GastoPersonal,
  AhorroComun, AportesMes,
  FinanzasMes, MiembroGrupo,
  ResumenMes, MesNombre,
  Member,
} from './types';
import { Platform } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authservices';
import GrupoCard from '@/components/GroupCard';


// ─── HELPERS ───────────────────────────────────────────────────────────────────

function calcularResumen(mes: FinanzasMes, miembros: MiembroGrupo[]): ResumenMes {
  const [p1, p2] = miembros;
  const totalSalarios = p1.salario + p2.salario;

  const totalGastosComunes = mes.gastosComunes.reduce((s, g) => s + g.monto, 0);
  const totalACubrir = totalGastosComunes + mes.ahorroComun;

  const aporteP1 = totalACubrir * (p1.salario / totalSalarios);
  const aporteP2 = totalACubrir * (p2.salario / totalSalarios);

  const totalGastadoP1 = mes.gastosP1.reduce((s, g) => s + g.monto, 0);
  const totalGastadoP2 = mes.gastosP2.reduce((s, g) => s + g.monto, 0);

  const disponibleP1 = p1.salario - aporteP1;
  const disponibleP2 = p2.salario - aporteP2;

  // Deuda: si P1 pagó gastos comunes que correspondían a P2 (o viceversa)
  const pagadoPorP1 = mes.gastosComunes
    .filter(g => g.quienPago === p1.userId)
    .reduce((s, g) => s + g.monto, 0);
  const pagadoPorP2 = mes.gastosComunes
    .filter(g => g.quienPago === p2.userId)
    .reduce((s, g) => s + g.monto, 0);
  // Positivo = P2 le debe a P1
  const deudaEntrePersonas = pagadoPorP1 - aporteP1 - (pagadoPorP2 - aporteP2);

  return {
    totalSalarios,
    totalGastosComunes,
    aporteP1,
    aporteP2,
    disponibleP1,
    disponibleP2,
    totalGastadoP1,
    totalGastadoP2,
    saldoRestanteP1: disponibleP1 - totalGastadoP1,
    saldoRestanteP2: disponibleP2 - totalGastadoP2,
    deudaEntrePersonas,
  };
}



// ─── ESTADO ────────────────────────────────────────────────────────────────────

interface AuthState {
  // Auth
  user: User | null;
  isLogged: boolean;
  userName: string;

  // Grupos
  groups: Group[];

  // Mes activo (para el grupo activo)
  mesActivoId: string | null; // "YYYY-MM"


  // ── Acciones de Auth ──
  setUser: (user: User | null) => void;
  setIsLogged: (status: boolean) => void;
  logout: () => void;

  // ── Acciones de Goals individuales ──
  addGoal: (newGoal: Goal) => void;
  updateGoalProgress: (goalId: string, amount: number) => void;

  // ── Acciones de Grupos ──
  setGroups: (groups: Group[]) => void;
  joinGroup: (newMember: MiembroGrupo, grupoId:string) => void;
  createGroup: (group: Group) => void;
  setIdGroupInUser: (id: string) => void;

  // ── Acciones de Miembros del grupo ──
  updateSalario: (grupoId: string, userId: string, salario: number) => void;
  updateMetaAhorroIndividual: (grupoId: string, userId: string, meta: number) => void;

  // ── Acciones de Meses ──
  setMesActivo: (mesId: string) => void;
  crearMes: (grupoId: string, mes: FinanzasMes) => void;
  updateAhorroComun: (grupoId: string, mesId: string, nuevoMonto: number) => void;

  // ── Acciones de Gastos Comunes ──
  addGastoComun: (grupoId: string, gasto: GastoComun) => void;
  updateGastoComun: (grupoId: string, mesId: string, gasto: GastoComun) => void;
  deleteGastoComun: (grupoId: string, gastoId: string) => void;

  // ── Acciones de Gastos Personales ──
  //addGastoPersonal: (grupoId: string, mesId: string, persona: 'p1' | 'p2', gasto: GastoPersonal) => void;
  addGastoPersonal: (mesId: string, gasto: GastoPersonal) => void;
  updateGastoPersonal: (idGasto:string,  cambios: Partial<GastoPersonal>) => void;
  deleteGastoPersonal: (gastoId: string) => void;

  // ── Acciones de Ahorro Común ──
  setAhorroComun: (grupoId: string, ahorro: AhorroComun) => void;
  registrarAporteMes: (grupoId: string, mes: MesNombre, aporte: AportesMes) => void;

  // ── Selectores derivados ──
  getGastosPersonalesPorMes: (mesId: string) => GastoPersonal[];
  getResumenMes: (grupoId: string, mesId: string) => ResumenMes | null;
  getMesActivo: (grupoId: string) => FinanzasMes | null;
  getGastosComunesPorCategoria: (grupoId: string, mesId: string) => Record<string, number>;
  getGastosPersonalesPorCategoria: (grupoId: string, mesId: string, persona: 'p1' | 'p2') => Record<string, number>;
  
  // Acciones para grupos
  getGroupById: (grupoId: string) => Group | null;
  deleteGroupById: (groupId:string) => void;
  getGroupByUser: () => Group[] | null;

  // Obtener miembros de un grupo
  getUsersFromGroup: (groupId: string) => Promise<User[]>; 
  exitOfGroup: (groupId: string) => void;


  // Para porcentaje en grupo
  updatePorcentajeMember: (codigoUnirse: string, totalIncomes: number) => void;
  saldarDeuda: (grupoId: string, gastoId: string, userId: string) => void;            
  saldarTodasDeudas: (grupoId: string, userId: string) => void; 
  
}

// ─── HELPERS INTERNOS ──────────────────────────────────────────────────────────

function updateMesEnGrupo(
  groups: Group[],
  grupoId: string,
  mesId: string,
  updater: (mes: FinanzasMes) => FinanzasMes
): Group[] {
  return groups.map(g =>
    g.id !== grupoId ? g : {
      ...g,
      historialMeses: g.historialMeses.map(m =>
        m.mesId !== mesId ? m : updater(m)
      ),
    }
  );
}

// ─── STORE ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
  (set, get) => ({
  user: null,
  isLogged: false,
  userName: '',
  groups: [],
  mesActivoId: null,

  // ── Auth ──
  setUser: (user) => set({user: user}),
  setIsLogged: (status) => set({ isLogged: status }),
  logout: () => set({ user: null, isLogged: false, groups: [], mesActivoId: null }),

  // ── Goals individuales ──
  addGoal: (newGoal) => set((state) => ({
    user: state.user
      ? { ...state.user, goals: [...state.user.goals, newGoal] }
      : null,
  })),

  updateGoalProgress: (goalId, amount) => set((state) => ({
    user: state.user ? {
      ...state.user,
      goals: state.user.goals.map(g =>
        g.id === goalId ? { ...g, montoActual: g.montoActual + amount } : g
      ),
    } : null,
  })),

  // ── Grupos ──
  setGroups: (groups) => set({ groups }),

  createGroup: (grupo) => set((state) => ({
  groups: [...state.groups, grupo]
  })),

  joinGroup: (newMember: MiembroGrupo, grupoId: string) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : {
        ...g,
        members: [...g.members, newMember.userId],      // ← solo el ID
        miembros: [...g.miembros, newMember],            // ← objeto completo
      }
    )
  })),

  setIdGroupInUser: (id) => set((state) => ({
    user: state.user ? 
    {
      ...state.user, 
      groupsIds: [...state.user.groupIds, id]

    }: null
  })),
  // ── Miembros ──
  updateSalario: (grupoId, userId, salario) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : {
        ...g,
        miembros: g.miembros.map(m =>
          m.userId !== userId ? m : { ...m, salario }
        ),
      }
    ),
  })),
  updatePorcentajeMember: (codigoUnirse, totalIncomes) => set((state) => ({
  groups: state.groups.map(g =>
    g.codigoUnirse !== codigoUnirse ? g : {  // ← !== para actualizar el grupo correcto
      ...g,
      miembros: g.miembros.map(m => ({       // ← paréntesis alrededor del objeto
        ...m,
        porcentaje: Math.round((m.salario / totalIncomes) * 100) / 100 // ←
      }))
    }
  )
})),
  updateMetaAhorroIndividual: (grupoId, userId, meta) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : {
        ...g,
        miembros: g.miembros.map(m =>
          m.userId !== userId ? m : { ...m, metaAhorroIndividual: meta }
        ),
      }
    ),
  })),

  // ── Meses ──
  setMesActivo: (mesId) => set({ mesActivoId: mesId }),

  crearMes: (grupoId, mes) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : {
        ...g,
        historialMeses: [...g.historialMeses, mes],
      }
    ),
  })),

  updateAhorroComun: (grupoId, mesId, nuevoMonto) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m, ahorroComun: nuevoMonto,
    })),
  })),

  // ── Gastos Comunes ──
  addGastoComun: (grupoId, gasto) => set((state) => ({
  groups: state.groups.map(g =>
    g.id !== grupoId ? g : {
      ...g,
      gastosDelGrupo: [...g.gastosDelGrupo, gasto],
    }
  ),
})),
  updateGastoComun: (grupoId, mesId, gasto) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m,
      gastosComunes: m.gastosComunes.map(g => g.id === gasto.id ? gasto : g),
    })),
  })),

  deleteGastoComun: (grupoId, gastoId) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : {
        ...g,  
        gastosDelGrupo: g.gastosDelGrupo.filter(gasto => gasto.id !== gastoId),
      }
    )
  })),

  addGastoPersonal: (mesId, gasto) => set((state) => ({
    user: state.user ? {
      ...state.user,
      gastosPersonales: [...state.user.gastosPersonales, gasto]}:null    
  })),
/*
  // ── Gastos Personales ──
  addGastoPersonal: (grupoId, mesId, persona, gasto) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m,
      gastosP1: persona === 'p1' ? [...m.gastosP1, gasto] : m.gastosP1,
      gastosP2: persona === 'p2' ? [...m.gastosP2, gasto] : m.gastosP2,
    })),
  })),*/

  updateGastoPersonal: (idGasto, cambios) => set((state) => ({
    user: state.user ? {
      ...state.user,
      gastosPersonales: state.user.gastosPersonales.map(g =>
        g.id === idGasto ? { ...g, ...cambios } : g  // ← merge con spread
      ),
    } : null,
  })),

  deleteGastoPersonal: (gastoId) => set((state) => ({
    user: state.user ? {
      ...state.user,
      gastosPersonales: state.user.gastosPersonales.filter(g => g.id != gastoId)
    }: null
  })),

  // ── Ahorro Común ──
  setAhorroComun: (grupoId, ahorro) => set((state) => ({
    groups: state.groups.map(g =>
      g.id !== grupoId ? g : { ...g, ahorroComun: ahorro }
    ),
  })),

  registrarAporteMes: (grupoId, mes, aporte) => set((state) => ({
    groups: state.groups.map(g => {
      if (g.id !== grupoId || !g.ahorroComun) return g;
      const aportes = g.ahorroComun.aportesPorMes;
      const existe = aportes.find(a => a.mes === mes);
      return {
        ...g,
        ahorroComun: {
          ...g.ahorroComun,
          aportesPorMes: existe
            ? aportes.map(a => a.mes === mes ? aporte : a)
            : [...aportes, aporte],
        },
      };
    }),
  })),

  // ── Selectores derivados ──
  // Agrega un selector para filtrar por mes
  getGastosPersonalesPorMes: (mesId) => {
    const gastos = get().user?.gastosPersonales ?? [];
    return gastos.filter(g => g.mesId === mesId);
  },
  getResumenMes: (grupoId, mesId) => {
    const grupo = get().groups.find(g => g.id === grupoId);
    const mes = grupo?.historialMeses.find(m => m.mesId === mesId);
    if (!grupo || !mes) return null;
    return calcularResumen(mes, grupo.miembros);
  },

  getMesActivo: (grupoId) => {
    const { groups, mesActivoId } = get();
    const grupo = groups.find(g => g.id === grupoId);
    return grupo?.historialMeses.find(m => m.mesId === mesActivoId) ?? null;
  },

  getGastosComunesPorCategoria: (grupoId, mesId) => {
    const grupo = get().groups.find(g => g.id === grupoId);
    const mes = grupo?.historialMeses.find(m => m.mesId === mesId);
    if (!mes) return {};
    return mes.gastosComunes.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
      return acc;
    }, {});
  },



  getGastosPersonalesPorCategoria: (grupoId, mesId, persona) => {
    const grupo = get().groups.find(g => g.id === grupoId);
    const mes = grupo?.historialMeses.find(m => m.mesId === mesId);
    if (!mes) return {};
    const gastos = persona === 'p1' ? mes.gastosP1 : mes.gastosP2;
    return gastos.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
      return acc;
    }, {});
  },

 getGroupById: (grupoId: string | number) => {
  const group = get().groups.find(g => String(g.id) === String(grupoId));

  if (group) {
    return group;
  }
  return null;
},

  getGroupByUser: () => {
  const userId = get().user?.id;
  const groups = get().groups ?? []; // ← fallback a [] si es undefined

  if (groups.length === 0) return [];

  return groups.filter((group) => group.members.some(u => u === userId));
},

  getUsersFromGroup: async (groupId: string) => {
    console.log("String del id que llega ", groupId )
    const stored = await AsyncStorage.getItem('@registered_users');
    const users = JSON.parse(stored ?? '[]');
    console.log("Usuarios registrados: ", users)
    const group = users.filter((u: any) => u.groupIds.includes(groupId));
    console.log("grupo: ", group)
    return users.filter((u: any) => u.groupIds.includes(groupId));
  },
  updateGastosgrupo: (grupoId:string) => {

  },
exitOfGroup: (groupId: string) => set((state) => ({
  groups: state.groups.map(g =>
    g.id !== groupId ? g : {
      ...g,
      miembros: g.miembros.filter(m => m.userId !== state.user?.id),
      members: g.members.filter(u => u != state.user?.id)
    }
  )
})),

saldarDeuda: (grupoId, gastoId, userId) => set((state) => ({
  groups: state.groups.map(g =>
    g.id !== grupoId ? g : {
      ...g,
      gastosDelGrupo: g.gastosDelGrupo.map(gasto =>
        gasto.id !== gastoId ? gasto : {
          ...gasto,
          deuda: (gasto.deuda ?? []).map(deuda =>
            deuda.user_id !== userId ? deuda : {
              ...deuda,
              deudaMiembro: false  // 👈 marca como saldada
            }
          )
        }
      )
    }
  )
})),
saldarTodasDeudas: (grupoId, userId) => set((state) => ({
  groups: state.groups.map(g =>
    g.id !== grupoId ? g : {
      ...g,
      gastosDelGrupo: g.gastosDelGrupo.map(gasto => ({
        ...gasto,
        deuda: (gasto.deuda ?? []).map(deuda =>
          deuda.user_id === userId ? { ...deuda, deudaMiembro: false } : deuda
        )
      }))
    }
  )
})),
deleteGroupById: (groupId: string) => set((s) => ({
  groups: s.groups.filter(g =>
    g.id !== groupId
  )
})),

}),  {
      name: 'auth-storage',        // clave en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    })
);


