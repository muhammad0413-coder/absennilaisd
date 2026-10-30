/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: DriveService.gs
 * Pengelolaan Berkas, Folder Arsip Google Drive, dan Unggah Foto Profil
 */

/**
 * Membuat hierarki folder Google Drive untuk pengarsipan sekolah
 */
function initializeDriveFolders() {
  let rootFolder;
  const existingRootId = getProperty(CONFIG.PROPERTIES.DRIVE_ROOT_FOLDER_ID);

  if (existingRootId) {
    try {
      rootFolder = DriveApp.getFolderById(existingRootId);
    } catch (e) {
      rootFolder = null;
    }
  }

  if (!rootFolder) {
    const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDERS.ROOT);
    if (folders.hasNext()) {
      rootFolder = folders.next();
    } else {
      rootFolder = DriveApp.createFolder(CONFIG.DRIVE_FOLDERS.ROOT);
    }
    setProperty(CONFIG.PROPERTIES.DRIVE_ROOT_FOLDER_ID, rootFolder.getId());
  }

  const subfolderMap = {};
  const folderNames = Object.values(CONFIG.DRIVE_FOLDERS).filter(name => name !== CONFIG.DRIVE_FOLDERS.ROOT);

  folderNames.forEach(folderName => {
    const existing = rootFolder.getFoldersByName(folderName);
    let subFolder;
    if (existing.hasNext()) {
      subFolder = existing.next();
    } else {
      subFolder = rootFolder.createFolder(folderName);
    }
    subfolderMap[folderName] = subFolder.getId();
  });

  return {
    rootFolderId: rootFolder.getId(),
    subfolders: subfolderMap,
  };
}

/**
 * Mendapatkan subfolder berdasarkan nama kategori
 */
function getTargetFolder(categoryName) {
  const foldersInfo = initializeDriveFolders();
  const folderId = foldersInfo.subfolders[categoryName] || foldersInfo.rootFolderId;
  return DriveApp.getFolderById(folderId);
}

/**
 * Unggah foto profil guru secara aman
 */
function uploadProfilePhotoService(payload, user) {
  if (!payload.fileBase64 || !payload.fileName) {
    throw new Error('Data file foto tidak lengkap');
  }

  const mimeType = payload.mimeType || 'image/jpeg';
  if (!CONFIG.UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error('Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP.');
  }

  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > CONFIG.UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran foto melebihi batas maksimum 5MB');
  }

  const folder = getTargetFolder(CONFIG.DRIVE_FOLDERS.TEACHER_PHOTOS);
  const safeFileName = `FOTO_${(user.uid || 'GURU').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getTime()}.${mimeType.split('/')[1]}`;
  const blob = Utilities.newBlob(bytes, mimeType, safeFileName);
  const file = folder.createFile(blob);

  // Set file permissions: Viewable by anyone with link (agar avatar dapat dirender di web)
  // Folder tetap privat, hanya file foto profil guru yang diizinkan view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const photoUrl = `https://drive.google.com/uc?id=${file.getId()}`;

  // Update profil guru di Sheet
  updateTeacherProfileService({ Foto_URL: photoUrl }, user);

  writeActivityLog(user, 'UPLOAD_FOTO', 'Foto_Profil', file.getId(), `Mengunggah foto profil baru: ${safeFileName}`);

  return {
    success: true,
    fileId: file.getId(),
    fileName: safeFileName,
    photoUrl: photoUrl,
    sizeBytes: bytes.length,
  };
}

/**
 * Menyimpan arsip dokumen (PDF Laporan, Rekap Excel, Rapor)
 */
function createArchiveService(payload, user) {
  if (!payload.fileBase64 || !payload.fileName) {
    throw new Error('Data berkas arsip tidak lengkap');
  }

  const mimeType = payload.mimeType || 'application/pdf';
  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > CONFIG.UPLOAD_LIMITS.MAX_DOC_SIZE_BYTES) {
    throw new Error('Ukuran berkas melebihi batas 25MB');
  }

  // Tentukan folder tujuan berdasarkan kategori
  let folderCategory = CONFIG.DRIVE_FOLDERS.ADMIN_DOCS;
  if (payload.category === 'attendance') folderCategory = CONFIG.DRIVE_FOLDERS.ATTENDANCE_REPORTS;
  else if (payload.category === 'grades') folderCategory = CONFIG.DRIVE_FOLDERS.GRADE_REPORTS;
  else if (payload.category === 'report_card') folderCategory = CONFIG.DRIVE_FOLDERS.REPORT_CARDS;
  else if (payload.category === 'semester') folderCategory = CONFIG.DRIVE_FOLDERS.SEMESTER_ARCHIVE;

  const folder = getTargetFolder(folderCategory);
  const blob = Utilities.newBlob(bytes, mimeType, payload.fileName);
  const file = folder.createFile(blob);

  // Deskripsi metadata
  const description = `Diunggah oleh: ${user ? user.name : 'Sistem'} | Kategori: ${payload.category || '-'} | Waktu: ${new Date().toISOString()}`;
  file.setDescription(description);

  writeActivityLog(user, 'ARSIP_DOKUMEN', 'Drive_File', file.getId(), `Menyimpan arsip: ${payload.fileName}`);

  return {
    success: true,
    fileId: file.getId(),
    fileName: payload.fileName,
    viewUrl: file.getUrl(),
    downloadUrl: file.getDownloadUrl(),
  };
}
