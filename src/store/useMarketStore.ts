import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Candle, Tick, Timeframe, MarketSymbol, ChartType, PriceAlert, ChartSettings, SavedChartLayout, MultiChartLayoutType, ReplayState } from "../types";
import { soundManager } from "../lib/soundEffects";
import { saveToGoogleDrive, loadFromGoogleDrive } from "../lib/driveSync";

export interface Drawing {
  id: string;
  symbol: string;
  type: string;
  data: any;
  color?: string;
  lineWidth?: number;
  locked?: boolean;
  hidden?: boolean;
}

export interface IndicatorItem {
  id: string;
  name: string;
  code: string;
  params?: Record<string, any>;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  candleUpColor: '#26a69a',
  candleDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  showGridLines: true,
  gridLineColor: 'rgba(42, 46, 57, 0.5)',
  showWatermark: true,
  showCountdown: true,
  showHighLowLines: false,
  showVolume: true,
  timezone: 'UTC',
  precision: 5,
};

interface MarketState {
  activeSymbol: string;
  activeTimeframe: Timeframe;
  symbols: string[];
  availableSymbols: MarketSymbol[];
  candles: Candle[];
  candlesByTimeframe: Record<string, Candle[]>;
  candlesVersion: number;
  lastTick: Tick | null;
  prevTickPrice: number | null;
  marketTime: number; // Latest epoch in seconds
  isLoading: boolean;
  theme: 'light' | 'dark';
  activePage: 'chart' | 'technical-analysis';
  activeTool: string | null;
  selectedDrawingId: string | null;
  drawings: Drawing[];
  undoStack: Drawing[][];
  redoStack: Drawing[][];
  savedScripts: IndicatorItem[];
  activeIndicators: IndicatorItem[];
  hiddenIndicators: string[];
  taTimeframe: string;
  pivotMode: 'classic' | 'fibonacci' | 'camarilla';
  activePanel: string | null;
  chartType: ChartType;
  watchlist: string[];
  
  // Drawing Modes & Utility Tools
  isMagnetMode: boolean;
  magnetModeType: 'weak' | 'strong';
  isStayInDrawingMode: boolean;
  isLockAllDrawings: boolean;
  isHideAllDrawings: boolean;
  isHideAllIndicators: boolean;
  
  // Alerts
  alerts: PriceAlert[];
  latestTriggeredAlert: PriceAlert | null;

  // Replay
  replayState: ReplayState;
  fullCandlesBeforeReplay: Candle[];

  // Layout & Multi-chart
  multiLayout: MultiChartLayoutType;
  savedLayouts: SavedChartLayout[];
  currentLayoutName: string;
  chartSettings: ChartSettings;

  // Modals & Panels
  isAlertModalOpen: boolean;
  isQuickSearchOpen: boolean;
  isChartSettingsOpen: boolean;
  isScreenshotModalOpen: boolean;
  isSaveLayoutModalOpen: boolean;
  isLayoutSelectorOpen: boolean;
  isCandleHistoryModalOpen: boolean;
  
  // Cloud Sync Status
  isSyncingCloud: boolean;

