# flex-grow 计算

flex容器的剩余可用空间 = flex总可用空间 - 已计算出的flex项目计算后的值之和

flex容器的剩余空间=flex容器的剩余可用空间 - 所有剩余flex项目的flex-basis之和

flex项目的灵活性=(flex容器的剩余空间/剩余flex项目flex-grow值总和) * 当前flex项目的flex-grow

flex项目计算后的值 = flex项目的灵活性 + flex-basis    如果此值小于显示设置的 width 或 min-content 将以 Flex 项目的内容的最小尺寸（min-content ）为准

当 Flex 项目显式设置了 flex:1 和具体的 width 值时，如果浏览器计
算出来的 flex-basis 大于 Flex 项目的最小内容尺寸（min-content） 时，将以 flex-basis
计算出来的值作为 Flex 项目的宽度；反之，如果计算出来的 flex-basis 小于 Flex 项目的最
小内容尺寸（min-content）时，浏览器会把 Flex 项目的最小内容尺寸（min-content）作为
flex-basis 的最终值，也将其作为该 Flex 项目的宽度。

默认情况之下，Flex 项目（即设置了 flex:1 ）在收缩的时候，其宽度也
不会小于其最小内容尺寸（min-content）或固定尺寸元素。如果要改变这一点，需要在 Flex
项目上显示设置最小宽度 min-width (或 min-inline-size)，或最小高度min-height（或
min-block-size）的值，一般将其设置为0 。

但在 Flexbox 布局中，Flex 项目的 flex-basis 值为 auto 时，它的大小由 Flex 项目的最大内
容长度（即 max-content）来决定
但当 flex-basis: auto 碰到 Flex 项目显式设置了长度尺寸，比如 width 或 inline-size
时，此时的 auto 计算出来的值就是对应的 width 或 inline-size 的值

当你在 Flex 项目同时设置了 width （或 inline-size），且
flex-basis 值为 0 （或任何一个非 auto 的值）时，那么 flex-basis 的值都会替代 width
或 inline-size 属性的值

所有 Flex 项目的 flex-grow 总和如果小于 1 ，Flex 容器剩余空间还会
有余留； flex-grow 大于或等于1时，Flex 容器的剩余空间不会有余留

Flex 项目的 flex-grow 总和如果小于等于1时：
flex项目的灵活性 = flex容器的剩余空间 * 当前flex项目的flex-grow

大于1时浏览器将会循环遍历去计算每个 Flex 项目的 弹性量


总结：
只有 Flex 容器有剩余空间，且 flex-grow 值不为 0 时，Flex 项目才会按照扩展因子
（flex-grow 值）比率来分割 Flex 容器的剩余空间。

如果 Flex 容器中所有 Flex 项目的 flex-grow 值的总和小于 1 时，Flex 容器的剩余空间
是分不完的（有留存），只有 flex-grow 值的总和大于或等于 1 时，Flex 容器的剩余空
间才能全部分完。

Flex 容器中的所有 Flex 项目的 flex-grow 值设置为 1 ，并不能平均分配 Flex 容器的剩
余空间，它和 Flex 项目自身的内容最小尺寸以及它的内部固定尺寸的元素有关。

Flex 项目的 flex-grow 会给 Flex 项目的 flex-basis 值带来变化，但它也会受 min-*
（比如 min-width 、 min-inline-size 、min-height 、min-block-size）和 max-*
（比如 max-width 、max-inline-size 、max-height 和 max-block-size ）等属性的
影响。


# flex-shrink 计算

flex容器的剩余可用空间 = flex总可用空间 - 已计算出的flex项目计算后的值之和

flex容器的不足空间=flex容器的可用空间 - 所有 Flex 项目的尺寸总和

flex项目的灵活性=(flex容器的不足空间/所有flex项目flex-shrink) * 当前flex项目的flex-shrink

flex项目计算后的值 = felx项目的灵活性 + flex-basis    如果此值小于min-content 会取 min-content


# grow与shrink对比
flex-grow 按比例分配 Flex 容器剩余空间，Flex 项目会按比例变大，但不会造成 Flex项目溢出 Flex 容器（除非所有 Flex 项目自身的最小内容总和就大于 Flex 容器空间）。

