import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Palette, 
  Sliders, 
  Check, 
  RotateCcw,
  Percent,
  DollarSign,
  ShieldAlert,
  Target
} from 'lucide-react';
import { Drawing, useMarketStore } from '../../store/useMarketStore';

interface DrawingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawing: Drawing | null;
  onUpdate: (updates: Partial<Drawing>) => void;
}

const DEFAULT_FIB_LEVELS = [
  { level: 0, color: '#787b86', active: true },
  { level: 0.236, color: '#f23645', active: true },
  { level: 0.382, color: '#ff9800', active: true },
  { level: 0.5, color: '#4caf50', active: true },
  { level: 0.618, color: '#089981', active: true },
  { level: 0.786, color: '#2962ff', active: true },
  { level: 1, color: '#9c27b0', active: true },
  { level: 1.618, color: '#2962ff', active: true },
  { level: 2.618, color: '#f23645', active: false },
  { level: 3.618, color: '#9c27b0', active: false },
  { level: 4.236, color: '#e91e63', active: false },
  { level: -0.236, color: '#f23645', active: false },
  { level: -0.618, color: '#089981', active: false },
  { level: -2.618, color: '#2962ff', active: false },
  { level: 1.272, color: '#787b86', active: false },
  { level: 1.414, color: '#f23645', active: false },
];

