'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Lock, User, Moon, Sun, Globe, Shield, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ParametresPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('compte');

    const tabs = [
        { id: 'compte', label: 'Compte', icon: User },
        { id: 'securite', label: 'Sécurité', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'apparence', label: 'Apparence', icon: Sun },
        { id: 'langue', label: 'Langue', icon: Globe },
        { id: 'confidentialite', label: 'Confidentialité', icon: Shield },
        { id: 'configuration', label: 'Configuration', icon: Settings },
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'compte':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900">Informations personnelles</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.prenom}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nom</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.nom}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            defaultValue={user?.email}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900">Préférences</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Thème sombre</label>
                                            <p className="text-sm text-gray-500">Activer le thème sombre</p>
                                        </div>
                                        <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-gray-200">
                                            <span className="translate-x-0 pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                                                <span className="opacity-100 ease-in duration-200 absolute inset-0 flex h-full w-full items-center justify-center transition-opacity">
                                                    <Sun className="h-3 w-3 text-gray-400" />
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notifications par email</label>
                                            <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                                        </div>
                                        <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-primary-500">
                                            <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                                                <span className="opacity-0 ease-out duration-100 absolute inset-0 flex h-full w-full items-center justify-center transition-opacity">
                                                    <Bell className="h-3 w-3 text-primary-500" />
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                Annuler
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                Enregistrer les modifications
                            </button>
                        </div>
                    </motion.div>
                );
            case 'configuration':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1"
                    >
                        <div className="bg-white rounded-xl shadow-soft p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Panneau de Configuration</h2>
                            <p className="text-gray-600 mb-6">Accédez à toutes les configurations du système.</p>
                            <Link href="/parametres/configuration" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <Settings className="h-4 w-4 mr-2" />
                                Accéder au panneau de configuration
                            </Link>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="bg-white rounded-xl shadow-soft p-6"
            >
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Navigation latérale */}
                    <div className="w-full md:w-64 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Contenu des paramètres */}
                    <div className="flex-1">
                        {renderContent()}
                    </div>
                </div>
            </motion.div>
        </div>
    );
} 