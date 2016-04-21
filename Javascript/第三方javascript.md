### 第三方开发的挑战
- 未知的上下文
- 共享环境
- 浏览器限制

### 使用async和defer无阻塞加载脚本
- defer 脚本属性
    - HTML4
    - 告知浏览器该脚本不会产生任何文档内容（使用`document.write`）
    - 浏览器可以安全的下载脚本文件且不阻塞页面的加载
    - 页面加载后，按顺序执行延迟加载的脚本
- async 脚本属性
    - HTML5
    - 表明被下载的脚本不会调用`document.write`语句
    - 处理页面时，同时下载该脚本
    - 一旦下载完毕就会被执行
- 动态脚本插入
    - 可通过动态创建script元素并插入到DOM中来实现async属性的行为
        - 浏览器在此情况下不会按照javascript加载的顺序执行，执行顺序不固定，所以浏览器会并行下载

   ```javascript
   (function(){
       var script = document.createElement('script');
       script.src = 'http://test.com/test.js';
       script.async = true; // 为了在Opera和Firefox的旧版中，脚本下载完毕后能尽快执行。否则，按顺序执行类似defer属性
       var entry = document.getElementsByTagName('script')[0];
       entry.parentNode.insertBefore(script,entry);
   })();
   ```
