---
name: ob-impl
description: 实现需求（写代码）。读需求文档的改动点清单逐项写代码，严格遵守仓库 CLAUDE.md 开发规范，完成后流转到测试中。
---

# 实现需求（写代码）

## Use when

用户说"实现需求 REQ-XXX" / "开发需求 REQ-XXX" / "开始写代码"。

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

> 开发规范详见 `{baseDir}/../../references/dev-conventions.md`（纯指针，指向仓库自身 CLAUDE.md）；流转链路详见 `references/status-flow.md`。

## 引用加载策略

- 开发规范：读 `{baseDir}/../../references/dev-conventions.md`（纯指针，指向仓库自身 CLAUDE.md/AGENTS.md，不内联任何语言规范）
- 需求全貌：读 `<vaultPath>/<kbDir>/00-需求/REQ-XXX-*.md`

## 执行流程

### 步骤 1：定位并读取需求文档

1. 用 `$CLI read file="REQ-XXX-..."` 或文件读取读 `<vaultPath>/<kbDir>/00-需求/REQ-XXX-*.md`，拿 frontmatter（reqId/title/module/status）+ 正文（涉及接口板块4 / 数据模型板块5 / 改动点 checkbox）
2. 若 status 还是「需求创建」/「评审中」→ 提示「需求尚未评审确认，先流转到「开发中」再实现」，结束
3. 流转 status 到「开发中」：

```bash
$CLI property:set file="REQ-XXX-..." name="status" value="开发中" type=text
$CLI property:set file="REQ-XXX-..." name="updated" value="<当天日期>" type=text
$CLI reload
```

### 步骤 2：按改动点逐项实现

1. 对照需求「涉及接口 / 数据模型 / 改动点」，逐项写代码（具体分层/命名按仓库 CLAUDE.md 与现有代码风格）：
   - 新增接口：按仓库现有分层建对应文件（如 Controller/Service/VO，或路由/处理函数等）
   - 改现有接口：定位现有接口与出入参定义，按改动字段明细增删字段
   - 数据模型变更：实体/模型加字段 + 数据库 DDL（如需）
2. 严格遵守仓库 `CLAUDE.md` 的开发规范（详见 `references/dev-conventions.md`，该文件为纯指针指向仓库规范，不内置语言规范）
3. 每实现一项，回需求文档把对应「改动点」checkbox 勾上 `[x]`，更新 `updated` 日期

> 实现过程中若发现需求接口/表/字段与代码现状矛盾，停下来用 Ask user（`ask_user` 能力）确认，不擅自改需求或绕过。

### 步骤 3：自测 + 流转

1. 实现完对照需求「涉及接口」自测每个接口能通
2. 自测通过 → 流转 status 到「测试中」：

```bash
$CLI property:set file="REQ-XXX-..." name="status" value="测试中" type=text
$CLI property:set file="REQ-XXX-..." name="updated" value="<当天日期>" type=text
$CLI reload
```

3. 回复用户：改了哪些文件、改动点 checkbox 已勾、当前状态、建议下一步「按需求写测试用例」

## 验证与交付

- 改动点 checkbox 全勾上
- 实现的接口/表/字段与需求「涉及接口/数据模型」对得上
- status = 测试中

## 失败处理

- 某改动点实现遇阻 → 标注该 checkbox 为 `[ ]` 并在文档记卡点，其他改动点继续，不整体阻塞
- 编译失败 → 修到能过，不流转测试中

## 不允许的情况

- ❌ 不读需求文档就凭标题写代码
- ❌ 实现的接口/表/字段与需求「涉及接口/数据模型」对不上
- ❌ 违反仓库 `CLAUDE.md` 开发规范（详见 `references/dev-conventions.md`，按各自仓库规范判定）
- ❌ 改动点还没全勾就提前流转到「测试中」
