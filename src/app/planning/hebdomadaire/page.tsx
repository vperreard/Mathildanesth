"use client";

import React from "react";

export default function WeeklyPlanningPage() {
    return (
        <div className="flex flex-col h-full p-4 md:p-6 bg-gray-50 dark:bg-slate-900">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Planning Hebdomadaire
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Module temporairement indisponible - En cours de réparation
                </p>
                <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">
                        Cette page sera restaurée avec toutes ses fonctionnalités prochainement.
                    </p>
                </div>
            </div>
        </div>
    );
}