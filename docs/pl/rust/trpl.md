# 变量和可变性 （Variables and Mutability）

## 变量

- 变量使用`let`关键字申明，默认情况下是不可变的（immutable）
- 通过在变量名前加上 `mut` 使得它们可变

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

## 常量

- 常量使用`const`关键字申明，不允许使用 `mut`，而且自始至终不可变
- 常量可以在任意作用域内声明，包括全局作用域
- 常量只能设置为常量表达式，而不能是函数调用的结果或是只能在运行时计算得到的值。
- Rust 常量的命名约定是全部字母都使用大写，并使用下划线分隔单词。

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;

```


# 数据类型（Data Types）

## 标量类型（Scalar Types）

- integers
- floating-point numbers
- Booleans
- characters

### Integer Types

| Length  | Signed | Unsigned |
| ------- | ------ | -------- |
| 128-bit | i128   | u128     |
| 16-bit  | i16    | u16      |
| 32-bit  | i32    | u32      |
| 64-bit  | i64    | u64      |
| 8-bit   | i8     | u8       |
| arch    | isize  | usize    |

### Interger Literals

| Number literals | Example     |
| --------------- | ----------- |
| Decimal         | 98_222      |
| Hex             | 0xff        |
| Octal           | 0o77        |
| Binary          | 0b1111_0000 |
| Byte (u8 only)  | b'A'        |


### Floating-Point Types
- `f32`
- `f64` （default）
- IEEE-754 



### Boolean Type
- `bool`
  - `true`
  - `false`

### Character Type
- `char`
- single quotes
- four bytes in size represents a Unicode Scalar Value


## 复合类型（Compound Types）
- `tuple`
  * `let x: (i32, f64, u8) = (500, 6.4, 1);`

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```
- `array`
  * `let a: [i32; 5] = [1, 2, 3, 4, 5];`
  * `let a = [3; 5];`


没有任何值的元组 `()` 是一种特殊的类型，只有一个值，也写成 `()`。该类型被称为单元类型（unit type），该值被称为单元值（unit value）。如果表达式不返回任何其他值，就隐式地返回单元值。


# Functions
  - `fn` 关键字申明函数
  -  snake case 命名规则
  - `-> i32` 申明返回值类型


```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {}", x);
}

fn plus_one(x: i32) -> i32 {
    x + 1
}

```

## Statements and Expressions
- Statements are instructions that perform some action and do not return a value.
- Expressions evaluate to a resultant value.


Expressions do not include ending semicolons. If you add a semicolon to the end of an expression, you turn it into a statement, and it will then not return a value.



# Comments
- two slashes

# Control Flow

## if Expressions

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

Unlike languages such as Ruby and JavaScript, Rust will not automatically try to convert non-Boolean types to a Boolean. You must be explicit and always provide `if` with a Boolean as its condition.


Using if in a let Statement

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is: {number}");
}
```

## Repetition with Loops
- `loop`
  * `break` 后面加返回值
  * `break` 后加label名称，label必须以单引号开头`'`
- `while`
- `for`

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("the value is: {element}");
    }
}
```

```rust
fn main() {
    for number in (1..4).rev() {
        println!("{number}!");
    }
    println!("LIFTOFF!!!");
}
```

# Ownership

所有权（系统）是 Rust 最为与众不同的特性，它让 Rust 无需垃圾回收器（garbage collector）即可保证内存安全

## Ownership Rules
- Each value in Rust has an owner.
- There can only be one owner at a time.
- When the owner goes out of scope, the value will be dropped.


## 变量与数据交互的方式（Variables and Data Interacting with Move）
- 移动
- 克隆

If you’ve heard the terms *shallow copy* and *deep copy* while working with other languages, the concept of copying the pointer, length, and capacity without copying the data probably sounds like making a shallow copy. But because Rust also invalidates the first variable, instead of being called a shallow copy, it’s known as a *move*.

`Copy` trait 



# 引用与借用（References and Borrowing）

We call the action of creating a reference `borrowing`.As in real life, if a person owns something, you can borrow it from them. When you’re done, you have to give it back. You don’t own it.

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

```


## Mutable References

 if you have a mutable reference to a value, you can have no other references to that value.

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

# 切片（The Slice Type）

