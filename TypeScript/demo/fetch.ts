import * as http from "http"
import * as https from "https"
import * as URL from 'url'
import * as qs from 'querystring'

interface fetchOptions {
    headers?: http.OutgoingHttpHeaders
    method?: string
    timeout?: number
    data?: string | object | Buffer
    dataType?: string
}

interface fetchDataRes {
    statusCode: number,
    statusMessage: string,
    headers: http.IncomingHttpHeaders
}


interface fetchData {
    ok: boolean
    res: fetchDataRes
    data: any
}



/**
 * 简单的http 请求方法，还有很多细节未处理
 * @param url
 * @param options
 */
function fetch(url: string, opt: fetchOptions): Promise<fetchData>  {
    const options: fetchOptions = {
        headers: {
            'content-type': 'application/json'
        },
        method: 'GET',
        timeout: 20000,
        dataType: 'json'
    }
    Object.assign(options, opt)
    return new Promise<fetchData>((resolve, reject) => {
        if(options.method.toUpperCase() === 'GET' && options.data) {
            if(typeof options.data === 'string') {
                if(url.includes('?')) {
                    url += '&' + options.data
                } else {
                    url += '?' + options.data
                }
            } else if (typeof options.data === 'object' && !Buffer.isBuffer(options.data)) {
                if(url.includes('?')) {
                    url += '&' + qs.stringify(options.data)
                } else {
                    url += '?' + qs.stringify(options.data)
                }
            }
        }

        const urlObj = URL.parse(url)
        const requestOption = {
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            method: options.method,
            path: urlObj.path,
            headers: options.headers,
            timeout: 500
        }
        const request = urlObj.protocol === 'https:' ? https.request : http.request
        const req = request(requestOption, (res) => {
            const buffer = []
            res.on('data', chunk => {
                buffer.push(chunk)
            })
            res.on('end',  () => {
                const result = Buffer.concat(buffer).toString()
                const data = {
                    res: {
                        headers: res.headers,
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage
                    },
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    data: result
                }
                if(options.dataType && options.dataType.toLowerCase() === 'json' && result && data.ok) {
                    try {
                        data.data = JSON.parse(result)
                    } catch(e) {
                        reject(e)
                    }
                }
                resolve(data)
            })

        })
        req.on('error', (e) => {
            reject(e)
        })

        req.setTimeout(options.timeout, () => {
            reject(new Error(`network timeout at: ${url}`))
            req.abort()
        })

        if(options.method.toUpperCase() === 'POST' && options.data) {
            if(typeof options.data === 'object' && !Buffer.isBuffer(options.data)) {
                req.write(JSON.stringify(options.data))
            } else {
                req.write(options.data)
            }

        }
        req.end()
    })
}



export default fetch
