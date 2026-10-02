import React, { useState } from 'react';
import { 
  Wallet, 
  Sparkles, 
  Receipt, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload, 
  DollarSign, 
  ChevronDown, 
  Sun, 
  Moon, 
  Building2,
  SlidersHorizontal,
  FolderKanban,
  Check
} from 'lucide-react';
import { CurrencySettings, Portfolio } from '../types/portfolio';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './BrandLogo';

export type WorkspaceTab = 'portfolio' | 'scanner' | 'rendimientos' | 'history' | 'mercado';

interface HeaderProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  currencySettings: CurrencySettings;
  setCurrencySettings: React.Dispatch<React.SetStateAction<CurrencySettings>>;
  onOpenManualTrade: () => void;
  onOpenPriceModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
  totalPositions: number;
  portfolios: Portfolio[];
  activePortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenPortfolioManager: () => void;
  onOpenFciExplorer?: () => void;
  onOpenDownloadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currencySettings,
  setCurrencySettings,
  onOpenManualTrade,
  onOpenPriceModal,
  onExportData,
  onImportData,
  totalPositions,
  portfolios,
  activePortfolioId,
  onSelectPortfolio,
  onOpenPortfolioManager,
  onOpenFciExplorer,
  onOpenDownloadModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isPortfolioMenuOpen, setIsPortfolioMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const toggleCurrency = () => {
    setCurrencySettings(prev => ({
      ...prev,
      displayCurrency: prev.displayCurrency === 'USD' ? 'ARS' : 'USD',
    }));
  };

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);
  const activePortfolioName = activePortfolioId === 'all' 
    ? 'Todas las Carteras' 
    : (activePortfolio?.name || 'Mi Cartera');

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500',
    indigo: 'bg-blue-500',
    cyan: 'bg-cyan-400',
    amber: 'bg-amber-500',
    rose: 'bg-[#FF17C1]',
    purple: 'bg-purple-500',
  };

  const activeColor = activePortfolioId === 'all' 
    ? 'bg-gradient-to-r from-[#FF17C1] via-[#D9048E] to-[#8E1E85]' 
    : (colorClasses[activePortfolio?.color || 'emerald'] || 'bg-[#FF17C1]');

  const tabs: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'portfolio', label: 'Mi Cartera', icon: Wallet },
    { id: 'scanner', label: 'Escanear Boletos', icon: Sparkles },
    { id: 'rendimientos', label: 'Rendimientos', icon: BarChart3 },
    { id: 'history', label: 'Operaciones', icon: Receipt },
    { id: 'mercado', label: 'Mercado & Fondos', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0C060E]/95 backdrop-blur-md border-b border-[#E2DEE5] dark:border-[#261122] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Brand & Portfolio Switcher */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group" 
              onClick={() => setActiveTab('portfolio')}
            >
              {/* Brand Winged Emblem (Pink on Black) */}
              <BrandLogo size="md" />
              <div className="hidden sm:block">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-[#F3EAF3]">
                  InverTrack
                </span>
                <span className="text-[10px] font-bold text-[#FF17C1] ml-1.5 uppercase tracking-wider">
                  AI
                </span>
              </div>
            </div>

            {/* Minimal Portfolio Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPortfolioMenuOpen(!isPortfolioMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#0E0D12] dark:hover:bg-[#18151D] border border-slate-200 dark:border-[#281422] text-xs font-semibold text-slate-800 dark:text-[#F2F0F3] transition-all cursor-pointer"
                title="Cambiar cartera activa"
              >
                <div className={`w-2 h-2 rounded-full ${activeColor} shrink-0`} />
                <span className="max-w-[120px] sm:max-w-[150px] truncate">{activePortfolioName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isPortfolioMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#0E0D12] border border-slate-200 dark:border-[#281422] rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsPortfolioMenuOpen(false)}
                >
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Mis Carteras
                  </div>

                  {/* Consolidado */}
                  <button
                    onClick={() => {
                      onSelectPortfolio('all');
                      setIsPortfolioMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activePortfolioId === 'all'
                        ? 'bg-slate-100 dark:bg-[#1C121B] text-slate-900 dark:text-[#F2F0F3]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18151D]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF17C1] to-[#FA7CD9]" />
                      <span>Todas las Carteras</span>
                    </div>
                    {activePortfolioId === 'all' && <Check className="w-3.5 h-3.5 text-[#FF17C1]" />}
                  </button>

                  {/* Individual portfolios */}
                  {portfolios.map(p => {
                    const isSelected = activePortfolioId === p.id;
                    const cDot = colorClasses[p.color || 'emerald'] || 'bg-blue-500';
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPortfolio(p.id);
                          setIsPortfolioMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-[#1C121B] text-slate-900 dark:text-[#F2F0F3]'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18151D]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-2 h-2 rounded-full ${cDot}`} />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FF17C1]" />}
                      </button>
                    );
                  })}

                  <div className="border-t border-slate-200 dark:border-[#281422] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsPortfolioMenuOpen(false);
                        onOpenPortfolioManager();
                      }}
                      className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#FF17C1] hover:bg-[#FF17C1]/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gestionar / Nueva Cartera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Minimalist Workspace Solapas (Tabs) */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/90 dark:bg-[#0D0C11] rounded-2xl border border-slate-200/80 dark:border-[#22121C]">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-[#F2F0F3] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F2F0F3]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF17C1]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'portfolio' && totalPositions > 0 && (
                    <span className="text-[10px] opacity-75 font-mono">({totalPositions})</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Currency Toggle, Theme Switcher & Actions */}
          <div className="flex items-center gap-2">
            
            {/* Currency Toggle (ARS / USD) */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0D0C11] p-0.5 rounded-xl border border-slate-200 dark:border-[#22121C] text-xs font-bold font-mono">
              <button
                onClick={() => setCurrencySettings(prev => ({ ...prev, displayCurrency: 'USD' }))}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  currencySettings.displayCurrency === 'USD'
                    ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrencySettings(prev => ({ ...prev, displayCurrency: 'ARS' }))}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  currencySettings.displayCurrency === 'ARS'
                    ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ARS
              </button>
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0E0D12] dark:hover:bg-[#18151D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Quick Action: Nueva Operación */}
            <button
              onClick={onOpenManualTrade}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0E0D12] dark:hover:bg-[#18151D] text-slate-800 dark:text-[#F2F0F3] border border-slate-200 dark:border-[#281422] text-xs font-bold transition-colors cursor-pointer"
              title="Cargar compra, venta o dividendo manualmente"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Cargar</span>
            </button>

            {/* Descargar App Button */}
            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF17C1] to-[#D9048E] text-white text-xs font-bold shadow-md shadow-[#FF17C1]/25 hover:opacity-95 transition-all cursor-pointer"
                title="Descargar aplicación en formato Web (.html) o App para PC (.zip)"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Descargar App</span>
                <span className="sm:hidden">App</span>
              </button>
            )}

            {/* More Options Dropdown (Data Backup & Prices) */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0E0D12] dark:hover:bg-[#18151D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
                title="Más opciones y copias de seguridad"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0E0D12] border border-slate-200 dark:border-[#281422] rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsMoreMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenPriceModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18151D] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    <span>Editar Cotizaciones</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onExportData();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18151D] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exportar Copia (.JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onImportData();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18151D] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Importar Copia (.JSON)</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Bar (below header on small screens) */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-200/80 dark:border-[#22121C] gap-1.5 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FF17C1] text-white shadow-sm shadow-[#FF17C1]/25'
                    : 'bg-slate-100 dark:bg-[#0E0D12] text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
