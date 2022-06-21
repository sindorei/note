# 主要模块
- @babel/core
  * babel主模块被其他模块peer dependency
- @babel/preset-env
  * 根据指定的环境转换预发
     * 可配置`useBuiltIns`为usage或entry自动引入pollyfill，需自行安装好core-js和regenerator-runtime模块到dependencies
        * entry 需 在入口因UR`core-js/stable` 和 `regenerator-runtime/runtime`
     * useBuiltIns设为usage时需要注意第三方模块的风险
     * 注意core-js@3 才有实例方法如 `[].map`
     * corejs 属性可以指定core-js版本，指定到次版本号
- @babel/plugin-transform-runtime
  * 需安装 @babel/runtime模块到dependencies
- @babel/runtime
  * 含Babel模块化运行时帮助程序和regenerator-runtime库
  * 安装到生产依赖

# 使用搭配
## 方案一 (推荐应用用)
- @babel/core
- @babel/preset-env 设置 useBuiltIns

## 方案二（推荐库用）
- @babel/core
- @babel/preset-env useBuiltIns 为false（默认false）
- @babel/plugin-transform-runtime
  * corejs 属性配置runtime版本，默认false，使用@babel/runtime，[配置参考](https://babeljs.io/docs/en/next/babel-plugin-transform-runtime#corejs)
- @babel/runtime 或 @babel/runtime-corejs2 或 @babel/runtime-corejs3
  * 区别 runtime-corejs3 支持实例方法,e.g. `[].includes`

## 方案三
- @babel/core
- @babel/preset-env useBuiltIns 为false（默认false
- 代码里手动引入core-js@3和regenerator-runtime（代替之前的直接引入@babel/pollyfill）

# 其他
- 注意配置文件查找，如果项目中有子库需设置 `rootMode: 'upward'`,记得改js的babel-loader及vue-loader的

# 配置示例
## 示例1
```javascript
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": "commonjs"
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3.23
      }
    ],
  ]
}
```
## 示例2
```javascript
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "entry",
        "corejs": {
          "version": 3.23,
          "proposals": true
        }
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": false
      }
    ]
  ]
}
// 入口文件内
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

## 示例3
```javascript

{
  "presets": [
    [
      "@babel/preset-env",
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": {
          "version": 3.23,
          "proposals": true
        }
      }
    ]
  ]
}
```
# 参考
- https://babeljs.io/docs/en/next/usage



# 6.x 升级到 7.x
* @babel/core
* @babel/preset-env
* 插件 
  * babel-plugin-transform-vue-jsx -> @vue/babel-plugin-transform-vue-jsx
  * babel-plugin-syntax-jsx  -> @babel/plugin-syntax-jsx
  * babel-helper-vue-jsx-merge-props -> @vue/babel-helper-vue-jsx-merge-props
  