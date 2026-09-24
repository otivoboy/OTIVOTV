import { Candle, MarketSymbol, Tick, Timeframe } from '../types';
import { useMarketStore, INITIAL_CURRENCY_PAIRS } from '../store/useMarketStore';

const PUBLIC_DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public?app_id=1089";
const FALLBACK_DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public?app_id=1089";
const ALT_DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public?app_id=1089";

const TIMEFRAMES: Record<string, number> = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "4h": 14400,
  "5h": 18000,
  "8h": 28800,
  "1d": 86400,
  "1w": 604800,
  "1M": 2592000,
};

const TIMEFRAME_TO_GRANULARITY: Record<string, number> = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 3600, // Aggregate 1h to 2h (Deriv API does not support 7200)
  "4h": 14400,
  "5h": 3600, // Aggregate 1h to 5h
  "8h": 14400, // Aggregate 4h to 8h
  "1d": 86400,
  "1w": 86400, // Aggregate 1d to 1w
  "1M": 86400, // Aggregate 1d to 1M
};

// Client-side in-memory candle store for caching across timeframes and symbols
const clientCandlesStore: Record<string, Record<string, Candle[]>> = {};
const lastFetchedTime: Record<string, number> = {};
const lastPrices: Record<string, number> = {};
const requestedSymbols = new Set<string>([
  '1HZ100V', 'R_100', '1HZ75V', 'R_75', '1HZ50V', 'R_50', '1HZ25V', 'R_25', '1HZ10V', 'R_10',
  'stpRNG', 'JD10', 'JD25', 'JD50', 'JD75', 'JD100', 'RDBULL', 'RDBEAR',
  'frxEURUSD', 'cryBTCUSD', 'frxXAUUSD'
]);

Object.keys(TIMEFRAMES).forEach(tf => {
  clientCandlesStore[tf] = {};
});

function ensureStore(symbol: string) {
  Object.keys(TIMEFRAMES).forEach(tf => {
    if (!clientCandlesStore[tf]) clientCandlesStore[tf] = {};
    if (!clientCandlesStore[tf][symbol]) clientCandlesStore[tf][symbol] = [];
  });
}

export function aggregateCandles(sourceCandles: Candle[], targetSeconds: number): Candle[] {
  if (!sourceCandles || sourceCandles.length === 0) return [];
  const aggregated: Candle[] = [];
  let currentBucket: Candle | null = null;
  
  sourceCandles.forEach((c: Candle) => {
    const bucketTime = Math.floor(c.time / targetSeconds) * targetSeconds;
    
    if (!currentBucket || currentBucket.time !== bucketTime) {
      if (currentBucket) aggregated.push(currentBucket);
      currentBucket = { ...c, time: bucketTime };
    } else {
      currentBucket.high = Math.max(currentBucket.high, c.high);
      currentBucket.low = Math.min(currentBucket.low, c.low);
      currentBucket.close = c.close;
    }
  });
  
  if (currentBucket) aggregated.push(currentBucket);
  return aggregated;
}

export function aggregateDailyToWeekly(dailyCandles: Candle[]): Candle[] {
  if (!dailyCandles || dailyCandles.length === 0) return [];
  const weekly: Candle[] = [];
  let currentWeek: Candle | null = null;
  
  dailyCandles.forEach(c => {
    const date = new Date(c.time * 1000);
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    const weekTime = Math.floor(monday.getTime() / 1000);

    if (!currentWeek || currentWeek.time !== weekTime) {
      if (currentWeek) weekly.push(currentWeek);
      currentWeek = {
        time: weekTime,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      };
    } else {
      currentWeek.high = Math.max(currentWeek.high, c.high);
      currentWeek.low = Math.min(currentWeek.low, c.low);
      currentWeek.close = c.close;
    }
  });

  if (currentWeek) weekly.push(currentWeek);
  return weekly;
}

