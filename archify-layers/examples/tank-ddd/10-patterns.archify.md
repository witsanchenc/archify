# 机制 {#patterns-page}

这里只写这份代码里真的在用的分法。每一则都回答问题、做法和代价，并写清调用契约。

- 名字能对上源码才使用。对不上就不用教科书名字。
- 事件分发没有队列。
- 详细字段仍在类层，这一页不重复。

@answer scope="机制 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source contract title="对外合同" path=battle/contract/events.py lines=1:20
@source listener title="防腐层" path=progression/integration/battle_listener.py lines=1:24
@source bus title="分发循环" path=shared/event_dispatcher.py lines=28:32
@source reward title="跨聚合奖励" path=progression/domain/services/reward.py lines=1:16
@source collision title="聚合内碰撞" path=battle/domain/services/collision.py lines=1:8

## 上下文、合同、防腐层 {#bounded}

解决的问题：同一词在两边含义不同。对战的关卡是一张地图，成长的关卡是一个整数。若共用一个模型，改碰撞就会牵动积分。[](source:contract)

做法：对战只公布 `BattleFinished`。成长的 `BattleListener` 把它译成 `BattleResult`。其它成长代码不 import 对战。[](source:listener)

代价：合同一改，防腐层必须跟着改。内部事件可以改，是因为外面看不到。

| 契约 | 源码 |
| --- | --- |
| 同步还是异步 | 同步。`publish` 里直接调用监听器 |
| 顺序 | 先译码，再 `record_battle`，然后会话才把画面改成结束 |
| 出错 | 监听器抛错会离开 `publish`，会话来不及改成结束画面 |

## 聚合记下事件，外层拉走 {#aggregate}

解决的问题：规则执行时就要宣布“发生了”，但规则对象不该知道绘制和积分。

做法：聚合 `_record`，会话或应用服务 `pull_events` 后清空，再 `publish`。

代价：忘了 `pull`，事件就留在聚合上，下一轮还会被看见。`restore` 读档不补历史事件，所以读档不会再播一遍解锁提示。

| 契约 | 源码 |
| --- | --- |
| 同步还是异步 | 记下是同步的列表追加。分发发生在外层调用 `publish` 时，同样同步 |
| 顺序 | `Game.tick` 里先敌人被击毁，再玩家被击中，再基地作废，最后才可能是 `GameEnded` |
| 出错 | 记录本身不捕获异常 |

## 仓储 {#repository}

解决的问题：领域要存整局或整份档案，但不该知道 JSON。

做法：接口在领域层，`main` 传入 JSON 实现。测试另有内存实现，主循环不用。

代价：多一个类型。文件格式变了只改基础设施，但调用方仍要处理缺文件和坏 JSON。坏 JSON 没有转换成领域错误。

| 契约 | 源码 |
| --- | --- |
| 同步还是异步 | 同步读写文件 |
| 顺序 | 成长结算先保存档案，再保存榜单 |
| 出错 | 缺文件有定义。损坏的 JSON 会把异常抛给调用方 |

## 两种领域服务 {#services}

碰撞和奖励都是领域服务，原因不同。[](source:collision) [](source:reward)

| | 碰撞 | 奖励 |
| --- | --- | --- |
| 问题 | 两颗子弹对撞，写在哪一颗上都不合适 | 一次加分同时改档案和榜单 |
| 做法 | `Game.tick` 自己调用 | `ProgressionService` 调用 |
| 代价 | 聚合必须记得调用它，否则子弹互不相消 | 应用服务必须记得两个聚合都保存 |

两者都是同步方法调用。没有单独的失败事件：碰撞只改 `alive`，奖励在失败时直接返回。

## 下钻 {#drill}

本页不是缩放层。回到阅读地图用页首的上一层。类层的字段不在这里重复。
