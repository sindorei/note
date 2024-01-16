# libuv 事件循环

```javascript
class EventSystem {
    constructor() {
        // 需要处理的任务队列
        this.queue = [];
        // 标记是否需要退出事件循环
        this.stop = 0;
        // 有任务时调用该函数"唤醒" await
        this.wakeup = null;
    }
    // 没有任务时，事件循环的进入"阻塞"状态
    wait() {
        return new Promise((resolve) => {
            // 记录 resolve，可能在睡眠期间有任务到来，则需要提前唤醒
            this.wakeup = () => {
                this.wakeup = null;
                resolve();
            };
        });
    }
    // 停止事件循环，如果正在"阻塞"，则"唤醒它"
    setStop() {
        this.stop = 1;
        this.wakeup && this.wakeup();
    }
    // 生产任务
    enQueue(func) {
        this.queue.push(func);
        this.wakeup && this.wakeup();
    }

    // 处理任务队列
    handleTask() {
        if (this.queue.length === 0) {
            return;
        }
        // 本轮事件循环的回调中加入的任务，下一轮事件循环再处理，防止其他任务没有机会处理
        const queue = this.queue;
        this.queue = [];
        while(queue.length) {
            const func = queue.shift();
            func();
        }
    }

    // 事件循环的实现
    async run() {
        // 如果 stop 等于 1 则退出事件循环
        while(this.stop === 0) {
        // 处理任务，可能没有任务需要处理
            this.handleTask();
            // 处理任务过程中如果设置了 stop 标记则退出事件循环
            if (this.stop === 1) {
                break;
            }
            // 没有任务了，进入睡眠
            if (this.queue.length === 0) {
                await this.wait();
            }
        }
        // 退出前可能还有任务没处理，处理完再退出
        this.handleTask();
    }
}

// 新建一个事件循环系统
const eventSystem = new EventSystem();

// 启动前生成的任务
eventSystem.enQueue(() => {
    console.log('1');
});

// 模拟定时生成一个任务
setTimeout(() => {
    eventSystem.enQueue(() => {
        console.log('3');
        eventSystem.setStop();
    });
}, 1000);

// 启动事件循环
eventSystem.run();

// 启动后生成的任务
eventSystem.enQueue(() => {
    console.log('2');
});

```

以上是一个事件循环的demo，具备了事件循环的一些核心功能：
1. 事件循环的整体架构是一个 while 循环。
2. 定义任务类型和队列，这里只有一种任务类型和一个队列，比如 Node.js 里有好几种，每种类型的任务有不同的作用。
3. 没有任务的时候怎么处理：进入阻塞状态，而不是靠忙轮询。

第 3 点是事件循环系统中非常重要的逻辑，因为事件循环属于生产者 / 消费者模式，任务队列中不可能一直都有任务需要处理，这就意味着生产任务可以是一个异步的过程，所以事件循环系统就需要有一种等待 / 唤醒机制。但这会带来两个问题：如何实现等待 / 唤醒机制？什么时候需要退出？

这和具体的业务场景有关，在该事件循环中，没有任务的时候就会一直等待而不是退出。除非用户手动执行 setStop 退出。而在 Node.js 中，如果没有 actived 状态的 handle 和 request 并且 close 阶段没有任务时就会自动退出，具体可以参考 uv__loop_alive 函数。那如何实现等待 / 唤醒呢？这里使用的是 await Promise 来模拟睡眠达到等待的效果，而在 Libuv 中，通过在 Poll IO 阶段使用操作系统的事件驱动模块实现等待 / 唤醒机制。

## 其他软件的事件循环

### Nginx 1.23.1 

```c
static void ngx_worker_process_cycle(ngx_cycle_t *cycle, void *data)
{
    // 事件循环
    for ( ;; ) {
        // 是否需要退出
        if (ngx_exiting) {
            // 是否还有定时器节点，有的话需要先处理再退出
            if (ngx_event_no_timers_left() == NGX_OK) {
                ngx_worker_process_exit(cycle);
            }
        }
        // 处理定时器和其他事件
        ngx_process_events_and_timers(cycle);
    }
}

```

ngx_worker_process_cycle 是在子进程里执行的函数，在一个 for 循环中不断调用 ngx_process_events_and_timers，接着看一下 ngx_process_events_and_timers。

```c
void ngx_process_events_and_timers(ngx_cycle_t *cycle)
{
    // 找到最快到期的定时器
    timer = ngx_event_find_timer();
    // 调用事件驱动模块等待就绪事件或者定时器超时
    (void) ngx_process_events(cycle, timer, flags);
    // 处理事件
    ngx_event_process_posted(cycle, &ngx_posted_accept_events);

    // 处理过期的定时器
    ngx_event_expire_timers();
    
    // 处理事件
    ngx_event_process_posted(cycle, &ngx_posted_events);
}

```

### Redis 0.1

