'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Role } from '@/types/user';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: Role[];
}

const ProtectedRouteV2: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // Attendre que le chargement soit terminé avant de vérifier
        if (!isLoading && !hasCheckedAuth) {
            setHasCheckedAuth(true);
            
            if (!user) {
                console.log('ProtectedRouteV2: No user, redirecting to login');
                router.replace('/auth/connexion');
                setIsAuthorized(false);
            } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                console.log(`ProtectedRouteV2: Unauthorized role (${user.role})`);
                router.replace('/');
                setIsAuthorized(false);
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, isLoading, router, allowedRoles, hasCheckedAuth]);

    // Pendant le chargement initial ou la vérification
    if (isLoading || !hasCheckedAuth || isAuthorized === null) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de l\'authentification...</p>
                </div>
            </div>
        );
    }

    // Si non autorisé (en attendant la redirection)
    if (!isAuthorized) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">Redirection en cours...</p>
                </div>
            </div>
        );
    }

    // Si autorisé
    return <>{children}</>;
};

export default ProtectedRouteV2;