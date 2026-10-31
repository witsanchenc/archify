# Diagrams by level

Archify draws the figures. This page only chooses which figure a level needs. Read `archify/references/explainer-authoring.md` for shorthand rows, and the mode schema under `archify/schemas/` before adding a field. Examples in `archify/examples/` teach shape, not facts about the codebase you are reading.

A page holds at most four native diagrams. A fifth diagram means a new page that still answers the four questions for its own slice.

Prefer shorthand (`@architecture`, `@sequence`, `@workflow`, `@tree`) when it can say the fact. Use `@diagram <type> source=<file>.json` for `class`, `lifecycle`, and any figure that needs explicit geometry. The JSON file sits in the draft directory. Finalize validates it with the same renderer as a standalone diagram.

Node labels stay short: about ten Chinese characters or four English words. Put the sentence in the panel, not in the node. Edge labels stay one or two words. Leave room for the ▸ the linker appends to a clickable label.

## Clickable boxes

A node that has a deeper page is a link. Record it in `layers.json`:

```json
{"file": "02-contexts.html", "diagram": "context-map", "node": "battle", "href": "05-battle-parts.html"}
```

`diagram` is the explainer diagram id. `node` is the id in the shorthand or JSON, the same id Archify writes as `data-node-id`. The linker wraps that box after finalize. A listed node that is missing from the SVG is a failed link, not a warning.

Use the page that describes that part's next level: a context box opens its component page, a component opens its class page. A box with no deeper page is not listed and stays plain. State machines, outside actors, and a shared bus with no zoom of its own are the usual plain boxes. The cross-cutting page is still in the breadcrumb.

The inline figure is static: plain boxes and arrows. Do not add hover motion or a flowing edge to carry the drill-down. The parent page is the breadcrumb and 返回上一层, not a second copy of the child diagram.

## Which figure

| Level | Draw | Native type | Do not draw |
| --- | --- | --- | --- |
| 整体系统 | Outside actors and the system as one box, or a few boxes that are still black | `@architecture` | Classes, function calls, internal layers |
| 子系统 | Context map: parts, the channel between them, who is upstream | `@architecture`. A crossing sequence if the payload matters | The inside of a context |
| 分层 | Layers and the direction of dependencies | `@architecture` | Every class in the layer |
| 构件 | Who depends on whom; one collaboration in time; ownership when it is not the same as dependency | `@diagram class`, `@sequence`, a second class diagram only for a different relationship kind | Fields and statements inside a method |
| 类 / 对象 | Selected members and relationships; a state machine when the object changes state; rules often fit a table better than a figure | `@diagram class`, `@diagram lifecycle`, Markdown table | A second copy of the component sequence |

`@tree` fits the reading map: parent is the level above, children are the pages a reader can open next.

A rules table is not a native diagram. It does not consume the four-diagram budget. Use it for “做 / 不做”, invariants, and costs.

## System context

Outside nodes use `external` (people and other systems) or `database` (files and stores the system does not own as code). The program entry can be `backend`. A bus, when it is visible at this zoom, is `messagebus`.

Draw a call only where the source calls. If A publishes and B subscribed, the edge is A → bus → B, not A → B.

## Layer diagram

An edge means “this layer is allowed to know that layer”, matching imports you saw, not an ideal. Point the edge at the depended-on layer. If a test encodes the rule, cite that test and still confirm the imports.

## Class diagram

`kind` is `class`, `abstract`, `interface`, `enum`, or `record`. Relationship `kind` is `dependency`, `association`, `inheritance`, `realization`, `composition`, or `aggregation`. Use `realization` for a class that implements an interface you saw. Use `composition` when the parent creates and owns the child's lifecycle. Use `dependency` for a parameter or a call. Do not mark composition just because a field exists.

Give `row` and `col` so a domain stays a readable block. Keep a row to about four types. Selected members only: the fields and methods the prose relies on.

## Sequence

Actors are the black boxes of this level. Messages are calls, returns, or events you can point at. Mark a return with `return`. One sequence is one path. A second path is a second diagram or a sentence, not a pile of optional messages on the happy path.

## State machine

Use lifecycle JSON (`schema_version` 3) when the object has named states and transitions. `mainPath` is the path a reader should see first. Terminal success and failure are `success` and `failure`. A pause waiting for input is `waiting`. If the object only has counters, write 本层不适用 for a state machine and put the counters in a table.

## Split rule

Count diagrams after you know which facts are left. Suggested menu diagrams that repeat the table are dropped first. If one element still needs more than four figures, give that element its own page and link it from the parent element.
