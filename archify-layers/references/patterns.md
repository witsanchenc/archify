# Patterns and contracts

The mechanisms page is the second content part. It is not a catalog of pattern names. Include a mechanism only when the code uses it. Name it with the project's words first. A textbook name is optional, and only when it matches what the code does.

Each mechanism gets one panel:

1. **解决什么问题.** The concrete tangle this code avoids. Name the modules that would otherwise be coupled.
2. **怎样运作.** The path a fact takes: who calls, what is passed, who must not see the other side.
3. **有什么代价.** What became harder: an extra translation, a stable public event, a rule that now lives in only one place and is easy to forget elsewhere.

Then the behavioral contract, in the same panel, as a short table or list:

| Contract | What to state from the source |
| --- | --- |
| 同步还是异步 | Does the caller wait until handlers return, or is the work queued? If you cannot see a queue, thread, or callback later, say synchronous and cite the call. |
| 处理顺序 | Subscription order, event-list order, or “顺序在源码里没有保证”. |
| 出错时 | Does a handler error skip the remaining handlers? Is it caught? If nothing catches it, say the exception leaves the publisher. |

Do not invent retries, timeouts, or an async bus because the type is named `Event`. Read `publish`.

## Patterns that often appear, and the trap

These are prompts, not a checklist to fill.

| If you see | Ask | Do not claim |
| --- | --- | --- |
| Two modules that must not import each other, with a small public event between them | Is there one translator on the downstream side? | A generic “hexagonal” diagram with ports you did not find |
| An object that records events and a caller that pulls them | Who calls `pull`, and is the list cleared? | That events are stored in the database |
| An interface in the domain and a JSON or SQL class outside it | Which composition root chooses the implementation? | That every interface has more than one production implementation |
| A service whose method touches two aggregates | Why the rule could not live on one of them | That every helper class is a domain service |
| A frozen data object | Is it a value (equality by fields) or just a DTO? | Immutability of objects that still assign fields |

If a famous name does not fit, describe the mechanism in one sentence and skip the name.

## What this page does not do

It does not repeat every level's four questions. It does not introduce a third part (glossary, exercises, deployment). Link back to the level where the mechanism is visible.