```c
void aeMain(aeEventLoop *eventLoop)
{
    eventLoop->stop = 0;
    while (!eventLoop->stop)
        aeProcessEvents(eventLoop, AE_ALL_EVENTS);
}

int aeProcessEvents(aeEventLoop *eventLoop, int flags)
{
    int maxfd = 0, numfd = 0, processed = 0;
    fd_set rfds, wfds, efds;
    aeFileEvent *fe = eventLoop->fileEventHead;
    aeTimeEvent *te;
    // 初始化变量
    FD_ZERO(&rfds);
    FD_ZERO(&wfds);
    FD_ZERO(&efds);

    // 处理文件事件
    if (flags & AE_FILE_EVENTS) {
        while (fe != NULL) {
            // 根据需要处理的事件，设置对应的变量对应的位
            if (fe->mask & AE_READABLE) FD_SET(fe->fd, &rfds);
            if (fe->mask & AE_WRITABLE) FD_SET(fe->fd, &wfds);
            if (fe->mask & AE_EXCEPTION) FD_SET(fe->fd, &efds);
            // 记录最大文件描述符 select 的时候需要用
            if (maxfd < fe->fd) maxfd = fe->fd;
            numfd++;
            fe = fe->next;
        }
    }
    // 有文件事件需要处理
    // 或者没有文件事件需要处理但是有 time 事件并且没有设置 AE_DONT_WAIT 标记
    if (numfd || ((flags & AE_TIME_EVENTS) && !(flags & AE_DONT_WAIT))) {
        int retval;
        aeTimeEvent *shortest = NULL;
        struct timeval tv, *tvp;
        // 有 time 事件需要处理，并且没有设置 AE_DONT_WAIT 标记，则 select 可能会定时阻塞（如果有time节点的话）
        if (flags & AE_TIME_EVENTS && !(flags & AE_DONT_WAIT))
            // 找出最快到期的节点
            shortest = aeSearchNearestTimer(eventLoop);
        // 有待到期的time节点
        if (shortest) {
            // 计算超时时间
        } else {
            // 没有到期的time节点
            // 设置了AE_DONT_WAIT，则不会阻塞在select
            if (flags & AE_DONT_WAIT) {
                tv.tv_sec = tv.tv_usec = 0;
                tvp = &tv;
            } else {
                // 一直阻塞直到有事件发生
                tvp = NULL; /* wait forever */
            }
        }
        // 调用事件驱动模块等待时间触发或者超时
        retval = select(maxfd+1, &rfds, &wfds, &efds, tvp);
        // 有事件触发则处理
        if (retval > 0) {
            fe = eventLoop->fileEventHead;
            while(fe != NULL) {
                // 执行回调
                fe->fileProc(eventLoop, fe->fd, fe->clientData, mask);
            }
        }
    }
    
    // 处理time事件
    if (flags & AE_TIME_EVENTS) {
        te = eventLoop->timeEventHead;
        while(te) {
            // 获取当前时间
            aeGetTime(&now_sec, &now_ms);
            // 到期了
            if (now_sec > te->when_sec ||
                (now_sec == te->when_sec && now_ms >= te->when_ms))
            {
                // 执行回调
                te->timeProc(eventLoop, id, te->clientData);
            } else {
                te = te->next;
            }
        }
    }
    // 处理的事件个数
    return processed;
}

```

## Libuv 的事件循环

Libuv 事件循环具体在 uv_run 函数中实现。uv_run 中执行 while 循环，然后串行处理各种阶段（phase）的事件回调，所以当一个任务执行时间过长，就会影响后面任务的执行，导致事件循环延迟过高。

```c
int uv_run(uv_loop_t* loop, uv_run_mode mode) {
    int timeout;
    int r;
    int ran_pending;
    while (r != 0 && loop->stop_flag == 0) {
        // 更新当前时间，每轮事件循环会缓存这个时间，避免过多系统调用损耗性能
        uv__update_time(loop);
        // 执行定时器回调
        uv__run_timers(loop);
        // 执行 pending 回调
        uv__run_pending(loop);
        // 继续执行各种队列
        uv__run_idle(loop);
        uv__run_prepare(loop);
        timeout = 0;
        // 计算 Poll IO 阻塞时间
        timeout = uv_backend_timeout(loop);
        // Poll IO timeout是 epoll_wait 的等待时间
        uv__io_poll(loop, timeout);
        // 继续执行各种队列
        uv__run_check(loop);
        uv__run_closing_handles(loop);
        // 是否还有活跃任务，有则继续下一轮事件循环
        r = uv__loop_alive(loop);
    }
    return r;
}

static int uv__loop_alive(const uv_loop_t* loop) {
  return uv__has_active_handles(loop) ||
         uv__has_active_reqs(loop) ||
         loop->closing_handles != NULL;
}

```

### prepare、check、idle 阶段
prepare、check、idle 阶段的实现是一样的，只是执行时机不一样。Libuv 分为 handle 和 request。而 idle 阶段的任务是属于 handle。下面我们通过一个例子，看看 idle 阶段的任务是如何创建和处理的。

```c
#include<uv.h>
#include <stdio.h>

void idle_cb(uv_idle_t *handle) {
    printf("idle callback\n");
}

int main() {
    uv_idle_t idle;
    // 初始化
    uv_idle_init(uv_default_loop(), &idle);
    // 启动，每轮事件循环都会执行 idle_cb
    uv_idle_start(&idle, idle_cb);
    uv_run(uv_default_loop(), UV_RUN_DEFAULT);
    return 0;
}
```

上面的代码中，Libuv 会在每一轮事件循环的 idle 阶段执行回调 idle_cb。我们分析一下这个过程。使用前，首先定义一个 uv_idle_t 结构体，然后执行 uv_idle_init 进行 handle 的初始化。

```c
int uv_idle_init(uv_loop_t* loop, uv_idle_t* handle) {
    uv__handle_init(loop, (uv_handle_t*)handle, UV_IDLE);
    handle->idle_cb = NULL;
    return 0;
}
```

uv_idle_init 函数主要是做一些初始化操作，继续看 start 函数。

```c
int uv_idle_start(uv_idle_t* handle, uv_idle_cb cb) {
    // 如果已经执行过 start 函数则直接返回
    if (uv__is_active(handle)) return 0;
    if (cb == NULL) return UV_EINVAL;
    QUEUE_INSERT_HEAD(&handle->loop->idle_handles, &handle->queue);
    handle->idle_cb = cb;
    uv__handle_start(handle);
    return 0;
}
```

uv_idle_start 用于设置回调，把 handle 插入事件循环中的 idle_handles 队列，idle_handles 则保存了 idle 阶段的任务。接着执行 uv_run 开始事件循环，在事件循环的 idle 阶段会逐个执行里面的节点的回调。我们看看 Libuv 在事件循环的 idle 阶段是如何处理的。

