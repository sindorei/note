# curl
- ctx上的curl最终调用的是 `HttpClient` (egg/lib/core/httpclient.js) 上的 `request` 方法
- `HttpClient` 继承的是 `urllib.HttpClient2`, `agent` 传了 [agentkeepalive](https://github.com/node-modules/agentkeepalive) ，非nodejs 内置 `http` 模块的 `Agent`