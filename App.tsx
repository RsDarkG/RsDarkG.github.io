import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Products } from './components/Products';
import { Reports } from './components/Reports';
import { Billing } from './components/Billing';
import { Settings } from './components/Settings';
import { Customers } from './components/Customers';
import { Login } from './components/Login';
import { ViewState, Invoice, Product, LoginEvent } from './types';
import { dataService } from './services/dataService';

// Helper to get today's formatted date
const getTodayString = () => new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Safe UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Initial Mock Data (Used only if localStorage is empty)
const date = new Date();
const dateStr = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');

const initialInvoicesData: Invoice[] = [
  {
    id: '1',
    folio: `F-${dateStr}-001`,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    date: getTodayString(), 
    timestamp: Date.now(),
    customerName: 'Juan Pérez',
    customerNif: 'XAXX010101000',
    customerEmail: 'juan.perez@email.com',
    items: [
      { id: '1', name: 'Chocolate Belga', category: 'Sabores', price: 12000, description: '', image: '', available: true, quantity: 2 },
      { id: '7', name: 'Cono Waffle', category: 'Tamaños', price: 2000, description: '', image: '', available: true, quantity: 2 },
    ],
    subtotal: 28000,
    tax: 0,
    total: 28000,
    status: 'Pagada',
    paymentMethod: 'Nequi'
  },
  {
    id: '2',
    folio: `F-${dateStr}-002`,
    uuid: '987fcdeb-51a2-43f1-b987-123456789abc',
    date: getTodayString(),
    timestamp: Date.now(),
    customerName: 'Consumidor Final',
    customerNif: '222222222222',
    customerEmail: '',
    items: [
      { id: '8', name: 'Batido Oreo', category: 'Bebidas', price: 15000, description: '', image: '', available: true, quantity: 1 },
    ],
    subtotal: 15000,
    tax: 0,
    total: 15000,
    status: 'Pagada',
    paymentMethod: 'Efectivo'
  }
];

