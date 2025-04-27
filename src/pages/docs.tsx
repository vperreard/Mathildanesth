import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DocsViewer from '@/components/documentation/DocsViewer';

const DocsPage: NextPage = () => {
    return (
        <>
            <Head>
                <title>Documentation Technique | Mathildanesth</title>
                <meta name="description" content="Documentation technique sur les performances et l'accessibilité de l'application Mathildanesth" />
            </Head>

            <DocsViewer defaultDoc="performance.md" />
        </>
    );
};

export default DocsPage; 