```c
void uv__run_idle(uv_loop_t* loop) {
    uv_prepare_t* h;
    QUEUE queue;
    QUEUE* q;
    /*
        把该类型对应的队列中所有节点摘下来挂载到 queue 变量，
        相当于清空 idle_handles 队列，因为如果直接遍历
        idle_handles 队列，在执行回调的时候如果一直往 idle_handles
        队列加节点，会导致下面的 while 循环无法退出。
        先移除的话，新插入的节点在下一轮事件循环才会被处理。
    */
    QUEUE_MOVE(&loop->idle_handles, &queue);
    // 遍历队列，执行每个节点里面的函数
    while (!QUEUE_EMPTY(&queue)) {
        // 取下当前待处理的节点，即队列的头
        q = QUEUE_HEAD(&queue);
        /*
            取得该节点对应的整个结构体的基地址，
            即通过结构体成员取得结构体首地址
        */
        h = QUEUE_DATA(q, uv_idle_t, queue);
        // 把该节点移出当前队列
        QUEUE_REMOVE(q);
        // 重新插入原来的队列
        QUEUE_INSERT_TAIL(&loop->idle_handles, q);
        // 执行回调函数
        h->idle_cb(h);
    }
}
```


uv__run_idle 函数的逻辑很简单，就是逐个执行 idle_handles 队列的节点。不过有一个地方需要注意，节点被移出队列后，又执行 QUEUE_INSERT_TAIL 重新插入到队列了，所以这三个阶段的任务是每次事件循环都会被执行的。

虽然 idle、check、prepare 回调会在每一轮事件循环被执行，但是 idle 阶段比较特殊，当存在 idle 任务时，事件循环不会阻塞在 Poll IO 阶段，所以 idle 任务的回调会一直执行，而如果是 prepare 或 check 任务，事件循环会阻塞在 Poll IO 阶段，从 Poll IO 阶段返回时，才会继续执行 prepare 或 check 回调，比如下面的例子中，回调只会被执行一次。


设置Libuv 的运行模式是默认模式（UV_RUN_DEFAULT）。如果有 active 状态的 handle（idle 节点），事件循环是不会退出的，它会一直执行回调。如果要退出或者不需要执行 idle 队列的某个节点，只需要 uv_idle_stop 就可以了。

```c
int uv_idle_stop(uv_idle_t* handle) {
    if (!uv__is_active(handle)) return 0;
    // 把 handle 从 idle 队列中移除，但是还挂载到 handle_queue 中
    QUEUE_REMOVE(&handle->queue);
    // 清除 active 标记位并且减去事件循环中 handle 的 active 数
    uv__handle_stop(handle);
    return 0;
}

```


uv_idle_stop 会停止 uv_idle_t handle 并移出 idle 队列，但是不会把 handle 移出事件循环的 handle 队列，如果想把 handle 移出事件循环的 handle 队列，需要调用 uv_close，uv_close 除了调用 uv_idle_stop，还会把 handle 移出 handle 队列。

另外需要注意的是，虽然 idle、check、prepare 回调会在每一轮事件循环被执行，但是 idle 阶段比较特殊，当存在 idle 任务时，事件循环不会阻塞在 Poll IO 阶段，所以 idle 任务的回调会一直执行，而如果是 prepare 或 check 任务，事件循环会阻塞在 Poll IO 阶段，从 Poll IO 阶段返回时，才会继续执行 prepare 或 check 回调，比如下面的例子中，回调只会被执行一次。


```c
#include<uv.h>
#include <stdio.h>

void prep_cb(uv_prepare_t *handle) {
    printf("Prep callback\n");
}

int main() {
    uv_prepare_t prep;
    uv_prepare_init(uv_default_loop(), &prep);
    uv_prepare_start(&prep, prep_cb);
    // 执行一次 prep_cb 然后进入阻塞状态
    uv_run(uv_default_loop(), UV_RUN_DEFAULT);
    return 0;
}
```

### pending 阶段

pending 阶段用于处理 Poll IO 阶段产生的一些回调，比如连接失败时的回调或者 UDP 数据发送结束的写回调。下面来看一个例子。

```c
int uv__tcp_connect(...) {
  do {
    errno = 0;
    // 非阻塞式发起连接
    r = connect(uv__stream_fd(handle), addr, addrlen);
  } while (r == -1 && errno == EINTR);
  // 连接失败或还没成功
  if (r == -1 && errno != 0) {
    if (errno == EINPROGRESS) // 连接中的错误码
      ; /* not an error */
    else if (errno == ECONNREFUSED)
      handle->delayed_error = UV__ERR(ECONNREFUSED);
    else
      return UV__ERR(errno);
  }
  // 产生 pending 任务
  if (handle->delayed_error)
    uv__io_feed(handle->loop, &handle->io_watcher);

  return 0;
}
```

uv__tcp_connect 调用 connect 函数以非阻塞方式发起 TCP 连接，当 connect 返回时，可能处于连接中或者失败，从代码中可以看到当 errno 是 ECONNREFUSED 时，Libuv 会执行 uv__io_feed 函数。

```c
void uv__io_feed(uv_loop_t* loop, uv__io_t* w) {
  if (QUEUE_EMPTY(&w->pending_queue))
    QUEUE_INSERT_TAIL(&loop->pending_queue, &w->pending_queue);
}
```

uv__io_feed 函数会把一个 IO 观察者插入到 pending 队列，从中也可以看到 pending 阶段是和 IO 相关的。接下来看一下 pending 阶段的处理。

```c
static int uv__run_pending(uv_loop_t* loop) {
  QUEUE* q;
  QUEUE pq;
  uv__io_t* w;
  if (QUEUE_EMPTY(&loop->pending_queue))
    return 0;
  // 把 pending_queue 队列的节点移到 pq，清空 pending_queue
  QUEUE_MOVE(&loop->pending_queue, &pq);
  // 遍历 pq 队列
  while (!QUEUE_EMPTY(&pq)) {
    // 取出当前第一个需要处理的节点
    q = QUEUE_HEAD(&pq);
    // 把当前需要处理的节点移出队列
    QUEUE_REMOVE(q);
    // 重置一下 prev 和 next 指针
    QUEUE_INIT(q);
    w = QUEUE_DATA(q, uv__io_t, pending_queue);
    // 执行回调
    w->cb(loop, w, POLLOUT);
  }
  return 1;
}
```

