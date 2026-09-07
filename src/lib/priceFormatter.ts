/**
 * Price formatting utility for TradingView & Lightweight Charts
 * Dynamically resolves precision and minMove for various asset classes:
 * - Gold / Commodities: 2 decimals (e.g. 4582.08)
 * - Crypto (BTC / ETH): 2 decimals (e.g. 85420.50)
 * - Synthetic / Volatility Indices: 2 decimals (e.g. 1245.30)
 * - Forex JPY Pairs (USDJPY, EURJPY, GBPJPY): 3 decimals (e.g. 154.210)
 * - Forex Standard Pairs (EURUSD, GBPUSD, etc.): 5 decimals (e.g. 1.08452)
 */

export interface SymbolPriceFormat {
  type: 'price';
  precision: number;
  minMove: number;
}

export function getSymbolPriceFormat(symbol: string, samplePrice?: number): SymbolPriceFormat {
  if (!symbol) return { type: 'price', precision: 2, minMove: 0.01 };
  
  const clean = symbol.toUpperCase().replace(/^FRX|^CRY/, '');

  // 1. Gold (XAUUSD / Gold) - 2 decimal places
  if (clean.includes('XAU') || clean.includes('GOLD')) {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 2. Silver (XAGUSD / Silver) - 3 decimal places
  if (clean.includes('XAG') || clean.includes('SILVER')) {
    return { type: 'price', precision: 3, minMove: 0.001 };
  }

  // 3. Boom and Crash Indices (BOOM50, BOOM1000, CRASH50, CRASH1000, etc.) - 2 decimal places
  if (clean.startsWith('BOOM') || clean.startsWith('CRASH')) {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 4. Volatility 50 Index (R_50, 1HZ50V) - Exactly 4 decimal places
  if (clean === 'R_50' || clean === '1HZ50V' || clean === 'VOL_50') {
    return { type: 'price', precision: 4, minMove: 0.0001 };
  }

  // 5. Volatility 75 Index (R_75, 1HZ75V) - 4 decimal places
  if (clean === 'R_75' || clean === '1HZ75V' || clean === 'VOL_75') {
    return { type: 'price', precision: 4, minMove: 0.0001 };
  }

  // 6. Volatility 10 / 25 Index - 3 decimal places
  if (clean.includes('10V') || clean.includes('25V') || clean === 'R_10' || clean === 'R_25' || clean === '1HZ10V' || clean === '1HZ25V') {
    return { type: 'price', precision: 3, minMove: 0.001 };
  }

  // 7. Volatility 100 Index (1HZ100V, R_100) - 2 decimal places
  if (clean.includes('100V') || clean === 'R_100' || clean === '1HZ100V') {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 7. General Synthetic / Volatility Indices fallback
  if (clean.startsWith('1HZ') || clean.startsWith('R_') || clean.startsWith('VOL')) {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 8. Crypto (BTC, ETH, SOL) - 2 decimal places
  if (clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL') || clean.includes('CRY')) {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 9. Forex JPY pairs (USDJPY, EURJPY, GBPJPY, etc.) - 3 decimal places
  if (clean.includes('JPY')) {
    return { type: 'price', precision: 3, minMove: 0.001 };
  }

  // 10. Oil & Energy
  if (clean.includes('USO') || clean.includes('OIL') || clean.includes('BRENT')) {
    return { type: 'price', precision: 2, minMove: 0.01 };
  }

  // 11. Dynamic range fallback if samplePrice is provided
  if (samplePrice !== undefined && samplePrice > 0) {
    if (samplePrice >= 1000) {
      return { type: 'price', precision: 2, minMove: 0.01 };
    }
    if (samplePrice >= 50) {
      return { type: 'price', precision: 3, minMove: 0.001 };
    }
    return { type: 'price', precision: 5, minMove: 0.00001 };
  }

  // 12. Standard Forex (EURUSD, GBPUSD, AUDUSD, USDCAD, USDCHF, NZDUSD, EURGBP) - 5 decimal places
  return { type: 'price', precision: 5, minMove: 0.00001 };
}

/**
 * Formats a numeric price cleanly based on the asset symbol
 * Supports both (price, symbol) and (symbol, price) signatures seamlessly
 */
export function formatSymbolPrice(
  a: number | string | undefined | null,
  b?: number | string | null
): string {
  let price: number | undefined;
  let symbol: string = '';

  if (typeof a === 'number') {
    price = a;
    symbol = typeof b === 'string' ? b : '';
  } else if (typeof b === 'number') {
    price = b;
    symbol = typeof a === 'string' ? a : '';
  } else if (typeof a === 'string' && !isNaN(Number(a))) {
    price = Number(a);
    symbol = typeof b === 'string' ? b : '';
  } else if (typeof b === 'string' && !isNaN(Number(b))) {
    price = Number(b);
    symbol = typeof a === 'string' ? a : '';
  }

  if (price === undefined || isNaN(price)) return '---';
  const format = getSymbolPriceFormat(symbol, price);
  return price.toFixed(format.precision);
}
