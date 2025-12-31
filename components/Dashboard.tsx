import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  Printer,
  FileText,
  X,
  CheckCircle,
  Banknote,
  Smartphone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Invoice, Product, ViewState } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  invoices: Invoice[];
  products: Product[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, invoices, products }) => {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');
  const [showZReport, setShowZReport] = useState(false);

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // --- Real Stats Calculation ---
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  // 1. Daily Stats
  const todaysInvoices = invoices.filter(inv => {
    const invTime = inv.timestamp || new Date().getTime(); // Fallback if missing
    return invTime >= startOfDay && inv.status !== 'Cancelada';
  });

  const totalSalesToday = todaysInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalOrders = todaysInvoices.length;
  // Avg Ticket removed as requested

  // Breakdown by Payment Method for Cierre Z
  const paymentBreakdown = todaysInvoices.reduce((acc, inv) => {
    acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + inv.total;
    return acc;
  }, {} as Record<string, number>);

  // 2. Chart Data - Week View (Last 7 Days)
  const weekData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const data = [];
    
    // Generate last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0,0,0,0);
      
      const dayName = days[d.getDay()];
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const sales = invoices
        .filter(inv => {
          const ts = inv.timestamp || 0;
          return ts >= dayStart && ts < dayEnd && inv.status !== 'Cancelada';
        })
        .reduce((sum, inv) => sum + inv.total, 0);
        
      data.push({ name: dayName, uv: sales });
    }
    return data;
  }, [invoices]);

  // 3. Chart Data - Month View (Last 4 Weeks)
  const monthData = useMemo(() => {
    const data = [];
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 3; i >= 0; i--) {
       const end = new Date().getTime() - (i * oneWeek);
       const start = end - oneWeek;
       
       const sales = invoices
        .filter(inv => {
          const ts = inv.timestamp || 0;
          return ts >= start && ts < end && inv.status !== 'Cancelada';
        })
        .reduce((sum, inv) => sum + inv.total, 0);

       data.push({ name: `Sem ${4-i}`, uv: sales });
    }
    return data;
  }, [invoices]);


  const handleCierreZ = () => {
    setShowZReport(true);
  };

  const printCierreZ = () => {
    window.print();
  };

  // Get Top Products (Calculated from invoices)
  const productSales: Record<string, number> = {};
  invoices.forEach(inv => {
    if (inv.status !== 'Cancelada') {
      inv.items.forEach(item => {
        productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      });
    }
  });

  const topProducts = Object.entries(productSales)
    .map(([id, count]) => {
      const prod = products.find(p => p.id === id);
      return prod ? { ...prod, count } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.count || 0) - (a?.count || 0))
    .slice(0, 4);

  // Fallback if no sales yet, show some products as featured
  const displayProducts = topProducts.length > 0 ? topProducts : products.slice(0, 4).map(p => ({...p, count: 0}));

  return (
    <div className="p-8 space-y-8 animate-fade-in relative">
      
      {/* Cierre Z Modal */}
      {showZReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gray-900 p-6 text-white flex justify-between items-start no-print">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Printer size={20} /> Reporte Cierre Z
                </h3>
                <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => setShowZReport(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6" id="cierre-z-content">
              <div className="text-center pb-6 border-b border-gray-100">
                <p className="text-gray-500 text-sm uppercase font-semibold">Ventas Totales del Día</p>
                <h2 className="text-4xl font-bold text-gray-900 mt-2">{formatCOP(totalSalesToday)}</h2>
                <p className="text-sm text-green-600 font-medium mt-1 bg-green-50 inline-block px-3 py-1 rounded-full">
                  {totalOrders} transacciones
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase">Desglose por Método</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-gray-200 text-gray-500">
                        <Banknote size={18} />
                      </div>
                      <span className="text-gray-700 font-medium">Efectivo</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCOP(paymentBreakdown['Efectivo'] || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-gray-200 text-purple-500">
                        <Smartphone size={18} />
                      </div>
                      <span className="text-gray-700 font-medium">Nequi</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCOP(paymentBreakdown['Nequi'] || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-gray-200 text-blue-500">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-gray-700 font-medium">Transferencia</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCOP(paymentBreakdown['Transferencia'] || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-gray-200 text-orange-500">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-gray-700 font-medium">Tarjeta</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCOP(paymentBreakdown['Tarjeta'] || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                 <CheckCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-yellow-800">
                   Este reporte consolida todas las ventas realizadas desde las 00:00 hasta el momento actual. 
                   Asegúrese de cuadrar la caja física con el total en Efectivo.
                 </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 no-print">
               <button onClick={() => setShowZReport(false)} className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">
                 Cerrar
               </button>
               <button onClick={printCierreZ} className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2">
                 <Printer size={18} /> Imprimir
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumen del Día</h2>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <Calendar size={16} />
            <span className="text-sm">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCierreZ}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm active:scale-95 transition-all"
          >
            <Printer size={16} />
            Cierre Z
          </button>
          <button onClick={() => onNavigate(ViewState.POS)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 shadow-lg shadow-primary-200 transition-all active:scale-95">
            + Nueva Factura
          </button>
        </div>
      </div>

      {/* KPI Cards - Ticket Promedio Removed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Ventas de Hoy', value: formatCOP(totalSalesToday), change: 'Hoy', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: 'Pedidos Totales', value: totalOrders.toString(), change: 'Hoy', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Caja Actual', value: formatCOP(totalSalesToday), change: 'En curso', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50' }, 
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                {stat.change}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Rendimiento (Real)</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setChartPeriod('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartPeriod === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setChartPeriod('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartPeriod === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Mes
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPeriod === 'week' ? weekData : monthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCOP(value), 'Ventas']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="uv" radius={[4, 4, 0, 0]}>
                  {chartPeriod === 'week' 
                    ? weekData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#f43f5e' : '#cbd5e1'} />
                    ))
                    : monthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#f43f5e' : '#cbd5e1'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Favoritos (Histórico)</h3>
            <button 
              onClick={() => onNavigate(ViewState.PRODUCTS)}
              className="text-primary-500 text-xs font-semibold hover:underline"
            >
              Ver Todo
            </button>
          </div>
          <div className="space-y-4">
            {displayProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <img src={item?.image} alt={item?.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{item?.name}</span>
                    <span className="text-xs font-bold text-primary-600">{item?.count}</span> 
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{width: `${Math.min(((item?.count || 1) / (displayProducts[0]?.count || 1)) * 100, 100)}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Últimas Transacciones</h3>
          <button onClick={() => onNavigate(ViewState.BILLING)} className="text-primary-500 text-xs font-semibold hover:underline">Ver todas</button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">FOLIO</th>
              <th className="px-6 py-4">CLIENTE</th>
              <th className="px-6 py-4">HORA</th>
              <th className="px-6 py-4">MÉTODO</th>
              <th className="px-6 py-4">ESTADO</th>
              <th className="px-6 py-4 text-right">TOTAL</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.slice(0, 5).map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{trx.folio}</td>
                <td className="px-6 py-4 text-gray-600">{trx.customerName}</td>
                <td className="px-6 py-4 text-gray-500">{trx.date.split(',')[1] || trx.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard size={14} />
                    {trx.paymentMethod}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${trx.status === 'Pagada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCOP(trx.total)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onNavigate(ViewState.BILLING)} className="text-gray-400 hover:text-gray-600">
                    <FileText size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No hay transacciones recientes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};