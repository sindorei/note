# 升级webpack5
## 参考
- [升级指南](https://webpack.docschina.org/migrate/5/#upgrade-webpack-and-its-dependencies)
- [记录将项目中webpack4升级至webpack5一次成功尝试](https://www.mybj123.com/11258.html)


## 常见调整
- npm-check-updates 升级相关依赖
  * 注意类似 @babel/core 7 之前包名不同
     * 如： babel-eslint 更换为 @babel/eslint-parser
  * 还有类似vue-loader 最新版本是vue3的, vue2的是15.x；
- node运行时添加`--trace-deprecation` 追踪废弃告警的栈堆信息，移除废弃的功能
  * `node --trace-deprecation node_modules/webpack/bin/webpack.js` 或通过 `NODE_OPTIONS=--trace-deprecation`添加
- `devtool`配置的值调整，没有了`#`
  * `#cheap-module-source-map` -> `cheap-module-source-map`
- `mini-css-extract-plugin`(vue ssr 使用会报错ReferenceError: document is not defined)或`extract-text-webpack-plugin` 插件升级
  * 如下示例，可配置mini-css-extract-plugin抽离成一个文件

```javascript
{
    cacheGroups: {
        styles: {
            name: "styles",
            type: "css/mini-extract",
            chunks: "all",
            enforce: true,
        },
    }
}
```
- 一些loader的配置写法调整，多个loader放use中
- optimization的一些配置调整，splitChunks的一些调整
- vue ssr
  * clientCompiler.hooks.done 钩子变化
  * webpack-dev-middleware 的文件系统 devMiddleware.context.outputFileSystem
  
- less 的unit 里面计算时再加括号
  * `@weuiCellLineHeight: unit(((@weuiCellHeight - 2 * @weuiCellGapV) / @weuiCellFontSize));`

- `terser-webpack-plugin` 代替  `uglifyjs-webpack-plugin`

- 如果是webpack 3 升到5 ，需安装 `webpack-cli` 参数还略有不同
- url-loader 、 css-loader 配置 `esModule: false`
- raw-loader、url-loader、file-loader 可替换为 [asset module](https://webpack.docschina.org/guides/asset-modules/)