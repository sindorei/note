# Dockerfile

## 指令文档
- https://docs.docker.com/engine/reference/builder/


## 常用指令

- FROM 指定父镜像
- MAINTAINER 作者信息
- LABEL 标签
- RUN 执行命令
- CMD 容器启动命令
   * 可被`docker run` 传入的命令覆盖
   * 只能有一个该指令，多个只有最后一个生效
- ENTRYPOINT 入口
   * 容器启动后执行
   * 如果docker run 没传参命令，启动后执行的是ENTRYPOINT + CMD
- ADD build时添加文件到镜像，不局限当前build上下文，还可以是远程文件，还可解压压缩包
- ENV 环境变量，容器启动时-e 可覆盖
- ARG
  * 构建参数，相同名字的ENV会覆盖ARG的参数
  * `docker build --build-arg` 可传入
- EXPOSE 暴露端口
  * 指定使用这个镜像启动的容器可以通过哪个端口和外界进行通信
- WORKDIR 工作目录
  * 容器启动时的默认目录
- COPY
  * COPY 指令用于将文件或目录拷贝到镜像中指定的位置
  * `COPY [--chown=<user>:<group>] <src>... <dest>`
  * 「源路径」可以有多个，空格分隔。相对于构建上下文路径。构建上下文目录以外的路径是不被允许的。绝对路径也是相对于构建上下文目录的。
  * 「目的路径」是绝对路径或者是相对于`WORKDIR`的相对路径
- VOLUME
  * 指定用于指定容器数据的挂载点
  * 容器在运行时会产生各种数据，由于容器和宿主机天然是隔离的，所以在宿主机上并不能看到容器内的数据，当容器被销毁时，这些数据也会随之销毁，无法找回。为了将容器内产生的数据存放到宿主机上，我们可以在制作镜像时指定某些目录为挂载点，然后将容器运行时产生的数据指定输出到这些目录中。当容器启动时，Docker 就会自动在宿主机上创建数据卷来映射挂载点，这样容器中产生的数据就会保存在宿主机上的这个数据卷内。数据卷有自己独立的生命周期，即使删掉了容器，数据卷也还会存在。


# alpine 设置时区
```
RUN apk add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata
```