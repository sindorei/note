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

## calc() 方案
```CSS
background:url("code-pirate.svg") no-repeat;
background-postion: calc(100% - 20px) calc(100% -10px);
```

> 不要忘记`calc()`函数内部的`-`和`+`运算符的两侧各加一个空白，否则会产生解析错误！这个规则如此怪异，是为了向前兼容：未来，在`calc()`内部可能会允许使用关键字，而这些关键字可能会包含连字符（即减号）


## 相关规范
- [CSS背景与边框](http://w3.org/TR/css-backgrounds)
- [CSS值与单位](http://w3.org/TR/css-values)

# 边框内圆角
> 背景知识：box-shadow、outline、多重边框

## 难题
有时我们需要一个容器，只有内侧有圆角，而边框或描边的四个角在外部仍然保持直角的形状。这种效果一般需要两个元素实现，如何一个元素达到同样的效果

## 解决方案
- 有点hack味道的解决方案 ，依赖于描边不跟着圆角走（未来可能改变）

```CSS
background: tan;
border-raduis: .8em;
padding: 1em;
box-shadow: 0 0 0 .6em #655;
outline: .6em solid #655;
```

- 限制：扩展半径需要比描边的宽度小，又要比(√2-1)r大（r代表border-radius）
- 如果描边宽度比(√2-1)r小，就无法达成效果

## 相关规范
- [CSS背景与边框](http://w3.org/TR/css-backgrounds)
- [CSS基本UI特性](http://w3.org/TR/css3-ui)