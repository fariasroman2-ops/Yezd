import React, { useState } from 'react';
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ExternalLink,
  ShieldCheck,
  PieChart
} from 'lucide-react';
import { BrokerAllocation, CurrencySettings } from '../types/portfolio';
import { formatMoney, formatPercent } from '../utils/calculations';

interface BrokerDistributionProps {
  brokerAllocations: BrokerAllocation[];
  currencySettings: CurrencySettings;
  onFilterHistoryByBroker: (broker: string) => void;
}

export const BrokerDistribution: React.FC<BrokerDistributionProps> = ({
  brokerAllocations,
  currencySettings,
  onFilterHistoryByBroker,
}) => {
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const isUSD = currencySettings.displayCurrency === 'USD';

  const toggleExpand = (broker: string) => {
    setExpandedBroker(prev => prev === broker ? null : broker);
  };

  const brokerColors: Record<string, { bar: string; dot: string; text: string }> = {
    // Balanz: Azul oficial
    'Balanz': { bar: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
    'Balanz Capital': { bar: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
    // IOL (InvertirOnline): Violeta oficial
    'InvertirOnline (IOL)': { bar: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
    'InvertirOnline': { bar: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
    'IOL': { bar: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
    // Binance: Amarillo oficial
    'Binance': { bar: 'bg-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
    // Interactive Brokers: Rojo oficial
    'Interactive Brokers': { bar: 'bg-red-600', dot: 'bg-red-600', text: 'text-red-600 dark:text-red-400' },
    'IBKR': { bar: 'bg-red-600', dot: 'bg-red-600', text: 'text-red-600 dark:text-red-400' },
    // Cocos Capital: Violeta neón brillante (diferenciado de IOL)
    'Cocos Capital': { bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-500 dark:text-violet-400' },
    'Cocos': { bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-500 dark:text-violet-400' },
    // Bull Market Brokers: Naranja brillante
    'Bull Market': { bar: 'bg-orange-500', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
    'Bull Market Brokers': { bar: 'bg-orange-500', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
    // PPI: Verde esmeralda menta
    'PPI': { bar: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
    'Portfolio Personal Inversiones': { bar: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
    'Portfolio Personal': { bar: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
    // Eco Valores: Celeste / Cyan (diferenciado del azul de Balanz)
    'Eco Valores': { bar: 'bg-sky-500', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
    // Allaria: Azul Marino Noche
    'Allaria': { bar: 'bg-slate-800 dark:bg-blue-900', dot: 'bg-slate-800 dark:bg-blue-900', text: 'text-slate-800 dark:text-blue-300' },
    'Allaria Ledesma': { bar: 'bg-slate-800 dark:bg-blue-900', dot: 'bg-slate-800 dark:bg-blue-900', text: 'text-slate-800 dark:text-blue-300' },
    // SBS Trading: Añil / Índigo
    'SBS Trading': { bar: 'bg-indigo-600', dot: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' },
    'SBS': { bar: 'bg-indigo-600', dot: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' },
    // Lemon Cash: Verde lima neón
    'Lemon Cash': { bar: 'bg-lime-500', dot: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' },
    'Lemon': { bar: 'bg-lime-500', dot: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' },
    // Buenbit: Turquesa
    'Buenbit': { bar: 'bg-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
    // Ripio: Fucsia
    'Ripio': { bar: 'bg-fuchsia-600', dot: 'bg-fuchsia-600', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
    // Santander: Rojo carmesí oscuro (diferenciado del rojo vivo de IBKR)
    'Santander': { bar: 'bg-red-800', dot: 'bg-red-800', text: 'text-red-700 dark:text-red-400' },
    'Santander Río': { bar: 'bg-red-800', dot: 'bg-red-800', text: 'text-red-700 dark:text-red-400' },
    // Galicia: Naranja terracota (diferenciado del naranja vivo de Bull Market)
    'Galicia': { bar: 'bg-orange-700', dot: 'bg-orange-700', text: 'text-orange-700 dark:text-orange-400' },
    'Banco Galicia': { bar: 'bg-orange-700', dot: 'bg-orange-700', text: 'text-orange-700 dark:text-orange-400' },
    // BBVA: Azul cobalto profundo (diferenciado de Balanz)
    'BBVA': { bar: 'bg-blue-800', dot: 'bg-blue-800', text: 'text-blue-800 dark:text-blue-300' },
    'Banco Macro': { bar: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-500 dark:text-blue-400' },
    'Macro': { bar: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-500 dark:text-blue-400' },
    'Ualá': { bar: 'bg-rose-600', dot: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' },
    'Belo': { bar: 'bg-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-500 dark:text-indigo-400' },
  };

  const dynamicPalette = [
    { bar: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
    { bar: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' },
    { bar: 'bg-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
    { bar: 'bg-red-600', dot: 'bg-red-600', text: 'text-red-600 dark:text-red-400' },
    { bar: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
    { bar: 'bg-orange-500', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
    { bar: 'bg-sky-500', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
    { bar: 'bg-lime-500', dot: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' },
    { bar: 'bg-indigo-600', dot: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' },
    { bar: 'bg-teal-600', dot: 'bg-teal-600', text: 'text-teal-600 dark:text-teal-400' },
    { bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-500 dark:text-violet-400' },
    { bar: 'bg-rose-600', dot: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' },
    { bar: 'bg-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
    { bar: 'bg-amber-600', dot: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400' },
    { bar: 'bg-fuchsia-600', dot: 'bg-fuchsia-600', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
    { bar: 'bg-blue-800', dot: 'bg-blue-800', text: 'text-blue-800 dark:text-blue-300' },
  ];

  const getColor = (broker: string) => {
    if (brokerColors[broker]) return brokerColors[broker];
    let hash = 0;
    for (let i = 0; i < broker.length; i++) {
      hash = broker.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % dynamicPalette.length;
    return dynamicPalette[idx];
  };

  if (brokerAllocations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#FF17C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
              Distribución por Broker / ALyC
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de cuentas y plataformas donde están custodiados tus activos
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {brokerAllocations.length} {brokerAllocations.length === 1 ? 'entidad' : 'entidades'}
        </span>
      </div>

      {/* Multi-segment allocation bar */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 dark:bg-[#08070A] rounded-full overflow-hidden flex border border-transparent dark:border-[#1E111A]">
          {brokerAllocations.map(b => {
            const col = getColor(b.broker);
            return (
              <div
                key={b.broker}
                style={{ width: `${b.allocationPercent}%` }}
                className={`${col.bar} h-full transition-all duration-300 hover:opacity-85 cursor-pointer first:rounded-l-full last:rounded-r-full`}
                title={`${b.broker}: ${b.allocationPercent.toFixed(1)}%`}
                onClick={() => toggleExpand(b.broker)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs">
          {brokerAllocations.map(b => {
            const col = getColor(b.broker);
            const isExpanded = expandedBroker === b.broker;
            return (
              <button
                key={b.broker}
                onClick={() => toggleExpand(b.broker)}
                className={`flex items-center gap-2 transition-opacity cursor-pointer ${
                  isExpanded ? 'opacity-100 font-bold' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{b.broker}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                  {b.allocationPercent.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid for Each Broker */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {brokerAllocations.map(b => {
          const col = getColor(b.broker);
          const isExpanded = expandedBroker === b.broker;
          const val = isUSD ? b.totalValueUSD : b.totalValueARS;
          const inv = isUSD ? b.totalInvestedUSD : b.totalInvestedARS;
          const pnl = isUSD ? b.unrealizedPnLUSD : b.unrealizedPnLARS;
          const isPos = pnl >= 0;

          return (
            <div
              key={b.broker}
              className={`rounded-2xl p-4 border transition-all ${
                isExpanded 
                  ? 'border-blue-500/50 dark:border-blue-500/40 bg-slate-50 dark:bg-[#14121A] shadow-sm' 
                  : 'border-slate-200 dark:border-[#22121C] bg-slate-50/50 dark:bg-[#08070A] hover:border-slate-300 dark:hover:border-[#2E1624]'
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F2F0F3] truncate max-w-[140px]">
                    {b.broker}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {b.allocationPercent.toFixed(1)}%
                </span>
              </div>

              {/* Value and PnL */}
              <div className="space-y-1">
                <div className="text-base font-extrabold font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                  {formatMoney(val, currencySettings.displayCurrency)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">P&L no realizado</span>
                  <span className={`font-mono font-bold tabular-nums ${
                    isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isPos ? '+' : ''}{formatMoney(pnl, currencySettings.displayCurrency)} ({formatPercent(b.pnlPercent)})
                  </span>
                </div>
              </div>

              {/* Expand Toggle */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-[#22121C] flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleExpand(b.broker)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F2F0F3] flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>{(b.assets || []).length} {(b.assets || []).length === 1 ? 'activo' : 'activos'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onFilterHistoryByBroker(b.broker)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  title={`Filtrar historial de operaciones para ${b.broker}`}
                >
                  <span>Operaciones</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Expanded Holdings Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-[#22121C] space-y-2 animate-fadeIn text-xs">
                  {(b.assets || []).map(h => (
                    <div key={h.ticker} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1E111A] last:border-0">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-[#F2F0F3]">{h.ticker}</span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-mono">x{h.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium text-slate-700 dark:text-[#F2F0F3] tabular-nums">
                          {formatMoney(h.value, currencySettings.displayCurrency)}
                        </div>
                        <div className={`text-[10px] font-mono tabular-nums ${
                          h.pnlPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {formatPercent(h.pnlPercent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
