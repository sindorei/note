// Distributive Conditional Types

type Foo1<T> = T extends any ? T[] : never

type Bar1 = Foo1<string | number>


// 不想这样可以将extends左右2边的关键字用中括号[]括起来
type Foo2<T> = [T] extends [any] ? T[] : never

// 'Bar' is no longer a union.
type Bar2 = Foo2<string | number>