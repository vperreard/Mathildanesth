const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    
    // Experimental features for optimization
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-*'],
    },

    // External packages for server
    serverExternalPackages: ['bcrypt', '@prisma/client', 'argon2'],

    // Webpack configuration
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

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
    },

    // Build options
    swcMinify: true,
    compress: true,
    poweredByHeader: false,

    // Ignore errors during build (temporary)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = withBundleAnalyzer(nextConfig);