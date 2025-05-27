'use client';

import dynamic from 'next/dynamic';

// Use optimized login page with code splitting
const LoginPage = dynamic(() => import('./OptimizedLoginPage'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Chargement...</p>
                </div>
            </div>
        </div>
    )
});

const LoginPageWrapper: React.FC = () => {
    return <LoginPage />;
};

export default LoginPageWrapper; 