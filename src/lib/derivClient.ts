import { Candle, MarketSymbol, Tick, Timeframe } from '../types';
import { useMarketStore, INITIAL_CURRENCY_PAIRS } from '../store/useMarketStore';

const PUBLIC_DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";
const FALLBACK_DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";
const ALT_DERIV_WS_URL = "wss://frontend.binaryws.com/websockets/v3?app_id=1089";

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
  "2h": 7200,
  "4h": 14400,
  "5h": 3600, // Aggregate 1h to 5h
  "8h": 28800,
  "1d": 86400,
  "1w": 86400, // Aggregate 1d to 1w
  "1M": 86400, // Aggregate 1d to 1M
};

// Client-side in-memory candle store for caching across timeframes and symbols
const clientCandlesStore: Record<string, Record<string, Candle[]>> = {};
const lastFetchedTime: Record<string, number> = {};
const lastPrices: Record<string, number> = {};
const requestedSymbols = new Set<string>(['1HZ100V', 'R_100', '1HZ10V', 'R_50', '1HZ25V', '1HZ75V', 'frxEURUSD', 'cryBTCUSD', 'frxXAUUSD']);

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
  else if (symUpper.includes('EURUSD')) { basePrice = 1.0850; volatility = 0.0004; }
  else if (symUpper.includes('GBPUSD')) { basePrice = 1.2720; volatility = 0.0005; }
  else if (symUpper.includes('USDJPY')) { basePrice = 155.40; volatility = 0.0008; }
  else if (symUpper.includes('1HZ100V') || symUpper.includes('R_100')) { basePrice = 2850.0; volatility = 0.004; }
  else if (symUpper.includes('1HZ10V') || symUpper.includes('R_10')) { basePrice = 1450.0; volatility = 0.0015; }
  else if (symUpper.includes('1HZ50V') || symUpper.includes('R_50')) { basePrice = 420.0; volatility = 0.0025; }

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

      // Start live fast poll (every 1000ms) to ensure continuous live candle updates across symbols
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = setInterval(() => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const curSym = useMarketStore.getState().activeSymbol;
        if (curSym) {
          this.send({
            ticks_history: curSym,
            adjust_start_time: 1,
            count: 3,
            end: "latest",
            style: "candles",
            granularity: 60,
            req_id: ++this.requestId,
            passthrough: {
              symbol: curSym,
              isLivePoll: true
            }
          });
        }
      }, 1200);
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error(`[DerivClient] Error parsing message:`, e);
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
        if (tf === "5h" && parsedCandles.length > 0) {
          finalCandles = aggregateCandles(parsedCandles, 18000);
        } else if (tf === "1w" && parsedCandles.length > 0) {
          finalCandles = aggregateDailyToWeekly(parsedCandles);
        } else if (tf === "1M" && parsedCandles.length > 0) {
          finalCandles = aggregateDailyToMonthly(parsedCandles);
        }

        clientCandlesStore[tf][symbol] = finalCandles;
        
        const state = useMarketStore.getState();
        state.setCandlesByTimeframe(tf, finalCandles);
        
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === tf) {
          state.setCandles(finalCandles);
        }

        // Set last tick from the most recent candle close
        const last = finalCandles[finalCandles.length - 1];
        if (last) {
          lastPrices[symbol] = last.close;
          if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
            state.addTick({
              symbol: symbol,
              price: last.close,
              time: last.time * 1000
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
        const state = useMarketStore.getState();
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
          state.addTick({
            symbol: symbol,
            price: price,
            time: epoch * 1000
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

    if (state.activeSymbol.toLowerCase() === symbol.toLowerCase()) {
      state.addTick({
        symbol: symbol,
        price: price,
        time: liveCandle.time * 1000
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const m1Bucket = Math.max(Math.floor(liveCandle.time / 60) * 60, Math.floor(nowSec / 60) * 60);
    const m1Store = clientCandlesStore["1m"][symbol] || [];
    let m1Last = m1Store[m1Store.length - 1];

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
      state.updateCandleForTimeframe("1m", newCandle);
      if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === "1m") {
        state.updateCandle(newCandle);
      }
    } else {
      m1Last.high = Math.max(m1Last.high, price);
      m1Last.low = Math.min(m1Last.low, price);
      m1Last.close = price;
      state.updateCandleForTimeframe("1m", m1Last);
      if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === "1m") {
        state.updateCandle(m1Last);
      }
    }

    // Update higher timeframe candles incrementally
    Object.entries(TIMEFRAMES).forEach(([tf, seconds]) => {
      if (tf === "1m" || tf === "1w" || tf === "1M") return;
      const tfBucket = Math.floor(nowSec / seconds) * seconds;
      const tfStore = clientCandlesStore[tf]?.[symbol] || [];
      let tfLast = tfStore[tfStore.length - 1];

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
        state.updateCandleForTimeframe(tf, newCandle);
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === tf) {
          state.updateCandle(newCandle);
        }
      } else {
        tfLast.high = Math.max(tfLast.high, price);
        tfLast.low = Math.min(tfLast.low, price);
        tfLast.close = price;
        state.updateCandleForTimeframe(tf, tfLast);
        if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === tf) {
          state.updateCandle(tfLast);
        }
      }
    });
  }

  private applyTickToCandles(symbol: string, price: number, epoch: number) {
    const state = useMarketStore.getState();
    const minute = Math.floor(epoch / 60) * 60;
    const m1Store = clientCandlesStore["1m"]?.[symbol] || [];
    let lastCandle = m1Store[m1Store.length - 1];

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
      state.updateCandleForTimeframe("1m", newCandle);
      if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === "1m") {
        state.updateCandle(newCandle);
      }
    } else {
      lastCandle.high = Math.max(lastCandle.high, price);
      lastCandle.low = Math.min(lastCandle.low, price);
      lastCandle.close = price;
      state.updateCandleForTimeframe("1m", lastCandle);
      if (state.activeSymbol.toLowerCase() === symbol.toLowerCase() && state.activeTimeframe === "1m") {
        state.updateCandle(lastCandle);
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
