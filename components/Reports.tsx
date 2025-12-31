import React, { useState, useMemo } from 'react';
import { Download, Calendar, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ViewState, Invoice, Product } from '../types';

interface ReportsProps {
  onNavigate?: (view: ViewState) => void;
  invoices: Invoice[];
  products: Product[];
}

const COLORS = ['#f43f5e', '#fca5a5', '#fed7aa', '#94a3b8', '#818cf8', '#34d399'];

export const Reports: React.FC<ReportsProps> = ({ onNavigate, invoices = [], products = [] }) => {
  const [activeFilter, setActiveFilter] = useState('Hoy');

  // --- CALCULATIONS BASED ON REAL DATA ---

  // 1. Filter Invoices (Basic implementation, extends easily)
  const filteredInvoices = useMemo(() => {
    // In a real app, date filtering logic goes here based on activeFilter
    // For now, we use all invoices to show data
    return invoices.filter(inv => inv.status !== 'Cancelada');
  }, [invoices, activeFilter]);

  // 2. KPI Stats
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalTickets = filteredInvoices.length;
  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
  
  // 3. Category Data for Pie Chart
  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    let totalItems = 0;

    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
        totalItems += item.quantity;
      });
    });

    return Object.keys(categories).map((key, index) => ({
      name: key,
      value: categories[key],
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredInvoices]);

  const totalUnitsSold = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // 4. Sales Over Time (Group by Hour for "Today" view simulation)
  const salesData = useMemo(() => {
    // Determine groupings. For simplicity, we stick to a mock daily distribution based on the total
    // or group existing invoices by hour if they have dates.
    const hours: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      // Assuming date format "14 Oct 2023, 14:30"
      try {
        const timePart = inv.date.split(',')[1]?.trim();
        const hour = timePart ? timePart.split(':')[0] : '12';
        const label = `${hour}:00`;
        hours[label] = (hours[label] || 0) + inv.total;
      } catch (e) {}
    });

    // Fill gaps or just show what we have
    return Object.keys(hours).map(h => ({
      name: h,
      uv: hours[h]
    })).sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [filteredInvoices]);

  // 5. Top Flavors/Products
  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.category === 'Sabores' || item.category === 'Bebidas') {
           counts[item.name] = (counts[item.name] || 0) + item.quantity;
        }
      });
    });
    
    // Find max for progress bar
    const maxVal = Math.max(...Object.values(counts), 0);

    return Object.entries(counts)
      .map(([name, val]) => ({ name, val, max: maxVal }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5); // Top 5
  }, [filteredInvoices]);


  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Folio,Fecha,Total,Metodo\n"
      + filteredInvoices.map(inv => `${inv.folio},"${inv.date}",${inv.total},${inv.paymentMethod}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_ventas_real.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Informes y Análisis</h2>
          <p className="text-gray-500 mt-2">Datos en tiempo real de tu negocio.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Download size={16} />
            Exportar Datos
          </button>
          <button 
            onClick={() => onNavigate && onNavigate(ViewState.POS)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 shadow-lg shadow-primary-200 transition-all active:scale-95"
          >
            + Nueva Factura
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['Hoy', 'Ayer', '7 Días', 'Este Mes'].map((filter) => (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeFilter === filter ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Ventas Totales', val: formatCOP(totalRevenue), tag: 'Real', color: 'text-green-600', bg: 'bg-green-100', icon: '💵' },
          { label: 'Total Tickets', val: totalTickets, tag: 'Real', color: 'text-blue-600', bg: 'bg-blue-100', icon: '🧾' },
          { label: 'Ticket Promedio', val: formatCOP(avgTicket), tag: 'Avg', color: 'text-orange-600', bg: 'bg-orange-100', icon: '📠' },
          { label: 'Producto Top', val: topProducts[0]?.name || 'N/A', icon: '🏆' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4 ${i === 3 ? 'bg-pink-100' : 'bg-gray-50'}`}>
              {stat.icon}
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className={`font-bold text-gray-900 ${i===3 ? 'text-lg leading-7' : 'text-2xl'}`}>{stat.val}</h3>
              {stat.tag && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stat.bg} ${stat.color} mb-1`}>{stat.tag}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Distribución de Ventas (Hora)</h3>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
             {salesData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCOP(value), 'Ventas']}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="uv" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">
                 No hay datos de ventas para mostrar
               </div>
             )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Mix de Productos</h3>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-500 uppercase">Total</span>
              <span className="text-2xl font-bold text-gray-900">{totalUnitsSold}</span>
              <span className="text-xs text-gray-400">Items</span>
            </div>
          </div>
          <div className="mt-6 space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
             {pieData.map(d => (
               <div key={d.name} className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                   <span className="text-gray-600 truncate max-w-[120px]">{d.name}</span>
                 </div>
                 <span className="font-bold text-gray-900">{totalUnitsSold > 0 ? Math.round((d.value / totalUnitsSold) * 100) : 0}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
           <h3 className="font-bold text-gray-900 mb-6">Productos Más Vendidos</h3>
           <div className="space-y-6">
              {topProducts.length > 0 ? topProducts.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-500">{item.val} unidades</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full" style={{width: `${item.max > 0 ? (item.val/item.max)*100 : 0}%`}}></div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-8">No hay suficientes datos</div>
              )}
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-gray-900">Últimas Facturas (Real)</h3>
             <button onClick={() => onNavigate && onNavigate(ViewState.BILLING)} className="text-primary-500 text-sm font-medium hover:underline">Ver todas</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead className="text-gray-400 font-medium text-xs uppercase text-left">
                  <tr>
                    <th className="pb-3">Hora</th>
                    <th className="pb-3">Folio</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {filteredInvoices.slice(0, 5).map(inv => (
                   <tr key={inv.id} className="group cursor-pointer hover:bg-gray-50" onClick={() => onNavigate && onNavigate(ViewState.BILLING)}>
                     <td className="py-3 text-gray-500">{inv.date.split(',')[1] || inv.date}</td>
                     <td className="py-3 font-medium text-gray-900 group-hover:text-primary-600">{inv.folio}</td>
                     <td className="py-3 text-gray-500 truncate max-w-[100px]">{inv.customerName}</td>
                     <td className="py-3 text-right font-bold text-gray-900">{formatCOP(inv.total)}</td>
                   </tr>
                 ))}
                 {filteredInvoices.length === 0 && (
                   <tr><td colSpan={4} className="text-center py-4 text-gray-400">Sin facturas registradas</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};