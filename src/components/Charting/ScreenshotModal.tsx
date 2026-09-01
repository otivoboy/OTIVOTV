import React, { useState, useEffect } from 'react';
import { Camera, X, Download, Copy, Share2, Check, ExternalLink } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { formatSymbolPrice } from '../../lib/priceFormatter';

export const ScreenshotModal: React.FC = () => {
  const { isScreenshotModalOpen, setScreenshotModalOpen, activeSymbol, activeTimeframe, candles, lastTick } = useMarketStore();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isScreenshotModalOpen) {
      setDataUrl(null);
      return;
    }

    // Try capturing canvas elements in the chart container
    try {
      const container = document.querySelector('.tv-chart-container') || document.querySelector('#tv-chart-wrapper');
      const canvases = container ? container.querySelectorAll('canvas') : document.querySelectorAll('canvas');
      
      if (canvases.length > 0) {
        // Create an offscreen composite canvas
        const firstCanvas = canvases[0] as HTMLCanvasElement;
        const width = firstCanvas.width || 1200;
        const height = firstCanvas.height || 600;

        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d');

        if (ctx) {
          // Draw all canvas layers
          canvases.forEach((c) => {
            const canvasEl = c as HTMLCanvasElement;
            ctx.drawImage(canvasEl, 0, 0, width, height);
          });

          // Add watermark header on the screenshot
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(16, 16, 260, 48);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.strokeRect(16, 16, 260, 48);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`Otivo • ${activeSymbol} (${activeTimeframe})`, 28, 38);

          const curPrice = lastTick?.price ?? (candles.length > 0 ? candles[candles.length - 1].close : 0);
          ctx.fillStyle = '#26a69a';
          ctx.font = '12px monospace';
          ctx.fillText(formatSymbolPrice(activeSymbol, curPrice) + ' • ' + new Date().toLocaleTimeString(), 28, 54);

          setDataUrl(offscreen.toDataURL('image/png'));
        }
      }
    } catch (err) {
      console.warn('Screenshot canvas capture error:', err);
    }
  }, [isScreenshotModalOpen, activeSymbol, activeTimeframe, lastTick, candles]);

  if (!isScreenshotModalOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `otivo_${activeSymbol}_${activeTimeframe}_${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCopied('image');
        setTimeout(() => setCopied(null), 2500);
      }
    } catch (e) {
      // Fallback
      setCopied('link');
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied('link');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border bg-tv-panel/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tv-accent/10 text-tv-accent">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-tv-text">Chart Snapshot</h2>
              <p className="text-xs text-tv-muted">{activeSymbol} • {activeTimeframe}</p>
            </div>
          </div>
          <button 
            onClick={() => setScreenshotModalOpen(false)}
            className="p-1.5 hover:bg-tv-hover rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-tv-panel/20">
          {dataUrl ? (
            <div className="w-full rounded-lg overflow-hidden border border-tv-border shadow-lg bg-black/40">
              <img src={dataUrl} alt="Chart Snapshot" className="w-full h-auto object-contain max-h-[50vh]" />
            </div>
          ) : (
            <div className="p-12 text-center text-tv-muted text-xs">
              <Camera className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
              Generating high-resolution snapshot preview...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-5 bg-tv-panel border-t border-tv-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="flex items-center gap-2 px-4 py-2 bg-tv-accent hover:bg-tv-accent/90 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Image (.png)</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!dataUrl}
              className="flex items-center gap-2 px-3.5 py-2 bg-tv-card hover:bg-tv-hover border border-tv-border text-tv-text rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied === 'image' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied === 'image' ? 'Image Copied!' : 'Copy Image'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-tv-muted hover:text-tv-text hover:bg-tv-hover rounded-lg transition-colors cursor-pointer"
          >
            {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied === 'link' ? 'Link Copied!' : 'Share Chart Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
