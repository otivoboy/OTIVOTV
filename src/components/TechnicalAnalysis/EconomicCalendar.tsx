import React, { useState, useEffect } from 'react';
import { Star, ChevronRight, Filter, Clock } from 'lucide-react';

interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  flag: string;
  event: string;
  importance: 1 | 2 | 3;
  actual?: string;
  forecast?: string;
  previous?: string;
  hasSpeech?: boolean;
}

interface DayGroup {
  date: string;
  events: EconomicEvent[];
}

interface EconomicCalendarProps {
  theme?: 'light' | 'dark';
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      // Format as e.g. 5:17 AM (GMT -4:00)
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setCurrentTime(`${timeStr} (GMT -4:00)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const dayGroups: DayGroup[] = [
    {
      date: 'Monday, August 24, 2026',
      events: [
        {
          id: 'ev-1',
          time: '08:30',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'Chicago Fed National Activity (Jul)',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '-0.02',
        },
        {
          id: 'ev-2',
          time: '11:30',
          currency: 'USD',
          flag: '🇺🇸',
          event: '3-Month Bill Auction',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '3.715%',
        },
        {
          id: 'ev-3',
          time: '11:30',
          currency: 'USD',
          flag: '🇺🇸',
          event: '6-Month Bill Auction',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '3.78%',
        },
      ],
    },
    {
      date: 'Tuesday, August 25, 2026',
      events: [
        {
          id: 'ev-4',
          time: '08:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'Building Permits (Jul)',
          importance: 3,
          actual: '',
          forecast: '1.443M',
          previous: '1.374M',
        },
        {
          id: 'ev-5',
          time: '08:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'Building Permits (MoM) (Jul)',
          importance: 2,
          actual: '',
          forecast: '5.00%',
          previous: '-2.60%',
        },
        {
          id: 'ev-6',
          time: '08:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'FOMC Member Barkin Speaks',
          importance: 1,
          hasSpeech: true,
        },
        {
          id: 'ev-7',
          time: '08:15',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'ADP Employment Change Weekly',
          importance: 2,
          actual: '',
          forecast: '',
          previous: '9.50K',
        },
        {
          id: 'ev-8',
          time: '08:55',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'Redbook (YoY)',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '7.60%',
        },
        {
          id: 'ev-9',
          time: '09:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'House Price Index (MoM) (Jun)',
          importance: 2,
          actual: '',
          forecast: '0.20%',
          previous: '0.30%',
        },
        {
          id: 'ev-10',
          time: '09:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'House Price Index (YoY) (Jun)',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '2.20%',
        },
        {
          id: 'ev-11',
          time: '09:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'House Price Index (Jun)',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '442.40',
        },
        {
          id: 'ev-12',
          time: '09:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'S&P/CS HPI Composite - 20 s.a. (MoM) (Jun)',
          importance: 1,
          actual: '',
          forecast: '',
          previous: '0.20%',
        },
        {
          id: 'ev-13',
          time: '09:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'S&P/CS HPI Composite - 20 n.s.a. (YoY) (Jun)',
          importance: 1,
          actual: '',
          forecast: '1.90%',
          previous: '1.60%',
        },
        {
          id: 'ev-14',
          time: '10:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'CB Consumer Confidence (Aug)',
          importance: 3,
          actual: '',
          forecast: '90.30',
          previous: '90.80',
        },
        {
          id: 'ev-15',
          time: '10:00',
          currency: 'USD',
          flag: '🇺🇸',
          event: 'New Home Sales (Jul)',
          importance: 3,
          actual: '',
          forecast: '620.00K',
          previous: '628.00K',
        },
      ],
    },
  ];

  return (
    <div className={`rounded-xl p-4 transition-all ${
      isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-tv-border/40">
        <div className="flex items-center gap-1.5 cursor-pointer group">
          <h2 className="text-base font-bold text-tv-text tracking-tight group-hover:text-tv-accent transition-colors flex items-center gap-1">
            <span>Economic Calendar</span>
            <ChevronRight className="w-4 h-4 text-tv-muted group-hover:translate-x-0.5 transition-transform" />
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-tv-muted font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Current Time: <strong className="text-tv-text font-semibold">{currentTime || '5:17 AM (GMT -4:00)'}</strong></span>
        </div>
      </div>

      {/* Tables by Day */}
      <div className="space-y-4">
        {dayGroups.map((group) => (
          <div key={group.date} className="overflow-hidden">
            {/* Day Header Bar */}
            <div className={`py-1.5 px-3 text-xs font-bold text-center tracking-wide rounded-t-md select-none ${
              isDark ? 'bg-[#2a2e39]/60 text-tv-text' : 'bg-gray-100/80 text-gray-700'
            }`}>
              {group.date}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-[#2a2e39] text-[#787b86]' : 'border-gray-100 text-gray-400'} font-semibold select-none`}>
                    <th className="py-2 px-2.5 w-16">Time</th>
                    <th className="py-2 px-2 w-14">Cur.</th>
                    <th className="py-2 px-2.5">Event</th>
                    <th className="py-2 px-2 w-20 text-center">Imp.</th>
                    <th className="py-2 px-2 w-20 text-right">Actual</th>
                    <th className="py-2 px-2 w-20 text-right">Forecast</th>
                    <th className="py-2 px-2.5 w-20 text-right">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tv-border/20 font-medium">
                  {group.events.map((item) => (
                    <tr 
                      key={item.id}
                      className={`hover:bg-tv-hover/50 transition-colors ${item.importance === 3 ? (isDark ? 'bg-amber-500/[0.03]' : 'bg-amber-500/[0.04]') : ''}`}
                    >
                      <td className="py-2 px-2.5 font-mono text-tv-muted font-semibold">
                        {item.time}
                      </td>
                      <td className="py-2 px-2 flex items-center gap-1 font-mono text-tv-text font-bold">
                        <span>{item.flag}</span>
                        <span className="text-[11px]">{item.currency}</span>
                      </td>
                      <td className="py-2 px-2.5 text-tv-text">
                        <span className="hover:text-tv-accent cursor-pointer transition-colors font-medium">
                          {item.event}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center select-none">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3 h-3 ${
                                starIdx <= item.importance
                                  ? 'text-amber-400 fill-amber-400'
                                  : isDark ? 'text-gray-700' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-tv-text">
                        {item.actual || '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-tv-muted">
                        {item.forecast || '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-tv-muted">
                        {item.previous || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
