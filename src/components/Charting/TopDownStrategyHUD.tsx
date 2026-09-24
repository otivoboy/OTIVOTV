import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Target, 
  ShieldAlert, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Copy, 
  Check, 
  Zap, 
  ChevronRight,
  Info,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { TopDownIndicatorState } from '../../lib/pineEngine';
import { formatSymbolPrice } from '../../lib/priceFormatter';
import { useMarketStore } from '../../store/useMarketStore';

interface TopDownStrategyHUDProps {
  indicatorId: string;
  state: TopDownIndicatorState | null | undefined;
  symbol: string;
  onOpenSettings: (indicatorId: string) => void;
}

export const TopDownStrategyHUD: React.FC<TopDownStrategyHUDProps> = ({
  indicatorId,
  state,
  symbol,
  onOpenSettings
}) => {
  const isDark = useMarketStore(s => s.theme === 'dark');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedPine, setCopiedPine] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'levels'>('overview');

  if (!state) return null;

  const isBull = state.dailyTrend === 'BULLISH';
  const isBear = state.dailyTrend === 'BEARISH';
  const setup = state.setup;

  const formatPrice = (p: number | null | undefined) => {
    if (p === null || p === undefined || isNaN(p)) return '---';
    return formatSymbolPrice(symbol, p);
  };

  const copyPineScript = () => {
    const pineCode = `//@version=5
indicator("Top-Down MTF Demand + Structure Confirmation", shorttitle="MTF Demand Conf", overlay=true, max_boxes_count=500, max_lines_count=500, max_labels_count=500)

// 1. Non-Repainting Multi-Timeframe Data
[d_open, d_high, d_low, d_close] = request.security(syminfo.tickerid, "D", [open[1], high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)
d_atr = request.security(syminfo.tickerid, "D", ta.atr(14)[1], lookahead=barmerge.lookahead_off)
d_ema20 = request.security(syminfo.tickerid, "D", ta.ema(close, 20)[1], lookahead=barmerge.lookahead_off)
d_ema50 = request.security(syminfo.tickerid, "D", ta.ema(close, 50)[1], lookahead=barmerge.lookahead_off)

[h4_open, h4_high, h4_low, h4_close] = request.security(syminfo.tickerid, "240", [open[1], high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)
h4_atr = request.security(syminfo.tickerid, "240", ta.atr(14)[1], lookahead=barmerge.lookahead_off)

[h1_open, h1_high, h1_low, h1_close] = request.security(syminfo.tickerid, "60", [open[1], high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)
[m30_open, m30_high, m30_low, m30_close] = request.security(syminfo.tickerid, "30", [open[1], high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)

[m15_high, m15_low, m15_close] = request.security(syminfo.tickerid, "15", [high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)
[m5_high, m5_low, m5_close] = request.security(syminfo.tickerid, "5", [high[1], low[1], close[1]], lookahead=barmerge.lookahead_off)

// 2. Daily Trend Bias
daily_bull = d_close > d_ema50 and d_ema20 >= d_ema50
daily_bear = d_close < d_ema50 and d_ema20 <= d_ema50

// 3. 4H Major Zone
var float z4_top = na
var float z4_bot = na
var string z4_type = "NONE"

h4_disp_bull = (h4_close - h4_open) >= h4_atr * 1.25 and h4_close > h4_high[1]
h4_disp_bear = (h4_open - h4_close) >= h4_atr * 1.25 and h4_close < h4_low[1]

if daily_bull and h4_disp_bull
    z4_bot := h4_low[1]
    z4_top := math.max(h4_open[1], h4_close[1])
    z4_type := "DEMAND"

if daily_bear and h4_disp_bear
    z4_top := h4_high[1]
    z4_bot := math.min(h4_open[1], h4_close[1])
    z4_type := "SUPPLY"

// 4. 1H & 30M Refinement
var float z_act_top = na
var float z_act_bot = na
z_act_top := z4_top
z_act_bot := z4_bot

if not na(z4_top)
    if z4_type == "DEMAND" and h1_low >= z4_bot and h1_low <= z4_top
        z_act_bot := math.max(z4_bot, h1_low)
        z_act_top := math.min(z4_top, math.max(h1_open, h1_close))

if not na(z_act_top)
    if z4_type == "DEMAND" and m30_low >= z_act_bot and m30_low <= z_act_top
        z_act_bot := math.max(z_act_bot, m30_low)
        z_act_top := math.min(z_act_top, math.max(m30_open, m30_close))

// 5. State Machine: Price Retest -> 15M CHoCH -> 5M BOS -> 5M Demand Entry
var int state = 0
var float entry_p = na
var float sl_p = na
var float tp_p = na

price_in_zone = not na(z_act_top) and low <= z_act_top and high >= z_act_bot

if not na(z4_top) and state == 0
    state := 1 // Zone Established

if state == 1 and price_in_zone
    state := 2 // Price Entered Zone -> Waiting 15M

m15_choch = state == 2 and (z4_type == "DEMAND" ? m15_close > ta.highest(m15_high[1], 4) : m15_close < ta.lowest(m15_low[1], 4))
if m15_choch
    state := 3 // 15M CHoCH Confirmed -> Waiting 5M

m5_bos = state == 3 and (z4_type == "DEMAND" ? m5_close > ta.highest(m5_high[1], 3) : m5_close < ta.lowest(m5_low[1], 3))

if state == 3 and m5_bos and na(entry_p)
    state := 4 // Setup Active!
    entry_p := close
    origin_low = ta.lowest(low, 3)
    sl_p := origin_low - ta.atr(14) * 0.15
    trend_high = ta.highest(high, 60)
    tp_p := trend_high

if state == 4 and (high >= tp_p or low <= sl_p)
    state := 0
    entry_p := na

// 6. Plots & Alerts
plot(state == 4 ? entry_p : na, "Entry", color=color.blue, linewidth=2, style=plot.style_linebr)
plot(state == 4 ? sl_p : na, "Stop Loss", color=color.red, linewidth=2, style=plot.style_linebr)
plot(state == 4 ? tp_p : na, "Take Profit", color=color.green, linewidth=2, style=plot.style_linebr)

plotshape(state == 4 and na(state[1]), "BUY Setup", shape.labelup, location.belowbar, color=#22c55e, text="BUY SETUP", textcolor=color.white, size=size.normal)

alertcondition(state == 4 and na(state[1]), "BUY Setup Triggered", "MTF Top-Down Demand Buy Setup triggered!")
alertcondition(price_in_zone, "Price Entered Zone", "Price entered demand zone! Waiting for confirmation.")
alertcondition(state == 4 and high >= tp_p, "Take Profit Hit", "Setup target reached!")
alertcondition(state == 4 and low <= sl_p, "Stop Loss Hit", "Setup stop loss hit.")`;

    navigator.clipboard.writeText(pineCode);
    setCopiedPine(true);
    setTimeout(() => setCopiedPine(false), 2500);
  };

  const steps = [
    { num: 1, title: 'Daily Trend Bias', status: state.currentStep >= 1 ? 'done' : 'waiting', desc: state.dailyReason },
    { num: 2, title: '4H Major Zone', status: state.currentStep >= 2 ? 'done' : 'waiting', desc: state.fourHZone ? `4H ${state.fourHZone.type} [${formatPrice(state.fourHZone.bottom)} – ${formatPrice(state.fourHZone.top)}]` : 'Scanning 4H displacement' },
    { num: 3, title: '1H/30M Refinement', status: state.currentStep >= 3 ? 'done' : 'waiting', desc: state.activeTargetZone ? `Refined in ${state.activeTargetZone.timeframe} [${formatPrice(state.activeTargetZone.bottom)} – ${formatPrice(state.activeTargetZone.top)}]` : 'Refining boundaries' },
    { num: 4, title: 'Pullback to Zone', status: state.currentStep >= 4 ? 'done' : 'waiting', desc: state.currentStep >= 4 ? 'Price entered zone! No early entry' : 'Waiting for price return' },
    { num: 5, title: '15M Structure Change', status: state.currentStep >= 5 ? 'done' : 'waiting', desc: state.fifteenMChoch?.confirmed ? `15M CHoCH confirmed at ${formatPrice(state.fifteenMChoch.price)}` : 'Watching 15M CHoCH' },
    { num: 6, title: '5M Sweep & BOS', status: state.currentStep >= 6 ? 'done' : 'waiting', desc: state.fiveMBos?.confirmed ? '5M Liquidity Sweep + BOS confirmed' : 'Waiting for 5M displacement' },
    { num: 7, title: '5M Demand Execution', status: state.currentStep >= 7 ? 'active' : 'waiting', desc: setup ? `${setup.type} setup active (1:${setup.rr} R:R)` : '5M entry execution pending' }
  ];

  // Collapsed View (Minimalist Smart Chip on Chart)
  if (isCollapsed) {
    return (
      <div className="absolute top-14 right-3 z-20 pointer-events-auto select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border backdrop-blur-md transition-all cursor-pointer ${
            isDark 
              ? 'bg-[#131722]/90 border-slate-700/80 hover:bg-[#1e222d] text-slate-200' 
              : 'bg-white/95 border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
          title="Click to expand Top-Down MTF Confirmation Dashboard"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${setup ? 'bg-emerald-500 animate-pulse' : (isBull ? 'bg-emerald-400' : 'bg-rose-400')}`} />
          <span className="text-[11px] font-bold tracking-tight">MTF Strategy</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isBull ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            1D {state.dailyTrend}
          </span>
          <span className="text-[11px] font-mono font-medium text-sky-400">
            {state.stateTitle.split('.')[0]} ({state.currentStep}/{state.totalSteps})
          </span>
          {setup && (
            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
              {setup.type} 1:{setup.rr}
            </span>
          )}
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      </div>
    );
  }

  // Expanded View
  return (
    <div className="absolute top-14 right-3 z-20 w-[330px] sm:w-[360px] pointer-events-auto select-none">
      <div className={`rounded-xl shadow-2xl border backdrop-blur-xl transition-all overflow-hidden flex flex-col ${
        isDark 
          ? 'bg-[#111622]/95 border-slate-700/70 text-slate-200' 
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`px-3 py-2.5 flex items-center justify-between border-b ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${
              isBull ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isBull ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-[12px] font-bold tracking-tight">Top-Down MTF Confirmation</h4>
                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono font-semibold border border-sky-500/30">
                  D→4H→1H→30M→15M→5M
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {state.stateTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenSettings(indicatorId)}
              className="p-1 hover:bg-slate-700/40 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Indicator Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={copyPineScript}
              className="p-1 hover:bg-slate-700/40 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Copy TradingView Pine Script v5 Code"
            >
              {copiedPine ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 hover:bg-slate-700/40 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Minimize HUD"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`grid grid-cols-3 text-[11px] font-semibold border-b ${
          isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? (isDark ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-blue-600 border-b-2 border-blue-600 font-bold')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeTab === 'steps'
                ? (isDark ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-blue-600 border-b-2 border-blue-600 font-bold')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflow Steps
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeTab === 'levels'
                ? (isDark ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-blue-600 border-b-2 border-blue-600 font-bold')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Key Levels
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
          {activeTab === 'overview' && (
            <>
              {/* Daily Trend Status Box */}
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isBull 
                  ? (isDark ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
                  : (isDark ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900')
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                    isBull ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    1D
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold">Daily Bias: {state.dailyTrend}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {isBull ? '↑ UPTREND' : '↓ DOWNTREND'}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-90 block">
                      {isBull ? 'Strict Demand entries only (No counter-trend)' : 'Strict Supply entries only'}
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              </div>

              {/* Timeframe Zone Alignment Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* 4H Major Zone */}
                <div className={`p-2 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>4H Major Zone</span>
                    <span className="px-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {state.fourHZone?.type || 'DEMAND'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono font-bold text-slate-200">
                    {state.fourHZone ? `${formatPrice(state.fourHZone.bottom)} – ${formatPrice(state.fourHZone.top)}` : 'Scanning...'}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    {state.fourHZone?.isMitigated ? 'Mitigated' : 'Fresh & Unmitigated'}
                  </div>
                </div>

                {/* Sniper Refined Zone */}
                <div className={`p-2 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>Refined Zone</span>
                    <span className="px-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {state.activeTargetZone?.timeframe || '1H/30M'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono font-bold text-sky-400">
                    {state.activeTargetZone ? `${formatPrice(state.activeTargetZone.bottom)} – ${formatPrice(state.activeTargetZone.top)}` : 'Refining...'}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    Tighter Sniper Boundary
                  </div>
                </div>
              </div>

              {/* Active Setup Card (When Triggered) */}
              {setup ? (
                <div className={`p-2.5 rounded-xl border-2 ${
                  setup.status === 'TP_HIT'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : setup.status === 'SL_HIT'
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-blue-500 bg-blue-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded text-white ${
                        setup.type === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {setup.type} SETUP
                      </span>
                      <span className="text-[11px] font-bold text-sky-400">
                        R:R 1 : {setup.rr}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      setup.status === 'TP_HIT' ? 'bg-emerald-500 text-white' : (setup.status === 'SL_HIT' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white')
                    }`}>
                      {setup.status === 'TP_HIT' ? 'TARGET HIT' : (setup.status === 'SL_HIT' ? 'SL HIT' : 'ACTIVE')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-700/50 text-center font-mono">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase">Entry</span>
                      <span className="text-[12px] font-bold text-blue-400">{formatPrice(setup.entryPrice)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase">Stop Loss</span>
                      <span className="text-[12px] font-bold text-rose-400">{formatPrice(setup.slPrice)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase">Take Profit</span>
                      <span className="text-[12px] font-bold text-emerald-400">{formatPrice(setup.tpPrice)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-0.5">
                    <span>SL: {setup.slMode}</span>
                    <span>TP: {setup.tpMode}</span>
                  </div>
                </div>
              ) : (
                <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-200">
                      Step {state.currentStep} of {state.totalSteps}: {state.stateTitle.replace(/^\d+\.\s*/, '')}
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      {state.stateDesc}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'steps' && (
            <div className="flex flex-col gap-2">
              {steps.map(step => (
                <div 
                  key={step.num}
                  className={`p-2 rounded-lg border flex items-start gap-2.5 transition-all ${
                    step.num === state.currentStep
                      ? 'border-sky-500/60 bg-sky-500/10'
                      : step.num < state.currentStep
                      ? (isDark ? 'border-slate-800 bg-slate-900/30 opacity-70' : 'border-slate-200 bg-slate-50 opacity-70')
                      : (isDark ? 'border-slate-850 bg-slate-900/10 opacity-40' : 'border-slate-150 opacity-40')
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    step.num < state.currentStep
                      ? 'bg-emerald-500 text-white'
                      : step.num === state.currentStep
                      ? 'bg-sky-500 text-white animate-pulse'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {step.num < state.currentStep ? <Check className="w-3 h-3" /> : step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-200">{step.title}</span>
                      <span className={`text-[9.5px] font-semibold ${
                        step.num < state.currentStep ? 'text-emerald-400' : (step.num === state.currentStep ? 'text-sky-400 font-bold' : 'text-slate-500')
                      }`}>
                        {step.num < state.currentStep ? 'Completed' : (step.num === state.currentStep ? 'In Progress' : 'Pending')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'levels' && (
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400">Daily Swing High</span>
                <span className="font-bold text-emerald-400">{formatPrice(state.dailySwingHigh)}</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400">Daily Swing Low</span>
                <span className="font-bold text-rose-400">{formatPrice(state.dailySwingLow)}</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400">4H Demand Bounds</span>
                <span className="font-bold text-teal-400">
                  {state.fourHZone ? `${formatPrice(state.fourHZone.bottom)} - ${formatPrice(state.fourHZone.top)}` : '---'}
                </span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400">15M CHoCH Break Level</span>
                <span className="font-bold text-sky-400">
                  {state.fifteenMChoch?.confirmed ? formatPrice(state.fifteenMChoch.price) : 'Monitoring...'}
                </span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400">5M Origin Demand Zone</span>
                <span className="font-bold text-lime-400">
                  {state.fiveMZone ? `${formatPrice(state.fiveMZone.bottom)} - ${formatPrice(state.fiveMZone.top)}` : 'Pending...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Controls */}
        <div className={`px-3 py-2 border-t flex items-center justify-between text-[10.5px] ${
          isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'
        }`}>
          <button
            onClick={() => onOpenSettings(indicatorId)}
            className="hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Customize Rules</span>
          </button>
          <button
            onClick={copyPineScript}
            className="hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer font-mono font-medium"
          >
            {copiedPine ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedPine ? 'Pine Code Copied!' : 'Export Pine v5'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
