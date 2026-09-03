---
name: ob-tc
description: 按需求写测试用例。读需求详情取接口/表，从 workspace-pm 取测试地址，基于需求内容生成接口测试用例文档。
allowed-tools: Read Write Bash AskUserQuestion
argument-hint: "[REQ-编号或需求标题]"
---

# 按需求写测试用例

## Use when

用户说"为 REQ-XXX 写测试用例" / "给这个需求出测试用例"。

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

> frontmatter 约定详见 `references/frontmatter-spec.md`。

## 引用加载策略

- 需求详情：读 `<vaultPath>/<kbDir>/00-需求/REQ-XXX-*.md`
- 用例模板：`<skill目录>/templates/测试用例.md`
- 测试地址来源：workspace-pm 的 PROJECT.md（见步骤2）

## 执行流程

### 步骤 1：读需求详情

1. 用 `$CLI read file="REQ-XXX-..."` 或 Read 读需求，拿 reqId/title/module/domain + 正文「涉及接口(板块4)」「数据模型(板块5)」「改动点」
2. 从 reqId 取数字编号（REQ-001 → `001`）作 `reqNum`，用于用例编号 `API-{reqNum}-NNN`

### 步骤 2：取测试地址 + 接口文档

1. 读当前工作目录 `.software-dev-ob.config.json` 的 `pmProjectCode`
2. 若有值 → 读 `$HOME/.openclaw/workspace-pm/projects/<pmProjectCode>/PROJECT.md`，取「测试环境」行地址作 `testUrl`
3. 若 pmProjectCode 为空 → `AskUserQuestion` 让用户手填测试地址
4. 接口文档：若 workspace-pm 有 `<pmProjectCode>/docs/api/REQ-XXX-*.md`，读它拿接口编号/路径/参数；没有则从需求正文「涉及接口」推导，用例里标注「接口编号待补」

> ⚠️ 接口编号必须来自接口文档，不要自己编造。没有文档时该列留空并提示用户补。

### 步骤 3：生成测试用例

1. 读 `templates/测试用例.md`，替换占位符：
   - `{{date}}` → 当天日期
   - `{需求标题}` → 需求 title
   - `{REQ-XXX}` / `{slug}` → 实际 reqId / 标题拼音或英文 slug
   - `{模块名}` → 需求 module
   - `{reqNum}` → 需求数字编号
   - `{测试环境地址}` → 步骤2 取到的 testUrl
2. **基于需求实际内容填用例**：根据「涉及接口/数据模型/改动点」推导单接口用例（正常/必填缺失/类型错误/非法值/边界/业务校验）和组合用例，不凭空写通用占位行
3. 用 `Write` 写到 `<vaultPath>/<kbDir>/tests/REQ-{编号}-{slug}-用例.md`
4. 在需求文档「相关链接」段追加 `[[REQ-{编号}-{slug}-用例]]` 双链（可选）
5. `$CLI reload`
6. 回复用户：用例文件路径、用例条数、是否接口文档齐全

## 验证与交付

- 用例文件存在，用例编号格式 `API-{reqNum}-NNN`
- 用例里的接口路径/表名与需求「涉及接口/数据模型」对得上
- 回复含用例条数与接口文档齐全度

## 失败处理

- 接口文档缺失 → 该列标「接口编号待补」，不阻断生成，提示用户补
- 需求文件不存在 → 提示先「新建需求」，结束

## 不允许的情况

- ❌ 不读需求详情就生成通用用例
- ❌ 接口编号自行编造
- ❌ 用例里的接口路径/表名与需求正文「涉及接口/表」对不上
