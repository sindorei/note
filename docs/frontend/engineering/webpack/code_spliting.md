# 注意事项
- 如果动态引入的模块没有被分割出去，注意检查`@babel/preset-env`的`modules`配置是否是`auto`（默认）。如果是`commonjs`， `import()`会被`babel`转换掉。默认的`auto` babel会判断哪些需要转换，如`import()`就不转换，由webpack处理成以下形式：

```javascript
 __webpack_require__.e(/* import() */ 51).then(__webpack_require__.bind(__webpack_require__, 21051));
```