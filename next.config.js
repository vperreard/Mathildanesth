/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Configuration expérimentale pour forcer SWC même avec un fichier Babel
    experimental: {
        forceSwcTransforms: true,
        optimizeCss: true, // Optimisation CSS activée
        optimisticClientCache: true, // Mise en cache optimiste côté client
    },

    // Utiliser Turbopack pour la génération (option déplacée hors de experimental)
    turbopack: true,

    poweredByHeader: false, // Supprime l'en-tête X-Powered-By pour la sécurité

    // Configuration du compilateur pour des optimisations supplémentaires
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    webpack: (config, { isServer, webpack, dev }) => {
        // Ignorer les modules Node.js côté client
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

        // Ignorer les imports de fichiers HTML depuis node_modules
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /\.html$/,
                contextRegExp: /node_modules/,
            })
        );

        // Optimisation pour la production uniquement
        if (!dev) {
            // Activer l'optimisation de taille des modules
            config.optimization.moduleIds = 'deterministic';

            // Cache pour le développement
            config.cache = {
                type: 'filesystem',
                buildDependencies: {
                    config: [__filename],
                },
                name: isServer ? 'server' : 'client',
            };

            // Réduction de la taille du bundle
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                chunks: 'all',
                cacheGroups: {
                    ...config.optimization.splitChunks.cacheGroups,
                    // Séparation des gros modules en chunks séparés
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            // Extraction des packages tiers dans des chunks séparés
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )[1];

                            // Regrouper les petits packages React pour éviter trop de chunks
                            if (packageName.includes('react') || packageName.includes('next')) {
                                return 'react-packages';
                            }

                            // Regrouper les packages MUI
                            if (packageName.includes('@mui')) {
                                return 'mui-packages';
                            }

                            // Regrouper les packages d'UI
                            if (packageName.includes('@radix-ui') ||
                                packageName.includes('antd') ||
                                packageName.includes('@headlessui')) {
                                return 'ui-packages';
                            }

                            // npm package names are URL-safe, but some servers don't like @ symbols
                            return `vendor-${packageName.replace('@', 'at-')}`;
                        },
                        priority: 20,
                    },
                    common: {
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                },
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
    },
};

module.exports = nextConfig; 