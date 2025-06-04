import React from 'react';
import { Metadata } from 'next';
import ConflictRulesManager from '@/modules/leaves/components/ConflictRulesManager';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConflictRulesContent from './components/ConflictRulesContent';

export const metadata: Metadata = {
    title: 'Gestion des règles de conflits de congés | Administration',
    description: 'Interface d\'administration pour configurer les règles de détection des conflits de congés',
};

/**
 * Page d'administration pour la gestion des règles de détection des conflits de congés
 */
export default function ConflictRulesAdminPage() {
    return (
        <AdminLayout>
            <ConflictRulesContent>
                <ConflictRulesManager />
            </ConflictRulesContent>
        </AdminLayout>
    );
} 