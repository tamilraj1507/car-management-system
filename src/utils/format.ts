export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatShortDate(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate.includes('T') ? isoOrDate : `${isoOrDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export interface FinancingSummary {
  taxesAndFees: number;
  amountFinanced: number;
  monthlyPayment: number;
  totalInterest: number;
}

export function calculateFinancing(params: {
  salePrice: number;
  tradeInValue: number;
  downPayment: number;
  docFee: number;
  taxRate: number;
  apr: number;
  termMonths: number;
}): FinancingSummary {
  const taxableBase = Math.max(0, params.salePrice - params.tradeInValue);
  const salesTax = Math.round(taxableBase * (params.taxRate / 100));
  const taxesAndFees = salesTax + params.docFee;
  const amountFinanced = Math.max(
    0,
    params.salePrice + taxesAndFees - params.tradeInValue - params.downPayment
  );

  if (amountFinanced <= 0 || params.termMonths <= 0) {
    return {
      taxesAndFees,
      amountFinanced: 0,
      monthlyPayment: 0,
      totalInterest: 0,
    };
  }

  if (params.apr <= 0) {
    const monthlyPayment = Math.round(amountFinanced / params.termMonths);
    return {
      taxesAndFees,
      amountFinanced,
      monthlyPayment,
      totalInterest: 0,
    };
  }

  const monthlyRate = params.apr / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, params.termMonths);
  const monthlyPayment = Math.round(
    (amountFinanced * monthlyRate * factor) / (factor - 1)
  );
  const totalInterest = Math.max(
    0,
    monthlyPayment * params.termMonths - amountFinanced
  );

  return {
    taxesAndFees,
    amountFinanced,
    monthlyPayment,
    totalInterest,
  };
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
