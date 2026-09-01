import React, { useState } from 'react';
import { Bell, X, Trash2, Volume2, Plus, CheckCircle2, Clock, DollarSign, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { PriceAlert } from '../../types';
import { formatSymbolPrice } from '../../lib/priceFormatter';
import { soundManager } from '../../lib/soundEffects';

export const AlertsModal: React.FC = () => {
  const { 
    isAlertModalOpen, 
    setAlertModalOpen, 
    activeSymbol, 
    candles, 
    lastTick, 
    alerts, 
    addAlert, 
    removeAlert, 
    toggleAlert,
    theme 
  } = useMarketStore();

  const currentPrice = lastTick?.price ?? (candles.length > 0 ? candles[candles.length - 1].close : 100);

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString());
  const [condition, setCondition] = useState<PriceAlert['condition']>('crossing');
  const [message, setMessage] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundType, setSoundType] = useState<PriceAlert['soundType']>('chime');
  const [isOneOff, setIsOneOff] = useState<boolean>(true);

  if (!isAlertModalOpen) return null;

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    addAlert({
      symbol: activeSymbol,
      targetPrice: priceNum,
      condition,
      createdPrice: currentPrice,
      message: message.trim() || `${activeSymbol} reached ${formatSymbolPrice(activeSymbol, priceNum)}`,
      soundEnabled,
      soundType,
      isOneOff,
      active: true
    });

    if (soundEnabled) {
      soundManager.playAlertSound(soundType);
    }

    setActiveTab('list');
    setMessage('');
  };

  const handleTestSound = (type: PriceAlert['soundType']) => {
    soundManager.playAlertSound(type);
  };

  const symbolAlerts = alerts.filter(a => a.symbol.toLowerCase() === activeSymbol.toLowerCase());

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
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-tv-text">Price Alerts</h2>
              <p className="text-xs text-tv-muted">Real-time alerts for {activeSymbol}</p>
            </div>
          </div>
          <button 
            onClick={() => setAlertModalOpen(false)}
            className="p-1.5 hover:bg-tv-hover rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-tv-border bg-tv-panel/30 px-5 pt-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create' 
                ? 'border-tv-accent text-tv-accent' 
                : 'border-transparent text-tv-muted hover:text-tv-text'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Alert
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'list' 
                ? 'border-tv-accent text-tv-accent' 
                : 'border-transparent text-tv-muted hover:text-tv-text'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Active Alerts ({alerts.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateAlert} className="space-y-4">
              {/* Symbol and Current Price */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-tv-panel border border-tv-border">
                <div>
                  <span className="text-xs text-tv-muted">Market Symbol</span>
                  <p className="text-sm font-semibold text-tv-text">{activeSymbol}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-tv-muted">Current Price</span>
                  <p className="text-sm font-bold text-tv-accent font-mono">
                    {formatSymbolPrice(activeSymbol, currentPrice)}
                  </p>
                </div>
              </div>

              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-medium text-tv-muted mb-1.5">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-tv-input border border-tv-border rounded-lg px-3 py-2 text-xs sm:text-sm text-tv-text focus:outline-none focus:border-tv-accent cursor-pointer"
                >
                  <option value="crossing">Crossing (Up or Down)</option>
                  <option value="crossing_up">Crossing Up (Bullish)</option>
                  <option value="crossing_down">Crossing Down (Bearish)</option>
                  <option value="greater_than">Greater Than or Equal</option>
                  <option value="less_than">Less Than or Equal</option>
                </select>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-xs font-medium text-tv-muted mb-1.5">Target Price</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                    className="w-full bg-tv-input border border-tv-border rounded-lg pl-3 pr-20 py-2 text-sm text-tv-text font-mono focus:outline-none focus:border-tv-accent"
                    placeholder="Enter target price..."
                  />
                  <div className="absolute right-1 top-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTargetPrice(currentPrice.toString())}
                      className="px-2 py-1 text-[11px] bg-tv-hover hover:bg-tv-accent hover:text-white rounded text-tv-muted transition-colors cursor-pointer"
                      title="Set to market price"
                    >
                      Market
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-tv-muted">Quick:</span>
                  {[-2, -1, 1, 2].map((pct) => {
                    const priceWithOffset = currentPrice * (1 + pct / 100);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTargetPrice(priceWithOffset.toFixed(4))}
                        className="px-2 py-0.5 text-[11px] rounded bg-tv-panel hover:bg-tv-hover border border-tv-border text-tv-text cursor-pointer transition-colors"
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Notification */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-tv-muted mb-1.5">Alert Sound</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={soundType}
                      onChange={(e) => {
                        const val = e.target.value as PriceAlert['soundType'];
                        setSoundType(val);
                        handleTestSound(val);
                      }}
                      className="flex-1 bg-tv-input border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text focus:outline-none focus:border-tv-accent cursor-pointer"
                    >
                      <option value="chime">Chime (Default)</option>
                      <option value="beep">Beep Tone</option>
                      <option value="radar">Radar Pulse</option>
                      <option value="bell">Soft Bell</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleTestSound(soundType)}
                      className="p-2 bg-tv-panel hover:bg-tv-hover border border-tv-border rounded-lg text-tv-accent transition-colors cursor-pointer"
                      title="Test sound"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-tv-muted mb-1.5">Frequency</label>
                  <select
                    value={isOneOff ? 'once' : 'every'}
                    onChange={(e) => setIsOneOff(e.target.value === 'once')}
                    className="w-full bg-tv-input border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text focus:outline-none focus:border-tv-accent cursor-pointer"
                  >
                    <option value="once">Only Once</option>
                    <option value="every">Every Time Triggered</option>
                  </select>
                </div>
              </div>

              {/* Note / Message */}
              <div>
                <label className="block text-xs font-medium text-tv-muted mb-1.5">Alert Message (Optional)</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`e.g., Take Profit on ${activeSymbol}`}
                  className="w-full bg-tv-input border border-tv-border rounded-lg px-3 py-2 text-xs sm:text-sm text-tv-text focus:outline-none focus:border-tv-accent"
                />
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-tv-accent hover:bg-tv-accent/90 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  Set Alert for {formatSymbolPrice(activeSymbol, parseFloat(targetPrice) || currentPrice)}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-10 px-4 text-tv-muted">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No active alerts configured</p>
                  <p className="text-xs mt-1">Create an alert to get notified when price crosses key levels.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-3 py-1.5 bg-tv-accent text-white text-xs font-semibold rounded-lg hover:bg-tv-accent/90 transition-colors cursor-pointer"
                  >
                    Create First Alert
                  </button>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                      alert.triggered
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : alert.active 
                          ? 'bg-tv-panel border-tv-border' 
                          : 'bg-tv-panel/40 border-tv-border/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-tv-text">{alert.symbol}</span>
                        <span className="text-xs font-mono font-bold text-tv-accent">
                          {formatSymbolPrice(alert.symbol, alert.targetPrice)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-tv-hover text-tv-muted uppercase font-medium">
                          {alert.condition.replace('_', ' ')}
                        </span>
                        {alert.triggered && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                            Triggered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-tv-muted">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="p-1 text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
                        title={alert.active ? 'Disable Alert' : 'Enable Alert'}
                      >
                        {alert.active ? (
                          <ToggleRight className="w-6 h-6 text-tv-accent" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-tv-muted" />
                        )}
                      </button>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-1.5 text-tv-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
