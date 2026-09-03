---
name: ob-session-start
description: "software-dev-ob 启动提示：会话开始时展示当前知识库初始化状态与需求数（OpenClaw 版）。"
metadata:
  openclaw:
    events:
      - agent:bootstrap
---

# ob-session-start

会话启动（agent bootstrap，系统提示定稿前）时读当前工作目录的 `.software-dev-ob.config.json`，把知识库初始化状态与需求数加进会话上下文。

逻辑与 Claude Code 版 `hooks/session_start.py` 对齐，仅承载形式改为 OpenClaw internal hook。

## 事件

- `agent:bootstrap`：构建 bootstrap 文件阶段触发，context 含 `workspaceDir` 与可变数组 `bootstrapFiles`。
- handler 从 `workspaceDir` 起向上查找 `.software-dev-ob.config.json`，读出 kbDir/vaultPath，统计 `00-需求/REQ-*.md`，把状态行作为一个内存 bootstrap 记录 push 进 `event.context.bootstrapFiles`，由 OpenClaw 带入会话上下文。
- 注意：`agent:bootstrap` 的 `event.messages` 不路由为聊天回复（被忽略），所以用 `bootstrapFiles` 而非 `messages`。
- 无 config 的 workspace 静默跳过（不污染每个未初始化项目的会话）。

## 依赖

- hook 自身只用 Node 标准库（`fs` / `path`），无外部依赖。
- 读的 `.software-dev-ob.config.json` 在当前工作目录（git 仓库根），由 `/ob-init` 写入，不跟插件目录绑定。
