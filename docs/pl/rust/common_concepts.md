# Data Types

## Scalar Types

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


## Compound Types
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



# Functions
  - `fn` 关键字申明函数
  -  snake case 命名规则
  - `-> i32` 申明返回值类型

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