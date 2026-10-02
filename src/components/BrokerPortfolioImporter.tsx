import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Check, 
  FileSpreadsheet, 
  Clipboard, 
  Sparkles, 
  DollarSign, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Calendar,
  Upload,
  FileText
} from 'lucide-react';
import { Transaction, OperationType, AssetCategory, Currency, Portfolio } from '../types/portfolio';
import { formatMoney } from '../utils/calculations';

interface BrokerPortfolioImporterProps {
  onAddMultipleTransactions: (txs: Array<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  onGoToPortfolio: () => void;
  portfolios?: Portfolio[];
  activePortfolioId?: string;
  onSuccess?: (brokerName: string, count: number) => void;
}

export interface PortfolioRow {
  id: string;
  ticker: string;
  assetName: string;
  category: AssetCategory;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currency: Currency;
}

export const BrokerPortfolioImporter: React.FC<BrokerPortfolioImporterProps> = ({
  onAddMultipleTransactions,
  onGoToPortfolio,
  portfolios = [],
  activePortfolioId = 'default',
  onSuccess,
}) => {
  const [selectedBroker, setSelectedBroker] = useState<string>('Balanz');
  const [customBroker, setCustomBroker] = useState<string>('');
  const [portfolioDate, setPortfolioDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [destinationPortfolioId, setDestinationPortfolioId] = useState<string>(
    activePortfolioId !== 'all' && activePortfolioId ? activePortfolioId : (portfolios[0]?.id || 'default')
  );

  const [inputMethod, setInputMethod] = useState<'grid' | 'paste' | 'templates' | 'file'>('grid');
  const [pasteRawText, setPasteRawText] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of brokers with their specific brand colors
  const brokerOptions = [
    { name: 'Balanz', label: 'Balanz (Azul)', badgeClass: 'bg-blue-600 text-white' },
    { name: 'InvertirOnline', label: 'IOL (Violeta)', badgeClass: 'bg-purple-600 text-white' },
    { name: 'Binance', label: 'Binance (Amarillo)', badgeClass: 'bg-yellow-500 text-slate-950 font-bold' },
    { name: 'Interactive Brokers', label: 'IBKR (Rojo)', badgeClass: 'bg-red-600 text-white' },
    { name: 'Cocos Capital', label: 'Cocos (Violeta Neón)', badgeClass: 'bg-violet-600 text-white' },
    { name: 'Bull Market', label: 'Bull Market (Naranja)', badgeClass: 'bg-orange-500 text-white' },
    { name: 'PPI', label: 'PPI (Verde Menta)', badgeClass: 'bg-emerald-600 text-white' },
    { name: 'Eco Valores', label: 'Eco Valores (Celeste)', badgeClass: 'bg-sky-500 text-white' },
    { name: 'Lemon Cash', label: 'Lemon (Verde Lima)', badgeClass: 'bg-lime-500 text-slate-950 font-bold' },
    { name: 'Ripio', label: 'Ripio (Fucsia)', badgeClass: 'bg-fuchsia-600 text-white' },
    { name: 'Santander', label: 'Santander (Rojo Carmesí)', badgeClass: 'bg-red-800 text-white' },
    { name: 'Galicia', label: 'Galicia (Naranja Terracota)', badgeClass: 'bg-amber-700 text-white' },
    { name: 'BBVA', label: 'BBVA (Azul Cobalto)', badgeClass: 'bg-blue-900 text-white' },
    { name: 'Macro', label: 'Banco Macro (Azul Zafiro)', badgeClass: 'bg-indigo-700 text-white' },
    { name: 'Uala', label: 'Ualá (Coral)', badgeClass: 'bg-rose-500 text-white' },
    { name: 'Belo', label: 'Belo (Violeta)', badgeClass: 'bg-purple-800 text-white' },
    { name: 'Otro', label: 'Otro Broker Personalizado', badgeClass: 'bg-slate-700 text-white' },
  ];

  // Editable rows in grid mode
  const [rows, setRows] = useState<PortfolioRow[]>([
    {
      id: 'row-1',
      ticker: 'AL30',
      assetName: 'Bonos de la República Argentina 2030 USD',
      category: 'Bonos / ON',
      quantity: 1500,
      avgBuyPrice: 58.5,
      currentPrice: 65.2,
      currency: 'USD',
    },
    {
      id: 'row-2',
      ticker: 'GD30',
      assetName: 'Globales 2030 Ley Extranjera USD',
      category: 'Bonos / ON',
      quantity: 800,
      avgBuyPrice: 62.0,
      currentPrice: 68.4,
      currency: 'USD',
    },
    {
      id: 'row-3',
      ticker: 'AAPL',
      assetName: 'Apple Inc. CEDEAR',
      category: 'Acciones / CEDEAR',
      quantity: 25,
      avgBuyPrice: 19800,
      currentPrice: 22400,
      currency: 'ARS',
    },
    {
      id: 'row-4',
      ticker: 'SPY',
      assetName: 'SPDR S&P 500 ETF Trust CEDEAR',
      category: 'ETFs / Fondos',
      quantity: 15,
      avgBuyPrice: 32500,
      currentPrice: 36800,
      currency: 'ARS',
    },
  ]);

  const activeBrokerName = selectedBroker === 'Otro' 
    ? (customBroker.trim() || 'Broker Personalizado') 
    : selectedBroker;

  // Row update handlers
  const handleUpdateRow = (id: string, field: keyof PortfolioRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleAddRow = () => {
    const newRow: PortfolioRow = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticker: '',
      assetName: '',
      category: 'Acciones / CEDEAR',
      quantity: 10,
      avgBuyPrice: 100,
      currentPrice: 100,
      currency: 'USD',
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Pre-configured broker demo templates
  const handleLoadTemplate = (templateName: 'balanz' | 'iol' | 'binance' | 'bullmarket' | 'cocos' | 'ibkr') => {
    if (templateName === 'balanz') {
      setSelectedBroker('Balanz');
      setRows([
        { id: 'b-1', ticker: 'AL30', assetName: 'Bono Rep. Argentina 2030 USD', category: 'Bonos / ON', quantity: 2500, avgBuyPrice: 56.8, currentPrice: 65.5, currency: 'USD' },
        { id: 'b-2', ticker: 'GD30', assetName: 'Bono Global 2030 NY', category: 'Bonos / ON', quantity: 1200, avgBuyPrice: 61.2, currentPrice: 68.9, currency: 'USD' },
        { id: 'b-3', ticker: 'YCA6O', assetName: 'ON YPF Clase XVI 2026', category: 'Bonos / ON', quantity: 800, avgBuyPrice: 101.5, currentPrice: 104.2, currency: 'USD' },
        { id: 'b-4', ticker: 'BALANZ-AHORRO', assetName: 'FCI Balanz Ahorro en Pesos (T+1)', category: 'ETFs / Fondos', quantity: 50000, avgBuyPrice: 1.45, currentPrice: 1.62, currency: 'ARS' },
      ]);
    } else if (templateName === 'iol') {
      setSelectedBroker('InvertirOnline');
      setRows([
        { id: 'i-1', ticker: 'GGAL', assetName: 'Grupo Financiero Galicia', category: 'Acciones / CEDEAR', quantity: 300, avgBuyPrice: 4200, currentPrice: 5100, currency: 'ARS' },
        { id: 'i-2', ticker: 'YPFD', assetName: 'YPF Sociedad Anónima', category: 'Acciones / CEDEAR', quantity: 80, avgBuyPrice: 28500, currentPrice: 34200, currency: 'ARS' },
        { id: 'i-3', ticker: 'SPY', assetName: 'CEDEAR SPDR S&P 500', category: 'ETFs / Fondos', quantity: 20, avgBuyPrice: 31000, currentPrice: 36800, currency: 'ARS' },
        { id: 'i-4', ticker: 'QQQ', assetName: 'CEDEAR Invesco QQQ Tech', category: 'ETFs / Fondos', quantity: 15, avgBuyPrice: 28000, currentPrice: 33500, currency: 'ARS' },
      ]);
    } else if (templateName === 'binance') {
      setSelectedBroker('Binance');
      setRows([
        { id: 'c-1', ticker: 'BTC', assetName: 'Bitcoin Spot', category: 'Criptomonedas', quantity: 0.085, avgBuyPrice: 63500, currentPrice: 94500, currency: 'USD' },
        { id: 'c-2', ticker: 'ETH', assetName: 'Ethereum Spot', category: 'Criptomonedas', quantity: 1.25, avgBuyPrice: 2650, currentPrice: 3250, currency: 'USD' },
        { id: 'c-3', ticker: 'SOL', assetName: 'Solana Spot', category: 'Criptomonedas', quantity: 14, avgBuyPrice: 145, currentPrice: 215, currency: 'USD' },
        { id: 'c-4', ticker: 'USDT', assetName: 'Tether USD Earn Liquidez', category: 'Liquidez / Cash', quantity: 1200, avgBuyPrice: 1.0, currentPrice: 1.0, currency: 'USD' },
      ]);
    } else if (templateName === 'bullmarket') {
      setSelectedBroker('Bull Market');
      setRows([
        { id: 'bm-1', ticker: 'MELI', assetName: 'MercadoLibre Inc. CEDEAR', category: 'Acciones / CEDEAR', quantity: 18, avgBuyPrice: 24500, currentPrice: 29800, currency: 'ARS' },
        { id: 'bm-2', ticker: 'NVDA', assetName: 'Nvidia Corp CEDEAR', category: 'Acciones / CEDEAR', quantity: 45, avgBuyPrice: 6200, currentPrice: 7800, currency: 'ARS' },
        { id: 'bm-3', ticker: 'TX26', assetName: 'Bono Boncer 2026 CER', category: 'Bonos / ON', quantity: 4000, avgBuyPrice: 1120, currentPrice: 1260, currency: 'ARS' },
      ]);
    } else if (templateName === 'cocos') {
      setSelectedBroker('Cocos Capital');
      setRows([
        { id: 'co-1', ticker: 'AL30D', assetName: 'Bono AL30 Liquidación Cable D', category: 'Bonos / ON', quantity: 1800, avgBuyPrice: 59.2, currentPrice: 66.4, currency: 'USD' },
        { id: 'co-2', ticker: 'PAMP', assetName: 'Pampa Energía S.A.', category: 'Acciones / CEDEAR', quantity: 220, avgBuyPrice: 3100, currentPrice: 3850, currency: 'ARS' },
        { id: 'co-3', ticker: 'VIST', assetName: 'Vista Energy CEDEAR', category: 'Acciones / CEDEAR', quantity: 12, avgBuyPrice: 48000, currentPrice: 56500, currency: 'ARS' },
      ]);
    } else if (templateName === 'ibkr') {
      setSelectedBroker('Interactive Brokers');
      setRows([
        { id: 'ib-1', ticker: 'VOO', assetName: 'Vanguard S&P 500 ETF', category: 'ETFs / Fondos', quantity: 25, avgBuyPrice: 460.5, currentPrice: 520.0, currency: 'USD' },
        { id: 'ib-2', ticker: 'MSFT', assetName: 'Microsoft Corporation', category: 'Acciones / CEDEAR', quantity: 15, avgBuyPrice: 395.0, currentPrice: 440.0, currency: 'USD' },
        { id: 'ib-3', ticker: 'AMZN', assetName: 'Amazon.com Inc.', category: 'Acciones / CEDEAR', quantity: 20, avgBuyPrice: 175.0, currentPrice: 195.0, currency: 'USD' },
        { id: 'ib-4', ticker: 'TLT', assetName: 'iShares 20+ Year Treasury Bond ETF', category: 'Bonos / ON', quantity: 30, avgBuyPrice: 91.5, currentPrice: 94.2, currency: 'USD' },
      ]);
    }
    setInputMethod('grid');
  };

  // Parser helper from text lines
  const parseLinesToRows = (raw: string): PortfolioRow[] => {
    const lines = raw.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedRows: PortfolioRow[] = [];

    lines.forEach((line, index) => {
      // Split by tab, semicolon, comma, or 2+ spaces
      const parts = line.split(/\t|;|,|\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Find potential ticker
        const potentialTicker = parts[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (potentialTicker.length >= 2 && potentialTicker.length <= 12) {
          // Parse numbers
          const cleanNum = (val?: string) => {
            if (!val) return 0;
            // Clean currency symbols or spaces
            const sanitized = val.replace(/[$USDu€\s]/gi, '');
            // Handle Argentine vs US decimals (e.g., 1.500,50 vs 1500.50)
            if (sanitized.includes(',') && sanitized.includes('.')) {
              return parseFloat(sanitized.replace(/\./g, '').replace(',', '.'));
            } else if (sanitized.includes(',')) {
              return parseFloat(sanitized.replace(',', '.'));
            }
            return parseFloat(sanitized);
          };

          const num1 = cleanNum(parts[1]);
          const num2 = cleanNum(parts[2]);

          let cat: AssetCategory = 'Acciones / CEDEAR';
          if (potentialTicker.startsWith('AL') || potentialTicker.startsWith('GD') || potentialTicker.startsWith('TX') || potentialTicker.includes('ON') || potentialTicker.startsWith('BP') || potentialTicker.startsWith('BA')) {
            cat = 'Bonos / ON';
          } else if (['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'ADA', 'DOT', 'XRP'].includes(potentialTicker)) {
            cat = 'Criptomonedas';
          } else if (['SPY', 'QQQ', 'DIA', 'IWM', 'EEM', 'VOO', 'VTI', 'TLT'].includes(potentialTicker) || potentialTicker.includes('FIMA') || potentialTicker.includes('FCI')) {
            cat = 'ETFs / Fondos';
          }

          let curr: Currency = 'USD';
          if (line.includes('ARS') || line.includes('Pesos') || num2 > 1000) {
            curr = 'ARS';
          }

          parsedRows.push({
            id: `p-${Date.now()}-${index}`,
            ticker: potentialTicker,
            assetName: parts[3] || `${potentialTicker} Tenencia`,
            category: cat,
            quantity: isNaN(num1) || num1 <= 0 ? 10 : num1,
            avgBuyPrice: isNaN(num2) || num2 <= 0 ? 100 : num2,
            currentPrice: isNaN(num2) || num2 <= 0 ? 100 : num2,
            currency: curr,
          });
        }
      }
    });

    return parsedRows;
  };

  // Parser for pasted text
  const handleParsePastedText = () => {
    if (!pasteRawText.trim()) return;
    const parsedRows = parseLinesToRows(pasteRawText);
    if (parsedRows.length > 0) {
      setRows(parsedRows);
      setInputMethod('grid');
    } else {
      alert('No se pudieron detectar filas válidas. Asegúrate de incluir al menos: Ticker, Cantidad y Precio.');
    }
  };

  // File upload handler (CSV / TXT / TSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsedRows = parseLinesToRows(text);
        if (parsedRows.length > 0) {
          setRows(parsedRows);
          setInputMethod('grid');
          setSaveSuccess(`Se cargaron ${parsedRows.length} posiciones desde el archivo ${file.name}`);
        } else {
          alert('El archivo no contiene filas con formato reconocido (Ticker, Cantidad, Precio).');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save all portfolio rows as actual initial holdings / transactions
  const handleSaveEntirePortfolio = () => {
    const validRows = rows.filter(r => r.ticker.trim() && r.quantity > 0 && r.avgBuyPrice > 0);
    if (validRows.length === 0) {
      alert('Por favor agrega al menos un activo válido con ticker, cantidad mayor a 0 y precio.');
      return;
    }

    const effectiveDate = portfolioDate || new Date().toISOString().split('T')[0];

    const newTransactions: Array<Omit<Transaction, 'id' | 'createdAt'>> = validRows.map((r, i) => ({
      portfolioId: destinationPortfolioId,
      date: effectiveDate,
      operationType: 'BUY' as OperationType,
      ticker: r.ticker.trim().toUpperCase(),
      assetName: r.assetName.trim() || `${r.ticker.trim().toUpperCase()} Tenencia Inicial`,
      assetCategory: r.category,
      quantity: r.quantity,
      price: r.avgBuyPrice,
      currency: r.currency,
      fees: 0,
      totalAmount: r.quantity * r.avgBuyPrice,
      broker: activeBrokerName,
      ticketNumber: `ORD-${activeBrokerName.toUpperCase().replace(/\s+/g, '').slice(0, 4)}-${Date.now().toString().slice(-4)}-${i + 1}`,
      notes: `Carga directa de cartera completa desde ${activeBrokerName}`,
    }));

    onAddMultipleTransactions(newTransactions);
    const msg = `¡Se han cargado ${newTransactions.length} órdenes desglosadas con éxito para ${activeBrokerName}!`;
    setSaveSuccess(msg);

    if (onSuccess) {
      onSuccess(activeBrokerName, newTransactions.length);
    }
  };

  const countUSD = rows.filter(r => r.currency === 'USD').length;
  const countARS = rows.filter(r => r.currency === 'ARS').length;

  return (
    <div className="bg-white dark:bg-[#0E0D12] border border-[#E2DEE5] dark:border-[#22121C] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 transition-colors">
      
      {/* Hidden file input for CSV/TXT */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2DEE5] dark:border-[#22121C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#FF17C1]" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Carga de Cartera Entera por Broker
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Carga todas las posiciones de tu cuenta de inversión (Balanz, IOL, Binance, Interactive Brokers, Cocos, Bull Market, etc.) de una sola vez. Cada activo se guardará de forma desglosada como una orden con su ticker, cantidad y precio de compra.
          </p>
        </div>

        {/* Action button to view portfolio */}
        <button
          onClick={onGoToPortfolio}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <span>Ir a Mi Cartera</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF17C1]" />
        </button>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-400 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
            <span>{saveSuccess}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToPortfolio}
              className="px-3 py-1 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              Ver Cartera
            </button>
            <button onClick={() => setSaveSuccess(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer px-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Select Broker, Date & Destination Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#08070A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#281422]">
        
        {/* Broker Selector with brand colors */}
        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            1. Selecciona el Broker / ALyC de tu Cartera:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {brokerOptions.map(b => (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedBroker(b.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBroker === b.name
                    ? `${b.badgeClass} ring-2 ring-slate-900 dark:ring-white shadow-sm scale-105`
                    : 'bg-white dark:bg-[#15141A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#281422] hover:bg-slate-100 dark:hover:bg-[#1F1C26]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {selectedBroker === 'Otro' && (
            <input
              type="text"
              value={customBroker}
              onChange={(e) => setCustomBroker(e.target.value)}
              placeholder="Escribe el nombre del broker (ej: Bapro, Cohen, etc.)..."
              className="w-full mt-2 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        {/* Date & Destination Portfolio */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              2. Cartera de Destino:
            </label>
            <select
              value={destinationPortfolioId}
              onChange={(e) => setDestinationPortfolioId(e.target.value)}
              className="w-full bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              3. Fecha de Registro:
            </label>
            <div className="relative">
              <input
                type="date"
                value={portfolioDate}
                onChange={(e) => setPortfolioDate(e.target.value)}
                className="w-full bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Method Switcher Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex p-1 bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl text-xs font-bold">
          <button
            onClick={() => setInputMethod('grid')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              inputMethod === 'grid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Grilla de Activos ({rows.length})
          </button>
          <button
            onClick={() => setInputMethod('paste')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              inputMethod === 'paste'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pegar Tabla / Texto
          </button>
          <button
            onClick={() => setInputMethod('templates')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              inputMethod === 'templates'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Plantillas por Broker
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] border border-slate-200 dark:border-[#281422] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Importar archivo CSV o TXT exportado de tu broker"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Subir CSV / Archivo</span>
          </button>
        </div>
      </div>

      {/* MODE 1: GRID MODE (INTERACTIVE EXCEL-STYLE TABLE) */}
      {inputMethod === 'grid' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Desglose de Órdenes para {activeBrokerName}
              </span>
              <span className="text-xs text-slate-400 font-mono">({rows.length} activos)</span>
              {countUSD > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">{countUSD} en USD</span>}
              {countARS > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">{countARS} en ARS</span>}
            </div>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar Activo</span>
            </button>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto -mx-5 sm:mx-0 border border-slate-200 dark:border-[#281422] rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#08070A] border-b border-slate-200 dark:border-[#281422] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ticker</th>
                  <th className="py-2.5 px-3">Nombre / Descripción</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Cantidad / Nom.</th>
                  <th className="py-2.5 px-3 text-right">Precio Compra (PPC)</th>
                  <th className="py-2.5 px-3 text-right">Cotiz. Actual</th>
                  <th className="py-2.5 px-3">Moneda</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1C1018]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-[#15141A]/50 transition-colors">
                    
                    {/* Ticker */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.ticker}
                        onChange={(e) => handleUpdateRow(row.id, 'ticker', e.target.value.toUpperCase())}
                        placeholder="AL30, AAPL..."
                        className="w-24 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 font-mono font-bold text-xs uppercase focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.assetName}
                        onChange={(e) => handleUpdateRow(row.id, 'assetName', e.target.value)}
                        placeholder="Descripción opcional"
                        className="w-44 sm:w-56 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 truncate"
                      />
                    </td>

                    {/* Category */}
                    <td className="py-2 px-3">
                      <select
                        value={row.category}
                        onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value as AssetCategory)}
                        className="bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Acciones / CEDEAR">Acciones / CEDEAR</option>
                        <option value="Bonos / ON">Bonos / ON</option>
                        <option value="ETFs / Fondos">ETFs / Fondos</option>
                        <option value="Criptomonedas">Criptomonedas</option>
                        <option value="Commodities">Commodities</option>
                        <option value="Liquidez / Cash">Liquidez / Cash</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => handleUpdateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-right font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Avg Buy Price (PPC) */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.avgBuyPrice}
                        onChange={(e) => handleUpdateRow(row.id, 'avgBuyPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-right font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Current Market Price */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.currentPrice}
                        onChange={(e) => handleUpdateRow(row.id, 'currentPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Currency */}
                    <td className="py-2 px-3">
                      <select
                        value={row.currency}
                        onChange={(e) => handleUpdateRow(row.id, 'currency', e.target.value as Currency)}
                        className="bg-white dark:bg-[#15141A] border border-slate-200 dark:border-[#281422] rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                        <option value="EUR">EUR</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </td>

                    {/* Delete button */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar posición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Footer Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddRow}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1F1C26] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar otra fila</span>
              </button>

              <button
                onClick={() => setRows([])}
                className="px-3 py-2 text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>

            {/* Primary Save All Button */}
            <button
              onClick={handleSaveEntirePortfolio}
              disabled={rows.length === 0}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#FF17C1] text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Cartera Entera ({rows.length} órdenes desglosadas en {activeBrokerName})</span>
            </button>
          </div>

        </div>
      )}

      {/* MODE 2: PASTE RAW TEXT / SPREADSHEET TABLE */}
      {inputMethod === 'paste' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Pega el texto copiado de la pantalla de tu broker:
            </span>
            <p className="text-xs text-slate-400">
              Copia las filas de la tabla de tu cuenta en Balanz, IOL, Bull Market, Cocos o Binance y pégalas aquí. Nuestro reconocedor extraerá automáticamente Ticker, Cantidades y Precios.
            </p>
          </div>

          <textarea
            rows={7}
            value={pasteRawText}
            onChange={(e) => setPasteRawText(e.target.value)}
            placeholder="Ejemplo copiado del broker:
AL30	1500	58.5	Bono Rep Argentina
GD30	800	62.0	Bono Global 2030
AAPL	25	19800	Apple Inc CEDEAR
SPY	15	32500	SPDR S&P 500"
            className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl p-4 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={handleParsePastedText}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Analizar y Cargar en Grilla</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: PRE-CONFIGURED TEMPLATES */}
      {inputMethod === 'templates' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Carga una cartera típica con un solo clic:
            </span>
            <p className="text-xs text-slate-400">
              Selecciona cualquiera de estas plantillas prearmadas con cotizaciones reales para probar o personalizar con tus cantidades.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              onClick={() => handleLoadTemplate('balanz')}
              className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">Cartera Balanz (Soberanos & ONs)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">AL30, GD30, ON YPF Clase XVI y Fondo Balanz Ahorro.</p>
              <span className="text-[10px] font-mono text-blue-500 font-bold block pt-1">Cargar plantilla →</span>
            </div>

            <div 
              onClick={() => handleLoadTemplate('iol')}
              className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">Cartera IOL (Líderes & CEDEARs)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Galicia (GGAL), YPF (YPFD), SPY y QQQ.</p>
              <span className="text-[10px] font-mono text-purple-500 font-bold block pt-1">Cargar plantilla →</span>
            </div>

            <div 
              onClick={() => handleLoadTemplate('binance')}
              className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 block">Cartera Binance (Cripto & Earn)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Bitcoin (BTC), Ethereum (ETH), Solana (SOL) y USDT.</p>
              <span className="text-[10px] font-mono text-yellow-600 font-bold block pt-1">Cargar plantilla →</span>
            </div>

            <div 
              onClick={() => handleLoadTemplate('bullmarket')}
              className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block">Cartera Bull Market (Tech & CER)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">MercadoLibre (MELI), Nvidia (NVDA) y Bono Boncer TX26.</p>
              <span className="text-[10px] font-mono text-orange-600 font-bold block pt-1">Cargar plantilla →</span>
            </div>

            <div 
              onClick={() => handleLoadTemplate('cocos')}
              className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 hover:border-violet-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">Cartera Cocos Capital (Trading D)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">AL30D cable, Pampa Energía y Vista Energy.</p>
              <span className="text-[10px] font-mono text-violet-500 font-bold block pt-1">Cargar plantilla →</span>
            </div>

            <div 
              onClick={() => handleLoadTemplate('ibkr')}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:border-red-500 transition-all cursor-pointer space-y-1.5"
            >
              <span className="text-xs font-bold text-red-600 dark:text-red-400 block">Cartera IBKR (Global & ETFs)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">VOO (S&P 500), Microsoft, Amazon y TLT.</p>
              <span className="text-[10px] font-mono text-red-500 font-bold block pt-1">Cargar plantilla →</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