pending 阶段的处理逻辑比较简单，就是遍历队列，然后执行每个节点的回调，这里需要注意的是，回调的入参是 loop、IO 观察者和可写事件

### close 阶段

close 是 Libuv 每轮事件循环中最后的一个阶段。对于一个 handle，有四个通用的操作函数，分别是 init、start、stop 和 close。init 和 start 比较好理解，那么 stop 和 close 有什么区别呢？

stop 通常意味着这个 handle 处于暂停状态，后续还可以调用 start 重新激活，同时还挂载在事件循环的 handle 队列。比如可以使用 uv_timer_stop 停止一个定时器，然后再执行 uv_timer_start 重启这个定时器。但是 close 意味着这个 handle 已经被关闭了，不再重新使用，同时也会被移出事件循环的 handle 队列。另外， close 操作支持传入一个回调，这个回调会在 close 阶段被执行，比如用于释放动态申请的内存。close 阶段的任务由 uv_close 产生。


```c
void uv_close(uv_handle_t* handle, uv_close_cb close_cb) {
    // 正在关闭，但是还没执行回调等后置操作
    handle->flags |= UV_HANDLE_CLOSING;
    handle->close_cb = close_cb;
    // 根据 handle 类型执行不同的操作，通常是 stop 这个 handle
    switch (handle->type) {
        case UV_PREPARE:
            uv__prepare_close((uv_prepare_t*)handle);
                break;
        case UV_CHECK:
            uv__check_close((uv_check_t*)handle);
            break;
        ...
        default:
            assert(0);
    }
    uv__make_close_pending(handle);
}
```

uv_close 设置 handle 的回调和状态，然后根据 handle 类型调对应的 close 函数，一般就是 stop 这个 handle。比如 prepare 的 close 函数：

```c
void uv__prepare_close(uv_prepare_t* handle) {
    uv_prepare_stop(handle);
}
```

接着，执行 uv__make_close_pending 以头插法往 close 队列插入一个任务。

```c
// 头插法插入 close 队列，在 close 阶段被执行
void uv__make_close_pending(uv_handle_t* handle) {
    handle->next_closing = handle->loop->closing_handles;
    handle->loop->closing_handles = handle;
}
```

最后，在 close 阶段逐个处理。

```c
static void uv__run_closing_handles(uv_loop_t* loop) {
    uv_handle_t* p;
    uv_handle_t* q;
    p = loop->closing_handles;
    loop->closing_handles = NULL;
    while (p) {
        q = p->next_closing;
        uv__finish_close(p);
        p = q;
    }
}

// 执行 close 阶段的回调
static void uv__finish_close(uv_handle_t* handle) {
    handle->flags |= UV_HANDLE_CLOSED;
    // ...
    uv__handle_unref(handle);
    // 移出 handle 队列
    QUEUE_REMOVE(&handle->handle_queue);
    // 执行回调
    if (handle->close_cb) {
        handle->close_cb(handle);
    }
}

```

下面看一个使用了uv_close 的例子（代码来自 Libuv 中的文件监听模块，省略部分代码）

```c
int uv_fs_poll_start(...) {    
    // 分配一块堆内存
    struct poll_ctx* ctx = uv__calloc(1, sizeof(*ctx) + len);
    // 保存到 handle 中
    handle->poll_ctx = ctx;
}
```

uv_fs_poll_start 用于执行开始监听文件的操作，它在 handle 里挂载了一个在堆上分配的结构体，当结束监听的时候，需要释放掉这块内存。

```c
int uv_fs_poll_stop(uv_fs_poll_t* handle) {
    struct poll_ctx* ctx;
    ctx = handle->poll_ctx;
    handle->poll_ctx = NULL;
    uv_close((uv_handle_t*)&ctx->timer_handle, timer_close_cb);
}

```

uv_fs_poll_stop 通过 uv_close 函数关闭 handle，并传入了回调 timer_close_cb，所以在 close 阶段就会执行 timer_close_cb。

```c
// 释放上下文结构体的内存
static void timer_close_cb(uv_handle_t* handle) {
    uv__free(container_of(handle, struct poll_ctx, timer_handle));
}
```

可以看到，最后在 close 阶段释放这块内存。

### timer 阶段

timer 阶段是用于实现定时器的，定时器是大多数基于事件驱动架构的软件需要实现的部分。因为 V8 中没有提供定时器的功能，在前端时是由浏览器实现的，而在 Node.js 里，定时器由 Libuv 实现。

定时器的实现原理很简单，主要是借助事件驱动模块的阻塞时间来实现，通常就是维护了一个数据结构，然后把最快到期的时间设置为事件驱动模块的阻塞时间，如果一定时间内没有其他事件触发，那么进程就会从事件驱动模块中返回，从而处理定时器。但是因为定时器使用非常频繁，所以如何实现一个高性能的定时器是需要重点考虑的事情。

Libuv 中，在底层里面维护了一个最小堆，每个定时节点就是堆里面的一个节点，越早超时的节点就在越上面。等到定时器阶段的时候， Libuv 就会从上往下去遍历这个最小堆判断当前节点有没有超时，如果碰到没有到期的节点，那么后面节点也不需要去判断了，因为根据最小堆的性质，最早到期的节点都没有到期，那么它后面节点显然也不会到期。如果当前节点到期了，那么就会执行它的回调，并且把它移出这个最小堆。

定时器的概念是超时后会执行一个回调，如果用户需要周期性执行一个回调，例如 Node.js setInterval 的这种场景，就可以给这个节点设置了repeat 标记，那么这个节点每次超时执行完回调后，就会被重新插入到最小堆中，等待下一次的超时。有意思的是，Libuv 的定时器支持 timeout1 后触发第一次超时，后续每隔 timeout2 触发一次超时。整体结构如下图所示。

定时器的使用：

