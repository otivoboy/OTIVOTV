import { Candle } from '../types';

/**
 * Calculates Heikin-Ashi smoothed candlesticks from standard OHLC candles
 * 
 * Formula:
 * - HA Close = (Open + High + Low + Close) / 4
 * - HA Open = (Previous HA Open + Previous HA Close) / 2 (or (Open + Close)/2 for 1st bar)
 * - HA High = Max(High, HA Open, HA Close)
 * - HA Low = Min(Low, HA Open, HA Close)
 */
export function calculateHeikinAshi(candles: Candle[]): Candle[] {
  if (!candles || candles.length === 0) return [];
  const result: Candle[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    let haOpen: number;
    if (i === 0) {
      haOpen = (c.open + c.close) / 2;
    } else {
      const prev = result[i - 1];
      haOpen = (prev.open + prev.close) / 2;
    }
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    
    result.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume
    });
  }
  
  return result;
}
