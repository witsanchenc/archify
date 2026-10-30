# Method

One zoom line, like studying a body: the whole person, then systems, then organs, then tissue, then cells. A reader of one level does not need the level below. The thing below is a black box with a name, a responsibility, and a way in and out.

## How many levels

The number is not fixed. Decide it from the project.

- **Level 0 always exists.** It is the whole system: the boundary with the outside world, drawn as a system context diagram.
- **The bottom level is always classes and objects.** Data, behavior, rules, and the object's own state changes live here.
- **A middle level exists only when all three are true:**
  1. It can treat the next level as black boxes.
  2. It can answer all four questions below.
  3. Its answer is different from the level above and the level below. A rename of the same boxes is not a new level.

Record the chosen levels, the levels you refused, and the reason, in the reading map. Name levels after what this project actually has. Do not keep a menu name that the code does not support.

## Four questions, every level

Answer all four on every level page. If one does not apply, write **本层不适用** and the reason. Do not leave the heading empty.

| Question | What to answer |
| --- | --- |
| 由什么组成 | The parts at *this* zoom, and nothing inside them. |
| 各自负责什么 | What each part does, and what it does **not** do. |
| 怎样交互 | How they communicate, and what is passed. |
| 生命周期 | Who creates them, who holds them, when they are released. At the class level, also the object's own state changes. |

## Reference menu

Use this only as a menu. Drop a row the project does not have. Rename a row to the project's own word when that word is more accurate.

| Common level | What the reader learns | Diagrams that usually fit |
| --- | --- | --- |
| 整体系统（第 0 层，必有） | Boundary with users, machines, and other systems | System context diagram |
| 子系统 / 限界上下文 | How the inside is split, how the parts communicate, how startup assembles them | Context map |
| 分层 | Internal layers and which way dependencies point | Layer diagram |
| 构件 | Core collaborators, who talks to whom, who owns whom | Class dependency diagram, sequence diagram, ownership class diagram |
| 类 / 对象（最底层，必有） | Data, behavior, rules, state | Class card, rules table, state machine. Data, behavior, and rules may be separate pages when one page cannot hold them. |

Suggested diagrams are not a quota. Skip a diagram that repeats a table. Split pages to stay within four native diagrams.

## Cross-cutting

Some structure belongs to no level, the way vessels and nerves run through every organ. When the code has them, give them a page of their own and link to it from the levels:

- shared kernel
- event bus
- program entry
- configuration
- logging
- error handling

Omit a bullet the code does not have. Say in one sentence that you looked and it is absent. Do not invent a logger, a config service, or a bus to fill the list.

## Mechanisms

The second content part. Each mechanism that the code actually uses answers:

- 解决什么问题
- 怎样运作
- 有什么代价

And its behavioral contract: synchronous or asynchronous, processing order, and what happens on errors. See [Patterns and contracts](patterns.md).

No third content part.
