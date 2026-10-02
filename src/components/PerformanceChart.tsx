import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Maximize2,
  DollarSign,
  Percent,
  Layers
} from 'lucide-react';
import { Transaction, Position, CurrencySettings } from '../types/portfolio';
import { generatePerformanceSeries, TimePeriod, ChartDataPoint } from '../utils/chartData';
import { formatMoney, formatPercent } from '../utils/calculations';

interface PerformanceChartProps {
  transactions: Transaction[];
  positions: Position[];
  currencySettings: CurrencySettings;
  currentValuation: number;
  currentInvested: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  transactions,
  positions,
  currencySettings,
  currentValuation,
  currentInvested,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [chartMode, setChartMode] = useState<'valuation' | 'percentage'>('valuation');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate series data for current period
  const { points, stats } = useMemo(() => {
    return generatePerformanceSeries(
      transactions,
      positions,
      selectedPeriod,
      currencySettings,
      currentValuation,
      currentInvested
    );
  }, [transactions, positions, selectedPeriod, currencySettings, currentValuation, currentInvested]);

  const periods: { id: TimePeriod; label: string }[] = [
    { id: '1D', label: '1D' },
    { id: '1S', label: '1S' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '1A', label: '1A' },
    { id: 'YTD', label: 'YTD' },
    { id: 'MAX', label: 'MAX' },
  ];

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 30 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute Scales
  const { pathValuation, pathInvested, pathPercentage, areaValuationPath, mappedCoords } = useMemo(() => {
    if (points.length === 0) {
      return { pathValuation: '', pathInvested: '', pathPercentage: '', areaValuationPath: '', mappedCoords: [] };
    }

    // Min and Max for Valuation Mode
    const allValuations = points.map(p => p.valuation);
    const allInvested = points.map(p => p.invested);
    const minVal = Math.min(...allValuations, ...allInvested) * 0.96;
    const maxVal = Math.max(...allValuations, ...allInvested) * 1.04;
    const valRange = Math.max(maxVal - minVal, 1);

    // Min and Max for Percentage Mode
    const allPcts = points.map(p => p.pnlPercent);
    const minPct = Math.min(0, Math.min(...allPcts) - 2);
    const maxPct = Math.max(0, Math.max(...allPcts) + 2);
    const pctRange = Math.max(maxPct - minPct, 1);

    const coords = points.map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * plotWidth;
      const yVal = padding.top + plotHeight - ((p.valuation - minVal) / valRange) * plotHeight;
      const yInv = padding.top + plotHeight - ((p.invested - minVal) / valRange) * plotHeight;
      const yPct = padding.top + plotHeight - ((p.pnlPercent - minPct) / pctRange) * plotHeight;

      return { x, yVal, yInv, yPct, point: p };
    });

