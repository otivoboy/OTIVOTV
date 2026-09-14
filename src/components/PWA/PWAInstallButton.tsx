import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string; variant?: 'button' | 'icon' | 'banner' }> = ({
  className = '',
  variant = 'button'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          id="pwa-install-icon-btn"
          type="button"
          onClick={handleInstallClick}
          className={`relative p-1.5 rounded-lg bg-tv-accent/15 hover:bg-tv-accent/25 text-tv-accent border border-tv-accent/30 transition-all cursor-pointer group shrink-0 ${className}`}
          title="Install Otivo Desktop / Mobile App"
          aria-label="Install App"
        >
          <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Install App</span>
        </button>

        {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        id="pwa-install-header-btn"
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tv-accent hover:bg-tv-accent/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 ${className}`}
        title="Install Otivo app to your home screen or desktop"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>Install App</span>
      </button>

      {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
    </>
  );
};

export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-2xl bg-tv-card border border-tv-border p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-tv-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <img src="/app.png" alt="Otivo" className="w-9 h-9 rounded-xl shadow-md" />
            <div>
              <h3 className="text-sm font-bold text-tv-text">Install Otivo on iOS</h3>
              <p className="text-[11px] text-tv-muted">Safari Home Screen App</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-tv-muted hover:text-tv-text rounded-lg hover:bg-tv-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="py-4 space-y-3 text-xs">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-tv-bg border border-tv-border/50">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-tv-text">1. Tap the Share button</p>
              <p className="text-tv-muted text-[11px] mt-0.5">Located in the Safari toolbar at the bottom or top of your screen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-tv-bg border border-tv-border/50">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-tv-text">2. Tap 'Add to Home Screen'</p>
              <p className="text-tv-muted text-[11px] mt-0.5">Scroll down the share sheet and tap Add to Home Screen to install Otivo.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-tv-accent hover:bg-tv-accent/90 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
