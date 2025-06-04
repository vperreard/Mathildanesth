'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, BarChart3, Settings, Users, ClipboardList, Stethoscope, AlertCircle } from 'lucide-react';
import AdminRequestsDashboard from '../components/AdminRequestsDashboard';
import WeeklyPlanningWidget from '../components/medical/WeeklyPlanningWidget';
import { MobileDashboard } from '../components/dashboard/MobileDashboard';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user, isLoading } = useAuth();
    
    // Détecte si l'écran est mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardHover = {
        rest: { scale: 1 },
        hover: { scale: 1.03, transition: { duration: 0.3 } }
    };

    const featureCards = [
        {
            title: "Mon Planning",
            description: "Organisez vos gardes et vacations d'anesthésie",
            icon: <Calendar className="w-6 h-6 text-white" />,
            href: "/planning",
            gradient: "from-primary-500 to-secondary-500",
            color: "text-primary-600",
            delay: 0.1
        },
        {
            title: "Mes Congés",
            description: "Gérez vos demandes de congés et absences",
            icon: <ClipboardList className="w-6 h-6 text-white" />,
            href: "/conges",
            gradient: "from-secondary-500 to-tertiary-500",
            color: "text-secondary-600",
            delay: 0.2
        },
        {
            title: "Bloc Opératoire",
            description: "Gestion des salles et trameModeles",
            icon: <Stethoscope className="w-6 h-6 text-white" />,
            href: "/bloc-operatoire",
            gradient: "from-tertiary-500 to-rose-500",
            color: "text-tertiary-600",
            delay: 0.3
        },
        {
            title: "Personnel Médical",
            description: "Gérez les équipes MARs, IADEs et chirurgiens",
            icon: <Users className="w-6 h-6 text-white" />,
            href: "/utilisateurs",
            gradient: "from-rose-500 to-orange-500",
            color: "text-rose-600",
            delay: 0.4
        }
    ];

    const otherFeatures = [
        {
            title: "Organisateur Planning",
            description: "Génération automatique des plannings",
            icon: <Settings className="w-5 h-5" />,
            href: "/planning/generation",
            delay: 0.3
        },
        {
            title: "Rapports Médicaux",
            description: "Analyses et statistiques d'activité",
            icon: <BarChart3 className="w-5 h-5" />,
            href: "/admin/rapports",
            delay: 0.4
        }
    ];

    if (!mounted) return null;

    // Si l'utilisateur est connecté, afficher le dashboard approprié
    if (user && !isLoading) {
        // Dashboard mobile optimisé
        if (isMobile) {
            const mockStats = {
                todayPlannings: 3,
                pendingLeaves: 2,
                activeInterventions: 1,
                urgentNotifications: 1,
                onCallToday: true,
                guardTonight: false
            };

            const mockTodayEvents = [
                {
                    id: '1',
                    type: 'vacation' as const,
                    title: 'Bloc Orthopédie - Salle 3',
                    time: '08:00 - 12:00',
                    location: 'Bloc C',
                    status: 'confirmed' as const
                },
                {
                    id: '2',
                    type: 'oncall' as const,
                    title: 'Astreinte obstétrique',
                    time: '18:00 - 08:00',
                    location: 'Maternité',
                    status: 'pending' as const
                }
            ];

            return (
                <MobileDashboard
                    user={{
                        name: user.prenom || user.firstName || 'Utilisateur',
                        role: user.role || 'Médecin',
                        specialties: ['Anesthésie']
                    }}
                    stats={mockStats}
                    todayEvents={mockTodayEvents}
                    onQuickAction={(action) => {
                        switch (action) {
                            case 'planning':
                                window.location.href = '/planning';
                                break;
                            case 'bloc':
                                window.location.href = '/bloc-operatoire';
                                break;
                            case 'conges':
                                window.location.href = '/leaves';
                                break;
                            case 'urgence':
                                window.location.href = '/notifications?urgent=true';
                                break;
                            default:
                                break;
                        }
                    }}
                />
            );
        }

        // Dashboard desktop existant
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    {/* En-tête personnalisé */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Bonjour Dr. {user.prenom || user.firstName} {user.nom || user.lastName}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Voici votre planning de la semaine
                        </p>
                    </motion.div>

                    {/* Layout principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Planning de la semaine - Colonne principale */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="lg:col-span-2"
                        >
                            <WeeklyPlanningWidget userId={user.id?.toString()} />
                        </motion.div>

                        {/* Colonne latérale */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Actions rapides */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5" />
                                        Actions rapides
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button 
                                        variant="default" 
                                        className="w-full justify-start"
                                        onClick={() => window.location.href = '/conges/nouveau'}
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Nouvelle demande de congé
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => window.location.href = '/requetes/echange-garde'}
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Échanger une garde
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => window.location.href = '/planning/equipe'}
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Planning de l'équipe
                                    </Button>
                                    {isAdmin && (
                                        <Button 
                                            variant="secondary" 
                                            className="w-full justify-start"
                                            onClick={() => window.location.href = '/admin'}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Administration
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Notifications importantes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" />
                                        Notifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                                Rappel: Garde ce weekend
                                            </p>
                                            <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                                Samedi 1er février - 24h
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                Formation obligatoire
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                                Jeudi 6 février - 14h00
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Widget admin si applicable */}
                            {isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <AdminRequestsDashboard />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    // Page d'accueil pour les visiteurs non connectés
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:bg-slate-900">
            {/* Hero Section - Afficher uniquement si l'utilisateur n'est pas connecté */}
            {!user && (
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-20">
                        <div className="absolute top-0 -left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                        <div className="absolute top-0 -right-10 w-72 h-72 bg-secondary-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-10 left-20 w-72 h-72 bg-tertiary-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                            >
                                <h1 className="text-5xl md:text-6xl font-display font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent mb-6">
                                    Bienvenue sur Mathildanesth
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
                                    Votre solution complète pour la gestion des anesthésistes et du planning hospitalier
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                                    <Link href="/planning/hebdomadaire" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 font-medium">
                                        Explorer le planning
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 border border-primary-200 bg-white text-primary-600 dark:bg-slate-800 dark:text-primary-400 dark:border-primary-700 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 transform hover:-translate-y-1 font-medium">
                                        Connexion
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Si l'utilisateur est connecté et n'a pas de section Hero, ajouter un espacement en haut */}
                {user && <div className="py-8"></div>}

                {/* Section Admin - Gestion des requêtes */}
                {!isLoading && isAdmin && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <AdminRequestsDashboard />
                    </motion.div>
                )}

                {/* Features Grid */}
                <div className={`${user ? 'py-8' : 'py-16'}`}>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {featureCards.map((card, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeIn}
                                custom={idx}
                                whileHover="hover"
                                initial="rest"
                                animate="rest"
                                className="group"
                            >
                                <motion.div
                                    variants={cardHover}
                                    className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-slate-700 flex flex-col"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:shadow-md transition-all duration-300`}>
                                        {card.icon}
                                    </div>
                                    <h3 className={`text-lg font-semibold ${card.color} dark:text-${card.color.replace('600', '400')} mb-3`}>{card.title}</h3>
                                    <p className="text-gray-600 dark:text-slate-300 mb-5">{card.description}</p>
                                    <div className="mt-auto">
                                        <Link
                                            href={card.href}
                                            className={`inline-flex items-center ${card.color} dark:text-${card.color.replace('600', '400')} hover:opacity-80 font-medium text-sm`}
                                        >
                                            Accéder
                                            <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Other Features */}
                <div className="py-16">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeIn}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                            Autres fonctionnalités
                        </h2>
                        <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Découvrez toutes les fonctionnalités disponibles pour optimiser la gestion de votre équipe
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                    >
                        {otherFeatures.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeIn}
                                whileHover="hover"
                                initial="rest"
                                animate="rest"
                            >
                                <motion.div variants={cardHover}>
                                    <Link
                                        href={feature.href}
                                        className="group flex items-start p-6 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft transition-all duration-300"
                                    >
                                        <div className="mr-4 mt-1 p-2 bg-primary-50 dark:bg-primary-800/30 rounded-lg text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-700/40 transition-colors duration-300">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 mb-2">
                                                {feature.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-slate-300">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Version Info */}
            <div className="text-center pb-20">
                <p className="text-sm text-gray-400">
                    Version 0.1.0 - Environnement: {process.env.NODE_ENV}
                </p>
            </div>

            {/* Add CSS for the blob animation */}
            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
