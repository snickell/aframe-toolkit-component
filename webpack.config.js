var WebpackNotifierPlugin = require('webpack-notifier');
var webpack = require('webpack');
const path = require("path");


module.exports = {
    entry: {
        "dreemgl": "./dreemgl.js"        
    },
    output: {
        path: path.resolve(__dirname, ""),
        filename: "dist/[name].js"
    },
    devtool: "eval",
    module: {
      loaders: [
        {
          test: /.js?$/,
          loader: 'babel-loader',     
          exclude: [/node_modules/, "/lib"],
          query: {
            presets: ['env'],
            plugins: [require('babel-plugin-transform-object-rest-spread')]            
          }
        },
        {
          test: /\.html$/,
          loader: "raw-loader"
        }     
      ]
    },
    plugins: [     
      new WebpackNotifierPlugin({
        contentImage: path.join(__dirname, 'icons/vr-48.png'),
        alwaysNotify: true
      }),
    ],
    resolve: {
      modules: [
        path.resolve('./classes'),
        path.resolve('./'),        
        path.resolve('./node_modules')
      ]
    },    
};
