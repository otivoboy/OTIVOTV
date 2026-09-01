import React from 'react';

interface OtivoPreloaderProps {
  className?: string;
  scale?: number;
  showCaption?: boolean;
  statusText?: string;
}

export const OtivoPreloader: React.FC<OtivoPreloaderProps> = ({
  className = '',
  scale = 1,
  showCaption = true,
  statusText,
}) => {
  return (
    <div 
      className={`otivo-container flex flex-col items-center justify-center select-none ${className}`}
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}
    >
      <div className="otivo-loader flex items-center justify-center">
        {/* Gradients Definitions */}
        <svg height="0" width="0" viewBox="0 0 64 64" className="absolute w-0 h-0 overflow-hidden">
          <defs>
            {/* O - Metallic Emerald Bullish Gradient */}
            <linearGradient y2="0" x2="1" y1="1" x1="0" id="o-forex-grad">
              <stop stopColor="#10B981" offset="0%" />
              <stop stopColor="#059669" offset="50%" />
              <stop stopColor="#34D399" offset="100%" />
            </linearGradient>
            
            {/* T - Clean Liquid Cyan Gradient */}
            <linearGradient y2="0" x2="0" y1="1" x1="0" id="t-forex-grad">
              <stop stopColor="#06B6D4" offset="0%" />
              <stop stopColor="#22D3EE" offset="100%" />
            </linearGradient>
            
            {/* I - Solid Electric Silver Index Gradient */}
            <linearGradient y2="1" x2="0" y1="0" x1="0" id="i-forex-grad">
              <stop stopColor="#F9FAFB" offset="0%" />
              <stop stopColor="#9CA3AF" offset="100%" />
            </linearGradient>
            
            {/* V - Velocity Bearish Coral Gradient */}
            <linearGradient y2="0" x2="1" y1="1" x1="0" id="v-forex-grad">
              <stop stopColor="#EF4444" offset="0%" />
              <stop stopColor="#F87171" offset="100%" />
            </linearGradient>
            
            {/* O2 - Dynamic Global Market Flow Gradient */}
            <linearGradient y2="1" x2="1" y1="0" x1="0" id="o2-forex-grad">
              <stop stopColor="#F59E0B" offset="0%" />
              <stop stopColor="#10B981" offset="100%" />
            </linearGradient>
          </defs>
        </svg>

        {/* O - The Market Compass (Bullish Green Edge) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 64 64" 
          height="64" 
          width="64" 
          className="otivo-inline-block otivo-pulse-slow" 
          style={{ '--glow-color': 'rgba(16, 185, 129, 0.4)' } as React.CSSProperties}
        >
          <circle cx="32" cy="32" r="30" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="7" 
            stroke="url(#o-forex-grad)" 
            d="M 32 32 m 0 -24 a 24 24 0 1 1 0 48 a 24 24 0 1 1 0 -48" 
            className="otivo-spin" 
            id="o" 
            pathLength={360} 
          />
          <path d="M32 20v5M32 39v5M20 32h5M39 32h5" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* T - Tech Bar with Trend Ascend Detail */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 64 64" 
          height="64" 
          width="64" 
          className="otivo-inline-block" 
          style={{ '--glow-color': 'rgba(6, 182, 212, 0.4)' } as React.CSSProperties}
        >
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="6.5" 
            stroke="url(#t-forex-grad)" 
            d="M 12,14 h 40 M 32,14 v 36" 
            className="otivo-dash" 
            id="t" 
            pathLength={360} 
          />
          <path d="M27 22 l5 -5 l5 5" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* I - Candlestick Index Chart Column */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 64 64" 
          height="64" 
          width="64" 
          className="otivo-inline-block" 
          style={{ '--glow-color': 'rgba(249, 250, 251, 0.3)' } as React.CSSProperties}
        >
          <path d="M 32,8 v 48" stroke="rgba(249, 250, 251, 0.3)" strokeWidth="2" strokeLinecap="round" />
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="9" 
            stroke="url(#i-forex-grad)" 
            d="M 32,18 v 28" 
            className="otivo-dash" 
            id="i" 
            pathLength={360} 
          />
        </svg>

        {/* V - Price Action Velocity Vector (Bearish Corner) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 64 64" 
          height="64" 
          width="64" 
          className="otivo-inline-block" 
          style={{ '--glow-color': 'rgba(239, 110, 110, 0.35)' } as React.CSSProperties}
        >
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="6.5" 
            stroke="url(#v-forex-grad)" 
            d="M 14,16 l 18,32 l 18,-32" 
            className="otivo-dash" 
            id="v" 
            pathLength={360} 
          />
          <circle cx="32" cy="48" r="3" fill="#EF4444" />
        </svg>

        {/* O2 - Globular Exchange Ring */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 64 64" 
          height="64" 
          width="64" 
          className="otivo-inline-block otivo-pulse-slow" 
          style={{ '--glow-color': 'rgba(245, 158, 11, 0.35)' } as React.CSSProperties}
        >
          <path 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            strokeWidth="6.5" 
            stroke="url(#o2-forex-grad)" 
            d="M 32 32 m 0 -19 a 19 19 0 1 1 0 38 a 19 19 0 1 1 0 -38" 
            className="otivo-spin" 
            id="o2" 
            pathLength={360} 
          />
          <path d="M26 28a6 6 0 0 1 12-4M38 36a6 6 0 0 1-12 4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {showCaption && (
        <>
          <div className="otivo-ticker-line my-4" />
          <div className="otivo-brand-caption">
            <span className="otivo-accent-bull">▲</span> Forex <span className="otivo-accent-bear">▼</span> Technical Analysis
          </div>
        </>
      )}

      {statusText && (
        <p className="mt-3 text-xs font-mono tracking-wider text-tv-muted uppercase animate-pulse">
          {statusText}
        </p>
      )}
    </div>
  );
};
