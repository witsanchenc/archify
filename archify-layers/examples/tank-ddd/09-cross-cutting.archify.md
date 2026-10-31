# 横切 {#cross-cutting}

有些代码不属于任何一层：共享内核、事件分发、程序入口、写在源码里的常量，以及很少的错误路径。

- 同一个 `EventDispatcher` 用在上下文内部，也用在上下文之间。
- 分发是同步的。
- 这份代码没有日志模块。

@answer scope="横切 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source bus title="事件分发器" path=shared/event_dispatcher.py lines=21:32
@source root title="聚合根基类" path=shared/aggregate_root.py lines=13:22
@source event title="事件基类" path=shared/domain_event.py lines=1:15
@source main title="入口常量" path=presentation/main.py lines=24:45
@source order title="订阅顺序测试" path=tests/test_shared.py lines=28:35

## 共享内核 {#kernel}

`DomainEvent` 是冻结数据类，没有处理方法。`AggregateRoot` 把事件追加在列表里，`pull_events` 取走并清空。注释写明事件不进存档。[](source:root) [](source:event)

@diagram class id=shared-types source=diagrams/shared.class.json title="共享内核"

对战的 `Game`、成长的 `PlayerProfile` 和 `HighScoreBoard` 都继承 `AggregateRoot`。

## 事件分发 {#dispatch}

`publish` 按传入列表的顺序取事件，再按订阅顺序调用该类型的处理器。调用是普通函数调用，没有队列，也没有线程。[](source:bus) [](source:order)

运行时有三个分发器，类相同，实例不同：

| 实例 | 谁创建 | 谁订阅 |
| --- | --- | --- |
| 跨上下文总线 | `main` | 防腐层听 `BattleFinished` |
| `GameSession.events` | 会话 | 会话自己听 `GameEnded`；绘制器听 `EnemyDestroyed` |
| `ProgressionService.events` | 成长服务 | 绘制器听解锁和新高分 |

`PlayerHit` 和 `BaseDestroyed` 会被 `pull` 出来再 `publish`，但入口没有订阅者。处理器列表为空，事件就此结束。

## 程序入口 {#entry}

`main` 的顺序是：初始化 pygame，创建总线，创建成长并让防腐层订阅，创建对战会话，再让绘制器订阅三条事件，然后循环。[](source:main)

循环本身不是领域规则。它把真实帧换成游戏格：60 帧里调用 6 次 `update`。

## 配置 {#config}

没有配置文件加载器。常量写在代码里。

| 位置 | 值 |
| --- | --- |
| `battle/domain/rules.py` | 格子 13，玩家 3 命，敌人 3，冷却 3 格，一张地图 |
| `progression/domain/rules.py` | 每条命 1000 分，榜单 5 名 |
| `presentation/main.py` | 每秒 6 格，60 FPS，三个文件名 |

文件名相对当前工作目录，不相对 `presentation/`。

## 错误时怎样 {#errors}

| 情况 | 源码行为 |
| --- | --- |
| 没有 `save.json` | `load_latest` 返回空，画面不变 |
| 没有档案或榜单文件 | 返回新的空聚合 |
| `add_score` 得到负数 | 抛出 `ValueError` |
| JSON 无法解析或缺字段 | `json.loads` 或字段访问的异常没有被接住 |
| 某个处理器抛错 | `publish` 没有 `try`。同一次发布里，后面的处理器和后面的事件不再运行 |

日志：源码没有 `logging`，也没有其它日志调用，所以不单列日志节。

## 下钻 {#drill}

这些机制为什么要付这个代价，见机制页。下钻：机制