  setActivePage: (page: 'chart' | 'technical-analysis') => void;
  setSymbol: (symbol: string) => void;
  setAvailableSymbols: (symbols: MarketSymbol[]) => void;
  setTimeframe: (tf: Timeframe) => void;
  addTick: (tick: Tick) => void;
  setCandles: (candles: Candle[]) => void;
  setCandlesByTimeframe: (timeframe: string, candles: Candle[], symbol?: string) => void;
  setMultiTimeframeCandles: (record: Record<string, Candle[]>) => void;
  updateCandle: (candle: Candle) => void;
  updateCandleForTimeframe: (timeframe: string, candle: Candle, symbol?: string) => void;
  setLoading: (loading: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveTool: (tool: string | null) => void;
  setSelectedDrawing: (id: string | null) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>, skipHistory?: boolean) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: (symbol: string) => void;
  undoDrawing: () => void;
  redoDrawing: () => void;
  toggleMagnetMode: () => void;
  setMagnetModeType: (type: 'weak' | 'strong') => void;
  toggleStayInDrawingMode: () => void;
  toggleLockAllDrawings: () => void;
  toggleHideAllDrawings: () => void;
  toggleHideAllIndicators: () => void;
  removeAllDrawings: (symbol?: string) => void;
  removeAllIndicators: () => void;
  removeAllObjects: (symbol?: string) => void;
  addScript: (script: IndicatorItem) => void;
  applyScript: (script: IndicatorItem) => void;
  addIndicator: (indicator: { id?: string; name: string; code: string; enabled?: boolean; params?: Record<string, any> }) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorItem>) => void;
  removeIndicator: (id: string) => void;
  toggleIndicatorVisibility: (id: string) => void;
  setTaTimeframe: (tf: string) => void;
  setPivotMode: (mode: 'classic' | 'fibonacci' | 'camarilla') => void;
  setActivePanel: (panel: string | null) => void;
  setChartType: (chartType: ChartType) => void;
  setWatchlist: (symbols: string[]) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;

  // Alerts Actions
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  dismissTriggeredAlert: () => void;
  checkAlerts: (currentPrice: number, symbol: string) => void;

  // Replay Actions
  startReplay: (cutoffIndex?: number) => void;
  pauseReplay: () => void;
  resumeReplay: () => void;
  stepReplay: () => void;
  stopReplay: () => void;
  setReplaySpeed: (speedMs: number) => void;
  setReplayCutoff: (cutoffIndex: number) => void;

  // Layout & Settings Actions
  setMultiLayout: (layout: MultiChartLayoutType) => void;
  saveCurrentLayout: (name: string) => void;
  loadLayout: (id: string) => void;
  deleteLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  updateChartSettings: (settings: Partial<ChartSettings>) => void;

  // Modal controls
  setAlertModalOpen: (open: boolean) => void;
  setQuickSearchOpen: (open: boolean) => void;
  setChartSettingsOpen: (open: boolean) => void;
  setScreenshotModalOpen: (open: boolean) => void;
  setSaveLayoutModalOpen: (open: boolean) => void;
  setLayoutSelectorOpen: (open: boolean) => void;
  setCandleHistoryModalOpen: (open: boolean) => void;

  // Cloud Actions
  syncToCloud: (accessToken: string) => Promise<void>;
  syncFromCloud: (accessToken: string) => Promise<void>;
}