```c
int main() {
    v_timer_t once;
    uv_timer_init(uv_default_loop(), &once);
    // 超时后执行 once_cb，0 表示只执行一次回调，设置为 n 代表第一次超时后，下次超时时间
    uv_timer_start(&once, once_cb, 10, 0);
    uv_run(uv_default_loop(), UV_RUN_DEFAULT);
    return 0;        
}
```

```c
// 初始化uv_timer_t结构体
int uv_timer_init(uv_loop_t* loop, uv_timer_t* handle) {
    uv__handle_init(loop, (uv_handle_t*)handle, UV_TIMER);
    handle->timer_cb = NULL;
    handle->repeat = 0;
    return 0;
}

```
uv_timer_init 函数和其他阶段的 init 函数一样，用于初始化 handle 的一些字段。接着看 start 函数，该函数是启动一个定时器（省略部分代码）。

```c
// 启动一个计时器
int uv_timer_start(uv_timer_t* handle,
                   uv_timer_cb cb,
                   uint64_t timeout,
                   uint64_t repeat) {
        uint64_t clamped_timeout;
        // 重新执行 start 的时候先把之前的停掉
        if (uv__is_active(handle))
            uv_timer_stop(handle);
        // 超时时间，为绝对值
        clamped_timeout = handle->loop->time + timeout;
        // 初始化回调，超时时间，是否重复计时，赋予一个独立无二的 id
        handle->timer_cb = cb;
        handle->timeout = clamped_timeout;
        handle->repeat = repeat;
        handle->start_id = handle->loop->timer_counter++;
        // 插入最小堆
        heap_insert(timer_heap(handle->loop), (struct heap_node) &handle->heap_node, timer_less_than);
        // 激活该 handle
        uv__handle_start(handle);
        return 0;
}

```

uv_timer_start 函数首先初始化 handle 里的某些字段，包括超时回调，是否重复启动定时器，超时的绝对时间等，接着把 handle 节点插入到最小堆中，heap_insert 会根据该节点的超时时间动态调整最小堆，最后给这个 handle 打上标记，并激活这个handle。在 timer 阶段时就会判断有没有定时器超时，有则执行回调。

```c
// 找出已经超时的节点，并且执行里面的回调
void uv__run_timers(uv_loop_t* loop) {
    struct heap_node* heap_node;
    uv_timer_t* handle;
    for (;;) {
        heap_node = heap_min(timer_heap(loop));
        if (heap_node == NULL)
            break;
        handle = container_of(heap_node, uv_timer_t, heap_node);
        // 如果当前节点的时间大于当前时间则返回，说明后面的节点也没有超时
        if (handle->timeout > loop->time)
            break;
        // 移除该计时器节点
        uv_timer_stop(handle);
        // 如果设置了 repeat 则重新插入最小堆，等待下次超时
        uv_timer_again(handle);
        // 执行超时回调
        handle->timer_cb(handle);
    }
}

```

uv__run_timers 函数的逻辑就是遍历最小堆，找出当前超时的节点。因为最小堆的性质是父节点肯定比孩子小。所以如果找到一个节点，它没有超时，则后面的节点也不会超时。对于超时的节点就执行它的回调。执行完回调后，还有两个关键的操作：第一是 uv_timer_stop；第二是 uv_timer_again。

```c
// 停止一个计时器
int uv_timer_stop(uv_timer_t* handle) {
    if (!uv__is_active(handle))
        return 0;
    // 从最小堆中移除该计时器节点
    heap_remove(timer_heap(handle->loop), (struct heap_node*) &handle->heap_node, timer_less_than);
    // 清除激活状态和 handle 的 active 数减一
    uv__handle_stop(handle);
    return 0;
}

```

uv_timer_stop 把 handle 从二叉堆中删除。uv_timer_again 则是为了支持 setInterval 这种场景。

```c
int uv_timer_again(uv_timer_t* handle) {
    // 如果设置了 repeat 标记说明计时器是需要重复触发的
    if (handle->repeat) {
        // 先把旧的计时器节点从最小堆中移除，然后再重新开启一个计时器
        uv_timer_stop(handle);
        uv_timer_start(handle, handle->timer_cb, handle->repeat, handle->repeat);
    }
    return 0;
}

```

如果 handle 设置了 repeat 标记，则在该 handle 第一次超时后，每隔 repeat 毫秒就会继续执行超时回调。这就是 Node.js 里定时器的底层原理，但 Node.js 并不是每次调 setTimeout 的时候都往最小堆插入一个节点，因为这样会引起 JS 层和 C、C++ 层频繁通信，导致性能损毁。因此在 Node.js 里，只有一个关于 uv_timer_s 的 handle，它在 JS 层维护了一个数据结构，每次计算出最快到期节点的时间，然后修改 Libuv handle 的超时时间。

timer 阶段是依赖事件驱动模块实现的，因为事件驱动模块可能会引起线程阻塞，为了保证线程可以按时执行定时器的回调，事件驱动模块会定时阻塞，阻塞的时长就是最快到期的定时器节点的时长。


### Poll IO 阶段


Poll IO 是 Libuv 最重要的一个阶段，可以说 Libuv 的驱动引擎。网络 IO、线程池完成任务、信号处理等回调都是在这个阶段处理的，所以这也是最复杂的一个阶段。这个阶段本质上是对各个操作系统事件驱动模块的封装，比如 Linux 的 epoll 和 MacOS 的 kqueue 等，这部分的技术也是大多数软件中用到的，所以也很通用。开始分析这个阶段之前，我们先了解一下 Poll IO 阶段最重要的数据结构 IO 观察者。

IO 观察者

IO 观察者是 Libuv 中的核心数据结构，本质上是封装了文件描述符、感兴趣的事件和回调的结构体。那它是如何作用于事件驱动模块的呢，我们下面详细分析。

