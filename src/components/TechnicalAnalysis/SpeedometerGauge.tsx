import React from 'react';
import { SignalRating } from '../../lib/technicalCalculations';

interface SpeedometerGaugeProps {
  title: string;
  rating: SignalRating;
  buy: number;
  neutral: number;
  sell: number;
  scorePercent: number; // -100 to 100
  isSummary?: boolean;
  theme?: 'light' | 'dark';
}

const SpeedometerGaugeComponent: React.FC<SpeedometerGaugeProps> = ({
  title,
  rating,
  buy,
  neutral,
  sell,
  scorePercent,
  isSummary = false,
  theme = 'light',
}) => {
  // Map rating or scorePercent to angle (-90deg = far left, +90deg = far right)
  const getAngle = () => {
    if (typeof scorePercent === 'number' && !isNaN(scorePercent)) {
      const clamped = Math.max(-100, Math.min(100, scorePercent));
      return (clamped / 100) * 72;
    }
    switch (rating) {
      case 'Strong Sell': return -70;
      case 'Sell': return -35;
      case 'Neutral': return 0;
      case 'Buy': return 38;
      case 'Strong Buy': return 72;
      default: return 0;
    }
  };

  const needleAngle = getAngle();

  // Color config for badges
  const getRatingStyle = (r: SignalRating) => {
    switch (r) {
      case 'Strong Buy':
        return 'bg-[#00b061] text-white shadow-sm hover:brightness-105';
      case 'Buy':
        return 'bg-[#26a69a] text-white shadow-sm hover:brightness-105';
      case 'Neutral':
        return 'bg-[#787b86] text-white shadow-sm';
      case 'Sell':
        return 'bg-[#ef5350] text-white shadow-sm hover:brightness-105';
      case 'Strong Sell':
        return 'bg-[#c62828] text-white shadow-sm hover:brightness-105';
    }
  };

  const isDark = theme === 'dark';
  const textColor = isDark ? '#d1d4dc' : '#131722';
  const labelColor = isDark ? '#787b86' : '#8c909a';
  const needleColor = isDark ? '#e0e3eb' : '#2a2e39';
  const pivotBg = isDark ? '#1e222d' : '#ffffff';

  const width = isSummary ? 320 : 260;
  const height = isSummary ? 175 : 145;
  const cx = width / 2;
  const cy = height - 15;
  const r = isSummary ? 120 : 96;
  const strokeW = isSummary ? 14 : 11;

  // Arc path generator helper
  const createArc = (startAngleDeg: number, endAngleDeg: number, radius: number) => {
    const startRad = (startAngleDeg - 180) * (Math.PI / 180);
    const endRad = (endAngleDeg - 180) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className={`flex flex-col items-center justify-between p-4 rounded-xl transition-all ${
      isDark ? 'bg-[#1e222d]/60 border border-[#2a2e39]' : 'bg-white border border-gray-100 shadow-xs'
    } ${isSummary ? 'md:scale-105 md:z-10' : ''}`}>
      {/* Title */}
      <h3 className="text-sm font-semibold tracking-tight mb-2 text-tv-text text-center">
        {title}
      </h3>

      {/* Speedometer SVG */}
      <div className="relative flex items-center justify-center my-1 select-none">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <filter id={`needle-shadow-${title.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity={isDark ? "0.6" : "0.25"} />
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={createArc(0, 180, r)}
            fill="none"
            stroke={isDark ? '#2a2e39' : '#e8eaed'}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* 5 Distinct Colored Segments */}
          {/* Strong Sell (0° - 35°) */}
          <path
            d={createArc(2, 34, r)}
            fill="none"
            stroke="#d32f2f"
            strokeWidth={strokeW}
            strokeLinecap="round"
            opacity={rating === 'Strong Sell' ? 1 : 0.85}
          />
          {/* Sell (37° - 71°) */}
          <path
            d={createArc(38, 70, r)}
            fill="none"
            stroke="#ef5350"
            strokeWidth={strokeW}
            opacity={rating === 'Sell' ? 1 : 0.85}
          />
          {/* Neutral (73° - 107°) */}
          <path
            d={createArc(74, 106, r)}
            fill="none"
            stroke="#9e9e9e"
            strokeWidth={strokeW}
            opacity={rating === 'Neutral' ? 1 : 0.85}
          />
          {/* Buy (109° - 143°) */}
          <path
            d={createArc(110, 142, r)}
            fill="none"
            stroke="#4caf50"
            strokeWidth={strokeW}
            opacity={rating === 'Buy' ? 1 : 0.85}
          />
          {/* Strong Buy (145° - 178°) */}
          <path
            d={createArc(146, 178, r)}
            fill="none"
            stroke="#00b061"
            strokeWidth={strokeW}
            strokeLinecap="round"
            opacity={rating === 'Strong Buy' ? 1 : 0.85}
          />

          {/* Gauge Labels */}
          {isSummary ? (
            <>
              <text x={cx - r + 8} y={cy + 14} textAnchor="start" fill={labelColor} fontSize="10.5" fontWeight="500">
                Strong Sell
              </text>
              <text x={cx - r * 0.7} y={cy - r * 0.7 + 6} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="500">
                Sell
              </text>
              <text x={cx} y={cy - r - 8} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="500">
                Neutral
              </text>
              <text x={cx + r * 0.7} y={cy - r * 0.7 + 6} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="500">
                Buy
              </text>
              <text x={cx + r - 8} y={cy + 14} textAnchor="end" fill={labelColor} fontSize="10.5" fontWeight="500">
                Strong Buy
              </text>
            </>
          ) : (
            <>
              <text x={cx - r * 0.65} y={cy - r * 0.6} textAnchor="middle" fill={labelColor} fontSize="10.5" fontWeight="500">
                Sell
              </text>
              <text x={cx} y={cy - r - 7} textAnchor="middle" fill={labelColor} fontSize="10.5" fontWeight="500">
                Neutral
              </text>
              <text x={cx + r * 0.65} y={cy - r * 0.6} textAnchor="middle" fill={labelColor} fontSize="10.5" fontWeight="500">
                Buy
              </text>
            </>
          )}

          {/* Rotating Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            filter={`url(#needle-shadow-${title.replace(/\s+/g, '')})`}
          >
            {/* Needle shape: Tapered polygon */}
            <polygon
              points={`${cx - 2.5},${cy} ${cx + 2.5},${cy} ${cx},${cy - r + 14}`}
              fill={needleColor}
            />
            {/* Center Pivot circles */}
            <circle cx={cx} cy={cy} r={7} fill={needleColor} />
            <circle cx={cx} cy={cy} r={3.5} fill={pivotBg} />
          </g>
        </svg>
      </div>

      {/* Prominent Action Pill Badge */}
      <div className="my-2 flex flex-col items-center">
        <div
          className={`px-5 py-1.5 rounded-full font-bold text-xs tracking-wide transition-all uppercase ${getRatingStyle(rating)}`}
        >
          {rating}
        </div>
      </div>

      {/* Breakdown counters (Buy / Neutral / Sell) */}
      <div className="flex items-center gap-3 text-[11px] font-medium text-tv-muted select-none mt-1">
        <span className="flex items-center gap-1">
          <span className="text-red-500 font-semibold">{sell}</span>
          <span>Sell</span>
        </span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <span className="flex items-center gap-1">
          <span className="text-gray-500 font-semibold">{neutral}</span>
          <span>Neutral</span>
        </span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <span className="flex items-center gap-1">
          <span className="text-[#00b061] font-semibold">{buy}</span>
          <span>Buy</span>
        </span>
      </div>
    </div>
  );
};

export const SpeedometerGauge = React.memo(SpeedometerGaugeComponent);
