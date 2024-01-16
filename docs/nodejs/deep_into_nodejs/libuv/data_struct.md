# libuv数据结构与通用逻辑

## libuv数据结构

### uv_loop_s

每一个事件循环对应一个 uv_loop_s 结构体

```c
1 使用方自定义数据的字段，用于关联上下文
void* data;

2 活跃的 handle 个数，大于 0 则事件循环不会退出，除非显式调用 uv_stop
unsigned int active_handles;

3 handle 队列，包括活跃和非活跃的
void* handle_queue[2]; 

4 request 个数，大于 0 则事件循环不会退出，除非显式调用 uv_stop
union { void* unused[2];  unsigned int count; } active_reqs;

5 事件循环是否结束的标记，由 uv_stop 设置
unsigned int stop_flag;

6 Libuv 运行的一些标记，目前只有 UV_LOOP_BLOCK_SIGPROF，主要是用于 epoll_wait 的时候屏蔽 SIGPROF 信号，防止无效唤醒。
unsigned long flags; 

7 事件驱动模块的 fd，比如调用 epoll_create 返回的 fd
int backend_fd;                    
   
8 pending 阶段的队列                   
void* pending_queue[2];          
           
9 指向需要在事件驱动模块中注册事件的 IO 观察者队列            
void* watcher_queue[2];      

10 watcher_queue 队列的节点 uv__io_t 中有一个 fd 字段，watchers 以 fd 为索引，记录 fd 所关联的 uv__io_t 结构体                       
uv__io_t** watchers;               

11 watchers 相关的数量，在 maybe_resize 函数里设置
unsigned int nwatchers;

12 loop->watchers 中已使用的元素个数，一般为 watcher_queue 队列的节点数
unsigned int nfds;      

13 线程池的子线程处理完任务后把对应的结构体插入到 wq 队列，由主线程在 Poll IO 阶段处理        
void* wq[2];               

14 控制 wq 队列互斥访问，否则多个子线程同时访问会有问题
uv_mutex_t wq_mutex;

15 用于线程池的子线程和主线程通信，参考线程池和线程间通信章节    
uv_async_t wq_async;   

16 用于设置 close-on-exec 时的锁，因为打开文件和设置 close-on-exec 不是原子操作（除非系统支持），所以需要一个锁控制这两个步骤是一个原子操作。
uv_rwlock_t cloexec_lock;  

17 事件循环 close 阶段的队列，由 uv_close 产生
uv_handle_t* closing_handles;       

18 fork 出来的子进程队列                 
void* process_handles[2];    
           
19 事件循环的 prepare 阶段对应的任务队列                   
void* prepare_handles[2];        
            
20 事件循环的 check 阶段对应的任务队列              
void* check_handles[2];        

21 事件循环的 idle 阶段对应的任务队列
void* idle_handles[2];  

21 async_handles 队列，Poll IO 阶段执行 uv__async_io 遍历 async_handles 队列，处理里面 pending 为 1 的节点，然后执行它的回调
void* async_handles[2];         

22 用于线程间通信 async handle 的 IO 观察者。用于监听是否有 async handle 任务需要处理
uv__io_t async_io_watcher;  

23 用于保存子线程和主线程通信的写端 fd                    
int async_wfd;   

24 保存定时器二叉堆结构       
struct {
    void* min; 
    unsigned int nelts;
} timer_heap; 
       
25 管理定时器节点的递增 id
uint64_t timer_counter;      
  
26 当前时间，Libuv 会在每次事件循环的开始和 Poll IO 阶段更新当前时间，然后在后续的各个阶段使用，减少系统调用次数                     
uint64_t time; 
  
27 fork 出来的进程和主进程通信的管道，用于子进程收到信号的时候通知主进程，然后主进程执行子进程节点注册的回调
int signal_pipefd[2];                 

28 用于信号处理的 IO 观察者，类似 async_io_watcher，signal_io_watcher 保存了管道读端 fd 和回调，然后注册到事件驱动模块中，在子进程收到信号的时候，通过 write 写到管道，最后主进程在 Poll IO 阶段执行回调
uv__io_t signal_io_watcher;

29 用于管理子进程退出信号的 handle
uv_signal_t child_watcher;  
  
30 备用的 fd，当服务器处理连接因 fd 耗尽而失败时，可以使用 emfile_fd       
int emfile_fd;   

```

### uv_handle_t

Libuv 中，handle 代表生命周期比较长的对象。例如

