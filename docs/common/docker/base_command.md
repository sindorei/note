# 命令文档
- https://docs.docker.com/engine/reference/commandline/docker/


# 镜像
- 类似虚拟机模板
- 等价于未运行的容器
- 相关命令
  * 查看镜像列表 `docker image ls`
  * 获取（拉取 pulling）镜像：`docker image pull`
  * 查看镜像详细信息`docker images -a` -q 查看镜像id
  * 搜索镜像 `docker search`
  * 删除镜像 `docker rmi` , `docker image rm`
  
## 镜像原理
- docker镜像是由特殊的文件系统叠加而成
- 最底层是bootfs，并使用宿主机的bootfs
- 第二层是root文件系统rootfs，称为base image
- 再往上可以叠加其他的镜像文件
- 统一文件系统（Union File System）技术能够将不同的层整合成一个文件系统，为这些层提供一个统一的视角。这样隐藏了多层的存在，在用户的角度，只存在一个文件系统
- 一个镜像可以放在另一个镜像的上面，位于下面的镜像称为父镜像，最底部的镜像称为基础镜像
- 当从一个镜像启动容器时，docker会在最顶层加载一个读写文件系统作为容器


## 镜像制作
- 将运行中的容器转为镜像
  * `docker commit [容器id] [镜像名称]:[版本号]`
  * 镜像转成压缩文件：`docker save -o 压缩文件名称 镜像名称:版本号`
  * 将压缩文件加载为镜像：`docker load -i 压缩文件名称`
- Dockerfile

# 容器
- `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`
- `docker container run [OPTIONS] IMAGE [COMMAND] [ARG...]`
- `docker container run -it ubuntu:latest /bin/bash`
  * `-it`参数会将shell切换到容器终端
  * 后面还可以跟容器中运行哪个进程
  
- 按ctrl+p+q组合键可以在退出容器的同时保持容器运行，这样shell就会返回docker主机终端
- `docker container ls` 、`docker ps`
  * 查看系统内部全部处于运行状态的容器
  * `-a` 参数可以查看已删除的容器
- `docker container exec [OPTIONS] CONTAINER COMMAND [ARG...]` 在运行中的容器中执行command
- 停止容器 `docker container stop` 
- 删除容器 `docker container rm`
- 开始已经停止的容器 `docker start`
- 查看容器信息：`docker inspect [OPTIONS] NAME|ID [NAME|ID...]`
- 端口映射： `-p [宿主机端口号]:[容器端口号]`
- 设置环境变量：[--env | -e] 变量名=变量值


# 数据卷 volume
- 宿主机的一个目录或文件
- 设置
  * 启动容器时使用 `--volume | -v` 设置
  * `docker run - v [[宿主机目录|文件]:][容器目录|文件]`
     * 不知道宿主机目录则会自动分配
  * 目录必须绝对路径
  * 目录不存在会自动创建
  * 可挂载多个数据卷
- 数据卷容器
    * `docker run --volumes-from [容器名]`

- 作用
  * 容器数据持久化
  * 客户端和容器数据交换
  * 容器间数据交换


# 应用部署
- 搜索镜像
  * `docker search`
- 拉取镜像
  * `docker pull`
- 创建容器,设置端口映射、目录映射
  * `docker run -id --name  -p -v`
- 测试访问



# 构建
- `docker build [OPTIONS] PATH | URL | -`
- `docker build -f [Dockerfile 文件名] -t [构建后的镜像名称 name:tag] .`

    
# 应用容器化
- 将应用代码构建到Docker镜像中，然后以容器的方式启动该镜像

# Docker镜像优化
- 镜像大小优化
  * 减少镜像层数
      * 合并指令
         * COPY、ADD 和 RUN 语句会向镜像中添加新层
         * COPY和ADD会检查复制到镜像中的内容自上一次构建以后是否发生变化（会计算每个被复制文件的chunksum值与缓存镜像层中同一个文件的chunksum进行对比）
      * 使用多阶段构建压缩层、只包含必要的构建结果
  * 优化镜像依赖
     * 使用distroless 只包含应用程序及其运行时依赖项
     * 使用小体积的 Alpine 基础镜像
     * 如果RUN 指令中有安装软件的操作，要在RUN 指令的最后清除掉软件仓库的缓存
- 利用镜像缓存
  * 调整Dockerfile中的指令顺序充分利用缓存
     * 把变化最少的部分放在 Dockerfile 的前面，这样可以充分利用镜像缓存。（一旦未命中缓存，后续的构建都不再使用缓存）


## 以node.js或前端项目docker构建举例
- 利用镜像缓存来减少依赖安装时间
```
COPY package.json package-lock.json ./
RUN npm install

# 复制剩余文件
COPY . .
RUN npm run build
```
- 构建完成后，清理依赖，只安装生产环境依赖
  * `yarn install --production`

  
# 登录
  - `docker login [OPTIONS] [仓库地址]`
    * OPTIONS
      * --password、-p
      * --password-stdin
      * --username、-u
  
  
# 通过 docker tag 命令重命名镜像
docker tag [imageID] hub.docker.com/[project]/[repository]:[tag]
 
 
# 通过 docker push 命令上传镜像
docker push hub.docker.com/[project]/[repository]:[tag]

  
# docker 服务编排
- 根据一定的业务规则批量地管理容器


## Docker Compose
- 利用Dockerfile定义运行环境镜像
- 利用docker-compose.yml定义组成应用的各服务
- 运行docker-compose up 启动应用

