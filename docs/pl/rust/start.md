# NodeJs to Rust

## 相关工具
- rustup （Rust版的nvm）
    * 负责管理Rust的安装以及额外的编译目标（如WebAssembly），除此之外还包含一些核心的工具，如cargo（Rust版的npm）、clippy（Rust版的eslint）、rustfmt（Rust版的prettier）
    * [安装](https://www.rust-lang.org/tools/install)
    * `rustup show` 查看当前安装的信息
    * `rustup update` 更新到最新版本
    * `rust-toolchain.toml` 申明工具链

- cargo
  * 默认源：[crates.io](https://crates.io/)
  * 配置文件: Cargo.toml，格式为[toml](https://toml.io/en/)
        * 更多配置信息见 [The Manifest Format](https://doc.rust-lang.org/cargo/reference/manifest.html#the-manifest-format)
  * 初始化项目
        * cargo init，在当前文件夹中初始化
        * cargo new，指定一个文件夹初始化

  * 全局安装工具
     * `cargo install`
     * `cargo install cargo-edit` [cargo-edit](https://github.com/killercup/cargo-edit)
           * 安装后会新增4个子命令，add、rm、upgrade、set-version
     * 安装在cargo的bin目录，通常是` ~/.cargo/bin`
  * 安装依赖
     * `cargo add [dep]`

  * 运行测试
     * `cargo test`
  * 发布模块
     * `cargo publish`
  * 运行任务
    * `cargo run` 运行一个代码
    * `cargo bench` 分析一段代码的性能
    * `cargo build`
    * `cargo clean` 清空打包目录（默认是target）
    * `cargo doc`生成文档
    * [build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html) 构建之前运行预构建等步骤
    * [just](https://github.com/casey/just)、cargo-make、cargo-cmd


- Workspaces & monorepos
  * 根目录中创建`Cargo.toml`文件

```toml
[workspace]
members = [
  "crates/*"
]
```
  * workspace中相互引用的各个模块可以指向本地的文件夹作为依赖项

```toml
[dependencies]
other-project = { path = "../other-project" }

```

- 额外工具
  * cargo-edit
  * cargo-workspaces
  * cargo-expand
  * tomlq



## vs code 配置
- 插件 [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)