const initialProductsData: Product[] = [
  { id: '1', name: 'Chocolate Belga', category: 'Sabores', price: 12000, description: 'Oscuro 70%', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '2', name: 'Vainilla Clásica', category: 'Sabores', price: 10000, description: 'Madagascar', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '3', name: 'Fresa Natural', category: 'Sabores', price: 11000, description: 'Fruta real', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '4', name: 'Menta Granizada', category: 'Sabores', price: 10000, description: 'Refrescante', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '5', name: 'Dulce de Leche', category: 'Sabores', price: 12000, description: 'Estilo Argentino', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '6', name: 'Café Espresso', category: 'Bebidas', price: 6000, description: 'Intenso', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '7', name: 'Cono Waffle', category: 'Tamaños', price: 2000, description: 'Crujiente', image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&w=400&q=80', available: true },
  { id: '8', name: 'Batido Oreo', category: 'Bebidas', price: 15000, description: 'Con crema', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80', available: true },
];

export default function App() {
  // SESSION STATE
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // SYNC STATE
  const [isFileConnected, setIsFileConnected] = useState(false);
  const [hasFileHandle, setHasFileHandle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  // DATA STATE
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('dulce_alya_invoices');
      return saved ? JSON.parse(saved) : initialInvoicesData;
    } catch(e) {
      return initialInvoicesData;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dulce_alya_products');
      return saved ? JSON.parse(saved) : initialProductsData;
    } catch(e) {
      return initialProductsData;
    }
  });

  const [loginHistory, setLoginHistory] = useState<LoginEvent[]>(() => {
    try {
      const saved = localStorage.getItem('dulce_alya_login_history');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    // Attempt to restore persistent session (File Handle)
    const initSession = async () => {
      const handleExists = await dataService.restoreSession();
      if (handleExists) {
        setHasFileHandle(true);
        // We set connected to true, but verifyPermission might be needed on first save
        setIsFileConnected(true);
        console.log("Database session restored.");
      }
    };
    initSession();
  }, []);

  // --- PERSISTENCE LOGIC ---
  
  // 1. Always save to LocalStorage (Instant Cache)
  useEffect(() => {
    localStorage.setItem('dulce_alya_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('dulce_alya_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('dulce_alya_login_history', JSON.stringify(loginHistory));
  }, [loginHistory]);

  // 2. Auto-Save on Change (Debounced)
  useEffect(() => {
    if (isFileConnected && hasFileHandle) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Verify we still have permission (might prompt user)
          const perm = await dataService.verifyPermission();
          if (!perm) {
            console.warn("Permission lost for auto-save");
            return;
          }
          
          const currentState = {
            invoices,
            products,
            history: loginHistory,
            settings: JSON.parse(localStorage.getItem('dulce_alya_settings') || '{}'),
            version: '1.0.0',
            exportedAt: new Date().toISOString()
          };
          await dataService.saveToDisk(currentState);
        } catch (err) {
          console.error("Auto-save failed", err);
        } finally {
          setIsSaving(false);
        }
      }, 2000); // 2 seconds debounce
    }
  }, [invoices, products, loginHistory, isFileConnected, hasFileHandle]);

  // 3. SCHEDULED AUTO-SAVE (Every 5 minutes)
  useEffect(() => {
    const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    
    const intervalId = setInterval(async () => {
      if (isFileConnected && hasFileHandle && !isSaving) {
        console.log("Triggering 5-minute scheduled backup...");
        setIsSaving(true);
        try {
          // Check permission first
          const perm = await dataService.verifyPermission();
          if (perm) {
            await dataService.saveToDisk(); // Saves current state from service
            console.log("Scheduled backup successful.");
          } else {
             console.log("Scheduled backup skipped: No permission.");
          }
        } catch (e) {
          console.error("Scheduled backup failed", e);
        } finally {
          setIsSaving(false);
        }
      }
    }, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isFileConnected, hasFileHandle, isSaving]);


  // --- HANDLERS ---

  const handleConnectDB = async () => {
    try {
      // If we already have a handle (restored session), just verify permission
      if (hasFileHandle) {
         const hasPerm = await dataService.verifyPermission();
         if (hasPerm) {
           alert("Conexión restablecida correctamente.");
           setIsFileConnected(true);
           return;
         }
         // If verify failed, we might need to open picker again if browser is strict,
         // but usually verifyPermission requests it.
      }

      const data = await dataService.openFromDisk();
      if (data) {
        setInvoices(data.invoices);
        setProducts(data.products);
        setLoginHistory(data.history || []);
        if (data.settings) {
          localStorage.setItem('dulce_alya_settings', JSON.stringify(data.settings));
        }
        setIsFileConnected(true);
        setHasFileHandle(!!dataService.fileHandle);
        alert("¡Base de datos conectada y vinculada!");
      }
    } catch (e) {
      console.log("Connection cancelled or failed");
    }
  };

  const handleManualSave = async () => {
     setIsSaving(true);
     await dataService.saveToDisk();
     setIsSaving(false);
     alert("¡Datos guardados correctamente!");
  };

  const handleLogin = (user: string) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    
    // Log success login
    const newEvent: LoginEvent = {
      id: generateUUID(),
      date: new Date().toLocaleString('es-CO'),
      user: user,
      status: 'Exitoso',
      device: 'Web Browser'
    };
    setLoginHistory(prev => [newEvent, ...prev]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView(ViewState.DASHBOARD);
    // Note: We do NOT clear file connection on logout anymore to support persistence
    // But we might want to pause sync? No, user asked for persistence.
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} invoices={invoices} products={products} />;
      case ViewState.POS:
        return <POS onAddInvoice={handleAddInvoice} products={products} currentUser={currentUser || 'Admin'} />;
      case ViewState.BILLING:
        return <Billing invoices={invoices} />;
      case ViewState.PRODUCTS:
        return <Products products={products} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />;
      case ViewState.REPORTS:
        return <Reports onNavigate={setCurrentView} invoices={invoices} products={products} />;
      case ViewState.SETTINGS:
        return (
          <Settings 
            onLogout={handleLogout} 
            loginHistory={loginHistory}
            onConnectDB={handleConnectDB}
            onManualSave={handleManualSave}
            isFileConnected={isFileConnected}
            hasFileHandle={hasFileHandle}
            isSaving={isSaving}
          />
        );
      default:
        return <Dashboard onNavigate={setCurrentView} invoices={invoices} products={products} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout}
        currentUser={currentUser}
        isFileConnected={isFileConnected}
        hasFileHandle={hasFileHandle}
        isSaving={isSaving}
      />
      
      <main className="flex-1 ml-64 min-h-screen transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}