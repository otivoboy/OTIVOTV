import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, LineChart, PenTool, Clock, Settings, Bell, Camera, RotateCcw, Moon, Sun, ArrowRight, Star, Download } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { INDICATORS_LIST } from '../../lib/indicatorsList';
import { Timeframe } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface SearchItem {
  id: string;
  title: string;
  category: 'symbol' | 'indicator' | 'tool' | 'timeframe' | 'action';
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const QuickSearchModal: React.FC = () => {
  const { 
    isQuickSearchOpen, 
    setQuickSearchOpen, 
    availableSymbols, 
    setSymbol, 
    setTimeframe, 
    addIndicator, 
    setActiveTool, 
    clearDrawings, 
    activeSymbol,
    toggleTheme,
    theme,
    startReplay,
    setAlertModalOpen,
    setChartSettingsOpen,
    setScreenshotModalOpen,
    watchlist
  } = useMarketStore();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(!isQuickSearchOpen);
      } else if (e.key === 'Escape' && isQuickSearchOpen) {
        setQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSearchOpen, setQuickSearchOpen]);

  useEffect(() => {
    if (isQuickSearchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isQuickSearchOpen]);

  if (!isQuickSearchOpen) return null;

  // Build searchable items
  const allItems: SearchItem[] = [];

  // 1. Symbols
  availableSymbols.forEach(sym => {
    const isWatchlisted = (watchlist || []).some(w => w.toLowerCase() === sym.id.toLowerCase() || w.toLowerCase() === sym.symbol.toLowerCase());
    allItems.push({
      id: `sym-${sym.id}`,
      title: `${sym.display} (${sym.symbol})`,
      category: 'symbol',
      description: `${sym.marketDisplay || sym.market}${isWatchlisted ? ' • ⭐ Watchlist' : ''}`,
      icon: isWatchlisted ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setSymbol(sym.id);
        setQuickSearchOpen(false);
      }
    });
  });

  // 2. Indicators
  INDICATORS_LIST.forEach(ind => {
    allItems.push({
      id: `ind-${ind.id}`,
      title: ind.name,
      category: 'indicator',
      description: ind.category,
      icon: <LineChart className="w-4 h-4 text-tv-accent" />,
      action: () => {
        addIndicator({ 
          id: ind.id, 
          name: ind.name, 
          code: ind.code,
          enabled: true,
          params: ind.defaultParams ? { ...ind.defaultParams } : {}
        });
        setQuickSearchOpen(false);
      }
    });
  });

  // 3. Drawing Tools
  [
    { id: 'trendline', name: 'Trend Line' },
    { id: 'ray', name: 'Ray Line' },
    { id: 'horizontal', name: 'Horizontal Line' },
    { id: 'fibonacci', name: 'Fibonacci Retracement' },
    { id: 'rectangle', name: 'Rectangle Box' },
    { id: 'text', name: 'Text Note' },
    { id: 'long_position', name: 'Long Position Tool' },
    { id: 'short_position', name: 'Short Position Tool' },
    { id: 'brush', name: 'Brush Tool' },
  ].forEach(tool => {
    allItems.push({
      id: `tool-${tool.id}`,
      title: tool.name,
      category: 'tool',
      description: 'Drawing Tool',
      icon: <PenTool className="w-4 h-4 text-amber-400" />,
      action: () => {
        setActiveTool(tool.id);
        setQuickSearchOpen(false);
      }
    });
  });

  // 4. Timeframes
  (['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w'] as Timeframe[]).forEach(tf => {
    allItems.push({
      id: `tf-${tf}`,
      title: `Switch Timeframe to ${tf}`,
      category: 'timeframe',
      description: 'Chart Interval',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      action: () => {
        setTimeframe(tf);
        setQuickSearchOpen(false);
      }
    });
  });

  // 5. Actions
  allItems.push(
    {
      id: 'act-alert',
      title: 'Create Price Alert',
      category: 'action',
      description: 'Set price crossing trigger',
      icon: <Bell className="w-4 h-4 text-tv-accent" />,
      action: () => {
        setQuickSearchOpen(false);
        setAlertModalOpen(true);
      }
    },
    {
      id: 'act-replay',
      title: 'Start Bar Replay',
      category: 'action',
      description: 'Rewind and practice simulation',
      icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
      action: () => {
        setQuickSearchOpen(false);
        startReplay();
      }
    },
    {
      id: 'act-screenshot',
      title: 'Take Chart Snapshot',
      category: 'action',
      description: 'Download or copy chart image',
      icon: <Camera className="w-4 h-4 text-purple-400" />,
      action: () => {
        setQuickSearchOpen(false);
        setScreenshotModalOpen(true);
      }
    },
    {
      id: 'act-settings',
      title: 'Chart Properties & Settings',
      category: 'action',
      description: 'Customize colors, scales & grid',
      icon: <Settings className="w-4 h-4 text-gray-400" />,
      action: () => {
        setQuickSearchOpen(false);
        setChartSettingsOpen(true);
      }
    },
    {
      id: 'act-theme',
      title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'action',
      description: 'Appearance toggle',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        toggleTheme();
        setQuickSearchOpen(false);
      }
    },
    {
      id: 'act-clear',
      title: `Clear All Drawings on ${activeSymbol}`,
      category: 'action',
      description: 'Remove lines, channels and shapes',
      icon: <X className="w-4 h-4 text-red-400" />,
      action: () => {
        clearDrawings(activeSymbol);
        setQuickSearchOpen(false);
      }
    },
    ...(!isInstalled && (isInstallable || isIOS) ? [{
      id: 'act-install-pwa',
      title: 'Install OTIVO App (PWA)',
      category: 'action' as const,
      description: 'Install native standalone app on Desktop, Android, or iOS',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setQuickSearchOpen(false);
        if (isInstallable) {
          install();
        }
      }
    }] : [])
  );

  const filteredItems = query.trim()
    ? allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : allItems.slice(0, 20);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-tv-border bg-tv-panel/50">
          <Search className="w-5 h-5 text-tv-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a symbol, indicator, tool, timeframe, or action... (e.g. BTC, RSI, Fib)"
            className="w-full bg-transparent text-sm text-tv-text placeholder:text-tv-muted focus:outline-none"
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-tv-card border border-tv-border rounded text-tv-muted">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-tv-border/20">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-tv-muted text-xs">
              No matching symbols, indicators, or actions found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-tv-accent/15 text-tv-accent font-medium' : 'hover:bg-tv-hover text-tv-text'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-tv-panel border border-tv-border/50 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-tv-muted truncate">{item.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-tv-panel text-tv-muted border border-tv-border/50">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-tv-accent" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-tv-panel border-t border-tv-border flex items-center justify-between text-[11px] text-tv-muted">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-tv-card px-1 rounded border border-tv-border">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-tv-card px-1 rounded border border-tv-border">↵</kbd> Select</span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
};
