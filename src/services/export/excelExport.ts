import * as XLSX from 'xlsx';

/**
 * Ekspor data ke format file Excel (.xlsx)
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Data') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Download berkas
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
