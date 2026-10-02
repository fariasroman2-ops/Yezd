import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  Layers, 
  ArrowDownRight, 
  ArrowUpRight, 
  Info, 
  Percent, 
  Calendar,
  Grid3X3,
  HelpCircle
} from 'lucide-react';
import { HistoricalPoint, Position, CurrencySettings } from '../types/portfolio';
import { 
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateBeta,
  calculateDrawdown,
  calculateVaR,
  calculateCorrelationMatrix,
  calculateReturns,
  generateBenchmarkSeries,
  safeNum,
  standardDeviation,
  mean
} from '../utils/quantitativeFinance';
import { formatMoney, formatPercent } from '../utils/calculations';

interface RiskBacktestingViewProps {
  historicalPoints: HistoricalPoint[];
  positions: Position[];
  currencySettings: CurrencySettings;
  currentValuation: number;
}

export const RiskBacktestingView: React.FC<RiskBacktestingViewProps> = ({
  historicalPoints,
  positions,
  currencySettings,
  currentValuation,
}) => {
  // Parametrizable Risk Free Rate (default 4.5% for US T-Bills or local reference)
  const [riskFreeRatePercent, setRiskFreeRatePercent] = useState<number>(4.5);
  const [benchmarkId, setBenchmarkId] = useState<'SPY' | 'QQQ' | 'MERVAL'>('SPY');
  const [hoveredDrawdownIdx, setHoveredDrawdownIdx] = useState<number | null>(null);
  const [hoveredCorrelationCell, setHoveredCorrelationCell] = useState<{ t1: string; t2: string; val: number } | null>(null);
  const drawdownContainerRef = useRef<HTMLDivElement>(null);

  const benchmarkAnnualRates = {
    SPY: 0.125,
    QQQ: 0.165,
    MERVAL: 0.28,
  };

  const benchmarkLabels = {
    SPY: 'S&P 500 (SPY)',
    QQQ: 'Nasdaq 100 (QQQ)',
    MERVAL: 'S&P Merval (ARS/USD)',
  };

  const riskFreeRateDecimal = riskFreeRatePercent / 100;
  const benchmarkRate = benchmarkAnnualRates[benchmarkId];

  // 1. Valuation & Return series
  const { returns, dates, benchmarkReturns } = useMemo(() => {
    if (!historicalPoints || historicalPoints.length < 2) {
      return { returns: [], dates: [], benchmarkReturns: [] };
    }
    const vals = historicalPoints.map(p => p.valuation);
    const dts = historicalPoints.map(p => p.date);
    const rets = calculateReturns(vals);
    const benchSeries = generateBenchmarkSeries(dts, benchmarkRate);
    const benchRets = calculateReturns(benchSeries.map(c => 100 * (1 + c)));

    return { returns: rets, dates: dts, benchmarkReturns: benchRets };
  }, [historicalPoints, benchmarkRate]);

  // 2. Drawdown series
  const drawdownData = useMemo(() => {
    return calculateDrawdown(historicalPoints);
  }, [historicalPoints]);

  // 3. Quantitative Risk Metrics
  const metrics = useMemo(() => {
    const sharpe = calculateSharpeRatio(returns, riskFreeRateDecimal);
    const sortino = calculateSortinoRatio(returns, riskFreeRateDecimal);
    const beta = calculateBeta(returns, benchmarkReturns);
    const varData = calculateVaR(returns, currentValuation, 0.95);
    const vol = standardDeviation(returns) * Math.sqrt(252) * 100;
    const annRet = mean(returns) * 252 * 100;

    return {
      sharpe,
      sortino,
      beta,
      volatility: safeNum(vol),
      annualizedReturn: safeNum(annRet),
      ...varData,
    };
  }, [returns, benchmarkReturns, riskFreeRateDecimal, currentValuation]);

  // 4. Asset Correlation Heatmap
  const correlationData = useMemo(() => {
    return calculateCorrelationMatrix(positions, 60);
  }, [positions]);

  // SVG Chart Dimensions for Underwater Drawdown
  const svgWidth = 800;
  const svgHeight = 220;
  const pad = { top: 20, right: 30, bottom: 40, left: 45 };
  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  // Build Drawdown Path
  const drawdownChart = useMemo(() => {
    const series = drawdownData.series;
    if (series.length < 2) {
      return { path: '', area: '', coords: [], minDd: 0 };
    }

    const minDd = Math.min(-2, drawdownData.maxDrawdown * 1.15); // e.g. -25%
    const range = Math.abs(minDd) || 1;

    const coords = series.map((pt, idx) => {
      const x = pad.left + (idx / (series.length - 1)) * plotW;
      // 0% is at top (pad.top), negative values go downwards towards pad.top + plotH
      const y = pad.top + (Math.abs(pt.drawdownPercent) / range) * plotH;
      return { x, y, pt };
    });

    const genLine = coords.reduce((acc, c, idx) => {
      if (idx === 0) return `M ${c.x} ${c.y}`;
      const prev = coords[idx - 1];
      const cpX = prev.x + (c.x - prev.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
    }, '');

    const first = coords[0];
    const last = coords[coords.length - 1];
    const area = `${genLine} L ${last.x} ${pad.top} L ${first.x} ${pad.top} Z`;

    return {
      path: genLine,
      area,
      coords,
      minDd,
    };
  }, [drawdownData, plotW, plotH, pad]);

  const activeDdIdx = hoveredDrawdownIdx !== null ? hoveredDrawdownIdx : drawdownData.series.length - 1;
  const activeDdPoint = drawdownData.series[activeDdIdx];
  const activeDdCoord = drawdownChart.coords[activeDdIdx];

  const handleDdMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawdownContainerRef.current || drawdownChart.coords.length === 0) return;
    const rect = drawdownContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    drawdownChart.coords.forEach((c, idx) => {
      const diff = Math.abs(c.x - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredDrawdownIdx(closestIdx);
  };

  // Helper for heatmap colors from -1 (blue) to 0 (slate) to +1 (pink/magenta)
  const getCorrBg = (val: number) => {
    if (val >= 0.7) return 'bg-[#FF17C1]/80 text-white font-bold';
    if (val >= 0.4) return 'bg-[#FF17C1]/40 text-pink-200 font-semibold';
    if (val >= 0.15) return 'bg-pink-500/20 text-pink-300';
    if (val >= -0.15) return 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-400';
    if (val >= -0.4) return 'bg-blue-500/20 text-blue-300';
    return 'bg-blue-600/70 text-white font-bold';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Controls: Benchmark Selector & Parametrizable Risk Free Rate */}
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#FF17C1]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Parámetros Cuantitativos & Benchmark de Riesgo
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ajusta la tasa libre de riesgo y el benchmark de mercado para recalcular Sharpe, Sortino y Beta en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Benchmark Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl text-xs font-bold">
              {(['SPY', 'QQQ', 'MERVAL'] as const).map(bId => (
                <button
                  key={bId}
                  onClick={() => setBenchmarkId(bId)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    benchmarkId === bId
                      ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {bId}
                </button>
              ))}
            </div>

            {/* Risk-Free Rate Slider / Input */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] px-3 py-1.5 rounded-2xl">
              <span className="text-xs text-slate-500 whitespace-nowrap">Tasa Libre de Riesgo (Rf):</span>
              <input
                type="number"
                step="0.25"
                min="0"
                max="25"
                value={riskFreeRatePercent}
                onChange={(e) => setRiskFreeRatePercent(parseFloat(e.target.value) || 0)}
                className="w-14 font-mono font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 text-right focus:outline-none focus:border-[#FF17C1]"
              />
              <span className="text-xs font-bold text-slate-500">% anual</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Sharpe, Sortino, Beta, Max Drawdown, VaR 95% */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Ratio de Sharpe */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Ratio de Sharpe
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              metrics.sharpe >= 1.5 ? 'bg-emerald-500/15 text-emerald-500' :
              metrics.sharpe >= 0.8 ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'
            }`}>
              {metrics.sharpe >= 1.5 ? 'Excelente' : metrics.sharpe >= 0.8 ? 'Bueno' : 'Aceptable'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics.sharpe.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Exceso de retorno por unidad de volatilidad total (Rf: {riskFreeRatePercent}%)
          </p>
        </div>

        {/* Card 2: Ratio de Sortino */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Ratio de Sortino
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono">
              Downside Risk
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.sortino.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Penaliza únicamente las caídas y no la volatilidad positiva
          </p>
        </div>

        {/* Card 3: Beta de la Cartera */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              Beta vs {benchmarkId}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-mono">
              {metrics.beta > 1 ? 'Agresivo' : 'Defensivo'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics.beta.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Sensibilidad a los movimientos del índice ({metrics.beta < 1 ? 'menor oscilación' : 'mayor amplitud'})
          </p>
        </div>

        {/* Card 4: Maximum Drawdown */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Max Drawdown (MDD)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-mono">
              Pico a Valle
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {drawdownData.maxDrawdown.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500">
            Máxima pérdida sufrida desde un máximo histórico
          </p>
        </div>

        {/* Card 5: Value at Risk (VaR 95%) */}
        <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              VaR (95% Conf.)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-mono">
              1 Día
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-500 tabular-nums">
            -{metrics.var95ParametricPercent.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Pérdida máx. esperada: {formatMoney(metrics.var95ParametricDollar, currencySettings.displayCurrency)}
          </p>
        </div>

      </div>

      {/* Underwater Maximum Drawdown Chart */}
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Curva de Caídas Acumuladas (Underwater Drawdown Chart)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Profundidad y duración de caídas temporales respecto al pico de capital previo
            </p>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-rose-500 block">
              Peor caída: {drawdownData.maxDrawdown.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 block">{drawdownData.maxDrawdownDate}</span>
          </div>
        </div>

        {/* SVG Underwater Drawdown Chart */}
        <div 
          ref={drawdownContainerRef}
          className="w-full relative select-none pt-2"
          onMouseLeave={() => setHoveredDrawdownIdx(null)}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseMove={handleDdMouseMove}
          >
            <defs>
              <linearGradient id="drawdownAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Zero line (High Water Mark ceiling) */}
            <line
              x1={pad.left}
              y1={pad.top}
              x2={svgWidth - pad.right}
              y2={pad.top}
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text x={pad.left - 8} y={pad.top + 4} textAnchor="end" className="text-[10px] font-mono fill-emerald-500 font-bold">
              0%
            </text>

            {/* Max Drawdown Guide Line */}
            <line
              x1={pad.left}
              y1={svgHeight - pad.bottom}
              x2={svgWidth - pad.right}
              y2={svgHeight - pad.bottom}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-rose-500/40"
            />
            <text x={pad.left - 8} y={svgHeight - pad.bottom + 4} textAnchor="end" className="text-[10px] font-mono fill-rose-500 font-bold">
              {drawdownChart.minDd.toFixed(0)}%
            </text>

            {/* Filled Underwater Area */}
            <path
              d={drawdownChart.area}
              fill="url(#drawdownAreaGrad)"
            />

            {/* Drawdown Outline Line */}
            <path
              d={drawdownChart.path}
              fill="none"
              stroke="#E11D48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover indicator */}
            {activeDdCoord && (
              <>
                <line
                  x1={activeDdCoord.x}
                  y1={pad.top}
                  x2={activeDdCoord.x}
                  y2={svgHeight - pad.bottom}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="text-slate-400"
                />

                <circle
                  cx={activeDdCoord.x}
                  cy={activeDdCoord.y}
                  r="5"
                  fill="#E11D48"
                  className="stroke-white dark:stroke-[#0E0D12] stroke-2"
                />
              </>
            )}

            {/* Dates along X axis */}
            {drawdownChart.coords.length > 0 && (
              <>
                <text x={pad.left} y={svgHeight - 12} textAnchor="start" className="text-[10px] font-mono fill-slate-400">
                  {drawdownData.series[0]?.date || ''}
                </text>
                <text x={svgWidth - pad.right} y={svgHeight - 12} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
                  {drawdownData.series[drawdownData.series.length - 1]?.date || ''}
                </text>
              </>
            )}
          </svg>

          {/* Active Tooltip */}
          {activeDdPoint && (
            <div className="mt-2 p-3 bg-slate-50 dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-2xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">{activeDdPoint.date}</span>
              <div className="flex items-center gap-4">
                <span>Pico Previo: <strong>{formatMoney(activeDdPoint.peak, currencySettings.displayCurrency)}</strong></span>
                <span>Valuación: <strong>{formatMoney(activeDdPoint.valuation, currencySettings.displayCurrency)}</strong></span>
                <span className="text-rose-500 font-bold">Caída: {activeDdPoint.drawdownPercent.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correlation Matrix Heatmap */}
      <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-[#FF17C1]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
                Matriz de Correlación entre Activos (Heatmap)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coeficiente de Pearson (-1 a +1). Valores cercanos a 0 o negativos indican alta diversificación y descorrelación.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] text-xs">
              <span className="text-slate-500">Puntaje de Diversificación:</span>
              <span className="font-mono font-black text-[#FF17C1]">
                {correlationData.diversificationScore}/100
              </span>
            </div>
          </div>
        </div>

        {correlationData.tickers.length > 1 ? (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-mono font-bold text-slate-400">Activo</th>
                  {correlationData.tickers.map(ticker => (
                    <th key={ticker} className="p-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.tickers.map((tRow, i) => (
                  <tr key={tRow} className="border-t border-slate-100 dark:border-[#1E111A]">
                    <td className="p-2 text-left text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {tRow}
                    </td>
                    {correlationData.tickers.map((tCol, j) => {
                      const val = correlationData.matrix[i][j];
                      const isDiag = i === j;

                      return (
                        <td 
                          key={`${tRow}-${tCol}`} 
                          className="p-1"
                          onMouseEnter={() => setHoveredCorrelationCell({ t1: tRow, t2: tCol, val })}
                          onMouseLeave={() => setHoveredCorrelationCell(null)}
                        >
                          <div className={`py-2 px-2.5 rounded-xl text-xs font-mono transition-transform hover:scale-105 cursor-pointer ${
                            isDiag ? 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold' : getCorrBg(val)
                          }`}>
                            {val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 dark:border-[#1E111A]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                <span>-1.0 (Inversa / Cobertura)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
                <span>0.0 (Descorrelacionados)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FF17C1] inline-block" />
                <span>+1.0 (Movimiento conjunto)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Se requieren al menos 2 activos distintos en cartera para calcular la matriz de correlación cruzada.
          </div>
        )}
      </div>

    </div>
  );
};
