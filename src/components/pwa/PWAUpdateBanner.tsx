import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';

export const PWAUpdateBanner: React.FC = () => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            window.location.reload();
          },
          { once: true }
        );
      }
      await updateServiceWorker(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error("SW update error:", e);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md w-full bg-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {needRefresh ? (
            <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-sm">
              {needRefresh ? 'AccreditOS Update Available' : 'AccreditOS Ready for Offline Use'}
            </h4>
            <p className="text-xs text-slate-300">
              {needRefresh
                ? 'A new production version is available. Update to get the latest features.'
                : 'App shell and assets have been cached for offline operation.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center space-x-2 justify-end">
        {needRefresh && (
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            {isUpdating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>{isUpdating ? "Updating..." : "Update Now"}</span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
