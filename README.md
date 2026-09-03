# Software Dev OB · 需求全生命周期管理

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](.claude-plugin/plugin.json)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple.svg)](https://claude.ai/claude-code)

一个跑在 Claude Code 上的软件开发项目管理插件。通过 Obsidian 官方 CLI 操作本地 vault，把**需求 → 实现 → 测试 → 部署**整条链路串起来，需求文档、测试用例、测试报告、UI 原型都在一个 Obsidian 知识库里沉淀和检索。

一句话定位：**让 AI 写需求不凭空臆造，实现按调研结论落地，测试有据可查，全生命周期状态可追踪。**

## 为什么需要它

日常开发管理的几个痛点：

- 需求文档和代码两张皮——需求写完就扔，实现时没人回头看，做出来的东西和需求对不上
- 测试用例和需求脱节——用例编造接口编号，不来自真实代码，测了等于没测
- 状态全靠口头问——"那个需求到哪了？"没人答得清
- 多个仓库各搞各的——没有统一的地方沉淀需求 + 测试

这套插件做的事，就是把这些约束变成 Claude Code 会自动执行的步骤：动笔前先调研代码确认能落地，实现时照改动点逐项写，测试文档基于需求真实接口生成，状态流转写进 frontmatter 由 Dataview 看板自动呈现。

## 核心能力

| 命令 | 用途 |
|------|------|
| `/ob-init` | 初始化本仓库的 Obsidian 知识库，确认目录名、探测路径、建骨架、写 config |
| `/ob-new` | 新建需求。plan 模式 + code-investigator agent 调研代码确认可落地 + 提问 + 生成 |
| `/ob-impl` | 实现需求。读需求文档改动点清单逐项写代码，遵守仓库开发规范，流转到测试中 |
| `/ob-flow` | 流转状态或部署后更新。改 status 字段，看板自动同步；部署后填 deployed |
| `/ob-tc` | 按需求写测试用例。读需求取接口/表，生成基于真实内容的接口用例 |
| `/ob-tr` | 按需求写测试报告。基于用例执行结果填报告，统计通过率与 Bug 清单 |
| `/ob-up` | 上传文件进 vault。UI 原型（.html）进 ued/，测试文档（.md）进 tests/ |
| `/ob-q` | 查需求看板 / 查需求详情 / 查项目仪表盘 |

## 系统长什么样

```
用户 / Claude Code
    │
    ├── 8 个 ob-* skill 命令
    │
    ├── code-investigator agent（需求可落地性调研）
    │
    └── SessionStart hook（启动提示知识库状态）
            │
            ▼
    config.json（.software-dev-ob.config.json，写在当前工作目录；
                 cliPath / vaultPath / kbDir，init 探测写入，零硬编码）
            │
            ▼
    Obsidian vault 内的知识库 <kbDir>/
    ├── 00-需求/        需求文档 + Dataview 看板 + 仪表盘
    ├── tests/          测试用例 + 报告 + 索引
    ├── ued/            可交互 UI 原型（.html）
    └── 20-决策记录/     ADR
```

**关键设计**：所有机器路径（Obsidian CLI、vault 路径、vault 名）由 `/ob-init` 探测后写入当前工作目录的 `.software-dev-ob.config.json`，之后所有 skill 前置读取，skill 文件里零硬编码——换机器重跑 init 即可。config 跟当前工作目录走，每仓库各一份，不跟插件目录绑定。

## 快速开始

### 1. 前置条件

- [Claude Code](https://claude.ai/claude-code) 已安装
- [Obsidian](https://obsidian.ai/) 1.13+，并在设置 → 通用 → 高级 → 命令行界面里开启 CLI
- Obsidian 运行中（CLI 通过运行中的 app 操作 vault）
- 已有一个 Obsidian vault（首次用会在 init 时探测）

### 2. 通过 Marketplace 安装（推荐）

```bash
# 注册插件市场源
claude plugin marketplace add 805328895/software-dev-ob --scope user
# 安装插件
claude plugin install software-dev-ob-requirement@software-dev-ob-marketplace --scope user
```

> `--scope user` 装到用户级（所有仓库可用）；想只在某个项目用，把 `--scope user` 改成 `--scope project`，在该项目目录下执行。
>
> 无需额外依赖——SessionStart hook 只用 Python 标准库。

### 3. 本地安装（已下载到本地）

不想走 GitHub marketplace，代码已经在本地（clone 下来或直接拷贝的），有三种装法：

#### 方式 A：作为项目级 skill（推荐，只在一个项目用）

把插件目录放进目标项目的 `.claude/skills/`：

```bash
# 假设插件下载到 ~/Downloads/software-dev-ob，目标项目在 ~/code/my-project
cd ~/code/my-project
mkdir -p .claude/skills
cp -R ~/Downloads/software-dev-ob .claude/skills/software-dev-ob
```

在该项目根目录启动 Claude Code，`/ob-*` 命令即可用。config 跟当前工作目录走（`.software-dev-ob.config.json` 写在项目根），`/ob-init` 各跑各的。

#### 方式 B：作为用户级 skill（所有项目都用）

装到用户级 skills 目录，机器上所有项目都能识别：

```bash
mkdir -p ~/.claude/skills
cp -R ~/Downloads/software-dev-ob ~/.claude/skills/software-dev-ob
```

> config 跟**当前工作目录**走，不跟插件目录——用户级安装也能正常多项目各用各的 config，不会冲突。每个项目首次用跑一次 `/ob-init`，在项目根生成各自的 `.software-dev-ob.config.json`。

#### 方式 C：本地路径注册成 marketplace（功能最全，保留插件机制）

把本地路径当作 marketplace 源注册，再用 `claude plugin install` 装：

```bash
# 注册本地目录为 marketplace 源（路径指向已下载的插件根目录）
claude plugin marketplace add ~/Downloads/software-dev-ob --scope user
# 安装
claude plugin install software-dev-ob-requirement@software-dev-ob-marketplace --scope user
```

`marketplace add` 读本地 `.claude-plugin/marketplace.json`，和从 GitHub 注册效果一样，只是源是本地路径。装完用 `claude plugin list` 能看到已启用。

> 三种方式的命令都是 `/ob-init` `/ob-new` 等一致，区别只在装哪、作用范围多大。

### 4. 初始化知识库

在 Claude Code 里输入：

```
/ob-init
```

它会：
1. 探测本机 Obsidian CLI 路径、vault 路径
2. 对话框问你知识库目录名（推荐用仓库名）
3. 在 vault 内创建骨架（需求/测试/ued/决策记录 目录 + 模板 + 看板 + 仪表盘）
4. 写入 `config.json`（`.software-dev-ob.config.json`，写在当前工作目录/git 仓库根，每仓库独立，不进 git）

初始化后知识库结构：

```text
<kbDir>/
├── README.md
├── 00-需求/
│   ├── _templates/需求模板.md      ← 6 板块结构需求模板
│   ├── REQ-XXX-*.md                ← 需求文档
│   └── 需求看板.md                  ← Dataview 5列看板
├── 20-决策记录/                      ← ADR
├── ued/                            ← 可交互 UI 原型（.html，点击预览）
│   └── README.md                   ← dataviewjs 索引
├── tests/                          ← 接口测试用例与报告
│   ├── README.md                   ← dataviewjs 索引
│   └── _templates/                 ← 测试用例/报告骨架模板
└── 99-仪表盘.md                     ← Dataview 汇总统计
```

### 5. 开始用

```text
/ob-new 给订单列表加导出功能            # 调研代码 + 生成需求
/ob-flow REQ-001 评审中                # 流转状态
/ob-impl REQ-001                       # 按改动点写代码
/ob-tc REQ-001                         # 写测试用例
/ob-tr REQ-001                         # 写测试报告
/ob-q                                  # 查看板
/ob-up ui /path/to/proto.html         # 上传 UI 原型
```

### 6. 看板与仪表盘

打开 Obsidian：
- `<kbDir>/00-需求/需求看板.md` —— 按 status 分 5 列的需求看板
- `<kbDir>/99-仪表盘.md` —— 按模块/领域统计、最近完成列表
- `<kbDir>/tests/README.md` —— 测试文档索引
- `<kbDir>/ued/README.md` —— UI 原型索引

看板和仪表盘是 Dataview 渲染的，改需求 frontmatter 后自动同步。

## 需求全生命周期

```
需求创建 → 评审中 → 开发中 → 测试中 → 已完成
   /ob-new   /ob-flow  /ob-impl  /ob-tc /ob-tr  /ob-flow(部署后)
```

状态流转 = 改需求 frontmatter 的 `status` 字段，Dataview 看板自动归列，不用手拖卡片。

## 插件结构

```text
software-dev-ob/
├── .claude-plugin/plugin.json        插件元数据
├── skills/                            8 个独立 skill（带 frontmatter）
│   ├── ob-init/SKILL.md
│   ├── ob-new/SKILL.md               ← 调用 code-investigator agent
│   ├── ob-impl/SKILL.md
│   ├── ob-flow/SKILL.md
│   ├── ob-tc/SKILL.md
│   ├── ob-tr/SKILL.md
│   ├── ob-up/SKILL.md
│   └── ob-q/SKILL.md
├── agents/code-investigator.md       需求可落地性调研 agent
├── hooks/                            SessionStart 状态提示
│   ├── hooks.json
│   └── session_start.py
├── references/                        共享长约定（按需读，不内联）
│   ├── config-spec.md                config.json 字段 + 前置门禁
│   ├── dev-conventions.md            仓库开发规范
│   ├── frontmatter-spec.md           需求/测试 frontmatter 约定
│   └── status-flow.md                流转链路 + 状态含义
├── templates/                         骨架模板（init 写入 vault）
└── （无 config.json）
```

> 注：运行配置 `.software-dev-ob.config.json` 不在插件目录，在**当前工作目录**（git 仓库根），由 `/ob-init` 写入，每仓库各一份。插件目录只放 skill/agent/hook/references/templates。

## 命令速查

| 命令 | 示例 | 用途 |
|------|------|------|
| `/ob-init` | `/ob-init` | 初始化知识库 |
| `/ob-new` | `/ob-new 给活动加展示类型` | 新建需求 |
| `/ob-impl` | `/ob-impl REQ-001` | 实现需求 |
| `/ob-flow` | `/ob-flow REQ-001 开发中` | 流转状态 |
| `/ob-tc` | `/ob-tc REQ-001` | 写测试用例 |
| `/ob-tr` | `/ob-tr REQ-001` | 写测试报告 |
| `/ob-up` | `/ob-up ui proto.html` | 上传文件 |
| `/ob-q` | `/ob-q` | 查看板/需求/仪表盘 |

## 前置门禁

除 `/ob-init` 外，任何命令执行前必须读当前工作目录的 `.software-dev-ob.config.json` 取 `cliPath`/`vaultPath`/`kbDir`，任一为空就中断并提示先 `/ob-init`。没过门禁，新建/实现/流转/测试/上传/查询一律不执行。

## 排查问题

- 命令没触发 → 确认插件目录在 `.claude/skills/software-dev-ob/`，且子 skill 的 `SKILL.md` 有 frontmatter
- 门禁拦下 → 当前工作目录的 `.software-dev-ob.config.json` 缺字段或不存在，在项目根重跑 `/ob-init` 探测补全
- CLI 无响应 → Obsidian 没在运行，或 CLI 开关没开（设置 → 通用 → 高级 → 命令行界面）
- `property:set` 后读不到值 → CLI 索引未更新，每次 set 后执行 `$CLI reload`
- 看板不刷新 → Dataview 插件需已安装并启用

## 更新简介

| 版本 | 主要变化 |
|------|----------|
| v1.0.0 | 首版：8 个 ob-* skill + code-investigator agent + SessionStart hook + references 分离，路径零硬编码 |

## 开源协议

MIT
