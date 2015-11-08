# SQL 注入

### SQL 注入点分类
- 字符型
- 整数型
- 搜索型
### SQL注入攻击分类
- 没有正确的过滤转义字符
- 错误的类型处理
- 数据库服务器中的漏洞
- SQL盲注
- 条件响应
- 条件性差错
- 时间延迟
### SQL注入原理
- 正常的SQL语句

`select * from users where id=1`
- 动态的构造过程

`$sql = 'select * from user where id='.$GET['id']`
- 利用动态构造，构造注入语句



# 不同数据库的SQL注入
### Access注入猜解过程
- 猜解表名
- 猜解列名
- 猜解字段值长度
- ASCII逐字解码法猜解字段值
### mysql 的SQL注入
union 联合查询 可猜解 列数

内置函数：
version() database() load_file()

### SQLServer的注入
- 有趣的出错信息
- Group By 与 Having查询
- 爆表名与字段名

### 基于不同方法条件语句的使用
- 基于时间 

SQLServer:

有管理员访问权限
```SQL
IF(system_user = 'sa') WAITFOR DELAY '0:0:5' -
IF(substring((select @@version),25,1) == 5) WAITFOR DELAY '0:5:15' --
```
MySQL:

`select benchmark(10000,sha1('fooying'))`

`select sleep(5);`(5.0.12版本以上)

基于web应用响应时间上的差异

- 基于错误
  - /is_srvrolemember('sysadmin')
  - /case when (system_user = 'sa') then 1 else 0 end
- 基于内容
  - %2B case when (system_user = 'sa') then 1 else 0 end
  
  ### 其他SQL注入利用手法
  - 万能密码
    - 'or' = 'or'
    - `sql = "select * from users when username='' or '=' or " and password = 'admin'`
  - 字符转换与编码
    - Declare 与 OX6e编码
      - 16进制编码  把引号编码掉，防止被过滤
    - 二次编码
    - /**/替换空格
    
# SQL注入的防御

### 基础与二次过滤
 - 输入检查
 - 特殊符号过滤
 - 白名单与黑名单
 
### 不同语言的SQL防御
 - 使用参数化语句
 - 特殊符号过滤
### 平台层的防御
 - Web应用防火墙
 - URL策略与页面层策略
 - 数据库权限控制
 - 额外的部署考虑 （错误信息的屏蔽）