一个 prepare handle。
一个 TCP 服务器。

实现上，使用 uv_handle_t 表示，uv_handle_t 类似 C++ 中的基类，有很多子类继承于它，Libuv 主要通过 C 语言宏实现继承的效果。

```c
#define UV_HANDLE_FIELDS  \
            void* data;   \
            其他字段 

struct uv_stream_s {
  UV_HANDLE_FIELDS
  // 拓展的字段
};

```
宏展开：

```c
struct uv_stream_s {
  void* data;
  其他自动
  拓展的字段
};
```

uv_handle_t 的定义：

```c
1 自定义数据，用于关联一些上下文, Node.js 中用于关联 handle 所属的 C++ 对象  
void* data;  
     
2 所属的事件循环     
uv_loop_t* loop;
   
3 handle 类型，比如 TCP、UDP   
uv_handle_type type;
  
4 handle 调用 uv_close 后，在 closing 阶段被执行的回调
uv_close_cb close_cb; 

5 用于插入 handle 队列
void* handle_queue[2];

6 只用于 Windows 平台 
union {               
    int fd;             
     void* reserved[4];  
} u;  

7 当 handle 在 close 队列时，该字段指向下一个 close 节点     
uv_handle_t* next_closing; 
 
8 handle 的状态和标记
unsigned int flags;

```

### uv_stream_s

uv_stream_s 是表示流的结构体。除了继承 uv_handle_t 的字段外，额外定义下面字段

```c
1 等待发送的字节数，当我们往底层写入数据或往对端发送数据时，Libuv 可能会先缓存起来，等待合适的时机再进行写操作
size_t write_queue_size;
         
2 分配内存的函数，用调用方设置，比如 Node.js       
uv_alloc_cb alloc_cb; 
       
3 数据可读事件触发时执行的回调            
uv_read_cb read_cb; 

4 发起连接时，保存连接上下文的结构体
uv_connect_t *connect_req; 
    
5 关闭写端时，保存上下文的结构体
uv_shutdown_t *shutdown_req;   

6 用于插入事件驱动模块的 IO 观察者，注册读写事件
uv__io_t io_watcher;           

7 待发送队列，记录了等待写操作的数据和元信息，和 write_queue_size 配合
void* write_queue[2];     

8 发送完成的队列，write_queue 的节点发生完毕后就会插入 write_completed_queue 队列，等待执行写结束回调   
void* write_completed_queue[2];

9 收到连接时执行的回调
uv_connection_cb connection_cb;

10 socket 操作失败的错误码，比如连接失败
int delayed_error;             

11 accept 返回的 fd 或者 IPC 时收到的文件描述符
int accepted_fd;               

12 用于 IPC，accepted_fd 只能保存一个 fd，queued_fds 用于保存剩下的
void* queued_fds;

```


### uv_async_s

uv_async_s 是 Libuv 中实现异步通信的结构体。继承于 uv_handle_t，额外定义了以下字段。

```c
1 异步事件触发时执行的回调
uv_async_cb async_cb; 

2 用于插入 async->handles 队列
void* queue[2]; 

3 标记是否有任务需要处理，为 1 说明需要执行回调 async_cb 处理任务
int pending;  

```

### uv_tcp_s

uv_tcp_s 继承 uv_handle_s 和 uv_stream_s，代表一个 TCP 客户端或者服务器。


### uv_udp_s

uv_udp_s 用于实现 UDP 模块的功能，实现和 TCP 有点相似，但是因为 UDP 不是面向连接的，和 TCP 还是存在一些差异，所以单独实现。


```c
1 待发送字节数，和 uv_stream_s 类似
size_t send_queue_size;

2 待发送队列节点的个数和下面的 write_queue 配合
size_t send_queue_count;

3 分配接收数据的内存
uv_alloc_cb alloc_cb;  

4 接收完数据后执行的回调
uv_udp_recv_cb recv_cb;

5 插入事件驱动模块的 IO 观察者，实现数据读写
uv__io_t io_watcher;   

6 待发送队列
void* write_queue[2];  

7 发送完成的队列（发送成功或失败），和待发送队列相关，参考 uv_stream_s
void* write_completed_queue[2];  
```


### uv_tty_s

uv_tty_s 继承于 uv_handle_t 和 uv_stream_t。额外定义了下面字段。

```c
1 终端的参数 
struct termios orig_termios; 

2 终端的工作模式
int mode;

```

### uv_pipe_s

