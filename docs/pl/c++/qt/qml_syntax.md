# QML Syntax

```qml
// RectangleExample.qml

import QtQuick

// The root element is the Rectangle
Rectangle {
    // name this element root
    id: root

    // properties: <name>: <value>
    width: 120

    // color property
    color: "#4A4A4A"

    // Declare a nested element (child of root)
    Image {
        id: triangle

        // reference the parent
        x: (parent.width - width)/2; y: 40

        source: 'assets/triangle_red.png'
    }

    // Another child of root
    Text {
        // un-named element

        // reference element by id
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