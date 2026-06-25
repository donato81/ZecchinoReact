import {
  Transaction,
  Category,
  MonthlyComparisonRow,
  MonthlyComparisonOptions,
} from './types';
import { extractDatePart, roundCurrency } from './helpers';
import { strings } from '@/locales';

export function extractMonthTransactions(
  transactions: Transaction[],
  year: number,
  month: number,
  movementType: 'entrata' | 'uscita',
  includeTransfers: boolean = false,
): Transaction[] {
  return transactions.filter(t => {
    // Gestione trasferimenti
    if (t.tipo === 'trasferimento') {
      if (!includeTransfers) return false;
    } else {
      if (t.tipo !== movementType) return false;
    }

    // Filtro mese timezone-safe usando extractDatePart
    const dateStr = extractDatePart(t.data);
    const [y, m] = dateStr.split('-').map(Number);
    return y === year && m === month;
  });
}

export function aggregateByCategory(
  transactions: Transaction[],
): Record<string, number> {
  const aggregated: Record<string, number> = {};
  for (const t of transactions) {
    const cid = t.categoriaId || 'nessuna';
    const amount = Math.abs(t.importo);
    aggregated[cid] = (aggregated[cid] || 0) + amount;
  }
  return aggregated;
}

export function computeMonthlyComparison(
  transactions: Transaction[],
  categories: Category[],
  options: MonthlyComparisonOptions,
): MonthlyComparisonRow[] {
  const {
    baseYear,
    baseMonth,
    compareYear,
    compareMonth,
    movementType,
    includeTransfers = false,
    excludeZeroRows = true,
  } = options;

  const baseTx = extractMonthTransactions(
    transactions,
    baseYear,
    baseMonth,
    movementType,
    includeTransfers,
  );
  const compareTx = extractMonthTransactions(
    transactions,
    compareYear,
    compareMonth,
    movementType,
    includeTransfers,
  );

  const baseAgg = aggregateByCategory(baseTx);
  const compareAgg = aggregateByCategory(compareTx);

  const allCategoryIds = new Set([
    ...Object.keys(baseAgg),
    ...Object.keys(compareAgg),
  ]);
  const result: MonthlyComparisonRow[] = [];

  for (const catId of allCategoryIds) {
    const baseVal = roundCurrency(baseAgg[catId] || 0);
    const compareVal = roundCurrency(compareAgg[catId] || 0);

    if (excludeZeroRows && baseVal === 0 && compareVal === 0) {
      continue;
    }

    const diffAbs = roundCurrency(compareVal - baseVal);

    let diffPercent: number | null = null;
    let tendenza: 'aumento' | 'riduzione' | 'stabile' = 'stabile';
    let isNuova = false;
    let isScomparsa = false;

    if (baseVal === 0) {
      if (compareVal === 0) {
        diffPercent = null;
        tendenza = 'stabile';
      } else {
        diffPercent = null;
        tendenza = 'aumento';
        isNuova = true;
      }
    } else {
      if (compareVal === 0) {
        diffPercent = -100;
        tendenza = 'riduzione';
        isScomparsa = true;
      } else {
        diffPercent = roundCurrency(((compareVal - baseVal) / baseVal) * 100);
        if (diffAbs > 0) tendenza = 'aumento';
        else if (diffAbs < 0) tendenza = 'riduzione';
        else tendenza = 'stabile';
      }
    }

    let categoriaNome = '';
    let categoriaIcona: string | undefined = undefined;

    if (catId === 'nessuna') {
      categoriaNome = strings['confronto.senzaCategoria'];
    } else {
      const catObj = categories.find(c => c.id === catId);
      if (catObj) {
        categoriaNome = catObj.nome;
        // In the future icon could be mapped if categories had icons,
        // ma in types.ts Category non ha icona. La mettiamo undefined.
      } else {
        categoriaNome = strings['confronto.categoriaEliminata'];
      }
    }

    result.push({
      categoriaId: catId,
      categoriaNome,
      categoriaIcona,
      importoPeriodoBase: baseVal,
      importoPeriodoConfronto: compareVal,
      differenzaAssoluta: diffAbs,
      differenzaPercentuale: diffPercent,
      tendenza,
      isNuova,
      isScomparsa,
    });
  }

  // Ordinamento per differenza assoluta in ordine decrescente
  // A parità di differenza assoluta, si usa l'id per avere un tie-break deterministico
  result.sort((a, b) => {
    const diffA = Math.abs(a.differenzaAssoluta);
    const diffB = Math.abs(b.differenzaAssoluta);
    if (diffB !== diffA) return diffB - diffA;
    return a.categoriaId.localeCompare(b.categoriaId);
  });

  return result;
}