```c
struct uv__io_s {
    // 事件触发后的回调
    uv__io_cb cb;
    // 用于插入队列
    void* pending_queue[2];
    void* watcher_queue[2];
    // 保存当前感兴趣的事件，还没有同步的操作系统。每次设置时首先保存事件在这个字段，然后 Poll IO 阶段再操作事件驱动模块更新到操作系统
    unsigned int pevents; 
    // 保存更新到操作系统的事件，每次 Poll IO 阶段更新 pevents 的值到操作系统后就把 pevents 同步到 events
    unsigned int events;
    // 标记对哪个文件描述符的事件感兴趣
    int fd;
};
```

Libuv 会维护一个 IO 观察者队列，根据 IO 观察者描述的信息，在Poll IO 阶段往底层的事件驱动模块注册相应的信息。当注册的事件触发时，IO 观察者的回调就会被执行。接下来看看 IO 观察者的一些操作。


初始化 IO 观察者

```c
void uv__io_init(uv__io_t* w, uv__io_cb cb, int fd) {  
    // 初始化队列，回调，需要监听的 fd  
    QUEUE_INIT(&w->pending_queue);  
    QUEUE_INIT(&w->watcher_queue);  
    w->cb = cb;  
    w->fd = fd;  
    w->events = 0;  
    w->pevents = 0;  
}  
```
pevents 表示应用当前感兴趣的事件，events 字段表示当前设置到操作系统的事件，因为应用设置感兴趣时是直接修改 pevents 的，但是这个信息并不会实时同步到操作系统，而是在 Poll IO 阶段才进行同步，所以需要两个字段记录，后面我们会看到它们具体的作用。

注册事件

```c
void uv__io_start(uv_loop_t* loop, uv__io_t* w, unsigned int events) {  
    // 设置当前感兴趣的事件，但还没有同步到操作系统，等到 Poll IO 阶段再同步  
    w->pevents |= events;  
    // 扩容 loop->watchers，如果需要的话
    maybe_resize(loop, w->fd + 1); 
    // 事件没有变化则直接返回 
    if (w->events == w->pevents)  
        return;  
    // IO 观察者如果还没插入队列则插入 IO 观察者队列，等待 Poll IO 阶段的处理  
    if (QUEUE_EMPTY(&w->watcher_queue))  
        QUEUE_INSERT_TAIL(&loop->watcher_queue, &w->watcher_queue);  
    // 保存映射关系，事件触发时通过 fd 获取对应的 IO 观察者，见 Poll IO 阶段的处理逻辑
    if (loop->watchers[w->fd] == NULL) {  
        loop->watchers[w->fd] = w;  
        loop->nfds++;  
    }  
}  
```

uv__io_start 函数的逻辑主要如下:
1. 保存当前感兴趣的事情，但是还没有同步到操作系统。
2. 把一个 IO 观察者插入到事件循环的观察者队列中，然后 Libuv 在 Poll IO 阶段会处理这个队列的数据，比如注册到操作系统中。
3. 在 watchers 数组中保存一个映射关系，当从事件驱动模块返回时，Libuv 会根据拿到的 fd 从 watchers 中找到对应的 IO 观察者，从而执行回调，具体逻辑可参考下面的内容。


注销事件

```c
void uv__io_stop(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  // 清除不感兴趣的事件
  w->pevents &= ~events;
  /* 
      如果对任何事件都不感兴趣了，则把 loop->watchers[w->fd] 置 NULL，Poll IO 阶段会用到。
      如果还有感兴趣的事件
          并且还没有在 IO 观察者队列，则插入，等待 Poll IO阶段修改操作系统数据。
          已经插入 IO 观察者队列了，则等待 Poll IO 阶段修改操作系统数据即可
  */
  if (w->pevents == 0) {
    // 移出 IO 观察者队列
    QUEUE_REMOVE(&w->watcher_queue);
    QUEUE_INIT(&w->watcher_queue);
    w->events = 0;
    // 置空，但是不会修改操作系统的数据，所以之前感兴趣的事件还是可能触发，
    // Poll IO 阶段 需要通过 loop->watchers[w->fd] 为 NULL 进行过滤
    if (w == loop->watchers[w->fd]) {
      loop->watchers[w->fd] = NULL;
      loop->nfds--;
    }
  }
  else if (QUEUE_EMPTY(&w->watcher_queue))
    QUEUE_INSERT_TAIL(&loop->watcher_queue, &w->watcher_queue);
}

```
uv__io_stop 用于修改 IO 观察者感兴趣的事件，主要逻辑如下。

修改当前感兴趣的事件，但是还没有同步到操作系统。
如果还有感兴趣的事件并且 IO 观察者还没有插入 IO 观察者队列，则插入队列，否则不需要操作，因为修改的事件会在 Poll IO 阶段同步到操作系统，只需要保证 IO 观察者在队列里就行。
如果当前没有感兴趣的事件，则需要移出 IO 观察者队列，并删除 fd 到 IO 观察者的映射关系，但是不会实时地从事件驱动模块中注销这个 fd 的事件，因为 uv__io_stop 的语义是注销事件，后续还可以通过 uv__io_start 重新注册事件，所以实现上选择了先不注销事件驱动模块中的 fd 事件，减少一次系统调用，如果后续没有调用 uv__io_start，而又有事件触发时，Libuv 才会真正注销事件驱动中该 fd 对应的事件。
另外需要注意的是，当调用 uv__io_stop 注销事件时，注销的事件可能已经触发，比如在回调 1 里注销了回调 2 的事件，所以在 Poll IO 阶段时需要根据 pevents 进行判断，过滤已经被注销的事件，也就是说不需要执行相应的回调了。


关闭 IO 观察者

```c
void uv__io_close(uv_loop_t* loop, uv__io_t* w) {
  // 注销事件
  uv__io_stop(loop, w, POLLIN | POLLOUT | UV__POLLRDHUP | UV__POLLPRI);
  // 移出 pending 队列，如果在的话
  QUEUE_REMOVE(&w->pending_queue);
  // 从操作系
  if (w->fd != -1)
    uv__platform_invalidate_fd(loop, w->fd);
}

```

uv__io_close 首先调用了 uv__io_stop 注销所有事件，然后调用 uv__platform_invalidate_fd。