uv_pipe_s 继承于 uv_handle_t 和 uv_stream_t。额外定义了下面字段。

```c
1 标记管道是否可用于传递文件描述符
int ipc; 

2 用于 Unix 域通信的文件路径
const char* pipe_fname; 

```

uv_pipe_s 用于实现 IPC，实现上和 TCP 差不多，因为网络编程中，Unix 域和 TCP 使用的接口都是差不多的。和 TCP 不一样的是 uv_pipe_s 监听的是一个路径，并且可以通过 ipc 字段控制是否可以传递文件描述符。


### uv_prepare_s、uv_check_s、uv_idle_s

上面三个结构体定义是类似的，它们都继承 uv_handle_t，额外定义了两个字段。

```c
1 prepare、check、idle 阶段回调
uv_xxx_cb xxx_cb; 

2 用于插入 prepare、check、idle 队列
void* queue[2];   

```

这三个结构体是类似的，对应了事件循环的三个不同阶段，这三个阶段也在不同的时机被处理。

### uv_timer_s

uv_timer_s 继承 uv_handle_t，额外定义了下面几个字段。

```c
1 超时回调 
uv_timer_cb timer_cb; 

2 插入二叉堆的字段
void* heap_node[3];

3 超时时间
uint64_t timeout; 

4 超时后是否继续开始重新计时，是的话重新插入二叉堆
uint64_t repeat; 

5 id 标记，用于插入二叉堆的时候对比
uint64_t start_id

```

uv_timer_s 是用于实现定时器的结构体，除了遵循 handle 字段外，还额外记录了超时时间、回调、是否是定时超时等重要信息。Libuv 中，一个定时器对应一个 uv_timer_s 结构体，用最小堆进行管理。

### uv_process_s

uv_process_s 继承 uv_handle_t，额外定义了

```c
1 进程退出时执行的回调
uv_exit_cb exit_cb;

2 进程 id
int pid;

3 用于插入队列，进程队列或者 pending 队列
void* queue[2];

4 退出码，进程退出时设置
int status;  

```
uv_process_s 是用于管理子进程的结构体，一个子进程对应一个 uv_process_s 结构体。uv_process_s 记录了子进程 pid、退出回调、退出码信息等，然后通过 queue 字段插入 Libuv 维护的子进程队列，当子进程退出时，就会从队列中移除对应的 uv_process_s，并执行 exit 回调。


### uv_fs_event_s

uv_fs_event_s 继承 uv_handle_t，额外定义了

```c
1 监听的文件路径(文件或目录)
char* path;

2 文件改变时执行的回调
uv_fs_event_cb cb;

```

uv_fs_event_s 用于监听文件变化，通常是基于操作系统提供的能力，比如 Linux 的 inotify 机制，后面会具体分析。

### uv_fs_poll_s

uv_fs_poll_s 继承 uv_handle_t，额外定义了:

```c
1 poll_ctx 指向一个 poll_ctx 结构体
void* poll_ctx;

struct poll_ctx {
    // 对应的 handle
    uv_fs_poll_t* parent_handle; 
    // 标记是否开始轮询和轮询时的失败原因
    int busy_polling;
    // 多久检测一次文件内容是否改变
    unsigned int interval;
    // 每一轮轮询时获取文件内容的时间点
    uint64_t start_time;
    // 所属事件循环
    uv_loop_t* loop;
    // 文件改变时回调
    uv_fs_poll_cb poll_cb;
    // 定时器，用于定时超时后轮询
    uv_timer_t timer_handle;
    // 记录轮询的一下上下文信息，文件路径、回调等
    uv_fs_t fs_req; 
    // 轮询时保存操作系统返回的文件信息
    uv_stat_t statbuf;
     // 监听的文件路径，字符串的值追加在结构体后面
    char path[1];
};

```

uv_fs_poll_s 用于监听文件变化，但是和 uv_fs_event_s 不一样的是，uv_fs_poll_s 是使用定时轮询的机制实现的，所以效率上比较低，但是兼容性更好


### uv_poll_s

uv_poll_s 继承于 uv_handle_t，额外定义了下面字段。

```c
1 监听的 fd 感兴趣的事件触发时执行的回调
uv_poll_cb poll_cb;

2 保存了 fd 和回调的 IO 观察者，注册到事件驱动模块中
uv__io_t io_watcher;
```

uv_poll_s 用于监听 fd 感兴趣的事件，相当于把事件驱动模块的能力暴露出来给开发者使用，Node.js 的 DNS 模块用到了这个能力。


