import { Candle } from '../types';

export interface IndicatorSeries {
  time: number;
  value: number | null;
  color: string;
  label?: string;
}

export interface Signal {
  time: number;
  type: 'BUY' | 'SELL';
  price: number;
  comment?: string;
}

export interface IndicatorLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

export interface IndicatorLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  textcolor: string;
  badge?: boolean;
}

export interface IndicatorBox {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  bordercolor: string;
  label?: string;
  borderstyle?: 'solid' | 'dashed' | 'dotted';
}

export interface FootprintCluster {
  price: number;
  bid: number;
  ask: number;
  isPOC?: boolean;
  isBuyImbalance?: boolean;
  isSellImbalance?: boolean;
  isStackedBuyImbalance?: boolean;
  isStackedSellImbalance?: boolean;
}

export interface FootprintDirectionSignal {
  type: 'BULLISH' | 'BEARISH';
  code: 'STACKED_BUY_IMBALANCE' | 'STACKED_SELL_IMBALANCE' | 'DELTA_AT_SUPPORT' | 'DELTA_AT_RESISTANCE' | 'POC_BOTTOM_TRAP' | 'POC_TOP_ABSORPTION';
  title: string;
  desc: string;
  detail?: string;
}

export interface FootprintCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  clusters: FootprintCluster[];
  pocPrice: number;
  delta: number;
  volume: number;
  signals?: FootprintDirectionSignal[];
  hasStackedBuyImbalance?: boolean;
  hasStackedSellImbalance?: boolean;
  isPositiveDeltaAtSupport?: boolean;
  isNegativeDeltaAtResistance?: boolean;
  isPocAtBottomTrap?: boolean;
  isPocAtTopAbsorption?: boolean;
}

export interface DeltaDirectionSignal {
  time: number;
  type: 'BULLISH' | 'BEARISH';
  code: 'CVD_DIVERGENCE_ABSORPTION' | 'CVD_BREAKOUT' | 'CVD_BREAKDOWN' | 'DELTA_FLIP_SUPPORT' | 'DELTA_FLIP_RESISTANCE' | 'DELTA_EXHAUSTION_LOWS' | 'DELTA_EXHAUSTION_HIGHS';
  title: string;
  desc: string;
  detail?: string;
  barIndex: number;
  value?: number;
}

export interface DeltaPoint {
  time: number;
  delta: number;
  cvd: number;
  volume: number;
  signal?: DeltaDirectionSignal;
}

export interface CVDLine {
  id: string;
  x1Time: number;
  y1Cvd: number;
  x2Time: number;
  y2Cvd: number;
  color: string;
  label?: string;
  type?: 'REGULAR_BULLISH' | 'REGULAR_BEARISH' | 'HIDDEN_BULLISH' | 'HIDDEN_BEARISH';
}

export interface IndicatorBand {
  upperIndex: number;
  lowerIndex: number;
  color: string;
}

export interface IndicatorOutput {
  id: string;
  name: string;
  overlay: boolean;
  plots: IndicatorSeries[][];
  signals: Signal[];
  lines: IndicatorLine[];
  labels: IndicatorLabel[];
  boxes: IndicatorBox[];
  bands: IndicatorBand[];
  footprints?: FootprintCandle[];
  deltaData?: DeltaPoint[];
  deltaSignals?: DeltaDirectionSignal[];
  cvdLines?: CVDLine[];
  backgroundColorZones: { start: number; end: number | null; color: string; label?: string }[];
  currentEntryPrice?: number | null;
  params?: Record<string, any>;
}

// Technical Analysis Helpers
export const TA = {
  tr: (high: number[], low: number[], close: number[]): (number | null)[] => {
    const res: (number | null)[] = [null];
    for (let i = 1; i < high.length; i++) {
      res.push(Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      ));
    }
    return res;
  },

  atr: (high: number[], low: number[], close: number[], length: number): (number | null)[] => {
    const tr = TA.tr(high, low, close);
    const validTr = tr.map(v => v === null ? 0 : v);
    return TA.sma(validTr, length);
  },

  sma: (data: (number | null)[], length: number): (number | null)[] => {
    if (length <= 0) return data.map(() => null);
    return data.map((_, i) => {
      if (i < length - 1) return null;
      let sum = 0;
      let count = 0;
      for (let j = 0; j < length; j++) {
        const val = data[i - j];
        if (val === null || val === undefined || isNaN(val)) return null;
        sum += val;
        count++;
      }
      return count === length ? sum / length : null;
    });
  },

  stdev: (data: (number | null)[], length: number): (number | null)[] => {
    if (length <= 1) return data.map(() => 0);
    const sma = TA.sma(data, length);
    return data.map((_, i) => {
      if (i < length - 1) return null;
      const mean = sma[i];
      if (mean === null) return null;
      let varianceSum = 0;
      for (let j = 0; j < length; j++) {
        const val = data[i - j];
        if (val === null || isNaN(val)) return null;
        varianceSum += Math.pow(val - mean, 2);
      }
      return Math.sqrt(varianceSum / length);
    });
  },

  ema: (data: (number | null)[], length: number): (number | null)[] => {
    if (data.length < length || length <= 0) return data.map(() => null);
    const k = 2 / (length + 1);
    const result: (number | null)[] = new Array(data.length).fill(null);
    
    let sum = 0;
    let validCount = 0;
    for (let i = 0; i < length; i++) {
      const v = data[i];
      if (v === null || v === undefined || isNaN(v)) break;
      sum += v;
      validCount++;
    }

    if (validCount !== length) return result;
    
    let prevEMA = sum / length;
    result[length - 1] = prevEMA;

    for (let i = length; i < data.length; i++) {
      const v = data[i];
      if (v === null || v === undefined || isNaN(v)) {
        result[i] = null;
      } else {
        prevEMA = (v - prevEMA) * k + prevEMA;
        result[i] = prevEMA;
      }
    }
    return result;
  },

  wma: (data: (number | null)[], length: number): (number | null)[] => {
    if (length <= 0) return data.map(() => null);
    const weightSum = (length * (length + 1)) / 2;
    return data.map((_, i) => {
      if (i < length - 1) return null;
      let sum = 0;
      let count = 0;
      for (let j = 0; j < length; j++) {
        const val = data[i - j];
        if (val === null || val === undefined || isNaN(val)) return null;
        sum += val * (length - j);
        count++;
      }
      return count === length ? sum / weightSum : null;
    });
  },

  hma: (data: (number | null)[], length: number): (number | null)[] => {
    if (data.length < length || length < 2) return data.map(() => null);
    const halfLen = Math.max(1, Math.floor(length / 2));
    const sqrtLen = Math.max(1, Math.floor(Math.sqrt(length)));

    const wmaHalf = TA.wma(data, halfLen);
    const wmaFull = TA.wma(data, length);

    const rawHMA: (number | null)[] = data.map((_, i) => {
      const h = wmaHalf[i];
      const f = wmaFull[i];
      if (h === null || f === null) return null;
      return 2 * h - f;
    });

    return TA.wma(rawHMA, sqrtLen);
  },

  rsi: (data: (number | null)[], length: number): (number | null)[] => {
    if (data.length <= length || length <= 0) return data.map(() => null);
    
    const validData = data.map(v => v ?? 0);
    const result: (number | null)[] = new Array(data.length).fill(null);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= length; i++) {
      const diff = validData[i] - validData[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }

    let avgGain = gains / length;
    let avgLoss = losses / length;

    result[length] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

    for (let i = length + 1; i < validData.length; i++) {
      const diff = validData[i] - validData[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
      result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
    }

    return result;
  }
};

