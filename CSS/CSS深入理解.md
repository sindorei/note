# overflow
- visible 默认
- hidden
- scroll
- auto
- inherit

# overflow-x (ie8+)
- overflow-x:hidden
# overflow-y
- overflow-y:hidden

overflow-x 与 overflow-y 值相等 ， 则等同于overflow

如果overflow-x与overflow-y值不等：

- 一个值为hidden，另一个为visible，则为visible的就被重置为auto

# 兼容性
- 不同浏览器的滚动条样式不同
- 宽度设定机制
  - ie7 宽度100%，会把滚动条宽度算进去
  
# 起作用的前提条件
- 非 display:inline
- 对应方位的尺寸限制
  * width
  * height
  * max-width
  * max-height
  * absolute 拉伸
- 对于td等，需要设置table的`table-layout:fixed`

# overflow:visible妙用
- IE7浏览器，文字越多，两侧padding留白越大的bug 

# 滚动条出现的条件
- overflow:auto 或scroll

# html与滚动条
- 浏览器滚动条来自于html，不是body

# overflow的padding-bottom的缺失现象
- 导致不一样的scrollHeight

# 滚动条的宽度机制
- 滚动条会占用浏览器的宽度

# 水平居中跳动问题
- html { overflow-y: scroll; }
- `padding-left: calc(100vw-100%)` 浏览器宽度减去可用内容宽度  ie9+浏览器支持

# 自定义滚动条(webkit)
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

# IOS原生滚动回调效果

- `-webkit-overflow-scrolling:touch`
