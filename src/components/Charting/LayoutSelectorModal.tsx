import React from 'react';
import { Square, Columns, Rows, Grid2X2, LayoutGrid, Check, X } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { MultiChartLayoutType } from '../../types';

export const LayoutSelectorModal: React.FC = () => {
  const { isLayoutSelectorOpen, setLayoutSelectorOpen, multiLayout, setMultiLayout } = useMarketStore();

  if (!isLayoutSelectorOpen) return null;

  const layouts: { id: MultiChartLayoutType; title: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: '1',
      title: 'Single Chart',
      desc: 'Full screen focused analysis',
      icon: (
        <div className="w-10 h-8 rounded border-2 border-current bg-current/10" />
      )
    },
    {
      id: '2v',
      title: '2 Charts (Vertical)',
      desc: 'Side-by-side multi-timeframe comparison',
      icon: (
        <div className="w-10 h-8 rounded border border-current grid grid-cols-2 gap-0.5 p-0.5">
          <div className="bg-current/20 rounded-xs" />
          <div className="bg-current/20 rounded-xs" />
        </div>
      )
    },
    {
      id: '2h',
      title: '2 Charts (Horizontal)',
      desc: 'Stacked top & bottom views',
      icon: (
        <div className="w-10 h-8 rounded border border-current grid grid-rows-2 gap-0.5 p-0.5">
          <div className="bg-current/20 rounded-xs" />
          <div className="bg-current/20 rounded-xs" />
        </div>
      )
    },
    {
      id: '3v',
      title: '3 Charts Split',
      desc: '1 Main chart with 2 auxiliary panes',
      icon: (
        <div className="w-10 h-8 rounded border border-current grid grid-cols-2 gap-0.5 p-0.5">
          <div className="bg-current/20 rounded-xs" />
          <div className="grid grid-rows-2 gap-0.5">
            <div className="bg-current/20 rounded-xs" />
            <div className="bg-current/20 rounded-xs" />
          </div>
        </div>
      )
    },
    {
      id: '4g',
      title: '4 Charts Grid',
      desc: 'Quad-screen multi-asset monitoring',
      icon: (
        <div className="w-10 h-8 rounded border border-current grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
          <div className="bg-current/20 rounded-xs" />
          <div className="bg-current/20 rounded-xs" />
          <div className="bg-current/20 rounded-xs" />
          <div className="bg-current/20 rounded-xs" />
        </div>
      )
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-tv-border bg-tv-panel/50">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-tv-accent" />
            <h3 className="text-sm font-semibold text-tv-text">Select Chart Layout</h3>
          </div>
          <button 
            onClick={() => setLayoutSelectorOpen(false)}
            className="p-1 hover:bg-tv-hover rounded-md text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Layout list */}
        <div className="p-3 space-y-1.5">
          {layouts.map((item) => {
            const isSelected = multiLayout === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMultiLayout(item.id);
                  setLayoutSelectorOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'bg-tv-accent/10 border-tv-accent text-tv-accent font-semibold' 
                    : 'bg-tv-panel/40 hover:bg-tv-panel border-tv-border text-tv-text'
                }`}
              >
                <div className={`${isSelected ? 'text-tv-accent' : 'text-tv-muted'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{item.title}</div>
                  <div className="text-[11px] text-tv-muted">{item.desc}</div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-tv-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-tv-panel border-t border-tv-border text-[11px] text-tv-muted flex items-center justify-between">
          <span>Synced crosshairs & intervals</span>
          <span className="text-tv-accent font-semibold">Pro View</span>
        </div>
      </div>
    </div>
  );
};
