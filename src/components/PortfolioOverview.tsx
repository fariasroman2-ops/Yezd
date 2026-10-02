import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  PieChart, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  SlidersHorizontal,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';
import { PortfolioSummary, Position, CurrencySettings, AssetCategory } from '../types/portfolio';
import { formatMoney, formatPercent } from '../utils/calculations';

interface PortfolioOverviewProps {
  summary: PortfolioSummary;
  positions: Position[];
  currencySettings: CurrencySettings;
  onEditFxRate: () => void;
  onGoToScanner: () => void;
  onOpenManualTrade?: () => void;
  onOpenPriceModal?: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  summary,
  positions,
  currencySettings,
  onEditFxRate,
  onGoToScanner,
  onOpenManualTrade,
  onOpenPriceModal,
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const isUSD = currencySettings.displayCurrency === 'USD';
  
  const totalVal = isUSD ? summary.totalValuationUSD : summary.totalValuationARS;
  const totalInv = isUSD ? summary.totalInvestedUSD : summary.totalInvestedARS;
  const unrealizedPnL = isUSD ? summary.totalUnrealizedPnLUSD : summary.totalUnrealizedPnLARS;
  const realizedPnL = isUSD ? summary.totalRealizedPnLUSD : summary.totalRealizedPnLARS;
  const pnlPercent = summary.totalUnrealizedPnLPercent;
  const isPositive = unrealizedPnL >= 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  let totalActiveValue = 0;

  positions.forEach(p => {
    if (p.quantity > 0) {
      const val = isUSD 
        ? (p.currency === 'ARS' ? p.currentValue / currencySettings.fxRateUSDToARS : p.currentValue)
        : (p.currency === 'ARS' ? p.currentValue : p.currentValue * currencySettings.fxRateUSDToARS);
      
      categoryTotals[p.assetCategory] = (categoryTotals[p.assetCategory] || 0) + val;
      totalActiveValue += val;
    }
  });

  const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
    'Acciones / CEDEAR': { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    'Bonos / ON': { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    'ETFs / Fondos': { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    'Criptomonedas': { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
    'Commodities': { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
    'Liquidez / Cash': { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
    'Otro': { bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' },
  };

  return (
    <div className="space-y-6">
      
      {/* Master Hero Card with Dominant Black #0E0D12 */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-[#0E0D12] dark:to-[#08070A] border border-[#E2DEE5] dark:border-[#22121C] shadow-sm relative overflow-hidden transition-colors">
        
        {/* Ambient Brand Glow #FF17C1 (Dark only) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF17C1]/10 dark:bg-[#FF17C1]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#D9048E]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Balance & Quick Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Balance Total
              </span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#FF17C1] transition-colors"
                title={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <div 
                onClick={onEditFxRate}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors"
                title="Configurar tipo de cambio USD/ARS"
              >
                <ArrowRightLeft className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                <span>1 USD = ${currencySettings.fxRateUSDToARS}</span>
              </div>
            </div>

            {/* Prominent Large Balance */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                {hideBalance ? '••••••••' : formatMoney(totalVal, currencySettings.displayCurrency)}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400">
                {currencySettings.displayCurrency}
              </span>
              
              {/* Return Badge */}
              {!hideBalance && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isPositive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/15 border border-rose-500/25'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{formatPercent(pnlPercent)}</span>
                </div>
              )}
            </div>

            {/* Equivalent value in opposite currency */}
            {!hideBalance && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ≈ {formatMoney(isUSD ? summary.totalValuationARS : summary.totalValuationUSD, isUSD ? 'ARS' : 'USD')}
              </p>
            )}
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {onOpenManualTrade && (
              <button
                onClick={onOpenManualTrade}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF17C1] hover:bg-[#E00EB1] text-white font-bold text-xs shadow-md shadow-[#FF17C1]/25 hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Cargar Operación</span>
              </button>
            )}

            <button
              onClick={onGoToScanner}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-800 dark:text-[#F2F0F3] font-semibold text-xs border border-slate-200 dark:border-[#281422] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FF17C1]" />
              <span>Escanear Boleto</span>
            </button>

            {onOpenPriceModal && (
              <button
                onClick={onOpenPriceModal}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#281422] transition-all cursor-pointer"
                title="Editar cotizaciones"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Secondary KPI Bar inside Hero */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-[#1E111A] grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* KPI 1: Invertido */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Capital Invertido
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-[#F2F0F3] tabular-nums">
              {hideBalance ? '••••••' : formatMoney(totalInv, currencySettings.displayCurrency)}
            </span>
          </div>

          {/* KPI 2: Ganancia No Realizada */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Rendimiento Cartera
            </span>
            <span className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {hideBalance ? '••••••' : `${isPositive ? '+' : ''}${formatMoney(unrealizedPnL, currencySettings.displayCurrency)}`}
            </span>
          </div>

          {/* KPI 3: Ganancia Realizada (Ventas cerradas) */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Ganancia Realizada
            </span>
            <span className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
              realizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {hideBalance ? '••••••' : `${realizedPnL >= 0 ? '+' : ''}${formatMoney(realizedPnL, currencySettings.displayCurrency)}`}
            </span>
          </div>

          {/* KPI 4: Rendimiento 24h */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Variación 24h
            </span>
            <div className="flex items-center gap-1.5">
              {(() => {
                const dailyPct = summary.dailyPnLPercent ?? 0;
                const dailyUSD = summary.dailyPnLUSD ?? 0;
                const isPositiveDaily = dailyPct >= 0;
                return (
                  <>
                    <span className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                      isPositiveDaily ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {hideBalance ? '••••••' : `${isPositiveDaily ? '+' : ''}${dailyPct.toFixed(2)}%`}
                    </span>
                    {!hideBalance && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({dailyUSD >= 0 ? '+' : ''}${dailyUSD.toFixed(1)})
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

        </div>

      </div>

      {/* Asset Allocation Breakdown */}
      {totalActiveValue > 0 && (
        <div className="rounded-3xl p-5 bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] shadow-sm transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#FF17C1]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Distribución de Activos
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {positions.filter(p => p.quantity > 0).length} posiciones activas
            </span>
          </div>

          {/* Continuous Multi-segment Progress Bar */}
          <div className="h-3 w-full bg-slate-100 dark:bg-[#08070A] rounded-full overflow-hidden flex border border-transparent dark:border-[#1E111A]">
            {Object.entries(categoryTotals).map(([cat, val]) => {
              const pct = (val / totalActiveValue) * 100;
              const colorInfo = categoryColors[cat] || categoryColors['Otro'];
              return (
                <div
                  key={cat}
                  style={{ width: `${pct}%` }}
                  className={`h-full ${colorInfo.bg} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                  title={`${cat}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Clean metadata category labels */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs">
            {Object.entries(categoryTotals).map(([cat, val]) => {
              const pct = (val / totalActiveValue) * 100;
              const colorInfo = categoryColors[cat] || categoryColors['Otro'];
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colorInfo.dot} shrink-0`} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{cat}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F2F0F3] tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
