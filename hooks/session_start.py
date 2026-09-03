#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Obsidian skill SessionStart hook。
会话启动时读当前工作目录的 .software-dev-ob.config.json，打印当前知识库初始化状态与需求数。
config 跟当前工作目录走（git 仓库根），每仓库各一份，不跟插件目录绑定。
"""

import json
import os
import sys
import glob
import subprocess


def find_config_path():
    """从当前工作目录起，向上查找 .software-dev-ob.config.json。

    优先 git 仓库根（git rev-parse --show-toplevel）；非 git 项目向上回溯若干层。
    """
    cwd = os.getcwd()
    # 1. 优先 git 仓库根
    try:
        top = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd, capture_output=True, text=True, timeout=3,
        ).stdout.strip()
        if top:
            p = os.path.join(top, ".software-dev-ob.config.json")
            if os.path.exists(p):
                return p
            # git 仓库根没 config，就在仓库根标记「未初始化」
            return None
    except Exception:
        pass
    # 2. 非 git：从 cwd 向上回溯找 config
    cur = cwd
    for _ in range(20):
        p = os.path.join(cur, ".software-dev-ob.config.json")
        if os.path.exists(p):
            return p
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return None


def main():
    config_path = find_config_path()
    if not config_path:
        # 当前工作目录无 config：静默（不污染每个未初始化项目的会话）
        # 在该项目 /ob-init 后，下次会话才出提示
        return
    if not os.path.exists(config_path):
        return

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception:
        print("[software-dev-ob] config 读取失败，可用 /ob-init 重新初始化")
        return

    kb_dir = cfg.get("kbDir", "")
    vault_path = cfg.get("vaultPath", "")
    if not kb_dir or not vault_path:
        print("[software-dev-ob] 知识库未初始化，可用 /ob-init")
        return

    kb_full = os.path.join(vault_path, kb_dir)
    if not os.path.isdir(kb_full):
        print(f"[software-dev-ob] 目录缺失：{kb_full}，请核对 /ob-init")
        return

    # 统计需求数
    req_pattern = os.path.join(kb_full, "00-需求", "REQ-*.md")
    req_files = [p for p in glob.glob(req_pattern) if "_templates" not in p]
    req_count = len(req_files)

    # 最近一条需求（按文件名排序取最后一个）
    latest = os.path.basename(req_files[-1]) if req_files else "无"

    print(f"[software-dev-ob] 知识库 {kb_dir} · 需求 {req_count} 篇 · 最近 {latest}")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # hook 失败不阻塞会话
        pass
    sys.exit(0)
