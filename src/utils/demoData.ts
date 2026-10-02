import { Transaction, Portfolio } from '../types/portfolio';

export const INITIAL_DEMO_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Cartera Principal (CEDEARs & ETFs)',
    description: 'Estrategia de crecimiento a mediano y largo plazo',
    color: 'emerald',
    createdAt: Date.now() - 86400000 * 90,
  },
  {
    id: 'port-2',
    name: 'Renta Fija & Bonos Soberanos',
    description: 'Títulos públicos en dólares MEP y obligaciones negociables',
    color: 'indigo',
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'port-3',
    name: 'Cartera Cripto Spot',
    description: 'Bitcoin y reservas de valor descentralizadas',
    color: 'amber',
    createdAt: Date.now() - 86400000 * 30,
  },
];

export const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-demo-1',
    portfolioId: 'port-1',
    ticketNumber: 'BOL-BAL-884920',
    date: '2024-02-14',
    settlementDate: '2024-02-16',
    operationType: 'BUY',
    ticker: 'AAPL',
    assetName: 'Apple Inc. (CEDEAR)',
    assetCategory: 'Acciones / CEDEAR',
    quantity: 15,
    price: 185.20,
    currency: 'USD',
    fees: 2.75,
    totalAmount: 2780.75,
    broker: 'Balanz Capital',
    notes: 'Compra inicial CEDEAR de Apple a mediano plazo',
    confidence: 'high',
    createdAt: Date.now() - 86400000 * 45,
  },
  {
    id: 'tx-demo-2',
    portfolioId: 'port-1',
    ticketNumber: 'BOL-IOL-449102',
    date: '2024-03-05',
    settlementDate: '2024-03-07',
    operationType: 'BUY',
    ticker: 'NVDA',
    assetName: 'Nvidia Corp. (CEDEAR)',
    assetCategory: 'Acciones / CEDEAR',
    quantity: 20,
    price: 92.40,
    currency: 'USD',
    fees: 1.85,
    totalAmount: 1849.85,
    broker: 'InvertirOnline (IOL)',
    notes: 'Aprovechando corrección post-earnings',
    confidence: 'high',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'tx-demo-3',
    portfolioId: 'port-1',
    ticketNumber: 'BOL-IBKR-903112',
    date: '2024-03-18',
    settlementDate: '2024-03-20',
    operationType: 'BUY',
    ticker: 'SPY',
    assetName: 'SPDR S&P 500 ETF Trust',
    assetCategory: 'ETFs / Fondos',
    quantity: 8,
    price: 512.30,
    currency: 'USD',
    fees: 1.00,
    totalAmount: 4099.40,
    broker: 'Interactive Brokers',
    notes: 'Aporte mensual índice S&P 500',
    confidence: 'high',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'tx-demo-4',
    portfolioId: 'port-2',
    ticketNumber: 'BOL-COC-518290',
    date: '2024-04-02',
    settlementDate: '2024-04-04',
    operationType: 'BUY',
    ticker: 'AL30',
    assetName: 'Bono Rep. Argentina 2030 (AL30D)',
    assetCategory: 'Bonos / ON',
    quantity: 1500,
    price: 49.50,
    currency: 'USD',
    fees: 0.00,
    totalAmount: 742.50,
    broker: 'Cocos Capital',
    notes: 'Bono soberano en dólares MEP',
    confidence: 'high',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'tx-demo-5',
    portfolioId: 'port-3',
    ticketNumber: 'BOL-BIN-772091',
    date: '2024-04-10',
    settlementDate: '2024-04-10',
    operationType: 'BUY',
    ticker: 'BTC',
    assetName: 'Bitcoin',
    assetCategory: 'Criptomonedas',
    quantity: 0.05,
    price: 58400.00,
    currency: 'USD',
    fees: 2.92,
    totalAmount: 2922.92,
    broker: 'Binance',
    notes: 'DCA compra periódica spot Bitcoin',
    confidence: 'high',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export interface SampleTicketDemo {
  title: string;
  broker: string;
  badge: string;
  description: string;
  sampleText: string;
  expectedData: {
    ticker: string;
    assetName: string;
    assetCategory: string;
    operationType: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    currency: string;
    fees: number;
    totalAmount: number;
    ticketNumber: string;
    date: string;
    broker: string;
    notes: string;
  };
}

export const SAMPLE_TICKETS_FOR_SCANNER: SampleTicketDemo[] = [
  {
    title: 'Boleto Balanz: Compra Bono AL30 (USD)',
    broker: 'Balanz Capital',
    badge: 'Bono Soberano',
    description: 'Boleto oficial de liquidación de títulos públicos en dólares MEP.',
    sampleText: `BALANZ CAPITAL VALORES S.A.U. - Agente de Liquidación y Compensación Propio Nº 210
COMPROBANTE DE LIQUIDACIÓN DE OPERACIÓN BURSÁTIL
Boleto Nº: 2024-098241 | Fecha Concertación: 2024-04-12 | Liquidación: 2024-04-16 (T+2)
Comitente: 84920 / CUENTA INVERSOR INDIVIDUAL
Tipo de Operación: COMPRA
Especie: AL30D - BONOS DE LA REPÚBLICA ARGENTINA STEP UP 2030 USD
Mercado: BYMA | Moneda de Pago: DÓLARES ESTADOUNIDENSES (USD)
Cantidad Nominales: 2.000
Precio Unitario: USD 58,25 por cada 100 nominales (0.5825 c/u)
Monto Bruto: USD 1.165,00
Arancel Mercado: USD 0,93
Derechos BYMA: USD 0,47
Comisión ALyC: USD 5,82
Total Neto a Debitar: USD 1.172,22`,
    expectedData: {
      ticker: 'AL30',
      assetName: 'Bono República Argentina Step Up 2030 (AL30D)',
      assetCategory: 'Bonos / ON',
      operationType: 'BUY',
      quantity: 2000,
      price: 0.5825,
      currency: 'USD',
      fees: 7.22,
      totalAmount: 1172.22,
      ticketNumber: '2024-098241',
      date: '2024-04-12',
      broker: 'Balanz Capital',
      notes: 'Boleto BYMA liquidación en dólares MEP',
    },
  },
  {
    title: 'Boleto IOL: Compra CEDEAR MercadoLibre (MELI)',
    broker: 'InvertirOnline',
    badge: 'CEDEAR',
    description: 'Confirmación de ejecución de orden de CEDEAR en pesos.',
    sampleText: `INVERTIRONLINE S.A. ALyC y AN Integral Nº 273
CONCERTACIÓN Y BOLETO DE OPERACIÓN DE ACCIONES / CEDEARS
Número de Orden: #8921470 | Fecha: 2024-05-08 | Hora: 14:22:10
Cuenta Comitente: 334910
Operación: COMPRA CONTADO INMEDIATO
Instrumento: CEDEAR MERCADOLIBRE INC (MELI)
Cantidad: 12
Precio Ejecutado: ARS 32.450,00
Importe Bruto: ARS 389.400,00
Comisión IOL (0.5%): ARS 1.947,00
Derecho de Mercado e IVA: ARS 584,10
Total Final de la Operación: ARS 391.931,10`,
    expectedData: {
      ticker: 'MELI',
      assetName: 'MercadoLibre Inc. (CEDEAR)',
      assetCategory: 'Acciones / CEDEAR',
      operationType: 'BUY',
      quantity: 12,
      price: 32450.00,
      currency: 'ARS',
      fees: 2531.10,
      totalAmount: 391931.10,
      ticketNumber: 'ORD-8921470',
      date: '2024-05-08',
      broker: 'InvertirOnline (IOL)',
      notes: 'Compra CEDEAR MercadoLibre contado inmediato',
    },
  },
  {
    title: 'Boleto Interactive Brokers: Compra ETF SPY (USD)',
    broker: 'Interactive Brokers',
    badge: 'ETF Internacional',
    description: 'Trade Confirmation de orden ejecutada en NYSE Arca.',
    sampleText: `INTERACTIVE BROKERS LLC - TRADE CONFIRMATION
Account: U8392102 | Trade Date: 2024-05-20 | Settle Date: 2024-05-21
Order Reference: T-291048201
Transaction Type: BOT (BUY)
Symbol: SPY - SPDR S&P 500 ETF TRUST (ISIN: US78462F1030)
Quantity: 5 shares
Trade Price: USD 528.80
Gross Amount: USD 2,644.00
Commission & Brokerage Fees: USD 1.25
Regulatory & Transaction Fees: USD 0.18
Net Cash Amount: USD 2,645.43`,
    expectedData: {
      ticker: 'SPY',
      assetName: 'SPDR S&P 500 ETF Trust',
      assetCategory: 'ETFs / Fondos',
      operationType: 'BUY',
      quantity: 5,
      price: 528.80,
      currency: 'USD',
      fees: 1.43,
      totalAmount: 2645.43,
      ticketNumber: 'T-291048201',
      date: '2024-05-20',
      broker: 'Interactive Brokers',
      notes: 'Aporte periódico S&P 500 ETF',
    },
  },
  {
    title: 'Boleto Cocos Capital: Compra CEDEAR Nvidia (NVDA)',
    broker: 'Cocos Capital',
    badge: 'CEDEAR Tech',
    description: 'Boleto de compra en Cocos Capital sin comisiones.',
    sampleText: `COCOS CAPITAL S.A. - Agente ALyC Nº 610
BOLETO DE NEGOCIACIÓN DE VALORES NEGOCIABLES
Fecha: 2024-06-03 | Boleto ID: CC-774129
Operación: COMPRA
Especie: NVDA - NVIDIA CORP CEDEAR
Plazo: 24hs
Cantidad de Títulos: 30
Precio por Unidad: ARS 14.800,00
Subtotal: ARS 444.000,00
Comisión ALyC: ARS 0,00 (Plan Cocos Free)
Derechos de Mercado: ARS 355,20
IVA Derechos: ARS 74,59
Total a Liquidar: ARS 444.429,79`,
    expectedData: {
      ticker: 'NVDA',
      assetName: 'Nvidia Corp. (CEDEAR)',
      assetCategory: 'Acciones / CEDEAR',
      operationType: 'BUY',
      quantity: 30,
      price: 14800.00,
      currency: 'ARS',
      fees: 429.79,
      totalAmount: 444429.79,
      ticketNumber: 'CC-774129',
      date: '2024-06-03',
      broker: 'Cocos Capital',
      notes: 'Compra CEDEAR Nvidia en Cocos Capital',
    },
  },
];
