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
        // Optimiser plus de packages
        optimizePackageImports: [
            '@radix-ui/react-*',
            'lucide-react',
            'date-fns',
            '@tanstack/react-query',
            'react-hook-form',
            'zod',
            'framer-motion',
            'recharts',
            '@fullcalendar/*',
            'react-hot-toast'
        ],
    },

    // Configuration des packages externes côté serveur
    serverExternalPackages: ['bcrypt', '@prisma/client', 'ioredis', 'redis-errors', 'argon2'],

    poweredByHeader: false,

    // Compression Gzip/Brotli
    compress: true,

    // Configuration du compilateur
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
        styledComponents: true,
    },

    // Configuration du module splitting
    modularizeImports: {
        '@mui/material': {
            transform: '@mui/material/{{member}}',
        },
        '@mui/icons-material': {
            transform: '@mui/icons-material/{{member}}',
        },
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{member}}',
        },
        'date-fns': {
            transform: 'date-fns/{{member}}',
        },
        lodash: {
            transform: 'lodash/{{member}}',
        },
    },

    // Optimisations Webpack avancées
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
                dns: false,
                "aws-sdk": false,
                "mock-aws-s3": false,
                nock: false,
                crypto: false,
                stream: false,
                os: false,
                util: false,
            };
            
            // Exclure les modules serveur du bundle client
            config.externals = [
                ...(config.externals || []),
                'bcrypt',
                'bcryptjs',
                '@mapbox/node-pre-gyp',
                'node-gyp',
                'npm',
                'argon2'
            ];
        }

        // Ignorer les imports HTML depuis node_modules
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /\.html$/,
                contextRegExp: /node_modules/,
            })
        );

        // Optimisations pour la production
        if (!dev) {
            config.optimization.moduleIds = 'deterministic';

            // Cache filesystem
            config.cache = {
                type: 'filesystem',
                cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
                buildDependencies: {
                    config: [__filename],
                },
            };

            // Optimisation runtime
            config.optimization.runtimeChunk = {
                name: 'runtime',
            };

            // Configuration du tree shaking
            config.optimization.usedExports = true;
            config.optimization.sideEffects = false;
        }

        // Configuration personnalisée webpack pour les performances
        if (!dev && !isServer) {
            // Split chunks agressif
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    minSize: 20000,
                    cacheGroups: {
                        // Framework core
                        framework: {
                            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
                            name: 'framework',
                            priority: 40,
                            chunks: 'all',
                        },
                        // Bibliothèques lourdes
                        lib: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                                // Split des gros packages en chunks séparés
                                if (['@fullcalendar', 'recharts', 'd3', 'framer-motion'].includes(packageName)) {
                                    return `npm.${packageName.replace('@', '').replace('/', '-')}`;
                                }
                                return 'vendor';
                            },
                            priority: 30,
                            minChunks: 1,
                        },
                        // Commons
                        commons: {
                            name: 'commons',
                            minChunks: 2,
                            priority: 20,
                        },
                        // Modules métier
                        leaves: {
                            test: /[\\/]src[\\/]modules[\\/]leaves[\\/]/,
                            name: 'leaves',
                            chunks: 'all',
                            priority: 25,
                            reuseExistingChunk: true,
                        },
                        auth: {
                            test: /[\\/]src[\\/](lib[\\/]auth|components[\\/]auth|hooks[\\/]useAuth)[\\/]/,
                            name: 'auth',
                            chunks: 'all',
                            priority: 25,
                            reuseExistingChunk: true,
                        },
                        blocOperatoire: {
                            test: /[\\/]src[\\/]modules[\\/]planning[\\/]bloc-operatoire[\\/]/,
                            name: 'bloc-operatoire',
                            chunks: 'all',
                            priority: 25,
                            reuseExistingChunk: true,
                        },
                        calendar: {
                            test: /[\\/]src[\\/](modules[\\/]calendar|components[\\/].*Calendar)[\\/]/,
                            name: 'calendar',
                            chunks: 'all',
                            priority: 25,
                            reuseExistingChunk: true,
                        },
                        // UI Components
                        ui: {
                            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
                            name: 'ui',
                            chunks: 'all',
                            priority: 20,
                            reuseExistingChunk: true,
                        },
                        // Pages spécifiques
                        admin: {
                            test: /[\\/]src[\\/]app[\\/]admin[\\/]/,
                            name: 'admin',
                            chunks: 'all',
                            priority: 15,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };

            // Minimizer configuration
            config.optimization.minimize = true;
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
                // Assets statiques (immutable)
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Images optimisées
                source: '/_next/image/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // API routes (cache court pour certaines)
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'private, s-maxage=10, stale-while-revalidate=59',
                    },
                ],
            },
            {
                // Pages HTML
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
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=10, stale-while-revalidate=59',
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

    // Output configuration
    output: 'standalone',
    
    // SWC Minify
    swcMinify: true,

    eslint: {
        ignoreDuringBuilds: true,
    },

    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = withBundleAnalyzer(nextConfig);