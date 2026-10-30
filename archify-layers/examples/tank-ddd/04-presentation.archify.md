# 表现层对象 {#presentation-page}

表现层把按键变成指令，把两个上下文画到窗口上。它是这条支线的类层。

- 只有这里 import pygame。
- 绘制只读状态，不改胜负。
- 爆炸和结束提示由表现层自己记着。

@answer scope="表现层 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source keys title="键盘翻译" path=presentation/keyboard.py lines=1:21
@source view title="绘制" path=presentation/renderer.py lines=28:66
@source main title="组装循环" path=presentation/main.py lines=24:70

## 由什么组成？ {#made-of}

三个对象：键盘翻译、组装入口、绘制器。没有更小的阅读层。[](source:main)

@architecture id=ui-parts title="表现层的三块"
| keys | 键盘翻译 | frontend |
| main | 组装入口 | backend |
| view | 绘制器 | frontend |
| keys > main | Command |
| main > view | 每帧绘制 |

## 各自负责什么？ {#duties}

| 对象 | 做 | 不做 |
| --- | --- | --- |
| `to_command` | 把按下的键变成 `Command`，其它事件返回空 | 不推进游戏 |
| `main` | 创建对象，按 60 FPS 循环，每 10 帧调用一次 `update` | 不判定碰撞 |
| `Renderer` | 按地形和坦克画格子，订阅击毁、解锁、新高分 | 不改 `Game` 规则 |

每秒 6 个游戏格，因为 `FPS // TICKS_PER_SECOND` 等于 10。[](source:main)

方向键、空格、回车、P、S、L 有对应指令。其它键没有。[](source:keys)

## 怎样交互？ {#interact}

按键先变成 `Command`。入口把它交给会话，到点再 `update`，然后 `draw`。绘制器另外订阅三条事件，用来记爆炸和两句英文提示。[](source:view)

@sequence id=key-path title="一次按键到画面"
| actor keys | 键盘 | frontend |
| actor main | 入口 | backend |
| actor session | 对战会话 | backend |
| actor view | 绘制 | frontend |
| keys | main | Command |
| main | session | handle |
| main | view | draw |

`Renderer` 直接读 `Game` 的坦克、子弹和地图来画。这是绘制对领域对象的依赖，不是领域对 pygame 的依赖。

## 生命周期 {#lifetime}

入口创建 `Renderer`，并持有到退出。绘制器自己持有爆炸列表和提示句子：击毁时追加。画面处于对战中时，提示会被清空。[](source:view)

本层不适用一张状态机。原因：菜单、暂停、结束是 `GameSession.screen`，在对战类那一页。绘制器只读取它。

## 下钻 {#drill}

本层不适用下一层。原因：键盘函数、入口和绘制器已经是这条支线的对象，阅读地图里没有更低的层。
