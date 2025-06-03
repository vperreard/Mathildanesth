'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/connexion');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
            
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    Bienvenue, {user.prenom} {user.nom}!
                </h2>
                <p className="text-gray-600">Rôle: {user.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/planning" className="block">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold mb-2">📅 Planning</h3>
                        <p className="text-gray-600">Consulter et gérer votre planning</p>
                    </div>
                </Link>

                <Link href="/conges" className="block">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold mb-2">🏖️ Congés</h3>
                        <p className="text-gray-600">Gérer vos demandes de congés</p>
                    </div>
                </Link>

                <Link href="/notifications" className="block">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold mb-2">🔔 Notifications</h3>
                        <p className="text-gray-600">Voir vos notifications</p>
                    </div>
                </Link>

                {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block">
                        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold mb-2">⚙️ Administration</h3>
                            <p className="text-gray-600">Accéder au panneau d'administration</p>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}