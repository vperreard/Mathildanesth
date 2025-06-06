'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logger } from "../lib/logger";
import { useSession } from '@/lib/auth/migration-shim-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageCircle, Edit2, Trash2, Send, X, MessageSquare, Reply, AlertTriangle } from 'lucide-react';
import { useContextualMessagesWebSocket } from '@/hooks/useContextualMessagesWebSocket';

interface ContextualMessagePanelProps {
    assignmentId?: string;
    contextDate?: string;
    requestId?: string;
    mode?: 'collapsed' | 'expanded';  // Mode d'affichage initial
    className?: string;
}

/**
 * Panneau de messages contextuels pour les affectations, dates ou requêtes
 */
export const ContextualMessagePanel: React.FC<ContextualMessagePanelProps> = ({
    assignmentId,
    contextDate,
    requestId,
    mode = 'collapsed',
    className = '',
}) => {
    const { data: session, status } = useSession();
    const [isExpanded, setIsExpanded] = useState(mode === 'expanded');
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Contexte pour le titre du panneau
    let contextTitle = "Messages";
    if (assignmentId) contextTitle = "Messages - Affectation";
    else if (contextDate) {
        // Formater la date pour l'affichage
        const dateObj = new Date(contextDate);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        contextTitle = `Messages - ${formattedDate}`;
    } else if (requestId) contextTitle = "Messages - Requête";

    // Utiliser notre hook pour les messages contextuels
    const {
        messages,
        isLoading,
        error,
        authError,
        sendMessage,
        updateMessage,
        deleteMessage,
    } = useContextualMessagesWebSocket({
        assignmentId,
        contextDate,
        requestId,
        autoConnect: isExpanded, // Ne se connecte que si le panneau est développé
    });

    // Ajuster la hauteur du textarea en fonction du contenu
    const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };

    // Scroller vers le bas quand de nouveaux messages arrivent
    useEffect(() => {
        if (isExpanded && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isExpanded]);

    // Ajuster la hauteur du textarea quand le contenu change
    useEffect(() => {
        adjustTextareaHeight(textareaRef.current);
    }, [newMessage]);

    // Fonction pour envoyer un nouveau message
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        setIsSubmitting(true);

        try {
            const result = await sendMessage(newMessage.trim());
            if (result.success) {
                setNewMessage('');
            } else {
                logger.error('Erreur lors de l\'envoi du message:', result.error);
                // À améliorer avec un toast ou une notification visuelle
                alert(`Erreur: ${result.error}`);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'envoi du message:', { error: error });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour mettre à jour un message
    const handleUpdateMessage = async (messageId: string) => {
        if (!editingContent.trim()) return;
        setIsSubmitting(true);

        try {
            const result = await updateMessage(messageId, editingContent.trim());
            if (result.success) {
                setEditingMessageId(null);
                setEditingContent('');
            } else {
                logger.error('Erreur lors de la modification du message:', result.error);
                alert(`Erreur: ${result.error}`);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de la modification du message:', { error: error });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour supprimer un message
    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

        try {
            const result = await deleteMessage(messageId);
            if (!result.success) {
                logger.error('Erreur lors de la suppression du message:', result.error);
                alert(`Erreur: ${result.error}`);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression du message:', { error: error });
        }
    };

    // Fonction pour envoyer une réponse
    const handleSendReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        setIsSubmitting(true);

        try {
            const result = await sendMessage(replyContent.trim(), parentId);
            if (result.success) {
                setReplyToId(null);
                setReplyContent('');
            } else {
                logger.error('Erreur lors de l\'envoi de la réponse:', result.error);
                alert(`Erreur: ${result.error}`);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'envoi de la réponse:', { error: error });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction utilitaire pour formater la date relative
    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (err: unknown) {
            return 'Date inconnue';
        }
    };

    // Fonction pour déterminer si l'utilisateur actuel est l'auteur du message
    const isCurrentUserAuthor = (authorId: number) => {
        return session?.user?.id === authorId;
    };

    // Interface de rendu pour un message
    const renderMessage = (message: unknown, isReply = false) => {
        const isAuthor = isCurrentUserAuthor(message.authorId);
        const isEditing = editingMessageId === message.id;
        const isReplying = replyToId === message.id;

        return (
            <div key={message.id} className={`p-3 ${isReply ? 'ml-6 border-l-2 border-gray-200' : 'border-b border-gray-200'}`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            {message.author.login.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-baseline">
                                <span className="font-medium text-gray-900">{message.author.login}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    {formatRelativeTime(message.createdAt)}
                                    {message.updatedAt !== message.createdAt && ' (modifié)'}
                                </span>
                            </div>

                            {isEditing ? (
                                <div className="mt-1">
                                    <textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                    <div className="mt-2 flex space-x-2">
                                        <button
                                            onClick={() => handleUpdateMessage(message.id)}
                                            disabled={isSubmitting}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                        >
                                            Enregistrer
                                        </button>
                                        <button
                                            onClick={() => { setEditingMessageId(null); setEditingContent(''); }}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-800 mt-1 whitespace-pre-wrap">{message.content}</div>
                            )}
                        </div>
                    </div>

                    {isAuthor && !isEditing && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditingContent(message.content);
                                }}
                                className="text-gray-500 hover:text-blue-600"
                                title="Modifier"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-gray-500 hover:text-red-600"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {!isReply && !isReplying && (
                    <div className="mt-2">
                        <button
                            onClick={() => {
                                setReplyToId(message.id);
                                setReplyContent('');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            <Reply size={12} className="mr-1" />
                            Répondre
                        </button>
                    </div>
                )}

                {isReplying && (
                    <div className="mt-2 ml-8">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Écrire une réponse..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                        />
                        <div className="mt-2 flex space-x-2">
                            <button
                                onClick={() => handleSendReply(message.id)}
                                disabled={isSubmitting || !replyContent.trim()}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                            >
                                <Send size={14} className="mr-1" />
                                Envoyer
                            </button>
                            <button
                                onClick={() => setReplyToId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {/* Afficher les réponses au message */}
                {message.replies && message.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {message.replies.map((reply: unknown) => renderMessage(reply, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`border rounded-lg shadow-sm bg-white ${className}`}>
            {/* En-tête du panneau de messages */}
            <div
                className="p-3 border-b bg-gray-50 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center text-gray-800 font-medium">
                    <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                    {contextTitle}
                    {!isLoading && messages.length > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </div>
                <button className="text-gray-500">
                    {isExpanded ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <MessageSquare className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Corps du panneau de messages (conditionnel) */}
            {isExpanded && (
                <>
                    <div className="max-h-96 overflow-y-auto p-3 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-2"></div>
                                <p>Chargement des messages...</p>
                            </div>
                        ) : authError ? (
                            <div className="text-center py-8 text-yellow-600">
                                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                                <p className="font-semibold">Vous devez être connecté pour consulter les messages</p>
                                <p className="text-sm mt-2">Veuillez vous connecter ou vérifier vos droits d'accès</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-600">
                                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-2" />
                                <p className="font-semibold">Erreur lors du chargement des messages</p>
                                <p className="text-sm mt-2">{error.message}</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                <p>Aucun message pour le moment</p>
                                <p className="text-sm">Soyez le premier à écrire un message !</p>
                            </div>
                        ) : (
                            <>
                                {messages.map(message => renderMessage(message))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Zone de saisie pour nouveau message (seulement si authentifié) */}
                    {status === 'authenticated' && !authError && (
                        <div className="p-3 border-t">
                            <div className="flex items-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    {session?.user?.login?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Écrire un message..."
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-xs text-gray-500">
                                            Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne
                                        </span>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={isSubmitting || !newMessage.trim()}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                                        >
                                            <Send size={14} className="mr-1" />
                                            Envoyer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}; 