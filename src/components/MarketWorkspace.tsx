import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Building2, 
  DollarSign, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Coins
} from 'lucide-react';
import { LiveFxData, RealtimeQuote } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';

interface CafciFund {
  ticker: string;
  name: string;
  category: string;
  currency: 'ARS' | 'USD';
  price: number;
  change24hPercent?: number;
  administrator?: string;
  source: 'CAFCI' | 'CNV' | 'ARGENTINADATOS';
  lastUpdated?: string;
}

interface MarketWorkspaceProps {
  liveFxData: LiveFxData | null;
  realtimeQuotes: Record<string, RealtimeQuote>;
  isLiveLoading: boolean;
  onRefreshLivePrices: () => void;
  onSelectAssetToTrade: (asset: { ticker: string; name: string; price: number; currency: 'ARS' | 'USD' }) => void;
  onUpdateHoldingPrice?: (ticker: string, price: number) => void;
  userTickers?: string[];
}

export const MarketWorkspace: React.FC<MarketWorkspaceProps> = ({
  liveFxData,
  realtimeQuotes,
  isLiveLoading,
  onRefreshLivePrices,
  onSelectAssetToTrade,
  onUpdateHoldingPrice,
  userTickers = [],
}) => {
  const [funds, setFunds] = useState<CafciFund[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MONEY_MARKET' | 'BONOS' | 'CEDEARS' | 'CRIPTO'>('ALL');
  const [appliedTickers, setAppliedTickers] = useState<Record<string, boolean>>({});

  // Fetch live Argentine funds & bonds from ArgentinaDatos API
  useEffect(() => {
    let isMounted = true;
    const loadMarketAssets = async () => {
      setLoadingFunds(true);
      try {
        const res = await fetch('/api/cafci/funds');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.funds) {
            setFunds(data.funds);
          }
        }
      } catch (e) {
        console.warn('Failed to load CAFCI funds:', e);
      } finally {
        if (isMounted) setLoadingFunds(false);
      }
    };

    loadMarketAssets();
    return () => { isMounted = false; };
  }, []);

  const handleApplyPrice = (asset: CafciFund) => {
    if (onUpdateHoldingPrice) {
      onUpdateHoldingPrice(asset.ticker, asset.price);
      setAppliedTickers(prev => ({ ...prev, [asset.ticker]: true }));
      setTimeout(() => {
        setAppliedTickers(prev => ({ ...prev, [asset.ticker]: false }));
      }, 2500);
    }
  };

  const filteredFunds = funds.filter(f => {
    const matchesSearch = 
      f.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.administrator && f.administrator.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'MONEY_MARKET') {
      return f.category.toLowerCase().includes('money') || f.category.toLowerCase().includes('liquidez');
    }
    if (selectedFilter === 'BONOS') {
      return f.source === 'CNV' || f.category.toLowerCase().includes('renta fija') || f.category.toLowerCase().includes('bono');
    }
    if (selectedFilter === 'CEDEARS') {
      return f.category.toLowerCase().includes('cedear') || f.category.toLowerCase().includes('variable');
    }
    if (selectedFilter === 'CRIPTO') {
      return f.category.toLowerCase().includes('cripto');
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-[#0E0D12] dark:to-[#08070A] border border-[#E2DEE5] dark:border-[#22121C] shadow-sm relative overflow-hidden transition-colors">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF17C1]/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Mercado Argentino & Cotizaciones en Vivo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2F0F3] tracking-tight">
              Dólar, Fondos CAFCI & Bonos CNV
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Cotizaciones actualizadas de Dólar MEP, CCL, Blue y precios oficiales de cuotapartes de Fondos Comunes de Inversión y Bonos Soberanos.
            </p>
          </div>

          <button
            onClick={onRefreshLivePrices}
            disabled={isLiveLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-800 dark:text-[#F2F0F3] font-semibold text-xs border border-slate-200 dark:border-[#281422] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-500 dark:text-blue-400 ${isLiveLoading ? 'animate-spin' : ''}`} />
            <span>{isLiveLoading ? 'Actualizando...' : 'Actualizar Cotizaciones'}</span>
          </button>
        </div>
      </div>

      {/* Dólar Rates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* MEP */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">Dólar MEP</span>
            <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400">Bolsa</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            ${liveFxData ? liveFxData.dolarMep.toLocaleString('es-AR') : '1.548'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Para liquidación de bonos y CEDEARs
          </p>
        </div>

        {/* CCL */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">Dólar CCL</span>
            <span className="text-[10px] font-mono text-cyan-500 dark:text-cyan-400">Cable</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            ${liveFxData ? liveFxData.dolarCcl.toLocaleString('es-AR') : '1.580'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Contado con Liquidación exterior
          </p>
        </div>

        {/* Cripto */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">Dólar Cripto</span>
            <span className="text-[10px] font-mono text-emerald-500">USDT / USDC</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            ${liveFxData?.dolarCripto ? liveFxData.dolarCripto.toLocaleString('es-AR') : '1.560'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Mercado 24/7 sin parking
          </p>
        </div>

        {/* Blue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">Dólar Blue</span>
            <span className="text-[10px] font-mono text-amber-500">Informal</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            ${liveFxData ? liveFxData.dolarBlue.toLocaleString('es-AR') : '1.510'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Cotización promedio en plazas
          </p>
        </div>

        {/* Oficial */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">Dólar Oficial</span>
            <span className="text-[10px] font-mono text-slate-500">BNA</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            ${liveFxData ? liveFxData.dolarOficial.toLocaleString('es-AR') : '1.340'}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Mayorista / Minorista Banco Nación
          </p>
        </div>
      </div>

      {/* Fondos CAFCI & Bonos CNV Explorer */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] shadow-sm space-y-4 transition-colors">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar fondo o bono (ej: Fima, Balanz, AL30, GD30)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl text-xs text-slate-800 dark:text-[#F2F0F3] placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {(['ALL', 'MONEY_MARKET', 'BONOS', 'CEDEARS', 'CRIPTO'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-[#15141A] dark:text-slate-400 dark:hover:text-[#F2F0F3]'
                }`}
              >
                {filter === 'ALL' && 'Todos'}
                {filter === 'MONEY_MARKET' && 'Money Market (T+0)'}
                {filter === 'BONOS' && 'Bonos Soberanos'}
                {filter === 'CEDEARS' && 'CEDEARs'}
                {filter === 'CRIPTO' && 'Cripto'}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Market Assets */}
        {loadingFunds ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-xs">Cargando cotizaciones de ArgentinaDatos y CAFCI...</span>
          </div>
        ) : filteredFunds.length > 0 ? (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#22121C] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-[#08070A]/60">
                  <th className="py-3 px-3">Activo / Fondo</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Administradora / Emisor</th>
                  <th className="py-3 px-3 text-right">Cotización / VCP</th>
                  <th className="py-3 px-3 text-right">Variación</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1C1018]">
                {filteredFunds.map(fund => {
                  const isUserHolding = userTickers.includes(fund.ticker.toUpperCase());
                  const isApplied = appliedTickers[fund.ticker];

                  return (
                    <tr key={fund.ticker} className="hover:bg-slate-50 dark:hover:bg-[#15141A] transition-colors">
                      
                      {/* Name & Ticker */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900 dark:text-[#F2F0F3]">
                            {fund.ticker}
                          </span>
                          {isUserHolding && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                              En cartera
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={fund.name}>
                          {fund.name}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {fund.category}
                      </td>

                      {/* Administrator */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {fund.administrator || 'Mercado'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                        {formatMoney(fund.price, fund.currency)}
                      </td>

                      {/* 24h change */}
                      <td className="py-3 px-3 text-right">
                        {fund.change24hPercent !== undefined ? (
                          <span className={`font-mono font-bold tabular-nums ${
                            fund.change24hPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {fund.change24hPercent >= 0 ? '+' : ''}{fund.change24hPercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUserHolding && onUpdateHoldingPrice && (
                            <button
                              onClick={() => handleApplyPrice(fund)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-[#281422]"
                              title="Actualizar precio de esta tenencia en tu cartera"
                            >
                              {isApplied ? <Check className="w-3 h-3 text-emerald-500" /> : <RefreshCw className="w-3 h-3" />}
                              <span>{isApplied ? 'Actualizado' : 'Actualizar'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectAssetToTrade({
                              ticker: fund.ticker,
                              name: fund.name,
                              price: fund.price,
                              currency: fund.currency,
                            })}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer flex items-center gap-1 border border-blue-200/50 dark:border-blue-800/30"
                            title="Cargar una operación con este activo"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Cargar</span>
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
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No se encontraron activos para los filtros actuales.</p>
          </div>
        )}

      </div>

    </div>
  );
};
