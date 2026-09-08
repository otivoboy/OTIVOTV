import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public?app_id=1089";

export interface MarketSymbol {
  id: string;
  symbol: string;
  display: string;
  market: string;
  marketDisplay?: string;
  submarket?: string;
  submarketDisplay?: string;
  pip?: number;
  isOpen?: boolean;
}

const DEFAULT_SYMBOLS: MarketSymbol[] = [
  // Derived / Synthetic Volatility Indices
  { id: '1HZ100V', symbol: '1HZ100V', display: 'Volatility 100 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.01 },
  { id: 'R_100', symbol: 'R_100', display: 'Volatility 100 Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.01 },
  { id: '1HZ50V', symbol: '1HZ50V', display: 'Volatility 50 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.0001 },
  { id: 'R_50', symbol: 'R_50', display: 'Volatility 50 Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.0001 },
  { id: '1HZ75V', symbol: '1HZ75V', display: 'Volatility 75 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.01 },
  { id: '1HZ25V', symbol: '1HZ25V', display: 'Volatility 25 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.001 },
  { id: '1HZ10V', symbol: '1HZ10V', display: 'Volatility 10 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived', pip: 0.001 },

  // Boom Indices
  { id: 'BOOM50', symbol: 'BOOM50', display: 'Boom 50 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM100', symbol: 'BOOM100', display: 'Boom 100 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM150N', symbol: 'BOOM150N', display: 'Boom 150 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM200', symbol: 'BOOM200', display: 'Boom 200 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM300N', symbol: 'BOOM300N', display: 'Boom 300 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM500', symbol: 'BOOM500', display: 'Boom 500 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM600', symbol: 'BOOM600', display: 'Boom 600 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM900', symbol: 'BOOM900', display: 'Boom 900 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'BOOM1000', symbol: 'BOOM1000', display: 'Boom 1000 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },

  // Crash Indices
  { id: 'CRASH50', symbol: 'CRASH50', display: 'Crash 50 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH100', symbol: 'CRASH100', display: 'Crash 100 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH150N', symbol: 'CRASH150N', display: 'Crash 150 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH200', symbol: 'CRASH200', display: 'Crash 200 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH300N', symbol: 'CRASH300N', display: 'Crash 300 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH500', symbol: 'CRASH500', display: 'Crash 500 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH600', symbol: 'CRASH600', display: 'Crash 600 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH900', symbol: 'CRASH900', display: 'Crash 900 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },
  { id: 'CRASH1000', symbol: 'CRASH1000', display: 'Crash 1000 Index', market: 'synthetic_index', marketDisplay: 'Derived', submarket: 'crash_boom', submarketDisplay: 'Crash/Boom', pip: 0.01 },

  // Forex Major & Minor Pairs
  { id: 'frxEURUSD', symbol: 'frxEURUSD', display: 'EUR/USD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxGBPUSD', symbol: 'frxGBPUSD', display: 'GBP/USD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxUSDJPY', symbol: 'frxUSDJPY', display: 'USD/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'frxUSDCHF', symbol: 'frxUSDCHF', display: 'USD/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxAUDUSD', symbol: 'frxAUDUSD', display: 'AUD/USD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxUSDCAD', symbol: 'frxUSDCAD', display: 'USD/CAD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxNZDUSD', symbol: 'frxNZDUSD', display: 'NZD/USD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxEURGBP', symbol: 'frxEURGBP', display: 'EUR/GBP', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'frxEURJPY', symbol: 'frxEURJPY', display: 'EUR/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'frxGBPJPY', symbol: 'frxGBPJPY', display: 'GBP/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },

  // Added Forex Cross Pairs
  { id: 'FRXEURAUD', symbol: 'FRXEURAUD', display: 'EUR/AUD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXEURCAD', symbol: 'FRXEURCAD', display: 'EUR/CAD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXEURNZD', symbol: 'FRXEURNZD', display: 'EUR/NZD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXEURCHF', symbol: 'FRXEURCHF', display: 'EUR/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXGBPAUD', symbol: 'FRXGBPAUD', display: 'GBP/AUD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXGBPCAD', symbol: 'FRXGBPCAD', display: 'GBP/CAD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXGBPNZD', symbol: 'FRXGBPNZD', display: 'GBP/NZD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXGBPCHF', symbol: 'FRXGBPCHF', display: 'GBP/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXAUDJPY', symbol: 'FRXAUDJPY', display: 'AUD/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'FRXCADJPY', symbol: 'FRXCADJPY', display: 'CAD/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'FRXNZDJPY', symbol: 'FRXNZDJPY', display: 'NZD/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'FRXCHFJPY', symbol: 'FRXCHFJPY', display: 'CHF/JPY', market: 'forex', marketDisplay: 'Forex', pip: 0.001 },
  { id: 'FRXAUDCAD', symbol: 'FRXAUDCAD', display: 'AUD/CAD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXAUDNZD', symbol: 'FRXAUDNZD', display: 'AUD/NZD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXAUDCHF', symbol: 'FRXAUDCHF', display: 'AUD/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXNZDCAD', symbol: 'FRXNZDCAD', display: 'NZD/CAD', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXNZDCHF', symbol: 'FRXNZDCHF', display: 'NZD/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },
  { id: 'FRXCADCHF', symbol: 'FRXCADCHF', display: 'CAD/CHF', market: 'forex', marketDisplay: 'Forex', pip: 0.00001 },

  // Commodities & Cryptocurrencies
  { id: 'frxXAUUSD', symbol: 'frxXAUUSD', display: 'Gold (XAU/USD)', market: 'commodities', marketDisplay: 'Commodities', pip: 0.01 },
  { id: 'frxXAGUSD', symbol: 'frxXAGUSD', display: 'Silver (XAG/USD)', market: 'commodities', marketDisplay: 'Commodities', pip: 0.001 },
  { id: 'cryBTCUSD', symbol: 'cryBTCUSD', display: 'BTC/USD', market: 'cryptocurrency', marketDisplay: 'Cryptocurrencies', pip: 0.1 },
  { id: 'cryETHUSD', symbol: 'cryETHUSD', display: 'ETH/USD', market: 'cryptocurrency', marketDisplay: 'Cryptocurrencies', pip: 0.01 },
];

let activeSymbolsList: MarketSymbol[] = [...DEFAULT_SYMBOLS];
const subscribedSymbols = new Set<string>();
const requestedSymbols = new Set<string>(['1HZ100V', 'R_100', '1HZ10V', 'R_50', '1HZ25V', '1HZ75V', 'frxEURUSD', 'cryBTCUSD', 'frxXAUUSD']);
let validDerivSymbols = new Set<string>(DEFAULT_SYMBOLS.map(s => s.symbol));
const lastTickTime: Record<string, number> = {};
const lastPrices: Record<string, number> = {};

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
  "5h": 3600, // Deriv 1h, aggregated to 5h
  "8h": 28800,
  "1d": 86400,
  "1w": 86400, // Deriv uses 86400 for 1d, we aggregate to 1w
  "1M": 86400, // Deriv uses 86400 for 1d, we aggregate to 1M
};

const GRANULARITY_TO_TIMEFRAME: Record<number, string> = {
  60: "1m",
  180: "3m",
  300: "5m",
  900: "15m",
  1800: "30m",
  3600: "1h",
  7200: "2h",
  14400: "4h",
  28800: "8h",
  86400: "1d",
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// In-memory store for candles
const candlesStore: Record<string, Record<string, Candle[]>> = {};
const lastFetchedHistoryTime: Record<string, number> = {}; // key: `${symbol}_${timeframe}` -> timestamp

// Initialize store for all timeframes
Object.keys(TIMEFRAMES).forEach(tf => {
  candlesStore[tf] = {};
  DEFAULT_SYMBOLS.forEach(pair => {
    candlesStore[tf][pair.id] = [];
  });
});

function ensureStore(symbol: string) {
  Object.keys(TIMEFRAMES).forEach(tf => {
    if (!candlesStore[tf]) candlesStore[tf] = {};
    if (!candlesStore[tf][symbol]) candlesStore[tf][symbol] = [];
  });
}

function aggregateDailyToWeekly(dailyCandles: Candle[]): Candle[] {
  if (!dailyCandles || dailyCandles.length === 0) return [];
  const weekly: Candle[] = [];
  let currentWeek: Candle | null = null;
  
  dailyCandles.forEach(c => {
    const date = new Date(c.time * 1000);
    const day = date.getUTCDay();
    const diff = (day + 6) % 7; // days since Monday
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

function aggregateDailyToMonthly(dailyCandles: Candle[]): Candle[] {
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

function aggregateCandles(sourceCandles: Candle[], targetSeconds: number): Candle[] {
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

function handleLiveCandleUpdate(symbol: string, liveCandle: Candle) {
  ensureStore(symbol);
  const price = liveCandle.close;

  lastPrices[symbol] = price;
  lastTickTime[symbol] = Date.now();

  const nowSec = Math.floor(Date.now() / 1000);
  const m1Bucket = Math.max(Math.floor(liveCandle.time / 60) * 60, Math.floor(nowSec / 60) * 60);
  const m1Store = candlesStore["1m"][symbol];
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
  } else {
    m1Last.high = Math.max(m1Last.high, price);
    m1Last.low = Math.min(m1Last.low, price);
    m1Last.close = price;
  }

  // 2. Update other timeframe stores
  Object.entries(TIMEFRAMES).forEach(([tf, seconds]) => {
    if (tf === "1m" || tf === "1w") return;
    const tfBucket = Math.floor(nowSec / seconds) * seconds;
    const tfStore = candlesStore[tf][symbol];
    if (!tfStore) return;
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
    } else {
      tfLast.high = Math.max(tfLast.high, price);
      tfLast.low = Math.min(tfLast.low, price);
      tfLast.close = price;
    }
  });

  return price;
}

function handleTick(symbol: string, price: number, epoch: number) {
  ensureStore(symbol);
  lastPrices[symbol] = price;
  lastTickTime[symbol] = Date.now();

  const minute = Math.floor(epoch / 60) * 60;
  const pairStore = candlesStore["1m"][symbol];
  let lastCandle = pairStore[pairStore.length - 1];

  if (!lastCandle || minute > lastCandle.time) {
    const prevClose = lastCandle ? lastCandle.close : price;
    const newCandle = {
      time: minute,
      open: prevClose,
      high: Math.max(prevClose, price),
      low: Math.min(prevClose, price),
      close: price
    };
    pairStore.push(newCandle);
    if (pairStore.length > 5000) pairStore.shift();
  } else {
    lastCandle.high = Math.max(lastCandle.high, price);
    lastCandle.low = Math.min(lastCandle.low, price);
    lastCandle.close = price;
  }

  // Update higher timeframes incrementally
  Object.entries(TIMEFRAMES).forEach(([tf, seconds]) => {
    if (tf === "1m") return;
    
    const tfTime = Math.floor(epoch / seconds) * seconds;
    const tfStore = candlesStore[tf][symbol];
    if (!tfStore) return;
    let tfLastCandle = tfStore[tfStore.length - 1];

    if (!tfLastCandle || tfTime > tfLastCandle.time) {
      const prevClose = tfLastCandle ? tfLastCandle.close : price;
      const newTfCandle = {
        time: tfTime,
        open: prevClose,
        high: Math.max(prevClose, price),
        low: Math.min(prevClose, price),
        close: price
      };
      tfStore.push(newTfCandle);
      if (tfStore.length > 5000) tfStore.shift();
    } else {
      tfLastCandle.high = Math.max(tfLastCandle.high, price);
      tfLastCandle.low = Math.min(tfLastCandle.low, price);
      tfLastCandle.close = price;
    }
  });
}

process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', promise, 'reason:', reason);
});

async function startServer() {
  console.log('🚀 Starting OTIVO backend...');
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/logo.png", (req, res) => {
    res.setHeader("Content-Type", "image/png");
    res.sendFile(path.resolve(process.cwd(), "public", "logo.png"));
  });

  app.get("/logo2.png", (req, res) => {
    res.setHeader("Content-Type", "image/png");
    res.sendFile(path.resolve(process.cwd(), "public", "logo2.png"));
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      connections: io.engine.clientsCount,
      deriv_status: derivWs?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      symbols_count: activeSymbolsList.length,
      subscribed_count: subscribedSymbols.size
    });
  });

  app.get("/api/symbols", (req, res) => {
    res.json({
      status: "ok",
      symbols: activeSymbolsList
    });
  });

  app.get("/api/history", (req, res) => {
    const symbol = (req.query.symbol as string) || "1HZ100V";
    const timeframe = (req.query.timeframe as string) || "1m";
    
    const targetSymbol = validDerivSymbols.has(symbol)
      ? symbol
      : activeSymbolsList.find(s => s.id.toLowerCase() === symbol.toLowerCase() || s.symbol.toLowerCase() === symbol.toLowerCase())?.symbol || symbol;

    ensureStore(targetSymbol);
    fetchHistoryFromDeriv(targetSymbol, timeframe);

    // If higher timeframe is requested but empty, aggregate on the fly from available lower timeframes
    if ((!candlesStore[timeframe]?.[targetSymbol] || candlesStore[timeframe][targetSymbol].length === 0)) {
      if (timeframe === "5h" && candlesStore["1h"]?.[targetSymbol]?.length) {
        candlesStore["5h"][targetSymbol] = aggregateCandles(candlesStore["1h"][targetSymbol], 18000);
      } else if (timeframe === "1w" && candlesStore["1d"]?.[targetSymbol]?.length) {
        candlesStore["1w"][targetSymbol] = aggregateDailyToWeekly(candlesStore["1d"][targetSymbol]);
      } else if (timeframe === "1M" && candlesStore["1d"]?.[targetSymbol]?.length) {
        candlesStore["1M"][targetSymbol] = aggregateDailyToMonthly(candlesStore["1d"][targetSymbol]);
      } else if (timeframe !== "1m" && candlesStore["1m"]?.[targetSymbol]?.length && TIMEFRAMES[timeframe]) {
        candlesStore[timeframe][targetSymbol] = aggregateCandles(candlesStore["1m"][targetSymbol], TIMEFRAMES[timeframe]);
      }
    }

    const candles = candlesStore[timeframe] && candlesStore[timeframe][targetSymbol] ? candlesStore[timeframe][targetSymbol] : [];
    res.json({
      status: "ok",
      symbol: targetSymbol,
      timeframe,
      count: candles.length,
      candles
    });
  });

  app.get("/api/multi-history", (req, res) => {
    const symbol = (req.query.symbol as string) || "1HZ100V";
    const targetSymbol = validDerivSymbols.has(symbol)
      ? symbol
      : activeSymbolsList.find(s => s.id.toLowerCase() === symbol.toLowerCase() || s.symbol.toLowerCase() === symbol.toLowerCase())?.symbol || symbol;

    ensureStore(targetSymbol);
    prefetchAllTimeframesForSymbol(targetSymbol);

    // Aggregations on the fly if needed
    const h1 = candlesStore["1h"]?.[targetSymbol] || [];
    const d1 = candlesStore["1d"]?.[targetSymbol] || [];
    const m1 = candlesStore["1m"]?.[targetSymbol] || [];

    if (h1.length > 0 && (!candlesStore["5h"]?.[targetSymbol] || candlesStore["5h"][targetSymbol].length === 0)) {
      candlesStore["5h"][targetSymbol] = aggregateCandles(h1, 18000);
    }
    if (d1.length > 0) {
      if (!candlesStore["1w"]?.[targetSymbol] || candlesStore["1w"][targetSymbol].length === 0) {
        candlesStore["1w"][targetSymbol] = aggregateDailyToWeekly(d1);
      }
      if (!candlesStore["1M"]?.[targetSymbol] || candlesStore["1M"][targetSymbol].length === 0) {
        candlesStore["1M"][targetSymbol] = aggregateDailyToMonthly(d1);
      }
    }
    if (m1.length > 0) {
      ["5m", "15m", "30m", "1h"].forEach(tf => {
        if (!candlesStore[tf]?.[targetSymbol] || candlesStore[tf][targetSymbol].length === 0) {
          candlesStore[tf][targetSymbol] = aggregateCandles(m1, TIMEFRAMES[tf]);
        }
      });
    }

    const timeframesList = ["1m", "5m", "15m", "30m", "1h", "5h", "1d", "1w", "1M"];
    const candlesByTimeframe: Record<string, Candle[]> = {};
    timeframesList.forEach(tf => {
      const arr = candlesStore[tf]?.[targetSymbol] || [];
      // Return the most recent 250 candles per timeframe for fast, lightweight technical analysis (<150KB payload)
      candlesByTimeframe[tf] = arr.length > 250 ? arr.slice(-250) : arr;
    });

    res.json({
      status: "ok",
      symbol: targetSymbol,
      candlesByTimeframe
    });
  });

  // Deriv WebSocket Connection
  let derivWs: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let pingTimer: NodeJS.Timeout | null = null;
  let watchdogInterval: NodeJS.Timeout | null = null;
  let reconnectDelay = 2000;
  let requestId = 0;
  let lastWsMessageTime = Date.now();

  function subscribeToTicks() {
    if (!derivWs || derivWs.readyState !== WebSocket.OPEN) return;
    for (const symbol of requestedSymbols) {
      derivWs.send(JSON.stringify({
        ticks: symbol,
        subscribe: 1
      }));
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    console.warn(`⚠️ Deriv WS Closed. Initializing reconnect in ${reconnectDelay}ms...`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectDeriv();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  function fetchHistoryFromDeriv(symbol: string, timeframe: string, force = false) {
    if (!symbol || !derivWs || derivWs.readyState !== WebSocket.OPEN) return;

    const targetSymbol = validDerivSymbols.has(symbol) 
      ? symbol 
      : activeSymbolsList.find(s => s.id.toLowerCase() === symbol.toLowerCase() || s.symbol.toLowerCase() === symbol.toLowerCase())?.symbol;

    if (!targetSymbol) return;
    ensureStore(targetSymbol);

    const historyKey = `${targetSymbol}_${timeframe}`;
    const now = Date.now();
    const lastFetch = lastFetchedHistoryTime[historyKey] || 0;
    
    // Only skip if requested very recently and we already have plenty of candles
    if (!force && (now - lastFetch < 10000) && (candlesStore[timeframe]?.[targetSymbol]?.length || 0) > 200) {
      return;
    }

    const granularity = TIMEFRAME_TO_GRANULARITY[timeframe] || 60;
    console.log(`📈 Requesting ${timeframe} (granularity ${granularity}s) candles for: ${targetSymbol}`);

    lastFetchedHistoryTime[historyKey] = now;

    derivWs.send(JSON.stringify({
      ticks_history: targetSymbol,
      adjust_start_time: 1,
      count: 1000,
      end: "latest",
      style: "candles",
      granularity: granularity,
      req_id: ++requestId,
      passthrough: {
        symbol: targetSymbol,
        timeframe: timeframe,
        granularity: granularity
      }
    }));
  }

  function prefetchAllTimeframesForSymbol(symbol: string) {
    const timeframesToFetch = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
    timeframesToFetch.forEach((tf, index) => {
      setTimeout(() => {
        fetchHistoryFromDeriv(symbol, tf);
      }, index * 150);
    });
  }

  function subscribeToSymbol(symbol: string) {
    if (!symbol) return;
    
    // Normalize or validate against available Deriv symbols
    const targetSymbol = validDerivSymbols.has(symbol) 
      ? symbol 
      : activeSymbolsList.find(s => s.id.toLowerCase() === symbol.toLowerCase() || s.symbol.toLowerCase() === symbol.toLowerCase())?.symbol;

    if (!targetSymbol) {
      console.warn(`⚠️ Symbol ${symbol} is not recognized by Deriv. Skipping subscription.`);
      return;
    }

    requestedSymbols.add(targetSymbol);
    ensureStore(targetSymbol);

    if (derivWs?.readyState === WebSocket.OPEN) {
      derivWs.send(JSON.stringify({
        ticks: targetSymbol,
        subscribe: 1
      }));
    }

    // Fetch deep candle history for primary timeframes
    prefetchAllTimeframesForSymbol(targetSymbol);
  }

  function connectDeriv() {
    if (derivWs) {
      derivWs.removeAllListeners();
      derivWs.terminate();
    }

    console.log(`📡 Connecting to Deriv Public WS: ${DERIV_WS_URL}`);
    try {
      derivWs = new WebSocket(DERIV_WS_URL);
    } catch (err: any) {
      console.error(`❌ WS Instantiation failed for ${DERIV_WS_URL}:`, err.message);
      scheduleReconnect();
      return;
    }

    derivWs.on("open", () => {
      console.log(`✅ Connected to Deriv WebSocket (${DERIV_WS_URL})`);
      subscribedSymbols.clear();
      lastWsMessageTime = Date.now();
      reconnectDelay = 2000;

      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(() => {
        if (derivWs?.readyState === WebSocket.OPEN) {
          derivWs.send(JSON.stringify({ ping: 1 }));
        }
      }, 15000);

      if (watchdogInterval) clearInterval(watchdogInterval);
      watchdogInterval = setInterval(() => {
        if (Date.now() - lastWsMessageTime > 35000) {
          console.warn("⚠️ Deriv WS watchdog triggered (silent for 35s). Terminating zombie connection...");
          derivWs?.terminate();
        }
      }, 5000);

      // 1. Fetch all active symbols
      console.log("🌐 Requesting active symbols from Deriv...");
      derivWs.send(JSON.stringify({
        active_symbols: "brief",
        product_type: "basic",
        req_id: ++requestId
      }));

      // 2. Restore subscriptions
      subscribeToTicks();
    });

    derivWs.on("message", (data: any) => {
      try {
        lastWsMessageTime = Date.now();
        const msg = JSON.parse(data.toString());

        // Handle Active Symbols response
        if (msg.msg_type === "active_symbols" && Array.isArray(msg.active_symbols)) {
          console.log(`✨ Received ${msg.active_symbols.length} active symbols from Deriv`);
          
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
            activeSymbolsList = mappedSymbols;
            validDerivSymbols = new Set(mappedSymbols.map(s => s.symbol));
            io.emit("symbols", activeSymbolsList);
          }
          return;
        }

        // Handle live ticks
        if (msg.msg_type === "tick" && msg.tick) {
          const symbol = msg.tick.symbol;
          const price = Number(msg.tick.quote);
          const epoch = Number(msg.tick.epoch);

          handleTick(symbol, price, epoch);

          io.emit("tick", {
            symbol,
            price,
            time: epoch * 1000
          });

          const candleData = {
            symbol,
            candlesByTimeframe: Object.keys(TIMEFRAMES).reduce((acc, tf) => {
               const store = candlesStore[tf]?.[symbol];
               const last = store && store[store.length - 1];
               if (last) acc[tf] = last;
               return acc;
            }, {} as Record<string, Candle>)
          };

          io.emit("candle_update", candleData);
          io.to(symbol).emit("candle_update", candleData);
          return;
        }
        
        // Handle Historical Candles Response
        if (msg.msg_type === "candles" && Array.isArray(msg.candles)) {
          const symbol = msg.passthrough?.symbol || msg.echo_req?.ticks_history;
          if (!symbol) return;

          const reqTf = msg.passthrough?.timeframe || GRANULARITY_TO_TIMEFRAME[msg.echo_req?.granularity] || "1m";
          
          console.log(`📈 Received history for ${symbol} [${reqTf}]: ${msg.candles.length} candles`);
          ensureStore(symbol);

          const parsedCandles: Candle[] = msg.candles.map((c: any) => ({
            time: Number(c.epoch),
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close)
          })).sort((a: Candle, b: Candle) => a.time - b.time);

          if (parsedCandles.length > 0) {
            const lastCandle = parsedCandles[parsedCandles.length - 1];
            lastPrices[symbol] = lastCandle.close;
            lastTickTime[symbol] = Date.now();
          }

          // Store candles for the specific requested timeframe
          candlesStore[reqTf][symbol] = parsedCandles;

          // If this is 1d data, also aggregate and store 1w and 1M
          if (reqTf === "1d") {
            const weeklyCandles = aggregateDailyToWeekly(parsedCandles);
            candlesStore["1w"][symbol] = weeklyCandles;
            const monthlyCandles = aggregateDailyToMonthly(parsedCandles);
            candlesStore["1M"][symbol] = monthlyCandles;

            io.to(symbol).emit("history", {
              symbol,
              timeframe: "1w",
              candles: weeklyCandles
            });
            io.emit("history", {
              symbol,
              timeframe: "1w",
              candles: weeklyCandles
            });
            io.to(symbol).emit("history", {
              symbol,
              timeframe: "1M",
              candles: monthlyCandles
            });
            io.emit("history", {
              symbol,
              timeframe: "1M",
              candles: monthlyCandles
            });
          }

          // If this is 1h data, aggregate and store 5h
          if (reqTf === "1h") {
            const h5Candles = aggregateCandles(parsedCandles, 18000);
            candlesStore["5h"][symbol] = h5Candles;
            io.to(symbol).emit("history", {
              symbol,
              timeframe: "5h",
              candles: h5Candles
            });
          }

          // If this is 1m data, populate any other empty timeframe stores as immediate baseline
          if (reqTf === "1m") {
            Object.entries(TIMEFRAMES).forEach(([tf, seconds]) => {
              if (tf === "1m" || tf === "1w" || tf === "1M") return;
              if (!candlesStore[tf][symbol] || candlesStore[tf][symbol].length === 0) {
                candlesStore[tf][symbol] = aggregateCandles(parsedCandles, seconds);
              }
            });
          }

          // Send history to all clients viewing this symbol and timeframe
          io.to(symbol).emit("history", {
            symbol,
            timeframe: reqTf,
            candles: parsedCandles
          });
          io.emit("history", {
            symbol,
            timeframe: reqTf,
            candles: parsedCandles
          });
          return;
        }
        
        if (msg.msg_type === "ping") {
          // ping response, ignore
        } else if (msg.error) {
          if (process.env.DEBUG_DERIV) {
            console.log(`[Deriv Info] (${msg.error.code}):`, msg.error.message);
          }
        }
      } catch (err) {
        console.error("❌ Failed to parse Deriv message:", err);
      }
    });

    derivWs.on("error", (err: any) => {
      console.error("❌ Deriv WS Connection Error:", err.message);
    });

    derivWs.on("close", () => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      if (watchdogInterval) {
        clearInterval(watchdogInterval);
        watchdogInterval = null;
      }
      scheduleReconnect();
    });
  }

  connectDeriv();

  // Handle Socket.io connections
  io.on("connection", (socket) => {
    console.log(`👤 Client Connected: ${socket.id}`);
    
    // Send active symbols list on connect
    if (activeSymbolsList.length > 0) {
      socket.emit("symbols", activeSymbolsList);
    }

    socket.on("subscribe", (data: { symbol: string, timeframe: string }) => {
      const { symbol, timeframe } = data;
      if (!symbol || !timeframe) return;

      console.log(`📥 Client ${socket.id} subscribing: ${symbol} (${timeframe})`);
      
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room);
      });

      // Join symbol room
      socket.join(symbol);
      
      // Ensure backend is polling live data for this symbol
      subscribeToSymbol(symbol);

      // Fetch fresh deep history from Deriv for this specific timeframe
      fetchHistoryFromDeriv(symbol, timeframe, true);

      // Send immediate cached history if available
      if (candlesStore[timeframe] && candlesStore[timeframe][symbol] && candlesStore[timeframe][symbol].length > 0) {
        socket.emit("history", {
          symbol,
          timeframe,
          candles: candlesStore[timeframe][symbol]
        });
      }
    });

    socket.on("unsubscribe", (symbol: string) => {
      console.log(`📤 Client ${socket.id} unsubscribing: ${symbol}`);
      socket.leave(symbol);
    });

    socket.on("disconnect", () => {
      console.log(`👤 Client Disconnected: ${socket.id}`);
    });
  });

  // Vite Integration
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    console.log('🛠️  Running in DEVELOPMENT mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      logLevel: 'info'
    });
    app.use(vite.middlewares);
  } else {
    console.log('📦 Running in PRODUCTION mode');
    const distPath = path.resolve(process.cwd(), "dist");
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn('⚠️  DIST folder not found! Falling back to Vite middleware even in production mode.');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    }
  }

  httpServer.on('error', (err) => {
    console.error('🔥 HTTP SERVER ERROR:', err);
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ OTIVO Server listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('🔥 FAILED TO START SERVER:', err);
});
