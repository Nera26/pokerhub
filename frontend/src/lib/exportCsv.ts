export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}

export function exportCsv(
  filename: string,
  header: string[],
  rows: string[][],
): void {
  const csv = toCsv(header, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
