import { Candle } from '../types';

export type SignalRating = 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';

export interface IndicatorRow {
  name: string;
  value: number | string;
  action: 'Buy' | 'Sell' | 'Neutral';
}

export interface MovingAverageRow {
  name: string;
  value: number;
  action: 'Buy' | 'Sell' | 'Neutral';
}

export interface PivotPoints {
  pivot: number;
  s1: number;
  s2: number;
  s3: number;
  r1: number;
  r2: number;
  r3: number;
}

export interface TechnicalAnalysisResult {
  summary: {
    rating: SignalRating;
    buy: number;
    neutral: number;
    sell: number;
    scorePercent: number; // -100 to 100
  };
  indicators: {
    rating: SignalRating;
    buy: number;
    neutral: number;
    sell: number;
    scorePercent: number;
    rows: IndicatorRow[];
  };
  movingAverages: {
    rating: SignalRating;
    buy: number;
    neutral: number;
    sell: number;
    scorePercent: number;
    rows: MovingAverageRow[];
  };
  pivots: {
    classic: PivotPoints;
    fibonacci: PivotPoints;
    camarilla: PivotPoints;
  };
}

export const TF_LABEL_TO_KEY: Record<string, string> = {
  '1 Min': '1m',
  '5 Min': '5m',
  '15 Min': '15m',
  '30 Min': '30m',
  'Hourly': '1h',
  '5 Hours': '5h',
  'Daily': '1d',
  'Weekly': '1w',
  'Monthly': '1M',
};

export const TF_KEY_TO_LABEL: Record<string, string> = {
  '1m': '1 Min',
  '5m': '5 Min',
  '15m': '15 Min',
  '30m': '30 Min',
  '1h': 'Hourly',
  '5h': '5 Hours',
  '1d': 'Daily',
  '1w': 'Weekly',
  '1M': 'Monthly',
};

export const TF_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '5h': 18000,
  '1d': 86400,
  '1w': 604800,
  '1M': 2592000,
};

/**
 * Client-side candle aggregation helper
 */
export function aggregateCandlesClient(sourceCandles: Candle[], targetSeconds: number): Candle[] {
  if (!sourceCandles || sourceCandles.length === 0) return [];
  const aggregated: Candle[] = [];
  let currentBucket: Candle | null = null;
  
  sourceCandles.forEach((c: Candle) => {
    const candleTime = typeof c.time === 'number' 
      ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time)
      : Math.floor(new Date(c.time as string).getTime() / 1000);
      
    const bucketTime = Math.floor(candleTime / targetSeconds) * targetSeconds;
    
    if (!currentBucket || currentBucket.time !== bucketTime) {
      if (currentBucket) aggregated.push(currentBucket);
      currentBucket = {
        time: bucketTime,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      };
    } else {
      currentBucket.high = Math.max(currentBucket.high, c.high);
      currentBucket.low = Math.min(currentBucket.low, c.low);
      currentBucket.close = c.close;
    }
  });
  
  if (currentBucket) aggregated.push(currentBucket);
  return aggregated;
}

