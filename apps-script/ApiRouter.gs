/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: ApiRouter.gs
 * Dispatcher Endpoint & JSON Response Handler
 */

/**
 * Membuat respons JSON standar
 */
function createJsonResponse(data, message, success, errorCode, requestId) {
  const reqId = requestId || ('REQ-' + Utilities.getUuid().substring(0, 8));
  const output = {
    success: success !== undefined ? success : true,
    message: message || (success ? 'Data berhasil diproses' : 'Operasi gagal'),
    data: data || null,
    errorCode: errorCode || null,
    requestId: reqId,
    timestamp: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menangani seluruh permintaan masuk
 */
function handleApiRoute(e, method) {
  const requestId = 'REQ-' + Utilities.getUuid().substring(0, 8);

  try {
    // Parsing parameter
    let params = {};
    let payload = {};

    if (e && e.parameter) {
      params = e.parameter;
    }

    if (method === 'POST' && e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        return createJsonResponse(null, 'Payload bukan format JSON yang valid', false, 'INVALID_JSON', requestId);
      }
    }

    const action = params.action || payload.action;
    if (!action) {
      return createJsonResponse(null, 'Parameter action wajib disertakan', false, 'MISSING_ACTION', requestId);
    }

    // Endpoint publik / test
    if (action === 'testConnection') {
      const syncStatus = getComprehensiveSyncStatus();
      return createJsonResponse(syncStatus, 'Koneksi ke Apps Script & Database Berhasil', true, null, requestId);
    }

    if (action === 'initializeDatabase') {
      const initResult = initializeDatabase();
      initializeDriveFolders();
      return createJsonResponse(initResult, 'Inisialisasi Database Sheet & Drive Berhasil', true, null, requestId);
    }

    // Verifikasi Autentikasi untuk aksi lainnya
    const authHeader = (e && e.headers && (e.headers.Authorization || e.headers.authorization)) || payload.authHeader;
    const apiSecret = (e && e.headers && (e.headers['X-Api-Secret'] || e.headers['x-api-secret'])) || payload.apiSecret;

    const auth = authenticateRequest(authHeader, apiSecret);
    if (!auth.isValid) {
      return createJsonResponse(null, auth.error || 'Akses ditolak: Autentikasi diperlukan', false, 'UNAUTHORIZED', requestId);
    }

    const user = auth.user;

    // Routing berdasarkan Action
    switch (action) {
      case 'getDashboardData': {
        const status = getComprehensiveSyncStatus();
        const students = readSheetData(CONFIG.SHEETS.STUDENTS);
        const teachers = readSheetData(CONFIG.SHEETS.TEACHERS);
        const activeStudents = students.filter(s => s.Status_Siswa === 'Aktif');

        const classCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
        activeStudents.forEach(s => {
          const c = String(s.Kelas);
          if (classCounts[c] !== undefined) classCounts[c]++;
        });

        return createJsonResponse({
          totalStudents: students.length,
          activeStudents: activeStudents.length,
          inactiveStudents: students.length - activeStudents.length,
          totalTeachers: teachers.length,
          classCounts: classCounts,
          systemStatus: status,
        }, 'Data Dashboard berhasil dimuat', true, null, requestId);
      }

      case 'getStudents':
        return createJsonResponse(getStudentsService(params, user), 'Daftar siswa berhasil diambil', true, null, requestId);

      case 'addStudent':
        return createJsonResponse(addStudentService(payload.student || payload, user), 'Siswa berhasil ditambahkan', true, null, requestId);

      case 'updateStudent':
        return createJsonResponse(updateStudentService(payload.student || payload, user), 'Siswa berhasil diperbarui', true, null, requestId);

      case 'deactivateStudent':
        return createJsonResponse(
          deactivateStudentService(payload.studentId, payload.status, payload.reason, user),
          'Status siswa berhasil diubah',
          true,
          null,
          requestId
        );

      case 'saveAttendance':
      case 'receiveAttendance':
        return createJsonResponse(
          receiveAttendanceService(payload.records || payload.data, user),
          'Absensi berhasil disimpan ke Google Sheets',
          true,
          null,
          requestId
        );

      case 'getAttendanceReport':
        return createJsonResponse(
          getAttendanceReportService(params.class ? params : payload, user),
          'Rekapitulasi absensi berhasil dihitung',
          true,
          null,
          requestId
        );

      case 'saveGrades':
      case 'receiveGrades':
        return createJsonResponse(
          receiveGradesService(payload.records || payload.data, user),
          'Nilai berhasil disimpan ke Google Sheets',
          true,
          null,
          requestId
        );

      case 'getGradesReport':
        return createJsonResponse(
          getGradesReportService(params.class ? params : payload, user),
          'Rekapitulasi nilai berhasil diambil',
          true,
          null,
          requestId
        );

      case 'uploadProfilePhoto':
        return createJsonResponse(
          uploadProfilePhotoService(payload, user),
          'Foto profil guru berhasil diunggah ke Google Drive',
          true,
          null,
          requestId
        );

      case 'createArchive':
        return createJsonResponse(
          createArchiveService(payload, user),
          'Laporan berhasil diarsipkan ke Google Drive',
          true,
          null,
          requestId
        );

      case 'syncStudents':
        return createJsonResponse(
          syncStudentsToFirebaseService(user),
          'Sinkronisasi siswa ke Firebase selesai',
          true,
          null,
          requestId
        );

      case 'getSyncStatus':
        return createJsonResponse(
          getComprehensiveSyncStatus(),
          'Status sinkronisasi berhasil diambil',
          true,
          null,
          requestId
        );

      case 'retryFailedSync':
        return createJsonResponse(
          retryFailedSyncService(user),
          'Percobaan ulang antrean selesai',
          true,
          null,
          requestId
        );

      case 'getUsers':
        return createJsonResponse(getUsersService(user), 'Daftar pengguna berhasil diambil', true, null, requestId);

      case 'saveUser':
        return createJsonResponse(saveUserService(payload, user), 'Akun pengguna berhasil disimpan', true, null, requestId);

      case 'updateTeacherProfile':
        return createJsonResponse(updateTeacherProfileService(payload, user), 'Profil guru berhasil diperbarui', true, null, requestId);

      default:
        return createJsonResponse(null, `Action '${action}' tidak dikenali`, false, 'UNKNOWN_ACTION', requestId);
    }
  } catch (err) {
    return createJsonResponse(null, err.message || err.toString(), false, 'INTERNAL_SERVER_ERROR', requestId);
  }
}
