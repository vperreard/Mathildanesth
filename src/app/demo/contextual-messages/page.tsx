'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ContextualMessagePanel } from '@/components/ContextualMessagePanel';
import { fetchWithAuth } from '@/lib/auth-helpers';

export default function ContextualMessagesDemo() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contextType, setContextType] = useState('date');
    const [assignmentId, setAssignmentId] = useState('');
    const [contextDate, setContextDate] = useState(new Date().toISOString().split('T')[0]);
    const [requestId, setRequestId] = useState('');
    const [authError, setAuthError] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Vérifier si l'authentification fonctionne correctement
    useEffect(() => {
        if (status === 'authenticated' && session) {
            // Après l'authentification, vérifions si nos API sont accessibles
            setIsCheckingAuth(true);

            const checkAuthApi = async () => {
                try {
                    // Test d'un endpoint simple avec authentification
                    const response = await fetchWithAuth('/api/me', {}, session);

                    if (!response.ok) {
                        if (response.status === 401) {
                            console.warn("L'authentification semble valide mais le token est rejeté par l'API");
                            setAuthError(true);
                            // Rafraîchissement de la session
                            await signIn('credentials', {
                                redirect: false,
                                callbackUrl: '/demo/contextual-messages'
                            });
                        } else {
                            console.error(`Erreur API: ${response.status}`);
                        }
                    } else {
                        // L'authentification fonctionne correctement
                        setAuthError(false);
                    }
                } catch (error) {
                    console.error("Erreur lors de la vérification de l'API:", error);
                } finally {
                    setIsCheckingAuth(false);
                }
            };

            checkAuthApi();
        } else if (status === 'unauthenticated') {
            setAuthError(true);
            setIsCheckingAuth(false);
        }
    }, [status, session]);

    // Gérer l'authentification
    useEffect(() => {
        // Si explicitement non authentifié, rediriger vers la page de connexion
        if (status === 'unauthenticated') {
            // On utilise signIn directement au lieu de router.push pour éviter les redirections en boucle
            // et s'assurer que le contexte d'authentification est correctement initialisé
            signIn('credentials', {
                callbackUrl: '/demo/contextual-messages',
                redirect: true
            });
        }
    }, [status]);

    // Afficher un message de chargement pendant la vérification de l'authentification
    if (status === 'loading' || isCheckingAuth) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
                <p>Vérification de l'authentification...</p>
            </div>
        );
    }

    // Si erreur d'authentification ou non authentifié, afficher un message
    if (authError) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <div className="rounded-lg bg-yellow-100 p-6 border border-yellow-300">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Problème d'authentification</h2>
                    <p className="text-yellow-700 mb-4">
                        Nous avons détecté un problème avec votre session. Veuillez vous reconnecter pour accéder à cette page.
                    </p>
                    <button
                        onClick={() => signIn('credentials', {
                            callbackUrl: '/demo/contextual-messages',
                            redirect: true
                        })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    const getContextProps = () => {
        switch (contextType) {
            case 'assignment':
                return { assignmentId };
            case 'date':
                return { contextDate };
            case 'request':
                return { requestId };
            default:
                return {};
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Démonstration des Messages Contextuels</h1>

            {/* Afficher les informations de l'utilisateur connecté */}
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="font-semibold text-green-800">
                    Connecté en tant que : {session?.user?.login || session?.user?.name || 'Utilisateur'}
                    {session?.user?.role && ` (${session.user.role})`}
                </p>
                <p className="text-sm text-green-700 mt-1">
                    ID utilisateur : {session?.user?.id || 'Non disponible'}
                </p>
                {session?.user?.accessToken && (
                    <p className="text-xs text-green-600 mt-1 truncate">
                        Token: {session.user.accessToken.substring(0, 20)}...
                    </p>
                )}
            </div>

            {/* Configuration du type de contexte */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Configuration</h2>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Type de contexte :</label>
                    <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="contextType"
                                value="date"
                                checked={contextType === 'date'}
                                onChange={() => setContextType('date')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">Date</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="contextType"
                                value="assignment"
                                checked={contextType === 'assignment'}
                                onChange={() => setContextType('assignment')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">Affectation</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="contextType"
                                value="request"
                                checked={contextType === 'request'}
                                onChange={() => setContextType('request')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">Requête</span>
                        </label>
                    </div>
                </div>

                {/* Paramètres spécifiques au type de contexte */}
                {contextType === 'date' && (
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Date :</label>
                        <input
                            type="date"
                            value={contextDate}
                            onChange={(e) => setContextDate(e.target.value)}
                            className="form-input w-full md:w-72 px-3 py-2 border rounded-md"
                        />
                    </div>
                )}

                {contextType === 'assignment' && (
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">ID d'affectation :</label>
                        <input
                            type="text"
                            value={assignmentId}
                            onChange={(e) => setAssignmentId(e.target.value)}
                            placeholder="Exemple: aff_12345"
                            className="form-input w-full md:w-72 px-3 py-2 border rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Entrez un ID d'affectation valide pour tester. Vous pouvez le trouver dans la base de données ou créer une affectation de test.
                        </p>
                    </div>
                )}

                {contextType === 'request' && (
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">ID de requête :</label>
                        <input
                            type="text"
                            value={requestId}
                            onChange={(e) => setRequestId(e.target.value)}
                            placeholder="Exemple: req_12345"
                            className="form-input w-full md:w-72 px-3 py-2 border rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Entrez un ID de requête valide pour tester. Vous pouvez le trouver dans la base de données ou créer une requête de test.
                        </p>
                    </div>
                )}
            </div>

            {/* Panneau de messages contextuels */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Panneau de Messages</h2>
                <ContextualMessagePanel
                    {...getContextProps()}
                    mode="expanded"
                    className="w-full max-w-3xl"
                />
            </div>

            {/* Instructions et explications */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h2 className="text-lg font-semibold mb-2 text-blue-800">Comment utiliser</h2>
                <ul className="list-disc pl-5 space-y-2 text-blue-700">
                    <li>Choisissez un type de contexte (date, affectation ou requête)</li>
                    <li>Configurez les paramètres nécessaires</li>
                    <li>Le panneau de messages se connectera automatiquement et affichera les messages liés à ce contexte</li>
                    <li>Vous pouvez écrire, modifier et supprimer vos propres messages</li>
                    <li>Les messages sont mis à jour en temps réel grâce à WebSocket</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-blue-600">
                        <strong>Note:</strong> Cette démo utilise votre compte utilisateur actuel. Les autorisations d'édition et de suppression sont appliquées en fonction de votre rôle et si vous êtes l'auteur du message.
                    </p>
                </div>
            </div>
        </div>
    );
} 