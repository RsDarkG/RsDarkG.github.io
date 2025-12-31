import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  QrCode,
  User,
  X,
  ZoomIn
} from 'lucide-react';
import { Invoice } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BillingProps {
  invoices: Invoice[];
}

export const Billing: React.FC<BillingProps> = ({ invoices }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Reset selected invoice if the list changes or verify it still exists
  useEffect(() => {
    if (invoices.length > 0 && !selectedInvoice) {
      // Optional: Select the first one by default, or leave null
    }
  }, [invoices, selectedInvoice]);

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;
    setIsGeneratingPdf(true);

    try {
      const element = document.getElementById('invoice-content');
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true, // Allow external images
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Factura-${selectedInvoice.folio}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.uuid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = invoices.reduce((sum, inv) => inv.status !== 'Cancelada' ? sum + inv.total : sum, 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* Large Photo Modal */}
      {showPhotoModal && selectedInvoice?.customerPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in no-print" onClick={() => setShowPhotoModal(false)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setShowPhotoModal(false)}
          >
            <X size={32} />
          </button>
          <img 
            src={selectedInvoice.customerPhoto} 
            alt="Cliente Grande" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
          <div className="absolute bottom-8 text-white text-center">
            <p className="text-xl font-bold">{selectedInvoice.customerName}</p>
            <p className="text-sm opacity-80">Foto de archivo del cliente</p>
          </div>
        </div>
      )}

      {/* Left List Panel */}
      <div className={`${selectedInvoice ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[450px] border-r border-gray-200 bg-white h-full z-10 no-print`}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Historial de Ventas</h2>
          <p className="text-sm text-gray-500 mb-6">Gestiona tus facturas electrónicas.</p>
          
          <div className="flex gap-2 mb-4">
             <div className="flex-1 bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs text-green-600 font-semibold uppercase">Ingresos Totales</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(totalIncome)}</p>
             </div>
             <div className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold uppercase">Facturas</p>
                <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
             </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por folio, cliente o UUID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredInvoices.map((inv) => (
            <div 
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedInvoice?.id === inv.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-900 text-sm">{inv.folio}</span>
                <span className="text-xs text-gray-500">{inv.date}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 truncate max-w-[180px]">{inv.customerName}</span>
                <span className="font-bold text-gray-900">{formatCOP(inv.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border-green-200' :
                    inv.status === 'Pendiente' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-red-100 text-red-700 border-red-200'
                 }`}>
                   {inv.status}
                 </span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded border border-gray-200">
                     {inv.paymentMethod}
                   </span>
                   <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FileText size={12} />
                   </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Panel (The Invoice) */}
      <div className={`flex-1 bg-gray-100 overflow-y-auto p-4 lg:p-8 flex flex-col items-center ${!selectedInvoice ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedInvoice ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <FileText size={48} className="text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">Selecciona una factura para ver detalles</p>
          </div>
        ) : (
          <div className="w-full max-w-3xl animate-fade-in">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 no-print">
              <button onClick={() => setSelectedInvoice(null)} className="lg:hidden text-gray-600 font-medium">
                 ← Volver
              </button>
              <div className="flex gap-3 ml-auto">
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  <Download size={16} /> {isGeneratingPdf ? 'Generando...' : 'PDF'}
                </button>
              </div>
            </div>

            {/* Electronic Invoice Document */}
            <div id="invoice-content" className="bg-white rounded-none shadow-xl min-h-[800px] flex flex-col relative print:shadow-none print:w-full">
              
              {/* Status Watermark if Cancelled */}
              {selectedInvoice.status === 'Cancelada' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                   <span className="text-9xl font-bold text-red-500 -rotate-45 border-4 border-red-500 p-8 rounded-xl">CANCELADA</span>
                </div>
              )}

              {/* Header */}
              <div className="p-8 border-b border-gray-100 flex justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-primary-600 flex items-center gap-2">
                    Dulce Alya
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Dulce Alya Heladería<br />
                    Cra 15 # 85 - 12<br />
                    Bogotá, Colombia<br />
                    NIT: 900.123.456-7
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-900">FACTURA DE VENTA</h2>
                  <p className="text-sm text-gray-500 mt-1"><span className="font-semibold text-gray-700">Folio:</span> {selectedInvoice.folio}</p>
                  <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Fecha:</span> {selectedInvoice.date}</p>
                  <p className="text-xs text-gray-400 mt-2 max-w-[200px] truncate" title={selectedInvoice.uuid}>UUID: {selectedInvoice.uuid}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-8 grid grid-cols-2 gap-8 bg-gray-50/50 border-b border-gray-100">
                <div className="flex gap-4">
                  {selectedInvoice.customerPhoto && (
                    <div 
                      className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 cursor-zoom-in relative group"
                      onClick={() => setShowPhotoModal(true)}
                    >
                      <img src={selectedInvoice.customerPhoto} alt="Cliente" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <ZoomIn size={20} className="text-white"/>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Facturar a:</h3>
                    <p className="font-bold text-gray-900">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-gray-600">NIT/CC: {selectedInvoice.customerNif}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.customerEmail || 'Sin email registrado'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Detalles de Pago:</h3>
                  <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Método:</span> {selectedInvoice.paymentMethod}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Moneda:</span> COP - Peso Colombiano</p>
                </div>
              </div>

              {/* Items */}
              <div className="p-8 min-h-[300px]">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 border-b-2 border-gray-100">
                    <tr>
                      <th className="text-left py-3 font-semibold">Cant.</th>
                      <th className="text-left py-3 font-semibold">Descripción</th>
                      <th className="text-right py-3 font-semibold">Precio Unit.</th>
                      <th className="text-right py-3 font-semibold">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 text-gray-600">{item.quantity}</td>
                        <td className="py-4 text-gray-900 font-medium">
                          {item.name}
                          <span className="block text-xs text-gray-400">{item.category}</span>
                        </td>
                        <td className="py-4 text-right text-gray-600">{formatCOP(item.price)}</td>
                        <td className="py-4 text-right text-gray-900 font-bold">{formatCOP(item.price * item.quantity)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">Factura sin ítems (Cancelada o Anulada)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer / Totals */}
              <div className="mt-auto p-8 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                     {/* Fake QR Code */}
                     <div className="w-24 h-24 bg-white border border-gray-200 p-1 rounded-lg">
                       <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-xs text-center p-1">
                         <QrCode size={60} className="text-white"/>
                       </div>
                     </div>
                     <div className="text-xs text-gray-400 max-w-[200px]">
                       <p>Cadena original del complemento de certificación digital del SAT.</p>
                       <p className="mt-1 font-mono text-[10px] truncate">||1.1|{selectedInvoice.uuid}|{selectedInvoice.date}|SAT970701NN3||</p>
                     </div>
                  </div>
                  
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCOP(selectedInvoice.subtotal)}</span>
                    </div>
                    {/* Tax row removed */}
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-lg">Total</span>
                      <span className="font-bold text-primary-600 text-2xl">{formatCOP(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                   Este documento es una representación impresa de un CFDI.
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};