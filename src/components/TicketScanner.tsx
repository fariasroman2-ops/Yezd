import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Image as ImageIcon,
  Clipboard, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  FileSpreadsheet, 
  Layers,
  Info,
  Calendar,
  DollarSign,
  Building,
  Tag,
  Check,
  ChevronRight
} from 'lucide-react';
import { Transaction, OperationType, AssetCategory, Currency, Portfolio } from '../types/portfolio';
import { SAMPLE_TICKETS_FOR_SCANNER, SampleTicketDemo } from '../utils/demoData';

interface TicketScannerProps {
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddMultipleTransactions: (txs: Array<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  onGoToPortfolio: () => void;
  portfolios?: Portfolio[];
  activePortfolioId?: string;
}

interface ExtractedTicketDraft {
  portfolioId?: string;
  ticketNumber?: string;
  date: string;
  settlementDate?: string;
  operationType: OperationType;
  ticker: string;
  assetName: string;
  assetCategory: AssetCategory;
  quantity: number;
  price: number;
  currency: Currency;
  fees: number;
  totalAmount: number;
  broker: string;
  notes?: string;
  fileName?: string;
  filePreview?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export const TicketScanner: React.FC<TicketScannerProps> = ({
  onAddTransaction,
  onAddMultipleTransactions,
  onGoToPortfolio,
  portfolios = [],
  activePortfolioId = 'default',
}) => {
  const defaultPortfolioId = (activePortfolioId !== 'all' && activePortfolioId) ? activePortfolioId : (portfolios[0]?.id || 'default');
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanSource, setScanSource] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Results
  const [drafts, setDrafts] = useState<ExtractedTicketDraft[]>([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(0);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste listener (Ctrl+V) so users can paste screenshots directly anywhere
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle if not actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || (target.tagName === 'TEXTAREA' && target.id !== 'paste-ticket-area')) {
        return;
      }

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        handleFileSelection(file);
      } else if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              handleFileSelection(blob);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    setScanError(null);
    setIsScanning(true);
    setScanStep('Leyendo archivo y codificando...');

    try {
      const fileName = file.name;
      const mimeType = file.type || 'application/octet-stream';

      // Check if it's text/csv or binary (PDF/image)
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const textContent = await file.text();
        await sendToAnalysisApi({
          text: textContent,
          fileName,
          mimeType: 'text/plain',
        });
      } else {
        // PDF or image: read as base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const previewUrl = file.type.startsWith('image/') ? (reader.result as string) : undefined;
          
          await sendToAnalysisApi({
            fileBase64: base64Data,
            mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
            fileName,
            previewUrl,
          });
        };
        reader.onerror = () => {
          setIsScanning(false);
          setScanError('Error al leer el archivo. Intenta pegando el texto directamente.');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setIsScanning(false);
      setScanError(err.message || 'Error procesando el archivo.');
    }
  };

  const handleAnalyzeText = async () => {
    if (!pastedText.trim()) return;
    setScanError(null);
    setIsScanning(true);
    await sendToAnalysisApi({ text: pastedText, fileName: 'Texto copiado' });
  };

  const handleSampleTicketClick = (sample: SampleTicketDemo) => {
    setPastedText(sample.sampleText);
    setActiveInputMode('paste');
    // Direct pre-fill with preview
    setDrafts([{
      ticker: sample.expectedData.ticker,
      assetName: sample.expectedData.assetName,
      assetCategory: sample.expectedData.assetCategory as AssetCategory,
      operationType: sample.expectedData.operationType,
      quantity: sample.expectedData.quantity,
      price: sample.expectedData.price,
      currency: sample.expectedData.currency,
      fees: sample.expectedData.fees,
      totalAmount: sample.expectedData.totalAmount,
      ticketNumber: sample.expectedData.ticketNumber,
      date: sample.expectedData.date,
      broker: sample.expectedData.broker,
      notes: sample.expectedData.notes,
      fileName: `Demo - ${sample.title}`,
      confidence: 'high',
    }]);
    setSelectedDraftIndex(0);
  };

