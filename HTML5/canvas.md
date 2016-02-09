#canvas 标签
默认宽300px 高 150px
#绘制环境
getContext('2d')
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
