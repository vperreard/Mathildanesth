'use client';

import dynamic from 'next/dynamic';

// Chargement dynamique du composant PerformanceTracker pour s'assurer
// qu'il s'exécute uniquement côté client
const DynamicPerformanceTracker = dynamic(
    () => import('./PerformanceTracker').then(mod => mod.PerformanceTracker),
    { ssr: false }
);

/**
 * Wrapper client pour le PerformanceTracker
 * Assure que le tracking de performance ne s'exécute que côté client
 */
export default function ClientPerformanceTracker() {
    return <DynamicPerformanceTracker />;
} 