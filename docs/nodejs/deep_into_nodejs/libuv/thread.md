# libuv 线程池与线程间通信

## 线程的概念和使用

在操作系统中，线程是一个代码的执行流，是操作系统调度的基本单元。

```c
#include <stdio.h>
#include <pthread.h>

void *start(void *arg)
{
    // 执行自定义代码
    // 函数执行完之后，线程也就退出了
}

int main()
{
    pthread_t thread_id;
    pthread_create(&thread_id, NULL, start, NULL);
    pthread_join(thread_id);
    // ...
    return 0;
}
```

上面的代码就创建了一个线程，这个线程从 start 函数开始执行，创建完线程后，主线程和子线程谁先执行完是不确定的，这取决于操作系统的调度。如果主线程先执行并结束了，子线程也会被终止执行，所以通常主线程需要调用 pthread_join 等待子线程执行完毕后再退出。通过创建线程，我们可以在一个进程中同时执行多份代码。在多核的环境下，多个线程可以并行执行。在单核情况下，多个线程会轮流执行。

除了在系统层面拥有这些特性以外，在进程里，多个线程共享进程的很多资源，比如代码、内存，打开的文件等等，所以说线程是轻量级的进程，但是线程有自己的栈，用于执行代码。因为线程是共享进程内存的，所以多个线程间可以直接基于进程的内存进行通信。

线程间通信:

```c++
#include <unistd.h>
#include <thread> 
#include <deque>
#include <iostream>
#include <mutex>
#include <condition_variable>

const int THREADS = 3;
std::thread threads[THREADS];
std::condition_variable condition_variable;
std::deque<int> requests;
std::mutex mutex;

void worker() {
    while (1) {
        {
            std::unique_lock<std::mutex> lock(mutex);
            while (requests.size() == 0)
            {
                condition_variable.wait(lock);
            }
            int num = requests.front();
            requests.pop_front();
            std::cout<<"consumer: "<<num<<", thread: "<<(uint64_t)pthread_self()<<std::endl;
        }
    }
}

int main() 
{ 
   
    for (int i = 0; i < THREADS; i++) {
        threads[i] = std::thread(worker);
    }
    int j = 0;
    while(1) {
        {   
            sleep(1);
            std::lock_guard<std::mutex> lock(mutex);
            requests.push_back(j++);
            condition_variable.notify_all();
        }
    }

    for (int i = 0; i < THREADS; i++) {
        threads[i].join();
    }

    return 0;
} 

```

上面的代码中定义了一个共享数据结构 requests，主线程负责不断生产数据，由多个子线程负责消费。因为多个线程随时可能被操作系统切换执行，所以需要使用互斥变量 mutex 来保证多个线程互斥访问共享的数据结构，另外，当消费完数据时，消费者（子线程）可以使用条件变量让自己处于等待状态，这样操作系统就会调度其他线程执行，当生产者生产新的数据后，再通过 notify_all 通知消费者。这就是线程间通信的一种实现方式，其他实现方式在思路上都类似。

## 线程间通信

了解了线程的基本概念和使用后，接下来看看 Libuv 中的线程。不过，我们不会讲 Libuv 中线程的实现，因为它本质上是对 C API 的一些封装，我们只关注线程池和线程间通信的实现。下面，我们先来看一下线程间通信的实现。

线程间通信是使用 uv_async_t 结构体实现的。首先看 uv_async_t 的初始化函数 uv_async_init。

```c
int uv_async_init(uv_loop_t* loop,
                  uv_async_t* handle,
                  uv_async_cb async_cb) {
                                  
        // 给 Libuv 注册一个用于异步通信的 IO 观察者
        uv__async_start(loop);
        // 设置相关字段，给 Libuv 插入一个 handle
        uv__handle_init(loop, (uv_handle_t*)handle, UV_ASYNC);
        // 设置回调
        handle->async_cb = async_cb;
        // 标记是否有任务完成了
        handle->pending = 0;
        // 插入 async 队列，Poll IO 阶段判断是否有任务与完成
        QUEUE_INSERT_TAIL(&loop->async_handles, &handle->queue);
        uv__handle_start(handle);

        return 0;
}
```