export function aggregateDailyToMonthly(dailyCandles: Candle[]): Candle[] {
  if (!dailyCandles || dailyCandles.length === 0) return [];
  const monthly: Candle[] = [];
  let currentMonth: Candle | null = null;
  let currentMonthKey = '';

  dailyCandles.forEach(c => {
    const date = new Date(c.time * 1000);
    const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const monthStart = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000);

    if (!currentMonth || currentMonthKey !== monthKey) {
      if (currentMonth) monthly.push(currentMonth);
      currentMonthKey = monthKey;
      currentMonth = {
        time: monthStart,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      };
    } else {
      currentMonth.high = Math.max(currentMonth.high, c.high);
      currentMonth.low = Math.min(currentMonth.low, c.low);
      currentMonth.close = c.close;
    }
  });

  if (currentMonth) monthly.push(currentMonth);
  return monthly;
}

// Generate instant synthetic fallback candles so chart is never empty on cold start
export function generateSeedCandles(symbol: string, timeframe: string = '1m', count: number = 200): Candle[] {
  const seconds = TIMEFRAMES[timeframe] || 60;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * seconds;

  let basePrice = 1000.0;
  let volatility = 0.002;

  const symUpper = symbol.toUpperCase();
  if (symUpper.includes('BTC')) { basePrice = 64500.0; volatility = 0.003; }
  else if (symUpper.includes('ETH')) { basePrice = 3450.0; volatility = 0.0035; }
  else if (symUpper.includes('XAU') || symUpper.includes('GOLD')) { basePrice = 2380.0; volatility = 0.0015; }
  else if (symUpper.includes('XAG') || symUpper.includes('SILVER')) { basePrice = 31.40; volatility = 0.002; }
  // Boom & Crash Indices
  else if (symUpper.startsWith('BOOM1000') || symUpper.startsWith('CRASH1000')) { basePrice = 11200.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM900') || symUpper.startsWith('CRASH900')) { basePrice = 9400.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM600') || symUpper.startsWith('CRASH600')) { basePrice = 7600.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM500') || symUpper.startsWith('CRASH500')) { basePrice = 6800.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM300') || symUpper.startsWith('CRASH300')) { basePrice = 5500.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM200') || symUpper.startsWith('CRASH200')) { basePrice = 4800.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM150') || symUpper.startsWith('CRASH150')) { basePrice = 4000.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM100') || symUpper.startsWith('CRASH100')) { basePrice = 3200.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM50') || symUpper.startsWith('CRASH50')) { basePrice = 2500.0; volatility = 0.0025; }
  else if (symUpper.startsWith('BOOM') || symUpper.startsWith('CRASH')) { basePrice = 5000.0; volatility = 0.0025; }
  // Synthetic Volatility Indices
  else if (symUpper.includes('1HZ300V')) { basePrice = 4250.0; volatility = 0.004; }
  else if (symUpper.includes('1HZ250V')) { basePrice = 3120.0; volatility = 0.0038; }
  else if (symUpper.includes('1HZ200V')) { basePrice = 2840.0; volatility = 0.0035; }
  else if (symUpper.includes('1HZ150V')) { basePrice = 1890.0; volatility = 0.0032; }
  else if (symUpper.includes('1HZ100V')) { basePrice = 920.0; volatility = 0.003; }
  else if (symUpper.includes('R_100')) { basePrice = 547.0; volatility = 0.003; }
  else if (symUpper.includes('1HZ75V')) { basePrice = 6210.0; volatility = 0.0035; }
  else if (symUpper.includes('R_75')) { basePrice = 46640.0; volatility = 0.0035; }
  else if (symUpper.includes('1HZ50V')) { basePrice = 233150.0; volatility = 0.0025; }
  else if (symUpper.includes('R_50')) { basePrice = 98.7; volatility = 0.0025; }
  else if (symUpper.includes('1HZ25V')) { basePrice = 828800.0; volatility = 0.002; }
  else if (symUpper.includes('R_25')) { basePrice = 2720.0; volatility = 0.002; }
  else if (symUpper.includes('1HZ10V')) { basePrice = 9716.0; volatility = 0.0015; }
  else if (symUpper.includes('R_10')) { basePrice = 4808.0; volatility = 0.0015; }
  // Step Index
  else if (symUpper.includes('STPRNG') || symUpper.includes('STEP')) { basePrice = 8520.0; volatility = 0.0018; }
  // Jump Indices
  else if (symUpper.startsWith('JD100') || symUpper.includes('JUMP100')) { basePrice = 94500.0; volatility = 0.0035; }
  else if (symUpper.startsWith('JD75') || symUpper.includes('JUMP75')) { basePrice = 72400.0; volatility = 0.003; }
  else if (symUpper.startsWith('JD50') || symUpper.includes('JUMP50')) { basePrice = 48600.0; volatility = 0.0028; }
  else if (symUpper.startsWith('JD25') || symUpper.includes('JUMP25')) { basePrice = 26500.0; volatility = 0.0025; }
  else if (symUpper.startsWith('JD10') || symUpper.includes('JUMP10')) { basePrice = 38400.0; volatility = 0.002; }
  // Bull & Bear Market Indices
  else if (symUpper.startsWith('RDBULL') || symUpper.includes('BULL')) { basePrice = 2480.0; volatility = 0.0025; }
  else if (symUpper.startsWith('RDBEAR') || symUpper.includes('BEAR')) { basePrice = 1760.0; volatility = 0.0025; }
  // Forex JPY pairs
  else if (symUpper.includes('CHFJPY')) { basePrice = 175.40; volatility = 0.0006; }
  else if (symUpper.includes('GBPJPY')) { basePrice = 196.20; volatility = 0.0007; }
  else if (symUpper.includes('EURJPY')) { basePrice = 163.50; volatility = 0.0006; }
  else if (symUpper.includes('CADJPY')) { basePrice = 112.30; volatility = 0.0006; }
  else if (symUpper.includes('AUDJPY')) { basePrice = 98.45; volatility = 0.0006; }
  else if (symUpper.includes('NZDJPY')) { basePrice = 90.65; volatility = 0.0006; }
  else if (symUpper.includes('USDJPY')) { basePrice = 155.40; volatility = 0.0006; }
  // Forex Cross Pairs
  else if (symUpper.includes('GBPNZD')) { basePrice = 2.1150; volatility = 0.0005; }
  else if (symUpper.includes('GBPAUD')) { basePrice = 1.9420; volatility = 0.0005; }
  else if (symUpper.includes('EURNZD')) { basePrice = 1.7940; volatility = 0.0004; }
  else if (symUpper.includes('GBPCAD')) { basePrice = 1.7480; volatility = 0.0004; }
  else if (symUpper.includes('EURAUD')) { basePrice = 1.6520; volatility = 0.0004; }
  else if (symUpper.includes('EURCAD')) { basePrice = 1.4830; volatility = 0.0004; }
  else if (symUpper.includes('GBPUSD')) { basePrice = 1.2720; volatility = 0.0004; }
  else if (symUpper.includes('GBPCHF')) { basePrice = 1.1180; volatility = 0.0004; }
  else if (symUpper.includes('AUDNZD')) { basePrice = 1.0880; volatility = 0.0003; }
  else if (symUpper.includes('EURUSD')) { basePrice = 1.0850; volatility = 0.0004; }
  else if (symUpper.includes('EURCHF')) { basePrice = 0.9480; volatility = 0.0003; }
  else if (symUpper.includes('AUDCAD')) { basePrice = 0.8980; volatility = 0.0003; }
  else if (symUpper.includes('EURGBP')) { basePrice = 0.8540; volatility = 0.0003; }
  else if (symUpper.includes('NZDCAD')) { basePrice = 0.8260; volatility = 0.0003; }
  else if (symUpper.includes('CADCHF')) { basePrice = 0.6400; volatility = 0.0003; }
  else if (symUpper.includes('AUDCHF')) { basePrice = 0.5740; volatility = 0.0003; }
  else if (symUpper.includes('NZDCHF')) { basePrice = 0.5280; volatility = 0.0003; }

  const candles: Candle[] = [];
  let curPrice = basePrice;

  for (let i = 0; i < count; i++) {
    const t = startTime + i * seconds;
    const change = (Math.random() - 0.49) * volatility * curPrice;
    const open = curPrice;
    const close = Math.max(0.00001, curPrice + change);
    const wickHigh = Math.random() * volatility * 0.8 * curPrice;
    const wickLow = Math.random() * volatility * 0.8 * curPrice;
    const high = Math.max(open, close) + wickHigh;
    const low = Math.min(open, close) - wickLow;

    candles.push({
      time: t,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5))
    });

    curPrice = close;
  }

  return candles;
}

