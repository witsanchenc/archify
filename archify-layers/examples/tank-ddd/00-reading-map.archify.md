# 阅读地图 {#reading-map}

先看系统边界，再按需往下放大。每一层都把下一层当成黑盒。

- 第 0 层始终在，底层始终是类。
- 中间层要能回答四个问题，并且和相邻层不同。
- 横切和机制不属于任何一层。
- 这份快照没有公开远程，来源只在本地核对。

@answer scope="坦克大战 · 本地提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source readme title="项目说明" path=README.md lines=1:40
@source arch title="分层与边界测试" path=tests/test_architecture.py lines=1:46

## 这次保留了哪些层？ {#kept}

@tree id=zoom-line title="缩放顺序"
| map | 阅读地图 | - |
| system | 整体系统 | map |
| contexts | 限界上下文 | system |
| layers | 内部分层 | contexts |
| parts | 构件 | layers |
| classes | 类与对象 | parts |
| ui | 表现层对象 | contexts |

| 层 | 为什么留 |
| --- | --- |
| 整体系统 | 玩家、窗口、文件在程序外面 |
| 限界上下文 | 对战和成长互不 import 内部 |
| 内部分层 | 依赖只能指向领域层，这和构件名单不是同一件事 |
| 构件 | 会话、聚合、仓储之间的调用 |
| 类与对象 | 字段、规则、状态 |
| 表现层对象 | 从上下文直接到类，中间没有独立分层 |

表现层只有键盘翻译、组装入口和绘制。再插一层构件，名字会和这三个对象重复，所以这条支线没有构件层。

## 哪些层没有单独成页？ {#refused}

| 候选 | 原因 |
| --- | --- |
| 日志 | 源码没有日志模块 |
| 第二张地图 | 开局只调用 `Game.new_level_1` |
| 表现层再分层 | 三个对象已经是类，中间层没有新问题 |

## 证据 {#evidence}

@facts id=pin
| 提交 | `2ae47a6bb13f5905acea0e1c12f444b4ad441a4c` |
| 远程 | `https://localhost/local/tank-ddd.git` |
| 压缩包 | `395f3061b5b7590b63a8e412128e37d6a04d8d8c5c2dee9b9ea374d997469b1a` |

提交来自上传压缩包里的代码，不含 `doc/`。[](source:readme)

工作区里的 `__pycache__` 是后来跑测试留下的，不在这个提交里。在该提交上执行 `python -m unittest`，55 项通过。[](source:arch)

压缩包里的说明文档没有纳入提交，页面不引用它。敌人走位用未指定种子的随机数，页面不预测具体格子。

## 从哪里往下？ {#drill}

| 去向 | 打开 |
| --- | --- |
| 整体系统 | 下钻：整体系统 |
| 横切 | 下钻：横切 |
| 机制 | 下钻：机制 |
