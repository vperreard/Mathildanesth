import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from "../lib/logger";
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { getAuthToken, createAuthHeaders } from '@/lib/auth-helpers';

// Interface pour les messages contextuels
export interface ContextualMessage {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    authorId: number;
    author: {
        id: number;
        login: string;
        email?: string;
    };
    assignmentId?: string | null;
    contextDate?: string | null;
    requestId?: string | null;
    parentId?: string | null;
    replies?: ContextualMessage[];
}

// Types d'événements WebSocket pour les messages contextuels
interface ContextualMessageEvents {
    new_contextual_message: (message: ContextualMessage) => void;
    updated_contextual_message: (message: ContextualMessage) => void;
    deleted_contextual_message: (messageId: string) => void;
    auth_error: (message: string) => void;
}

// Options du hook
interface UseContextualMessagesOptions {
    autoConnect?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    assignmentId?: string;
    contextDate?: string;
    requestId?: string;
}

// Cache global des messages par contexte pour éviter les rechargements inutiles
const messagesCache = new Map<string, {
    messages: ContextualMessage[];
    timestamp: number;
}>();

// 2 minutes de TTL pour le cache
const CACHE_TTL = 2 * 60 * 1000;

// Fonction de debounce pour les opérations fréquentes
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Hook pour gérer les WebSockets de messages contextuels en temps réel
 * Version optimisée avec mise en cache et meilleures performances
 */
