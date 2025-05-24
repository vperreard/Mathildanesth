/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: false,

    // Configuration expérimentale
    experimental: {
        forceSwcTransforms: true,
        optimizeCss: true,
        optimisticClientCache: true,
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
    },

    // Headers de performance
    async headers() {
        return [
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                ],
            },
            {
                source: '/auth/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
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
};

module.exports = nextConfig; 