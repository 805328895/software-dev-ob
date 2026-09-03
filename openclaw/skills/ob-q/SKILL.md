---
name: ob-q
description: 查需求看板、查需求详情、查项目仪表盘。看板是 Dataview 渲染的，CLI 无法直接渲染，可提示打开或用 CLI 查询替代。
---

# 查需求看板 / 查需求 / 查仪表盘

## Use when

- 用户说"查需求看板" / "需求看板"
- 用户说"查需求 REQ-XXX" / "查需求 {标题}"
- 用户说"项目仪表盘" / "查仪表盘"
- 用户说"搜需求 {关键词}"

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

## 执行流程

### 场景 A：查需求看板

看板是 Dataview 渲染的，CLI 无法直接渲染。两种方式：
- 提示用户在 Obsidian 打开 `<kbDir>/00-需求/需求看板.md`
- 或用 CLI 查询需求列表替代看板：

```bash
# 列出所有需求及其状态（按状态分组，近似看板）
$CLI properties sort=count | grep -A1 status
# 或按状态查
$CLI search query="status: 开发中" path="<kbDir>/00-需求" limit=20
```

### 场景 B：查需求详情

```bash
$CLI read file="REQ-001-..."
```

或用文件读取读 `<vaultPath>/<kbDir>/00-需求/REQ-001-*.md`。

### 场景 C：查项目仪表盘

提示用户在 Obsidian 打开 `<kbDir>/99-仪表盘.md`（Dataview 自动统计）。

### 场景 D：全文搜需求

```bash
$CLI search query="<关键词>" path="<kbDir>/00-需求" limit=10
# 查某需求测试文档
$CLI search query="REQ-001" path="<kbDir>/tests" limit=20
```

### 辅助：反链与任务

```bash
# 看某需求反链（谁引用了它）
$CLI backlinks file="REQ-001-..." counts
# 列出未完成任务（改动点 checkbox）
$CLI tasks todo verbose
```

## 验证与交付

- 查询有结果返回（无结果说明文件名/关键词不对）
- 提示用户打开的 .md 文件路径正确

## 失败处理

- CLI 查询报错 → 提示 reload 后重试（property 操作后索引未更新）
- 文件找不到 → 列出 `00-需求/` 下所有 REQ 文件供用户选

## 不允许的情况

- ❌ 手动改看板/仪表盘文件（Dataview 自动生成）
- ❌ 不读 config 直接假设 kbDir