class DerivDirectClient {
  private ws: WebSocket | null = null;
  private wsUrlIndex = 0;
  private wsUrls = [PUBLIC_DERIV_WS_URL, FALLBACK_DERIV_WS_URL, ALT_DERIV_WS_URL];
  private requestId = 0;
  private pingInterval: any = null;
  private pollInterval: any = null;
  private reconnectTimeout: any = null;
  private isConnecting = false;
  private isDestroyed = false;

  private candleListeners = new Map<string, Set<(candles: Candle[]) => void>>();
  private candleUpdateListeners = new Map<string, Set<(candle: Candle) => void>>();
  private tickListeners = new Map<string, Set<(tick: Tick) => void>>();

  public onCandles(symbol: string, timeframe: string, callback: (candles: Candle[]) => void) {
    const key = `${symbol.toLowerCase()}_${timeframe}`;
    if (!this.candleListeners.has(key)) {
      this.candleListeners.set(key, new Set());
    }
    this.candleListeners.get(key)!.add(callback);
    const cached = clientCandlesStore[timeframe]?.[symbol];
    if (cached && cached.length > 0) {
      callback(cached);
    }
  }

  public offCandles(symbol: string, timeframe: string, callback: (candles: Candle[]) => void) {
    const key = `${symbol.toLowerCase()}_${timeframe}`;
    this.candleListeners.get(key)?.delete(callback);
  }

