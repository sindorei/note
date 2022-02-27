# [ABNF](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%85%85%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)
> 扩充巴科斯-瑙尔范式操作符

- 空白字符
  * 用来分隔定义中的各个元素
     * `method SP request-target SP HTTP-version CRLF`
- 选择`/`
  * 表示多个规则都是可供选择的规则
     * `start-line = request-line / status-line`
- 值范围`%c##-##`
  * OCTAL = "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" 与 OCTAL = %x30-37等价

- 序列组合`()`
  * 将规则组合视为单个元素

- 不定量重复`m*n`
  * `*`零个或多个
  * `1*` 一个或多个
  * `2*4` 两个至四个

- 可选序列`[]`
  * `[ message-body ]`