const webpack = require('webpack')
const express = require('express')
const app = express()


var webpackConfig = require('./webpack.config')

var compiler = webpack(webpackConfig)

app.use(require("webpack-dev-middleware")(compiler, {
  noInfo: false,
  publicPath: webpackConfig.output.publicPath
}));

app.use(require("webpack-hot-middleware")(compiler));

app.listen(8099, () => {
  console.log('start...')
})