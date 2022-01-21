import UIKit
// 闭包

let learnSwift = {
    print("Closures are like functions")
}

learnSwift()

let learnSwift2 = { () -> Void in
    print("Closures are like functions 2")
    
}

learnSwift2()

let learnSwift3 = {
    () -> ()  in
    print("Closures are like functions 3")
}

learnSwift3()

//learnSwift 、learnSwift2 、 learnSwift3
// 等价，类型都是 () -> ()

let sayHello = {
    (name: String) -> () in
    print("Hello, \(name)")
}

sayHello("DG")

func play(using playType: () -> ())  {
    print("Let's play a game")
    playType()
}

play(using: {
    print("Fetch!")
})

// 使用尾随闭包进行函数调用
play {
    print("Trailing closure")
}


let squared = { $0 * $0 }(12)

print(squared)

func noAutoClosureFunction(closure: () -> (), msg: String) {
    print(msg)
    closure()
}

noAutoClosureFunction(closure: {
    print("print in closure")
}, msg: "print in function")


func autoClosureFunction(closure: @autoclosure () -> (), msg: String) {
    print(msg)
    closure()
}

// 自动闭包，可省略大括号，可有返回值，但无法传递参数
autoClosureFunction(closure: print("print in closure 2"), msg: "print in function 2")

// 逃逸闭包 参数名之前标注 @escaping
