---
name: ob-flow
description: 流转需求状态或部署后更新。改 frontmatter 的 status 字段，看板自动同步；部署后填 deployed 日期并流转到已完成。
---

# 流转需求状态 / 部署后更新

## Use when

- 用户说"流转需求 REQ-XXX 到 {状态}" / "把 REQ-XXX 改成开发中"
- deploy-test 完成后用户说"部署完了，更新 REQ-XXX"

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

> 状态流转链路与含义详见 `{baseDir}/../../references/status-flow.md`。

## 执行流程

### 场景 A：流转状态

改 frontmatter 的 `status` 字段（合法值见 `references/status-flow.md`），看板自动归列：

```bash
$CLI property:set file="REQ-XXX-..." name="status" value="开发中" type=text
$CLI property:set file="REQ-XXX-..." name="updated" value="<当天日期>" type=text
# ⚠️ property:set 后必须 reload 刷新索引，property:read 才能读到新值
$CLI reload
```

> `property:set` 写入后 CLI 索引未即时更新，每次 `property:set` 后执行 `$CLI reload` 再读取。

### 场景 B：部署后更新

deploy-test 完成后，流转到「已完成」并填部署日期：

```bash
$CLI property:set file="REQ-XXX-..." name="status" value="已完成" type=text
$CLI property:set file="REQ-XXX-..." name="deployed" value="<当天日期>" type=text
$CLI property:set file="REQ-XXX-..." name="updated" value="<当天日期>" type=text
$CLI reload
```

## 验证与交付

- `$CLI reload` 后 `property:read` 能读到新 status
- 看板对应列出现该需求

## 失败处理

- property:set 报错 → 检查文件名是否匹配，reload 后重试
- 状态值非法 → 提示合法值（见 `references/status-flow.md`）

## 不允许的情况

- ❌ 手动改看板文件（Dataview 自动生成，只改 status 字段）
- ❌ property:set 后不 reload
- ❌ deployed 日期格式非 YYYY-MM-DD
