

# 命令

## 常用

- 重命名 `mv A B`
- 查看进程相关 `ps`
  * `ps -aux`
  * `ps -ef` 能看到父进程id（ppid）

- 查看文件ls
  * `-h`或 `--human-readable`以K、M、G为单位查看文件大小


## apt
- `apt-cache search package` 搜索软件包
- `apt-get install package` 安装包
- `apt-get install package --reinstall` 重新安装包
- `apt-get remove package` 删除包


## sed
> sed 命令是利用脚本来处理文本文件。
sed 可依照脚本的指令来处理、编辑文本文件。
Sed 主要用来自动编辑一个或多个文件、简化对文件的反复操作、编写转换程序等


- `sed [-hnV][-e<script>][-f<script文件>][文本文件]`
- `-e`可省略，省略时sed 后面接的动作，请务必以 `''` 两个单引号括住

### 参数说明：

* `-e<script>`或`--expression=<script>` 以选项中指定的script来处理输入的文本文件。
* `-f<script文件>`或`--file=<script文件>` 以选项中指定的script文件来处理输入的文本文件。
* `-h`或`--help` 显示帮助。
* `-n`或`--quiet`或`--silent` 仅显示script处理后的结果。
* `-V`或`--version`显示版本信息。

### 动作说明：
* a ：新增， a 的后面可以接字串，而这些字串会在新的一行出现(目前的下一行)～
* c ：取代， c 的后面可以接字串，这些字串可以取代 n1,n2 之间的行！
* d ：删除，因为是删除啊，所以 d 后面通常不接任何咚咚；
* i ：插入， i 的后面可以接字串，而这些字串会在新的一行出现(目前的上一行)，可以直接修改文件内容；
* p ：打印，亦即将某个选择的数据印出。通常 p 会与参数 sed -n 一起运行～
* s ：取代，可以直接进行取代的工作哩！通常这个 s 的动作可以搭配正规表示法！例如 1,20s/old/new/g 就是啦！

### [点击查看详情](https://www.runoob.com/linux/linux-comm-sed.html)


## 不挂断运行进程
- `nohup node http.js &`


## 进程管理工具
### supervisor
- 安装
  * `apt-get install supervisor`
- 添加配置文件
  * `/etc/supervisor/conf.d`目录下新增配置文件
  * [参考地址](http://supervisord.org/configuration.html)
```
[program:example]
command=/usr/bin/example --loglevel=%(ENV_LOGLEVEL)s
```
- `supervisorctl update` 更新新的配置到supervisord
- `supervisorctl reload` 重新启动配置中的所有程序 
- 启动进程
  * `supervisorctl start app`
- 停止进程
  * `supervisorctl stop app`

## 修改密码
- passwd


## file
> 用于辨识文件类型

### 语法
```shell
file [-bcLvz][-f <名称文件>][-m <魔法数字文件>...][文件或目录...]
```

### 参数

- -b 　列出辨识结果时，不显示文件名称。
-xx -c 　详细显示指令执行过程，便于排错或分析程序执行的情形。
-f<名称文件> 　指定名称文件，其内容有一个或多个文件名称时，让file依序辨识这些文件，格式为每列一个文件名称。
- -L 　直接显示符号连接所指向的文件的类别。
- -m<魔法数字文件> 　指定魔法数字文件。
- -v 　显示版本信息。
- -z 　尝试去解读压缩文件的内容。
[文件或目录...] 要确定类型的文件列表，多个文件之间使用空格分开，可以使用shell通配符匹配多个文件。


## xxd
> 以2进制或16进制显示文件内容

### 语法
```shell
xxd [options] [infile [outfile]]
```



## 系统服务管理器指令

> 实际是将`service` 和 `chkconfig` 这两个命令组合到一起
 
- 启动服务 `systemctl start <服务名>`
- 停止服务 `systemctl stop <服务名>`
- 重新启动 `systemctl restart <服务名>`
- 查看服务状态 `systemctl status <服务名>`
- 设置开机自动启动 `systemctl enable <服务名>`
- 设置某服务不自动启动 `systemctl disable <服务名>`
- 显示所有已启动的服务 systemctl list-units --type=service
