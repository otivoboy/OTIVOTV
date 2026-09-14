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
  const isRSI = indicator.name.toLowerCase().includes('rsi') && !indicator.name.toLowerCase().includes('banker');
  const isDelta = indicator.name.toLowerCase().includes('delta');
  const isBanker = indicator.id === 'banker_fund_flow_tdi_leo' || indicator.id.includes('banker_fund_flow') || indicator.name.toLowerCase().includes('banker fund flow') || indicator.name.toLowerCase().includes('tdi leo') || Boolean(indicator.bankerData);
  const isVolume = (indicator.name.toLowerCase() === 'volume' || indicator.id.toLowerCase().includes('volume') || indicator.id.toLowerCase().includes('default-vol')) && !isDelta && !indicator.name.toLowerCase().includes('liquidity') && !isBanker;

  const formatVol = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
    return val.toFixed(0);
  };

  const lastValue = isDelta
    ? (indicator.deltaData && indicator.deltaData.length > 0 
        ? `${indicator.deltaData[indicator.deltaData.length - 1].delta >= 0 ? '+' : ''}${indicator.deltaData[indicator.deltaData.length - 1].delta} (CVD: ${indicator.deltaData[indicator.deltaData.length - 1].cvd})`
        : (lastPoint?.value !== undefined && lastPoint?.value !== null ? lastPoint.value.toFixed(0) : '--'))
    : isVolume
    ? formatVol(lastPoint?.value)
    : isBanker
    ? (lastPoint && lastPoint.value !== null && !isNaN(lastPoint.value) ? `${lastPoint.value.toFixed(2)}` : '--')
    : (lastPoint && lastPoint.value !== null && !isNaN(lastPoint.value) ? lastPoint.value.toFixed(2) : '--');

  const plotColor = isRSI ? '#ab47bc' : (isDelta ? '#ffffff' : isBanker ? '#1dc72b' : isVolume ? (lastPoint?.color || '#26a69a') : (lastPoint?.color || '#2962ff'));

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
    ctx.fillStyle = currentDark ? '#131722' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Right scale border
    ctx.strokeStyle = currentDark ? '#2a2e39' : '#e0e3eb';
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
    // C. VOLUME OSCILLATOR (TradingView Style Columns + Volume MA)
    // =========================================================
    else if (isVolume) {
      const volSeries = currentIndicator.plots[0] || [];
      const maSeries = currentIndicator.plots[1] || [];

      let maxVol = 100;
      volSeries.forEach(pt => {
        if (pt.value !== null && !isNaN(pt.value)) {
          maxVol = Math.max(maxVol, pt.value);
        }
      });
      maSeries.forEach(pt => {
        if (pt.value !== null && !isNaN(pt.value)) {
          maxVol = Math.max(maxVol, pt.value);
        }
      });

      const headRoom = maxVol * 1.15;
      const bottomY = height - 12;
      const usableH = bottomY - paddingY;
      const valToY = (v: number) => bottomY - (v / Math.max(1, headRoom)) * usableH;

      // 1. Draw Volume Columns
      ctx.save();
      for (let i = 0; i < volSeries.length; i++) {
        const pt = volSeries[i];
        if (pt.value === null || isNaN(pt.value) || pt.value <= 0) continue;
        const x = getXCoord(pt.time as number, i);
        if (x === null || x < -20 || x > plotWidth + 20) continue;

        let barW = 4;
        if (i < volSeries.length - 1) {
          const nextX = getXCoord(volSeries[i + 1].time as number, i + 1);
          if (nextX !== null && nextX > x) {
            barW = Math.max(1.5, Math.min(22, (nextX - x) * 0.75));
          }
        }
        const barH = (pt.value / Math.max(1, headRoom)) * usableH;
        ctx.fillStyle = pt.color || '#26a69a';
        ctx.fillRect(x - barW / 2, bottomY - barH, barW, Math.max(1.5, barH));
      }
      ctx.restore();

      // 2. Draw Volume Moving Average Line (if present)
      if (maSeries.length > 1) {
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = currentIndicator.params?.ma_color || '#2962ff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < maSeries.length; i++) {
          const pt = maSeries[i];
          if (pt.value === null || isNaN(pt.value)) continue;
          const x = getXCoord(pt.time as number, i);
          if (x === null) continue;
          const y = valToY(pt.value);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        if (started) ctx.stroke();
        ctx.restore();
      }

      // 3. Right Scale Axis labels (e.g. 50K, 25K, 0)
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = currentDark ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'left';

      const formatVolLabel = (v: number) => {
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
        return `${Math.round(v)}`;
      };

      const topVal = headRoom * 0.9;
      const midVal = headRoom * 0.45;
      ctx.fillText(formatVolLabel(topVal), plotWidth + 6, valToY(topVal) + 3.5);
      ctx.fillText(formatVolLabel(midVal), plotWidth + 6, valToY(midVal) + 3.5);
      ctx.fillText('0', plotWidth + 6, bottomY + 3.5);

      // Last value badge on right scale
      const lastVolPt = volSeries[volSeries.length - 1];
      if (lastVolPt && lastVolPt.value !== null && !isNaN(lastVolPt.value)) {
        const pillY = Math.max(10, Math.min(height - 10, valToY(lastVolPt.value)));
        ctx.fillStyle = lastVolPt.color || '#26a69a';
        ctx.fillRect(plotWidth + 1, pillY - 9, rightScaleWidth - 2, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatVolLabel(lastVolPt.value), plotWidth + 4, pillY + 3.5);
      }
      ctx.restore();
    }
    // =========================================================
    // D. BANKER FUND FLOW TREND OSCILLATOR WITH TDI LEO
    // =========================================================
    else if (isBanker) {
      const minVal = 0;
      const maxVal = 100;
      const range = maxVal - minVal;
      const valToY = (v: number) => paddingY + (1 - ((v - minVal) / range)) * chartH;

      // 1. Shaded Overbought (85-90 purple) & Oversold (10-15 amber) Ribbon Zones
      const y90 = valToY(90);
      const y85 = valToY(85);
      ctx.save();
      ctx.fillStyle = 'rgba(223, 64, 251, 0.45)';
      ctx.fillRect(0, y90, plotWidth, Math.max(2, y85 - y90));

      const y15 = valToY(15);
      const y10 = valToY(10);
      ctx.fillStyle = 'rgba(255, 153, 0, 0.45)';
      ctx.fillRect(0, y15, plotWidth, Math.max(2, y10 - y15));
      ctx.restore();

      // 2. Reference Lines (90, 85, 70, 50, 30, 15, 10)
      const hlines = [
        { val: 90, color: '#e040fb', style: 'dotted' },
        { val: 85, color: '#ef5350', style: 'dotted' },
        { val: 70, color: currentDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)', style: 'dashed' },
        { val: 50, color: currentDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)', style: 'dashed' },
        { val: 30, color: currentDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)', style: 'dashed' },
        { val: 15, color: '#ffb300', style: 'dotted' },
        { val: 10, color: '#76ff03', style: 'dotted' },
      ];

      ctx.save();
      hlines.forEach(hl => {
        const y = valToY(hl.val);
        ctx.strokeStyle = hl.color;
        ctx.lineWidth = 1;
        if (hl.style === 'dashed') ctx.setLineDash([4, 4]);
        else if (hl.style === 'dotted') ctx.setLineDash([2, 2]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
      });
      ctx.restore();

      // 3. Banker Fund Flow Candle Bars (Green accumulation, White decrease, Red exit, Blue rebound)
      if (currentIndicator.bankerData && currentIndicator.bankerData.length > 0) {
        ctx.save();
        const bankerPts = currentIndicator.bankerData;
        for (let i = 0; i < bankerPts.length; i++) {
          const pt = bankerPts[i];
          const x = getXCoord(pt.time, i);
          if (x === null || x < -20 || x > plotWidth + 20) continue;

          let barW = 3.5;
          if (i < bankerPts.length - 1) {
            const nextX = getXCoord(bankerPts[i + 1].time, i + 1);
            if (nextX !== null && nextX > x) {
              barW = Math.max(1.5, Math.min(18, (nextX - x) * 0.75));
            }
          }

          const yFt = valToY(pt.fundtrend);
          const yBbl = valToY(pt.bullbearline);
          const yTop = Math.min(yFt, yBbl);
          const yBtm = Math.max(yFt, yBbl);
          const barH = Math.max(2, yBtm - yTop);

          ctx.fillStyle = pt.color;
          ctx.fillRect(x - barW / 2, yTop, barW, barH);

          // If banker entry signal, draw small diamond marker
          if (pt.entrySignal) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x, yTop - 5, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 4. TDI Plot Curves (Volatility Upper/Lower, Market Baseline, RSI TrendLine, RSI Fast)
      const plotsToDraw = [
        { idx: 3, width: 1.2, color: '#80deea' }, // Vol Upper
        { idx: 4, width: 1.2, color: '#80deea' }, // Vol Lower
        { idx: 2, width: 2.0, color: '#ff9800' }, // Market Baseline
        { idx: 1, width: 2.0, color: '#ff0000' }, // Trendline
        { idx: 0, width: 2.0, color: '#1dc72b' }, // RSI Fast
      ];

      plotsToDraw.forEach(plotDef => {
        const plotData = currentIndicator.plots[plotDef.idx];
        if (!plotData || plotData.length < 2) return;

        ctx.save();
        ctx.lineWidth = plotDef.width;
        ctx.strokeStyle = plotDef.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < plotData.length; i++) {
          const pt = plotData[i];
          if (pt.value === null || isNaN(pt.value)) continue;
          const x = getXCoord(pt.time as number, i);
          if (x === null) continue;
          const y = valToY(pt.value);

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        if (started) ctx.stroke();
        ctx.restore();
      });

      // 5. Divergence Lines
      if (currentIndicator.lines && currentIndicator.lines.length > 0) {
        ctx.save();
        currentIndicator.lines.forEach(line => {
          const x1 = getXCoord(line.x1, 0);
          const x2 = getXCoord(line.x2, 0);
          if (x1 === null || x2 === null) return;
          const y1 = valToY(line.y1);
          const y2 = valToY(line.y2);

          ctx.beginPath();
          ctx.strokeStyle = line.color || '#ff5252';
          ctx.lineWidth = line.width || 2;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          ctx.fillStyle = line.color || '#ff5252';
          ctx.beginPath();
          ctx.arc(x1, y1, 3, 0, Math.PI * 2);
          ctx.arc(x2, y2, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 6. Divergence Badges/Labels ("Bear", "Bull", "H Bear", "H Bull")
      if (currentIndicator.labels && currentIndicator.labels.length > 0) {
        ctx.save();
        currentIndicator.labels.forEach(label => {
          const x = getXCoord(label.x, 0);
          if (x === null || x < 0 || x > plotWidth) return;
          const y = valToY(label.y);

          ctx.font = 'bold 9px "Inter", sans-serif';
          const textMetrics = ctx.measureText(label.text);
          const bgW = textMetrics.width + 8;
          const bgH = 14;
          const badgeX = x - bgW / 2;
          const badgeY = y - bgH / 2;

          ctx.fillStyle = label.color || '#ef5350';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, bgW, bgH, 3);
            ctx.fill();
          } else {
            ctx.fillRect(badgeX, badgeY, bgW, bgH);
          }

          ctx.fillStyle = label.textcolor || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label.text, x, y);
        });
        ctx.restore();
      }

      // 7. Right Scale Axis labels & badges
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = currentDark ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'left';

      const axisTicks = [100, 90, 85, 70, 50, 30, 15, 10, 0];
      axisTicks.forEach(tickVal => {
        const y = valToY(tickVal);
        if (y >= paddingY - 2 && y <= height - paddingY + 2) {
          ctx.fillText(tickVal.toFixed(1), plotWidth + 6, y + 3.5);
        }
      });

      // Right scale badges for key active curves (matching TradingView display)
      const badgeDefs = [
        { plotIdx: 0, color: '#1dc72b' }, // RSI Fast (Green)
        { plotIdx: 1, color: '#FF0000' }, // RSI TrendLine (Red)
        { plotIdx: 3, color: '#ab47bc' }, // Vol Upper (Purple)
        { plotIdx: 2, color: '#ff9800' }, // Market Baseline (Orange)
        { plotIdx: 4, color: '#0288d1' }, // Vol Lower (Blue)
      ];

      badgeDefs.forEach(b => {
        const series = currentIndicator.plots[b.plotIdx];
        const lastPt = series ? series[series.length - 1] : null;
        const val = (lastPt && lastPt.value !== null && !isNaN(lastPt.value)) ? lastPt.value : null;
        if (val !== null) {
          const pillY = Math.max(10, Math.min(height - 10, valToY(val)));
          ctx.fillStyle = b.color;
          ctx.fillRect(plotWidth + 1, pillY - 8, rightScaleWidth - 2, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(val.toFixed(2), plotWidth + 4, pillY + 3.5);
        }
      });
      ctx.restore();
    }
    // =========================================================
    // E. GENERAL OSCILLATORS (DYNAMIC RANGE)
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
      className="w-full border-t border-[#e0e3eb] dark:border-[#2a2e39] bg-white dark:bg-[#131722] relative flex flex-col select-none shrink-0 group/panel"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Top Resize Drag Handle */}
      <div 
        onMouseDown={handleMouseDownResize}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-20 hover:bg-[#2962ff]/50 transition-colors flex items-center justify-center"
        title="Drag to resize oscillator pane"
      >
        <div className="w-12 h-0.5 bg-[#e0e3eb] dark:bg-[#2a2e39] rounded-full group-hover/panel:bg-[#2962ff] opacity-0 group-hover/panel:opacity-100 transition-opacity" />
      </div>

      {/* Panel Top Header / Legend (Hidden on mobile view to prevent blocking oscillator canvas) */}
      <div className="hidden sm:flex absolute top-2 left-3 z-10 items-center gap-2 pointer-events-auto bg-white/90 dark:bg-[#131722]/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#e0e3eb] dark:border-[#2a2e39] shadow-xs max-w-[calc(100%-70px)] whitespace-nowrap">
        <span className="text-xs font-semibold text-[#131722] dark:text-[#d1d4dc] flex items-center gap-1.5 shrink-0 truncate max-w-[200px] md:max-w-[320px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: plotColor }} />
          <span className="truncate">{indicator.name}</span>
        </span>
        {/* Values */}
        {!isHidden && (
          isBanker ? (
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold shrink-0">
              {indicator.plots[0]?.[indicator.plots[0].length - 1]?.value != null && (
                <span style={{ color: '#1dc72b' }}>
                  {indicator.plots[0][indicator.plots[0].length - 1].value?.toFixed(2)}
                </span>
              )}
              {indicator.plots[1]?.[indicator.plots[1].length - 1]?.value != null && (
                <span style={{ color: '#FF0000' }}>
                  {indicator.plots[1][indicator.plots[1].length - 1].value?.toFixed(2)}
                </span>
              )}
              {indicator.plots[3]?.[indicator.plots[3].length - 1]?.value != null && (
                <span style={{ color: '#ab47bc' }}>
                  {indicator.plots[3][indicator.plots[3].length - 1].value?.toFixed(2)}
                </span>
              )}
              {indicator.plots[2]?.[indicator.plots[2].length - 1]?.value != null && (
                <span style={{ color: '#ff9800' }}>
                  {indicator.plots[2][indicator.plots[2].length - 1].value?.toFixed(2)}
                </span>
              )}
              {indicator.plots[4]?.[indicator.plots[4].length - 1]?.value != null && (
                <span style={{ color: '#0288d1' }}>
                  {indicator.plots[4][indicator.plots[4].length - 1].value?.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-mono font-bold" style={{ color: plotColor }}>
              {lastValue}
            </span>
          )
        )}
        <div id={`oscillator-actions-${indicator.id}`} className="flex items-center gap-0.5 ml-1 shrink-0">
          <button
            id={`oscillator-hide-btn-${indicator.id}`}
            onClick={() => onToggleVisibility(indicator.id)}
            className="p-1.5 sm:p-1 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] active:bg-[#f0f3fa] dark:active:bg-[#2a2e39] rounded text-[#707584] dark:text-[#787b86] hover:text-[#131722] dark:hover:text-[#d1d4dc] transition-colors cursor-pointer touch-manipulation"
            title={isHidden ? 'Show' : 'Hide'}
            aria-label={isHidden ? 'Show panel' : 'Hide panel'}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            id={`oscillator-settings-btn-${indicator.id}`}
            onClick={() => onOpenSettings(indicator.id)}
            className="p-1.5 sm:p-1 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] active:bg-[#f0f3fa] dark:active:bg-[#2a2e39] rounded text-[#707584] dark:text-[#787b86] hover:text-[#131722] dark:hover:text-[#d1d4dc] transition-colors cursor-pointer touch-manipulation"
            title="Settings"
            aria-label="Panel settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            id={`oscillator-remove-btn-${indicator.id}`}
            onClick={() => onRemove(indicator.id)}
            className="p-1.5 sm:p-1 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] active:bg-[#f0f3fa] dark:active:bg-[#2a2e39] rounded text-[#707584] dark:text-[#787b86] hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer touch-manipulation"
            title="Close Pane"
            aria-label="Close pane"
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
