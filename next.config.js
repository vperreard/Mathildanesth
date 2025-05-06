/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuration expérimentale pour désactiver explicitement Babel si nécessaire (à tester)
    // experimental: {
    //     forceSwcTransforms: true,
    // },

    webpack: (config, { isServer, webpack }) => {
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

        // Correction pour Critical dependency: the request of a dependency is an expression
        // Voir: https://github.com/websockets/ws/issues/1126#issuecomment-1484359981
        // Étendre pour inclure node-pre-gyp si nécessaire, mais les fallbacks devraient suffire
        // config.plugins.push(
        //     new webpack.ContextReplacementPlugin(/node_modules\/express\/lib|node_modules\/\@mapbox\/node-pre-gyp\/lib|node_modules\/sequelize\/lib/)
        // );

        return config;
    },
};

module.exports = nextConfig; 