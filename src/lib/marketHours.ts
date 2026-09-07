/**
 * Market Hours & Trading Sessions Utility
 * Handles Forex & Commodities weekend closures and session schedules.
 */

import { MarketSymbol } from '../types';

/**
 * Checks if a given symbol belongs to Forex or Commodities market categories.
 * Forex & Spot Commodities (Gold, Silver, Oil) follow standard global trading hours
 * (closing on Friday ~21:00 UTC and reopening Sunday ~21:00 UTC).
 * Synthetics (Volatility, Crash/Boom) and Cryptos (BTC, ETH) trade 24/7/365.
 */
export function isForexOrCommodity(symbol: string, availableSymbols?: MarketSymbol[]): boolean {
  if (!symbol) return false;
  const s = symbol.toLowerCase();

  // Deriv and standard forex prefixes
  if (s.startsWith('frx')) return true;

  // Check against available symbols registry
  if (availableSymbols && availableSymbols.length > 0) {
    const found = availableSymbols.find(
      p => (p.id && p.id.toLowerCase() === s) || (p.symbol && p.symbol.toLowerCase() === s)
    );
    if (found && (found.market === 'forex' || found.market === 'commodities')) {
      return true;
    }
  }

  // Common forex pairs & commodity codes
  const fxCommodityPatterns = [
    'eurusd', 'gbpusd', 'usdjpy', 'usdchf', 'audusd', 'usdcad', 'nzdusd',
    'eurgbp', 'eurjpy', 'gbpjpy', 'euraud', 'eurcad', 'eurnzd', 'eurchf',
    'gbpaud', 'gbpcad', 'gbpnzd', 'gbpchf', 'audjpy', 'cadjpy', 'nzdjpy',
    'chfjpy', 'audcad', 'audnzd', 'audchf', 'nzdcad', 'nzdchf', 'cadchf',
    'xauusd', 'xagusd', 'gold', 'silver', 'oil', 'brent', 'wti'
  ];

  return fxCommodityPatterns.some(p => s.includes(p));
}

/**
 * Determines whether the market for a given symbol is currently closed for the weekend.
 * - Global Forex Close: Friday 21:00 UTC (17:00 EST)
 * - Saturday: Closed all day (00:00 - 24:00 UTC)
 * - Global Forex Open: Sunday 21:00 UTC (17:00 EST)
 * Synthetics & Cryptocurrencies never close on weekends.
 */
export function isMarketClosedWeekend(
  symbol: string,
  availableSymbols?: MarketSymbol[],
  nowMs: number = Date.now()
): boolean {
  if (!isForexOrCommodity(symbol, availableSymbols)) {
    return false; // Synthetics (Crash/Boom, Volatility) and Crypto trade 24/7/365
  }

  const d = new Date(nowMs);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const timeInHours = hour + minute / 60;

  // 1. Friday: Market closes at 21:00 UTC (17:00 EST)
  if (day === 5 && timeInHours >= 21) {
    return true;
  }

  // 2. Saturday: Closed all day
  if (day === 6) {
    return true;
  }

  // 3. Sunday: Closed until 21:00 UTC (reopens at 21:00 UTC)
  if (day === 0 && timeInHours < 21) {
    return true;
  }

  return false;
}