```c
void uv__platform_invalidate_fd(uv_loop_t* loop, int fd) {
    struct epoll_event* events;
    struct epoll_event dummy;
    uintptr_t i;
    uintptr_t nfds;
    // events 和 nfds 为本轮 Poll IO 阶段返回的，代表触发的事件和个数
    events = (struct epoll_event*) loop->watchers[loop->nwatchers];
    nfds = (uintptr_t) loop->watchers[loop->nwatchers + 1];
    // 修改对应的结构体的 fd 为 -1
    for (i = 0; i < nfds; i++)
      if (events[i].data.fd == fd)
        events[i].data.fd = -1;

    memset(&dummy, 0, sizeof(dummy));
    // 从事件驱动模块注销 fd
    epoll_ctl(loop->backend_fd, EPOLL_CTL_DEL, fd, &dummy);
}
```

uv__platform_invalidate_fd 会修改 Poll IO 阶段返回的事件结构体的 fd 为 -1。接着从事件驱动模块注销这个 fd 感兴趣的所有事件，这两步都是必要的，因为删除操作系统中感兴趣的事件只能保证后面不会触发，但是这个事件可能已经在本轮 Poll IO 阶段中触发，并等待处理，比如回调 1 里关闭了回调 2 的 IO 观察者，所以 Poll IO 阶段需要根据 fd 是否为 -1 进行过滤。

和 uv__io_stop 不一样的是，uv__io_close 会实时注销事件驱动模块中该 fd 对应的事件，因为 uv__io_close 的语义是这个 IO 观察者不会再被使用了，并且通常调用 uv__io_close 后 Libuv 会马上关闭 fd，如果这时候不实时地调用事件驱动模块注销该 fd 的事件，那就没有机会注销了。我们可以看看操作系统的代码：

```c
int do_epoll_ctl(int epfd, int op, int fd, struct epoll_event *epds, bool nonblock)
{
    int error;
    struct fd f;
    error = -EBADF;
    // 通过 fd 获取对应的结构体，已经关闭的 fd 则不会有对应的结构体
    tf = fdget(fd);
    if (!tf.file)
        goto error_fput;
    // ...
}
```

可以看到，当我们调用事件驱动模块注销一个 fd 的事件时，如果这个 fd 已经被关闭，则会报错，所以 uv__io_close 需要在 fd 关闭之前注销 fd 的事件。

了解了 IO 观察者后，下面我们开始分析 Poll IO 阶段，Poll IO 具体处理逻辑在 uv__io_poll 这个函数。这个函数比较复杂，我们分开分析。

处理 IO 观察者注册事件
应用订阅的事件会首先保存到 IO 观察者中，然后在 Poll IO 阶段被处理，而不是在订阅时就实时处理，尽可能避免过多系统调用。

```c
uv__io_t* w;
// 遍历 IO 观察者队列
while (!QUEUE_EMPTY(&loop->watcher_queue)) {
    // 取出当前头节点
    q = QUEUE_HEAD(&loop->watcher_queue);
    // 移出队列
    QUEUE_REMOVE(q);
    // 重置节点的前后指针
    QUEUE_INIT(q);
    // 通过结构体成功获取结构体首地址
    w = QUEUE_DATA(q, uv__io_t, watcher_queue);
    // 设置当前感兴趣的事件
    e.events = w->pevents;
    // 记录 fd，事件触发后再通过 fd 从 loop->watchs 字段里找到对应的 IO 观察者
    e.data.fd = w->fd;
    // w->events 为 0 ，则新增，否则修改
    if (w->events == 0)
        op = EPOLL_CTL_ADD;
    else
        op = EPOLL_CTL_MOD;
    // 修改 epoll 的数据
    epoll_ctl(loop->backend_fd, op, w->fd, &e);
    // 记录当前最新的状态
    w->events = w->pevents;
}
```

第一步首先遍历 IO 观察者，修改 epoll 的数据，即注册 fd 感兴趣的事件，epoll 需要针对每个 IO 观察者调用一次系统调用 epoll_ctl，相比来说 kqueue 支持批量操作。

```c
  struct kevent events[1024];
  struct kevent* ev;
  struct timespec spec;
  unsigned int nevents;
  unsigned int revents;
  QUEUE* q;
  uv__io_t* w;

  nevents = 0;

  while (!QUEUE_EMPTY(&loop->watcher_queue)) {
    q = QUEUE_HEAD(&loop->watcher_queue);
    QUEUE_REMOVE(q);
    QUEUE_INIT(q);

    w = QUEUE_DATA(q, uv__io_t, watcher_queue);
    // 之前没有设置 POLLIN，但现在设置 POLLIN，则通知操作系统
    if ((w->events & POLLIN) == 0 && (w->pevents & POLLIN) != 0) {
      filter = EVFILT_READ;
      fflags = 0;
      op = EV_ADD;
      // 把字段的值设置到第 n 个 kevent 结构体
      EV_SET(events + nevents, w->fd, filter, op, fflags, 0, 0);
      // 如果还没到 1024 个则继续操作，到 1024 个后调用系统调用函数 kevent 进行批量操作
      if (++nevents == ARRAY_SIZE(events)) {
        if (kevent(loop->backend_fd, events, nevents, NULL, 0, NULL))
          abort();
        // 重置索引
        nevents = 0;
      }
    }
    // 省略部分代码
  }
```

可以看到 kqueue 可以累积多个 IO 观察者的事件进行批量设置，这样可以减少系统调用的次数，一定程度提高性能。接着看处理完 IO 观察者后的逻辑。

等待事件触发或超时

```c
// 阻塞等待事件或超时，events 保存就绪的事件，nfds 保存就绪的事件个数
int nfds = epoll_wait(loop->backend_fd, events, ARRAY_SIZE(events),  timeout);

```
epoll_wait 用于阻塞等待事件的触发，这就是前面提到的阻塞 / 唤醒机制的实现。epoll_wait 除了在事件触发时返回，还支持超时的概念，也就是如果超过一定的时间还没有事件触发，则返回。阻塞时间的计算规则如下：

