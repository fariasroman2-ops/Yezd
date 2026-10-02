import React, { useState } from 'react';
import { BarChart3, ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import { Transaction, Position, CurrencySettings, HistoricalPoint } from '../types/portfolio';
import { PerformanceDashboard } from './PerformanceDashboard';
import { CumulativeAndOpportunityChart } from './CumulativeAndOpportunityChart';
import { AssetCompositionDonutChart } from './AssetCompositionDonutChart';
import { RiskBacktestingView } from './RiskBacktestingView';

interface RendimientosWorkspaceProps {
  transactions: Transaction[];
  positions: Position[];
  currencySettings: CurrencySettings;
  currentValuation: number;
  currentInvested: number;
  historicalPoints: HistoricalPoint[];
}

export const RendimientosWorkspace: React.FC<RendimientosWorkspaceProps> = ({
  transactions,
  positions,
  currencySettings,
  currentValuation,
  currentInvested,
  historicalPoints,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rendimientos' | 'backtesting'>('rendimientos');

  return (
    <div className="space-y-6">
      
      {/* Top Solapa (Tab) Switcher: Rendimientos vs Backtesting y Riesgo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-3 sm:p-4 shadow-sm transition-colors">
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-[#FF17C1] flex items-center justify-center">
            {activeSubTab === 'rendimientos' ? (
              <BarChart3 className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeSubTab === 'rendimientos' 
                ? 'Análisis de Rendimiento & Retornos' 
                : 'Backtesting Cuantitativo & Gestión de Riesgo'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeSubTab === 'rendimientos'
                ? 'Rentabilidad acumulada, matriz periódica y costo de oportunidad'
                : 'Métricas de Sharpe, Sortino, Beta, VaR al 95% y correlaciones'}
            </p>
          </div>
        </div>

        {/* The 2 Main Tabs requested */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveSubTab('rendimientos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'rendimientos'
                ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FF17C1]" />
            <span>Rendimientos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backtesting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'backtesting'
                ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Backtesting y Riesgo</span>
          </button>
        </div>

      </div>

      {/* SOLAPA 1: RENDIMIENTOS (Actualizada con gráficos solicitados) */}
      {activeSubTab === 'rendimientos' && (
        <div className="space-y-6">
          {/* Gráfico 1: Rendimiento Acumulado & Rendimientos No Capturados */}
          <CumulativeAndOpportunityChart
            historicalPoints={historicalPoints}
            currencySettings={currencySettings}
            benchmarkName="S&P 500 (SPY)"
            benchmarkAnnualReturn={0.12}
          />

          {/* Gráfico 2: Composición actual de la cartera por tipo de activo (Torta / Dona) */}
          <AssetCompositionDonutChart
            positions={positions}
            currencySettings={currencySettings}
          />

          {/* Contenido y tablas que ya existían (Métricas periódicas y matriz mensual/anual) */}
          <PerformanceDashboard
            transactions={transactions}
            positions={positions}
            currencySettings={currencySettings}
            currentValuation={currentValuation}
            currentInvested={currentInvested}
          />
        </div>
      )}

      {/* SOLAPA 2: BACKTESTING Y RIESGO (Nueva) */}
      {activeSubTab === 'backtesting' && (
        <RiskBacktestingView
          historicalPoints={historicalPoints}
          positions={positions}
          currencySettings={currencySettings}
          currentValuation={currentValuation}
        />
      )}

    </div>
  );
};
