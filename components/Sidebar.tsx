import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  IceCream2, 
  BarChart3, 
  Settings, 
  LogOut,
  FileText,
  Headphones,
  Mail,
  Phone,
  Database,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout?: () => void;
  currentUser?: string | null;
  // Database props are now handled in Settings, but we keep status for the indicator
  isFileConnected?: boolean;
  hasFileHandle?: boolean;
  isSaving?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  onLogout, 
  currentUser,
  isFileConnected = false,
  hasFileHandle = false,
  isSaving = false
}) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Panel de Control', icon: LayoutDashboard },
    { id: ViewState.POS, label: 'Punto de Venta', icon: ShoppingBag },
    { id: ViewState.BILLING, label: 'Facturación', icon: FileText },
    { id: ViewState.PRODUCTS, label: 'Productos', icon: IceCream2 },
    { id: ViewState.REPORTS, label: 'Reportes', icon: BarChart3 },
    { id: ViewState.SETTINGS, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm no-print">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-200">
          <IceCream2 size={24} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">Dulce Alya</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Sync Status Indicator (Mini) */}
      {isFileConnected && (
        <div className="px-4 mb-2 animate-fade-in">
          <div className={`px-3 py-2 rounded-lg border flex items-center justify-between ${hasFileHandle ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className="flex items-center gap-2">
              <Database size={14} className={hasFileHandle ? "text-green-600" : "text-orange-600"} />
              <span className={`text-[10px] font-bold uppercase ${hasFileHandle ? "text-green-800" : "text-orange-800"}`}>
                {hasFileHandle ? 'Sincronizado' : 'Modo Manual'}
              </span>
            </div>
            {isSaving ? <RefreshCw size={12} className="text-green-500 animate-spin" /> : <CheckCircle size={12} className={hasFileHandle ? "text-green-500" : "text-orange-400"} />}
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary-50 text-primary-600 font-medium shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 mt-auto">
        {/* Support Section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-primary-600 font-semibold text-sm">
            <Headphones size={16} />
            <span>Soporte Técnico</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 break-all">
              <Mail size={12} className="shrink-0" />
              <span>wipetor12@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone size={12} className="shrink-0" />
              <span>+57 304 363 1965</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-2 py-2">
          <img 
            src="https://picsum.photos/seed/adminUser/100/100" 
            alt="Admin" 
            className="w-8 h-8 rounded-full border border-gray-200"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate capitalize">{currentUser || 'Admin User'}</p>
            <p className="text-xs text-gray-500">Gerente</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};