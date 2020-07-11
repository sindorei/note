function tokenize(str) {
    var openTag = '<%'
    var closeTag = '%>'
    var ret = []
    do {
        var index = str.indexOf(openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        ret.push({
            expr: value,
            type: 'text'
        })
        str = str.slice(index + openTag.length)
        if (str) {
            index = str.indexOf(closeTag)
            var value = str.slice(0, index)
            ret.push({
                expr: value.trim(),
                type: 'js'
            })
            str = str.slice(index + closeTag.length)
        }
    } while(str.length)
    return ret
}

let tpl = '你好，我是<%name%>，身高<%height%>'


function render(str) {
    let tokens = tokenize(str)
    let ret = []
    for (let i = 0, token; token = tokens[i++];) {
        if (token.type === 'text') {
            ret.push('"' + token.expr + '"')
        } else {
            ret.push(token.expr)
        }
    }
    return ret.join('+')
}

console.log(render(tpl))