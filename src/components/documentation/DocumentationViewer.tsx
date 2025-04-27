import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Search } from 'lucide-react';

interface DocumentItem {
    title: string;
    path: string;
    children?: DocumentItem[];
}

interface DocumentationViewerProps {
    rootPath: string;
    defaultDocument: string;
    sidebarStructure: DocumentItem[];
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
    rootPath,
    defaultDocument,
    sidebarStructure
}) => {
    const router = useRouter();
    const [activeDocument, setActiveDocument] = useState<string>(defaultDocument);
    const [documentContent, setDocumentContent] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<{ title: string; path: string; excerpt: string }[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Fonction pour charger le contenu d'un document
    const loadDocument = async (path: string) => {
        try {
            const response = await fetch(`${rootPath}/${path}`);
            if (response.ok) {
                const content = await response.text();
                setDocumentContent(content);
                setActiveDocument(path);

                // Mettre à jour l'URL sans recharger la page
                router.push(
                    {
                        pathname: router.pathname,
                        query: { ...router.query, doc: path }
                    },
                    undefined,
                    { shallow: true }
                );
            } else {
                console.error('Erreur lors du chargement du document:', response.statusText);
                setDocumentContent('# Erreur\nLe document demandé est introuvable.');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du document:', error);
            setDocumentContent('# Erreur\nUne erreur est survenue lors du chargement du document.');
        }
    };

    // Charger le document initial ou celui spécifié dans l'URL
    useEffect(() => {
        const docInUrl = router.query.doc as string;
        if (docInUrl) {
            loadDocument(docInUrl);
        } else {
            loadDocument(defaultDocument);
        }
    }, [router.query.doc, defaultDocument]);

    // Fonction de recherche dans la documentation
    const searchDocumentation = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            // Dans une implémentation réelle, cela serait une API de recherche côté serveur
            // Pour cette démo, nous simulons une recherche côté client

            // Rassembler tous les documents
            const allDocs = getAllDocPaths(sidebarStructure);
            const results = [];

            // Charger et chercher dans chaque document
            for (const docPath of allDocs) {
                try {
                    const response = await fetch(`${rootPath}/${docPath}`);
                    if (response.ok) {
                        const content = await response.text();
                        const searchRegex = new RegExp(`(.{0,50}${searchQuery}.{0,50})`, 'gi');
                        const matches = content.match(searchRegex);

                        if (matches) {
                            // Trouver le titre du document
                            const titleMatch = content.match(/^# (.+)$/m);
                            const title = titleMatch ? titleMatch[1] : docPath;

                            // Ajouter aux résultats
                            results.push({
                                title,
                                path: docPath,
                                excerpt: matches[0].replace(new RegExp(searchQuery, 'gi'), `<strong>${searchQuery}</strong>`)
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Erreur lors de la recherche dans ${docPath}:`, error);
                }
            }

            setSearchResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    // Récupérer tous les chemins de documents à partir de la structure
    const getAllDocPaths = (items: DocumentItem[]): string[] => {
        let paths: string[] = [];

        items.forEach(item => {
            paths.push(item.path);
            if (item.children && item.children.length > 0) {
                paths = [...paths, ...getAllDocPaths(item.children)];
            }
        });

        return paths;
    };

    // Rendu du menu latéral
    const renderSidebarItems = (items: DocumentItem[]) => {
        return (
            <ul className="pl-0 list-none">
                {items.map((item) => (
                    <li key={item.path} className="mb-2">
                        <a
                            href="#"
                            className={`block p-2 rounded ${activeDocument === item.path ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                loadDocument(item.path);
                            }}
                        >
                            {item.title}
                        </a>
                        {item.children && item.children.length > 0 && (
                            <div className="pl-4 mt-2 border-l-2 border-gray-200">
                                {renderSidebarItems(item.children)}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Barre latérale */}
            <div className="w-full md:w-64 bg-white p-4 border-r border-gray-200 md:h-screen overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Documentation</h2>

                {/* Barre de recherche */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full p-2 pl-8 border border-gray-300 rounded"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchDocumentation()}
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <button
                        className="absolute right-2 top-2 text-xs text-blue-600"
                        onClick={searchDocumentation}
                        disabled={isSearching}
                    >
                        {isSearching ? 'Recherche...' : 'Rechercher'}
                    </button>
                </div>

                {/* Résultats de recherche ou navigation */}
                {searchResults.length > 0 ? (
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-2">Résultats ({searchResults.length})</h3>
                        <button
                            className="text-xs text-blue-600 mb-2"
                            onClick={() => setSearchResults([])}
                        >
                            Revenir à la navigation
                        </button>
                        <ul className="divide-y divide-gray-200">
                            {searchResults.map((result, index) => (
                                <li key={index} className="py-2">
                                    <a
                                        href="#"
                                        className="block font-medium text-blue-600 hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            loadDocument(result.path);
                                            setSearchResults([]);
                                        }}
                                    >
                                        {result.title}
                                    </a>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span dangerouslySetInnerHTML={{ __html: `...${result.excerpt}...` }} />
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <nav>{renderSidebarItems(sidebarStructure)}</nav>
                )}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 p-6 md:overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        className="prose max-w-none"
                        components={{
                            a: ({ node, ...props }) => {
                                const href = props.href || '';

                                // Gestion des liens relatifs vers d'autres documents
                                if (href.startsWith('./') && href.endsWith('.md')) {
                                    return (
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const path = href.replace('./', '');
                                                loadDocument(path);
                                            }}
                                            {...props}
                                        />
                                    );
                                }

                                return <a {...props} target="_blank" rel="noopener noreferrer" />;
                            },
                            pre: ({ node, ...props }) => (
                                <div className="overflow-x-auto bg-gray-100 rounded p-4">
                                    <pre {...props} />
                                </div>
                            ),
                            code: ({ node, ...props }) => <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />,
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-300" {...props} />
                                </div>
                            ),
                            th: ({ node, ...props }) => <th className="px-4 py-2 bg-gray-100" {...props} />,
                            td: ({ node, ...props }) => <td className="px-4 py-2 border-t" {...props} />
                        }}
                    >
                        {documentContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default DocumentationViewer; 