## 字符串 slice（string slice）

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];
    let world = &s[6..11];
    // &s[0..2] &s[..2]
    // &s[3..]
    // &s[..]
}

```

可以使用一个由中括号中的 [starting_index..ending_index] 指定的 range 创建一个 slice，其中 starting_index 是 slice 的第一个位置，ending_index 则是 slice 最后一个位置的后一个值。在其内部，slice 的数据结构存储了 slice 的开始位置和长度，长度对应于 ending_index 减去 starting_index 的值。


“字符串 slice” 的类型声明写作`&str`

字符串字面量就是 slice

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let my_string = String::from("hello world");

    // `first_word` 接受 `String` 的切片，无论是部分还是全部
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // `first_word` 也接受 `String` 的引用，
    // 这等同于 `String` 的全部切片
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // `first_word` 接受字符串字面量的切片，无论是部分还是全部
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);

    // 因为字符串字面值**就是**字符串 slice，
    // 这样写也可以，即不使用 slice 语法！
    let word = first_word(my_string_literal);
}
```

## 其他类型的 slice

```rust

#![allow(unused)]
fn main() {
    let a = [1, 2, 3, 4, 5];

    let slice = &a[1..3];
}
```

这个 slice 的类型是 `&[i32]`

# 结构体（struct/structure）

 使用`struct` 关键字定义结构体

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");
}

```

字段初始化简写语法（field init shorthand）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 1,
    }
}

fn main() {
    let user1 = build_user(
        String::from("someone@example.com"),
        String::from("someusername123"),
    );
}
```

结构体更新语法（struct update syntax）

注意变量与数据交互方式

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    // --snip--

    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };
}
```

元组结构体（tuple struct）

定义元组结构体，以 `struct` 关键字和结构体名开头并后跟元组中的类型

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}

```

类单元结构体（unit-like structs）

没有任何字段的结构体

因为它们类似于 `()`，即“元组类型”一节中提到的 unit 类型。类单元结构体常常在你想要在某个类型上实现 trait 但不需要在类型中存储数据的时候发挥作用。

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

## 方法语法

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

## 关联函数

所有在 impl 块中定义的函数被称为关联函数（associated function），因为它们与 impl 后面命名的类型相关。
我们可以定义不以 self 为第一参数的关联函数（因此不是方法），因为它们并不作用于一个结构体的实例。
我们已经使用了一个这样的函数，`String::from` 函数，它是在 String 类型上定义的。

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }
}

fn main() {
    let sq = Rectangle::square(3);
}
```

## 多个 impl 块

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```



# 枚举（enumerations/enums）

枚举允许你通过列举可能的 成员（variants） 来定义一个类型。

```rust

#![allow(unused)]
fn main() {
    enum IpAddrKind {
        V4,
        V6,
    }

    struct IpAddr {
        kind: IpAddrKind,
        address: String,
    }

    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("127.0.0.1"),
    };

    let loopback = IpAddr {
        kind: IpAddrKind::V6,
        address: String::from("::1"),
    };
}
```

```rust

#![allow(unused)]
fn main() {
    enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

    let home = IpAddr::V4(127, 0, 0, 1);

    let loopback = IpAddr::V6(String::from("::1"));
}

```

枚举和结构体还有另一个相似点：就像可以使用 impl 来为结构体定义方法那样，也可以在枚举上定义方法

```rust

#![allow(unused)]
fn main() {
    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        ChangeColor(i32, i32, i32),
    }

    impl Message {
        fn call(&self) {
            // 在这里定义方法体
        }
    }

    let m = Message::Write(String::from("hello"));
    m.call();
}
```

## Option 枚举和其相对于空值的优势

Rust 并没有空值，不过它确实拥有一个可以编码存在或不存在概念的枚举。这个枚举是 `Option<T>`，而且它定义于标准库中，如下:

```rust

#![allow(unused)]
fn main() {
    enum Option<T> {
        Some(T),
        None,
    }
}
```

```rust

#![allow(unused)]
fn main() {
    let some_number = Some(5);
    let some_string = Some("a string");

    let absent_number: Option<i32> = None;
}
```

