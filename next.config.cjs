/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 7, // 7 jours
    },
    experimental: {
        optimizeCss: true,
    },
    async headers() {
        return [
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    }
                ],
            },
            {
                source: '/sprites.svg',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    }
                ],
            },
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    }
                ],
            },
            {
                source: '/documentation/:path*',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/markdown; charset=UTF-8'
                    }
                ]
            },
            {
                source: '/api/docs/:path*',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/markdown; charset=UTF-8'
                    }
                ]
            }
        ]
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    async rewrites() {
        return [
            {
                source: '/documentation/:path*',
                destination: '/api/documentation/:path*'
            },
            {
                source: '/docs/:path*',
                destination: '/api/docs/:path*'
            }
        ]
    },
    webpack(config) {
        return config;
    }
}

module.exports = nextConfig 