import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div 
        id="pwa-online-indicator"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-600/90 text-white px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-xs border border-emerald-400/30 animate-in slide-in-from-bottom-2 duration-200 select-none"
      >
        <Wifi className="w-3.5 h-3.5" />
        <span>Connected back online</span>
      </div>
    );
  }

  return (
    <div 
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 text-white px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-xs border border-amber-400/30 animate-in slide-in-from-bottom-2 duration-200 select-none"
    >
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Offline Mode — Cached offline charts active</span>
    </div>
  );
};
