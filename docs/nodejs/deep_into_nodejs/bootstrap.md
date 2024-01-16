# Node.js的启动过程

图9-1

整体的逻辑：

```c++
int main(int argc, char* argv[]) {
  setvbuf(stdout, nullptr, _IONBF, 0);
  setvbuf(stderr, nullptr, _IONBF, 0);
  return node::Start(argc, argv);
}

```

main 函数的开头通过 setvbuf 设置了不缓冲标准输出流和标准错误流的数据，而是直接输出，因为当我们调用 C API 输出数据时，最终需要调用操作系统的 API 进行处理，C 库的 API 为了减少对系统调用的次数，会先对数据进行缓存，等到合适的时机再调用系统调用，比如遇到换行时。类似 TCP 协议通常是积累一定数据才会组包发送一样。setvbuf 和 _IONBF 用于禁止缓冲行为，实时输出。接着看 Start。

```c++
int Start(int argc, char** argv) {
  // 注册 C++ 模块、解析命令行参数、初始化 V8
  InitializationResult result = InitializeOncePerProcess(argc, argv);

  NodeMainInstance main_instance(&params,
                                 uv_default_loop(),
                                 per_process::v8_platform.Platform(),
                                 result.args,
                                 result.exec_args,
                                 indexes);
  main_instance.Run();

  return result.exit_code;
}
```

Start 里主要两个逻辑，首先看 InitializeOncePerProcess。

```c++
InitializationResult InitializeOncePerProcess(int argc, char** argv) {
  // 注册 C++ 模块
  binding::RegisterBuiltinModules();
  // 解析命令行参数
  ProcessGlobalArgs();
  // 初始化 V8 Platform
  per_process::v8_platform.Initialize(per_process::cli_options->v8_thread_pool_size);
  // 初始化 V8
  V8::Initialize();
}
```

InitializeOncePerProcess 初始化后，接着创建一个 NodeMainInstance 实例并执行它的 Run 函数。

```c++
NodeMainInstance::NodeMainInstance(
    Isolate::CreateParams* params, // 创建 isolate 的参数
    uv_loop_t* event_loop, // 事件循环
    MultiIsolatePlatform* platform, // V8 Platform
    const std::vector<std::string>& args, // 启动参数
    const std::vector<std::string>& exec_args,
    const std::vector<size_t>* per_isolate_data_indexes)
    : args_(args),
      exec_args_(exec_args),
      // ArrayBuffer（Buffer） 的内存分配器
      array_buffer_allocator_(ArrayBufferAllocator::Create()),
      isolate_(nullptr),
      platform_(platform),
      isolate_data_(nullptr),
      owns_isolate_(true) {
      
  params->array_buffer_allocator = array_buffer_allocator_.get();
  // 创建 isolate
  isolate_ = Isolate::Allocate();
  platform->RegisterIsolate(isolate_, event_loop);
  // 初始化 isolate
  Isolate::Initialize(isolate_, *params);
  // 把公共的数据封装到一起
  isolate_data_ = std::make_unique<IsolateData>(isolate_,
                                                event_loop,
                                                platform,
                                                array_buffer_allocator_.get(),
                                                per_isolate_data_indexes);
  // ...
}

int NodeMainInstance::Run() {
  int exit_code = 0;
  // 创建 Environment 对象
  DeleteFnPtr<Environment, FreeEnvironment> env = CreateMainEnvironment(&exit_code);
  // 加载 Environment
  LoadEnvironment(env.get());
}
```

NodeMainInstance 构造函数主要做了一些初始化工作，接着 调用 Run，Run 调用了 CreateMainEnvironment 创建了 一个 Environment 对象。

```c++
NodeMainInstance::CreateMainEnvironment(int* exit_code) {
  // 创建 V8 Context
  Local<Context> context = NewContext(isolate_);
  // 新建一个 Environment 对象，并记录到 context 中
  std::unique_ptr<Environment> env = std::make_unique<Environment>(
      isolate_data_.get(),
      context,
      ...);
  // 初始化 Libuv 相关的结构体                                   
  env->InitializeLibuv(per_process::v8_is_profiling);
  // 初始化诊断相关的能力
  env->InitializeDiagnostics();
  // 初始化 Inspector 相关
  env->InitializeInspector({});
  // 初始化模块加载器(BootstrapInternalLoaders())和执行内部 JS 代码(BootstrapNode())
  env->RunBootstrapping();
  return env;
}
```

创建完 Environment 后，继续执行 LoadEnvironment。

```c++
void LoadEnvironment(Environment* env) {
  StartMainThreadExecution(env);
}

MaybeLocal<Value> StartMainThreadExecution(Environment* env) {
  // 忽略执行其他 JS 代码的逻辑
  // run_main_module 中执行用户 JS 代码
  if (!first_argv.empty() && first_argv != "-") {
    return StartExecution(env, "internal/main/run_main_module");
  }
}
```

StartMainThreadExecution 中执行了用户的 JS 代码，执行用户 JS 通常会生产一些任务到 Libuv 中，最后开启事件循环。

```c++
// 开启事件循环
do {
  uv_run(env->event_loop(), UV_RUN_DEFAULT);
  more = uv_loop_alive(env->event_loop());
} while (more == true && !env->is_stopping());
```

了解了 Node.js 启动的大致流程后，我们按照 Node.js 初始化过程中的代码先后顺序对各个核心部分进行讲解。


