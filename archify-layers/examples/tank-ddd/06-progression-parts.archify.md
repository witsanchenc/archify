# 成长构件 {#progression-parts}

成长上下文收到一局结果后，取出档案和榜单，交给奖励服务，再存回去。档案和榜单的字段在类层。

- 防腐层是唯一认识 `BattleFinished` 的成长代码。
- 奖励规则不在应用服务里。
- 失败的一局不会改档案。

@answer scope="成长构件 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source service title="成长应用服务" path=progression/application/progression_service.py lines=17:38
@source reward title="奖励服务" path=progression/domain/services/reward.py lines=18:27
@source listener title="防腐层" path=progression/integration/battle_listener.py lines=15:24

## 由什么组成？ {#made-of}

防腐层、应用服务、奖励服务、两个聚合。仓储接口在图外：应用服务依赖它们来存取，JSON 实现在基础设施。[](source:service)

@diagram class id=growth-deps source=diagrams/progression-parts.class.json title="成长构件依赖"

## 各自负责什么？ {#duties}

| 构件 | 做 | 不做 |
| --- | --- | --- |
| `BattleListener` | 订阅合同，译成 `BattleResult` | 不加分 |
| `ProgressionService` | 加载两个聚合，调用结算，保存，发布事件 | 不写公式 |
| `RewardService` | 胜利时按剩余命数加分、解锁、记胜、提交榜单 | 不读文件，不认识 `Game` |
| `PlayerProfile` | 守住档案字段 | 不给自己排名 |
| `HighScoreBoard` | 守住榜单名额 | 不记累计分 |

## 怎样交互？ {#interact}

`record_battle` 重新从仓储加载，不沿用构造时那一份做结算。结算后两份都保存，再 `pull_events` 交给自己的总线。[](source:service)

@sequence id=record-path title="记下一次对战结果"
| actor listener | 防腐层 | backend |
| actor service | 应用服务 | backend |
| actor reward | 奖励 | backend |
| actor store | 仓储 | database |
| listener | service | BattleResult |
| service | store | load |
| service | reward | settle |
| reward | service | 改完两个聚合 | return |
| service | store | save |

失败时 `settle` 直接返回，档案和榜单保持刚加载的值，然后仍会保存并发布。发布列表是空的。[](source:reward)

## 生命周期 {#lifetime}

入口创建 `ProgressionService` 和 `BattleListener`，监听器订在总线上，直到进程退出。服务在构造时加载档案和榜单，供绘制读取；每次结算再加载一次并换上新对象。[](source:service)

本层不适用档案的数字变化。原因：分数只能增加，榜单只留 5 名，这些规则在类层。

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| 档案和榜单 | 下钻：成长类 |
