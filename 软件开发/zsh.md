# 终极shell－zsh
- Shell是Linux/Unix的一个外壳，你理解成衣服也行。它负责外界与Linux内核的交互，接收用户或其他应用程序的命令，然后把这些命令转化成内核能理解的语言，传给内核，内核是真正干活的，干完之后再把结果返回用户或应用程序。
- linux／unix有很多shell，常用的有bash、sh、csh等
- 想知道系统有哪些shell，可运行命令`cat /etc/shells`
  * mac os 显示
```
/bin/bash
/bin/csh
/bin/ksh
/bin/sh
/bin/tcsh
/bin/zsh
```
- mac 内置了 zsh
- 设置当前用户使用zsh：`chsh -s /bin/zsh`，根据提示输入密码即可
- 安装 oh my zsh
  * - [oh my zsh](https://github.com/robbyrussell/oh-my-zsh)
  * 自动安装 `wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | sh`
    - mac下没有安装wget的可以用Homebrew安装
      * 安装Homebrew`ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
      * 用brew 安装 wget： `brew install wget`
