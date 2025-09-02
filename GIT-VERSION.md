# Git自动版本管理系统

## 🎯 功能概述

基于Git提交时间自动生成版本号，格式为 `YYMMDDHHmmss`，实现完全自动化的版本管理。

## 📋 版本号格式

- **格式**: `1.YYMMDDHHmmss`
- **示例**: `1.250902111305` (2025年09月02日 11:13:05)
- **说明**: 主版本号固定为1，副版本号为Git提交时间戳

## 🔄 工作原理

### 1. **Git钩子触发**
- 每次Git提交后自动触发 `post-commit` 钩子
- 钩子调用版本管理脚本

### 2. **版本号生成**
- 读取最新Git提交的时间戳
- 格式化为 `YYMMDDHHmmss` 格式
- 如果无法获取Git时间，使用当前时间

### 3. **自动同步**
- 更新 `package.json` 版本号
- 更新 `service-worker.js` 缓存版本
- 更新 `pwa.js` 默认版本显示

## 🚀 使用方法

### **自动模式（推荐）**

```bash
# 正常的Git工作流程
git add .
git commit -m "更新功能"
# 版本号会自动更新！
```

### **手动触发**

```bash
# 手动运行版本管理
npm run git-version

# 或者直接运行脚本
node scripts/git-version-hook.js
```

## 📁 相关文件

| 文件 | 作用 | 更新方式 |
|------|------|----------|
| `.git/hooks/post-commit` | Git提交钩子 | 自动触发 |
| `scripts/git-version-hook.js` | 版本管理脚本 | 自动执行 |
| `package.json` | 版本号存储 | 脚本自动更新 |
| `service-worker.js` | 缓存版本控制 | 脚本自动更新 |
| `assets/js/pwa.js` | 版本显示 | 脚本自动更新 |

## ✨ 优势特性

- **🤖 完全自动化**: 无需手动操作，提交即更新
- **📅 时间戳版本**: 版本号直观反映提交时间
- **🔄 实时同步**: 所有相关文件同步更新
- **🛡️ 容错机制**: Git命令失败时使用当前时间
- **📱 PWA兼容**: 完美支持Service Worker缓存管理

## 🔧 配置说明

### **版本号格式自定义**

编辑 `scripts/git-version-hook.js` 中的 `formatDateToVersion` 函数：

```javascript
// 当前格式: YYMMDDHHmmss
function formatDateToVersion(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}
```

### **主版本号修改**

编辑 `updatePackageVersion` 函数中的版本号前缀：

```javascript
// 当前: 1.YYMMDDHHmmss
packageJson.version = `1.${version}`;

// 自定义: 2.YYMMDDHHmmss
packageJson.version = `2.${version}`;
```

## 🐛 故障排除

### **Git钩子未执行**

```bash
# 检查钩子文件权限
ls -la .git/hooks/post-commit

# 手动设置执行权限（Linux/Mac）
chmod +x .git/hooks/post-commit

# Windows设置权限
icacls ".git\hooks\post-commit" /grant Everyone:F
```

### **版本号未更新**

```bash
# 手动测试脚本
node scripts/git-version-hook.js

# 检查Git日志
git log -1 --format=%ct
```

### **Service Worker缓存问题**

- 清除浏览器缓存
- 检查开发者工具中的Application > Service Workers
- 确认新版本号已生效

## 📝 注意事项

1. **首次设置**: 确保Git钩子文件有执行权限
2. **时区问题**: 版本号基于本地时间生成
3. **并发提交**: 快速连续提交可能产生相同版本号
4. **备份重要**: 建议在重要发布前手动备份

## 🔄 迁移指南

### **从手动版本管理迁移**

1. 备份当前 `package.json`
2. 运行 `npm run git-version` 生成新版本号
3. 测试应用功能正常
4. 提交更改，验证自动版本管理

### **禁用自动版本管理**

```bash
# 删除或重命名Git钩子
mv .git/hooks/post-commit .git/hooks/post-commit.disabled

# 恢复手动版本管理
npm run update-version
```

## 🎉 总结

现在您的项目拥有了完全自动化的版本管理系统！每次Git提交都会自动生成基于时间戳的版本号，无需任何手动操作。版本号格式直观易懂，便于追踪和调试。