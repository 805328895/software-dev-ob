---
name: ob-init
description: 初始化本仓库的 Obsidian 知识库。对话框确认目录名、探测环境路径、创建骨架并写入 config.json。
---

# 初始化知识库（init）

## Use when

用户说"初始化知识库" / "obsidian init" / "init 知识库"，或某操作命中前置门禁被拦下后用户来 init。每个仓库首次使用时做一次。

## 环境变量

本 skill 是唯一**不需要**过门禁的操作（它本身负责创建 config.json）。但路径探测用环境变量，不写死：

```bash
CLI_DEFAULT="/Applications/Obsidian.app/Contents/MacOS/obsidian-cli"
VAULT_CFG="$HOME/Library/Application Support/obsidian/obsidian.json"
```

> config.json 字段定义详见 `{baseDir}/../../references/config-spec.md`。

## config 位置约定（重要）

config.json 跟**当前工作目录**走，每个仓库各一份，不跟插件目录：

- 文件名：`.software-dev-ob.config.json`（点开头，建议加进项目 `.gitignore`）
- 位置：git 仓库根（`git rev-parse --show-toplevel`）；非 git 项目就放当前工作目录（`pwd`）

> `{baseDir}` 仍指向插件目录，只用于读共享的 `references/` 和 `templates/`。运行配置（cliPath/vaultPath/kbDir）放当前仓库，多项目不串。

## 执行流程

### 步骤 1：检查前置 + 探测环境路径

1. 确认 Obsidian 正在运行（`pgrep -f "Obsidian.app"`），未运行则提示用户先打开 Obsidian，结束
2. 探测机器相关路径：

```bash
CLI_DEFAULT="/Applications/Obsidian.app/Contents/MacOS/obsidian-cli"
[ -x "$CLI_DEFAULT" ] && CLI_PATH="$CLI_DEFAULT"
# Vault 路径：Obsidian 配置里记录的 vault，多 vault 时步骤2顺带问用户
```

3. 定位当前工作目录的 config：先 `git rev-parse --show-toplevel` 取仓库根，无 git 则用 `pwd`；config 路径 = `<工作目录>/.software-dev-ob.config.json`。若已存在且 `kbDir` 非空 → 提示「已初始化，当前目录为 `<kbDir>`」，询问是否要初始化到别的目录。否 → 结束；是 → 进步骤 2

> 探测到的 cliPath/vaultPath/vaultName 若与现有 config 不同，init 时一并更新（换机器重跑 init 能修正路径）。

### 步骤 2：在对话框确认目录名 + 探测 pmProjectCode

用 Ask user（`ask_user` 能力）询问知识库目录名：
- 推荐选项放第一个（推荐），默认取当前 git 仓库根目录名（`git rev-parse --show-toplevel | xargs basename`）
- 再给 1-2 个备选
- 允许自由输入

> 目录名：纯目录名，不含路径分隔符，不含首尾 `/`。建议英文/拼音 + 连字符。
> 多 vault 时在此一并问用哪个。

同时探测 workspace-pm 项目代号（用于测试地址取值，可选）：

```bash
REPO=$(git rev-parse --show-toplevel)
PM_DIR="$HOME/.openclaw/workspace-pm/projects"
[ -d "$PM_DIR" ] || { echo "无 workspace-pm，pmProjectCode 留空"; }
for d in "$PM_DIR"/*/; do
  name=$(basename "$d")
  [ "$name" = "_TEMPLATE" ] && continue
  [ -f "$d/PROJECT.md" ] || continue
  grep -q "$REPO" "$d/PROJECT.md" 2>/dev/null && { echo "pmProjectCode=$name"; break; }
done
```

> 匹配依赖 PROJECT.md 里「本地代码路径」与实际仓库路径完全一致。匹配不到则 pmProjectCode 留空。

### 步骤 3：判断目录是否已存在，分流

检查 `<vaultPath>/<kbDir>/` 是否存在：

**情况 A：目录已存在**

- 提示「`<kbDir>/` 已存在，跳过创建初始化数据」
- 不覆盖、不重建任何文件
- 直接进步骤 4

**情况 B：目录不存在**

```bash
KB="<vaultPath>/<kbDir>"
mkdir -p "$KB/00-需求/_templates" "$KB/20-决策记录" "$KB/ued" "$KB/tests/_templates"
```

读取模板源（在 `{baseDir}/../../templates/`，即插件根的 `templates/`，与 Claude 版共享同一份），把 `{{kbDir}}` 替换为实际目录名、`{{date}}` 替换为当天日期，写入 vault：

| 模板文件 | 目标路径 |
|---------|---------|
| `templates/README.md` | `<kbDir>/README.md` |
| `templates/需求模板.md` | `<kbDir>/00-需求/_templates/需求模板.md` |
| `templates/需求看板.md` | `<kbDir>/00-需求/需求看板.md` |
| `templates/99-仪表盘.md` | `<kbDir>/99-仪表盘.md` |
| `templates/决策记录索引.md` | `<kbDir>/20-决策记录/README.md` |
| `templates/ued索引.md` | `<kbDir>/ued/README.md` |
| `templates/tests索引.md` | `<kbDir>/tests/README.md` |
| `templates/测试用例.md` | `<kbDir>/tests/_templates/测试用例模板.md` |
| `templates/测试报告.md` | `<kbDir>/tests/_templates/测试报告模板.md` |

执行 `$CLI reload` 让 Obsidian 识别新文件。

### 步骤 4：记录初始化目录

写入**当前工作目录**的 `.software-dev-ob.config.json`（git 仓库根；无 git 则 cwd）：

```json
{
  "cliPath": "<步骤1探测到的 cli 绝对路径>",
  "vaultPath": "<步骤1探测/步骤2确认的 vault 绝对路径>",
  "vaultName": "<vault 名称>",
  "kbDir": "<用户确认的目录名>",
  "pmProjectCode": "<步骤2探测到的项目代号，无则为空字符串>",
  "createdAt": "<当天日期>"
}
```

> 写完提示用户把 `.software-dev-ob.config.json` 加进项目 `.gitignore`（每仓库独立、含机器路径，不该进 git）。

## 验证与交付

- `<工作目录>/.software-dev-ob.config.json` 存在且 cliPath/vaultPath/kbDir 非空
- `<vaultPath>/<kbDir>/` 存在
- 若是新建：`00-需求/需求看板.md`、`99-仪表盘.md`、`tests/README.md` 等骨架文件存在
- 回复用户：目录名、vault 绝对路径、新建还是跳过、可开始「新建需求」

## 失败处理（最小回滚）

- 目录创建失败 → 删除已建的部分目录，提示重跑
- 模板写入失败 → 只补缺失文件，不全量重建
- config.json 写失败 → 提示手动补 config（流程已建好骨架）

## 不允许的情况

- ❌ 不经对话框确认就自行假设目录名
- ❌ 目录已存在时仍覆盖现有文件
- ❌ 不写 `config.json` 就结束
