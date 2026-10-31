# 成长类 {#progression-classes}

成长侧有两个聚合：档案管累计，榜单管单局名次。它们不认识坦克和地图。

- 输入只有 `BattleResult`。
- 胜利才加分。每条剩余命加 1000 分。
- 榜单最多 5 条，从高到低。

@answer scope="成长类 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source profile title="玩家档案" path=progression/domain/aggregates/player_profile.py lines=15:53
@source board title="最高分榜" path=progression/domain/aggregates/high_score_board.py lines=14:38
@source reward title="奖励规则" path=progression/domain/services/reward.py lines=1:27
@source rules title="成长常量" path=progression/domain/rules.py lines=1:3

## 由什么组成？ {#made-of}

`BattleResult` 是冻结的值。`RewardService` 读取它，再调用两个聚合。聚合下面没有实体文件夹。[](source:reward)

@diagram class id=growth-types source=diagrams/progression-types.class.json title="成长侧的对象"

## 各自负责什么？ {#duties}

| 对象 | 做 | 不做 |
| --- | --- | --- |
| `BattleResult` | 携带 `won` 和 `lives_left` | 不含地图，不含坐标 |
| `PlayerProfile` | 总分只增、解锁关卡号加 1、胜场加 1 | 不排序榜单 |
| `HighScoreBoard` | 收下正分，只留最高的 5 条 | 不记累计胜场 |
| `RewardService` | 把一次胜利同时写进两个聚合 | 失败时什么都不改 |

负数传给 `add_score` 会抛出 `ValueError`。`restore` 重建档案时不发事件。[](source:profile)

`submit` 在新分数高于当前最高分时记下 `NewHighScore`，0 和负数直接返回。解锁记下 `LevelUnlocked`。[](source:board)

## 怎样交互？ {#interact}

胜利时，剩余命数乘 `REWARD_PER_LIFE`（1000）得到这一局的分。同一分数既 `add_score`，又 `submit`。然后解锁下一关并记一次胜利。[](source:reward) [](source:rules)

两个聚合互不调用。应用服务负责都保存。

关卡这个词在这里只是整数。它不会让 `Game.new_level_1` 换一张地图。地图仍只有第 1 关那一张。

## 生命周期 {#lifetime}

新档案从 0 分、解锁到 1、胜场 0 开始。没有文件时 JSON 仓储就返回这样一份。每次结算替换服务里给界面看的那一份。[](source:profile)

本层不适用状态机。原因：档案和榜单没有命名状态，只有数字变化。上面的表就是全部转移。

## 下钻 {#drill}

本层不适用更低的层。原因：字段和规则已经在这一页。
