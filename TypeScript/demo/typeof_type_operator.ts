// JavaScript already has a typeof operator you can use in an expression context:

// Prints "string"
console.log(typeof "Hello world")


// TypeScript adds a typeof operator you can use in a type context to refer to the type of a variable or property:

let s = "hello"
let n: typeof s
//  ^ = let n: stringTry


type Predicate = (x: unknown) => boolean
type K = ReturnType<Predicate>
//   ^ = type K = boolean


function f() {
    return { x: 10, y: 3 }
  }
  type P1 = ReturnType<typeof f>


// Limitations
// TypeScript intentionally limits the sorts of expressions you can use typeof on.

// Specifically, it’s only legal to use typeof on identifiers (i.e. variable names) or their properties. This helps avoid the confusing trap of writing code you think is executing, but isn’t: