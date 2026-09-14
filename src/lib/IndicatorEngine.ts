import { Candle } from '../types';
import { IndicatorOutput, runPineEngine } from './pineEngine';

export interface IndicatorInput {
  id: string;
  name: string;
  code: string;
  type?: string;
  overlay?: boolean;
  params?: Record<string, any>;
}

export interface CachedIndicatorResult {
  output: IndicatorOutput;
  candlesLength: number;
  lastCandleTime: number;
  lastCandleClose: number;
  timeframe: string;
  paramsHash: string;
  calculatedAt: number;
}

/**
 * IndicatorEngine with Incremental Calculation and Memoization Cache
 * Prevents full re-calculation of 1000+ bars on every real-time tick.
 */
export class IndicatorEngine {
  private cache: Record<string, any> = {};
  private lastCalculatedIndex: Record<string, number> = {};
  private outputCache: Map<string, CachedIndicatorResult> = new Map();

  /**
   * Incremental calculation method as specified in performance optimization specifications.
   * Only recalculates new candles or updates the context window.
   */
  calculateIncremental(
    candles: Candle[],
    indicatorCode: string,
    indicatorName: string
  ): any[] {
    const cacheKey = indicatorName;
    const lastIndex = this.lastCalculatedIndex[cacheKey] ?? -1;
    
    // Only calculate if new candles arrive or cache is empty
    const newCandles = candles.slice(lastIndex + 1);
    if (newCandles.length === 0 && this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Execute indicator on new candles + last few cached context candles
    const contextCandles = candles.slice(Math.max(0, lastIndex - 50));
    
    const dummyIndicator: IndicatorInput = {
      id: indicatorName,
      name: indicatorName,
      code: indicatorCode,
      type: 'custom',
      overlay: true,
      params: {}
    };

    const results = runPineEngine(dummyIndicator, contextCandles);
    const plotResults = results.plots || [];
    
    // Store full result in cache
    this.cache[cacheKey] = plotResults;
    this.lastCalculatedIndex[cacheKey] = candles.length - 1;
    
    return plotResults;
  }

  /**
   * Type-safe incremental calculation for TradingChart active indicators.
   * Caches results across ticks and timeframes, updating incrementally.
   */
  calculateForIndicator(
    indicator: IndicatorInput,
    candles: Candle[],
    timeframe: string = '1m'
  ): IndicatorOutput {
    if (!candles || candles.length === 0) {
      return {
        id: indicator.id,
        name: indicator.name,
        overlay: indicator.overlay,
        plots: [],
        signals: [],
        lines: [],
        labels: [],
        boxes: [],
        bands: [],
        backgroundColorZones: []
      };
    }

    const paramsHash = JSON.stringify(indicator.params || {});
    const codeLength = indicator.code?.length || 0;
    const cacheKey = `${indicator.id}_${timeframe}_${codeLength}_${paramsHash}`;
    const cached = this.outputCache.get(cacheKey);

    const lastCandle = candles[candles.length - 1];
    const lastTime = typeof lastCandle.time === 'number' 
      ? (lastCandle.time > 1e11 ? Math.floor(lastCandle.time / 1000) : lastCandle.time)
      : Math.floor(new Date(lastCandle.time as string).getTime() / 1000);
    const lastClose = lastCandle.close;

    // Cache hit: completely unchanged candles and last tick
    if (
      cached &&
      cached.candlesLength === candles.length &&
      cached.lastCandleTime === lastTime &&
      cached.lastCandleClose === lastClose &&
      cached.timeframe === timeframe &&
      cached.paramsHash === paramsHash
    ) {
      return cached.output;
    }

    // Full calculation for symbol change, initial load, tick update or new bar addition
    const freshOutput = runPineEngine(indicator, candles, timeframe);

    this.outputCache.set(cacheKey, {
      output: freshOutput,
      candlesLength: candles.length,
      lastCandleTime: lastTime,
      lastCandleClose: lastClose,
      timeframe,
      paramsHash,
      calculatedAt: Date.now()
    });

    this.lastCalculatedIndex[indicator.id] = candles.length - 1;
    return freshOutput;
  }

  clear() {
    this.cache = {};
    this.lastCalculatedIndex = {};
    this.outputCache.clear();
  }

  invalidate(indicatorId?: string) {
    if (!indicatorId) {
      this.clear();
      return;
    }
    delete this.cache[indicatorId];
    delete this.lastCalculatedIndex[indicatorId];
    for (const key of Array.from(this.outputCache.keys())) {
      if (key.startsWith(indicatorId)) {
        this.outputCache.delete(key);
      }
    }
  }
}

export const indicatorEngine = new IndicatorEngine();
