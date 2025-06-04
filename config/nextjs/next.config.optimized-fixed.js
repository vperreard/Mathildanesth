const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // Experimental features for optimization
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
            '@emotion/styled'
        ],
    },

    // External packages for server (moved from experimental)
    serverExternalPackages: ['bcrypt', '@prisma/client', 'argon2'],

    // Webpack configuration with aggressive optimizations
    webpack: (config, { isServer, webpack, dev }) => {
        if (!isServer) {
            // Client-side fallbacks
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                path: false,
                os: false,
                stream: false,
                child_process: false,
            };

            // Aggressive code splitting
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
                    // Common vendor chunks
                    vendor: {
                        chunks: 'all',
                        name: 'vendor',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 20,
                        enforce: true,
                    },
                    // UI components
                    ui: {
                        name: 'ui',
                        chunks: 'all',
                        test: /[\\/]src[\\/]components[\\/]/,
                        priority: 10,
                    },
                    // Common chunks
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 5,
                        reuseExistingChunk: true,
                    },
                },
                maxInitialRequests: 25,
                maxAsyncRequests: 25,
                minSize: 20000,
                maxSize: 244000, // ~250KB chunks max
            };
        }

        // Tree shaking improvements
        config.optimization.usedExports = true;
        config.optimization.providedExports = true;
        config.optimization.sideEffects = false;

        // Ignore problematic modules
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(bcrypt|argon2)$/,
                contextRegExp: /./,
            })
        );

        // Dynamic imports optimization
        config.plugins.push(
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 50, // Limit total chunks
            })
        );

        return config;
    },

    // Compiler options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Build options
    compress: true,
    poweredByHeader: false,
    generateEtags: false,

    // CORS configuration
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    // Performance headers
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/((?!api/).*)',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
                ],
            },
        ];
    },

    // Redirects for performance
    async redirects() {
        return [
            // Legacy route redirects
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
        ];
    },

    // Build-time optimizations
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: process.env.NODE_ENV === 'development',
    },
};

module.exports = withBundleAnalyzer(nextConfig);