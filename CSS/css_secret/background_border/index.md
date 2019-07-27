# 半透明边框
> 背景知识：RGBA/HSLA 颜色

## 难题
- 给一个容器设置一个白色背景和半透明的白色边框，body设置为非白色的背景
```CSS
body {
    background: dodgerblue;
}
div {
    width: 100px;
    height: 100px;
    margin: 100px;
    border: 10px solid hsla(0, 0%, 100%, .5);
    background: white;
}
```
- 结果并没有透过半透明的边框看到body的背景色

![](images/translucent-borders-1.jpg)

## 解决方案
- css2.1 中 背景会延伸到边框所在区域下层
- 从背景与边框第三版开始，可以通过`background-clip`属性来调整，初始值是`border-box`，设置为`padding-box`可以解决上述问题
```CSS
body {
    background: dodgerblue;
}
div {
    width: 100px;
    height: 100px;
    margin: 100px;
    border: 10px solid hsla(0, 0%, 100%, .5);
    background: white;
    background-clip: padding-box;
}
```
![](images/translucent-borders-2.jpg)

# 多重边框
> 背景知识：box-shadow的基本用法

## 难题
- 目前还不能像使用多重背景那样使用多重边框


## box-shadow方案
- 设置两个为零的偏移量以及为零的模糊值，设置第四个参数扩张半径，得到像一道实线的边框
- 支持逗号分隔语法，既可以创建任意数量的投影
- 需要注意box-shadow是层层叠加，第一层投影位于最顶层，依次类推
```
div {
    margin: 100px;
    width: 100px;
    height: 100px;
    background: yellowgreen;
    box-shadow: 0 0 0 10px #655;
}
```
![](images/multiple-borders-1.jpg)
```
div {
    margin: 100px;
    width: 100px;
    height: 100px;
    background: yellowgreen;
    box-shadow: 0 0 0 10px #655, 0 0 0 15px deeppink;
}
```
![](images/multiple-borders-2.jpg)
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


# 条纹背景
> 背景知识：CSS线性渐变、background-size

## 难题
- 一般都是用图片


## 解决方案
- 使用线性渐变，将两个色标重合
- 如果多个色标具有相同的位置，他们会产生一个无限小的过渡区域，过渡的起止色分别是第一个和最后一个指定值。从效果上看，颜色会从那个位置突然变化，而不是一个平滑的渐变过程
- 避免每次改动条纹宽度时都要修改两个数字，可以从规范里找到捷径
  * 如果某个色标的位置值比整个列表中在它之前的色标的位置都要小，则该色标的位置值会被设置为它前面所有色标位置值的最大值

## 垂直条纹
- 调整渐变方向

```
background: linear-gradient(to right, #fb3 50%, #58a 0);
background-size: 30px 100%;
```

## 斜向条纹
- 增加一些颜色，旋转，实现无缝对接
- 条纹的宽度可以根据勾股定理计算然后设置`background-size`的值

## 更好的斜向条纹
- 循环式加强版：`repeating-linear-gradient()`和`repeating-radial-gradient()`
- 色标是无限循环重复的，直到填满整个背景

```
background: repeating-linear-gradient(45deg, #fb3, #fb3 15px, #58a 0, #58a 30px);
```

- 创建双色条纹时都需要用到四个色标
- 最好用前面的方法实现水平或垂直的条纹
- 用这种方法来实现斜向条纹
- 45°条纹可以用两种方法结合，通过重复线性渐变来简化贴片的代码

```
background: repeating-linear-gradient(45deg, #fb3 0, #fb3 25%, #58a 0, #58a 50%);
background-size: 42.426406871px, 42.426406871px;
```

## 灵活的同色系条纹
- 大多数情况下想要的条纹图案并不是由差异极大的几种颜色组成的，这些颜色往往属于同一色系，只是在明度方面有着轻微的差异，如下

```
background: repeating-linear-gradient(30deg, #79b, #79b 15px, #58a 0, #58a 30px);
```

- 

