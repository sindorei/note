# QML Syntax

```qml
// RectangleExample.qml

import QtQuick

// 根元素 Rectangle
Rectangle {
    // id不加引号
    id: root

    // 属性格式: <name>: <value>
    width: 120

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
- `import`申明导入的模块，可选择添加版本号，格式： `<major>.<minor>`
- 像 C/C++ and JavaScript一样， `//` 为单行注释 `/* */` 为多行注释
- 像HTML一样，每个QML文件都需要一个根元素
- 通过类型名称申明元素，后面跟 `{ }`
- 元素属性格式为`name: value`
- QML文档中的任意元素都可以通过id（无引号的标识符）访问
- 元素可以嵌套。子元素可以通过`parent`关键字访问到父元素