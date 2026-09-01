import React, { useEffect } from 'react';
import { BellRing, X, Check, ArrowRight } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { formatSymbolPrice } from '../../lib/priceFormatter';

export const TriggeredAlertToast: React.FC = () => {
  const { latestTriggeredAlert, dismissTriggeredAlert, setSymbol, activeSymbol } = useMarketStore();

  useEffect(() => {
    if (!latestTriggeredAlert) return;
    const timer = setTimeout(() => {
      dismissTriggeredAlert();
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestTriggeredAlert, dismissTriggeredAlert]);

  if (!latestTriggeredAlert) return null;

  const isCurrentSymbol = latestTriggeredAlert.symbol.toLowerCase() === activeSymbol.toLowerCase();

  return (
    <div className="fixed top-16 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
      <div className="p-4 rounded-xl bg-tv-card border-2 border-tv-accent shadow-2xl flex items-start gap-3 backdrop-blur-md">
        <div className="p-2.5 rounded-lg bg-tv-accent text-white shrink-0 animate-bounce">
          <BellRing className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tv-accent uppercase tracking-wider">
              Alert Triggered!
            </span>
            <button 
              onClick={dismissTriggeredAlert}
              className="text-tv-muted hover:text-tv-text p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-tv-text mt-0.5">
            {latestTriggeredAlert.symbol} crossed {formatSymbolPrice(latestTriggeredAlert.symbol, latestTriggeredAlert.targetPrice)}
          </h4>
          <p className="text-xs text-tv-muted mt-1 break-words">
            {latestTriggeredAlert.message}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {!isCurrentSymbol && (
              <button
                onClick={() => {
                  setSymbol(latestTriggeredAlert.symbol);
                  dismissTriggeredAlert();
                }}
                className="px-2.5 py-1 bg-tv-accent hover:bg-tv-accent/90 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                Switch to {latestTriggeredAlert.symbol}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={dismissTriggeredAlert}
              className="px-2.5 py-1 bg-tv-panel hover:bg-tv-hover border border-tv-border text-tv-text rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
