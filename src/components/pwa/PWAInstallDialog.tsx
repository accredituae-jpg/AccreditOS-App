import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallDialog: React.FC = () => {
  const { canInstall, isIOS, isInstalled, triggerInstall } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile' | 'ios'>('desktop');

  useEffect(() => {
    // Only open when explicitly triggered by the user clicking the Install button in TopBar
    const handleForceOpen = () => {
      setIsOpen(true);
      if (isIOS) {
        setActiveTab('ios');
      }
    };

    window.addEventListener('open_pwa_install_dialog', handleForceOpen);
    return () => {
      window.removeEventListener('open_pwa_install_dialog', handleForceOpen);
    };
  }, [isIOS]);

  if (isInstalled || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-md w-full bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-2xl space-y-5 animate-in zoom-in-95">
        
        {/* Header & Logo */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-transparent p-0.5 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="AccreditOS Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Install AccreditOS ERP</h3>
              <p className="text-xs text-muted-foreground">Enterprise Desktop & Mobile PWA</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Benefits List */}
        <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1.5 text-muted-foreground">
          <div className="flex items-center space-x-2 text-foreground font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>Instant launch from Desktop Taskbar / Mobile Home Screen</span>
          </div>
          <div className="flex items-center space-x-2 text-foreground font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>Offline shell & safe reference data caching</span>
          </div>
        </div>

        {/* Action Button if Native Install Prompt Ready */}
        {canInstall ? (
          <button
            onClick={async () => {
              const success = await triggerInstall();
              if (success) setIsOpen(false);
            }}
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Install App Now</span>
          </button>
        ) : (
          /* Manual Installation Instructions for Dev mode / Safari / Edge */
          <div className="space-y-3">
            <div className="flex rounded-lg bg-muted p-1 text-xs">
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Chrome / Edge
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'ios' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                iOS Safari
              </button>
              <button
                onClick={() => setActiveTab('mobile')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Android
              </button>
            </div>

            {activeTab === 'desktop' && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-xs space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-primary" />
                  Desktop Chrome / Edge Installation:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click the <strong>Install Icon</strong> in your browser address bar (top right corner).</li>
                  <li>Or open menu (<strong>⋮</strong> or <strong>...</strong>) → <strong>Save & Share</strong> → <strong>Install AccreditOS ERP...</strong></li>
                </ol>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-xs space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  iOS Safari Installation:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-1">
                    <span>1. Tap the Share button</span>
                    <Share className="h-3.5 w-3.5 text-primary inline" />
                  </li>
                  <li className="flex items-center gap-1">
                    <span>2. Scroll down & tap 'Add to Home Screen'</span>
                    <PlusSquare className="h-3.5 w-3.5 text-primary inline" />
                  </li>
                  <li>3. Tap 'Add' in top right to finish</li>
                </ol>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-xs space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Android Chrome Installation:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Tap the menu button (<strong>⋮</strong>) in Chrome.</li>
                  <li>Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
