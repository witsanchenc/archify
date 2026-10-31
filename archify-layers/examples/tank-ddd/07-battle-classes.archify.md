# 对战类 {#battle-classes}

一局游戏是聚合根。外面只能通过 `Game` 移动、开火和推进时间，从而绕不开胜负规则。

- 坦克、子弹、地图由 `Game` 持有。
- 碰撞是领域服务，因为两颗子弹地位相同。
- 胜负一旦离开“对战中”，`tick` 不再改状态。

@answer scope="对战类 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source game title="聚合根 Game" path=battle/domain/aggregates/game.py lines=24:101
@source tank title="坦克" path=battle/domain/entities/tank.py lines=11:56
@source tile title="地形" path=battle/domain/value_objects/tile.py lines=1:24
@source rules title="对战常量" path=battle/domain/rules.py lines=1:27

## 由什么组成？ {#made-of}

`Game` 持有地图、玩家坦克、敌人列表、子弹列表，并持有一个 `CollisionService`。位置和地形是值，没有身份。[](source:game)

@diagram class id=aggregate source=diagrams/battle-aggregate.class.json title="Game 持有的对象"

## 各自负责什么？ {#duties}

| 对象 | 做 | 不做 |
| --- | --- | --- |
| `Tank` | 转向、被挡住则不动、冷却中不开火、被击中减一条命 | 不读键盘，不画自己 |
| `Bullet` | 前进一格，出界或打到会挡子弹的地形后消失 | 不判断打中了谁 |
| `Battlefield` | 回答格子能否进入，砖被打碎后换成空地，基地被打中则作废 | 不移动坦克 |
| `CollisionService` | 敌我子弹对撞一起消失；子弹只打对方阵营 | 不决定整局输赢 |
| `Game` | 在 `tick` 末尾改胜负，并记下事件 | 不认识分数 |

地形规则：[](source:tile)

| 符号 | 挡坦克 | 挡子弹 | 打碎 |
| --- | --- | --- | --- |
| `.` 空 | 否 | 否 | 否 |
| `#` 砖 | 是 | 是 | 是，变成空地 |
| `@` 钢 | 是 | 是 | 否 |
| `~` 水 | 是 | 否 | 否 |
| `*` 树 | 否 | 否 | 否 |
| `B` 基地 | 是 | 是 | 否，但基地作废 |

玩家 3 条命，敌人 3 个，开火冷却 3 格，地图 13 格见方。只有这一张 `LEVEL_1`。[](source:rules)

## 怎样交互？ {#interact}

`tick` 在仍是对战中时：每个坦克减冷却，每颗子弹前进，然后碰撞。接着为死亡敌人、命数下降、基地作废各记一条事件。然后删掉死亡对象，并改胜负。[](source:game)

同一格里若基地作废或玩家不存活，记为失败；否则敌人为空才记为胜利。失败优先。

`GameEnded` 在离开对战中时记下，字段是 `won` 和 `lives_left`。会话才把它变成合同。

## 生命周期 {#lifetime}

`START` 调用 `new_level_1`，状态从对战中开始。读档用 `restore`，可以回到已经分出胜负的状态。胜负状态一旦改变，后续 `tick` 立刻返回。[](source:game)

@diagram lifecycle id=game-status source=diagrams/game-status.lifecycle.json title="Game 的胜负"

会话画面是另一个对象的状态，不放进 `Game`：

@diagram lifecycle id=screen-status source=diagrams/screen.lifecycle.json title="会话画面"

| 指令 | 何时生效 | 结果 |
| --- | --- | --- |
| 开始 | 菜单或结束 | 新建第 1 关，进入进行 |
| 暂停 | 对战中或暂停 | 两者对调 |
| 存档 | 对战中或暂停 | 写入文件 |
| 读档 | 不看当前画面 | 读到则暂停；没有文件则不变 |
| 移动或开火 | 仅进行 | 交给 `Game` |

`LOAD` 从结束画面也能读档。图上只画了主路径和暂停环，读档的其它入口写在表里。

## 下钻 {#drill}

本层不适用更低的层。原因：这里已经是类和值。机制页说明聚合和事件为什么这样分。下钻：机制
