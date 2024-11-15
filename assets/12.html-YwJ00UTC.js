import{_ as i,c as e,f as a,o as t}from"./app-LHpjaFTr.js";const s="/note/assets/5e8aa7efb5195d042f000004-DqV9Y9_M.png",p={};function o(r,l){return t(),e("div",null,l[0]||(l[0]=[a('<blockquote><p>使用 Redis 作为 MySQL 的前置缓存，可以帮助 MySQL 挡住绝大部分的查询请求。这种方法对于像电商中的商品系统、搜索系统这类与用户关联不大的系统，效果特别的好。</p></blockquote><h1 id="读写分离是提升-mysql-并发的首选方案" tabindex="-1"><a class="header-anchor" href="#读写分离是提升-mysql-并发的首选方案"><span>读写分离是提升 MySQL 并发的首选方案</span></a></h1><ul><li><p>典型的读写分离架构 <img src="'+s+'" alt=""></p></li><li><p>如何来实施 MySQL 的读写分离方案</p><ul><li>部署一主多从多个 MySQL 实例，并让它们之间保持数据实时同步。</li><li>分离应用程序对数据库的读写请求，分别发送给从库和主库。</li></ul></li><li><p>分离应用程序的读写请求方法有下面这三种：</p><ol><li>纯手工方式：修改应用程序的 DAO 层代码，定义读写两个数据源，指定每一个数据库请求的数据源。</li><li>组件方式：也可以使用像 Sharding-JDBC 这种集成在应用中的第三方组件来实现，这些组件集成在你的应用程序内，代理应用程序的所有数据库请求，自动把请求路由到对应数据库实例上。</li><li>代理方式：在应用程序和数据库实例之间部署一组数据库代理实例，比如说 Atlas 或者 MaxScale。对应用程序来说，数据库代理把自己伪装成一个单节点的 MySQL 实例，应用程序的所有数据库请求被发送给代理，代理分离读写请求，然后转发给对应的数据库实例。</li></ol></li><li><p>一般情况下，不推荐使用第三种代理的方式，原因是，使用代理加长了你的系统运行时数据库请求的调用链路，有一定的性能损失，并且代理服务本身也可能出现故障和性能瓶颈等问题。但是，代理方式有一个好处是，它对应用程序是完全透明的。所以，只有在不方便修改应用程序代码这一种情况下，你才需要采用代理方式。</p></li><li><p>如果你配置了多个从库，推荐你使用“HAProxy+Keepalived”这对儿经典的组合，来给所有的从节点做一个高可用负载均衡方案，既可以避免某个从节点宕机导致业务可用率降低，也方便你后续随时扩容从库的实例数量。因为 HAProxy 可以做 L4 层代理，也就是说它转发的是 TCP 请求，所以用“HAProxy+Keepalived”代理 MySQL 请求，在部署和配置上也没什么特殊的地方，正常配置和部署就可以了。</p></li></ul><h1 id="注意读写分离带来的数据不一致问题" tabindex="-1"><a class="header-anchor" href="#注意读写分离带来的数据不一致问题"><span>注意读写分离带来的数据不一致问题</span></a></h1><ul><li><p>数据库中的数据在主库完成更新后，是异步同步到每个从库上的，这个过程有一个微小的时间差，这个时间差叫主从同步延迟。</p><ul><li>正常情况下，主从延迟非常小，不超过 1ms。但即使这个非常小的延迟，也会导致在某一个时刻，主库和从库上的数据是不一致的。应用程序需要能接受并克服这种主从不一致的情况，否则就会引发一些由于主从延迟导致的数据错误。</li></ul></li><li><p>以支付为例，用支付成功页规避主从同步延迟的问题</p></li><li><p>以购物车为例</p><ul><li>可以把“更新购物车、重新计算总价”这两个步骤合并成一个微服务，然后放在一个数据库事务中去，同一个事务中的查询操作也会被路由到主库，这样来规避主从不一致的问题。</li></ul></li><li><p>对于这种主从延迟带来的数据不一致的问题，没有什么简单方便而且通用的技术方案可以解决，我们需要重新设计业务逻辑，尽量规避更新数据后立即去从库查询刚刚更新的数据。</p></li></ul><h1 id="思考" tabindex="-1"><a class="header-anchor" href="#思考"><span>思考</span></a></h1><ul><li>具体什么情况下，使用Cache Aside模式更新缓存会产生脏数据 <ul><li><p>如果一个写线程在更新订单数据的时候，恰好赶上这条订单数据缓存过期，又恰好赶上一个读线程正在读这条订单数据，还是有可能会产生读线程将缓存更新成脏数据。但是，这个可能性相比Read/Write Through模式要低很多，并且发生的概率并不会随着并发数量增多而显著增加，所以即使是高并发的场景，这种情况实际发生的概率仍然非常低。</p></li><li><p>既然不能百分之百的避免缓存的脏数据，那我们可以使用一些方式来进行补偿。比如说，把缓存的过期时间设置的相对短一些，一般在几十秒左右，这样即使产生了脏数据，几十秒之后就会自动恢复了。更复杂一点儿的，可以在请求中带上一个刷新标志位，如果用户在查看订单的时候，手动点击刷新，那就不走缓存直接去读数据库，也可以解决一部分问题。</p></li></ul></li></ul>',7)]))}const c=i(p,[["render",o],["__file","12.html.vue"]]),d=JSON.parse('{"path":"/geektime/back-end-storage-practical-lession/12.html","title":"读写分离是提升 MySQL 并发的首选方案","lang":"zh-CN","frontmatter":{},"headers":[],"git":{"updatedTime":1645920694000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":2,"url":"https://github.com/sindorei"}]},"filePathRelative":"geektime/back-end-storage-practical-lession/12.md"}');export{c as comp,d as data};