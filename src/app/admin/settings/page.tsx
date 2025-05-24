import React from 'react';
import { Metadata } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Grid,
    Breadcrumbs,
    Link
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export const metadata: Metadata = {
    title: 'Paramètres | Administration',
    description: 'Configuration des paramètres du système',
};

interface SettingCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
}

const SettingCard: React.FC<SettingCardProps> = ({ title, description, icon, link }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardActionArea href={link} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                        {icon}
                        <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                            {title}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

/**
 * Page de gestion des paramètres administratifs
 */
export default function AdminSettingsPage() {
    return (
        <AdminLayout>
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/admin">
                        Administration
                    </Link>
                    <Typography color="text.primary">Paramètres</Typography>
                </Breadcrumbs>

                <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 4 }}>
                    Paramètres du système
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Types de congés"
                            description="Configurer les types de congés disponibles et leurs règles spécifiques."
                            icon={<WorkIcon color="primary" fontSize="large" />}
                            link="/admin/settings/leave-types"
                        />
                    </Grid>

                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Règles de conflit"
                            description="Gérer les règles de détection des conflits de congés et les seuils d'alerte."
                            icon={<EventBusyIcon color="primary" fontSize="large" />}
                            link="/admin/settings/conflict-rules"
                        />
                    </Grid>

                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Rôles et permissions"
                            description="Définir les rôles utilisateurs et leurs niveaux d'accès."
                            icon={<SecurityIcon color="primary" fontSize="large" />}
                            link="/admin/settings/roles"
                        />
                    </Grid>

                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Notifications"
                            description="Paramétrer les notifications système et les alertes."
                            icon={<NotificationsIcon color="primary" fontSize="large" />}
                            link="/admin/settings/notifications"
                        />
                    </Grid>

                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Équipes et départements"
                            description="Gérer la structure organisationnelle et les équipes."
                            icon={<PeopleIcon color="primary" fontSize="large" />}
                            link="/admin/settings/teams"
                        />
                    </Grid>

                    <Grid item xs={12} md={6} lg={4}>
                        <SettingCard
                            title="Configuration générale"
                            description="Paramètres généraux de l'application."
                            icon={<SettingsIcon color="primary" fontSize="large" />}
                            link="/admin/settings/general"
                        />
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
} 