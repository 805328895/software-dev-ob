---
name: ob-tr
description: 按需求写测试报告。前提是已有测试用例文档，基于用例执行结果填报告，统计通过率与 Bug 清单，给出上线结论。
---

# 按需求写测试报告

## Use when

用户说"为 REQ-XXX 写测试报告" / "出测试报告"。

## 前置校验

1. 定位当前工作目录的 config：`git rev-parse --show-toplevel` 取仓库根（无 git 用 `pwd`），读 `<工作目录>/.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在

## 前提

该需求**已有测试用例文档**（步骤1会校验，没有则提示先写用例）。

## 环境变量

```bash
CLI=<config.json cliPath>
KB=<vaultPath>/<kbDir>
```

> frontmatter 约定详见 `{baseDir}/../../references/frontmatter-spec.md`。

## 引用加载策略

- 用例文档：读 `<vaultPath>/<kbDir>/tests/REQ-XXX-{slug}-用例.md`
- 报告模板：`{baseDir}/../../templates/测试报告.md`（与 Claude 版共享）
- 测试环境：同 ob-tc 步骤2，从 workspace-pm PROJECT.md 取

## 执行流程

### 步骤 1：读测试用例

1. 找到 `<vaultPath>/<kbDir>/tests/REQ-XXX-{slug}-用例.md`，读全部用例（单接口 + 组合）
2. 若用例文件不存在 → 提示先「按需求写测试用例」，结束

### 步骤 2：取测试环境信息

同 ob-tc 步骤2，取 testUrl、数据库、分支版本等。

### 步骤 3：生成测试报告

1. 读 `templates/测试报告.md`，替换占位符（`{{date}}`/`{需求标题}`/`{REQ-XXX}`/`{slug}`/`{reqNum}`/`{测试环境地址}`）
2. **基于用例执行结果填报告**：
   - 遍历用例填「实际出参」「结果」列（实际执行过填真实结果，未执行标 ⏸️ 跳过并备注原因）
   - 统计用例总数/通过/失败/阻塞/跳过/通过率
   - 失败用例转入「Bug 清单」
   - 填「数据一致性」检查结果、「风险评估」，「结论」是否可上线
3. 写到 `<vaultPath>/<kbDir>/tests/REQ-{编号}-{slug}-测试报告.md`
4. `$CLI reload`
5. 回复用户：报告路径、通过率、是否可上线、阻塞 Bug 清单

## 验证与交付

- 报告文件存在
- 通过率/Bug 数量与明细表对得上
- 「结论」与阻塞项一致

## 失败处理

- 用例文件不存在 → 提示先写用例，结束
- 用例未执行 → 报告里全标跳过，结论「不可上线：待执行」，不编造通过

## 不允许的情况

- ❌ 没有用例文件就生成报告
- ❌ 用例没实际执行就全标「✅ 通过」
- ❌ 通过率/Bug 统计与明细表对不上
