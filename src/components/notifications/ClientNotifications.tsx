'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Chargement dynamique des composants de notification côté client uniquement
const NotificationCenter = dynamic(
    () => import('@/components/notifications/NotificationCenter').then(mod => ({ default: mod.NotificationCenter })),
    { ssr: false }
);

const SimulationNotifications = dynamic(
    () => import('@/components/notifications/SimulationNotifications').then(mod => ({ default: mod.SimulationNotifications })),
    { ssr: false }
);

export function ClientNotificationCenter() {
    return (
        <Suspense fallback={null}>
            <div className="fixed bottom-4 right-4 z-50">
                <NotificationCenter />
            </div>
        </Suspense>
    );
}

export function ClientSimulationNotifications() {
    return (
        <Suspense fallback={null}>
            <SimulationNotifications />
        </Suspense>
    );
} 