## 注册 C++ 模块

RegisterBuiltinModules 函数的作用是注册 C++ 模块，C++ 模块用于给 JS 层提供各种底层的功能，是 Node.js 中非常核心的部分。

```c++
void RegisterBuiltinModules() {  
#define V(modname) _register_##modname();  
  NODE_BUILTIN_MODULES(V)  
#undef V  
}  
```
NODE_BUILTIN_MODULES 是一个 C 语言宏，宏展开后如下（省略类似逻辑）

```c++
void RegisterBuiltinModules() {  
#define V(modname) _register_##modname();  
  V(tcp_wrap)   
  V(fs)  
  // ...其它模块  
#undef V  
}  
```

再一步展开如下

```c++
void RegisterBuiltinModules() {  
  _register_tcp_wrap();  
  _register_fs();  
}  
```
执行了一系列 _register 开头的函数，但是我们在 Node.js 源码里找不到这些函数，因为这些函数是在每个 C++ 模块定义的文件里（src/*.cc文件的最后一行）通过宏定义的。以 tcp_wrap 模块为例，看看它是怎么做的。文件 tcp_wrap.cc 的最后一句代码

```c++
NODE_MODULE_CONTEXT_AWARE_INTERNAL(tcp_wrap, node::TCPWrap::Initialize) 
```

继续展开

```c++
#define NODE_MODULE_CONTEXT_AWARE_CPP(modname, regfunc, priv, flags\  
  static node::node_module _module = {              \  
      NODE_MODULE_VERSION,                        \  
      flags,                        \  
      nullptr,                        \  
      __FILE__,                        \  
      nullptr,                        \  
      (node::addon_context_register_func)(regfunc),  \  
      NODE_STRINGIFY(modname),                        \  
      priv,                        \  
      nullptr};                        \  
  void _register_tcp_wrap() { node_module_register(&_module); }  
```

首先定义了一个 node_module 结构体。node_module 是 Node.js 中表示 C++ 模块的数据结构，包括 一般的 C++ 模块和NAPI 模块等。

```c++
struct node_module {  
  // 版本、标记的元信息
  int nm_version;  
  unsigned int nm_flags;  
  void* nm_dso_handle;  
  const char* nm_filename;  
  // 注册模块的钩子函数
  node::addon_register_func nm_register_func;  
  node::addon_context_register_func nm_context_register_func; 
  // 模块名 
  const char* nm_modname;  
  void* nm_priv;  
  // 用于指向下一个节点
  struct node_module* nm_link;  
};  
```

定义 node_module 之后，接着定义了一个 _register 开头的函数，这里是 _register_tcp_wrap，这些函数就会在 Node.js 启动时，逐个被执行一遍，接着看这些函数都做了什么事情， _register_tcp_wrap 函数里调了 node_module_register ，并传入一个 node_module 数据结构，所以我们看一下 node_module_register 的实现


```c++
void node_module_register(void* m) {  
  struct node_module* mp = reinterpret_cast<struct node_module*>(m);  
  if (mp->nm_flags & NM_F_INTERNAL) {  
    mp->nm_link = modlist_internal;  
    modlist_internal = mp;  
  } else if (!node_is_initialized) { 
    mp->nm_flags = NM_F_LINKED;  
    mp->nm_link = modlist_linked;  
    modlist_linked = mp;  
  } else {  
    thread_local_modpending = mp;  
  }  
}  
```

C++ 内置模块的 flag 是 NM_F_INTERNAL，所以会执行第一个 if 的逻辑，modlist_internal 类似一个头指针。if 里的逻辑就是头插法建立一个单链表。所以注册 C++ 模块就是把各个模块连成一个链表，在后面模块加载的课程中会看到这个链表的使用。


## V8 Platform 初始化

注册完 C++ 模块后，接着会初始化 V8 Platform，V8 Platform 用于创建一些 worker 线程以及 trace agent。worker 线程可以用于协助处理一些任务，比如 GC 任务，trace agent 则是处理 trace event 数据的。

```c++
  // 我们可以通过命令后参数指定 thread_pool_size 大小，从而指定线程池大小
  inline void Initialize(int thread_pool_size) {
    // 创建并记录 trace agent
    tracing_agent_ = std::make_unique<tracing::Agent>();
    node::tracing::TraceEventHelper::SetAgent(tracing_agent_.get());
    // 如果命令行设置了 trace event category 则开启 trace agent
    if (!per_process::cli_options->trace_event_categories.empty()) {
      StartTracingAgent();
    }
    // 创建 Platform 对象
    platform_ = new NodePlatform(thread_pool_size, controller);
    // 保存到 V8，V8 会使用该 Platform
    v8::V8::InitializePlatform(platform_);
  }
```

trace events 用于收集 Node.js / V8 内核的一些数据，这里我们不关注，接下来看一下 NodePlatform 的构造函数。

```c++
NodePlatform::NodePlatform(int thread_pool_size,
                           TracingController* tracing_controller) {
   worker_thread_task_runner_ = std::make_shared<WorkerThreadsTaskRunner>(thread_pool_size);
}
```

NodePlatform 中创建了 WorkerThreadsTaskRunner 对象。

```c++
WorkerThreadsTaskRunner::WorkerThreadsTaskRunner(int thread_pool_size) {
  Mutex platform_workers_mutex;
  ConditionVariable platform_workers_ready;

  Mutex::ScopedLock lock(platform_workers_mutex);
  int pending_platform_workers = thread_pool_size;
  // 延迟任务处理线程，即该任务会在一定时间后被执行，pending_worker_tasks_ 为任务队列
  delayed_task_scheduler_ = std::make_unique<DelayedTaskScheduler>(&pending_worker_tasks_);
  threads_.push_back(delayed_task_scheduler_->Start());
  // 创建线程池
  for (int i = 0; i < thread_pool_size; i++) {
    // pending_worker_tasks_ 为线程池的任务任务
    PlatformWorkerData* worker_data = new PlatformWorkerData{
      &pending_worker_tasks_, ...
    };
    std::unique_ptr<uv_thread_t> t { new uv_thread_t() };
    // 创建子线程
    if (uv_thread_create(t.get(), PlatformWorkerThread,
                         worker_data) != 0) {
      break;
    }
    threads_.push_back(std::move(t));
  }

  // 等待子线程启动成功
  while (pending_platform_workers > 0) {
    platform_workers_ready.Wait(lock);
  }
}

```

WorkerThreadsTaskRunner 中创建了很多子线程，我们分开分析。首先看看 DelayedTaskScheduler 线程，DelayedTaskScheduler 用于管理延时任务，也就是说当一个任务插入 DelayedTaskScheduler 时，他不是被立即执行的，而是会延迟一段时间。

```c++
class WorkerThreadsTaskRunner::DelayedTaskScheduler {
 public:
  explicit DelayedTaskScheduler(TaskQueue<Task>* tasks)
  // 保存任务队列，延迟任务超时后把任务插入该任务队列
    : pending_worker_tasks_(tasks) {}
  // 启动线程
  std::unique_ptr<uv_thread_t> Start() {
    auto start_thread = [](void* data) {
      static_cast<DelayedTaskScheduler*>(data)->Run();
    };
    // 创建线程
    std::unique_ptr<uv_thread_t> t { new uv_thread_t() };
    uv_sem_init(&ready_, 0);
    CHECK_EQ(0, uv_thread_create(t.get(), start_thread, this));
    uv_sem_wait(&ready_);
    uv_sem_destroy(&ready_);
    return t;
  }
  // 提交延迟任务
  void PostDelayedTask(std::unique_ptr<Task> task, double delay_in_seconds) {
    tasks_.Push(std::make_unique<ScheduleTask>(this, std::move(task),
                                               delay_in_seconds));
    uv_async_send(&flush_tasks_);
  }

 private:
  // 子线程里执行的函数
  void Run() {
    loop_.data = this;
    // 初始化数据结构
    CHECK_EQ(0, uv_loop_init(&loop_));
    flush_tasks_.data = this;
    // 初始化 async handle，用于其他线程插入任务时唤醒子线程
    CHECK_EQ(0, uv_async_init(&loop_, &flush_tasks_, FlushTasks));
    uv_sem_post(&ready_);
    // 执行单独的事件循环
    uv_run(&loop_, UV_RUN_DEFAULT);
    CheckedUvLoopClose(&loop_);
  }
  // 子线程处理任务函数，逐个执行任务
  static void FlushTasks(uv_async_t* flush_tasks) {
    DelayedTaskScheduler* scheduler =
        ContainerOf(&DelayedTaskScheduler::loop_, flush_tasks->loop);
    while (std::unique_ptr<Task> task = scheduler->tasks_.Pop())
      task->Run();
  }
```

主线程执行 Start 开启子线程，然后子线程执行 Run 进行初始化，接着就进入事件循环，其他线程可以通过 PostDelayedTask 提交一个 ScheduleTask 任务，PostDelayedTask 会唤醒 DelayedTaskScheduler 子线程处理任务，来看一下执行 ScheduleTask 任务时的逻辑。

```c++
class ScheduleTask : public Task {
   public:
    ScheduleTask(DelayedTaskScheduler* scheduler,
                 std::unique_ptr<Task> task,
                 double delay_in_seconds)
      : scheduler_(scheduler),
        task_(std::move(task)),
        delay_in_seconds_(delay_in_seconds) {}

    void Run() override {
      uint64_t delay_millis = llround(delay_in_seconds_ * 1000);
      std::unique_ptr<uv_timer_t> timer(new uv_timer_t());
      CHECK_EQ(0, uv_timer_init(&scheduler_->loop_, timer.get()));
      timer->data = task_.release();
      // 启动一个定时器，超时后执行 RunTask
      CHECK_EQ(0, uv_timer_start(timer.get(), RunTask, delay_millis, 0));
      scheduler_->timers_.insert(timer.release());
    }

   private:
    DelayedTaskScheduler* scheduler_;
    std::unique_ptr<Task> task_;
    double delay_in_seconds_;
  };
```

可以看到执行 ScheduleTask 任务时会先往 DelayedTaskScheduler 子线程的事件循环中插入一个定时器，等到定时器超时时执行 RunTask。

```c++
  static void RunTask(uv_timer_t* timer) {
    DelayedTaskScheduler* scheduler =
        ContainerOf(&DelayedTaskScheduler::loop_, timer->loop);
    scheduler->pending_worker_tasks_->Push(scheduler->TakeTimerTask(timer));
  }
```

RunTask 会把任务插入真正的任务队列。这个队列由 Platform 的线程池处理。下面看看 Platform 的线程池，工作函数是 PlatformWorkerThread。

```c++
static void PlatformWorkerThread(void* data) {
  std::unique_ptr<PlatformWorkerData>
      worker_data(static_cast<PlatformWorkerData*>(data));

  TaskQueue<Task>* pending_worker_tasks = worker_data->task_queue;
  // 通知主线程，子线程启动成功 
  {
    Mutex::ScopedLock lock(*worker_data->platform_workers_mutex);
    (*worker_data->pending_platform_workers)--;
    worker_data->platform_workers_ready->Signal(lock);
  }
  // 不断处理任务队列里的任务
  while (std::unique_ptr<Task> task = pending_worker_tasks->BlockingPop()) {
    task->Run();
    pending_worker_tasks->NotifyOfCompletion();
  }
}
```

子线程的逻辑很简单，就是遍历任务队列然后执行每个任务。接着看两个产生任务的函数。

```c++
// 直接提交到线程池的任务队列
void NodePlatform::CallOnWorkerThread(std::unique_ptr<Task> task) {
  worker_thread_task_runner_->PostTask(std::move(task));
}

// 提交到延迟任务处理线程，超时后再提交到线程池的任务队列
void NodePlatform::CallDelayedOnWorkerThread(std::unique_ptr<Task> task,
                                             double delay_in_seconds) {
  worker_thread_task_runner_->PostDelayedTask(std::move(task),
                                              delay_in_seconds);
}

void WorkerThreadsTaskRunner::PostTask(std::unique_ptr<Task> task) {
  pending_worker_tasks_.Push(std::move(task));
}

void WorkerThreadsTaskRunner::PostDelayedTask(std::unique_ptr<Task> task,
                                              double delay_in_seconds) {
  delayed_task_scheduler_->PostDelayedTask(std::move(task), delay_in_seconds);
}
```

V8 GC 时会执行上面的函数提交任务，比如回收 ArrayBuffer 内存时。

```c++
void ArrayBufferSweeper::RequestSweep(SweepingType type) {
   V8::GetCurrentPlatform()->CallOnWorkerThread(std::move(task));
}
```

又或者新生代 GC 时。

tu 9-2

Node.js 中，除了借助子线程处理任务外，还会借助主线程处理任务。具体在 Node.js 初始化时执行的 platform->RegisterIsolate(isolate_, event_loop)。

```c++
void NodePlatform::RegisterIsolate(Isolate* isolate, uv_loop_t* loop) {
  Mutex::ScopedLock lock(per_isolate_mutex_);
  auto delegate = std::make_shared<PerIsolatePlatformData>(isolate, loop);
  IsolatePlatformDelegate* ptr = delegate.get();
  auto insertion = per_isolate_.emplace(
    isolate,
    std::make_pair(ptr, std::move(delegate)));
}
```
RegisterIsolate 用于在 Platform 的 map 数据结构插入一个键对值。这里的核心数据结构是 PerIsolatePlatformData。PerIsolatePlatformData 负责管理由主线程处理的任务。

```c++
PerIsolatePlatformData::PerIsolatePlatformData(
    Isolate* isolate, uv_loop_t* loop)
  : isolate_(isolate), loop_(loop) {
  flush_tasks_ = new uv_async_t();
  CHECK_EQ(0, uv_async_init(loop, flush_tasks_, FlushTasks));
  flush_tasks_->data = static_cast<void*>(this);
  uv_unref(reinterpret_cast<uv_handle_t*>(flush_tasks_));
}
```

PerIsolatePlatformData 中初始化了一个 async handle，用于其他子线程提交任务时通知主线程处理。接着看一下如何提交任务。

```c++
platform->GetForegroundTaskRunner(isolate)->PostTask(std::move(task));
```

GetForegroundTaskRunner 代码如下

```c++
std::shared_ptr<v8::TaskRunner> NodePlatform::GetForegroundTaskRunner(Isolate* isolate) {
  return ForIsolate(isolate)->GetForegroundTaskRunner();
}

std::shared_ptr<v8::TaskRunner> PerIsolatePlatformData::GetForegroundTaskRunner() {
  return shared_from_this();
}
```
接着看 PerIsolatePlatformData 的 PostTask 和 PostDelayedTask。

```c++
void PerIsolatePlatformData::PostTask(std::unique_ptr<Task> task) {
  foreground_tasks_.Push(std::move(task));
  uv_async_send(flush_tasks_);
}

void PerIsolatePlatformData::PostDelayedTask(
    std::unique_ptr<Task> task, double delay_in_seconds) {
  std::unique_ptr<DelayedTask> delayed(new DelayedTask());
  delayed->task = std::move(task);
  delayed->platform_data = shared_from_this();
  delayed->timeout = delay_in_seconds;
  foreground_delayed_tasks_.Push(std::move(delayed));
  uv_async_send(flush_tasks_);
}
```

这两个函数的逻辑比较简单。往相应的任务队列插入一个新的任务，然后通知主线程处理。接着看任务处理函数。

```c++
void PerIsolatePlatformData::FlushTasks(uv_async_t* handle) {
  auto platform_data = static_cast<PerIsolatePlatformData*>(handle->data);
  platform_data->FlushForegroundTasksInternal();
}

bool PerIsolatePlatformData::FlushForegroundTasksInternal() {
  bool did_work = false;
  // 处理延时任务
  while (std::unique_ptr<DelayedTask> delayed =
      foreground_delayed_tasks_.Pop()) {
    did_work = true;
    uint64_t delay_millis = llround(delayed->timeout * 1000);

    delayed->timer.data = static_cast<void*>(delayed.get());
    uv_timer_init(loop_, &delayed->timer);
    // 启动定时器，超时后通过 RunForegroundTask 执行真正的任务
    uv_timer_start(&delayed->timer, RunForegroundTask, delay_millis, 0);
    uv_unref(reinterpret_cast<uv_handle_t*>(&delayed->timer));
    uv_handle_count_++;
  }
  // 处理普通任务
  std::queue<std::unique_ptr<Task>> tasks = foreground_tasks_.PopAll();
  while (!tasks.empty()) {
    std::unique_ptr<Task> task = std::move(tasks.front());
    tasks.pop();
    did_work = true;
    RunForegroundTask(std::move(task));
  }
  return did_work;
}
```

FlushTasks 的逻辑就是遍历两个任务队列，如果是普通任务队列则直接执行任务函数，如果是延迟队列则先启动一个定时器，等到定时器超时时再执行真正的任务函数。下面是一种使用的情况。

tu 9-3

创建 Environment 对象

初始化完 V8 Platform 后，接着创建 Environment 对象。Node.js 中 Environment 类（env.h）是一个很重要的类，主要用于包括一些公共的数据结构和逻辑，每一个线程对应一个 Environment 对象。Environment 类非常庞大，看一下初始化的代码

```c++
Environment::Environment(IsolateData* isolate_data,  
                         Local<Context> context,  
                         const std::vector<std::string>& args,  
                         const std::vector<std::string>& exec_args,  
                         Flags flags,  
                         uint64_t thread_id)  
    : isolate_(context->GetIsolate()),  
      isolate_data_(isolate_data),
      // ... 
      context_(context->GetIsolate(), context) { 
  // 保存命令行参数
  options_.reset(new EnvironmentOptions(*isolate_data->options()->per_env));   
  // inspector agent，用于调试诊断
  inspector_agent_ = std::make_unique<inspector::Agent>(this);
  // 关联 context 和 env  
  AssignToContext(context, ContextInfo(""));  
  // 创建其它对象  
  CreateProperties();  
}  
```

我们只看一下 AssignToContext 和 CreateProperties。

```c++
inline void Environment::AssignToContext(v8::Local<v8::Context> context,  
                                         const ContextInfo& info) {  
  // 在 context 中保存 env 对象                                           
  context->SetAlignedPointerInEmbedderData(ContextEmbedderIndex::kEnvironment, this);  
}  
```

AssignToContext 用于保存 context 和 env 的关系，这个逻辑非常重要，因为后续执行代码时，我们会进入 V8 的领域，这时候，我们只知道 Isolate 和 context。如果不保存 context 和 env 的关系，我们就不知道当前所属的 env。我们看一下如何获取对应的 env。

```c++
inline Environment* Environment::GetCurrent(v8::Isolate* isolate) {  
  v8::HandleScope handle_scope(isolate);  
  return GetCurrent(isolate->GetCurrentContext());  
}  
  
inline Environment* Environment::GetCurrent(v8::Local<v8::Context> context) {  
  return static_cast<Environment*>(  
      context->GetAlignedPointerFromEmbedderData(ContextEmbedderIndex::kEnvironment));  
}  
```

接着看一下 CreateProperties 中创建 process 对象的逻辑。

```c++
void Environment::CreateProperties() {
  Local<Object> process_object = node::CreateProcessObject(this).FromMaybe(Local<Object>());
  // 保存到 Environment 对象中
  set_process_object(process_object);
}

// node::CreateProcessObject
MaybeLocal<Object> CreateProcessObject(Environment* env) {
  Isolate* isolate = env->isolate();
  EscapableHandleScope scope(isolate);
  Local<Context> context = env->context();
  // 创建一个函数模版
  Local<FunctionTemplate> process_template = FunctionTemplate::New(isolate);
  process_template->SetClassName(env->process_string());
  Local<Function> process_ctor;
  Local<Object> process;
  // 基于函数模版创建一个函数，并通过这个函数创建一个对象
  if (!process_template->GetFunction(context).ToLocal(&process_ctor) ||
      !process_ctor->NewInstance(context).ToLocal(&process)) {
    return MaybeLocal<Object>();
  }
  // 给 process 对象设置属性，就是我们在 JS 层可以获取的那些字段
  // process.version
  READONLY_PROPERTY(process,
                    "version",
                    FIXED_ONE_BYTE_STRING(env->isolate(), NODE_VERSION));

  // process.versions
  Local<Object> versions = Object::New(env->isolate());
  READONLY_PROPERTY(process, "versions", versions);
}
```

CreateProperties 创建了 process 对象并设置了一些属性，process 对象就是我们在 JS 层用使用的 process 对象，除了在 C++ 层设置属性外，在后续的启动过程，JS 层也会设置很多属性。

## 初始化 Libuv 任务

创建完 Environment 对象后，接着执行 InitializeLibuv 初始化 Libuv 相关的数据结构以及往 Libuv 中提交任务。

```c++
void Environment::InitializeLibuv(bool start_profiler_idle_notifier) {  
  uv_unref(reinterpret_cast<uv_handle_t*>(timer_handle()));  
  uv_check_init(event_loop(), immediate_check_handle());  
  uv_unref(reinterpret_cast<uv_handle_t*>(immediate_check_handle()));
  uv_idle_init(event_loop(), immediate_idle_handle());  
  uv_check_start(immediate_check_handle(), CheckImmediate);  
  uv_prepare_init(event_loop(), &idle_prepare_handle_);  
  uv_check_init(event_loop(), &idle_check_handle_);  
  uv_async_init(  
      event_loop(),  
      &task_queues_async_,  
      [](uv_async_t* async) {  
        // ...
      });  
  uv_unref(reinterpret_cast<uv_handle_t*>(&idle_prepare_handle_));  
  uv_unref(reinterpret_cast<uv_handle_t*>(&idle_check_handle_));  
  uv_unref(reinterpret_cast<uv_handle_t*>(&task_queues_async_));  
  // …
}  
```

这些函数都是 Libuv 提供的，分别是往 Libuv 不同阶段插入任务节点，uv_unref 是修改状态为 inactived，避免影响事件循环的退出。

timer_handle 是实现 Node.js 中定时器的数据结构，对应 Libuv 的 time 阶段。
immediate_check_handle 是实现 Node.js 中 setImmediate 的数据结构，对应 Libuv 的check 阶段。
immediate_idle_handle 也是实现 Node.js 中 setImmediate 的数据结构，对应 Libuv 的 idle 阶段。
task_queues_async_ 用于子线程和主线程通信。
这里主要讲一下 4，其他的后面的课程再详细讲解。task_queues_async_ 用于其他子线程往启动线程提交一些任务，比如以下情况。

```c++
template <typename Fn>
void Environment::SetImmediateThreadsafe(Fn&& cb) {
  auto callback = std::make_unique<NativeImmediateCallbackImpl<Fn>>(
      std::move(cb), false);
  {
    Mutex::ScopedLock lock(native_immediates_threadsafe_mutex_);
    native_immediates_threadsafe_.Push(std::move(callback));
  }
  uv_async_send(&task_queues_async_);
}

template <typename Fn>
void Environment::RequestInterrupt(Fn&& cb) {
  auto callback = std::make_unique<NativeImmediateCallbackImpl<Fn>>(
      std::move(cb), false);
  {
    Mutex::ScopedLock lock(native_immediates_threadsafe_mutex_);
    native_immediates_interrupts_.Push(std::move(callback));
  }
  uv_async_send(&task_queues_async_);
  RequestInterruptFromV8();
}
```

可以看到两个不同的函数会往两个不同的任务队列里插入一个任务，然后调用 uv_async_send 通知启动线程有任务需要处理。

```c++
  uv_async_init(
      event_loop(),
      &task_queues_async_,
      [](uv_async_t* async) {
        Environment* env = ContainerOf(&Environment::task_queues_async_, async);
        // 处理队列里的任务
        env->RunAndClearNativeImmediates();
  });
```

这个逻辑很简单，主要是利用了 Libuv 提供的线程间通信机制，不过值得注意的是 Environment::RequestInterrupt 函数。该函数里调用了 RequestInterruptFromV8 和 uv_async_send 两个函数通知启动线程，这是为什么呢？因为 uv_async_send 只是通知启动线程有任务处理，且如果启动线程正阻塞在事件驱动模块，则唤醒启动线程，但是如果启动线程正在繁忙地执行 JS，甚至陷入了 JS 死循环里了，那么插入的任务就无法被处理了，这正是 RequestInterruptFromV8 解决的问题，RequestInterruptFromV8 是对 isolate()->RequestInterrupt 的封装，它是线程安全的，用于往 V8 插入一个任务，这个任务哪怕在 JS 死循环时也会被执行。通过 V8 的 Libuv 两种机制的配合，就可以保证这个任务一定会被执行，利用这个能力，我们可以做很多有趣的事情，同时也可以解决 Node.js 单线程带来的一些限制。

初始化 Loader
初始化 Libuv 的数据结构后，接着执行 RunBootstrapping 初始化模块加载器和执行内部的 JS 代码，对应的函数分别是 BootstrapInternalLoaders 和 BootstrapNode 函数。BootstrapInternalLoaders 首先定义一个变量，该变量是一个字符串数组，用于定义函数的形参列表，一会我们会看到它的作用。

```c++
std::vector<Local<String>> loaders_params = {  
      process_string(),  
      FIXED_ONE_BYTE_STRING(isolate_, "getLinkedBinding"),  
      FIXED_ONE_BYTE_STRING(isolate_, "getInternalBinding"),  
      primordials_string()
};  
```

然后再定义一个变量，是一个对象数组，用作执行函数时的实参。

```c++
    std::vector<Local<Value>> loaders_args = {  
         // 刚才创建的 process 对象
         process_object(),  
         NewFunctionTemplate(binding::GetLinkedBinding)  
             ->GetFunction(context())  
             .ToLocalChecked(),  
         NewFunctionTemplate(binding::GetInternalBinding)  
             ->GetFunction(context())  
             .ToLocalChecked(),  
         primordials()};  
```
接着 Node.js 编译执行 internal/bootstrap/loaders.js。

```c++
  ExecuteBootstrapper(this, "internal/bootstrap/loaders", &loaders_params, &loaders_args);
```
这个过程链路非常长，最后到 V8 层，就不贴出具体的代码，具体的逻辑转成 JS 如下。

```js
    function demo(process, 
                  getLinkedBinding, 
                  getInternalBinding, 
                  primordials) {  
      // internal/bootstrap/loaders.js 的代码  
    }  
    const process = {};  
    function getLinkedBinding(){}  
    function getInternalBinding() {}  
    const primordials = {};  
    const export = demo(process, 
                        getLinkedBinding, 
                        getInternalBinding, 
                        primordials);  
```

V8 会把 internal/bootstrap/loaders.js 的代码用一个函数包裹起来，形参就是 loaders_params 变量对应的四个字符串。然后执行这个函数，并且传入 loaders_args 里的那四个对象。在看 internal/bootstrap/loaders.js 代码之前，我们先看一下 getLinkedBinding, getInternalBinding 这两个函数，Node.js 在 C++ 层对外暴露了AddLinkedBinding 方法注册模块，Node.js 针对这种类型的模块，维护了一个单独的链表。getLinkedBinding 就是根据模块名从这个链表中找到对应的模块，但是我们一般用不到这个，所以就不深入分析。前面我们看到对于 C++ 内置模块，Node.js 同样维护了一个链表，getInternalBinding 就是根据模块名从这个链表中找到对应的模块。现在我们可以具体看一下 internal/bootstrap/loaders.js 的代码了。

```js
let internalBinding;  
{  
  const bindingObj = ObjectCreate(null);  
  internalBinding = function internalBinding(module) {  
    let mod = bindingObj[module];  
    if (typeof mod !== 'object') {  
      // C++ 层传进来的 C++ 模块加载器
      mod = bindingObj[module] = getInternalBinding(module);
      moduleLoadList.push(`Internal Binding ${module}`);  
    }  
    return mod;  
  };  
}  
```

Node.js 在 JS 中对 getInternalBinding 进行了一个封装，主要是加了缓存处理，在 JS 里就可以通过 internalBinding 加载 C++ 模块。接着看下面的代码。

```js
const internalBindingWhitelist = new SafeSet([,  
  'tcp_wrap',  
  // 一系列C++内置模块名  
]);  
  
{  
  const bindingObj = ObjectCreate(null);  
  process.binding = function binding(module) {  
    module = String(module);  
    if (internalBindingWhitelist.has(module)) {  
      return internalBinding(module);  
    }  
    throw new Error(`No such module: ${module}`);  
  };
}  
```

给 process 挂载里一个 binding 函数用于加载 C++ 模块，但是它只能加载白名单里的 C++ 模块。除了 C++ 模块外，我们知道 Node.js 中还有原生的 JS 模块，对于加载原生JS 模块的处理。Node.js 通过 nativeModuleRequire 加载，后面的模块加载器课程时我们再详细讲解。最后返回这两个模块加载器给C++层。

```js
return{  
  internalBinding,  
  require: nativeModuleRequire  
};  
```

C++ 层保存其中两个函数，分别用于加载内置 C++ 模块和原生 JS 模块的函数。

```c++
set_internal_binding_loader(internal_binding_loader.As<Function>());
set_native_module_require(require.As<Function>());   
```
至此，internal/bootstrap/loaders.js 分析完了。

执行内部 JS 代码

初始化完模块加载器后，接着通过 BootstrapNode 执行内部的 JS 代码，代码如下

```c++
// 获取全局变量并设置 global 属性，就是我们在 JS 层使用的 global 对象
Local<Object> global = context()->Global();  
global->Set(context(), FIXED_ONE_BYTE_STRING(isolate_, "global"), global).Check();  
/*
  执行 internal/bootstrap/node.js 时的参数
  process, require, internalBinding, primordials
*/
std::vector<Local<String>> node_params = {
    process_string(),
    require_string(),
    internal_binding_string(),
    primordials_string()};
