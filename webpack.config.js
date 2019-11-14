/* eslint-disable no-var */
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var buildPath = path.resolve(__dirname, 'dist');
var srcPath = path.resolve(__dirname, 'src');
var scssPath = path.resolve(srcPath);
var autoprefixer = require('autoprefixer');
var nodeModulePath = path.resolve(__dirname, 'node_modules');
var IS_PRODUCTION = process.env.NODE_ENV === 'production';
var GIT_VERSION = childProcess.execSync('git rev-parse HEAD').toString().trim();

// From Babel v7, when compiling modules in node_modules, it will not automatically using
// the configs from .babelrc from your project root
// https://babeljs.io/docs/en/config-files#6x-vs-7x-babelrc-loading
var babelConfig = JSON.parse(fs.readFileSync(path.resolve('./.babelrc')));

babelConfig.cacheDirectory = true;
// Webpack will handle the es module part
// so we can ask the babel to dont worry about it
// modules: auto is required in .babelrc for Jest preset "ts-jest/presets/js-with-babel"
babelConfig.presets[0][1].modules = false;

var webpackConfig = {
  mode: 'development',
  entry: {
    index: path.join(srcPath, 'index.tsx'),
  },
  output: {
    path: buildPath,
    filename: process.env.NODE_ENV === 'production' ? '[name].[chunkhash].js' : '[name].js',
    globalObject: 'this',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [
          /src/,
        ],
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
          },
          {
            loader: 'awesome-typescript-loader',
          },
        ],
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-loader',
      },
      {
        test: /\.jsx?$/,
        include: [
          /src/,
        ],
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { minimize: IS_PRODUCTION } },
          { loader: 'postcss-loader', options: { plugins: () => [autoprefixer] } },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              camelCase: true,
              localIdentName: '[local]-[hash:5]',
            },
          },
          { loader: 'postcss-loader', options: { plugins: () => [autoprefixer] } },
          {
            loader: 'sass-loader',
            options: {
              includePaths: [scssPath, nodeModulePath],
            },
          },
        ],
      },
      {
        test: /\.less/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { minimize: IS_PRODUCTION } },
          { loader: 'postcss-loader', options: { plugins: () => [autoprefixer] } },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
              paths: [
                srcPath,
                nodeModulePath,
              ],
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|woff|svg|eot|ttf|woff2)$/,
        use: [
          { loader: 'file-loader?name=[name]-[hash:8].[ext]' },
        ],
      },
    ],
  },
  plugins: [
    // use html-webpack-plugin to create index.html
    new HtmlWebpackPlugin({
      inject: 'head',
      template: 'src/index.ejs',
      filename: 'index.html',
      chunks: ['index'],
      chunksSortMode: 'auto',
      environment: process.env.NODE_ENV,
    }),
  ],
  resolve: {
    extensions: [
      '.jsx',
      '.ts',
      '.tsx',
      '.js',
      '.json',
      '.png',
      '.jpeg',
      '.scss',
      '.css',
    ],
    unsafeCache: !IS_PRODUCTION,
    symlinks: false, // https://github.com/webpack/webpack/issues/1866
    modules: [
      'node_modules',
      srcPath,
    ],
    alias: {},
  },
  devServer: {
    disableHostCheck: true,
  },
};

if (IS_PRODUCTION) {
  webpackConfig.mode = 'production';
  webpackConfig.devtool = 'source-map';
  webpackConfig.plugins = webpackConfig.plugins.concat([
    // define variable available in code
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
  ]);
} else {
  webpackConfig.devtool = 'eval';
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env.BUILD_VERSION': JSON.stringify(GIT_VERSION),
    }),
  ]);
}

module.exports = webpackConfig;
