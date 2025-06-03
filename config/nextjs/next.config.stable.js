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

    // External packages for server
    serverExternalPackages: ['bcrypt', '@prisma/client', 'argon2'],

    // Simplified webpack configuration
    webpack: (config, { isServer, webpack }) => {
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
        }

        // Ignore problematic modules
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(bcrypt|argon2)$/,
                contextRegExp: /./,
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

    // CORS configuration - Simplified headers
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
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
            // Remove CSS/JS specific headers to let Next.js handle them
            {
                source: '/icons/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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