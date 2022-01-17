# 相关工具
- rustup （Rust版的nvm）
    * 负责管理Rust的安装以及额外的编译目标（如WebAssembly），除此之外还包含一些核心的工具，如cargo（Rust版的npm）、clippy（Rust版的eslint）、rustfmt（Rust版的prettier）
    * [安装](https://www.rust-lang.org/tools/install)


- cargo
  * 默认源：[crates.io](https://crates.io/)
  * 配置文件: Cargo.toml
  * 更多信息可见 [The Manifest Format](https://doc.rust-lang.org/cargo/reference/manifest.html#the-manifest-format)
  * 初始化项目
        * cargo init，在当前文件夹中初始化
        * cargo new，指定一个文件夹初始化


  * 全局安装
     * `cargo install`
  * 安装项目内依赖
        * `cargo install cargo-edit` [cargo-edit](https://github.com/killercup/cargo-edit)
           * 安装后会新增4个子命令，add、rm、upgrade、set-version


  * 运行测试
     * `cargo test`
  * 发布模块
     * `cargo publish`

  