# fashion-agent

[Tryzeon](https://github.com/Tryzeon)（創然科技）AI 穿搭助理的 Agent 後端。

```
agent/
  chat/     run → validate → quota → context → agent loop → hydrate → assemble
  vertex/   Vertex AI provider 與錯誤分類
```

需要 [Deno](https://deno.com) 2.x。

```bash
deno task test     # 單元測試
deno task check    # 型別檢查
```
