const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

function MyExampleWebpackPlugin() {

};

// 在它的 prototype 上定义一个 `apply` 方法。
MyExampleWebpackPlugin.prototype.apply = function(compiler) {
  // 指定挂载的webpack事件钩子。
  compiler.plugin('emit', function(compilation, callback) {
    console.log("This is an example plugin!!!");
    for(var filename in compilation.assets) {
      if(filename === 'main.html') {
        console.log(compilation.assets[filename].source())
      }
    }
    callback()
  });
};

module.exports = {
  entry: {
    app: './src/app.js',
    vendor: ['angular', '@uirouter/angularjs']
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].[hash].js'
  },
  module: {
    loaders: [
      { test: /\.html$/, loader: "html-loader" }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.template.html',
      inject: true,
      filename: 'index.html',
      minify: {
        removeComments: true
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor']
    })
  ]
};