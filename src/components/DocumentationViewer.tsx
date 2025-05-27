import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from '@/components/ui/button';
import { HomeIcon, ArrowLeftIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface DocumentationViewerProps {
    path?: string;
    onClose?: () => void;
}

export function DocumentationViewer({ path = 'index.md', onClose }: DocumentationViewerProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [history, setHistory] = useState<string[]>([]);

    const fetchDocumentation = async (docPath: string) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/documentation/${docPath}`);

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement de la documentation: ${response.status}`);
            }

            const markdown = await response.text();
            setContent(markdown);
            setError(null);
        } catch (err) {
            console.error('Erreur de chargement de la documentation:', err);
            setError('Impossible de charger la documentation demandée.');
            setContent('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentation(path);
        if (!history.includes(path)) {
            setHistory(prev => [...prev, path]);
        }
    }, [path]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (href && href.startsWith('/documentation/')) {
            e.preventDefault();
            const docPath = href.replace('/documentation/', '');
            setHistory(prev => [...prev, docPath]);
            fetchDocumentation(docPath);
        }
    };

    const goBack = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop(); // Enlever le chemin actuel
            const previousPath = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            fetchDocumentation(previousPath);
        }
    };

    const goHome = () => {
        fetchDocumentation('index.md');
        setHistory(['index.md']);
    };

    return (
        <div className="documentation-viewer bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg max-w-4xl w-full mx-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
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
                    <Button variant="outline" size="sm" onClick={goHome}>
                        <HomeIcon className="h-4 w-4 mr-1" />
                        Accueil
                    </Button>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="documentation-content prose dark:prose-invert max-w-none">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20">
                        {error}
                    </div>
                ) : (
                    <div onClick={(e) => {
                        // Gestion des liens internes à la documentation
                        if (e.target instanceof HTMLAnchorElement) {
                            handleLinkClick(e as any);
                        }
                    }}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                a: ({ node, ...props }) => {
                                    const href = props.href || '';
                                    if (href.startsWith('/documentation/')) {
                                        return <a {...props} className="text-blue-600 hover:underline" />;
                                    }
                                    if (href.startsWith('http')) {
                                        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />;
                                    }
                                    return <a {...props} className="text-blue-600 hover:underline" />;
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
} 