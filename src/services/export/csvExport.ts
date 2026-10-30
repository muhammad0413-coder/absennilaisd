/**
 * Ekspor array of objects ke CSV dengan UTF-8 BOM (Mencegah karakter rusak di Microsoft Excel)
 */
export function exportToCSV(data: any[], fileName: string) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => {
    return headers
      .map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
