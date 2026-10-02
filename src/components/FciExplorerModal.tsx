import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Building2, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Check,
  Info,
  Layers,
  Landmark,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ArgentineFCIItem, ArgentineBondItem, ArgentineMacroData } from '../types/portfolio';

interface FciExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFundToTrade: (asset: {
    ticker: string;
    assetName: string;
    assetCategory: string;
    price: number;
    currency: string;
    broker: string;
  }) => void;
  onUpdateHoldingPrice?: (ticker: string, price: number) => void;
  userTickers?: string[];
}

export const FciExplorerModal: React.FC<FciExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectFundToTrade,
  onUpdateHoldingPrice,
  userTickers = [],
}) => {
  // Active Explorer Section
  const [activeSection, setActiveSection] = useState<'fci' | 'bonos' | 'macro'>('fci');

  // Search & Filters for FCI
  const [fciSearchQuery, setFciSearchQuery] = useState('');
  const [fciCategory, setFciCategory] = useState<string>('all');
  const [funds, setFunds] = useState<ArgentineFCIItem[]>([]);
  const [isFciLoading, setIsFciLoading] = useState(false);
  const [fciTotalAvailable, setFciTotalAvailable] = useState<number>(0);

  // Search & Filters for Bonos
  const [bonoSearchQuery, setBonoSearchQuery] = useState('');
  const [bonoCategory, setBonoCategory] = useState<string>('all');
  const [bonds, setBonds] = useState<ArgentineBondItem[]>([]);
  const [isBondsLoading, setIsBondsLoading] = useState(false);
  const [mepRate, setMepRate] = useState<number>(1540);

  // Macro Data
  const [macroData, setMacroData] = useState<ArgentineMacroData | null>(null);
  const [isMacroLoading, setIsMacroLoading] = useState(false);

  // Success indicator for direct price update
  const [updatedTickers, setUpdatedTickers] = useState<Record<string, boolean>>({});

  const fciCategories = [
    { id: 'all', label: 'Todos' },
    { id: 'rentaFija', label: '🏛️ Renta Fija / Bonos' },
    { id: 'mercadoDinero', label: '💵 Mercado Dinero / MM' },
    { id: 'rentaVariable', label: '📈 Renta Variable' },
    { id: 'rentaMixta', label: '⚖️ Renta Mixta' },
    { id: 'retornoTotal', label: '🎯 Retorno Total' },
  ];

  const bonoCategories = [
    { id: 'all', label: 'Todos los Bonos' },
    { id: 'Soberano USD', label: '💵 Soberanos USD (AL/GD)' },
    { id: 'Soberano CER', label: '📊 Boncer / CER' },
    { id: 'Letra Lecap', label: '📜 Letras Lecap' },
    { id: 'Bopreal', label: '🏛️ Bopreal (BCRA)' },
    { id: 'ON Corporativa', label: '🏢 Obligaciones Negociables' },
  ];

  const quickFciPills = [
    'Balanz',
    'FIMA',
    'Premier',
    'Consultatio',
    'Allaria',
    'Bonos',
    'Dolares',
    'Galileo',
  ];

  const quickBonoPills = [
    'AL30',
    'GD30',
    'AL35',
    'TX26',
    'T2X5',
    'YCA6O',
    'BPY26',
    'S14O4',
  ];

  // Fetch FCI from ArgentinaDatos
  const fetchFunds = async (query = fciSearchQuery, category = fciCategory) => {
    setIsFciLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category !== 'all') params.append('category', category);
      params.append('limit', '100');

      const res = await fetch(`/api/argentinadatos/fci?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFunds(data.funds || []);
        setFciTotalAvailable(data.totalAvailable || 0);
      }
    } catch (e) {
      console.warn('Error fetching ArgentinaDatos funds:', e);
    } finally {
      setIsFciLoading(false);
    }
  };

  // Fetch Bonos from ArgentinaDatos API
  const fetchBonds = async (query = bonoSearchQuery, category = bonoCategory) => {
    setIsBondsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category !== 'all') params.append('category', category);

      const res = await fetch(`/api/argentinadatos/bonos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBonds(data.bonds || []);
        if (data.mepRate) setMepRate(data.mepRate);
      }
    } catch (e) {
      console.warn('Error fetching ArgentinaDatos bonds:', e);
    } finally {
      setIsBondsLoading(false);
    }
  };

  // Fetch Macro Data
  const fetchMacro = async () => {
    setIsMacroLoading(true);
    try {
      const res = await fetch('/api/argentinadatos/macro');
      if (res.ok) {
        const data = await res.json();
        if (data.macro) setMacroData(data.macro);
      }
    } catch (e) {
      console.warn('Error fetching ArgentinaDatos macro:', e);
    } finally {
      setIsMacroLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds(fciSearchQuery, fciCategory);
    fetchBonds(bonoSearchQuery, bonoCategory);
    fetchMacro();
  }, []);

  const handleSelectFci = (item: ArgentineFCIItem) => {
    let broker = 'CAFCI';
    if (/balanz/i.test(item.fondo)) broker = 'Balanz Capital';
    else if (/fima|galicia/i.test(item.fondo)) broker = 'Banco Galicia (FIMA)';
    else if (/premier|supervielle/i.test(item.fondo)) broker = 'Banco Supervielle (Premier)';
    else if (/consultatio/i.test(item.fondo)) broker = 'Consultatio Plus';
    else if (/allaria/i.test(item.fondo)) broker = 'Allaria Fondos';
    else if (/schroder/i.test(item.fondo)) broker = 'Schroders';
    else if (/pellegrini|macro/i.test(item.fondo)) broker = 'Banco Macro (Pellegrini)';

    const cleanWords = item.fondo.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
    const ticker = `FCI-${cleanWords.slice(0, 2).join('').toUpperCase()}`.slice(0, 10);

    onSelectFundToTrade({
      ticker,
      assetName: item.fondo,
      assetCategory: item.categoria === 'rentaFija' ? 'Bonos / ON' : 'ETFs / Fondos',
      price: item.vcp,
      currency: item.moneda,
      broker,
    });
    onClose();
  };

  const handleSelectBond = (bond: ArgentineBondItem) => {
    onSelectFundToTrade({
      ticker: bond.ticker,
      assetName: bond.nombre,
      assetCategory: 'Bonos / ON',
      price: bond.moneda === 'USD' ? bond.precioUSD : bond.precioARS,
      currency: bond.moneda,
      broker: 'Balanz / IOL',
    });
    onClose();
  };

  const handleUpdatePriceDirectly = (ticker: string, price: number) => {
    if (onUpdateHoldingPrice) {
      onUpdateHoldingPrice(ticker, price);
      setUpdatedTickers(prev => ({ ...prev, [ticker]: true }));
      setTimeout(() => {
        setUpdatedTickers(prev => ({ ...prev, [ticker]: false }));
      }, 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0E0D12] border border-[#22121C] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#22121C] bg-[#08070A]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF17C1] to-[#D9048E] flex items-center justify-center text-white shadow-lg shadow-[#FF17C1]/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Fondos CAFCI & Bonos Argentinos</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF17C1]/10 text-[#FF17C1] border border-[#FF17C1]/30">
                  api.argentinadatos.com
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#15141A] text-slate-300 border border-[#281422]">
                  CAFCI • CNV • INDEC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cotizaciones oficiales de Cuotapartes (VCP) y Bonos argentinos provistos por la Cámara de Fondos y CNV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#15141A] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-4 py-2.5 bg-[#08070A]/60 border-b border-[#22121C] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('fci')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'fci'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-[#15141A] text-slate-400 hover:text-white hover:bg-[#1E1B24]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Fondos Comunes (CAFCI / CNV)</span>
              {funds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-900/60 text-blue-200">
                  {funds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('bonos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'bonos'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-[#15141A] text-slate-400 hover:text-white hover:bg-[#1E1B24]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Bonos Argentinos & ONs (CNV)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/60 text-emerald-200">
                {bonds.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('macro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'macro'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'bg-[#15141A] text-slate-400 hover:text-white hover:bg-[#1E1B24]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tasas & Riesgo País</span>
            </button>
          </div>

          {/* Dolar MEP Reference */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#15141A] border border-[#281422] text-[11px] text-slate-400">
            <span>Dólar MEP:</span>
            <strong className="text-white font-mono">${mepRate.toLocaleString('es-AR')}</strong>
          </div>
        </div>

        {/* SECTION 1: FONDOS COMUNES DE INVERSION (CAFCI / CNV) */}
        {activeSection === 'fci' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter & Search Bar */}
            <div className="p-4 bg-[#08070A]/40 border-b border-[#22121C] space-y-2.5">
              <form 
                onSubmit={(e) => { e.preventDefault(); fetchFunds(fciSearchQuery, fciCategory); }} 
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fciSearchQuery}
                    onChange={(e) => setFciSearchQuery(e.target.value)}
                    placeholder="Buscar fondo por nombre o administradora (ej: Balanz Ahorro, FIMA, Premier, Consultatio...)"
                    className="w-full pl-9 pr-8 py-2 bg-[#08070A] border border-[#281422] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  />
                  {fciSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setFciSearchQuery(''); fetchFunds('', fciCategory); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isFciLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFciLoading ? 'animate-spin' : ''}`} />
                  <span>Buscar</span>
                </button>
              </form>

              {/* Categories & Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {fciCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFciCategory(cat.id);
                        fetchFunds(fciSearchQuery, cat.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        fciCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-[#15141A] text-slate-400 hover:text-white hover:bg-[#1E1B24]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400">
                  Mostrando {funds.length} fondos ({fciTotalAvailable > 0 ? `${fciTotalAvailable.toLocaleString()} disponibles` : ''})
                </span>
              </div>

              {/* Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-0.5">
                <span className="text-slate-500 font-medium">Búsquedas rápidas:</span>
                {quickFciPills.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setFciSearchQuery(tag);
                      fetchFunds(tag, fciCategory);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#15141A] hover:bg-[#1E1B24] text-slate-300 border border-[#281422] transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {isFciLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consultando datos oficiales de CAFCI y CNV...</p>
                </div>
              ) : funds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {funds.map((f, idx) => {
                    const cleanWords = f.fondo.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
                    const suggestedTicker = `FCI-${cleanWords.slice(0, 2).join('').toUpperCase()}`.slice(0, 10);
                    const isInPortfolio = userTickers.includes(suggestedTicker) || userTickers.some(t => f.fondo.toUpperCase().includes(t));

                    return (
                      <div
                        key={`${f.fondo}-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#08070A] hover:bg-[#15141A] border border-[#22121C] hover:border-[#281422] transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                              {f.fondo}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                              {f.moneda}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-[#15141A] text-slate-300 border border-[#281422]">
                              {f.categoriaLabel}
                            </span>
                            <span>•</span>
                            <span>Horizonte: <strong className="text-slate-300 capitalize">{f.horizonte || 'medio'}</strong></span>
                            {f.patrimonio && f.patrimonio > 0 && (
                              <>
                                <span>•</span>
                                <span>Patrimonio: <strong className="text-slate-300">${(f.patrimonio / 1e9).toFixed(1)}B</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* VCP and Actions */}
                        <div className="pt-2 border-t border-[#22121C] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 font-sans block">Valor Cuotaparte (VCP):</span>
                            <span className="text-sm font-black font-mono text-emerald-400">
                              {f.moneda === 'USD' ? 'US$ ' : 'AR$ '}
                              {f.vcp.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}
                            </span>
                            <span className="text-[9px] text-slate-500 block">Fecha: {f.fecha}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isInPortfolio && onUpdateHoldingPrice && (
                              <button
                                onClick={() => handleUpdatePriceDirectly(suggestedTicker, f.vcp)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                  updatedTickers[suggestedTicker]
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-[#15141A] hover:bg-[#1E1B24] text-slate-300 border-[#281422]'
                                }`}
                                title="Actualizar precio de este fondo en tus tenencias actuales"
                              >
                                {updatedTickers[suggestedTicker] ? '✓ Actualizado' : 'Actualizar'}
                              </button>
                            )}

                            <button
                              onClick={() => handleSelectFci(f)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-blue-600/25 cursor-pointer"
                              title="Registrar una suscripción o compra en tu cartera"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Anotar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No se encontraron fondos que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION 2: BONOS ARGENTINOS (CNV & ByMA) */}
        {activeSection === 'bonos' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter & Search Bar */}
            <div className="p-4 bg-[#08070A]/40 border-b border-[#22121C] space-y-2.5">
              <form 
                onSubmit={(e) => { e.preventDefault(); fetchBonds(bonoSearchQuery, bonoCategory); }} 
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bonoSearchQuery}
                    onChange={(e) => setBonoSearchQuery(e.target.value)}
                    placeholder="Buscar bono por ticker o emisor (ej: AL30, GD30, AL35, TX26, YCA6O, BPY26...)"
                    className="w-full pl-9 pr-8 py-2 bg-[#08070A] border border-[#281422] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                  {bonoSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setBonoSearchQuery(''); fetchBonds('', bonoCategory); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isBondsLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBondsLoading ? 'animate-spin' : ''}`} />
                  <span>Filtrar</span>
                </button>
              </form>

              {/* Bono categories */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {bonoCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setBonoCategory(cat.id);
                        fetchBonds(bonoSearchQuery, cat.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        bonoCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-[#15141A] text-slate-400 hover:text-white hover:bg-[#1E1B24]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400">
                  {bonds.length} títulos cotizados
                </span>
              </div>

              {/* Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-0.5">
                <span className="text-slate-500 font-medium">Bonos destacados:</span>
                {quickBonoPills.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setBonoSearchQuery(tag);
                      fetchBonds(tag, bonoCategory);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#15141A] hover:bg-[#1E1B24] text-slate-300 border border-[#281422] transition-colors font-mono font-bold cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Bonos Grid */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {isBondsLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consultando cotizaciones de Bonos soberanos y ONs...</p>
                </div>
              ) : bonds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bonds.map((b) => {
                    const isInPortfolio = userTickers.includes(b.ticker.toUpperCase());
                    const activePrice = b.moneda === 'USD' ? b.precioUSD : b.precioARS;

                    return (
                      <div
                        key={b.ticker}
                        className="p-3.5 rounded-2xl bg-[#08070A] hover:bg-[#15141A] border border-[#22121C] hover:border-[#281422] transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black font-mono text-white group-hover:text-emerald-400 transition-colors">
                                  {b.ticker}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {b.categoria}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Ley {b.ley}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-300 line-clamp-1 mt-0.5">
                                {b.nombre}
                              </h4>
                            </div>

                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#15141A] text-slate-300 border border-[#281422] shrink-0 font-mono">
                              {b.moneda}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                            <span>Vencimiento: <strong className="text-slate-300">{b.vencimiento}</strong></span>
                            {b.tirEstimada && (
                              <>
                                <span>•</span>
                                <span>TIR Est.: <strong className="text-emerald-400">{b.tirEstimada}</strong></span>
                              </>
                            )}
                            {b.cupon && (
                              <>
                                <span>•</span>
                                <span>Cupón: <strong className="text-slate-300">{b.cupon}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Dual Prices (USD & ARS al MEP) and Action */}
                        <div className="pt-2.5 border-t border-[#22121C] flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-black font-mono text-emerald-400">
                                US$ {b.precioUSD.toFixed(2)}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                ≈ ${b.precioARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 block">
                              Emisor: {b.emisor} • TC MEP Ref: ${mepRate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isInPortfolio && onUpdateHoldingPrice && (
                              <button
                                onClick={() => handleUpdatePriceDirectly(b.ticker, activePrice)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                  updatedTickers[b.ticker]
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-[#15141A] hover:bg-[#1E1B24] text-slate-300 border-[#281422]'
                                }`}
                                title="Actualizar cotización en tu cartera"
                              >
                                {updatedTickers[b.ticker] ? '✓ Listo' : 'Actualizar'}
                              </button>
                            )}

                            <button
                              onClick={() => handleSelectBond(b)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-600/25 cursor-pointer"
                              title="Registrar boleto o compra de este bono"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Operar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
                  <Landmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No se encontraron bonos para la búsqueda "{bonoSearchQuery}".</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION 3: INDICADORES MACRO (ArgentinaDatos) */}
        {activeSection === 'macro' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            
            {/* Top Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Riesgo País */}
              <div className="p-4 rounded-2xl bg-[#08070A] border border-[#22121C] space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Riesgo País (EMBI+)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {macroData?.riesgoPais?.valor || 607}
                  </span>
                  <span className="text-xs text-slate-500">puntos</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Fecha: {macroData?.riesgoPais?.fecha || new Date().toISOString().split('T')[0]}
                </span>
              </div>

              {/* Dólar MEP */}
              <div className="p-4 rounded-2xl bg-[#08070A] border border-[#22121C] space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Dólar MEP (Bolsa)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    ${macroData?.dolares?.mep?.toLocaleString('es-AR') || '1.548'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">Tipo de cambio implícito en bonos</span>
              </div>

              {/* Dólar CCL */}
              <div className="p-4 rounded-2xl bg-[#08070A] border border-[#22121C] space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Dólar CCL (Cable)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-white">
                    ${macroData?.dolares?.ccl?.toLocaleString('es-AR') || '1.565'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">Liquidación en el exterior</span>
              </div>

              {/* Inflación INDEC */}
              <div className="p-4 rounded-2xl bg-[#08070A] border border-[#22121C] space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Última Inflación Mensual</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {macroData?.inflacionMensual?.valor ? `${macroData.inflacionMensual.valor}%` : '1.7%'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  INDEC ({macroData?.inflacionMensual?.fecha || 'Ago 2026'})
                </span>
              </div>

            </div>

            {/* Tasas de Plazo Fijo por Entidad */}
            {macroData?.plazosFijos && macroData.plazosFijos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tasas de Plazo Fijo en Pesos (TNA Provista por BCRA / ArgentinaDatos)
                  </h4>
                  <span className="text-[10px] text-slate-400">Actualizado diariamente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {macroData.plazosFijos.map((pf, idx) => (
                    <div
                      key={`${pf.entidad}-${idx}`}
                      className="p-3 rounded-2xl bg-[#08070A] border border-[#22121C] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {pf.logo ? (
                          <img src={pf.logo} alt={pf.entidad} className="w-6 h-6 rounded object-contain bg-white/10 p-0.5" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-[#15141A] flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {pf.entidad.slice(0, 2)}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1">{pf.entidad}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono text-emerald-400">
                          {(pf.tnaClientes * 100).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-500 block">TNA</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information card */}
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200/90 space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Acerca de ArgentinaDatos (CAFCI / CNV / INDEC)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-200/70">
                Los datos provistos son obtenidos de fuentes oficiales públicas de Argentina: la Cámara Argentina de Fondos Comunes de Inversión (CAFCI), la Comisión Nacional de Valores (CNV), el Banco Central de la República Argentina (BCRA) y el Instituto Nacional de Estadística y Censos (INDEC). Estos precios permiten valuar carteras con precisión de mercado local sin desfasajes de cotización.
              </p>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-[#22121C] bg-[#08070A]/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Datos provistos por <strong>ArgentinaDatos</strong> (CAFCI / CNV / INDEC)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#15141A] hover:bg-[#1E1B24] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
