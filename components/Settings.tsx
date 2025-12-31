import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Printer, 
  History, 
  LogOut, 
  Save,
  Percent,
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileJson,
  RefreshCw,
  HardDrive,
  Cloud,
  ArrowRight,
  ShieldCheck,
  User,
  Loader2,
  Key
} from 'lucide-react';
import { LoginEvent } from '../types';
import { dataService, DATA_KEYS } from '../services/dataService';
import { googleDriveService } from '../services/googleDriveService';

interface SettingsProps {
  onLogout?: () => void;
  loginHistory?: LoginEvent[];
  onConnectDB?: () => void;
  onManualSave?: () => void;
  isFileConnected?: boolean;
  hasFileHandle?: boolean;
  isSaving?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onLogout, 
  loginHistory = [], 
  onConnectDB,
  onManualSave,
  isFileConnected,
  hasFileHandle,
  isSaving
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Google Drive State
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveUser, setDriveUser] = useState<any>(null);
  const [syncMode, setSyncMode] = useState<string>('local');
  
  // API Config State
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState({ clientId: '', apiKey: '' });

  const [config, setConfig] = useState({
    storeName: 'Dulce Alya',
    nit: '900.123.456-7',
    address: 'Cra 15 # 85 - 12, Bogotá, Colombia',
    phone: '+57 304 363 1965',
    email: 'wipetor12@gmail.com',
    currency: 'COP',
    notifications: true
  });

  // Load config and drive user on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('dulce_alya_settings');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    
    // Load persisted "Drive User"
    const savedUser = localStorage.getItem('dulce_alya_drive_user');
    if (savedUser) {
      setDriveUser(JSON.parse(savedUser));
      setIsDriveConnected(true);
    }

    const savedApiConfig = localStorage.getItem(DATA_KEYS.API_CONFIG);
    if (savedApiConfig) {
       const parsed = JSON.parse(savedApiConfig);
       setApiConfig(parsed);
       // Init Drive Service if keys exist
       if (parsed.apiKey && parsed.clientId) {
          googleDriveService.init(parsed.apiKey, parsed.clientId).catch(console.error);
       }
    }

    setSyncMode(localStorage.getItem(DATA_KEYS.SYNC_MODE) || 'local');
  }, []);

  const handleSave = () => {
    localStorage.setItem('dulce_alya_settings', JSON.stringify(config));
    // Save API Config
    localStorage.setItem(DATA_KEYS.API_CONFIG, JSON.stringify(apiConfig));
    if (apiConfig.apiKey && apiConfig.clientId && !googleDriveService.isInitialized) {
        googleDriveService.init(apiConfig.apiKey, apiConfig.clientId)
        .then(() => alert("Configuración guardada y Servicios de Google inicializados."))
        .catch(err => alert("Error inicializando Google: " + JSON.stringify(err)));
    } else {
        alert("¡Configuración guardada correctamente!");
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Standard Export
  const handleExport = () => {
    dataService.exportDatabase();
  };

  // Standard Import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ ADVERTENCIA: Se reemplazarán todos los datos actuales por los del archivo seleccionado. ¿Continuar?")) {
      e.target.value = ''; 
      return;
    }

    try {
      await dataService.importDatabase(file);
      setImportStatus('success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleDriveLogin = async () => {
    if (!apiConfig.clientId || !apiConfig.apiKey) {
        alert("Primero debes configurar tu CLIENT ID y API KEY en la sección inferior 'Configuración de API'.");
        setShowApiConfig(true);
        return;
    }

    setIsDriveConnecting(true);
    try {
      // 1. Ensure Init
      if (!googleDriveService.isInitialized) {
         await googleDriveService.init(apiConfig.apiKey, apiConfig.clientId);
      }
      
      // 2. Sign In
      await googleDriveService.signIn();
      
      // 3. Get User Info
      const userInfo = await googleDriveService.getUserInfo();
      
      const user = {
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      };
      
      setDriveUser(user);
      localStorage.setItem('dulce_alya_drive_user', JSON.stringify(user));
      setIsDriveConnected(true);
      
      // 4. Try to load existing data
      const cloudData = await dataService.loadFromDrive();
      if (cloudData) {
          alert("¡Conexión Exitosa! Se ha cargado la base de datos desde la nube.");
          window.location.reload();
      } else {
          // If no file exists, upload current state
          await dataService.saveToDrive();
          dataService.syncMode = 'drive';
          localStorage.setItem(DATA_KEYS.SYNC_MODE, 'drive');
          alert("Carpeta creada en Drive y datos subidos exitosamente.");
          window.location.reload();
      }

    } catch (error) {
      console.error(error);
      alert("Error conectando con Google Drive. Revisa la consola y tus credenciales.");
    } finally {
      setIsDriveConnecting(false);
    }
  };
  
  const handleDisconnectDrive = () => {
    if(confirm("¿Desvincular cuenta de Google?")) {
      setIsDriveConnected(false);
      setDriveUser(null);
      localStorage.removeItem('dulce_alya_drive_user');
      dataService.syncMode = 'local';
      localStorage.setItem(DATA_KEYS.SYNC_MODE, 'local');
      window.location.reload();
    }
  };

  const menuItems = [
    { id: 'general', label: 'General y Tienda', icon: Store },
    { id: 'tax', label: 'Moneda', icon: Percent },
    { id: 'database', label: 'Base de Datos / Drive', icon: Database },
    { id: 'hardware', label: 'Impresoras y POS', icon: Printer },
    { id: 'history', label: 'Historial de Acceso', icon: History },
    { id: 'logout', label: 'Cerrar Sesión', icon: LogOut },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store size={20} className="text-primary-500" />
              Perfil del Negocio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Nombre del Negocio</label>
                <input 
                  type="text" 
                  value={config.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">NIT / RUT</label>
                <input 
                  type="text" 
                  value={config.nit} 
                  onChange={(e) => handleChange('nit', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Dirección</label>
                <input 
                  type="text" 
                  value={config.address} 
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                <input 
                  type="text" 
                  value={config.phone} 
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Email de Contacto</label>
                <input 
                  type="email" 
                  value={config.email} 
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                />
              </div>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Database size={20} className="text-primary-500" />
              <h3 className="text-lg font-bold text-gray-900">Gestión de Datos y Nube</h3>
            </div>

            {/* Google Drive Integration Section */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Cloud size={100} />
               </div>
               
               <div className="relative z-10">
                 <h4 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                   <Cloud className="text-blue-600" /> Google Drive (Modo Real)
                 </h4>
                 <p className="text-sm text-blue-700 mt-2 mb-6 max-w-lg">
                   Esta integración creará automáticamente una carpeta llamada <strong>"Dulce Alya Backup"</strong> en tu Google Drive y mantendrá tus datos sincronizados.
                 </p>

                 {!isDriveConnected ? (
                   <button 
                     onClick={handleDriveLogin}
                     disabled={isDriveConnecting}
                     className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold shadow-sm border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-all"
                   >
                     {isDriveConnecting ? (
                       <Loader2 className="animate-spin text-blue-600" size={20} />
                     ) : (
                       <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                     )}
                     {isDriveConnecting ? 'Conectando a Google...' : 'Vincular Cuenta Google'}
                   </button>
                 ) : (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-blue-100 w-fit">
                           <img src={driveUser.picture} className="w-8 h-8 rounded-full" alt="User" />
                           <div>
                             <p className="text-xs font-bold text-gray-900">{driveUser.name}</p>
                             <p className="text-[10px] text-gray-500">{driveUser.email}</p>
                           </div>
                           <div className="w-2 h-2 rounded-full bg-green-500 ml-2"></div>
                         </div>
                         <button onClick={handleDisconnectDrive} className="text-xs text-red-500 hover:underline">Desvincular</button>
                     </div>
                     
                     <div className="bg-green-100 text-green-800 p-3 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle size={16} />
                        Sincronización activa en carpeta: <strong>Dulce Alya Backup</strong>
                     </div>
                   </div>
                 )}
               </div>
            </div>
            
            {/* API CONFIGURATION (Required for Real Mode) */}
             <div className="border-t border-gray-100 pt-4">
               <button 
                 onClick={() => setShowApiConfig(!showApiConfig)}
                 className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-900"
               >
                 <Key size={16} /> Configuración de API (Requerido para Drive) {showApiConfig ? '▲' : '▼'}
               </button>
               
               {showApiConfig && (
                 <div className="mt-4 bg-gray-50 p-4 rounded-xl space-y-3">
                   <p className="text-xs text-gray-500">
                     Para usar Google Drive real, necesitas credenciales de Google Cloud Console. 
                     Habilita "Google Drive API" y crea un Client ID y API Key.
                   </p>
                   <div>
                     <label className="text-xs font-bold text-gray-700">Client ID (OAuth 2.0)</label>
                     <input 
                       type="text" 
                       value={apiConfig.clientId}
                       onChange={e => setApiConfig({...apiConfig, clientId: e.target.value})}
                       className="w-full p-2 border rounded text-xs"
                       placeholder="xxxxxxxx.apps.googleusercontent.com"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-700">API Key</label>
                     <input 
                       type="text" 
                       value={apiConfig.apiKey}
                       onChange={e => setApiConfig({...apiConfig, apiKey: e.target.value})}
                       className="w-full p-2 border rounded text-xs"
                       placeholder="AIzaSy..."
                     />
                   </div>
                 </div>
               )}
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Manual Import/Export */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  <FileJson size={18} /> Respaldo Local (Archivo)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
                  >
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                      <Download size={20} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-900">Exportar</span>
                      <span className="text-xs text-gray-500">Descargar JSON</span>
                    </div>
                  </button>

                  <button 
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center relative overflow-hidden"
                  >
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    {importStatus === 'success' && (
                      <div className="absolute inset-0 bg-green-50 flex items-center justify-center z-10">
                        <CheckCircle className="text-green-500" />
                      </div>
                    )}
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                      <Upload size={20} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-900">Importar</span>
                      <span className="text-xs text-gray-500">Restaurar JSON</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                 <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  <ShieldCheck size={18} /> Estado de la Conexión
                </h4>
                <div className={`p-4 rounded-xl border ${isFileConnected || syncMode === 'drive' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                  {isFileConnected || syncMode === 'drive' ? (
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-green-800">
                            {syncMode === 'drive' ? 'Nube de Google Conectada' : 'Disco Local Conectado'}
                        </h5>
                        <p className="text-xs text-green-700 mt-1">
                          {syncMode === 'drive' 
                             ? "Tus datos se guardan automáticamente en tu carpeta de Drive."
                             : (hasFileHandle 
                                 ? "Guardado automático en disco local activo." 
                                 : "Modo Manual activo.")
                          }
                        </p>
                        {isSaving && <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1"><RefreshCw size={10} className="animate-spin"/> Guardando...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-200 p-2 rounded-lg">
                        <AlertTriangle className="text-gray-500" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-700">Sin conexión persistente</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          Los datos solo se guardan en este navegador.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Local Disk Connect Button if in Drive Mode or Disconnected */}
                {syncMode !== 'local' && (
                     <button 
                        onClick={onConnectDB}
                        className="w-full p-2 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 flex items-center justify-center gap-2"
                     >
                        <HardDrive size={14}/> Cambiar a Modo Disco Local
                     </button>
                )}
              </div>
            </div>
          </div>
        );
      case 'hardware':
      case 'tax':
      case 'history':
      case 'logout':
        return renderDefaultTabs(activeTab);
      default:
        return null;
    }
  };

  const renderDefaultTabs = (tab: string) => {
     if (tab === 'tax') return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Percent size={20} className="text-primary-500" />
            Configuración de Moneda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Moneda Principal</label>
              <select 
                value={config.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
              >
                <option value="COP">COP - Peso Colombiano ($)</option>
                <option value="USD">USD - Dólar Americano ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>
          </div>
        </div>
     );
     if (tab === 'hardware') return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Printer size={20} className="text-primary-500" />
            Impresoras y POS
          </h3>
          <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center text-gray-500">
              No hay impresoras térmicas detectadas. <br/>
              <button className="text-primary-500 font-semibold mt-2 hover:underline">Buscar dispositivos</button>
          </div>
        </div>
     );
     if (tab === 'history') return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History size={20} className="text-primary-500" />
            Historial de Inicios de Sesión
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Dispositivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginHistory.length > 0 ? (
                  loginHistory.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{event.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{event.user}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === 'Exitoso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{event.device || 'Navegador Web'}</td>
                    </tr>
                  ))
                ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay registros recientes</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
     );
     if (tab === 'logout') return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <LogOut size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¿Deseas cerrar sesión?
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Tendrás que volver a ingresar tu usuario y contraseña para acceder al sistema.
          </p>
          <button 
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            Cerrar Sesión
          </button>
        </div>
     );
     return null;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configuración</h2>
          <p className="text-gray-500 mt-2">Administra los parámetros generales de Dulce Alya.</p>
        </div>
        {activeTab !== 'logout' && activeTab !== 'database' && (
          <button onClick={handleSave} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary-200 transition-all flex items-center gap-2">
            <Save size={18} />
            Guardar Cambios
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Column */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-white text-primary-600 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};