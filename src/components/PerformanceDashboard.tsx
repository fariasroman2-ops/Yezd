import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  Grid3X3, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Award,
  Layers,
  Sparkles,
  PieChart,
  Percent,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { Transaction, Position, CurrencySettings } from '../types/portfolio';
import { calculatePeriodicPerformance, formatMoney, formatPercent } from '../utils/calculations';

interface PerformanceDashboardProps {
  transactions: Transaction[];
  positions: Position[];
  currencySettings: CurrencySettings;
  currentValuation: number;
  currentInvested: number;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  transactions,
  positions,
  currencySettings,
  currentValuation,
  currentInvested,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'detailed' | 'bars'>('matrix');

  const performanceData = useMemo(() => {
    return calculatePeriodicPerformance(
      transactions,
      positions,
      currencySettings,
      currentValuation,
      currentInvested
    );
  }, [transactions, positions, currencySettings, currentValuation, currentInvested]);

  const {
    yearly,
    allMonths,
    totalAllTimeGain,
    totalAllTimeReturnPercent,
    positiveMonthsCount,
    negativeMonthsCount,
    winRate,
  } = performanceData;

  const monthShorts = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Best and worst month
  const sortedByReturn = [...allMonths].sort((a, b) => b.returnPercent - a.returnPercent);
  const bestMonth = sortedByReturn[0];
  const worstMonth = sortedByReturn[sortedByReturn.length - 1];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Rendimiento Histórico Total */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Retorno Histórico
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
              {formatPercent(totalAllTimeReturnPercent)}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatMoney(totalAllTimeGain, currencySettings.displayCurrency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ganancia total acumulada sobre capital
          </p>
        </div>

        {/* Card 2: Meses en Ganancia */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Meses en Ganancia
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
              {winRate.toFixed(0)}% Win Rate
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F2F0F3] tracking-tight tabular-nums">
            {positiveMonthsCount} <span className="text-xs text-slate-500 font-normal">de {allMonths.length} meses</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {positiveMonthsCount} meses positivos · {negativeMonthsCount} meses negativos
          </p>
        </div>

        {/* Card 3: Mejor Mes */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Mejor Mes Histórico
            </span>
            {bestMonth && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                {bestMonth.monthShort} {bestMonth.year}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            {bestMonth ? formatPercent(bestMonth.returnPercent) : '0.00%'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {bestMonth ? `+${formatMoney(bestMonth.totalPnL, currencySettings.displayCurrency)} en ese mes` : 'Sin datos'}
          </p>
        </div>

        {/* Card 4: Capital Neto */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Capital Neto
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#18151D] text-slate-600 dark:text-slate-300 font-mono">
              {transactions.length} boletos
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-[#F2F0F3] tabular-nums">
            {formatMoney(currentInvested, currencySettings.displayCurrency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capital total neto ingresado en cartera
          </p>
        </div>

      </div>

      {/* Main Performance Content Container */}
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-colors">
        
        {/* Controls: Title and View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF17C1]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Rendimiento por Mes y por Año
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análisis cuantitativo de rentabilidad mensual y anual de tus inversiones
            </p>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Matriz Mensual</span>
            </button>

            <button
              onClick={() => setViewMode('detailed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Detalle</span>
            </button>

            <button
              onClick={() => setViewMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'bars'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Gráfico</span>
            </button>
          </div>
        </div>

        {/* View 1: Annual/Monthly Returns Matrix (Heatmap Table) */}
        {viewMode === 'matrix' && (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 space-y-4">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#22121C] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-left font-bold text-slate-800 dark:text-slate-200">Año</th>
                  {monthShorts.map(m => (
                    <th key={m} className="py-2.5 px-2 font-medium">{m}</th>
                  ))}
                  <th className="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-right">Total Año</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1C1018] font-mono text-xs">
                {yearly.map(y => {
                  const isYearPositive = y.returnPercent >= 0;

                  return (
                    <tr key={y.year} className="hover:bg-slate-50 dark:hover:bg-[#14121A] transition-colors">
                      <td className="py-3 px-2 text-left font-bold text-slate-900 dark:text-white">
                        {y.year}
                      </td>

                      {y.months.map(m => {
                        if (!m.hasActivity) {
                          return (
                            <td key={m.monthIndex} className="py-3 px-2 text-slate-300 dark:text-slate-600 text-[11px]">
                              -
                            </td>
                          );
                        }

                        const isPos = m.returnPercent >= 0;
                        const absVal = Math.abs(m.returnPercent);
                        
                        // Subtle heatmap styling
                        let cellBg = '';
                        if (isPos) {
                          cellBg = absVal > 5 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                        } else {
                          cellBg = absVal > 5 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
                        }

                        return (
                          <td key={m.monthIndex} className="py-2 px-1">
                            <div 
                              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold ${cellBg} transition-transform hover:scale-105`}
                              title={`${m.monthName} ${y.year}: ${formatPercent(m.returnPercent)} (${formatMoney(m.totalPnL, currencySettings.displayCurrency)})`}
                            >
                              {m.returnPercent > 0 ? '+' : ''}{m.returnPercent.toFixed(1)}%
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Year return */}
                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold text-xs ${
                          isYearPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isYearPositive ? '+' : ''}{formatPercent(y.returnPercent)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Detailed Month list */}
        {viewMode === 'detailed' && (
          <div className="space-y-3">
            {allMonths.map(m => {
              const isPos = m.totalPnL >= 0;
              return (
                <div 
                  key={`${m.year}-${m.monthIndex}`}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-[#F2F0F3] text-sm">
                      {m.monthName} {m.year}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.tradeCount} operaciones registradas
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPos ? '+' : ''}{formatMoney(m.totalPnL, currencySettings.displayCurrency)}
                    </div>
                    <div className={`font-mono text-xs font-semibold ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPos ? '+' : ''}{formatPercent(m.returnPercent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 3: Visual Bars */}
        {viewMode === 'bars' && (
          <div className="space-y-4 pt-2">
            {allMonths.map(m => {
              const isPos = m.returnPercent >= 0;
              const absVal = Math.min(Math.abs(m.returnPercent), 30);
              const barWidth = `${(absVal / 30) * 100}%`;

              return (
                <div key={`${m.year}-${m.monthIndex}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {m.monthShort} {m.year}
                    </span>
                    <span className={`font-mono font-bold ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPos ? '+' : ''}{formatPercent(m.returnPercent)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 dark:bg-[#08070A] border border-transparent dark:border-[#1E111A] rounded-full overflow-hidden flex">
                    <div
                      style={{ width: barWidth }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPos ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
