'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, BarChart3, Settings, Users, Terminal, ClipboardList } from 'lucide-react';
import AdminRequestsDashboard from '@/components/AdminRequestsDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const { user, isLoading } = useAuth();

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
            title: "Planning",
            description: "Organisez et visualisez le planning des anesthésistes",
            icon: <Calendar className="w-6 h-6 text-white" />,
            href: "/planning/hebdomadaire",
            gradient: "from-primary-500 to-secondary-500",
            color: "text-primary-600",
            delay: 0.1
        },
        {
            title: "Statistiques",
            description: "Analysez les données et les tendances d'activité",
            icon: <BarChart3 className="w-6 h-6 text-white" />,
            href: "/statistiques/utilisation-bloc",
            gradient: "from-secondary-500 to-tertiary-500",
            color: "text-secondary-600",
            delay: 0.2
        },
        {
            title: "Paramètres",
            description: "Personnalisez les paramètres du système selon vos besoins",
            icon: <Settings className="w-6 h-6 text-white" />,
            href: "/parametres",
            gradient: "from-tertiary-500 to-rose-500",
            color: "text-tertiary-600",
            delay: 0.3
        },
        {
            title: "Utilisateurs",
            description: "Gérez les utilisateurs et leurs permissions",
            icon: <Users className="w-6 h-6 text-white" />,
            href: "/utilisateurs",
            gradient: "from-rose-500 to-orange-500",
            color: "text-rose-600",
            delay: 0.4
        }
    ];

    const otherFeatures = [
        {
            title: "Diagnostic",
            description: "Vérifiez le bon fonctionnement du système",
            icon: <Terminal className="w-5 h-5" />,
            href: "/diagnostic",
            delay: 0.3
        },
        {
            title: "Congés",
            description: "Gérez les congés et les absences",
            icon: <ClipboardList className="w-5 h-5" />,
            href: "/leaves",
            delay: 0.4
        }
    ];

    if (!mounted) return null;

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
