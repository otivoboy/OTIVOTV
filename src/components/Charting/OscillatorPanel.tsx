import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IChartApi, Time } from 'lightweight-charts';
import { Eye, EyeOff, Settings, X, GripHorizontal } from 'lucide-react';
import { IndicatorOutput } from '../../lib/pineEngine';

interface OscillatorPanelProps {
  indicator: IndicatorOutput;
  chart: IChartApi | null;
  theme: 'light' | 'dark';
  onToggleVisibility: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onRemove: (id: string) => void;
  isHidden?: boolean;
}

export const OscillatorPanel: React.FC<OscillatorPanelProps> = ({
  indicator,
  chart,
  theme,
  onToggleVisibility,
  onOpenSettings,
  onRemove,
  isHidden = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>(140);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(140);
  const isDark = theme === 'dark';

  const plots = indicator.plots;
  const primaryPlot = plots[0] || [];
  const lastPoint = primaryPlot[primaryPlot.length - 1];
  const isRSI = indicator.name.toLowerCase().includes('rsi');
  const isDelta = indicator.name.toLowerCase().includes('delta');

  const lastValue = isDelta
    ? (indicator.deltaData && indicator.deltaData.length > 0 
        ? `${indicator.deltaData[indicator.deltaData.length - 1].delta >= 0 ? '+' : ''}${indicator.deltaData[indicator.deltaData.length - 1].delta} (CVD: ${indicator.deltaData[indicator.deltaData.length - 1].cvd})`
        : (lastPoint?.value !== undefined && lastPoint?.value !== null ? lastPoint.value.toFixed(0) : '--'))
    : (lastPoint && lastPoint.value !== null && !isNaN(lastPoint.value) ? lastPoint.value.toFixed(2) : '--');

  const plotColor = isRSI ? '#ab47bc' : (isDelta ? '#ffffff' : (lastPoint?.color || '#2962ff'));

  const indicatorRef = useRef(indicator);
  const chartRef = useRef(chart);
  const themeRef = useRef(theme);
  const isHiddenRef = useRef(isHidden);

  useEffect(() => { indicatorRef.current = indicator; }, [indicator]);
  useEffect(() => { chartRef.current = chart; }, [chart]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { isHiddenRef.current = isHidden; }, [isHidden]);

  // Handle panel height resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = panelHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartYRef.current - e.clientY;
      const newHeight = Math.min(320, Math.max(90, dragStartHeightRef.current + deltaY));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Main rendering loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const currentChart = chartRef.current;
    const currentIndicator = indicatorRef.current;
    const currentDark = themeRef.current === 'dark';
    const hidden = isHiddenRef.current;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Background and Right Scale Divider
    const rightScaleWidth = 55;
    const plotWidth = Math.max(10, width - rightScaleWidth);

    // Subtle background
    ctx.fillStyle = currentDark ? '#000000' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Right scale border
    ctx.strokeStyle = currentDark ? '#27272a' : '#e0e3eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotWidth, 0);
    ctx.lineTo(plotWidth, height);
    ctx.stroke();

    if (hidden) {
      ctx.restore();
      return;
    }

    const paddingY = 20;
    const chartH = height - paddingY * 2;

    const getXCoord = (time: number, idx: number): number | null => {
      if (!currentChart) return null;
      try {
        const timeScale = currentChart.timeScale();
        const coordByTime = timeScale.timeToCoordinate(time as Time);
        if (coordByTime !== null && !isNaN(coordByTime)) return coordByTime;
        const coordByLogical = (timeScale as any).logicalToCoordinate?.(idx);
        if (coordByLogical !== null && coordByLogical !== undefined && !isNaN(coordByLogical)) return coordByLogical;
      } catch {
        // ignore
      }
      return null;
    };

    // =========================================================
    // A. RSI OSCILLATOR (0 - 100 FIXED RANGE WITH DYNAMIC OVERBOUGHT/OVERSOLD BANDS)
    // =========================================================
    if (isRSI) {
      const overbought = Number(currentIndicator.params?.overbought ?? 70);
      const oversold = Number(currentIndicator.params?.oversold ?? 30);
      const midline = Number(currentIndicator.params?.midline ?? 50);
      const showBands = currentIndicator.params?.show_bands ?? true;
      const plotColor = currentIndicator.params?.plot_color || '#ab47bc';

      const valToY = (v: number) => paddingY + (1 - (v / 100)) * chartH;
      const yOB = valToY(overbought);
      const yMid = valToY(midline);
      const yOS = valToY(oversold);

      if (showBands) {
        // Shaded zone between oversold and overbought (dynamically expands/contracts)
        const topY = Math.min(yOB, yOS);
        const bottomY = Math.max(yOB, yOS);
        ctx.fillStyle = currentDark ? 'rgba(171, 71, 188, 0.12)' : 'rgba(171, 71, 188, 0.08)';
        ctx.fillRect(0, topY, plotWidth, bottomY - topY);

        // Horizontal reference lines
        ctx.save();
        // Overbought Line
        ctx.strokeStyle = currentDark ? 'rgba(239, 83, 80, 0.6)' : 'rgba(239, 83, 80, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yOB);
        ctx.lineTo(plotWidth, yOB);
        ctx.stroke();

        // Midline
        ctx.strokeStyle = currentDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yMid);
        ctx.lineTo(plotWidth, yMid);
        ctx.stroke();

        // Oversold Line
        ctx.strokeStyle = currentDark ? 'rgba(38, 166, 154, 0.6)' : 'rgba(38, 166, 154, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yOS);
        ctx.lineTo(plotWidth, yOS);
        ctx.stroke();
        ctx.restore();

        // Y-axis dynamic labels on right scale
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = currentDark ? '#ef5350' : '#d32f2f';
        ctx.textAlign = 'left';
        ctx.fillText(overbought.toFixed(1), plotWidth + 6, yOB + 3.5);

        ctx.fillStyle = currentDark ? '#787b86' : '#9598a1';
        ctx.fillText(midline.toFixed(1), plotWidth + 6, yMid + 3.5);

        ctx.fillStyle = currentDark ? '#26a69a' : '#00897b';
        ctx.fillText(oversold.toFixed(1), plotWidth + 6, yOS + 3.5);
      }

      // Plot RSI curves
      currentIndicator.plots.forEach(plotData => {
        if (plotData.length < 2) return;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let pathStarted = false;
        let lastX = 0;
        let lastY = 0;

        for (let i = 0; i < plotData.length; i++) {
          const pt = plotData[i];
          if (pt.value === null || isNaN(pt.value)) {
            if (pathStarted) {
              ctx.stroke();
              pathStarted = false;
            }
            continue;
          }

          const x = getXCoord(pt.time as number, i);
          const y = valToY(pt.value);

          if (x === null) {
            continue;
          }

          if (!pathStarted) {
            ctx.beginPath();
            ctx.strokeStyle = pt.color || plotColor;
            ctx.moveTo(x, y);
            pathStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
          lastX = x;
          lastY = y;
        }

        if (pathStarted) {
          ctx.stroke();
        }

        // Draw last value badge on right scale
        const lastVal = plotData[plotData.length - 1];
        if (lastVal && lastVal.value !== null && !isNaN(lastVal.value)) {
          const pillY = Math.max(10, Math.min(height - 10, valToY(lastVal.value)));
          ctx.fillStyle = plotColor;
          ctx.fillRect(plotWidth + 1, pillY - 9, rightScaleWidth - 2, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(lastVal.value.toFixed(2), plotWidth + 6, pillY + 3.5);
        }

        ctx.restore();
      });
    }
    // =========================================================
    // B. DELTA & VOLUME CVD OSCILLATOR (Reference Order Flow CVD & Delta Histogram)
    // =========================================================
    else if (isDelta && currentIndicator.deltaData && currentIndicator.deltaData.length > 0) {
      const deltaPts = currentIndicator.deltaData;
      let maxDelta = 10;
      let minCVD = Infinity;
      let maxCVD = -Infinity;

      deltaPts.forEach(dp => {
        maxDelta = Math.max(maxDelta, Math.abs(dp.delta));
        minCVD = Math.min(minCVD, dp.cvd);
        maxCVD = Math.max(maxCVD, dp.cvd);
      });

      if (minCVD === Infinity || maxCVD === -Infinity || minCVD === maxCVD) {
        minCVD = -1000;
        maxCVD = 5000;
      }

      // Add headroom margins
      const cvdSpanRaw = Math.max(100, maxCVD - minCVD);
      const cvdMargin = Math.max(50, cvdSpanRaw * 0.15);
      const scaledMinCVD = Math.min(-500, minCVD - cvdMargin);
      const scaledMaxCVD = Math.max(1000, maxCVD + cvdMargin);
      const cvdSpan = scaledMaxCVD - scaledMinCVD;

      const cvdToY = (cvd: number) => paddingY + (1 - ((cvd - scaledMinCVD) / cvdSpan)) * chartH;
      const zeroY = cvdToY(0);

      // Baseline at zero (+0.0)
      ctx.save();
      ctx.strokeStyle = currentDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(plotWidth, zeroY);
      ctx.stroke();
      ctx.restore();

      // 1. Draw Delta Histogram Bars (Positive = Bright Green pointing up from zeroY, Negative = Dark Red pointing down from zeroY)
      ctx.save();
      let maxNegativeDeltaIdx = -1;
      let maxNegativeDeltaVal = 0;
      let samplePositiveDeltaIdx = -1;

      deltaPts.forEach((dp, idx) => {
        const x = getXCoord(dp.time as number, idx);
        if (x === null || x < -10 || x > plotWidth + 10) return;

        const barH = (Math.abs(dp.delta) / maxDelta) * (chartH * 0.32);
        const isUp = dp.delta >= 0;
        // Exact reference colors: bright green (#16a34a / #22c55e) and dark burgundy/red (#881337 / #7f1d1d)
        ctx.fillStyle = isUp ? '#16a34a' : '#881337';
        const barW = 3.5;
        
        if (isUp) {
          ctx.fillRect(x - barW / 2, zeroY - barH, barW, Math.max(2, barH));
          if (idx > deltaPts.length - 25 && dp.delta > maxDelta * 0.5) {
            samplePositiveDeltaIdx = idx;
          }
        } else {
          ctx.fillRect(x - barW / 2, zeroY, barW, Math.max(2, barH));
          if (Math.abs(dp.delta) > maxNegativeDeltaVal && idx > 15 && idx < deltaPts.length - 10) {
            maxNegativeDeltaVal = Math.abs(dp.delta);
            maxNegativeDeltaIdx = idx;
          }
        }
      });
      ctx.restore();

      // 2. Draw CVD Curve (Solid High-Contrast Pure White line)
      ctx.save();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = currentDark ? '#ffffff' : '#09090b';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let cvdStarted = false;
      let lastCVDY = zeroY;

      deltaPts.forEach((dp, idx) => {
        const x = getXCoord(dp.time as number, idx);
        if (x === null) return;
        const y = cvdToY(dp.cvd);
        if (!cvdStarted) {
          ctx.moveTo(x, y);
          cvdStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastCVDY = y;
      });
      if (cvdStarted) ctx.stroke();
      ctx.restore();

      // 3. Draw CVD Divergence Trendlines on Subpanel (Yellow & Green matching Reference)
      if (currentIndicator.cvdLines && currentIndicator.cvdLines.length > 0) {
        ctx.save();
        currentIndicator.cvdLines.forEach(line => {
          const x1 = getXCoord(line.x1Time, 0);
          const x2 = getXCoord(line.x2Time, 0);
          if (x1 === null || x2 === null) return;
          const y1 = cvdToY(line.y1Cvd);
          const y2 = cvdToY(line.y2Cvd);

          // Draw connecting trendline
          ctx.beginPath();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 2.4;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Draw node circles at endpoints
          ctx.fillStyle = line.color;
          ctx.beginPath();
          ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
          ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Draw "Divergence" text tag on CVD line if requested
          if (line.label) {
            ctx.font = 'bold 9.5px "Inter", sans-serif';
            ctx.fillStyle = line.color;
            ctx.textAlign = 'center';
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 + (y2 < y1 ? -9 : 13);
            ctx.fillText(line.label, midX, midY);
          }
        });
        ctx.restore();
      }

      // 4. Draw Callouts & Histogram Verifications (Matching reference chart)
      ctx.save();
      // A. Cyan highlight oval around negative delta cluster: "Double check with Delta Histogram"
      if (maxNegativeDeltaIdx >= 0 && maxNegativeDeltaIdx < deltaPts.length) {
        const cyanX = getXCoord(deltaPts[maxNegativeDeltaIdx].time as number, maxNegativeDeltaIdx);
        if (cyanX !== null && cyanX > 40 && cyanX < plotWidth - 60) {
          const ovalY = zeroY + 12;
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cyanX, ovalY, 18, 16, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Text label
          ctx.font = 'bold 10px "Inter", sans-serif';
          ctx.fillStyle = '#06b6d4';
          ctx.textAlign = 'center';
          ctx.fillText('Double check with Delta Histogram', cyanX, ovalY - 22);

          // Arrow from text to oval
          ctx.beginPath();
          ctx.moveTo(cyanX, ovalY - 18);
          ctx.lineTo(cyanX, ovalY - 8);
          ctx.stroke();
        }
      }

      // B. Green arrow pointing to positive delta histogram bar
      if (samplePositiveDeltaIdx >= 0 && samplePositiveDeltaIdx < deltaPts.length) {
        const greenX = getXCoord(deltaPts[samplePositiveDeltaIdx].time as number, samplePositiveDeltaIdx);
        if (greenX !== null && greenX > 40 && greenX < plotWidth - 20) {
          const barTopY = zeroY - (Math.abs(deltaPts[samplePositiveDeltaIdx].delta) / maxDelta) * (chartH * 0.32);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.8;
          
          // Arrow pointing down to the green bar top
          ctx.beginPath();
          ctx.moveTo(greenX + 24, barTopY - 20);
          ctx.lineTo(greenX + 4, barTopY - 4);
          ctx.stroke();

          // Arrow head
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(greenX + 4, barTopY - 4);
          ctx.lineTo(greenX + 12, barTopY - 10);
          ctx.lineTo(greenX + 8, barTopY - 3);
          ctx.fill();
        }
      }
      ctx.restore();

      // 5. Right Scale Tick Labels (e.g. 5000.0, 4000.0, 3000.0, 2000.0, 1000.0, +0.0, -1000.0)
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = currentDark ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'left';

      // Always render +0.0 at the exact zero baseline
      if (zeroY >= paddingY && zeroY <= height - paddingY) {
        ctx.fillText('+0.0', plotWidth + 6, zeroY + 3.5);
      }

      // Calculate nice standard step intervals (e.g. 1000, 2000, 500)
      const range = scaledMaxCVD - scaledMinCVD;
      const step = range > 6000 ? 2000 : (range > 2500 ? 1000 : (range > 1000 ? 500 : 250));

      const startTick = Math.ceil(scaledMinCVD / step) * step;
      for (let val = startTick; val <= scaledMaxCVD; val += step) {
        if (Math.abs(val) < 1) continue; // 0 is handled above as +0.0
        const y = cvdToY(val);
        if (y >= paddingY - 2 && y <= height - paddingY + 2 && Math.abs(y - zeroY) > 12) {
          ctx.fillText(`${val.toFixed(1)}`, plotWidth + 6, y + 3.5);
        }
      }

      // Last value badge on right scale
      const lastCVD = deltaPts[deltaPts.length - 1]?.cvd || 0;
      const pillY = Math.max(10, Math.min(height - 10, lastCVDY));
      ctx.fillStyle = currentDark ? '#2563eb' : '#3b82f6';
      ctx.fillRect(plotWidth + 1, pillY - 9, rightScaleWidth - 2, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${lastCVD >= 0 ? '+' : ''}${Math.round(lastCVD)}`, plotWidth + 4, pillY + 3.5);
      ctx.restore();
    }
    // =========================================================
    // C. GENERAL OSCILLATORS (DYNAMIC RANGE)
    // =========================================================
    else {
      let minVal = Infinity;
      let maxVal = -Infinity;
      currentIndicator.plots.forEach(series => {
        series.forEach(pt => {
          if (pt.value !== null && !isNaN(pt.value)) {
            minVal = Math.min(minVal, pt.value);
            maxVal = Math.max(maxVal, pt.value);
          }
        });
      });

      if (minVal === Infinity || maxVal === -Infinity || minVal === maxVal) {
        minVal = 0;
        maxVal = 100;
      }

      const range = maxVal - minVal;
      const valToY = (v: number) => paddingY + (1 - ((v - minVal) / range)) * chartH;
      const midY = valToY((maxVal + minVal) / 2);

      // Midline
      ctx.save();
      ctx.strokeStyle = currentDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(plotWidth, midY);
      ctx.stroke();
      ctx.restore();

      // Right axis labels
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = currentDark ? '#787b86' : '#9598a1';
      ctx.textAlign = 'left';
      ctx.fillText(maxVal.toFixed(1), plotWidth + 6, paddingY + 6);
      ctx.fillText(((maxVal + minVal) / 2).toFixed(1), plotWidth + 6, midY + 3.5);
      ctx.fillText(minVal.toFixed(1), plotWidth + 6, height - paddingY);

      // Plots
      currentIndicator.plots.forEach(plotData => {
        if (plotData.length < 2) return;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let pathStarted = false;
        let lastPlotY = midY;
        for (let i = 0; i < plotData.length; i++) {
          const pt = plotData[i];
          if (pt.value === null || isNaN(pt.value)) continue;
          const x = getXCoord(pt.time as number, i);
          const y = valToY(pt.value);
          if (x === null) continue;

          if (!pathStarted) {
            ctx.beginPath();
            ctx.strokeStyle = pt.color || '#2962ff';
            ctx.moveTo(x, y);
            pathStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
          lastPlotY = y;
        }
        if (pathStarted) ctx.stroke();

        // Right scale badge
        const lastVal = plotData[plotData.length - 1];
        if (lastVal && lastVal.value !== null) {
          const pillY = Math.max(10, Math.min(height - 10, lastPlotY));
          ctx.fillStyle = lastVal.color || '#2962ff';
          ctx.fillRect(plotWidth + 1, pillY - 9, rightScaleWidth - 2, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(lastVal.value.toFixed(2), plotWidth + 4, pillY + 3.5);
        }
        ctx.restore();
      });
    }

    ctx.restore();
  }, [isRSI, isDelta]);

  useEffect(() => {
    render();

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(container);

    let unsub: (() => void) | null = null;
    if (chart) {
      const onRangeChange = () => render();
      chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);
      unsub = () => {
        try {
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
        } catch {
          // ignore
        }
      };
    }

    const timer = setInterval(render, 35);

    return () => {
      resizeObserver.disconnect();
      clearInterval(timer);
      if (unsub) unsub();
    };
  }, [chart, render]);

  return (
    <div 
      className="w-full border-t border-tv-border bg-tv-bg relative flex flex-col select-none shrink-0 group/panel"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Top Resize Drag Handle */}
      <div 
        onMouseDown={handleMouseDownResize}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-tv-accent/50 transition-colors flex items-center justify-center"
        title="Drag to resize oscillator pane"
      >
        <div className="w-12 h-0.5 bg-tv-border rounded-full group-hover/panel:bg-tv-accent opacity-0 group-hover/panel:opacity-100 transition-opacity" />
      </div>

      {/* Panel Top Header / Legend */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2 pointer-events-auto bg-tv-bg/95 backdrop-blur-xs px-2 py-0.5 rounded border border-tv-border/50 shadow-xs">
        <span className="text-xs font-semibold text-tv-text flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plotColor }} />
          {indicator.name}
        </span>
        {!isHidden && (
          <span className="text-xs font-mono font-bold" style={{ color: plotColor }}>
            {lastValue}
          </span>
        )}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={() => onToggleVisibility(indicator.id)}
            className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-tv-text transition-colors"
            title={isHidden ? 'Show' : 'Hide'}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onOpenSettings(indicator.id)}
            className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-tv-text transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(indicator.id)}
            className="p-1 hover:bg-tv-hover rounded text-tv-muted hover:text-red-500 transition-colors"
            title="Close Pane"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
};
