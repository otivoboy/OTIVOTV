import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Eye, 
  Compass, 
  RotateCcw, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Zap, 
  Layers, 
  Activity,
  Code,
  ChevronDown,
  Clock,
  Target,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { BUILTIN_INDICATORS, IndicatorPreset, IndicatorParamDef } from '../../lib/indicatorsList';
import { IndicatorItem, useMarketStore } from '../../store/useMarketStore';

interface IndicatorSettingsModalProps {
  indicator: IndicatorItem;
  onClose: () => void;
}

export const IndicatorSettingsModal: React.FC<IndicatorSettingsModalProps> = ({ indicator, onClose }) => {
  const isDark = useMarketStore(s => s.theme === 'dark');
  const updateIndicator = useMarketStore(s => s.updateIndicator);

  // Find preset definition
  const preset: IndicatorPreset | undefined = BUILTIN_INDICATORS.find(
    p => p.id === indicator.id || p.name.toLowerCase() === indicator.name.toLowerCase()
  );

  // Initial params merged with defaults
  const [params, setParams] = useState<Record<string, any>>(() => {
    return {
      ...(preset?.defaultParams || {}),
      ...(indicator.params || {})
    };
  });

  const [activeTab, setActiveTab] = useState<'inputs' | 'style' | 'direction' | 'code' | 'visibility'>('inputs');
  const [customCode, setCustomCode] = useState(indicator.code || preset?.code || '');
  const [showDefaultsMenu, setShowDefaultsMenu] = useState(false);

  const idLower = (indicator.id + ' ' + indicator.name).toLowerCase();
  const isSessions = idLower.includes('session');
  const isFootprint = idLower.includes('footprint');
  const isDelta = idLower.includes('delta');
  const isLiquiditySweep = idLower.includes('liquidity_sweep') || idLower.includes('liquidity sweep');
  const isLiquiditySwings = idLower.includes('liquidity_swings') || idLower.includes('liquidity swings');
  const isTopDown = idLower.includes('top_down') || idLower.includes('demand_confirmation') || idLower.includes('mtf demand') || idLower.includes('top-down');

  const paramDefs: IndicatorParamDef[] = preset?.paramDefinitions || [
    { key: 'length', name: 'Length', type: 'int', default: 14, min: 1, max: 200, category: 'Calculations' }
  ];

  const handleParamChange = (key: string, val: any) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    if (isSessions) {
      setParams({
        high_low_view: false,
        resolution: '1 day',
        london_active: true,
        london_start: '03:00',
        london_end: '12:00',
        london_color: '#26a69a',
        london_bg_color: 'rgba(38, 166, 154, 0.18)',
        london_plot: true,
        london_bg: true,
        ny_active: true,
        ny_start: '08:00',
        ny_end: '17:00',
        ny_color: '#f59e0b',
        ny_bg_color: 'rgba(245, 158, 11, 0.18)',
        ny_plot: true,
        ny_bg: true,
        tokyo_active: true,
        tokyo_start: '20:00',
        tokyo_end: '04:00',
        tokyo_color: '#00b4d8',
        tokyo_bg_color: 'rgba(0, 180, 216, 0.16)',
        tokyo_plot: true,
        tokyo_bg: true,
        sydney_active: true,
        sydney_start: '17:00',
        sydney_end: '02:00',
        sydney_color: '#ef5350',
        sydney_bg_color: 'rgba(239, 83, 80, 0.16)',
        sydney_plot: true,
        sydney_bg: true,
        plots_bg: true,
        precision: 'Default',
        labels_on_price_scale: true,
        values_in_status_line: true,
        inputs_in_status_line: true,
        visibility_ticks: true,
        visibility_seconds: true,
        visibility_seconds_min: 1,
        visibility_seconds_max: 59,
        visibility_minutes: true,
        visibility_minutes_min: 1,
        visibility_minutes_max: 59,
        visibility_hours: true,
        visibility_hours_min: 1,
        visibility_hours_max: 24,
        visibility_days: true,
        visibility_days_min: 1,
        visibility_days_max: 366,
        visibility_weeks: true,
        visibility_weeks_min: 1,
        visibility_weeks_max: 52,
        visibility_months: true,
        visibility_months_min: 1,
        visibility_months_max: 12,
        visibility_ranges: true,
      });
      return;
    }
    if (preset?.defaultParams) {
      setParams({ ...preset.defaultParams });
      setCustomCode(preset.code);
    }
  };

  const handleSave = () => {
    updateIndicator(indicator.id, {
      params,
      code: customCode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl border ${
          isDark ? 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-[#2a2e39]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#2a2e39] text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              {isSessions ? <Clock size={18} /> : <Sliders size={18} />}
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">{isSessions ? 'Sessions' : indicator.name}</h2>
              <p className={`text-xs ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                {isSessions 
                  ? 'Configure market hours, high-low ranges, styles, and timeframe visibility.'
                  : 'Configure calculation parameters, visual styling, and signal direction rules.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-[#2a2e39] text-[#787b86] hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-1 px-5 pt-3 border-b text-xs font-medium ${isDark ? 'border-[#2a2e39]' : 'border-slate-200'}`}>
          {isSessions ? (
            <>
              <button
                onClick={() => setActiveTab('inputs')}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
                  activeTab === 'inputs'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Inputs
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
                  activeTab === 'style'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Style
              </button>
              <button
                onClick={() => setActiveTab('visibility')}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
                  activeTab === 'visibility'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Visibility
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('inputs')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
                  activeTab === 'inputs'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={14} />
                Inputs & Parameters
              </button>

              {(isFootprint || isDelta || isLiquiditySweep || isLiquiditySwings || isTopDown) && (
                <button
                  onClick={() => setActiveTab('direction')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
                    activeTab === 'direction'
                      ? isDark ? 'border-amber-500 text-amber-400 font-semibold' : 'border-amber-600 text-amber-600 font-semibold'
                      : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Compass size={14} />
                  {(isLiquiditySweep || isLiquiditySwings || isTopDown) ? 'Architecture & Strategy Guide' : 'Direction Intelligence (X-Ray)'}
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400">
                    PRO
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('style')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
                  activeTab === 'style'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye size={14} />
                Style & Display
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
                  activeTab === 'code'
                    ? isDark ? 'border-blue-500 text-blue-400 font-semibold' : 'border-blue-600 text-blue-600 font-semibold'
                    : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code size={14} />
                Pine Code
              </button>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: INPUTS */}
          {activeTab === 'inputs' && (
            isSessions ? (
              <div className="space-y-4 py-1">
                {/* Activate High-Low View */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!params.high_low_view}
                    onChange={e => handleParamChange('high_low_view', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium">Activate High-Low View</span>
                </label>

                {/* Resolution */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium">Resolution</span>
                  <select
                    value={params.resolution || '1 day'}
                    onChange={e => handleParamChange('resolution', e.target.value)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border ${
                      isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                    } focus:outline-none focus:border-blue-500`}
                  >
                    <option value="1 day">1 day</option>
                    <option value="Same as chart">Same as chart</option>
                    <option value="1 hour">1 hour</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                </div>

                {/* Session Time Range Rows */}
                <div className="space-y-3 pt-2">
                  {[
                    { label: 'London Session', startKey: 'london_start', endKey: 'london_end', defaultStart: '03:00', defaultEnd: '12:00' },
                    { label: 'New York Session', startKey: 'ny_start', endKey: 'ny_end', defaultStart: '08:00', defaultEnd: '17:00' },
                    { label: 'Tokyo Session', startKey: 'tokyo_start', endKey: 'tokyo_end', defaultStart: '20:00', defaultEnd: '04:00' },
                    { label: 'Sydney Session', startKey: 'sydney_start', endKey: 'sydney_end', defaultStart: '17:00', defaultEnd: '02:00' }
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={params[s.startKey] || s.defaultStart}
                          onChange={e => handleParamChange(s.startKey, e.target.value)}
                          className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          } focus:outline-none focus:border-blue-500`}
                        />
                        <span className="text-xs text-[#787b86]">-</span>
                        <input
                          type="text"
                          value={params[s.endKey] || s.defaultEnd}
                          onChange={e => handleParamChange(s.endKey, e.target.value)}
                          className={`w-20 px-2 py-1 text-center font-mono text-xs rounded border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          } focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Session Checkboxes */}
                <div className="space-y-2.5 pt-3 border-t border-[#2a2e39]/50">
                  {[
                    { label: 'London Session', key: 'london_active', defaultVal: true },
                    { label: 'New York Session', key: 'ny_active', defaultVal: true },
                    { label: 'Tokyo Session', key: 'tokyo_active', defaultVal: true },
                    { label: 'Sydney Session', key: 'sydney_active', defaultVal: true }
                  ].map(s => (
                    <label key={s.key} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={params[s.key] ?? s.defaultVal}
                        onChange={e => handleParamChange(s.key, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : isTopDown ? (
              <div className="space-y-4 py-1 text-xs">
                {/* Step 1: Daily Trend & Bias */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
                    <TrendingUp size={15} />
                    <span>Step 1: Daily — Trend / Bias Confirmation</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-slate-200 mb-1">Daily Trend Confirmation Mode</div>
                      <select
                        value={params.daily_mode || 'hh_hl'}
                        onChange={e => handleParamChange('daily_mode', e.target.value)}
                        className={`w-full px-3 py-1.5 rounded text-xs font-medium border ${
                          isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                        } focus:outline-none focus:border-blue-500`}
                      >
                        <option value="hh_hl">Market Structure (Higher Highs / Higher Lows)</option>
                        <option value="ema">EMA 20/50 Trend Alignment</option>
                        <option value="both">Combined Structure + EMA Alignment</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="font-medium text-slate-300 block mb-1">Pivot Lookback (Bars)</span>
                        <input
                          type="number"
                          min={2}
                          max={20}
                          value={params.daily_lookback ?? 5}
                          onChange={e => handleParamChange('daily_lookback', parseInt(e.target.value) || 5)}
                          className={`w-full px-2.5 py-1 text-xs rounded border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                          <input
                            type="checkbox"
                            checked={params.daily_ema_filter ?? true}
                            onChange={e => handleParamChange('daily_ema_filter', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-300">50 EMA Filter</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params.only_trend_entries ?? true}
                          onChange={e => handleParamChange('only_trend_entries', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-200">Strict Trend Alignment (No Counter-Trend)</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">Daily UP = Demand Only. Daily DOWN = Supply Only.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 2: 4H Major Demand Zone */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2.5">
                    <Layers size={15} />
                    <span>Step 2: 4H — Major Demand Zone (Displacement Base)</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">4H Impulse ATR Multiplier</span>
                        <p className="text-[11px] text-slate-400">Institutional displacement body size threshold</p>
                      </div>
                      <input
                        type="number"
                        step={0.05}
                        min={1.0}
                        max={3.0}
                        value={params.impulse_mult_4h ?? 1.25}
                        onChange={e => handleParamChange('impulse_mult_4h', parseFloat(e.target.value) || 1.25)}
                        className={`w-20 px-2 py-1 text-right text-xs rounded border ${
                          isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params.check_unmitigated ?? true}
                          onChange={e => handleParamChange('check_unmitigated', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-300">Fresh / Unmitigated Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params.show_4h_zones ?? true}
                          onChange={e => handleParamChange('show_4h_zones', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-300">Show 4H Box on Chart</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 3: 1H & 30M Refinement */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5">
                    <Sliders size={15} />
                    <span>Step 3: 1H & 30M — Refine the 4H Zone</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg border border-slate-800 bg-slate-900/40">
                      <input
                        type="checkbox"
                        checked={params.refine_1h ?? true}
                        onChange={e => handleParamChange('refine_1h', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block">1H Refinement</span>
                        <span className="text-[10px] text-slate-400">Search nested 1H origin</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg border border-slate-800 bg-slate-900/40">
                      <input
                        type="checkbox"
                        checked={params.refine_30m ?? true}
                        onChange={e => handleParamChange('refine_30m', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block">30M Refinement</span>
                        <span className="text-[10px] text-slate-400">Sniper sub-zone</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Step 4 & 5: 15M Structure Change & 5M Confirmation */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                    <Activity size={15} />
                    <span>Step 4, 5 & 6: Retest Wait & 15M / 5M Confirmation</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={params.require_15m_choch ?? true}
                        onChange={e => handleParamChange('require_15m_choch', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500 mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-slate-200">Wait for 15M Structure Change (CHoCH)</span>
                        <p className="text-[11px] text-slate-400">DO NOT enter immediately when touching 4H demand. Wait for 15M lower high break.</p>
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params.require_5m_sweep ?? true}
                          onChange={e => handleParamChange('require_5m_sweep', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-slate-300">5M Liquidity Sweep</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params.require_5m_bos ?? true}
                          onChange={e => handleParamChange('require_5m_bos', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-slate-300">5M Displacement & BOS</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 7: Trade Execution, Stop Loss & Take Profit */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-lime-400 uppercase tracking-wider mb-2.5">
                    <Target size={15} />
                    <span>Step 7: Entry, Stop Loss & Take Profit (Highest Point)</span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">Stop Loss Placement</span>
                        <select
                          value={params.sl_mode || 'origin_candle'}
                          onChange={e => handleParamChange('sl_mode', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded text-xs border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          <option value="origin_candle">Bottom of 5M Origin Candle</option>
                          <option value="zone_low">Bottom of Refined Zone</option>
                        </select>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-200 block mb-1">Take Profit Target</span>
                        <select
                          value={params.tp_mode || 'trend_high'}
                          onChange={e => handleParamChange('tp_mode', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded text-xs border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          <option value="trend_high">Highest Point of the Trend</option>
                          <option value="opposing_zone">Opposing 4H Supply Zone</option>
                          <option value="fixed_rr">Fixed Risk:Reward</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="font-medium text-slate-400 block mb-1">SL ATR Buffer</span>
                        <input
                          type="number"
                          step={0.05}
                          min={0.0}
                          max={1.0}
                          value={params.sl_buffer_atr ?? 0.15}
                          onChange={e => handleParamChange('sl_buffer_atr', parseFloat(e.target.value) || 0.15)}
                          className={`w-full px-2.5 py-1 text-xs rounded border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="font-medium text-slate-400 block mb-1">Fixed R:R (if selected)</span>
                        <input
                          type="number"
                          step={0.5}
                          min={1.0}
                          max={10.0}
                          value={params.fixed_rr ?? 3.5}
                          onChange={e => handleParamChange('fixed_rr', parseFloat(e.target.value) || 3.5)}
                          className={`w-full px-2.5 py-1 text-xs rounded border ${
                            isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              {/* Footprint Quick Direction Switch */}
              {isFootprint && (
                <div className={`p-4 rounded-xl border ${
                  params.show_directions 
                    ? isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200' 
                    : isDark ? 'bg-[#2a2e39]/50 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${params.show_directions ? 'bg-blue-500 text-white' : 'bg-gray-500/20 text-gray-400'}`}>
                        <Compass size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Market Direction Signals (X-Ray)</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                          Instantly evaluates real-time order flow balance to detect Stacked Buying/Selling Imbalances, Trapped POCs, and Delta at Key S/R.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!params.show_directions} 
                        onChange={(e) => handleParamChange('show_directions', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Volume Delta Quick Setups Switch */}
              {isDelta && (
                <div className={`p-4 rounded-xl border ${
                  params.show_direction_setups 
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200' 
                    : isDark ? 'bg-[#2a2e39]/50 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${params.show_direction_setups ? 'bg-emerald-500 text-white' : 'bg-gray-500/20 text-gray-400'}`}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Detect Bullish & Bearish Setups</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            8 SETUPS
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                          Scans for CVD Absorption Divergences, Range Breakouts/Breakdowns, Delta Flips, and Volume Exhaustion.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!params.show_direction_setups} 
                        onChange={(e) => handleParamChange('show_direction_setups', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Dynamic Parameter Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paramDefs.map(def => {
                  const val = params[def.key] !== undefined ? params[def.key] : def.default;

                  if (def.type === 'bool') {
                    return (
                      <div 
                        key={def.key} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="pr-3">
                          <div className="text-xs font-semibold">{def.name}</div>
                          {def.description && (
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                              {def.description}
                            </div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => handleParamChange(def.key, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded bg-gray-700 border-gray-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    );
                  }

                  if (def.type === 'select') {
                    return (
                      <div 
                        key={def.key} 
                        className={`p-3 rounded-lg border ${
                          isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <label className="block text-xs font-semibold mb-1">{def.name}</label>
                        <select
                          value={val}
                          onChange={(e) => handleParamChange(def.key, e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-md text-xs font-medium outline-none border ${
                            isDark 
                              ? 'bg-[#1e222d] border-[#363c4e] text-white focus:border-blue-500' 
                              : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                          }`}
                        >
                          {def.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (def.type === 'color') {
                    const isTransparent = !val || val === 'transparent' || val === 'none' || val === 'rgba(0,0,0,0)';
                    const hexVal = isTransparent ? '#26a69a' : (val.startsWith('#') ? val.substring(0, 7) : '#26a69a');

                    const PRESET_COLORS = [
                      { label: 'Transparent', value: 'transparent', bg: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:6px_6px] bg-slate-300 dark:bg-slate-700' },
                      { label: 'Bullish Green', value: '#26a69a', bg: 'bg-[#26a69a]' },
                      { label: 'Bearish Red', value: '#ef5350', bg: 'bg-[#ef5350]' },
                      { label: 'BOS Cyan', value: '#00b4d8', bg: 'bg-[#00b4d8]' },
                      { label: 'Orange', value: '#ff9800', bg: 'bg-[#ff9800]' },
                      { label: 'Royal Blue', value: '#2962ff', bg: 'bg-[#2962ff]' },
                      { label: 'Purple', value: '#9c27b0', bg: 'bg-[#9c27b0]' },
                      { label: 'Amber', value: '#fbc02d', bg: 'bg-[#fbc02d]' },
                      { label: 'White', value: '#ffffff', bg: 'bg-white border border-slate-400' },
                      { label: 'Gray', value: '#787b86', bg: 'bg-[#787b86]' },
                    ];

                    return (
                      <div 
                        key={def.key} 
                        className={`p-3 rounded-lg border flex flex-col gap-2.5 ${
                          isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{def.name}</span>
                          <div className="flex items-center gap-2">
                            {isTransparent ? (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                                Transparent (Hidden)
                              </span>
                            ) : (
                              <span className="text-xs font-mono">{val}</span>
                            )}
                            <div className="relative flex items-center justify-center w-7 h-7 rounded border overflow-hidden border-slate-600">
                              {isTransparent ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[9px] font-bold text-amber-400">
                                  Ø
                                </div>
                              ) : (
                                <input
                                  type="color"
                                  value={hexVal}
                                  onChange={(e) => handleParamChange(def.key, e.target.value)}
                                  className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent scale-125"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Color Swatches with Transparent */}
                        <div className="flex items-center flex-wrap gap-1.5 pt-1">
                          {PRESET_COLORS.map(presetColor => {
                            const isSelected = val === presetColor.value;
                            return (
                              <button
                                key={presetColor.label}
                                type="button"
                                title={presetColor.label}
                                onClick={() => handleParamChange(def.key, presetColor.value)}
                                className={`w-6 h-6 rounded-md transition-all flex items-center justify-center relative ${presetColor.bg} ${
                                  isSelected ? 'ring-2 ring-blue-500 scale-110 shadow-sm' : 'hover:scale-105 opacity-85 hover:opacity-100'
                                }`}
                              >
                                {presetColor.value === 'transparent' && (
                                  <span className="text-[10px] font-bold text-red-500 leading-none">✕</span>
                                )}
                                {isSelected && presetColor.value !== 'transparent' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Default: Number input (int/float)
                  return (
                    <div 
                      key={def.key} 
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold">{def.name}</label>
                        {def.min !== undefined && def.max !== undefined && (
                          <span className={`text-[10px] ${isDark ? 'text-[#787b86]' : 'text-slate-400'}`}>
                            [{def.min} - {def.max}]
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={val}
                        min={def.min}
                        max={def.max}
                        step={def.step || (def.type === 'float' ? 0.1 : 1)}
                        onChange={(e) => {
                          const parsed = def.type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                          handleParamChange(def.key, isNaN(parsed) ? def.default : parsed);
                        }}
                        className={`w-full px-3 py-1.5 rounded-md text-xs font-mono outline-none border ${
                          isDark 
                            ? 'bg-[#1e222d] border-[#363c4e] text-white focus:border-blue-500' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                        }`}
                      />
                      {def.description && (
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                          {def.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )
          )}

          {/* TAB 2: DIRECTION INTELLIGENCE (FOOTPRINT & DELTA RULES) */}
          {activeTab === 'direction' && (
            <div className="space-y-6">
              {/* FOOTPRINT DIRECTION INTELLIGENCE GUIDE */}
              {isFootprint && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#2a2e39]/40 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                        <Info size={16} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold text-sm block mb-1">Footprint Short-Term Market Direction</span>
                        A footprint chart acts like an <strong>X-ray machine</strong>, revealing the immediate supply and demand balance. Unlike lagging indicators, it shows who is aggressively hitting bids or lifting asks in real time to signal short-term reversals and continuations.
                      </div>
                    </div>
                  </div>

                  {/* Bullish Directional Signals */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <TrendingUp size={14} />
                      Determining Bullish (Upward) Direction
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">1. Stacked Buying Imbalances</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">3+ Diagonal Levels (300%+)</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          3 or more consecutive diagonal price levels where ask volume outweighs bid volume aggressively (300%+ ratio). Signals institutional buyers aggressively lifting the ask.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">2. Positive Delta at Support</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Pullback Reversal</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price pulls back to a key support zone and prints a sudden surge in positive delta, proving aggressive sellers are exhausted and buyers are stepping in.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">3. POC at the Bottom of the Bar</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Trapped Sellers</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Highest volume (Point of Control) is concentrated at the very bottom of the candle, yet price closes strong near the top. Buyers trapped sellers at the lows and forced price up.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bearish Directional Signals */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <TrendingDown size={14} />
                      Determining Bearish (Downward) Direction
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">1. Stacked Selling Imbalances</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">3+ Diagonal Levels (300%+)</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Multiple diagonal rows of dominant aggressive selling on the left side of the footprint. Confirms heavy institutional market sellers hitting the bids.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">2. Negative Delta at Resistance</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Ceiling Defense</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price touches a resistance ceiling and delta turns sharply negative, proving aggressive sellers have entered to defend the ceiling.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">3. POC at the Top of the Bar</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Absorbed / Trapped Buyers</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Highest volume (POC) concentrated at the very top, but price closes weak near the low. Buyers tried to push higher but were heavily absorbed by limit sellers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TOP-DOWN MULTI-TIMEFRAME DEMAND + STRUCTURE CONFIRMATION STRATEGY GUIDE */}
              {isTopDown && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-sky-950/30 border-teal-500/30' : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-teal-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 shrink-0 mt-0.5 border border-teal-500/30">
                        <TrendingUp size={20} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">Top-Down MTF Demand + Structure Strategy</span>
                          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
                            1D → 4H → 1H → 30M → 15M → 5M
                          </span>
                        </div>
                        <p className={`mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          A systematic institutional methodology that confirms macro daily trend direction, establishes 4H displacement demand zones, refines them with 1H &amp; 30M sub-structures, enforces a strict patience filter, and executes on 5M structure change with origin candle SL and highest swing high TP.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Daily Trend/Bias */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px]">1</span>
                        <span>Daily — Macro Trend &amp; Bias</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Higher High + Higher Low = UPTREND
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                      The indicator first determines the Daily market structure. Daily UP searches exclusively for BUY/Demand setups. Daily DOWN searches for SELL/Supply. No counter-trend entries are ever permitted.
                    </p>
                  </div>

                  {/* 2. 4H Major Demand Zone */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono text-[10px]">2</span>
                        <span>4H — Major Demand Zone</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                        Base → Displacement → BOS
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                      When Daily is bullish, the engine scans the 4H for institutional demand. Instead of arbitrary swing lows, it defines zones where consolidation/base was followed by strong bullish displacement breaking structure, with fresh unmitigated status.
                    </p>
                  </div>

                  {/* 3. 1H + 30M Refinement */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-[10px]">3</span>
                        <span>1H + 30M — Refine the 4H Zone</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Nested Sniper Sub-Zones
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                      Instead of treating the entire wide 4H zone as your entry, the indicator searches inside the 4H demand for nested 1H and 30M demand structures, compressing the zone from e.g. 1.08320–1.08510 down to 1.08418–1.08442 for minimal drawdown.
                    </p>
                  </div>

                  {/* 4. Wait - Don't Enter Immediately */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[10px]">4</span>
                        <span>Wait — Don&apos;t Enter Immediately</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Patience Filter
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-amber-200/90' : 'text-amber-900'}`}>
                      CRITICAL: When price reaches the refined 4H/1H/30M demand zone, NO BUY SIGNAL is generated yet. The indicator enters &ldquo;WAITING FOR LTF CONFIRMATION&rdquo; and monitors 15M and 5M.
                    </p>
                  </div>

                  {/* 5. 15M Structure Change */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px]">5</span>
                        <span>15M — Market Structure Change</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        15M CHoCH / BOS
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                      Once price is inside the higher-timeframe zone, it looks for evidence that sellers lost control: Lower Low → Lower High → Sweep/Rejection → Higher Low → Break of Structure (15M CHoCH), confirming order flow transition.
                    </p>
                  </div>

                  {/* 6. 5M Confirmation */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-mono text-[10px]">6</span>
                        <span>5M — Confirmation &amp; New Demand</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300">
                        Liquidity Sweep + BOS
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                      The 5M timeframe is the execution trigger. The algorithm tracks liquidity sweep → impulsive bullish displacement → break of recent swing high → newly formed 5M origin demand zone.
                    </p>
                  </div>

                  {/* 7. Entry, Stop Loss & Take Profit */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px]">7</span>
                        <span>Entry, Stop Loss &amp; Take Profit Target</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Highest Point of Trend
                      </span>
                    </div>
                    <div className={`text-xs mt-2 space-y-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sky-400">Entry:</span>
                        <span>Refined 5M demand zone created after market structure confirmation.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-400">Stop Loss:</span>
                        <span>Strictly at the bottom of that origin candle (with ATR protection buffer).</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">Take Profit:</span>
                        <span>At the highest point of the trend (prior major swing high). Then wait for market to play out!</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VOLUME DELTA & CVD DIRECTION INTELLIGENCE GUIDE */}
              {isDelta && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#2a2e39]/40 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                        <Activity size={16} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold text-sm block mb-1">Volume Delta & CVD Direction Setups</span>
                        Volume Delta tracks market orders (aggressors) vs limit orders (absorbers). Cumulative Volume Delta (CVD) reveals hidden institutional accumulation, distribution, and exhaustion divergences.
                      </div>
                    </div>
                  </div>

                  {/* 4 Bullish Setups */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <TrendingUp size={14} />
                      Bullish Direction (Long Setups)
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">1. Bullish CVD Divergence (Absorption)</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Price LL vs CVD HL</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price makes a lower low, but the CVD line makes a higher low. Aggressive sellers are hitting bids heavily, but a large passive buyer uses limit orders to absorb all pressure and hold price up.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">2. CVD Breakout (Aggressive Initiation)</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Range Breakout</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price is stuck in tight consolidation, but CVD suddenly breaks out to a new high. Aggressive buyers are quietly lifting the ask, preceding a sharp upward price breakout.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">3. Delta Flip at Key Support</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">-Delta to +Delta</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price hits major support with highly negative individual bar delta. On the very next bar, price holds support and individual delta flips sharply positive with immediate buyer aggression.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-500">4. Decreasing Negative Delta on Lower Lows</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Seller Exhaustion</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price makes consecutive lower lows, but negative individual bar delta shrinks significantly (e.g. -500, then -200, then -30), proving selling pressure has completely dried up.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Bearish Setups */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <TrendingDown size={14} />
                      Bearish Direction (Short Setups)
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">1. Bearish CVD Divergence (Absorption)</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Price HH vs CVD LH</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price makes a higher high, but CVD line makes a lower high. Aggressive buyers are lifting the ask, but a large passive institutional seller uses limit orders to block price from advancing.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">2. CVD Breakdown (Aggressive Distribution)</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Range Breakdown</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price is moving sideways in a range, but CVD line breaks down to new lows. Aggressive sellers are secretly hitting bids, warning that the price floor is about to give way.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">3. Delta Flip at Key Resistance</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">+Delta to -Delta</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price rallies into resistance on high positive delta. The moment it touches resistance, the next bar immediately prints heavy negative delta, confirming defense by aggressive sellers.
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-500">4. Decreasing Positive Delta on Higher Highs</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Buyer Exhaustion</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                          Price pushes to consecutive new highs, but positive individual bar delta gets smaller on each peak. Proves buying power is drying up and the upward movement is running out of fuel.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LIQUIDITY SWEEP + CISD + FVG STRATEGY GUIDE */}
              {isLiquiditySweep && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#2a2e39]/40 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                        <Zap size={16} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold text-sm block mb-1">Liquidity Sweep + CISD + FVG Strategy</span>
                        A core Smart Money / ICT algorithmic trading setup combining liquidity purge confirmation, Change in State of Delivery (CISD) transition shifts, and opposing Fair Value Gap (FVG) entry zones.
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Liquidity Sweep */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Layers size={14} />
                      Step 1: Liquidity Sweep (Purge & Rejection Wick)
                    </div>
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Wick Piercing & Close Back</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Swept Level</span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                        Price probes beyond a previous swing high or low with a fast wick to grab liquidity, but closes back inside the level, signaling that institutions absorbed retail resting stops.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: CISD */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                      <TrendingUp size={14} />
                      Step 2: CISD (Change in State of Delivery)
                    </div>
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">Opposing Candle Sequence Break</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">State Transition</span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                        The opening level of the last opposing candle sequence (or structural swing point prior to the sweep) is broken and closed beyond with displacement, confirming delivery orderflow has changed.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: FVG */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Zap size={14} />
                      Step 3: FVG (Fair Value Gap Imbalance Entry)
                    </div>
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Displacement Imbalance Zone</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Optimal Entry</span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                        A 3-bar Fair Value Gap formed during the displacement run serves as the high-probability return-to-origin entry zone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* LIQUIDITY SWINGS STRATEGY GUIDE */}
              {isLiquiditySwings && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#2a2e39]/40 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                        <Activity size={16} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold text-sm block mb-1">Liquidity Swings & Resting Volume Pools</span>
                        Identifies institutional Sell-Side and Buy-Side swing extremes, measuring resting volume footprints, highlighting shaded price blocks, and projecting horizontal mitigation target levels across the chart.
                      </div>
                    </div>
                  </div>

                  {/* Sell Liquidity Swings */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                      <TrendingUp size={14} className="rotate-180" />
                      Swing Highs (Sell Liquidity Pools)
                    </div>
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400">Resting Buy-Stop Volume Pool (Sell Tag)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">e.g. 23.823K Sell</span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                        Calculates institutional volume concentrated at swing highs. Shaded red blocks highlight the order footprint, and extending lines mark the resting liquidity targets until swept.
                      </p>
                    </div>
                  </div>

                  {/* Buy Liquidity Swings */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <TrendingUp size={14} />
                      Swing Lows (Buy Liquidity Pools)
                    </div>
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400">Resting Sell-Stop Volume Pool (Buy Tag)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">e.g. 99.906K Buy</span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a7b4]' : 'text-slate-600'}`}>
                        Aggregates resting liquidity below swing lows. Shaded cyan blocks reveal demand footprints, and extending horizontal levels provide targets for market makers to absorb retail sell stops.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STYLE & DISPLAY */}
          {activeTab === 'style' && (
            isSessions ? (
              <div className="space-y-4 py-1 text-sm">
                {[
                  {
                    name: 'London',
                    plotKey: 'london_plot',
                    colorKey: 'london_color',
                    defaultColor: '#26a69a',
                    bgKey: 'london_bg',
                    bgColorKey: 'london_bg_color',
                    defaultBgColor: 'rgba(38, 166, 154, 0.18)'
                  },
                  {
                    name: 'New York',
                    plotKey: 'ny_plot',
                    colorKey: 'ny_color',
                    defaultColor: '#f59e0b',
                    bgKey: 'ny_bg',
                    bgColorKey: 'ny_bg_color',
                    defaultBgColor: 'rgba(245, 158, 11, 0.18)'
                  },
                  {
                    name: 'Tokyo',
                    plotKey: 'tokyo_plot',
                    colorKey: 'tokyo_color',
                    defaultColor: '#00b4d8',
                    bgKey: 'tokyo_bg',
                    bgColorKey: 'tokyo_bg_color',
                    defaultBgColor: 'rgba(0, 180, 216, 0.16)'
                  },
                  {
                    name: 'Sydney',
                    plotKey: 'sydney_plot',
                    colorKey: 'sydney_color',
                    defaultColor: '#ef5350',
                    bgKey: 'sydney_bg',
                    bgColorKey: 'sydney_bg_color',
                    defaultBgColor: 'rgba(239, 83, 80, 0.16)'
                  }
                ].map(s => (
                  <div key={s.name} className="space-y-2 pb-2.5 border-b border-[#2a2e39]/50">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params[s.plotKey] ?? true}
                          onChange={e => handleParamChange(s.plotKey, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{s.name} Plot</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={params[s.colorKey] || s.defaultColor}
                          onChange={e => handleParamChange(s.colorKey, e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params[s.bgKey] ?? true}
                          onChange={e => handleParamChange(s.bgKey, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Background Color</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={params[s.colorKey] || s.defaultColor}
                          onChange={e => {
                            const hex = e.target.value;
                            handleParamChange(s.colorKey, hex);
                            handleParamChange(s.bgColorKey, hex + '2e');
                          }}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Plots Background */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params.plots_bg ?? true}
                      onChange={e => handleParamChange('plots_bg', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Plots Background</span>
                  </label>
                  <input
                    type="color"
                    value={params.plots_bg_color || '#2962ff'}
                    onChange={e => handleParamChange('plots_bg_color', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                <div className="pt-3 border-t border-[#2a2e39]/60">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#787b86] mb-2.5">OUTPUT VALUES</div>
                  
                  <div className="flex items-center justify-between py-1.5">
                    <span>Precision</span>
                    <select
                      value={params.precision || 'Default'}
                      onChange={e => handleParamChange('precision', e.target.value)}
                      className={`px-3 py-1 rounded text-xs border ${
                        isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="Default">Default</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  <div className="space-y-2.5 pt-1.5">
                    {[
                      { label: 'Labels on price scale', key: 'labels_on_price_scale' },
                      { label: 'Values in status line', key: 'values_in_status_line' },
                      { label: 'Inputs in status line', key: 'inputs_in_status_line' }
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={params[opt.key] ?? true}
                          onChange={e => handleParamChange(opt.key, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="block text-xs font-semibold mb-2">Overlay Type</label>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                    preset?.overlay ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {preset?.overlay ? 'Main Chart Overlay' : 'Oscillator Sub-Pane (Bottom)'}
                  </span>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="block text-xs font-semibold mb-2">Category</label>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                    isDark ? 'bg-[#363c4e] text-[#d1d4dc]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {preset?.category || 'Custom'}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#2a2e39]/30 border-[#2a2e39]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Visual Elements Display</h3>
                <p className={`text-xs ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                  Customize the appearance, labels, colors, and line styles in the Inputs tab. Additional visual options automatically synchronize with the chart canvas.
                </p>
              </div>
            </div>
            )
          )}

          {/* TAB 4: VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="space-y-3 py-1 text-sm">
              {/* Ticks */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={params.visibility_ticks ?? true}
                  onChange={e => handleParamChange('visibility_ticks', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Ticks</span>
              </label>

              {/* Seconds, Minutes, Hours, Days, Weeks, Months with ranges */}
              {[
                { label: 'Seconds', checkKey: 'visibility_seconds', minKey: 'visibility_seconds_min', maxKey: 'visibility_seconds_max', defMin: 1, defMax: 59 },
                { label: 'Minutes', checkKey: 'visibility_minutes', minKey: 'visibility_minutes_min', maxKey: 'visibility_minutes_max', defMin: 1, defMax: 59 },
                { label: 'Hours', checkKey: 'visibility_hours', minKey: 'visibility_hours_min', maxKey: 'visibility_hours_max', defMin: 1, defMax: 24 },
                { label: 'Days', checkKey: 'visibility_days', minKey: 'visibility_days_min', maxKey: 'visibility_days_max', defMin: 1, defMax: 366 },
                { label: 'Weeks', checkKey: 'visibility_weeks', minKey: 'visibility_weeks_min', maxKey: 'visibility_weeks_max', defMin: 1, defMax: 52 },
                { label: 'Months', checkKey: 'visibility_months', minKey: 'visibility_months_min', maxKey: 'visibility_months_max', defMin: 1, defMax: 12 }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={params[item.checkKey] ?? true}
                      onChange={e => handleParamChange(item.checkKey, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item.label}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={params[item.minKey] ?? item.defMin}
                      onChange={e => handleParamChange(item.minKey, parseInt(e.target.value) || 0)}
                      className={`w-14 px-2 py-1 text-center font-mono text-xs rounded border ${
                        isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    />
                    <input
                      type="number"
                      value={params[item.maxKey] ?? item.defMax}
                      onChange={e => handleParamChange(item.maxKey, parseInt(e.target.value) || 0)}
                      className={`w-14 px-2 py-1 text-center font-mono text-xs rounded border ${
                        isDark ? 'bg-[#131722] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              ))}

              {/* Ranges */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={params.visibility_ranges ?? true}
                  onChange={e => handleParamChange('visibility_ranges', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Ranges</span>
              </label>
            </div>
          )}

          {/* TAB 5: CODE EDITOR */}
          {activeTab === 'code' && !isSessions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Pine Script Definition</span>
                <span className={`text-[11px] ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>Pine Script v5 Compatible</span>
              </div>
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                rows={10}
                className={`w-full p-3 font-mono text-xs rounded-lg border outline-none resize-y ${
                  isDark 
                    ? 'bg-[#131722] border-[#363c4e] text-emerald-400 focus:border-blue-500' 
                    : 'bg-slate-900 border-slate-700 text-emerald-300 focus:border-blue-600'
                }`}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-t ${isDark ? 'border-[#2a2e39] bg-[#1e222d]' : 'border-slate-200 bg-slate-50'} rounded-b-xl relative`}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDefaultsMenu(!showDefaultsMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                isDark ? 'bg-[#2a2e39]/60 hover:bg-[#2a2e39] border-[#363a45] text-[#d1d4dc]' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <span>Defaults</span>
              <ChevronDown size={13} />
            </button>
            {showDefaultsMenu && (
              <div 
                className={`absolute bottom-full mb-1 left-0 z-50 py-1 min-w-[140px] rounded shadow-xl border ${
                  isDark ? 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => { handleReset(); setShowDefaultsMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={12} />
                  Reset settings
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded text-xs font-medium border transition-colors ${
                isDark ? 'border-[#363a45] hover:bg-[#2a2e39] text-[#d1d4dc]' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-1.5 rounded text-xs font-semibold bg-[#2962ff] hover:bg-[#1e53e5] text-white transition-colors shadow-sm"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
