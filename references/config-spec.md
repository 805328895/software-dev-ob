# config 字段约定

`.software-dev-ob.config.json` 由 `ob-init` 写入，放在**当前工作目录**（git 仓库根；非 git 项目用 `pwd`），每个仓库各一份。所有 skill 操作前置读取。机器相关路径探测写入，换机器重跑 init 即更新。

> config 跟当前工作目录走，**不跟插件目录绑定**。这样多项目各一份，互不串。建议把 `.software-dev-ob.config.json` 加进项目 `.gitignore`（含机器路径，不该进 git）。

```json
{
  "cliPath": "<obsidian-cli 绝对路径>",
  "vaultPath": "<vault 绝对路径>",
  "vaultName": "<vault 名称，唯一 vault 时可省略 vault= 参数>",
  "kbDir": "<vault 内的项目知识库目录名>",
  "pmProjectCode": "<workspace-pm 项目代号（可选，用于测试地址取值）>",
  "createdAt": "<init 日期>"
}
```

| 字段 | 说明 | 取值 |
|------|------|------|
| `cliPath` | Obsidian CLI 绝对路径 | init 探测，默认 `/Applications/Obsidian.app/Contents/MacOS/obsidian-cli` |
| `vaultPath` | vault 绝对路径 | init 探测，从 Obsidian 配置读 |
| `vaultName` | vault 名称 | init 探测，唯一 vault 可省略 |
| `kbDir` | vault 内相对目录名（不含根路径，不含首尾 `/`） | init 对话框确认，默认取 git 仓库名 |
| `pmProjectCode` | workspace-pm 项目代号，可选 | init 探测，匹配不到则空字符串 |
| `createdAt` | init 日期 | YYYY-MM-DD |

## config 定位方式

各 skill 执行时定位当前工作目录的 config：

1. `git rev-parse --show-toplevel` 取仓库根；无 git 用 `pwd`/`os.getcwd()`
2. config 路径 = `<工作目录>/.software-dev-ob.config.json`
3. SessionStart hook 从 cwd 起向上回溯查找（非 git 场景）；git 仓库根优先

## 前置校验（门禁）

除 `ob-init` 外，任何 skill 执行前必须：
1. 读当前工作目录的 `.software-dev-ob.config.json`，取 `cliPath` / `vaultPath` / `kbDir`
2. 任一为空 → 中断，提示「知识库未初始化，请先 `/ob-init`」
3. 校验 `<vaultPath>/<kbDir>/` 存在；不存在提示重新 init

> 知识库绝对路径 = `<vaultPath>/<kbDir>`。CLI 变量 `$CLI` = `cliPath`。
