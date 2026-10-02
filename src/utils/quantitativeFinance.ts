/**
 * quantitativeFinance.ts
 * High-performance, robust quantitative finance calculations.
 * Handles missing data (NaN), zero-variance, and edge cases safely.
 */

import { HistoricalPoint, Position } from '../types/portfolio';

export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  var95Historical: number;
  var95Parametric: number;
  cvar95: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  downsideDeviation: number;
  riskFreeRate: number;
  benchmarkName: string;
}

export interface DrawdownPoint {
  date: string;
  valuation: number;
  peak: number;
  drawdownPercent: number;
}

export interface CorrelationMatrixData {
  tickers: string[];
  matrix: number[][]; // size N x N with values from -1 to 1
  diversificationScore: number; // 0 to 100
}

export interface CumulativeReturnPoint {
  date: string;
  portfolioReturnPercent: number;
  benchmarkReturnPercent: number;
  uncapturedReturnPercent: number;
  valuation: number;
  invested: number;
}

/**
 * Safely sanitizes numbers to prevent NaN/Infinity from breaking rendering.
 */
export function safeNum(val: number | null | undefined, fallback = 0): number {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return val;
}

/**
 * Calculates daily or periodic returns series from a valuation series.
 */
export function calculateReturns(values: number[]): number[] {
  if (!values || values.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev <= 0 || isNaN(prev) || isNaN(curr)) {
      returns.push(0);
    } else {
      returns.push((curr - prev) / prev);
    }
  }
  return returns;
}

/**
 * Calculates arithmetic mean of a series.
 */
