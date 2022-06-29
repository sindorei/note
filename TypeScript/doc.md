# 安装
- `yarn add typescript`
- 生成配置文件tsconfig.json：`tsc --init`

- [官方文档](https://www.typescriptlang.org/docs)


# 类型进阶
- [type-challenges](https://github.com/type-challenges/type-challenges)
  * Generics 泛型
  * `key of ` Keyof Type Operator 
  * `x extends xx ? xxx : xxxx` Conditional Types
  * `infer`(搭配条件类型使用)
  * `in`
  * `in keyof` Mapped Types
  *  数组 `T[number]` 、 rest `...`
  * Template Literal Types
    * ```type TrimLeft<S extends string> = S extends `${' ' | '\n' | '\t'}${infer R}` ? TrimLeft<R> : S```