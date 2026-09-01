import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, X, RotateCcw, FastForward, Sliders, ArrowLeft, History } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';

export const BarReplayControl: React.FC = () => {
  const { 
    replayState, 
    pauseReplay, 
    resumeReplay, 
    stepReplay, 
    stopReplay, 
    setReplaySpeed, 
    setReplayCutoff,
    fullCandlesBeforeReplay 
  } = useMarketStore();

  const { isActive, isPaused, speed, currentIndex, totalCandles } = replayState;

  // Auto-play interval
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      stepReplay();
    }, speed);

    return () => clearInterval(interval);
  }, [isActive, isPaused, speed, stepReplay]);

  if (!isActive) return null;

  const progressPercent = totalCandles > 0 ? (currentIndex / totalCandles) * 100 : 100;

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-3 fade-in duration-150">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-tv-card/95 border border-tv-border shadow-2xl rounded-xl backdrop-blur-md text-tv-text">
        {/* Replay indicator badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-bold uppercase tracking-wider shrink-0">
          <History className="w-3.5 h-3.5" />
          <span>Bar Replay</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={isPaused ? resumeReplay : pauseReplay}
          className={`p-2 rounded-lg font-semibold flex items-center justify-center transition-colors cursor-pointer ${
            isPaused 
              ? 'bg-tv-accent hover:bg-tv-accent/90 text-white' 
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
          title={isPaused ? 'Play Replay (Space)' : 'Pause Replay'}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
        </button>

        {/* Step Forward 1 Bar */}
        <button
          onClick={() => {
            pauseReplay();
            stepReplay();
          }}
          disabled={currentIndex >= totalCandles}
          className="p-2 bg-tv-panel hover:bg-tv-hover disabled:opacity-40 border border-tv-border rounded-lg text-tv-text transition-colors cursor-pointer"
          title="Forward 1 Bar"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Progress Slider */}
        <div className="flex items-center gap-2 px-2 border-l border-r border-tv-border">
          <input
            type="range"
            min={5}
            max={totalCandles || 100}
            value={currentIndex}
            onChange={(e) => {
              pauseReplay();
              setReplayCutoff(parseInt(e.target.value, 10));
            }}
            className="w-24 sm:w-36 h-1.5 bg-tv-border rounded-lg appearance-none cursor-pointer accent-tv-accent"
          />
          <span className="text-[11px] font-mono text-tv-muted tabular-nums shrink-0">
            {currentIndex}/{totalCandles}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          {[
            { label: '0.2s', val: 200 },
            { label: '0.5s', val: 500 },
            { label: '1s', val: 1000 },
            { label: '2s', val: 2000 },
          ].map((s) => (
            <button
              key={s.val}
              onClick={() => setReplaySpeed(s.val)}
              className={`px-1.5 py-1 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                speed === s.val 
                  ? 'bg-tv-accent text-white' 
                  : 'bg-tv-panel hover:bg-tv-hover text-tv-muted hover:text-tv-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Jump to Cutoff Options */}
        <button
          onClick={() => {
            pauseReplay();
            setReplayCutoff(Math.max(5, currentIndex - 20));
          }}
          className="p-1.5 bg-tv-panel hover:bg-tv-hover border border-tv-border rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer text-xs flex items-center gap-1"
          title="Jump back 20 bars"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">-20</span>
        </button>

        {/* Exit Replay Button */}
        <button
          onClick={stopReplay}
          className="p-1.5 hover:bg-red-500/10 text-tv-muted hover:text-red-400 rounded-lg transition-colors cursor-pointer ml-1"
          title="Exit Replay Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
