# 整体系统 {#system-page}

玩家按键，程序推进一局，再把画面画到窗口上。分数和存档落在当前目录的 JSON 文件里。

- 对战和成长在这一层都是黑盒。
- 两边不直接调用，结束事件经过总线。
- 窗口和文件不属于领域规则。

@answer scope="第 0 层 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source main title="程序入口" path=presentation/main.py lines=28:72

## 由什么组成？ {#made-of}

外界是玩家、窗口和三份 JSON 文件。程序里面先只看成入口、对战、成长和总线。[](source:main)

窗口和三份 JSON 文件在表里，不放进这张图，避免一行排太宽。

@architecture id=system-context title="系统与外界"
| player | 玩家 | external |
| entry | 程序入口 | backend |
| battle | 对战 | backend |
| bus | 事件总线 | messagebus |
| growth | 成长 | backend |
| player > entry | 按键 |
| entry > battle | 指令 |
| battle > bus | 公布 |
| bus > growth | 合同 |

## 各自负责什么？ {#duties}

| 部分 | 做 | 不做 |
| --- | --- | --- |
| 玩家 | 按键、关窗口 | 不判定胜负 |
| 游戏窗口 | 显示 pygame 画面 | 不保存规则 |
| 程序入口 | 组装并循环 | 不写碰撞 |
| 对战 | 一局的地图和胜负 | 不计分数 |
| 成长 | 档案、解锁、榜单 | 不摆地图 |
| JSON 文件 | 存放字节 | 不解释规则 |

总线怎样分发，见下钻。这一层只把它当成通道。

## 怎样交互？ {#interact}

一帧里，入口把按键交给对战，到点再推进一格，然后绘制。成长不在每一帧里结算，只在一局结束时收到合同。[](source:main)

@sequence id=one-frame title="一帧里入口做什么"
| actor player | 玩家 | external |
| actor entry | 入口 | backend |
| actor battle | 对战 | backend |
| actor window | 窗口 | frontend |
| player | entry | 按键 |
| entry | battle | handle |
| entry | battle | update |
| entry | window | draw |

`handle` 和 `update` 的内部步骤在构件层。这里对战仍是一个盒子。

## 生命周期 {#lifetime}

`main` 创建窗口、总线、成长、对战会话和绘制器，并持有到 `pygame.quit()`。[](source:main)

三份文件在存档或结算时写入。进程退出后文件还在磁盘上。入口读写当前目录中的 `save.json`、`profile.json`、`high_scores.json`。它不读 `presentation/` 里那两份样例。

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| 限界上下文 | 下钻：限界上下文 |
| 事件总线 | 下钻：横切 |
