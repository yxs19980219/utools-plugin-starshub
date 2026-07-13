# AGENTS.md

## GitHub 发布流程

### 1. 提交代码
```bash
git add -A && git commit -m "feat: xxx" && git push
```

### 2. 打 tag 触发自动构建
```bash
git tag v1.x.0 && git push origin v1.x.0
```
推送 tag 后 GitHub Actions 自动：安装依赖 -> tsc + vite build -> 创建干净打包目录 -> 打包 zip -> 上传到 Release。

### 3. 用 gh CLI 创建 Release 描述
```bash
# 创建 RELEASE_NOTES.md（写入本次版本的详细描述）
# 然后执行：
gh release create v1.x.0 --title "StarsHub v1.x.0" --notes-file RELEASE_NOTES.md
# 上传完后删除临时文件
rm RELEASE_NOTES.md
```

如果 tag 已推送且 Actions 已自动创建了 Release（带 auto notes），则改用 edit：
```bash
gh release edit v1.x.0 --notes-file RELEASE_NOTES.md
rm RELEASE_NOTES.md
```

### 4. 查看构建状态
```bash
gh run list --limit 3
```

### 注意事项
- RELEASE_NOTES.md 是临时文件，每次发布时创建，上传完删除，不提交到仓库
- tag 格式：v主版本.次版本.修订号（如 v1.0.0）
- Actions 自动打包的 zip 包含 plugin.json + preload.js + logo.png + dist/，用户下载解压后导入 uTools 开发者工具即可
