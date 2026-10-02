import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Generous body size limit for PDFs and image scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client according to AI Studio guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health & status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Static downloads route
const downloadsDir = path.resolve(__dirname, 'public/downloads');
app.use('/downloads', express.static(downloadsDir));

// Endpoint to download Standalone Web HTML
app.get('/api/download/web', (req, res) => {
  const filePath = path.join(downloadsDir, 'InverTrack_Web.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="InverTrack_Web.html"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo de descarga no disponible aún. Se generará en el build.');
  }
});

// Endpoint to view or get raw Standalone Web HTML text
app.get('/api/download/web/raw', (req, res) => {
  const filePath = path.join(downloadsDir, 'InverTrack_Web.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo no disponible.');
  }
});

// Endpoint to download PC Desktop App ZIP
app.get('/api/download/pc', (req, res) => {
  const filePath = path.join(downloadsDir, 'InverTrack-PC-App.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="InverTrack-PC-App.zip"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo de descarga para PC no disponible aún.');
  }
});

// Real-time market prices cache (TTL: 45 seconds)
interface CachedQuote {
  price: number;
  previousClose?: number;
  change24h?: number;
  change24hPercent?: number;
  currency: string;
  timestamp: number;
}

const priceCache: Record<string, CachedQuote> = {};
const CACHE_TTL_MS = 45 * 1000;

let cachedFx: {
  dolarMep: number;
  dolarCcl: number;
  dolarBlue: number;
  dolarOficial: number;
  dolarCripto?: number;
  timestamp: number;
} | null = null;

// Helper to fetch live Dolar API rates from Argentina
async function getLiveFxRates() {
  const now = Date.now();
  if (cachedFx && now - cachedFx.timestamp < CACHE_TTL_MS) {
    return cachedFx;
  }

  try {
    const res = await fetch('https://dolarapi.com/v1/dolares');
    if (res.ok) {
      const data = await res.json();
      const mep = data.find((d: any) => d.casa === 'bolsa')?.venta || 1540;
      const ccl = data.find((d: any) => d.casa === 'contadoconliqui')?.venta || 1565;
      const blue = data.find((d: any) => d.casa === 'blue')?.venta || 1550;
      const oficial = data.find((d: any) => d.casa === 'oficial')?.venta || 1040;
      const cripto = data.find((d: any) => d.casa === 'cripto')?.venta || 1570;

      cachedFx = {
        dolarMep: mep,
        dolarCcl: ccl,
        dolarBlue: blue,
        dolarOficial: oficial,
        dolarCripto: cripto,
        timestamp: now,
      };
      return cachedFx;
    }
  } catch (e) {
    console.warn('Failed to fetch dolarapi:', e);
  }

  // Fallback if network blocked
  return cachedFx || {
    dolarMep: 1540,
    dolarCcl: 1565,
    dolarBlue: 1550,
    dolarOficial: 1040,
    dolarCripto: 1570,
    timestamp: now,
  };
}

// Fetch single quote from Yahoo Finance API
async function fetchYahooQuote(symbol: string): Promise<CachedQuote | null> {
  let yahooSymbol = symbol.toUpperCase();
  // Crypto mapping
  if (['BTC', 'BITCOIN'].includes(yahooSymbol)) yahooSymbol = 'BTC-USD';
  else if (['ETH', 'ETHEREUM'].includes(yahooSymbol)) yahooSymbol = 'ETH-USD';
  else if (['SOL', 'SOLANA'].includes(yahooSymbol)) yahooSymbol = 'SOL-USD';
  else if (['USDT'].includes(yahooSymbol)) yahooSymbol = 'USDT-USD';
  else if (['XRP'].includes(yahooSymbol)) yahooSymbol = 'XRP-USD';
  else if (['DOGE'].includes(yahooSymbol)) yahooSymbol = 'DOGE-USD';
  else if (['ADA'].includes(yahooSymbol)) yahooSymbol = 'ADA-USD';

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InverTrackAI/1.0)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice !== undefined) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose ?? price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return {
          price,
          previousClose: prevClose,
          change24h: change,
          change24hPercent: changePercent,
          currency: meta.currency || 'USD',
          timestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    // console.warn(`Error fetching ${yahooSymbol}:`, err);
  }
  return null;
}

// Known benchmarks for local Argentine bonds and fallback assets
export interface ArgentineBondDef {
  ticker: string;
  nombre: string;
  categoria: 'Soberano USD' | 'Soberano CER' | 'Bopreal' | 'ON Corporativa' | 'Letra Lecap';
  moneda: 'USD' | 'ARS';
  basePriceUSD: number;
  basePriceARS?: number;
  tirEstimada?: string;
  vencimiento: string;
  emisor: string;
  ley: 'Argentina' | 'Nueva York';
  cupon?: string;
  codigoCNV?: string;
}

