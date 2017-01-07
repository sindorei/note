# overflow
- visible 默认
- hidden
- scroll
- auto
- inherit

## overflow-x (ie8+)
- overflow-x:hidden
## overflow-y
- overflow-y:hidden

overflow-x 与 overflow-y 值相等 ， 则等同于overflow

如果overflow-x与overflow-y值不等：

- 一个值为hidden，另一个为visible，则为visible的就被重置为auto

## 兼容性
- 不同浏览器的滚动条样式不同
- 宽度设定机制
  - ie7 宽度100%，会把滚动条宽度算进去

## 起作用的前提条件
- 非 display:inline
- 对应方位的尺寸限制
  * width
  * height
  * max-width
  * max-height
  * absolute 拉伸
- 对于td等，需要设置table的`table-layout:fixed`

## overflow:visible妙用
- IE7浏览器，文字越多，两侧padding留白越大的bug

## 滚动条出现的条件
- overflow:auto 或scroll

## html与滚动条
- 无论什么浏览器默认滚动条来自于html，不是body

## js获取滚动条高度
- chrome `document.body.scrollTop`
- 其他： `document.documentElement.scrollTop`
- 兼容写法：`var scrollTop = document.documentElement.scrollTop || document.body.scrollTop`

##overflow的padding-bottom的缺失现象
- 导致不一样的scrollHeight

## 滚动条的宽度机制
- 滚动条会占用浏览器的宽度

## 水平居中跳动问题
- html { overflow-y: scroll; }
- `padding-left: calc(100vw-100%)` 浏览器宽度减去可用内容宽度  ie9+浏览器支持

## 自定义滚动条(webkit)
- 整体部分
  * ::-webkit-scrollbar
- 两端按钮
  * ::-webkit-scrollbar-button
- 外层轨道 (背景槽)
  * ::-webkit-scrollbar-track
- 内层轨道
  * ::-webkit-scrollbar-track-piece
- 滚动滑块
  * ::-webkit-scrollbar-thumb
- 边角
  * ::-webkit-scrollbar-corner

## IOS原生滚动回调效果

- `-webkit-overflow-scrolling:touch`

## BFC（block formatting context）
- 块级格式化上下文
- 页面之结界，内部元素不会影响到外部

## overflow与BFC
- 除了overflow:visible 不会触发BFC，其他都会

应用：
 - 清楚浮动
   * iE7+ 才有效果
 - 避免margin穿透问题
 - 两栏自适应布局
   * `display:table-cell;width2000px;//iE8+ BFC特性
      *display:inline-block;*width:auto; // iE7- 伪BFC特性
     `

 ## overflow与绝对定位
 - 设置绝对定位后，overflow:hidden的隐藏失效
 - 设置绝对定位后，滚动失效

 绝对定位元素不总是被父级overflow属性裁剪，尤其当overflow在绝对定位元素及包含块之间的时候

 - 包含块指“含position:relative/absolute/fixed声明的父级元素，没有则body元素”

 如何避免？

 - 设置overflow的元素自身为包含块
 - 设置overflow的元素子元素为包含块
 - transform声明当做包含块
   * overflow的元素自身transform
     - IE9+、Firefox  可以
     - chrome、Safari（win）、opera 不行
   * overflow子元素transform
     - IE9+、Firefox  可以
     - chrome、Safari（win）、opera 可以

## 依赖overflow的样式表现

- css3 的resize属性要有效，overflow不能为visible
  * resize 拖拽区域大小 17px*17px 和滚动条宽度一样

## overflow 与 锚点
- 容器可滚动
- 锚点元素在容器内

本质：改变容器的滚动高度

锚点定位的作用：
- 快速定位


# Float

# relative
- relvative 与 absolute
    * 限制作用
        * 限制left/top/right/bottom 定位
        * 限制z-index层级
            * 父元素relative，子元素absolute，子元素的层级受到父元素的影响
        * 限制overflow下的显示
            * overflow为hidden的父元素不能隐藏position为absolute的子元素，除非父元素position为relative
- relavtive 与 fixed
    * 限制z-index层级
- 定位
    * 相对自身
    * 无侵入
        * 不会影响其他元素的布局
    * 同时设置top和bottom left 和 right
        * top 和 left 起效果
- 层级
    * 提高层叠上下文
        * z-index 为auto 不会限制层叠 ie6、7除外
- 最小化影响原则
    * 尽量降低relative属性对其他元素或布局的影响
        * 尽量避免使用relative
        * relative最小化

# border
- 不支持百分比
- 支持关键字：thin 1px medium 3px thick 5px （ie7除外）
- 默认值是 medium 3px

## border-style 类型
- solid 实线
- dashed 虚线
  * chrome/firefox 实的部分宽高3：1，实虚 1：1
  * ie 实的部分宽高2：1，实虚 2：1
- dotted 点线
  * chrome/firefox 点是方的
  * ie 点是圆的，可以利用在ie7，8下实现圆角
- double 双线
  * 双线宽度永远相等，中间间隔±1
- inset 内凹
  * 没啥用
- outset 外凸
  * 没啥用
- groove 沟槽 没啥用
- ridge 山脊 没啥用 各个浏览器效果也不一样

## border-color
- border默认颜色与color一致，类似的还有box-shadow等
  * 可用于 hover与图形变色案例

## background定位的局限
- background-position 默认相对于左上方定位（css2.1时）
- 可配合 border使用 ，右侧指定固定透明边框。因为background-position 默认不算border宽度

## 构建图形
- dotted ie7、8实现圆角
- double 三道杠
- solid 三角 梯形

## border 的transparent
- 三角形
- 优雅增加响应区域大小 - 复选框
- 解决drop-shadow chrome下 元素不显示drop-shadow也不显示的问题

## 布局中的应用
- 有限标签下的标题栏
- 等高布局
