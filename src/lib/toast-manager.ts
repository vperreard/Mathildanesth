/**
 * ToastManager - Gestionnaire centralisé des notifications toast
 * 
 * Fonctionnalités :
 * - Singleton pour éviter les instances multiples
 * - Limite de 3 toasts simultanés
 * - Auto-dismiss après 3 secondes
 * - Déduplication des messages identiques
 * - File d'attente pour les toasts en excès
 */

import { toast as reactToast, Id } from 'react-toastify';

interface ToastOptions {
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  [key: string]: any;
}

interface QueuedToast {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  options?: ToastOptions;
}

class ToastManager {
  private static instance: ToastManager;
  private activeToasts: Map<string, Id> = new Map();
  private toastQueue: QueuedToast[] = [];
  private readonly MAX_TOASTS = 3;
  private readonly DEFAULT_DURATION = 3000; // 3 secondes
  private readonly DEDUP_WINDOW = 1000; // 1 seconde pour la déduplication
  private lastMessages: Map<string, number> = new Map();

  private constructor() {
    // Singleton
  }

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  /**
   * Vérifie si un message a été affiché récemment
   */
  private isDuplicate(message: string): boolean {
    const lastShown = this.lastMessages.get(message);
    if (!lastShown) return false;
    
    const now = Date.now();
    if (now - lastShown < this.DEDUP_WINDOW) {
      return true;
    }
    
    // Nettoyer les vieux messages
    this.lastMessages.delete(message);
    return false;
  }

  /**
   * Enregistre qu'un message a été affiché
   */
  private recordMessage(message: string): void {
    this.lastMessages.set(message, Date.now());
    
    // Nettoyer les messages plus vieux que DEDUP_WINDOW
    setTimeout(() => {
      this.lastMessages.delete(message);
    }, this.DEDUP_WINDOW);
  }

  /**
   * Traite la file d'attente des toasts
   */
  private processQueue(): void {
    if (this.activeToasts.size >= this.MAX_TOASTS || this.toastQueue.length === 0) {
      return;
    }

    const queued = this.toastQueue.shift();
    if (queued) {
      this.showToast(queued.type, queued.message, queued.options);
    }
  }

  /**
   * Affiche un toast
   */
  private showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    options?: ToastOptions
  ): void {
    // Vérifier la duplication
    if (this.isDuplicate(message)) {
      return;
    }

    // Si on a atteint la limite, mettre en file d'attente
    if (this.activeToasts.size >= this.MAX_TOASTS) {
      this.toastQueue.push({ type, message, options });
      return;
    }

    // Options par défaut
    const defaultOptions: ToastOptions = {
      autoClose: this.DEFAULT_DURATION,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    };

    // Créer le toast
    let toastId: Id;
    switch (type) {
      case 'success':
        toastId = reactToast.success(message, defaultOptions);
        break;
      case 'error':
        toastId = reactToast.error(message, defaultOptions);
        break;
      case 'info':
        toastId = reactToast.info(message, defaultOptions);
        break;
      case 'warning':
        toastId = reactToast.warning(message, defaultOptions);
        break;
    }

    // Enregistrer le toast actif
    this.activeToasts.set(message, toastId);
    this.recordMessage(message);

    // Retirer après fermeture
    setTimeout(() => {
      this.activeToasts.delete(message);
      this.processQueue();
    }, defaultOptions.autoClose || this.DEFAULT_DURATION);
  }

  /**
   * Méthodes publiques pour afficher des toasts
   */
  success(message: string, options?: ToastOptions): void {
    this.showToast('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.showToast('error', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.showToast('info', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.showToast('warning', message, options);
  }

  /**
   * Ferme tous les toasts actifs
   */
  dismissAll(): void {
    reactToast.dismiss();
    this.activeToasts.clear();
    this.toastQueue = [];
    this.lastMessages.clear();
  }

  /**
   * Ferme un toast spécifique
   */
  dismiss(message: string): void {
    const toastId = this.activeToasts.get(message);
    if (toastId) {
      reactToast.dismiss(toastId);
      this.activeToasts.delete(message);
      this.processQueue();
    }
  }

  /**
   * Obtient le nombre de toasts actifs
   */
  getActiveCount(): number {
    return this.activeToasts.size;
  }

  /**
   * Obtient le nombre de toasts en file d'attente
   */
  getQueuedCount(): number {
    return this.toastQueue.length;
  }
}

// Export de l'instance singleton
export const toastManager = ToastManager.getInstance();

// Export des méthodes directement pour faciliter l'utilisation
export const toast = {
  success: (message: string, options?: ToastOptions) => toastManager.success(message, options),
  error: (message: string, options?: ToastOptions) => toastManager.error(message, options),
  info: (message: string, options?: ToastOptions) => toastManager.info(message, options),
  warning: (message: string, options?: ToastOptions) => toastManager.warning(message, options),
  dismiss: (message?: string) => message ? toastManager.dismiss(message) : toastManager.dismissAll(),
  dismissAll: () => toastManager.dismissAll(),
};