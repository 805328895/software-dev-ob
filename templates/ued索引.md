# UI 原型（UED）

> 存放可交互的 UI 原型（`.html` 文件）。在 Obsidian 文件树点击 HTML 文件即可直接预览，支持点击/输入/跳转。
> 把 `.html` 原型文件放入本目录后，下方列表自动刷新。

```dataviewjs
const folder = dv.current().file.folder;
const files = app.vault.getFiles()
  .filter(f => f.path.startsWith(folder + "/") && f.extension === "html")
  .sort((a, b) => a.name.localeCompare(b.name));
if (files.length === 0) {
  dv.paragraph("（暂无原型，把 `.html` 文件放入 `ued/` 目录后刷新本页）");
} else {
  dv.table(["原型文件", "路径"], files.map(f => [`[${f.basename}](${f.path})`, f.path]));
}
```
