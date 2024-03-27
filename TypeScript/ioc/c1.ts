// class Container {

//     get(Module) {
//       // 创建对象
//       const obj = new Module();
//       // 拿到属性
//       const properties = Object.getOwnPropertyNames(obj);
//       for(let p of properties) {
//         if(!obj[p]) {
//           // 如果对象不存在，就往下创建
//           if(p === 'b') {
//             obj[p] = this.get(B);
//           } else if(p === 'c') {
//             obj[p] = this.get(C);
//           } else {}
//         }
//       }
//     }
//   }