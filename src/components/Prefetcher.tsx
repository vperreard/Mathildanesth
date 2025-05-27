"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    prefetchCommonData,
    prefetchMainRoutes,
    prefetchCriticalAssets,
    prefetchUserData
} from '@/utils/prefetch';
import { useAuth } from '@/hooks/useAuth';
import { getClientAuthToken } from '@/lib/auth-client-utils';

/**
 * Composant invisible qui gère le préchargement intelligent des ressources
 * en fonction du contexte et de la navigation de l'utilisateur
 */
export default function Prefetcher() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();
    const initialized = useRef(false);

    // Préchargement initial au montage du composant
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Précharger les ressources critiques (pas besoin d'auth)
        prefetchCriticalAssets();

        // Ne précharger les données que si l'utilisateur est authentifié
        if (isAuthenticated && getClientAuthToken()) {
            // Attendre que le navigateur soit moins occupé
            window.requestIdleCallback ?
                window.requestIdleCallback(() => prefetchCommonData()) :
                setTimeout(() => prefetchCommonData(), 2000);

            // Précharger les données de l'utilisateur si connecté
            if (user?.id) {
                setTimeout(() => prefetchUserData(user.id), 3000);
            }
        } else {
            console.log('Utilisateur non authentifié, préchargement des données ignoré');
        }
    }, [user, isAuthenticated]);

    // Préchargement basé sur la navigation
    useEffect(() => {
        // Vérifier l'authentification avant le préchargement
        const token = getClientAuthToken();

        // Selon la page actuelle, précharger des pages connexes
        if (pathname && !pathname.includes('/login') && isAuthenticated && token) {
            const sections = pathname.split('/').filter(Boolean);
            const mainSection = sections[0] || '';

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            switch (mainSection) {
                case 'utilisateurs':
                    // Dans la section utilisateurs, précharger les compétences
                    fetch('http://localhost:3000/api/skills', { headers }).catch(() => { });
                    break;

                case 'calendar':
                case 'planning':
                    // Pour la planification, précharger les congés et utilisateurs
                    fetch('http://localhost:3000/api/leaves', { headers }).catch(() => { });
                    fetch('http://localhost:3000/api/utilisateurs', { headers }).catch(() => { });
                    break;

                case 'leaves':
                    // Pour les congés, précharger les types de congés
                    fetch('http://localhost:3000/api/leaves/types', { headers }).catch(() => { });
                    break;

                case 'parametres':
                    // Pour les paramètres, précharger les configurations
                    fetch('http://localhost:3000/api/admin/configuration', { headers }).catch(() => { });
                    break;

                case '':
                    // Sur la page d'accueil, précharger les routes principales
                    prefetchMainRoutes();
                    break;
            }
        }
    }, [pathname, isAuthenticated]);

    // Ce composant ne rend rien visuellement
    return null;
} 