// 联合类型


function padLeft(value: string | null, padding: number | string) {
    
    if (typeof padding === "number") {  
        return Array(padding + 1).join(" ") + value;  
    }
    if (typeof padding === "string") {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}

console.log('---', padLeft('TypeScript', 2))

console.log(padLeft('TypeScript', '***'))
// console.log(padLeft(null, 2))

// padLeft('Typescript', ['*', '-'])
