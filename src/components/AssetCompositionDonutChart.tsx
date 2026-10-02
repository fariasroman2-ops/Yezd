import React, { useState, useMemo } from 'react';
import { PieChart as PieIcon, Layers, ShieldCheck, DollarSign } from 'lucide-react';
import { Position, CurrencySettings } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';

interface AssetCompositionDonutChartProps {
  positions: Position[];
  currencySettings: CurrencySettings;
}

export const AssetCompositionDonutChart: React.FC<AssetCompositionDonutChartProps> = ({
  positions,
  currencySettings,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Category palette (differentiated, vivid)
  const categoryPalette: Record<string, { color: string; hex: string; bg: string }> = {
    'Acciones / CEDEAR': { color: 'text-blue-500', hex: '#3B82F6', bg: 'bg-blue-500' },
    'Bonos / ON': { color: 'text-emerald-500', hex: '#10B981', bg: 'bg-emerald-500' },
    'ETFs / Fondos': { color: 'text-amber-500', hex: '#F59E0B', bg: 'bg-amber-500' },
    'Criptomonedas': { color: 'text-purple-500', hex: '#8B5CF6', bg: 'bg-purple-500' },
    'Commodities': { color: 'text-yellow-500', hex: '#EAB308', bg: 'bg-yellow-500' },
    'Liquidez / Cash': { color: 'text-cyan-500', hex: '#06B6D4', bg: 'bg-cyan-500' },
    'Otro': { color: 'text-slate-500', hex: '#64748B', bg: 'bg-slate-500' },
  };

  // Group positions by category
  const { data, totalValuation } = useMemo(() => {
    const totals: Record<string, { value: number; count: number }> = {};
    let total = 0;

    positions.forEach(p => {
      if (p.quantity > 0 && p.currentValue > 0) {
        const cat = p.assetCategory || 'Otro';
        if (!totals[cat]) {
          totals[cat] = { value: 0, count: 0 };
        }
        totals[cat].value += p.currentValue;
        totals[cat].count += 1;
        total += p.currentValue;
      }
    });

    const items = Object.entries(totals).map(([cat, stats]) => {
      const pct = total > 0 ? (stats.value / total) * 100 : 0;
      const palette = categoryPalette[cat] || categoryPalette['Otro'];
      return {
        category: cat,
        value: stats.value,
        count: stats.count,
        percent: pct,
        hex: palette.hex,
        bg: palette.bg,
        color: palette.color,
      };
    }).sort((a, b) => b.value - a.value);

    return { data: items, totalValuation: total };
  }, [positions]);

  // Compute SVG Donut Slices
  const size = 260;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = data.map(item => {
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += (item.percent / 100) * circumference;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredCategory 
    ? data.find(d => d.category === hoveredCategory) 
    : data[0];

  if (data.length === 0 || totalValuation <= 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-[#FF17C1]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-[#FF17C1]">
            Composición de Cartera por Tipo de Activo
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {data.length} {data.length === 1 ? 'categoría' : 'categorías'}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
        
        {/* Left: Donut SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="rotate-[-90deg] overflow-visible"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth - 6}
              className="text-slate-100 dark:text-[#18151D]"
            />

            {/* Slices */}
            {slices.map(slice => {
              const isHovered = hoveredCategory === slice.category;
              return (
                <circle
                  key={slice.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.hex}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(slice.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {activeItem ? activeItem.category : 'Total'}
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {activeItem ? `${activeItem.percent.toFixed(1)}%` : '100%'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {formatMoney(activeItem ? activeItem.value : totalValuation, currencySettings.displayCurrency)}
            </span>
          </div>
        </div>

        {/* Right: Detailed Category Legend Grid */}
        <div className="flex-1 w-full space-y-2">
          {data.map(item => {
            const isHovered = hoveredCategory === item.category;
            return (
              <div
                key={item.category}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isHovered 
                    ? 'bg-slate-100/80 dark:bg-[#1E1B24] border-slate-300 dark:border-[#381E2E] scale-[1.01]' 
                    : 'bg-slate-50/60 dark:bg-[#08070A] border-slate-200/80 dark:border-[#20101C] hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                    style={{ backgroundColor: item.hex }} 
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                      ({item.count} {item.count === 1 ? 'activo' : 'activos'})
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatMoney(item.value, currencySettings.displayCurrency)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 ml-2">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