    // Generate smooth SVG paths
    const genPath = (getY: (c: typeof coords[0]) => number) => {
      return coords.reduce((acc, c, idx) => {
        if (idx === 0) return `M ${c.x} ${getY(c)}`;
        const prev = coords[idx - 1];
        const cpX1 = prev.x + (c.x - prev.x) / 2;
        const cpY1 = getY(prev);
        const cpX2 = prev.x + (c.x - prev.x) / 2;
        const cpY2 = getY(c);
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${c.x} ${getY(c)}`;
      }, '');
    };

    const valLine = genPath(c => c.yVal);
    const invLine = genPath(c => c.yInv);
    const pctLine = genPath(c => c.yPct);

    // Area path for gradient fill below valuation line
    const first = coords[0];
    const last = coords[coords.length - 1];
    const baselineY = padding.top + plotHeight;
    const areaVal = `${valLine} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;

    return {
      pathValuation: valLine,
      pathInvested: invLine,
      pathPercentage: pctLine,
      areaValuationPath: areaVal,
      mappedCoords: coords,
    };
  }, [points, plotWidth, plotHeight, padding]);

  // Active or hovered point
  const activeIndex = hoveredPointIndex !== null ? hoveredPointIndex : points.length - 1;
  const activePoint = points[activeIndex];
  const activeCoord = mappedCoords[activeIndex];

  const isProfit = stats.isPositive;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || mappedCoords.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * svgWidth;

    // Find nearest point
    let closestIdx = 0;
    let minDistance = Infinity;

    mappedCoords.forEach((c, idx) => {
      const dist = Math.abs(c.x - relativeX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoveredPointIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredPointIndex(null);
  };

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
      
      {/* Top Controls: Title, Period Pills, Mode Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Header Title & Current Period Return */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF17C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
              Evolución de Cartera
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({selectedPeriod})
            </span>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-base font-black font-mono tabular-nums ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isProfit ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownRight className="w-4 h-4 stroke-[3]" />}
              <span>{formatMoney(Math.abs(stats.changeValue), currencySettings.displayCurrency)}</span>
              <span className="text-xs font-bold">({formatPercent(stats.changePercent)})</span>
            </div>
            <span className="text-xs text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {selectedPeriod === '1D' ? 'Hoy' : `Últimos ${selectedPeriod}`}
            </span>
          </div>
        </div>

        {/* Right Controls: Mode Toggle & Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Mode switch */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl">
            <button
              onClick={() => setChartMode('valuation')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'valuation'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ver en importe monetario ($)"
            >
              $ Valor
            </button>
            <button
              onClick={() => setChartMode('percentage')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'percentage'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ver en rentabilidad porcentual (%)"
            >
              % Retorno
            </button>
          </div>

          {/* Time Period Selector Buttons */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl">
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Interactive Tooltip Card Bar */}
      {activePoint && (
        <div className="bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#22121C] rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-[#F2F0F3]">{activePoint.date}</span>
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums">
            <div>
              <span className="text-slate-500 font-sans text-[11px] mr-1.5">Valuación:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatMoney(activePoint.valuation, currencySettings.displayCurrency)}</span>
            </div>

            {chartMode === 'valuation' && (
              <div>
                <span className="text-slate-500 font-sans text-[11px] mr-1.5">Invertido:</span>
                <span className="text-slate-600 dark:text-slate-300">{formatMoney(activePoint.invested, currencySettings.displayCurrency)}</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 font-sans text-[11px] mr-1.5">Ganancia:</span>
              <span className={`font-bold ${activePoint.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {activePoint.pnl >= 0 ? '+' : ''}{formatMoney(activePoint.pnl, currencySettings.displayCurrency)} ({formatPercent(activePoint.pnlPercent)})
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SVG Chart Area */}
      <div ref={containerRef} className="relative w-full h-[260px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Emerald Gradient for Valuation Area */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#10b981" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Rose Gradient if negative overall */}
            <linearGradient id="areaGradientRose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + ratio * plotHeight;
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                className="stroke-slate-200 dark:stroke-[#22121C]"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {chartMode === 'valuation' ? (
            <>
              {/* Fill area below valuation */}
              {areaValuationPath && (
                <path
                  d={areaValuationPath}
                  fill={`url(#${isProfit ? 'areaGradient' : 'areaGradientRose'})`}
                />
              )}

              {/* Capital Invertido Line (Indigo dashed) */}
              {pathInvested && (
                <path
                  d={pathInvested}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  opacity="0.8"
                />
              )}

              {/* Current Valuation Line (Emerald solid) */}
              {pathValuation && (
                <path
                  d={pathValuation}
                  fill="none"
                  stroke={isProfit ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          ) : (
            /* Percentage Mode Line */
            <>
              {pathPercentage && (
                <path
                  d={pathPercentage}
                  fill="none"
                  stroke={isProfit ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* X Axis Labels */}
          {mappedCoords.map((c, idx) => {
            // Display label every N points to avoid clutter
            const step = Math.max(1, Math.floor(mappedCoords.length / 6));
            if (idx % step !== 0 && idx !== mappedCoords.length - 1) return null;

            return (
              <text
                key={idx}
                x={c.x}
                y={svgHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                {c.point.label}
              </text>
            );
          })}

          {/* Active Hover Crosshair Line & Point */}
          {activeCoord && (
            <g>
              {/* Vertical guideline */}
              <line
                x1={activeCoord.x}
                y1={padding.top}
                x2={activeCoord.x}
                y2={padding.top + plotHeight}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Point on the active curve */}
              <circle
                cx={activeCoord.x}
                cy={chartMode === 'valuation' ? activeCoord.yVal : activeCoord.yPct}
                r="6"
                fill={isProfit ? '#10b981' : '#f43f5e'}
                stroke="#020617"
                strokeWidth="2.5"
                className="animate-pulse"
              />

              {chartMode === 'valuation' && (
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.yInv}
                  r="4"
                  fill="#6366f1"
                  stroke="#020617"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Chart Legend & Period Stat Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
        
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
            <span className="text-slate-300 font-medium">Valuación Cartera</span>
          </div>

          {chartMode === 'valuation' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-indigo-400 border-dashed" />
              <span className="text-slate-400">Capital Invertido (Costo Base)</span>
            </div>
          )}
        </div>

        {/* High / Low in period */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Mín: <strong className="text-slate-300">{formatMoney(stats.minValuation, currencySettings.displayCurrency)}</strong></span>
          <span>•</span>
          <span>Máx: <strong className="text-slate-300">{formatMoney(stats.maxValuation, currencySettings.displayCurrency)}</strong></span>
        </div>

      </div>

    </div>
  );
};
