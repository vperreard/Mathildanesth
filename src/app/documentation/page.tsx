import React from 'react';
import { DocumentationViewer } from '@/components/documentation/DocumentationViewer';
import fs from 'fs';
import path from 'path';

export default async function DocumentationPage() {
    // Lire les fichiers de documentation
    const technicalDoc = fs.readFileSync(
        path.join(process.cwd(), 'docs/technical/tableaux de service-garde/vacation.md'),
        'utf-8'
    );
    const userGuide = fs.readFileSync(
        path.join(process.cwd(), 'docs/user-guides/admin-tableaux de service.md'),
        'utf-8'
    );

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Documentation</h1>
            <DocumentationViewer technicalDoc={technicalDoc} userGuide={userGuide} />
        </div>
    );
} 