export const INITIAL_CURRENCY_PAIRS: MarketSymbol[] = [
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

export const CURRENCY_PAIRS = INITIAL_CURRENCY_PAIRS;

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
  activeSymbol: INITIAL_CURRENCY_PAIRS[0].id,
      activeTimeframe: "1m",
      symbols: INITIAL_CURRENCY_PAIRS.map(p => p.id),
      availableSymbols: INITIAL_CURRENCY_PAIRS,
      candles: [],
      candlesByTimeframe: {},
      candlesVersion: 0,
      lastTick: null,
      prevTickPrice: null,
      marketTime: Math.floor(Date.now() / 1000),
      isLoading: true,
      theme: 'dark',
      activePage: 'chart',
      activeTool: null,
      selectedDrawingId: null,
      drawings: [],
      undoStack: [],
      redoStack: [],
      savedScripts: [],
      activeIndicators: [
        {
          id: 'default-vol',
          name: 'Volume',
          code: `//@version=5\nindicator("Volume", overlay=false)\nplot(volume, style=plot.style_columns, color=close >= open ? #26a69a : #ef5350)`
        }
      ],
      hiddenIndicators: [],
      taTimeframe: '5 Hours',
      pivotMode: 'classic',
      activePanel: null,
      chartType: 'candlestick',
      watchlist: ['1HZ100V', 'R_100', 'frxEURUSD', 'cryBTCUSD', 'AAPL', 'TSLA'],

      // Drawing Modes & Utility Tools
      isMagnetMode: false,
      magnetModeType: 'weak',
      isStayInDrawingMode: false,
      isLockAllDrawings: false,
      isHideAllDrawings: false,
      isHideAllIndicators: false,

      // Alerts
      alerts: [],
      latestTriggeredAlert: null,

      // Replay
      replayState: {
        isActive: false,
        isPaused: true,
        speed: 1000,
        currentIndex: 0,
        totalCandles: 0,
        selectedCutoffIndex: 0
      },
      fullCandlesBeforeReplay: [],

      // Layout & Settings
      multiLayout: '1',
      savedLayouts: [
        {
          id: 'default-layout',
          name: 'Default Setup',
          updatedAt: Date.now(),
          symbol: '1HZ100V',
          timeframe: '1m',
          chartType: 'candlestick',
          indicators: [
            {
              id: 'default-vol',
              name: 'Volume',
              code: `//@version=5\nindicator("Volume", overlay=false)\nplot(volume, style=plot.style_columns, color=close >= open ? #26a69a : #ef5350)`
            }
          ],
          drawings: [],
          settings: DEFAULT_CHART_SETTINGS
        }
      ],
      currentLayoutName: 'Default Setup',
      chartSettings: DEFAULT_CHART_SETTINGS,

      // Modals
      isAlertModalOpen: false,
      isQuickSearchOpen: false,
      isChartSettingsOpen: false,
      isScreenshotModalOpen: false,
      isSaveLayoutModalOpen: false,
      isLayoutSelectorOpen: false,
      isCandleHistoryModalOpen: false,
      isSyncingCloud: false,

      setActivePage: (page) => set({ activePage: page }),
      setSymbol: (symbol) => set({ 
        activeSymbol: symbol, 
        candles: [], 
        candlesByTimeframe: {},
        isLoading: true, 
        selectedDrawingId: null 
      }),
      setAvailableSymbols: (symbols) => set(() => {
        const existingIds = new Set(symbols.map(s => s.id.toLowerCase()));
        const merged = [...symbols];
        INITIAL_CURRENCY_PAIRS.forEach(p => {
          if (!existingIds.has(p.id.toLowerCase())) {
            merged.push(p);
          }
        });
        return {
          availableSymbols: merged,
          symbols: merged.map(s => s.id)
        };
      }),
      setTimeframe: (tf) => set((state) => {
        const existing = state.candlesByTimeframe[tf];
        return { 
          activeTimeframe: tf, 
          candles: existing && existing.length > 0 ? existing : [],
          isLoading: !existing || existing.length === 0 
        };
      }),
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
        return { theme: newTheme };
      }),
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
        set({ theme });
      },
      setActiveTool: (tool) => set({ activeTool: tool }),
      setSelectedDrawing: (id) => set({ selectedDrawingId: id }),
      addDrawing: (drawing) => set((state) => ({ 
        undoStack: [...state.undoStack, state.drawings],
        redoStack: [],
        drawings: [...state.drawings, drawing], 
        selectedDrawingId: drawing.id 
      })),
      updateDrawing: (id, updates, skipHistory) => set((state) => ({
        undoStack: skipHistory ? state.undoStack : [...state.undoStack, state.drawings],
        redoStack: skipHistory ? state.redoStack : [],
        drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      removeDrawing: (id) => set((state) => ({ 
        undoStack: [...state.undoStack, state.drawings],
        redoStack: [],
        drawings: state.drawings.filter(d => d.id !== id),
        selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId
      })),
      clearDrawings: (symbol) => set((state) => ({ 
        undoStack: [...state.undoStack, state.drawings],
        redoStack: [],
        drawings: state.drawings.filter(d => d.symbol !== symbol), 
        selectedDrawingId: null 
      })),
      undoDrawing: () => set((state) => {
        if (state.undoStack.length === 0) return {};
        const previous = state.undoStack[state.undoStack.length - 1];
        const newUndo = state.undoStack.slice(0, -1);
        return {
          undoStack: newUndo,
          redoStack: [...state.redoStack, state.drawings],
          drawings: previous,
          selectedDrawingId: null
        };
      }),
      redoDrawing: () => set((state) => {
        if (state.redoStack.length === 0) return {};
        const next = state.redoStack[state.redoStack.length - 1];
        const newRedo = state.redoStack.slice(0, -1);
        return {
          redoStack: newRedo,
          undoStack: [...state.undoStack, state.drawings],
          drawings: next,
          selectedDrawingId: null
        };
      }),
      toggleMagnetMode: () => set((state) => ({ isMagnetMode: !state.isMagnetMode })),
      setMagnetModeType: (type) => set({ magnetModeType: type }),
      toggleStayInDrawingMode: () => set((state) => ({ isStayInDrawingMode: !state.isStayInDrawingMode })),
      toggleLockAllDrawings: () => set((state) => ({ isLockAllDrawings: !state.isLockAllDrawings })),
      toggleHideAllDrawings: () => set((state) => ({ isHideAllDrawings: !state.isHideAllDrawings })),
      toggleHideAllIndicators: () => set((state) => ({ isHideAllIndicators: !state.isHideAllIndicators })),
      removeAllDrawings: (symbol) => set((state) => ({
        undoStack: [...state.undoStack, state.drawings],
        redoStack: [],
        drawings: symbol ? state.drawings.filter(d => d.symbol !== symbol) : [],
        selectedDrawingId: null
      })),
      removeAllIndicators: () => set({ activeIndicators: [], hiddenIndicators: [] }),
      removeAllObjects: (symbol) => set((state) => ({
        undoStack: [...state.undoStack, state.drawings],
        redoStack: [],
        drawings: symbol ? state.drawings.filter(d => d.symbol !== symbol) : [],
        selectedDrawingId: null,
        activeIndicators: [],
        hiddenIndicators: []
      })),
      addTick: (tick) => set((state) => {
        const isCurrent = tick.symbol.toLowerCase() === state.activeSymbol.toLowerCase();
        const tickTimeSec = tick.time > 1e11 ? Math.floor(tick.time / 1000) : tick.time;
        const newMarketTime = Math.max(state.marketTime || 0, tickTimeSec);
        
        // If in replay mode, ignore real-time ticks
        if (state.replayState.isActive) {
          return { marketTime: newMarketTime };
        }

        const prevPrice = state.prevTickPrice ?? (state.lastTick ? state.lastTick.price : tick.price);

        // Check alerts
        state.checkAlerts(tick.price, tick.symbol);

        if (!isCurrent) return { marketTime: newMarketTime, prevTickPrice: tick.price };

        // Live update the current close/high/low on active candles
        let updatedCandles = state.candles;
        if (state.candles.length > 0) {
          const lastIdx = state.candles.length - 1;
          const last = state.candles[lastIdx];
          if (last.close !== tick.price || tick.price > last.high || tick.price < last.low) {
            updatedCandles = [...state.candles];
            updatedCandles[lastIdx] = {
              ...last,
              high: Math.max(last.high, tick.price),
              low: Math.min(last.low, tick.price),
              close: tick.price
            };
          }
        }

        return { 
          lastTick: tick, 
          prevTickPrice: tick.price,
          marketTime: newMarketTime,
          candles: updatedCandles,
          candlesVersion: state.candlesVersion + 1
        };
      }),
      setCandles: (candles) => set((state) => {
        const normalized = candles.map(c => ({
          ...c,
          time: typeof c.time === 'number' 
            ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time)
            : Math.floor(new Date(c.time as string).getTime() / 1000)
        }));
        const last = normalized[normalized.length - 1];
        const lastTime = last ? (last.time as number) : state.marketTime;
        return { 
          candles: normalized, 
          candlesByTimeframe: {
            ...state.candlesByTimeframe,
            [state.activeTimeframe]: normalized
          },
          candlesVersion: state.candlesVersion + 1,
          isLoading: false, 
          marketTime: Math.max(state.marketTime || 0, lastTime || 0) 
        };
      }),
      setCandlesByTimeframe: (tf, candles, symbol) => set((state) => {
        if (symbol && symbol.toLowerCase() !== state.activeSymbol.toLowerCase()) {
          return {};
        }
        const normalized = candles.map(c => ({
          ...c,
          time: typeof c.time === 'number' 
            ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time)
            : Math.floor(new Date(c.time as string).getTime() / 1000)
        }));
        const updated = {
          ...state.candlesByTimeframe,
          [tf]: normalized
        };
        return {
          candlesByTimeframe: updated,
          candles: tf === state.activeTimeframe ? normalized : state.candles,
          candlesVersion: state.candlesVersion + 1
        };
      }),
      setMultiTimeframeCandles: (record) => set((state) => {
        const normalizedRecord: Record<string, Candle[]> = {};
        Object.entries(record).forEach(([tf, cList]) => {
          const source = (cList || []).slice(-250);
          normalizedRecord[tf] = source.map(c => ({
            ...c,
            time: typeof c.time === 'number' 
              ? (c.time > 1e11 ? Math.floor(c.time / 1000) : c.time)
              : Math.floor(new Date(c.time as string).getTime() / 1000)
          }));
        });
        const updated = {
          ...state.candlesByTimeframe,
          ...normalizedRecord
        };
        return {
          candlesByTimeframe: updated,
          candles: updated[state.activeTimeframe] || state.candles,
          candlesVersion: state.candlesVersion + 1
        };
      }),
      updateCandle: (candle) => set((state) => {
         const newCandles = [...state.candles];
         const candleTimeSec = typeof candle.time === 'number' 
           ? (candle.time > 1e11 ? Math.floor(candle.time / 1000) : candle.time) 
           : Math.floor(new Date(candle.time as string).getTime() / 1000);

         if (isNaN(candleTimeSec) || candleTimeSec <= 0) return {};

         const normalizedCandle = {
           ...candle,
           time: candleTimeSec
         };

         const newMarketTime = Math.max(state.marketTime || 0, candleTimeSec);

         if (newCandles.length === 0) {
           return { 
             candles: [normalizedCandle], 
             candlesByTimeframe: {
               ...state.candlesByTimeframe,
               [state.activeTimeframe]: [normalizedCandle]
             },
             isLoading: false, 
             marketTime: newMarketTime,
             candlesVersion: state.candlesVersion + 1
           };
         }
         
         const lastIdx = newCandles.length - 1;
         const lastTime = typeof newCandles[lastIdx].time === 'number'
           ? (newCandles[lastIdx].time > 1e11 ? Math.floor(newCandles[lastIdx].time / 1000) : newCandles[lastIdx].time)
           : Math.floor(new Date(newCandles[lastIdx].time as string).getTime() / 1000);

         if (lastTime === candleTimeSec) {
           newCandles[lastIdx] = normalizedCandle;
         } else if (candleTimeSec > lastTime) {
           newCandles.push(normalizedCandle);
           if (newCandles.length > 5000) newCandles.shift();
         }
         return { 
           candles: newCandles, 
           candlesByTimeframe: {
             ...state.candlesByTimeframe,
             [state.activeTimeframe]: newCandles
           },
           isLoading: false, 
           marketTime: newMarketTime,
           candlesVersion: state.candlesVersion + 1
         };
      }),
      updateCandleForTimeframe: (tf, candle, symbol) => set((state) => {
        if (symbol && symbol.toLowerCase() !== state.activeSymbol.toLowerCase()) {
          return {};
        }
        const candleTimeSec = typeof candle.time === 'number' 
          ? (candle.time > 1e11 ? Math.floor(candle.time / 1000) : candle.time) 
          : Math.floor(new Date(candle.time as string).getTime() / 1000);

        if (isNaN(candleTimeSec) || candleTimeSec <= 0) return {};

        const normalizedCandle = {
          ...candle,
          time: candleTimeSec
        };

        const existing = state.candlesByTimeframe[tf] ? [...state.candlesByTimeframe[tf]] : [];
        if (existing.length === 0) {
          existing.push(normalizedCandle);
        } else {
          const lastIdx = existing.length - 1;
          const lastTime = typeof existing[lastIdx].time === 'number'
            ? (existing[lastIdx].time > 1e11 ? Math.floor(existing[lastIdx].time / 1000) : existing[lastIdx].time)
            : Math.floor(new Date(existing[lastIdx].time as string).getTime() / 1000);

          if (lastTime === candleTimeSec) {
            existing[lastIdx] = normalizedCandle;
          } else if (candleTimeSec > lastTime) {
            existing.push(normalizedCandle);
            if (existing.length > 5000) existing.shift();
          }
        }

        const isCurrentTf = tf === state.activeTimeframe;
        return {
          candlesByTimeframe: {
            ...state.candlesByTimeframe,
            [tf]: existing
          },
          candles: isCurrentTf ? existing : state.candles,
          candlesVersion: state.candlesVersion + 1
        };
      }),
      setLoading: (loading) => set({ isLoading: loading }),
      addScript: (script) => set((state) => ({ 
        savedScripts: state.savedScripts.some(s => s.id === script.id)
          ? state.savedScripts.map(s => s.id === script.id ? script : s)
          : [...state.savedScripts, script] 
      })),
      applyScript: (script) => set((state) => ({ 
        activeIndicators: [...state.activeIndicators, { ...script, id: script.id || Math.random().toString(36).substring(2, 9) }] 
      })),
      addIndicator: (indicator) => set((state) => ({
        activeIndicators: [
          ...state.activeIndicators,
          {
            id: indicator.id || Math.random().toString(36).substring(2, 9),
            name: indicator.name,
            code: indicator.code,
            enabled: indicator.enabled ?? true,
            params: indicator.params || {}
          }
        ]
      })),
      updateIndicator: (id, updates) => set((state) => ({
        activeIndicators: state.activeIndicators.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      removeIndicator: (id) => set((state) => ({ 
        activeIndicators: state.activeIndicators.filter(i => i.id !== id),
        hiddenIndicators: state.hiddenIndicators.filter(hid => hid !== id)
      })),
      toggleIndicatorVisibility: (id) => set((state) => ({
        hiddenIndicators: state.hiddenIndicators.includes(id)
          ? state.hiddenIndicators.filter(hid => hid !== id)
          : [...state.hiddenIndicators, id]
      })),
      setTaTimeframe: (tf) => set({ taTimeframe: tf }),
      setPivotMode: (mode) => set({ pivotMode: mode }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setChartType: (type) => set({ chartType: type }),
      setWatchlist: (symbols) => set({ watchlist: symbols }),
      addToWatchlist: (symbol) => set((state) => {
        if (state.watchlist.includes(symbol)) return {};
        return { watchlist: [...state.watchlist, symbol] };
      }),
      removeFromWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.filter(s => s !== symbol)
      })),
      toggleWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.includes(symbol)
          ? state.watchlist.filter(s => s !== symbol)
          : [...state.watchlist, symbol]
      })),

      // Alerts Actions
      addAlert: (alert) => set((state) => {
        const newAlert: PriceAlert = {
          ...alert,
          id: 'alert_' + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          triggered: false,
        };
        return { alerts: [...state.alerts, newAlert] };
      }),
      updateAlert: (id, updates) => set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
      })),
      toggleAlert: (id) => set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a)
      })),
      dismissTriggeredAlert: () => set({ latestTriggeredAlert: null }),
      checkAlerts: (currentPrice, symbol) => set((state) => {
        const matchingAlerts = state.alerts.filter(a => a.active && !a.triggered && a.symbol.toLowerCase() === symbol.toLowerCase());
        if (matchingAlerts.length === 0) return {};

        const prevPrice = state.prevTickPrice ?? currentPrice;
        let newlyTriggeredAlert: PriceAlert | null = null;

        const updatedAlerts = state.alerts.map(a => {
          if (!a.active || a.triggered || a.symbol.toLowerCase() !== symbol.toLowerCase()) return a;

          let isTriggered = false;
          if (a.condition === 'crossing') {
            isTriggered = (prevPrice <= a.targetPrice && currentPrice >= a.targetPrice) ||
                          (prevPrice >= a.targetPrice && currentPrice <= a.targetPrice);
          } else if (a.condition === 'crossing_up') {
            isTriggered = prevPrice <= a.targetPrice && currentPrice >= a.targetPrice;
          } else if (a.condition === 'crossing_down') {
            isTriggered = prevPrice >= a.targetPrice && currentPrice <= a.targetPrice;
          } else if (a.condition === 'greater_than') {
            isTriggered = currentPrice >= a.targetPrice;
          } else if (a.condition === 'less_than') {
            isTriggered = currentPrice <= a.targetPrice;
          }

          if (isTriggered) {
            const triggeredItem: PriceAlert = {
              ...a,
              triggered: true,
              triggeredAt: Date.now(),
              active: !a.isOneOff
            };
            newlyTriggeredAlert = triggeredItem;
            if (a.soundEnabled) {
              soundManager.playAlertSound(a.soundType);
            }
            return triggeredItem;
          }
          return a;
        });

        if (newlyTriggeredAlert) {
          return {
            alerts: updatedAlerts,
            latestTriggeredAlert: newlyTriggeredAlert
          };
        }
        return {};
      }),

      // Replay Actions
      startReplay: (cutoffIndex) => set((state) => {
        const full = state.candles;
        if (full.length < 5) return {};
        const total = full.length;
        const targetCutoff = cutoffIndex !== undefined ? cutoffIndex : Math.max(10, total - 40);
        const sliced = full.slice(0, targetCutoff);

        return {
          fullCandlesBeforeReplay: full,
          candles: sliced,
          candlesVersion: state.candlesVersion + 1,
          replayState: {
            isActive: true,
            isPaused: true,
            speed: state.replayState.speed || 1000,
            currentIndex: targetCutoff,
            totalCandles: total,
            selectedCutoffIndex: targetCutoff
          }
        };
      }),
      pauseReplay: () => set((state) => ({
        replayState: { ...state.replayState, isPaused: true }
      })),
      resumeReplay: () => set((state) => ({
        replayState: { ...state.replayState, isPaused: false }
      })),
      stepReplay: () => set((state) => {
        if (!state.replayState.isActive) return {};
        const { currentIndex, totalCandles } = state.replayState;
        if (currentIndex >= totalCandles) {
          return {
            replayState: { ...state.replayState, isPaused: true }
          };
        }
        const nextIdx = currentIndex + 1;
        const nextCandles = state.fullCandlesBeforeReplay.slice(0, nextIdx);
        return {
          candles: nextCandles,
          candlesVersion: state.candlesVersion + 1,
          replayState: {
            ...state.replayState,
            currentIndex: nextIdx
          }
        };
      }),
      stopReplay: () => set((state) => {
        if (!state.replayState.isActive) return {};
        const originalCandles = state.fullCandlesBeforeReplay.length > 0 ? state.fullCandlesBeforeReplay : state.candles;
        return {
          candles: originalCandles,
          candlesVersion: state.candlesVersion + 1,
          fullCandlesBeforeReplay: [],
          replayState: {
            isActive: false,
            isPaused: true,
            speed: 1000,
            currentIndex: 0,
            totalCandles: 0,
            selectedCutoffIndex: 0
          }
        };
      }),
      setReplaySpeed: (speedMs) => set((state) => ({
        replayState: { ...state.replayState, speed: speedMs }
      })),
      setReplayCutoff: (cutoffIndex) => set((state) => {
        if (!state.replayState.isActive) return {};
        const full = state.fullCandlesBeforeReplay;
        const bounded = Math.max(5, Math.min(cutoffIndex, full.length));
        return {
          candles: full.slice(0, bounded),
          candlesVersion: state.candlesVersion + 1,
          replayState: {
            ...state.replayState,
            currentIndex: bounded,
            selectedCutoffIndex: bounded
          }
        };
      }),

      // Layout & Settings Actions
      setMultiLayout: (layout) => set({ multiLayout: layout }),
      saveCurrentLayout: (name) => set((state) => {
        const existingIdx = state.savedLayouts.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
        const layoutObj: SavedChartLayout = {
          id: existingIdx >= 0 ? state.savedLayouts[existingIdx].id : 'layout_' + Math.random().toString(36).substring(2, 9),
          name: name.trim() || 'Untitled Layout',
          updatedAt: Date.now(),
          symbol: state.activeSymbol,
          timeframe: state.activeTimeframe,
          chartType: state.chartType,
          indicators: state.activeIndicators,
          drawings: state.drawings,
          settings: state.chartSettings
        };

        const updatedList = existingIdx >= 0 
          ? state.savedLayouts.map((l, i) => i === existingIdx ? layoutObj : l)
          : [...state.savedLayouts, layoutObj];

        return {
          savedLayouts: updatedList,
          currentLayoutName: layoutObj.name
        };
      }),
      loadLayout: (id) => set((state) => {
        const found = state.savedLayouts.find(l => l.id === id);
        if (!found) return {};
        return {
          currentLayoutName: found.name,
          activeSymbol: found.symbol || state.activeSymbol,
          activeTimeframe: found.timeframe || state.activeTimeframe,
          chartType: found.chartType || state.chartType,
          activeIndicators: found.indicators || state.activeIndicators,
          drawings: found.drawings || [],
          chartSettings: found.settings ? { ...state.chartSettings, ...found.settings } : state.chartSettings
        };
      }),
      deleteLayout: (id) => set((state) => ({
        savedLayouts: state.savedLayouts.filter(l => l.id !== id)
      })),
      renameLayout: (id, newName) => set((state) => ({
        savedLayouts: state.savedLayouts.map(l => l.id === id ? { ...l, name: newName, updatedAt: Date.now() } : l),
        currentLayoutName: state.savedLayouts.find(l => l.id === id)?.name === state.currentLayoutName ? newName : state.currentLayoutName
      })),
      updateChartSettings: (updates) => set((state) => ({
        chartSettings: { ...state.chartSettings, ...updates }
      })),

      // Modal controls
      setAlertModalOpen: (open) => set({ isAlertModalOpen: open }),
      setQuickSearchOpen: (open) => set({ isQuickSearchOpen: open }),
      setChartSettingsOpen: (open) => set({ isChartSettingsOpen: open }),
      setScreenshotModalOpen: (open) => set({ isScreenshotModalOpen: open }),
      setSaveLayoutModalOpen: (open) => set({ isSaveLayoutModalOpen: open }),
      setLayoutSelectorOpen: (open) => set({ isLayoutSelectorOpen: open }),
      setCandleHistoryModalOpen: (open) => set({ isCandleHistoryModalOpen: open }),

      // Google Drive Actions
      syncToCloud: async (accessToken: string) => {
        const state = get();
        set({ isSyncingCloud: true });
        try {
          await saveToGoogleDrive(accessToken, {
            layouts: state.savedLayouts,
            chartSettings: state.chartSettings,
            activeIndicators: state.activeIndicators,
            drawings: state.drawings,
            updatedAt: Date.now()
          });
        } catch (err) {
          console.error("Cloud backup failed:", err);
        } finally {
          set({ isSyncingCloud: false });
        }
      },
      syncFromCloud: async (accessToken: string) => {
        set({ isSyncingCloud: true });
        try {
          const data = await loadFromGoogleDrive(accessToken);
          if (data) {
            set({
              savedLayouts: data.layouts || get().savedLayouts,
              chartSettings: data.chartSettings || get().chartSettings,
              activeIndicators: data.activeIndicators || get().activeIndicators,
              drawings: data.drawings || get().drawings
            });
          }
        } catch (err) {
          console.error("Cloud restore failed:", err);
        } finally {
          set({ isSyncingCloud: false });
        }
      }
    }),
    {
      name: 'otivo-market-storage',
      onRehydrateStorage: () => (state) => {
        if (typeof document !== 'undefined') {
          const theme = state?.theme || 'dark';
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
      },
      partialize: (state) => ({
        activeSymbol: state.activeSymbol,
        activeTimeframe: state.activeTimeframe,
        theme: state.theme,
        activePage: state.activePage,
        savedScripts: state.savedScripts,
        activeIndicators: state.activeIndicators,
        hiddenIndicators: state.hiddenIndicators,
        taTimeframe: state.taTimeframe,
        pivotMode: state.pivotMode,
        chartType: state.chartType,
        alerts: state.alerts,
        multiLayout: state.multiLayout,
        savedLayouts: state.savedLayouts,
        currentLayoutName: state.currentLayoutName,
        chartSettings: state.chartSettings,
        drawings: state.drawings,
        watchlist: state.watchlist
      })
    }
  )
);
