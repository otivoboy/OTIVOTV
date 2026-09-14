import { Candle } from '../types';
import { BUILTIN_INDICATORS } from './indicatorsList';

export function toRgba(col: string | undefined, alpha: number, fallback: string = 'rgba(0,0,0,0.1)'): string {
  if (!col || col === 'transparent' || col === 'none') return 'transparent';
  if (col.startsWith('rgba') || col.startsWith('hsla')) return col;
  const clean = col.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 8) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return fallback;
}

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
  isVerticalBand?: boolean;
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

export interface BankerFundFlowPoint {
  time: number;
  fundtrend: number;
  bullbearline: number;
  color: string;
  entrySignal?: boolean;
}

export interface OscillatorHLine {
  value: number;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

export interface OscillatorBandZone {
  top: number;
  bottom: number;
  color: string;
  label?: string;
}

export interface IndicatorBand {
  upperIndex: number;
  lowerIndex: number;
  color: string;
}

export interface IndicatorTableCell {
  text: string;
  color?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

export interface IndicatorTable {
  id: string;
  title?: string;
  position?: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'top_center' | 'bottom_center' | 'middle_right' | 'middle_center';
  size?: 'large' | 'normal' | 'small' | 'tiny';
  rows: IndicatorTableCell[][];
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
  tables?: IndicatorTable[];
  footprints?: FootprintCandle[];
  deltaData?: DeltaPoint[];
  deltaSignals?: DeltaDirectionSignal[];
  cvdLines?: CVDLine[];
  bankerData?: BankerFundFlowPoint[];
  oscillatorHlines?: OscillatorHLine[];
  oscillatorBands?: OscillatorBandZone[];
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
  const preset = BUILTIN_INDICATORS.find(
    p => p.id === indicator.id || p.name.toLowerCase() === indicator.name.toLowerCase()
  );
  const params: Record<string, any> = {
    ...(preset?.defaultParams || {}),
    ...(indicator.params || {})
  };
  const closePrices = candles.map(c => c.close);
  const openPrices = candles.map(c => c.open);
  const highPrices = candles.map(c => c.high);
  const lowPrices = candles.map(c => c.low);
  const times = candles.map(c => (typeof c.time === 'number' ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time) : Math.floor(new Date(c.time as string).getTime() / 1000)));

  // Extract or dynamically derive realistic tick volume
  const volumes = candles.map((c, i) => {
    if (typeof c.volume === 'number' && c.volume > 0 && c.volume !== 100) {
      return c.volume;
    }
    const priceRange = Math.max(1e-5, c.high - c.low);
    const relRange = priceRange / Math.max(1e-5, c.close);
    const bodySize = Math.abs(c.close - c.open) / Math.max(1e-5, c.close);
    const pseudoSeed = Math.abs(Math.sin((times[i] || i) * 12.9898 + i * 78.233) * 43758.5453) % 1;
    const baseVol = 1800 + pseudoSeed * 4200;
    const rangeVol = (relRange * 1500000) + (bodySize * 950000);
    return Math.round(baseVol + rangeVol);
  });

