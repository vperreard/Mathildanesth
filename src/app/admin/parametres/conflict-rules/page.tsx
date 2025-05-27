import React from 'react';
import { Metadata } from 'next';
import ConflictRulesManager from '@/modules/conges/components/ConflictRulesManager';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Box, Breadcrumbs, Typography, Link, Paper } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

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
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/admin">
                        Administration
                    </Link>
                    <Link underline="hover" color="inherit" href="/admin/parametres">
                        Paramètres
                    </Link>
                    <Typography color="text.primary">Règles de conflit</Typography>
                </Breadcrumbs>

                <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 4 }}>
                    Gestion des règles de détection des conflits de congés
                </Typography>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body1" paragraph>
                        Cette interface vous permet de configurer les règles utilisées par le système pour détecter les
                        conflits potentiels lorsque les employés demandent des congés. Vous pouvez définir les seuils,
                        les pourcentages et les périodes spéciales.
                    </Typography>
                    <Typography variant="body1">
                        Les modifications apportées ici affecteront immédiatement la façon dont le système évalue
                        les nouvelles demandes de congés et détecte les conflits potentiels.
                    </Typography>
                </Paper>

                <ConflictRulesManager />
            </Box>
        </AdminLayout>
    );
} 