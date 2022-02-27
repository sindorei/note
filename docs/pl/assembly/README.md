# 

# 汇编语言的组成

- 汇编指令
  * 机器码的助记符
- 伪指令
  * 由编译器执行
- 其他符号
  * 编译器识别
  

# CPU对存储器的读写
- 总线
  * 逻辑划分
     * 地址总线
         - CPU通过地址总线来指定存储单元
     * 数据总线
         - CPU与内存或其他器件之间的数据传送
     * 控制总线
         - CPU对外部器件的控制
         

# 执行部件
- 寄存器 Register
  * E开头为扩展的意思，是32位
  * 按用途分
    * 数据寄存器
        * EAX 累加器 Accumulator
           *  存储单元地址的符号表示
           *  (xxx) 表示xxx单元中的内容
        * EBX 基址寄存器 Base
        * ECX 计数器 Count
        * EDX 数据寄存器 Data
        * 低16位组：AX BX CX DX
        * 高8位组 AH BH CH DH
        * 低8位组 AL BL CL DL
        *` MOV AX,0ffH`
    * 指示器变址寄存器组
       * ESI 源变址寄存器 Source Index
       * EDI 目的变址寄存器 Destination Index
       * ESP 堆栈指示器 Stack Pointer
       * EBP 堆栈基址寄存器 Base Pointer
       
# 指令预取部件和指令译码部件
- 指令指示器 EIP
  * 保存下一条将要被CPU执行的指令的偏移地址(EA)
  * 内容由处理器硬件自动设置
  * 不能由指令直接访问
  * 执行转移指令，子程序调用指令等可使其改变

# 分段部件和分页部件

## 分段部件中的段寄存器
- CS 代码段寄存器 Code Segment
- DS 数据段寄存器 Data Segment
- SS 堆栈段寄存器 Stack Segment
- ES 附加数据段寄存器
- FS
- GS

# 80x86的三种工作方式
- 实方式（实地址方式）
- 保护方式（虚地址）
- 虚拟8086方式
  

# 主存储器
- 基本存储单位：位
- 最小寻址单位：字节
- WORD 字：2个相邻的字节
- 双字：4个连续的字节组成，地址为最低字节的地址