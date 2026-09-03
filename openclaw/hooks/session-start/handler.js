// software-dev-ob 启动提示 handler（OpenClaw internal hook）
// 事件：agent:bootstrap —— 会话组装 bootstrap 时触发，context 含 workspaceDir。
// 逻辑与 Claude Code 版 hooks/session_start.py 对齐：
//   读当前工作目录的 .software-dev-ob.config.json → 校验 kbDir/vaultPath
//   → 统计 00-需求/REQ-*.md → 把状态行加进 bootstrapFiles（带入会话上下文）。
//
// 关键点：
// - config 跟当前工作目录走（git 仓库根 .software-dev-ob.config.json），不跟插件目录。
//   handler 跑在 Gateway 进程，不能用 process.cwd()，用 event.context.workspaceDir 定位。
// - agent:bootstrap 的 event.messages 不路由为聊天回复（被忽略），
//   正确做法是往 event.context.bootstrapFiles 里加一个文件记录，作为会话上下文带入。
//   （文档：bootstrapFiles 可变，元素有 name/path/missing/可选 content）
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 在指定工作目录及其祖先链找 .software-dev-ob.config.json
// （优先 workspaceDir；非 git 项目可能就在 workspaceDir 本身）
function findConfig(startDir) {
  if (!startDir) return null;
  let cur = startDir;
  for (let i = 0; i < 20 && cur && cur !== "/"; i++) {
    const p = join(cur, ".software-dev-ob.config.json");
    if (existsSync(p)) return p;
    cur = dirname(cur);
  }
  return null;
}

function tryReadConfig(configPath) {
  if (!configPath) {
    return { _missing: true, msg: "[software-dev-ob] 知识库未初始化，可用 /ob-init" };
  }
  try {
    return { cfg: JSON.parse(readFileSync(configPath, "utf-8")) };
  } catch {
    return { _missing: true, msg: "[software-dev-ob] config 读取失败，可用 /ob-init 重新初始化" };
  }
}

function countRequirements(kbFull) {
  const reqDir = join(kbFull, "00-需求");
  if (!existsSync(reqDir)) return [];
  try {
    return readdirSync(reqDir)
      .filter((n) => n.startsWith("REQ-") && n.endsWith(".md"))
      .filter((n) => {
        try {
          return statSync(join(reqDir, n)).isFile();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}

export default function handler(event) {
  // 只在 agent:bootstrap 时动作
  if (event.type !== "agent" || event.action !== "bootstrap") return;

  const ctx = event.context || {};
  const workspaceDir = ctx.workspaceDir;
  const configPath = findConfig(workspaceDir);

  const { cfg, _missing, msg } = tryReadConfig(configPath);
  if (_missing) {
    // 无 config：静默（不污染每个无 config 的 workspace 的会话）
    // 用户在该项目 /ob-init 后，下次 bootstrap 才出提示
    return;
  }

  const kbDir = cfg.kbDir || "";
  const vaultPath = cfg.vaultPath || "";
  if (!kbDir || !vaultPath) return;

  const kbFull = join(vaultPath, kbDir);
  if (!existsSync(kbFull) || !statSync(kbFull).isDirectory()) return;

  const reqs = countRequirements(kbFull);
  const latest = reqs.length ? reqs.sort().slice(-1)[0] : "无";
  const line = `[software-dev-ob] 知识库 ${kbDir} · 需求 ${reqs.length} 篇 · 最近 ${latest}`;

  // agent:bootstrap 的 context.bootstrapFiles 是可变数组，
  // 加一个内存内的 bootstrap 记录把状态行带入会话上下文（不落盘）。
  const files = (ctx.bootstrapFiles = Array.isArray(ctx.bootstrapFiles) ? ctx.bootstrapFiles : []);
  files.push({ name: "software-dev-ob-status", content: line });
}
