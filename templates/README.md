# {{kbDir}} 项目知识库

用 Obsidian 管理本项目的**需求全生命周期**。架构/领域/规范等参考内容以仓库内 `CLAUDE.md` 和 `.mdc` 文件为准，不在 vault 重复维护。

## 一、插件清单

| 插件 | 作者 | 状态 | 作用 |
|------|------|------|------|
| **Dataview** | blacksmithgu | ✅ 已装 | 看板/仪表盘的引擎，从 frontmatter 自动生成视图（**本 vault 核心**） |
| **Templater** | SilentVoid13 | ✅ 已装 | 新建需求时套用模板、自动填日期 |
| **DB Folder** | RafaelGB | 可选 | 类 Notion 表格，需求矩阵、可追溯表 |
| **Excalidraw** | Zsolt Viczián | 可选 | 画模块依赖图、接口流程图 |
| **Git** | Vinzent03 | 推荐 | 对 vault 做 git 版本管理，需求流转有历史记录 |

> 不依赖 Kanban 插件。状态流转靠改 frontmatter 的 `status` 字段，Dataview 看板自动同步，无需手动拖卡片。

## 二、目录结构

```
{{kbDir}}/                ← vault 内知识库根目录
├── README.md            ← 本文件
├── 00-需求/
│   ├── _templates/需求模板.md  ← 新建需求套用模板
│   ├── REQ-XXX-*.md          ← 需求文档（每个需求一篇）
│   └── 需求看板.md            ← Dataview 自动看板（按 status 分5列）
├── 20-决策记录/          ← ADR 架构决策记录
├── ued/                  ← 可交互 UI 原型（.html 文件，点击预览）
│   └── README.md        ← 原型索引（自动列出 HTML）
└── 99-仪表盘.md          ← Dataview 汇总统计
```

> 知识库只存 vault 一份，未接 git。装 **Git** 插件可做版本备份。

## 三、需求流转链路

状态流转 = 改 frontmatter 的 `status` 字段，看板/仪表盘自动同步：

```
需求创建 → 评审中 → 开发中 → 测试中 → 已完成
```

| 状态 | 含义 | 触发动作 |
|------|------|---------|
| 需求创建 | 刚提需求 | 调研代码确认可落地，生成需求文档 |
| 评审中 | 确认范围/方案 | 补充涉及接口/表 |
| 开发中 | 写代码 | 记录改动点 |
| 测试中 | 部署测试环境验证 | 填验证结果 |
| 已完成 | 验证通过 | 填部署日期 |

## 四、如何新建一个需求

新建需求不直接写文档，先确保能落地。流程：

1. **切 plan 模式**，只读调研
2. **对照本地代码调研**：涉及哪个模块、哪些接口、哪些表/字段、是否触犯架构规则、改动范围
3. **有疑问就提问**：需求歧义、字段映射不明、方案分叉、范围不清，都用提问确认，不自行拍板
4. **确认可落地后生成需求**：用 `需求模板` 建文档，frontmatter 填 reqId/title/status/module/domain/owner，正文填调研到的真实接口/表/改动点
5. 打开 `需求看板.md` 或 `99-仪表盘.md`，自动看到新需求

> 也可直接跟 Claude 说"新建需求：xxx"，它按 `.claude/skills/software-dev-ob/` 的流程走完调研和提问再生成。

流转时**只改 `status` 字段**，看板自动归到对应列。

## 五、看板与仪表盘

- [[需求看板]] —— 按状态分组的看板
- [[99-仪表盘]] —— 按模块/领域统计、近期完成列表

## 六、字段约定（frontmatter）

```yaml
type: requirement        # 固定，需求文档标识
reqId: REQ-001           # 需求编号（REQ-001、REQ-002...）
title: 需求标题
status: 需求创建          # 需求创建/评审中/开发中/测试中/已完成
module:                  # 关联项目模块（按仓库 CLAUDE.md 模块清单填）
domain:                 # 业务域（按项目实际领域填）
priority: P1            # P1/P2/P3
owner:                  # 负责人
created: {{date}}       # YYYY-MM-DD
updated: {{date}}
deployed:               # 部署到测试环境的日期（可选）
tags: []
```
