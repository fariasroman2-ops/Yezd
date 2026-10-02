import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Edit3, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  DollarSign,
  Layers, 
  ChevronDown, 
  Building2,
  Building
} from 'lucide-react';
import { Position, CurrencySettings, AssetCategory } from '../types/portfolio';
import { formatMoney, formatPercent } from '../utils/calculations';

interface HoldingsTableProps {
  positions: Position[];
  currencySettings: CurrencySettings;
  onQuickTrade: (ticker: string, type: 'BUY' | 'SELL') => void;
  onEditPrice: (ticker: string, currentPrice: number) => void;
  onFilterHistoryByTicker: (ticker: string) => void;
  onOpenFciExplorer?: () => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  positions,
  currencySettings,
  onQuickTrade,
  onEditPrice,
  onFilterHistoryByTicker,
  onOpenFciExplorer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'ticker' | 'allocation'>('value');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Distinct brokers
  const allBrokers = Array.from(new Set(
    positions.flatMap(p => p.brokers || [])
  )).filter(Boolean);

  // Filter positions
  const filtered = positions
    .filter(p => p.quantity > 0)
    .filter(p => {
      const matchesSearch = 
        p.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brokers && p.brokers.some(b => b.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'TODAS' || p.assetCategory === selectedCategory;
      const matchesBroker = selectedBroker === 'ALL' || (p.brokers && p.brokers.includes(selectedBroker));

      return matchesSearch && matchesCategory && matchesBroker;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'value') comp = b.currentValue - a.currentValue;
      else if (sortBy === 'pnl') comp = b.unrealizedPnLPercent - a.unrealizedPnLPercent;
      else if (sortBy === 'allocation') comp = b.allocationPercent - a.allocationPercent;
      else if (sortBy === 'ticker') comp = a.ticker.localeCompare(b.ticker);

      return sortOrder === 'desc' ? comp : -comp;
    });

  const categories = ['TODAS', 'Acciones / CEDEAR', 'Bonos / ON', 'ETFs / Fondos', 'Criptomonedas'];

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Acciones / CEDEAR':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'Bonos / ON':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'ETFs / Fondos':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Criptomonedas':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'Commodities':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
      case 'Liquidez / Cash':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6 transition-colors">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF17C1]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
              Posiciones en Cartera
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({filtered.length} {filtered.length === 1 ? 'activo' : 'activos'})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Precios promedio calculados a partir de tus boletos y cotización en tiempo real
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ticker o nombre..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl text-xs text-slate-800 dark:text-[#F2F0F3] placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Broker filter selector */}
          <select
            value={selectedBroker}
            onChange={(e) => setSelectedBroker(e.target.value)}
            className="bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Brokers</option>
            {allBrokers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="value">Mayor Valuación</option>
            <option value="pnl">Mayor Rendimiento (%)</option>
            <option value="allocation">Mayor Ponderación (%)</option>
            <option value="ticker">Alfabético Ticker</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-[#15141A] dark:text-slate-400 dark:hover:text-[#F2F0F3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {onOpenFciExplorer && (
          <button
            onClick={onOpenFciExplorer}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-all shrink-0 cursor-pointer"
            title="Explorar precios de Fondos Comunes y Bonos Argentinos (CAFCI / CNV / ArgentinaDatos)"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Explorar Fondos & Bonos CAFCI</span>
          </button>
        )}
      </div>

      {/* Responsive Holdings Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#22121C] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-[#08070A]/60">
                <th className="py-3 px-3">Activo</th>
                <th className="py-3 px-3 text-right">Cantidad</th>
                <th className="py-3 px-3 text-right">PPC (Compra)</th>
                <th className="py-3 px-3 text-right">Cotización</th>
                <th className="py-3 px-3 text-right">Inversión</th>
                <th className="py-3 px-3 text-right">Valor Actual</th>
                <th className="py-3 px-3 text-right">Rendimiento</th>
                <th className="py-3 px-3 text-right">Pond.</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1C1018] text-xs">
              {filtered.map((pos) => {
                const isProfitable = pos.unrealizedPnL >= 0;

                return (
                  <tr key={pos.ticker} className="hover:bg-slate-50 dark:hover:bg-[#14121A] transition-colors group">
                    
                    {/* Ticker & Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] flex items-center justify-center font-bold font-mono text-slate-900 dark:text-[#F2F0F3] text-xs shrink-0">
                          {pos.ticker.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-[#F2F0F3] font-mono">{pos.ticker}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${getCategoryBadgeStyle(pos.assetCategory)}`}>
                              {pos.assetCategory}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[180px] sm:max-w-[220px] truncate" title={pos.assetName}>
                            {pos.assetName}
                          </p>

                          {/* Brokers badges */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {pos.brokerShares && pos.brokerShares.length > 0 ? (
                              pos.brokerShares.map(bs => (
                                <span
                                  key={bs.broker}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#08070A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#22121C] font-mono"
                                  title={`${bs.quantity} en ${bs.broker}`}
                                >
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{bs.broker}:</span>
                                  <span>{bs.quantity < 1 ? bs.quantity.toFixed(3) : bs.quantity}</span>
                                </span>
                              ))
                            ) : (
                              pos.brokers?.map(b => (
                                <span key={b} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#08070A] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#22121C] font-mono">
                                  {b}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                      {pos.quantity < 1 ? pos.quantity.toFixed(4) : pos.quantity.toLocaleString('es-AR')}
                    </td>

                    {/* PPC */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {formatMoney(pos.averageBuyPrice ?? pos.avgBuyPrice ?? 0, pos.currency)}
                    </td>

                    {/* Current Market Price with Edit button */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1 group/price">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatMoney(pos.currentPrice, pos.currency)}
                        </span>
                        <button
                          onClick={() => onEditPrice(pos.ticker, pos.currentPrice)}
                          className="opacity-0 group-hover/price:opacity-100 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-opacity p-0.5 cursor-pointer"
                          title="Actualizar cotización"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Total Invested */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {formatMoney(pos.totalInvested, pos.currency)}
                    </td>

                    {/* Current Value */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(pos.currentValue, pos.currency)}
                    </td>

                    {/* Unrealized PnL */}
                    <td className="py-3.5 px-3 text-right">
                      <div className={`font-mono font-bold tabular-nums flex items-center justify-end gap-1 ${
                        isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{formatPercent(pos.unrealizedPnLPercent)}</span>
                      </div>
                      <div className={`text-[11px] font-mono tabular-nums ${
                        isProfitable ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'
                      }`}>
                        {isProfitable ? '+' : ''}{formatMoney(pos.unrealizedPnL, pos.currency)}
                      </div>
                    </td>

                    {/* Allocation Percent */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {pos.allocationPercent.toFixed(1)}%
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onQuickTrade(pos.ticker, 'BUY')}
                          className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                          title={`Comprar más ${pos.ticker}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onQuickTrade(pos.ticker, 'SELL')}
                          className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                          title={`Vender ${pos.ticker}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onFilterHistoryByTicker(pos.ticker)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title={`Ver historial de boletos de ${pos.ticker}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">
          <p className="text-sm font-medium">No se encontraron posiciones con los filtros seleccionados.</p>
        </div>
      )}

    </div>
  );
};
