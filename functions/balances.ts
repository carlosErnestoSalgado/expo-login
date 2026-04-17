import { GastoComun, BalanceMiembro , MiembroGrupo} from "@/storage/types";

export function calcularBalancesGrupo(
  miembros: MiembroGrupo[],
  gastos: GastoComun[]
): BalanceMiembro[] {

  if (miembros.length === 0) return [];

  // 1 — Total salarios
  const totalSalarios = miembros.reduce(
    (acc, m) => acc + m.salario,
    0
  );

  if (totalSalarios === 0) return [];

  // 2 — Total gastos
  const totalGastos = gastos.reduce(
    (acc, g) => acc + g.monto,
    0
  );

  // 3 — Calcular pagos reales por persona
  const pagosReales = miembros.map(m => {

    const pago = gastos
      .filter(g => g.quienPago === m.userId)
      .reduce((acc, g) => acc + g.monto, 0);

    return {
      userId: m.userId,
      pagoReal: pago
    };

  });

  // 4 — Calcular balances finales
  const balances: BalanceMiembro[] =
    miembros.map(m => {

      const porcentaje =
        m.salario / totalSalarios;

      const debePagar =
        totalGastos * porcentaje;

      const pagoReal =
        pagosReales.find(
          p => p.userId === m.userId
        )?.pagoReal ?? 0;

      return {
        userId: m.userId,
        nombre: m.nombre,
        balance: Math.round(
          pagoReal - debePagar
        )
      };

    });

  return balances;
}

export interface Transferencia {
  de: string;
  a: string;
  monto: number;
}

export function calcularTransferencias(
  balances: BalanceMiembro[]
): Transferencia[] {

  const deudores =
    balances
      .filter(b => b.balance < 0)
      .map(b => ({
        ...b,
        balance: Math.abs(b.balance)
      }));

  const acreedores =
    balances
      .filter(b => b.balance > 0);

  const transferencias: Transferencia[] = [];

  for (const deudor of deudores) {

    let deudaRestante =
      deudor.balance;

    for (const acreedor of acreedores) {

      if (acreedor.balance === 0) continue;

      const monto =
        Math.min(
          deudaRestante,
          acreedor.balance
        );

      if (monto > 0) {

        transferencias.push({
          de: deudor.userId,
          a: acreedor.userId,
          monto
        });

        deudaRestante -= monto;
        acreedor.balance -= monto;
      }

      if (deudaRestante === 0)
        break;

    }

  }

  return transferencias;
}