flex-shrink 按比例分配 Flex 容器不足空间，Flex 项目会按比例变小，但 Flex 项目仍
然有可能溢出 Flex 容器。

当 flex-grow 属性值总和小于 1 时，Flex 容器的剩余空间分不完；同样的，当 flex-shrink 属性值总和小于 1 时，Flex 容器的不足空间分不完。

另外，flex-shrink 有一点和 flex-grow 完全不同，如果某个 Flex 项目按照 flex-shrink 计算出来的新宽度（flex-basis）趋向于 0 或小于 Flex 项目内容的最小长度（min-content）时，Flex 项目将会按照该元素的 min-content 或其内部固定宽度的元素尺寸设置 flex-basis新的值，同时这个宽度将会转嫁到其他 Flex 项目，浏览器会按照相应的收缩因子重新对 Flex项目进行计算，直到符合条件为止。


# flex-basis

在 CSS 中，任何一个容器都有四种自动计算尺寸大小的方式：
auto ：会根据格式化上下文自动计算容器的尺寸；
min-content ：是在不导致溢出的情况下，容器的内容的最小尺寸；
max-content ：容器可以容纳的最大尺寸，如果容器中包含未格式化的文本，那么它将
显示为一个完整的长字符串；
fit-content ：如果给定轴中的可用空间是确定的，则等于 min(max-content,
max(min-content, stretch-fit)) ，反之则等于 max-content。
需要注意的是， CSS 中的宽高比属性，即 aspect-ratio 也可以决定一个容器的尺寸


flex-basis属性在任何 Flex 容器空间（剩余空间或不足空间）分配发生之前初始化 Flex 项目尺寸 。

flex-basis 属性的语法规则：

`flex-basis: content | <width>`

该属性的默认值是 auto ，它可以接受 content 和 `<width>` 值。

`<width>` 值指的是 CSS 的 width 属性（尺寸属性），可用于 width 属性的值都可以用
于 flex-basis ，比如我们熟悉的 px 、% 、vw 等，以及需要根据内容自动计算的属性
值，比如 min-content 、max-content 和 fit-content 等。

content 是指 Flex 项目的内容的自动尺寸，它通常相当于 Flex 项目最大内容大小
（max-content）。

如果 flex-basis 的值设置为 auto ，浏览器将先检查 Flex 项目的主尺寸（Main Size）是否
设置了绝对值，再计算 Flex 项目的初始值。比如说，你给 Flex 项目显式设置了 width:
200px，那么 200px 就是 Flex 项目的 flex-basis 值，该值也被称为是 Flex 项目的假设主尺
寸，因为 Flex 项目的最终主尺寸（flex-basis 计算后的值）会受 Flex 容器剩余空间或不足
空间的影响，除非 flex-grow 和 flex-shrink 两属性的值都显式设置为 0 。
如果 Flex 项目可以自动调整大小，则 auto 会解析为其内容的大小，此时 min-content 和
max-content 就会起作用，并且 Flex 项目的 flex-basis 值将会是 max-content 。

有一点需要注意的是，如果在 flex-basis 属性上设置了除 auto 和 content 之外的所有值，
它和书写模式以及阅读模式是有关的，在水平书写模式（ltr 或 rtl），flex-basis 的解析
方式与 width 相同。
不同的是，如果一个值对于 width 将解析为 auto ，那么该值对于 flex-basis 就会被解析为
content。例如，flex-basis 的值是一个百分比值，那么它会相对于 Flex 容器的主轴尺寸
（Main Size）来计算；如果 Flex 容器的大小不确定时，则 flex-basis 使用的值会是
content。


元素的 width 大于或等于 max-width 时，取 max-width ，即 max-width 能覆盖 width

元素的 width 小于或等于 min-width 时，取 min-width ，即 min-width 能覆盖 width

当 min-width 大于 max-width 时，取 min-width ，即 min-width 优先级将高于 max-width 

注意，上面这个规则同样适用于 CSS 的min-height、height和max-height以及它们对
应的 CSS 逻辑属性，比如min-inline-size、inline-size和max-inline-size；min-block-size、block-size和max-block-size



CSS 中给元素设置一个尺寸时，除了设置具体值之外，还可以通过一些数学表达式来给其设
置值，比如 calc() 、min() 、max() 和 clamp() 等