export function useContextualMessagesWebSocket(options: UseContextualMessagesOptions = {}) {
    const { data: session, status } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ContextualMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [authError, setAuthError] = useState(false);

    // Références pour éviter des re-renders inutiles
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Options avec valeurs par défaut
    const {
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 5000,
        assignmentId,
        contextDate,
        requestId,
    } = options;

    // Clé de cache unique basée sur les paramètres de contexte
    const cacheKey = useMemo(() => {
        return `${assignmentId || ''}|${contextDate || ''}|${requestId || ''}`;
    }, [assignmentId, contextDate, requestId]);

    // Construction du contexte pour la requête
    const getContextQueryParams = useCallback(() => {
        const params = new URLSearchParams();
        if (assignmentId) params.append('assignmentId', assignmentId);
        if (contextDate) params.append('contextDate', contextDate);
        if (requestId) params.append('requestId', requestId);
        return params.toString();
    }, [assignmentId, contextDate, requestId]);

    // Vérifie si au moins un paramètre de contexte est défini
    const hasContextParams = assignmentId || contextDate || requestId;

    // Chargement initial des messages contextuels avec mise en cache
    const fetchMessages = useCallback(async (forceRefresh = false) => {
        // Ne pas essayer de charger si l'utilisateur n'est pas authentifié
        if (status === 'unauthenticated') {
            setAuthError(true);
            setIsLoading(false);
            return;
        }

        if (!session?.user?.id || !hasContextParams) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setAuthError(false);

        try {
            // Vérifier si les données sont en cache et valides (non expirées)
            const cachedData = messagesCache.get(cacheKey);
            const now = Date.now();

            if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
                // Utiliser le cache
                setMessages(cachedData.messages);
                setIsLoading(false);
                return;
            }

            const contextParams = getContextQueryParams();
            const headers = createAuthHeaders(session);

            const controller = new AbortController();
            const signal = controller.signal;

            // Timeout pour les requêtes qui prennent trop de temps
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`http://localhost:3000/api/contextual-messages?${contextParams}`, {
                headers,
                credentials: 'include',
                signal
            });

            clearTimeout(timeoutId);

            if (response.status === 401) {
                setAuthError(true);
                throw new Error('Non autorisé : Veuillez vous connecter pour accéder aux messages');
            }

            if (!response.ok) throw new Error('Erreur lors du chargement des messages contextuels');

            const data = await response.json();

            // Mettre à jour le cache avec les nouvelles données
            messagesCache.set(cacheKey, {
                messages: data || [],
                timestamp: Date.now()
            });

            setMessages(data || []);
        } catch (err) {
            // Ne pas définir d'erreur si la requête a été annulée intentionnellement
            if (err instanceof Error && err.name === 'AbortError') {
                logger.info('Requête de messages annulée');
            } else {
                setError(err instanceof Error ? err : new Error('Erreur inconnue'));
                logger.error('Erreur lors du chargement des messages contextuels:', err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [session, status, hasContextParams, getContextQueryParams, cacheKey]);

    // Version debounced de l'ajout de message pour éviter les mises à jour trop fréquentes
    const debouncedAddMessage = useMemo(() =>
        debounce((newMessage: ContextualMessage) => {
            setMessages(prev => {
                // Éviter les doublons (fréquents avec les WebSockets)
                const messageExists = prev.some(m => m.id === newMessage.id);
                if (messageExists) return prev;

                // Si c'est une réponse, l'ajouter au message parent
                if (newMessage.parentId) {
                    return prev.map(msg =>
                        msg.id === newMessage.parentId
                            ? {
                                ...msg,
                                replies: [...(msg.replies || []), newMessage].sort(
                                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                )
                            }
                            : msg
                    );
                }

                // Ajouter le message au début et trier par date
                const updatedMessages = [newMessage, ...prev];
                // Limiter le nombre de messages affichés pour des raisons de performance
                return updatedMessages.slice(0, 50);
            });
        }, 100),
        []);

    // Envoyer un nouveau message
    const sendMessage = useCallback(async (content: string, parentId?: string) => {
        if (status === 'unauthenticated') {
            return { success: false, error: 'Vous devez être connecté pour envoyer un message' };
        }

        if (!session?.user?.id || !hasContextParams) {
            return { success: false, error: 'Session ou contexte invalide' };
        }

        try {
            const payload = {
                content,
                parentId,
                assignmentId,
                contextDate,
                requestId,
            };

            const headers = createAuthHeaders(session);

            const response = await fetch('http://localhost:3000/api/contextual-messages', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.status === 401) {
                setAuthError(true);
                return { success: false, error: 'Non autorisé : Veuillez vous connecter pour envoyer un message' };
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'envoi du message');
            }

            const newMessage = await response.json();

            // Mise à jour locale (optimiste) et mise à jour du cache
            debouncedAddMessage(newMessage);

            // Mettre également à jour le cache
            const cachedData = messagesCache.get(cacheKey);
            if (cachedData) {
                let updatedMessages = [...cachedData.messages];

                // Logique similaire à debouncedAddMessage
                if (parentId) {
                    updatedMessages = updatedMessages.map(msg =>
                        msg.id === parentId
                            ? { ...msg, replies: [...(msg.replies || []), newMessage] }
                            : msg
                    );
                } else {
                    updatedMessages = [newMessage, ...updatedMessages];
                }

                messagesCache.set(cacheKey, {
                    messages: updatedMessages,
                    timestamp: Date.now()
                });
            }

            return { success: true, message: newMessage };
        } catch (err) {
            logger.error('Erreur lors de l\'envoi du message:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Erreur inconnue lors de l\'envoi'
            };
        }
    }, [session, status, hasContextParams, assignmentId, contextDate, requestId, cacheKey, debouncedAddMessage]);

    // Initialisation et nettoyage du socket
    useEffect(() => {
        // Ne pas connecter si aucun paramètre de contexte n'est défini ou si non authentifié
        if (!hasContextParams || status === 'unauthenticated') return;

        // Nettoyer les anciens caches
        const now = Date.now();
        for (const [key, value] of messagesCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                messagesCache.delete(key);
            }
        }

        // Charger les messages au montage ou changement de contexte
        fetchMessages();

        // Configuration du socket
        if (autoConnect && session?.user?.id) {
            const token = getAuthToken(session);

            const socketOptions = {
                path: '/api/ws',
                autoConnect,
                reconnectionAttempts,
                reconnectionDelay,
                withCredentials: true,
                auth: {
                    userId: session.user.id,
                    token
                }
            };

            socketRef.current = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost', socketOptions);

            const socket = socketRef.current;

            // Gestionnaires d'événements socket
            const handleConnect = () => {
                setIsConnected(true);
                logger.info('WebSocket connected for contextual messages');

                // Rejoindre les rooms spécifiques basées sur le contexte
                const rooms = [];
                if (assignmentId) rooms.push(`assignment_${assignmentId}`);
                if (contextDate) rooms.push(`contextDate_${contextDate}`);
                if (requestId) rooms.push(`request_${requestId}`);

                rooms.forEach(room => {
                    socket.emit('join_room', room);
                });

                // Authentifier le socket si nécessaire
                socket.emit('USER_AUTHENTICATION_WEBSOCKET', {
                    userId: session.user?.id,
                    token
                });
            };

            const handleDisconnect = (reason: string) => {
                logger.info('WebSocket disconnected:', reason);
                setIsConnected(false);
            };

            const handleAuthError = (errorMessage: string) => {
                logger.error('WebSocket authentication error:', errorMessage);
                setAuthError(true);
            };

            const handleNewMessage = (message: ContextualMessage) => {
                logger.info('New contextual message received:', message);
                debouncedAddMessage(message);
            };

            const handleUpdateMessage = (message: ContextualMessage) => {
                setMessages(prev =>
                    prev.map(m => m.id === message.id ? message : m)
                );
            };

            const handleDeleteMessage = (messageId: string) => {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            };

            // Enregistrer les événements
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('auth_error', handleAuthError);
            socket.on('new_contextual_message', handleNewMessage);
            socket.on('updated_contextual_message', handleUpdateMessage);
            socket.on('deleted_contextual_message', handleDeleteMessage);

            // Connecter le socket
            if (!socket.connected) {
                socket.connect();
            }

            // Nettoyer les événements et déconnecter le socket au démontage
            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socket.off('auth_error', handleAuthError);
                socket.off('new_contextual_message', handleNewMessage);
                socket.off('updated_contextual_message', handleUpdateMessage);
                socket.off('deleted_contextual_message', handleDeleteMessage);

                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [session, status, hasContextParams, autoConnect, reconnectionAttempts, reconnectionDelay,
        assignmentId, contextDate, requestId, fetchMessages, debouncedAddMessage]);

    // Interface publique du hook
    return {
        isConnected,
        messages,
        isLoading,
        error,
        authError,
        sendMessage,
        refreshMessages: () => fetchMessages(true),
        socket: socketRef.current
    };
} 