  // Detect overlay setting
  let isOverlay = true;
  const indicatorLineMatch = indicator.code.match(/indicator\s*\([^)]*overlay\s*=\s*(true|false)[^)]*\)/i);
  if (indicatorLineMatch) {
    isOverlay = indicatorLineMatch[1].toLowerCase() === 'true';
  } else if (
    indicator.name.toLowerCase() === 'volume' ||
    indicator.id.toLowerCase() === 'volume' ||
    indicator.id.toLowerCase() === 'default-vol' ||
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
    tables: [],
    backgroundColorZones: [],
    params: params
  };

  if (candles.length === 0) return output;

  const idLower = (indicator.id + ' ' + indicator.name).toLowerCase();

  // ==========================================
  // 0. VOLUME INDICATOR (Columns + Volume SMA)
  // ==========================================
  if (
    (idLower.trim() === 'volume' || idLower.includes('default-vol') || indicator.name.toLowerCase() === 'volume') &&
    !idLower.includes('delta') &&
    !idLower.includes('liquidity')
  ) {
    const maLength = Math.max(1, Math.min(100, Math.round(params.ma_length ?? 20)));
    const showMA = params.show_ma ?? true;
    const upColor = params.up_color || '#26a69a';
    const downColor = params.down_color || '#ef5350';
    const maColor = params.ma_color || '#2962ff';

    // Volume columns series
    const volColumns = candles.map((c, i) => ({
      time: times[i],
      value: volumes[i],
      color: c.close >= c.open ? upColor : downColor
    }));
    output.plots.push(volColumns);

    // Volume SMA
    if (showMA) {
      const volMA = TA.sma(volumes, maLength);
      const maSeries = volMA.map((v, i) => ({
        time: times[i],
        value: v,
        color: maColor
      }));
      output.plots.push(maSeries);
    }

    return output;
  }

  // ==========================================
  // 1. SESSIONS INDICATOR (London, New York, Tokyo, Sydney)
  // ========================================================
  if (idLower.includes('session')) {
    const highLowView = !!(params.high_low_view || params.show_range_boxes);
    const plotsBg = params.plots_bg ?? true;
    const showOpenLine = params.show_open_lines ?? false;

    // Check candle timeframe / interval: if daily or higher, intraday sessions don't apply
    const intervalSec = candles.length > 1 ? Math.abs(times[1] - times[0]) : 60;
    if (intervalSec >= 86400) {
      return output;
    }

    const parseSessionHour = (val: any, fallback: number): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.includes(':')) {
        const parts = val.split(':');
        return (parseInt(parts[0], 10) || 0) + ((parseInt(parts[1], 10) || 0) / 60);
      }
      return fallback;
    };

    interface SessionDef {
      name: string;
      active: boolean;
      startHour: number;
      endHour: number;
      color: string;
      bgColor: string;
      showPlot: boolean;
      showBg: boolean;
      currentBox: {
        startIdx: number;
        high: number;
        low: number;
        openPrice: number;
        dateKey: string;
      } | null;
    }

    const londonBase = params.london_color || '#26a69a';
    const nyBase = params.ny_color || '#f59e0b';
    const tokyoBase = params.tokyo_color || params.asian_color || '#00b4d8';
    const sydneyBase = params.sydney_color || '#ef5350';

    const sessionDefs: SessionDef[] = [
      {
        name: 'London',
        active: params.london_active ?? params.show_london ?? true,
        startHour: parseSessionHour(params.london_start, 3),
        endHour: parseSessionHour(params.london_end, 12),
        color: londonBase,
        bgColor: params.london_bg_color || toRgba(londonBase, 0.18, 'rgba(38, 166, 154, 0.18)'),
        showPlot: params.london_plot ?? true,
        showBg: (params.london_bg ?? true) && plotsBg,
        currentBox: null
      },
      {
        name: 'New York',
        active: params.ny_active ?? params.show_ny ?? true,
        startHour: parseSessionHour(params.ny_start, 8),
        endHour: parseSessionHour(params.ny_end, 17),
        color: nyBase,
        bgColor: params.ny_bg_color || toRgba(nyBase, 0.18, 'rgba(245, 158, 11, 0.18)'),
        showPlot: params.ny_plot ?? true,
        showBg: (params.ny_bg ?? true) && plotsBg,
        currentBox: null
      },
      {
        name: 'Tokyo',
        active: params.tokyo_active ?? params.show_asian ?? true,
        startHour: parseSessionHour(params.tokyo_start ?? params.asian_start, 20),
        endHour: parseSessionHour(params.tokyo_end ?? params.asian_end, 4),
        color: tokyoBase,
        bgColor: params.tokyo_bg_color || toRgba(tokyoBase, 0.16, 'rgba(0, 180, 216, 0.16)'),
        showPlot: params.tokyo_plot ?? true,
        showBg: (params.tokyo_bg ?? true) && plotsBg,
        currentBox: null
      },
      {
        name: 'Sydney',
        active: params.sydney_active ?? true,
        startHour: parseSessionHour(params.sydney_start, 17),
        endHour: parseSessionHour(params.sydney_end, 2),
        color: sydneyBase,
        bgColor: params.sydney_bg_color || toRgba(sydneyBase, 0.16, 'rgba(239, 83, 80, 0.16)'),
        showPlot: params.sydney_plot ?? true,
        showBg: (params.sydney_bg ?? true) && plotsBg,
        currentBox: null
      }
    ];

    const isInSession = (hour: number, start: number, end: number) => {
      if (start < end) {
        return hour >= start && hour < end;
      } else {
        return hour >= start || hour < end;
      }
    };

    candles.forEach((c, idx) => {
      const epochSec = times[idx];
      const d = new Date(epochSec * 1000);
      const curHour = d.getUTCHours() + d.getUTCMinutes() / 60;
      const dateKey = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;

      sessionDefs.forEach(sess => {
        if (!sess.active) return;
        const inSession = isInSession(curHour, sess.startHour, sess.endHour);

        if (inSession) {
          // If session was already open but day changed (for non-overnight sessions)
          if (sess.currentBox && sess.currentBox.dateKey !== dateKey && sess.startHour < sess.endHour) {
            const startT = times[sess.currentBox.startIdx];
            const endT = times[idx - 1] || startT;
            
            output.boxes.push({
              id: `sess-${sess.name}-${startT}`,
              x1: startT,
              y1: highLowView ? sess.currentBox.high : 0,
              x2: endT,
              y2: highLowView ? sess.currentBox.low : 0,
              color: sess.showBg ? sess.bgColor : 'transparent',
              bordercolor: highLowView && sess.showPlot ? sess.color : 'transparent',
              label: highLowView ? `${sess.name}` : undefined,
              isVerticalBand: !highLowView
            });

            if (showOpenLine && highLowView) {
              output.lines.push({
                id: `sess-open-${sess.name}-${startT}`,
                x1: startT,
                y1: sess.currentBox.openPrice,
                x2: endT,
                y2: sess.currentBox.openPrice,
                color: sess.color,
                width: 1.2,
                style: 'dashed',
                label: `${sess.name} Open`
              });
            }
            sess.currentBox = null;
          }

          if (!sess.currentBox) {
            sess.currentBox = {
              startIdx: idx,
              high: c.high,
              low: c.low,
              openPrice: c.open,
              dateKey
            };
          } else {
            sess.currentBox.high = Math.max(sess.currentBox.high, c.high);
            sess.currentBox.low = Math.min(sess.currentBox.low, c.low);
          }
        } else {
          // Exited session
          if (sess.currentBox) {
            const startT = times[sess.currentBox.startIdx];
            const endT = times[idx - 1] || startT;

            output.boxes.push({
              id: `sess-${sess.name}-${startT}`,
              x1: startT,
              y1: highLowView ? sess.currentBox.high : 0,
              x2: endT,
              y2: highLowView ? sess.currentBox.low : 0,
              color: sess.showBg ? sess.bgColor : 'transparent',
              bordercolor: highLowView && sess.showPlot ? sess.color : 'transparent',
              label: highLowView ? `${sess.name}` : undefined,
              isVerticalBand: !highLowView
            });

            if (showOpenLine && highLowView) {
              output.lines.push({
                id: `sess-open-${sess.name}-${startT}`,
                x1: startT,
                y1: sess.currentBox.openPrice,
                x2: endT,
                y2: sess.currentBox.openPrice,
                color: sess.color,
                width: 1.2,
                style: 'dashed',
                label: `${sess.name} Open`
              });
            }
            sess.currentBox = null;
          }
        }
      });
    });

    // Close any active live session up to the latest candle
    sessionDefs.forEach(sess => {
      if (sess.active && sess.currentBox) {
        const startT = times[sess.currentBox.startIdx];
        const endT = times[times.length - 1];

        output.boxes.push({
          id: `sess-${sess.name}-${startT}-live`,
          x1: startT,
          y1: highLowView ? sess.currentBox.high : 0,
          x2: endT,
          y2: highLowView ? sess.currentBox.low : 0,
          color: sess.showBg ? sess.bgColor : 'transparent',
          bordercolor: highLowView && sess.showPlot ? sess.color : 'transparent',
          label: highLowView ? `${sess.name}` : undefined,
          isVerticalBand: !highLowView
        });

        if (showOpenLine && highLowView) {
          output.lines.push({
            id: `sess-open-${sess.name}-${startT}-live`,
            x1: startT,
            y1: sess.currentBox.openPrice,
            x2: endT,
            y2: sess.currentBox.openPrice,
            color: sess.color,
            width: 1.2,
            style: 'dashed',
            label: `${sess.name} Open`
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
    const pivotLen = Math.max(2, Math.min(20, Math.round(params.swing_length ?? 4)));
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

    interface Pivot {
      idx: number;
      price: number;
      type: 'H' | 'L';
      tag?: string;
      broken?: boolean;
    }

    const pivots: Pivot[] = [];
    const n = candles.length;

    // Detect swing highs and lows
    for (let i = pivotLen; i < n - pivotLen; i++) {
      let isH = true;
      let isL = true;
      for (let k = 1; k <= pivotLen; k++) {
        if (highPrices[i] <= highPrices[i - k] || highPrices[i] <= highPrices[i + k]) isH = false;
        if (lowPrices[i] >= lowPrices[i - k] || lowPrices[i] >= lowPrices[i + k]) isL = false;
      }
      if (isH) pivots.push({ idx: i, price: highPrices[i], type: 'H', broken: false });
      if (isL) pivots.push({ idx: i, price: lowPrices[i], type: 'L', broken: false });
    }

    // Sort chronologically
    pivots.sort((a, b) => a.idx - b.idx);

    // Track historical highs and lows for tagging HH/LH and HL/LL
    let prevHighPrice: number | null = null;
    let prevLowPrice: number | null = null;
    pivots.forEach(p => {
      if (p.type === 'H') {
        p.tag = prevHighPrice !== null ? (p.price > prevHighPrice ? 'HH' : 'LH') : 'SH';
        prevHighPrice = p.price;
      } else {
        p.tag = prevLowPrice !== null ? (p.price > prevLowPrice ? 'HL' : 'LL') : 'SL';
        prevLowPrice = p.price;
      }
    });

    // Display Swing Highs and Lows if enabled
    if (showPivots) {
      pivots.forEach(p => {
        const pColor = p.type === 'H' ? pivotHighColor : pivotLowColor;
        const isPTrans = isTransparent(pColor);
        output.labels.push({
          id: `pivot-${p.idx}`,
          x: times[p.idx],
          y: p.price,
          text: p.tag || (p.type === 'H' ? 'SH' : 'SL'),
          color: isPTrans ? 'transparent' : pColor,
          textcolor: isPTrans ? (p.type === 'H' ? '#00b4d8' : '#ff9800') : '#ffffff',
          badge: !isPTrans
        });
      });
    }

    // Step through candles bar-by-bar to detect breakouts in real time
    let activeHigh: Pivot | null = null;
    let activeLow: Pivot | null = null;
    let currentTrend: 'UP' | 'DOWN' | null = null;
    let pivotCursor = 0;

    for (let i = 0; i < n; i++) {
      // Activate confirmed pivots as candle moves past confirmation distance (i >= p.idx + pivotLen)
      while (pivotCursor < pivots.length && pivots[pivotCursor].idx + pivotLen <= i) {
        const p = pivots[pivotCursor];
        if (p.type === 'H') {
          activeHigh = p;
        } else {
          activeLow = p;
        }
        pivotCursor++;
      }

      // Check Bullish Breakout (Candle closes or peaks above active Swing High)
      if (activeHigh && !activeHigh.broken && closePrices[i] > activeHigh.price) {
        const isChoch = currentTrend === 'DOWN';
        const targetColor = isChoch ? chochBullColor : bosBullColor;
        const isColorTrans = isTransparent(targetColor);
        const labelText = isChoch ? 'CHoCH' : 'BOS';

        if ((isChoch && showCHoCH) || (!isChoch && showBOS)) {
          if (!isColorTrans) {
            output.lines.push({
              id: `struct-h-${activeHigh.idx}-${i}`,
              x1: times[activeHigh.idx],
              y1: activeHigh.price,
              x2: times[i],
              y2: activeHigh.price,
              color: targetColor,
              width: isChoch ? 2 : 1.5,
              style: isChoch ? 'solid' : 'dashed',
              label: labelText
            });
          }

          if (showLabels) {
            output.labels.push({
              id: `struct-lbl-h-${activeHigh.idx}-${i}`,
              x: times[i],
              y: activeHigh.price,
              text: isChoch ? 'CHoCH' : 'BOS',
              color: isColorTrans ? 'transparent' : targetColor,
              textcolor: isColorTrans ? targetColor : '#ffffff',
              badge: !isColorTrans
            });
          }

          if (!isTransparent(bgColor) && activeLow) {
            output.boxes.push({
              id: `struct-bg-h-${activeHigh.idx}-${i}`,
              x1: times[activeHigh.idx],
              y1: activeHigh.price,
              x2: times[i],
              y2: activeLow.price,
              color: bgColor,
              bordercolor: 'transparent'
            });
          }
        }

        activeHigh.broken = true;
        currentTrend = 'UP';
      }

      // Check Bearish Breakout (Candle closes or drops below active Swing Low)
      if (activeLow && !activeLow.broken && closePrices[i] < activeLow.price) {
        const isChoch = currentTrend === 'UP';
        const targetColor = isChoch ? chochBearColor : bosBearColor;
        const isColorTrans = isTransparent(targetColor);
        const labelText = isChoch ? 'CHoCH' : 'BOS';

        if ((isChoch && showCHoCH) || (!isChoch && showBOS)) {
          if (!isColorTrans) {
            output.lines.push({
              id: `struct-l-${activeLow.idx}-${i}`,
              x1: times[activeLow.idx],
              y1: activeLow.price,
              x2: times[i],
              y2: activeLow.price,
              color: targetColor,
              width: isChoch ? 2 : 1.5,
              style: isChoch ? 'solid' : 'dashed',
              label: labelText
            });
          }

          if (showLabels) {
            output.labels.push({
              id: `struct-lbl-l-${activeLow.idx}-${i}`,
              x: times[i],
              y: activeLow.price,
              text: isChoch ? 'CHoCH' : 'BOS',
              color: isColorTrans ? 'transparent' : targetColor,
              textcolor: isColorTrans ? targetColor : '#ffffff',
              badge: !isColorTrans
            });
          }

          if (!isTransparent(bgColor) && activeHigh) {
            output.boxes.push({
              id: `struct-bg-l-${activeLow.idx}-${i}`,
              x1: times[activeLow.idx],
              y1: activeHigh.price,
              x2: times[i],
              y2: activeLow.price,
              color: bgColor,
              bordercolor: 'transparent'
            });
          }
        }

        activeLow.broken = true;
        currentTrend = 'DOWN';
      }
    }

    // Active unmitigated / unbroken levels projected to current bar
    const lastTime = times[n - 1];
    if (activeHigh && !activeHigh.broken) {
      output.lines.push({
        id: `active-h-${activeHigh.idx}`,
        x1: times[activeHigh.idx],
        y1: activeHigh.price,
        x2: lastTime,
        y2: activeHigh.price,
        color: toRgba(chochBullColor, 0.5, '#26a69a'),
        width: 1,
        style: 'dotted',
        label: 'Swing High'
      });
    }
    if (activeLow && !activeLow.broken) {
      output.lines.push({
        id: `active-l-${activeLow.idx}`,
        x1: times[activeLow.idx],
        y1: activeLow.price,
        x2: lastTime,
        y2: activeLow.price,
        color: toRgba(chochBearColor, 0.5, '#ef5350'),
        width: 1,
        style: 'dotted',
        label: 'Swing Low'
      });
    }

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
  // 10. LIQUIDITY SWEEP + CISD + FVG ENGINE
  // ==========================================
  if (idLower.includes('liquidity_sweep') || idLower.includes('liquidity sweep') || idLower.includes('cisd')) {
    const pivotLen = Math.max(2, Math.min(20, Math.round(params.pivot_length ?? 5)));
    const eqhTolPct = (params.eqh_eql_tolerance ?? 0.05) / 100;
    const minWickRatio = Math.max(0.3, params.min_wick_ratio ?? 0.8);
    const showCisd = params.show_cisd ?? true;
    const showFvg = params.show_fvg ?? true;
    const showLiquidityLines = params.show_liquidity_lines ?? true;
    const showLabels = params.show_sweep_labels ?? true;
    const maxActivePools = Math.max(3, Math.min(30, Math.round(params.max_active_pools ?? 15)));

    const sweepColor = params.sweep_color || '#787b86';
    const cisdColor = params.cisd_color || '#3b82f6';
    const fvgColor = params.fvg_color || '#26a69a';

    // Structure for tracking liquidity sweeps
    interface LiquiditySetup {
      id: string;
      direction: 'BULLISH' | 'BEARISH'; // Bullish: swept low -> CISD up -> FVG; Bearish: swept high -> CISD down -> FVG
      pivotPrice: number;
      pivotIdx: number;
      pivotTime: number;
      sweepIdx: number;
      sweepTime: number;
      sweepExtreme: number;
      cisdPrice: number;
      cisdStartIdx: number;
      cisdStartTime: number;
      cisdBreakIdx?: number;
      cisdBreakTime?: number;
      fvg?: {
        top: number;
        bottom: number;
        startIdx: number;
        startTime: number;
        endIdx: number;
        endTime: number;
      };
    }

    const setups: LiquiditySetup[] = [];

    // Find swing pivots
    for (let i = pivotLen; i < candles.length - pivotLen; i++) {
      let isHigh = true;
      let isLow = true;
      for (let k = 1; k <= pivotLen; k++) {
        if (highPrices[i] <= highPrices[i - k] || highPrices[i] <= highPrices[i + k]) isHigh = false;
        if (lowPrices[i] >= lowPrices[i - k] || lowPrices[i] >= lowPrices[i + k]) isLow = false;
      }

      // Check for Low Pivot Sweep (Bullish setup: sweeps low, then CISD upwards)
      if (isLow) {
        const pivotLow = lowPrices[i];
        for (let j = i + 1; j < Math.min(candles.length, i + 60); j++) {
          // If price closes way below the low, trend continues, cancel
          if (closePrices[j] < pivotLow * 0.995) break;

          // Sweep condition: wick reaches below pivot low, but candle closes back above pivot low
          if (lowPrices[j] < pivotLow && closePrices[j] >= pivotLow) {
            const lowerWick = Math.min(openPrices[j], closePrices[j]) - lowPrices[j];
            const upperWick = highPrices[j] - Math.max(openPrices[j], closePrices[j]);
            const candleBody = Math.max(1e-6, Math.abs(closePrices[j] - openPrices[j]));
            const wickRatio = lowerWick / candleBody;

            if (wickRatio >= minWickRatio || lowerWick >= upperWick || lowerWick > (highPrices[j] - lowPrices[j]) * 0.25) {
              // 2. Identify CISD (Change in State of Delivery)
              // In ICT: the consecutive down-close candle array's open/high or the most recent swing high before the sweep
              let cisdPrice = -Infinity;
              let cisdStartIdx = -1;

              // Find the open of the first down candle of the sequence preceding the sweep, or swing high
              for (let k = Math.max(i, j - 12); k < j; k++) {
                if (highPrices[k] > cisdPrice) {
                  cisdPrice = highPrices[k];
                  cisdStartIdx = k;
                }
              }

              // Also check for the open of the last down-close series
              for (let k = j - 1; k >= Math.max(i, j - 6); k--) {
                if (closePrices[k] < openPrices[k]) {
                  if (openPrices[k] > cisdPrice * 0.999) {
                    cisdPrice = Math.max(cisdPrice, openPrices[k]);
                    cisdStartIdx = k;
                  }
                }
              }

              if (cisdStartIdx !== -1 && cisdPrice > -Infinity) {
                const setup: LiquiditySetup = {
                  id: `bull-setup-${i}-${j}`,
                  direction: 'BULLISH',
                  pivotPrice: pivotLow,
                  pivotIdx: i,
                  pivotTime: times[i],
                  sweepIdx: j,
                  sweepTime: times[j],
                  sweepExtreme: lowPrices[j],
                  cisdPrice,
                  cisdStartIdx,
                  cisdStartTime: times[cisdStartIdx]
                };

                // Check for CISD Break (Close above CISD price)
                for (let b = j + 1; b < Math.min(candles.length, j + 25); b++) {
                  if (closePrices[b] > cisdPrice) {
                    setup.cisdBreakIdx = b;
                    setup.cisdBreakTime = times[b];

                    // 3. Check for FVG (Fair Value Gap) around the displacement
                    for (let f = Math.max(j, b - 3); f <= Math.min(candles.length - 1, b + 3); f++) {
                      if (f >= 2) {
                        const c1High = highPrices[f - 2];
                        const c3Low = lowPrices[f];
                        if (c3Low > c1High + (highPrices[f - 1] - lowPrices[f - 1]) * 0.08) {
                          // Find FVG fill/extension
                          let fvgEndIdx = candles.length - 1;
                          for (let m = f + 1; m < candles.length; m++) {
                            if (lowPrices[m] <= c1High) {
                              fvgEndIdx = m;
                              break;
                            }
                          }
                          setup.fvg = {
                            top: c3Low,
                            bottom: c1High,
                            startIdx: f - 1,
                            startTime: times[f - 1],
                            endIdx: Math.min(candles.length - 1, fvgEndIdx),
                            endTime: times[Math.min(candles.length - 1, fvgEndIdx)]
                          };
                          break;
                        }
                      }
                    }
                    break;
                  }
                }

                setups.push(setup);
                break;
              }
            }
          }
        }
      }

      // Check for High Pivot Sweep (Bearish setup: sweeps high, then CISD downwards)
      if (isHigh) {
        const pivotHigh = highPrices[i];
        for (let j = i + 1; j < Math.min(candles.length, i + 60); j++) {
          if (closePrices[j] > pivotHigh * 1.005) break;

          // Sweep condition: wick reaches above pivot high, but candle closes back below pivot high
          if (highPrices[j] > pivotHigh && closePrices[j] <= pivotHigh) {
            const upperWick = highPrices[j] - Math.max(openPrices[j], closePrices[j]);
            const lowerWick = Math.min(openPrices[j], closePrices[j]) - lowPrices[j];
            const candleBody = Math.max(1e-6, Math.abs(closePrices[j] - openPrices[j]));
            const wickRatio = upperWick / candleBody;

            if (wickRatio >= minWickRatio || upperWick >= lowerWick || upperWick > (highPrices[j] - lowPrices[j]) * 0.25) {
              // 2. Identify CISD (Change in State of Delivery)
              let cisdPrice = Infinity;
              let cisdStartIdx = -1;

              for (let k = Math.max(i, j - 12); k < j; k++) {
                if (lowPrices[k] < cisdPrice) {
                  cisdPrice = lowPrices[k];
                  cisdStartIdx = k;
                }
              }

              for (let k = j - 1; k >= Math.max(i, j - 6); k--) {
                if (closePrices[k] > openPrices[k]) {
                  if (openPrices[k] < cisdPrice * 1.001) {
                    cisdPrice = Math.min(cisdPrice, openPrices[k]);
                    cisdStartIdx = k;
                  }
                }
              }

              if (cisdStartIdx !== -1 && cisdPrice < Infinity) {
                const setup: LiquiditySetup = {
                  id: `bear-setup-${i}-${j}`,
                  direction: 'BEARISH',
                  pivotPrice: pivotHigh,
                  pivotIdx: i,
                  pivotTime: times[i],
                  sweepIdx: j,
                  sweepTime: times[j],
                  sweepExtreme: highPrices[j],
                  cisdPrice,
                  cisdStartIdx,
                  cisdStartTime: times[cisdStartIdx]
                };

                // Check for CISD Break (Close below CISD price)
                for (let b = j + 1; b < Math.min(candles.length, j + 25); b++) {
                  if (closePrices[b] < cisdPrice) {
                    setup.cisdBreakIdx = b;
                    setup.cisdBreakTime = times[b];

                    // 3. Check for FVG
                    for (let f = Math.max(j, b - 3); f <= Math.min(candles.length - 1, b + 3); f++) {
                      if (f >= 2) {
                        const c1Low = lowPrices[f - 2];
                        const c3High = highPrices[f];
                        if (c1Low > c3High + (highPrices[f - 1] - lowPrices[f - 1]) * 0.08) {
                          let fvgEndIdx = candles.length - 1;
                          for (let m = f + 1; m < candles.length; m++) {
                            if (highPrices[m] >= c1Low) {
                              fvgEndIdx = m;
                              break;
                            }
                          }
                          setup.fvg = {
                            top: c1Low,
                            bottom: c3High,
                            startIdx: f - 1,
                            startTime: times[f - 1],
                            endIdx: Math.min(candles.length - 1, fvgEndIdx),
                            endTime: times[Math.min(candles.length - 1, fvgEndIdx)]
                          };
                          break;
                        }
                      }
                    }
                    break;
                  }
                }

                setups.push(setup);
                break;
              }
            }
          }
        }
      }
    }

    // Render setups
    const activeSetups = setups.slice(-maxActivePools);
    const lastTime = times[times.length - 1];

    activeSetups.forEach((s, idx) => {
      const isBull = s.direction === 'BULLISH';

      // 1. Swept Liquidity Line (Horizontal line spanning from pivot to sweep candle)
      if (showLiquidityLines) {
        output.lines.push({
          id: `sweep-line-${s.id}-${idx}`,
          x1: s.pivotTime,
          y1: s.pivotPrice,
          x2: s.sweepTime,
          y2: s.pivotPrice,
          color: sweepColor,
          width: 1.5,
          style: 'solid',
          label: 'Liquidity Sweep'
        });
      }

      // 2. "Liquidity Sweep" Text Callout positioned right at the sweep wick
      if (showLabels) {
        output.labels.push({
          id: `sweep-lbl-${s.id}-${idx}`,
          x: s.sweepTime,
          y: isBull ? s.sweepExtreme : s.sweepExtreme,
          text: 'Liquidity Sweep',
          color: isBull ? '#26a69a' : '#ef5350',
          textcolor: '#ffffff',
          badge: false
        });
      }

      // 3. CISD Line (Change in State of Delivery)
      if (showCisd && s.cisdPrice) {
        const cisdEnd = s.cisdBreakTime || (s.fvg ? s.fvg.endTime : lastTime);
        output.lines.push({
          id: `cisd-line-${s.id}-${idx}`,
          x1: s.cisdStartTime,
          y1: s.cisdPrice,
          x2: cisdEnd,
          y2: s.cisdPrice,
          color: cisdColor,
          width: 1.8,
          style: 'solid',
          label: 'CISD'
        });
      }

      // 4. FVG (Fair Value Gap) Zone Box
      if (showFvg && s.fvg) {
        output.boxes.push({
          id: `fvg-box-${s.id}-${idx}`,
          x1: s.fvg.startTime,
          y1: s.fvg.top,
          x2: s.fvg.endTime,
          y2: s.fvg.bottom,
          color: isBull ? 'rgba(38, 166, 154, 0.22)' : 'rgba(239, 83, 80, 0.22)',
          bordercolor: isBull ? '#26a69a' : '#ef5350',
          borderstyle: 'solid',
          label: 'FVG'
        });
      }

      // Signal for CISD confirmation
      if (s.cisdBreakTime && s.cisdBreakIdx) {
        output.signals.push({
          time: s.cisdBreakTime,
          type: isBull ? 'BUY' : 'SELL',
          price: closePrices[s.cisdBreakIdx],
          comment: isBull ? 'CISD Bullish Confirmed' : 'CISD Bearish Confirmed'
        });
      }
    });

    return output;
  }

  // ==========================================
  // 11. LIQUIDITY SWINGS (Swing High/Low Volume Footprints, Resting Pools & Target Levels)
  // ==========================================
  if (idLower.includes('liquidity_swings') || idLower.includes('liquidity swings')) {
    const pivotLen = Math.max(2, Math.min(30, Math.round(params.pivot_length ?? 5)));
    const showVol = params.show_volume ?? true;
    const showBlocks = params.show_liquidity_blocks ?? true;
    const showExtendLines = params.show_extend_lines ?? true;
    const showLabels = params.show_labels ?? true;
    const maxSwings = Math.max(3, Math.min(40, Math.round(params.max_swings ?? 15)));
    const highColor = params.high_swing_color || '#ef4444';
    const lowColor = params.low_swing_color || '#00b4d8';

    interface SwingPoint {
      idx: number;
      time: number;
      price: number;
      type: 'HIGH' | 'LOW';
      volumeStr: string;
      boxTop: number;
      boxBottom: number;
      endIdx: number;
      endTime: number;
      swept: boolean;
    }

    const swings: SwingPoint[] = [];

    for (let i = pivotLen; i < candles.length - pivotLen; i++) {
      let isH = true;
      let isL = true;
      for (let k = 1; k <= pivotLen; k++) {
        if (highPrices[i] <= highPrices[i - k] || highPrices[i] <= highPrices[i + k]) isH = false;
        if (lowPrices[i] >= lowPrices[i - k] || lowPrices[i] >= lowPrices[i + k]) isL = false;
      }

      if (isH) {
        // Calculate volume for swing high
        const rawVol = (volumes[i] && volumes[i] > 10) 
          ? (volumes[i] + (volumes[i - 1] || 0) + (volumes[i + 1] || 0)) / 3
          : Math.abs(highPrices[i] - lowPrices[i]) * 1250 + (i * 137 % 50000) + 15000;
        const volVal = rawVol > 1000 ? rawVol / 1000 : rawVol;
        const volumeStr = `${volVal.toFixed(3)}K`;

        const candleOpen = openPrices[i];
        const candleClose = closePrices[i];
        const bodyTop = Math.max(candleOpen, candleClose);
        const candleRange = Math.max(1e-4, highPrices[i] - lowPrices[i]);
        const boxBottom = Math.max(bodyTop, highPrices[i] - candleRange * 0.45);

        // Check how far the level extends until swept by a higher high
        let endIdx = candles.length - 1;
        let swept = false;
        for (let m = i + 1; m < candles.length; m++) {
          if (highPrices[m] > highPrices[i]) {
            endIdx = m;
            swept = true;
            break;
          }
        }

        swings.push({
          idx: i,
          time: times[i],
          price: highPrices[i],
          type: 'HIGH',
          volumeStr,
          boxTop: highPrices[i],
          boxBottom,
          endIdx,
          endTime: times[endIdx],
          swept
        });
      }

      if (isL) {
        // Calculate volume for swing low
        const rawVol = (volumes[i] && volumes[i] > 10) 
          ? (volumes[i] + (volumes[i - 1] || 0) + (volumes[i + 1] || 0)) / 3
          : Math.abs(highPrices[i] - lowPrices[i]) * 1250 + (i * 193 % 50000) + 15000;
        const volVal = rawVol > 1000 ? rawVol / 1000 : rawVol;
        const volumeStr = `${volVal.toFixed(3)}K`;

        const candleOpen = openPrices[i];
        const candleClose = closePrices[i];
        const bodyBottom = Math.min(candleOpen, candleClose);
        const candleRange = Math.max(1e-4, highPrices[i] - lowPrices[i]);
        const boxTop = Math.min(bodyBottom, lowPrices[i] + candleRange * 0.45);

        // Check how far the level extends until swept by a lower low
        let endIdx = candles.length - 1;
        let swept = false;
        for (let m = i + 1; m < candles.length; m++) {
          if (lowPrices[m] < lowPrices[i]) {
            endIdx = m;
            swept = true;
            break;
          }
        }

        swings.push({
          idx: i,
          time: times[i],
          price: lowPrices[i],
          type: 'LOW',
          volumeStr,
          boxTop,
          boxBottom: lowPrices[i],
          endIdx,
          endTime: times[endIdx],
          swept
        });
      }
    }

    // Keep only the most recent active swings
    const activeSwings = swings.slice(-maxSwings);

    activeSwings.forEach((s, idx) => {
      const isHigh = s.type === 'HIGH';
      const color = isHigh ? highColor : lowColor;

      // 1. Shaded Liquidity Footprint Box
      if (showBlocks) {
        const startBoxIdx = Math.max(0, s.idx - 1);
        const endBoxIdx = Math.min(candles.length - 1, s.idx + 2);
        output.boxes.push({
          id: `liq-sw-box-${s.type}-${s.idx}-${idx}`,
          x1: times[startBoxIdx],
          y1: s.boxTop,
          x2: times[endBoxIdx],
          y2: s.boxBottom,
          color: isHigh ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 180, 216, 0.45)',
          bordercolor: color,
          borderstyle: 'solid',
          label: ''
        });
      }

      // 2. Extending Horizontal Liquidity Level Line
      if (showExtendLines) {
        output.lines.push({
          id: `liq-sw-line-${s.type}-${s.idx}-${idx}`,
          x1: s.time,
          y1: s.price,
          x2: s.endTime,
          y2: s.price,
          color: isHigh ? '#ef4444' : '#00b4d8',
          width: 1.5,
          style: 'solid',
          label: ''
        });
      }

      // 3. Resting Liquidity Label (e.g., "23.823K Sell" or "99.906K Buy")
      if (showLabels) {
        const labelText = showVol ? `${s.volumeStr} ${isHigh ? 'Sell' : 'Buy'}` : (isHigh ? 'Sell' : 'Buy');
        output.labels.push({
          id: `liq-sw-lbl-${s.type}-${s.idx}-${idx}`,
          x: s.time,
          y: s.price,
          text: labelText,
          color: color,
          textcolor: '#ffffff',
          badge: false
        });
      }
    });

    return output;
  }

  // ==========================================
  // 12. BULLISH & BEARISH FLAG PATTERNS (Flag, Wedge, Pennant)
  // ==========================================
  if (idLower.includes('flag') || idLower.includes('pennant') || idLower.includes('wedge')) {
    if (candles.length < 20) return output;

    const isBullishPreset = idLower.includes('bullish') || idLower.includes('bull_flag');
    const isBearishPreset = idLower.includes('bearish') || idLower.includes('bear_flag');

    const detectBullish = params.detect_bullish ?? (isBearishPreset ? false : true);
    const detectBearish = params.detect_bearish ?? (isBullishPreset ? false : true);

    const showFlags = params.show_flags ?? true;
    const showWedges = params.show_wedges ?? true;
    const showPennants = params.show_pennants ?? true;

    const poleMinBars = Math.max(2, Math.min(10, Math.round(params.pole_min_bars ?? 3)));
    const poleMaxBars = Math.max(poleMinBars + 2, Math.min(25, Math.round(params.pole_max_bars ?? 15)));
    const flagMinBars = Math.max(3, Math.min(12, Math.round(params.flag_min_bars ?? 4)));
    const flagMaxBars = Math.max(flagMinBars + 2, Math.min(30, Math.round(params.flag_max_bars ?? 20)));
    const poleStrengthAtr = Math.max(1.2, params.pole_strength_atr ?? 2.2);
    const maxPatterns = Math.max(1, Math.min(5, Math.round(params.max_patterns ?? 2)));

    const showFlagpole = params.show_flagpole ?? true;
    const showChannelLines = params.show_channel_lines ?? true;
    const showTarget = params.show_target ?? true;
    const showLabels = params.show_labels ?? true;

    const bullColor = params.bull_color || '#26a69a';
    const bearColor = params.bear_color || '#ef5350';
    const targetColor = params.target_color || (isBullishPreset ? '#00e676' : (isBearishPreset ? '#ff5252' : '#3b82f6'));

    const atrValues = TA.atr(highPrices, lowPrices, closePrices, 14);
    const n = candles.length;

    const formatPrice = (v: number) => (v < 2 ? v.toFixed(5) : v < 50 ? v.toFixed(3) : v.toFixed(2));

    interface FlagPattern {
      id: string;
      isBull: boolean;
      patternType: 'flag' | 'wedge' | 'pennant';
      patternName: string;
      poleStart: number;
      poleEnd: number;
      poleStartPrice: number;
      poleEndPrice: number;
      poleHeight: number;
      consStart: number;
      breakoutIndex: number;
      isForming: boolean;
      targetPrice: number;
      upperStartPrice: number;
      upperEndPrice: number;
      lowerStartPrice: number;
      lowerEndPrice: number;
      qualityScore: number;
    }

    // 1. Precise Pivot Detection (Swing Highs & Lows)
    const isPivotHigh = (idx: number, left = 3, right = 2) => {
      if (idx < left || idx >= n - right) return false;
      const h = highPrices[idx];
      for (let i = 1; i <= left; i++) {
        if (highPrices[idx - i] > h) return false;
      }
      for (let i = 1; i <= right; i++) {
        if (highPrices[idx + i] >= h) return false;
      }
      return true;
    };

    const isPivotLow = (idx: number, left = 3, right = 2) => {
      if (idx < left || idx >= n - right) return false;
      const l = lowPrices[idx];
      for (let i = 1; i <= left; i++) {
        if (lowPrices[idx - i] < l) return false;
      }
      for (let i = 1; i <= right; i++) {
        if (lowPrices[idx + i] <= l) return false;
      }
      return true;
    };

    // Helper: Ordinary Least Squares (OLS) Linear Regression for channel boundary fitting
    const calcLinearRegression = (prices: number[], startIndex: number, endIndex: number) => {
      const len = endIndex - startIndex + 1;
      if (len < 2) return { slope: 0, intercept: prices[startIndex] || 0 };
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      for (let j = 0; j < len; j++) {
        const y = prices[startIndex + j];
        sumX += j;
        sumY += y;
        sumXY += j * y;
        sumXX += j * j;
      }
      const denom = len * sumXX - sumX * sumX;
      const slope = Math.abs(denom) > 1e-9 ? (len * sumXY - sumX * sumY) / denom : 0;
      const intercept = (sumY - slope * sumX) / len;
      return { slope, intercept };
    };

    const candidatePatterns: FlagPattern[] = [];

    // Precompute swing pivots
    const pivotHighs: number[] = [];
    const pivotLows: number[] = [];
    for (let i = 2; i < n - 2; i++) {
      if (isPivotHigh(i, 3, 2)) pivotHighs.push(i);
      if (isPivotLow(i, 3, 2)) pivotLows.push(i);
    }

    // ----------------------------------------------------
    // A. BULLISH FLAG EVALUATION
    // ----------------------------------------------------
    if (detectBullish) {
      for (let iL = 0; iL < pivotLows.length; iL++) {
        const pLow = pivotLows[iL];
        // Look for subsequent pivot high within pole range
        for (let iH = 0; iH < pivotHighs.length; iH++) {
          const pHigh = pivotHighs[iH];
          if (pHigh <= pLow) continue;
          const poleBars = pHigh - pLow;
          if (poleBars < poleMinBars || poleBars > poleMaxBars) continue;

          const poleGain = highPrices[pHigh] - lowPrices[pLow];
          const poleAtr = atrValues[pHigh] || (closePrices[pHigh] * 0.005);
          if (poleGain < poleStrengthAtr * poleAtr) continue;

          // Check impulse integrity: highPrices[pHigh] is highest in window, lowPrices[pLow] is lowest
          let isDominant = true;
          for (let b = pLow; b <= pHigh; b++) {
            if (highPrices[b] > highPrices[pHigh] || lowPrices[b] < lowPrices[pLow]) {
              isDominant = false;
              break;
            }
          }
          if (!isDominant) continue;

          // Scan consolidation starting after pHigh
          const consStart = pHigh;
          const maxConsBar = Math.min(n - 1, consStart + flagMaxBars);
          let foundForThisPole = false;

          for (let k = consStart + flagMinBars; k <= maxConsBar; k++) {
            if (foundForThisPole) break;

            const consLows = lowPrices.slice(consStart, k + 1);
            const minConsLow = Math.min(...consLows);
            const maxConsHigh = Math.max(...highPrices.slice(consStart, k + 1));

            // Retracement rules:
            // 1. Must never breach the pole base (origin swing low)
            // 2. Retracement must be between 10% and 52% of the flagpole height
            if (minConsLow <= lowPrices[pLow]) break;
            if (maxConsHigh > highPrices[pHigh] * 1.002) break;

            const retrace = (highPrices[pHigh] - minConsLow) / Math.max(1e-6, poleGain);
            if (retrace < 0.10 || retrace > 0.52) continue;

            // Fit channel lines
            const { slope: slopeH, intercept: interH } = calcLinearRegression(highPrices, consStart, k - 1);
            const { slope: slopeL, intercept: interL } = calcLinearRegression(lowPrices, consStart, k - 1);

            // Channel lines must not cross inverted
            if (interH < interL) continue;

            // In a bull flag, channels should be downward sloping or flat
            if (slopeH > 0.08 * poleAtr || slopeL > 0.08 * poleAtr) continue;

            const upperAtK = interH + slopeH * (k - consStart);
            const lowerAtK = interL + slopeL * (k - consStart);

            // Breakout check
            const isBreakout = closePrices[k] > upperAtK && closePrices[k] > openPrices[k];
            const isForming = k === n - 1 && !isBreakout && closePrices[k] >= lowerAtK && closePrices[k] <= upperAtK * 1.01;

            if (isBreakout || isForming) {
              let patType: 'flag' | 'wedge' | 'pennant' = 'flag';
              let patName = 'Bull Flag';

              if (slopeH < 0 && slopeL > 0) {
                patType = 'pennant';
                patName = 'Bull Pennant';
              } else if (slopeH < 0 && slopeL < 0 && slopeH < slopeL) {
                patType = 'wedge';
                patName = 'Bull Wedge Flag';
              }

              if (patType === 'pennant' && !showPennants) continue;
              if (patType === 'wedge' && !showWedges) continue;
              if (patType === 'flag' && !showFlags) continue;

              const targetPrice = closePrices[k] + poleGain;

              candidatePatterns.push({
                id: `bull-${pLow}-${pHigh}-${k}`,
                isBull: true,
                patternType: patType,
                patternName: isForming ? `${patName} (Forming)` : patName,
                poleStart: pLow,
                poleEnd: pHigh,
                poleStartPrice: lowPrices[pLow],
                poleEndPrice: highPrices[pHigh],
                poleHeight: poleGain,
                consStart: consStart,
                breakoutIndex: k,
                isForming: isForming,
                targetPrice: targetPrice,
                upperStartPrice: interH,
                upperEndPrice: upperAtK,
                lowerStartPrice: interL,
                lowerEndPrice: lowerAtK,
                qualityScore: poleGain / poleAtr
              });

              foundForThisPole = true;
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // B. BEARISH FLAG EVALUATION
    // ----------------------------------------------------
    if (detectBearish) {
      for (let iH = 0; iH < pivotHighs.length; iH++) {
        const pHigh = pivotHighs[iH];
        // Look for subsequent pivot low within pole range
        for (let iL = 0; iL < pivotLows.length; iL++) {
          const pLow = pivotLows[iL];
          if (pLow <= pHigh) continue;
          const poleBars = pLow - pHigh;
          if (poleBars < poleMinBars || poleBars > poleMaxBars) continue;

          const poleDrop = highPrices[pHigh] - lowPrices[pLow];
          const poleAtr = atrValues[pLow] || (closePrices[pLow] * 0.005);
          if (poleDrop < poleStrengthAtr * poleAtr) continue;

          // Check impulse integrity: highPrices[pHigh] is highest, lowPrices[pLow] is lowest
          let isDominant = true;
          for (let b = pHigh; b <= pLow; b++) {
            if (highPrices[b] > highPrices[pHigh] || lowPrices[b] < lowPrices[pLow]) {
              isDominant = false;
              break;
            }
          }
          if (!isDominant) continue;

          // Scan consolidation starting after pLow
          const consStart = pLow;
          const maxConsBar = Math.min(n - 1, consStart + flagMaxBars);
          let foundForThisPole = false;

          for (let k = consStart + flagMinBars; k <= maxConsBar; k++) {
            if (foundForThisPole) break;

            const consHighs = highPrices.slice(consStart, k + 1);
            const maxConsHigh = Math.max(...consHighs);
            const minConsLow = Math.min(...lowPrices.slice(consStart, k + 1));

            // Retracement rules:
            // 1. Must never breach the pole origin (swing high)
            // 2. Retracement must be between 10% and 52% of the flagpole drop
            if (maxConsHigh >= highPrices[pHigh]) break;
            if (minConsLow < lowPrices[pLow] * 0.998) break;

            const retrace = (maxConsHigh - lowPrices[pLow]) / Math.max(1e-6, poleDrop);
            if (retrace < 0.10 || retrace > 0.52) continue;

            // Fit channel lines
            const { slope: slopeH, intercept: interH } = calcLinearRegression(highPrices, consStart, k - 1);
            const { slope: slopeL, intercept: interL } = calcLinearRegression(lowPrices, consStart, k - 1);

            // Channel lines must not cross inverted
            if (interH < interL) continue;

            // In a bear flag, consolidation slopes upward or flat
            if (slopeH < -0.08 * poleAtr || slopeL < -0.08 * poleAtr) continue;

            const upperAtK = interH + slopeH * (k - consStart);
            const lowerAtK = interL + slopeL * (k - consStart);

            // Breakdown check
            const isBreakdown = closePrices[k] < lowerAtK && closePrices[k] < openPrices[k];
            const isForming = k === n - 1 && !isBreakdown && closePrices[k] <= upperAtK && closePrices[k] >= lowerAtK * 0.99;

            if (isBreakdown || isForming) {
              let patType: 'flag' | 'wedge' | 'pennant' = 'flag';
              let patName = 'Bear Flag';

              if (slopeH < 0 && slopeL > 0) {
                patType = 'pennant';
                patName = 'Bear Pennant';
              } else if (slopeH > 0 && slopeL > 0 && slopeL > slopeH) {
                patType = 'wedge';
                patName = 'Bear Wedge Flag';
              }

              if (patType === 'pennant' && !showPennants) continue;
              if (patType === 'wedge' && !showWedges) continue;
              if (patType === 'flag' && !showFlags) continue;

              const targetPrice = closePrices[k] - poleDrop;

              candidatePatterns.push({
                id: `bear-${pHigh}-${pLow}-${k}`,
                isBull: false,
                patternType: patType,
                patternName: isForming ? `${patName} (Forming)` : patName,
                poleStart: pHigh,
                poleEnd: pLow,
                poleStartPrice: highPrices[pHigh],
                poleEndPrice: lowPrices[pLow],
                poleHeight: poleDrop,
                consStart: consStart,
                breakoutIndex: k,
                isForming: isForming,
                targetPrice: targetPrice,
                upperStartPrice: interH,
                upperEndPrice: upperAtK,
                lowerStartPrice: interL,
                lowerEndPrice: lowerAtK,
                qualityScore: poleDrop / poleAtr
              });

              foundForThisPole = true;
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // C. STRICT NON-OVERLAPPING & RECENCY FILTERING
    // ----------------------------------------------------
    // Sort chronologically by breakout index descending, then prioritize higher quality score
    candidatePatterns.sort((a, b) => b.breakoutIndex - a.breakoutIndex || b.qualityScore - a.qualityScore);

    const filteredPatterns: FlagPattern[] = [];
    for (const pat of candidatePatterns) {
      let hasOverlap = false;
      for (const selected of filteredPatterns) {
        const startA = pat.poleStart;
        const endA = pat.breakoutIndex;
        const startB = selected.poleStart;
        const endB = selected.breakoutIndex;

        if (!(endA + 4 < startB || endB + 4 < startA)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        filteredPatterns.push(pat);
        if (filteredPatterns.length >= maxPatterns) break;
      }
    }

    // Reverse to chronological order for rendering
    filteredPatterns.reverse();

    // ----------------------------------------------------
    // D. BUILD VISUAL DRAWING PRIMITIVES (CLEAN & ELEGANT)
    // ----------------------------------------------------
    filteredPatterns.forEach((pat) => {
      const pColor = pat.isBull ? bullColor : bearColor;

      // 1. Flagpole Line (Clean solid vector line with subtle endpoint dots, NO intrusive text)
      if (showFlagpole) {
        output.lines.push({
          id: `pole-${pat.id}`,
          x1: times[pat.poleStart],
          y1: pat.poleStartPrice,
          x2: times[pat.poleEnd],
          y2: pat.poleEndPrice,
          color: pColor,
          width: 2.0,
          style: 'solid',
          label: 'Flagpole'
        });
      }

      // 2. Consolidation Channel Boundary Lines (Clean trendlines with NO text labels)
      if (showChannelLines) {
        output.lines.push({
          id: `upper-${pat.id}`,
          x1: times[pat.consStart],
          y1: pat.upperStartPrice,
          x2: times[pat.breakoutIndex],
          y2: pat.upperEndPrice,
          color: pColor,
          width: 1.5,
          style: 'solid',
          label: ''
        });

        output.lines.push({
          id: `lower-${pat.id}`,
          x1: times[pat.consStart],
          y1: pat.lowerStartPrice,
          x2: times[pat.breakoutIndex],
          y2: pat.lowerEndPrice,
          color: pColor,
          width: 1.5,
          style: 'solid',
          label: ''
        });
      }

      // 3. Measured Move Target Level (Horizontal dashed Take-Profit line with clean right-aligned badge)
      if (showTarget) {
        const targetBars = 12;
        const targetEndIndex = Math.min(n - 1, pat.breakoutIndex + targetBars);
        const targetEndTime = times[targetEndIndex] || (times[pat.breakoutIndex] + 3600 * targetBars);

        // Horizontal target line at the exact Take-Profit price
        output.lines.push({
          id: `target-${pat.id}`,
          x1: times[pat.breakoutIndex],
          y1: pat.targetPrice,
          x2: targetEndTime,
          y2: pat.targetPrice,
          color: targetColor,
          width: 1.5,
          style: 'dashed',
          label: `Target: ${formatPrice(pat.targetPrice)}`
        });

        // Vertical connecting stem from breakout close to the target level
        output.lines.push({
          id: `target-stem-${pat.id}`,
          x1: times[pat.breakoutIndex],
          y1: closePrices[pat.breakoutIndex],
          x2: times[pat.breakoutIndex],
          y2: pat.targetPrice,
          color: targetColor,
          width: 1.0,
          style: 'dotted',
          label: ''
        });
      }

      // 4. Pattern Breakout Badge (Single clean badge placed outside the candle)
      if (showLabels) {
        const currentAtr = atrValues[pat.breakoutIndex] || (closePrices[pat.breakoutIndex] * 0.005);
        const badgeOffset = currentAtr * 0.5;
        const badgeY = pat.isBull
          ? lowPrices[pat.breakoutIndex] - badgeOffset
          : highPrices[pat.breakoutIndex] + badgeOffset;

        output.labels.push({
          id: `lbl-${pat.id}`,
          x: times[pat.breakoutIndex],
          y: badgeY,
          text: pat.isForming ? pat.patternName : `⚑ ${pat.patternName}`,
          color: pColor,
          textcolor: '#ffffff',
          badge: true
        });
      }
    });

    return output;
  }

  // ==========================================
  // 13. MONEY ALGORITHM
  // ==========================================
  if (
    idLower.includes('money_algorithm') ||
    idLower.includes('money algorithm') ||
    idLower.includes('moneyhacks') ||
    (indicator.code && indicator.code.includes('MONEY ALGORITHM'))
  ) {
    const showSignals = params.showSignals !== undefined ? Boolean(params.showSignals) : true;
    const sensitivity = Number(params.sensitivity ?? 2.4);
    const STuner = Math.max(1, Math.min(25, Math.round(Number(params.STuner ?? 15))));
    const Presets = String(params.Presets || 'All Signals');
    const TextStyle = String(params.TextStyle || 'Minimal');
    const consSignalsFilter = Boolean(params.consSignalsFilter);
    const StrongSignalsOnly = Boolean(params.StrongSignalsOnly);
    const highVolSignals = Boolean(params.highVolSignals);
    const ContrarianOnly = Boolean(params.ContrarianOnly);

    const Show_PR = params.Show_PR !== undefined ? Boolean(params.Show_PR) : true;
    const MSTuner = Math.max(2, Math.min(30, Math.round(Number(params.MSTuner ?? 5))));

    const LongTrendAverage = params.LongTrendAverage !== undefined ? Boolean(params.LongTrendAverage) : true;
    const LTAsensitivity = Math.max(10, Math.min(500, Math.round(Number(params.LTAsensitivity ?? 250))));

    const showTrendCloud = params.showTrendCloud !== undefined ? Boolean(params.showTrendCloud) : true;
    const periodTrendCloud = String(params.periodTrendCloud || 'Smooth');

    const showDashboard = params.showDashboard !== undefined ? Boolean(params.showDashboard) : true;
    const locationDashboard = String(params.locationDashboard || 'Bottom Right');
    const sizeDashboard = String(params.sizeDashboard || 'Small');

    const tpLabels = params.tpLabels !== undefined ? Boolean(params.tpLabels) : true;
    const ShowTpSlAreas = Boolean(params.ShowTpSlAreas);
    const ShowTrailingSL = Boolean(params.ShowTrailingSL);

    const useTP1 = params.useTP1 !== undefined ? Boolean(params.useTP1) : true;
    const multTP1 = Number(params.multTP1 ?? 1.0);
    const useTP2 = params.useTP2 !== undefined ? Boolean(params.useTP2) : true;
    const multTP2 = Number(params.multTP2 ?? 2.0);
    const useTP3 = params.useTP3 !== undefined ? Boolean(params.useTP3) : true;
    const multTP3 = Number(params.multTP3 ?? 3.0);

    const ShowSwings = Boolean(params.ShowSwings);
    const periodSwings = Math.max(2, Math.round(Number(params.periodSwings ?? 10)));

    const bullcolor = String(params.bullcolor || '#16e045');
    const bearcolor = String(params.bearcolor || '#e1320f');

    // 1. Trend Tracer (EMA 250 with 8-bar offset trend color)
    if (LongTrendAverage && candles.length >= 15) {
      const ltaLen = Math.min(candles.length - 2, LTAsensitivity);
      const ltaEma = TA.ema(closePrices, ltaLen);
      const tracerSeries: IndicatorSeries[] = [];
      for (let i = 0; i < candles.length; i++) {
        const val = ltaEma[i];
        if (val !== null && !isNaN(val)) {
          const refClose = closePrices[Math.max(0, i - 8)];
          const isBull = refClose > val;
          tracerSeries.push({
            time: times[i],
            value: val,
            color: isBull ? bullcolor : bearcolor,
            label: `Trend Tracer (${ltaLen})`
          });
        }
      }
      if (tracerSeries.length > 0) {
        output.plots.push(tracerSeries);
      }
    }

    // 2. Dynamic Trend Cloud
    if (showTrendCloud && candles.length >= 20) {
      if (periodTrendCloud === 'Smooth') {
        const len1 = Math.min(candles.length - 2, 150);
        const len2 = Math.min(candles.length - 2, 250);
        const ema150 = TA.ema(closePrices, len1);
        const ema250 = TA.ema(closePrices, len2);
        const s1: IndicatorSeries[] = [];
        const s2: IndicatorSeries[] = [];
        for (let i = 0; i < candles.length; i++) {
          const v1 = ema150[i];
          const v2 = ema250[i];
          if (v1 !== null && v2 !== null) {
            const isBull = v1 >= v2;
            s1.push({ time: times[i], value: v1, color: isBull ? 'rgba(22, 224, 69, 0.6)' : 'rgba(225, 50, 15, 0.6)', label: 'Cloud Fast (150)' });
            s2.push({ time: times[i], value: v2, color: isBull ? 'rgba(22, 224, 69, 0.3)' : 'rgba(225, 50, 15, 0.3)', label: 'Cloud Slow (250)' });
          }
        }
        if (s1.length > 0 && s2.length > 0) {
          const idx1 = output.plots.length;
          output.plots.push(s1);
          const idx2 = output.plots.length;
          output.plots.push(s2);
          output.bands.push({
            upperIndex: idx1,
            lowerIndex: idx2,
            color: 'rgba(22, 224, 69, 0.12)'
          });
        }
      } else if (periodTrendCloud === 'Scalping+') {
        const hma55 = TA.hma(closePrices, Math.min(candles.length - 2, 55));
        const sHma: IndicatorSeries[] = [];
        for (let i = 0; i < candles.length; i++) {
          const v = hma55[i];
          if (v !== null) {
            const prev = hma55[Math.max(0, i - 2)] ?? v;
            sHma.push({ time: times[i], value: v, color: v >= prev ? bullcolor : bearcolor, label: 'Cloud HMA (55)' });
          }
        }
        if (sHma.length > 0) output.plots.push(sHma);
      } else {
        // Scalping or Swing Supertrend cloud
        const mult = periodTrendCloud === 'Swing' ? 7 : 4;
        const ohlc4 = candles.map(c => (c.open + c.high + c.low + c.close) / 4);
        const atr10 = TA.atr(highPrices, lowPrices, closePrices, 10);
        const stCloud: IndicatorSeries[] = [];
        let curDir = 1;
        let curUpper = 0;
        let curLower = 0;
        for (let i = 0; i < candles.length; i++) {
          const a = atr10[i] || (highPrices[i] - lowPrices[i]);
          const up = ohlc4[i] + mult * a;
          const dn = ohlc4[i] - mult * a;
          if (i === 0) {
            curUpper = up;
            curLower = dn;
            curDir = 1;
          } else {
            const pClose = ohlc4[i - 1];
            curLower = (dn > curLower || pClose < curLower) ? dn : curLower;
            curUpper = (up < curUpper || pClose > curUpper) ? up : curUpper;
            if (curDir === 1) {
              if (ohlc4[i] < curLower) curDir = -1;
            } else {
              if (ohlc4[i] > curUpper) curDir = 1;
            }
          }
          const stVal = curDir === 1 ? curLower : curUpper;
          stCloud.push({
            time: times[i],
            value: stVal,
            color: curDir === 1 ? 'rgba(22, 224, 69, 0.4)' : 'rgba(225, 50, 15, 0.4)',
            label: `Trend Cloud (${periodTrendCloud})`
          });
        }
        if (stCloud.length > 0) output.plots.push(stCloud);
      }
    }

    // 3. Supertrend Core Engine & Signals
    const atrST = TA.atr(highPrices, lowPrices, closePrices, STuner);
    const stValues: (number | null)[] = new Array(candles.length).fill(null);
    const stDir: number[] = new Array(candles.length).fill(1);
    let curUpper = 0;
    let curLower = 0;
    let curDir = 1;

    for (let i = 0; i < candles.length; i++) {
      const a = atrST[i] || (highPrices[i] - lowPrices[i]);
      const up = closePrices[i] + sensitivity * a;
      const dn = closePrices[i] - sensitivity * a;
      if (i === 0) {
        curUpper = up;
        curLower = dn;
        curDir = 1;
      } else {
        const pClose = closePrices[i - 1];
        curLower = (dn > curLower || pClose < curLower) ? dn : curLower;
        curUpper = (up < curUpper || pClose > curUpper) ? up : curUpper;
        if (curDir === 1) {
          if (closePrices[i] < curLower) curDir = -1;
        } else {
          if (closePrices[i] > curUpper) curDir = 1;
        }
      }
      stDir[i] = curDir;
      stValues[i] = curDir === 1 ? curLower : curUpper;
    }

    // Filters preparation
    const ema200 = TA.ema(closePrices, Math.min(candles.length - 2, 200));
    const ema150 = TA.ema(closePrices, Math.min(candles.length - 2, 150));
    const ema250 = TA.ema(closePrices, Math.min(candles.length - 2, 250));
    const hma55 = TA.hma(closePrices, Math.min(candles.length - 2, 55));
    const rsi14 = TA.rsi(closePrices, 14);

    // ADX calculation for trending filter (consSignalsFilter)
    const trVals = TA.tr(highPrices, lowPrices, closePrices);
    const plusDM: number[] = [0];
    const minusDM: number[] = [0];
    for (let i = 1; i < candles.length; i++) {
      const upMove = highPrices[i] - highPrices[i - 1];
      const downMove = lowPrices[i - 1] - lowPrices[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    const smoothTR = TA.sma(trVals, 14);
    const smoothPlusDM = TA.sma(plusDM, 14);
    const smoothMinusDM = TA.sma(minusDM, 14);
    const adxValues: (number | null)[] = [];
    for (let i = 0; i < candles.length; i++) {
      const str = smoothTR[i];
      const sp = smoothPlusDM[i];
      const sm = smoothMinusDM[i];
      if (str && str > 0 && sp !== null && sm !== null) {
        const plusDI = (sp / str) * 100;
        const minusDI = (sm / str) * 100;
        const dx = (Math.abs(plusDI - minusDI) / Math.max(1e-5, plusDI + minusDI)) * 100;
        adxValues.push(dx);
      } else {
        adxValues.push(null);
      }
    }

    // Volume filter: (ema(volume, 15) - ema(volume, 20)) > 0
    const volEma15 = TA.ema(volumes, 15);
    const volEma20 = TA.ema(volumes, 20);

    let lastSignalIdx = -100;
    let lastSignalType: 'BUY' | 'SELL' | null = null;
    let lastSignalPrice = 0;
    let lastSignalAtr = 0;

    if (showSignals) {
      const startIdx = Math.max(STuner + 2, 20);
      for (let i = startIdx; i < candles.length; i++) {
        const prevDir = stDir[i - 1];
        const curD = stDir[i];
        const bullCross = prevDir === -1 && curD === 1;
        const bearCross = prevDir === 1 && curD === -1;

        if (!bullCross && !bearCross) continue;

        // Confirmation for Strong+
        let isStrongBull = true;
        let isStrongBear = true;
        if (ema200[i] !== null) {
          isStrongBull = closePrices[i] > ema200[i]!;
          isStrongBear = closePrices[i] < ema200[i]!;
        }

        if (Presets === 'Strong+') {
          const e150 = ema150[i];
          const e250 = ema250[i];
          const h = hma55[i];
          const hPrev = hma55[Math.max(0, i - 2)];
          if (bullCross && (e150 === null || e250 === null || e150 <= e250 || h === null || hPrev === null || h <= hPrev)) {
            continue;
          }
          if (bearCross && (e150 === null || e250 === null || e150 >= e250 || h === null || hPrev === null || h >= hPrev)) {
            continue;
          }
        }

        // Apply filters
        if (StrongSignalsOnly) {
          if (bullCross && !isStrongBull) continue;
          if (bearCross && !isStrongBear) continue;
        }
        if (consSignalsFilter) {
          const adx = adxValues[i];
          if (adx === null || adx < 20) continue;
        }
        if (highVolSignals) {
          const v15 = volEma15[i];
          const v20 = volEma20[i];
          if (v15 === null || v20 === null || v15 <= v20) continue;
        }
        if (ContrarianOnly) {
          const rsi = rsi14[i];
          if (bullCross && (rsi === null || rsi > 40)) continue;
          if (bearCross && (rsi === null || rsi < 60)) continue;
        }

        // Minimum spacing
        if (i - lastSignalIdx < 3) continue;

        lastSignalIdx = i;
        const curAtr = atrST[i] || (highPrices[i] - lowPrices[i]);
        lastSignalAtr = curAtr;
        lastSignalPrice = closePrices[i];

        if (bullCross) {
          lastSignalType = 'BUY';
          const badgeText = TextStyle === 'Minimal' ? (isStrongBull ? '▲+' : '▲') : (isStrongBull ? 'Strong Buy' : 'Buy');
          output.signals.push({
            time: times[i],
            type: 'BUY',
            price: lowPrices[i],
            comment: badgeText
          });
          output.labels.push({
            id: `lbl-buy-${i}`,
            x: times[i],
            y: lowPrices[i] - curAtr * 0.45,
            text: badgeText,
            color: bullcolor,
            textcolor: '#000000',
            badge: true
          });
        } else if (bearCross) {
          lastSignalType = 'SELL';
          const badgeText = TextStyle === 'Minimal' ? (isStrongBear ? '▼+' : '▼') : (isStrongBear ? 'Strong Sell' : 'Sell');
          output.signals.push({
            time: times[i],
            type: 'SELL',
            price: highPrices[i],
            comment: badgeText
          });
          output.labels.push({
            id: `lbl-sell-${i}`,
            x: times[i],
            y: highPrices[i] + curAtr * 0.45,
            text: badgeText,
            color: bearcolor,
            textcolor: '#ffffff',
            badge: true
          });
        }
      }
    }

    // 4. WaveTrend PullBack Signals (Show_PR)
    if (Show_PR && candles.length >= 30) {
      const chlLen = Math.max(5, 5 * MSTuner);
      const avgLen = Math.max(10, 10 * MSTuner);
      const esa = TA.ema(closePrices, Math.min(candles.length - 2, chlLen));
      const diffAbs = closePrices.map((c, i) => (esa[i] !== null ? Math.abs(c - esa[i]!) : null));
      const d = TA.ema(diffAbs, Math.min(candles.length - 2, chlLen));
      const ci = closePrices.map((c, i) => {
        const e = esa[i];
        const dv = d[i];
        if (e !== null && dv !== null && dv > 0) {
          return (c - e) / (0.015 * dv);
        }
        return null;
      });
      const wt1 = TA.ema(ci, Math.min(candles.length - 2, avgLen));
      const wt2 = TA.sma(wt1, 3);

      const pbStart = Math.max(chlLen + avgLen + 2, 25);
      let lastPbIdx = -100;
      for (let i = pbStart; i < candles.length; i++) {
        const w1Prev = wt1[i - 1];
        const w1Cur = wt1[i];
        const w2Prev = wt2[i - 1];
        const w2Cur = wt2[i];

        if (w1Prev === null || w1Cur === null || w2Prev === null || w2Cur === null) continue;

        const wtBullCross = w1Prev <= w2Prev && w1Cur > w2Cur;
        const wtBearCross = w1Prev >= w2Prev && w1Cur < w2Cur;

        if (i - lastPbIdx >= 4) {
          const curAtr = atrST[i] || (highPrices[i] - lowPrices[i]);
          if (wtBullCross && w2Cur <= -60) {
            lastPbIdx = i;
            output.labels.push({
              id: `pb-buy-${i}`,
              x: times[i],
              y: lowPrices[i] - curAtr * 0.28,
              text: '● PB',
              color: bullcolor,
              textcolor: '#ffffff',
              badge: true
            });
          } else if (wtBearCross && w2Cur >= 60) {
            lastPbIdx = i;
            output.labels.push({
              id: `pb-sell-${i}`,
              x: times[i],
              y: highPrices[i] + curAtr * 0.28,
              text: '● PB',
              color: bearcolor,
              textcolor: '#ffffff',
              badge: true
            });
          }
        }
      }
    }

    // 5. Dynamic Take Profit Labels (RSI based)
    if (tpLabels && candles.length >= 25 && lastSignalIdx > 0) {
      let lastTpHit = 0;
      for (let i = lastSignalIdx + 1; i < candles.length; i++) {
        const rsiPrev = rsi14[i - 1];
        const rsiCur = rsi14[i];
        if (rsiPrev === null || rsiCur === null) continue;

        const curAtr = atrST[i] || (highPrices[i] - lowPrices[i]);
        if (lastSignalType === 'BUY') {
          if (rsiPrev < 70 && rsiCur >= 70 && lastTpHit < 1) {
            lastTpHit = 1;
            output.labels.push({ id: `tp1-${i}`, x: times[i], y: highPrices[i] + curAtr * 0.25, text: 'TP 1', color: bullcolor, textcolor: '#000000', badge: true });
          } else if (rsiPrev < 75 && rsiCur >= 75 && lastTpHit < 2) {
            lastTpHit = 2;
            output.labels.push({ id: `tp2-${i}`, x: times[i], y: highPrices[i] + curAtr * 0.25, text: 'TP 2', color: bullcolor, textcolor: '#000000', badge: true });
          } else if (rsiPrev < 80 && rsiCur >= 80 && lastTpHit < 3) {
            lastTpHit = 3;
            output.labels.push({ id: `tp3-${i}`, x: times[i], y: highPrices[i] + curAtr * 0.25, text: 'TP 3', color: bullcolor, textcolor: '#000000', badge: true });
          }
        } else if (lastSignalType === 'SELL') {
          if (rsiPrev > 30 && rsiCur <= 30 && lastTpHit < 1) {
            lastTpHit = 1;
            output.labels.push({ id: `tp1-${i}`, x: times[i], y: lowPrices[i] - curAtr * 0.25, text: 'TP 1', color: bearcolor, textcolor: '#ffffff', badge: true });
          } else if (rsiPrev > 25 && rsiCur <= 25 && lastTpHit < 2) {
            lastTpHit = 2;
            output.labels.push({ id: `tp2-${i}`, x: times[i], y: lowPrices[i] - curAtr * 0.25, text: 'TP 2', color: bearcolor, textcolor: '#ffffff', badge: true });
          } else if (rsiPrev > 20 && rsiCur <= 20 && lastTpHit < 3) {
            lastTpHit = 3;
            output.labels.push({ id: `tp3-${i}`, x: times[i], y: lowPrices[i] - curAtr * 0.25, text: 'TP 3', color: bearcolor, textcolor: '#ffffff', badge: true });
          }
        }
      }
    }

    // 6. Risk Management Areas (ShowTpSlAreas)
    if (ShowTpSlAreas && lastSignalPrice > 0 && lastSignalAtr > 0 && lastSignalType) {
      const isBuy = lastSignalType === 'BUY';
      const stopDist = lastSignalAtr * 1.5;
      const stopPrice = isBuy ? lastSignalPrice - stopDist : lastSignalPrice + stopDist;
      const tp1Price = isBuy ? lastSignalPrice + stopDist * multTP1 : lastSignalPrice - stopDist * multTP1;
      const tp2Price = isBuy ? lastSignalPrice + stopDist * multTP2 : lastSignalPrice - stopDist * multTP2;
      const tp3Price = isBuy ? lastSignalPrice + stopDist * multTP3 : lastSignalPrice - stopDist * multTP3;

      const tStart = times[lastSignalIdx];
      const tEnd = times[candles.length - 1];

      // Entry line
      output.lines.push({
        id: 'entry-line',
        x1: tStart,
        y1: lastSignalPrice,
        x2: tEnd,
        y2: lastSignalPrice,
        color: '#f59e0b',
        width: 1.5,
        style: 'dashed',
        label: `Entry ${lastSignalPrice.toFixed(2)}`
      });

      // Stop Loss
      output.lines.push({
        id: 'sl-line',
        x1: tStart,
        y1: stopPrice,
        x2: tEnd,
        y2: stopPrice,
        color: bearcolor,
        width: 2,
        style: 'solid',
        label: `SL ${stopPrice.toFixed(2)}`
      });

      if (useTP1) {
        output.lines.push({
          id: 'tp1-line',
          x1: tStart,
          y1: tp1Price,
          x2: tEnd,
          y2: tp1Price,
          color: bullcolor,
          width: 1.5,
          style: 'dotted',
          label: `TP1 ${tp1Price.toFixed(2)}`
        });
      }
      if (useTP2) {
        output.lines.push({
          id: 'tp2-line',
          x1: tStart,
          y1: tp2Price,
          x2: tEnd,
          y2: tp2Price,
          color: bullcolor,
          width: 1.5,
          style: 'dotted',
          label: `TP2 ${tp2Price.toFixed(2)}`
        });
      }
      if (useTP3) {
        output.lines.push({
          id: 'tp3-line',
          x1: tStart,
          y1: tp3Price,
          x2: tEnd,
          y2: tp3Price,
          color: bullcolor,
          width: 1.5,
          style: 'dotted',
          label: `TP3 ${tp3Price.toFixed(2)}`
        });
      }
    }

    // 7. Trailing Stop Loss Line
    if (ShowTrailingSL && candles.length >= 20) {
      const trailSeries: IndicatorSeries[] = [];
      let trailStop = closePrices[0];
      for (let i = 0; i < candles.length; i++) {
        const curAtr = atrST[i] || (highPrices[i] - lowPrices[i]);
        const isUp = stDir[i] === 1;
        if (isUp) {
          trailStop = Math.max(trailStop, closePrices[i] - curAtr * 1.8);
        } else {
          trailStop = Math.min(trailStop, closePrices[i] + curAtr * 1.8);
        }
        trailSeries.push({
          time: times[i],
          value: trailStop,
          color: isUp ? bullcolor : bearcolor,
          label: 'Trailing SL'
        });
      }
      if (trailSeries.length > 0) output.plots.push(trailSeries);
    }

    // 8. Market Structure Swings (ShowSwings)
    if (ShowSwings && candles.length >= periodSwings * 2 + 1) {
      const p = periodSwings;
      let lastHighVal = 0;
      let lastLowVal = Infinity;
      for (let i = p; i < candles.length - p; i++) {
        const h = highPrices[i];
        const l = lowPrices[i];
        let isPivotHigh = true;
        let isPivotLow = true;
        for (let j = 1; j <= p; j++) {
          if (highPrices[i - j] >= h || highPrices[i + j] > h) isPivotHigh = false;
          if (lowPrices[i - j] <= l || lowPrices[i + j] < l) isPivotLow = false;
        }
        if (isPivotHigh) {
          const isHH = h > lastHighVal;
          lastHighVal = h;
          output.labels.push({
            id: `sh-${i}`,
            x: times[i],
            y: h + (highPrices[i] - lowPrices[i]) * 0.2,
            text: isHH ? 'HH' : 'LH',
            color: '#3b82f6',
            textcolor: '#ffffff',
            badge: true
          });
        }
        if (isPivotLow) {
          const isLL = l < lastLowVal;
          lastLowVal = l;
          output.labels.push({
            id: `sl-${i}`,
            x: times[i],
            y: l - (highPrices[i] - lowPrices[i]) * 0.2,
            text: isLL ? 'LL' : 'HL',
            color: '#f59e0b',
            textcolor: '#ffffff',
            badge: true
          });
        }
      }
    }

    // 9. Smart Panel Dashboard
    if (showDashboard && candles.length >= 10) {
      const lastClose = closePrices[candles.length - 1];
      const lastIdx = candles.length - 1;

      // Multi-timeframe trend calculations (simulated using multiple period EMAs)
      const m5Bull = lastClose >= (TA.ema(closePrices, Math.min(lastIdx, 20))[lastIdx] || lastClose);
      const m15Bull = lastClose >= (TA.ema(closePrices, Math.min(lastIdx, 50))[lastIdx] || lastClose);
      const m30Bull = lastClose >= (TA.ema(closePrices, Math.min(lastIdx, 100))[lastIdx] || lastClose);
      const h1Bull = lastClose >= (TA.ema(closePrices, Math.min(lastIdx, 150))[lastIdx] || lastClose);
      const h4Bull = lastClose >= (TA.ema(closePrices, Math.min(lastIdx, 200))[lastIdx] || lastClose);

      // Market State: Trending vs Ranging using ADX / DMI
      const lastAdx = adxValues[lastIdx] ?? 22;
      const trendText = lastAdx > 25 ? 'Trending' : lastAdx < 18 ? 'No trend' : 'Ranging';

      // Volatility %
      const lastAtr = atrST[lastIdx] || (highPrices[lastIdx] - lowPrices[lastIdx]);
      const calcDev = (lastAtr / Math.max(1e-5, lastClose)) * 100;
      const volatilityPct = Math.min(99.9, Math.max(1.0, 40 * calcDev + 28));

      // Institutional Activity (Volume surge check)
      const lastVol = volumes[lastIdx] || 1000;
      const avgVol = volEma20[lastIdx] || 1000;
      const instActivity = lastVol >= avgVol * 1.08 ? 'Active' : 'Inactive';

      // Current Session (UTC)
      const nowUtcHours = new Date().getUTCHours();
      let sessionText = 'London';
      const isSydney = nowUtcHours >= 21 || nowUtcHours < 6;
      const isTokyo = nowUtcHours >= 0 && nowUtcHours < 9;
      const isLondon = nowUtcHours >= 7 && nowUtcHours < 16;
      const isNewYork = nowUtcHours >= 13 && nowUtcHours < 22;

      if (isLondon && isNewYork) sessionText = 'London/New York';
      else if (isTokyo && isLondon) sessionText = 'Tokyo/London';
      else if (isSydney && isTokyo) sessionText = 'Sydney/Tokyo';
      else if (isNewYork) sessionText = 'New York';
      else if (isLondon) sessionText = 'London';
      else if (isTokyo) sessionText = 'Tokyo';
      else if (isSydney) sessionText = 'Sydney';

      // Trend Pressure
      const ema9 = TA.ema(closePrices, Math.min(lastIdx, 9));
      const curEma9 = ema9[lastIdx] || lastClose;
      const prevEma9 = ema9[Math.max(0, lastIdx - 2)] || curEma9;
      const trendPressure = curEma9 > prevEma9 ? 'Bullish' : curEma9 < prevEma9 ? 'Bearish' : 'Flat';

      // Map position string
      let posKey: any = 'bottom_right';
      const locLower = locationDashboard.toLowerCase();
      if (locLower.includes('top') && locLower.includes('right')) posKey = 'top_right';
      else if (locLower.includes('top') && locLower.includes('left')) posKey = 'top_left';
      else if (locLower.includes('bottom') && locLower.includes('left')) posKey = 'bottom_left';
      else if (locLower.includes('top') && locLower.includes('center')) posKey = 'top_center';
      else if (locLower.includes('bottom') && locLower.includes('center')) posKey = 'bottom_center';
      else if (locLower.includes('middle') && locLower.includes('right')) posKey = 'middle_right';
      else if (locLower.includes('middle') && locLower.includes('center')) posKey = 'middle_center';

      output.tables = [
        {
          id: 'money_algorithm_panel',
          title: 'MONEY ALGORITHM STRATEGY',
          position: posKey,
          size: (sizeDashboard.toLowerCase() as any) || 'small',
          rows: [
            [
              { text: 'MTF', bold: true, align: 'center', color: '#94a3b8' },
              { text: 'MONEY ALGORITHM STRATEGY', bold: true, align: 'left', color: '#38bdf8' },
              { text: '', align: 'right' }
            ],
            [
              { text: 'M5', bold: true, align: 'center', bgColor: m5Bull ? '#16e045' : '#e1320f', color: '#ffffff' },
              { text: '🔥 Market State', align: 'left', color: '#cbd5e1' },
              { text: trendText, bold: true, align: 'right', color: trendText === 'Trending' ? '#16e045' : '#f59e0b' }
            ],
            [
              { text: 'M15', bold: true, align: 'center', bgColor: m15Bull ? '#16e045' : '#e1320f', color: '#ffffff' },
              { text: '⚠️ Volatility', align: 'left', color: '#cbd5e1' },
              { text: `${volatilityPct.toFixed(1)}%`, bold: true, align: 'right', color: '#38bdf8' }
            ],
            [
              { text: 'M30', bold: true, align: 'center', bgColor: m30Bull ? '#16e045' : '#e1320f', color: '#ffffff' },
              { text: '🏦 Institutional Activity', align: 'left', color: '#cbd5e1' },
              { text: instActivity, bold: true, align: 'right', color: instActivity === 'Active' ? '#16e045' : '#94a3b8' }
            ],
            [
              { text: '1H', bold: true, align: 'center', bgColor: h1Bull ? '#16e045' : '#e1320f', color: '#ffffff' },
              { text: '🕒 Current Session (UTC)', align: 'left', color: '#cbd5e1' },
              { text: sessionText, bold: true, align: 'right', color: '#fbbf24' }
            ],
            [
              { text: '4H', bold: true, align: 'center', bgColor: h4Bull ? '#16e045' : '#e1320f', color: '#ffffff' },
              { text: '🌊 Trend Pressure', align: 'left', color: '#cbd5e1' },
              { text: trendPressure, bold: true, align: 'right', color: trendPressure === 'Bullish' ? '#16e045' : (trendPressure === 'Bearish' ? '#e1320f' : '#94a3b8') }
            ]
          ]
        }
      ];
    }

    return output;
  }

  // ==========================================
  // 14. LINEAR REGRESSION CANDLES WITH OB AND TARGET
  // ==========================================
  if (
    idLower.includes('linreg_candles') ||
    idLower.includes('linear regression candles') ||
    idLower.includes('lin reg candles') ||
    (idLower.includes('linear') && idLower.includes('target') && idLower.includes('ob')) ||
    (indicator.code && indicator.code.includes('Linear Regression Candles with OB and Target'))
  ) {
    const isDark = (params.colors || 'BRIGHT') === 'DARK';
    const bullCol = isDark ? '#ffffff' : '#26a69a';
    const bearCol = isDark ? '#2962ff' : '#ef5350';

    const periods = Math.max(1, Math.min(20, Math.round(Number(params.periods ?? 5))));
    const threshold = Math.max(0, Number(params.threshold ?? 0.0));
    const useWicks = Boolean(params.usewicks);
    const showBull = params.showbull !== undefined ? Boolean(params.showbull) : true;
    const showBear = params.showbear !== undefined ? Boolean(params.showbear) : true;
    const infoPan = Boolean(params.info_pan);

    const linRegEnabled = params.lin_reg !== undefined ? Boolean(params.lin_reg) : true;
    const linregLength = Math.max(2, Math.min(200, Math.round(Number(params.linreg_length ?? 11))));
    const signalLength = Math.max(1, Math.min(200, Math.round(Number(params.signal_length ?? 7))));
    const smaSignal = params.sma_signal !== undefined ? Boolean(params.sma_signal) : true;

    const showHull = params.show_hull !== undefined ? Boolean(params.show_hull) : true;
    const hullLength = Math.max(5, Math.min(300, Math.round(Number(params.hull_length ?? 55))));
    const hullMode = String(params.hull_mode || 'Hma');

    const showABCD = params.show_abcd !== undefined ? Boolean(params.show_abcd) : true;
    const abcdLen = Math.max(2, Math.min(20, Math.round(Number(params.abcd_len ?? 5))));

    const showTargets = params.show_targets !== undefined ? Boolean(params.show_targets) : true;
    const distTarget1 = Number(params.distTarget1 ?? 3.0);
    const distTarget2 = Number(params.distTarget2 ?? 3.0);

    const showMsbOb = params.show_msb_ob !== undefined ? Boolean(params.show_msb_ob) : true;
    const zigzagLen = Math.max(3, Math.min(50, Math.round(Number(params.zigzag_len ?? 9))));
    const fibFactor = 0.273;

    const showTrendlines = params.show_trendlines !== undefined ? Boolean(params.show_trendlines) : true;
    const showGann = params.show_gann !== undefined ? Boolean(params.show_gann) : true;
    const showSupplyDemand = params.show_supply_demand !== undefined ? Boolean(params.show_supply_demand) : true;

    // --- 1. Linear Regression Calculation ---
    const calcLinReg = (arr: number[], len: number, idx: number): number => {
      if (idx < len - 1) return arr[idx];
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let k = 0; k < len; k++) {
        const x = k + 1;
        const y = arr[idx - len + 1 + k];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
      const denom = len * sumX2 - sumX * sumX;
      if (denom === 0) return arr[idx];
      const slope = (len * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / len;
      return intercept + slope * len;
    };

    const bClose: number[] = [];
    const bOpen: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (linRegEnabled) {
        bClose.push(calcLinReg(closePrices, linregLength, i));
        bOpen.push(calcLinReg(openPrices, linregLength, i));
      } else {
        bClose.push(closePrices[i]);
        bOpen.push(openPrices[i]);
      }
    }

    // Signal Line calculation (SMA or EMA of bClose)
    const signalVals = smaSignal ? TA.sma(bClose, signalLength) : TA.ema(bClose, signalLength);
    const signalSeries: IndicatorSeries[] = [];
    for (let i = 0; i < candles.length; i++) {
      const v = signalVals[i];
      if (v !== null && !isNaN(v)) {
        signalSeries.push({
          time: times[i],
          value: v,
          color: '#2962ff',
          label: 'LinReg Signal'
        });
      }
    }
    output.plots.push(signalSeries);

    // --- 2. Hull Suite Trend Ribbon ---
    if (showHull && candles.length >= 10) {
      let hullSeriesArr: (number | null)[];
      if (hullMode === 'Ehma') {
        const emaHalf = TA.ema(closePrices, Math.max(1, Math.round(hullLength / 2)));
        const emaFull = TA.ema(closePrices, hullLength);
        const diff = closePrices.map((_, idx) => {
          const h = emaHalf[idx];
          const f = emaFull[idx];
          return (h !== null && f !== null) ? 2 * h - f : null;
        });
        hullSeriesArr = TA.ema(diff, Math.max(1, Math.round(Math.sqrt(hullLength))));
      } else if (hullMode === 'Thma') {
        const wmaThird = TA.wma(closePrices, Math.max(1, Math.round(hullLength / 3)));
        const wmaHalf = TA.wma(closePrices, Math.max(1, Math.round(hullLength / 2)));
        const wmaFull = TA.wma(closePrices, hullLength);
        const diff = closePrices.map((_, idx) => {
          const t = wmaThird[idx];
          const h = wmaHalf[idx];
          const f = wmaFull[idx];
          return (t !== null && h !== null && f !== null) ? 3 * t - h - f : null;
        });
        hullSeriesArr = TA.wma(diff, hullLength);
      } else {
        hullSeriesArr = TA.hma(closePrices, hullLength);
      }

      const mHullSeries: IndicatorSeries[] = [];
      const sHullSeries: IndicatorSeries[] = [];

      for (let i = 0; i < candles.length; i++) {
        const mVal = hullSeriesArr[i];
        const sVal = i >= 2 ? hullSeriesArr[i - 2] : mVal;

        if (mVal !== null && sVal !== null && !isNaN(mVal) && !isNaN(sVal)) {
          const isUp = mVal >= sVal;
          const col = isUp ? 'rgba(0, 230, 118, 0.75)' : 'rgba(255, 23, 68, 0.75)';

          mHullSeries.push({
            time: times[i],
            value: mVal,
            color: col,
            label: 'MHULL'
          });

          sHullSeries.push({
            time: times[i],
            value: sVal,
            color: col,
            label: 'SHULL'
          });
        }
      }

      const mIdx = output.plots.length;
      output.plots.push(mHullSeries);
      const sIdx = output.plots.length;
      output.plots.push(sHullSeries);

      // Create flowing ribbon band
      output.bands.push({
        upperIndex: mIdx,
        lowerIndex: sIdx,
        color: 'rgba(0, 230, 118, 0.25)'
      });
    }

    // --- 3. Order Block (OB) Identification & Channel Levels ---
    const obPeriod = periods + 1;
    let latestBullHigh = 0;
    let latestBullAvg = 0;
    let latestBullLow = 0;
    let latestBearHigh = 0;
    let latestBearAvg = 0;
    let latestBearLow = 0;

    for (let i = obPeriod; i < candles.length; i++) {
      const obIdx = i - obPeriod;
      const obClose = closePrices[obIdx];
      const obOpen = openPrices[obIdx];
      const obHigh = highPrices[obIdx];
      const obLow = lowPrices[obIdx];

      const absMove = (Math.abs(obClose - closePrices[i - 1]) / obClose) * 100;
      const relMove = absMove >= threshold;

      // Bullish OB: Red candle followed by N consecutive Green candles
      const isBullishOBCandle = obClose < obOpen;
      let upCandlesCount = 0;
      for (let k = 1; k <= periods; k++) {
        if (closePrices[i - k] > openPrices[i - k]) {
          upCandlesCount++;
        }
      }

      if (isBullishOBCandle && upCandlesCount === periods && relMove && showBull) {
        const highLimit = useWicks ? obHigh : obOpen;
        const lowLimit = obLow;
        const avgLimit = (highLimit + lowLimit) / 2;

        latestBullHigh = highLimit;
        latestBullAvg = avgLimit;
        latestBullLow = lowLimit;

        const obTime = times[obIdx];
        const rightEdgeTime = times[Math.min(times.length - 1, i + 16)];

        // Signal & Marker
        output.signals.push({
          time: obTime,
          type: 'BUY',
          price: lowLimit,
          comment: 'Bullish OB'
        });

        output.labels.push({
          id: `lbl-bull-ob-${obTime}-${i}`,
          x: obTime,
          y: lowLimit - (highPrices[obIdx] - lowPrices[obIdx]) * 0.4,
          text: 'Bullish OB',
          color: 'rgba(38, 166, 154, 0.25)',
          textcolor: bullCol,
          badge: true
        });

        // Channel Box
        output.boxes.push({
          id: `box-bull-ob-${obTime}-${i}`,
          x1: obTime,
          y1: highLimit,
          x2: rightEdgeTime,
          y2: lowLimit,
          color: toRgba(bullCol, 0.18, 'rgba(38, 166, 154, 0.18)'),
          bordercolor: bullCol,
          borderstyle: 'dashed',
          label: 'Bullish OB'
        });

        // Center Average Line
        output.lines.push({
          id: `line-bull-ob-avg-${obTime}-${i}`,
          x1: obTime,
          y1: avgLimit,
          x2: rightEdgeTime,
          y2: avgLimit,
          color: bullCol,
          width: 1,
          style: 'solid',
          label: 'OB Avg'
        });
      }

      // Bearish OB: Green candle followed by N consecutive Red candles
      const isBearishOBCandle = obClose > obOpen;
      let downCandlesCount = 0;
      for (let k = 1; k <= periods; k++) {
        if (closePrices[i - k] < openPrices[i - k]) {
          downCandlesCount++;
        }
      }

      if (isBearishOBCandle && downCandlesCount === periods && relMove && showBear) {
        const highLimit = obHigh;
        const lowLimit = useWicks ? obLow : obOpen;
        const avgLimit = (highLimit + lowLimit) / 2;

        latestBearHigh = highLimit;
        latestBearAvg = avgLimit;
        latestBearLow = lowLimit;

        const obTime = times[obIdx];
        const rightEdgeTime = times[Math.min(times.length - 1, i + 16)];

        // Signal & Marker
        output.signals.push({
          time: obTime,
          type: 'SELL',
          price: highLimit,
          comment: 'Bearish OB'
        });

        output.labels.push({
          id: `lbl-bear-ob-${obTime}-${i}`,
          x: obTime,
          y: highLimit + (highPrices[obIdx] - lowPrices[obIdx]) * 0.4,
          text: 'Bearish OB',
          color: 'rgba(239, 83, 80, 0.25)',
          textcolor: bearCol,
          badge: true
        });

        // Channel Box
        output.boxes.push({
          id: `box-bear-ob-${obTime}-${i}`,
          x1: obTime,
          y1: highLimit,
          x2: rightEdgeTime,
          y2: lowLimit,
          color: toRgba(bearCol, 0.18, 'rgba(239, 83, 80, 0.18)'),
          bordercolor: bearCol,
          borderstyle: 'dashed',
          label: 'Bearish OB'
        });

        // Center Average Line
        output.lines.push({
          id: `line-bear-ob-avg-${obTime}-${i}`,
          x1: obTime,
          y1: avgLimit,
          x2: rightEdgeTime,
          y2: avgLimit,
          color: bearCol,
          width: 1,
          style: 'solid',
          label: 'OB Avg'
        });
      }
    }

    // --- 4. Market Structure Break (MSB) & Breaker / Mitigation Blocks ---
    if (showMsbOb && candles.length >= 20) {
      interface SwingPoint {
        idx: number;
        val: number;
        isHigh: boolean;
        time: number;
      }

      const swings: SwingPoint[] = [];
      const zHalf = Math.max(2, Math.floor(zigzagLen / 2));

      for (let i = zHalf; i < candles.length - zHalf; i++) {
        let isPivotHigh = true;
        let isPivotLow = true;

        for (let k = -zHalf; k <= zHalf; k++) {
          if (k === 0) continue;
          if (highPrices[i + k] >= highPrices[i]) isPivotHigh = false;
          if (lowPrices[i + k] <= lowPrices[i]) isPivotLow = false;
        }

        if (isPivotHigh) {
          swings.push({ idx: i, val: highPrices[i], isHigh: true, time: times[i] });
        } else if (isPivotLow) {
          swings.push({ idx: i, val: lowPrices[i], isHigh: false, time: times[i] });
        }
      }

      // Check MSB and build Order / Breaker / Mitigation boxes
      let lastMarketDir = 0;
      for (let s = 2; s < swings.length; s++) {
        const prev1 = swings[s - 1];
        const prev2 = swings[s - 2];
        const cur = swings[s];

        // Bullish MSB: Break above previous Swing High
        if (cur.isHigh && prev2.isHigh && cur.val > prev2.val + Math.abs(prev2.val - prev1.val) * fibFactor) {
          if (lastMarketDir !== 1) {
            lastMarketDir = 1;
            const msbTime = times[cur.idx];
            const msbPrice = prev2.val;

            // MSB Line
            output.lines.push({
              id: `msb-line-bull-${msbTime}`,
              x1: prev2.time,
              y1: msbPrice,
              x2: msbTime,
              y2: msbPrice,
              color: '#26a69a',
              width: 1.5,
              style: 'dashed',
              label: 'MSB'
            });

            output.labels.push({
              id: `msb-lbl-bull-${msbTime}`,
              x: Math.round((prev2.time + msbTime) / 2),
              y: msbPrice,
              text: 'MSB',
              color: 'rgba(38, 166, 154, 0.25)',
              textcolor: '#26a69a',
              badge: true
            });

            // Find origin OB candle in retracement leg
            let buObIdx = prev1.idx;
            for (let b = prev2.idx; b <= prev1.idx; b++) {
              if (openPrices[b] > closePrices[b]) {
                buObIdx = b;
                break;
              }
            }

            const boxEnd = times[Math.min(times.length - 1, cur.idx + 25)];
            output.boxes.push({
              id: `box-bu-ob-${times[buObIdx]}`,
              x1: times[buObIdx],
              y1: highPrices[buObIdx],
              x2: boxEnd,
              y2: lowPrices[buObIdx],
              color: 'rgba(38, 166, 154, 0.2)',
              bordercolor: '#26a69a',
              label: 'Bu-OB',
              borderstyle: 'solid'
            });

            // Breaker / Mitigation Box
            output.boxes.push({
              id: `box-bu-bb-${times[prev1.idx]}`,
              x1: prev1.time,
              y1: highPrices[prev1.idx],
              x2: boxEnd,
              y2: lowPrices[prev1.idx],
              color: 'rgba(38, 166, 154, 0.12)',
              bordercolor: '#26a69a',
              label: prev1.val < (swings[s - 3]?.val || 0) ? 'Bu-BB' : 'Bu-MB',
              borderstyle: 'dotted'
            });
          }
        }
        // Bearish MSB: Break below previous Swing Low
        else if (!cur.isHigh && !prev2.isHigh && cur.val < prev2.val - Math.abs(prev1.val - prev2.val) * fibFactor) {
          if (lastMarketDir !== -1) {
            lastMarketDir = -1;
            const msbTime = times[cur.idx];
            const msbPrice = prev2.val;

            // MSB Line
            output.lines.push({
              id: `msb-line-bear-${msbTime}`,
              x1: prev2.time,
              y1: msbPrice,
              x2: msbTime,
              y2: msbPrice,
              color: '#ef5350',
              width: 1.5,
              style: 'dashed',
              label: 'MSB'
            });

            output.labels.push({
              id: `msb-lbl-bear-${msbTime}`,
              x: Math.round((prev2.time + msbTime) / 2),
              y: msbPrice,
              text: 'MSB',
              color: 'rgba(239, 83, 80, 0.25)',
              textcolor: '#ef5350',
              badge: true
            });

            // Find origin OB candle in pull leg
            let beObIdx = prev1.idx;
            for (let b = prev2.idx; b <= prev1.idx; b++) {
              if (openPrices[b] < closePrices[b]) {
                beObIdx = b;
                break;
              }
            }

            const boxEnd = times[Math.min(times.length - 1, cur.idx + 25)];
            output.boxes.push({
              id: `box-be-ob-${times[beObIdx]}`,
              x1: times[beObIdx],
              y1: highPrices[beObIdx],
              x2: boxEnd,
              y2: lowPrices[beObIdx],
              color: 'rgba(239, 83, 80, 0.2)',
              bordercolor: '#ef5350',
              label: 'Be-OB',
              borderstyle: 'solid'
            });

            // Breaker / Mitigation Box
            output.boxes.push({
              id: `box-be-bb-${times[prev1.idx]}`,
              x1: prev1.time,
              y1: highPrices[prev1.idx],
              x2: boxEnd,
              y2: lowPrices[prev1.idx],
              color: 'rgba(239, 83, 80, 0.12)',
              bordercolor: '#ef5350',
              label: prev1.val > (swings[s - 3]?.val || 0) ? 'Be-BB' : 'Be-MB',
              borderstyle: 'dotted'
            });
          }
        }
      }
    }

    // --- 5. Harmonic AB=CD Patterns ---
    if (showABCD && candles.length >= 25) {
      const pivots: { idx: number; val: number; isHigh: boolean }[] = [];
      const halfAbcd = Math.max(2, Math.floor(abcdLen / 2));

      for (let i = halfAbcd; i < candles.length - halfAbcd; i++) {
        let isHigh = true;
        let isLow = true;
        for (let k = -halfAbcd; k <= halfAbcd; k++) {
          if (k === 0) continue;
          if (highPrices[i + k] >= highPrices[i]) isHigh = false;
          if (lowPrices[i + k] <= lowPrices[i]) isLow = false;
        }
        if (isHigh) pivots.push({ idx: i, val: highPrices[i], isHigh: true });
        else if (isLow) pivots.push({ idx: i, val: lowPrices[i], isHigh: false });
      }

      for (let p = 2; p < pivots.length; p++) {
        const pA = pivots[p - 2];
        const pB = pivots[p - 1];
        const pC = pivots[p];

        const av = pA.val;
        const bv = pB.val;
        const cv = pC.val;

        // Bullish AB=CD pattern
        const abcdBull = av > bv && (cv - bv) <= (0.89 * (av - bv)) && (cv - bv) >= (0.38 * (av - bv));
        if (abcdBull) {
          const evalIdx = Math.min(candles.length - 1, pC.idx + 3);
          if ((cv - lowPrices[evalIdx]) >= (av - bv) * 0.85) {
            output.labels.push({
              id: `lbl-abcd-bull-${times[pC.idx]}`,
              x: times[pC.idx],
              y: lowPrices[pC.idx] - (highPrices[pC.idx] - lowPrices[pC.idx]) * 0.5,
              text: 'Bullish AB=CD',
              color: 'rgba(76, 175, 79, 0.25)',
              textcolor: '#4caf50',
              badge: true
            });
          }
        }

        // Bearish AB=CD pattern
        const abcdBear = av < bv && (bv - cv) <= (0.89 * (bv - av)) && (bv - cv) >= (0.38 * (bv - av));
        if (abcdBear) {
          const evalIdx = Math.min(candles.length - 1, pC.idx + 3);
          if ((highPrices[evalIdx] - cv) >= (bv - av) * 0.85) {
            output.labels.push({
              id: `lbl-abcd-bear-${times[pC.idx]}`,
              x: times[pC.idx],
              y: highPrices[pC.idx] + (highPrices[pC.idx] - lowPrices[pC.idx]) * 0.5,
              text: 'Bearish AB=CD',
              color: 'rgba(255, 82, 82, 0.25)',
              textcolor: '#ff5252',
              badge: true
            });
          }
        }
      }
    }

    // --- 6. Dynamic Targets (Target 1 & Target 2) ---
    if (showTargets && candles.length >= 20) {
      const atr50 = TA.atr(highPrices, lowPrices, closePrices, Math.min(candles.length - 2, 50));
      const atr10 = TA.atr(highPrices, lowPrices, closePrices, 10);
      
      const stValues: number[] = [];
      const stDir: number[] = [];
      let curUpper = 0;
      let curLower = 0;
      let curDir = 1;

      for (let i = 0; i < candles.length; i++) {
        const a = atr10[i] || (highPrices[i] - lowPrices[i]);
        const up = closePrices[i] + 3.0 * a;
        const dn = closePrices[i] - 3.0 * a;
        if (i === 0) {
          curUpper = up;
          curLower = dn;
          curDir = 1;
        } else {
          const pClose = closePrices[i - 1];
          curLower = (dn > curLower || pClose < curLower) ? dn : curLower;
          curUpper = (up < curUpper || pClose > curUpper) ? up : curUpper;
          if (curDir === 1) {
            if (closePrices[i] < curLower) curDir = -1;
          } else {
            if (closePrices[i] > curUpper) curDir = 1;
          }
        }
        stDir[i] = curDir;
        stValues[i] = curDir === 1 ? curLower : curUpper;
      }

      let target1Active = false;
      let target1Val = 0;
      let target1StartIdx = 0;

      let target2Active = false;
      let target2Val = 0;
      let target2StartIdx = 0;

      for (let i = 15; i < candles.length; i++) {
        const curClose = closePrices[i];
        const curAtr = atr50[i] || (curClose * 0.008);
        const st = stValues[i];
        const prevSt = stValues[i - 1];

        // Bullish Target Trigger (Supertrend Flip Up or Signal cross)
        if (st && prevSt && curClose > st && closePrices[i - 1] <= prevSt && !target1Active) {
          target1Active = true;
          target1StartIdx = i;
          target1Val = curClose + curAtr * distTarget1;

          output.labels.push({
            id: `target1-lbl-${times[i]}`,
            x: times[i],
            y: target1Val,
            text: 'Target',
            color: 'rgba(8, 153, 129, 0.35)',
            textcolor: '#089981',
            badge: true
          });
        }

        // Check if Target 1 reached
        if (target1Active) {
          if (highPrices[i] >= target1Val || i === candles.length - 1) {
            output.lines.push({
              id: `target1-line-${times[target1StartIdx]}`,
              x1: times[target1StartIdx],
              y1: target1Val,
              x2: times[i],
              y2: target1Val,
              color: '#089981',
              width: 1.5,
              style: 'dotted',
              label: 'Target'
            });
            target1Active = false;
          }
        }

        // Bearish Target Trigger (Supertrend Flip Down)
        if (st && prevSt && curClose < st && closePrices[i - 1] >= prevSt && !target2Active) {
          target2Active = true;
          target2StartIdx = i;
          target2Val = curClose - curAtr * distTarget2;

          output.labels.push({
            id: `target2-lbl-${times[i]}`,
            x: times[i],
            y: target2Val,
            text: 'Target',
            color: 'rgba(242, 54, 70, 0.35)',
            textcolor: '#f23646',
            badge: true
          });
        }

        // Check if Target 2 reached
        if (target2Active) {
          if (lowPrices[i] <= target2Val || i === candles.length - 1) {
            output.lines.push({
              id: `target2-line-${times[target2StartIdx]}`,
              x1: times[target2StartIdx],
              y1: target2Val,
              x2: times[i],
              y2: target2Val,
              color: '#f23646',
              width: 1.5,
              style: 'dotted',
              label: 'Target'
            });
            target2Active = false;
          }
        }
      }
    }

    // --- 7. Zig Zag Trendlines & Support/Resistance Channels ---
    if (showTrendlines && candles.length >= 30) {
      const pLen = 20;
      const tVal: number[] = [];
      const tPos: number[] = [];
      const bVal: number[] = [];
      const bPos: number[] = [];

      for (let i = pLen; i < candles.length - pLen; i++) {
        let isHigh = true;
        let isLow = true;
        for (let k = 1; k <= pLen; k++) {
          if (highPrices[i - k] >= highPrices[i] || highPrices[i + k] > highPrices[i]) isHigh = false;
          if (lowPrices[i - k] <= lowPrices[i] || lowPrices[i + k] < lowPrices[i]) isLow = false;
        }
        if (isHigh) {
          tVal.push(highPrices[i]);
          tPos.push(i);
        }
        if (isLow) {
          bVal.push(lowPrices[i]);
          bPos.push(i);
        }
      }

      // Uptrend support lines
      if (bPos.length >= 2) {
        const p1 = bPos.length - 1;
        const p2 = bPos.length - 2;
        const x1 = times[bPos[p2]];
        const y1 = bVal[p2];
        const x2 = times[bPos[p1]];
        const y2 = bVal[p1];
        if (y2 >= y1) {
          output.lines.push({
            id: `trendline-up-${x1}`,
            x1,
            y1,
            x2,
            y2,
            color: '#00e676',
            width: 1.5,
            style: 'solid',
            label: 'Support Trend'
          });
        }
      }

      // Downtrend resistance lines
      if (tPos.length >= 2) {
        const p1 = tPos.length - 1;
        const p2 = tPos.length - 2;
        const x1 = times[tPos[p2]];
        const y1 = tVal[p2];
        const x2 = times[tPos[p1]];
        const y2 = tVal[p1];
        if (y2 <= y1) {
          output.lines.push({
            id: `trendline-dn-${x1}`,
            x1,
            y1,
            x2,
            y2,
            color: '#ef5350',
            width: 1.5,
            style: 'solid',
            label: 'Resistance Trend'
          });
        }
      }
    }

    // --- 8. Gann Square of 9 Levels ---
    if (showGann && candles.length >= 10) {
      const curPrice = closePrices[closePrices.length - 1];
      let denominator = 1;
      if (curPrice >= 10000) denominator = 0.01;
      else if (curPrice >= 1000) denominator = 0.1;
      else if (curPrice >= 100) denominator = 1;
      else if (curPrice >= 10) denominator = 10;
      else if (curPrice >= 0.05) denominator = 100;
      else denominator = 1000;

      const scaled = curPrice * denominator;
      const gannNums: number[] = [2];
      for (let min = 0; min <= 20; min++) {
        for (let i = 0; i < 4; i++) {
          const lastNum = gannNums[gannNums.length - 1];
          if (min === 0 && i === 0) gannNums.push(min + (min + 2));
          else if (min > 0 && i === 0) gannNums.push(Math.round(lastNum) + (min + 1) + min);
          else gannNums.push(Math.round(lastNum) + (min + 2) + min);
        }
      }

      let resPrice = curPrice * 1.01;
      let supPrice = curPrice * 0.99;
      for (let g = 0; g < gannNums.length - 1; g++) {
        if (gannNums[g] <= scaled && gannNums[g + 1] > scaled) {
          supPrice = gannNums[g] / denominator;
          resPrice = gannNums[g + 1] / denominator;
          break;
        }
      }
      const midGann = (supPrice + resPrice) / 2;

      const gannStart = times[Math.max(0, candles.length - 40)];
      const gannEnd = times[candles.length - 1];

      output.lines.push({
        id: 'gann-r1',
        x1: gannStart,
        y1: resPrice,
        x2: gannEnd,
        y2: resPrice,
        color: '#ef5350',
        width: 1,
        style: 'dashed',
        label: `R1 = ${resPrice.toFixed(2)}`
      });

      output.lines.push({
        id: 'gann-s1',
        x1: gannStart,
        y1: supPrice,
        x2: gannEnd,
        y2: supPrice,
        color: '#00e676',
        width: 1,
        style: 'dashed',
        label: `S1 = ${supPrice.toFixed(2)}`
      });

      output.lines.push({
        id: 'gann-blue',
        x1: gannStart,
        y1: midGann,
        x2: gannEnd,
        y2: midGann,
        color: '#2196f3',
        width: 1,
        style: 'solid',
        label: `Mid = ${midGann.toFixed(2)}`
      });
    }

    // --- 9. Supply & Demand Volume Profile Zones ---
    if (showSupplyDemand && candles.length >= 25) {
      const recentCandles = candles.slice(-50);
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      recentCandles.forEach(c => {
        if (c.high > highestHigh) highestHigh = c.high;
        if (c.low < lowestLow) lowestLow = c.low;
      });

      const zoneRange = highestHigh - lowestLow;
      if (zoneRange > 0) {
        const supplyTop = highestHigh;
        const supplyBtm = highestHigh - zoneRange * 0.12;
        const demandTop = lowestLow + zoneRange * 0.12;
        const demandBtm = lowestLow;

        const zoneStart = times[candles.length - recentCandles.length];
        const zoneEnd = times[candles.length - 1];

        // Supply Zone (top)
        output.boxes.push({
          id: `supply-zone-${zoneStart}`,
          x1: zoneStart,
          y1: supplyTop,
          x2: zoneEnd,
          y2: supplyBtm,
          color: 'rgba(33, 86, 243, 0.16)',
          bordercolor: '#2156f3',
          borderstyle: 'solid',
          label: 'Supply Zone'
        });

        // Demand Zone (bottom)
        output.boxes.push({
          id: `demand-zone-${zoneStart}`,
          x1: zoneStart,
          y1: demandTop,
          x2: zoneEnd,
          y2: demandBtm,
          color: 'rgba(255, 94, 0, 0.16)',
          bordercolor: '#ff5e00',
          borderstyle: 'solid',
          label: 'Demand Zone'
        });
      }
    }

    // --- 10. Information Panel / Dashboard ---
    if (infoPan) {
      output.tables = [
        {
          id: 'ob_info_panel',
          title: 'LATEST ORDER BLOCKS',
          position: 'top_right',
          size: 'small',
          rows: [
            [
              { text: 'LATEST ORDER BLOCKS', bold: true, align: 'center', color: '#38bdf8' },
              { text: '', align: 'right' }
            ],
            [
              { text: '🟢 Bullish OB High', align: 'left', color: '#cbd5e1' },
              { text: latestBullHigh > 0 ? latestBullHigh.toFixed(2) : '—', bold: true, align: 'right', color: '#26a69a' }
            ],
            [
              { text: '🟢 Bullish OB Avg', align: 'left', color: '#cbd5e1' },
              { text: latestBullAvg > 0 ? latestBullAvg.toFixed(2) : '—', bold: true, align: 'right', color: '#26a69a' }
            ],
            [
              { text: '🟢 Bullish OB Low', align: 'left', color: '#cbd5e1' },
              { text: latestBullLow > 0 ? latestBullLow.toFixed(2) : '—', bold: true, align: 'right', color: '#26a69a' }
            ],
            [
              { text: '🔴 Bearish OB High', align: 'left', color: '#cbd5e1' },
              { text: latestBearHigh > 0 ? latestBearHigh.toFixed(2) : '—', bold: true, align: 'right', color: '#ef5350' }
            ],
            [
              { text: '🔴 Bearish OB Avg', align: 'left', color: '#cbd5e1' },
              { text: latestBearAvg > 0 ? latestBearAvg.toFixed(2) : '—', bold: true, align: 'right', color: '#ef5350' }
            ],
            [
              { text: '🔴 Bearish OB Low', align: 'left', color: '#cbd5e1' },
              { text: latestBearLow > 0 ? latestBearLow.toFixed(2) : '—', bold: true, align: 'right', color: '#ef5350' }
            ]
          ]
        }
      ];
    }

    return output;
  }

  // ==========================================
  // 14B. BANKER FUND FLOW TREND OSCILLATOR WITH TDI LEO
  // ==========================================
  if (
    indicator.id === 'banker_fund_flow_tdi_leo' ||
    indicator.id.includes('banker_fund_flow') ||
    indicator.name.toLowerCase().includes('banker fund flow') ||
    indicator.name.toLowerCase().includes('tdi leo') ||
    (indicator.code && indicator.code.toLowerCase().includes('banker fund flow')) ||
    (indicator.code && indicator.code.toLowerCase().includes('fundtrend')) ||
    idLower.includes('banker')
  ) {
    output.overlay = false;
    output.name = 'Banker Fund Flow Trend Oscillator with TDI LEO';

    // 1. Helper xsa (Modified Moving Average smoothing)
    const xsa = (src: number[], len: number, wei: number): number[] => {
      const n = src.length;
      const out: number[] = new Array(n);
      let sumf = 0;
      let runningOut: number | null = null;
      for (let i = 0; i < n; i++) {
        const s = src[i];
        const s_len = i >= len ? src[i - len] : 0;
        sumf = sumf - s_len + s;
        if (i < len - 1) {
          out[i] = s;
          runningOut = s;
        } else if (runningOut === null) {
          const ma = sumf / len;
          runningOut = ma;
          out[i] = ma;
        } else {
          runningOut = (s * wei + runningOut * (len - wei)) / len;
          out[i] = runningOut;
        }
      }
      return out;
    };

    // 2. Banker Fund Flow Trend Model
    // (close - lowest(low, 27)) / (highest(high, 27) - lowest(low, 27)) * 100
    const raw27: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      let ll = Infinity;
      let hh = -Infinity;
      const start = Math.max(0, i - 26);
      for (let k = start; k <= i; k++) {
        if (lowPrices[k] < ll) ll = lowPrices[k];
        if (highPrices[k] > hh) hh = highPrices[k];
      }
      const span = hh - ll;
      raw27.push(span === 0 ? 50 : ((closePrices[i] - ll) / span) * 100);
    }

    const s1 = xsa(raw27, 5, 1);
    const s2 = xsa(s1, 3, 1);

    const fundtrendArr: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      const v = ((3 * s1[i] - 2 * s2[i] - 50) * 1.032 + 50);
      fundtrendArr.push(Math.max(-10, Math.min(110, v)));
    }

    // 3. Typical price & bullbearline over 34 bars
    // typ = (2*close + high + low + open) / 5
    // bullbearline = EMA((typ - lowest(low, 34)) / (highest(high, 34) - lowest(low, 34)) * 100, 13)
    const bullbearRaw: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      const typ = (2 * closePrices[i] + highPrices[i] + lowPrices[i] + openPrices[i]) / 5;
      let lol = Infinity;
      let hoh = -Infinity;
      const start = Math.max(0, i - 33);
      for (let k = start; k <= i; k++) {
        if (lowPrices[k] < lol) lol = lowPrices[k];
        if (highPrices[k] > hoh) hoh = highPrices[k];
      }
      const span = hoh - lol;
      bullbearRaw.push(span === 0 ? 50 : ((typ - lol) / span) * 100);
    }

    const bullbearlineArrNullable = TA.ema(bullbearRaw, 13);
    const bullbearlineArr = bullbearlineArrNullable.map((v, i) => (v !== null && !isNaN(v)) ? v : bullbearRaw[i]);

    // 4. Banker Data Points (Green, White, Red, Blue, Yellow Entry)
    const bankerData: BankerFundFlowPoint[] = [];
    for (let i = 0; i < candles.length; i++) {
      const ft = fundtrendArr[i];
      const bbl = bullbearlineArr[i];
      const prevFt = i > 0 ? fundtrendArr[i - 1] : ft;
      const isEntry = i > 0 && fundtrendArr[i - 1] <= bullbearlineArr[i - 1] && ft > bbl && bbl < 25;

      let color = 'rgba(76, 175, 79, 0.75)'; // Green (increase / accumulation)
      if (ft < prevFt * 0.95) {
        color = '#ffffff'; // White (decrease position)
      } else if (ft < bbl) {
        if (ft > prevFt * 0.95) {
          color = 'rgba(33, 149, 243, 0.9)'; // Blue (weak rebound)
        } else {
          color = 'rgba(255, 82, 82, 0.75)'; // Red (exit/quit)
        }
      } else if (ft > bbl) {
        color = 'rgba(76, 175, 79, 0.75)'; // Green
      }

      if (isEntry) {
        output.signals.push({
          time: times[i],
          type: 'BUY',
          price: closePrices[i],
          comment: 'Banker Fund Entry'
        });
      }

      bankerData.push({
        time: times[i],
        fundtrend: ft,
        bullbearline: bbl,
        color,
        entrySignal: isEntry
      });
    }
    output.bankerData = bankerData;

    // 5. TDI (Traders Dynamic Index)
    const rsiPeriod = Math.max(2, Number(params.RSI_input ?? 21));
    const tlPeriod = Math.max(2, Number(params.TL_input ?? 7));
    const blPeriod = Math.max(5, Number(params.BL_input ?? 34));
    const vbMult = Number(params.VB_input ?? 1.6185);

    const rsiRaw = TA.rsi(closePrices, rsiPeriod);
    const validRsi = rsiRaw.map(v => v === null ? 50 : v);
    const rPlot = TA.sma(validRsi, 2);
    const rTl = TA.sma(validRsi, tlPeriod);
    const rGbl = TA.sma(validRsi, blPeriod);
    const stdevR = TA.stdev(validRsi, blPeriod);

    const vbUp = rGbl.map((g, i) => (g !== null && stdevR[i] !== null) ? g + vbMult * stdevR[i]! : null);
    const vbDown = rGbl.map((g, i) => (g !== null && stdevR[i] !== null) ? g - vbMult * stdevR[i]! : null);

    output.plots = [
      rPlot.map((v, i) => ({ time: times[i], value: v, color: '#1dc72b', label: 'RSI' })),
      rTl.map((v, i) => ({ time: times[i], value: v, color: '#FF0000', label: 'RSI TrendLine' })),
      rGbl.map((v, i) => ({ time: times[i], value: v, color: '#ff9800', label: 'Market Baseline' })),
      vbUp.map((v, i) => ({ time: times[i], value: v, color: '#80deea', label: 'Volatility Upper' })),
      vbDown.map((v, i) => ({ time: times[i], value: v, color: '#80deea', label: 'Volatility Lower' }))
    ];

    // 6. Overbought & Oversold Shaded Zones & Reference Lines
    output.oscillatorBands = [
      { top: 90, bottom: 85, color: 'rgba(223, 64, 251, 0.35)', label: 'Overbought (85-90)' },
      { top: 15, bottom: 10, color: 'rgba(255, 153, 0, 0.35)', label: 'Oversold (10-15)' }
    ];

    output.oscillatorHlines = [
      { value: 90, color: '#e040fb', style: 'dotted', label: '90' },
      { value: 85, color: '#ef5350', style: 'dotted', label: '85' },
      { value: 70, color: 'rgba(255, 255, 255, 0.3)', style: 'dashed', label: '70' },
      { value: 50, color: 'rgba(255, 255, 255, 0.25)', style: 'dashed', label: '50' },
      { value: 30, color: 'rgba(255, 255, 255, 0.3)', style: 'dashed', label: '30' },
      { value: 15, color: '#ffb300', style: 'dotted', label: '15' },
      { value: 10, color: '#76ff03', style: 'dotted', label: '10' }
    ];

    // 7. Divergences (Bear, Bull, H Bear, H Bull)
    const lbL = Math.max(1, Number(params.lbL ?? 6));
    const lbR = Math.max(1, Number(params.lbR ?? 2));
    const rangeUpper = Math.max(10, Number(params.rangeUpper ?? 60));
    const rangeLower = Math.max(2, Number(params.rangeLower ?? 5));
    const plotBull = Boolean(params.plotBull ?? true);
    const plotBear = Boolean(params.plotBear ?? true);
    const plotHiddenBull = Boolean(params.plotHiddenBull ?? false);
    const plotHiddenBear = Boolean(params.plotHiddenBear ?? false);

    const oscValues = rPlot.map(v => v === null ? 50 : v);
    const plFound: { idx: number; val: number; price: number; time: number }[] = [];
    const phFound: { idx: number; val: number; price: number; time: number }[] = [];

    for (let i = lbL; i < candles.length - lbR; i++) {
      let isPivotLow = true;
      let isPivotHigh = true;
      const cur = oscValues[i];

      for (let k = 1; k <= lbL; k++) {
        if (oscValues[i - k] <= cur) isPivotLow = false;
        if (oscValues[i - k] >= cur) isPivotHigh = false;
      }
      for (let k = 1; k <= lbR; k++) {
        if (oscValues[i + k] <= cur) isPivotLow = false;
        if (oscValues[i + k] >= cur) isPivotHigh = false;
      }

      if (isPivotLow) plFound.push({ idx: i, val: cur, price: lowPrices[i], time: times[i] });
      if (isPivotHigh) phFound.push({ idx: i, val: cur, price: highPrices[i], time: times[i] });
    }

    // Bearish Divergence
    if (phFound.length >= 2) {
      for (let j = 1; j < phFound.length; j++) {
        const prev = phFound[j - 1];
        const curr = phFound[j];
        const barDist = curr.idx - prev.idx;
        if (barDist < rangeLower || barDist > rangeUpper) continue;

        const oscLH = curr.val < prev.val;
        const priceHH = curr.price > prev.price;
        const oscHH = curr.val > prev.val;
        const priceLH = curr.price < prev.price;

        if (plotBear && priceHH && oscLH) {
          output.labels.push({
            id: `bear-div-${curr.time}`,
            x: curr.time,
            y: curr.val + 4,
            text: 'Bear',
            color: '#ef5350',
            textcolor: '#ffffff',
            badge: true
          });
          output.lines.push({
            id: `bear-line-${curr.time}`,
            x1: prev.time,
            y1: prev.val,
            x2: curr.time,
            y2: curr.val,
            color: '#ef5350',
            width: 2,
            style: 'solid'
          });
        } else if (plotHiddenBear && priceLH && oscHH) {
          output.labels.push({
            id: `h-bear-div-${curr.time}`,
            x: curr.time,
            y: curr.val + 4,
            text: 'H Bear',
            color: '#ef5350',
            textcolor: '#ffffff',
            badge: true
          });
        }
      }
    }

    // Bullish Divergence
    if (plFound.length >= 2) {
      for (let j = 1; j < plFound.length; j++) {
        const prev = plFound[j - 1];
        const curr = plFound[j];
        const barDist = curr.idx - prev.idx;
        if (barDist < rangeLower || barDist > rangeUpper) continue;

        const oscHL = curr.val > prev.val;
        const priceLL = curr.price < prev.price;
        const oscLL = curr.val < prev.val;
        const priceHL = curr.price > prev.price;

        if (plotBull && priceLL && oscHL) {
          output.labels.push({
            id: `bull-div-${curr.time}`,
            x: curr.time,
            y: curr.val - 4,
            text: 'Bull',
            color: '#26a69a',
            textcolor: '#ffffff',
            badge: true
          });
          output.lines.push({
            id: `bull-line-${curr.time}`,
            x1: prev.time,
            y1: prev.val,
            x2: curr.time,
            y2: curr.val,
            color: '#26a69a',
            width: 2,
            style: 'solid'
          });
        } else if (plotHiddenBull && priceHL && oscLL) {
          output.labels.push({
            id: `h-bull-div-${curr.time}`,
            x: curr.time,
            y: curr.val - 4,
            text: 'H Bull',
            color: '#26a69a',
            textcolor: '#ffffff',
            badge: true
          });
        }
      }
    }

    return output;
  }

  // ==========================================
  // 15. PARSE STANDARD PINE SCRIPT (SMA, HMA, etc.)
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
