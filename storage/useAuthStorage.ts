import { create } from 'zustand';
import {
  User, Group, Goal,
  GastoComun, GastoPersonal,
  AhorroComun, AportesMes,
  FinanzasMes, MiembroGrupo,
  ResumenMes, MesNombre,
} from './types';
import { Platform } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  joinGroup: (group: Group) => void;

  // ── Acciones de Miembros del grupo ──
  updateSalario: (grupoId: string, userId: string, salario: number) => void;
  updateMetaAhorroIndividual: (grupoId: string, userId: string, meta: number) => void;

  // ── Acciones de Meses ──
  setMesActivo: (mesId: string) => void;
  crearMes: (grupoId: string, mes: FinanzasMes) => void;
  updateAhorroComun: (grupoId: string, mesId: string, nuevoMonto: number) => void;

  // ── Acciones de Gastos Comunes ──
  addGastoComun: (grupoId: string, mesId: string, gasto: GastoComun) => void;
  updateGastoComun: (grupoId: string, mesId: string, gasto: GastoComun) => void;
  deleteGastoComun: (grupoId: string, mesId: string, gastoId: string) => void;

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
  setUser: (user) => set({ user, isLogged: !!user, userName: user?.name ?? '' }),
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

  joinGroup: (group) => set((state) => ({
    groups: [...state.groups, group],
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
  addGastoComun: (grupoId, mesId, gasto) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m, gastosComunes: [...m.gastosComunes, gasto],
    })),
  })),

  updateGastoComun: (grupoId, mesId, gasto) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m,
      gastosComunes: m.gastosComunes.map(g => g.id === gasto.id ? gasto : g),
    })),
  })),

  deleteGastoComun: (grupoId, mesId, gastoId) => set((state) => ({
    groups: updateMesEnGrupo(state.groups, grupoId, mesId, (m) => ({
      ...m,
      gastosComunes: m.gastosComunes.filter(g => g.id !== gastoId),
    })),
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

}),  {
      name: 'auth-storage',        // clave en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    })
);


