import { SystemSyncStatus } from '../../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY || '';

export const isAppsScriptConfigured = Boolean(
  APPS_SCRIPT_URL &&
  !APPS_SCRIPT_URL.includes('ExampleDeploymentID')
);

export interface AppsScriptResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errorCode?: string | null;
  requestId?: string;
  timestamp: string;
}

/**
 * Mengirim permintaan ke Google Apps Script Web App
 */
export async function callAppsScript<T = any>(
  action: string,
  payload: Record<string, any> = {},
  method: 'GET' | 'POST' = 'POST',
  idToken?: string
): Promise<AppsScriptResponse<T>> {
  if (!isAppsScriptConfigured) {
    return {
      success: false,
      message: 'Google Apps Script Web App belum dikonfigurasi (VITE_APPS_SCRIPT_URL masih kosong).',
      data: null,
      errorCode: 'APPS_SCRIPT_NOT_CONFIGURED',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    let url = APPS_SCRIPT_URL;
    let options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS Web App prefers text/plain to avoid CORS preflight issues
      },
    };

    const requestBody = {
      action,
      ...payload,
      authHeader: idToken ? `Bearer ${idToken}` : undefined,
      apiSecret: API_SECRET_KEY,
    };

    if (method === 'GET') {
      const queryParams = new URLSearchParams({ action, ...payload });
      url += (url.includes('?') ? '&' : '?') + queryParams.toString();
    } else {
      options.body = JSON.stringify(requestBody);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data: AppsScriptResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    console.warn('Apps Script Call Error:', err);
    return {
      success: false,
      message: err.message || 'Gagal menghubungi Google Apps Script',
      data: null,
      errorCode: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Uji koneksi terpadu empat pilar
 */
export async function testAppsScriptConnection(): Promise<SystemSyncStatus> {
  if (!isAppsScriptConfigured) {
    return {
      timestamp: new Date().toISOString(),
      services: {
        firebase: {
          connected: false,
          status: 'BELUM_TERHUBUNG',
          message: 'Konfigurasi Firebase Web SDK belum lengkap.',
        },
        sheets: {
          connected: false,
          status: 'BELUM_TERHUBUNG',
          message: 'Google Spreadsheet belum terhubung via Apps Script.',
        },
        appsScript: {
          connected: false,
          status: 'BELUM_TERHUBUNG',
          message: 'URL Google Apps Script Web App belum diatur di file .env',
        },
        googleDrive: {
          connected: false,
          status: 'BELUM_TERHUBUNG',
          message: 'Folder Google Drive belum diinisialisasi.',
        },
      },
      pendingQueueCount: 0,
      lastSync: null,
    };
  }

  const res = await callAppsScript<SystemSyncStatus>('testConnection', {}, 'GET');
  if (res.success && res.data) {
    return res.data;
  }

  return {
    timestamp: new Date().toISOString(),
    services: {
      firebase: { connected: false, status: 'GAGAL', message: res.message },
      sheets: { connected: false, status: 'GAGAL', message: res.message },
      appsScript: { connected: false, status: 'GAGAL', message: res.message },
      googleDrive: { connected: false, status: 'GAGAL', message: res.message },
    },
    pendingQueueCount: 0,
    lastSync: null,
  };
}
