import React from 'react';

interface SymbolLogoProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Crisp Vector SVG Flags & Icons
const USFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <clipPath id="circle-clip">
      <circle cx="16" cy="16" r="16" />
    </clipPath>
    <g clipPath="url(#circle-clip)">
      <rect width="32" height="32" fill="#b22234" />
      <path d="M0,4.92h32M0,9.84h32M0,14.76h32M0,19.68h32M0,24.6h32M0,29.52h32" stroke="#ffffff" strokeWidth="2.46" />
      <rect width="14" height="17.2" fill="#3c3b6e" />
      {/* Stars representation */}
      <circle cx="3.5" cy="3.5" r="0.9" fill="#ffffff" />
      <circle cx="7" cy="3.5" r="0.9" fill="#ffffff" />
      <circle cx="10.5" cy="3.5" r="0.9" fill="#ffffff" />
      <circle cx="5.25" cy="6.5" r="0.9" fill="#ffffff" />
      <circle cx="8.75" cy="6.5" r="0.9" fill="#ffffff" />
      <circle cx="3.5" cy="9.5" r="0.9" fill="#ffffff" />
      <circle cx="7" cy="9.5" r="0.9" fill="#ffffff" />
      <circle cx="10.5" cy="9.5" r="0.9" fill="#ffffff" />
      <circle cx="5.25" cy="12.5" r="0.9" fill="#ffffff" />
      <circle cx="8.75" cy="12.5" r="0.9" fill="#ffffff" />
    </g>
  </svg>
);

const EUFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#003399" />
    {/* 12 Yellow Stars in Circle */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x = 16 + 9.5 * Math.sin(rad);
      const y = 16 - 9.5 * Math.cos(rad);
      return <polygon key={deg} points={`${x},${y-1.6} ${x+0.5},${y-0.4} ${x+1.6},${y-0.4} ${x+0.7},${y+0.4} ${x+1.1},${y+1.5} ${x},${y+0.8} ${x-1.1},${y+1.5} ${x-0.7},${y+0.4} ${x-1.6},${y-0.4} ${x-0.5},${y-0.4}`} fill="#ffcc00" />;
    })}
  </svg>
);

const UKFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <clipPath id="uk-clip">
      <circle cx="16" cy="16" r="16" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <rect width="32" height="32" fill="#012169" />
      {/* Diagonals */}
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#ffffff" strokeWidth="5.5" />
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#c8102e" strokeWidth="2" />
      {/* Cross */}
      <path d="M16,0 V32 M0,16 H32" stroke="#ffffff" strokeWidth="8" />
      <path d="M16,0 V32 M0,16 H32" stroke="#c8102e" strokeWidth="4.8" />
    </g>
  </svg>
);

const JPFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#ffffff" stroke="#e0e3eb" strokeWidth="1" />
    <circle cx="16" cy="16" r="7" fill="#bc002d" />
  </svg>
);

const CHFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#d52b1e" />
    <rect x="13" y="7" width="6" height="18" fill="#ffffff" rx="0.5" />
    <rect x="7" y="13" width="18" height="6" fill="#ffffff" rx="0.5" />
  </svg>
);

const CADFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <clipPath id="cad-clip">
      <circle cx="16" cy="16" r="16" />
    </clipPath>
    <g clipPath="url(#cad-clip)">
      <rect width="32" height="32" fill="#ff0000" />
      <rect x="8" width="16" height="32" fill="#ffffff" />
      {/* Maple Leaf */}
      <path
        d="M16,7 L17.5,12 L21,11 L19,14.5 L22.5,16.5 L20.5,18 L21.5,21.5 L17.5,19.5 L17,24 L15,24 L14.5,19.5 L10.5,21.5 L11.5,18 L9.5,16.5 L13,14.5 L11,11 L14.5,12 Z"
        fill="#ff0000"
      />
    </g>
  </svg>
);

const AUDFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <clipPath id="aud-clip">
      <circle cx="16" cy="16" r="16" />
    </clipPath>
    <g clipPath="url(#aud-clip)">
      <rect width="32" height="32" fill="#00008b" />
      {/* Mini UK in canton */}
      <g transform="scale(0.5)">
        <rect width="32" height="32" fill="#012169" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#ffffff" strokeWidth="5" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#c8102e" strokeWidth="2" />
        <path d="M16,0 V32 M0,16 H32" stroke="#ffffff" strokeWidth="8" />
        <path d="M16,0 V32 M0,16 H32" stroke="#c8102e" strokeWidth="4.5" />
      </g>
      {/* Federation Star & Southern Cross */}
      <circle cx="8" cy="23" r="2.2" fill="#ffffff" />
      <circle cx="24" cy="8" r="1.3" fill="#ffffff" />
      <circle cx="27" cy="13" r="1.3" fill="#ffffff" />
      <circle cx="21" cy="15" r="1.3" fill="#ffffff" />
      <circle cx="24" cy="22" r="1.3" fill="#ffffff" />
    </g>
  </svg>
);

const NZDFlag = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <clipPath id="nzd-clip">
      <circle cx="16" cy="16" r="16" />
    </clipPath>
    <g clipPath="url(#nzd-clip)">
      <rect width="32" height="32" fill="#00247d" />
      {/* Mini UK in canton */}
      <g transform="scale(0.5)">
        <rect width="32" height="32" fill="#012169" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#ffffff" strokeWidth="5" />
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#c8102e" strokeWidth="2" />
        <path d="M16,0 V32 M0,16 H32" stroke="#ffffff" strokeWidth="8" />
        <path d="M16,0 V32 M0,16 H32" stroke="#c8102e" strokeWidth="4.5" />
      </g>
      {/* Red Stars with white borders */}
      <circle cx="24" cy="8" r="1.6" fill="#ffffff" />
      <circle cx="24" cy="8" r="1.1" fill="#cc142b" />
      <circle cx="27" cy="14" r="1.6" fill="#ffffff" />
      <circle cx="27" cy="14" r="1.1" fill="#cc142b" />
      <circle cx="21" cy="17" r="1.6" fill="#ffffff" />
      <circle cx="21" cy="17" r="1.1" fill="#cc142b" />
      <circle cx="24" cy="24" r="1.8" fill="#ffffff" />
      <circle cx="24" cy="24" r="1.3" fill="#cc142b" />
    </g>
  </svg>
);

// Gold Ingot component matching TradingView gold icon (3 gold ingots in pyramid)
const SingleIngot = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Outer rounded trapezoid body in solid white */}
    <path
      d="M3.2,0.6 L8.8,0.6 C9.5,0.6 10.1,1.1 10.3,1.7 L11.8,6.3 C12.1,7.2 11.5,8.0 10.6,8.0 L1.4,8.0 C0.5,8.0 -0.1,7.2 0.2,6.3 L1.7,1.7 C1.9,1.1 2.5,0.6 3.2,0.6 Z"
      fill="#ffffff"
    />
    {/* Top-left cutout triangular wedge leaving the faceted lower-right triangle */}
    <path
      d="M2.6,2.0 L8.4,2.0 C8.7,2.0 8.9,2.3 8.7,2.6 L2.2,6.8 C1.8,7.1 1.2,6.7 1.4,6.2 L2.2,2.4 C2.3,2.2 2.4,2.0 2.6,2.0 Z"
      fill="#cca000"
    />
  </g>
);

// Gold Asset Icon (TradingView 3-Ingot Emblem on Ochre Background matching user specification)
const GoldIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#cca000" />
    {/* 3 Gold Ingot Bars in Triangle/Pyramid */}
    <SingleIngot x={10} y={6} />
    <SingleIngot x={3.5} y={16.5} />
    <SingleIngot x={16.5} y={16.5} />
  </svg>
);

// Silver Asset Icon
const SilverIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#silver-grad)" />
    <circle cx="16" cy="16" r="13" fill="none" stroke="#e2e8f0" strokeWidth="1" />
    <text x="16" y="20.5" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="#ffffff">
      Ag
    </text>
  </svg>
);

