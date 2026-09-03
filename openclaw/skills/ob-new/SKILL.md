---
name: ob-new
description: 新建需求。调用 code-investigator 子 agent 调研代码确认可落地，有疑问提问，确认后生成需求文档。
---

# 新建需求（核心流程，必须确保可落地）

## Use when

用户说"新建需求：xxx" / "记个需求：xxx" / 描述一个待办功能。不要听一句需求就直接建文件。

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在；不存在提示重新 init

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

> frontmatter 字段约定详见 `{baseDir}/../../references/frontmatter-spec.md`；流转链路详见 `references/status-flow.md`。

## 引用加载策略

- 调研规范、模块依赖：读仓库 `CLAUDE.md`（或 `AGENTS.md`，不内联进 skill）
- 需求模板：`{baseDir}/../../templates/需求模板.md`（6 板块结构，与 Claude 版共享）

## 执行流程

### 步骤 1：进入只读调研模式

开始调研前明确约束：**只读，不写任何文件**。这一阶段专做调研和方案设计，用户确认疑问前不生成需求文档。

> Claude Code 版用 `EnterPlanMode`/`ExitPlanMode` 实现；OpenClaw 无内置 plan mode，靠本 skill 的自然语言约束实现同一效果——调研阶段不写、确认后才写。

### 步骤 2：调用 code-investigator 子 agent 调研

用 `sessions_spawn` 工具起一个后台子 agent run，把调研任务委派给它。子 agent 会加载 `code-investigator` skill 的指令去读代码、输出结构化调研结论，完成后 announce 回本会话。

`sessions_spawn` 的任务文本（task）里要写明：

```
你是需求可落地性调研员（code-investigator skill）。请按该 skill 的调研 6 问读代码，严格输出 JSON：
- requirement = {用户提供的需求}
- repo_root = {当前 git 仓库根}
只调研、只读，不写文件。完成后只返回 skill 规定的 JSON 结构（无其他文本）。
```

> ⚠️ `sessions_spawn` 起的子 agent run 在独立会话里跑，不阻塞本会话。发起后调用 `sessions_yield` 结束本 turn，等子 agent 完成的 announce 事件作为下一条 model 可见消息到达，再继续步骤 3。
>
> 不要轮询 `/subagents list` 等子 agent 是否完成（文档明确：push-based 完成，轮询是误用）。完成后结果自动回来。

子 agent 调研 6 问：涉及模块 / 涉及接口 / 涉及表字段 / 是否触犯架构规则 / 可复用逻辑 / 改动范围清单。

> 调研时若发现需求描述有歧义、代码现状与需求假设矛盾、或存在多种实现方案，先记下来，步骤 3 集中提问。

### 步骤 3：有疑问必须提问（不要自行拍板）

拿到调研结论后，若存在以下任一情况，用 Ask user（`ask_user` 能力）确认：
- 需求歧义 / 字段映射不明 / 改动方案分叉 / 需求与代码现状矛盾 / 范围不清

提问时：推荐选项放第一个标 (推荐)，每选项附取舍说明，一次最多 4 个问题。

### 步骤 4：确认可落地后生成需求文档

用户确认完所有疑问、方案明确后，退出只读模式并生成：

1. 取下一个 `reqId`（查现有 `00-需求/` 最大编号 +1）
2. 写到 `<vaultPath>/<kbDir>/00-需求/REQ-{编号}-{标题}.md`
3. frontmatter 填 `type: requirement` / `reqId` / `title` / `status: 需求创建` / `module` / `domain` / `priority` / `owner` / `created`+`updated`(当天)
4. 正文基于调研结果填（不凭空写）：需求背景 / 需求描述 / 涉及接口(板块4) / 数据模型(板块5) / 改动点(checkbox) / 可落地性说明
5. `$CLI reload`
6. 回复用户：编号 REQ-XXX，文件路径，可落地性结论

## 验证与交付

- 需求文件存在且 frontmatter 完整
- 正文「涉及接口/数据模型」与调研结论一致
- status = 需求创建

## 失败处理

- reqId 取号冲突 → 重新扫描最大编号 +1
- 文件写入失败 → 提示路径权限，重试
- 子 agent 调研失败/超时 → 用 `sessions_yield` 等回结果后重试 spawn，或提示用户改用手工调研

## 不允许的情况

- ❌ 听到需求不调研就建文件
- ❌ 有疑问不问、自行假设后生成
- ❌ 需求文档里的接口/表名是猜的，没在代码里验证过
- ❌ 用户还没确认完疑问就生成需求文档
- ❌ 轮询子 agent 状态等完成（应 push-based 等待 announce）
