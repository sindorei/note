type Point = { x: number; y: number }
type P = keyof Point
//   ^ = type P = "x" | "y"


type Arrayish = { [n: number]: unknown }
type A = keyof Arrayish;
//   ^ = type A = number

type Mapish = { [k: string]: boolean }

type M = keyof Mapish
//   ^ = type M = string | number