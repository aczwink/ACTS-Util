const webpack = require("webpack");
const fs = require("fs");

module.exports = {
    mode: "development",

    entry: "./src/main.ts",
    output: {
        path: __dirname + "/dist",
        filename: "acts-util-core.js",
        libraryTarget: 'window',
    },
    devtool: 'inline-source-map', // Enable sourcemaps for debugging webpack's output.

    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    
    externals: {
    },

    plugins: [
        new webpack.BannerPlugin(fs.readFileSync('./LICENSE_HEADER', 'utf8')),
    ]
};