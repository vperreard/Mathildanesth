'use client';

import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/components/ui/notification';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { RuleViolationsProvider } from '@/hooks/useRuleViolations';
import { PerformanceProvider } from '@/context/PerformanceContext';
import { ReactQueryProvider } from '@/lib/reactQuery';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ReactQueryProvider>
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
                                {/* Temporairement désactivé pour éviter les erreurs WebSocket
                                <div className="fixed bottom-4 right-4 z-50">
                                    <NotificationCenter />
                                </div>
                                */}
                                {/* <Toaster position="bottom-right" /> // Commenté temporairement */}
                            </RuleViolationsProvider>
                        </UnsavedChangesProvider>
                    </NotificationProvider>
                </PerformanceProvider>
                {/* </ThemeProvider> // Commenté temporairement */}
            </ReactQueryProvider>
        </AuthProvider>
    );
} 