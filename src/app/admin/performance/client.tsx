"use client";

import dynamic from 'next/dynamic';

// Import dynamique du composant client pour éviter les erreurs de SSR
const PerformanceMonitor = dynamic(
    () => import('@/components/admin/PerformanceMonitor'),
    { ssr: false }
);

export default function PerformanceClientWrapper() {
    return <PerformanceMonitor />;
} 