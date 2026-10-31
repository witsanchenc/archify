# 对战构件 {#battle-parts}

对战上下文里，会话编排流程，`Game` 执行一局规则，JSON 仓储负责存档。`Game` 内部仍是黑盒。

- 会话不写碰撞。
- 敌方 AI 只能走会话已经打开的 `move` 和 `fire`。
- 结束时才把内部事件换成合同。

@answer scope="对战构件 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source session title="对战会话" path=battle/application/session.py lines=39:85
@source ai title="敌方 AI" path=battle/application/enemy_ai.py lines=1:17
@source contract title="对外合同" path=battle/contract/events.py lines=11:20

## 由什么组成？ {#made-of}

会话、敌方 AI、一局游戏、存档接口和它的 JSON 实现。坦克和子弹不在这张图里。[](source:session)

@diagram class id=battle-deps source=diagrams/battle-parts.class.json title="对战构件依赖"

会话另外持有两个 `EventDispatcher`：自己的 `events`，以及入口注入的总线。分发规则在横切。

## 各自负责什么？ {#duties}

| 构件 | 做 | 不做 |
| --- | --- | --- |
| `GameSession` | 画面流程、把指令译成 `move` 或 `fire`、发布事件 | 不计算碰撞 |
| `RandomEnemyAI` | 每格以 0.5 的概率移动，以 0.2 的概率开火 | 不读键盘，不改规则 |
| `Game` | 接受移动、开火和 `tick` | 不认识 `Command` |
| `SaveRepository` | 规定存整局、取最近一局 | 不规定 JSON |
| `JsonFileSaveRepository` | 把聚合写成文件，没有文件时返回空 | 不决定何时存 |

概率用的是默认 `random.Random()`，主循环没有传入种子。[](source:ai)

## 怎样交互？ {#interact}

进行中的每一格：先让 AI 行动，再 `tick`，再把聚合拉出的事件交给内部总线。只有 `GameEnded` 会变成 `BattleFinished`。[](source:session) [](source:contract)

@sequence id=tick-path title="进行中的一格"
| actor session | 会话 | backend |
| actor ai | 敌方AI | backend |
| actor game | Game | backend |
| actor events | 内部总线 | messagebus |
| session | ai | act |
| ai | game | move 或 fire |
| session | game | tick |
| game | session | 事件列表 | return |
| session | events | publish |

`BattleFinished` 的字段是 `won` 和 `lives_left`。它不携带坦克坐标。[](source:contract)

## 生命周期 {#lifetime}

入口创建会话并传入仓储和总线。会话在 `START` 时用 `Game.new_level_1()` 换上一局，旧对象不再被引用。`LOAD` 读到存档后改成暂停。进程退出前没有单独的关闭仓储步骤。[](source:session)

本层不适用 `Game` 的胜负状态机。原因：那是聚合自己的状态，在类层。这里只写谁持有会话。

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| Game 及其内部 | 下钻：对战类 |
