const webpack = require('webpack')
const merge = require('webpack-merge')
let base = require('./webpack.base.config')
let config = merge(base, {
  entry: {
    app: ['webpack-hot-middleware/client', './src/app.js']
  },
  module: {
    loaders: [
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
})

module.exports = config