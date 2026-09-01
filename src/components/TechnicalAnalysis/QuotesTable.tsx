import React, { useMemo } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { formatSymbolPrice } from '../../lib/priceFormatter';

interface QuoteRow {
  exchange: string;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  chgPercent: number;
  currency: string;
  time: string;
  isRealtime?: boolean;
}

interface QuotesTableProps {
  symbolDisplay: string;
  symbolId: string;
  currentPrice: number;
  theme?: 'light' | 'dark';
}

const QuotesTableComponent: React.FC<QuotesTableProps> = ({
  symbolDisplay,
  symbolId,
  currentPrice,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Realistic exchange quotes based on current price
  const rows: QuoteRow[] = useMemo(() => {
    const base = currentPrice > 0 ? currentPrice : 2563.85;
    const now = new Date();
    const formatTime = (minusMinutes = 0) => {
      const d = new Date(now.getTime() - minusMinutes * 60000);
      return d.toTimeString().split(' ')[0];
    };

    return [
      {
        exchange: 'Real-time Currencies',
        last: base,
        bid: Number((base * 0.9998).toFixed(4)),
        ask: Number((base * 1.0001).toFixed(4)),
        volume: 0,
        chgPercent: 0.75,
        currency: 'USD',
        time: formatTime(0),
        isRealtime: true,
      },
      {
        exchange: 'Milan',
        last: Number((base * 0.0012).toFixed(3)),
        bid: Number((base * 0.0011).toFixed(3)),
        ask: Number((base * 0.0013).toFixed(3)),
        volume: 0,
        chgPercent: 0.00,
        currency: 'USD',
        time: '21/08',
      },
      {
        exchange: 'Milan',
        last: Number((base * 0.021).toFixed(2)),
        bid: Number((base * 0.0205).toFixed(2)),
        ask: Number((base * 0.0212).toFixed(2)),
        volume: 212,
        chgPercent: 3.60,
        currency: 'USD',
        time: formatTime(9),
      },
      {
        exchange: 'Stockholm',
        last: Number((base * 0.358).toFixed(2)),
        bid: Number((base * 0.356).toFixed(2)),
        ask: Number((base * 0.357).toFixed(2)),
        volume: 348,
        chgPercent: 2.23,
        currency: 'USD',
        time: formatTime(3),
      },
      {
        exchange: 'Frankfurt',
        last: Number((base * 0.156).toFixed(2)),
        bid: Number((base * 0.1558).toFixed(2)),
        ask: Number((base * 0.1562).toFixed(2)),
        volume: 0,
        chgPercent: 0.71,
        currency: 'USD',
        time: formatTime(32),
      },
    ];
  }, [currentPrice]);

  return (
    <div className={`rounded-xl p-4 transition-all ${
      isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-tv-border/40">
        <h2 className="text-base font-bold text-tv-text tracking-tight flex items-center gap-2">
          <span>{symbolDisplay} Quotes</span>
        </h2>
        <div className="flex items-center gap-1.5 text-tv-muted text-xs">
          <button className="p-1 hover:bg-tv-hover rounded transition-colors text-tv-muted hover:text-tv-text" title="Refresh Quotes">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className={`border-b ${isDark ? 'border-[#2a2e39] text-[#787b86]' : 'border-gray-100 text-gray-400'} font-semibold select-none`}>
              <th className="py-2.5 px-2">Exchange</th>
              <th className="py-2.5 px-2 text-right">Last</th>
              <th className="py-2.5 px-2 text-right">Bid</th>
              <th className="py-2.5 px-2 text-right">Ask</th>
              <th className="py-2.5 px-2 text-right">Volume</th>
              <th className="py-2.5 px-2 text-right">Chg. %</th>
              <th className="py-2.5 px-2 text-center">Currency</th>
              <th className="py-2.5 px-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tv-border/20 font-medium">
            {rows.map((row, idx) => (
              <tr 
                key={`${row.exchange}-${idx}`}
                className={`hover:bg-tv-hover/60 transition-colors ${idx === 0 ? (isDark ? 'bg-tv-hover/20' : 'bg-blue-50/20') : ''}`}
              >
                <td className="py-2.5 px-2 flex items-center gap-2 font-semibold text-tv-text">
                  <span className={`w-2 h-2 rounded-full ${row.isRealtime ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400/50'}`} />
                  <span>{row.exchange}</span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono font-bold text-tv-text">
                  {formatSymbolPrice(row.last, symbolId)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-tv-muted">
                  {formatSymbolPrice(row.bid, symbolId)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-tv-muted">
                  {formatSymbolPrice(row.ask, symbolId)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-tv-muted">
                  {row.volume > 0 ? row.volume.toLocaleString() : '0'}
                </td>
                <td className={`py-2.5 px-2 text-right font-mono font-semibold ${row.chgPercent >= 0 ? 'text-[#00b061]' : 'text-[#ef5350]'}`}>
                  {row.chgPercent >= 0 ? `+${row.chgPercent.toFixed(2)}%` : `${row.chgPercent.toFixed(2)}%`}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-tv-muted">
                  {row.currency}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-tv-muted text-[11px]">
                  {row.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const QuotesTable = React.memo(QuotesTableComponent);
