import React, { useState, useMemo, useCallback } from 'react';
import { List, RowComponentProps } from 'react-window';
import { Candle } from '../../types';
import { formatSymbolPrice } from '../../lib/priceFormatter';
import { X, Search, Download, ArrowUpRight, ArrowDownRight, Database } from 'lucide-react';

interface CandleHistoryListProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  theme?: 'dark' | 'light';
  onClose: () => void;
}

interface CustomRowProps {
  items: Candle[];
  symbol: string;
}

function CandleRow({ index, style, items, symbol }: RowComponentProps<CustomRowProps>): React.ReactElement | null {
  const candle = items[index];
  if (!candle) return null;

  const isBullish = candle.close >= candle.open;
  const change = candle.close - candle.open;
  const changePct = candle.open > 0 ? (change / candle.open) * 100 : 0;
  const range = candle.high - candle.low;

  const dateObj = new Date(
    typeof candle.time === 'number'
      ? (candle.time > 1e11 ? candle.time : candle.time * 1000)
      : candle.time
  );
  
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      style={style}
      id={`candle-row-${index}`}
      className={`flex items-center px-4 text-xs font-mono border-b border-white/5 transition-colors ${
        index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
      } hover:bg-white/[0.06]`}
    >
      <div className="w-12 text-slate-500 font-sans select-none">{items.length - index}</div>
      <div className="w-44 text-slate-300">
        <span className="text-slate-400 mr-2">{dateStr}</span>
        <span className="font-semibold text-slate-200">{timeStr}</span>
      </div>
      <div className="w-24 text-right text-slate-300">{formatSymbolPrice(candle.open, symbol)}</div>
      <div className="w-24 text-right text-emerald-400/90">{formatSymbolPrice(candle.high, symbol)}</div>
      <div className="w-24 text-right text-rose-400/90">{formatSymbolPrice(candle.low, symbol)}</div>
      <div className={`w-24 text-right font-semibold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
        {formatSymbolPrice(candle.close, symbol)}
      </div>
      <div className={`w-28 text-right flex items-center justify-end gap-1 ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isBullish ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{change >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}</span>
      </div>
      <div className="w-24 text-right text-slate-400">{formatSymbolPrice(range, symbol)}</div>
    </div>
  );
};

export const CandleHistoryList: React.FC<CandleHistoryListProps> = ({
  candles,
  symbol,
  timeframe,
  theme = 'dark',
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Reverse so the newest candle appears at top
  const sortedCandles = useMemo(() => {
    return [...candles].reverse();
  }, [candles]);

  const filteredCandles = useMemo(() => {
    if (!searchTerm.trim()) return sortedCandles;
    const term = searchTerm.toLowerCase();
    return sortedCandles.filter(c => {
      const dateObj = new Date(
        typeof c.time === 'number'
          ? (c.time > 1e11 ? c.time : c.time * 1000)
          : c.time
      );
      const str = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()} ${c.open} ${c.close} ${c.high} ${c.low}`.toLowerCase();
      return str.includes(term);
    });
  }, [sortedCandles, searchTerm]);

  const handleExportCSV = useCallback(() => {
    if (filteredCandles.length === 0) return;
    const headers = ['Time', 'Date', 'Open', 'High', 'Low', 'Close'];
    const rows = filteredCandles.map(c => {
      const d = new Date(
        typeof c.time === 'number'
          ? (c.time > 1e11 ? c.time : c.time * 1000)
          : c.time
      );
      return [
        d.toISOString(),
        d.toLocaleDateString(),
        c.open,
        c.high,
        c.low,
        c.close
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${symbol}_${timeframe}_candles_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredCandles, symbol, timeframe]);

  const rowProps: CustomRowProps = useMemo(() => ({
    items: filteredCandles,
    symbol
  }), [filteredCandles, symbol]);

  return (
    <div 
      id="candle-history-virtual-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#161a25] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1e2230]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Candle Data Window
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {symbol} • {timeframe.toUpperCase()}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {filteredCandles.length.toLocaleString()} Bars (Virtualized)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                High-performance virtual scrolling rendering 1000+ bars with zero DOM overhead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="export-candles-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              id="close-candle-history-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-[#1a1e2b] border-b border-white/5">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="candle-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search date, price..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Displaying <span className="text-white font-semibold">{filteredCandles.length}</span> of {candles.length} total bars
          </div>
        </div>

        {/* Table Columns Header */}
        <div className="flex items-center px-4 py-2.5 bg-[#131620] border-b border-white/10 text-xs font-semibold text-slate-400 select-none">
          <div className="w-12">#</div>
          <div className="w-44">Date & Time</div>
          <div className="w-24 text-right">Open</div>
          <div className="w-24 text-right text-emerald-400">High</div>
          <div className="w-24 text-right text-rose-400">Low</div>
          <div className="w-24 text-right">Close</div>
          <div className="w-28 text-right">Change</div>
          <div className="w-24 text-right">Range</div>
        </div>

        {/* Virtualized List using react-window */}
        <div className="flex-1 w-full bg-[#161a25] min-h-0">
          {filteredCandles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Database className="w-8 h-8 opacity-40" />
              <p className="text-sm">No candle records match your query.</p>
            </div>
          ) : (
            <List
              rowCount={filteredCandles.length}
              rowHeight={35}
              rowComponent={CandleRow}
              rowProps={rowProps}
              style={{ height: '100%', width: '100%' }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#181c28] border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time candle feed connected
          </span>
          <span className="text-slate-500">
            Powered by react-window virtual list virtualization
          </span>
        </div>
      </div>
    </div>
  );
};
