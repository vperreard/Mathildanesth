"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Chargement dynamique du préchargeur uniquement côté client
const Prefetcher = dynamic(() => import('@/components/Prefetcher'), {
    ssr: false,
});

/**
 * Composant client pour gérer le préchargement des ressources
 * Ce wrapper est nécessaire car nous ne pouvons pas utiliser ssr: false
 * directement dans un Server Component comme layout.tsx
 */
export default function ClientPrefetcherWrapper() {
    return (
        <Suspense fallback={null}>
            <Prefetcher />
        </Suspense>
    );
} 