从上面的代码中可以看到 uv_async_init 的逻辑非常简单，就是初始化 async handle 的一些字段，然后把 handle 插入async_handle 队列中，而且 Libuv 使用 loop->async_handles 记录所有的 uv_async_t 结构体。另外这里还有个 uv__async_start 函数，它是做什么的呢？

```c
// 初始化异步通信的 IO 观察者
static int uv__async_start(uv_loop_t loop) {
    int pipefd[2];
    int err;
    /*
        父子线程通信时，Libuv 是优先使用 eventfd，如果不支持会回退到匿名管道。
        如果是匿名管道，loop->async_io_watcher.fd 是管道的读端，loop->async_wfd 是管道的写端
        如果是 eventfd，loop->async_io_watcher.fd 是读端也是写端。async_wfd 是 -1
        
        所以这里判断 loop->async_io_watcher.fd 而不是 async_wfd 的值
    */
    if (loop->async_io_watcher.fd != -1)
        return 0;
    // 通过 eventfd 机制，获取一个用于进程间通信的 fd
    err = uv__async_eventfd();
    // 成功则保存起来，否则使用管道作为降级方案
    if (err >= 0) {
        pipefd[0] = err;
        pipefd[1] = -1;
    }
    else if (err == UV_ENOSYS) {
        // 创建一个管道，两个 fd 保存到 pipefd 数组
        err = uv__make_pipe(pipefd, UV__F_NONBLOCK);
    }
    // 初始化 IO 观察者 async_io_watcher，回调为 uv__async_io，fd 为 pipefd[0]，即读端
    uv__io_init(&loop->async_io_watcher, uv__async_io, pipefd[0]);
    // 注册 IO 观察者到事件驱动模块里，并注册需要监听的事件 POLLIN，等待可读事件
    uv__io_start(loop, &loop->async_io_watcher, POLLIN);
    // 用于主线程和子线程通信的 fd，管道的写端，子线程使用
    loop->async_wfd = pipefd[1];
    
    return 0;
}

```

uv__async_start 用于创建主线程和子线程通信的通道，它只会执行一次。当子线程完成任务时，就可以通过这个通道的写端写入数据，通知主线程有任务完成，而主线程会在 Poll IO 阶段检测到通道的读端有数据到来，再进行处理，主要逻辑是如下所示。

申请用于主线程和子线程通信的文件描述符。
把读端和回调封装到 IO 观察者 loop->async_io_watcher 中，再注册 IO 观察者到事件循环。
写端保存在 loop->async_wfd，子线程完成任务后往写端写入标记通知主线程。
通过上面的逻辑可以看到，loop->async_io_watcher 会作为所有 uv_async_t 结构体的 IO 观察者。第一次注册 uv_async_t 结构体到 async_handle 队列时会初始化 IO 观察者，如果再次注册 一 个 async_handle，只会在 loop->async_handle 队列和 handle 队列插入一个节点，而不是新增一个 IO 观察者。


当有任务需要处理时，如何通知主线程

```c
int uv_async_send(uv_async_t* handle) {
    /* Do a cheap read first. */
    if (ACCESS_ONCE(int, handle->pending) != 0)
            return 0;
    /*
        设置 async handle的 pending 标记为 1
        如果 pending 是 0 ，则设置为 1，返回 0 ，如果是 1 则返回 1 ，
        所以同一个 handle 如果多次调用该函数是没有副作用的
    */
    if (cmpxchgi(&handle->pending, 0, 1) == 0)
        // 设置 IO 观察者有事件触发
        uv__async_send(handle->loop);
    return 0;
}
```

uv_async_send 最终会调用 uv__async_send。

```c
static void uv__async_send(uv_loop_t* loop) {
    const void* buf;
    ssize_t len;
    int fd;
    int r;
    
    buf = "";
    len = 1;
    // 获取异步通信管道的写端
    fd = loop->async_wfd;
    // 执行写触发管道的可写事件
    write(fd, buf, len);
}
```
uv__async_send 最后调用 write 函数通知主线程，结构图如下。

