/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * REPORT PRINT & EXPORT UTILITY (src/components/ReportPrint.js)
 * ==============================================================================
 */

import { getSettings } from '../services.js';

/**
 * Helper Kop Surat Resmi dengan Logo Kiri dan Logo Kanan
 */
export function renderKopSuratOfficialHtml(settings = {}) {
  const schoolName = settings.nama_sekolah || "SDN KESILIR 02";
  const kabupaten = settings.kabupaten || "KABUPATEN JEMBER";
  const dinas = settings.dinas || "DINAS PENDIDIKAN";
  const alamat = settings.alamat_sekolah || "Dsn. Tegal Baru, Ds. Kesilir, Kec. Wuluhan, Kab. Jember";
  const npsn = settings.npsn || "20523456";
  const logoKiri = settings.logo_kiri || "/logo-kiri.png";
  const logoKanan = settings.logo_kanan || "/logo-kanan.png";

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 12px; font-family: 'Times New Roman', serif;">
      <div style="width: 75px; text-align: left;">
        <img src="${logoKiri}" alt="Logo Kiri Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kiri.png'">
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <h4 style="font-size: 10pt; font-weight: bold; margin: 0; text-transform: uppercase;">PEMERINTAH ${kabupaten}</h4>
        <h4 style="font-size: 9.5pt; font-weight: bold; margin: 1px 0; text-transform: uppercase;">${dinas}</h4>
        <h3 style="font-size: 13pt; font-weight: bold; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">${schoolName}</h3>
        <p style="font-size: 8pt; margin: 1px 0;">${alamat} | NPSN: ${npsn}</p>
      </div>
      <div style="width: 75px; text-align: right;">
        <img src="${logoKanan}" alt="Logo Kanan Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kanan.png'">
      </div>
    </div>
  `;
}

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
    <!-- KOP SURAT RESMI (LOGO KIRI & LOGO KANAN) -->
    ${renderKopSuratOfficialHtml(settings)}
    <div style="text-align: center; margin-bottom: 12px; font-family: 'Times New Roman', serif;">
      <p style="font-weight: bold; margin: 0; font-size: 11pt; text-transform: uppercase;">${reportTitle} - ${classLabel}</p>
      <p style="font-size: 8.5pt; margin: 2px 0;">Tahun Ajaran: ${settings.tahun_pelajaran_aktif || "2026/2027"} | Semester: ${settings.semester_aktif || "1 (Ganjil)"}</p>
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
 * Mencetak Dokumen Lanskap Autentik (Format Resmi Sekolah)
 */
export function triggerPrintAuthenticLandscape(sheetHtml) {
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dokumen Resmi SDN KESILIR 02</title>
        <style>
          @page { size: landscape; margin: 8mm 10mm; }
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 10px; color: #000; background: #fff; }
          table { width: 100%; border-collapse: collapse; font-size: 8pt; }
          th, td { border: 1px solid #000; padding: 2px 3px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${sheetHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.warn("Print frame fallback:", e);
      window.print();
    } finally {
      setTimeout(() => {
        if (printFrame.parentNode) document.body.removeChild(printFrame);
      }, 2500);
    }
  }, 350);
}

/**
 * GENERATOR GAMBAR 1: DAFTAR HADIR SISWA BULANAN (TANGGAL 1 - 31)
 */
export function generateAttendanceMonthSheetHtml(students, attendanceList, monthLabel, settings, classLabel, teacherName, teacherNip = "-", selectedYearMonth = null) {
  const schoolName = settings.nama_sekolah || "SDN KESILIR 02";
  const year = settings.tahun_pelajaran_aktif || "2026/2027";
  const headmaster = settings.nama_kepala_sekolah || "Abdullah Mahsar, S.Pd.";
  const nipHeadmaster = settings.nip_kepala_sekolah || "198306012014121000";
  const city = (settings.kabupaten || "Jember").replace(/KABUPATEN\s+/i, '').trim();

  let totalS = 0, totalI = 0, totalA = 0, grandTotalKehadiran = 0;

  const rowsHtml = students.map((s, idx) => {
    const studentRecords = attendanceList.filter(a => a.ID_Siswa === s.ID_Siswa);
    let sCount = 0, iCount = 0, aCount = 0, hCount = 0;

    // Kumpulkan status per tanggal 1-31
    const dayCells = Array.from({ length: 31 }, (_, dayIdx) => {
      const dayNum = dayIdx + 1;
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const rec = studentRecords.find(a => {
        if (!a.Tanggal) return false;
        if (selectedYearMonth && !a.Tanggal.startsWith(selectedYearMonth)) return false;
        return a.Tanggal.endsWith(`-${dayStr}`);
      });

      if (!rec) return `<td style="border: 1px solid #000; text-align: center; font-size: 8pt;">&nbsp;</td>`;

      if (rec.Status_Absensi === 'Sakit') { sCount++; totalS++; return `<td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 8pt;">S</td>`; }
      if (rec.Status_Absensi === 'Izin') { iCount++; totalI++; return `<td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 8pt;">I</td>`; }
      if (rec.Status_Absensi === 'Alpa') { aCount++; totalA++; return `<td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 8pt; color: #b91c1c;">A</td>`; }

      hCount++;
      grandTotalKehadiran++;
      return `<td style="border: 1px solid #000; text-align: center; font-size: 8pt;">•</td>`;
    }).join('');

    const jmlAbsen = sCount + iCount + aCount;

    return `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 3px 2px;">${idx + 1}.</td>
        <td style="border: 1px solid #000; text-align: left; padding: 3px 6px; font-weight: 500;">${s.Nama_Lengkap}</td>
        ${dayCells}
        <td style="border: 1px solid #000; text-align: center;">${sCount || ''}</td>
        <td style="border: 1px solid #000; text-align: center;">${iCount || ''}</td>
        <td style="border: 1px solid #000; text-align: center;">${aCount || ''}</td>
        <td style="border: 1px solid #000; text-align: center; font-weight: bold;">${jmlAbsen || ''}</td>
        <td style="border: 1px solid #000; text-align: center; font-size: 7.5pt;"></td>
      </tr>
    `;
  }).join('');

  const totalSiswa = students.length;
  const persentaseAbsen = (totalSiswa > 0 && (grandTotalKehadiran + totalS + totalI + totalA) > 0)
    ? (((totalS + totalI + totalA) / (grandTotalKehadiran + totalS + totalI + totalA)) * 100).toFixed(1)
    : "0";

  return `
    <div style="font-family: 'Times New Roman', serif; color: #000; padding: 10px;">
      <!-- KOP SURAT RESMI (LOGO KIRI & LOGO KANAN) -->
      ${renderKopSuratOfficialHtml(settings)}

      <!-- JUDUL GAMBAR 1 -->
      <div style="text-align: center; margin-bottom: 12px;">
        <h3 style="font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          DAFTAR HADIR SISWA
        </h3>
        <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0;">
          TAHUN AJARAN ${year}
        </h4>
        <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0; text-transform: uppercase;">
          KELAS ${classLabel.toUpperCase()}
        </h4>
      </div>

      <div style="margin-bottom: 6px; font-size: 10pt; font-weight: bold;">
        Bulan : ${monthLabel || "Juli 2026"}
      </div>

      <!-- TABEL DAFTAR HADIR 1-31 -->
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; border: 1px solid #000;">
        <thead>
          <tr style="background: #f8fafc;">
            <th rowspan="2" style="border: 1px solid #000; width: 28px; text-align: center;">NO</th>
            <th rowspan="2" style="border: 1px solid #000; min-width: 150px; text-align: center;">NAMA</th>
            <th colspan="31" style="border: 1px solid #000; text-align: center; padding: 2px 0;">TANGGAL</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">S</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">I</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">A</th>
            <th rowspan="2" style="border: 1px solid #000; width: 28px; text-align: center;">Jml</th>
            <th rowspan="2" style="border: 1px solid #000; width: 45px; text-align: center;">KET</th>
          </tr>
          <tr style="background: #f8fafc;">
            ${Array.from({ length: 31 }, (_, i) => {
              const n = i + 1;
              return `<th style="border: 1px solid #000; width: 18px; text-align: center; font-size: 7pt; padding: 2px 0;">${n}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="38" style="text-align: center; padding: 1.5rem;">Belum ada siswa terdaftar pada kelas ini.</td></tr>`}
        </tbody>
      </table>

      <!-- FOOTER PERSENTASE GAMBAR 1 -->
      <div style="margin-top: 14px; font-size: 9.5pt;">
        Prosentase Absen Bulan ini &nbsp;&nbsp;&nbsp;&nbsp;= &nbsp;${persentaseAbsen}%
      </div>

      <!-- TANDA TANGAN GAMBAR 1 -->
      <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 9.5pt;">
        <div style="width: 280px; text-align: left;">
          <p style="margin: 0;">Mengetahui,</p>
          <p style="margin: 0 0 55px 0;">Kepala Sekolah ${schoolName}</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${headmaster}</p>
          <p style="margin: 0; font-size: 8.5pt;">NIP. ${nipHeadmaster}</p>
        </div>

        <div style="width: 250px; text-align: left;">
          <p style="margin: 0;">${city}, ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</p>
          <p style="margin: 0 0 55px 0;">Guru Kelas ${classLabel}</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${teacherName || "( ............................................ )"}</p>
          <p style="margin: 0; font-size: 8.5pt;">NIP. ${teacherNip || '-'}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * GENERATOR GAMBAR 2: DAFTAR NILAI SEMESTER (KURIKULUM MERDEKA: FORMATIF TP1-4 & SUMATIF LM1-5)
 */
export function generateGradesSemesterSheetHtml(students, gradesList, subject, semester, settings, classLabel, teacherName, teacherNip = "-", monthLabel = "") {
  const schoolName = settings.nama_sekolah || "SDN KESILIR 02";
  const headmaster = settings.nama_kepala_sekolah || "Abdullah Mahsar, S.Pd.";
  const nipHeadmaster = settings.nip_kepala_sekolah || "198306012014121000";
  const city = (settings.kabupaten || "Jember").replace(/KABUPATEN\s+/i, '').trim();
  const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

  const rowsHtml = students.map((s, idx) => {
    const sGrades = gradesList.filter(g => g.ID_Siswa === s.ID_Siswa && (!subject || g.Mata_Pelajaran === subject));

    // Formatif: 5 Lingkup Materi x 4 Tujuan Pembelajaran (TP1-TP4) = 20 kolom
    let formatifCells = "";
    let sumScores = 0;
    let validCount = 0;

    for (let lm = 1; lm <= 5; lm++) {
      for (let tp = 1; tp <= 4; tp++) {
        // Cari nilai formatif untuk LM dan TP terkait
        const match = sGrades.find(g => 
          (g.Jenis_Asesmen === 'Formatif' || !g.Jenis_Asesmen) && 
          ((g.Lingkup_Materi && g.Lingkup_Materi.includes(`Materi ${lm}`)) || lm === 1) &&
          (g.Deskripsi && g.Deskripsi.includes(`TP${tp}`))
        );

        const score = match ? Number(match.Nilai) : (lm === 1 && tp === 1 && sGrades.length > 0 ? Number(sGrades[0].Nilai) : "");
        if (typeof score === 'number' && !isNaN(score)) {
          sumScores += score;
          validCount++;
        }
        formatifCells += `<td style="border: 1px solid #000; text-align: center; width: 20px; font-size: 7.5pt;">${score !== "" ? score : ""}</td>`;
      }
    }

    // Sumatif Lingkup Materi: 5 Kolom (LM1 - LM5)
    let sumatifLmCells = "";
    for (let lm = 1; lm <= 5; lm++) {
      const matchLm = sGrades.find(g => 
        (g.Jenis_Asesmen === 'Sumatif Lingkup Materi' || g.Jenis_Asesmen === 'Sumatif') &&
        (g.Lingkup_Materi && g.Lingkup_Materi.includes(`LM${lm}`))
      );
      const lmScore = matchLm ? Number(matchLm.Nilai) : "";
      sumatifLmCells += `<td style="border: 1px solid #000; text-align: center; width: 22px; font-size: 7.5pt;">${lmScore !== "" ? lmScore : ""}</td>`;
    }

    // Sumatif Akhir Semester (SAS) & Nilai Akhir (NA)
    const matchSas = sGrades.find(g => g.Jenis_Asesmen === 'Sumatif Akhir Semester');
    const sasScore = matchSas ? Number(matchSas.Nilai) : "";

    const avgScore = validCount > 0 ? Math.round(sumScores / validCount) : (sGrades.length > 0 && typeof sGrades[0].Nilai === 'number' ? sGrades[0].Nilai : "");

    return `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 2px;">${idx + 1}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 2px; font-size: 8pt;">${s.NIS}</td>
        <td style="border: 1px solid #000; text-align: left; padding: 2px 5px; font-weight: 500; font-size: 8pt;">${s.Nama_Lengkap}</td>
        ${formatifCells}
        ${sumatifLmCells}
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;">${sasScore}</td>
        <td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 8pt;">${avgScore}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: 'Times New Roman', serif; color: #000; padding: 10px;">
      <!-- KOP SURAT RESMI (LOGO KIRI & LOGO KANAN) -->
      ${renderKopSuratOfficialHtml(settings)}

      <!-- JUDUL GAMBAR 2 -->
      <div style="text-align: center; margin-bottom: 12px;">
        <h3 style="font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase;">
          DAFTAR NILAI SEMESTER ${semester || "1"}
        </h3>
        <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0; text-transform: uppercase;">
          ${schoolName}
        </h4>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9.5pt; font-weight: bold; flex-wrap: wrap; gap: 8px;">
        <div>KELAS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${classLabel}</div>
        <div>MATA PELAJARAN : ${subject || "Matematika"}</div>
        ${monthLabel ? `<div>BULAN : ${monthLabel.toUpperCase()}</div>` : ''}
      </div>

      <!-- TABEL KURIKULUM MERDEKA PERSIS GAMBAR 2 -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; border: 1px solid #000;">
        <thead>
          <tr style="background: #f8fafc;">
            <th rowspan="3" style="border: 1px solid #000; width: 24px; text-align: center;">NO.<br>URUT</th>
            <th rowspan="3" style="border: 1px solid #000; width: 50px; text-align: center;">NO.<br>INDUK</th>
            <th rowspan="3" style="border: 1px solid #000; min-width: 140px; text-align: center;">NAMA</th>
            <th colspan="20" style="border: 1px solid #000; text-align: center; padding: 2px 0;">FORMATIF</th>
            <th colspan="5" style="border: 1px solid #000; text-align: center; padding: 2px 0;">SUMATIF LINGKUP MATERI</th>
            <th rowspan="3" style="border: 1px solid #000; width: 45px; text-align: center;">SUMATIF<br>AKHIR<br>SEM</th>
            <th rowspan="3" style="border: 1px solid #000; width: 35px; text-align: center;">NA<br>SEM</th>
          </tr>
          <tr style="background: #f8fafc;">
            <th colspan="4" style="border: 1px solid #000; text-align: center;">Lingkup Materi 1</th>
            <th colspan="4" style="border: 1px solid #000; text-align: center;">Lingkup Materi 2</th>
            <th colspan="4" style="border: 1px solid #000; text-align: center;">Lingkup Materi 3</th>
            <th colspan="4" style="border: 1px solid #000; text-align: center;">Lingkup Materi 4</th>
            <th colspan="4" style="border: 1px solid #000; text-align: center;">Lingkup Materi 5</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">LM1</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">LM2</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">LM3</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">LM4</th>
            <th rowspan="2" style="border: 1px solid #000; width: 22px; text-align: center;">LM5</th>
          </tr>
          <tr style="background: #f8fafc;">
            ${Array.from({ length: 5 }, () => `
              <th style="border: 1px solid #000; width: 18px; text-align: center; font-size: 6.5pt;">TP1</th>
              <th style="border: 1px solid #000; width: 18px; text-align: center; font-size: 6.5pt;">TP2</th>
              <th style="border: 1px solid #000; width: 18px; text-align: center; font-size: 6.5pt;">TP3</th>
              <th style="border: 1px solid #000; width: 18px; text-align: center; font-size: 6.5pt;">TP4</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="30" style="text-align: center; padding: 1.5rem;">Belum ada siswa terdaftar pada kelas ini.</td></tr>`}
        </tbody>
      </table>

      <!-- KETERANGAN GAMBAR 2 -->
      <div style="margin-top: 10px; font-size: 8.5pt;">
        <strong>Keterangan :</strong><br>
        <em>TP = Tujuan Pembelajaran</em><br>
        <em>LM = Lingkup Materi</em>
      </div>

      <!-- TANDA TANGAN GAMBAR 2 -->
      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 9.5pt;">
        <div style="width: 280px; text-align: left;">
          <p style="margin: 0;">Mengetahui,</p>
          <p style="margin: 0 0 50px 0;">Kepala Sekolah / Kepala Madrasah</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${headmaster}</p>
          <p style="margin: 0; font-size: 8.5pt;">NIP. ${nipHeadmaster}</p>
        </div>

        <div style="width: 250px; text-align: left;">
          <p style="margin: 0;">${city}, ${todayStr}</p>
          <p style="margin: 0 0 50px 0;">Wali Kelas,</p>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${teacherName || "( ............................................ )"}</p>
          <p style="margin: 0; font-size: 8.5pt;">NIP. ${teacherNip || '-'}</p>
        </div>
      </div>
    </div>
  `;
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
