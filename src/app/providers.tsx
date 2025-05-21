'use client';

import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/components/ui/notification';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { RuleViolationsProvider } from '@/hooks/useRuleViolations';
import { PerformanceProvider } from '@/context/PerformanceContext';
import { ToastContainer } from 'react-toastify';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SessionProvider } from 'next-auth/react';
import 'react-toastify/dist/ReactToastify.css';
// import { ThemeProvider } from 'next-themes'; // Commenté temporairement
// import { Toaster } from 'sonner'; // Commenté temporairement

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                {/* <ThemeProvider> // Commenté temporairement */}
                <PerformanceProvider>
                    <NotificationProvider>
                        <UnsavedChangesProvider>
                            <RuleViolationsProvider>
                                {children}
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
                                {/* <Toaster position="bottom-right" /> // Commenté temporairement */}
                            </RuleViolationsProvider>
                        </UnsavedChangesProvider>
                    </NotificationProvider>
                </PerformanceProvider>
                {/* </ThemeProvider> // Commenté temporairement */}
            </AuthProvider>
        </SessionProvider>
    );
} 