export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Tick {
  symbol: string;
  price: number;
  time: number;
}

export interface MarketSymbol {
  id: string;
  symbol: string;
  display: string;
  market: string;
  marketDisplay?: string;
  submarket?: string;
  submarketDisplay?: string;
  pip?: number;
  isOpen?: boolean;
}

export interface AISignal {
  signal: 'BUY' | 'SELL' | 'WAIT';
  strength: number;
  reason: string;
}

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d' | '1w';

export type ChartType = 
  | 'candlestick' 
  | 'bars' 
  | 'hollow_candlestick' 
  | 'heikin_ashi' 
  | 'line' 
  | 'area' 
  | 'baseline' 
  | 'stepline';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'crossing' | 'crossing_up' | 'crossing_down' | 'greater_than' | 'less_than';
  createdPrice: number;
  createdAt: number;
  message: string;
  triggered: boolean;
  triggeredAt?: number;
  soundEnabled: boolean;
  soundType: 'chime' | 'beep' | 'radar' | 'bell';
  isOneOff: boolean;
  active: boolean;
}

export interface ChartSettings {
  candleUpColor: string;
  candleDownColor: string;
  wickUpColor: string;
  wickDownColor: string;
  showGridLines: boolean;
  gridLineColor: string;
  showWatermark: boolean;
  showCountdown: boolean;
  showHighLowLines: boolean;
  showVolume: boolean;
  timezone: string;
  precision: number;
}

export interface SavedChartLayout {
  id: string;
  name: string;
  updatedAt: number;
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: any[];
  drawings: any[];
  settings?: Partial<ChartSettings>;
}

export type MultiChartLayoutType = '1' | '2h' | '2v' | '3v' | '4g';

export interface ReplayState {
  isActive: boolean;
  isPaused: boolean;
  speed: number; // in milliseconds per step (e.g. 1000 = 1s)
  currentIndex: number; // index into fullCandles
  totalCandles: number;
  selectedCutoffIndex: number;
}

export interface AuthUser {
  uid: string;
  phoneNumber?: string | null;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}
