const webpack = require('webpack')
const express = require('express')
const app = express()


var webpackConfig = require('./webpack.dev.config')

var compiler = webpack(webpackConfig)

app.use(require("webpack-dev-middleware")(compiler, {
  noInfo: false,
  publicPath: webpackConfig.output.publicPath,
  stats: {
    colors: true,
    chunks: false
  }
}));

app.use(require("webpack-hot-middleware")(compiler, {
  heartbeat: 2000,
  reload: true
}));

app.listen(8099, () => {
  console.log('server started at localhost:8099')
})