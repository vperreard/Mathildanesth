"use client";
import React from 'react';

export default function DiagnosticPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Page de diagnostic</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Test du middleware</h2>
                <p className="mb-2">
                    Cette section teste si le middleware fonctionne correctement. Elle effectue une requête vers l'API de test et vérifie
                    si les en-têtes du middleware sont présents.
                </p>
                <TestMiddleware />
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Info navigateur et environnement</h2>
                <BrowserInfo />
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Test d'accès API</h2>
                <p className="mb-2">
                    Cette section test l'accès aux endpoints API authentifiés.
                </p>
                <ApiAccessTest />
            </div>
        </div>
    );
}

// Composant pour tester le middleware
function TestMiddleware() {
    const [result, setResult] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const testMiddleware = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/test-middleware');
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError('Erreur lors du test: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border p-4 rounded-lg bg-gray-50">
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={testMiddleware}
                disabled={loading}
            >
                {loading ? 'Test en cours...' : 'Tester le middleware'}
            </button>

            {error && (
                <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-3">
                    <h3 className="font-semibold">Résultat:</h3>
                    <div className="p-3 bg-white border rounded mt-2 overflow-auto max-h-60">
                        <p>Middleware exécuté: <strong>{result.middlewareExecuted ? 'Oui ✅' : 'Non ❌'}</strong></p>
                        <p className="mt-2 font-semibold">Headers:</p>
                        <pre className="text-xs mt-1">
                            {JSON.stringify(result.allHeaders, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// Composant pour afficher les infos du navigateur
function BrowserInfo() {
    const [browserInfo, setBrowserInfo] = React.useState<any>({
        userAgent: '',
        cookiesEnabled: false,
        language: '',
        screenSize: '',
        timeZone: '',
        timeZoneOffset: '',
    });

    React.useEffect(() => {
        setBrowserInfo({
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            language: navigator.language,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeZoneOffset: new Date().getTimezoneOffset(),
        });
    }, []);

    return (
        <div className="border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><strong>User Agent:</strong> <span className="text-sm">{browserInfo.userAgent}</span></div>
                <div><strong>Cookies:</strong> {browserInfo.cookiesEnabled ? 'Activés ✅' : 'Désactivés ❌'}</div>
                <div><strong>Langue:</strong> {browserInfo.language}</div>
                <div><strong>Taille d'écran:</strong> {browserInfo.screenSize}</div>
                <div><strong>Fuseau horaire:</strong> {browserInfo.timeZone}</div>
                <div><strong>Décalage UTC:</strong> {-browserInfo.timeZoneOffset / 60} heures</div>
            </div>
        </div>
    );
}

// Composant pour tester l'accès API
function ApiAccessTest() {
    const [results, setResults] = React.useState<{ [key: string]: any }>({});
    const [loading, setLoading] = React.useState(false);

    const endpoints = [
        { name: 'Utilisateurs', url: '/api/utilisateurs' },
        { name: 'Auth Me', url: '/api/auth/me' },
    ];

    const testApiAccess = async () => {
        setLoading(true);
        const newResults: { [key: string]: any } = {};

        for (const endpoint of endpoints) {
            try {
                const startTime = performance.now();
                const response = await fetch(endpoint.url);
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);

                try {
                    const data = await response.json();
                    newResults[endpoint.name] = {
                        status: response.status,
                        ok: response.ok,
                        responseTime,
                        data: data,
                    };
                } catch (e) {
                    newResults[endpoint.name] = {
                        status: response.status,
                        ok: response.ok,
                        responseTime,
                        error: 'Impossible de parser la réponse JSON',
                        text: await response.text()
                    };
                }
            } catch (err) {
                newResults[endpoint.name] = {
                    error: err instanceof Error ? err.message : String(err),
                };
            }
        }

        setResults(newResults);
        setLoading(false);
    };

    return (
        <div className="border p-4 rounded-lg bg-gray-50">
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={testApiAccess}
                disabled={loading}
            >
                {loading ? 'Test en cours...' : 'Tester les endpoints API'}
            </button>

            {Object.keys(results).length > 0 && (
                <div className="mt-4">
                    {endpoints.map(endpoint => (
                        <div key={endpoint.name} className="mt-3 border-t pt-3">
                            <h3 className="font-semibold">{endpoint.name} ({endpoint.url}):</h3>
                            <div className="p-3 bg-white border rounded mt-2 overflow-auto max-h-60">
                                {results[endpoint.name]?.error ? (
                                    <div className="text-red-600">
                                        Error: {results[endpoint.name]?.error}
                                        {results[endpoint.name]?.text && (
                                            <pre className="text-xs mt-2 overflow-auto">{results[endpoint.name]?.text}</pre>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p>
                                            Status: <span className={results[endpoint.name]?.ok ? 'text-green-600' : 'text-red-600'}>
                                                {results[endpoint.name]?.status}
                                            </span>
                                        </p>
                                        <p>Temps de réponse: {results[endpoint.name]?.responseTime}ms</p>
                                        <p className="mt-2 font-semibold">Données:</p>
                                        <pre className="text-xs mt-1 overflow-auto">
                                            {JSON.stringify(results[endpoint.name]?.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 