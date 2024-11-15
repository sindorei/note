import{_ as i,c as e,f as a,o as t}from"./app-LHpjaFTr.js";const s={};function p(n,l){return t(),e("div",null,l[0]||(l[0]=[a('<h1 id="定量认识mysql" tabindex="-1"><a class="header-anchor" href="#定量认识mysql"><span>定量认识MySQL</span></a></h1><ul><li><p>慢SQL对数据库的影响是一个量变到质变的过程，对“量”的把握就很重要</p></li><li><p>影响MySQL处理能力的因素</p><ul><li>服务器的配置</li><li>数据库中的数据量大小</li><li>MySQL的一些参数配置</li><li>数据库的繁忙程度</li></ul></li><li><p>一台MySQL数据库，大致处理能力的极限是：每秒一万条左右的简单SQL（类似主键查询这种不需要遍历很多条记录的SQL），低端的服务器只能每秒几千条，高端的每秒几万条</p></li><li><p>根据经验，一般一台MySQL服务器，平均每秒钟执行的SQL数量再几百左右，就已经非常繁忙了，即使看起来CPU利用率和磁盘繁忙程度没那么高</p></li><li><p>遍历行数在百万以内的，只要不是每秒都执行几十上百次的频率查询，可以认为是安全的</p></li><li><p>遍历行数再几百万的，查询时间最少也要几秒钟</p></li><li><p>遍历行数达到千万量级和以上的，不应该出现在在线交易类系统中</p></li><li><p>遍历行数再千万左右是MySQL查询的一个坎儿</p></li><li><p>MySQL单个表数量尽量控制在一千万条以下，最多不要超过二三千万这个量级</p></li></ul><h1 id="使用索引避免全表扫描" tabindex="-1"><a class="header-anchor" href="#使用索引避免全表扫描"><span>使用索引避免全表扫描</span></a></h1><ul><li>增加索引付出的代价是，会降低数据插入、删除和更新的性能</li></ul><h1 id="分析sql执行计划" tabindex="-1"><a class="header-anchor" href="#分析sql执行计划"><span>分析SQL执行计划</span></a></h1><ul><li>SQL语句前加<code>EXPLAIN</code>关键字</li></ul>',6)]))}const o=i(s,[["render",p],["__file","09.html.vue"]]),c=JSON.parse('{"path":"/geektime/back-end-storage-practical-lession/09.html","title":"定量认识MySQL","lang":"zh-CN","frontmatter":{},"headers":[],"git":{"updatedTime":1644980618000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"geektime/back-end-storage-practical-lession/09.md"}');export{o as comp,c as data};
