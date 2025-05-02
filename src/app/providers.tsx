'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/components/ui/notification';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { RuleViolationsProvider } from '@/hooks/useRuleViolations';
import { ToastContainer } from 'react-toastify';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                <NotificationProvider>
                    <UnsavedChangesProvider>
                        <RuleViolationsProvider>
                            {children}
                            {/* ToastContainer et NotificationCenter peuvent rester ici car ils sont liés aux providers */}
                            <ToastContainer
                                position="top-right"
                                autoClose={5000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="colored"
                                toastClassName="rounded-lg shadow-md"
                            />
                            <div className="fixed bottom-4 right-4 z-50">
                                <NotificationCenter />
                            </div>
                        </RuleViolationsProvider>
                    </UnsavedChangesProvider>
                </NotificationProvider>
            </AuthProvider>
        </SessionProvider>
    );
} 