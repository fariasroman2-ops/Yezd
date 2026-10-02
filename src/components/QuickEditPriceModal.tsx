import React, { useState } from 'react';
import { X, RefreshCw, Check, Sparkles, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Position, CurrencySettings } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';

interface QuickEditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  marketPrices: Record<string, number>;
  onSavePrices: (updatedPrices: Record<string, number>) => void;
  initialTicker?: string;
}

export const QuickEditPriceModal: React.FC<QuickEditPriceModalProps> = ({
  isOpen,
  onClose,
  positions,
  marketPrices,
  onSavePrices,
  initialTicker,
}) => {
  // Local state for prices
  const [localPrices, setLocalPrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = { ...marketPrices };
    positions.forEach(p => {
      if (map[p.ticker] === undefined) {
        map[p.ticker] = p.currentPrice;
      }
    });
    return map;
  });

  const handlePriceChange = (ticker: string, value: number) => {
    setLocalPrices(prev => ({
      ...prev,
      [ticker]: value,
    }));
  };

  // Simulate market refresh
  const handleSimulateMarketTick = () => {
    setLocalPrices(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(ticker => {
        const delta = (Math.random() * 0.04) - 0.018;
        next[ticker] = Math.max(0.01, +(next[ticker] * (1 + delta)).toFixed(2));
      });
      return next;
    });
  };

  const handleSave = () => {
    onSavePrices(localPrices);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2DEE5] dark:border-[#22121C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Actualizar Cotizaciones</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Edita los precios de mercado actuales de tus activos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tools */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#08070A]/50 border-b border-[#E2DEE5] dark:border-[#22121C] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Ajusta los precios manualmente o prueba el simulador:</span>
          <button
            onClick={handleSimulateMarketTick}
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
            title="Simular variación aleatoria de mercado"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Simular Mercado</span>
          </button>
        </div>

        {/* Prices List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {positions.length > 0 ? (
            positions.map(p => {
              const currentVal = localPrices[p.ticker] !== undefined ? localPrices[p.ticker] : p.currentPrice;
              const ppc = p.averageBuyPrice ?? p.avgBuyPrice ?? 0;
              const pnlChange = currentVal - ppc;
              const isProfit = pnlChange >= 0;

              return (
                <div
                  key={p.ticker}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    initialTicker === p.ticker
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/40'
                      : 'bg-slate-50 dark:bg-[#08070A] border-slate-200 dark:border-[#281422]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-[#F2F0F3] font-mono text-sm">{p.ticker}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#15141A] text-slate-600 dark:text-slate-400">
                        {p.assetCategory}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                      <span>PPC: {formatMoney(ppc, p.currency)}</span>
                      <span className={`font-semibold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        ({isProfit ? '+' : ''}{((pnlChange / (ppc || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">{p.currency}</span>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={currentVal}
                      onChange={(e) => handlePriceChange(p.ticker, parseFloat(e.target.value) || 0)}
                      className="w-28 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-1.5 text-right font-mono font-bold text-slate-900 dark:text-[#F2F0F3] text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay posiciones activas en la cartera seleccionada.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E2DEE5] dark:border-[#22121C] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Guardar Precios</span>
          </button>
        </div>

      </div>
    </div>
  );
};
