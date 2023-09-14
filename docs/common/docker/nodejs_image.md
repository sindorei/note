# NodeJs官方镜像

## node:<version>
- 基于Debian,官方默认镜像。当你不确定你需要什么的时候选择这个就对了。这个被设计成可以丢弃的镜像，也就是可以用作构建源码使用。体积挺大。

## node:<version>-slim
- 基于Debian， 删除了很多默认公共的软件包，只有node运行的最小环境。除非你有空间限制，否则推荐使用默认镜像。

## node:<version>-alpine
- 基于alpine, 比Debian小的多。如果想要最小的镜像，可以选择这个做为base。需要注意的是，alpine使用musl代替glibc。一些c环境的软件可能不兼容。但大部分没问题。
alpine中安装软件使用`apk`

# 参考
- https://github.com/nodejs/docker-node/blob/master/README.md#how-to-use-this-image