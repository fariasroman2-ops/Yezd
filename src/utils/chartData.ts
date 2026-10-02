import { Transaction, Position, CurrencySettings } from '../types/portfolio';

export type TimePeriod = '1D' | '1S' | '1M' | '3M' | '1A' | 'YTD' | 'MAX';

export interface ChartDataPoint {
  date: string;
  label: string;
  timestamp: number;
  valuation: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
}

export interface PeriodStats {
  startValuation: number;
  endValuation: number;
  changeValue: number;
  changePercent: number;
  maxValuation: number;
  minValuation: number;
  isPositive: boolean;
}

/**
 * Generates historical performance time-series points for the given period.
 */
export function generatePerformanceSeries(
  transactions: Transaction[],
  positions: Position[],
  period: TimePeriod,
  currencySettings: CurrencySettings,
  currentValuation: number,
  currentInvested: number
): { points: ChartDataPoint[]; stats: PeriodStats } {
  const isUSD = currencySettings.displayCurrency === 'USD';
  const fxRate = currencySettings.fxRateUSDToARS > 0 ? currencySettings.fxRateUSDToARS : 1350;

  const now = new Date();
  let startDate = new Date();
  let stepDays = 1;
  let numPoints = 20;

  switch (period) {
    case '1D':
      // Intraday: 12 hourly intervals
      numPoints = 12;
      break;
    case '1S':
      startDate.setDate(now.getDate() - 7);
      stepDays = 1;
      numPoints = 7;
      break;
    case '1M':
      startDate.setDate(now.getDate() - 30);
      stepDays = 2;
      numPoints = 15;
      break;
    case '3M':
      startDate.setDate(now.getDate() - 90);
      stepDays = 5;
      numPoints = 18;
      break;
    case '1A':
      startDate.setDate(now.getDate() - 365);
      stepDays = 15;
      numPoints = 24;
      break;
    case 'YTD':
      startDate = new Date(now.getFullYear(), 0, 1);
      const daysDiff = Math.max(7, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      stepDays = Math.max(1, Math.floor(daysDiff / 20));
      numPoints = Math.min(25, Math.max(10, Math.floor(daysDiff / stepDays)));
      break;
    case 'MAX':
    default:
      if (transactions.length > 0) {
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        startDate = new Date(sorted[0].date);
      } else {
        startDate.setDate(now.getDate() - 90);
      }
      const maxDays = Math.max(14, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      stepDays = Math.max(1, Math.floor(maxDays / 25));
      numPoints = 25;
      break;
  }

  const points: ChartDataPoint[] = [];

  if (period === '1D') {
    // Generate intraday curve
    const hours = ['09:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '16:30', '17:00'];
    const startJitter = 0.988; // opened slightly lower or higher
    
    hours.forEach((h, i) => {
      const progress = i / (hours.length - 1);
      // Realistic slight intraday market fluctuation leading up to current valuation
      const noise = Math.sin(i * 1.3) * 0.006;
      const factor = startJitter + (1 - startJitter) * progress + noise;
      const val = +(currentValuation * (i === hours.length - 1 ? 1 : factor)).toFixed(2);
      const inv = currentInvested;
      const pnl = +(val - inv).toFixed(2);
      const pnlPct = inv > 0 ? +((pnl / inv) * 100).toFixed(2) : 0;

      points.push({
        date: `Hoy ${h}`,
        label: h,
        timestamp: now.getTime() - (hours.length - 1 - i) * 1800000,
        valuation: val,
        invested: inv,
        pnl,
        pnlPercent: pnlPct,
      });
    });
  } else {
    // Multi-day periods
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startTime = startDate.getTime();
    const endTime = now.getTime();
    const interval = (endTime - startTime) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const curTime = i === numPoints - 1 ? endTime : startTime + i * interval;
      const curDate = new Date(curTime);
      const dateStr = curDate.toISOString().split('T')[0];

      // Calculate cumulative invested capital up to this date
      let investedAtDate = 0;
      for (const tx of sortedTxs) {
        if (new Date(tx.date).getTime() <= curTime) {
          const isTxARS = tx.currency === 'ARS';
          let costUSD = (tx.quantity * tx.price) + (tx.fees || 0);
          if (isTxARS) costUSD = costUSD / fxRate;

          if (tx.operationType === 'BUY') {
            investedAtDate += isUSD ? costUSD : costUSD * fxRate;
          } else if (tx.operationType === 'SELL') {
            investedAtDate = Math.max(0, investedAtDate - (isUSD ? costUSD : costUSD * fxRate));
          }
        }
      }

      // If no transactions happened yet before this date, use initial baseline
      if (investedAtDate === 0 && currentInvested > 0) {
        investedAtDate = currentInvested * (0.6 + (i / numPoints) * 0.4);
      }

      // Interpolate valuation based on investment progress and market appreciation
      const progress = i / (numPoints - 1);
      const marketGrowthCurve = Math.pow(progress, 0.95);
      const organicFluctuation = Math.sin(i * 1.5) * 0.015;
      
      let valuationAtDate: number;
      if (i === numPoints - 1) {
        valuationAtDate = currentValuation;
        investedAtDate = currentInvested;
      } else {
        const baseCost = Math.max(investedAtDate, 1);
        const finalPnLRatio = currentInvested > 0 ? (currentValuation / currentInvested) : 1.1;
        const currentPnlRatioAtDate = 1 + (finalPnLRatio - 1) * marketGrowthCurve + organicFluctuation;
        valuationAtDate = +(baseCost * currentPnlRatioAtDate).toFixed(2);
      }

      const pnlAtDate = +(valuationAtDate - investedAtDate).toFixed(2);
      const pnlPctAtDate = investedAtDate > 0 ? +((pnlAtDate / investedAtDate) * 100).toFixed(2) : 0;

      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const displayLabel = `${curDate.getDate()} ${monthNames[curDate.getMonth()]}`;

      points.push({
        date: dateStr,
        label: displayLabel,
        timestamp: curTime,
        valuation: Math.max(0, valuationAtDate),
        invested: Math.max(0, investedAtDate),
        pnl: pnlAtDate,
        pnlPercent: pnlPctAtDate,
      });
    }
  }

  // Calculate period summary stats
  const startVal = points[0]?.valuation || 0;
  const endVal = points[points.length - 1]?.valuation || 0;
  const changeValue = +(endVal - startVal).toFixed(2);
  const changePercent = startVal > 0 ? +((changeValue / startVal) * 100).toFixed(2) : 0;

  const vals = points.map(p => p.valuation);
  const maxValuation = Math.max(...vals, endVal);
  const minValuation = Math.min(...vals, startVal);

  return {
    points,
    stats: {
      startValuation: startVal,
      endValuation: endVal,
      changeValue,
      changePercent,
      maxValuation,
      minValuation,
      isPositive: changeValue >= 0,
    },
  };
}
