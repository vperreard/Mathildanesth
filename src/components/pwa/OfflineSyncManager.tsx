'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Clock,
  Database
} from 'lucide-react';

interface OfflineAction {
  id: string;
  type: 'leave_request' | 'schedule_change' | 'notification_read' | 'profile_update';
  action: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

interface OfflineSyncManagerProps {
  className?: string;
}

export function OfflineSyncManager({ className }: OfflineSyncManagerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Surveillance statut réseau
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Charger les actions en attente depuis le localStorage
    loadOfflineActions();

    // Tentative de sync automatique quand on revient en ligne
    if (isOnline && offlineActions.some(a => a.status === 'pending')) {
      syncOfflineActions();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  const loadOfflineActions = () => {
    try {
      const stored = localStorage.getItem('mathildanesth_offline_actions');
      if (stored) {
        const actions = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));
        setOfflineActions(actions);
      }
    } catch (error) {
      console.error('Erreur chargement actions offline:', error);
    }
  };

  const saveOfflineActions = (actions: OfflineAction[]) => {
    try {
      localStorage.setItem('mathildanesth_offline_actions', JSON.stringify(actions));
      setOfflineActions(actions);
    } catch (error) {
      console.error('Erreur sauvegarde actions offline:', error);
    }
  };

  const addOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}`,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };
    
    const updatedActions = [...offlineActions, newAction];
    saveOfflineActions(updatedActions);
    
    // Notification visuelle
    showNotification('Action sauvegardée hors ligne', 'info');
  };

  const syncOfflineActions = async () => {
    if (!isOnline || syncInProgress) return;
    
    setSyncInProgress(true);
    const pendingActions = offlineActions.filter(a => a.status === 'pending' || a.status === 'failed');
    
    try {
      for (const action of pendingActions) {
        try {
          // Marquer comme en cours de sync
          updateActionStatus(action.id, 'syncing');
          
          // Exécuter l'action selon son type
          await executeOfflineAction(action);
          
          // Marquer comme synchronisé
          updateActionStatus(action.id, 'synced');
          
        } catch (error) {
          console.error(`Erreur sync action ${action.id}:`, error);
          
          // Incrémenter compteur retry
          const updatedActions = offlineActions.map(a => 
            a.id === action.id 
              ? { ...a, retryCount: a.retryCount + 1, status: 'failed' as const }
              : a
          );
          saveOfflineActions(updatedActions);
        }
      }
      
      setLastSync(new Date());
      showNotification('Synchronisation terminée', 'success');
      
    } catch (error) {
      console.error('Erreur synchronisation globale:', error);
      showNotification('Erreur de synchronisation', 'error');
    } finally {
      setSyncInProgress(false);
    }
  };

  const executeOfflineAction = async (action: OfflineAction) => {
    const { type, data } = action;
    
    switch (type) {
      case 'leave_request':
        await fetch('/api/conges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      case 'schedule_change':
        await fetch(`/api/planning/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      case 'notification_read':
        await fetch(`/api/notifications/${data.id}/read`, {
          method: 'POST'
        });
        break;
        
      case 'profile_update':
        await fetch('/api/profil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      default:
        throw new Error(`Type d'action non supporté: ${type}`);
    }
  };

  const updateActionStatus = (actionId: string, status: OfflineAction['status']) => {
    const updatedActions = offlineActions.map(a => 
      a.id === actionId ? { ...a, status } : a
    );
    saveOfflineActions(updatedActions);
  };

  const clearSyncedActions = () => {
    const pendingActions = offlineActions.filter(a => a.status !== 'synced');
    saveOfflineActions(pendingActions);
  };

  const showNotification = (message: string, type: 'info' | 'success' | 'error') => {
    // Intégration avec le système de notifications
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'leave_request': return Clock;
      case 'schedule_change': return RefreshCw;
      case 'notification_read': return CheckCircle;
      case 'profile_update': return Database;
      default: return Upload;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'leave_request': return 'Demande congé';
      case 'schedule_change': return 'Modification planning';
      case 'notification_read': return 'Notification lue';
      case 'profile_update': return 'Profil mis à jour';
      default: return 'Action';
    }
  };

  const pendingCount = offlineActions.filter(a => a.status === 'pending' || a.status === 'failed').length;

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      {/* Header Status */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          )}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </h3>
            <p className="text-xs text-gray-600">
              {pendingCount > 0 
                ? `${pendingCount} action(s) en attente`
                : 'Toutes les données synchronisées'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-gray-500">
              Dernière sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          
          {isOnline && pendingCount > 0 && (
            <button
              onClick={syncOfflineActions}
              disabled={syncInProgress}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                'bg-medical-guard-600 text-white hover:bg-medical-guard-700',
                syncInProgress && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('h-3 w-3', syncInProgress && 'animate-spin')} />
              Synchroniser
            </button>
          )}
        </div>
      </div>

      {/* Offline Indicator Banner */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Mode hors ligne activé. Vos actions seront synchronisées automatiquement.
            </span>
          </div>
        </div>
      )}

      {/* Pending Actions */}
      {pendingCount > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Actions en attente ({pendingCount})
            </h4>
            <button
              onClick={clearSyncedActions}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Nettoyer
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {offlineActions
              .filter(a => a.status === 'pending' || a.status === 'failed' || a.status === 'syncing')
              .map((action) => {
                const Icon = getActionIcon(action.type);
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg border',
                      action.status === 'pending' && 'bg-blue-50 border-blue-200',
                      action.status === 'syncing' && 'bg-yellow-50 border-yellow-200',
                      action.status === 'failed' && 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className={cn(
                      'p-1 rounded',
                      action.status === 'pending' && 'bg-blue-100 text-blue-600',
                      action.status === 'syncing' && 'bg-yellow-100 text-yellow-600',
                      action.status === 'failed' && 'bg-red-100 text-red-600'
                    )}>
                      <Icon className={cn(
                        'h-3 w-3',
                        action.status === 'syncing' && 'animate-spin'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {getActionLabel(action.type)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {action.timestamp.toLocaleTimeString()}
                        {action.retryCount > 0 && ` • ${action.retryCount} tentative(s)`}
                      </p>
                    </div>
                    
                    <div className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      action.status === 'pending' && 'bg-blue-100 text-blue-700',
                      action.status === 'syncing' && 'bg-yellow-100 text-yellow-700',
                      action.status === 'failed' && 'bg-red-100 text-red-700'
                    )}>
                      {action.status === 'pending' && 'En attente'}
                      {action.status === 'syncing' && 'Sync...'}
                      {action.status === 'failed' && 'Échec'}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cache Status */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Données en cache</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              Planning disponible
            </span>
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Profil stocké
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour l'utilisation du gestionnaire hors ligne
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);
  
  const queueOfflineAction = (action: any) => {
    // Ajouter à la queue d'actions hors ligne
    const offlineActions = JSON.parse(
      localStorage.getItem('mathildanesth_offline_actions') || '[]'
    );
    
    const newAction = {
      ...action,
      id: `offline_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    offlineActions.push(newAction);
    localStorage.setItem('mathildanesth_offline_actions', JSON.stringify(offlineActions));
    
    return newAction.id;
  };
  
  return {
    isOnline,
    queueOfflineAction
  };
}