  public onCandleUpdate(symbol: string, timeframe: string, callback: (candle: Candle) => void) {
    const key = `${symbol.toLowerCase()}_${timeframe}`;
    if (!this.candleUpdateListeners.has(key)) {
      this.candleUpdateListeners.set(key, new Set());
    }
    this.candleUpdateListeners.get(key)!.add(callback);
  }

  public offCandleUpdate(symbol: string, timeframe: string, callback: (candle: Candle) => void) {
    const key = `${symbol.toLowerCase()}_${timeframe}`;
    this.candleUpdateListeners.get(key)?.delete(callback);
  }

  public onTick(symbol: string, callback: (tick: Tick) => void) {
    const key = symbol.toLowerCase();
    if (!this.tickListeners.has(key)) {
      this.tickListeners.set(key, new Set());
    }
    this.tickListeners.get(key)!.add(callback);
  }

  public offTick(symbol: string, callback: (tick: Tick) => void) {
    const key = symbol.toLowerCase();
    this.tickListeners.get(key)?.delete(callback);
  }

  public getCachedCandles(symbol: string, timeframe: string): Candle[] | null {
    const direct = clientCandlesStore[timeframe]?.[symbol];
    if (direct && direct.length > 0) return direct;

    const targetSeconds = TIMEFRAMES[timeframe];
    if (!targetSeconds) return null;

    if (timeframe === "2h" || timeframe === "5h") {
      const h1 = clientCandlesStore["1h"]?.[symbol];
      if (h1 && h1.length > 0) {
        const aggregated = aggregateCandles(h1, targetSeconds);
        if (aggregated.length > 0) {
          if (!clientCandlesStore[timeframe]) clientCandlesStore[timeframe] = {};
          clientCandlesStore[timeframe][symbol] = aggregated;
          return aggregated;
        }
      }
    }

    if (timeframe === "8h") {
      const h4 = clientCandlesStore["4h"]?.[symbol];
      if (h4 && h4.length > 0) {
        const aggregated = aggregateCandles(h4, targetSeconds);
        if (aggregated.length > 0) {
          if (!clientCandlesStore[timeframe]) clientCandlesStore[timeframe] = {};
          clientCandlesStore[timeframe][symbol] = aggregated;
          return aggregated;
        }
      }
    }

    if (timeframe === "1w") {
      const d1 = clientCandlesStore["1d"]?.[symbol];
      if (d1 && d1.length > 0) {
        const aggregated = aggregateDailyToWeekly(d1);
        if (aggregated.length > 0) {
          if (!clientCandlesStore[timeframe]) clientCandlesStore[timeframe] = {};
          clientCandlesStore[timeframe][symbol] = aggregated;
          return aggregated;
        }
      }
    }

    if (timeframe === "1M") {
      const d1 = clientCandlesStore["1d"]?.[symbol];
      if (d1 && d1.length > 0) {
        const aggregated = aggregateDailyToMonthly(d1);
        if (aggregated.length > 0) {
          if (!clientCandlesStore[timeframe]) clientCandlesStore[timeframe] = {};
          clientCandlesStore[timeframe][symbol] = aggregated;
          return aggregated;
        }
      }
    }

    if (["3m", "5m", "15m", "30m"].includes(timeframe)) {
      const m1 = clientCandlesStore["1m"]?.[symbol];
      if (m1 && m1.length > 0) {
        const aggregated = aggregateCandles(m1, targetSeconds);
        if (aggregated.length > 0) {
          if (!clientCandlesStore[timeframe]) clientCandlesStore[timeframe] = {};
          clientCandlesStore[timeframe][symbol] = aggregated;
          return aggregated;
        }
      }
    }

    return null;
  }

