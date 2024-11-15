import{_ as e,c as i,f as o,o as c}from"./app-LHpjaFTr.js";const a={};function d(n,l){return c(),i("div",null,l[0]||(l[0]=[o(`<h1 id="命令文档" tabindex="-1"><a class="header-anchor" href="#命令文档"><span>命令文档</span></a></h1><ul><li>https://docs.docker.com/engine/reference/commandline/docker/</li></ul><h1 id="镜像" tabindex="-1"><a class="header-anchor" href="#镜像"><span>镜像</span></a></h1><ul><li>类似虚拟机模板</li><li>等价于未运行的容器</li><li>相关命令 <ul><li>查看镜像列表 <code>docker image ls</code></li><li>获取（拉取 pulling）镜像：<code>docker image pull</code></li><li>查看镜像详细信息<code>docker images -a</code> -q 查看镜像id</li><li>搜索镜像 <code>docker search</code></li><li>删除镜像 <code>docker rmi</code> , <code>docker image rm</code></li></ul></li></ul><h2 id="镜像原理" tabindex="-1"><a class="header-anchor" href="#镜像原理"><span>镜像原理</span></a></h2><ul><li>docker镜像是由特殊的文件系统叠加而成</li><li>最底层是bootfs，并使用宿主机的bootfs</li><li>第二层是root文件系统rootfs，称为base image</li><li>再往上可以叠加其他的镜像文件</li><li>统一文件系统（Union File System）技术能够将不同的层整合成一个文件系统，为这些层提供一个统一的视角。这样隐藏了多层的存在，在用户的角度，只存在一个文件系统</li><li>一个镜像可以放在另一个镜像的上面，位于下面的镜像称为父镜像，最底部的镜像称为基础镜像</li><li>当从一个镜像启动容器时，docker会在最顶层加载一个读写文件系统作为容器</li></ul><h2 id="镜像制作" tabindex="-1"><a class="header-anchor" href="#镜像制作"><span>镜像制作</span></a></h2><ul><li>将运行中的容器转为镜像 <ul><li><code>docker commit [容器id] [镜像名称]:[版本号]</code></li><li>镜像转成压缩文件：<code>docker save -o 压缩文件名称 镜像名称:版本号</code></li><li>将压缩文件加载为镜像：<code>docker load -i 压缩文件名称</code></li></ul></li><li>Dockerfile</li></ul><h1 id="容器" tabindex="-1"><a class="header-anchor" href="#容器"><span>容器</span></a></h1><ul><li><p><code>docker run [OPTIONS] IMAGE [COMMAND] [ARG...]</code></p></li><li><p><code>docker container run [OPTIONS] IMAGE [COMMAND] [ARG...]</code></p></li><li><p><code>docker container run -it ubuntu:latest /bin/bash</code></p><ul><li><code>-it</code>参数会将shell切换到容器终端</li><li>后面还可以跟容器中运行哪个进程</li></ul></li><li><p>按ctrl+p+q组合键可以在退出容器的同时保持容器运行，这样shell就会返回docker主机终端</p></li><li><p><code>docker container ls</code> 、<code>docker ps</code></p><ul><li>查看系统内部全部处于运行状态的容器</li><li><code>-a</code> 参数可以查看已删除的容器</li></ul></li><li><p><code>docker container exec [OPTIONS] CONTAINER COMMAND [ARG...]</code> 在运行中的容器中执行command</p></li><li><p>停止容器 <code>docker container stop</code></p></li><li><p>删除容器 <code>docker container rm</code></p></li><li><p>开始已经停止的容器 <code>docker start</code></p></li><li><p>查看容器信息：<code>docker inspect [OPTIONS] NAME|ID [NAME|ID...]</code></p></li><li><p>端口映射： <code>-p [宿主机端口号]:[容器端口号]</code></p></li><li><p>设置环境变量：[--env | -e] 变量名=变量值</p></li></ul><h1 id="数据卷-volume" tabindex="-1"><a class="header-anchor" href="#数据卷-volume"><span>数据卷 volume</span></a></h1><ul><li><p>宿主机的一个目录或文件</p></li><li><p>设置</p><ul><li>启动容器时使用 <code>--volume | -v</code> 设置</li><li><code>docker run - v [[宿主机目录|文件]:][容器目录|文件]</code><ul><li>不知道宿主机目录则会自动分配</li></ul></li><li>目录必须绝对路径</li><li>目录不存在会自动创建</li><li>可挂载多个数据卷</li></ul></li><li><p>数据卷容器</p><ul><li><code>docker run --volumes-from [容器名]</code></li></ul></li><li><p>作用</p><ul><li>容器数据持久化</li><li>客户端和容器数据交换</li><li>容器间数据交换</li></ul></li></ul><h1 id="应用部署" tabindex="-1"><a class="header-anchor" href="#应用部署"><span>应用部署</span></a></h1><ul><li>搜索镜像 <ul><li><code>docker search</code></li></ul></li><li>拉取镜像 <ul><li><code>docker pull</code></li></ul></li><li>创建容器,设置端口映射、目录映射 <ul><li><code>docker run -id --name -p -v</code></li></ul></li><li>测试访问</li></ul><h1 id="构建" tabindex="-1"><a class="header-anchor" href="#构建"><span>构建</span></a></h1><ul><li><code>docker build [OPTIONS] PATH | URL | -</code></li><li><code>docker build -f [Dockerfile 文件名] -t [构建后的镜像名称 name:tag] .</code></li></ul><h1 id="应用容器化" tabindex="-1"><a class="header-anchor" href="#应用容器化"><span>应用容器化</span></a></h1><ul><li>将应用代码构建到Docker镜像中，然后以容器的方式启动该镜像</li></ul><h1 id="docker镜像优化" tabindex="-1"><a class="header-anchor" href="#docker镜像优化"><span>Docker镜像优化</span></a></h1><ul><li>镜像大小优化 <ul><li>减少镜像层数 <ul><li>合并指令 <ul><li>COPY、ADD 和 RUN 语句会向镜像中添加新层</li><li>COPY和ADD会检查复制到镜像中的内容自上一次构建以后是否发生变化（会计算每个被复制文件的chunksum值与缓存镜像层中同一个文件的chunksum进行对比）</li></ul></li><li>使用多阶段构建压缩层、只包含必要的构建结果</li></ul></li><li>优化镜像依赖 <ul><li>使用distroless 只包含应用程序及其运行时依赖项</li><li>使用小体积的 Alpine 基础镜像</li><li>如果RUN 指令中有安装软件的操作，要在RUN 指令的最后清除掉软件仓库的缓存</li></ul></li></ul></li><li>利用镜像缓存 <ul><li>调整Dockerfile中的指令顺序充分利用缓存 <ul><li>把变化最少的部分放在 Dockerfile 的前面，这样可以充分利用镜像缓存。（一旦未命中缓存，后续的构建都不再使用缓存）</li></ul></li></ul></li></ul><h2 id="以node-js或前端项目docker构建举例" tabindex="-1"><a class="header-anchor" href="#以node-js或前端项目docker构建举例"><span>以node.js或前端项目docker构建举例</span></a></h2><ul><li>利用镜像缓存来减少依赖安装时间</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">COPY package.json package-lock.json ./</span>
<span class="line">RUN npm install</span>
<span class="line"></span>
<span class="line"># 复制剩余文件</span>
<span class="line">COPY . .</span>
<span class="line">RUN npm run build</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>构建完成后，清理依赖，只安装生产环境依赖 <ul><li><code>yarn install --production</code></li></ul></li></ul><h1 id="登录" tabindex="-1"><a class="header-anchor" href="#登录"><span>登录</span></a></h1><ul><li><code>docker login [OPTIONS] [仓库地址]</code><ul><li>OPTIONS <ul><li>--password、-p</li><li>--password-stdin</li><li>--username、-u</li></ul></li></ul></li></ul><h1 id="通过-docker-tag-命令重命名镜像" tabindex="-1"><a class="header-anchor" href="#通过-docker-tag-命令重命名镜像"><span>通过 docker tag 命令重命名镜像</span></a></h1><p>docker tag [imageID] hub.docker.com/[project]/[repository]:[tag]</p><h1 id="通过-docker-push-命令上传镜像" tabindex="-1"><a class="header-anchor" href="#通过-docker-push-命令上传镜像"><span>通过 docker push 命令上传镜像</span></a></h1><p>docker push hub.docker.com/[project]/[repository]:[tag]</p><h1 id="docker-服务编排" tabindex="-1"><a class="header-anchor" href="#docker-服务编排"><span>docker 服务编排</span></a></h1><ul><li>根据一定的业务规则批量地管理容器</li></ul><h2 id="docker-compose" tabindex="-1"><a class="header-anchor" href="#docker-compose"><span>Docker Compose</span></a></h2><ul><li>利用Dockerfile定义运行环境镜像</li><li>利用docker-compose.yml定义组成应用的各服务</li><li>运行docker-compose up 启动应用</li></ul>`,34)]))}const s=e(a,[["render",d],["__file","base_command.html.vue"]]),p=JSON.parse('{"path":"/common/docker/base_command.html","title":"命令文档","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"镜像原理","slug":"镜像原理","link":"#镜像原理","children":[]},{"level":2,"title":"镜像制作","slug":"镜像制作","link":"#镜像制作","children":[]},{"level":2,"title":"以node.js或前端项目docker构建举例","slug":"以node-js或前端项目docker构建举例","link":"#以node-js或前端项目docker构建举例","children":[]},{"level":2,"title":"Docker Compose","slug":"docker-compose","link":"#docker-compose","children":[]}],"git":{"updatedTime":1694661784000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"common/docker/base_command.md"}');export{s as comp,p as data};
