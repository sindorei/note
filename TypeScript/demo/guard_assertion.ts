function fixed(name: string | null): string {
    function postfix(epithet: string) {
      return name!.charAt(0) + '.  the ' + epithet; // ok
    }
    name = name || "Bob";
    return postfix("great");
  }


  // console.log(fixed(null))



  interface Guard {
    name: string
    age: number
  }

  // 自定义类型判断
  function isGuard(a: any): a is Guard {
    return a && a.name && a.age
  }


  function getName(n: any) {
    if (isGuard(n)) {
      console.log(n.name)
    }
  }

  getName({
    name: 1
  })