// Calculate EMA series or final value
export function calcEMA(prices: number[], period: number): number {
  if (!prices || prices.length === 0) return 0;
  if (prices.length <= period) {
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

// Calculate SMA
export function calcSMA(prices: number[], period: number): number {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

// Calculate WMA (Weighted Moving Average)
export function calcWMA(prices: number[], period: number): number {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-period);
  const n = slice.length;
  let weightSum = 0;
  let weightedTotal = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1;
    weightSum += weight;
    weightedTotal += slice[i] * weight;
  }
  return weightSum > 0 ? weightedTotal / weightSum : slice[slice.length - 1];
}

// Calculate RSI with Wilder's smoothing
export function calcRSI(closes: number[], period: number = 14): number {
  if (!closes || closes.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate Stochastic %K and %D
export function calcStochastic(candles: Candle[], kPeriod: number = 9, dPeriod: number = 6): { k: number; d: number } {
  if (!candles || candles.length < kPeriod) return { k: 50, d: 50 };
  
  const kValues: number[] = [];
  const startIdx = Math.max(0, candles.length - (kPeriod + dPeriod + 2));

  for (let i = startIdx + kPeriod; i <= candles.length; i++) {
    const window = candles.slice(i - kPeriod, i);
    const highestHigh = Math.max(...window.map(c => c.high));
    const lowestLow = Math.min(...window.map(c => c.low));
    const currentClose = window[window.length - 1].close;

    if (highestHigh === lowestLow) {
      kValues.push(50);
    } else {
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
  }

  const latestK = kValues[kValues.length - 1] ?? 50;
  const dSlice = kValues.slice(-dPeriod);
  const latestD = dSlice.length > 0 ? dSlice.reduce((a, b) => a + b, 0) / dSlice.length : latestK;

  return { k: latestK, d: latestD };
}

// Calculate MACD (12, 26, 9) in O(N) linear time
export function calcMACD(closes: number[]): { macd: number; signal: number; hist: number } {
  if (!closes || closes.length < 26) {
    return { macd: 0, signal: 0, hist: 0 };
  }

  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);
  const k9 = 2 / (9 + 1);

  // Compute EMA12 and EMA26 in a single linear pass
  let ema12 = 0;
  for (let i = 0; i < 12; i++) ema12 += closes[i];
  ema12 /= 12;

  let ema26 = 0;
  for (let i = 0; i < 26; i++) ema26 += closes[i];
  ema26 /= 26;

  for (let i = 12; i < 26; i++) {
    ema12 = closes[i] * k12 + ema12 * (1 - k12);
  }

  let macd = ema12 - ema26;
  let signal = macd;

  for (let i = 26; i < closes.length; i++) {
    ema12 = closes[i] * k12 + ema12 * (1 - k12);
    ema26 = closes[i] * k26 + ema26 * (1 - k26);
    macd = ema12 - ema26;
    signal = macd * k9 + signal * (1 - k9);
  }

  const hist = macd - signal;
  return { macd, signal, hist };
}

// Calculate ADX (14) with +DI and -DI
export function calcADX(candles: Candle[], period: number = 14): { adx: number; plusDI: number; minusDI: number } {
  if (!candles || candles.length < period + 1) {
    return { adx: 25, plusDI: 20, minusDI: 20 };
  }

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trs.push(tr);

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  if (trs.length < period) {
    return { adx: 25, plusDI: 20, minusDI: 20 };
  }

  let trSmooth = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let plusDMSmooth = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let minusDMSmooth = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];

  for (let i = period; i < trs.length; i++) {
    trSmooth = trSmooth - (trSmooth / period) + trs[i];
    plusDMSmooth = plusDMSmooth - (plusDMSmooth / period) + plusDMs[i];
    minusDMSmooth = minusDMSmooth - (minusDMSmooth / period) + minusDMs[i];

    const plusDI = trSmooth > 0 ? (plusDMSmooth / trSmooth) * 100 : 0;
    const minusDI = trSmooth > 0 ? (minusDMSmooth / trSmooth) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
  }

  const plusDI = trSmooth > 0 ? (plusDMSmooth / trSmooth) * 100 : 25;
  const minusDI = trSmooth > 0 ? (minusDMSmooth / trSmooth) * 100 : 25;
  const adx = dxValues.length >= period
    ? calcSMA(dxValues, period)
    : (dxValues.length > 0 ? dxValues[dxValues.length - 1] : 25);

  return { adx, plusDI, minusDI };
}

// Calculate Williams %R
export function calcWilliamsR(candles: Candle[], period: number = 14): number {
  if (!candles || candles.length < period) return -50;
  const window = candles.slice(-period);
  const highest = Math.max(...window.map(c => c.high));
  const lowest = Math.min(...window.map(c => c.low));
  const close = window[window.length - 1].close;
  if (highest === lowest) return -50;
  return ((highest - close) / (highest - lowest)) * -100;
}

// Calculate CCI (14)
export function calcCCI(candles: Candle[], period: number = 14): number {
  if (!candles || candles.length < period) return 0;
  const window = candles.slice(-period);
  const tps = window.map(c => (c.high + c.low + c.close) / 3);
  const meanTP = tps.reduce((a, b) => a + b, 0) / tps.length;
  const meanDev = tps.reduce((acc, tp) => acc + Math.abs(tp - meanTP), 0) / tps.length;
  const lastTP = tps[tps.length - 1];
  if (meanDev === 0) return 0;
  return (lastTP - meanTP) / (0.015 * meanDev);
}

// Calculate ATR (14)
export function calcATR(candles: Candle[], period: number = 14): number {
  if (!candles || candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    trs.push(Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    ));
  }
  return calcSMA(trs, Math.min(period, trs.length));
}

// Calculate Ultimate Oscillator (7, 14, 28)
export function calcUltimateOscillator(candles: Candle[]): number {
  if (!candles || candles.length < 29) return 50;
  
  const bps: number[] = [];
  const trs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const bp = curr.close - Math.min(curr.low, prev.close);
    const tr = Math.max(curr.high, prev.close) - Math.min(curr.low, prev.close);
    bps.push(bp);
    trs.push(tr);
  }

  const sumBP7 = bps.slice(-7).reduce((a, b) => a + b, 0);
  const sumTR7 = trs.slice(-7).reduce((a, b) => a + b, 0);
  const avg7 = sumTR7 > 0 ? sumBP7 / sumTR7 : 0.5;

  const sumBP14 = bps.slice(-14).reduce((a, b) => a + b, 0);
  const sumTR14 = trs.slice(-14).reduce((a, b) => a + b, 0);
  const avg14 = sumTR14 > 0 ? sumBP14 / sumTR14 : 0.5;

  const sumBP28 = bps.slice(-28).reduce((a, b) => a + b, 0);
  const sumTR28 = trs.slice(-28).reduce((a, b) => a + b, 0);
  const avg28 = sumTR28 > 0 ? sumBP28 / sumTR28 : 0.5;

  return 100 * ((4 * avg7 + 2 * avg14 + avg28) / 7);
}

