import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Building, Tag, Check, Sparkles, Wallet } from 'lucide-react';
import { OperationType, AssetCategory, Currency, Transaction, Portfolio } from '../types/portfolio';

interface ManualTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialTicker?: string;
  initialType?: OperationType;
  portfolios?: Portfolio[];
  activePortfolioId?: string;
}

export const ManualTradeModal: React.FC<ManualTradeModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  initialTicker = '',
  initialType = 'BUY',
  portfolios = [],
  activePortfolioId = 'default',
}) => {
  const initialPId = (activePortfolioId !== 'all' && activePortfolioId) ? activePortfolioId : (portfolios[0]?.id || 'default');

  const [operationType, setOperationType] = useState<OperationType>(initialType);
  const [ticker, setTicker] = useState(initialTicker);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Acciones / CEDEAR');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [price, setPrice] = useState<number | ''>(100);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [fees, setFees] = useState<number | ''>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [broker, setBroker] = useState<string>('Balanz');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(initialPId);

  const numQty = typeof quantity === 'number' ? quantity : 0;
  const numPrice = typeof price === 'number' ? price : 0;
  const numFees = typeof fees === 'number' ? fees : 0;
  const computedTotal = (numQty * numPrice) + (operationType === 'BUY' ? numFees : -numFees);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    onAddTransaction({
      portfolioId: selectedPortfolioId,
      date,
      operationType,
      ticker: ticker.toUpperCase().trim(),
      assetName: assetName.trim() || ticker.toUpperCase().trim(),
      assetCategory,
      quantity: numQty,
      price: numPrice,
      currency,
      fees: numFees,
      commission: numFees,
      totalAmount: computedTotal,
      broker: broker.trim() || 'Principal',
      ticketNumber: ticketNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E2DEE5] dark:border-[#22121C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Anotar Operación Manual</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registra una compra, venta o dividendo sin comprobante</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Portfolio Destination Selector */}
          {portfolios.length > 0 && (
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Cartera de Destino:</span>
              </label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            
            {/* Tipo */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Tipo de Operación</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="BUY">🟢 COMPRA (Buy)</option>
                <option value="SELL">🔴 VENTA (Sell)</option>
                <option value="DIVIDEND">🟡 DIVIDENDO / RENTA</option>
              </select>
            </div>

            {/* Ticker */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Ticker / Símbolo</label>
              <input
                type="text"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL, SPY, AL30..."
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Nombre Especie */}
            <div className="col-span-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Nombre del Activo (opcional)</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Apple Inc, Bonos República Argentina..."
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Categoría</label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="Acciones / CEDEAR">Acciones / CEDEAR</option>
                <option value="Bonos / ON">Bonos / ON</option>
                <option value="ETFs / Fondos">ETFs / Fondos</option>
                <option value="Criptomonedas">Criptomonedas</option>
                <option value="Commodities">Commodities</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Moneda */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="USD">USD (Dólares)</option>
                <option value="ARS">ARS (Pesos)</option>
                <option value="EUR">EUR (Euros)</option>
                <option value="USDT">USDT (Cripto)</option>
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Cantidad</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Precio Unitario */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Precio Unitario ({currency})</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Comisiones */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Comisión / Impuesto</label>
              <input
                type="number"
                step="any"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Broker */}
            <div className="col-span-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">Broker / ALyC</label>
              <input
                type="text"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="Balanz, IOL, Cocos, Bull Market, Binance..."
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

          </div>

          {/* Computed total preview */}
          <div className="p-3 bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Monto Total Estimado:</span>
            <span className="text-sm font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {currency} {computedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Operación</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