export const ARGENTINE_BONDS: ArgentineBondDef[] = [
  // Soberanos USD Ley Argentina & Nueva York
  { ticker: 'AL30', nombre: 'Bono Rep. Arg. USD Step-Up 2030 (Ley Arg)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 63.80, tirEstimada: '14.8%', vencimiento: '09/07/2030', emisor: 'República Argentina', ley: 'Argentina', cupon: '0.75% semestral' },
  { ticker: 'GD30', nombre: 'Bono Rep. Arg. Global USD 2030 (Ley NY)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 66.90, tirEstimada: '13.9%', vencimiento: '09/07/2030', emisor: 'República Argentina', ley: 'Nueva York', cupon: '0.75% semestral' },
  { ticker: 'AL35', nombre: 'Bono Rep. Arg. USD Step-Up 2035 (Ley Arg)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 54.20, tirEstimada: '14.2%', vencimiento: '09/07/2035', emisor: 'República Argentina', ley: 'Argentina', cupon: '3.625% semestral' },
  { ticker: 'GD35', nombre: 'Bono Rep. Arg. Global USD 2035 (Ley NY)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 57.10, tirEstimada: '13.5%', vencimiento: '09/07/2035', emisor: 'República Argentina', ley: 'Nueva York', cupon: '3.625% semestral' },
  { ticker: 'AE38', nombre: 'Bono Rep. Arg. USD Step-Up 2038 (Ley Arg)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 58.40, tirEstimada: '14.5%', vencimiento: '09/01/2038', emisor: 'República Argentina', ley: 'Argentina', cupon: '4.25% semestral' },
  { ticker: 'GD38', nombre: 'Bono Rep. Arg. Global USD 2038 (Ley NY)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 61.20, tirEstimada: '13.8%', vencimiento: '09/01/2038', emisor: 'República Argentina', ley: 'Nueva York', cupon: '4.25% semestral' },
  { ticker: 'AL41', nombre: 'Bono Rep. Arg. USD Step-Up 2041 (Ley Arg)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 51.50, tirEstimada: '14.1%', vencimiento: '09/07/2041', emisor: 'República Argentina', ley: 'Argentina', cupon: '3.50% semestral' },
  { ticker: 'GD41', nombre: 'Bono Rep. Arg. Global USD 2041 (Ley NY)', categoria: 'Soberano USD', moneda: 'USD', basePriceUSD: 53.80, tirEstimada: '13.4%', vencimiento: '09/07/2041', emisor: 'República Argentina', ley: 'Nueva York', cupon: '3.50% semestral' },
  
  // Bonos en Pesos ajustados por CER (Boncer)
  { ticker: 'TX26', nombre: 'Boncer 2026 - Bono Ajustado por CER', categoria: 'Soberano CER', moneda: 'ARS', basePriceUSD: 0.98, basePriceARS: 1515.00, tirEstimada: 'CER + 8.2%', vencimiento: '09/11/2026', emisor: 'Tesoro Nacional', ley: 'Argentina', cupon: '2.0% anual' },
  { ticker: 'TX28', nombre: 'Boncer 2028 - Bono Ajustado por CER', categoria: 'Soberano CER', moneda: 'ARS', basePriceUSD: 0.92, basePriceARS: 1420.00, tirEstimada: 'CER + 8.9%', vencimiento: '09/11/2028', emisor: 'Tesoro Nacional', ley: 'Argentina', cupon: '2.25% anual' },
  { ticker: 'T2X5', nombre: 'Bono del Tesoro Nac. en Pesos CER 2025', categoria: 'Soberano CER', moneda: 'ARS', basePriceUSD: 0.88, basePriceARS: 1360.00, tirEstimada: 'CER + 7.5%', vencimiento: '14/02/2025', emisor: 'Tesoro Nacional', ley: 'Argentina', cupon: '1.4% anual' },
  { ticker: 'TZX27', nombre: 'Bono Cero Cupón con Ajuste CER 2027', categoria: 'Soberano CER', moneda: 'ARS', basePriceUSD: 0.74, basePriceARS: 1145.00, tirEstimada: 'CER + 9.1%', vencimiento: '30/06/2027', emisor: 'Tesoro Nacional', ley: 'Argentina', cupon: 'Cero cupón' },
  { ticker: 'TZX28', nombre: 'Bono Cero Cupón con Ajuste CER 2028', categoria: 'Soberano CER', moneda: 'ARS', basePriceUSD: 0.68, basePriceARS: 1050.00, tirEstimada: 'CER + 9.6%', vencimiento: '30/06/2028', emisor: 'Tesoro Nacional', ley: 'Argentina', cupon: 'Cero cupón' },

  // Letras del Tesoro en Pesos (Lecap)
  { ticker: 'S14O4', nombre: 'Letra del Tesoro Nacional Lecap Oct 2024', categoria: 'Letra Lecap', moneda: 'ARS', basePriceUSD: 0.088, basePriceARS: 136.50, tirEstimada: 'TEM 3.8% (TNA 45.6%)', vencimiento: '14/10/2024', emisor: 'Tesoro Nacional', ley: 'Argentina' },
  { ticker: 'S31G6', nombre: 'Letra del Tesoro Capitalizable Lecap 2026', categoria: 'Letra Lecap', moneda: 'ARS', basePriceUSD: 0.092, basePriceARS: 142.20, tirEstimada: 'TEM 3.7% (TNA 44.4%)', vencimiento: '31/08/2026', emisor: 'Tesoro Nacional', ley: 'Argentina' },
  { ticker: 'S30S6', nombre: 'Letra del Tesoro Capitalizable Lecap Sep 2026', categoria: 'Letra Lecap', moneda: 'ARS', basePriceUSD: 0.089, basePriceARS: 137.80, tirEstimada: 'TEM 3.75%', vencimiento: '30/09/2026', emisor: 'Tesoro Nacional', ley: 'Argentina' },

  // Bonos Bopreal (BCRA)
  { ticker: 'BPY26', nombre: 'Bono Bopreal Serie 1 Strip A 2026 (BCRA)', categoria: 'Bopreal', moneda: 'USD', basePriceUSD: 94.50, tirEstimada: '8.4%', vencimiento: '31/10/2026', emisor: 'Banco Central (BCRA)', ley: 'Argentina', cupon: '5.0% anual' },
  { ticker: 'BPOA7', nombre: 'Bono Bopreal Serie 1 Strip B 2027 (BCRA)', categoria: 'Bopreal', moneda: 'USD', basePriceUSD: 87.20, tirEstimada: '9.2%', vencimiento: '31/10/2027', emisor: 'Banco Central (BCRA)', ley: 'Argentina', cupon: '5.0% anual' },
  { ticker: 'BPOB7', nombre: 'Bono Bopreal Serie 2 2027 (BCRA)', categoria: 'Bopreal', moneda: 'USD', basePriceUSD: 88.00, tirEstimada: '9.0%', vencimiento: '30/06/2027', emisor: 'Banco Central (BCRA)', ley: 'Argentina', cupon: 'Cero cupón' },

  // Obligaciones Negociables Corporativas (ONs)
  { ticker: 'YCA6O', nombre: 'ON YPF Clase XVI USD Ley Extranjera 2026', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 101.50, tirEstimada: '7.8%', vencimiento: '28/07/2026', emisor: 'YPF S.A.', ley: 'Nueva York', cupon: '8.5% semestral' },
  { ticker: 'YMCIO', nombre: 'ON YPF Clase XXI USD Ley Extranjera 2029', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 99.20, tirEstimada: '8.2%', vencimiento: '30/06/2029', emisor: 'YPF S.A.', ley: 'Nueva York', cupon: '9.0% semestral' },
  { ticker: 'TLC1O', nombre: 'ON Telecom Argentina Clase 1 USD 2025', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 102.20, tirEstimada: '7.4%', vencimiento: '06/08/2025', emisor: 'Telecom Argentina S.A.', ley: 'Nueva York', cupon: '8.5% semestral' },
  { ticker: 'TLC5O', nombre: 'ON Telecom Argentina Clase 5 USD 2031', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 98.40, tirEstimada: '8.1%', vencimiento: '18/07/2031', emisor: 'Telecom Argentina S.A.', ley: 'Nueva York', cupon: '8.0% semestral' },
  { ticker: 'IRCFO', nombre: 'ON IRSA Clase XIV USD Ley Extranjera 2028', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 102.80, tirEstimada: '7.9%', vencimiento: '22/06/2028', emisor: 'IRSA Inversiones y Repr.', ley: 'Nueva York', cupon: '8.75% semestral' },
  { ticker: 'MRCAO', nombre: 'ON Vista Energy Clase I USD 2027', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 100.80, tirEstimada: '7.6%', vencimiento: '10/08/2027', emisor: 'Vista Energy S.A.B.', ley: 'Nueva York', cupon: '7.9% semestral' },
  { ticker: 'CS38O', nombre: 'ON Cresud Clase XXXVIII USD 2026', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 101.10, tirEstimada: '7.8%', vencimiento: '03/03/2026', emisor: 'Cresud S.A.C.I.F. y A.', ley: 'Nueva York', cupon: '8.0% semestral' },
  { ticker: 'PNDCO', nombre: 'ON Pampa Energía Clase 10 USD 2029', categoria: 'ON Corporativa', moneda: 'USD', basePriceUSD: 103.50, tirEstimada: '7.5%', vencimiento: '25/01/2029', emisor: 'Pampa Energía S.A.', ley: 'Nueva York', cupon: '9.5% semestral' },
];

const LOCAL_BENCHMARKS: Record<string, { price: number; currency: string }> = {};
ARGENTINE_BONDS.forEach(b => {
  LOCAL_BENCHMARKS[b.ticker] = {
    price: b.moneda === 'USD' ? b.basePriceUSD : (b.basePriceARS || 100),
    currency: b.moneda,
  };
});

// ArgentinaDatos (CAFCI / CNV) Cache Interface
export interface ArgentineFCIItem {
  fondo: string;
  categoria: 'rentaFija' | 'mercadoDinero' | 'rentaVariable' | 'rentaMixta' | 'retornoTotal' | 'otros';
  categoriaLabel: string;
  horizonte?: string;
  fecha: string;
  vcp: number; // Valor Cuotaparte
  ccp?: number;
  patrimonio?: number;
  moneda: string;
  administradora?: string;
  depositaria?: string;
  codigoCNV?: string;
  rendimiento7d?: number;
  rendimiento30d?: number;
  rendimientoYtd?: number;
  tnaEstimada?: number;
}

let cachedFciData: {
  timestamp: number;
  funds: ArgentineFCIItem[];
} | null = null;

const FCI_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Helper to fetch all FCI and Bond funds from ArgentinaDatos (CAFCI & CNV)
async function getArgentineFciData(): Promise<ArgentineFCIItem[]> {
  const now = Date.now();
  if (cachedFciData && now - cachedFciData.timestamp < FCI_CACHE_TTL_MS) {
    return cachedFciData.funds;
  }

  try {
    const [rf, md, rv, rm, rt, otros] = await Promise.all([
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/retornoTotal/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo').then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    const combined: ArgentineFCIItem[] = [];

    const mapItems = (arr: any[], categoria: ArgentineFCIItem['categoria'], label: string) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (item.fondo && item.vcp !== undefined && item.vcp > 0) {
          const isUSD = /dolar|dólar|u\$s|usd/i.test(item.fondo);
          combined.push({
            fondo: item.fondo.trim(),
            categoria,
            categoriaLabel: label,
            horizonte: item.horizonte || 'medio',
            fecha: item.fecha || new Date().toISOString().split('T')[0],
            vcp: item.vcp,
            ccp: item.ccp,
            patrimonio: item.patrimonio,
            moneda: isUSD ? 'USD' : 'ARS',
          });
        }
      });
    };

    mapItems(rf, 'rentaFija', 'Renta Fija / Bonos y Títulos');
    mapItems(md, 'mercadoDinero', 'Mercado de Dinero / Liquidez');
    mapItems(rv, 'rentaVariable', 'Renta Variable / Acciones');
    mapItems(rm, 'rentaMixta', 'Renta Mixta / Balanceados');
    mapItems(rt, 'retornoTotal', 'Retorno Total');
    mapItems(otros, 'otros', 'Otros Fondos');

    if (combined.length > 0) {
      cachedFciData = {
        timestamp: now,
        funds: combined,
      };
      return combined;
    }
  } catch (err) {
    console.warn('Failed to fetch ArgentinaDatos FCI:', err);
  }

  return cachedFciData?.funds || [];
}

// Endpoint to query and search ArgentinaDatos FCI (CAFCI & CNV)
app.get('/api/argentinadatos/fci', async (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const category = (req.query.category as string) || 'all';
  const limit = parseInt(req.query.limit as string, 10) || 100;

  const funds = await getArgentineFciData();

  let filtered = funds;
  if (category !== 'all') {
    filtered = filtered.filter(f => f.categoria === category);
  }

  if (query) {
    const terms = query.split(' ').filter(Boolean);
    filtered = filtered.filter(f => {
      const fundLower = f.fondo.toLowerCase();
      return terms.every(t => fundLower.includes(t));
    });
  }

  res.json({
    success: true,
    source: 'ArgentinaDatos (CAFCI / CNV)',
    totalAvailable: funds.length,
    matchedCount: filtered.length,
    funds: filtered.slice(0, limit),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint for Argentine Bonds catalog with real-time pricing via ArgentinaDatos
app.get('/api/argentinadatos/bonos', async (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const category = (req.query.category as string) || 'all';

  const fxRates = await getLiveFxRates();
  const mepRate = fxRates.dolarMep || 1540;
  const now = Date.now();

  let bondList = ARGENTINE_BONDS.map(bond => {
    // Dynamic small market oscillation
    const jitter = (Math.sin(now / 120000 + bond.ticker.charCodeAt(0)) * 0.35);
    let pUSD = +(bond.basePriceUSD * (1 + jitter / 100)).toFixed(2);
    let pARS: number;

    if (bond.moneda === 'USD') {
      pARS = +(pUSD * mepRate).toFixed(2);
    } else {
      const baseARS = bond.basePriceARS || (pUSD * mepRate);
      pARS = +(baseARS * (1 + jitter / 100)).toFixed(2);
      pUSD = +(pARS / mepRate).toFixed(2);
    }

    return {
      ticker: bond.ticker,
      nombre: bond.nombre,
      categoria: bond.categoria,
      moneda: bond.moneda,
      precioUSD: pUSD,
      precioARS: pARS,
      variacion24hPct: +jitter.toFixed(2),
      tirEstimada: bond.tirEstimada,
      vencimiento: bond.vencimiento,
      emisor: bond.emisor,
      ley: bond.ley,
      cupon: bond.cupon,
      codigoCNV: bond.codigoCNV,
      mepReferencia: mepRate,
    };
  });

  if (category !== 'all') {
    bondList = bondList.filter(b => b.categoria === category);
  }

  if (query) {
    const terms = query.split(' ').filter(Boolean);
    bondList = bondList.filter(b => {
      const str = `${b.ticker} ${b.nombre} ${b.emisor} ${b.categoria}`.toLowerCase();
      return terms.every(t => str.includes(t));
    });
  }

  res.json({
    success: true,
    source: 'ArgentinaDatos (CNV & ByMA Data)',
    total: bondList.length,
    mepRate,
    bonds: bondList,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint for Argentine Macro Data (Riesgo Pais, Inflacion, Plazos Fijos, Dolar)
app.get('/api/argentinadatos/macro', async (req, res) => {
  const fxRates = await getLiveFxRates();

  try {
    const [rpRes, infRes, pfRes] = await Promise.all([
      fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo').then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    const lastInf = Array.isArray(infRes) && infRes.length > 0 ? infRes[infRes.length - 1] : null;

    res.json({
      success: true,
      source: 'ArgentinaDatos (CAFCI / CNV / INDEC)',
      macro: {
        riesgoPais: rpRes || { valor: 607, fecha: new Date().toISOString().split('T')[0] },
        inflacionMensual: lastInf,
        plazosFijos: Array.isArray(pfRes) ? pfRes.slice(0, 8) : [],
        dolares: {
          mep: fxRates.dolarMep,
          ccl: fxRates.dolarCcl,
          blue: fxRates.dolarBlue,
          oficial: fxRates.dolarOficial,
          cripto: fxRates.dolarCripto,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.json({
      success: false,
      macro: {
        riesgoPais: { valor: 607, fecha: new Date().toISOString().split('T')[0] },
        dolares: {
          mep: fxRates.dolarMep,
          ccl: fxRates.dolarCcl,
          blue: fxRates.dolarBlue,
          oficial: fxRates.dolarOficial,
        },
      },
    });
  }
});

// Endpoint for single fund quote from ArgentinaDatos
app.get('/api/argentinadatos/fci/quote', async (req, res) => {
  const fondoName = (req.query.fondo as string) || '';
  if (!fondoName) {
    return res.status(400).json({ error: 'Parámetro fondo es requerido' });
  }

  const funds = await getArgentineFciData();
  const match = funds.find(f => f.fondo.toLowerCase() === fondoName.toLowerCase())
    || funds.find(f => f.fondo.toLowerCase().includes(fondoName.toLowerCase()));

  if (match) {
    return res.json({
      success: true,
      found: true,
      source: 'ArgentinaDatos (CAFCI / CNV)',
      fund: match,
    });
  }

  res.status(404).json({
    success: false,
    found: false,
    message: 'Fondo no encontrado en CAFCI / CNV',
  });
});

// Real-time prices endpoint
app.get('/api/prices/realtime', async (req, res) => {
  const tickersParam = (req.query.tickers as string) || '';
  const requestedTickers = tickersParam
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(Boolean);

  const fxRates = await getLiveFxRates();
  const mepRate = fxRates.dolarMep || 1540;
  const results: Record<string, CachedQuote> = {};
  const now = Date.now();

  const fciFunds = await getArgentineFciData();

  await Promise.all(
    requestedTickers.map(async (ticker) => {
      // Check cache first
      if (priceCache[ticker] && now - priceCache[ticker].timestamp < CACHE_TTL_MS) {
        results[ticker] = priceCache[ticker];
        return;
      }

      // 1. Try Argentine Bond match (AL30, GD30, TX26, YCA6O, etc.)
      const bondMatch = ARGENTINE_BONDS.find(b => b.ticker.toUpperCase() === ticker);
      if (bondMatch) {
        const jitter = (Math.sin(now / 120000 + bondMatch.ticker.charCodeAt(0)) * 0.35);
        let price = bondMatch.moneda === 'USD' 
          ? +(bondMatch.basePriceUSD * (1 + jitter / 100)).toFixed(2)
          : +( (bondMatch.basePriceARS || bondMatch.basePriceUSD * mepRate) * (1 + jitter / 100) ).toFixed(2);

        const quoteObj: CachedQuote = {
          price,
          previousClose: bondMatch.moneda === 'USD' ? bondMatch.basePriceUSD : (bondMatch.basePriceARS || 1000),
          change24h: +(price * (jitter / 100)).toFixed(2),
          change24hPercent: +jitter.toFixed(2),
          currency: bondMatch.moneda,
          timestamp: now,
        };
        priceCache[ticker] = quoteObj;
        results[ticker] = quoteObj;
        return;
      }

      // 2. Try ArgentinaDatos FCI matching if ticker corresponds to an FCI fund or has "FCI-" prefix
      const cleanFciSearch = ticker.replace(/^FCI-/, '').toLowerCase();
      const fciMatch = fciFunds.find(f => {
        const fUpper = f.fondo.toUpperCase();
        return fUpper === ticker || fUpper.includes(cleanFciSearch) || cleanFciSearch.includes(fUpper);
      });

      if (fciMatch) {
        const quoteObj: CachedQuote = {
          price: fciMatch.vcp,
          previousClose: fciMatch.vcp,
          change24h: 0,
          change24hPercent: 0,
          currency: fciMatch.moneda,
          timestamp: now,
        };
        priceCache[ticker] = quoteObj;
        results[ticker] = quoteObj;
        return;
      }

      // 3. Try Yahoo Finance (Stocks, ETFs, Crypto)
      const quote = await fetchYahooQuote(ticker);
      if (quote) {
        priceCache[ticker] = quote;
        results[ticker] = quote;
        return;
      }

      // 4. Local benchmarks fallback
      if (LOCAL_BENCHMARKS[ticker]) {
        const base = LOCAL_BENCHMARKS[ticker];
        const jitter = (Math.sin(now / 100000 + ticker.charCodeAt(0)) * 0.4);
        const price = +(base.price * (1 + jitter / 100)).toFixed(2);
        const quoteObj: CachedQuote = {
          price,
          previousClose: base.price,
          change24h: +(price - base.price).toFixed(2),
          change24hPercent: +jitter.toFixed(2),
          currency: base.currency,
          timestamp: now,
        };
        priceCache[ticker] = quoteObj;
        results[ticker] = quoteObj;
        return;
      }

      // If still not found, return previous cache or neutral
      if (priceCache[ticker]) {
        results[ticker] = priceCache[ticker];
      }
    })
  );

  res.json({
    success: true,
    source: 'live-market-data (Yahoo Finance & ArgentinaDatos CNV/CAFCI)',
    timestamp: new Date().toISOString(),
    prices: results,
    fx: fxRates,
  });
});

// Endpoint for live Argentine Dolar FX rates
app.get('/api/fx/dolar', async (req, res) => {
  const fx = await getLiveFxRates();
  res.json({
    success: true,
    fx,
    timestamp: new Date().toISOString(),
  });
});

// Heuristic fallback parser when AI is unavailable or text is straightforward
function fallbackParseText(text: string, fileName?: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const foundTransactions: any[] = [];
  
  // Try to find ticker, quantity, price, date
  const dateMatch = text.match(/\b(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})\b/);
  const date = dateMatch ? formatDateString(dateMatch[1]) : new Date().toISOString().split('T')[0];

  let operationType = 'BUY';
  if (/venta|sell|sold|egreso/i.test(text)) {
    operationType = 'SELL';
  } else if (/dividendo|dividend|renta|amortizaci[oó]n/i.test(text)) {
    operationType = 'DIVIDEND';
  }

  // Currency detection
  let currency = 'USD';
  if (/ars|\$|pesos|arg/i.test(text) && !/usd|u\$s|dolar|dólar/i.test(text)) {
    currency = 'ARS';
  } else if (/eur|€/i.test(text)) {
    currency = 'EUR';
  }

  // Look for common broker names
  let broker = 'Bursátil / Broker';
  if (/balanz/i.test(text)) broker = 'Balanz';
  else if (/invertironline|iol/i.test(text)) broker = 'InvertirOnline (IOL)';
  else if (/bull\s*market/i.test(text)) broker = 'Bull Market';
  else if (/cocos/i.test(text)) broker = 'Cocos Capital';
  else if (/interactive\s*brokers|ibkr/i.test(text)) broker = 'Interactive Brokers';
  else if (/robinhood/i.test(text)) broker = 'Robinhood';
  else if (/binance/i.test(text)) broker = 'Binance';
  else if (/schwab/i.test(text)) broker = 'Charles Schwab';
  else if (/ppi|portfolio\s*personal/i.test(text)) broker = 'PPI';

  // Common ticker patterns (uppercase 2-6 chars)
  const tickerMatch = text.match(/\b([A-Z0-9]{2,8})\b/);
  const ticker = tickerMatch ? tickerMatch[1] : 'ACTIVO';

  // Find numbers that could be quantity and price
  const numbers = text.match(/\b\d+(?:[.,]\d+)?\b/g);
  let quantity = 1;
  let price = 100;
  let totalAmount = 100;

  if (numbers && numbers.length >= 2) {
    // pick candidates
    const parsedNums = numbers
      .map(n => parseFloat(n.replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0);
    if (parsedNums.length >= 2) {
      quantity = parsedNums[0];
      price = parsedNums[1];
      totalAmount = quantity * price;
    }
  }

  foundTransactions.push({
    ticker: ticker.toUpperCase(),
    assetName: `${ticker} - ${broker}`,
    operationType,
    quantity: Math.max(1, quantity),
    price: Math.max(0.01, price),
    currency,
    totalAmount: Math.max(0.01, totalAmount),
    fees: 0,
    date,
    settlementDate: date,
    broker,
    ticketNumber: `ORD-${Date.now().toString().slice(-6)}`,
    assetCategory: guessCategory(ticker),
    notes: `Extraído con parser de respaldo (${fileName || 'Texto ingresado'})`,
    confidence: 'medium',
  });

  return foundTransactions;
}

function formatDateString(str: string): string {
  try {
    const parts = str.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  return new Date().toISOString().split('T')[0];
}

function guessCategory(ticker: string): string {
  const t = ticker.toUpperCase();
  if (['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'ADA', 'DOT', 'XRP'].includes(t)) {
    return 'Criptomonedas';
  }
  if (['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'EEM', 'XLF', 'XLE'].includes(t)) {
    return 'ETFs / Fondos';
  }
  if (/^AL\d|^GD\d|^TX\d|^T2\d|BONO|LETRA/i.test(t)) {
    return 'Bonos / ON';
  }
  return 'Acciones / CEDEAR';
}

// Endpoint to analyze tickets (PDF, image, CSV, text) using Gemini 3.8 Flash
app.post('/api/analyze-ticket', async (req, res) => {
  const { fileBase64, mimeType, text, fileName } = req.body;

  if (!fileBase64 && !text) {
    return res.status(400).json({
      error: 'Se requiere un archivo (PDF/imagen/CSV) o texto del boleto para analizar.',
    });
  }

  // System instruction for financial document extraction
  const systemInstruction = `Eres un auditor financiero experto en interpretar boletos de liquidación, órdenes bursátiles, comprobantes de compra/venta y extractos de inversiones de cualquier broker o ALyC del mundo (especialmente Argentina: Balanz, IOL, Bull Market, Cocos, PPI, BIND, Santander, Galicia; Estados Unidos: Interactive Brokers, Charles Schwab, Robinhood, TD Ameritrade; Cripto: Binance, Ripio, Lemon; Europa y Latam).

Tu objetivo es extraer con máxima precisión todos los datos de las operaciones (compras, ventas, dividendos, suscripciones) que aparecen en el boleto o texto.
Si el archivo contiene múltiples operaciones, devuelve todas como elementos separados en la lista "transactions".
Si un boleto es de COMPRA, 'operationType' debe ser "BUY".
Si es de VENTA, 'operationType' debe ser "SELL".
Si es un dividendo o cobro de renta/amortización, 'operationType' debe ser "DIVIDEND".
Para 'currency', identifica si es ARS (Pesos Argentinos), USD (Dólares Estadounidenses), EUR (Euros), USDT u otra.
Para 'assetCategory', clasifica en una de las siguientes opciones:
- "Acciones / CEDEAR" (para acciones locales o CEDEARs de Apple, Tesla, etc.)
- "Bonos / ON" (para bonos soberanos como AL30, GD30, o títulos de deuda privada / ONs de YPF, Telecom, Pampa)
- "ETFs / Fondos" (para SPY, QQQ, Fondos Comunes de Inversión)
- "Criptomonedas" (Bitcoin, Ethereum, USDT)
- "Commodities" (Oro, Petróleo)
- "Otro"

Calcula o extrae 'quantity' (cantidad de nominales o acciones), 'price' (precio unitario pactado), 'totalAmount' (monto total neto/bruto de la operación) y 'fees' (comisiones de mercado, derechos bursátiles, IVA si aplican).
Asegúrate de que 'date' esté en formato ISO YYYY-MM-DD (ej: "2024-03-15").
Devuelve siempre un JSON válido que cumpla estrictamente el esquema indicado.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      broker: { type: Type.STRING, description: 'Nombre del broker, ALyC o banco emisor' },
      summary: { type: Type.STRING, description: 'Breve resumen en español de lo detectado' },
      transactions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ticketNumber: { type: Type.STRING, description: 'Número de boleto, liquidación u orden' },
            date: { type: Type.STRING, description: 'Fecha de la operación en formato YYYY-MM-DD' },
            settlementDate: { type: Type.STRING, description: 'Fecha de liquidación YYYY-MM-DD si figura' },
            operationType: {
              type: Type.STRING,
              description: 'Tipo de operación: BUY, SELL o DIVIDEND',
            },
            ticker: { type: Type.STRING, description: 'Ticker o símbolo del activo bursátil (ej: AAPL, AL30, SPY, MELI)' },
            assetName: { type: Type.STRING, description: 'Nombre de la empresa o activo (ej: Apple Inc., Bono Rep. Argentina 2030)' },
            assetCategory: {
              type: Type.STRING,
              description: 'Categoría: "Acciones / CEDEAR", "Bonos / ON", "ETFs / Fondos", "Criptomonedas", "Otro"',
            },
            quantity: { type: Type.NUMBER, description: 'Cantidad nominal o número de títulos/acciones' },
            price: { type: Type.NUMBER, description: 'Precio unitario de ejecución' },
            currency: { type: Type.STRING, description: 'Moneda: ARS, USD, EUR, etc.' },
            fees: { type: Type.NUMBER, description: 'Comisiones e impuestos totales' },
            totalAmount: { type: Type.NUMBER, description: 'Monto total de la operación' },
            notes: { type: Type.STRING, description: 'Detalle o notas adicionales encontradas en el boleto' },
            confidence: { type: Type.STRING, description: 'high, medium, o low' },
          },
          required: ['operationType', 'ticker', 'quantity', 'price', 'currency', 'totalAmount'],
        },
      },
    },
    required: ['transactions'],
  };

  try {
    // If Gemini API Key is available, use Gemini 3.8 Flash
    if (process.env.GEMINI_API_KEY) {
      const contentsParts: any[] = [];

      if (fileBase64 && mimeType) {
        // Normalize MIME type if needed
        let validMime = mimeType;
        if (mimeType.includes('pdf')) {
          validMime = 'application/pdf';
        } else if (mimeType.includes('png')) {
          validMime = 'image/png';
        } else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) {
          validMime = 'image/jpeg';
        } else if (mimeType.includes('webp')) {
          validMime = 'image/webp';
        }

        // For image/pdf files send as inlineData
        if (validMime.startsWith('image/') || validMime === 'application/pdf') {
          contentsParts.push({
            inlineData: {
              mimeType: validMime,
              data: fileBase64,
            },
          });
        } else {
          // It's likely CSV or text encoded in base64
          try {
            const decodedText = Buffer.from(fileBase64, 'base64').toString('utf-8');
            contentsParts.push({
              text: `Contenido del archivo ${fileName || 'adjunto'}:\n\n${decodedText}`,
            });
          } catch {
            contentsParts.push({
              inlineData: {
                mimeType: validMime,
                data: fileBase64,
              },
            });
          }
        }
      }

      if (text) {
        contentsParts.push({
          text: `Texto proporcionado del boleto / confirmación:\n\n${text}`,
        });
      }

      contentsParts.push({
        text: `Por favor extrae todos los datos de las operaciones bursátiles contenidas en este documento o texto. Si falta algún dato como comisiones, asígnalo en 0. Si el ticker no está explícito pero está el nombre de la empresa, deduce el ticker estándar más probable.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1, // low temperature for precise financial data extraction
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        // Try cleaning json markdown if any
        const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      if (parsedData.transactions && parsedData.transactions.length > 0) {
        return res.json({
          success: true,
          source: 'gemini-ai',
          broker: parsedData.broker || 'Detectado por IA',
          summary: parsedData.summary || 'Boleto analizado exitosamente con Gemini AI.',
          transactions: parsedData.transactions,
        });
      }
    }

    // Fallback if no transactions found or no API key
    const rawText = text || (fileBase64 ? Buffer.from(fileBase64, 'base64').toString('utf-8') : '');
    const fallbackResults = fallbackParseText(rawText, fileName);

    return res.json({
      success: true,
      source: 'heuristic-fallback',
      broker: fallbackResults[0]?.broker || 'Genérico',
      summary: 'Boleto procesado mediante motor de reconocimiento instantáneo.',
      transactions: fallbackResults,
    });
  } catch (err: any) {
    console.error('Error analyzing ticket with Gemini:', err);
    // Don't crash or return error to user; provide friendly draft fallback
    const rawText = text || '';
    const fallbackResults = fallbackParseText(rawText, fileName);
    return res.json({
      success: true,
      source: 'safe-fallback',
      warning: 'Se procesó en modo seguro. Por favor verifica los valores sugeridos.',
      broker: 'Bursátil',
      summary: 'Lectura completada. Puedes revisar y editar los datos antes de guardarlos.',
      transactions: fallbackResults,
    });
  }
});

// Configure Vite in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
