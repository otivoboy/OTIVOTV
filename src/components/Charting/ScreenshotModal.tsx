import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Download, Copy, Share2, Check, ExternalLink, Sparkles, CheckSquare, Square } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { formatSymbolPrice } from '../../lib/priceFormatter';

export const ScreenshotModal: React.FC = () => {
  const { 
    isScreenshotModalOpen, 
    setScreenshotModalOpen, 
    activeSymbol, 
    activeTimeframe, 
    candles, 
    lastTick,
    theme,
    activeIndicators,
    drawings
  } = useMarketStore();

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureChart = useCallback(() => {
    setIsCapturing(true);

    try {
      // Find the main chart wrapper or pane container
      const chartEl = 
        document.querySelector('#chart-main-container') ||
        document.querySelector('[id^="chart-pane-"]') ||
        document.querySelector('#trading-chart-wrapper') ||
        document.querySelector('.tv-chart-container')?.parentElement ||
        document.querySelector('.tv-chart-container');

      if (!chartEl) {
        setIsCapturing(false);
        return;
      }

      const parentRect = chartEl.getBoundingClientRect();
      if (parentRect.width <= 0 || parentRect.height <= 0) {
        setIsCapturing(false);
        return;
      }

      // Query ALL canvases inside the chart pane (Lightweight-charts, drawing tools canvas, oscillator panels)
      const canvases = Array.from(chartEl.querySelectorAll('canvas')) as HTMLCanvasElement[];
      
      if (canvases.length === 0) {
        setIsCapturing(false);
        return;
      }

      // Use 2x DPR for ultra crisp, high-resolution snapshots
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.round(parentRect.width * dpr);
      const targetHeight = Math.round(parentRect.height * dpr);

      const offscreen = document.createElement('canvas');
      offscreen.width = targetWidth;
      offscreen.height = targetHeight;
      const ctx = offscreen.getContext('2d', { alpha: false });

      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      // 1. Fill base theme background
      const bgColor = theme === 'light' ? '#ffffff' : '#131722';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 2. Render each canvas in exact coordinate position relative to the chart pane
      canvases.forEach((canvas) => {
        if (!canvas.width || !canvas.height) return;
        const cRect = canvas.getBoundingClientRect();
        
        // Relative coordinates within the chart container
        const dx = Math.round((cRect.left - parentRect.left) * dpr);
        const dy = Math.round((cRect.top - parentRect.top) * dpr);
        const dw = Math.round(cRect.width * dpr);
        const dh = Math.round(cRect.height * dpr);

        if (dw > 0 && dh > 0) {
          try {
            ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, dx, dy, dw, dh);
          } catch (drawErr) {
            console.warn('Canvas layer draw error:', drawErr);
          }
        }
      });

      // 3. Render High-Resolution TradingView Style Watermark & Header if enabled
      if (includeWatermark) {
        const isDark = theme !== 'light';
        const cardBg = isDark ? 'rgba(19, 23, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)';
        const cardBorder = isDark ? 'rgba(42, 46, 57, 0.9)' : 'rgba(224, 227, 235, 0.9)';
        const textPrimary = isDark ? '#ffffff' : '#131722';
        const textMuted = isDark ? '#787b86' : '#848e9c';

        // Top-Left Info Card
        const cardX = 20 * dpr;
        const cardY = 16 * dpr;
        const cardW = 320 * dpr;
        const cardH = 56 * dpr;
        const radius = 6 * dpr;

        // Draw card background pill
        ctx.save();
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cardX, cardY, cardW, cardH, radius) : ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();
        ctx.stroke();

        // Logo accent marker
        ctx.fillStyle = '#2962ff';
        ctx.beginPath();
        ctx.arc(cardX + 16 * dpr, cardY + 20 * dpr, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Symbol & Timeframe text
        ctx.fillStyle = textPrimary;
        ctx.font = `bold ${13 * dpr}px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, sans-serif`;
        const symbolClean = activeSymbol.replace(/^frx|^cry/i, '');
        ctx.fillText(`OTIVO • ${symbolClean}`, cardX + 26 * dpr, cardY + 24 * dpr);

        // Timeframe badge
        ctx.fillStyle = textMuted;
        ctx.font = `bold ${11 * dpr}px monospace`;
        ctx.fillText(`[${activeTimeframe}]`, cardX + (28 + ctx.measureText(`OTIVO • ${symbolClean}`).width / dpr + 4) * dpr, cardY + 24 * dpr);

        // Current Price & Candle OHLC
        const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
        const curPrice = lastTick?.price ?? (lastCandle ? lastCandle.close : 0);
        const isBullish = lastCandle ? lastCandle.close >= lastCandle.open : true;
        const priceColor = isBullish ? '#26a69a' : '#ef5350';

        ctx.fillStyle = priceColor;
        ctx.font = `bold ${12 * dpr}px monospace`;
        const priceText = formatSymbolPrice(curPrice, activeSymbol);
        ctx.fillText(priceText, cardX + 16 * dpr, cardY + 44 * dpr);

        // OHLC info
        if (lastCandle) {
          ctx.fillStyle = textMuted;
          ctx.font = `${10 * dpr}px monospace`;
          const ohlcText = `O:${formatSymbolPrice(lastCandle.open, activeSymbol)} H:${formatSymbolPrice(lastCandle.high, activeSymbol)} L:${formatSymbolPrice(lastCandle.low, activeSymbol)}`;
          ctx.fillText(ohlcText, cardX + 110 * dpr, cardY + 44 * dpr);
        }

        // Active Tools Count Badge
        const activeSymbolDrawings = drawings.filter(d => !d.symbol || d.symbol === activeSymbol);
        if (activeSymbolDrawings.length > 0 || activeIndicators.length > 0) {
          ctx.fillStyle = isDark ? '#2a2e39' : '#f0f3fa';
          ctx.beginPath();
          const badgeX = cardX + cardW - 85 * dpr;
          const badgeY = cardY + 8 * dpr;
          const badgeW = 75 * dpr;
          const badgeH = 18 * dpr;
          ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * dpr) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
          ctx.fill();

          ctx.fillStyle = '#2962ff';
          ctx.font = `bold ${9 * dpr}px sans-serif`;
          ctx.fillText(`${activeSymbolDrawings.length} Tools · ${activeIndicators.length} Ind`, badgeX + 5 * dpr, badgeY + 12 * dpr);
        }

        // Bottom-Right Watermark
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.35)';
        ctx.font = `bold ${11 * dpr}px -apple-system, BlinkMacSystemFont, sans-serif`;
        const bottomWatermark = 'charting powered by Otivo';
        const wmMetrics = ctx.measureText(bottomWatermark);
        ctx.fillText(bottomWatermark, targetWidth - wmMetrics.width - 24 * dpr, targetHeight - 16 * dpr);

        ctx.restore();
      }

      compositeCanvasRef.current = offscreen;
      const generatedUrl = offscreen.toDataURL('image/png', 1.0);
      setDataUrl(generatedUrl);
    } catch (err) {
      console.error('Screenshot composite capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [activeSymbol, activeTimeframe, candles, lastTick, theme, activeIndicators, drawings, includeWatermark]);

  useEffect(() => {
    if (isScreenshotModalOpen) {
      // Delay slightly to ensure render loop and drawing canvas are fully drawn
      const timer = setTimeout(() => {
        captureChart();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setDataUrl(null);
    }
  }, [isScreenshotModalOpen, captureChart]);

  if (!isScreenshotModalOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const cleanSym = activeSymbol.replace(/^frx|^cry/i, '');
    const link = document.createElement('a');
    link.download = `Otivo_${cleanSym}_${activeTimeframe}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyImage = async () => {
    if (!compositeCanvasRef.current && !dataUrl) return;
    try {
      if (compositeCanvasRef.current && navigator.clipboard && (window as any).ClipboardItem) {
        compositeCanvasRef.current.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob })
            ]);
            setCopied('image');
            setTimeout(() => setCopied(null), 2500);
          }
        }, 'image/png', 1.0);
        return;
      }

      const response = await fetch(dataUrl!);
      const blob = await response.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCopied('image');
        setTimeout(() => setCopied(null), 2500);
      }
    } catch (e) {
      // Fallback to link copy
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied('link');
    setTimeout(() => setCopied(null), 2500);
  };

  const handleOpenNewTab = () => {
    if (!dataUrl) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Otivo Chart Snapshot - ${activeSymbol} (${activeTimeframe})</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 96vw; max-height: 96vh; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-radius: 8px; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Otivo Snapshot" />
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setScreenshotModalOpen(false)}
    >
      <div 
        className="w-full max-w-3xl bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-tv-border bg-tv-panel/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tv-accent/10 text-tv-accent flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-tv-text">Chart Snapshot</h2>
                <span className="px-1.5 py-0.5 rounded bg-tv-accent/15 text-tv-accent text-[10px] font-mono font-bold uppercase">
                  {drawings.length} Tools Applied
                </span>
              </div>
              <p className="text-xs text-tv-muted">{activeSymbol.replace(/^frx|^cry/i, '')} • {activeTimeframe} timeframe</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIncludeWatermark(!includeWatermark);
                setTimeout(captureChart, 50);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-tv-hover hover:bg-tv-border text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
              title="Toggle watermark overlay on image"
            >
              {includeWatermark ? <CheckSquare className="w-3.5 h-3.5 text-tv-accent" /> : <Square className="w-3.5 h-3.5" />}
              <span>Watermark</span>
            </button>

            <button 
              onClick={() => setScreenshotModalOpen(false)}
              className="p-1.5 hover:bg-tv-hover rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
              aria-label="Close Snapshot modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Snapshot Image Preview Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-tv-bg/80 min-h-[260px]">
          {dataUrl ? (
            <div className="w-full relative rounded-lg overflow-hidden border border-tv-border shadow-xl bg-tv-bg flex items-center justify-center group">
              <img 
                src={dataUrl} 
                alt={`Otivo Snapshot ${activeSymbol}`} 
                className="w-full h-auto object-contain max-h-[55vh] rounded select-none" 
              />
              <button
                onClick={handleOpenNewTab}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                title="Open high-res snapshot in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-12 text-center text-tv-muted flex flex-col items-center justify-center gap-2">
              <Camera className="w-10 h-10 opacity-40 animate-pulse text-tv-accent" />
              <p className="text-xs font-medium">Capturing candlesticks, drawings, and indicator panels...</p>
            </div>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="p-3.5 sm:p-4 bg-tv-panel border-t border-tv-border flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={!dataUrl || isCapturing}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-tv-accent hover:bg-tv-accent/90 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!dataUrl || isCapturing}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-tv-card hover:bg-tv-hover border border-tv-border text-tv-text rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {copied === 'image' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied === 'image' ? 'Image Copied!' : 'Copy Image'}</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              disabled={!dataUrl}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-tv-card hover:bg-tv-hover border border-tv-border text-tv-muted hover:text-tv-text rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Open full size image in a new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Tab</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-tv-muted hover:text-tv-text hover:bg-tv-hover rounded-lg transition-colors cursor-pointer"
            >
              {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied === 'link' ? 'Link Copied!' : 'Share Chart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