std::vector<Local<Value>> node_args = {
    process_object(),
    // 原生模块加载器
    native_module_require(),
    // C++ 模块加载器
    internal_binding_loader(),
    primordials()};

ExecuteBootstrapper(this, "internal/bootstrap/node", &node_params, &node_args);
ExecuteBootstrapper(this, "internal/bootstrap/switches/is_main_thread", &node_params, &node_args);  
ExecuteBootstrapper(this, "internal/bootstrap/switches/does_own_process_state", &node_params, &node_args); 
```

首先在全局对象上设置一个 global 属性，值是一个全局对象，这就是我们在 Node.js 中使用的 global 对象。接着传入刚才保存的模块加载器，执行三个 JS 文件的代码，这三个文件的代码主要是挂载属性和做一些初始化工作。

```js
process.cpuUsage= wrapped.cpuUsage;  
process.resourceUsage = wrapped.resourceUsage;  
process.memoryUsage = wrapped.memoryUsage;  
process.kill = wrapped.kill;  
process.exit = wrapped.exit;  
```

设置全局变量

```js
defineOperation(global, 'clearInterval', timers.clearInterval);  
defineOperation(global, 'clearTimeout', timers.clearTimeout);  
defineOperation(global, 'setInterval', timers.setInterval);  
defineOperation(global, 'setTimeout', timers.setTimeout);  
ObjectDefineProperty(global, 'process', {  
  value: process,  
  enumerable: false,  
  writable: true,  
  configurable: true  
});  
```

这里的细节比较多，就不具体展开，后续用到的时候再单独介绍。

执行用户 JS 代码
经过前面一系列的操作，完成了 C++ 层的初始化，也完成了 JS 层的初始化，最终通过 StartMainThreadExecution 执行用户 JS 代码（internal/main/run_main_module.js）。

```js
const {
  prepareMainThreadExecution
} = require('internal/bootstrap/pre_execution');