export const DrawingSettingsModal: React.FC<DrawingSettingsModalProps> = ({
  isOpen,
  onClose,
  drawing,
  onUpdate
}) => {
  const isDark = useMarketStore(s => s.theme === 'dark');

  const [activeTab, setActiveTab] = useState<'inputs' | 'style' | 'visibility'>('style');

  // Form states for Long/Short Position
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [riskAmount, setRiskAmount] = useState<string>('750');
  const [rewardAmount, setRewardAmount] = useState<string>('1500');
  const [quantity, setQuantity] = useState<string>('3');
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('2');

  // Style states
  const [targetColor, setTargetColor] = useState<string>('#26a69a');
  const [stopColor, setStopColor] = useState<string>('#ef5350');
  const [lineColor, setLineColor] = useState<string>('#2962ff');
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [showBadges, setShowBadges] = useState<boolean>(true);
  const [showStatusCard, setShowStatusCard] = useState<boolean>(true);

  // Generic drawing properties
  const [genericPrice, setGenericPrice] = useState<string>('');
  const [genericText, setGenericText] = useState<string>('');

  // Fib properties
  const [fibLevels, setFibLevels] = useState(DEFAULT_FIB_LEVELS);
  const [fibUseOneColor, setFibUseOneColor] = useState(false);
  const [fibOneColor, setFibOneColor] = useState('#2962ff');
  const [fibExtendLeft, setFibExtendLeft] = useState(false);
  const [fibExtendRight, setFibExtendRight] = useState(false);
  const [fibReverse, setFibReverse] = useState(false);
  const [fibBackground, setFibBackground] = useState(true);

  useEffect(() => {
    if (!drawing) return;

    if (drawing.type === 'Long position' || drawing.type === 'Short position') {
      const data = drawing.data || {};
      const entry = data.entry?.price ?? 0;
      const tp = data.tp?.price ?? 0;
      const sl = data.sl?.price ?? 0;

      setEntryPrice(entry.toString());
      setTpPrice(tp.toString());
      setSlPrice(sl.toString());
      setRiskAmount((data.riskAmount ?? 750).toString());
      setRewardAmount((data.rewardAmount ?? 1500).toString());
      setQuantity((data.qty ?? 3).toString());
      setAccountSize((data.accountSize ?? 10000).toString());
      setRiskPercent((data.riskPercent ?? 2).toString());

      setTargetColor(data.targetColor || (drawing.type === 'Long position' ? '#26a69a' : '#22c55e'));
      setStopColor(data.stopColor || '#ef5350');
      setShowBadges(data.showBadges !== false);
      setShowStatusCard(data.showStatusCard !== false);
      setActiveTab('inputs');
    } else if (drawing.type === 'Fib retracement') {
      setFibLevels(drawing.data?.fibLevels || DEFAULT_FIB_LEVELS);
      setFibUseOneColor(drawing.data?.fibUseOneColor || false);
      setFibOneColor(drawing.data?.fibOneColor || '#2962ff');
      setFibExtendLeft(drawing.data?.fibExtendLeft || false);
      setFibExtendRight(drawing.data?.fibExtendRight || false);
      setFibReverse(drawing.data?.fibReverse || false);
      setFibBackground(drawing.data?.fibBackground !== false);
      setLineColor(drawing.color || '#2962ff');
      setLineWidth(drawing.lineWidth || 1);
      setActiveTab('style');
    } else {
      setLineColor(drawing.color || '#2962ff');
      setLineWidth(drawing.lineWidth || 2);
      if (drawing.data?.price !== undefined) {
        setGenericPrice(drawing.data.price.toString());
      }
      if (drawing.data?.text !== undefined) {
        setGenericText(drawing.data.text);
      }
      setActiveTab('style');
    }
  }, [drawing, isOpen]);

  if (!isOpen || !drawing) return null;

  const isPosition = drawing.type === 'Long position' || drawing.type === 'Short position';
  const isFib = drawing.type === 'Fib retracement';
  const isLong = drawing.type === 'Long position';

  // Derived calculations for position tool
  const numEntry = parseFloat(entryPrice) || 0;
  const numTp = parseFloat(tpPrice) || 0;
  const numSl = parseFloat(slPrice) || 0;
  const numRiskAmt = parseFloat(riskAmount) || 0;
  const numQty = parseFloat(quantity) || 1;

  const targetDiff = Math.abs(numTp - numEntry);
  const stopDiff = Math.abs(numSl - numEntry);
  const rrRatio = stopDiff > 0 ? (targetDiff / stopDiff).toFixed(2) : '1.00';
  const targetPct = numEntry > 0 ? ((targetDiff / numEntry) * 100).toFixed(2) : '0.00';
  const stopPct = numEntry > 0 ? ((stopDiff / numEntry) * 100).toFixed(2) : '0.00';

  const handleApply = () => {
    if (isPosition) {
      const parsedEntry = parseFloat(entryPrice);
      const parsedTp = parseFloat(tpPrice);
      const parsedSl = parseFloat(slPrice);

      if (isNaN(parsedEntry) || isNaN(parsedTp) || isNaN(parsedSl)) {
        return;
      }

      onUpdate({
        data: {
          ...drawing.data,
          entry: {
            ...drawing.data.entry,
            price: parsedEntry
          },
          tp: {
            price: parsedTp
          },
          sl: {
            price: parsedSl
          },
          riskAmount: parseFloat(riskAmount) || 750,
          rewardAmount: parseFloat(rewardAmount) || (parseFloat(riskAmount) || 750) * (parseFloat(rrRatio) || 2),
          qty: parseFloat(quantity) || 3,
          accountSize: parseFloat(accountSize) || 10000,
          riskPercent: parseFloat(riskPercent) || 2,
          targetColor,
          stopColor,
          showBadges,
          showStatusCard
        }
      });
    } else if (isFib) {
       onUpdate({
         color: lineColor,
         lineWidth,
         data: {
           ...drawing.data,
           fibLevels,
           fibUseOneColor,
           fibOneColor,
           fibExtendLeft,
           fibExtendRight,
           fibReverse,
           fibBackground
         }
       });
    } else {
      const updates: any = {
        color: lineColor,
        lineWidth,
        data: { ...drawing.data }
      };
      if (genericPrice !== '' && !isNaN(parseFloat(genericPrice))) {
        updates.data.price = parseFloat(genericPrice);
      }
      if (genericText !== '') {
        updates.data.text = genericText;
      }
      onUpdate(updates);
    }
    onClose();
  };

  const handleResetDefaults = () => {
    if (isPosition) {
      if (numEntry > 0) {
        const delta = numEntry * 0.006;
        setTpPrice((isLong ? numEntry + delta * 2 : numEntry - delta * 2).toFixed(4));
        setSlPrice((isLong ? numEntry - delta : numEntry + delta).toFixed(4));
        setRiskAmount('750');
        setQuantity('3');
      }
    } else if (isFib) {
      setFibLevels(DEFAULT_FIB_LEVELS);
      setFibUseOneColor(false);
      setFibExtendLeft(false);
      setFibExtendRight(false);
      setFibReverse(false);
      setFibBackground(true);
    }
  };

  const updateFibLevel = (index: number, updates: Partial<typeof DEFAULT_FIB_LEVELS[0]>) => {
    const newLevels = [...fibLevels];
    newLevels[index] = { ...newLevels[index], ...updates };
    setFibLevels(newLevels);
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark ? 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]' : 'bg-white border-gray-200 text-gray-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
          isDark ? 'border-[#2a2e39] bg-[#161a25]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              isPosition 
                ? (isLong ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              {isPosition ? (
                isLong ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">
                {isPosition ? `${drawing.type} Settings` : `${drawing.type} Properties`}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {drawing.symbol ? `Symbol: ${drawing.symbol}` : 'Chart Drawing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b px-5 pt-2 gap-4 ${isDark ? 'border-[#2a2e39] bg-[#1a1e29]' : 'border-gray-200 bg-gray-100/50'}`}>
          <button
            onClick={() => setActiveTab('inputs')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'inputs'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Inputs & Coordinates
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'style'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Style & Visibility
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
          {activeTab === 'inputs' && isPosition && (
            <div className="space-y-4 text-xs">
              {/* Summary Stats Pill */}
              <div className={`p-3 rounded-lg border grid grid-cols-3 gap-2 text-center ${
                isDark ? 'bg-[#141722] border-[#2a2e39]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Risk/Reward</span>
                  <span className="text-sm font-bold text-blue-400">{rrRatio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Target Profit</span>
                  <span className="text-sm font-semibold text-emerald-400">+{targetPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Stop Loss</span>
                  <span className="text-sm font-semibold text-red-400">-{stopPct}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-gray-300">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-gray-300">Target Profit (TP)</label>
                  <input
                    type="number"
                    step="any"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono ${
                      isDark ? 'bg-[#141722] border-emerald-500/30 text-emerald-400' : 'bg-white border-emerald-300 text-emerald-700'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-gray-300">Stop Loss (SL)</label>
                  <input
                    type="number"
                    step="any"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-mono ${
                      isDark ? 'bg-[#141722] border-red-500/30 text-red-400' : 'bg-white border-red-300 text-red-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Risk Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Risk %</label>
                  <input
                    type="number"
                    step="any"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Quantity / Lot Size</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Account Size ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={accountSize}
                    onChange={(e) => setAccountSize(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inputs' && !isPosition && !isFib && (
            <div className="space-y-4 text-xs">
              {drawing.data?.price !== undefined && (
                <div className="space-y-1.5">
                  <label className="font-medium text-gray-300">Price Coordinate</label>
                  <input
                    type="number"
                    step="any"
                    value={genericPrice}
                    onChange={(e) => setGenericPrice(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}

              {drawing.data?.text !== undefined && (
                <div className="space-y-1.5">
                  <label className="font-medium text-gray-300">Text / Note</label>
                  <input
                    type="text"
                    value={genericText}
                    onChange={(e) => setGenericText(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4 text-xs">
              {isPosition ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-300 font-medium block">Target Zone Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={targetColor}
                          onChange={(e) => setTargetColor(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer border border-[#2a2e39] bg-transparent p-0.5"
                        />
                        <span className="font-mono text-gray-400">{targetColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-300 font-medium block">Stop Loss Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={stopColor}
                          onChange={(e) => setStopColor(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer border border-[#2a2e39] bg-transparent p-0.5"
                        />
                        <span className="font-mono text-gray-400">{stopColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2a2e39] space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBadges}
                        onChange={(e) => setShowBadges(e.target.checked)}
                        className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-gray-300">Show Price Badges & Target/Stop details</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showStatusCard}
                        onChange={(e) => setShowStatusCard(e.target.checked)}
                        className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-gray-300">Show Center Risk/Reward & PnL Status Card</span>
                    </label>
                  </div>
                </>
              ) : isFib ? (
                <div className="space-y-5">
                   <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-3 border-b border-[#2a2e39]">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fibExtendLeft} onChange={e => setFibExtendLeft(e.target.checked)} className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" />
                        <span className="text-gray-300">Extend lines left</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fibExtendRight} onChange={e => setFibExtendRight(e.target.checked)} className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" />
                        <span className="text-gray-300">Extend lines right</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fibReverse} onChange={e => setFibReverse(e.target.checked)} className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" />
                        <span className="text-gray-300">Reverse</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fibUseOneColor} onChange={e => setFibUseOneColor(e.target.checked)} className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" />
                        <span className="text-gray-300">Use one color</span>
                     </label>
                     {fibUseOneColor && (
                        <input
                          type="color"
                          value={fibOneColor}
                          onChange={(e) => setFibOneColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-[#2a2e39] bg-transparent p-0"
                        />
                     )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     {fibLevels.map((lvl, idx) => (
                       <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={lvl.active} 
                            onChange={e => updateFibLevel(idx, { active: e.target.checked })}
                            className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" 
                          />
                          <input 
                            type="number" 
                            value={lvl.level}
                            onChange={e => updateFibLevel(idx, { level: parseFloat(e.target.value) || 0 })}
                            className={`w-16 px-1.5 py-1 rounded border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isDark ? 'bg-[#141722] border-[#2a2e39] text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          {!fibUseOneColor && (
                             <input
                              type="color"
                              value={lvl.color}
                              onChange={e => updateFibLevel(idx, { color: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer border border-[#2a2e39] bg-transparent p-0"
                             />
                          )}
                       </div>
                     ))}
                   </div>
                   
                   <div className="pt-3 border-t border-[#2a2e39]">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fibBackground} onChange={e => setFibBackground(e.target.checked)} className="rounded bg-[#141722] border-[#2a2e39] text-blue-500 focus:ring-0" />
                        <span className="text-gray-300">Background Shading</span>
                     </label>
                   </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-gray-300 font-medium block">Line Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={lineColor}
                        onChange={(e) => setLineColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-[#2a2e39] bg-transparent p-0.5"
                      />
                      <span className="font-mono text-gray-400">{lineColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 font-medium block">Line Width: {lineWidth}px</label>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${
          isDark ? 'border-[#2a2e39] bg-[#161a25]' : 'border-gray-200 bg-gray-50'
        }`}>
          {isPosition || isFib ? (
            <button
              onClick={handleResetDefaults}
              className={`flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                isDark 
                  ? 'border-[#2a2e39] text-gray-300 hover:bg-white/5' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
