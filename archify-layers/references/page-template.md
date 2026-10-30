# Page template

One draft, one page. The first heading's `{#id}` becomes the explainer id. The first paragraph is the conclusion. Up to four reasons follow. Then the four question panels. IDs are unique in the file.

Replace the angle-bracket notes. Keep drill tokens character-for-character; `layers.json` points at them.

```md
# 对战上下文 {#battle-context}

对战只管一局的胜负，不管分数。

- 地图、坦克和子弹都在这一侧。
- 对外只公布一份结束事件。
- 它不 import 成长上下文。

@answer scope="本地快照 · 对战上下文"
@meta locale=zh-CN repo_url=https://example.invalid/local/repo.git repo_revision=0123456789abcdef0123456789abcdef01234567 repo_link_mode=local-only

@source session title="对战会话" path=battle/application/session.py lines=1:20

## 由什么组成？ {#made-of}

会话、一局游戏、存档接口。内部字段在下一层。[](source:session)

@architecture id=battle-boxes title="对战上下文的边界"
| session | 会话 | backend |
| game | 一局游戏 | backend |
| save | 存档 | database |
| session > game | 指令 |
| session > save | 存取 |

## 各自负责什么？ {#duties}

| 部分 | 做 | 不做 |
| --- | --- | --- |
| 会话 | 编排流程 | 不写碰撞规则 |
| 一局游戏 | 推进规则 | 不认识键盘 |

## 怎样交互？ {#interact}

写通道和传递的数据。没有交互时写：本层不适用。原因：……

## 生命周期 {#lifetime}

谁创建、谁持有、何时放开。类层还要写对象自己的状态变化。没有独立生命周期时写：本层不适用。原因：……

## 下钻 {#drill}

| 元素 | 打开 |
| --- | --- |
| 一局游戏 | 下钻：一局游戏 |
```

## Drill tokens

The visible token is `下钻：` plus the element name, with the fullwidth colon. Put that exact string in the table cell and in `layers.json` `drills[].text`. The linker wraps those characters in a relative link after finalize. Do not bold the token and do not split it with formatting. Do not expect a Markdown link to `other.html` to survive explainer validation.

`layers.json` also lists clickable boxes. `diagram` is the figure id, `node` is the box id:

```json
{"file": "02-contexts.html", "diagram": "context-map", "node": "battle", "href": "03-battle.html"}
```

`layers.json` example:

```json
{
  "title": "某系统的分层阅读",
  "pages": [
    {"id": "overview", "file": "00-reading-map.html", "title": "阅读地图", "role": "overview", "parent": null},
    {"id": "system", "file": "01-system.html", "title": "整体系统", "role": "level", "parent": "overview"},
    {"id": "cross", "file": "09-cross-cutting.html", "title": "横切", "role": "cross", "parent": "overview"}
  ],
  "drills": [
    {"file": "00-reading-map.html", "text": "下钻：整体系统", "href": "01-system.html"}
  ]
}
```

## Reading map, cross-cutting, mechanisms

The reading map is the overview page. Its conclusion is how to read, not a class. Panels: levels kept and why, levels refused and why, evidence (revision, origin, unknowns). A `@tree` of the zoom line is enough.

Cross-cutting and mechanism pages do not use the four level questions as empty headings. Use one panel per structure or mechanism, and still link up to the reading map.

## Writing

Short Chinese sentences, at most about 50 characters of content, at most two “的” in a sentence. Prefer a table to a fourth sentence. Bold only the few words that carry the conclusion.

Say 本层不适用 in the panel body when a question does not apply. Keep the heading so the reader sees that the question was asked.
