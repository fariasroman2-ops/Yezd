import React, { useState } from 'react';
import { X, DollarSign, Check } from 'lucide-react';
import { CurrencySettings } from '../types/portfolio';

interface FxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySettings: CurrencySettings;
  onSaveCurrencySettings: (settings: CurrencySettings) => void;
}

export const FxRateModal: React.FC<FxRateModalProps> = ({
  isOpen,
  onClose,
  currencySettings,
  onSaveCurrencySettings,
}) => {
  const [rate, setRate] = useState<number>(currencySettings.fxRateUSDToARS);
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'ARS'>(currencySettings.displayCurrency);

  const presets = [
    { label: 'Dólar MEP (~$1.548)', value: 1548 },
    { label: 'Dólar CCL (~$1.580)', value: 1580 },
    { label: 'Dólar Blue (~$1.510)', value: 1510 },
    { label: 'Dólar Oficial (~$1.340)', value: 1340 },
  ];

  const handleSave = () => {
    onSaveCurrencySettings({
      displayCurrency,
      fxRateUSDToARS: rate > 0 ? rate : 1548,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2DEE5] dark:border-[#22121C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Moneda y Tipo de Cambio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configura la cotización para convertir entre USD y ARS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Display currency toggle */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1.5 block">
              Moneda Principal de Visualización
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDisplayCurrency('USD')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  displayCurrency === 'USD'
                    ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/25'
                    : 'bg-slate-50 dark:bg-[#08070A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#281422]'
                }`}
              >
                <span>USD (Dólares)</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayCurrency('ARS')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  displayCurrency === 'ARS'
                    ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/25'
                    : 'bg-slate-50 dark:bg-[#08070A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#281422]'
                }`}
              >
                <span>ARS (Pesos)</span>
              </button>
            </div>
          </div>

          {/* Rate Input */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
              Tipo de Cambio Personalizado (1 USD en ARS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
              <input
                type="number"
                step="any"
                min="1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-[#F2F0F3] font-mono font-bold text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Valores de Referencia Rápidos:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRate(p.value)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#08070A] hover:bg-slate-100 dark:hover:bg-[#15141A] border border-slate-200 dark:border-[#281422] text-slate-700 dark:text-slate-300 text-left transition-colors cursor-pointer text-[11px]"
                >
                  <span className="font-semibold block">{p.label}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">${p.value}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
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
            <span>Aplicar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
