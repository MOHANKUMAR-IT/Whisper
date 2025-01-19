const path = require('path');

module.exports = {
    entry: './web/static/ts/app.ts', // Your entry TypeScript file
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'web/static/js'),
        library: 'ChatApp',  // Expose `ChatApp` globally
        libraryTarget: 'window', // Expose it as a property on the `window` object
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    mode: 'development',

    externals: {
        'core-js': 'core-js',
    },
};