# match 控制流运算符

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {}
```

```rust
fn main() {
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}
```

## 通配模式和 _ 占位符

```rust
fn main() {
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
}
```

# if let 简单控制流

```rust
#![allow(unused)]
fn main() {
    let some_u8_value = Some(0u8);
    if let Some(3) = some_u8_value {
        println!("three");
    }
}
```

#  使用包、Crate和模块管理不断增长的项目

模块系统（the module system）”，包括：
- 包（Packages）： Cargo 的一个功能，它允许你构建、测试和分享 crate。
- Crates ：一个模块的树形结构，它形成了库或二进制项目。
- 模块（Modules）和 use： 允许你控制作用域和路径的私有性。
- 路径（path）：一个命名例如结构体、函数或模块等项的方式

## 包和 crate

crate 是一个二进制项或者库。crate root 是一个源文件，Rust 编译器以它为起始点，并构成你的 crate 的根模块（我们将在“定义模块来控制作用域与私有性”一节深入解读）。
包（package）是提供一系列功能的一个或者多个 crate。一个包会包含有一个 Cargo.toml 文件，阐述如何去构建这些 crate。

一个包中至多 只能 包含一个库 crate（library crate）；包中可以包含任意多个二进制 crate（binary crate）；包中至少包含一个 crate，无论是库的还是二进制的。


## 定义模块来控制作用域与私有性

模块 让我们可以将一个 crate 中的代码进行分组，以提高可读性与重用性。模块还可以控制项的 私有性，即项是可以被外部代码使用的（public），还是作为一个内部实现的内容，不能被外部代码使用（private）。

```rust

#![allow(unused)]
fn main() {
    mod front_of_house {
        mod hosting {
            fn add_to_waitlist() {}

            fn seat_at_table() {}
        }

        mod serving {
            fn take_order() {}

            fn serve_order() {}

            fn take_payment() {}
        }
    }
}
```

## 路径用于引用模块树中的项

路径有两种形式：
- 绝对路径（absolute path）从 crate 根部开始，以 crate 名或者字面量 crate 开头。
- 相对路径（relative path）从当前模块开始，以 self、super 或当前模块的标识符开头。

绝对路径和相对路径都后跟一个或多个由双冒号（::）分割的标识符。


以使用 super 开头来构建从父模块开始的相对路径。这么做类似于文件系统中以 .. 开头的语法。

## 使用 use 关键字将名称引入作用域

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
fn main() {}
```

## 使用 as 关键字提供新的名称

```rust

#![allow(unused)]
fn main() {
    use std::fmt::Result;
    use std::io::Result as IoResult;

    fn function1() -> Result {
        // --snip--
        Ok(())
    }

    fn function2() -> IoResult<()> {
        // --snip--
        Ok(())
    }
}
```

## 使用 pub use 重导出名称

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

## 使用外部包

Cargo.toml
    
```toml
[dependencies]
rand = "0.8.3"
```

## 嵌套路径来消除大量的 use 行

```rust
use std::io::{self, Write};
```

## 通过 glob 运算符将所有的公有定义引入作用域

```rust
use std::collections::*;
```

## 将模块分割进不同文件


# 常见集合

## vector
- `Vec<T>`
- 内存中彼此相邻排列
- 相同类型

```rust
let v: Vec<i32> = Vec::new();
let v = vec![1, 2, 3]; // 使用初始值来创建
```

## 字符串

新建字符串 
```rust
let mut s = String::new();

```
```rust
let data = "initial contents";

let s = data.to_string();

// 该方法也可直接用于字符串字面量：
let s = "initial contents".to_string();
```

```rust
let s = String::from("initial contents");
```

String::from 和 to_string 最终做到了完全相同的事情，所以如何选择，就是风格问题了。

请记住，字符串是 UTF-8 编码的，所以可以包含任何正确编码的数据，

```rust

let mut s = String::from("foo");
s.push_str("bar");
```

```rust
let mut s = String::from("lo");
s.push('l');
```

```rust

let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 被移动了，不能继续使用
```

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```

内部表现
`String` 是一个 `Vec<u8>` 的封装。

如果你需要操作单独的 Unicode 标量值，最好的选择是使用 chars 方法

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

bytes 方法返回每一个原始字节

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

有效的 Unicode 标量值可能会由不止一个字节组成。

# HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);

scores.entry(String::from("Yellow")).or_insert(50);

```