---
name: ob-new
description: 新建需求。进入 plan 模式，调用 code-investigator agent 调研代码确认可落地，有疑问提问，确认后生成需求文档。
allowed-tools: Read Write Bash Agent AskUserQuestion
argument-hint: "[需求标题或描述]"
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

> frontmatter 字段约定详见 `references/frontmatter-spec.md`；流转链路详见 `references/status-flow.md`。

## 引用加载策略

- 调研规范、模块依赖：读仓库 `CLAUDE.md`（不内联进 skill）
- 需求模板：`<skill目录>/templates/需求模板.md`（6 板块结构）

## 执行流程

### 步骤 1：进入 plan 模式

调用 `EnterPlanMode`。此模式下只读不写，专门做调研和方案设计。

### 步骤 2：调用 code-investigator agent 调研

用 `Agent` 工具调用 `code-investigator`（详见 `<skill目录>/agents/code-investigator.md`）：

```
Use the Agent tool to run code-investigator.
Prompt: 需求描述={用户提供的需求}；仓库根={当前 git 仓库根}。
只返回结构化调研结论，不写任何文件。
```

agent 调研 6 问：涉及模块 / 涉及接口 / 涉及表字段 / 是否触犯架构规则 / 可复用逻辑 / 改动范围清单。

> 调研时若发现需求描述有歧义、代码现状与需求假设矛盾、或存在多种实现方案，先记下来，步骤 3 集中提问。

### 步骤 3：有疑问必须提问（不要自行拍板）

调研后若存在以下任一情况，用 `AskUserQuestion` 确认：
- 需求歧义 / 字段映射不明 / 改动方案分叉 / 需求与代码现状矛盾 / 范围不清

提问时：推荐选项放第一个标 (推荐)，每选项附取舍说明，一次最多 4 个问题。

### 步骤 4：确认可落地后生成需求文档

用户确认完所有疑问、方案明确后，退出 plan 模式（`ExitPlanMode`）并生成：

1. 取下一个 `reqId`（查现有 `00-需求/` 最大编号 +1）
2. 用 `Write` 写到 `<vaultPath>/<kbDir>/00-需求/REQ-{编号}-{标题}.md`
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

## 不允许的情况

- ❌ 听到需求不调研就建文件
- ❌ 有疑问不问、自行假设后生成
- ❌ 需求文档里的接口/表名是猜的，没在代码里验证过
- ❌ 用户还没确认完疑问就退出 plan 模式生成
