/**
 * Inferring Within Conditional Types
 */

type GetReturnType<T> = T extends (...args: never[]) => infer U ? U : never

type Foo = GetReturnType<() => number>
//   ^ = type Foo = number

type Bar = GetReturnType<(x: string) => string>
//   ^ = type Bar = string

type Baz = GetReturnType<(a: boolean, b: boolean) => boolean[]>
//   ^ = type Baz = boolean[]