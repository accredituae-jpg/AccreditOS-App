import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const OfflineStatusBar: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md transition-all z-50 sticky top-0"
    >
      <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4 animate-pulse flex-shrink-0" />
          <span>
            <strong>Offline Mode Active:</strong> You are currently disconnected from the internet.
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-1 text-amber-100 text-xs bg-amber-800/40 px-2 py-1 rounded">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-300" />
          <span>Financial transactions & certificate generation paused until online</span>
        </div>
      </div>
    </div>
  );
};