// Color resolver helper
function resolveColorString(expr: string): string {
  const clean = expr.trim().replace(/['"]/g, '');
  if (clean.startsWith('#') || clean.startsWith('rgb')) return clean;
  if (clean.includes('color.green') || clean === 'green') return '#26a69a';
  if (clean.includes('color.red') || clean === 'red') return '#ef5350';
  if (clean.includes('color.blue') || clean === 'blue') return '#2962ff';
  if (clean.includes('color.orange') || clean === 'orange') return '#ff9800';
  if (clean.includes('color.purple') || clean === 'purple') return '#ab47bc';
  if (clean.includes('color.yellow') || clean === 'yellow') return '#ffeb3b';
  if (clean.includes('color.teal') || clean === 'teal') return '#00b4d8';
  if (clean.includes('color.white') || clean === 'white') return '#ffffff';
  if (clean.includes('color.gray') || clean === 'gray') return '#787b86';
  return '#2962ff';
}

// Deterministic pseudo-random helper for candle cluster generation
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Source extractor helper
function getPriceSeries(candles: Candle[], source: string = 'close'): (number | null)[] {
  const s = source.toLowerCase();
  if (s === 'open') return candles.map(c => c.open);
  if (s === 'high') return candles.map(c => c.high);
  if (s === 'low') return candles.map(c => c.low);
  if (s === 'hl2') return candles.map(c => (c.high + c.low) / 2);
  if (s === 'hlc3') return candles.map(c => (c.high + c.low + c.close) / 3);
  if (s === 'ohlc4') return candles.map(c => (c.open + c.high + c.low + c.close) / 4);
  return candles.map(c => c.close);
}

// The "Runner" that executes Pine Script logic and Smart Money / Order Flow algorithms
export function runPineEngine(
  indicator: { id: string; name: string; code: string; params?: Record<string, any> },
  candles: Candle[],
  timeframe: string = '1h'
): IndicatorOutput {
  const params = indicator.params || {};
  const closePrices = candles.map(c => c.close);
  const openPrices = candles.map(c => c.open);
  const highPrices = candles.map(c => c.high);
  const lowPrices = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 100);
  const times = candles.map(c => (typeof c.time === 'number' ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time) : Math.floor(new Date(c.time as string).getTime() / 1000)));

  // Detect overlay setting
  let isOverlay = true;
  const indicatorLineMatch = indicator.code.match(/indicator\s*\([^)]*overlay\s*=\s*(true|false)[^)]*\)/i);
  if (indicatorLineMatch) {
    isOverlay = indicatorLineMatch[1].toLowerCase() === 'true';
  } else if (
    indicator.name.toLowerCase().includes('rsi') || 
    indicator.name.toLowerCase().includes('delta') ||
    indicator.name.toLowerCase().includes('stoch') || 
    indicator.name.toLowerCase().includes('macd') || 
    indicator.name.toLowerCase().includes('oscillator')
  ) {
    isOverlay = false;
  }
  
  const output: IndicatorOutput = {
    id: indicator.id,
    name: indicator.name,
    overlay: isOverlay,
    plots: [],
    signals: [],
    lines: [],
    labels: [],
    boxes: [],
    bands: [],
    backgroundColorZones: [],
    params: params
  };

  if (candles.length === 0) return output;

  const idLower = (indicator.id + ' ' + indicator.name).toLowerCase();

  // ==========================================
  // 1. SESSIONS INDICATOR (Asian, London, NY)
  // ==========================================
  if (idLower.includes('session')) {
    const showAsian = params.show_asian ?? true;
    const showLondon = params.show_london ?? true;
    const showNY = params.show_ny ?? true;
    const showBoxes = params.show_range_boxes ?? true;
    const showOpenLine = params.show_open_lines ?? true;

    interface SessionTrack {
      name: string;
      color: string;
      borderColor: string;
      startHour: number;
      endHour: number;
      active: boolean;
      currentBox: { startIdx: number; high: number; low: number; openPrice: number } | null;
    }

    const sessionDefs: SessionTrack[] = [
      { 
        name: 'Asian', 
        color: params.asian_color ? `${params.asian_color}18` : 'rgba(156, 39, 176, 0.08)', 
        borderColor: params.asian_color || 'rgba(156, 39, 176, 0.5)', 
        startHour: params.asian_start ?? 0, 
        endHour: params.asian_end ?? 9, 
        active: showAsian,
        currentBox: null 
      },
      { 
        name: 'London', 
        color: params.london_color ? `${params.london_color}18` : 'rgba(0, 180, 216, 0.08)', 
        borderColor: params.london_color || 'rgba(0, 180, 216, 0.5)', 
        startHour: params.london_start ?? 8, 
        endHour: params.london_end ?? 16.5, 
        active: showLondon,
        currentBox: null 
      },
      { 
        name: 'New York', 
        color: params.ny_color ? `${params.ny_color}18` : 'rgba(255, 152, 0, 0.08)', 
        borderColor: params.ny_color || 'rgba(255, 152, 0, 0.5)', 
        startHour: params.ny_start ?? 13, 
        endHour: params.ny_end ?? 21, 
        active: showNY,
        currentBox: null 
      }
    ];

    candles.forEach((c, idx) => {
      const epochSec = times[idx];
      const d = new Date(epochSec * 1000);
      const curHour = d.getUTCHours() + d.getUTCMinutes() / 60;

      sessionDefs.forEach(sess => {
        if (!sess.active) return;
        const inSession = curHour >= sess.startHour && curHour < sess.endHour;
        if (inSession) {
          if (!sess.currentBox) {
            sess.currentBox = { startIdx: idx, high: c.high, low: c.low, openPrice: c.open };
          } else {
            sess.currentBox.high = Math.max(sess.currentBox.high, c.high);
            sess.currentBox.low = Math.min(sess.currentBox.low, c.low);
          }
        } else {
          if (sess.currentBox) {
            const startT = times[sess.currentBox.startIdx];
            const endT = times[idx - 1] || startT;
            if (showBoxes) {
              output.boxes.push({
                id: `sess-${sess.name}-${startT}`,
                x1: startT,
                y1: sess.currentBox.high,
                x2: endT,
                y2: sess.currentBox.low,
                color: sess.color,
                bordercolor: sess.borderColor,
                label: `${sess.name} Session`
              });
            }
            if (showOpenLine) {
              output.lines.push({
                id: `sess-open-${sess.name}-${startT}`,
                x1: startT,
                y1: sess.currentBox.openPrice,
                x2: endT,
                y2: sess.currentBox.openPrice,
                color: sess.borderColor,
                width: 1,
                style: 'dashed'
              });
            }
            sess.currentBox = null;
          }
        }
      });
    });

    // Close any active session boxes up to the latest candle
    sessionDefs.forEach(sess => {
      if (sess.active && sess.currentBox) {
        const startT = times[sess.currentBox.startIdx];
        const endT = times[times.length - 1];
        if (showBoxes) {
          output.boxes.push({
            id: `sess-${sess.name}-${startT}`,
            x1: startT,
            y1: sess.currentBox.high,
            x2: endT,
            y2: sess.currentBox.low,
            color: sess.color,
            bordercolor: sess.borderColor,
            label: `${sess.name} (Live)`
          });
        }
        if (showOpenLine) {
          output.lines.push({
            id: `sess-open-${sess.name}-${startT}`,
            x1: startT,
            y1: sess.currentBox.openPrice,
            x2: endT,
            y2: sess.currentBox.openPrice,
            color: sess.borderColor,
            width: 1,
            style: 'dashed'
          });
        }
      }
    });

    return output;
  }

  // ==========================================
  // 2. FOOTPRINT (Bid x Ask Order Flow + Market Direction)
  // ==========================================
  if (idLower.includes('footprint')) {
    const showDirections = params.show_directions ?? true;
    const imbalanceRatio = params.imbalance_ratio ?? 3.0; // 300% ratio
    const stackedThreshold = params.stacked_imbalance_threshold ?? 3; // 3+ levels
    const showPOC = params.show_poc ?? true;
    const showImbalances = params.show_imbalances ?? true;
    const clusterTicks = params.cluster_ticks ?? 4;

    const footprintCandles: FootprintCandle[] = [];
    const stepBase = Math.max(0.0001, (highPrices[highPrices.length - 1] * 0.00008 * clusterTicks));

    // Calculate baseline volume and average delta
    let totalCandleDelta = 0;
    candles.forEach(c => {
      totalCandleDelta += Math.abs(c.close - c.open) * (c.volume || 100);
    });
    const avgDeltaEst = Math.max(20, totalCandleDelta / Math.max(1, candles.length));

    // Rolling lookback for swing levels
    const lookback = 10;

    candles.forEach((c, idx) => {
      const high = c.high;
      const low = c.low;
      const range = Math.max(stepBase, high - low);
      const levelsCount = Math.min(22, Math.max(4, Math.round(range / stepBase)));
      const actualStep = range / levelsCount;

      let totalDelta = 0;
      let totalVol = 0;
      let maxVolAtPrice = -1;
      let pocPrice = (c.open + c.close) / 2;
      const clusters: FootprintCluster[] = [];

      for (let l = 0; l <= levelsCount; l++) {
        const priceLevel = low + (l * actualStep);
        const seed = (times[idx] % 100000) * 100 + l;
        const isBullishZone = priceLevel >= c.open && c.close >= c.open;
        const isExtremeWick = l === 0 || l === levelsCount;

        // Realistic order flow bid/ask numbers
        let baseVol = Math.floor(pseudoRandom(seed) * 75) + 5;
        if (isExtremeWick && pseudoRandom(seed + 5) > 0.45) {
          baseVol = Math.floor(pseudoRandom(seed) * 15);
        }

        let bid = Math.floor(baseVol * (isBullishZone ? 0.38 : 0.82) + pseudoRandom(seed + 1) * 28);
        let ask = Math.floor(baseVol * (isBullishZone ? 0.88 : 0.38) + pseudoRandom(seed + 2) * 28);

        if (isExtremeWick && pseudoRandom(seed + 3) > 0.6) {
          if (l === levelsCount) ask = 0;
          if (l === 0) bid = 0;
        }

        const rowVol = bid + ask;
        const rowDelta = ask - bid;

        totalVol += rowVol;
        totalDelta += rowDelta;

        if (rowVol > maxVolAtPrice) {
          maxVolAtPrice = rowVol;
          pocPrice = priceLevel;
        }

        clusters.push({ price: priceLevel, bid, ask });
      }

      // Check POC
      clusters.forEach(cl => {
        if (showPOC && Math.abs(cl.price - pocPrice) < actualStep * 0.55) {
          cl.isPOC = true;
        }
      });

      // Diagonal Imbalances (Ask at level l+1 vs. Bid at level l)
      let consecutiveBuyImb = 0;
      let maxConsecutiveBuyImb = 0;
      let consecutiveSellImb = 0;
      let maxConsecutiveSellImb = 0;

      for (let l = 0; l < clusters.length - 1; l++) {
        const lowerCluster = clusters[l];
        const upperCluster = clusters[l + 1];

        // Diagonal Buy Imbalance: Ask diagonally higher exceeds Bid lower
        const isBuyImbalance = (upperCluster.ask >= lowerCluster.bid * imbalanceRatio && upperCluster.ask >= 12) || (lowerCluster.bid === 0 && upperCluster.ask >= 8);
        if (isBuyImbalance) {
          upperCluster.isBuyImbalance = true;
          consecutiveBuyImb++;
          maxConsecutiveBuyImb = Math.max(maxConsecutiveBuyImb, consecutiveBuyImb);
        } else {
          consecutiveBuyImb = 0;
        }

        // Diagonal Sell Imbalance: Bid diagonally lower exceeds Ask higher
        const isSellImbalance = (lowerCluster.bid >= upperCluster.ask * imbalanceRatio && lowerCluster.bid >= 12) || (upperCluster.ask === 0 && lowerCluster.bid >= 8);
        if (isSellImbalance) {
          lowerCluster.isSellImbalance = true;
          consecutiveSellImb++;
          maxConsecutiveSellImb = Math.max(maxConsecutiveSellImb, consecutiveSellImb);
        } else {
          consecutiveSellImb = 0;
        }
      }

      // Flag stacked imbalances
      const hasStackedBuy = maxConsecutiveBuyImb >= stackedThreshold;
      const hasStackedSell = maxConsecutiveSellImb >= stackedThreshold;

      if (hasStackedBuy) {
        clusters.forEach(cl => { if (cl.isBuyImbalance) cl.isStackedBuyImbalance = true; });
      }
      if (hasStackedSell) {
        clusters.forEach(cl => { if (cl.isSellImbalance) cl.isStackedSellImbalance = true; });
      }

      // Support & Resistance tests
      let minLowInLookback = Infinity;
      let maxHighInLookback = -Infinity;
      const startLook = Math.max(0, idx - lookback);
      for (let k = startLook; k < idx; k++) {
        minLowInLookback = Math.min(minLowInLookback, lowPrices[k]);
        maxHighInLookback = Math.max(maxHighInLookback, highPrices[k]);
      }

      // 1. Positive Delta at Support: Pullback to support, holds it with strong positive delta surge
      const isAtSupport = idx >= 3 && c.low <= minLowInLookback * 1.001;
      const isPositiveDeltaAtSupport = isAtSupport && totalDelta > 0 && totalDelta >= avgDeltaEst * 0.9 && c.close >= (c.open + c.low) / 2;

      // 2. Negative Delta at Resistance: Reaches resistance ceiling, delta turns sharply negative
      const isAtResistance = idx >= 3 && c.high >= maxHighInLookback * 0.999;
      const isNegativeDeltaAtResistance = isAtResistance && totalDelta < 0 && Math.abs(totalDelta) >= avgDeltaEst * 0.9 && c.close <= (c.open + c.high) / 2;

      // 3. POC at Bottom of the Bar (Trapped Sellers): POC in bottom 28% of bar & close in top 40%
      const pocRelPos = range > 0 ? (pocPrice - low) / range : 0.5;
      const closeRelPos = range > 0 ? (c.close - low) / range : 0.5;
      const isPocAtBottomTrap = pocRelPos <= 0.28 && closeRelPos >= 0.60;

      // 4. POC at Top of the Bar (Trapped / Absorbed Buyers): POC in top 28% & close in bottom 40%
      const isPocAtTopAbsorption = pocRelPos >= 0.72 && closeRelPos <= 0.40;

      // Collect active Footprint Direction Signals
      const signals: FootprintDirectionSignal[] = [];

      if (showDirections) {
        // Bullish Direction Signals
        if (hasStackedBuy) {
          signals.push({
            type: 'BULLISH',
            code: 'STACKED_BUY_IMBALANCE',
            title: `Stacked Buying Imbalance (${maxConsecutiveBuyImb}x Levels)`,
            desc: 'Institutional buyers aggressively lifting the ask on 3+ consecutive diagonal levels.',
            detail: `${imbalanceRatio * 100}%+ Buy Imbalance Ratio`
          });
        }
        if (isPositiveDeltaAtSupport) {
          signals.push({
            type: 'BULLISH',
            code: 'DELTA_AT_SUPPORT',
            title: 'Positive Delta Surge at Support',
            desc: 'Price pulled back to key support and aggressive market buyers entered with positive delta.',
            detail: `+${totalDelta} Delta at Support Level`
          });
        }
        if (isPocAtBottomTrap) {
          signals.push({
            type: 'BULLISH',
            code: 'POC_BOTTOM_TRAP',
            title: 'POC at Bottom (Trapped Sellers)',
            desc: 'Highest volume concentrated at candle bottom, but buyers trapped sellers and pushed price to close at highs.',
            detail: `POC @ ${pocPrice.toFixed(2)}`
          });
        }

        // Bearish Direction Signals
        if (hasStackedSell) {
          signals.push({
            type: 'BEARISH',
            code: 'STACKED_SELL_IMBALANCE',
            title: `Stacked Selling Imbalance (${maxConsecutiveSellImb}x Levels)`,
            desc: 'Dominant aggressive selling on multiple diagonal rows driving price lower.',
            detail: `${imbalanceRatio * 100}%+ Sell Imbalance Ratio`
          });
        }
        if (isNegativeDeltaAtResistance) {
          signals.push({
            type: 'BEARISH',
            code: 'DELTA_AT_RESISTANCE',
            title: 'Negative Delta Defense at Resistance',
            desc: 'Price touched resistance ceiling and aggressive sellers entered to defend the level.',
            detail: `${totalDelta} Delta at Resistance Ceiling`
          });
        }
        if (isPocAtTopAbsorption) {
          signals.push({
            type: 'BEARISH',
            code: 'POC_TOP_ABSORPTION',
            title: 'POC at Top (Absorbed Buyers)',
            desc: 'Volume concentrated at very top, but buyers were heavily absorbed and overwhelmed by market sellers.',
            detail: `POC @ ${pocPrice.toFixed(2)}`
          });
        }
      }

      footprintCandles.push({
        time: times[idx],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        clusters: clusters.reverse(),
        pocPrice,
        delta: totalDelta,
        volume: totalVol,
        signals,
        hasStackedBuyImbalance: hasStackedBuy,
        hasStackedSellImbalance: hasStackedSell,
        isPositiveDeltaAtSupport,
        isNegativeDeltaAtResistance,
        isPocAtBottomTrap,
        isPocAtTopAbsorption
      });
    });

    output.footprints = footprintCandles;
    return output;
  }

  // ==========================================
  // 3. DELTA (Volume Delta, CVD & Directional Setups)
  // ==========================================
  if (idLower.includes('delta')) {
    const showDirectionSetups = params.show_direction_setups ?? true;
    const showCVD = params.show_cvd ?? true;
    const showDivergences = params.show_divergences ?? true;
    const showBreakouts = params.show_breakouts ?? true;
    const showDeltaFlips = params.show_delta_flips ?? true;
    const showExhaustion = params.show_exhaustion ?? true;
    const smoothLen = params.smooth_cvd ?? 14;

    const deltaPoints: DeltaPoint[] = [];
    const deltaSignals: DeltaDirectionSignal[] = [];
    const cvdLines: CVDLine[] = [];
    let runningCVD = 0;

    // First pass: compute delta and CVD
    candles.forEach((c, idx) => {
      const candleDelta = (c.close >= c.open ? 1 : -1) * Math.round(
        (c.volume || 100) * (0.25 + (Math.abs(c.close - c.open) / (c.high - c.low || 1)) * 0.55)
      );
      runningCVD += candleDelta;

      deltaPoints.push({
        time: times[idx],
        delta: candleDelta,
        cvd: runningCVD,
        volume: c.volume || 100
      });
    });

    // Calculate rolling metrics for setups
    const avgAbsDelta = deltaPoints.reduce((acc, p) => acc + Math.abs(p.delta), 0) / Math.max(1, deltaPoints.length);

    // Detect Setups & Divergences across the series
    if (showDirectionSetups) {
      // Find all Swing Highs and Swing Lows
      const swingPivots: { idx: number; type: 'HIGH' | 'LOW'; price: number; cvd: number; time: number }[] = [];
      const pLook = 3;
      for (let i = pLook; i < deltaPoints.length - pLook; i++) {
        let isHigh = true;
        let isLow = true;
        for (let k = 1; k <= pLook; k++) {
          if (candles[i].high <= candles[i - k].high || candles[i].high <= candles[i + k].high) isHigh = false;
          if (candles[i].low >= candles[i - k].low || candles[i].low >= candles[i + k].low) isLow = false;
        }
        if (isHigh) {
          swingPivots.push({ idx: i, type: 'HIGH', price: candles[i].high, cvd: deltaPoints[i].cvd, time: times[i] });
        }
        if (isLow) {
          swingPivots.push({ idx: i, type: 'LOW', price: candles[i].low, cvd: deltaPoints[i].cvd, time: times[i] });
        }
      }

      // Check Divergences between consecutive swing points of same type
      if (showDivergences) {
        const swingLows = swingPivots.filter(p => p.type === 'LOW');
        const swingHighs = swingPivots.filter(p => p.type === 'HIGH');

        // 1. Bullish Divergences (Swing Lows)
        for (let j = 1; j < swingLows.length; j++) {
          const prev = swingLows[j - 1];
          const curr = swingLows[j];
          const dist = curr.idx - prev.idx;
          if (dist < 4 || dist > 35) continue;

          // Regular Bullish: Price Lower Low, CVD Higher Low
          if (curr.price < prev.price && curr.cvd > prev.cvd + 10) {
            const lineId = `div-bull-${curr.idx}`;
            // Main Price Chart Yellow Trendline
            output.lines.push({
              id: lineId,
              x1: prev.time,
              y1: prev.price,
              x2: curr.time,
              y2: curr.price,
              color: '#eab308',
              width: 2.4,
              style: 'solid',
              label: 'Divergence'
            });

            // Subpanel CVD Yellow Trendline
            cvdLines.push({
              id: `cvd-div-${curr.idx}`,
              x1Time: prev.time,
              y1Cvd: prev.cvd,
              x2Time: curr.time,
              y2Cvd: curr.cvd,
              color: '#eab308',
              label: 'Divergence',
              type: 'REGULAR_BULLISH'
            });

            const sig: DeltaDirectionSignal = {
              time: curr.time,
              type: 'BULLISH',
              code: 'CVD_DIVERGENCE_ABSORPTION',
              title: 'Regular Bullish CVD Divergence',
              desc: 'Price made a Lower Low while CVD made a Higher Low. Sellers absorbed by aggressive buyers.',
              detail: `Price: ${curr.price.toFixed(2)} (LL) vs CVD: ${curr.cvd} (HL)`,
              barIndex: curr.idx,
              value: curr.cvd
            };
            deltaPoints[curr.idx].signal = sig;
            deltaSignals.push(sig);
          }
          // Hidden Bullish / Exhaustion Divergence: Green Trendline & Possible Long Signal
          else if (curr.price > prev.price && curr.cvd < prev.cvd - 10) {
            output.lines.push({
              id: `div-hbull-${curr.idx}`,
              x1: prev.time,
              y1: prev.price,
              x2: curr.time,
              y2: curr.price,
              color: '#22c55e',
              width: 2.2,
              style: 'solid',
              label: 'Divergence'
            });

            output.labels.push({
              id: `lbl-long-${curr.idx}`,
              x: curr.time,
              y: curr.price,
              text: 'Possible long incoming',
              color: '#22c55e',
              textcolor: '#22c55e',
              badge: false
            });

            cvdLines.push({
              id: `cvd-hbull-${curr.idx}`,
              x1Time: prev.time,
              y1Cvd: prev.cvd,
              x2Time: curr.time,
              y2Cvd: curr.cvd,
              color: '#22c55e',
              label: 'Divergence',
              type: 'HIDDEN_BULLISH'
            });
          }
        }

        // 2. Bearish Divergences (Swing Highs)
        for (let j = 1; j < swingHighs.length; j++) {
          const prev = swingHighs[j - 1];
          const curr = swingHighs[j];
          const dist = curr.idx - prev.idx;
          if (dist < 3 || dist > 40) continue;

          // Regular Bearish: Price Higher High, CVD Lower High
          if (curr.price > prev.price && curr.cvd < prev.cvd - 10) {
            const lineId = `div-bear-${curr.idx}`;
            // Main Price Chart Yellow Trendline
            output.lines.push({
              id: lineId,
              x1: prev.time,
              y1: prev.price,
              x2: curr.time,
              y2: curr.price,
              color: '#eab308',
              width: 2.4,
              style: 'solid',
              label: 'Divergence'
            });

            // Subpanel CVD Yellow Trendline
            cvdLines.push({
              id: `cvd-div-${curr.idx}`,
              x1Time: prev.time,
              y1Cvd: prev.cvd,
              x2Time: curr.time,
              y2Cvd: curr.cvd,
              color: '#eab308',
              label: 'Divergence',
              type: 'REGULAR_BEARISH'
            });

            // Check for large sell candle right after high and mark cyan annotation
            for (let cIdx = curr.idx + 1; cIdx < Math.min(candles.length, curr.idx + 8); cIdx++) {
              const candle = candles[cIdx];
              const candleBody = candle.open - candle.close;
              if (candleBody > (candles[curr.idx].high - candles[curr.idx].low) * 0.7) {
                output.labels.push({
                  id: `lbl-dump-${cIdx}`,
                  x: times[cIdx],
                  y: candle.high,
                  text: '⚡ Sell Imbalance',
                  color: '#06b6d4',
                  textcolor: '#06b6d4',
                  badge: false
                });
                break;
              }
            }

            const sig: DeltaDirectionSignal = {
              time: curr.time,
              type: 'BEARISH',
              code: 'CVD_DIVERGENCE_ABSORPTION',
              title: 'Regular Bearish CVD Divergence',
              desc: 'Price made a Higher High while CVD formed a Lower High. Buyers exhausted into passive sell orders.',
              detail: `Price: ${curr.price.toFixed(2)} (HH) vs CVD: ${curr.cvd} (LH)`,
              barIndex: curr.idx,
              value: curr.cvd
            };
            deltaPoints[curr.idx].signal = sig;
            deltaSignals.push(sig);
          }
          // Descending Swing Highs with CVD divergence (Green Trendline & Possible long incoming)
          else if (curr.price < prev.price && curr.cvd > prev.cvd + 5) {
            output.lines.push({
              id: `div-hbear-${curr.idx}`,
              x1: prev.time,
              y1: prev.price,
              x2: curr.time,
              y2: curr.price,
              color: '#22c55e',
              width: 2.2,
              style: 'solid',
              label: 'Divergence'
            });

            output.labels.push({
              id: `lbl-long-h-${curr.idx}`,
              x: curr.time,
              y: curr.price,
              text: 'Possible long incoming',
              color: '#22c55e',
              textcolor: '#22c55e',
              badge: false
            });

            cvdLines.push({
              id: `cvd-hbear-${curr.idx}`,
              x1Time: prev.time,
              y1Cvd: prev.cvd,
              x2Time: curr.time,
              y2Cvd: curr.cvd,
              color: '#22c55e',
              label: 'Divergence',
              type: 'HIDDEN_BEARISH'
            });
          }
        }
      }

      // Delta Flips & Breakouts
      for (let i = 5; i < deltaPoints.length; i++) {
        const curC = candles[i];
        const curDP = deltaPoints[i];
        const prevC = candles[i - 1];
        const prevDP = deltaPoints[i - 1];

        // CVD Breakout
        if (showBreakouts && i >= 12 && !curDP.signal) {
          let minPriceRange = Infinity;
          let maxPriceRange = -Infinity;
          let maxPriorCVD = -Infinity;
          for (let k = i - 10; k < i; k++) {
            minPriceRange = Math.min(minPriceRange, candles[k].low);
            maxPriceRange = Math.max(maxPriceRange, candles[k].high);
            maxPriorCVD = Math.max(maxPriorCVD, deltaPoints[k].cvd);
          }
          const priceVariance = (maxPriceRange - minPriceRange) / (candles[i].close || 1);
          if (priceVariance < 0.003 && curDP.cvd > maxPriorCVD + 10 && curDP.delta > avgAbsDelta * 0.7) {
            const sig: DeltaDirectionSignal = {
              time: times[i],
              type: 'BULLISH',
              code: 'CVD_BREAKOUT',
              title: 'CVD Breakout (Aggressive Buying)',
              desc: 'Price in tight range, but CVD broke out to a new high.',
              detail: `CVD New High: +${curDP.cvd}`,
              barIndex: i,
              value: curDP.cvd
            };
            curDP.signal = sig;
            deltaSignals.push(sig);
          }
        }

        // Delta Flip at Support
        if (showDeltaFlips && i >= 3 && !curDP.signal) {
          const wasNegativeMomentum = prevDP.delta < -avgAbsDelta * 0.75;
          const isFlippingPositive = curDP.delta > avgAbsDelta * 0.65;
          const heldSupport = curC.low >= prevC.low * 0.9998;
          if (wasNegativeMomentum && isFlippingPositive && heldSupport) {
            const sig: DeltaDirectionSignal = {
              time: times[i],
              type: 'BULLISH',
              code: 'DELTA_FLIP_SUPPORT',
              title: 'Delta Flip at Support',
              desc: 'Delta flipped from negative to sharp positive holding support.',
              detail: `Delta Flip: ${prevDP.delta} -> +${curDP.delta}`,
              barIndex: i,
              value: curDP.cvd
            };
            curDP.signal = sig;
            deltaSignals.push(sig);
          }
        }
      }
    }

    output.deltaData = deltaPoints;
    output.deltaSignals = deltaSignals;
    output.cvdLines = cvdLines;
    
    // Add CVD line plot (White curve)
    if (showCVD) {
      const cvdPlot: IndicatorSeries[] = deltaPoints.map(dp => ({
        time: dp.time,
        value: dp.cvd,
        color: '#ffffff',
        label: 'Cumulative Volume Delta'
      }));
      output.plots.push(cvdPlot);
    }

    return output;
  }

  // ==========================================
  // 4. DEMAND & SUPPLY ZONES (Order Blocks)
  // ==========================================
  if (idLower.includes('supply') || idLower.includes('demand')) {
    // Adapt swing lookback and impulse parameters to timeframe
    const isHigherTF = timeframe === '4h' || timeframe === '1d' || timeframe === '1w';
    const isLowerTF = timeframe === '1m' || timeframe === '5m';
    const defaultLookback = isHigherTF ? 4 : (isLowerTF ? 6 : 5);
    const lookback = Math.max(2, Math.min(20, params.lookback ?? defaultLookback));
    const impulseStrength = Math.max(1.0, Math.min(3.0, params.impulse_strength ?? 1.35));
    const maxZones = Math.max(2, Math.min(30, params.max_zones ?? 8));
    const showLabels = params.show_labels ?? true;
    const showUnmitigatedOnly = params.show_unmitigated_only ?? false;
    const baseSupplyColor = params.supply_color || '#ef5350';
    const baseDemandColor = params.demand_color || '#26a69a';

    // Helper to convert hex to rgba with opacity
    const toRgba = (color: string, alpha: number) => {
      if (!color || color === 'transparent' || color === 'none') return 'transparent';
      if (color.startsWith('#')) {
        const c = color.substring(1);
        const num = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return color;
    };

    interface ZoneCandidate {
      type: 'SUPPLY' | 'DEMAND';
      baseIdx: number;
      impulseIdx: number;
      top: number;
      bottom: number;
      endIdx: number;
      isMitigated: boolean;
      score: number;
      labelDesc: string;
    }

    const zones: ZoneCandidate[] = [];

    // Calculate baseline average candle body size and total range
    let totalBody = 0;
    let totalRange = 0;
    for (let k = 0; k < candles.length; k++) {
      totalBody += Math.abs(closePrices[k] - openPrices[k]);
      totalRange += highPrices[k] - lowPrices[k];
    }
    const avgBody = Math.max(1e-6, totalBody / Math.max(1, candles.length));
    const avgRange = Math.max(1e-6, totalRange / Math.max(1, candles.length));
    const maxZoneHeight = avgBody * 1.5;

    // 1. Detect Impulsive Displacement Moves and place Order Block zones on the origin base candle BEFORE the impulse
    for (let i = 2; i < candles.length; i++) {
      const body = Math.abs(closePrices[i] - openPrices[i]);
      const range = highPrices[i] - lowPrices[i];
      const isBullishCandle = closePrices[i] > openPrices[i];
      const isBearishCandle = closePrices[i] < openPrices[i];
      const isImpulsive = body >= avgBody * impulseStrength && range >= avgRange * 1.05;

      // --- BULLISH IMPULSE -> Demand Order Block (Base before the upward expansion) ---
      if (isBullishCandle && isImpulsive && closePrices[i] > highPrices[i - 1]) {
        // Base candle is the last BEARISH (down) candle before the upward expansion
        let baseIdx = i - 1;
        let foundBearish = false;
        for (let b = i - 1; b >= Math.max(0, i - 6); b--) {
          if (closePrices[b] <= openPrices[b]) {
            baseIdx = b;
            foundBearish = true;
            break;
          }
        }
        if (!foundBearish) {
          // If all preceding bars were green, take the lowest trough candle
          let lowestL = lowPrices[i - 1];
          baseIdx = i - 1;
          for (let b = Math.max(0, i - 6); b <= i - 1; b++) {
            if (lowPrices[b] <= lowestL) {
              lowestL = lowPrices[b];
              baseIdx = b;
            }
          }
        }

        const zoneBottom = lowPrices[baseIdx];
        let zoneTop = Math.max(openPrices[baseIdx], closePrices[baseIdx]);
        
        // Ensure healthy, tight order block boundaries
        if (zoneTop - zoneBottom > maxZoneHeight) {
          zoneTop = zoneBottom + maxZoneHeight;
        } else if (zoneTop - zoneBottom < avgBody * 0.3) {
          zoneTop = zoneBottom + avgBody * 0.6;
        }

        if (zoneTop > zoneBottom) {
          let endIdx = candles.length - 1;
          let isMitigated = false;

          // Check if future price breaks through the demand zone
          for (let j = i + 1; j < candles.length; j++) {
            if (lowPrices[j] <= zoneBottom) {
              endIdx = j;
              isMitigated = true;
              break;
            }
          }

          // Avoid duplicate zones within 2 bars
          if (!zones.some(z => z.type === 'DEMAND' && Math.abs(z.baseIdx - baseIdx) <= 2)) {
            zones.push({
              type: 'DEMAND',
              baseIdx,
              impulseIdx: i,
              top: zoneTop,
              bottom: zoneBottom,
              endIdx,
              isMitigated,
              score: (isMitigated ? 300 : 3500) + baseIdx,
              labelDesc: isMitigated ? 'Demand (Mitigated)' : 'Demand Order Block (Fresh)'
            });
          }
        }
      }

      // --- BEARISH IMPULSE -> Supply Order Block (Base before the downward expansion) ---
      if (isBearishCandle && isImpulsive && closePrices[i] < lowPrices[i - 1]) {
        // Base candle is the last BULLISH (up) candle before the downward expansion
        let baseIdx = i - 1;
        let foundBullish = false;
        for (let b = i - 1; b >= Math.max(0, i - 6); b--) {
          if (closePrices[b] >= openPrices[b]) {
            baseIdx = b;
            foundBullish = true;
            break;
          }
        }
        if (!foundBullish) {
          // If all preceding bars were red, take the highest peak candle before the drop
          let highestH = highPrices[i - 1];
          baseIdx = i - 1;
          for (let b = Math.max(0, i - 6); b <= i - 1; b++) {
            if (highPrices[b] >= highestH) {
              highestH = highPrices[b];
              baseIdx = b;
            }
          }
        }

        const zoneTop = highPrices[baseIdx];
        let zoneBottom = Math.min(openPrices[baseIdx], closePrices[baseIdx]);

        // Ensure healthy, tight order block boundaries
        if (zoneTop - zoneBottom > maxZoneHeight) {
          zoneBottom = zoneTop - maxZoneHeight;
        } else if (zoneTop - zoneBottom < avgBody * 0.3) {
          zoneBottom = zoneTop - avgBody * 0.6;
        }

        if (zoneTop > zoneBottom) {
          let endIdx = candles.length - 1;
          let isMitigated = false;

          // Check if future price breaks through the supply zone
          for (let j = i + 1; j < candles.length; j++) {
            if (highPrices[j] >= zoneTop) {
              endIdx = j;
              isMitigated = true;
              break;
            }
          }

          // Avoid duplicate zones within 2 bars
          if (!zones.some(z => z.type === 'SUPPLY' && Math.abs(z.baseIdx - baseIdx) <= 2)) {
            zones.push({
              type: 'SUPPLY',
              baseIdx,
              impulseIdx: i,
              top: zoneTop,
              bottom: zoneBottom,
              endIdx,
              isMitigated,
              score: (isMitigated ? 300 : 3500) + baseIdx,
              labelDesc: isMitigated ? 'Supply (Mitigated)' : 'Supply Order Block (Fresh)'
            });
          }
        }
      }
    }

    // 2. Also scan major swing pivot points for structural supply/demand rejection zones
    for (let i = lookback; i < candles.length - lookback; i++) {
      let isSwingHigh = true;
      let isSwingLow = true;

      for (let k = 1; k <= lookback; k++) {
        if (highPrices[i] <= highPrices[i - k] || highPrices[i] <= highPrices[i + k]) isSwingHigh = false;
        if (lowPrices[i] >= lowPrices[i - k] || lowPrices[i] >= lowPrices[i + k]) isSwingLow = false;
      }

      if (isSwingHigh) {
        const zoneTop = highPrices[i];
        let zoneBottom = Math.max(openPrices[i], closePrices[i]);
        if (zoneTop - zoneBottom > maxZoneHeight) {
          zoneBottom = zoneTop - maxZoneHeight;
        } else if (zoneTop - zoneBottom < avgBody * 0.3) {
          zoneBottom = zoneTop - avgBody * 0.5;
        }

        if (zoneTop > zoneBottom) {
          let endIdx = candles.length - 1;
          let isMitigated = false;

          for (let j = i + 1; j < candles.length; j++) {
            if (highPrices[j] >= zoneTop) {
              endIdx = j;
              isMitigated = true;
              break;
            }
          }

          // Avoid duplicate overlapping zones
          if (!zones.some(z => z.type === 'SUPPLY' && Math.abs(z.baseIdx - i) <= 2)) {
            zones.push({
              type: 'SUPPLY',
              baseIdx: i,
              impulseIdx: i + 1,
              top: zoneTop,
              bottom: zoneBottom,
              endIdx,
              isMitigated,
              score: (isMitigated ? 150 : 2200) + i,
              labelDesc: isMitigated ? 'Supply (Mitigated)' : 'Supply Zone (Fresh)'
            });
          }
        }
      }

      if (isSwingLow) {
        const zoneBottom = lowPrices[i];
        let zoneTop = Math.min(openPrices[i], closePrices[i]);
        if (zoneTop - zoneBottom > maxZoneHeight) {
          zoneTop = zoneBottom + maxZoneHeight;
        } else if (zoneTop - zoneBottom < avgBody * 0.3) {
          zoneTop = zoneBottom + avgBody * 0.5;
        }

        if (zoneTop > zoneBottom) {
          let endIdx = candles.length - 1;
          let isMitigated = false;

          for (let j = i + 1; j < candles.length; j++) {
            if (lowPrices[j] <= zoneBottom) {
              endIdx = j;
              isMitigated = true;
              break;
            }
          }

          // Avoid duplicate overlapping zones
          if (!zones.some(z => z.type === 'DEMAND' && Math.abs(z.baseIdx - i) <= 2)) {
            zones.push({
              type: 'DEMAND',
              baseIdx: i,
              impulseIdx: i + 1,
              top: zoneTop,
              bottom: zoneBottom,
              endIdx,
              isMitigated,
              score: (isMitigated ? 150 : 2200) + i,
              labelDesc: isMitigated ? 'Demand (Mitigated)' : 'Demand Zone (Fresh)'
            });
          }
        }
      }
    }

    // Filter unmitigated if requested, then take top scoring zones
    let filteredZones = showUnmitigatedOnly ? zones.filter(z => !z.isMitigated) : zones;
    filteredZones.sort((a, b) => b.score - a.score);
    const activeZones = filteredZones.slice(0, maxZones);
    activeZones.sort((a, b) => a.baseIdx - b.baseIdx);

    activeZones.forEach((z, zIdx) => {
      const isSupply = z.type === 'SUPPLY';
      const baseCol = isSupply ? baseSupplyColor : baseDemandColor;
      if (baseCol === 'transparent' || baseCol === 'none') return;

      const fillAlpha = z.isMitigated ? 0.08 : 0.20;
      const borderAlpha = z.isMitigated ? 0.40 : 0.85;

      const color = toRgba(baseCol, fillAlpha);
      const bordercolor = toRgba(baseCol, borderAlpha);

      output.boxes.push({
        id: `zone-${z.type.toLowerCase()}-${z.baseIdx}-${zIdx}`,
        x1: times[z.baseIdx],
        y1: z.top,
        x2: times[z.endIdx],
        y2: z.bottom,
        color,
        bordercolor,
        borderstyle: z.isMitigated ? 'dashed' : 'solid',
        label: showLabels ? z.labelDesc : undefined
      });
    });

    return output;
  }

  // ==========================================
  // 5. FAIR VALUE GAP (FVG / Imbalances)
  // ==========================================
  if (idLower.includes('fair value') || idLower.includes('fvg')) {
    const showCELine = params.show_ce_line ?? true;
    const showLabels = params.show_labels ?? true;
    const extendUnmitigated = params.extend_unmitigated ?? true;

    // Calculate dynamic adaptive minimum gap based on average candle body/range
    let totalRange = 0;
    for (let k = 0; k < candles.length; k++) {
      totalRange += Math.abs(highPrices[k] - lowPrices[k]);
    }
    const avgRange = totalRange / Math.max(1, candles.length);
    const minGap = Math.max(1e-7, (avgRange * 0.04));

    interface FVGCandidate {
      type: 'BULL' | 'BEAR';
      idx: number;
      top: number;
      bottom: number;
      ce: number;
      endIdx: number;
      mitigated: boolean;
      score: number;
    }

    const fvgs: FVGCandidate[] = [];

    for (let i = 2; i < candles.length; i++) {
      const c1High = highPrices[i - 2];
      const c1Low = lowPrices[i - 2];
      const c3High = highPrices[i];
      const c3Low = lowPrices[i];

      // Bullish FVG: Gap between candle 1 high and candle 3 low
      if (c3Low - c1High >= minGap) {
        let endIdx = candles.length - 1;
        let mitigated = false;
        if (extendUnmitigated) {
          for (let j = i + 1; j < candles.length; j++) {
            if (lowPrices[j] <= c1High) {
              endIdx = j;
              mitigated = true;
              break;
            }
          }
        } else {
          endIdx = Math.min(candles.length - 1, i + 3);
        }

        fvgs.push({
          type: 'BULL',
          idx: i,
          top: c3Low,
          bottom: c1High,
          ce: (c3Low + c1High) / 2,
          endIdx,
          mitigated,
          score: (mitigated ? 0 : 2000) + i
        });
      }

      // Bearish FVG: Gap between candle 1 low and candle 3 high
      if (c1Low - c3High >= minGap) {
        let endIdx = candles.length - 1;
        let mitigated = false;
        if (extendUnmitigated) {
          for (let j = i + 1; j < candles.length; j++) {
            if (highPrices[j] >= c1Low) {
              endIdx = j;
              mitigated = true;
              break;
            }
          }
        } else {
          endIdx = Math.min(candles.length - 1, i + 3);
        }

        fvgs.push({
          type: 'BEAR',
          idx: i,
          top: c1Low,
          bottom: c3High,
          ce: (c1Low + c3High) / 2,
          endIdx,
          mitigated,
          score: (mitigated ? 0 : 2000) + i
        });
      }
    }

    // Keep up to 20 most recent / active FVGs
    fvgs.sort((a, b) => b.score - a.score);
    const activeFVGs = fvgs.slice(0, 20);
    activeFVGs.sort((a, b) => a.idx - b.idx);

    activeFVGs.forEach((f, fIdx) => {
      const isBull = f.type === 'BULL';
      const color = isBull
        ? (f.mitigated ? 'rgba(38, 166, 154, 0.10)' : 'rgba(38, 166, 154, 0.22)')
        : (f.mitigated ? 'rgba(239, 83, 80, 0.10)' : 'rgba(239, 83, 80, 0.22)');
      const bordercolor = isBull
        ? (f.mitigated ? 'rgba(38, 166, 154, 0.4)' : 'rgba(38, 166, 154, 0.85)')
        : (f.mitigated ? 'rgba(239, 83, 80, 0.4)' : 'rgba(239, 83, 80, 0.85)');

      output.boxes.push({
        id: `fvg-${f.type.toLowerCase()}-${f.idx}-${fIdx}`,
        x1: times[f.idx - 1],
        y1: f.top,
        x2: times[f.endIdx],
        y2: f.bottom,
        color,
        bordercolor,
        borderstyle: f.mitigated ? 'dashed' : 'solid',
        label: showLabels ? (isBull ? (f.mitigated ? 'Bull FVG (Mitigated)' : 'Bullish FVG') : (f.mitigated ? 'Bear FVG (Mitigated)' : 'Bearish FVG')) : undefined
      });

      // 50% Consequent Encroachment (C.E.) Line
      if (showCELine) {
        output.lines.push({
          id: `fvg-ce-${f.idx}-${fIdx}`,
          x1: times[f.idx - 1],
          y1: f.ce,
          x2: times[f.endIdx],
          y2: f.ce,
          color: isBull ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)',
          width: 1,
          style: 'dotted',
          label: '50% C.E.'
        });
      }
    });

    return output;
  }

  // ==========================================
  // 6. CHoCH & BOS (Market Structure)
  // ==========================================
  if (idLower.includes('choch') || idLower.includes('bos') || idLower.includes('market structure')) {
    const pivotLen = params.swing_length ?? 4;
    const showBOS = params.show_bos ?? true;
    const showCHoCH = params.show_choch ?? true;
    const showLabels = params.show_labels ?? true;
    const showPivots = params.show_swing_points ?? true;

    // Configurable Colors with Transparency Support
    const chochBullColor = params.choch_bull_color || '#26a69a';
    const chochBearColor = params.choch_bear_color || '#ef5350';
    const bosBullColor = params.bos_bull_color || '#00b4d8';
    const bosBearColor = params.bos_bear_color || '#ff9800';
    const pivotHighColor = params.pivot_high_color || '#00b4d8';
    const pivotLowColor = params.pivot_low_color || '#ff9800';
    const bgColor = params.bg_color || 'transparent';

    const isTransparent = (col?: string) => !col || col === 'transparent' || col === 'none' || col === 'rgba(0,0,0,0)';

    interface Pivot { idx: number; price: number; type: 'H' | 'L' }
    const pivots: Pivot[] = [];

    for (let i = pivotLen; i < candles.length - pivotLen; i++) {
      let isH = true;
      let isL = true;
      for (let k = 1; k <= pivotLen; k++) {
        if (highPrices[i] <= highPrices[i - k] || highPrices[i] <= highPrices[i + k]) isH = false;
        if (lowPrices[i] >= lowPrices[i - k] || lowPrices[i] >= lowPrices[i + k]) isL = false;
      }
      if (isH) pivots.push({ idx: i, price: highPrices[i], type: 'H' });
      if (isL) pivots.push({ idx: i, price: lowPrices[i], type: 'L' });
    }

    let lastHigh: Pivot | null = null;
    let lastLow: Pivot | null = null;
    let currentTrend: 'UP' | 'DOWN' | null = null;

    pivots.forEach(p => {
      if (showPivots) {
        const pColor = p.type === 'H' ? pivotHighColor : pivotLowColor;
        const isPTrans = isTransparent(pColor);
        output.labels.push({
          id: `pivot-${p.idx}`,
          x: times[p.idx],
          y: p.price,
          text: p.type === 'H' ? 'SH' : 'SL',
          color: isPTrans ? 'transparent' : pColor,
          textcolor: isPTrans ? (p.type === 'H' ? '#00b4d8' : '#ff9800') : '#ffffff',
          badge: !isPTrans
        });
      }

      if (p.type === 'H') {
        if (lastHigh && p.price > lastHigh.price) {
          const isChoch = currentTrend === 'DOWN';
          const targetColor = isChoch ? chochBullColor : bosBullColor;
          const isColorTrans = isTransparent(targetColor);
          const fallbackTextCol = isChoch ? '#26a69a' : '#00b4d8';

          if ((isChoch && showCHoCH) || (!isChoch && showBOS)) {
            if (!isColorTrans) {
              output.lines.push({
                id: `bos-h-${p.idx}`,
                x1: times[lastHigh.idx],
                y1: lastHigh.price,
                x2: times[p.idx],
                y2: lastHigh.price,
                color: targetColor,
                width: isChoch ? 2 : 1.5,
                style: isChoch ? 'solid' : 'dashed'
              });
            }

            if (showLabels) {
              output.labels.push({
                id: `lbl-${p.idx}`,
                x: times[p.idx],
                y: lastHigh.price,
                text: isChoch ? 'CHoCH (Bullish)' : 'BOS (Bullish)',
                color: isColorTrans ? 'transparent' : targetColor,
                textcolor: isColorTrans ? fallbackTextCol : '#ffffff',
                badge: !isColorTrans
              });
            }

            // Background highlight cloud if configured
            if (!isTransparent(bgColor) && lastLow) {
              output.boxes.push({
                id: `struct-bg-${p.idx}`,
                x1: times[lastHigh.idx],
                y1: lastHigh.price,
                x2: times[p.idx],
                y2: lastLow.price,
                color: bgColor,
                bordercolor: 'transparent'
              });
            }
          }
          currentTrend = 'UP';
        }
        lastHigh = p;
      } else {
        if (lastLow && p.price < lastLow.price) {
          const isChoch = currentTrend === 'UP';
          const targetColor = isChoch ? chochBearColor : bosBearColor;
          const isColorTrans = isTransparent(targetColor);
          const fallbackTextCol = isChoch ? '#ef5350' : '#ff9800';

          if ((isChoch && showCHoCH) || (!isChoch && showBOS)) {
            if (!isColorTrans) {
              output.lines.push({
                id: `bos-l-${p.idx}`,
                x1: times[lastLow.idx],
                y1: lastLow.price,
                x2: times[p.idx],
                y2: lastLow.price,
                color: targetColor,
                width: isChoch ? 2 : 1.5,
                style: isChoch ? 'solid' : 'dashed'
              });
            }

            if (showLabels) {
              output.labels.push({
                id: `lbl-${p.idx}`,
                x: times[p.idx],
                y: lastLow.price,
                text: isChoch ? 'CHoCH (Bearish)' : 'BOS (Bearish)',
                color: isColorTrans ? 'transparent' : targetColor,
                textcolor: isColorTrans ? fallbackTextCol : '#ffffff',
                badge: !isColorTrans
              });
            }

            // Background highlight cloud if configured
            if (!isTransparent(bgColor) && lastHigh) {
              output.boxes.push({
                id: `struct-bg-${p.idx}`,
                x1: times[lastLow.idx],
                y1: lastHigh.price,
                x2: times[p.idx],
                y2: lastLow.price,
                color: bgColor,
                bordercolor: 'transparent'
              });
            }
          }
          currentTrend = 'DOWN';
        }
        lastLow = p;
      }
    });

    return output;
  }

  // ==========================================
  // 7. BOLLINGER BANDS
  // ==========================================
  if (idLower.includes('bollinger') || idLower.includes('bb')) {
    const len = params.length ?? 20;
    const mult = params.mult ?? 2.0;
    const src = params.source ?? 'close';
    const sourceSeries = getPriceSeries(candles, src);
    const basisType = params.basis_type ?? 'SMA';
    const fillBg = params.fill_background ?? true;

    const basis = basisType === 'EMA' ? TA.ema(sourceSeries, len) : TA.sma(sourceSeries, len);
    const dev = TA.stdev(sourceSeries, len);

    const upperSeries: IndicatorSeries[] = [];
    const basisSeries: IndicatorSeries[] = [];
    const lowerSeries: IndicatorSeries[] = [];

    for (let i = 0; i < candles.length; i++) {
      const b = basis[i];
      const d = dev[i];
      if (b !== null && d !== null) {
        const u = b + d * mult;
        const l = b - d * mult;
        upperSeries.push({ time: times[i], value: u, color: params.upper_color || '#00b4d8', label: 'Upper Band' });
        basisSeries.push({ time: times[i], value: b, color: params.basis_color || '#ff9800', label: `Basis (${len})` });
        lowerSeries.push({ time: times[i], value: l, color: params.lower_color || '#00b4d8', label: 'Lower Band' });
      }
    }

    output.plots.push(basisSeries, upperSeries, lowerSeries);
    if (fillBg) {
      output.bands.push({ upperIndex: 1, lowerIndex: 2, color: 'rgba(0, 180, 216, 0.08)' });
    }
    return output;
  }

  // ==========================================
  // 8. RELATIVE STRENGTH INDEX (RSI)
  // ==========================================
  if (idLower.includes('rsi')) {
    const len = params.length ?? 14;
    const src = params.source ?? 'close';
    const sourceSeries = getPriceSeries(candles, src);
    const rsiValues = TA.rsi(sourceSeries, len);

    const rsiSeries: IndicatorSeries[] = [];
    for (let i = 0; i < candles.length; i++) {
      const v = rsiValues[i];
      if (v !== null) {
        rsiSeries.push({ time: times[i], value: v, color: params.plot_color || '#ab47bc', label: `RSI (${len})` });
      }
    }
    output.plots.push(rsiSeries);
    return output;
  }

  // ==========================================
  // 9. INSTITUTIONAL QUANT STRATEGY (HMA + ATR)
  // ==========================================
  if (idLower.includes('institutional_quant') || (idLower.includes('quant') && idLower.includes('hma'))) {
    const hmaLen = Math.max(5, Math.min(100, Math.round(params.hma_len ?? 20)));
    const filterLen = Math.max(10, Math.min(200, Math.round(params.filter_len ?? 50)));
    const atrLen = Math.max(2, Math.min(50, Math.round(params.atr_len ?? 14)));
    const slMult = params.sl_mult ?? 1.5;
    const tp1Mult = params.tp1_mult ?? 1.5;
    const tp2Mult = params.tp2_mult ?? 3.0;
    const showTargets = params.show_targets ?? true;
    const showRRBoxes = params.show_rr_boxes ?? true;
    const showLabels = params.show_labels ?? true;
    const filterTrend = params.filter_trend ?? true;
    const minSpacing = Math.max(2, Math.min(30, Math.round(params.min_signal_spacing ?? 6)));

    const hmaValues = TA.hma(closePrices, hmaLen);
    const emaFilter = TA.ema(closePrices, filterLen);
    const atrValues = TA.atr(highPrices, lowPrices, closePrices, atrLen);

    // 1. Generate HMA Baseline Plot Series with dynamic trend coloration
    const hmaSeries: IndicatorSeries[] = [];
    const emaSeries: IndicatorSeries[] = [];

    for (let i = 0; i < candles.length; i++) {
      const hVal = hmaValues[i];
      if (hVal !== null && !isNaN(hVal)) {
        const isBull = closePrices[i] >= hVal;
        hmaSeries.push({
          time: times[i],
          value: hVal,
          color: isBull ? '#10b981' : '#ef4444',
          label: `HMA Baseline (${hmaLen})`
        });
      }

      const eVal = emaFilter[i];
      if (eVal !== null && !isNaN(eVal)) {
        emaSeries.push({
          time: times[i],
          value: eVal,
          color: 'rgba(59, 130, 246, 0.4)',
          label: `Macro Trend Filter (${filterLen})`
        });
      }
    }

    output.plots.push(hmaSeries);
    if (filterTrend) {
      output.plots.push(emaSeries);
    }

    // 2. High-Precision Algorithmic Signal Engine & Trade Brackets
    let lastSignalIdx = -100;
    let lastSignalType: 'BUY' | 'SELL' | null = null;
    const startIdx = Math.max(hmaLen + 2, filterLen, atrLen + 2);

    for (let i = startIdx; i < candles.length; i++) {
      const currClose = closePrices[i];
      const prevClose = closePrices[i - 1];
      const currHma = hmaValues[i];
      const prevHma = hmaValues[i - 1];
      const prev2Hma = hmaValues[i - 2];
      const currAtr = atrValues[i];
      const currEma = emaFilter[i];

      if (currHma === null || prevHma === null || currAtr === null || currAtr <= 0) continue;

      const hmaSlope = currHma - prevHma;
      const prevHmaSlope = prev2Hma !== null ? (prevHma - prev2Hma) : 0;
      
      const isMacroBull = currEma !== null ? (currClose >= currEma * 0.998) : true;
      const isMacroBear = currEma !== null ? (currClose <= currEma * 1.002) : true;

      // Bullish Trigger: Cross above HMA or Slope Pivot with Trend Alignment
      const isBullCross = (prevClose <= prevHma && currClose > currHma);
      const isBullRetest = (prevClose > prevHma && currClose > currHma && candles[i - 1].low <= prevHma * 1.001 && currClose > openPrices[i]);
      const isBullSlopeTurn = (hmaSlope > 0 && prevHmaSlope <= 0 && currClose > currHma);

      const buyCondition = (isBullCross || isBullRetest || isBullSlopeTurn) &&
        (!filterTrend || isMacroBull) &&
        (i - lastSignalIdx >= minSpacing) &&
        (lastSignalType !== 'BUY' || (i - lastSignalIdx >= minSpacing * 2));

      // Bearish Trigger: Cross below HMA or Slope Pivot with Trend Alignment
      const isBearCross = (prevClose >= prevHma && currClose < currHma);
      const isBearRetest = (prevClose < prevHma && currClose < currHma && candles[i - 1].high >= prevHma * 0.999 && currClose < openPrices[i]);
      const isBearSlopeTurn = (hmaSlope < 0 && prevHmaSlope >= 0 && currClose < currHma);

      const sellCondition = (isBearCross || isBearRetest || isBearSlopeTurn) &&
        (!filterTrend || isMacroBear) &&
        (i - lastSignalIdx >= minSpacing) &&
        (lastSignalType !== 'SELL' || (i - lastSignalIdx >= minSpacing * 2));

      if (buyCondition) {
        lastSignalIdx = i;
        lastSignalType = 'BUY';
        const entryPrice = currClose;
        const slPrice = entryPrice - currAtr * slMult;
        const tp1Price = entryPrice + currAtr * tp1Mult;
        const tp2Price = entryPrice + currAtr * tp2Mult;

        // Primary Buy Signal Marker
        output.signals.push({
          time: times[i],
          type: 'BUY',
          price: candles[i].low,
          comment: 'QUANT BUY'
        });

        // Forward trade simulation for outcome and bracket lines
        const maxForward = Math.min(candles.length - 1, i + 24);
        let endIdx = maxForward;
        let tp1HitIdx: number | null = null;
        let tp2HitIdx: number | null = null;
        let slHitIdx: number | null = null;

        for (let k = i + 1; k <= maxForward; k++) {
          if (highPrices[k] >= tp1Price && tp1HitIdx === null) tp1HitIdx = k;
          if (highPrices[k] >= tp2Price && tp2HitIdx === null) {
            tp2HitIdx = k;
            endIdx = k;
            break;
          }
          if (lowPrices[k] <= slPrice && slHitIdx === null) {
            slHitIdx = k;
            endIdx = k;
            break;
          }
        }

        // Bracket Lines (Entry, SL, TP1, TP2)
        if (showTargets) {
          // Entry Line
          output.lines.push({
            id: `qnt-entry-${i}`,
            x1: times[i],
            y1: entryPrice,
            x2: times[endIdx],
            y2: entryPrice,
            color: '#06b6d4',
            width: 1.5,
            style: 'dashed',
            label: `ENTRY ${entryPrice.toFixed(1)}`
          });

          // Stop Loss Line
          output.lines.push({
            id: `qnt-sl-${i}`,
            x1: times[i],
            y1: slPrice,
            x2: times[endIdx],
            y2: slPrice,
            color: '#ef4444',
            width: 1.5,
            style: 'dashed',
            label: `SL ${slPrice.toFixed(1)}`
          });

          // Take Profit 1 Line
          output.lines.push({
            id: `qnt-tp1-${i}`,
            x1: times[i],
            y1: tp1Price,
            x2: times[tp1HitIdx ? tp1HitIdx : endIdx],
            y2: tp1Price,
            color: '#22c55e',
            width: 1.5,
            style: 'dashed',
            label: `TP1 ${tp1Price.toFixed(1)}`
          });

          // Take Profit 2 Line
          output.lines.push({
            id: `qnt-tp2-${i}`,
            x1: times[i],
            y1: tp2Price,
            x2: times[endIdx],
            y2: tp2Price,
            color: '#10b981',
            width: 2,
            style: 'solid',
            label: `TP2 ${tp2Price.toFixed(1)}`
          });
        }

        // Risk / Reward Shaded Zones
        if (showRRBoxes) {
          // Target Profit Zone (Green)
          output.boxes.push({
            id: `qnt-box-tp-${i}`,
            x1: times[i],
            y1: tp2Price,
            x2: times[endIdx],
            y2: entryPrice,
            color: 'rgba(34, 197, 94, 0.08)',
            bordercolor: 'rgba(34, 197, 94, 0.3)',
            borderstyle: 'solid',
            label: '1:2 R:R Target'
          });

          // Stop Risk Zone (Red)
          output.boxes.push({
            id: `qnt-box-sl-${i}`,
            x1: times[i],
            y1: entryPrice,
            x2: times[endIdx],
            y2: slPrice,
            color: 'rgba(239, 68, 68, 0.08)',
            bordercolor: 'rgba(239, 68, 68, 0.3)',
            borderstyle: 'solid'
          });
        }

        // Outcome Badges
        if (showLabels) {
          if (tp2HitIdx !== null) {
            output.labels.push({
              id: `lbl-tp2-${i}`,
              x: times[tp2HitIdx],
              y: tp2Price,
              text: '✓ TP2 (3.0R)',
              color: '#15803d',
              textcolor: '#ffffff',
              badge: true
            });
          } else if (tp1HitIdx !== null) {
            output.labels.push({
              id: `lbl-tp1-${i}`,
              x: times[tp1HitIdx],
              y: tp1Price,
              text: '✓ TP1 (1.5R)',
              color: '#16a34a',
              textcolor: '#ffffff',
              badge: true
            });
          } else if (slHitIdx !== null) {
            output.labels.push({
              id: `lbl-sl-${i}`,
              x: times[slHitIdx],
              y: slPrice,
              text: '✕ SL Stopped',
              color: '#dc2626',
              textcolor: '#ffffff',
              badge: true
            });
          }
        }
      } else if (sellCondition) {
        lastSignalIdx = i;
        lastSignalType = 'SELL';
        const entryPrice = currClose;
        const slPrice = entryPrice + currAtr * slMult;
        const tp1Price = entryPrice - currAtr * tp1Mult;
        const tp2Price = entryPrice - currAtr * tp2Mult;

        // Primary Sell Signal Marker
        output.signals.push({
          time: times[i],
          type: 'SELL',
          price: candles[i].high,
          comment: 'QUANT SELL'
        });

        // Forward trade simulation for outcome and bracket lines
        const maxForward = Math.min(candles.length - 1, i + 24);
        let endIdx = maxForward;
        let tp1HitIdx: number | null = null;
        let tp2HitIdx: number | null = null;
        let slHitIdx: number | null = null;

        for (let k = i + 1; k <= maxForward; k++) {
          if (lowPrices[k] <= tp1Price && tp1HitIdx === null) tp1HitIdx = k;
          if (lowPrices[k] <= tp2Price && tp2HitIdx === null) {
            tp2HitIdx = k;
            endIdx = k;
            break;
          }
          if (highPrices[k] >= slPrice && slHitIdx === null) {
            slHitIdx = k;
            endIdx = k;
            break;
          }
        }

        // Bracket Lines (Entry, SL, TP1, TP2)
        if (showTargets) {
          // Entry Line
          output.lines.push({
            id: `qnt-entry-${i}`,
            x1: times[i],
            y1: entryPrice,
            x2: times[endIdx],
            y2: entryPrice,
            color: '#f97316',
            width: 1.5,
            style: 'dashed',
            label: `ENTRY ${entryPrice.toFixed(1)}`
          });

          // Stop Loss Line
          output.lines.push({
            id: `qnt-sl-${i}`,
            x1: times[i],
            y1: slPrice,
            x2: times[endIdx],
            y2: slPrice,
            color: '#ef4444',
            width: 1.5,
            style: 'dashed',
            label: `SL ${slPrice.toFixed(1)}`
          });

          // Take Profit 1 Line
          output.lines.push({
            id: `qnt-tp1-${i}`,
            x1: times[i],
            y1: tp1Price,
            x2: times[tp1HitIdx ? tp1HitIdx : endIdx],
            y2: tp1Price,
            color: '#22c55e',
            width: 1.5,
            style: 'dashed',
            label: `TP1 ${tp1Price.toFixed(1)}`
          });

          // Take Profit 2 Line
          output.lines.push({
            id: `qnt-tp2-${i}`,
            x1: times[i],
            y1: tp2Price,
            x2: times[endIdx],
            y2: tp2Price,
            color: '#10b981',
            width: 2,
            style: 'solid',
            label: `TP2 ${tp2Price.toFixed(1)}`
          });
        }

        // Risk / Reward Shaded Zones
        if (showRRBoxes) {
          // Target Profit Zone (Green)
          output.boxes.push({
            id: `qnt-box-tp-${i}`,
            x1: times[i],
            y1: entryPrice,
            x2: times[endIdx],
            y2: tp2Price,
            color: 'rgba(34, 197, 94, 0.08)',
            bordercolor: 'rgba(34, 197, 94, 0.3)',
            borderstyle: 'solid',
            label: '1:2 R:R Target'
          });

          // Stop Risk Zone (Red)
          output.boxes.push({
            id: `qnt-box-sl-${i}`,
            x1: times[i],
            y1: slPrice,
            x2: times[endIdx],
            y2: entryPrice,
            color: 'rgba(239, 68, 68, 0.08)',
            bordercolor: 'rgba(239, 68, 68, 0.3)',
            borderstyle: 'solid'
          });
        }

        // Outcome Badges
        if (showLabels) {
          if (tp2HitIdx !== null) {
            output.labels.push({
              id: `lbl-tp2-${i}`,
              x: times[tp2HitIdx],
              y: tp2Price,
              text: '✓ TP2 (3.0R)',
              color: '#15803d',
              textcolor: '#ffffff',
              badge: true
            });
          } else if (tp1HitIdx !== null) {
            output.labels.push({
              id: `lbl-tp1-${i}`,
              x: times[tp1HitIdx],
              y: tp1Price,
              text: '✓ TP1 (1.5R)',
              color: '#16a34a',
              textcolor: '#ffffff',
              badge: true
            });
          } else if (slHitIdx !== null) {
            output.labels.push({
              id: `lbl-sl-${i}`,
              x: times[slHitIdx],
              y: slPrice,
              text: '✕ SL Stopped',
              color: '#dc2626',
              textcolor: '#ffffff',
              badge: true
            });
          }
        }
      }
    }

    return output;
  }

  // ==========================================
  // 10. PARSE STANDARD PINE SCRIPT (SMA, HMA, etc.)
  // ==========================================
  const variables: Record<string, (number | null)[]> = {
    'close': closePrices,
    'open': openPrices,
    'high': highPrices,
    'low': lowPrices,
    'volume': volumes
  };

  const constants: Record<string, number> = { ...params };

  const getNumber = (val: string, fallback: number): number => {
    const trimmed = val.trim();
    if (constants[trimmed] !== undefined) return constants[trimmed];
    if (variables[trimmed]) {
      const arr = variables[trimmed];
      if (arr.length > 0 && typeof arr[0] === 'number') return arr[0] as number;
    }
    const num = parseFloat(trimmed);
    return isNaN(num) ? fallback : num;
  };

  const getSeries = (val: string): (number | null)[] => {
    const trimmed = val.trim();
    if (variables[trimmed]) return variables[trimmed];
    const num = parseFloat(trimmed);
    if (!isNaN(num)) return candles.map(() => num);
    return closePrices;
  };

  const codeLines = indicator.code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  
  codeLines.forEach(line => {
    const inputMatch = line.match(/^(\w+)\s*=\s*input(?:\.(?:int|float|bool))?\s*\(\s*([\d.]+)/i);
    if (inputMatch) {
      const varName = inputMatch[1];
      const val = params[varName] !== undefined ? Number(params[varName]) : parseFloat(inputMatch[2]);
      constants[varName] = val;
      variables[varName] = candles.map(() => val);
      return;
    }

    const constMatch = line.match(/^(\w+)\s*=\s*([\d.]+)$/);
    if (constMatch) {
      const varName = constMatch[1];
      const val = params[varName] !== undefined ? Number(params[varName]) : parseFloat(constMatch[2]);
      constants[varName] = val;
      variables[varName] = candles.map(() => val);
      return;
    }

    const assignmentMatch = line.match(/^(\w+)\s*[:=]+\s*(.*)$/);
    if (assignmentMatch) {
      const varName = assignmentMatch[1].trim();
      const expression = assignmentMatch[2].trim();

      const hmaMatch = expression.match(/(?:ta\.)?hma\s*\(\s*([^,]+),\s*([^,)]+)\s*\)/i);
      if (hmaMatch) {
        const source = hmaMatch[1].trim();
        const lengthStr = hmaMatch[2].trim();
        const length = Math.max(2, Math.round(getNumber(lengthStr, 20)));
        const srcData = getSeries(source);
        variables[varName] = TA.hma(srcData, length);
        return;
      }

      const smaMatch = expression.match(/(?:ta\.)?sma\s*\(\s*([^,]+),\s*([^,)]+)\s*\)/i);
      if (smaMatch) {
        const source = smaMatch[1].trim();
        const lengthStr = smaMatch[2].trim();
        const length = Math.max(1, Math.round(getNumber(lengthStr, 20)));
        const srcData = getSeries(source);
        variables[varName] = TA.sma(srcData, length);
        return;
      }

      const emaMatch = expression.match(/(?:ta\.)?ema\s*\(\s*([^,]+),\s*([^,)]+)\s*\)/i);
      if (emaMatch) {
        const source = emaMatch[1].trim();
        const lengthStr = emaMatch[2].trim();
        const length = Math.max(1, Math.round(getNumber(lengthStr, 20)));
        const srcData = getSeries(source);
        variables[varName] = TA.ema(srcData, length);
        return;
      }

      const rsiMatch = expression.match(/(?:ta\.)?rsi\s*\(\s*([^,]+),\s*([^,)]+)\s*\)/i);
      if (rsiMatch) {
        const source = rsiMatch[1].trim();
        const lengthStr = rsiMatch[2].trim();
        const length = Math.max(1, Math.round(getNumber(lengthStr, 14)));
        const srcData = getSeries(source);
        variables[varName] = TA.rsi(srcData, length);
        return;
      }

      const atrMatch = expression.match(/(?:ta\.)?atr\s*\(\s*([^,)]+)\s*\)/i);
      if (atrMatch) {
        const lengthStr = atrMatch[1].trim();
        const length = Math.max(1, Math.round(getNumber(lengthStr, 14)));
        variables[varName] = TA.atr(highPrices, lowPrices, closePrices, length);
        return;
      }
    }

    // Plot instruction
    const plotMatch = line.match(/plot\s*\(\s*([^,]+)(?:,\s*["']([^"']+)["'])?(?:,\s*color\s*=\s*([^,)]+))?/i);
    if (plotMatch) {
      const varName = plotMatch[1].trim();
      const title = plotMatch[2] || indicator.name;
      const colorExpr = plotMatch[3] || '#2962ff';

      const data = variables[varName] || closePrices;
      const series: IndicatorSeries[] = [];

      for (let i = 0; i < candles.length; i++) {
        const val = data[i];
        if (val !== null && !isNaN(val)) {
          let resolvedColor = resolveColorString(colorExpr);
          if (colorExpr.includes('close >') || colorExpr.includes('close <')) {
            const isGreater = closePrices[i] > (data[i] || 0);
            resolvedColor = isGreater ? '#26a69a' : '#ef5350';
          }

          series.push({
            time: times[i],
            value: val,
            color: resolvedColor,
            label: title
          });
        }
      }

      output.plots.push(series);
    }
  });

  return output;
}
