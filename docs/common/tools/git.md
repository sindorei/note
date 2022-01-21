# 常用命令
- `git add .`
- `git add -A`
- `git commit -m `
- `git fetch origin`

# git submodule
- 如果通用部分抽出做成一个公共代码库，用此命令
- 为当前工程添加submodule
- `git submodule add 仓库地址 路径`
- 初始化时submodule的内容不会自动下载
- 需执行 `git submodule update --init --recursive`
## clone Submodule
- 采用递归参数 `--recursive`
- 第二种方法先clone父项目，再初始化Submodule
  * `git submodule init`
  * `git submodule update`
## 删除 submodule
- `git rm --cached submodulePath`
- `rm -rf submodulePath`
- `rm .gitmodules`
- `vim .git/config` 删除submodule相关配置
# 配置多个git账号
- `.ssh`目录新增config文件，添加以下内容
```
Host git.17usoft.com
  HostName git.17usoft.com
  User wp10081
  IdentityFile ~/.ssh/id_rsa
```

# 标签（tag）

- 添加tag
  * `git tag -a tag名称 -m "注释"`
- 提交所有tag到远程仓库
  * `git push origin --tags`
- 提交指定tag到远程仓库
  * `git push origin <tagname>`
- 删除tag
  * `git tag -d `
- 查看tag
  * `git tag`
- 查看所有tag
  * `git tag -l`
  

# 指定git命令作用的目录
- git -C <path>


```
Building remotely on win-node-16-49 in workspace d:\jk\workspace\1858-gny.airtest
 > git rev-parse --is-inside-work-tree # timeout=10
Fetching changes from the remote Git repository
 > git config remote.origin.url git@git.17usoft.com:flightfrontend/tc-flight-flightbook.git # timeout=10
Cleaning workspace
 > git rev-parse --verify HEAD # timeout=10
Resetting working tree
 > git reset --hard # timeout=10
 > git clean -fdx # timeout=10
Fetching upstream changes from git@git.17usoft.com:flightfrontend/tc-flight-flightbook.git
 > git --version # timeout=10
using GIT_SSH to set credentials 
 > git -c core.askpass=true fetch --tags --progress git@git.17usoft.com:flightfrontend/tc-flight-flightbook.git +refs/heads/*:refs/remotes/origin/* --depth=1
 > git rev-parse "origin/develop^{commit}" # timeout=10
Checking out Revision 20976ed9016e480c95ed0842a51852b2f8f3613d (origin/develop)
 > git config core.sparsecheckout # timeout=10
 > git checkout -f 20976ed9016e480c95ed0842a51852b2f8f3613d
 > git rev-list ee8b6f83d11659c2785605043586cc4c09cc842b # timeout=10
```


#　fetch
- `git fetch`命令通常用来查看其他人的进程，因为它取回的代码对你本地的开发代码没有影响。
默认情况下，git fetch取回所有分支（branch）的更新。如果只想取回特定分支的更新，可以指定分支名。

```
git fetch <远程主机名> <分支名>
// 比如，取回origin主机的master分支。

git fetch origin master
// 所取回的更新，在本地主机上要用"远程主机名/分支名"的形式读取。比如origin主机的master，就要用origin/master读取。

```


# rev-parse
- https://git-scm.com/docs/git-rev-parse
```
git rev-parse --abbrev-ref HEAD // 当前分支名
```

# 远程仓库
- 查看远程仓库地址
    *  `git remote -v`
- 修改远程仓库地址
    * `git remote set-url origin <url>`


# git log 
- 查找某段代码的提交记录可以用 `-S` 、`-G` 参数
  * `git log -S 'xixiha'`
  
- `-p` 参数能看到代码的内容


# 删除本地的远程无效分支
- `git remote prune origin`

# git config
- 查看配置 `git config --list`
- 查看某项配置 `git config user.name`
- 设置全局配置
  * `git config --global user.name "John Doe"`
  * `git config --global user.email johndoe@example.com`
  

# 文件大小写
- 修改了文件大小写想要提交上去
  * 修改配置(不建议)，后面有些git操作可能会提示报错
     * `git config core.ignorecase false`
  * 运行 `git mv 修过前文件名 修过后文件名`
  

# 重新历史
- https://git-scm.com/book/zh/v1/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2
- https://help.github.com/en/articles/changing-author-info

```
git filter-branch --env-filter '
OLD_NAME="xxx"
CORRECT_NAME="xxx"
CORRECT_EMAIL="xxx@foxmail.com"

if [ "$GIT_COMMITTER_NAME" = "$OLD_NAME" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_NAME" = "$OLD_NAME" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags

git push --force --tags origin 'refs/heads/*'
```


# 批量删除远程分支
```
git branch -r   --merged master --list 'origin/[^HEADReleasemasterhotfixdevelop]*' | xargs -L 1 git push origin :
```
# git blame 定位代码责任人

git blame 文件名

git blame -L 开始行,结束行 :
`git blame -L 3,5`

# git bisect 查找问题引入版本

# git log 查找指定内容的历史记录


# 所有命令列表
- [git commands](https://git-scm.com/docs/git#_git_commands)