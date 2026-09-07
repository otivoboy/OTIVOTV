import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import { TradingChart } from './TradingChart';
import { Timeframe } from '../../types';

export interface PaneInfo {
  id: string;
  symbol: string;
  timeframe: Timeframe;
}

export const MultiChartContainer: React.FC = () => {
  const { multiLayout, setMultiLayout, activeSymbol, activeTimeframe, setSymbol, setTimeframe } = useMarketStore();
  const [activePaneId, setActivePaneId] = useState<string>('pane-0');

  // Multi-pane state configurations
  const [panes, setPanes] = useState<PaneInfo[]>([
    { id: 'pane-0', symbol: activeSymbol, timeframe: activeTimeframe },
    { id: 'pane-1', symbol: 'cryBTCUSD', timeframe: '5m' },
    { id: 'pane-2', symbol: 'frxXAUUSD', timeframe: '15m' },
    { id: 'pane-3', symbol: '1HZ100V', timeframe: '1h' },
  ]);

  // Keep the active pane synced when global activeSymbol / activeTimeframe changes
  useEffect(() => {
    setPanes(prev => prev.map(p => {
      if (p.id === activePaneId) {
        return { ...p, symbol: activeSymbol, timeframe: activeTimeframe };
      }
      return p;
    }));
  }, [activeSymbol, activeTimeframe, activePaneId]);

  const handleSelectPane = (pane: PaneInfo) => {
    setActivePaneId(pane.id);
    if (pane.symbol !== activeSymbol) setSymbol(pane.symbol);
    if (pane.timeframe !== activeTimeframe) setTimeframe(pane.timeframe);
  };

  const handleUpdatePaneSymbol = (paneId: string, newSymbol: string) => {
    setActivePaneId(paneId);
    setPanes(prev => prev.map(p => p.id === paneId ? { ...p, symbol: newSymbol } : p));
    setSymbol(newSymbol);
  };

  const handleUpdatePaneTimeframe = (paneId: string, newTimeframe: Timeframe) => {
    setActivePaneId(paneId);
    setPanes(prev => prev.map(p => p.id === paneId ? { ...p, timeframe: newTimeframe } : p));
    setTimeframe(newTimeframe);
  };

  const handleMaximizePane = (pane: PaneInfo) => {
    setActivePaneId(pane.id);
    setSymbol(pane.symbol);
    setTimeframe(pane.timeframe);
    setMultiLayout('1');
  };

  // 1. Single Chart Mode (100% full screen)
  if (multiLayout === '1') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <TradingChart />
      </div>
    );
  }

  // 2. 2 Charts Vertical Split (Left / Right side-by-side)
  if (multiLayout === '2v') {
    const pane0 = panes[0] || { id: 'pane-0', symbol: activeSymbol, timeframe: activeTimeframe };
    const pane1 = panes[1] || { id: 'pane-1', symbol: 'cryBTCUSD', timeframe: '5m' };

    return (
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-1 bg-tv-border overflow-hidden p-0.5" id="multi-chart-split-2v">
        <div key={pane0.id} className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane0.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
          <TradingChart
            paneId={pane0.id}
            symbol={pane0.symbol}
            timeframe={pane0.timeframe}
            isActivePane={activePaneId === pane0.id}
            onSelectPane={() => handleSelectPane(pane0)}
            onSymbolChange={(sym) => handleUpdatePaneSymbol(pane0.id, sym)}
            onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane0.id, tf)}
            onMaximizePane={() => handleMaximizePane(pane0)}
            showPaneHeader={true}
          />
        </div>
        <div key={pane1.id} className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane1.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
          <TradingChart
            paneId={pane1.id}
            symbol={pane1.symbol}
            timeframe={pane1.timeframe}
            isActivePane={activePaneId === pane1.id}
            onSelectPane={() => handleSelectPane(pane1)}
            onSymbolChange={(sym) => handleUpdatePaneSymbol(pane1.id, sym)}
            onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane1.id, tf)}
            onMaximizePane={() => handleMaximizePane(pane1)}
            showPaneHeader={true}
          />
        </div>
      </div>
    );
  }

  // 3. 2 Charts Horizontal Split (Top / Bottom stacked)
  if (multiLayout === '2h') {
    const pane0 = panes[0] || { id: 'pane-0', symbol: activeSymbol, timeframe: activeTimeframe };
    const pane1 = panes[1] || { id: 'pane-1', symbol: 'cryBTCUSD', timeframe: '1h' };

    return (
      <div className="w-full h-full grid grid-rows-2 gap-1 bg-tv-border overflow-hidden p-0.5" id="multi-chart-split-2h">
        <div key={pane0.id} className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane0.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
          <TradingChart
            paneId={pane0.id}
            symbol={pane0.symbol}
            timeframe={pane0.timeframe}
            isActivePane={activePaneId === pane0.id}
            onSelectPane={() => handleSelectPane(pane0)}
            onSymbolChange={(sym) => handleUpdatePaneSymbol(pane0.id, sym)}
            onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane0.id, tf)}
            onMaximizePane={() => handleMaximizePane(pane0)}
            showPaneHeader={true}
          />
        </div>
        <div key={pane1.id} className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane1.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
          <TradingChart
            paneId={pane1.id}
            symbol={pane1.symbol}
            timeframe={pane1.timeframe}
            isActivePane={activePaneId === pane1.id}
            onSelectPane={() => handleSelectPane(pane1)}
            onSymbolChange={(sym) => handleUpdatePaneSymbol(pane1.id, sym)}
            onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane1.id, tf)}
            onMaximizePane={() => handleMaximizePane(pane1)}
            showPaneHeader={true}
          />
        </div>
      </div>
    );
  }

  // 4. 3 Charts Split (1 Master Left + 2 Stacked Right)
  if (multiLayout === '3v') {
    const pane0 = panes[0] || { id: 'pane-0', symbol: activeSymbol, timeframe: activeTimeframe };
    const pane1 = panes[1] || { id: 'pane-1', symbol: 'cryBTCUSD', timeframe: '15m' };
    const pane2 = panes[2] || { id: 'pane-2', symbol: 'frxXAUUSD', timeframe: '1h' };

    return (
      <div className="w-full h-full flex flex-col md:flex-row gap-1 bg-tv-border overflow-hidden p-0.5" id="multi-chart-split-3v">
        {/* Left Column (Master Chart) */}
        <div key={pane0.id} className={`relative h-1/2 md:h-full md:w-3/5 min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane0.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
          <TradingChart
            paneId={pane0.id}
            symbol={pane0.symbol}
            timeframe={pane0.timeframe}
            isActivePane={activePaneId === pane0.id}
            onSelectPane={() => handleSelectPane(pane0)}
            onSymbolChange={(sym) => handleUpdatePaneSymbol(pane0.id, sym)}
            onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane0.id, tf)}
            onMaximizePane={() => handleMaximizePane(pane0)}
            showPaneHeader={true}
          />
        </div>

        {/* Right Column (2 Stacked Aux Charts) */}
        <div className="h-1/2 md:h-full md:w-2/5 min-h-0 min-w-0 flex flex-col gap-1 overflow-hidden">
          <div key={pane1.id} className={`relative h-1/2 w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane1.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
            <TradingChart
              paneId={pane1.id}
              symbol={pane1.symbol}
              timeframe={pane1.timeframe}
              isActivePane={activePaneId === pane1.id}
              onSelectPane={() => handleSelectPane(pane1)}
              onSymbolChange={(sym) => handleUpdatePaneSymbol(pane1.id, sym)}
              onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane1.id, tf)}
              onMaximizePane={() => handleMaximizePane(pane1)}
              showPaneHeader={true}
            />
          </div>
          <div key={pane2.id} className={`relative h-1/2 w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${activePaneId === pane2.id ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}>
            <TradingChart
              paneId={pane2.id}
              symbol={pane2.symbol}
              timeframe={pane2.timeframe}
              isActivePane={activePaneId === pane2.id}
              onSelectPane={() => handleSelectPane(pane2)}
              onSymbolChange={(sym) => handleUpdatePaneSymbol(pane2.id, sym)}
              onTimeframeChange={(tf) => handleUpdatePaneTimeframe(pane2.id, tf)}
              onMaximizePane={() => handleMaximizePane(pane2)}
              showPaneHeader={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. 4 Charts Grid (2x2 Quad View)
  if (multiLayout === '4g') {
    const pane0 = panes[0] || { id: 'pane-0', symbol: activeSymbol, timeframe: activeTimeframe };
    const pane1 = panes[1] || { id: 'pane-1', symbol: 'cryBTCUSD', timeframe: '5m' };
    const pane2 = panes[2] || { id: 'pane-2', symbol: 'frxXAUUSD', timeframe: '15m' };
    const pane3 = panes[3] || { id: 'pane-3', symbol: '1HZ100V', timeframe: '1h' };

    const gridPanes = [pane0, pane1, pane2, pane3];

    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-tv-border overflow-hidden p-0.5" id="multi-chart-split-4g">
        {gridPanes.map((p) => {
          const isActive = activePaneId === p.id;
          return (
            <div 
              key={p.id} 
              className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xs transition-all ${isActive ? 'ring-2 ring-tv-accent z-10' : 'opacity-95'}`}
            >
              <TradingChart
                paneId={p.id}
                symbol={p.symbol}
                timeframe={p.timeframe}
                isActivePane={isActive}
                onSelectPane={() => handleSelectPane(p)}
                onSymbolChange={(sym) => handleUpdatePaneSymbol(p.id, sym)}
                onTimeframeChange={(tf) => handleUpdatePaneTimeframe(p.id, tf)}
                onMaximizePane={() => handleMaximizePane(p)}
                showPaneHeader={true}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <TradingChart />
    </div>
  );
};
