import{_ as n,c as a,f as e,o as p}from"./app-LHpjaFTr.js";const l={};function i(c,s){return p(),a("div",null,s[0]||(s[0]=[e(`<h1 id="libuv数据结构与通用逻辑" tabindex="-1"><a class="header-anchor" href="#libuv数据结构与通用逻辑"><span>libuv数据结构与通用逻辑</span></a></h1><h2 id="libuv数据结构" tabindex="-1"><a class="header-anchor" href="#libuv数据结构"><span>libuv数据结构</span></a></h2><h3 id="uv-loop-s" tabindex="-1"><a class="header-anchor" href="#uv-loop-s"><span>uv_loop_s</span></a></h3><p>每一个事件循环对应一个 uv_loop_s 结构体</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 使用方自定义数据的字段，用于关联上下文</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> data<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 活跃的 handle 个数，大于 <span class="token number">0</span> 则事件循环不会退出，除非显式调用 uv_stop</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> active_handles<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> handle 队列，包括活跃和非活跃的</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> handle_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> request 个数，大于 <span class="token number">0</span> 则事件循环不会退出，除非显式调用 uv_stop</span>
<span class="line"><span class="token keyword">union</span> <span class="token punctuation">{</span> <span class="token keyword">void</span><span class="token operator">*</span> unused<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  <span class="token keyword">unsigned</span> <span class="token keyword">int</span> count<span class="token punctuation">;</span> <span class="token punctuation">}</span> active_reqs<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 事件循环是否结束的标记，由 uv_stop 设置</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> stop_flag<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> Libuv 运行的一些标记，目前只有 UV_LOOP_BLOCK_SIGPROF，主要是用于 epoll_wait 的时候屏蔽 SIGPROF 信号，防止无效唤醒。</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">long</span> flags<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 事件驱动模块的 fd，比如调用 epoll_create 返回的 fd</span>
<span class="line"><span class="token keyword">int</span> backend_fd<span class="token punctuation">;</span>                    </span>
<span class="line">   </span>
<span class="line"><span class="token number">8</span> pending 阶段的队列                   </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> pending_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>          </span>
<span class="line">           </span>
<span class="line"><span class="token number">9</span> 指向需要在事件驱动模块中注册事件的 IO 观察者队列            </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> watcher_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>      </span>
<span class="line"></span>
<span class="line"><span class="token number">10</span> watcher_queue 队列的节点 <span class="token class-name">uv__io_t</span> 中有一个 fd 字段，watchers 以 fd 为索引，记录 fd 所关联的 <span class="token class-name">uv__io_t</span> 结构体                       </span>
<span class="line"><span class="token class-name">uv__io_t</span><span class="token operator">*</span><span class="token operator">*</span> watchers<span class="token punctuation">;</span>               </span>
<span class="line"></span>
<span class="line"><span class="token number">11</span> watchers 相关的数量，在 maybe_resize 函数里设置</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> nwatchers<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">12</span> loop<span class="token operator">-&gt;</span>watchers 中已使用的元素个数，一般为 watcher_queue 队列的节点数</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> nfds<span class="token punctuation">;</span>      </span>
<span class="line"></span>
<span class="line"><span class="token number">13</span> 线程池的子线程处理完任务后把对应的结构体插入到 wq 队列，由主线程在 Poll IO 阶段处理        </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> wq<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>               </span>
<span class="line"></span>
<span class="line"><span class="token number">14</span> 控制 wq 队列互斥访问，否则多个子线程同时访问会有问题</span>
<span class="line"><span class="token class-name">uv_mutex_t</span> wq_mutex<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">15</span> 用于线程池的子线程和主线程通信，参考线程池和线程间通信章节    </span>
<span class="line"><span class="token class-name">uv_async_t</span> wq_async<span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"><span class="token number">16</span> 用于设置 close<span class="token operator">-</span>on<span class="token operator">-</span>exec 时的锁，因为打开文件和设置 close<span class="token operator">-</span>on<span class="token operator">-</span>exec 不是原子操作（除非系统支持），所以需要一个锁控制这两个步骤是一个原子操作。</span>
<span class="line"><span class="token class-name">uv_rwlock_t</span> cloexec_lock<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">17</span> 事件循环 close 阶段的队列，由 uv_close 产生</span>
<span class="line"><span class="token class-name">uv_handle_t</span><span class="token operator">*</span> closing_handles<span class="token punctuation">;</span>       </span>
<span class="line"></span>
<span class="line"><span class="token number">18</span> fork 出来的子进程队列                 </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> process_handles<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>    </span>
<span class="line">           </span>
<span class="line"><span class="token number">19</span> 事件循环的 prepare 阶段对应的任务队列                   </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> prepare_handles<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>        </span>
<span class="line">            </span>
<span class="line"><span class="token number">20</span> 事件循环的 check 阶段对应的任务队列              </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> check_handles<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>        </span>
<span class="line"></span>
<span class="line"><span class="token number">21</span> 事件循环的 idle 阶段对应的任务队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> idle_handles<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">21</span> async_handles 队列，Poll IO 阶段执行 uv__async_io 遍历 async_handles 队列，处理里面 pending 为 <span class="token number">1</span> 的节点，然后执行它的回调</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> async_handles<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>         </span>
<span class="line"></span>
<span class="line"><span class="token number">22</span> 用于线程间通信 async handle 的 IO 观察者。用于监听是否有 async handle 任务需要处理</span>
<span class="line"><span class="token class-name">uv__io_t</span> async_io_watcher<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">23</span> 用于保存子线程和主线程通信的写端 fd                    </span>
<span class="line"><span class="token keyword">int</span> async_wfd<span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"><span class="token number">24</span> 保存定时器二叉堆结构       </span>
<span class="line"><span class="token keyword">struct</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">void</span><span class="token operator">*</span> min<span class="token punctuation">;</span> </span>
<span class="line">    <span class="token keyword">unsigned</span> <span class="token keyword">int</span> nelts<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span> timer_heap<span class="token punctuation">;</span> </span>
<span class="line">       </span>
<span class="line"><span class="token number">25</span> 管理定时器节点的递增 id</span>
<span class="line"><span class="token class-name">uint64_t</span> timer_counter<span class="token punctuation">;</span>      </span>
<span class="line">  </span>
<span class="line"><span class="token number">26</span> 当前时间，Libuv 会在每次事件循环的开始和 Poll IO 阶段更新当前时间，然后在后续的各个阶段使用，减少系统调用次数                     </span>
<span class="line"><span class="token class-name">uint64_t</span> time<span class="token punctuation">;</span> </span>
<span class="line">  </span>
<span class="line"><span class="token number">27</span> fork 出来的进程和主进程通信的管道，用于子进程收到信号的时候通知主进程，然后主进程执行子进程节点注册的回调</span>
<span class="line"><span class="token keyword">int</span> signal_pipefd<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>                 </span>
<span class="line"></span>
<span class="line"><span class="token number">28</span> 用于信号处理的 IO 观察者，类似 async_io_watcher，signal_io_watcher 保存了管道读端 fd 和回调，然后注册到事件驱动模块中，在子进程收到信号的时候，通过 write 写到管道，最后主进程在 Poll IO 阶段执行回调</span>
<span class="line"><span class="token class-name">uv__io_t</span> signal_io_watcher<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">29</span> 用于管理子进程退出信号的 handle</span>
<span class="line"><span class="token class-name">uv_signal_t</span> child_watcher<span class="token punctuation">;</span>  </span>
<span class="line">  </span>
<span class="line"><span class="token number">30</span> 备用的 fd，当服务器处理连接因 fd 耗尽而失败时，可以使用 emfile_fd       </span>
<span class="line"><span class="token keyword">int</span> emfile_fd<span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-handle-t" tabindex="-1"><a class="header-anchor" href="#uv-handle-t"><span>uv_handle_t</span></a></h3><p>Libuv 中，handle 代表生命周期比较长的对象。例如</p><p>一个 prepare handle。 一个 TCP 服务器。</p><p>实现上，使用 uv_handle_t 表示，uv_handle_t 类似 C++ 中的基类，有很多子类继承于它，Libuv 主要通过 C 语言宏实现继承的效果。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">UV_HANDLE_FIELDS</span>  <span class="token punctuation">\\</span></span>
<span class="line">            <span class="token expression"><span class="token keyword">void</span><span class="token operator">*</span> data<span class="token punctuation">;</span>   </span><span class="token punctuation">\\</span></span>
<span class="line">            <span class="token expression">其他字段 </span></span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv_stream_s</span> <span class="token punctuation">{</span></span>
<span class="line">  UV_HANDLE_FIELDS</span>
<span class="line">  <span class="token comment">// 拓展的字段</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>宏展开：</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv_stream_s</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">void</span><span class="token operator">*</span> data<span class="token punctuation">;</span></span>
<span class="line">  其他自动</span>
<span class="line">  拓展的字段</span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_handle_t 的定义：</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 自定义数据，用于关联一些上下文<span class="token punctuation">,</span> Node<span class="token punctuation">.</span>js 中用于关联 handle 所属的 C<span class="token operator">++</span> 对象  </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> data<span class="token punctuation">;</span>  </span>
<span class="line">     </span>
<span class="line"><span class="token number">2</span> 所属的事件循环     </span>
<span class="line"><span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line">   </span>
<span class="line"><span class="token number">3</span> handle 类型，比如 TCP、UDP   </span>
<span class="line">uv_handle_type type<span class="token punctuation">;</span></span>
<span class="line">  </span>
<span class="line"><span class="token number">4</span> handle 调用 uv_close 后，在 closing 阶段被执行的回调</span>
<span class="line">uv_close_cb close_cb<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 用于插入 handle 队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> handle_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 只用于 Windows 平台 </span>
<span class="line"><span class="token keyword">union</span> <span class="token punctuation">{</span>               </span>
<span class="line">    <span class="token keyword">int</span> fd<span class="token punctuation">;</span>             </span>
<span class="line">     <span class="token keyword">void</span><span class="token operator">*</span> reserved<span class="token punctuation">[</span><span class="token number">4</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span> u<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 当 handle 在 close 队列时，该字段指向下一个 close 节点     </span>
<span class="line"><span class="token class-name">uv_handle_t</span><span class="token operator">*</span> next_closing<span class="token punctuation">;</span> </span>
<span class="line"> </span>
<span class="line"><span class="token number">8</span> handle 的状态和标记</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> flags<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-stream-s" tabindex="-1"><a class="header-anchor" href="#uv-stream-s"><span>uv_stream_s</span></a></h3><p>uv_stream_s 是表示流的结构体。除了继承 uv_handle_t 的字段外，额外定义下面字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 等待发送的字节数，当我们往底层写入数据或往对端发送数据时，Libuv 可能会先缓存起来，等待合适的时机再进行写操作</span>
<span class="line"><span class="token class-name">size_t</span> write_queue_size<span class="token punctuation">;</span></span>
<span class="line">         </span>
<span class="line"><span class="token number">2</span> 分配内存的函数，用调用方设置，比如 Node<span class="token punctuation">.</span>js       </span>
<span class="line">uv_alloc_cb alloc_cb<span class="token punctuation">;</span> </span>
<span class="line">       </span>
<span class="line"><span class="token number">3</span> 数据可读事件触发时执行的回调            </span>
<span class="line">uv_read_cb read_cb<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 发起连接时，保存连接上下文的结构体</span>
<span class="line"><span class="token class-name">uv_connect_t</span> <span class="token operator">*</span>connect_req<span class="token punctuation">;</span> </span>
<span class="line">    </span>
<span class="line"><span class="token number">5</span> 关闭写端时，保存上下文的结构体</span>
<span class="line"><span class="token class-name">uv_shutdown_t</span> <span class="token operator">*</span>shutdown_req<span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 用于插入事件驱动模块的 IO 观察者，注册读写事件</span>
<span class="line"><span class="token class-name">uv__io_t</span> io_watcher<span class="token punctuation">;</span>           </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 待发送队列，记录了等待写操作的数据和元信息，和 write_queue_size 配合</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> write_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>     </span>
<span class="line"></span>
<span class="line"><span class="token number">8</span> 发送完成的队列，write_queue 的节点发生完毕后就会插入 write_completed_queue 队列，等待执行写结束回调   </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> write_completed_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">9</span> 收到连接时执行的回调</span>
<span class="line">uv_connection_cb connection_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">10</span> socket 操作失败的错误码，比如连接失败</span>
<span class="line"><span class="token keyword">int</span> delayed_error<span class="token punctuation">;</span>             </span>
<span class="line"></span>
<span class="line"><span class="token number">11</span> accept 返回的 fd 或者 IPC 时收到的文件描述符</span>
<span class="line"><span class="token keyword">int</span> accepted_fd<span class="token punctuation">;</span>               </span>
<span class="line"></span>
<span class="line"><span class="token number">12</span> 用于 IPC，accepted_fd 只能保存一个 fd，queued_fds 用于保存剩下的</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queued_fds<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-async-s" tabindex="-1"><a class="header-anchor" href="#uv-async-s"><span>uv_async_s</span></a></h3><p>uv_async_s 是 Libuv 中实现异步通信的结构体。继承于 uv_handle_t，额外定义了以下字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 异步事件触发时执行的回调</span>
<span class="line">uv_async_cb async_cb<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 用于插入 async<span class="token operator">-&gt;</span>handles 队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 标记是否有任务需要处理，为 <span class="token number">1</span> 说明需要执行回调 async_cb 处理任务</span>
<span class="line"><span class="token keyword">int</span> pending<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-tcp-s" tabindex="-1"><a class="header-anchor" href="#uv-tcp-s"><span>uv_tcp_s</span></a></h3><p>uv_tcp_s 继承 uv_handle_s 和 uv_stream_s，代表一个 TCP 客户端或者服务器。</p><h3 id="uv-udp-s" tabindex="-1"><a class="header-anchor" href="#uv-udp-s"><span>uv_udp_s</span></a></h3><p>uv_udp_s 用于实现 UDP 模块的功能，实现和 TCP 有点相似，但是因为 UDP 不是面向连接的，和 TCP 还是存在一些差异，所以单独实现。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 待发送字节数，和 uv_stream_s 类似</span>
<span class="line"><span class="token class-name">size_t</span> send_queue_size<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 待发送队列节点的个数和下面的 write_queue 配合</span>
<span class="line"><span class="token class-name">size_t</span> send_queue_count<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 分配接收数据的内存</span>
<span class="line">uv_alloc_cb alloc_cb<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 接收完数据后执行的回调</span>
<span class="line">uv_udp_recv_cb recv_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 插入事件驱动模块的 IO 观察者，实现数据读写</span>
<span class="line"><span class="token class-name">uv__io_t</span> io_watcher<span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 待发送队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> write_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 发送完成的队列（发送成功或失败），和待发送队列相关，参考 uv_stream_s</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> write_completed_queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-tty-s" tabindex="-1"><a class="header-anchor" href="#uv-tty-s"><span>uv_tty_s</span></a></h3><p>uv_tty_s 继承于 uv_handle_t 和 uv_stream_t。额外定义了下面字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 终端的参数 </span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">termios</span> orig_termios<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 终端的工作模式</span>
<span class="line"><span class="token keyword">int</span> mode<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-pipe-s" tabindex="-1"><a class="header-anchor" href="#uv-pipe-s"><span>uv_pipe_s</span></a></h3><p>uv_pipe_s 继承于 uv_handle_t 和 uv_stream_t。额外定义了下面字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 标记管道是否可用于传递文件描述符</span>
<span class="line"><span class="token keyword">int</span> ipc<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 用于 Unix 域通信的文件路径</span>
<span class="line"><span class="token keyword">const</span> <span class="token keyword">char</span><span class="token operator">*</span> pipe_fname<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_pipe_s 用于实现 IPC，实现上和 TCP 差不多，因为网络编程中，Unix 域和 TCP 使用的接口都是差不多的。和 TCP 不一样的是 uv_pipe_s 监听的是一个路径，并且可以通过 ipc 字段控制是否可以传递文件描述符。</p><h3 id="uv-prepare-s、uv-check-s、uv-idle-s" tabindex="-1"><a class="header-anchor" href="#uv-prepare-s、uv-check-s、uv-idle-s"><span>uv_prepare_s、uv_check_s、uv_idle_s</span></a></h3><p>上面三个结构体定义是类似的，它们都继承 uv_handle_t，额外定义了两个字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> prepare、check、idle 阶段回调</span>
<span class="line">uv_xxx_cb xxx_cb<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 用于插入 prepare、check、idle 队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>   </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这三个结构体是类似的，对应了事件循环的三个不同阶段，这三个阶段也在不同的时机被处理。</p><h3 id="uv-timer-s" tabindex="-1"><a class="header-anchor" href="#uv-timer-s"><span>uv_timer_s</span></a></h3><p>uv_timer_s 继承 uv_handle_t，额外定义了下面几个字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 超时回调 </span>
<span class="line">uv_timer_cb timer_cb<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 插入二叉堆的字段</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> heap_node<span class="token punctuation">[</span><span class="token number">3</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 超时时间</span>
<span class="line"><span class="token class-name">uint64_t</span> timeout<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 超时后是否继续开始重新计时，是的话重新插入二叉堆</span>
<span class="line"><span class="token class-name">uint64_t</span> repeat<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> id 标记，用于插入二叉堆的时候对比</span>
<span class="line"><span class="token class-name">uint64_t</span> start_id</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_timer_s 是用于实现定时器的结构体，除了遵循 handle 字段外，还额外记录了超时时间、回调、是否是定时超时等重要信息。Libuv 中，一个定时器对应一个 uv_timer_s 结构体，用最小堆进行管理。</p><h3 id="uv-process-s" tabindex="-1"><a class="header-anchor" href="#uv-process-s"><span>uv_process_s</span></a></h3><p>uv_process_s 继承 uv_handle_t，额外定义了</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 进程退出时执行的回调</span>
<span class="line">uv_exit_cb exit_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 进程 id</span>
<span class="line"><span class="token keyword">int</span> pid<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 用于插入队列，进程队列或者 pending 队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 退出码，进程退出时设置</span>
<span class="line"><span class="token keyword">int</span> status<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_process_s 是用于管理子进程的结构体，一个子进程对应一个 uv_process_s 结构体。uv_process_s 记录了子进程 pid、退出回调、退出码信息等，然后通过 queue 字段插入 Libuv 维护的子进程队列，当子进程退出时，就会从队列中移除对应的 uv_process_s，并执行 exit 回调。</p><h3 id="uv-fs-event-s" tabindex="-1"><a class="header-anchor" href="#uv-fs-event-s"><span>uv_fs_event_s</span></a></h3><p>uv_fs_event_s 继承 uv_handle_t，额外定义了</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 监听的文件路径<span class="token punctuation">(</span>文件或目录<span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">char</span><span class="token operator">*</span> path<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 文件改变时执行的回调</span>
<span class="line">uv_fs_event_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_fs_event_s 用于监听文件变化，通常是基于操作系统提供的能力，比如 Linux 的 inotify 机制，后面会具体分析。</p><h3 id="uv-fs-poll-s" tabindex="-1"><a class="header-anchor" href="#uv-fs-poll-s"><span>uv_fs_poll_s</span></a></h3><p>uv_fs_poll_s 继承 uv_handle_t，额外定义了:</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> poll_ctx 指向一个 poll_ctx 结构体</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> poll_ctx<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">poll_ctx</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 对应的 handle</span></span>
<span class="line">    <span class="token class-name">uv_fs_poll_t</span><span class="token operator">*</span> parent_handle<span class="token punctuation">;</span> </span>
<span class="line">    <span class="token comment">// 标记是否开始轮询和轮询时的失败原因</span></span>
<span class="line">    <span class="token keyword">int</span> busy_polling<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 多久检测一次文件内容是否改变</span></span>
<span class="line">    <span class="token keyword">unsigned</span> <span class="token keyword">int</span> interval<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 每一轮轮询时获取文件内容的时间点</span></span>
<span class="line">    <span class="token class-name">uint64_t</span> start_time<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 所属事件循环</span></span>
<span class="line">    <span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 文件改变时回调</span></span>
<span class="line">    uv_fs_poll_cb poll_cb<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 定时器，用于定时超时后轮询</span></span>
<span class="line">    <span class="token class-name">uv_timer_t</span> timer_handle<span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 记录轮询的一下上下文信息，文件路径、回调等</span></span>
<span class="line">    <span class="token class-name">uv_fs_t</span> fs_req<span class="token punctuation">;</span> </span>
<span class="line">    <span class="token comment">// 轮询时保存操作系统返回的文件信息</span></span>
<span class="line">    <span class="token class-name">uv_stat_t</span> statbuf<span class="token punctuation">;</span></span>
<span class="line">     <span class="token comment">// 监听的文件路径，字符串的值追加在结构体后面</span></span>
<span class="line">    <span class="token keyword">char</span> path<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_fs_poll_s 用于监听文件变化，但是和 uv_fs_event_s 不一样的是，uv_fs_poll_s 是使用定时轮询的机制实现的，所以效率上比较低，但是兼容性更好</p><h3 id="uv-poll-s" tabindex="-1"><a class="header-anchor" href="#uv-poll-s"><span>uv_poll_s</span></a></h3><p>uv_poll_s 继承于 uv_handle_t，额外定义了下面字段。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 监听的 fd 感兴趣的事件触发时执行的回调</span>
<span class="line">uv_poll_cb poll_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 保存了 fd 和回调的 IO 观察者，注册到事件驱动模块中</span>
<span class="line"><span class="token class-name">uv__io_t</span> io_watcher<span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_poll_s 用于监听 fd 感兴趣的事件，相当于把事件驱动模块的能力暴露出来给开发者使用，Node.js 的 DNS 模块用到了这个能力。</p><h3 id="uv-signal-s" tabindex="-1"><a class="header-anchor" href="#uv-signal-s"><span>uv_signal_s</span></a></h3><p>uv_signal_s 继承 uv_handle_t，额外定义了以下字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 收到信号时的回调</span>
<span class="line">uv_signal_cb signal_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 注册的信号</span>
<span class="line"><span class="token keyword">int</span> signum<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 用于插入红黑树，进程把感兴趣的信号和回调封装成 uv_signal_s，然后插入到红黑树，信号到来时，进程在信号处理号中把通知写入管道，通知 Libuv。Libuv 在 Poll IO 阶段会执行进程对应的回调。红黑树节点的定义如下</span>
<span class="line"><span class="token keyword">struct</span> <span class="token punctuation">{</span>                         </span>
<span class="line">    <span class="token keyword">struct</span> <span class="token class-name">uv_signal_s</span><span class="token operator">*</span> rbe_left<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">struct</span> <span class="token class-name">uv_signal_s</span><span class="token operator">*</span> rbe_right<span class="token punctuation">;</span> </span>
<span class="line">    <span class="token keyword">struct</span> <span class="token class-name">uv_signal_s</span><span class="token operator">*</span> rbe_parent<span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">int</span> rbe_color<span class="token punctuation">;</span>                 </span>
<span class="line"><span class="token punctuation">}</span> tree_entry<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 收到的信号个数</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> caught_signals<span class="token punctuation">;</span>     </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 已经处理的信号个数</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> dispatched_signals<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_signal_s 用于信号处理，主要是封装了需要监听的信号和回调。Libuv 中，使用红黑树管理信号的处理，因为操作系统中，一个信号只能注册一个处理函数，所以 Libuv 为了支持一个信号对应多个处理函数，需要在操作系统上层再做一层封装，uv_signal_s 就是为了实现一个信号对应多个处理函数。</p><h3 id="uv-req-s" tabindex="-1"><a class="header-anchor" href="#uv-req-s"><span>uv_req_s</span></a></h3><p>在 Libuv 中，uv_req_s 也类似 C++ 基类的作用，有很多子类继承于它，request 代表一次请求，比如读写一个文件，读写 socket，查询 DNS。任务完成后这个 request 就结束了。request 可以和 handle 结合使用，比如在一个 TCP 服务器上（handle）写一个数据（request），也可以单独使用一个 request，比如 DNS 查询或者文件读写。uv_req_s 的定义:</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 自定义数据</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> data<span class="token punctuation">;</span> </span>
<span class="line"> </span>
<span class="line"><span class="token number">2</span> request 类型，比如文件操作、DNS 查询</span>
<span class="line">uv_req_type type<span class="token punctuation">;</span>  </span>
<span class="line"> </span>
<span class="line"><span class="token number">3</span> 保留字段 </span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> reserved<span class="token punctuation">[</span><span class="token number">6</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_req_s 表示一次请求操作，是其他具体请求类型的基础数据结构，从定义中可以看到，它本身并没有太多信息。接下来看看一下具体请求类型。</p><h3 id="uv-shutdown-s" tabindex="-1"><a class="header-anchor" href="#uv-shutdown-s"><span>uv_shutdown_s</span></a></h3><p>uv_shutdown_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 被操作的流，比如 TCP</span>
<span class="line"><span class="token class-name">uv_stream_t</span><span class="token operator">*</span> handle<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 关闭流的写端后执行的回调</span>
<span class="line">uv_shutdown_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_shutdown_s 用于发起一个关闭流的写端的请求，因为流是全双工的，关闭写端意味着不能写 / 发送数据了</p><h3 id="uv-write-s" tabindex="-1"><a class="header-anchor" href="#uv-write-s"><span>uv_write_s</span></a></h3><p>uv_write_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 写完后执行的回调</span>
<span class="line">uv_write_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 需要传递的文件描述符，在 send_handle 的 fd 中</span>
<span class="line"><span class="token class-name">uv_stream_t</span><span class="token operator">*</span> send_handle<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 往哪个 handle 写入</span>
<span class="line"><span class="token class-name">uv_stream_t</span><span class="token operator">*</span> handle<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 用于插入队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>     </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 当前待写的 buffer 下标     </span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> write_index<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> buffer 总数</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> nbufs<span class="token punctuation">;</span>     </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 存储数据的 buffer，<span class="token class-name">uv_buf_t</span> 记录了数据的开始地址和长度，<span class="token number">4</span> 个不够则需要动态分配内存     </span>
<span class="line"><span class="token class-name">uv_buf_t</span> bufsml<span class="token punctuation">[</span><span class="token number">4</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token class-name">uv_buf_t</span><span class="token operator">*</span> bufs<span class="token punctuation">;</span>          </span>
<span class="line"></span>
<span class="line"><span class="token number">8</span> 写出错的错误码 </span>
<span class="line"><span class="token keyword">int</span> error<span class="token punctuation">;</span>    </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_write_s 表示一次写请求，比如在 TCP 流上发送数据，对于 Unix 域，还可以发送文件描述符。uv_write_s 里面记录了数据的开始地址和长度等信息，如果流不可写则先插入流的待写队列，等待可写时执行写操作，并更新元数据，比如是否写完了，还有多少没写等。</p><h3 id="uv-connect-s" tabindex="-1"><a class="header-anchor" href="#uv-connect-s"><span>uv_connect_s</span></a></h3><p>uv_connect_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 连接成功后执行的回调</span>
<span class="line">uv_connect_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 对应的流，比如 TCP</span>
<span class="line"><span class="token class-name">uv_stream_t</span><span class="token operator">*</span> handle<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 用于插入队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_connect_s 表示发起连接请求并标记当前正在发起一个连接请求。连接是以非阻塞的方式发起的（调用系统的 connect 函数后，不会导致进程阻塞），然后注册事件，等到事件触发时再判断是否连接成功。</p><h3 id="uv-udp-send-s" tabindex="-1"><a class="header-anchor" href="#uv-udp-send-s"><span>uv_udp_send_s</span></a></h3><p>uv_udp_send_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 所属 handle</span>
<span class="line"><span class="token class-name">uv_udp_t</span><span class="token operator">*</span> handle<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 回调</span>
<span class="line">uv_udp_send_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 用于插入待发送队列</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> queue<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>              </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 发送的目的地址</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">sockaddr_storage</span> addr<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 保存了发送数据的缓冲区和个数</span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> nbufs<span class="token punctuation">;</span>           </span>
<span class="line"><span class="token class-name">uv_buf_t</span><span class="token operator">*</span> bufs<span class="token punctuation">;</span>               </span>
<span class="line"><span class="token class-name">uv_buf_t</span> bufsml<span class="token punctuation">[</span><span class="token number">4</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 发送状态或成功发送的字节数</span>
<span class="line"><span class="token class-name">ssize_t</span> status<span class="token punctuation">;</span>              </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 发送完执行的回调（发送成功或失败）</span>
<span class="line">uv_udp_send_cb send_cb<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_udp_send_s 表示一次发送 UDP 数据的请求，和 TCP 的类似。</p><h3 id="uv-getaddrinfo-s" tabindex="-1"><a class="header-anchor" href="#uv-getaddrinfo-s"><span>uv_getaddrinfo_s</span></a></h3><p>uv_getaddrinfo_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 所属事件循环</span>
<span class="line"><span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 用于异步 DNS 解析时插入线程池任务队列的节点</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> work_req<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> DNS 解析完后执行的回调</span>
<span class="line">uv_getaddrinfo_cb cb<span class="token punctuation">;</span>     </span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> DNS 查询的配置</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">addrinfo</span><span class="token operator">*</span> hints<span class="token punctuation">;</span>   </span>
<span class="line"><span class="token keyword">char</span><span class="token operator">*</span> hostname<span class="token punctuation">;</span>           </span>
<span class="line"><span class="token keyword">char</span><span class="token operator">*</span> service<span class="token punctuation">;</span>         </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> DNS 解析结果   </span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">addrinfo</span><span class="token operator">*</span> addrinfo<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> DNS 解析的返回码</span>
<span class="line"><span class="token keyword">int</span> retcode<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_getaddrinfo_s 表示一次通过域名查询 IP 的 DNS 请求，主要是记录了查询的上下文信息。</p><h3 id="uv-getnameinfo-s" tabindex="-1"><a class="header-anchor" href="#uv-getnameinfo-s"><span>uv_getnameinfo_s</span></a></h3><p>uv_getnameinfo_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 所属事件循环 </span>
<span class="line"><span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 用于异步 DNS 解析时插入线程池任务队列的节点</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> work_req<span class="token punctuation">;</span>        </span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 回调</span>
<span class="line">uv_getnameinfo_cb getnameinfo_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 需要查询的地址信息</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">sockaddr_storage</span> storage<span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 指示查询返回的信息</span>
<span class="line"><span class="token keyword">int</span> flags<span class="token punctuation">;</span>                       </span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 查询返回的信息</span>
<span class="line"><span class="token keyword">char</span> host<span class="token punctuation">[</span>NI_MAXHOST<span class="token punctuation">]</span><span class="token punctuation">;</span>           </span>
<span class="line"><span class="token keyword">char</span> service<span class="token punctuation">[</span>NI_MAXSERV<span class="token punctuation">]</span><span class="token punctuation">;</span>        </span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 查询返回码</span>
<span class="line"><span class="token keyword">int</span> retcode<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_getnameinfo_s 表示一次通过 IP 和端口查询域名和服务的 DNS 请求，主要是记录了查询的上下文信息。</p><h3 id="uv-work-s" tabindex="-1"><a class="header-anchor" href="#uv-work-s"><span>uv_work_s</span></a></h3><p>uv_work_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 所属事件循环</span>
<span class="line"><span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 处理任务的函数</span>
<span class="line">uv_work_cb work_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 处理完任务后执行的函数</span>
<span class="line">uv_after_work_cb after_work_cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 封装一个 work 插入到线程池队列，work_req 的 work 和 done 函数是 work_cb 和after_work_cb 的 wrapper</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> work_req<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_work_s 用于往线程池提交任务。work_cb 和 after_work_cb 是业务传入的回调，分别表示具体需要执行的逻辑和执行完任务后执行的回调。uv__work 定义如下。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">void</span> <span class="token punctuation">(</span><span class="token operator">*</span>work<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> <span class="token operator">*</span>w<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">void</span> <span class="token punctuation">(</span><span class="token operator">*</span>done<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> <span class="token operator">*</span>w<span class="token punctuation">,</span> <span class="token keyword">int</span> status<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">struct</span> <span class="token class-name">uv_loop_s</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">void</span><span class="token operator">*</span> wq<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>wq 用于插入线程池的任务队列，然后等待子线程的处理，work 和 done 用于记录 Libuv 的两个函数，具体是对刚才 work_cb 和 after_work_cb 的简单封装。</p><h3 id="uv-fs-s" tabindex="-1"><a class="header-anchor" href="#uv-fs-s"><span>uv_fs_s</span></a></h3><p>uv_fs_s 继承 uv_req_s，额外定义的字段</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token number">1</span> 文件操作类型</span>
<span class="line">uv_fs_type fs_type<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">2</span> 所属事件循环</span>
<span class="line"><span class="token class-name">uv_loop_t</span><span class="token operator">*</span> loop<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">3</span> 文件操作完成的回调</span>
<span class="line">uv_fs_cb cb<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">4</span> 文件操作的返回码</span>
<span class="line"><span class="token class-name">ssize_t</span> result<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">5</span> 文件操作返回的数据</span>
<span class="line"><span class="token keyword">void</span><span class="token operator">*</span> ptr<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">6</span> 文件操作路径</span>
<span class="line"><span class="token keyword">const</span> <span class="token keyword">char</span><span class="token operator">*</span> path<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">7</span> 文件的 stat 信息</span>
<span class="line"><span class="token class-name">uv_stat_t</span> statbuf<span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token number">8</span> 文件操作涉及到两个路径时，保存目的路径，比如复制文件时</span>
<span class="line"><span class="token keyword">const</span> <span class="token keyword">char</span> <span class="token operator">*</span>new_path<span class="token punctuation">;</span>    </span>
<span class="line"></span>
<span class="line"><span class="token number">9</span> 文件描述符</span>
<span class="line">uv_file file<span class="token punctuation">;</span>            </span>
<span class="line"></span>
<span class="line"><span class="token number">10</span> 文件标记</span>
<span class="line"><span class="token keyword">int</span> flags<span class="token punctuation">;</span>               </span>
<span class="line"></span>
<span class="line"><span class="token number">11</span> 操作模式</span>
<span class="line"><span class="token class-name">mode_t</span> mode<span class="token punctuation">;</span>      </span>
<span class="line"></span>
<span class="line"><span class="token number">12</span> 写文件时传入的数据和个数       </span>
<span class="line"><span class="token keyword">unsigned</span> <span class="token keyword">int</span> nbufs<span class="token punctuation">;</span>      </span>
<span class="line"><span class="token class-name">uv_buf_t</span><span class="token operator">*</span> bufs<span class="token punctuation">;</span>          </span>
<span class="line"></span>
<span class="line"><span class="token number">13</span> 文件偏移</span>
<span class="line"><span class="token class-name">off_t</span> off<span class="token punctuation">;</span>               </span>
<span class="line"></span>
<span class="line"><span class="token number">14</span> 保存需要设置的 uid 和 gid，例如 chmod 的时候</span>
<span class="line"><span class="token class-name">uv_uid_t</span> uid<span class="token punctuation">;</span>            </span>
<span class="line"><span class="token class-name">uv_gid_t</span> gid<span class="token punctuation">;</span>            </span>
<span class="line"></span>
<span class="line"><span class="token number">15</span> 保存需要设置的文件修改、访问时间，例如 fs<span class="token punctuation">.</span>utimes 的时候</span>
<span class="line"><span class="token keyword">double</span> atime<span class="token punctuation">;</span>            </span>
<span class="line"><span class="token keyword">double</span> mtime<span class="token punctuation">;</span>            </span>
<span class="line"></span>
<span class="line"><span class="token number">16</span> 异步的时候用于插入任务队列，保存工作函数，回调函数</span>
<span class="line"><span class="token keyword">struct</span> <span class="token class-name">uv__work</span> work_req<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token number">17</span> 保存读取数据。例如 read 和 sendfile</span>
<span class="line"><span class="token class-name">uv_buf_t</span> bufsml<span class="token punctuation">[</span><span class="token number">4</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv_fs_s 表示一次文件操作请求，是一个大而全的结构体。除了一些通用的字段外，有很多字段是和文件操作类型相关的。</p><h2 id="libuv通用逻辑" tabindex="-1"><a class="header-anchor" href="#libuv通用逻辑"><span>Libuv通用逻辑</span></a></h2><h3 id="uv-handle-init" tabindex="-1"><a class="header-anchor" href="#uv-handle-init"><span>uv__handle_init</span></a></h3><p>在初始化一个 handle 时会调用 uv__handle_init，比如初始化一个 stream 或者 timer。uv__handle_init 主要做一些初始化的操作，包括初始化 handle 的类型，设置 REF 标记，插入handle 队列。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__handle_init</span><span class="token expression"><span class="token punctuation">(</span>loop_<span class="token punctuation">,</span> h<span class="token punctuation">,</span> type_<span class="token punctuation">)</span>  </span></span></span>
<span class="line">    <span class="token keyword">do</span> <span class="token punctuation">{</span>                           </span>
<span class="line">        <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>loop <span class="token operator">=</span> <span class="token punctuation">(</span>loop_<span class="token punctuation">)</span><span class="token punctuation">;</span>        </span>
<span class="line">        <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>type <span class="token operator">=</span> <span class="token punctuation">(</span>type_<span class="token punctuation">)</span><span class="token punctuation">;</span>        </span>
<span class="line">        <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">=</span> UV_HANDLE_REF<span class="token punctuation">;</span>                 </span>
<span class="line">        <span class="token function">QUEUE_INSERT_TAIL</span><span class="token punctuation">(</span><span class="token operator">&amp;</span><span class="token punctuation">(</span>loop_<span class="token punctuation">)</span><span class="token operator">-&gt;</span>handle_queue<span class="token punctuation">,</span> <span class="token operator">&amp;</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>handle_queue<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>next_closing <span class="token operator">=</span> <span class="token constant">NULL</span> </span>
<span class="line">    <span class="token punctuation">}</span>                              </span>
<span class="line">    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-handle-start" tabindex="-1"><a class="header-anchor" href="#uv-handle-start"><span>uv__handle_start</span></a></h3><p>uv__handle_start 通常在 uv__handle_init 后调用，表示启用这个 handle，例如启动一个定时器，设置标记 handle 为 ACTIVE 状态，如果之前设置了 REF 标记，则 active handle 的个数加一，active handle 数会影响事件循环的退出。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__handle_start</span><span class="token expression"><span class="token punctuation">(</span>h<span class="token punctuation">)</span>           </span></span></span>
<span class="line">    <span class="token keyword">do</span> <span class="token punctuation">{</span>                           </span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_ACTIVE<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span>                            </span>
<span class="line">        <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">|=</span> UV_HANDLE_ACTIVE<span class="token punctuation">;</span>              </span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_REF<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span>   </span>
<span class="line">            <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>loop<span class="token operator">-&gt;</span>active_handles<span class="token operator">++</span><span class="token punctuation">;</span>       </span>
<span class="line">    <span class="token punctuation">}</span>                             </span>
<span class="line">    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-handle-stop" tabindex="-1"><a class="header-anchor" href="#uv-handle-stop"><span>uv__handle_stop</span></a></h3><p>uv__handle_stop 和 uv__handle_start 相反。uv__handle_stop 会修改 handle 的状态和修改 active handle 的数量，但是它不会把 handle 移出事件循环的 handle 队列。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__handle_stop</span><span class="token expression"><span class="token punctuation">(</span>h<span class="token punctuation">)</span>           </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                         </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_ACTIVE<span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span>    </span>
<span class="line">    <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;=</span> <span class="token operator">~</span>UV_HANDLE_ACTIVE<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_REF<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token function">uv__active_handle_rm</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>                              </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Libuv中 handle 有 REF 和 ACTIVE 两个状态。当一个 handle 调用 xxx_init 函数的时候，它首先被打上 REF 标记，并且插入 loop-&gt;handle 队列。当 handle 调用 xxx_start 函数的时候，它被打上 ACTIVE 标记，如果是 REF 状态则 active handle 的个数加一，当 handle 调用 xxx_stop 时，会消除 ACTIVE 状态，如果 handle 同时是 REF 状态则 active handle 数减 1。只有 ACTIVE 状态的 handle 才会影响事件循环的退出。当我们不再使用一个 handle 时，可以调用 uv_close，uv_close 通常会先调用 xxx_stop，然后把 handle 移出 handle 队列并支持执行一个回调。状态变更图如下（虚线代表数据结构被移出队列）。</p><h3 id="uv-handle-ref" tabindex="-1"><a class="header-anchor" href="#uv-handle-ref"><span>uv__handle_ref</span></a></h3><p>uv__handle_ref 标记 handle 为 REF 状态，如果 handle 是 ACTIVE 状态，则 active handle 数加一。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__handle_ref</span><span class="token expression"><span class="token punctuation">(</span>h<span class="token punctuation">)</span>             </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                           </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_REF<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span>         </span>
<span class="line">    <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">|=</span> UV_HANDLE_REF<span class="token punctuation">;</span>     </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_CLOSING<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span>   </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_ACTIVE<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token function">uv__active_handle_add</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span>                              </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-handle-unref" tabindex="-1"><a class="header-anchor" href="#uv-handle-unref"><span>uv__handle_unref</span></a></h3><p>uv__handle_unref 用于去掉 handle 的 REF 状态，如果 handle 是 ACTIVE 状态，则 active handle数减一。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__handle_unref</span><span class="token expression"><span class="token punctuation">(</span>h<span class="token punctuation">)</span>               </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                           </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_REF<span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;=</span> <span class="token operator">~</span>UV_HANDLE_REF<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_CLOSING<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token keyword">break</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token operator">-&gt;</span>flags <span class="token operator">&amp;</span> UV_HANDLE_ACTIVE<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token function">uv__active_handle_rm</span><span class="token punctuation">(</span>h<span class="token punctuation">)</span><span class="token punctuation">;</span> </span>
<span class="line">  <span class="token punctuation">}</span>                            </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-req-init" tabindex="-1"><a class="header-anchor" href="#uv-req-init"><span>uv__req_init</span></a></h3><p>uv__req_init 初始化请求的类型，并记录请求的个数，比如 DNS 查询、TCP 连接，会影响事件循环的退出。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__req_init</span><span class="token expression"><span class="token punctuation">(</span>loop<span class="token punctuation">,</span> req<span class="token punctuation">,</span> typ<span class="token punctuation">)</span> </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                          </span>
<span class="line">    <span class="token punctuation">(</span>req<span class="token punctuation">)</span><span class="token operator">-&gt;</span>type <span class="token operator">=</span> <span class="token punctuation">(</span>typ<span class="token punctuation">)</span><span class="token punctuation">;</span>      </span>
<span class="line">    <span class="token punctuation">(</span>loop<span class="token punctuation">)</span><span class="token operator">-&gt;</span>active_reqs<span class="token punctuation">.</span>count<span class="token operator">++</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span>                            </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span> </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-req-register" tabindex="-1"><a class="header-anchor" href="#uv-req-register"><span>uv__req_register</span></a></h3><p>uv__req_register 也用于请求的个数加一，比如发起一个文件操作，会影响事件循环的退出。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__req_register</span><span class="token expression"><span class="token punctuation">(</span>loop<span class="token punctuation">,</span> req<span class="token punctuation">)</span>            </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                           </span>
<span class="line">    <span class="token punctuation">(</span>loop<span class="token punctuation">)</span><span class="token operator">-&gt;</span>active_reqs<span class="token punctuation">.</span>count<span class="token operator">++</span><span class="token punctuation">;</span> </span>
<span class="line">  <span class="token punctuation">}</span>                            </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="uv-req-unregister" tabindex="-1"><a class="header-anchor" href="#uv-req-unregister"><span>uv__req_unregister</span></a></h3><p>uv__req_unregister 用于请求的个数减一，在请求结束时调用。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name function">uv__req_unregister</span><span class="token expression"><span class="token punctuation">(</span>loop<span class="token punctuation">,</span> req<span class="token punctuation">)</span> </span></span></span>
<span class="line">  <span class="token keyword">do</span> <span class="token punctuation">{</span>                          </span>
<span class="line">    <span class="token punctuation">(</span>loop<span class="token punctuation">)</span><span class="token operator">-&gt;</span>active_reqs<span class="token punctuation">.</span>count<span class="token operator">--</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span>                              </span>
<span class="line">  <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,124)]))}const o=n(l,[["render",i],["__file","data_struct.html.vue"]]),u=JSON.parse('{"path":"/nodejs/deep_into_nodejs/libuv/data_struct.html","title":"libuv数据结构与通用逻辑","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"libuv数据结构","slug":"libuv数据结构","link":"#libuv数据结构","children":[{"level":3,"title":"uv_loop_s","slug":"uv-loop-s","link":"#uv-loop-s","children":[]},{"level":3,"title":"uv_handle_t","slug":"uv-handle-t","link":"#uv-handle-t","children":[]},{"level":3,"title":"uv_stream_s","slug":"uv-stream-s","link":"#uv-stream-s","children":[]},{"level":3,"title":"uv_async_s","slug":"uv-async-s","link":"#uv-async-s","children":[]},{"level":3,"title":"uv_tcp_s","slug":"uv-tcp-s","link":"#uv-tcp-s","children":[]},{"level":3,"title":"uv_udp_s","slug":"uv-udp-s","link":"#uv-udp-s","children":[]},{"level":3,"title":"uv_tty_s","slug":"uv-tty-s","link":"#uv-tty-s","children":[]},{"level":3,"title":"uv_pipe_s","slug":"uv-pipe-s","link":"#uv-pipe-s","children":[]},{"level":3,"title":"uv_prepare_s、uv_check_s、uv_idle_s","slug":"uv-prepare-s、uv-check-s、uv-idle-s","link":"#uv-prepare-s、uv-check-s、uv-idle-s","children":[]},{"level":3,"title":"uv_timer_s","slug":"uv-timer-s","link":"#uv-timer-s","children":[]},{"level":3,"title":"uv_process_s","slug":"uv-process-s","link":"#uv-process-s","children":[]},{"level":3,"title":"uv_fs_event_s","slug":"uv-fs-event-s","link":"#uv-fs-event-s","children":[]},{"level":3,"title":"uv_fs_poll_s","slug":"uv-fs-poll-s","link":"#uv-fs-poll-s","children":[]},{"level":3,"title":"uv_poll_s","slug":"uv-poll-s","link":"#uv-poll-s","children":[]},{"level":3,"title":"uv_signal_s","slug":"uv-signal-s","link":"#uv-signal-s","children":[]},{"level":3,"title":"uv_req_s","slug":"uv-req-s","link":"#uv-req-s","children":[]},{"level":3,"title":"uv_shutdown_s","slug":"uv-shutdown-s","link":"#uv-shutdown-s","children":[]},{"level":3,"title":"uv_write_s","slug":"uv-write-s","link":"#uv-write-s","children":[]},{"level":3,"title":"uv_connect_s","slug":"uv-connect-s","link":"#uv-connect-s","children":[]},{"level":3,"title":"uv_udp_send_s","slug":"uv-udp-send-s","link":"#uv-udp-send-s","children":[]},{"level":3,"title":"uv_getaddrinfo_s","slug":"uv-getaddrinfo-s","link":"#uv-getaddrinfo-s","children":[]},{"level":3,"title":"uv_getnameinfo_s","slug":"uv-getnameinfo-s","link":"#uv-getnameinfo-s","children":[]},{"level":3,"title":"uv_work_s","slug":"uv-work-s","link":"#uv-work-s","children":[]},{"level":3,"title":"uv_fs_s","slug":"uv-fs-s","link":"#uv-fs-s","children":[]}]},{"level":2,"title":"Libuv通用逻辑","slug":"libuv通用逻辑","link":"#libuv通用逻辑","children":[{"level":3,"title":"uv__handle_init","slug":"uv-handle-init","link":"#uv-handle-init","children":[]},{"level":3,"title":"uv__handle_start","slug":"uv-handle-start","link":"#uv-handle-start","children":[]},{"level":3,"title":"uv__handle_stop","slug":"uv-handle-stop","link":"#uv-handle-stop","children":[]},{"level":3,"title":"uv__handle_ref","slug":"uv-handle-ref","link":"#uv-handle-ref","children":[]},{"level":3,"title":"uv__handle_unref","slug":"uv-handle-unref","link":"#uv-handle-unref","children":[]},{"level":3,"title":"uv__req_init","slug":"uv-req-init","link":"#uv-req-init","children":[]},{"level":3,"title":"uv__req_register","slug":"uv-req-register","link":"#uv-req-register","children":[]},{"level":3,"title":"uv__req_unregister","slug":"uv-req-unregister","link":"#uv-req-unregister","children":[]}]}],"git":{"updatedTime":1705375577000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"nodejs/deep_into_nodejs/libuv/data_struct.md"}');export{o as comp,u as data};
