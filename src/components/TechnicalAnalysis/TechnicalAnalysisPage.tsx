import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Info,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Radio,
  Clock,
  Compass
} from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { Candle } from '../../types';
import { 
  computeTechnicalAnalysis, 
  computeTimeframeSummaryRating,
  SignalRating, 
  TF_LABEL_TO_KEY, 
  TF_SECONDS, 
  aggregateCandlesClient 
} from '../../lib/technicalCalculations';
import { SpeedometerGauge } from './SpeedometerGauge';
import { QuotesTable } from './QuotesTable';
import { EconomicCalendar } from './EconomicCalendar';
import { formatSymbolPrice } from '../../lib/priceFormatter';
import { derivClient } from '../../lib/derivClient';

interface TimeframeTabConfig {
  id: string;
  label: string;
  isLocked?: boolean;
}

const TIMEFRAME_TABS: TimeframeTabConfig[] = [
  { id: '1 Min', label: '1 Min', isLocked: false },
  { id: '5 Min', label: '5 Min', isLocked: false },
  { id: '15 Min', label: '15 Min', isLocked: false },
  { id: '30 Min', label: '30 Min', isLocked: false },
  { id: 'Hourly', label: 'Hourly', isLocked: false },
  { id: '5 Hours', label: '5 Hours', isLocked: false },
  { id: 'Daily', label: 'Daily', isLocked: false },
  { id: 'Weekly', label: 'Weekly', isLocked: false },
  { id: 'Monthly', label: 'Monthly', isLocked: false },
];

