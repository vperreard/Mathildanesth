'use client';

import { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { cn } from '@/lib/utils';
import { 
  Smartphone,
  Download,
  X,
  Share,
  Plus,
  Monitor,
  Zap,
  Wifi,
  Bell
} from 'lucide-react';

interface InstallPromptProps {
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Détecter si déjà installé
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Vérifier si déjà installé via localStorage
    const hasInstalled = localStorage.getItem('mathildanesth_pwa_installed');
    setIsInstalled(!!hasInstalled);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      
      // Afficher le prompt après un délai si pas encore installé
      if (!hasInstalled && !standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // Écouter l'installation
    const handleAppInstalled = () => {
      localStorage.setItem('mathildanesth_pwa_installed', 'true');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('mathildanesth_pwa_installed', 'true');
        setIsInstalled(true);
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error: unknown) {
      logger.error('Erreur installation PWA:', { error: error });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Reposposer plus tard
    localStorage.setItem('mathildanesth_pwa_dismissed', Date.now().toString());
  };

  // Ne pas afficher si déjà installé ou en mode standalone
  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96', className)}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-medical-guard-100 rounded-lg flex-shrink-0">
            <Smartphone className="h-6 w-6 text-medical-guard-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Installer Mathildanesth
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Accédez rapidement à vos plannings et gardes médicales depuis votre écran d'accueil.
            </p>

            {/* Avantages PWA */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Zap className="h-3 w-3 text-green-600" />
                <span>Démarrage instantané</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Wifi className="h-3 w-3 text-blue-600" />
                <span>Fonctionne hors ligne</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Bell className="h-3 w-3 text-orange-600" />
                <span>Notifications de garde</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Monitor className="h-3 w-3 text-purple-600" />
                <span>Interface optimisée mobile</span>
              </div>
            </div>

            {/* Instructions selon le device */}
            {isIOS ? (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">
                  Pour installer sur iOS :
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Share className="h-3 w-3" />
                  <span>1. Appuyez sur le bouton Partager</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Plus className="h-3 w-3" />
                  <span>2. Sélectionnez "Sur l'écran d'accueil"</span>
                </div>
              </div>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-medical-guard-600 text-white rounded-md hover:bg-medical-guard-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Installer l'Application
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                Installation non disponible sur ce navigateur
              </div>
            )}

            {!isIOS && deferredPrompt && (
              <button
                onClick={handleDismiss}
                className="w-full mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Plus tard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour gérer l'état d'installation PWA
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const checkInstallStatus = () => {
      const installed = localStorage.getItem('mathildanesth_pwa_installed');
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(!!installed || standalone);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('mathildanesth_pwa_installed', 'true');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('mathildanesth_pwa_installed', 'true');
        setIsInstalled(true);
        return true;
      }
      
      return false;
    } catch (error: unknown) {
      logger.error('Erreur installation PWA:', { error: error });
      return false;
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}

// Composant compact pour la barre de navigation
export function PWAInstallButton({ className }: { className?: string }) {
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-xs font-medium',
        'bg-medical-guard-100 text-medical-guard-700 rounded-md',
        'hover:bg-medical-guard-200 transition-colors',
        className
      )}
    >
      <Download className="h-3 w-3" />
      Installer
    </button>
  );
}