0 代表不阻塞；
> 0 代表最多阻塞一段时间；
< 0 代表一直阻塞，直到有事件发生。
Libuv 中，这个超时时间由 uv_backend_timeout 实现。

```c
int uv_backend_timeout(const uv_loop_t* loop) {
    // 下面几种情况下返回 0 ，即不阻塞在epoll_wait
    if (loop->stop_flag != 0)
        return 0;
    // 没有事件需要处理，则不需要阻塞 poll io 阶段
    if (!uv__has_active_handles(loop) && !uv__has_active_reqs(loop))
        return 0;
    // idle 阶段有任务，不阻塞，尽快返回处理 idle 任务
    if (!QUEUE_EMPTY(&loop->idle_handles))
        return 0;
    // 同上
    if (!QUEUE_EMPTY(&loop->pending_queue))
        return 0;
    // 同上
    if (loop->closing_handles)
        return 0;
    // 返回下一个最早过期的时间，即最早超时的节点
    return uv__next_timeout(loop);
}
```

从 uv_backend_timeout 中可以知道，Libuv 的各个阶段中，只有 prepare 和 check 阶段的任务不会影响 Poll IO 阶段的超时时间的计算。回到 uv_backend_timeout，除了返回 0 的情况外，剩下的就是计算最快超时的节点的时间，以此作为事件循环阻塞的最长时间，因为 Libuv 需要保证定时器按时执行。下面看看定时器的计算逻辑。

```c
int uv__next_timeout(const uv_loop_t* loop) {
  const struct heap_node* heap_node;
  const uv_timer_t* handle;
  uint64_t diff;
  heap_node = heap_min(timer_heap(loop));
  // 没有定时器则事件循环一直阻塞
  if (heap_node == NULL)
    return -1;
  handle = container_of(heap_node, uv_timer_t, heap_node);
  // 已经超时的节点会被 timer 阶段执行，这里不太可能出现
  if (handle->timeout <= loop->time)
    return 0;
  // 计算最快超时的节点还需要多久超时，以此作为事件循环的最长阻塞时间
  diff = handle->timeout - loop->time;
  if (diff > INT_MAX)
    diff = INT_MAX;
  return (int) diff;
}
```

uv__next_timeout 判断是否有定时器，有则返回最快到期节点的时间

处理触发的事件

从上面的分析中可知， epoll_wait 返回时，可能是超时，也可能是有事件触发，具体需要根据 epoll_wait 的返回值判断，epoll_wait 返回值表示有多少个 fd 的事件触发了。

```c
/*
    epoll_wait 可能会引起主线程阻塞，具体要根据 Libuv 当前的情况。所以
    wait 返回后需要更新当前的时间，否则在使用的时候时间差会比较大。因为
    Libuv 会在每轮时间循环开始的时候缓存当前时间这个值。其他地方直接使用，
    而不是每次都去获取。
*/
uv__update_time(loop);
// 遍历有事件触发的 fd
for (i = 0; i < nfds; i++) {
    // 哪个 fd 触发了什么事情
    pe = events + i;
    fd = pe->data.fd;
    // 根据 fd 获取 IO 观察者
    w = loop->watchers[fd];
    // 执行回调
    if (pe->events != 0) {
        w->cb(loop, w, pe->events);
    }
}
```

通过 epoll_wait 返回的事件和个数，从根据事件结构体找到关联的 IO 观察者，然后执行对应回调即可。


删除事件的处理

刚才介绍的是事件注册到事件触发和处理的过程，还有一个重要的事情需要处理，那就是过滤掉已经注销的事件。这个事情的重点在于，如果之前订阅的事件触发了，但目前又不感兴趣了，应该如何处理这种过期的事件，这个过期事件可能来源于 Libuv 还没有同步最新的数据到操作系统，也可能来源于前面的回调删除了后面回调的事件或 IO 观察者，比如在回调 1 里注销了回调 2 的事件，那么就不需要执行回调 2 了。接下来看如何实现对这些情况的判断。


```c
for (i = 0; i < nfds; i++) {
    pe = events + i;
    fd = pe->data.fd;
    // fd 无效则不需要处理了（调用了 uv__io_close）
    if (fd == -1)
        continue;
    // IO 观察者已经被删除则不需要执行回调了（调用了 uv__io_stop），并且删除操作系统的数据
    w = loop->watchers[fd];
    if (w == NULL) {
        epoll_ctl(loop->backend_fd, EPOLL_CTL_DEL, fd, pe);
        continue;
    }
    // 和当前感兴趣的事件 w->pevents 进行 & 操作，保证剩下的事件 pe->events 已经触发且感兴趣的
    pe->events &= w->pevents | POLLERR | POLLHUP;
    if (pe->events != 0) {
        w->cb(loop, w, pe->events);
    }
}
```

从上面代码中可以看到，Libuv 会根据 uv__io_stop 和 uv__io_close 设置的各种标记进行过滤，避免处理过期的事件。下面是 Poll IO 阶段的整体流程图。


总结：

事件循环是一个非常通用的技术，简单来说就是在一个循环中不断地处理生产者产生的任务。这节课我们介绍了事件循环的概念，然后按照简单到复杂的顺序，梳理了事件循环各个执行阶段的具体实现，可以清晰地了解到 Node.js 中哪些任务是在哪个阶段被执行的。

其中，Poll IO 阶段是最重要也是最复杂的一个阶段， Node.js 的网络 IO、线程池完成任务、信号处理等回调都是在这个阶段处理的。因此，我们要重点学习它，具体有以下几点。

事件驱动是操作系统提供的一种订阅 / 发布机制，由 IO 多路复用模块实现，且不同操作系统中提供的系统调用不一样，我们需要了解它的工作原理和使用方式。
IO 观察者是 Poll IO 阶段最重要的数据结构，它本质上是封装了 fd、感兴趣的事件和回调函数。结合事件驱动模块，就可以实现对 fd 的处理，例如网络数据的读写。