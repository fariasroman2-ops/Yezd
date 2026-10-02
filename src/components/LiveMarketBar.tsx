import React from 'react';
import { 
  Radio, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Sparkles,
  Check,
  Building2
} from 'lucide-react';
import { LiveFxData } from '../types/portfolio';

interface LiveMarketBarProps {
  isLiveLoading: boolean;
  lastUpdated: Date | null;
  onRefreshLivePrices: () => void;
  liveFxData: LiveFxData | null;
  onSyncFxRateToMep: (mepRate: number) => void;
  currentConfiguredFxRate: number;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onOpenFciExplorer?: () => void;
}

export const LiveMarketBar: React.FC<LiveMarketBarProps> = ({
  isLiveLoading,
  lastUpdated,
  onRefreshLivePrices,
  liveFxData,
  onSyncFxRateToMep,
  currentConfiguredFxRate,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onOpenFciExplorer,
}) => {
  const mepRate = liveFxData?.dolarMep;
  const isSyncedWithMep = mepRate && Math.abs(currentConfiguredFxRate - mepRate) < 0.5;

  const formatSecAgo = () => {
    if (!lastUpdated) return 'Conectando...';
    const sec = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    if (sec < 60) return `hace ${sec}s`;
    const min = Math.floor(sec / 60);
    return `hace ${min}m`;
  };

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs transition-colors">
      
      {/* Left: Status & Live Ticker */}
      <div className="flex flex-wrap items-center gap-2.5">
        
        {/* Pulse badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Dólar en Vivo</span>
        </div>

        {/* Rates Display */}
        {liveFxData ? (
          <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
            {/* MEP */}
            <div className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C]">
              <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">MEP:</span>
              <strong className="text-slate-900 dark:text-[#F2F0F3] tabular-nums">${liveFxData.dolarMep.toLocaleString('es-AR')}</strong>
            </div>

            {/* CCL */}
            <div className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C]">
              <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">CCL:</span>
              <strong className="text-slate-900 dark:text-[#F2F0F3] tabular-nums">${liveFxData.dolarCcl.toLocaleString('es-AR')}</strong>
            </div>

            {/* Cripto */}
            {liveFxData.dolarCripto && (
              <div className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C] hidden sm:block">
                <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">Cripto:</span>
                <strong className="text-slate-900 dark:text-[#F2F0F3] tabular-nums">${liveFxData.dolarCripto.toLocaleString('es-AR')}</strong>
              </div>
            )}

            {/* Blue */}
            <div className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C] hidden lg:block">
              <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">Blue:</span>
              <strong className="text-slate-900 dark:text-[#F2F0F3] tabular-nums">${liveFxData.dolarBlue.toLocaleString('es-AR')}</strong>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">Cargando tasas de cambio...</span>
        )}

      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 justify-between md:justify-end">
        
        {/* Sync with MEP Button */}
        {mepRate && !isSyncedWithMep && (
          <button
            onClick={() => onSyncFxRateToMep(mepRate)}
            className="px-2.5 py-1 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title={`Sincronizar cotización de conversión de tu cartera con MEP ($${mepRate})`}
          >
            <Sparkles className="w-3 h-3 text-blue-500 dark:text-blue-400" />
            <span>Usar MEP (${mepRate})</span>
          </button>
        )}

        {isSyncedWithMep && (
          <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>T.C. = MEP</span>
          </div>
        )}

        {/* Last update time & Manual refresh */}
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-[11px]">{formatSecAgo()}</span>
        </div>

        <button
          onClick={onRefreshLivePrices}
          disabled={isLiveLoading}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1D24] dark:hover:bg-[#26242F] text-slate-600 dark:text-[#F2F0F3] transition-colors disabled:opacity-50 cursor-pointer"
          title="Actualizar cotizaciones ahora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin text-blue-500' : ''}`} />
        </button>

      </div>

    </div>
  );
};
