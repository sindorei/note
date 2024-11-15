import{_ as l,c as a,f as s,o as i}from"./app-LHpjaFTr.js";const n={};function t(c,e){return i(),a("div",null,e[0]||(e[0]=[s(`<h1 id="命令" tabindex="-1"><a class="header-anchor" href="#命令"><span>命令</span></a></h1><h2 id="常用" tabindex="-1"><a class="header-anchor" href="#常用"><span>常用</span></a></h2><ul><li><p>重命名 <code>mv A B</code></p></li><li><p>查看进程相关 <code>ps</code></p><ul><li><code>ps -aux</code></li><li><code>ps -ef</code> 能看到父进程id（ppid）</li></ul></li><li><p>查看文件ls</p><ul><li><code>-h</code>或 <code>--human-readable</code>以K、M、G为单位查看文件大小</li></ul></li></ul><h2 id="apt" tabindex="-1"><a class="header-anchor" href="#apt"><span>apt</span></a></h2><ul><li><code>apt-cache search package</code> 搜索软件包</li><li><code>apt-get install package</code> 安装包</li><li><code>apt-get install package --reinstall</code> 重新安装包</li><li><code>apt-get remove package</code> 删除包</li></ul><h2 id="sed" tabindex="-1"><a class="header-anchor" href="#sed"><span>sed</span></a></h2><blockquote><p>sed 命令是利用脚本来处理文本文件。 sed 可依照脚本的指令来处理、编辑文本文件。 Sed 主要用来自动编辑一个或多个文件、简化对文件的反复操作、编写转换程序等</p></blockquote><ul><li><code>sed [-hnV][-e&lt;script&gt;][-f&lt;script文件&gt;][文本文件]</code></li><li><code>-e</code>可省略，省略时sed 后面接的动作，请务必以 <code>&#39;&#39;</code> 两个单引号括住</li></ul><h3 id="参数说明" tabindex="-1"><a class="header-anchor" href="#参数说明"><span>参数说明：</span></a></h3><ul><li><code>-e&lt;script&gt;</code>或<code>--expression=&lt;script&gt;</code> 以选项中指定的script来处理输入的文本文件。</li><li><code>-f&lt;script文件&gt;</code>或<code>--file=&lt;script文件&gt;</code> 以选项中指定的script文件来处理输入的文本文件。</li><li><code>-h</code>或<code>--help</code> 显示帮助。</li><li><code>-n</code>或<code>--quiet</code>或<code>--silent</code> 仅显示script处理后的结果。</li><li><code>-V</code>或<code>--version</code>显示版本信息。</li></ul><h3 id="动作说明" tabindex="-1"><a class="header-anchor" href="#动作说明"><span>动作说明：</span></a></h3><ul><li>a ：新增， a 的后面可以接字串，而这些字串会在新的一行出现(目前的下一行)～</li><li>c ：取代， c 的后面可以接字串，这些字串可以取代 n1,n2 之间的行！</li><li>d ：删除，因为是删除啊，所以 d 后面通常不接任何咚咚；</li><li>i ：插入， i 的后面可以接字串，而这些字串会在新的一行出现(目前的上一行)，可以直接修改文件内容；</li><li>p ：打印，亦即将某个选择的数据印出。通常 p 会与参数 sed -n 一起运行～</li><li>s ：取代，可以直接进行取代的工作哩！通常这个 s 的动作可以搭配正规表示法！例如 1,20s/old/new/g 就是啦！</li></ul><h3 id="点击查看详情" tabindex="-1"><a class="header-anchor" href="#点击查看详情"><span><a href="https://www.runoob.com/linux/linux-comm-sed.html" target="_blank" rel="noopener noreferrer">点击查看详情</a></span></a></h3><h2 id="不挂断运行进程" tabindex="-1"><a class="header-anchor" href="#不挂断运行进程"><span>不挂断运行进程</span></a></h2><ul><li><code>nohup node http.js &amp;</code></li></ul><h2 id="进程管理工具" tabindex="-1"><a class="header-anchor" href="#进程管理工具"><span>进程管理工具</span></a></h2><h3 id="supervisor" tabindex="-1"><a class="header-anchor" href="#supervisor"><span>supervisor</span></a></h3><ul><li>安装 <ul><li><code>apt-get install supervisor</code></li></ul></li><li>添加配置文件 <ul><li><code>/etc/supervisor/conf.d</code>目录下新增配置文件</li><li><a href="http://supervisord.org/configuration.html" target="_blank" rel="noopener noreferrer">参考地址</a></li></ul></li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">[program:example]</span>
<span class="line">command=/usr/bin/example --loglevel=%(ENV_LOGLEVEL)s</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><ul><li><code>supervisorctl update</code> 更新新的配置到supervisord</li><li><code>supervisorctl reload</code> 重新启动配置中的所有程序</li><li>启动进程 <ul><li><code>supervisorctl start app</code></li></ul></li><li>停止进程 <ul><li><code>supervisorctl stop app</code></li></ul></li></ul><h2 id="修改密码" tabindex="-1"><a class="header-anchor" href="#修改密码"><span>修改密码</span></a></h2><ul><li>passwd</li></ul><h2 id="file" tabindex="-1"><a class="header-anchor" href="#file"><span>file</span></a></h2><blockquote><p>用于辨识文件类型</p></blockquote><h3 id="语法" tabindex="-1"><a class="header-anchor" href="#语法"><span>语法</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line"><span class="token function">file</span> <span class="token punctuation">[</span>-bcLvz<span class="token punctuation">]</span><span class="token punctuation">[</span>-f <span class="token operator">&lt;</span>名称文件<span class="token operator">&gt;</span><span class="token punctuation">]</span><span class="token punctuation">[</span>-m <span class="token operator">&lt;</span>魔法数字文件<span class="token operator">&gt;</span><span class="token punctuation">..</span>.<span class="token punctuation">]</span><span class="token punctuation">[</span>文件或目录<span class="token punctuation">..</span>.<span class="token punctuation">]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h3 id="参数" tabindex="-1"><a class="header-anchor" href="#参数"><span>参数</span></a></h3><ul><li>-b 　列出辨识结果时，不显示文件名称。 -xx -c 　详细显示指令执行过程，便于排错或分析程序执行的情形。 -f&lt;名称文件&gt; 　指定名称文件，其内容有一个或多个文件名称时，让file依序辨识这些文件，格式为每列一个文件名称。</li><li>-L 　直接显示符号连接所指向的文件的类别。</li><li>-m&lt;魔法数字文件&gt; 　指定魔法数字文件。</li><li>-v 　显示版本信息。</li><li>-z 　尝试去解读压缩文件的内容。 [文件或目录...] 要确定类型的文件列表，多个文件之间使用空格分开，可以使用shell通配符匹配多个文件。</li></ul><h2 id="xxd" tabindex="-1"><a class="header-anchor" href="#xxd"><span>xxd</span></a></h2><blockquote><p>以2进制或16进制显示文件内容</p></blockquote><h3 id="语法-1" tabindex="-1"><a class="header-anchor" href="#语法-1"><span>语法</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line">xxd <span class="token punctuation">[</span>options<span class="token punctuation">]</span> <span class="token punctuation">[</span>infile <span class="token punctuation">[</span>outfile<span class="token punctuation">]</span><span class="token punctuation">]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="系统服务管理器指令" tabindex="-1"><a class="header-anchor" href="#系统服务管理器指令"><span>系统服务管理器指令</span></a></h2><blockquote><p>实际是将<code>service</code> 和 <code>chkconfig</code> 这两个命令组合到一起</p></blockquote><ul><li>启动服务 <code>systemctl start &lt;服务名&gt;</code></li><li>停止服务 <code>systemctl stop &lt;服务名&gt;</code></li><li>重新启动 <code>systemctl restart &lt;服务名&gt;</code></li><li>查看服务状态 <code>systemctl status &lt;服务名&gt;</code></li><li>设置开机自动启动 <code>systemctl enable &lt;服务名&gt;</code></li><li>设置某服务不自动启动 <code>systemctl disable &lt;服务名&gt;</code></li><li>显示所有已启动的服务 systemctl list-units --type=service</li></ul>`,35)]))}const d=l(n,[["render",t],["__file","command.html.vue"]]),p=JSON.parse('{"path":"/os/linux/command.html","title":"命令","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"常用","slug":"常用","link":"#常用","children":[]},{"level":2,"title":"apt","slug":"apt","link":"#apt","children":[]},{"level":2,"title":"sed","slug":"sed","link":"#sed","children":[{"level":3,"title":"参数说明：","slug":"参数说明","link":"#参数说明","children":[]},{"level":3,"title":"动作说明：","slug":"动作说明","link":"#动作说明","children":[]},{"level":3,"title":"点击查看详情","slug":"点击查看详情","link":"#点击查看详情","children":[]}]},{"level":2,"title":"不挂断运行进程","slug":"不挂断运行进程","link":"#不挂断运行进程","children":[]},{"level":2,"title":"进程管理工具","slug":"进程管理工具","link":"#进程管理工具","children":[{"level":3,"title":"supervisor","slug":"supervisor","link":"#supervisor","children":[]}]},{"level":2,"title":"修改密码","slug":"修改密码","link":"#修改密码","children":[]},{"level":2,"title":"file","slug":"file","link":"#file","children":[{"level":3,"title":"语法","slug":"语法","link":"#语法","children":[]},{"level":3,"title":"参数","slug":"参数","link":"#参数","children":[]}]},{"level":2,"title":"xxd","slug":"xxd","link":"#xxd","children":[{"level":3,"title":"语法","slug":"语法-1","link":"#语法-1","children":[]}]},{"level":2,"title":"系统服务管理器指令","slug":"系统服务管理器指令","link":"#系统服务管理器指令","children":[]}],"git":{"updatedTime":1669361850000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"os/linux/command.md"}');export{d as comp,p as data};
