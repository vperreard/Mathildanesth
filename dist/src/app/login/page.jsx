'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginRedirectPage() {
    var router = useRouter();
    useEffect(function () {
        router.replace('/auth/login');
    }, [router]);
    return (<div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-xl font-semibold">Redirection en cours...</h1>
                <p className="mt-2 text-gray-600">Vous allez être redirigé vers la page de connexion.</p>
            </div>
        </div>);
}