// Bitcoin Icon
const BitcoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#f7931a" />
    <path
      d="M21.2 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1.1-.3l-2.3-.6-.5 1.8s1.2.3 1.2.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.6c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.4c-.5 2.1-4 1-5.1.7l.9-3.7c1.1.3 4.7.8 4.2 3zm.5-5.6c-.5 1.9-3.4.9-4.3.7l.8-3.3c.9.2 4 .7 3.5 2.6z"
      fill="#ffffff"
    />
  </svg>
);

// Ethereum Icon
const EthereumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#627eea" />
    <g transform="translate(8, 5) scale(0.5)">
      <polygon points="16,0 15.6,1.4 15.6,22.1 16,22.5 26.2,16.5" fill="#ffffff" opacity="0.9" />
      <polygon points="16,0 5.8,16.5 16,22.5 16,12.1" fill="#ffffff" opacity="0.7" />
      <polygon points="16,24.4 15.7,24.8 15.7,32.7 16,33.1 26.2,18.8" fill="#ffffff" opacity="0.9" />
      <polygon points="16,33.1 16,24.4 5.8,18.8" fill="#ffffff" opacity="0.7" />
      <polygon points="16,22.5 26.2,16.5 16,12.1" fill="#ffffff" opacity="0.5" />
      <polygon points="5.8,16.5 16,22.5 16,12.1" fill="#ffffff" opacity="0.3" />
    </g>
  </svg>
);

// Synthetic / Volatility Index Icon
const SyntheticPulseIcon = ({ color = '#8b5cf6', text = 'V' }: { color?: string; text?: string }) => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <linearGradient id={`synth-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill={`url(#synth-grad-${color})`} />
    {/* Pulse waveform */}
    <path
      d="M6,17 L10,17 L13,9 L18,23 L22,14 L24,17 L26,17"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Boom Index Icon (Vibrant Emerald Spike Icon)
const BoomIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <linearGradient id="boom-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#boom-gradient)" />
    {/* Upward explosive spike bolt */}
    <path
      d="M17 5L8 17H14.5L12.5 27L23.5 13H16L18.5 5Z"
      fill="#ffffff"
    />
  </svg>
);

// Crash Index Icon (Vibrant Crimson Drop Icon)
const CrashIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <linearGradient id="crash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#881337" />
        <stop offset="50%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#crash-gradient)" />
    {/* Downward crash drop bolt */}
    <path
      d="M15 27L24 15H17.5L19.5 5L8.5 19H16L13.5 27Z"
      fill="#ffffff"
    />
  </svg>
);

function getCurrencyComponent(code: string): React.ReactNode {
  const upper = code.toUpperCase();
  if (upper === 'EUR') return <EUFlag />;
  if (upper === 'USD') return <USFlag />;
  if (upper === 'GBP') return <UKFlag />;
  if (upper === 'JPY') return <JPFlag />;
  if (upper === 'CHF') return <CHFlag />;
  if (upper === 'CAD') return <CADFlag />;
  if (upper === 'AUD') return <AUDFlag />;
  if (upper === 'NZD') return <NZDFlag />;
  if (upper === 'XAU' || upper === 'GOLD') return <GoldIcon />;
  if (upper === 'XAG' || upper === 'SILVER') return <SilverIcon />;
  if (upper === 'BTC') return <BitcoinIcon />;
  if (upper === 'ETH') return <EthereumIcon />;

  // Default letter badge
  return (
    <div className="w-full h-full rounded-full bg-[#2962ff] flex items-center justify-center text-[9px] font-bold text-white uppercase">
      {upper.slice(0, 2)}
    </div>
  );
}

