'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { subscribeToChannel } from '@/lib/pusher';
import { getSession } from 'next-auth/react';
import { SimulationEvent } from '@/services/simulations/notificationService';
import { Bell, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

/**
 * Interface pour les notifications de simulation
 */
interface SimulationNotification {
    type: 'started' | 'progress' | 'completed' | 'failed';
    scenarioId: string;
    scenarioName?: string;
    progress?: number;
    message?: string;
    resultId?: string;
    viewUrl?: string;
    error?: string;
    timestamp: string;
    estimatedTimeRemaining?: number;
}

/**
 * Composant pour afficher et gérer les notifications de simulation
 */
export function SimulationNotifications() {
    const [activeSimulations, setActiveSimulations] = useState<Record<string, SimulationNotification>>({});
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    // Récupérer l'ID de l'utilisateur connecté
    useEffect(() => {
        const fetchUserId = async () => {
            const session = await getSession();
            if (session && session.user && session.user.email) {
                try {
                    const response = await fetch(`http://localhost:3000/api/utilisateurs/me`);
                    const data = await response.json();
                    if (data.id) {
                        setUserId(data.id.toString());
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
                }
            }
        };

        fetchUserId();
    }, []);

    // S'abonner au canal de notification lorsque l'ID utilisateur est disponible
    useEffect(() => {
        if (!userId) return;

        const channelName = `private-user-${userId}`;

        // Définir les gestionnaires d'événements
        const events = {
            [SimulationEvent.STARTED]: (data: any) => handleNotification('started', data),
            [SimulationEvent.PROGRESS]: (data: any) => handleNotification('progress', data),
            [SimulationEvent.COMPLETED]: (data: any) => handleNotification('completed', data),
            [SimulationEvent.FAILED]: (data: any) => handleNotification('failed', data),
        };

        // S'abonner au canal
        const unsubscribe = subscribeToChannel(channelName, events);

        // Se désabonner lors du nettoyage
        return () => {
            unsubscribe();
        };
    }, [userId]);

    // Gestionnaire de notification pour mettre à jour l'état
    const handleNotification = (type: 'started' | 'progress' | 'completed' | 'failed', data: any) => {
        const scenarioId = data.scenarioId;

        if (!scenarioId) return;

        // Mise à jour de l'état des simulations actives
        setActiveSimulations(prev => {
            const updated = { ...prev };

            if (type === 'started') {
                // Nouvelle simulation démarrée
                updated[scenarioId] = {
                    type,
                    scenarioId,
                    scenarioName: data.scenarioName,
                    progress: 0,
                    timestamp: data.timestamp,
                };

                // Afficher une notification toast
                toast.info(`Simulation "${data.scenarioName}" démarrée`);
            }
            else if (type === 'progress' && updated[scenarioId]) {
                // Mise à jour de la progression
                updated[scenarioId] = {
                    ...updated[scenarioId],
                    type,
                    progress: data.progress,
                    message: data.currentStep || data.message,
                    estimatedTimeRemaining: data.estimatedTimeRemaining,
                    timestamp: data.timestamp,
                };

                // Afficher une notification toast uniquement pour les jalons importants
                if (data.progress && (data.progress === 25 || data.progress === 50 || data.progress === 75)) {
                    toast.info(`Simulation ${updated[scenarioId].scenarioName} : ${data.progress}% terminée`);
                }
            }
            else if (type === 'completed') {
                // Simulation terminée avec succès
                updated[scenarioId] = {
                    ...updated[scenarioId],
                    type,
                    progress: 100,
                    resultId: data.resultId,
                    viewUrl: data.viewUrl,
                    timestamp: data.timestamp,
                };

                // Afficher une notification toast avec un bouton pour voir les résultats
                toast.success(`Simulation "${data.scenarioName}" terminée`, {
                    action: {
                        label: 'Voir',
                        onClick: () => {
                            if (data.viewUrl) {
                                router.push(data.viewUrl);
                            }
                        }
                    }
                });

                // Supprimer la simulation active après un délai
                setTimeout(() => {
                    setActiveSimulations(prev => {
                        const updated = { ...prev };
                        delete updated[scenarioId];
                        return updated;
                    });
                }, 30000); // 30 secondes
            }
            else if (type === 'failed') {
                // Simulation échouée
                updated[scenarioId] = {
                    ...updated[scenarioId],
                    type,
                    error: data.error,
                    timestamp: data.timestamp,
                };

                // Afficher une notification toast d'erreur
                toast.error(`Erreur dans la simulation "${data.scenarioName}": ${data.error}`);

                // Supprimer la simulation active après un délai
                setTimeout(() => {
                    setActiveSimulations(prev => {
                        const updated = { ...prev };
                        delete updated[scenarioId];
                        return updated;
                    });
                }, 60000); // 1 minute
            }

            return updated;
        });
    };

    // Formater le temps restant estimé
    const formatRemainingTime = (seconds?: number) => {
        if (!seconds) return 'Calcul en cours...';

        if (seconds < 60) {
            return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds > 0 ? `${remainingSeconds} s` : ''}`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    };

    // S'il n'y a pas de simulations actives, ne rien afficher
    if (Object.keys(activeSimulations).length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {Object.values(activeSimulations).map((notification) => (
                <Card key={notification.scenarioId} className="overflow-hidden shadow-lg border-b-2 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {notification.type === 'started' && (
                                <Clock className="h-5 w-5 text-blue-500" />
                            )}
                            {notification.type === 'progress' && (
                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            )}
                            {notification.type === 'completed' && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {notification.type === 'failed' && (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}

                            <span className="font-medium truncate">
                                Simulation {notification.scenarioName}
                            </span>
                        </div>

                        {(notification.type === 'started' || notification.type === 'progress') && (
                            <>
                                <div className="mb-2">
                                    <Progress value={notification.progress || 0} className="h-2" />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{notification.progress || 0}% terminé</span>
                                    {notification.estimatedTimeRemaining && (
                                        <span>Temps restant: {formatRemainingTime(notification.estimatedTimeRemaining)}</span>
                                    )}
                                </div>
                                {notification.message && (
                                    <p className="text-sm text-muted-foreground mt-2">{notification.message}</p>
                                )}
                            </>
                        )}

                        {notification.type === 'completed' && (
                            <div className="text-sm">
                                <p className="text-green-600">Simulation terminée avec succès</p>
                                <button
                                    className="mt-2 text-primary hover:underline text-sm font-medium"
                                    onClick={() => notification.viewUrl && router.push(notification.viewUrl)}
                                >
                                    Voir les résultats
                                </button>
                            </div>
                        )}

                        {notification.type === 'failed' && (
                            <div className="text-sm text-red-500">
                                <p>Échec de la simulation</p>
                                {notification.error && (
                                    <p className="text-xs mt-1 break-words">{notification.error}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default SimulationNotifications; 