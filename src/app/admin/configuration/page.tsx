'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Calendar,
    FileText,
    Award,
    Activity,
    LayoutGrid as Grid,
    Share2,
    Layout,
    Map,
    TableProperties,
    Users,
    Shield,
    AlertTriangle,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

/**
 * PANNEAU CONFIGURATION ADMIN UNIFIÉ
 * 
 * Remplace les multiples panneaux de paramètres dupliqués :
 * - /admin/parametres (supprimé)
 * - /parametres/configuration (fusionné ici)
 * 
 * Centralise TOUTE la configuration système dans une interface unique
 */

interface ConfigSection {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    color: string;
    hoverColor: string;
    category: 'core' | 'medical' | 'planning' | 'advanced';
    status: 'active' | 'beta' | 'maintenance';
}

const configSections: ConfigSection[] = [
    // CONFIGURATION CORE SYSTÈME
    {
        id: 'types-conges',
        label: 'Types de Congés',
        description: 'Gérer les types, quotas et règles de congés',
        icon: <Calendar className="h-5 w-5" />,
        link: '/parametres/types-conges',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        hoverColor: 'hover:from-blue-400 hover:to-cyan-400',
        category: 'core',
        status: 'active'
    },
    {
        id: 'specialties',
        label: 'Spécialités Médicales',
        description: 'Configuration des spécialités et compétences',
        icon: <Award className="h-5 w-5" />,
        link: '/admin/skills',
        color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        hoverColor: 'hover:from-emerald-400 hover:to-teal-400',
        category: 'medical',
        status: 'active'
    },
    {
        id: 'operating-rooms',
        label: 'Salles d\'Opération',
        description: 'Gestion du bloc opératoire et des salles',
        icon: <Layout className="h-5 w-5" />,
        link: '/admin/bloc-operatoire',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        hoverColor: 'hover:from-purple-400 hover:to-pink-400',
        category: 'medical',
        status: 'active'
    },
    {
        id: 'operating-sectors',
        label: 'Secteurs du Bloc',
        description: 'Organisation des secteurs opératoires',
        icon: <Grid className="h-5 w-5" />,
        link: '/parametres/configuration#operating-sectors',
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        hoverColor: 'hover:from-orange-400 hover:to-red-400',
        category: 'medical',
        status: 'active'
    },
    
    // CONFIGURATION PLANNING
    {
        id: 'planning-rules',
        label: 'Règles de Planning',
        description: 'Règles dynamiques et contraintes intelligentes',
        icon: <Activity className="h-5 w-5" />,
        link: '/admin/planning-rules',
        color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        hoverColor: 'hover:from-indigo-400 hover:to-purple-400',
        category: 'planning',
        status: 'active'
    },
    {
        id: 'trames',
        label: 'Tableaux de Service',
        description: 'Templates et modèles de planning',
        icon: <TableProperties className="h-5 w-5" />,
        link: '/admin/trames',
        color: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        hoverColor: 'hover:from-cyan-400 hover:to-blue-400',
        category: 'planning',
        status: 'active'
    },
    {
        id: 'attributions',
        label: 'Affectations & Gardes',
        description: 'Gestion des affectations et rotations',
        icon: <Share2 className="h-5 w-5" />,
        link: '/parametres/configuration#attributions',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        hoverColor: 'hover:from-green-400 hover:to-emerald-400',
        category: 'planning',
        status: 'active'
    },
    
    // CONFIGURATION AVANCÉE
    {
        id: 'team-config',
        label: 'Configuration Équipes',
        description: 'Structure des équipes et hiérarchies',
        icon: <Users className="h-5 w-5" />,
        link: '/admin/team-configurations',
        color: 'bg-gradient-to-r from-rose-500 to-pink-500',
        hoverColor: 'hover:from-rose-400 hover:to-pink-400',
        category: 'advanced',
        status: 'active'
    },
    {
        id: 'site-assignments',
        label: 'Affectations Sites',
        description: 'Attribution du personnel aux sites',
        icon: <Map className="h-5 w-5" />,
        link: '/admin/site-assignments',
        color: 'bg-gradient-to-r from-violet-500 to-purple-500',
        hoverColor: 'hover:from-violet-400 hover:to-purple-400',
        category: 'advanced',
        status: 'active'
    },
    {
        id: 'requests-header',
        label: 'En-têtes Requêtes',
        description: 'Configuration des formulaires de demandes',
        icon: <FileText className="h-5 w-5" />,
        link: '/parametres/configuration#header',
        color: 'bg-gradient-to-r from-amber-500 to-orange-500',
        hoverColor: 'hover:from-amber-400 hover:to-orange-400',
        category: 'advanced',
        status: 'active'
    },
    {
        id: 'fatigue-management',
        label: 'Gestion Fatigue',
        description: 'Surveillance de la charge de travail',
        icon: <Activity className="h-5 w-5" />,
        link: '/parametres/configuration#fatigue-management',
        color: 'bg-gradient-to-r from-red-500 to-pink-500',
        hoverColor: 'hover:from-red-400 hover:to-pink-400',
        category: 'advanced',
        status: 'beta'
    },
    {
        id: 'security',
        label: 'Sécurité & Audit',
        description: 'Logs, permissions et sécurité',
        icon: <Shield className="h-5 w-5" />,
        link: '/admin/security',
        color: 'bg-gradient-to-r from-slate-500 to-gray-500',
        hoverColor: 'hover:from-slate-400 hover:to-gray-400',
        category: 'advanced',
        status: 'maintenance'
    }
];

