import { useEffect, useRef, useState, useCallback, Fragment } from 'react';
import { io } from 'socket.io-client';
import { derivClient, generateSeedCandles } from './lib/derivClient';
import { 
  ChevronDown,
  LineChart,
  Bell,
  RotateCcw,
  Image,
  Send,
  MapPin,
  Flag,
  Table,
  RotateCw,
  LayoutGrid,
  AlignJustify,
  Search,
  Plus,
  ArrowRight,
  Circle,
  Tag,
  StickyNote,
  Clock,
  Settings2,
  Maximize2,
  Camera,
  Crosshair,
  Paintbrush,
  Eye,
  MousePointer2,
  Slash,
  Layers,
  Pencil,
  Type,
  Shapes,
  Activity,
  Smile,
  Ruler,
  ZoomIn,
  Magnet,
  Lock,
  EyeOff,
  Trash2,
  List,
  Square,
  TrendingUp,
  Calendar,
  Lightbulb,
  MessageSquare,
  ShoppingCart,
  Database,
  HelpCircle,
  Sun,
  Moon,
  Bookmark,
  Code2,
  MoreHorizontal,
  Gauge,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import './index.css';

// Simple Pine Script highlighter definition (based on JS/C)
const pinelanguages = {
  ...languages.javascript,
  'keyword': /\b(strategy|indicator|plot|bgcolor|input|ta|color|if|else|for|while|return|break|continue|case|switch|default|type|var|const|true|false)\b/,
  'function': /\b[a-z_][a-z0-9_]*(?=\()/i,
  'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
  'string': /(['"])(?:(?!\1)[^\\\r\n]|\\.)*\1/,
  'operator': /[\+\-\*\/%&|^!<>]=?|==|!=/,
};

import { TradingChart } from './components/Charting/TradingChart';
import { MultiChartContainer } from './components/Charting/MultiChartContainer';
import { TechnicalAnalysisPage } from './components/TechnicalAnalysis/TechnicalAnalysisPage';
import { SymbolLogo } from './components/SymbolLogo';
import { AlertsModal } from './components/Charting/AlertsModal';
import { TriggeredAlertToast } from './components/Charting/TriggeredAlertToast';
import { BarReplayControl } from './components/Charting/BarReplayControl';
import { LayoutSelectorModal } from './components/Charting/LayoutSelectorModal';
import { SaveLayoutModal } from './components/Charting/SaveLayoutModal';
import { QuickSearchModal } from './components/Charting/QuickSearchModal';
import { ChartSettingsModal } from './components/Charting/ChartSettingsModal';
import { ScreenshotModal } from './components/Charting/ScreenshotModal';
import { formatSymbolPrice } from './lib/priceFormatter';
import { useMarketStore, CURRENCY_PAIRS } from './store/useMarketStore';
import { BUILTIN_INDICATORS } from './lib/indicatorsList';
import { Tick, Candle } from './types';

// Header Component
const Header = () => {
  const { 
    activeSymbol, activeTimeframe, setTimeframe, setSymbol, theme, toggleTheme, 
    savedScripts, applyScript, activeIndicators, addIndicator, removeIndicator,
    availableSymbols, activePage, setActivePage, chartType, setChartType,
    alerts, setAlertModalOpen,
    replayState, startReplay, stopReplay,
    undoStack, redoStack, undoDrawing, redoDrawing,
    setLayoutSelectorOpen, multiLayout,
    setSaveLayoutModalOpen, currentLayoutName,
    setQuickSearchOpen,
    setChartSettingsOpen,
    setScreenshotModalOpen,
  } = useMarketStore();
  const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
  const [isTimeframeMenuOpen, setIsTimeframeMenuOpen] = useState(false);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false);
  const [isIndicatorsMenuOpen, setIsIndicatorsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [indicatorSearchQuery, setIndicatorSearchQuery] = useState('');
  const [indicatorTab, setIndicatorTab] = useState<'builtins' | 'scripts'>('builtins');
  const [marketFilter, setMarketFilter] = useState<'all' | 'synthetic_index' | 'forex' | 'cryptocurrency' | 'commodities'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const symbolBtnRef = useRef<HTMLButtonElement>(null);
  const timeframeBtnRef = useRef<HTMLButtonElement>(null);
  const chartTypeBtnRef = useRef<HTMLButtonElement>(null);
  const indicatorsBtnRef = useRef<HTMLButtonElement>(null);

  const [symbolMenuPos, setSymbolMenuPos] = useState({ left: 16, top: 42 });
  const [timeframeMenuPos, setTimeframeMenuPos] = useState({ left: 160, top: 42 });
  const [chartTypeMenuPos, setChartTypeMenuPos] = useState({ left: 220, top: 42 });
  const [indicatorsMenuPos, setIndicatorsMenuPos] = useState({ left: 280, top: 42 });
  
  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '1d', '1w'];
  const quickTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const closeAllMenus = useCallback(() => {
    setIsSymbolMenuOpen(false);
    setIsTimeframeMenuOpen(false);
    setIsChartTypeMenuOpen(false);
    setIsIndicatorsMenuOpen(false);
  }, []);

  // Listen to Escape key to close any open dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllMenus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAllMenus]);

  const toggleSymbolMenu = () => {
    if (!isSymbolMenuOpen && symbolBtnRef.current) {
      const rect = symbolBtnRef.current.getBoundingClientRect();
      setSymbolMenuPos({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 420)),
        top: rect.bottom + 4,
      });
      setSearchQuery('');
    }
    setIsSymbolMenuOpen(!isSymbolMenuOpen);
    setIsTimeframeMenuOpen(false);
    setIsChartTypeMenuOpen(false);
    setIsIndicatorsMenuOpen(false);
  };

  const toggleTimeframeMenu = () => {
    if (!isTimeframeMenuOpen && timeframeBtnRef.current) {
      const rect = timeframeBtnRef.current.getBoundingClientRect();
      setTimeframeMenuPos({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 200)),
        top: rect.bottom + 4,
      });
    }
    setIsTimeframeMenuOpen(!isTimeframeMenuOpen);
    setIsSymbolMenuOpen(false);
    setIsChartTypeMenuOpen(false);
    setIsIndicatorsMenuOpen(false);
  };

  const toggleChartTypeMenu = () => {
    if (!isChartTypeMenuOpen && chartTypeBtnRef.current) {
      const rect = chartTypeBtnRef.current.getBoundingClientRect();
      setChartTypeMenuPos({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 200)),
        top: rect.bottom + 4,
      });
    }
    setIsChartTypeMenuOpen(!isChartTypeMenuOpen);
    setIsSymbolMenuOpen(false);
    setIsTimeframeMenuOpen(false);
    setIsIndicatorsMenuOpen(false);
  };

  const toggleIndicatorsMenu = () => {
    if (!isIndicatorsMenuOpen && indicatorsBtnRef.current) {
      const rect = indicatorsBtnRef.current.getBoundingClientRect();
      setIndicatorsMenuPos({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 400)),
        top: rect.bottom + 4,
      });
      setIndicatorSearchQuery('');
    }
    setIsIndicatorsMenuOpen(!isIndicatorsMenuOpen);
    setIsSymbolMenuOpen(false);
    setIsTimeframeMenuOpen(false);
    setIsChartTypeMenuOpen(false);
  };

  const filteredSymbols = availableSymbols.filter(s => {
    const matchesSearch = s.display.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.marketDisplay && s.marketDisplay.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMarket = marketFilter === 'all' || s.market === marketFilter;
    return matchesSearch && matchesMarket;
  });

  const filteredBuiltins = BUILTIN_INDICATORS.filter(ind => 
    ind.name.toLowerCase().includes(indicatorSearchQuery.toLowerCase()) ||
    ind.description.toLowerCase().includes(indicatorSearchQuery.toLowerCase())
  );

  const filteredScripts = savedScripts.filter(s => 
    s.name.toLowerCase().includes(indicatorSearchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(indicatorSearchQuery.toLowerCase())
  );

  const currentSymbolObj = availableSymbols.find(p => p.id === activeSymbol || p.symbol === activeSymbol);
  
  return (
    <header className="h-10 tv-border-b flex items-center justify-between px-1.5 sm:px-2 text-tv-text bg-tv-bg z-30 select-none relative">
      <div className="flex items-center gap-1 sm:gap-1.5 h-full min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
        {/* TradingView Brand Logo */}
        <button 
          onClick={() => setActivePage('chart')}
          className="flex items-center justify-center px-1.5 sm:px-2 h-8 rounded hover:bg-tv-hover transition-colors shrink-0 cursor-pointer"
          title="TradingView - Return to Chart"
        >
          <img 
            src={theme === 'dark' ? '/logo2.png' : '/logo.png'} 
            alt="TradingView" 
            className="h-4 sm:h-5 object-contain"
          />
        </button>
        <div className="w-px h-5 bg-tv-border mx-0.5 shrink-0" />

        {/* Primary Navigation: Chart vs Technical Analysis */}
        <nav className="flex items-center bg-tv-hover/50 p-0.5 rounded-lg border border-tv-border/50 text-xs font-semibold shrink-0">
          <button 
            onClick={() => setActivePage('chart')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0 ${
              activePage === 'chart' 
                ? 'bg-tv-bg text-tv-accent shadow-xs font-bold' 
                : 'text-tv-muted hover:text-tv-text'
            }`}
            title="Interactive Chart"
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Chart</span>
          </button>
          <button 
            onClick={() => setActivePage('technical-analysis')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0 ${
              activePage === 'technical-analysis' 
                ? 'bg-tv-bg text-tv-accent shadow-xs font-bold' 
                : 'text-tv-muted hover:text-tv-text'
            }`}
            title="Technical Analysis"
          >
            <Gauge className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Technical Analysis</span>
            <span className="hidden sm:inline md:hidden">Technicals</span>
            <span className="sm:hidden">Tech</span>
          </button>
        </nav>

        <div className="w-px h-5 bg-tv-border mx-0.5 shrink-0" />

        {/* Symbol Selector Button */}
        <div className="relative shrink-0">
          <button 
            ref={symbolBtnRef}
            onClick={toggleSymbolMenu}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-8 rounded hover:bg-tv-hover transition-colors font-bold text-xs sm:text-[13px] shrink-0 cursor-pointer ${isSymbolMenuOpen ? 'bg-tv-hover shadow-sm text-tv-accent' : ''}`}
            title="Search Markets & Symbols"
          >
            <SymbolLogo symbol={currentSymbolObj?.id || currentSymbolObj?.symbol || activeSymbol} size="sm" className="shrink-0" />
            <span className="truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[150px] md:max-w-[180px]">
              {currentSymbolObj?.display || activeSymbol}
            </span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-tv-accent/15 text-tv-accent uppercase font-mono font-normal">
              {currentSymbolObj?.symbol || activeSymbol}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-tv-muted shrink-0 transition-transform duration-200 ${isSymbolMenuOpen ? 'rotate-180 text-tv-accent' : ''}`} />
          </button>
        </div>
        
        {/* Only show chart-specific toolbar controls on the chart view */}
        {activePage === 'chart' && (
          <>
            <div className="w-px h-5 bg-tv-border mx-0.5 shrink-0" />
            
            {/* Timeframe Selector with quick pills on medium+ screens */}
            <div className="flex items-center gap-0.5 shrink-0">
              <div className="hidden lg:flex items-center gap-0.5">
                {quickTimeframes.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf as any)}
                    className={`px-1.5 py-1 rounded text-xs transition-colors ${activeTimeframe === tf ? 'text-tv-accent font-bold bg-tv-accent/10' : 'text-tv-muted hover:text-tv-text hover:bg-tv-hover'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <button 
                ref={timeframeBtnRef}
                onClick={toggleTimeframeMenu}
                className={`flex items-center gap-1 px-2 sm:px-2.5 h-8 rounded hover:bg-tv-hover transition-colors text-xs sm:text-[13px] font-semibold shrink-0 cursor-pointer ${isTimeframeMenuOpen ? 'bg-tv-hover text-tv-accent shadow-sm' : ''}`}
                title="Select Interval"
              >
                <span>{activeTimeframe}</span>
                <ChevronDown className={`w-3 h-3 text-tv-muted transition-transform duration-200 ${isTimeframeMenuOpen ? 'rotate-180 text-tv-accent' : ''}`} />
              </button>
            </div>

            <div className="w-px h-5 border-l border-tv-border mx-0.5 shrink-0" />

            {/* Chart Style (Candles / Line / Area / Bars / Heikin Ashi / etc.) */}
            <div className="relative shrink-0">
              <button 
                ref={chartTypeBtnRef}
                onClick={toggleChartTypeMenu}
                className={`flex items-center gap-1 p-1.5 sm:px-2 h-8 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer ${isChartTypeMenuOpen ? 'bg-tv-hover text-tv-accent' : ''}`} 
                title="Chart Type"
              >
                {chartType === 'bars' ? (
                  <AlignJustify className="w-4 h-4 text-tv-muted" />
                ) : chartType === 'line' || chartType === 'stepline' ? (
                  <LineChart className="w-4 h-4 text-tv-muted" />
                ) : chartType === 'area' ? (
                  <Layers className="w-4 h-4 text-tv-muted" />
                ) : chartType === 'baseline' ? (
                  <Activity className="w-4 h-4 text-tv-muted" />
                ) : chartType === 'hollow_candlestick' ? (
                  <Square className="w-4 h-4 text-tv-muted" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-tv-muted" />
                )}
                <ChevronDown className="w-3 h-3 text-tv-muted hidden sm:inline" />
              </button>
            </div>

            <div className="w-px h-5 border-l border-tv-border mx-0.5 shrink-0" />
            
            {/* Indicators Menu */}
            <div className="relative shrink-0">
              <button 
                ref={indicatorsBtnRef}
                onClick={toggleIndicatorsMenu}
                className={`flex items-center gap-1.5 px-2 sm:px-3 h-8 hover:bg-tv-hover rounded transition-colors text-xs sm:text-[13px] font-medium shrink-0 cursor-pointer ${isIndicatorsMenuOpen ? 'bg-tv-hover text-tv-accent font-semibold' : ''}`}
                title="Indicators, Metrics & Strategies"
              >
                <LineChart className="w-4 h-4 text-tv-muted shrink-0" />
                <span className="hidden md:inline">Indicators</span>
                {activeIndicators.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-tv-accent text-white font-bold rounded-full">
                    {activeIndicators.length}
                  </span>
                )}
              </button>
            </div>

            {/* Alerts Button */}
            <button 
              onClick={() => setAlertModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 h-8 hover:bg-tv-hover rounded transition-colors text-[13px] font-medium shrink-0 cursor-pointer relative"
              title="Create & Manage Price Alerts"
            >
              <Bell className="w-4 h-4 text-tv-muted" />
              <span>Alert</span>
              {alerts.filter(a => a.active).length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-tv-accent text-white font-bold rounded-full">
                  {alerts.filter(a => a.active).length}
                </span>
              )}
            </button>

            {/* Bar Replay Button */}
            <button 
              onClick={() => {
                if (replayState.isActive) {
                  stopReplay();
                } else {
                  startReplay();
                }
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 h-8 rounded transition-colors text-[13px] font-medium shrink-0 cursor-pointer ${
                replayState.isActive ? 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/40' : 'hover:bg-tv-hover text-tv-text'
              }`}
              title={replayState.isActive ? 'Exit Bar Replay' : 'Jump Bar Replay Simulator'}
            >
              <RotateCcw className={`w-4 h-4 ${replayState.isActive ? 'text-amber-500 animate-spin-reverse' : 'text-tv-muted'}`} />
              <span>Replay</span>
            </button>

            <div className="hidden lg:block w-px h-5 bg-tv-border mx-1 shrink-0" />

            {/* Undo/Redo */}
            <button 
              onClick={undoDrawing}
              disabled={undoStack.length === 0}
              className="hidden lg:flex p-1.5 hover:bg-tv-hover disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors shrink-0 cursor-pointer"
              title="Undo Drawing (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4 text-tv-muted" />
            </button>
            <button 
              onClick={redoDrawing}
              disabled={redoStack.length === 0}
              className="hidden lg:flex p-1.5 hover:bg-tv-hover disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors shrink-0 cursor-pointer"
              title="Redo Drawing (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4 text-tv-muted" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 h-full shrink-0 ml-1">
        {/* Only show chart layout, save & search on chart view */}
        {activePage === 'chart' && (
          <>
            {/* Multi-Chart Layout */}
            <button 
              onClick={() => setLayoutSelectorOpen(true)}
              className="hidden md:flex p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer relative"
              title="Select Chart Layout Grid"
            >
              <Square className="w-4 h-4 text-tv-muted" />
              {multiLayout !== '1' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-tv-accent rounded-full" />
              )}
            </button>
            
            {/* Save Layout */}
            <button 
              onClick={() => setSaveLayoutModalOpen(true)}
              className="hidden md:flex items-center gap-1 px-2 h-8 hover:bg-tv-hover rounded transition-colors text-xs font-medium shrink-0 cursor-pointer"
              title="Manage & Save Layouts"
            >
              <Bookmark className="w-3.5 h-3.5 text-tv-muted" />
              <span className="max-w-[90px] truncate">{currentLayoutName}</span>
              <ChevronDown className="w-3 h-3 text-tv-muted shrink-0" />
            </button>

            <div className="hidden md:block w-px h-5 bg-tv-border mx-1 shrink-0" />

            {/* Quick Search / Command Palette */}
            <button 
              onClick={() => setQuickSearchOpen(true)}
              className="hidden md:flex p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer"
              title="Quick Search / Command Palette (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-tv-muted" />
            </button>
          </>
        )}
        
        <button 
          onClick={toggleTheme}
          className="p-1.5 hover:bg-tv-hover rounded transition-colors text-tv-accent cursor-pointer shrink-0"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {activePage === 'chart' && (
          <>
            <button 
              onClick={() => setChartSettingsOpen(true)}
              className="hidden sm:flex p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer" 
              title="Chart Settings & Appearance"
            >
              <Settings2 className="w-4 h-4 text-tv-muted" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="hidden sm:flex p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer" 
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4 text-tv-muted" />
            </button>
            <button 
              onClick={() => setScreenshotModalOpen(true)}
              className="hidden sm:flex p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0 cursor-pointer" 
              title="Take a Snapshot"
            >
              <Camera className="w-4 h-4 text-tv-muted" />
            </button>
          </>
        )}
      </div>

      {/* FIXED DROPDOWN MENUS (Rendered at top level of Header to guarantee no overflow clipping on large/small screens) */}

      {/* 1. Market / Symbol Selector Dropdown Modal */}
      {isSymbolMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9990] bg-black/25 backdrop-blur-[0.5px]" 
            onClick={closeAllMenus} 
          />
          <div 
            style={{
              top: `${symbolMenuPos.top}px`,
              left: `${Math.max(8, Math.min(symbolMenuPos.left, (typeof window !== 'undefined' ? window.innerWidth : 800) - 410))}px`
            }}
            className="fixed z-[9999] bg-tv-bg border border-tv-border shadow-2xl rounded-xl py-2 w-[calc(100vw-16px)] sm:w-[400px] max-w-[420px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Header with Title & Close */}
            <div className="flex items-center justify-between px-3.5 pb-2 border-b border-tv-border/50 mb-2">
              <div className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-tv-accent" />
                <span className="text-xs font-bold text-tv-text uppercase tracking-wider">Symbol Search</span>
              </div>
              <button 
                onClick={closeAllMenus} 
                className="p-1 rounded text-tv-muted hover:text-tv-text hover:bg-tv-hover transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 pb-2">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-tv-muted pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Search markets (e.g. EUR/USD, Volatility, BTC)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-tv-hover/60 border border-tv-border rounded-md text-tv-text placeholder:text-tv-muted focus:outline-none focus:border-tv-accent"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 text-tv-muted hover:text-tv-text">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Market Category Tabs */}
            <div className="flex items-center px-3 py-1 gap-1 border-b border-tv-border/50 text-[11px] overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setMarketFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${marketFilter === 'all' ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
              >
                All ({availableSymbols.length})
              </button>
              <button 
                onClick={() => setMarketFilter('synthetic_index')}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${marketFilter === 'synthetic_index' ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
              >
                Derived
              </button>
              <button 
                onClick={() => setMarketFilter('forex')}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${marketFilter === 'forex' ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
              >
                Forex
              </button>
              <button 
                onClick={() => setMarketFilter('cryptocurrency')}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${marketFilter === 'cryptocurrency' ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
              >
                Crypto
              </button>
              <button 
                onClick={() => setMarketFilter('commodities')}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${marketFilter === 'commodities' ? 'bg-tv-accent text-white font-bold' : 'text-tv-muted hover:text-tv-text'}`}
              >
                Commodities
              </button>
            </div>

            {/* Symbol List */}
            <div className="max-h-[55vh] sm:max-h-[340px] overflow-y-auto divide-y divide-tv-border/20">
              {filteredSymbols.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-tv-muted italic">
                  No symbols found for "{searchQuery}"
                </div>
              ) : (
                filteredSymbols.map(pair => {
                  const symKey = pair.id || pair.symbol;
                  const isItemActive = activeSymbol.toLowerCase() === symKey.toLowerCase() || activeSymbol.toLowerCase() === pair.symbol.toLowerCase();
                  return (
                    <button 
                      key={symKey}
                      onClick={() => {
                        setSymbol(symKey);
                        closeAllMenus();
                      }}
                      className={`w-full text-left px-3.5 py-2.5 hover:bg-tv-hover flex items-center justify-between group transition-colors cursor-pointer ${isItemActive ? 'bg-tv-accent/10 text-tv-accent' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <SymbolLogo symbol={symKey} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs truncate ${isItemActive ? 'font-bold' : 'font-medium'}`}>{pair.display}</span>
                          <span className="text-[10px] text-tv-muted font-mono">{pair.marketDisplay || pair.market}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-tv-muted/15 font-mono text-tv-muted uppercase">{pair.symbol}</span>
                        {isItemActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-tv-accent" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* 2. Timeframe Selector Dropdown */}
      {isTimeframeMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9990] bg-black/20" 
            onClick={closeAllMenus} 
          />
          <div 
            style={{
              top: `${timeframeMenuPos.top}px`,
              left: `${Math.max(8, Math.min(timeframeMenuPos.left, (typeof window !== 'undefined' ? window.innerWidth : 800) - 180))}px`
            }}
            className="fixed z-[9999] bg-tv-bg border border-tv-border shadow-2xl rounded-xl py-1.5 min-w-[160px] max-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-tv-muted uppercase border-b border-tv-border/50 flex items-center justify-between">
              <span>Timeframe</span>
              <span className="font-mono text-[9px]">Interval</span>
            </div>
            <div className="p-1 max-h-[300px] overflow-y-auto">
              <div className="text-[10px] text-tv-muted px-2.5 py-1 font-semibold">Minutes</div>
              {['1m', '3m', '5m', '15m', '30m'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf as any);
                    closeAllMenus();
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-tv-hover transition-colors flex items-center justify-between cursor-pointer ${activeTimeframe === tf ? 'text-tv-accent bg-tv-accent/10 font-bold' : 'font-medium text-tv-text'}`}
                >
                  <span>{tf}</span>
                  {activeTimeframe === tf && <span className="w-1.5 h-1.5 rounded-full bg-tv-accent" />}
                </button>
              ))}
              
              <div className="text-[10px] text-tv-muted px-2.5 py-1 mt-1 border-t border-tv-border/30 font-semibold">Hours</div>
              {['1h', '2h', '4h', '8h'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf as any);
                    closeAllMenus();
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-tv-hover transition-colors flex items-center justify-between cursor-pointer ${activeTimeframe === tf ? 'text-tv-accent bg-tv-accent/10 font-bold' : 'font-medium text-tv-text'}`}
                >
                  <span>{tf}</span>
                  {activeTimeframe === tf && <span className="w-1.5 h-1.5 rounded-full bg-tv-accent" />}
                </button>
              ))}

              <div className="text-[10px] text-tv-muted px-2.5 py-1 mt-1 border-t border-tv-border/30 font-semibold">Days & Weeks</div>
              {['1d', '1w'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf as any);
                    closeAllMenus();
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-tv-hover transition-colors flex items-center justify-between cursor-pointer ${activeTimeframe === tf ? 'text-tv-accent bg-tv-accent/10 font-bold' : 'font-medium text-tv-text'}`}
                >
                  <span>{tf}</span>
                  {activeTimeframe === tf && <span className="w-1.5 h-1.5 rounded-full bg-tv-accent" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 3. Chart Style Dropdown */}
      {isChartTypeMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9990] bg-black/20" 
            onClick={closeAllMenus} 
          />
          <div 
            style={{
              top: `${chartTypeMenuPos.top}px`,
              left: `${Math.max(8, Math.min(chartTypeMenuPos.left, (typeof window !== 'undefined' ? window.innerWidth : 800) - 180))}px`
            }}
            className="fixed z-[9999] bg-tv-bg border border-tv-border shadow-2xl rounded-xl py-1.5 min-w-[160px] max-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-tv-muted uppercase border-b border-tv-border/50">
              Chart Type
            </div>
            <div className="p-1">
              {[
                { id: 'candlestick', label: 'Candles' },
                { id: 'bars', label: 'Bars' },
                { id: 'hollow_candlestick', label: 'Hollow Candles' },
                { id: 'heikin_ashi', label: 'Heikin Ashi' },
                { id: 'line', label: 'Line' },
                { id: 'area', label: 'Area' },
                { id: 'baseline', label: 'Baseline' },
                { id: 'stepline', label: 'Step Line' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => {
                    setChartType(item.id as any);
                    closeAllMenus();
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-tv-hover transition-colors flex items-center justify-between cursor-pointer ${chartType === item.id ? 'text-tv-accent bg-tv-accent/10 font-bold' : 'font-medium text-tv-text'}`}
                >
                  <span>{item.label}</span>
                  {chartType === item.id && <span className="w-1.5 h-1.5 rounded-full bg-tv-accent" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 4. Indicators & Scripts Dropdown Modal */}
      {isIndicatorsMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9990] bg-black/25 backdrop-blur-[0.5px]" 
            onClick={closeAllMenus} 
          />
          <div 
            style={{
              top: `${indicatorsMenuPos.top}px`,
              left: `${Math.max(8, Math.min(indicatorsMenuPos.left, (typeof window !== 'undefined' ? window.innerWidth : 800) - 400))}px`
            }}
            className="fixed z-[9999] bg-tv-bg border border-tv-border shadow-2xl rounded-xl py-2 w-[calc(100vw-16px)] sm:w-[380px] max-w-[400px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Header & Tabs */}
            <div className="px-3 pb-2 border-b border-tv-border/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-tv-accent" />
                  <span className="text-xs font-bold text-tv-text uppercase tracking-wider">Indicators & Metrics</span>
                </div>
                <button 
                  onClick={closeAllMenus} 
                  className="p-1 rounded text-tv-muted hover:text-tv-text hover:bg-tv-hover transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex rounded-md bg-tv-hover/60 p-0.5 text-[11px] font-semibold">
                <button
                  onClick={() => setIndicatorTab('builtins')}
                  className={`flex-1 py-1 rounded transition-colors cursor-pointer ${indicatorTab === 'builtins' ? 'bg-tv-bg text-tv-accent shadow-xs font-bold' : 'text-tv-muted hover:text-tv-text'}`}
                >
                  Built-in ({filteredBuiltins.length})
                </button>
                <button
                  onClick={() => setIndicatorTab('scripts')}
                  className={`flex-1 py-1 rounded transition-colors cursor-pointer ${indicatorTab === 'scripts' ? 'bg-tv-bg text-tv-accent shadow-xs font-bold' : 'text-tv-muted hover:text-tv-text'}`}
                >
                  My Scripts ({savedScripts.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-0.5">
                <Search className="w-3.5 h-3.5 text-tv-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={indicatorSearchQuery}
                  onChange={(e) => setIndicatorSearchQuery(e.target.value)}
                  placeholder="Search indicators..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-tv-hover/40 border border-tv-border rounded-md text-tv-text placeholder:text-tv-muted focus:outline-none focus:border-tv-accent"
                  autoFocus
                />
              </div>
            </div>

            {/* Indicator List */}
            <div className="max-h-[55vh] sm:max-h-[320px] overflow-y-auto divide-y divide-tv-border/20">
              {indicatorTab === 'builtins' ? (
                filteredBuiltins.length === 0 ? (
                  <div className="px-4 py-8 text-center text-tv-muted italic text-xs">
                    No matching built-in indicators found.
                  </div>
                ) : (
                  filteredBuiltins.map(ind => {
                    const isApplied = activeIndicators.some(i => i.name.toLowerCase() === ind.name.toLowerCase());
                    return (
                      <button 
                        key={ind.id}
                        onClick={() => {
                          if (isApplied) {
                            const applied = activeIndicators.find(i => i.name.toLowerCase() === ind.name.toLowerCase());
                            if (applied) removeIndicator(applied.id);
                          } else {
                            addIndicator({
                              name: ind.name,
                              code: ind.code,
                              enabled: true
                            });
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-tv-hover flex items-center justify-between group transition-colors cursor-pointer ${isApplied ? 'bg-tv-accent/10' : ''}`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-xs truncate ${isApplied ? 'text-tv-accent' : 'text-tv-text'}`}>
                              {ind.name}
                            </span>
                            {ind.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-tv-hover text-tv-muted font-medium shrink-0">
                                {ind.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-tv-muted line-clamp-1 mt-0.5">
                            {ind.description}
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center">
                          {isApplied ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-tv-accent/20 text-tv-accent font-bold">
                              Active
                            </span>
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-tv-muted group-hover:text-tv-accent transition-colors" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                filteredScripts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-tv-muted italic text-xs">
                    No saved scripts found.<br/>Use Pine Editor in the bottom panel to write scripts.
                  </div>
                ) : (
                  filteredScripts.map(script => (
                    <button 
                      key={script.id}
                      onClick={() => {
                        applyScript(script);
                        closeAllMenus();
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-tv-hover flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-xs text-tv-text truncate">{script.name}</span>
                        <span className="text-[10px] text-tv-muted font-mono truncate">{script.code.substring(0, 35)}...</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-tv-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

// Drawing Toolbar Component
const DrawingToolbar = () => {
  const { theme, setActiveTool, activeTool, clearDrawings, activeSymbol } = useMarketStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Record<string, string>>({
    lines: 'Trendline',
    fib: 'Fib retracement',
    patterns: 'XABCD pattern',
    prediction: 'Long position',
    shapes: 'Brush',
    text: 'Text',
  });

  const toolCategories = {
    lines: {
      icon: <Slash className="w-5 h-5 flex-shrink-0" />,
      label: 'Lines',
      tools: [
        { name: 'Trendline', icon: <Slash className="w-4 h-4" />, shortcut: 'Alt + T', category: 'LINES' },
        { name: 'Ray', icon: <Slash className="w-4 h-4" /> },
        { name: 'Info line', icon: <Slash className="w-4 h-4" /> },
        { name: 'Extended line', icon: <Slash className="w-4 h-4" /> },
        { name: 'Trend angle', icon: <Slash className="w-4 h-4" /> },
        { name: 'Horizontal line', icon: <div className="w-4 h-[1px] bg-current" />, shortcut: 'Alt + H' },
        { name: 'Horizontal ray', icon: <div className="w-4 h-[1px] bg-current" />, shortcut: 'Alt + J' },
        { name: 'Vertical line', icon: <div className="w-[1px] h-4 bg-current" />, shortcut: 'Alt + V' },
        { name: 'Cross line', icon: <Plus className="w-4 h-4" />, shortcut: 'Alt + C' },
        { name: 'Parallel channel', icon: <Layers className="w-4 h-4" />, category: 'CHANNELS' },
        { name: 'Disjoint channel', icon: <Layers className="w-4 h-4" /> },
        { name: 'Regression trend', icon: <TrendingUp className="w-4 h-4" /> },
        { name: 'Pitchfork', icon: <AlignJustify className="w-4 h-4" />, category: 'PITCHFORKS' },
      ]
    },
    fib: {
      icon: <AlignJustify className="w-5 h-5 flex-shrink-0 rotate-90" />,
      label: 'Fibonacci',
      tools: [
        { name: 'Fib retracement', icon: <AlignJustify className="w-4 h-4 rotate-90" />, shortcut: 'Alt + F', category: 'FIBONACCI' },
        { name: 'Trend-based fib extension', icon: <AlignJustify className="w-4 h-4 rotate-90" /> },
        { name: 'Fib channel', icon: <AlignJustify className="w-4 h-4 rotate-90" /> },
        { name: 'Fib time zone', icon: <AlignJustify className="w-4 h-4 rotate-90" /> },
        { name: 'Gann box', icon: <LayoutGrid className="w-4 h-4" />, category: 'GANN' },
        { name: 'Gann square fixed', icon: <LayoutGrid className="w-4 h-4" /> },
        { name: 'Gann square', icon: <LayoutGrid className="w-4 h-4" /> },
        { name: 'Gann fan', icon: <TrendingUp className="w-4 h-4" /> },
      ]
    },
    patterns: {
      icon: <Activity className="w-5 h-5 flex-shrink-0" />,
      label: 'Patterns',
      tools: [
        { name: 'XABCD pattern', icon: <Activity className="w-4 h-4" />, category: 'CHART PATTERNS' },
        { name: 'Cypher pattern', icon: <Activity className="w-4 h-4" /> },
        { name: 'Head and shoulders', icon: <Activity className="w-4 h-4" /> },
        { name: 'ABCD pattern', icon: <Activity className="w-4 h-4" /> },
        { name: 'Elliott impulse wave', icon: <Activity className="w-4 h-4" />, category: 'ELLIOTT WAVES' },
        { name: 'Elliott correction wave', icon: <Activity className="w-4 h-4" /> },
        { name: 'Cyclic lines', icon: <AlignJustify className="w-4 h-4" />, category: 'CYCLES' },
      ]
    },
    prediction: {
      icon: <List className="w-5 h-5 flex-shrink-0" />,
      label: 'Forecasting',
      tools: [
        { name: 'Long position', icon: <div className="w-4 h-2 bg-green-500/50 border border-green-500" />, category: 'FORECASTING' },
        { name: 'Short position', icon: <div className="w-4 h-2 bg-red-500/50 border border-red-500" /> },
        { name: 'Position forecast', icon: <TrendingUp className="w-4 h-4" /> },
        { name: 'Ghost feed', icon: <Activity className="w-4 h-4" /> },
        { name: 'Anchored VWAP', icon: <TrendingUp className="w-4 h-4" />, category: 'VOLUME-BASED' },
        { name: 'Price range', icon: <Ruler className="w-4 h-4" />, category: 'MEASURERS' },
        { name: 'Date range', icon: <Clock className="w-4 h-4" /> },
      ]
    },
    shapes: {
      icon: <Paintbrush className="w-5 h-5 flex-shrink-0" />,
      label: 'Shapes',
      tools: [
        { name: 'Brush', icon: <Paintbrush className="w-4 h-4" />, category: 'BRUSHES' },
        { name: 'Highlighter', icon: <Paintbrush className="w-4 h-4" /> },
        { name: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'Alt + Shift + R', category: 'SHAPES' },
        { name: 'Flat top/bottom', icon: <Square className="w-4 h-[2px] bg-current" /> },
        { name: 'Circle', icon: <Circle className="w-4 h-4" /> },
        { name: 'Ellipse', icon: <Circle className="w-4 h-2 border border-current" /> },
        { name: 'Triangle', icon: <Shapes className="w-4 h-4" /> },
        { name: 'Arrow marker', icon: <ArrowRight className="w-4 h-4" />, category: 'ARROWS' },
        { name: 'Arrow', icon: <ArrowRight className="w-4 h-4" /> },
      ]
    },
    text: {
      icon: <Type className="w-5 h-5 flex-shrink-0" />,
      label: 'Text',
      tools: [
        { name: 'Text', icon: <Type className="w-4 h-4" />, category: 'TEXT AND NOTES' },
        { name: 'Note', icon: <StickyNote className="w-4 h-4" /> },
        { name: 'Price note', icon: <Tag className="w-4 h-4" /> },
        { name: 'Pin', icon: <MapPin className="w-4 h-4" /> },
        { name: 'Table', icon: <Table className="w-4 h-4" /> },
        { name: 'Callout', icon: <MessageSquare className="w-4 h-4" /> },
        { name: 'Comment', icon: <MessageSquare className="w-4 h-4 text-[10px]" /> },
        { name: 'Price label', icon: <Tag className="w-4 h-4" /> },
        { name: 'Signpost', icon: <MapPin className="w-3 h-3 border border-current" /> },
        { name: 'Flag mark', icon: <Flag className="w-4 h-4" /> },
        { name: 'Image', icon: <Image className="w-4 h-4" />, category: 'CONTENT' },
        { name: 'Post', icon: <Send className="w-4 h-4" /> },
        { name: 'Idea', icon: <Lightbulb className="w-4 h-4" /> },
      ]
    }
  };

  const handleToolClick = (categoryId: string) => {
    setActiveMenu(activeMenu === categoryId ? null : categoryId);
  };

  const selectSubTool = (categoryId: string, toolName: string) => {
    setSelectedTools(prev => ({ ...prev, [categoryId]: toolName }));
    setActiveTool(toolName);
    setActiveMenu(null);
  };

  const emojis = ['😀', '😂', '😍', '🚀', '🔥', '💡', '💯', '📈', '📉', '💰', '🎯', '✅', '❌', '⚠️', '⭐', '🌙', '☀️', '🌈', '⚡', '💎'];

  return (
    <aside className="hidden md:flex w-[52px] tv-border-r bg-tv-bg flex-col items-center py-2 gap-0.5 z-20 select-none relative shrink-0">
      {/* Selection Tool */}
      <button 
        onClick={() => setActiveTool(null)}
        className={`w-9 h-9 flex items-center justify-center rounded transition-colors group relative ${!activeTool ? (theme === 'dark' ? 'bg-[#2a2e39] text-tv-accent' : 'bg-gray-200 text-tv-accent') : 'hover:bg-tv-hover text-tv-muted'}`}
      >
        <Crosshair className="w-5 h-5" />
      </button>

      {/* Categorized Tools */}
      {Object.entries(toolCategories).map(([id, category]) => (
        <div key={id} className="relative w-full flex flex-col items-center">
          <button 
            onClick={() => handleToolClick(id)}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors group relative ${activeMenu === id ? 'bg-tv-hover' : 'hover:bg-tv-hover'}`}
          >
            <div className={`transition-colors ${activeMenu === id ? 'text-tv-accent' : 'text-tv-muted group-hover:text-tv-text'}`}>
              {category.icon}
            </div>
            {/* Small arrow to indicate dropdown */}
            <div className="absolute right-0.5 bottom-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-b-[3px] border-b-tv-muted/50" />
          </button>

          {/* Sub-menu Dropdown */}
          {activeMenu === id && (
            <div className="absolute left-full top-0 ml-1 bg-tv-bg border border-tv-border shadow-2xl rounded-md py-1.5 z-[100] min-w-[220px] animate-in fade-in slide-in-from-left-1 duration-150">
              <div className="max-h-[80vh] overflow-y-auto">
                {category.tools.map((tool, idx) => (
                  <Fragment key={tool.name}>
                    {tool.category && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-tv-muted uppercase border-t first:border-t-0 border-tv-border/50">
                        {tool.category}
                      </div>
                    )}
                    <button
                      onClick={() => selectSubTool(id, tool.name)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-tv-hover transition-colors ${selectedTools[id] === tool.name ? 'bg-tv-accent/10 text-tv-accent' : 'text-tv-text'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 flex items-center justify-center text-tv-muted">
                          {tool.icon}
                        </span>
                        <span className={`text-[13px] ${selectedTools[id] === tool.name ? 'font-semibold' : 'font-medium'}`}>
                          {tool.name}
                        </span>
                      </div>
                      {tool.shortcut && (
                        <span className="text-[10px] text-tv-muted/60 font-mono pl-4">{tool.shortcut}</span>
                      )}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Smiley / Emoji */}
      <div className="relative w-full flex flex-col items-center">
        <button 
          onClick={() => handleToolClick('emoji')}
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors group relative ${activeMenu === 'emoji' ? 'bg-tv-hover' : 'hover:bg-tv-hover'}`}
        >
          <Smile className={`w-5 h-5 transition-colors ${activeMenu === 'emoji' ? 'text-tv-accent' : 'text-tv-muted group-hover:text-tv-text'}`} />
        </button>
        
        {activeMenu === 'emoji' && (
          <div className="absolute left-full top-0 ml-1 bg-tv-bg border border-tv-border shadow-2xl rounded-md z-[100] w-[260px] animate-in fade-in slide-in-from-left-1 duration-150">
            <div className="flex items-center gap-1.5 p-2 bg-tv-bg/50 border-b border-tv-border">
              <Smile className="w-4 h-4 text-tv-accent" />
              <div className="w-px h-3 bg-tv-border mx-1" />
              <Activity className="w-4 h-4 text-tv-muted" />
              <Search className="w-4 h-4 text-tv-muted ml-auto" />
            </div>
            <div className="p-2 grid grid-cols-6 gap-1 max-h-[300px] overflow-y-auto">
              {emojis.map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => {
                    setActiveTool(`emoji-${emoji}`);
                    setActiveMenu(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-tv-hover rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex border-t border-tv-border">
              <button className="flex-1 py-1.5 text-[10px] font-bold text-tv-accent border-b-2 border-tv-accent uppercase">Emojis</button>
              <button className="flex-1 py-1.5 text-[10px] font-bold text-tv-muted hover:text-tv-text uppercase">Stickers</button>
              <button className="flex-1 py-1.5 text-[10px] font-bold text-tv-muted hover:text-tv-text uppercase">Icons</button>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-8 h-px bg-tv-border my-1.5" />
      
      {/* Utility Tools Group */}
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <Ruler className="w-5 h-5 text-tv-muted group-hover:text-tv-text" title="Measure" />
      </button>
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <Search className="w-5 h-5 text-tv-muted group-hover:text-tv-text" title="Zoom In" />
      </button>
      
      <div className="w-8 h-px bg-tv-border my-1.5" />
      
      {/* Mode Tools Group */}
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <Magnet className="w-5 h-5 text-tv-muted group-hover:text-tv-text" title="Magnet Mode" />
      </button>
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <div className="relative">
          <Pencil className="w-5 h-5 text-tv-muted group-hover:text-tv-text" />
          <Lock className="w-[10px] h-[10px] absolute -bottom-1 -right-1 text-tv-muted group-hover:text-tv-text bg-tv-bg rounded-full p-[1px]" />
        </div>
      </button>
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <Lock className="w-5 h-5 text-tv-muted group-hover:text-tv-text" title="Lock All Drawing Tools" />
      </button>
      <button className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative">
        <div className="relative">
          <Eye className="w-5 h-5 text-tv-muted group-hover:text-tv-text" />
          <Paintbrush className="w-[10px] h-[10px] absolute -bottom-1 -right-1 text-tv-muted group-hover:text-tv-text bg-tv-bg rounded-full p-[1px]" />
        </div>
      </button>
      
      <div className="flex-1" />
      
      <div className="w-8 h-px bg-tv-border my-1.5" />
      <button 
        onClick={() => clearDrawings(activeSymbol)}
        className="p-2.5 hover:bg-tv-hover rounded transition-colors group relative mb-1"
      >
        <Trash2 className="w-5 h-5 text-tv-muted group-hover:text-tv-text" title="Remove" />
      </button>

      {/* Global overlay to close menus */}
      {activeMenu && (
        <div className="fixed inset-0 z-[90]" onClick={() => setActiveMenu(null)} />
      )}
    </aside>
  );
};

// Watchlist Panel Component
const WatchlistPanel = ({ theme, onClose }: { theme: 'light' | 'dark', onClose: () => void }) => {
  const { availableSymbols, activeSymbol, setSymbol, lastTick } = useMarketStore();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [quotes, setQuotes] = useState<Record<string, { price: number; change: number; pct: number }>>({});

  // Keep track of quotes
  useEffect(() => {
    if (lastTick) {
      setQuotes(prev => {
        const old = prev[lastTick.symbol];
        const oldPrice = old ? old.price : lastTick.price;
        const change = lastTick.price - oldPrice;
        const pct = oldPrice > 0 ? (change / oldPrice) * 100 : 0;
        return {
          ...prev,
          [lastTick.symbol]: {
            price: lastTick.price,
            change: old ? old.change + change : 0,
            pct: old ? old.pct + pct : 0
          }
        };
      });
    }
  }, [lastTick]);

  const categories = [
    { key: 'ALL', label: 'All' },
    { key: 'synthetic_index', label: 'Derived' },
    { key: 'forex', label: 'Forex' },
    { key: 'cryptocurrency', label: 'Crypto' },
    { key: 'commodities', label: 'Commodities' }
  ];

  const displayedSymbols = availableSymbols.filter(s => {
    if (activeTab === 'ALL') return true;
    return s.market === activeTab;
  });

  const activeSymObj = availableSymbols.find(s => s.id === activeSymbol || s.symbol === activeSymbol);
  const activeQuote = quotes[activeSymbol] || (lastTick?.symbol === activeSymbol ? { price: lastTick.price, change: 0, pct: 0 } : null);

  return (
    <div className="w-full flex flex-col h-full bg-tv-bg select-none">
      <div className="h-10 flex items-center justify-between px-3 tv-border-b bg-tv-bg shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[13px] text-tv-text">Deriv Watchlist</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 font-bold uppercase">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-tv-muted hover:text-tv-text cursor-pointer" onClick={onClose} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-2 py-1 gap-1 border-b border-tv-border/40 overflow-x-auto text-[11px]">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveTab(c.key)}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${activeTab === c.key ? 'bg-tv-hover text-tv-accent font-bold' : 'text-tv-muted hover:text-tv-text'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center px-3 py-1.5 text-[10px] font-bold text-tv-muted/70 uppercase">
        <span className="flex-1">Symbol</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-16 text-right">Chg%</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-tv-border/15">
        {displayedSymbols.map(item => {
          const symKey = item.id || item.symbol;
          const isActive = activeSymbol.toLowerCase() === symKey.toLowerCase() || activeSymbol.toLowerCase() === item.symbol.toLowerCase();
          const q = quotes[symKey] || quotes[item.symbol];
          const rawPrice = q ? q.price : (isActive && lastTick ? lastTick.price : null);
          const priceDisplay = rawPrice !== null ? formatSymbolPrice(rawPrice, symKey) : '—';
          const isUp = (q?.change || 0) >= 0;

          return (
            <div 
              key={symKey} 
              onClick={() => setSymbol(symKey)}
              className={`flex items-center px-3 py-2 hover:bg-tv-hover transition-colors cursor-pointer text-xs group ${isActive ? 'bg-tv-accent/10 border-l-2 border-tv-accent' : ''}`}
            >
              <div className="mr-2.5 shrink-0">
                <SymbolLogo symbol={symKey} size="sm" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 pr-2">
                <span className={`truncate ${isActive ? 'font-bold text-tv-accent' : 'font-medium text-tv-text'}`}>{item.display}</span>
                <span className="text-[10px] text-tv-muted font-mono uppercase">{symKey}</span>
              </div>
              <span className="w-20 text-right font-mono font-medium text-tv-text">{priceDisplay}</span>
              <span className={`w-16 text-right font-mono font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {q ? `${isUp ? '+' : ''}${q.pct.toFixed(2)}%` : '0.00%'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Market Info Card */}
      <div className="h-[200px] tv-border-t p-3 bg-tv-bg shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2.5">
            <SymbolLogo symbol={activeSymbol} size="lg" />
            <div>
              <span className="font-bold text-sm text-tv-text block leading-tight">{activeSymObj?.display || activeSymbol}</span>
              <span className="text-[10px] text-tv-muted">{activeSymObj?.marketDisplay || 'Deriv Market'} • Live Feed</span>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 my-2">
          <span className="text-2xl font-bold font-mono text-tv-text">
            {lastTick && lastTick.symbol.toLowerCase() === activeSymbol.toLowerCase() ? formatSymbolPrice(lastTick.price, activeSymbol) : 'Streaming...'}
          </span>
          <span className="text-xs text-tv-muted font-bold font-mono">USD</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Deriv Public Stream Active
          </div>
        </div>

        <div className="text-[11px] text-tv-muted/80 bg-tv-hover/40 p-2 rounded border border-tv-border/30">
          Subscribed to live tick events & real-time candlestick aggregation from Deriv WS.
        </div>
      </div>
    </div>
  );
};

// Pine Editor Panel Component
const PineEditorPanel = ({ onClose }: { onClose: () => void }) => {
  const { applyScript, addScript } = useMarketStore();
  const [code, setCode] = useState(`//@version=5
indicator("My Script", overlay=true)

plot(close)`);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scriptName, setScriptName] = useState("OTIVO 2026 Backtest Engine");
  const [isSaving, setIsSaving] = useState(false);

  const handleApply = () => {
    let name = scriptName;
    const nameMatch = code.match(/(?:indicator|strategy)\s*\(\s*["']([^"']+)["']/);
    if (nameMatch) {
      name = nameMatch[1];
    }
    applyScript({ id: Math.random().toString(36).substr(2, 9), name, code });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save duration
    setTimeout(() => {
      addScript({ id: Math.random().toString(36).substr(2, 9), name: scriptName, code });
      setIsSaving(false);
      setIsSaveModalOpen(false);
    }, 600);
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#1e1e1e] select-none text-[#d4d4d4] relative">
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-2xl w-full max-w-sm p-6 relative"
            >
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="absolute top-4 right-4 text-[#858585] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">Save Script</h2>
              
              <div className="mb-8">
                <label className="block text-xs font-medium text-[#858585] mb-2">Script name</label>
                <input 
                  type="text" 
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-tv-accent transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-white hover:bg-[#2a2d2e] rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-bold bg-white text-black rounded hover:bg-white/90 transition-colors flex items-center gap-2 min-w-[80px] justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-10 flex items-center justify-between px-3 border-b border-[#333333] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[13px]">Pine Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#858585] hover:text-white cursor-pointer" />
          <Maximize2 className="w-4 h-4 text-[#858585] hover:text-white cursor-pointer" />
          <X className="w-4 h-4 text-[#858585] hover:text-white cursor-pointer" onClick={onClose} />
        </div>
      </div>
      
      <div className="flex items-center px-3 py-1 bg-[#1e1e1e] border-b border-[#333333] justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[13px] font-bold cursor-pointer hover:bg-[#2a2d2e] p-1 rounded">
             <TrendingUp className="w-4 h-4 text-[#858585]" />
             {scriptName}
             <ChevronDown className="w-3 h-3 text-[#858585]" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleApply}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold border border-[#3c3c3c] rounded hover:bg-[#2a2d2e]"
          >
             <Code2 className="w-3.5 h-3.5" />
             Add to chart
          </button>
          <button 
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-tv-accent hover:bg-[#2a2d2e] rounded"
          >
             <div className="w-3.5 h-3.5 border border-current rounded-full flex items-center justify-center p-[2px]">
               <ChevronDown className="w-2 h-2 rotate-45" />
             </div>
             Save
          </button>
          <div className="w-px h-6 bg-[#333333] mx-1" />
          <button className="px-3 py-1.5 text-[11px] font-bold hover:bg-[#2a2d2e] rounded">
             Publish script
          </button>
          <button className="p-1.5 hover:bg-[#2a2d2e] rounded">
            <MoreHorizontal className="w-4 h-4 text-[#858585]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex bg-[#1e1e1e]">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={code => highlight(code, pinelanguages, 'javascript')}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            width: '100%',
            outline: 'none',
            overflow: 'auto',
          }}
          textareaClassName="editor-textarea"
          preClassName="editor-pre"
        />
      </div>

      <div className="h-8 border-t border-[#333333] bg-[#1e1e1e] shrink-0 flex items-center px-3 text-[10px] font-bold text-[#858585]">
        <div className="flex items-center gap-3">
          <ChevronDown className="w-3 h-3 text-[#858585] -rotate-90" />
          <div className="w-px h-3 bg-[#333333]" />
          <div className="flex items-center gap-4">
             <span>Line {code.split('\n').length}, Col {code.split('\n').pop()?.length || 0}</span>
             <span>Pine Script® v5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility Sidebar Component
const UtilitySidebar = ({ activePanel, onToggle }: { activePanel: string | null, onToggle: (panel: string) => void }) => {
  const { activePage, setActivePage } = useMarketStore();
  return (
    <aside className="w-10 sm:w-[52px] tv-border-l bg-tv-bg flex flex-col items-center py-1.5 sm:py-2 gap-1 z-30 select-none shrink-0">
      <button 
        onClick={() => setActivePage(activePage === 'chart' ? 'technical-analysis' : 'chart')}
        className={`p-2 sm:p-2.5 rounded transition-colors group relative cursor-pointer ${activePage === 'technical-analysis' ? 'text-tv-accent border-r-2 border-tv-accent ring-1 ring-tv-accent/20' : 'text-tv-muted hover:bg-tv-hover hover:text-tv-text'}`}
        title="Technical Analysis"
      >
        <Gauge className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
      </button>

      <button 
        onClick={() => onToggle('watchlist')}
        className={`p-2 sm:p-2.5 rounded transition-colors group relative cursor-pointer ${activePanel === 'watchlist' ? 'text-tv-accent border-r-2 border-tv-accent ring-1 ring-tv-accent/20' : 'text-tv-muted hover:bg-tv-hover hover:text-tv-text'}`}
        title="Watchlist and details"
      >
        <Bookmark className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
      </button>

      <button 
        onClick={() => onToggle('pine')}
        className={`p-2 sm:p-2.5 rounded transition-colors group relative cursor-pointer ${activePanel === 'pine' ? 'text-tv-accent border-r-2 border-tv-accent ring-1 ring-tv-accent/20' : 'text-tv-muted hover:bg-tv-hover hover:text-tv-text'}`}
        title="Pine Editor"
      >
        <Code2 className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
      </button>
    </aside>
  );
};

// Bottom Bar Component
const BottomBar = () => {
  const ranges = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];
  const [activeRange, setActiveRange] = useState('1Y');

  return (
    <footer className="h-8 sm:h-9 tv-border-t bg-tv-bg flex items-center justify-between px-2 sm:px-3 text-[10px] sm:text-[11px] font-medium text-tv-muted z-30 overflow-hidden">
      <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0">
        {ranges.map(range => (
          <button 
            key={range}
            onClick={() => setActiveRange(range)}
            className={`px-1.5 sm:px-2 h-6 sm:h-7 rounded hover:bg-tv-hover transition-colors font-semibold shrink-0 ${activeRange === range ? 'text-tv-accent bg-blue-50' : ''}`}
          >
            {range}
          </button>
        ))}
        <div className="w-px h-4 bg-tv-border mx-0.5 sm:mx-1 shrink-0" />
        <button className="p-1 sm:p-1.5 hover:bg-tv-hover rounded transition-colors shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-1">
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
          <span className="uppercase">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          <span>(UTC)</span>
        </div>
        <button className="hidden sm:flex p-1 hover:bg-tv-hover rounded transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};

export default function App() {
  const { 
    activeSymbol, activeTimeframe, addTick, setCandles, updateCandle, 
    theme, setAvailableSymbols, activePage, activePanel, setActivePanel 
  } = useMarketStore();
  const socketRef = useRef<any>(null);

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  useEffect(() => {
    // Dismiss OTIVO initial native preloader with a smooth fade-out
    const timer = setTimeout(() => {
      const el = document.getElementById('otivo-preloader-root');
      if (el) {
        el.classList.add('otivo-preloader-exit');
        setTimeout(() => {
          el.remove();
        }, 700);
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Start direct browser Deriv WebSocket connection (works on Netlify, static hosting & full-stack)
    derivClient.start();

    // Ensure instant seed candles on cold start if empty so chart is never blank
    const currentState = useMarketStore.getState();
    if (!currentState.candles || currentState.candles.length === 0) {
      const initialSeed = generateSeedCandles(currentState.activeSymbol, currentState.activeTimeframe, 200);
      setCandles(initialSeed);
    }

    // Try fetching active symbols from backend API if available
    fetch('/api/symbols')
      .then(res => res.json())
      .then(data => {
        if (data.symbols && data.symbols.length > 0) {
          setAvailableSymbols(data.symbols);
        }
      })
      .catch(() => {
        // Backend not present (e.g. Netlify static hosting) - Deriv WS handles symbols directly
      });

    // Optional Socket.io connection for local dev/fullstack container with graceful fallback
    try {
      const socket = io({
        reconnectionAttempts: 3,
        timeout: 3000,
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('Market socket.io connected');
      });

      socket.on('symbols', (symbolsList: any[]) => {
        if (Array.isArray(symbolsList) && symbolsList.length > 0) {
          setAvailableSymbols(symbolsList);
        }
      });

      socket.on('tick', (tick: Tick) => {
        addTick(tick);
      });

      socket.on('history', (data: { symbol: string, timeframe: string, candles: Candle[] }) => {
        const state = useMarketStore.getState();
        if (data.symbol.toLowerCase() === state.activeSymbol.toLowerCase()) {
          if (data.timeframe === state.activeTimeframe) {
            setCandles(data.candles);
          }
          state.setCandlesByTimeframe(data.timeframe, data.candles);
        }
      });

      socket.on('candle_update', (data: { symbol: string, candlesByTimeframe: Record<string, Candle> }) => {
        const state = useMarketStore.getState();
        if (data.symbol.toLowerCase() === state.activeSymbol.toLowerCase()) {
          const candle = data.candlesByTimeframe[state.activeTimeframe];
          if (candle) {
            updateCandle(candle);
          }
          if (data.candlesByTimeframe) {
            Object.entries(data.candlesByTimeframe).forEach(([tf, c]) => {
              if (c) {
                state.updateCandleForTimeframe(tf, c);
              }
            });
          }
        }
      });
    } catch {
      // Ignored for static deployments
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [addTick, setCandles, updateCandle, setAvailableSymbols]);

  // Manage subscriptions & fast fetch across symbol and timeframe switches
  useEffect(() => {
    let isMounted = true;
    
    // 1. Instant fallback seed candles if new timeframe or symbol has no cache yet
    const state = useMarketStore.getState();
    const existing = state.candlesByTimeframe[activeTimeframe];
    if (!existing || existing.length === 0) {
      const seed = generateSeedCandles(activeSymbol, activeTimeframe, 200);
      setCandles(seed);
    }

    // 2. Request deep 5000 candles and subscribe to live ticks & OHLC directly from Deriv Public WS
    derivClient.subscribe(activeSymbol, activeTimeframe);
    derivClient.prefetchMultiTimeframes(activeSymbol);

    // 3. Emit via socket.io if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe', { symbol: activeSymbol, timeframe: activeTimeframe });
    }

    // 4. Try backend API fetch with silent catch if on static hosting (Netlify)
    fetch(`/api/history?symbol=${encodeURIComponent(activeSymbol)}&timeframe=${encodeURIComponent(activeTimeframe)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.status === 'ok' && Array.isArray(data.candles) && data.candles.length > 0) {
          const curState = useMarketStore.getState();
          if (data.symbol.toLowerCase() === curState.activeSymbol.toLowerCase() && data.timeframe === curState.activeTimeframe) {
            setCandles(data.candles);
          }
        }
      })
      .catch(() => {
        // Handled seamlessly by Deriv WebSocket in derivClient
      });

    // 5. Try multi-history fetch with silent catch
    fetch(`/api/multi-history?symbol=${encodeURIComponent(activeSymbol)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.status === 'ok' && data.candlesByTimeframe) {
          useMarketStore.getState().setMultiTimeframeCandles(data.candlesByTimeframe);
        }
      })
      .catch(() => {
        // Handled seamlessly by Deriv WebSocket in derivClient
      });

    return () => {
      isMounted = false;
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('unsubscribe', activeSymbol);
      }
    };
  }, [activeSymbol, activeTimeframe, setCandles]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-tv-bg relative" id="tradingview-clone-root">
      <Header />
      
      {/* Global Modals & Controls */}
      <AlertsModal />
      <TriggeredAlertToast />
      <BarReplayControl />
      <LayoutSelectorModal />
      <SaveLayoutModal />
      <QuickSearchModal />
      <ChartSettingsModal />
      <ScreenshotModal />

      {activePage === 'technical-analysis' ? (
        <TechnicalAnalysisPage />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          <DrawingToolbar />
          
          <main className="flex-1 relative flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 relative min-h-0 flex flex-col h-full overflow-hidden">
               <MultiChartContainer />
            </div>
            <BottomBar />
          </main>

          <AnimatePresence mode="popLayout">
            {activePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: typeof window !== 'undefined' && window.innerWidth < 640 ? 'calc(100vw - 40px)' : (activePanel === 'pine' ? 600 : 420), opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-10 right-10 sm:relative sm:inset-auto tv-border-l bg-tv-bg overflow-hidden flex flex-col shadow-2xl z-40 max-w-[calc(100vw-40px)] sm:max-w-none"
              >
                {activePanel === 'watchlist' && <WatchlistPanel theme={theme as any} onClose={() => setActivePanel(null)} />}
                {activePanel === 'pine' && <PineEditorPanel onClose={() => setActivePanel(null)} />}
              </motion.div>
            )}
          </AnimatePresence>
          
          <UtilitySidebar activePanel={activePanel} onToggle={togglePanel} />
        </div>
      )}
    </div>
  );
}
