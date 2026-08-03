import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, ArrowRight, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { Product } from '../../types/inventory';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product, action: 'view' | 'stock-in' | 'stock-out') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredProducts = products.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.product_name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.product_code.toLowerCase().includes(q) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
      p.batch_number.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          onSelectProduct(filteredProducts[selectedIndex], 'view');
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredProducts, selectedIndex, onClose, onSelectProduct]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-xl shadow-modal border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in duration-150">
        
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a product name, SKU, batch number (e.g. BT2601), or barcode..."
            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-0"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No medical products match your query "{query}"
            </div>
          ) : (
            filteredProducts.map((product, idx) => {
              const isSelected = idx === selectedIndex;
              const stock = product.current_stock ?? 0;
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product, 'view');
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors duration-100 flex items-center justify-between gap-4 ${
                    isSelected ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">{product.product_name}</span>
                        <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {product.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate">
                        <span>Generic: {product.generic_name || 'N/A'}</span>
                        <span>•</span>
                        <span>Batch: <strong className="font-mono text-slate-700">{product.batch_number}</strong></span>
                        <span>•</span>
                        <span>Exp: {product.expiry_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Stock Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {stock} <span className="font-normal text-slate-500 text-[11px]">{product.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">${product.selling_price.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product, 'stock-in');
                        onClose();
                      }}
                      title="Quick Stock In"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product, 'stock-out');
                        onClose();
                      }}
                      title="Quick Stock Out"
                      className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-white border rounded px-1 font-semibold">↑</kbd> <kbd className="bg-white border rounded px-1 font-semibold">↓</kbd> navigate</span>
            <span><kbd className="bg-white border rounded px-1 font-semibold">Enter</kbd> select</span>
            <span><kbd className="bg-white border rounded px-1 font-semibold">Esc</kbd> close</span>
          </div>
          <span>{filteredProducts.length} items found</span>
        </div>

      </div>
    </div>
  );
};
