const globby = require('globby')

export default class Container {

    cwd = process.cwd();
    cache = {};
    classTable = {};
  
    init() {
      const fileResults = globby.sync(['**/**.ts', '**/**.js'], {
        cwd: this.cwd,
        ignore: [
          '**/node_modules/**',
        ],
      });
  
      for (const name of fileResults) {
        const exports = require(this.cwd + '/' + name);
        // 把类名和类都存起来
        this.classTable[this.getName(exports)] = exports;
      }
    }
  
    getName(Module) {
      return Module.name.toLowerCase();
    }
  
    get(Module) {
      // 弄个缓存
      if(this.cache[this.getName(Module)]) {
        return this.cache[this.getName(Module)];
      }
  
      // 创建对象
      const obj = new Module();
      // 缓存起来下次用
      this.cache[this.getName(Module)] = obj;
      // 拿到属性
      const properties = Object.getOwnPropertyNames(obj);
      for(let p of properties) {
        // 如果对象不存在，就往下创建
        if(!obj[p]) {
          // 如果表里有，就创建
          if(this.classTable[p]) {
            obj[p] = this.get(this.classTable[p]);
          }
        }
      }
    }
  }