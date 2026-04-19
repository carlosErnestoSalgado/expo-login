// ─── CATEGORÍAS ────────────────────────────────────────────────────────────────

import { Float } from "react-native/Libraries/Types/CodegenTypes";

export type CategoriaComun =
  | 'Alquiler'
  | 'Supermercado'
  | 'Servicios'
  | 'Ocio'
  | 'Gimnasio'
  | 'Transporte'
  | 'Salud'
  | 'Mascota'
  | 'Electrodomésticos'
  | 'Otros';

export type CategoriaPersonal =
  | 'Ropa'
  | 'Familia'
  | 'Comida personal'
  | 'Suscripciones'
  | 'Cuidado personal'
  | 'Educacion'
  | 'Entretenimiento'
  | 'Ahorro individual'
  | 'Otros';

// ─── GASTOS ────────────────────────────────────────────────────────────────────

export interface GastoComun {
  id: string;
  descripcion: string;
  categoria: CategoriaComun | null;
  monto: number;
  quienPago: string | null; // null = gasto compartido sin pagador específico
  fecha?: string;           // ISO date string, opcional
  deuda: DeudaMiembro[];  // Se guardara el MiembroDeuda de cada miebro lo que debe a este gasto 
}

export interface GastoPersonal {
  id: string;
  descripcion: string;
  categoria: CategoriaPersonal;
  monto: number;
  fecha?: string;
  mesId: string; // "YYYY-MM", para asociar al mes correspondiente
}

// ─── AHORRO ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  objetivo: string;    // Ej: "Viaje a la playa"
  montoMeta: number;   // Ej: 1000000
  montoActual: number; // Lo ahorrado hasta ahora
}

export type MesNombre =
  | 'Enero' | 'Febrero' | 'Marzo' | 'Abril'
  | 'Mayo'  | 'Junio'   | 'Julio' | 'Agosto'
  | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre';

export interface AportesMes {
  mes: MesNombre;
  aporteP1: number;
  aporteP2: number;
}

export interface AhorroComun {
  id: string;
  nombreMeta: string;    // Ej: "Vacaciones"
  montoTotal: number;    // Meta total a alcanzar
  ahorroMensual: number; // Cuánto aportan juntos cada mes
  aportesPorMes: AportesMes[]; // Historial mes a mes
}

// ─── FINANZAS DEL MES ──────────────────────────────────────────────────────────

/**
 * Snapshot de las finanzas de un mes completo.
 * Se guarda por mesId (ej: "2026-04") para historial.
 */
export interface FinanzasMes {
  mesId: string;           // "YYYY-MM", ej: "2026-04"
  nombreMes: string;       // "Abril 2026"
  salarioP1: number;
  salarioP2: number;
  ahorroComun: number;     // Meta de ahorro común mensual
  gastosComunes: GastoComun[];
  gastosP1: GastoPersonal[];
  gastosP2: GastoPersonal[];
}

// ─── USUARIO ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
  foto?: string;
  salario: number;  // Salario mensual, para cálculo de aportes
  goals: Goal[];      // Metas de ahorro individuales
  groupIds: string[]; // IDs de grupos a los que pertenece
  gastosPersonales: GastoPersonal[];
}

// ─── GRUPO ─────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  nombre: string;
  descripcion: string;
  foto: string;
  codigoUnirse: string;  // Código único, ej: "A7B8C9"
  adminId: string;       // ID del creador
  members: string[];     // IDs de los miembros
  esGastos: boolean;
  totalGastosComunes: Number, 
  gastosDelGrupo: GastoComun[],
  esAhorro: boolean,
  metaGuardar: Number,
  // Configuración financiera del grupo (lo que define el Excel)
  miembros: MiembroGrupo[];             // Info financiera de cada persona
  ahorroComun: AhorroComun | null;      // Meta de ahorro compartida
  historialMeses: FinanzasMes[];        // Uno por cada mes registrado
}

export interface MiembroGrupo {
  userId: string;
  nombre: string;       // "Carlos", "Camila"
  salario: number;
  metaAhorroIndividual: number;
  porcentaje: number;   // Porcentaje de lo que debe aportar el miembro a los gastpos del grupo si es esGastos

}

// ─── RESUMEN CALCULADO (solo lectura, derivado del store) ───────────────────

export interface ResumenMes {
  totalSalarios: number;
  totalGastosComunes: number;
  aporteP1: number;         // Proporcional al salario
  aporteP2: number;
  disponibleP1: number;     // Salario - aporte
  disponibleP2: number;
  totalGastadoP1: number;
  totalGastadoP2: number;
  saldoRestanteP1: number;
  saldoRestanteP2: number;
  deudaEntrePersonas: number; // Positivo = P2 le debe a P1, negativo = al revés
}


export interface Member {
    userId: string | undefined;
    nombre: string | undefined;
    salario: number | undefined;
    metaAhorroIndividual: number;
}

export interface BalanceMiembro {
  userId: string;
  nombre: string;
  balance: number; // positivo = le deben, negativo = debe
}




// Tipo de dato para identificar las deudas que sera un array en 
// Gastos paara identificar lo que debe cada miembro
// del grupo al gasto realizado
export interface DeudaMiembro {
  user_id: string;
  debe: number;   // MiembroGrupo.porcentaje * GastoComun.monto
  deudaMiembro: boolean;
  name: string;
}