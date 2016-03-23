# npm
- node package manager
    * nodejs的包管理器
- 命令
    * `npm install <name> [-g] [--save-dev]
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