// Helper to determine rating from scorePercent
export function scoreToRating(scorePercent: number): SignalRating {
  if (scorePercent >= 35) return 'Strong Buy';
  if (scorePercent >= 12) return 'Buy';
  if (scorePercent <= -35) return 'Strong Sell';
  if (scorePercent <= -12) return 'Sell';
  return 'Neutral';
}

/**
 * Fast summary rating computation for timeframe selector tabs.
 * Only calculates the core signals needed to determine the tab's rating badge.
 */
export function computeTimeframeSummaryRating(
  candles: Candle[],
  currentPrice: number
): SignalRating {
  if (!candles || candles.length < 5) return 'Neutral';

  const sourceCandles = candles.length > 250 ? candles.slice(-250) : candles;
  const lastIdx = sourceCandles.length - 1;
  const safePrice = currentPrice > 0 ? currentPrice : sourceCandles[lastIdx].close;
  
  const closes = sourceCandles.map((c, i) => i === lastIdx ? safePrice : c.close);

  let buy = 0;
  let sell = 0;
  let neutral = 0;

  const rsi = calcRSI(closes, 14);
  if (rsi > 58) buy++;
  else if (rsi < 42) sell++;
  else neutral++;

  const macdData = calcMACD(closes);
  if (macdData.macd > macdData.signal && macdData.macd > 0) buy++;
  else if (macdData.macd < macdData.signal && macdData.macd < 0) sell++;
  else neutral++;

  const maPeriods = [5, 10, 20, 50, 100, 200];
  maPeriods.forEach(p => {
    const sma = calcSMA(closes, p);
    const ema = calcEMA(closes, p);
    if (safePrice > sma) buy++;
    else if (safePrice < sma) sell++;
    else neutral++;

    if (safePrice > ema) buy++;
    else if (safePrice < ema) sell++;
    else neutral++;
  });

  const total = buy + sell + neutral;
  const scorePercent = total > 0 ? Math.round(((buy - sell) / total) * 100) : 0;
  return scoreToRating(scorePercent);
}

/**
 * Main Technical Analysis Engine
 * Uses real chart candles and the active live price to compute genuine signals.
 */
