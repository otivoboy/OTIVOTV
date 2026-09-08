import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData,
  Time, 
  CandlestickSeries, 
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  ColorType,
  LineType
} from 'lightweight-charts';
import { useMarketStore } from '../../store/useMarketStore';
import { Candle, Tick, ChartType, Timeframe } from '../../types';
import { calculateHeikinAshi } from '../../lib/heikinAshi';
import { runPineEngine } from '../../lib/pineEngine';
import { isMarketClosedWeekend } from '../../lib/marketHours';
import { SymbolLogo } from '../SymbolLogo';
import { getSymbolPriceFormat, formatSymbolPrice } from '../../lib/priceFormatter';
import { OtivoPreloader } from '../Common/OtivoPreloader';
import { OscillatorPanel } from './OscillatorPanel';
import { IndicatorSettingsModal } from './IndicatorSettingsModal';
import { DrawingSettingsModal } from './DrawingSettingsModal';
import { generateSeedCandles, derivClient } from '../../lib/derivClient';

import { 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Type as TypeIcon,
  Palette,
  Maximize2,
  ChevronDown,
  Search,
  X,
  Layers,
  GripVertical,
  LayoutGrid,
  Pencil,
  MoreHorizontal,
  Clock,
  PaintBucket,
  ArrowUpDown
} from 'lucide-react';

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '8h': 28800,
  '1d': 86400,
  '1w': 604800,
};

const getDistToSegment = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const formatMovingPrice = (price: number, symbol: string): string => {
  if (price === undefined || isNaN(price)) return '---';
  const format = getSymbolPriceFormat(symbol, price);
  let precision = format.precision;
  
  // If price has more decimal places (e.g. 3 decimals on tick for XAUUSD as in screenshot), preserve it
  const priceStr = price.toString();
  if (priceStr.includes('.')) {
    const decimals = priceStr.split('.')[1].length;
    if (decimals > precision && decimals <= 5) {
      precision = decimals;
    }
  }

  return price.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

export const createSeriesForType = (
  chart: IChartApi,
  type: ChartType,
  symbol: string,
  lastClosePrice: number | undefined,
  isDarkTheme: boolean,
  hasFp: boolean
): ISeriesApi<any> => {
  const initialPriceFormat = getSymbolPriceFormat(symbol, lastClosePrice);

  switch (type) {
    case 'bars':
      return chart.addSeries(BarSeries, {
        upColor: hasFp ? 'transparent' : '#26a69a',
        downColor: hasFp ? 'transparent' : '#ef5350',
        openVisible: true,
        thinBars: false,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'hollow_candlestick':
      return chart.addSeries(CandlestickSeries, {
        upColor: hasFp ? 'transparent' : (isDarkTheme ? '#131722' : '#ffffff'),
        downColor: hasFp ? 'transparent' : '#ef5350',
        borderVisible: true,
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'heikin_ashi':
      return chart.addSeries(CandlestickSeries, {
        upColor: hasFp ? 'transparent' : '#26a69a',
        downColor: hasFp ? 'transparent' : '#ef5350',
        borderVisible: false,
        wickUpColor: hasFp ? 'transparent' : '#26a69a',
        wickDownColor: hasFp ? 'transparent' : '#ef5350',
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'line':
      return chart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
        lineType: LineType.Simple,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'stepline':
      return chart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
        lineType: LineType.WithSteps,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'area':
      return chart.addSeries(AreaSeries, {
        topColor: 'rgba(41, 98, 255, 0.38)',
        bottomColor: 'rgba(41, 98, 255, 0.01)',
        lineColor: '#2962ff',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'baseline':
      return chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: lastClosePrice || 0 },
        topLineColor: '#26a69a',
        topFillColor1: 'rgba(38, 166, 154, 0.32)',
        topFillColor2: 'rgba(38, 166, 154, 0.05)',
        bottomLineColor: '#ef5350',
        bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
        bottomFillColor2: 'rgba(239, 83, 80, 0.32)',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });

    case 'candlestick':
    default:
      return chart.addSeries(CandlestickSeries, {
        upColor: hasFp ? 'transparent' : '#26a69a',
        downColor: hasFp ? 'transparent' : '#ef5350',
        borderVisible: false,
        wickUpColor: hasFp ? 'transparent' : '#26a69a',
        wickDownColor: hasFp ? 'transparent' : '#ef5350',
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: initialPriceFormat,
      });
  }
};

export const formatSeriesData = (rawCandles: Candle[], type: ChartType) => {
  if (!rawCandles || rawCandles.length === 0) return [];

  const sorted = [...rawCandles]
    .map(c => ({
      time: (typeof c.time === 'number' ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time) : Math.floor(new Date(c.time as string).getTime() / 1000)),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }))
    .sort((a, b) => a.time - b.time);

  const deduped: Candle[] = [];
  for (const c of sorted) {
    if (deduped.length === 0 || deduped[deduped.length - 1].time !== c.time) {
      deduped.push(c);
    } else {
      deduped[deduped.length - 1] = c;
    }
  }

  if (type === 'heikin_ashi') {
    const haCandles = calculateHeikinAshi(deduped);
    return haCandles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  }

  if (type === 'candlestick' || type === 'bars' || type === 'hollow_candlestick') {
    return deduped.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  }

  // Line, Area, Baseline, Stepline
  return deduped.map(c => ({
    time: c.time as Time,
    value: c.close,
  }));
};

const parseTimeSec = (val: any): number | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return val > 1e11 ? Math.floor(val / 1000) : val;
  }
  if (typeof val === 'string') {
    const ms = Date.parse(val);
    return isNaN(ms) ? null : Math.floor(ms / 1000);
  }
  if (val && typeof val === 'object' && 'year' in val) {
    return Math.floor(new Date(val.year, val.month - 1, val.day).getTime() / 1000);
  }
  return null;
};

const getXFromTime = (timeScale: any, t: any, candles?: Candle[]): number | null => {
  if (!timeScale || t === undefined || t === null) return null;

  const targetSec = parseTimeSec(t);
  if (targetSec === null) return null;

  // 1. Try direct coordinate lookup first
  try {
    const directX = timeScale.timeToCoordinate(targetSec as Time);
    if (directX !== null && !isNaN(directX)) return directX;
  } catch {
    // proceed to robust logical interpolation/extrapolation
  }

  if (!candles || candles.length === 0) return null;

  const n = candles.length;
  const firstCandleTime = parseTimeSec(candles[0].time);
  const lastCandleTime = parseTimeSec(candles[n - 1].time);

  if (firstCandleTime === null || lastCandleTime === null) return null;

  let dt = 60;
  if (n >= 2) {
    const prevTime = parseTimeSec(candles[n - 2].time) || (lastCandleTime - 60);
    dt = Math.max(1, lastCandleTime - prevTime);
  }

  // 2. Find fractional logical index relative to the candles series
  let logicalIdx = 0;
  if (n === 1) {
    logicalIdx = 0;
  } else if (targetSec <= firstCandleTime) {
    logicalIdx = (targetSec - firstCandleTime) / dt;
  } else if (targetSec >= lastCandleTime) {
    logicalIdx = (n - 1) + (targetSec - lastCandleTime) / dt;
  } else {
    // Binary search to find candle interval
    let low = 0;
    let high = n - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = parseTimeSec(candles[mid].time) || 0;
      if (midTime <= targetSec) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const idx = Math.max(0, Math.min(n - 2, high));
    const t0 = parseTimeSec(candles[idx].time) || 0;
    const t1 = parseTimeSec(candles[idx + 1].time) || (t0 + dt);
    const frac = (targetSec - t0) / Math.max(1, t1 - t0);
    logicalIdx = idx + frac;
  }

  // 3. Convert logical index to screen pixel coordinate via timeScale
  try {
    if (typeof timeScale.logicalToCoordinate === 'function') {
      const coord = timeScale.logicalToCoordinate(logicalIdx as any);
      if (coord !== null && !isNaN(coord)) {
        return coord;
      }
      const floorIdx = Math.floor(logicalIdx);
      const coordFloor = timeScale.logicalToCoordinate(floorIdx as any);
      const coordCeil = timeScale.logicalToCoordinate((floorIdx + 1) as any);

      if (coordFloor !== null && coordCeil !== null && !isNaN(coordFloor) && !isNaN(coordCeil)) {
        return coordFloor + (logicalIdx - floorIdx) * (coordCeil - coordFloor);
      }
      if (coordFloor !== null && !isNaN(coordFloor)) {
        const visRange = timeScale.getVisibleLogicalRange?.();
        if (visRange && visRange.to > visRange.from) {
          const xFrom = timeScale.logicalToCoordinate(visRange.from as any);
          const xTo = timeScale.logicalToCoordinate(visRange.to as any);
          if (xFrom !== null && xTo !== null) {
            const barSpacing = (xTo - xFrom) / (visRange.to - visRange.from);
            return coordFloor + (logicalIdx - floorIdx) * barSpacing;
          }
        }
        return coordFloor;
      }
    }
  } catch {
    // fallback
  }

  // 4. Fallback using visible logical range
  try {
    const visRange = timeScale.getVisibleLogicalRange?.();
    if (visRange && visRange.to > visRange.from) {
      const xFrom = timeScale.logicalToCoordinate(visRange.from as any);
      const xTo = timeScale.logicalToCoordinate(visRange.to as any);
      if (xFrom !== null && xTo !== null && xTo > xFrom) {
        const barSpacing = (xTo - xFrom) / (visRange.to - visRange.from);
        return xFrom + (logicalIdx - visRange.from) * barSpacing;
      }
    }
  } catch {
    // fallback
  }

  // 5. Fallback: Find any two candles that are currently visible
  try {
    let visibleA: { time: number; x: number } | null = null;
    let visibleB: { time: number; x: number } | null = null;

    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 20))) {
      const cTime = parseTimeSec(candles[i].time);
      if (cTime === null) continue;
      const xCoord = timeScale.timeToCoordinate(cTime as Time);
      if (xCoord !== null && !isNaN(xCoord)) {
        if (!visibleA) {
          visibleA = { time: cTime, x: xCoord };
        } else {
          visibleB = { time: cTime, x: xCoord };
          break;
        }
      }
    }

    if (visibleA && visibleB && visibleB.time !== visibleA.time) {
      const pxPerSec = (visibleB.x - visibleA.x) / (visibleB.time - visibleA.time);
      return visibleA.x + (targetSec - visibleA.time) * pxPerSec;
    }
  } catch {
    // ignore
  }

  return null;
};

const getTimeFromX = (timeScale: any, x: number, candles?: Candle[]): number | null => {
  if (!timeScale) return null;

  // 1. Direct coordinate lookup
  try {
    const directTime = timeScale.coordinateToTime(x);
    if (directTime !== null && directTime !== undefined) {
      const parsed = parseTimeSec(directTime);
      if (parsed !== null && !isNaN(parsed)) return parsed;
    }
  } catch {
    // proceed to logical calculation
  }

  if (!candles || candles.length === 0) return null;
  const n = candles.length;
  const firstCandleTime = parseTimeSec(candles[0].time);
  const lastCandleTime = parseTimeSec(candles[n - 1].time);
  if (firstCandleTime === null || lastCandleTime === null) return null;

  let dt = 60;
  if (n >= 2) {
    const prevTime = parseTimeSec(candles[n - 2].time) || (lastCandleTime - 60);
    dt = Math.max(1, lastCandleTime - prevTime);
  }

  // 2. Try coordinateToLogical
  try {
    if (typeof timeScale.coordinateToLogical === 'function') {
      const logical = timeScale.coordinateToLogical(x);
      if (logical !== null && logical !== undefined && !isNaN(logical)) {
        if (logical >= 0 && logical < n) {
          const idx = Math.max(0, Math.min(n - 1, Math.round(logical)));
          const cTime = parseTimeSec(candles[idx].time);
          if (cTime !== null) return cTime;
        } else if (logical >= n) {
          return Math.round(lastCandleTime + (logical - (n - 1)) * dt);
        } else {
          return Math.round(firstCandleTime + logical * dt);
        }
      }
    }
  } catch {
    // fallback
  }

  // 3. Fallback using visible logical range
  try {
    const visRange = timeScale.getVisibleLogicalRange?.();
    if (visRange && visRange.to > visRange.from) {
      const xFrom = timeScale.logicalToCoordinate(visRange.from as any);
      const xTo = timeScale.logicalToCoordinate(visRange.to as any);
      if (xFrom !== null && xTo !== null && xTo > xFrom) {
        const pxPerBar = (xTo - xFrom) / (visRange.to - visRange.from);
        const logical = visRange.from + (x - xFrom) / pxPerBar;
        if (logical >= n) {
          return Math.round(lastCandleTime + (logical - (n - 1)) * dt);
        } else if (logical < 0) {
          return Math.round(firstCandleTime + logical * dt);
        } else {
          const idx = Math.max(0, Math.min(n - 1, Math.round(logical)));
          return parseTimeSec(candles[idx].time) || lastCandleTime;
        }
      }
    }
  } catch {
    // ignore
  }

  return lastCandleTime;
};

export interface TradingChartProps {
  paneId?: string;
  symbol?: string;
  timeframe?: Timeframe;
  isActivePane?: boolean;
  onSelectPane?: () => void;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  onMaximizePane?: () => void;
  showPaneHeader?: boolean;
}

const POPULAR_PANE_SYMBOLS = [
  { id: 'frxEURUSD', name: 'EUR/USD', market: 'Forex' },
  { id: 'frxGBPUSD', name: 'GBP/USD', market: 'Forex' },
  { id: 'frxUSDJPY', name: 'USD/JPY', market: 'Forex' },
  { id: 'cryBTCUSD', name: 'BTC/USD', market: 'Crypto' },
  { id: 'cryETHUSD', name: 'ETH/USD', market: 'Crypto' },
  { id: 'frxXAUUSD', name: 'Gold (XAU)', market: 'Commodities' },
  { id: '1HZ100V', name: 'Volatility 100 (1s)', market: 'Derived' },
  { id: '1HZ75V', name: 'Volatility 75 (1s)', market: 'Derived' },
];

