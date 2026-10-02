import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  Target, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { HistoricalPoint, CurrencySettings } from '../types/portfolio';
import { 
  calculateCumulativeAndUncapturedSeries, 
  CumulativeReturnPoint,
  safeNum 
} from '../utils/quantitativeFinance';
import { formatMoney, formatPercent } from '../utils/calculations';

interface CumulativeAndOpportunityChartProps {
  historicalPoints: HistoricalPoint[];
  currencySettings: CurrencySettings;
  benchmarkName?: string;
  benchmarkAnnualReturn?: number;
}

export const CumulativeAndOpportunityChart: React.FC<CumulativeAndOpportunityChartProps> = ({
  historicalPoints,
  currencySettings,
  benchmarkName = 'S&P 500 (SPY)',
  benchmarkAnnualReturn = 0.12,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'cumulative' | 'uncaptured'>('cumulative');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const seriesData: CumulativeReturnPoint[] = useMemo(() => {
    return calculateCumulativeAndUncapturedSeries(historicalPoints, benchmarkAnnualReturn);
  }, [historicalPoints, benchmarkAnnualReturn]);

  // Dimensions for SVG rendering
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute coordinates and SVG paths
  const chartMath = useMemo(() => {
    if (seriesData.length < 2) {
      return {
        portfolioPath: '',
        benchmarkPath: '',
        uncapturedAreaPath: '',
        uncapturedLinePath: '',
        zeroY: padding.top + plotHeight / 2,
        coords: [],
        minVal: 0,
        maxVal: 0,
      };
    }

    if (activeChartTab === 'cumulative') {
      const allVals = seriesData.flatMap(d => [d.portfolioReturnPercent, d.benchmarkReturnPercent]);
      const min = Math.min(-5, Math.min(...allVals) - 2);
      const max = Math.max(5, Math.max(...allVals) + 2);
      const range = Math.max(1, max - min);

      const coords = seriesData.map((d, i) => {
        const x = padding.left + (i / (seriesData.length - 1)) * plotWidth;
        const yPort = padding.top + plotHeight - ((d.portfolioReturnPercent - min) / range) * plotHeight;
        const yBench = padding.top + plotHeight - ((d.benchmarkReturnPercent - min) / range) * plotHeight;
        return { x, yPort, yBench, data: d };
      });

      const zeroY = padding.top + plotHeight - ((0 - min) / range) * plotHeight;

      // Smooth path generators
      const genPortPath = coords.reduce((acc, c, idx) => {
        if (idx === 0) return `M ${c.x} ${c.yPort}`;
        const prev = coords[idx - 1];
        const cpX = prev.x + (c.x - prev.x) / 2;
        return `${acc} C ${cpX} ${prev.yPort}, ${cpX} ${c.yPort}, ${c.x} ${c.yPort}`;
      }, '');

      const genBenchPath = coords.reduce((acc, c, idx) => {
        if (idx === 0) return `M ${c.x} ${c.yBench}`;
        const prev = coords[idx - 1];
        const cpX = prev.x + (c.x - prev.x) / 2;
        return `${acc} C ${cpX} ${prev.yBench}, ${cpX} ${c.yBench}, ${c.x} ${c.yBench}`;
      }, '');

      return {
        portfolioPath: genPortPath,
        benchmarkPath: genBenchPath,
        uncapturedAreaPath: '',
        uncapturedLinePath: '',
        zeroY,
        coords,
        minVal: min,
        maxVal: max,
      };
    } else {
      // Uncaptured returns / opportunity cost mode
      const allVals = seriesData.map(d => d.uncapturedReturnPercent);
      const min = 0;
      const max = Math.max(3, Math.max(...allVals) * 1.15);
      const range = Math.max(1, max - min);

      const coords = seriesData.map((d, i) => {
        const x = padding.left + (i / (seriesData.length - 1)) * plotWidth;
        const yUncap = padding.top + plotHeight - ((d.uncapturedReturnPercent - min) / range) * plotHeight;
        return { x, yUncap, data: d };
      });

      const baseLineY = padding.top + plotHeight;
      const genLine = coords.reduce((acc, c, idx) => {
        if (idx === 0) return `M ${c.x} ${c.yUncap}`;
        const prev = coords[idx - 1];
        const cpX = prev.x + (c.x - prev.x) / 2;
        return `${acc} C ${cpX} ${prev.yUncap}, ${cpX} ${c.yUncap}, ${c.x} ${c.yUncap}`;
      }, '');

      const first = coords[0];
      const last = coords[coords.length - 1];
      const areaPath = `${genLine} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;

      return {
        portfolioPath: '',
        benchmarkPath: '',
        uncapturedAreaPath: areaPath,
        uncapturedLinePath: genLine,
        zeroY: baseLineY,
        coords,
        minVal: min,
        maxVal: max,
      };
    }
  }, [seriesData, activeChartTab, plotWidth, plotHeight, padding]);

  const activeIndex = hoverIndex !== null ? hoverIndex : Math.max(0, seriesData.length - 1);
  const currentItem = seriesData[activeIndex] || seriesData[0];
  const activeCoord = chartMath.coords[activeIndex];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || chartMath.coords.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    chartMath.coords.forEach((c, idx) => {
      const diff = Math.abs(c.x - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const latestPoint = seriesData[seriesData.length - 1];
  const totalPortReturn = latestPoint ? latestPoint.portfolioReturnPercent : 0;
  const totalBenchReturn = latestPoint ? latestPoint.benchmarkReturnPercent : 0;
  const totalUncaptured = latestPoint ? latestPoint.uncapturedReturnPercent : 0;
  const outperforming = totalPortReturn >= totalBenchReturn;

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
      
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF17C1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
              {activeChartTab === 'cumulative' 
                ? 'Rendimiento Acumulado vs Benchmark' 
                : 'Rendimientos No Capturados (Costo de Oportunidad)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeChartTab === 'cumulative'
              ? `Evolución porcentual acumulada de tu cartera frente al ${benchmarkName}`
              : 'Diferencia de rendimiento frente al escenario óptimo o rally de mercado'}
          </p>
        </div>

        {/* Chart View Toggle Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl">
          <button
            onClick={() => setActiveChartTab('cumulative')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChartTab === 'cumulative'
                ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Rendimiento Acumulado</span>
          </button>

          <button
            onClick={() => setActiveChartTab('uncaptured')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChartTab === 'uncaptured'
                ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>No Capturados</span>
          </button>
        </div>
      </div>

      {/* KPI Preview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422]">
          <span className="text-[11px] text-slate-500 block">Cartera Acumulado</span>
          <span className={`text-base font-black font-mono ${totalPortReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalPortReturn >= 0 ? '+' : ''}{totalPortReturn.toFixed(2)}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422]">
          <span className="text-[11px] text-slate-500 block">{benchmarkName}</span>
          <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
            {totalBenchReturn >= 0 ? '+' : ''}{totalBenchReturn.toFixed(2)}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422]">
          <span className="text-[11px] text-slate-500 block">Alpha (Exceso)</span>
          <span className={`text-base font-black font-mono ${outperforming ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {(totalPortReturn - totalBenchReturn) >= 0 ? '+' : ''}{(totalPortReturn - totalBenchReturn).toFixed(2)}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#08070A] rounded-2xl border border-slate-200 dark:border-[#281422]">
          <span className="text-[11px] text-slate-500 block">Costo de Oportunidad</span>
          <span className="text-base font-black font-mono text-amber-500">
            {totalUncaptured.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div 
        ref={containerRef}
        className="w-full relative select-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="cumPortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="uncapturedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={chartMath.zeroY}
            x2={svgWidth - padding.right}
            y2={chartMath.zeroY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-300 dark:text-slate-800"
          />

          {/* MODE 1: CUMULATIVE RETURNS */}
          {activeChartTab === 'cumulative' && (
            <>
              {/* Benchmark Line (SPY) */}
              <path
                d={chartMath.benchmarkPath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="5 4"
                className="opacity-80"
              />

              {/* Portfolio Line */}
              <path
                d={chartMath.portfolioPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Crosshair & Points on hover */}
              {activeCoord && 'yPort' in activeCoord && (
                <>
                  <line
                    x1={activeCoord.x}
                    y1={padding.top}
                    x2={activeCoord.x}
                    y2={svgHeight - padding.bottom}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="text-slate-400 dark:text-slate-600"
                  />

                  {/* Portfolio point */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.yPort}
                    r="5"
                    fill="#10B981"
                    className="stroke-white dark:stroke-[#0E0D12] stroke-2"
                  />

                  {/* Benchmark point */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.yBench}
                    r="4"
                    fill="#3B82F6"
                    className="stroke-white dark:stroke-[#0E0D12] stroke-2"
                  />
                </>
              )}
            </>
          )}

          {/* MODE 2: UNCAPTURED RETURNS (Opportunity Cost) */}
          {activeChartTab === 'uncaptured' && (
            <>
              {/* Area gradient under curve */}
              <path
                d={chartMath.uncapturedAreaPath}
                fill="url(#uncapturedGrad)"
              />

              {/* Uncaptured Line */}
              <path
                d={chartMath.uncapturedLinePath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activeCoord && 'yUncap' in activeCoord && (
                <>
                  <line
                    x1={activeCoord.x}
                    y1={padding.top}
                    x2={activeCoord.x}
                    y2={svgHeight - padding.bottom}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="text-slate-400 dark:text-slate-600"
                  />

                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.yUncap}
                    r="5"
                    fill="#F59E0B"
                    className="stroke-white dark:stroke-[#0E0D12] stroke-2"
                  />
                </>
              )}
            </>
          )}

          {/* Dates on X Axis */}
          {chartMath.coords.length > 0 && (
            <>
              <text
                x={padding.left}
                y={svgHeight - 12}
                className="text-[10px] font-mono fill-slate-400"
                textAnchor="start"
              >
                {seriesData[0]?.date || ''}
              </text>
              <text
                x={svgWidth - padding.right}
                y={svgHeight - 12}
                className="text-[10px] font-mono fill-slate-400"
                textAnchor="end"
              >
                {seriesData[seriesData.length - 1]?.date || ''}
              </text>
            </>
          )}
        </svg>

        {/* Floating Tooltip */}
        {currentItem && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{currentItem.date}</span>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Cartera:</span>
                <strong className={currentItem.portfolioReturnPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {currentItem.portfolioReturnPercent >= 0 ? '+' : ''}{currentItem.portfolioReturnPercent.toFixed(2)}%
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-500">{benchmarkName}:</span>
                <strong className="text-blue-500">
                  {currentItem.benchmarkReturnPercent >= 0 ? '+' : ''}{currentItem.benchmarkReturnPercent.toFixed(2)}%
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-500">No Capturado:</span>
                <strong className="text-amber-500">
                  {currentItem.uncapturedReturnPercent.toFixed(2)}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
