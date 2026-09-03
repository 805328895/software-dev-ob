# 接口测试

> 存放按需求生成的接口测试用例与测试报告。
> - 测试用例模板：[[_templates/测试用例模板]]
> - 测试报告模板：[[_templates/测试报告模板]]
>
> 为某个需求生成测试文档后，下方列表自动刷新（`_templates/` 下的模板不计入）。

```dataviewjs
const folder = dv.current().file.folder;
const files = app.vault.getFiles()
  .filter(f => f.path.startsWith(folder + "/") && !f.path.includes("/_templates/") && f.extension === "md")
  .sort((a, b) => a.name.localeCompare(b.name));
if (files.length === 0) {
  dv.paragraph("（暂无测试文档。对某个需求执行「按需求写测试用例 / 测试报告」后刷新本页）");
} else {
  dv.table(["文件", "路径"], files.map(f => [`[[${f.basename}]]`, f.path]));
}
```
