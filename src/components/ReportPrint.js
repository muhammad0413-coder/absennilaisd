/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * REPORT PRINT & EXPORT UTILITY (src/components/ReportPrint.js)
 * ==============================================================================
 */

import { getSettings } from '../services.js';

/**
 * Mencetak Halaman dengan Format Standar Sekolah Resmi
 */
export async function triggerPrintReport(reportTitle, classLabel, contentHtml) {
  const settings = await getSettings();

  const printContainer = document.createElement('div');
  printContainer.id = 'active-print-container';
  printContainer.className = 'print-only-container';

  const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

  printContainer.innerHTML = `
    <!-- KOP SURAT RESMI -->
    <div class="print-kop-surat">
      <h2>${settings.nama_sekolah || "SD NEGERI HARAPAN BANGSA"}</h2>
      <p>NPSN: ${settings.npsn || "20109988"} | ${settings.alamat_sekolah || "Jl. Pendidikan No. 12"}</p>
      <p style="font-weight: bold; margin-top: 6px; font-size: 11pt; text-transform: uppercase;">${reportTitle} - ${classLabel}</p>
      <p style="font-size: 8.5pt;">Tahun Ajaran: ${settings.tahun_ajaran_aktif || "2026/2027"} | Semester: ${settings.semester_aktif || "1 (Ganjil)"}</p>
    </div>

    <!-- KONTEN LAPORAN -->
    <div class="print-body-content">
      ${contentHtml}
    </div>

    <!-- TANDA TANGAN -->
    <div class="print-signatures">
      <div class="signature-box">
        <p>Mengetahui,</p>
        <p>Kepala Sekolah</p>
        <div class="signature-space"></div>
        <p class="signature-name">${settings.nama_kepala_sekolah || "Drs. H. Mulyadi, M.Pd."}</p>
        <p style="font-size: 8.5pt;">NIP. ${settings.nip_kepala_sekolah || "197203151998031004"}</p>
      </div>

      <div class="signature-box">
        <p>Jakarta, ${todayStr}</p>
        <p>Guru Kelas</p>
        <div class="signature-space"></div>
        <p class="signature-name">( ............................................ )</p>
        <p style="font-size: 8.5pt;">NIP. ........................................</p>
      </div>
    </div>
  `;

  document.body.appendChild(printContainer);

  // Jalankan dialog cetak browser
  window.print();

  // Bersihkan elemen cetak setelah dialog selesai
  setTimeout(() => {
    if (printContainer.parentNode) {
      document.body.removeChild(printContainer);
    }
  }, 1000);
}

/**
 * Ekspor Data Array ke File CSV
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
