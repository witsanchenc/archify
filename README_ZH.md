# Archify 精简副本

这是一份个人使用的精简仓库，只留下画图和分层阅读需要的代码。

- [`archify/`](archify/)：渲染器、校验和 `finalize`。分层技能直接调用它，不另抄一份。
- [`archify-layers/`](archify-layers/)：把代码库写成中文分层阅读页。从系统边界逐层放大到类，每层一页；有下一层的盒子可以点进去，页首可以回到上一层。

坦克大战示例从[阅读地图](archify-layers/examples/tank-ddd/00-reading-map.html)进入。

```bash
npm install
npm test
```

许可证见 [LICENSE](LICENSE)（Apache-2.0）和 [LICENSE-MIT](LICENSE-MIT)。
