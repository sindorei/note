# 灵活的背景定位

## 难题


## background-position的扩展语法方案
- 允许指定背景图片距离任意角的偏移量，只要在便宜量前面指定关键字

```CSS
background:url(code-priate.svg) no-repeat #58a;
background-positon:right 20px bottom 10px;
```
- 回退方案：将老套的bottom right定位值写进background的简写属性中

```CSS
background:url(code-priate.svg) no-repeat bottom right #58a;
background-positon:right 20px bottom 10px;
```

## background-origin 方案
- 给背景图片设置距离某个角的偏移量，如果偏移量与容器的内边距一致，采用background-position扩展语法代码看起来如下：

```CSS
padding: 10px;
background: url(code-pirate.svg) no-repeat #58a;
background-postion: right 10px bottom 10px;
```
- 虽然起作用了但是代码不够DRY，每次改动内边距的值时，需要再三个地方更新这个值
- 默认情况background-postion以padding box为准，这样边框不会遮住背景图片
- background-origin可以改变这种行为

```CSS
padding: 10px;
background:url("code-pirate.svg") no-repeat # 58a bottom right;
background-origin: content-box;
```
