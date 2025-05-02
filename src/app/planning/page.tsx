import React from 'react';
import { PlanningView } from '@/components/planning/PlanningView';

export default function PlanningPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Planning des affectations</h1>
            <PlanningView />
        </div>
    );
} 