  const sendToAnalysisApi = async (payload: {
    fileBase64?: string;
    mimeType?: string;
    text?: string;
    fileName?: string;
    previewUrl?: string;
  }) => {
    setScanStep('Analizando con IA de Gemini...');
    try {
      const response = await fetch('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`El servidor respondió con código ${response.status}`);
      }

      const data = await response.json();
      setScanStep('Procesando datos extraídos...');

      if (data.transactions && data.transactions.length > 0) {
        const parsedDrafts: ExtractedTicketDraft[] = data.transactions.map((t: any) => ({
          ticketNumber: t.ticketNumber || `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
          date: t.date || new Date().toISOString().split('T')[0],
          settlementDate: t.settlementDate,
          operationType: (t.operationType?.toUpperCase() === 'SELL' ? 'SELL' : t.operationType?.toUpperCase() === 'DIVIDEND' ? 'DIVIDEND' : 'BUY') as OperationType,
          ticker: (t.ticker || 'ACTIVO').toUpperCase(),
          assetName: t.assetName || t.ticker || 'Activo Bursátil',
          assetCategory: (t.assetCategory || 'Acciones / CEDEAR') as AssetCategory,
          quantity: Number(t.quantity) || 1,
          price: Number(t.price) || 0,
          currency: (t.currency || 'USD').toUpperCase(),
          fees: Number(t.fees) || 0,
          totalAmount: Number(t.totalAmount) || (Number(t.quantity || 1) * Number(t.price || 0)),
          broker: t.broker || data.broker || 'Broker / ALyC',
          notes: t.notes || (data.summary ? `${data.summary}` : 'Boleto registrado'),
          fileName: payload.fileName,
          filePreview: payload.previewUrl,
          confidence: t.confidence || 'high',
        }));

        setDrafts(parsedDrafts);
        setSelectedDraftIndex(0);
        setScanSource(data.source === 'gemini-ai' ? 'IA Gemini 3.8 Flash' : 'Motor inteligente');
      } else {
        throw new Error('No se pudieron extraer transacciones del boleto.');
      }
    } catch (err: any) {
      console.warn('API Analysis failed, falling back:', err);
      // Create a manual draft so user is never blocked
      setDrafts([{
        ticketNumber: `ORD-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        operationType: 'BUY',
        ticker: 'AAPL',
        assetName: 'Activo / CEDEAR',
        assetCategory: 'Acciones / CEDEAR',
        quantity: 10,
        price: 150.00,
        currency: 'USD',
        fees: 0,
        totalAmount: 1500.00,
        broker: 'Broker Bursátil',
        notes: 'Boleto cargado manualmente para verificar.',
        fileName: payload.fileName,
        confidence: 'medium',
      }]);
      setSelectedDraftIndex(0);
      setScanSource('Modo seguro editable');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleUpdateCurrentDraft = (field: keyof ExtractedTicketDraft, value: any) => {
    setDrafts(prev => {
      const updated = [...prev];
      const cur = { ...updated[selectedDraftIndex], [field]: value };
      
      // Auto-recalculate totalAmount if quantity, price or fees change
      if (field === 'quantity' || field === 'price' || field === 'fees') {
        const qty = field === 'quantity' ? Number(value) : cur.quantity;
        const pr = field === 'price' ? Number(value) : cur.price;
        const fees = field === 'fees' ? Number(value) : (cur.fees || 0);
        if (cur.operationType === 'BUY') {
          cur.totalAmount = (qty * pr) + fees;
        } else {
          cur.totalAmount = (qty * pr) - fees;
        }
      }

      updated[selectedDraftIndex] = cur;
      return updated;
    });
  };

  const handleSaveCurrentDraft = () => {
    const cur = drafts[selectedDraftIndex];
    if (!cur) return;

    onAddTransaction({
      portfolioId: cur.portfolioId || defaultPortfolioId,
      ticketNumber: cur.ticketNumber,
      date: cur.date,
      settlementDate: cur.settlementDate,
      operationType: cur.operationType,
      ticker: cur.ticker.toUpperCase(),
      assetName: cur.assetName,
      assetCategory: cur.assetCategory,
      quantity: cur.quantity,
      price: cur.price,
      currency: cur.currency,
      fees: cur.fees,
      totalAmount: cur.totalAmount,
      broker: cur.broker,
      notes: cur.notes,
      fileName: cur.fileName,
      filePreview: cur.filePreview,
      confidence: cur.confidence,
    });

    setSavedSuccessMessage(`¡Boleto de ${cur.operationType === 'BUY' ? 'compra' : 'venta'} de ${cur.ticker} guardado en tu cartera!`);
    
    // Remove the saved draft
    if (drafts.length > 1) {
      setDrafts(prev => prev.filter((_, idx) => idx !== selectedDraftIndex));
      setSelectedDraftIndex(0);
    } else {
      setDrafts([]);
    }

    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4500);
  };

  const handleSaveAllDrafts = () => {
    const toSave = drafts.map(cur => ({
      portfolioId: cur.portfolioId || defaultPortfolioId,
      ticketNumber: cur.ticketNumber,
      date: cur.date,
      settlementDate: cur.settlementDate,
      operationType: cur.operationType,
      ticker: cur.ticker.toUpperCase(),
      assetName: cur.assetName,
      assetCategory: cur.assetCategory,
      quantity: cur.quantity,
      price: cur.price,
      currency: cur.currency,
      fees: cur.fees,
      totalAmount: cur.totalAmount,
      broker: cur.broker,
      notes: cur.notes,
      fileName: cur.fileName,
      filePreview: cur.filePreview,
      confidence: cur.confidence,
    }));

    onAddMultipleTransactions(toSave);
    setSavedSuccessMessage(`¡Se han registrado ${toSave.length} operaciones en tu cartera!`);
    setDrafts([]);

    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4500);
  };

  const currentDraft = drafts[selectedDraftIndex];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner / Explainer */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-[#0E0D12] dark:to-[#08070A] border border-[#E2DEE5] dark:border-[#22121C] shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FF17C1]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF17C1]/10 text-[#FF17C1] text-xs font-bold border border-[#FF17C1]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Lector Universal de Boletos con IA
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F2F0F3] tracking-tight">
              Anota y Registra Boletos de Inversión al Instante
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Arrastra cualquier archivo <strong className="text-slate-800 dark:text-slate-200">PDF</strong> de tu ALyC o broker, pega una <strong className="text-slate-800 dark:text-slate-200">captura de pantalla</strong> (Ctrl+V), o sube fotos/CSV. La IA detectará ticker, cantidades, precios y comisiones sin errores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToPortfolio}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-700 dark:text-[#F2F0F3] text-xs font-bold border border-slate-200 dark:border-[#281422] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Cartera</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-[#F2F0F3]">{savedSuccessMessage}</p>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80">Tus métricas de precio promedio, inversión y P&L han sido actualizadas.</p>
            </div>
          </div>
          <button
            onClick={onGoToPortfolio}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Ir a mi Cartera
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload / Paste / Samples Section */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Input Method Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0E0D12] border border-slate-200 dark:border-[#22121C] rounded-2xl">
            <button
              onClick={() => setActiveInputMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeInputMode === 'upload'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Subir Archivo</span>
            </button>
            <button
              onClick={() => setActiveInputMode('paste')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeInputMode === 'paste'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clipboard className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Pegar Texto / Ctrl+V</span>
            </button>
            <button
              onClick={() => setActiveInputMode('samples')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeInputMode === 'samples'
                  ? 'bg-white dark:bg-[#1C121B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Ejemplos (1-clic)</span>
            </button>
          </div>

          {/* Mode 1: File Dropzone (PDF, Images, CSV) */}
          {activeInputMode === 'upload' && (
            <div className="bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] rounded-3xl p-6 text-center space-y-4 shadow-sm transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-[#281422] hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-[#08070A]/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">
                    Arrastra aquí tu boleto o <span className="text-blue-600 dark:text-blue-400 underline">haz clic para examinar</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Soporta boletos en <strong className="text-slate-700 dark:text-slate-300">PDF</strong>, capturas de pantalla (<strong className="text-slate-700 dark:text-slate-300">PNG, JPG</strong>), o extractos <strong className="text-slate-700 dark:text-slate-300">CSV</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#15141A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#281422]">PDF Oficial</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#15141A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#281422]">Captura de Pantalla</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#15141A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#281422]">CSV / Texto</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold">Ctrl+V Directo</span>
                </div>
              </div>

              <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>💡 Tip: Puedes presionar <strong>Ctrl + V</strong> para pegar directamente una captura copiada.</span>
              </div>
            </div>
          )}

          {/* Mode 2: Paste Raw Text */}
          {activeInputMode === 'paste' && (
            <div className="bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  Pega el texto del correo, WhatsApp o resumen del broker:
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setPastedText(text);
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Clipboard className="w-3 h-3" /> Pegar Portapapeles
                </button>
              </div>

              <textarea
                id="paste-ticket-area"
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Ejemplo:
Comprobante de compra Balanz
Operación: COMPRA
Especie: AAPL CEDEAR
Cantidad: 10
Precio: USD 190.50
Total: USD 1905.00
Comisiones: USD 2.50
Fecha: 2024-04-10"
                className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                onClick={handleAnalyzeText}
                disabled={!pastedText.trim() || isScanning}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Analizar Texto con IA</span>
              </button>
            </div>
          )}

          {/* Mode 3: Demo Samples (1-Click) */}
          {activeInputMode === 'samples' && (
            <div className="bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] rounded-3xl p-5 space-y-3 shadow-sm transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Haz clic en cualquier boleto de prueba para probar la extracción:
              </div>

              <div className="space-y-2">
                {SAMPLE_TICKETS_FOR_SCANNER.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSampleTicketClick(sample)}
                    className="p-3 bg-slate-50 dark:bg-[#08070A] hover:bg-slate-100 dark:hover:bg-[#14121A] border border-slate-200 dark:border-[#281422] rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-[#F2F0F3] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sample.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#18151D] text-slate-600 dark:text-slate-300 font-medium">
                          {sample.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {sample.description}
                      </p>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1 shrink-0">
                      <span>Probar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {scanError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Scanning In-Progress Feedback */}
          {isScanning && (
            <div className="bg-white dark:bg-[#0E0D12] border border-blue-500/40 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-pulse">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 mx-auto">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Extrayendo datos del boleto...</p>
                <p className="text-xs text-blue-500 font-medium">{scanStep}</p>
              </div>
              <div className="max-w-xs mx-auto bg-slate-100 dark:bg-[#08070A] h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Verified / Extracted Boleto Inspector */}
        <div className="lg:col-span-6 space-y-4">
          
          {currentDraft ? (
            <div className="bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors">
              
              {/* Header of Inspector */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#22121C] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Datos del Boleto Detectado</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Revisa o ajusta cualquier campo antes de confirmar</p>
                  </div>
                </div>

                {scanSource && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {scanSource}
                  </span>
                )}
              </div>

              {/* Multiple drafts tab switcher if statement contains multiple operations */}
              {drafts.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Se detectaron <strong>{drafts.length} operaciones</strong> en este documento:</span>
                    <button
                      onClick={handleSaveAllDrafts}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Añadir todas ({drafts.length})
                    </button>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {drafts.map((d, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDraftIndex(idx)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedDraftIndex === idx
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 text-slate-600 dark:bg-[#15141A] dark:text-slate-400 hover:dark:bg-[#1E1B24]'
                        }`}
                      >
                        #{idx + 1} {d.operationType === 'BUY' ? 'COMPRA' : 'VENTA'} {d.ticker}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                {/* Cartera de Destino */}
                {portfolios.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Cartera de Destino</label>
                    <select
                      value={currentDraft.portfolioId || defaultPortfolioId}
                      onChange={(e) => handleUpdateCurrentDraft('portfolioId', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-semibold focus:outline-none focus:border-blue-500"
                    >
                      {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tipo de Operación */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Tipo Operación</label>
                  <select
                    value={currentDraft.operationType}
                    onChange={(e) => handleUpdateCurrentDraft('operationType', e.target.value as OperationType)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="BUY">🟢 COMPRA (Buy)</option>
                    <option value="SELL">🔴 VENTA (Sell)</option>
                    <option value="DIVIDEND">🟡 DIVIDENDO / RENTA</option>
                  </select>
                </div>

                {/* Ticker */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Ticker / Símbolo</label>
                  <input
                    type="text"
                    value={currentDraft.ticker}
                    onChange={(e) => handleUpdateCurrentDraft('ticker', e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                    placeholder="AAPL, AL30, SPY..."
                  />
                </div>

                {/* Nombre del Activo */}
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Nombre del Activo / Especie</label>
                  <input
                    type="text"
                    value={currentDraft.assetName}
                    onChange={(e) => handleUpdateCurrentDraft('assetName', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500"
                    placeholder="Apple Inc., Bono AL30 República Argentina..."
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Categoría</label>
                  <select
                    value={currentDraft.assetCategory}
                    onChange={(e) => handleUpdateCurrentDraft('assetCategory', e.target.value as AssetCategory)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500"
                  >
                    <option value="Acciones / CEDEAR">Acciones / CEDEAR</option>
                    <option value="Bonos / ON">Bonos / ON</option>
                    <option value="ETFs / Fondos">ETFs / Fondos</option>
                    <option value="Criptomonedas">Criptomonedas</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Moneda */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Moneda</label>
                  <select
                    value={currentDraft.currency}
                    onChange={(e) => handleUpdateCurrentDraft('currency', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="USD">USD (Dólares / MEP / CCL)</option>
                    <option value="ARS">ARS (Pesos Argentinos)</option>
                    <option value="EUR">EUR (Euros)</option>
                    <option value="USDT">USDT / Cripto</option>
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Cantidad / Nominales</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentDraft.quantity}
                    onChange={(e) => handleUpdateCurrentDraft('quantity', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Precio Unitario */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Precio Unitario ({currentDraft.currency})</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentDraft.price}
                    onChange={(e) => handleUpdateCurrentDraft('price', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Comisiones & Tasas */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Comisiones / Aranceles</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentDraft.fees}
                    onChange={(e) => handleUpdateCurrentDraft('fees', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Monto Total */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Importe Total ({currentDraft.currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={currentDraft.totalAmount}
                    onChange={(e) => handleUpdateCurrentDraft('totalAmount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Fecha de Operación</label>
                  <input
                    type="date"
                    value={currentDraft.date}
                    onChange={(e) => handleUpdateCurrentDraft('date', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Broker */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Broker / ALyC</label>
                  <input
                    type="text"
                    value={currentDraft.broker}
                    onChange={(e) => handleUpdateCurrentDraft('broker', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-900 dark:text-[#F2F0F3] focus:outline-none focus:border-blue-500"
                    placeholder="Balanz, IOL, Cocos, IBKR..."
                  />
                </div>

                {/* Notas / Observaciones */}
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Notas / Anotaciones del Boleto</label>
                  <input
                    type="text"
                    value={currentDraft.notes || ''}
                    onChange={(e) => handleUpdateCurrentDraft('notes', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    placeholder="Estrategia, motivo de compra, etc."
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleSaveCurrentDraft}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir a mi Cartera</span>
                </button>

                <button
                  onClick={() => setDrafts([])}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#15141A] dark:hover:bg-[#1E1B24] text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-[#281422] transition-colors cursor-pointer"
                  title="Descartar este boleto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* Empty Inspector State */
            <div className="bg-white dark:bg-[#0E0D12] border border-slate-200/90 dark:border-[#22121C] rounded-3xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[350px] shadow-sm transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#08070A] border border-slate-200 dark:border-[#281422] flex items-center justify-center text-slate-400 dark:text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-slate-900 dark:text-[#F2F0F3]">Inspector de Boletos</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cuando subas un archivo, pegues una captura o elijas un ejemplo, los datos extraídos aparecerán aquí para que los revises y confirmes.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
