# 限界上下文 {#contexts-page}

程序内部分成对战和成长。表现层是唯一同时看见两边的地方，负责把它们接上。

- 对战不知道成长存在。
- 成长只有防腐层可以 import `battle.contract`。
- 传递的数据只有胜负和剩余命数。

@answer scope="上下文层 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source session title="对战会话" path=battle/application/session.py lines=39:85
@source listener title="防腐层" path=progression/integration/battle_listener.py lines=1:24
@source arch title="边界测试" path=tests/test_architecture.py lines=18:27

## 由什么组成？ {#made-of}

四个黑盒：对战、总线、成长、表现层。共享内核不属于这一层，它在横切。[](source:arch)

@architecture id=context-map title="上下文地图"
| battle | 对战 | backend |
| bus | 事件总线 | messagebus |
| growth | 成长 | backend |
| ui | 表现层 | frontend |
| ui > bus | 创建 |
| battle > bus | 公布 |
| bus > growth | 结算 |
| ui > battle | 发指令 |
| ui > growth | 读档案 |

## 各自负责什么？ {#duties}

| 部分 | 做 | 不做 |
| --- | --- | --- |
| 对战 | 地图、坦克、胜负、对外合同 | 不算分，不 import 成长 |
| 成长 | 把合同译成自己的结果，再改档案和榜单 | 不 import 对战内部 |
| 表现层 | 按键翻译、组装、绘制 | 不写胜负规则 |
| 事件总线 | 把事件交给订阅者 | 不认识业务字段 |

`tests/test_architecture.py` 禁止对战 import 成长，也禁止成长的领域、应用、基础设施 import 对战。[](source:arch)

## 怎样交互？ {#interact}

一局结束时，会话把内部的 `GameEnded` 换成 `BattleFinished(won, lives_left)`，发给总线。防腐层在同一次调用里把它译成 `BattleResult`，再交给成长。[](source:session) [](source:listener)

@sequence id=finish-path title="结束事件如何过界"
| actor session | 对战会话 | backend |
| actor bus | 总线 | messagebus |
| actor listener | 防腐层 | backend |
| actor growth | 成长 | backend |
| session | bus | 结束事件 |
| bus | listener | 同步调用 |
| listener | growth | 胜负和命数 |

对战内部事件 `EnemyDestroyed` 只订给表现层，不进这条过界路径。入口没有订阅 `PlayerHit` 和 `BaseDestroyed`。

## 生命周期 {#lifetime}

表现层在启动时创建总线，再创建成长和对战，并让防腐层订阅 `BattleFinished`。这三个对象活到进程退出，源码里没有中途拆掉它们的步骤。[](source:listener)

本层不适用对象自己的状态机。原因：画面状态和胜负状态属于下面的类，这一层只回答谁把上下文装起来。

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| 内部分层 | 下钻：内部分层 |
| 表现层 | 下钻：表现层对象 |
