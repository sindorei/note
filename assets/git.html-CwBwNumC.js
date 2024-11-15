import{_ as s,c as a,f as n,o as i}from"./app-LHpjaFTr.js";const l={};function t(o,e){return i(),a("div",null,e[0]||(e[0]=[n(`<h1 id="常用命令" tabindex="-1"><a class="header-anchor" href="#常用命令"><span>常用命令</span></a></h1><ul><li><code>git add .</code></li><li><code>git add -A</code></li><li><code>git commit -m </code></li><li><code>git fetch origin</code></li><li><code>git stash</code> <a href="https://git-scm.com/docs/git-stash" target="_blank" rel="noopener noreferrer">详见</a></li><li><code>git reset --soft</code></li><li><code>git cherry-pick</code></li><li><code>git revert</code></li><li><code>git reflog</code></li></ul><h1 id="git-submodule" tabindex="-1"><a class="header-anchor" href="#git-submodule"><span>git submodule</span></a></h1><ul><li>如果通用部分抽出做成一个公共代码库，用此命令</li><li>为当前工程添加submodule</li><li><code>git submodule add 仓库地址 路径</code></li><li>初始化时submodule的内容不会自动下载</li><li>需执行 <code>git submodule update --init --recursive</code></li></ul><h2 id="clone-submodule" tabindex="-1"><a class="header-anchor" href="#clone-submodule"><span>clone Submodule</span></a></h2><ul><li>采用递归参数 <code>--recursive</code></li><li>第二种方法先clone父项目，再初始化Submodule <ul><li><code>git submodule init</code></li><li><code>git submodule update</code></li></ul></li></ul><h2 id="删除-submodule" tabindex="-1"><a class="header-anchor" href="#删除-submodule"><span>删除 submodule</span></a></h2><ul><li><code>git rm --cached submodulePath</code></li><li><code>rm -rf submodulePath</code></li><li><code>rm .gitmodules</code></li><li><code>vim .git/config</code> 删除submodule相关配置</li></ul><h1 id="配置多个git账号" tabindex="-1"><a class="header-anchor" href="#配置多个git账号"><span>配置多个git账号</span></a></h1><ul><li><code>.ssh</code>目录新增config文件，添加以下内容</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">Host git.xxx.com</span>
<span class="line">  HostName git.xxx.com</span>
<span class="line">  User yourusername</span>
<span class="line">  IdentityFile ~/.ssh/id_rsa</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="标签-tag" tabindex="-1"><a class="header-anchor" href="#标签-tag"><span>标签（tag）</span></a></h1><ul><li>添加tag <ul><li><code>git tag -a tag名称 -m &quot;注释&quot;</code></li></ul></li><li>提交所有tag到远程仓库 <ul><li><code>git push origin --tags</code></li></ul></li><li>提交指定tag到远程仓库 <ul><li><code>git push origin &lt;tagname&gt;</code></li></ul></li><li>删除tag <ul><li><code>git tag -d </code></li></ul></li><li>查看tag <ul><li><code>git tag</code></li></ul></li><li>查看所有tag <ul><li><code>git tag -l</code></li></ul></li></ul><h1 id="指定git命令作用的目录" tabindex="-1"><a class="header-anchor" href="#指定git命令作用的目录"><span>指定git命令作用的目录</span></a></h1><ul><li>git -C <code>&lt;path&gt;</code></li></ul><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line">Building remotely on win-node-16-49 <span class="token keyword">in</span> workspace d:<span class="token punctuation">\\</span>jk<span class="token punctuation">\\</span>workspace<span class="token punctuation">\\</span><span class="token number">1858</span>-abc.def</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> rev-parse --is-inside-work-tree <span class="token comment"># timeout=10</span></span>
<span class="line">Fetching changes from the remote Git repository</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> config remote.origin.url git@git.xxx.com:xxx.git <span class="token comment"># timeout=10</span></span>
<span class="line">Cleaning workspace</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> rev-parse <span class="token parameter variable">--verify</span> HEAD <span class="token comment"># timeout=10</span></span>
<span class="line">Resetting working tree</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> reset <span class="token parameter variable">--hard</span> <span class="token comment"># timeout=10</span></span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> clean <span class="token parameter variable">-fdx</span> <span class="token comment"># timeout=10</span></span>
<span class="line">Fetching upstream changes from git@git.xxx.com:xxx.git</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> <span class="token parameter variable">--version</span> <span class="token comment"># timeout=10</span></span>
<span class="line">using GIT_SSH to <span class="token builtin class-name">set</span> credentials </span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> <span class="token parameter variable">-c</span> <span class="token assign-left variable">core.askpass</span><span class="token operator">=</span>true fetch <span class="token parameter variable">--tags</span> <span class="token parameter variable">--progress</span> git@git.xxx.com:xxx.git +refs/heads/*:refs/remotes/origin/* <span class="token parameter variable">--depth</span><span class="token operator">=</span><span class="token number">1</span></span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> rev-parse <span class="token string">&quot;origin/develop^{commit}&quot;</span> <span class="token comment"># timeout=10</span></span>
<span class="line">Checking out Revision 20976ed9016e480c95ed0842a51852b2f8f3613d <span class="token punctuation">(</span>origin/develop<span class="token punctuation">)</span></span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> config core.sparsecheckout <span class="token comment"># timeout=10</span></span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> checkout <span class="token parameter variable">-f</span> 20976ed9016e480c95ed0842a51852b2f8f3613d</span>
<span class="line"> <span class="token operator">&gt;</span> <span class="token function">git</span> rev-list ee8b6f83d11659c2785605043586cc4c09cc842b <span class="token comment"># timeout=10</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>#　fetch</p><ul><li><code>git fetch</code>命令通常用来查看其他人的进程，因为它取回的代码对你本地的开发代码没有影响。 默认情况下，git fetch取回所有分支（branch）的更新。如果只想取回特定分支的更新，可以指定分支名。</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">git fetch &lt;远程主机名&gt; &lt;分支名&gt;</span>
<span class="line">// 比如，取回origin主机的master分支。</span>
<span class="line"></span>
<span class="line">git fetch origin master</span>
<span class="line">// 所取回的更新，在本地主机上要用&quot;远程主机名/分支名&quot;的形式读取。比如origin主机的master，就要用origin/master读取。</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="rev-parse" tabindex="-1"><a class="header-anchor" href="#rev-parse"><span>rev-parse</span></a></h1><ul><li>https://git-scm.com/docs/git-rev-parse</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">git rev-parse --abbrev-ref HEAD // 当前分支名</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h1 id="远程仓库" tabindex="-1"><a class="header-anchor" href="#远程仓库"><span>远程仓库</span></a></h1><ul><li>查看远程仓库地址 <ul><li><code>git remote -v</code></li></ul></li><li>修改远程仓库地址 <ul><li><code>git remote set-url origin &lt;url&gt;</code></li></ul></li></ul><h1 id="git-log" tabindex="-1"><a class="header-anchor" href="#git-log"><span>git log</span></a></h1><ul><li><p>查找某段代码的提交记录可以用 <code>-S</code> 、<code>-G</code> 参数</p><ul><li><code>git log -S &#39;xixiha&#39;</code></li></ul></li><li><p><code>-p</code> 参数能看到代码的内容</p></li></ul><h1 id="删除本地的远程无效分支" tabindex="-1"><a class="header-anchor" href="#删除本地的远程无效分支"><span>删除本地的远程无效分支</span></a></h1><ul><li><code>git remote prune origin</code></li></ul><h1 id="git-config" tabindex="-1"><a class="header-anchor" href="#git-config"><span>git config</span></a></h1><ul><li>查看配置 <code>git config --list</code></li><li>查看某项配置 <code>git config user.name</code></li><li>设置全局配置 <ul><li><code>git config --global user.name &quot;John Doe&quot;</code></li><li><code>git config --global user.email johndoe@example.com</code></li></ul></li></ul><h1 id="文件大小写" tabindex="-1"><a class="header-anchor" href="#文件大小写"><span>文件大小写</span></a></h1><ul><li>修改了文件大小写想要提交上去 <ul><li>修改配置(不建议)，后面有些git操作可能会提示报错 <ul><li><code>git config core.ignorecase false</code></li></ul></li><li>运行 <code>git mv 修过前文件名 修过后文件名</code></li></ul></li></ul><h1 id="重新历史" tabindex="-1"><a class="header-anchor" href="#重新历史"><span>重新历史</span></a></h1><ul><li>https://git-scm.com/book/zh/v1/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2</li><li>https://help.github.com/en/articles/changing-author-info</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">git filter-branch --env-filter &#39;</span>
<span class="line">OLD_NAME=&quot;xxx&quot;</span>
<span class="line">CORRECT_NAME=&quot;xxx&quot;</span>
<span class="line">CORRECT_EMAIL=&quot;xxx@foxmail.com&quot;</span>
<span class="line"></span>
<span class="line">if [ &quot;$GIT_COMMITTER_NAME&quot; = &quot;$OLD_NAME&quot; ]</span>
<span class="line">then</span>
<span class="line">    export GIT_COMMITTER_NAME=&quot;$CORRECT_NAME&quot;</span>
<span class="line">    export GIT_COMMITTER_EMAIL=&quot;$CORRECT_EMAIL&quot;</span>
<span class="line">fi</span>
<span class="line">if [ &quot;$GIT_AUTHOR_NAME&quot; = &quot;$OLD_NAME&quot; ]</span>
<span class="line">then</span>
<span class="line">    export GIT_AUTHOR_NAME=&quot;$CORRECT_NAME&quot;</span>
<span class="line">    export GIT_AUTHOR_EMAIL=&quot;$CORRECT_EMAIL&quot;</span>
<span class="line">fi</span>
<span class="line">&#39; --tag-name-filter cat -- --branches --tags</span>
<span class="line"></span>
<span class="line">git push --force --tags origin &#39;refs/heads/*&#39;</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="批量删除远程分支" tabindex="-1"><a class="header-anchor" href="#批量删除远程分支"><span>批量删除远程分支</span></a></h1><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">git branch -r   --merged master --list &#39;origin/[^HEADReleasemasterhotfixdevelop]*&#39; | xargs -L 1 git push origin :</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h1 id="git-blame-定位代码责任人" tabindex="-1"><a class="header-anchor" href="#git-blame-定位代码责任人"><span>git blame 定位代码责任人</span></a></h1><p>git blame 文件名</p><p>git blame -L 开始行,结束行 : <code>git blame -L 3,5</code></p><h1 id="git-bisect-查找问题引入版本" tabindex="-1"><a class="header-anchor" href="#git-bisect-查找问题引入版本"><span>git bisect 查找问题引入版本</span></a></h1><h1 id="git-log-查找指定内容的历史记录" tabindex="-1"><a class="header-anchor" href="#git-log-查找指定内容的历史记录"><span>git log 查找指定内容的历史记录</span></a></h1><h1 id="所有命令列表" tabindex="-1"><a class="header-anchor" href="#所有命令列表"><span>所有命令列表</span></a></h1><ul><li><a href="https://git-scm.com/docs/git#_git_commands" target="_blank" rel="noopener noreferrer">git commands</a></li></ul>`,44)]))}const d=s(l,[["render",t],["__file","git.html.vue"]]),r=JSON.parse('{"path":"/common/tools/git.html","title":"常用命令","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"clone Submodule","slug":"clone-submodule","link":"#clone-submodule","children":[]},{"level":2,"title":"删除 submodule","slug":"删除-submodule","link":"#删除-submodule","children":[]}],"git":{"updatedTime":1682412452000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":5,"url":"https://github.com/sindorei"}]},"filePathRelative":"common/tools/git.md"}');export{d as comp,r as data};
