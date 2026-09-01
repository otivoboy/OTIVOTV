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
  Code
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

  const [activeTab, setActiveTab] = useState<'inputs' | 'style' | 'direction' | 'code'>('inputs');
  const [customCode, setCustomCode] = useState(indicator.code || preset?.code || '');

  const idLower = (indicator.id + ' ' + indicator.name).toLowerCase();
  const isFootprint = idLower.includes('footprint');
  const isDelta = idLower.includes('delta');

  const paramDefs: IndicatorParamDef[] = preset?.paramDefinitions || [
    { key: 'length', name: 'Length', type: 'int', default: 14, min: 1, max: 200, category: 'Calculations' }
  ];

  const handleParamChange = (key: string, val: any) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
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
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">{indicator.name}</h2>
              <p className={`text-xs ${isDark ? 'text-[#787b86]' : 'text-slate-500'}`}>
                Configure calculation parameters, visual styling, and signal direction rules.
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

          {(isFootprint || isDelta) && (
            <button
              onClick={() => setActiveTab('direction')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
                activeTab === 'direction'
                  ? isDark ? 'border-amber-500 text-amber-400 font-semibold' : 'border-amber-600 text-amber-600 font-semibold'
                  : isDark ? 'border-transparent text-[#787b86] hover:text-[#d1d4dc]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass size={14} />
              Direction Intelligence (X-Ray)
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
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: INPUTS */}
          {activeTab === 'inputs' && (
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
            </div>
          )}

          {/* TAB 3: STYLE & DISPLAY */}
          {activeTab === 'style' && (
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
          )}

          {/* TAB 4: CODE EDITOR */}
          {activeTab === 'code' && (
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
        <div className={`flex items-center justify-between px-5 py-3.5 border-t ${isDark ? 'border-[#2a2e39] bg-[#1e222d]' : 'border-slate-200 bg-slate-50'} rounded-b-xl`}>
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-[#2a2e39] text-[#787b86] hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-[#2a2e39] text-[#d1d4dc]' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Check size={14} />
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
