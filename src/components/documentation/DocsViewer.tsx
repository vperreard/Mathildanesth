import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Search, HomeIcon, ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DocItem {
    title: string;
    path: string;
    description?: string;
}

const docsStructure: DocItem[] = [
    {
        title: "Guide d'Optimisation des Performances",
        path: "performance.md",
        description: "Techniques d'optimisation pour images et composants"
    },
    {
        title: "Guide d'Accessibilité",
        path: "accessibility.md",
        description: "Améliorations d'accessibilité des composants UI"
    },
    {
        title: "Performances des Composants",
        path: "performance-components.md",
        description: "Optimisation spécifique aux composants"
    },
    {
        title: "Accessibilité des Composants Principaux",
        path: "accessibility-main-components.md",
        description: "Accessibilité des composants majeurs"
    }
];

interface DocsViewerProps {
    defaultDoc?: string;
}

interface SearchResult {
    title: string;
    path: string;
    excerpt: string;
}

const DocsViewer: React.FC<DocsViewerProps> = ({ defaultDoc = 'performance.md' }) => {
    const router = useRouter();
    const [activeDoc, setActiveDoc] = useState<string>(defaultDoc);
    const [documentContent, setDocumentContent] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [history, setHistory] = useState<string[]>([defaultDoc]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Charger le document initial ou celui spécifié dans l'URL
    useEffect(() => {
        const docInUrl = router.query.doc as string;
        if (docInUrl) {
            loadDocument(docInUrl);
        } else {
            loadDocument(defaultDoc);
        }
    }, [router.query.doc, defaultDoc]);

    // Fonction pour charger le contenu d'un document
    const loadDocument = async (path: string) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/docs/${path}`);

            if (response.ok) {
                const content = await response.text();
                setDocumentContent(content);
                setActiveDoc(path);

                // Ajouter à l'historique si c'est un nouveau document
                if (history[history.length - 1] !== path) {
                    setHistory(prev => [...prev, path]);
                }

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
                logger.error('Erreur lors du chargement du document:', response.statusText);
                setError('Le document demandé est introuvable.');
            }
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement du document:', { error: error });
            setError('Une erreur est survenue lors du chargement du document.');
        } finally {
            setLoading(false);
        }
    };

    // Fonction de recherche dans la documentation
    const searchDocumentation = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const results: SearchResult[] = [];

            // Charger et chercher dans chaque document
            for (const doc of docsStructure) {
                try {
                    const response = await fetch(`http://localhost:3000/api/docs/${doc.path}`);
                    if (response.ok) {
                        const content = await response.text();
                        const searchRegex = new RegExp(`(.{0,50}${searchQuery}.{0,50})`, 'gi');
                        const matches = content.match(searchRegex);

                        if (matches) {
                            // Ajouter aux résultats
                            results.push({
                                title: doc.title,
                                path: doc.path,
                                excerpt: matches[0].replace(new RegExp(searchQuery, 'gi'), `<strong>${searchQuery}</strong>`)
                            });
                        }
                    }
                } catch (error: unknown) {
                    logger.error(`Erreur lors de la recherche dans ${doc.path}:`, { error: error });
                }
            }

            setSearchResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    // Navigation: retour
    const goBack = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop(); // Enlever le chemin actuel
            const previousPath = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            loadDocument(previousPath);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Barre latérale */}
            <div className="w-full md:w-72 bg-white p-4 border-r border-gray-200 md:h-screen md:overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Documentation Technique</h2>

                {/* Barre de recherche */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full p-2 pl-8 border border-gray-300 rounded"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchDocumentation()}
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
                    <nav>
                        <ul className="space-y-2">
                            {docsStructure.map((doc) => (
                                <li key={doc.path}>
                                    <a
                                        href="#"
                                        className={`block p-2 rounded ${activeDoc === doc.path
                                                ? 'bg-blue-100 text-blue-700 font-semibold'
                                                : 'hover:bg-gray-100'
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            loadDocument(doc.path);
                                        }}
                                    >
                                        <div className="flex items-center">
                                            <ChevronRightIcon size={16} className="mr-1" />
                                            {doc.title}
                                        </div>
                                        {doc.description && <p className="text-xs text-gray-500 ml-5 mt-1">{doc.description}</p>}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 p-6 md:overflow-y-auto">
                <Card className="max-w-4xl mx-auto">
                    <div className="p-6">
                        {/* Barre de navigation */}
                        <div className="flex justify-between items-center mb-4 pb-3 border-b">
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goBack}
                                    disabled={history.length <= 1}
                                >
                                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                    Retour
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadDocument(defaultDoc)}
                                >
                                    <HomeIcon className="h-4 w-4 mr-1" />
                                    Accueil
                                </Button>
                            </div>
                        </div>

                        {/* Contenu du document */}
                        {loading ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                                {error}
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        a: ({ node, ...props }) => {
                                            const href = props.href || '';
                                            if (href.endsWith('.md')) {
                                                return (
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            loadDocument(href);
                                                        }}
                                                        className="text-blue-600 hover:underline"
                                                        {...props}
                                                    />
                                                );
                                            }
                                            return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />;
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
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DocsViewer;