### uv_signal_s

uv_signal_s 继承 uv_handle_t，额外定义了以下字段

```c
1 收到信号时的回调
uv_signal_cb signal_cb;

2 注册的信号
int signum;

3 用于插入红黑树，进程把感兴趣的信号和回调封装成 uv_signal_s，然后插入到红黑树，信号到来时，进程在信号处理号中把通知写入管道，通知 Libuv。Libuv 在 Poll IO 阶段会执行进程对应的回调。红黑树节点的定义如下
struct {                         
    struct uv_signal_s* rbe_left;  
    struct uv_signal_s* rbe_right; 
    struct uv_signal_s* rbe_parent;
    int rbe_color;                 
} tree_entry; 

4 收到的信号个数
unsigned int caught_signals;     

5 已经处理的信号个数
unsigned int dispatched_signals;

```

uv_signal_s 用于信号处理，主要是封装了需要监听的信号和回调。Libuv 中，使用红黑树管理信号的处理，因为操作系统中，一个信号只能注册一个处理函数，所以 Libuv 为了支持一个信号对应多个处理函数，需要在操作系统上层再做一层封装，uv_signal_s 就是为了实现一个信号对应多个处理函数。


### uv_req_s

在 Libuv 中，uv_req_s 也类似 C++ 基类的作用，有很多子类继承于它，request 代表一次请求，比如读写一个文件，读写 socket，查询 DNS。任务完成后这个 request 就结束了。request 可以和 handle 结合使用，比如在一个 TCP 服务器上（handle）写一个数据（request），也可以单独使用一个 request，比如 DNS 查询或者文件读写。uv_req_s 的定义:

```c
1 自定义数据
void* data; 
 
2 request 类型，比如文件操作、DNS 查询
uv_req_type type;  
 
3 保留字段 
void* reserved[6];

```

uv_req_s 表示一次请求操作，是其他具体请求类型的基础数据结构，从定义中可以看到，它本身并没有太多信息。接下来看看一下具体请求类型。

### uv_shutdown_s

uv_shutdown_s 继承 uv_req_s，额外定义的字段

```c
1 被操作的流，比如 TCP
uv_stream_t* handle;

2 关闭流的写端后执行的回调
uv_shutdown_cb cb;
```

uv_shutdown_s 用于发起一个关闭流的写端的请求，因为流是全双工的，关闭写端意味着不能写 / 发送数据了


### uv_write_s

uv_write_s 继承 uv_req_s，额外定义的字段

```c
1 写完后执行的回调
uv_write_cb cb;

2 需要传递的文件描述符，在 send_handle 的 fd 中
uv_stream_t* send_handle; 

3 往哪个 handle 写入
uv_stream_t* handle;

4 用于插入队列
void* queue[2];     

5 当前待写的 buffer 下标     
unsigned int write_index;

6 buffer 总数
unsigned int nbufs;     

7 存储数据的 buffer，uv_buf_t 记录了数据的开始地址和长度，4 个不够则需要动态分配内存     
uv_buf_t bufsml[4];
uv_buf_t* bufs;          

8 写出错的错误码 
int error;    

```

uv_write_s 表示一次写请求，比如在 TCP 流上发送数据，对于 Unix 域，还可以发送文件描述符。uv_write_s 里面记录了数据的开始地址和长度等信息，如果流不可写则先插入流的待写队列，等待可写时执行写操作，并更新元数据，比如是否写完了，还有多少没写等。


### uv_connect_s

uv_connect_s 继承 uv_req_s，额外定义的字段

```c
1 连接成功后执行的回调
uv_connect_cb cb;

2 对应的流，比如 TCP
uv_stream_t* handle;

3 用于插入队列
void* queue[2]; 

```

uv_connect_s 表示发起连接请求并标记当前正在发起一个连接请求。连接是以非阻塞的方式发起的（调用系统的 connect 函数后，不会导致进程阻塞），然后注册事件，等到事件触发时再判断是否连接成功。


### uv_udp_send_s

uv_udp_send_s 继承 uv_req_s，额外定义的字段

```c
1 所属 handle
uv_udp_t* handle;

2 回调
uv_udp_send_cb cb;

3 用于插入待发送队列
void* queue[2];              

4 发送的目的地址
struct sockaddr_storage addr;

5 保存了发送数据的缓冲区和个数
unsigned int nbufs;           
uv_buf_t* bufs;               
uv_buf_t bufsml[4];

6 发送状态或成功发送的字节数
ssize_t status;              

7 发送完执行的回调（发送成功或失败）
uv_udp_send_cb send_cb;  

```

