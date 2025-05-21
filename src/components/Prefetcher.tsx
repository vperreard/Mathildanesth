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

/**
 * Composant invisible qui gère le préchargement intelligent des ressources
 * en fonction du contexte et de la navigation de l'utilisateur
 */
export default function Prefetcher() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const initialized = useRef(false);

    // Préchargement initial au montage du composant
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Précharger les ressources critiques
        prefetchCriticalAssets();

        // Attendre que le navigateur soit moins occupé
        window.requestIdleCallback ?
            window.requestIdleCallback(() => prefetchCommonData()) :
            setTimeout(() => prefetchCommonData(), 2000);

        // Précharger les données de l'utilisateur si connecté
        if (user?.id) {
            setTimeout(() => prefetchUserData(user.id), 3000);
        }
    }, [user]);

    // Préchargement basé sur la navigation
    useEffect(() => {
        // Selon la page actuelle, précharger des pages connexes
        if (pathname && !pathname.includes('/login')) {
            const sections = pathname.split('/').filter(Boolean);
            const mainSection = sections[0] || '';

            switch (mainSection) {
                case 'utilisateurs':
                    // Dans la section utilisateurs, précharger les compétences
                    fetch('/api/skills').catch(() => { });
                    break;

                case 'calendar':
                case 'planning':
                    // Pour la planification, précharger les congés et utilisateurs
                    fetch('/api/leaves').catch(() => { });
                    fetch('/api/users').catch(() => { });
                    break;

                case 'leaves':
                    // Pour les congés, précharger les types de congés
                    fetch('/api/leaves/types').catch(() => { });
                    break;

                case 'parametres':
                    // Pour les paramètres, précharger les configurations
                    fetch('/api/settings').catch(() => { });
                    break;

                case '':
                    // Sur la page d'accueil, précharger les routes principales
                    prefetchMainRoutes();
                    break;
            }
        }
    }, [pathname]);

    // Ce composant ne rend rien visuellement
    return null;
} 