export const TechnicalAnalysisPage: React.FC = () => {
  const activeSymbol = useMarketStore(s => s.activeSymbol);
  const availableSymbols = useMarketStore(s => s.availableSymbols);
  const candles = useMarketStore(s => s.candles);
  const candlesByTimeframe = useMarketStore(s => s.candlesByTimeframe);
  const theme = useMarketStore(s => s.theme);
  const setActivePage = useMarketStore(s => s.setActivePage);
  const setCandlesByTimeframe = useMarketStore(s => s.setCandlesByTimeframe);
  const lastTick = useMarketStore(s => s.lastTick);
  const selectedTf = useMarketStore(s => s.taTimeframe || '5 Hours');
  const setSelectedTf = useMarketStore(s => s.setTaTimeframe);
  const pivotMode = useMarketStore(s => s.pivotMode || 'classic');
  const setPivotMode = useMarketStore(s => s.setPivotMode);

  const isDark = theme === 'dark';

  // Find active symbol metadata
  const currentSymbolObj = availableSymbols.find(
    s => s.id === activeSymbol || s.symbol === activeSymbol
  );
  const symbolDisplay = currentSymbolObj?.display || activeSymbol;
  
  // Real-time price tracking
  const currentPrice = (lastTick && lastTick.symbol.toLowerCase() === activeSymbol.toLowerCase())
    ? lastTick.price
    : (candles[candles.length - 1]?.close || 0);

  // Throttled price for calculating indicators without jank
  const [calcPrice, setCalcPrice] = useState<number>(currentPrice);
  const lastCalcPriceRef = useRef<number>(currentPrice);

  useEffect(() => {
    if (currentPrice <= 0) return;
    const timer = setTimeout(() => {
      if (currentPrice !== lastCalcPriceRef.current) {
        lastCalcPriceRef.current = currentPrice;
        setCalcPrice(currentPrice);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [currentPrice]);

  // Timeframe tabs state
  const [showIndicatorDetails, setShowIndicatorDetails] = useState<boolean>(false);

  // When timeframe is changed, if candles for that timeframe aren't loaded yet, request via Deriv WS and API
  useEffect(() => {
    const tfKey = TF_LABEL_TO_KEY[selectedTf] || '1h';
    const existing = useMarketStore.getState().candlesByTimeframe[tfKey];
    
    if (!existing || existing.length === 0) {
      derivClient.subscribe(activeSymbol, tfKey);
      fetch(`/api/history?symbol=${encodeURIComponent(activeSymbol)}&timeframe=${encodeURIComponent(tfKey)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok' && Array.isArray(data.candles) && data.candles.length > 0) {
            setCandlesByTimeframe(tfKey, data.candles.slice(-250));
          }
        })
        .catch(() => {
          // Handled seamlessly by Deriv WebSocket in derivClient
        });
    }
  }, [selectedTf, activeSymbol, setCandlesByTimeframe]);

  // Memoized helper to get candles for any timeframe with local lookup cache
  const getCandlesForTimeframe = useMemo(() => {
    const cache: Record<string, Candle[]> = {};

    return (tfLabel: string): Candle[] => {
      if (cache[tfLabel]) return cache[tfLabel];

      const tfKey = TF_LABEL_TO_KEY[tfLabel] || '1h';
      const directCandles = candlesByTimeframe[tfKey];
      if (directCandles && directCandles.length > 0) {
        cache[tfLabel] = directCandles;
        return directCandles;
      }

      // Try fallback synthesis from 1m, 1h, or active chart candles
      const m1 = candlesByTimeframe['1m'];
      const targetSeconds = TF_SECONDS[tfKey] || 3600;
      
      if (m1 && m1.length >= 20) {
        const agg = aggregateCandlesClient(m1.slice(-250), targetSeconds);
        cache[tfLabel] = agg;
        return agg;
      }
      
      const h1 = candlesByTimeframe['1h'];
      if (h1 && h1.length >= 5 && targetSeconds >= 3600) {
        const agg = aggregateCandlesClient(h1.slice(-250), targetSeconds);
        cache[tfLabel] = agg;
        return agg;
      }

      // Fall back to active chart candles
      if (candles && candles.length > 0) {
        const recent = candles.length > 250 ? candles.slice(-250) : candles;
        cache[tfLabel] = recent;
        return recent;
      }

      return [];
    };
  }, [candlesByTimeframe, candles]);

  // Calculate live technical analysis for the currently selected timeframe
  const analysis = useMemo(() => {
    const activeCandles = getCandlesForTimeframe(selectedTf);
    return computeTechnicalAnalysis(activeCandles, calcPrice || currentPrice, selectedTf);
  }, [selectedTf, getCandlesForTimeframe, calcPrice, currentPrice]);

  // Dynamically calculate live summary ratings for ALL timeframe tabs using fast summary computation
  const timeframeRatings = useMemo(() => {
    const ratingsMap: Record<string, SignalRating> = {};
    const priceToUse = calcPrice || currentPrice;
    
    TIMEFRAME_TABS.forEach(tab => {
      if (tab.id === selectedTf) {
        ratingsMap[tab.id] = analysis.summary.rating;
        return;
      }
      const tfCandles = getCandlesForTimeframe(tab.id);
      if (tfCandles.length > 0) {
        ratingsMap[tab.id] = computeTimeframeSummaryRating(tfCandles, priceToUse);
      } else {
        ratingsMap[tab.id] = 'Neutral';
      }
    });

    return ratingsMap;
  }, [selectedTf, analysis.summary.rating, getCandlesForTimeframe, calcPrice, currentPrice]);

  // Price change calculation (compare current price with first candle of current session/timeframe)
  const activeCandles = getCandlesForTimeframe(selectedTf);
  const openPrice = activeCandles.length > 0 ? activeCandles[0].open : currentPrice;
  const priceChange = currentPrice - openPrice;
  const priceChangePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const getRatingBadgeClass = (rating: SignalRating) => {
    switch (rating) {
      case 'Strong Buy':
        return 'text-[#00b061] font-bold';
      case 'Buy':
        return 'text-[#26a69a] font-semibold';
      case 'Neutral':
        return 'text-[#787b86] font-medium';
      case 'Sell':
        return 'text-[#ef5350] font-semibold';
      case 'Strong Sell':
        return 'text-[#c62828] font-bold';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-tv-bg text-tv-text select-none">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <div className="p-4 md:p-6 max-w-[1240px] w-full mx-auto space-y-6">
          
          {/* Header Title with Live Market Price Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-tv-border/40">
            <div className="flex flex-col gap-1">
              <div 
                className="flex items-center gap-1.5 cursor-pointer group" 
                onClick={() => setActivePage('chart')}
                title="Return to Interactive Chart"
              >
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-tv-text flex items-center gap-1 group-hover:text-tv-accent transition-colors">
                  <span>Technical Analysis</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-tv-muted group-hover:translate-x-0.5 transition-transform" />
                </h1>
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded font-mono bg-tv-hover text-tv-muted ml-1">
                  {currentSymbolObj?.symbol || activeSymbol}
                </span>
              </div>
              <p className="text-xs text-tv-muted line-clamp-1 sm:line-clamp-none">
                Real-time technical indicators, moving averages, and pivot summaries for {symbolDisplay}
              </p>
            </div>

            {/* Live Price & Live Status Pill */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="flex flex-col items-start sm:items-end">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#00b061] bg-[#00b061]/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00b061] animate-pulse"></span>
                    <span>Live Stream</span>
                  </span>
                  <span className="font-mono text-base md:text-lg font-bold tracking-tight text-tv-text">
                    {formatSymbolPrice(currentPrice, activeSymbol)}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold ${isPositive ? 'text-[#00b061]' : 'text-[#ef5350]'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isPositive ? '+' : ''}{priceChange.toFixed(activeSymbol.includes('frx') && !activeSymbol.includes('JPY') ? 4 : 2)}</span>
                  <span>({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
                </div>
              </div>

              {/* Back to Live Chart Button */}
              <button
                onClick={() => setActivePage('chart')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-tv-accent text-white hover:brightness-110 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>Live Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Timeframe Selector Bar with LIVE DYNAMIC RATINGS for each tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            {TIMEFRAME_TABS.map((tf) => {
              const isSelected = selectedTf === tf.id;
              const liveRating = timeframeRatings[tf.id] || 'Neutral';
              
              return (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTf(tf.id)}
                  className={`flex flex-col items-center justify-center min-w-[80px] px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? (isDark 
                          ? 'border-tv-accent bg-tv-accent/15 text-tv-text font-bold shadow-sm ring-1 ring-tv-accent/40' 
                          : 'border-blue-500 bg-blue-50/80 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/30')
                      : (isDark
                          ? 'border-transparent bg-[#1e222d]/50 text-tv-muted hover:bg-[#1e222d] hover:text-tv-text'
                          : 'border-gray-200/70 bg-white text-gray-700 hover:bg-gray-50 shadow-2xs')
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11.5px] font-semibold">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span>{tf.label}</span>
                  </div>
                  <div className="text-[10px] mt-1">
                    <span className={getRatingBadgeClass(liveRating)}>
                      {liveRating}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Speedometer Gauges Row (Computed in real time from selected timeframe & live chart data) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {/* 1. Technical Indicators Gauge */}
            <SpeedometerGauge
              title="Technical Indicators"
              rating={analysis.indicators.rating}
              buy={analysis.indicators.buy}
              neutral={analysis.indicators.neutral}
              sell={analysis.indicators.sell}
              scorePercent={analysis.indicators.scorePercent}
              isSummary={false}
              theme={theme as any}
            />

            {/* 2. Summary Gauge (Center, Featured with High Contrast) */}
            <SpeedometerGauge
              title={`Summary (${selectedTf})`}
              rating={analysis.summary.rating}
              buy={analysis.summary.buy}
              neutral={analysis.summary.neutral}
              sell={analysis.summary.sell}
              scorePercent={analysis.summary.scorePercent}
              isSummary={true}
              theme={theme as any}
            />

            {/* 3. Moving Averages Gauge */}
            <SpeedometerGauge
              title="Moving Averages"
              rating={analysis.movingAverages.rating}
              buy={analysis.movingAverages.buy}
              neutral={analysis.movingAverages.neutral}
              sell={analysis.movingAverages.sell}
              scorePercent={analysis.movingAverages.scorePercent}
              isSummary={false}
              theme={theme as any}
            />
          </div>

          {/* Toggle for Technical Indicators, Moving Averages & Pivot Points Deep Breakdown */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowIndicatorDetails(!showIndicatorDetails)}
              className={`flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full border transition-all cursor-pointer ${
                isDark 
                  ? 'border-[#2a2e39] bg-[#1e222d] text-tv-text hover:bg-[#2a2e39] shadow-sm' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-tv-accent" />
              <span>{showIndicatorDetails ? 'Hide Indicator Breakdown' : `Show Indicator & Moving Averages Breakdown (${selectedTf})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-tv-muted transition-transform duration-200 ${showIndicatorDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Deep Breakdown Tables */}
          {showIndicatorDetails && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Oscillators Table */}
                <div className={`p-4 rounded-xl transition-all ${
                  isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-tv-border/30">
                    <h3 className="text-sm font-bold text-tv-text flex items-center gap-1.5">
                      <span>Oscillators & Indicators</span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#00b061] font-semibold">{analysis.indicators.buy} Buy</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 font-semibold">{analysis.indicators.neutral} Neutral</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-[#ef5350] font-semibold">{analysis.indicators.sell} Sell</span>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                    {analysis.indicators.rows.map((row) => (
                      <div key={row.name} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-tv-hover/50 rounded-lg transition-colors">
                        <span className="text-tv-muted font-medium">{row.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-tv-text">{row.value}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold min-w-[50px] text-center ${
                            row.action === 'Buy' ? 'bg-[#00b061]/15 text-[#00b061]' :
                            row.action === 'Sell' ? 'bg-[#ef5350]/15 text-[#ef5350]' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {row.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moving Averages Table */}
                <div className={`p-4 rounded-xl transition-all ${
                  isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-tv-border/30">
                    <h3 className="text-sm font-bold text-tv-text flex items-center gap-1.5">
                      <span>Moving Averages</span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#00b061] font-semibold">{analysis.movingAverages.buy} Buy</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 font-semibold">{analysis.movingAverages.neutral} Neutral</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-[#ef5350] font-semibold">{analysis.movingAverages.sell} Sell</span>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                    {analysis.movingAverages.rows.map((row) => (
                      <div key={row.name} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-tv-hover/50 rounded-lg transition-colors">
                        <span className="text-tv-muted font-medium">{row.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-tv-text">{formatSymbolPrice(row.value, activeSymbol)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold min-w-[50px] text-center ${
                            row.action === 'Buy' ? 'bg-[#00b061]/15 text-[#00b061]' :
                            row.action === 'Sell' ? 'bg-[#ef5350]/15 text-[#ef5350]' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {row.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pivot Points Table */}
              <div className={`p-4 rounded-xl transition-all ${
                isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
              }`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-tv-border/30">
                  <h3 className="text-sm font-bold text-tv-text flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-tv-accent" />
                    <span>Pivot Points ({selectedTf})</span>
                  </h3>
                  <div className="flex items-center gap-1 bg-tv-hover/60 p-0.5 rounded-lg text-[11px]">
                    {(['classic', 'fibonacci', 'camarilla'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPivotMode(mode)}
                        className={`px-2.5 py-1 rounded font-semibold capitalize transition-all cursor-pointer ${
                          pivotMode === mode 
                            ? 'bg-tv-accent text-white shadow-xs' 
                            : 'text-tv-muted hover:text-tv-text'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                  {(() => {
                    const pData = analysis.pivots[pivotMode];
                    const pts = [
                      { label: 'S3', val: pData.s3, color: 'text-red-500' },
                      { label: 'S2', val: pData.s2, color: 'text-red-400' },
                      { label: 'S1', val: pData.s1, color: 'text-orange-400' },
                      { label: 'Pivot', val: pData.pivot, color: 'text-tv-accent font-bold' },
                      { label: 'R1', val: pData.r1, color: 'text-emerald-400' },
                      { label: 'R2', val: pData.r2, color: 'text-green-500' },
                      { label: 'R3', val: pData.r3, color: 'text-green-600' },
                    ];

                    return pts.map(p => (
                      <div key={p.label} className="p-2 rounded-lg bg-tv-hover/30 flex flex-col items-center">
                        <span className="text-[11px] font-semibold text-tv-muted mb-0.5">{p.label}</span>
                        <span className={`font-mono text-xs ${p.color}`}>
                          {formatSymbolPrice(p.val, activeSymbol)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Quotes Table (matching video reference with live exchange quote updates) */}
          <QuotesTable
            symbolDisplay={symbolDisplay}
            symbolId={currentSymbolObj?.symbol || activeSymbol}
            currentPrice={currentPrice}
            theme={theme as any}
          />

          {/* Economic Calendar */}
          <EconomicCalendar theme={theme as any} />

        </div>
      </div>
    </div>
  );
};
