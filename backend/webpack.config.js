/* eslint-disable */
const path = require('path');
const slsw = require('serverless-webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

console.log(slsw.lib.entries);
const devMode = ['local', 'dev', 'graphql'].includes(slsw.lib.options.stage);

const dest = path.join(__dirname, '.webpack');
const webpack = require('webpack');

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: slsw.lib.entries,
  devtool: devMode ? 'eval-source-map' : 'hidden-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  output: {
    libraryTarget: 'commonjs',
    path: dest,
    filename: '[name].js',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/\.local\.ts$/, /\.test\.ts/],
        use: {
          loader: 'babel-loader',
          options: {
            configFile: './babel.config.json',
          },
        },
      },
      {
        test: /\.csv$/,
        loader: 'csv-loader',
        options: {
          dynamicTyping: true,
          header: true,
          skipEmptyLines: true,
        },
      },
      { test: /\.xml$/, loader: 'xml-loader' },
    ],
  },

  externals: [{ 'aws-sdk': 'commonjs aws-sdk', '@aws-sdk': '@aws-sdk' }],

  plugins: [
    // force unused dialects to resolve to the only one we use
    // and for whom we have the dependencies installed
    new webpack.ContextReplacementPlugin(/knex\/lib\/dialects/, /mssql\/index.js/),
    // pg optionally tries to require pg-native
    // replace it by a noop (real module from npm)
    new webpack.NormalModuleReplacementPlugin(/pg-native/, 'noop2'),

    // uncomment to help with bundle analysis
    // new BundleAnalyzerPlugin({ analyzerMode: 'static', generateStatsFile: true, openAnalyzer: false }),
  ],
};