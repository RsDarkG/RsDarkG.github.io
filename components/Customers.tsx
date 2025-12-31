import React from 'react';
import { Search, Plus, User, Phone, Mail, ArrowRight, Filter, Download } from 'lucide-react';
import { Customer } from '../types';

const mockCustomers: Customer[] = [
  { id: '1', name: 'María López', phone: '+34 612 345 678', email: 'maria.lopez@gmail.com', lastPurchase: '12 Oct 2023', favoriteFlavor: 'Vainilla', totalSpend: 156.00, status: 'Active' },
  { id: '2', name: 'Juan Pérez', phone: '+34 699 888 777', email: 'juan.perez@email.com', lastPurchase: '10 Oct 2023', favoriteFlavor: 'Chocolate Belga', totalSpend: 89.50, status: 'Active' },
  { id: '3', name: 'Ana García', phone: '+34 600 111 222', email: 'ana.garcia@gmail.com', lastPurchase: '05 Oct 2023', favoriteFlavor: 'Fresa Natural', totalSpend: 210.25, status: 'Active' },
  { id: '4', name: 'Carlos Ruiz', phone: '+34 655 444 333', email: 'carlos.r@email.com', lastPurchase: '01 Oct 2023', favoriteFlavor: 'Pistacho', totalSpend: 45.00, status: 'Inactive' },
];

export const Customers: React.FC = () => {
  const handleExport = () => {
    // Generate simple CSV for customers
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nombre,Telefono,Email,GastoTotal\n"
      + mockCustomers.map(c => `${c.name},${c.phone},${c.email},${c.totalSpend}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_dulce_alya.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Clientes</h2>
        <p className="text-gray-500 mt-2">Administra la base de datos de clientes frecuentes, sus puntos de lealtad y preferencias.</p>
        <div className="mt-6">
           <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary-200 transition-all flex items-center gap-2">
            <Plus size={20} />
            Registrar Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 text-gray-500 mb-2">
             <User size={18} /> <span className="text-sm font-medium">Total Clientes</span>
           </div>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-bold text-gray-900">1,240</span>
             <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">+12%</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 text-gray-500 mb-2">
             <Plus size={18} /> <span className="text-sm font-medium">Nuevos este mes</span>
           </div>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-bold text-gray-900">+35</span>
             <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">+5%</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 text-gray-500 mb-2">
             <User size={18} /> <span className="text-sm font-medium">Clientes Frecuentes</span>
           </div>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-bold text-gray-900">450</span>
             <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">+2%</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 text-gray-500 mb-2">
             <span className="text-sm font-medium">Venta Promedio</span>
           </div>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-bold text-gray-900">$15.50</span>
             <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">+1.5%</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nombre, teléfono o email..." 
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
            />
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 focus:bg-gray-100 active:bg-gray-200">
               <Filter size={16} /> Filtros
             </button>
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 focus:bg-gray-100 active:bg-gray-200"
             >
               <Download size={16} /> Exportar
             </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
             <tr>
               <th className="px-6 py-4">Nombre</th>
               <th className="px-6 py-4">Contacto</th>
               <th className="px-6 py-4">Última Compra</th>
               <th className="px-6 py-4">Sabor Favorito</th>
               <th className="px-6 py-4">Historial</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {mockCustomers.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 ${['bg-pink-100', 'bg-blue-100', 'bg-purple-100', 'bg-green-100'][i % 4]}`}>
                      {c.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">ID: #C-102{i}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-gray-600">
                    <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {c.phone}</span>
                    <span className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {c.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{c.lastPurchase}</p>
                  <p className="text-xs text-gray-500">Hace {2 + i*2} días</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-full text-xs font-medium">
                    {c.favoriteFlavor}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-primary-500 font-medium hover:text-primary-700 flex items-center gap-1 group">
                     Ver Pedidos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
           <span>Mostrando <strong>1</strong> a <strong>4</strong> de <strong>1,240</strong> resultados</span>
           <div className="flex gap-2">
             <button className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50">‹</button>
             <button className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50">›</button>
           </div>
        </div>
      </div>
    </div>
  );
};