uv_udp_send_s 表示一次发送 UDP 数据的请求，和 TCP 的类似。

### uv_getaddrinfo_s

uv_getaddrinfo_s 继承 uv_req_s，额外定义的字段

```c
1 所属事件循环
uv_loop_t* loop;

2 用于异步 DNS 解析时插入线程池任务队列的节点
struct uv__work work_req; 

3 DNS 解析完后执行的回调
uv_getaddrinfo_cb cb;     

4 DNS 查询的配置
struct addrinfo* hints;   
char* hostname;           
char* service;         

5 DNS 解析结果   
struct addrinfo* addrinfo;

6 DNS 解析的返回码
int retcode;

```

uv_getaddrinfo_s 表示一次通过域名查询 IP 的 DNS 请求，主要是记录了查询的上下文信息。

### uv_getnameinfo_s

uv_getnameinfo_s 继承 uv_req_s，额外定义的字段

```c
1 所属事件循环 
uv_loop_t* loop;

2 用于异步 DNS 解析时插入线程池任务队列的节点
struct uv__work work_req;        

3 回调
uv_getnameinfo_cb getnameinfo_cb;

4 需要查询的地址信息
struct sockaddr_storage storage; 

5 指示查询返回的信息
int flags;                       

6 查询返回的信息
char host[NI_MAXHOST];           
char service[NI_MAXSERV];        

7 查询返回码
int retcode;

```

uv_getnameinfo_s 表示一次通过 IP 和端口查询域名和服务的 DNS 请求，主要是记录了查询的上下文信息。

### uv_work_s

uv_work_s 继承 uv_req_s，额外定义的字段

```c
1 所属事件循环
uv_loop_t* loop;

2 处理任务的函数
uv_work_cb work_cb;

3 处理完任务后执行的函数
uv_after_work_cb after_work_cb;

4 封装一个 work 插入到线程池队列，work_req 的 work 和 done 函数是 work_cb 和after_work_cb 的 wrapper
struct uv__work work_req;

```

uv_work_s 用于往线程池提交任务。work_cb 和 after_work_cb 是业务传入的回调，分别表示具体需要执行的逻辑和执行完任务后执行的回调。uv__work 定义如下。

```c
struct uv__work {
  void (*work)(struct uv__work *w);
  void (*done)(struct uv__work *w, int status);
  struct uv_loop_s* loop;
  void* wq[2];
};
```

wq 用于插入线程池的任务队列，然后等待子线程的处理，work 和 done 用于记录 Libuv 的两个函数，具体是对刚才 work_cb 和 after_work_cb 的简单封装。

### uv_fs_s

uv_fs_s 继承 uv_req_s，额外定义的字段

```c
1 文件操作类型
uv_fs_type fs_type;

2 所属事件循环
uv_loop_t* loop;

3 文件操作完成的回调
uv_fs_cb cb;

4 文件操作的返回码
ssize_t result;

5 文件操作返回的数据
void* ptr;

6 文件操作路径
const char* path;

7 文件的 stat 信息
uv_stat_t statbuf;  

8 文件操作涉及到两个路径时，保存目的路径，比如复制文件时
const char *new_path;    

9 文件描述符
uv_file file;            

10 文件标记
int flags;               

11 操作模式
mode_t mode;      

12 写文件时传入的数据和个数       
unsigned int nbufs;      
uv_buf_t* bufs;          

13 文件偏移
off_t off;               

14 保存需要设置的 uid 和 gid，例如 chmod 的时候
uv_uid_t uid;            
uv_gid_t gid;            

15 保存需要设置的文件修改、访问时间，例如 fs.utimes 的时候
double atime;            
double mtime;            

16 异步的时候用于插入任务队列，保存工作函数，回调函数
struct uv__work work_req;

17 保存读取数据。例如 read 和 sendfile
uv_buf_t bufsml[4];  

```

uv_fs_s 表示一次文件操作请求，是一个大而全的结构体。除了一些通用的字段外，有很多字段是和文件操作类型相关的。


## Libuv通用逻辑

### uv__handle_init

在初始化一个 handle 时会调用 uv__handle_init，比如初始化一个 stream 或者 timer。uv__handle_init 主要做一些初始化的操作，包括初始化 handle 的类型，设置 REF 标记，插入handle 队列。

