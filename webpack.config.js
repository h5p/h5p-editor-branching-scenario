var path = require('path');
var webpack = require('webpack');

var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');

var config = {
  mode: nodeEnv,
  context: path.resolve(__dirname, 'src'),
  entry: {
    dist: './entries/app.js'
  },
  devtool: isDev ? 'inline-source-map' : undefined,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        use: 'babel-loader',
      },
      {
        test:/\.(s*)css$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          'style-loader',
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/,
        include: path.resolve(__dirname, 'src'),
        type: 'asset/resource',
      }
    ]
  }
};

module.exports = config;
