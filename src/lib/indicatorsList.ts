export interface IndicatorParamDef {
  key: string;
  name: string;
  type: 'int' | 'float' | 'bool' | 'select' | 'color';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  description?: string;
  category?: 'General' | 'Calculations' | 'Visuals' | 'Directions & Signals';
}

export interface IndicatorPreset {
  id: string;
  name: string;
  category: 'Trend' | 'Oscillator' | 'Volatility' | 'Smart Money' | 'Order Flow' | 'Strategies' | 'Sessions' | 'Custom';
  description: string;
  overlay: boolean;
  code: string;
  defaultParams?: Record<string, any>;
  paramDefinitions?: IndicatorParamDef[];
}

export const BUILTIN_INDICATORS: IndicatorPreset[] = [
  {
    id: 'rsi_14',
    name: 'Relative Strength Index (RSI)',
    category: 'Oscillator',
    description: 'Measures momentum and speed of directional price changes to evaluate overbought (70) and oversold (30) market regimes.',
    overlay: false,
    defaultParams: {
      length: 14,
      source: 'close',
      overbought: 70,
      oversold: 30,
      midline: 50,
      plot_color: '#ab47bc',
      show_bands: true,
      show_divergences: true
    },
    paramDefinitions: [
      { key: 'length', name: 'RSI Length', type: 'int', default: 14, min: 2, max: 100, category: 'Calculations' },
      { 
        key: 'source', 
        name: 'Price Source', 
        type: 'select', 
        default: 'close', 
        options: [
          { label: 'Close', value: 'close' },
          { label: 'Open', value: 'open' },
          { label: 'High', value: 'high' },
          { label: 'Low', value: 'low' },
          { label: 'HL2 (High+Low)/2', value: 'hl2' },
          { label: 'HLC3 (High+Low+Close)/3', value: 'hlc3' }
        ],
        category: 'Calculations'
      },
      { key: 'overbought', name: 'Overbought Level', type: 'int', default: 70, min: 50, max: 95, category: 'Calculations' },
      { key: 'oversold', name: 'Oversold Level', type: 'int', default: 30, min: 5, max: 50, category: 'Calculations' },
      { key: 'plot_color', name: 'RSI Line Color', type: 'color', default: '#ab47bc', category: 'Visuals' },
      { key: 'show_bands', name: 'Display 70/50/30 Thresholds', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_divergences', name: 'Detect RSI Regular Divergences', type: 'bool', default: true, category: 'Directions & Signals' }
    ],
    code: `//@version=5
indicator("RSI", overlay=false)
length = input.int(14, "Length")
source = input.string("close", "Source")
r = ta.rsi(close, length)
plot(r, "RSI", color=#ab47bc)`
  },
  {
    id: 'footprint_chart',
    name: 'Footprint (Bid x Ask Order Flow)',
    category: 'Order Flow',
    description: 'X-Ray order flow visualizing intra-candle Bid x Ask volume matrix, Point of Control (POC), and institutional directional signals (Stacked Imbalances, Delta Support/Resistance, Trapped POCs).',
    overlay: true,
    defaultParams: {
      show_directions: true,
      imbalance_ratio: 3.0,
      stacked_imbalance_threshold: 3,
      cluster_ticks: 4,
      show_poc: true,
      show_imbalances: true,
      show_delta_summary: true
    },
    paramDefinitions: [
      { 
        key: 'show_directions', 
        name: 'Show Market Direction Signals (X-Ray)', 
        type: 'bool', 
        default: true, 
        description: 'Enables directional badges for Stacked Buying/Selling Imbalances, Positive Delta at Support, Negative Delta at Resistance, and Trapped POCs.',
        category: 'Directions & Signals'
      },
      { 
        key: 'imbalance_ratio', 
        name: 'Imbalance Multiplier (Ratio)', 
        type: 'float', 
        default: 3.0, 
        min: 1.5, 
        max: 10.0, 
        step: 0.5,
        description: 'Diagonal volume ratio threshold (e.g. 3.0 = 300% volume dominance).',
        category: 'Calculations'
      },
      { 
        key: 'stacked_imbalance_threshold', 
        name: 'Stacked Imbalance Levels Count', 
        type: 'int', 
        default: 3, 
        min: 2, 
        max: 8, 
        description: 'Number of consecutive diagonal imbalance rows required to trigger institutional stacked signal.',
        category: 'Calculations'
      },
      { 
        key: 'cluster_ticks', 
        name: 'Price Cluster Granularity (Ticks)', 
        type: 'int', 
        default: 4, 
        min: 1, 
        max: 20, 
        category: 'Calculations' 
      },
      { key: 'show_poc', name: 'Highlight Point of Control (POC)', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_imbalances', name: 'Highlight Diagonal Imbalances in Matrix', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_delta_summary', name: 'Show Bar Delta & Volume Footers', type: 'bool', default: true, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Footprint Order Flow", overlay=true)
show_directions = input.bool(true, "Show Market Direction Signals")
imbalance_ratio = input.float(3.0, "Imbalance Ratio (300%)")
stacked_threshold = input.int(3, "Stacked Levels")
cluster_ticks = input.int(4, "Price Cluster Size")
show_poc = input.bool(true, "Highlight Point of Control (POC)")
show_imbalances = input.bool(true, "Highlight Diagonal Imbalances")`
  },
  {
    id: 'delta_volume',
    name: 'Delta (Volume Delta & CVD)',
    category: 'Order Flow',
    description: 'Calculates bar-by-bar delta volume and Cumulative Volume Delta (CVD) with real-time institutional setups: CVD Divergences (Absorption), Breakouts/Breakdowns, Delta Flips at Key Levels, and Delta Exhaustion.',
    overlay: false,
    defaultParams: {
      show_direction_setups: true,
      show_cvd: true,
      show_delta_bars: true,
      show_divergences: true,
      show_breakouts: true,
      show_delta_flips: true,
      show_exhaustion: true,
      smooth_cvd: 14
    },
    paramDefinitions: [
      { 
        key: 'show_direction_setups', 
        name: 'Detect Bullish & Bearish Direction Setups', 
        type: 'bool', 
        default: true, 
        description: 'Enables detection of CVD Divergences, CVD Breakouts, Delta Flips, and Volume Exhaustion.',
        category: 'Directions & Signals'
      },
      { key: 'show_divergences', name: 'CVD Divergences (Passive Absorption)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_breakouts', name: 'CVD Breakout / Breakdown (Range Exhaustion)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_delta_flips', name: 'Delta Flips at Support & Resistance', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_exhaustion', name: 'Decreasing Delta Exhaustion (Lower Lows / Higher Highs)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_cvd', name: 'Render Cumulative Volume Delta (CVD) Line', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_delta_bars', name: 'Render Individual Bar Delta Histogram', type: 'bool', default: true, category: 'Visuals' },
      { key: 'smooth_cvd', name: 'CVD Lookback & Smoothing Length', type: 'int', default: 14, min: 5, max: 50, category: 'Calculations' }
    ],
    code: `//@version=5
indicator("Volume Delta & CVD", overlay=false)
show_direction_setups = input.bool(true, "Detect Direction Setups")
show_cvd = input.bool(true, "Show Cumulative Volume Delta (CVD)")
show_divergences = input.bool(true, "CVD Absorption Divergence")
show_delta_flips = input.bool(true, "Delta Flips at Key Levels")
show_exhaustion = input.bool(true, "Decreasing Delta Exhaustion")
smooth_cvd = input.int(14, "CVD Smoothing")`
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands (BB 20, 2)',
    category: 'Volatility',
    description: 'Calculates volatility envelope with standard deviation bands around a 20-period moving average.',
    overlay: true,
    defaultParams: {
      length: 20,
      mult: 2.0,
      source: 'close',
      basis_type: 'SMA',
      fill_background: true,
      upper_color: '#00b4d8',
      basis_color: '#ff9800',
      lower_color: '#00b4d8'
    },
    paramDefinitions: [
      { key: 'length', name: 'Period Length', type: 'int', default: 20, min: 2, max: 200, category: 'Calculations' },
      { key: 'mult', name: 'Standard Deviation Multiplier', type: 'float', default: 2.0, min: 0.5, max: 5.0, step: 0.1, category: 'Calculations' },
      { 
        key: 'basis_type', 
        name: 'Basis Moving Average Type', 
        type: 'select', 
        default: 'SMA', 
        options: [{ label: 'SMA (Simple)', value: 'SMA' }, { label: 'EMA (Exponential)', value: 'EMA' }],
        category: 'Calculations'
      },
      { key: 'fill_background', name: 'Fill Volatility Band Background', type: 'bool', default: true, category: 'Visuals' },
      { key: 'basis_color', name: 'Basis Center Color', type: 'color', default: '#ff9800', category: 'Visuals' },
      { key: 'upper_color', name: 'Upper Band Color', type: 'color', default: '#00b4d8', category: 'Visuals' },
      { key: 'lower_color', name: 'Lower Band Color', type: 'color', default: '#00b4d8', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Bollinger Bands", overlay=true)
length = input.int(20, "Length")
mult = input.float(2.0, "StdDev Multiplier")
basis = ta.sma(close, length)
dev = mult * ta.stdev(close, length)
upper = basis + dev
lower = basis - dev
plot(basis, "Basis", color=#ff9800)
plot(upper, "Upper Band", color=#00b4d8)
plot(lower, "Lower Band", color=#00b4d8)`
  },
  {
    id: 'sessions_indicator',
    name: 'Sessions (Asian, London, New York)',
    category: 'Sessions',
    description: 'Highlights global trading sessions: Asian (Tokyo 00:00-09:00 UTC), London (08:00-16:30 UTC), and New York (13:00-21:00 UTC) with dynamic high/low range boxes.',
    overlay: true,
    defaultParams: {
      show_asian: true,
      asian_start: 0,
      asian_end: 9,
      asian_color: '#9c27b0',
      show_london: true,
      london_start: 8,
      london_end: 16.5,
      london_color: '#00b4d8',
      show_ny: true,
      ny_start: 13,
      ny_end: 21,
      ny_color: '#ff9800',
      show_range_boxes: true,
      show_open_lines: true
    },
    paramDefinitions: [
      { key: 'show_asian', name: 'Asian Session (Tokyo)', type: 'bool', default: true, category: 'General' },
      { key: 'asian_start', name: 'Asian Start Hour (UTC)', type: 'float', default: 0, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'asian_end', name: 'Asian End Hour (UTC)', type: 'float', default: 9, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'asian_color', name: 'Asian Box Color', type: 'color', default: '#9c27b0', category: 'Visuals' },

      { key: 'show_london', name: 'London Session', type: 'bool', default: true, category: 'General' },
      { key: 'london_start', name: 'London Start Hour (UTC)', type: 'float', default: 8, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'london_end', name: 'London End Hour (UTC)', type: 'float', default: 16.5, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'london_color', name: 'London Box Color', type: 'color', default: '#00b4d8', category: 'Visuals' },

      { key: 'show_ny', name: 'New York Session', type: 'bool', default: true, category: 'General' },
      { key: 'ny_start', name: 'New York Start Hour (UTC)', type: 'float', default: 13, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'ny_end', name: 'New York End Hour (UTC)', type: 'float', default: 21, min: 0, max: 24, step: 0.5, category: 'Calculations' },
      { key: 'ny_color', name: 'New York Box Color', type: 'color', default: '#ff9800', category: 'Visuals' },

      { key: 'show_range_boxes', name: 'Draw High/Low Range Shaded Boxes', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_open_lines', name: 'Draw Session Opening Price Line', type: 'bool', default: true, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Market Sessions (Asian, London, NY)", overlay=true)
show_asian = input.bool(true, "Show Asian Session")
show_london = input.bool(true, "Show London Session")
show_ny = input.bool(true, "Show New York Session")
show_range_boxes = input.bool(true, "Show Range Boxes")`
  },
  {
    id: 'demand_supply_zones',
    name: 'Demand and Supply Zones (Order Blocks)',
    category: 'Smart Money',
    description: 'Detects institutional supply and demand order blocks before the impulsive move, tracking active mitigation levels.',
    overlay: true,
    defaultParams: {
      lookback: 5,
      impulse_strength: 1.4,
      max_zones: 8,
      show_labels: true,
      show_unmitigated_only: false,
      supply_color: '#ef5350',
      demand_color: '#26a69a'
    },
    paramDefinitions: [
      { key: 'impulse_strength', name: 'Impulsive Move Multiplier', type: 'float', default: 1.4, min: 1.0, max: 3.0, step: 0.1, category: 'Calculations', description: 'Sensitivity to detect large displacement / impulsive candles.' },
      { key: 'lookback', name: 'Swing Pivot Lookback Length', type: 'int', default: 5, min: 2, max: 20, category: 'Calculations' },
      { key: 'max_zones', name: 'Maximum Active Zones', type: 'int', default: 8, min: 2, max: 20, category: 'Calculations' },
      { key: 'show_unmitigated_only', name: 'Show Unmitigated Fresh Zones Only', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'supply_color', name: 'Supply Zone Base Color', type: 'color', default: '#ef5350', category: 'Visuals' },
      { key: 'demand_color', name: 'Demand Zone Base Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'show_labels', name: 'Display Zone Tags & Status Badges', type: 'bool', default: true, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Supply and Demand Zones", overlay=true)
lookback = input.int(5, "Swing Lookback")
impulse_strength = input.float(1.4, "Impulse Multiplier")
max_zones = input.int(8, "Max Zones")
show_labels = input.bool(true, "Show Labels")`
  },
  {
    id: 'fair_value_gap',
    name: 'Fair Value Gap (FVG / Imbalance)',
    category: 'Smart Money',
    description: 'Identifies institutional 3-bar price imbalances with shaded zones and Consequent Encroachment (50% C.E.) equilibrium levels.',
    overlay: true,
    defaultParams: {
      min_gap_pts: 0.1,
      show_ce_line: true,
      show_labels: true,
      extend_unmitigated: true
    },
    paramDefinitions: [
      { key: 'min_gap_pts', name: 'Minimum Gap Size (Points)', type: 'float', default: 0.1, min: 0.01, max: 5.0, step: 0.05, category: 'Calculations' },
      { key: 'show_ce_line', name: 'Show 50% Consequent Encroachment (C.E.) Line', type: 'bool', default: true, category: 'Visuals' },
      { key: 'extend_unmitigated', name: 'Extend FVG until Mitigated', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_labels', name: 'Show FVG Badges', type: 'bool', default: true, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Fair Value Gap (FVG)", overlay=true)
min_gap_pts = input.float(0.1, "Minimum Gap Size")
show_ce_line = input.bool(true, "Show 50% C.E. Line")
extend_unmitigated = input.bool(true, "Extend Until Mitigated")`
  },
  {
    id: 'choch_bos',
    name: 'CHoCH & BOS (Market Structure)',
    category: 'Smart Money',
    description: 'Identifies Swing Highs/Lows, Break of Structure (BOS) trend continuations, and Change of Character (CHoCH) structural trend reversals with customizable line and transparent colors.',
    overlay: true,
    defaultParams: {
      swing_length: 4,
      show_bos: true,
      show_choch: true,
      show_labels: true,
      show_swing_points: true,
      choch_bull_color: '#26a69a',
      choch_bear_color: '#ef5350',
      bos_bull_color: '#00b4d8',
      bos_bear_color: '#ff9800',
      pivot_high_color: '#00b4d8',
      pivot_low_color: '#ff9800',
      bg_color: 'transparent'
    },
    paramDefinitions: [
      { key: 'swing_length', name: 'Swing Pivot Length', type: 'int', default: 4, min: 2, max: 15, category: 'Calculations' },
      { key: 'show_bos', name: 'Show Break of Structure (BOS)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_choch', name: 'Show Change of Character (CHoCH)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_swing_points', name: 'Display Swing High (SH) / Low (SL) Labels', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Display Structural Breakout Badges', type: 'bool', default: true, category: 'Visuals' },
      { key: 'choch_bull_color', name: 'CHoCH Bullish Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'choch_bear_color', name: 'CHoCH Bearish Color', type: 'color', default: '#ef5350', category: 'Visuals' },
      { key: 'bos_bull_color', name: 'BOS Bullish Color', type: 'color', default: '#00b4d8', category: 'Visuals' },
      { key: 'bos_bear_color', name: 'BOS Bearish Color', type: 'color', default: '#ff9800', category: 'Visuals' },
      { key: 'pivot_high_color', name: 'Swing High Label Color', type: 'color', default: '#00b4d8', category: 'Visuals' },
      { key: 'pivot_low_color', name: 'Swing Low Label Color', type: 'color', default: '#ff9800', category: 'Visuals' },
      { key: 'bg_color', name: 'Structure Shading / Background Color (Transparent Supported)', type: 'color', default: 'transparent', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("CHoCH & BOS Structure", overlay=true)
swing_length = input.int(4, "Swing Pivot Length")
show_bos = input.bool(true, "Show BOS")
show_choch = input.bool(true, "Show CHoCH")
show_labels = input.bool(true, "Show Labels")
choch_bull_color = input.color(#26a69a, "CHoCH Bullish Color")
choch_bear_color = input.color(#ef5350, "CHoCH Bearish Color")
bos_bull_color = input.color(#00b4d8, "BOS Bullish Color")
bos_bear_color = input.color(#ff9800, "BOS Bearish Color")`
  },
  {
    id: 'sma_20',
    name: 'Moving Average (SMA 20)',
    category: 'Trend',
    description: 'Calculates the average price of an asset over 20 periods, smoothing out short-term price fluctuations.',
    overlay: true,
    defaultParams: {
      length: 20,
      source: 'close',
      color: '#2962ff'
    },
    paramDefinitions: [
      { key: 'length', name: 'Length', type: 'int', default: 20, min: 1, max: 200, category: 'Calculations' },
      { key: 'color', name: 'Line Color', type: 'color', default: '#2962ff', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("SMA 20", overlay=true)
length = input.int(20, "Length")
s = ta.sma(close, length)
plot(s, "SMA 20", color=#2962ff)`
  },
  {
    id: 'sma_50',
    name: 'Moving Average (SMA 50)',
    category: 'Trend',
    description: 'Calculates the intermediate trend average over 50 periods.',
    overlay: true,
    defaultParams: {
      length: 50,
      source: 'close',
      color: '#ff9800'
    },
    paramDefinitions: [
      { key: 'length', name: 'Length', type: 'int', default: 50, min: 1, max: 500, category: 'Calculations' },
      { key: 'color', name: 'Line Color', type: 'color', default: '#ff9800', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("SMA 50", overlay=true)
length = input.int(50, "Length")
s = ta.sma(close, length)
plot(s, "SMA 50", color=#ff9800)`
  },
  {
    id: 'hull_ma',
    name: 'Hull Moving Average (HMA)',
    category: 'Trend',
    description: 'Fast, responsive moving average reducing lag with dynamic trend coloring.',
    overlay: true,
    defaultParams: {
      length: 20,
      source: 'close'
    },
    paramDefinitions: [
      { key: 'length', name: 'Length', type: 'int', default: 20, min: 2, max: 200, category: 'Calculations' }
    ],
    code: `//@version=5
indicator("Hull MA", overlay=true)
length = input.int(20, "Length")
h = ta.hma(close, length)
plot(h, "HMA", color=close > h ? color.green : color.red)`
  },
  {
    id: 'institutional_quant',
    name: 'Institutional Quant Strategy (HMA + ATR)',
    category: 'Strategies',
    description: 'Adaptive institutional algorithmic execution system combining Hull Moving Average (HMA) momentum, dynamic ATR volatility stops, multi-stage Take Profit targets, and trend-filtering.',
    overlay: true,
    defaultParams: {
      hma_len: 20,
      filter_len: 50,
      atr_len: 14,
      sl_mult: 1.5,
      tp1_mult: 1.5,
      tp2_mult: 3.0,
      show_targets: true,
      show_rr_boxes: true,
      show_labels: true,
      filter_trend: true,
      min_signal_spacing: 6
    },
    paramDefinitions: [
      { key: 'hma_len', name: 'HMA Baseline Length', type: 'int', default: 20, min: 5, max: 100, category: 'Calculations' },
      { key: 'filter_len', name: 'Macro Trend Filter Length (EMA)', type: 'int', default: 50, min: 10, max: 200, category: 'Calculations' },
      { key: 'atr_len', name: 'ATR Volatility Length', type: 'int', default: 14, min: 2, max: 50, category: 'Calculations' },
      { key: 'sl_mult', name: 'Stop Loss ATR Multiplier', type: 'float', default: 1.5, min: 0.5, max: 5.0, step: 0.1, category: 'Calculations' },
      { key: 'tp1_mult', name: 'Take Profit 1 (1:1.5 R:R) ATR Multiplier', type: 'float', default: 1.5, min: 0.5, max: 5.0, step: 0.1, category: 'Calculations' },
      { key: 'tp2_mult', name: 'Take Profit 2 (1:3.0 R:R) ATR Multiplier', type: 'float', default: 3.0, min: 1.0, max: 10.0, step: 0.2, category: 'Calculations' },
      { key: 'filter_trend', name: 'Enable Macro Trend Alignment Filter', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'min_signal_spacing', name: 'Minimum Signal Spacing (Bars Cooldown)', type: 'int', default: 6, min: 2, max: 30, category: 'Directions & Signals' },
      { key: 'show_targets', name: 'Show Entry, SL & TP Target Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_rr_boxes', name: 'Show Risk/Reward Projection Zones', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Show Signal Badges & Target Hit Markers', type: 'bool', default: true, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Institutional Quant Strategy", overlay=true)
hma_len = input.int(20, "HMA Baseline Length")
filter_len = input.int(50, "Macro Filter Length")
atr_len = input.int(14, "ATR Volatility Length")
sl_mult = input.float(1.5, "Stop Loss Multiplier")
tp1_mult = input.float(1.5, "TP1 Multiplier")
tp2_mult = input.float(3.0, "TP2 Multiplier")
show_targets = input.bool(true, "Show Targets")
show_rr_boxes = input.bool(true, "Show R:R Boxes")
filter_trend = input.bool(true, "Filter Macro Trend")
hma = ta.hma(close, hma_len)
plot(hma, "HMA Baseline", color=close > hma ? color.green : color.red)`
  }
];

export const INDICATORS_LIST = BUILTIN_INDICATORS;