```c
#define uv__handle_init(loop_, h, type_)  
    do {                           
        (h)->loop = (loop_);        
        (h)->type = (type_);        
        (h)->flags = UV_HANDLE_REF;                 
        QUEUE_INSERT_TAIL(&(loop_)->handle_queue, &(h)->handle_queue);
        (h)->next_closing = NULL 
    }                              
    while (0)  

```

### uv__handle_start

uv__handle_start 通常在 uv__handle_init 后调用，表示启用这个 handle，例如启动一个定时器，设置标记 handle 为 ACTIVE 状态，如果之前设置了 REF 标记，则 active handle 的个数加一，active handle 数会影响事件循环的退出。

```c
#define uv__handle_start(h)           
    do {                           
        if (((h)->flags & UV_HANDLE_ACTIVE) != 0) break;                            
        (h)->flags |= UV_HANDLE_ACTIVE;              
        if (((h)->flags & UV_HANDLE_REF) != 0)   
            (h)->loop->active_handles++;       
    }                             
    while (0)  

```


### uv__handle_stop

uv__handle_stop 和 uv__handle_start 相反。uv__handle_stop 会修改 handle 的状态和修改 active handle 的数量，但是它不会把 handle 移出事件循环的 handle 队列。

```c
#define uv__handle_stop(h)           
  do {                         
    if (((h)->flags & UV_HANDLE_ACTIVE) == 0) break;    
    (h)->flags &= ~UV_HANDLE_ACTIVE;  
    if (((h)->flags & UV_HANDLE_REF) != 0) uv__active_handle_rm(h);  
  }                              
  while (0)  

```

Libuv中 handle 有 REF 和 ACTIVE 两个状态。当一个 handle 调用 xxx_init 函数的时候，它首先被打上 REF 标记，并且插入 loop->handle 队列。当 handle 调用 xxx_start 函数的时候，它被打上 ACTIVE 标记，如果是 REF 状态则 active handle 的个数加一，当 handle 调用 xxx_stop 时，会消除 ACTIVE 状态，如果 handle 同时是 REF 状态则 active handle 数减 1。只有 ACTIVE 状态的 handle 才会影响事件循环的退出。当我们不再使用一个 handle 时，可以调用 uv_close，uv_close 通常会先调用 xxx_stop，然后把 handle 移出 handle 队列并支持执行一个回调。状态变更图如下（虚线代表数据结构被移出队列）。


### uv__handle_ref

uv__handle_ref 标记 handle 为 REF 状态，如果 handle 是 ACTIVE 状态，则 active handle 数加一。

```c
#define uv__handle_ref(h)             
  do {                           
    if (((h)->flags & UV_HANDLE_REF) != 0) break;         
    (h)->flags |= UV_HANDLE_REF;     
    if (((h)->flags & UV_HANDLE_CLOSING) != 0) break;   
    if (((h)->flags & UV_HANDLE_ACTIVE) != 0) uv__active_handle_add(h);
  }                              
  while (0)

```


### uv__handle_unref

uv__handle_unref 用于去掉 handle 的 REF 状态，如果 handle 是 ACTIVE 状态，则 active handle数减一。

```c
#define uv__handle_unref(h)               
  do {                           
    if (((h)->flags & UV_HANDLE_REF) == 0) break;  
    (h)->flags &= ~UV_HANDLE_REF;  
    if (((h)->flags & UV_HANDLE_CLOSING) != 0) break;
    if (((h)->flags & UV_HANDLE_ACTIVE) != 0) uv__active_handle_rm(h); 
  }                            
  while (0)

```



### uv__req_init

uv__req_init 初始化请求的类型，并记录请求的个数，比如 DNS 查询、TCP 连接，会影响事件循环的退出。

```c
#define uv__req_init(loop, req, typ) 
  do {                          
    (req)->type = (typ);      
    (loop)->active_reqs.count++;
  }                            
  while (0) 

```


### uv__req_register

uv__req_register 也用于请求的个数加一，比如发起一个文件操作，会影响事件循环的退出。
    
```c
#define uv__req_register(loop, req)            
  do {                           
    (loop)->active_reqs.count++; 
  }                            
  while (0)  
```


### uv__req_unregister

uv__req_unregister 用于请求的个数减一，在请求结束时调用。

```c
#define uv__req_unregister(loop, req) 
  do {                          
    (loop)->active_reqs.count--;
  }                              
  while (0)
```