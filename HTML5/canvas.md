#canvas 标签
- 默认宽300px 高 150px
- 直接设置属性实际是同时修改了元素本身的大小与元素绘图表面的大小
- 设置css修改的是元素本身的大小，而不会影响绘图表面
- 浏览器会自动缩放canvas（元素大小与canvas绘图表面大小不相符合时）

## canvas 元素的属性
- width
    *  canvas元素绘图表面的宽度
        * 默认浏览器会将canvas元素的大小设定成与绘图表面大小一致。如果在css中定义了元素大小，浏览器则会将绘图表面进行缩放，使之符合元素尺寸
        * 取值： 有效范围内的任意非负整数。数值开头可以添加“+”与空格，但是按照规则，不能给数值加px
        * 默认值： 300
- height
    * canvas元素绘图表面的高度。
    * 默认值： 150

## canvas 元素的方法
- getContext()
- toDataURL(type,quality)
- toBlob(callback,tyupe,args)
#绘制环境
getContext('2d')

CanvasRenderingContext2D

    - canvas
        * 指向该绘图环境所属的canvas对象
        * 获取canvas的宽度和高度  canvas.width cnavas.height
    - fillStyle
        * 指定该绘图环境在后续的图形填充操作中所使用的颜色、渐变色或图案
    - font
        * 设定在调用绘图环境对象的fillText() 或 strokeText()方法时，所使用的字体
    - globalAlpha
        * 全局透明 0 ~ 1
    - globalCompsiteOperation
    - lineCap
        * 线段的端点
            * butt 默认
            * round
            * square
    - lineWidth
        * 线段的宽度
            * 默认 1
    - lineJoin
        * 两条线段相交时如何绘制焦点
            * bevel
            * round
            * miter 默认值
    - miterLimit
    - shadowBlur
    - shadowColor
    - shadowOffsetX
    - shadowOffsetY
    - strokeStyle
    - textAlign
    - textBaseline

# canvas状态的保存与恢复

- save()
    * 将当前canvas的状态推送到一个保存canvas状态的堆栈顶部。canvas状态包括了当前的坐标变换信息、剪辑区域以及所有canvas绘图环境对象的属性。不包括当前的路径或位图。只能通过调用beginPath()来重置路径。至于位图，它是canvas本身的一个属性，并不属于绘图环境对象。尽管位图是canvas对象本身的属性，也可以通过绘图环境对象来访问它（getImageData()方法）

- restore()
    * 将canvas状态堆栈顶部的条目弹出。


#绘制方框
* fillRect(L,T,W,H)

默认黑色矩形。
* strokeRect()

默认1px黑色边框
会显示出2px的边框

#设置绘图
* fillStyle 填充颜色
* lineWidth 线宽度，是一个数值
* strokeStyle 边线颜色

顺序不同，效果会不同

# 边界的绘制
* lineJoin 边界连接点样式
  * miter 默认
  * round 圆角
  * bevel 斜角
* lineCap 端点样式  一条直线的2个端点
  * butt 默认
  * round 圆角
  * square 直线长度多出为宽一半的值

# 绘制路径
* beginPath 开始绘制路径
* closePath 结束绘制路径
* moveTo 移动到绘制的新目标点
* lineTo 新的目标点
* rect 绘制矩形路径
* stroke 绘制线
* clearRect 删除一个画布的矩形区域
* save 保存路径
* restore 恢复路径

beginPath moveTo lineTo closePath stroke/fill

# 绘制圆
* arc(x,y,半径,起始弧度,结束弧度,旋转方向)
 * x,y：起始位置
 * 弧度与角度关系 弧度 = 角度 * Math.PI/180
 * 旋转方向： 顺时针（默认 false） 逆时针 true

# drawImage()
- 参数：
  * 1.图片对象 2.目标位置起始点x轴坐标 3.目标位置起始点y轴坐标
  * 1.图片对象 2.目标位置起始点x轴坐标 3.目标位置起始点y轴坐标 4.绘制图像的宽度 5.绘制图像的高度
  * drawImage(image , sx , sy , sw , sh , dx , dy , dw , dh)
