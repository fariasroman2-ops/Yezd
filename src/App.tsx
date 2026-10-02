/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header, WorkspaceTab } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { PerformanceChart } from './components/PerformanceChart';
import { LiveMarketBar } from './components/LiveMarketBar';
import { BrokerDistribution } from './components/BrokerDistribution';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { TicketScanner } from './components/TicketScanner';
import { HoldingsTable } from './components/HoldingsTable';
import { TransactionsHistory } from './components/TransactionsHistory';
import { MarketWorkspace } from './components/MarketWorkspace';
import { ManualTradeModal } from './components/ManualTradeModal';
import { QuickEditPriceModal } from './components/QuickEditPriceModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { FxRateModal } from './components/FxRateModal';
import { PortfolioManagerModal } from './components/PortfolioManagerModal';
import { FciExplorerModal } from './components/FciExplorerModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { BrandLogo } from './components/BrandLogo';

import { 
  Transaction, 
  CurrencySettings, 
  OperationType, 
  RealtimeQuote, 
  LiveFxData,
  Portfolio 
} from './types/portfolio';
import { INITIAL_DEMO_TRANSACTIONS, INITIAL_DEMO_PORTFOLIOS } from './utils/demoData';
import { 
  calculatePositions, 
  calculatePortfolioSummary, 
  calculateBrokerAllocations,
  DEFAULT_MARKET_PRICES 
} from './utils/calculations';

import { Sparkles, Trash2, RotateCcw, ShieldCheck, Check, Download } from 'lucide-react';

