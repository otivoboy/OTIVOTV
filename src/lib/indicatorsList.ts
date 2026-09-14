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
  category: 'Trend' | 'Oscillator' | 'Volatility' | 'Smart Money' | 'Order Flow' | 'Strategies' | 'Sessions' | 'Chart Patterns' | 'Custom';
  description: string;
  overlay: boolean;
  code: string;
  defaultParams?: Record<string, any>;
  paramDefinitions?: IndicatorParamDef[];
}

export const BUILTIN_INDICATORS: IndicatorPreset[] = [
  {
    id: 'volume',
    name: 'Volume',
    category: 'Order Flow',
    description: 'Trading volume histogram highlighting bullish (up) and bearish (down) bar activity with a customizable 20-period Volume Moving Average (SMA) line.',
    overlay: false,
    defaultParams: {
      ma_length: 20,
      show_ma: true,
      up_color: '#26a69a',
      down_color: '#ef5350',
      ma_color: '#2962ff'
    },
    paramDefinitions: [
      { key: 'ma_length', name: 'Volume MA Length (SMA)', type: 'int', default: 20, min: 1, max: 100, category: 'Calculations' },
      { key: 'show_ma', name: 'Show Volume Moving Average (SMA)', type: 'bool', default: true, category: 'Visuals' },
      { key: 'up_color', name: 'Bullish Volume Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'down_color', name: 'Bearish Volume Color', type: 'color', default: '#ef5350', category: 'Visuals' },
      { key: 'ma_color', name: 'Volume MA Line Color', type: 'color', default: '#2962ff', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Volume", overlay=false)
ma_len = input.int(20, "Volume MA Length")
show_ma = input.bool(true, "Show MA")
up_col = input.color(#26a69a, "Up Color")
down_col = input.color(#ef5350, "Down Color")
ma_col = input.color(#2962ff, "MA Color")
plot(volume, "Volume", style=plot.style_columns, color=close >= open ? up_col : down_col)
plot(ta.sma(volume, ma_len), "Volume MA", color=ma_col)`
  },
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
    name: 'Sessions',
    category: 'Sessions',
    description: 'Highlights global trading sessions: London (03:00-12:00), New York (08:00-17:00), Tokyo (20:00-04:00), and Sydney (17:00-02:00) with full-height vertical bands or High-Low range boxes.',
    overlay: true,
    defaultParams: {
      high_low_view: false,
      resolution: '1 day',
      london_active: true,
      london_start: '03:00',
      london_end: '12:00',
      london_color: '#26a69a',
      london_bg_color: 'rgba(38, 166, 154, 0.18)',
      london_plot: true,
      london_bg: true,
      ny_active: true,
      ny_start: '08:00',
      ny_end: '17:00',
      ny_color: '#f59e0b',
      ny_bg_color: 'rgba(245, 158, 11, 0.18)',
      ny_plot: true,
      ny_bg: true,
      tokyo_active: true,
      tokyo_start: '20:00',
      tokyo_end: '04:00',
      tokyo_color: '#00b4d8',
      tokyo_bg_color: 'rgba(0, 180, 216, 0.16)',
      tokyo_plot: true,
      tokyo_bg: true,
      sydney_active: true,
      sydney_start: '17:00',
      sydney_end: '02:00',
      sydney_color: '#ef5350',
      sydney_bg_color: 'rgba(239, 83, 80, 0.16)',
      sydney_plot: true,
      sydney_bg: true,
      plots_bg: true,
      precision: 'Default',
      labels_on_price_scale: true,
      values_in_status_line: true,
      inputs_in_status_line: true,
      show_range_boxes: false,
      show_open_lines: false
    },
    paramDefinitions: [
      { key: 'high_low_view', name: 'Activate High-Low View', type: 'bool', default: false, category: 'General' },
      { 
        key: 'resolution', 
        name: 'Resolution', 
        type: 'select', 
        default: '1 day',
        options: [
          { label: '1 day', value: '1 day' },
          { label: 'Same as chart', value: 'Same as chart' },
          { label: '1 hour', value: '1 hour' },
          { label: '4 hours', value: '4 hours' }
        ],
        category: 'General'
      },
      { key: 'london_active', name: 'London Session', type: 'bool', default: true, category: 'General' },
      { key: 'london_color', name: 'London Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'ny_active', name: 'New York Session', type: 'bool', default: true, category: 'General' },
      { key: 'ny_color', name: 'New York Color', type: 'color', default: '#f59e0b', category: 'Visuals' },
      { key: 'tokyo_active', name: 'Tokyo Session', type: 'bool', default: true, category: 'General' },
      { key: 'tokyo_color', name: 'Tokyo Color', type: 'color', default: '#00b4d8', category: 'Visuals' },
      { key: 'sydney_active', name: 'Sydney Session', type: 'bool', default: true, category: 'General' },
      { key: 'sydney_color', name: 'Sydney Color', type: 'color', default: '#ef5350', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Sessions", overlay=true)
high_low = input.bool(false, "Activate High-Low View")
res = input.string("1 day", "Resolution")
s_lon = input.session("0300-1200", "London Session")
s_ny = input.session("0800-1700", "New York Session")
s_tok = input.session("2000-0400", "Tokyo Session")
s_syd = input.session("1700-0200", "Sydney Session")`
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
  },
  {
    id: 'liquidity_sweep',
    name: 'Liquidity Sweep + CISD + FVG',
    category: 'Smart Money',
    description: 'Smart Money Liquidity Sweep + CISD (Change in State of Delivery) + FVG (Fair Value Gap) strategy. Detects liquidity sweeps, CISD transition levels, and opposing Fair Value Gap entry zones.',
    overlay: true,
    defaultParams: {
      pivot_length: 5,
      eqh_eql_tolerance: 0.05,
      min_wick_ratio: 0.8,
      filter_volume: false,
      volume_mult: 1.0,
      show_cisd: true,
      show_fvg: true,
      show_liquidity_lines: true,
      show_sweep_labels: true,
      max_active_pools: 15,
      sweep_color: '#787b86',
      cisd_color: '#3b82f6',
      fvg_color: '#26a69a'
    },
    paramDefinitions: [
      { key: 'pivot_length', name: 'Swing Pivot Length (ta.pivothigh / low)', type: 'int', default: 5, min: 2, max: 20, category: 'Calculations' },
      { key: 'eqh_eql_tolerance', name: 'Equal Highs/Lows Tolerance (%)', type: 'float', default: 0.05, min: 0.01, max: 0.5, step: 0.01, category: 'Calculations' },
      { key: 'min_wick_ratio', name: 'Rejection Wick Threshold Ratio', type: 'float', default: 0.8, min: 0.2, max: 3.0, step: 0.1, category: 'Calculations' },
      { key: 'show_cisd', name: 'Show CISD (Change in State of Delivery)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_fvg', name: 'Show FVG (Fair Value Gap Zones)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_liquidity_lines', name: 'Show Swept Liquidity Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_sweep_labels', name: 'Show "Liquidity Sweep" Text Callouts', type: 'bool', default: true, category: 'Visuals' },
      { key: 'max_active_pools', name: 'Maximum Active Liquidity Pools', type: 'int', default: 15, min: 3, max: 30, category: 'Calculations' },
      { key: 'sweep_color', name: 'Liquidity Sweep Line Color', type: 'color', default: '#787b86', category: 'Visuals' },
      { key: 'cisd_color', name: 'CISD Line Color', type: 'color', default: '#3b82f6', category: 'Visuals' },
      { key: 'fvg_color', name: 'FVG Box Color', type: 'color', default: '#26a69a', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Liquidity Sweep + CISD + FVG", overlay=true)
pivot_len = input.int(5, "Swing Pivot Length")
show_cisd = input.bool(true, "Show CISD")
show_fvg = input.bool(true, "Show FVG")`
  },
  {
    id: 'liquidity_swings',
    name: 'Liquidity Swings',
    category: 'Smart Money',
    description: 'Identifies institutional Buy and Sell liquidity swing extremes, highlighting resting volume pools, shaded liquidity footprint blocks, and extending target liquidity levels.',
    overlay: true,
    defaultParams: {
      pivot_length: 5,
      show_volume: true,
      show_liquidity_blocks: true,
      show_extend_lines: true,
      show_labels: true,
      max_swings: 15,
      high_swing_color: '#ef4444',
      low_swing_color: '#00b4d8'
    },
    paramDefinitions: [
      { key: 'pivot_length', name: 'Swing Pivot Length (Lookback/Forward)', type: 'int', default: 5, min: 2, max: 30, category: 'Calculations', description: 'Number of bars left and right to confirm institutional swing highs and lows.' },
      { key: 'show_volume', name: 'Display Resting Volume Metrics (e.g. 23.823K)', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_liquidity_blocks', name: 'Shade Swing Liquidity Blocks', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_extend_lines', name: 'Extend Liquidity Levels Horizontally', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Show Buy / Sell Tags', type: 'bool', default: true, category: 'Visuals' },
      { key: 'max_swings', name: 'Max Active Liquidity Swings', type: 'int', default: 15, min: 3, max: 40, category: 'Calculations' },
      { key: 'high_swing_color', name: 'Swing High / Sell Liquidity Color', type: 'color', default: '#ef4444', category: 'Visuals' },
      { key: 'low_swing_color', name: 'Swing Low / Buy Liquidity Color', type: 'color', default: '#00b4d8', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Liquidity Swings", overlay=true)
pivot_len = input.int(5, "Swing Pivot Length")
show_vol = input.bool(true, "Show Volume")
show_blocks = input.bool(true, "Show Liquidity Blocks")
show_lines = input.bool(true, "Extend Lines")`
  },
  {
    id: 'bullish_flag',
    name: 'Bullish Flag Pattern',
    category: 'Chart Patterns',
    description: 'Detects Bullish Flags, Bullish Wedge Flags, and Bullish Pennants with impulse flagpole tracking, descending consolidation channels, breakout confirmation, and 100% measured move target projections.',
    overlay: true,
    defaultParams: {
      show_flags: true,
      show_wedges: true,
      show_pennants: true,
      pole_strength_atr: 2.2,
      pole_min_bars: 3,
      pole_max_bars: 15,
      flag_min_bars: 4,
      flag_max_bars: 20,
      max_patterns: 2,
      show_flagpole: true,
      show_channel_lines: true,
      show_channel_shading: false,
      show_target: true,
      show_labels: true,
      bull_color: '#26a69a',
      target_color: '#00e676'
    },
    paramDefinitions: [
      { key: 'pole_strength_atr', name: 'Impulse Flagpole ATR Multiplier', type: 'float', default: 2.2, min: 1.0, max: 4.0, step: 0.1, category: 'Calculations', description: 'Sensitivity to detect impulsive upward flagpole surges.' },
      { key: 'pole_min_bars', name: 'Minimum Flagpole Bars', type: 'int', default: 3, min: 2, max: 10, category: 'Calculations' },
      { key: 'pole_max_bars', name: 'Maximum Flagpole Bars', type: 'int', default: 15, min: 5, max: 30, category: 'Calculations' },
      { key: 'flag_min_bars', name: 'Minimum Flag Consolidation Bars', type: 'int', default: 4, min: 3, max: 15, category: 'Calculations' },
      { key: 'flag_max_bars', name: 'Maximum Flag Consolidation Bars', type: 'int', default: 20, min: 6, max: 35, category: 'Calculations' },
      { key: 'max_patterns', name: 'Max Displayed Patterns', type: 'int', default: 2, min: 1, max: 5, category: 'Calculations' },
      { key: 'show_flags', name: 'Show Bullish Flags (Descending Parallel Channel)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_wedges', name: 'Show Bullish Wedge Flags (Converging Downward)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_pennants', name: 'Show Bullish Pennants (Symmetrical Triangle)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_target', name: 'Show 100% Measured Move Target Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_flagpole', name: 'Draw Flagpole Surge Vectors', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_channel_lines', name: 'Draw Flag Channel Boundary Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Show Pattern Badges & Target Callouts', type: 'bool', default: true, category: 'Visuals' },
      { key: 'bull_color', name: 'Bullish Pattern Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'target_color', name: 'Target Projection Color', type: 'color', default: '#00e676', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Bullish Flag Pattern", overlay=true)
pole_atr = input.float(2.2, "Pole ATR Multiplier")
show_target = input.bool(true, "Show Measured Target")
show_wedges = input.bool(true, "Show Bullish Wedges")
show_pennants = input.bool(true, "Show Bullish Pennants")`
  },
  {
    id: 'bearish_flag',
    name: 'Bearish Flag Pattern',
    category: 'Chart Patterns',
    description: 'Detects Bearish Flags, Bearish Wedge Flags, and Bearish Pennants with downward plunge flagpole tracking, ascending consolidation channels, breakdown confirmation, and measured move target projections.',
    overlay: true,
    defaultParams: {
      show_flags: true,
      show_wedges: true,
      show_pennants: true,
      pole_strength_atr: 2.2,
      pole_min_bars: 3,
      pole_max_bars: 15,
      flag_min_bars: 4,
      flag_max_bars: 20,
      max_patterns: 2,
      show_flagpole: true,
      show_channel_lines: true,
      show_channel_shading: false,
      show_target: true,
      show_labels: true,
      bear_color: '#ef5350',
      target_color: '#ff5252'
    },
    paramDefinitions: [
      { key: 'pole_strength_atr', name: 'Impulse Flagpole ATR Multiplier', type: 'float', default: 2.2, min: 1.0, max: 4.0, step: 0.1, category: 'Calculations', description: 'Sensitivity to detect impulsive downward flagpole drops.' },
      { key: 'pole_min_bars', name: 'Minimum Flagpole Bars', type: 'int', default: 3, min: 2, max: 10, category: 'Calculations' },
      { key: 'pole_max_bars', name: 'Maximum Flagpole Bars', type: 'int', default: 15, min: 5, max: 30, category: 'Calculations' },
      { key: 'flag_min_bars', name: 'Minimum Flag Consolidation Bars', type: 'int', default: 4, min: 3, max: 15, category: 'Calculations' },
      { key: 'flag_max_bars', name: 'Maximum Flag Consolidation Bars', type: 'int', default: 20, min: 6, max: 35, category: 'Calculations' },
      { key: 'max_patterns', name: 'Max Displayed Patterns', type: 'int', default: 2, min: 1, max: 5, category: 'Calculations' },
      { key: 'show_flags', name: 'Show Bearish Flags (Ascending Parallel Channel)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_wedges', name: 'Show Bearish Wedge Flags (Converging Upward)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_pennants', name: 'Show Bearish Pennants (Symmetrical Triangle)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_target', name: 'Show 100% Measured Move Target Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_flagpole', name: 'Draw Flagpole Drop Vectors', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_channel_lines', name: 'Draw Flag Channel Boundary Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Show Pattern Badges & Target Callouts', type: 'bool', default: true, category: 'Visuals' },
      { key: 'bear_color', name: 'Bearish Pattern Color', type: 'color', default: '#ef5350', category: 'Visuals' },
      { key: 'target_color', name: 'Target Projection Color', type: 'color', default: '#ff5252', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Bearish Flag Pattern", overlay=true)
pole_atr = input.float(2.2, "Pole ATR Multiplier")
show_target = input.bool(true, "Show Measured Target")
show_wedges = input.bool(true, "Show Bearish Wedges")
show_pennants = input.bool(true, "Show Bearish Pennants")`
  },
  {
    id: 'flag_patterns',
    name: 'Bullish & Bearish Flags',
    category: 'Chart Patterns',
    description: 'All-in-one chart pattern engine identifying both Bullish and Bearish Flags, Wedges, and Pennants with dynamic flagpole tracking, consolidation channel boundaries, breakout signals, and measured move profit projections.',
    overlay: true,
    defaultParams: {
      detect_bullish: true,
      detect_bearish: true,
      show_flags: true,
      show_wedges: true,
      show_pennants: true,
      pole_strength_atr: 2.2,
      pole_min_bars: 3,
      pole_max_bars: 15,
      flag_min_bars: 4,
      flag_max_bars: 20,
      max_patterns: 2,
      show_flagpole: true,
      show_channel_lines: true,
      show_channel_shading: false,
      show_target: true,
      show_labels: true,
      bull_color: '#26a69a',
      bear_color: '#ef5350',
      target_color: '#3b82f6'
    },
    paramDefinitions: [
      { key: 'detect_bullish', name: 'Detect Bullish Flag Setups', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'detect_bearish', name: 'Detect Bearish Flag Setups', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'pole_strength_atr', name: 'Impulse Flagpole ATR Multiplier', type: 'float', default: 2.2, min: 1.0, max: 4.0, step: 0.1, category: 'Calculations', description: 'Sensitivity to detect impulsive flagpole moves.' },
      { key: 'pole_min_bars', name: 'Minimum Flagpole Bars', type: 'int', default: 3, min: 2, max: 10, category: 'Calculations' },
      { key: 'pole_max_bars', name: 'Maximum Flagpole Bars', type: 'int', default: 15, min: 5, max: 30, category: 'Calculations' },
      { key: 'flag_min_bars', name: 'Minimum Flag Consolidation Bars', type: 'int', default: 4, min: 3, max: 15, category: 'Calculations' },
      { key: 'flag_max_bars', name: 'Maximum Flag Consolidation Bars', type: 'int', default: 20, min: 6, max: 35, category: 'Calculations' },
      { key: 'max_patterns', name: 'Max Displayed Patterns', type: 'int', default: 2, min: 1, max: 5, category: 'Calculations' },
      { key: 'show_flags', name: 'Show Standard Flags (Parallel Channels)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_wedges', name: 'Show Wedge Flags (Converging Slopes)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_pennants', name: 'Show Pennants (Symmetrical Triangles)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'show_target', name: 'Show 100% Measured Move Target Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_flagpole', name: 'Draw Flagpole Surge Vectors', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_channel_lines', name: 'Draw Flag Channel Boundary Lines', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_labels', name: 'Show Pattern Badges & Target Callouts', type: 'bool', default: true, category: 'Visuals' },
      { key: 'bull_color', name: 'Bullish Pattern Color', type: 'color', default: '#26a69a', category: 'Visuals' },
      { key: 'bear_color', name: 'Bearish Pattern Color', type: 'color', default: '#ef5350', category: 'Visuals' },
      { key: 'target_color', name: 'Target Line Color', type: 'color', default: '#3b82f6', category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Bullish & Bearish Flags", overlay=true)
detect_bull = input.bool(true, "Detect Bullish")
detect_bear = input.bool(true, "Detect Bearish")
pole_atr = input.float(2.2, "Pole ATR Multiplier")
show_target = input.bool(true, "Show Measured Target")`
  },
  {
    id: 'money_algorithm',
    name: 'Money Algorithm',
    category: 'Strategies',
    description: 'Comprehensive algorithmic execution system featuring Trend Tracer baseline, dynamic Trend Cloud, Supertrend Buy/Sell & Strong confirmation signals, WaveTrend PullBack signals, dynamic TP/SL risk management, and Smart Panel multi-timeframe dashboard.',
    overlay: true,
    defaultParams: {
      showSignals: true,
      sensitivity: 2.4,
      STuner: 15,
      Presets: 'All Signals',
      TextStyle: 'Minimal',
      consSignalsFilter: false,
      StrongSignalsOnly: false,
      highVolSignals: false,
      signalsTrendCloud: false,
      ContrarianOnly: false,
      Show_PR: true,
      MSTuner: 5,
      TrendMap: 'Trend Gradient',
      momentumCandles: false,
      LongTrendAverage: true,
      LTAsensitivity: 250,
      showTrendCloud: true,
      periodTrendCloud: 'Smooth',
      showDashboard: true,
      locationDashboard: 'Bottom Right',
      sizeDashboard: 'Small',
      tpLabels: true,
      ShowTpSlAreas: false,
      ShowTrailingSL: false,
      usePercSL: false,
      percTrailingSL: 1.0,
      useTP1: true,
      multTP1: 1.0,
      useTP2: true,
      multTP2: 2.0,
      useTP3: true,
      multTP3: 3.0,
      ShowSwings: false,
      periodSwings: 10,
      bullcolor: '#16e045',
      bearcolor: '#e1320f'
    },
    paramDefinitions: [
      // Calculations & Signals
      { key: 'showSignals', name: "Show Signal's", type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'sensitivity', name: 'Sensitivity', type: 'float', default: 2.4, min: 0.1, max: 10.0, step: 0.1, category: 'Calculations' },
      { key: 'STuner', name: 'Signal Tuner (1-25)', type: 'int', default: 15, min: 1, max: 25, category: 'Calculations' },
      { 
        key: 'Presets', 
        name: 'Presets Mode', 
        type: 'select', 
        default: 'All Signals', 
        options: [
          { label: 'All Signals', value: 'All Signals' },
          { label: 'Strong+', value: 'Strong+' },
          { label: 'Trend Scalper', value: 'Trend Scalper' }
        ],
        category: 'Calculations'
      },
      {
        key: 'TextStyle',
        name: 'Signal Style',
        type: 'select',
        default: 'Minimal',
        options: [
          { label: 'Minimal (▲ / ▼)', value: 'Minimal' },
          { label: 'Normal (Buy / Sell)', value: 'Normal' }
        ],
        category: 'Visuals'
      },
      // Filters
      { key: 'consSignalsFilter', name: 'Trending Signal Only (ADX > 20)', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'StrongSignalsOnly', name: 'Strong Signals Only (EMA 200 Filter)', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'highVolSignals', name: 'High Volume Signals Only', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'signalsTrendCloud', name: 'Cloud Signals Only', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'ContrarianOnly', name: 'Contrarian Signals Only', type: 'bool', default: false, category: 'Directions & Signals' },
      // Pullback
      { key: 'Show_PR', name: 'Show PullBack Signals (WaveTrend Trap)', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'MSTuner', name: 'PullBack Tuner (2-30)', type: 'int', default: 5, min: 2, max: 30, category: 'Calculations' },
      // Trend Tracer & Cloud
      { key: 'LongTrendAverage', name: 'Show Trend Tracer EMA Line', type: 'bool', default: true, category: 'Visuals' },
      { key: 'LTAsensitivity', name: 'Trend Tracer Length', type: 'int', default: 250, min: 20, max: 500, category: 'Calculations' },
      { key: 'showTrendCloud', name: 'Show Dynamic Trend Cloud', type: 'bool', default: true, category: 'Visuals' },
      {
        key: 'periodTrendCloud',
        name: 'Trend Cloud Style',
        type: 'select',
        default: 'Smooth',
        options: [
          { label: 'Smooth (EMA 150/250)', value: 'Smooth' },
          { label: 'Scalping', value: 'Scalping' },
          { label: 'Scalping+ (HMA 55)', value: 'Scalping+' },
          { label: 'Swing', value: 'Swing' }
        ],
        category: 'Calculations'
      },
      // Smart Panel Dashboard
      { key: 'showDashboard', name: 'Show Smart Panel Dashboard', type: 'bool', default: true, category: 'Visuals' },
      {
        key: 'locationDashboard',
        name: 'Table Location',
        type: 'select',
        default: 'Bottom Right',
        options: [
          { label: 'Bottom Right', value: 'Bottom Right' },
          { label: 'Top Right', value: 'Top Right' },
          { label: 'Top Left', value: 'Top Left' },
          { label: 'Bottom Left', value: 'Bottom Left' },
          { label: 'Middle Right', value: 'Middle Right' }
        ],
        category: 'Visuals'
      },
      // Risk Management
      { key: 'tpLabels', name: 'Dynamic Take Profit Labels (RSI)', type: 'bool', default: true, category: 'Visuals' },
      { key: 'ShowTpSlAreas', name: 'Show Take Profit / Stop-Loss Areas', type: 'bool', default: false, category: 'Visuals' },
      { key: 'ShowTrailingSL', name: 'Show Trailing Stop-Loss Line', type: 'bool', default: false, category: 'Visuals' },
      { key: 'useTP1', name: 'Enable TP 1 Target', type: 'bool', default: true, category: 'Calculations' },
      { key: 'multTP1', name: 'TP 1 Multiplier', type: 'float', default: 1.0, min: 0.1, max: 10.0, step: 0.1, category: 'Calculations' },
      { key: 'useTP2', name: 'Enable TP 2 Target', type: 'bool', default: true, category: 'Calculations' },
      { key: 'multTP2', name: 'TP 2 Multiplier', type: 'float', default: 2.0, min: 0.1, max: 10.0, step: 0.1, category: 'Calculations' },
      { key: 'useTP3', name: 'Enable TP 3 Target', type: 'bool', default: true, category: 'Calculations' },
      { key: 'multTP3', name: 'TP 3 Multiplier', type: 'float', default: 3.0, min: 0.1, max: 10.0, step: 0.1, category: 'Calculations' },
      { key: 'ShowSwings', name: 'Show Market Structure Swings (HH/LL)', type: 'bool', default: false, category: 'Visuals' },
      // Colors
      { key: 'bullcolor', name: 'Bullish Color', type: 'color', default: '#16e045', category: 'Visuals' },
      { key: 'bearcolor', name: 'Bearish Color', type: 'color', default: '#e1320f', category: 'Visuals' }
    ],
    code: `//@version=5
indicator(" MONEY ALGORITHM ", overlay=true, max_lines_count=500, max_labels_count=500, max_boxes_count=350)

bullcolor = #16e045
bearcolor = #e1320f

gr_signal = "MAIN SETTINGS"
gr_PullBacksignal = "PULLBACK SIGNALS SETTINGS"
gr_Other_Settings = "CLOUD SETTINGS"
gr_TrendTracer = "TREND TRACER SETTINGS"
gr_signalfilter = "SIGNAL FILTERS"
gr_candle = "CANDLE COLORING"
gr_RiskManage = "RISK MANAGEMENT"
gr_dash = "SMART PANEL"

showSignals       = input(true, "Show Signal's", group=gr_signal)
sensitivity       = input.float(2.4, "Sensitivity", 0.1, step=0.1, group=gr_signal)
STuner            = input.int(15, "Signal Tuner(1-25)", minval = 1, maxval = 25, group=gr_signal)
Presets           = input.string("All Signals", "Presets", ["All Signals", "Strong+", "Trend Scalper"], group=gr_signal)
TextStyle         = input.string("Minimal", "Signal Style", ["Normal", "Minimal"], group=gr_signal)

consSignalsFilter = input(false, "Trending Signal Only", group=gr_signalfilter)
StrongSignalsOnly = input(false, "Strong Signals Only", group=gr_signalfilter)
highVolSignals    = input(false, "High Volume Signals only", group=gr_signalfilter)
signalsTrendCloud = input(false, "Cloud Signals only", group=gr_signalfilter)
ContrarianOnly    = input(false, "Contrarian Signals Only", group=gr_signalfilter)

Show_PR           = input.bool(true, title="Show PullBack Signals", group=gr_PullBacksignal)
MSTuner           = input.int(5, "PullBack Tuner(2-30)", minval=2, maxval=30, group=gr_PullBacksignal)

LongTrendAverage  = input(true, 'Trend Tracer', group=gr_TrendTracer)
LTAsensitivity    = input.int(250, 'Trend Tracer Length', group=gr_TrendTracer)

showTrendCloud    = input(true, "Show Trend cloud", group=gr_Other_Settings)
periodTrendCloud  = input.string("Smooth", "Trend Cloud Style", ["Smooth", "Scalping", "Scalping+", "Swing"], group=gr_Other_Settings)

showDashboard     = input(true, "Smart Panel", group=gr_dash)
locationDashboard = input.string("Bottom Right", "Table Location", ["Top Right", "Middle Right", "Bottom Right", "Top Left", "Bottom Left"], group=gr_dash)

tpLabels          = input(true, "Dynamic Take Profit Lables", group=gr_RiskManage)
ShowTpSlAreas     = input(false, "Show take Profit/Stop-loss Area", group=gr_RiskManage)
ShowTrailingSL    = input(false, "Show trailing Stop-loss", group=gr_RiskManage)

useTP1            = input(true, "TP 1 Active", group=gr_RiskManage)
multTP1           = input.float(1.0, "TP 1", group=gr_RiskManage)
useTP2            = input(true, "TP 2 Active", group=gr_RiskManage)
multTP2           = input.float(2.0, "TP 2", group=gr_RiskManage)
useTP3            = input(true, "TP 3 Active", group=gr_RiskManage)
multTP3           = input.float(3.0, "TP 3", group=gr_RiskManage)
ShowSwings        = input(false, "Show Market Structure", group=gr_RiskManage)

// Trend Tracer (EMA 250)
plot(LongTrendAverage ? ta.ema(close, LTAsensitivity) : na, 'Trend Tracer', color=close[8] > ta.ema(close, LTAsensitivity) ? bullcolor : bearcolor)`
  },
  {
    id: 'linreg_candles_ob_target',
    name: 'Linear Regression Candles with OB and Target',
    category: 'Smart Money',
    description: 'Comprehensive institutional suite integrating Linear Regression smoothed candles, Order Block (OB) identification with high/low levels, Market Structure Break (MSB) & Breaker/Mitigation boxes, Harmonic AB=CD pattern recognition, dynamic Target 1 & 2 projections, Hull Suite trend ribbon, Gann Square of 9 levels, and Supply/Demand volume zones.',
    overlay: true,
    defaultParams: {
      colors: 'BRIGHT',
      periods: 5,
      threshold: 0.0,
      usewicks: false,
      showbull: true,
      showbear: true,
      showdocu: false,
      info_pan: false,
      signal_length: 7,
      sma_signal: true,
      lin_reg: true,
      linreg_length: 11,
      show_hull: true,
      hull_length: 55,
      hull_mode: 'Hma',
      show_abcd: true,
      abcd_len: 5,
      show_targets: true,
      distTarget1: 3.0,
      distTarget2: 3.0,
      show_msb_ob: true,
      zigzag_len: 9,
      show_trendlines: true,
      show_gann: true,
      show_supply_demand: true
    },
    paramDefinitions: [
      {
        key: 'colors',
        name: 'Color Scheme',
        type: 'select',
        default: 'BRIGHT',
        options: [
          { label: 'BRIGHT', value: 'BRIGHT' },
          { label: 'DARK', value: 'DARK' }
        ],
        category: 'General'
      },
      { key: 'lin_reg', name: 'Enable Linear Regression Candles', type: 'bool', default: true, category: 'Calculations' },
      { key: 'linreg_length', name: 'Linear Regression Length', type: 'int', default: 11, min: 1, max: 200, category: 'Calculations' },
      { key: 'signal_length', name: 'Signal Smoothing Length', type: 'int', default: 7, min: 1, max: 200, category: 'Calculations' },
      { key: 'sma_signal', name: 'Simple MA for Signal Line (vs EMA)', type: 'bool', default: true, category: 'Calculations' },
      { key: 'periods', name: 'Relevant Periods for OB Confirmation', type: 'int', default: 5, min: 1, max: 20, category: 'Calculations' },
      { key: 'threshold', name: 'Min. Percent Move to Identify OB (%)', type: 'float', default: 0.0, min: 0.0, max: 20.0, step: 0.1, category: 'Calculations' },
      { key: 'usewicks', name: 'Use High/Low Range for OB (vs Open/Close)', type: 'bool', default: false, category: 'Visuals' },
      { key: 'showbull', name: 'Show Latest Bullish OB Channel', type: 'bool', default: true, category: 'Visuals' },
      { key: 'showbear', name: 'Show Latest Bearish OB Channel', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_msb_ob', name: 'Show MSB & Breaker / Mitigation Blocks', type: 'bool', default: true, category: 'Visuals' },
      { key: 'zigzag_len', name: 'ZigZag Swings Length', type: 'int', default: 9, min: 2, max: 50, category: 'Calculations' },
      { key: 'show_abcd', name: 'Show Harmonic AB=CD Patterns', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'abcd_len', name: 'AB=CD Pivot Length', type: 'int', default: 5, min: 2, max: 20, category: 'Calculations' },
      { key: 'show_targets', name: 'Show Dynamic Target Levels', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'distTarget1', name: 'Target 1 Distance (ATR Multiplier)', type: 'float', default: 3.0, min: 0.5, max: 10.0, step: 0.5, category: 'Calculations' },
      { key: 'distTarget2', name: 'Target 2 Distance (ATR Multiplier)', type: 'float', default: 3.0, min: 0.5, max: 10.0, step: 0.5, category: 'Calculations' },
      { key: 'show_hull', name: 'Show Hull Suite Trend Ribbon', type: 'bool', default: true, category: 'Visuals' },
      { key: 'hull_length', name: 'Hull Suite Length', type: 'int', default: 55, min: 5, max: 300, category: 'Calculations' },
      {
        key: 'hull_mode',
        name: 'Hull Variation Mode',
        type: 'select',
        default: 'Hma',
        options: [
          { label: 'Hma (Hull MA)', value: 'Hma' },
          { label: 'Thma (Triple Hull MA)', value: 'Thma' },
          { label: 'Ehma (Exponential Hull MA)', value: 'Ehma' }
        ],
        category: 'Calculations'
      },
      { key: 'show_trendlines', name: 'Show ZigZag Trend Lines & Channels', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_gann', name: 'Show Gann Square of 9 Levels', type: 'bool', default: true, category: 'Visuals' },
      { key: 'show_supply_demand', name: 'Show Supply & Demand Zones', type: 'bool', default: true, category: 'Visuals' },
      { key: 'info_pan', name: 'Show Latest OB Stats Info Panel', type: 'bool', default: false, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Linear Regression Candles with OB and Target", format=format.price, precision=4, overlay = true, max_bars_back = 4000,max_lines_count=500,max_labels_count=500, max_boxes_count=500)               

colors    = input.string(title = "Color Scheme", defval="BRIGHT", options=["DARK", "BRIGHT"])
periods   = input(5,     "Relevant Periods to identify OB")
threshold = input.float(0.0,   "Min. Percent move to identify OB", step = 0.1)
usewicks  = input(false, "Use whole range [High/Low] for OB marking?" )
showbull  = input(true,  "Show latest Bullish Channel?")
showbear  = input(true,  "Show latest Bearish Channel?")
showdocu  = input(false, "Show Label for documentation tooltip?")
info_pan  = input(false, "Show Latest OB Panel?")

ob_period = periods + 1
absmove   = ((math.abs(close[ob_period] - close[1]))/close[ob_period]) * 100
relmove   = absmove >= threshold

bullcolor = colors == "DARK"? color.white : color.green
bearcolor = colors == "DARK"? color.blue : color.red

bullishOB = close[ob_period] < open[ob_period]

int upcandles  = 0
for i = 1 to periods
    upcandles := upcandles + (close[i] > open[i]? 1 : 0)

OB_bull      = bullishOB and (upcandles == (periods)) and relmove
OB_bull_high = OB_bull? usewicks? high[ob_period] : open[ob_period] : na
OB_bull_low  = OB_bull? low[ob_period]  : na
OB_bull_avg  = (OB_bull_high + OB_bull_low)/2

bearishOB = close[ob_period] > open[ob_period]

int downcandles  = 0
for i = 1 to periods
    downcandles := downcandles + (close[i] < open[i]? 1 : 0)

OB_bear      = bearishOB and (downcandles == (periods)) and relmove
OB_bear_high = OB_bear? high[ob_period] : na
OB_bear_low  = OB_bear? usewicks? low[ob_period] : open[ob_period] : na
OB_bear_avg  = (OB_bear_low + OB_bear_high)/2

plotshape(OB_bull, title="Bullish OB", style = shape.triangleup, color = bullcolor, textcolor = bullcolor, size = size.tiny, location = location.belowbar, offset = -ob_period, text = "Bullish OB")
bull1 = plot(OB_bull_high, title="Bullish OB High", style = plot.style_linebr, color = bullcolor, offset = -ob_period, linewidth = 3)
bull2 = plot(OB_bull_low,  title="Bullish OB Low",  style = plot.style_linebr, color = bullcolor, offset = -ob_period, linewidth = 3)
fill(bull1, bull2, color=bullcolor, transp = 0, title = "Bullish OB fill")
plotshape(OB_bull_avg, title="Bullish OB Average", style = shape.cross, color = bullcolor, size = size.normal, location = location.absolute, offset = -ob_period)

plotshape(OB_bear, title="Bearish OB", style = shape.triangledown, color = bearcolor, textcolor = bearcolor, size = size.tiny, location = location.abovebar, offset = -ob_period, text = "Bearish OB")
bear1 = plot(OB_bear_low,  title="Bearish OB Low",  style = plot.style_linebr, color = bearcolor, offset = -ob_period, linewidth = 3)
bear2 = plot(OB_bear_high, title="Bearish OB High", style = plot.style_linebr, color = bearcolor, offset = -ob_period, linewidth = 3)
fill(bear1, bear2, color=bearcolor, transp = 0, title = "Bearish OB fill")
plotshape(OB_bear_avg, title="Bearish OB Average", style = shape.cross, color = bearcolor, size = size.normal, location = location.absolute, offset = -ob_period)

signal_length = input.int(title="Signal Smoothing", minval = 1, maxval = 200, defval = 7)
sma_signal = input.bool(title="Simple MA (Signal Line)", defval=true)
lin_reg = input.bool(title="Lin Reg", defval=true)
linreg_length = input.int(title="Linear Regression Length", minval = 1, maxval = 200, defval = 11)

bopen = lin_reg ? ta.linreg(open, linreg_length, 0) : open
bhigh = lin_reg ? ta.linreg(high, linreg_length, 0) : high
blow = lin_reg ? ta.linreg(low, linreg_length, 0) : low
bclose = lin_reg ? ta.linreg(close, linreg_length, 0) : close
r = bopen < bclose
signal = sma_signal ? ta.sma(bclose, signal_length) : ta.ema(bclose, signal_length)

plotcandle(r ? bopen : na, r ? bhigh : na, r ? blow: na, r ? bclose : na, title="LinReg Candles", color=color.green, wickcolor=color.green, bordercolor=color.green)
plotcandle(r ? na : bopen, r ? na : bhigh, r ? na : blow, r ? na : bclose, title="LinReg Candles", color=color.red, wickcolor=color.red, bordercolor=color.red)
plot(signal, color=color.blue, linewidth = 2)`
  },
  {
    id: 'banker_fund_flow_tdi_leo',
    name: 'Banker Fund Flow Trend Oscillator with TDI LEO',
    category: 'Oscillator',
    description: 'Advanced institutional momentum suite combining Banker Fund Flow Trend bars (green accumulation, white distribution, red exit, blue weak rebound), Traders Dynamic Index (TDI) RSI/TrendLine/Baseline/Volatility bands, overbought (85-90) & oversold (10-15) shaded zones, and multi-oscillator regular & hidden divergence detection.',
    overlay: false,
    defaultParams: {
      RSI_input: 21,
      TL_input: 7,
      BL_input: 34,
      VB_input: 1.6185,
      oscillator: 'RSI',
      lbL: 6,
      lbR: 2,
      rangeUpper: 60,
      rangeLower: 5,
      plotBull: true,
      plotHiddenBull: false,
      plotBear: true,
      plotHiddenBear: false,
      is_showDataTBL: false,
      is_showLotSize: false,
      Capital: 50000,
      RiskPerTrade: 1.0,
      PipsRisked: 30
    },
    paramDefinitions: [
      { key: 'RSI_input', name: 'TDI RSI Length', type: 'int', default: 21, min: 2, max: 100, category: 'Calculations' },
      { key: 'TL_input', name: 'TDI TrendLine Length', type: 'int', default: 7, min: 2, max: 100, category: 'Calculations' },
      { key: 'BL_input', name: 'TDI Market BaseLine Length', type: 'int', default: 34, min: 5, max: 200, category: 'Calculations' },
      { key: 'VB_input', name: 'Volatility Bands Multiplier', type: 'float', default: 1.6185, min: 0.5, max: 5.0, step: 0.1, category: 'Calculations' },
      {
        key: 'oscillator',
        name: 'Divergence Oscillator',
        type: 'select',
        default: 'RSI',
        options: [
          { label: 'RSI', value: 'RSI' },
          { label: 'MACD', value: 'MACD' },
          { label: 'Stochastic', value: 'Stochastic' },
          { label: 'Money Flow', value: 'Money Flow' },
          { label: 'Demand Index', value: 'Demand Index' },
          { label: 'Chaikin Money Flow', value: 'Chaikin Money flow' }
        ],
        category: 'Calculations'
      },
      { key: 'lbL', name: 'Pivot Lookback Left', type: 'int', default: 6, min: 1, max: 50, category: 'Calculations' },
      { key: 'lbR', name: 'Pivot Lookback Right', type: 'int', default: 2, min: 1, max: 50, category: 'Calculations' },
      { key: 'rangeUpper', name: 'Max Lookback Range', type: 'int', default: 60, min: 10, max: 200, category: 'Calculations' },
      { key: 'rangeLower', name: 'Min Lookback Range', type: 'int', default: 5, min: 2, max: 50, category: 'Calculations' },
      { key: 'plotBull', name: 'Plot Regular Bullish Divergence', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'plotBear', name: 'Plot Regular Bearish Divergence', type: 'bool', default: true, category: 'Directions & Signals' },
      { key: 'plotHiddenBull', name: 'Plot Hidden Bullish Divergence', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'plotHiddenBear', name: 'Plot Hidden Bearish Divergence', type: 'bool', default: false, category: 'Directions & Signals' },
      { key: 'is_showDataTBL', name: 'Show TDI & Multi-TF Data Table', type: 'bool', default: false, category: 'Visuals' },
      { key: 'is_showLotSize', name: 'Show Position Size Calculator', type: 'bool', default: false, category: 'Visuals' }
    ],
    code: `//@version=5
indicator("Banker Fund Flow Trend Oscillator with TDI LEO", overlay=false, format=format.price)

//functions
xrf(values, length) =>
    r_val = float(na)
    if length >= 1
        for i = 0 to length by 1
            if na(r_val) or not na(values[i])
                r_val  :=  values[i]
                r_val
    r_val

xsa(src,len,wei) =>
    sumf = 0.0
    ma = 0.0
    out = 0.0
    sumf  :=  nz(sumf[1]) - nz(src[len]) + src
    ma  :=  na(src[len]) ? na : sumf/len
    out  :=  na(out[1]) ? ma : (src*wei+out[1]*(len-wei))/len
    out
    
//set up a simple model of banker fund flow trend	
fundtrend = ((3*xsa((close- ta.lowest(low,27))/(ta.highest(high,27)-ta.lowest(low,27))*100,5,1)-2*xsa(xsa((close-ta.lowest(low,27))/(ta.highest(high,27)-ta.lowest(low,27))*100,5,1),3,1)-50)*1.032+50)
//define typical price for banker fund
typ = (2*close+high+low+open)/5
//lowest low with mid term fib # 34
lol = ta.lowest(low,34)
//highest high with mid term fib # 34
hoh = ta.highest(high,34)
//define banker fund flow bull bear line
bullbearline = ta.ema((typ-lol)/(hoh-lol)*100,13)
//define banker entry signal
bankerentry = ta.crossover(fundtrend,bullbearline) and bullbearline<25

//banker increase position with green candle
plotcandle(fundtrend,bullbearline,fundtrend,bullbearline,color=fundtrend>bullbearline ? color.new(#4caf4f, 60):na)

//banker decrease position with white candle
plotcandle(fundtrend,bullbearline,fundtrend,bullbearline,color=fundtrend<(xrf(fundtrend*0.95,1)) ? color.new(#ffffff, 100):na)

//banker fund exit/quit with red candle
plotcandle(fundtrend,bullbearline,fundtrend,bullbearline,color=fundtrend<bullbearline ? color.new(#ff5252, 60):na)

//banker fund Weak rebound with blue candle
plotcandle(fundtrend,bullbearline,fundtrend,bullbearline,color=fundtrend<bullbearline and fundtrend>(xrf(fundtrend*0.95,1)) ? color.new(#2195f3, 100):na)

//overbought and oversold threshold lines
h1 = hline(85,color=color.red, linestyle=hline.style_dotted)
h2 = hline(15, color=color.yellow, linestyle=hline.style_dotted)
h3 = hline(10,color=color.lime, linestyle=hline.style_dotted)
h4 = hline(90, color=color.fuchsia, linestyle=hline.style_dotted)
fill(h2,h3,color=color.rgb(255, 153, 0, 30))
fill(h1,h4,color=color.rgb(223, 64, 251, 30))

// TDI - Traders Dynamic Index
RSI_input = input.int(title="RSI", defval=21, minval=5)
TL_input = input.int(title="TrendLine", defval=7, minval=3)
BL_input = input.int(title="BaseLine", defval=34, minval=14)
VB_input = input.float(title="Volatility Bands", defval=1.6185, minval=1.0)

r = ta.rsi(close, RSI_input)
r_plot = ta.sma(r, 2)
r_tl = ta.sma(r, TL_input)
r_gbl = ta.sma(r, BL_input)
SD = VB_input * ta.stdev(r, BL_input)
VB_UP = r_gbl + SD
VB_DOWN = r_gbl - SD

UL = 70, MID = 50, LL = 30
hline(MID, 'Balance Level', color=color.rgb(10, 10, 10, 50), linestyle=hline.style_dashed)
hline(UL, 'Upper Level', color=color.rgb(10, 10, 10, 80), linestyle=hline.style_dashed)
hline(LL, 'Lower Level', color=color.rgb(10, 10, 10, 80), linestyle=hline.style_dashed)

plot(r_plot, 'RSI', color=#1dc72b, linewidth=2)
plot(r_tl, 'RSI TrendLine', color=#FF0000, linewidth=2)
plot(r_gbl, 'Market Baseline', color=color.orange, linewidth=2)
plot(VB_UP, 'Volatility Upper', color=#b2ebf2, linewidth=1)
plot(VB_DOWN, 'Volatility Lower', color=#b2ebf2, linewidth=1)`
  }
];

export const INDICATORS_LIST = BUILTIN_INDICATORS;