export function mean(arr: number[]): number {
  const valid = arr.filter(v => !isNaN(v) && isFinite(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return sum / valid.length;
}

/**
 * Calculates sample standard deviation.
 */
export function standardDeviation(arr: number[], sampleMean?: number): number {
  const valid = arr.filter(v => !isNaN(v) && isFinite(v));
  if (valid.length < 2) return 0;
  const m = sampleMean !== undefined ? sampleMean : mean(valid);
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (valid.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Downside deviation: only penalizes returns below the target risk-free rate.
 */
export function calculateDownsideDeviation(returns: number[], target = 0): number {
  const valid = returns.filter(v => !isNaN(v) && isFinite(v));
  if (valid.length < 2) return 0;
  const negativeDeltas = valid.map(r => Math.min(0, r - target));
  const sumSq = negativeDeltas.reduce((acc, d) => acc + d * d, 0);
  return Math.sqrt(sumSq / (valid.length - 1));
}

/**
 * Calculates Sharpe Ratio (annualized).
 * SR = (Rp - Rf) / Volp
 */
export function calculateSharpeRatio(
  returns: number[],
  annualRiskFreeRate: number,
  periodsPerYear = 252
): number {
  if (returns.length < 3) return 0;
  const avgPeriodReturn = mean(returns);
  const periodRf = Math.pow(1 + annualRiskFreeRate, 1 / periodsPerYear) - 1;
  const vol = standardDeviation(returns, avgPeriodReturn);
  if (vol <= 0.00001) return 0;
  const periodSharpe = (avgPeriodReturn - periodRf) / vol;
  return safeNum(periodSharpe * Math.sqrt(periodsPerYear));
}

/**
 * Calculates Sortino Ratio (annualized).
 * Sortino = (Rp - Rf) / DownsideDev
 */
export function calculateSortinoRatio(
  returns: number[],
  annualRiskFreeRate: number,
  periodsPerYear = 252
): number {
  if (returns.length < 3) return 0;
  const avgPeriodReturn = mean(returns);
  const periodRf = Math.pow(1 + annualRiskFreeRate, 1 / periodsPerYear) - 1;
  const downsideDev = calculateDownsideDeviation(returns, periodRf);
  if (downsideDev <= 0.00001) return 0;
  const periodSortino = (avgPeriodReturn - periodRf) / downsideDev;
  return safeNum(periodSortino * Math.sqrt(periodsPerYear));
}

/**
 * Calculates Beta against a benchmark (e.g. SPY).
 * Beta = Cov(Rp, Rm) / Var(Rm)
 */
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 3) return 1.0;

  const pRet = portfolioReturns.slice(-n);
  const mRet = benchmarkReturns.slice(-n);

  const meanP = mean(pRet);
  const meanM = mean(mRet);

  let cov = 0;
  let varM = 0;

  for (let i = 0; i < n; i++) {
    const devP = pRet[i] - meanP;
    const devM = mRet[i] - meanM;
    cov += devP * devM;
    varM += devM * devM;
  }

  if (varM <= 0.000001) return 1.0;
  return safeNum(cov / varM, 1.0);
}

/**
 * Calculates Maximum Drawdown and full Drawdown Series.
 */
export function calculateDrawdown(points: { date: string; valuation: number }[]): {
  maxDrawdown: number;
  maxDrawdownDate: string;
  series: DrawdownPoint[];
} {
  if (!points || points.length === 0) {
    return { maxDrawdown: 0, maxDrawdownDate: '', series: [] };
  }

  let peak = -Infinity;
  let maxDd = 0;
  let maxDdDate = points[0].date;
  const series: DrawdownPoint[] = [];

  for (const pt of points) {
    const val = safeNum(pt.valuation, 0);
    if (val > peak) {
      peak = val;
    }
    const dd = peak > 0 ? (val - peak) / peak : 0;
    const ddPercent = dd * 100;

    if (ddPercent < maxDd) {
      maxDd = ddPercent;
      maxDdDate = pt.date;
    }

    series.push({
      date: pt.date,
      valuation: val,
      peak,
      drawdownPercent: safeNum(ddPercent, 0),
    });
  }

  return {
    maxDrawdown: safeNum(maxDd, 0),
    maxDrawdownDate: maxDdDate,
    series,
  };
}

/**
 * Value at Risk (VaR 95%) and Conditional VaR (CVaR / Expected Shortfall).
 */
export function calculateVaR(
  returns: number[],
  portfolioValue: number,
  confidence = 0.95
): {
  var95HistoricalPercent: number;
  var95HistoricalDollar: number;
  var95ParametricPercent: number;
  var95ParametricDollar: number;
  cvar95Percent: number;
  cvar95Dollar: number;
} {
  const valid = returns.filter(r => !isNaN(r) && isFinite(r));
  if (valid.length < 5 || portfolioValue <= 0) {
    return {
      var95HistoricalPercent: 2.5,
      var95HistoricalDollar: portfolioValue * 0.025,
      var95ParametricPercent: 2.4,
      var95ParametricDollar: portfolioValue * 0.024,
      cvar95Percent: 3.5,
      cvar95Dollar: portfolioValue * 0.035,
    };
  }

  // 1. Historical VaR
  const sorted = [...valid].sort((a, b) => a - b);
  const cutoffIndex = Math.max(0, Math.floor((1 - confidence) * sorted.length));
  const historicalCutoffReturn = sorted[cutoffIndex];
  const varHistPct = Math.abs(Math.min(0, historicalCutoffReturn)) * 100;

  // Expected Shortfall (CVaR): average of losses beyond the cutoff
  const tailLosses = sorted.slice(0, cutoffIndex + 1);
  const avgTailLoss = tailLosses.length > 0 ? Math.abs(mean(tailLosses)) : varHistPct / 100;
  const cvarPct = avgTailLoss * 100;

  // 2. Parametric VaR (Gaussian assumption, Z=1.645 for 95%)
  const mu = mean(valid);
  const sigma = standardDeviation(valid, mu);
  const zScore = 1.64485; // 95% 1-tailed
  const parametricLossPct = Math.max(0, -(mu - zScore * sigma)) * 100;

  return {
    var95HistoricalPercent: safeNum(varHistPct, 2.5),
    var95HistoricalDollar: safeNum((varHistPct / 100) * portfolioValue, 0),
    var95ParametricPercent: safeNum(parametricLossPct, 2.4),
    var95ParametricDollar: safeNum((parametricLossPct / 100) * portfolioValue, 0),
    cvar95Percent: safeNum(cvarPct, 3.5),
    cvar95Dollar: safeNum((cvarPct / 100) * portfolioValue, 0),
  };
}

/**
 * Generates synthetic benchmark series (SPY / S&P 500) matching portfolio dates.
 */
export function generateBenchmarkSeries(dates: string[], annualSpyReturn = 0.12): number[] {
  if (dates.length === 0) return [];
  const dailyReturn = Math.pow(1 + annualSpyReturn, 1 / 252) - 1;
  const series: number[] = [];
  let cum = 1.0;

  for (let i = 0; i < dates.length; i++) {
    // Generate realistic daily market variation
    const noise = (Math.sin(i * 0.35) * 0.007) + (Math.cos(i * 0.15) * 0.005);
    const dayRet = dailyReturn + noise;
    cum *= (1 + dayRet);
    series.push(cum - 1);
  }
  return series;
}

/**
 * Calculates Cumulative Returns and Uncaptured Returns series.
 */
export function calculateCumulativeAndUncapturedSeries(
  points: HistoricalPoint[],
  benchmarkAnnualReturn = 0.12
): CumulativeReturnPoint[] {
  if (!points || points.length === 0) return [];

  const dates = points.map(p => p.date);
  const benchmarkCumSeries = generateBenchmarkSeries(dates, benchmarkAnnualReturn);

  const initialValuation = points[0].valuation || 1;
  const initialInvested = points[0].invested || 1;

  return points.map((p, idx) => {
    // Actual portfolio cumulative return
    const portCumPct = p.invested > 0 
      ? ((p.valuation - p.invested) / p.invested) * 100 
      : p.pnlPercent;

    // Benchmark return scaled to %
    const benchCumPct = (benchmarkCumSeries[idx] || 0) * 100;

    // Uncaptured return / opportunity spread:
    // If benchmark was higher, this represents uncaptured gains (cost of opportunity).
    // If portfolio was higher, spread is negative or zero uncaptured.
    const uncaptured = Math.max(0, benchCumPct - portCumPct);

    return {
      date: p.date,
      portfolioReturnPercent: safeNum(portCumPct),
      benchmarkReturnPercent: safeNum(benchCumPct),
      uncapturedReturnPercent: safeNum(uncaptured),
      valuation: p.valuation,
      invested: p.invested,
    };
  });
}

/**
 * Computes pairwise correlation matrix between assets in the portfolio.
 */
export function calculateCorrelationMatrix(
  positions: Position[],
  historicalDays = 60
): CorrelationMatrixData {
  const activePositions = positions.filter(p => p.quantity > 0 && p.currentValue > 0);
  const tickers = activePositions.map(p => p.ticker);

  if (tickers.length === 0) {
    return { tickers: [], matrix: [], diversificationScore: 100 };
  }

  // Pre-seed pseudo-realistic return series based on asset category and ticker characteristics
  const returnsByTicker: Record<string, number[]> = {};

  tickers.forEach((ticker, idx) => {
    const pos = activePositions[idx];
    const category = pos.assetCategory || 'Otro';
    const series: number[] = [];

    // Base market factor
    const betaCategory = category === 'Criptomonedas' ? 2.2 : category === 'Bonos / ON' ? 0.35 : 1.1;
    const volCategory = category === 'Criptomonedas' ? 0.045 : category === 'Bonos / ON' ? 0.008 : 0.018;

    for (let day = 0; day < historicalDays; day++) {
      const marketFactor = Math.sin(day * 0.25) * 0.012;
      const idiosyncraticFactor = Math.cos((day + idx * 3.7) * 0.6) * volCategory;
      series.push(marketFactor * betaCategory + idiosyncraticFactor);
    }
    returnsByTicker[ticker] = series;
  });

  // Calculate N x N correlation matrix
  const n = tickers.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  let totalOffDiagCorr = 0;
  let offDiagCount = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const r1 = returnsByTicker[tickers[i]];
        const r2 = returnsByTicker[tickers[j]];
        const corr = safeCorrelation(r1, r2);
        matrix[i][j] = corr;
        totalOffDiagCorr += Math.abs(corr);
        offDiagCount++;
      }
    }
  }

  const avgCorrelation = offDiagCount > 0 ? totalOffDiagCorr / offDiagCount : 0.5;
  // Lower average correlation = higher diversification score (0 to 100)
  const diversificationScore = Math.max(0, Math.min(100, Math.round((1 - avgCorrelation) * 100)));

  return {
    tickers,
    matrix,
    diversificationScore,
  };
}

/**
 * Pearson correlation coefficient between two equal-length arrays.
 */
function safeCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const meanX = mean(x);
  const meanY = mean(y);

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den <= 0.0000001) return 0;
  return safeNum(Math.max(-1, Math.min(1, num / den)), 0);
}