export function computeTechnicalAnalysis(
  candles: Candle[],
  currentPrice: number,
  timeframeStr: string = 'Hourly'
): TechnicalAnalysisResult {
  // If no candles provided, return a balanced neutral result
  if (!candles || candles.length === 0) {
    const safeP = currentPrice > 0 ? currentPrice : 100;
    return createDefaultAnalysis(safeP);
  }

  // Cap candles to the most recent 250 bars - sufficient for 200 SMA/EMA and all indicators
  const sourceCandles = candles.length > 250 ? candles.slice(-250) : candles;
  const candleList = sourceCandles.map(c => ({ ...c }));
  const lastIdx = candleList.length - 1;
  const safePrice = currentPrice > 0 ? currentPrice : candleList[lastIdx].close;
  
  candleList[lastIdx] = {
    ...candleList[lastIdx],
    close: safePrice,
    high: Math.max(candleList[lastIdx].high, safePrice),
    low: Math.min(candleList[lastIdx].low, safePrice),
  };

  const closes = candleList.map(c => c.close);
  const highs = candleList.map(c => c.high);
  const lows = candleList.map(c => c.low);

  // 1. Technical Indicators calculation
  const rsi = calcRSI(closes, 14);
  const stoch = calcStochastic(candleList, 9, 6);
  
  // Stochastic RSI (14) - bounded window
  const rsiSeries: number[] = [];
  const minCandles = Math.min(closes.length, 32);
  for (let i = Math.max(15, closes.length - minCandles); i <= closes.length; i++) {
    rsiSeries.push(calcRSI(closes.slice(0, i), 14));
  }
  let stochRsi = 50;
  if (rsiSeries.length >= 14) {
    const rsiWindow = rsiSeries.slice(-14);
    const rsiHigh = Math.max(...rsiWindow);
    const rsiLow = Math.min(...rsiWindow);
    const currRsi = rsiWindow[rsiWindow.length - 1];
    stochRsi = rsiHigh === rsiLow ? 50 : ((currRsi - rsiLow) / (rsiHigh - rsiLow)) * 100;
  }

  const macdData = calcMACD(closes);
  const adxData = calcADX(candleList, 14);
  const williamsR = calcWilliamsR(candleList, 14);
  const cci = calcCCI(candleList, 14);
  const atr = calcATR(candleList, 14);

  // Highs/Lows (14)
  const window14High = Math.max(...highs.slice(-14));
  const window14Low = Math.min(...lows.slice(-14));
  const hlMid = (window14High + window14Low) / 2;
  const hlDiff = safePrice - hlMid;

  // Ultimate Oscillator
  const uo = calcUltimateOscillator(candleList);

  // ROC (Rate of Change 14)
  const rocPeriod = 14;
  const prevClose14 = closes.length > rocPeriod ? closes[closes.length - 1 - rocPeriod] : closes[0];
  const roc = prevClose14 > 0 ? ((safePrice - prevClose14) / prevClose14) * 100 : 0;

  // Bull / Bear Power (Elder-Ray Index, 13)
  const ema13 = calcEMA(closes, 13);
  const bullPower = candleList[lastIdx].high - ema13;
  const bearPower = candleList[lastIdx].low - ema13;
  const combinedPower = bullPower + bearPower;

  // Classify Indicator Actions
  const indicatorRows: IndicatorRow[] = [
    {
      name: 'RSI (14)',
      value: rsi.toFixed(2),
      action: rsi > 58 ? 'Buy' : rsi < 42 ? 'Sell' : 'Neutral'
    },
    {
      name: 'STOCH (9,6)',
      value: stoch.k.toFixed(2),
      action: (stoch.k > 60 && stoch.k > stoch.d) ? 'Buy' : (stoch.k < 40 && stoch.k < stoch.d) ? 'Sell' : 'Neutral'
    },
    {
      name: 'STOCHRSI (14)',
      value: stochRsi.toFixed(2),
      action: stochRsi > 60 ? 'Buy' : stochRsi < 40 ? 'Sell' : 'Neutral'
    },
    {
      name: 'MACD (12,26)',
      value: macdData.macd.toFixed(4),
      action: (macdData.macd > macdData.signal && macdData.macd > 0) ? 'Buy' : (macdData.macd < macdData.signal && macdData.macd < 0) ? 'Sell' : 'Neutral'
    },
    {
      name: 'ADX (14)',
      value: adxData.adx.toFixed(2),
      action: adxData.adx >= 25 ? (adxData.plusDI > adxData.minusDI ? 'Buy' : 'Sell') : 'Neutral'
    },
    {
      name: 'Williams %R',
      value: williamsR.toFixed(2),
      action: williamsR > -45 ? 'Buy' : williamsR < -55 ? 'Sell' : 'Neutral'
    },
    {
      name: 'CCI (14)',
      value: cci.toFixed(2),
      action: cci > 80 ? 'Buy' : cci < -80 ? 'Sell' : (cci > 20 ? 'Buy' : cci < -20 ? 'Sell' : 'Neutral')
    },
    {
      name: 'ATR (14)',
      value: atr.toFixed(4),
      action: 'Neutral'
    },
    {
      name: 'Highs/Lows (14)',
      value: (safePrice > 0 ? (hlDiff / safePrice * 100) : 0).toFixed(2) + '%',
      action: hlDiff > (safePrice * 0.0002) ? 'Buy' : hlDiff < -(safePrice * 0.0002) ? 'Sell' : 'Neutral'
    },
    {
      name: 'Ultimate Oscillator',
      value: uo.toFixed(2),
      action: uo > 52 ? 'Buy' : uo < 48 ? 'Sell' : 'Neutral'
    },
    {
      name: 'ROC',
      value: roc.toFixed(2) + '%',
      action: roc > 0.05 ? 'Buy' : roc < -0.05 ? 'Sell' : 'Neutral'
    },
    {
      name: 'Bull/Bear Power(13)',
      value: combinedPower.toFixed(4),
      action: combinedPower > 0 ? 'Buy' : combinedPower < 0 ? 'Sell' : 'Neutral'
    },
  ];

  const indBuy = indicatorRows.filter(r => r.action === 'Buy').length;
  const indSell = indicatorRows.filter(r => r.action === 'Sell').length;
  const indNeutral = indicatorRows.filter(r => r.action === 'Neutral').length;
  const indTotal = indBuy + indSell + indNeutral;
  const indScorePercent = indTotal > 0 ? Math.round(((indBuy - indSell) / indTotal) * 100) : 0;
  const indicatorRating = scoreToRating(indScorePercent);

  // 2. Moving Averages calculation (SMA & EMA for 5, 10, 20, 50, 100, 200)
  const maPeriods = [5, 10, 20, 50, 100, 200];
  const maRows: MovingAverageRow[] = [];

  maPeriods.forEach(p => {
    const sma = calcSMA(closes, p);
    const ema = calcEMA(closes, p);

    const smaAction = safePrice > sma ? 'Buy' : safePrice < sma ? 'Sell' : 'Neutral';
    const emaAction = safePrice > ema ? 'Buy' : safePrice < ema ? 'Sell' : 'Neutral';

    maRows.push({ name: `MA${p} (SMA)`, value: Number(sma.toFixed(4)), action: smaAction });
    maRows.push({ name: `EMA${p}`, value: Number(ema.toFixed(4)), action: emaAction });
  });

  // Additional MAs: Ichimoku Base Line, VWMA, Hull MA
  // Ichimoku Base Line (26): (HH26 + LL26) / 2
  const window26 = candleList.slice(-26);
  const ichimokuBase = (Math.max(...window26.map(c => c.high)) + Math.min(...window26.map(c => c.low))) / 2;
  maRows.push({
    name: 'Ichimoku Base Line',
    value: Number(ichimokuBase.toFixed(4)),
    action: safePrice >= ichimokuBase ? 'Buy' : 'Sell'
  });

  // VWMA (20) / Weighted
  const vwma20 = calcWMA(closes, 20);
  maRows.push({
    name: 'VWMA (20)',
    value: Number(vwma20.toFixed(4)),
    action: safePrice >= vwma20 ? 'Buy' : 'Sell'
  });

  // Hull MA (9)
  const wmaHalf = calcWMA(closes, 5);
  const wmaFull = calcWMA(closes, 9);
  const diffHull = 2 * wmaHalf - wmaFull;
  maRows.push({
    name: 'Hull MA (9)',
    value: Number(diffHull.toFixed(4)),
    action: safePrice >= diffHull ? 'Buy' : 'Sell'
  });

  const maBuy = maRows.filter(r => r.action === 'Buy').length;
  const maSell = maRows.filter(r => r.action === 'Sell').length;
  const maNeutral = maRows.filter(r => r.action === 'Neutral').length;
  const maTotal = maBuy + maSell + maNeutral;
  const maScorePercent = maTotal > 0 ? Math.round(((maBuy - maSell) / maTotal) * 100) : 0;
  const maRating = scoreToRating(maScorePercent);

  // 3. Combined Summary
  const summaryBuy = indBuy + maBuy;
  const summarySell = indSell + maSell;
  const summaryNeutral = indNeutral + maNeutral;
  const summaryTotal = summaryBuy + summarySell + summaryNeutral;
  const summaryScorePercent = summaryTotal > 0 ? Math.round(((summaryBuy - summarySell) / summaryTotal) * 100) : 0;
  const summaryRating = scoreToRating(summaryScorePercent);

  // 4. Pivot Points calculation (from last complete bar or 30-bar session)
  const prevBar = candleList.length >= 2 ? candleList[candleList.length - 2] : candleList[candleList.length - 1];
  const pHigh = prevBar.high;
  const pLow = prevBar.low;
  const pClose = prevBar.close;
  const pp = (pHigh + pLow + pClose) / 3;

  const classicPivots: PivotPoints = {
    pivot: pp,
    s1: 2 * pp - pHigh,
    s2: pp - (pHigh - pLow),
    s3: pLow - 2 * (pHigh - pp),
    r1: 2 * pp - pLow,
    r2: pp + (pHigh - pLow),
    r3: pHigh + 2 * (pp - pLow)
  };

  const range = pHigh - pLow;
  const fiboPivots: PivotPoints = {
    pivot: pp,
    s1: pp - 0.382 * range,
    s2: pp - 0.618 * range,
    s3: pp - 1.000 * range,
    r1: pp + 0.382 * range,
    r2: pp + 0.618 * range,
    r3: pp + 1.000 * range
  };

  const camPivots: PivotPoints = {
    pivot: pp,
    s1: pClose - (range * 1.1) / 12,
    s2: pClose - (range * 1.1) / 6,
    s3: pClose - (range * 1.1) / 4,
    r1: pClose + (range * 1.1) / 12,
    r2: pClose + (range * 1.1) / 6,
    r3: pClose + (range * 1.1) / 4
  };

  return {
    summary: {
      rating: summaryRating,
      buy: summaryBuy,
      neutral: summaryNeutral,
      sell: summarySell,
      scorePercent: summaryScorePercent
    },
    indicators: {
      rating: indicatorRating,
      buy: indBuy,
      neutral: indNeutral,
      sell: indSell,
      scorePercent: indScorePercent,
      rows: indicatorRows
    },
    movingAverages: {
      rating: maRating,
      buy: maBuy,
      neutral: maNeutral,
      sell: maSell,
      scorePercent: maScorePercent,
      rows: maRows
    },
    pivots: {
      classic: classicPivots,
      fibonacci: fiboPivots,
      camarilla: camPivots
    }
  };
}

function createDefaultAnalysis(safePrice: number): TechnicalAnalysisResult {
  const pp = safePrice;
  const classic: PivotPoints = {
    pivot: pp,
    s1: pp * 0.998,
    s2: pp * 0.995,
    s3: pp * 0.990,
    r1: pp * 1.002,
    r2: pp * 1.005,
    r3: pp * 1.010
  };

  return {
    summary: {
      rating: 'Neutral',
      buy: 8,
      neutral: 9,
      sell: 8,
      scorePercent: 0
    },
    indicators: {
      rating: 'Neutral',
      buy: 4,
      neutral: 5,
      sell: 3,
      scorePercent: 8,
      rows: []
    },
    movingAverages: {
      rating: 'Neutral',
      buy: 4,
      neutral: 4,
      sell: 5,
      scorePercent: -7,
      rows: []
    },
    pivots: {
      classic,
      fibonacci: classic,
      camarilla: classic
    }
  };
}
