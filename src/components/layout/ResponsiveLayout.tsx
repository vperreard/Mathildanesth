'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
    children,
    sidebar,
    header,
    footer,
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {header && (
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            {isMobile && sidebar && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                                >
                                    <span className="sr-only">Ouvrir le menu</span>
                                    {isSidebarOpen ? (
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="h-6 w-6" aria-hidden="true" />
                                    )}
                                </button>
                            )}
                            {header}
                        </div>
                    </div>
                </header>
            )}

            <div className="flex">
                {sidebar && (
                    <AnimatePresence>
                        {(!isMobile || isSidebarOpen) && (
                            <motion.aside
                                initial={isMobile ? { x: -300 } : { x: 0 }}
                                animate={isMobile ? { x: 0 } : { x: 0 }}
                                exit={isMobile ? { x: -300 } : { x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`
                                    ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
                                    w-64 bg-white shadow-lg
                                `}
                            >
                                <div className="h-full overflow-y-auto">
                                    {sidebar}
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                )}

                <main className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>

            {footer && (
                <footer className="bg-white shadow-sm mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        {footer}
                    </div>
                </footer>
            )}

            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleSidebar}
                />
            )}
        </div>
    );
}; 