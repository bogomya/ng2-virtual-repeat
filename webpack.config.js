const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const config = {
  entry: {
    'index': './src/index'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js'
  },
  externals: [nodeExternals()],
  resolve: {
    modules: ['./src', 'node_modules'],
    extensions: ['.ts', '.es6', '.js', '.json']
  },
  module: {
    rules: [
      {test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader'},
      // Add CSS as style tag to index.html
      {test: /\.scss$/, loaders: ['to-string', 'css', 'sass?sourceMap'], exclude: /\/node_modules\//}
    ]
  }
};

module.exports = config;