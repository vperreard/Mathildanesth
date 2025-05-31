const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // Experimental features optimisées pour Phase 2
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            'lucide-react',
            'date-fns',
            '@radix-ui/react-*',
            '@ant-design/icons',
            '@headlessui/react',
            '@heroicons/react',
            '@emotion/react',
            '@emotion/styled',
            'framer-motion',
            'react-hot-toast'
        ],
        // Optimisations runtime
        serverComponentsExternalPackages: ['bcrypt', '@prisma/client', 'argon2'],
        // Éviter les problèmes Edge Runtime avec les packages Node.js
        typedRoutes: false, // Désactivé pour éviter les conflits
    },

    // External packages pour tous les runtimes
    serverExternalPackages: ['bcrypt', '@prisma/client', 'argon2', 'ioredis'],

    // Webpack configuration optimisée pour les tests et runtime
    webpack: (config, { isServer, webpack, dev, nextRuntime }) => {
        // Optimisations communes
        config.resolve.alias = {
            ...config.resolve.alias,
            // Alias pour éviter les duplications
            '@prisma/client': require.resolve('@prisma/client'),
        };

        if (!isServer) {
            // Configuration client-side
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                path: false,
                os: false,
                stream: false,
                child_process: false,
                // Fallbacks spécifiques pour les tests
                ...(process.env.NODE_ENV === 'test' && {
                    'mock-fs': false,
                    '__tests__': false,
                }),
            };

            // Split chunks optimisé pour la production
            if (!dev) {
                config.optimization.splitChunks = {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Framework bundle (React, Next.js)
                        framework: {
                            chunks: 'all',
                            name: 'framework',
                            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        // UI Libraries
                        ui: {
                            name: 'ui-libs',
                            chunks: 'all',
                            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion|lucide-react)[\\/]/,
                            priority: 35,
                            enforce: true,
                        },
                        // Large libraries
                        lib: {
                            test(module) {
                                return (
                                    module.size() > 160000 &&
                                    /node_modules[/\\]/.test(module.identifier())
                                );
                            },
                            name: 'lib',
                            priority: 30,
                            minChunks: 1,
                            reuseExistingChunk: true,
                        },
                        // Date/Time utilities
                        dateUtils: {
                            name: 'date-utils',
                            chunks: 'all',
                            test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
                            priority: 25,
                            enforce: true,
                        },
                        // Common vendor chunks
                        vendor: {
                            chunks: 'all',
                            name: 'vendor',
                            test: /[\\/]node_modules[\\/]/,
                            priority: 20,
                            enforce: true,
                        },
                        // App components
                        components: {
                            name: 'components',
                            chunks: 'all',
                            test: /[\\/]src[\\/]components[\\/]/,
                            priority: 15,
                            minChunks: 2,
                        },
                        // Common app chunks
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                        },
                    },
                    maxInitialRequests: 25,
                    maxAsyncRequests: 25,
                    minSize: 20000,
                    maxSize: 250000,
                };
            }
        }

        // Tree shaking amélioré (compatible Next.js 15)
        config.optimization.providedExports = true;
        config.optimization.sideEffects = false;

        // Ignorer les modules problématiques pour tous les runtimes
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(bcrypt|argon2)$/,
                contextRegExp: /./,
            })
        );

        // Plugin spécifique pour Edge Runtime
        if (nextRuntime === 'edge') {
            config.plugins.push(
                new webpack.IgnorePlugin({
                    resourceRegExp: /^(ioredis|sequelize|fs|path|os)$/,
                    contextRegExp: /./,
                })
            );
        }

        // Optimisation chunks pour la production
        if (!dev) {
            config.plugins.push(
                new webpack.optimize.LimitChunkCountPlugin({
                    maxChunks: 50,
                })
            );
        }

        // Configuration spéciale pour les tests
        if (process.env.NODE_ENV === 'test') {
            config.externals = [];
            config.resolve.modules = ['node_modules', '<rootDir>/src'];
        }

        return config;
    },

    // Compiler options optimisées
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn']
        } : false,
        // Optimisations SWC
        emotion: true,
        styledComponents: true,
    },

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        // Optimisations loader
        loader: 'default',
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Build options
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    trailingSlash: false,

    // Headers optimisés pour performance et sécurité
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://mathilda.com'
                    },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    // Cache headers pour les APIs
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            {
                source: '/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/((?!api/)(?!static/).*)',
                headers: [
                    // Security headers
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    // Performance headers
                    { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
                ],
            },
        ];
    },

    // Redirects pour les routes legacy
    async redirects() {
        return [
            {
                source: '/trames/:path*',
                destination: '/tableaux-service/:path*',
                permanent: true,
            },
            {
                source: '/affectations/:path*',
                destination: '/gardes-vacations/:path*',
                permanent: true,
            },
            // Redirections admin legacy
            {
                source: '/admin/users',
                destination: '/admin/utilisateurs',
                permanent: true,
            },
        ];
    },

    // Rewrites pour l'API
    async rewrites() {
        return {
            beforeFiles: [
                // Réécriture pour l'API WebSocket
                {
                    source: '/api/ws/:path*',
                    destination: '/api/websocket/:path*',
                },
            ],
            afterFiles: [
                // Fallbacks pour les routes manquantes
                {
                    source: '/admin/:path*',
                    destination: '/admin',
                },
            ],
            fallback: [],
        };
    },

    // Output configuration pour différents déploiements
    output: process.env.BUILD_OUTPUT || 'standalone',

    // Build optimizations
    eslint: {
        ignoreDuringBuilds: process.env.NODE_ENV === 'development',
        dirs: ['src', 'pages', 'components'],
    },

    typescript: {
        ignoreBuildErrors: process.env.NODE_ENV === 'development',
        tsconfigPath: './tsconfig.json',
    },

    // Performance budgets
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },

    // Configuration runtime-specific
    ...(process.env.NODE_ENV === 'test' && {
        // Configuration spéciale pour les tests
        experimental: {
            ...nextConfig.experimental,
            optimizePackageImports: [], // Désactivé en test pour éviter les problèmes
        },
        webpack: undefined, // Utiliser la configuration webpack par défaut en test
    }),
};

module.exports = withBundleAnalyzer(nextConfig); 