export const SymbolLogo: React.FC<SymbolLogoProps> = ({ symbol, size = 'md', className = '' }) => {
  const rawSymbol = symbol || '';
  const clean = rawSymbol.toUpperCase().replace(/^FRX|^CRY/, '');

  // Sizing styles
  const sizeMap = {
    xs: { outer: 'w-4 h-4', circle: 'w-3 h-3', offset: '-ml-1.5' },
    sm: { outer: 'w-5 h-5', circle: 'w-3.5 h-3.5', offset: '-ml-1.5' },
    md: { outer: 'w-6 h-5', circle: 'w-4.5 h-4.5', offset: '-ml-2' },
    lg: { outer: 'w-8 h-7', circle: 'w-6 h-6', offset: '-ml-2.5' },
  };

  const sz = sizeMap[size] || sizeMap.md;

  // 1. Boom Indices (BOOM50, BOOM100, BOOM1000, etc.)
  if (clean.startsWith('BOOM')) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sz.outer} ${className}`}>
        <div className="w-full h-full rounded-full overflow-hidden shadow-sm ring-1 ring-emerald-500/30">
          <BoomIcon />
        </div>
      </div>
    );
  }

  // 2. Crash Indices (CRASH50, CRASH100, CRASH1000, etc.)
  if (clean.startsWith('CRASH')) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sz.outer} ${className}`}>
        <div className="w-full h-full rounded-full overflow-hidden shadow-sm ring-1 ring-rose-500/30">
          <CrashIcon />
        </div>
      </div>
    );
  }

  // 3. Synthetic / Volatility Indices (e.g. 1HZ100V, R_100, 1HZ10V, etc.)
  if (
    clean.startsWith('1HZ') || 
    clean.startsWith('R_') || 
    clean.startsWith('VOL') ||
    clean.includes('100V') ||
    clean.includes('75V') ||
    clean.includes('50V') ||
    clean.includes('25V') ||
    clean.includes('10V')
  ) {
    const isHighVol = clean.includes('100') || clean.includes('75');
    const color = isHighVol ? '#f43f5e' : '#8b5cf6';
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sz.outer} ${className}`}>
        <div className="w-full h-full rounded-full overflow-hidden shadow-sm ring-1 ring-black/20">
          <SyntheticPulseIcon color={color} text={clean.slice(0, 3)} />
        </div>
      </div>
    );
  }

  // 2. Gold (XAUUSD / Gold)
  if (clean.includes('XAU') || clean.includes('GOLD')) {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${sz.outer} ${className}`}>
        <div className={`relative z-10 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle}`}>
          <GoldIcon />
        </div>
        <div className={`relative z-0 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle} ${sz.offset}`}>
          <USFlag />
        </div>
      </div>
    );
  }

  // 3. Silver (XAGUSD)
  if (clean.includes('XAG') || clean.includes('SILVER')) {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${sz.outer} ${className}`}>
        <div className={`relative z-10 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle}`}>
          <SilverIcon />
        </div>
        <div className={`relative z-0 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle} ${sz.offset}`}>
          <USFlag />
        </div>
      </div>
    );
  }

  // 4. Crypto (BTCUSD, ETHUSD)
  if (clean.startsWith('BTC') || clean === 'CRYBTCUSD') {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${sz.outer} ${className}`}>
        <div className={`relative z-10 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle}`}>
          <BitcoinIcon />
        </div>
        <div className={`relative z-0 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle} ${sz.offset}`}>
          <USFlag />
        </div>
      </div>
    );
  }

  if (clean.startsWith('ETH') || clean === 'CRYETHUSD') {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${sz.outer} ${className}`}>
        <div className={`relative z-10 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle}`}>
          <EthereumIcon />
        </div>
        <div className={`relative z-0 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle} ${sz.offset}`}>
          <USFlag />
        </div>
      </div>
    );
  }

  // 5. Standard Forex Pairs (e.g. EURUSD, GBPUSD, USDJPY, AUDUSD, etc.)
  // Format is usually 6 letters like EURUSD, GBPJPY, USDCAD
  let base = clean.slice(0, 3);
  let quote = clean.slice(3, 6);

  if (clean.includes('/')) {
    const parts = clean.split('/');
    base = parts[0];
    quote = parts[1] || 'USD';
  } else if (clean.length < 6) {
    base = clean;
    quote = 'USD';
  }

  return (
    <div className={`relative inline-flex items-center shrink-0 ${sz.outer} ${className}`}>
      <div className={`relative z-10 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle}`}>
        {getCurrencyComponent(base)}
      </div>
      <div className={`relative z-0 rounded-full overflow-hidden shadow-sm ring-1 ring-black/20 ${sz.circle} ${sz.offset}`}>
        {getCurrencyComponent(quote)}
      </div>
    </div>
  );
};