const STORAGE_KEY_PORTFOLIOS = 'invertrack_portfolios_v2';
const STORAGE_KEY_ACTIVE_PORTFOLIO = 'invertrack_active_portfolio_v2';
const STORAGE_KEY_TXS = 'invertrack_transactions_v2';
const STORAGE_KEY_PRICES = 'invertrack_market_prices_v2';
const STORAGE_KEY_SETTINGS = 'invertrack_settings_v2';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('portfolio');

  // Multi-Portfolio State
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PORTFOLIOS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading portfolios:', e);
    }
    return INITIAL_DEMO_PORTFOLIOS;
  });

  const [activePortfolioId, setActivePortfolioId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PORTFOLIO);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'all'; // Default to unified "Todas las Carteras" or specific
  });

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stored transactions:', e);
    }
    return INITIAL_DEMO_TRANSACTIONS;
  });

  // Custom Market Prices State
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRICES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stored prices:', e);
    }
    const initial: Record<string, number> = {};
    Object.entries(DEFAULT_MARKET_PRICES).forEach(([ticker, data]) => {
      initial[ticker] = data.price;
    });
    return initial;
  });

  // Real-time Quotes & FX State
  const [realtimeQuotes, setRealtimeQuotes] = useState<Record<string, RealtimeQuote>>({});
  const [liveFxData, setLiveFxData] = useState<LiveFxData | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Currency Settings State
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stored currency settings:', e);
    }
    return {
      displayCurrency: 'USD',
      fxRateUSDToARS: 1548,
    };
  });

  // Modal States
  const [isManualTradeOpen, setIsManualTradeOpen] = useState(false);
  const [manualTradeInitialTicker, setManualTradeInitialTicker] = useState<string>('');
  const [manualTradeInitialType, setManualTradeInitialType] = useState<OperationType>('BUY');

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalInitialTicker, setPriceModalInitialTicker] = useState<string>('');

  const [isFxRateModalOpen, setIsFxRateModalOpen] = useState(false);
  const [isPortfolioManagerOpen, setIsPortfolioManagerOpen] = useState(false);
  const [isFciExplorerOpen, setIsFciExplorerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Transaction | null>(null);

  // History search filter presets
  const [historyFilterTicker, setHistoryFilterTicker] = useState<string>('');
  const [historyFilterBroker, setHistoryFilterBroker] = useState<string>('ALL');

  // Hidden file input for JSON import
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Filter transactions based on active portfolio selection
  const filteredTransactions = useMemo(() => {
    if (activePortfolioId === 'all') return transactions;
    return transactions.filter(t => (t.portfolioId || 'port-1') === activePortfolioId);
  }, [transactions, activePortfolioId]);

  // Fetch real-time prices from API
  const fetchLivePrices = async () => {
    setIsLiveLoading(true);
    try {
      const distinctTickers = Array.from(new Set([
        ...transactions.map(t => t.ticker.toUpperCase()),
        ...Object.keys(marketPrices),
      ])).filter(Boolean);

      const url = `/api/prices/realtime?tickers=${distinctTickers.join(',')}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.prices) {
          setRealtimeQuotes(data.prices);

          setMarketPrices(prev => {
            const next = { ...prev };
            Object.entries(data.prices).forEach(([ticker, quote]: [string, any]) => {
              if (quote && quote.price !== undefined) {
                next[ticker] = quote.price;
              }
            });
            return next;
          });
        }

        if (data.fx) {
          setLiveFxData(data.fx);
        }
        setLastLiveUpdate(new Date());
      }
    } catch (e) {
      console.warn('Failed to fetch live prices:', e);
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Poll real-time prices on mount and periodically
  useEffect(() => {
    fetchLivePrices();

    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, transactions.length]);

  // Persist portfolios to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PORTFOLIOS, JSON.stringify(portfolios));
    } catch (e) {
      console.error('Failed to save portfolios:', e);
    }
  }, [portfolios]);

  // Persist active portfolio ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PORTFOLIO, activePortfolioId);
    } catch (e) {
      console.error('Failed to save active portfolio ID:', e);
    }
  }, [activePortfolioId]);

  // Persist transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  }, [transactions]);

  // Persist market prices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(marketPrices));
    } catch (e) {
      console.error('Failed to save market prices to localStorage:', e);
    }
  }, [marketPrices]);

  // Persist currency settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currencySettings));
    } catch (e) {
      console.error('Failed to save currency settings to localStorage:', e);
    }
  }, [currencySettings]);

  // Calculate Positions & Summary (based on active portfolio filter)
  const positions = useMemo(() => {
    return calculatePositions(filteredTransactions, marketPrices, realtimeQuotes);
  }, [filteredTransactions, marketPrices, realtimeQuotes]);

  const summary = useMemo(() => {
    return calculatePortfolioSummary(positions, filteredTransactions, currencySettings);
  }, [positions, filteredTransactions, currencySettings]);

  // Calculate Broker Allocations (money stored in each broker & assets)
  const brokerAllocations = useMemo(() => {
    return calculateBrokerAllocations(positions, currencySettings);
  }, [positions, currencySettings]);

  // Portfolio Management Handlers
  const handleCreatePortfolio = (name: string, description: string, color: string) => {
    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      name,
      description,
      color,
      createdAt: Date.now(),
    };
    setPortfolios(prev => [...prev, newPort]);
    setActivePortfolioId(newPort.id);
  };

  const handleUpdatePortfolio = (id: string, name: string, description: string, color: string) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, name, description, color } : p));
  };

  const handleDeletePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    if (activePortfolioId === id) {
      setActivePortfolioId('all');
    }
  };

  // Sync FX rate with live Dolar MEP from API
  const handleSyncFxRateToMep = (mepRate: number) => {
    setCurrencySettings(prev => ({
      ...prev,
      fxRateUSDToARS: mepRate,
    }));
  };

  // Add Transaction Handler
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const assignedPortfolioId = newTx.portfolioId || (activePortfolioId !== 'all' ? activePortfolioId : portfolios[0]?.id || 'port-1');

    const fullTx: Transaction = {
      ...newTx,
      portfolioId: assignedPortfolioId,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    };

    setTransactions(prev => [fullTx, ...prev]);

    if (marketPrices[fullTx.ticker] === undefined) {
      setMarketPrices(prev => ({
        ...prev,
        [fullTx.ticker]: fullTx.price,
      }));
    }

    setTimeout(() => {
      fetchLivePrices();
    }, 500);
  };

  // Add Multiple Transactions Handler
  const handleAddMultipleTransactions = (txs: Array<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const assignedPortfolioId = (activePortfolioId !== 'all' ? activePortfolioId : portfolios[0]?.id || 'port-1');

    const fullTxs: Transaction[] = txs.map((tx, idx) => ({
      ...tx,
      portfolioId: tx.portfolioId || assignedPortfolioId,
      id: `tx-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now() + idx,
    }));

    setTransactions(prev => [...fullTxs, ...prev]);

    setMarketPrices(prev => {
      const next = { ...prev };
      fullTxs.forEach(t => {
        if (next[t.ticker] === undefined) {
          next[t.ticker] = t.price;
        }
      });
      return next;
    });

    setTimeout(() => {
      fetchLivePrices();
    }, 500);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Update Market Prices Handler
  const handleSavePrices = (updatedPrices: Record<string, number>) => {
    setMarketPrices(updatedPrices);
  };

  // Quick Trade from Table Handler
  const handleQuickTrade = (ticker: string, type: 'BUY' | 'SELL') => {
    setManualTradeInitialTicker(ticker);
    setManualTradeInitialType(type);
    setIsManualTradeOpen(true);
  };

  // Edit Single Price from Table Handler
  const handleEditSinglePrice = (ticker: string) => {
    setPriceModalInitialTicker(ticker);
    setIsPriceModalOpen(true);
  };

  // Filter History by Ticker Handler
  const handleFilterHistoryByTicker = (ticker: string) => {
    setHistoryFilterTicker(ticker);
    setActiveTab('history');
  };

  // Filter History by Broker Handler
  const handleFilterHistoryByBroker = (broker: string) => {
    setHistoryFilterBroker(broker);
    setActiveTab('history');
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No hay transacciones registradas para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Cartera_ID',
      'Fecha',
      'Operacion',
      'Ticker',
      'Nombre',
      'Categoria',
      'Cantidad',
      'Precio',
      'Moneda',
      'Comisiones',
      'Total',
      'Broker',
      'Boleto_Nro',
      'Notas'
    ];

    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.portfolioId || ''}"`,
      `"${t.date}"`,
      `"${t.operationType}"`,
      `"${t.ticker}"`,
      `"${(t.assetName || '').replace(/"/g, '""')}"`,
      `"${t.assetCategory}"`,
      t.quantity,
      t.price,
      `"${t.currency}"`,
      t.fees,
      t.totalAmount,
      `"${(t.broker || '').replace(/"/g, '""')}"`,
      `"${t.ticketNumber || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InverTrack_Cartera_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup Handler
  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      portfolios,
      transactions,
      marketPrices,
      currencySettings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InverTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup Handler
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions);
          if (parsed.portfolios) setPortfolios(parsed.portfolios);
          if (parsed.marketPrices) setMarketPrices(parsed.marketPrices);
          if (parsed.currencySettings) setCurrencySettings(parsed.currencySettings);
          alert('¡Copia de seguridad restaurada con éxito!');
        } else if (Array.isArray(parsed)) {
          setTransactions(parsed);
          alert('¡Transacciones importadas con éxito!');
        } else {
          alert('El archivo no tiene un formato de respaldo válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to initial demo data
  const handleResetDemo = () => {
    if (window.confirm('¿Quieres restaurar la cartera de ejemplo inicial con múltiples carteras y boletos?')) {
      setPortfolios(INITIAL_DEMO_PORTFOLIOS);
      setActivePortfolioId('all');
      setTransactions(INITIAL_DEMO_TRANSACTIONS);
      const initial: Record<string, number> = {};
      Object.entries(DEFAULT_MARKET_PRICES).forEach(([ticker, data]) => {
        initial[ticker] = data.price;
      });
      setMarketPrices(initial);
      fetchLivePrices();
    }
  };

  // Clear all data
  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de vaciar toda la cartera? Se borrarán todos los boletos anotados.')) {
      setTransactions([]);
    }
  };

  const currentValuationNum = currencySettings.displayCurrency === 'USD' 
    ? summary.totalValuationUSD 
    : summary.totalValuationARS;
  const currentInvestedNum = currencySettings.displayCurrency === 'USD' 
    ? summary.totalInvestedUSD 
    : summary.totalInvestedARS;

  return (
    <div className="min-h-screen bg-[#F3EAF3] dark:bg-[#0C060E] text-slate-900 dark:text-[#F3EAF3] flex flex-col selection:bg-[#FF17C1] selection:text-white transition-colors">
      
      {/* Hidden file input for JSON import */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* Main Top Header with Portfolio Switcher & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currencySettings={currencySettings}
        setCurrencySettings={setCurrencySettings}
        onOpenManualTrade={() => {
          setManualTradeInitialTicker('');
          setManualTradeInitialType('BUY');
          setIsManualTradeOpen(true);
        }}
        onOpenPriceModal={() => {
          setPriceModalInitialTicker('');
          setIsPriceModalOpen(true);
        }}
        onExportData={handleExportJSON}
        onImportData={() => importFileInputRef.current?.click()}
        totalPositions={positions.filter(p => p.quantity > 0).length}
        portfolios={portfolios}
        activePortfolioId={activePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onOpenPortfolioManager={() => setIsPortfolioManagerOpen(true)}
        onOpenFciExplorer={() => setIsFciExplorerOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab 1: Mi Cartera (Dashboard, Live Bar, Chart, Broker Allocation & Holdings) */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Real-time Market Status Bar */}
            <LiveMarketBar
              isLiveLoading={isLiveLoading}
              lastUpdated={lastLiveUpdate}
              onRefreshLivePrices={fetchLivePrices}
              liveFxData={liveFxData}
              onSyncFxRateToMep={handleSyncFxRateToMep}
              currentConfiguredFxRate={currencySettings.fxRateUSDToARS}
              autoRefreshEnabled={autoRefreshEnabled}
              onToggleAutoRefresh={() => setAutoRefreshEnabled(prev => !prev)}
              onOpenFciExplorer={() => setIsFciExplorerOpen(true)}
            />

            {/* Overview Key Metrics Cards */}
            <PortfolioOverview
              summary={summary}
              positions={positions}
              currencySettings={currencySettings}
              onEditFxRate={() => setIsFxRateModalOpen(true)}
              onGoToScanner={() => setActiveTab('scanner')}
              onOpenManualTrade={() => {
                setManualTradeInitialTicker('');
                setManualTradeInitialType('BUY');
                setIsManualTradeOpen(true);
              }}
              onOpenPriceModal={() => {
                setPriceModalInitialTicker('');
                setIsPriceModalOpen(true);
              }}
            />

            {/* Interactive Performance Chart by Period */}
            {summary.positionsCount > 0 && (
              <PerformanceChart
                transactions={filteredTransactions}
                positions={positions}
                currencySettings={currencySettings}
                currentValuation={currentValuationNum}
                currentInvested={currentInvestedNum}
              />
            )}

            {/* Multi-Broker Allocation & Money Breakdown */}
            {brokerAllocations.length > 0 && (
              <BrokerDistribution
                brokerAllocations={brokerAllocations}
                currencySettings={currencySettings}
                onFilterHistoryByBroker={handleFilterHistoryByBroker}
              />
            )}

            {/* Holdings Table with Live 24h Variation & Broker Badges */}
            <HoldingsTable
              positions={positions}
              currencySettings={currencySettings}
              onQuickTrade={handleQuickTrade}
              onEditPrice={handleEditSinglePrice}
              onFilterHistoryByTicker={handleFilterHistoryByTicker}
              onOpenFciExplorer={() => setIsFciExplorerOpen(true)}
            />

          </div>
        )}

        {/* Tab 2: Solapa de Rendimientos (Mensual y Anual Detallado y Resumido) */}
        {activeTab === 'rendimientos' && (
          <div className="animate-fadeIn">
            <PerformanceDashboard
              transactions={filteredTransactions}
              positions={positions}
              currencySettings={currencySettings}
              currentValuation={currentValuationNum}
              currentInvested={currentInvestedNum}
            />
          </div>
        )}

        {/* Tab 3: Lector de Boletos con IA */}
        {activeTab === 'scanner' && (
          <div className="animate-fadeIn">
            <TicketScanner
              onAddTransaction={handleAddTransaction}
              onAddMultipleTransactions={handleAddMultipleTransactions}
              onGoToPortfolio={() => setActiveTab('portfolio')}
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
            />
          </div>
        )}

        {/* Tab 4: Órdenes y Carga por Broker */}
        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <TransactionsHistory
              transactions={filteredTransactions}
              currencySettings={currencySettings}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenManualTrade={() => {
                setManualTradeInitialTicker('');
                setManualTradeInitialType('BUY');
                setIsManualTradeOpen(true);
              }}
              onViewTicketDetail={(tx) => setSelectedTicketDetail(tx)}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              initialFilterTicker={historyFilterTicker}
              onClearInitialFilterTicker={() => setHistoryFilterTicker('')}
              initialFilterBroker={historyFilterBroker}
              onClearInitialFilterBroker={() => setHistoryFilterBroker('ALL')}
              portfolios={portfolios}
              onAddMultipleTransactions={handleAddMultipleTransactions}
              activePortfolioId={activePortfolioId}
              onGoToPortfolio={() => setActiveTab('portfolio')}
            />
          </div>
        )}

        {/* Tab 5: Mercado, Fondos CAFCI & Cotizaciones */}
        {activeTab === 'mercado' && (
          <div className="animate-fadeIn">
            <MarketWorkspace
              liveFxData={liveFxData}
              realtimeQuotes={realtimeQuotes}
              isLiveLoading={isLiveLoading}
              onRefreshLivePrices={fetchLivePrices}
              onSelectAssetToTrade={(asset) => {
                setManualTradeInitialTicker(asset.ticker);
                setManualTradeInitialType('BUY');
                setMarketPrices(prev => ({
                  ...prev,
                  [asset.ticker]: asset.price,
                }));
                setIsManualTradeOpen(true);
              }}
              onUpdateHoldingPrice={(ticker, price) => {
                setMarketPrices(prev => ({
                  ...prev,
                  [ticker]: price,
                }));
              }}
              userTickers={positions.map(p => p.ticker.toUpperCase())}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2DEE5] dark:border-[#261122] bg-white/90 dark:bg-[#0C060E]/95 py-5 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" withContainer={true} />
            <span className="font-bold text-[#FF17C1]">InverTrack AI</span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-400">Gestor Multi-Cartera & Rendimientos</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="text-[#FF17C1] hover:text-[#FA7CD9] dark:text-[#FF17C1] dark:hover:text-[#FFAFEA] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" /> Descargar App (Web & PC)
            </button>
            <span>•</span>
            <button
              onClick={handleResetDemo}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar Ejemplo
            </button>
            <span>•</span>
            <button
              onClick={handleClearAll}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Vaciar Cartera
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isManualTradeOpen && (
        <ManualTradeModal
          isOpen={isManualTradeOpen}
          onClose={() => setIsManualTradeOpen(false)}
          onAddTransaction={handleAddTransaction}
          initialTicker={manualTradeInitialTicker}
          initialType={manualTradeInitialType}
          portfolios={portfolios}
          activePortfolioId={activePortfolioId}
        />
      )}

      {isPriceModalOpen && (
        <QuickEditPriceModal
          isOpen={isPriceModalOpen}
          onClose={() => setIsPriceModalOpen(false)}
          positions={positions}
          marketPrices={marketPrices}
          onSavePrices={handleSavePrices}
          initialTicker={priceModalInitialTicker}
        />
      )}

      {selectedTicketDetail && (
        <TicketDetailModal
          transaction={selectedTicketDetail}
          onClose={() => setSelectedTicketDetail(null)}
        />
      )}

      {isFxRateModalOpen && (
        <FxRateModal
          isOpen={isFxRateModalOpen}
          onClose={() => setIsFxRateModalOpen(false)}
          currencySettings={currencySettings}
          onSaveCurrencySettings={setCurrencySettings}
        />
      )}

      {isPortfolioManagerOpen && (
        <PortfolioManagerModal
          isOpen={isPortfolioManagerOpen}
          onClose={() => setIsPortfolioManagerOpen(false)}
          portfolios={portfolios}
          activePortfolioId={activePortfolioId}
          onSelectPortfolio={setActivePortfolioId}
          onCreatePortfolio={handleCreatePortfolio}
          onUpdatePortfolio={handleUpdatePortfolio}
          onDeletePortfolio={handleDeletePortfolio}
        />
      )}

      {isFciExplorerOpen && (
        <FciExplorerModal
          isOpen={isFciExplorerOpen}
          onClose={() => setIsFciExplorerOpen(false)}
          onSelectFundToTrade={(asset) => {
            setManualTradeInitialTicker(asset.ticker);
            setManualTradeInitialType('BUY');
            setMarketPrices(prev => ({
              ...prev,
              [asset.ticker]: asset.price,
            }));
            setIsManualTradeOpen(true);
          }}
          onUpdateHoldingPrice={(ticker, price) => {
            setMarketPrices(prev => ({
              ...prev,
              [ticker]: price,
            }));
          }}
          userTickers={positions.map(p => p.ticker.toUpperCase())}
        />
      )}

      {isDownloadModalOpen && (
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />
      )}

    </div>
  );
}