const PANE_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export const TradingChart: React.FC<TradingChartProps> = ({
  paneId,
  symbol: propSymbol,
  timeframe: propTimeframe,
  isActivePane = false,
  onSelectPane,
  onSymbolChange,
  onTimeframeChange,
  onMaximizePane,
  showPaneHeader = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentSeriesTypeRef = useRef<ChartType>('candlestick');
  const priceLineRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movingPriceBadgeRef = useRef<{
    price: number;
    timeStr: string;
    isUp: boolean;
    showCountdown: boolean;
    color: string;
  } | null>(null);
  const { 
    candles, candlesVersion, activeSymbol, activeTimeframe, availableSymbols, lastTick, theme, marketTime,
    activeTool, drawings, addDrawing, setActiveTool, removeDrawing,
    updateDrawing, selectedDrawingId, setSelectedDrawing,
    activeIndicators, removeIndicator, updateIndicator, hiddenIndicators, toggleIndicatorVisibility,
    chartType, chartSettings
  } = useMarketStore();

  const effectiveSymbol = propSymbol || activeSymbol;
  const effectiveTimeframe = propTimeframe || activeTimeframe;
  const isMultiPane = Boolean(paneId);

  // For multi-panes, maintain an independent candle stream initialized with seed candles or Deriv cache
  const [localCandles, setLocalCandles] = useState<Candle[]>(() => {
    if (!isMultiPane) return candles;
    const cached = derivClient.getCachedCandles(effectiveSymbol, effectiveTimeframe);
    if (cached && cached.length > 0) return cached;
    return generateSeedCandles(effectiveSymbol, effectiveTimeframe, 250);
  });

  // Re-seed subpane candles and subscribe to Deriv WebSocket when symbol or timeframe changes
  useEffect(() => {
    if (isMultiPane) {
      const cached = derivClient.getCachedCandles(effectiveSymbol, effectiveTimeframe);
      if (cached && cached.length > 0) {
        setLocalCandles(cached);
      } else {
        setLocalCandles(generateSeedCandles(effectiveSymbol, effectiveTimeframe, 250));
      }

      // Request live Deriv data for this pane's symbol & timeframe
      derivClient.subscribe(effectiveSymbol, effectiveTimeframe);

      const handleCandles = (newCandles: Candle[]) => {
        if (newCandles && newCandles.length > 0) {
          setLocalCandles(newCandles);
        }
      };

      const handleCandleUpdate = (updatedCandle: Candle) => {
        setLocalCandles(prev => {
          if (!prev || prev.length === 0) return [updatedCandle];
          const last = prev[prev.length - 1];
          if (updatedCandle.time > last.time) {
            return [...prev, updatedCandle];
          }
          const next = [...prev];
          next[next.length - 1] = updatedCandle;
          return next;
        });
      };

      derivClient.onCandles(effectiveSymbol, effectiveTimeframe, handleCandles);
      derivClient.onCandleUpdate(effectiveSymbol, effectiveTimeframe, handleCandleUpdate);

      return () => {
        derivClient.offCandles(effectiveSymbol, effectiveTimeframe, handleCandles);
        derivClient.offCandleUpdate(effectiveSymbol, effectiveTimeframe, handleCandleUpdate);
      };
    }
  }, [effectiveSymbol, effectiveTimeframe, isMultiPane]);



  const displayCandles = isMultiPane ? localCandles : candles;

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{ time: number, price: number, x: number, y: number } | null>(null);
  const [middlePoint, setMiddlePoint] = useState<{ time: number, price: number, x: number, y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<any>(null);
  
  // Split pane symbol selector state
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [paneSymbolSearchQuery, setPaneSymbolSearchQuery] = useState('');
  const [paneMarketCategory, setPaneMarketCategory] = useState<'all' | 'forex' | 'boom_crash' | 'derived' | 'crypto'>('all');
  const symbolDropdownRef = useRef<HTMLDivElement>(null);

  // Close pane symbol dropdown on outside click or Escape
  useEffect(() => {
    if (!showSymbolDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(e.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSymbolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSymbolDropdown]);

  const filteredPaneSymbols = availableSymbols.filter(s => {
    const q = paneSymbolSearchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      s.display.toLowerCase().includes(q) || 
      s.symbol.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q) ||
      (s.marketDisplay && s.marketDisplay.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (paneMarketCategory === 'all') return true;
    if (paneMarketCategory === 'boom_crash') {
      return s.market === 'boom_crash' || 
             s.id.toLowerCase().includes('boom') || 
             s.id.toLowerCase().includes('crash') || 
             s.display.toLowerCase().includes('boom') || 
             s.display.toLowerCase().includes('crash');
    }
    if (paneMarketCategory === 'forex') {
      return s.market === 'forex' || s.id.startsWith('frx');
    }
    if (paneMarketCategory === 'crypto') {
      return s.market === 'cryptocurrency' || s.id.startsWith('cry');
    }
    if (paneMarketCategory === 'derived') {
      return s.market === 'synthetic_index' || s.id.includes('HZ') || s.id.includes('R_') || s.id.includes('STEP') || s.id.includes('JUMP');
    }
    return true;
  });
  
  // Floating toolbar state & settings modal
  const [toolbarPos, setToolbarPos] = useState<{ x: number, y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | boolean>(false);
  const [isDrawingSettingsOpen, setIsDrawingSettingsOpen] = useState(false);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const [indicatorParamLength, setIndicatorParamLength] = useState<number>(20);

  const TRADING_COLORS = [
    '#2962ff', '#f44336', '#4caf50', '#ff9800', '#9c27b0', 
    '#00bcd4', '#795548', '#ffffff', '#000000', '#787b86'
  ];

  // Refs to avoid stale closures in chart event listeners
  const drawingsRef = useRef(drawings);
  const symbolRef = useRef(effectiveSymbol);
  const themeRef = useRef(theme);
  const toolRef = useRef(activeTool);
  const startPointRef = useRef(startPoint);
  const mousePosRef = useRef(mousePos);
  const selectedDrawingIdRef = useRef(selectedDrawingId);
  const candlesRef = useRef(displayCandles);
  const redrawDrawingsRef = useRef<() => void>(() => {});

  // Keep refs in sync
  useEffect(() => { drawingsRef.current = drawings; }, [drawings]);
  useEffect(() => { symbolRef.current = effectiveSymbol; }, [effectiveSymbol]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { toolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { startPointRef.current = startPoint; }, [startPoint]);
  useEffect(() => { mousePosRef.current = mousePos; }, [mousePos]);
  useEffect(() => { selectedDrawingIdRef.current = selectedDrawingId; }, [selectedDrawingId]);
  useEffect(() => { candlesRef.current = displayCandles; }, [displayCandles]);

  const lastResolvedSymbol = useRef<string>('');
  const prevCandlesCountRef = useRef<number>(0);

  const [isHoveringDrawing, setIsHoveringDrawing] = useState(false);
  const [isHoveringScale, setIsHoveringScale] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [selectedIndicatorForSettings, setSelectedIndicatorForSettings] = useState<string | null>(null);
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);

  // Optimized engine-based indicator data calculation
  const indicatorData = useMemo(() => {
    return activeIndicators
      .filter(indicator => !hiddenIndicators.includes(indicator.id))
      .map(indicator => runPineEngine(indicator, displayCandles, effectiveTimeframe));
  }, [activeIndicators, hiddenIndicators, displayCandles, effectiveTimeframe]);

  const indicatorDataRef = useRef(indicatorData);
  useEffect(() => { 
    indicatorDataRef.current = indicatorData; 
    redrawDrawingsRef.current?.();
  }, [indicatorData]);

  // Re-draw drawings on canvas
  const redrawDrawings = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      const chart = chartRef.current;
      const series = seriesRef.current;
      const container = chartContainerRef.current;
      if (!canvas || !chart || !series || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;
      
      const timeScale = chart.timeScale();
      const isDark = themeRef.current === 'dark';
      const currentIndicatorData = indicatorDataRef.current;
      const currentCandles = candlesRef.current;
      const currentSelectedId = selectedDrawingIdRef.current;

      // 1. Draw Custom Pine Indicators Output
      currentIndicatorData.forEach(data => {
        if (!data.overlay) return; // Non-overlay indicators (e.g. RSI) are drawn in dedicated oscillator panel
        
        const lastCandle = currentCandles[currentCandles.length - 1];
        const lastCandleX = lastCandle ? getXFromTime(timeScale, lastCandle.time, currentCandles) : null;
        
        // 1.1 Render BgColor Zones
        ctx.save();
        data.backgroundColorZones.forEach(zone => {
          let x1 = getXFromTime(timeScale, zone.start, currentCandles);
          let x2 = getXFromTime(timeScale, zone.end || (lastCandle?.time || Date.now()/1000), currentCandles);
          if (x1 === null && x2 !== null) x1 = 0;
          if (x1 !== null && x2 === null) x2 = lastCandleX !== null ? lastCandleX : width;
          if (lastCandleX !== null && x2 !== null && x2 > lastCandleX + 6) x2 = lastCandleX + 6;
          if (x1 !== null && x2 !== null) {
            ctx.fillStyle = zone.color;
            ctx.fillRect(x1, 0, Math.max(0, x2 - x1), height);
          }
        });
        ctx.restore();

        // 1.2 Render Plots (Lines/Series & Overlay Columns)
        if (data.name.toLowerCase() === 'volume') {
          // Dedicated overlay Volume histogram at bottom of chart
          const volSeries = data.plots[0] || [];
          const maSeries = data.plots[1] || [];
          let maxVol = 100;
          volSeries.forEach(pt => { if (pt.value) maxVol = Math.max(maxVol, pt.value); });
          const bottomY = height - 26;
          const maxVolH = height * 0.18;

          ctx.save();
          for (let j = 0; j < volSeries.length; j++) {
            const pt = volSeries[j];
            if (!pt.value) continue;
            const x = getXFromTime(timeScale, pt.time, currentCandles);
            if (x === null || x < -20 || x > width + 20) continue;
            let barW = 4;
            if (j < volSeries.length - 1) {
              const nextX = getXFromTime(timeScale, volSeries[j + 1].time, currentCandles);
              if (nextX !== null && nextX > x) {
                barW = Math.max(1.5, Math.min(22, (nextX - x) * 0.75));
              }
            }
            const barH = (pt.value / Math.max(1, maxVol)) * maxVolH;
            ctx.fillStyle = pt.color ? pt.color + '99' : '#26a69a99';
            ctx.fillRect(x - barW / 2, bottomY - barH, barW, Math.max(1.5, barH));
          }

          if (maSeries.length > 1) {
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = '#2962ffcc';
            ctx.beginPath();
            let started = false;
            for (let j = 0; j < maSeries.length; j++) {
              const pt = maSeries[j];
              if (!pt.value) continue;
              const x = getXFromTime(timeScale, pt.time, currentCandles);
              if (x === null) continue;
              const y = bottomY - (pt.value / Math.max(1, maxVol)) * maxVolH;
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
            if (started) ctx.stroke();
          }
          ctx.restore();
        } else {
          data.plots.forEach(seriesData => {
            if (seriesData.length < 2) return;
            
            ctx.save();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            let pathStarted = false;
            let activeColor = '';
            
            for (let j = 0; j < seriesData.length; j++) {
              const pt = seriesData[j];
              if (pt.value === null || isNaN(pt.value)) {
                if (pathStarted) {
                  ctx.stroke();
                  pathStarted = false;
                }
                continue;
              }
              
              const x = getXFromTime(timeScale, pt.time, currentCandles);
              const y = series.priceToCoordinate(pt.value);
              
              if (x === null || y === null) {
                if (pathStarted) {
                  ctx.stroke();
                  pathStarted = false;
                }
                continue;
              }
              
              const color = pt.color || '#2962ff';
              if (!pathStarted || color !== activeColor) {
                if (pathStarted) ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.moveTo(x, y);
                activeColor = color;
                pathStarted = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            if (pathStarted) {
              ctx.stroke();
            }
            ctx.restore();
          });
        }

        // 1.3 Render Signals (Markers & Quant Strategy Badges)
        ctx.save();
        data.signals.forEach(sig => {
          const x = getXFromTime(timeScale, sig.time, currentCandles);
          const y = series.priceToCoordinate(sig.price);
          if (x !== null && y !== null && x >= -20 && x <= width + 20) {
            const isBuy = sig.type === 'BUY';
            const sigColor = isBuy ? '#16a34a' : '#dc2626';
            const labelText = sig.comment || sig.type;

            // 1. Draw Directional Arrow Indicator
            ctx.save();
            ctx.fillStyle = sigColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (isBuy) {
              // Upward Arrow below the candle
              const tipY = y + 8;
              ctx.moveTo(x, tipY);
              ctx.lineTo(x - 5.5, tipY + 9);
              ctx.lineTo(x + 5.5, tipY + 9);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Downward Arrow above the candle
              const tipY = y - 8;
              ctx.moveTo(x, tipY);
              ctx.lineTo(x - 5.5, tipY - 9);
              ctx.lineTo(x + 5.5, tipY - 9);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
            
            // 2. Draw Pill Badge
            ctx.font = 'bold 9.5px "Inter", sans-serif';
            ctx.textAlign = 'center';
            const textMetrics = ctx.measureText(labelText);
            const badgeW = textMetrics.width + 12;
            const badgeH = 16;
            const badgeY = isBuy ? y + 21 : y - 27;
            
            // Outer subtle border glow & background
            ctx.fillStyle = isBuy ? 'rgba(22, 163, 74, 0.95)' : 'rgba(220, 38, 38, 0.95)';
            ctx.beginPath();
            ctx.roundRect(x - badgeW / 2, badgeY, badgeW, badgeH, 3);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x, badgeY + 11.5);
          }
        });
        ctx.restore();

        // 1.4 Render Lines (Stationary trade lines, FVG CE lines, CHoCH/BOS, Quant Brackets)
        ctx.save();
        data.lines.forEach(line => {
          let x1 = getXFromTime(timeScale, line.x1, currentCandles);
          let x2 = getXFromTime(timeScale, line.x2, currentCandles);
          const y1 = series.priceToCoordinate(line.y1);
          const y2 = series.priceToCoordinate(line.y2);

          // If both points are completely outside the coordinate system, skip
          if (x1 === null && x2 === null) return;

          if (x1 === null && x2 !== null) x1 = -20;
          if (x1 !== null && x2 === null) {
            x2 = lastCandleX !== null ? lastCandleX : width;
          }

          // Strict cap at the last forming candle position
          if (lastCandleX !== null && x2 !== null && x2 > lastCandleX + 4) {
            x2 = lastCandleX + 4;
          }

          if (x1 !== null && x2 !== null && y1 !== null && y2 !== null) {
            // If both points are off the same side of the screen, skip rendering
            if ((x1 < -50 && x2 < -50) || (x1 > width + 50 && x2 > width + 50)) return;

            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            if (line.style === 'dashed') ctx.setLineDash([5, 4]);
            else if (line.style === 'dotted') ctx.setLineDash([2, 3]);
            else ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Draw endpoint nodes for divergence lines
            if (line.label === 'Divergence') {
              ctx.fillStyle = line.color;
              ctx.beginPath();
              ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
              ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
              ctx.fill();

              // Draw centered text label along the divergence line
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 + (y2 < y1 ? -10 : 14);
              ctx.font = 'bold 10px "Inter", sans-serif';
              ctx.fillStyle = line.color;
              ctx.textAlign = 'center';
              ctx.fillText(line.label, midX, midY);
            } else if (line.label === 'CISD' || line.label.includes('CISD')) {
              // Special CISD (Change in State of Delivery) Line
              // Circular endpoints
              ctx.strokeStyle = '#3b82f6';
              ctx.fillStyle = isDark ? '#1e222d' : '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
              ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Text aligned bottom right of the trendline (as seen in video)
              ctx.font = 'bold 10px "JetBrains Mono", Inter, sans-serif';
              ctx.fillStyle = isDark ? '#d1d4dc' : '#131722';
              ctx.textAlign = 'right';
              ctx.fillText('CISD', x2, y2 + 13);
            } else if (line.label === 'Liquidity Sweep') {
              // Special Liquidity Sweep line with blue circle endpoints as in video
              ctx.strokeStyle = '#3b82f6';
              ctx.fillStyle = isDark ? '#1e222d' : '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
              ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Text label
              ctx.font = 'bold 9.5px "JetBrains Mono", Inter, sans-serif';
              ctx.fillStyle = isDark ? '#9ca3af' : '#4b5563';
              ctx.textAlign = 'left';
              ctx.fillText('Liquidity Sweep', x1 + 4, y1 - 6);
            } else if (line.label === 'CHoCH' || line.label.includes('CHoCH') || line.label === 'BOS' || line.label.includes('BOS')) {
              // Special CHoCH / BOS (Market Structure) Line Label
              const midX = (Math.max(0, x1) + Math.min(width, x2)) / 2;
              ctx.font = 'bold 10px "JetBrains Mono", Inter, sans-serif';
              const textW = ctx.measureText(line.label).width + 10;
              const textH = 15;
              ctx.fillStyle = isDark ? '#131722' : '#ffffff';
              ctx.beginPath();
              ctx.roundRect(midX - textW / 2, y1 - textH / 2, textW, textH, 3);
              ctx.fill();
              ctx.strokeStyle = line.color;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.fillStyle = line.color;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(line.label, midX, y1);
            } else if (line.label === 'Flagpole') {
              // Subtle circular endpoint markers on flagpole without cluttering text
              ctx.fillStyle = line.color;
              ctx.beginPath();
              ctx.arc(x1, y1, 3, 0, Math.PI * 2);
              ctx.arc(x2, y2, 3, 0, Math.PI * 2);
              ctx.fill();
            } else if (line.label && line.label.includes('Target') && x2 >= -20 && x2 <= width + 70) {
              // Clean target price pill badge at the right end of horizontal target projection
              ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
              const tagMetrics = ctx.measureText(line.label);
              const tagW = tagMetrics.width + 10;
              const tagH = 16;
              const tagX = Math.min(width - tagW - 4, Math.max(4, x2 + 6));
              const tagY = y2 - tagH / 2;

              ctx.fillStyle = line.color;
              ctx.beginPath();
              ctx.roundRect(tagX, tagY, tagW, tagH, 3);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(line.label, tagX + tagW / 2, tagY + tagH / 2);
            } else if (line.label && x2 >= -20 && x2 <= width + 50) {
              // Quant Target Line Tag (TP1, TP2, SL, ENTRY, etc.)
              const isQuantTarget = line.label.startsWith('TP') || line.label.startsWith('SL') || line.label.startsWith('ENTRY');
              
              if (isQuantTarget) {
                ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
                const tagMetrics = ctx.measureText(line.label);
                const tagW = tagMetrics.width + 8;
                const tagH = 15;
                const tagX = Math.min(width - tagW - 4, Math.max(4, x2 - tagW / 2));
                const tagY = y2 - 7.5;

                ctx.fillStyle = line.color;
                ctx.beginPath();
                ctx.roundRect(tagX, tagY, tagW, tagH, 2.5);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(line.label, tagX + tagW / 2, tagY + 11);
              } else if (x1 >= 0 && x1 <= width - 30) {
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.fillStyle = line.color;
                ctx.textAlign = 'left';
                ctx.fillText(line.label, x1 + 6, y1 - 4);
              }
            }
          }
        });
        ctx.restore();

        // 1.5 Render Labels & Directional Callouts
        ctx.save();
        data.labels.forEach(label => {
          const x = getXFromTime(timeScale, label.x, currentCandles);
          const y = series.priceToCoordinate(label.y);

          if (x !== null && y !== null && x >= -20 && x <= width + 20) {
            // A. Special: "Possible long incoming" Callout with Upward Arrow
            if (label.text.includes('Possible long incoming')) {
              const arrowY = y + 28;
              const textY = arrowY + 20;

              // Draw green upward arrow
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(x, arrowY + 16);
              ctx.lineTo(x, arrowY);
              ctx.stroke();

              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.moveTo(x, arrowY - 2);
              ctx.lineTo(x - 5, arrowY + 6);
              ctx.lineTo(x + 5, arrowY + 6);
              ctx.fill();

              // Draw green bold text
              ctx.font = 'bold 11px "Inter", sans-serif';
              ctx.fillStyle = '#22c55e';
              ctx.textAlign = 'center';
              ctx.fillText('Possible long', x, textY);
              ctx.fillText('incoming', x, textY + 13);
            }
            // B. Special: "Sell Imbalance" Cyan Drop Candle Highlight
            else if (label.text.includes('Sell Imbalance')) {
              // Draw cyan vertical ring around the big sell candle
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(x, y + 25, 10, 42, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Draw cyan arrow pointing right towards the ring
              ctx.beginPath();
              ctx.moveTo(x - 28, y + 25);
              ctx.lineTo(x - 14, y + 25);
              ctx.stroke();

              ctx.fillStyle = '#06b6d4';
              ctx.beginPath();
              ctx.moveTo(x - 12, y + 25);
              ctx.lineTo(x - 18, y + 21);
              ctx.lineTo(x - 18, y + 29);
              ctx.fill();
            }
            // C. Special: "ENTER" Breakout Signal Candle Circle & Callout (Smart Money Strategy)
            else if (label.text === 'ENTER' || label.text.startsWith('ENTER')) {
              const isLong = !label.text.includes('SELL');
              const circleColor = '#ffffff';
              const enterColor = isLong ? '#22c55e' : '#ef4444';

              // Draw white circular ring around the candle body
              ctx.save();
              ctx.strokeStyle = circleColor;
              ctx.lineWidth = 2.2;
              ctx.shadowColor = enterColor;
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(x, y - 6, 16, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();

              // Draw bold ENTER text badge
              ctx.font = '900 12px "Inter", "JetBrains Mono", sans-serif';
              const textMetrics = ctx.measureText(label.text);
              const badgeW = textMetrics.width + 12;
              const badgeH = 18;
              const badgeX = x + 20;
              const badgeY = y - 15;

              ctx.fillStyle = enterColor;
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText(label.text, badgeX + badgeW / 2, badgeY + 13);
            }
            // D. Special: "LIQUIDITY SWEEP" Callout
            else if (label.text.includes('LIQUIDITY SWEEP')) {
              const isBullishSweep = label.color === '#26a69a' || label.color === '#22c55e';
              const tagColor = label.color || '#26a69a';
              ctx.font = 'bold 10px "JetBrains Mono", Inter, sans-serif';
              const textWidth = ctx.measureText(label.text).width;
              const boxW = textWidth + 12;
              const boxH = 18;
              const boxY = isBullishSweep ? y + 8 : y - 26;

              ctx.fillStyle = tagColor;
              ctx.beginPath();
              ctx.roundRect(x - boxW / 2, boxY, boxW, boxH, 3);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 0.8;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText(label.text, x, boxY + 12.5);
            }
            // E. Special: Liquidity Swings Resting Volume & Action Tag (e.g., "23.823K Sell", "99.906K Buy")
            else if (label.id?.startsWith('liq-sw-') || /(\d+(?:\.\d+)?K?)\s+(Sell|Buy)/i.test(label.text)) {
              const isSell = label.text.includes('Sell');
              const parts = label.text.split(' ');
              const volText = parts.length > 1 ? parts[0] : '';
              const actionText = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
              const mainColor = isSell ? '#ef4444' : '#00b4d8';
              const posY = isSell ? y - 10 : y + 18;

              ctx.font = 'bold 11px "JetBrains Mono", monospace';
              const volWidth = volText ? ctx.measureText(volText + ' ').width : 0;
              ctx.font = '900 12px "Inter", sans-serif';
              const actionWidth = ctx.measureText(actionText).width;
              const totalW = volWidth + actionWidth;
              const startX = x - totalW / 2;

              if (volText) {
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.fillStyle = mainColor;
                ctx.textAlign = 'left';
                ctx.fillText(volText, startX, posY);
              }

              ctx.font = '900 12px "Inter", sans-serif';
              ctx.fillStyle = isDark ? '#ffffff' : '#111827';
              ctx.textAlign = 'left';
              ctx.fillText(actionText, startX + volWidth, posY);
            }
            // F. Standard Badge / Text Label
            else {
              const padding = 6;
              const isBadge = !!label.badge && label.color && label.color !== 'transparent' && label.color !== 'none' && label.color !== 'rgba(0,0,0,0)';
              const isSwingLow = label.text === 'SL' || label.text === 'LL' || label.text === 'HL';
              
              if (isBadge) {
                ctx.font = 'bold 9.5px "JetBrains Mono", Inter, sans-serif';
                const textWidth = ctx.measureText(label.text).width;
                const badgeY = isSwingLow ? y + 4 : y - 20;
                const textY = isSwingLow ? y + 17 : y - 7;
                ctx.fillStyle = label.color;
                ctx.beginPath();
                ctx.roundRect(x - textWidth / 2 - padding, badgeY, textWidth + padding * 2, 17, 3);
                ctx.fill();
                ctx.fillStyle = label.textcolor || '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(label.text, x, textY);
              } else {
                ctx.font = 'bold 10px "JetBrains Mono", Inter, sans-serif';
                // Text shadow / subtle dark backing for standalone text visibility
                ctx.fillStyle = label.textcolor || '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(label.text, x, isSwingLow ? y + 14 : y - 6);
              }
            }
          }
        });
        ctx.restore();

        // 1.6 Render Boxes (Supply/Demand Zones, FVGs, Sessions)
        if (data.boxes && data.boxes.length > 0) {
          ctx.save();
          data.boxes.forEach(box => {
            let x1 = getXFromTime(timeScale, box.x1, currentCandles);
            let x2 = getXFromTime(timeScale, box.x2, currentCandles);
            const y1 = series.priceToCoordinate(box.y1);
            const y2 = series.priceToCoordinate(box.y2);

            // If both points are completely outside the coordinate system, skip
            if (x1 === null && x2 === null) return;

            if (x1 === null && x2 !== null) x1 = -20;
            if (x1 !== null && x2 === null) {
              x2 = lastCandleX !== null ? lastCandleX : (x1 + 30);
            }

            // Strictly clamp x2 so it NEVER goes past the last forming candle
            if (lastCandleX !== null && x2 !== null && x2 > lastCandleX + 4) {
              x2 = lastCandleX + 4;
            }

            // Support for full-height vertical session bands (clean background fill without dotted lines)
            if (box.isVerticalBand) {
              if (x1 !== null && x2 !== null) {
                if ((x1 < -100 && x2 < -100) || (x1 > width + 100 && x2 > width + 100)) return;

                const bx = Math.min(x1, x2);
                const bw = Math.max(Math.abs(x2 - x1), 4);
                const by = 0;
                const bh = height;

                if (box.color && box.color !== 'transparent') {
                  ctx.fillStyle = box.color;
                  ctx.fillRect(bx, by, bw, bh);
                }
              }
              return;
            }

            if (x1 !== null && x2 !== null && y1 !== null && y2 !== null) {
              // If both points are off the same side of the screen, skip rendering
              if ((x1 < -50 && x2 < -50) || (x1 > width + 50 && x2 > width + 50)) return;

              const bx = Math.min(x1, x2);
              const bw = Math.max(Math.abs(x2 - x1), 15);
              const by = Math.min(y1, y2);
              const bh = Math.max(Math.abs(y2 - y1), 3);

              ctx.fillStyle = box.color;
              ctx.fillRect(bx, by, bw, bh);

              ctx.strokeStyle = box.bordercolor;
              ctx.lineWidth = 1;
              if (box.borderstyle === 'dashed') ctx.setLineDash([5, 5]);
              else if (box.borderstyle === 'dotted') ctx.setLineDash([2, 4]);
              else ctx.setLineDash([]);
              ctx.strokeRect(bx, by, bw, bh);

              if (box.label && bx < width - 20 && (bx + bw) > 0 && bw >= 16) {
                if (box.label === 'FVG') {
                  ctx.font = 'bold 10px "JetBrains Mono", Inter, sans-serif';
                  ctx.fillStyle = isDark ? '#d1d4dc' : '#131722';
                  ctx.textAlign = 'left';
                  ctx.fillText('FVG', bx + bw + 4, by + bh / 2 + 3.5);
                } else if (box.label.includes('Session') || box.label.includes('(Live)')) {
                  const labelX = Math.max(bx + 6, 8);
                  if (labelX < width - 60) {
                    ctx.font = 'bold 9.5px "JetBrains Mono", Inter, sans-serif';
                    const textW = ctx.measureText(box.label).width;
                    ctx.fillStyle = isDark ? 'rgba(19, 23, 34, 0.85)' : 'rgba(255, 255, 255, 0.9)';
                    ctx.beginPath();
                    ctx.roundRect(labelX - 3, by + 3, textW + 8, 16, 2.5);
                    ctx.fill();
                    ctx.strokeStyle = box.bordercolor;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                    ctx.fillStyle = box.bordercolor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(box.label, labelX + 1, by + 11);
                  }
                } else {
                  const labelX = Math.max(bx + 5, 8);
                  if (labelX < width - 40) {
                    ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
                    ctx.fillStyle = box.bordercolor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillText(box.label, labelX, by + 12);
                  }
                }
              }
            }
          });
          ctx.restore();
        }

        // 1.7 Render Bands (e.g. Bollinger Bands cloud fill)
        if (data.bands && data.bands.length > 0) {
          ctx.save();
          data.bands.forEach(band => {
            const upper = data.plots[band.upperIndex];
            const lower = data.plots[band.lowerIndex];
            if (upper && lower && upper.length > 1 && lower.length > 1) {
              ctx.beginPath();
              let first = true;
              for (let i = 0; i < upper.length; i++) {
                const pt = upper[i];
                if (pt.value === null) continue;
                const x = getXFromTime(timeScale, pt.time, currentCandles);
                const y = series.priceToCoordinate(pt.value);
                if (x === null || y === null) continue;
                if (first) {
                  ctx.moveTo(x, y);
                  first = false;
                } else {
                  ctx.lineTo(x, y);
                }
              }
              for (let i = lower.length - 1; i >= 0; i--) {
                const pt = lower[i];
                if (pt.value === null) continue;
                const x = getXFromTime(timeScale, pt.time, currentCandles);
                const y = series.priceToCoordinate(pt.value);
                if (x === null || y === null) continue;
                ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.fillStyle = band.color;
              ctx.fill();
            }
          });
          ctx.restore();
        }

        // 1.8 Render Footprint Order Flow Clusters & Direction Intelligence
        if (data.footprints && data.footprints.length > 0) {
          ctx.save();

          // Calculate visible candle width / column spacing
          let avgBarSpacing = 72;
          if (data.footprints.length >= 2) {
            const x0 = getXFromTime(timeScale, data.footprints[0].time, currentCandles);
            const x1 = getXFromTime(timeScale, data.footprints[1].time, currentCandles);
            if (x0 !== null && x1 !== null) {
              avgBarSpacing = Math.max(48, Math.min(120, Math.abs(x1 - x0)));
            }
          }

          const rowW = Math.max(68, Math.min(94, avgBarSpacing * 0.94));
          const rowH = 13.5;

          const formatFpVol = (v: number) => {
            if (v >= 1000) return `${(v / 1000).toFixed(2)}K`;
            return `${v}`;
          };

          // 1. Draw Connecting Step-Ladder Lines between adjacent candle baselines
          for (let i = 0; i < data.footprints.length - 1; i++) {
            const fp = data.footprints[i];
            const nextFp = data.footprints[i + 1];
            const x1 = getXFromTime(timeScale, fp.time, currentCandles);
            const x2 = getXFromTime(timeScale, nextFp.time, currentCandles);
            if (x1 === null || x2 === null || x1 < -100 || x2 > width + 100) continue;

            const isBull = fp.close >= fp.open;
            const stepY = series.priceToCoordinate(fp.low);
            const nextStepY = series.priceToCoordinate(nextFp.low);

            if (stepY !== null && nextStepY !== null) {
              ctx.strokeStyle = isBull ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x1 - rowW / 2 - 8, stepY);
              ctx.lineTo(x2 - rowW / 2 - 8, stepY);
              ctx.lineTo(x2 - rowW / 2 - 8, nextStepY);
              ctx.stroke();
            }
          }

          // 2. Render each footprint candle column
          let totalCumDelta = 0;
          let maxObservedDelta = -Infinity;
          let minObservedDelta = Infinity;
          let latestFp = data.footprints[data.footprints.length - 1];

          data.footprints.forEach(fp => {
            totalCumDelta += fp.delta;
            if (fp.delta > maxObservedDelta) maxObservedDelta = fp.delta;
            if (fp.delta < minObservedDelta) minObservedDelta = fp.delta;

            const x = getXFromTime(timeScale, fp.time, currentCandles);
            if (x === null || x < -120 || x > width + 120) return;

            const isBullishCandle = fp.close >= fp.open;
            const openY = series.priceToCoordinate(fp.open);
            const closeY = series.priceToCoordinate(fp.close);
            const highY = series.priceToCoordinate(fp.high);
            const lowY = series.priceToCoordinate(fp.low);

            const candleBarX = x - rowW / 2 - 7;
            const candleBarW = 3.5;

            // 2.1 Left Candlestick Spine (Wick + Body)
            if (openY !== null && closeY !== null && highY !== null && lowY !== null) {
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
              const candleColor = isBullishCandle ? '#16a34a' : '#dc2626';

              // Wick
              ctx.strokeStyle = candleColor;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(candleBarX + candleBarW / 2, highY);
              ctx.lineTo(candleBarX + candleBarW / 2, lowY);
              ctx.stroke();

              // Solid candle body bar
              ctx.fillStyle = candleColor;
              ctx.fillRect(candleBarX, bodyTop, candleBarW, bodyHeight);

              // Top Delta Label (Δ)
              const deltaTopY = highY - 8;
              if (deltaTopY > 15 && deltaTopY < height - 10) {
                const deltaColor = fp.delta >= 0 ? '#16a34a' : '#dc2626';
                const deltaStr = fp.delta >= 0 ? `Δ${fp.delta}` : `Δ${fp.delta}`;
                ctx.font = 'bold 11px "JetBrains Mono", monospace';
                ctx.fillStyle = deltaColor;
                ctx.textAlign = 'center';
                ctx.fillText(deltaStr, x, deltaTopY);
              }
            }

            // 2.2 Footprint Order Flow Clusters (Horizontal Bars & Bid X Ask Text)
            const maxClusterVol = Math.max(...fp.clusters.map(c => c.bid + c.ask), 1);

            fp.clusters.forEach(cl => {
              const y = series.priceToCoordinate(cl.price);
              if (y === null || y < -20 || y > height + 20) return;

              const rowVol = cl.bid + cl.ask;
              const rowDelta = cl.ask - cl.bid;
              const boxX = x - rowW / 2;

              const isHighBuyImbalance = cl.isStackedBuyImbalance || (cl.isPOC && isBullishCandle) || (cl.isBuyImbalance && rowVol >= maxClusterVol * 0.55);
              const isHighSellImbalance = cl.isStackedSellImbalance || (cl.isPOC && !isBullishCandle) || (cl.isSellImbalance && rowVol >= maxClusterVol * 0.55);

              let textColor = isDark ? '#e2e8f0' : '#1e293b';

              if (isHighBuyImbalance) {
                // Saturated Green Box with crisp black border
                ctx.fillStyle = '#48bb78';
                ctx.fillRect(boxX, y - rowH / 2 + 0.5, rowW, rowH);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX, y - rowH / 2 + 0.5, rowW, rowH);
                textColor = '#000000';
              } else if (isHighSellImbalance) {
                // Saturated Red Box with crisp black border
                ctx.fillStyle = '#f87171';
                ctx.fillRect(boxX, y - rowH / 2 + 0.5, rowW, rowH);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX, y - rowH / 2 + 0.5, rowW, rowH);
                textColor = '#000000';
              } else if (rowVol > 8) {
                // Volume profile histogram bar
                const barWidth = Math.max(8, (rowVol / maxClusterVol) * (rowW - 4));
                if (rowDelta >= 0) {
                  ctx.fillStyle = isDark ? 'rgba(74, 222, 128, 0.35)' : '#bbf7d0';
                } else {
                  ctx.fillStyle = isDark ? 'rgba(248, 113, 113, 0.35)' : '#fecaca';
                }
                ctx.fillRect(boxX, y - rowH / 2 + 0.5, barWidth, rowH);
              }

              // Text formatting: Bid X Ask
              ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
              const bidFormatted = formatFpVol(cl.bid);
              const askFormatted = formatFpVol(cl.ask);

              // Bid (Left number)
              ctx.textAlign = 'right';
              ctx.fillStyle = textColor;
              ctx.fillText(bidFormatted, x - 4, y + 3.5);

              // Multiplier / Separator (X)
              ctx.textAlign = 'center';
              ctx.fillStyle = (isHighBuyImbalance || isHighSellImbalance) ? '#000000' : (isDark ? '#94a3b8' : '#64748b');
              ctx.fillText('X', x, y + 3.5);

              // Ask (Right number)
              ctx.textAlign = 'left';
              ctx.fillStyle = textColor;
              ctx.fillText(askFormatted, x + 4, y + 3.5);
            });
          });

          // 3. Top-Right Order Flow HUD Stats Card
          if (latestFp) {
            const cardW = 145;
            const cardH = 82;
            const cardX = width - cardW - 12;
            const cardY = 12;

            ctx.fillStyle = isDark ? 'rgba(19, 23, 34, 0.88)' : 'rgba(255, 255, 255, 0.94)';
            ctx.strokeStyle = isDark ? '#2a2e39' : '#e0e3eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 4);
            ctx.fill();
            ctx.stroke();

            const deltaPct = latestFp.volume > 0 ? ((latestFp.delta / latestFp.volume) * 100).toFixed(2) : '0.00';
            const deltaColor = latestFp.delta >= 0 ? '#16a34a' : '#dc2626';

            ctx.font = '10px "Inter", sans-serif';
            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            ctx.textAlign = 'left';

            ctx.fillText('Delta', cardX + 8, cardY + 16);
            ctx.fillText('Max Delta', cardX + 8, cardY + 34);
            ctx.fillText('Min Delta', cardX + 8, cardY + 52);
            ctx.fillText('Cum. Delta', cardX + 8, cardY + 70);

            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';

            ctx.fillStyle = deltaColor;
            ctx.fillText(`${latestFp.delta > 0 ? '+' : ''}${latestFp.delta}  ${deltaPct}%`, cardX + cardW - 8, cardY + 16);

            ctx.fillStyle = '#16a34a';
            ctx.fillText(`+${Math.max(0, maxObservedDelta)}`, cardX + cardW - 8, cardY + 34);

            ctx.fillStyle = '#dc2626';
            ctx.fillText(`${minObservedDelta < 0 ? minObservedDelta : 0}`, cardX + cardW - 8, cardY + 52);

            ctx.fillStyle = totalCumDelta >= 0 ? '#16a34a' : '#dc2626';
            ctx.fillText(`${totalCumDelta > 0 ? '+' : ''}${totalCumDelta.toLocaleString()}`, cardX + cardW - 8, cardY + 70);
          }

          ctx.restore();
        }

        // 1.9 Render Entry Price Line
        if (data.currentEntryPrice) {
          const y = series.priceToCoordinate(data.currentEntryPrice);
          if (y !== null) {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            ctx.fillStyle = '#2962ff';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('ENTRY ' + data.currentEntryPrice.toFixed(2), 15, y - 5);
            ctx.restore();
          }
        }
      });

      // 2. Render Drawings
      const currentDrawings = drawingsRef.current.filter(d => !d.symbol || d.symbol === symbolRef.current || d.symbol === (symbolRef.current || ''));
      currentDrawings.forEach(drawing => {
        if (drawing.hidden) return;
        const isSelected = drawing.id === currentSelectedId;
        const drawingColor = drawing.color || '#2962ff';
        ctx.save();
        ctx.strokeStyle = drawingColor;
        ctx.fillStyle = drawingColor;
        ctx.lineWidth = drawing.lineWidth || (isSelected ? 2 : 1.5);

      if (drawing.type === 'Horizontal line') {
        const y = series.priceToCoordinate(drawing.data.price);
        if (y !== null) {
          ctx.beginPath();
          if (!isSelected) ctx.setLineDash([5, 5]);
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          if (isSelected) {
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.beginPath();
            ctx.arc(width / 2, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (drawing.type === 'Horizontal ray') {
        const y = series.priceToCoordinate(drawing.data.price);
        const x = getXFromTime(timeScale, drawing.data.time, currentCandles);
        if (y !== null && x !== null) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          
          ctx.fillStyle = drawingColor;
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 4 : 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (drawing.type === 'Vertical line') {
        const x = getXFromTime(timeScale, drawing.data.time, currentCandles);
        if (x !== null) {
          ctx.beginPath();
          if (!isSelected) ctx.setLineDash([5, 5]);
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          ctx.setLineDash([]);

          if (isSelected) {
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.beginPath();
            ctx.arc(x, height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (drawing.type === 'Cross line') {
        const x = getXFromTime(timeScale, drawing.data.time, currentCandles);
        const y = series.priceToCoordinate(drawing.data.price);
        if (x !== null && y !== null) {
          ctx.beginPath();
          ctx.moveTo(x, 0); ctx.lineTo(x, height);
          ctx.moveTo(0, y); ctx.lineTo(width, y);
          ctx.stroke();
          
          ctx.fillStyle = drawingColor;
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 4 : 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (drawing.type === 'Trendline' || drawing.type === 'Ray' || drawing.type === 'Extended line' || drawing.type === 'Trend angle' || drawing.type === 'Info line') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          ctx.beginPath();
          if (drawing.type === 'Trendline' || drawing.type === 'Info line') {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else if (drawing.type === 'Ray') {
            const dx = x2 - x1;
            const dy = y2 - y1;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + dx * 100, y1 + dy * 100);
          } else if (drawing.type === 'Extended line') {
            const dx = x2 - x1;
            const dy = y2 - y1;
            ctx.moveTo(x1 - dx * 100, y1 - dy * 100);
            ctx.lineTo(x1 + dx * 100, y1 + dy * 100);
          } else if (drawing.type === 'Trend angle') {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            // Display angle
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            ctx.save();
            ctx.fillStyle = drawingColor;
            ctx.font = '10px Inter';
            ctx.fillText(`${(-angle).toFixed(1)}°`, x2 + 5, y2 - 5);
            ctx.restore();
          }
          ctx.stroke();

          if (drawing.type === 'Info line') {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const priceDiff = drawing.data.end.price - drawing.data.start.price;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            ctx.save();
            ctx.fillStyle = drawingColor;
            ctx.font = '10px Inter';
            ctx.fillText(`${priceDiff.toFixed(5)} (${((priceDiff/drawing.data.start.price)*100).toFixed(2)}%)`, midX, midY - 10);
            ctx.restore();
          }
          
          // Endpoints & Handles
          if (isSelected) {
            ctx.save();
            // Start endpoint handle (for resizing/expanding/reducing start point)
            ctx.beginPath();
            ctx.arc(x1, y1, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = drawingColor;
            ctx.stroke();

            // End endpoint handle (for resizing/expanding/reducing end point)
            ctx.beginPath();
            ctx.arc(x2, y2, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = drawingColor;
            ctx.stroke();

            // Middle handle (for translation / whole-line move)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 4, 0, Math.PI * 2);
            ctx.fillStyle = drawingColor;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.fillStyle = drawingColor;
            [ [x1, y1], [x2, y2] ].forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }
      } else if (drawing.type === 'Fib retracement') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const DEFAULT_FIB_LEVELS = [
            { level: 0, color: '#787b86', active: true },
            { level: 0.236, color: '#f23645', active: true },
            { level: 0.382, color: '#ff9800', active: true },
            { level: 0.5, color: '#4caf50', active: true },
            { level: 0.618, color: '#089981', active: true },
            { level: 0.786, color: '#2962ff', active: true },
            { level: 1, color: '#9c27b0', active: true },
            { level: 1.618, color: '#2962ff', active: true },
            { level: 2.618, color: '#f23645', active: false },
            { level: 3.618, color: '#9c27b0', active: false },
            { level: 4.236, color: '#e91e63', active: false },
            { level: -0.236, color: '#f23645', active: false },
            { level: -0.618, color: '#089981', active: false },
            { level: -2.618, color: '#2962ff', active: false },
            { level: 1.272, color: '#787b86', active: false },
            { level: 1.414, color: '#f23645', active: false },
          ];
          
          let rawLevels = drawing.data?.fibLevels || DEFAULT_FIB_LEVELS;
          let activeLevels = rawLevels.filter((l: any) => l.active).sort((a: any, b: any) => a.level - b.level);
          
          const isReverse = drawing.data?.fibReverse || false;
          const extendLeft = drawing.data?.fibExtendLeft || false;
          const extendRight = drawing.data?.fibExtendRight || false;
          const useOneColor = drawing.data?.fibUseOneColor || false;
          const oneColor = drawing.data?.fibOneColor || '#2962ff';
          const fillBackground = drawing.data?.fibBackground !== false;

          let diff = drawing.data.end.price - drawing.data.start.price;
          
          let lineLeft = extendLeft ? 0 : Math.min(x1, x2);
          let lineRight = extendRight ? width : Math.max(x1, x2);
          
          const isRainbow = drawing.color === 'rainbow';
          const FIB_COLORS = ['#787b86', '#f23645', '#ff9800', '#4caf50', '#089981', '#2962ff', '#9c27b0'];
          
          ctx.lineWidth = drawing.lineWidth || 1;

          // Draw Trend Line
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = drawingColor;
          ctx.stroke();
          ctx.restore();

          // Draw Backgrounds
          if (fillBackground && activeLevels.length > 1) {
            for (let i = 0; i < activeLevels.length - 1; i++) {
              const lvl1 = activeLevels[i];
              const lvl2 = activeLevels[i+1];
              
              const calcLevel1 = isReverse ? (1 - lvl1.level) : lvl1.level;
              const calcLevel2 = isReverse ? (1 - lvl2.level) : lvl2.level;
              
              const price1 = drawing.data.start.price + diff * calcLevel1;
              const price2 = drawing.data.start.price + diff * calcLevel2;
              
              const py1 = series.priceToCoordinate(price1);
              const py2 = series.priceToCoordinate(price2);
              
              if (py1 !== null && py2 !== null) {
                const color = useOneColor ? oneColor : (isRainbow ? FIB_COLORS[i % FIB_COLORS.length] : lvl1.color);
                ctx.fillStyle = color + '1a'; // 10% opacity
                ctx.fillRect(lineLeft, Math.min(py1, py2), lineRight - lineLeft, Math.abs(py1 - py2));
              }
            }
          }

          // Draw Lines and Text
          activeLevels.forEach((lvl: any, idx: number) => {
            const calcLevel = isReverse ? (1 - lvl.level) : lvl.level;
            const price = drawing.data.start.price + diff * calcLevel;
            const y = series.priceToCoordinate(price);
            if (y !== null) {
              const color = useOneColor ? oneColor : (isRainbow ? FIB_COLORS[idx % FIB_COLORS.length] : lvl.color);
              ctx.strokeStyle = color;
              
              ctx.beginPath();
              ctx.moveTo(lineLeft, y);
              ctx.lineTo(lineRight, y);
              ctx.stroke();
              
              ctx.save();
              ctx.font = '10px Inter';
              ctx.fillStyle = color;
              ctx.fillText(`${lvl.level} (${price.toFixed(5)})`, lineLeft + 5, y - 2);
              ctx.restore();
            }
          });

          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y2]].forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 5.5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = isRainbow ? '#2962ff' : drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Rectangle' || drawing.type === 'Flat top/bottom' || drawing.type === 'Price range' || drawing.type === 'Date range') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const width = x2 - x1;
          const height = y2 - y1;
          
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          
          if (drawing.type === 'Price range') {
            ctx.fillStyle = '#2962ff';
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#2962ff';
            ctx.stroke();
            
            // Labels
            const priceDiff = drawing.data.end.price - drawing.data.start.price;
            const percent = (priceDiff / drawing.data.start.price) * 100;
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${priceDiff.toFixed(5)} (${percent.toFixed(2)}%)`, x1 + width/2, y1 + height/2);
            ctx.textAlign = 'start';
          } else if (drawing.type === 'Date range') {
            ctx.fillStyle = '#2962ff';
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#2962ff';
            ctx.stroke();
            
            // Bars count (simplified)
            const bars = Math.abs(candles.findIndex(c => (typeof c.time === 'number' ? c.time : new Date(c.time as string).getTime()/1000) === drawing.data.start.time) - 
                         candles.findIndex(c => (typeof c.time === 'number' ? c.time : new Date(c.time as string).getTime()/1000) === drawing.data.end.time));
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${bars} bars`, x1 + width/2, y1 + height/2);
            ctx.textAlign = 'start';
          } else {
            ctx.globalAlpha = isSelected ? 0.2 : 0.1;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.stroke();
          }
          
          if (drawing.type === 'Flat top/bottom') {
            ctx.beginPath();
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y1);
            ctx.lineWidth = (drawing.lineWidth || 1.5) * 2;
            ctx.stroke();
            ctx.lineWidth = drawing.lineWidth || 1.5;
          }

          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Circle') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          ctx.beginPath();
          ctx.arc(x1, y1, radius, 0, Math.PI * 2);
          ctx.globalAlpha = 0.1;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          
          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y2]].forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Triangle') {
        const x1 = getXFromTime(timeScale, drawing.data.p1.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.p1.price);
        const x2 = getXFromTime(timeScale, drawing.data.p2.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.p2.price);
        const x3 = getXFromTime(timeScale, drawing.data.p3.time, currentCandles);
        const y3 = series.priceToCoordinate(drawing.data.p3.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null && x3 !== null && y3 !== null) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.closePath();
          ctx.globalAlpha = 0.1;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();

          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y2], [x3, y3]].forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Arrow') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLen = 15;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (drawing.type === 'Long position' || drawing.type === 'Short position') {
        const xentry = getXFromTime(timeScale, drawing.data.entry.time, currentCandles);
        const yentry = series.priceToCoordinate(drawing.data.entry.price);
        const ytp = series.priceToCoordinate(drawing.data.tp.price);
        const ysl = series.priceToCoordinate(drawing.data.sl.price);
        const xend = getXFromTime(timeScale, drawing.data.end?.time || ((drawing.data.entry.time as number) + 3600 * 20), currentCandles);

        if (xentry !== null && yentry !== null && ytp !== null && ysl !== null && xend !== null) {
          const isLong = drawing.type === 'Long position';
          const entryPrice = drawing.data.entry.price;
          const tpPrice = drawing.data.tp.price;
          const slPrice = drawing.data.sl.price;

          const boxLeft = Math.min(xentry, xend);
          const boxRight = Math.max(xentry, xend);
          const boxWidth = Math.max(30, boxRight - boxLeft);
          const midX = (boxLeft + boxRight) / 2;

          // Target diff & Stop diff
          const targetDiff = Math.abs(tpPrice - entryPrice);
          const stopDiff = Math.abs(slPrice - entryPrice);
          const targetPct = entryPrice > 0 ? (targetDiff / entryPrice) * 100 : 0;
          const stopPct = entryPrice > 0 ? (stopDiff / entryPrice) * 100 : 0;

          // Precision calculation
          const decimals = entryPrice > 1000 ? 2 : (entryPrice > 1 ? 3 : 5);
          const mult = Math.pow(10, decimals);
          const targetTicks = Math.round(targetDiff * mult).toLocaleString();
          const stopTicks = Math.round(stopDiff * mult).toLocaleString();

          // Account sizing and amounts
          const riskAmount = drawing.data.riskAmount || 750;
          const ratio = stopDiff > 0 ? targetDiff / stopDiff : 1;
          const rewardAmount = drawing.data.rewardAmount || Math.round(riskAmount * ratio);
          const qty = drawing.data.qty || 3;

          // Target and Stop Y levels
          const targetYTop = isLong ? ytp : yentry;
          const targetYBottom = isLong ? yentry : ytp;
          const targetHeight = Math.abs(targetYBottom - targetYTop);

          const stopYTop = isLong ? yentry : ysl;
          const stopYBottom = isLong ? ysl : yentry;
          const stopHeight = Math.abs(stopYBottom - stopYTop);

          // Determine trade execution status from candles (if candles reached entry or beyond)
          const c = candlesRef.current;
          let isTriggered = false;
          let isClosed = false;
          let hitTarget = false;
          let hitStop = false;
          let currentPrice = entryPrice;
          let progressX = boxLeft;
          let progressY = yentry;

          if (c && c.length > 0) {
            const entryTimeNum = typeof drawing.data.entry.time === 'number' 
              ? drawing.data.entry.time 
              : Math.floor(new Date(drawing.data.entry.time).getTime() / 1000);
            const endTimeNum = typeof (drawing.data.end?.time || entryTimeNum + 86400 * 10) === 'number' 
              ? (drawing.data.end?.time || entryTimeNum + 86400 * 10) 
              : Math.floor(new Date(drawing.data.end?.time).getTime() / 1000);

            const activeCandles = c.filter(candle => {
              const candleTime = typeof candle.time === 'number' ? candle.time : Math.floor(new Date(candle.time).getTime() / 1000);
              return candleTime >= entryTimeNum && candleTime <= endTimeNum;
            });

            if (activeCandles.length > 0) {
              let triggeredIdx = -1;
              for (let i = 0; i < activeCandles.length; i++) {
                const cand = activeCandles[i];
                if (cand.low <= entryPrice && cand.high >= entryPrice) {
                  triggeredIdx = i;
                  break;
                }
                if (i > 0) {
                  const prev = activeCandles[i - 1];
                  if ((prev.close < entryPrice && cand.open > entryPrice) || 
                      (prev.close > entryPrice && cand.open < entryPrice)) {
                    triggeredIdx = i;
                    break;
                  }
                }
              }

              if (triggeredIdx !== -1) {
                isTriggered = true;
                const relevantCandles = activeCandles.slice(triggeredIdx);
                const lastActive = relevantCandles[relevantCandles.length - 1];
                currentPrice = lastActive.close;
                const lastCandleTime = typeof lastActive.time === 'number' ? lastActive.time : Math.floor(new Date(lastActive.time).getTime() / 1000);
                const cx = getXFromTime(timeScale, lastCandleTime, currentCandles);
                if (cx !== null) {
                  progressX = Math.min(boxRight, Math.max(boxLeft, cx));
                }

                for (const cand of relevantCandles) {
                  if (isLong) {
                    if (cand.high >= tpPrice) { hitTarget = true; isClosed = true; break; }
                    if (cand.low <= slPrice) { hitStop = true; isClosed = true; break; }
                  } else {
                    if (cand.low <= tpPrice) { hitTarget = true; isClosed = true; break; }
                    if (cand.high >= slPrice) { hitStop = true; isClosed = true; break; }
                  }
                }

                if (hitTarget) {
                  progressY = ytp;
                } else if (hitStop) {
                  progressY = ysl;
                } else {
                  progressY = series.priceToCoordinate(currentPrice) ?? yentry;
                }
              }
            }
          }

          // Calculate PnL
          let pnlValue = 0;
          if (hitTarget) {
            pnlValue = rewardAmount;
          } else if (hitStop) {
            pnlValue = -riskAmount;
          } else {
            const priceDiffNow = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
            pnlValue = stopDiff > 0 ? (priceDiffNow / stopDiff) * riskAmount : 0;
          }

          const inProfit = pnlValue >= 0;

          const customTargetColor = drawing.color || drawing.data?.targetColor;
          const customStopColor = drawing.data?.stopColor;
          const showBadges = drawing.data?.showBadges !== false;
          const showStatusCard = drawing.data?.showStatusCard !== false;

          // 1. Draw Target Box
          ctx.save();
          if (customTargetColor) {
            ctx.fillStyle = `${customTargetColor}55`;
            ctx.fillRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
            ctx.strokeStyle = customTargetColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
          } else if (isLong) {
            // Long Target Zone: Blue fill
            ctx.fillStyle = 'rgba(30, 80, 225, 0.45)';
            ctx.fillRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
            ctx.strokeStyle = 'rgba(41, 98, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
          } else {
            // Short Target Zone: Green fill
            ctx.fillStyle = 'rgba(21, 128, 61, 0.45)';
            ctx.fillRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxLeft, Math.min(targetYTop, targetYBottom), boxWidth, targetHeight);
          }
          ctx.restore();

          // 2. Draw Stop Loss Box
          ctx.save();
          if (customStopColor) {
            ctx.fillStyle = `${customStopColor}55`;
            ctx.fillRect(boxLeft, Math.min(stopYTop, stopYBottom), boxWidth, stopHeight);
            ctx.strokeStyle = customStopColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(boxLeft, Math.min(stopYTop, stopYBottom), boxWidth, stopHeight);
          } else {
            ctx.fillStyle = 'rgba(127, 29, 29, 0.40)';
            ctx.fillRect(boxLeft, Math.min(stopYTop, stopYBottom), boxWidth, stopHeight);
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxLeft, Math.min(stopYTop, stopYBottom), boxWidth, stopHeight);
          }
          ctx.restore();

          // 3. Draw Active Candlestick Progress Area & Trajectory Line
          if (isTriggered && progressX > boxLeft) {
            ctx.save();
            const activeWidth = progressX - boxLeft;
            if (inProfit) {
              ctx.fillStyle = isLong ? 'rgba(37, 99, 235, 0.28)' : 'rgba(22, 163, 74, 0.32)';
              const activeY = isLong ? Math.min(yentry, progressY) : yentry;
              const activeH = Math.abs(progressY - yentry);
              ctx.fillRect(boxLeft, activeY, activeWidth, activeH);
            } else {
              ctx.fillStyle = 'rgba(220, 38, 38, 0.28)';
              const activeY = isLong ? yentry : Math.min(yentry, progressY);
              const activeH = Math.abs(progressY - yentry);
              ctx.fillRect(boxLeft, activeY, activeWidth, activeH);
            }

            // Subtle dashed trajectory path from entry to progress
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(boxLeft, yentry);
            ctx.lineTo(progressX, progressY);
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }

          // 4. Entry Line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(boxLeft, yentry);
          ctx.lineTo(boxRight, yentry);
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          // Only display written metric pill badges, middle PnL card, and resize handles when selected
          if (isSelected) {
            // Helper for drawing rounded pill badge
            const drawPillBadge = (text: string, cx: number, cy: number, bg: string) => {
              ctx.save();
              ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif';
              const m = ctx.measureText(text);
              const padX = 8;
              const bw = m.width + padX * 2;
              const bh = 19;
              const bx = Math.round(cx - bw / 2);
              const by = Math.round(cy - bh / 2);

              ctx.fillStyle = bg;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(bx, by, bw, bh, 4);
              } else {
                ctx.rect(bx, by, bw, bh);
              }
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, cx, cy);
              ctx.restore();
            };

            // 5. Top Badge
            if (isLong) {
              const topText = `Target: ${targetDiff.toFixed(decimals)} (${targetPct.toFixed(3)}%) ${targetTicks}, Amount: ${rewardAmount}`;
              drawPillBadge(topText, midX, ytp - 10, '#2563eb');
            } else {
              const topText = `Stop: ${stopDiff.toFixed(decimals)} (${stopPct.toFixed(3)}%) ${stopTicks}, Amount: ${riskAmount}`;
              drawPillBadge(topText, midX, ysl - 10, '#dc2626');
            }

            // 6. Bottom Badge
            if (isLong) {
              const bottomText = `Stop: ${stopDiff.toFixed(decimals)} (${stopPct.toFixed(3)}%) ${stopTicks}, Amount: ${riskAmount}`;
              drawPillBadge(bottomText, midX, ysl + 10, '#dc2626');
            } else {
              const bottomText = `Target: ${targetDiff.toFixed(decimals)} (${targetPct.toFixed(3)}%) ${targetTicks}, Amount: ${rewardAmount}`;
              drawPillBadge(bottomText, midX, ytp + 10, '#16a34a');
            }

            // 7. Middle Status & PnL Card (Floating rounded card with crisp white border)
            const pnlFormatted = `${pnlValue >= 0 ? '' : '-'}${Math.abs(pnlValue).toFixed(decimals)}`;
            const pnlText = `${isClosed ? 'Closed PnL' : 'Open PnL'}: ${pnlFormatted}, Qty: ${qty}`;
            const rrText = `Risk/reward ratio: ${ratio >= 1 && Number.isInteger(ratio) ? ratio : ratio.toFixed(2)}`;

            ctx.save();
            ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif';
            const m1 = ctx.measureText(pnlText);
            const m2 = ctx.measureText(rrText);
            const cardW = Math.max(m1.width, m2.width) + 22;
            const cardH = 36;
            const cardX = Math.round(midX - cardW / 2);
            const cardY = Math.round(yentry - cardH / 2);

            // Card Background
            ctx.fillStyle = inProfit ? '#16a34a' : '#7f1d1d';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(cardX, cardY, cardW, cardH, 5);
            } else {
              ctx.rect(cardX, cardY, cardW, cardH);
            }
            ctx.fill();

            // Card White Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Card Text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pnlText, midX, cardY + 11);
            ctx.fillText(rrText, midX, cardY + 25);
            ctx.restore();

            // 8. Handles (Rounded-square blue rings with hollow/dark center)
            const drawBlueSquareHandle = (hx: number, hy: number) => {
              const hSize = 8;
              ctx.save();
              ctx.fillStyle = '#0b0e14';
              ctx.strokeStyle = '#2962ff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(hx - hSize / 2, hy - hSize / 2, hSize, hSize, 2);
              } else {
                ctx.rect(hx - hSize / 2, hy - hSize / 2, hSize, hSize);
              }
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            };

            const topY = isLong ? ytp : ysl;
            const bottomY = isLong ? ysl : ytp;

            // Top handles (Target for Long, Stop for Short)
            drawBlueSquareHandle(boxLeft, topY);
            drawBlueSquareHandle(midX, topY);
            drawBlueSquareHandle(boxRight, topY);

            // Mid handles (Start entry time & End width expansion)
            drawBlueSquareHandle(boxLeft, yentry);
            drawBlueSquareHandle(boxRight, yentry);

            // Bottom handles (Stop for Long, Target for Short)
            drawBlueSquareHandle(boxLeft, bottomY);
            drawBlueSquareHandle(midX, bottomY);
            drawBlueSquareHandle(boxRight, bottomY);
          }
        }
      } else if (drawing.type === 'Gann box') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const levels = [0, 0.25, 0.382, 0.5, 0.618, 0.75, 1];
          const w = x2 - x1;
          const h = y2 - y1;
          levels.forEach(l => {
            // Horizontals
            const py = y1 + h * l;
            ctx.beginPath(); ctx.moveTo(x1, py); ctx.lineTo(x2, py); ctx.stroke();
            // Verticals
            const px = x1 + w * l;
            ctx.beginPath(); ctx.moveTo(px, y1); ctx.lineTo(px, y2); ctx.stroke();
          });
          ctx.globalAlpha = 0.1;
          ctx.fillRect(x1, y1, w, h);
          ctx.globalAlpha = 1;
        }
      } else if (drawing.type === 'Gann fan') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.end.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const ratios = [1/8, 1/4, 1/3, 1/2, 1, 2, 3, 4, 8];
          const dx = x2 - x1;
          const dy = y2 - y1;
          ratios.forEach(r => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + dx * 10, y1 + dy * r * 10);
            ctx.stroke();
          });
        }
      } else if (drawing.type === 'Parallel channel' || drawing.type === 'Disjoint channel') {
        const x1 = getXFromTime(timeScale, drawing.data.p1.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.p1.price);
        const x2 = getXFromTime(timeScale, drawing.data.p2.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.p2.price);
        const x3 = getXFromTime(timeScale, drawing.data.p3.time, currentCandles);
        const y3 = series.priceToCoordinate(drawing.data.p3.price);
        
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null && x3 !== null && y3 !== null) {
          const dx = x2 - x1;
          const dy = y2 - y1;
          const ox = x3 - x1;
          const oy = y3 - y1;
          const lenSq = dx * dx + dy * dy;
          const dot = lenSq === 0 ? 0 : (ox * dx + oy * dy) / lenSq;
          const px = x1 + dx * dot;
          const py = y1 + dy * dot;
          const offX = x3 - px;
          const offY = y3 - py;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.moveTo(x1 + offX, y1 + offY); ctx.lineTo(x2 + offX, y2 + offY);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.lineTo(x2 + offX, y2 + offY); ctx.lineTo(x1 + offX, y1 + offY);
          ctx.closePath();
          ctx.globalAlpha = isSelected ? 0.15 : 0.05;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          
          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y2], [x3, y3]].forEach(([p_x, p_y]) => {
              ctx.beginPath();
              ctx.arc(p_x, p_y, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Pitchfork') {
        const x1 = getXFromTime(timeScale, drawing.data.p1.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.p1.price);
        const x2 = getXFromTime(timeScale, drawing.data.p2.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.p2.price);
        const x3 = getXFromTime(timeScale, drawing.data.p3.time, currentCandles);
        const y3 = series.priceToCoordinate(drawing.data.p3.price);
        
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null && x3 !== null && y3 !== null) {
          const midX = (x2 + x3) / 2;
          const midY = (y2 + y3) / 2;
          const dx = midX - x1;
          const dy = midY - y1;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x1 + dx * 10, y1 + dy * 10);
          ctx.moveTo(x2, y2); ctx.lineTo(x2 + dx * 10, y2 + dy * 10);
          ctx.moveTo(x3, y3); ctx.lineTo(x3 + dx * 10, y3 + dy * 10);
          ctx.stroke();
          
          if (isSelected) {
            ctx.save();
            [[x1, y1], [x2, y2], [x3, y3]].forEach(([p_x, p_y]) => {
              ctx.beginPath();
              ctx.arc(p_x, p_y, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = drawingColor;
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      } else if (drawing.type === 'Regression trend') {
        const t1 = drawing.data.start.time;
        const t2 = drawing.data.end.time;
        const relevantCandles = candles.filter(c => {
          const ct = typeof c.time === 'number' ? c.time : (new Date(c.time as string).getTime() / 1000);
          return ct >= Math.min(t1, t2) && ct <= Math.max(t1, t2);
        });

        if (relevantCandles.length > 1) {
          const n = relevantCandles.length;
          let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
          relevantCandles.forEach((c, i) => {
            sumX += i;
            sumY += c.close;
            sumXY += i * c.close;
            sumX2 += i * i;
          });

          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;

          const yInitial = intercept;
          const yFinal = intercept + slope * (n - 1);

          const xStart = getXFromTime(timeScale, relevantCandles[0].time, currentCandles);
          const xEnd = getXFromTime(timeScale, relevantCandles[n-1].time, currentCandles);
          const yStart = series.priceToCoordinate(yInitial);
          const yEnd = series.priceToCoordinate(yFinal);

          if (xStart !== null && xEnd !== null && yStart !== null && yEnd !== null) {
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(xStart, yStart); ctx.lineTo(xEnd, yEnd);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Channels usually show std dev, for now just min/max or simple parallel
            let maxDev = 0;
            relevantCandles.forEach((c, i) => {
              const expected = intercept + slope * i;
              maxDev = Math.max(maxDev, Math.abs(c.close - expected));
            });
            
            const devY = series.priceToCoordinate(yInitial + maxDev)! - yStart;
            ctx.beginPath();
            ctx.moveTo(xStart, yStart + devY); ctx.lineTo(xEnd, yEnd + devY);
            ctx.moveTo(xStart, yStart - devY); ctx.lineTo(xEnd, yEnd - devY);
            ctx.stroke();
            
            ctx.globalAlpha = 0.05;
            ctx.beginPath();
            ctx.moveTo(xStart, yStart + devY); ctx.lineTo(xEnd, yEnd + devY);
            ctx.lineTo(xEnd, yEnd - devY); ctx.lineTo(xStart, yStart - devY);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }
      } else if (drawing.type === 'Trend-based fib extension' || drawing.type === 'Fib channel') {
        const x1 = getXFromTime(timeScale, drawing.data.p1.time, currentCandles);
        const y1 = series.priceToCoordinate(drawing.data.p1.price);
        const x2 = getXFromTime(timeScale, drawing.data.p2.time, currentCandles);
        const y2 = series.priceToCoordinate(drawing.data.p2.price);
        const x3 = getXFromTime(timeScale, drawing.data.p3.time, currentCandles);
        const y3 = series.priceToCoordinate(drawing.data.p3.price);
        
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null && x3 !== null && y3 !== null) {
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618];
          
          if (drawing.type === 'Trend-based fib extension') {
            const diff = drawing.data.p2.price - drawing.data.p1.price;
            levels.forEach(lvl => {
              const price = drawing.data.p3.price + diff * lvl;
              const y = series.priceToCoordinate(price);
              if (y !== null) {
                ctx.beginPath();
                ctx.moveTo(x1, y); ctx.lineTo(x3 + (x2-x1), y);
                ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;
              }
            });
          } else { // Fib channel
            const dx = x2 - x1;
            const dy = y2 - y1;
            const ox = x3 - x1;
            const oy = y3 - y1;
            const lenSq = dx * dx + dy * dy;
            const dot = lenSq === 0 ? 0 : (ox * dx + oy * dy) / lenSq;
            const px = x1 + dx * dot;
            const py = y1 + dy * dot;
            const offX = x3 - px;
            const offY = y3 - py;
            
            levels.forEach(lvl => {
              ctx.beginPath();
              ctx.moveTo(x1 + offX * lvl, y1 + offY * lvl);
              ctx.lineTo(x2 + offX * lvl, y2 + offY * lvl);
              ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
            });
          }
        }
      } else if (drawing.type === 'Fib time zone') {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, currentCandles);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, currentCandles);
        if (x1 !== null && x2 !== null) {
          const dx = x2 - x1;
          const levels = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
          levels.forEach(lvl => {
            const x = x1 + dx * lvl;
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
            ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;
          });
        }
      } else if (drawing.type.startsWith('emoji')) {
        const x = getXFromTime(timeScale, drawing.data.time, currentCandles);
        const y = series.priceToCoordinate(drawing.data.price);
        if (x !== null && y !== null) {
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(drawing.data.emoji, x, y);
        }
      } else if (drawing.type === 'Text') {
        const x = getXFromTime(timeScale, drawing.data.time, currentCandles);
        const y = series.priceToCoordinate(drawing.data.price);
        if (x !== null && y !== null) {
          ctx.fillStyle = isDark ? '#ffffff' : '#000000';
          ctx.font = '14px Inter';
          ctx.fillText(drawing.data.text, x + 5, y - 5);
        }
      }
    });

    // Drawing preview
    if (toolRef.current && startPointRef.current && mousePosRef.current) {
      ctx.save();
      ctx.strokeStyle = '#2962ff';
      ctx.setLineDash([2, 5]);
      
      const isStartEndTool = ['Trendline', 'Ray', 'Extended line', 'Trend angle', 'Fib retracement', 'Info line', 'Regression trend', 'Circle', 'Arrow', 'Gann box', 'Gann fan', 'Fib time zone'].includes(toolRef.current);
      const isBoxTool = ['Rectangle', 'Flat top/bottom', 'Price range', 'Date range', 'Gann box'].includes(toolRef.current);
      
      if (isStartEndTool) {
        ctx.beginPath();
        ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
        ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
        ctx.stroke();
        
        if (toolRef.current === 'Circle') {
          const radius = Math.sqrt((mousePosRef.current.x - startPointRef.current.x)**2 + (mousePosRef.current.y - startPointRef.current.y)**2);
          ctx.beginPath();
          ctx.arc(startPointRef.current.x, startPointRef.current.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (isBoxTool) {
        ctx.beginPath();
        ctx.rect(startPointRef.current.x, startPointRef.current.y, mousePosRef.current.x - startPointRef.current.x, mousePosRef.current.y - startPointRef.current.y);
        ctx.stroke();
      } else if (toolRef.current === 'Triangle') {
        if (!middlePoint) {
          ctx.beginPath();
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(middlePoint.x, middlePoint.y);
          ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
          ctx.closePath();
          ctx.stroke();
        }
      } else if (toolRef.current === 'Parallel channel' || toolRef.current === 'Pitchfork' || toolRef.current === 'Disjoint channel' || toolRef.current === 'Trend-based fib extension' || toolRef.current === 'Fib channel') {
        if (!middlePoint) {
          ctx.beginPath();
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
          ctx.stroke();
        } else {
          // p1 is startPoint, p2 is middlePoint, p3 is mousePos
          ctx.beginPath();
          ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
          ctx.lineTo(middlePoint.x, middlePoint.y);
          ctx.moveTo(middlePoint.x, middlePoint.y);
          ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Render Real-Time Moving Price & Countdown Badge on Price Axis (stacked layout)
    const movingBadge = movingPriceBadgeRef.current;
    if (movingBadge && movingBadge.price !== undefined && series) {
      const y = series.priceToCoordinate(movingBadge.price);
      if (y !== null && y >= -50 && y <= height + 50) {
        let priceScaleWidth = 68;
        try {
          const ps = chart.priceScale('right');
          if (ps && typeof ps.width === 'function') {
            const pw = ps.width();
            if (pw > 20) priceScaleWidth = pw;
          }
        } catch {}

        if (priceScaleWidth === 68 && container) {
          const lastTd = container.querySelector('table tr td:last-child') as HTMLElement | null;
          if (lastTd && lastTd.clientWidth > 25) {
            priceScaleWidth = lastTd.clientWidth;
          }
        }

        const formattedPrice = formatMovingPrice(movingBadge.price, effectiveSymbol);
        const hasCountdown = movingBadge.showCountdown && Boolean(movingBadge.timeStr);
        
        ctx.save();
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';
        const priceTextWidth = ctx.measureText(formattedPrice).width;
        const timeTextWidth = hasCountdown ? ctx.measureText(movingBadge.timeStr).width : 0;
        const maxTextW = Math.max(priceTextWidth, timeTextWidth);

        const badgeW = Math.max(priceScaleWidth, Math.ceil(maxTextW + 12));
        const badgeH = hasCountdown ? 34 : 20;
        const badgeX = Math.floor(width - badgeW);
        const badgeY = Math.round(y - badgeH / 2);
        const centerX = Math.round(badgeX + badgeW / 2);

        // Draw Badge Background
        ctx.fillStyle = movingBadge.color;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();

        // Draw High-Contrast Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (hasCountdown) {
          // Price line (top)
          ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';
          ctx.fillText(formattedPrice, centerX, badgeY + 10.5);

          // Countdown timer line (bottom)
          ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';
          ctx.fillText(movingBadge.timeStr, centerX, badgeY + 24.5);
        } else {
          // Single price line
          ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';
          ctx.fillText(formattedPrice, centerX, badgeY + badgeH / 2);
        }

        ctx.restore();
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
  } catch (e) {
      console.warn('Redraw drawings error:', e);
    }
  }, [indicatorData, candles, selectedDrawingId, theme, activeSymbol]);

  // Keep refs in sync for smooth, non-flickering price line and timer updates
  const lastCandleRef = useRef<Candle | null>(null);
  lastCandleRef.current = candles.length > 0 ? candles[candles.length - 1] : null;
  const lastTickRef = useRef<Tick | null>(null);
  lastTickRef.current = lastTick || null;
  const activeSymbolRef = useRef<string>(effectiveSymbol);
  activeSymbolRef.current = effectiveSymbol;
  const activeTimeframeRef = useRef<string>(activeTimeframe);
  activeTimeframeRef.current = activeTimeframe;
  const marketTimeRef = useRef<number>(marketTime);
  marketTimeRef.current = marketTime;

  // Single robust price line updater function (never destroys/recreates line rapidly)
  const updatePriceLine = useCallback(() => {
    if (!seriesRef.current) return;
    const curCandle = lastCandleRef.current;
    if (!curCandle) return;

    const state = useMarketStore.getState();
    const curSymbol = activeSymbolRef.current;
    const isWeekendClosed = isMarketClosedWeekend(curSymbol, state.availableSymbols);
    const showCountdown = (state.chartSettings?.showCountdown ?? true) && !isWeekendClosed;

    const curTf = activeTimeframeRef.current;
    const curTick = lastTickRef.current;
    const curMarketTime = marketTimeRef.current;

    const timeframeSecs = TIMEFRAME_SECONDS[curTf] || 60;
    const candleStartTime = (typeof curCandle.time === 'number') 
      ? (curCandle.time > 1e11 ? Math.floor(curCandle.time / 1000) : curCandle.time) 
      : Math.floor(new Date(curCandle.time as string).getTime() / 1000);
      
    const currentPrice = (curTick && curTick.symbol.toLowerCase() === curSymbol.toLowerCase()) 
      ? curTick.price 
      : curCandle.close;

    let timeStr = "";

    // When the market is closed (e.g. Forex and Commodities on weekends),
    // the candle timer stops counting and is completely hidden.
    if (!isWeekendClosed && showCountdown) {
      const nowSecs = Math.floor(Date.now() / 1000);
      const candleExpiry = candleStartTime + timeframeSecs;
      let secondsLeft = Math.max(0, candleExpiry - nowSecs);

      // If candle period elapsed (00:00 reached), seamlessly roll over to the next candle bucket
      if (nowSecs >= candleExpiry) {
        const rolledBucket = Math.floor(nowSecs / timeframeSecs) * timeframeSecs;
        const nextExpiry = rolledBucket + timeframeSecs;
        secondsLeft = Math.max(0, nextExpiry - nowSecs);

        // Trigger seamless rollover in store & chart if not yet advanced
        const currentCandles = state.candles;
        const last = currentCandles[currentCandles.length - 1];
        const lastTime = last 
          ? (typeof last.time === 'number' ? (last.time > 1e11 ? Math.floor(last.time / 1000) : last.time) : 0) 
          : 0;

        if (last && rolledBucket > lastTime) {
          const nextCandle: Candle = {
            time: rolledBucket,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice
          };
          state.updateCandle(nextCandle);
          if (seriesRef.current) {
            try {
              seriesRef.current.update({
                time: rolledBucket as Time,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice
              });
            } catch (rolloverErr) {
              console.warn('Rollover series update error:', rolloverErr);
            }
          }
        }
      }

      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      if (h > 0) {
        timeStr = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }

    setTimeLeft(timeStr);
    const isUp = currentPrice >= curCandle.open;
    const badgeColor = isUp ? '#089981' : '#f23645';

    movingPriceBadgeRef.current = {
      price: currentPrice,
      timeStr,
      isUp,
      showCountdown: Boolean(showCountdown && timeStr),
      color: badgeColor,
    };

    try {
      if (!priceLineRef.current) {
        priceLineRef.current = seriesRef.current.createPriceLine({
          price: currentPrice,
          color: badgeColor,
          lineWidth: 1,
          lineStyle: 2, // LineStyle.Dashed
          axisLabelVisible: false,
          title: '',
        });
      } else {
        priceLineRef.current.applyOptions({
          price: currentPrice,
          color: badgeColor,
          axisLabelVisible: false,
          title: '',
        });
      }
    } catch (e) {
      console.warn('Update price line error:', e);
    }
  }, []);

  // Periodic 1-second interval for countdown timer without destroying line
  useEffect(() => {
    updatePriceLine();
    const interval = setInterval(() => {
      updatePriceLine();
      redrawDrawingsRef.current?.();
    }, 1000);
    return () => clearInterval(interval);
  }, [updatePriceLine]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#131722' : '#ffffff' },
        textColor: isDark ? '#d1d4dc' : '#131722',
        fontFamily: "'Inter', sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: isDark ? '#2a2e39' : '#f0f3fa' },
        horzLines: { color: isDark ? '#2a2e39' : '#f0f3fa' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          width: 1,
          color: isDark ? '#758696' : '#758696',
          style: 3,
        },
        horzLine: {
          width: 1,
          color: isDark ? '#758696' : '#758696',
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2a2e39' : '#e0e3eb',
        autoScale: true,
      },
      timeScale: {
        borderColor: isDark ? '#2a2e39' : '#e0e3eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 15,
        barSpacing: 6,
      },
      handleScroll: true,
      handleScale: true,
    });

    const lastClosePrice = candles.length > 0 ? candles[candles.length - 1]?.close : undefined;
    const initialSeries = createSeriesForType(chart, chartType, activeSymbol, lastClosePrice, isDark, hasFootprint);
    seriesRef.current = initialSeries;
    currentSeriesTypeRef.current = chartType;

    const formattedData = formatSeriesData(candles, chartType);
    initialSeries.setData(formattedData as any);
    
    chartRef.current = chart;
    setChartApi(chart);

    redrawDrawingsRef.current = redrawDrawings;

    const handleResize = () => {
      if (chartContainerRef.current) {
        const w = chartContainerRef.current.clientWidth;
        const h = chartContainerRef.current.clientHeight;
        if (w <= 0 || h <= 0) return;
        chart.applyOptions({
          width: w,
          height: h,
        });
        if (canvasRef.current) {
          const dpr = window.devicePixelRatio || 1;
          canvasRef.current.width = Math.floor(w * dpr);
          canvasRef.current.height = Math.floor(h * dpr);
          canvasRef.current.style.width = `${w}px`;
          canvasRef.current.style.height = `${h}px`;
          redrawDrawingsRef.current?.();
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartContainerRef.current);

    const onRangeChange = () => {
      redrawDrawingsRef.current?.();
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);
    
    // Global update for lightweight charts calling latest ref
    const timer = setInterval(() => {
      redrawDrawingsRef.current?.();
    }, 40);

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      clearInterval(timer);
      
      try {
        if (seriesRef.current && priceLineRef.current) {
          seriesRef.current.removePriceLine(priceLineRef.current);
          priceLineRef.current = null;
        }
        chart.remove();
      } catch (e) {
        console.warn('Chart cleanup error:', e);
      }
      
      chartRef.current = null;
      seriesRef.current = null;
      currentSeriesTypeRef.current = 'candlestick';
      setChartApi(null);
    };
  }, [activeSymbol]);

  // Manage footprint mode options (spacing & candle transparency)
  const hasFootprint = useMemo(() => {
    return indicatorData.some(d => d.footprints && d.footprints.length > 0);
  }, [indicatorData]);

  // Dynamically switch series when chartType changes without resetting viewport
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const isDark = theme === 'dark';

    if (currentSeriesTypeRef.current !== chartType) {
      if (seriesRef.current) {
        if (priceLineRef.current) {
          try {
            seriesRef.current.removePriceLine(priceLineRef.current);
          } catch {}
          priceLineRef.current = null;
        }
        try {
          chart.removeSeries(seriesRef.current);
        } catch (e) {
          console.warn('Remove series error:', e);
        }
      }

      const lastClose = candles.length > 0 ? candles[candles.length - 1].close : undefined;
      const newSeries = createSeriesForType(chart, chartType, activeSymbol, lastClose, isDark, hasFootprint);
      seriesRef.current = newSeries;
      currentSeriesTypeRef.current = chartType;

      if (candles.length > 0) {
        const formatted = formatSeriesData(candles, chartType);
        newSeries.setData(formatted as any);
      }

      updatePriceLine();
      redrawDrawings();
    }
  }, [chartType, activeSymbol, theme, hasFootprint, updatePriceLine, redrawDrawings, candles]);

  useEffect(() => {
    if (!seriesRef.current) return;
    const currentType = currentSeriesTypeRef.current || chartType;
    const isDark = theme === 'dark';

    if (hasFootprint) {
      if (currentType === 'candlestick' || currentType === 'bars' || currentType === 'heikin_ashi' || currentType === 'hollow_candlestick') {
        seriesRef.current.applyOptions({
          upColor: 'transparent',
          downColor: 'transparent',
          wickUpColor: 'transparent',
          wickDownColor: 'transparent',
          borderVisible: false,
        });
      }
      if (chartRef.current) {
        chartRef.current.timeScale().applyOptions({
          barSpacing: 74,
          minBarSpacing: 36,
        });
      }
    } else {
      if (currentType === 'candlestick' || currentType === 'heikin_ashi') {
        seriesRef.current.applyOptions({
          upColor: '#26a69a',
          downColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          borderVisible: false,
        });
      } else if (currentType === 'bars') {
        seriesRef.current.applyOptions({
          upColor: '#26a69a',
          downColor: '#ef5350',
        });
      } else if (currentType === 'hollow_candlestick') {
        seriesRef.current.applyOptions({
          upColor: isDark ? '#131722' : '#ffffff',
          downColor: '#ef5350',
          borderVisible: true,
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
      }
      if (chartRef.current) {
        chartRef.current.timeScale().applyOptions({
          barSpacing: 6,
          minBarSpacing: 0.5,
        });
      }
    }
  }, [hasFootprint, theme, chartType]);

  // Dynamic update when chartSettings change
  useEffect(() => {
    if (!chartRef.current) return;
    const isDark = theme === 'dark';
    const gridColor = isDark ? '#2a2e39' : '#f0f3fa';
    
    chartRef.current.applyOptions({
      grid: {
        vertLines: {
          visible: chartSettings.showGridLines,
          color: gridColor,
        },
        horzLines: {
          visible: chartSettings.showGridLines,
          color: gridColor,
        }
      }
    });

    if (seriesRef.current && !hasFootprint) {
      if (currentSeriesTypeRef.current === 'candlestick' || currentSeriesTypeRef.current === 'hollow_candlestick') {
        seriesRef.current.applyOptions({
          upColor: chartSettings.candleUpColor,
          downColor: chartSettings.candleDownColor,
          wickUpColor: chartSettings.wickUpColor,
          wickDownColor: chartSettings.wickDownColor,
          borderUpColor: chartSettings.candleUpColor,
          borderDownColor: chartSettings.candleDownColor,
        });
      } else if (currentSeriesTypeRef.current === 'bars') {
        seriesRef.current.applyOptions({
          upColor: chartSettings.candleUpColor,
          downColor: chartSettings.candleDownColor,
        });
      }
    }
  }, [chartSettings, theme, hasFootprint]);

  // Keep redrawDrawingsRef updated on every render
  useEffect(() => {
    redrawDrawingsRef.current = redrawDrawings;
  });

  // Sync drawings and indicators when needed
  useEffect(() => {
    let frameId: number;
    
    const handleRedraw = () => {
      // Small delay ensures lightweight-charts has finished its layout
      frameId = requestAnimationFrame(() => {
        redrawDrawingsRef.current?.();
      });
    };

    handleRedraw();
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [drawings, activeTool, theme, activeSymbol, startPoint, mousePos, indicatorData, redrawDrawings]);

  // Handle detection logic for resizing/expanding/reducing drawings
  const findHandleAt = (x: number, y: number, drawing: any): string | null => {
    try {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series || !drawing || !drawing.data) return null;

      const timeScale = chart.timeScale();
      const handleRadius = 14; // generous hit-test radius for easy clicking/dragging

      const isStartEnd = ['Trendline', 'Ray', 'Extended line', 'Trend angle', 'Info line', 'Fib retracement', 'Arrow', 'Regression trend', 'Circle', 'Gann fan', 'Fib time zone'].includes(drawing.type);
      const isBox = ['Rectangle', 'Price range', 'Date range', 'Flat top/bottom', 'Gann box'].includes(drawing.type);
      const is3Point = ['Parallel channel', 'Pitchfork', 'Disjoint channel', 'Triangle', 'Trend-based fib extension', 'Fib channel'].includes(drawing.type);
      const isPosition = ['Long position', 'Short position'].includes(drawing.type);

      if (isStartEnd && drawing.data.start && drawing.data.end) {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, candlesRef.current);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, candlesRef.current);
        const y2 = series.priceToCoordinate(drawing.data.end.price);

        if (x1 !== null && y1 !== null && (x - x1) ** 2 + (y - y1) ** 2 <= handleRadius ** 2) {
          return 'start';
        }
        if (x2 !== null && y2 !== null && (x - x2) ** 2 + (y - y2) ** 2 <= handleRadius ** 2) {
          return 'end';
        }
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          if ((x - midX) ** 2 + (y - midY) ** 2 <= handleRadius ** 2) {
            return 'mid';
          }
        }
      } else if (isBox && drawing.data.start && drawing.data.end) {
        const x1 = getXFromTime(timeScale, drawing.data.start.time, candlesRef.current);
        const y1 = series.priceToCoordinate(drawing.data.start.price);
        const x2 = getXFromTime(timeScale, drawing.data.end.time, candlesRef.current);
        const y2 = series.priceToCoordinate(drawing.data.end.price);

        if (x1 !== null && y1 !== null && (x - x1) ** 2 + (y - y1) ** 2 <= handleRadius ** 2) return 'start';
        if (x2 !== null && y1 !== null && (x - x2) ** 2 + (y - y1) ** 2 <= handleRadius ** 2) return 'ne';
        if (x2 !== null && y2 !== null && (x - x2) ** 2 + (y - y2) ** 2 <= handleRadius ** 2) return 'end';
        if (x1 !== null && y2 !== null && (x - x1) ** 2 + (y - y2) ** 2 <= handleRadius ** 2) return 'sw';
      } else if (is3Point && drawing.data.p1 && drawing.data.p2 && drawing.data.p3) {
        const x1 = getXFromTime(timeScale, drawing.data.p1.time, candlesRef.current);
        const y1 = series.priceToCoordinate(drawing.data.p1.price);
        const x2 = getXFromTime(timeScale, drawing.data.p2.time, candlesRef.current);
        const y2 = series.priceToCoordinate(drawing.data.p2.price);
        const x3 = getXFromTime(timeScale, drawing.data.p3.time, candlesRef.current);
        const y3 = series.priceToCoordinate(drawing.data.p3.price);

        if (x1 !== null && y1 !== null && (x - x1) ** 2 + (y - y1) ** 2 <= handleRadius ** 2) return 'p1';
        if (x2 !== null && y2 !== null && (x - x2) ** 2 + (y - y2) ** 2 <= handleRadius ** 2) return 'p2';
        if (x3 !== null && y3 !== null && (x - x3) ** 2 + (y - y3) ** 2 <= handleRadius ** 2) return 'p3';
      } else if (isPosition && drawing.data.entry && drawing.data.tp && drawing.data.sl) {
        const xentry = getXFromTime(timeScale, drawing.data.entry.time, candlesRef.current);
        const yentry = series.priceToCoordinate(drawing.data.entry.price);
        const ytp = series.priceToCoordinate(drawing.data.tp.price);
        const ysl = series.priceToCoordinate(drawing.data.sl.price);
        const xend = getXFromTime(timeScale, drawing.data.end?.time || ((drawing.data.entry.time as number) + 3600 * 20), candlesRef.current);

        if (xentry !== null && yentry !== null && ytp !== null && ysl !== null && xend !== null) {
          const boxLeft = Math.min(xentry, xend);
          const boxRight = Math.max(xentry, xend);
          const midX = (boxLeft + boxRight) / 2;

          // Target handles
          if ((x - boxLeft) ** 2 + (y - ytp) ** 2 <= handleRadius ** 2 ||
              (x - boxRight) ** 2 + (y - ytp) ** 2 <= handleRadius ** 2 ||
              (x - midX) ** 2 + (y - ytp) ** 2 <= handleRadius ** 2) {
            return 'tp';
          }
          // Stop handles
          if ((x - boxLeft) ** 2 + (y - ysl) ** 2 <= handleRadius ** 2 ||
              (x - boxRight) ** 2 + (y - ysl) ** 2 <= handleRadius ** 2 ||
              (x - midX) ** 2 + (y - ysl) ** 2 <= handleRadius ** 2) {
            return 'sl';
          }
          // Start left handle
          if ((x - boxLeft) ** 2 + (y - yentry) ** 2 <= handleRadius ** 2) return 'start';
          // End right handle
          if ((x - boxRight) ** 2 + (y - yentry) ** 2 <= handleRadius ** 2) return 'end';
          // Center card / entry
          if ((x - midX) ** 2 + (y - yentry) ** 2 <= (handleRadius + 18) ** 2) return 'mid';
        }
      } else if ((drawing.type === 'Horizontal ray' || drawing.type === 'Cross line') && drawing.data.time && drawing.data.price) {
        const x1 = getXFromTime(timeScale, drawing.data.time, candlesRef.current);
        const y1 = series.priceToCoordinate(drawing.data.price);
        if (x1 !== null && y1 !== null && (x - x1) ** 2 + (y - y1) ** 2 <= handleRadius ** 2) return 'start';
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Hit testing logic
  const findDrawingAt = (x: number, y: number) => {
    try {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return null;

      const timeScale = chart.timeScale();
      const threshold = 15; // Increased threshold for easier selection

      return drawingsRef.current.find(d => {
        if (d.symbol !== symbolRef.current) return false;

        if (d.type === 'Horizontal line') {
          const lineY = series.priceToCoordinate(d.data.price);
          return lineY !== null && Math.abs(y - lineY) < threshold;
        }
        if (d.type === 'Horizontal ray') {
          const lineY = series.priceToCoordinate(d.data.price);
          const lineX = getXFromTime(timeScale, d.data.time, candlesRef.current);
          return lineY !== null && lineX !== null && Math.abs(y - lineY) < threshold && x >= lineX;
        }
        if (d.type === 'Vertical line') {
          const lineX = getXFromTime(timeScale, d.data.time, candlesRef.current);
          return lineX !== null && Math.abs(x - lineX) < threshold;
        }
        if (d.type === 'Cross line') {
          const lineX = getXFromTime(timeScale, d.data.time, candlesRef.current);
          const lineY = series.priceToCoordinate(d.data.price);
          return (lineX !== null && Math.abs(x - lineX) < threshold) || (lineY !== null && Math.abs(y - lineY) < threshold);
        }
        if (d.type === 'Trendline' || d.type === 'Ray' || d.type === 'Extended line' || d.type === 'Trend angle' || d.type === 'Fib retracement' || d.type === 'Info line' || d.type === 'Regression trend') {
          const x1 = getXFromTime(timeScale, d.data.start.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.start.price);
          const x2 = getXFromTime(timeScale, d.data.end.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.end.price);
          
          if (x1 === null || y1 === null || x2 === null || y2 === null) return false;
          
          if (d.type === 'Trendline' || d.type === 'Trend angle' || d.type === 'Fib retracement' || d.type === 'Info line' || d.type === 'Regression trend') {
            return getDistToSegment(x, y, x1, y1, x2, y2) < threshold;
          } else if (d.type === 'Ray') {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return getDistToSegment(x, y, x1, y1, x1 + dx * 100, y1 + dy * 100) < threshold;
          } else if (d.type === 'Extended line') {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return getDistToSegment(x, y, x1 - dx * 100, y1 - dy * 100, x1 + dx * 100, y1 + dy * 100) < threshold;
          }
        }
        if (d.type === 'Rectangle' || d.type === 'Price range' || d.type === 'Date range' || d.type === 'Flat top/bottom' || d.type === 'Gann box') {
          const x1 = getXFromTime(timeScale, d.data.start.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.start.price);
          const x2 = getXFromTime(timeScale, d.data.end.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.end.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null) return false;

          const left = Math.min(x1, x2);
          const right = Math.max(x1, x2);
          const top = Math.min(y1, y2);
          const bottom = Math.max(y1, y2);

          // Check if on borders
          const onLeft = Math.abs(x - left) < threshold && y >= top && y <= bottom;
          const onRight = Math.abs(x - right) < threshold && y >= top && y <= bottom;
          const onTop = Math.abs(y - top) < threshold && x >= left && x <= right;
          const onBottom = Math.abs(y - bottom) < threshold && x >= left && x <= right;

          if (d.type === 'Price range' || d.type === 'Date range') {
            return (x >= left && x <= right && y >= top && y <= bottom) || onLeft || onRight || onTop || onBottom;
          }

          return onLeft || onRight || onTop || onBottom;
        }
        if (d.type === 'Circle') {
          const x1 = getXFromTime(timeScale, d.data.start.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.start.price);
          const x2 = getXFromTime(timeScale, d.data.end.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.end.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null) return false;
          const radius = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
          const dist = Math.sqrt((x - x1)**2 + (y - y1)**2);
          return Math.abs(dist - radius) < threshold;
        }
        if (d.type === 'Triangle') {
          const x1 = getXFromTime(timeScale, d.data.p1.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.p1.price);
          const x2 = getXFromTime(timeScale, d.data.p2.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.p2.price);
          const x3 = getXFromTime(timeScale, d.data.p3.time, candlesRef.current);
          const y3 = series.priceToCoordinate(d.data.p3.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null || x3 === null || y3 === null) return false;
          return getDistToSegment(x, y, x1, y1, x2, y2) < threshold || 
                 getDistToSegment(x, y, x2, y2, x3, y3) < threshold || 
                 getDistToSegment(x, y, x3, y3, x1, y1) < threshold;
        }
        if (d.type === 'Long position' || d.type === 'Short position') {
          const xentry = getXFromTime(timeScale, d.data.entry.time, candlesRef.current);
          const yentry = series.priceToCoordinate(d.data.entry.price);
          const ytp = series.priceToCoordinate(d.data.tp.price);
          const ysl = series.priceToCoordinate(d.data.sl.price);
          const xend = getXFromTime(timeScale, d.data.end?.time || ((d.data.entry.time as number) + 3600 * 20), candlesRef.current);
          if (xentry === null || yentry === null || ytp === null || ysl === null || xend === null) return false;
          
          const left = Math.min(xentry, xend) - threshold;
          const right = Math.max(xentry, xend) + threshold;
          const top = Math.min(ytp, ysl, yentry) - threshold;
          const bottom = Math.max(ytp, ysl, yentry) + threshold;
          return x >= left && x <= right && y >= top && y <= bottom;
        }
        if (d.type === 'Arrow' || d.type === 'Gann fan' || d.type === 'Fib time zone') {
          const x1 = getXFromTime(timeScale, d.data.start.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.start.price);
          const x2 = getXFromTime(timeScale, d.data.end.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.end.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null) return false;
          return getDistToSegment(x, y, x1, y1, x2, y2) < threshold;
        }
        if (d.type === 'Parallel channel' || d.type === 'Disjoint channel' || d.type === 'Fib channel') {
          const x1 = getXFromTime(timeScale, d.data.p1.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.p1.price);
          const x2 = getXFromTime(timeScale, d.data.p2.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.p2.price);
          const x3 = getXFromTime(timeScale, d.data.p3.time, candlesRef.current);
          const y3 = series.priceToCoordinate(d.data.p3.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null || x3 === null || y3 === null) return false;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const ox = x3 - x1;
          const oy = y3 - y1;
          const lenSq = dx * dx + dy * dy;
          const dot = lenSq === 0 ? 0 : (ox * dx + oy * dy) / lenSq;
          const px = x1 + dx * dot;
          const py = y1 + dy * dot;
          const offX = x3 - px;
          const offY = y3 - py;

          // Check distance to two lines
          const distToLine1 = getDistToSegment(x, y, x1, y1, x2, y2);
          const distToLine2 = getDistToSegment(x, y, x1 + offX, y1 + offY, x2 + offX, y2 + offY);

          return distToLine1 < threshold || distToLine2 < threshold;
        }
        if (d.type === 'Pitchfork' || d.type === 'Trend-based fib extension') {
          const x1 = getXFromTime(timeScale, d.data.p1.time, candlesRef.current);
          const y1 = series.priceToCoordinate(d.data.p1.price);
          const x2 = getXFromTime(timeScale, d.data.p2.time, candlesRef.current);
          const y2 = series.priceToCoordinate(d.data.p2.price);
          const x3 = getXFromTime(timeScale, d.data.p3.time, candlesRef.current);
          const y3 = series.priceToCoordinate(d.data.p3.price);
          if (x1 === null || y1 === null || x2 === null || y2 === null || x3 === null || y3 === null) return false;

          const midX = (x2 + x3) / 2;
          const midY = (y2 + y3) / 2;
          const dx = midX - x1;
          const dy = midY - y1;

          const dist1 = getDistToSegment(x, y, x1, y1, x1 + dx * 10, y1 + dy * 10);
          const dist2 = getDistToSegment(x, y, x2, y2, x2 + dx * 10, y2 + dy * 10);
          const dist3 = getDistToSegment(x, y, x3, y3, x3 + dx * 10, y3 + dy * 10);

          return dist1 < threshold || dist2 < threshold || dist3 < threshold;
        }
        if (d.type.startsWith('emoji') || d.type === 'Text') {
          const dx = getXFromTime(timeScale, d.data.time, candlesRef.current);
          const dy = series.priceToCoordinate(d.data.price);
          if (dx === null || dy === null) return false;
          return Math.sqrt((x - dx) ** 2 + (y - dy) ** 2) < threshold * 2;
        }
        return false;
      });
    } catch (e) {
      console.warn('Find drawing error:', e);
      return null;
    }
  };

  const handleMouseDown = (e: any) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Legend Click Detection (Remove Indicator)
    let legendY = 60;
    activeIndicators.forEach(ind => {
      // Check if clicked near the 'X' button in legend (box approx: 125-140x, legendY-12 to legendY+5y)
      if (x >= 125 && x <= 145 && y >= legendY - 15 && y <= legendY + 5) {
        removeIndicator(ind.id);
        return;
      }
      legendY += 20;
    });

    // Don't start drawing or dragging if clicked inside floating toolbar or modal
    if ((e.target as HTMLElement).closest('.floating-toolbar') || (e.target as HTMLElement).closest('.drawing-settings-modal')) {
      return;
    }

    if (!activeTool) {
      // 1. First priority: Check if user clicked directly on a handle of the currently selected drawing
      const curSelected = selectedDrawingIdRef.current 
        ? drawingsRef.current.find(d => d.id === selectedDrawingIdRef.current && d.symbol === symbolRef.current) 
        : null;

      if (curSelected && !curSelected.locked && !curSelected.hidden) {
        const activeHandle = findHandleAt(x, y, curSelected);
        if (activeHandle) {
          if (!chartRef.current || !seriesRef.current) return;
          setIsDragging(true);
          const timeScale = chartRef.current.timeScale();
          const startPrice = seriesRef.current.coordinateToPrice(y);
          const startTime = getTimeFromX(timeScale, x, candlesRef.current);
          setDragOffset({
            x,
            y,
            startTime,
            startPrice,
            dragHandle: activeHandle,
            initialData: JSON.parse(JSON.stringify(curSelected.data))
          });
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // 2. Otherwise find if any drawing is under mouse
      const drawing = findDrawingAt(x, y);
      if (drawing) {
        setSelectedDrawing(drawing.id);
        if (!toolbarPos && rect) {
          setToolbarPos({ x: Math.round(rect.width / 2), y: 24 });
        }

        if (!chartRef.current || !seriesRef.current) return;
        setIsDragging(true);
        const handle = findHandleAt(x, y, drawing);
        const timeScale = chartRef.current.timeScale();
        const startPrice = seriesRef.current.coordinateToPrice(y);
        const startTime = getTimeFromX(timeScale, x, candlesRef.current);
        setDragOffset({
          x,
          y,
          startTime,
          startPrice,
          dragHandle: handle || 'body',
          initialData: JSON.parse(JSON.stringify(drawing.data))
        });
        
        e.preventDefault();
        e.stopPropagation();
      } else if (selectedDrawingId) {
        // If something was selected but we clicked on empty space, deselect
        setSelectedDrawing(null);
      }
      return;
    }
    
    if (!chartRef.current || !seriesRef.current) return;
    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);

    if (time === null || price === null) return;    const is3PointTool = activeTool === 'Parallel channel' || activeTool === 'Pitchfork' || activeTool === 'Disjoint channel' || activeTool === 'Triangle' || activeTool === 'Trend-based fib extension' || activeTool === 'Fib channel';
    const is2PointTool = ['Trendline', 'Rectangle', 'Fib retracement', 'Ray', 'Extended line', 'Trend angle', 'Info line', 'Regression trend', 'Flat top/bottom', 'Circle', 'Price range', 'Date range', 'Arrow', 'Gann box', 'Gann fan', 'Fib time zone'].includes(activeTool || '');

    if (activeTool === 'Horizontal line') {
      const id = Math.random().toString(36).substr(2, 9);
      addDrawing({
        id,
        symbol: effectiveSymbol,
        type: 'Horizontal line',
        data: { price }
      });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (activeTool === 'Horizontal ray') {
      const id = Math.random().toString(36).substr(2, 9);
      addDrawing({ id, symbol: effectiveSymbol, type: 'Horizontal ray', data: { time, price } });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (activeTool === 'Vertical line') {
      const id = Math.random().toString(36).substr(2, 9);
      addDrawing({
        id,
        symbol: effectiveSymbol,
        type: 'Vertical line',
        data: { time }
      });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (activeTool === 'Cross line') {
      const id = Math.random().toString(36).substr(2, 9);
      addDrawing({ id, symbol: effectiveSymbol, type: 'Cross line', data: { time, price } });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (activeTool === 'Long position' || activeTool === 'Short position') {
      const id = Math.random().toString(36).substr(2, 9);
      const isLong = activeTool === 'Long position';
      const c = candlesRef.current;
      
      // Calculate realistic price delta for target and stop loss
      let priceDelta = price * 0.006;
      if (c && c.length > 0) {
        const sampleCandles = c.slice(-20);
        const avgCandleRange = sampleCandles.reduce((acc, cand) => acc + Math.abs(cand.high - cand.low), 0) / sampleCandles.length;
        if (avgCandleRange > 0) {
          priceDelta = avgCandleRange * 4;
        }
      }

      // Calculate bar interval for width
      let endTime = (time as number) + 3600 * 20;
      if (c && c.length >= 2) {
        const cLastTime = typeof c[c.length - 1].time === 'number' ? (c[c.length - 1].time as number) : Math.floor(new Date(String(c[c.length - 1].time)).getTime() / 1000);
        const cPrevTime = typeof c[c.length - 2].time === 'number' ? (c[c.length - 2].time as number) : Math.floor(new Date(String(c[c.length - 2].time)).getTime() / 1000);
        const barInterval = Math.max(1, Math.abs(cLastTime - cPrevTime));
        endTime = (time as number) + barInterval * 20;
      }

      addDrawing({
        id,
        symbol: effectiveSymbol,
        type: activeTool,
        data: {
          entry: { time, price },
          tp: { price: isLong ? price + priceDelta * 2 : price - priceDelta * 2 },
          sl: { price: isLong ? price - priceDelta : price + priceDelta },
          end: { time: endTime },
          riskAmount: 750,
          rewardAmount: 1500,
          qty: 3
        }
      });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (is3PointTool) {
      if (!startPoint) {
        setStartPoint({ time: time as number, price, x, y });
      } else if (!middlePoint) {
        setMiddlePoint({ time: time as number, price, x, y });
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        addDrawing({
          id,
          symbol: effectiveSymbol,
          type: activeTool,
          data: { 
            p1: { time: startPoint.time, price: startPoint.price }, 
            p2: { time: middlePoint.time, price: middlePoint.price },
            p3: { time, price }
          }
        });
        setSelectedDrawing(id);
        setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
        setStartPoint(null);
        setMiddlePoint(null);
        setActiveTool(null);
      }
    } else if (is2PointTool) {
      if (!startPoint) {
        setStartPoint({ time: time as number, price, x, y });
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        addDrawing({
          id,
          symbol: effectiveSymbol,
          type: activeTool,
          data: { 
            start: { time: startPoint.time, price: startPoint.price }, 
            end: { time, price } 
          }
        });
        setSelectedDrawing(id);
        setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
        setStartPoint(null);
        setActiveTool(null);
      }
    } else if (activeTool?.startsWith('emoji')) {
      const emoji = activeTool.split('-')[1];
      const id = Math.random().toString(36).substr(2, 9);
      addDrawing({
        id,
        symbol: effectiveSymbol,
        type: activeTool,
        data: { time, price, emoji }
      });
      setSelectedDrawing(id);
      setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      setActiveTool(null);
    } else if (activeTool === 'Text') {
      const text = prompt('Enter text:');
      if (text) {
        const id = Math.random().toString(36).substr(2, 9);
        addDrawing({
          id,
          symbol: effectiveSymbol,
          type: 'Text',
          data: { time, price, text }
        });
        setSelectedDrawing(id);
        setToolbarPos({ x: e.clientX, y: e.clientY - 60 });
      }
      setActiveTool(null);
    }
  };

  const handleToolbarDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToolbar(true);
    const rect = chartContainerRef.current?.getBoundingClientRect();
    const currentX = toolbarPos ? toolbarPos.x : (rect ? Math.round(rect.width / 2) : 200);
    const currentY = toolbarPos ? toolbarPos.y : 24;
    toolbarDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };
  };

  const handleDoubleClick = (e: any) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const drawing = findDrawingAt(x, y);
    if (drawing) {
      setSelectedDrawing(drawing.id);
      setIsDrawingSettingsOpen(true);
    }
  };

  const handleMouseMove = (e: any) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const inPriceScale = x > rect.width - 60;
    const inTimeScale = y > rect.height - 26;
    const inScale = inPriceScale || inTimeScale;

    if (inScale !== isHoveringScale && e.buttons === 0) {
      setIsHoveringScale(inScale);
    }

    // 0. Dragging the toolbar itself via its grip handle
    if (isDraggingToolbar && toolbarDragStartRef.current && chartContainerRef.current) {
      const dx = e.clientX - toolbarDragStartRef.current.mouseX;
      const dy = e.clientY - toolbarDragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(rect.width - 240, toolbarDragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(rect.height - 60, toolbarDragStartRef.current.initialY + dy));
      setToolbarPos({ x: newX, y: newY });
      return;
    }

    if (isDragging && selectedDrawingId && dragOffset) {
      const drawing = drawings.find(d => d.id === selectedDrawingId);
      if (!drawing || drawing.locked) return;

      if (!chartRef.current || !seriesRef.current) return;
      const timeScale = chartRef.current.timeScale();
      const series = seriesRef.current;
      
      const currentPrice = series.coordinateToPrice(y);
      const currentTime = getTimeFromX(timeScale, x, candlesRef.current);

      if (currentPrice === null || currentTime === null) return;

      const priceDelta = currentPrice - (dragOffset.startPrice ?? currentPrice);
      const timeDelta = currentTime - ((dragOffset.startTime as number) ?? currentTime);
      const handle = dragOffset.dragHandle || 'body';

      // 1. Resizing / expanding / reducing via handles
      if (handle === 'start') {
        if (['Long position', 'Short position'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              entry: { ...drawing.data.entry, time: currentTime }
            }
          }, true);
          return;
        } else if (['Trendline', 'Ray', 'Extended line', 'Trend angle', 'Info line', 'Fib retracement', 'Arrow', 'Regression trend', 'Circle', 'Gann fan', 'Fib time zone'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              start: { time: currentTime, price: currentPrice }
            }
          }, true);
          return;
        } else if (['Rectangle', 'Price range', 'Date range', 'Flat top/bottom', 'Gann box'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              start: { time: currentTime, price: currentPrice }
            }
          }, true);
          return;
        } else if (drawing.type === 'Horizontal ray' || drawing.type === 'Cross line') {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              time: currentTime,
              price: currentPrice
            }
          }, true);
          return;
        }
      } else if (handle === 'end') {
        if (['Trendline', 'Ray', 'Extended line', 'Trend angle', 'Info line', 'Fib retracement', 'Arrow', 'Regression trend', 'Circle', 'Gann fan', 'Fib time zone'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              end: { time: currentTime, price: currentPrice }
            }
          }, true);
          return;
        } else if (['Rectangle', 'Price range', 'Date range', 'Flat top/bottom', 'Gann box'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              end: { time: currentTime, price: currentPrice }
            }
          }, true);
          return;
        } else if (['Long position', 'Short position'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              end: { time: currentTime }
            }
          }, true);
          return;
        }
      } else if (handle === 'ne') {
        if (['Rectangle', 'Price range', 'Date range', 'Flat top/bottom', 'Gann box'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              start: { time: drawing.data.start.time, price: currentPrice },
              end: { time: currentTime, price: drawing.data.end.price }
            }
          }, true);
          return;
        }
      } else if (handle === 'sw') {
        if (['Rectangle', 'Price range', 'Date range', 'Flat top/bottom', 'Gann box'].includes(drawing.type)) {
          updateDrawing(drawing.id, {
            data: {
              ...drawing.data,
              start: { time: currentTime, price: drawing.data.start.price },
              end: { time: drawing.data.end.time, price: currentPrice }
            }
          }, true);
          return;
        }
      } else if (handle === 'p1') {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            p1: { time: currentTime, price: currentPrice }
          }
        }, true);
        return;
      } else if (handle === 'p2') {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            p2: { time: currentTime, price: currentPrice }
          }
        }, true);
        return;
      } else if (handle === 'p3') {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            p3: { time: currentTime, price: currentPrice }
          }
        }, true);
        return;
      } else if (handle === 'tp') {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            tp: { price: currentPrice }
          }
        }, true);
        return;
      } else if (handle === 'sl') {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            sl: { price: currentPrice }
          }
        }, true);
        return;
      } else if (handle === 'entry') {
        const initEntryPrice = dragOffset.initialData?.entry?.price ?? currentPrice;
        const pDelta = currentPrice - initEntryPrice;
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            entry: { ...drawing.data.entry, price: currentPrice },
            tp: { price: (dragOffset.initialData?.tp?.price ?? currentPrice) + pDelta },
            sl: { price: (dragOffset.initialData?.sl?.price ?? currentPrice) + pDelta }
          }
        }, true);
        return;
      }

      // 2. Translation of entire drawing (when dragging body or middle handle)
      const isMultiPoint = ['Parallel channel', 'Pitchfork', 'Disjoint channel', 'Triangle', 'Trend-based fib extension', 'Fib channel'].includes(drawing.type);
      const isStartEnd = ['Trendline', 'Rectangle', 'Ray', 'Extended line', 'Trend angle', 'Fib retracement', 'Info line', 'Regression trend', 'Flat top/bottom', 'Circle', 'Price range', 'Date range', 'Arrow', 'Gann box', 'Gann fan', 'Fib time zone'].includes(drawing.type);
      const isPosition = ['Long position', 'Short position'].includes(drawing.type);

      if (drawing.type === 'Horizontal line') {
        updateDrawing(drawing.id, { data: { price: dragOffset.initialData.price + priceDelta } }, true);
      } else if (drawing.type === 'Horizontal ray' || drawing.type === 'Cross line') {
        updateDrawing(drawing.id, { 
          data: { 
            price: dragOffset.initialData.price + priceDelta,
            time: dragOffset.initialData.time + timeDelta
          } 
        }, true);
      } else if (drawing.type === 'Vertical line') {
        updateDrawing(drawing.id, { data: { time: dragOffset.initialData.time + timeDelta } }, true);
      } else if (isStartEnd) {
        updateDrawing(drawing.id, { 
          data: { 
            ...drawing.data,
            start: { 
              time: dragOffset.initialData.start.time + timeDelta, 
              price: dragOffset.initialData.start.price + priceDelta 
            },
            end: { 
              time: dragOffset.initialData.end.time + timeDelta, 
              price: dragOffset.initialData.end.price + priceDelta 
            }
          } 
        }, true);
      } else if (isMultiPoint) {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            p1: { time: dragOffset.initialData.p1.time + timeDelta, price: dragOffset.initialData.p1.price + priceDelta },
            p2: { time: dragOffset.initialData.p2.time + timeDelta, price: dragOffset.initialData.p2.price + priceDelta },
            p3: { time: dragOffset.initialData.p3.time + timeDelta, price: dragOffset.initialData.p3.price + priceDelta }
          }
        }, true);
      } else if (isPosition) {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            entry: { 
              time: (dragOffset.initialData?.entry?.time ?? currentTime) + timeDelta, 
              price: (dragOffset.initialData?.entry?.price ?? currentPrice) + priceDelta 
            },
            tp: { price: (dragOffset.initialData?.tp?.price ?? currentPrice) + priceDelta },
            sl: { price: (dragOffset.initialData?.sl?.price ?? currentPrice) + priceDelta },
            end: { time: (dragOffset.initialData?.end?.time ?? (currentTime + 72000)) + timeDelta }
          }
        }, true);
      } else if (drawing.type === 'Text' || drawing.type.startsWith('emoji')) {
        updateDrawing(drawing.id, {
          data: {
            ...drawing.data,
            time: dragOffset.initialData.time + timeDelta,
            price: dragOffset.initialData.price + priceDelta
          }
        }, true);
      }
      return;
    }

    // Hover & handle detection
    if (!activeTool) {
      const curSelected = selectedDrawingId 
        ? drawings.find(d => d.id === selectedDrawingId && d.symbol === effectiveSymbol) 
        : null;
      const handle = curSelected ? findHandleAt(x, y, curSelected) : null;
      setHoveredHandle(handle);

      const drawingUnderMouse = findDrawingAt(x, y);
      if (drawingUnderMouse || handle) {
        setIsHoveringDrawing(true);
      } else if (!drawingUnderMouse && !handle && isHoveringDrawing && !isDragging) {
        setIsHoveringDrawing(false);
      }
    }

    if (!activeTool) return;
    setMousePos({ x, y });
  };

  const handleMouseUp = () => {
    if (isDragging && selectedDrawingId) {
      const cur = drawings.find(d => d.id === selectedDrawingId);
      if (cur) {
        updateDrawing(selectedDrawingId, { data: cur.data }, false);
      }
    }
    setIsDragging(false);
    setDragOffset(null);
    setIsDraggingToolbar(false);
    toolbarDragStartRef.current = null;
  };

  // Update data when displayCandles change (real-time ticks & incremental updates)
  const prevVersionRef = useRef<number>(-1);

  useEffect(() => {
    try {
      if (seriesRef.current && displayCandles.length > 0) {
        const symbolKey = `${effectiveSymbol}-${effectiveTimeframe}`;
        const isSymbolChange = lastResolvedSymbol.current !== symbolKey;
        const countDiff = Math.abs(displayCandles.length - prevCandlesCountRef.current);
        const isInitialLoad = prevCandlesCountRef.current === 0;
        const isBulkReload = countDiff > 5;
        const isNewSet = isSymbolChange || isInitialLoad || isBulkReload;

        const currentType = currentSeriesTypeRef.current || chartType;

        if (isNewSet || currentType === 'heikin_ashi') {
          const formatted = formatSeriesData(displayCandles, currentType);
          seriesRef.current.setData(formatted as any);

          lastResolvedSymbol.current = symbolKey;
          prevCandlesCountRef.current = displayCandles.length;
          prevVersionRef.current = candlesVersion;
          
          if (isNewSet && chartRef.current) {
            chartRef.current.priceScale('right').applyOptions({ autoScale: true });
            
            const timeScale = chartRef.current.timeScale();
            const totalCandles = formatted.length;
            const visibleCount = Math.min(150, totalCandles);
            
            timeScale.setVisibleLogicalRange({
              from: totalCandles - visibleCount,
              to: totalCandles + 15,
            });
          }
        } else {
          // Lightning-fast incremental update for the moving live candle or new next candle
          const lastCandle = displayCandles[displayCandles.length - 1];
          const candleTime = (typeof lastCandle.time === 'number' 
            ? (lastCandle.time > 1e11 ? Math.floor(lastCandle.time / 1000) : lastCandle.time) 
            : Math.floor(new Date(lastCandle.time as string).getTime() / 1000)) as Time;

          if (currentType === 'candlestick' || currentType === 'bars' || currentType === 'hollow_candlestick') {
            const formattedCandle: CandlestickData<Time> = {
              time: candleTime,
              open: lastCandle.open,
              high: lastCandle.high,
              low: lastCandle.low,
              close: lastCandle.close
            };
            try {
              seriesRef.current.update(formattedCandle);
            } catch (updateErr) {
              const formatted = formatSeriesData(displayCandles, currentType);
              seriesRef.current.setData(formatted as any);
            }
          } else {
            // Line, Area, Baseline, Stepline
            const formattedPoint: LineData<Time> = {
              time: candleTime,
              value: lastCandle.close
            };
            try {
              seriesRef.current.update(formattedPoint);
            } catch (updateErr) {
              const formatted = formatSeriesData(displayCandles, currentType);
              seriesRef.current.setData(formatted as any);
            }
          }
          prevCandlesCountRef.current = displayCandles.length;
          prevVersionRef.current = candlesVersion;
        }

        // Keep price line and drawings updated
        updatePriceLine();
        redrawDrawings();
      }
    } catch (e) {
      console.warn('Real-time update error:', e);
    }
  }, [displayCandles, candlesVersion, effectiveSymbol, effectiveTimeframe, chartType, redrawDrawings, updatePriceLine]);

  // Handle theme changes on existing chart
  useEffect(() => {
    try {
      if (chartRef.current) {
        const isDark = theme === 'dark';
        chartRef.current.applyOptions({
          layout: {
            background: { type: ColorType.Solid, color: isDark ? '#131722' : '#ffffff' },
            textColor: isDark ? '#d1d4dc' : '#131722',
            attributionLogo: false,
          },
          grid: {
            vertLines: { color: isDark ? '#2a2e39' : '#f0f3fa' },
            horzLines: { color: isDark ? '#2a2e39' : '#f0f3fa' },
          },
          rightPriceScale: {
            borderColor: isDark ? '#2a2e39' : '#e0e3eb',
          },
          timeScale: {
            borderColor: isDark ? '#2a2e39' : '#e0e3eb',
          },
        });
      }
    } catch (e) {
      console.warn('Theme change error:', e);
    }
  }, [theme]);

  // Reset price line and update priceFormat ONLY when symbol or timeframe changes (never on every tick)
  useEffect(() => {
    if (seriesRef.current) {
      if (priceLineRef.current) {
        try {
          seriesRef.current.removePriceLine(priceLineRef.current);
        } catch {
          // ignore
        }
        priceLineRef.current = null;
      }
      const priceFormat = getSymbolPriceFormat(effectiveSymbol);
      seriesRef.current.applyOptions({ priceFormat });
    }
  }, [effectiveSymbol, effectiveTimeframe]);

  const lastCandle = displayCandles[displayCandles.length - 1];
  const nonOverlayIndicators = indicatorData.filter(d => !d.overlay);
  const currentLastPrice = lastCandle ? lastCandle.close : undefined;

  return (
    <div 
      className={`relative w-full h-full bg-tv-bg flex flex-col overflow-hidden select-none transition-all ${isActivePane ? 'ring-1 ring-tv-accent' : ''}`} 
      id={paneId ? `chart-pane-${paneId}` : "chart-main-container"}
      onClick={() => onSelectPane?.()}
    >
      {/* Optional Split-Pane Header */}
      {showPaneHeader && (
        <div className="h-8 min-h-[32px] bg-tv-card border-b border-tv-border flex items-center justify-between px-2 text-xs select-none z-20">
          {/* Left: Active Indicator + Symbol Dropdown + Timeframe Pills */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isActivePane ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-tv-muted/40'}`} />
            
            {/* Symbol Selector Pill */}
            <div className="relative" ref={symbolDropdownRef}>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPane?.();
                  setShowSymbolDropdown(!showSymbolDropdown);
                  if (!showSymbolDropdown) {
                    setPaneSymbolSearchQuery('');
                  }
                }}
                className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                  isActivePane 
                    ? 'bg-tv-hover text-tv-accent border border-tv-accent/30' 
                    : 'text-tv-text hover:text-tv-accent hover:bg-tv-hover border border-transparent'
                }`}
                title="Change market for this window"
              >
                <SymbolLogo symbol={effectiveSymbol} size="xs" />
                <span className="truncate max-w-[90px] sm:max-w-[130px]">
                  {availableSymbols.find(s => s.id === effectiveSymbol || s.symbol === effectiveSymbol)?.display || effectiveSymbol.replace(/^frx|^cry/i, '')}
                </span>
                <ChevronDown className="w-3 h-3 text-tv-muted" />
              </button>

              {showSymbolDropdown && (
                <div 
                  className="absolute top-full left-0 mt-1 w-72 sm:w-80 bg-tv-card border border-tv-border rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header & Search */}
                  <div className="p-2 border-b border-tv-border flex flex-col gap-1.5 bg-tv-bg/50">
                    <div className="flex items-center justify-between text-[11px] font-bold text-tv-muted uppercase tracking-wider">
                      <span>Select Window Market</span>
                      <span className="text-[10px] text-tv-accent font-normal font-mono">{filteredPaneSymbols.length} available</span>
                    </div>

                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-2 text-tv-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search Forex, Boom/Crash, Crypto..."
                        value={paneSymbolSearchQuery}
                        onChange={(e) => setPaneSymbolSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-7 py-1 text-xs bg-tv-hover/70 border border-tv-border rounded text-tv-text placeholder:text-tv-muted focus:outline-none focus:border-tv-accent"
                        autoFocus
                      />
                      {paneSymbolSearchQuery && (
                        <button 
                          onClick={() => setPaneSymbolSearchQuery('')}
                          className="absolute right-2 text-tv-muted hover:text-tv-text"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Market Category Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'boom_crash', label: 'Boom/Crash' },
                        { id: 'forex', label: 'Forex' },
                        { id: 'derived', label: 'Derived' },
                        { id: 'crypto', label: 'Crypto' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setPaneMarketCategory(cat.id as any)}
                          className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                            paneMarketCategory === cat.id 
                              ? 'bg-tv-accent text-white font-bold' 
                              : 'bg-tv-hover/60 text-tv-muted hover:text-tv-text'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable Symbol List */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-tv-border/20">
                    {filteredPaneSymbols.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-tv-muted italic">
                        No symbols found
                      </div>
                    ) : (
                      filteredPaneSymbols.map((s) => {
                        const isSelected = effectiveSymbol === s.id || effectiveSymbol === s.symbol;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onSymbolChange?.(s.id);
                              onSelectPane?.();
                              setShowSymbolDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-tv-hover transition-colors cursor-pointer ${
                              isSelected ? 'bg-tv-accent/15 text-tv-accent font-bold' : 'text-tv-text'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <SymbolLogo symbol={s.symbol || s.id} size="sm" />
                              <div className="flex flex-col truncate">
                                <span className="truncate text-xs font-semibold">{s.display || s.symbol}</span>
                                <span className="text-[10px] text-tv-muted font-mono">{s.symbol}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-tv-hover text-tv-muted uppercase font-mono">
                                {s.marketDisplay || s.market}
                              </span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-tv-accent shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timeframe Quick Selector */}
            <div className="flex items-center gap-0.5 bg-tv-bg/60 p-0.5 rounded border border-tv-border/50">
              {PANE_TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimeframeChange?.(tf);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${effectiveTimeframe === tf ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Price + Indicators badge + Maximize Button */}
          <div className="flex items-center gap-2">
            {isMarketClosedWeekend(effectiveSymbol, availableSymbols) && (
              <span 
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-400 font-medium select-none"
                title="Forex and Commodities markets are closed on weekends. Candle timer is paused."
              >
                Market Closed
              </span>
            )}

            {currentLastPrice !== undefined && (
              <span className={`font-mono text-[11px] font-bold ${lastCandle && lastCandle.close >= lastCandle.open ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatSymbolPrice(currentLastPrice, effectiveSymbol)}
              </span>
            )}

            {activeIndicators.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tv-hover text-[10px] text-tv-muted">
                <Layers className="w-2.5 h-2.5" />
                {activeIndicators.length}
              </span>
            )}

            {onMaximizePane && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximizePane();
                }}
                title="Maximize this chart pane"
                className="p-1 text-tv-muted hover:text-tv-text hover:bg-tv-hover rounded transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Candlestick Chart Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
      {displayCandles.length === 0 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-tv-bg/90 backdrop-blur-sm">
          <OtivoPreloader 
            scale={0.78} 
            showCaption={false} 
            statusText={`Syncing ${effectiveSymbol.replace(/^frx|^cry/i, '')} · ${effectiveTimeframe}`} 
          />
        </div>
      )}
      
      {/* Watermark */}
      {chartSettings.showWatermark && (
        <div className="absolute inset-0 z-[2] pointer-events-none flex flex-col items-center justify-center select-none opacity-[0.06] text-tv-text font-black uppercase tracking-widest">
          <span className="text-6xl sm:text-8xl md:text-9xl">{effectiveSymbol.replace(/^frx|^cry/i, '')}</span>
          <span className="text-2xl sm:text-4xl mt-2 tracking-widest">{effectiveTimeframe}</span>
        </div>
      )}
      
      <div 
        ref={chartContainerRef} 
        className="w-full h-full tv-chart-container" 
        id={paneId ? `trading-chart-${paneId}` : "trading-chart-instance"}
        onMouseMove={handleMouseMove}
      />
      
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-[5] pointer-events-none"
      />

      <div 
        className={`absolute inset-0 z-[6] ${(!isHoveringScale || isDragging) && (activeTool || selectedDrawingId || isHoveringDrawing) ? 'pointer-events-auto' : 'pointer-events-none'}`} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ 
          cursor: activeTool 
            ? 'crosshair' 
            : (isDragging 
                ? (dragOffset?.dragHandle && dragOffset.dragHandle !== 'body' && dragOffset.dragHandle !== 'mid' ? 'crosshair' : 'grabbing') 
                : (hoveredHandle 
                    ? (hoveredHandle === 'mid' ? 'move' : 'crosshair') 
                    : (isHoveringDrawing ? 'pointer' : 'crosshair'))) 
        }}
      />

      {/* Floating Toolbar for Selected Drawing */}
      {selectedDrawingId && (
        <div 
          className="absolute z-[100] bg-[#1e222d] border border-[#2a2e39] shadow-2xl rounded-md p-1 flex items-center gap-0.5 animate-in zoom-in-95 duration-100 select-none"
          style={{ 
            left: '50%', 
            top: '12px',
            transform: 'translateX(-50%)'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Grip Icon (Visual only, no dragging) */}
          <div className="px-1 py-1.5 text-[#787b86] cursor-default flex items-center">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <button className="flex items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group" title="Templates">
            <LayoutGrid className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
          </button>

          {/* Type-specific tools */}
          {(() => {
            const drawing = drawings.find(d => d.id === selectedDrawingId);
            if (!drawing) return null;
            const isPosition = drawing.type === 'Long position' || drawing.type === 'Short position';
            const isFib = ['Fib retracement', 'Fib extension', 'Trend-based fib extension', 'Fib channel', 'Fib time zone'].includes(drawing.type);

            if (isPosition) {
              return (
                <>
                  <button 
                    className={`flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative ${drawing.data?.showBadges !== false ? 'bg-[#2a2e39]' : ''}`} 
                    title="Toggle Label"
                    onClick={() => updateDrawing(selectedDrawingId, { data: { ...drawing.data, showBadges: drawing.data?.showBadges === false ? true : false } })}
                  >
                    <TypeIcon className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                  </button>
                  {/* Target Fill Color */}
                  <div className="relative flex items-center px-1">
                    <button 
                      onClick={() => setShowColorPicker(showColorPicker === 'target' ? false : 'target')}
                      className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative"
                      title="Target Fill Color"
                    >
                      <PaintBucket className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                      <div className="w-4 h-1 rounded-sm shadow-sm absolute bottom-1.5" style={{ backgroundColor: drawing.color || '#089981' }} />
                    </button>
                    {showColorPicker === 'target' && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[140px]">
                        <div className="grid grid-cols-5 gap-2">
                          {TRADING_COLORS.map(c => (
                            <button
                              key={c}
                              className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm"
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                updateDrawing(selectedDrawingId, { color: c });
                                setShowColorPicker(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Stop Fill Color */}
                  <div className="relative flex items-center px-1">
                    <button 
                      onClick={() => setShowColorPicker(showColorPicker === 'stop' ? false : 'stop')}
                      className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative"
                      title="Stop Loss Fill Color"
                    >
                      <PaintBucket className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                      <div className="w-4 h-1 rounded-sm shadow-sm absolute bottom-1.5" style={{ backgroundColor: drawing.data?.stopColor || '#f23645' }} />
                    </button>
                    {showColorPicker === 'stop' && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[140px]">
                        <div className="grid grid-cols-5 gap-2">
                          {TRADING_COLORS.map(c => (
                            <button
                              key={c}
                              className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm"
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                updateDrawing(selectedDrawingId, { data: { ...drawing.data, stopColor: c } });
                                setShowColorPicker(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="flex items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group mx-0.5" 
                    title="Flip Long/Short"
                    onClick={() => {
                      updateDrawing(selectedDrawingId, { type: drawing.type === 'Long position' ? 'Short position' : 'Long position' });
                    }}
                  >
                    <ArrowUpDown className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
                  </button>
                </>
              );
            } else if (isFib) {
              return (
                <>
                  <div className="relative flex items-center px-1">
                     <button 
                       onClick={() => setShowColorPicker(showColorPicker === 'fib' ? false : 'fib')}
                       className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative"
                       title="Levels Color"
                     >
                       <Pencil className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                       <div 
                         className="w-4 h-1 rounded-sm shadow-sm absolute bottom-1.5" 
                         style={{ background: drawing.color === 'rainbow' ? 'linear-gradient(to right, #f23645, #ff9800, #4caf50, #2962ff)' : (drawing.color || '#ff9800') }} 
                       />
                     </button>
                     {showColorPicker === 'fib' && (
                       <div className="absolute top-full left-0 mt-2 p-2 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[140px]">
                         <div className="grid grid-cols-5 gap-2">
                           <button
                             className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm col-span-5"
                             style={{ background: 'linear-gradient(to right, #f23645, #ff9800, #4caf50, #2962ff)' }}
                             onClick={() => {
                               updateDrawing(selectedDrawingId, { color: 'rainbow' });
                               setShowColorPicker(false);
                             }}
                           />
                           {TRADING_COLORS.map(c => (
                             <button
                               key={c}
                               className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm"
                               style={{ backgroundColor: c }}
                               onClick={() => {
                                 updateDrawing(selectedDrawingId, { color: c });
                                 setShowColorPicker(false);
                               }}
                             />
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                  <div className="relative flex items-center px-1">
                    <button 
                      onClick={() => setShowColorPicker(showColorPicker === 'fib-width' ? false : 'fib-width')}
                      className="flex items-center gap-1 hover:bg-[#2a2e39] p-1.5 rounded transition-colors group" title="Line width"
                    >
                       <div className="w-4 bg-[#787b86] group-hover:bg-[#d1d4dc] rounded-full" style={{ height: `${Math.max(1, drawing.lineWidth || 2)}px` }} />
                       <span className="text-[11px] font-medium text-[#787b86] group-hover:text-[#d1d4dc]">{drawing.lineWidth || 2}px</span>
                    </button>
                    {showColorPicker === 'fib-width' && (
                       <div className="absolute top-full left-0 mt-2 py-1 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[80px] flex flex-col">
                         {[1, 2, 3, 4].map(w => (
                           <button
                             key={w}
                             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#2a2e39] text-[#d1d4dc] text-xs transition-colors"
                             onClick={() => {
                               updateDrawing(selectedDrawingId, { lineWidth: w });
                               setShowColorPicker(false);
                             }}
                           >
                             <div className="w-4 bg-current rounded-full" style={{ height: `${w}px` }} />
                             {w}px
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
                </>
              );
            } else if (drawing.type === 'Text') {
              return (
                <>
                  <div className="relative flex items-center px-1">
                    <button 
                      onClick={() => setShowColorPicker(showColorPicker === 'text' ? false : 'text')}
                      className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative" title="Text Color"
                    >
                      <TypeIcon className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                      <div className="w-4 h-1 rounded-sm shadow-sm absolute bottom-1.5" style={{ backgroundColor: drawing.color || '#2962ff' }} />
                    </button>
                    {showColorPicker === 'text' && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[140px]">
                        <div className="grid grid-cols-5 gap-2">
                          {TRADING_COLORS.map(c => (
                            <button
                              key={c}
                              className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm"
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                updateDrawing(selectedDrawingId, { color: c });
                                setShowColorPicker(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative mx-0.5" 
                    title="Settings"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDrawingSettingsOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
                  </button>
                </>
              );
            } else {
              // Standard Tool (Trend lines, etc)
              return (
                <>
                  <div className="relative flex items-center px-1">
                     <button 
                       onClick={() => setShowColorPicker(showColorPicker === 'color' ? false : 'color')}
                       className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative"
                       title="Color"
                     >
                       <Pencil className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                       <div 
                         className="w-4 h-1 rounded-sm shadow-sm absolute bottom-1.5" 
                         style={{ backgroundColor: drawing.color || '#2962ff' }} 
                       />
                     </button>
                     {showColorPicker === 'color' && (
                       <div className="absolute top-full left-0 mt-2 p-2 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[140px]">
                         <div className="grid grid-cols-5 gap-2">
                           {TRADING_COLORS.map(c => (
                             <button
                               key={c}
                               className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/5 shadow-sm"
                               style={{ backgroundColor: c }}
                               onClick={() => {
                                 updateDrawing(selectedDrawingId, { color: c });
                                 setShowColorPicker(false);
                               }}
                             />
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                  <button 
                    className="flex flex-col items-center justify-center w-8 h-8 hover:bg-[#2a2e39] rounded transition-colors group relative" 
                    title="Text / Settings"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDrawingSettingsOpen(true);
                    }}
                  >
                    <TypeIcon className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] mb-0.5" />
                  </button>
                  <div className="relative flex items-center px-1">
                    <button 
                      onClick={() => setShowColorPicker(showColorPicker === 'width' ? false : 'width')}
                      className="flex items-center gap-1 hover:bg-[#2a2e39] p-1.5 rounded transition-colors group" title="Line width"
                    >
                       <div className="w-4 bg-[#787b86] group-hover:bg-[#d1d4dc] rounded-full" style={{ height: `${Math.max(1, drawing.lineWidth || 2)}px` }} />
                       <span className="text-[11px] font-medium text-[#787b86] group-hover:text-[#d1d4dc]">{drawing.lineWidth || 2}px</span>
                    </button>
                    {showColorPicker === 'width' && (
                       <div className="absolute top-full left-0 mt-2 py-1 bg-[#1e222d] border border-tv-border rounded-lg shadow-2xl z-50 min-w-[80px] flex flex-col">
                         {[1, 2, 3, 4].map(w => (
                           <button
                             key={w}
                             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#2a2e39] text-[#d1d4dc] text-xs transition-colors"
                             onClick={() => {
                               updateDrawing(selectedDrawingId, { lineWidth: w });
                               setShowColorPicker(false);
                             }}
                           >
                             <div className="w-4 bg-current rounded-full" style={{ height: `${w}px` }} />
                             {w}px
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
                </>
              );
            }
          })()}
          
          {/* Separator */}
          <div className="w-[1px] h-4 bg-[#2a2e39] mx-1" />

          <div className="flex items-center gap-0.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawingSettingsOpen(true);
              }}
              title="Settings"
              className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2e39] rounded transition-colors group"
            >
              <Settings className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
            </button>
            
            <button 
              onClick={() => {
                  // Alert placeholder
              }}
              title="Add alert on drawing"
              className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2e39] rounded transition-colors group"
            >
              <Clock className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
            </button>

            <button 
              onClick={() => {
                const drawing = drawings.find(d => d.id === selectedDrawingId);
                if (drawing) updateDrawing(selectedDrawingId, { locked: !drawing.locked });
              }}
              title={drawings.find(d => d.id === selectedDrawingId)?.locked ? 'Unlock' : 'Lock'}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2e39] rounded transition-colors group"
            >
              {drawings.find(d => d.id === selectedDrawingId)?.locked ? (
                <Lock className="w-4 h-4 text-blue-500" />
              ) : (
                <Lock className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc] opacity-60 group-hover:opacity-100" />
              )}
            </button>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    removeDrawing(selectedDrawingId);
                    setToolbarPos(null);
                    setIsDrawingSettingsOpen(false);
                }}
                title="Remove"
                className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 rounded transition-colors group"
            >
              <Trash2 className="w-4 h-4 text-[#787b86] group-hover:text-red-400" />
            </button>
            
            <button className="w-8 h-8 flex items-center justify-center hover:bg-[#2a2e39] rounded transition-colors group" title="More">
              <MoreHorizontal className="w-4 h-4 text-[#787b86] group-hover:text-[#d1d4dc]" />
            </button>
          </div>
        </div>
      )}

      {/* Drawing Settings Modal */}
      {isDrawingSettingsOpen && selectedDrawingId && (
        <DrawingSettingsModal 
          isOpen={isDrawingSettingsOpen}
          drawing={drawings.find(d => d.id === selectedDrawingId) || null}
          onClose={() => setIsDrawingSettingsOpen(false)}
          onUpdate={(updates) => {
            updateDrawing(selectedDrawingId, updates, false);
          }}
        />
      )}

      {/* Legend / Info Overlay */}
      <div className="absolute top-2 left-2 sm:left-6 z-10 pointer-events-none select-none">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SymbolLogo symbol={effectiveSymbol} size="md" className="mr-0.5" />
            <span className="text-[12px] sm:text-[13px] font-bold text-tv-text uppercase">
                {effectiveSymbol.replace(/^frx|^cry/i, '')} · {effectiveTimeframe}
            </span>
            <div className="flex items-center gap-1 ml-1 text-[13px]">
               <span className="w-1.5 h-1.5 rounded-full bg-[#2962ff]/30 border border-[#2962ff]" />
               <div className="w-1.5 h-1.5 rounded-full bg-[#f23645]/30 border border-[#f23645]" />
            </div>
            {lastCandle && (
                <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-tv-text ml-2">
                    <span className="text-[#26a69a]">O<span className="text-tv-text ml-0.5">{formatSymbolPrice(lastCandle.open, effectiveSymbol)}</span></span>
                    <span className="text-[#26a69a]">H<span className="text-tv-text ml-0.5">{formatSymbolPrice(lastCandle.high, effectiveSymbol)}</span></span>
                    <span className="text-[#26a69a]">L<span className="text-tv-text ml-0.5">{formatSymbolPrice(lastCandle.low, effectiveSymbol)}</span></span>
                    <span className="text-[#26a69a]">C<span className="text-tv-text ml-0.5">{formatSymbolPrice(lastCandle.close, effectiveSymbol)}</span></span>
                </div>
            )}
          </div>
          
          {/* Indicators List Overlay */}
          <div className="flex flex-col gap-0 mt-1 pointer-events-auto">
            {activeIndicators.map(indicator => {
              const hidden = hiddenIndicators.includes(indicator.id);
              const data = indicatorData.find(d => d.id === indicator.id);
              
              return (
                <div 
                  key={indicator.id} 
                  className="flex items-center gap-1.5 group/ind px-1 py-0.5 rounded hover:bg-tv-hover/30 transition-colors max-w-fit"
                >
                  <div className="flex items-center gap-1 cursor-default">
                    <span className={`text-[12px] font-medium transition-colors ${hidden ? 'text-tv-muted' : 'text-tv-text'}`}>
                      {indicator.name}
                    </span>
                    {!hidden && indicator.id.toLowerCase().includes('session') && (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono select-none">
                        <span className="flex items-center gap-1 font-medium" style={{ color: indicator.params?.london_color || '#26a69a' }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: indicator.params?.london_color || '#26a69a' }} />
                          {(indicator.params?.london_start || '03:00').replace(':', '')}-{(indicator.params?.london_end || '12:00').replace(':', '')}:1234567
                        </span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: indicator.params?.ny_color || '#f59e0b' }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: indicator.params?.ny_color || '#f59e0b' }} />
                          {(indicator.params?.ny_start || '08:00').replace(':', '')}-{(indicator.params?.ny_end || '17:00').replace(':', '')}:1234567
                        </span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: indicator.params?.tokyo_color || '#00b4d8' }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: indicator.params?.tokyo_color || '#00b4d8' }} />
                          {(indicator.params?.tokyo_start || '20:00').replace(':', '')}-{(indicator.params?.tokyo_end || '04:00').replace(':', '')}:1234567
                        </span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: indicator.params?.sydney_color || '#ef5350' }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: indicator.params?.sydney_color || '#ef5350' }} />
                          {(indicator.params?.sydney_start || '17:00').replace(':', '')}-{(indicator.params?.sydney_end || '02:00').replace(':', '')}:1234567
                        </span>
                      </div>
                    )}
                    {!hidden && data && !indicator.id.toLowerCase().includes('session') && (
                      data.name.toLowerCase().includes('delta') && data.deltaData && data.deltaData.length > 0 ? (
                        <span className="text-[11px] font-mono font-medium text-[#26a69a]">
                          {data.deltaData[data.deltaData.length - 1].delta >= 0 ? '+' : ''}{data.deltaData[data.deltaData.length - 1].delta} (CVD: {data.deltaData[data.deltaData.length - 1].cvd})
                        </span>
                      ) : (
                        data.plots.map((plot, pIdx) => {
                          const lastPoint = plot[plot.length - 1];
                          if (!lastPoint) return null;
                          const isVol = data.name.toLowerCase() === 'volume';
                          const formatVal = (v: number | null) => {
                            if (v === null || isNaN(v)) return '';
                            if (isVol) {
                              if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
                              if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
                              return `${Math.round(v)}`;
                            }
                            return data.overlay ? formatSymbolPrice(v, activeSymbol) : v.toFixed(2);
                          };
                          return (
                            <span key={pIdx} className="text-[11px] font-mono font-medium" style={{ color: lastPoint.color }}>
                              {formatVal(lastPoint.value)}
                            </span>
                          );
                        })
                      )
                    )}
                  </div>
                  
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/ind:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleIndicatorVisibility(indicator.id); }}
                      className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-tv-text transition-colors"
                      title={hidden ? "Show" : "Hide"}
                    >
                      {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const ind = activeIndicators.find(i => i.id === indicator.id);
                        if (ind) {
                          const lenMatch = ind.code.match(/(?:len|length|hma_len|atr_len)\s*=\s*input\.(?:int|float)\(\s*(\d+)/i) || ind.code.match(/(?:sma|hma|rsi|atr)\s*\([^,]+,\s*(\d+)\)/i);
                          setIndicatorParamLength(lenMatch ? parseInt(lenMatch[1], 10) : 20);
                        }
                        setSelectedIndicatorForSettings(indicator.id); 
                      }}
                      className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-tv-text transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeIndicator(indicator.id); }}
                      className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* Dedicated Oscillator Sub-Panels (e.g. RSI, Delta) */}
      {nonOverlayIndicators.map(ind => (
        <OscillatorPanel
          key={ind.id}
          indicator={ind}
          chart={chartApi || chartRef.current}
          theme={theme}
          isHidden={hiddenIndicators.includes(ind.id)}
          onToggleVisibility={toggleIndicatorVisibility}
          onOpenSettings={setSelectedIndicatorForSettings}
          onRemove={removeIndicator}
        />
      ))}

      {/* Indicator Settings Modal */}
      {selectedIndicatorForSettings && (
        (() => {
          const targetIndicator = activeIndicators.find(i => i.id === selectedIndicatorForSettings);
          if (!targetIndicator) return null;
          return (
            <IndicatorSettingsModal
              indicator={targetIndicator}
              onClose={() => setSelectedIndicatorForSettings(null)}
            />
          );
        })()
      )}
    </div>
  );
};
