---
name: ob-up
description: 上传文件进 vault。上传 UI 原型（.html）到 ued/ 或上传测试用例（.md）到 tests/，拷贝不移动，同名询问。
---

# 上传 UI 原型 / 上传测试用例

## Use when

- 用户说"上传 UI xxx.html" / "上传原型 xxx.html"
- 用户说"上传测试用例 xxx.md" / "上传用例 xxx.md"

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

### 场景 A：上传 UI 原型

把本地已有 HTML 原型搬进 vault 的 `ued/`，让 Obsidian 点击预览、索引页自动列出。不是生成新原型，是搬运。

#### 步骤 1：确认源文件

1. 从用户输入拿源文件路径
2. 校验：源文件存在、扩展名是 `.html`（非 HTML 提示「ued 只收 .html」，让用户确认是否仍要传）
3. 用户没给路径 → 用 Ask user（`ask_user` 能力）让用户提供

#### 步骤 2：搬进 vault

1. 目标目录 `<vaultPath>/<kbDir>/ued/`（不存在则 `mkdir -p`）
2. 拷贝（保留原件，不移动）：

```bash
cp "<源路径>" "<vaultPath>/<kbDir>/ued/"
```

3. 同名文件已存在 → 用 Ask user：覆盖 / 重命名 / 跳过，**不擅自覆盖**
4. `$CLI reload` 让 `ued/README.md`（dataviewjs）刷新

#### 步骤 3：回复用户

- 文件已放入 `<kbDir>/ued/<文件名>`
- 打开 `ued/README.md` 可见索引，点击 HTML 直接预览
- 可在需求文档「相关链接」追加 `[[ued/文件名]]` 双链（可选）

### 场景 B：上传测试用例

把本地已有测试文档搬进 vault 的 `tests/`（**不放 `_templates/`**，那是骨架模板目录）。不是新生成，是搬运外部已有的。

#### 步骤 1：确认源文件

1. 从用户输入拿源文件路径
2. 校验：源文件存在、扩展名是 `.md`
3. 用户没给路径 → 用 Ask user 让用户提供

#### 步骤 2：搬进 vault

1. 目标目录 `<vaultPath>/<kbDir>/tests/`（**不放 `_templates/`**）
2. 拷贝：

```bash
cp "<源路径>" "<vaultPath>/<kbDir>/tests/"
```

3. 同名文件已存在 → 用 Ask user：覆盖 / 重命名 / 跳过，不擅自覆盖
4. `$CLI reload` 让 `tests/README.md`（dataviewjs）刷新

#### 步骤 3：回复用户

- 文件已放入 `<kbDir>/tests/<文件名>`
- 打开 `tests/README.md` 可见索引
- 可在对应需求「相关链接」追加 `[[tests/文件名]]` 双链（可选）

## 验证与交付

- 目标文件存在于正确目录（UI 在 ued/，测试在 tests/ 根而非 _templates/）
- 索引页 reload 后能列出
- 原件仍存在（用的是 cp 不是 mv）

## 失败处理

- 源文件不存在 → 提示路径有误，让用户重新提供
- 拷贝权限失败 → 提示目标目录权限，检查 vaultPath

## 不允许的情况

- ❌ 源文件不存在或类型不符时不校验就传
- ❌ 同名文件直接覆盖不问
- ❌ 移动（mv）原文件而非拷贝（cp）—— 保留原件
- ❌ 测试用例放进 `_templates/`（那是骨架模板目录，实际文档放 `tests/` 根）