  public start() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;
    this.isConnecting = true;
    const url = this.wsUrls[this.wsUrlIndex];
    console.log(`[DerivClient] 🌐 Connecting directly to Deriv WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);
    } catch (err: any) {
      console.warn(`[DerivClient] ❌ WebSocket instantiation error:`, err);
      this.handleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log(`[DerivClient] ✅ Connected to Deriv Public WebSocket`);
      this.isConnecting = false;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Keepalive ping every 15s
      if (this.pingInterval) clearInterval(this.pingInterval);
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ ping: 1 }));
        }
      }, 15000);

      // Request active symbols
      this.send({
        active_symbols: "brief",
        product_type: "basic",
        req_id: ++this.requestId
      });

      // Fetch active state symbol and timeframe immediately
      const state = useMarketStore.getState();
      this.subscribe(state.activeSymbol, state.activeTimeframe);
      this.prefetchMultiTimeframes(state.activeSymbol);
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.error) {
          // Gracefully absorb Deriv rate-limit/info notices
          return;
        }
        this.handleMessage(msg);
      } catch (e) {
        // Safe catch
      }
    };

    this.ws.onerror = (err) => {
      console.warn(`[DerivClient] WebSocket error:`, err);
    };

    this.ws.onclose = () => {
      console.warn(`[DerivClient] WebSocket closed. Reconnecting...`);
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    this.isConnecting = false;
    if (this.reconnectTimeout) return;
    this.wsUrlIndex = (this.wsUrlIndex + 1) % this.wsUrls.length;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 2500);
  }

  private send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public subscribe(symbol: string, timeframe: string) {
    if (!symbol) return;
    requestedSymbols.add(symbol);
    ensureStore(symbol);

    const granularity = TIMEFRAME_TO_GRANULARITY[timeframe] || 60;
    const historyKey = `${symbol}_${timeframe}`;
    const now = Date.now();
    
    // Request deep candle history (5000 candles) + subscribe to live ticks/OHLC
    this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 5000,
      end: "latest",
      style: "candles",
      granularity: granularity,
      subscribe: 1,
      req_id: ++this.requestId,
      passthrough: {
        symbol: symbol,
        timeframe: timeframe,
        granularity: granularity
      }
    });

    // Also subscribe to live ticks stream for real-time orderbook/price updates
    this.send({
      ticks: symbol,
      subscribe: 1,
      req_id: ++this.requestId,
      passthrough: { symbol }
    });

    lastFetchedTime[historyKey] = now;
  }

  public prefetchMultiTimeframes(symbol: string) {
    if (!symbol) return;
    const timeframesToFetch = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
    timeframesToFetch.forEach((tf, index) => {
      setTimeout(() => {
        const gran = TIMEFRAME_TO_GRANULARITY[tf] || 60;
        this.send({
          ticks_history: symbol,
          adjust_start_time: 1,
          count: 1000,
          end: "latest",
          style: "candles",
          granularity: gran,
          req_id: ++this.requestId,
          passthrough: {
            symbol: symbol,
            timeframe: tf,
            granularity: gran,
            isMultiPrefetch: true
          }
        });
      }, index * 120);
    });
  }

  private handleMessage(msg: any) {
    if (!msg) return;

    // 1. Active Symbols List
    if (msg.msg_type === "active_symbols" && Array.isArray(msg.active_symbols)) {
      const mappedSymbols: MarketSymbol[] = msg.active_symbols.map((item: any) => {
        const sym = item.underlying_symbol || item.symbol;
        return {
          id: sym,
          symbol: sym,
          display: item.display_name || sym,
          market: item.market || 'other',
          marketDisplay: item.market_display_name || item.market || 'Other',
          submarket: item.submarket,
          submarketDisplay: item.submarket_display_name,
          pip: item.pip,
          isOpen: item.exchange_is_open === 1 && !item.is_trading_suspended
        };
      });

      if (mappedSymbols.length > 0) {
        useMarketStore.getState().setAvailableSymbols(mappedSymbols);
      }
      return;
    }

    // 2. Candle History or Live Poll
    if (msg.msg_type === "candles" && Array.isArray(msg.candles)) {
      const symbol = msg.passthrough?.symbol || msg.echo_req?.ticks_history;
      if (!symbol) return;
      ensureStore(symbol);

      // A. Live Poll response
      if (msg.passthrough?.isLivePoll) {
        if (msg.candles.length === 0) return;
        const rawLast = msg.candles[msg.candles.length - 1];
        const liveCandle: Candle = {
          time: Number(rawLast.epoch),
          open: parseFloat(rawLast.open),
          high: parseFloat(rawLast.high),
          low: parseFloat(rawLast.low),
          close: parseFloat(rawLast.close)
        };

        this.applyLiveCandle(symbol, liveCandle);
        return;
      }

      // B. Deep Candle History response
      const tf = msg.passthrough?.timeframe || "1m";
      const parsedCandles: Candle[] = msg.candles.map((c: any) => ({
        time: Number(c.epoch),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close)
      })).sort((a: Candle, b: Candle) => a.time - b.time);

      if (parsedCandles.length > 0) {
        let finalCandles = parsedCandles;

        // Custom timeframes aggregation
        if (tf === "2h" && parsedCandles.length > 0) {
          finalCandles = aggregateCandles(parsedCandles, 7200);
        } else if (tf === "5h" && parsedCandles.length > 0) {
          finalCandles = aggregateCandles(parsedCandles, 18000);
        } else if (tf === "8h" && parsedCandles.length > 0) {
          finalCandles = aggregateCandles(parsedCandles, 28800);
        } else if (tf === "1w" && parsedCandles.length > 0) {
          finalCandles = aggregateDailyToWeekly(parsedCandles);
        } else if (tf === "1M" && parsedCandles.length > 0) {
          finalCandles = aggregateDailyToMonthly(parsedCandles);
        }

        clientCandlesStore[tf][symbol] = finalCandles;
        
        const state = useMarketStore.getState();
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
          state.setCandlesByTimeframe(tf, finalCandles, symbol);
          if (state.activeTimeframe === tf) {
            state.setCandles(finalCandles);
          }
        }

        // Notify specific listeners for this symbol & timeframe
        const listenerKey = `${symbol.toLowerCase()}_${tf}`;
        const listeners = this.candleListeners.get(listenerKey);
        if (listeners) {
          listeners.forEach(cb => {
            try { cb(finalCandles); } catch (err) { console.warn('Candle listener error:', err); }
          });
        }

        // Set last tick from the most recent candle close
        const last = finalCandles[finalCandles.length - 1];
        if (last) {
          lastPrices[symbol] = last.close;
          const tickObj: Tick = {
            symbol: symbol,
            price: last.close,
            time: last.time * 1000
          };
          if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
            state.addTick(tickObj);
          }
          const tListeners = this.tickListeners.get(symbol.toLowerCase());
          if (tListeners) {
            tListeners.forEach(cb => {
              try { cb(tickObj); } catch (err) { console.warn('Tick listener error:', err); }
            });
          }
        }
      }
      return;
    }

    // 3. Live OHLC Stream Update
    if (msg.msg_type === "ohlc" && msg.ohlc) {
      const o = msg.ohlc;
      const symbol = o.symbol;
      if (!symbol) return;
      ensureStore(symbol);

      const liveCandle: Candle = {
        time: Number(o.open_time || o.epoch),
        open: parseFloat(o.open),
        high: parseFloat(o.high),
        low: parseFloat(o.low),
        close: parseFloat(o.close)
      };

      this.applyLiveCandle(symbol, liveCandle);
      return;
    }

    // 4. Live Tick Update
    if (msg.msg_type === "tick" && msg.tick) {
      const t = msg.tick;
      const symbol = t.symbol;
      const price = parseFloat(t.quote);
      const epoch = Number(t.epoch);

      if (symbol && !isNaN(price)) {
        lastPrices[symbol] = price;
        const tickObj: Tick = {
          symbol: symbol,
          price: price,
          time: epoch * 1000
        };
        const state = useMarketStore.getState();
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
          state.addTick(tickObj);
        }
        const tListeners = this.tickListeners.get(symbol.toLowerCase());
        if (tListeners) {
          tListeners.forEach(cb => {
            try { cb(tickObj); } catch (err) { console.warn('Tick listener error:', err); }
          });
        }
        this.applyTickToCandles(symbol, price, epoch);
      }
    }
  }

  private applyLiveCandle(symbol: string, liveCandle: Candle) {
    const price = liveCandle.close;
    lastPrices[symbol] = price;
    const state = useMarketStore.getState();
    const isActiveSym = state.activeSymbol.toLowerCase() === symbol.toLowerCase();

    if (isActiveSym) {
      const tickObj: Tick = {
        symbol: symbol,
        price: price,
        time: liveCandle.time * 1000
      };
      state.addTick(tickObj);
    }
    const tListeners = this.tickListeners.get(symbol.toLowerCase());
    if (tListeners) {
      tListeners.forEach(cb => {
        try { cb({ symbol, price, time: liveCandle.time * 1000 }); } catch (err) { console.warn('Tick listener error:', err); }
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const m1Bucket = Math.max(Math.floor(liveCandle.time / 60) * 60, Math.floor(nowSec / 60) * 60);
    const m1Store = clientCandlesStore["1m"][symbol] || [];
    let m1Last = m1Store[m1Store.length - 1];

    let targetM1Candle: Candle;

    if (!m1Last || m1Bucket > m1Last.time) {
      const prevClose = m1Last ? m1Last.close : liveCandle.open;
      const newCandle: Candle = {
        time: m1Bucket,
        open: prevClose,
        high: Math.max(prevClose, price),
        low: Math.min(prevClose, price),
        close: price
      };
      m1Store.push(newCandle);
      if (m1Store.length > 5000) m1Store.shift();
      clientCandlesStore["1m"][symbol] = m1Store;
      targetM1Candle = newCandle;
    } else {
      m1Last.high = Math.max(m1Last.high, price);
      m1Last.low = Math.min(m1Last.low, price);
      m1Last.close = price;
      targetM1Candle = m1Last;
    }

    if (isActiveSym) {
      state.updateCandleForTimeframe("1m", targetM1Candle, symbol);
      if (state.activeTimeframe === "1m") {
        state.updateCandle(targetM1Candle);
      }
    }

    // Notify 1m candle update listeners
    const m1Listeners = this.candleUpdateListeners.get(`${symbol.toLowerCase()}_1m`);
    if (m1Listeners) {
      m1Listeners.forEach(cb => {
        try { cb(targetM1Candle); } catch (err) { console.warn('Candle update error:', err); }
      });
    }

    // Update higher timeframe candles incrementally
    Object.entries(TIMEFRAMES).forEach(([tf, seconds]) => {
      if (tf === "1m" || tf === "1w" || tf === "1M") return;
      const tfBucket = Math.floor(nowSec / seconds) * seconds;
      const tfStore = clientCandlesStore[tf]?.[symbol] || [];
      let tfLast = tfStore[tfStore.length - 1];
      let targetTfCandle: Candle;

      if (!tfLast || tfBucket > tfLast.time) {
        const prevClose = tfLast ? tfLast.close : price;
        const newCandle: Candle = {
          time: tfBucket,
          open: prevClose,
          high: Math.max(prevClose, price),
          low: Math.min(prevClose, price),
          close: price
        };
        tfStore.push(newCandle);
        if (tfStore.length > 5000) tfStore.shift();
        clientCandlesStore[tf][symbol] = tfStore;
        targetTfCandle = newCandle;
      } else {
        tfLast.high = Math.max(tfLast.high, price);
        tfLast.low = Math.min(tfLast.low, price);
        tfLast.close = price;
        targetTfCandle = tfLast;
      }

      if (isActiveSym) {
        state.updateCandleForTimeframe(tf, targetTfCandle, symbol);
        if (state.activeTimeframe === tf) {
          state.updateCandle(targetTfCandle);
        }
      }

      const tfListeners = this.candleUpdateListeners.get(`${symbol.toLowerCase()}_${tf}`);
      if (tfListeners) {
        tfListeners.forEach(cb => {
          try { cb(targetTfCandle); } catch (err) { console.warn('Candle update error:', err); }
        });
      }
    });
  }

  private applyTickToCandles(symbol: string, price: number, epoch: number) {
    const state = useMarketStore.getState();
    const isActiveSym = state.activeSymbol.toLowerCase() === symbol.toLowerCase();
    const minute = Math.floor(epoch / 60) * 60;
    const m1Store = clientCandlesStore["1m"]?.[symbol] || [];
    let lastCandle = m1Store[m1Store.length - 1];
    let targetCandle: Candle;

    if (!lastCandle || minute > lastCandle.time) {
      const prevClose = lastCandle ? lastCandle.close : price;
      const newCandle: Candle = {
        time: minute,
        open: prevClose,
        high: Math.max(prevClose, price),
        low: Math.min(prevClose, price),
        close: price
      };
      m1Store.push(newCandle);
      if (m1Store.length > 5000) m1Store.shift();
      clientCandlesStore["1m"][symbol] = m1Store;
      targetCandle = newCandle;
    } else {
      lastCandle.high = Math.max(lastCandle.high, price);
      lastCandle.low = Math.min(lastCandle.low, price);
      lastCandle.close = price;
      targetCandle = lastCandle;
    }

    if (isActiveSym) {
      state.updateCandleForTimeframe("1m", targetCandle, symbol);
      if (state.activeTimeframe === "1m") {
        state.updateCandle(targetCandle);
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const derivClient = new DerivDirectClient();