刚才提到，初始化第一个 uv_async_t 时会在事件循环中注册一个 IO 观察者，所以当主线程执行到 Poll IO 阶段时，就会发现有可读事件触发。那么事件触发后如何执行的回调呢？

```c
static void uv__async_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
    char buf[1024];
    ssize_t r;
    QUEUE queue;
    QUEUE* q;
    uv_async_t* h;
    for (;;) {
        // 判断通信内容
        r = read(w->fd, buf, sizeof(buf));
        // 如果数据等于 buf 的长度，说明可能还有数据，接着读，直到不等于 buf 大小
        if (r == sizeof(buf))
            continue;
        // 不等于 -1，说明读成功，但读取大小小于 buf 大小，说明读完了
        if (r != -1)
            break;
        // 失败的时候返回- 1 ，errno 是错误码
        // 说明没有数据了，即读完了
        if (errno == EAGAIN || errno == EWOULDBLOCK)
            break;
        // 被信号中断，继续读
        if (errno == EINTR)
            continue;
        // 出错，发送 abort 信号
        abort();
    }
    // 把队列里的节点移到 queue 变量中
    QUEUE_MOVE(&loop->async_handles, &queue);
    while (!QUEUE_EMPTY(&queue)) {
        // 逐个遍历队列中的节点
        q = QUEUE_HEAD(&queue);
        // 根据结构体字段获取结构体首地址
        h = QUEUE_DATA(q, uv_async_t, queue);
        // 从队列中移除该节点
        QUEUE_REMOVE(q);
        // 重新插入 async_handles 队列，等待下次事件
        QUEUE_INSERT_TAIL(&loop->async_handles, q);
        /*
            将第一个参数和第二个参数进行比较，如果相等，
            则将第三参数写入第一个参数，返回第二个参数的值，
            如果不相等，则返回第一个参数的值。
        */
        /*
            判断哪些 async 被触发了。pending 在 uv_async_send 里设置成 1 ，
            如果 pending 等于 1 ，则清 0 ，返回 1，
            如果 pending等于 0 ，则返回 0
        */
        if (cmpxchgi(&h->pending, 1, 0) == 0)
            continue;
        // 执行上层回调
        h->async_cb(h);
    }
}
```

首先，uv__async_io 会不断消费写端写入的数据，直到消费完毕。如果只读取了一部分，下次哪怕没有任务需要处理，事件驱动模块也会通知 Libuv 有任务处理。这些无效操作之所以出现，是因为 Libuv 中事件驱动模块的工作模式是水平触发的。

消费完数据后，uv__async_io 会遍历 loop->async_handles 队里中所有的 uv_async_t，通过 uv_async_t->pending 判断哪个 uv_async_t 有任务完成，接着执行该 uv_async_t 的回调。