const categories = {
    core: { label: 'Configuration Système', color: 'text-blue-600', bg: 'bg-blue-50' },
    medical: { label: 'Configuration Médicale', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    planning: { label: 'Planning & Règles', color: 'text-purple-600', bg: 'bg-purple-50' },
    advanced: { label: 'Configuration Avancée', color: 'text-orange-600', bg: 'bg-orange-50' }
};

export default function UnifiedAdminConfigurationPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredSections = selectedCategory === 'all' 
        ? configSections 
        : configSections.filter(section => section.category === selectedCategory);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'beta':
                return <Badge variant="secondary" className="ml-2">Beta</Badge>;
            case 'maintenance':
                return <Badge variant="destructive" className="ml-2">Maintenance</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            {/* Header avec navigation */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour
                            </Button>
                            
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Configuration Système
                                </h1>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    Panneau unifié de configuration - Tous les paramètres en un seul endroit
                                </p>
                            </div>
                        </div>

                        <Link href="/admin/command-center">
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                                <Activity className="h-4 w-4 mr-2" />
                                Centre de Commande
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filtres par catégorie */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-wrap gap-2 mb-8">
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="mb-2"
                    >
                        Toutes les configurations
                    </Button>
                    {Object.entries(categories).map(([key, category]) => (
                        <Button
                            key={key}
                            variant={selectedCategory === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(key)}
                            className={`mb-2 ${selectedCategory === key ? '' : category.color}`}
                        >
                            {category.label}
                        </Button>
                    ))}
                </div>

                {/* Grille des configurations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSections.map((section, index) => (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="group"
                        >
                            <Link href={section.link} className="block h-full">
                                <Card className="h-full bg-white dark:bg-slate-800 shadow-soft border border-gray-100 dark:border-slate-700 transition-all duration-300 hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-600 overflow-hidden">
                                    {/* Header coloré */}
                                    <div className={`h-2 ${section.color} ${section.hoverColor} transition-all duration-300`} />
                                    
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-lg ${section.color} bg-opacity-10 text-white`}>
                                                {section.icon}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {getStatusBadge(section.status)}
                                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 mt-2" />
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors duration-200">
                                            {section.label}
                                        </h3>
                                        
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                            {section.description}
                                        </p>

                                        {/* Catégorie badge */}
                                        <div className="mt-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categories[section.category].bg} ${categories[section.category].color}`}>
                                                {categories[section.category].label}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Section d'aide */}
                <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Besoin d'aide ?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                    Ce panneau unifié remplace tous les anciens panneaux de paramètres. 
                                    Toutes les configurations système sont maintenant centralisées ici.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/docs/configuration">
                                        <Button variant="outline" size="sm">
                                            Documentation
                                        </Button>
                                    </Link>
                                    <Link href="/admin/command-center">
                                        <Button variant="outline" size="sm">
                                            Monitoring Temps Réel
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}