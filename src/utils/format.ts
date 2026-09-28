/**
 * Safe formatting utilities to prevent any undefined / null / NaN crashes
 */

export function formatRupiah(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
}

export function formatNumber(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
}

export function formatDate(val?: string | number | Date | null): string {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString('id-ID');
  } catch {
    return String(val || '-');
  }
}
