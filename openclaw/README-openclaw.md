# software-dev-ob · OpenClaw 版

Software Dev OB 的 **OpenClaw 原生写法副本**。与插件根目录的 Claude Code 版并存，互不影响：

- **Claude Code** → 用根目录那套（`.claude-plugin/` + `skills/` + `agents/` + `hooks/`），一字未改。
- **OpenClaw** → 用本目录（`openclaw/`），安装时指向它。

两者共享根目录的 `references/` 和 `templates/`（本目录的 skill 用 `{baseDir}/../../references|templates/` 引用，不重复拷贝）。

## 为什么单独做一份

OpenClaw 能把 Claude Code 插件当 **Claude bundle** 加载，但有三个 Claude 特性在 bundle 模式下不生效，所以需要 OpenClaw 原生写法的副本：

| 差异 | Claude 版 | OpenClaw 版（本目录） |
|------|-----------|----------------------|
| SessionStart hook | `hooks/hooks.json` + `session_start.py` | OpenClaw 不执行 bundle 的 `hooks/hooks.json`（detect-only）。本目录改用 OpenClaw 原生 **internal hook**：`hooks/session-start/HOOK.md` + `handler.js`，监听 `agent:bootstrap` 事件 |
| skill frontmatter | `allowed-tools` / `argument-hint` | OpenClaw 不映射这两个字段。本目录的 SKILL.md 只用 `name` + `description`，工具放行靠 OpenClaw 的 `tools.allow`/elevated 配置 |
| 代码调研子 agent | 用 `Agent` 工具调 `code-investigator`（agent 定义文件） | OpenClaw 没有「agent 定义文件」概念，子 agent 是独立 run。`code-investigator` 改成 skill，`/ob-new` 用 `sessions_spawn` 起子 agent 跑它的指令 |

其余流程（config.json 门禁、6 板块需求模板、状态流转、测试用例/报告、Obsidian CLI 操作）完全一致。

## 安装（OpenClaw plugins）

本目录是一个独立的 Claude bundle 形态目录（带 `.claude-plugin/plugin.json`），OpenClaw 检测到它就按 Claude bundle 模式加载 `skills/`。

```bash
# 进入插件根目录（含 openclaw/ 子目录这一层）
cd software-dev-ob

# 把 openclaw/ 子目录当本地 bundle 安装
openclaw plugins install ./openclaw --force

# 启用（如有 capability 提示按提示加 --accept-capabilities）
openclaw plugins enable software-dev-ob-openclaw --accept-capabilities

# 重启 Gateway 让 skills 与 hook 生效
openclaw gateway restart

# 验证
openclaw skills list        # 应看到 ob-init / ob-new / ob-impl / ob-flow / ob-tc / ob-tr / ob-up / ob-q / code-investigator
```

### 启动 hook（SessionStart 等价）

bundle 模式下 hook 不自动执行，需要作为 internal hook 显式启用：

```bash
openclaw hooks list                         # 找到 ob-session-start
openclaw hooks enable ob-session-start      # 启用
openclaw gateway restart
```

启用后，每次会话 `agent:bootstrap` 时，handler 从 `event.context.workspaceDir` 起向上查找当前工作目录的 `.software-dev-ob.config.json`，读出 kbDir/vaultPath 并把知识库状态提示加进 `bootstrapFiles` 带入会话（与 Claude 版 `session_start.py` 行为一致）。无 config 的 workspace 静默跳过。

## 使用

与 Claude 版命令一致（OpenClaw 里通过 `/skill <name>` 或自然语言触发）：

```text
/ob-init          # 初始化知识库（写入当前工作目录 .software-dev-ob.config.json）
/ob-new 给订单列表加导出功能   # 调研代码 + 生成需求
/ob-flow REQ-001 评审中        # 流转状态
/ob-impl REQ-001               # 按改动点写代码
/ob-tc REQ-001                 # 写测试用例
/ob-tr REQ-001                 # 写测试报告
/ob-q                          # 查看板
/ob-up ui /path/to/proto.html  # 上传 UI 原型
```

> `/ob-new` 的代码调研走 OpenClaw subagent：主 agent 用 `sessions_spawn` 起子 agent，子 agent 加载 `code-investigator` skill 调研 6 问并输出 JSON，完成后 announce 回主会话。主 agent 收到结果再提问、生成需求。**不要轮询子 agent 状态**（push-based 完成）。

## 前置条件

- OpenClaw 已安装（`openclaw --version`）
- [Obsidian](https://obsidian.ai/) 1.13+，设置 → 通用 → 高级 → 命令行界面 开启 CLI，且 Obsidian 运行中
- 已有一个 Obsidian vault（首次用 `/ob-init` 探测）

## 目录结构

```text
openclaw/
├── .claude-plugin/plugin.json     ← bundle manifest（OpenClaw 识别为 Claude bundle）
├── skills/                        ← 8 个 ob-* skill（OpenClaw 写法 frontmatter）
│   ├── ob-init/SKILL.md
│   ├── ob-new/SKILL.md            ← subagent 调用改 sessions_spawn
│   ├── ob-impl ob-flow ob-tc ob-tr ob-up ob-q
├── agents/
│   └── code-investigator/SKILL.md ← 从 agent 定义文件改为 skill
├── hooks/
│   └── session-start/             ← OpenClaw 原生 internal hook
│       ├── HOOK.md                ← metadata.openclaw.events: [agent:bootstrap]
│       └── handler.js             ← 读 cwd 的 .software-dev-ob.config.json，复刻 session_start.py 逻辑
└── README-openclaw.md             ← 本文档
```

> 运行配置 `.software-dev-ob.config.json` 不在插件目录，在**当前工作目录**（git 仓库根），由 `/ob-init` 写入。插件目录只放 skill/agent/hook/templates。

## 与 Claude 版的关系

- 根目录 `software-dev-ob/`：Claude Code 版，保持原样。
- 本目录 `openclaw/`：OpenClaw 版，独立安装。
- 共享：根目录 `references/`（config-spec / frontmatter-spec / status-flow / dev-conventions）、`templates/`（9 个骨架模板）。

两个版本的 config 各写各的，都放**当前工作目录**：Claude 版写 `<cwd>/.software-dev-ob.config.json`（OpenClaw 版同样读这份）；两套 skill 读同一个 config 文件，互不覆盖、不冲突。换项目就是换 cwd，自然各一份。

## 排查

- skill 没出现 → `openclaw plugins list` 确认 `software-dev-ob-openclaw` 已启用；`openclaw skills list` 确认加载；必要时 `openclaw gateway restart`
- 启动提示没出现 → `openclaw hooks list` 确认 `ob-session-start` 已 enable；重启 Gateway；handler 失败不阻塞会话（静默跳过）
- CLI 无响应 → Obsidian 没在运行，或 CLI 开关没开
- 子 agent 调研结果没回来 → `sessions_spawn` 后必须 `sessions_yield` 结束本 turn 让 announce 到达；不要轮询
- 看板不刷新 → Dataview 插件需已安装并启用

## 开源协议

MIT
