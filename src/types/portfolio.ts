export type OperationType = 'BUY' | 'SELL' | 'DIVIDEND';

export type AssetCategory = 
  | 'Acciones / CEDEAR'
  | 'Bonos / ON'
  | 'ETFs / Fondos'
  | 'Criptomonedas'
  | 'Commodities'
  | 'Liquidez / Cash'
  | 'Otro';

export type Currency = 'ARS' | 'USD' | 'EUR' | 'USDT' | string;

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  color?: string; // e.g. emerald, indigo, cyan, amber, purple
  createdAt: number;
}

export interface Transaction {
  id: string;
  portfolioId?: string; // ID of the portfolio it belongs to
  ticketNumber?: string;
  date: string; // YYYY-MM-DD
  settlementDate?: string;
  operationType: OperationType;
  ticker: string;
  assetName: string;
  assetCategory: AssetCategory;
  quantity: number;
  price: number;
  currency: Currency;
  fees: number;
  commission?: number; // alias for fees
  totalAmount: number;
  broker: string;
  notes?: string;
  fileName?: string;
  filePreview?: string; // base64 or object url for thumbnail
  confidence?: 'high' | 'medium' | 'low';
  createdAt: number;
}

export interface PositionBrokerShare {
  broker: string;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Position {
  ticker: string;
  assetName: string;
  assetCategory: AssetCategory;
  quantity: number;
  averageBuyPrice: number; // PPC (Precio Promedio de Compra)
  avgBuyPrice?: number;    // alias for averageBuyPrice
  currentPrice: number;    // Cotización actual
  currency: Currency;
  totalInvested: number;   // Costo base total invertido
  currentValue: number;    // Valuación actual
  unrealizedPnL: number;   // Ganancia / Pérdida en monto
  unrealizedPnLPercent: number; // Ganancia / Pérdida en %
  realizedPnL: number;     // Ganancias ya cerradas por ventas
  allocationPercent: number; // % del total de la cartera
  transactionsCount: number;
  change24hPercent?: number; // Variación 24hs en tiempo real
  brokers: string[];         // Brokers where this asset is stored
  brokerShares: PositionBrokerShare[]; // Breakdown by broker
}

export interface BrokerAllocation {
  broker: string;
  totalValueUSD: number;
  totalValueARS: number;
  totalInvestedUSD: number;
  totalInvestedARS: number;
  unrealizedPnLUSD: number;
  unrealizedPnLARS: number;
  pnlPercent: number;
  unrealizedPnLPercent?: number; // alias for pnlPercent
  allocationPercent: number;
  holdingsCount: number;
  holdings?: any[]; // alias for assets
  assets: Array<{
    ticker: string;
    assetName: string;
    quantity: number;
    value: number;
    currency: string;
    pnl: number;
    pnlPercent: number;
  }>;
}

export interface MonthlyPerformance {
  year: number;
  month: number; // 0 = Ene, 11 = Dic
  monthIndex?: number; // alias for month
  monthLabel: string; // "Ene 2024"
  monthShort: string; // "Ene"
  monthName?: string; // alias for monthShort or label
  startValuation: number;
  endValuation: number;
  netInvested: number; // Aportes - Retiros en el mes
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  returnPercent: number;
  transactionsCount: number;
  tradeCount?: number; // alias for transactionsCount
  hasActivity?: boolean;
  isPositive: boolean;
  bestAsset?: { ticker: string; pnl: number };
}

export interface YearlyPerformance {
  year: number;
  startValuation: number;
  endValuation: number;
  netInvested: number;
  totalPnL: number;
  returnPercent: number;
  months: MonthlyPerformance[];
  positiveMonths: number;
  totalMonths: number;
  isPositive: boolean;
}

export interface RealtimeQuote {
  price: number;
  previousClose?: number;
  change24h?: number;
  change24hPercent?: number;
  currency: string;
  timestamp: number;
}

export interface LiveFxData {
  dolarMep: number;
  dolarCcl: number;
  dolarBlue: number;
  dolarOficial: number;
  dolarCripto?: number;
  timestamp?: number;
}

export interface PortfolioSummary {
  totalValuationUSD: number;
  totalValuationARS: number;
  totalInvestedUSD: number;
  totalInvestedARS: number;
  totalUnrealizedPnLUSD: number;
  totalUnrealizedPnLARS: number;
  totalUnrealizedPnLPercent: number;
  totalRealizedPnLUSD: number;
  totalRealizedPnLARS: number;
  totalTransactions: number;
  positionsCount: number;
  dailyPnLPercent?: number;
  dailyPnLUSD?: number;
}

export interface CurrencySettings {
  displayCurrency: 'USD' | 'ARS';
  fxRateUSDToARS: number; // e.g. 1548 ARS per 1 USD
}

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

export interface ArgentineBondItem {
  ticker: string;
  nombre: string;
  categoria: 'Soberano USD' | 'Soberano CER' | 'Bopreal' | 'ON Corporativa' | 'Letra Lecap';
  moneda: 'USD' | 'ARS';
  precioUSD: number;
  precioARS: number;
  variacion24hPct?: number;
  tirEstimada?: string;
  vencimiento: string;
  emisor: string;
  codigoCNV?: string;
  ley: 'Argentina' | 'Nueva York';
  cupon?: string;
}

export interface ArgentineMacroData {
  riesgoPais?: { valor: number; fecha: string };
  inflacionMensual?: { valor: number; fecha: string };
  inflacionInteranual?: { valor: number; fecha: string };
  plazosFijos?: Array<{ entidad: string; tnaClientes: number; logo?: string }>;
  dolares?: { mep: number; ccl: number; blue: number; oficial: number; cripto?: number };
}
