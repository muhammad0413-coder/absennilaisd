/**
 * SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD
 * File: FirebaseService.gs
 * Integrasi Backend dengan Firebase Cloud Firestore REST API
 */

/**
 * Mendapatkan URL Firestore REST API untuk dokumen koleksi
 */
function getFirestoreUrl(collectionName, docId) {
  const projectId = getProperty(CONFIG.PROPERTIES.FIREBASE_PROJECT_ID);
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID belum diatur di Script Properties');
  }
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;
  return docId ? `${base}/${docId}` : base;
}

/**
 * Menulis atau memperbarui dokumen di Firestore melalui REST API
 */
function firestoreSetDocument(collectionName, docId, dataObject) {
  const apiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);
  let url = getFirestoreUrl(collectionName, docId);
  if (apiKey) url += `?key=${apiKey}`;

  // Konversi objek JS ke format Firestore fields
  const firestoreFields = toFirestoreFields(dataObject);

  const options = {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: firestoreFields }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    return JSON.parse(response.getContentText());
  } else {
    throw new Error(`Firestore Error [${code}]: ${response.getContentText()}`);
  }
}

/**
 * Konversi objek JS sederhana ke format value Firestore REST API
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => ({ stringValue: String(item) })),
        },
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * Memeriksa status koneksi ke Firebase Firestore
 */
function checkFirebaseConnection() {
  const projectId = getProperty(CONFIG.PROPERTIES.FIREBASE_PROJECT_ID);
  const apiKey = getProperty(CONFIG.PROPERTIES.FIREBASE_API_KEY);

  if (!projectId) {
    return {
      connected: false,
      status: 'BELUM_TERHUBUNG',
      message: 'FIREBASE_PROJECT_ID belum dikonfigurasi pada Script Properties.',
    };
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings?key=${apiKey || ''}`;
    const res = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    const code = res.getResponseCode();

    if (code === 200 || code === 404 || code === 403) {
      // 200 = ok, 404 = koleksi belum ada dokumen (normal), 403 = rules aktif
      return {
        connected: true,
        status: 'TERHUBUNG',
        projectId: projectId,
        httpCode: code,
      };
    } else {
      return {
        connected: false,
        status: 'GAGAL',
        httpCode: code,
        message: res.getContentText(),
      };
    }
  } catch (err) {
    return {
      connected: false,
      status: 'ERROR',
      message: err.toString(),
    };
  }
}
