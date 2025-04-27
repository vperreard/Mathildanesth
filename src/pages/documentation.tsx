import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DocumentationViewer from '../components/documentation/DocumentationViewer';

const DocumentationPage: NextPage = () => {
    // Structure du menu latéral de la documentation
    const sidebarStructure = [
        {
            title: "Guide d'utilisation",
            path: "guide-utilisateur-simulateur.md"
        },
        {
            title: "Exemples de configurations",
            path: "exemples-configurations-simulateur.md"
        },
        {
            title: "Résolution des problèmes",
            path: "guide-resolution-problemes-simulateur.md"
        },
        {
            title: "Documentation technique",
            path: "regles-implementation-guide.md",
            children: [
                {
                    title: "Architecture du simulateur",
                    path: "algo-technique-final.md"
                }
            ]
        },
        {
            title: "Ressources additionnelles",
            path: "guide-demarrage-rapide.md",
            children: [
                {
                    title: "Cahier des charges",
                    path: "cahier-des-charges-updated.md"
                }
            ]
        }
    ];

    return (
        <>
            <Head>
                <title>Documentation | Simulateur de Planning</title>
                <meta name="description" content="Documentation complète du simulateur de planning et du moteur de règles" />
            </Head>

            <DocumentationViewer
                rootPath="/documentation"
                defaultDocument="index.md"
                sidebarStructure={sidebarStructure}
            />
        </>
    );
};

export default DocumentationPage; 