import React from 'react';
import { AbsenceManager } from '@/components/absences/AbsenceManager';
import { ResponsiveLayout as Layout } from '@/components/layout/ResponsiveLayout';
import { withAuth } from '@/lib/middleware/withAuth';

const AbsencesPage: React.FC = () => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <AbsenceManager />
            </div>
        </Layout>
    );
};

export default withAuth(AbsencesPage); 