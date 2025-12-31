import { Invoice, Product, LoginEvent } from '../types';
import { googleDriveService } from './googleDriveService';

export const DATA_KEYS = {
  INVOICES: 'dulce_alya_invoices',
  PRODUCTS: 'dulce_alya_products',
  HISTORY: 'dulce_alya_login_history',
  SETTINGS: 'dulce_alya_settings',
  CART: 'dulce_alya_cart',
  DRIVE_USER: 'dulce_alya_drive_user',
  SYNC_MODE: 'dulce_alya_sync_mode', // 'local' or 'drive'
  API_CONFIG: 'dulce_alya_api_config' // Stores Client ID / API Key
};

export interface AppData {
  invoices: Invoice[];
  products: Product[];
  history: LoginEvent[];
  settings: any;
  version: string;
  exportedAt: string;
}

// --- INDEXED DB HELPERS FOR FILE HANDLE PERSISTENCE ---
const DB_NAME = 'DulceAlyaDB';
const STORE_NAME = 'fileHandles';
const HANDLE_KEY = 'db_main_handle';

const idbHelper = {
  getDB: async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  saveHandle: async (handle: any) => {
    const db = await idbHelper.getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    return tx.oncomplete;
  },
  getHandle: async () => {
    const db = await idbHelper.getDB();
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

export const dataService = {
  fileHandle: null as any, 
  syncMode: localStorage.getItem(DATA_KEYS.SYNC_MODE) || 'local', // 'local' | 'drive'

  getCurrentState: (): AppData => {
    return {
      invoices: JSON.parse(localStorage.getItem(DATA_KEYS.INVOICES) || '[]'),
      products: JSON.parse(localStorage.getItem(DATA_KEYS.PRODUCTS) || '[]'),
      history: JSON.parse(localStorage.getItem(DATA_KEYS.HISTORY) || '[]'),
      settings: JSON.parse(localStorage.getItem(DATA_KEYS.SETTINGS) || '{}'),
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
  },

  saveStateToLocal: (data: AppData) => {
      localStorage.setItem(DATA_KEYS.INVOICES, JSON.stringify(data.invoices));
      localStorage.setItem(DATA_KEYS.PRODUCTS, JSON.stringify(data.products));
      localStorage.setItem(DATA_KEYS.HISTORY, JSON.stringify(data.history || []));
      if (data.settings) {
        localStorage.setItem(DATA_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
  },

  exportDatabase: () => {
    const data = dataService.getCurrentState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DulceAlya_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importDatabase: async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data: AppData = JSON.parse(content);
          if (!Array.isArray(data.invoices) || !Array.isArray(data.products)) throw new Error('Formato inválido');
          dataService.saveStateToLocal(data);
          resolve(true);
        } catch (error) {
          console.error('Error importing data:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsText(file);
    });
  },

  // --- LOCAL DISK METHODS ---

  openFromInputFallback(): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) {
           reject(new Error("No file selected"));
           return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data: AppData = JSON.parse(ev.target?.result as string);
            if (!Array.isArray(data.invoices)) throw new Error("Archivo inválido");
            dataService.saveStateToLocal(data);
            dataService.fileHandle = null; 
            dataService.syncMode = 'local';
            localStorage.setItem(DATA_KEYS.SYNC_MODE, 'local');
            resolve(data);
          } catch (parseErr) {
            reject(parseErr);
          }
        };
        reader.onerror = () => reject(new Error("Error reading file"));
        reader.readAsText(file);
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  },

  async openFromDisk(): Promise<AppData> {
    try {
      // @ts-ignore
      if (typeof window.showOpenFilePicker === 'function') {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Base de Datos JSON', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });
        
        this.fileHandle = handle;
        await idbHelper.saveHandle(handle);

        const file = await handle.getFile();
        const text = await file.text();
        const data: AppData = JSON.parse(text);
        
        if (!Array.isArray(data.invoices)) throw new Error("Archivo inválido");

        dataService.saveStateToLocal(data);
        dataService.syncMode = 'local';
        localStorage.setItem(DATA_KEYS.SYNC_MODE, 'local');
        return data;
      } else {
        throw new Error("API not supported");
      }
    } catch (err: any) {
      console.warn("File System Access API failed, using fallback.", err);
      return this.openFromInputFallback();
    }
  },

  // --- DRIVE METHODS ---

  async saveToDrive(): Promise<boolean> {
     const data = dataService.getCurrentState();
     try {
       await googleDriveService.saveFile(data);
       return true;
     } catch (e) {
       console.error("Failed to save to Drive", e);
       return false;
     }
  },

  async loadFromDrive(): Promise<AppData | null> {
    try {
      const data = await googleDriveService.loadFile();
      if (data) {
        // Handle weird GAPI formatting if it returns string instead of object
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        dataService.saveStateToLocal(parsedData);
        dataService.syncMode = 'drive';
        localStorage.setItem(DATA_KEYS.SYNC_MODE, 'drive');
        return parsedData;
      }
      return null;
    } catch (e) {
      console.error("Failed to load from Drive", e);
      return null;
    }
  },

  // --- GENERAL METHODS ---

  async restoreSession(): Promise<boolean> {
    // If mode is drive, we don't restore file handle, we rely on Drive Token (which might need refresh)
    const mode = localStorage.getItem(DATA_KEYS.SYNC_MODE);
    if (mode === 'drive') return true; 

    try {
      const handle = await idbHelper.getHandle();
      if (!handle) return false;

      // @ts-ignore
      const opts = { mode: 'readwrite' };
      // @ts-ignore
      if ((await handle.queryPermission(opts)) === 'granted') {
         this.fileHandle = handle;
         return true;
      }
      this.fileHandle = handle;
      return true;
    } catch (e) {
      return false;
    }
  },

  async verifyPermission(): Promise<boolean> {
     if (dataService.syncMode === 'drive') return true; // Permission handled by Token
     
     if (!this.fileHandle) return false;
     // @ts-ignore
     const opts = { mode: 'readwrite' };
     // @ts-ignore
     if ((await this.fileHandle.queryPermission(opts)) === 'granted') {
       return true;
     }
     // @ts-ignore
     if ((await this.fileHandle.requestPermission(opts)) === 'granted') {
       return true;
     }
     return false;
  },

  async saveToDisk(data?: AppData): Promise<boolean> {
    // Router logic: Save to Drive OR Local Disk
    if (dataService.syncMode === 'drive') {
        return this.saveToDrive();
    }

    try {
      if (this.fileHandle) {
        const dataToSave = data || dataService.getCurrentState();
        dataToSave.exportedAt = new Date().toISOString();
        const blob = JSON.stringify(dataToSave, null, 2);

        const writable = await this.fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } else {
        dataService.exportDatabase();
        return true;
      }
    } catch (err) {
      console.error("Save to Disk Error:", err);
      return false;
    }
  }
};
