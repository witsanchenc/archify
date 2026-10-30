# 内部分层 {#layers-page}

两个上下文用同一条依赖规则：应用层和基础设施都指向领域层，领域层不指向它们。

- 防腐层只出现在成长一侧。
- 合同 `battle/contract` 不是第四层，它是对战给外面的事件。
- 这一页不打开聚合里面的坦克和子弹。

@answer scope="分层 · 提交 2ae47a6b"
@meta locale=zh-CN repo_url=https://localhost/local/tank-ddd.git repo_revision=2ae47a6bb13f5905acea0e1c12f444b4ad441a4c repo_link_mode=local-only

@source arch title="分层测试" path=tests/test_architecture.py lines=30:46
@source saves title="存档接口" path=battle/domain/repositories/save_repository.py lines=1:18

## 由什么组成？ {#made-of}

对战是应用层、领域层、基础设施。成长多一个防腐层。各层里的类仍是黑盒。[](source:arch)

@architecture id=battle-layers title="对战的依赖方向"
| app | 应用层 | backend |
| domain | 领域层 | backend |
| infra | 基础设施 | database |
| app > domain | 调用 |
| infra > domain | 实现接口 |

@architecture id=growth-layers title="成长的依赖方向"
| acl | 防腐层 | security |
| app | 应用层 | backend |
| domain | 领域层 | backend |
| infra | 基础设施 | database |
| acl > app | 交给 |
| app > domain | 调用 |
| infra > domain | 实现接口 |

## 各自负责什么？ {#duties}

| 层 | 做 | 不做 |
| --- | --- | --- |
| 防腐层 | 把 `BattleFinished` 译成 `BattleResult` | 不改奖励公式 |
| 应用层 | 编排流程，发布事件 | 不写胜负和奖励规则 |
| 领域层 | 规则、聚合、仓储接口 | 不 import JSON，不 import 应用层 |
| 基础设施 | 把聚合写成 JSON | 不决定何时存 |

领域层只说存和取。JSON 字段表在基础设施。[](source:saves)

运行入口使用 JSON 实现。内存实现在测试里，主循环不创建它。

## 怎样交互？ {#interact}

允许的方向就是上面两张图里的箭头：调用或实现都指向领域层。领域层不回调应用层。

合同文件刻意不 import 对战内部。防腐层是成长里唯一 import `battle.contract` 的位置。[](source:arch)

## 生命周期 {#lifetime}

层本身不会被创建或释放。入口创建基础设施对象，把它传进应用服务。应用服务在开局或读档时得到领域对象。

本层不适用一张状态机。原因：状态属于会话和聚合，不属于“层”这个盒子。

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| 对战 | 下钻：对战构件 |
| 成长 | 下钻：成长构件 |
