import React, { useState, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, X, Upload, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { geminiService } from '../services/geminiService';

interface ProductsProps {
  products: Product[];
  onAddProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ products = [], onAddProduct, onDeleteProduct }) => {
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Sabores',
    price: 0,
    description: '',
    image: '',
    available: true
  });

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name) {
      alert("Por favor ingresa un nombre primero.");
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      const description = await geminiService.generateProductDescription(
        newProduct.name, 
        newProduct.category || 'Sabores'
      );
      setNewProduct(prev => ({ ...prev, description }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price && onAddProduct) {
      const productToAdd: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: newProduct.name,
        category: newProduct.category as any,
        price: Number(newProduct.price),
        description: newProduct.description || '',
        image: newProduct.image || `https://picsum.photos/seed/${newProduct.name}/200/200`,
        available: true
      };
      onAddProduct(productToAdd);
      setShowForm(false);
      setNewProduct({ name: '', category: 'Sabores', price: 0, description: '', image: '' });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Productos</h2>
          <p className="text-gray-500 mt-2">Administra los sabores de helado, coberturas y tamaños disponibles.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary-200 transition-all flex items-center gap-2">
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Simple Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Agregar Producto</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {/* Image Upload Area */}
              <div className="flex justify-center mb-4">
                <div 
                  className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary-300 transition-all overflow-hidden relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="text-white" size={20} />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-gray-400 mb-2" size={32} />
                      <span className="text-xs text-gray-500 font-medium">Subir Foto</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <input 
                type="text" 
                placeholder="Nombre del Producto" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-500"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                >
                  <option value="Sabores">Sabores</option>
                  <option value="Toppings">Toppings</option>
                  <option value="Tamaños">Tamaños</option>
                  <option value="Bebidas">Bebidas</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Precio" 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                  value={newProduct.price || ''}
                  onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                />
              </div>

              <div className="relative">
                <textarea 
                  placeholder="Descripción (o usa IA para generar)" 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 resize-none h-24 text-sm"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
                <button 
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingAI || !newProduct.name}
                  className="absolute bottom-3 right-3 p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors disabled:opacity-50"
                  title="Generar con IA"
                >
                  {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
              
              <button onClick={handleSaveProduct} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-200 transition-all active:scale-95">
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <nav className="flex space-x-1">
              {['Todos', 'Sabores', 'Toppings', 'Tamaños', 'Bebidas'].map((tab, i) => (
                <button 
                  key={tab}
                  onClick={() => setActiveCategory(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === tab ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Producto</th>
                <th className="px-6 py-4 text-left">Categoría</th>
                <th className="px-6 py-4 text-left">Precio</th>
                <th className="px-6 py-4 text-center">Disponibilidad</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-lg overflow-hidden border border-gray-200">
                         {product.image ? <img src={product.image} className="w-full h-full object-cover" alt={product.name} /> : product.name.substring(0,2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${product.category === 'Sabores' ? 'bg-pink-50 text-pink-700' : 
                        product.category === 'Toppings' ? 'bg-green-50 text-green-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCOP(product.price)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.available ? 'bg-primary-500' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.available ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-primary-600">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDeleteProduct && onDeleteProduct(product.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No se encontraron productos en esta categoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};