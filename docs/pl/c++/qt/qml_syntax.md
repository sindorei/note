# QML Syntax

```qml
// RectangleExample.qml

import QtQuick

// 根元素 Rectangle
Rectangle {
    // id不加引号
    id: root

    // 属性格式: <name>: <value>
    // 写在一行需要加; 换行可不加
    width: 120; height: 240

    // 颜色属性
    color: "#4A4A4A"

    // 申明嵌套的子元素
    Image {
        id: triangle

        // 通过parent访问父原色
        x: (parent.width - width)/2; y: 40

        source: 'assets/triangle_red.png'
    }

    Text {
        // 未命名（无id）

        // 通过id访问元素
        y: triangle.y + triangle.height + 20

        // reference root element
        width: root.width

        color: 'white'
        horizontalAlignment: Text.AlignHCenter
        text: 'Triangle'
    }
}
```
- `import`申明导入的模块，可选择添加版本号(Qt5中是必需的)，格式： `<major>.<minor>`
- 像 C/C++ and JavaScript一样， `//` 为单行注释 `/* */` 为多行注释
- 像HTML一样，每个QML文件都需要一个根元素
- 通过元素的名称申明元素，后面跟 `{ }`
- 元素属性格式为`name: value`
- QML文档中的任意元素都可以通过id（无引号的标识符）访问
- 元素可以嵌套。子元素可以通过`parent`关键字访问到父元素

::: tip
可通过 `$QTDIR/bin/qml FileName.qml`($QTDIR为qt安装目录) 直接运行qml文件，或者通过QT Creator
:::

## 属性

```qml
Text {
    // (1) 标识符
    id: thisLabel

    // (2) 设置x、y坐标
    x: 24; y: 16

    // (3) 绑定 height 为 2 * width
    height: 2 * width

    // (4) 自定义属性
    property int times: 24

    // (5) 属性别名
    property alias anotherTimes: thisLabel.times

    // (6) set text appended by value
    text: "Greetings " + times

    // (7) font is a grouped property
    font.family: "Ubuntu"
    font.pixelSize: 24

    // (8) KeyNavigation is an attached property
    KeyNavigation.tab: otherLabel

    // (9) signal handler for property changes
    onHeightChanged: console.log('height:', height)

    // focus is need to receive key events
    focus: true

    // change color based on focus value
    color: focus ? "red" : "black"
}
```


- (1) id 是一个特殊的属性，不是字符串，类似标识符，在文档中唯一。

- (2) 属性根据类型可以设置值。如果没有设置，会被默认设置一个初始值。可在文档中查看相关元素的某个属性的初始值。

- (3) 一个属性可以依赖另一个或多个其他属性。被称为绑定。 具有响应式的能力。即被绑定的属性更新了，则绑定该属性的属性也会更新。

- (4) 可通过property修饰符新增属性。格式： `property <type> <name> : <value>`。如果没给初始值，会选择默认的。

::: tip
> 可通过`default`关键字将某个属性申明为默认属性. 如果在一个元素内创建了另一个元素，但未显式绑定到某个属性，则它会绑定到默认属性。例如，当您添加子元素时，如果子元素是可见元素，它们将自动添加到默认属性`children`中。
:::

- (5) 另一种申明属性的重要方式是通过`alias`关键字 (`property alias <name>: <reference>`). `alias`关键字允许我们将对象的属性或对象本身从类型内部转发到外部范围。稍后我们将在定义组件时使用此技术以将内部属性或元素 ID 导出到根级别。属性别名不需要类型，它使用引用的属性或对象的类型

- (6) `text`属性依赖与自定义的`int`类型属性 `times`。 `int`类型值自动转成`string`类型. `times`变化时，`text`也会更新.

- (7) 有些属性是组合属性。 当属性更加结构化并且相关属性应该组合在一起时使用此功能。 另一种写组合属性的方式为： `font { family: "Ubuntu"; pixelSize: 24 }`。

- (8) 一些属性属于元素类本身。在应用程序中只出现一次的全局设置元素（例如键盘输入）。格式： `<Element>.<property>: <value>`.

- (9) 每个属性都可以提供信号处理. 此处理在属性改变后调用. 例如，这里我们想要在高度变化时被通知，用内置的`console`输出日志。

::: warning
元素 ID 只能用于引用文档中的元素（例如当前文件）。 QML 提供了一种称为“动态作用域”的机制，稍后加载的文档会覆盖较早加载的文档中的元素 ID。这使得可以从先前加载的文档中引用元素 ID（如果它们尚未被覆盖）。这就像创建全局变量。不幸的是，这在实践中经常会导致非常糟糕的代码，其中程序取决于执行顺序。不幸的是，这无法关闭。请小心使用；或者，更好的是，根本不使用这种机制。最好使用文档根元素上的属性将要提供给外界的元素导出。
:::


## 脚本

```qml
Text {
    id: label

    x: 24; y: 24

    // 自定义计数属性，用于空格键按下时
    property int spacePresses: 0

    text: "Space pressed: " + spacePresses + " times"

    // (1) text 变化时的处理。需要使用函数捕获参数
    onTextChanged: function(text) { 
        console.log("text changed to:", text)
    }

    // 获取键盘事件需要将focus设为true
    focus: true

    // (2) 当空格键被按下时滴啊用js方法进行处理
    Keys.onSpacePressed: {
        increment()
    }

    // ESC键按下时清除文本
    Keys.onEscapePressed: {
        label.text = ''
    }

    // (3) JS函数
    function increment() {
        spacePresses = spacePresses + 1
    }
}
```

- (1) 按下空格键`text`的值变化时，就会调用`onTextChanged`。 当我们使用信号注入的参数时，我们需要在这里使用函数语法。 也可以使用箭头函数 `((text) => {})`, 但是我们认为 `function(text) {}` 更可读。

- (2) 当空格键被按下是调用js 函数 `increment()`

- (3) 定义JavaScript函数`function <name>(<parameters>) { ... }`

## 绑定

QML` : `(绑定) 和 JavaScript`=`(赋值) 之间的区别在于，绑定是一个契约并且在绑定的整个生命周期内保持为真，而 JavaScript 赋值 (`=`) 是一次性值赋值。

当在属性上设置新绑定或者甚至将 JavaScript 值分配给属性时，绑定的生命周期结束。例如，将文本属性设置为空字符串的按键处理程序会破坏我们的增量显示
```qml
Keys.onEscapePressed: {
    label.text = ''
}
```
按下ESC键后，再按空格键，将不会再更新 text属性的值， (`text: “Space pressed: ” + spacePresses + ” times”`) 的绑定销毁了.
