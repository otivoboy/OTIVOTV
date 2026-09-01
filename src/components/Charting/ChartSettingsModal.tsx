import React, { useState } from 'react';
import { Sliders, X, Palette, Eye, Scale, Globe, Check, RotateCcw } from 'lucide-react';
import { useMarketStore, DEFAULT_CHART_SETTINGS } from '../../store/useMarketStore';

export const ChartSettingsModal: React.FC = () => {
  const { isChartSettingsOpen, setChartSettingsOpen, chartSettings, updateChartSettings, theme, toggleTheme } = useMarketStore();
  const [activeTab, setActiveTab] = useState<'symbol' | 'appearance' | 'scales' | 'timezone'>('symbol');

  if (!isChartSettingsOpen) return null;

  const handleReset = () => {
    updateChartSettings(DEFAULT_CHART_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border bg-tv-panel/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tv-accent/10 text-tv-accent">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-tv-text">Chart Settings</h2>
              <p className="text-xs text-tv-muted">Customize display, scales & visual aesthetics</p>
            </div>
          </div>
          <button 
            onClick={() => setChartSettingsOpen(false)}
            className="p-1.5 hover:bg-tv-hover rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-tv-border bg-tv-panel/30 px-4 pt-2">
          {[
            { id: 'symbol', label: 'Symbol & Candles', icon: Palette },
            { id: 'appearance', label: 'Appearance & Canvas', icon: Eye },
            { id: 'scales', label: 'Scales & Lines', icon: Scale },
            { id: 'timezone', label: 'Timezone', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-tv-accent text-tv-accent' 
                    : 'border-transparent text-tv-muted hover:text-tv-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'symbol' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Bullish Candle Color */}
                <div>
                  <label className="block text-xs font-medium text-tv-muted mb-1.5">Bullish (Up) Candle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chartSettings.candleUpColor}
                      onChange={(e) => updateChartSettings({ candleUpColor: e.target.value, wickUpColor: e.target.value })}
                      className="w-8 h-8 rounded border border-tv-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={chartSettings.candleUpColor}
                      onChange={(e) => updateChartSettings({ candleUpColor: e.target.value, wickUpColor: e.target.value })}
                      className="flex-1 bg-tv-input border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text font-mono"
                    />
                  </div>
                </div>

                {/* Bearish Candle Color */}
                <div>
                  <label className="block text-xs font-medium text-tv-muted mb-1.5">Bearish (Down) Candle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chartSettings.candleDownColor}
                      onChange={(e) => updateChartSettings({ candleDownColor: e.target.value, wickDownColor: e.target.value })}
                      className="w-8 h-8 rounded border border-tv-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={chartSettings.candleDownColor}
                      onChange={(e) => updateChartSettings({ candleDownColor: e.target.value, wickDownColor: e.target.value })}
                      className="flex-1 bg-tv-input border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Price Precision */}
              <div>
                <label className="block text-xs font-medium text-tv-muted mb-1.5">Decimal Precision</label>
                <select
                  value={chartSettings.precision}
                  onChange={(e) => updateChartSettings({ precision: parseInt(e.target.value, 10) })}
                  className="w-full bg-tv-input border border-tv-border rounded-lg px-3 py-2 text-xs sm:text-sm text-tv-text focus:outline-none focus:border-tv-accent cursor-pointer"
                >
                  <option value={2}>2 Decimals (0.01)</option>
                  <option value={3}>3 Decimals (0.001)</option>
                  <option value={4}>4 Decimals (0.0001)</option>
                  <option value={5}>5 Decimals (0.00001 - Default)</option>
                  <option value={6}>6 Decimals (0.000001)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Grid Lines Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <h4 className="text-xs font-semibold text-tv-text">Chart Grid Lines</h4>
                  <p className="text-[11px] text-tv-muted">Show vertical and horizontal background time/price grid</p>
                </div>
                <input
                  type="checkbox"
                  checked={chartSettings.showGridLines}
                  onChange={(e) => updateChartSettings({ showGridLines: e.target.checked })}
                  className="w-4 h-4 rounded text-tv-accent cursor-pointer accent-tv-accent"
                />
              </div>

              {/* Watermark Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <h4 className="text-xs font-semibold text-tv-text">Symbol Watermark</h4>
                  <p className="text-[11px] text-tv-muted">Display large translucent ticker behind candles</p>
                </div>
                <input
                  type="checkbox"
                  checked={chartSettings.showWatermark}
                  onChange={(e) => updateChartSettings({ showWatermark: e.target.checked })}
                  className="w-4 h-4 rounded text-tv-accent cursor-pointer accent-tv-accent"
                />
              </div>

              {/* Volume Overlay */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <h4 className="text-xs font-semibold text-tv-text">Volume Sub-bars</h4>
                  <p className="text-[11px] text-tv-muted">Display volume delta bars on bottom axis</p>
                </div>
                <input
                  type="checkbox"
                  checked={chartSettings.showVolume}
                  onChange={(e) => updateChartSettings({ showVolume: e.target.checked })}
                  className="w-4 h-4 rounded text-tv-accent cursor-pointer accent-tv-accent"
                />
              </div>
            </div>
          )}

          {activeTab === 'scales' && (
            <div className="space-y-4">
              {/* Countdown timer */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <h4 className="text-xs font-semibold text-tv-text">Countdown to Bar Close</h4>
                  <p className="text-[11px] text-tv-muted">Show real-time countdown badge on price axis</p>
                </div>
                <input
                  type="checkbox"
                  checked={chartSettings.showCountdown}
                  onChange={(e) => updateChartSettings({ showCountdown: e.target.checked })}
                  className="w-4 h-4 rounded text-tv-accent cursor-pointer accent-tv-accent"
                />
              </div>

              {/* High / Low price lines */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <h4 className="text-xs font-semibold text-tv-text">High & Low Session Lines</h4>
                  <p className="text-[11px] text-tv-muted">Mark highest and lowest visible candle prices</p>
                </div>
                <input
                  type="checkbox"
                  checked={chartSettings.showHighLowLines}
                  onChange={(e) => updateChartSettings({ showHighLowLines: e.target.checked })}
                  className="w-4 h-4 rounded text-tv-accent cursor-pointer accent-tv-accent"
                />
              </div>
            </div>
          )}

          {activeTab === 'timezone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-tv-muted mb-1.5">Chart Timezone</label>
                <select
                  value={chartSettings.timezone}
                  onChange={(e) => updateChartSettings({ timezone: e.target.value })}
                  className="w-full bg-tv-input border border-tv-border rounded-lg px-3 py-2 text-xs sm:text-sm text-tv-text focus:outline-none focus:border-tv-accent cursor-pointer"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">New York (EST/EDT - UTC-5 / UTC-4)</option>
                  <option value="America/Chicago">Chicago (CST/CDT - UTC-6 / UTC-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST/PDT - UTC-8 / UTC-7)</option>
                  <option value="Europe/London">London (GMT/BST - UTC+0 / UTC+1)</option>
                  <option value="Europe/Frankfurt">Frankfurt / Paris (CET/CEST - UTC+1 / UTC+2)</option>
                  <option value="Asia/Dubai">Dubai (GST - UTC+4)</option>
                  <option value="Asia/Tokyo">Tokyo (JST - UTC+9)</option>
                  <option value="Asia/Hong_Kong">Hong Kong / Singapore (HKT/SGT - UTC+8)</option>
                  <option value="Australia/Sydney">Sydney (AEST/AEDT - UTC+10 / UTC+11)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-tv-panel border-t border-tv-border flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-tv-muted hover:text-tv-text hover:bg-tv-card rounded-lg border border-transparent hover:border-tv-border transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => setChartSettingsOpen(false)}
            className="px-4 py-1.5 bg-tv-accent hover:bg-tv-accent/90 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