好，了解了原理后，我们来看一下如何使用 async handle 机制来实现线程间通信, [具体可参考](https://github.com/theanarkh/nodejs-book/tree/main/src/async)


```c
#include "uv.h"

int main() {
  uv_async_t async_handle;
  uv_thread_t thread;
  
  uv_async_init(uv_default_loop(), &async_handle, [](uv_async_t* handle) {
    printf("done\n");
    uv_close((uv_handle_t*) handle, nullptr);
  });

  uv_thread_create(&thread, [] (void* args) {
    uv_async_send((uv_async_t*)args);
  }, &async_handle);
  
  uv_run(uv_default_loop(), UV_RUN_DEFAULT);
  uv_thread_join(&thread);
  return 0;
}

```

首先在主线程中初始化一个 uv_async_t 结构体并设置回调，再创建一个子线程，最后通过 uv_run 启动来事件循环。因为 uv_async_t 是一个 handle，所以事件循环不会退出，同时 uv_async_t 是通过 fd 完成通信的，所以事件循环会阻塞在 Poll IO 阶段。当子线程开始执行时，调用 uv_async_send 告诉主线程有任务执行完毕，从而唤醒主线程，接着主线程在 Poll IO 阶段执行 uv_async_t 回调，输出 done 并且关闭 uv_async_t，最后事件循环退出。

## 线程池的实现

了解了线程间通信的机制后，接着看一下线程池的实现，包括线程池的创建、消费者 / 生产者的实现以及线程池是如何通过线程间通信和主线程配合处理任务的。

线程 池的创建
首先来看一下线程池的创建。线程池是懒初始化的，只有在用户第一次提交任务时才会被创建。

```c
// 提交一个任务到线程池
void uv__work_submit(...) {
  // 保证已经初始化线程，并只执行一次
  uv_once(&once, init_once);
  // ...
}

static void init_once(void) {
  init_threads();
}

```

uv__work_submit 是提交任务到线程池的函数，从代码中可以看到它通过 uv_once 保证了线程池的初始化，并且只初始化一次，因为其他线程可能会同时往 Libuv 的线程池提交任务，所以这里需要使用 uv_once 解决多线程并发的问题，uv_once 中执行了 init_threads 函数。

```c
static void init_threads(void) {
    unsigned int i;
    const char* val;
    uv_sem_t sem;
    // 计算 default_threads 数组大小获取默认的线程数，static uv_thread_t default_threads[4];
    nthreads = ARRAY_SIZE(default_threads);
    // 如果用户设置了环境变量则取用户设置的值
    val = getenv("UV_THREADPOOL_SIZE");
    if (val != NULL)
        nthreads = atoi(val);
    // 值无效则默认创建 1 个线程
    if (nthreads == 0)
        nthreads = 1;
    // #define MAX_THREADPOOL_SIZE 128 最多 128 个线程
    if (nthreads > MAX_THREADPOOL_SIZE)
        nthreads = MAX_THREADPOOL_SIZE;
    
    threads = default_threads;
    // 如果线程数比默认大小大，则需要分配新的内存保存数据
    if (nthreads > ARRAY_SIZE(default_threads)) {
        threads = uv__malloc(nthreads * sizeof(threads[0]));
        // 内存分配失败，则使用默认值
        if (threads == NULL) {
            nthreads = ARRAY_SIZE(default_threads);
            threads = default_threads;
        }
    }
    // 初始化条件变量和互斥变量，用于线程间同步
    uv_cond_init(&cond);
    uv_mutex_init(&mutex);
    
    // 初始化线程池任务队列，多个子线程共同消费这个队列
    QUEUE_INIT(&wq);
    // 慢任务队列
    QUEUE_INIT(&slow_io_pending_wq);
    // 标记有慢任务需要处理的节点
    QUEUE_INIT(&run_slow_work_message);
    
    // 初始化信号量为 0，为 0 则线程调 uv_sem_wait 时会阻塞
    uv_sem_init(&sem, 0);
    // 开始创建子线程，在子线程中执行 worker 函数的代码，sem 为 worker 入参
    for (i = 0; i < nthreads; i++)
        uv_thread_create(threads + i, worker, &sem);
    // 为 0 则阻塞，非 0 则减一，用于等待所有线程启动成功再往下执行
    for (i = 0; i < nthreads; i++)
        uv_sem_wait(&sem);
    
    uv_sem_destroy(&sem);
}
```

init_threads 中初始化一些数据结构和创建多个工作子线程，然后在每个子线程中执行工作函数 worker。


生产者的实现
接着我们继续看一下生产者的逻辑。

```c
// 给线程池提交一个任务
void uv__work_submit(uv_loop_t* loop,
                     struct uv__work* w,
                     enum uv__work_kind kind,
                     void (work)(struct uv__work w),
                     void (done)(struct uv__work w, int status)) {
    w->loop = loop;
    // 工作函数，比如执行耗时 / 或会阻塞的函数
    w->work = work;
    // 任务完成后到回调
    w->done = done;
    // 提交任务
    post(&w->wq, kind);
}
```

uv__work_submit 是 Libuv 内部使用的函数，它把调用者的任务函数和任务完成后的执行的回调函数封装到 uv__work 结构体中，另外Libuv把任务分为三种类型，CPU 密集型、快 IO（文件操作）、慢 IO（DNS 解析），kind 表示任务的类型，Libuv 针对不同类型的任务有不同的处理策略。uv__work_submit 中调用了 post 函数实现任务的插入。

```c
static void post(QUEUE* q, enum uv__work_kind kind) {
    // 访问任务队列前需要加锁，因为队列是由子线程共享的
    uv_mutex_lock(&mutex);
    // 慢 IO 类型的任务
    if (kind == UV__WORK_SLOW_IO) {
        /*
            Libuv 单独维护了一个队列 slow_io_pending_wq 管理慢 IO 任务，
            提交慢 IO 类型的任务时，首先把节点插入 slow_io_pending_wq，然后再把 
            run_slow_work_message 插入到主队列 wq，处理到 run_slow_work_message
            节点时，Libuv 会逐个执行 slow_io_pending_wq 中的节点。
        */
        QUEUE_INSERT_TAIL(&slow_io_pending_wq, q);
        /*
            如果 run_slow_work_message 非空，说明已经插入线程池的任务队列了。
            解锁然后直接返回。
            如果 run_slow_work_message 是空，说明还没有插入主队列。
            需要进行把待插入的节点改成 run_slow_work_message，然后插入主队列。
        */
        if (!QUEUE_EMPTY(&run_slow_work_message)) {
            uv_mutex_unlock(&mutex);
            return;
        }
        // 说明 run_slow_work_message 还没有插入队列，准备插入队列
        q = &run_slow_work_message;
    }
    // 把节点插入主队列
    QUEUE_INSERT_TAIL(&wq, q);
    // 有空闲线程在睡眠则唤醒它，如果都在忙，则不需要通知，因为它处理任务后会主动判断是否还有新任务
    if (idle_threads > 0)
        uv_cond_signal(&cond);
    uv_mutex_unlock(&mutex);
}
```

以上是 Libuv 中线程池生产者的实现，具体的流程结构可以看下图。

因为一个线程每次只能处理一个任务，如果某类型的任务非常慢且数量多，就会消耗完线程池的线程，无法执行一些比较快的任务。为此，Libuv 区分了快 IO 和 慢 IO 任务，在一定程度上保证了公平性和稳定性。

除了上面的方式，Libuv 还提供了 uv_queue_work 函数提交任务，不过这个函数是只针对 CPU 密集型的。从实现来看，它和 uv__work_submit 的区别是，通过 uv_queue_work 提交的任务，请求数会加一，如果该请求对应的任务没有执行完，则事件循环不会退出。而通过 uv__work_submit 方式提交的任务就算没有执行完，也不会影响事件循环的退出，但是通常调用 uv__work_submit 的函数会主动把请求数加一，比如文件操作。下面我们来看下 uv_queue_work 的实现。

```c
int uv_queue_work(uv_loop_t* loop,
    uv_work_t* req,
    uv_work_cb work_cb,
    uv_after_work_cb after_work_cb) {
        // 请求数加一
        uv__req_init(loop, req, UV_WORK);
        req->loop = loop;
        req->work_cb = work_cb;
        req->after_work_cb = after_work_cb;
        uv__work_submit(loop,
                        &req->work_req,
                        UV__WORK_CPU,
                        uv__queue_work,
                        uv__queue_done);
        return 0;
}

```

uv_queue_work 保存了调用者的工作函数和回调函数到 req 中，然后把 uv__queue_work 和 uv__queue_done 封装到 req->work_req 中， 最后提交到线程池 。当子线程处理这个任务时，uv__queue_work 会被执行。

```c
static void uv__queue_work(struct uv__work* w) {
    // 通过结构体 work_req 字段计算出结构体首地址
    uv_work_t* req = container_of(w, uv_work_t, work_req);
    req->work_cb(req);
}

```

uv__queue_work 中会执行用户设置的函数，同理，uv__queue_done 也只是对用户回调的简单封装。

uv__queue_work 有一个比较好玩的用法是在我们写 Addon 的时候，比如我们注册了 V8 GC 回调用于统计 GC 的耗时。

```c
// 注册 GC 开始回调
isolate()->AddGCPrologueCallback([](
    Isolate* isolate,
    GCType type,
    GCCallbackFlags flags,
    void* data) {
     // 
 },
 nullptr);
 
// 注册 GC 结束回调
isolate()->AddGCEpilogueCallback([](
    Isolate* isolate,
    GCType type,
    GCCallbackFlags flags,
    void* data) {
     // 通知 JS
 },
 nullptr);
```

在上面的代码中，我们注册了 GC 开始和结束时的回调，然后在 GC 结束回调中我们把收集到的数据告诉 JS。但是在 GC 回调中是不能执行 JS 的，那应该怎么处理呢？一种方式是先缓存到 C++ 的数据结构中，然后再暴露 API 给 JS 定时消费，另一种方式就是通过 uv_queue_work 提交一个空的任务。

```c
uv_queue_work(..., 
// 空任务
[](uv_work_t * req) {}, 
[](uv_work_t * req, int status) {
    // 通知 JS
});

```

给线程池提交一个空的任务，Libuv 的线程池执行完这个空任务之后，就会在 Poll IO 阶段执行回调，在回调里我们就可以回调 JS 了。

消费者的实现
讲完线程池的生产者后，接着看下消费者的实现。

```c
static void worker(void* arg) {
    struct uv__work* w;
    QUEUE* q;
    int is_slow_work;
    // uv_sem_post 表示当前线程期待成功
    uv_sem_post((uv_sem_t*) arg);
    arg = NULL;
    // 访问共享任务队列需要加锁
    uv_mutex_lock(&mutex);
    // 在死循环中不断处理任务，满足条件时则结束循环
    for (;;) {
        /*
            以下情况时，线程进入阻塞等待任务状态
            1 没有任务可处理
            2 只有慢 IO 任务且正在处理的慢 IO 任务数量已经达到阈值，
              防止慢 IO 占用过多子线程，导致其他快的任务无法得到执行，线程选择进入阻塞，空闲线程加一。
        */
        while (QUEUE_EMPTY(&wq) ||
              (QUEUE_HEAD(&wq) == &run_slow_work_message &&
               QUEUE_NEXT(&run_slow_work_message) == &wq &&
               slow_io_work_running >= slow_work_thread_threshold())) {
                
            idle_threads += 1;
            // 进入阻塞状态，有新任务时被唤醒，但是只有正在处理的慢 IO 任务数小于阈值时，
            // 后续的任务才能被处理
            uv_cond_wait(&cond, &mutex);
            // 被唤醒，空闲线程数减一
            idle_threads -= 1;
        }
        // 取出当前待处理任务，可能是退出任务、慢 IO 任务，一般任务
        q = QUEUE_HEAD(&wq);
        // 如果结点是退出任务，则线程结束执行
        if (q == &exit_message) {
            // 唤醒其他因为没有任务正阻塞等待任务的线程，通知它们准备退出
            uv_cond_signal(&cond);
            uv_mutex_unlock(&mutex);
            // 自己先退出，但是不能从队列中删除该退出任务，
            // 因为其他线程被唤醒后也需要依赖这个节点判断是否需要退出
            break;
        }
        // 移除节点
        QUEUE_REMOVE(q);
        QUEUE_INIT(q);
        is_slow_work = 0;
        /*
            上面的 while 中只判断了是不是只有慢 IO 任务且达到阈值。但是没有判断慢 IO 和非慢 IO 任务都有的情况
            所以执行到这说明队列中肯定有非慢 IO 任务，可能有慢 IO，如果有慢 IO 并且正在执行的个数达到阈值，
            则先不处理该慢 IO 任务，继续判断是否还有非慢 IO 任务可执行。
        */
        if (q == &run_slow_work_message) {
            // 达到阈值，重新插入队列
            if (slow_io_work_running >= slow_work_thread_threshold()) {
                QUEUE_INSERT_TAIL(&wq, q);
                continue;
            }
            
            // 没有慢 IO 任务需要处理则继续处理其他任务
            if (QUEUE_EMPTY(&slow_io_pending_wq))
                continue;
            // 有慢 IO，开始处理慢 IO 任务
            is_slow_work = 1;
            // 记录正在处理的慢 IO 任务数量，用于其他线程判断慢 IO 任务数量是否达到阈值
            slow_io_work_running++;
            // 从 slow_io_pending_wq 队列获取一个慢 IO 任务
            q = QUEUE_HEAD(&slow_io_pending_wq);
            QUEUE_REMOVE(q);
            QUEUE_INIT(q);
            /*
                取出一个任务后，如果还有慢 IO 任务则把慢 IO 标记节点重新入队，
                表示还有慢 IO 任务，因为上面把该标记节点出队了
            */
            if (!QUEUE_EMPTY(&slow_io_pending_wq)) {
                QUEUE_INSERT_TAIL(&wq, &run_slow_work_message);
                // 有空闲线程则唤醒他，因为还有任务处理
                if (idle_threads > 0)
                    uv_cond_signal(&cond);
            }
        }
        
        // 不需要操作队列了，先释放锁
        uv_mutex_unlock(&mutex);
        // q 是慢 IO 或者一般任务
        w = QUEUE_DATA(q, struct uv__work, wq);
        // 执行业务的任务函数，该函数一般会很耗时或者阻塞线程
        w->work(w);
        // 准备修改 loop 的任务完成队列，加锁
        uv_mutex_lock(&w->loop->wq_mutex);
        // 置空说明指向完了，不能被取消了，见 cancel 逻辑
        w->work = NULL;
        // 执行完任务,插入到事件循环的 wq 队列,在 Poll IO 阶段会执行 uv__work_done 处理这个队列
        QUEUE_INSERT_TAIL(&w->loop->wq, &w->wq);
        // 通过 wq_async 异步通知主线程有任务完成，主线程在 Poll IO 阶段会执行已完成的任务的回调
        uv_async_send(&w->loop->wq_async);
        uv_mutex_unlock(&w->loop->wq_mutex);
        // 为下一轮操作任务队列加锁
        uv_mutex_lock(&mutex);
        // 执行完慢 IO 任务，记录正在执行的慢 IO 个数变量减 1 ，上面加锁保证了互斥访问这个变量
        if (is_slow_work) {
            slow_io_work_running--;
        }
    }
}

```

我们看到消费者的逻辑似乎比较复杂，主要是多了处理慢 IO 任务的逻辑。大概分为三种情况。

对于一般任务，则互斥访问任务队列，然后取出任务执行其中的任务函数。
对于慢 IO 类型的任务，需要特殊处理一下，主要是限制了它消耗的线程数。
如果收到了 exit_message 节点说明子线程需要退出。
执行完任务后，把节点插入事件循环的队列，然后通知主线程，由主线程进行后续处理。

线程 池和主线程的通信
接着看一下线程池是如何利用 async handle 机制通知主线程的，在 Libuv 初始化时会执行 uv_loop_init 进行初始化。uv_loop_init 中有以下代码。


```c
uv_async_init(loop, &loop->wq_async, uv__work_done);
```

wq_async 是用于线程池和主线程通信的 async handle。他对应的回调是 uv__work_done 。所以当一个线程池的线程任务完成时，通过 uv_async_send(&w->loop->wq_async) 设置 loop->wq_async.pending = 1，然后通知 IO 观察者。主线程在Poll IO 阶段就会执行该 handle 对应的回调 uv__work_done 函数。



```c
void uv__work_done(uv_async_t* handle) {
    struct uv__work* w;
    uv_loop_t* loop;
    QUEUE* q;
    QUEUE wq;
    
    int err;
    loop = container_of(handle, uv_loop_t, wq_async);
    uv_mutex_lock(&loop->wq_mutex);
    /*
        把 loop->wq 队列的节点全部移到 wp 变量中，这样可以尽快释放锁
    */
    QUEUE_MOVE(&loop->wq, &wq);
    uv_mutex_unlock(&loop->wq_mutex);
    // wq 队列的节点来源于子线程的 worker 函数
    while (!QUEUE_EMPTY(&wq)) {
        q = QUEUE_HEAD(&wq);
        QUEUE_REMOVE(q);
        w = container_of(q, struct uv__work, wq);
        // 等于 uv__cancelled 说明任务被取消了
        err = (w->work == uv__cancelled)? UV_ECANCELED : 0;
        // 执行回调
        w->done(w, err);
    }
}

```

uv__work_done 逐个处理已完成的任务节点，执行回调，比如 DNS 解析时，我们会执行 dns.lookup(..., function cb() => {})，这个回调函数 cb 就会被执行。在上面代码中，我们还需要注意 w->work == uv__cancelled 的判断。uv__cancelled 这个值是通过 uv_cancel 中设置的，而 uv_cancel 用于取消一个任务，底层对应的函数是 uv__work_cancel。

```c
static int uv__work_cancel(uv_loop_t* loop, uv_req_t* req, struct uv__work* w) {
    int cancelled;
    // 加锁，为了把节点移出队列
    uv_mutex_lock(&mutex);
    // 加锁，为了判断 w->wq 是否为空
    uv_mutex_lock(&w->loop->wq_mutex);
    /*
        当子线程处理完一个任务后，会把 work 置 NULL，
        所以如果任务函数 work 不为空，说明还没有开始被处理，
        如果还在任务队列中，则可取消。
    */
    cancelled = !QUEUE_EMPTY(&w->wq) && w->work != NULL;
    // 从任务队列中删除该节点
    if (cancelled)
        QUEUE_REMOVE(&w->wq);
    
    uv_mutex_unlock(&w->loop->wq_mutex);
    uv_mutex_unlock(&mutex);
    // 不能取消则返回错误码
    if (!cancelled)
        return UV_EBUSY;
    // 设置 work 为 uv__cancelled，表示任务取消，uv__work_done 中会判断这个标记
    w->work = uv__cancelled;
    
    uv_mutex_lock(&loop->wq_mutex);
    /*
        插入事件循环的 wq 队列，对于取消的动作，Libuv 认为是任务执行完了，
        所以插入已完成的队列
    */
    QUEUE_INSERT_TAIL(&loop->wq, &w->wq);
    // 通知主线程有任务完成
    uv_async_send(&loop->wq_async);
    uv_mutex_unlock(&loop->wq_mutex);
    
    return 0;
}
```

从上面的逻辑中可以看到，Libuv 中，取消任务的前提是任务还没开始执行，也就是说任务正常被处理也无法取消了。

销毁 线程 池
当 Node.js 退出时，需要先保证线程池的线程先退出。

```c
UV_DESTRUCTOR(static void cleanup(void)) {
  unsigned int i;

  if (nthreads == 0)
    return;
  // 提交一个特殊任务通知子线程退出
  post(&exit_message, UV__WORK_CPU);
  // 等到线程退出
  for (i = 0; i < nthreads; i++)
    if (uv_thread_join(threads + i))
      abort();

  if (threads != default_threads)
    uv__free(threads);

  uv_mutex_destroy(&mutex);
  uv_cond_destroy(&cond);

  threads = NULL;
  nthreads = 0;
}
```

线程退出是编程多线程程序时需要处理的问题，和前面讲的一样，其中一个需要做的事情是调用 thread_join（Libuv 中是 uv_thread_join）等待线程退出，那么线程怎么样才能退出呢？一种是代码执行完了主动退出，第二种是需要主动通知它退出，这里就是第二种，Libuv 中通过提交一个特殊的任务 exit_message 通知子线程退出，子线程收到这个任务后就会跳出循环，从而结束代码的执行。

讲完线程池的创建、消费者 / 生产者的实现、线程池和主线程的通信后，最后通过一张图总结下整个流程。

在Node.js 是单线程还是多线程这个问题上。当我们说 Node.js 是单线程时，指的是所有 JS 代码都在单个线程（主线程）里执行；当我们说 Node.js 是多线程时，指的是 Node.js 处理任务时。底层其实是由多个线程一起工作的，但是子线程只负责某一个任务的处理，处理完之后通过主线程去执行回调，而不是在子线程里直接执行回调。


