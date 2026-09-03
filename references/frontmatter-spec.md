# 需求/测试文档 frontmatter 字段约定

## 需求文档 frontmatter

每个需求笔记（`00-需求/REQ-XXX-*.md`）：

```yaml
type: requirement              # 固定，需求文档标识
reqId: REQ-XXX                  # 需求编号（REQ-001、REQ-002...）
title: 需求标题
status: 需求创建                 # 需求创建/评审中/开发中/测试中/已完成
module:                         # 关联项目模块（按仓库 CLAUDE.md 模块清单填）
domain:                         # 业务域（按项目实际领域填）
priority: P1                    # P1/P2/P3
owner:                          # 负责人
created: 2026-08-31             # YYYY-MM-DD（当天）
updated: 2026-08-31
deployed:                      # 部署到测试环境的日期（可选）
tags: []
```

- `status` 合法值见 `status-flow.md`
- 日期格式一律 `YYYY-MM-DD`
- 状态流转只改 `status` 字段，看板由 Dataview 自动生成，不手改看板文件

## 需求文档正文（6 板块结构）

参考 `templates/需求模板.md`，顺序固定：
1. 文档信息（reqId/title/module/priority/owner/状态）
2. 通用约定（错误码/响应格式/分页/时间/字段变更标记）
3. 数据字典（本需求涉及枚举）
4. 涉及接口（清单级：路径+变更类型+改动字段明细，不写完整出入参）
5. 数据模型（涉及表/表结构变更/ER关系）
6. 变更记录

> 完整出入参不写进需求文档，那是接口文档的职责。需求文档只列清单级 + 变更字段。

## 测试文档

测试用例/报告无固定 frontmatter 约束，但用例编号格式 `API-{reqNum}-NNN`（reqNum = 需求数字编号），组合用例 `COMBO-{reqNum}-NNN`。模板见 `templates/测试用例.md` / `templates/测试报告.md`。
