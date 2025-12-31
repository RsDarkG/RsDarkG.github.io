import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, ArrowRight, Smartphone, CheckCircle, Camera, Upload, User, X } from 'lucide-react';
import { Product, CartItem, Invoice } from '../types';

const categories = ['Todos', 'Sabores', 'Copas', 'Conos', 'Bebidas', 'Extras'];

interface POSProps {
  onAddInvoice?: (invoice: Invoice) => void;
  products: Product[];
  currentUser?: string;
}

export const POS: React.FC<POSProps> = ({ onAddInvoice, products = [], currentUser = 'Cajero' }) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  // Initialize Cart from LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('dulce_alya_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Efectivo' | 'Nequi' | 'Transferencia' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Customer State
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save Cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dulce_alya_cart', JSON.stringify(cart));
  }, [cart]);

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Camera Logic
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      alert("No se pudo acceder a la cámara. Verifica los permisos.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setCustomerPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = 0; // Tax removed
  const total = subtotal;

  // Safe UUID generator that works in all browsers/contexts
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleCheckout = () => {
    if (!selectedPaymentMethod) return;
    
    // Generate Folio with current Date: F-YYYYMMDD-Random
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
    
    // Create new Invoice
    const newInvoice: Invoice = {
      id: generateUUID(),
      folio: `F-${dateStr}-${Math.floor(Math.random() * 1000)}`,
      uuid: generateUUID(),
      date: now.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      customerName: customerName || 'Consumidor Final', 
      customerNif: '222222222222',
      customerEmail: '',
      customerPhoto: customerPhoto || undefined,
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: 'Pagada',
      paymentMethod: selectedPaymentMethod
    };

    if (onAddInvoice) {
      onAddInvoice(newInvoice);
    } else {
      console.error("onAddInvoice function is missing!");
    }

    // Show Success Animation
    setShowSuccess(true);
    
    // Reset Cart and selection after delay
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]); // This triggers the useEffect, clearing localStorage
      setSelectedPaymentMethod(null);
      setCustomerName('Consumidor Final');
      setCustomerPhoto(null);
    }, 2000);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category.includes(activeCategory) || (activeCategory === 'Copas' && p.category === 'Sabores');
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (showSuccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col animate-fade-in">
        <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={64} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h2>
          <p className="text-gray-500 text-lg mb-6">La factura ha sido enviada al módulo de facturación.</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{formatCOP(total)}</p>
          <span className="px-4 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
            {selectedPaymentMethod}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Side: Product Grid */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Camera Modal */}
        {showCamera && (
           <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
             <div className="bg-white p-2 rounded-2xl overflow-hidden shadow-2xl">
               <video ref={videoRef} autoPlay playsInline className="w-[500px] h-[375px] bg-black object-cover rounded-xl" />
             </div>
             <div className="flex gap-4 mt-6">
               <button onClick={stopCamera} className="px-6 py-3 rounded-xl bg-gray-600 text-white font-medium hover:bg-gray-700">Cancelar</button>
               <button onClick={takePhoto} className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 flex items-center gap-2">
                 <Camera size={20} /> Capturar
               </button>
             </div>
           </div>
        )}

        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-primary-500">Dulce Alya POS</span>
            </h2>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar sabor o producto..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-100 rounded-xl transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-xs text-gray-500 uppercase font-semibold">Cajero</p>
              <p className="text-sm font-bold text-gray-900 capitalize">{currentUser}</p>
            </div>
            <img src="https://picsum.photos/seed/user1/40/40" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white px-6 py-3 border-b border-gray-100 flex gap-6 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex flex-col items-center gap-1 min-w-[60px] pb-2 border-b-2 transition-all ${
                activeCategory === cat 
                  ? 'border-primary-500 text-primary-600 font-medium' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-sm">{cat}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64"
              >
                {/* Product Image emphasized, no description text */}
                <div className="relative w-full h-40 mb-3 overflow-hidden rounded-xl border border-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-primary-600 font-bold text-lg mt-auto">{formatCOP(product.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-900">Orden Actual</h2>
             <button 
                onClick={() => setCart([])} 
                className="text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
             >
               Limpiar
             </button>
          </div>
          
          {/* Customer Input Section */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cliente</label>
            <div className="flex gap-2 mb-2">
               <div className="relative flex-1">
                 <User size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   value={customerName}
                   onChange={(e) => setCustomerName(e.target.value)}
                   className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                   placeholder="Nombre del cliente"
                 />
               </div>
            </div>
            <div className="flex items-center gap-2">
               {customerPhoto ? (
                 <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 group">
                   <img src={customerPhoto} className="w-full h-full object-cover" />
                   <button 
                      onClick={() => setCustomerPhoto(null)} 
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                   >
                     <X size={14} />
                   </button>
                 </div>
               ) : (
                 <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                   <User size={20} />
                 </div>
               )}
               <div className="flex-1 flex gap-2">
                 <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                    <Upload size={14} /> Subir
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                 
                 <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                    <Camera size={14} /> Foto
                 </button>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ArrowRight size={48} className="mb-4 opacity-20" />
              <p>Agrega productos para comenzar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-white" alt={item.name} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                    <p className="font-bold text-gray-900">{formatCOP(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1 shadow-sm">
                      <button onClick={(e) => {e.stopPropagation(); updateQuantity(item.id, -1)}} className="text-gray-400 hover:text-primary-600">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={(e) => {e.stopPropagation(); updateQuantity(item.id, 1)}} className="text-gray-400 hover:text-primary-600">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-200 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {/* Tax row removed */}
            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-end">
              <span className="font-bold text-lg text-gray-900">Total</span>
              <span className="font-bold text-2xl text-primary-600">{formatCOP(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setSelectedPaymentMethod('Efectivo')}
              className={`flex flex-col items-center justify-center gap-1 py-3 border rounded-xl text-xs font-semibold transition-all ${
                selectedPaymentMethod === 'Efectivo' 
                ? 'bg-primary-50 border-primary-500 text-primary-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Banknote size={20} />
              Efectivo
            </button>
            <button 
              onClick={() => setSelectedPaymentMethod('Nequi')}
              className={`flex flex-col items-center justify-center gap-1 py-3 border rounded-xl text-xs font-semibold transition-all ${
                 selectedPaymentMethod === 'Nequi' 
                 ? 'bg-purple-50 border-purple-500 text-purple-700' 
                 : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Smartphone size={20} />
              Nequi
            </button>
            <button 
              onClick={() => setSelectedPaymentMethod('Transferencia')}
              className={`flex flex-col items-center justify-center gap-1 py-3 border rounded-xl text-xs font-semibold transition-all ${
                 selectedPaymentMethod === 'Transferencia' 
                 ? 'bg-blue-50 border-blue-500 text-blue-700' 
                 : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard size={20} />
              Transf.
            </button>
          </div>
          
          <button 
            disabled={cart.length === 0 || !selectedPaymentMethod}
            onClick={handleCheckout}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Cobrar {formatCOP(total)}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};