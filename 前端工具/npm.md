# npm
- node package manager
    * nodejs的包管理器
- 命令
    * `npm install <name> [-g] [--save-dev]`
        - `<name>` 插件名称 也可以是插件地址
        - `-g` 全局安装
            * 将会安装在C:\Users\Administrator\AppData\Roaming\npm，并且写入系统环境变量；  非全局安装：将会安装在当前定位目录；  全局安装可以通过命令行在任何地方调用它，本地安装将安装在定位目录的node_modules文件夹下，通过require()调用；
        - `--save`
            * 将保存配置信息至package.json（nodejs项目配置文件）
        - `-dev`
            * 保存至package.json的devDependencies节点，不指定-dev将保存至dependencies节点
                * 作用：加入版本管理及依赖
    * `npm uninstall <name> [-g] [--save-dev]`
        - 卸载插件
    * `npm update <name> [-g] [--save-dev]`
        - 更新插件
    * `npm help`
        - 查看npm帮助
    * `npm list`
        - 查看当前目录已安装插件
    * `npm init`
        - 初始化package.json文件

# npm 安装
- [http://registry.npmjs.org](http://registry.npmjs.org)

# cnpm
- `npm install cnpm -g --registry=https://registry.npm.taobao.org`

# package.json
## name
- 必须,没有则无法install
- name和version一起组成以为的标识
- 不要包含js和node，默认npm包就是node.js程序，可以通过`engines`字段来指定
- 会作为在URL的一部分、命令行的参数或者文件夹的名字。任何non-url-safe的字符都是不能用的。
- 可能会作为参数被传入`require()`，所以应该简明。
- [npm registry](http://registry.npmjs.org/)中没有重名，字母全部小写。

## version
- 这个字段的取值需要符合[node-semver](https://github.com/npm/node-semver)的规则，详细可以见其文档。
## description

- 包的描述信息，将会在npm search的返回结果中显示，以帮助用户选择合适的包。

## keywords
- 包的关键词信息，是一个字符串数组，同上也将显示在npm search的结果中。

## homepage

- 包的主页地址

## bugs

- 包的bug跟踪主页地址，应该如下设置：
```json
    bugs: {  
        "url": "http://github.com/ijse/project/issues",
        "email": "my@ijser.cn"
    }
```
## license

- 包的开源协议名称

## author

- 包的作者，可以是字符串或对象：
```json
    author: {  
        "name": "ijse",
        "email": "my@ijse.cn",
        "url": "http://www.ijser.cn"
    }
```
或：
    `author: "ijse <my@ijser.cn> (http://www.ijser.cn)"`

## contributors,maintainers

- 包的贡献者，是一个数组。

## files

- 包所包含的所有文件，可以取值为文件夹。
- 通常我们还是用.npmignore来去除不想包含到包里的文件。

## main

- 包的入口文件，如index.js

## bin

- 如果你的包里包含可执行文件，通过设置这个字段可以将它们包含到系统的PATH中，这样直接就可以运行，很方便。如：
```json
    "bin": {
        "iapp": "./cli.js"
    }
```
当包被安装后，NPM将创建一个cli.js文件的链接到/usr/local/bin/iapp下。

## man

## directories

## repository

## scripts

- 通过设置这个可以使NPM调用一些命令脚本，封装一些功能。

## config

- 添加一些设置，可以供scripts读取用，同时这里的值也会被添加到系统的环境变量中。
```json
    "name": "foo",
    "config": {
      "port": "8080"
    }
```
- npm start的时候会读取到npm_package_config_port环境变量。
- 也可以使用npm config命令来修改设置：

    `npm config set foo:port 8001`

## dependencies

## devDependencies

## peerDependencies

## bundledDependencies

## optionalDependencies

## engines

## engineStrict

## os

## cpu

## preferGlobal

## private

## publishConfig
