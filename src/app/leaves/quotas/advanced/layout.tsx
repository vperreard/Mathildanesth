import React from 'react';

export const metadata = {
    title: 'Gestion avancée des quotas - Mathildanesth',
    description: 'Système avancé de gestion et reporting des quotas de congés',
};

export default function AdvancedQuotaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full min-h-screen bg-slate-50 py-6">
            {children}
        </div>
    );
} 