prepareMainThreadExecution(true);
require('internal/modules/cjs/loader').Module.runMain(process.argv[1]);
```

但是在执行用户 JS 之前还需要处理一下事情，比如 IPC 通道，具体逻辑在 prepareMainThreadExecution。

```js
function prepareMainThreadExecution(expandArgv1 = false) {
  // 只列出部分
  // 给 process 挂载属性
  patchProcessObject(expandArgv1);
  // IPC 处理
  setupChildProcessIpcChannel();
  // Cluster 模块的处理
  initializeClusterIPC();
  // 挂载 runMain，为执行用户 JS 做准备
  initializeCJSLoader();
  // 加载预加载模块
  loadPreloadModules();
}
```
1 给process对象挂载属性

执行 patchProcessObject 函数（在 node_process_methods.cc 中导出）给 process 对象挂载一些列属性，不一一列举。

```c++
// process.argv  
process->Set(context,
             FIXED_ONE_BYTE_STRING(isolate, "argv"),  
             ToV8Value(context, env->argv()).ToLocalChecked()).Check();  
  
READONLY_PROPERTY(process, 
                  "pid",  
                  Integer::New(isolate, uv_os_getpid())); 
```


因为 Node.js 增加了对线程的支持，有些属性需要特殊处理，比如在线程里使用 process.exit 的时候，退出的是单个线程，而不是整个进程。

2 处理 进程间通信

```js
function setupChildProcessIpcChannel() {  
  if (process.env.NODE_CHANNEL_FD) {  
    const fd = parseInt(process.env.NODE_CHANNEL_FD, 10);  
    delete process.env.NODE_CHANNEL_FD;  
    const serializationMode = 
process.env.NODE_CHANNEL_SERIALIZATION_MODE || 'json';  
    delete process.env.NODE_CHANNEL_SERIALIZATION_MODE;  
    require('child_process')._forkChild(fd, serializationMode);  
  }  
}  
```

环境变量 NODE_CHANNEL_FD 是在创建子进程的时候设置的，如果有说明当前启动的进程是子进程，则需要处理进程间通信。

3 处理cluster模块的 进程间通信

```js
function initializeclusterIPC() {  
  if (process.argv[1] && process.env.NODE_UNIQUE_ID) {  
    const cluster = require('cluster');  
    cluster._setupWorker(); 
    delete process.env.NODE_UNIQUE_ID;  
  }  
}  
```

4 挂载 runMain

```js
function initializeCJSLoader() {
  const CJSLoader = require('internal/modules/cjs/loader');
  CJSLoader.Module.runMain =
    require('internal/modules/run_main').executeUserEntryPoint;
}
```

runMain 用于执行用户 JS 代码。

5 加载预加载模块

```js
function loadPreloadModules() {
  // 获取需要预加载的模块
  const preloadModules = getOptionValue('--require');
  if (preloadModules && preloadModules.length > 0) {
    const {
      Module: {
        _preloadModules
      },
    } = require('internal/modules/cjs/loader');
    // 加载
    _preloadModules(preloadModules);
  }
}
```

预加载模块会在用户 JS 代码之前被加载，所以我们可以在预加载模块里做一些 hack 的事情。

5 执行用户 JS 代码

```js
require('internal/modules/cjs/loader').Module.runMain(process.argv[1]);  
```

这里的 require 就是 初始化 Loader 时保存到 C++ 层的原生 JS 模块加载器 nativeModuleRequire。internal/modules/cjs/loader.js 是负责加载用户 JS 的模块，runMain 做的事情是加载用户的 JS，然后执行，模块加载器课程中再详细讲解。

进入Libuv事件循环
执行完所有内置的初始化后，Node.js 执行了用户的 JS 代码，用户的 JS 代码通常会往事件循环中注册任务，比如创建一个服务器，最后 Node.js 进入 Libuv 的事件循环中，开始一轮又一轮的事件循环处理。如果没有需要处理的任务，Libuv 会退出，从而 Node.js 退出。

总结

本节课从宏观到微观的角度详细介绍了 Node.js 启动过程中所涉及的核心逻辑，包括注册 C++ 模块、Platform、Environment、Loader 的初始化、执行用户的 JS 代码和启动事件循环等。

C++ 模块用于暴露底层的能力到 JS 层。
Platform 用于管理多个子线程辅助 Node.js 的工作，比如 GC。
Environment 用于管理 Node.js 中的公共数据结构和逻辑。
Loader 用于初始化模块加载器，为后续执行代码做准备。
执行用户的 JS 注册任务到事件循环。
最后一个步骤是启动事件循环，这样 Node.js 就启动起来了。
通过了解每一个步骤的实现以及意义，我们对 Node.js 的底层原理的理解又进了一步，同时也为我们实现简单的 JS 运行时打下了坚实的基础。
