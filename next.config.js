const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: false,

    // Configuration expérimentale
    experimental: {
        forceSwcTransforms: true,
        optimizeCss: true,
        optimisticClientCache: true,
        typedRoutes: true,
        serverComponentsExternalPackages: ['@prisma/client'],
    },

    // Configuration des packages externes côté serveur
    serverExternalPackages: ['bcrypt', '@prisma/client'],

    poweredByHeader: false,

    // Configuration du compilateur
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
        styledComponents: true,
    },

    // Optimisations Webpack simplifiées
    webpack: (config, { isServer, webpack, dev }) => {
        // Résolution des modules côté client
        if (!isServer) {
            config.resolve.fallback = {
                ...(config.resolve.fallback || {}),
                fs: false,
                path: false,
                child_process: false,
                net: false,
                tls: false,
                "aws-sdk": false,
                "mock-aws-s3": false,
                nock: false,
            };
        }

        // Ignorer les imports HTML depuis node_modules
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /\.html$/,
                contextRegExp: /node_modules/,
            })
        );

        // Optimisations pour la production uniquement
        if (!dev) {
            config.optimization.moduleIds = 'deterministic';

            // Cache simplifié
            config.cache = {
                type: 'filesystem',
                cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
            };

            // Optimisation runtime
            config.optimization.runtimeChunk = {
                name: 'runtime',
            };
        }

        // Configuration personnalisée webpack pour les performances
        if (!dev && !isServer) {
            // Optimisations pour la production
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                        },
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                        },
                        // Bundle spécifique pour les modules leaves
                        leaves: {
                            test: /[\\/]src[\\/]modules[\\/]leaves[\\/]/,
                            name: 'leaves',
                            chunks: 'all',
                        },
                        // Bundle pour l'authentification
                        auth: {
                            test: /[\\/]src[\\/](lib[\\/]auth|components[\\/]auth)[\\/]/,
                            name: 'auth',
                            chunks: 'all',
                        },
                    },
                },
            };
        }

        // Analyse des performances webpack
        if (process.env.WEBPACK_ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: `${isServer ? '../' : ''}bundle-analysis-${isServer ? 'server' : 'client'}.html`,
                    openAnalyzer: false,
                })
            );
        }

        return config;
    },

    // Configuration d'images optimisées
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        domains: ['localhost'],
    },

    // Headers de performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    // Cache statique pour les assets
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Redirections optimisées
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/auth/login',
                permanent: true,
            },
        ];
    },

    eslint: {
        // Permettre le build même avec des erreurs ESLint (temporaire)
        ignoreDuringBuilds: true,
    },

    typescript: {
        // Permettre le build même avec des erreurs TypeScript (temporaire)
        ignoreBuildErrors: true,
    },

};

module.exports = withBundleAnalyzer(nextConfig); 